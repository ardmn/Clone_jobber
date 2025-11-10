import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as twilio from 'twilio';
import { Twilio } from 'twilio';

export interface SendSMSResult {
  sid: string;
  status: string;
  to: string;
}

@Injectable()
export class TwilioService {
  private readonly logger = new Logger(TwilioService.name);
  private readonly client: Twilio;
  private readonly phoneNumber: string;
  private isConfigured: boolean = false;

  constructor(private readonly configService: ConfigService) {
    const accountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID');
    const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN');
    this.phoneNumber = this.configService.get<string>('TWILIO_PHONE_NUMBER') || '';

    if (accountSid && authToken && this.phoneNumber) {
      this.client = twilio(accountSid, authToken);
      this.isConfigured = true;
      this.logger.log('Twilio service initialized successfully');
    } else {
      this.logger.warn('Twilio credentials not configured. SMS sending will be disabled.');
    }
  }

  /**
   * Format phone number to E.164 format
   */
  private formatPhoneNumber(phoneNumber: string): string {
    // Remove all non-numeric characters
    let cleaned = phoneNumber.replace(/\D/g, '');

    // If number doesn't start with +, add country code
    if (!phoneNumber.startsWith('+')) {
      // Default to US country code if not specified
      if (cleaned.length === 10) {
        cleaned = '1' + cleaned; // US country code
      }
      cleaned = '+' + cleaned;
    } else {
      cleaned = phoneNumber;
    }

    return cleaned;
  }

  /**
   * Send SMS to a single recipient
   */
  async sendSMS(to: string, body: string): Promise<SendSMSResult> {
    if (!this.isConfigured) {
      this.logger.warn('Twilio not configured. Skipping SMS send.');
      throw new InternalServerErrorException('SMS service not configured');
    }

    try {
      const formattedTo = this.formatPhoneNumber(to);

      const message = await this.client.messages.create({
        body,
        from: this.phoneNumber,
        to: formattedTo,
      });

      this.logger.log(`SMS sent successfully. SID: ${message.sid}, Status: ${message.status}`);

      return {
        sid: message.sid,
        status: message.status,
        to: formattedTo,
      };
    } catch (error) {
      this.logger.error(`Failed to send SMS to ${to}: ${error.message}`, error.stack);

      if (error.code) {
        this.logger.error(`Twilio error code: ${error.code}`);
      }

      throw new InternalServerErrorException('Failed to send SMS');
    }
  }

  /**
   * Send SMS to multiple recipients
   */
  async sendBulkSMS(recipients: string[], body: string): Promise<SendSMSResult[]> {
    if (!this.isConfigured) {
      this.logger.warn('Twilio not configured. Skipping bulk SMS send.');
      throw new InternalServerErrorException('SMS service not configured');
    }

    const results: SendSMSResult[] = [];
    const errors: { recipient: string; error: string }[] = [];

    for (const recipient of recipients) {
      try {
        const result = await this.sendSMS(recipient, body);
        results.push(result);
      } catch (error) {
        this.logger.error(`Failed to send SMS to ${recipient}: ${error.message}`);
        errors.push({
          recipient,
          error: error.message,
        });
      }
    }

    this.logger.log(
      `Bulk SMS completed. Sent: ${results.length}, Failed: ${errors.length}`,
    );

    if (errors.length > 0) {
      this.logger.warn(`SMS sending errors: ${JSON.stringify(errors)}`);
    }

    // If all messages failed, throw error
    if (results.length === 0) {
      throw new InternalServerErrorException('Failed to send any SMS messages');
    }

    return results;
  }

  /**
   * Get message status by SID
   */
  async getMessageStatus(messageSid: string): Promise<any> {
    if (!this.isConfigured) {
      throw new InternalServerErrorException('SMS service not configured');
    }

    try {
      const message = await this.client.messages(messageSid).fetch();

      return {
        sid: message.sid,
        status: message.status,
        to: message.to,
        from: message.from,
        body: message.body,
        dateSent: message.dateSent,
        dateCreated: message.dateCreated,
        dateUpdated: message.dateUpdated,
        errorCode: message.errorCode,
        errorMessage: message.errorMessage,
      };
    } catch (error) {
      this.logger.error(`Failed to get message status for ${messageSid}: ${error.message}`);
      throw new InternalServerErrorException('Failed to get message status');
    }
  }

  /**
   * Validate phone number
   */
  isValidPhoneNumber(phoneNumber: string): boolean {
    // Basic validation - checks if it has at least 10 digits
    const cleaned = phoneNumber.replace(/\D/g, '');
    return cleaned.length >= 10;
  }
}
