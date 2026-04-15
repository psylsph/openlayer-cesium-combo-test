import { initMap2D, updateCoordinateReadout, setCenter as setCenter2D, getCenter as getCenter2D, getZoom, getMap2D } from './views/view2D/map2D.js';
import { initTrackLayer2D, updateTrackPositions2D, setTrackStyle } from './views/view2D/trackLayer2D.js';
import { initOwnShipLayer2D, updateOwnShip2D } from './views/view2D/ownShip2D.js';
import { initMap3D, isWebGLAvailable, setCameraPosition } from './views/view3D/map3D.js';
import { initTrackLayer3D, updateTrackPositions3D, setBillboardStyle } from './views/view3D/trackLayer3D.js';
import { initOwnShipLayer3D, updateOwnShip3D } from './views/view3D/ownShip3D.js';
import { initViewSync, toggleView, getCurrentView, switchTo2D, switchTo3D } from './views/viewSync.js';
import { initToolbar, updateViewButtons, updateTimelineDisplay, hideProjectionSelector, showProjectionSelector, updateAircraftCount } from './ui/toolbar.js';
import { initSidebar, selectTrack, clearSelection, getSelectedTrackId, showTrackDetails } from './ui/sidebar.js';
import { showTrackPopup, closePopup } from './ui/popup.js';
import { initTimeline, startAnimation, pauseAnimation, resetAnimation, getElapsedTime, isAnimating } from './scenario/timeline.js';
import { getTracks, getTrackById, calculatePosition, AFFILIATIONS } from './scenario/tracks.js';
import { SCENARIO_LAT, SCENARIO_LON, DEFAULT_PROJECTION } from './config.js';
import { generateSimulatedAircraft, updateSimulatedAircraftPositions, getSimulatedAircraftCount } from './simulatedAircraft/aircraftGenerator.js';
import { initAircraftLayer2D, updateAircraftPositions2D, setMaxVisibleAircraft as setMaxVisible2D } from './simulatedAircraft/aircraftLayer2D.js';
import { initAircraftLayer3D, updateAircraftPositions3D, setMaxVisibleAircraft as setMaxVisible3D } from './simulatedAircraft/aircraftLayer3D.js';
import { toLonLat } from 'ol/proj.js';
import { initDiagnostics, startTiming, endTiming, updateLayerCount, isDiagnosticsEnabled } from './diagnostics/performance.js';

let selectedTrackId = null;
let followingTrack = null;
let deadReckoningInterval = null;

function onAnimationTick(elapsedSeconds) {
  if (isDiagnosticsEnabled()) startTiming('track2D');
  updateTrackPositions2D(elapsedSeconds);
  if (isDiagnosticsEnabled()) endTiming('track2D');
  
  if (isDiagnosticsEnabled()) startTiming('track3D');
  updateTrackPositions3D(elapsedSeconds);
  if (isDiagnosticsEnabled()) endTiming('track3D');
  
  if (isDiagnosticsEnabled()) startTiming('ownShip');
  updateOwnShip2D(elapsedSeconds);
  updateOwnShip3D(elapsedSeconds);
  if (isDiagnosticsEnabled()) endTiming('ownShip');
  
  if (isDiagnosticsEnabled()) startTiming('aircraft');
  updateAircraftPositions2D();
  updateAircraftPositions3D();
  if (isDiagnosticsEnabled()) endTiming('aircraft');
  
  updateTimelineDisplay(elapsedSeconds);
  updateAircraftCount(getSimulatedAircraftCount());
  
  updateLayerCount('tracks', getTracks().length);
  updateLayerCount('aircraft2D', getSimulatedAircraftCount());
  
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
  console.log('handleMapClick:', clickData);
  const tracks = getTracks();
  let clickedTrack = null;
  
  if (clickData.trackId) {
    clickedTrack = tracks.find(t => t.id === clickData.trackId);
  } else if (clickData.lon !== undefined && clickData.lat !== undefined) {
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
  }
  
  if (clickedTrack) {
    console.log('Clicked track:', clickedTrack.name);
    const x = clickData.pixel ? clickData.pixel[0] : 100;
    const y = clickData.pixel ? clickData.pixel[1] : 100;
    showTrackPopup(clickedTrack, x, y);
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
  
  initDiagnostics();
  
  const map2dContainer = document.getElementById('map2d');
  const map3dContainer = document.getElementById('map3d');
  
  initMap2D(map2dContainer, handleMapClick);
  initTrackLayer2D(getMap2D(), onTrackSelect);
  initOwnShipLayer2D(getMap2D());
  initAircraftLayer2D(getMap2D());
  
  if (isWebGLAvailable()) {
    const viewer = initMap3D(map3dContainer, handleMapClick);
    initTrackLayer3D(viewer);
    initOwnShipLayer3D(viewer);
    initAircraftLayer3D(viewer);
  }
  
  initViewSync(onViewChange);
  initTimeline(onAnimationTick);
  initToolbar(() => toggleView(), null, null, null);
  initSidebar(onTrackSelect);
  
  startDeadReckoningLoop();
  
  onAnimationTick(0);
  
  setCenter2D(SCENARIO_LON, SCENARIO_LAT, 10);
  
  setTimeout(() => {
    try {
      const map2D = getMap2D();
      const view = map2D.getView();
      const extent = view.calculateExtent(map2D.getSize());
      
      const projection = view.getProjection();
      const transformedExtent = extent;
      
      if (projection.getCode() === 'EPSG:3857') {
        const [minX, minY, maxX, maxY] = extent;
        const minLonLat = toLonLat([minX, minY]);
        const maxLonLat = toLonLat([maxX, maxY]);
        
        transformedExtent[0] = minLonLat[0];
        transformedExtent[1] = minLonLat[1];
        transformedExtent[2] = maxLonLat[0];
        transformedExtent[3] = maxLonLat[1];
      }
      
      const bounds = {
        south: transformedExtent[1],
        north: transformedExtent[3],
        west: transformedExtent[0],
        east: transformedExtent[2]
      };
      
      //console.log('Generating 500 aircraft with lat/lon bounds:', bounds);
      generateSimulatedAircraft(1000, bounds);
      
      // Set initial aircraft limits based on defaults
      setMaxVisible2D(1000);
      setMaxVisible3D(1000);
      
      console.log('Aircraft generation complete. Total aircraft:', getSimulatedAircraftCount());
    } catch (error) {
      console.error('Error generating aircraft:', error);
    }
  }, 1000);
  
  if (!isWebGLAvailable()) {
    switchTo2D();
  }
}

function startDeadReckoningLoop() {
  if (deadReckoningInterval) {
    clearInterval(deadReckoningInterval);
  }
  deadReckoningInterval = setInterval(() => {
    updateSimulatedAircraftPositions(1000);
  }, 1000);
}

document.addEventListener('DOMContentLoaded', init);
