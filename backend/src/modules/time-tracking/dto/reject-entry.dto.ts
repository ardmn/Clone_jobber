import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class RejectEntryDto {
  @ApiProperty({
    description: 'Reason for rejecting the time entry',
    example: 'Time entry overlaps with another entry',
  })
  @IsString()
  @IsNotEmpty()
  reason: string;
}
