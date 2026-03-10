import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { QuotationItemInputDto } from './input-quotation.dto';

export enum QuotationStatus {
  DRAFT = 'draft',
  SENT = 'sent',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  EXPIRED = 'expired',
  CONVERTED = 'converted',
}

export class CreateQuotationDto {
  @ApiPropertyOptional({ example: 'clx1234partyid' })
  @IsOptional()
  @IsString()
  partyId?: string;

  @ApiPropertyOptional({ example: 'Rahim Traders' })
  @IsOptional()
  @IsString()
  partyName?: string;

  @ApiProperty({ type: [QuotationItemInputDto] })
  @IsArray()
  @IsNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => QuotationItemInputDto)
  items: QuotationItemInputDto[];

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

  @ApiProperty({ example: '2024-02-15', description: 'Quotation expiry date' })
  @IsDateString()
  validityDate: string;

  @ApiPropertyOptional({
    example: '2024-01-15',
    description: 'Defaults to today if omitted',
  })
  @IsOptional()
  @IsDateString()
  quotationDate?: string;

  @ApiPropertyOptional({
    enum: QuotationStatus,
    default: QuotationStatus.DRAFT,
  })
  @IsOptional()
  @IsEnum(QuotationStatus)
  status?: QuotationStatus;

  @ApiPropertyOptional({ example: 'Prices valid for 30 days' })
  @IsOptional()
  @IsString()
  notes?: string;
}
