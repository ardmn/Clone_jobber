import { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  Grid,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tabs,
  Tab,
  Divider,
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, LoadingSpinner } from '../../components/common';
import { QUERY_KEYS } from '../../config/constants';
import axiosInstance from '../../services/api/axiosInstance';
import { API_ENDPOINTS } from '../../config/api';
import toast from 'react-hot-toast';
import type { Account, AccountSettings } from '../../types';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;
  return (
    <div hidden={value !== index} {...other}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
};

export const SettingsPage = () => {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState(0);
  const [accountData, setAccountData] = useState({
    name: '',
    email: '',
    phone: '',
    website: '',
  });
  const [settingsData, setSettingsData] = useState<Partial<AccountSettings>>({
    timezone: 'America/New_York',
    currency: 'USD',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12h',
    taxRate: 0,
    taxLabel: 'Tax',
    invoicePrefix: 'INV-',
    quotePrefix: 'QT-',
    jobPrefix: 'JOB-',
  });

  const { data: account, isLoading } = useQuery<Account>({
    queryKey: [QUERY_KEYS.ACCOUNT],
    queryFn: async () => {
      const response = await axiosInstance.get(API_ENDPOINTS.ACCOUNTS_CURRENT);
      const acc = response.data.data || response.data;
      setAccountData({
        name: acc.name || '',
        email: acc.email || '',
        phone: acc.phone || '',
        website: acc.website || '',
      });
      if (acc.settings) {
        setSettingsData(acc.settings);
      }
      return acc;
    },
  });

  const updateAccountMutation = useMutation({
    mutationFn: async (data: Partial<Account>) => {
      const response = await axiosInstance.patch(API_ENDPOINTS.ACCOUNTS_UPDATE, data);
      return response.data.data || response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ACCOUNT] });
      toast.success('Account settings updated');
    },
    onError: () => {
      toast.error('Failed to update settings');
    },
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (data: Partial<AccountSettings>) => {
      const response = await axiosInstance.patch(API_ENDPOINTS.ACCOUNTS_UPDATE, {
        settings: data,
      });
      return response.data.data || response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ACCOUNT] });
      toast.success('Settings updated');
    },
    onError: () => {
      toast.error('Failed to update settings');
    },
  });

  const handleSaveAccount = () => {
    updateAccountMutation.mutate(accountData);
  };

  const handleSaveSettings = () => {
    updateSettingsMutation.mutate(settingsData);
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading settings..." />;
  }

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 600, mb: 3 }}>
        Settings
      </Typography>

      <Card>
        <Tabs value={tab} onChange={(_, value) => setTab(value)} sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}>
          <Tab label="Account" />
          <Tab label="General" />
          <Tab label="Billing" />
        </Tabs>

        <Box sx={{ p: 3 }}>
          {/* Account Tab */}
          <TabPanel value={tab} index={0}>
            <Typography variant="h6" gutterBottom>
              Account Information
            </Typography>
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Company Name"
                  value={accountData.name}
                  onChange={(e) => setAccountData({ ...accountData, name: e.target.value })}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Email"
                  type="email"
                  value={accountData.email}
                  onChange={(e) => setAccountData({ ...accountData, email: e.target.value })}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Phone"
                  value={accountData.phone}
                  onChange={(e) => setAccountData({ ...accountData, phone: e.target.value })}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Website"
                  value={accountData.website}
                  onChange={(e) => setAccountData({ ...accountData, website: e.target.value })}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12}>
                <Button variant="contained" onClick={handleSaveAccount}>
                  Save Account Settings
                </Button>
              </Grid>
            </Grid>
          </TabPanel>

          {/* General Settings Tab */}
          <TabPanel value={tab} index={1}>
            <Typography variant="h6" gutterBottom>
              General Settings
            </Typography>
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Timezone</InputLabel>
                  <Select
                    value={settingsData.timezone}
                    label="Timezone"
                    onChange={(e) => setSettingsData({ ...settingsData, timezone: e.target.value })}
                  >
                    <MenuItem value="America/New_York">Eastern Time</MenuItem>
                    <MenuItem value="America/Chicago">Central Time</MenuItem>
                    <MenuItem value="America/Denver">Mountain Time</MenuItem>
                    <MenuItem value="America/Los_Angeles">Pacific Time</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Currency</InputLabel>
                  <Select
                    value={settingsData.currency}
                    label="Currency"
                    onChange={(e) => setSettingsData({ ...settingsData, currency: e.target.value })}
                  >
                    <MenuItem value="USD">USD - US Dollar</MenuItem>
                    <MenuItem value="CAD">CAD - Canadian Dollar</MenuItem>
                    <MenuItem value="EUR">EUR - Euro</MenuItem>
                    <MenuItem value="GBP">GBP - British Pound</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Date Format</InputLabel>
                  <Select
                    value={settingsData.dateFormat}
                    label="Date Format"
                    onChange={(e) => setSettingsData({ ...settingsData, dateFormat: e.target.value })}
                  >
                    <MenuItem value="MM/DD/YYYY">MM/DD/YYYY</MenuItem>
                    <MenuItem value="DD/MM/YYYY">DD/MM/YYYY</MenuItem>
                    <MenuItem value="YYYY-MM-DD">YYYY-MM-DD</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Time Format</InputLabel>
                  <Select
                    value={settingsData.timeFormat}
                    label="Time Format"
                    onChange={(e) => setSettingsData({ ...settingsData, timeFormat: e.target.value as '12h' | '24h' })}
                  >
                    <MenuItem value="12h">12 Hour</MenuItem>
                    <MenuItem value="24h">24 Hour</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Numbering Settings
                </Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  label="Invoice Prefix"
                  value={settingsData.invoicePrefix}
                  onChange={(e) => setSettingsData({ ...settingsData, invoicePrefix: e.target.value })}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  label="Quote Prefix"
                  value={settingsData.quotePrefix}
                  onChange={(e) => setSettingsData({ ...settingsData, quotePrefix: e.target.value })}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  label="Job Prefix"
                  value={settingsData.jobPrefix}
                  onChange={(e) => setSettingsData({ ...settingsData, jobPrefix: e.target.value })}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Tax Settings
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Tax Rate (%)"
                  type="number"
                  value={settingsData.taxRate}
                  onChange={(e) => setSettingsData({ ...settingsData, taxRate: parseFloat(e.target.value) })}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Tax Label"
                  value={settingsData.taxLabel}
                  onChange={(e) => setSettingsData({ ...settingsData, taxLabel: e.target.value })}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12}>
                <Button variant="contained" onClick={handleSaveSettings}>
                  Save Settings
                </Button>
              </Grid>
            </Grid>
          </TabPanel>

          {/* Billing Tab */}
          <TabPanel value={tab} index={2}>
            <Typography variant="h6" gutterBottom>
              Subscription & Billing
            </Typography>
            <Box sx={{ mt: 3 }}>
              {account?.subscription && (
                <Card sx={{ p: 3, bgcolor: 'grey.50' }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Current Plan
                      </Typography>
                      <Typography variant="h6" sx={{ textTransform: 'capitalize' }}>
                        {account.subscription.plan}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Status
                      </Typography>
                      <Typography variant="h6" sx={{ textTransform: 'capitalize' }}>
                        {account.subscription.status}
                      </Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Current Period Ends
                      </Typography>
                      <Typography variant="body1">
                        {new Date(account.subscription.currentPeriodEnd).toLocaleDateString()}
                      </Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Button variant="outlined">Upgrade Plan</Button>
                    </Grid>
                  </Grid>
                </Card>
              )}
            </Box>
          </TabPanel>
        </Box>
      </Card>
    </Box>
  );
};
