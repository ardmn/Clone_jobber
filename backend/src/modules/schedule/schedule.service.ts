import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm';
import { Job } from '../../database/entities/job.entity';
import { User } from '../../database/entities/user.entity';
import { ScheduleQueryDto } from './dto/schedule-query.dto';
import { AvailabilityQueryDto } from './dto/availability-query.dto';
import { UpdateJobScheduleDto } from './dto/update-job-schedule.dto';
import { ConflictsQueryDto } from './dto/conflicts-query.dto';

@Injectable()
export class ScheduleService {
  constructor(
    @InjectRepository(Job)
    private jobRepository: Repository<Job>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async getSchedule(accountId: string, query: ScheduleQueryDto): Promise<any> {
    const startDate = new Date(query.startDate);
    const endDate = new Date(query.endDate);

    const where: any = {
      accountId,
      scheduledStart: Between(startDate, endDate),
    };

    if (query.status) {
      where.status = query.status;
    }

    let jobs = await this.jobRepository.find({
      where,
      relations: ['client', 'address'],
      order: { scheduledStart: 'ASC' },
    });

    if (query.userIds && query.userIds.length > 0) {
      jobs = jobs.filter((job) =>
        job.assignedTo.some((userId) => query.userIds.includes(userId)),
      );
    }

    const enrichedJobs = await Promise.all(
      jobs.map(async (job) => {
        const assignedUsers = await this.getAssignedUsers(
          job.assignedTo,
          accountId,
        );
        return {
          ...job,
          assignedUsers,
        };
      }),
    );

    return {
      startDate: query.startDate,
      endDate: query.endDate,
      totalJobs: enrichedJobs.length,
      jobs: enrichedJobs,
    };
  }

  async getUserSchedule(
    accountId: string,
    userId: string,
    query: ScheduleQueryDto,
  ): Promise<any> {
    const user = await this.userRepository.findOne({
      where: { id: userId, accountId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const startDate = new Date(query.startDate);
    const endDate = new Date(query.endDate);

    const where: any = {
      accountId,
      scheduledStart: Between(startDate, endDate),
    };

    if (query.status) {
      where.status = query.status;
    }

    const allJobs = await this.jobRepository.find({
      where,
      relations: ['client', 'address'],
      order: { scheduledStart: 'ASC' },
    });

    const userJobs = allJobs.filter((job) =>
      job.assignedTo.includes(userId),
    );

    const enrichedJobs = await Promise.all(
      userJobs.map(async (job) => {
        const assignedUsers = await this.getAssignedUsers(
          job.assignedTo,
          accountId,
        );
        return {
          ...job,
          assignedUsers,
        };
      }),
    );

    return {
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
      },
      startDate: query.startDate,
      endDate: query.endDate,
      totalJobs: enrichedJobs.length,
      jobs: enrichedJobs,
    };
  }

  async checkAvailability(
    accountId: string,
    query: AvailabilityQueryDto,
  ): Promise<any> {
    const startDate = new Date(query.startDate);
    const endDate = new Date(query.endDate);

    const users = await this.userRepository.find({
      where: {
        id: In(query.userIds),
        accountId,
      },
    });

    if (users.length !== query.userIds.length) {
      throw new NotFoundException('One or more users not found');
    }

    const availability = await Promise.all(
      query.userIds.map(async (userId) => {
        const conflicts = await this.findConflicts(
          accountId,
          userId,
          startDate,
          endDate,
        );

        const user = users.find((u) => u.id === userId);

        return {
          userId,
          firstName: user.firstName,
          lastName: user.lastName,
          available: conflicts.length === 0,
          conflicts: conflicts.map((job) => ({
            jobId: job.id,
            jobNumber: job.jobNumber,
            title: job.title,
            scheduledStart: job.scheduledStart,
            scheduledEnd: job.scheduledEnd,
          })),
        };
      }),
    );

    return {
      startDate: query.startDate,
      endDate: query.endDate,
      availability,
    };
  }

  async updateJobSchedule(
    jobId: string,
    accountId: string,
    dto: UpdateJobScheduleDto,
  ): Promise<Job> {
    const job = await this.jobRepository.findOne({
      where: { id: jobId, accountId },
      relations: ['client', 'address'],
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    if (dto.scheduledStart) {
      job.scheduledStart = new Date(dto.scheduledStart);
    }

    if (dto.scheduledEnd) {
      job.scheduledEnd = new Date(dto.scheduledEnd);
    }

    if (job.scheduledStart && job.scheduledEnd) {
      if (job.scheduledStart >= job.scheduledEnd) {
        throw new BadRequestException(
          'Scheduled start must be before scheduled end',
        );
      }
    }

    if (dto.assignedTo !== undefined) {
      if (dto.assignedTo.length > 0) {
        const users = await this.userRepository.find({
          where: {
            id: In(dto.assignedTo),
            accountId,
          },
        });

        if (users.length !== dto.assignedTo.length) {
          throw new BadRequestException('One or more users not found');
        }

        if (job.scheduledStart && job.scheduledEnd) {
          for (const userId of dto.assignedTo) {
            const conflicts = await this.findConflicts(
              accountId,
              userId,
              job.scheduledStart,
              job.scheduledEnd,
              jobId,
            );

            if (conflicts.length > 0) {
              const user = users.find((u) => u.id === userId);
              throw new BadRequestException(
                `User ${user.firstName} ${user.lastName} has scheduling conflicts`,
              );
            }
          }
        }
      }

      job.assignedTo = dto.assignedTo;
    }

    const savedJob = await this.jobRepository.save(job);

    const assignedUsers = await this.getAssignedUsers(
      savedJob.assignedTo,
      accountId,
    );

    return {
      ...savedJob,
      assignedUsers,
    } as any;
  }

  async findConflicts(
    accountId: string,
    userId: string,
    startDate: Date,
    endDate: Date,
    excludeJobId?: string,
  ): Promise<Job[]> {
    const queryBuilder = this.jobRepository
      .createQueryBuilder('job')
      .where('job.accountId = :accountId', { accountId })
      .andWhere(':userId = ANY(job.assignedTo)', { userId })
      .andWhere('job.scheduledStart IS NOT NULL')
      .andWhere('job.scheduledEnd IS NOT NULL')
      .andWhere(
        '(job.scheduledStart < :endDate AND job.scheduledEnd > :startDate)',
        { startDate, endDate },
      )
      .andWhere("job.status NOT IN ('completed', 'cancelled')");

    if (excludeJobId) {
      queryBuilder.andWhere('job.id != :excludeJobId', { excludeJobId });
    }

    return queryBuilder.getMany();
  }

  async getConflicts(
    accountId: string,
    query: ConflictsQueryDto,
  ): Promise<any> {
    const user = await this.userRepository.findOne({
      where: { id: query.userId, accountId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const startDate = new Date(query.startDate);
    const endDate = new Date(query.endDate);

    const conflicts = await this.findConflicts(
      accountId,
      query.userId,
      startDate,
      endDate,
    );

    const enrichedConflicts = await Promise.all(
      conflicts.map(async (job) => {
        const assignedUsers = await this.getAssignedUsers(
          job.assignedTo,
          accountId,
        );
        return {
          ...job,
          assignedUsers,
        };
      }),
    );

    return {
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      startDate: query.startDate,
      endDate: query.endDate,
      hasConflicts: enrichedConflicts.length > 0,
      conflicts: enrichedConflicts,
    };
  }

  async getTeamAvailability(accountId: string, date: string): Promise<any> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const jobs = await this.jobRepository.find({
      where: {
        accountId,
        scheduledStart: Between(startOfDay, endOfDay),
        status: In(['scheduled', 'en_route', 'in_progress']),
      },
      order: { scheduledStart: 'ASC' },
    });

    const allUsers = await this.userRepository.find({
      where: { accountId, status: 'active' },
      order: { firstName: 'ASC', lastName: 'ASC' },
    });

    const userSchedules = allUsers.map((user) => {
      const userJobs = jobs.filter((job) =>
        job.assignedTo.includes(user.id),
      );

      return {
        userId: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        jobs: userJobs.map((job) => ({
          jobId: job.id,
          jobNumber: job.jobNumber,
          title: job.title,
          scheduledStart: job.scheduledStart,
          scheduledEnd: job.scheduledEnd,
          status: job.status,
        })),
        totalJobs: userJobs.length,
      };
    });

    return {
      date,
      totalUsers: allUsers.length,
      totalJobs: jobs.length,
      schedules: userSchedules,
    };
  }

  private async getAssignedUsers(
    userIds: string[],
    accountId: string,
  ): Promise<any[]> {
    if (!userIds || userIds.length === 0) {
      return [];
    }

    const users = await this.userRepository.find({
      where: {
        id: In(userIds),
        accountId,
      },
    });

    return users.map((user) => ({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
    }));
  }
}
