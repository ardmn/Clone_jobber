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
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { quotesApi } from '../../services/api';
import { QUERY_KEYS, PAGINATION } from '../../config/constants';
import { Button, LoadingSpinner, EmptyState, SearchBar, ConfirmDialog } from '../../components/common';
import { formatCurrency, formatDate } from '../../utils/format';
import toast from 'react-hot-toast';
import type { Quote } from '../../types';

const getStatusColor = (status: Quote['status']) => {
  switch (status) {
    case 'approved':
      return 'success';
    case 'declined':
      return 'error';
    case 'expired':
      return 'default';
    case 'sent':
    case 'viewed':
      return 'info';
    default:
      return 'default';
  }
};

export const QuotesListPage = () => {
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
    queryKey: [QUERY_KEYS.QUOTES, page + 1, rowsPerPage, search],
    queryFn: () =>
      quotesApi.getAll({
        page: page + 1,
        limit: rowsPerPage,
        search,
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: quotesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.QUOTES] });
      toast.success('Quote deleted successfully');
      setDeleteDialog({ open: false, id: null });
    },
    onError: () => {
      toast.error('Failed to delete quote');
    },
  });

  const sendMutation = useMutation({
    mutationFn: quotesApi.send,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.QUOTES] });
      toast.success('Quote sent successfully');
    },
    onError: () => {
      toast.error('Failed to send quote');
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
    return <LoadingSpinner message="Loading quotes..." />;
  }

  const quotes = data?.data || [];
  const totalQuotes = data?.meta?.total || 0;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          Quotes
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate({ to: '/quotes/new' })}
        >
          Create Quote
        </Button>
      </Box>

      <Card>
        <Box sx={{ p: 2 }}>
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search quotes..."
            fullWidth
          />
        </Box>

        {quotes.length === 0 ? (
          <EmptyState
            title="No quotes found"
            description="Create your first quote to get started"
            action={{
              label: 'Create Quote',
              onClick: () => navigate({ to: '/quotes/new' }),
            }}
          />
        ) : (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Quote #</TableCell>
                    <TableCell>Title</TableCell>
                    <TableCell>Client</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Created</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {quotes.map((quote) => (
                    <TableRow key={quote.id} hover>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {quote.quoteNumber}
                        </Typography>
                      </TableCell>
                      <TableCell>{quote.title}</TableCell>
                      <TableCell>
                        {quote.client
                          ? `${quote.client.firstName} ${quote.client.lastName}`
                          : '-'}
                      </TableCell>
                      <TableCell>{formatCurrency(quote.total)}</TableCell>
                      <TableCell>
                        <Chip
                          label={quote.status}
                          size="small"
                          color={getStatusColor(quote.status)}
                        />
                      </TableCell>
                      <TableCell>{formatDate(quote.createdAt)}</TableCell>
                      <TableCell align="right">
                        {quote.status === 'draft' && (
                          <IconButton
                            size="small"
                            onClick={() => handleSend(quote.id)}
                            title="Send Quote"
                          >
                            <SendIcon />
                          </IconButton>
                        )}
                        <IconButton
                          size="small"
                          onClick={() => navigate({ to: `/quotes/${quote.id}` })}
                        >
                          <VisibilityIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => navigate({ to: `/quotes/${quote.id}/edit` })}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => setDeleteDialog({ open: true, id: quote.id })}
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
              count={totalQuotes}
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
        title="Delete Quote"
        message="Are you sure you want to delete this quote? This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteDialog({ open: false, id: null })}
        severity="error"
      />
    </Box>
  );
};
