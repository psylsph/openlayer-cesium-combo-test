let currentPopup = null;

export function showPopup(x, y, title, content) {
  closePopup();
  
  console.log('showPopup called:', { x, y, title });
  
  if (x < 0 || y < 0 || !Number.isFinite(x) || !Number.isFinite(y)) {
    console.warn('Invalid popup coordinates:', { x, y });
    x = 100;
    y = 100;
  }
  
  const popup = document.createElement('div');
  popup.className = 'tactical-popup';
  popup.style.cssText = `
    position: fixed;
    left: ${Math.max(10, x)}px;
    top: ${Math.max(10, y)}px;
    background: #16213e;
    border: 2px solid #ff0000;
    border-radius: 4px;
    padding: 12px;
    color: #eee;
    z-index: 99999;
    min-width: 200px;
    max-width: 300px;
    pointer-events: auto;
    overflow: visible;
    box-shadow: 0 0 20px rgba(0, 255, 255, 0.5);
  `;
  
  const titleEl = document.createElement('div');
  titleEl.style.cssText = `
    font-weight: bold;
    font-size: 16px;
    margin-bottom: 8px;
    color: #00ff00;
    border-bottom: 1px solid #ff0000;
    padding-bottom: 8px;
    text-transform: uppercase;
  `;
  titleEl.textContent = title;
  
  const contentEl = document.createElement('div');
  contentEl.style.cssText = `
    font-size: 12px;
    line-height: 1.6;
  `;
  contentEl.innerHTML = content;
  
  const closeBtn = document.createElement('button');
  closeBtn.style.cssText = `
    position: absolute;
    top: 4px;
    right: 4px;
    background: none;
    border: none;
    color: #888;
    cursor: pointer;
    font-size: 16px;
    line-height: 1;
  `;
  closeBtn.textContent = '×';
  closeBtn.addEventListener('click', closePopup);
  
  popup.appendChild(closeBtn);
  popup.appendChild(titleEl);
  popup.appendChild(contentEl);
  
  const container = document.getElementById('map-container');
  if (container) {
    container.appendChild(popup);
  }
  
  currentPopup = popup;
  
  document.addEventListener('click', handleOutsideClick);
  
  return popup;
}

function handleOutsideClick(e) {
  if (currentPopup && !currentPopup.contains(e.target)) {
    const trackItems = document.querySelectorAll('.track-item');
    let clickedTrack = false;
    trackItems.forEach(item => {
      if (item.contains(e.target)) {
        clickedTrack = true;
      }
    });
    
    if (!clickedTrack) {
      closePopup();
    }
  }
}

export function closePopup() {
  if (currentPopup) {
    currentPopup.remove();
    currentPopup = null;
  }
  document.removeEventListener('click', handleOutsideClick);
}

export function showTrackPopup(track, x, y) {
  console.log('showTrackPopup called:', track?.name, { x, y });
  const content = `
    <div><strong>Type:</strong> ${track.description}</div>
    <div><strong>Speed:</strong> ${track.speed} kts</div>
    <div><strong>Heading:</strong> ${track.heading}°</div>
  `;
  return showPopup(x, y, track.name, content);
}

export function showAircraftPopup(aircraft, x, y) {
  console.log('showAircraftPopup called:', aircraft?.callsign, { x, y });
  const affiliationColor = getAffiliationColor(aircraft.affiliation);
  const content = `
    <div style="margin-bottom: 8px;">
      <strong style="color: ${affiliationColor};">${aircraft.affiliation}</strong>
    </div>
    <div><strong>Callsign:</strong> ${aircraft.callsign}</div>
    <div><strong>ICAO24:</strong> <span style="font-family: monospace; font-size: 11px;">${aircraft.icao24}</span></div>
    <div><strong>Country:</strong> ${aircraft.originCountry}</div>
    <div><strong>Altitude:</strong> ${Math.round(aircraft.position.alt)}m</div>
    <div><strong>Speed:</strong> ${Math.round(aircraft.velocity / 0.514444)} kts</div>
    <div><strong>Heading:</strong> ${Math.round(aircraft.heading)}°</div>
  `;
  return showPopup(x, y, `Aircraft: ${aircraft.callsign}`, content);
}

function getAffiliationColor(affiliation) {
  switch (affiliation) {
    case 'HOSTILE': return '#ff0000';
    case 'FRIENDLY': return '#00ffff';
    case 'OWN_SHIP': return '#00ff00';
    default: return '#ffff00';
  }
}
