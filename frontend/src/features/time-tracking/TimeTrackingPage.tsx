import { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Chip,
  Grid,
} from '@mui/material';
import {
  PlayArrow as ClockInIcon,
  Stop as ClockOutIcon,
  Check as ApproveIcon,
  Close as RejectIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { timeTrackingApi } from '../../services/api';
import { QUERY_KEYS, PAGINATION } from '../../config/constants';
import { Button, LoadingSpinner, EmptyState } from '../../components/common';
import { formatDateTime } from '../../utils/format';
import toast from 'react-hot-toast';
import type { TimeEntry } from '../../types';

const getStatusColor = (status: TimeEntry['status']) => {
  switch (status) {
    case 'approved':
      return 'success';
    case 'rejected':
      return 'error';
    default:
      return 'warning';
  }
};

const formatDuration = (minutes?: number) => {
  if (!minutes) return '-';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
};

export const TimeTrackingPage = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(PAGINATION.DEFAULT_LIMIT);

  const { data, isLoading } = useQuery({
    queryKey: [QUERY_KEYS.TIME_ENTRIES, page + 1, rowsPerPage],
    queryFn: () =>
      timeTrackingApi.getAll({
        page: page + 1,
        limit: rowsPerPage,
      }),
  });

  const clockInMutation = useMutation({
    mutationFn: timeTrackingApi.clockIn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.TIME_ENTRIES] });
      toast.success('Clocked in successfully');
    },
    onError: () => {
      toast.error('Failed to clock in');
    },
  });

  const clockOutMutation = useMutation({
    mutationFn: (id: string) => timeTrackingApi.clockOut(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.TIME_ENTRIES] });
      toast.success('Clocked out successfully');
    },
    onError: () => {
      toast.error('Failed to clock out');
    },
  });

  const approveMutation = useMutation({
    mutationFn: timeTrackingApi.approve,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.TIME_ENTRIES] });
      toast.success('Time entry approved');
    },
    onError: () => {
      toast.error('Failed to approve time entry');
    },
  });

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleClockIn = () => {
    clockInMutation.mutate({});
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading time entries..." />;
  }

  const timeEntries = data?.data || [];
  const totalEntries = data?.meta?.total || 0;
  const activeEntry = timeEntries.find((entry) => !entry.clockOut);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          Time Tracking
        </Typography>
      </Box>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              {activeEntry ? 'Clock Out' : 'Clock In'}
            </Typography>
            {activeEntry ? (
              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Clocked in at {formatDateTime(activeEntry.clockIn)}
                </Typography>
                <Button
                  variant="contained"
                  color="error"
                  startIcon={<ClockOutIcon />}
                  onClick={() => clockOutMutation.mutate(activeEntry.id)}
                  fullWidth
                >
                  Clock Out
                </Button>
              </Box>
            ) : (
              <Button
                variant="contained"
                color="success"
                startIcon={<ClockInIcon />}
                onClick={handleClockIn}
                fullWidth
              >
                Clock In
              </Button>
            )}
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Today's Summary
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 600, color: 'primary.main' }}>
              {formatDuration(
                timeEntries
                  .filter((entry) => {
                    const entryDate = new Date(entry.clockIn).toDateString();
                    const today = new Date().toDateString();
                    return entryDate === today;
                  })
                  .reduce((sum, entry) => sum + (entry.totalMinutes || 0), 0)
              )}
            </Typography>
          </Card>
        </Grid>
      </Grid>

      <Card>
        {timeEntries.length === 0 ? (
          <EmptyState
            title="No time entries"
            description="Clock in to start tracking your time"
          />
        ) : (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Employee</TableCell>
                    <TableCell>Job</TableCell>
                    <TableCell>Clock In</TableCell>
                    <TableCell>Clock Out</TableCell>
                    <TableCell>Duration</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {timeEntries.map((entry) => (
                    <TableRow key={entry.id} hover>
                      <TableCell>{new Date(entry.clockIn).toLocaleDateString()}</TableCell>
                      <TableCell>
                        {entry.user ? `${entry.user.firstName} ${entry.user.lastName}` : '-'}
                      </TableCell>
                      <TableCell>
                        {entry.job ? `${entry.job.jobNumber} - ${entry.job.title}` : '-'}
                      </TableCell>
                      <TableCell>{formatDateTime(entry.clockIn)}</TableCell>
                      <TableCell>
                        {entry.clockOut ? formatDateTime(entry.clockOut) : 'Active'}
                      </TableCell>
                      <TableCell>{formatDuration(entry.totalMinutes)}</TableCell>
                      <TableCell>
                        <Chip
                          label={entry.status}
                          size="small"
                          color={getStatusColor(entry.status)}
                        />
                      </TableCell>
                      <TableCell align="right">
                        {entry.clockOut && entry.status === 'pending' && (
                          <>
                            <IconButton
                              size="small"
                              onClick={() => approveMutation.mutate(entry.id)}
                              title="Approve"
                            >
                              <ApproveIcon />
                            </IconButton>
                            <IconButton size="small" title="Reject">
                              <RejectIcon />
                            </IconButton>
                          </>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <TablePagination
              component="div"
              count={totalEntries}
              page={page}
              onPageChange={handleChangePage}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              rowsPerPageOptions={PAGINATION.PAGE_SIZE_OPTIONS}
            />
          </>
        )}
      </Card>
    </Box>
  );
};
