import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TimeTrackingController } from './time-tracking.controller';
import { TimeTrackingService } from './time-tracking.service';
import { TimeEntry } from '../../database/entities/time-entry.entity';
import { User } from '../../database/entities/user.entity';
import { Job } from '../../database/entities/job.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TimeEntry, User, Job])],
  controllers: [TimeTrackingController],
  providers: [TimeTrackingService],
  exports: [TimeTrackingService],
})
export class TimeTrackingModule {}
