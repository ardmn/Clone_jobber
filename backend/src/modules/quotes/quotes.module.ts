import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuotesController } from './quotes.controller';
import { QuotesService } from './quotes.service';
import { Quote } from '../../database/entities/quote.entity';
import { QuoteLineItem } from '../../database/entities/quote-line-item.entity';
import { Client } from '../../database/entities/client.entity';
import { Job } from '../../database/entities/job.entity';
import { Sequence } from '../../database/entities/sequence.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Quote,
      QuoteLineItem,
      Client,
      Job,
      Sequence,
    ]),
  ],
  controllers: [QuotesController],
  providers: [QuotesService],
  exports: [QuotesService],
})
export class QuotesModule {}
