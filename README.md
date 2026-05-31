# Xander Creditors API

Backend service for the Xander Creditors microfinance platform. It manages customer accounts, loan and savings lifecycles, payments, feedback, notifications, and system content — with role-based access control enforced on every protected route.

Built with **NestJS 11**, **Prisma 7**, and **PostgreSQL**.

## What this service does

Xander Creditors is a lending and savings platform. This API is the core backend that:

- Authenticates users with JWT access tokens and rotating refresh sessions
- Enforces fine-grained permissions derived from database roles
- Models the full business domain: loan applications, active loans, repayments, savings products, customer feedback, agreements, and CMS-style content
- Provides a production-ready foundation (validation, rate limiting, structured errors, logging) for feature modules to build on

## Tech stack

| Layer | Choice |
| --- | --- |
| Runtime | Node.js, TypeScript |
| Framework | NestJS 11 |
| Database | PostgreSQL via Prisma 7 (`@prisma/adapter-pg`) |
| Auth | Passport JWT, bcrypt, refresh-token rotation |
| Validation | class-validator, Joi (environment) |
| Rate limiting | `@nestjs/throttler` |

## Architecture highlights

- **Schema-driven RBAC** — Permissions are defined in code (`src/auth/constants/permissions.constant.ts`), seeded into the database, and checked at runtime by `PermissionGuard`. Users with the `SUPER_ADMIN` role bypass permission checks.
- **Dual-credential login** — Users can sign in with either their `userId` or email address.
- **Global infrastructure** — JWT auth, permission checks, request logging, and exception filters are registered once in `CoreInfrastructureModule` and apply application-wide.
- **Type-safe configuration** — Environment variables are validated at startup with Joi; invalid config fails fast before the server listens.

## Project structure

```
src/
├── auth/                 # Login, refresh, JWT strategy, guards, permission decorators
├── common/
│   ├── config/           # Env validation and typed config keys
│   ├── filters/          # Global and Prisma exception handling
│   └── interceptors/     # Request logging
├── prisma/               # PrismaService module
├── app.module.ts         # Root module (config, throttling, pipes)
└── main.ts               # Bootstrap and CORS

prisma/
├── schema.prisma         # Full domain schema (users, loans, savings, RBAC, …)
├── seed.ts               # Reference data, permissions, super-admin bootstrap
└── data/                 # Static seed data (districts, genders)
```

## Domain overview

The Prisma schema covers the main platform areas:

- **Identity & access** — Users, roles, permissions, session state
- **Loans** — Applications, active loans, interest rates, loan types, payments
- **Savings** — Applications, savings accounts, configuration, audit trail
- **Support** — Feedback, feedback chat threads, notifications, messages
- **Compliance & content** — Agreements, terms & conditions, about/adverts/brand assets, special offers

Feature endpoints for these domains are added incrementally; the auth and RBAC layer is already in place.

## Getting started

### Prerequisites

- Node.js 18+ (20+ recommended)
- PostgreSQL database
- npm

### Installation

```bash
npm install
```

### Environment

Create a `.env` file in the project root:

```env
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://user:password@localhost:5432/xander_creditors
JWT_SECRET=your-secret-key
JWT_EXPIRATION_TIME=3600s

# Optional — used by the seed script for the default admin password
INITIAL_ADMIN_PASSWORD=change-me-in-production
```

| Variable | Required | Description |
| --- | --- | --- |
| `NODE_ENV` | Yes | `development`, `production`, or `test` |
| `PORT` | No | HTTP port (default `3000`) |
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `JWT_SECRET` | Yes | Secret for signing access tokens |
| `JWT_EXPIRATION_TIME` | No | Access token TTL (default `3600s`) |
| `INITIAL_ADMIN_PASSWORD` | No | Password for the seeded super-admin user |

### Database setup

```bash
# Apply migrations (when available)
npx prisma migrate dev

# Generate Prisma client
npx prisma generate

# Seed reference data, permissions, roles, and default admin
npm run db:seed
```

The seed creates a super-admin user (`sudo@xandercreditors.com`) with the `SUPER_ADMIN` role and all permissions. Change the default password via `INITIAL_ADMIN_PASSWORD` before running seed in any shared environment.

### Run the API

```bash
# Development (watch mode)
npm run start:dev

# Production build
npm run build
npm run start:prod
```

The server listens on the port defined in `PORT` (default `3000`).

## Authentication

All routes are protected by default unless marked with `@Public()`.

### Login

```http
POST /api/auth/login
Content-Type: application/json

{
  "identity": "sudo@xandercreditors.com",
  "password": "your-password"
}
```

Response includes `accessToken`, `refreshToken`, and a `user` object with `roles` and `permissions`.

Login is rate-limited to **5 requests per minute** per client.

### Refresh session

```http
POST /api/auth/refresh
Content-Type: application/json

{
  "userId": "sudo@xandercreditors.com",
  "refreshToken": "<refresh-token-from-login>"
}
```

Access tokens expire after **15 minutes**. Refresh tokens are valid for **7 days** and are stored hashed in the user's `sessionState`.

### Protecting routes

```typescript
import { Permissions } from './auth/decorators/permissions.decorator';
import { PERMISSIONS } from './auth/constants/permissions.constant';

@Permissions(PERMISSIONS.LOANS.READ)
@Get()
findAll() { /* ... */ }
```

## Scripts

| Command | Description |
| --- | --- |
| `npm run start:dev` | Start in watch mode |
| `npm run build` | Compile to `dist/` |
| `npm run start:prod` | Run compiled output |
| `npm run lint` | ESLint with auto-fix |
| `npm run test` | Unit tests |
| `npm run test:e2e` | End-to-end tests |
| `npm run db:seed` | Run Prisma seed |

## Security defaults

- Passwords hashed with bcrypt (12 rounds in seed)
- Refresh tokens hashed with SHA-256 before storage
- Global rate limit: **30 requests per minute** (stricter on login)
- Request body validation with whitelist — unknown fields are rejected
- CORS enabled with credentials support

## License

UNLICENSED — private project.
