import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResendOtpDto {
  @ApiProperty({
    example: 'cmmbtdajk0001mwfbrdl1uapv',
    description: 'User UUID',
  })
  @IsString()
  @IsNotEmpty()
  uuid: string;
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
