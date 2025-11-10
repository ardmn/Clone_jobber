import { Processor, Process } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { CommunicationsService } from '../../modules/communications/communications.service';

export interface SendEmailJobData {
  to: string;
  subject: string;
  html: string;
  text?: string;
  accountId?: string;
  clientId?: string;
  relatedType?: string;
  relatedId?: string;
  sentBy?: string;
}

@Processor('email')
export class SendEmailProcessor {
  private readonly logger = new Logger(SendEmailProcessor.name);

  constructor(private readonly communicationsService: CommunicationsService) {}

  @Process('send-email')
  async handleSendEmail(job: Job<SendEmailJobData>): Promise<void> {
    const { to, subject, html, text, accountId, clientId, relatedType, relatedId, sentBy } = job.data;

    this.logger.log(`Processing email job ${job.id} to ${to}`);

    try {
      await this.communicationsService.sendEmail({
        to,
        subject,
        html,
        text,
        accountId,
        clientId,
        relatedType,
        relatedId,
        sentBy,
      });

      this.logger.log(`Email job ${job.id} completed successfully`);
    } catch (error) {
      this.logger.error(`Failed to send email ${job.id}:`, error.message);

      if (job.attemptsMade < 3) {
        this.logger.log(`Retrying email job ${job.id}. Attempt ${job.attemptsMade + 1} of 3`);
        throw error;
      } else {
        this.logger.error(`Email job ${job.id} failed after 3 attempts. Marking as failed.`);
        throw error;
      }
    }
  }

  @Process('send-bulk-email')
  async handleBulkEmail(job: Job<{ emails: SendEmailJobData[] }>): Promise<void> {
    const { emails } = job.data;

    this.logger.log(`Processing bulk email job ${job.id} with ${emails.length} emails`);

    const results = await Promise.allSettled(
      emails.map((emailData) =>
        this.communicationsService.sendEmail({
          to: emailData.to,
          subject: emailData.subject,
          html: emailData.html,
          text: emailData.text,
          accountId: emailData.accountId,
          clientId: emailData.clientId,
          relatedType: emailData.relatedType,
          relatedId: emailData.relatedId,
          sentBy: emailData.sentBy,
        }),
      ),
    );

    const succeeded = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;

    this.logger.log(`Bulk email job ${job.id} completed. Succeeded: ${succeeded}, Failed: ${failed}`);

    if (failed > 0) {
      const errors = results
        .filter((r) => r.status === 'rejected')
        .map((r) => (r as PromiseRejectedResult).reason);
      this.logger.error(`Bulk email job ${job.id} had ${failed} failures:`, errors);
    }
  }
}
