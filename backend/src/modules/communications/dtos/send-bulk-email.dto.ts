import { IsString, IsEmail, IsArray, IsOptional, ArrayMinSize } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SendBulkEmailDto {
  @ApiProperty({
    description: 'Array of recipient email addresses',
    type: [String],
    example: ['client1@example.com', 'client2@example.com'],
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsEmail({}, { each: true })
  recipients: string[];

  @ApiProperty({ description: 'Email subject', example: 'Important announcement' })
  @IsString()
  subject: string;

  @ApiPropertyOptional({ description: 'Plain text body' })
  @IsOptional()
  @IsString()
  body?: string;

  @ApiPropertyOptional({ description: 'HTML body' })
  @IsOptional()
  @IsString()
  html?: string;
}
