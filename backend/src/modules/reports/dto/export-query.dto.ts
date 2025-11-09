import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsIn, IsString } from 'class-validator';

export class ExportQueryDto {
  @ApiProperty({
    description: 'Type of report to export',
    example: 'revenue',
    enum: ['dashboard', 'revenue', 'jobs', 'clients', 'time-tracking'],
  })
  @IsString()
  @IsIn(['dashboard', 'revenue', 'jobs', 'clients', 'time-tracking'])
  reportType: string;

  @ApiProperty({
    description: 'Start date for export (ISO format)',
    example: '2025-01-01',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiProperty({
    description: 'End date for export (ISO format)',
    example: '2025-12-31',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  endDate?: string;
}
