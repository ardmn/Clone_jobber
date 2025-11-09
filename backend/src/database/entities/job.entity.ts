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
import { Quote } from './quote.entity';
import { User } from './user.entity';
import { JobPhoto } from './job-photo.entity';
import { Invoice } from './invoice.entity';
import { TimeEntry } from './time-entry.entity';

@Entity('jobs')
@Index('idx_jobs_status', ['status'])
@Index('idx_jobs_scheduled', ['scheduledStart', 'scheduledEnd'])
@Index('idx_jobs_deleted_at', ['deletedAt'])
@Index('idx_jobs_account_number', ['accountId', 'jobNumber'], { unique: true })
export class Job {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index('idx_jobs_account_id')
  accountId: string;

  @Column({ type: 'uuid' })
  @Index('idx_jobs_client_id')
  clientId: string;

  @Column({ type: 'uuid', nullable: true })
  addressId: string;

  @Column({ type: 'uuid', nullable: true })
  quoteId: string;

  @Column({ type: 'varchar', length: 50 })
  jobNumber: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 50, default: 'scheduled' })
  status: string;

  @Column({ type: 'varchar', length: 20, default: 'normal' })
  priority: string;

  @Column({ type: 'timestamp', nullable: true })
  scheduledStart: Date;

  @Column({ type: 'timestamp', nullable: true })
  scheduledEnd: Date;

  @Column({ type: 'int', nullable: true })
  estimatedDuration: number;

  @Column({ type: 'timestamp', nullable: true })
  actualStart: Date;

  @Column({ type: 'timestamp', nullable: true })
  actualEnd: Date;

  @Column({ type: 'text', nullable: true })
  completionNotes: string;

  @Column({ type: 'text', nullable: true })
  clientSignature: string;

  @Column({ type: 'uuid', array: true, default: '{}' })
  @Index('idx_jobs_assigned_to', { synchronize: false })
  assignedTo: string[];

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  estimatedValue: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  actualCost: number;

  @Column({ type: 'text', nullable: true })
  internalNotes: string;

  @Column({ type: 'text', nullable: true })
  clientInstructions: string;

  @Column({ type: 'boolean', default: false })
  isRecurring: boolean;

  @Column({ type: 'text', nullable: true })
  recurrenceRule: string;

  @Column({ type: 'uuid', nullable: true })
  parentJobId: string;

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

  @ManyToOne(() => Client, (client) => client.jobs)
  @JoinColumn({ name: 'clientId' })
  client: Client;

  @ManyToOne(() => ClientAddress)
  @JoinColumn({ name: 'addressId' })
  address: ClientAddress;

  @ManyToOne(() => Quote, (quote) => quote.jobs)
  @JoinColumn({ name: 'quoteId' })
  quote: Quote;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'createdBy' })
  creator: User;

  @ManyToOne(() => Job)
  @JoinColumn({ name: 'parentJobId' })
  parentJob: Job;

  @OneToMany(() => Job, (job) => job.parentJob)
  recurringJobs: Job[];

  @OneToMany(() => JobPhoto, (photo) => photo.job)
  photos: JobPhoto[];

  @OneToMany(() => Invoice, (invoice) => invoice.job)
  invoices: Invoice[];

  @OneToMany(() => TimeEntry, (timeEntry) => timeEntry.job)
  timeEntries: TimeEntry[];
}
