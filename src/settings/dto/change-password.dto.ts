import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordDto {
  @ApiProperty({ example: 'oldpass123' })
  @IsString()
  currentPassword: string;

  @ApiProperty({ example: 'newpass456' })
  @IsString()
  @MinLength(6)
  newPassword: string;
}
