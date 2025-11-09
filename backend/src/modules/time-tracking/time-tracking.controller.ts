import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { TimeTrackingService } from './time-tracking.service';
import { ClockInDto } from './dto/clock-in.dto';
import { ClockOutDto } from './dto/clock-out.dto';
import { UpdateEntryDto } from './dto/update-entry.dto';
import { RejectEntryDto } from './dto/reject-entry.dto';
import { EntriesQueryDto } from './dto/entries-query.dto';
import { TimesheetQueryDto } from './dto/timesheet-query.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Time Tracking')
@ApiBearerAuth()
@Controller('time-entries')
@UseGuards(JwtAuthGuard)
export class TimeTrackingController {
  constructor(private readonly timeTrackingService: TimeTrackingService) {}

  @Post('clock-in')
  @ApiOperation({
    summary: 'Clock in',
    description:
      'Create a new time entry by clocking in. Optionally associate with a job. Captures GPS location if provided.',
  })
  @ApiResponse({
    status: 201,
    description: 'Clocked in successfully',
    schema: {
      example: {
        id: '990e8400-e29b-41d4-a716-446655440000',
        accountId: '110e8400-e29b-41d4-a716-446655440000',
        userId: '770e8400-e29b-41d4-a716-446655440000',
        jobId: '550e8400-e29b-41d4-a716-446655440000',
        startTime: '2025-02-01T09:00:00.000Z',
        endTime: null,
        durationMinutes: null,
        startLatitude: 40.7128,
        startLongitude: -74.006,
        endLatitude: null,
        endLongitude: null,
        entryType: 'job',
        isBillable: true,
        status: 'pending',
        notes: 'Starting lawn maintenance',
        createdAt: '2025-02-01T09:00:00.000Z',
        updatedAt: '2025-02-01T09:00:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - user already has active time entry',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Job not found' })
  async clockIn(
    @CurrentUser('accountId') accountId: string,
    @CurrentUser('id') userId: string,
    @Body() clockInDto: ClockInDto,
  ) {
    return this.timeTrackingService.clockIn(accountId, userId, clockInDto);
  }

  @Post(':id/clock-out')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Clock out',
    description:
      'Complete a time entry by clocking out. Calculates duration automatically. Captures GPS location if provided.',
  })
  @ApiParam({
    name: 'id',
    description: 'Time entry ID',
    example: '990e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Clocked out successfully',
    schema: {
      example: {
        id: '990e8400-e29b-41d4-a716-446655440000',
        accountId: '110e8400-e29b-41d4-a716-446655440000',
        userId: '770e8400-e29b-41d4-a716-446655440000',
        jobId: '550e8400-e29b-41d4-a716-446655440000',
        startTime: '2025-02-01T09:00:00.000Z',
        endTime: '2025-02-01T11:00:00.000Z',
        durationMinutes: 120,
        startLatitude: 40.7128,
        startLongitude: -74.006,
        endLatitude: 40.7128,
        endLongitude: -74.006,
        entryType: 'job',
        isBillable: true,
        status: 'pending',
        notes: 'Starting lawn maintenance\nCompleted lawn maintenance',
        createdAt: '2025-02-01T09:00:00.000Z',
        updatedAt: '2025-02-01T11:00:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - already clocked out',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Time entry not found' })
  async clockOut(
    @Param('id') id: string,
    @CurrentUser('accountId') accountId: string,
    @CurrentUser('id') userId: string,
    @Body() clockOutDto: ClockOutDto,
  ) {
    return this.timeTrackingService.clockOut(
      id,
      accountId,
      userId,
      clockOutDto,
    );
  }

  @Get()
  @ApiOperation({
    summary: 'List time entries',
    description:
      'Get a paginated list of time entries with optional filters for user, job, date range, status, and entry type.',
  })
  @ApiResponse({
    status: 200,
    description: 'Time entries retrieved successfully',
    schema: {
      example: {
        data: [
          {
            id: '990e8400-e29b-41d4-a716-446655440000',
            userId: '770e8400-e29b-41d4-a716-446655440000',
            jobId: '550e8400-e29b-41d4-a716-446655440000',
            startTime: '2025-02-01T09:00:00.000Z',
            endTime: '2025-02-01T11:00:00.000Z',
            durationMinutes: 120,
            entryType: 'job',
            isBillable: true,
            status: 'pending',
            user: {
              id: '770e8400-e29b-41d4-a716-446655440000',
              firstName: 'John',
              lastName: 'Smith',
            },
            job: {
              id: '550e8400-e29b-41d4-a716-446655440000',
              jobNumber: 'J-00001',
              title: 'Monthly Lawn Care',
              client: {
                firstName: 'Jane',
                lastName: 'Doe',
              },
            },
          },
        ],
        meta: {
          total: 100,
          page: 1,
          limit: 50,
          totalPages: 2,
          hasNextPage: true,
          hasPreviousPage: false,
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAll(
    @CurrentUser('accountId') accountId: string,
    @Query() query: EntriesQueryDto,
  ) {
    return this.timeTrackingService.findAll(accountId, query);
  }

  @Get('timesheets')
  @ApiOperation({
    summary: 'Get timesheet summary',
    description:
      'Get aggregated timesheet data for a date range. Can be grouped by day or week. Includes total hours, billable hours, and breakdown by date.',
  })
  @ApiResponse({
    status: 200,
    description: 'Timesheet retrieved successfully',
    schema: {
      example: {
        startDate: '2025-02-01',
        endDate: '2025-02-28',
        groupBy: 'day',
        summary: {
          totalMinutes: 9600,
          totalHours: 160,
          billableMinutes: 8400,
          billableHours: 140,
          entriesCount: 40,
        },
        data: {
          '2025-02-01': {
            date: '2025-02-01',
            entries: [],
            totalMinutes: 480,
            totalHours: 8,
            billableMinutes: 420,
            billableHours: 7,
          },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getTimesheets(
    @CurrentUser('accountId') accountId: string,
    @Query() query: TimesheetQueryDto,
  ) {
    return this.timeTrackingService.getTimesheets(accountId, query);
  }

  @Get('timesheets/:userId')
  @ApiOperation({
    summary: 'Get user timesheet',
    description:
      'Get timesheet data for a specific user with aggregated totals and breakdown by date.',
  })
  @ApiParam({
    name: 'userId',
    description: 'User ID',
    example: '770e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'User timesheet retrieved successfully',
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
        groupBy: 'day',
        summary: {
          totalMinutes: 9600,
          totalHours: 160,
          billableMinutes: 8400,
          billableHours: 140,
          entriesCount: 40,
        },
        data: {},
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserTimesheet(
    @Param('userId') userId: string,
    @CurrentUser('accountId') accountId: string,
    @Query() query: TimesheetQueryDto,
  ) {
    return this.timeTrackingService.getUserTimesheet(
      accountId,
      userId,
      query,
    );
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get time entry by ID',
    description:
      'Get a single time entry by ID with related user, job, and client information.',
  })
  @ApiParam({
    name: 'id',
    description: 'Time entry ID',
    example: '990e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Time entry retrieved successfully',
    schema: {
      example: {
        id: '990e8400-e29b-41d4-a716-446655440000',
        userId: '770e8400-e29b-41d4-a716-446655440000',
        jobId: '550e8400-e29b-41d4-a716-446655440000',
        startTime: '2025-02-01T09:00:00.000Z',
        endTime: '2025-02-01T11:00:00.000Z',
        durationMinutes: 120,
        entryType: 'job',
        isBillable: true,
        status: 'pending',
        user: {
          id: '770e8400-e29b-41d4-a716-446655440000',
          firstName: 'John',
          lastName: 'Smith',
        },
        job: {
          id: '550e8400-e29b-41d4-a716-446655440000',
          jobNumber: 'J-00001',
          title: 'Monthly Lawn Care',
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Time entry not found' })
  async findById(
    @Param('id') id: string,
    @CurrentUser('accountId') accountId: string,
  ) {
    return this.timeTrackingService.findById(id, accountId);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update time entry',
    description:
      'Update a time entry. Can only update entries that are not approved. Validates for overlapping entries.',
  })
  @ApiParam({
    name: 'id',
    description: 'Time entry ID',
    example: '990e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Time entry updated successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation failed or overlapping entries',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - cannot update approved entry',
  })
  @ApiResponse({ status: 404, description: 'Time entry not found' })
  async update(
    @Param('id') id: string,
    @CurrentUser('accountId') accountId: string,
    @Body() updateEntryDto: UpdateEntryDto,
  ) {
    return this.timeTrackingService.update(id, accountId, updateEntryDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete time entry',
    description:
      'Delete a time entry. Can only delete entries that are not approved.',
  })
  @ApiParam({
    name: 'id',
    description: 'Time entry ID',
    example: '990e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Time entry deleted successfully',
    schema: {
      example: {
        message: 'Time entry deleted successfully',
        id: '990e8400-e29b-41d4-a716-446655440000',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - cannot delete approved entry',
  })
  @ApiResponse({ status: 404, description: 'Time entry not found' })
  async delete(
    @Param('id') id: string,
    @CurrentUser('accountId') accountId: string,
  ) {
    await this.timeTrackingService.delete(id, accountId);
    return {
      message: 'Time entry deleted successfully',
      id,
    };
  }

  @Post(':id/approve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Approve time entry',
    description:
      'Approve a time entry. Only completed entries (with clock-out) can be approved.',
  })
  @ApiParam({
    name: 'id',
    description: 'Time entry ID',
    example: '990e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Time entry approved successfully',
    schema: {
      example: {
        id: '990e8400-e29b-41d4-a716-446655440000',
        status: 'approved',
        approvedBy: '770e8400-e29b-41d4-a716-446655440000',
        approvedAt: '2025-02-01T12:00:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - entry already approved or not clocked out',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Time entry not found' })
  async approve(
    @Param('id') id: string,
    @CurrentUser('accountId') accountId: string,
    @CurrentUser('id') approverId: string,
  ) {
    return this.timeTrackingService.approve(id, accountId, approverId);
  }

  @Post(':id/reject')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Reject time entry',
    description:
      'Reject a time entry with a reason. Cannot reject already approved entries.',
  })
  @ApiParam({
    name: 'id',
    description: 'Time entry ID',
    example: '990e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Time entry rejected successfully',
    schema: {
      example: {
        id: '990e8400-e29b-41d4-a716-446655440000',
        status: 'rejected',
        approvedBy: '770e8400-e29b-41d4-a716-446655440000',
        approvedAt: '2025-02-01T12:00:00.000Z',
        notes: 'Rejection reason: Time entry overlaps with another entry',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - cannot reject approved entry',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Time entry not found' })
  async reject(
    @Param('id') id: string,
    @CurrentUser('accountId') accountId: string,
    @CurrentUser('id') approverId: string,
    @Body() rejectDto: RejectEntryDto,
  ) {
    return this.timeTrackingService.reject(
      id,
      accountId,
      approverId,
      rejectDto.reason,
    );
  }
}
