const SCENARIO_DURATION = 120;
let animationId = null;
let startTime = null;
let elapsedTime = 0;
let onTickCallback = null;

export function initTimeline(onTick) {
  onTickCallback = onTick;
  startAnimation();
}

export function startAnimation() {
  if (animationId) return;
  
  startTime = Date.now() - (elapsedTime * 1000);
  
  function tick() {
    const elapsed = (Date.now() - startTime) / 1000;
    elapsedTime = elapsed;
    
    if (elapsed >= SCENARIO_DURATION) {
      startTime = Date.now();
    }
    
    if (onTickCallback) {
      onTickCallback(elapsed);
    }
    
    animationId = requestAnimationFrame(tick);
  }
  
  animationId = requestAnimationFrame(tick);
}

export function pauseAnimation() {
  if (animationId) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }
}

export function resetAnimation() {
  pauseAnimation();
  elapsedTime = 0;
  startTime = Date.now();
  if (onTickCallback) {
    onTickCallback(0);
  }
  startAnimation();
}

export function getElapsedTime() {
  return elapsedTime;
}

export function isAnimating() {
  return animationId !== null;
}

export function getDuration() {
  return SCENARIO_DURATION;
}

export function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}
