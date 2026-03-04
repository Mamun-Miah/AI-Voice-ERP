import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { GetOrderDetailsDto } from './dto/create-order.dto';
import { randomUUID } from 'crypto';
@Injectable()
export class OrderService {
  constructor(private prisma: PrismaService) {}

  async createOrder(
    userId: number,
    businessId: number,
    orderData: CreateOrderDto,
    uuid: string,
  ) {
    const business = await this.prisma.businessInfo.findUnique({
      where: { id: businessId },
    });

    if (!business) {
      throw new NotFoundException(`Business with id ${businessId} not found`);
    }
    //create order
    const order = await this.prisma.orderCreation.create({
      data: {
        userId: userId,
        orderDate: orderData.orderDate,
        deliveryDate: orderData.deliveryDate,
        productName: orderData.productName,
        productDescription: orderData.productDescription,
        productPrice: orderData.productPrice,
        productQuantity: orderData.productQuantity,
        customerName: orderData.customerName,
        customerEmail: orderData.customerEmail,
        customerPhone: orderData.customerPhone,
        customerAddress: orderData.customerAddress,
        invoiceNumber: orderData.invoiceNumber,
        invoiceUrl: orderData.invoiceUrl,
        profOfDelivery: orderData.profOfDelivery,
        businessId: businessId,
      },
    });
    //Link expireation
    const expiryDays = Number(process.env.LINK_EXPIRY_DAYS || 14);
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + expiryDays);
    //Create Link
    const cleanInvoice = order.invoiceNumber.replace(/^INV-/, '');
    const link = `${order.uuid}-${cleanInvoice}-${userId}-${uuid}-${randomUUID()}`;
    //create link data
    const createLink = await this.prisma.linkCreated.create({
      data: {
        link: link,
        expiry: expiryDate,
        orderId: order.id,
      },
    });

    return {
      success: true,
      message: 'Order created successfully',
      data: {
        order: order,
        link: createLink,
      },
    };
  }
  //get orders//
  /////////////
  ////////////
  async getOrders(
    businessId: number,
    userId: number,
    page: number,
    limit: number,
  ) {
    //find userid by business id
    const business = await this.prisma.businessInfo.findFirst({
      where: { id: businessId, userId: userId },
    });

    if (!business) {
      return new NotFoundException(
        `Business with id ${businessId} not found for this user`,
      );
    }
    //order find by business id
    const order = await this.prisma.orderCreation.findMany({
      where: {
        businessId: businessId,
      },
    });

    if (!order || order.length === 0) {
      return new NotFoundException(
        `No orders found for business id ${businessId}`,
      );
    }
    page = page > 0 ? page : 1;
    limit = limit > 0 ? limit : 10;
    const orders = await this.prisma.orderCreation.findMany({
      where: {
        businessId: businessId,
      },
      take: limit,
      skip: (page - 1) * limit,
      orderBy: { createdAt: 'desc' },

      select: {
        id: true,
        uuid: true,
        orderDate: true,
        deliveryDate: true,
        productName: true,
        customerName: true,
        customerEmail: true,
        customerPhone: true,
        invoiceNumber: true,

        linkCreated: {
          select: {
            link: true,
            expiry: true,
          },
        },
        sellerReviews: {
          select: {
            id: true,
            review: true,
            isReviewed: true,
          },
        },
      },
    });
    //total page calculation
    const totalOrders = await this.prisma.orderCreation.count({
      where: { businessId: businessId },
    });
    const totalPages = Math.ceil(totalOrders / limit);
    return orders.map((order) => ({
      ...order,
      sellerReviews: order.sellerReviews[0] || null,
      link: order.linkCreated[0]?.link ?? null,
      linkExpiry: order.linkCreated[0]?.expiry ?? null,
      linkCreated: undefined,
      meta: {
        totalOrders,
        totalPages,
        currentPage: page,
        pageSize: limit,
      },
    }));
  }
  async getOrderById(dto: GetOrderDetailsDto) {
    const order = await this.prisma.orderCreation.findUnique({
      where: { uuid: dto.uuid },
      include: {
        linkCreated: true,
        sellerReviews: true,
      },
    });

    if (!order) {
      throw new NotFoundException(`Order with uuid ${dto.uuid} not found`);
    }

    return {
      ...order,
      sellerReviews: order.sellerReviews[0] || null,
      link: order.linkCreated[0]?.link ?? null,
      linkExpiry: order.linkCreated[0]?.expiry ?? null,
      linkCreated: undefined,
    };
  }
}
