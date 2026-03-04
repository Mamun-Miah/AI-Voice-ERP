import {
  IsString,
  IsInt,
  IsOptional,
  Min,
  Max,
  MinLength,
  MaxLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
export class UpdateSellerProfileDto {
  @ApiProperty({ description: 'Name of the seller', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ description: 'Age of the seller', required: false })
  @IsInt()
  @IsOptional()
  @Min(0)
  @Max(3)
  age?: number;

  @ApiProperty({ description: 'Phone number of the seller', required: false })
  @IsString()
  @IsOptional()
  @MinLength(11)
  @MaxLength(15)
  phone?: string;

  @ApiProperty({ description: 'Address of the seller', required: false })
  @IsString()
  @IsOptional()
  address?: string;
}
