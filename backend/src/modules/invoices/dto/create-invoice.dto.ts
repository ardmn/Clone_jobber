import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsUUID,
  IsArray,
  IsNumber,
  IsOptional,
  IsDateString,
  ValidateNested,
  Min,
  Max,
  MaxLength,
  IsBoolean,
  IsInt,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateLineItemDto } from './create-line-item.dto';

export class CreateInvoiceDto {
  @ApiProperty({
    description: 'Client ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  clientId: string;

  @ApiPropertyOptional({
    description: 'Job ID (if invoice is created from a job)',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @IsUUID()
  @IsOptional()
  jobId?: string;

  @ApiProperty({
    description: 'Invoice title',
    example: 'Lawn Care Service - March 2025',
  })
  @IsString()
  @MaxLength(255)
  title: string;

  @ApiPropertyOptional({
    description: 'Invoice description',
    example: 'Monthly lawn care services including mowing, edging, and cleanup',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Array of line items',
    type: [CreateLineItemDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateLineItemDto)
  lineItems: CreateLineItemDto[];

  @ApiPropertyOptional({
    description: 'Tax rate (as decimal, e.g., 0.0875 for 8.75%)',
    example: 0.0875,
    minimum: 0,
    maximum: 1,
    default: 0,
  })
  @IsNumber()
  @Min(0)
  @Max(1)
  @IsOptional()
  taxRate?: number;

  @ApiPropertyOptional({
    description: 'Discount amount',
    example: 10.00,
    minimum: 0,
    default: 0,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  discountAmount?: number;

  @ApiPropertyOptional({
    description: 'Due date (ISO 8601 date)',
    example: '2025-04-01',
  })
  @IsDateString()
  @IsOptional()
  dueDate?: string;

  @ApiPropertyOptional({
    description: 'Payment terms in days',
    example: 30,
    minimum: 0,
    default: 30,
  })
  @IsInt()
  @Min(0)
  @IsOptional()
  paymentTerms?: number;

  @ApiPropertyOptional({
    description: 'Whether late fees are enabled',
    example: true,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  lateFeeEnabled?: boolean;

  @ApiPropertyOptional({
    description: 'Late fee percentage (as decimal, e.g., 0.015 for 1.5%)',
    example: 0.015,
    minimum: 0,
    maximum: 1,
  })
  @IsNumber()
  @Min(0)
  @Max(1)
  @IsOptional()
  lateFeePercentage?: number;

  @ApiPropertyOptional({
    description: 'Internal notes (not visible to client)',
    example: 'Client requested invoice to be sent via email',
  })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({
    description: 'Terms and conditions',
    example: 'Payment is due within 30 days. Late payments may incur fees.',
  })
  @IsString()
  @IsOptional()
  terms?: string;
}
