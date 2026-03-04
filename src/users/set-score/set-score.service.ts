import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
// export const ORDER_CREATION_TOTAL_MARKS = 1 as const;

@Injectable()
export class SetScoreService {
  constructor(private prisma: PrismaService) {}
  private async incrementSellerScore(userId: number, score: number) {
    return this.prisma.sellerScore.upsert({
      where: { userId: userId },
      create: { userId: userId, totalScore: score },
      update: {
        totalScore: {
          increment: score,
        },
      },
    });
  }
  async setEvidenceScore(orderId: number) {
    //if no evidence provided
    //check evidence has or not
    if (!orderId) {
      throw new Error('OrderId must need');
    }
    const checkEvidence = await this.prisma.orderCreation.findFirst({
      where: {
        id: orderId,
      },
      select: {
        userId: true,
        invoiceUrl: true,
        profOfDelivery: true,
      },
    });
    if (!checkEvidence) {
      throw new Error('Order not found');
    }
    //set score
    const gotScore =
      checkEvidence.invoiceUrl || checkEvidence.profOfDelivery ? 100 : 80;
    //increment seller score
    await this.incrementSellerScore(checkEvidence.userId, gotScore);

    //return score to customer service
    return {
      gotScore,
    };
  }
}
