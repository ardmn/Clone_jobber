import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { SendEmailProcessor } from './send-email.processor';
import { CommunicationsModule } from '../../modules/communications/communications.module';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'email',
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
        removeOnComplete: 100,
        removeOnFail: 500,
      },
    }),
    CommunicationsModule,
  ],
  providers: [SendEmailProcessor],
  exports: [BullModule],
})
export class SendEmailJobModule {}
