export { clientsApi } from './clients.api';
export { quotesApi } from './quotes.api';
export { jobsApi } from './jobs.api';
export { invoicesApi } from './invoices.api';
export { default as axiosInstance } from './axiosInstance';

// Export additional APIs
import axiosInstance from './axiosInstance';
import { API_ENDPOINTS } from '../../config/api';
import type {
  Payment,
  TimeEntry,
  User,
  Message,
  FileMetadata,
  ScheduleEvent,
  DashboardStats,
  AuditLog,
  Account,
  PaginatedResponse,
  PaginationParams,
} from '../../types';

// Payments API
export const paymentsApi = {
  getAll: async (params?: PaginationParams): Promise<PaginatedResponse<Payment>> => {
    const response = await axiosInstance.get(API_ENDPOINTS.PAYMENTS, { params });
    return response.data;
  },

  getById: async (id: string): Promise<Payment> => {
    const response = await axiosInstance.get(`${API_ENDPOINTS.PAYMENTS}/${id}`);
    return response.data.data || response.data;
  },

  createIntent: async (data: { amount: number; invoiceId: string }): Promise<any> => {
    const response = await axiosInstance.post(API_ENDPOINTS.PAYMENT_INTENT, data);
    return response.data.data || response.data;
  },

  refund: async (id: string, amount?: number): Promise<Payment> => {
    const response = await axiosInstance.post(API_ENDPOINTS.PAYMENT_REFUND(id), { amount });
    return response.data.data || response.data;
  },
};

// Time Tracking API
export const timeTrackingApi = {
  getAll: async (params?: PaginationParams & { userId?: string; date?: string }): Promise<PaginatedResponse<TimeEntry>> => {
    const response = await axiosInstance.get(API_ENDPOINTS.TIME_ENTRIES, { params });
    return response.data;
  },

  getById: async (id: string): Promise<TimeEntry> => {
    const response = await axiosInstance.get(`${API_ENDPOINTS.TIME_ENTRIES}/${id}`);
    return response.data.data || response.data;
  },

  clockIn: async (data: { jobId?: string; notes?: string; gpsLocation?: any }): Promise<TimeEntry> => {
    const response = await axiosInstance.post(API_ENDPOINTS.TIME_ENTRY_CLOCK_IN, data);
    return response.data.data || response.data;
  },

  clockOut: async (id: string, data?: { notes?: string }): Promise<TimeEntry> => {
    const response = await axiosInstance.post(API_ENDPOINTS.TIME_ENTRY_CLOCK_OUT(id), data);
    return response.data.data || response.data;
  },

  approve: async (id: string): Promise<TimeEntry> => {
    const response = await axiosInstance.post(API_ENDPOINTS.TIME_ENTRY_APPROVE(id));
    return response.data.data || response.data;
  },

  getTimesheets: async (params?: { startDate?: string; endDate?: string; userId?: string }): Promise<any> => {
    const response = await axiosInstance.get(API_ENDPOINTS.TIME_SHEETS, { params });
    return response.data.data || response.data;
  },
};

// Users API
export const usersApi = {
  getAll: async (params?: PaginationParams): Promise<PaginatedResponse<User>> => {
    const response = await axiosInstance.get(API_ENDPOINTS.USERS, { params });
    return response.data;
  },

  getById: async (id: string): Promise<User> => {
    const response = await axiosInstance.get(`${API_ENDPOINTS.USERS}/${id}`);
    return response.data.data || response.data;
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await axiosInstance.get(API_ENDPOINTS.USER_ME);
    return response.data.data || response.data;
  },

  create: async (data: Partial<User> & { password: string }): Promise<User> => {
    const response = await axiosInstance.post(API_ENDPOINTS.USERS, data);
    return response.data.data || response.data;
  },

  update: async (id: string, data: Partial<User>): Promise<User> => {
    const response = await axiosInstance.patch(`${API_ENDPOINTS.USERS}/${id}`, data);
    return response.data.data || response.data;
  },

  delete: async (id: string): Promise<void> => {
    await axiosInstance.delete(`${API_ENDPOINTS.USERS}/${id}`);
  },
};

