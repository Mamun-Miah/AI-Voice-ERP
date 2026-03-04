import { Module } from '@nestjs/common';
// import { SetScoreController } from './set-score.controller';
import { SetScoreService } from './set-score.service';

@Module({
  // controllers: [SetScoreController],
  providers: [SetScoreService],
  exports: [SetScoreService],
})
export class SetScoreModule {}
