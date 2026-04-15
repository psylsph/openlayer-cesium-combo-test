import * as Cesium from 'cesium';
import { getTracks, calculatePosition, AFFILIATIONS } from '../../scenario/tracks.js';
import { getDataUri } from '../../symbol/symbolRenderer.js';
import { SYMBOL_SIZE } from '../../config.js';

let entityCollection = null;
let rangeRingEntities = [];
let bearingLineEntities = [];
let rangeRingLabels = [];
let viewer = null;
let baseRangeDistance = 5000;
const RANGE_RINGS = [1, 2, 3, 4, 5];
const BEARING_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315];

export function initOwnShipLayer3D(viewerParam) {
  viewer = viewerParam;
  entityCollection = viewer.entities;
  return entityCollection;
}

function createRangeRings(pos) {
  clearRangeRings();
  
  if (!pos || !Number.isFinite(pos.lat) || !Number.isFinite(pos.lon)) {
    console.warn('Invalid position for range rings:', pos);
    return;
  }
  
  const tracks = getTracks();
  const ownShip = tracks.find(t => t.affiliation === AFFILIATIONS.OWN_SHIP);
  if (!ownShip) return;
  
  const result = getDataUri(ownShip.sidc, ownShip.heading, SYMBOL_SIZE, ownShip.affiliation);
  const offsetX = result.centerOffsetX || 0;
  const offsetY = result.centerOffsetY || 0;
  
  const metersPerDeg = 111320 * Math.cos(pos.lat * Math.PI / 180);
  const centerLon = pos.lon - (offsetX / SYMBOL_SIZE) * (0.01 / metersPerDeg);
  const centerLat = pos.lat + (offsetY / SYMBOL_SIZE) * (0.01 / metersPerDeg);
  
  baseRangeDistance = calculateBaseRangeDistance();
  
  if (!Number.isFinite(baseRangeDistance) || baseRangeDistance <= 0) {
    console.warn('Invalid base range distance:', baseRangeDistance);
    return;
  }
  
  RANGE_RINGS.forEach((multiplier, index) => {
    const radiusMeters = baseRangeDistance * multiplier;
    
    if (!Number.isFinite(radiusMeters) || radiusMeters <= 0) {
      console.warn(`Invalid radius for ring ${multiplier}x:`, radiusMeters);
      return;
    }
    
    //console.log(`Creating ring ${multiplier}x with radius: ${radiusMeters}m`);
    
    const entity = entityCollection.add({
      id: `range-ring-${multiplier}`,
      position: Cesium.Cartesian3.fromDegrees(centerLon, centerLat, 0),
      ellipse: {
        semiMajorAxis: radiusMeters,
        semiMinorAxis: radiusMeters,
        height: 0,
        material: Cesium.Color.TRANSPARENT,
        outline: true,
        outlineColor: index === 0 || index === 2 || index === 4 
          ? Cesium.Color.fromCssColorString('rgba(0, 200, 255, 1.0)') 
          : Cesium.Color.fromCssColorString('rgba(0, 200, 255, 0.8)'),
        outlineWidth: index === 0 || index === 2 || index === 4 ? 4 : 3,
        clampToGround: false
      }
    });
    rangeRingEntities.push(entity);
    
    const labelDistance = formatDistance(radiusMeters);
    const eastOffset = radiusMeters * 1.05;
    const labelLon = centerLon + (eastOffset / 6371000) * (180 / Math.PI) / Math.cos(pos.lat * Math.PI / 180);
    
    const labelPos = Cesium.Cartesian3.fromDegrees(labelLon, centerLat, 100);
    
    const label = entityCollection.add({
      id: `range-ring-label-${multiplier}`,
      position: labelPos,
      label: {
        text: labelDistance,
        font: '16px monospace',
        fillColor: Cesium.Color.fromCssColorString('#00c8ff'),
        outlineColor: Cesium.Color.fromCssColorString('rgba(0, 0, 0, 0.9)'),
        outlineWidth: 3,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        verticalOrigin: Cesium.VerticalOrigin.CENTER,
        horizontalOrigin: Cesium.HorizontalOrigin.LEFT,
        pixelOffset: new Cesium.Cartesian2(8, 0),
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
        distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0.0, 500000)
      }
    });
    rangeRingLabels.push(label);
  });
  
  //console.log(`Total range ring entities created: ${rangeRingEntities.length}, labels: ${rangeRingLabels.length}`);
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

