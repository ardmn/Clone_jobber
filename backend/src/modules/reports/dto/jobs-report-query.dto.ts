import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsIn, IsString } from 'class-validator';

export class JobsReportQueryDto {
  @ApiProperty({
    description: 'Start date for jobs report (ISO format)',
    example: '2025-01-01',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiProperty({
    description: 'End date for jobs report (ISO format)',
    example: '2025-12-31',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiProperty({
    description: 'Filter by job status',
    example: 'completed',
    enum: ['scheduled', 'en_route', 'in_progress', 'on_hold', 'completed', 'cancelled'],
    required: false,
  })
  @IsString()
  @IsOptional()
  @IsIn(['scheduled', 'en_route', 'in_progress', 'on_hold', 'completed', 'cancelled'])
  status?: string;
}
