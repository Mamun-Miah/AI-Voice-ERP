import {
  IsString,
  IsEnum,
  IsOptional,
  IsNumber,
  IsNotEmpty,
} from 'class-validator';
import { BusinessTypeEnum } from '../business.service';
import { ApiProperty } from '@nestjs/swagger';

export class CreateBusinessProfileDto {
  @ApiProperty({ description: 'User ID associated with the business profile' })
  @IsNumber()
  @IsOptional()
  userId: number;

  @ApiProperty({ description: 'Name of the business' })
  @IsString()
  @IsNotEmpty()
  businessName: string;

  @ApiProperty({ description: 'URL of the business logo', required: false })
  @IsString()
  @IsOptional()
  businessLogoUrl?: string;

  @ApiProperty({ description: 'Type of the business', enum: BusinessTypeEnum })
  @IsEnum(BusinessTypeEnum)
  businessType: BusinessTypeEnum;

  @ApiProperty({ description: 'Address of the business' })
  @IsString()
  @IsNotEmpty()
  businessAddress: string;

  @ApiProperty({ description: 'Phone number of the business' })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  businessPhone: string;

  @ApiProperty({ description: 'Email of the business' })
  @IsString()
  @IsNotEmpty()
  businessEmail: string;

  @ApiProperty({ description: 'Website of the business', required: false })
  @IsString()
  @IsOptional()
  businessWebsite?: string;

  @ApiProperty({
    description: 'Trade license of the business',
    required: false,
  })
  @IsString()
  @IsOptional()
  businessTradeLicense?: string;

  @ApiProperty({
    description: 'Warehouse information of the business',
    required: false,
  })
  @IsString()
  @IsOptional()
  businessWareHouse?: string;

  @ApiProperty({ description: 'Storefront link of the business' })
  @IsString()
  @IsNotEmpty()
  businessStoreFrontLink: string;

  @ApiProperty({ description: 'Category ID of the business' })
  @IsNumber()
  @IsNotEmpty()
  businessCategoryId: number;
}
export class PatchBusinessProfileDto {
  @ApiProperty({
    description: 'User ID associated with the business profile',
    required: false,
  })
  @IsNumber()
  @IsOptional()
  userId: number;

  @ApiProperty({ description: 'Name of the business', required: false })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  businessName: string;

  @ApiProperty({ description: 'URL of the business logo', required: false })
  @IsString()
  @IsOptional()
  businessLogoUrl?: string;

  @ApiProperty({
    description: 'Type of the business',
    enum: BusinessTypeEnum,
    required: false,
  })
  @IsEnum(BusinessTypeEnum)
  @IsOptional()
  businessType: BusinessTypeEnum;

  @ApiProperty({ description: 'Address of the business', required: false })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  businessAddress: string;

  @ApiProperty({ description: 'Phone number of the business', required: false })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  businessPhone: string;

  @ApiProperty({ description: 'Email of the business', required: false })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  businessEmail: string;

  @ApiProperty({ description: 'Website of the business', required: false })
  @IsString()
  @IsOptional()
  businessWebsite?: string;

  @ApiProperty({
    description: 'Trade license of the business',
    required: false,
  })
  @IsString()
  @IsOptional()
  businessTradeLicense?: string;

  @ApiProperty({
    description: 'Warehouse information of the business',
    required: false,
  })
  @IsString()
  @IsOptional()
  businessWareHouse?: string;

  @ApiProperty({
    description: 'Storefront link of the business',
    required: false,
  })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  businessStoreFrontLink: string;

  @ApiProperty({ description: 'Category ID of the business', required: false })
  @IsNumber()
  @IsNotEmpty()
  @IsOptional()
  businessCategoryId: number;
}
