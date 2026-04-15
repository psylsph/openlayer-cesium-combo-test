import { getTracks, AFFILIATIONS } from '../scenario/tracks.js';

const simulatedAircraft = new Map();
const countries = ['United States', 'United Kingdom', 'Russia', 'China', 'France', 'Germany', 'Japan', 'Taiwan', 'India', 'Unknown'];
const hostileCountries = ['Russia', 'China'];
const friendlyCountries = ['United States', 'United Kingdom', 'France', 'Germany', 'Japan', 'Taiwan', 'India'];

export function getAircraftAffiliation(country) {
  if (!country) return 'UNKNOWN';
  if (hostileCountries.some(c => country.includes(c))) return 'HOSTILE';
  if (friendlyCountries.some(c => country.includes(c))) return 'FRIENDLY';
  return 'UNKNOWN';
}

export function getAircraftSidc(affiliation) {
  switch (affiliation) {
    case 'HOSTILE': return 'SHP--------D';
    case 'FRIENDLY': return 'SFP--------D';
    default: return 'SUP--------D';
  }
}

function generateCallsign() {
  const prefixes = ['UAL', 'DAL', 'AAL', 'SWA', 'JBU', 'ASA', 'SKW', 'RPA', 'FFT', 'NKS', 'VOI', 'EGF'];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const number = Math.floor(Math.random() * 9000) + 100;
  return `${prefix}${number}`.trim();
}

function easeInOutQuad(t) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

export function generateSimulatedAircraft(count, bounds) {
  console.log(`Generating ${count} simulated aircraft...`);
  
  const latMin = bounds.south;
  const latMax = bounds.north;
  const lonMin = bounds.west;
  const lonMax = bounds.east;
  
  for (let i = 0; i < count; i++) {
    const icao24 = (Math.random() * 0xFFFFFF | 0).toString(16).padStart(6, '0').toUpperCase();
    const callsign = generateCallsign();
    const country = countries[Math.floor(Math.random() * countries.length)];
    
    const affiliation = getAircraftAffiliation(country);
    
    const lat = latMin + Math.random() * (latMax - latMin);
    const lon = lonMin + Math.random() * (lonMax - lonMin);
    const alt = Math.random() * 12000 + 3000;
    const speed = Math.random() * 250 + 150;
    const heading = Math.random() * 360;
    const verticalRate = (Math.random() - 0.5) * 30;
    
    simulatedAircraft.set(icao24, {
      icao24,
      callsign,
      originCountry: country,
      affiliation,
      lastUpdate: Date.now(),
      position: { lat, lon, alt },
      velocity: speed * 0.514444,
      heading,
      verticalRate,
      onGround: false
    });
  }
  
  console.log(`Generated ${simulatedAircraft.size} simulated aircraft`);
  return simulatedAircraft;
}

export function updateSimulatedAircraftPositions(deltaTimeMs) {
  const now = Date.now();
  
  simulatedAircraft.forEach((aircraft, icao24) => {
    const timeSinceUpdate = (now - aircraft.lastUpdate) / 1000;
    
    if (timeSinceUpdate < 0.1) return;
    
    const velocityMps = aircraft.velocity;
    const headingRad = (aircraft.heading - 90) * (Math.PI / 180);
    const verticalRateMps = aircraft.verticalRate * 0.3048 / 60;
    
    const distanceM = velocityMps * timeSinceUpdate;
    
    const earthRadius = 6371000;
    const lat1Rad = aircraft.position.lat * (Math.PI / 180);
    const lon1Rad = aircraft.position.lon * (Math.PI / 180);
    
    const newLatRad = lat1Rad + (distanceM * Math.cos(headingRad)) / earthRadius;
    const newLonRad = lon1Rad + (distanceM * Math.sin(headingRad)) / (earthRadius * Math.cos(lat1Rad));
    
    aircraft.position.lat = newLatRad * (180 / Math.PI);
    aircraft.position.lon = newLonRad * (180 / Math.PI);
    aircraft.position.alt = aircraft.position.alt + (verticalRateMps * timeSinceUpdate);
    aircraft.lastUpdate = now;
    
    if (Math.random() < 0.001) {
      aircraft.heading = (aircraft.heading + (Math.random() - 0.5) * 10) % 360;
      if (aircraft.heading < 0) aircraft.heading += 360;
    }
    
    if (aircraft.position.alt < 3000) aircraft.position.alt = 3000;
    if (aircraft.position.alt > 15000) aircraft.position.alt = 15000;
  });
}

export function getSimulatedAircraft() {
  return simulatedAircraft;
}

export function getSimulatedAircraftById(icao24) {
  return simulatedAircraft.get(icao24);
}

export function clearSimulatedAircraft() {
  simulatedAircraft.clear();
}

export function getSimulatedAircraftCount() {
  return simulatedAircraft.size;
}