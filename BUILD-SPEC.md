# OSP GIS Platform — Claude Code Build Spec and Prompts

A complete, dynamic Outside Plant (OSP) GIS web application for a Managed Service operation. Built from scratch in VS Code with Claude Code, version-controlled on GitHub, and CI-ready.

This document is your playbook. Part A explains the architecture and the locked decisions. Part B is the kickoff prompt you paste into Claude Code first. Part C is the phased prompts you run after that, one at a time. Part D is the `CLAUDE.md` file that keeps Claude Code on track. Parts E and F are the data model and working tips.

---

## Part A — Locked decisions and architecture

| Area | Decision | Why |
|------|----------|-----|
| Map engine | MapLibre GL JS via `react-map-gl`, OpenFreeMap dark vector basemap | Free, no API key, modern vector rendering, hover and clustering support |
| Frontend | React + Vite + TypeScript, TailwindCSS, Recharts, Zustand, TanStack Query | Fast, typed, modern dashboard and map UI |
| Backend | Node + Express + TypeScript, Prisma ORM | Clean REST API, typed, easy Postgres switch later |
| Database now | SQLite (geometry stored as GeoJSON JSON) | Zero setup, instant demo, fully seeded |
| Database later | PostgreSQL + PostGIS | Change Prisma provider, add geometry columns, keep the same schema shape |
| Repo | Single monorepo, npm workspaces, `frontend/` and `backend/` | One repo, one clone, run both with one command |
| Source control | Git plus GitHub repo via `gh` CLI | Versioned from commit one |
| CI | GitHub Actions: install, lint, typecheck, build, test | Green pipeline from the start |
| Deploy | Documented but not built now (Docker + Hostinger VPS + PostGIS) | Per your choice: deploy later |

### The dynamic asset model (the heart of the system)

Every physical thing on the network is an **Asset**. Every asset points to an **AssetType** that defines what it is and what fields it carries. This is what lets you add any new component later without touching the database schema or rewriting code.

- `AssetType` holds a `key`, a label, a geometry kind (point, line, or polygon), an icon, a color, and a `fieldSchema` (a JSON list of the custom fields that type carries).
- `Asset` holds its `assetTypeId`, a name and code, a status, its `geometry` as GeoJSON, and an `attributes` JSON blob that follows its type's `fieldSchema`.
- To add a new component type (say "Optical Splitter" or "Customer Drop"), you insert one `AssetType` row. The map layer, the create and edit forms, and the hover popup all render from the `fieldSchema` automatically.

Relationships are handled by a self-referencing `parentId` on Asset (for example a closure that sits inside a manhole) and a separate `Connection` table for network topology (which cable links which two assets, and how many fibers it carries).

For the Managed Service side, `Incident` and `MaintenanceLog` tables feed the dashboard with availability, open faults, and mean time to repair.

### Seeded demo dataset

The seed script populates a realistic OSP network around 6th of October City and Cairo, Egypt, so the app renders fully populated on first run:

- Sites and POPs: exchanges, BTS / cell sites, and street cabinets
- Fiber routes: aerial, underground, and duct cables drawn as real polylines between sites
- Manholes and handholes placed along the routes
- Splice closures, poles, and FDH cabinets
- A mix of statuses (operational, degraded, down, under maintenance)
- Sample incidents and maintenance logs so the dashboard KPIs are non-empty

---

## Part B — Kickoff prompt (paste this into Claude Code first)

> Open an empty folder in VS Code, start Claude Code, and paste the block below as your first message. It scaffolds the whole project, wires git and GitHub, and gets both apps running before you add any features.

