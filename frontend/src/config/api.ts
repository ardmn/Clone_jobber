export const API_CONFIG = {
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
};

export const API_ENDPOINTS = {
  // Auth
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  LOGOUT: '/auth/logout',
  REFRESH_TOKEN: '/auth/refresh',
  FORGOT_PASSWORD: '/auth/forgot-password',
  RESET_PASSWORD: '/auth/reset-password',
  VERIFY_EMAIL: '/auth/verify-email',

  // Accounts
  ACCOUNTS: '/accounts',
  ACCOUNT_SUBSCRIPTION: '/accounts/subscription',

  // Users
  USERS: '/users',
  USER_ME: '/users/me',

  // Clients
  CLIENTS: '/clients',
  CLIENT_CONTACTS: (clientId: string) => `/clients/${clientId}/contacts`,
  CLIENT_ADDRESSES: (clientId: string) => `/clients/${clientId}/addresses`,
  CLIENT_HISTORY: (clientId: string) => `/clients/${clientId}/history`,

  // Quotes
  QUOTES: '/quotes',
  QUOTE_SEND: (id: string) => `/quotes/${id}/send`,
  QUOTE_APPROVE: (id: string) => `/quotes/${id}/approve`,
  QUOTE_CONVERT: (id: string) => `/quotes/${id}/convert-to-job`,
  QUOTE_LINE_ITEMS: (id: string) => `/quotes/${id}/line-items`,

  // Jobs
  JOBS: '/jobs',
  JOB_START: (id: string) => `/jobs/${id}/start`,
  JOB_COMPLETE: (id: string) => `/jobs/${id}/complete`,
  JOB_CANCEL: (id: string) => `/jobs/${id}/cancel`,
  JOB_PHOTOS: (id: string) => `/jobs/${id}/photos`,

  // Invoices
  INVOICES: '/invoices',
  INVOICE_SEND: (id: string) => `/invoices/${id}/send`,
  INVOICE_RECORD_PAYMENT: (id: string) => `/invoices/${id}/record-payment`,
  INVOICE_LINE_ITEMS: (id: string) => `/invoices/${id}/line-items`,

  // Payments
  PAYMENTS: '/payments',
  PAYMENT_INTENT: '/payments/create-intent',
  PAYMENT_REFUND: (id: string) => `/payments/${id}/refund`,
  PAYMENT_METHODS: '/payments/methods',

  // Time Tracking
  TIME_ENTRIES: '/time-tracking',
  TIME_ENTRY_CLOCK_IN: '/time-tracking/clock-in',
  TIME_ENTRY_CLOCK_OUT: (id: string) => `/time-tracking/${id}/clock-out`,
  TIME_ENTRY_APPROVE: (id: string) => `/time-tracking/${id}/approve`,
  TIME_SHEETS: '/time-tracking/timesheets',

  // Schedule
  SCHEDULE_EVENTS: '/schedule/events',
  SCHEDULE_AVAILABILITY: '/schedule/availability',

  // Communications
  COMMUNICATIONS_SEND_EMAIL: '/communications/send-email',
  COMMUNICATIONS_SEND_SMS: '/communications/send-sms',
  COMMUNICATIONS_SEND_BULK: '/communications/send-bulk',
  COMMUNICATIONS_TEMPLATES: '/communications/templates',
  COMMUNICATIONS_HISTORY: '/communications/history',

  // Files
  FILES: '/files',
  FILE_UPLOAD: '/files/upload',
  FILE_DOWNLOAD: (id: string) => `/files/${id}/download`,

  // Reports
  REPORTS_DASHBOARD: '/reports/dashboard',
  REPORTS_REVENUE: '/reports/revenue',
  REPORTS_JOBS: '/reports/jobs',
  REPORTS_CLIENTS: '/reports/clients',

  // Audit Logs
  AUDIT_LOGS: '/audit-logs',
};
