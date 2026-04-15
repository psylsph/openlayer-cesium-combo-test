import { get, transform, toLonLat, fromLonLat } from 'ol/proj.js';
import VectorLayer from 'ol/layer/Vector.js';
import VectorSource from 'ol/source/Vector.js';
import { Style, Icon } from 'ol/style.js';
import Feature from 'ol/Feature.js';
import Point from 'ol/geom/Point.js';
import { getDataUri } from '../../symbol/symbolRenderer.js';
import { getTracks, calculatePosition } from '../../scenario/tracks.js';
import { SYMBOL_SIZE } from '../../config.js';
import { showTrackPopup } from '../../ui/popup.js';
import { showTrackDetails, selectTrack as selectTrackInSidebar } from '../../ui/sidebar.js';
import { getElapsedTime } from '../../scenario/timeline.js';

let map2D = null;
let trackLayer = null;
let trackFeatures = new Map();
let currentTracks = [];
let currentProjectionCode = 'EPSG:3857';
let onTrackSelectCallback = null;

export function initTrackLayer2D(map, onTrackSelect) {
  map2D = map;
  onTrackSelectCallback = onTrackSelect;
  currentProjectionCode = map.getView().getProjection().getCode();
  
  const source = new VectorSource();
  
  trackLayer = new VectorLayer({
    source: source,
    zIndex: 10
  });
  
  map.addLayer(trackLayer);
  
  // Add click handler for track popups
  map.on('click', (evt) => {
    const hitFeature = map.forEachFeatureAtPixel(evt.pixel, (f) => f);
    if (hitFeature && hitFeature.get('trackId')) {
      const trackId = hitFeature.get('trackId');
      const track = getTracks().find(t => t.id === trackId);
      if (track) {
        evt.stopPropagation();
        showTrackDetails(track);
        selectTrackInSidebar(trackId);
        onTrackSelectCallback(trackId);
      }
    }
  });
  
  // Listen for projection changes
  window.addEventListener('projectionChanged', handleProjectionChange);
  
  return trackLayer;
}

function handleProjectionChange(event) {
  const { newProjCode } = event.detail;
  currentProjectionCode = newProjCode;
  recreateAllFeatures();
}

export function createTrackFeature(track, map) {
  const result = getDataUri(track.sidc, track.heading, SYMBOL_SIZE, track.affiliation);
  const { canvas, centerOffsetX, centerOffsetY } = result;
  
  const view = map.getView();
  const projection = view.getProjection();
  const coordinate = fromLonLat([track.startLon, track.startLat], projection);
  
  const feature = new Feature({
    geometry: new Point(coordinate),
    trackId: track.id,
    trackName: track.name
  });
  
  feature.setStyle(new Style({
    image: new Icon({
      img: canvas,
      imgSize: [canvas.width, canvas.height],
      anchor: [0.5, 0.5],
      anchorXUnits: 'fraction',
      anchorYUnits: 'fraction'
    })
  }));
  
  return feature;
}

export function getTrackLayerZIndex() {
  return trackLayer ? trackLayer.getZIndex() : -1;
}

export function updateTrackPositions2D(elapsedSeconds) {
  if (!trackLayer || !map2D) return;
  
  const source = trackLayer.getSource();
  const tracks = getTracks();
  const view = map2D.getView();
  const projection = view.getProjection();
  
  tracks.forEach(track => {
    const pos = calculatePosition(track, elapsedSeconds);
    let feature = trackFeatures.get(track.id);
    
    if (!feature) {
      feature = createTrackFeature(track, map2D);
      trackFeatures.set(track.id, feature);
      source.addFeature(feature);
    }
    
    const geometry = feature.getGeometry();
    const coordinate = fromLonLat([pos.lon, pos.lat], projection);
    geometry.setCoordinates(coordinate);
  });
  
  currentTracks = tracks;
}

export function recreateAllFeatures() {
  if (!trackLayer || !map2D) return;
  
  const source = trackLayer.getSource();
  const view = map2D.getView();
  const projection = view.getProjection();
  const tracks = getTracks();
  
  // Clear existing features
  trackFeatures.clear();
  source.clear();
  
  // Recreate all features with new projection
  tracks.forEach(track => {
    const feature = createTrackFeature(track, map2D);
    trackFeatures.set(track.id, feature);
    source.addFeature(feature);
  });
  
  // Also recreate own-ship features
  const ownShip = tracks.find(t => t.affiliation === 'OWN_SHIP');
  if (ownShip) {
    // Update own-ship features separately
  }
}

export function getTrackFeatures() {
  return trackFeatures;
}

export function setTrackStyle(trackId, isSelected) {
  const feature = trackFeatures.get(trackId);
  if (!feature) return;
  
  const tracks = getTracks();
  const track = tracks.find(t => t.id === trackId);
  if (!track) return;
  
  const result = getDataUri(track.sidc, track.heading, SYMBOL_SIZE, track.affiliation);
  const { canvas, centerOffsetX, centerOffsetY } = result;
  
  feature.setStyle(new Style({
    image: new Icon({
      img: canvas,
      imgSize: [canvas.width, canvas.height],
      anchor: [0.5, 0.5],
      anchorXUnits: 'fraction',
      anchorYUnits: 'fraction',
      opacity: isSelected ? 1.0 : 0.7,
      scale: isSelected ? 1.0 : 0.8
    })
  }));
}
