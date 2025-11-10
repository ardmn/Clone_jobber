# Database Schema

## Document Information
- **Version:** 1.0
- **Last Updated:** 2025-11-09
- **Status:** Complete

---

## 1. Entity Relationship Overview

```
Users/Accounts
    ├── Accounts (Multi-tenant)
    ├── Users (Team members)
    └── Permissions

Clients
    ├── Clients
    ├── ClientContacts
    └── ClientAddresses

Sales
    ├── Quotes
    ├── QuoteLineItems
    └── QuoteTemplates

Operations
    ├── Jobs
    ├── JobTasks
    ├── JobForms
    ├── JobPhotos
    └── Schedules

Financials
    ├── Invoices
    ├── InvoiceLineItems
    ├── Payments
    └── Refunds

Time Tracking
    ├── TimeEntries
    └── Timesheets

Communications
    ├── Messages
    ├── MessageTemplates
    └── EmailLogs/SMSLogs

Marketing
    ├── Campaigns
    ├── Automations
    └── Reviews

Integrations
    └── IntegrationSyncs
```

---

## 2. Core Tables

### 2.1 Accounts

```sql
CREATE TABLE accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    company_name VARCHAR(255),
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(50),

    -- Subscription
    subscription_plan VARCHAR(50) NOT NULL DEFAULT 'core',
    subscription_status VARCHAR(50) NOT NULL DEFAULT 'trial',
    subscription_start_date TIMESTAMP,
    subscription_end_date TIMESTAMP,

    -- Settings
    timezone VARCHAR(100) DEFAULT 'UTC',
    currency VARCHAR(3) DEFAULT 'USD',
    date_format VARCHAR(20) DEFAULT 'MM/DD/YYYY',

    -- Metadata
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP,

    CONSTRAINT chk_subscription_plan CHECK (subscription_plan IN ('core', 'connect', 'grow', 'plus'))
);

CREATE INDEX idx_accounts_email ON accounts(email);
CREATE INDEX idx_accounts_deleted_at ON accounts(deleted_at) WHERE deleted_at IS NULL;
```

### 2.2 Users

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,

    -- Identity
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(50),
    avatar_url TEXT,

    -- Role & Permissions
    role VARCHAR(50) NOT NULL DEFAULT 'worker',
    permissions JSONB DEFAULT '[]'::jsonb,

    -- Status
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    last_login_at TIMESTAMP,

    -- Settings
    notification_preferences JSONB DEFAULT '{}'::jsonb,

    -- Metadata
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP,

    CONSTRAINT chk_role CHECK (role IN ('owner', 'admin', 'manager', 'dispatcher', 'worker', 'limited_worker')),
    CONSTRAINT uk_users_account_email UNIQUE (account_id, email)
);

CREATE INDEX idx_users_account_id ON users(account_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_deleted_at ON users(deleted_at) WHERE deleted_at IS NULL;
```

### 2.3 Clients

```sql
CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,

    -- Basic Info
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    company_name VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),

    -- Classification
    tags VARCHAR(100)[],
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    client_type VARCHAR(50) DEFAULT 'residential',

    -- Financial
    currency VARCHAR(3) DEFAULT 'USD',
    payment_terms INT DEFAULT 30,
    credit_limit DECIMAL(12, 2),

    -- Custom Fields
    custom_fields JSONB DEFAULT '{}'::jsonb,

    -- Notes
    internal_notes TEXT,

    -- Metadata
    source VARCHAR(100),
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP,

    CONSTRAINT chk_status CHECK (status IN ('active', 'inactive', 'archived')),
    CONSTRAINT chk_client_type CHECK (client_type IN ('residential', 'commercial'))
);

