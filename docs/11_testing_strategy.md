# Testing Strategy

## Document Information
- **Version:** 1.0
- **Last Updated:** 2025-11-09
- **Status:** Complete

---

## 1. Testing Pyramid

```
          /\
         /E2E\          10%  - End-to-End Tests
        /------\
       /Integr-\        20%  - Integration Tests
      /----------\
     /---Unit-----\     70%  - Unit Tests
    /--------------\
```

---

## 2. Unit Testing

### Backend (Go/Node.js)

**Framework:** Jest (Node.js) or Go testing

```javascript
// user.service.test.js
describe('UserService', () => {
  describe('createUser', () => {
    it('should create user with valid data', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'Password123!',
        firstName: 'John',
        lastName: 'Doe'
      };

      const user = await userService.createUser(userData);

      expect(user.id).toBeDefined();
      expect(user.email).toBe(userData.email);
      expect(user.password).toBeUndefined(); // No password in response
    });

    it('should throw error for duplicate email', async () => {
      await userService.createUser({
        email: 'test@example.com',
        password: 'Password123!'
      });

      await expect(
        userService.createUser({
          email: 'test@example.com',
          password: 'Different123!'
        })
      ).rejects.toThrow('Email already exists');
    });

    it('should hash password before saving', async () => {
      const password = 'Password123!';
      const user = await userService.createUser({
        email: 'test@example.com',
        password
      });

      const stored = await db.query('SELECT password_hash FROM users WHERE id = $1', [user.id]);
      expect(stored.password_hash).not.toBe(password);
      expect(await bcrypt.compare(password, stored.password_hash)).toBe(true);
    });
  });
});
```

### Frontend (React)

**Framework:** Jest + React Testing Library

```javascript
// ClientList.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { ClientList } from './ClientList';

describe('ClientList', () => {
  const mockClients = [
    { id: '1', name: 'John Doe', email: 'john@example.com' },
    { id: '2', name: 'Jane Smith', email: 'jane@example.com' }
  ];

  it('renders list of clients', () => {
    render(<ClientList clients={mockClients} />);

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });

  it('filters clients by search term', () => {
    render(<ClientList clients={mockClients} />);

    const searchInput = screen.getByPlaceholderText('Search clients');
    fireEvent.change(searchInput, { target: { value: 'John' } });

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
  });

  it('calls onClientClick when client is clicked', () => {
    const onClientClick = jest.fn();
    render(<ClientList clients={mockClients} onClientClick={onClientClick} />);

    fireEvent.click(screen.getByText('John Doe'));

    expect(onClientClick).toHaveBeenCalledWith('1');
  });
});
```

### Mobile (KMP)

**Framework:** Kotlin Test

```kotlin
// JobRepositoryTest.kt
class JobRepositoryTest {
    private val remoteDataSource = mockk<JobRemoteDataSource>()
    private val localDataSource = mockk<JobLocalDataSource>()
    private val networkMonitor = mockk<NetworkMonitor>()
    private val repository = JobRepositoryImpl(remoteDataSource, localDataSource, networkMonitor)

    @Test
    fun `getJobsByDate returns remote data when online`() = runTest {
        val date = LocalDate.now()
        val jobs = listOf(Job(id = "1", title = "Test Job"))

        coEvery { networkMonitor.isConnected } returns true
        coEvery { remoteDataSource.getJobsByDate(date) } returns Result.success(jobs)
        coEvery { localDataSource.saveJobs(jobs) } just Runs

        val result = repository.getJobsByDate(date)

        assertTrue(result.isSuccess)
        assertEquals(jobs, result.getOrNull())
        coVerify { localDataSource.saveJobs(jobs) }
    }

    @Test
    fun `getJobsByDate returns cached data when offline`() = runTest {
        val date = LocalDate.now()
        val cachedJobs = listOf(Job(id = "1", title = "Cached Job"))

        coEvery { networkMonitor.isConnected } returns false
        coEvery { localDataSource.getJobsByDate(date) } returns Result.success(cachedJobs)

        val result = repository.getJobsByDate(date)

        assertEquals(cachedJobs, result.getOrNull())
        coVerify(exactly = 0) { remoteDataSource.getJobsByDate(any()) }
    }
}
```

### Coverage Target
- **Minimum:** 70% overall
- **Critical paths:** 90% (authentication, payments)
- **Business logic:** 85%

---

## 3. Integration Testing

### API Integration Tests

