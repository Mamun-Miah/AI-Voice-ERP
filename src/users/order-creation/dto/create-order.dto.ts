import {
  IsString,
  IsNumber,
  IsOptional,
  IsEmail,
  IsDateString,
  IsInt,
  IsUUID,
  // IsNotEmpty,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateOrderDto {
  @ApiProperty({ description: 'Date when the order was placed' })
  @IsDateString()
  orderDate: string;

  @ApiProperty({ description: 'Date when the order should be delivered' })
  @IsDateString()
  deliveryDate: string;

  @ApiProperty({ description: 'Name of the product being ordered' })
  @IsString()
  productName: string;

  @ApiProperty({ description: 'Description of the product' })
  @IsString()
  productDescription: string;

  @ApiProperty({ description: 'Price of the product' })
  @IsNumber()
  productPrice: number;

  @ApiProperty({ description: 'Quantity of the product being ordered' })
  @IsNumber()
  productQuantity: number;

  @ApiProperty({ description: 'Name of the customer placing the order' })
  @IsString()
  customerName: string;

  @ApiProperty({ description: 'Email of the customer placing the order' })
  @IsOptional()
  @IsEmail()
  customerEmail?: string;

  @ApiProperty({
    description: 'Phone number of the customer placing the order',
  })
  @IsString()
  customerPhone: string;

  @ApiProperty({ description: 'Address of the customer placing the order' })
  @IsString()
  customerAddress: string;

  @ApiProperty({ description: 'ID of the business receiving the order' })
  @IsString()
  invoiceNumber: string;

  @ApiProperty({ description: 'URL of the invoice for the order' })
  @IsString()
  invoiceUrl: string;

  @ApiProperty({ description: 'Proof of delivery for the order' })
  @IsString()
  profOfDelivery: string;
  // @IsNumber()
  // @IsNotEmpty()
  // businessId: number;
}
export class CreateLinkDto {
  @ApiProperty({ description: 'URL link for the order' })
  @IsString()
  link: string;

  @ApiProperty({ description: 'Expiry date of the link' })
  @IsDateString()
  expiry: string;

  @ApiProperty({ description: 'ID of the order associated with the link' })
  @IsInt()
  orderId: number;
}
export class GetOrderDetailsDto {
  @ApiProperty({ description: 'UUID of the order' })
  @IsUUID()
  uuid: string;
}
