import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginUserDto {
  @ApiProperty({
    example: '+8801234567890',
    description: 'User phone number',
  })
  @IsString()
  @IsNotEmpty()
  phone: string;
}
