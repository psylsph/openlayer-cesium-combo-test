import * as Cesium from 'cesium';
import { getTracks, calculatePosition, AFFILIATIONS } from '../../scenario/tracks.js';

let entityCollection = null;
let rangeRingEntities = [];
let bearingLineEntities = [];
const RANGE_RINGS = [5, 10, 25, 50, 100];
const BEARING_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315];

export function initOwnShipLayer3D(viewer) {
  entityCollection = viewer.entities;
  return entityCollection;
}

function createRangeRings(pos) {
  clearRangeRings();
  
  RANGE_RINGS.forEach((km, index) => {
    const entity = entityCollection.add({
      id: `range-ring-${km}`,
      position: Cesium.Cartesian3.fromDegrees(pos.lon, pos.lat),
      ellipse: {
        semiMajorAxis: km * 1000,
        semiMinorAxis: km * 1000,
        material: Cesium.Color.TRANSPARENT,
        outline: true,
        outlineColor: km === 5 || km === 25 || km === 100 
          ? Cesium.Color.fromCssColorString('rgba(0, 200, 255, 0.6)') 
          : Cesium.Color.fromCssColorString('rgba(0, 200, 255, 0.3)'),
        outlineWidth: km === 5 || km === 25 || km === 100 ? 2 : 1
      }
    });
    rangeRingEntities.push(entity);
  });
}

function createBearingLines(pos) {
  clearBearingLines();
  
  const lineLengthKm = 200;
  
  BEARING_ANGLES.forEach((angle, index) => {
    const angleRad = angle * (Math.PI / 180);
    const endLat = pos.lat + (lineLengthKm / 111.32) * Math.cos(angleRad);
    const endLon = pos.lon + (lineLengthKm / 111.32) * Math.sin(angleRad) / Math.cos(pos.lat * Math.PI / 180);
    
    const entity = entityCollection.add({
      id: `bearing-line-${angle}`,
      polyline: {
        positions: Cesium.Cartesian3.fromDegreesArray([
          pos.lon, pos.lat,
          endLon, endLat
        ]),
        width: angle % 90 === 0 ? 2 : 1,
        material: Cesium.Color.fromCssColorString(
          angle % 90 === 0 ? 'rgba(0, 200, 255, 0.8)' : 'rgba(0, 200, 255, 0.4)'
        ),
        clampToGround: true
      }
    });
    bearingLineEntities.push(entity);
  });
}

function clearRangeRings() {
  rangeRingEntities.forEach(entity => {
    entityCollection.remove(entity);
  });
  rangeRingEntities = [];
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
