import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Payment } from './payment.entity';
import { User } from './user.entity';

@Entity('refunds')
@Index('idx_refunds_payment_id', ['paymentId'])
export class Refund {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  paymentId: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number;

  @Column({ type: 'text', nullable: true })
  reason: string;

  @Column({ type: 'varchar', length: 50, default: 'pending' })
  status: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  processorRefundId: string;

  @Column({ type: 'timestamp', nullable: true })
  refundedAt: Date;

  @Column({ type: 'uuid', nullable: true })
  createdBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Payment, (payment) => payment.refunds)
  @JoinColumn({ name: 'paymentId' })
  payment: Payment;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'createdBy' })
  creator: User;
}
