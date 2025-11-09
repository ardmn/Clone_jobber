# Integration Specifications

## Document Information
- **Version:** 1.0
- **Last Updated:** 2025-11-09
- **Status:** Complete

---

## 1. Payment Processing - Stripe

### Setup
```javascript
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
```

### Create Payment Intent
```javascript
const paymentIntent = await stripe.paymentIntents.create({
  amount: 10000, // $100.00
  currency: 'usd',
  customer: 'cus_xxx',
  payment_method: 'pm_xxx',
  confirm: true,
  metadata: {
    invoiceId: 'uuid',
    clientId: 'uuid'
  }
});
```

### Save Payment Method
```javascript
const paymentMethod = await stripe.paymentMethods.attach('pm_xxx', {
  customer: 'cus_xxx',
});
```

### Webhooks
```
Events to listen:
- payment_intent.succeeded
- payment_intent.payment_failed
- charge.refunded
```

---

## 2. Payment Processing - Square

### Setup
```javascript
const { Client, Environment } = require('square');
const client = new Client({
  accessToken: process.env.SQUARE_ACCESS_TOKEN,
  environment: Environment.Production
});
```

### Process Payment
```javascript
const response = await client.paymentsApi.createPayment({
  sourceId: 'card_token',
  amountMoney: {
    amount: 10000n,
    currency: 'USD'
  },
  idempotencyKey: uuid()
});
```

---

## 3. SMS - Twilio

### Setup
```javascript
const twilio = require('twilio');
const client = twilio(accountSid, authToken);
```

### Send SMS
```javascript
const message = await client.messages.create({
  body: 'Your appointment is tomorrow at 9 AM',
  from: '+15555551234',
  to: '+15555555678'
});
```

### Receive SMS (Webhook)
```
POST /webhooks/twilio/sms
{
  "From": "+15555555678",
  "To": "+15555551234",
  "Body": "Message text"
}
```

---

## 4. Email - SendGrid

### Setup
```javascript
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);
```

### Send Email
```javascript
await sgMail.send({
  to: 'client@example.com',
  from: 'noreply@jobber-clone.com',
  subject: 'Your Invoice',
  html: '<p>Your invoice is attached</p>',
  attachments: [{
    content: pdfBase64,
    filename: 'invoice.pdf',
    type: 'application/pdf',
    disposition: 'attachment'
  }]
});
```

### Tracking Webhooks
```
Events:
- delivered
- opened
- clicked
- bounced
- spam_report
```

---

## 5. QuickBooks Online

### OAuth 2.0 Flow
```
1. Redirect to QuickBooks:
https://appcenter.intuit.com/connect/oauth2?
  client_id=xxx&
  response_type=code&
  scope=com.intuit.quickbooks.accounting&
  redirect_uri=https://yourapp.com/callback&
  state=security_token

2. Handle Callback:
POST https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer
{
  grant_type: 'authorization_code',
  code: 'auth_code',
  redirect_uri: 'https://yourapp.com/callback'
}

3. Store tokens:
{
  access_token: 'xxx',
  refresh_token: 'yyy',
  expires_in: 3600
}
```

### Sync Customer
```javascript
const customer = await qbo.createCustomer({
  DisplayName: 'John Doe',
  PrimaryEmailAddr: {
    Address: 'john@example.com'
  },
  PrimaryPhone: {
    FreeFormNumber: '+1234567890'
  }
});
```

### Sync Invoice
```javascript
const invoice = await qbo.createInvoice({
  CustomerRef: {
    value: '123'
  },
  Line: [{
    Amount: 100.00,
    DetailType: 'SalesItemLineDetail',
    SalesItemLineDetail: {
      ItemRef: { value: '1' },
      Qty: 1,
      UnitPrice: 100.00
    }
  }]
});
```

### Sync Payment
```javascript
const payment = await qbo.createPayment({
  CustomerRef: { value: '123' },
  TotalAmt: 100.00,
  Line: [{
    Amount: 100.00,
    LinkedTxn: [{
      TxnId: 'invoice-id',
      TxnType: 'Invoice'
    }]
  }]
});
```

---

## 6. Google Maps

