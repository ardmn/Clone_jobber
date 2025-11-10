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
} from '@mui/icons-material';
import { quotesApi } from '../../services/api';
import { QUERY_KEYS } from '../../config/constants';
import { Button, LoadingSpinner } from '../../components/common';
import { formatCurrency, formatDate } from '../../utils/format';

export const QuoteDetailPage = () => {
  const { id } = useParams({ from: '/quotes/$id' });
  const navigate = useNavigate();

  const { data: quote, isLoading } = useQuery({
    queryKey: [QUERY_KEYS.QUOTES, id],
    queryFn: () => quotesApi.getById(id),
  });

  if (isLoading) {
    return <LoadingSpinner message="Loading quote..." />;
  }

  if (!quote) {
    return <Typography>Quote not found</Typography>;
  }

  const getStatusColor = () => {
    switch (quote.status) {
      case 'approved': return 'success';
      case 'declined': return 'error';
      case 'expired': return 'default';
      case 'sent':
      case 'viewed': return 'info';
      default: return 'default';
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => navigate({ to: '/quotes' })} sx={{ mr: 2 }}>
          <BackIcon />
        </IconButton>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h4" sx={{ fontWeight: 600 }}>
            {quote.quoteNumber}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {quote.title}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          {quote.status === 'draft' && (
            <Button variant="outlined" startIcon={<SendIcon />}>
              Send Quote
            </Button>
          )}
          <Button
            variant="contained"
            startIcon={<EditIcon />}
            onClick={() => navigate({ to: `/quotes/${id}/edit` })}
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
                  {quote.client ? `${quote.client.firstName} ${quote.client.lastName}` : '-'}
                </Typography>
                {quote.client?.companyName && (
                  <Typography variant="body2" color="text.secondary">
                    {quote.client.companyName}
                  </Typography>
                )}
              </Box>
              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Status
                </Typography>
                <Chip label={quote.status} color={getStatusColor()} sx={{ mt: 0.5 }} />
              </Box>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Created
                </Typography>
                <Typography variant="body1">{formatDate(quote.createdAt)}</Typography>
              </Grid>
              {quote.expiryDate && (
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Expires
                  </Typography>
                  <Typography variant="body1">{formatDate(quote.expiryDate)}</Typography>
                </Grid>
              )}
              {quote.sentAt && (
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Sent
                  </Typography>
                  <Typography variant="body1">{formatDate(quote.sentAt)}</Typography>
                </Grid>
              )}
              {quote.approvedAt && (
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Approved
                  </Typography>
                  <Typography variant="body1">{formatDate(quote.approvedAt)}</Typography>
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
              <Typography>{formatCurrency(quote.subtotal)}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography>Tax ({quote.taxRate}%):</Typography>
              <Typography>{formatCurrency(quote.taxAmount)}</Typography>
            </Box>
            <Divider sx={{ my: 1 }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="h6">Total:</Typography>
              <Typography variant="h6">{formatCurrency(quote.total)}</Typography>
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
                  {quote.lineItems.map((item) => (
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
        {quote.notes && (
          <Grid item xs={12} md={6}>
            <Card sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Notes
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                {quote.notes}
              </Typography>
            </Card>
          </Grid>
        )}

        {/* Terms */}
        {quote.terms && (
          <Grid item xs={12} md={6}>
            <Card sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Terms & Conditions
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                {quote.terms}
              </Typography>
            </Card>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};
