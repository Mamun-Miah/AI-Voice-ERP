import { Module } from '@nestjs/common';
import { PurchasesService } from './purchases.service';
import { PurchasesController } from './purchases.controller';
import { PurchaseReturnsService } from './purchase-returns.service';
import { PurchaseReturnsController } from './purchase-returns.controller';

@Module({
  controllers: [PurchasesController, PurchaseReturnsController],
  providers: [PurchasesService, PurchaseReturnsService],
  exports: [PurchasesService, PurchaseReturnsService],
})
export class PurchasesModule {}
