import { IsString, IsNotEmpty, Matches } from 'class-validator';
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
    example: '+8801234567890',
    description: 'User phone number',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\+?[0-9]{10,15}$/, {
    message: 'Invalid phone number',
  })
  phone: string;

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
}
