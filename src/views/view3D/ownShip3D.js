import * as Cesium from 'cesium';
import { getTracks, calculatePosition, AFFILIATIONS } from '../../scenario/tracks.js';
import { getDataUri } from '../../symbol/symbolRenderer.js';
import { SYMBOL_SIZE } from '../../config.js';

let entityCollection = null;
let viewer = null;
let currentElapsedSeconds = 0;
const RANGE_RINGS = [1, 2, 3, 4, 5];
const BEARING_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315];

export function initOwnShipLayer3D(viewerParam) {
  viewer = viewerParam;
  entityCollection = viewer.entities;
  createRangeRingsAndBearingLines();
  return entityCollection;
}

function createCirclePositions(lon, lat, radiusMeters, numPoints = 72) {
  const positions = [];
  for (let i = 0; i <= numPoints; i++) {
    const angle = (i / numPoints) * 2 * Math.PI;
    const d = radiusMeters / 6371000;
    const latOffset = d * Math.cos(angle);
    const lonOffset = d * Math.sin(angle) / Math.cos(lat);
    positions.push(Cesium.Cartesian3.fromRadians(lon + lonOffset, lat + latOffset));
  }
  return positions;
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

function getOwnShipPosition() {
  const tracks = getTracks();
  const ownShip = tracks.find(t => t.affiliation === AFFILIATIONS.OWN_SHIP);
  if (!ownShip) return null;
  
  const pos = calculatePosition(ownShip, currentElapsedSeconds);
  
  const result = getDataUri(ownShip.sidc, ownShip.heading, SYMBOL_SIZE, ownShip.affiliation);
  const offsetX = result.centerOffsetX || 0;
  const offsetY = result.centerOffsetY || 0;
  
  const metersPerDeg = 111320 * Math.cos(pos.lat * Math.PI / 180);
  const centerLon = pos.lon - (offsetX / SYMBOL_SIZE) * (0.01 / metersPerDeg);
  const centerLat = pos.lat + (offsetY / SYMBOL_SIZE) * (0.01 / metersPerDeg);
  
  return { lon: centerLon, lat: centerLat };
}

function createRangeRingsAndBearingLines() {
  RANGE_RINGS.forEach((multiplier, index) => {
    entityCollection.add({
      id: `range-ring-${multiplier}`,
      polyline: {
        positions: new Cesium.CallbackProperty(() => {
          const shipPos = getOwnShipPosition();
          if (!shipPos) return [];
          
          const cameraHeight = viewer.camera.positionCartographic.height;
          const baseDistance = Math.max(cameraHeight * 0.1, 5000);
          const ringRadius = baseDistance * multiplier;
          
          const centerLonRad = shipPos.lon * (Math.PI / 180);
          const centerLatRad = shipPos.lat * (Math.PI / 180);
          
          return createCirclePositions(centerLonRad, centerLatRad, ringRadius, 72);
        }, false),
        width: index === 0 ? 3 : 2,
        material: index === 0 
          ? Cesium.Color.LIME 
          : Cesium.Color.LIME.withAlpha(0.3),
        disableDepthTestDistance: Number.POSITIVE_INFINITY
      }
    });
  });
  
  const eastAngle = Math.PI / 2;
  
  RANGE_RINGS.forEach((multiplier) => {
    entityCollection.add({
      id: `range-ring-label-${multiplier}`,
      position: new Cesium.CallbackProperty(() => {
        const shipPos = getOwnShipPosition();
        if (!shipPos) return Cesium.Cartesian3.ZERO;
        
        const cameraHeight = viewer.camera.positionCartographic.height;
        const baseDistance = Math.max(cameraHeight * 0.1, 5000);
        const ringRadius = baseDistance * multiplier;
        
        const d = ringRadius / 6371000;
        const latOffset = d * Math.cos(eastAngle);
        const lonOffset = d * Math.sin(eastAngle) / Math.cos(shipPos.lat * Math.PI / 180);
        
        return Cesium.Cartesian3.fromDegrees(
          shipPos.lon + lonOffset * (180 / Math.PI),
          shipPos.lat + latOffset * (180 / Math.PI)
        );
      }, false),
      label: {
        text: new Cesium.CallbackProperty(() => {
          const cameraHeight = viewer.camera.positionCartographic.height;
          const baseDistance = Math.max(cameraHeight * 0.1, 5000);
          const ringRadius = baseDistance * multiplier;
          return formatDistance(ringRadius);
        }, false),
        font: '14px monospace',
        fillColor: Cesium.Color.LIME,
        showBackground: true,
        backgroundColor: Cesium.Color.BLACK.withAlpha(0.6),
        disableDepthTestDistance: Number.POSITIVE_INFINITY
      }
    });
  });
  
  const numBearings = 8;
  for (let i = 0; i < numBearings; i++) {
    const angle = BEARING_ANGLES[i];
    const angleRad = angle * (Math.PI / 180);
    const majorLine = angle % 90 === 0;
    
    entityCollection.add({
      id: `bearing-line-${angle}`,
      polyline: {
        positions: new Cesium.CallbackProperty(() => {
          const shipPos = getOwnShipPosition();
          if (!shipPos) return [];
          
          const cameraHeight = viewer.camera.positionCartographic.height;
          const baseDistance = Math.max(cameraHeight * 0.1, 5000);
          const startRadius = baseDistance;
          const endRadius = majorLine ? baseDistance * 5 : baseDistance * 3;
          
          const startLon = shipPos.lon + Math.sin(angleRad) * startRadius / 6371000 * (180 / Math.PI) / Math.cos(shipPos.lat * Math.PI / 180);
          const startLat = shipPos.lat + Math.cos(angleRad) * startRadius / 6371000 * (180 / Math.PI);
          
          const endLon = shipPos.lon + Math.sin(angleRad) * endRadius / 6371000 * (180 / Math.PI) / Math.cos(shipPos.lat * Math.PI / 180);
          const endLat = shipPos.lat + Math.cos(angleRad) * endRadius / 6371000 * (180 / Math.PI);
          
          return Cesium.Cartesian3.fromDegreesArray([startLon, startLat, endLon, endLat]);
        }, false),
        width: majorLine ? 2 : 1,
        material: Cesium.Color.LIME.withAlpha(majorLine ? 0.7 : 0.35),
        disableDepthTestDistance: Number.POSITIVE_INFINITY
      }
    });
  }
}

export function updateOwnShip3D(elapsedSeconds) {
  currentElapsedSeconds = elapsedSeconds;
}

export function clearOwnShip3D() {
  if (entityCollection) {
    const toRemove = [];
    entityCollection.values.forEach(entity => {
      if (entity.id && (entity.id.startsWith('range-ring') || entity.id.startsWith('bearing-line'))) {
        toRemove.push(entity);
      }
    });
    toRemove.forEach(entity => entityCollection.remove(entity));
  }
}