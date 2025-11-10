export const APP_NAME = 'Jobber Clone';
export const APP_VERSION = '1.0.0';

export const USER_ROLES = {
  OWNER: 'owner',
  ADMIN: 'admin',
  MANAGER: 'manager',
  DISPATCHER: 'dispatcher',
  TECHNICIAN: 'technician',
  READONLY: 'readonly',
} as const;

export const JOB_STATUS = {
  DRAFT: 'draft',
  SCHEDULED: 'scheduled',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

export const QUOTE_STATUS = {
  DRAFT: 'draft',
  SENT: 'sent',
  VIEWED: 'viewed',
  APPROVED: 'approved',
  DECLINED: 'declined',
  EXPIRED: 'expired',
} as const;

export const INVOICE_STATUS = {
  DRAFT: 'draft',
  SENT: 'sent',
  VIEWED: 'viewed',
  PARTIAL: 'partial',
  PAID: 'paid',
  OVERDUE: 'overdue',
  VOID: 'void',
} as const;

export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  REFUNDED: 'refunded',
} as const;

export const TIME_ENTRY_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
} as const;

export const STATUS_COLORS = {
  draft: '#6B7280',
  scheduled: '#2563EB',
  in_progress: '#F59E0B',
  completed: '#10B981',
  cancelled: '#EF4444',
  sent: '#3B82F6',
  viewed: '#8B5CF6',
  approved: '#10B981',
  declined: '#EF4444',
  expired: '#9CA3AF',
  partial: '#F59E0B',
  paid: '#10B981',
  overdue: '#EF4444',
  void: '#6B7280',
  pending: '#F59E0B',
  processing: '#3B82F6',
  failed: '#EF4444',
  refunded: '#6B7280',
  rejected: '#EF4444',
} as const;

export const DATE_FORMATS = {
  DISPLAY: 'MMM dd, yyyy',
  DISPLAY_WITH_TIME: 'MMM dd, yyyy h:mm a',
  INPUT: 'yyyy-MM-dd',
  INPUT_WITH_TIME: "yyyy-MM-dd'T'HH:mm",
  TIME: 'h:mm a',
} as const;

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 50,
  PAGE_SIZE_OPTIONS: [25, 50, 100],
} as const;

export const LOCAL_STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER: 'user',
  THEME: 'theme',
} as const;

export const QUERY_KEYS = {
  // Auth
  CURRENT_USER: 'current_user',

  // Clients
  CLIENTS: 'clients',
  CLIENT: 'client',
  CLIENT_CONTACTS: 'client_contacts',
  CLIENT_ADDRESSES: 'client_addresses',
  CLIENT_HISTORY: 'client_history',

  // Quotes
  QUOTES: 'quotes',
  QUOTE: 'quote',

  // Jobs
  JOBS: 'jobs',
  JOB: 'job',
  JOB_PHOTOS: 'job_photos',

  // Invoices
  INVOICES: 'invoices',
  INVOICE: 'invoice',

  // Payments
  PAYMENTS: 'payments',
  PAYMENT: 'payment',
  PAYMENT_METHODS: 'payment_methods',

  // Time Tracking
  TIME_ENTRIES: 'time_entries',
  TIME_SHEETS: 'timesheets',

  // Schedule
  SCHEDULE_EVENTS: 'schedule_events',
  SCHEDULE_AVAILABILITY: 'schedule_availability',

  // Users
  USERS: 'users',
  USER: 'user',

  // Communications
  COMMUNICATIONS_HISTORY: 'communications_history',
  COMMUNICATIONS_TEMPLATES: 'communications_templates',

  // Files
  FILES: 'files',
  FILE: 'file',

  // Reports
  DASHBOARD_STATS: 'dashboard_stats',
  REVENUE_REPORT: 'revenue_report',
  JOBS_REPORT: 'jobs_report',
  CLIENTS_REPORT: 'clients_report',

  // Audit Logs
  AUDIT_LOGS: 'audit_logs',

  // Account
  ACCOUNT: 'account',
} as const;
