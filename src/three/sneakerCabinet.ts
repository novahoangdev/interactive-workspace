import * as THREE from 'three';
import { createRealMadridCrestTexture, CREST_ASPECT } from './realMadridCrest';

// -------------------------------------------------------------
// HELPER: Canvas Texture Generators for Authentic Shoeboxes & Accessories
// -------------------------------------------------------------

// Canonical Nike Swoosh SVG path from official brand vectors (bounding box [140, 248] to [1060, 718])
// Width: 920, Height: 470, Center: [600, 483]
const NIKE_SWOOSH_SVG =
  'M245.8 717.6c-29.8-1.2-54.2-9.3-73.2-24.5-3.6-2.9-12.3-11.6-15.2-15.2-7.7-9.7-13-19.2-16.5-29.7-10.8-32.3-5.2-74.7 15.9-121.2 18.1-39.8 46-79.3 94.6-134.1 7.2-8.1 28.5-31.6 28.7-31.6.1 0-1.1 2-2.6 4.5-12.7 21.2-23.5 46.2-29.4 67.8-9.5 34.7-8.3 64.4 3.3 87.5 8.1 15.9 21.9 29.7 37.4 37.3 27.2 13.3 67 14.4 115.6 3.2 3.3-.8 169.2-44.8 368.6-97.8 199.4-53 362.5-96.4 362.5-96.4.1 0-463.2 198.3-703.6 301.1-38.1 16.3-48.3 20.4-66.2 26.7-45.8 16.1-86.8 23.7-119.9 22.4z';

export function drawOfficialNikeLogo(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  targetWidth: number,
  color: string = '#ffffff'
) {
  ctx.save();
  ctx.translate(cx, cy);

  // 1. Official Nike shoebox lockup:
  // "NIKE" wordmark in heavy italic condensed sans-serif uppercase (Futura Bold Condensed Oblique style)
  const fontSize = targetWidth * 0.36;
  ctx.font = `italic 900 ${Math.round(fontSize)}px "Arial Black", "Impact", "Helvetica Neue", sans-serif`;
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('NIKE', 0, -targetWidth * 0.16);

  // 2. Official authentic Nike Swoosh passing beneath and through the text, sweeping up to the right
  const swooshW = targetWidth * 1.06;
  const scale = swooshW / 920;

  ctx.save();
  ctx.translate(0, targetWidth * 0.12);
  ctx.scale(scale, scale);
  ctx.translate(-600, -483);
  const path = new Path2D(NIKE_SWOOSH_SVG);
  ctx.fillStyle = color;
  ctx.fill(path);
  ctx.restore();

  // 3. Small registered trademark symbol (R)
  ctx.font = `bold ${Math.round(fontSize * 0.16)}px sans-serif`;
  ctx.fillText('®', targetWidth * 0.44, -targetWidth * 0.26);

  ctx.restore();
}

