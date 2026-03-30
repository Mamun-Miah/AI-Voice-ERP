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

export enum RefundMethod {
  CASH = 'cash',
  BANK = 'bank',
  BKASH = 'bkash',
  CREDIT_NOTE = 'credit_note',
  EXCHANGE = 'exchange',
}

export class ReturnItemInputDto {
  @ApiProperty({ example: 'clx123saleitemid' })
  @IsString()
  @IsNotEmpty()
  saleItemId: string;

  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  quantity: number;

  @ApiPropertyOptional({ example: 'Defective product' })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class CreateSaleReturnDto {
  @ApiProperty({ example: 'clx123saleid' })
  @IsString()
  @IsNotEmpty()
  saleId: string;

  @ApiProperty({ type: [ReturnItemInputDto] })
  @IsArray()
  @IsNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => ReturnItemInputDto)
  items: ReturnItemInputDto[];

  @ApiPropertyOptional({ example: 'Customer not satisfied' })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ enum: RefundMethod })
  @IsOptional()
  @IsEnum(RefundMethod)
  refundMethod?: RefundMethod;

  @ApiPropertyOptional({ example: 'clx123accountid' })
  @IsOptional()
  @IsString()
  accountId?: string;
}
