import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { AuditLogsService } from './audit-logs.service';
import { AuditLogsQueryDto } from './dto/audit-logs-query.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Audit Logs')
@ApiBearerAuth()
@Controller('audit-logs')
@UseGuards(JwtAuthGuard)
export class AuditLogsController {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  @Get()
  @ApiOperation({
    summary: 'List all audit logs',
    description:
      'Get a paginated list of audit logs with optional filters for user, entity, action, and date range',
  })
  @ApiResponse({
    status: 200,
    description: 'Audit logs retrieved successfully',
    schema: {
      example: {
        data: [
          {
            id: '550e8400-e29b-41d4-a716-446655440000',
            action: 'update',
            entityType: 'invoice',
            entityId: '660e8400-e29b-41d4-a716-446655440000',
            oldValues: {
              status: 'draft',
              total: 500.0,
            },
            newValues: {
              status: 'sent',
              total: 550.0,
            },
            ipAddress: '192.168.1.1',
            userAgent: 'Mozilla/5.0...',
            createdAt: '2025-02-01T10:30:00.000Z',
            user: {
              id: '770e8400-e29b-41d4-a716-446655440000',
              firstName: 'John',
              lastName: 'Doe',
              email: 'john@example.com',
            },
          },
        ],
        meta: {
          total: 1250,
          page: 1,
          limit: 50,
          totalPages: 25,
          hasNextPage: true,
          hasPreviousPage: false,
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAll(
    @CurrentUser('accountId') accountId: string,
    @Query() query: AuditLogsQueryDto,
  ) {
    return this.auditLogsService.findAll(accountId, query);
  }

  @Get('recent')
  @ApiOperation({
    summary: 'Get recent activity',
    description: 'Get the most recent audit log entries for the account (last 20 by default)',
  })
  @ApiResponse({
    status: 200,
    description: 'Recent activity retrieved successfully',
    schema: {
      example: [
        {
          id: '550e8400-e29b-41d4-a716-446655440000',
          action: 'create',
          entityType: 'job',
          entityId: '660e8400-e29b-41d4-a716-446655440000',
          oldValues: null,
          newValues: {
            title: 'Monthly Lawn Care',
            status: 'scheduled',
          },
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0...',
          createdAt: '2025-02-01T10:30:00.000Z',
          user: {
            id: '770e8400-e29b-41d4-a716-446655440000',
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com',
          },
        },
      ],
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getRecentActivity(@CurrentUser('accountId') accountId: string) {
    return this.auditLogsService.getRecentActivity(accountId);
  }

  @Get('entity/:entityType/:entityId')
  @ApiOperation({
    summary: 'Get entity history',
    description: 'Get all audit log entries for a specific entity (e.g., all changes to an invoice)',
  })
  @ApiParam({
    name: 'entityType',
    description: 'Type of entity (e.g., invoice, job, client)',
    example: 'invoice',
  })
  @ApiParam({
    name: 'entityId',
    description: 'ID of the entity',
    example: '660e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Entity history retrieved successfully',
    schema: {
      example: [
        {
          id: '550e8400-e29b-41d4-a716-446655440000',
          action: 'create',
          entityType: 'invoice',
          entityId: '660e8400-e29b-41d4-a716-446655440000',
          oldValues: null,
          newValues: {
            status: 'draft',
            total: 500.0,
          },
          createdAt: '2025-02-01T09:00:00.000Z',
          user: {
            id: '770e8400-e29b-41d4-a716-446655440000',
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com',
          },
        },
        {
          id: '880e8400-e29b-41d4-a716-446655440000',
          action: 'update',
          entityType: 'invoice',
          entityId: '660e8400-e29b-41d4-a716-446655440000',
          oldValues: {
            status: 'draft',
          },
          newValues: {
            status: 'sent',
          },
          createdAt: '2025-02-01T10:30:00.000Z',
          user: {
            id: '770e8400-e29b-41d4-a716-446655440000',
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com',
          },
        },
      ],
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getEntityHistory(
    @CurrentUser('accountId') accountId: string,
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string,
  ) {
    return this.auditLogsService.getEntityHistory(accountId, entityType, entityId);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get audit log by ID',
    description: 'Get a single audit log entry by ID',
  })
  @ApiParam({
    name: 'id',
    description: 'Audit log ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Audit log retrieved successfully',
    schema: {
      example: {
        id: '550e8400-e29b-41d4-a716-446655440000',
        action: 'update',
        entityType: 'invoice',
        entityId: '660e8400-e29b-41d4-a716-446655440000',
        oldValues: {
          status: 'draft',
          total: 500.0,
        },
        newValues: {
          status: 'sent',
          total: 550.0,
        },
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0...',
        createdAt: '2025-02-01T10:30:00.000Z',
        user: {
          id: '770e8400-e29b-41d4-a716-446655440000',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Audit log not found' })
  async findById(
    @Param('id') id: string,
    @CurrentUser('accountId') accountId: string,
  ) {
    return this.auditLogsService.findById(id, accountId);
  }
}
