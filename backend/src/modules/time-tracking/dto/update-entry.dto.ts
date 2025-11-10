import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsOptional,
  IsString,
  IsBoolean,
  IsIn,
} from 'class-validator';

export class UpdateEntryDto {
  @ApiProperty({
    description: 'Start time of entry',
    example: '2025-02-01T09:00:00.000Z',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  startTime?: string;

  @ApiProperty({
    description: 'End time of entry',
    example: '2025-02-01T11:00:00.000Z',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  endTime?: string;

  @ApiProperty({
    description: 'Notes for this time entry',
    example: 'Updated entry notes',
    required: false,
  })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({
    description: 'Whether this entry is billable',
    example: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isBillable?: boolean;

  @ApiProperty({
    description: 'Type of time entry',
    example: 'job',
    enum: ['job', 'travel', 'break', 'admin'],
    required: false,
  })
  @IsString()
  @IsOptional()
  @IsIn(['job', 'travel', 'break', 'admin'])
  entryType?: string;
}
