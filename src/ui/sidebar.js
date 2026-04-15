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
    
    const result = getDataUri(track.sidc, track.heading, 32, track.affiliation);
    const canvas = result.canvas;
    canvas.style.width = '32px';
    canvas.style.height = '32px';
    
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
