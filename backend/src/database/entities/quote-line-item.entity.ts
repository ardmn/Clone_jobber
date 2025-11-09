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
import { Quote } from './quote.entity';

@Entity('quote_line_items')
@Index('idx_quote_line_items_quote_id', ['quoteId'])
export class QuoteLineItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  quoteId: string;

  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @Column({ type: 'varchar', length: 50, default: 'service' })
  itemType: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 1 })
  quantity: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  unitPrice: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  totalPrice: number;

  @Column({ type: 'boolean', default: true })
  isTaxable: boolean;

  @Column({ type: 'boolean', default: false })
  isOptional: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Quote, (quote) => quote.lineItems)
  @JoinColumn({ name: 'quoteId' })
  quote: Quote;
}
