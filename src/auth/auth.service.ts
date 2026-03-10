import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { randomInt } from 'crypto';
import { RegisterUserDto } from './dto/register-user.dto';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

export const roundsOfHashing = 12;

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    @InjectPinoLogger(AuthService.name)
    private readonly logger: PinoLogger,
  ) {}

  // ─── Private Helpers ──────────────────────────────────────────────────────

  private async findUserByPhone(phone: string) {
    return this.prisma.user.findUnique({ where: { phone } });
  }

  private async findUserById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  private buildTokenPayload(user: {
    id: string;
    phone: string;
    name: string | null;
    role: string;
    businessId: string;
  }) {
    return {
      sub: user.id,
      phone: user.phone,
      username: user.name,
      role: user.role,
      businessId: user.businessId,
    };
  }

  private async fetchBusinessInfo(businessId: string) {
    return this.prisma.business.findUnique({
      where: { id: businessId },
      select: { id: true, name: true, logo: true, currency: true },
    });
  }

  // ─── 1. SIGNUP ────────────────────────────────────────────────────────────
  // POST /auth/signup
  // Body: { name, phone, businessName, businessType }
  // Example: { "name": "John Doe", "phone": "1234567890", "businessName": "Acme Corp", "businessType": "retail" }
  // Response: { userId, otp } → use to call POST /auth/verify-otp
  async signup(dto: RegisterUserDto) {
    // 1. Guard: phone must be unique
    const existingUser = await this.findUserByPhone(dto.phone);
    if (existingUser) {
      this.logger.warn(
        { phone: dto.phone },
        'Signup failed: phone already exists',
      );
      throw new BadRequestException(
        'Phone already registered. Please sign in.',
      );
    }

    // 2. Resolve BusinessType
    const businessType = await this.prisma.businessType.findUnique({
      where: { value: dto.businessType },
    });
    if (!businessType) {
      throw new BadRequestException(
        `Unknown business type: "${dto.businessType}"`,
      );
    }

    // 3. Create Business + User atomically
    const { business, user } = await this.prisma.$transaction(async (tx) => {
      const business = await tx.business.create({
        data: {
          name: dto.businessName,
          type: dto.businessType,
          businessTypeId: businessType.id,
        },
      });
      //create branch id
      const branch = await tx.branch.create({
        data: {
          name: 'Main Branch',
          businessId: business.id,
          isMain: true,
        },
      });
      const user = await tx.user.create({
        data: {
          name: dto.name,
          branchId: branch.id,
          phone: dto.phone,
          businessId: business.id,
          provider: 'PHONE',
          isPhoneVerified: false,
          role: 'owner',
        },
      });

      return { business, user, branch };
    });

    // 4. Generate + hash OTP
    const rawOtp = randomInt(100000, 999999).toString();
    const hashedOtp = await bcrypt.hash(rawOtp, roundsOfHashing);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // 5. Invalidate stale OTPs, save new one
    await this.prisma.otp.updateMany({
      where: { phone: dto.phone, verified: false },
      data: { verified: true },
    });

    await this.prisma.otp.create({
      data: {
        phone: dto.phone,
        businessId: business.id,
        code: hashedOtp,
        purpose: 'signup',
        expiresAt,
      },
    });

    this.logger.info(
      { userId: user.id, businessId: business.id },
      'Signup successful — OTP generated',
    );

    // ⚠️ In production: send rawOtp via SMS, remove from response
    return {
      success: true,
      message:
        'Registration successful. Please verify your phone with the OTP.',
      data: {
        userId: user.id,
        otp: rawOtp,
      },
    };
  }

  // ─── 2. VERIFY OTP (after signup only) ────────────────────────────────────
  // POST /auth/verify-otp
  // Body: { userId, otp }
  // Response: { accessToken, user, business }
  async verifyOtp(userId: string, code: string) {
    const user = await this.findUserById(userId);
    if (!user) {
      throw new BadRequestException('User not found.');
    }
    if (user.isPhoneVerified) {
      throw new BadRequestException('Phone already verified. Please sign in.');
    }

    // Find latest valid OTP
    const otpRecord = await this.prisma.otp.findFirst({
      where: {
        phone: user.phone,
        verified: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otpRecord) {
      throw new UnauthorizedException('OTP not found or has expired.');
    }

    // Verify code against hash
    const isValid = await bcrypt.compare(code, otpRecord.code);
    if (!isValid) {
      await this.prisma.otp.update({
        where: { id: otpRecord.id },
        data: { attempts: { increment: 1 } },
      });
      throw new UnauthorizedException('Incorrect OTP.');
    }

    // Mark OTP as used + mark phone as verified atomically
    await this.prisma.$transaction([
      this.prisma.otp.update({
        where: { id: otpRecord.id },
        data: { verified: true },
      }),
      this.prisma.user.update({
        where: { id: user.id },
        data: { isPhoneVerified: true },
      }),
    ]);

    // Issue token
    const accessToken = this.jwtService.sign(this.buildTokenPayload(user), {
      expiresIn: '7d',
    });

    const business = await this.fetchBusinessInfo(user.businessId);

    this.logger.info({ userId: user.id }, 'Phone verified — token issued');

    return {
      success: true,
      message: 'Phone verified successfully.',
      accessToken,
      user: {
        id: user.id,
        branchId: user.branchId,
        name: user.name,
        phone: user.phone,
        role: user.role,
      },
      business,
    };
  }

  // ─── 3. SIGNIN ────────────────────────────────────────────────────────────
  // POST /auth/signin
  // Body: { "phone": "01XXXXXXXXX" }
  // Finds the user, sends an OTP to their phone, returns userId + message.
  // The client must call POST /auth/signin/verify with userId + code to get a token.
  async signin(phone: string) {
    const user = await this.findUserByPhone(phone);

    if (!user) {
      throw new NotFoundException('User not found. Please sign up first.');
    }
    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated.');
    }
    if (!user.isPhoneVerified) {
      throw new UnauthorizedException(
        'Phone not verified. Please complete signup verification first.',
      );
    }

    // Generate and hash a 6-digit OTP
    const rawCode = Math.floor(100_000 + Math.random() * 900_000).toString();
    const hashedCode = await bcrypt.hash(rawCode, 10);

    const expiresAt = new Date(Date.now() + 10 * 60 * 1_000); // 10 minutes

    // Invalidate any previous unused OTPs for this phone, then create a fresh one
    await this.prisma.$transaction([
      this.prisma.otp.updateMany({
        where: { phone: user.phone, verified: false },
        data: { verified: true }, // expire old ones
      }),
      this.prisma.otp.create({
        data: {
          phone: user.phone,
          code: hashedCode,
          expiresAt,
          verified: false,
          attempts: 0,
        },
      }),
    ]);

    // Send OTP via SMS
    // await this.smsService.send(
    //   user.phone,
    //   `Your SmartStore login OTP is: ${rawCode}. Valid for 10 minutes.`,
    // );

    this.logger.info({ userId: user.id, phone: user.phone }, 'Signin OTP sent');

    return {
      success: true,
      message: 'OTP sent to your registered phone number.',
      userId: user.id,
    };
  }

  // ─── 4. VERIFY SIGNIN OTP ─────────────────────────────────────────────────
  // POST /auth/signin/verify
  // Body: { "userId": "...", "code": "123456" }
  // Verifies the OTP and issues a JWT access token.
  async verifySigninOtp(userId: string, code: string) {
    const user = await this.findUserById(userId);

    if (!user) {
      throw new BadRequestException('User not found.');
    }
    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated.');
    }

    // Find the latest valid OTP for this phone
    const otpRecord = await this.prisma.otp.findFirst({
      where: {
        phone: user.phone,
        verified: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otpRecord) {
      throw new UnauthorizedException('OTP not found or has expired.');
    }

    // Verify code against hash
    const isValid = await bcrypt.compare(code, otpRecord.code);

    if (!isValid) {
      await this.prisma.otp.update({
        where: { id: otpRecord.id },
        data: { attempts: { increment: 1 } },
      });
      throw new UnauthorizedException('Incorrect OTP.');
    }

    // Mark OTP as used
    await this.prisma.otp.update({
      where: { id: otpRecord.id },
      data: { verified: true },
    });

    // Issue JWT
    const accessToken = this.jwtService.sign(this.buildTokenPayload(user), {
      expiresIn: '7d',
    });

    const business = await this.fetchBusinessInfo(user.businessId);

    this.logger.info({ userId: user.id }, 'Signin OTP verified — token issued');

    return {
      success: true,
      message: 'Signed in successfully.',
      accessToken,
      user: {
        id: user.id,
        branchId: user.branchId,
        name: user.name,
        phone: user.phone,
        role: user.role,
      },
      business,
    };
  }

  // ─── RESEND OTP ────────────────────────────────────────────────────────────
  // POST /auth/resend-otp
  // Body: { uuid: userId }
  // Throttled: max 3 resends per 10 minutes
  async resendOtp(userId: string) {
    const user = await this.findUserById(userId);
    if (!user) {
      throw new BadRequestException('User not found.');
    }
    if (user.isPhoneVerified) {
      throw new BadRequestException('Phone already verified. Please sign in.');
    }

    // Check if a valid OTP already exists and was created less than 1 minute ago
    const recentOtp = await this.prisma.otp.findFirst({
      where: {
        phone: user.phone,
        verified: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (recentOtp) {
      const createdAt = recentOtp.createdAt.getTime();
      const now = Date.now();
      const secondsSinceCreated = (now - createdAt) / 1000;

      // Must wait 60 seconds before requesting a new OTP
      if (secondsSinceCreated < 60) {
        const waitSeconds = Math.ceil(60 - secondsSinceCreated);
        throw new BadRequestException(
          `Please wait ${waitSeconds} seconds before requesting a new OTP.`,
        );
      }
    }

    // Invalidate old OTPs
    await this.prisma.otp.updateMany({
      where: { phone: user.phone, verified: false },
      data: { verified: true },
    });

    // Generate + hash new OTP
    const rawOtp = randomInt(100000, 999999).toString();
    const hashedOtp = await bcrypt.hash(rawOtp, roundsOfHashing);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await this.prisma.otp.upsert({
      where: { phone: user.phone },
      update: {
        code: hashedOtp,
        verified: false,
        expiresAt,
        createdAt: new Date(),
      },
      create: {
        phone: user.phone,
        businessId: user.businessId,
        code: hashedOtp,
        purpose: 'signup',
        expiresAt,
      },
    });

    this.logger.info({ userId: user.id }, 'OTP resent');

    // In production: send rawOtp via SMS, remove from response
    return {
      success: true,
      message: 'OTP resent successfully.',
      data: {
        userId: user.id,
        otp: rawOtp,
      },
    };
  }

  async getBusinessTypes() {
    const types = await this.prisma.businessType.findMany({
      select: {
        id: true,
        value: true,
        labelEn: true,
        labelBn: true,
        isActive: true,
      },
      where: {
        isActive: true, // optional: only active types
      },
    });

    return {
      success: true,
      data: types,
    };
  }
}
