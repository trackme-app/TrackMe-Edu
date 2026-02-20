# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Local development (Docker required)
npm run dev:compose          # Start all services with hot-rebuild
npm run dev:compose-down     # Stop and remove all containers, images, volumes

# Build
npm run build                # Build all workspaces
npm run build:shared         # Build only @tme/shared-shared_utils

# Test
npm run test                 # Run tests across all workspaces

# Run tests for a specific workspace
npm run test --workspace @tme/shared-shared_utils

# Scaffold a new service (interactive)
bash scripts/new_service.sh
```

Test files live under `tests/` within each workspace and must match `**/*.test.ts`.

## Architecture

### Monorepo Layout

This is an npm workspaces monorepo for **TrackMe Education**, a multi-tenant SaaS education platform. The repo is split into two distinct platforms and a shared layer:

```
src/
  admin/           # Admin-facing platform (tenant management, billing, etc.)
    apps/          # Edge-facing services (API gateways, frontends)
    services/      # Internal microservices
  application/     # Student/learner-facing platform
    apps/
    services/
  shared/          # Cross-platform utilities
    shared_utils/  # @tme/shared-shared_utils — logger, BaseClient, RequestContext
```

Package names follow `@tme/<type>-<name>` (e.g. `@tme/admin-api-gateway`, `@tme/shared-shared_utils`).

### Service-to-Service Communication

All internal communication uses mTLS. The `BaseClient` abstract class in `@tme/shared-shared_utils` is the standard base for any service client:

- Wraps Axios with an `https.Agent` loaded from certificate files
- Auto-retries on network errors (3 retries, exponential backoff)
- Propagates cookies from the inbound request to upstream calls via `RequestContext`
- Forwards `Set-Cookie` headers from upstream responses back to the original caller

Extend `BaseClient` and pass an `SslConfig` (`{ key, cert, ca }` file paths) when constructing client classes for downstream services.

### Request Context

`RequestContext` (AsyncLocalStorage) stores the active Express `Request`/`Response` for the duration of a request. Middleware must call `RequestContext.run({ req, res }, next)` to establish the context. `BaseClient` reads from this store automatically to forward cookies.

### Shared Utilities (`@tme/shared-shared_utils`)

| Export | Purpose |
|--------|---------|
| `createServiceLogger(name)` | Pino logger bound to a service name; ships to Logtail in production |
| `createTraceLogger(traceId)` | Child logger bound to a trace ID for distributed tracing |
| `BaseClient` | Abstract mTLS Axios client — extend for each downstream service |
| `RequestContext` | AsyncLocalStorage for the active Express req/res pair |

### Data Model

Production uses **DynamoDB**. Tables: `tenants`, `users`, `courses`, `course_user`. All tables use a composite key of `(tenant_id, id)` to enforce tenant isolation.

### TypeScript

All packages extend `tsconfig.base.json` at the monorepo root (target: ES2022, module: CommonJS, strict). Individual workspaces have a local `tsconfig.base.json` copy and a `tsconfig.json` that extends it.

### Docker

Each service has a multi-stage Dockerfile (`builder` → `production`). The production stage runs as the `node` user. Local orchestration is via `compose.yml` (gitignored; copy from `compose.example.yml`). A sidecar container generates mTLS certificates on startup using OpenSSL.
