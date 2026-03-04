import { IsNotEmpty, IsString, IsUUID, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RequestOtpDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Unique order or session UUID',
  })
  @IsNotEmpty()
  @IsUUID()
  uuid: string;
}

export class VerifyOtpDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Unique order or session UUID',
  })
  @IsNotEmpty()
  @IsUUID()
  uuid: string;

  @ApiProperty({
    example: '123456',
    description: '6 digit OTP code',
    minLength: 6,
    maxLength: 6,
  })
  @IsString()
  @Length(6, 6)
  code: string;
}
