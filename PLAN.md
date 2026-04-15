## Implementation Plan: Naval AAW Tactical Display

## Overview
Build a browser-based naval Anti-Air Warfare (AAW) tactical display using OpenLayers (2D) and CesiumJS (3D), replacing the reference Leaflet implementation. This is a greenfield project with only the PRD document existing.

## Exclusions (per user feedback)
- OpenSky API integration excluded
- No WebSocket or real-time data pipeline
- No backend

---

## Phase 1: Project Setup

### 1.1 Initialize Vite Project
- [x] Create `package.json` with dependencies: `ol`, `cesium`, `milsymbol`, `vite`
- [x] Create `vite.config.js` with CesiumJS asset handling
- [x] Create `.env` with configuration variables
- [x] Create `.gitignore`

### 1.2 Directory Structure
- [x] Complete directory structure created as specified

---

## Phase 2: Core Modules

### 2.1 Config Module (`config.js`)
- [x] Export environment variables with GeoServer URL support

### 2.2 Symbol Renderer (`symbol/symbolRenderer.js`)
- [x] Changed from SVG to Canvas-based rendering (matching reference)
- [x] Proper anchor-based pixel offset calculation
- [x] Cache key includes heading and size
- [x] Transparent background added for picking

### 2.3 Scenario Tracks (`scenario/tracks.js`)
- [x] Define 6 tracks per PRD Section 3.1
- [x] Taiwan Strait scenario origin: 24.5°N, 120.5°E

### 2.4 Timeline Controller (`scenario/timeline.js`)
- [x] Play/Pause/Reset with auto-loop
- [x] MM:SS elapsed time display

---

## Phase 3: 2D View (OpenLayers)

### 3.1 Map Initialization (`view2D/map2D.js`)
- [x] Initialize OpenLayers with GeoServer WMS
- [x] Scale bar and coordinate readout
- [x] Pan, zoom, rotate support

### 3.2 Projection Switching (`view2D/projection.js`)
- [x] Support EPSG:3857, EPSG:4326, EPSG:3395
- [x] Preserve center and zoom on switch

### 3.3 Track Layer (`view2D/trackLayer2D.js`)
- [x] Canvas-based symbol rendering
- [x] Proper anchor positioning

### 3.4 Own-Ship Features (`view2D/ownShip2D.js`)
- [x] Range rings at 5, 10, 25, 50, 100 km
- [x] 8 bearing lines
- [x] Updates on animation tick

---

## Phase 4: 3D View (CesiumJS)

### 4.1 Map Initialization (`view3D/map3D.js`)
- [x] Cesium Vite plugin installed for asset handling
- [x] GeoServer WMS imagery provider
- [x] Simplified Viewer configuration
- [x] Camera positioned over Taiwan Strait

### 4.2 Track Layer (`view3D/trackLayer3D.js`)
- [x] BillboardCollection with Canvas symbols
- [x] Proper pixel offset from anchor points
- [x] No height reference (ellipsoid terrain)

### 4.3 Own-Ship Features (`view3D/ownShip3D.js`)
- [x] Entity-based range rings and bearing lines
- [x] No height reference issues

---

## Phase 5: View Synchronization

### 5.1 View Toggle (`views/viewSync.js`)
- [x] Toggle between 2D and 3D
- [x] Hidden containers preserve state

### 5.2 Viewport Sync
- [x] Geographic center sync on toggle
- [x] Approximate zoom/altitude conversion

---

## Phase 6: UI Components

### 6.1 Toolbar (`ui/toolbar.js`)
- [x] 2D/3D toggle
- [x] Projection selector (2D only)
- [x] Play/Pause/Reset controls
- [x] Time display

### 6.2 Sidebar (`ui/sidebar.js`)
- [x] Track list with canvas icons
- [x] Click-to-follow
- [x] Selection highlighting

### 6.3 Popup (`ui/popup.js`)
- [x] Track info popup

---

## Phase 7: Integration & Testing

### 7.1 Main Entry (`main.js`)
- [x] All modules integrated
- [x] Timeline drives both views

### 7.2 Current Issues Being Resolved
- GeoServer layer name configuration (currently using 'ne:countries')
- Symbol positioning verification

---

## Open Questions (from PRD Section 12)
1. **EPSG:3395 tile reprojection** - REMOVED: EPSG:3395 not available by default in OpenLayers (requires proj4js). Only EPSG:3857 and EPSG:4326 are supported.
2. **Offline/air-gap deployment** - Not in scope
3. **Range ring geometry in 3D** - Using Entity API (no CallbackProperty needed)
4. **TypeScript** - Plain JavaScript per reference

## Recent Updates
- **Coordinate Transform Bug Fixed**: All 2D geometries now properly transform lon/lat to map projection using `fromLonLat()`
- **Removed EPSG:3395**: Only EPSG:3857 (Web Mercator) and EPSG:4326 (WGS84) supported
- **Symbol Size Increased**: From 35px to 50px for better visibility
- **Canvas Rendering**: Changed from SVG to Canvas for both 2D and 3D, matching reference implementation
