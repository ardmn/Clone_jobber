import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as sgMail from '@sendgrid/mail';

export interface SendEmailOptions {
  to: string | string[];
  from?: string;
  subject: string;
  text?: string;
  html?: string;
  cc?: string | string[];
  bcc?: string | string[];
  templateId?: string;
  dynamicTemplateData?: Record<string, any>;
}

export interface BulkEmailRecipient {
  to: string;
  dynamicTemplateData?: Record<string, any>;
}

@Injectable()
export class SendGridService {
  private readonly logger = new Logger(SendGridService.name);
  private readonly fromEmail: string;
  private readonly fromName: string;
  private isConfigured: boolean = false;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('SENDGRID_API_KEY');
    this.fromEmail = this.configService.get<string>('SENDGRID_FROM_EMAIL') || 'noreply@example.com';
    this.fromName = this.configService.get<string>('SENDGRID_FROM_NAME') || 'Jobber Clone';

    if (apiKey) {
      sgMail.setApiKey(apiKey);
      this.isConfigured = true;
      this.logger.log('SendGrid service initialized successfully');
    } else {
      this.logger.warn('SendGrid API key not configured. Email sending will be disabled.');
    }
  }

  /**
   * Send a single email
   */
  async sendEmail(options: SendEmailOptions): Promise<string> {
    if (!this.isConfigured) {
      this.logger.warn('SendGrid not configured. Skipping email send.');
      throw new InternalServerErrorException('Email service not configured');
    }

    try {
      const msg: sgMail.MailDataRequired = {
        to: options.to,
        from: options.from ? options.from : {
          email: this.fromEmail,
          name: this.fromName,
        },
        subject: options.subject,
        text: options.text,
        html: options.html,
        cc: options.cc,
        bcc: options.bcc,
      };

      if (options.templateId) {
        msg.templateId = options.templateId;
        msg.dynamicTemplateData = options.dynamicTemplateData || {};
      }

      const [response] = await sgMail.send(msg);

      const messageId = response.headers['x-message-id'] || 'unknown';

      this.logger.log(`Email sent successfully. Message ID: ${messageId}`);

      return messageId;
    } catch (error) {
      this.logger.error(`Failed to send email: ${error.message}`, error.stack);

      if (error.response) {
        this.logger.error(`SendGrid error response: ${JSON.stringify(error.response.body)}`);
      }

      throw new InternalServerErrorException('Failed to send email');
    }
  }

  /**
   * Send email using SendGrid template
   */
  async sendTemplateEmail(
    to: string | string[],
    templateId: string,
    dynamicData: Record<string, any>,
  ): Promise<string> {
    return this.sendEmail({
      to,
      subject: '', // Subject is defined in template
      templateId,
      dynamicTemplateData: dynamicData,
    });
  }

  /**
   * Send transactional email
   */
  async sendTransactionalEmail(
    to: string | string[],
    subject: string,
    html: string,
    text?: string,
  ): Promise<string> {
    return this.sendEmail({
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ''), // Strip HTML tags for text version
    });
  }

  /**
   * Send bulk emails (to multiple recipients)
   */
  async sendBulkEmail(
    recipients: string[],
    subject: string,
    html: string,
    text?: string,
  ): Promise<string[]> {
    if (!this.isConfigured) {
      this.logger.warn('SendGrid not configured. Skipping bulk email send.');
      throw new InternalServerErrorException('Email service not configured');
    }

    try {
      const messages = recipients.map(recipient => ({
        to: recipient,
        from: {
          email: this.fromEmail,
          name: this.fromName,
        },
        subject,
        html,
        text: text || html.replace(/<[^>]*>/g, ''),
      }));

      const responses = await sgMail.send(messages);

      const messageIds = responses.map(
        ([response]) => response.headers['x-message-id'] || 'unknown',
      );

      this.logger.log(`Bulk email sent successfully to ${recipients.length} recipients`);

      return messageIds;
    } catch (error) {
      this.logger.error(`Failed to send bulk email: ${error.message}`, error.stack);

      if (error.response) {
        this.logger.error(`SendGrid error response: ${JSON.stringify(error.response.body)}`);
      }

      throw new InternalServerErrorException('Failed to send bulk email');
    }
  }

  /**
   * Send bulk emails with personalization (different data per recipient)
   */
  async sendBulkEmailWithPersonalization(
    recipients: BulkEmailRecipient[],
    templateId: string,
  ): Promise<string[]> {
    if (!this.isConfigured) {
      this.logger.warn('SendGrid not configured. Skipping bulk email send.');
      throw new InternalServerErrorException('Email service not configured');
    }

    try {
      const messages = recipients.map(recipient => ({
        to: recipient.to,
        from: {
          email: this.fromEmail,
          name: this.fromName,
        },
        templateId,
        dynamicTemplateData: recipient.dynamicTemplateData || {},
      }));

      const responses = await sgMail.send(messages);

      const messageIds = responses.map(
        ([response]) => response.headers['x-message-id'] || 'unknown',
      );

      this.logger.log(`Bulk personalized email sent successfully to ${recipients.length} recipients`);

      return messageIds;
    } catch (error) {
      this.logger.error(`Failed to send bulk personalized email: ${error.message}`, error.stack);

      if (error.response) {
        this.logger.error(`SendGrid error response: ${JSON.stringify(error.response.body)}`);
      }

      throw new InternalServerErrorException('Failed to send bulk personalized email');
    }
  }
}
