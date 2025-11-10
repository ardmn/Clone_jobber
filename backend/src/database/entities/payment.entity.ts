import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { Account } from './account.entity';
import { Client } from './client.entity';
import { Invoice } from './invoice.entity';
import { User } from './user.entity';
import { Refund } from './refund.entity';

@Entity('payments')
@Index('idx_payments_status', ['status'])
@Index('idx_payments_date', ['paymentDate'])
@Index('idx_payments_processor_id', ['processorPaymentId'])
@Index('idx_payments_account_number', ['accountId', 'paymentNumber'], { unique: true })
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index('idx_payments_account_id')
  accountId: string;

  @Column({ type: 'uuid' })
  @Index('idx_payments_client_id')
  clientId: string;

  @Column({ type: 'uuid', nullable: true })
  @Index('idx_payments_invoice_id')
  invoiceId: string;

  @Column({ type: 'varchar', length: 50 })
  paymentNumber: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number;

  @Column({ type: 'varchar', length: 3, default: 'USD' })
  currency: string;

  @Column({ type: 'varchar', length: 50 })
  paymentMethod: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  paymentProcessor: string;

  @Column({ type: 'varchar', length: 50, default: 'pending' })
  status: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  processorPaymentId: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  processorChargeId: string;

  @Column({ type: 'varchar', length: 4, nullable: true })
  cardLast4: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  cardBrand: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  processingFee: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  netAmount: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  paymentDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  settledDate: Date;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'text', nullable: true })
  receiptUrl: string;

  @Column({ type: 'uuid', nullable: true })
  createdBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Account)
  @JoinColumn({ name: 'accountId' })
  account: Account;

  @ManyToOne(() => Client, (client) => client.payments)
  @JoinColumn({ name: 'clientId' })
  client: Client;

  @ManyToOne(() => Invoice, (invoice) => invoice.payments)
  @JoinColumn({ name: 'invoiceId' })
  invoice: Invoice;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'createdBy' })
  creator: User;

  @OneToMany(() => Refund, (refund) => refund.payment)
  refunds: Refund[];
}
