import { PartialType } from '@nestjs/swagger';
import { CreateClientDto } from './create-client.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsIn } from 'class-validator';

export class UpdateClientDto extends PartialType(CreateClientDto) {
  @ApiProperty({
    description: 'Client status',
    example: 'active',
    enum: ['active', 'inactive', 'archived'],
    required: false,
  })
  @IsString()
  @IsOptional()
  @IsIn(['active', 'inactive', 'archived'])
  status?: string;
}
