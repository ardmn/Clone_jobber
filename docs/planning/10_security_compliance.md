# Security & Compliance

## Document Information
- **Version:** 1.0
- **Last Updated:** 2025-11-09
- **Status:** Complete

---

## 1. Data Encryption

### At Rest
- Database: PostgreSQL encryption (pgcrypto)
- Files: S3 Server-Side Encryption (SSE-S3 or SSE-KMS)
- Backups: Encrypted before storage
- Algorithm: AES-256

### In Transit
- TLS 1.3 for all connections
- HTTPS only (no HTTP)
- Certificate from trusted CA
- HSTS header enabled

---

## 2. Authentication

### Password Requirements
- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 number
- At least 1 special character
- No common passwords (check against list)

### Password Storage
```javascript
const bcrypt = require('bcrypt');
const saltRounds = 12;
const hash = await bcrypt.hash(password, saltRounds);
```

### Account Lockout
- 5 failed attempts → lock for 15 minutes
- 10 failed attempts → lock for 1 hour
- Notify user via email

### Two-Factor Authentication (2FA)
- TOTP (Time-based One-Time Password)
- Backup codes (10 codes)
- Recovery via email

---

## 3. Authorization

### Role-Based Access Control (RBAC)
```
Roles:
- owner: Full access
- admin: All features except billing
- manager: View all, edit jobs/schedules
- dispatcher: Schedule and assign jobs
- worker: View assigned jobs only
- limited_worker: Clock in/out only
```

### Permission Matrix
| Resource | Owner | Admin | Manager | Dispatcher | Worker | Limited |
|----------|-------|-------|---------|------------|--------|---------|
| Clients | CRUD | CRUD | Read | Read | Read (assigned) | - |
| Quotes | CRUD | CRUD | CRUD | Read | Read (assigned) | - |
| Jobs | CRUD | CRUD | CRUD | CRUD | Update (assigned) | - |
| Invoices | CRUD | CRUD | Read | Read | Read (assigned) | - |
| Payments | CRUD | CRUD | Read | - | - | - |
| Team | CRUD | CRUD | Read | Read | Read | - |
| Reports | Read | Read | Read | Read | - | - |
| Settings | CRUD | Read | - | - | - | - |
| Billing | CRUD | - | - | - | - | - |

### Multi-Tenancy Security
```sql
-- Row-level security
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY client_isolation ON clients
USING (account_id = current_setting('app.current_account_id')::uuid);
```

---

## 4. API Security

### Rate Limiting
```
Per User:
- 1000 requests/hour
- 20 requests/second (burst)

Per IP (unauthenticated):
- 100 requests/hour
- 5 requests/second (burst)
```

### Input Validation
```javascript
const { z } = require('zod');

const clientSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email(),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/).optional()
});
```

### SQL Injection Prevention
```javascript
// DO: Use parameterized queries
const result = await db.query(
  'SELECT * FROM clients WHERE id = $1',
  [clientId]
);

// DON'T: String concatenation
const result = await db.query(
  `SELECT * FROM clients WHERE id = '${clientId}'` // UNSAFE!
);
```

### XSS Prevention
- Sanitize HTML input
- Use Content Security Policy
- Escape output
- Use React (auto-escapes)

### CSRF Protection
```javascript
// Generate CSRF token
const csrfToken = crypto.randomBytes(32).toString('hex');

// Validate on form submission
if (req.body.csrfToken !== req.session.csrfToken) {
  throw new Error('CSRF token mismatch');
}
```

---

## 5. PCI-DSS Compliance (Payment Card Industry)

### Requirements
- Never store full credit card numbers
- Use tokenization (Stripe/Square)
- Use PCI-compliant payment processor
- No cardholder data in logs
- Secure transmission (TLS 1.2+)

### Implementation
```javascript
// DO: Use payment processor tokens
const paymentMethod = await stripe.paymentMethods.create({
  type: 'card',
  card: { token: 'tok_visa' }
});

// Store only:
{
  paymentMethodId: 'pm_xxx',
  last4: '4242',
  brand: 'visa'
}

// DON'T: Store card numbers
{
  cardNumber: '4242424242424242', // NEVER DO THIS
  cvv: '123' // NEVER DO THIS
}
```

