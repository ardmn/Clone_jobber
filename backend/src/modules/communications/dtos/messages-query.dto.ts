import { IsOptional, IsInt, Min, Max, IsString, IsEnum, IsUUID, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export enum MessageType {
  EMAIL = 'email',
  SMS = 'sms',
}

export enum MessageDirection {
  INBOUND = 'inbound',
  OUTBOUND = 'outbound',
}

export enum MessageStatus {
  PENDING = 'pending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  FAILED = 'failed',
  OPENED = 'opened',
  CLICKED = 'clicked',
}

export class MessagesQueryDto {
  @ApiPropertyOptional({ description: 'Page number', default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({ description: 'Filter by message type', enum: MessageType })
  @IsOptional()
  @IsEnum(MessageType)
  messageType?: MessageType;

  @ApiPropertyOptional({ description: 'Filter by message direction', enum: MessageDirection })
  @IsOptional()
  @IsEnum(MessageDirection)
  direction?: MessageDirection;

  @ApiPropertyOptional({ description: 'Filter by message status', enum: MessageStatus })
  @IsOptional()
  @IsEnum(MessageStatus)
  status?: MessageStatus;

  @ApiPropertyOptional({ description: 'Filter by client ID' })
  @IsOptional()
  @IsUUID()
  clientId?: string;

  @ApiPropertyOptional({ description: 'Filter by start date (ISO 8601)', example: '2024-01-01' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Filter by end date (ISO 8601)', example: '2024-12-31' })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
