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
  Chip,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import {
  Email as EmailIcon,
  Sms as SmsIcon,
  Send as SendIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { communicationsApi } from '../../services/api';
import { QUERY_KEYS, PAGINATION } from '../../config/constants';
import { Button, LoadingSpinner, EmptyState } from '../../components/common';
import { formatDateTime } from '../../utils/format';
import toast from 'react-hot-toast';
import type { Message } from '../../types';

const getStatusColor = (status: Message['status']) => {
  switch (status) {
    case 'delivered':
      return 'success';
    case 'sent':
      return 'info';
    case 'failed':
      return 'error';
    default:
      return 'warning';
  }
};

export const CommunicationsPage = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(PAGINATION.DEFAULT_LIMIT);
  const [messageType, setMessageType] = useState<'all' | 'email' | 'sms'>('all');
  const [sendDialog, setSendDialog] = useState<{
    open: boolean;
    type: 'email' | 'sms' | null;
  }>({ open: false, type: null });
  const [formData, setFormData] = useState({
    to: '',
    subject: '',
    body: '',
  });

  const { data, isLoading } = useQuery({
    queryKey: [QUERY_KEYS.COMMUNICATIONS, page + 1, rowsPerPage, messageType],
    queryFn: () =>
      communicationsApi.getHistory({
        page: page + 1,
        limit: rowsPerPage,
        type: messageType === 'all' ? undefined : messageType,
      }),
  });

  const sendEmailMutation = useMutation({
    mutationFn: communicationsApi.sendEmail,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.COMMUNICATIONS] });
      toast.success('Email sent successfully');
      setSendDialog({ open: false, type: null });
      setFormData({ to: '', subject: '', body: '' });
    },
    onError: () => {
      toast.error('Failed to send email');
    },
  });

  const sendSmsMutation = useMutation({
    mutationFn: communicationsApi.sendSMS,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.COMMUNICATIONS] });
      toast.success('SMS sent successfully');
      setSendDialog({ open: false, type: null });
      setFormData({ to: '', subject: '', body: '' });
    },
    onError: () => {
      toast.error('Failed to send SMS');
    },
  });

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSend = () => {
    if (sendDialog.type === 'email') {
      sendEmailMutation.mutate(formData);
    } else if (sendDialog.type === 'sms') {
      sendSmsMutation.mutate({ to: formData.to, body: formData.body });
    }
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading communications..." />;
  }

  const messages = data?.data || [];
  const totalMessages = data?.meta?.total || 0;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          Communications
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<EmailIcon />}
            onClick={() => setSendDialog({ open: true, type: 'email' })}
          >
            Send Email
          </Button>
          <Button
            variant="outlined"
            startIcon={<SmsIcon />}
            onClick={() => setSendDialog({ open: true, type: 'sms' })}
          >
            Send SMS
          </Button>
        </Box>
      </Box>

      <Card>
        <Tabs
          value={messageType}
          onChange={(_, value) => {
            setMessageType(value);
            setPage(0);
          }}
          sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}
        >
          <Tab label="All" value="all" />
          <Tab label="Email" value="email" />
          <Tab label="SMS" value="sms" />
        </Tabs>

        {messages.length === 0 ? (
          <EmptyState
            title="No messages found"
            description="Send your first message to get started"
          />
        ) : (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Type</TableCell>
                    <TableCell>To</TableCell>
                    <TableCell>Subject</TableCell>
                    <TableCell>Client</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Sent</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {messages.map((message) => (
                    <TableRow key={message.id} hover>
                      <TableCell>
                        <Chip
                          icon={message.type === 'email' ? <EmailIcon /> : <SmsIcon />}
                          label={message.type.toUpperCase()}
                          size="small"
                          color={message.type === 'email' ? 'primary' : 'secondary'}
                        />
                      </TableCell>
                      <TableCell>{message.to}</TableCell>
                      <TableCell>
                        {message.type === 'email' ? message.subject : message.body.substring(0, 50) + '...'}
                      </TableCell>
                      <TableCell>
                        {message.client
                          ? `${message.client.firstName} ${message.client.lastName}`
                          : '-'}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={message.status}
                          size="small"
                          color={getStatusColor(message.status)}
                        />
                      </TableCell>
                      <TableCell>
                        {message.sentAt ? formatDateTime(message.sentAt) : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <TablePagination
              component="div"
              count={totalMessages}
              page={page}
              onPageChange={handleChangePage}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              rowsPerPageOptions={PAGINATION.PAGE_SIZE_OPTIONS}
            />
          </>
        )}
      </Card>

      <Dialog open={sendDialog.open} onClose={() => setSendDialog({ open: false, type: null })} maxWidth="sm" fullWidth>
        <DialogTitle>
          {sendDialog.type === 'email' ? 'Send Email' : 'Send SMS'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="To"
              value={formData.to}
              onChange={(e) => setFormData({ ...formData, to: e.target.value })}
              placeholder={sendDialog.type === 'email' ? 'email@example.com' : '+1234567890'}
              fullWidth
            />
            {sendDialog.type === 'email' && (
              <TextField
                label="Subject"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                fullWidth
              />
            )}
            <TextField
              label={sendDialog.type === 'email' ? 'Body' : 'Message'}
              value={formData.body}
              onChange={(e) => setFormData({ ...formData, body: e.target.value })}
              multiline
              rows={6}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSendDialog({ open: false, type: null })}>Cancel</Button>
          <Button
            variant="contained"
            startIcon={<SendIcon />}
            onClick={handleSend}
            disabled={!formData.to || !formData.body || (sendDialog.type === 'email' && !formData.subject)}
          >
            Send
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
