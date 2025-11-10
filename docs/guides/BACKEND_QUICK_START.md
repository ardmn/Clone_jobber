# 🚀 Quick Start Guide - Jobber Clone Backend

This guide will help you get the backend running on your local machine in minutes.

---

## Prerequisites

Before starting, ensure you have:

- ✅ **Node.js 18+** - [Download](https://nodejs.org/)
- ✅ **npm 9+** - Comes with Node.js
- ✅ **Docker & Docker Compose** - [Download](https://www.docker.com/products/docker-desktop/)
- ✅ **Git** - [Download](https://git-scm.com/)

---

## 🎯 Option 1: Automated Setup (Recommended)

The easiest way to get started is using our setup script:

```bash
# Navigate to backend directory
cd backend

# Run the setup script
./setup.sh
```

This script will:
1. ✅ Check all prerequisites
2. ✅ Install npm dependencies
3. ✅ Create `.env` file from template
4. ✅ Start PostgreSQL and Redis in Docker
5. ✅ Run database migrations
6. ✅ Optionally seed demo data

After setup completes, start the development server:

```bash
./dev.sh
```

That's it! Your backend is now running! 🎉

---

## 🔧 Option 2: Manual Setup

If you prefer manual control:

### Step 1: Install Dependencies

```bash
cd backend
npm install
```

### Step 2: Setup Environment

```bash
# Copy example environment file
cp .env.example .env

# Edit .env and configure:
# - Database settings (already set for Docker)
# - JWT secrets (can use defaults for development)
# - API keys (optional, for Stripe/SendGrid/Twilio/AWS)
nano .env  # or use your preferred editor
```

### Step 3: Start Database & Redis

```bash
# Start PostgreSQL and Redis containers
docker-compose up -d postgres redis

# Verify they're running
docker-compose ps
```

### Step 4: Run Migrations

```bash
npm run db:migrate
```

### Step 5: Seed Demo Data (Optional)

```bash
npm run db:seed
```

### Step 6: Start Backend Server

```bash
npm run start:dev
```

---

## 🐳 Option 3: Full Docker Setup

Run everything in Docker containers:

```bash
cd backend

# Copy environment file
cp .env.example .env

# Start all services (backend, postgres, redis)
docker-compose up -d

# Watch logs
docker-compose logs -f app
```

---

## 📱 Access the Application

Once running, you can access:

| Service | URL | Description |
|---------|-----|-------------|
| **API Base** | http://localhost:8080/api/v1 | REST API endpoints |
| **Swagger Docs** | http://localhost:8080/api/docs | Interactive API documentation |
| **Health Check** | http://localhost:8080/api/health | System health status |

---

## 🔑 Demo Credentials

If you seeded the database with demo data, use these credentials:

| Field | Value |
|-------|-------|
| **Email** | admin@example.com |
| **Password** | password123 |

**Demo Data Includes:**
- 1 account (Demo Field Services)
- 3 users (owner, manager, worker)
- 5 clients with contacts and addresses
- 3 quotes (draft, sent, approved)
- 4 jobs (various statuses)
- 3 invoices (paid, sent, overdue)
- 2 payments

---

## 🎮 Available Scripts

### Development Scripts

```bash
# Start development server (with hot reload)
npm run start:dev

# Or use the convenience script
./dev.sh

# Start in debug mode
npm run start:debug

# Run tests
npm run test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:cov
```

### Docker Scripts

```bash
# Start all services
npm run docker:up
# or
docker-compose up -d

# Stop all services
npm run docker:down
# or
./stop.sh

# View logs
npm run docker:logs

# Full cleanup (removes volumes)
./clean.sh
```

### Database Scripts

```bash
# Run migrations
npm run db:migrate

# Revert last migration
npm run migration:revert

# Seed demo data
npm run db:seed

# Generate new migration
npm run migration:generate -- -n MigrationName
```

### Build & Production

```bash
# Build for production
npm run build

# Start production server
npm run start:prod

# Format code
npm run format

# Lint code
npm run lint
```

---

## 🧪 Testing the API

### Using Swagger UI (Easiest)

1. Open http://localhost:8080/api/docs
2. Click "Authorize" button
3. Login to get JWT token:
   - Use the `/auth/login` endpoint
   - Use demo credentials: admin@example.com / password123
4. Copy the `accessToken` from response
5. Paste into the "Authorize" dialog
6. Now you can test all endpoints!

### Using cURL

```bash
# Login
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password123"}'

# Copy the accessToken from response

# Use token to access protected endpoints
curl http://localhost:8080/api/v1/clients \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Using Postman

1. Import the Swagger JSON: http://localhost:8080/api/docs-json
2. Create environment variable for `baseUrl`: http://localhost:8080/api/v1
3. Create environment variable for `token`: (get from login endpoint)
4. Add header: `Authorization: Bearer {{token}}`

---

## 🔌 Configuring External Services

The backend will work without external API keys, but some features will be limited:

### Stripe (Payment Processing)

```bash
# Get keys from: https://dashboard.stripe.com/apikeys
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### SendGrid (Email)

```bash
# Get key from: https://app.sendgrid.com/settings/api_keys
SENDGRID_API_KEY=SG....
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
SENDGRID_FROM_NAME=Your Company Name
```

### Twilio (SMS)

```bash
# Get from: https://console.twilio.com/
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+1234567890
```

### AWS S3 (File Storage)

```bash
# Get from AWS IAM
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-bucket-name
```

**Note:** Without these keys, the API will log messages to console instead of actually sending emails/SMS, and file upload will fail. This is fine for development!

---

## 🐛 Troubleshooting

### Port Already in Use

If port 8080 is already taken:

```bash
# Change in docker-compose.yml
ports:
  - "3001:8080"  # Change 8080 to any available port

# Or stop the conflicting service
lsof -ti:8080 | xargs kill
```

### PostgreSQL Connection Issues

```bash
# Check if PostgreSQL is running
docker-compose ps postgres

# Restart PostgreSQL
docker-compose restart postgres

# View PostgreSQL logs
docker-compose logs postgres

# Connect to PostgreSQL directly
docker-compose exec postgres psql -U jobber -d jobber_clone
```

### Migration Errors

```bash
# Revert last migration
npm run migration:revert

# Drop database and start fresh (CAUTION: deletes all data!)
docker-compose down -v
docker-compose up -d postgres redis
npm run db:migrate
npm run db:seed
```

### Dependencies Issues

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Or use the clean script
./clean.sh
```

### Docker Issues

```bash
# Rebuild containers
docker-compose build --no-cache

# Remove all containers and volumes
docker-compose down -v

# Check Docker status
docker ps
docker-compose ps
```

---

## 📚 Next Steps

Once your backend is running:

1. **Explore the API** - Use Swagger UI to test all endpoints
2. **Read the docs** - Check out the comprehensive README.md
3. **Review the code** - Explore the modular architecture
4. **Build the frontend** - Connect your frontend to this API
5. **Configure integrations** - Add API keys for full functionality
6. **Customize** - Modify to fit your specific needs

---

## 🆘 Need Help?

- **Documentation**: See [README.md](./README.md) for comprehensive guide
- **API Docs**: http://localhost:8080/api/docs
- **Swagger JSON**: http://localhost:8080/api/docs-json
- **Implementation Details**: See `/docs/BACKEND_IMPLEMENTATION_PLAN.md`

---

## 🎯 Quick Command Reference

| Task | Command |
|------|---------|
| **First time setup** | `./setup.sh` |
| **Start development** | `./dev.sh` |
| **Stop services** | `./stop.sh` |
| **Full cleanup** | `./clean.sh` |
| **Run migrations** | `npm run db:migrate` |
| **Seed data** | `npm run db:seed` |
| **View logs** | `docker-compose logs -f` |
| **Test API** | http://localhost:8080/api/docs |

---

**Happy Coding! 🚀**

The backend is fully functional and ready for development. Start building your frontend or mobile app!
