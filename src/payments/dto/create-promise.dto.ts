import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsOptional,
  IsEnum,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum PromiseStatus {
  PENDING = 'pending',
  KEPT = 'kept',
  BROKEN = 'broken',
  PARTIAL = 'partial',
}

export class CreatePromiseToPayDto {
  @ApiProperty({ example: 'clx1234partyid' })
  @IsString()
  @IsNotEmpty()
  partyId: string;

  @ApiPropertyOptional({ example: 'clx1234saleid' })
  @IsOptional()
  @IsString()
  saleId?: string;

  @ApiProperty({ example: '2024-03-01' })
  @IsDateString()
  promisedDate: string;

  @ApiProperty({ example: 5000 })
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  amount: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdatePromiseStatusDto {
  @ApiProperty({ enum: PromiseStatus })
  @IsEnum(PromiseStatus)
  status: PromiseStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
