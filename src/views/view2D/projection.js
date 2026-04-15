import { get, transform, toLonLat, fromLonLat } from 'ol/proj.js';
import View from 'ol/View.js';
import { getMap2D } from './map2D.js';

const PROJECTIONS = ['EPSG:3857', 'EPSG:4326'];

export function getAvailableProjections() {
  return PROJECTIONS;
}

export function getCurrentProjection() {
  const map = getMap2D();
  if (!map) return 'EPSG:3857';
  const proj = map.getView().getProjection();
  return proj ? proj.getCode() : 'EPSG:3857';
}

export function switchProjection(projCode) {
  const map = getMap2D();
  if (!map) return;
  
  const currentView = map.getView();
  const center = currentView.getCenter();
  const zoom = currentView.getZoom();
  const rotation = currentView.getRotation();
  
  const currentProj = currentView.getProjection();
  if (!currentProj) return;
  
  const currentProjCode = currentProj.getCode();
  const centerLonLat = toLonLat(center, currentProjCode);
  
  const newProj = get(projCode);
  if (!newProj) {
    console.warn(`Projection ${projCode} not found, using EPSG:3857`);
    return;
  }
  
  const newView = new View({
    projection: newProj,
    center: fromLonLat(centerLonLat, newProj),
    zoom: zoom,
    rotation: rotation
  });
  
  map.setView(newView);
  
  // Trigger a custom event so other modules can respond to projection change
  const event = new CustomEvent('projectionChanged', { 
    detail: { 
      oldProjCode: currentProjCode, 
      newProjCode: projCode 
    } 
  });
  window.dispatchEvent(event);
  
  return {
    center: centerLonLat,
    zoom: zoom
  };
}

export function transformCoordinates(coords, fromProj, toProj) {
  return transform(coords, fromProj, toProj);
}
