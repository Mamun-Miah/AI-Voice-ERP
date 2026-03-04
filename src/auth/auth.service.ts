/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  InternalServerErrorException,
  HttpException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuthProvider } from '@prisma/client';
import { JwtService } from '@nestjs/jwt';
import { MailerService } from '@nestjs-modules/mailer';
import * as bcrypt from 'bcryptjs';
import { randomInt } from 'crypto';
import { RegisterUserDto } from './dto/register-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import type { JwtUser } from './types/jwt-user.type';
export const roundsOfHashing = 12;

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private mailService: MailerService,
    @InjectPinoLogger(AuthService.name)
    private readonly logger: PinoLogger,
  ) {}
  //Find user by email
  private async findUserByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }
  //Find user by uuid
  private async findUserByUuid(uuid: string) {
    return this.prisma.user.findUnique({
      where: { uuid },
    });
  }

  // SIGNUP)
  async signup(dto: RegisterUserDto) {
    const existingUser = await this.findUserByEmail(dto.email);

    if (existingUser) {
      this.logger.warn({ email: dto.email }, 'Signup failed: Email exists');
      throw new BadRequestException('Email already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, roundsOfHashing);

    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        provider: AuthProvider.EMAIL,
        passwordHash,
      },
    });
    this.logger.info({ userId: user.id }, 'User registered');
    const { passwordHash: _, ...result } = user;
    return {
      success: true,
      message: 'User registered successfully',
      data: result,
    };
  }

  /**
   * Send OTP to Email
   */
  async sendOtp(uuid: string) {
    const otp = randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + 5 * 60000); // 5 mins expiry
    //find user by uuid
    const user = await this.findUserByUuid(uuid);
    if (!user) {
      throw new BadRequestException('User not found');
    }
    //if user verified, no need to send OTP
    if (user.isEmailVerified) {
      this.logger.info({ uuid }, 'OTP request ignored: Email already verified');
      return {
        success: true,
        message: 'Email is already verified',
      };
    }
    const email = user.email;

    //Store OTP in database
    await this.prisma.otp.upsert({
      where: { email },
      update: { code: otp, expiresAt, createdAt: new Date() },
      create: { email, code: otp, expiresAt },
    });

    //Send Email dsg
    await this.mailService.sendMail({
      to: email,
      subject: 'Your Verification Code',
      html: `<h3>Your OTP is: <b>${otp}</b></h3><p>Valid for 5 minutes.</p><br><p>From Amrastha Team</p>`,
    });

    this.logger.info({ email }, 'OTP sent successfully');
    return {
      success: true,
      message: 'OTP sent to email',
    };
  }

  async verifyOtp(uuid: string, code: string) {
    //find user by uuid
    const user = await this.findUserByUuid(uuid);
    if (!user) {
      this.logger.warn({ uuid }, 'OTP verification failed: User not found');
      throw new BadRequestException('User not found');
    }
    if (user.isEmailVerified) {
      this.logger.info({ uuid }, 'OTP request ignored: Email already verified');
      return {
        success: true,
        message: 'Email is already verified',
      };
    }
    //find otp record
    const email = user.email;
    const otpRecord = await this.prisma.otp.findUnique({ where: { email } });

    if (
      !otpRecord ||
      otpRecord.code !== code ||
      otpRecord.expiresAt < new Date()
    ) {
      this.logger.warn({ email }, 'Invalid or expired OTP attempt');
      throw new BadRequestException('Invalid or expired code');
    }
    await this.prisma.user.update({
      where: { email },
      data: { isEmailVerified: true },
    });
    // Delete OTP after successful use (Single use)
    await this.prisma.otp.delete({ where: { email } });

    this.logger.info({ email }, 'OTP verified successfully');
    const payload = {
      email: user.email,
      uuid: user.uuid,
      phone: user.phone,
      username: user.name,
      isEmailVerified: user.isEmailVerified,
    };
    const accessToken = this.jwtService.sign(payload);
    return {
      accessToken,
      success: true,
      message: 'Email verified successfully',
    };
  }
  // SIGNIN
  async signin(dto: LoginUserDto) {
    const user = await this.findUserByEmail(dto.email);

    if (!user || !user.passwordHash) {
      // Security log: User not found
      this.logger.warn({ email: dto.email }, 'Login failed: User not found');
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      this.logger.warn(
        { userId: user.id, email: user.email },
        'Login failed: Invalid password',
      );
      throw new UnauthorizedException('Invalid credentials');
    }

    let accessToken: string | null = null;
    if (user.isEmailVerified) {
      const payload = {
        email: user.email,
        uuid: user.uuid,
        phone: user.phone,
        username: user.name,
        isEmailVerified: user.isEmailVerified,
      };
      accessToken = this.jwtService.sign(payload);
      this.logger.info({ userId: user.id }, 'User logged in successfully');
    } else {
      this.logger.warn(
        { userId: user.id },
        'Login successful but email not verified',
      );
    }
    const businessInfo = await this.prisma.businessInfo.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        businessName: true,
        businessLogoUrl: true,
        businessEmail: true,
        businessPhone: true,
      },
    });

    return {
      accessToken,
      success: true,
      message: user.isEmailVerified ? 'Login successful' : 'Email not verified',
      user: {
        id: user.id,
        uuid: user.uuid,
        name: user.name,
        email: user.email,
        isEmailVerified: user.isEmailVerified,
      },
      businessInfo: businessInfo,
    };
  }
  async status(user: JwtUser) {
    const userId = user.id;
    const userData = await this.prisma.businessInfo.findMany({
      where: { userId: userId },
      select: {
        id: true,
        businessName: true,
        businessLogoUrl: true,
      },
    });

    return {
      success: true,
      loggedIn: true,
      user: user,
      businessInfo: userData,
    };
  }
}
