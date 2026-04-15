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
    id: 'queen_elizabeth',
    name: 'HMS Queen Elizabeth',
    type: TRACK_TYPES.CARRIER,
    affiliation: AFFILIATIONS.FRIENDLY,
    sidc: SIDC.CARRIER,
    speed: 15,
    startLat: SCENARIO_LAT,
    startLon: SCENARIO_LON,
    startAlt: 0,
    heading: 90,
    description: 'Carrier'
  },
  {
    id: 'defender',
    name: 'HMS Defender',
    type: TRACK_TYPES.OWN_SHIP,
    affiliation: AFFILIATIONS.OWN_SHIP,
    sidc: SIDC.OWN_SHIP,
    speed: 20,
    startLat: SCENARIO_LAT + 0.02,
    startLon: SCENARIO_LON + 0.01,
    startAlt: 0,
    heading: 45,
    description: 'Own Ship'
  },
  {
    id: 'torpedo_boat_1',
    name: 'Enemy Torpedo Boat 1',
    type: TRACK_TYPES.TORPEDO_BOAT,
    affiliation: AFFILIATIONS.HOSTILE,
    sidc: SIDC.TORPEDO_BOAT,
    speed: 40,
    startLat: SCENARIO_LAT - 0.05,
    startLon: SCENARIO_LON - 0.08,
    startAlt: 0,
    heading: 315,
    description: 'Torpedo Boat'
  },
  {
    id: 'torpedo_boat_2',
    name: 'Enemy Torpedo Boat 2',
    type: TRACK_TYPES.TORPEDO_BOAT,
    affiliation: AFFILIATIONS.HOSTILE,
    sidc: SIDC.TORPEDO_BOAT,
    speed: 40,
    startLat: SCENARIO_LAT - 0.08,
    startLon: SCENARIO_LON - 0.05,
    startAlt: 0,
    heading: 300,
    description: 'Torpedo Boat'
  },
  {
    id: 'strike_aircraft',
    name: 'Enemy Strike Aircraft',
    type: TRACK_TYPES.STRIKE_AIRCRAFT,
    affiliation: AFFILIATIONS.HOSTILE,
    sidc: SIDC.STRIKE_AIRCRAFT,
    speed: 500,
    startLat: SCENARIO_LAT + 0.15,
    startLon: SCENARIO_LON - 0.1,
    startAlt: 8000,
    heading: 270,
    description: 'Strike Aircraft'
  },
  {
    id: 'missile',
    name: 'Land Attack Missile',
    type: TRACK_TYPES.MISSILE,
    affiliation: AFFILIATIONS.HOSTILE,
    sidc: SIDC.MISSILE,
    speed: 550,
    startLat: SCENARIO_LAT - 0.2,
    startLon: SCENARIO_LON + 0.15,
    startAlt: 2000,
    heading: 30,
    description: 'Missile'
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
