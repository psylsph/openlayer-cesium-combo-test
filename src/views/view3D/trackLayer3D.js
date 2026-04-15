import * as Cesium from 'cesium';
import { getDataUri, clearCache as clearSymbolCache } from '../../symbol/symbolRenderer.js';
import { getTracks, calculatePosition } from '../../scenario/tracks.js';
import { SYMBOL_SIZE } from '../../config.js';

let billboardCollection = null;
let billboards = new Map();

export function initTrackLayer3D(viewer) {
  billboardCollection = viewer.scene.primitives.add(new Cesium.BillboardCollection());
  return billboardCollection;
}

export function createTrackBillboard(track) {
  const result = getDataUri(track.sidc, track.heading, SYMBOL_SIZE);
  const { canvas, centerOffsetX, centerOffsetY } = result;
  
  const billboard = billboardCollection.add({
    id: track.id,
    image: canvas,
    position: Cesium.Cartesian3.fromDegrees(track.startLon, track.startLat),
    verticalOrigin: Cesium.VerticalOrigin.CENTER,
    horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
    pixelOffset: new Cesium.Cartesian2(centerOffsetX, centerOffsetY),
    scale: 1.0,
    trackId: track.id,
    trackName: track.name
  });
  
  return billboard;
}

export function updateTrackPositions3D(elapsedSeconds) {
  if (!billboardCollection) return;
  
  const tracks = getTracks();
  
  tracks.forEach(track => {
    const pos = calculatePosition(track, elapsedSeconds);
    let billboard = billboards.get(track.id);
    
    if (!billboard) {
      billboard = createTrackBillboard(track);
      billboards.set(track.id, billboard);
    }
    
    billboard.position = Cesium.Cartesian3.fromDegrees(pos.lon, pos.lat);
  });
}

export function setBillboardStyle(trackId, isSelected) {
  const billboard = billboards.get(trackId);
  if (!billboard) return;
  
  billboard.scale = isSelected ? 1.2 : 1.0;
}

export function getBillboardById(trackId) {
  return billboards.get(trackId);
}

export function clearBillboards() {
  if (billboardCollection) {
    billboardCollection.removeAll();
  }
  billboards.clear();
}

export function updateBillboardImage(trackId, sidc, heading) {
  const billboard = billboards.get(trackId);
  if (!billboard) return;
  
  const result = getDataUri(sidc, heading, SYMBOL_SIZE);
  const { canvas, centerOffsetX, centerOffsetY } = result;
  
  billboard.image = canvas;
  billboard.pixelOffset = new Cesium.Cartesian2(centerOffsetX, centerOffsetY);
}
