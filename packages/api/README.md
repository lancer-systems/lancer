# @lancer/api

Dashboard API for Lancer - a REST API built with Fastify, Drizzle ORM, and SQLite.

## Prerequisites

- Node.js 22+
- pnpm 10+

## Getting Started

### 1. Install dependencies

```bash
pnpm install
```

### 2. Initialize the database

```bash
pnpm exec drizzle-kit push
```

This creates the SQLite database at `data/lancer.db` and applies the schema.

### 3. Run the development server

```bash
pnpm start:watch
```

The API will be available at `http://localhost:3141`.

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm start` | Start server |
| `pnpm start:watch` | Start server with hot reload |
| `pnpm test` | Run tests |
| `pnpm test:watch` | Run tests in watch mode |
| `pnpm generate:openapi` | Generate OpenAPI spec |
| `pnpm exec drizzle-kit push` | Apply schema to database |
| `pnpm exec drizzle-kit generate` | Generate migration files |
| `pnpm exec drizzle-kit studio` | Open Drizzle Studio (database GUI) |

## Project Structure

```
src/
├── main.ts                   # Entry point
└── modules/
    ├── app.module.ts         # Fastify application
    ├── common/               # Shared utilities
    │   ├── exceptions/       # HTTP exceptions
    │   └── middlewares/      # Global middlewares
    ├── database/             # Database module
    │   ├── database.service.ts
    │   ├── schemas/          # Drizzle table schemas
    │   ├── entities/         # TypeScript types
    │   ├── fixtures/         # Shared test fixtures
    │   └── seeders/          # Shared test seeders
    ├── health/               # Health check module
    ├── auth/                 # Authentication module
    ├── bootstrap/            # Bootstrap module (initial setup)
    │   ├── fixtures/         # Module-specific fixtures
    │   └── guards/           # Route guards
    └── provider/             # Cloud provider module
        ├── fixtures/         # Module-specific fixtures
        └── seeders/          # Module-specific seeders
```

## API Endpoints

All endpoints are prefixed with `/api`.

| Method | Path | Description |
|--------|------|-------------|
| GET  | `/api/health` | Health check |
| POST | `/api/bootstrap` | Initial setup (admin + provider) |
| POST | `/api/auth/login` | Login with email/password |
| POST | `/api/providers` | Create a cloud provider |

## Tech Stack

- **Framework**: [Fastify](https://fastify.dev/) v5
- **Validation**: [Zod](https://zod.dev/) v4 with [fastify-type-provider-zod](https://github.com/turkerdev/fastify-type-provider-zod)
- **ORM**: [Drizzle ORM](https://orm.drizzle.team/) with SQLite
- **Database**: SQLite via [better-sqlite3](https://github.com/WiseLibs/better-sqlite3)
- **Password Hashing**: [Argon2](https://github.com/napi-rs/node-rs/tree/main/packages/argon2)
- **Authentication**: JWT with httpOnly cookies via [jose](https://github.com/panva/jose)
- **CORS**: Enabled via [@fastify/cors](https://github.com/fastify/fastify-cors)
- **Rate Limiting**: Via [@fastify/rate-limit](https://github.com/fastify/fastify-rate-limit)

## Security

- CORS enabled (all origins, credentials supported)
- Rate limiting on sensitive endpoints:
  - Login: 5 requests/minute per IP
  - Bootstrap: 3 requests/hour per IP
- JWT tokens with 7-day expiry
- Argon2 password hashing
- AES-256-GCM credential encryption
