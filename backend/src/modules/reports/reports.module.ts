import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { Invoice } from '../../database/entities/invoice.entity';
import { Job } from '../../database/entities/job.entity';
import { Client } from '../../database/entities/client.entity';
import { TimeEntry } from '../../database/entities/time-entry.entity';
import { Payment } from '../../database/entities/payment.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Invoice, Job, Client, TimeEntry, Payment]),
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}
