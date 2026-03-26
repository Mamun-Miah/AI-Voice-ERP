import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { BatchesService } from './batches.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import type { JwtUser } from 'src/auth/types/jwt-user.type';

@ApiTags('Batches')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('batches')
export class BatchesController {
  constructor(private readonly batchesService: BatchesService) {}

  @Get()
  @ApiOperation({ summary: 'List all batches with filtering' })
  findAll(
    @GetUser() user: JwtUser,
    @Query('status') status?: string,
    @Query('expiryDays') expiryDays?: string,
  ) {
    return this.batchesService.findAll(user.businessId, status, expiryDays);
  }

  @Get('available')
  @ApiOperation({ summary: 'Get available batches for sales (FEFO)' })
  findAvailable(
    @GetUser() user: JwtUser,
    @Query('itemId') itemId: string,
    @Query('quantity') quantity?: string,
  ) {
    return this.batchesService.findAvailable(
      user.businessId,
      itemId,
      quantity ? parseFloat(quantity) : undefined,
    );
  }

  @Get('expiry-alerts')
  @ApiOperation({ summary: 'Get batches expiring within threshold' })
  getExpiryAlerts(
    @GetUser() user: JwtUser,
    @Query('days') days?: string,
    @Query('includeExpired') includeExpired?: string,
  ) {
    return this.batchesService.getExpiryAlerts(
      user.businessId,
      days ? parseInt(days, 10) : undefined,
      includeExpired === 'true',
    );
  }

  @Post()
  @ApiOperation({ summary: 'Create a new batch' })
  create(@GetUser() user: JwtUser, @Body() dto: any) {
    return this.batchesService.create(user.businessId, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get detailed batch information' })
  findOne(@GetUser() user: JwtUser, @Param('id') id: string) {
    return this.batchesService.findOne(user.businessId, id);
  }
}
