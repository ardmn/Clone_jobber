import { useParams, useNavigate } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Typography,
  Card,
  Grid,
  Chip,
  Divider,
  IconButton,
} from '@mui/material';
import {
  Edit as EditIcon,
  ArrowBack as BackIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
} from '@mui/icons-material';
import { usersApi } from '../../services/api';
import { QUERY_KEYS } from '../../config/constants';
import { Button, LoadingSpinner } from '../../components/common';
import { formatPhone, formatDate } from '../../utils/format';

export const UserDetailPage = () => {
  const { id } = useParams({ from: '/users/$id' });
  const navigate = useNavigate();

  const { data: user, isLoading } = useQuery({
    queryKey: [QUERY_KEYS.USERS, id],
    queryFn: () => usersApi.getById(id),
  });

  if (isLoading) {
    return <LoadingSpinner message="Loading user..." />;
  }

  if (!user) {
    return <Typography>User not found</Typography>;
  }

  const getRoleColor = () => {
    switch (user.role) {
      case 'owner':
      case 'admin':
        return 'error';
      case 'manager':
        return 'warning';
      case 'dispatcher':
        return 'info';
      case 'technician':
        return 'success';
      default:
        return 'default';
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => navigate({ to: '/users' })} sx={{ mr: 2 }}>
          <BackIcon />
        </IconButton>
        <Typography variant="h4" sx={{ fontWeight: 600, flexGrow: 1 }}>
          {user.firstName} {user.lastName}
        </Typography>
        <Button
          variant="contained"
          startIcon={<EditIcon />}
          onClick={() => navigate({ to: `/users/${id}/edit` })}
        >
          Edit
        </Button>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              User Information
            </Typography>
            <Divider sx={{ my: 2 }} />

            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Role
              </Typography>
              <Chip
                label={user.role}
                size="small"
                color={getRoleColor()}
                sx={{ mt: 0.5 }}
              />
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Status
              </Typography>
              <Chip
                label={user.status}
                size="small"
                color={user.status === 'active' ? 'success' : 'default'}
                sx={{ mt: 0.5 }}
              />
            </Box>

            <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <EmailIcon color="action" />
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Email
                </Typography>
                <Typography variant="body1">{user.email}</Typography>
              </Box>
            </Box>

            {user.phone && (
              <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <PhoneIcon color="action" />
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Phone
                  </Typography>
                  <Typography variant="body1">{formatPhone(user.phone)}</Typography>
                </Box>
              </Box>
            )}

            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Joined
              </Typography>
              <Typography variant="body2">{formatDate(user.createdAt)}</Typography>
            </Box>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Role Permissions
            </Typography>
            <Divider sx={{ my: 2 }} />

            <Typography variant="body2" color="text.secondary">
              {user.role === 'owner' && 'Full access to all features including account settings and billing.'}
              {user.role === 'admin' && 'Full access to all features except account settings and billing.'}
              {user.role === 'manager' && 'Can manage jobs, clients, quotes, invoices, and view reports.'}
              {user.role === 'dispatcher' && 'Can create and schedule jobs, manage assignments.'}
              {user.role === 'technician' && 'Can view assigned jobs, clock in/out, and complete jobs.'}
              {user.role === 'readonly' && 'Read-only access to view data without making changes.'}
            </Typography>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};
