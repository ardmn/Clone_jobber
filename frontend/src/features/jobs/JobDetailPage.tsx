import { useParams, useNavigate } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Typography,
  Card,
  Grid,
  Chip,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import {
  Edit as EditIcon,
  ArrowBack as BackIcon,
  PlayArrow as StartIcon,
  CheckCircle as CompleteIcon,
} from '@mui/icons-material';
import { jobsApi } from '../../services/api';
import { QUERY_KEYS } from '../../config/constants';
import { Button, LoadingSpinner } from '../../components/common';
import { formatDateTime, formatDate } from '../../utils/format';
import toast from 'react-hot-toast';

export const JobDetailPage = () => {
  const { id } = useParams({ from: '/jobs/$id' });
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: job, isLoading } = useQuery({
    queryKey: [QUERY_KEYS.JOBS, id],
    queryFn: () => jobsApi.getById(id),
  });

  const startMutation = useMutation({
    mutationFn: jobsApi.start,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.JOBS] });
      toast.success('Job started');
    },
    onError: () => toast.error('Failed to start job'),
  });

  const completeMutation = useMutation({
    mutationFn: jobsApi.complete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.JOBS] });
      toast.success('Job completed');
    },
    onError: () => toast.error('Failed to complete job'),
  });

  if (isLoading) {
    return <LoadingSpinner message="Loading job..." />;
  }

  if (!job) {
    return <Typography>Job not found</Typography>;
  }

  const getStatusColor = () => {
    switch (job.status) {
      case 'completed': return 'success';
      case 'in_progress': return 'info';
      case 'scheduled': return 'warning';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => navigate({ to: '/jobs' })} sx={{ mr: 2 }}>
          <BackIcon />
        </IconButton>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h4" sx={{ fontWeight: 600 }}>
            {job.jobNumber}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {job.title}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          {job.status === 'scheduled' && (
            <Button
              variant="outlined"
              startIcon={<StartIcon />}
              onClick={() => startMutation.mutate(id)}
            >
              Start Job
            </Button>
          )}
          {job.status === 'in_progress' && (
            <Button
              variant="outlined"
              color="success"
              startIcon={<CompleteIcon />}
              onClick={() => completeMutation.mutate(id)}
            >
              Complete Job
            </Button>
          )}
          <Button
            variant="contained"
            startIcon={<EditIcon />}
            onClick={() => navigate({ to: `/jobs/${id}/edit` })}
          >
            Edit
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Main Info */}
        <Grid item xs={12} md={6}>
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Job Information
            </Typography>
            <Divider sx={{ my: 2 }} />

            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Status
              </Typography>
              <Chip
                label={job.status.replace('_', ' ')}
                color={getStatusColor()}
                sx={{ mt: 0.5 }}
              />
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Client
              </Typography>
              <Typography variant="body1">
                {job.client ? `${job.client.firstName} ${job.client.lastName}` : '-'}
              </Typography>
              {job.client?.companyName && (
                <Typography variant="body2" color="text.secondary">
                  {job.client.companyName}
                </Typography>
              )}
            </Box>

            {job.scheduledStart && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Scheduled Start
                </Typography>
                <Typography variant="body1">{formatDateTime(job.scheduledStart)}</Typography>
              </Box>
            )}

            {job.scheduledEnd && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Scheduled End
                </Typography>
                <Typography variant="body1">{formatDateTime(job.scheduledEnd)}</Typography>
              </Box>
            )}

            {job.actualStart && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Actual Start
                </Typography>
                <Typography variant="body1">{formatDateTime(job.actualStart)}</Typography>
              </Box>
            )}

            {job.actualEnd && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Actual End
                </Typography>
                <Typography variant="body1">{formatDateTime(job.actualEnd)}</Typography>
              </Box>
            )}
          </Card>
        </Grid>

        {/* Assignment & Address */}
        <Grid item xs={12} md={6}>
          <Card sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Assigned Team
            </Typography>
            <Divider sx={{ my: 2 }} />
            {job.assignedUsers && job.assignedUsers.length > 0 ? (
              <List>
                {job.assignedUsers.map((user) => (
                  <ListItem key={user.id} sx={{ px: 0 }}>
                    <ListItemText
                      primary={`${user.firstName} ${user.lastName}`}
                      secondary={user.role}
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No team members assigned
              </Typography>
            )}
          </Card>

          {job.address && (
            <Card sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Service Address
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Typography variant="body1">
                {job.address.street1}
                {job.address.street2 && <><br />{job.address.street2}</>}
                <br />
                {job.address.city}, {job.address.state} {job.address.postalCode}
                <br />
                {job.address.country}
              </Typography>
            </Card>
          )}
        </Grid>

        {/* Description */}
        {job.description && (
          <Grid item xs={12}>
            <Card sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Description
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                {job.description}
              </Typography>
            </Card>
          </Grid>
        )}

        {/* Notes */}
        {job.notes && (
          <Grid item xs={12} md={6}>
            <Card sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Notes
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                {job.notes}
              </Typography>
            </Card>
          </Grid>
        )}

        {/* Completion Notes */}
        {job.completionNotes && (
          <Grid item xs={12} md={6}>
            <Card sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Completion Notes
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                {job.completionNotes}
              </Typography>
            </Card>
          </Grid>
        )}

        {/* Photos */}
        {job.photos && job.photos.length > 0 && (
          <Grid item xs={12}>
            <Card sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Photos
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Grid container spacing={2}>
                {job.photos.map((photo) => (
                  <Grid item xs={12} sm={6} md={4} key={photo.id}>
                    <Card>
                      <Box
                        component="img"
                        src={photo.url}
                        alt={photo.caption || 'Job photo'}
                        sx={{
                          width: '100%',
                          height: 200,
                          objectFit: 'cover',
                        }}
                      />
                      {photo.caption && (
                        <Box sx={{ p: 1 }}>
                          <Typography variant="caption">{photo.caption}</Typography>
                        </Box>
                      )}
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Card>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};
