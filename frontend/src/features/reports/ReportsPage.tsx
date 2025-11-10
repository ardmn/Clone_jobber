import { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Paper,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { LoadingSpinner } from '../../components/common';
import { QUERY_KEYS } from '../../config/constants';
import { formatCurrency } from '../../utils/format';
import axiosInstance from '../../services/api/axiosInstance';
import { API_ENDPOINTS } from '../../config/api';
import type { DashboardStats, RevenueData, JobReportData } from '../../types';

export const ReportsPage = () => {
  const [period, setPeriod] = useState<'week' | 'month' | 'quarter' | 'year'>('month');

  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: [QUERY_KEYS.REPORTS, 'stats'],
    queryFn: async () => {
      const response = await axiosInstance.get(API_ENDPOINTS.REPORTS_DASHBOARD);
      return response.data.data || response.data;
    },
  });

  const { data: revenueData, isLoading: revenueLoading } = useQuery<RevenueData[]>({
    queryKey: [QUERY_KEYS.REPORTS, 'revenue', period],
    queryFn: async () => {
      const response = await axiosInstance.get(API_ENDPOINTS.REPORTS_REVENUE, {
        params: { period },
      });
      return response.data.data || response.data;
    },
  });

  const { data: jobsData, isLoading: jobsLoading } = useQuery<JobReportData[]>({
    queryKey: [QUERY_KEYS.REPORTS, 'jobs', period],
    queryFn: async () => {
      const response = await axiosInstance.get(API_ENDPOINTS.REPORTS_JOBS, {
        params: { period },
      });
      return response.data.data || response.data;
    },
  });

  if (statsLoading || revenueLoading || jobsLoading) {
    return <LoadingSpinner message="Loading reports..." />;
  }

  const revenue = stats?.revenue || { today: 0, week: 0, month: 0, year: 0 };
  const jobs = stats?.jobs || { scheduled: 0, inProgress: 0, completed: 0, total: 0 };
  const invoices = stats?.invoices || { outstanding: 0, overdue: 0, paid: 0, total: 0 };
  const clients = stats?.clients || { active: 0, total: 0 };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          Reports & Analytics
        </Typography>
        <FormControl sx={{ minWidth: 150 }}>
          <InputLabel>Period</InputLabel>
          <Select value={period} label="Period" onChange={(e) => setPeriod(e.target.value as any)}>
            <MenuItem value="week">Last Week</MenuItem>
            <MenuItem value="month">Last Month</MenuItem>
            <MenuItem value="quarter">Last Quarter</MenuItem>
            <MenuItem value="year">Last Year</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Grid container spacing={3}>
        {/* Revenue Stats */}
        <Grid item xs={12} md={6} lg={3}>
          <Card sx={{ p: 3 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Revenue Today
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 600, color: 'primary.main' }}>
              {formatCurrency(revenue.today)}
            </Typography>
          </Card>
        </Grid>

        <Grid item xs={12} md={6} lg={3}>
          <Card sx={{ p: 3 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Revenue This Week
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 600, color: 'success.main' }}>
              {formatCurrency(revenue.week)}
            </Typography>
          </Card>
        </Grid>

        <Grid item xs={12} md={6} lg={3}>
          <Card sx={{ p: 3 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Revenue This Month
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 600, color: 'info.main' }}>
              {formatCurrency(revenue.month)}
            </Typography>
          </Card>
        </Grid>

        <Grid item xs={12} md={6} lg={3}>
          <Card sx={{ p: 3 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Revenue This Year
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 600, color: 'warning.main' }}>
              {formatCurrency(revenue.year)}
            </Typography>
          </Card>
        </Grid>

        {/* Jobs Stats */}
        <Grid item xs={12} md={6} lg={3}>
          <Card sx={{ p: 3 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Scheduled Jobs
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 600 }}>
              {jobs.scheduled}
            </Typography>
          </Card>
        </Grid>

        <Grid item xs={12} md={6} lg={3}>
          <Card sx={{ p: 3 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              In Progress
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 600 }}>
              {jobs.inProgress}
            </Typography>
          </Card>
        </Grid>

        <Grid item xs={12} md={6} lg={3}>
          <Card sx={{ p: 3 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Completed Jobs
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 600 }}>
              {jobs.completed}
            </Typography>
          </Card>
        </Grid>

        <Grid item xs={12} md={6} lg={3}>
          <Card sx={{ p: 3 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Total Jobs
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 600 }}>
              {jobs.total}
            </Typography>
          </Card>
        </Grid>

        {/* Invoices Stats */}
        <Grid item xs={12} md={6} lg={3}>
          <Card sx={{ p: 3 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Outstanding
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 600, color: 'warning.main' }}>
              {formatCurrency(invoices.outstanding)}
            </Typography>
          </Card>
        </Grid>

        <Grid item xs={12} md={6} lg={3}>
          <Card sx={{ p: 3 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Overdue
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 600, color: 'error.main' }}>
              {formatCurrency(invoices.overdue)}
            </Typography>
          </Card>
        </Grid>

        <Grid item xs={12} md={6} lg={3}>
          <Card sx={{ p: 3 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Paid
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 600, color: 'success.main' }}>
              {formatCurrency(invoices.paid)}
            </Typography>
          </Card>
        </Grid>

        <Grid item xs={12} md={6} lg={3}>
          <Card sx={{ p: 3 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Active Clients
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 600 }}>
              {clients.active} / {clients.total}
            </Typography>
          </Card>
        </Grid>

        {/* Revenue Chart Placeholder */}
        <Grid item xs={12} lg={8}>
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Revenue Trend
            </Typography>
            <Paper sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'grey.50' }}>
              <Typography variant="body1" color="text.secondary">
                Revenue chart for selected period ({revenueData?.length || 0} data points)
              </Typography>
            </Paper>
          </Card>
        </Grid>

        {/* Jobs Chart Placeholder */}
        <Grid item xs={12} lg={4}>
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Jobs by Status
            </Typography>
            <Paper sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'grey.50' }}>
              <Typography variant="body1" color="text.secondary">
                Jobs distribution chart ({jobsData?.length || 0} statuses)
              </Typography>
            </Paper>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};
