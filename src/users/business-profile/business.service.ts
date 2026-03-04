import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

export enum BusinessTypeEnum {
  WHOLESALE = 'WHOLESALE',
  RETAIL = 'RETAIL',
}

export interface BusinessProfile {
  businessName: string;
  businessLogoUrl?: string | null;
  businessType: BusinessTypeEnum;
  businessAddress: string;
  businessPhone: string;
  businessEmail: string;
  businessWebsite?: string | null;
  businessTradeLicense?: string | null;
  businessWareHouse?: string | null;
  businessStoreFrontLink: string;
  businessCategoryId: number;
}

@Injectable()
export class BusinessService {
  constructor(private prisma: PrismaService) {}
  //updated business profile
  async updateBusinessProfile(
    uuid: string,
    bussinessProfileData: BusinessProfile,
  ) {
    // Find userId
    const user = await this.prisma.user.findUnique({
      where: { uuid },
      select: { id: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }
    //find Unique user by email
    const findUserbyEmail = await this.prisma.businessInfo.findUnique({
      where: { businessEmail: bussinessProfileData.businessEmail },
    });

    if (findUserbyEmail) {
      throw new ConflictException('Email already exists');
    }
    //find category
    const findCategory = await this.prisma.businessCategory.findUnique({
      where: { id: bussinessProfileData.businessCategoryId },
    });

    if (!findCategory) {
      throw new NotFoundException('Business category not found');
    }
    // Create business profile
    const business = await this.prisma.businessInfo.create({
      data: {
        userId: user.id,
        businessName: bussinessProfileData.businessName,
        businessType: bussinessProfileData.businessType,
        businessAddress: bussinessProfileData.businessAddress,
        businessPhone: bussinessProfileData.businessPhone,
        businessEmail: bussinessProfileData.businessEmail,
        businessWebsite: bussinessProfileData.businessWebsite,
        businessWareHouse: bussinessProfileData.businessWareHouse,
        businessStoreFrontLink: bussinessProfileData.businessStoreFrontLink,
        businessCategoryId: bussinessProfileData.businessCategoryId,
      },
    });

    return {
      success: true,
      message: 'Business profile created successfully',
      data: business,
    };
  }
  //get business profile
  async getBusinessProfile(uuid: string) {
    // Find userId
    const findUserbyUuid = await this.prisma.user.findUnique({
      where: { uuid },
      select: { id: true },
    });

    if (!findUserbyUuid) {
      throw new NotFoundException('User not found');
    }

    // Find business
    const getBusinessProfileData = await this.prisma.businessInfo.findMany({
      where: { userId: findUserbyUuid.id },
      select: {
        id: true,
        userId: true,
        businessName: true,
        businessLogoUrl: true,
        businessType: true,
        businessAddress: true,
        businessPhone: true,
        businessEmail: true,
        businessWebsite: true,
        businessTradeLicense: true,
        businessWareHouse: true,
        businessStoreFrontLink: true,
        businessCategoryId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!getBusinessProfileData) {
      throw new NotFoundException('Business profile not found');
    }

    return {
      success: true,
      message: 'Business profile retrieved successfully',
      data: getBusinessProfileData,
    };
  }
  //patch business profile
  async patchBusinessProfile(
    businessId: number,
    userUuid: string,
    bussinessProfileData: BusinessProfile,
  ) {
    // Find userId
    const findUserbyUuid = await this.prisma.user.findUnique({
      where: { uuid: userUuid },
      select: {
        id: true,
        businessInfo: {
          select: {
            id: true,
          },
        },
      },
    });
    if (!findUserbyUuid) {
      throw new NotFoundException('User not found');
    }
    //find business ownership
    const hasPermission = findUserbyUuid.businessInfo.some(
      (business) => business.id === businessId,
    );

    if (!hasPermission) {
      throw new ForbiddenException('You do not own this business');
    }

    // Find business
    const business = await this.prisma.businessInfo.findUnique({
      where: { id: businessId },
    });

    if (!business) {
      throw new NotFoundException('Business not found');
    }

    // Update business
    const updatedBusiness = await this.prisma.businessInfo.update({
      where: { id: businessId },
      data: {
        businessName: bussinessProfileData?.businessName,
        businessType: bussinessProfileData?.businessType,
        businessAddress: bussinessProfileData?.businessAddress,
        businessPhone: bussinessProfileData?.businessPhone,
        businessEmail: bussinessProfileData?.businessEmail,
        businessWebsite: bussinessProfileData?.businessWebsite,
        businessWareHouse: bussinessProfileData?.businessWareHouse,
        businessStoreFrontLink: bussinessProfileData?.businessStoreFrontLink,
        businessCategoryId: bussinessProfileData?.businessCategoryId,
      },
      select: {
        id: true,
        userId: true,
        businessName: true,
        businessLogoUrl: true,
        businessType: true,
        businessAddress: true,
        businessPhone: true,
        businessEmail: true,
        businessWebsite: true,
        businessTradeLicense: true,
        businessWareHouse: true,
        businessStoreFrontLink: true,
        businessCategoryId: true,
      },
    });

    return {
      success: true,
      message: 'Business profile updated successfully',
      data: updatedBusiness,
    };
  }
}
