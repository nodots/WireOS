# WireOS

A local-first, collaborative-friendly Baltimore Operating System map app built with React, TypeScript, and Google Maps.

## Overview

WireOS is a spoiler-safe mapping tool designed for tracking locations and features as you watch The Wire. The map enforces "episode gating" - helping you avoid adding content from episodes you haven't watched yet.

### Features

- **Google Maps integration** centered on Baltimore
- **Four map layers**: Geography, Institutions, Flows, Borders
- **Layer toggles** to show/hide different feature types
- **Episode gating** with soft enforcement warnings
- **Feature drawing** for points, lines, and polygons
- **GeoJSON import/export** for Git-based collaboration
- **Local-first** data storage

## Prerequisites

- Node.js 18+ (or compatible version)
- npm or pnpm
- A Google Maps API key with Maps JavaScript API enabled

## Setup

1. **Clone the repository**

   ```bash
   git clone https://github.com/nodots/WireOS.git
   cd WireOS
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure environment variables**

   Copy `.env.example` to `.env` and add your Google Maps API key:

   ```bash
   cp .env.example .env
   ```

   Then edit `.env`:

   ```
   VITE_GOOGLE_MAPS_API_KEY=your_api_key_here
   ```

   Get an API key from the [Google Cloud Console](https://console.cloud.google.com/apis/credentials). Enable the **Maps JavaScript API** for your project.

4. **Start the development server**

   ```bash
   npm run dev
   ```

   Open [http://localhost:5173](http://localhost:5173) in your browser.

## Usage

### Setting Your Current Episode

Use the "Current Episode" input in the sidebar to set your viewing progress (e.g., `S01E03`). This enables episode gating warnings when adding features.

### Adding Features

1. Click "Add Feature" in the sidebar
2. Select the appropriate layer:
   - **Geography** - Points (neighborhoods, streets, landmarks)
   - **Institutions** - Points (police stations, schools, businesses)
   - **Flows** - Lines (routes, paths, movements)
   - **Borders** - Polygons (territories, districts)
3. Enter a title and optionally the episode where it first appears
4. Click "Place on Map" and draw the geometry:
   - For points: click once to place
   - For lines: click to add vertices, double-click to finish
   - For polygons: click to add vertices, double-click to close
5. Click "Add Feature" to save

### Episode Gate Warnings

The app will warn you (but not block you) if:
- You've already added a feature to that layer for the current episode
- The feature's "first seen" episode is ahead of your current episode

### Layer Visibility

Toggle layers on/off using the switches in the sidebar. Each layer has a distinct color for visual differentiation.

### Import/Export

- **Export**: Click "Export GeoJSON" to download your current data as a `.geojson` file
- **Import**: Click "Import GeoJSON" to load data from a file (replaces current data)

## Collaboration Workflow

1. Make changes to the map
2. Export the GeoJSON file
3. Replace `/public/data/bos.geojson` in the repository
4. Commit and push your changes
5. Collaborators pull the latest changes
6. Import the updated GeoJSON or restart the app

## Project Structure

```
WireOS/
├── public/
│   └── data/
│       └── bos.geojson      # Map data with seed Prime Directive
├── src/
│   ├── components/
│   │   ├── Map/             # MapContainer, MapLayers, DrawingManager
│   │   ├── Sidebar/         # Sidebar, LayerToggles, EpisodeSelector, ImportExport
│   │   ├── FeatureForm/     # Feature creation modal
│   │   └── common/          # Reusable components
│   ├── hooks/
│   │   ├── useGoogleMaps.ts # Google Maps API loader
│   │   └── useBosData.tsx   # State management context
│   ├── types/
│   │   └── bos.ts           # TypeScript interfaces
│   ├── utils/
│   │   ├── episode.ts       # Episode parsing and validation
│   │   ├── geojson.ts       # GeoJSON validation and helpers
│   │   └── uuid.ts          # UUID generation
│   ├── App.tsx
│   ├── App.css
│   └── main.tsx
├── .env.example
├── package.json
└── vite.config.ts
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

## The Prime Directive

> "The map may never be smarter than the show. If it is not named or shown on screen, it does not yet exist."

This seed marker serves as a reminder to only add features that have been explicitly shown or named in episodes you've watched.

## License

MIT
