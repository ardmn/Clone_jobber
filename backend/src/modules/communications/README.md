# Communications Module

Complete communications module for sending emails and SMS messages with SendGrid and Twilio integrations.

## Features

- **Email Sending** via SendGrid
  - Single email sending
  - Bulk email sending
  - Template-based emails
  - Transactional emails
  - Support for CC, BCC, attachments

- **SMS Sending** via Twilio
  - Single SMS sending
  - Bulk SMS sending
  - Phone number validation
  - Delivery status tracking

- **Message Logging**
  - All messages logged to database
  - Track delivery status
  - Link messages to clients
  - Filter and search message history

- **Templates**
  - Email and SMS templates
  - Dynamic template variables
  - Template management API

## Installation

The required dependencies are already in package.json:

```bash
npm install @sendgrid/mail twilio
```

## Environment Variables

Add the following to your `.env` file:

```env
# SendGrid Configuration
SENDGRID_API_KEY=your_sendgrid_api_key_here
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
SENDGRID_FROM_NAME=Your Company Name

# Twilio Configuration
TWILIO_ACCOUNT_SID=your_twilio_account_sid_here
TWILIO_AUTH_TOKEN=your_twilio_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890
```

## API Endpoints

### Send Email
```http
POST /communications/email
Authorization: Bearer {token}
Content-Type: application/json

{
  "clientId": "uuid-optional",
  "to": "client@example.com",
  "cc": ["manager@example.com"],
  "bcc": ["admin@example.com"],
  "subject": "Your appointment is confirmed",
  "body": "Plain text body",
  "html": "<p>HTML body</p>",
  "templateId": "sendgrid-template-id",
  "dynamicData": {
    "customerName": "John Doe",
    "appointmentDate": "2024-01-15"
  }
}
```

### Send SMS
```http
POST /communications/sms
Authorization: Bearer {token}
Content-Type: application/json

{
  "clientId": "uuid-optional",
  "to": "+1234567890",
  "body": "Your appointment is confirmed for tomorrow at 2 PM"
}
```

### Send Bulk Email
```http
POST /communications/bulk-email
Authorization: Bearer {token}
Content-Type: application/json

{
  "recipients": ["client1@example.com", "client2@example.com"],
  "subject": "Important announcement",
  "body": "Plain text body",
  "html": "<p>HTML body</p>"
}
```

### Send Bulk SMS
```http
POST /communications/bulk-sms
Authorization: Bearer {token}
Content-Type: application/json

{
  "recipients": ["+1234567890", "+0987654321"],
  "body": "Important announcement for all clients"
}
```

### List Messages
```http
GET /communications/messages?page=1&limit=20&messageType=email&status=sent
Authorization: Bearer {token}
```

Query parameters:
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20, max: 100)
- `messageType` - Filter by type: email, sms
- `direction` - Filter by direction: inbound, outbound
- `status` - Filter by status: pending, sent, delivered, failed, opened, clicked
- `clientId` - Filter by client UUID
- `startDate` - Filter from date (ISO 8601)
- `endDate` - Filter to date (ISO 8601)

### Get Message
```http
GET /communications/messages/{id}
Authorization: Bearer {token}
```

### List Templates
```http
GET /communications/templates
Authorization: Bearer {token}
```

### Create Template
```http
POST /communications/templates
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Appointment Reminder",
  "subject": "Appointment Reminder",
  "body": "Hi {{customerName}}, reminder about your appointment on {{appointmentDate}}.",
  "html": "<p>Hi {{customerName}},</p><p>Reminder about your appointment on {{appointmentDate}}.</p>",
  "templateType": "email"
}
```

## Service Usage

### Send Email Programmatically

```typescript
import { CommunicationsService } from './modules/communications/communications.service';

@Injectable()
export class YourService {
  constructor(
    private readonly communicationsService: CommunicationsService,
  ) {}

  async sendAppointmentReminder(accountId: string, userId: string, clientEmail: string) {
    return this.communicationsService.sendEmail(accountId, userId, {
      to: clientEmail,
      subject: 'Appointment Reminder',
      html: '<p>Your appointment is tomorrow at 2 PM</p>',
    });
  }
}
```

### Send SMS Programmatically

```typescript
async sendSmsReminder(accountId: string, userId: string, clientPhone: string) {
  return this.communicationsService.sendSMS(accountId, userId, {
    to: clientPhone,
    body: 'Your appointment is tomorrow at 2 PM',
  });
}
```

