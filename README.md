# Dual Canvas Editor

Monorepo for the Dual Canvas Editor project — a collaborative canvas editing tool.

## Stack

| Layer   | Tech                                       |
| ------- | ------------------------------------------ |
| Client  | React 19, TypeScript, Vite                 |
| Server  | Express 5, TypeScript, tsx (dev)           |
| Tooling | ESLint 9, Prettier 3, Husky 9, lint-staged |
| CI      | GitHub Actions (lint + typecheck + build)  |
| Runtime | Node 20+, pnpm 9                           |

## Project structure

```
dual-canvas-editor/
├── client/                  # React frontend (Vite)
│   ├── src/
│   │   ├── main.tsx         # Entry point
│   │   ├── App.tsx          # Root component
│   │   └── App.css          # Global styles (dark theme)
│   ├── index.html
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── package.json
├── server/                  # Express backend
│   ├── src/
│   │   └── index.ts         # Server entry (port 4000)
│   ├── tsconfig.json
│   └── package.json
├── .github/workflows/ci.yml # CI pipeline
├── .husky/pre-commit         # Pre-commit hook (lint-staged)
├── eslint.config.js         # Shared ESLint flat config
├── .prettierrc               # Shared Prettier config
├── tsconfig.base.json       # Shared TS compiler base
├── package.json             # Root workspace config
└── README.md
```

## Getting started

### Prerequisites

- Node.js 20+
- pnpm 9+

### Install

```bash
pnpm install
```

### Run (both client + server concurrently)

```bash
pnpm dev
```

### Run individually

```bash
pnpm dev:client   # → http://localhost:3000
pnpm dev:server   # → http://localhost:4000
```

### Verify

```bash
pnpm check        # lint + typecheck
pnpm build        # full production build
```

## Scripts

| Script              | Description                      |
| ------------------- | -------------------------------- |
| `pnpm dev`          | Run client + server concurrently |
| `pnpm build`        | Build both packages              |
| `pnpm lint`         | ESLint across all packages       |
| `pnpm typecheck`    | TypeScript check across packages |
| `pnpm check`        | `lint` + `typecheck`             |
| `pnpm format`       | Prettier write                   |
| `pnpm format:check` | Prettier check                   |

## Notes

- Canvas library decision is **pending research outcome**.
- Client proxy is configured in `vite.config.ts` to forward `/api` to the server at port 4000.
- Server listens on port 4000 by default (override with `PORT` env).
- All workspace members share the same ESLint + Prettier config at the root.