```text
You are setting up a brand new project from scratch. Read this whole brief, then build it step by step, explaining each step briefly as you go and pausing if a command needs my input.

PROJECT: An Outside Plant (OSP) GIS web application for a telecom Managed Service operation. It shows sites, fiber routes, manholes, splice closures, poles, and cabinets on a modern interactive map, with hover-to-inspect details, a layer control, an operations dashboard, and full create / read / update / delete on every asset. The system must be dynamic: I can define new component types later without changing the database schema.

TECH STACK (use exactly this):
- Monorepo with npm workspaces. Two workspaces: backend/ and frontend/. A root package.json with a "dev" script that runs both together using concurrently.
- Backend: Node + Express + TypeScript, Prisma ORM, SQLite for now. Store all geometry as GeoJSON in JSON/text columns so a later move to PostgreSQL + PostGIS is clean.
- Frontend: React + Vite + TypeScript, TailwindCSS, react-map-gl with maplibre-gl, Recharts for charts, Zustand for UI state, TanStack Query for data fetching.
- Map basemap: OpenFreeMap dark vector style (no API key). Add a basemap switcher with a light option too.

DATA MODEL (Prisma):
- AssetType: id, key (unique string), label, geometryKind (point|line|polygon), icon, color, fieldSchema (JSON array of {key,label,type,required,options}), createdAt.
- Asset: id, assetTypeId (FK), name, code (unique), status (string), geometry (JSON GeoJSON), attributes (JSON), parentId (self FK, nullable), createdAt, updatedAt.
- Connection: id, fromAssetId (FK), toAssetId (FK), cableAssetId (FK nullable), fiberCount (int), notes.
- Incident: id, assetId (FK), category, severity (low|medium|high|critical), status (open|investigating|resolved), openedAt, resolvedAt (nullable), description.
- MaintenanceLog: id, assetId (FK), date, type, technician, notes.

API (Express REST, all under /api):
- CRUD for /asset-types and /assets.
- GET /assets/geojson?type=KEY returns a GeoJSON FeatureCollection for the map, each feature carrying its asset id, name, status, type, and attributes in properties.
- CRUD for /connections and /incidents, read for /maintenance.
- GET /dashboard/summary returns aggregated KPIs: counts by asset type, counts by status, total fiber length in km, open incidents, resolved incidents, mean time to repair in hours, incidents over the last 12 weeks, and top 5 sites by attached asset count.

SETUP TASKS, IN ORDER:
1. Create the monorepo structure and root tooling (package.json with workspaces and a concurrently dev script, .gitignore, .editorconfig, a .env.example for backend, and a clear README).
2. Build the backend: Prisma schema, an SQLite datasource, the Express server with the routes above, CORS, request validation with zod, and a typed API.
3. Build the frontend shell: routing with react-router (pages: Map, Dashboard, Assets table, Asset Types admin, Incidents), a dark modern layout with a left sidebar and a top bar, and TanStack Query wired to the backend.
4. Add a comprehensive seed script in backend/prisma/seed.ts that creates the AssetTypes (Site, BTS Site, Cabinet, Fiber Cable, Manhole, Handhole, Splice Closure, Pole, FDH) and a realistic seeded network of roughly 12 sites, 15 fiber routes, 30 manholes, plus closures, poles, incidents, and maintenance logs, all with real coordinates around 6th of October City and Cairo, Egypt. Mix the statuses.
5. Confirm both apps run with one root command and the map and dashboard render with seeded data.
6. Initialize git, create a sensible first commit, then create a GitHub repo named osp-gis-platform using the gh CLI and push. If gh is not installed or not authenticated, stop and tell me the exact commands to run.
7. Add a GitHub Actions workflow at .github/workflows/ci.yml that installs dependencies, runs lint, typecheck, build, and test for both workspaces. Keep it green on the current code.

CODING STANDARDS:
- TypeScript strict mode on. ESLint and Prettier configured. No any unless justified in a comment.
- Write clean, readable code with short comments where intent is not obvious. Avoid clever one-liners.
- Keep components small and the API thin. Put shared types in a backend/src/types and import them on the frontend by copying or via a shared file, your call, but keep it simple.

Start now with step 1. After each numbered step, give me a one-line status and continue. Stop only when you need a decision or a credential from me.
```

---

## Part C — Phased feature prompts (run after the kickoff)

Run these one at a time, after the kickoff build is committed and pushed. Each ends with a check so you can verify before moving on. This matches an incremental, section-by-section build.

### Phase 1 — Map core with layers and hover details

```text
Build the main Map page now.

- Render a full-height MapLibre map centered on 6th of October City, Egypt, with the OpenFreeMap dark style and a basemap switcher (dark / light).
- Add one map layer per AssetType, fed from GET /assets/geojson?type=KEY. Point types render as colored circles or symbols using the type color, line types (fiber cables) render as colored lines, polygon types as filled shapes.
- Add a Layer Control panel (collapsible, top right) listing every AssetType with a toggle and its color swatch, so I can show or hide each layer.
- Add hover behavior: when I hover a feature, show a small popup with the asset name, type, status (color coded), and its three most relevant attributes. The popup follows the cursor and disappears on mouse out.
- Add click behavior: clicking a feature opens a right-side detail panel showing every field for that asset (name, code, status, all attributes, parent, and connections), with Edit and Delete buttons.
- Cluster dense point layers (manholes, poles) at low zoom and expand them on zoom in.
- Add a search box that finds an asset by name or code and flies the map to it.

Confirm hover, click, layer toggles, clustering, and search all work against the seeded data.
```

### Phase 2 — Add and edit assets directly on the map

