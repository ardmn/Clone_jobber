import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsUUID,
  IsArray,
  IsNumber,
  IsBoolean,
  IsOptional,
  IsDateString,
  ValidateNested,
  MaxLength,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateLineItemDto } from './create-line-item.dto';

export class CreateQuoteDto {
  @ApiProperty({
    description: 'Client ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  clientId: string;

  @ApiProperty({
    description: 'Client address ID',
    example: '880e8400-e29b-41d4-a716-446655440000',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  addressId?: string;

  @ApiProperty({
    description: 'Quote title',
    example: 'Monthly Lawn Care Package',
  })
  @IsString()
  @MaxLength(255)
  title: string;

  @ApiProperty({
    description: 'Quote description',
    example: 'Comprehensive lawn care services for the month of June',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Quote line items',
    type: [CreateLineItemDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateLineItemDto)
  lineItems: CreateLineItemDto[];

  @ApiProperty({
    description: 'Tax rate (as decimal, e.g., 0.0825 for 8.25%)',
    example: 0.0825,
    default: 0,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(1)
  taxRate?: number = 0;

  @ApiProperty({
    description: 'Discount amount',
    example: 25.00,
    default: 0,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  discountAmount?: number = 0;

  @ApiProperty({
    description: 'Whether a deposit is required',
    example: true,
    default: false,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  depositRequired?: boolean = false;

  @ApiProperty({
    description: 'Deposit amount',
    example: 100.00,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  depositAmount?: number;

  @ApiProperty({
    description: 'Quote expiry date',
    example: '2025-12-31',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  expiryDate?: string;

  @ApiProperty({
    description: 'Introduction text for the quote',
    example: 'Thank you for considering our services. We are pleased to provide you with the following quote.',
    required: false,
  })
  @IsString()
  @IsOptional()
  introduction?: string;

  @ApiProperty({
    description: 'Terms and conditions',
    example: 'Payment is due within 30 days of invoice date. Late payments subject to 1.5% monthly interest.',
    required: false,
  })
  @IsString()
  @IsOptional()
  terms?: string;
}
