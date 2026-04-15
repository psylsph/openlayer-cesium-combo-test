const SCENARIO_DURATION = 120;
let animationId = null;
let startTime = null;
let pausedTime = 0;
let isPlaying = false;
let onTickCallback = null;

export function initTimeline(onTick) {
  onTickCallback = onTick;
  resetAnimation();
}

export function startAnimation() {
  if (isPlaying) return;
  
  isPlaying = true;
  startTime = Date.now() - pausedTime;
  
  function tick() {
    if (!isPlaying) return;
    
    const elapsed = (Date.now() - startTime) / 1000;
    pausedTime = elapsed * 1000;
    
    if (elapsed >= SCENARIO_DURATION) {
      resetAnimation();
      startAnimation();
      return;
    }
    
    if (onTickCallback) {
      onTickCallback(elapsed);
    }
    
    animationId = requestAnimationFrame(tick);
  }
  
  animationId = requestAnimationFrame(tick);
}

export function pauseAnimation() {
  isPlaying = false;
  if (animationId) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }
}

export function resetAnimation() {
  pauseAnimation();
  pausedTime = 0;
  startTime = null;
  if (onTickCallback) {
    onTickCallback(0);
  }
}

export function getElapsedTime() {
  return pausedTime / 1000;
}

export function isAnimating() {
  return isPlaying;
}

export function getDuration() {
  return SCENARIO_DURATION;
}

export function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}
