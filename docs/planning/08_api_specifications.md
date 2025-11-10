# API Specifications

## Document Information
- **Version:** 1.0
- **Last Updated:** 2025-11-09
- **Status:** Complete

---

## Base URL
```
Production: https://api.jobber-clone.com/v1
Staging: https://api-staging.jobber-clone.com/v1
Development: http://localhost:8080/v1
```

---

## Authentication

### Login
```
POST /auth/login
Content-Type: application/json

Request:
{
  "email": "user@example.com",
  "password": "password123"
}

Response: 200 OK
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "expiresIn": 3600,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "owner"
  }
}
```

### Refresh Token
```
POST /auth/refresh
Authorization: Bearer {refreshToken}

Response: 200 OK
{
  "accessToken": "new_token",
  "expiresIn": 3600
}
```

---

## Clients API

### List Clients
```
GET /clients?page=1&limit=50&search=john&status=active
Authorization: Bearer {token}

Response: 200 OK
{
  "data": [
    {
      "id": "uuid",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "phone": "+1234567890",
      "status": "active",
      "createdAt": "2025-01-01T00:00:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 50,
    "total": 150,
    "totalPages": 3
  }
}
```

### Create Client
```
POST /clients
Authorization: Bearer {token}
Content-Type: application/json

Request:
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "addresses": [
    {
      "type": "service",
      "street1": "123 Main St",
      "city": "New York",
      "state": "NY",
      "postalCode": "10001"
    }
  ]
}

Response: 201 Created
{
  "data": {
    "id": "uuid",
    "firstName": "John",
    // ... full client object
  }
}
```

### Get Client
```
GET /clients/{id}
Authorization: Bearer {token}

Response: 200 OK
{
  "data": {
    "id": "uuid",
    "firstName": "John",
    "lastName": "Doe",
    // ... full details
    "addresses": [...],
    "contacts": [...]
  }
}
```

---

## Quotes API

### Create Quote
```
POST /quotes
Authorization: Bearer {token}

Request:
{
  "clientId": "uuid",
  "title": "Lawn Maintenance",
  "lineItems": [
    {
      "name": "Mowing",
      "quantity": 1,
      "unitPrice": 50.00
    }
  ],
  "taxRate": 0.08,
  "expiryDate": "2025-12-31"
}

Response: 201 Created
{
  "data": {
    "id": "uuid",
    "quoteNumber": "Q-00001",
    "status": "draft",
    "total": 54.00
  }
}
```

### Send Quote
```
POST /quotes/{id}/send
Authorization: Bearer {token}

Request:
{
  "method": "email",
  "message": "Please review this quote"
}

Response: 200 OK
{
  "data": {
    "id": "uuid",
    "status": "sent",
    "sentAt": "2025-01-15T10:00:00Z"
  }
}
```

### Approve Quote (Client Portal)
```
POST /quotes/{id}/approve
Authorization: Bearer {clientToken}

Request:
{
  "signature": "base64_signature_data",
  "ipAddress": "1.2.3.4"
}

Response: 200 OK
{
  "data": {
    "id": "uuid",
    "status": "approved",
    "approvedAt": "2025-01-15T10:30:00Z"
  }
}
```

---

## Jobs API

### List Jobs
```
GET /jobs?date=2025-01-15&status=scheduled&assignedTo=uuid
Authorization: Bearer {token}

Response: 200 OK
{
  "data": [
    {
      "id": "uuid",
      "jobNumber": "J-00001",
      "title": "Lawn Maintenance",
      "status": "scheduled",
      "scheduledStart": "2025-01-15T09:00:00Z",
      "client": {
        "id": "uuid",
        "name": "John Doe"
      }
    }
  ]
}
```

### Create Job
```
POST /jobs
Authorization: Bearer {token}

Request:
{
  "clientId": "uuid",
  "quoteId": "uuid",
  "title": "Lawn Maintenance",
  "scheduledStart": "2025-01-15T09:00:00Z",
  "scheduledEnd": "2025-01-15T10:00:00Z",
  "assignedTo": ["user-uuid-1", "user-uuid-2"]
}

Response: 201 Created
```

### Complete Job
```
POST /jobs/{id}/complete
Authorization: Bearer {token}

Request:
{
  "signature": "base64_signature",
  "photos": ["photo-id-1", "photo-id-2"],
  "completionNotes": "Job completed successfully"
}

Response: 200 OK
{
  "data": {
    "id": "uuid",
    "status": "completed",
    "completedAt": "2025-01-15T10:00:00Z"
  }
}
```

