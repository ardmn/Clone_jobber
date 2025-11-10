# Jobber Clone Backend API

A comprehensive field service management platform backend built with NestJS, TypeORM, and PostgreSQL. This project provides a complete REST API for managing clients, quotes, jobs, invoices, payments, scheduling, and communications for field service businesses.

## Table of Contents

- [Project Overview](#project-overview)
- [Tech Stack](#tech-stack)
- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [Running the Application](#running-the-application)
- [API Documentation](#api-documentation)
- [Testing](#testing)
- [Project Structure](#project-structure)
- [Available Scripts](#available-scripts)
- [Modules Overview](#modules-overview)
- [API Endpoints](#api-endpoints)
- [Authentication](#authentication)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

## Project Overview

Jobber Clone is a field service management system designed for businesses that provide on-site services. It helps manage the entire service lifecycle from initial quote to final payment, including client management, job scheduling, time tracking, invoicing, and communications.

This backend API provides:
- Multi-tenant architecture with account isolation
- Role-based access control (Owner, Admin, Worker)
- Complete quote-to-cash workflow
- Integrated payment processing (Stripe)
- Email and SMS communications (SendGrid, Twilio)
- File management (AWS S3)
- Comprehensive audit logging
- Background job processing with Bull/Redis

## Tech Stack

- **Framework**: NestJS 10.x
- **Language**: TypeScript 5.x
- **Database**: PostgreSQL 14+ with TypeORM
- **Cache/Queue**: Redis 6+ with Bull
- **Authentication**: JWT (JSON Web Tokens)
- **Payment Processing**: Stripe
- **Email Service**: SendGrid
- **SMS Service**: Twilio
- **File Storage**: AWS S3
- **API Documentation**: Swagger/OpenAPI
- **Testing**: Jest
- **Validation**: class-validator, class-transformer
- **Security**: Helmet, Throttler (Rate Limiting)

## Features

The backend provides 14+ comprehensive modules:

1. **Authentication & Authorization** - JWT-based auth, role-based permissions
2. **Account Management** - Multi-tenant account system with subscription management
3. **User Management** - User profiles, roles, permissions, and team management
4. **Client Management** - Client profiles with contacts and addresses
5. **Quote Management** - Create, send, and manage service quotes
6. **Job Management** - Schedule, assign, and track jobs with photo uploads
7. **Invoice Management** - Generate and send invoices with line items
8. **Payment Processing** - Accept payments via Stripe with refund support
9. **Time Tracking** - GPS-enabled time entry tracking for workers
10. **Schedule Management** - Calendar and scheduling system
11. **Communications** - Send emails and SMS with message tracking
12. **File Management** - Upload and manage files with AWS S3
13. **Reports & Analytics** - Business intelligence and reporting
14. **Audit Logs** - Comprehensive audit trail for all actions

## Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- PostgreSQL >= 14.0
- Redis >= 6.0
- Docker and Docker Compose (optional, for containerized deployment)

## Installation

1. **Clone the repository**

```bash
git clone <repository-url>
cd Clone_jobber/backend
```

2. **Install dependencies**

```bash
npm install
```

3. **Copy environment file**

```bash
cp .env.example .env
```

4. **Configure environment variables**

Edit the `.env` file with your configuration (see [Environment Variables](#environment-variables) section)

5. **Run database migrations**

```bash
npm run migration:run
```

6. **Seed the database** (optional, for demo data)

```bash
npm run seed
```

7. **Start the development server**

```bash
npm run start:dev
```

The API will be available at `http://localhost:8080`

## Environment Variables

Create a `.env` file in the backend directory with the following variables:

### Application
```env
NODE_ENV=development
PORT=8080
APP_NAME=Jobber Clone API
APP_URL=http://localhost:8080
```

### Database
```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=jobber
DB_PASSWORD=jobber123
DB_DATABASE=jobber_clone
DB_SYNC=false
DB_LOGGING=true
```

### JWT Authentication
```env
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=1h
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production
JWT_REFRESH_EXPIRES_IN=30d
```

### Redis
```env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
```

### Stripe Payment Processing
```env
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```

### SendGrid Email Service
```env
SENDGRID_API_KEY=your_sendgrid_api_key
SENDGRID_FROM_EMAIL=noreply@jobber-clone.com
SENDGRID_FROM_NAME=Jobber Clone
```

### Twilio SMS Service
```env
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+1234567890
```

### AWS S3 File Storage
```env
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=us-east-1
AWS_S3_BUCKET=jobber-clone-uploads
```

### Google Maps
```env
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

### Rate Limiting
```env
THROTTLE_TTL=60000
THROTTLE_LIMIT=1000
```

### Frontend URLs (for CORS and email links)
```env
FRONTEND_URL=http://localhost:3000
EMAIL_VERIFICATION_URL=http://localhost:3000/verify-email
PASSWORD_RESET_URL=http://localhost:3000/reset-password
```

## Database Setup

### Running Migrations

The project uses TypeORM migrations for database schema management.

```bash
# Run all pending migrations
npm run migration:run

# Revert the last migration
npm run migration:revert

# Generate a new migration (after entity changes)
npm run migration:generate -- -n MigrationName
```

### Seeding Demo Data

To populate the database with demo data for testing:

```bash
npm run seed
```

This creates:
- A demo account (Demo Field Services)
- Three users:
  - Admin: admin@example.com (password: password123)
  - Manager: manager@example.com (password: password123)
  - Worker: worker@example.com (password: password123)
- Five demo clients with contacts and addresses
- Three quotes (draft, sent, approved)
- Four jobs (scheduled, in progress, completed)
- Three invoices (paid, sent, overdue)
- Two payments

## Running the Application

### Development Mode

Run with hot-reload enabled:

```bash
npm run start:dev
```

The API will be available at `http://localhost:8080`

### Production Mode

Build and run the production version:

```bash
npm run build
npm run start:prod
```

### Using Docker

Start all services (PostgreSQL, Redis, Backend) with Docker Compose:

```bash
# Start services
npm run docker:up

# View logs
npm run docker:logs

# Stop services
npm run docker:down
```

Or use docker-compose directly:

```bash
docker-compose up -d
docker-compose logs -f
docker-compose down
```

## API Documentation

Interactive API documentation is available via Swagger UI:

**URL**: http://localhost:8080/api/docs

The Swagger interface provides:
- Complete API endpoint documentation
- Request/response schemas
- Try-it-out functionality
- Authentication flows

## Testing

```bash
# Run unit tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:cov

# Run e2e tests
npm run test:e2e

# Debug tests
npm run test:debug
```

## Project Structure

```
backend/
├── src/
│   ├── common/                 # Shared utilities, decorators, guards
│   │   ├── decorators/        # Custom decorators (@CurrentUser, etc.)
│   │   ├── guards/            # Auth guards, role guards
│   │   ├── interceptors/      # Logging, transform interceptors
│   │   └── filters/           # Exception filters
│   ├── config/                # Configuration modules
│   │   ├── database.config.ts
│   │   ├── jwt.config.ts
│   │   └── redis.config.ts
│   ├── database/              # Database related files
│   │   ├── entities/          # TypeORM entities
│   │   ├── migrations/        # Database migrations
│   │   └── seeds/             # Seed data scripts
│   ├── integrations/          # External service integrations
│   │   ├── stripe/            # Stripe payment integration
│   │   ├── sendgrid/          # SendGrid email integration
│   │   ├── twilio/            # Twilio SMS integration
│   │   └── aws-s3/            # AWS S3 file storage
│   ├── jobs/                  # Background job processors
│   │   ├── email-jobs/        # Email queue processors
│   │   ├── pdf-jobs/          # PDF generation jobs
│   │   └── sms-jobs/          # SMS queue processors
│   ├── modules/               # Feature modules
│   │   ├── accounts/          # Account management
│   │   ├── auth/              # Authentication
│   │   ├── users/             # User management
│   │   ├── clients/           # Client management
│   │   ├── quotes/            # Quote management
│   │   ├── jobs/              # Job management
│   │   ├── invoices/          # Invoice management
│   │   ├── payments/          # Payment processing
│   │   ├── time-tracking/     # Time entry tracking
│   │   ├── schedule/          # Calendar & scheduling
│   │   ├── communications/    # Email/SMS messaging
│   │   ├── files/             # File management
│   │   ├── reports/           # Reports & analytics
│   │   └── audit-logs/        # Audit logging
│   ├── app.module.ts          # Root application module
│   ├── main.ts                # Application entry point
│   └── health.controller.ts   # Health check endpoint
├── test/                      # E2E tests
├── .env.example               # Environment variables template
├── .dockerignore              # Docker ignore file
├── .gitignore                 # Git ignore file
├── docker-compose.yml         # Docker Compose configuration
├── Dockerfile                 # Docker build instructions
├── nest-cli.json              # NestJS CLI configuration
├── ormconfig.ts               # TypeORM configuration
├── package.json               # Dependencies and scripts
├── README.md                  # This file
└── tsconfig.json              # TypeScript configuration
```

## Available Scripts

- `npm run build` - Build the production bundle
- `npm run start` - Start the application
- `npm run start:dev` - Start in development mode with hot-reload
- `npm run start:debug` - Start in debug mode
- `npm run start:prod` - Start the production build
- `npm run lint` - Lint and fix code
- `npm run format` - Format code with Prettier
- `npm run test` - Run unit tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:cov` - Run tests with coverage
- `npm run test:e2e` - Run end-to-end tests
- `npm run migration:run` - Run database migrations
- `npm run migration:revert` - Revert last migration
- `npm run migration:generate` - Generate new migration
- `npm run seed` - Seed database with demo data
- `npm run db:migrate` - Alias for migration:run
- `npm run db:seed` - Alias for seed
- `npm run docker:up` - Start Docker services
- `npm run docker:down` - Stop Docker services
- `npm run docker:logs` - View Docker logs

## Modules Overview

### Authentication (auth)
JWT-based authentication with refresh tokens, password reset, and email verification.

### Accounts (accounts)
Multi-tenant account management with subscription plans and billing.

### Users (users)
User profiles, team management, roles (Owner, Admin, Worker), and permissions.

### Clients (clients)
Client management with contacts, multiple addresses, tags, and custom fields.

### Quotes (quotes)
Create and manage service quotes with line items, optional items, and e-signatures.

### Jobs (jobs)
Schedule and track jobs with worker assignment, GPS tracking, photos, and completion notes.

### Invoices (invoices)
Generate invoices from jobs or standalone, with automated reminders and payment tracking.

### Payments (payments)
Process payments via Stripe with support for various payment methods and refunds.

### Time Tracking (time-tracking)
GPS-enabled time entry tracking with billable hours and approval workflow.

### Schedule (schedule)
Calendar view, job scheduling, and availability management.

### Communications (communications)
Send transactional emails via SendGrid and SMS via Twilio with message tracking.

### Files (files)
Upload, store, and manage files with AWS S3 integration.

### Reports (reports)
Business intelligence with revenue reports, job metrics, and client analytics.

### Audit Logs (audit-logs)
Comprehensive audit trail tracking all create, update, and delete operations.

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new account
- `POST /api/auth/login` - Login with email/password
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout user
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password

### Accounts
- `GET /api/accounts/:id` - Get account details
- `PATCH /api/accounts/:id` - Update account
- `GET /api/accounts/:id/subscription` - Get subscription info
- `PATCH /api/accounts/:id/subscription` - Update subscription

### Users
- `GET /api/users` - List users (paginated)
- `POST /api/users` - Create user
- `GET /api/users/:id` - Get user details
- `PATCH /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user (soft delete)
- `GET /api/users/me` - Get current user profile

### Clients
- `GET /api/clients` - List clients (paginated, filterable)
- `POST /api/clients` - Create client
- `GET /api/clients/:id` - Get client details
- `PATCH /api/clients/:id` - Update client
- `DELETE /api/clients/:id` - Delete client (soft delete)
- `POST /api/clients/:id/contacts` - Add contact
- `POST /api/clients/:id/addresses` - Add address

### Quotes
- `GET /api/quotes` - List quotes (paginated, filterable)
- `POST /api/quotes` - Create quote
- `GET /api/quotes/:id` - Get quote details
- `PATCH /api/quotes/:id` - Update quote
- `DELETE /api/quotes/:id` - Delete quote (soft delete)
- `POST /api/quotes/:id/send` - Send quote to client
- `POST /api/quotes/:id/approve` - Approve quote
- `POST /api/quotes/:id/convert` - Convert to job

### Jobs
- `GET /api/jobs` - List jobs (paginated, filterable)
- `POST /api/jobs` - Create job
- `GET /api/jobs/:id` - Get job details
- `PATCH /api/jobs/:id` - Update job
- `DELETE /api/jobs/:id` - Delete job (soft delete)
- `POST /api/jobs/:id/assign` - Assign workers
- `POST /api/jobs/:id/start` - Start job
- `POST /api/jobs/:id/complete` - Complete job
- `POST /api/jobs/:id/photos` - Upload photos

### Invoices
- `GET /api/invoices` - List invoices (paginated, filterable)
- `POST /api/invoices` - Create invoice
- `GET /api/invoices/:id` - Get invoice details
- `PATCH /api/invoices/:id` - Update invoice
- `DELETE /api/invoices/:id` - Delete invoice (soft delete)
- `POST /api/invoices/:id/send` - Send invoice to client
- `GET /api/invoices/:id/pdf` - Download invoice PDF

### Payments
- `GET /api/payments` - List payments (paginated)
- `POST /api/payments` - Create payment
- `GET /api/payments/:id` - Get payment details
- `POST /api/payments/:id/refund` - Refund payment
- `POST /api/payments/process-stripe` - Process Stripe payment

### Time Tracking
- `GET /api/time-entries` - List time entries
- `POST /api/time-entries` - Create time entry
- `POST /api/time-entries/:id/start` - Start timer
- `POST /api/time-entries/:id/stop` - Stop timer
- `POST /api/time-entries/:id/approve` - Approve entry

### Schedule
- `GET /api/schedule` - Get schedule view
- `GET /api/schedule/calendar` - Get calendar events
- `POST /api/schedule/availability` - Set availability

### Communications
- `POST /api/communications/send-email` - Send email
- `POST /api/communications/send-sms` - Send SMS
- `GET /api/communications/messages` - List messages

### Files
- `POST /api/files/upload` - Upload file
- `GET /api/files/:id` - Get file metadata
- `GET /api/files/:id/download` - Download file
- `DELETE /api/files/:id` - Delete file

### Reports
- `GET /api/reports/revenue` - Revenue report
- `GET /api/reports/jobs` - Job statistics
- `GET /api/reports/clients` - Client analytics

### Health
- `GET /api/health` - Health check endpoint

## Authentication

The API uses JWT (JSON Web Tokens) for authentication.

### Getting a Token

1. **Register a new account** or **login** with existing credentials:

```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "password123"
}
```

2. **Use the access token** in subsequent requests:

```bash
Authorization: Bearer <access_token>
```

### Token Refresh

When the access token expires (default: 1 hour), use the refresh token to get a new one:

```bash
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "<refresh_token>"
}
```

### Roles and Permissions

The API supports three user roles:

- **Owner**: Full system access, can manage subscription
- **Admin**: Can manage users, clients, jobs, quotes, invoices
- **Worker**: Can view and update assigned jobs, track time

Role-based access is enforced via guards at the endpoint level.

## Deployment

### Production Checklist

Before deploying to production:

1. Change all secret keys in `.env` (JWT_SECRET, database passwords, etc.)
2. Set `NODE_ENV=production`
3. Set `DB_SYNC=false` (never use synchronize in production)
4. Enable SSL for database connections
5. Configure proper CORS settings
6. Set up SSL/TLS certificates (HTTPS)
7. Configure rate limiting appropriately
8. Set up monitoring and logging
9. Configure backup strategy for database
10. Review and test all environment variables

### Docker Deployment

Build and run with Docker:

```bash
# Build image
docker build -t jobber-clone-backend .

# Run container
docker run -p 8080:8080 --env-file .env jobber-clone-backend
```

Or use Docker Compose for full stack:

```bash
docker-compose -f docker-compose.yml up -d
```

### Cloud Deployment

The application can be deployed to various cloud platforms:

- **AWS**: ECS, Elastic Beanstalk, or EC2
- **Google Cloud**: Cloud Run, App Engine, or GKE
- **Azure**: App Service, Container Instances, or AKS
- **Heroku**: Using Heroku Postgres and Redis add-ons
- **DigitalOcean**: App Platform or Droplets

Ensure you configure:
- PostgreSQL database (RDS, Cloud SQL, etc.)
- Redis instance (ElastiCache, Cloud Memorystore, etc.)
- Environment variables via platform settings
- Auto-scaling policies
- Health check endpoints
- Log aggregation

## Contributing

We welcome contributions! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style

- Follow the existing code style
- Run `npm run lint` before committing
- Write tests for new features
- Update documentation as needed

### Pull Request Process

1. Ensure all tests pass
2. Update the README.md with details of changes if needed
3. Update the API documentation (Swagger) if adding/modifying endpoints
4. The PR will be merged once reviewed and approved

## License

This project is licensed under the MIT License - see the LICENSE file for details.

---

**Built with NestJS** | **Powered by TypeScript** | **Secured with JWT**

For questions or support, please open an issue on GitHub.
