import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum PurchaseRefundMethod {
  CASH = 'cash',
  BANK = 'bank',
  DEBIT_NOTE = 'debit_note',
  REPLACEMENT = 'replacement',
}

export class PurchaseReturnItemInputDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  purchaseItemId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  itemId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  itemName: string;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  quantity: number;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  unitCost: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reason?: string;
}

export class CreatePurchaseReturnDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  purchaseId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  supplierId?: string;

  @ApiProperty({ type: [PurchaseReturnItemInputDto] })
  @IsArray()
  @IsNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => PurchaseReturnItemInputDto)
  items: PurchaseReturnItemInputDto[];

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  discount?: number;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  tax?: number;

  @ApiPropertyOptional({ example: 'damaged' })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiProperty({ enum: PurchaseRefundMethod })
  @IsEnum(PurchaseRefundMethod)
  refundMethod: PurchaseRefundMethod;

  @ApiPropertyOptional({ example: 'accountId123' })
  @IsOptional()
  @IsString()
  accountId?: string; // Required if refundMethod is cash or bank

  @ApiPropertyOptional({ example: 'Refund notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}
