const diagnostics = {
  enabled: false,
  frameCount: 0,
  lastFrameTime: 0,
  fps: 0,
  fpsHistory: [],
  updateTimings: {},
  layerCounts: {},
  memoryUsage: 0,
  startTime: Date.now(),
  frameTimeHistory: [],
  maxHistoryLength: 60
};

export function initDiagnostics() {
  diagnostics.lastFrameTime = performance.now();
  diagnostics.startTime = Date.now();
  
  requestAnimationFrame(measureFrame);
  
  setInterval(() => {
    if (diagnostics.enabled) {
      logDiagnostics();
    }
  }, 5000);
}

function measureFrame(timestamp) {
  if (!diagnostics.enabled) {
    requestAnimationFrame(measureFrame);
    return;
  }
  
  const deltaTime = timestamp - diagnostics.lastFrameTime;
  diagnostics.lastFrameTime = timestamp;
  
  diagnostics.frameTimeHistory.push(deltaTime);
  if (diagnostics.frameTimeHistory.length > diagnostics.maxHistoryLength) {
    diagnostics.frameTimeHistory.shift();
  }
  
  if (diagnostics.frameCount % 30 === 0) {
    const avgFrameTime = diagnostics.frameTimeHistory.reduce((a, b) => a + b, 0) / diagnostics.frameTimeHistory.length;
    diagnostics.fps = Math.round(1000 / avgFrameTime);
    diagnostics.fpsHistory.push(diagnostics.fps);
    if (diagnostics.fpsHistory.length > 10) {
      diagnostics.fpsHistory.shift();
    }
  }
  
  diagnostics.frameCount++;
  requestAnimationFrame(measureFrame);
}

export function startTiming(name) {
  if (!diagnostics.enabled) return;
  diagnostics.updateTimings[name] = { start: performance.now(), end: null, duration: 0 };
}

export function endTiming(name) {
  if (!diagnostics.enabled || !diagnostics.updateTimings[name]) return;
  const timing = diagnostics.updateTimings[name];
  timing.end = performance.now();
  timing.duration = timing.end - timing.start;
}

export function updateLayerCount(layerName, count) {
  if (!diagnostics.enabled) return;
  diagnostics.layerCounts[layerName] = count;
}

export function toggleDiagnostics() {
  diagnostics.enabled = !diagnostics.enabled;
  console.log(`Diagnostics ${diagnostics.enabled ? 'enabled' : 'disabled'}`);
  if (diagnostics.enabled) {
    logDiagnostics();
  }
  return diagnostics.enabled;
}

export function isDiagnosticsEnabled() {
  return diagnostics.enabled;
}

export function getDiagnostics() {
  return {
    fps: diagnostics.fps,
    fpsHistory: diagnostics.fpsHistory,
    updateTimings: diagnostics.updateTimings,
    layerCounts: diagnostics.layerCounts,
    frameCount: diagnostics.frameCount,
    uptime: Date.now() - diagnostics.startTime
  };
}

function logDiagnostics() {
  console.log('=== Performance Diagnostics ===');
  console.log(`FPS: ${diagnostics.fps} (avg last 30 frames)`);
  console.log(`Frame Count: ${diagnostics.frameCount}`);
  console.log(`Uptime: ${Math.round((Date.now() - diagnostics.startTime) / 1000)}s`);
  
  console.log('\n=== Update Timings (ms) ===');
  Object.entries(diagnostics.updateTimings).forEach(([name, timing]) => {
    console.log(`${name}: ${timing.duration.toFixed(2)}ms`);
  });
  
  console.log('\n=== Layer Feature Counts ===');
  Object.entries(diagnostics.layerCounts).forEach(([layer, count]) => {
    console.log(`${layer}: ${count} features`);
  });
  
  const avgFps = diagnostics.fpsHistory.length > 0 
    ? (diagnostics.fpsHistory.reduce((a, b) => a + b, 0) / diagnostics.fpsHistory.length).toFixed(1)
    : 'N/A';
  console.log(`\nAverage FPS: ${avgFps}`);
  
  if (diagnostics.fps < 30) {
    console.warn('⚠️ LOW FPS DETECTED - Performance issues detected!');
  }
  if (diagnostics.layerCounts['aircraft2D'] > 300) {
    console.warn('⚠️ HIGH AIRCRAFT COUNT - Consider reducing visible aircraft');
  }
  console.log('=============================');
}

export function resetDiagnostics() {
  diagnostics.frameCount = 0;
  diagnostics.frameTimeHistory = [];
  diagnostics.fpsHistory = [];
  diagnostics.updateTimings = {};
  diagnostics.layerCounts = {};
  diagnostics.startTime = Date.now();
  console.log('Diagnostics reset');
}