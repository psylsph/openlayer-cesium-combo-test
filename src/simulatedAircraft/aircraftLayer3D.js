import * as Cesium from 'cesium';
import { getDataUri } from '../symbol/symbolRenderer.js';
import { SYMBOL_SIZE } from '../config.js';
import { getSimulatedAircraft, getAircraftSidc } from './aircraftGenerator.js';

let billboardCollection = null;
let aircraftBillboards = new Map();
let viewer = null;
let lastUpdateTime = 0;
const UPDATE_INTERVAL = 1000;
let maxVisibleAircraft = 300;

export function initAircraftLayer3D(viewerParam) {
  viewer = viewerParam;
  billboardCollection = viewer.scene.primitives.add(new Cesium.BillboardCollection());
  return billboardCollection;
}

export function createAircraftBillboard(aircraft) {
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
  
  const billboard = billboardCollection.add({
    id: `aircraft_${aircraft.icao24}`,
    image: canvas,
    position: position,
    verticalOrigin: Cesium.VerticalOrigin.CENTER,
    horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
    pixelOffset: new Cesium.Cartesian2(centerOffsetX, centerOffsetY),
    scale: 0.8,
    heightReference: Cesium.HeightReference.NONE,
    disableDepthTestDistance: Number.POSITIVE_INFINITY,
    icao24: aircraft.icao24,
    callsign: aircraft.callsign
  });
  
  const leadLine = viewer.entities.add({
    id: `aircraft_leadline_${aircraft.icao24}`,
    polyline: {
      positions: [groundPosition, position],
      width: 1,
      material: getLeadLineColor(aircraft.affiliation),
      clampToGround: false
    }
  });
  
  return { billboard, leadLine };
}

export function updateAircraftPositions3D() {
  if (!billboardCollection || !viewer) return;
  
  const now = Date.now();
  if (now - lastUpdateTime < UPDATE_INTERVAL) {
    return;
  }
  lastUpdateTime = now;
  
  const camera = viewer.camera;
  const position = camera.positionCartographic;
  const height = camera.positionCartographic.height;
  
  // Adjust max visible based on camera height (LOD)
  const adjustedMaxVisible = Math.min(maxVisibleAircraft, Math.floor(height / 1000));
  
  let updatedCount = 0;
  let removedCount = 0;
  let addedCount = 0;
  
  // Get all aircraft and sort by distance
  const allAircraft = [];
  getSimulatedAircraft().forEach((aircraft, icao24) => {
    const aircraftPos = Cesium.Cartesian3.fromDegrees(
      aircraft.position.lon,
      aircraft.position.lat,
      aircraft.position.alt
    );
    const distance = Cesium.Cartesian3.distance(aircraftPos, camera.position);
    
    // Only consider aircraft within reasonable range
    if (distance < 500000 && aircraft.position.alt >= 0) {
      allAircraft.push({ aircraft, icao24, distance });
    }
  });
  
  // Sort by distance and limit
  allAircraft.sort((a, b) => a.distance - b.distance);
  const visibleAircraft = allAircraft.slice(0, adjustedMaxVisible);
  
  // Remove aircraft that are no longer in the visible set
  const visibleIcaos = new Set(visibleAircraft.map(a => a.icao24));
  
  aircraftBillboards.forEach((data, icao24) => {
    if (!visibleIcaos.has(icao24)) {
      if (data.leadLine) {
        viewer.entities.remove(data.leadLine);
      }
      if (data.billboard) {
        billboardCollection.remove(data.billboard);
      }
      aircraftBillboards.delete(icao24);
      removedCount++;
    }
  });
  
  // Update or create visible aircraft
  visibleAircraft.forEach(({ aircraft, icao24, distance }) => {
    let data = aircraftBillboards.get(icao24);
    
    if (!data) {
      data = createAircraftBillboard(aircraft);
      aircraftBillboards.set(icao24, data);
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
      
      data.billboard.position = airPosition;
      
      if (data.leadLine) {
        data.leadLine.polyline.positions = [groundPosition, airPosition];
      }
      
      updatedCount++;
    }
  });
  
  if (updatedCount > 0 || addedCount > 0 || removedCount > 0) {
    //console.log(`3D aircraft update (1Hz, max: ${adjustedMaxVisible}): updated ${updatedCount}, added ${addedCount}, removed ${removedCount}, total: ${aircraftBillboards.size}`);
  }
}

export function clearAircraft3D() {
  if (viewer) {
    aircraftBillboards.forEach((data, icao24) => {
      if (data.leadLine) {
        viewer.entities.remove(data.leadLine);
      }
    });
  }
  if (billboardCollection) {
    billboardCollection.removeAll();
  }
  aircraftBillboards.clear();
}

export function getAircraftBillboards() {
  return aircraftBillboards;
}

export function setMaxVisibleAircraft(count) {
  maxVisibleAircraft = count;
  console.log('Max visible aircraft (3D) set to:', count);
}

export function getMaxVisibleAircraft() {
  return maxVisibleAircraft;
}

function getSimulatedAircraftById(icao24) {
  return getSimulatedAircraft().get(icao24);
}

function getLeadLineColor(affiliation) {
  switch (affiliation) {
    case 'HOSTILE': return Cesium.Color.fromCssColorString('rgba(255, 0, 0, 0.4)');
    case 'FRIENDLY': return Cesium.Color.fromCssColorString('rgba(0, 255, 255, 0.4)');
    case 'UNKNOWN': return Cesium.Color.fromCssColorString('rgba(255, 255, 0, 0.4)');
    default: return Cesium.Color.fromCssColorString('rgba(255, 255, 255, 0.4)');
  }
}