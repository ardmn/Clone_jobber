import {
  Controller,
  Get,
  Query,
  UseGuards,
  Header,
  StreamableFile,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { DashboardQueryDto } from './dto/dashboard-query.dto';
import { RevenueReportQueryDto } from './dto/revenue-report-query.dto';
import { JobsReportQueryDto } from './dto/jobs-report-query.dto';
import { ExportQueryDto } from './dto/export-query.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Reports')
@ApiBearerAuth()
@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('dashboard')
  @ApiOperation({
    summary: 'Get dashboard metrics',
    description:
      'Get key performance metrics including revenue, jobs, invoices, and clients for the specified date range',
  })
  @ApiResponse({
    status: 200,
    description: 'Dashboard metrics retrieved successfully',
    schema: {
      example: {
        period: {
          startDate: '2025-01-01',
          endDate: '2025-01-31',
        },
        revenue: {
          total: 45000.0,
          currency: 'USD',
        },
        outstandingInvoices: {
          total: 12500.0,
          count: 8,
          currency: 'USD',
        },
        jobs: {
          completed: 42,
          upcoming: 15,
        },
        clients: {
          active: 28,
          total: 150,
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getDashboard(
    @CurrentUser('accountId') accountId: string,
    @Query() query: DashboardQueryDto,
  ) {
    return this.reportsService.getDashboard(accountId, query);
  }

  @Get('revenue')
  @ApiOperation({
    summary: 'Get revenue report',
    description:
      'Get revenue report grouped by time period (day/week/month/year) with billed, paid, and outstanding amounts',
  })
  @ApiResponse({
    status: 200,
    description: 'Revenue report retrieved successfully',
    schema: {
      example: {
        period: {
          startDate: '2025-01-01',
          endDate: '2025-12-31',
          groupBy: 'month',
        },
        summary: {
          totalBilled: 125000.0,
          totalPaid: 110000.0,
          totalOutstanding: 15000.0,
          totalInvoices: 156,
        },
        data: [
          {
            period: '2025-01',
            totalBilled: 12000.0,
            totalPaid: 11000.0,
            totalOutstanding: 1000.0,
            invoiceCount: 15,
          },
          {
            period: '2025-02',
            totalBilled: 15000.0,
            totalPaid: 14000.0,
            totalOutstanding: 1000.0,
            invoiceCount: 18,
          },
        ],
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getRevenueReport(
    @CurrentUser('accountId') accountId: string,
    @Query() query: RevenueReportQueryDto,
  ) {
    return this.reportsService.getRevenueReport(accountId, query);
  }

  @Get('jobs')
  @ApiOperation({
    summary: 'Get jobs report',
    description:
      'Get job statistics including counts by status, completion rates, and average job value and duration',
  })
  @ApiResponse({
    status: 200,
    description: 'Jobs report retrieved successfully',
    schema: {
      example: {
        period: {
          startDate: '2025-01-01',
          endDate: '2025-12-31',
        },
        summary: {
          totalJobs: 245,
          completedJobs: 198,
          completionRate: 80.82,
          averageJobValue: 512.45,
          averageDurationMinutes: 125.3,
        },
        byStatus: [
          { status: 'completed', count: 198 },
          { status: 'scheduled', count: 25 },
          { status: 'in_progress', count: 12 },
          { status: 'cancelled', count: 10 },
        ],
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getJobsReport(
    @CurrentUser('accountId') accountId: string,
    @Query() query: JobsReportQueryDto,
  ) {
    return this.reportsService.getJobsReport(accountId, query);
  }

  @Get('clients')
  @ApiOperation({
    summary: 'Get clients report',
    description: 'Get client metrics including total clients, new clients, and top clients by revenue',
  })
  @ApiResponse({
    status: 200,
    description: 'Clients report retrieved successfully',
    schema: {
      example: {
        period: {
          startDate: '2025-01-01',
          endDate: '2025-12-31',
        },
        summary: {
          totalClients: 150,
          newClients: 25,
        },
        topClients: [
          {
            clientId: '550e8400-e29b-41d4-a716-446655440000',
            name: 'ABC Corporation',
            totalRevenue: 15000.0,
            invoiceCount: 24,
          },
          {
            clientId: '660e8400-e29b-41d4-a716-446655440000',
            name: 'John Doe',
            totalRevenue: 12500.0,
            invoiceCount: 18,
          },
        ],
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getClientsReport(
    @CurrentUser('accountId') accountId: string,
    @Query() query: DashboardQueryDto,
  ) {
    return this.reportsService.getClientsReport(accountId, query);
  }

  @Get('time-tracking')
  @ApiOperation({
    summary: 'Get time tracking report',
    description:
      'Get time tracking summary including total hours, billable/non-billable breakdown, and time by user',
  })
  @ApiResponse({
    status: 200,
    description: 'Time tracking report retrieved successfully',
    schema: {
      example: {
        period: {
          startDate: '2025-01-01',
          endDate: '2025-01-31',
        },
        summary: {
          totalHours: 856.5,
          totalMinutes: 51390,
          entryCount: 245,
          billableHours: 720.25,
          nonBillableHours: 136.25,
        },
        byUser: [
          {
            userId: '770e8400-e29b-41d4-a716-446655440000',
            name: 'John Smith',
            totalHours: 165.5,
            entryCount: 48,
          },
          {
            userId: '880e8400-e29b-41d4-a716-446655440000',
            name: 'Jane Doe',
            totalHours: 142.25,
            entryCount: 42,
          },
        ],
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getTimeTrackingReport(
    @CurrentUser('accountId') accountId: string,
    @Query() query: DashboardQueryDto,
  ) {
    return this.reportsService.getTimeTrackingReport(accountId, query);
  }

  @Get('export')
  @Header('Content-Type', 'text/csv')
  @ApiOperation({
    summary: 'Export report as CSV',
    description:
      'Export any report type as a CSV file for download. Specify the report type and optional date range.',
  })
  @ApiResponse({
    status: 200,
    description: 'CSV file generated successfully',
    content: {
      'text/csv': {
        schema: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request - invalid report type' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async exportReport(
    @CurrentUser('accountId') accountId: string,
    @Query() query: ExportQueryDto,
  ) {
    const result = await this.reportsService.exportToCsv(accountId, query);

    return new StreamableFile(Buffer.from(result.content), {
      type: result.contentType,
      disposition: `attachment; filename="${result.filename}"`,
    });
  }
}
