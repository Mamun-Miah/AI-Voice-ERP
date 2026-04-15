import { IsDateString, IsIn, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ExportQueryDto {
  @ApiProperty({
    example: 'sales',
    enum: ['sales', 'purchases', 'items', 'expenses', 'parties'],
  })
  @IsIn(['sales', 'purchases', 'items', 'expenses', 'parties'])
  type: 'sales' | 'purchases' | 'items' | 'expenses' | 'parties';

  @ApiPropertyOptional({ example: '2024-01-01' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2024-12-31' })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
