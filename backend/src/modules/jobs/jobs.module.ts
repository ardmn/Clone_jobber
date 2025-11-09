import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JobsController } from './jobs.controller';
import { JobsService } from './jobs.service';
import { Job } from '../../database/entities/job.entity';
import { JobPhoto } from '../../database/entities/job-photo.entity';
import { Client } from '../../database/entities/client.entity';
import { Quote } from '../../database/entities/quote.entity';
import { Invoice } from '../../database/entities/invoice.entity';
import { User } from '../../database/entities/user.entity';
import { Sequence } from '../../database/entities/sequence.entity';
import { TimeEntry } from '../../database/entities/time-entry.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Job,
      JobPhoto,
      Client,
      Quote,
      Invoice,
      User,
      Sequence,
      TimeEntry,
    ]),
  ],
  controllers: [JobsController],
  providers: [JobsService],
  exports: [JobsService],
})
export class JobsModule {}
