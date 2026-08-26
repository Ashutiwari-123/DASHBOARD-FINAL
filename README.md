# DevScope Dashboard

A multi-user GitHub App dashboard for repository-specific GitHub Actions runs, jobs, logs, and pull requests. Every visitor installs the GitHub App on their own account and sees only repositories explicitly granted to that installation.

## Requirements

- Node.js 22+
- npm 10+
- A MongoDB Atlas database (or the included local MongoDB container)

## Local setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`. The API health check is available at `http://localhost:3000/api/health`.

Replace the placeholders in `.env.local` with your GitHub App Client ID and Client Secret. Keep the downloaded private key outside this repository and set `GITHUB_APP_PRIVATE_KEY_PATH` to its absolute location. Generate a random `SESSION_SECRET` containing at least 32 characters.

The GitHub App callback URL for local testing is `http://localhost:3000/api/github/callback`. The App must request read-only Actions, Checks, Contents, Deployments, Pull requests, and Commit statuses permissions.

## Quality commands

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run check
```

## Docker

For a local app and MongoDB environment, set `MONGODB_URI=mongodb://mongo:27017/devops-dashboard` in `.env.local`, then run:

```bash
docker compose up --build
```

## Project layout

```text
src/
├── app/                  # App Router pages, layouts, and route handlers
│   └── api/              # Backend HTTP API
├── components/           # Reusable UI components (add by feature)
├── features/             # Feature modules for dashboard capabilities
├── lib/                  # Database, environment, and shared server utilities
├── models/               # Mongoose models
├── services/             # GitHub and monitoring integrations
└── types/                # Shared TypeScript types
```

Empty feature directories are represented by `.gitkeep` files so the intended architecture survives source control.

## CI/CD

`.github/workflows/ci.yml` runs linting, type checks, tests, and a production build on pull requests and pushes to `main`. Dependabot checks npm and GitHub Actions dependencies.

## Suggested next milestone

1. Add authentication and protected dashboard routes.
2. Add `Project`, `Deployment`, and `Incident` Mongoose models.
3. Connect the GitHub Actions API using a server-only token.
4. Store normalized workflow runs and render deployment history.
5. Add webhook signature verification for live GitHub events.

## Security notes

- Secrets stay server-side and are loaded from environment variables.
- Baseline browser security headers are configured in `next.config.ts`.
- API inputs should be validated with Zod before database writes.
- Use a least-privilege GitHub token and rotate it if exposed.
- Restrict MongoDB Atlas network access and create a dedicated database user.
