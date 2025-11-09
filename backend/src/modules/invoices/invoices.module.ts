import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InvoicesController } from './invoices.controller';
import { InvoicesService } from './invoices.service';
import { Invoice } from '../../database/entities/invoice.entity';
import { InvoiceLineItem } from '../../database/entities/invoice-line-item.entity';
import { Client } from '../../database/entities/client.entity';
import { Job } from '../../database/entities/job.entity';
import { Payment } from '../../database/entities/payment.entity';
import { Sequence } from '../../database/entities/sequence.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Invoice,
      InvoiceLineItem,
      Client,
      Job,
      Payment,
      Sequence,
    ]),
  ],
  controllers: [InvoicesController],
  providers: [InvoicesService],
  exports: [InvoicesService],
})
export class InvoicesModule {}
