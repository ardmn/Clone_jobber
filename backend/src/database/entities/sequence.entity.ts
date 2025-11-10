import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Account } from './account.entity';

@Entity('sequences')
@Index('idx_sequences_account', ['accountId', 'sequenceType'])
@Index('idx_sequences_unique', ['accountId', 'sequenceType'], { unique: true })
export class Sequence {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  accountId: string;

  @Column({ type: 'varchar', length: 50 })
  sequenceType: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  prefix: string;

  @Column({ type: 'int', default: 0 })
  currentValue: number;

  @ManyToOne(() => Account)
  @JoinColumn({ name: 'accountId' })
  account: Account;
}
