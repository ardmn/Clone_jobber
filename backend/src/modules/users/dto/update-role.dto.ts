import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsIn } from 'class-validator';

export class UpdateRoleDto {
  @ApiProperty({
    description: 'User role in the organization',
    example: 'manager',
    enum: ['owner', 'admin', 'manager', 'dispatcher', 'worker', 'limited_worker'],
  })
  @IsString({ message: 'Role must be a string' })
  @IsIn(['owner', 'admin', 'manager', 'dispatcher', 'worker', 'limited_worker'], {
    message: 'Role must be one of: owner, admin, manager, dispatcher, worker, limited_worker',
  })
  @IsNotEmpty({ message: 'Role is required' })
  role: string;
}
