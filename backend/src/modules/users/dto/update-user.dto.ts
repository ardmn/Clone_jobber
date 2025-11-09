import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, IsUrl } from 'class-validator';

export class UpdateUserDto {
  @ApiProperty({
    description: 'User first name',
    example: 'Jane',
    required: false,
  })
  @IsString({ message: 'First name must be a string' })
  @MaxLength(100, { message: 'First name must not exceed 100 characters' })
  @IsOptional()
  firstName?: string;

  @ApiProperty({
    description: 'User last name',
    example: 'Smith',
    required: false,
  })
  @IsString({ message: 'Last name must be a string' })
  @MaxLength(100, { message: 'Last name must not exceed 100 characters' })
  @IsOptional()
  lastName?: string;

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
    description: 'URL to user avatar image',
    example: 'https://example.com/avatars/user123.jpg',
    required: false,
  })
  @IsUrl({}, { message: 'Avatar URL must be a valid URL' })
  @IsOptional()
  avatarUrl?: string;
}
