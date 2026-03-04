import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  // InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
// import { AuthProvider } from '@prisma/client';
import { JwtService } from '@nestjs/jwt';
// import { MailerService } from '@nestjs-modules/mailer';
import * as bcrypt from 'bcryptjs';
import { randomInt } from 'crypto';
import { RegisterUserDto } from './dto/register-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

export const roundsOfHashing = 12;

export enum AuthProviderType {
  EMAIL = 'EMAIL',
  GOOGLE = 'GOOGLE',
  GITHUB = 'GITHUB',
  PHONE = 'PHONE',
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    // private mailService: MailerService,
    @InjectPinoLogger(AuthService.name)
    private readonly logger: PinoLogger,
  ) {}

  // Helper: Find user by phone
  private async findUserByPhone(phone: string) {
    return this.prisma.user.findUnique({
      where: { phone },
    });
  }

  // Helper: Find user by uuid
  private async findUserByUuid(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  // 1. SIGNUP
  // Creates Business, User, and sends OTP
  async signup(dto: RegisterUserDto) {
    const existingUser = await this.findUserByPhone(dto.phone);

    if (existingUser) {
      this.logger.warn({ phone: dto.phone }, 'Signup failed: Phone exists');
      throw new BadRequestException('Phone already exists');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Create Business
      const business = await tx.business.create({
        data: {
          name: dto.businessName,
          businessTypeId: dto.businessType, // Linking BusinessType
          // Set defaults or nulls for other required fields if necessary
        },
      });

      // 2. Create User
      const user = await tx.user.create({
        data: {
          name: dto.name,
          phone: dto.phone,
          businessId: business.id,
          provider: AuthProviderType.PHONE,
          role: 'owner', // Signup user is the owner
          isPhoneVerified: false,
        },
      });

      return user;
    });

    this.logger.info({ userId: result.id }, 'User and Business registered');

    // 3. Send OTP for verification
    await this.createAndSendOtp(result.phone, result.businessId);

    return {
      success: true,
      message: 'Registration successful. Please verify your phone.',
      data: { id: result.id, phone: result.phone },
    };
  }

  // 2. REQUEST OTP (For Signin or Resend)
  // Finds user by phone and sends OTP
  async requestOtp(phone: string) {
    const user = await this.findUserByPhone(phone);

    // Security: Don't reveal if user exists or not explicitly, but usually needed for UX
    if (!user) {
      throw new BadRequestException('User not found. Please signup first.');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('User account is deactivated.');
    }

    await this.createAndSendOtp(user.phone, user.businessId);

    return {
      success: true,
      message: 'OTP sent successfully.',
    };
  }

  // Helper: Create OTP in DB and Send
  private async createAndSendOtp(
    phone: string,
    businessId: string,
    // email?: string | null,
  ) {
    const otp = randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + 5 * 60000); // 5 mins

    // Hash OTP before saving to DB for security
    // const hashedOtp = await bcrypt.hash(otp, roundsOfHashing);

    // Invalidate previous OTPs for this phone
    await this.prisma.otp.updateMany({
      where: { phone, verified: false },
      data: { verified: true }, // Mark old ones as used
    });

    // Create new OTP record
    await this.prisma.otp.create({
      data: {
        phone,
        code: otp, // Storing hashed code
        expiresAt,
        businessId,
        purpose: 'login',
      },
    });

    // Send Email (Fallback/Simulation)
    // if (email) {
    //   try {
    //     await this.mailService.sendMail({
    //       to: email,
    //       subject: 'Your Verification Code',
    //       html: `<h3>Your OTP is: <b>${otp}</b></h3><p>Valid for 5 minutes.</p>`,
    //     });
    //     this.logger.info({ email }, 'OTP sent via email');
    //   } catch (error: unknown) {
    //     this.logger.error({ error }, 'Failed to send OTP email');
    //   }
    // }

    // TODO: Integrate actual SMS Gateway here
    this.logger.info({ phone, otp }, `OTP generated for ${phone}`);
  }

  // 3. VERIFY OTP (Used for both Signup verification and Signin)
  async verifyOtp(id: string, code: string) {
    const user = await this.findUserByUuid(id);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    const payload = await this.validateOtpAndGenerateToken(user.phone, code);

    // If this was a signup verification, update user status
    if (!user.isPhoneVerified) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { isPhoneVerified: true },
      });
    }

    return {
      ...payload,
      message: 'Phone verified successfully',
    };
  }

  // 4. SIGNIN (Verify OTP and Login)
  async signinWithOtp(dto: LoginUserDto) {
    const { phone, otp } = dto;
    return this.validateOtpAndGenerateToken(phone, otp);
  }

  // Core Logic: Validate OTP and Generate JWT
  private async validateOtpAndGenerateToken(phone: string, code: string) {
    // 1. Find valid OTP record
    const otpRecord = await this.prisma.otp.findFirst({
      where: {
        phone,
        verified: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otpRecord) {
      throw new UnauthorizedException('Invalid or expired OTP');
    }

    // 2. Verify OTP code (compare hashed code)
    const isOtpValid = await bcrypt.compare(code, otpRecord.code);

    if (!isOtpValid) {
      // Increment attempts on failure
      await this.prisma.otp.update({
        where: { id: otpRecord.id },
        data: { attempts: { increment: 1 } },
      });
      throw new UnauthorizedException('Invalid OTP');
    }

    // 3. Mark OTP as used
    await this.prisma.otp.update({
      where: { id: otpRecord.id },
      data: { verified: true },
    });

    // 4. Find User
    const user = await this.findUserByPhone(phone);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    // 5. Generate JWT
    const payload = {
      sub: user.id,
      phone: user.phone,
      username: user.name,
      isPhoneVerified: true,
      role: user.role,
      businessId: user.businessId,
    };

    const accessToken = this.jwtService.sign(payload, { expiresIn: '7d' });

    // 6. Fetch Business Info
    const businessInfo = await this.prisma.business.findUnique({
      where: { id: user.businessId },
      select: {
        id: true,
        name: true,
        logo: true,
        currency: true,
      },
    });

    return {
      accessToken,
      success: true,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        role: user.role,
      },
      business: businessInfo,
    };
  }
}
