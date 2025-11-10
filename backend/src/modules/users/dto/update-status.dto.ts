import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsIn } from 'class-validator';

export class UpdateStatusDto {
  @ApiProperty({
    description: 'User account status',
    example: 'active',
    enum: ['active', 'inactive'],
  })
  @IsString({ message: 'Status must be a string' })
  @IsIn(['active', 'inactive'], {
    message: 'Status must be either active or inactive',
  })
  @IsNotEmpty({ message: 'Status is required' })
  status: string;
}
