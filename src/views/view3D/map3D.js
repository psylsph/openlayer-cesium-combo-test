import * as Cesium from 'cesium';
import { SCENARIO_LAT, SCENARIO_LON, GEOSERVER_URL } from '../../config.js';
import { getSimulatedAircraft } from '../../simulatedAircraft/aircraftGenerator.js';
import { getTracks } from '../../scenario/tracks.js';
import { showAircraftPopup } from '../../ui/popup.js';
import { showAircraftDetails } from '../../ui/sidebar.js';
import { showTrackDetails } from '../../ui/sidebar.js';

let viewer = null;

export function initMap3D(container, onClick) {
  viewer = new Cesium.Viewer(container, {
    baseLayerPicker: false,
    geocoder: false,
    homeButton: false,
    sceneModePicker: false,
    selectionIndicator: false,
    timeline: false,
    animation: false,
    navigationHelpButton: true,
    navigationInstructionsInitiallyVisible: false,
    scene3DOnly: false,
    shouldAnimate: false,
    requestRenderMode: false,
    maximumRenderTimeChange: Infinity
  });

  viewer.imageryLayers.removeAll();
  
  const geoserverLayer = new Cesium.WebMapServiceImageryProvider({
    url: GEOSERVER_URL + '/ows',
    layers: 'ne:countries',
    parameters: {
      format: 'image/png',
      transparent: 'true'
    }
  });
  
  viewer.imageryLayers.addImageryProvider(geoserverLayer);
  
  viewer.scene.globe.baseColor = Cesium.Color.fromCssColorString('#0d2137');
  
  viewer.scene.fog.enabled = true;
  viewer.scene.fog.density = 0.0002;
  viewer.scene.fog.minimumBrightness = 0.8;
  
  viewer.scene.skyAtmosphere.show = false;
  viewer.scene.skyBox.show = false;
  viewer.scene.backgroundColor = Cesium.Color.fromCssColorString('#0d2137');
  
  viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(SCENARIO_LON, SCENARIO_LAT, 200000),
    orientation: {
      heading: 0.0,
      pitch: -Cesium.Math.PI_OVER_FOUR,
      roll: 0.0
    },
    duration: 0
  });
  
  viewer.scene.screenSpaceCameraController.enableInputs = true;
  viewer.scene.screenSpaceCameraController.enableRotate = true;
  viewer.scene.screenSpaceCameraController.enableZoom = true;
  viewer.scene.screenSpaceCameraController.enableTilt = true;
  viewer.scene.screenSpaceCameraController.enableLook = true;
  viewer.scene.screenSpaceCameraController.minimumZoomDistance = 1000;
  viewer.scene.screenSpaceCameraController.maximumZoomDistance = 50000000;
  
  const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
  
  handler.setInputAction((movement) => {
    console.log('3D map clicked at pixel:', movement.position.x, movement.position.y);
    const pickedObject = viewer.scene.pick(movement.position);
    console.log('Picked object defined:', Cesium.defined(pickedObject));
    if (Cesium.defined(pickedObject) && pickedObject.id) {
      const entity = pickedObject.id;
      console.log('Entity type:', typeof entity);
      console.log('Entity keys:', Object.keys(entity));
      console.log('Entity trackId:', entity.trackId);
      console.log('Entity trackName:', entity.trackName);
      console.log('Entity icao24:', entity.icao24);
      
      if (entity.icao24) {
        const aircraft = getSimulatedAircraft().get(entity.icao24);
        if (aircraft) {
          showAircraftDetails(aircraft);
          return;
        }
      }
      if (entity.trackId && onClick) {
        console.log('Calling onClick with trackId:', entity.trackId);
        onClick({
          entity: entity,
          trackId: entity.trackId,
          trackName: entity.trackName,
          pixel: [movement.position.x, movement.position.y]
        });
      }
      
      // Always show track details in sidebar when track is selected
      if (entity.trackId) {
        const tracks = getTracks();
        const track = tracks.find(t => t.id === entity.trackId);
        if (track) {
          showTrackDetails(track);
        }
      }
    } else {
      console.log('No object picked - clicked on background');
    }
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
  
  return viewer;
}

export function getViewer3D() {
  return viewer;
}

export function isWebGLAvailable() {
  try {
    const canvas = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && 
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
  } catch (e) {
    return false;
  }
}

export function setCameraPosition(lon, lat, altitude, heading, pitch) {
  if (!viewer) return;
  
  viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(lon, lat, altitude),
    orientation: {
      heading: Cesium.Math.toRadians(heading || 0),
      pitch: Cesium.Math.toRadians(pitch || -90),
      roll: 0.0
    },
    duration: 0
  });
}

export function getCameraPosition() {
  if (!viewer) return null;
  
  const pos = viewer.camera.positionCartographic;
  return {
    lon: Cesium.Math.toDegrees(pos.longitude),
    lat: Cesium.Math.toDegrees(pos.latitude),
    altitude: pos.height,
    heading: Cesium.Math.toDegrees(viewer.camera.heading),
    pitch: Cesium.Math.toDegrees(viewer.camera.pitch)
  };
}

export function followEntity(entity, offset = 50000) {
  if (!viewer || !entity) return;
  
  const position = entity.position.getValue(viewer.clock.currentTime);
  if (!position) return;
  
  const offsetPosition = Cesium.Cartesian3.add(
    position,
    new Cesium.Cartesian3(0, 0, offset),
    new Cesium.Cartesian3()
  );
  
  viewer.camera.lookAt(offsetPosition, new Cesium.Cartesian3(0, 0, 0));
}

export function stopFollowing() {
  if (!viewer) return;
  viewer.camera.lookAtTransform(Cesium.Matrix4.IDENTITY);
}
