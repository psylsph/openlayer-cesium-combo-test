import VectorLayer from 'ol/layer/Vector.js';
import VectorSource from 'ol/source/Vector.js';
import { Style, Icon } from 'ol/style.js';
import Feature from 'ol/Feature.js';
import Point from 'ol/geom/Point.js';
import { fromLonLat } from 'ol/proj.js';
import { getDataUri } from '../symbol/symbolRenderer.js';
import { SYMBOL_SIZE } from '../config.js';
import { getSimulatedAircraft, getAircraftSidc } from './aircraftGenerator.js';
import { showAircraftDetails } from '../ui/sidebar.js';

let aircraftLayer = null;
let map2D = null;
let aircraftFeatures = new Map();
let lastUpdateTime = 0;
const UPDATE_INTERVAL = 2000;
let maxVisibleAircraft = 1000;

export function initAircraftLayer2D(map) {
  map2D = map;
  const source = new VectorSource();
  
  aircraftLayer = new VectorLayer({
    source: source,
    zIndex: 8
  });
  
  map.addLayer(aircraftLayer);
  
  console.log('Aircraft layer 2D initialized');
  
  map.on('click', (evt) => {
    const feature = map.forEachFeatureAtPixel(evt.pixel, (f) => f);
    if (feature && feature.get('icao24')) {
      const aircraft = getSimulatedAircraft().get(feature.get('icao24'));
      if (aircraft) {
        evt.stopPropagation();
        showAircraftDetails(aircraft);
      }
    }
  });
  
  window.addEventListener('projectionChanged', () => {
    console.log('Projection changed, recreating aircraft features');
    recreateAllAircraftFeatures();
  });
  
  return aircraftLayer;
}

export function createAircraftFeature(aircraft) {
  const sidc = getAircraftSidc(aircraft.affiliation);
  const result = getDataUri(sidc, aircraft.heading, SYMBOL_SIZE, aircraft.affiliation);
  const { canvas } = result;
  
  const view = map2D.getView();
  const projection = view.getProjection();
  const coordinate = fromLonLat([aircraft.position.lon, aircraft.position.lat], projection);
  
  const feature = new Feature({
    geometry: new Point(coordinate),
    icao24: aircraft.icao24,
    callsign: aircraft.callsign,
    affiliation: aircraft.affiliation
  });
  
  feature.setStyle(new Style({
    image: new Icon({
      img: canvas,
      imgSize: [canvas.width, canvas.height],
      anchor: [0.5, 0.5],
      anchorXUnits: 'fraction',
      anchorYUnits: 'fraction',
      opacity: 0.7,
      scale: 0.8
    })
  }));
  
  return feature;
}

export function updateAircraftPositions2D() {
  if (!aircraftLayer || !map2D) return;
  
  const now = Date.now();
  if (now - lastUpdateTime < UPDATE_INTERVAL) {
    return;
  }
  lastUpdateTime = now;
  
  const source = aircraftLayer.getSource();
  const view = map2D.getView();
  const projection = view.getProjection();
  const bounds = view.calculateExtent(map2D.getSize());
  const zoom = view.getZoom();
  
  const adjustedMaxVisible = Math.min(maxVisibleAircraft, Math.floor(Math.pow(2, zoom) * 10));
  
  console.log(`updateAircraftPositions2D (1Hz, zoom: ${zoom.toFixed(1)}, max: ${adjustedMaxVisible}), showing: ${aircraftFeatures.size}`);
  
  const simulatedAircraft = getSimulatedAircraft();
  
  const center = view.getCenter();
  const aircraftInViewport = [];
  
  simulatedAircraft.forEach((aircraft, icao24) => {
    const coordinate = fromLonLat([aircraft.position.lon, aircraft.position.lat], projection);
    
    const [minX, minY, maxX, maxY] = bounds;
    if (coordinate[0] < minX || coordinate[0] > maxX || coordinate[1] < minY || coordinate[1] > maxY) {
      return;
    }
    
    const distance = Math.sqrt(
      Math.pow(coordinate[0] - center[0], 2) + 
      Math.pow(coordinate[1] - center[1], 2)
    );
    
    aircraftInViewport.push({ aircraft, icao24, coordinate, distance });
  });
  
  aircraftInViewport.sort((a, b) => a.distance - b.distance);
  const visibleAircraft = aircraftInViewport.slice(0, adjustedMaxVisible);
  
  const visibleIcaos = new Set(visibleAircraft.map(a => a.icao24));
  
  aircraftFeatures.forEach((feature, icao24) => {
    if (!visibleIcaos.has(icao24)) {
      source.removeFeature(feature);
      aircraftFeatures.delete(icao24);
    }
  });
  
  let createdCount = 0;
  let updatedCount = 0;
  
  visibleAircraft.forEach(({ aircraft, icao24, coordinate }) => {
    let feature = aircraftFeatures.get(icao24);
    
    if (!feature) {
      const sidc = getAircraftSidc(aircraft.affiliation);
      const result = getDataUri(sidc, aircraft.heading, SYMBOL_SIZE, aircraft.affiliation);
      const { canvas } = result;
      
      feature = new Feature({
        geometry: new Point(coordinate),
        icao24: aircraft.icao24,
        callsign: aircraft.callsign,
        affiliation: aircraft.affiliation
      });
      
      feature.setStyle(new Style({
        image: new Icon({
          img: canvas,
          imgSize: [canvas.width, canvas.height],
          anchor: [0.5, 0.5],
          anchorXUnits: 'fraction',
          anchorYUnits: 'fraction',
          opacity: 0.7,
          scale: 0.8
        })
      }));
      
      aircraftFeatures.set(icao24, feature);
      source.addFeature(feature);
      createdCount++;
    } else {
      feature.getGeometry().setCoordinates(coordinate);
      updatedCount++;
    }
  });
  
  if (createdCount > 0 || updatedCount > 0) {
    console.log(`Aircraft layer update: created ${createdCount}, updated ${updatedCount}, total: ${aircraftFeatures.size}`);
  }
}

export function setMaxVisibleAircraft(count) {
  maxVisibleAircraft = count;
  console.log('Max visible aircraft set to:', count);
}

export function getMaxVisibleAircraft() {
  return maxVisibleAircraft;
}

export function clearAircraft2D() {
  if (!aircraftLayer) return;
  
  const source = aircraftLayer.getSource();
  source.clear();
  aircraftFeatures.clear();
}

export function getAircraftFeatures() {
  return aircraftFeatures;
}

export function recreateAllAircraftFeatures() {
  if (!aircraftLayer || !map2D) return;
  
  const source = aircraftLayer.getSource();
  const simulatedAircraft = getSimulatedAircraft();
  
  aircraftFeatures.clear();
  source.clear();
  
  simulatedAircraft.forEach((aircraft, icao24) => {
    const feature = createAircraftFeature(aircraft);
    aircraftFeatures.set(icao24, feature);
    source.addFeature(feature);
  });
  
  console.log(`Recreated ${aircraftFeatures.size} aircraft features`);
}