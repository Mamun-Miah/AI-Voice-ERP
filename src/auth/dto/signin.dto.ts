import { IsString, IsNotEmpty, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SigninDto {
  @ApiProperty({ example: '+8801234567890' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({
    example: 'StrongPass@123',
    description: 'Account password (min 8 characters)',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  password: string;
}

export class VerifySigninOtpDto {
  @ApiProperty({ example: 'clx1234userid' })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @IsNotEmpty()
  code: string;
}
