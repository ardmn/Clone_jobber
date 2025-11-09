import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID, IsNumber, IsString, IsOptional, Min } from 'class-validator';

export class ProcessBankPaymentDto {
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
    description: 'Stripe bank account token or payment method ID',
    example: 'pm_1234567890abcdef',
  })
  @IsString()
  bankAccountToken: string;

  @ApiPropertyOptional({
    description: 'Payment notes',
    example: 'ACH payment from checking account',
  })
  @IsString()
  @IsOptional()
  notes?: string;
}
