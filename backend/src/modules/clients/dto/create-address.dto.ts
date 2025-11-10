import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsBoolean, IsOptional, IsNotEmpty, IsIn, MaxLength } from 'class-validator';

export class CreateAddressDto {
  @ApiProperty({
    description: 'Type of address',
    example: 'service',
    enum: ['billing', 'service', 'both'],
  })
  @IsString()
  @IsNotEmpty()
  @IsIn(['billing', 'service', 'both'])
  addressType: string;

  @ApiProperty({
    description: 'Address label for easy identification',
    example: 'Main Office',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  label?: string;

  @ApiProperty({
    description: 'Street address line 1',
    example: '123 Main Street',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  street1: string;

  @ApiProperty({
    description: 'Street address line 2',
    example: 'Suite 200',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  street2?: string;

  @ApiProperty({
    description: 'City',
    example: 'San Francisco',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  city: string;

  @ApiProperty({
    description: 'State or province',
    example: 'CA',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  state: string;

  @ApiProperty({
    description: 'Postal or ZIP code',
    example: '94102',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  postalCode: string;

  @ApiProperty({
    description: 'Country code (ISO 3166-1 alpha-2)',
    example: 'US',
    default: 'US',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(2)
  country?: string = 'US';

  @ApiProperty({
    description: 'Whether this is the primary address',
    example: false,
    default: false,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isPrimary?: boolean = false;
}