CREATE INDEX idx_clients_account_id ON clients(account_id);
CREATE INDEX idx_clients_email ON clients(email);
CREATE INDEX idx_clients_phone ON clients(phone);
CREATE INDEX idx_clients_tags ON clients USING GIN(tags);
CREATE INDEX idx_clients_deleted_at ON clients(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_clients_search ON clients USING GIN(
    to_tsvector('english', coalesce(first_name, '') || ' ' || coalesce(last_name, '') || ' ' || coalesce(company_name, ''))
);
```

### 2.4 Client Contacts

```sql
CREATE TABLE client_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,

    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    role VARCHAR(100),
    is_primary BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_client_contacts_client_id ON client_contacts(client_id);
```

### 2.5 Client Addresses

```sql
CREATE TABLE client_addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,

    address_type VARCHAR(50) NOT NULL DEFAULT 'service',
    label VARCHAR(100),

    street1 VARCHAR(255) NOT NULL,
    street2 VARCHAR(255),
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100),
    postal_code VARCHAR(20) NOT NULL,
    country VARCHAR(2) DEFAULT 'US',

    -- Geocoding
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),

    is_primary BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_address_type CHECK (address_type IN ('billing', 'service', 'both'))
);

CREATE INDEX idx_client_addresses_client_id ON client_addresses(client_id);
CREATE INDEX idx_client_addresses_location ON client_addresses(latitude, longitude);
```

---

## 3. Quote Tables

### 3.1 Quotes

```sql
CREATE TABLE quotes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES clients(id),
    address_id UUID REFERENCES client_addresses(id),

    -- Quote Details
    quote_number VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,

    -- Status
    status VARCHAR(50) NOT NULL DEFAULT 'draft',

    -- Financial
    subtotal DECIMAL(12, 2) NOT NULL DEFAULT 0,
    tax_rate DECIMAL(5, 4) DEFAULT 0,
    tax_amount DECIMAL(12, 2) DEFAULT 0,
    discount_amount DECIMAL(12, 2) DEFAULT 0,
    total DECIMAL(12, 2) NOT NULL DEFAULT 0,

    -- Deposit
    deposit_required BOOLEAN DEFAULT FALSE,
    deposit_amount DECIMAL(12, 2),

    -- Dates
    quote_date DATE NOT NULL DEFAULT CURRENT_DATE,
    expiry_date DATE,

    -- Content
    introduction TEXT,
    terms_and_conditions TEXT,
    notes TEXT,

    -- Client Actions
    viewed_at TIMESTAMP,
    approved_at TIMESTAMP,
    declined_at TIMESTAMP,
    decline_reason TEXT,
    signature_data TEXT,
    signature_ip VARCHAR(45),

    -- Conversion
    converted_to_job_id UUID,

    -- Metadata
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP,

    CONSTRAINT chk_status CHECK (status IN ('draft', 'sent', 'viewed', 'approved', 'declined', 'expired')),
    CONSTRAINT uk_quotes_account_number UNIQUE (account_id, quote_number)
);

CREATE INDEX idx_quotes_account_id ON quotes(account_id);
CREATE INDEX idx_quotes_client_id ON quotes(client_id);
CREATE INDEX idx_quotes_status ON quotes(status);
CREATE INDEX idx_quotes_date ON quotes(quote_date DESC);
CREATE INDEX idx_quotes_deleted_at ON quotes(deleted_at) WHERE deleted_at IS NULL;
```

### 3.2 Quote Line Items

```sql
CREATE TABLE quote_line_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quote_id UUID NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,

    sort_order INT NOT NULL DEFAULT 0,

    item_type VARCHAR(50) NOT NULL DEFAULT 'service',
    name VARCHAR(255) NOT NULL,
    description TEXT,

    quantity DECIMAL(10, 2) NOT NULL DEFAULT 1,
    unit_price DECIMAL(12, 2) NOT NULL,
    total_price DECIMAL(12, 2) NOT NULL,

    is_taxable BOOLEAN DEFAULT TRUE,
    is_optional BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_item_type CHECK (item_type IN ('service', 'product', 'labor', 'material'))
);

