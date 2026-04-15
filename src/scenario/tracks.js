import { SCENARIO_LAT, SCENARIO_LON } from '../config.js';

export const TRACK_TYPES = {
  CARRIER: 'carrier',
  OWN_SHIP: 'ownship',
  TORPEDO_BOAT: 'torpedo_boat',
  STRIKE_AIRCRAFT: 'strike_aircraft',
  MISSILE: 'missile'
};

export const AFFILIATIONS = {
  FRIENDLY: 'FRIENDLY',
  HOSTILE: 'HOSTILE',
  NEUTRAL: 'NEUTRAL',
  UNKNOWN: 'UNKNOWN',
  OWN_SHIP: 'OWN_SHIP'
};

const SIDC = {
  CARRIER: 'SFS---------D',
  OWN_SHIP: 'SFSP--------D',
  TORPEDO_BOAT: 'SHSP--------D',
  STRIKE_AIRCRAFT: 'SHPA--------D',
  MISSILE: 'SHG-UCM----D-'
};

const TRACK_DEFINITIONS = [
  {
    id: 'defender',
    name: 'HMS Defender',
    type: TRACK_TYPES.OWN_SHIP,
    affiliation: AFFILIATIONS.OWN_SHIP,
    sidc: SIDC.OWN_SHIP,
    speed: 20,
    startLat: SCENARIO_LAT,
    startLon: SCENARIO_LON,
    startAlt: 0,
    heading: 45,
    description: 'Own Ship'
  }
];

export function getTracks() {
  return TRACK_DEFINITIONS.map(track => ({ ...track }));
}

export function getTrackById(id) {
  return TRACK_DEFINITIONS.find(track => track.id === id);
}

export function calculatePosition(track, elapsedSeconds) {
  const speedKnots = track.speed;
  const speedDegPerSec = (speedKnots / 3600) * (1 / 60);
  const headingRad = (track.heading - 90) * (Math.PI / 180);
  
  const latDelta = Math.cos(headingRad) * speedDegPerSec * elapsedSeconds;
  const lonDelta = Math.sin(headingRad) * speedDegPerSec * elapsedSeconds / Math.cos(track.startLat * Math.PI / 180);
  
  let alt = track.startAlt || 0;
  
  if (track.type === TRACK_TYPES.STRIKE_AIRCRAFT) {
    alt = 8000 + Math.sin(elapsedSeconds * 0.1) * 500;
  } else if (track.type === TRACK_TYPES.MISSILE) {
    const timeToTarget = 1800 - elapsedSeconds;
    alt = Math.max(100, 2000 * (timeToTarget / 1800));
  }
  
  return {
    lat: track.startLat + latDelta,
    lon: track.startLon + lonDelta,
    alt: alt
  };
}
