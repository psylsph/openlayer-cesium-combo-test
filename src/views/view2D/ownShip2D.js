import VectorLayer from 'ol/layer/Vector.js';
import VectorSource from 'ol/source/Vector.js';
import { Style, Stroke, Fill } from 'ol/style.js';
import Feature from 'ol/Feature.js';
import { LineString, Polygon, Circle } from 'ol/geom.js';
import { fromLonLat } from 'ol/proj.js';
import { getTracks, calculatePosition, AFFILIATIONS } from '../../scenario/tracks.js';

let ownShipLayer = null;
let map2D = null;
const RANGE_RINGS = [5, 10, 25, 50, 100];
const BEARING_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315];

export function initOwnShipLayer2D(map) {
  map2D = map;
  const source = new VectorSource();
  
  ownShipLayer = new VectorLayer({
    source: source,
    zIndex: 5
  });
  
  map.addLayer(ownShipLayer);
  
  return ownShipLayer;
}

function createRangeRings(centerLon, centerLat) {
  const features = [];
  const view = map2D.getView();
  const projection = view.getProjection();
  const center = fromLonLat([centerLon, centerLat], projection);
  
  RANGE_RINGS.forEach(km => {
    const radiusMeters = km * 1000;
    const circleGeom = new Circle(center, radiusMeters);
    
    const feature = new Feature({
      geometry: circleGeom
    });
    
    feature.setStyle(new Style({
      stroke: new Stroke({
        color: km === 5 || km === 25 || km === 100 ? 'rgba(0, 200, 255, 0.6)' : 'rgba(0, 200, 255, 0.3)',
        width: km === 5 || km === 25 || km === 100 ? 2 : 1
      }),
      fill: new Fill({
        color: 'rgba(0, 50, 100, 0.1)'
      })
    }));
    
    features.push(feature);
  });
  
  return features;
}

function createBearingLines(centerLon, centerLat) {
  const features = [];
  const lineLengthKm = 200;
  const view = map2D.getView();
  const projection = view.getProjection();
  const center = fromLonLat([centerLon, centerLat], projection);
  
  BEARING_ANGLES.forEach(angle => {
    const angleRad = angle * (Math.PI / 180);
    const endLat = centerLat + (lineLengthKm / 111.32) * Math.cos(angleRad);
    const endLon = centerLon + (lineLengthKm / 111.32) * Math.sin(angleRad) / Math.cos(centerLat * Math.PI / 180);
    
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
  
  const tracks = getTracks();
  const ownShip = tracks.find(t => t.affiliation === AFFILIATIONS.OWN_SHIP);
  
  if (!ownShip) return;
  
  const pos = calculatePosition(ownShip, elapsedSeconds);
  
  const rangeRingFeatures = createRangeRings(pos.lon, pos.lat);
  const bearingFeatures = createBearingLines(pos.lon, pos.lat);
  
  rangeRingFeatures.forEach(f => source.addFeature(f));
  bearingFeatures.forEach(f => source.addFeature(f));
}

export function clearOwnShip2D() {
  if (!ownShipLayer) return;
  const source = ownShipLayer.getSource();
  source.clear();
}
