import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { Account } from './account.entity';
import { Client } from './client.entity';
import { Job } from './job.entity';
import { Quote } from './quote.entity';
import { User } from './user.entity';
import { InvoiceLineItem } from './invoice-line-item.entity';
import { Payment } from './payment.entity';

@Entity('invoices')
@Index('idx_invoices_status', ['status'])
@Index('idx_invoices_due_date', ['dueDate'])
@Index('idx_invoices_deleted_at', ['deletedAt'])
@Index('idx_invoices_account_number', ['accountId', 'invoiceNumber'], { unique: true })
export class Invoice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index('idx_invoices_account_id')
  accountId: string;

  @Column({ type: 'uuid' })
  @Index('idx_invoices_client_id')
  clientId: string;

  @Column({ type: 'uuid', nullable: true })
  @Index('idx_invoices_job_id')
  jobId: string;

  @Column({ type: 'uuid', nullable: true })
  quoteId: string;

  @Column({ type: 'varchar', length: 50 })
  invoiceNumber: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 50, default: 'draft' })
  status: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  subtotal: number;

  @Column({ type: 'decimal', precision: 5, scale: 4, default: 0 })
  taxRate: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  taxAmount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  discountAmount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  total: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  amountPaid: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  balanceDue: number;

  @Column({ type: 'date', default: () => 'CURRENT_DATE' })
  invoiceDate: Date;

  @Column({ type: 'date' })
  dueDate: Date;

  @Column({ type: 'date', nullable: true })
  paidDate: Date;

  @Column({ type: 'int', default: 30 })
  paymentTerms: number;

  @Column({ type: 'boolean', default: false })
  lateFeeEnabled: boolean;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  lateFeePercentage: number;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'text', nullable: true })
  termsAndConditions: string;

  @Column({ type: 'timestamp', nullable: true })
  sentAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  viewedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  lastReminderSentAt: Date;

  @Column({ type: 'int', default: 0 })
  reminderCount: number;

  @Column({ type: 'uuid', nullable: true })
  createdBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;

  @ManyToOne(() => Account)
  @JoinColumn({ name: 'accountId' })
  account: Account;

  @ManyToOne(() => Client, (client) => client.invoices)
  @JoinColumn({ name: 'clientId' })
  client: Client;

  @ManyToOne(() => Job, (job) => job.invoices)
  @JoinColumn({ name: 'jobId' })
  job: Job;

  @ManyToOne(() => Quote)
  @JoinColumn({ name: 'quoteId' })
  quote: Quote;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'createdBy' })
  creator: User;

  @OneToMany(() => InvoiceLineItem, (lineItem) => lineItem.invoice)
  lineItems: InvoiceLineItem[];

  @OneToMany(() => Payment, (payment) => payment.invoice)
  payments: Payment[];
}
