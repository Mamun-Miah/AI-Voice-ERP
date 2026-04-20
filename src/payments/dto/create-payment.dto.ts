import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsOptional,
  IsEnum,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum PaymentType {
  RECEIVED = 'received',
  PAID = 'paid',
}

export enum PaymentMode {
  CASH = 'cash',
  CARD = 'card',
  MOBILE_BANKING = 'mobile_banking',
  BANK_TRANSFER = 'bank_transfer',
  CHEQUE = 'cheque',
}

export class PaymentAllocationDto {
  @ApiPropertyOptional({ example: 'clx1234saleid' })
  @IsOptional()
  @IsString()
  saleId?: string;

  @ApiPropertyOptional({ example: 'clx1234purchaseid' })
  @IsOptional()
  @IsString()
  purchaseId?: string;

  @ApiProperty({ example: 500 })
  @IsNumber()
  @IsPositive()
  amount: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreatePaymentDto {
  @ApiProperty({ example: 'clx1234partyid' })
  @IsString()
  @IsNotEmpty()
  partyId: string;

  @ApiProperty({ enum: PaymentType, example: PaymentType.RECEIVED })
  @IsEnum(PaymentType)
  type: PaymentType;

  @ApiProperty({ enum: PaymentMode, example: PaymentMode.CASH })
  @IsEnum(PaymentMode)
  mode: PaymentMode;

  @ApiPropertyOptional({ example: 'clx1234accountid' })
  @IsOptional()
  @IsString()
  accountId?: string;

  @ApiProperty({ example: 1500 })
  @IsNumber()
  @IsPositive()
  amount: number;

  @ApiPropertyOptional({ example: 'CHQ-2024-001' })
  @IsOptional()
  @IsString()
  reference?: string;

  @ApiPropertyOptional({ example: 'clx1234saleid' })
  @IsOptional()
  @IsString()
  saleId?: string;

  @ApiPropertyOptional({ example: 'clx1234purchaseid' })
  @IsOptional()
  @IsString()
  purchaseId?: string;

  @ApiPropertyOptional({ example: 'clx1234planid' })
  @IsOptional()
  @IsString()
  paymentPlanId?: string;

  @ApiPropertyOptional({ example: 'Payment for invoice INV-20240101-0001' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({
    type: [PaymentAllocationDto],
    description: 'Optional invoice-level allocations',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PaymentAllocationDto)
  allocations?: PaymentAllocationDto[];
}
