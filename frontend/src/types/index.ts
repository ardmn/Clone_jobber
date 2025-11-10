// Common types
export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

// User & Auth types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: 'owner' | 'admin' | 'manager' | 'dispatcher' | 'technician' | 'readonly';
  status: 'active' | 'inactive';
  accountId: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  companyName: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: User;
}

// Account types
export interface Account {
  id: string;
  name: string;
  industry?: string;
  phone?: string;
  email?: string;
  website?: string;
  logo?: string;
  address?: Address;
  subscription?: Subscription;
  settings?: AccountSettings;
  createdAt: string;
  updatedAt: string;
}

export interface Subscription {
  plan: 'core' | 'connect' | 'grow' | 'enterprise';
  status: 'active' | 'cancelled' | 'past_due' | 'trialing';
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
}

export interface AccountSettings {
  timezone: string;
  currency: string;
  dateFormat: string;
  timeFormat: '12h' | '24h';
  taxRate?: number;
  taxLabel?: string;
  invoicePrefix?: string;
  quotePrefix?: string;
  jobPrefix?: string;
}

// Client types
export interface Client {
  id: string;
  firstName: string;
  lastName: string;
  companyName?: string;
  email?: string;
  phone?: string;
  status: 'active' | 'inactive';
  tags?: string[];
  notes?: string;
  accountId: string;
  addresses?: ClientAddress[];
  contacts?: ClientContact[];
  createdAt: string;
  updatedAt: string;
}

