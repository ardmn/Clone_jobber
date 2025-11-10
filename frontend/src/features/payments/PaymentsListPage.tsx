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
  Visibility as VisibilityIcon,
  Undo as RefundIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { paymentsApi } from '../../services/api';
import { QUERY_KEYS, PAGINATION } from '../../config/constants';
import { LoadingSpinner, EmptyState, SearchBar, ConfirmDialog } from '../../components/common';
import { formatCurrency, formatDateTime } from '../../utils/format';
import toast from 'react-hot-toast';
import type { Payment } from '../../types';

const getStatusColor = (status: Payment['status']) => {
  switch (status) {
    case 'completed':
      return 'success';
    case 'failed':
      return 'error';
    case 'refunded':
      return 'default';
    case 'processing':
      return 'info';
    default:
      return 'warning';
  }
};

const getMethodLabel = (method: Payment['method']) => {
  const labels = {
    card: 'Credit Card',
    bank_transfer: 'Bank Transfer',
    cash: 'Cash',
    check: 'Check',
    other: 'Other',
  };
  return labels[method] || method;
};

export const PaymentsListPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(PAGINATION.DEFAULT_LIMIT);
  const [search, setSearch] = useState('');
  const [refundDialog, setRefundDialog] = useState<{ open: boolean; id: string | null }>({
    open: false,
    id: null,
  });

  const { data, isLoading } = useQuery({
    queryKey: [QUERY_KEYS.PAYMENTS, page + 1, rowsPerPage, search],
    queryFn: () =>
      paymentsApi.getAll({
        page: page + 1,
        limit: rowsPerPage,
        search,
      }),
  });

  const refundMutation = useMutation({
    mutationFn: paymentsApi.refund,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PAYMENTS] });
      toast.success('Payment refunded successfully');
      setRefundDialog({ open: false, id: null });
    },
    onError: () => {
      toast.error('Failed to refund payment');
    },
  });

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleRefund = () => {
    if (refundDialog.id) {
      refundMutation.mutate(refundDialog.id);
    }
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading payments..." />;
  }

  const payments = data?.data || [];
  const totalPayments = data?.meta?.total || 0;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          Payments
        </Typography>
      </Box>

      <Card>
        <Box sx={{ p: 2 }}>
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search payments..."
            fullWidth
          />
        </Box>

        {payments.length === 0 ? (
          <EmptyState
            title="No payments found"
            description="Payments will appear here once invoices are paid"
          />
        ) : (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Payment Date</TableCell>
                    <TableCell>Client</TableCell>
                    <TableCell>Invoice</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Method</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {payments.map((payment) => (
                    <TableRow key={payment.id} hover>
                      <TableCell>{formatDateTime(payment.createdAt)}</TableCell>
                      <TableCell>
                        {payment.client
                          ? `${payment.client.firstName} ${payment.client.lastName}`
                          : '-'}
                      </TableCell>
                      <TableCell>
                        {payment.invoice ? payment.invoice.invoiceNumber : '-'}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {formatCurrency(payment.amount)}
                        </Typography>
                        {payment.method === 'card' && payment.cardLast4 && (
                          <Typography variant="caption" color="text.secondary">
                            {payment.cardBrand} •••• {payment.cardLast4}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>{getMethodLabel(payment.method)}</TableCell>
                      <TableCell>
                        <Chip
                          label={payment.status}
                          size="small"
                          color={getStatusColor(payment.status)}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          onClick={() => navigate({ to: `/payments/${payment.id}` })}
                        >
                          <VisibilityIcon />
                        </IconButton>
                        {payment.status === 'completed' && (
                          <IconButton
                            size="small"
                            onClick={() => setRefundDialog({ open: true, id: payment.id })}
                            title="Refund Payment"
                          >
                            <RefundIcon />
                          </IconButton>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <TablePagination
              component="div"
              count={totalPayments}
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
        open={refundDialog.open}
        title="Refund Payment"
        message="Are you sure you want to refund this payment? This action cannot be undone and the amount will be returned to the customer."
        confirmLabel="Refund"
        onConfirm={handleRefund}
        onCancel={() => setRefundDialog({ open: false, id: null })}
        severity="warning"
      />
    </Box>
  );
};