function calculateBaseRangeDistance() {
  const camera = viewer.camera;
  const position = camera.positionCartographic;
  const height = position.height;
  
  if (!Number.isFinite(height) || height <= 0) {
    console.warn('Invalid camera height:', height);
    return 10000;
  }
  
  const visibleRadius = height * 0.5;
  const baseDistance = visibleRadius * 0.1;
  
  //console.log(`Camera height: ${height.toFixed(0)}m, calculated base distance: ${baseDistance.toFixed(0)}m`);
  
  const result = Math.max(1000, Math.min(baseDistance, 100000));
  
  if (!Number.isFinite(result) || result <= 0) {
    console.warn('Invalid range distance result:', result);
    return 10000;
  }
  
  return result;
}

function createBearingLines(pos) {
  clearBearingLines();
  
  const tracks = getTracks();
  const ownShip = tracks.find(t => t.affiliation === AFFILIATIONS.OWN_SHIP);
  if (!ownShip) return;
  
  const result = getDataUri(ownShip.sidc, ownShip.heading, SYMBOL_SIZE, ownShip.affiliation);
  const offsetX = result.centerOffsetX || 0;
  const offsetY = result.centerOffsetY || 0;
  
  const metersPerDeg = 111320 * Math.cos(pos.lat * Math.PI / 180);
  const centerLon = pos.lon - (offsetX / SYMBOL_SIZE) * (0.01 / metersPerDeg);
  const centerLat = pos.lat + (offsetY / SYMBOL_SIZE) * (0.01 / metersPerDeg);
  
  const lineLengthMultiplier = 1.05;
  const lineLengthMeters = baseRangeDistance * 5 * lineLengthMultiplier;
  
  BEARING_ANGLES.forEach((angle, index) => {
    const angleRad = angle * (Math.PI / 180);
    const endLat = centerLat + (lineLengthMeters / 6371000) * Math.cos(angleRad) * (180 / Math.PI);
    const endLon = centerLon + (lineLengthMeters / 6371000) * Math.sin(angleRad) * (180 / Math.PI) / Math.cos(pos.lat * Math.PI / 180);
    
    const entity = entityCollection.add({
      id: `bearing-line-${angle}`,
      polyline: {
        positions: Cesium.Cartesian3.fromDegreesArrayHeights([
          centerLon, centerLat, 0,
          endLon, endLat, 0
        ]),
        width: angle % 90 === 0 ? 3 : 2,
        material: Cesium.Color.fromCssColorString(
          angle % 90 === 0 ? 'rgba(0, 200, 255, 0.9)' : 'rgba(0, 200, 255, 0.6)'
        ),
        clampToGround: false
      }
    });
    bearingLineEntities.push(entity);
  });
}

function clearRangeRings() {
  rangeRingEntities.forEach(entity => {
    entityCollection.remove(entity);
  });
  rangeRingLabels.forEach(label => {
    entityCollection.remove(label);
  });
  rangeRingEntities = [];
  rangeRingLabels = [];
}

function clearBearingLines() {
  bearingLineEntities.forEach(entity => {
    entityCollection.remove(entity);
  });
  bearingLineEntities = [];
}

export function updateOwnShip3D(elapsedSeconds) {
  if (!entityCollection) return;
  
  clearRangeRings();
  clearBearingLines();
  
  const tracks = getTracks();
  const ownShip = tracks.find(t => t.affiliation === AFFILIATIONS.OWN_SHIP);
  
  if (!ownShip) return;
  
  const pos = calculatePosition(ownShip, elapsedSeconds);
  
  createRangeRings(pos);
  createBearingLines(pos);
}

export function clearOwnShip3D() {
  clearRangeRings();
  clearBearingLines();
}
