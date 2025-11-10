import { createBrowserRouter, Navigate } from 'react-router-dom';
import { MainLayout } from '../components/layout';
import { ProtectedRoute } from './ProtectedRoute';
import { LoginPage } from '../features/auth/LoginPage';
import { RegisterPage } from '../features/auth/RegisterPage';
import { DashboardPage } from '../features/dashboard/DashboardPage';
import { ClientsListPage } from '../features/clients/ClientsListPage';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/register',
    element: <RegisterPage />,
  },
  {
    path: '/',
    element: <ProtectedRoute />,
    children: [
      {
        element: <MainLayout />,
        children: [
          {
            index: true,
            element: <Navigate to="/dashboard" replace />,
          },
          {
            path: 'dashboard',
            element: <DashboardPage />,
          },
          {
            path: 'clients',
            element: <ClientsListPage />,
          },
          {
            path: 'quotes',
            element: <div>Quotes Page - Coming Soon</div>,
          },
          {
            path: 'jobs',
            element: <div>Jobs Page - Coming Soon</div>,
          },
          {
            path: 'invoices',
            element: <div>Invoices Page - Coming Soon</div>,
          },
          {
            path: 'payments',
            element: <div>Payments Page - Coming Soon</div>,
          },
          {
            path: 'schedule',
            element: <div>Schedule Page - Coming Soon</div>,
          },
          {
            path: 'time-tracking',
            element: <div>Time Tracking Page - Coming Soon</div>,
          },
          {
            path: 'team',
            element: <div>Team Page - Coming Soon</div>,
          },
          {
            path: 'communications',
            element: <div>Communications Page - Coming Soon</div>,
          },
          {
            path: 'files',
            element: <div>Files Page - Coming Soon</div>,
          },
          {
            path: 'reports',
            element: <div>Reports Page - Coming Soon</div>,
          },
          {
            path: 'settings',
            element: <div>Settings Page - Coming Soon</div>,
          },
        ],
      },
    ],
  },
]);
