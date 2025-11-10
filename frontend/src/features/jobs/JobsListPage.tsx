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
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  Add as AddIcon,
  PlayArrow as StartIcon,
  CheckCircle as CompleteIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { jobsApi } from '../../services/api';
import { QUERY_KEYS, PAGINATION } from '../../config/constants';
import { Button, LoadingSpinner, EmptyState, SearchBar, ConfirmDialog } from '../../components/common';
import { formatDate, formatDateTime } from '../../utils/format';
import toast from 'react-hot-toast';
import type { Job } from '../../types';

const getStatusColor = (status: Job['status']) => {
  switch (status) {
    case 'completed':
      return 'success';
    case 'in_progress':
      return 'info';
    case 'scheduled':
      return 'warning';
    case 'cancelled':
      return 'error';
    default:
      return 'default';
  }
};

export const JobsListPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(PAGINATION.DEFAULT_LIMIT);
  const [search, setSearch] = useState('');
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id: string | null }>({
    open: false,
    id: null,
  });

  const { data, isLoading } = useQuery({
    queryKey: [QUERY_KEYS.JOBS, page + 1, rowsPerPage, search],
    queryFn: () =>
      jobsApi.getAll({
        page: page + 1,
        limit: rowsPerPage,
        search,
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: jobsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.JOBS] });
      toast.success('Job deleted successfully');
      setDeleteDialog({ open: false, id: null });
    },
    onError: () => {
      toast.error('Failed to delete job');
    },
  });

  const startMutation = useMutation({
    mutationFn: jobsApi.start,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.JOBS] });
      toast.success('Job started');
    },
    onError: () => {
      toast.error('Failed to start job');
    },
  });

  const completeMutation = useMutation({
    mutationFn: jobsApi.complete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.JOBS] });
      toast.success('Job completed');
    },
    onError: () => {
      toast.error('Failed to complete job');
    },
  });

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleDelete = () => {
    if (deleteDialog.id) {
      deleteMutation.mutate(deleteDialog.id);
    }
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading jobs..." />;
  }

  const jobs = data?.data || [];
  const totalJobs = data?.meta?.total || 0;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          Jobs
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate({ to: '/jobs/new' })}
        >
          Create Job
        </Button>
      </Box>

      <Card>
        <Box sx={{ p: 2 }}>
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search jobs..."
            fullWidth
          />
        </Box>

        {jobs.length === 0 ? (
          <EmptyState
            title="No jobs found"
            description="Create your first job to get started"
            action={{
              label: 'Create Job',
              onClick: () => navigate({ to: '/jobs/new' }),
            }}
          />
        ) : (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Job #</TableCell>
                    <TableCell>Title</TableCell>
                    <TableCell>Client</TableCell>
                    <TableCell>Scheduled</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Assigned To</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {jobs.map((job) => (
                    <TableRow key={job.id} hover>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {job.jobNumber}
                        </Typography>
                      </TableCell>
                      <TableCell>{job.title}</TableCell>
                      <TableCell>
                        {job.client
                          ? `${job.client.firstName} ${job.client.lastName}`
                          : '-'}
                      </TableCell>
                      <TableCell>
                        {job.scheduledStart ? formatDateTime(job.scheduledStart) : '-'}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={job.status.replace('_', ' ')}
                          size="small"
                          color={getStatusColor(job.status)}
                        />
                      </TableCell>
                      <TableCell>
                        {job.assignedUsers && job.assignedUsers.length > 0
                          ? job.assignedUsers.map(u => `${u.firstName} ${u.lastName}`).join(', ')
                          : '-'}
                      </TableCell>
                      <TableCell align="right">
                        {job.status === 'scheduled' && (
                          <IconButton
                            size="small"
                            onClick={() => startMutation.mutate(job.id)}
                            title="Start Job"
                          >
                            <StartIcon />
                          </IconButton>
                        )}
                        {job.status === 'in_progress' && (
                          <IconButton
                            size="small"
                            onClick={() => completeMutation.mutate(job.id)}
                            title="Complete Job"
                          >
                            <CompleteIcon />
                          </IconButton>
                        )}
                        <IconButton
                          size="small"
                          onClick={() => navigate({ to: `/jobs/${job.id}` })}
                        >
                          <VisibilityIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => navigate({ to: `/jobs/${job.id}/edit` })}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => setDeleteDialog({ open: true, id: job.id })}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <TablePagination
              component="div"
              count={totalJobs}
              page={page}
              onPageChange={handleChangePage}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              rowsPerPageOptions={PAGINATION.PAGE_SIZE_OPTIONS}
            />
          </>
        )}
      </Card>

      <ConfirmDialog
        open={deleteDialog.open}
        title="Delete Job"
        message="Are you sure you want to delete this job? This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteDialog({ open: false, id: null })}
        severity="error"
      />
    </Box>
  );
};
