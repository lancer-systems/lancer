# Lancer

Deploy to AWS with the simplicity of Render/Heroku, at a fraction of the cost.

[![Code quality](https://github.com/lancer-systems/lancer/actions/workflows/quality.yml/badge.svg)](https://github.com/lancer-systems/lancer/actions/workflows/quality.yml)
[![License: Apache 2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)

## Overview

Lancer is a self-hosted platform that deploys web services, static sites, databases, and caches to AWS. It uses native AWS services (ECS, ALB, RDS, ElastiCache) while keeping costs low and maintaining full ejection capability.

## Pricing Comparison

| Provider | 1 Service (2 vCPU, 2GB) | 3 Services | 5 Services |
|----------|-------------------------|------------|------------|
| Render   | $25/month               | $75/month  | $125/month |
| Heroku   | $25-50/month            | $75-150/month | $125-250/month |
| **Lancer** | **$19-28/month**      | **$52/month** | **$76/month** |

Lancer becomes more cost-effective as you add services, thanks to shared infrastructure (ALB).

## Prerequisites

- AWS account with IAM credentials (Access Key ID + Secret Access Key)
- A region where you want to deploy

## Installation

```bash
curl -fsSL https://get.lancer.run | bash
```

This will:
1. Prompt for your AWS credentials
2. Deploy the Lancer infrastructure to AWS (~$19/month)
3. Create your admin account
4. Provide you with the dashboard URL

## Quick Start

After installation, access the Lancer dashboard at the URL provided by the installer. From there you can:

- Deploy web services from Git repositories
- Create databases (PostgreSQL/MySQL)
- Create caches (Valkey/Redis-compatible)
- Deploy static sites
- Manage environment variables

## Features

### Web Services (ECS on EC2)

Deploy containerized web applications from Git repositories.

- **Sizes**: nano ($3) | micro ($6) | small ($12) | medium ($24) | large ($48)
- Automatic builds via CodeBuild
- Custom domains with automatic HTTPS via ACM

### Static Sites (S3 + CloudFront)

Deploy static websites with global CDN.

- Private S3 bucket with CloudFront OAC
- Automatic HTTPS
- Optional custom domain
- CodeBuild for automatic deployments

### Databases (RDS)

PostgreSQL or MySQL databases.

- **Sizes**: small ($15) | medium ($30) | large ($60)
- Credentials stored in AWS Secrets Manager
- Network-isolated (only accessible from your services)

### Caches (ElastiCache Valkey)

Redis-compatible caching.

- **Sizes**: small ($12) | medium ($25) | large ($50)
- Network-isolated (only accessible from your services)

## Architecture

```
Internet
    |
    v
+------------------------------------------+
|              VPC (10.0.0.0/16)           |
|                                          |
|  +------------------------------------+  |
|  |   Application Load Balancer ($16) |  |
|  |   - HTTPS with ACM certificates   |  |
|  |   - Host-based routing            |  |
|  +------------------------------------+  |
|                   |                      |
|  +------------------------------------+  |
|  |         ECS Cluster               |  |
|  |   +----------+  +----------+      |  |
|  |   | Service  |  | Service  | ...  |  |
|  |   |  $3-48   |  |  $3-48   |      |  |
|  |   +----------+  +----------+      |  |
|  +------------------------------------+  |
|                                          |
|  +--------------+  +-----------------+   |
|  |     RDS      |  |   ElastiCache   |   |
|  |   $15-60     |  |     $9-50       |   |
|  +--------------+  +-----------------+   |
+------------------------------------------+

Static Sites (S3 + CloudFront) - separate from VPC
```

## Configuration

Lancer stores configuration in `~/.lancer/`:

- `config.json` - AWS profile, region, infrastructure IDs
- `services.json` - Deployed services metadata
- Pulumi state is stored in S3 (`lancer-state-{account-id}`)

## Cost Breakdown

### Infrastructure (Fixed)

| Component | Cost/month |
|-----------|------------|
| VPC + Subnets | $0 |
| Application Load Balancer | $16 |
| ECS Cluster | $0 |

### Web Services

| Size | vCPU | RAM | Cost/month |
|------|------|-----|------------|
| nano | 2 | 0.5 GB | $3 |
| micro | 2 | 1 GB | $6 |
| small | 2 | 2 GB | $12 |
| medium | 2 | 4 GB | $24 |
| large | 2 | 8 GB | $48 |

### Databases (RDS)

| Size | Instance | Storage | Cost/month |
|------|----------|---------|------------|
| small | db.t4g.micro | 20 GB | ~$15 |
| medium | db.t4g.small | 50 GB | ~$30 |
| large | db.t4g.medium | 100 GB | ~$60 |

### Caches (ElastiCache Valkey)

| Size | Instance | Cost/month |
|------|----------|------------|
| small | cache.t4g.micro | ~$12 |
| medium | cache.t4g.small | ~$25 |
| large | cache.t4g.medium | ~$50 |

## Technical Choices

### Why ECS on EC2 instead of Fargate?

Fargate costs ~$40/month for 1 vCPU + 2GB. ECS on EC2 with t4g.small costs $12/month - a 70% savings.

### Why ALB instead of custom reverse proxy?

ALB is a managed service with zero maintenance, native HTTPS via ACM, and simple Pulumi integration. The $16/month cost is worth the simplicity.

### Why no NAT Gateway?

NAT Gateway costs $32/month. We use public subnets with Security Groups for isolation, saving significant cost.

### Why Pulumi?

- TypeScript-native (no YAML/DSL)
- Automation API for programmatic control
- Multi-cloud ready for future providers
- Strong typing and IDE support

### Why Valkey instead of Redis?

Valkey is a Redis-compatible open-source alternative (AWS MemoryDB/ElastiCache fork). It's cheaper and avoids Redis licensing concerns.

## Development

```bash
# Clone the repository
git clone https://github.com/lancer-systems/lancer.git
cd lancer

# Install dependencies
pnpm install

# Run API locally (port 3141)
cd packages/api && pnpm start:watch

# Run tests
pnpm --filter @lancer/api test
pnpm --filter @lancer/infrastructure test

# Type check
pnpm typecheck

# Lint
pnpm lint

# Fix lint issues
pnpm lint:fix
```

## Packages

| Package | Description |
|---------|-------------|
| `@lancer/api` | Dashboard API (Fastify + Drizzle + SQLite) |
| `@lancer/dashboard` | Dashboard SPA (React + Vite + wouter) |
| `@lancer/installer` | Installer script (curl \| bash) |
| `@lancer/infrastructure` | Pulumi components for AWS resources |
| `@lancer/shared` | Code shared by the other packages |
| `@lancer/website` | Documentation website (Next.js + Fumadocs) |

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup and guidelines, and [SUPPORT.md](SUPPORT.md) to get help. Everyone taking part follows the [code of conduct](CODE_OF_CONDUCT.md).

## Security

Never report a vulnerability in a public issue. See [SECURITY.md](SECURITY.md).

## License

Apache 2.0 - See [LICENSE](LICENSE) for details.