CREATE INDEX idx_quote_line_items_quote_id ON quote_line_items(quote_id);
```

---

## 4. Job Tables

### 4.1 Jobs

```sql
CREATE TABLE jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES clients(id),
    address_id UUID REFERENCES client_addresses(id),
    quote_id UUID REFERENCES quotes(id),

    -- Job Details
    job_number VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,

    -- Status
    status VARCHAR(50) NOT NULL DEFAULT 'scheduled',
    priority VARCHAR(20) DEFAULT 'normal',

    -- Scheduling
    scheduled_start TIMESTAMP,
    scheduled_end TIMESTAMP,
    estimated_duration INT,

    -- Completion
    actual_start TIMESTAMP,
    actual_end TIMESTAMP,
    completion_notes TEXT,
    client_signature TEXT,

    -- Assignment
    assigned_to UUID[] DEFAULT '{}',

    -- Financial
    estimated_value DECIMAL(12, 2),
    actual_cost DECIMAL(12, 2),

    -- Instructions
    internal_notes TEXT,
    client_instructions TEXT,

    -- Recurrence
    is_recurring BOOLEAN DEFAULT FALSE,
    recurrence_rule TEXT,
    parent_job_id UUID REFERENCES jobs(id),

    -- Metadata
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP,

    CONSTRAINT chk_status CHECK (status IN ('scheduled', 'en_route', 'in_progress', 'on_hold', 'completed', 'cancelled')),
    CONSTRAINT chk_priority CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    CONSTRAINT uk_jobs_account_number UNIQUE (account_id, job_number)
);

CREATE INDEX idx_jobs_account_id ON jobs(account_id);
CREATE INDEX idx_jobs_client_id ON jobs(client_id);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_scheduled ON jobs(scheduled_start, scheduled_end);
CREATE INDEX idx_jobs_assigned_to ON jobs USING GIN(assigned_to);
CREATE INDEX idx_jobs_deleted_at ON jobs(deleted_at) WHERE deleted_at IS NULL;
```

### 4.2 Job Photos

```sql
CREATE TABLE job_photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,

    file_url TEXT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_size INT,
    mime_type VARCHAR(100),

    caption TEXT,
    photo_type VARCHAR(50) DEFAULT 'general',
    sort_order INT DEFAULT 0,

    uploaded_by UUID REFERENCES users(id),
    uploaded_at TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_photo_type CHECK (photo_type IN ('before', 'during', 'after', 'general'))
);

CREATE INDEX idx_job_photos_job_id ON job_photos(job_id);
```

---

## 5. Invoice Tables

### 5.1 Invoices

```sql
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES clients(id),
    job_id UUID REFERENCES jobs(id),
    quote_id UUID REFERENCES quotes(id),

    -- Invoice Details
    invoice_number VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,

    -- Status
    status VARCHAR(50) NOT NULL DEFAULT 'draft',

    -- Financial
    subtotal DECIMAL(12, 2) NOT NULL DEFAULT 0,
    tax_rate DECIMAL(5, 4) DEFAULT 0,
    tax_amount DECIMAL(12, 2) DEFAULT 0,
    discount_amount DECIMAL(12, 2) DEFAULT 0,
    total DECIMAL(12, 2) NOT NULL DEFAULT 0,
    amount_paid DECIMAL(12, 2) DEFAULT 0,
    balance_due DECIMAL(12, 2) NOT NULL DEFAULT 0,

    -- Dates
    invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE NOT NULL,
    paid_date DATE,

    -- Terms
    payment_terms INT DEFAULT 30,
    late_fee_enabled BOOLEAN DEFAULT FALSE,
    late_fee_percentage DECIMAL(5, 2),

    -- Content
    notes TEXT,
    terms_and_conditions TEXT,

    -- Tracking
    sent_at TIMESTAMP,
    viewed_at TIMESTAMP,
    last_reminder_sent_at TIMESTAMP,
    reminder_count INT DEFAULT 0,

    -- Metadata
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP,

    CONSTRAINT chk_status CHECK (status IN ('draft', 'sent', 'viewed', 'partial', 'paid', 'overdue', 'void')),
    CONSTRAINT uk_invoices_account_number UNIQUE (account_id, invoice_number)
);

