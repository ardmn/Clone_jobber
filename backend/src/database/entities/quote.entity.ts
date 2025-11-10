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
import { ClientAddress } from './client-address.entity';
import { User } from './user.entity';
import { QuoteLineItem } from './quote-line-item.entity';
import { Job } from './job.entity';

@Entity('quotes')
@Index('idx_quotes_status', ['status'])
@Index('idx_quotes_date', ['quoteDate'])
@Index('idx_quotes_deleted_at', ['deletedAt'])
@Index('idx_quotes_account_number', ['accountId', 'quoteNumber'], { unique: true })
export class Quote {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index('idx_quotes_account_id')
  accountId: string;

  @Column({ type: 'uuid' })
  @Index('idx_quotes_client_id')
  clientId: string;

  @Column({ type: 'uuid', nullable: true })
  addressId: string;

  @Column({ type: 'varchar', length: 50 })
  quoteNumber: string;

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

  @Column({ type: 'boolean', default: false })
  depositRequired: boolean;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  depositAmount: number;

  @Column({ type: 'date', default: () => 'CURRENT_DATE' })
  quoteDate: Date;

  @Column({ type: 'date', nullable: true })
  expiryDate: Date;

  @Column({ type: 'text', nullable: true })
  introduction: string;

  @Column({ type: 'text', nullable: true })
  termsAndConditions: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'timestamp', nullable: true })
  viewedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  approvedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  declinedAt: Date;

  @Column({ type: 'text', nullable: true })
  declineReason: string;

  @Column({ type: 'text', nullable: true })
  signatureData: string;

  @Column({ type: 'varchar', length: 45, nullable: true })
  signatureIp: string;

  @Column({ type: 'uuid', nullable: true })
  convertedToJobId: string;

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

  @ManyToOne(() => Client, (client) => client.quotes)
  @JoinColumn({ name: 'clientId' })
  client: Client;

  @ManyToOne(() => ClientAddress)
  @JoinColumn({ name: 'addressId' })
  address: ClientAddress;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'createdBy' })
  creator: User;

  @OneToMany(() => QuoteLineItem, (lineItem) => lineItem.quote)
  lineItems: QuoteLineItem[];

  @OneToMany(() => Job, (job) => job.quote)
  jobs: Job[];
}
