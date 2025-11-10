import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsOptional,
  IsUUID,
  IsIn,
  IsString,
} from 'class-validator';

export class TimesheetQueryDto {
  @ApiProperty({
    description: 'Start date for timesheet (ISO format)',
    example: '2025-01-01',
  })
  @IsDateString()
  startDate: string;

  @ApiProperty({
    description: 'End date for timesheet (ISO format)',
    example: '2025-01-31',
  })
  @IsDateString()
  endDate: string;

  @ApiProperty({
    description: 'Filter by user ID',
    example: '770e8400-e29b-41d4-a716-446655440000',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  userId?: string;

  @ApiProperty({
    description: 'Group by day or week',
    example: 'day',
    enum: ['day', 'week'],
    default: 'day',
    required: false,
  })
  @IsString()
  @IsOptional()
  @IsIn(['day', 'week'])
  groupBy?: string = 'day';
}
