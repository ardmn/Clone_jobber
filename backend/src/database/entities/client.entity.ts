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
import { User } from './user.entity';
import { ClientContact } from './client-contact.entity';
import { ClientAddress } from './client-address.entity';
import { Quote } from './quote.entity';
import { Job } from './job.entity';
import { Invoice } from './invoice.entity';
import { Payment } from './payment.entity';

@Entity('clients')
@Index('idx_clients_email', ['email'])
@Index('idx_clients_phone', ['phone'])
@Index('idx_clients_deleted_at', ['deletedAt'])
export class Client {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index('idx_clients_account_id')
  accountId: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  firstName: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  lastName: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  companyName: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  phone: string;

  @Column({ type: 'varchar', length: 100, array: true, default: '{}' })
  tags: string[];

  @Column({ type: 'varchar', length: 50, default: 'active' })
  status: string;

  @Column({ type: 'varchar', length: 50, default: 'residential' })
  clientType: string;

  @Column({ type: 'varchar', length: 3, default: 'USD' })
  currency: string;

  @Column({ type: 'int', default: 30 })
  paymentTerms: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  creditLimit: number;

  @Column({ type: 'jsonb', default: '{}' })
  customFields: Record<string, any>;

  @Column({ type: 'text', nullable: true })
  internalNotes: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  source: string;

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

  @ManyToOne(() => User)
  @JoinColumn({ name: 'createdBy' })
  creator: User;

  @OneToMany(() => ClientContact, (contact) => contact.client)
  contacts: ClientContact[];

  @OneToMany(() => ClientAddress, (address) => address.client)
  addresses: ClientAddress[];

  @OneToMany(() => Quote, (quote) => quote.client)
  quotes: Quote[];

  @OneToMany(() => Job, (job) => job.client)
  jobs: Job[];

  @OneToMany(() => Invoice, (invoice) => invoice.client)
  invoices: Invoice[];

  @OneToMany(() => Payment, (payment) => payment.client)
  payments: Payment[];
}
