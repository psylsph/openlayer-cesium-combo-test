# Product Requirements Document

## Naval AAW Tactical Display — OpenLayers 2D / CesiumJS 3D

---

**Document Status:** Draft  
**Version:** 1.0  
**Date:** 2026-04-15  
**Reference Implementation:** [`psylsph/leaflet-milsymbol-test`](https://github.com/psylsph/leaflet-milsymbol-test)  
**Author:** TBD

---

## 1. Overview

### 1.1 Purpose

This document defines the requirements for a browser-based naval Anti-Air Warfare (AAW) tactical display. The application is a direct evolution of the reference Leaflet implementation, replacing the Leaflet map engine with **OpenLayers** for the 2D view and adding **CesiumJS** as a new 3D globe view, while retaining all existing scenario features and the milsymbol rendering library.

### 1.2 Background

The reference implementation (`psylsph/leaflet-milsymbol-test`) is a client-side-only single-page application that visualises a Taiwan Strait naval scenario. It features:

- Six animated scenario tracks (HMS Queen Elizabeth carrier group under attack) in the Taiwan Strait at 24.5°N, 120.5°E
- Live aircraft overlaid from the OpenSky Network API, filtered to the current viewport
- MIL-STD-2525D symbols rendered via the milsymbol library
- Own-ship display (HMS Defender) with range rings and compass bearing lines
- Track selection, click-to-follow with zoom preservation
- Timeline animation with play / pause / reset controls
- Map projection switching between Web Mercator (EPSG:3857), WGS84 (EPSG:4326), and Mercator (EPSG:3395), implemented via proj4 + proj4leaflet

The tech stack is Vite + plain JavaScript with no backend — all data is either hardcoded scenario data or fetched from the public OpenSky Network REST API. The application is a Leaflet-based sibling of [`psylsph/Cesium2525bTest`](https://github.com/psylsph/Cesium2525bTest).

### 1.3 Scope

This PRD covers the **browser client only**. There is no backend to change. The deliverable is a new version of the same SPA with:

1. **OpenLayers** replacing Leaflet as the 2D map engine (including native projection support replacing proj4leaflet)
2. **CesiumJS** added as a new 3D globe view, sharing all scenario data with the 2D view
3. A **view toggle** to switch between 2D and 3D with viewport synchronisation

All existing scenario content, own-ship features, OpenSky integration, and timeline controls are preserved unchanged.

---

## 2. Goals and Non-Goals

### 2.1 Goals

- Replace Leaflet + proj4leaflet with OpenLayers, preserving all 2D capabilities with no feature regression.
- Add a CesiumJS 3D globe view displaying the same tracks, symbols, range rings, and live flights.
- Provide seamless 2D ↔ 3D view toggle with geographic viewport synchronisation.
- Retain the Vite + JavaScript build setup and no-backend architecture.

### 2.2 Non-Goals

- Any backend, WebSocket, or real-time data pipeline (future work, not in scope).
- Changes to the scenario content or OpenSky integration logic.
- Mobile-native applications.
- Tactical graphics beyond point symbols (lines, areas, control measures).

---

## 3. Scenario Content (Unchanged)

All scenario content from the reference implementation is preserved verbatim.

### 3.1 Taiwan Strait Scenario Tracks

Origin: 24.5°N, 120.5°E

| Track | Type | Speed | Affiliation |
|---|---|---|---|
| HMS Queen Elizabeth | Surface (carrier) | 15 kts | Friendly |
| HMS Defender | Surface (own ship) | 20 kts | Own Ship |
| Enemy Torpedo Boat 1 | Surface | 40 kts | Hostile |
| Enemy Torpedo Boat 2 | Surface | 40 kts | Hostile |
| Enemy Strike Aircraft | Air | 500 kts | Hostile |
| Land Attack Missile | Air | 550 kts | Hostile |

### 3.2 Own-Ship Display (HMS Defender)

- Range rings at 5 km, 10 km, 25 km, 50 km, and 100 km, centred on HMS Defender's animated position.
- Compass bearing lines (8 cardinal and inter-cardinal directions).
- Both update continuously as HMS Defender moves along its track.

### 3.3 Timeline Animation

- Play, Pause, and Reset controls.
- Elapsed time display (MM:SS format).
- Scenario loops automatically on completion.

### 3.4 OpenSky Network Live Flight Integration

- Aircraft fetched from the OpenSky Network public REST API, filtered to the current map viewport bounding box.
- Polling interval: every 10 seconds.
- Stale aircraft (no longer in the viewport or not updated) are removed automatically.
- Affiliation detection by country of origin:
  - Blue/Cyan: Friendly (US, UK, Taiwan, Japan, and allies)
  - Red: Hostile (Russia, North Korea, Iran)
  - Yellow: Unknown (all other countries)
- Symbols show aircraft heading via milsymbol `direction` option.
- Click on an aircraft symbol shows a popup: callsign, country, altitude, speed, heading, vertical rate, and affiliation.
- Click elsewhere or on the same symbol closes the popup.

### 3.5 Track Interaction

- Clicking any scenario track or sidebar entry selects and follows that track.
- While following, the user can zoom freely; the camera stays centred on the selected track.
- Clicking the currently selected track stops following (track remains highlighted).
- Clicking anywhere else on the map clears the selection.

---

## 4. Functional Requirements — 2D View (OpenLayers)

### 4.1 Map Engine

| ID | Requirement |
|---|---|
| FR-2D-01 | The 2D view SHALL use OpenLayers (v9.x or later), replacing Leaflet entirely. |
| FR-2D-02 | The map SHALL support pan, zoom (mouse wheel, pinch, zoom controls), and rotate. |
| FR-2D-03 | A scale bar and live coordinate readout SHALL be visible at all times. |

### 4.2 Projection Switching

| ID | Requirement |
|---|---|
| FR-2D-10 | The 2D view SHALL support switching between Web Mercator (EPSG:3857, default), WGS84 (EPSG:4326), and Mercator (EPSG:3395), using OpenLayers' native `ol/proj` support. This replaces the proj4 + proj4leaflet dependency. |
| FR-2D-11 | Switching projection SHALL preserve the current map centre and approximate zoom level. |
| FR-2D-12 | All geometries — scenario track positions, range rings, bearing lines — SHALL re-project correctly when the projection changes. |

### 4.3 Scenario Track Symbols

| ID | Requirement |
|---|---|
| FR-2D-20 | Each scenario track SHALL be rendered as an `ol/Feature` with `ol/style/Icon` using a milsymbol SVG data URI. |
| FR-2D-21 | Symbol anchor SHALL use milsymbol's `getAnchor()` output to position the frame centre precisely over the geographic coordinate. |
| FR-2D-22 | Symbol heading SHALL be applied via milsymbol's `direction` option (not via CSS rotation). |
| FR-2D-23 | Track position SHALL update smoothly on each animation tick. |

### 4.4 Own-Ship Features

| ID | Requirement |
|---|---|
| FR-2D-30 | Range rings SHALL be rendered as `ol/geom/Circle` or `ol/geom/Polygon` features on a dedicated vector layer. |
| FR-2D-31 | Compass bearing lines SHALL be rendered as `ol/geom/LineString` features. |
| FR-2D-32 | Both SHALL update on each animation tick as HMS Defender moves. |
| FR-2D-33 | Both SHALL re-project correctly on projection change. |

### 4.5 OpenSky Live Aircraft

| ID | Requirement |
|---|---|
| FR-2D-40 | Live aircraft SHALL be rendered as `ol/Feature` objects on a dedicated vector layer, styled with milsymbol SVG data URIs. |
| FR-2D-41 | The viewport bounding box used for the OpenSky API request SHALL be derived from the current OpenLayers view extent, transformed to WGS84 (EPSG:4326). |
| FR-2D-42 | Click interaction on aircraft features SHALL display the popup described in Section 3.4. |

### 4.6 Base Map

| ID | Requirement |
|---|---|
| FR-2D-50 | Default base map SHALL be OpenStreetMap (`ol/source/OSM`). |
| FR-2D-51 | Bing Maps Aerial SHALL be available as an optional tile layer (`ol/source/BingMaps`), gated by a configurable API key. |
| FR-2D-52 | A configurable XYZ tile URL SHALL be supported (`ol/source/XYZ`). |

---

## 5. Functional Requirements — 3D View (CesiumJS)

### 5.1 Globe Engine

| ID | Requirement |
|---|---|
| FR-3D-01 | The 3D view SHALL use CesiumJS (v1.115 or later). |
| FR-3D-02 | The globe SHALL support orbit, zoom, tilt, and pan camera controls. |
| FR-3D-03 | A compass / navigation widget SHALL be visible. |
| FR-3D-04 | A Cesium Ion access token SHALL be configurable via environment variable. |
| FR-3D-05 | If WebGL is unavailable, the application SHALL display a graceful message and default to the 2D view. |

### 5.2 Terrain and Imagery

| ID | Requirement |
|---|---|
| FR-3D-10 | Terrain SHALL use Cesium World Terrain (Ion token required) or a configurable fallback provider. |
| FR-3D-11 | Default imagery SHALL be Bing Maps Aerial; OSM SHALL be available as a fallback. |

### 5.3 Scenario Track Symbols

| ID | Requirement |
|---|---|
| FR-3D-20 | Each scenario track SHALL be rendered as a `Cesium.Billboard` within a `BillboardCollection`, using a milsymbol SVG data URI as the image. |
| FR-3D-21 | Billboards SHALL be clamped to ground using `HeightReference.CLAMP_TO_GROUND`. |
| FR-3D-22 | Billboard pixel offset SHALL use milsymbol's `getAnchor()` output to correctly centre the symbol frame. |
| FR-3D-23 | Symbol heading SHALL be applied via milsymbol's `direction` option. |
| FR-3D-24 | Billboard position SHALL update on each animation tick. |

### 5.4 Own-Ship Features

| ID | Requirement |
|---|---|
| FR-3D-30 | Range rings SHALL be rendered as `Cesium.EllipseOutlineGeometry` ground primitives, centred on HMS Defender's current position. |
| FR-3D-31 | Compass bearing lines SHALL be rendered as ground-clamped `Cesium.Polyline` primitives. |
| FR-3D-32 | Both SHALL update on each animation tick. |

### 5.5 OpenSky Live Aircraft

| ID | Requirement |
|---|---|
| FR-3D-40 | Live aircraft SHALL be rendered as billboards in the 3D view using the same milsymbol symbols and affiliation logic as the 2D view. |
| FR-3D-41 | The viewport bounding box for the OpenSky API request SHALL be derived from the CesiumJS camera's current view rectangle. |
| FR-3D-42 | Click on a billboard SHALL display the aircraft popup described in Section 3.4. |

### 5.6 Track Interaction

| ID | Requirement |
|---|---|
| FR-3D-50 | Clicking a scenario track billboard SHALL select and follow that track, keeping the camera centred on it. |
| FR-3D-51 | While following, the user SHALL be able to zoom and orbit freely. |
| FR-3D-52 | Clicking the same track again SHALL stop following. |

---

## 6. Functional Requirements — View Toggle and Synchronisation

| ID | Requirement |
|---|---|
| FR-SYNC-01 | A toggle control (e.g. "2D / 3D" button in the toolbar) SHALL switch between the OpenLayers and CesiumJS views. |
| FR-SYNC-02 | On toggle, the destination view SHALL centre on the same geographic coordinates as the origin view at an approximately equivalent zoom / altitude. |
| FR-SYNC-03 | Both views SHALL share a single scenario data store and OpenSky aircraft data. The animation timeline drives both. |
| FR-SYNC-04 | Only the active view's container SHALL be visible; the inactive container SHALL be hidden (not destroyed) to preserve state. |
| FR-SYNC-05 | Track selection and follow state SHALL be preserved across view toggle. |

---

## 7. Symbol Rendering (Shared)

Both views use milsymbol identically. A shared cache module prevents redundant SVG generation.

```javascript
// symbolRenderer.js
const cache = new Map()

export function getDataUri(sidc, heading = 0, size = 35) {
  const key = `${sidc}:${heading}:${size}`
  if (cache.has(key)) return cache.get(key)
  const sym = new ms.Symbol(sidc, { size, direction: heading })
  const uri = 'data:image/svg+xml;base64,' + btoa(sym.asSVG())
  cache.set(key, uri)
  return uri
}

export function getAnchor(sidc, heading = 0, size = 35) {
  const sym = new ms.Symbol(sidc, { size, direction: heading })
  return sym.getAnchor()   // { x, y } in pixels
}
```

The cache key includes heading because milsymbol bakes the direction indicator into the SVG. Cache entries are invalidated and regenerated only when a symbol's SIDC or heading changes.

---

## 8. Technology Stack

| Package | Role | Replaces |
|---|---|---|
| `ol` (OpenLayers v9) | 2D map engine and native projection support | `leaflet`, `proj4`, `proj4leaflet` |
| `cesium` (v1.115+) | 3D globe engine | — (new) |
| `milsymbol` (v3.x) | MIL-STD-2525D symbol generation | unchanged |
| `vite` | Build tool and dev server | unchanged |

No backend. No TypeScript required (plain JavaScript consistent with the reference implementation), though TypeScript may be adopted if preferred.

---

## 9. Module Structure

```
src/
├── main.js                     # Entry point, DOM wiring, view toggle
├── config.js                   # Environment config (API keys, defaults)
├── symbol/
│   └── symbolRenderer.js       # milsymbol wrapper, SVG/dataURI cache
├── scenario/
│   ├── tracks.js               # Taiwan Strait unit definitions + animation
│   └── timeline.js             # Play / Pause / Reset controller
├── opensky/
│   └── openSkyClient.js        # OpenSky API polling, affiliation mapping
├── views/
│   ├── view2D/
│   │   ├── map2D.js            # OpenLayers map init, layer management
│   │   ├── trackLayer2D.js     # Scenario track ol/Feature upsert
│   │   ├── ownShip2D.js        # Range rings + bearing lines (ol/geom)
│   │   ├── aircraftLayer2D.js  # OpenSky aircraft ol/Feature upsert
│   │   └── projection.js       # Projection switcher (EPSG:3857/4326/3395)
│   ├── view3D/
│   │   ├── map3D.js            # CesiumJS Viewer init
│   │   ├── trackLayer3D.js     # Billboard upsert per scenario track
│   │   ├── ownShip3D.js        # Range rings + bearing lines (Cesium prims)
│   │   └── aircraftLayer3D.js  # OpenSky aircraft billboard upsert
│   └── viewSync.js             # Viewport sync on toggle
└── ui/
    ├── sidebar.js              # Track list, click-to-follow
    ├── popup.js                # Click popup (shared by 2D + 3D)
    └── toolbar.js              # View toggle, projection selector, timeline
```

---

## 10. Configuration

| Variable | Description | Default |
|---|---|---|
| `VITE_CESIUM_ION_TOKEN` | Cesium Ion access token (required for 3D terrain/imagery) | — |
| `VITE_BING_MAPS_KEY` | Bing Maps API key (optional) | — |
| `VITE_DEFAULT_PROJECTION` | Initial 2D projection | `EPSG:3857` |
| `VITE_SCENARIO_LAT` | Scenario origin latitude | `24.5` |
| `VITE_SCENARIO_LON` | Scenario origin longitude | `120.5` |
| `VITE_SYMBOL_SIZE` | Base milsymbol symbol size in pixels | `35` |
| `VITE_OPENSKY_INTERVAL_MS` | OpenSky polling interval | `10000` |

---

## 11. Non-Functional Requirements

| ID | Requirement |
|---|---|
| NFR-01 | The 2D view SHALL render all scenario tracks and up to 200 live aircraft at ≥ 30 fps on a mid-range desktop browser. |
| NFR-02 | The 3D view SHALL render all scenario tracks and up to 100 live aircraft at ≥ 30 fps. |
| NFR-03 | The milsymbol SVG cache SHALL ensure symbols are only regenerated when their SIDC or heading changes. |
| NFR-04 | The application SHALL work in the current and previous major versions of Chrome, Firefox, and Edge. |
| NFR-05 | WebGL unavailability (required by CesiumJS) SHALL be caught and communicated to the user; the 2D view SHALL remain functional. |
| NFR-06 | API keys SHALL be supplied via `.env` and SHALL NOT be committed to source control. |

---

## 12. Open Questions

1. **EPSG:3395 tile reprojection** — OpenStreetMap and Bing do not serve Mercator (EPSG:3395) tiles. OpenLayers can reproject raster tiles on the fly but at a significant performance cost. Confirm whether EPSG:3395 support is required or whether the projection selector should be reduced to EPSG:3857 and EPSG:4326 only.
2. **Offline / air-gap deployment** — Cesium World Terrain requires an Ion token and internet access. Should a locally hosted terrain provider be supported?
3. **Range ring geometry in 3D** — CesiumJS `EllipseOutlineGeometry` primitives must be destroyed and recreated on each position update for a moving entity. Confirm whether the Entity API with `CallbackProperty` is preferable for the own-ship range rings.
4. **TypeScript migration** — The reference implementation is plain JavaScript. Should this version adopt TypeScript, or remain consistent with the source?

---

## 13. References

- [psylsph/leaflet-milsymbol-test — Reference implementation](https://github.com/psylsph/leaflet-milsymbol-test)
- [psylsph/Cesium2525bTest — Sibling CesiumJS project](https://github.com/psylsph/Cesium2525bTest)
- [milsymbol](https://github.com/spatialillusions/milsymbol)
- [OpenLayers Documentation](https://openlayers.org/doc/)
- [CesiumJS Documentation](https://cesium.com/docs/cesiumjs-ref-doc/)
- [MIL-STD-2525D — Joint Military Symbology](https://www.jcs.mil/Portals/36/Documents/Doctrine/other_pubs/ms_2525e.pdf)
- [OpenSky Network API](https://openskynetwork.github.io/opensky-api/)

---

*End of Document*
