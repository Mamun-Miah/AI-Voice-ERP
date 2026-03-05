import { IsNumber, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class StockAdjustmentDto {
  @ApiProperty({
    example: 10,
    description: 'Positive to add stock, negative to reduce',
  })
  @Type(() => Number)
  @IsNumber()
  stockAdjustment: number;

  @ApiPropertyOptional({ example: 'Manual adjustment' })
  @IsOptional()
  @IsString()
  adjustmentReason?: string;
}