// Communications API
export const communicationsApi = {
  sendEmail: async (data: { to: string; subject: string; body: string; clientId?: string }): Promise<Message> => {
    const response = await axiosInstance.post(API_ENDPOINTS.COMMUNICATIONS_SEND_EMAIL, data);
    return response.data.data || response.data;
  },

  sendSMS: async (data: { to: string; body: string; clientId?: string }): Promise<Message> => {
    const response = await axiosInstance.post(API_ENDPOINTS.COMMUNICATIONS_SEND_SMS, data);
    return response.data.data || response.data;
  },

  getHistory: async (params?: PaginationParams & { clientId?: string; type?: string }): Promise<PaginatedResponse<Message>> => {
    const response = await axiosInstance.get(API_ENDPOINTS.COMMUNICATIONS_HISTORY, { params });
    return response.data;
  },

  getTemplates: async (): Promise<any[]> => {
    const response = await axiosInstance.get(API_ENDPOINTS.COMMUNICATIONS_TEMPLATES);
    return response.data.data || response.data;
  },
};

// Files API
export const filesApi = {
  upload: async (file: File, data?: { entityType?: string; entityId?: string }): Promise<FileMetadata> => {
    const formData = new FormData();
    formData.append('file', file);
    if (data?.entityType) formData.append('entityType', data.entityType);
    if (data?.entityId) formData.append('entityId', data.entityId);

    const response = await axiosInstance.post(API_ENDPOINTS.FILE_UPLOAD, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data || response.data;
  },

  getAll: async (params?: PaginationParams & { entityType?: string; entityId?: string }): Promise<PaginatedResponse<FileMetadata>> => {
    const response = await axiosInstance.get(API_ENDPOINTS.FILES, { params });
    return response.data;
  },

  download: async (id: string): Promise<string> => {
    const response = await axiosInstance.get(API_ENDPOINTS.FILE_DOWNLOAD(id));
    return response.data.data?.url || response.data.url;
  },

  delete: async (id: string): Promise<void> => {
    await axiosInstance.delete(`${API_ENDPOINTS.FILES}/${id}`);
  },
};

// Schedule API
export const scheduleApi = {
  getEvents: async (params?: { start?: string; end?: string; userId?: string }): Promise<ScheduleEvent[]> => {
    const response = await axiosInstance.get(API_ENDPOINTS.SCHEDULE_EVENTS, { params });
    return response.data.data || response.data;
  },

  getAvailability: async (params?: { date?: string; userId?: string }): Promise<any> => {
    const response = await axiosInstance.get(API_ENDPOINTS.SCHEDULE_AVAILABILITY, { params });
    return response.data.data || response.data;
  },
};

// Reports API
export const reportsApi = {
  getDashboard: async (): Promise<DashboardStats> => {
    const response = await axiosInstance.get(API_ENDPOINTS.REPORTS_DASHBOARD);
    return response.data.data || response.data;
  },

  getRevenue: async (params?: { startDate?: string; endDate?: string; groupBy?: string }): Promise<any> => {
    const response = await axiosInstance.get(API_ENDPOINTS.REPORTS_REVENUE, { params });
    return response.data.data || response.data;
  },

  getJobs: async (params?: { startDate?: string; endDate?: string }): Promise<any> => {
    const response = await axiosInstance.get(API_ENDPOINTS.REPORTS_JOBS, { params });
    return response.data.data || response.data;
  },

  getClients: async (params?: { startDate?: string; endDate?: string }): Promise<any> => {
    const response = await axiosInstance.get(API_ENDPOINTS.REPORTS_CLIENTS, { params });
    return response.data.data || response.data;
  },
};

// Audit Logs API
export const auditLogsApi = {
  getAll: async (params?: PaginationParams & { entityType?: string; entityId?: string; userId?: string }): Promise<PaginatedResponse<AuditLog>> => {
    const response = await axiosInstance.get(API_ENDPOINTS.AUDIT_LOGS, { params });
    return response.data;
  },
};

// Account API
export const accountApi = {
  get: async (): Promise<Account> => {
    const response = await axiosInstance.get(API_ENDPOINTS.ACCOUNTS);
    return response.data.data || response.data;
  },

  update: async (data: Partial<Account>): Promise<Account> => {
    const response = await axiosInstance.patch(API_ENDPOINTS.ACCOUNTS, data);
    return response.data.data || response.data;
  },

  updateSubscription: async (data: { plan: string }): Promise<any> => {
    const response = await axiosInstance.post(API_ENDPOINTS.ACCOUNT_SUBSCRIPTION, data);
    return response.data.data || response.data;
  },
};
