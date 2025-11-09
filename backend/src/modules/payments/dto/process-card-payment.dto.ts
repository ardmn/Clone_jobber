import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID, IsNumber, IsString, IsBoolean, IsOptional, Min } from 'class-validator';

export class ProcessCardPaymentDto {
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
    description: 'Stripe payment method ID',
    example: 'pm_1234567890abcdef',
  })
  @IsString()
  paymentMethodId: string;

  @ApiPropertyOptional({
    description: 'Save card for future use',
    example: true,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  saveCard?: boolean;

  @ApiPropertyOptional({
    description: 'Payment notes',
    example: 'Payment via credit card',
  })
  @IsString()
  @IsOptional()
  notes?: string;
}
