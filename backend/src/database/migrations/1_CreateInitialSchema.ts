import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateInitialSchema1699999999999 implements MigrationInterface {
  name = 'CreateInitialSchema1699999999999';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      -- Enable UUID extension
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    `);

    await queryRunner.query(`
      -- Create accounts table
      CREATE TABLE "accounts" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "name" varchar(255) NOT NULL,
        "companyName" varchar(255),
        "email" varchar(255) NOT NULL UNIQUE,
        "phone" varchar(50),
        "subscriptionPlan" varchar(50) NOT NULL DEFAULT 'core',
        "subscriptionStatus" varchar(50) NOT NULL DEFAULT 'trial',
        "subscriptionStartDate" timestamp,
        "subscriptionEndDate" timestamp,
        "timezone" varchar(100) NOT NULL DEFAULT 'UTC',
        "currency" varchar(3) NOT NULL DEFAULT 'USD',
        "dateFormat" varchar(20) NOT NULL DEFAULT 'MM/DD/YYYY',
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now(),
        "deletedAt" timestamp
      );
    `);

    await queryRunner.query(`
      -- Create users table
      CREATE TABLE "users" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "accountId" uuid NOT NULL,
        "email" varchar(255) NOT NULL,
        "passwordHash" varchar(255) NOT NULL,
        "firstName" varchar(100) NOT NULL,
        "lastName" varchar(100) NOT NULL,
        "phone" varchar(50),
        "avatarUrl" text,
        "role" varchar(50) NOT NULL DEFAULT 'worker',
        "permissions" jsonb NOT NULL DEFAULT '[]',
        "status" varchar(50) NOT NULL DEFAULT 'active',
        "lastLoginAt" timestamp,
        "notificationPreferences" jsonb NOT NULL DEFAULT '{}',
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now(),
        "deletedAt" timestamp,
        CONSTRAINT "FK_users_accountId" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE CASCADE
      );
    `);

    await queryRunner.query(`
      -- Create clients table
      CREATE TABLE "clients" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "accountId" uuid NOT NULL,
        "firstName" varchar(100),
        "lastName" varchar(100),
        "companyName" varchar(255),
        "email" varchar(255),
        "phone" varchar(50),
        "tags" varchar(100)[] DEFAULT '{}',
        "status" varchar(50) NOT NULL DEFAULT 'active',
        "clientType" varchar(50) NOT NULL DEFAULT 'residential',
        "currency" varchar(3) NOT NULL DEFAULT 'USD',
        "paymentTerms" int NOT NULL DEFAULT 30,
        "creditLimit" decimal(12,2),
        "customFields" jsonb NOT NULL DEFAULT '{}',
        "internalNotes" text,
        "source" varchar(100),
        "createdBy" uuid,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now(),
        "deletedAt" timestamp,
        CONSTRAINT "FK_clients_accountId" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_clients_createdBy" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE SET NULL
      );
    `);

    await queryRunner.query(`
      -- Create client_contacts table
      CREATE TABLE "client_contacts" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "clientId" uuid NOT NULL,
        "firstName" varchar(100) NOT NULL,
        "lastName" varchar(100) NOT NULL,
        "email" varchar(255),
        "phone" varchar(50),
        "role" varchar(100),
        "isPrimary" boolean NOT NULL DEFAULT false,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "FK_client_contacts_clientId" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE
      );
    `);

    await queryRunner.query(`
      -- Create client_addresses table
      CREATE TABLE "client_addresses" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "clientId" uuid NOT NULL,
        "addressType" varchar(50) NOT NULL DEFAULT 'service',
        "label" varchar(100),
        "street1" varchar(255) NOT NULL,
        "street2" varchar(255),
        "city" varchar(100) NOT NULL,
        "state" varchar(100),
        "postalCode" varchar(20) NOT NULL,
        "country" varchar(2) NOT NULL DEFAULT 'US',
        "latitude" decimal(10,8),
        "longitude" decimal(11,8),
        "isPrimary" boolean NOT NULL DEFAULT false,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "FK_client_addresses_clientId" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE
      );
    `);

    await queryRunner.query(`
      -- Create quotes table
      CREATE TABLE "quotes" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "accountId" uuid NOT NULL,
        "clientId" uuid NOT NULL,
        "addressId" uuid,
        "quoteNumber" varchar(50) NOT NULL,
        "title" varchar(255) NOT NULL,
        "description" text,
        "status" varchar(50) NOT NULL DEFAULT 'draft',
        "subtotal" decimal(12,2) NOT NULL DEFAULT 0,
        "taxRate" decimal(5,4) NOT NULL DEFAULT 0,
        "taxAmount" decimal(12,2) NOT NULL DEFAULT 0,
        "discountAmount" decimal(12,2) NOT NULL DEFAULT 0,
        "total" decimal(12,2) NOT NULL DEFAULT 0,
        "depositRequired" boolean NOT NULL DEFAULT false,
        "depositAmount" decimal(12,2),
        "quoteDate" date NOT NULL DEFAULT CURRENT_DATE,
        "expiryDate" date,
        "introduction" text,
        "termsAndConditions" text,
        "notes" text,
        "viewedAt" timestamp,
        "approvedAt" timestamp,
        "declinedAt" timestamp,
        "declineReason" text,
        "signatureData" text,
        "signatureIp" varchar(45),
        "convertedToJobId" uuid,
        "createdBy" uuid,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now(),
        "deletedAt" timestamp,
        CONSTRAINT "FK_quotes_accountId" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_quotes_clientId" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_quotes_addressId" FOREIGN KEY ("addressId") REFERENCES "client_addresses"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_quotes_createdBy" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE SET NULL,
        CONSTRAINT "UQ_quotes_account_number" UNIQUE ("accountId", "quoteNumber")
      );
    `);

    await queryRunner.query(`
      -- Create quote_line_items table
      CREATE TABLE "quote_line_items" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "quoteId" uuid NOT NULL,
        "sortOrder" int NOT NULL DEFAULT 0,
        "itemType" varchar(50) NOT NULL DEFAULT 'service',
        "name" varchar(255) NOT NULL,
        "description" text,
        "quantity" decimal(10,2) NOT NULL DEFAULT 1,
        "unitPrice" decimal(12,2) NOT NULL,
        "totalPrice" decimal(12,2) NOT NULL,
        "isTaxable" boolean NOT NULL DEFAULT true,
        "isOptional" boolean NOT NULL DEFAULT false,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "FK_quote_line_items_quoteId" FOREIGN KEY ("quoteId") REFERENCES "quotes"("id") ON DELETE CASCADE
      );
    `);

    await queryRunner.query(`
      -- Create jobs table
      CREATE TABLE "jobs" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "accountId" uuid NOT NULL,
        "clientId" uuid NOT NULL,
        "addressId" uuid,
        "quoteId" uuid,
        "jobNumber" varchar(50) NOT NULL,
        "title" varchar(255) NOT NULL,
        "description" text,
        "status" varchar(50) NOT NULL DEFAULT 'scheduled',
        "priority" varchar(20) NOT NULL DEFAULT 'normal',
        "scheduledStart" timestamp,
        "scheduledEnd" timestamp,
        "estimatedDuration" int,
        "actualStart" timestamp,
        "actualEnd" timestamp,
        "completionNotes" text,
        "clientSignature" text,
        "assignedTo" uuid[] DEFAULT '{}',
        "estimatedValue" decimal(12,2),
        "actualCost" decimal(12,2),
        "internalNotes" text,
        "clientInstructions" text,
        "isRecurring" boolean NOT NULL DEFAULT false,
        "recurrenceRule" text,
        "parentJobId" uuid,
        "createdBy" uuid,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now(),
        "deletedAt" timestamp,
        CONSTRAINT "FK_jobs_accountId" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_jobs_clientId" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_jobs_addressId" FOREIGN KEY ("addressId") REFERENCES "client_addresses"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_jobs_quoteId" FOREIGN KEY ("quoteId") REFERENCES "quotes"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_jobs_createdBy" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_jobs_parentJobId" FOREIGN KEY ("parentJobId") REFERENCES "jobs"("id") ON DELETE SET NULL,
        CONSTRAINT "UQ_jobs_account_number" UNIQUE ("accountId", "jobNumber")
      );
    `);

    await queryRunner.query(`
      -- Create job_photos table
      CREATE TABLE "job_photos" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "jobId" uuid NOT NULL,
        "fileUrl" text NOT NULL,
        "fileName" varchar(255) NOT NULL,
        "fileSize" int,
        "mimeType" varchar(100),
        "caption" text,
        "photoType" varchar(50) NOT NULL DEFAULT 'general',
        "sortOrder" int NOT NULL DEFAULT 0,
        "uploadedBy" uuid,
        "uploadedAt" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "FK_job_photos_jobId" FOREIGN KEY ("jobId") REFERENCES "jobs"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_job_photos_uploadedBy" FOREIGN KEY ("uploadedBy") REFERENCES "users"("id") ON DELETE SET NULL
      );
    `);

    await queryRunner.query(`
      -- Create invoices table
      CREATE TABLE "invoices" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "accountId" uuid NOT NULL,
        "clientId" uuid NOT NULL,
        "jobId" uuid,
        "quoteId" uuid,
        "invoiceNumber" varchar(50) NOT NULL,
        "title" varchar(255) NOT NULL,
        "description" text,
        "status" varchar(50) NOT NULL DEFAULT 'draft',
        "subtotal" decimal(12,2) NOT NULL DEFAULT 0,
        "taxRate" decimal(5,4) NOT NULL DEFAULT 0,
        "taxAmount" decimal(12,2) NOT NULL DEFAULT 0,
        "discountAmount" decimal(12,2) NOT NULL DEFAULT 0,
        "total" decimal(12,2) NOT NULL DEFAULT 0,
        "amountPaid" decimal(12,2) NOT NULL DEFAULT 0,
        "balanceDue" decimal(12,2) NOT NULL DEFAULT 0,
        "invoiceDate" date NOT NULL DEFAULT CURRENT_DATE,
        "dueDate" date NOT NULL,
        "paidDate" date,
        "paymentTerms" int NOT NULL DEFAULT 30,
        "lateFeeEnabled" boolean NOT NULL DEFAULT false,
        "lateFeePercentage" decimal(5,2),
        "notes" text,
        "termsAndConditions" text,
        "sentAt" timestamp,
        "viewedAt" timestamp,
        "lastReminderSentAt" timestamp,
        "reminderCount" int NOT NULL DEFAULT 0,
        "createdBy" uuid,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now(),
        "deletedAt" timestamp,
        CONSTRAINT "FK_invoices_accountId" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_invoices_clientId" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_invoices_jobId" FOREIGN KEY ("jobId") REFERENCES "jobs"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_invoices_quoteId" FOREIGN KEY ("quoteId") REFERENCES "quotes"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_invoices_createdBy" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE SET NULL,
        CONSTRAINT "UQ_invoices_account_number" UNIQUE ("accountId", "invoiceNumber")
      );
    `);

    await queryRunner.query(`
      -- Create invoice_line_items table
      CREATE TABLE "invoice_line_items" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "invoiceId" uuid NOT NULL,
        "sortOrder" int NOT NULL DEFAULT 0,
        "itemType" varchar(50) NOT NULL DEFAULT 'service',
        "name" varchar(255) NOT NULL,
        "description" text,
        "quantity" decimal(10,2) NOT NULL DEFAULT 1,
        "unitPrice" decimal(12,2) NOT NULL,
        "totalPrice" decimal(12,2) NOT NULL,
        "isTaxable" boolean NOT NULL DEFAULT true,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "FK_invoice_line_items_invoiceId" FOREIGN KEY ("invoiceId") REFERENCES "invoices"("id") ON DELETE CASCADE
      );
    `);

    await queryRunner.query(`
      -- Create payments table
      CREATE TABLE "payments" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "accountId" uuid NOT NULL,
        "clientId" uuid NOT NULL,
        "invoiceId" uuid,
        "paymentNumber" varchar(50) NOT NULL,
        "amount" decimal(12,2) NOT NULL,
        "currency" varchar(3) NOT NULL DEFAULT 'USD',
        "paymentMethod" varchar(50) NOT NULL,
        "paymentProcessor" varchar(50),
        "status" varchar(50) NOT NULL DEFAULT 'pending',
        "processorPaymentId" varchar(255),
        "processorChargeId" varchar(255),
        "cardLast4" varchar(4),
        "cardBrand" varchar(50),
        "processingFee" decimal(12,2) NOT NULL DEFAULT 0,
        "netAmount" decimal(12,2),
        "paymentDate" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "settledDate" timestamp,
        "notes" text,
        "receiptUrl" text,
        "createdBy" uuid,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "FK_payments_accountId" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_payments_clientId" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_payments_invoiceId" FOREIGN KEY ("invoiceId") REFERENCES "invoices"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_payments_createdBy" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE SET NULL,
        CONSTRAINT "UQ_payments_account_number" UNIQUE ("accountId", "paymentNumber")
      );
    `);

    await queryRunner.query(`
      -- Create refunds table
      CREATE TABLE "refunds" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "paymentId" uuid NOT NULL,
        "amount" decimal(12,2) NOT NULL,
        "reason" text,
        "status" varchar(50) NOT NULL DEFAULT 'pending',
        "processorRefundId" varchar(255),
        "refundedAt" timestamp,
        "createdBy" uuid,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "FK_refunds_paymentId" FOREIGN KEY ("paymentId") REFERENCES "payments"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_refunds_createdBy" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE SET NULL
      );
    `);

    await queryRunner.query(`
      -- Create time_entries table
      CREATE TABLE "time_entries" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "accountId" uuid NOT NULL,
        "userId" uuid NOT NULL,
        "jobId" uuid,
        "startTime" timestamp NOT NULL,
        "endTime" timestamp,
        "durationMinutes" int,
        "startLatitude" decimal(10,8),
        "startLongitude" decimal(11,8),
        "endLatitude" decimal(10,8),
        "endLongitude" decimal(11,8),
        "entryType" varchar(50) NOT NULL DEFAULT 'job',
        "isBillable" boolean NOT NULL DEFAULT true,
        "status" varchar(50) NOT NULL DEFAULT 'pending',
        "approvedBy" uuid,
        "approvedAt" timestamp,
        "notes" text,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "FK_time_entries_accountId" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_time_entries_userId" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_time_entries_jobId" FOREIGN KEY ("jobId") REFERENCES "jobs"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_time_entries_approvedBy" FOREIGN KEY ("approvedBy") REFERENCES "users"("id") ON DELETE SET NULL
      );
    `);

    await queryRunner.query(`
      -- Create messages table
      CREATE TABLE "messages" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "accountId" uuid NOT NULL,
        "clientId" uuid,
        "messageType" varchar(50) NOT NULL,
        "direction" varchar(10) NOT NULL,
        "subject" varchar(255),
        "body" text NOT NULL,
        "fromAddress" varchar(255) NOT NULL,
        "toAddress" varchar(255) NOT NULL,
        "status" varchar(50) NOT NULL DEFAULT 'pending',
        "sentAt" timestamp,
        "deliveredAt" timestamp,
        "openedAt" timestamp,
        "clickedAt" timestamp,
        "failedAt" timestamp,
        "errorMessage" text,
        "provider" varchar(50),
        "providerMessageId" varchar(255),
        "relatedType" varchar(50),
        "relatedId" uuid,
        "sentBy" uuid,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "FK_messages_accountId" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_messages_clientId" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_messages_sentBy" FOREIGN KEY ("sentBy") REFERENCES "users"("id") ON DELETE SET NULL
      );
    `);

    await queryRunner.query(`
      -- Create audit_logs table
      CREATE TABLE "audit_logs" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "accountId" uuid,
        "userId" uuid,
        "action" varchar(50) NOT NULL,
        "entityType" varchar(50) NOT NULL,
        "entityId" uuid NOT NULL,
        "oldValues" jsonb,
        "newValues" jsonb,
        "ipAddress" varchar(45),
        "userAgent" text,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "FK_audit_logs_accountId" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_audit_logs_userId" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL
      );
    `);

    await queryRunner.query(`
      -- Create sequences table
      CREATE TABLE "sequences" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "accountId" uuid NOT NULL,
        "sequenceType" varchar(50) NOT NULL,
        "prefix" varchar(20),
        "currentValue" int NOT NULL DEFAULT 0,
        CONSTRAINT "FK_sequences_accountId" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE CASCADE,
        CONSTRAINT "UQ_sequences_account_type" UNIQUE ("accountId", "sequenceType")
      );
    `);

    await queryRunner.query(`
      -- Create file_metadata table
      CREATE TABLE "file_metadata" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "accountId" uuid NOT NULL,
        "key" varchar(500) NOT NULL,
        "fileName" varchar(255) NOT NULL,
        "mimeType" varchar(100) NOT NULL,
        "fileSize" bigint NOT NULL,
        "entityType" varchar(50),
        "entityId" uuid,
        "uploadedBy" uuid NOT NULL,
        "description" text,
        "metadata" jsonb NOT NULL DEFAULT '{}',
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now(),
        "deletedAt" timestamp,
        CONSTRAINT "FK_file_metadata_accountId" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_file_metadata_uploadedBy" FOREIGN KEY ("uploadedBy") REFERENCES "users"("id") ON DELETE CASCADE
      );
    `);

    await queryRunner.query(`
      -- Create indexes for accounts
      CREATE INDEX "idx_accounts_email" ON "accounts"("email");
      CREATE INDEX "idx_accounts_subscription_status" ON "accounts"("subscriptionStatus");
    `);

    await queryRunner.query(`
      -- Create indexes for users
      CREATE INDEX "idx_users_account_id" ON "users"("accountId");
      CREATE INDEX "idx_users_email" ON "users"("email");
      CREATE INDEX "idx_users_role" ON "users"("role");
      CREATE INDEX "idx_users_status" ON "users"("status");
      CREATE INDEX "idx_users_deleted_at" ON "users"("deletedAt");
    `);

    await queryRunner.query(`
      -- Create indexes for clients
      CREATE INDEX "idx_clients_account_id" ON "clients"("accountId");
      CREATE INDEX "idx_clients_email" ON "clients"("email");
      CREATE INDEX "idx_clients_phone" ON "clients"("phone");
      CREATE INDEX "idx_clients_deleted_at" ON "clients"("deletedAt");
    `);

    await queryRunner.query(`
      -- Create indexes for client_contacts
      CREATE INDEX "idx_client_contacts_client_id" ON "client_contacts"("clientId");
    `);

    await queryRunner.query(`
      -- Create indexes for client_addresses
      CREATE INDEX "idx_client_addresses_client_id" ON "client_addresses"("clientId");
      CREATE INDEX "idx_client_addresses_location" ON "client_addresses"("latitude", "longitude");
    `);

    await queryRunner.query(`
      -- Create indexes for quotes
      CREATE INDEX "idx_quotes_account_id" ON "quotes"("accountId");
      CREATE INDEX "idx_quotes_client_id" ON "quotes"("clientId");
      CREATE INDEX "idx_quotes_status" ON "quotes"("status");
      CREATE INDEX "idx_quotes_date" ON "quotes"("quoteDate");
      CREATE INDEX "idx_quotes_deleted_at" ON "quotes"("deletedAt");
    `);

    await queryRunner.query(`
      -- Create indexes for quote_line_items
      CREATE INDEX "idx_quote_line_items_quote_id" ON "quote_line_items"("quoteId");
    `);

    await queryRunner.query(`
      -- Create indexes for jobs
      CREATE INDEX "idx_jobs_account_id" ON "jobs"("accountId");
      CREATE INDEX "idx_jobs_client_id" ON "jobs"("clientId");
      CREATE INDEX "idx_jobs_status" ON "jobs"("status");
      CREATE INDEX "idx_jobs_scheduled" ON "jobs"("scheduledStart", "scheduledEnd");
      CREATE INDEX "idx_jobs_deleted_at" ON "jobs"("deletedAt");
      CREATE INDEX "idx_jobs_assigned_to" ON "jobs" USING GIN("assignedTo");
    `);

    await queryRunner.query(`
      -- Create indexes for job_photos
      CREATE INDEX "idx_job_photos_job_id" ON "job_photos"("jobId");
    `);

    await queryRunner.query(`
      -- Create indexes for invoices
      CREATE INDEX "idx_invoices_account_id" ON "invoices"("accountId");
      CREATE INDEX "idx_invoices_client_id" ON "invoices"("clientId");
      CREATE INDEX "idx_invoices_job_id" ON "invoices"("jobId");
      CREATE INDEX "idx_invoices_status" ON "invoices"("status");
      CREATE INDEX "idx_invoices_due_date" ON "invoices"("dueDate");
      CREATE INDEX "idx_invoices_deleted_at" ON "invoices"("deletedAt");
    `);

    await queryRunner.query(`
      -- Create indexes for invoice_line_items
      CREATE INDEX "idx_invoice_line_items_invoice_id" ON "invoice_line_items"("invoiceId");
    `);

    await queryRunner.query(`
      -- Create indexes for payments
      CREATE INDEX "idx_payments_account_id" ON "payments"("accountId");
      CREATE INDEX "idx_payments_client_id" ON "payments"("clientId");
      CREATE INDEX "idx_payments_invoice_id" ON "payments"("invoiceId");
      CREATE INDEX "idx_payments_status" ON "payments"("status");
      CREATE INDEX "idx_payments_date" ON "payments"("paymentDate");
      CREATE INDEX "idx_payments_processor_id" ON "payments"("processorPaymentId");
    `);

    await queryRunner.query(`
      -- Create indexes for refunds
      CREATE INDEX "idx_refunds_payment_id" ON "refunds"("paymentId");
    `);

    await queryRunner.query(`
      -- Create indexes for time_entries
      CREATE INDEX "idx_time_entries_account_id" ON "time_entries"("accountId");
      CREATE INDEX "idx_time_entries_user_id" ON "time_entries"("userId");
      CREATE INDEX "idx_time_entries_job_id" ON "time_entries"("jobId");
      CREATE INDEX "idx_time_entries_start_time" ON "time_entries"("startTime");
      CREATE INDEX "idx_time_entries_status" ON "time_entries"("status");
    `);

    await queryRunner.query(`
      -- Create indexes for messages
      CREATE INDEX "idx_messages_account_id" ON "messages"("accountId");
      CREATE INDEX "idx_messages_client_id" ON "messages"("clientId");
      CREATE INDEX "idx_messages_status" ON "messages"("status");
      CREATE INDEX "idx_messages_created_at" ON "messages"("createdAt");
    `);

    await queryRunner.query(`
      -- Create indexes for audit_logs
      CREATE INDEX "idx_audit_logs_account_id" ON "audit_logs"("accountId");
      CREATE INDEX "idx_audit_logs_entity" ON "audit_logs"("entityType", "entityId");
      CREATE INDEX "idx_audit_logs_created_at" ON "audit_logs"("createdAt");
    `);

    await queryRunner.query(`
      -- Create indexes for sequences
      CREATE INDEX "idx_sequences_account" ON "sequences"("accountId", "sequenceType");
    `);

    await queryRunner.query(`
      -- Create indexes for file_metadata
      CREATE INDEX "idx_file_metadata_account_id" ON "file_metadata"("accountId");
      CREATE INDEX "idx_file_metadata_entity" ON "file_metadata"("entityType", "entityId");
      CREATE INDEX "idx_file_metadata_deleted_at" ON "file_metadata"("deletedAt");
    `);

    await queryRunner.query(`
      -- Create trigger function for updated_at
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW."updatedAt" = now();
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);

    await queryRunner.query(`
      -- Create triggers for updated_at on all tables with updatedAt column
      CREATE TRIGGER update_accounts_updated_at BEFORE UPDATE ON "accounts" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
      CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON "users" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
      CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON "clients" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
      CREATE TRIGGER update_client_contacts_updated_at BEFORE UPDATE ON "client_contacts" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
      CREATE TRIGGER update_client_addresses_updated_at BEFORE UPDATE ON "client_addresses" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
      CREATE TRIGGER update_quotes_updated_at BEFORE UPDATE ON "quotes" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
      CREATE TRIGGER update_quote_line_items_updated_at BEFORE UPDATE ON "quote_line_items" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
      CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON "jobs" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
      CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON "invoices" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
      CREATE TRIGGER update_invoice_line_items_updated_at BEFORE UPDATE ON "invoice_line_items" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
      CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON "payments" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
      CREATE TRIGGER update_time_entries_updated_at BEFORE UPDATE ON "time_entries" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
      CREATE TRIGGER update_file_metadata_updated_at BEFORE UPDATE ON "file_metadata" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "file_metadata" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "sequences" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "audit_logs" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "messages" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "time_entries" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "refunds" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "payments" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "invoice_line_items" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "invoices" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "job_photos" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "jobs" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "quote_line_items" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "quotes" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "client_addresses" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "client_contacts" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "clients" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "accounts" CASCADE;`);
    await queryRunner.query(`DROP FUNCTION IF EXISTS update_updated_at_column();`);
    await queryRunner.query(`DROP EXTENSION IF EXISTS "uuid-ossp";`);
  }
}
