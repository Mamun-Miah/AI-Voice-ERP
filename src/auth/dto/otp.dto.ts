import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RequestOtpDto {
  @ApiProperty({ example: '+880171234567', description: 'User phone number' })
  @IsString()
  @IsNotEmpty()
  phone: string;
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
