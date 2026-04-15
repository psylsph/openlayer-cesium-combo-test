import * as Cesium from 'cesium';
import { getDataUri } from '../symbol/symbolRenderer.js';
import { SYMBOL_SIZE } from '../config.js';
import { getSimulatedAircraft, getAircraftSidc } from './aircraftGenerator.js';

let entityCollection = null;
let aircraftEntities = new Map();
let viewer = null;
let lastUpdateTime = 0;
const UPDATE_INTERVAL = 100;
let maxVisibleAircraft = 300;

export function initAircraftLayer3D(viewerParam) {
  viewer = viewerParam;
  entityCollection = viewer.entities;
  return entityCollection;
}

export function createAircraftEntity(aircraft) {
  const sidc = getAircraftSidc(aircraft.affiliation);
  const result = getDataUri(sidc, aircraft.heading, SYMBOL_SIZE, aircraft.affiliation);
  const { canvas, centerOffsetX, centerOffsetY } = result;
  
  const position = Cesium.Cartesian3.fromDegrees(
    aircraft.position.lon,
    aircraft.position.lat,
    aircraft.position.alt
  );
  
  const groundPosition = Cesium.Cartesian3.fromDegrees(
    aircraft.position.lon,
    aircraft.position.lat,
    0
  );
  
  const entity = entityCollection.add({
    id: `aircraft_${aircraft.icao24}`,
    position: position,
    billboard: {
      image: canvas,
      verticalOrigin: Cesium.VerticalOrigin.CENTER,
      horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
      pixelOffset: new Cesium.Cartesian2(centerOffsetX, centerOffsetY),
      scale: 0.8,
      heightReference: Cesium.HeightReference.NONE,
      disableDepthTestDistance: Number.POSITIVE_INFINITY,
      icao24: aircraft.icao24,
      callsign: aircraft.callsign
    }
  });
  
  const leadLine = entityCollection.add({
    id: `aircraft_leadline_${aircraft.icao24}`,
    polyline: {
      positions: [groundPosition, position],
      width: 1,
      material: getLeadLineColor(aircraft.affiliation),
      clampToGround: false
    }
  });
  
  return { entity, leadLine };
}

export function updateAircraftPositions3D() {
  if (!entityCollection || !viewer) return;
  
  const now = Date.now();
  if (now - lastUpdateTime < UPDATE_INTERVAL) {
    return;
  }
  lastUpdateTime = now;
  
  const camera = viewer.camera;
  const height = camera.positionCartographic.height;
  
  const adjustedMaxVisible = Math.min(maxVisibleAircraft, Math.floor(height / 1000));
  
  let removedCount = 0;
  let addedCount = 0;
  
  const allAircraft = [];
  getSimulatedAircraft().forEach((aircraft, icao24) => {
    if (aircraft.position.alt >= 0) {
      allAircraft.push({ aircraft, icao24 });
    }
  });
  
  allAircraft.sort((a, b) => {
    const posA = Cesium.Cartesian3.fromDegrees(a.aircraft.position.lon, a.aircraft.position.lat, a.aircraft.position.alt);
    const posB = Cesium.Cartesian3.fromDegrees(b.aircraft.position.lon, b.aircraft.position.lat, b.aircraft.position.alt);
    return Cesium.Cartesian3.distance(posA, camera.position) - Cesium.Cartesian3.distance(posB, camera.position);
  });
  
  const visibleAircraft = allAircraft.slice(0, adjustedMaxVisible);
  const visibleIcaos = new Set(visibleAircraft.map(a => a.icao24));
  
  aircraftEntities.forEach((data, icao24) => {
    if (!visibleIcaos.has(icao24)) {
      if (data.leadLine) {
        entityCollection.remove(data.leadLine);
      }
      entityCollection.remove(data.entity);
      aircraftEntities.delete(icao24);
      removedCount++;
    }
  });
  
  visibleAircraft.forEach(({ aircraft, icao24 }) => {
    let data = aircraftEntities.get(icao24);
    
    if (!data) {
      data = createAircraftEntity(aircraft);
      aircraftEntities.set(icao24, data);
      addedCount++;
    } else {
      const airPosition = Cesium.Cartesian3.fromDegrees(
        aircraft.position.lon,
        aircraft.position.lat,
        aircraft.position.alt
      );
      
      const groundPosition = Cesium.Cartesian3.fromDegrees(
        aircraft.position.lon,
        aircraft.position.lat,
        0
      );
      
      data.entity.position = airPosition;
      
      if (data.leadLine) {
        data.leadLine.polyline.positions = [groundPosition, airPosition];
      }
    }
  });
}

export function clearAircraft3D() {
  if (viewer) {
    aircraftEntities.forEach((data, icao24) => {
      if (data.leadLine) {
        entityCollection.remove(data.leadLine);
      }
      entityCollection.remove(data.entity);
    });
  }
  aircraftEntities.clear();
}

export function getAircraftBillboards() {
  return aircraftEntities;
}

export function setMaxVisibleAircraft(count) {
  maxVisibleAircraft = count;
  console.log('Max visible aircraft (3D) set to:', count);
}

export function getMaxVisibleAircraft() {
  return maxVisibleAircraft;
}

function getLeadLineColor(affiliation) {
  switch (affiliation) {
    case 'HOSTILE': return Cesium.Color.fromCssColorString('rgba(255, 0, 0, 0.4)');
    case 'FRIENDLY': return Cesium.Color.fromCssColorString('rgba(0, 255, 255, 0.4)');
    case 'UNKNOWN': return Cesium.Color.fromCssColorString('rgba(255, 255, 0, 0.4)');
    default: return Cesium.Color.fromCssColorString('rgba(255, 255, 255, 0.4)');
  }
}