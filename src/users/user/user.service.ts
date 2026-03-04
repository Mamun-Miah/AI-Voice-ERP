import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
export interface SellerProfileData {
  name?: string;
  phone?: string;
  address?: string;
  profileImageUrl?: string;
  nidImageUrl?: string;
}
@Injectable()
export class UserService {
  constructor(
    private prisma: PrismaService,
    @InjectPinoLogger(UserService.name)
    private readonly logger: PinoLogger,
  ) {}
  //create seller myprofile
  async updateSellerProfile(
    sellerUUID: string,
    sellerProfileData: SellerProfileData,
  ) {
    //find user by uuid
    const findUniqueUser = await this.prisma.user.findUnique({
      where: { uuid: sellerUUID },
    });

    if (!findUniqueUser) {
      throw new BadRequestException('User not found');
    }

    // Update user profile
    const user = await this.prisma.user.update({
      where: { uuid: sellerUUID },
      data: {
        name: sellerProfileData.name,
        phone: sellerProfileData.phone,
        address: sellerProfileData.address,
      },
      select: {
        name: true,
        phone: true,
        email: true,
        address: true,
      },
    });
    this.logger.info({ sellerUUID }, 'Seller profile updated successfully');
    return {
      success: true,
      message: 'Seller profile updated successfully',
      data: user,
    };
  }
  async getSellerProfile(sellerUUID: string) {
    //find user by uuid

    const user = await this.prisma.user.findUnique({
      where: { uuid: sellerUUID },
      select: {
        uuid: true,
        name: true,
        phone: true,
        email: true,
        address: true,
        nidImageUrl: true,
        profileImageUrl: true,
      },
    });
    if (!user) {
      throw new NotFoundException(`Seller with UUID ${sellerUUID} not found`);
    }
    return {
      success: true,
      message: 'Seller profile fetched successfully',
      data: user,
    };
  }
}
