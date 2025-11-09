import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsUUID } from 'class-validator';

export class ConflictsQueryDto {
  @ApiProperty({
    description: 'User ID to check conflicts for',
    example: '770e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  userId: string;

  @ApiProperty({
    description: 'Start date/time (ISO format)',
    example: '2025-02-01T09:00:00.000Z',
  })
  @IsDateString()
  startDate: string;

  @ApiProperty({
    description: 'End date/time (ISO format)',
    example: '2025-02-01T11:00:00.000Z',
  })
  @IsDateString()
  endDate: string;
}
