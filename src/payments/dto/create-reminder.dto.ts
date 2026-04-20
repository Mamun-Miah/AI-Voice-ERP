import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsDateString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum ReminderType {
  OVERDUE = 'overdue',
  UPCOMING = 'upcoming',
  CUSTOM = 'custom',
}

export enum ReminderChannel {
  MANUAL = 'manual',
  SMS = 'sms',
  WHATSAPP = 'whatsapp',
  EMAIL = 'email',
}

export class CreateReminderDto {
  @ApiProperty({ example: 'clx1234partyid' })
  @IsString()
  @IsNotEmpty()
  partyId: string;

  @ApiPropertyOptional({ enum: ReminderType, example: ReminderType.OVERDUE })
  @IsOptional()
  @IsEnum(ReminderType)
  type?: ReminderType;

  @ApiPropertyOptional({
    enum: ReminderChannel,
    example: ReminderChannel.MANUAL,
  })
  @IsOptional()
  @IsEnum(ReminderChannel)
  channel?: ReminderChannel;

  @ApiProperty({ example: '2024-02-15T10:00:00.000Z' })
  @IsDateString()
  scheduledAt: string;

  @ApiPropertyOptional({
    example: 'Dear customer, your payment of ৳5,000 is overdue.',
  })
  @IsOptional()
  @IsString()
  message?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
