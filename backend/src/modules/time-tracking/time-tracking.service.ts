import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In, IsNull, Not } from 'typeorm';
import { TimeEntry } from '../../database/entities/time-entry.entity';
import { User } from '../../database/entities/user.entity';
import { Job } from '../../database/entities/job.entity';
import { ClockInDto } from './dto/clock-in.dto';
import { ClockOutDto } from './dto/clock-out.dto';
import { UpdateEntryDto } from './dto/update-entry.dto';
import { EntriesQueryDto } from './dto/entries-query.dto';
import { TimesheetQueryDto } from './dto/timesheet-query.dto';

@Injectable()
export class TimeTrackingService {
  constructor(
    @InjectRepository(TimeEntry)
    private timeEntryRepository: Repository<TimeEntry>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Job)
    private jobRepository: Repository<Job>,
  ) {}

  async clockIn(
    accountId: string,
    userId: string,
    dto: ClockInDto,
  ): Promise<TimeEntry> {
    const activeEntry = await this.getCurrentActiveEntry(userId);
    if (activeEntry) {
      throw new BadRequestException(
        'User already has an active time entry. Please clock out first.',
      );
    }

    if (dto.jobId) {
      const job = await this.jobRepository.findOne({
        where: { id: dto.jobId, accountId },
      });
      if (!job) {
        throw new NotFoundException('Job not found');
      }
    }

    const timeEntry = this.timeEntryRepository.create({
      accountId,
      userId,
      jobId: dto.jobId || null,
      startTime: new Date(),
      startLatitude: dto.latitude || null,
      startLongitude: dto.longitude || null,
      notes: dto.notes || null,
      status: 'pending',
      entryType: 'job',
      isBillable: true,
    });

    return this.timeEntryRepository.save(timeEntry);
  }

  async clockOut(
    id: string,
    accountId: string,
    userId: string,
    dto: ClockOutDto,
  ): Promise<TimeEntry> {
    const timeEntry = await this.timeEntryRepository.findOne({
      where: { id, accountId, userId },
    });

    if (!timeEntry) {
      throw new NotFoundException('Time entry not found');
    }

    if (timeEntry.endTime) {
      throw new BadRequestException('Time entry already clocked out');
    }

    const endTime = new Date();
    const durationMinutes = this.calculateDuration(
      timeEntry.startTime,
      endTime,
    );

    timeEntry.endTime = endTime;
    timeEntry.endLatitude = dto.latitude || null;
    timeEntry.endLongitude = dto.longitude || null;
    timeEntry.durationMinutes = durationMinutes;

    if (dto.notes) {
      timeEntry.notes = timeEntry.notes
        ? `${timeEntry.notes}\n${dto.notes}`
        : dto.notes;
    }

    return this.timeEntryRepository.save(timeEntry);
  }

  async findAll(
    accountId: string,
    query: EntriesQueryDto,
  ): Promise<{ data: TimeEntry[]; meta: any }> {
    const page = query.page || 1;
    const limit = query.limit || 50;
    const skip = (page - 1) * limit;

    const where: any = { accountId };

    if (query.userId) {
      where.userId = query.userId;
    }

    if (query.jobId) {
      where.jobId = query.jobId;
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.entryType) {
      where.entryType = query.entryType;
    }

    if (query.startDate && query.endDate) {
      where.startTime = Between(
        new Date(query.startDate),
        new Date(query.endDate),
      );
    } else if (query.startDate) {
      where.startTime = Between(new Date(query.startDate), new Date());
    }

    const [data, total] = await this.timeEntryRepository.findAndCount({
      where,
      relations: ['user', 'job', 'job.client', 'approver'],
      order: { startTime: 'DESC' },
      skip,
      take: limit,
    });

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  async findById(id: string, accountId: string): Promise<TimeEntry> {
    const timeEntry = await this.timeEntryRepository.findOne({
      where: { id, accountId },
      relations: ['user', 'job', 'job.client', 'approver'],
    });

    if (!timeEntry) {
      throw new NotFoundException('Time entry not found');
    }

    return timeEntry;
  }

  async update(
    id: string,
    accountId: string,
    dto: UpdateEntryDto,
  ): Promise<TimeEntry> {
    const timeEntry = await this.findById(id, accountId);

    if (timeEntry.status === 'approved') {
      throw new ForbiddenException('Cannot update approved time entry');
    }

    if (dto.startTime) {
      const startTime = new Date(dto.startTime);
      timeEntry.startTime = startTime;

      if (timeEntry.endTime) {
        timeEntry.durationMinutes = this.calculateDuration(
          startTime,
          timeEntry.endTime,
        );
      }
    }

    if (dto.endTime) {
      const endTime = new Date(dto.endTime);
      timeEntry.endTime = endTime;

      if (timeEntry.startTime) {
        timeEntry.durationMinutes = this.calculateDuration(
          timeEntry.startTime,
          endTime,
        );
      }
    }

    if (dto.notes !== undefined) {
      timeEntry.notes = dto.notes;
    }

    if (dto.isBillable !== undefined) {
      timeEntry.isBillable = dto.isBillable;
    }

    if (dto.entryType) {
      timeEntry.entryType = dto.entryType;
    }

    if (
      timeEntry.startTime &&
      timeEntry.endTime &&
      timeEntry.startTime >= timeEntry.endTime
    ) {
      throw new BadRequestException('Start time must be before end time');
    }

    if (timeEntry.endTime) {
      const overlaps = await this.checkOverlappingEntries(
        timeEntry.userId,
        timeEntry.startTime,
        timeEntry.endTime,
        id,
      );

      if (overlaps) {
        throw new BadRequestException(
          'Time entry overlaps with another entry',
        );
      }
    }

    return this.timeEntryRepository.save(timeEntry);
  }

  async delete(id: string, accountId: string): Promise<void> {
    const timeEntry = await this.findById(id, accountId);

    if (timeEntry.status === 'approved') {
      throw new ForbiddenException('Cannot delete approved time entry');
    }

    await this.timeEntryRepository.remove(timeEntry);
  }

  async approve(
    id: string,
    accountId: string,
    approverId: string,
  ): Promise<TimeEntry> {
    const timeEntry = await this.findById(id, accountId);

    if (timeEntry.status === 'approved') {
      throw new BadRequestException('Time entry already approved');
    }

    if (!timeEntry.endTime) {
      throw new BadRequestException(
        'Cannot approve time entry without clock-out time',
      );
    }

    timeEntry.status = 'approved';
    timeEntry.approvedBy = approverId;
    timeEntry.approvedAt = new Date();

    return this.timeEntryRepository.save(timeEntry);
  }

  async reject(
    id: string,
    accountId: string,
    approverId: string,
    reason: string,
  ): Promise<TimeEntry> {
    const timeEntry = await this.findById(id, accountId);

    if (timeEntry.status === 'approved') {
      throw new BadRequestException('Cannot reject approved time entry');
    }

    timeEntry.status = 'rejected';
    timeEntry.approvedBy = approverId;
    timeEntry.approvedAt = new Date();
    timeEntry.notes = timeEntry.notes
      ? `${timeEntry.notes}\n\nRejection reason: ${reason}`
      : `Rejection reason: ${reason}`;

    return this.timeEntryRepository.save(timeEntry);
  }

  async getTimesheets(
    accountId: string,
    query: TimesheetQueryDto,
  ): Promise<any> {
    const startDate = new Date(query.startDate);
    const endDate = new Date(query.endDate);

    const entries = await this.timeEntryRepository.find({
      where: {
        accountId,
        startTime: Between(startDate, endDate),
        endTime: Not(IsNull()),
        ...(query.userId ? { userId: query.userId } : {}),
      },
      relations: ['user', 'job'],
      order: { startTime: 'ASC' },
    });

    const groupedData = this.groupTimesheetData(
      entries,
      query.groupBy || 'day',
    );

    const summary = {
      totalMinutes: entries.reduce(
        (sum, entry) => sum + (entry.durationMinutes || 0),
        0,
      ),
      totalHours: 0,
      billableMinutes: entries
        .filter((e) => e.isBillable)
        .reduce((sum, entry) => sum + (entry.durationMinutes || 0), 0),
      billableHours: 0,
      entriesCount: entries.length,
    };

    summary.totalHours = Math.round((summary.totalMinutes / 60) * 100) / 100;
    summary.billableHours =
      Math.round((summary.billableMinutes / 60) * 100) / 100;

    return {
      startDate: query.startDate,
      endDate: query.endDate,
      groupBy: query.groupBy || 'day',
      summary,
      data: groupedData,
    };
  }

  async getUserTimesheet(
    accountId: string,
    userId: string,
    query: TimesheetQueryDto,
  ): Promise<any> {
    const user = await this.userRepository.findOne({
      where: { id: userId, accountId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const timesheetData = await this.getTimesheets(accountId, {
      ...query,
      userId,
    });

    return {
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
      },
      ...timesheetData,
    };
  }

  calculateDuration(startTime: Date, endTime: Date): number {
    const diffMs = endTime.getTime() - startTime.getTime();
    return Math.floor(diffMs / 1000 / 60);
  }

  async getCurrentActiveEntry(userId: string): Promise<TimeEntry | null> {
    return this.timeEntryRepository.findOne({
      where: {
        userId,
        endTime: IsNull(),
      },
      order: { startTime: 'DESC' },
    });
  }

  private async checkOverlappingEntries(
    userId: string,
    startTime: Date,
    endTime: Date,
    excludeId?: string,
  ): Promise<boolean> {
    const queryBuilder = this.timeEntryRepository
      .createQueryBuilder('entry')
      .where('entry.userId = :userId', { userId })
      .andWhere('entry.endTime IS NOT NULL')
      .andWhere(
        '(entry.startTime < :endTime AND entry.endTime > :startTime)',
        { startTime, endTime },
      );

    if (excludeId) {
      queryBuilder.andWhere('entry.id != :excludeId', { excludeId });
    }

    const count = await queryBuilder.getCount();
    return count > 0;
  }

  private groupTimesheetData(
    entries: TimeEntry[],
    groupBy: string,
  ): Record<string, any> {
    const grouped: Record<string, any> = {};

    entries.forEach((entry) => {
      let key: string;

      if (groupBy === 'week') {
        const date = new Date(entry.startTime);
        const weekStart = this.getWeekStart(date);
        key = weekStart.toISOString().split('T')[0];
      } else {
        key = entry.startTime.toISOString().split('T')[0];
      }

      if (!grouped[key]) {
        grouped[key] = {
          date: key,
          entries: [],
          totalMinutes: 0,
          totalHours: 0,
          billableMinutes: 0,
          billableHours: 0,
        };
      }

      grouped[key].entries.push(entry);
      grouped[key].totalMinutes += entry.durationMinutes || 0;
      if (entry.isBillable) {
        grouped[key].billableMinutes += entry.durationMinutes || 0;
      }
    });

    Object.values(grouped).forEach((group: any) => {
      group.totalHours = Math.round((group.totalMinutes / 60) * 100) / 100;
      group.billableHours =
        Math.round((group.billableMinutes / 60) * 100) / 100;
    });

    return grouped;
  }

  private getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day;
    return new Date(d.setDate(diff));
  }
}
