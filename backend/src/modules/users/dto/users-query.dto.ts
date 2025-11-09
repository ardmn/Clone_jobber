import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsInt, Min, IsString, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class UsersQueryDto {
  @ApiProperty({
    description: 'Page number for pagination',
    example: 1,
    required: false,
    minimum: 1,
  })
  @Type(() => Number)
  @IsInt({ message: 'Page must be an integer' })
  @Min(1, { message: 'Page must be at least 1' })
  @IsOptional()
  page?: number = 1;

  @ApiProperty({
    description: 'Number of items per page',
    example: 10,
    required: false,
    minimum: 1,
  })
  @Type(() => Number)
  @IsInt({ message: 'Limit must be an integer' })
  @Min(1, { message: 'Limit must be at least 1' })
  @IsOptional()
  limit?: number = 10;

  @ApiProperty({
    description: 'Search term to filter users by name or email',
    example: 'john',
    required: false,
  })
  @IsString({ message: 'Search must be a string' })
  @IsOptional()
  search?: string;

  @ApiProperty({
    description: 'Filter by user role',
    example: 'worker',
    enum: ['owner', 'admin', 'manager', 'dispatcher', 'worker', 'limited_worker'],
    required: false,
  })
  @IsString({ message: 'Role must be a string' })
  @IsIn(['owner', 'admin', 'manager', 'dispatcher', 'worker', 'limited_worker'], {
    message: 'Role must be one of: owner, admin, manager, dispatcher, worker, limited_worker',
  })
  @IsOptional()
  role?: string;

  @ApiProperty({
    description: 'Filter by user status',
    example: 'active',
    enum: ['active', 'inactive'],
    required: false,
  })
  @IsString({ message: 'Status must be a string' })
  @IsIn(['active', 'inactive'], {
    message: 'Status must be either active or inactive',
  })
  @IsOptional()
  status?: string;
}
