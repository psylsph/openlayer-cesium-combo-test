const BING_MAPS_KEY = import.meta.env.VITE_BING_MAPS_KEY || '';
const DEFAULT_PROJECTION = import.meta.env.VITE_DEFAULT_PROJECTION || 'EPSG:3857';
const SCENARIO_LAT = parseFloat(import.meta.env.VITE_SCENARIO_LAT) || 24.5;
const SCENARIO_LON = parseFloat(import.meta.env.VITE_SCENARIO_LON) || 120.5;
const SYMBOL_SIZE = parseInt(import.meta.env.VITE_SYMBOL_SIZE) || 50;
const GEOSERVER_URL = import.meta.env.VITE_GEOSERVER_URL || '/geoserver';

export {
  BING_MAPS_KEY,
  DEFAULT_PROJECTION,
  SCENARIO_LAT,
  SCENARIO_LON,
  SYMBOL_SIZE,
  GEOSERVER_URL
};