## Message Statuses

- `pending` - Message created but not yet sent
- `sent` - Message sent to provider
- `delivered` - Message delivered to recipient
- `failed` - Message delivery failed
- `opened` - Email opened by recipient (email only)
- `clicked` - Link clicked in email (email only)

## Database Schema

All messages are logged to the `messages` table with the following fields:

- `id` - UUID primary key
- `accountId` - Account UUID (scoped)
- `clientId` - Client UUID (optional)
- `messageType` - email or sms
- `direction` - inbound or outbound
- `subject` - Email subject (email only)
- `body` - Message body
- `fromAddress` - Sender address
- `toAddress` - Recipient address
- `status` - Current status
- `sentAt` - Timestamp when sent
- `deliveredAt` - Timestamp when delivered
- `openedAt` - Timestamp when opened (email)
- `clickedAt` - Timestamp when clicked (email)
- `failedAt` - Timestamp when failed
- `errorMessage` - Error details if failed
- `provider` - sendgrid or twilio
- `providerMessageId` - Provider's message ID
- `relatedType` - Type of related entity (job, quote, invoice)
- `relatedId` - UUID of related entity
- `sentBy` - User UUID who sent the message
- `createdAt` - Timestamp created

## Error Handling

The module includes comprehensive error handling:

- **Service Not Configured** - Returns 500 error if API keys not set
- **Invalid Email** - Returns 400 error for invalid email addresses
- **Invalid Phone** - Returns 400 error for invalid phone numbers
- **Client Not Found** - Returns 404 error if clientId doesn't exist
- **Provider Errors** - Returns 500 error with logged details

All errors are logged with full stack traces for debugging.

## Testing

To test the communications module:

1. Set up environment variables with valid API keys
2. Use the Swagger UI at `/api` to test endpoints
3. Check message logs in database
4. Verify SendGrid and Twilio dashboards for delivery

## Security

- All endpoints require JWT authentication
- Account scoping prevents cross-account access
- API keys stored securely in environment variables
- Message data validated before sending

## File Structure

```
communications/
├── communications.module.ts       # Module definition
├── communications.controller.ts   # REST API endpoints
├── communications.service.ts      # Business logic
├── dtos/
│   ├── index.ts                  # DTO exports
│   ├── send-email.dto.ts         # Email DTO
│   ├── send-sms.dto.ts           # SMS DTO
│   ├── send-bulk-email.dto.ts    # Bulk email DTO
│   ├── send-bulk-sms.dto.ts      # Bulk SMS DTO
│   ├── create-template.dto.ts    # Template DTO
│   └── messages-query.dto.ts     # Query DTO
└── README.md                     # This file
```

## Integration Details

### SendGrid Integration

Location: `/integrations/sendgrid/`

- `sendgrid.module.ts` - SendGrid module
- `sendgrid.service.ts` - SendGrid service with methods:
  - `sendEmail()` - Send single email
  - `sendTemplateEmail()` - Send with template
  - `sendTransactionalEmail()` - Send transactional
  - `sendBulkEmail()` - Send to multiple recipients
  - `sendBulkEmailWithPersonalization()` - Bulk with unique data

### Twilio Integration

Location: `/integrations/twilio/`

- `twilio.module.ts` - Twilio module
- `twilio.service.ts` - Twilio service with methods:
  - `sendSMS()` - Send single SMS
  - `sendBulkSMS()` - Send to multiple recipients
  - `getMessageStatus()` - Get delivery status
  - `isValidPhoneNumber()` - Validate phone number
  - `formatPhoneNumber()` - Format to E.164

## Production Considerations

1. **Rate Limiting** - Configure throttling for bulk operations
2. **Queue Processing** - Consider using Bull queues for bulk sends
3. **Webhooks** - Implement SendGrid/Twilio webhooks for status updates
4. **Monitoring** - Set up alerts for failed messages
5. **Cost Management** - Monitor API usage and costs
6. **Compliance** - Ensure GDPR/CAN-SPAM compliance
7. **Unsubscribe** - Implement unsubscribe functionality
8. **Opt-in** - Verify recipients have opted in for communications

## Future Enhancements

- [ ] WhatsApp integration
- [ ] Push notifications
- [ ] In-app messaging
- [ ] Email template builder UI
- [ ] Scheduled messages
- [ ] Message analytics dashboard
- [ ] A/B testing for emails
- [ ] Bounce handling
- [ ] Spam complaint handling
- [ ] Contact list management
