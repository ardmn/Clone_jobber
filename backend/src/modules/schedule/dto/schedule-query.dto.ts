import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsOptional,
  IsArray,
  IsUUID,
  IsIn,
  IsString,
} from 'class-validator';

export class ScheduleQueryDto {
  @ApiProperty({
    description: 'Start date for schedule (ISO format)',
    example: '2025-02-01',
  })
  @IsDateString()
  startDate: string;

  @ApiProperty({
    description: 'End date for schedule (ISO format)',
    example: '2025-02-28',
  })
  @IsDateString()
  endDate: string;

  @ApiProperty({
    description: 'Filter by user IDs (assigned team members)',
    example: ['770e8400-e29b-41d4-a716-446655440000'],
    type: [String],
    required: false,
  })
  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  userIds?: string[];

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
}