export interface ClientContact {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  role?: string;
  isPrimary: boolean;
  clientId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ClientAddress {
  id: string;
  type: 'billing' | 'service' | 'other';
  street1: string;
  street2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isPrimary: boolean;
  clientId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Address {
  street1: string;
  street2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

// Quote types
export interface Quote {
  id: string;
  quoteNumber: string;
  title: string;
  clientId: string;
  client?: Client;
  status: 'draft' | 'sent' | 'viewed' | 'approved' | 'declined' | 'expired';
  lineItems: QuoteLineItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  notes?: string;
  terms?: string;
  expiryDate?: string;
  sentAt?: string;
  viewedAt?: string;
  approvedAt?: string;
  declinedAt?: string;
  accountId: string;
  createdById: string;
  createdBy?: User;
  createdAt: string;
  updatedAt: string;
}

export interface QuoteLineItem {
  id: string;
  name: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  total: number;
  quoteId: string;
  createdAt: string;
  updatedAt: string;
}

// Job types
export interface Job {
  id: string;
  jobNumber: string;
  title: string;
  description?: string;
  clientId: string;
  client?: Client;
  quoteId?: string;
  quote?: Quote;
  status: 'draft' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  scheduledStart?: string;
  scheduledEnd?: string;
  actualStart?: string;
  actualEnd?: string;
  assignedTo: string[];
  assignedUsers?: User[];
  address?: Address;
  notes?: string;
  completionNotes?: string;
  signature?: string;
  photos?: JobPhoto[];
  accountId: string;
  createdById: string;
  createdBy?: User;
  createdAt: string;
  updatedAt: string;
}

export interface JobPhoto {
  id: string;
  url: string;
  caption?: string;
  type: 'before' | 'after' | 'other';
  jobId: string;
  uploadedById: string;
  uploadedBy?: User;
  createdAt: string;
}

// Invoice types
export interface Invoice {
  id: string;
  invoiceNumber: string;
  clientId: string;
  client?: Client;
  jobId?: string;
  job?: Job;
  status: 'draft' | 'sent' | 'viewed' | 'partial' | 'paid' | 'overdue' | 'void';
  lineItems: InvoiceLineItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  balance: number;
  issueDate: string;
  dueDate: string;
  notes?: string;
  terms?: string;
  sentAt?: string;
  viewedAt?: string;
  paidAt?: string;
  accountId: string;
  createdById: string;
  createdBy?: User;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceLineItem {
  id: string;
  name: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  total: number;
  invoiceId: string;
  createdAt: string;
  updatedAt: string;
}

// Payment types
export interface Payment {
  id: string;
  amount: number;
  method: 'card' | 'bank_transfer' | 'cash' | 'check' | 'other';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
  invoiceId: string;
  invoice?: Invoice;
  clientId: string;
  client?: Client;
  stripePaymentIntentId?: string;
  cardLast4?: string;
  cardBrand?: string;
  notes?: string;
  processedAt?: string;
  accountId: string;
  createdById: string;
  createdBy?: User;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentIntent {
  clientSecret: string;
  amount: number;
  currency: string;
}

// Time Tracking types
export interface TimeEntry {
  id: string;
  userId: string;
  user?: User;
  jobId?: string;
  job?: Job;
  clockIn: string;
  clockOut?: string;
  totalMinutes?: number;
  breakMinutes?: number;
  notes?: string;
  status: 'pending' | 'approved' | 'rejected';
  approvedById?: string;
  approvedBy?: User;
  approvedAt?: string;
  gpsLocation?: {
    latitude: number;
    longitude: number;
  };
  accountId: string;
  createdAt: string;
  updatedAt: string;
}

// Communication types
export interface Message {
  id: string;
  type: 'email' | 'sms';
  to: string;
  from?: string;
  subject?: string;
  body: string;
  status: 'pending' | 'sent' | 'delivered' | 'failed';
  clientId?: string;
  client?: Client;
  sentAt?: string;
  deliveredAt?: string;
  accountId: string;
  createdById: string;
  createdBy?: User;
  createdAt: string;
  updatedAt: string;
}

export interface MessageTemplate {
  id: string;
  name: string;
  type: 'email' | 'sms';
  subject?: string;
  body: string;
  variables: string[];
  accountId: string;
  createdAt: string;
  updatedAt: string;
}

// File types
export interface FileMetadata {
  id: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  url: string;
  entityType: 'client' | 'job' | 'invoice' | 'other';
  entityId?: string;
  uploadedById: string;
  uploadedBy?: User;
  accountId: string;
  createdAt: string;
  updatedAt: string;
}

// Schedule types
export interface ScheduleEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  allDay: boolean;
  type: 'job' | 'time_off' | 'other';
  jobId?: string;
  job?: Job;
  userId?: string;
  user?: User;
  backgroundColor?: string;
  notes?: string;
  accountId: string;
  createdAt: string;
  updatedAt: string;
}

// Report types
export interface DashboardStats {
  revenue: {
    today: number;
    week: number;
    month: number;
    year: number;
  };
  jobs: {
    scheduled: number;
    inProgress: number;
    completed: number;
    total: number;
  };
  invoices: {
    outstanding: number;
    overdue: number;
    paid: number;
    total: number;
  };
  clients: {
    active: number;
    total: number;
  };
}

export interface RevenueData {
  date: string;
  amount: number;
  invoiceCount: number;
}

export interface JobReportData {
  status: string;
  count: number;
  percentage: number;
}

// Audit Log types
export interface AuditLog {
  id: string;
  entityType: string;
  entityId: string;
  action: 'create' | 'update' | 'delete';
  changes: Record<string, any>;
  userId: string;
  user?: User;
  ipAddress?: string;
  userAgent?: string;
  accountId: string;
  createdAt: string;
}

// Form types
export interface ClientFormData {
  firstName: string;
  lastName: string;
  companyName?: string;
  email?: string;
  phone?: string;
  status: 'active' | 'inactive';
  tags?: string[];
  notes?: string;
  addresses?: Omit<ClientAddress, 'id' | 'clientId' | 'createdAt' | 'updatedAt'>[];
  contacts?: Omit<ClientContact, 'id' | 'clientId' | 'createdAt' | 'updatedAt'>[];
}

export interface QuoteFormData {
  clientId: string;
  title: string;
  lineItems: Omit<QuoteLineItem, 'id' | 'quoteId' | 'createdAt' | 'updatedAt'>[];
  taxRate: number;
  notes?: string;
  terms?: string;
  expiryDate?: string;
}

export interface JobFormData {
  clientId: string;
  quoteId?: string;
  title: string;
  description?: string;
  scheduledStart?: string;
  scheduledEnd?: string;
  assignedTo: string[];
  address?: Address;
  notes?: string;
}

export interface InvoiceFormData {
  clientId: string;
  jobId?: string;
  lineItems: Omit<InvoiceLineItem, 'id' | 'invoiceId' | 'createdAt' | 'updatedAt'>[];
  taxRate: number;
  issueDate: string;
  dueDate: string;
  notes?: string;
  terms?: string;
}
