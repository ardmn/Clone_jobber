# Backend Technical Requirements

## Document Information
- **Version:** 1.0
- **Last Updated:** 2025-11-09
- **Status:** Complete

---

## Table of Contents
1. [Technology Stack Options](#1-technology-stack-options)
2. [Architecture Pattern](#2-architecture-pattern)
3. [API Design](#3-api-design)
4. [Authentication & Authorization](#4-authentication--authorization)
5. [Database Requirements](#5-database-requirements)
6. [Business Logic Layer](#6-business-logic-layer)
7. [Third-Party Integrations](#7-third-party-integrations)
8. [File Storage](#8-file-storage)
9. [Background Jobs & Queues](#9-background-jobs--queues)
10. [Caching Strategy](#10-caching-strategy)
11. [Security Requirements](#11-security-requirements)
12. [Performance Requirements](#12-performance-requirements)
13. [Scalability Requirements](#13-scalability-requirements)
14. [Monitoring & Logging](#14-monitoring--logging)

---

## 1. Technology Stack Options

### 1.1 Recommended Stack Options

#### Option A: Node.js + TypeScript (Recommended for Rapid Development)
**Pros:**
- Large ecosystem and libraries
- JavaScript/TypeScript across stack
- Excellent async I/O performance
- Easy hiring and onboarding
- Rich framework options (NestJS, Express)

**Cons:**
- Memory-intensive for large datasets
- Callback/async complexity

**Best For:** Rapid development, full-stack JavaScript teams

#### Option B: Go (Recommended for Performance & Scalability)
**Pros:**
- Excellent performance and low memory footprint
- Built-in concurrency (goroutines)
- Fast compilation
- Static typing
- Simple deployment (single binary)

**Cons:**
- Smaller ecosystem vs Node.js
- Less flexible than dynamic languages
- Steeper learning curve

**Best For:** High-performance, scalable systems

#### Option C: Python + FastAPI
**Pros:**
- Rapid development
- Excellent AI/ML library support
- Clean, readable syntax
- Great for data processing

**Cons:**
- Slower runtime performance
- GIL limitations for concurrency

**Best For:** Projects with heavy AI/ML requirements

#### Option D: Kotlin (JVM)
**Pros:**
- Excellent type safety
- Seamless Java interop
- Modern language features
- Great for Android developers familiar with Kotlin

**Cons:**
- JVM overhead
- Longer startup times

**Best For:** Teams already using Kotlin for mobile

#### Option E: Java + Spring Boot
**Pros:**
- Enterprise-grade framework
- Mature ecosystem
- Strong typing
- Excellent tooling

**Cons:**
- Verbose code
- Slower development cycle
- JVM overhead

**Best For:** Enterprise environments, large teams

### 1.2 Recommended Primary Stack: **Go** or **Node.js + TypeScript**

**Final Recommendation:**
- **Go** for maximum performance and scalability
- **Node.js + TypeScript** for rapid development and JavaScript ecosystem

---

## 2. Architecture Pattern

### 2.1 Recommended: Modular Monolith (Start) → Microservices (Scale)

**Phase 1-2: Modular Monolith**
```
app/
├── api/                 # API layer (HTTP handlers)
├── core/                # Core business logic
│   ├── client/
│   ├── quote/
│   ├── job/
│   ├── invoice/
│   ├── payment/
│   ├── schedule/
│   ├── communication/
│   └── user/
├── infrastructure/      # External services
│   ├── database/
│   ├── cache/
│   ├── storage/
│   └── queue/
├── integrations/        # Third-party integrations
└── shared/              # Shared utilities
```

**Phase 3+: Migrate to Microservices if needed**
- Client Service
- Quote/Job Service
- Invoice/Payment Service
- Schedule Service
- Communication Service
- Notification Service
- Integration Service

### 2.2 Architecture Principles

**Clean Architecture / Hexagonal Architecture:**
- Domain layer (business logic) independent of infrastructure
- Dependency inversion (abstractions, not implementations)
- Testable business logic

**Layers:**
1. **API Layer**: HTTP handlers, request/response
2. **Application Layer**: Use cases, orchestration
3. **Domain Layer**: Business logic, entities
4. **Infrastructure Layer**: Database, external services

---

## 3. API Design

### 3.1 RESTful API Standards

**HTTP Methods:**
- `GET`: Retrieve resources
- `POST`: Create resources
- `PUT`: Update resources (full replacement)
- `PATCH`: Partial update
- `DELETE`: Delete resources

**URL Structure:**
```
/api/v1/{resource}
/api/v1/{resource}/{id}
/api/v1/{resource}/{id}/{sub-resource}
```

**Examples:**
```
GET    /api/v1/clients
GET    /api/v1/clients/{id}
POST   /api/v1/clients
PUT    /api/v1/clients/{id}
DELETE /api/v1/clients/{id}

GET    /api/v1/clients/{id}/jobs
POST   /api/v1/clients/{id}/jobs

GET    /api/v1/quotes
POST   /api/v1/quotes
GET    /api/v1/quotes/{id}
PATCH  /api/v1/quotes/{id}/approve
```

### 3.2 Request/Response Format

**Request Body (JSON):**
```json
{
  "data": {
    "type": "client",
    "attributes": {
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com"
    }
  }
}
```

**Success Response (200/201):**
```json
{
  "data": {
    "type": "client",
    "id": "123",
    "attributes": {
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com"
    }
  },
  "meta": {
    "timestamp": "2025-11-09T12:00:00Z"
  }
}
```

**Error Response (4xx/5xx):**
```json
{
  "errors": [
    {
      "status": "400",
      "code": "VALIDATION_ERROR",
      "title": "Validation Failed",
      "detail": "Email is required",
      "source": {
        "pointer": "/data/attributes/email"
      }
    }
  ]
}
```

### 3.3 Pagination

**Query Parameters:**
```
GET /api/v1/clients?page=2&limit=50&sort=-createdAt
```

**Response:**
```json
{
  "data": [...],
  "meta": {
    "page": 2,
    "limit": 50,
    "total": 1234,
    "totalPages": 25
  },
  "links": {
    "first": "/api/v1/clients?page=1&limit=50",
    "prev": "/api/v1/clients?page=1&limit=50",
    "next": "/api/v1/clients?page=3&limit=50",
    "last": "/api/v1/clients?page=25&limit=50"
  }
}
```

### 3.4 Filtering & Searching

```
GET /api/v1/clients?search=john
GET /api/v1/clients?filter[status]=active
GET /api/v1/jobs?filter[date][gte]=2025-01-01&filter[date][lte]=2025-12-31
```

### 3.5 API Versioning

**URL Versioning (Recommended):**
```
/api/v1/clients
/api/v2/clients
```

**Header Versioning (Alternative):**
```
Accept: application/vnd.jobber.v1+json
```

### 3.6 Rate Limiting

**Headers:**
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1609459200
```

**Limits:**
- Authenticated users: 1000 requests/hour
- Public API: 100 requests/hour
- Burst: 20 requests/second

---

## 4. Authentication & Authorization

### 4.1 Authentication Methods

**Primary: JWT (JSON Web Tokens)**
```
Authorization: Bearer <token>
```

**Token Structure:**
```json
{
  "sub": "user_id",
  "email": "user@example.com",
  "role": "owner",
  "accountId": "account_id",
  "iat": 1609459200,
  "exp": 1609545600
}
```

**Token Types:**
- Access Token: 1 hour expiry
- Refresh Token: 30 days expiry
- API Key: No expiry (for integrations)

### 4.2 Authentication Flow

**Login:**
```
POST /api/v1/auth/login
{
  "email": "user@example.com",
  "password": "password"
}

Response:
{
  "accessToken": "...",
  "refreshToken": "...",
  "expiresIn": 3600
}
```

**Refresh Token:**
```
POST /api/v1/auth/refresh
{
  "refreshToken": "..."
}

Response:
{
  "accessToken": "...",
  "expiresIn": 3600
}
```

### 4.3 Authorization (RBAC)

**Roles:**
- **Owner**: Full access
- **Admin**: All features except billing
- **Manager**: View all, edit jobs/schedules
- **Dispatcher**: Schedule and assign jobs
- **Worker**: View assigned jobs only
- **Limited Worker**: Clock in/out only

**Permissions:**
```
clients:read, clients:write, clients:delete
quotes:read, quotes:write, quotes:approve
jobs:read, jobs:write, jobs:complete
invoices:read, invoices:write, invoices:delete
payments:read, payments:write
team:read, team:write
reports:read
settings:read, settings:write
```

### 4.4 OAuth 2.0 (for Integrations)

**Supported Flows:**
- Authorization Code (for web apps)
- Client Credentials (for server-to-server)

**Scopes:**
```
read:clients write:clients
read:quotes write:quotes
read:jobs write:jobs
read:invoices write:invoices
```

### 4.5 Security Headers

```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
Content-Security-Policy: default-src 'self'
```

---

## 5. Database Requirements

### 5.1 Primary Database: PostgreSQL

**Why PostgreSQL:**
- ACID compliance
- JSON/JSONB support for flexible fields
- Full-text search
- Excellent performance
- PostGIS for geospatial queries
- Mature and reliable

**Version:** PostgreSQL 14+

### 5.2 Database Architecture

**Main Database:**
- Transactional data (clients, quotes, jobs, invoices)
- User and authentication data
- Configuration

**Read Replicas:**
- Reporting queries
- Analytics
- Load distribution

### 5.3 Connection Pooling

**Tool:** PgBouncer or built-in connection pooling

**Settings:**
- Pool size: 20-50 connections per instance
- Max client connections: 1000
- Statement timeout: 30 seconds

### 5.4 Database Optimization

**Indexes:**
- B-tree indexes on foreign keys
- GIN indexes for JSONB fields
- Full-text search indexes
- Composite indexes for common queries

**Partitioning:**
- Time-based partitioning for jobs/invoices (by year/month)
- Improves query performance and maintenance

**Query Optimization:**
- Use EXPLAIN ANALYZE for slow queries
- Optimize N+1 queries with JOINs or batching
- Use materialized views for complex reports

### 5.5 Backup Strategy

**Automated Backups:**
- Daily full backups
- Continuous WAL archiving
- 30-day retention
- Geographic redundancy

**Recovery:**
- Point-in-time recovery (PITR)
- Recovery Time Objective (RTO): < 1 hour
- Recovery Point Objective (RPO): < 5 minutes

---

## 6. Business Logic Layer

### 6.1 Domain-Driven Design

**Core Entities:**
- Client
- Contact
- Quote
- Job
- Invoice
- Payment
- Schedule
- TimeEntry
- User
- Team

**Aggregates:**
- Client Aggregate (Client + Contacts + Addresses)
- Quote Aggregate (Quote + LineItems)
- Job Aggregate (Job + Tasks + Forms + Photos)
- Invoice Aggregate (Invoice + LineItems + Payments)

**Value Objects:**
- Address
- Money
- PhoneNumber
- Email
- DateRange

### 6.2 Business Rules Examples

**Quote Business Rules:**
- Quote expiry date must be in future
- Quote total must equal sum of line items
- Cannot approve expired quote
- Deposit cannot exceed quote total

**Job Business Rules:**
- Cannot schedule job without assigned team member
- Cannot complete job without required forms
- Job must be assigned to available team member
- Cannot delete job with associated invoice

**Invoice Business Rules:**
- Invoice total must match completed job quote
- Cannot delete paid invoice
- Auto-generate invoice on job completion
- Send reminders based on due date

**Payment Business Rules:**
- Payment amount cannot exceed invoice balance
- Refund cannot exceed payment amount
- Apply payments to oldest invoices first

### 6.3 Service Layer Pattern

```go
// Example in Go
type QuoteService interface {
    CreateQuote(ctx context.Context, req CreateQuoteRequest) (*Quote, error)
    GetQuote(ctx context.Context, id string) (*Quote, error)
    UpdateQuote(ctx context.Context, id string, req UpdateQuoteRequest) (*Quote, error)
    SendQuote(ctx context.Context, id string) error
    ApproveQuote(ctx context.Context, id string, signature []byte) error
}
```

### 6.4 Event-Driven Architecture

**Domain Events:**
- ClientCreated
- QuoteSent
- QuoteApproved
- JobScheduled
- JobCompleted
- InvoiceSent
- PaymentReceived

**Event Handlers:**
- Send notifications
- Update analytics
- Trigger automations
- Sync to integrations

---

## 7. Third-Party Integrations

### 7.1 Payment Processing

**Primary: Stripe**
- Payment Intents API
- Setup Intents (save cards)
- Webhooks for payment status
- Connect for marketplace payments

**Alternative: Square**
- Terminal API for mobile payments
- Checkout API
- Webhooks

### 7.2 Communication

**SMS: Twilio**
- Send SMS
- Receive SMS (webhooks)
- Phone number provisioning

**Email: SendGrid**
- Transactional emails
- Email templates
- Tracking (opens, clicks)
- SMTP relay

### 7.3 Accounting

**QuickBooks Online API**
- OAuth 2.0 authentication
- Sync customers, invoices, payments
- Polling for changes
- Webhook subscriptions

### 7.4 Maps & Geolocation

**Google Maps API**
- Geocoding
- Distance Matrix
- Directions
- Places API

### 7.5 File Storage

**AWS S3 or CloudFlare R2**
- Image uploads (photos)
- Document attachments
- Invoice PDFs
- Backup storage

### 7.6 Push Notifications

**Firebase Cloud Messaging (FCM)**
- iOS and Android push notifications
- Topic-based notifications
- Data messages

---

## 8. File Storage

### 8.1 Storage Strategy

**Cloud Storage: S3-compatible**
- AWS S3 (primary)
- CloudFlare R2 (cost-effective alternative)
- DigitalOcean Spaces

**CDN:**
- CloudFront (AWS)
- CloudFlare CDN
- Fast global delivery

### 8.2 File Types

**Images:**
- Job photos (before/after)
- Profile photos
- Company logos
- Format: JPEG, PNG, WebP
- Max size: 10MB per image
- Automatic resizing and optimization

**Documents:**
- PDF attachments
- Invoices (generated PDFs)
- Quotes (generated PDFs)
- Format: PDF
- Max size: 20MB per document

**Videos:**
- Job videos
- Format: MP4, MOV
- Max size: 100MB
- Transcoding for web playback

### 8.3 Upload Flow

**Direct Upload (Presigned URLs):**
1. Client requests upload URL
2. Server generates presigned URL (S3)
3. Client uploads directly to S3
4. Client notifies server of completion
5. Server validates and processes

**Benefits:**
- Reduces server bandwidth
- Faster uploads
- Better scalability

### 8.4 Security

**Access Control:**
- Private buckets (not public)
- Signed URLs for access (time-limited)
- Encryption at rest (AES-256)
- Encryption in transit (HTTPS)

**Virus Scanning:**
- Scan uploads for malware
- Reject infected files

---

## 9. Background Jobs & Queues

### 9.1 Message Queue

**Options:**
- **Redis** (simple, fast)
- **RabbitMQ** (feature-rich)
- **AWS SQS** (managed)

**Recommended:** Redis for simplicity, RabbitMQ for complex workflows

### 9.2 Job Types

**High Priority:**
- Send notifications (SMS, email)
- Process payments
- Real-time sync (QuickBooks)

**Medium Priority:**
- Generate PDFs (invoices, quotes)
- Image processing (resize, optimize)
- Send reports

**Low Priority:**
- Data exports
- Cleanup old data
- Analytics processing

### 9.3 Queue Structure

```
queues:
  - notifications.high
  - notifications.low
  - payments
  - pdf.generation
  - image.processing
  - sync.quickbooks
  - reports
  - analytics
```

### 9.4 Retry Logic

**Exponential Backoff:**
- 1st retry: 1 minute
- 2nd retry: 5 minutes
- 3rd retry: 15 minutes
- 4th retry: 1 hour
- 5th retry: 6 hours
- Max retries: 5

**Dead Letter Queue:**
- Failed jobs after max retries
- Manual review and reprocessing

### 9.5 Scheduled Jobs (Cron)

**Daily:**
- Send invoice reminders
- Generate daily reports
- Cleanup temp files
- Backup databases

**Hourly:**
- Sync QuickBooks data
- Process automations
- Update analytics

**Every 15 minutes:**
- Process pending notifications
- Check payment status

---

## 10. Caching Strategy

### 10.1 Cache Technology: Redis

**Use Cases:**
- Session storage
- API response caching
- Database query caching
- Rate limiting
- Real-time features

### 10.2 Cache Patterns

**Cache-Aside (Lazy Loading):**
```
1. Check cache
2. If miss, query database
3. Store in cache
4. Return result
```

**Write-Through:**
```
1. Write to database
2. Write to cache
3. Return result
```

**Cache Invalidation:**
- Time-based (TTL)
- Event-based (on updates)

### 10.3 What to Cache

**High Priority (Long TTL):**
- User permissions (30 minutes)
- Settings and config (1 hour)
- Product/service catalog (1 hour)

**Medium Priority (Medium TTL):**
- Client data (15 minutes)
- Quote/invoice lists (5 minutes)

**Low Priority (Short TTL):**
- Dashboard data (1 minute)
- Real-time updates (30 seconds)

**Never Cache:**
- Payment information
- Sensitive personal data
- Real-time job status

### 10.4 Cache Keys Convention

```
{entity}:{id}                     # client:123
{entity}:{id}:{sub}               # client:123:jobs
{entity}:list:{filters}           # clients:list:status:active
session:{session_id}              # session:xyz
ratelimit:{ip}:{endpoint}         # ratelimit:1.2.3.4:/api/v1/quotes
```

---

## 11. Security Requirements

### 11.1 Data Encryption

**At Rest:**
- Database encryption (PostgreSQL pgcrypto)
- File storage encryption (S3 SSE)
- Backup encryption

**In Transit:**
- TLS 1.3
- HTTPS only (no HTTP)
- Certificate pinning (mobile apps)

**Sensitive Data:**
- Payment information: PCI-DSS compliant (tokenization)
- Passwords: bcrypt (cost factor 12)
- API keys: encrypted storage

### 11.2 Input Validation

**Server-Side Validation:**
- Validate all inputs
- Sanitize HTML
- SQL injection prevention (parameterized queries)
- XSS prevention
- CSRF tokens

**Data Type Validation:**
- Email format
- Phone number format
- URL validation
- File type validation
- File size limits

### 11.3 Authentication Security

**Password Policy:**
- Minimum 8 characters
- Complexity requirements
- Password history (prevent reuse)
- Account lockout after 5 failed attempts
- Password reset with email verification

**Two-Factor Authentication (2FA):**
- TOTP (Time-based One-Time Password)
- SMS backup codes
- Recovery codes

**Session Management:**
- Secure session cookies (HttpOnly, Secure, SameSite)
- Session timeout (24 hours)
- Logout invalidates tokens

### 11.4 Authorization Security

**Principle of Least Privilege:**
- Users get minimum required permissions
- Role-based access control (RBAC)
- Resource-level permissions

**Multi-Tenancy Security:**
- Data isolation per account
- Query filtering by account ID
- Prevent cross-account access

### 11.5 API Security

**Rate Limiting:**
- Prevent abuse
- Per-user and per-IP limits
- Exponential backoff

**API Keys:**
- Rotation policy
- Scope limitations
- Usage tracking

**CORS:**
- Whitelist allowed origins
- Restrict methods and headers

### 11.6 Audit Logging

**Log Security Events:**
- Login attempts (success/failure)
- Password changes
- Permission changes
- Data exports
- Payment transactions
- API access

**Log Retention:**
- 90 days minimum
- Tamper-proof logs
- Centralized logging

---

## 12. Performance Requirements

### 12.1 Response Time Targets

**API Endpoints:**
- Simple queries (GET): < 200ms
- Complex queries (search, reports): < 1 second
- Mutations (POST, PUT): < 500ms
- File uploads: Progress indication

**Database Queries:**
- Simple queries: < 50ms
- Complex joins: < 200ms
- Reports: < 2 seconds

### 12.2 Throughput

**Concurrent Users:**
- Support 1,000 concurrent users (Phase 1)
- Support 10,000 concurrent users (Phase 3)

**Requests Per Second:**
- 500 RPS (Phase 1)
- 5,000 RPS (Phase 3)

### 12.3 Optimization Techniques

**Database:**
- Query optimization (indexes, EXPLAIN)
- Connection pooling
- Read replicas for reports
- Caching frequent queries

**API:**
- Response compression (gzip)
- Pagination for large datasets
- Lazy loading
- GraphQL for flexible queries (optional)

**Background Processing:**
- Offload heavy tasks to queues
- Batch processing
- Parallel processing

---

## 13. Scalability Requirements

### 13.1 Horizontal Scaling

**Stateless Application:**
- No in-memory session storage
- Session in Redis
- Load balancer distribution

**Auto-Scaling:**
- Scale based on CPU/memory
- Scale based on request rate
- Min 2 instances, max 20 instances

### 13.2 Database Scaling

**Read Replicas:**
- 1 primary, 2+ replicas
- Route read queries to replicas
- Reporting queries to dedicated replica

**Connection Pooling:**
- PgBouncer or built-in pooling
- Reuse connections

**Sharding (Future):**
- Shard by account ID
- Separate databases for large customers

### 13.3 Caching Layer

**Redis Cluster:**
- High availability
- Automatic failover
- Data partitioning

### 13.4 CDN

**Static Assets:**
- Images, CSS, JavaScript
- Global distribution
- Cache invalidation

---

## 14. Monitoring & Logging

### 14.1 Application Monitoring

**Metrics to Track:**
- Request rate (RPS)
- Response time (avg, p95, p99)
- Error rate (4xx, 5xx)
- CPU and memory usage
- Database connections
- Queue length

**Tools:**
- Prometheus (metrics collection)
- Grafana (visualization)
- DataDog (alternative all-in-one)

### 14.2 Logging

**Log Levels:**
- ERROR: Errors requiring attention
- WARN: Potential issues
- INFO: Important events
- DEBUG: Detailed debugging (dev only)

**Structured Logging (JSON):**
```json
{
  "timestamp": "2025-11-09T12:00:00Z",
  "level": "INFO",
  "message": "User logged in",
  "userId": "123",
  "accountId": "456",
  "ip": "1.2.3.4",
  "traceId": "abc-def-ghi"
}
```

**Centralized Logging:**
- ELK Stack (Elasticsearch, Logstash, Kibana)
- CloudWatch Logs (AWS)
- Log retention: 30 days

### 14.3 Error Tracking

**Tool:** Sentry or Rollbar

**Capture:**
- Exceptions and stack traces
- User context
- Request context
- Breadcrumbs

### 14.4 Alerting

**Alert Conditions:**
- Error rate > 1%
- Response time > 2 seconds
- Database connection failure
- Queue backup > 1000 jobs
- Disk usage > 80%

**Alert Channels:**
- PagerDuty (on-call)
- Slack (team notifications)
- Email (non-urgent)

### 14.5 Health Checks

**Endpoints:**
```
GET /health          # Basic health check
GET /health/ready    # Ready to accept traffic
GET /health/live     # Application is running
```

**Checks:**
- Database connectivity
- Redis connectivity
- Queue connectivity
- Disk space

---

## Technology Stack Summary

### Recommended Primary Stack

**Backend Framework:**
- **Go** with Gin or Echo, OR
- **Node.js + TypeScript** with NestJS

**Database:**
- PostgreSQL 14+

**Cache:**
- Redis 6+

**Message Queue:**
- Redis (simple) or RabbitMQ (complex)

**File Storage:**
- AWS S3 or CloudFlare R2

**Search:**
- PostgreSQL Full-Text Search (simple)
- Elasticsearch (advanced)

**Background Jobs:**
- Bull (Node.js) or Asynq (Go)

**API Documentation:**
- OpenAPI 3.0 (Swagger)

---

## Document Version Control
- **Version:** 1.0
- **Last Updated:** 2025-11-09
- **Status:** Complete
