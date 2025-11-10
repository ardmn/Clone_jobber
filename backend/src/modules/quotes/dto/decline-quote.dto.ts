import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class DeclineQuoteDto {
  @ApiProperty({
    description: 'Reason for declining the quote',
    example: 'Found a better price elsewhere',
    required: false,
  })
  @IsString()
  @IsOptional()
  reason?: string;
}
