# Jobber Clone - Field Service Management Platform

Full-stack field service management platform inspired by [Jobber](https://www.getjobber.com/).

**Backend (100%)** | **Frontend (100%)** | **Mobile (95%)**

---

## 🚀 Quick Start

### Backend (NestJS + PostgreSQL)

```bash
cd backend
./setup.sh          # Automated setup (Docker, DB, seed data)
./dev.sh            # Start development server
```

**Access:**
- API: http://localhost:8080/api
- Swagger Docs: http://localhost:8080/api/docs
- Demo Login: `admin@example.com` / `password123`

### Frontend (React + TypeScript)

```bash
cd frontend
npm install
npm run dev
```

**Access:** http://localhost:5173

### Mobile (Kotlin Multiplatform)

```bash
cd mobile
./gradlew :composeApp:iosSimulatorArm64Run    # iOS
./gradlew :composeApp:assembleDebug            # Android
```

See [Mobile README](mobile/README.md) for detailed setup.

---

## 📊 Project Status

| Component | Technology | Files | Lines | Status |
|-----------|-----------|-------|-------|--------|
| **Backend** | NestJS + TypeScript + PostgreSQL | 180+ | 23,171+ | ✅ 100% |
| **Frontend** | React 18 + TypeScript + TanStack | 61 | 11,000+ | ✅ 100% |
| **Mobile** | Kotlin Multiplatform + Compose | 70+ | 10,000+ | ✅ 95% |

**Total:** ~44,000+ lines of production-ready code

---

## 🎯 Core Features (14 Modules)

| Feature | Backend | Frontend | Mobile |
|---------|---------|----------|--------|
| Authentication & Authorization | ✅ | ✅ | ✅ |
| Client Management (CRM) | ✅ | ✅ | ✅ |
| Quotes & Estimates | ✅ | ✅ | - |
| Job Scheduling & Dispatch | ✅ | ✅ | ✅ |
| Invoicing & Payments | ✅ | ✅ | - |
| Payment Processing (Stripe) | ✅ | ✅ | - |
| Time Tracking | ✅ | ✅ | ✅ |
| Schedule/Calendar | ✅ | ✅ | ✅ |
| Team Management | ✅ | ✅ | - |
| Communications (Email/SMS) | ✅ | ✅ | - |
| File Management (S3) | ✅ | ✅ | - |
| Reports & Analytics | ✅ | ✅ | - |
| Settings & Configuration | ✅ | ✅ | - |
| Audit Logs | ✅ | - | - |

---

## 🛠️ Technology Stack

### Backend
- **Framework:** NestJS 10 + TypeScript 5
- **Database:** PostgreSQL 14 + TypeORM
- **Cache:** Redis 6 + Bull queues
- **Authentication:** JWT + Passport.js
- **Validation:** class-validator
- **API Docs:** Swagger/OpenAPI

### Frontend
- **Framework:** React 18 + TypeScript 5
- **Build Tool:** Vite 5
- **State Management:** TanStack Query + Zustand
- **Router:** TanStack Router (type-safe)
- **UI Library:** Material-UI (MUI) v5
- **Forms:** React Hook Form + Zod
- **HTTP Client:** Axios

### Mobile
- **Platform:** Kotlin Multiplatform 2.1.0
- **UI:** Compose Multiplatform 1.7.1 (95% shared code)
- **Navigation:** Decompose 3.2.0
- **State:** MVIKotlin 4.2.0 (MVI pattern)
- **HTTP:** Ktor Client 3.0.2
- **Database:** SQLDelight 2.0.2 (offline-first)
- **Targets:** iOS + Android

### Infrastructure
- **Containers:** Docker + Docker Compose
- **Orchestration:** Kubernetes (planned)
- **CI/CD:** GitHub Actions (planned)

### Integrations
- ✅ **Stripe** - Payment processing
- ✅ **SendGrid** - Email delivery
- ✅ **Twilio** - SMS messaging
- ✅ **AWS S3** - File storage
- ⏳ **QuickBooks** - Accounting (planned)
- ⏳ **Google Maps** - GPS & routing (planned)

---

## 📁 Project Structure

```
jobber-clone/
├── backend/              # NestJS API (180+ files, 23k+ lines)
│   ├── src/
│   │   ├── modules/      # 14 feature modules
│   │   ├── database/     # Entities, migrations
│   │   └── common/       # Guards, decorators, filters
│   ├── docker-compose.yml
│   └── setup.sh
├── frontend/             # React web app (61 files, 11k+ lines)
│   ├── src/
│   │   ├── features/     # 14 feature modules
│   │   ├── components/   # Common + Layout components
│   │   ├── services/     # API clients
│   │   └── store/        # Zustand stores
│   └── package.json
├── mobile/               # KMP mobile (70+ files, 10k+ lines)
│   ├── shared/
│   │   └── commonMain/   # 95% shared code
│   ├── androidApp/       # 5% Android-specific
│   └── iosApp/           # 5% iOS-specific
└── docs/                 # Documentation
    ├── planning/         # Requirements (15 docs)
    ├── implementation/   # Status reports (7 docs)
    ├── backend/          # API documentation
    └── guides/           # Getting started
```

---

## 📚 Documentation

- **[Documentation Index](docs/docs_index.md)** - Main documentation hub
- **[Backend Quick Start](docs/guides/BACKEND_QUICK_START.md)** - Get started in 5 minutes
- **[Backend API Docs](docs/backend/README.md)** - Complete API reference
- **[Planning Documents](docs/planning/)** - Original requirements (15 docs)
- **[Implementation Reports](docs/implementation/)** - Status & verification (7 docs)

---

## 🗄️ Database Schema

**18 Entities:**
- Account, User
- Client, ClientContact, ClientAddress
- Quote, QuoteLineItem
- Job, JobPhoto
- Invoice, InvoiceLineItem
- Payment, Refund
- TimeEntry
- Message
- AuditLog, Sequence, FileMetadata

See [Database Schema](docs/planning/07_database_schema.md) for full details.

---

## 🔌 API Endpoints (170+)

| Module | Endpoints | Description |
|--------|-----------|-------------|
| Auth | 7 | Login, register, refresh token, password reset |
| Accounts | 6 | Account management, subscriptions |
| Users | 10 | Team member CRUD, roles, permissions |
| Clients | 12 | Client CRUD, contacts, addresses |
| Quotes | 10 | Quote CRUD, send, convert to job |
| Jobs | 12 | Job CRUD, scheduling, photos, status |
| Invoices | 9 | Invoice CRUD, send, payment tracking |
| Payments | 9 | Stripe integration, refunds |
| Time Tracking | 10 | Clock in/out, GPS, approval workflow |
| Schedule | 5 | Calendar events, conflict detection |
| Communications | 8 | Email/SMS sending, templates |
| Files | 4 | S3 upload/download, presigned URLs |
| Reports | 4 | Dashboard, revenue, jobs, analytics |
| Audit Logs | 2 | Activity tracking |

**Full documentation:** http://localhost:8080/api/docs (Swagger)

---

## 🧪 Development Scripts

### Backend

```bash
./setup.sh      # First-time setup
./dev.sh        # Start dev server
./stop.sh       # Stop services
./clean.sh      # Clean everything
```

### Frontend

```bash
npm install     # Install dependencies
npm run dev     # Dev server (port 5173)
npm run build   # Production build
npm run lint    # Run linter
```

### Mobile

```bash
./gradlew :composeApp:iosSimulatorArm64Run    # iOS
./gradlew :composeApp:assembleDebug            # Android
./gradlew test                                  # Tests
```

---

## ✅ Code Quality

- Zero TODOs in production code
- TypeScript strict mode throughout
- Comprehensive error handling
- Input validation (Zod, class-validator)
- Security best practices (JWT, bcrypt, CORS, helmet)
- Clean architecture with separation of concerns
- 95% code sharing in mobile (KMP)

---

## 🚦 Next Steps

1. ⏳ **Automated Testing** - Unit, integration, E2E tests
2. ⏳ **Production Deployment** - CI/CD pipeline, Kubernetes
3. ⏳ **Advanced Features** - Online booking, route optimization, QuickBooks
4. ⏳ **Security Audit** - Penetration testing, compliance verification

---

## 📖 References

- Original inspiration: [Jobber](https://www.getjobber.com/)
- Market analysis: [FastFounder article](https://fastfounder.ru/trend-luchshe-hajpa/) (Russian)

---

## 📄 License

This is a learning project inspired by Jobber. Not affiliated with or endorsed by Jobber.

---

**Documentation:** [docs/docs_index.md](docs/docs_index.md)
**API Docs:** http://localhost:8080/api/docs (when running)
**Quick Start:** [Backend Setup Guide](docs/guides/BACKEND_QUICK_START.md)
