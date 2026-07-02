# Coding Standards — Dual Canvas Editor

**Version:** 1.0 | **Last updated:** 2026-07-02 UTC  
**Applies to:** All TypeScript, React, and Node.js code in the monorepo

---

## 1. Project Stack & Constraints

| Layer            | Technology          | Version             |
| ---------------- | ------------------- | ------------------- |
| Runtime          | Node.js             | ≥ 20.0.0            |
| Package Manager  | pnpm                | ≥ 9.0.0             |
| Language         | TypeScript          | 5.8.3+              |
| Frontend         | React               | 19.1.0+             |
| Bundler (Client) | Vite                | 6.3+                |
| Server           | Express             | 5.1+                |
| Linter           | ESLint              | 9.26+ (flat config) |
| Formatter        | Prettier            | 3.5+                |
| Git Hooks        | Husky + lint-staged | 9+ / 15+            |

---

## 2. TypeScript Rules

### 2.1 Strict Mode

All `tsconfig.json` files **must** extend `tsconfig.base.json`, which enforces:

```json
{
  "compilerOptions": {
    "strict": true,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "noFallthroughCasesInSwitch": true
  }
}
```

- No `"strict": false` anywhere.
- No `// @ts-nocheck` at file level.

### 2.2 Type Annotations

```typescript
// ✅ GOOD — explicit return types on exported functions
export function calculateTotal(items: Item[]): number { ... }

// ❌ BAD — implicit return type on public API
export function processData(input) { ... }

// ✅ GOOD — use `unknown` over `any`
function parse(input: unknown): ParsedData { ... }

// ❌ BAD
function parse(input: any): ParsedData { ... }

// ✅ GOOD — narrow with type guards
if (typeof input === 'string') { ... }

// ❌ BAD — cast with `as`
const data = apiResponse as SomeType;

// ✅ ALLOWED — only when type is provably known and narrowing is impractical
const el = document.getElementById('root') as HTMLDivElement;
```

### 2.3 Enums vs Unions

```typescript
// ✅ PREFERRED — const object + union type (tree-shakeable)
export const CanvasTool = {
  Select: 'select',
  Brush: 'brush',
  Text: 'text',
  Eraser: 'eraser',
} as const;
export type CanvasTool = (typeof CanvasTool)[keyof typeof CanvasTool];

// ❌ AVOID — TypeScript enums
enum CanvasTool {
  Select,
  Brush,
  Text,
  Eraser,
}
```

### 2.4 Discriminated Unions for State

```typescript
// ✅ GOOD — exhaustive switch
type UploadState =
  | { status: 'idle' }
  | { status: 'uploading'; progress: number }
  | { status: 'done'; url: string }
  | { status: 'error'; message: string };

function renderState(state: UploadState): string {
  switch (state.status) {
    case 'idle':
      return 'Ready';
    case 'uploading':
      return `Uploading ${state.progress}%`;
    case 'done':
      return state.url;
    case 'error':
      return state.message;
    default: {
      const _exhaustive: never = state;
      return _exhaustive;
    }
  }
}
```

### 2.5 readonly Usage

```typescript
// ✅ GOOD — readonly for config and props
interface CanvasProps {
  readonly width: number;
  readonly height: number;
  readonly layers: readonly Layer[];
}

// ✅ GOOD — readonly arrays as return types
function getTools(): readonly Tool[] { ... }
```

---

## 3. React Rules

### 3.1 Component Structure

```tsx
// ✅ GOOD — one component per file, colocated types
// File: CanvasEditor.tsx
import { type FC, useState } from 'react';

interface CanvasEditorProps {
  readonly width: number;
  readonly height: number;
}

export const CanvasEditor: FC<CanvasEditorProps> = ({ width, height }) => {
  // hooks at top
  const [tool, setTool] = useState<string>('select');

  // event handlers
  const handleToolChange = (nextTool: string) => {
    setTool(nextTool);
  };

  // render
  return <div>...</div>;
};
```

### 3.2 File Organization

```
client/src/
├── components/           # Reusable UI components
│   ├── CanvasEditor/
│   │   ├── CanvasEditor.tsx
│   │   ├── CanvasEditor.css
│   │   ├── CanvasEditor.test.tsx
│   │   └── index.ts      # barrel export
│   └── Toolbar/
├── hooks/                # Custom hooks
├── store/                # State management
├── services/             # API client functions
├── types/                # Shared TypeScript types
├── utils/                # Pure utility functions
├── App.tsx
├── App.css
└── main.tsx
```

### 3.3 State Management

```typescript
// ✅ PREFERRED — colocate state at closest common ancestor
function Parent() {
  const [activeTool, setActiveTool] = useState('select');
  return (
    <>
      <Toolbar tool={activeTool} onToolChange={setActiveTool} />
      <Canvas tool={activeTool} />
    </>
  );
}

// ✅ ACCEPTABLE — Context for deeply shared state (theme, auth, locale)
// ⚠️ REVIEW NEEDED — External state library (Zustand, Redux). Must be justified by ADR.

// ❌ BAD — prop drilling more than 2 levels
function Grandparent() {
  const [tool, setTool] = useState('select');
  return <Parent tool={tool} onToolChange={setTool} />;
}
function Parent({ tool, onToolChange }) {
  return <Child tool={tool} onToolChange={onToolChange} />;
}
function Child({ tool, onToolChange }) { ... }
// ↑ Refactor to composition or context.
```

