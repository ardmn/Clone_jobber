import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from '../../database/entities/audit-log.entity';
import { AuditLogsQueryDto } from './dto/audit-logs-query.dto';

@Injectable()
export class AuditLogsService {
  private readonly logger = new Logger(AuditLogsService.name);

  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
  ) {}

  /**
   * List audit logs with pagination and filters
   */
  async findAll(accountId: string, query: AuditLogsQueryDto) {
    const {
      page = 1,
      limit = 50,
      userId,
      entityType,
      entityId,
      action,
      startDate,
      endDate,
    } = query;

    const queryBuilder = this.auditLogRepository
      .createQueryBuilder('auditLog')
      .leftJoinAndSelect('auditLog.user', 'user')
      .where('auditLog.accountId = :accountId', { accountId });

    if (userId) {
      queryBuilder.andWhere('auditLog.userId = :userId', { userId });
    }

    if (entityType) {
      queryBuilder.andWhere('auditLog.entityType = :entityType', { entityType });
    }

    if (entityId) {
      queryBuilder.andWhere('auditLog.entityId = :entityId', { entityId });
    }

    if (action) {
      queryBuilder.andWhere('auditLog.action = :action', { action });
    }

    if (startDate && endDate) {
      queryBuilder.andWhere('auditLog.createdAt BETWEEN :startDate AND :endDate', {
        startDate: new Date(startDate),
        endDate: new Date(endDate),
      });
    } else if (startDate) {
      queryBuilder.andWhere('auditLog.createdAt >= :startDate', {
        startDate: new Date(startDate),
      });
    } else if (endDate) {
      queryBuilder.andWhere('auditLog.createdAt <= :endDate', {
        endDate: new Date(endDate),
      });
    }

    const [logs, total] = await queryBuilder
      .orderBy('auditLog.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    const totalPages = Math.ceil(total / limit);

    return {
      data: logs.map((log) => this.mapLogToResponse(log)),
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

  /**
   * Get audit log by ID
   */
  async findById(id: string, accountId: string) {
    const log = await this.auditLogRepository.findOne({
      where: { id, accountId },
      relations: ['user'],
    });

    if (!log) {
      throw new NotFoundException('Audit log not found');
    }

    return this.mapLogToResponse(log);
  }

  /**
   * Create an audit log entry
   */
  async createLog(
    accountId: string,
    userId: string | null,
    action: string,
    entityType: string,
    entityId: string,
    oldValues: Record<string, any> | null = null,
    newValues: Record<string, any> | null = null,
    ipAddress: string | null = null,
    userAgent: string | null = null,
  ): Promise<AuditLog> {
    try {
      const auditLog = this.auditLogRepository.create({
        accountId,
        userId,
        action,
        entityType,
        entityId,
        oldValues,
        newValues,
        ipAddress,
        userAgent,
      });

      const savedLog = await this.auditLogRepository.save(auditLog);

      this.logger.log(
        `Audit log created: ${action} on ${entityType}:${entityId} by user ${userId}`,
      );

      return savedLog;
    } catch (error) {
      this.logger.error('Failed to create audit log:', error);
      // Don't throw error to avoid breaking the main operation
      return null;
    }
  }

  /**
   * Get audit logs for a specific entity
   */
  async getEntityHistory(
    accountId: string,
    entityType: string,
    entityId: string,
    limit: number = 50,
  ) {
    const logs = await this.auditLogRepository.find({
      where: {
        accountId,
        entityType,
        entityId,
      },
      relations: ['user'],
      order: {
        createdAt: 'DESC',
      },
      take: limit,
    });

    return logs.map((log) => this.mapLogToResponse(log));
  }

  /**
   * Get recent activity for account
   */
  async getRecentActivity(accountId: string, limit: number = 20) {
    const logs = await this.auditLogRepository.find({
      where: { accountId },
      relations: ['user'],
      order: {
        createdAt: 'DESC',
      },
      take: limit,
    });

    return logs.map((log) => this.mapLogToResponse(log));
  }

  /**
   * Get user activity
   */
  async getUserActivity(
    accountId: string,
    userId: string,
    startDate?: Date,
    endDate?: Date,
    limit: number = 50,
  ) {
    const queryBuilder = this.auditLogRepository
      .createQueryBuilder('auditLog')
      .leftJoinAndSelect('auditLog.user', 'user')
      .where('auditLog.accountId = :accountId', { accountId })
      .andWhere('auditLog.userId = :userId', { userId });

    if (startDate && endDate) {
      queryBuilder.andWhere('auditLog.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });
    }

    const logs = await queryBuilder
      .orderBy('auditLog.createdAt', 'DESC')
      .take(limit)
      .getMany();

    return logs.map((log) => this.mapLogToResponse(log));
  }

  /**
   * Map audit log entity to response format
   */
  private mapLogToResponse(log: AuditLog) {
    return {
      id: log.id,
      action: log.action,
      entityType: log.entityType,
      entityId: log.entityId,
      oldValues: log.oldValues,
      newValues: log.newValues,
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
      createdAt: log.createdAt,
      user: log.user
        ? {
            id: log.user.id,
            firstName: log.user.firstName,
            lastName: log.user.lastName,
            email: log.user.email,
          }
        : null,
    };
  }

  /**
   * Get changes between old and new values
   */
  getChanges(log: AuditLog): Record<string, { old: any; new: any }> {
    if (!log.oldValues || !log.newValues) {
      return {};
    }

    const changes: Record<string, { old: any; new: any }> = {};

    // Get all unique keys from both old and new values
    const allKeys = new Set([
      ...Object.keys(log.oldValues),
      ...Object.keys(log.newValues),
    ]);

    allKeys.forEach((key) => {
      const oldValue = log.oldValues?.[key];
      const newValue = log.newValues?.[key];

      if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
        changes[key] = {
          old: oldValue,
          new: newValue,
        };
      }
    });

    return changes;
  }
}
