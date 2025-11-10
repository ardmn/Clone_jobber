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
import { Client } from './client.entity';
import { User } from './user.entity';

@Entity('messages')
@Index('idx_messages_status', ['status'])
@Index('idx_messages_created_at', ['createdAt'])
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index('idx_messages_account_id')
  accountId: string;

  @Column({ type: 'uuid', nullable: true })
  @Index('idx_messages_client_id')
  clientId: string;

  @Column({ type: 'varchar', length: 50 })
  messageType: string;

  @Column({ type: 'varchar', length: 10 })
  direction: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  subject: string;

  @Column({ type: 'text' })
  body: string;

  @Column({ type: 'varchar', length: 255 })
  fromAddress: string;

  @Column({ type: 'varchar', length: 255 })
  toAddress: string;

  @Column({ type: 'varchar', length: 50, default: 'pending' })
  status: string;

  @Column({ type: 'timestamp', nullable: true })
  sentAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  deliveredAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  openedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  clickedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  failedAt: Date;

  @Column({ type: 'text', nullable: true })
  errorMessage: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  provider: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  providerMessageId: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  relatedType: string;

  @Column({ type: 'uuid', nullable: true })
  relatedId: string;

  @Column({ type: 'uuid', nullable: true })
  sentBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Account)
  @JoinColumn({ name: 'accountId' })
  account: Account;

  @ManyToOne(() => Client)
  @JoinColumn({ name: 'clientId' })
  client: Client;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'sentBy' })
  sender: User;
}
