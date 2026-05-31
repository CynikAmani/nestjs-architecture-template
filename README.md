# Generic NestJS Infrastructure Boilerplate

An enterprise-ready foundation for building scalable NestJS APIs. This repository provides a production-grade core layer — authentication, authorization, configuration, observability, and database access — that is intentionally decoupled from any specific business logic. Clone it as a starter template, drop in your own domain modules, and ship faster without re-solving infrastructure concerns on every project.

The boilerplate is designed to be fully reusable: swap the example schema, seed data, and feature modules for your own domain without touching the global infrastructure layer.

## Core Infrastructure Blueprint

The architecture separates **infrastructure** from **domain** at every layer:

- **Application shell** — Root module wires global config validation, throttling, validation pipes, and feature modules.
- **Core infrastructure module** — A single global module registers JWT authentication, permission enforcement, structured exception handling, and request logging across the entire application.
- **Auth layer** — Stateless access tokens, rotating refresh sessions, and decorator-driven route protection (`@Public()`, `@Permission()`).
- **Data access** — Prisma with the PostgreSQL driver adapter, a shared service module, and database-aware exception mapping.
- **Configuration** — Environment variables validated at startup; the server refuses to boot with invalid or missing required config.

> **Reference schema note:** The database layer currently ships with a microfinance domain schema (Xander Creditors) included solely as a complex, real-world example. It demonstrates how the core handles deep relational models, permission seeding at scale, and RBAC across many entities. This schema is optional reference material — replace `prisma/schema.prisma`, seed scripts, and domain constants with your own models when starting a new project. The infrastructure modules require no changes to do so.

## Tech Stack

| Layer | Technology |
| --- | --- |
| Runtime | Node.js, TypeScript |
| Framework | NestJS 11 |
| ORM | Prisma 7 (`@prisma/adapter-pg`) |
| Database | PostgreSQL |
| Authentication | Passport JWT, bcrypt |
| Rate limiting | `@nestjs/throttler` |
| Validation | class-validator, Joi |

## Global Architecture Highlights

### Generic Global Infrastructure (`CoreInfrastructureModule`)

All cross-cutting concerns are registered once and applied application-wide: JWT auth guard, permission guard, global exception filters (including Prisma error mapping), and a logging interceptor. Feature modules inherit this behavior automatically — no per-controller boilerplate required.

### Dual-Credential Login

The auth service accepts a single `identity` field that resolves against multiple user attributes (e.g. username or email). This pattern is domain-agnostic and can be extended to additional lookup fields without changing the login contract.

### Schema-Driven RBAC (`PermissionGuard`)

Permissions are declared as typed constants, seeded into the database, and bound to roles. Endpoints declare required permissions via a decorator; the guard enforces them at runtime. A designated super-admin role bypasses checks for operational access. Replace the permission catalog and seed pipeline to match any domain.

### Type-Safe Environment Validation

A Joi validation schema runs at startup through `@nestjs/config`. Required variables, defaults, and allowed values are enforced before the HTTP server binds to a port — preventing silent misconfiguration in production.

## Project Structure

```
src/
├── auth/                     # Authentication module
│   ├── decorators/           # @Public(), @Permission()
│   ├── guards/               # JwtAuthGuard, PermissionGuard
│   ├── strategies/           # Passport JWT strategy
│   ├── dto/                  # Request validation objects
│   └── constants/            # Permission catalog (swap for your domain)
├── common/
│   ├── config/               # Env schema, typed config keys
│   ├── filters/              # Global & database exception handlers
│   └── interceptors/         # Request logging
├── prisma/                   # PrismaService module
├── core-infrastructure.module.ts   # Global guards, filters, interceptors
├── app.module.ts             # Root module assembly
└── main.ts                   # Bootstrap & CORS

prisma/
├── schema.prisma             # Database schema (replace with your domain)
├── seed.ts                   # Permissions, roles, reference data bootstrap
└── data/                     # Static seed payloads
```

## Getting Started

### Prerequisites

- Node.js 18+ (20+ recommended)
- PostgreSQL
- npm

### Installation

```bash
npm install
```

### Environment Setup

Create a `.env` file in the project root:

```env
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://user:password@localhost:5432/your_database
JWT_SECRET=your-secret-key
JWT_EXPIRATION_TIME=3600s
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

### Database Setup

```bash
npx prisma migrate dev
npx prisma generate
npm run db:seed
```

The seed pipeline provisions permissions, a super-admin role, reference data, and a default administrator account. Customize or replace `prisma/seed.ts` entirely when adopting a new domain.

### Run

```bash
# Development (watch mode)
npm run start:dev

# Production
npm run build
npm run start:prod
```

## Authentication & Security Defaults

All routes require a valid JWT unless decorated with `@Public()`.

**Login**

```http
POST /api/auth/login
Content-Type: application/json

{
  "identity": "admin@example.com",
  "password": "your-password"
}
```

The response returns `accessToken`, `refreshToken`, and a `user` payload including resolved `roles` and `permissions`. A separate `POST /api/auth/refresh` endpoint rotates both tokens using a hashed refresh session stored server-side.

**Security benchmarks**

| Control | Default |
| --- | --- |
| Global rate limit | 30 requests / minute |
| Login rate limit | 5 requests / minute |
| Password storage | bcrypt (12 salt rounds in seed) |
| Refresh token storage | SHA-256 hash (never stored in plaintext) |
| Request validation | Whitelist mode — unknown fields are rejected |
| CORS | Enabled with credentials support |

Access tokens expire after **15 minutes**. Refresh tokens are valid for **7 days**.

## Automation Scripts

| Command | Description |
| --- | --- |
| `npm run start` | Start the application |
| `npm run start:dev` | Start in watch mode |
| `npm run start:debug` | Start with debugger attached |
| `npm run start:prod` | Run compiled output |
| `npm run build` | Compile to `dist/` |
| `npm run lint` | ESLint with auto-fix |
| `npm run format` | Prettier format |
| `npm run test` | Unit tests |
| `npm run test:watch` | Unit tests in watch mode |
| `npm run test:cov` | Unit tests with coverage |
| `npm run test:e2e` | End-to-end tests |
| `npm run db:seed` | Run Prisma seed |

## License

UNLICENSED — Reusable Core Architecture Boilerplate.
