import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientsController } from './clients.controller';
import { ClientsService } from './clients.service';
import { Client } from '../../database/entities/client.entity';
import { ClientContact } from '../../database/entities/client-contact.entity';
import { ClientAddress } from '../../database/entities/client-address.entity';
import { Quote } from '../../database/entities/quote.entity';
import { Job } from '../../database/entities/job.entity';
import { Invoice } from '../../database/entities/invoice.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Client,
      ClientContact,
      ClientAddress,
      Quote,
      Job,
      Invoice,
    ]),
  ],
  controllers: [ClientsController],
  providers: [ClientsService],
  exports: [ClientsService],
})
export class ClientsModule {}
