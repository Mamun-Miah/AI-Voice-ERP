import { IsString, IsNumber, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class StockTransferDto {
  @ApiProperty({ example: 'branch_123' })
  @IsString()
  fromBranchId: string;

  @ApiProperty({ example: 'branch_456' })
  @IsString()
  toBranchId: string;

  @ApiProperty({ example: 'item_123' })
  @IsString()
  itemId: string;

  @ApiProperty({ example: 10 })
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  quantity: number;

  @ApiPropertyOptional({ example: 'Transfer to new branch' })
  @IsOptional()
  @IsString()
  notes?: string;
}
