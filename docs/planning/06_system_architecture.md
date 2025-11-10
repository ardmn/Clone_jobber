# System Architecture

## Document Information
- **Version:** 1.0
- **Last Updated:** 2025-11-09
- **Status:** Complete

---

## 1. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                          CLIENT LAYER                                │
├───────────────────┬──────────────────────┬──────────────────────────┤
│   Web Browser     │  iOS App (KMP)       │  Android App (KMP)       │
│   (React/Next.js) │  (Compose MP)        │  (Compose MP)            │
└───────────────────┴──────────────────────┴──────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                           CDN / LOAD BALANCER                        │
│                        (CloudFlare / AWS ALB)                        │
└─────────────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        API GATEWAY / NGINX                           │
│          (Rate Limiting, SSL Termination, Routing)                   │
└─────────────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      APPLICATION LAYER                               │
│                    (Go / Node.js Backend)                            │
│                     [Auto-Scaling Group]                             │
├─────────────────────────────────────────────────────────────────────┤
│  │ REST API Handlers                                                 │
│  │ Business Logic Services                                           │
│  │ Authentication & Authorization                                    │
│  │ WebSocket Handlers (Real-time)                                    │
└─────────────────────────────────────────────────────────────────────┘
                              ▼
┌───────────────────┬───────────────────┬──────────────────┬──────────┐
│   PostgreSQL      │    Redis Cache    │  Message Queue   │  S3      │
│   (Primary + Read │  (Session, Cache) │  (Background     │  (Files) │
│   Replicas)       │                   │   Jobs)          │          │
└───────────────────┴───────────────────┴──────────────────┴──────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      EXTERNAL SERVICES                               │
├───────────────────┬───────────────────┬──────────────────────────────┤
│  Stripe/Square    │  Twilio/SendGrid  │  QuickBooks API              │
│  (Payments)       │  (SMS/Email)      │  (Accounting)                │
└───────────────────┴───────────────────┴──────────────────────────────┘
```

---

## 2. Deployment Architecture (AWS Example)

```
┌─────────────────────────────────────────────────────────────────────┐
│                            AWS Cloud                                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌─────────────────────── VPC ──────────────────────────┐          │
│  │                                                        │          │
│  │  ┌─── Public Subnet (AZ-1) ───┐  ┌─ Public (AZ-2) ─┐ │          │
│  │  │  • ALB (Load Balancer)     │  │  • ALB           │ │          │
│  │  │  • NAT Gateway             │  │  • NAT Gateway   │ │          │
│  │  └────────────────────────────┘  └──────────────────┘ │          │
│  │                                                        │          │
│  │  ┌─── Private Subnet (AZ-1) ──┐  ┌─ Private (AZ-2) ─┐ │          │
│  │  │  • API Server (EC2/ECS)    │  │  • API Server    │ │          │
│  │  │  • Background Workers      │  │  • Workers       │ │          │
│  │  └────────────────────────────┘  └──────────────────┘ │          │
│  │                                                        │          │
│  │  ┌─── Data Subnet (AZ-1) ─────┐  ┌─ Data (AZ-2) ────┐ │          │
│  │  │  • RDS PostgreSQL (Primary)│  │  • RDS (Replica) │ │          │
│  │  │  • ElastiCache Redis       │  │  • ElastiCache   │ │          │
│  │  └────────────────────────────┘  └──────────────────┘ │          │
│  └────────────────────────────────────────────────────────┘          │
│                                                                       │
│  ┌─ S3 Buckets ──────────────────────────────────────────┐          │
│  │  • User Uploads (Private)                             │          │
│  │  • Generated PDFs                                     │          │
│  │  • Static Assets → CloudFront CDN                     │          │
│  └───────────────────────────────────────────────────────┘          │
│                                                                       │
│  ┌─ Additional Services ─────────────────────────────────┐          │
│  │  • Route53 (DNS)                                      │          │
│  │  • CloudWatch (Monitoring)                            │          │
│  │  • SQS (Message Queue)                                │          │
│  │  • SNS (Notifications)                                │          │
│  │  • Secrets Manager (API Keys)                         │          │
│  └───────────────────────────────────────────────────────┘          │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 3. Application Architecture (Modular Monolith)

### 3.1 Module Structure

