import {
  Controller,
  Get,
  Patch,
  Body,
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
import { ScheduleService } from './schedule.service';
import { ScheduleQueryDto } from './dto/schedule-query.dto';
import { AvailabilityQueryDto } from './dto/availability-query.dto';
import { UpdateJobScheduleDto } from './dto/update-job-schedule.dto';
import { ConflictsQueryDto } from './dto/conflicts-query.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Schedule')
@ApiBearerAuth()
@Controller('schedule')
@UseGuards(JwtAuthGuard)
export class ScheduleController {
  constructor(private readonly scheduleService: ScheduleService) {}

  @Get()
  @ApiOperation({
    summary: 'Get schedule for date range',
    description:
      'Get all scheduled jobs for a date range with client and address information. Supports filtering by user IDs and job status.',
  })
  @ApiResponse({
    status: 200,
    description: 'Schedule retrieved successfully',
    schema: {
      example: {
        startDate: '2025-02-01',
        endDate: '2025-02-28',
        totalJobs: 25,
        jobs: [
          {
            id: '550e8400-e29b-41d4-a716-446655440000',
            jobNumber: 'J-00001',
            title: 'Monthly Lawn Care',
            status: 'scheduled',
            scheduledStart: '2025-02-01T09:00:00.000Z',
            scheduledEnd: '2025-02-01T11:00:00.000Z',
            assignedTo: ['770e8400-e29b-41d4-a716-446655440000'],
            assignedUsers: [
              {
                id: '770e8400-e29b-41d4-a716-446655440000',
                firstName: 'John',
                lastName: 'Smith',
                email: 'john.smith@example.com',
              },
            ],
            client: {
              id: '660e8400-e29b-41d4-a716-446655440000',
              firstName: 'Jane',
              lastName: 'Doe',
              email: 'jane.doe@example.com',
            },
            address: {
              id: '880e8400-e29b-41d4-a716-446655440000',
              street1: '123 Main St',
              city: 'Springfield',
              state: 'IL',
              postalCode: '62701',
            },
          },
        ],
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getSchedule(
    @CurrentUser('accountId') accountId: string,
    @Query() query: ScheduleQueryDto,
  ) {
    return this.scheduleService.getSchedule(accountId, query);
  }

  @Get('availability')
  @ApiOperation({
    summary: 'Check team member availability',
    description:
      'Check if team members are available during a specific time period. Returns availability status and any scheduling conflicts.',
  })
  @ApiResponse({
    status: 200,
    description: 'Availability checked successfully',
    schema: {
      example: {
        startDate: '2025-02-01T09:00:00.000Z',
        endDate: '2025-02-01T11:00:00.000Z',
        availability: [
          {
            userId: '770e8400-e29b-41d4-a716-446655440000',
            firstName: 'John',
            lastName: 'Smith',
            available: false,
            conflicts: [
              {
                jobId: '550e8400-e29b-41d4-a716-446655440000',
                jobNumber: 'J-00001',
                title: 'Monthly Lawn Care',
                scheduledStart: '2025-02-01T09:00:00.000Z',
                scheduledEnd: '2025-02-01T11:00:00.000Z',
              },
            ],
          },
          {
            userId: '880e8400-e29b-41d4-a716-446655440000',
            firstName: 'Jane',
            lastName: 'Smith',
            available: true,
            conflicts: [],
          },
        ],
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'One or more users not found' })
  async checkAvailability(
    @CurrentUser('accountId') accountId: string,
    @Query() query: AvailabilityQueryDto,
  ) {
    return this.scheduleService.checkAvailability(accountId, query);
  }

  @Get('conflicts')
  @ApiOperation({
    summary: 'Check for scheduling conflicts',
    description:
      'Find all scheduling conflicts for a specific user during a time period.',
  })
  @ApiResponse({
    status: 200,
    description: 'Conflicts checked successfully',
    schema: {
      example: {
        user: {
          id: '770e8400-e29b-41d4-a716-446655440000',
          firstName: 'John',
          lastName: 'Smith',
        },
        startDate: '2025-02-01T09:00:00.000Z',
        endDate: '2025-02-01T11:00:00.000Z',
        hasConflicts: true,
        conflicts: [
          {
            id: '550e8400-e29b-41d4-a716-446655440000',
            jobNumber: 'J-00001',
            title: 'Monthly Lawn Care',
            status: 'scheduled',
            scheduledStart: '2025-02-01T09:00:00.000Z',
            scheduledEnd: '2025-02-01T11:00:00.000Z',
            assignedUsers: [
              {
                id: '770e8400-e29b-41d4-a716-446655440000',
                firstName: 'John',
                lastName: 'Smith',
                email: 'john.smith@example.com',
              },
            ],
          },
        ],
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getConflicts(
    @CurrentUser('accountId') accountId: string,
    @Query() query: ConflictsQueryDto,
  ) {
    return this.scheduleService.getConflicts(accountId, query);
  }

  @Get('users/:userId')
  @ApiOperation({
    summary: "Get user's schedule",
    description:
      "Get all scheduled jobs for a specific user in a date range with full job details.",
  })
  @ApiParam({
    name: 'userId',
    description: 'User ID',
    example: '770e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'User schedule retrieved successfully',
    schema: {
      example: {
        user: {
          id: '770e8400-e29b-41d4-a716-446655440000',
          firstName: 'John',
          lastName: 'Smith',
          email: 'john.smith@example.com',
        },
        startDate: '2025-02-01',
        endDate: '2025-02-28',
        totalJobs: 15,
        jobs: [
          {
            id: '550e8400-e29b-41d4-a716-446655440000',
            jobNumber: 'J-00001',
            title: 'Monthly Lawn Care',
            status: 'scheduled',
            scheduledStart: '2025-02-01T09:00:00.000Z',
            scheduledEnd: '2025-02-01T11:00:00.000Z',
            client: {
              firstName: 'Jane',
              lastName: 'Doe',
            },
          },
        ],
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserSchedule(
    @Param('userId') userId: string,
    @CurrentUser('accountId') accountId: string,
    @Query() query: ScheduleQueryDto,
  ) {
    return this.scheduleService.getUserSchedule(accountId, userId, query);
  }

  @Patch('jobs/:id')
  @ApiOperation({
    summary: 'Update job schedule',
    description:
      'Update scheduled times and assigned team members for a job. Validates for scheduling conflicts before updating.',
  })
  @ApiParam({
    name: 'id',
    description: 'Job ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Job schedule updated successfully',
    schema: {
      example: {
        id: '550e8400-e29b-41d4-a716-446655440000',
        jobNumber: 'J-00001',
        title: 'Monthly Lawn Care',
        scheduledStart: '2025-02-01T09:00:00.000Z',
        scheduledEnd: '2025-02-01T11:00:00.000Z',
        assignedTo: [
          '770e8400-e29b-41d4-a716-446655440000',
          '880e8400-e29b-41d4-a716-446655440000',
        ],
        assignedUsers: [
          {
            id: '770e8400-e29b-41d4-a716-446655440000',
            firstName: 'John',
            lastName: 'Smith',
            email: 'john.smith@example.com',
          },
          {
            id: '880e8400-e29b-41d4-a716-446655440000',
            firstName: 'Jane',
            lastName: 'Smith',
            email: 'jane.smith@example.com',
          },
        ],
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - invalid schedule or conflicts',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Job not found' })
  async updateJobSchedule(
    @Param('id') id: string,
    @CurrentUser('accountId') accountId: string,
    @Body() updateJobScheduleDto: UpdateJobScheduleDto,
  ) {
    return this.scheduleService.updateJobSchedule(
      id,
      accountId,
      updateJobScheduleDto,
    );
  }
}
