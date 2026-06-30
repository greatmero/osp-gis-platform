# OSP GIS Platform — Project Guide for Claude Code

## What this is
An Outside Plant (OSP) GIS web app for a telecom Managed Service operation. Map of sites, fiber routes, manholes, closures, poles, and cabinets, with hover details, layer control, CRUD, an admin to define new component types, and an operations dashboard.

## Architecture
- Monorepo, npm workspaces: backend/ (Express + Prisma + SQLite) and frontend/ (React + Vite + MapLibre).
- Everything physical is an Asset that points to an AssetType. AssetType.fieldSchema (JSON) defines that type's custom fields. New component types are added by inserting an AssetType, never by changing the schema.
- Geometry is stored as GeoJSON in JSON columns now so a later move to PostgreSQL + PostGIS stays clean.

## Conventions
- TypeScript strict everywhere. ESLint + Prettier. Avoid any.
- Keep API thin, components small, code readable with brief comments.
- Map layer colors and dashboard chart colors must match per AssetType.
- Do not introduce a new map library, ORM, or state manager without asking.

## Commands
- `npm run dev` at root runs backend and frontend together.
- `npm run db:seed` reseeds the demo network.
- `npm run lint`, `npm run typecheck`, `npm run build`, `npm test` per workspace.

## Future (not now)
- Dockerize both apps, migrate SQLite to PostgreSQL + PostGIS, deploy to the Hostinger VPS behind Traefik.
