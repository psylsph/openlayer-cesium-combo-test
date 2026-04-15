import * as Cesium from 'cesium';
import { getDataUri } from '../../symbol/symbolRenderer.js';
import { getTracks, calculatePosition } from '../../scenario/tracks.js';
import { SYMBOL_SIZE } from '../../config.js';

let entityCollection = null;
let trackEntities = new Map();
let viewer = null;

export function initTrackLayer3D(viewerParam) {
  viewer = viewerParam;
  entityCollection = viewer.entities;
  return entityCollection;
}

export function createTrackEntity(track, elapsedSeconds = 0) {
  const pos = calculatePosition(track, elapsedSeconds);
  const result = getDataUri(track.sidc, track.heading, SYMBOL_SIZE, track.affiliation);
  const { canvas, centerOffsetX, centerOffsetY } = result;
  
  const altitude = pos.alt || 0;
  const position = Cesium.Cartesian3.fromDegrees(pos.lon, pos.lat, altitude);
  const groundPosition = Cesium.Cartesian3.fromDegrees(pos.lon, pos.lat, 0);
  
  const entity = entityCollection.add({
    id: track.id,
    position: position,
    billboard: {
      image: canvas,
      verticalOrigin: Cesium.VerticalOrigin.CENTER,
      horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
      pixelOffset: new Cesium.Cartesian2(centerOffsetX, centerOffsetY),
      scale: 1.0,
      heightReference: Cesium.HeightReference.NONE,
      disableDepthTestDistance: Number.POSITIVE_INFINITY,
      eyeOffset: new Cesium.Cartesian3(0, 0, 0),
      trackId: track.id,
      trackName: track.name
    }
  });
  
  let leadLine = null;
  if (altitude > 100) {
    leadLine = entityCollection.add({
      id: `${track.id}_leadline`,
      polyline: {
        positions: [groundPosition, position],
        width: 2,
        material: getLeadLineColor(track.affiliation),
        disableDepthTestDistance: Number.POSITIVE_INFINITY
      }
    });
  }
  
  return { entity, leadLine };
}

export function updateTrackPositions3D(elapsedSeconds) {
  if (!entityCollection) return;
  
  const tracks = getTracks();
  
  tracks.forEach(track => {
    let data = trackEntities.get(track.id);
    
    if (!data) {
      data = createTrackEntity(track, elapsedSeconds);
      trackEntities.set(track.id, data);
    } else {
      const pos = calculatePosition(track, elapsedSeconds);
      const altitude = pos.alt || 0;
      const airPosition = Cesium.Cartesian3.fromDegrees(pos.lon, pos.lat, altitude);
      
      data.entity.position = airPosition;
      
      if (data.leadLine) {
        const groundPosition = Cesium.Cartesian3.fromDegrees(pos.lon, pos.lat, 0);
        if (altitude > 100) {
          data.leadLine.polyline.positions = [groundPosition, airPosition];
          data.leadLine.show = true;
        } else {
          data.leadLine.show = false;
        }
      }
    }
  });
}

export function setBillboardStyle(trackId, isSelected) {
  const data = trackEntities.get(trackId);
  if (!data || !data.entity.billboard) return;

  data.entity.billboard.scale = isSelected ? 1.2 : 1.0;
}

export function getBillboardById(trackId) {
  const data = trackEntities.get(trackId);
  return data ? data.entity.billboard : null;
}

export function clearBillboards() {
  if (viewer) {
    trackEntities.forEach((data, trackId) => {
      if (data.leadLine) {
        entityCollection.remove(data.leadLine);
      }
      entityCollection.remove(data.entity);
    });
  }
  trackEntities.clear();
}

export function updateBillboardImage(trackId, sidc, heading) {
  const data = trackEntities.get(trackId);
  if (!data || !data.entity.billboard) return;
  
  const result = getDataUri(sidc, heading, SYMBOL_SIZE);
  const { canvas, centerOffsetX, centerOffsetY } = result;
  
  data.entity.billboard.image = canvas;
  data.entity.billboard.pixelOffset = new Cesium.Cartesian2(centerOffsetX, centerOffsetY);
}

function getLeadLineColor(affiliation) {
  switch (affiliation) {
    case 'HOSTILE': return Cesium.Color.fromCssColorString('rgba(255, 0, 0, 0.6)');
    case 'FRIENDLY': return Cesium.Color.fromCssColorString('rgba(0, 255, 255, 0.6)');
    case 'OWN_SHIP': return Cesium.Color.fromCssColorString('rgba(0, 255, 0, 0.6)');
    case 'UNKNOWN': return Cesium.Color.fromCssColorString('rgba(255, 255, 0, 0.6)');
    default: return Cesium.Color.fromCssColorString('rgba(255, 255, 255, 0.6)');
  }
}