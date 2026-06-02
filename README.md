# Monorepo Structure

This project is organized as a monorepo with separate workspaces for backend, frontend, and testing.

## Folders

- `backend/`: Laravel application source code
- `frontend/`: React + Vite frontend application
- `testing/`: Testing workspace (currently contains backend test suite)

## Architecture Direction

- Backend is API-first (business logic + data access)
- Frontend contains all UI views/pages
- Use backend endpoints from frontend via HTTP (`/api/*`)

## Current Test Location

- Backend tests: `testing/backend/tests`
- Backend phpunit config: `testing/backend/phpunit.xml`

## Run Backend

From the `backend/` folder:

```bash
composer install
php artisan serve
```

Quick API checks:

```bash
php artisan route:list
# GET /api/health
# GET /api/landing
```

If needed, run Vite from `backend/` as well:

```bash
npm install
npm run dev
```

## Run Frontend

From the `frontend/` folder:

```bash
npm install
npm run dev
```

Build frontend for production:

```bash
npm run build
```
