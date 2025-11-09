import {
  Injectable,
  NotFoundException,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from '../../database/entities/message.entity';
import { Client } from '../../database/entities/client.entity';
import { SendGridService } from '../../integrations/sendgrid/sendgrid.service';
import { TwilioService } from '../../integrations/twilio/twilio.service';
import { SendEmailDto } from './dtos/send-email.dto';
import { SendSmsDto } from './dtos/send-sms.dto';
import { SendBulkEmailDto } from './dtos/send-bulk-email.dto';
import { SendBulkSmsDto } from './dtos/send-bulk-sms.dto';
import { CreateTemplateDto } from './dtos/create-template.dto';
import { MessagesQueryDto } from './dtos/messages-query.dto';

interface MessageTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  html?: string;
  templateType: string;
  accountId: string;
  createdAt: Date;
}

@Injectable()
export class CommunicationsService {
  private readonly logger = new Logger(CommunicationsService.name);
  private templates: MessageTemplate[] = [];

  constructor(
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
    @InjectRepository(Client)
    private readonly clientRepository: Repository<Client>,
    private readonly sendGridService: SendGridService,
    private readonly twilioService: TwilioService,
  ) {}

  /**
   * Send email
   */
  async sendEmail(accountId: string, userId: string, dto: SendEmailDto) {
    this.logger.log(`Sending email to ${dto.to} from account ${accountId}`);

    // Validate client if provided
    if (dto.clientId) {
      const client = await this.clientRepository.findOne({
        where: { id: dto.clientId, accountId },
      });

      if (!client) {
        throw new NotFoundException('Client not found');
      }
    }

    // Validate email body
    if (!dto.body && !dto.html && !dto.templateId) {
      throw new BadRequestException('Email must have body, html, or templateId');
    }

    try {
      // Send email via SendGrid
      const messageId = await this.sendGridService.sendEmail({
        to: dto.to,
        cc: dto.cc,
        bcc: dto.bcc,
        subject: dto.subject,
        text: dto.body,
        html: dto.html,
        templateId: dto.templateId,
        dynamicTemplateData: dto.dynamicData,
      });

      // Log message to database
      const message = await this.logMessage(accountId, {
        clientId: dto.clientId,
        messageType: 'email',
        direction: 'outbound',
        subject: dto.subject,
        body: dto.body || dto.html || 'Template email',
        fromAddress: 'noreply@example.com',
        toAddress: dto.to,
        status: 'sent',
        provider: 'sendgrid',
        providerMessageId: messageId,
        sentBy: userId,
        sentAt: new Date(),
      });

      this.logger.log(`Email sent successfully. Message ID: ${message.id}`);

      return {
        success: true,
        messageId: message.id,
        providerMessageId: messageId,
      };
    } catch (error) {
      this.logger.error(`Failed to send email: ${error.message}`, error.stack);

      // Log failed message to database
      await this.logMessage(accountId, {
        clientId: dto.clientId,
        messageType: 'email',
        direction: 'outbound',
        subject: dto.subject,
        body: dto.body || dto.html || 'Template email',
        fromAddress: 'noreply@example.com',
        toAddress: dto.to,
        status: 'failed',
        provider: 'sendgrid',
        errorMessage: error.message,
        sentBy: userId,
        failedAt: new Date(),
      });

      throw error;
    }
  }

