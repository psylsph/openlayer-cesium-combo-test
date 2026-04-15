import { describe, it, expect } from 'vitest';

describe('Timeline Module Exports', () => {
  it('should export initTimeline function', () => {
    const timeline = require('../src/scenario/timeline.js');
    expect(typeof timeline.initTimeline).toBe('function');
  });

  it('should export startAnimation function', () => {
    const timeline = require('../src/scenario/timeline.js');
    expect(typeof timeline.startAnimation).toBe('function');
  });

  it('should export pauseAnimation function', () => {
    const timeline = require('../src/scenario/timeline.js');
    expect(typeof timeline.pauseAnimation).toBe('function');
  });

  it('should export resetAnimation function', () => {
    const timeline = require('../src/scenario/timeline.js');
    expect(typeof timeline.resetAnimation).toBe('function');
  });

  it('should export getElapsedTime function', () => {
    const timeline = require('../src/scenario/timeline.js');
    expect(typeof timeline.getElapsedTime).toBe('function');
  });

  it('should export formatTime function', () => {
    const timeline = require('../src/scenario/timeline.js');
    expect(typeof timeline.formatTime).toBe('function');
  });
});