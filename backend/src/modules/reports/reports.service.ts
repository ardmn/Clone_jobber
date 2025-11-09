import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Invoice } from '../../database/entities/invoice.entity';
import { Job } from '../../database/entities/job.entity';
import { Client } from '../../database/entities/client.entity';
import { TimeEntry } from '../../database/entities/time-entry.entity';
import { Payment } from '../../database/entities/payment.entity';
import { DashboardQueryDto } from './dto/dashboard-query.dto';
import { RevenueReportQueryDto } from './dto/revenue-report-query.dto';
import { JobsReportQueryDto } from './dto/jobs-report-query.dto';
import { ExportQueryDto } from './dto/export-query.dto';

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(
    @InjectRepository(Invoice)
    private readonly invoiceRepository: Repository<Invoice>,
    @InjectRepository(Job)
    private readonly jobRepository: Repository<Job>,
    @InjectRepository(Client)
    private readonly clientRepository: Repository<Client>,
    @InjectRepository(TimeEntry)
    private readonly timeEntryRepository: Repository<TimeEntry>,
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
  ) {}

  /**
   * Get dashboard metrics
   */
  async getDashboard(accountId: string, query: DashboardQueryDto) {
    const { startDate, endDate } = this.getDateRange(query.startDate, query.endDate);

    // Total revenue (paid invoices)
    const revenueResult = await this.invoiceRepository
      .createQueryBuilder('invoice')
      .select('SUM(invoice.amountPaid)', 'totalRevenue')
      .where('invoice.accountId = :accountId', { accountId })
      .andWhere('invoice.deletedAt IS NULL')
      .andWhere('invoice.invoiceDate BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .getRawOne();

    // Outstanding invoices (unpaid)
    const outstandingResult = await this.invoiceRepository
      .createQueryBuilder('invoice')
      .select('SUM(invoice.balanceDue)', 'totalOutstanding')
      .addSelect('COUNT(invoice.id)', 'outstandingCount')
      .where('invoice.accountId = :accountId', { accountId })
      .andWhere('invoice.deletedAt IS NULL')
      .andWhere('invoice.status IN (:...statuses)', {
        statuses: ['sent', 'overdue', 'partial'],
      })
      .andWhere('invoice.balanceDue > 0')
      .getRawOne();

    // Jobs completed
    const jobsResult = await this.jobRepository
      .createQueryBuilder('job')
      .select('COUNT(job.id)', 'completedJobs')
      .where('job.accountId = :accountId', { accountId })
      .andWhere('job.deletedAt IS NULL')
      .andWhere('job.status = :status', { status: 'completed' })
      .andWhere('job.actualEnd BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .getRawOne();

    // Active clients (clients with jobs or invoices in period)
    const activeClientsResult = await this.clientRepository
      .createQueryBuilder('client')
      .leftJoin('client.jobs', 'job')
      .leftJoin('client.invoices', 'invoice')
      .select('COUNT(DISTINCT client.id)', 'activeClients')
      .where('client.accountId = :accountId', { accountId })
      .andWhere('client.deletedAt IS NULL')
      .andWhere(
        '(job.createdAt BETWEEN :startDate AND :endDate OR invoice.invoiceDate BETWEEN :startDate AND :endDate)',
        { startDate, endDate },
      )
      .getRawOne();

    // Total clients
    const totalClientsResult = await this.clientRepository
      .createQueryBuilder('client')
      .select('COUNT(client.id)', 'totalClients')
      .where('client.accountId = :accountId', { accountId })
      .andWhere('client.deletedAt IS NULL')
      .andWhere('client.status = :status', { status: 'active' })
      .getRawOne();

    // Upcoming jobs
    const upcomingJobsResult = await this.jobRepository
      .createQueryBuilder('job')
      .select('COUNT(job.id)', 'upcomingJobs')
      .where('job.accountId = :accountId', { accountId })
      .andWhere('job.deletedAt IS NULL')
      .andWhere('job.status IN (:...statuses)', {
        statuses: ['scheduled', 'en_route'],
      })
      .andWhere('job.scheduledStart >= :now', { now: new Date() })
      .getRawOne();

    return {
      period: {
        startDate,
        endDate,
      },
      revenue: {
        total: parseFloat(revenueResult?.totalRevenue || '0'),
        currency: 'USD',
      },
      outstandingInvoices: {
        total: parseFloat(outstandingResult?.totalOutstanding || '0'),
        count: parseInt(outstandingResult?.outstandingCount || '0', 10),
        currency: 'USD',
      },
      jobs: {
        completed: parseInt(jobsResult?.completedJobs || '0', 10),
        upcoming: parseInt(upcomingJobsResult?.upcomingJobs || '0', 10),
      },
      clients: {
        active: parseInt(activeClientsResult?.activeClients || '0', 10),
        total: parseInt(totalClientsResult?.totalClients || '0', 10),
      },
    };
  }

  /**
   * Get revenue report grouped by period
   */
  async getRevenueReport(accountId: string, query: RevenueReportQueryDto) {
    const { startDate, endDate } = this.getDateRange(query.startDate, query.endDate);
    const groupBy = query.groupBy || 'month';

    const dateFormat = this.getDateFormat(groupBy);

    const revenueData = await this.invoiceRepository
      .createQueryBuilder('invoice')
      .select(`TO_CHAR(invoice.invoiceDate, '${dateFormat}')`, 'period')
      .addSelect('SUM(invoice.total)', 'totalBilled')
      .addSelect('SUM(invoice.amountPaid)', 'totalPaid')
      .addSelect('SUM(invoice.balanceDue)', 'totalOutstanding')
      .addSelect('COUNT(invoice.id)', 'invoiceCount')
      .where('invoice.accountId = :accountId', { accountId })
      .andWhere('invoice.deletedAt IS NULL')
      .andWhere('invoice.invoiceDate BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .groupBy('period')
      .orderBy('period', 'ASC')
      .getRawMany();

    const formattedData = revenueData.map((row) => ({
      period: row.period,
      totalBilled: parseFloat(row.totalBilled || '0'),
      totalPaid: parseFloat(row.totalPaid || '0'),
      totalOutstanding: parseFloat(row.totalOutstanding || '0'),
      invoiceCount: parseInt(row.invoiceCount || '0', 10),
    }));

    const summary = {
      totalBilled: formattedData.reduce((sum, row) => sum + row.totalBilled, 0),
      totalPaid: formattedData.reduce((sum, row) => sum + row.totalPaid, 0),
      totalOutstanding: formattedData.reduce(
        (sum, row) => sum + row.totalOutstanding,
        0,
      ),
      totalInvoices: formattedData.reduce((sum, row) => sum + row.invoiceCount, 0),
    };

    return {
      period: {
        startDate,
        endDate,
        groupBy,
      },
      summary,
      data: formattedData,
    };
  }

  /**
   * Get jobs report
   */
  async getJobsReport(accountId: string, query: JobsReportQueryDto) {
    const { startDate, endDate } = this.getDateRange(query.startDate, query.endDate);

    const queryBuilder = this.jobRepository
      .createQueryBuilder('job')
      .where('job.accountId = :accountId', { accountId })
      .andWhere('job.deletedAt IS NULL')
      .andWhere('job.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });

    if (query.status) {
      queryBuilder.andWhere('job.status = :status', { status: query.status });
    }

    // Job counts by status
    const statusCounts = await this.jobRepository
      .createQueryBuilder('job')
      .select('job.status', 'status')
      .addSelect('COUNT(job.id)', 'count')
      .where('job.accountId = :accountId', { accountId })
      .andWhere('job.deletedAt IS NULL')
      .andWhere('job.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .groupBy('job.status')
      .getRawMany();

    // Completion rate
    const completedJobs = await queryBuilder
      .clone()
      .andWhere('job.status = :status', { status: 'completed' })
      .getCount();

    const totalJobs = await queryBuilder.clone().getCount();

    const completionRate = totalJobs > 0 ? (completedJobs / totalJobs) * 100 : 0;

    // Average job value
    const avgValueResult = await queryBuilder
      .clone()
      .select('AVG(job.estimatedValue)', 'avgValue')
      .getRawOne();

    // Average job duration (in minutes)
    const avgDurationResult = await this.jobRepository
      .createQueryBuilder('job')
      .select(
        'AVG(EXTRACT(EPOCH FROM (job.actualEnd - job.actualStart)) / 60)',
        'avgDuration',
      )
      .where('job.accountId = :accountId', { accountId })
      .andWhere('job.deletedAt IS NULL')
      .andWhere('job.status = :status', { status: 'completed' })
      .andWhere('job.actualStart IS NOT NULL')
      .andWhere('job.actualEnd IS NOT NULL')
      .andWhere('job.actualEnd BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .getRawOne();

    return {
      period: {
        startDate,
        endDate,
      },
      summary: {
        totalJobs,
        completedJobs,
        completionRate: parseFloat(completionRate.toFixed(2)),
        averageJobValue: parseFloat(avgValueResult?.avgValue || '0'),
        averageDurationMinutes: parseFloat(avgDurationResult?.avgDuration || '0'),
      },
      byStatus: statusCounts.map((row) => ({
        status: row.status,
        count: parseInt(row.count || '0', 10),
      })),
    };
  }

  /**
   * Get clients report
   */
  async getClientsReport(accountId: string, query: DashboardQueryDto) {
    const { startDate, endDate } = this.getDateRange(query.startDate, query.endDate);

    // Top clients by revenue
    const topClients = await this.invoiceRepository
      .createQueryBuilder('invoice')
      .leftJoinAndSelect('invoice.client', 'client')
      .select('client.id', 'clientId')
      .addSelect('client.firstName', 'firstName')
      .addSelect('client.lastName', 'lastName')
      .addSelect('client.companyName', 'companyName')
      .addSelect('SUM(invoice.amountPaid)', 'totalRevenue')
      .addSelect('COUNT(invoice.id)', 'invoiceCount')
      .where('invoice.accountId = :accountId', { accountId })
      .andWhere('invoice.deletedAt IS NULL')
      .andWhere('invoice.invoiceDate BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .groupBy('client.id')
      .addGroupBy('client.firstName')
      .addGroupBy('client.lastName')
      .addGroupBy('client.companyName')
      .orderBy('totalRevenue', 'DESC')
      .limit(10)
      .getRawMany();

    // Client statistics
    const clientStats = await this.clientRepository
      .createQueryBuilder('client')
      .select('COUNT(client.id)', 'totalClients')
      .addSelect(
        'COUNT(CASE WHEN client.createdAt BETWEEN :startDate AND :endDate THEN 1 END)',
        'newClients',
      )
      .where('client.accountId = :accountId', { accountId })
      .andWhere('client.deletedAt IS NULL')
      .setParameters({ startDate, endDate })
      .getRawOne();

    return {
      period: {
        startDate,
        endDate,
      },
      summary: {
        totalClients: parseInt(clientStats?.totalClients || '0', 10),
        newClients: parseInt(clientStats?.newClients || '0', 10),
      },
      topClients: topClients.map((row) => ({
        clientId: row.clientId,
        name:
          row.companyName ||
          `${row.firstName || ''} ${row.lastName || ''}`.trim() ||
          'Unknown',
        totalRevenue: parseFloat(row.totalRevenue || '0'),
        invoiceCount: parseInt(row.invoiceCount || '0', 10),
      })),
    };
  }

  /**
   * Get time tracking report
   */
  async getTimeTrackingReport(accountId: string, query: DashboardQueryDto) {
    const { startDate, endDate } = this.getDateRange(query.startDate, query.endDate);

    // Total time tracked
    const totalTimeResult = await this.timeEntryRepository
      .createQueryBuilder('timeEntry')
      .select('SUM(timeEntry.durationMinutes)', 'totalMinutes')
      .addSelect('COUNT(timeEntry.id)', 'entryCount')
      .where('timeEntry.accountId = :accountId', { accountId })
      .andWhere('timeEntry.startTime BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .getRawOne();

    // Billable vs non-billable
    const billableBreakdown = await this.timeEntryRepository
      .createQueryBuilder('timeEntry')
      .select('timeEntry.isBillable', 'isBillable')
      .addSelect('SUM(timeEntry.durationMinutes)', 'totalMinutes')
      .addSelect('COUNT(timeEntry.id)', 'entryCount')
      .where('timeEntry.accountId = :accountId', { accountId })
      .andWhere('timeEntry.startTime BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .groupBy('timeEntry.isBillable')
      .getRawMany();

    // Time by user
    const timeByUser = await this.timeEntryRepository
      .createQueryBuilder('timeEntry')
      .leftJoinAndSelect('timeEntry.user', 'user')
      .select('user.id', 'userId')
      .addSelect('user.firstName', 'firstName')
      .addSelect('user.lastName', 'lastName')
      .addSelect('SUM(timeEntry.durationMinutes)', 'totalMinutes')
      .addSelect('COUNT(timeEntry.id)', 'entryCount')
      .where('timeEntry.accountId = :accountId', { accountId })
      .andWhere('timeEntry.startTime BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .groupBy('user.id')
      .addGroupBy('user.firstName')
      .addGroupBy('user.lastName')
      .orderBy('totalMinutes', 'DESC')
      .getRawMany();

    const totalMinutes = parseInt(totalTimeResult?.totalMinutes || '0', 10);
    const billableMinutes =
      parseInt(
        billableBreakdown.find((b) => b.isBillable)?.totalMinutes || '0',
        10,
      ) || 0;
    const nonBillableMinutes =
      parseInt(
        billableBreakdown.find((b) => !b.isBillable)?.totalMinutes || '0',
        10,
      ) || 0;

    return {
      period: {
        startDate,
        endDate,
      },
      summary: {
        totalHours: parseFloat((totalMinutes / 60).toFixed(2)),
        totalMinutes,
        entryCount: parseInt(totalTimeResult?.entryCount || '0', 10),
        billableHours: parseFloat((billableMinutes / 60).toFixed(2)),
        nonBillableHours: parseFloat((nonBillableMinutes / 60).toFixed(2)),
      },
      byUser: timeByUser.map((row) => ({
        userId: row.userId,
        name: `${row.firstName || ''} ${row.lastName || ''}`.trim() || 'Unknown',
        totalHours: parseFloat((parseInt(row.totalMinutes || '0', 10) / 60).toFixed(2)),
        entryCount: parseInt(row.entryCount || '0', 10),
      })),
    };
  }

  /**
   * Export report as CSV
   */
  async exportToCsv(accountId: string, query: ExportQueryDto) {
    let data: any;
    let csvContent = '';

    switch (query.reportType) {
      case 'dashboard':
        data = await this.getDashboard(accountId, query);
        csvContent = this.formatDashboardCsv(data);
        break;

      case 'revenue':
        data = await this.getRevenueReport(accountId, {
          ...query,
          groupBy: 'month',
        });
        csvContent = this.formatRevenueCsv(data);
        break;

      case 'jobs':
        data = await this.getJobsReport(accountId, query);
        csvContent = this.formatJobsCsv(data);
        break;

      case 'clients':
        data = await this.getClientsReport(accountId, query);
        csvContent = this.formatClientsCsv(data);
        break;

      case 'time-tracking':
        data = await this.getTimeTrackingReport(accountId, query);
        csvContent = this.formatTimeTrackingCsv(data);
        break;

      default:
        throw new Error('Invalid report type');
    }

    return {
      filename: `${query.reportType}-report-${new Date().toISOString().split('T')[0]}.csv`,
      content: csvContent,
      contentType: 'text/csv',
    };
  }

  /**
   * Helper: Get date range with defaults
   */
  private getDateRange(startDate?: string, endDate?: string) {
    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate
      ? new Date(startDate)
      : new Date(new Date().setDate(end.getDate() - 30));

    return {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
    };
  }

  /**
   * Helper: Get PostgreSQL date format for grouping
   */
  private getDateFormat(groupBy: string): string {
    switch (groupBy) {
      case 'day':
        return 'YYYY-MM-DD';
      case 'week':
        return 'IYYY-IW';
      case 'month':
        return 'YYYY-MM';
      case 'year':
        return 'YYYY';
      default:
        return 'YYYY-MM';
    }
  }

  /**
   * CSV Formatters
   */
  private formatDashboardCsv(data: any): string {
    return [
      'Metric,Value',
      `Total Revenue,${data.revenue.total}`,
      `Outstanding Invoices,${data.outstandingInvoices.total}`,
      `Outstanding Invoice Count,${data.outstandingInvoices.count}`,
      `Completed Jobs,${data.jobs.completed}`,
      `Upcoming Jobs,${data.jobs.upcoming}`,
      `Active Clients,${data.clients.active}`,
      `Total Clients,${data.clients.total}`,
    ].join('\n');
  }

  private formatRevenueCsv(data: any): string {
    const header = 'Period,Total Billed,Total Paid,Total Outstanding,Invoice Count';
    const rows = data.data.map(
      (row: any) =>
        `${row.period},${row.totalBilled},${row.totalPaid},${row.totalOutstanding},${row.invoiceCount}`,
    );
    return [header, ...rows].join('\n');
  }

  private formatJobsCsv(data: any): string {
    const header = 'Status,Count';
    const rows = data.byStatus.map((row: any) => `${row.status},${row.count}`);
    return [header, ...rows].join('\n');
  }

  private formatClientsCsv(data: any): string {
    const header = 'Client Name,Total Revenue,Invoice Count';
    const rows = data.topClients.map(
      (row: any) => `"${row.name}",${row.totalRevenue},${row.invoiceCount}`,
    );
    return [header, ...rows].join('\n');
  }

  private formatTimeTrackingCsv(data: any): string {
    const header = 'User Name,Total Hours,Entry Count';
    const rows = data.byUser.map(
      (row: any) => `"${row.name}",${row.totalHours},${row.entryCount}`,
    );
    return [header, ...rows].join('\n');
  }
}
