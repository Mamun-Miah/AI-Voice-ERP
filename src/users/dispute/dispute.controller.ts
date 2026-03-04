import {
  Body,
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { DisputeService } from './dispute.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path/win32';
import { CreateDisputeDto } from './dto/create-dispute.dto';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@ApiTags('Dispute')
@Controller('user/dispute')
export class DisputeController {
  constructor(private readonly disputeService: DisputeService) {}
  @Post()
  @ApiOperation({ summary: 'Create a new dispute' })
  @ApiResponse({ status: 201, description: 'Dispute created successfully.' })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiResponse({ status: 500, description: 'Internal Server Error.' })
  @UseInterceptors(
    FileInterceptor('disputeFile', {
      storage: diskStorage({
        destination: './uploads/disputeFiles',
        filename: (_req, file, cb) => {
          const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, uniqueName + extname(file.originalname));
        },
      }),
    }),
  )
  async create(
    @Body() disputeData: CreateDisputeDto,
    @UploadedFile() disputeFile: Express.Multer.File,
  ) {
    return this.disputeService.createDispute(disputeData, disputeFile);
  }
}
