import { IsString, IsNotEmpty, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum OtpPurpose {
  SIGNUP = 'signup',
  SIGNIN = 'signin',
}

export class ResendOtpDto {
  @ApiProperty({ example: 'clx1234userid' })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ enum: OtpPurpose, example: OtpPurpose.SIGNIN })
  @IsEnum(OtpPurpose)
  purpose: OtpPurpose;
}

export class VerifyOtpDto {
  @ApiProperty({
    example: 'clx...',
    description: 'User ID (from signup response)',
  })
  @IsString()
  @IsNotEmpty()
  uuid: string;

  @ApiProperty({ example: '123456', description: 'OTP Code' })
  @IsString()
  @IsNotEmpty()
  code: string;
}
