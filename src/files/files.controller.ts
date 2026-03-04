import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFiles,
  Get,
  StreamableFile,
  ParseFilePipe,
  NotFoundException,
  Query,
  UseGuards,
  ForbiddenException,
  Req,
  Res,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { FilesService } from './files.service';
import { extname, join, normalize } from 'path';
import type { Response } from 'express';
import { createReadStream, existsSync } from 'fs'; // Required for the 'view' route
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import type { JwtUser } from 'src/auth/types/jwt-user.type';
interface RequestWithUser extends Request {
  user: {
    uuid: string;
    email: string;
  };
}
@ApiTags('File upload')
@UseGuards(JwtAuthGuard)
@Controller('user')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post('upload-assets') //upload files
  @ApiOperation({
    summary:
      'Upload files example: profileImage, nidImage, businessLogo, businessTradeLicense, invoiceFiles, profOfDeliveryFiles',
  })
  @ApiResponse({ status: 200, description: 'Files uploaded successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'profileImage', maxCount: 1 },
      { name: 'nidImage', maxCount: 1 },
      { name: 'businessLogo', maxCount: 1 },
      { name: 'businessTradeLicense', maxCount: 1 },
      { name: 'invoiceFiles', maxCount: 1 },
      { name: 'profOfDeliveryFiles', maxCount: 1 },
    ]),
  )
  //
  //uploadFiles all
  //
  async uploadSellerFiles(
    @UploadedFiles(
      new ParseFilePipe({
        validators: [
          // new MaxFileSizeValidator({ maxSize: 10485760 }),
          // new FileTypeValidator({ fileType: '.(png|jpeg|jpg)' }),
        ],
      }),
    )
    files: {
      profileImage?: Express.Multer.File[];
      nidImage?: Express.Multer.File[];
      businessLogo?: Express.Multer.File[];
      businessTradeLicense?: Express.Multer.File[];
      invoiceFiles?: Express.Multer.File[];
      profOfDeliveryFiles?: Express.Multer.File[];
    },
    @GetUser() user: JwtUser,
    @Query('businessId') businessId?: number,
    @Query('orderId') orderId?: number,
  ) {
    const profileFile = files.profileImage?.[0];
    const nidFile = files.nidImage?.[0];
    const businessLogoFile = files.businessLogo?.[0];
    const businessTradeLicenseFile = files.businessTradeLicense?.[0];
    const invoiceFiles = files.invoiceFiles?.[0];
    const profOfDeliveryFiles = files.profOfDeliveryFiles?.[0];

    return await this.filesService.updateUserPaths(
      user.uuid,
      profileFile?.path,
      nidFile?.path,
      businessLogoFile?.path,
      businessId,
      orderId,
      businessTradeLicenseFile?.path,
      invoiceFiles?.path,
      profOfDeliveryFiles?.path,
    );
  }
  //
  //getFilesProfiles and nid
  //
  @Get('view-file') //profile image and nid card
  @ApiOperation({ summary: 'Get a private file' })
  @ApiResponse({ status: 200, description: 'File retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'File not found' })
  async getPrivateFile(
    @Query('path') dbPath: string,
    @Req() req: RequestWithUser,
    @Res({ passthrough: true }) res: Response,
  ) {
    const isOwner = await this.filesService.validateFileAccess(
      req.user.uuid,
      dbPath,
    );
    if (!isOwner) throw new ForbiddenException('Not authorized');

    const absolutePath = join(process.cwd(), normalize(dbPath));
    if (!existsSync(absolutePath))
      throw new NotFoundException('File not found');

    // Detect extension (e.g., .png, .jpg, .pdf)
    const extension = extname(absolutePath).toLowerCase();

    const mimeTypes: Record<string, string> = {
      '.pdf': 'application/pdf',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
    };
    const contentType = mimeTypes[extension] || 'application/octet-stream';

    const downloadName = `${req.user.uuid}${extension}`;

    res.set({
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${downloadName}"`,
    });

    const file = createReadStream(absolutePath);
    return new StreamableFile(file);
  }
  //
  //getBusinessLogo
  //
  @Get('view-business-logo')
  @ApiOperation({ summary: 'Get a business logo' })
  @ApiResponse({ status: 200, description: 'File retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'File not found' })
  async getBusinessLogo(
    @Query('businessId', ParseIntPipe) businessId: number,
    @Query('path') dbPath: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const isValid = await this.filesService.validateBusinessLogoAccess(
      businessId,
      dbPath,
    );

    if (!isValid) {
      throw new ForbiddenException('Not authorized');
    }

    // Prevent directory traversal
    if (!dbPath.startsWith('uploads/user/business/')) {
      throw new ForbiddenException('Invalid file path');
    }

    const absolutePath = join(process.cwd(), normalize(dbPath));

    if (!existsSync(absolutePath)) {
      throw new NotFoundException('File not found');
    }

    const extension = extname(absolutePath).toLowerCase();

    const mimeTypes: Record<string, string> = {
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.webp': 'image/webp',
    };

    res.set({
      'Content-Type': mimeTypes[extension] ?? 'application/octet-stream',
      'Content-Disposition': 'inline',
    });

    return new StreamableFile(createReadStream(absolutePath));
  }
  //
  //getBusinessLicense
  //
  @Get('view-business-license')
  @ApiOperation({ summary: 'Get a business license' })
  @ApiResponse({ status: 200, description: 'File retrieved successfully' })
  @ApiResponse({ status: 400, description: 'error' })
  async getBusinessLicense(
    @Query('businessId', ParseIntPipe) businessId: number,
    @Query('path') dbPath: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const isValid = await this.filesService.validateBusinessLicenseAccess(
      businessId,
      dbPath,
    );

    if (!isValid) {
      throw new ForbiddenException('Not authorized');
    }

    // Prevent directory traversal
    if (!dbPath.startsWith('uploads/user/documents/')) {
      throw new ForbiddenException('Invalid file path');
    }

    const absolutePath = join(process.cwd(), normalize(dbPath));

    if (!existsSync(absolutePath)) {
      throw new NotFoundException('File not found');
    }

    const extension = extname(absolutePath).toLowerCase();

    const mimeTypes: Record<string, string> = {
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.webp': 'image/webp',
    };

    res.set({
      'Content-Type': mimeTypes[extension] ?? 'application/octet-stream',
      'Content-Disposition': 'inline',
    });

    return new StreamableFile(createReadStream(absolutePath));
  }
}
