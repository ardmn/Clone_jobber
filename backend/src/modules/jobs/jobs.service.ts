import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In, Between } from 'typeorm';
import { Job } from '../../database/entities/job.entity';
import { JobPhoto } from '../../database/entities/job-photo.entity';
import { Client } from '../../database/entities/client.entity';
import { Quote } from '../../database/entities/quote.entity';
import { Invoice } from '../../database/entities/invoice.entity';
import { User } from '../../database/entities/user.entity';
import { Sequence } from '../../database/entities/sequence.entity';
import { TimeEntry } from '../../database/entities/time-entry.entity';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { AddPhotoDto } from './dto/add-photo.dto';
import { CompleteJobDto } from './dto/complete-job.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { JobsQueryDto } from './dto/jobs-query.dto';

@Injectable()
export class JobsService {
  private readonly logger = new Logger(JobsService.name);

  constructor(
    @InjectRepository(Job)
    private jobRepository: Repository<Job>,
    @InjectRepository(JobPhoto)
    private photoRepository: Repository<JobPhoto>,
    @InjectRepository(Client)
    private clientRepository: Repository<Client>,
    @InjectRepository(Quote)
    private quoteRepository: Repository<Quote>,
    @InjectRepository(Invoice)
    private invoiceRepository: Repository<Invoice>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Sequence)
    private sequenceRepository: Repository<Sequence>,
    @InjectRepository(TimeEntry)
    private timeEntryRepository: Repository<TimeEntry>,
    private dataSource: DataSource,
  ) {}

  async findAll(accountId: string, query: JobsQueryDto) {
    const {
      page = 1,
      limit = 50,
      status,
      assignedTo,
      startDate,
      endDate,
      priority,
    } = query;

    const queryBuilder = this.jobRepository
      .createQueryBuilder('job')
      .leftJoinAndSelect('job.client', 'client')
      .leftJoinAndSelect('job.address', 'address')
      .leftJoinAndSelect('job.photos', 'photos')
      .where('job.accountId = :accountId', { accountId });

    if (status) {
      queryBuilder.andWhere('job.status = :status', { status });
    }

    if (assignedTo) {
      queryBuilder.andWhere(':assignedTo = ANY(job.assignedTo)', { assignedTo });
    }

    if (priority) {
      queryBuilder.andWhere('job.priority = :priority', { priority });
    }

    if (startDate && endDate) {
      queryBuilder.andWhere('job.scheduledStart BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });
    } else if (startDate) {
      queryBuilder.andWhere('job.scheduledStart >= :startDate', { startDate });
    } else if (endDate) {
      queryBuilder.andWhere('job.scheduledStart <= :endDate', { endDate });
    }

    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    queryBuilder.orderBy('job.scheduledStart', 'ASC');

    const total = await queryBuilder.getCount();
    const jobs = await queryBuilder.getMany();

    const totalPages = Math.ceil(total / limit);

    return {
      data: jobs,
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

  async create(accountId: string, userId: string, createJobDto: CreateJobDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const client = await this.clientRepository.findOne({
        where: { id: createJobDto.clientId, accountId },
      });

      if (!client) {
        throw new NotFoundException('Client not found');
      }

      if (createJobDto.quoteId) {
        const quote = await this.quoteRepository.findOne({
          where: { id: createJobDto.quoteId, accountId },
        });

        if (!quote) {
          throw new NotFoundException('Quote not found');
        }
      }

      if (createJobDto.assignedTo && createJobDto.assignedTo.length > 0) {
        await this.validateAssignedUsers(accountId, createJobDto.assignedTo);
      }

      if (createJobDto.scheduledStart && createJobDto.scheduledEnd) {
        const start = new Date(createJobDto.scheduledStart);
        const end = new Date(createJobDto.scheduledEnd);

        if (end <= start) {
          throw new BadRequestException('Scheduled end time must be after start time');
        }
      }

      const jobNumber = await this.generateJobNumber(accountId, queryRunner);

      const { instructions, ...jobData } = createJobDto;

      const job = this.jobRepository.create({
        ...jobData,
        accountId,
        jobNumber,
        createdBy: userId,
        status: 'scheduled',
        priority: 'normal',
        clientInstructions: instructions,
        assignedTo: createJobDto.assignedTo || [],
      });

      const savedJob = await queryRunner.manager.save(Job, job);

      await queryRunner.commitTransaction();

      return this.findById(savedJob.id, accountId);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Failed to create job: ${error.message}`, error.stack);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findById(id: string, accountId: string) {
    const job = await this.jobRepository.findOne({
      where: { id, accountId },
      relations: ['client', 'address', 'photos', 'quote'],
      order: {
        photos: {
          sortOrder: 'ASC',
        },
      },
    });

    if (!job) {
      throw new NotFoundException(`Job with ID ${id} not found`);
    }

    return job;
  }

  async update(id: string, accountId: string, updateJobDto: UpdateJobDto) {
    const job = await this.findById(id, accountId);

    if (job.status === 'completed') {
      throw new BadRequestException('Cannot update a completed job');
    }

    if (updateJobDto.assignedTo && updateJobDto.assignedTo.length > 0) {
      await this.validateAssignedUsers(accountId, updateJobDto.assignedTo);
    }

    if (updateJobDto.scheduledStart && updateJobDto.scheduledEnd) {
      const start = new Date(updateJobDto.scheduledStart);
      const end = new Date(updateJobDto.scheduledEnd);

      if (end <= start) {
        throw new BadRequestException('Scheduled end time must be after start time');
      }
    }

    const { instructions, ...jobData } = updateJobDto;

    Object.assign(job, jobData);

    if (instructions !== undefined) {
      job.clientInstructions = instructions;
    }

    await this.jobRepository.save(job);

    return this.findById(id, accountId);
  }

  async updateSchedule(id: string, accountId: string, updateScheduleDto: UpdateScheduleDto) {
    const job = await this.findById(id, accountId);

    if (job.status === 'completed' || job.status === 'cancelled') {
      throw new BadRequestException(
        `Cannot update schedule for ${job.status} job`,
      );
    }

    if (updateScheduleDto.assignedTo) {
      await this.validateAssignedUsers(accountId, updateScheduleDto.assignedTo);

      if (updateScheduleDto.scheduledStart && updateScheduleDto.scheduledEnd) {
        for (const userId of updateScheduleDto.assignedTo) {
          const hasConflict = await this.checkConflicts(
            userId,
            new Date(updateScheduleDto.scheduledStart),
            new Date(updateScheduleDto.scheduledEnd),
            id,
          );

          if (hasConflict) {
            const user = await this.userRepository.findOne({ where: { id: userId } });
            this.logger.warn(
              `Scheduling conflict detected for user ${user?.firstName} ${user?.lastName}`,
            );
          }
        }
      }
    }

    if (updateScheduleDto.scheduledStart && updateScheduleDto.scheduledEnd) {
      const start = new Date(updateScheduleDto.scheduledStart);
      const end = new Date(updateScheduleDto.scheduledEnd);

      if (end <= start) {
        throw new BadRequestException('Scheduled end time must be after start time');
      }
    }

    Object.assign(job, updateScheduleDto);

    await this.jobRepository.save(job);

    return this.findById(id, accountId);
  }

  async assignTeam(id: string, accountId: string, userIds: string[]) {
    const job = await this.findById(id, accountId);

    if (job.status === 'completed' || job.status === 'cancelled') {
      throw new BadRequestException(
        `Cannot assign team to ${job.status} job`,
      );
    }

    await this.validateAssignedUsers(accountId, userIds);

    if (job.scheduledStart && job.scheduledEnd) {
      for (const userId of userIds) {
        const hasConflict = await this.checkConflicts(
          userId,
          job.scheduledStart,
          job.scheduledEnd,
          id,
        );

        if (hasConflict) {
          const user = await this.userRepository.findOne({ where: { id: userId } });
          this.logger.warn(
            `Scheduling conflict detected for user ${user?.firstName} ${user?.lastName}`,
          );
        }
      }
    }

    job.assignedTo = userIds;
    await this.jobRepository.save(job);

    return this.findById(id, accountId);
  }

  async addPhoto(jobId: string, accountId: string, userId: string, addPhotoDto: AddPhotoDto) {
    const job = await this.findById(jobId, accountId);

    const existingPhotos = await this.photoRepository.count({ where: { jobId } });

    const photo = this.photoRepository.create({
      ...addPhotoDto,
      jobId,
      uploadedBy: userId,
      sortOrder: existingPhotos,
    });

    const savedPhoto = await this.photoRepository.save(photo);

    this.logger.log(`Photo added to job ${job.jobNumber}`);

    return savedPhoto;
  }

  async deletePhoto(photoId: string, accountId: string) {
    const photo = await this.photoRepository.findOne({
      where: { id: photoId },
      relations: ['job'],
    });

    if (!photo) {
      throw new NotFoundException('Photo not found');
    }

    if (photo.job.accountId !== accountId) {
      throw new NotFoundException('Photo not found');
    }

    await this.photoRepository.remove(photo);

    return {
      message: 'Photo deleted successfully',
      id: photoId,
    };
  }

  async complete(id: string, accountId: string, completeDto: CompleteJobDto) {
    const job = await this.findById(id, accountId);

    if (job.status === 'completed') {
      throw new BadRequestException('Job is already completed');
    }

    if (job.status === 'cancelled') {
      throw new BadRequestException('Cannot complete a cancelled job');
    }

    job.status = 'completed';
    job.actualEnd = new Date();
    job.clientSignature = completeDto.signature;
    job.completionNotes = completeDto.completionNotes;

    if (!job.actualStart) {
      job.actualStart = job.scheduledStart || new Date();
    }

    await this.jobRepository.save(job);

    this.logger.log(`Job ${job.jobNumber} marked as completed`);
    console.log(`[AUTOMATION] Job ${job.jobNumber} completed. Triggering invoice creation...`);

    return {
      message: 'Job completed successfully',
      job: await this.findById(id, accountId),
    };
  }

  async updateStatus(id: string, accountId: string, status: string) {
    const job = await this.findById(id, accountId);

    const validTransitions = this.getValidStatusTransitions(job.status);

    if (!validTransitions.includes(status)) {
      throw new BadRequestException(
        `Cannot transition from ${job.status} to ${status}`,
      );
    }

    if (status === 'in_progress' && !job.actualStart) {
      job.actualStart = new Date();
    }

    if (status === 'completed') {
      throw new BadRequestException(
        'Use the complete endpoint to mark job as completed',
      );
    }

    job.status = status;
    await this.jobRepository.save(job);

    this.logger.log(`Job ${job.jobNumber} status updated to ${status}`);

    return this.findById(id, accountId);
  }

  async delete(id: string, accountId: string) {
    const job = await this.findById(id, accountId);

    if (job.status === 'completed') {
      throw new BadRequestException('Cannot delete a completed job');
    }

    const hasInvoices = await this.invoiceRepository.count({
      where: { jobId: id },
    });

    if (hasInvoices > 0) {
      throw new BadRequestException('Cannot delete a job that has invoices');
    }

    await this.jobRepository.softDelete(id);

    return {
      message: 'Job deleted successfully',
      id,
    };
  }

  private async validateAssignedUsers(accountId: string, userIds: string[]): Promise<void> {
    const users = await this.userRepository.find({
      where: {
        id: In(userIds),
        accountId,
      },
    });

    if (users.length !== userIds.length) {
      const foundIds = users.map(u => u.id);
      const missingIds = userIds.filter(id => !foundIds.includes(id));
      throw new NotFoundException(
        `Users not found or don't belong to this account: ${missingIds.join(', ')}`,
      );
    }
  }

  private async checkConflicts(
    userId: string,
    start: Date,
    end: Date,
    excludeJobId?: string,
  ): Promise<boolean> {
    const queryBuilder = this.jobRepository
      .createQueryBuilder('job')
      .where(':userId = ANY(job.assignedTo)', { userId })
      .andWhere('job.status NOT IN (:...excludedStatuses)', {
        excludedStatuses: ['completed', 'cancelled'],
      })
      .andWhere(
        '(job.scheduledStart, job.scheduledEnd) OVERLAPS (:start, :end)',
        { start, end },
      );

    if (excludeJobId) {
      queryBuilder.andWhere('job.id != :excludeJobId', { excludeJobId });
    }

    const count = await queryBuilder.getCount();
    return count > 0;
  }

  private getValidStatusTransitions(currentStatus: string): string[] {
    const transitions: Record<string, string[]> = {
      scheduled: ['en_route', 'in_progress', 'on_hold', 'cancelled'],
      en_route: ['in_progress', 'on_hold', 'cancelled'],
      in_progress: ['on_hold', 'completed', 'cancelled'],
      on_hold: ['scheduled', 'in_progress', 'cancelled'],
      completed: [],
      cancelled: [],
    };

    return transitions[currentStatus] || [];
  }

  private async generateJobNumber(accountId: string, queryRunner: any): Promise<string> {
    let sequence = await queryRunner.manager.findOne(Sequence, {
      where: { accountId, sequenceType: 'job' },
    });

    if (!sequence) {
      sequence = queryRunner.manager.create(Sequence, {
        accountId,
        sequenceType: 'job',
        prefix: 'J',
        currentValue: 0,
      });
    }

    sequence.currentValue += 1;
    await queryRunner.manager.save(Sequence, sequence);

    const paddedNumber = String(sequence.currentValue).padStart(5, '0');
    return `${sequence.prefix}-${paddedNumber}`;
  }
}