### Geocoding
```javascript
const response = await fetch(
  `https://maps.googleapis.com/maps/api/geocode/json?` +
  `address=${encodeURIComponent(address)}&key=${API_KEY}`
);
const { lat, lng } = response.results[0].geometry.location;
```

### Distance Matrix
```javascript
const response = await fetch(
  `https://maps.googleapis.com/maps/api/distancematrix/json?` +
  `origins=${origin}&destinations=${destination}&key=${API_KEY}`
);
const distance = response.rows[0].elements[0].distance.value; // meters
const duration = response.rows[0].elements[0].duration.value; // seconds
```

---

## 7. Zapier Integration

### Triggers
```
POST /api/v1/zapier/triggers/client.created
POST /api/v1/zapier/triggers/quote.approved
POST /api/v1/zapier/triggers/job.completed
POST /api/v1/zapier/triggers/invoice.paid
```

### Actions
```
POST /api/v1/zapier/actions/client.create
POST /api/v1/zapier/actions/quote.create
POST /api/v1/zapier/actions/job.create
```

### Polling URL Example
```javascript
// Zapier polls this endpoint
GET /api/v1/zapier/triggers/client.created/poll?since=2025-01-15T10:00:00Z

Response:
[
  {
    "id": "uuid",
    "firstName": "John",
    "lastName": "Doe",
    "createdAt": "2025-01-15T10:05:00Z"
  }
]
```

---

## 8. Firebase Cloud Messaging (Push Notifications)

### Send to Device
```javascript
const message = {
  notification: {
    title: 'New Job Assigned',
    body: 'You have been assigned to a job at 123 Main St'
  },
  data: {
    jobId: 'uuid',
    type: 'job_assigned'
  },
  token: deviceToken
};

await admin.messaging().send(message);
```

### Send to Topic
```javascript
await admin.messaging().send({
  notification: {...},
  topic: 'account_uuid'
});
```

---

## 9. AWS S3 (File Storage)

### Generate Presigned URL
```javascript
const AWS = require('aws-sdk');
const s3 = new AWS.S3();

const presignedUrl = s3.getSignedUrl('putObject', {
  Bucket: 'bucket-name',
  Key: `uploads/${accountId}/jobs/${jobId}/photo.jpg`,
  Expires: 3600,
  ContentType: 'image/jpeg'
});
```

### Upload from Server
```javascript
await s3.putObject({
  Bucket: 'bucket-name',
  Key: `invoices/${invoiceId}.pdf`,
  Body: pdfBuffer,
  ContentType: 'application/pdf',
  ACL: 'private'
}).promise();
```

### Generate Download URL
```javascript
const url = s3.getSignedUrl('getObject', {
  Bucket: 'bucket-name',
  Key: `invoices/${invoiceId}.pdf`,
  Expires: 3600
});
```

---

## 10. Redis (Caching & Queues)

### Caching
```javascript
const redis = require('redis');
const client = redis.createClient();

// Set cache
await client.set('client:uuid', JSON.stringify(clientData), {
  EX: 900 // 15 minutes
});

// Get cache
const cached = await client.get('client:uuid');
```

### Pub/Sub
```javascript
// Publisher
await client.publish('notifications', JSON.stringify({
  type: 'job.completed',
  data: { jobId: 'uuid' }
}));

// Subscriber
await client.subscribe('notifications');
client.on('message', (channel, message) => {
  const event = JSON.parse(message);
  // Handle event
});
```

---

## 11. Monitoring - Sentry

### Setup
```javascript
const Sentry = require('@sentry/node');

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0
});
```

### Capture Error
```javascript
try {
  // code
} catch (error) {
  Sentry.captureException(error, {
    user: { id: userId },
    extra: { context: 'additional info' }
  });
}
```

---

## 12. Logging - Winston

### Setup
```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});
```

### Usage
```javascript
logger.info('Invoice sent', {
  invoiceId: 'uuid',
  clientId: 'uuid',
  amount: 100.00
});

logger.error('Payment failed', {
  error: error.message,
  invoiceId: 'uuid'
});
```

---

## Document Version
- **Version:** 1.0
- **Last Updated:** 2025-11-09
- **Status:** Complete
