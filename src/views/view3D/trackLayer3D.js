import * as Cesium from 'cesium';
import { getDataUri, clearCache as clearSymbolCache } from '../../symbol/symbolRenderer.js';
import { getTracks, calculatePosition } from '../../scenario/tracks.js';
import { SYMBOL_SIZE } from '../../config.js';

let billboardCollection = null;
let billboards = new Map();
let viewer = null;

export function initTrackLayer3D(viewerParam) {
  viewer = viewerParam;
  billboardCollection = viewer.scene.primitives.add(new Cesium.BillboardCollection());
  return billboardCollection;
}

export function createTrackBillboard(track) {
  const result = getDataUri(track.sidc, track.heading, SYMBOL_SIZE, track.affiliation);
  const { canvas, centerOffsetX, centerOffsetY } = result;
  
  const altitude = track.startAlt || 0;
  
  const position = Cesium.Cartesian3.fromDegrees(track.startLon, track.startLat, altitude);
  const groundPosition = Cesium.Cartesian3.fromDegrees(track.startLon, track.startLat, 0);
  
  const billboard = billboardCollection.add({
    id: track.id,
    image: canvas,
    position: position,
    verticalOrigin: Cesium.VerticalOrigin.CENTER,
    horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
    pixelOffset: new Cesium.Cartesian2(centerOffsetX, centerOffsetY),
    scale: 0.8,
    heightReference: Cesium.HeightReference.NONE,
    disableDepthTestDistance: Number.POSITIVE_INFINITY,
    trackId: track.id,
    trackName: track.name
  });
  
  let leadLine = null;
  if (altitude > 100) {
    leadLine = viewer.entities.add({
      id: `${track.id}_leadline`,
      polyline: {
        positions: [groundPosition, position],
        width: 2,
        material: getLeadLineColor(track.affiliation),
        clampToGround: false
      }
    });
  }
  
  return { billboard, leadLine };
}

export function updateTrackPositions3D(elapsedSeconds) {
  if (!billboardCollection) return;
  
  const tracks = getTracks();
  
  tracks.forEach(track => {
    const pos = calculatePosition(track, elapsedSeconds);
    let data = billboards.get(track.id);
    
    if (!data) {
      data = createTrackBillboard(track);
      billboards.set(track.id, data);
    }
    
    const altitude = pos.alt || 0;
    const airPosition = Cesium.Cartesian3.fromDegrees(pos.lon, pos.lat, altitude);
    const groundPosition = Cesium.Cartesian3.fromDegrees(pos.lon, pos.lat, 0);
    
    data.billboard.position = airPosition;
    
    if (data.leadLine) {
      if (altitude > 100) {
        data.leadLine.polyline.positions = [groundPosition, airPosition];
        data.leadLine.show = true;
      } else {
        data.leadLine.show = false;
      }
    }
  });
}

export function setBillboardStyle(trackId, isSelected) {
  const data = billboards.get(trackId);
  if (!data) return;
  
  data.billboard.scale = isSelected ? 1.2 : 1.0;
}

export function getBillboardById(trackId) {
  const data = billboards.get(trackId);
  return data ? data.billboard : null;
}

export function clearBillboards() {
  if (viewer) {
    billboards.forEach((data, trackId) => {
      if (data.leadLine) {
        viewer.entities.remove(data.leadLine);
      }
    });
  }
  if (billboardCollection) {
    billboardCollection.removeAll();
  }
  billboards.clear();
}

export function updateBillboardImage(trackId, sidc, heading) {
  const data = billboards.get(trackId);
  if (!data) return;
  
  const result = getDataUri(sidc, heading, SYMBOL_SIZE);
  const { canvas, centerOffsetX, centerOffsetY } = result;
  
  data.billboard.image = canvas;
  data.billboard.pixelOffset = new Cesium.Cartesian2(centerOffsetX, centerOffsetY);
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
