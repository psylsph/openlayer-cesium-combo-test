import Map from 'ol/Map.js';
import View from 'ol/View.js';
import TileWMS from 'ol/source/TileWMS.js';
import TileLayer from 'ol/layer/Tile.js';
import { fromLonLat, toLonLat } from 'ol/proj.js';
import ScaleLine from 'ol/control/ScaleLine.js';
import { defaults as defaultControls } from 'ol/control.js';
import { DEFAULT_PROJECTION, SCENARIO_LAT, SCENARIO_LON, GEOSERVER_URL } from '../../config.js';

let map = null;
let currentProjection = DEFAULT_PROJECTION;

export function initMap2D(container, onClick) {
  const geoserverLayer = new TileLayer({
    source: new TileWMS({
      url: GEOSERVER_URL + '/wms',
      params: {
        'LAYERS': 'ne:countries',
        'TILED': true
      },
      serverType: 'geoserver',
      transition: 0
    })
  });

  container.style.backgroundColor = '#1a3a5c';
  container.style.background = 'linear-gradient(180deg, #1a3a5c 0%, #0d2137 100%)';

  map = new Map({
    target: container,
    layers: [geoserverLayer],
    view: new View({
      center: fromLonLat([SCENARIO_LON, SCENARIO_LAT]),
      zoom: 10,
      projection: DEFAULT_PROJECTION
    }),
    controls: defaultControls().extend([
      new ScaleLine({
        units: 'metric',
        bar: true,
        text: true,
        minWidth: 100
      })
    ])
  });

  map.on('click', (evt) => {
    if (onClick) {
      const coord = toLonLat(evt.coordinate);
      onClick({
        lon: coord[0],
        lat: coord[1],
        pixel: evt.pixel
      });
    }
  });

  return map;
}

export function getMap2D() {
  return map;
}

export function setProjection2D(projCode) {
  if (!map) return;
  
  const view = map.getView();
  const center = view.getCenter();
  const zoom = view.getZoom();
  
  const newProj = projCode;
  currentProjection = projCode;
  
  const newView = new View({
    projection: newProj,
    center: center,
    zoom: zoom
  });
  
  map.setView(newView);
}

export function getCurrentProjection() {
  return currentProjection;
}

export function getCenter() {
  if (!map) return null;
  const view = map.getView();
  return view.getCenter();
}

export function getZoom() {
  if (!map) return null;
  return map.getView().getZoom();
}

export function setCenter(lon, lat, zoom) {
  if (!map) return;
  const view = map.getView();
  const center = fromLonLat([lon, lat]);
  view.setCenter(center);
  if (zoom !== undefined) {
    view.setZoom(zoom);
  }
}

export function updateCoordinateReadout(coord) {
  const readout = document.getElementById('coordinate-readout');
  if (readout && coord) {
    readout.textContent = `Lat: ${coord.lat.toFixed(3)}° Lon: ${coord.lon.toFixed(3)}°`;
  }
}
