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
  Send as SendIcon,
  Payment as PaymentIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { invoicesApi } from '../../services/api';
import { QUERY_KEYS, PAGINATION } from '../../config/constants';
import { Button, LoadingSpinner, EmptyState, SearchBar, ConfirmDialog } from '../../components/common';
import { formatCurrency, formatDate } from '../../utils/format';
import toast from 'react-hot-toast';
import type { Invoice } from '../../types';

const getStatusColor = (status: Invoice['status']) => {
  switch (status) {
    case 'paid':
      return 'success';
    case 'overdue':
      return 'error';
    case 'partial':
      return 'warning';
    case 'void':
      return 'default';
    case 'sent':
    case 'viewed':
      return 'info';
    default:
      return 'default';
  }
};

export const InvoicesListPage = () => {
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
    queryKey: [QUERY_KEYS.INVOICES, page + 1, rowsPerPage, search],
    queryFn: () =>
      invoicesApi.getAll({
        page: page + 1,
        limit: rowsPerPage,
        search,
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: invoicesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.INVOICES] });
      toast.success('Invoice deleted successfully');
      setDeleteDialog({ open: false, id: null });
    },
    onError: () => {
      toast.error('Failed to delete invoice');
    },
  });

  const sendMutation = useMutation({
    mutationFn: invoicesApi.send,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.INVOICES] });
      toast.success('Invoice sent successfully');
    },
    onError: () => {
      toast.error('Failed to send invoice');
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

  const handleSend = (id: string) => {
    sendMutation.mutate(id);
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading invoices..." />;
  }

  const invoices = data?.data || [];
  const totalInvoices = data?.meta?.total || 0;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          Invoices
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate({ to: '/invoices/new' })}
        >
          Create Invoice
        </Button>
      </Box>

      <Card>
        <Box sx={{ p: 2 }}>
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search invoices..."
            fullWidth
          />
        </Box>

        {invoices.length === 0 ? (
          <EmptyState
            title="No invoices found"
            description="Create your first invoice to get started"
            action={{
              label: 'Create Invoice',
              onClick: () => navigate({ to: '/invoices/new' }),
            }}
          />
        ) : (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Invoice #</TableCell>
                    <TableCell>Client</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Balance</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Due Date</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {invoices.map((invoice) => (
                    <TableRow key={invoice.id} hover>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {invoice.invoiceNumber}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {invoice.client
                          ? `${invoice.client.firstName} ${invoice.client.lastName}`
                          : '-'}
                      </TableCell>
                      <TableCell>{formatCurrency(invoice.total)}</TableCell>
                      <TableCell>
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 500,
                            color: invoice.balance > 0 ? 'error.main' : 'success.main',
                          }}
                        >
                          {formatCurrency(invoice.balance)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={invoice.status}
                          size="small"
                          color={getStatusColor(invoice.status)}
                        />
                      </TableCell>
                      <TableCell>{formatDate(invoice.dueDate)}</TableCell>
                      <TableCell align="right">
                        {invoice.status === 'draft' && (
                          <IconButton
                            size="small"
                            onClick={() => handleSend(invoice.id)}
                            title="Send Invoice"
                          >
                            <SendIcon />
                          </IconButton>
                        )}
                        {invoice.balance > 0 && invoice.status !== 'void' && (
                          <IconButton
                            size="small"
                            onClick={() => navigate({ to: `/invoices/${invoice.id}/payment` })}
                            title="Record Payment"
                          >
                            <PaymentIcon />
                          </IconButton>
                        )}
                        <IconButton
                          size="small"
                          onClick={() => navigate({ to: `/invoices/${invoice.id}` })}
                        >
                          <VisibilityIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => navigate({ to: `/invoices/${invoice.id}/edit` })}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => setDeleteDialog({ open: true, id: invoice.id })}
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
              count={totalInvoices}
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
        title="Delete Invoice"
        message="Are you sure you want to delete this invoice? This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteDialog({ open: false, id: null })}
        severity="error"
      />
    </Box>
  );
};
