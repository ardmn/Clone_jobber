import { useState, useEffect } from 'react';
import { useParams, useNavigate } from '@tantml:router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import {
  Box,
  Typography,
  Card,
  Grid,
  TextField,
  IconButton,
  Autocomplete,
  Chip,
} from '@mui/material';
import { ArrowBack as BackIcon } from '@mui/icons-material';
import { jobsApi, clientsApi, usersApi } from '../../services/api';
import { QUERY_KEYS } from '../../config/constants';
import { Button, LoadingSpinner } from '../../components/common';
import toast from 'react-hot-toast';
import type { JobFormData, Client, User } from '../../types';

export const JobFormPage = () => {
  const { id } = useParams({ from: '/jobs/$id/edit', strict: false }) || {};
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEdit = Boolean(id);
  const [clients, setClients] = useState<Client[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  const { data: job, isLoading } = useQuery({
    queryKey: [QUERY_KEYS.JOBS, id],
    queryFn: () => jobsApi.getById(id!),
    enabled: isEdit,
  });

  useQuery({
    queryKey: [QUERY_KEYS.CLIENTS],
    queryFn: () => clientsApi.getAll({ limit: 100 }),
    onSuccess: (data) => setClients(data.data),
  });

  useQuery({
    queryKey: [QUERY_KEYS.USERS],
    queryFn: () => usersApi.getAll({ limit: 100 }),
    onSuccess: (data) => setUsers(data.data.filter(u => u.status === 'active')),
  });

  const { control, handleSubmit, reset } = useForm<JobFormData>({
    defaultValues: {
      clientId: '',
      title: '',
      description: '',
      scheduledStart: '',
      scheduledEnd: '',
      assignedTo: [],
      notes: '',
    },
  });

  useEffect(() => {
    if (job) {
      reset({
        clientId: job.clientId,
        title: job.title,
        description: job.description || '',
        scheduledStart: job.scheduledStart || '',
        scheduledEnd: job.scheduledEnd || '',
        assignedTo: job.assignedTo || [],
        notes: job.notes || '',
        address: job.address,
      });
    }
  }, [job, reset]);

  const createMutation = useMutation({
    mutationFn: jobsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.JOBS] });
      toast.success('Job created successfully');
      navigate({ to: '/jobs' });
    },
    onError: () => toast.error('Failed to create job'),
  });

  const updateMutation = useMutation({
    mutationFn: (data: Partial<JobFormData>) => jobsApi.update(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.JOBS] });
      toast.success('Job updated successfully');
      navigate({ to: `/jobs/${id}` });
    },
    onError: () => toast.error('Failed to update job'),
  });

  const onSubmit = (data: JobFormData) => {
    if (isEdit) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  if (isEdit && isLoading) {
    return <LoadingSpinner message="Loading job..." />;
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => navigate({ to: '/jobs' })} sx={{ mr: 2 }}>
          <BackIcon />
        </IconButton>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          {isEdit ? 'Edit Job' : 'New Job'}
        </Typography>
      </Box>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card sx={{ p: 3, mb: 3 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Controller
                name="clientId"
                control={control}
                rules={{ required: 'Client is required' }}
                render={({ field: { onChange, value } }) => (
                  <Autocomplete
                    options={clients}
                    getOptionLabel={(option) =>
                      `${option.firstName} ${option.lastName}${option.companyName ? ` (${option.companyName})` : ''}`
                    }
                    value={clients.find(c => c.id === value) || null}
                    onChange={(_, newValue) => onChange(newValue?.id || '')}
                    renderInput={(params) => (
                      <TextField {...params} label="Client *" />
                    )}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <Controller
                name="title"
                control={control}
                rules={{ required: 'Title is required' }}
                render={({ field }) => (
                  <TextField {...field} label="Title *" fullWidth />
                )}
              />
            </Grid>

            <Grid item xs={12}>
              <Controller
                name="description"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Description"
                    multiline
                    rows={3}
                    fullWidth
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <Controller
                name="scheduledStart"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Scheduled Start"
                    type="datetime-local"
                    InputLabelProps={{ shrink: true }}
                    fullWidth
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <Controller
                name="scheduledEnd"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Scheduled End"
                    type="datetime-local"
                    InputLabelProps={{ shrink: true }}
                    fullWidth
                  />
                )}
              />
            </Grid>

            <Grid item xs={12}>
              <Controller
                name="assignedTo"
                control={control}
                render={({ field: { onChange, value } }) => (
                  <Autocomplete
                    multiple
                    options={users}
                    getOptionLabel={(option) => `${option.firstName} ${option.lastName} (${option.role})`}
                    value={users.filter(u => value?.includes(u.id)) || []}
                    onChange={(_, newValue) => onChange(newValue.map(u => u.id))}
                    renderInput={(params) => (
                      <TextField {...params} label="Assign Team Members" />
                    )}
                    renderTags={(value, getTagProps) =>
                      value.map((option, index) => (
                        <Chip
                          label={`${option.firstName} ${option.lastName}`}
                          {...getTagProps({ index })}
                        />
                      ))
                    }
                  />
                )}
              />
            </Grid>
          </Grid>
        </Card>

        <Card sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Service Address
          </Typography>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <Controller
                name="address.street1"
                control={control}
                render={({ field }) => (
                  <TextField {...field} label="Street Address" fullWidth />
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <Controller
                name="address.street2"
                control={control}
                render={({ field }) => (
                  <TextField {...field} label="Street Address 2" fullWidth />
                )}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Controller
                name="address.city"
                control={control}
                render={({ field }) => (
                  <TextField {...field} label="City" fullWidth />
                )}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Controller
                name="address.state"
                control={control}
                render={({ field }) => (
                  <TextField {...field} label="State/Province" fullWidth />
                )}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Controller
                name="address.postalCode"
                control={control}
                render={({ field }) => (
                  <TextField {...field} label="Postal Code" fullWidth />
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <Controller
                name="address.country"
                control={control}
                render={({ field }) => (
                  <TextField {...field} label="Country" fullWidth defaultValue="USA" />
                )}
              />
            </Grid>
          </Grid>
        </Card>

        <Card sx={{ p: 3, mb: 3 }}>
          <Controller
            name="notes"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Notes"
                multiline
                rows={4}
                fullWidth
              />
            )}
          />
        </Card>

        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
          <Button variant="outlined" onClick={() => navigate({ to: '/jobs' })}>
            Cancel
          </Button>
          <Button type="submit" variant="contained">
            {isEdit ? 'Update Job' : 'Create Job'}
          </Button>
        </Box>
      </form>
    </Box>
  );
};
