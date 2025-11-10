import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsString, IsOptional, Min } from 'class-validator';

export class RefundPaymentDto {
  @ApiProperty({
    description: 'Refund amount (leave empty for full refund)',
    example: 50.00,
    minimum: 0.01,
  })
  @IsNumber()
  @Min(0.01)
  @IsOptional()
  amount?: number;

  @ApiPropertyOptional({
    description: 'Refund reason',
    example: 'Customer requested refund',
  })
  @IsString()
  @IsOptional()
  reason?: string;
}
