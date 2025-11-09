import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommunicationsController } from './communications.controller';
import { CommunicationsService } from './communications.service';
import { Message } from '../../database/entities/message.entity';
import { Client } from '../../database/entities/client.entity';
import { SendGridModule } from '../../integrations/sendgrid/sendgrid.module';
import { TwilioModule } from '../../integrations/twilio/twilio.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Message, Client]),
    SendGridModule,
    TwilioModule,
  ],
  controllers: [CommunicationsController],
  providers: [CommunicationsService],
  exports: [CommunicationsService],
})
export class CommunicationsModule {}
