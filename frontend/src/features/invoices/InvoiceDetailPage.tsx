import { useParams, useNavigate } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Typography,
  Card,
  Grid,
  Chip,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
} from '@mui/material';
import {
  Edit as EditIcon,
  ArrowBack as BackIcon,
  Send as SendIcon,
  Payment as PaymentIcon,
} from '@mui/icons-material';
import { invoicesApi } from '../../services/api';
import { QUERY_KEYS } from '../../config/constants';
import { Button, LoadingSpinner } from '../../components/common';
import { formatCurrency, formatDate } from '../../utils/format';

export const InvoiceDetailPage = () => {
  const { id } = useParams({ from: '/invoices/$id' });
  const navigate = useNavigate();

  const { data: invoice, isLoading } = useQuery({
    queryKey: [QUERY_KEYS.INVOICES, id],
    queryFn: () => invoicesApi.getById(id),
  });

  if (isLoading) {
    return <LoadingSpinner message="Loading invoice..." />;
  }

  if (!invoice) {
    return <Typography>Invoice not found</Typography>;
  }

  const getStatusColor = () => {
    switch (invoice.status) {
      case 'paid': return 'success';
      case 'overdue': return 'error';
      case 'partial': return 'warning';
      case 'void': return 'default';
      case 'sent':
      case 'viewed': return 'info';
      default: return 'default';
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => navigate({ to: '/invoices' })} sx={{ mr: 2 }}>
          <BackIcon />
        </IconButton>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h4" sx={{ fontWeight: 600 }}>
            {invoice.invoiceNumber}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Invoice
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          {invoice.status === 'draft' && (
            <Button variant="outlined" startIcon={<SendIcon />}>
              Send Invoice
            </Button>
          )}
          {invoice.balance > 0 && invoice.status !== 'void' && (
            <Button
              variant="outlined"
              startIcon={<PaymentIcon />}
              onClick={() => navigate({ to: `/invoices/${id}/payment` })}
            >
              Record Payment
            </Button>
          )}
          <Button
            variant="contained"
            startIcon={<EditIcon />}
            onClick={() => navigate({ to: `/invoices/${id}/edit` })}
          >
            Edit
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Header Info */}
        <Grid item xs={12} md={8}>
          <Card sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Client
                </Typography>
                <Typography variant="h6">
                  {invoice.client ? `${invoice.client.firstName} ${invoice.client.lastName}` : '-'}
                </Typography>
                {invoice.client?.companyName && (
                  <Typography variant="body2" color="text.secondary">
                    {invoice.client.companyName}
                  </Typography>
                )}
              </Box>
              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Status
                </Typography>
                <Chip label={invoice.status} color={getStatusColor()} sx={{ mt: 0.5 }} />
              </Box>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Issue Date
                </Typography>
                <Typography variant="body1">{formatDate(invoice.issueDate)}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Due Date
                </Typography>
                <Typography variant="body1">{formatDate(invoice.dueDate)}</Typography>
              </Grid>
              {invoice.sentAt && (
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Sent
                  </Typography>
                  <Typography variant="body1">{formatDate(invoice.sentAt)}</Typography>
                </Grid>
              )}
              {invoice.paidAt && (
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Paid
                  </Typography>
                  <Typography variant="body1">{formatDate(invoice.paidAt)}</Typography>
                </Grid>
              )}
              {invoice.job && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Related Job
                  </Typography>
                  <Typography variant="body1">
                    {invoice.job.jobNumber} - {invoice.job.title}
                  </Typography>
                </Grid>
              )}
            </Grid>
          </Card>
        </Grid>

        {/* Summary Card */}
        <Grid item xs={12} md={4}>
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Summary
            </Typography>
            <Divider sx={{ my: 2 }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography>Subtotal:</Typography>
              <Typography>{formatCurrency(invoice.subtotal)}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography>Tax ({invoice.taxRate}%):</Typography>
              <Typography>{formatCurrency(invoice.taxAmount)}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="h6">Total:</Typography>
              <Typography variant="h6">{formatCurrency(invoice.total)}</Typography>
            </Box>
            <Divider sx={{ my: 1 }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="h6" color={invoice.balance > 0 ? 'error.main' : 'success.main'}>
                Balance:
              </Typography>
              <Typography variant="h6" color={invoice.balance > 0 ? 'error.main' : 'success.main'}>
                {formatCurrency(invoice.balance)}
              </Typography>
            </Box>
          </Card>
        </Grid>

        {/* Line Items */}
        <Grid item xs={12}>
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Line Items
            </Typography>
            <Divider sx={{ my: 2 }} />
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Item</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell align="right">Qty</TableCell>
                    <TableCell align="right">Price</TableCell>
                    <TableCell align="right">Total</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {invoice.lineItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.name}</TableCell>
                      <TableCell>{item.description || '-'}</TableCell>
                      <TableCell align="right">{item.quantity}</TableCell>
                      <TableCell align="right">{formatCurrency(item.unitPrice)}</TableCell>
                      <TableCell align="right">{formatCurrency(item.total)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </Grid>

        {/* Notes */}
        {invoice.notes && (
          <Grid item xs={12} md={6}>
            <Card sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Notes
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                {invoice.notes}
              </Typography>
            </Card>
          </Grid>
        )}

        {/* Terms */}
        {invoice.terms && (
          <Grid item xs={12} md={6}>
            <Card sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Payment Terms
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                {invoice.terms}
              </Typography>
            </Card>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};
