import { IsString, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum TemplateType {
  EMAIL = 'email',
  SMS = 'sms',
}

export class CreateTemplateDto {
  @ApiProperty({ description: 'Template name', example: 'Appointment Reminder' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Template subject (for email)', example: 'Your appointment reminder' })
  @IsString()
  subject: string;

  @ApiPropertyOptional({ description: 'Plain text body' })
  @IsOptional()
  @IsString()
  body?: string;

  @ApiPropertyOptional({ description: 'HTML body (for email)' })
  @IsOptional()
  @IsString()
  html?: string;

  @ApiProperty({ description: 'Template type', enum: TemplateType, example: TemplateType.EMAIL })
  @IsEnum(TemplateType)
  templateType: TemplateType;
}
