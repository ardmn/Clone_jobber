import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Account } from './account.entity';
import { User } from './user.entity';

@Entity('audit_logs')
@Index('idx_audit_logs_entity', ['entityType', 'entityId'])
@Index('idx_audit_logs_created_at', ['createdAt'])
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: true })
  @Index('idx_audit_logs_account_id')
  accountId: string;

  @Column({ type: 'uuid', nullable: true })
  userId: string;

  @Column({ type: 'varchar', length: 50 })
  action: string;

  @Column({ type: 'varchar', length: 50 })
  entityType: string;

  @Column({ type: 'uuid' })
  entityId: string;

  @Column({ type: 'jsonb', nullable: true })
  oldValues: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  newValues: Record<string, any>;

  @Column({ type: 'varchar', length: 45, nullable: true })
  ipAddress: string;

  @Column({ type: 'text', nullable: true })
  userAgent: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Account)
  @JoinColumn({ name: 'accountId' })
  account: Account;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;
}
