import { IsString, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SendSmsDto {
  @ApiPropertyOptional({ description: 'Client ID to associate with this SMS' })
  @IsOptional()
  @IsUUID()
  clientId?: string;

  @ApiProperty({ description: 'Recipient phone number', example: '+1234567890' })
  @IsString()
  to: string;

  @ApiProperty({ description: 'SMS message body', example: 'Your appointment is confirmed for tomorrow at 2 PM' })
  @IsString()
  body: string;
}
