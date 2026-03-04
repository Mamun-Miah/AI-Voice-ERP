import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateSellerReviewDto } from './dto/create-seller-review.dto';
import { SetScoreService } from '../set-score/set-score.service';
import { ReviewEnum } from './dto/create-seller-review.dto';

@Injectable()
export class CustomerReviewService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly setScoreService: SetScoreService,
  ) {}

  async createReview(
    dto: CreateSellerReviewDto,
    attachment?: Express.Multer.File,
  ) {
    //find already reviewd order
    const alreadyReviewed = await this.prisma.sellerReview.findFirst({
      where: {
        orderUuid: dto.orderUuid,
      },
    });
    if (alreadyReviewed) {
      return {
        message: 'Already reviewed',
        success: false,
      };
    }
    // ensure OrderCreationexist
    const order = await this.prisma.orderCreation.findUnique({
      where: {
        uuid: dto.orderUuid,
      },
      select: {
        id: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }
    const getScore = await this.setScoreService.setEvidenceScore(order.id);
    //without COMPLETED_AS_AGREED user got 0 Marks until resolved
    const setScore =
      dto.review === ReviewEnum.COMPLETED_AS_AGREED ? getScore.gotScore : 0;

    // ensure order exists
    return this.prisma.sellerReview.create({
      data: {
        orderUuid: dto.orderUuid,
        review: dto.review,
        score: setScore,
        complain: dto.complain,
        isReviewed: true,
        orderId: order.id,
        attachment: attachment ? attachment.path.replace(/\\/g, '/') : null,
      },
    });
  }
  async getLinkDetails(orderUuid: string) {
    if (!orderUuid) {
      throw new NotFoundException('orderUuid required');
    }
    //get orderdetails
    const order = await this.prisma.orderCreation.findUnique({
      where: {
        uuid: orderUuid,
      },
      select: {
        id: true,
        invoiceNumber: true,
        createdAt: true,
        updatedAt: true,
        orderDate: true,
        deliveryDate: true,
        productName: true,
        productDescription: true,
        productPrice: true,
        productQuantity: true,
      },
    });
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    const { id: orderId, ...restOrder } = order;

    ///link details
    const linkDetails = await this.prisma.linkCreated.findFirst({
      where: {
        orderId: orderId,
      },
      select: {
        createdAt: true,
        expiry: true,
        link: true,
      },
    });
    if (!linkDetails) {
      throw new NotFoundException('Link not found');
    }
    const todayDate = new Date();
    const checkExpiredLink = linkDetails.expiry < todayDate ? true : false;
    //isreviewd or not
    const isAlreadyReviewed = await this.prisma.sellerReview.findFirst({
      where: {
        orderUuid: orderUuid,
      },
      select: {
        isReviewed: true,
      },
    });

    return {
      orderDetails: restOrder,
      expiredLink: checkExpiredLink,
      isAlreadyReviewed: isAlreadyReviewed?.isReviewed ? true : false,
    };
  }
}
