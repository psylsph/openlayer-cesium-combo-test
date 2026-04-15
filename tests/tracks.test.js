import { describe, it, expect } from 'vitest';
import { getTracks, calculatePosition, getTrackById } from '../src/scenario/tracks.js';

describe('Tracks Module', () => {
  describe('getTracks', () => {
    it('should return an array of tracks', () => {
      const tracks = getTracks();
      expect(tracks).toBeInstanceOf(Array);
      expect(tracks.length).toBeGreaterThan(0);
    });

    it('should return tracks with all required properties', () => {
      const tracks = getTracks();
      tracks.forEach(track => {
        expect(track).toHaveProperty('id');
        expect(track).toHaveProperty('name');
        expect(track).toHaveProperty('type');
        expect(track).toHaveProperty('affiliation');
        expect(track).toHaveProperty('sidc');
        expect(track).toHaveProperty('speed');
        expect(track).toHaveProperty('startLat');
        expect(track).toHaveProperty('startLon');
        expect(track).toHaveProperty('heading');
      });
    });
  });

  describe('getTrackById', () => {
    it('should return a track by id', () => {
      const track = getTrackById('defender');
      expect(track).toBeDefined();
      expect(track.id).toBe('defender');
      expect(track.name).toBe('HMS Defender');
    });

    it('should return undefined for unknown id', () => {
      const track = getTrackById('nonexistent');
      expect(track).toBeUndefined();
    });
  });

  describe('calculatePosition', () => {
    it('should return starting position at time 0', () => {
      const track = getTracks()[0];
      const pos = calculatePosition(track, 0);
      expect(pos).toHaveProperty('lat');
      expect(pos).toHaveProperty('lon');
      expect(pos.lat).toBe(track.startLat);
      expect(pos.lon).toBe(track.startLon);
    });

    it('should return position with altitude', () => {
      const track = getTracks()[0];
      const pos = calculatePosition(track, 0);
      expect(pos).toHaveProperty('alt');
    });

    it('should move position after elapsed time', () => {
      const track = getTracks()[0];
      const pos0 = calculatePosition(track, 0);
      const pos60 = calculatePosition(track, 60);
      expect(pos60.lat).not.toBe(pos0.lat);
    });
  });
});