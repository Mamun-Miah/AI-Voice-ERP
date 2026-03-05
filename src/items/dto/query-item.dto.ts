import {
  IsOptional,
  IsString,
  IsNumberString,
  IsBooleanString,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryItemDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  branchId?: string;

  @ApiPropertyOptional({
    description: 'Search by name, nameBn, sku, or barcode',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter items where currentStock <= minStock',
  })
  @IsOptional()
  @IsBooleanString()
  lowStock?: string;

  @ApiPropertyOptional({ default: '1' })
  @IsOptional()
  @IsNumberString()
  page?: string = '1';

  @ApiPropertyOptional({ default: '50' })
  @IsOptional()
  @IsNumberString()
  limit?: string = '50';
}
