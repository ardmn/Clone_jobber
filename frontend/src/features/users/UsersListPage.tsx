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
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { usersApi } from '../../services/api';
import { QUERY_KEYS, PAGINATION } from '../../config/constants';
import { Button, LoadingSpinner, EmptyState, SearchBar, ConfirmDialog } from '../../components/common';
import { formatPhone, formatDate } from '../../utils/format';
import toast from 'react-hot-toast';
import type { User } from '../../types';

const getRoleColor = (role: User['role']) => {
  switch (role) {
    case 'owner':
    case 'admin':
      return 'error';
    case 'manager':
      return 'warning';
    case 'dispatcher':
      return 'info';
    case 'technician':
      return 'success';
    default:
      return 'default';
  }
};

export const UsersListPage = () => {
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
    queryKey: [QUERY_KEYS.USERS, page + 1, rowsPerPage, search],
    queryFn: () =>
      usersApi.getAll({
        page: page + 1,
        limit: rowsPerPage,
        search,
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: usersApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.USERS] });
      toast.success('User deleted successfully');
      setDeleteDialog({ open: false, id: null });
    },
    onError: () => {
      toast.error('Failed to delete user');
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
    return <LoadingSpinner message="Loading team members..." />;
  }

  const users = data?.data || [];
  const totalUsers = data?.meta?.total || 0;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          Team
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate({ to: '/users/new' })}
        >
          Add Team Member
        </Button>
      </Box>

      <Card>
        <Box sx={{ p: 2 }}>
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search team members..."
            fullWidth
          />
        </Box>

        {users.length === 0 ? (
          <EmptyState
            title="No team members found"
            description="Add your first team member to get started"
            action={{
              label: 'Add Team Member',
              onClick: () => navigate({ to: '/users/new' }),
            }}
          />
        ) : (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Phone</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Joined</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id} hover>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {user.firstName} {user.lastName}
                        </Typography>
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.phone ? formatPhone(user.phone) : '-'}</TableCell>
                      <TableCell>
                        <Chip
                          label={user.role}
                          size="small"
                          color={getRoleColor(user.role)}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={user.status}
                          size="small"
                          color={user.status === 'active' ? 'success' : 'default'}
                        />
                      </TableCell>
                      <TableCell>{formatDate(user.createdAt)}</TableCell>
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          onClick={() => navigate({ to: `/users/${user.id}` })}
                        >
                          <VisibilityIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => navigate({ to: `/users/${user.id}/edit` })}
                        >
                          <EditIcon />
                        </IconButton>
                        {user.role !== 'owner' && (
                          <IconButton
                            size="small"
                            onClick={() => setDeleteDialog({ open: true, id: user.id })}
                          >
                            <DeleteIcon />
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
              count={totalUsers}
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
        title="Delete Team Member"
        message="Are you sure you want to delete this team member? This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteDialog({ open: false, id: null })}
        severity="error"
      />
    </Box>
  );
};
