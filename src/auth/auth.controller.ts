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
// import { VerifiedGuard } from './guards/verified.guard';
@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register') //register api
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  signup(@Body() dto: RegisterUserDto) {
    return this.authService.signup(dto);
  }

  @Post('login') //login api
  @ApiOperation({ summary: 'Login a user' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async signin(
    @Body() dto: LoginUserDto,
    @Res({ passthrough: true }) response: express.Response,
  ) {
    const { accessToken, user, message, businessInfo } =
      await this.authService.signin(dto);

    response.cookie('Authentication', accessToken, {
      ...AUTH_COOKIE_OPTIONS,
      maxAge: 3600000, // 1 hour
    });

    return { success: true, message, user, businessInfo };
  }

  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 100, ttl: 60000 } })
  @Post('request-otp') //otp request api
  @ApiOperation({ summary: 'Request OTP for email verification' })
  @ApiResponse({ status: 200, description: 'OTP sent successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async requestOtp(@Body() dto: RequestOtpDto) {
    return this.authService.sendOtp(dto.uuid);
  }

  @Post('verify-otp') //verify otp
  @ApiOperation({ summary: 'Verify OTP for email verification' })
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
        maxAge: 3600000,
      });
    }

    return result;
  }
  @UseGuards(JwtAuthGuard)
  // @UseGuards(VerifiedGuard)
  @Get('status') // status api
  @ApiOperation({ summary: 'Get user status' })
  @ApiResponse({
    status: 200,
    description: 'User status retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getStatus(@GetUser() user: JwtUser) {
    return this.authService.status(user);
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
