import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginUserDto {
  @ApiProperty({
    example: 'user@gmail.com',
    description: 'User email address',
  })
  @IsEmail()
  email: string;
  @ApiProperty({
    example: '1234567890',
    description: 'User phone number',
  })
  @IsString()
  phone: string;
  @ApiProperty({
    example: '123456',
    description: 'One-time password sent to the user',
  })
  @IsString()
  otp: string;
  @ApiProperty({
    example: '123456',
    description: 'User password (minimum 6 characters)',
    minLength: 6,
  })
  @IsString()
  @MinLength(6)
  password: string;
}