### 3.4 useEffect Guidelines

```typescript
// ✅ GOOD — event-driven data fetching with cleanup
useEffect(() => {
  let cancelled = false;
  fetchDesign(id).then((data) => {
    if (!cancelled) setDesign(data);
  });
  return () => {
    cancelled = true;
  };
}, [id]);

// ⚠️ REVIEW — useEffect for derived state (prefer useMemo)
// ❌ BAD
useEffect(() => {
  setFullName(`${first} ${last}`);
}, [first, last]);
// ✅ GOOD
const fullName = useMemo(() => `${first} ${last}`, [first, last]);
```

### 3.5 Error Boundaries

Every major feature area **must** be wrapped in an error boundary:

```tsx
// At minimum in main.tsx:
<ErrorBoundary fallback={<ErrorFallback />}>
  <App />
</ErrorBoundary>

// Feature-level boundaries:
<ErrorBoundary fallback={<CanvasError />}>
  <CanvasEditor />
</ErrorBoundary>
```

---

## 4. Node.js / Express Rules

### 4.1 Server Structure

```
server/src/
├── index.ts              # Entry point: app setup & listen
├── config.ts             # All configuration (env vars, constants)
├── middleware/            # Express middleware (auth, logging, error)
├── routes/               # Route handlers (thin — delegate to services)
├── services/             # Business logic (image processing, export, etc.)
├── types/                # Server-specific types
└── assets/               # Static assets (fonts, samples)
```

### 4.2 Error Handling

```typescript
// ✅ REQUIRED — global error middleware
// Must be registered BEFORE app.listen()
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[error]', err.message);
  res.status(500).json({ error: 'Internal Server Error' });
});

// ✅ REQUIRED — async route wrappers
// Option A: try/catch in every handler
app.get('/api/data', async (req, res) => {
  try {
    const data = await fetchData();
    res.json(data);
  } catch (err) {
    // Error propagates to global error middleware via next()
    next(err); // Express 5: pass err to next
  }
});

// Option B: thin asyncHandler utility
const asyncHandler = (fn: RequestHandler) => (req: Request, res: Response, next: NextFunction) =>
  Promise.resolve(fn(req, res, next)).catch(next);
```

### 4.3 Security Middleware (Required)

```typescript
// ✅ REQUIRED before any production deploy
import cors from 'cors';
import rateLimit from 'express-rate-limit';

app.use(
  cors({
    origin: process.env.CORS_ORIGIN ?? 'http://localhost:3000',
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    credentials: true,
  }),
);

app.use(
  rateLimit({
    windowMs: 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
  }),
);

app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

if (process.env.TRUST_PROXY) app.set('trust proxy', 1);
```

### 4.4 Configuration

```typescript
// ✅ GOOD — centralized config with defaults
// File: server/src/config.ts
export const config = {
  port: Number(process.env.PORT) || 4000, // ⚠️ Fix: use parseInt for PORT=0 edge case
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:3000',
  upload: {
    maxSize: 10 * 1024 * 1024,
    allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp', 'image/gif'],
  },
} as const;

// ❌ BAD — scattered process.env reads
app.listen(process.env.PORT || 4000);
const maxSize = process.env.UPLOAD_MAX ?? '10mb';
```

### 4.5 Structured Logging

```typescript
// ✅ PREFERRED — request ID + structured logs
app.use((req, _res, next) => {
  (req as any).requestId = crypto.randomUUID();
  next();
});

// ✅ Use levels consistently:
//   console.error — server errors, crash conditions
//   console.warn  — degraded functionality, retryable failures
//   console.info  — request logs, startup messages
//   console.debug — detailed diagnostics (development only)

// For production, replace with a structured logger (pino, winston).
```

---

## 5. Naming Conventions

| Element               | Convention              | Example                                   |
| --------------------- | ----------------------- | ----------------------------------------- |
| React components      | PascalCase              | `CanvasEditor`, `ToolButton`              |
| Component files       | PascalCase              | `CanvasEditor.tsx`                        |
| Hooks                 | camelCase, `use` prefix | `useCanvasSync`, `useImageUpload`         |
| Functions             | camelCase               | `calculateExportSize`                     |
| Variables             | camelCase               | `activeTool`, `layerCount`                |
| Constants             | UPPER_SNAKE             | `MAX_UPLOAD_SIZE`, `DEFAULT_EXPORT_WIDTH` |
| Types / Interfaces    | PascalCase              | `CanvasLayer`, `UploadResult`             |
| Files (non-component) | kebab-case              | `image-utils.ts`, `api-client.ts`         |
| CSS classes           | kebab-case, BEM         | `.canvas-slot--active`                    |
| CSS custom properties | kebab-case              | `--color-accent`, `--radius-lg`           |
| Server routes         | kebab-case              | `/api/canvas-state`, `/api/export-pdf`    |
| Environment variables | UPPER_SNAKE             | `CORS_ORIGIN`, `UPLOAD_MAX_SIZE`          |

