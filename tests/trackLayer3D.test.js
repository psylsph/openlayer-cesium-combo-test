import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as Cesium from 'cesium';
import { initTrackLayer3D, createTrackEntity } from '../src/views/view3D/trackLayer3D.js';
import { getTracks } from '../src/scenario/tracks.js';

vi.mock('../src/symbol/symbolRenderer.js', () => ({
  getDataUri: vi.fn().mockReturnValue({ canvas: document.createElement('canvas'), centerOffsetX: 0, centerOffsetY: 0 })
}));

describe('trackLayer3D', () => {
  let mockViewer;
  let mockEntityCollection;

  beforeEach(() => {
    mockEntityCollection = {
      add: vi.fn().mockImplementation((entityDef) => {
        return entityDef;
      }),
      remove: vi.fn(),
      values: []
    };

    mockViewer = {
      entities: mockEntityCollection
    };
    
    initTrackLayer3D(mockViewer);
  });

  it('should initialize and return entity collection', () => {
    const collection = initTrackLayer3D(mockViewer);
    expect(collection).toBe(mockEntityCollection);
  });

  it('should create track entity with HeightReference.NONE and disabled depth test', () => {
    const track = getTracks()[0];
    const { entity } = createTrackEntity(track, 0);
    
    expect(mockEntityCollection.add).toHaveBeenCalled();
    expect(entity.billboard).toBeDefined();
    
    // Verify properties added to prevent symbol clipping at high tilt angles
    expect(entity.billboard.heightReference).toBe(Cesium.HeightReference.NONE);
    expect(entity.billboard.disableDepthTestDistance).toBe(Number.POSITIVE_INFINITY);
    expect(entity.billboard.verticalOrigin).toBe(Cesium.VerticalOrigin.CENTER);
    expect(entity.billboard.horizontalOrigin).toBe(Cesium.HorizontalOrigin.CENTER);
  });
});
