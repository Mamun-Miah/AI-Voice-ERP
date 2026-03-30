import { Type } from 'class-transformer';
import {
  IsString,
  IsNumber,
  IsOptional,
  IsPositive,
  Min,
  IsNotEmpty,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SaleItemInputDto {
  @ApiProperty({ example: 'clx1234itemid' })
  @IsString()
  @IsNotEmpty()
  itemId: string;

  @ApiPropertyOptional({ example: 'clx1234batchid' })
  @IsOptional()
  @IsString()
  batchId?: string;

  @ApiPropertyOptional({ example: 'Rice (1kg)' })
  @IsOptional()
  @IsString()
  itemName?: string;

  @ApiProperty({ example: 3 })
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  quantity: number;

  @ApiProperty({ example: 100 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  unitPrice: number;

  @ApiPropertyOptional({ example: 5 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  discount?: number;
}
