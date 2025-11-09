# Authentication Module

Complete authentication module for the Jobber Clone backend with JWT-based authentication, user registration, login, password reset, and token refresh capabilities.

## Features

- User registration with automatic account creation
- Email/password authentication
- JWT access and refresh tokens
- Password reset flow
- Protected routes with JWT guard
- Swagger API documentation
- Transaction-based account creation
- Bcrypt password hashing (cost factor 12)
- Role-based access control ready

## File Structure

```
auth/
├── auth.module.ts              # Main authentication module
├── auth.controller.ts          # REST API endpoints
├── auth.service.ts            # Business logic and authentication methods
├── index.ts                   # Module exports
├── dto/                       # Data Transfer Objects
│   ├── register.dto.ts        # Registration payload
│   ├── login.dto.ts           # Login payload
│   ├── refresh-token.dto.ts   # Token refresh payload
│   ├── forgot-password.dto.ts # Password reset request
│   └── reset-password.dto.ts  # Password reset payload
└── strategies/                # Passport strategies
    ├── jwt.strategy.ts        # JWT token validation
    └── local.strategy.ts      # Email/password validation
```

## API Endpoints

### POST /auth/register
Register a new account with owner user.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe",
  "companyName": "Acme Services Inc.",
  "phone": "+1234567890"
}
```

**Response:** 201 Created
```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "john@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "owner",
    "accountId": "660e8400-e29b-41d4-a716-446655440000"
  },
  "tokens": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### POST /auth/login
Authenticate user with email and password.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

**Response:** 200 OK
```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "john@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "owner",
    "accountId": "660e8400-e29b-41d4-a716-446655440000"
  },
  "tokens": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### POST /auth/refresh
Generate new access token using refresh token.

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:** 200 OK
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### POST /auth/logout
Logout current user (requires authentication).

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:** 200 OK
```json
{
  "message": "Successfully logged out"
}
```

### POST /auth/forgot-password
Request password reset email.

**Request Body:**
```json
{
  "email": "john@example.com"
}
```

**Response:** 200 OK
```json
{
  "message": "If the email exists, a password reset link has been sent"
}
```

### POST /auth/reset-password
Reset password using token from email.

**Request Body:**
```json
{
  "token": "abc123def456",
  "newPassword": "NewSecurePass123!"
}
```

**Response:** 200 OK
```json
{
  "message": "Password has been reset successfully"
}
```

### GET /auth/me
Get current user profile (requires authentication).

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:** 200 OK
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "accountId": "660e8400-e29b-41d4-a716-446655440000",
  "email": "john@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890",
  "role": "owner",
  "permissions": ["*"],
  "status": "active",
  "account": {
    "id": "660e8400-e29b-41d4-a716-446655440000",
    "companyName": "Acme Services Inc.",
    "subscriptionPlan": "core",
    "subscriptionStatus": "trial"
  }
}
```

## Environment Variables

Required environment variables in `.env`:

```env
# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=1h
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production
JWT_REFRESH_EXPIRES_IN=30d

# URLs for password reset
PASSWORD_RESET_URL=http://localhost:3000/reset-password
```

## Usage

### Import in App Module

```typescript
import { Module } from '@nestjs/common';
import { AuthModule } from './modules/auth/auth.module';

@Module({
  imports: [
    AuthModule,
    // ... other modules
  ],
})
export class AppModule {}
```

### Protect Routes with JWT Guard

```typescript
import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth } from '@nestjs/swagger';

@Controller('protected')
export class ProtectedController {
  @Get()
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  getProtectedData(@Request() req) {
    // req.user contains authenticated user info
    return {
      userId: req.user.userId,
      accountId: req.user.accountId,
      role: req.user.role,
    };
  }
}
```

### Access User Info in Protected Routes

After authentication, the JWT strategy attaches user information to the request:

```typescript
{
  userId: string;
  email: string;
  accountId: string;
  role: string;
  permissions: string[];
  firstName: string;
  lastName: string;
}
```

## Security Features

1. **Password Hashing**: Uses bcrypt with cost factor 12
2. **JWT Tokens**: Separate access (1h) and refresh (30d) tokens
3. **Active User Check**: JWT validation verifies user is still active
4. **Transaction Safety**: Account and user creation in single transaction
5. **Email Privacy**: Forgot password doesn't reveal if email exists
6. **Token Expiry**: Built-in token expiration handling

## Production Considerations

### Current Mock Implementations

1. **Password Reset Tokens**: Currently stored in-memory Map
   - Production: Use Redis with TTL or database table

2. **Email Sending**: Currently logs to console
   - Production: Implement SendGrid/AWS SES integration

3. **Token Blacklist**: Not implemented for logout
   - Production: Use Redis to blacklist tokens until expiry

### Recommended Enhancements

1. **Rate Limiting**: Add throttling to login/register endpoints
2. **Email Verification**: Add email verification on registration
3. **Multi-factor Authentication**: Add 2FA support
4. **Session Management**: Track active sessions per user
5. **Audit Logging**: Log all authentication events
6. **Password Policies**: Enforce complexity requirements
7. **Account Lockout**: Lock account after failed login attempts

## Error Handling

All endpoints return appropriate HTTP status codes:

- `200 OK` - Successful operation
- `201 Created` - Resource created (registration)
- `400 Bad Request` - Invalid input data
- `401 Unauthorized` - Invalid credentials or token
- `404 Not Found` - Resource not found
- `409 Conflict` - Email already exists
- `500 Internal Server Error` - Server error

## Testing

### Manual Testing with cURL

Register:
```bash
curl -X POST http://localhost:8080/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123456",
    "firstName": "Test",
    "lastName": "User",
    "companyName": "Test Company"
  }'
```

Login:
```bash
curl -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123456"
  }'
```

Get Profile:
```bash
curl -X GET http://localhost:8080/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Swagger Documentation

Access interactive API documentation at:
```
http://localhost:8080/api
```

All endpoints are documented with:
- Request/response schemas
- Example payloads
- Status codes
- Authentication requirements
