import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsArray, IsUUID } from 'class-validator';

export class AvailabilityQueryDto {
  @ApiProperty({
    description: 'User IDs to check availability for',
    example: ['770e8400-e29b-41d4-a716-446655440000', '880e8400-e29b-41d4-a716-446655440000'],
    type: [String],
  })
  @IsArray()
  @IsUUID('4', { each: true })
  userIds: string[];

  @ApiProperty({
    description: 'Start date/time to check (ISO format)',
    example: '2025-02-01T09:00:00.000Z',
  })
  @IsDateString()
  startDate: string;

  @ApiProperty({
    description: 'End date/time to check (ISO format)',
    example: '2025-02-01T11:00:00.000Z',
  })
  @IsDateString()
  endDate: string;
}
