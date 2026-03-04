import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { BusinessService } from './business.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
  CreateBusinessProfileDto,
  PatchBusinessProfileDto,
} from './dto/create-business-profile.dto';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import type { JwtUser } from 'src/auth/types/jwt-user.type';

@UseGuards(JwtAuthGuard)
@ApiTags('Business Profile')
@Controller('user/business-profile')
export class BusinessController {
  constructor(private readonly businessService: BusinessService) {}

  @Post('create')
  @ApiOperation({ summary: 'Create or update business profile' })
  @ApiResponse({
    status: 200,
    description: 'Business profile created/updated successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async createBusinessProfile(
    @GetUser() user: JwtUser,
    @Body() dto: CreateBusinessProfileDto,
  ) {
    return this.businessService.updateBusinessProfile(user.uuid, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get business profile' })
  @ApiResponse({ status: 200, description: 'Business profile retrieved' })
  @ApiResponse({ status: 404, description: 'Business profile not found' })
  async getBusinessProfile(@GetUser() user: JwtUser) {
    return this.businessService.getBusinessProfile(user.uuid);
  }

  @Patch('update/:id')
  @ApiOperation({ summary: 'Update business profile' })
  @ApiResponse({ status: 200, description: 'Business profile updated' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Business profile not found' })
  async patchBusinessProfile(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() user: JwtUser,
    @Body() dto: PatchBusinessProfileDto,
  ) {
    const userId = user.uuid;
    return this.businessService.patchBusinessProfile(id, userId, dto);
  }
}
