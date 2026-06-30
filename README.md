# OSP GIS Platform

An Outside Plant (OSP) GIS web application for a telecom Managed Service operation. Displays sites, fiber routes, manholes, splice closures, poles, and cabinets on an interactive map with hover-to-inspect, layer control, full CRUD, a dynamic asset type admin, and an operations dashboard.

## Quick start

```bash
# Install all dependencies (root + workspaces)
npm install

# Set up the database and seed demo data
npm run db:seed

# Run backend and frontend together
npm run dev
```

- Backend API: http://localhost:3001
- Frontend app: http://localhost:5173

## Architecture

Monorepo with npm workspaces:

| Workspace | Stack |
|-----------|-------|
| `backend/` | Node + Express + TypeScript, Prisma ORM, SQLite |
| `frontend/` | React + Vite + TypeScript, TailwindCSS, MapLibre GL, Recharts |

## Data model

| Model | Purpose |
|-------|---------|
| `AssetType` | Defines a component category and its custom fields (`fieldSchema` JSON) |
| `Asset` | Any physical network object — points to its AssetType |
| `Connection` | Network topology and fiber links between assets |
| `Incident` | Faults feeding availability and MTTR metrics |
| `MaintenanceLog` | Service history per asset |

### Dynamic asset system

Every `Asset` points to an `AssetType`. The `fieldSchema` on the type defines that type's custom fields. Adding a new component type (e.g. "Optical Splitter") requires inserting one `AssetType` row — the map layer, create/edit forms, and hover popup all render automatically.

## Environment variables

Backend reads from `backend/.env` (copy from `backend/.env.example`):

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `file:./prisma/dev.db` | SQLite file path |
| `PORT` | `3001` | Express listen port |
| `CORS_ORIGIN` | `http://localhost:5173` | Allowed frontend origin |

## Commands

```bash
npm run dev          # start both apps
npm run build        # build both apps
npm run lint         # lint both workspaces
npm run typecheck    # type-check both workspaces
npm run test         # test both workspaces
npm run db:seed      # reseed the demo network
```

## Tests

```bash
npm test -w backend   # vitest + supertest against live SQLite
npm test -w frontend  # vitest + jsdom + @testing-library/react
npm test              # run both workspaces
```

The backend tests are self-contained — they create and clean up their own data, so no separate test database is needed.

## Migrating to PostgreSQL + PostGIS

1. Change `backend/prisma/schema.prisma` datasource provider to `postgresql`
2. Update `DATABASE_URL` to a Postgres connection string
3. Add PostGIS extension and convert `geometry` / `attributes` columns to native types
4. Run `prisma migrate dev`

## Deployment (future)

Docker + Hostinger VPS + Traefik reverse proxy. See Part F of the build spec.
