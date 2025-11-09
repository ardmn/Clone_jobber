import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Account } from './account.entity';
import { User } from './user.entity';
import { Job } from './job.entity';

@Entity('time_entries')
@Index('idx_time_entries_start_time', ['startTime'])
@Index('idx_time_entries_status', ['status'])
export class TimeEntry {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index('idx_time_entries_account_id')
  accountId: string;

  @Column({ type: 'uuid' })
  @Index('idx_time_entries_user_id')
  userId: string;

  @Column({ type: 'uuid', nullable: true })
  @Index('idx_time_entries_job_id')
  jobId: string;

  @Column({ type: 'timestamp' })
  startTime: Date;

  @Column({ type: 'timestamp', nullable: true })
  endTime: Date;

  @Column({ type: 'int', nullable: true })
  durationMinutes: number;

  @Column({ type: 'decimal', precision: 10, scale: 8, nullable: true })
  startLatitude: number;

  @Column({ type: 'decimal', precision: 11, scale: 8, nullable: true })
  startLongitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 8, nullable: true })
  endLatitude: number;

  @Column({ type: 'decimal', precision: 11, scale: 8, nullable: true })
  endLongitude: number;

  @Column({ type: 'varchar', length: 50, default: 'job' })
  entryType: string;

  @Column({ type: 'boolean', default: true })
  isBillable: boolean;

  @Column({ type: 'varchar', length: 50, default: 'pending' })
  status: string;

  @Column({ type: 'uuid', nullable: true })
  approvedBy: string;

  @Column({ type: 'timestamp', nullable: true })
  approvedAt: Date;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Account)
  @JoinColumn({ name: 'accountId' })
  account: Account;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Job, (job) => job.timeEntries)
  @JoinColumn({ name: 'jobId' })
  job: Job;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'approvedBy' })
  approver: User;
}
