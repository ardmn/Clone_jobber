import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsNumber,
  IsUUID,
  IsIn,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export class FilesQueryDto {
  @ApiProperty({
    description: 'Page number for pagination',
    example: 1,
    default: 1,
    required: false,
  })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  @Min(1)
  page?: number = 1;

  @ApiProperty({
    description: 'Number of items per page',
    example: 50,
    default: 50,
    maximum: 100,
    required: false,
  })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(100)
  limit?: number = 50;

  @ApiProperty({
    description: 'Filter by entity type',
    example: 'invoice',
    enum: ['job', 'invoice', 'quote', 'client', 'user', 'general'],
    required: false,
  })
  @IsString()
  @IsOptional()
  @IsIn(['job', 'invoice', 'quote', 'client', 'user', 'general'])
  entityType?: string;

  @ApiProperty({
    description: 'Filter by entity ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  entityId?: string;

  @ApiProperty({
    description: 'Filter by MIME type',
    example: 'application/pdf',
    required: false,
  })
  @IsString()
  @IsOptional()
  mimeType?: string;
}