---

## Invoices API

### Create Invoice
```
POST /invoices
Authorization: Bearer {token}

Request:
{
  "clientId": "uuid",
  "jobId": "uuid",
  "dueDate": "2025-02-15",
  "lineItems": [...]
}

Response: 201 Created
```

### Send Invoice
```
POST /invoices/{id}/send
Authorization: Bearer {token}

Request:
{
  "method": "email"
}

Response: 200 OK
```

---

## Payments API

### Create Payment
```
POST /payments
Authorization: Bearer {token}

Request:
{
  "invoiceId": "uuid",
  "amount": 100.00,
  "paymentMethod": "card",
  "paymentMethodId": "pm_stripe_id"
}

Response: 201 Created
{
  "data": {
    "id": "uuid",
    "status": "completed",
    "amount": 100.00
  }
}
```

### Process Card Payment
```
POST /payments/card
Authorization: Bearer {token}

Request:
{
  "invoiceId": "uuid",
  "amount": 100.00,
  "paymentMethodId": "pm_xxx",
  "saveCard": true
}

Response: 200 OK
```

---

## Schedule API

### Get Schedule
```
GET /schedule?start=2025-01-01&end=2025-01-31&userId=uuid
Authorization: Bearer {token}

Response: 200 OK
{
  "data": [
    {
      "id": "uuid",
      "job": {...},
      "start": "2025-01-15T09:00:00Z",
      "end": "2025-01-15T10:00:00Z",
      "assignedTo": [...]
    }
  ]
}
```

### Update Schedule
```
PUT /schedule/jobs/{id}
Authorization: Bearer {token}

Request:
{
  "scheduledStart": "2025-01-15T10:00:00Z",
  "scheduledEnd": "2025-01-15T11:00:00Z",
  "assignedTo": ["uuid"]
}

Response: 200 OK
```

---

## Time Tracking API

### Clock In
```
POST /time-entries/clock-in
Authorization: Bearer {token}

Request:
{
  "jobId": "uuid",
  "latitude": 40.7128,
  "longitude": -74.0060
}

Response: 201 Created
{
  "data": {
    "id": "uuid",
    "startTime": "2025-01-15T09:00:00Z",
    "status": "active"
  }
}
```

### Clock Out
```
POST /time-entries/{id}/clock-out
Authorization: Bearer {token}

Request:
{
  "latitude": 40.7128,
  "longitude": -74.0060,
  "notes": "Work completed"
}

Response: 200 OK
```

---

## Reports API

### Dashboard
```
GET /reports/dashboard?startDate=2025-01-01&endDate=2025-01-31
Authorization: Bearer {token}

Response: 200 OK
{
  "data": {
    "revenue": {
      "current": 50000.00,
      "previous": 45000.00,
      "growth": 11.1
    },
    "jobsCompleted": 125,
    "outstandingInvoices": 15000.00
  }
}
```

---

## Webhooks

### Register Webhook
```
POST /webhooks
Authorization: Bearer {token}

Request:
{
  "url": "https://your-app.com/webhook",
  "events": ["invoice.paid", "job.completed"],
  "secret": "webhook_secret"
}

Response: 201 Created
```

### Webhook Payload Example
```
POST https://your-app.com/webhook
X-Webhook-Signature: sha256_signature

{
  "event": "invoice.paid",
  "data": {
    "invoiceId": "uuid",
    "amount": 100.00,
    "paidAt": "2025-01-15T10:00:00Z"
  },
  "timestamp": "2025-01-15T10:00:01Z"
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "errors": [
    {
      "code": "VALIDATION_ERROR",
      "message": "Email is required",
      "field": "email"
    }
  ]
}
```

### 401 Unauthorized
```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid or expired token"
  }
}
```

### 403 Forbidden
```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "You do not have permission to access this resource"
  }
}
```

### 404 Not Found
```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Resource not found"
  }
}
```

### 429 Rate Limit
```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests",
    "retryAfter": 60
  }
}
```

### 500 Server Error
```json
{
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "An unexpected error occurred"
  }
}
```

---

## Rate Limiting

**Headers:**
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1609459200
```

**Limits:**
- Authenticated: 1000 req/hour
- Public: 100 req/hour
- Burst: 20 req/second

---

## Document Version
- **Version:** 1.0
- **Last Updated:** 2025-11-09
- **Status:** Complete
