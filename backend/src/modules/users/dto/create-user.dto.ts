import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  IsOptional,
  IsIn,
  MaxLength,
} from 'class-validator';

export class CreateUserDto {
  @ApiProperty({
    description: 'User email address',
    example: 'jane.smith@example.com',
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @ApiProperty({
    description: 'User password (minimum 8 characters)',
    example: 'SecurePass123!',
    minLength: 8,
  })
  @IsString({ message: 'Password must be a string' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @IsNotEmpty({ message: 'Password is required' })
  password: string;

  @ApiProperty({
    description: 'User first name',
    example: 'Jane',
  })
  @IsString({ message: 'First name must be a string' })
  @MaxLength(100, { message: 'First name must not exceed 100 characters' })
  @IsNotEmpty({ message: 'First name is required' })
  firstName: string;

  @ApiProperty({
    description: 'User last name',
    example: 'Smith',
  })
  @IsString({ message: 'Last name must be a string' })
  @MaxLength(100, { message: 'Last name must not exceed 100 characters' })
  @IsNotEmpty({ message: 'Last name is required' })
  lastName: string;

  @ApiProperty({
    description: 'User phone number',
    example: '+1234567890',
    required: false,
  })
  @IsString({ message: 'Phone must be a string' })
  @MaxLength(50, { message: 'Phone must not exceed 50 characters' })
  @IsOptional()
  phone?: string;

  @ApiProperty({
    description: 'User role in the organization',
    example: 'worker',
    enum: ['owner', 'admin', 'manager', 'dispatcher', 'worker', 'limited_worker'],
  })
  @IsString({ message: 'Role must be a string' })
  @IsIn(['owner', 'admin', 'manager', 'dispatcher', 'worker', 'limited_worker'], {
    message: 'Role must be one of: owner, admin, manager, dispatcher, worker, limited_worker',
  })
  @IsNotEmpty({ message: 'Role is required' })
  role: string;
}