```javascript
// invoice.integration.test.js
describe('Invoice API Integration', () => {
  let authToken;
  let testClient;

  beforeAll(async () => {
    await setupTestDatabase();
    const loginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'test@example.com', password: 'password' });
    authToken = loginResponse.body.accessToken;

    // Create test client
    const clientResponse = await request(app)
      .post('/api/v1/clients')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ firstName: 'Test', lastName: 'Client', email: 'client@example.com' });
    testClient = clientResponse.body.data;
  });

  it('should create invoice and send it', async () => {
    // Create invoice
    const invoiceResponse = await request(app)
      .post('/api/v1/invoices')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        clientId: testClient.id,
        lineItems: [
          { name: 'Service', quantity: 1, unitPrice: 100.00 }
        ],
        dueDate: '2025-12-31'
      })
      .expect(201);

    expect(invoiceResponse.body.data.total).toBe(100.00);

    // Send invoice
    await request(app)
      .post(`/api/v1/invoices/${invoiceResponse.body.data.id}/send`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ method: 'email' })
      .expect(200);

    // Verify invoice status updated
    const invoice = await getInvoiceFromDb(invoiceResponse.body.data.id);
    expect(invoice.status).toBe('sent');
    expect(invoice.sentAt).toBeDefined();
  });

  afterAll(async () => {
    await cleanupTestDatabase();
  });
});
```

### Database Integration Tests

```javascript
describe('Database Integration', () => {
  it('should enforce foreign key constraints', async () => {
    await expect(
      db.query('INSERT INTO jobs (id, client_id, title) VALUES ($1, $2, $3)', [
        'job-id',
        'non-existent-client-id',
        'Test Job'
      ])
    ).rejects.toThrow('foreign key constraint');
  });

  it('should cascade delete related records', async () => {
    const client = await createTestClient();
    const job = await createTestJob({ clientId: client.id });

    await db.query('DELETE FROM clients WHERE id = $1', [client.id]);

    const jobs = await db.query('SELECT * FROM jobs WHERE id = $1', [job.id]);
    expect(jobs.rows).toHaveLength(0);
  });
});
```

---

## 4. End-to-End Testing

### Framework: Playwright or Cypress

```javascript
// quote-workflow.e2e.test.js
describe('Quote Workflow', () => {
  beforeEach(() => {
    cy.login('user@example.com', 'password');
  });

  it('should create, send, and approve quote', () => {
    // Navigate to quotes
    cy.visit('/quotes');
    cy.contains('New Quote').click();

    // Fill quote form
    cy.get('[data-testid="client-select"]').select('John Doe');
    cy.get('[data-testid="title-input"]').type('Lawn Maintenance');

    // Add line item
    cy.contains('Add Line Item').click();
    cy.get('[data-testid="item-name"]').type('Mowing');
    cy.get('[data-testid="item-quantity"]').type('1');
    cy.get('[data-testid="item-price"]').type('50');

    // Save quote
    cy.contains('Save').click();
    cy.contains('Quote created successfully').should('be.visible');

    // Send quote
    cy.contains('Send Quote').click();
    cy.get('[data-testid="send-method"]').select('Email');
    cy.contains('Send').click();
    cy.contains('Quote sent').should('be.visible');

    // Logout and approve as client
    cy.logout();

    // Get quote link from email (simulated)
    cy.visit('/quotes/public/quote-id');

    // Approve quote
    cy.contains('Approve Quote').click();
    cy.get('[data-testid="signature-pad"]').trigger('pointerdown').trigger('pointermove').trigger('pointerup');
    cy.contains('Submit').click();
    cy.contains('Quote approved').should('be.visible');
  });
});
```

### Critical User Flows to Test
- Login → Dashboard
- Create Client → Create Quote → Send Quote
- Approve Quote → Create Job
- Complete Job → Generate Invoice → Send Invoice
- Pay Invoice
- Time Tracking (Clock In → Clock Out)
- Schedule Job → Assign Team → Complete

---

## 5. Performance Testing

### Load Testing (k6)

```javascript
// load-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '2m', target: 100 }, // Ramp up to 100 users
    { duration: '5m', target: 100 }, // Stay at 100 users
    { duration: '2m', target: 200 }, // Ramp up to 200 users
    { duration: '5m', target: 200 }, // Stay at 200 users
    { duration: '2m', target: 0 },   // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests < 500ms
    http_req_failed: ['rate<0.01'],   // Error rate < 1%
  },
};

export default function () {
  const token = 'test_token';

  // List clients
  let res = http.get('https://api.example.com/v1/clients', {
    headers: { Authorization: `Bearer ${token}` },
  });

  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });

  sleep(1);
}
```

### Stress Testing
- Gradually increase load until system fails
- Identify breaking point
- Monitor resource usage

### Spike Testing
- Sudden traffic increase
- Test auto-scaling
- Recovery behavior

---

## 6. Security Testing

