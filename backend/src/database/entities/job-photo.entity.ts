import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Job } from './job.entity';
import { User } from './user.entity';

@Entity('job_photos')
@Index('idx_job_photos_job_id', ['jobId'])
export class JobPhoto {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  jobId: string;

  @Column({ type: 'text' })
  fileUrl: string;

  @Column({ type: 'varchar', length: 255 })
  fileName: string;

  @Column({ type: 'int', nullable: true })
  fileSize: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  mimeType: string;

  @Column({ type: 'text', nullable: true })
  caption: string;

  @Column({ type: 'varchar', length: 50, default: 'general' })
  photoType: string;

  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @Column({ type: 'uuid', nullable: true })
  uploadedBy: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  uploadedAt: Date;

  @ManyToOne(() => Job, (job) => job.photos)
  @JoinColumn({ name: 'jobId' })
  job: Job;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'uploadedBy' })
  uploader: User;
}