```
app/
├── cmd/                    # Application entry points
│   ├── api/                # REST API server
│   └── worker/             # Background worker
│
├── internal/
│   ├── modules/            # Business modules
│   │   ├── auth/
│   │   │   ├── handler.go      # HTTP handlers
│   │   │   ├── service.go      # Business logic
│   │   │   ├── repository.go   # Data access
│   │   │   └── model.go        # Domain models
│   │   │
│   │   ├── client/
│   │   │   ├── handler.go
│   │   │   ├── service.go
│   │   │   └── repository.go
│   │   │
│   │   ├── quote/
│   │   ├── job/
│   │   ├── invoice/
│   │   ├── payment/
│   │   ├── schedule/
│   │   ├── communication/
│   │   └── report/
│   │
│   ├── platform/           # Shared infrastructure
│   │   ├── database/
│   │   ├── cache/
│   │   ├── queue/
│   │   ├── storage/
│   │   └── logger/
│   │
│   ├── integrations/       # Third-party integrations
│   │   ├── stripe/
│   │   ├── twilio/
│   │   ├── sendgrid/
│   │   └── quickbooks/
│   │
│   └── shared/             # Shared utilities
│       ├── errors/
│       ├── middleware/
│       └── utils/
│
└── pkg/                    # Public packages
    └── api/                # API clients
```

### 3.2 Layered Architecture per Module

```
┌─────────────────────────────────────┐
│     HTTP Handler Layer              │  ← Request/Response
│  (Validation, Serialization)        │
└─────────────────────────────────────┘
            ▼
┌─────────────────────────────────────┐
│     Service Layer                   │  ← Business Logic
│  (Use Cases, Domain Logic)          │
└─────────────────────────────────────┘
            ▼
┌─────────────────────────────────────┐
│     Repository Layer                │  ← Data Access
│  (Database, Cache)                  │
└─────────────────────────────────────┘
            ▼
┌─────────────────────────────────────┐
│     Infrastructure Layer            │  ← External Systems
│  (Database, Queue, Storage)         │
└─────────────────────────────────────┘
```

---

## 4. Database Architecture

### 4.1 Primary Database (PostgreSQL)

**Configuration:**
- Instance: db.r5.xlarge (4 vCPU, 32GB RAM) - Start
- Storage: 500GB SSD (GP3)
- Backups: Automated daily, 30-day retention
- Multi-AZ: Yes (for high availability)

**Read Replicas:**
- 2x Read Replicas (same spec as primary)
- Route read-only queries to replicas
- Automatic failover for primary

**Connection Pool:**
- Max connections: 200 per instance
- Pool size per application instance: 20
- PgBouncer for connection pooling

### 4.2 Database Sharding (Future)

**Shard by Account ID:**
```
Shard 1: accounts 0000-3333
Shard 2: accounts 3334-6666
Shard 3: accounts 6667-9999
```

**Benefits:**
- Distribute load across multiple databases
- Isolate large customers
- Improved performance at scale

---

## 5. Caching Architecture (Redis)

### 5.1 Redis Cluster

**Configuration:**
- Instance: cache.r5.large (2 vCPU, 13GB RAM)
- Cluster mode: Enabled
- Nodes: 3 primary + 3 replica
- Multi-AZ: Yes

### 5.2 Cache Strategy

**Cache Keys:**
```
user:{userId}:profile           TTL: 30 min
account:{accountId}:settings    TTL: 1 hour
client:{clientId}:details       TTL: 15 min
schedule:{userId}:{date}        TTL: 5 min
ratelimit:{ip}:{endpoint}       TTL: 1 hour
session:{sessionId}             TTL: 24 hours
```

**Cache Patterns:**
- Cache-aside for user data
- Write-through for settings
- TTL-based expiration
- Event-based invalidation

---

## 6. Message Queue Architecture

### 6.1 Queue Options

**Option A: Redis (Simple)**
- Use Redis as message queue
- Bull queue library (Node.js) or Asynq (Go)
- Good for moderate workloads

**Option B: RabbitMQ (Advanced)**
- Dedicated message broker
- Multiple queues with priorities
- Dead letter queues
- Better for complex workflows

**Option C: AWS SQS (Managed)**
- Fully managed
- Auto-scaling
- No infrastructure management

### 6.2 Queue Structure

```
Queues:
├── notifications.high        # Urgent notifications
├── notifications.standard    # Regular notifications
├── pdf.generation            # PDF generation jobs
├── image.processing          # Image optimization
├── email.send                # Email sending
├── sms.send                  # SMS sending
├── payment.processing        # Payment jobs
├── sync.quickbooks           # QuickBooks sync
├── reports.generation        # Report generation
└── cleanup                   # Cleanup tasks
```

