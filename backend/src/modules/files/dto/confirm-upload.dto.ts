import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsPositive, MaxLength } from 'class-validator';

export class ConfirmUploadDto {
  @ApiProperty({
    description: 'S3 key where the file was uploaded',
    example: 'accounts/123e4567-e89b-12d3-a456-426614174000/files/abc123.pdf',
    maxLength: 500,
  })
  @IsString()
  @MaxLength(500)
  key: string;

  @ApiProperty({
    description: 'Name of the uploaded file',
    example: 'invoice-receipt.pdf',
    maxLength: 255,
  })
  @IsString()
  @MaxLength(255)
  fileName: string;

  @ApiProperty({
    description: 'Size of the uploaded file in bytes',
    example: 1048576,
  })
  @IsNumber()
  @IsPositive()
  fileSize: number;

  @ApiProperty({
    description: 'MIME type of the uploaded file',
    example: 'application/pdf',
    maxLength: 100,
  })
  @IsString()
  @MaxLength(100)
  mimeType: string;
}
