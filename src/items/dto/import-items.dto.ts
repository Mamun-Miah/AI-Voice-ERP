import { ValidateNested, IsArray } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { CreateItemDto } from './create-item.dto';

export class ImportItemsDto {
  @ApiProperty({ type: [CreateItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateItemDto)
  items: CreateItemDto[];
}
