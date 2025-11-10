import { useState, useEffect } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import {
  Box,
  Typography,
  Card,
  Grid,
  TextField,
  IconButton,
  Divider,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Autocomplete,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { quotesApi, clientsApi } from '../../services/api';
import { QUERY_KEYS } from '../../config/constants';
import { Button, LoadingSpinner } from '../../components/common';
import { formatCurrency } from '../../utils/format';
import toast from 'react-hot-toast';
import type { QuoteFormData, Client } from '../../types';

export const QuoteFormPage = () => {
  const { id } = useParams({ from: '/quotes/$id/edit', strict: false }) || {};
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEdit = Boolean(id);
  const [clients, setClients] = useState<Client[]>([]);

  const { data: quote, isLoading } = useQuery({
    queryKey: [QUERY_KEYS.QUOTES, id],
    queryFn: () => quotesApi.getById(id!),
    enabled: isEdit,
  });

  useQuery({
    queryKey: [QUERY_KEYS.CLIENTS],
    queryFn: () => clientsApi.getAll({ limit: 100 }),
    onSuccess: (data) => setClients(data.data),
  });

  const { control, handleSubmit, watch, setValue, reset } = useForm<QuoteFormData>({
    defaultValues: {
      clientId: '',
      title: '',
      lineItems: [{ name: '', description: '', quantity: 1, unitPrice: 0, total: 0 }],
      taxRate: 0,
      notes: '',
      terms: '',
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'lineItems',
  });

  const lineItems = watch('lineItems');
  const taxRate = watch('taxRate');

  useEffect(() => {
    if (quote) {
      reset({
        clientId: quote.clientId,
        title: quote.title,
        lineItems: quote.lineItems.map(item => ({
          name: item.name,
          description: item.description || '',
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.total,
        })),
        taxRate: quote.taxRate,
        notes: quote.notes || '',
        terms: quote.terms || '',
      });
    }
  }, [quote, reset]);

  useEffect(() => {
    lineItems.forEach((item, index) => {
      const total = item.quantity * item.unitPrice;
      if (item.total !== total) {
        setValue(`lineItems.${index}.total`, total);
      }
    });
  }, [lineItems, setValue]);

  const subtotal = lineItems.reduce((sum, item) => sum + item.total, 0);
  const taxAmount = subtotal * (taxRate / 100);
  const total = subtotal + taxAmount;

  const createMutation = useMutation({
    mutationFn: quotesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.QUOTES] });
      toast.success('Quote created successfully');
      navigate({ to: '/quotes' });
    },
    onError: () => toast.error('Failed to create quote'),
  });

  const updateMutation = useMutation({
    mutationFn: (data: Partial<QuoteFormData>) => quotesApi.update(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.QUOTES] });
      toast.success('Quote updated successfully');
      navigate({ to: '/quotes' });
    },
    onError: () => toast.error('Failed to update quote'),
  });

  const onSubmit = (data: QuoteFormData) => {
    if (isEdit) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  if (isEdit && isLoading) {
    return <LoadingSpinner message="Loading quote..." />;
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => navigate({ to: '/quotes' })} sx={{ mr: 2 }}>
          <BackIcon />
        </IconButton>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          {isEdit ? 'Edit Quote' : 'New Quote'}
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
                    getOptionLabel={(option) => `${option.firstName} ${option.lastName}${option.companyName ? ` (${option.companyName})` : ''}`}
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
          </Grid>
        </Card>

        <Card sx={{ p: 3, mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Line Items</Typography>
            <Button
              variant="outlined"
              size="small"
              startIcon={<AddIcon />}
              onClick={() => append({ name: '', description: '', quantity: 1, unitPrice: 0, total: 0 })}
            >
              Add Item
            </Button>
          </Box>

          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Item</TableCell>
                <TableCell>Quantity</TableCell>
                <TableCell>Price</TableCell>
                <TableCell>Total</TableCell>
                <TableCell width={50}></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {fields.map((field, index) => (
                <TableRow key={field.id}>
                  <TableCell>
                    <Controller
                      name={`lineItems.${index}.name`}
                      control={control}
                      render={({ field }) => (
                        <TextField {...field} size="small" fullWidth />
                      )}
                    />
                  </TableCell>
                  <TableCell>
                    <Controller
                      name={`lineItems.${index}.quantity`}
                      control={control}
                      render={({ field }) => (
                        <TextField {...field} type="number" size="small" sx={{ width: 100 }} />
                      )}
                    />
                  </TableCell>
                  <TableCell>
                    <Controller
                      name={`lineItems.${index}.unitPrice`}
                      control={control}
                      render={({ field }) => (
                        <TextField {...field} type="number" size="small" sx={{ width: 120 }} />
                      )}
                    />
                  </TableCell>
                  <TableCell>{formatCurrency(lineItems[index].total)}</TableCell>
                  <TableCell>
                    <IconButton size="small" onClick={() => remove(index)}>
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <Divider sx={{ my: 2 }} />

          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Box sx={{ width: 300 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography>Subtotal:</Typography>
                <Typography>{formatCurrency(subtotal)}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, alignItems: 'center' }}>
                <Typography>Tax:</Typography>
                <Controller
                  name="taxRate"
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} type="number" size="small" sx={{ width: 100 }} InputProps={{ endAdornment: '%' }} />
                  )}
                />
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="h6">Total:</Typography>
                <Typography variant="h6">{formatCurrency(total)}</Typography>
              </Box>
            </Box>
          </Box>
        </Card>

        <Card sx={{ p: 3, mb: 3 }}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Controller
                name="notes"
                control={control}
                render={({ field }) => (
                  <TextField {...field} label="Notes" multiline rows={3} fullWidth />
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <Controller
                name="terms"
                control={control}
                render={({ field }) => (
                  <TextField {...field} label="Terms & Conditions" multiline rows={3} fullWidth />
                )}
              />
            </Grid>
          </Grid>
        </Card>

        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
          <Button variant="outlined" onClick={() => navigate({ to: '/quotes' })}>
            Cancel
          </Button>
          <Button type="submit" variant="contained">
            {isEdit ? 'Update Quote' : 'Create Quote'}
          </Button>
        </Box>
      </form>
    </Box>
  );
};