---

## 6. GDPR Compliance (Data Protection)

### Data Subject Rights
1. Right to access: Export user data
2. Right to rectification: Update user data
3. Right to erasure: Delete user data
4. Right to portability: Export in common format
5. Right to restriction: Limit processing

### Implementation
```javascript
// Export user data
app.get('/users/me/export', async (req, res) => {
  const userData = await getUserData(req.user.id);
  res.json(userData);
});

// Delete user data
app.delete('/users/me', async (req, res) => {
  await anonymizeUserData(req.user.id);
  await deleteUserAccount(req.user.id);
});
```

### Consent Management
- Explicit consent for data processing
- Opt-in for marketing communications
- Cookie consent banner
- Privacy policy acceptance

### Data Retention
- Active data: Keep while account active
- Inactive accounts: Delete after 2 years
- Backups: Encrypt and delete after 30 days
- Logs: Delete after 90 days

---

## 7. Security Headers

```javascript
app.use((req, res, next) => {
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');

  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // XSS protection
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // HTTPS only
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

  // Content Security Policy
  res.setHeader('Content-Security-Policy', "default-src 'self'");

  next();
});
```

---

## 8. Audit Logging

### What to Log
- Authentication attempts (success/failure)
- Authorization failures
- Data modifications (create, update, delete)
- Configuration changes
- API access
- Payment transactions
- Data exports

### Log Format
```json
{
  "timestamp": "2025-01-15T10:00:00Z",
  "userId": "uuid",
  "accountId": "uuid",
  "action": "update",
  "resource": "client",
  "resourceId": "uuid",
  "changes": {
    "email": {
      "old": "old@example.com",
      "new": "new@example.com"
    }
  },
  "ipAddress": "1.2.3.4",
  "userAgent": "Mozilla/5.0..."
}
```

---

## 9. Vulnerability Management

### Dependency Scanning
```bash
# npm audit
npm audit

# Fix vulnerabilities
npm audit fix

# Snyk
snyk test
snyk monitor
```

### Code Scanning
```bash
# ESLint security plugin
npm install --save-dev eslint-plugin-security

# SonarQube
sonar-scanner
```

### Penetration Testing
- Conduct annually
- Use OWASP Top 10 as checklist
- Test authentication, authorization
- Test API endpoints
- Test file uploads
- Test payment processing

---

## 10. Incident Response Plan

### 1. Preparation
- Incident response team identified
- Contact list maintained
- Tools and access ready

### 2. Detection & Analysis
- Monitor alerts
- Investigate suspicious activity
- Determine severity

### 3. Containment
- Isolate affected systems
- Preserve evidence
- Prevent further damage

### 4. Eradication
- Remove malware/vulnerabilities
- Patch systems
- Change credentials

### 5. Recovery
- Restore from backups
- Verify system integrity
- Monitor for recurrence

### 6. Post-Incident
- Document incident
- Conduct lessons learned
- Update procedures

---

## 11. Security Checklist

### Development
- [ ] Input validation on all endpoints
- [ ] Output encoding
- [ ] Parameterized SQL queries
- [ ] Authentication on protected routes
- [ ] Authorization checks
- [ ] Rate limiting
- [ ] CSRF protection
- [ ] Secure session management

### Deployment
- [ ] TLS/HTTPS enabled
- [ ] Security headers configured
- [ ] Firewall rules in place
- [ ] Database encryption enabled
- [ ] Backups encrypted
- [ ] Secrets in environment variables
- [ ] Monitoring and alerting configured

### Operations
- [ ] Regular security updates
- [ ] Vulnerability scanning
- [ ] Access review quarterly
- [ ] Audit logs reviewed monthly
- [ ] Incident response plan tested
- [ ] Team security training

---

## Document Version
- **Version:** 1.0
- **Last Updated:** 2025-11-09
- **Status:** Complete
