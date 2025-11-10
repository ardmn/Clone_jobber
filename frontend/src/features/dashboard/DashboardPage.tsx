import { Grid, Card, CardContent, Typography, Box } from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  Work as WorkIcon,
  Receipt as ReceiptIcon,
  People as PeopleIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { reportsApi } from '../../services/api';
import { LoadingSpinner } from '../../components/common';
import { formatCurrency } from '../../utils/format';
import { QUERY_KEYS } from '../../config/constants';

export const DashboardPage = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: [QUERY_KEYS.DASHBOARD_STATS],
    queryFn: reportsApi.getDashboard,
  });

  if (isLoading) {
    return <LoadingSpinner message="Loading dashboard..." />;
  }

  const cards = [
    {
      title: 'Monthly Revenue',
      value: formatCurrency(stats?.revenue.month || 0),
      icon: TrendingUpIcon,
      color: '#10B981',
      change: '+12%',
    },
    {
      title: 'Active Jobs',
      value: stats?.jobs.scheduled || 0,
      icon: WorkIcon,
      color: '#2563EB',
      subtitle: `${stats?.jobs.inProgress || 0} in progress`,
    },
    {
      title: 'Outstanding Invoices',
      value: formatCurrency(stats?.invoices.outstanding || 0),
      icon: ReceiptIcon,
      color: '#F59E0B',
      subtitle: `${stats?.invoices.overdue || 0} overdue`,
    },
    {
      title: 'Active Clients',
      value: stats?.clients.active || 0,
      icon: PeopleIcon,
      color: '#8B5CF6',
      subtitle: `${stats?.clients.total || 0} total`,
    },
  ];

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, mb: 3>
        Dashboard
      </Typography>

      <Grid container spacing={3}>
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Grid key={card.title} item xs= 12sm=6md=3>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2>
                    <Box
                      sx={{
                        p: 1,
                        borderRadius: 2,
                        bgcolor: `${card.color}20`,
                        mr: 2,
                     
                    >
                      <Icon sx={{ color: card.color />
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {card.title}
                    </Typography>
                  </Box>
                  <Typography variant="h4" sx={{ fontWeight: 600, mb: 0.5>
                    {card.value}
                  </Typography>
                  {card.subtitle && (
                    <Typography variant="body2" color="text.secondary">
                      {card.subtitle}
                    </Typography>
                  )}
                  {card.change && (
                    <Typography variant="body2" sx={{ color: '#10B981', fontWeight: 500>
                      {card.change} from last month
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      <Grid container spacing={3} sx={{ mt: 2>
        <Grid item xs= 12md=8>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Activity
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Activity feed coming soon...
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs= 12md=4>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Quick Actions
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Quick action buttons coming soon...
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};
