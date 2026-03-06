import { Type } from 'class-transformer';
import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateExpenseDto {
  @ApiProperty({ example: 'clx1234categoryid' })
  @IsString()
  @IsNotEmpty()
  categoryId: string;

  @ApiPropertyOptional({ example: 'clx1234accountid' })
  @IsOptional()
  @IsString()
  accountId?: string;

  @ApiPropertyOptional({ example: 'clx1234branchid' })
  @IsOptional()
  @IsString()
  branchId?: string;

  @ApiProperty({ example: 500 })
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  amount: number;

  @ApiProperty({ example: 'Office electricity bill' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiPropertyOptional({ example: '2024-01-15' })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/receipt.jpg' })
  @IsOptional()
  @IsString()
  receipt?: string;
}
