import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { SalesService } from './sales.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { UpdateSaleDto } from './dto/update-sale.dto';
import { QuerySaleDto } from './dto/query-sale.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import type { JwtUser } from 'src/auth/types/jwt-user.type';

@ApiTags('Sales')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('sales')
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  // GET /sales
  @Get()
  @ApiOperation({ summary: 'List sales with filtering and pagination' })
  @ApiResponse({ status: 200, description: 'Sales retrieved successfully' })
  findAll(@GetUser() user: JwtUser, @Query() query: QuerySaleDto) {
    return this.salesService.findAll(user.businessId, query);
  }

  // GET /sales/:id
  @Get(':id')
  @ApiOperation({
    summary: 'Get a single sale with full item and party details',
  })
  @ApiResponse({ status: 200, description: 'Sale retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Sale not found' })
  findOne(@GetUser() user: JwtUser, @Param('id') id: string) {
    return this.salesService.findOne(user.businessId, id);
  }

  // POST /sales
  @Post()
  @ApiOperation({ summary: 'Create a new sale' })
  @ApiResponse({ status: 201, description: 'Sale created successfully' })
  @ApiResponse({
    status: 400,
    description: 'Validation error or insufficient stock',
  })
  create(@GetUser() user: JwtUser, @Body() dto: CreateSaleDto) {
    return this.salesService.create(user.businessId, user.id, dto);
  }

  // PATCH /sales/:id  — status updates (cancel / return / complete)
  @Patch(':id')
  @ApiOperation({ summary: 'Update sale status (cancel, return, complete)' })
  @ApiResponse({ status: 200, description: 'Sale updated successfully' })
  @ApiResponse({
    status: 403,
    description: 'Cannot modify a cancelled or returned sale',
  })
  @ApiResponse({ status: 404, description: 'Sale not found' })
  update(
    @GetUser() user: JwtUser,
    @Param('id') id: string,
    @Body() dto: UpdateSaleDto,
  ) {
    return this.salesService.update(user.businessId, id, user.id, dto);
  }
}
