import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsIn } from 'class-validator';

export class UpdateStatusDto {
  @ApiProperty({
    description: 'Job status',
    example: 'in_progress',
    enum: ['scheduled', 'en_route', 'in_progress', 'on_hold', 'completed', 'cancelled'],
  })
  @IsString()
  @IsIn(['scheduled', 'en_route', 'in_progress', 'on_hold', 'completed', 'cancelled'])
  status: string;
}
