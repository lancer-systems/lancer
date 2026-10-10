# Contributing to Lancer

Thank you for helping. Lancer is a small project run by one maintainer, so a focused change with a clear reason goes a long way.

## Before you start

- A bug: open a [bug report](https://github.com/lancer-systems/lancer/issues/new?template=bug.yml).
- A feature: open a [feature request](https://github.com/lancer-systems/lancer/issues/new?template=feature.yml) before writing code.
- A vulnerability: never in an issue. Report it privately, as [SECURITY.md](SECURITY.md) says.

Never put real credentials in an issue, a pull request, a test or a screenshot: no AWS access key, secret key, session token, account ID or password. Make them up.

## Set up

You need Node.js 22 or later and pnpm 10 or later.

```bash
git clone https://github.com/lancer-systems/lancer.git
cd lancer
pnpm install --frozen-lockfile
```

Then run the package you work on:

```bash
pnpm --filter @lancer/api start:watch        # API on http://localhost:3141
pnpm --filter @lancer/dashboard start:watch  # Dashboard (Vite)
pnpm --filter @lancer/website start:watch    # Documentation website (Next.js)
pnpm --filter @lancer/installer start        # Installer, in dry-run mode
```

The installer runs with `--dry-run` by default, so it deploys nothing to AWS during development.

The dashboard imports an API client that is generated, not committed. Generate it before building the dashboard or running its end-to-end tests, and again after changing an API route:

```bash
pnpm --filter @lancer/api generate:openapi        # writes packages/api/openapi.json
pnpm --filter @lancer/dashboard generate:openapi  # runs orval into packages/dashboard/src/lib/api/
```

## Make the change

One pull request per change: a fix, a feature, a refactor, never two of them together. Small pull requests get reviewed sooner.

[AGENTS.md](AGENTS.md) holds the rules and conventions: policy, commands that are not obvious, API module layout, error handling, tests. Read it before a change bigger than a fix.

A new dependency needs a reason in the pull request description: dependencies stay few and popular.

## Check it

GitHub Actions checks every pull request with the same commands. Run them locally first:

```bash
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm --filter @lancer/api test
pnpm --filter @lancer/infrastructure test
pnpm --filter @lancer/dashboard build
pnpm --filter @lancer/dashboard test:e2e
```

`test:e2e` needs Chromium once per machine: `pnpm --filter @lancer/dashboard exec playwright install chromium`. `pnpm lint:fix` fixes formatting and import order.

## Open the pull request

The pull request template asks why the change is needed, how you tested it, and the reason for any new dependency. Write the commit messages and the description in English, without a `feat:` or `fix:` prefix.

## Code of conduct

Everyone taking part follows the [code of conduct](CODE_OF_CONDUCT.md).
