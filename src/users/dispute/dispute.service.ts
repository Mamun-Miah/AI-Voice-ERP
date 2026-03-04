import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateDisputeDto } from './dto/create-dispute.dto';
@Injectable()
export class DisputeService {
  constructor(private readonly prismaService: PrismaService) {}
  async createDispute(
    disputeData: CreateDisputeDto,
    disputeFile?: Express.Multer.File,
  ) {
    //find the order associated with the sellerReviewId
    const order = await this.prismaService.sellerReview.findFirst({
      where: {
        id: disputeData.sellerReviewId,
      },
    });
    if (!order) {
      return {
        message: 'Order not found for the given sellerReviewId',
        success: false,
      };
    }
    //find duplicate dispute for the same sellerReviewId
    const existingDispute = await this.prismaService.disputes.findFirst({
      where: {
        sellerReviewId: disputeData.sellerReviewId,
      },
    });
    if (existingDispute) {
      return {
        message: 'Dispute already exists for this review',
        success: false,
      };
    }
    //create dispute logic
    return this.prismaService.disputes.create({
      data: {
        sellerReviewId: disputeData.sellerReviewId,
        issue: disputeData.issue,
        description: disputeData.description,
        attachment: disputeFile ? disputeFile.path.replace(/\\/g, '/') : null,
      },
    });
  }
}
