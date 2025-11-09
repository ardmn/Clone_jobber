import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail, IsBoolean, IsOptional, IsNotEmpty, MaxLength } from 'class-validator';

export class CreateContactDto {
  @ApiProperty({
    description: 'Contact first name',
    example: 'John',
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  firstName: string;

  @ApiProperty({
    description: 'Contact last name',
    example: 'Doe',
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  lastName: string;

  @ApiProperty({
    description: 'Contact email address',
    example: 'john.doe@example.com',
    required: false,
  })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({
    description: 'Contact phone number',
    example: '+1-555-123-4567',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  phone?: string;

  @ApiProperty({
    description: 'Contact role or title',
    example: 'Property Manager',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  role?: string;

  @ApiProperty({
    description: 'Whether this is the primary contact',
    example: false,
    default: false,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isPrimary?: boolean = false;
}
