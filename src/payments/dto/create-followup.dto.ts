import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsDateString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum FollowUpOutcome {
  CONTACTED = 'contacted',
  NO_ANSWER = 'no_answer',
  PROMISED = 'promised',
  REFUSED = 'refused',
  PAID = 'paid',
}

export class CreateFollowUpNoteDto {
  @ApiProperty({ example: 'clx1234partyid' })
  @IsString()
  @IsNotEmpty()
  partyId: string;

  @ApiPropertyOptional({ example: 'clx1234saleid' })
  @IsOptional()
  @IsString()
  saleId?: string;

  @ApiProperty({ example: 'Called customer, they promised to pay by Friday.' })
  @IsString()
  @IsNotEmpty()
  note: string;

  @ApiPropertyOptional({ enum: FollowUpOutcome })
  @IsOptional()
  @IsEnum(FollowUpOutcome)
  outcome?: FollowUpOutcome;

  @ApiPropertyOptional({ example: '2024-02-16' })
  @IsOptional()
  @IsDateString()
  nextFollowUp?: string;
}