---

## 6. Git Practices

### 6.1 Branch Naming

```
feature/canvas-rendering
fix/cors-config
refactor/image-pipeline
chore/update-deps
```

### 6.2 Commit Messages

Conventional Commits format:

```
feat(client): add canvas toolbar component
fix(server): restrict CORS to known origins
refactor(shared): extract color utilities to shared module
chore: update TypeScript to 5.8.3
test(server): add upload endpoint tests
docs: add API documentation
```

### 6.3 What NOT to Commit

- `node_modules/` — already in `.gitignore`
- `dist/` — already in `.gitignore`
- `*.tsbuildinfo` — **add to `.gitignore`**
- `.env` files (except `.env.example`)
- IDE-specific files (`.vscode/`, `.idea/`) — add to global gitignore

---

## 7. Testing Standards

### 7.1 Test Framework

Use **Vitest** (compatible with Vite project setup):

```bash
pnpm add -D vitest @testing-library/react @testing-library/jest-dom jsdom
```

### 7.2 Test File Location

```
client/src/components/CanvasEditor/CanvasEditor.test.tsx
server/src/services/image-processor.test.ts
```

### 7.3 What to Test

| Test Type   | What                                                      | Coverage Target |
| ----------- | --------------------------------------------------------- | --------------- |
| Unit        | Pure functions, utilities, Zod schemas, config validation | 80%             |
| Component   | Render output, user interaction, state changes            | 60%             |
| Integration | API routes (supertest), canvas sync logic                 | 70%             |
| E2E         | Critical user flows (upload → edit → export)              | 1 flow minimum  |

### 7.4 Test Naming

```typescript
// ✅ GOOD — describe behavior, not implementation
describe('CanvasEditor', () => {
  it('renders two canvas slots', () => { ... });
  it('highlights active canvas when clicked', () => { ... });
  it('shows error boundary when rendering fails', () => { ... });
});

// ❌ BAD
it('test1', () => { ... });
it('works correctly', () => { ... });
```

---

## 8. CSS / Styling

### 8.1 Design Tokens

All colors, spacing, radii defined as CSS custom properties in `:root`:

```css
:root {
  --color-bg: #0f1117;
  --color-surface: #1a1d27;
  --color-border: #2a2d3a;
  --color-text: #e1e3e8;
  --color-text-muted: #8b8fa3;
  --color-accent: #6c63ff;
  --color-error: #ff4d4f;
  --color-success: #52c41a;
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 16px;
  --space-lg: 24px;
  --space-xl: 32px;
}
```

### 8.2 BEM-Lite Convention

```css
/* Block */
.canvas-slot {
}

/* Block — Modifier */
.canvas-slot--active {
}

/* Block — Element */
.canvas-slot__label {
}
```

### 8.3 Responsive Design

```css
/* Mobile-first */
.canvas-placeholder {
  display: grid;
  grid-template-columns: 1fr; /* single column on mobile */
}

@media (min-width: 768px) {
  .canvas-placeholder {
    grid-template-columns: 1fr 1fr; /* two columns on tablet+ */
  }
}
```

---

## 9. Performance Rules

1. **No full-canvas redraws** on every state change — use dirty-rect tracking or layer caching
2. **Debounce color picker / slider inputs** to 16ms (one frame)
3. **Virtualize** lists with > 50 items (asset browser, layer panel)
4. **Lazy-load** images in asset browser (`loading="lazy"`)
5. **Code-split** via `React.lazy` for heavy components (Fabric.js wrapper, export preview)
6. **Stream** image processing via `sharp` pipes — don't buffer entire images
7. **Tree-shake** canvas library imports — import only used modules

---

## 10. Accessibility Minimum (WCAG 2.1 AA)

1. All canvas surfaces: `role="application"` + `aria-label`
2. All interactive elements: keyboard focusable + `:focus-visible` style
3. All form inputs: associated `<label>` or `aria-labelledby`
4. Color contrast: ≥ 4.5:1 for text, ≥ 3:1 for large text
5. Touch targets: ≥ 44×44px on mobile
6. Error messages: `role="alert"` on error containers
7. `prefers-reduced-motion` respected for animations
8. Correct `lang` attribute on `<html>` tag

---

## 11. Dependency Hygiene

1. **No unused dependencies** in `package.json` — remove what isn't imported
2. **Pin exact versions** in `pnpm-lock.yaml` (automatic with `--frozen-lockfile` in CI)
3. **Audit new deps** before adding: check bundle size impact, maintenance status, license
4. **Prefer built-in** Node.js APIs over dependencies where practical (e.g., `crypto.randomUUID()` over `uuid` package for basic usage)
