import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsUUID,
  IsArray,
  IsNumber,
  IsOptional,
  IsDateString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateJobDto {
  @ApiProperty({
    description: 'Client ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  clientId: string;

  @ApiProperty({
    description: 'Quote ID (if job created from quote)',
    example: '660e8400-e29b-41d4-a716-446655440000',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  quoteId?: string;

  @ApiProperty({
    description: 'Client address ID',
    example: '880e8400-e29b-41d4-a716-446655440000',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  addressId?: string;

  @ApiProperty({
    description: 'Job title',
    example: 'Monthly Lawn Care Service',
  })
  @IsString()
  @MaxLength(255)
  title: string;

  @ApiProperty({
    description: 'Job description',
    example: 'Mowing, edging, and cleanup',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

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

  @ApiProperty({
    description: 'Estimated value of the job',
    example: 250.00,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  estimatedValue?: number;

  @ApiProperty({
    description: 'Instructions for the team',
    example: 'Please use the side gate to access backyard',
    required: false,
  })
  @IsString()
  @IsOptional()
  instructions?: string;
}
