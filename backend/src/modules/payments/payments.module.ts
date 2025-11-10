import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { Payment } from '../../database/entities/payment.entity';
import { Refund } from '../../database/entities/refund.entity';
import { Invoice } from '../../database/entities/invoice.entity';
import { Client } from '../../database/entities/client.entity';
import { Sequence } from '../../database/entities/sequence.entity';
import { StripeModule } from '../../integrations/stripe/stripe.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Payment,
      Refund,
      Invoice,
      Client,
      Sequence,
    ]),
    StripeModule,
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
