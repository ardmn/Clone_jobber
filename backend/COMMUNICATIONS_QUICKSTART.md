# Communications Module - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Step 1: Environment Setup

Copy the example environment variables:

```bash
cat backend/.env.communications.example >> backend/.env
```

Edit `.env` and add your API keys:

```env
SENDGRID_API_KEY=SG.your_actual_key_here
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
SENDGRID_FROM_NAME=Your Company

TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_actual_token_here
TWILIO_PHONE_NUMBER=+1234567890
```

### Step 2: Install Dependencies (if needed)

```bash
cd backend
npm install
```

The required packages are already in package.json:
- `@sendgrid/mail@^8.1.0`
- `twilio@^4.19.0`

### Step 3: Start the Server

```bash
npm run start:dev
```

### Step 4: Test with Swagger

1. Open browser to http://localhost:3000/api
2. Look for "Communications" section
3. Click "Authorize" and enter your JWT token
4. Try the endpoints!

## 📧 Send Your First Email

```bash
curl -X POST http://localhost:3000/communications/email \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "test@example.com",
    "subject": "Test Email",
    "html": "<h1>Hello!</h1><p>This is a test email.</p>"
  }'
```

## 📱 Send Your First SMS

```bash
curl -X POST http://localhost:3000/communications/sms \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "+1234567890",
    "body": "Hello! This is a test SMS."
  }'
```

## 📊 View Message History

```bash
curl -X GET http://localhost:3000/communications/messages?page=1&limit=20 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 🔧 Common Use Cases

### Send Email with Template

```typescript
// In your service
await this.communicationsService.sendEmail(accountId, userId, {
  to: 'client@example.com',
  subject: 'Appointment Reminder',
  html: `
    <h2>Appointment Reminder</h2>
    <p>Hi ${client.firstName},</p>
    <p>Your appointment is scheduled for ${appointment.date}.</p>
  `,
});
```

### Send SMS Notification

```typescript
await this.communicationsService.sendSMS(accountId, userId, {
  clientId: client.id,
  to: client.phone,
  body: `Hi ${client.firstName}, your appointment is tomorrow at ${time}.`,
});
```

### Send Bulk Emails

```typescript
await this.communicationsService.sendBulkEmail(accountId, userId, {
  recipients: ['client1@example.com', 'client2@example.com'],
  subject: 'Important Update',
  html: '<p>We have an important update to share...</p>',
});
```

### Query Messages

```typescript
const messages = await this.communicationsService.findAll(accountId, {
  page: 1,
  limit: 20,
  messageType: MessageType.EMAIL,
  status: MessageStatus.SENT,
  startDate: '2024-01-01',
  endDate: '2024-12-31',
});
```

## 🔍 Debugging

### Check if Service is Configured

Look for these log messages on startup:

```
[SendGridService] SendGrid service initialized successfully
[TwilioService] Twilio service initialized successfully
```

If you see warnings, check your environment variables.

### Check Message Logs

All messages are logged to the `messages` table in the database:

```sql
SELECT * FROM messages
WHERE account_id = 'your-account-id'
ORDER BY created_at DESC
LIMIT 10;
```

### Enable Debug Logging

In development, all communication attempts are logged with the Logger.

## 🎯 Available Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/communications/email` | Send single email |
| POST | `/communications/sms` | Send single SMS |
| POST | `/communications/bulk-email` | Send bulk emails |
| POST | `/communications/bulk-sms` | Send bulk SMS |
| GET | `/communications/messages` | List messages (paginated) |
| GET | `/communications/messages/:id` | Get message by ID |
| GET | `/communications/templates` | List templates |
| POST | `/communications/templates` | Create template |

## 📖 Full Documentation

- **Module README**: `/backend/src/modules/communications/README.md`
- **Implementation Guide**: `/COMMUNICATIONS_IMPLEMENTATION.md`
- **Swagger Docs**: http://localhost:3000/api

## 🧪 Testing Without Real Credentials

The module will work without API credentials, but will log warnings and throw errors. For development:

1. Mock the services in your tests
2. Or use SendGrid/Twilio test credentials
3. Or configure real credentials

## 🔐 Security Notes

- All endpoints require JWT authentication
- Messages are scoped to accounts (multi-tenant safe)
- API keys are never exposed in responses
- Input validation on all requests

## 💡 Pro Tips

1. **Template Variables**: Use `{{variableName}}` in templates for dynamic data
2. **Bulk Sending**: Use bulk endpoints for better performance
3. **Status Tracking**: Check `status` field in messages table
4. **Error Handling**: Failed messages are logged with error details
5. **Client Linking**: Always pass `clientId` to link messages to clients

## 🐛 Troubleshooting

**Email not sending?**
- Check SENDGRID_API_KEY is valid
- Verify SENDGRID_FROM_EMAIL is verified in SendGrid
- Check logs for error messages

**SMS not sending?**
- Check TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN
- Verify TWILIO_PHONE_NUMBER is valid and purchased
- Phone numbers must be in E.164 format (+1234567890)

**401 Unauthorized?**
- Ensure you're passing valid JWT token
- Check token hasn't expired

**404 Client not found?**
- Verify clientId exists in your account
- Check account scoping is correct

## 📞 Get API Credentials

**SendGrid**
1. Sign up at https://sendgrid.com
2. Go to Settings > API Keys
3. Create new API key with "Full Access"
4. Verify sender email address

**Twilio**
1. Sign up at https://twilio.com
2. Go to Console Dashboard
3. Copy Account SID and Auth Token
4. Purchase a phone number

## ✅ Verification Checklist

- [ ] Environment variables configured
- [ ] Dependencies installed
- [ ] Server starts without errors
- [ ] Can access Swagger at /api
- [ ] Test email sends successfully
- [ ] Test SMS sends successfully
- [ ] Messages appear in database
- [ ] Can query message history

---

**You're all set!** Start sending emails and SMS with the Communications module.
