import { describe, it, expect } from 'vitest';

describe('Popup Module Exports', () => {
  it('should export showPopup function', () => {
    const popup = require('../src/ui/popup.js');
    expect(typeof popup.showPopup).toBe('function');
  });

  it('should export closePopup function', () => {
    const popup = require('../src/ui/popup.js');
    expect(typeof popup.closePopup).toBe('function');
  });

  it('should export showTrackPopup function', () => {
    const popup = require('../src/ui/popup.js');
    expect(typeof popup.showTrackPopup).toBe('function');
  });

  it('should export showAircraftPopup function', () => {
    const popup = require('../src/ui/popup.js');
    expect(typeof popup.showAircraftPopup).toBe('function');
  });
});