### 6.3 Job Processing

**Worker Configuration:**
```
Workers:
  Notifications: 5 workers
  PDF Generation: 3 workers
  Image Processing: 2 workers
  Email/SMS: 10 workers
  Payments: 5 workers
  Sync: 2 workers
```

**Retry Strategy:**
- Exponential backoff: 1m, 5m, 15m, 1h, 6h
- Max retries: 5
- Dead letter queue for failed jobs
- Alert on repeated failures

---

## 7. File Storage Architecture

### 7.1 S3 Structure

```
bucket-name/
├── uploads/
│   ├── {accountId}/
│   │   ├── jobs/
│   │   │   └── {jobId}/
│   │   │       ├── photo-1.jpg
│   │   │       └── photo-2.jpg
│   │   ├── clients/
│   │   │   └── {clientId}/
│   │   │       └── avatar.jpg
│   │   └── invoices/
│   │       └── {invoiceId}.pdf
│   └── temp/               # Temporary uploads
│
├── static/                 # Static assets
│   ├── images/
│   ├── css/
│   └── js/
│
└── backups/               # Database backups
    └── {date}/
```

### 7.2 CDN Configuration

**CloudFront Distribution:**
- Origin: S3 bucket (static assets)
- Edge locations: Global
- Cache behavior: 1 year for static assets
- Compression: Gzip/Brotli enabled
- SSL: Custom certificate

---

## 8. API Architecture

### 8.1 RESTful API Design

**Base URL:**
```
https://api.jobber-clone.com/v1
```

**Endpoints:**
```
Authentication:
POST   /auth/login
POST   /auth/refresh
POST   /auth/logout

Clients:
GET    /clients
POST   /clients
GET    /clients/{id}
PUT    /clients/{id}
DELETE /clients/{id}
GET    /clients/{id}/jobs
GET    /clients/{id}/invoices

Quotes:
GET    /quotes
POST   /quotes
GET    /quotes/{id}
PUT    /quotes/{id}
POST   /quotes/{id}/send
POST   /quotes/{id}/approve
POST   /quotes/{id}/decline

Jobs:
GET    /jobs
POST   /jobs
GET    /jobs/{id}
PUT    /jobs/{id}
POST   /jobs/{id}/complete
POST   /jobs/{id}/cancel

Invoices:
GET    /invoices
POST   /invoices
GET    /invoices/{id}
POST   /invoices/{id}/send
POST   /invoices/{id}/payments

Payments:
POST   /payments
GET    /payments/{id}
POST   /payments/{id}/refund

Schedule:
GET    /schedule
POST   /schedule/jobs
PUT    /schedule/jobs/{id}

Reports:
GET    /reports/dashboard
GET    /reports/revenue
GET    /reports/jobs
```

### 8.2 WebSocket API (Real-time)

**Connection:**
```
wss://api.jobber-clone.com/ws
```

**Events:**
```
Server → Client:
- job.updated
- invoice.paid
- message.received
- notification.new
- schedule.changed

Client → Server:
- subscribe
- unsubscribe
- ping
```

---

## 9. Security Architecture

### 9.1 Network Security

**Firewall Rules:**
```
Public Subnets:
- Allow HTTPS (443) from anywhere
- Allow HTTP (80) from anywhere (redirect to HTTPS)

Private Subnets (API Servers):
- Allow traffic from ALB only
- Allow outbound to internet via NAT Gateway

Data Subnets (Databases):
- Allow traffic from API servers only
- No internet access
```

### 9.2 Application Security

**Security Layers:**
1. WAF (Web Application Firewall)
   - SQL injection protection
   - XSS protection
   - Rate limiting
   - Bot detection

2. API Gateway
   - Authentication validation
   - Rate limiting per user/IP
   - Request validation

3. Application
   - Input validation
   - Output encoding
   - SQL parameterization
   - CSRF protection

### 9.3 Data Security

**Encryption:**
- At rest: AES-256 encryption for databases and S3
- In transit: TLS 1.3 for all connections
- Secrets: AWS Secrets Manager for API keys

**Access Control:**
- IAM roles for AWS resources
- Principle of least privilege
- Multi-factor authentication for admin access

---

## 10. Monitoring & Observability

### 10.1 Metrics (Prometheus + Grafana)

