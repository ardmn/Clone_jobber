import { useParams, useNavigate } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Typography,
  Card,
  Grid,
  Chip,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import {
  Edit as EditIcon,
  ArrowBack as BackIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Business as BusinessIcon,
} from '@mui/icons-material';
import { clientsApi } from '../../services/api';
import { QUERY_KEYS } from '../../config/constants';
import { Button, LoadingSpinner } from '../../components/common';
import { formatPhone, formatDate } from '../../utils/format';

export const ClientDetailPage = () => {
  const { id } = useParams({ from: '/clients/$id' });
  const navigate = useNavigate();

  const { data: client, isLoading } = useQuery({
    queryKey: [QUERY_KEYS.CLIENTS, id],
    queryFn: () => clientsApi.getById(id),
  });

  if (isLoading) {
    return <LoadingSpinner message="Loading client..." />;
  }

  if (!client) {
    return <Typography>Client not found</Typography>;
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => navigate({ to: '/clients' })} sx={{ mr: 2 }}>
          <BackIcon />
        </IconButton>
        <Typography variant="h4" sx={{ fontWeight: 600, flexGrow: 1 }}>
          {client.firstName} {client.lastName}
        </Typography>
        <Button
          variant="contained"
          startIcon={<EditIcon />}
          onClick={() => navigate({ to: `/clients/${id}/edit` })}
        >
          Edit
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* Main Info Card */}
        <Grid item xs={12} md={6}>
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Contact Information
            </Typography>
            <Divider sx={{ my: 2 }} />

            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Status
              </Typography>
              <Chip
                label={client.status}
                size="small"
                color={client.status === 'active' ? 'success' : 'default'}
                sx={{ mt: 0.5 }}
              />
            </Box>

            {client.companyName && (
              <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <BusinessIcon color="action" />
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Company
                  </Typography>
                  <Typography variant="body1">{client.companyName}</Typography>
                </Box>
              </Box>
            )}

            {client.email && (
              <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <EmailIcon color="action" />
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Email
                  </Typography>
                  <Typography variant="body1">{client.email}</Typography>
                </Box>
              </Box>
            )}

            {client.phone && (
              <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <PhoneIcon color="action" />
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Phone
                  </Typography>
                  <Typography variant="body1">{formatPhone(client.phone)}</Typography>
                </Box>
              </Box>
            )}

            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Created
              </Typography>
              <Typography variant="body2">{formatDate(client.createdAt)}</Typography>
            </Box>
          </Card>
        </Grid>

        {/* Addresses Card */}
        <Grid item xs={12} md={6}>
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Addresses
            </Typography>
            <Divider sx={{ my: 2 }} />
            {client.addresses && client.addresses.length > 0 ? (
              <List>
                {client.addresses.map((address) => (
                  <ListItem key={address.id} sx={{ px: 0 }}>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body1">{address.type}</Typography>
                          {address.isPrimary && (
                            <Chip label="Primary" size="small" color="primary" />
                          )}
                        </Box>
                      }
                      secondary={
                        <>
                          {address.street1}
                          {address.street2 && <>, {address.street2}</>}
                          <br />
                          {address.city}, {address.state} {address.postalCode}
                          <br />
                          {address.country}
                        </>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No addresses on file
              </Typography>
            )}
          </Card>
        </Grid>

        {/* Contacts Card */}
        {client.contacts && client.contacts.length > 0 && (
          <Grid item xs={12}>
            <Card sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Additional Contacts
              </Typography>
              <Divider sx={{ my: 2 }} />
              <List>
                {client.contacts.map((contact) => (
                  <ListItem key={contact.id}>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body1">
                            {contact.firstName} {contact.lastName}
                          </Typography>
                          {contact.isPrimary && (
                            <Chip label="Primary" size="small" color="primary" />
                          )}
                          {contact.role && (
                            <Chip label={contact.role} size="small" />
                          )}
                        </Box>
                      }
                      secondary={
                        <>
                          {contact.email && <>{contact.email}<br /></>}
                          {contact.phone && formatPhone(contact.phone)}
                        </>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </Card>
          </Grid>
        )}

        {/* Notes Card */}
        {client.notes && (
          <Grid item xs={12}>
            <Card sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Notes
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                {client.notes}
              </Typography>
            </Card>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};