// 1. Nike Classic Red Shoebox Texture
export function createNikeRedTexture(customText?: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Crimson/Red base (iconic Nike Sportswear Red)
  ctx.fillStyle = '#dc2626';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Subtle bevel / edge lines top and bottom
  ctx.fillStyle = '#b91c1c';
  ctx.fillRect(0, 0, canvas.width, 10);
  ctx.fillRect(0, canvas.height - 10, canvas.width, 10);

  // Center the official Nike logo prominently
  drawOfficialNikeLogo(ctx, 512, 256, 520, '#ffffff');

  if (customText) {
    ctx.font = 'bold 30px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText(customText, 512, 440);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

// 2. Nike Bright Orange Shoebox Texture
export function createNikeOrangeTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Vivid Nike Orange
  ctx.fillStyle = '#ea580c';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Subtle lid edge highlight
  ctx.fillStyle = '#c2410c';
  ctx.fillRect(0, 0, canvas.width, 10);
  ctx.fillRect(0, canvas.height - 10, canvas.width, 10);

  // Center the official Nike logo prominently
  drawOfficialNikeLogo(ctx, 512, 256, 520, '#ffffff');

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

// -------------------------------------------------------------
// CANONICAL BRAND LOGO & PATTERN DRAWING HELPERS
// -------------------------------------------------------------

// Canonical Adidas Trefoil (Hoa ba lá) Vector Drawer
export function drawOfficialAdidasTrefoil(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  targetWidth: number,
  color: string = '#ffffff',
  bgColor: string = '#004890'
) {
  ctx.save();
  ctx.translate(cx, cy);

  const scale = targetWidth / 200;
  ctx.scale(scale, scale);

  ctx.fillStyle = color;

  // Function to draw a Trefoil leaf petal
  const drawPetal = (len: number, w: number) => {
    ctx.beginPath();
    ctx.moveTo(0, -len);
    ctx.bezierCurveTo(-w * 0.75, -len * 0.55, -w * 0.85, len * 0.05, 0, len * 0.45);
    ctx.bezierCurveTo(w * 0.85, len * 0.05, w * 0.75, -len * 0.55, 0, -len);
    ctx.closePath();
    ctx.fill();
  };

  // 1. Center Leaf (Vertical)
  ctx.save();
  ctx.translate(0, -10);
  drawPetal(62, 38);
  ctx.restore();

  // 2. Left Leaf (Angled -43 degrees)
  ctx.save();
  ctx.translate(-14, 2);
  ctx.rotate(-0.76);
  drawPetal(56, 36);
  ctx.restore();

  // 3. Right Leaf (Angled +43 degrees)
  ctx.save();
  ctx.translate(14, 2);
  ctx.rotate(0.76);
  drawPetal(56, 36);
  ctx.restore();

  // 4. Three horizontal cut stripes through the lower leaves
  ctx.fillStyle = bgColor;
  const cuts = [
    { y: -2, h: 5 },
    { y: 8, h: 5.5 },
    { y: 19, h: 6 },
  ];
  cuts.forEach((cut) => {
    ctx.fillRect(-70, cut.y, 140, cut.h);
  });

  // 5. Official lowercase "adidas" wordmark below the Trefoil
  ctx.fillStyle = color;
  ctx.font = 'bold 36px "Avant Garde", "Century Gothic", "Arial", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText('adidas', 0, 56);

  // Small registered trademark symbol (R)
  ctx.font = 'bold 10px sans-serif';
  ctx.fillText('®', 62, 38);

  ctx.restore();
}

// Canonical Vans "OFF THE WALL" Skateboard Logo Drawer
export function drawOfficialVansLogo(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  targetWidth: number,
  color: string = '#ffffff',
  deckBgColor?: string
) {
  ctx.save();
  ctx.translate(cx, cy);

  const deckW = targetWidth;
  const deckH = targetWidth * 0.44;

  // 1. Skateboard Deck Pill Shape
  if (deckBgColor) {
    ctx.fillStyle = deckBgColor;
    ctx.beginPath();
    const r = deckH / 2;
    ctx.moveTo(-deckW / 2 + r, -deckH / 2);
    ctx.lineTo(deckW / 2 - r, -deckH / 2);
    ctx.arc(deckW / 2 - r, 0, r, -Math.PI / 2, Math.PI / 2);
    ctx.lineTo(-deckW / 2 + r, deckH / 2);
    ctx.arc(-deckW / 2 + r, 0, r, Math.PI / 2, -Math.PI / 2);
    ctx.closePath();
    ctx.fill();
  }

  // White border outline of skateboard deck
  ctx.strokeStyle = color;
  ctx.lineWidth = targetWidth * 0.032;
  ctx.beginPath();
  const rOut = deckH / 2;
  ctx.moveTo(-deckW / 2 + rOut, -deckH / 2);
  ctx.lineTo(deckW / 2 - rOut, -deckH / 2);
  ctx.arc(deckW / 2 - rOut, 0, rOut, -Math.PI / 2, Math.PI / 2);
  ctx.lineTo(-deckW / 2 + rOut, deckH / 2);
  ctx.arc(-deckW / 2 + rOut, 0, rOut, Math.PI / 2, -Math.PI / 2);
  ctx.closePath();
  ctx.stroke();

  // 2. Canonical "VANS" wordmark with horizontal roof extending over ANS
  ctx.fillStyle = color;
  const vLeft = -deckW * 0.36;
  const vTop = -deckH * 0.28;
  const vBottom = deckH * 0.12;
  const roofRight = deckW * 0.34;
  const strokeThick = targetWidth * 0.052;

  // Draw 'V' and roof
  ctx.beginPath();
  ctx.moveTo(vLeft, vTop);
  ctx.lineTo(vLeft + deckW * 0.12, vBottom);
  ctx.lineTo(vLeft + deckW * 0.24, vTop);
  ctx.lineTo(roofRight, vTop);
  ctx.lineTo(roofRight, vTop + strokeThick * 0.7);
  ctx.lineTo(vLeft + deckW * 0.24 + strokeThick * 0.5, vTop + strokeThick * 0.7);
  ctx.lineTo(vLeft + deckW * 0.12, vBottom - strokeThick * 0.5);
  ctx.lineTo(vLeft + strokeThick * 0.4, vTop);
  ctx.closePath();
  ctx.fill();

  // Draw 'A', 'N', 'S' neatly nested under the horizontal roof
  const subFont = Math.round(targetWidth * 0.17);
  ctx.font = `900 ${subFont}px "Arial Black", "Helvetica Neue", sans-serif`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText('A', vLeft + deckW * 0.24, vBottom);
  ctx.fillText('N', vLeft + deckW * 0.39, vBottom);
  ctx.fillText('S', vLeft + deckW * 0.54, vBottom);

  // 3. Signature cursive "OFF THE WALL"
  ctx.font = `italic 700 ${Math.round(targetWidth * 0.088)}px "Brush Script MT", "Trebuchet MS", "Arial", sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText('“OFF THE WALL”', 0, deckH * 0.32);

  // Small registered (R)
  ctx.font = `bold ${Math.round(targetWidth * 0.045)}px sans-serif`;
  ctx.fillText('®', roofRight + 8, vTop + 6);

  ctx.restore();
}

// Draw alternating black & white checkerboard band (Iconic Vans signature)
export function drawCheckerboard(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  rows: number = 2,
  cols: number = 24,
  c1: string = '#000000',
  c2: string = '#ffffff'
) {
  const cellW = w / cols;
  const cellH = h / rows;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      ctx.fillStyle = (r + c) % 2 === 0 ? c1 : c2;
      ctx.fillRect(x + c * cellW, y + r * cellH, cellW + 0.5, cellH + 0.5);
    }
  }
}

// -------------------------------------------------------------
// 3. ADIDAS ORIGINALS ROYAL BLUE HERITAGE SHOEBOX (NY 90 W)
// -------------------------------------------------------------

// Single fallback texture
export function createAdidasBlueTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Royal Blue (#004890)
  ctx.fillStyle = '#004890';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 3 Bold White Diagonal Stripes across top corner
  ctx.fillStyle = '#ffffff';
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    const ox = 180 + i * 55;
    ctx.moveTo(ox, 0);
    ctx.lineTo(ox + 35, 0);
    ctx.lineTo(ox - 160, 512);
    ctx.lineTo(ox - 195, 512);
    ctx.closePath();
    ctx.fill();
  }

  // Official Adidas Trefoil Logo
  drawOfficialAdidasTrefoil(ctx, 600, 240, 220, '#ffffff', '#004890');

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

// Multi-face authentic Adidas materials: [Right, Left, Top, Bottom, Front, Back]
export function createAdidasShoeboxMaterials(): THREE.MeshStandardMaterial[] {
  // --- TOP LID TEXTURE ---
  const topCanvas = document.createElement('canvas');
  topCanvas.width = 1024;
  topCanvas.height = 512;
  const topCtx = topCanvas.getContext('2d')!;

  topCtx.fillStyle = '#004890';
  topCtx.fillRect(0, 0, topCanvas.width, topCanvas.height);

  // 3 White Stripes spanning diagonally across corner
  topCtx.fillStyle = '#ffffff';
  for (let i = 0; i < 3; i++) {
    topCtx.beginPath();
    const ox = 240 + i * 55;
    topCtx.moveTo(ox, 0);
    topCtx.lineTo(ox + 32, 0);
    topCtx.lineTo(ox - 220, 512);
    topCtx.lineTo(ox - 252, 512);
    topCtx.closePath();
    topCtx.fill();
  }

  // Centered Adidas Trefoil and wordmark
  drawOfficialAdidasTrefoil(topCtx, 620, 256, 260, '#ffffff', '#004890');

  const topTex = new THREE.CanvasTexture(topCanvas);
  topTex.colorSpace = THREE.SRGBColorSpace;
  topTex.anisotropy = 8;

  // --- FRONT FACE TEXTURE (Visible to the room: with authentic NY 90 W retail label sticker) ---
  const frontCanvas = document.createElement('canvas');
  frontCanvas.width = 1024;
  frontCanvas.height = 512;
  const fCtx = frontCanvas.getContext('2d')!;

  fCtx.fillStyle = '#004890';
  fCtx.fillRect(0, 0, frontCanvas.width, frontCanvas.height);

  // Lid separation line
  fCtx.fillStyle = '#003366';
  fCtx.fillRect(0, 80, frontCanvas.width, 6);

  // Left side: Trefoil & Adidas text
  drawOfficialAdidasTrefoil(fCtx, 220, 270, 160, '#ffffff', '#004890');

  // Right side: Official Adidas Product Spec Label (Nhãn tem chính hãng Adidas)
  const lblX = 540;
  const lblY = 120;
  const lblW = 420;
  const lblH = 340;

  fCtx.fillStyle = '#ffffff';
  fCtx.fillRect(lblX, lblY, lblW, lblH);
  fCtx.strokeStyle = '#cbd5e1';
  fCtx.lineWidth = 2;
  fCtx.strokeRect(lblX, lblY, lblW, lblH);

  // Sticker content
  fCtx.fillStyle = '#0f172a';
  fCtx.textAlign = 'left';
  fCtx.font = 'bold 32px "Avant Garde", "Arial", sans-serif';
  fCtx.fillText('NY 90 W', lblX + 24, lblY + 48);

  fCtx.font = 'bold 16px sans-serif';
  fCtx.fillStyle = '#64748b';
  fCtx.fillText('FOOTWEAR / CHAUSSURES', lblX + 24, lblY + 76);

  fCtx.font = '15px monospace';
  fCtx.fillStyle = '#0f172a';
  fCtx.fillText('ART NO. FY9834', lblX + 24, lblY + 104);

  // Sizing matrix grid
  fCtx.strokeRect(lblX + 24, lblY + 118, 240, 70);
  fCtx.font = 'bold 16px sans-serif';
  fCtx.fillText('US      UK      FR      JP', lblX + 36, lblY + 144);
  fCtx.font = 'bold 18px monospace';
  fCtx.fillText('7.5     6       39⅓    245', lblX + 36, lblY + 172);

  // Barcode
  fCtx.fillStyle = '#000000';
  const barX = lblX + 24;
  const barY = lblY + 204;
  for (let b = 0; b < 45; b++) {
    const bw = b % 3 === 0 ? 4 : b % 2 === 0 ? 2 : 1;
    fCtx.fillRect(barX + b * 5.2, barY, bw, 65);
  }
  fCtx.font = 'bold 15px monospace';
  fCtx.fillText('4 064044 182934', barX + 16, barY + 95);

  // Small shoe silhouette outline
  fCtx.strokeStyle = '#64748b';
  fCtx.lineWidth = 2.5;
  fCtx.beginPath();
  fCtx.moveTo(lblX + 290, lblY + 180);
  fCtx.lineTo(lblX + 330, lblY + 180);
  fCtx.lineTo(lblX + 375, lblY + 165);
  fCtx.lineTo(lblX + 395, lblY + 145);
  fCtx.lineTo(lblX + 370, lblY + 130);
  fCtx.lineTo(lblX + 325, lblY + 130);
  fCtx.lineTo(lblX + 290, lblY + 145);
  fCtx.closePath();
  fCtx.stroke();

  const frontTex = new THREE.CanvasTexture(frontCanvas);
  frontTex.colorSpace = THREE.SRGBColorSpace;
  frontTex.anisotropy = 8;

  // --- SIDE TEXTURE (Continuing 3 stripes) ---
  const sideCanvas = document.createElement('canvas');
  sideCanvas.width = 1024;
  sideCanvas.height = 512;
  const sCtx = sideCanvas.getContext('2d')!;

  sCtx.fillStyle = '#004890';
  sCtx.fillRect(0, 0, sideCanvas.width, sideCanvas.height);

  sCtx.fillStyle = '#ffffff';
  for (let i = 0; i < 3; i++) {
    sCtx.beginPath();
    const ox = 380 + i * 55;
    sCtx.moveTo(ox, 0);
    sCtx.lineTo(ox + 32, 0);
    sCtx.lineTo(ox - 180, 512);
    sCtx.lineTo(ox - 212, 512);
    sCtx.closePath();
    sCtx.fill();
  }

  drawOfficialAdidasTrefoil(sCtx, 180, 260, 160, '#ffffff', '#004890');

  const sideTex = new THREE.CanvasTexture(sideCanvas);
  sideTex.colorSpace = THREE.SRGBColorSpace;
  sideTex.anisotropy = 8;

  // Base materials
  const blueMat = new THREE.MeshStandardMaterial({ color: 0x004890, roughness: 0.5 });
  const topMat = new THREE.MeshStandardMaterial({ map: topTex, roughness: 0.5 });
  const frontMat = new THREE.MeshStandardMaterial({ map: frontTex, roughness: 0.5 });
  const sideMat = new THREE.MeshStandardMaterial({ map: sideTex, roughness: 0.5 });

  // [Right, Left, Top, Bottom, Front, Back]
  return [sideMat, sideMat, topMat, blueMat, frontMat, sideMat];
}

// -------------------------------------------------------------
// 4. ADIDAS YEEZY BOOST 380 KRAFT CARDBOARD DRAWER SHOEBOX
// -------------------------------------------------------------

// Single fallback texture
export function createYeezy380Texture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Natural Kraft Cardboard Tan (#c59d6e)
  ctx.fillStyle = '#c59d6e';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Subtle corrugated cardboard horizontal lines
  ctx.strokeStyle = 'rgba(0,0,0,0.04)';
  for (let y = 0; y < canvas.height; y += 4) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }

  // Giant iconic bold charcoal "380"
  ctx.font = '900 180px "Arial Black", "Helvetica Neue", sans-serif';
  ctx.fillStyle = '#262626';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('380', 512, 230);

  // "MADE BY ADIDAS" below
  ctx.font = 'bold 30px "Avant Garde", "Century Gothic", sans-serif';
  ctx.fillText('M A D E   B Y   A D I D A S', 512, 380);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

// Multi-face authentic Yeezy 380 materials: [Right, Left, Top, Bottom, Front, Back]
export function createYeezy380ShoeboxMaterials(): THREE.MeshStandardMaterial[] {
  const drawKraftBase = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    // Natural corrugated raw kraft cardboard
    ctx.fillStyle = '#c59d6e';
    ctx.fillRect(0, 0, w, h);

    // Subtle horizontal flute ridges
    ctx.strokeStyle = 'rgba(0,0,0,0.035)';
    ctx.lineWidth = 1;
    for (let y = 0; y < h; y += 4) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Subtle fiber grain speckles
    ctx.fillStyle = 'rgba(80,50,20,0.02)';
    for (let i = 0; i < 400; i++) {
      ctx.fillRect((i * 97) % w, (i * 47) % h, 2, 2);
    }
  };

  // --- TOP LID: Clean kraft with giant iconic "380" ---
  const topCanvas = document.createElement('canvas');
  topCanvas.width = 1024;
  topCanvas.height = 512;
  const topCtx = topCanvas.getContext('2d')!;
  drawKraftBase(topCtx, 1024, 512);

  topCtx.font = '900 210px "Arial Black", "Impact", "Helvetica Neue", sans-serif';
  topCtx.fillStyle = '#262626';
  topCtx.textAlign = 'center';
  topCtx.textBaseline = 'middle';
  topCtx.fillText('380', 512, 256);

  const topTex = new THREE.CanvasTexture(topCanvas);
  topTex.colorSpace = THREE.SRGBColorSpace;
  topTex.anisotropy = 8;

  // --- FRONT FACE: Slide-out drawer with pull hole & authentic retail label sticker ---
  const frontCanvas = document.createElement('canvas');
  frontCanvas.width = 1024;
  frontCanvas.height = 512;
  const fCtx = frontCanvas.getContext('2d')!;
  drawKraftBase(fCtx, 1024, 512);

  // Realistic oval finger-pull hole (Lỗ luồn ngón tay kéo ngăn kéo Yeezy)
  const holeX = 512;
  const holeY = 120;
  fCtx.save();
  // Deep interior hole shadow
  fCtx.fillStyle = '#18181b';
  fCtx.beginPath();
  fCtx.ellipse(holeX, holeY, 48, 26, 0, 0, Math.PI * 2);
  fCtx.fill();
  // Cardboard cut bevel rim
  fCtx.strokeStyle = '#9a7042';
  fCtx.lineWidth = 3;
  fCtx.stroke();
  fCtx.restore();

  // "MADE BY ADIDAS" below finger hole
  fCtx.fillStyle = '#262626';
  fCtx.font = 'bold 30px "Avant Garde", "Helvetica Neue", sans-serif';
  fCtx.textAlign = 'center';
  fCtx.fillText('M A D E   B Y   A D I D A S', 512, 205);

  fCtx.font = 'bold 22px sans-serif';
  fCtx.fillText('Y E E Z Y . C O M', 512, 245);

  // Official white Adidas Yeezy Factory spec label sticker on left
  const lblX = 80;
  const lblY = 270;
  const lblW = 400;
  const lblH = 210;

  fCtx.fillStyle = '#f8fafc';
  fCtx.fillRect(lblX, lblY, lblW, lblH);
  fCtx.strokeStyle = '#94a3b8';
  fCtx.lineWidth = 1.5;
  fCtx.strokeRect(lblX, lblY, lblW, lblH);

  fCtx.fillStyle = '#0f172a';
  fCtx.textAlign = 'left';
  fCtx.font = 'bold 24px "Arial Black", sans-serif';
  fCtx.fillText('YEEZY BOOST 380', lblX + 20, lblY + 36);

  fCtx.font = 'bold 15px sans-serif';
  fCtx.fillStyle = '#475569';
  fCtx.fillText('ONYX / ONYX / ONYX', lblX + 20, lblY + 62);
  fCtx.fillText('FZ1270', lblX + 20, lblY + 84);

  // Sizing grid
  fCtx.strokeRect(lblX + 20, lblY + 96, 220, 48);
  fCtx.font = 'bold 13px sans-serif';
  fCtx.fillText('US      UK      F       D', lblX + 28, lblY + 114);
  fCtx.font = 'bold 15px monospace';
  fCtx.fillText('9       8½      42⅔     8½', lblX + 28, lblY + 135);

  // Barcode
  fCtx.fillStyle = '#000000';
  for (let b = 0; b < 36; b++) {
    const bw = b % 4 === 0 ? 3 : 1.5;
    fCtx.fillRect(lblX + 20 + b * 5, lblY + 155, bw, 36);
  }
  fCtx.font = '12px monospace';
  fCtx.fillText('4 064044 192841', lblX + 20, lblY + 202);

  // RFID & QR icon
  fCtx.strokeRect(lblX + 290, lblY + 110, 80, 80);
  fCtx.font = 'bold 12px sans-serif';
  fCtx.fillText('RFID', lblX + 310, lblY + 155);

  const frontTex = new THREE.CanvasTexture(frontCanvas);
  frontTex.colorSpace = THREE.SRGBColorSpace;
  frontTex.anisotropy = 8;

  // --- SIDE FACES: Giant iconic "BOOST" ---
  const sideCanvas = document.createElement('canvas');
  sideCanvas.width = 1024;
  sideCanvas.height = 512;
  const sCtx = sideCanvas.getContext('2d')!;
  drawKraftBase(sCtx, 1024, 512);

  sCtx.font = '900 180px "Arial Black", "Impact", sans-serif';
  sCtx.fillStyle = '#262626';
  sCtx.textAlign = 'center';
  sCtx.textBaseline = 'middle';
  sCtx.fillText('BOOST', 512, 256);

  const sideTex = new THREE.CanvasTexture(sideCanvas);
  sideTex.colorSpace = THREE.SRGBColorSpace;
  sideTex.anisotropy = 8;

  // Kraft base
  const kraftMat = new THREE.MeshStandardMaterial({ color: 0xc59d6e, roughness: 0.8 });
  const topMat = new THREE.MeshStandardMaterial({ map: topTex, roughness: 0.8 });
  const frontMat = new THREE.MeshStandardMaterial({ map: frontTex, roughness: 0.8 });
  const sideMat = new THREE.MeshStandardMaterial({ map: sideTex, roughness: 0.8 });

  // [Right, Left, Top, Bottom, Front, Back]
  return [sideMat, sideMat, topMat, kraftMat, frontMat, kraftMat];
}

// -------------------------------------------------------------
// 5. VANS "OFF THE WALL" RACING RED ICONIC SHOEBOX
// -------------------------------------------------------------

// Single fallback texture (updated to authentic Vans Racing Red & Skateboard logo)
export function createVansPurpleTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Vans Racing Red (#c8102e)
  ctx.fillStyle = '#c8102e';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Black & white checkerboard band along bottom
  drawCheckerboard(ctx, 0, 430, 1024, 82, 2, 24);

  // Official Vans Skateboard Logo
  drawOfficialVansLogo(ctx, 512, 210, 520, '#ffffff');

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

// Multi-face authentic Vans materials: [Right, Left, Top, Bottom, Front, Back]
export function createVansShoeboxMaterials(): THREE.MeshStandardMaterial[] {
  // --- TOP LID: Vans Racing Red with Centered Official Skateboard Logo ---
  const topCanvas = document.createElement('canvas');
  topCanvas.width = 1024;
  topCanvas.height = 512;
  const topCtx = topCanvas.getContext('2d')!;

  topCtx.fillStyle = '#c8102e';
  topCtx.fillRect(0, 0, topCanvas.width, topCanvas.height);

  // Subtle border groove
  topCtx.strokeStyle = 'rgba(255,255,255,0.2)';
  topCtx.lineWidth = 3;
  topCtx.strokeRect(20, 20, 984, 472);

  // Centered white Vans skateboard logo
  drawOfficialVansLogo(topCtx, 512, 256, 560, '#ffffff');

  const topTex = new THREE.CanvasTexture(topCanvas);
  topTex.colorSpace = THREE.SRGBColorSpace;
  topTex.anisotropy = 8;

  // --- FRONT FACE: Skateboard Logo + Black & White Checkerboard Band + Barcode Label ---
  const frontCanvas = document.createElement('canvas');
  frontCanvas.width = 1024;
  frontCanvas.height = 512;
  const fCtx = frontCanvas.getContext('2d')!;

  fCtx.fillStyle = '#c8102e';
  fCtx.fillRect(0, 0, frontCanvas.width, frontCanvas.height);

  // Iconic Black & White Checkerboard Band along bottom (World famous Vans pattern)
  drawCheckerboard(fCtx, 0, 390, 1024, 122, 2, 24);

  // White lid crease line
  fCtx.fillStyle = 'rgba(255,255,255,0.25)';
  fCtx.fillRect(0, 70, 1024, 4);

  // Vans Skateboard Logo on left
  drawOfficialVansLogo(fCtx, 280, 220, 380, '#ffffff');

  // Authentic white retail shoebox label sticker on right
  const lblX = 580;
  const lblY = 110;
  const lblW = 380;
  const lblH = 260;

  fCtx.fillStyle = '#ffffff';
  fCtx.fillRect(lblX, lblY, lblW, lblH);
  fCtx.strokeStyle = '#cbd5e1';
  fCtx.lineWidth = 2;
  fCtx.strokeRect(lblX, lblY, lblW, lblH);

  // Red Vans mini skateboard logo on sticker
  drawOfficialVansLogo(fCtx, lblX + 90, lblY + 40, 120, '#c8102e');

  fCtx.fillStyle = '#0f172a';
  fCtx.font = 'bold 22px "Arial Black", sans-serif';
  fCtx.textAlign = 'left';
  fCtx.fillText('OLD SKOOL', lblX + 24, lblY + 95);

  fCtx.font = 'bold 15px sans-serif';
  fCtx.fillStyle = '#475569';
  fCtx.fillText('(CANVAS) BLACK/WHITE', lblX + 24, lblY + 120);
  fCtx.fillText('VN000D3HY28', lblX + 24, lblY + 142);

  fCtx.font = 'bold 20px "Arial Black", sans-serif';
  fCtx.fillStyle = '#0f172a';
  fCtx.fillText('US MEN  8.5', lblX + 24, lblY + 180);
  fCtx.fillText('US WOMEN 10.0', lblX + 24, lblY + 205);

  // Barcode
  fCtx.fillStyle = '#000000';
  for (let b = 0; b < 32; b++) {
    const bw = b % 3 === 0 ? 3.5 : 1.5;
    fCtx.fillRect(lblX + 24 + b * 5, lblY + 218, bw, 32);
  }

  const frontTex = new THREE.CanvasTexture(frontCanvas);
  frontTex.colorSpace = THREE.SRGBColorSpace;
  frontTex.anisotropy = 8;

  // --- SIDE FACES: Racing Red with Checkerboard band along bottom ---
  const sideCanvas = document.createElement('canvas');
  sideCanvas.width = 1024;
  sideCanvas.height = 512;
  const sCtx = sideCanvas.getContext('2d')!;

  sCtx.fillStyle = '#c8102e';
  sCtx.fillRect(0, 0, sideCanvas.width, sideCanvas.height);
  drawCheckerboard(sCtx, 0, 390, 1024, 122, 2, 24);

  drawOfficialVansLogo(sCtx, 512, 220, 440, '#ffffff');

  const sideTex = new THREE.CanvasTexture(sideCanvas);
  sideTex.colorSpace = THREE.SRGBColorSpace;
  sideTex.anisotropy = 8;

  const redMat = new THREE.MeshStandardMaterial({ color: 0xc8102e, roughness: 0.5 });
  const topMat = new THREE.MeshStandardMaterial({ map: topTex, roughness: 0.5 });
  const frontMat = new THREE.MeshStandardMaterial({ map: frontTex, roughness: 0.5 });
  const sideMat = new THREE.MeshStandardMaterial({ map: sideTex, roughness: 0.5 });

  // [Right, Left, Top, Bottom, Front, Back]
  return [sideMat, sideMat, topMat, redMat, frontMat, sideMat];
}

// 6. Marvel Navy Shoebox Texture
export function createMarvelTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  // Deep navy blue
  ctx.fillStyle = '#1e3a8a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Red Marvel box
  ctx.fillStyle = '#dc2626';
  ctx.fillRect(156, 80, 200, 75);

  ctx.font = '900 50px sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('MARVEL', 256, 118);

  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = 4;
  return tex;
}

// 7. Blue Chess Game Box Texture
export function createChessTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  // Deep cyan/blue
  ctx.fillStyle = '#0284c7';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Checkerboard mini preview
  const sq = 24;
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      ctx.fillStyle = (r + c) % 2 === 0 ? '#ffffff' : '#0369a1';
      ctx.fillRect(60 + c * sq, 80 + r * sq, sq, sq);
    }
  }

  ctx.font = '900 54px sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'left';
  ctx.fillText('CHESS', 200, 130);
  ctx.font = 'bold 18px sans-serif';
  ctx.fillText('CLASSIC STRATEGY GAME', 200, 165);

  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = 4;
  return tex;
}

// 8. Rockie Craft Box Texture
export function createRockieTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#a88258';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.font = '900 48px sans-serif';
  ctx.fillStyle = '#3e2723';
  ctx.textAlign = 'center';
  ctx.fillText('ROCKIE', 256, 105);

  ctx.font = 'bold 18px sans-serif';
  ctx.fillText('STEP ON YOUR WAY', 256, 150);

  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = 4;
  return tex;
}

// 9. Black Sneaker Box with White Sticker (DSUH00700-XNH-CS41 999.000VND)
export function createBlackShoeboxTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#18181b';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // White product label sticker
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(280, 120, 200, 110);

  ctx.fillStyle = '#000000';
  ctx.font = 'bold 13px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('DSUH00700-XNH-CS41', 290, 145);
  ctx.font = 'bold 15px sans-serif';
  ctx.fillText('999.000 VND', 290, 175);

  // Barcode lines
  for (let x = 290; x < 460; x += 4) {
    if (Math.sin(x * 12) > -0.2) {
      ctx.fillRect(x, 190, 2, 30);
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = 4;
  return tex;
}

// 10. UNO Card Game Box Texture
export function createUnoTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#dc2626';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Yellow and green tilted oval
  ctx.save();
  ctx.translate(128, 128);
  ctx.rotate(-0.25);
  ctx.fillStyle = '#16a34a';
  ctx.beginPath();
  ctx.ellipse(0, 0, 95, 60, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#facc15';
  ctx.beginPath();
  ctx.ellipse(0, 0, 85, 50, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.font = 'italic 900 64px sans-serif';
  ctx.fillStyle = '#dc2626';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('UNO', 0, 5);
  ctx.restore();

  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = 4;
  return tex;
}

// 12. Korean Soju Bottle Label Texture
export function createSojuLabelTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Emerald green Korean calligraphy text
  ctx.fillStyle = '#047857';
  ctx.font = 'bold 36px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('참이슬', 128, 90);

  ctx.fillStyle = '#059669';
  ctx.font = 'bold 16px sans-serif';
  ctx.fillText('FRESH SOJU', 128, 130);

  // Cute green frog / droplet emblem
  ctx.beginPath();
  ctx.arc(128, 175, 20, 0, Math.PI * 2);
  ctx.fillStyle = '#10b981';
  ctx.fill();

  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = 4;
  return tex;
}

// 13. Slim White MacBook Pro Box Texture
export function createMacBookBoxTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.font = '300 28px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = '#18181b';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('MacBook Pro', 256, 64);

  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = 4;
  return tex;
}

// -------------------------------------------------------------
// MAIN FUNCTION: Create Authentic 8-Cubby White Cabinet with Shoebox Stacks
// -------------------------------------------------------------

export function createSneakerCabinet(): THREE.Group {
  const cabinetGroup = new THREE.Group();
  cabinetGroup.name = 'sneaker-shelf';
  cabinetGroup.position.set(-3.40, 0, -0.05);
  // Scale up the sneaker cabinet so it is substantially bigger, taller, and more prominent
  cabinetGroup.scale.set(2.45, 2.20, 2.10);

  // -----------------------------------------------------------
  // 1. THE 8-CUBBY WHITE CABINET (Tủ 8 Hộc Màu Trắng)
  // Dimensions: 2 columns wide x 4 rows high = 8 cubbies
  // Overall: Width 0.86m, Depth 0.38m, Height 1.52m
  // -----------------------------------------------------------
  const whiteLaminateMat = new THREE.MeshStandardMaterial({
    color: 0xfcfcfc,
    roughness: 0.32,
    metalness: 0.04,
  });

  const cabinetWidth = 0.86;
  const cabinetDepth = 0.38;
  const cabinetHeight = 1.52;
  const outerThick = 0.035;
  const innerThick = 0.022;

  // Top and Bottom Horizontal Outer Panels
  const topPanel = new THREE.Mesh(
    new THREE.BoxGeometry(cabinetWidth, outerThick, cabinetDepth),
    whiteLaminateMat
  );
  topPanel.position.set(0, cabinetHeight - outerThick / 2, 0);
  topPanel.castShadow = true;
  topPanel.receiveShadow = true;
  cabinetGroup.add(topPanel);

  const bottomPanel = new THREE.Mesh(
    new THREE.BoxGeometry(cabinetWidth, outerThick, cabinetDepth),
    whiteLaminateMat
  );
  bottomPanel.position.set(0, outerThick / 2, 0);
  bottomPanel.castShadow = true;
  bottomPanel.receiveShadow = true;
  cabinetGroup.add(bottomPanel);

  // Left and Right Outer Side Panels
  const sideH = cabinetHeight - outerThick * 2;
  [-cabinetWidth / 2 + outerThick / 2, cabinetWidth / 2 - outerThick / 2].forEach((x) => {
    const sidePanel = new THREE.Mesh(
      new THREE.BoxGeometry(outerThick, sideH, cabinetDepth),
      whiteLaminateMat
    );
    sidePanel.position.set(x, cabinetHeight / 2, 0);
    sidePanel.castShadow = true;
    sidePanel.receiveShadow = true;
    cabinetGroup.add(sidePanel);
  });

  // Central Vertical Divider (runs top-to-bottom between outer panels)
  const centerDivider = new THREE.Mesh(
    new THREE.BoxGeometry(innerThick, sideH, cabinetDepth - 0.01),
    whiteLaminateMat
  );
  centerDivider.position.set(0, cabinetHeight / 2, 0);
  centerDivider.castShadow = true;
  centerDivider.receiveShadow = true;
  cabinetGroup.add(centerDivider);

  // 3 Horizontal Dividers creating 4 equal rows (Row 1 to 4)
  const rowH = (sideH - innerThick * 3) / 4; // ~0.34m per cubby
  const shelfYList = [
    outerThick + rowH + innerThick / 2,
    outerThick + rowH * 2 + innerThick * 1.5,
    outerThick + rowH * 3 + innerThick * 2.5,
  ];

  shelfYList.forEach((sy) => {
    // Left cubby shelf
    const leftShelf = new THREE.Mesh(
      new THREE.BoxGeometry((cabinetWidth - outerThick * 2 - innerThick) / 2, innerThick, cabinetDepth - 0.01),
      whiteLaminateMat
    );
    leftShelf.position.set(-(cabinetWidth / 4 - 0.005), sy, 0);
    leftShelf.castShadow = true;
    leftShelf.receiveShadow = true;
    cabinetGroup.add(leftShelf);

    // Right cubby shelf
    const rightShelf = new THREE.Mesh(
      new THREE.BoxGeometry((cabinetWidth - outerThick * 2 - innerThick) / 2, innerThick, cabinetDepth - 0.01),
      whiteLaminateMat
    );
    rightShelf.position.set(cabinetWidth / 4 - 0.005, sy, 0);
    rightShelf.castShadow = true;
    rightShelf.receiveShadow = true;
    cabinetGroup.add(rightShelf);
  });

  // Solid White Backing Board
  const backBoard = new THREE.Mesh(
    new THREE.BoxGeometry(cabinetWidth - 0.02, cabinetHeight - 0.02, 0.01),
    new THREE.MeshStandardMaterial({ color: 0xf5f5f5, roughness: 0.45 })
  );
  backBoard.position.set(0, cabinetHeight / 2, -cabinetDepth / 2 + 0.005);
  backBoard.receiveShadow = true;
  cabinetGroup.add(backBoard);

  // Real Madrid crest on the outside of the backing board (faces away from the cubbies)
  const crestTexture = createRealMadridCrestTexture();
  const backCrest = new THREE.Mesh(
    new THREE.PlaneGeometry(0.65 * CREST_ASPECT, 0.65),
    new THREE.MeshStandardMaterial({
      map: crestTexture,
      transparent: true,
      roughness: 0.5,
      metalness: 0.05,
      polygonOffset: true,
      polygonOffsetFactor: -2,
    })
  );
  backCrest.position.set(0, cabinetHeight * 0.56, -cabinetDepth / 2 - 0.0015);
  backCrest.rotation.y = Math.PI;
  cabinetGroup.add(backCrest);

  // 4 Chrome Floor Glides at Bottom Corners
  [
    [-cabinetWidth / 2 + 0.05, -cabinetDepth / 2 + 0.05],
    [cabinetWidth / 2 - 0.05, -cabinetDepth / 2 + 0.05],
    [-cabinetWidth / 2 + 0.05, cabinetDepth / 2 - 0.05],
    [cabinetWidth / 2 - 0.05, cabinetDepth / 2 - 0.05],
  ].forEach(([gx, gz]) => {
    const foot = new THREE.Mesh(
      new THREE.CylinderGeometry(0.022, 0.022, 0.012, 16),
      new THREE.MeshStandardMaterial({ color: 0xd1d5db, metalness: 0.8, roughness: 0.2 })
    );
    foot.position.set(gx, 0.006, gz);
    cabinetGroup.add(foot);
  });

  // Cozy Warm LED Strip on top inner lip
  const warmLed = new THREE.Mesh(
    new THREE.BoxGeometry(cabinetWidth - 0.08, 0.008, 0.015),
    new THREE.MeshStandardMaterial({
      color: 0xfef08a,
      emissive: 0xfef08a,
      emissiveIntensity: 0.6,
    })
  );
  warmLed.position.set(0, cabinetHeight - outerThick - 0.008, cabinetDepth / 2 - 0.03);
  cabinetGroup.add(warmLed);

  // -----------------------------------------------------------
  // 2. TOP SURFACE: 3 TOWERING STACKS OF SHOEBOXES (As in Photo)
  // Sitting on the top surface at y = cabinetHeight = 1.52m
  // -----------------------------------------------------------
  const topY = cabinetHeight;
  const boxW = 0.265; // width of shoebox
  const boxD = 0.36; // depth of shoebox
  const boxH = 0.135; // height of shoebox

  // --- STACK 1 (LEFT STACK: 6 RED/SPORT BOXES) ---
  const stack1X = -0.27;
  let curY1 = topY;

  // 1. Nike Red Box (Base of stack 1)
  const nikeRedTex1 = createNikeRedTexture();
  const nikeRedMat1 = new THREE.MeshStandardMaterial({
    map: nikeRedTex1,
    roughness: 0.5,
  });

  for (let i = 0; i < 4; i++) {
    const nBox = new THREE.Mesh(new THREE.BoxGeometry(boxW, boxH, boxD), nikeRedMat1);
    nBox.position.set(stack1X + (i % 2 === 0 ? 0.005 : -0.005), curY1 + boxH / 2, 0.01 * (i % 2));
    nBox.castShadow = true;
    nBox.receiveShadow = true;
    cabinetGroup.add(nBox);
    curY1 += boxH + 0.002;
  }

  // 5. Crimson Puma / Akka Speed Box
  const akkaBoxMat = new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.6 });
  const akkaBox = new THREE.Mesh(new THREE.BoxGeometry(boxW, boxH, boxD), akkaBoxMat);
  akkaBox.position.set(stack1X, curY1 + boxH / 2, 0);
  akkaBox.castShadow = true;
  akkaBox.receiveShadow = true;
  cabinetGroup.add(akkaBox);
  curY1 += boxH + 0.002;

  // 6. Zocker / KMA Red Sport Box (Top of stack 1)
  const zockerMat = new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.5 });
  const zockerBox = new THREE.Mesh(new THREE.BoxGeometry(boxW, boxH - 0.01, boxD), zockerMat);
  zockerBox.position.set(stack1X, curY1 + (boxH - 0.01) / 2, 0);
  zockerBox.castShadow = true;
  zockerBox.receiveShadow = true;
  cabinetGroup.add(zockerBox);

  // --- STACK 2 (MIDDLE STACK: CHESS, ADIDAS NY 90, NIKE BOXES) ---
  const stack2X = 0.0;
  let curY2 = topY;

  // 1. Nike Bright Orange Box (Base)
  const nikeOrangeTex = createNikeOrangeTexture();
  const nikeOrangeBox = new THREE.Mesh(
    new THREE.BoxGeometry(boxW, boxH, boxD),
    new THREE.MeshStandardMaterial({ map: nikeOrangeTex, roughness: 0.5 })
  );
  nikeOrangeBox.position.set(stack2X, curY2 + boxH / 2, 0);
  nikeOrangeBox.castShadow = true;
  nikeOrangeBox.receiveShadow = true;
  cabinetGroup.add(nikeOrangeBox);
  curY2 += boxH + 0.002;

  // 2 & 3. Nike Red Boxes
  for (let i = 0; i < 2; i++) {
    const nBox = new THREE.Mesh(new THREE.BoxGeometry(boxW, boxH, boxD), nikeRedMat1);
    nBox.position.set(stack2X, curY2 + boxH / 2, 0);
    nBox.castShadow = true;
    nBox.receiveShadow = true;
    cabinetGroup.add(nBox);
    curY2 += boxH + 0.002;
  }

  // 4. Adidas Originals Blue Heritage Box (NY 90 W - Trefoil, 3-Stripes & Spec Label)
  const adidasMats = createAdidasShoeboxMaterials();
  const adidasBox = new THREE.Mesh(
    new THREE.BoxGeometry(boxW, boxH, boxD),
    adidasMats
  );
  adidasBox.position.set(stack2X, curY2 + boxH / 2, 0);
  adidasBox.castShadow = true;
  adidasBox.receiveShadow = true;
  cabinetGroup.add(adidasBox);
  curY2 += boxH + 0.002;

  // 5. Classic Blue "CHESS" Box (Top of stack 2)
  const chessTex = createChessTexture();
  const chessBox = new THREE.Mesh(
    new THREE.BoxGeometry(boxW, boxH - 0.015, boxD),
    new THREE.MeshStandardMaterial({ map: chessTex, roughness: 0.4 })
  );
  chessBox.position.set(stack2X, curY2 + (boxH - 0.015) / 2, 0);
  chessBox.castShadow = true;
  chessBox.receiveShadow = true;
  cabinetGroup.add(chessBox);

  // --- STACK 3 (RIGHT STACK: VANS, MARVEL, YEEZY 380, ROCKIE, BLACK BOX) ---
  const stack3X = 0.27;
  let curY3 = topY;

  // 1. Matte Black Box with White Barcode Label (Base)
  const blackBoxTex = createBlackShoeboxTexture();
  const blackBox = new THREE.Mesh(
    new THREE.BoxGeometry(boxW, boxH, boxD),
    new THREE.MeshStandardMaterial({ map: blackBoxTex, roughness: 0.6 })
  );
  blackBox.position.set(stack3X, curY3 + boxH / 2, 0);
  blackBox.castShadow = true;
  blackBox.receiveShadow = true;
  cabinetGroup.add(blackBox);
  curY3 += boxH + 0.002;

  // 2. Rockie Brown Kraft Cardboard Box
  const rockieTex = createRockieTexture();
  const rockieBox = new THREE.Mesh(
    new THREE.BoxGeometry(boxW, boxH, boxD),
    new THREE.MeshStandardMaterial({ map: rockieTex, roughness: 0.7 })
  );
  rockieBox.position.set(stack3X, curY3 + boxH / 2, 0);
  rockieBox.castShadow = true;
  rockieBox.receiveShadow = true;
  cabinetGroup.add(rockieBox);
  curY3 += boxH + 0.002;

  // 3. Yeezy Boost 380 Natural Kraft Cardboard Drawer Box (Bold "380", "BOOST", & Pull Hole)
  const yeezyMats = createYeezy380ShoeboxMaterials();
  const yeezyBox = new THREE.Mesh(
    new THREE.BoxGeometry(boxW, boxH, boxD),
    yeezyMats
  );
  yeezyBox.position.set(stack3X, curY3 + boxH / 2, 0);
  yeezyBox.castShadow = true;
  yeezyBox.receiveShadow = true;
  cabinetGroup.add(yeezyBox);
  curY3 += boxH + 0.002;

  // 4. Marvel Navy Blue Box
  const marvelTex = createMarvelTexture();
  const marvelBox = new THREE.Mesh(
    new THREE.BoxGeometry(boxW, boxH, boxD),
    new THREE.MeshStandardMaterial({ map: marvelTex, roughness: 0.5 })
  );
  marvelBox.position.set(stack3X, curY3 + boxH / 2, 0);
  marvelBox.castShadow = true;
  marvelBox.receiveShadow = true;
  cabinetGroup.add(marvelBox);
  curY3 += boxH + 0.002;

  // 5. Vans "OFF THE WALL" Iconic Racing Red & Checkerboard Shoebox (Top of stack 3)
  const vansMats = createVansShoeboxMaterials();
  const vansBox = new THREE.Mesh(
    new THREE.BoxGeometry(boxW, boxH - 0.01, boxD),
    vansMats
  );
  vansBox.position.set(stack3X, curY3 + (boxH - 0.01) / 2, 0);
  vansBox.castShadow = true;
  vansBox.receiveShadow = true;
  cabinetGroup.add(vansBox);

  // -----------------------------------------------------------
  // 3. CONTENTS INSIDE THE 8 CUBBIES (Based on User's Photo)
  // Column Centers: Left = -0.21m, Right = +0.21m
  // Row Centers:
  // Row 1 (Top): y ≈ 1.30m
  // Row 2 (Upper-Mid): y ≈ 0.94m
  // Row 3 (Lower-Mid): y ≈ 0.58m
  // Row 4 (Bottom): y ≈ 0.20m
  // -----------------------------------------------------------
  const colLeftX = -0.21;
  const colRightX = 0.21;

  // === ROW 1, LEFT CUBBY: Dried Flower Vase, Amber Candle, UNO & Board Games ===
  const r1LeftY = 1.15; // base of row 1

  // Small ceramic bud vase with dried sprigs
  const vase = new THREE.Mesh(
    new THREE.CylinderGeometry(0.028, 0.042, 0.12, 16),
    new THREE.MeshStandardMaterial({ color: 0xf5ebe0, roughness: 0.4 })
  );
  vase.position.set(colLeftX - 0.09, r1LeftY + 0.06, 0.05);
  cabinetGroup.add(vase);

  // Dried floral sprigs in vase
  for (let i = 0; i < 4; i++) {
    const stem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.002, 0.003, 0.14, 6),
      new THREE.MeshStandardMaterial({ color: 0xa8a29e, roughness: 0.9 })
    );
    stem.rotation.z = -0.15 + i * 0.1;
    stem.rotation.x = -0.1 + i * 0.08;
    stem.position.set(colLeftX - 0.09 + (i - 1.5) * 0.01, r1LeftY + 0.17, 0.05);
    cabinetGroup.add(stem);

    // Floral tip
    const flowerBud = new THREE.Mesh(
      new THREE.SphereGeometry(0.01, 8, 8),
      new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.9 })
    );
    flowerBud.position.set(stem.position.x, stem.position.y + 0.07, stem.position.z);
    cabinetGroup.add(flowerBud);
  }

  // Amber glass scented candle with wooden lid
  const candleJar = new THREE.Mesh(
    new THREE.CylinderGeometry(0.04, 0.04, 0.08, 16),
    new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.3, transparent: true, opacity: 0.85 })
  );
  candleJar.position.set(colLeftX + 0.08, r1LeftY + 0.04, 0.06);
  cabinetGroup.add(candleJar);

  const candleLid = new THREE.Mesh(
    new THREE.CylinderGeometry(0.042, 0.042, 0.012, 16),
    new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.7 })
  );
  candleLid.position.set(colLeftX + 0.08, r1LeftY + 0.086, 0.06);
  cabinetGroup.add(candleLid);

  // Stack of party card games: Like a Fish, Do or Drink, and UNO
  const boardGame1 = new THREE.Mesh(
    new THREE.BoxGeometry(0.14, 0.035, 0.18),
    new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.6 }) // Like a fish
  );
  boardGame1.position.set(colLeftX, r1LeftY + 0.018, -0.04);
  cabinetGroup.add(boardGame1);

  const boardGame2 = new THREE.Mesh(
    new THREE.BoxGeometry(0.13, 0.035, 0.17),
    new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.6 }) // Do or Drink
  );
  boardGame2.position.set(colLeftX, r1LeftY + 0.053, -0.04);
  cabinetGroup.add(boardGame2);

  const unoTex = createUnoTexture();
  const unoBox = new THREE.Mesh(
    new THREE.BoxGeometry(0.11, 0.035, 0.15),
    new THREE.MeshStandardMaterial({ map: unoTex, roughness: 0.5 })
  );
  unoBox.position.set(colLeftX, r1LeftY + 0.088, -0.04);
  cabinetGroup.add(unoBox);

  // Mini collectible anime figurine on top of UNO box
  const miniFigurine = new THREE.Group();
  miniFigurine.position.set(colLeftX, r1LeftY + 0.106, -0.04);
  const figBody = new THREE.Mesh(
    new THREE.CylinderGeometry(0.015, 0.02, 0.045, 10),
    new THREE.MeshStandardMaterial({ color: 0xec4899, roughness: 0.5 })
  );
  figBody.position.set(0, 0.022, 0);
  miniFigurine.add(figBody);
  const figHead = new THREE.Mesh(
    new THREE.SphereGeometry(0.018, 12, 12),
    new THREE.MeshStandardMaterial({ color: 0xfed7aa, roughness: 0.6 })
  );
  figHead.position.set(0, 0.055, 0);
  miniFigurine.add(figHead);
  cabinetGroup.add(miniFigurine);

  // Pack of Magic Relighting Candles leaning against the back
  const candlePack = new THREE.Mesh(
    new THREE.BoxGeometry(0.12, 0.16, 0.01),
    new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.5 })
  );
  candlePack.rotation.x = -0.15;
  candlePack.position.set(colLeftX - 0.02, r1LeftY + 0.09, -0.14);
  cabinetGroup.add(candlePack);

  // === ROW 1, RIGHT CUBBY: Skincare & Daily Grooming Collection ===
  const r1RightY = 1.15;

  // 1. La Roche-Posay Thermal Cleanser Bottle (Tall cobalt blue bottle with white pump)
  const lrpBottle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.026, 0.026, 0.15, 16),
    new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.35 })
  );
  lrpBottle.position.set(colRightX - 0.08, r1RightY + 0.075, -0.02);
  cabinetGroup.add(lrpBottle);

  // White label wrap on bottle
  const lrpLabel = new THREE.Mesh(
    new THREE.CylinderGeometry(0.0265, 0.0265, 0.08, 16),
    new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 })
  );
  lrpLabel.position.set(colRightX - 0.08, r1RightY + 0.07, -0.02);
  cabinetGroup.add(lrpLabel);

  // White pump dispenser & collar
  const lrpPump = new THREE.Mesh(
    new THREE.CylinderGeometry(0.015, 0.02, 0.025, 12),
    new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3 })
  );
  lrpPump.position.set(colRightX - 0.08, r1RightY + 0.162, -0.02);
  cabinetGroup.add(lrpPump);

  const lrpNozzle = new THREE.Mesh(
    new THREE.BoxGeometry(0.01, 0.008, 0.022),
    new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3 })
  );
  lrpNozzle.position.set(colRightX - 0.08, r1RightY + 0.176, -0.01);
  cabinetGroup.add(lrpNozzle);

  // 2. Clear Mist / Toner Spray Bottle (Frosted translucent bottle)
  const tonerBottle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.024, 0.024, 0.13, 16),
    new THREE.MeshStandardMaterial({ color: 0xe0f2fe, roughness: 0.2, transparent: true, opacity: 0.75 })
  );
  tonerBottle.position.set(colRightX + 0.01, r1RightY + 0.065, -0.04);
  cabinetGroup.add(tonerBottle);

  const sprayCollar = new THREE.Mesh(
    new THREE.CylinderGeometry(0.018, 0.018, 0.016, 12),
    new THREE.MeshStandardMaterial({ color: 0xd4d4d8, metalness: 0.85, roughness: 0.2 })
  );
  sprayCollar.position.set(colRightX + 0.01, r1RightY + 0.138, -0.04);
  cabinetGroup.add(sprayCollar);

  const sprayCap = new THREE.Mesh(
    new THREE.CylinderGeometry(0.02, 0.02, 0.035, 12),
    new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3, transparent: true, opacity: 0.6 })
  );
  sprayCap.position.set(colRightX + 0.01, r1RightY + 0.162, -0.04);
  cabinetGroup.add(sprayCap);

  // 3. Hair Pomade / Clay Tub (Matte black jar with silver screw lid)
  const pomadeJar = new THREE.Mesh(
    new THREE.CylinderGeometry(0.038, 0.038, 0.03, 18),
    new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.5 })
  );
  pomadeJar.position.set(colRightX + 0.09, r1RightY + 0.015, 0.06);
  cabinetGroup.add(pomadeJar);

  const pomadeLid = new THREE.Mesh(
    new THREE.CylinderGeometry(0.039, 0.039, 0.008, 18),
    new THREE.MeshStandardMaterial({ color: 0xd4d4d8, metalness: 0.8, roughness: 0.25 })
  );
  pomadeLid.position.set(colRightX + 0.09, r1RightY + 0.032, 0.06);
  cabinetGroup.add(pomadeLid);

  const pomadeLabel = new THREE.Mesh(
    new THREE.CylinderGeometry(0.032, 0.032, 0.001, 16),
    new THREE.MeshStandardMaterial({ color: 0x27272a, roughness: 0.7 })
  );
  pomadeLabel.position.set(colRightX + 0.09, r1RightY + 0.0365, 0.06);
  cabinetGroup.add(pomadeLabel);

  // 4. Compact Modern Grooming Shaver / AirPods Case
  const shaverCase = new THREE.Mesh(
    new THREE.BoxGeometry(0.06, 0.024, 0.085),
    new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.35 })
  );
  shaverCase.position.set(colRightX - 0.06, r1RightY + 0.012, 0.08);
  cabinetGroup.add(shaverCase);

  const shaverHead = new THREE.Mesh(
    new THREE.CylinderGeometry(0.008, 0.008, 0.048, 8),
    new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.2 })
  );
  shaverHead.rotation.z = Math.PI / 2;
  shaverHead.position.set(colRightX - 0.06, r1RightY + 0.024, 0.08);
  cabinetGroup.add(shaverHead);

  // === ROW 2, LEFT CUBBY: Soju Bottles, Aquafina Water, Figure Box, MacBook Box ===
  const r2LeftY = 0.78; // base of row 2

  // 1. Korean Soju Green Glass Bottles (2 bottles side-by-side)
  const sojuTex = createSojuLabelTexture();
  [-0.04, 0.04].forEach((sx) => {
    const sojuBottle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.026, 0.03, 0.17, 16),
      new THREE.MeshStandardMaterial({ color: 0x059669, roughness: 0.25, transparent: true, opacity: 0.85 })
    );
    sojuBottle.position.set(colLeftX - 0.06 + sx, r2LeftY + 0.085, 0.05);
    cabinetGroup.add(sojuBottle);

    // Bottle neck & green cap
    const neck = new THREE.Mesh(
      new THREE.CylinderGeometry(0.012, 0.018, 0.05, 12),
      new THREE.MeshStandardMaterial({ color: 0x059669, roughness: 0.25, transparent: true, opacity: 0.85 })
    );
    neck.position.set(colLeftX - 0.06 + sx, r2LeftY + 0.185, 0.05);
    cabinetGroup.add(neck);

    const cap = new THREE.Mesh(
      new THREE.CylinderGeometry(0.013, 0.013, 0.02, 12),
      new THREE.MeshStandardMaterial({ color: 0x10b981, roughness: 0.5 })
    );
    cap.position.set(colLeftX - 0.06 + sx, r2LeftY + 0.21, 0.05);
    cabinetGroup.add(cap);

    // Label
    const labelMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.029, 0.029, 0.07, 16, 1, true, 0, Math.PI),
      new THREE.MeshStandardMaterial({ map: sojuTex, roughness: 0.5 })
    );
    labelMesh.position.set(colLeftX - 0.06 + sx, r2LeftY + 0.085, 0.05);
    labelMesh.rotation.y = Math.PI / 2;
    cabinetGroup.add(labelMesh);
  });

  // 2. Aquafina Water Bottle (Clear bottle with bright blue cap)
  const waterBottle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.032, 0.032, 0.19, 16),
    new THREE.MeshStandardMaterial({ color: 0xf0fdf4, roughness: 0.15, transparent: true, opacity: 0.7 })
  );
  waterBottle.position.set(colLeftX + 0.08, r2LeftY + 0.095, 0.05);
  cabinetGroup.add(waterBottle);

  const waterCap = new THREE.Mesh(
    new THREE.CylinderGeometry(0.016, 0.016, 0.02, 12),
    new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.4 })
  );
  waterCap.position.set(colLeftX + 0.08, r2LeftY + 0.195, 0.05);
  cabinetGroup.add(waterCap);

  // 3. King Kong / MonsterVerse Collector Figure Box
  const figureBox = new THREE.Mesh(
    new THREE.BoxGeometry(0.12, 0.22, 0.14),
    new THREE.MeshStandardMaterial({ color: 0x374151, roughness: 0.5 })
  );
  figureBox.position.set(colLeftX - 0.04, r2LeftY + 0.11, -0.09);
  cabinetGroup.add(figureBox);

  // 4. Slim White Apple MacBook Pro Retail Box (Standing vertically on its edge)
  const macTex = createMacBookBoxTexture();
  const macBox = new THREE.Mesh(
    new THREE.BoxGeometry(0.038, 0.26, 0.19),
    new THREE.MeshStandardMaterial({ map: macTex, roughness: 0.35 })
  );
  macBox.position.set(colLeftX + 0.11, r2LeftY + 0.13, -0.07);
  cabinetGroup.add(macBox);

  // === ROW 2, RIGHT CUBBY: Solid Minimalist 3-Drawer Organizer, Vanity Mirror, Stationery ===
  const r2RightY = 0.78;

  // Solid Minimalist 3-Drawer Desktop Organizer (Opaque Nordic Warm White)
  const drawerUnitGroup = new THREE.Group();
  drawerUnitGroup.position.set(colRightX - 0.04, r2RightY, -0.02);

  const orgW = 0.16;
  const orgH = 0.17;
  const orgD = 0.22;

  // Solid opaque outer cabinet shell
  const cabinetOuterMat = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    roughness: 0.35,
  });
  const drawerFaceMat = new THREE.MeshStandardMaterial({
    color: 0xf1f5f9,
    roughness: 0.4,
  });
  const handleMat = new THREE.MeshStandardMaterial({
    color: 0xd4d4d8,
    metalness: 0.85,
    roughness: 0.2,
  });

  const cabinetShell = new THREE.Mesh(
    new THREE.BoxGeometry(orgW, orgH, orgD),
    cabinetOuterMat
  );
  cabinetShell.position.set(0, orgH / 2, 0);
  cabinetShell.castShadow = true;
  cabinetShell.receiveShadow = true;
  drawerUnitGroup.add(cabinetShell);

  // 3 Distinct Solid Drawer Faces with subtle dark reveal seams
  const numDrawers = 3;
  const drawerH = 0.05;
  for (let d = 0; d < numDrawers; d++) {
    const curY = 0.012 + d * (drawerH + 0.005) + drawerH / 2;

    // Solid drawer faceplate
    const dFace = new THREE.Mesh(
      new THREE.BoxGeometry(orgW - 0.012, drawerH, 0.006),
      drawerFaceMat
    );
    dFace.position.set(0, curY, orgD / 2 + 0.002);
    dFace.castShadow = true;
    drawerUnitGroup.add(dFace);

    // Brushed aluminum sleek bar handle
    const handle = new THREE.Mesh(
      new THREE.BoxGeometry(0.038, 0.008, 0.01),
      handleMat
    );
    handle.position.set(0, curY, orgD / 2 + 0.009);
    drawerUnitGroup.add(handle);
  }

  // Small accessory on top of organizer: Minimalist leather catchall tray with brass key
  const tray = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, 0.008, 0.10),
    new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.85 })
  );
  tray.position.set(0, orgH + 0.004, 0);
  drawerUnitGroup.add(tray);

  cabinetGroup.add(drawerUnitGroup);

  // Modern Minimalist Vanity / Desk Mirror with LED ring bezel
  const mirrorGroup = new THREE.Group();
  mirrorGroup.position.set(colRightX + 0.09, r2RightY, 0.05);

  // Matte white disc base
  const mirrorBase = new THREE.Mesh(
    new THREE.CylinderGeometry(0.042, 0.042, 0.008, 24),
    new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.35 })
  );
  mirrorBase.position.set(0, 0.004, 0);
  mirrorGroup.add(mirrorBase);

  // Brushed aluminum stem
  const mirrorStem = new THREE.Mesh(
    new THREE.CylinderGeometry(0.0035, 0.0035, 0.13, 12),
    new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.85, roughness: 0.2 })
  );
  mirrorStem.position.set(0, 0.07, 0);
  mirrorGroup.add(mirrorStem);

  // Mirror head assembly (tilted slightly back for natural viewing angle)
  const mirrorHead = new THREE.Group();
  mirrorHead.position.set(0, 0.135, 0);
  mirrorHead.rotation.x = -0.15; // Natural backward tilt

  // White back casing
  const mirrorBack = new THREE.Mesh(
    new THREE.CylinderGeometry(0.052, 0.052, 0.008, 24),
    new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.35 })
  );
  mirrorBack.rotation.x = Math.PI / 2;
  mirrorHead.add(mirrorBack);

  // Warm-white soft LED glow ring
  const ledRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.047, 0.0025, 8, 24),
    new THREE.MeshStandardMaterial({
      color: 0xfef9c3,
      emissive: 0xfef08a,
      emissiveIntensity: 0.35,
      roughness: 0.4,
    })
  );
  ledRing.position.set(0, 0, 0.0042);
  mirrorHead.add(ledRing);

  // Reflective mirror face (clean silver-cyan glass tint, never solid black)
  const mirrorGlass = new THREE.Mesh(
    new THREE.CylinderGeometry(0.044, 0.044, 0.002, 24),
    new THREE.MeshStandardMaterial({
      color: 0xeff6ff,
      metalness: 0.45,
      roughness: 0.18,
    })
  );
  mirrorGlass.rotation.x = Math.PI / 2;
  mirrorGlass.position.set(0, 0, 0.005);
  mirrorHead.add(mirrorGlass);

  mirrorGroup.add(mirrorHead);
  cabinetGroup.add(mirrorGroup);

  // Container with colorful highlighters & cables
  const penCup = new THREE.Mesh(
    new THREE.CylinderGeometry(0.03, 0.03, 0.07, 16),
    new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.6 })
  );
  penCup.position.set(colRightX + 0.08, r2RightY + 0.035, -0.09);
  cabinetGroup.add(penCup);

  // 3 colorful pens
  const penColors = [0x22c55e, 0xfacc15, 0xec4899];
  penColors.forEach((pColor, idx) => {
    const pen = new THREE.Mesh(
      new THREE.CylinderGeometry(0.004, 0.004, 0.11, 8),
      new THREE.MeshStandardMaterial({ color: pColor, roughness: 0.5 })
    );
    pen.rotation.z = -0.15 + idx * 0.15;
    pen.position.set(colRightX + 0.075 + idx * 0.008, r2RightY + 0.09, -0.09);
    cabinetGroup.add(pen);
  });

  // === ROW 3, LEFT CUBBY: Minimalist Sneakers & Storage Basket ===
  const r3LeftY = 0.41;

  // Pair of clean white minimalist sneakers (Stan Smith / Air Force 1 style)
  [-0.045, 0.045].forEach((sx) => {
    const sneakerGroup = new THREE.Group();
    sneakerGroup.position.set(colLeftX + sx, r3LeftY + 0.035, 0.02);

    // Sole
    const sole = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.025, 0.22),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 })
    );
    sneakerGroup.add(sole);

    // Upper
    const upper = new THREE.Mesh(
      new THREE.BoxGeometry(0.076, 0.045, 0.20),
      new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.35 })
    );
    upper.position.set(0, 0.03, -0.01);
    sneakerGroup.add(upper);

    // Green heel tab (Stan Smith accent)
    const heelTab = new THREE.Mesh(
      new THREE.BoxGeometry(0.05, 0.02, 0.008),
      new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.5 })
    );
    heelTab.position.set(0, 0.045, -0.105);
    sneakerGroup.add(heelTab);

    cabinetGroup.add(sneakerGroup);
  });

  // === ROW 3, RIGHT CUBBY: Stack of Design Books, Studio Headphones & Art Toy ===
  const r3RightY = 0.41;

  // Stack of 3 iconic coffee table art & sneaker culture books
  const designBooks = [
    { color: 0x09090b, h: 0.032, w: 0.18, l: 0.24, spineColor: 0x84cc16 }, // Virgil Abloh: ICONS (Black with Neon Green spine)
    { color: 0x991b1b, h: 0.034, w: 0.17, l: 0.23, spineColor: 0xf59e0b }, // Sneaker Freaker (Crimson Red with Gold spine)
    { color: 0xf8fafc, h: 0.026, w: 0.16, l: 0.22, spineColor: 0xdc2626 }, // Supreme Vol 2 (Clean White with Red Box Logo)
  ];
  let by3 = r3RightY;
  designBooks.forEach((book) => {
    // Book body
    const bMesh = new THREE.Mesh(
      new THREE.BoxGeometry(book.w, book.h, book.l),
      new THREE.MeshStandardMaterial({ color: book.color, roughness: 0.45 })
    );
    bMesh.position.set(colRightX - 0.015, by3 + book.h / 2, 0);
    bMesh.castShadow = true;
    bMesh.receiveShadow = true;
    cabinetGroup.add(bMesh);

    // Spine accent stripe
    const spineStripe = new THREE.Mesh(
      new THREE.BoxGeometry(0.005, book.h * 0.75, book.l - 0.02),
      new THREE.MeshStandardMaterial({ color: book.spineColor, roughness: 0.4 })
    );
    spineStripe.position.set(colRightX - 0.015 - book.w / 2 + 0.002, by3 + book.h / 2, 0);
    cabinetGroup.add(spineStripe);

    by3 += book.h + 0.002;
  });

  // Sleek Folded Wireless Havit H630BT (Cream) Headphones resting flat on top of the books
  const hpGroup = new THREE.Group();
  hpGroup.position.set(colRightX - 0.015, by3, 0);
  hpGroup.scale.set(1.25, 1.25, 1.25);

  // Curved Headband arch in cream
  const hpBand = new THREE.Mesh(
    new THREE.TorusGeometry(0.048, 0.005, 8, 20, Math.PI),
    new THREE.MeshStandardMaterial({ color: 0xf6efe5, roughness: 0.38 })
  );
  hpBand.rotation.x = Math.PI / 2;
  hpBand.position.set(0, 0.005, -0.02);
  hpGroup.add(hpBand);

  // Left and right cushioned oval earcups resting flat
  [-0.048, 0.048].forEach((ex) => {
    // Stainless steel folding pivot hinge
    const hinge = new THREE.Mesh(
      new THREE.CylinderGeometry(0.004, 0.004, 0.008, 8),
      new THREE.MeshStandardMaterial({ color: 0xd6d6dc, metalness: 0.85, roughness: 0.20 })
    );
    hinge.position.set(ex, 0.007, -0.02);
    hpGroup.add(hinge);

    // Outer shell in cream - oval capsule
    const cup = new THREE.Mesh(
      new THREE.CylinderGeometry(0.022, 0.022, 0.012, 16),
      new THREE.MeshStandardMaterial({ color: 0xf6efe5, roughness: 0.38 })
    );
    cup.scale.set(1.0, 1.0, 1.30); // true oval shape
    cup.position.set(ex, 0.007, 0.01);
    hpGroup.add(cup);

    // Soft memory foam leather ear cushion in beige cream
    const cushion = new THREE.Mesh(
      new THREE.TorusGeometry(0.018, 0.005, 8, 16),
      new THREE.MeshStandardMaterial({ color: 0xeee4d5, roughness: 0.85 })
    );
    cushion.rotation.x = Math.PI / 2;
    cushion.scale.set(1.0, 1.30, 1.0); // oval cushion
    cushion.position.set(ex, 0.014, 0.01);
    hpGroup.add(cushion);
  });
  cabinetGroup.add(hpGroup);

  // Designer Art Collectible Toy (Bearbrick 100% style in obsidian gloss) standing stably beside the books on the shelf floor
  const artToy = new THREE.Group();
  artToy.position.set(colRightX + 0.105, r3RightY, -0.02);

  // Dual Legs
  [-0.012, 0.012].forEach((lx) => {
    const leg = new THREE.Mesh(
      new THREE.CylinderGeometry(0.008, 0.009, 0.045, 12),
      new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.25 })
    );
    leg.position.set(lx, 0.0225, 0);
    artToy.add(leg);
  });

  // Torso & Arms
  const toyTorso = new THREE.Mesh(
    new THREE.BoxGeometry(0.038, 0.05, 0.024),
    new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.25 })
  );
  toyTorso.position.set(0, 0.068, 0);
  artToy.add(toyTorso);

  [-0.023, 0.023].forEach((ax) => {
    const arm = new THREE.Mesh(
      new THREE.CylinderGeometry(0.006, 0.007, 0.04, 8),
      new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.25 })
    );
    arm.position.set(ax, 0.068, 0);
    artToy.add(arm);
  });

  // Head
  const toyHead = new THREE.Mesh(
    new THREE.SphereGeometry(0.019, 16, 16),
    new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.25 })
  );
  toyHead.position.set(0, 0.108, 0);
  artToy.add(toyHead);

  // Signature Round Bear Ears
  [-0.014, 0.014].forEach((earX) => {
    const ear = new THREE.Mesh(
      new THREE.SphereGeometry(0.008, 12, 12),
      new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.25 })
    );
    ear.position.set(earX, 0.124, 0);
    artToy.add(ear);
  });

  cabinetGroup.add(artToy);

  // === ROW 4, LEFT CUBBY: Sneaker Care Cleaning Kit ===
  const r4LeftY = 0.04;

  // Crep Protect / Jason Markk cleaning spray can
  const cleanerCan = new THREE.Mesh(
    new THREE.CylinderGeometry(0.028, 0.028, 0.15, 16),
    new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.7, roughness: 0.3 })
  );
  cleanerCan.position.set(colLeftX - 0.06, r4LeftY + 0.075, 0.04);
  cabinetGroup.add(cleanerCan);

  // Hog bristle wooden cleaning brush
  const brushWood = new THREE.Mesh(
    new THREE.BoxGeometry(0.05, 0.025, 0.12),
    new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.7 })
  );
  brushWood.position.set(colLeftX + 0.05, r4LeftY + 0.025, 0.04);
  cabinetGroup.add(brushWood);

  // Brush bristles
  const bristles = new THREE.Mesh(
    new THREE.BoxGeometry(0.046, 0.015, 0.11),
    new THREE.MeshStandardMaterial({ color: 0x1c1917, roughness: 0.9 })
  );
  bristles.position.set(colLeftX + 0.05, r4LeftY + 0.007, 0.04);
  cabinetGroup.add(bristles);

  // Folded microfiber towel roll
  const towelRoll = new THREE.Mesh(
    new THREE.CylinderGeometry(0.035, 0.035, 0.14, 16),
    new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.95 })
  );
  towelRoll.rotation.x = Math.PI / 2;
  towelRoll.position.set(colLeftX, r4LeftY + 0.035, -0.07);
  cabinetGroup.add(towelRoll);

  // === ROW 4, RIGHT CUBBY: Marshall Emberton II Bluetooth Speaker & Lifestyle Sunglasses ===
  const r4RightY = 0.04;

  const spGroup = new THREE.Group();
  spGroup.position.set(colRightX - 0.03, r4RightY, 0);

  const spW = 0.165;
  const spH = 0.078;
  const spD = 0.082;

  // 1. Black Textured Vinyl / Silicone Speaker Cabinet Body
  const spCabinet = new THREE.Mesh(
    new THREE.BoxGeometry(spW, spH, spD),
    new THREE.MeshStandardMaterial({
      color: 0x18181b,
      roughness: 0.8,
    })
  );
  spCabinet.position.set(0, spH / 2, 0);
  spCabinet.castShadow = true;
  spCabinet.receiveShadow = true;
  spGroup.add(spCabinet);

  // 2. Brass Perimeter Inset Bezel on front face
  const brassBezel = new THREE.Mesh(
    new THREE.BoxGeometry(spW - 0.012, spH - 0.012, 0.003),
    new THREE.MeshStandardMaterial({
      color: 0xd97706,
      metalness: 0.9,
      roughness: 0.2,
    })
  );
  brassBezel.position.set(0, spH / 2, spD / 2 + 0.001);
  spGroup.add(brassBezel);

  // 3. Vintage Woven Metal Fret Mesh Grille
  const grilleMesh = new THREE.Mesh(
    new THREE.BoxGeometry(spW - 0.018, spH - 0.018, 0.004),
    new THREE.MeshStandardMaterial({
      color: 0x52525b,
      metalness: 0.7,
      roughness: 0.35,
    })
  );
  grilleMesh.position.set(0, spH / 2, spD / 2 + 0.003);
  spGroup.add(grilleMesh);

  // 4. Iconic Gold Marshall Center Script Emblem
  const emblem = new THREE.Mesh(
    new THREE.BoxGeometry(0.048, 0.014, 0.005),
    new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      metalness: 0.95,
      roughness: 0.15,
    })
  );
  emblem.position.set(0, spH / 2, spD / 2 + 0.0055);
  spGroup.add(emblem);

  // 5. Top Control Plate & Brass Multi-Directional Knob
  const topPlate = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, 0.002, 0.035),
    new THREE.MeshStandardMaterial({ color: 0x27272a, roughness: 0.5 })
  );
  topPlate.position.set(0, spH + 0.001, 0);
  spGroup.add(topPlate);

  const brassKnob = new THREE.Mesh(
    new THREE.CylinderGeometry(0.01, 0.01, 0.006, 16),
    new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      metalness: 0.9,
      roughness: 0.2,
    })
  );
  brassKnob.position.set(0, spH + 0.004, 0);
  spGroup.add(brassKnob);

  // Red LED Battery Level bar (3 micro lights)
  [-0.024, -0.02, -0.016].forEach((lx) => {
    const ledDot = new THREE.Mesh(
      new THREE.BoxGeometry(0.002, 0.002, 0.006),
      new THREE.MeshStandardMaterial({
        color: 0xef4444,
        emissive: 0xdc2626,
        emissiveIntensity: 0.8,
      })
    );
    ledDot.position.set(lx, spH + 0.002, 0);
    spGroup.add(ledDot);
  });

  // Bluetooth button
  const btBtn = new THREE.Mesh(
    new THREE.CylinderGeometry(0.004, 0.004, 0.003, 10),
    new THREE.MeshStandardMaterial({ color: 0x3f3f46, roughness: 0.6 })
  );
  btBtn.position.set(0.024, spH + 0.002, 0);
  spGroup.add(btBtn);

  // 6. Anti-vibration bottom rubber feet
  [-spW / 2 + 0.02, spW / 2 - 0.02].forEach((fx) => {
    [-spD / 2 + 0.015, spD / 2 - 0.015].forEach((fz) => {
      const foot = new THREE.Mesh(
        new THREE.CylinderGeometry(0.007, 0.007, 0.004, 10),
        new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.9 })
      );
      foot.position.set(fx, 0.002, fz);
      spGroup.add(foot);
    });
  });

  cabinetGroup.add(spGroup);

  // Lifestyle Folded Sunglasses resting neatly beside the speaker
  const sunGroup = new THREE.Group();
  sunGroup.position.set(colRightX + 0.09, r4RightY + 0.008, 0.02);
  sunGroup.rotation.y = 0.35;

  const sunglassMat = new THREE.MeshStandardMaterial({ color: 0x1e1b4b, roughness: 0.3 });
  const lensMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    metalness: 0.7,
    roughness: 0.1,
  });

  // Dual lens frames
  [-0.022, 0.022].forEach((lx) => {
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.016, 0.003, 8, 16), sunglassMat);
    rim.position.set(lx, 0.01, 0);
    sunGroup.add(rim);

    const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.002, 16), lensMat);
    lens.rotation.x = Math.PI / 2;
    lens.position.set(lx, 0.01, 0);
    sunGroup.add(lens);
  });

  // Nose bridge
  const bridge = new THREE.Mesh(
    new THREE.BoxGeometry(0.014, 0.003, 0.003),
    new THREE.MeshStandardMaterial({ color: 0xd4d4d8, metalness: 0.9, roughness: 0.2 })
  );
  bridge.position.set(0, 0.014, 0);
  sunGroup.add(bridge);

  cabinetGroup.add(sunGroup);

  // -----------------------------------------------------------
  // INTERACTION USER DATA
  // -----------------------------------------------------------
  cabinetGroup.userData = {
    isClickable: true,
    workstationItem: 'sneaker-shelf',
    label: '👟 Tủ Giày 8 Hộc & Bộ Sưu Tập Hộp Giày (Nike, Adidas, Yeezy 380, Vans)',
  };

  return cabinetGroup;
}