CREATE INDEX idx_invoices_account_id ON invoices(account_id);
CREATE INDEX idx_invoices_client_id ON invoices(client_id);
CREATE INDEX idx_invoices_job_id ON invoices(job_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_due_date ON invoices(due_date);
CREATE INDEX idx_invoices_deleted_at ON invoices(deleted_at) WHERE deleted_at IS NULL;
```

### 5.2 Invoice Line Items

```sql
CREATE TABLE invoice_line_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,

    sort_order INT NOT NULL DEFAULT 0,

    item_type VARCHAR(50) NOT NULL DEFAULT 'service',
    name VARCHAR(255) NOT NULL,
    description TEXT,

    quantity DECIMAL(10, 2) NOT NULL DEFAULT 1,
    unit_price DECIMAL(12, 2) NOT NULL,
    total_price DECIMAL(12, 2) NOT NULL,

    is_taxable BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_invoice_line_items_invoice_id ON invoice_line_items(invoice_id);
```

---

## 6. Payment Tables

### 6.1 Payments

```sql
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES clients(id),
    invoice_id UUID REFERENCES invoices(id),

    -- Payment Details
    payment_number VARCHAR(50) NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',

    -- Payment Method
    payment_method VARCHAR(50) NOT NULL,
    payment_processor VARCHAR(50),

    -- Status
    status VARCHAR(50) NOT NULL DEFAULT 'pending',

    -- External References
    processor_payment_id VARCHAR(255),
    processor_charge_id VARCHAR(255),

    -- Card Details (last 4 digits only)
    card_last4 VARCHAR(4),
    card_brand VARCHAR(50),

    -- Fees
    processing_fee DECIMAL(12, 2) DEFAULT 0,
    net_amount DECIMAL(12, 2),

    -- Dates
    payment_date TIMESTAMP NOT NULL DEFAULT NOW(),
    settled_date TIMESTAMP,

    -- Notes
    notes TEXT,
    receipt_url TEXT,

    -- Metadata
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_payment_method CHECK (payment_method IN ('card', 'bank_transfer', 'cash', 'check', 'other')),
    CONSTRAINT chk_status CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled')),
    CONSTRAINT uk_payments_account_number UNIQUE (account_id, payment_number)
);

CREATE INDEX idx_payments_account_id ON payments(account_id);
CREATE INDEX idx_payments_client_id ON payments(client_id);
CREATE INDEX idx_payments_invoice_id ON payments(invoice_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_date ON payments(payment_date DESC);
CREATE INDEX idx_payments_processor_id ON payments(processor_payment_id);
```

### 6.2 Refunds

```sql
CREATE TABLE refunds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id UUID NOT NULL REFERENCES payments(id),

    amount DECIMAL(12, 2) NOT NULL,
    reason TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',

    processor_refund_id VARCHAR(255),

    refunded_at TIMESTAMP,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_status CHECK (status IN ('pending', 'processing', 'completed', 'failed'))
);

CREATE INDEX idx_refunds_payment_id ON refunds(payment_id);
```

---

## 7. Time Tracking Tables

### 7.1 Time Entries

```sql
CREATE TABLE time_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    job_id UUID REFERENCES jobs(id),

    -- Time
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP,
    duration_minutes INT,

    -- Location
    start_latitude DECIMAL(10, 8),
    start_longitude DECIMAL(11, 8),
    end_latitude DECIMAL(10, 8),
    end_longitude DECIMAL(11, 8),

    -- Type
    entry_type VARCHAR(50) DEFAULT 'job',
    is_billable BOOLEAN DEFAULT TRUE,

    -- Approval
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP,

    -- Notes
    notes TEXT,

    -- Metadata
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_entry_type CHECK (entry_type IN ('job', 'break', 'travel', 'other')),
    CONSTRAINT chk_status CHECK (status IN ('pending', 'approved', 'rejected'))
);

