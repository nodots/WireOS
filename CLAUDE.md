# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository

- GitHub: https://github.com/nodots/WireOS

## Project Overview

You are a senior full-stack engineer working inside an existing GitHub repo.

**Goal:** Build "WireOS" = a local-first, collaborative-friendly Baltimore Operating System map app.
This is NOT about My Maps. It is a custom web app using Google Maps JS API + GeoJSON.

## Non-negotiables

- **Spoiler-safe:** do NOT prefill content from The Wire. Only add a "Prime Directive" seed marker and empty scaffolding.
- **Geographic:** the map centers on Baltimore. Base layers exist but contain no place names.
- **Local-first MVP:** store all data as a GeoJSON file in the repo (e.g., /data/bos.geojson). The app supports import/export. Collaboration will be via Git history initially.
- **TypeScript + React (preferred).** Use Vite if bootstrapping.
- **The UI enforces the "BOS rules":** after each episode, user may add at most 1 item per layer (Geography, Institutions, Flows, Borders). This can be "soft enforcement" in MVP (warnings + helper UI), not hard server enforcement.

## What to Build (MVP)

### 1) Project Bootstrap
- If no app exists, create a Vite + React + TypeScript app.
- Add eslint + prettier configs (reasonable defaults).
- Add a README with setup instructions.
- Support npm or pnpm; choose one and document it.

### 2) Google Maps Integration
- Use the official Google Maps JavaScript API loader.
- Load API key from env var (VITE_GOOGLE_MAPS_API_KEY).
- Render a map centered on Baltimore at a sane zoom (city-level).
- No custom styling required.

### 3) Data Model
- Create a GeoJSON FeatureCollection schema.
- Every feature must have properties:
  - id (uuid)
  - layer: "geography" | "institutions" | "flows" | "borders"
  - firstSeen: string like "S01E01" (optional but encouraged)
  - title: string
  - notes: string (optional)
  - createdAt: ISO timestamp
  - createdBy: string (optional)
- Geometry types:
  - geography/institutions: Point
  - flows: LineString
  - borders: Polygon or MultiPolygon
- Store initial empty FeatureCollection at /data/bos.geojson including ONE seed feature:
  - layer="institutions" OR "geography" (choose one)
  - title="Prime Directive"
  - notes="The map may never be smarter than the show. If it is not named or shown on screen, it does not yet exist."
  - Place it near downtown Baltimore (Point coordinates)

### 4) Layer Toggles + Rendering
- Add four toggle switches (Geography, Institutions, Flows, Borders).
- Render features by layer:
  - Points as markers (title on hover/click)
  - LineStrings as polylines
  - Polygons as overlays
- Keep styling minimal; just ensure different layer types are visually distinguishable without relying on brand colors.

### 5) Add-feature UI
- Provide a sidebar or modal form to add a feature:
  - choose layer
  - title
  - firstSeen (string, validate format SxxExx)
  - notes
  - geometry input:
    - For Points: click on the map to place marker
    - For LineString/Polygon: basic draw mode (can be minimal: click to add vertices, double-click to finish)
- Save to in-memory state and allow user to export GeoJSON.
- Also allow importing a GeoJSON file to replace current state.

### 6) "Episode Gate" Helper (Soft Enforcement)
- Add a "Current Episode" input (e.g., S01E01).
- When adding features, warn if:
  - user already added 1 feature to that layer for the current episode (track in session memory only for MVP), OR
  - firstSeen is in the future relative to current episode (string compare by parsing season/episode).
- Provide warnings; do not block.

### 7) Export/Import
- Export current FeatureCollection to a downloadable .geojson file.
- Import .geojson file (validate schema lightly).
- Document in README: workflow is to export, commit to git, share with collaborator.

## Deliverables

- Working app that runs locally.
- Clear README.
- Minimal but clean UI.

## Repo Hygiene

- Keep changes in a single branch (you can assume local dev).
- Produce a PR-ready series of commits, with messages:
  1) "chore: bootstrap Vite React TS app"
  2) "feat: add BOS GeoJSON schema and seed Prime Directive"
  3) "feat: render BOS layers on Google Map"
  4) "feat: add feature-drawing UI and import/export"
  5) "feat: add episode gate helper and validations"

## Constraints

- Do not use external services (no Supabase) in MVP.
- Do not add any real Wire location or plot content.
- Avoid heavy dependencies. Prefer official Google Maps drawing tools if available; otherwise implement simple vertex-click drawing yourself.

## Output Requirements

- Summarize what you changed.
- List new files and key commands.
- Ensure the app can be started with a single command documented in README.
