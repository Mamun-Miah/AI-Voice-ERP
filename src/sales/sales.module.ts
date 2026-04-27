import { Module } from '@nestjs/common';
import { SalesService } from './sales.service';
import { SalesController } from './sales.controller';
import { SaleReturnsService } from './sale-returns.service';
import { SaleReturnsController } from './sale-returns.controller';

@Module({
  controllers: [SaleReturnsController, SalesController],
  providers: [SalesService, SaleReturnsService],
  exports: [SalesService, SaleReturnsService],
})
export class SalesModule {}