CREATE INDEX idx_time_entries_account_id ON time_entries(account_id);
CREATE INDEX idx_time_entries_user_id ON time_entries(user_id);
CREATE INDEX idx_time_entries_job_id ON time_entries(job_id);
CREATE INDEX idx_time_entries_start_time ON time_entries(start_time DESC);
CREATE INDEX idx_time_entries_status ON time_entries(status);
```

---

## 8. Communication Tables

### 8.1 Messages

```sql
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id),

    -- Message Details
    message_type VARCHAR(50) NOT NULL,
    direction VARCHAR(10) NOT NULL,

    -- Content
    subject VARCHAR(255),
    body TEXT NOT NULL,

    -- Recipients
    from_address VARCHAR(255) NOT NULL,
    to_address VARCHAR(255) NOT NULL,

    -- Status
    status VARCHAR(50) NOT NULL DEFAULT 'pending',

    -- Tracking
    sent_at TIMESTAMP,
    delivered_at TIMESTAMP,
    opened_at TIMESTAMP,
    clicked_at TIMESTAMP,
    failed_at TIMESTAMP,
    error_message TEXT,

    -- External Reference
    provider VARCHAR(50),
    provider_message_id VARCHAR(255),

    -- Related Entities
    related_type VARCHAR(50),
    related_id UUID,

    -- Metadata
    sent_by UUID REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_message_type CHECK (message_type IN ('email', 'sms')),
    CONSTRAINT chk_direction CHECK (direction IN ('inbound', 'outbound')),
    CONSTRAINT chk_status CHECK (status IN ('pending', 'sent', 'delivered', 'opened', 'failed'))
);

CREATE INDEX idx_messages_account_id ON messages(account_id);
CREATE INDEX idx_messages_client_id ON messages(client_id);
CREATE INDEX idx_messages_status ON messages(status);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);
```

---

## 9. Support Tables

### 9.1 Audit Logs

```sql
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),

    action VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,

    old_values JSONB,
    new_values JSONB,

    ip_address VARCHAR(45),
    user_agent TEXT,

    created_at TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_action CHECK (action IN ('create', 'update', 'delete', 'view'))
);

CREATE INDEX idx_audit_logs_account_id ON audit_logs(account_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
```

### 9.2 Sequences

```sql
CREATE TABLE sequences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    sequence_type VARCHAR(50) NOT NULL,
    prefix VARCHAR(20),
    current_value INT NOT NULL DEFAULT 0,

    CONSTRAINT uk_sequences UNIQUE (account_id, sequence_type)
);

CREATE INDEX idx_sequences_account ON sequences(account_id, sequence_type);
```

---

## 10. Database Functions and Triggers

### 10.1 Updated At Trigger

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER update_accounts_updated_at BEFORE UPDATE ON accounts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ... apply to all tables
```

### 10.2 Invoice Balance Calculation

```sql
CREATE OR REPLACE FUNCTION update_invoice_balance()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE invoices
    SET amount_paid = (
        SELECT COALESCE(SUM(amount), 0)
        FROM payments
        WHERE invoice_id = NEW.invoice_id AND status = 'completed'
    ),
    balance_due = total - (
        SELECT COALESCE(SUM(amount), 0)
        FROM payments
        WHERE invoice_id = NEW.invoice_id AND status = 'completed'
    )
    WHERE id = NEW.invoice_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_invoice_balance_on_payment
AFTER INSERT OR UPDATE ON payments
FOR EACH ROW EXECUTE FUNCTION update_invoice_balance();
```

---

## 11. Indexes Summary

Key indexes for performance:
- Foreign keys (automatic lookups)
- Status fields (filtering)
- Date ranges (reporting)
- Search fields (full-text)
- GIN indexes for arrays and JSONB
- Composite indexes for common query patterns

---

## Document Version Control
- **Version:** 1.0
- **Last Updated:** 2025-11-09
- **Status:** Complete
