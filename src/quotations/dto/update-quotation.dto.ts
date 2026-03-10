import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { QuotationStatus } from './create-quotation.dto';

export class UpdateQuotationDto {
  @ApiPropertyOptional({ enum: QuotationStatus })
  @IsOptional()
  @IsEnum(QuotationStatus)
  status?: QuotationStatus;

  @ApiPropertyOptional({
    example: 'clx1234saleid',
    description: 'Set when quotation is converted to a sale',
  })
  @IsOptional()
  @IsString()
  convertedToSaleId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
