import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateAccountDto {
  @ApiProperty({
    description: 'Account name',
    example: 'John Doe',
    required: false,
  })
  @IsString({ message: 'Name must be a string' })
  @MaxLength(255, { message: 'Name must not exceed 255 characters' })
  @IsOptional()
  name?: string;

  @ApiProperty({
    description: 'Company name',
    example: 'Acme Services Inc.',
    required: false,
  })
  @IsString({ message: 'Company name must be a string' })
  @MaxLength(255, { message: 'Company name must not exceed 255 characters' })
  @IsOptional()
  companyName?: string;

  @ApiProperty({
    description: 'Contact email address',
    example: 'contact@acme.com',
    required: false,
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsOptional()
  email?: string;

  @ApiProperty({
    description: 'Contact phone number',
    example: '+1234567890',
    required: false,
  })
  @IsString({ message: 'Phone must be a string' })
  @MaxLength(50, { message: 'Phone must not exceed 50 characters' })
  @IsOptional()
  phone?: string;
}
