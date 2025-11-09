import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsIn } from 'class-validator';

export class AddPhotoDto {
  @ApiProperty({
    description: 'URL of the uploaded photo file',
    example: 'https://s3.amazonaws.com/bucket/photos/abc123.jpg',
  })
  @IsString()
  fileUrl: string;

  @ApiProperty({
    description: 'File name',
    example: 'lawn-before-service.jpg',
  })
  @IsString()
  fileName: string;

  @ApiProperty({
    description: 'Photo caption',
    example: 'Lawn condition before service',
    required: false,
  })
  @IsString()
  @IsOptional()
  caption?: string;

  @ApiProperty({
    description: 'Type of photo',
    example: 'before',
    enum: ['before', 'during', 'after', 'general'],
    default: 'general',
    required: false,
  })
  @IsString()
  @IsIn(['before', 'during', 'after', 'general'])
  @IsOptional()
  photoType?: string = 'general';
}
