# @lancer/installer

Interactive CLI installer for deploying Lancer to AWS.

## Usage

```bash
# Production install
curl -fsSL https://get.lancer.run | bash

# Development (dry-run by default)
pnpm start
```

## Options

| Option | Description |
|--------|-------------|
| `--dry-run` | Preview infrastructure changes without deploying |

## Installation Flow

1. **AWS Configuration** - Collect credentials (Access Key ID, Secret Access Key, Region)
2. **Admin User** - Collect email and password for the admin account
3. **Deploy Infrastructure** - Create VPC, ALB, ECS cluster, and Lancer API service
4. **Setup Lancer** - Bootstrap the API with admin user and AWS provider

## Development

The `start` script runs with `--dry-run` by default to prevent accidental deployments during development.

## State Management

Pulumi state is stored in S3:
- Bucket: `lancer-state-{account-id}`
- Versioning enabled
- Region: same as deployment

In dry-run mode, a temporary local backend is used.

## Estimated Costs

| Resource | Monthly Cost |
|----------|-------------|
| Foundation (VPC, ALB, ECS) | ~$16 |
| Lancer API (t4g.nano ARM) | ~$3 |
| **Total** | **~$19** |
