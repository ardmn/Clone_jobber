import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsUUID, IsIn, MaxLength } from 'class-validator';

export class GenerateUploadUrlDto {
  @ApiProperty({
    description: 'Name of the file to upload',
    example: 'invoice-receipt.pdf',
    maxLength: 255,
  })
  @IsString()
  @MaxLength(255)
  fileName: string;

  @ApiProperty({
    description: 'MIME type of the file',
    example: 'application/pdf',
    maxLength: 100,
  })
  @IsString()
  @MaxLength(100)
  fileType: string;

  @ApiProperty({
    description: 'Type of entity this file belongs to',
    example: 'invoice',
    enum: ['job', 'invoice', 'quote', 'client', 'user', 'general'],
    required: false,
  })
  @IsString()
  @IsOptional()
  @IsIn(['job', 'invoice', 'quote', 'client', 'user', 'general'])
  entityType?: string;

  @ApiProperty({
    description: 'ID of the entity this file belongs to',
    example: '550e8400-e29b-41d4-a716-446655440000',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  entityId?: string;

  @ApiProperty({
    description: 'Optional description of the file',
    example: 'Invoice payment receipt',
    required: false,
    maxLength: 500,
  })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;
}
