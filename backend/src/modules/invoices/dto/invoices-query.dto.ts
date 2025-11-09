import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsInt, Min, IsString, IsUUID, IsDateString, IsBoolean } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class InvoicesQueryDto {
  @ApiPropertyOptional({
    description: 'Page number',
    example: 1,
    minimum: 1,
    default: 1,
  })
  @IsInt()
  @Min(1)
  @Type(() => Number)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Items per page',
    example: 50,
    minimum: 1,
    default: 50,
  })
  @IsInt()
  @Min(1)
  @Type(() => Number)
  @IsOptional()
  limit?: number = 50;

  @ApiPropertyOptional({
    description: 'Filter by status',
    example: 'sent',
    enum: ['draft', 'sent', 'viewed', 'overdue', 'partial', 'paid', 'void'],
  })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({
    description: 'Filter by client ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  @IsOptional()
  clientId?: string;

  @ApiPropertyOptional({
    description: 'Filter by start date (ISO 8601)',
    example: '2025-01-01',
  })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'Filter by end date (ISO 8601)',
    example: '2025-12-31',
  })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Filter overdue invoices only',
    example: true,
  })
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsOptional()
  overdue?: boolean;

  @ApiPropertyOptional({
    description: 'Search query (searches in invoice number, title, description)',
    example: 'lawn care',
  })
  @IsString()
  @IsOptional()
  search?: string;
}
