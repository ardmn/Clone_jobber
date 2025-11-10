import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsIn, MaxLength } from 'class-validator';

export class UpdateSettingsDto {
  @ApiProperty({
    description: 'Timezone for the account',
    example: 'America/New_York',
    required: false,
  })
  @IsString({ message: 'Timezone must be a string' })
  @MaxLength(100, { message: 'Timezone must not exceed 100 characters' })
  @IsOptional()
  timezone?: string;

  @ApiProperty({
    description: 'Default currency code (ISO 4217)',
    example: 'USD',
    required: false,
    enum: ['USD', 'CAD', 'EUR', 'GBP', 'AUD'],
  })
  @IsString({ message: 'Currency must be a string' })
  @IsIn(['USD', 'CAD', 'EUR', 'GBP', 'AUD'], {
    message: 'Currency must be one of: USD, CAD, EUR, GBP, AUD',
  })
  @IsOptional()
  currency?: string;

  @ApiProperty({
    description: 'Date format preference',
    example: 'MM/DD/YYYY',
    required: false,
    enum: ['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD'],
  })
  @IsString({ message: 'Date format must be a string' })
  @IsIn(['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD'], {
    message: 'Date format must be one of: MM/DD/YYYY, DD/MM/YYYY, YYYY-MM-DD',
  })
  @IsOptional()
  dateFormat?: string;
}
