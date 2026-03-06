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
import { SaleItemInputDto } from './sale-input.dto';

export enum PaymentMethod {
  CASH = 'cash',
  CARD = 'card',
  MOBILE_BANKING = 'mobile_banking',
  BANK_TRANSFER = 'bank_transfer',
}

export enum PricingTier {
  RETAIL = 'retail',
  WHOLESALE = 'wholesale',
  VIP = 'vip',
}

export class CreateSaleDto {
  @ApiPropertyOptional({ example: 'clx1234partyid' })
  @IsOptional()
  @IsString()
  partyId?: string;

  @ApiProperty({ type: [SaleItemInputDto] })
  @IsArray()
  @IsNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => SaleItemInputDto)
  items: SaleItemInputDto[];

  @ApiPropertyOptional({ example: 50 })
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

  @ApiProperty({ enum: PaymentMethod, example: PaymentMethod.CASH })
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @ApiPropertyOptional({ example: 300 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  paidAmount?: number;

  @ApiPropertyOptional({ enum: PricingTier })
  @IsOptional()
  @IsEnum(PricingTier)
  pricingTier?: PricingTier;

  @ApiPropertyOptional({ example: 'Regular customer' })
  @IsOptional()
  @IsString()
  notes?: string;
}