  /**
   * Send SMS
   */
  async sendSMS(accountId: string, userId: string, dto: SendSmsDto) {
    this.logger.log(`Sending SMS to ${dto.to} from account ${accountId}`);

    // Validate client if provided
    if (dto.clientId) {
      const client = await this.clientRepository.findOne({
        where: { id: dto.clientId, accountId },
      });

      if (!client) {
        throw new NotFoundException('Client not found');
      }
    }

    // Validate phone number
    if (!this.twilioService.isValidPhoneNumber(dto.to)) {
      throw new BadRequestException('Invalid phone number format');
    }

    try {
      // Send SMS via Twilio
      const result = await this.twilioService.sendSMS(dto.to, dto.body);

      // Log message to database
      const message = await this.logMessage(accountId, {
        clientId: dto.clientId,
        messageType: 'sms',
        direction: 'outbound',
        subject: null,
        body: dto.body,
        fromAddress: result.to, // Twilio phone number
        toAddress: dto.to,
        status: 'sent',
        provider: 'twilio',
        providerMessageId: result.sid,
        sentBy: userId,
        sentAt: new Date(),
      });

      this.logger.log(`SMS sent successfully. Message ID: ${message.id}`);

      return {
        success: true,
        messageId: message.id,
        providerMessageId: result.sid,
      };
    } catch (error) {
      this.logger.error(`Failed to send SMS: ${error.message}`, error.stack);

      // Log failed message to database
      await this.logMessage(accountId, {
        clientId: dto.clientId,
        messageType: 'sms',
        direction: 'outbound',
        subject: null,
        body: dto.body,
        fromAddress: 'twilio',
        toAddress: dto.to,
        status: 'failed',
        provider: 'twilio',
        errorMessage: error.message,
        sentBy: userId,
        failedAt: new Date(),
      });

      throw error;
    }
  }

