import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID, IsNumber, IsString, IsOptional, IsDateString, Min, MaxLength } from 'class-validator';

export class CreatePaymentDto {
  @ApiProperty({
    description: 'Invoice ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  invoiceId: string;

  @ApiProperty({
    description: 'Payment amount',
    example: 108.75,
    minimum: 0.01,
  })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiProperty({
    description: 'Payment method',
    example: 'cash',
    enum: ['cash', 'check', 'card', 'bank', 'other'],
  })
  @IsString()
  @MaxLength(50)
  paymentMethod: string;

  @ApiPropertyOptional({
    description: 'Payment notes',
    example: 'Check number 1234',
  })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({
    description: 'Payment date (ISO 8601 timestamp)',
    example: '2025-03-15T10:30:00.000Z',
  })
  @IsDateString()
  @IsOptional()
  paymentDate?: string;
}
