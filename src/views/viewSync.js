import { getMap2D, getCenter, getZoom, setCenter as setCenter2D, getCurrentProjection as getProjection2D } from './view2D/map2D.js';
import { getViewer3D, setCameraPosition, getCameraPosition } from './view3D/map3D.js';
import { toLonLat } from 'ol/proj.js';

let currentView = '2D';
let onViewChangeCallback = null;

export function initViewSync(onChange) {
  onViewChangeCallback = onChange;
}

export function getCurrentView() {
  return currentView;
}

export function toggleView() {
  return currentView === '2D' ? switchTo3D() : switchTo2D();
}

export function switchTo2D() {
  const map2d = document.getElementById('map2d');
  const map3d = document.getElementById('map3d');
  const projectionGroup = document.getElementById('projection-group');
  
  if (map2d && map3d) {
    map2d.style.display = 'block';
    map3d.classList.remove('active');
    map3d.style.display = 'none';
  }
  
  if (projectionGroup) {
    projectionGroup.style.display = 'flex';
  }
  
  const camPos = getCameraPosition();
  if (camPos) {
    const zoom = altitudeToZoom(camPos.altitude);
    setCenter2D(camPos.lon, camPos.lat, zoom);
  }
  
  currentView = '2D';
  
  if (onViewChangeCallback) {
    onViewChangeCallback('2D');
  }
  
  return '2D';
}

export function switchTo3D() {
  const map2d = document.getElementById('map2d');
  const map3d = document.getElementById('map3d');
  const projectionGroup = document.getElementById('projection-group');
  
  if (map2d && map3d) {
    map2d.style.display = 'none';
    map3d.classList.add('active');
    map3d.style.display = 'block';
  }
  
  if (projectionGroup) {
    projectionGroup.style.display = 'none';
  }
  
  const map2 = getMap2D();
  if (map2) {
    const view = map2.getView();
    const center = view.getCenter();
    const zoom = view.getZoom();
    const proj = view.getProjection();
    
    let lon, lat;
    if (proj.getCode() === 'EPSG:3857') {
      const latLon = toLonLat(center);
      lon = latLon[0];
      lat = latLon[1];
    } else {
      lon = center[0];
      lat = center[1];
    }
    
    const altitude = zoomToAltitude(zoom);
    setCameraPosition(lon, lat, altitude, 0, -90);
  }
  
  currentView = '3D';
  
  if (onViewChangeCallback) {
    onViewChangeCallback('3D');
  }
  
  return '3D';
}

function zoomToAltitude(zoom) {
  const baseAltitude = 10000000;
  return baseAltitude / Math.pow(2, zoom);
}

function altitudeToZoom(altitude) {
  const baseAltitude = 10000000;
  return Math.log2(baseAltitude / altitude);
}

export function syncViewports(fromView, toView) {
  if (fromView === '2D' && toView === '3D') {
    return switchTo3D();
  } else if (fromView === '3D' && toView === '2D') {
    return switchTo2D();
  }
}

export function getViewportState() {
  if (currentView === '2D') {
    const map = getMap2D();
    if (!map) return null;
    const view = map.getView();
    return {
      view: '2D',
      center: view.getCenter(),
      zoom: view.getZoom(),
      projection: view.getProjection().getCode()
    };
  } else {
    const camPos = getCameraPosition();
    return {
      view: '3D',
      lon: camPos.lon,
      lat: camPos.lat,
      altitude: camPos.altitude,
      heading: camPos.heading,
      pitch: camPos.pitch
    };
  }
}
