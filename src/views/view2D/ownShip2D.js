import VectorLayer from 'ol/layer/Vector.js';
import VectorSource from 'ol/source/Vector.js';
import { Style, Stroke, Fill, Text as TextStyle } from 'ol/style.js';
import Feature from 'ol/Feature.js';
import { LineString, Polygon, Circle, Point } from 'ol/geom.js';
import { fromLonLat } from 'ol/proj.js';
import { getTracks, calculatePosition, AFFILIATIONS } from '../../scenario/tracks.js';
import { getDataUri } from '../../symbol/symbolRenderer.js';
import { SYMBOL_SIZE } from '../../config.js';

let ownShipLayer = null;
let map2D = null;
let rangeRingLabels = [];
let baseRangeDistance = 5000;
const RANGE_RINGS = [1, 2, 3, 4, 5];
const BEARING_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315];

export function initOwnShipLayer2D(map) {
  map2D = map;
  const source = new VectorSource();
  
  ownShipLayer = new VectorLayer({
    source: source,
    zIndex: 5
  });
  
  map.addLayer(ownShipLayer);
  
  // Listen for projection changes and recreate features
  window.addEventListener('projectionChanged', () => {
    const tracks = getTracks();
    const ownShip = tracks.find(t => t.affiliation === AFFILIATIONS.OWN_SHIP);
    if (ownShip) {
      const pos = calculatePosition(ownShip, 0);
      updateOwnShip2D(0);
    }
  });
  
  return ownShipLayer;
}

function createRangeRings(centerLon, centerLat) {
  const features = [];
  const view = map2D.getView();
  const projection = view.getProjection();
  const center = fromLonLat([centerLon, centerLat], projection);
  const zoom = view.getZoom();
  
  baseRangeDistance = calculateBaseRangeDistance(zoom);
  
  RANGE_RINGS.forEach((multiplier, index) => {
    const radiusMeters = baseRangeDistance * multiplier;
    const circleGeom = new Circle(center, radiusMeters);
    
    const feature = new Feature({
      geometry: circleGeom
    });
    
    const isPrimaryRing = index === 0 || index === 2 || index === 4;
    
    feature.setStyle(new Style({
      stroke: new Stroke({
        color: isPrimaryRing ? 'rgba(0, 200, 255, 0.7)' : 'rgba(0, 200, 255, 0.4)',
        width: isPrimaryRing ? 2 : 1
      }),
      fill: new Fill({
        color: 'rgba(0, 50, 100, 0.05)'
      })
    }));
    
    features.push(feature);
    
    const labelLon = centerLon + (radiusMeters / 6371000) * (180 / Math.PI) / Math.cos(centerLat * Math.PI / 180);
    const labelCoord = fromLonLat([labelLon, centerLat], projection);
    
    const labelFeature = new Feature({
      geometry: new Point(labelCoord)
    });
    
    labelFeature.setStyle(new Style({
      text: new TextStyle({
        text: formatDistance(radiusMeters),
        font: '12px monospace',
        fill: new Fill({
          color: '#00c8ff'
        }),
        stroke: new Stroke({
          color: 'rgba(0, 0, 0, 0.8)',
          width: 2
        }),
        offsetX: 5,
        offsetY: 0
      })
    }));
    
    features.push(labelFeature);
  });
  
  return features;
}

function formatDistance(meters) {
  if (meters >= 100000) {
    const km = Math.round(meters / 1000);
    return `${Math.round(km / 10) * 10}km`;
  } else if (meters >= 10000) {
    const km = Math.round(meters / 1000);
    return `${km}km`;
  } else if (meters >= 1000) {
    const km = meters / 1000;
    return `${km.toFixed(1)}km`;
  } else {
    return `${Math.round(meters / 100) * 100}m`;
  }
}

function calculateBaseRangeDistance(zoom) {
  const map = map2D;
  const view = map.getView();
  const extent = view.calculateExtent(map.getSize());
  
  const width = extent[2] - extent[0];
  const height = extent[3] - extent[1];
  const minDimension = Math.min(width, height);
  
  return minDimension * 0.05;
}

function createBearingLines(centerLon, centerLat) {
  const features = [];
  const view = map2D.getView();
  const projection = view.getProjection();
  const center = fromLonLat([centerLon, centerLat], projection);
  
  const lineLengthMultiplier = 1.05;
  const lineLengthMeters = baseRangeDistance * 5 * lineLengthMultiplier;
  const lineLengthDeg = lineLengthMeters / 111320;
  
  BEARING_ANGLES.forEach((angle, index) => {
    const angleRad = angle * (Math.PI / 180);
    const endLat = centerLat + lineLengthDeg * Math.cos(angleRad);
    const endLon = centerLon + lineLengthDeg * Math.sin(angleRad) / Math.cos(centerLat * Math.PI / 180);
    
    const end = fromLonLat([endLon, endLat], projection);
    const lineGeom = new LineString([center, end]);
    
    const feature = new Feature({
      geometry: lineGeom
    });
    
    feature.setStyle(new Style({
      stroke: new Stroke({
        color: angle % 90 === 0 ? 'rgba(0, 200, 255, 0.8)' : 'rgba(0, 200, 255, 0.4)',
        width: angle % 90 === 0 ? 2 : 1
      })
    }));
    
    features.push(feature);
  });
  
  return features;
}

export function updateOwnShip2D(elapsedSeconds) {
  if (!ownShipLayer) return;
  
  const source = ownShipLayer.getSource();
  source.clear();
  rangeRingLabels = [];
  
  const tracks = getTracks();
  const ownShip = tracks.find(t => t.affiliation === AFFILIATIONS.OWN_SHIP);
  
  if (!ownShip) return;
  
  const pos = calculatePosition(ownShip, elapsedSeconds);
  
  const result = getDataUri(ownShip.sidc, ownShip.heading, SYMBOL_SIZE, ownShip.affiliation);
  const offsetX = result.centerOffsetX || 0;
  const offsetY = result.centerOffsetY || 0;
  
  const metersPerDeg = 111320 * Math.cos(pos.lat * Math.PI / 180);
  const centerLon = pos.lon - (offsetX / SYMBOL_SIZE) * (0.01 / metersPerDeg);
  const centerLat = pos.lat + (offsetY / SYMBOL_SIZE) * (0.01 / metersPerDeg);
  
  const rangeRingFeatures = createRangeRings(centerLon, centerLat);
  const bearingFeatures = createBearingLines(centerLon, centerLat);
  
  rangeRingFeatures.forEach(f => source.addFeature(f));
  bearingFeatures.forEach(f => source.addFeature(f));
}

export function clearOwnShip2D() {
  if (!ownShipLayer) return;
  const source = ownShipLayer.getSource();
  source.clear();
}
