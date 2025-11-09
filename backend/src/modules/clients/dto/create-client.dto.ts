import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsEmail,
  IsOptional,
  IsArray,
  IsIn,
  IsNumber,
  IsObject,
  ValidateNested,
  MaxLength,
  Min,
  Max,
  Validate,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateContactDto } from './create-contact.dto';
import { CreateAddressDto } from './create-address.dto';

@ValidatorConstraint({ name: 'ClientNameValidator', async: false })
export class ClientNameValidator implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments) {
    const object = args.object as CreateClientDto;
    const hasPersonName = (object.firstName && object.lastName) || false;
    const hasCompanyName = object.companyName || false;
    return hasPersonName || hasCompanyName;
  }

  defaultMessage(args: ValidationArguments) {
    return 'Either firstName and lastName, or companyName must be provided';
  }
}

export class CreateClientDto {
  @ApiProperty({
    description: 'Client first name (required if companyName is not provided)',
    example: 'John',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  firstName?: string;

  @ApiProperty({
    description: 'Client last name (required if companyName is not provided)',
    example: 'Doe',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  lastName?: string;

  @ApiProperty({
    description: 'Company name (required if firstName/lastName are not provided)',
    example: 'Acme Corporation',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  @Validate(ClientNameValidator)
  companyName?: string;

  @ApiProperty({
    description: 'Client email address',
    example: 'contact@example.com',
    required: false,
  })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({
    description: 'Client phone number',
    example: '+1-555-123-4567',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  phone?: string;

  @ApiProperty({
    description: 'Tags for categorizing the client',
    example: ['VIP', 'Commercial'],
    required: false,
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @ApiProperty({
    description: 'Type of client',
    example: 'residential',
    enum: ['residential', 'commercial'],
    default: 'residential',
    required: false,
  })
  @IsString()
  @IsOptional()
  @IsIn(['residential', 'commercial'])
  clientType?: string = 'residential';

  @ApiProperty({
    description: 'Payment terms in days',
    example: 30,
    default: 30,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(365)
  paymentTerms?: number = 30;

  @ApiProperty({
    description: 'Credit limit amount',
    example: 10000.00,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  creditLimit?: number;

  @ApiProperty({
    description: 'Custom fields for additional client data',
    example: { preferredContactMethod: 'email', accountNumber: 'ACC-12345' },
    required: false,
  })
  @IsObject()
  @IsOptional()
  customFields?: Record<string, any>;

  @ApiProperty({
    description: 'Internal notes about the client (not visible to client)',
    example: 'Prefers morning appointments',
    required: false,
  })
  @IsString()
  @IsOptional()
  internalNotes?: string;

  @ApiProperty({
    description: 'Client contacts',
    type: [CreateContactDto],
    required: false,
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateContactDto)
  @IsOptional()
  contacts?: CreateContactDto[];

  @ApiProperty({
    description: 'Client addresses',
    type: [CreateAddressDto],
    required: false,
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateAddressDto)
  @IsOptional()
  addresses?: CreateAddressDto[];
}
