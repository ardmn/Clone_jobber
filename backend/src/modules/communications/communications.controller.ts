import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { CommunicationsService } from './communications.service';
import { SendEmailDto } from './dtos/send-email.dto';
import { SendSmsDto } from './dtos/send-sms.dto';
import { SendBulkEmailDto } from './dtos/send-bulk-email.dto';
import { SendBulkSmsDto } from './dtos/send-bulk-sms.dto';
import { CreateTemplateDto } from './dtos/create-template.dto';
import { MessagesQueryDto } from './dtos/messages-query.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Communications')
@ApiBearerAuth()
@Controller('communications')
@UseGuards(JwtAuthGuard)
export class CommunicationsController {
  constructor(private readonly communicationsService: CommunicationsService) {}

  @Post('email')
  @ApiOperation({
    summary: 'Send an email',
    description: 'Send a single email to a recipient via SendGrid',
  })
  @ApiResponse({
    status: 201,
    description: 'Email sent successfully',
    schema: {
      example: {
        success: true,
        messageId: '550e8400-e29b-41d4-a716-446655440000',
        providerMessageId: 'abc123xyz',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 500, description: 'Email service error' })
  async sendEmail(
    @CurrentUser('accountId') accountId: string,
    @CurrentUser('id') userId: string,
    @Body() sendEmailDto: SendEmailDto,
  ) {
    return this.communicationsService.sendEmail(accountId, userId, sendEmailDto);
  }

  @Post('sms')
  @ApiOperation({
    summary: 'Send an SMS',
    description: 'Send a single SMS message to a recipient via Twilio',
  })
  @ApiResponse({
    status: 201,
    description: 'SMS sent successfully',
    schema: {
      example: {
        success: true,
        messageId: '550e8400-e29b-41d4-a716-446655440000',
        providerMessageId: 'SM1234567890abcdef1234567890abcdef',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 500, description: 'SMS service error' })
  async sendSMS(
    @CurrentUser('accountId') accountId: string,
    @CurrentUser('id') userId: string,
    @Body() sendSmsDto: SendSmsDto,
  ) {
    return this.communicationsService.sendSMS(accountId, userId, sendSmsDto);
  }

  @Post('bulk-email')
  @ApiOperation({
    summary: 'Send bulk emails',
    description: 'Send the same email to multiple recipients via SendGrid',
  })
  @ApiResponse({
    status: 201,
    description: 'Bulk emails sent successfully',
    schema: {
      example: {
        success: true,
        totalSent: 5,
        messageIds: [
          '550e8400-e29b-41d4-a716-446655440000',
          '660e8400-e29b-41d4-a716-446655440001',
        ],
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 500, description: 'Email service error' })
  async sendBulkEmail(
    @CurrentUser('accountId') accountId: string,
    @CurrentUser('id') userId: string,
    @Body() sendBulkEmailDto: SendBulkEmailDto,
  ) {
    return this.communicationsService.sendBulkEmail(accountId, userId, sendBulkEmailDto);
  }

  @Post('bulk-sms')
  @ApiOperation({
    summary: 'Send bulk SMS',
    description: 'Send the same SMS message to multiple recipients via Twilio',
  })
  @ApiResponse({
    status: 201,
    description: 'Bulk SMS sent successfully',
    schema: {
      example: {
        success: true,
        totalSent: 5,
        messageIds: [
          '550e8400-e29b-41d4-a716-446655440000',
          '660e8400-e29b-41d4-a716-446655440001',
        ],
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 500, description: 'SMS service error' })
  async sendBulkSMS(
    @CurrentUser('accountId') accountId: string,
    @CurrentUser('id') userId: string,
    @Body() sendBulkSmsDto: SendBulkSmsDto,
  ) {
    return this.communicationsService.sendBulkSMS(accountId, userId, sendBulkSmsDto);
  }

  @Get('messages')
  @ApiOperation({
    summary: 'List messages',
    description: 'Get a paginated list of messages with optional filtering',
  })
  @ApiResponse({
    status: 200,
    description: 'Messages retrieved successfully',
    schema: {
      example: {
        data: [
          {
            id: '550e8400-e29b-41d4-a716-446655440000',
            accountId: '660e8400-e29b-41d4-a716-446655440000',
            clientId: '770e8400-e29b-41d4-a716-446655440000',
            messageType: 'email',
            direction: 'outbound',
            subject: 'Your appointment is confirmed',
            body: 'Hi John, your appointment is confirmed for tomorrow at 2 PM.',
            fromAddress: 'noreply@example.com',
            toAddress: 'john@example.com',
            status: 'sent',
            sentAt: '2025-01-01T12:00:00.000Z',
            deliveredAt: '2025-01-01T12:00:05.000Z',
            openedAt: null,
            clickedAt: null,
            failedAt: null,
            errorMessage: null,
            provider: 'sendgrid',
            providerMessageId: 'abc123xyz',
            relatedType: null,
            relatedId: null,
            sentBy: '880e8400-e29b-41d4-a716-446655440000',
            createdAt: '2025-01-01T12:00:00.000Z',
          },
        ],
        meta: {
          page: 1,
          limit: 20,
          total: 150,
          totalPages: 8,
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async listMessages(
    @CurrentUser('accountId') accountId: string,
    @Query() query: MessagesQueryDto,
  ) {
    return this.communicationsService.findAll(accountId, query);
  }

  @Get('messages/:id')
  @ApiOperation({
    summary: 'Get message by ID',
    description: 'Get a single message by ID',
  })
  @ApiParam({
    name: 'id',
    description: 'Message ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Message retrieved successfully',
    schema: {
      example: {
        id: '550e8400-e29b-41d4-a716-446655440000',
        accountId: '660e8400-e29b-41d4-a716-446655440000',
        clientId: '770e8400-e29b-41d4-a716-446655440000',
        messageType: 'email',
        direction: 'outbound',
        subject: 'Your appointment is confirmed',
        body: 'Hi John, your appointment is confirmed for tomorrow at 2 PM.',
        fromAddress: 'noreply@example.com',
        toAddress: 'john@example.com',
        status: 'delivered',
        sentAt: '2025-01-01T12:00:00.000Z',
        deliveredAt: '2025-01-01T12:00:05.000Z',
        openedAt: '2025-01-01T12:30:00.000Z',
        clickedAt: null,
        failedAt: null,
        errorMessage: null,
        provider: 'sendgrid',
        providerMessageId: 'abc123xyz',
        relatedType: 'job',
        relatedId: '990e8400-e29b-41d4-a716-446655440000',
        sentBy: '880e8400-e29b-41d4-a716-446655440000',
        createdAt: '2025-01-01T12:00:00.000Z',
        client: {
          id: '770e8400-e29b-41d4-a716-446655440000',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          phone: '+1234567890',
        },
        sender: {
          id: '880e8400-e29b-41d4-a716-446655440000',
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane@company.com',
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Message not found' })
  async getMessage(
    @Param('id') id: string,
    @CurrentUser('accountId') accountId: string,
  ) {
    return this.communicationsService.findById(id, accountId);
  }

  @Get('templates')
  @ApiOperation({
    summary: 'List message templates',
    description: 'Get all message templates (email and SMS)',
  })
  @ApiResponse({
    status: 200,
    description: 'Templates retrieved successfully',
    schema: {
      example: [
        {
          id: '1',
          name: 'Appointment Reminder',
          subject: 'Appointment Reminder',
          body: 'Hi {{customerName}}, this is a reminder about your appointment on {{appointmentDate}}.',
          html: null,
          templateType: 'email',
          accountId: '660e8400-e29b-41d4-a716-446655440000',
          createdAt: '2025-01-01T00:00:00.000Z',
        },
        {
          id: '2',
          name: 'Quote Sent',
          subject: 'Your Quote is Ready',
          body: 'Hi {{customerName}}, your quote for {{serviceName}} is ready. Total: {{total}}.',
          html: '<p>Hi {{customerName}},</p><p>Your quote for {{serviceName}} is ready. Total: <strong>{{total}}</strong>.</p>',
          templateType: 'email',
          accountId: '660e8400-e29b-41d4-a716-446655440000',
          createdAt: '2025-01-01T00:00:00.000Z',
        },
      ],
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async listTemplates(@CurrentUser('accountId') accountId: string) {
    return this.communicationsService.listTemplates(accountId);
  }

  @Post('templates')
  @ApiOperation({
    summary: 'Create message template',
    description: 'Create a new email or SMS template',
  })
  @ApiResponse({
    status: 201,
    description: 'Template created successfully',
    schema: {
      example: {
        id: 'template_1704067200000',
        name: 'Custom Reminder',
        subject: 'Important Reminder',
        body: 'Hi {{customerName}}, this is a custom reminder.',
        html: '<p>Hi {{customerName}},</p><p>This is a custom reminder.</p>',
        templateType: 'email',
        accountId: '660e8400-e29b-41d4-a716-446655440000',
        createdAt: '2025-01-01T00:00:00.000Z',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createTemplate(
    @CurrentUser('accountId') accountId: string,
    @Body() createTemplateDto: CreateTemplateDto,
  ) {
    return this.communicationsService.createTemplate(accountId, createTemplateDto);
  }
}
