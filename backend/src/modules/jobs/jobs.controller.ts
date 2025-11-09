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
import { JobsService } from './jobs.service';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { AddPhotoDto } from './dto/add-photo.dto';
import { CompleteJobDto } from './dto/complete-job.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { JobsQueryDto } from './dto/jobs-query.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Jobs')
@ApiBearerAuth()
@Controller('jobs')
@UseGuards(JwtAuthGuard)
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Get()
  @ApiOperation({
    summary: 'List all jobs',
    description: 'Get a paginated list of jobs with optional filters',
  })
  @ApiResponse({
    status: 200,
    description: 'Jobs retrieved successfully',
    schema: {
      example: {
        data: [
          {
            id: '550e8400-e29b-41d4-a716-446655440000',
            jobNumber: 'J-00001',
            title: 'Monthly Lawn Care Service',
            status: 'scheduled',
            priority: 'normal',
            scheduledStart: '2025-02-01T09:00:00.000Z',
            scheduledEnd: '2025-02-01T11:00:00.000Z',
            estimatedValue: 250.00,
            assignedTo: ['770e8400-e29b-41d4-a716-446655440000'],
            client: {
              id: '660e8400-e29b-41d4-a716-446655440000',
              firstName: 'John',
              lastName: 'Doe',
            },
            photos: [],
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
    @Query() query: JobsQueryDto,
  ) {
    return this.jobsService.findAll(accountId, query);
  }

  @Post()
  @ApiOperation({
    summary: 'Create a new job',
    description: 'Create a new job from a quote or as a standalone job',
  })
  @ApiResponse({
    status: 201,
    description: 'Job created successfully',
    schema: {
      example: {
        id: '550e8400-e29b-41d4-a716-446655440000',
        jobNumber: 'J-00001',
        title: 'Monthly Lawn Care Service',
        description: 'Mowing, edging, and cleanup',
        status: 'scheduled',
        priority: 'normal',
        scheduledStart: '2025-02-01T09:00:00.000Z',
        scheduledEnd: '2025-02-01T11:00:00.000Z',
        assignedTo: ['770e8400-e29b-41d4-a716-446655440000'],
        estimatedValue: 250.00,
        clientInstructions: 'Use side gate',
        client: {
          id: '660e8400-e29b-41d4-a716-446655440000',
          firstName: 'John',
          lastName: 'Doe',
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Client or quote not found' })
  async create(
    @CurrentUser('accountId') accountId: string,
    @CurrentUser('id') userId: string,
    @Body() createJobDto: CreateJobDto,
  ) {
    return this.jobsService.create(accountId, userId, createJobDto);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get job by ID',
    description: 'Get a single job by ID with photos and details',
  })
  @ApiParam({
    name: 'id',
    description: 'Job ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Job retrieved successfully',
    schema: {
      example: {
        id: '550e8400-e29b-41d4-a716-446655440000',
        jobNumber: 'J-00001',
        title: 'Monthly Lawn Care Service',
        status: 'in_progress',
        client: {
          id: '660e8400-e29b-41d4-a716-446655440000',
          firstName: 'John',
          lastName: 'Doe',
        },
        photos: [],
        quote: null,
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Job not found' })
  async findById(
    @Param('id') id: string,
    @CurrentUser('accountId') accountId: string,
  ) {
    return this.jobsService.findById(id, accountId);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update a job',
    description: 'Update job details. Cannot update completed jobs.',
  })
  @ApiParam({
    name: 'id',
    description: 'Job ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Job updated successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request - cannot update job in current status' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Job not found' })
  async update(
    @Param('id') id: string,
    @CurrentUser('accountId') accountId: string,
    @Body() updateJobDto: UpdateJobDto,
  ) {
    return this.jobsService.update(id, accountId, updateJobDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete a job',
    description: 'Soft delete a job. Cannot delete completed jobs or jobs with invoices.',
  })
  @ApiParam({
    name: 'id',
    description: 'Job ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Job deleted successfully',
    schema: {
      example: {
        message: 'Job deleted successfully',
        id: '550e8400-e29b-41d4-a716-446655440000',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Cannot delete job in current status or with invoices' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Job not found' })
  async delete(
    @Param('id') id: string,
    @CurrentUser('accountId') accountId: string,
  ) {
    return this.jobsService.delete(id, accountId);
  }

  @Patch(':id/schedule')
  @ApiOperation({
    summary: 'Update job schedule',
    description: 'Update scheduled times and assigned team members. Checks for scheduling conflicts.',
  })
  @ApiParam({
    name: 'id',
    description: 'Job ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Schedule updated successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request - invalid schedule or conflicts' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Job not found' })
  async updateSchedule(
    @Param('id') id: string,
    @CurrentUser('accountId') accountId: string,
    @Body() updateScheduleDto: UpdateScheduleDto,
  ) {
    return this.jobsService.updateSchedule(id, accountId, updateScheduleDto);
  }

  @Patch(':id/assign')
  @ApiOperation({
    summary: 'Assign team members to job',
    description: 'Assign one or more team members to the job. Validates users exist in account.',
  })
  @ApiParam({
    name: 'id',
    description: 'Job ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Team assigned successfully',
    schema: {
      example: {
        assignedTo: [
          '770e8400-e29b-41d4-a716-446655440000',
          '880e8400-e29b-41d4-a716-446655440000',
        ],
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request - users not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Job not found' })
  async assignTeam(
    @Param('id') id: string,
    @CurrentUser('accountId') accountId: string,
    @Body('userIds') userIds: string[],
  ) {
    return this.jobsService.assignTeam(id, accountId, userIds);
  }

  @Post(':id/photos')
  @ApiOperation({
    summary: 'Add photo to job',
    description: 'Add a photo to the job. Photos are categorized by type (before/during/after/general).',
  })
  @ApiParam({
    name: 'id',
    description: 'Job ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 201,
    description: 'Photo added successfully',
    schema: {
      example: {
        id: '990e8400-e29b-41d4-a716-446655440000',
        jobId: '550e8400-e29b-41d4-a716-446655440000',
        fileUrl: 'https://s3.amazonaws.com/bucket/photos/abc123.jpg',
        fileName: 'lawn-before-service.jpg',
        caption: 'Lawn condition before service',
        photoType: 'before',
        uploadedBy: '770e8400-e29b-41d4-a716-446655440000',
        uploadedAt: '2025-02-01T09:00:00.000Z',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Job not found' })
  async addPhoto(
    @Param('id') jobId: string,
    @CurrentUser('accountId') accountId: string,
    @CurrentUser('id') userId: string,
    @Body() addPhotoDto: AddPhotoDto,
  ) {
    return this.jobsService.addPhoto(jobId, accountId, userId, addPhotoDto);
  }

  @Delete(':id/photos/:photoId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete photo from job',
    description: 'Remove a photo from the job',
  })
  @ApiParam({
    name: 'id',
    description: 'Job ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiParam({
    name: 'photoId',
    description: 'Photo ID',
    example: '990e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Photo deleted successfully',
    schema: {
      example: {
        message: 'Photo deleted successfully',
        id: '990e8400-e29b-41d4-a716-446655440000',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Photo not found' })
  async deletePhoto(
    @Param('photoId') photoId: string,
    @CurrentUser('accountId') accountId: string,
  ) {
    return this.jobsService.deletePhoto(photoId, accountId);
  }

  @Post(':id/complete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Complete job',
    description: 'Mark job as completed with client signature. Triggers invoice creation.',
  })
  @ApiParam({
    name: 'id',
    description: 'Job ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Job completed successfully',
    schema: {
      example: {
        message: 'Job completed successfully',
        job: {
          id: '550e8400-e29b-41d4-a716-446655440000',
          status: 'completed',
          actualStart: '2025-02-01T09:00:00.000Z',
          actualEnd: '2025-02-01T11:00:00.000Z',
          clientSignature: 'data:image/png;base64,...',
          completionNotes: 'Job completed successfully',
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request - job already completed or cancelled' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Job not found' })
  async complete(
    @Param('id') id: string,
    @CurrentUser('accountId') accountId: string,
    @Body() completeDto: CompleteJobDto,
  ) {
    return this.jobsService.complete(id, accountId, completeDto);
  }

  @Patch(':id/status')
  @ApiOperation({
    summary: 'Update job status',
    description: 'Update job status. Validates status transitions (scheduled -> en_route -> in_progress, etc.).',
  })
  @ApiParam({
    name: 'id',
    description: 'Job ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Status updated successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request - invalid status transition' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Job not found' })
  async updateStatus(
    @Param('id') id: string,
    @CurrentUser('accountId') accountId: string,
    @Body() updateStatusDto: UpdateStatusDto,
  ) {
    return this.jobsService.updateStatus(id, accountId, updateStatusDto.status);
  }

  @Get(':id/forms')
  @ApiOperation({
    summary: 'Get job forms',
    description: 'Get all forms associated with this job (placeholder - not yet implemented)',
  })
  @ApiParam({
    name: 'id',
    description: 'Job ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Forms placeholder',
    schema: {
      example: {
        message: 'Job forms not yet implemented',
        forms: [],
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Job not found' })
  async getForms(
    @Param('id') id: string,
    @CurrentUser('accountId') accountId: string,
  ) {
    const job = await this.jobsService.findById(id, accountId);
    return {
      message: 'Job forms not yet implemented',
      forms: [],
      jobId: job.id,
    };
  }
}
