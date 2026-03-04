import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum ReviewEnum {
  COMPLETED_AS_AGREED = 'COMPLETED_AS_AGREED',
  COMPLETED_WITH_ISSUE = 'COMPLETED_WITH_ISSUE',
  NOT_COMPLETED = 'NOT_COMPLETED',
}

export class CreateSellerReviewDto {
  @ApiProperty({
    description: 'Review of the seller',
    enum: ReviewEnum,
  })
  @IsEnum(ReviewEnum, {
    message:
      'review must be one of: COMPLETED_AS_AGREED | COMPLETED_WITH_ISSUE | NOT_COMPLETED',
  })
  @IsNotEmpty()
  review: ReviewEnum;
  @ApiProperty({
    description: 'Additional comments for the review',
    required: false,
  })
  @IsOptional()
  @IsString()
  complain?: string;

  @ApiProperty({ description: 'Order UUID associated with the review' })
  @IsString()
  @IsUUID()
  orderUuid: string;
}
