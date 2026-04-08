import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { CreatePurchaseDto } from './create-purchase.dto';
import { IsOptional, IsString } from 'class-validator';

export class UpdatePurchaseDto extends PartialType(CreatePurchaseDto) {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;
}
