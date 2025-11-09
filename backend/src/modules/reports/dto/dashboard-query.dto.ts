import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsOptional } from 'class-validator';

export class DashboardQueryDto {
  @ApiProperty({
    description: 'Start date for dashboard metrics (ISO format)',
    example: '2025-01-01',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiProperty({
    description: 'End date for dashboard metrics (ISO format)',
    example: '2025-12-31',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  endDate?: string;
}
