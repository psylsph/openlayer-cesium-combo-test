import { getTracks } from '../scenario/tracks.js';
import { getDataUri } from '../symbol/symbolRenderer.js';
import { SYMBOL_SIZE } from '../config.js';

let selectedTrackId = null;
let onTrackSelectCallback = null;

export function initSidebar(onTrackSelect) {
  onTrackSelectCallback = onTrackSelect;
  renderTrackList();
}

function renderTrackList() {
  const trackList = document.getElementById('track-list');
  if (!trackList) return;
  
  trackList.innerHTML = '';
  
  const tracks = getTracks();
  
  tracks.forEach(track => {
    const item = document.createElement('div');
    item.className = 'track-item';
    item.dataset.trackId = track.id;
    
    const result = getDataUri(track.sidc, track.heading, SYMBOL_SIZE, track.affiliation);
    const canvas = result.canvas;
    canvas.style.width = SYMBOL_SIZE + 'px';
    canvas.style.height = SYMBOL_SIZE + 'px';
    
    const info = document.createElement('div');
    info.className = 'track-info';
    
    const name = document.createElement('div');
    name.className = 'track-name';
    name.textContent = track.name;
    
    const type = document.createElement('div');
    type.className = 'track-type';
    type.textContent = track.description;
    
    info.appendChild(name);
    info.appendChild(type);
    
    item.appendChild(canvas);
    item.appendChild(info);
    
    item.addEventListener('click', () => {
      selectTrack(track.id);
      if (onTrackSelectCallback) {
        onTrackSelectCallback(track.id);
      }
    });
    
    trackList.appendChild(item);
  });
}

export function selectTrack(trackId) {
  selectedTrackId = trackId;
  
  const items = document.querySelectorAll('.track-item');
  items.forEach(item => {
    if (item.dataset.trackId === trackId) {
      item.classList.add('selected');
    } else {
      item.classList.remove('selected');
    }
  });
}

export function clearSelection() {
  selectedTrackId = null;
  
  const items = document.querySelectorAll('.track-item');
  items.forEach(item => {
    item.classList.remove('selected');
  });
}

export function getSelectedTrackId() {
  return selectedTrackId;
}

export function updateTrackList() {
  renderTrackList();
  if (selectedTrackId) {
    selectTrack(selectedTrackId);
  }
}

export function showTrackDetails(track) {
  const trackList = document.getElementById('track-list');
  if (!trackList) return;
  
  let detailsPanel = document.getElementById('track-details');
  if (!detailsPanel) {
    detailsPanel = document.createElement('div');
    detailsPanel.id = 'track-details';
    detailsPanel.style.cssText = `
      margin-top: 12px;
      padding: 12px;
      background: rgba(0, 50, 80, 0.8);
      border: 1px solid #4fc3f7;
      border-radius: 4px;
      color: #eee;
      font-size: 12px;
    `;
    
    const closeBtn = document.createElement('button');
    closeBtn.textContent = '×';
    closeBtn.style.cssText = `
      position: absolute;
      top: 4px;
      right: 4px;
      background: none;
      border: none;
      color: #888;
      cursor: pointer;
      font-size: 16px;
    `;
    closeBtn.addEventListener('click', () => {
      detailsPanel.remove();
    });
    
    detailsPanel.appendChild(closeBtn);
    trackList.appendChild(detailsPanel);
  }
  
  detailsPanel.innerHTML = `
    <div style="font-weight: bold; color: #4fc3f7; margin-bottom: 8px; border-bottom: 1px solid #333; padding-bottom: 8px;">
      ${track.name}
    </div>
    <div style="margin-bottom: 4px;">
      <span style="color: #888;">Type:</span> ${track.description}
    </div>
    <div style="margin-bottom: 4px;">
      <span style="color: #888;">Speed:</span> ${track.speed} kts
    </div>
    <div style="margin-bottom: 4px;">
      <span style="color: #888;">Heading:</span> ${track.heading}°
    </div>
    <div style="margin-bottom: 4px;">
      <span style="color: #888;">Affiliation:</span> ${track.affiliation}
    </div>
    <div style="margin-bottom: 4px;">
      <span style="color: #888;">Position:</span> ${track.startLat.toFixed(3)}°, ${track.startLon.toFixed(3)}°
    </div>
  `;
}

export function showAircraftDetails(aircraft) {
  const trackList = document.getElementById('track-list');
  if (!trackList) return;
  
  let detailsPanel = document.getElementById('aircraft-details');
  if (!detailsPanel) {
    detailsPanel = document.createElement('div');
    detailsPanel.id = 'aircraft-details';
    detailsPanel.style.cssText = `
      margin-top: 12px;
      padding: 12px;
      background: rgba(0, 50, 80, 0.8);
      border: 1px solid #4fc3f7;
      border-radius: 4px;
      color: #eee;
      font-size: 12px;
    `;
    
    const closeBtn = document.createElement('button');
    closeBtn.textContent = '×';
    closeBtn.style.cssText = `
      position: absolute;
      top: 4px;
      right: 4px;
      background: none;
      border: none;
      color: #888;
      cursor: pointer;
      font-size: 16px;
    `;
    closeBtn.addEventListener('click', () => {
      detailsPanel.remove();
    });
    
    detailsPanel.appendChild(closeBtn);
    trackList.appendChild(detailsPanel);
  }
  
  const speedKts = Math.round(aircraft.velocity / 0.514444);
  detailsPanel.innerHTML = `
    <div style="font-weight: bold; color: #00ff00; margin-bottom: 8px; border-bottom: 1px solid #333; padding-bottom: 8px;">
      ${aircraft.callsign}
    </div>
    <div style="margin-bottom: 4px;">
      <span style="color: #888;">ICAO24:</span> <span style="font-family: monospace;">${aircraft.icao24}</span>
    </div>
    <div style="margin-bottom: 4px;">
      <span style="color: #888;">Country:</span> ${aircraft.originCountry}
    </div>
    <div style="margin-bottom: 4px;">
      <span style="color: #888;">Affiliation:</span> ${aircraft.affiliation}
    </div>
    <div style="margin-bottom: 4px;">
      <span style="color: #888;">Altitude:</span> ${Math.round(aircraft.position.alt)}m
    </div>
    <div style="margin-bottom: 4px;">
      <span style="color: #888;">Speed:</span> ${speedKts} kts
    </div>
    <div style="margin-bottom: 4px;">
      <span style="color: #888;">Heading:</span> ${Math.round(aircraft.heading)}°
    </div>
    <div style="margin-bottom: 4px;">
      <span style="color: #888;">Position:</span> ${aircraft.position.lat.toFixed(3)}°, ${aircraft.position.lon.toFixed(3)}°
    </div>
  `;
}
