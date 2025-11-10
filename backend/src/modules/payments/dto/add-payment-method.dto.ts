import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsString } from 'class-validator';

export class AddPaymentMethodDto {
  @ApiProperty({
    description: 'Client ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  clientId: string;

  @ApiProperty({
    description: 'Stripe payment method ID or token',
    example: 'pm_1234567890abcdef',
  })
  @IsString()
  paymentMethodId: string;
}
