import { Controller, Body, Post, UseGuards, Res, Get } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterUserDto } from './dto/register-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { VerifyOtpDto, ResendOtpDto } from './dto/otp.dto';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import express, { CookieOptions } from 'express';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { GetUser } from './decorators/get-user.decorator';
import type { JwtUser } from './types/jwt-user.type';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

const AUTH_COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: 'none',
  partitioned: true,
  path: '/',
};

const COOKIE_MAX_AGE = 7 * 24 * 3600000; // 7 days

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // POST /auth/register
  // Body: { name, phone, businessName, businessType }
  @Post('register')
  @ApiOperation({ summary: 'Register a new user and business' })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  signup(@Body() dto: RegisterUserDto) {
    return this.authService.signup(dto);
  }

  // POST /auth/verify-otp
  // Body: { uuid: userId, code: otp }
  @Post('verify-otp')
  @ApiOperation({ summary: 'Verify OTP after signup' })
  @ApiResponse({ status: 200, description: 'OTP verified successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async verifyOtp(
    @Body() dto: VerifyOtpDto,
    @Res({ passthrough: true }) response: express.Response,
  ) {
    const result = await this.authService.verifyOtp(dto.uuid, dto.code);

    if (result.accessToken) {
      response.cookie('Authentication', result.accessToken, {
        ...AUTH_COOKIE_OPTIONS,
        maxAge: COOKIE_MAX_AGE,
      });
    }

    return result;
  }

  // POST /auth/resend-otp
  // Body: { uuid: userId }
  // Throttle: 3 requests per 10 minutes
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 30, ttl: 600000 } }) // 3 per 10 minutes
  @Post('resend-otp')
  @ApiOperation({ summary: 'Resend OTP (max 3 times per 10 minutes)' })
  @ApiResponse({ status: 200, description: 'OTP resent successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async resendOtp(@Body() dto: ResendOtpDto) {
    return this.authService.resendOtp(dto.uuid);
  }

  // POST /auth/login
  // Body: { phone }
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 per minute
  @Post('login')
  @ApiOperation({ summary: 'Login with phone number' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async signin(
    @Body() dto: LoginUserDto,
    @Res({ passthrough: true }) response: express.Response,
  ) {
    const result = await this.authService.signin(dto.phone);

    response.cookie('Authentication', result.accessToken, {
      ...AUTH_COOKIE_OPTIONS,
      maxAge: COOKIE_MAX_AGE,
    });

    return result;
  }

  // GET /auth/status
  @UseGuards(JwtAuthGuard)
  @Get('status')
  @ApiOperation({ summary: 'Get current user status' })
  @ApiResponse({ status: 200, description: 'User status retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getStatus(@GetUser() user: JwtUser) {
    return {
      success: true,
      user: {
        id: user.id,
        phone: user.phone,
        role: user.role,
        businessId: user.businessId,
      },
    };
  }

  // POST /auth/logout
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @ApiOperation({ summary: 'Logout current user' })
  @ApiResponse({ status: 200, description: 'Logout successful' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  logout(@Res({ passthrough: true }) response: express.Response) {
    response.clearCookie('Authentication', AUTH_COOKIE_OPTIONS);
    return { success: true, message: 'Logout successful' };
  }
}