```text
Make the map editable so I can add any component type.

- Add an "Add Asset" mode. I pick an AssetType from a dropdown, then draw on the map: a click places a point type, a multi-click path draws a line type, a polygon for polygon types. On finish, open a form.
- The create form is generated dynamically from the chosen AssetType's fieldSchema, plus name, code, and status. Validate required fields. On save, POST to /assets and refresh the layer.
- The edit form (from the detail panel) reuses the same dynamic form, pre-filled, and PUTs the changes.
- Add a confirm dialog for delete.
- Let me draw a Connection: pick two existing assets and an optional cable, set fiber count, and save to /connections. Show connections as thin lines linking the two assets on the map.

Confirm I can add a brand new manhole and a new fiber route by drawing, edit them, connect two sites, and delete an asset, all without a page reload.
```

### Phase 3 — Asset Types admin (the dynamic engine)

```text
Build the Asset Types admin page so I can define new component types with no code changes.

- List all AssetTypes in a table with their key, label, geometry kind, color, icon, and field count.
- A "New Asset Type" form lets me set the key, label, geometry kind, color, icon, and build a fieldSchema by adding fields (each with key, label, type from text/number/select/date/boolean, required flag, and options for selects).
- Editing an AssetType updates its fieldSchema. Warn me if removing a field that existing assets use.
- After I create a new type, it must immediately appear as a new toggleable map layer and as an option in the Add Asset dropdown, with the create form rendering its fields automatically.

Confirm that creating a new type called "Optical Splitter" with a few custom fields makes it instantly usable on the map with no restart.
```

### Phase 4 — Modern operations dashboard

```text
Build the Dashboard page for the Managed Service operation. Dark, modern, card based.

Pull everything from GET /dashboard/summary. Include:
- Top KPI cards: total assets, network availability percent (derived from operational vs total), open incidents, mean time to repair in hours, total fiber length in km.
- A donut chart of assets by type, and a stacked bar of assets by status.
- A line chart of incidents over the last 12 weeks.
- A horizontal bar of the top 5 sites by attached asset count.
- A fiber capacity gauge (used fibers vs available across all connections).
- A compact live incidents table (newest first) with severity color coding, and a row click that jumps to that asset on the Map page.

Use Recharts, consistent colors with the map layers, smooth but subtle animation, and make it responsive. Confirm every widget reflects the seeded data and the incident row click navigates correctly.
```

### Phase 5 — Polish, table view, and quality pass

```text
Final polish pass.

- Build the Assets table page: a filterable, sortable, paginated table of all assets with filters by type and status, inline status edit, and a row action to open that asset on the map.
- Add a global status legend and a small map mini-legend.
- Add loading and empty states everywhere, plus error toasts on failed requests.
- Add a handful of backend tests (asset CRUD and the dashboard summary endpoint) and a couple of frontend component tests so CI exercises real logic.
- Make the whole app responsive down to tablet width and ensure the dark theme is consistent.
- Update the README with screenshots placeholders, run instructions, the data model, and a "Migrating to PostgreSQL + PostGIS" section.
- Commit and push, and confirm the GitHub Actions run is green.
```

---

## Part D — CLAUDE.md to drop in the repo root

After the kickoff, ask Claude Code to create `CLAUDE.md` in the repo root with the content below. Claude Code reads this on every session, which keeps it consistent across days.

```markdown
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
```

---

## Part E — Data model reference

| Model | Key fields | Purpose |
|-------|-----------|---------|
| AssetType | key, label, geometryKind, icon, color, fieldSchema (JSON) | Defines a component category and its custom fields |
| Asset | assetTypeId, name, code, status, geometry (GeoJSON), attributes (JSON), parentId | Any physical network object |
| Connection | fromAssetId, toAssetId, cableAssetId, fiberCount | Network topology and fiber links |
| Incident | assetId, category, severity, status, openedAt, resolvedAt | Faults feeding availability and MTTR |
| MaintenanceLog | assetId, date, type, technician | Service history |

Seeded AssetTypes to expect: Site, BTS Site, Cabinet, Fiber Cable, Manhole, Handhole, Splice Closure, Pole, FDH. Add more at any time from the Asset Types admin page.

---

## Part F — Working with Claude Code in VS Code

A few habits that make this go smoothly:

1. Run the kickoff prompt in a clean empty folder. Let it finish all seven steps before adding features.
2. Make sure the `gh` CLI is installed and you are logged in (`gh auth login`) before the GitHub step, or Claude Code will pause and hand you the commands.
3. Commit after every phase. Ask Claude Code to commit with a clear message at the end of each phase prompt so your history is clean and you can roll back.
4. If a phase output drifts from what you wanted, tell Claude Code exactly which part to change rather than restarting. It edits in place well.
5. Keep `CLAUDE.md` updated as the project grows. It is the single most effective way to keep behavior consistent across sessions.
6. When you are ready to deploy, the move is: add Dockerfiles for both apps, switch the Prisma datasource to PostgreSQL, enable the PostGIS extension, convert geometry JSON to real geometry columns, and put it behind Traefik on your VPS. Treat that as its own phase.

That is the full plan. Start with Part B, then walk through Part C one phase at a time.
