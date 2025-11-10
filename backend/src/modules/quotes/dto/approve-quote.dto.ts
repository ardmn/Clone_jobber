import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class ApproveQuoteDto {
  @ApiProperty({
    description: 'Client signature (base64 encoded)',
    example: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA...',
  })
  @IsString()
  signature: string;

  @ApiProperty({
    description: 'Client IP address',
    example: '192.168.1.100',
    required: false,
  })
  @IsString()
  @IsOptional()
  ipAddress?: string;
}
