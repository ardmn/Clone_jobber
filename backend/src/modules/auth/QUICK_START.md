# Authentication Module - Quick Start Guide

## Import in App Module

Add AuthModule to your main app.module.ts:

```typescript
import { AuthModule } from './modules/auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forRoot({...}),
    AuthModule,  // Add this
  ],
})
export class AppModule {}
```

## Protect Your Routes

Use the JWT guard to protect endpoints:

```typescript
import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth } from '@nestjs/swagger';

@Controller('api/jobs')
export class JobsController {
  @Get()
  @UseGuards(AuthGuard('jwt'))  // Protect this route
  @ApiBearerAuth()               // Swagger auth
  async findAll(@Request() req) {
    // Access authenticated user
    const { userId, accountId, role } = req.user;
    
    // Your logic here
    return this.jobsService.findAll(accountId);
  }
}
```

## Request User Object

After JWT authentication, `req.user` contains:

```typescript
{
  userId: string;      // User ID
  email: string;       // User email
  accountId: string;   // Account ID
  role: string;        // User role (owner, admin, worker)
  permissions: string[]; // User permissions
  firstName: string;   // First name
  lastName: string;    // Last name
}
```

## Example Client Flow

### 1. Register
```bash
POST /auth/register
{
  "email": "owner@company.com",
  "password": "SecurePass123",
  "firstName": "John",
  "lastName": "Doe",
  "companyName": "Acme Services"
}

Response:
{
  "user": { ... },
  "tokens": {
    "accessToken": "eyJ...",
    "refreshToken": "eyJ..."
  }
}
```

### 2. Login
```bash
POST /auth/login
{
  "email": "owner@company.com",
  "password": "SecurePass123"
}

Response: Same as register
```

### 3. Use Access Token
```bash
GET /auth/me
Headers: Authorization: Bearer eyJ...

Response: User profile with account info
```

### 4. Refresh Token
```bash
POST /auth/refresh
{
  "refreshToken": "eyJ..."
}

Response: New access and refresh tokens
```

## Testing

Start your server and visit:
- Swagger UI: http://localhost:8080/api
- Test endpoint: http://localhost:8080/auth/me (requires token)

## Common Patterns

### Role-Based Access

Create a custom guard:

```typescript
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.get<string[]>('roles', context.getHandler());
    if (!roles) return true;
    
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    
    return roles.includes(user.role);
  }
}

// Usage:
@Get('admin-only')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('owner', 'admin')
async adminEndpoint() { ... }
```

### Account Isolation

Always filter by accountId:

```typescript
@Get()
@UseGuards(AuthGuard('jwt'))
async findAll(@Request() req) {
  const { accountId } = req.user;
  
  // Only return data for the user's account
  return this.service.findAll({ accountId });
}
```

## Environment Setup

Required in `.env`:

```env
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_EXPIRES_IN=1h
JWT_REFRESH_SECRET=your-refresh-secret-min-32-chars
JWT_REFRESH_EXPIRES_IN=30d
PASSWORD_RESET_URL=http://localhost:3000/reset-password
```

## Troubleshooting

### "No metadata for User was found"
Make sure TypeOrmModule.forFeature([User, Account]) is imported in AuthModule

### "JWT strategy not found"
Ensure PassportModule is imported in AuthModule

### "Unauthorized"
- Check if token is valid and not expired
- Verify JWT_SECRET matches in .env
- Ensure user is active in database

### "Cannot read property 'user' of undefined"
- Add @UseGuards(AuthGuard('jwt')) to your route
- Ensure Authorization header is set: `Bearer <token>`
