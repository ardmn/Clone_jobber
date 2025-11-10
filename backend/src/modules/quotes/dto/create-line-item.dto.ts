import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsBoolean,
  IsOptional,
  IsIn,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateLineItemDto {
  @ApiProperty({
    description: 'Type of line item',
    example: 'service',
    enum: ['service', 'product', 'labor', 'material', 'fee'],
    default: 'service',
  })
  @IsString()
  @IsIn(['service', 'product', 'labor', 'material', 'fee'])
  itemType: string = 'service';

  @ApiProperty({
    description: 'Name of the line item',
    example: 'Lawn Mowing Service',
  })
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiProperty({
    description: 'Description of the line item',
    example: 'Weekly lawn mowing and edging',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Quantity',
    example: 4,
    default: 1,
  })
  @IsNumber()
  @Min(0.01)
  quantity: number = 1;

  @ApiProperty({
    description: 'Unit price',
    example: 50.00,
  })
  @IsNumber()
  @Min(0)
  unitPrice: number;

  @ApiProperty({
    description: 'Whether this item is taxable',
    example: true,
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  isTaxable?: boolean = true;

  @ApiProperty({
    description: 'Whether this item is optional',
    example: false,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  isOptional?: boolean = false;
}
