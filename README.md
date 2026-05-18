# EaseWorq Online Shop Admin

Web admin frontend for managing online orders and order status.

## Development

**Windows (PowerShell)** — clear `NODE_OPTIONS` if install fails with an OpenSSL error:

```powershell
cd D:\Personal-Repos\Fareed-Mart\EaseWorq\EaseWorqOnlineShoping\EaseWorq-OnlineShoping-Website-Admin-Frontend
$env:NODE_OPTIONS=""
npm install --legacy-peer-deps
npm start
```

**macOS / Linux:**

```bash
npm install --legacy-peer-deps
npm start
```

> npm has no `--deps` flag. Use `--legacy-peer-deps` for this Angular 10 tree, or `npm ci --legacy-peer-deps` for a clean install from `package-lock.json`.

## Build

```bash
npm run build          # default (local environment)
npm run build:prod     # production
npm run build:qa       # QA
```

Output is written to `dist/`. For deployed environments, you can adjust API URLs in `dist/assets/config/runtime-config.json` after build without rebuilding.

## Environment files

- `environment.ts` — local development
- `environment.prod.ts` — production build
- `environment.qa.ts` — QA build
- `environment.urls.ts` — shared API path definitions (online orders, order status, auth, notifications, i18n)

Change backend hostnames in each environment file’s `BACKEND_URL` / `OauthHost` constants. Add new API paths to `environment.urls.ts` only.
