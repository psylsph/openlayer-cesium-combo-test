let currentPopup = null;

export function showPopup(x, y, title, content) {
  closePopup();
  
  const popup = document.createElement('div');
  popup.className = 'tactical-popup';
  popup.style.cssText = `
    position: absolute;
    left: ${x}px;
    top: ${y}px;
    background: rgba(22, 33, 62, 0.95);
    border: 1px solid #4fc3f7;
    border-radius: 4px;
    padding: 12px;
    color: #eee;
    z-index: 1000;
    min-width: 200px;
    max-width: 300px;
  `;
  
  const titleEl = document.createElement('div');
  titleEl.style.cssText = `
    font-weight: 600;
    font-size: 14px;
    margin-bottom: 8px;
    color: #4fc3f7;
    border-bottom: 1px solid #333;
    padding-bottom: 8px;
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
  const content = `
    <div><strong>Type:</strong> ${track.description}</div>
    <div><strong>Speed:</strong> ${track.speed} kts</div>
    <div><strong>Heading:</strong> ${track.heading}°</div>
  `;
  return showPopup(x, y, track.name, content);
}
