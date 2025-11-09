import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsArray, IsUUID, IsOptional } from 'class-validator';

export class UpdateScheduleDto {
  @ApiProperty({
    description: 'Scheduled start time',
    example: '2025-02-01T09:00:00.000Z',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  scheduledStart?: string;

  @ApiProperty({
    description: 'Scheduled end time',
    example: '2025-02-01T11:00:00.000Z',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  scheduledEnd?: string;

  @ApiProperty({
    description: 'Array of user IDs assigned to this job',
    example: ['770e8400-e29b-41d4-a716-446655440000'],
    type: [String],
    required: false,
  })
  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  assignedTo?: string[];
}
