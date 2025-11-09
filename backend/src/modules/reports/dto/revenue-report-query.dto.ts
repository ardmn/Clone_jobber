import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsIn, IsString } from 'class-validator';

export class RevenueReportQueryDto {
  @ApiProperty({
    description: 'Start date for revenue report (ISO format)',
    example: '2025-01-01',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiProperty({
    description: 'End date for revenue report (ISO format)',
    example: '2025-12-31',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiProperty({
    description: 'Group revenue data by time period',
    example: 'month',
    enum: ['day', 'week', 'month', 'year'],
    default: 'month',
    required: false,
  })
  @IsString()
  @IsOptional()
  @IsIn(['day', 'week', 'month', 'year'])
  groupBy?: string = 'month';
}