  /**
   * Send bulk email
   */
  async sendBulkEmail(accountId: string, userId: string, dto: SendBulkEmailDto) {
    this.logger.log(`Sending bulk email to ${dto.recipients.length} recipients from account ${accountId}`);

    // Validate email body
    if (!dto.body && !dto.html) {
      throw new BadRequestException('Email must have body or html');
    }

    try {
      // Send bulk email via SendGrid
      const messageIds = await this.sendGridService.sendBulkEmail(
        dto.recipients,
        dto.subject,
        dto.html || dto.body,
        dto.body,
      );

      // Log each message to database
      const messages = await Promise.all(
        dto.recipients.map(async (recipient, index) => {
          return this.logMessage(accountId, {
            messageType: 'email',
            direction: 'outbound',
            subject: dto.subject,
            body: dto.body || dto.html,
            fromAddress: 'noreply@example.com',
            toAddress: recipient,
            status: 'sent',
            provider: 'sendgrid',
            providerMessageId: messageIds[index] || 'unknown',
            sentBy: userId,
            sentAt: new Date(),
          });
        }),
      );

      this.logger.log(`Bulk email sent successfully to ${messages.length} recipients`);

      return {
        success: true,
        totalSent: messages.length,
        messageIds: messages.map(m => m.id),
      };
    } catch (error) {
      this.logger.error(`Failed to send bulk email: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Send bulk SMS
   */
  async sendBulkSMS(accountId: string, userId: string, dto: SendBulkSmsDto) {
    this.logger.log(`Sending bulk SMS to ${dto.recipients.length} recipients from account ${accountId}`);

    try {
      // Send bulk SMS via Twilio
      const results = await this.twilioService.sendBulkSMS(dto.recipients, dto.body);

      // Log each message to database
      const messages = await Promise.all(
        results.map(async (result) => {
          return this.logMessage(accountId, {
            messageType: 'sms',
            direction: 'outbound',
            subject: null,
            body: dto.body,
            fromAddress: 'twilio',
            toAddress: result.to,
            status: 'sent',
            provider: 'twilio',
            providerMessageId: result.sid,
            sentBy: userId,
            sentAt: new Date(),
          });
        }),
      );

      this.logger.log(`Bulk SMS sent successfully to ${messages.length} recipients`);

      return {
        success: true,
        totalSent: messages.length,
        messageIds: messages.map(m => m.id),
      };
    } catch (error) {
      this.logger.error(`Failed to send bulk SMS: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Find all messages with pagination and filters
   */
  async findAll(accountId: string, query: MessagesQueryDto) {
    const { page, limit, messageType, direction, status, clientId, startDate, endDate } = query;

    const queryBuilder = this.messageRepository
      .createQueryBuilder('message')
      .where('message.accountId = :accountId', { accountId })
      .leftJoinAndSelect('message.client', 'client')
      .leftJoinAndSelect('message.sender', 'sender');

    // Apply filters
    if (messageType) {
      queryBuilder.andWhere('message.messageType = :messageType', { messageType });
    }

    if (direction) {
      queryBuilder.andWhere('message.direction = :direction', { direction });
    }

    if (status) {
      queryBuilder.andWhere('message.status = :status', { status });
    }

    if (clientId) {
      queryBuilder.andWhere('message.clientId = :clientId', { clientId });
    }

    if (startDate) {
      queryBuilder.andWhere('message.createdAt >= :startDate', { startDate: new Date(startDate) });
    }

    if (endDate) {
      queryBuilder.andWhere('message.createdAt <= :endDate', { endDate: new Date(endDate) });
    }

    // Pagination
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    // Order by creation date
    queryBuilder.orderBy('message.createdAt', 'DESC');

    // Execute query
    const [messages, total] = await queryBuilder.getManyAndCount();

    return {
      data: messages,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Find message by ID
   */
  async findById(id: string, accountId: string) {
    const message = await this.messageRepository.findOne({
      where: { id, accountId },
      relations: ['client', 'sender'],
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    return message;
  }

  /**
   * List templates (mock data for now)
   */
  async listTemplates(accountId: string) {
    // Filter templates by account
    const accountTemplates = this.templates.filter(t => t.accountId === accountId);

    // Return mock templates if none exist
    if (accountTemplates.length === 0) {
      return [
        {
          id: '1',
          name: 'Appointment Reminder',
          subject: 'Appointment Reminder',
          body: 'Hi {{customerName}}, this is a reminder about your appointment on {{appointmentDate}}.',
          templateType: 'email',
          accountId,
          createdAt: new Date(),
        },
        {
          id: '2',
          name: 'Quote Sent',
          subject: 'Your Quote is Ready',
          body: 'Hi {{customerName}}, your quote for {{serviceName}} is ready. Total: {{total}}.',
          html: '<p>Hi {{customerName}},</p><p>Your quote for {{serviceName}} is ready. Total: <strong>{{total}}</strong>.</p>',
          templateType: 'email',
          accountId,
          createdAt: new Date(),
        },
        {
          id: '3',
          name: 'Invoice Reminder',
          subject: 'Invoice Due',
          body: 'Hi {{customerName}}, your invoice #{{invoiceNumber}} is due on {{dueDate}}. Amount: {{amount}}.',
          templateType: 'email',
          accountId,
          createdAt: new Date(),
        },
        {
          id: '4',
          name: 'SMS Appointment Reminder',
          subject: '',
          body: 'Hi {{customerName}}, reminder: appointment on {{appointmentDate}} at {{appointmentTime}}.',
          templateType: 'sms',
          accountId,
          createdAt: new Date(),
        },
      ];
    }

    return accountTemplates;
  }

  /**
   * Create template
   */
  async createTemplate(accountId: string, dto: CreateTemplateDto) {
    const template: MessageTemplate = {
      id: `template_${Date.now()}`,
      name: dto.name,
      subject: dto.subject,
      body: dto.body || '',
      html: dto.html,
      templateType: dto.templateType,
      accountId,
      createdAt: new Date(),
    };

    this.templates.push(template);

    this.logger.log(`Template created: ${template.id}`);

    return template;
  }

  /**
   * Log message to database
   */
  async logMessage(accountId: string, data: Partial<Message>): Promise<Message> {
    const message = this.messageRepository.create({
      accountId,
      ...data,
    });

    return this.messageRepository.save(message);
  }

  /**
   * Update message status
   */
  async updateMessageStatus(messageId: string, status: string, additionalData?: Partial<Message>) {
    const message = await this.messageRepository.findOne({ where: { id: messageId } });

    if (!message) {
      this.logger.warn(`Message not found for status update: ${messageId}`);
      return null;
    }

    // Update status
    message.status = status;

    // Update timestamps based on status
    if (status === 'delivered' && !message.deliveredAt) {
      message.deliveredAt = new Date();
    } else if (status === 'opened' && !message.openedAt) {
      message.openedAt = new Date();
    } else if (status === 'clicked' && !message.clickedAt) {
      message.clickedAt = new Date();
    } else if (status === 'failed' && !message.failedAt) {
      message.failedAt = new Date();
    }

    // Apply additional data
    if (additionalData) {
      Object.assign(message, additionalData);
    }

    return this.messageRepository.save(message);
  }
}
