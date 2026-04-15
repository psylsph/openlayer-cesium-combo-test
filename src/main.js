import { initMap2D, updateCoordinateReadout, setCenter as setCenter2D, getCenter as getCenter2D, getZoom, getMap2D } from './views/view2D/map2D.js';
import { initTrackLayer2D, updateTrackPositions2D, setTrackStyle } from './views/view2D/trackLayer2D.js';
import { initOwnShipLayer2D, updateOwnShip2D } from './views/view2D/ownShip2D.js';
import { initMap3D, isWebGLAvailable, setCameraPosition } from './views/view3D/map3D.js';
import { initTrackLayer3D, updateTrackPositions3D, setBillboardStyle } from './views/view3D/trackLayer3D.js';
import { initOwnShipLayer3D, updateOwnShip3D } from './views/view3D/ownShip3D.js';
import { initViewSync, toggleView, getCurrentView, switchTo2D, switchTo3D } from './views/viewSync.js';
import { initToolbar, updateViewButtons, updateTimelineDisplay, hideProjectionSelector, showProjectionSelector } from './ui/toolbar.js';
import { initSidebar, selectTrack, clearSelection, getSelectedTrackId } from './ui/sidebar.js';
import { showTrackPopup, closePopup } from './ui/popup.js';
import { initTimeline, startAnimation, pauseAnimation, resetAnimation, getElapsedTime, isAnimating } from './scenario/timeline.js';
import { getTracks, getTrackById, calculatePosition, AFFILIATIONS } from './scenario/tracks.js';
import { SCENARIO_LAT, SCENARIO_LON, DEFAULT_PROJECTION } from './config.js';

let selectedTrackId = null;
let followingTrack = null;

function onAnimationTick(elapsedSeconds) {
  updateTrackPositions2D(elapsedSeconds);
  updateTrackPositions3D(elapsedSeconds);
  updateOwnShip2D(elapsedSeconds);
  updateOwnShip3D(elapsedSeconds);
  updateTimelineDisplay(elapsedSeconds);
  
  if (followingTrack) {
    const track = getTrackById(followingTrack);
    if (track) {
      const pos = calculatePosition(track, elapsedSeconds);
      const view = getCurrentView();
      if (view === '2D') {
        setCenter2D(pos.lon, pos.lat, getZoom());
      } else {
        setCameraPosition(pos.lon, pos.lat, 50000, 0, -90);
      }
    }
  }
  
  updateCoordinateReadoutFromTrack();
}

function updateCoordinateReadoutFromTrack() {
  const track = getTrackById('defender');
  if (!track) return;
  
  const elapsed = getElapsedTime();
  const pos = calculatePosition(track, elapsed);
  updateCoordinateReadout(pos);
}

function onTrackSelect(trackId) {
  if (selectedTrackId === trackId) {
    if (followingTrack === trackId) {
      followingTrack = null;
    } else {
      followingTrack = trackId;
    }
  } else {
    selectedTrackId = trackId;
    followingTrack = trackId;
  }
  
  const tracks = getTracks();
  tracks.forEach(t => {
    const isSelected = t.id === selectedTrackId;
    setTrackStyle(t.id, isSelected);
    setBillboardStyle(t.id, isSelected);
  });
}

function onViewChange(view) {
  if (view === '2D') {
    showProjectionSelector();
  } else {
    hideProjectionSelector();
  }
  
  const tracks = getTracks();
  tracks.forEach(t => {
    const isSelected = t.id === selectedTrackId;
    setTrackStyle(t.id, isSelected);
    setBillboardStyle(t.id, isSelected);
  });
}

function handleMapClick(clickData) {
  const tracks = getTracks();
  let clickedTrack = null;
  
  tracks.forEach(track => {
    const elapsed = getElapsedTime();
    const pos = calculatePosition(track, elapsed);
    const dist = Math.sqrt(
      Math.pow(clickData.lon - pos.lon, 2) + 
      Math.pow(clickData.lat - pos.lat, 2)
    );
    
    if (dist < 0.01) {
      clickedTrack = track;
    }
  });
  
  if (clickedTrack) {
    showTrackPopup(clickedTrack, clickData.pixel[0], clickData.pixel[1]);
    selectTrack(clickedTrack.id);
    onTrackSelect(clickedTrack.id);
  } else {
    closePopup();
  }
}

async function init() {
  if (!isWebGLAvailable()) {
    console.warn('WebGL not available, defaulting to 2D view');
  }
  
  const map2dContainer = document.getElementById('map2d');
  const map3dContainer = document.getElementById('map3d');
  
  initMap2D(map2dContainer, handleMapClick);
  initTrackLayer2D(getMap2D());
  initOwnShipLayer2D(getMap2D());
  
  if (isWebGLAvailable()) {
    const viewer = initMap3D(map3dContainer, handleMapClick);
    initTrackLayer3D(viewer);
    initOwnShipLayer3D(viewer);
  }
  
  initViewSync(onViewChange);
  initTimeline(onAnimationTick);
  initToolbar(() => toggleView(), null, null, null);
  initSidebar(onTrackSelect);
  
  onAnimationTick(0);
  
  setCenter2D(SCENARIO_LON, SCENARIO_LAT, 10);
  
  if (!isWebGLAvailable()) {
    switchTo2D();
  }
}

document.addEventListener('DOMContentLoaded', init);
