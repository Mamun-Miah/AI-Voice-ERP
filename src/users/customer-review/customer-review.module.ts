import { Module } from '@nestjs/common';
import { CustomerReviewService } from './customer-review.service';
import { CustomerReviewController } from './customer-review.controller';
import { SetScoreModule } from '../set-score/set-score.module';

@Module({
  imports: [SetScoreModule],
  providers: [CustomerReviewService],
  controllers: [CustomerReviewController],
})
export class CustomerReviewModule {}
