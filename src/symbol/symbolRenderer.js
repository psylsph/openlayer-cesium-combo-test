import ms from 'milsymbol';

const cache = new Map();

const COLOR_MAP = {
  'FRIENDLY': '#00ffff',
  'HOSTILE': '#ff0000',
  'NEUTRAL': '#00ff00',
  'UNKNOWN': '#ffff00',
  'OWN_SHIP': '#00ff00'
};

export function getDataUri(sidc, heading = 0, size = 35, affiliation = null) {
  const key = `${sidc}:${heading}:${size}:${affiliation || 'default'}`;
  if (cache.has(key)) {
    return cache.get(key);
  }
  
  const options = { size: size, direction: heading };
  
  if (affiliation && COLOR_MAP[affiliation.toUpperCase()]) {
    options.monoColor = COLOR_MAP[affiliation.toUpperCase()];
  }
  
  const sym = new ms.Symbol(sidc, options);
  const canvas = sym.asCanvas();
  
  // Add transparent background for picking
  const ctx = canvas.getContext('2d');
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] === 0) {
      data[i] = 0;
      data[i + 1] = 0;
      data[i + 2] = 0;
      data[i + 3] = 1;
    }
  }
  
  ctx.putImageData(imageData, 0, 0);
  
  const anchor = sym.getAnchor();
  const centerOffsetX = canvas.width / 2 - anchor.x;
  const centerOffsetY = canvas.height / 2 - anchor.y;
  
  const result = { canvas, centerOffsetX, centerOffsetY };
  cache.set(key, result);
  return result;
}

export function getAnchor(sidc, heading = 0, size = 35) {
  const sym = new ms.Symbol(sidc, { size: size, direction: heading });
  return sym.getAnchor();
}

export function clearCache() {
  cache.clear();
}
