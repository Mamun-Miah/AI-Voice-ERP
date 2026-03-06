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
import { ApiPropertyOptional } from '@nestjs/swagger';
import { SaleItemInputDto } from './sale-input.dto';
import { PaymentMethod, PricingTier } from './create-sale.dto';

export class EditSaleDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  partyId?: string;

  @ApiPropertyOptional({
    type: [SaleItemInputDto],
    description: 'Replaces all existing sale items',
  })
  @IsOptional()
  @IsArray()
  @IsNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => SaleItemInputDto)
  items?: SaleItemInputDto[];

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

  @ApiPropertyOptional({ enum: PaymentMethod })
  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;

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

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
