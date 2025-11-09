import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength, IsOptional } from 'class-validator';

export class RegisterDto {
  @ApiProperty({
    description: 'Email address for the account',
    example: 'john@example.com',
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @ApiProperty({
    description: 'Password for the account (minimum 8 characters)',
    example: 'SecurePass123!',
    minLength: 8,
  })
  @IsString({ message: 'Password must be a string' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @IsNotEmpty({ message: 'Password is required' })
  password: string;

  @ApiProperty({
    description: 'First name of the account owner',
    example: 'John',
  })
  @IsString({ message: 'First name must be a string' })
  @IsNotEmpty({ message: 'First name is required' })
  firstName: string;

  @ApiProperty({
    description: 'Last name of the account owner',
    example: 'Doe',
  })
  @IsString({ message: 'Last name must be a string' })
  @IsNotEmpty({ message: 'Last name is required' })
  lastName: string;

  @ApiProperty({
    description: 'Company name for the account',
    example: 'Acme Services Inc.',
  })
  @IsString({ message: 'Company name must be a string' })
  @IsNotEmpty({ message: 'Company name is required' })
  companyName: string;

  @ApiProperty({
    description: 'Phone number (optional)',
    example: '+1234567890',
    required: false,
  })
  @IsString({ message: 'Phone must be a string' })
  @IsOptional()
  phone?: string;
}