**Application Metrics:**
- Request rate (RPS)
- Response time (p50, p95, p99)
- Error rate (4xx, 5xx)
- Active connections
- Queue depth

**System Metrics:**
- CPU usage
- Memory usage
- Disk I/O
- Network I/O

**Business Metrics:**
- Jobs completed
- Invoices sent
- Payments processed
- Active users

### 10.2 Logging (ELK Stack)

**Log Collection:**
- Application logs → FluentBit → Elasticsearch
- System logs → CloudWatch → Elasticsearch
- Access logs → S3 → Elasticsearch

**Log Levels:**
- ERROR: Critical issues
- WARN: Warnings
- INFO: Important events
- DEBUG: Detailed debugging (dev only)

**Log Retention:**
- Hot storage: 7 days
- Warm storage: 30 days
- Cold storage (S3): 1 year

### 10.3 Tracing (Jaeger/Zipkin)

**Distributed Tracing:**
- Trace requests across services
- Identify bottlenecks
- Debug performance issues
- Track request flow

### 10.4 Alerting

**Alert Rules:**
```
Critical (PagerDuty):
- Error rate > 5%
- API response time > 5s
- Database connection failure
- Payment processing failure

Warning (Slack):
- Error rate > 1%
- API response time > 2s
- Queue depth > 1000
- Disk usage > 80%

Info (Email):
- Deployment completed
- Scheduled maintenance
- Weekly reports
```

---

## 11. Scalability Strategy

### 11.1 Horizontal Scaling

**Auto-Scaling Groups:**
```
API Servers:
- Min instances: 2
- Max instances: 20
- Scale up: CPU > 70% or RPS > 500
- Scale down: CPU < 30% and RPS < 100

Background Workers:
- Min instances: 1
- Max instances: 10
- Scale up: Queue depth > 500
- Scale down: Queue depth < 50
```

### 11.2 Vertical Scaling

**Database:**
- Start: db.r5.xlarge (4 vCPU, 32GB)
- Scale: db.r5.2xlarge (8 vCPU, 64GB)
- Scale: db.r5.4xlarge (16 vCPU, 128GB)

**Cache:**
- Start: cache.r5.large (2 vCPU, 13GB)
- Scale: cache.r5.xlarge (4 vCPU, 26GB)

### 11.3 Database Optimization

**Read Scaling:**
- Add read replicas
- Route read queries to replicas
- Use caching for frequently accessed data

**Write Scaling:**
- Optimize indexes
- Batch inserts where possible
- Consider database sharding (future)

---

## 12. Disaster Recovery

### 12.1 Backup Strategy

**Database Backups:**
- Automated daily snapshots
- WAL (Write-Ahead Log) archiving
- 30-day retention
- Cross-region backup replication

**Application Backups:**
- S3 versioning enabled
- Cross-region replication
- Lifecycle policies

### 12.2 Recovery Objectives

- **RTO (Recovery Time Objective):** < 1 hour
- **RPO (Recovery Point Objective):** < 5 minutes

### 12.3 Failover Procedures

**Database Failover:**
1. Automatic failover to standby (Multi-AZ)
2. DNS update (Route53)
3. Application reconnects automatically
4. Manual intervention if automatic fails

**Application Failover:**
1. Load balancer detects unhealthy instances
2. Traffic routed to healthy instances
3. Auto-scaling replaces failed instances
4. Alerts sent to operations team

---

## 13. Performance Targets

### 13.1 Response Time SLAs

```
API Endpoints:
- Simple GET: < 200ms (p95)
- Complex GET: < 1s (p95)
- POST/PUT: < 500ms (p95)
- File uploads: Progress tracking

Database Queries:
- Simple queries: < 50ms
- Complex queries: < 200ms
- Reports: < 2s

Page Load (Web):
- First contentful paint: < 1.5s
- Time to interactive: < 3s
```

### 13.2 Throughput Targets

```
Phase 1 (MVP):
- 1,000 concurrent users
- 500 RPS

Phase 2 (Scale):
- 5,000 concurrent users
- 2,500 RPS

Phase 3 (Growth):
- 10,000 concurrent users
- 5,000 RPS
```

### 13.3 Availability SLA

- **Uptime Target:** 99.9% (43 minutes downtime/month)
- **Planned Maintenance:** Off-peak hours, advance notice

---

## Document Version Control
- **Version:** 1.0
- **Last Updated:** 2025-11-09
- **Status:** Complete
