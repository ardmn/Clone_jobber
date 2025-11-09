import { IsString, IsEmail, IsOptional, IsArray, IsObject, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SendEmailDto {
  @ApiPropertyOptional({ description: 'Client ID to associate with this email' })
  @IsOptional()
  @IsUUID()
  clientId?: string;

  @ApiProperty({ description: 'Recipient email address', example: 'client@example.com' })
  @IsEmail()
  to: string;

  @ApiPropertyOptional({ description: 'CC email addresses', type: [String] })
  @IsOptional()
  @IsArray()
  @IsEmail({}, { each: true })
  cc?: string[];

  @ApiPropertyOptional({ description: 'BCC email addresses', type: [String] })
  @IsOptional()
  @IsArray()
  @IsEmail({}, { each: true })
  bcc?: string[];

  @ApiProperty({ description: 'Email subject', example: 'Your appointment is confirmed' })
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

  @ApiPropertyOptional({ description: 'SendGrid template ID' })
  @IsOptional()
  @IsString()
  templateId?: string;

  @ApiPropertyOptional({
    description: 'Dynamic template data',
    example: { customerName: 'John Doe', appointmentDate: '2024-01-15' },
  })
  @IsOptional()
  @IsObject()
  dynamicData?: Record<string, any>;
}
