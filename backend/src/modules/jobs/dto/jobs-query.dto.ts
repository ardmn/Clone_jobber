import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsNumber,
  IsUUID,
  IsIn,
  Min,
  Max,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';

export class JobsQueryDto {
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
    description: 'Filter by job status',
    example: 'scheduled',
    enum: ['scheduled', 'en_route', 'in_progress', 'on_hold', 'completed', 'cancelled'],
    required: false,
  })
  @IsString()
  @IsOptional()
  @IsIn(['scheduled', 'en_route', 'in_progress', 'on_hold', 'completed', 'cancelled'])
  status?: string;

  @ApiProperty({
    description: 'Filter by assigned user ID',
    example: '770e8400-e29b-41d4-a716-446655440000',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  assignedTo?: string;

  @ApiProperty({
    description: 'Filter by start date (ISO format)',
    example: '2025-01-01',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiProperty({
    description: 'Filter by end date (ISO format)',
    example: '2025-12-31',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiProperty({
    description: 'Filter by priority',
    example: 'high',
    enum: ['low', 'normal', 'high', 'urgent'],
    required: false,
  })
  @IsString()
  @IsOptional()
  @IsIn(['low', 'normal', 'high', 'urgent'])
  priority?: string;
}
