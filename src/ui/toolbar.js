import { getCurrentView, toggleView } from '../views/viewSync.js';
import { switchProjection, getCurrentProjection } from '../views/view2D/projection.js';
import { startAnimation, pauseAnimation, resetAnimation, isAnimating, formatTime, getElapsedTime } from '../scenario/timeline.js';
import { toggleDiagnostics, isDiagnosticsEnabled } from '../diagnostics/performance.js';

export function initToolbar(onViewToggle, onProjectionChange, onPlayPause, onReset) {
  const btnView2d = document.getElementById('btn-view-2d');
  const btnView3d = document.getElementById('btn-view-3d');
  const projectionSelect = document.getElementById('projection-select');
  const btnPlay = document.getElementById('btn-play');
  const btnReset = document.getElementById('btn-reset');
  const aircraftLimit = document.getElementById('aircraft-limit');
  
  if (btnView2d && btnView3d) {
    btnView2d.addEventListener('click', () => {
      const view = getCurrentView();
      if (view !== '2D') {
        toggleView();
        updateViewButtons();
      }
    });
    
    btnView3d.addEventListener('click', () => {
      const view = getCurrentView();
      if (view !== '3D') {
        toggleView();
        updateViewButtons();
      }
    });
  }
  
  if (projectionSelect) {
    projectionSelect.addEventListener('change', (e) => {
      const projCode = e.target.value;
      switchProjection(projCode);
      if (onProjectionChange) {
        onProjectionChange(projCode);
      }
    });
  }
  
  if (btnPlay) {
    btnPlay.addEventListener('click', () => {
      if (isAnimating()) {
        pauseAnimation();
        btnPlay.textContent = 'Play';
        btnPlay.classList.remove('playing');
      } else {
        startAnimation();
        btnPlay.textContent = 'Pause';
        btnPlay.classList.add('playing');
      }
      if (onPlayPause) {
        onPlayPause();
      }
    });
  }
  
  if (btnReset) {
    btnReset.addEventListener('click', () => {
      resetAnimation();
      if (btnPlay) {
        btnPlay.textContent = 'Play';
        btnPlay.classList.remove('playing');
      }
      if (onReset) {
        onReset();
      }
    });
  }
  
  if (aircraftLimit) {
    aircraftLimit.addEventListener('change', (e) => {
      const limit = parseInt(e.target.value);
      updateAircraftLimit(limit);
    });
  }
  
  const btnDiagnostics = document.getElementById('btn-diagnostics');
  if (btnDiagnostics) {
    btnDiagnostics.addEventListener('click', () => {
      toggleDiagnostics();
      btnDiagnostics.classList.toggle('active', isDiagnosticsEnabled());
    });
  }
}

export function updateViewButtons() {
  const view = getCurrentView();
  const btnView2d = document.getElementById('btn-view-2d');
  const btnView3d = document.getElementById('btn-view-3d');
  
  if (btnView2d && btnView3d) {
    if (view === '2D') {
      btnView2d.classList.add('active');
      btnView3d.classList.remove('active');
    } else {
      btnView2d.classList.remove('active');
      btnView3d.classList.add('active');
    }
  }
}

export function updateTimelineDisplay(elapsedSeconds) {
  const display = document.getElementById('timeline-display');
  if (display) {
    display.textContent = formatTime(elapsedSeconds);
  }
}

export function setProjectionDropdown(projCode) {
  const select = document.getElementById('projection-select');
  if (select) {
    select.value = projCode;
  }
}

export function hideProjectionSelector() {
  const group = document.getElementById('projection-group');
  if (group) {
    group.style.display = 'none';
  }
}

export function showProjectionSelector() {
  const group = document.getElementById('projection-group');
  if (group) {
    group.style.display = 'flex';
  }
}

export function updateAircraftCount(count) {
  const indicator = document.getElementById('aircraft-count');
  if (indicator) {
    indicator.textContent = `● ${count}`;
  }
}

export function updateAircraftLimit(count) {
  // This would be implemented to update the aircraft layer limits
  console.log('Aircraft limit changed to:', count);
}
