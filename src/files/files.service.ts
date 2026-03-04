import {
  // ForbiddenException,
  Injectable,
  // NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FilesService {
  constructor(private prisma: PrismaService) {}
  //
  //update files upload path
  //
  async updateUserPaths(
    uuid: string,
    profilePath?: string,
    nidPath?: string,
    businessLogoPath?: string,
    businessId?: number,
    orderId?: number,
    businessTradeLicensePath?: string,
    invoiceFilesPath?: string,
    profOfDeliveryFilesPath?: string,
  ) {
    //business upload
    if (businessLogoPath && businessId) {
      return await this.prisma.businessInfo.update({
        where: { id: businessId },
        data: {
          businessLogoUrl: businessLogoPath.replace(/\\/g, '/'),
        },
      });
    } else if (businessTradeLicensePath && businessId) {
      return await this.prisma.businessInfo.update({
        where: { id: businessId },
        data: {
          businessTradeLicense: businessTradeLicensePath.replace(/\\/g, '/'),
        },
      });
      //order creation
    } else if ((invoiceFilesPath || profOfDeliveryFilesPath) && orderId) {
      return await this.prisma.orderCreation.update({
        where: { id: orderId },
        data: {
          ...(invoiceFilesPath && {
            invoiceUrl: invoiceFilesPath.replace(/\\/g, '/'),
          }),
          ...(profOfDeliveryFilesPath && {
            profOfDelivery: profOfDeliveryFilesPath.replace(/\\/g, '/'),
          }),
        },
      });
    }
    //profile upload
    else {
      return await this.prisma.user.update({
        where: { uuid: uuid },
        data: {
          ...(profilePath && {
            profileImageUrl: profilePath.replace(/\\/g, '/'),
          }),
          ...(nidPath && {
            nidImageUrl: nidPath.replace(/\\/g, '/'),
          }),
        },
        select: {
          id: true,
          uuid: true,
          name: true,
          email: true,
          phone: true,
          address: true,
          provider: true,
          providerId: true,
          profileImageUrl: true,
          nidImageUrl: true,
          isEmailVerified: true,
          isPhoneVerified: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    }
  }

  async validateFileAccess(
    userUuid: string,
    requestedPath: string,
  ): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { uuid: userUuid },
      select: { profileImageUrl: true, nidImageUrl: true },
    });

    if (!user) return false;

    // Normalizing paths to ensure the comparison works (replaces \ with /)
    const normRequested = requestedPath.replace(/\\/g, '/');
    const normProfile = user.profileImageUrl?.replace(/\\/g, '/');
    const normNid = user.nidImageUrl?.replace(/\\/g, '/');

    return normRequested === normProfile || normRequested === normNid;
  }
  async validateBusinessLogoAccess(
    businessId: number,
    requestedPath: string,
  ): Promise<boolean> {
    // Find business info owned by this user
    const business = await this.prisma.businessInfo.findFirst({
      where: {
        id: businessId,
      },
      select: {
        businessLogoUrl: true,
      },
    });

    if (!business?.businessLogoUrl) return false;

    const normRequested = requestedPath.replace(/\\/g, '/');
    const normLogo = business.businessLogoUrl.replace(/\\/g, '/');

    return normRequested === normLogo;
  }
  async validateBusinessLicenseAccess(
    businessId: number,
    requestedPath: string,
  ): Promise<boolean> {
    // Find business info owned by this user
    const business = await this.prisma.businessInfo.findFirst({
      where: {
        id: businessId,
      },
      select: {
        businessTradeLicense: true,
      },
    });

    if (!business?.businessTradeLicense) return false;

    const normRequested = requestedPath.replace(/\\/g, '/');
    const normLogo = business.businessTradeLicense.replace(/\\/g, '/');

    return normRequested === normLogo;
  }
}
