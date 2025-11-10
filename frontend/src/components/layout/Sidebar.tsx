import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Box,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Description as DescriptionIcon,
  Work as WorkIcon,
  Receipt as ReceiptIcon,
  Payment as PaymentIcon,
  Schedule as ScheduleIcon,
  AccessTime as AccessTimeIcon,
  Group as GroupIcon,
  Email as EmailIcon,
  Folder as FolderIcon,
  Assessment as AssessmentIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUIStore } from '../../store/useUIStore';

const DRAWER_WIDTH = 240;

const menuItems = [
  { label: 'Dashboard', icon: DashboardIcon, path: '/dashboard' },
  { label: 'Clients', icon: PeopleIcon, path: '/clients' },
  { label: 'Quotes', icon: DescriptionIcon, path: '/quotes' },
  { label: 'Jobs', icon: WorkIcon, path: '/jobs' },
  { label: 'Invoices', icon: ReceiptIcon, path: '/invoices' },
  { label: 'Payments', icon: PaymentIcon, path: '/payments' },
  { label: 'Schedule', icon: ScheduleIcon, path: '/schedule' },
  { label: 'Time Tracking', icon: AccessTimeIcon, path: '/time-tracking' },
  { label: 'Team', icon: GroupIcon, path: '/team' },
  { label: 'Communications', icon: EmailIcon, path: '/communications' },
  { label: 'Files', icon: FolderIcon, path: '/files' },
  { label: 'Reports', icon: AssessmentIcon, path: '/reports' },
  { label: 'Settings', icon: SettingsIcon, path: '/settings' },
];

export const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { sidebarOpen } = useUIStore();

  const isActive = (path: string) => {
    return location.pathname.startsWith(path);
  };

  return (
    <Drawer
      variant="persistent"
      open={sidebarOpen}
      sx={{
        width: DRAWER_WIDTH,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: DRAWER_WIDTH,
          boxSizing: 'border-box',
        },
      }}
    >
      <Toolbar />
      <Box sx={{ overflow: 'auto' }}>
        <List>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);

            return (
              <ListItem key={item.path} disablePadding>
                <ListItemButton
                  onClick={() => navigate(item.path)}
                  selected={active}
                  sx={{
                    '&.Mui-selected': {
                      backgroundColor: 'primary.light',
                      color: 'primary.contrastText',
                      '&:hover': {
                        backgroundColor: 'primary.main',
                      },
                      '& .MuiListItemIcon-root': {
                        color: 'primary.contrastText',
                      },
                    },
                  }}
                >
                  <ListItemIcon>
                    <Icon color={active ? 'inherit' : 'action'} />
                  </ListItemIcon>
                  <ListItemText primary={item.label} />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </Box>
    </Drawer>
  );
};
