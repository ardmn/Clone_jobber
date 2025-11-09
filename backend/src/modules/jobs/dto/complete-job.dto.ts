import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class CompleteJobDto {
  @ApiProperty({
    description: 'Client signature (base64 encoded)',
    example: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA...',
  })
  @IsString()
  signature: string;

  @ApiProperty({
    description: 'Completion notes',
    example: 'Job completed successfully. Client was very satisfied.',
    required: false,
  })
  @IsString()
  @IsOptional()
  completionNotes?: string;
}
