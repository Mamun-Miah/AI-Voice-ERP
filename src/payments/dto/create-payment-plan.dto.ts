import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsOptional,
  IsEnum,
  IsDateString,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum PaymentFrequency {
  WEEKLY = 'weekly',
  BIWEEKLY = 'biweekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
}

export class CreatePaymentPlanDto {
  @ApiProperty({ example: 'clx1234partyid' })
  @IsString()
  @IsNotEmpty()
  partyId: string;

  @ApiPropertyOptional({ example: 'clx1234saleid' })
  @IsOptional()
  @IsString()
  saleId?: string;

  @ApiProperty({ example: 10000 })
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  totalAmount: number;

  @ApiProperty({ example: 6, description: 'Number of installments (1-60)' })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(60)
  totalInstallments: number;

  @ApiProperty({ enum: PaymentFrequency, example: PaymentFrequency.MONTHLY })
  @IsEnum(PaymentFrequency)
  frequency: PaymentFrequency;

  @ApiProperty({ example: '2024-02-01', description: 'First installment date' })
  @IsDateString()
  startDate: string;

  @ApiPropertyOptional({ example: 'EMI plan for invoice INV-...' })
  @IsOptional()
  @IsString()
  notes?: string;
}
