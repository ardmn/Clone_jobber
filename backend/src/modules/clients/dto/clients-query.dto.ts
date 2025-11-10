import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsArray, IsIn, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class ClientsQueryDto {
  @ApiProperty({
    description: 'Page number for pagination',
    example: 1,
    default: 1,
    required: false,
  })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  @Min(1)
  page?: number = 1;

  @ApiProperty({
    description: 'Number of items per page',
    example: 50,
    default: 50,
    maximum: 100,
    required: false,
  })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(100)
  limit?: number = 50;

  @ApiProperty({
    description: 'Search term for firstName, lastName, companyName, email, or phone',
    example: 'John',
    required: false,
  })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiProperty({
    description: 'Filter by client status',
    example: 'active',
    enum: ['active', 'inactive', 'archived'],
    required: false,
  })
  @IsString()
  @IsOptional()
  @IsIn(['active', 'inactive', 'archived'])
  status?: string;

  @ApiProperty({
    description: 'Filter by tags',
    example: ['VIP', 'Commercial'],
    required: false,
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @ApiProperty({
    description: 'Filter by client type',
    example: 'residential',
    enum: ['residential', 'commercial'],
    required: false,
  })
  @IsString()
  @IsOptional()
  @IsIn(['residential', 'commercial'])
  clientType?: string;

  @ApiProperty({
    description: 'Field to sort by',
    example: 'createdAt',
    enum: ['createdAt', 'updatedAt', 'firstName', 'lastName', 'companyName'],
    required: false,
  })
  @IsString()
  @IsOptional()
  @IsIn(['createdAt', 'updatedAt', 'firstName', 'lastName', 'companyName'])
  sortBy?: string;

  @ApiProperty({
    description: 'Sort order',
    example: 'desc',
    enum: ['asc', 'desc'],
    default: 'desc',
    required: false,
  })
  @IsString()
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';
}
