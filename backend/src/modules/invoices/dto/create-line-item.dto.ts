import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsBoolean, IsOptional, Min, MaxLength } from 'class-validator';

export class CreateLineItemDto {
  @ApiProperty({
    description: 'Type of line item',
    example: 'service',
    enum: ['service', 'product', 'labor', 'material', 'other'],
  })
  @IsString()
  @MaxLength(50)
  itemType: string;

  @ApiProperty({
    description: 'Name of the line item',
    example: 'Lawn Mowing Service',
  })
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({
    description: 'Description of the line item',
    example: 'Standard lawn mowing service for residential property',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Quantity',
    example: 1,
    minimum: 0.01,
  })
  @IsNumber()
  @Min(0.01)
  quantity: number;

  @ApiProperty({
    description: 'Unit price',
    example: 50.00,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  unitPrice: number;

  @ApiPropertyOptional({
    description: 'Whether this item is taxable',
    example: true,
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  isTaxable?: boolean;
}
