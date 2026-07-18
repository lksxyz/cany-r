<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Repo facts

pnpm + Turborepo monorepo. Node `>=20`. Package manager pinned to `pnpm@10.33.4` in root `package.json`.

## Layout

- `apps/web` — Next.js 16.2.6 (App Router). The only deployable.
- `packages/ui` — shadcn/ui component library, `aria-vega` style, `hugeicons` icon set. Consumed by the app via `transpilePackages: ["@workspace/ui"]` in `apps/web/next.config.ts:4`.
- `packages/eslint-config` — flat-config presets: `base`, `next-js`, `react-internal`.
- `packages/typescript-config` — TS presets: `base.json`, `nextjs.json`, `react-library.json`.

App routes: `apps/web/app/`. App-local React components: `apps/web/components/`. App-local hooks: `apps/web/hooks/`. App-local helpers: `apps/web/lib/`. shadcn UI primitives: `packages/ui/src/components/`, imported as `@workspace/ui/components/<name>`. The `cn` helper is `@workspace/ui/lib/utils`.

## Commands

Run from repo root.

- `pnpm dev` — `turbo dev` (persistent, uncached across all packages).
- `pnpm build` — `turbo build`. Reads `.env*` as inputs; outputs `.next/**` minus `.next/cache/**`.
- `pnpm lint` / `pnpm typecheck` / `pnpm format` — turbo-wrapped. Lint is warnings-only (`eslint-plugin-only-warn` in `packages/eslint-config/base.js:24`), never fatal.

Single package: `pnpm --filter web <script>` or `pnpm --filter @workspace/ui <script>`. `web` exposes `dev`, `build`, `start`, `lint`, `format`, `typecheck`; `ui` exposes only `lint`, `format`, `typecheck` (no `build` script).

Add a shadcn component: `pnpm dlx shadcn@latest add <name> -c apps/web`. The CLI writes into `packages/ui/src/components/`, not into `apps/web/components/`.

## Conventions

- Prettier: 2-space, no semis, double quotes, `printWidth: 80`, `trailingComma: "es5"`, LF. Tailwind class sorting uses `packages/ui/src/styles/globals.css` as the stylesheet (see `.prettierrc:9`).
- Path aliases — `apps/web`: `@/*` → `./*`, `@workspace/ui/*` → `packages/ui/src/*`; `packages/ui`: `@workspace/ui/*` → `src/*`. `apps/web/components.json` maps shadcn's `components`/`hooks`/`lib` aliases to local `@/...` but `utils` and `ui` to `@workspace/ui/...`.
- No test framework, no CI workflow, no env files committed. Add tests/CI only if the user asks.
- No git remote configured. `git push` and `gh pr create` will fail until a remote is added.
- Theme: `apps/web/app/layout.tsx` wraps the app in a `next-themes` `ThemeProvider` (see `apps/web/components/theme-provider.tsx`). The provider also installs a global `d` keypress handler that toggles dark mode, suppressed in inputs/contenteditable. Don't add another theme toggle without removing that handler first.
- Tailwind v4 via `@tailwindcss/postcss`. `packages/ui/src/styles/globals.css` declares `@source` globs that scan the app for class usage; if a new top-level directory under `apps/web/` holds class-using code and styles get purged, add it there.

## Don't

- Don't rely on pre-Next-16 knowledge. Routing, data fetching, route handlers, `proxy` (replaces `middleware`), cache components, and file conventions live in `node_modules/next/dist/docs/01-app/...` — read before writing.
- Don't append `Co-Authored-By: Claude` to commit messages.
- Don't run a direct DB CLI (psql/mysql/sqlite) against any database without explicit permission.
- Don't commit without inspecting `git status` / `git diff` first; never commit secrets or `.env*` files.
