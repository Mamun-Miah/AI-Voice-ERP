import { Controller, Body, Post, UseGuards, Res, Get } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterUserDto } from './dto/register-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { RequestOtpDto, VerifyOtpDto } from './dto/otp.dto';
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

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user and business' })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  signup(@Body() dto: RegisterUserDto) {
    return this.authService.signup(dto);
  }

  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // Limit to 5 requests per minute
  @Post('request-otp')
  @ApiOperation({ summary: 'Request OTP for login' })
  @ApiResponse({ status: 200, description: 'OTP sent successfully' })
  @ApiResponse({ status: 400, description: 'User not found' })
  async requestOtp(@Body() dto: RequestOtpDto) {
    // Changed from dto.uuid to dto.phone
    return this.authService.requestOtp(dto.phone);
  }

  @Post('verify-otp')
  @ApiOperation({ summary: 'Verify OTP (for signup verification)' })
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
        maxAge: 7 * 24 * 3600000, // 7 days (matching service expiry)
      });
    }

    return result;
  }

  @Post('login')
  @ApiOperation({ summary: 'Login a user using Phone and OTP' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async signin(
    @Body() dto: LoginUserDto,
    @Res({ passthrough: true }) response: express.Response,
  ) {
    // Service method renamed to signinWithOtp
    // Service returns 'business', not 'businessInfo'
    const { accessToken, user, business } =
      await this.authService.signinWithOtp(dto);

    response.cookie('Authentication', accessToken, {
      ...AUTH_COOKIE_OPTIONS,
      maxAge: 7 * 24 * 3600000, // 7 days
    });

    return { success: true, user, business };
  }

  @UseGuards(JwtAuthGuard)
  @Get('status')
  @ApiOperation({ summary: 'Get user status' })
  @ApiResponse({
    status: 200,
    description: 'User status retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getStatus(@GetUser() user: JwtUser) {
    // Simply return the user attached to the request by the Guard
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

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @ApiOperation({ summary: 'Logout a user' })
  @ApiResponse({ status: 200, description: 'Logout successful' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  logout(@Res({ passthrough: true }) response: express.Response) {
    response.clearCookie('Authentication', {
      ...AUTH_COOKIE_OPTIONS,
    });
    return { success: true, message: 'Logout successful' };
  }
}
