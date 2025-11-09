import { ApiProperty } from '@nestjs/swagger';
import {
  IsUUID,
  IsOptional,
  IsNumber,
  IsString,
  Min,
  Max,
} from 'class-validator';

export class ClockInDto {
  @ApiProperty({
    description: 'Job ID to clock in to (optional)',
    example: '550e8400-e29b-41d4-a716-446655440000',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  jobId?: string;

  @ApiProperty({
    description: 'Latitude of clock-in location',
    example: 40.7128,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @ApiProperty({
    description: 'Longitude of clock-in location',
    example: -74.006,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @ApiProperty({
    description: 'Notes for this time entry',
    example: 'Starting lawn maintenance',
    required: false,
  })
  @IsString()
  @IsOptional()
  notes?: string;
}
