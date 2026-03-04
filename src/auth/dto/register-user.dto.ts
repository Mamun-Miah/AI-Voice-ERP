import {
  IsString,
  IsEmail,
  IsNotEmpty,
  MinLength,
  Matches,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterUserDto {
  @ApiProperty({
    example: 'John Doe',
    description: 'User name',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: 'user@gmail.com',
    description: 'User email address',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    example: '1234567890',
    description: 'User phone number',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\+?[0-9]{10,15}$/, {
    message: 'Invalid phone number',
  })
  phone: string;

  @ApiProperty({
    example: 'retail',
    description: 'Business type of the user',
  })
  @IsString()
  @IsNotEmpty()
  businessId: string;
  @ApiProperty({
    example: 'Acme Corp',
    description: "Name of the user's business",
  })
  @IsString()
  @IsNotEmpty()
  businessName: string;

  @ApiProperty({
    example: 'retail',
    description: 'Business type of the user',
  })
  @IsString()
  @IsNotEmpty()
  businessType: string;

  @ApiProperty({
    example: '123456',
    description: 'User password (minimum 6 characters)',
    minLength: 6,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;
}
