import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Electronics' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: 'ইলেকট্রনিক্স' })
  @IsOptional()
  @IsString()
  nameBn?: string;

  @ApiPropertyOptional({ example: 'Electronic items and accessories' })
  @IsOptional()
  @IsString()
  description?: string;
}
