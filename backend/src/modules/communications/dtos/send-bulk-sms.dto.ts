import { IsString, IsArray, ArrayMinSize } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendBulkSmsDto {
  @ApiProperty({
    description: 'Array of recipient phone numbers',
    type: [String],
    example: ['+1234567890', '+0987654321'],
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  recipients: string[];

  @ApiProperty({ description: 'SMS message body', example: 'Important announcement for all clients' })
  @IsString()
  body: string;
}
