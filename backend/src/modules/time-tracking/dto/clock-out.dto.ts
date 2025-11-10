import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Min, Max } from 'class-validator';

export class ClockOutDto {
  @ApiProperty({
    description: 'Latitude of clock-out location',
    example: 40.7128,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @ApiProperty({
    description: 'Longitude of clock-out location',
    example: -74.006,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @ApiProperty({
    description: 'Notes for clock-out',
    example: 'Completed lawn maintenance',
    required: false,
  })
  @IsString()
  @IsOptional()
  notes?: string;
}