### OWASP ZAP Scan
```bash
docker run -t owasp/zap2docker-stable zap-baseline.py \
  -t https://api.example.com \
  -r zap-report.html
```

### SQL Injection Testing
```javascript
it('should prevent SQL injection', async () => {
  const maliciousInput = "'; DROP TABLE users; --";

  const response = await request(app)
    .get(`/api/v1/clients?search=${encodeURIComponent(maliciousInput)}`)
    .set('Authorization', `Bearer ${token}`)
    .expect(200);

  // Should not execute SQL
  const users = await db.query('SELECT COUNT(*) FROM users');
  expect(users.rows[0].count).toBeGreaterThan(0);
});
```

### Authentication Testing
```javascript
describe('Authentication Security', () => {
  it('should reject invalid tokens', async () => {
    await request(app)
      .get('/api/v1/clients')
      .set('Authorization', 'Bearer invalid_token')
      .expect(401);
  });

  it('should reject expired tokens', async () => {
    const expiredToken = generateToken({ exp: Math.floor(Date.now() / 1000) - 3600 });

    await request(app)
      .get('/api/v1/clients')
      .set('Authorization', `Bearer ${expiredToken}`)
      .expect(401);
  });
});
```

---

## 7. Mobile Testing

### Unit Tests (KMP)
- Test shared business logic
- Test repository implementations
- Test use cases

### UI Tests (Android)
```kotlin
@RunWith(AndroidJUnit4::class)
class ScheduleScreenTest {
    @get:Rule
    val composeTestRule = createComposeRule()

    @Test
    fun displaysJobList() {
        val jobs = listOf(Job(id = "1", title = "Test Job"))

        composeTestRule.setContent {
            ScheduleScreen(jobs = jobs)
        }

        composeTestRule.onNodeWithText("Test Job").assertIsDisplayed()
    }

    @Test
    fun navigatesToJobDetails() {
        val onJobClick = mock<(String) -> Unit>()

        composeTestRule.setContent {
            JobList(jobs = jobs, onJobClick = onJobClick)
        }

        composeTestRule.onNodeWithText("Test Job").performClick()

        verify(onJobClick).invoke("1")
    }
}
```

### UI Tests (iOS)
```swift
class ScheduleScreenTests: XCTestCase {
    func testDisplaysJobList() {
        let app = XCUIApplication()
        app.launch()

        app.buttons["Schedule"].tap()

        XCTAssertTrue(app.staticTexts["Test Job"].exists)
    }
}
```

---

## 8. User Acceptance Testing (UAT)

### UAT Checklist

**Authentication:**
- [ ] User can log in with email/password
- [ ] User can reset password
- [ ] 2FA works correctly
- [ ] Session expires after inactivity

**Client Management:**
- [ ] Create/edit/delete clients
- [ ] Search and filter clients
- [ ] View client history

**Quoting:**
- [ ] Create quote from scratch
- [ ] Create quote from template
- [ ] Send quote via email
- [ ] Client can approve quote online

**Job Management:**
- [ ] Schedule job on calendar
- [ ] Assign team members
- [ ] Complete job with photos/signature
- [ ] Job converts to invoice

**Invoicing & Payments:**
- [ ] Generate invoice from job
- [ ] Send invoice to client
- [ ] Process card payment
- [ ] Record cash/check payment

**Mobile App:**
- [ ] View schedule
- [ ] Clock in/out with GPS
- [ ] Complete jobs offline
- [ ] Sync when back online

---

## 9. CI/CD Testing Pipeline

```yaml
# .github/workflows/test.yml
name: Test Pipeline

on: [push, pull_request]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Install dependencies
        run: npm install
      - name: Run unit tests
        run: npm run test:unit
      - name: Upload coverage
        uses: codecov/codecov-action@v3

  integration-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_PASSWORD: test
    steps:
      - uses: actions/checkout@v3
      - name: Run integration tests
        run: npm run test:integration

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run E2E tests
        run: npm run test:e2e

  security-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run security scan
        run: npm audit
```

---

## 10. Test Data Management

### Test Fixtures
```javascript
// fixtures/clients.js
export const testClients = [
  {
    id: 'client-1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com'
  },
  // ...
];

// Use in tests
import { testClients } from './fixtures/clients';
```

### Database Seeding
```javascript
// seeds/test-data.js
async function seed() {
  await db.query('TRUNCATE TABLE users, clients, jobs CASCADE');

  await db.query(
    'INSERT INTO users (id, email, password_hash) VALUES ($1, $2, $3)',
    ['user-1', 'test@example.com', hashedPassword]
  );

  // Seed more data...
}
```

---

## Document Version
- **Version:** 1.0
- **Last Updated:** 2025-11-09
- **Status:** Complete
