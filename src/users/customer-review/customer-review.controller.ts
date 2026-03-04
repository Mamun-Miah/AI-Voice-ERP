import {
  Controller,
  Post,
  Body,
  Get,
  UploadedFile,
  UseInterceptors,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CustomerReviewService } from './customer-review.service';
import { CreateSellerReviewDto } from './dto/create-seller-review.dto';
@ApiTags('Customer Review')
@Controller('customer-review')
export class CustomerReviewController {
  constructor(private readonly customerReviewService: CustomerReviewService) {}

  @Post()
  @ApiOperation({ summary: 'Create a review for a seller' })
  @ApiResponse({ status: 201, description: 'Review created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @UseInterceptors(
    FileInterceptor('attachment', {
      storage: diskStorage({
        destination: './uploads/customer-review/files',
        filename: (_req, file, cb) => {
          const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, uniqueName + extname(file.originalname));
        },
      }),
    }),
  )
  async create(
    @Body() dto: CreateSellerReviewDto,
    @UploadedFile() attachment?: Express.Multer.File,
  ) {
    return this.customerReviewService.createReview(dto, attachment);
  }

  @Get()
  @ApiOperation({ summary: 'Get review link details for an order' })
  @ApiResponse({
    status: 200,
    description: 'Link details retrieved successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async getLinkDetails(@Query('orderUuid') orderUuid: string) {
    return this.customerReviewService.getLinkDetails(orderUuid);
  }
}
