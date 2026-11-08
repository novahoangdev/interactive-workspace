import * as THREE from 'three';

// Official Real Madrid crest, served from /public (viewBox 32 x 43).
// Rasterised onto a canvas so it can be used as a texture on any plane.
const CREST_URL = '/images/real-madrid-crest.svg';
export const CREST_ASPECT = 32 / 43; // width / height

export function createRealMadridCrestTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = Math.round(512 / CREST_ASPECT);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;

  const img = new Image();
  img.decoding = 'async';
  img.onload = () => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    texture.needsUpdate = true;
  };
  img.src = CREST_URL;

  return texture;
}
