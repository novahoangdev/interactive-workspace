import * as THREE from 'three';
import { soundManager } from '../utils/soundManager';
import { createSneakerCabinet } from './sneakerCabinet';

export interface WorkstationState {
  lampOn: boolean;
  lampMode: 'warm' | 'cool' | 'cyber';
  screenbarOn: boolean;
  mainScreenMode: number; // 0: VS Code, 1: Terminal, 2: Cyber Matrix
  verticalScreenMode: number; // 0: Git & System, 1: Tech Stack Radar
  speakerPlaying: boolean;
  pcColorIdx: number;
  chairSwivelTarget: number;
  deskElevation: number;
  deskElevationTarget: number;
  deskIsElevated: boolean;
  deskCurrentHeightCm: number;
}

export interface WorkstationInstance {
  group: THREE.Group;
  tick: (elapsedTime: number) => void;
  interact: (itemType: string) => { title: string; message: string; icon?: string };
  getState: () => WorkstationState;
}

// Helper to construct 2D rounded rectangle shape for authentic Apple device corner curvature
function createRoundedRectShape(w: number, h: number, r: number): THREE.Shape {
  const shape = new THREE.Shape();
  const x = -w / 2;
  const y = -h / 2;
  const rad = Math.min(r, w / 2, h / 2);
  shape.moveTo(x + rad, y);
  shape.lineTo(x + w - rad, y);
  shape.quadraticCurveTo(x + w, y, x + w, y + rad);
  shape.lineTo(x + w, y + h - rad);
  shape.quadraticCurveTo(x + w, y + h, x + w - rad, y + h);
  shape.lineTo(x + rad, y + h);
  shape.quadraticCurveTo(x, y + h, x, y + h - rad);
  shape.lineTo(x, y + rad);
  shape.quadraticCurveTo(x, y, x + rad, y);
  return shape;
}

// Draw authentic mirrored chrome Apple logo emblem on high-res canvas for MacBook lid back
function drawAppleLogoBack(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const w = canvas.width;
  const h = canvas.height;

  // 1. Transparent background
  ctx.clearRect(0, 0, w, h);

  // Canonical Apple logo SVG path (viewBox 0 0 384 512, top leaf pointing right, bite on right)
  const appleSvg =
    'M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z';

  const s = (w / 512) * 0.72;
  const targetW = 384 * s;
  const targetH = 512 * s;
  const offsetX = (w - targetW) / 2;
  const offsetY = (h - targetH) / 2;

  ctx.save();
  ctx.translate(offsetX, offsetY);
  ctx.scale(s, s);

  // Brilliant polished mirror-chrome linear gradient with specular highlights
  const chromeGrad = ctx.createLinearGradient(0, 0, 384, 512);
  chromeGrad.addColorStop(0, '#ffffff');
  chromeGrad.addColorStop(0.18, '#f8fafc');
  chromeGrad.addColorStop(0.42, '#cbd5e1');
  chromeGrad.addColorStop(0.65, '#94a3b8');
  chromeGrad.addColorStop(0.85, '#e2e8f0');
  chromeGrad.addColorStop(1, '#ffffff');

  const path = new Path2D(appleSvg);
  ctx.fillStyle = chromeGrad;
  ctx.fill(path);

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
  ctx.lineWidth = 2;
  ctx.stroke(path);

  ctx.restore();
}

// Draw authentic Apple Magic Keyboard with Touch ID, full-height Function row, and stereo speakers
function drawMacBookKeyboard(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const w = canvas.width;
  const h = canvas.height;

  // 1. Deep Obsidian / Space Gray Anodized Keyboard Basin
  ctx.fillStyle = '#060810';
  ctx.fillRect(0, 0, w, h);

  // Subtle metallic texture gradient
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, 'rgba(255, 255, 255, 0.04)');
  grad.addColorStop(0.5, 'rgba(0, 0, 0, 0.25)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0.65)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Helper for rounded rectangle across canvas implementations
  const drawRRect = (x: number, y: number, rw: number, rh: number, r: number) => {
    if (typeof ctx.roundRect === 'function') {
      ctx.beginPath();
      ctx.roundRect(x, y, rw, rh, r);
    } else {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + rw - r, y);
      ctx.quadraticCurveTo(x + rw, y, x + rw, y + r);
      ctx.lineTo(x + rw, y + rh - r);
      ctx.quadraticCurveTo(x + rw, y + rh, x + rw - r, y + rh);
      ctx.lineTo(x + r, y + rh);
      ctx.quadraticCurveTo(x, y + rh, x, y + rh - r);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.closePath();
    }
  };

  // 2. Dual Stereo Acoustic Speaker Grilles (Left and Right flanks of the keyboard)
  const drawSpeakerGrille = (startX: number, endX: number) => {
    const colCount = 10;
    const rowCount = 42;
    const colWidth = (endX - startX) / colCount;
    const rowHeight = (h - 60) / rowCount;

    for (let r = 0; r < rowCount; r++) {
      for (let c = 0; c < colCount; c++) {
        const cx = startX + c * colWidth + (r % 2 === 0 ? 0 : colWidth * 0.5);
        const cy = 30 + r * rowHeight;
        if (cx > endX - 2) continue;

        ctx.fillStyle = '#020306';
        ctx.beginPath();
        ctx.arc(cx, cy, 1.8, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.beginPath();
        ctx.arc(cx, cy - 0.5, 0.8, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  };

  drawSpeakerGrille(24, 150);
  drawSpeakerGrille(1898, 2024);

  // 3. Apple Magic Keyboard Layout
  const kx = 168;
  const ky = 16;
  const kw = 1712;
  const kh = 668;

  // Inner recessed border around the keyboard well
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.lineWidth = 1.5;
  drawRRect(kx - 4, ky - 4, kw + 8, kh + 8, 10);
  ctx.stroke();

  // Keycap drawing helper
  const drawKeycap = (
    x: number,
    y: number,
    wKey: number,
    hKey: number,
    primaryText: string,
    secondaryText = '',
    options?: {
      isTouchId?: boolean;
      hasGreenLed?: boolean;
      hasTactileBump?: boolean;
      alignLeft?: boolean;
      fontSize?: number;
    }
  ) => {
    // Underglow backlight
    ctx.fillStyle = 'rgba(240, 246, 255, 0.035)';
    drawRRect(x - 1, y - 1, wKey + 2, hKey + 2, 8);
    ctx.fill();

    // Key body with realistic tactile matte gradient
    const keyGrad = ctx.createLinearGradient(x, y, x, y + hKey);
    keyGrad.addColorStop(0, '#1c222f');
    keyGrad.addColorStop(0.35, '#151924');
    keyGrad.addColorStop(1, '#0e121b');
    ctx.fillStyle = keyGrad;
    drawRRect(x, y, wKey, hKey, 6);
    ctx.fill();

    // Top rim specular reflection
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
    ctx.lineWidth = 1;
    drawRRect(x + 0.5, y + 0.5, wKey - 1, hKey - 1, 5.5);
    ctx.stroke();

    // Bottom dark ambient shadow
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x + 4, y + hKey);
    ctx.lineTo(x + wKey - 4, y + hKey);
    ctx.stroke();

    // Special: Touch ID sapphire sensor key
    if (options?.isTouchId) {
      const ringRadius = Math.min(wKey, hKey) * 0.32;
      const ringX = x + wKey / 2;
      const ringY = y + hKey / 2;

      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(ringX, ringY, ringRadius, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = '#0a0d14';
      ctx.beginPath();
      ctx.arc(ringX, ringY, ringRadius - 1.5, 0, Math.PI * 2);
      ctx.fill();
      return;
    }

    // Special: Caps Lock glowing green LED
    if (options?.hasGreenLed) {
      ctx.fillStyle = '#22c55e';
      ctx.shadowColor = '#22c55e';
      ctx.shadowBlur = 5;
      ctx.beginPath();
      ctx.arc(x + 14, y + 15, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    // Special: F & J tactile home row bump
    if (options?.hasTactileBump) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.fillRect(x + wKey / 2 - 8, y + hKey - 16, 16, 2.5);
    }

    // Key text legends (Apple SF Pro inspired typography)
    ctx.fillStyle = '#f8fafc';
    ctx.textAlign = options?.alignLeft ? 'left' : 'center';
    ctx.textBaseline = 'middle';

    const baseFontSize = options?.fontSize || (hKey > 85 ? 24 : 18);
    ctx.font = `600 ${baseFontSize}px -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", sans-serif`;

    const tx = options?.alignLeft ? x + 16 : x + wKey / 2;

    if (secondaryText) {
      // Primary text (bottom)
      ctx.fillText(primaryText, tx, y + hKey * 0.65);
      // Secondary symbol (top)
      ctx.fillStyle = '#94a3b8';
      ctx.font = `600 ${baseFontSize * 0.72}px -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", sans-serif`;
      ctx.fillText(secondaryText, tx, y + hKey * 0.32);
    } else {
      ctx.fillText(primaryText, tx, y + hKey / 2);
    }
  };

  // ---------------- Row 0: Full-Height Function Keys (14 keys) ----------------
  const r0Y = ky + 4;
  const r0H = 72;
  const fKeyGap = 9;
  const fWidth = (kw - 13 * fKeyGap) / 14;

  const fnKeys = [
    { prim: 'esc', sec: '', align: true, fs: 19 },
    { prim: 'F1', sec: '☼', fs: 17 },
    { prim: 'F2', sec: '☀', fs: 17 },
    { prim: 'F3', sec: '⊞', fs: 17 },
    { prim: 'F4', sec: '🔍', fs: 17 },
    { prim: 'F5', sec: '🎙', fs: 17 },
    { prim: 'F6', sec: '🌙', fs: 17 },
    { prim: 'F7', sec: '◀◀', fs: 17 },
    { prim: 'F8', sec: '▶❚❚', fs: 17 },
    { prim: 'F9', sec: '▶▶', fs: 17 },
    { prim: 'F10', sec: '🔇', fs: 17 },
    { prim: 'F11', sec: '🔉', fs: 17 },
    { prim: 'F12', sec: '🔊', fs: 17 },
    { prim: '', sec: '', isTouchId: true },
  ];

  fnKeys.forEach((k, idx) => {
    const kxPos = kx + idx * (fWidth + fKeyGap);
    drawKeycap(kxPos, r0Y, fWidth, r0H, k.prim, k.sec, {
      isTouchId: k.isTouchId,
      alignLeft: k.align,
      fontSize: k.fs,
    });
  });

  // Standard row height & spacing for Rows 1..5
  const rowYStart = r0Y + r0H + 14;
  const mainRowH = 96;
  const rowGap = 10;
  const keyGap = 9;

  // ---------------- Row 1: Number Row (14 keys) ----------------
  const r1Y = rowYStart;
  const numWidth = (kw - 13 * keyGap - (1.5 - 1) * fWidth) / 13.5;
  const delWidth = numWidth * 1.5;

  const r1Keys = [
    { p: '`', s: '~' },
    { p: '1', s: '!' },
    { p: '2', s: '@' },
    { p: '3', s: '#' },
    { p: '4', s: '$' },
    { p: '5', s: '%' },
    { p: '6', s: '^' },
    { p: '7', s: '&' },
    { p: '8', s: '*' },
    { p: '9', s: '(' },
    { p: '0', s: ')' },
    { p: '-', s: '_' },
    { p: '=', s: '+' },
  ];

  let curX = kx;
  r1Keys.forEach((k) => {
    drawKeycap(curX, r1Y, numWidth, mainRowH, k.p, k.s);
    curX += numWidth + keyGap;
  });
  drawKeycap(curX, r1Y, delWidth, mainRowH, 'delete ⌫', '', { alignLeft: true, fontSize: 19 });

  // ---------------- Row 2: QWERTY Row (14 keys) ----------------
  const r2Y = r1Y + mainRowH + rowGap;
  const tabWidth = numWidth * 1.5;
  const qwertyWidth = (kw - tabWidth - 13 * keyGap) / 13;

  curX = kx;
  drawKeycap(curX, r2Y, tabWidth, mainRowH, 'tab ⇥', '', { alignLeft: true, fontSize: 19 });
  curX += tabWidth + keyGap;

  const r2Letters = ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', '[ {', '] }', '\\ |'];
  r2Letters.forEach((letter) => {
    const parts = letter.split(' ');
    drawKeycap(curX, r2Y, qwertyWidth, mainRowH, parts[0], parts[1] || '');
    curX += qwertyWidth + keyGap;
  });

  // ---------------- Row 3: ASDF / Home Row (13 keys) ----------------
  const r3Y = r2Y + mainRowH + rowGap;
  const capsWidth = numWidth * 1.75;
  const retWidth = kw - capsWidth - 12 * keyGap - 11 * qwertyWidth;

  curX = kx;
  drawKeycap(curX, r3Y, capsWidth, mainRowH, 'caps lock ⇪', '', { alignLeft: true, hasGreenLed: true, fontSize: 18 });
  curX += capsWidth + keyGap;

  const r3Letters = ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', '; :', '\' "'];
  r3Letters.forEach((letter) => {
    const parts = letter.split(' ');
    const isFJ = parts[0] === 'F' || parts[0] === 'J';
    drawKeycap(curX, r3Y, qwertyWidth, mainRowH, parts[0], parts[1] || '', { hasTactileBump: isFJ });
    curX += qwertyWidth + keyGap;
  });
  drawKeycap(curX, r3Y, retWidth, mainRowH, 'return ↩', '', { alignLeft: true, fontSize: 19 });

  // ---------------- Row 4: ZXCV Row (12 keys) ----------------
  const r4Y = r3Y + mainRowH + rowGap;
  const lShiftWidth = numWidth * 2.25;
  const rShiftWidth = numWidth * 2.25;
  const zxcvWidth = (kw - lShiftWidth - rShiftWidth - 11 * keyGap) / 10;

  curX = kx;
  drawKeycap(curX, r4Y, lShiftWidth, mainRowH, 'shift ⇧', '', { alignLeft: true, fontSize: 19 });
  curX += lShiftWidth + keyGap;

  const r4Letters = ['Z', 'X', 'C', 'V', 'B', 'N', 'M', ', <', '. >', '/ ?'];
  r4Letters.forEach((letter) => {
    const parts = letter.split(' ');
    drawKeycap(curX, r4Y, zxcvWidth, mainRowH, parts[0], parts[1] || '');
    curX += zxcvWidth + keyGap;
  });
  drawKeycap(curX, r4Y, rShiftWidth, mainRowH, 'shift ⇧', '', { alignLeft: true, fontSize: 19 });

  // ---------------- Row 5: Modifiers, Spacebar & Inverted-T Arrows ----------------
  const r5Y = r4Y + mainRowH + rowGap;
  const modWidth = numWidth * 1.2;
  const cmdWidth = numWidth * 1.4;
  const arrowClusterWidth = numWidth * 3.1;
  const spaceWidth = kw - (modWidth * 3 + cmdWidth * 2 + arrowClusterWidth + 7 * keyGap);

  curX = kx;
  drawKeycap(curX, r5Y, modWidth, mainRowH, 'fn 🌐', '', { fontSize: 18 });
  curX += modWidth + keyGap;
  drawKeycap(curX, r5Y, modWidth, mainRowH, 'control ⌃', '', { fontSize: 17 });
  curX += modWidth + keyGap;
  drawKeycap(curX, r5Y, modWidth, mainRowH, 'option ⌥', '', { fontSize: 18 });
  curX += modWidth + keyGap;
  drawKeycap(curX, r5Y, cmdWidth, mainRowH, 'command ⌘', '', { fontSize: 18 });
  curX += cmdWidth + keyGap;

  // Elongated Chiclet Spacebar
  drawKeycap(curX, r5Y, spaceWidth, mainRowH, '', '');
  curX += spaceWidth + keyGap;

  drawKeycap(curX, r5Y, cmdWidth, mainRowH, 'command ⌘', '', { fontSize: 18 });
  curX += cmdWidth + keyGap;
  drawKeycap(curX, r5Y, modWidth, mainRowH, 'option ⌥', '', { fontSize: 18 });
  curX += modWidth + keyGap;

  // Iconic Apple Inverted-T Arrow cluster
  const arrowUnitW = (arrowClusterWidth - keyGap * 2) / 3;
  const halfH = (mainRowH - keyGap) / 2;

  // Left Arrow (Bottom Half)
  drawKeycap(curX, r5Y + halfH + keyGap, arrowUnitW, halfH, '◀', '', { fontSize: 18 });

  // Up Arrow (Top Half, Middle)
  drawKeycap(curX + arrowUnitW + keyGap, r5Y, arrowUnitW, halfH, '▲', '', { fontSize: 16 });
  // Down Arrow (Bottom Half, Middle)
  drawKeycap(curX + arrowUnitW + keyGap, r5Y + halfH + keyGap, arrowUnitW, halfH, '▼', '', { fontSize: 16 });

  // Right Arrow (Bottom Half)
  drawKeycap(curX + (arrowUnitW + keyGap) * 2, r5Y + halfH + keyGap, arrowUnitW, halfH, '▶', '', { fontSize: 18 });
}

// Authentic AKKO 3068B Plus 68-Key Layout (5 rows, exactly 16u per row)
export interface AkkoKeyDef {
  p: string;
  s?: string;
  u: number;
  cyan?: boolean;
  mod?: boolean;
  bump?: boolean;
  hasLed?: boolean;
  space?: boolean;
  arrow?: boolean;
}

export const AKKO_65_LAYOUT: AkkoKeyDef[][] = [
  // Row 1 (16u)
  [
    { p: 'ESC', u: 1, cyan: true },
    { p: '1', s: '!', u: 1 }, { p: '2', s: '@', u: 1 }, { p: '3', s: '#', u: 1 },
    { p: '4', s: '$', u: 1 }, { p: '5', s: '%', u: 1 }, { p: '6', s: '^', u: 1 },
    { p: '7', s: '&', u: 1 }, { p: '8', s: '*', u: 1 }, { p: '9', s: '(', u: 1 },
    { p: '0', s: ')', u: 1 }, { p: '-', s: '_', u: 1 }, { p: '=', s: '+', u: 1 },
    { p: 'BACKSPACE ⌫', u: 2, mod: true }, { p: '~ `', u: 1, cyan: true }
  ],
  // Row 2 (16u)
  [
    { p: 'TAB ⇥', u: 1.5, mod: true },
    { p: 'Q', u: 1 }, { p: 'W', u: 1 }, { p: 'E', u: 1 }, { p: 'R', u: 1 },
    { p: 'T', u: 1 }, { p: 'Y', u: 1 }, { p: 'U', u: 1 }, { p: 'I', u: 1 },
    { p: 'O', u: 1 }, { p: 'P', u: 1 }, { p: '[', s: '{', u: 1 }, { p: ']', s: '}', u: 1 },
    { p: '\\ |', u: 1.5, mod: true }, { p: 'DEL', u: 1, mod: true }
  ],
  // Row 3 (16u)
  [
    { p: 'CAPS LOCK', u: 1.75, mod: true, hasLed: true },
    { p: 'A', u: 1 }, { p: 'S', u: 1 }, { p: 'D', u: 1 }, { p: 'F', u: 1, bump: true },
    { p: 'G', u: 1 }, { p: 'H', u: 1 }, { p: 'J', u: 1, bump: true }, { p: 'K', u: 1 },
    { p: 'L', u: 1 }, { p: ';', s: ':', u: 1 }, { p: '\'', s: '"', u: 1 },
    { p: 'ENTER ⏎', u: 2.25, cyan: true }, { p: 'PGUP', u: 1, mod: true }
  ],
  // Row 4 (16u)
  [
    { p: 'SHIFT ⇧', u: 2.25, mod: true },
    { p: 'Z', u: 1 }, { p: 'X', u: 1 }, { p: 'C', u: 1 }, { p: 'V', u: 1 },
    { p: 'B', u: 1 }, { p: 'N', u: 1 }, { p: 'M', u: 1 }, { p: ',', s: '<', u: 1 },
    { p: '.', s: '>', u: 1 }, { p: '/', s: '?', u: 1 }, { p: 'SHIFT ⇧', u: 1.75, mod: true },
    { p: '▲', u: 1, cyan: true, arrow: true }, { p: 'PGDN', u: 1, mod: true }
  ],
  // Row 5 (16u)
  [
    { p: 'CTRL', u: 1.25, mod: true }, { p: 'WIN', u: 1.25, mod: true }, { p: 'ALT', u: 1.25, mod: true },
    { p: 'AKKO', u: 6.25, cyan: true, space: true },
    { p: 'ALT', u: 1, mod: true }, { p: 'FN', u: 1, mod: true }, { p: 'CTRL', u: 1, mod: true },
    { p: '◀', u: 1, cyan: true, arrow: true }, { p: '▼', u: 1, cyan: true, arrow: true }, { p: '▶', u: 1, cyan: true, arrow: true }
  ]
];

// Draw authentic AKKO 3068B Plus Black&Cyan 65% Mechanical Keyboard
// Features ASA Profile Double-Shot PBT keycaps, AKKO CS Jelly Pink switches, South-Facing RGB, and Acoustic Foams
function drawAkko3068BKeyboard(canvas: HTMLCanvasElement, rgbColorHex = '#00f0ff') {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const w = canvas.width;
  const h = canvas.height;

  // Clear canvas
  ctx.clearRect(0, 0, w, h);

  // 1. Dark Plate Well / High-Density Sound Absorbing EVA Foam Basin
  ctx.fillStyle = '#0a0d16';
  ctx.fillRect(0, 0, w, h);

  // 2. Translucent Frosted Polycarbonate Switch Plate
  ctx.fillStyle = '#e5ecf5';
  ctx.fillRect(20, 16, w - 40, h - 32);

  const plateGrad = ctx.createLinearGradient(0, 0, w, h);
  plateGrad.addColorStop(0, 'rgba(255, 255, 255, 0.22)');
  plateGrad.addColorStop(0.4, 'rgba(215, 230, 245, 0.08)');
  plateGrad.addColorStop(1, 'rgba(120, 140, 165, 0.2)');
  ctx.fillStyle = plateGrad;
  ctx.fillRect(20, 16, w - 40, h - 32);

  // Helper for cross-browser rounded rectangles
  const drawRRect = (x: number, y: number, rw: number, rh: number, r: number) => {
    if (typeof ctx.roundRect === 'function') {
      ctx.beginPath();
      ctx.roundRect(x, y, rw, rh, r);
    } else {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + rw - r, y);
      ctx.quadraticCurveTo(x + rw, y, x + rw, y + r);
      ctx.lineTo(x + rw, y + rh - r);
      ctx.quadraticCurveTo(x + rw, y + rh, x + rw - r, y + rh);
      ctx.lineTo(x + r, y + rh);
      ctx.quadraticCurveTo(x, y + rh, x, y + rh - r);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.closePath();
    }
  };

  const marginX = 36;
  const marginY = 30;
  const availW = w - marginX * 2;
  const availH = h - marginY * 2;
  const uWidth = availW / 16;
  const rowH = availH / 5;
  const keyGap = 7;

  const rows = AKKO_65_LAYOUT;

  let curY = marginY;
  for (let r = 0; r < rows.length; r++) {
    const row = rows[r];
    let curX = marginX;

    for (let i = 0; i < row.length; i++) {
      const k = row[i];
      const wKey = k.u * uWidth - keyGap;
      const hKey = rowH - keyGap;
      const cx = curX + wKey / 2;
      const cy = curY + hKey / 2;

      // 1. South-Facing RGB LED Emission beneath key
      const rgbGlow = ctx.createRadialGradient(cx, cy + 18, 4, cx, cy + 18, Math.max(wKey, 48) * 0.82);
      rgbGlow.addColorStop(0, rgbColorHex);
      rgbGlow.addColorStop(0.32, rgbColorHex + '55');
      rgbGlow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = rgbGlow;
      ctx.fillRect(curX - 6, curY - 5, wKey + 12, hKey + 14);

      // 2. Translucent AKKO CS Jelly Pink Switch Housing peeking in gap
      const swSize = Math.min(wKey - 8, 48);
      ctx.fillStyle = 'rgba(255, 107, 157, 0.92)'; // Signature translucent Jelly Pink
      drawRRect(cx - swSize / 2, cy - swSize / 2, swSize, swSize, 5);
      ctx.fill();

      // Translucent Jelly Pink Cross Box Stem
      ctx.fillStyle = '#ff4081';
      ctx.fillRect(cx - 5, cy - 9, 10, 18);
      ctx.fillRect(cx - 9, cy - 5, 18, 10);

      // 3. Realistic Drop Shadow for Elevated Keycap
      ctx.fillStyle = 'rgba(6, 8, 14, 0.8)';
      drawRRect(curX + 2, curY + 4, wKey, hKey, 9);
      ctx.fill();

      // 4. ASA Profile Keycap Body (Spherical concave sculpted dish)
      const isCyan = !!k.cyan;
      const rKey = Math.min(10, Math.floor(wKey * 0.15));

      if (isCyan) {
        // Akko Electric Cyan ASA Keycap
        const cyanGrad = ctx.createRadialGradient(cx, cy - 8, 8, cx, cy, wKey * 0.75);
        cyanGrad.addColorStop(0, '#26eeff');
        cyanGrad.addColorStop(0.48, '#00d2ea');
        cyanGrad.addColorStop(1, '#0891b2');
        ctx.fillStyle = cyanGrad;
      } else if (k.mod) {
        // Stealth Midnight Black Modifiers
        const modGrad = ctx.createRadialGradient(cx, cy - 8, 8, cx, cy, wKey * 0.75);
        modGrad.addColorStop(0, '#1c202a');
        modGrad.addColorStop(0.5, '#12151d');
        modGrad.addColorStop(1, '#090b10');
        ctx.fillStyle = modGrad;
      } else {
        // Deep Charcoal Alphanumeric Keys
        const alphaGrad = ctx.createRadialGradient(cx, cy - 8, 8, cx, cy, wKey * 0.75);
        alphaGrad.addColorStop(0, '#262c3a');
        alphaGrad.addColorStop(0.5, '#1a1e28');
        alphaGrad.addColorStop(1, '#10131b');
        ctx.fillStyle = alphaGrad;
      }

      drawRRect(curX, curY, wKey, hKey, rKey);
      ctx.fill();

      // Top Specular Rim Reflection (Spherical ASA edge highlight)
      ctx.strokeStyle = isCyan ? 'rgba(255, 255, 255, 0.45)' : 'rgba(255, 255, 255, 0.16)';
      ctx.lineWidth = 1.2;
      drawRRect(curX + 0.6, curY + 0.6, wKey - 1.2, hKey - 1.2, rKey - 0.5);
      ctx.stroke();

      // Spherical Dish Concave Inner Basin (Signature ASA Profile)
      const dishInsetX = Math.min(12, wKey * 0.12);
      const dishInsetY = 9;
      ctx.fillStyle = isCyan ? 'rgba(0, 0, 0, 0.04)' : 'rgba(0, 0, 0, 0.18)';
      drawRRect(curX + dishInsetX, curY + dishInsetY, wKey - dishInsetX * 2, hKey - dishInsetY * 2, rKey - 2);
      ctx.fill();

      // Tactile homing bumps on F and J
      if (k.bump) {
        ctx.fillStyle = '#00f0ff';
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 4;
        ctx.fillRect(cx - 10, curY + hKey - 16, 20, 2.5);
        ctx.shadowBlur = 0;
      }

      // CapsLock status LED
      if (k.hasLed) {
        ctx.fillStyle = '#00f0ff';
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(curX + 16, curY + 16, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // Double-Shot PBT Keycap Legends Typography
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      if (isCyan) {
        ctx.fillStyle = '#05121a'; // Crisp Dark Contrast for Cyan keys
      } else {
        ctx.fillStyle = '#00f0ff'; // Vibrant Electric Cyan for Black keys
      }

      if (k.space) {
        // Spacebar: Clean Akko Accent + Geometric Line
        ctx.font = '700 20px -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif';
        ctx.fillText('━  AKKO 3068B  ━', cx, cy);
      } else if (k.arrow) {
        ctx.font = '700 28px -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.fillText(k.p, cx, cy);
      } else if (k.s) {
        // Dual symbol (Number row / punctuation)
        ctx.font = '700 22px -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.fillText(k.p, cx, cy + 18);
        ctx.fillStyle = isCyan ? '#1e293b' : '#38bdf8';
        ctx.font = '700 17px -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.fillText(k.s, cx, cy - 18);
      } else {
        const isLongText = k.p.length > 3;
        const fSize = isLongText ? (wKey > 140 ? 18 : 15) : 23;
        ctx.font = `700 ${fSize}px -apple-system, BlinkMacSystemFont, sans-serif`;
        ctx.fillText(k.p, cx, cy);
      }

      curX += wKey + keyGap;
    }

    curY += rowH;
  }
}

// Cached user avatar image for live canvas screen rendering
let cachedAvatarImg: HTMLImageElement | null = null;
let isAvatarLoading = false;
const avatarLoadedCallbacks: Array<() => void> = [];

function getOrLoadAvatarImage(onLoaded?: () => void): HTMLImageElement | null {
  if (onLoaded) {
    if (cachedAvatarImg && cachedAvatarImg.complete && cachedAvatarImg.naturalWidth > 0) {
      setTimeout(onLoaded, 0);
    } else {
      avatarLoadedCallbacks.push(onLoaded);
    }
  }

  if (cachedAvatarImg && cachedAvatarImg.complete && cachedAvatarImg.naturalWidth > 0) {
    return cachedAvatarImg;
  }

  if (!isAvatarLoading && typeof Image !== 'undefined') {
    isAvatarLoading = true;
    const notifySubscribers = () => {
      isAvatarLoading = false;
      const cbs = avatarLoadedCallbacks.splice(0, avatarLoadedCallbacks.length);
      cbs.forEach((cb) => {
        try {
          cb();
        } catch (err) {
          console.error('Avatar callback error:', err);
        }
      });
    };

    const img = new Image();
    img.crossOrigin = 'anonymous';
    // Load high-performance lightweight avatar first (instant 3.4KB load)
    img.src = '/images/hoa-hoang-256.webp';
    img.onload = () => {
      cachedAvatarImg = img;
      notifySubscribers();
    };
    img.onerror = () => {
      const fallback = new Image();
      fallback.crossOrigin = 'anonymous';
      fallback.src = '/images/hoa-hoang.jpg';
      fallback.onload = () => {
        cachedAvatarImg = fallback;
        notifySubscribers();
      };
      fallback.onerror = () => {
        isAvatarLoading = false;
        avatarLoadedCallbacks.length = 0;
      };
    };
  }
  return cachedAvatarImg;
}

// Pre-initiate avatar download immediately on module execution
if (typeof Image !== 'undefined') {
  getOrLoadAvatarImage();
}

// Draw crisp Personal CV Website / VS Code / Terminal graphics on an HTML5 canvas
function drawMainScreen(canvas: HTMLCanvasElement, mode: number, frame: number) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const w = canvas.width;
  const h = canvas.height;

  // Background
  ctx.fillStyle = mode === 2 ? '#020b08' : (mode === 1 ? '#080d1a' : '#f4efe6');
  ctx.fillRect(0, 0, w, h);

  if (mode === 0) {
    // =========================================================================
    // MODE 0: AUTHENTIC LIVE CV WEBSITE (Hoàng Văn Hòa — novahoangdev.web.app)
    // Pixel-perfect recreation of CleanShot 2026-09-16 at 20.36.09 (Warm Cream Theme)
    // =========================================================================

    // A. Browser Chrome Bar (macOS / Arc / Chrome Style, y = 0 to 44)
    ctx.fillStyle = '#e8e4dc';
    ctx.fillRect(0, 0, w, 44);
    ctx.strokeStyle = '#d7d1c5';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, 44);
    ctx.lineTo(w, 44);
    ctx.stroke();

    // Traffic Light Buttons
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(24, 22, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(44, 22, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.arc(64, 22, 6, 0, Math.PI * 2);
    ctx.fill();

    // Active Browser Tab (merges seamlessly into page background)
    ctx.fillStyle = '#f4efe6';
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(88, 8, 250, 36, [8, 8, 0, 0]) : ctx.rect(88, 8, 250, 36);
    ctx.fill();

    // Laptop mini icon on tab
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(102, 18, 16, 11, 2) : ctx.rect(102, 18, 16, 11);
    ctx.fill();
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(104, 20, 12, 7);
    ctx.fillStyle = '#64748b';
    ctx.fillRect(100, 29, 20, 2);

    ctx.fillStyle = '#1e293b';
    ctx.font = '600 12px "Manrope", "Plus Jakarta Sans", sans-serif';
    ctx.fillText('Nova Hoang • Portfolio & CV', 126, 26);

    // SSL Address Bar
    const addrX = 360;
    const addrW = 880;
    ctx.fillStyle = '#faf7f2';
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(addrX, 8, addrW, 28, 8) : ctx.rect(addrX, 8, addrW, 28);
    ctx.fill();
    ctx.strokeStyle = '#dcd4c6';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = '#0f766e';
    ctx.font = '12px system-ui';
    ctx.fillText('🔒', addrX + 12, 26);

    ctx.fillStyle = '#0f766e';
    ctx.font = 'bold 12px "JetBrains Mono", monospace';
    ctx.fillText('https://', addrX + 32, 26);

    ctx.fillStyle = '#111827';
    ctx.font = '500 12px "JetBrains Mono", monospace';
    ctx.fillText('novahoangdev.web.app/', addrX + 88, 26);

    ctx.fillStyle = '#9ca3af';
    ctx.fillText('★', addrX + addrW - 24, 26);

    // B. Webpage Viewport (y = 44 to h)
    // Warm, sophisticated natural eggshell/cream background
    ctx.fillStyle = '#f4efe6';
    ctx.fillRect(0, 44, w, h - 44);

    // 1. Navigation Bar (y = 44 to 125)
    // Brand Logo & Text (Left)
    const brandX = 55;
    const brandY = 62;
    ctx.fillStyle = '#16232d';
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(brandX, brandY, 44, 44, 10) : ctx.rect(brandX, brandY, 44, 44);
    ctx.fill();

    // Stylized laptop icon inside
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(brandX + 10, brandY + 11, 24, 15, 2) : ctx.rect(brandX + 10, brandY + 11, 24, 15);
    ctx.fill();
    ctx.fillStyle = '#0c4a6e';
    ctx.fillRect(brandX + 12, brandY + 13, 20, 11);
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 8px monospace';
    ctx.fillText('</>', brandX + 15, brandY + 21);
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(brandX + 7, brandY + 26, 30, 3);

    // Brand Name & Subtitle
    ctx.fillStyle = '#111827';
    ctx.font = 'bold 18px "Manrope", "Plus Jakarta Sans", sans-serif';
    ctx.fillText('Nova Hoang', brandX + 54, brandY + 20);

    ctx.fillStyle = '#6b7280';
    ctx.font = '500 12px "Manrope", "Plus Jakarta Sans", sans-serif';
    ctx.fillText('Senior Software Engineer', brandX + 54, brandY + 38);

    // Center Nav Pill: Resume (active black) | About (inactive)
    const pillBoxX = 700;
    const pillBoxY = 64;
    ctx.fillStyle = '#e6dfd4';
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(pillBoxX, pillBoxY, 200, 40, 20) : ctx.rect(pillBoxX, pillBoxY, 200, 40);
    ctx.fill();

    // Active Resume Pill
    ctx.fillStyle = '#16202a';
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(pillBoxX + 2, pillBoxY + 2, 98, 36, 18) : ctx.rect(pillBoxX + 2, pillBoxY + 2, 98, 36);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 13px "Manrope", "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Resume', pillBoxX + 51, pillBoxY + 24);

    // Inactive About Tab
    ctx.fillStyle = '#374151';
    ctx.font = '600 13px "Manrope", "Plus Jakarta Sans", sans-serif';
    ctx.fillText('About', pillBoxX + 150, pillBoxY + 24);
    ctx.textAlign = 'left';

    // Right Action Buttons: LinkedIn + Dark Mode Moon
    const liBtnX = 1335;
    const liBtnY = 64;
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#d1d5db';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(liBtnX, liBtnY, 126, 40, 20) : ctx.rect(liBtnX, liBtnY, 126, 40);
    ctx.fill();
    ctx.stroke();

    // LinkedIn 'in' Icon
    ctx.fillStyle = '#0a66c2';
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(liBtnX + 14, liBtnY + 11, 18, 18, 3) : ctx.rect(liBtnX + 14, liBtnY + 11, 18, 18);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText('in', liBtnX + 18, liBtnY + 24);

    ctx.fillStyle = '#111827';
    ctx.font = 'bold 13px "Manrope", "Plus Jakarta Sans", sans-serif';
    ctx.fillText('LinkedIn', liBtnX + 38, liBtnY + 25);

    // Moon circular button
    const moonBtnX = 1475;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(moonBtnX + 20, liBtnY + 20, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Crescent moon icon
    ctx.fillStyle = '#374151';
    ctx.beginPath();
    ctx.arc(moonBtnX + 20, liBtnY + 20, 7, 0.7 * Math.PI, 1.7 * Math.PI, false);
    ctx.arc(moonBtnX + 22, liBtnY + 19, 6, 1.7 * Math.PI, 0.7 * Math.PI, true);
    ctx.fill();

    // 2. Hero Section (y = 135 to 440)
    // Subtle background circle motif on right
    ctx.strokeStyle = '#e5ded2';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(1380, 285, 185, 0, Math.PI * 2);
    ctx.stroke();

    // Eyebrow line & label
    const heroX = 55;
    ctx.fillStyle = '#0f766e';
    ctx.fillRect(heroX, 158, 48, 2.5);

    ctx.fillStyle = '#0f766e';
    ctx.font = 'bold 13px "Manrope", "Plus Jakarta Sans", sans-serif';
    ctx.fillText('PORTFOLIO / CURRICULUM VITAE', heroX + 60, 163);

    // Large Serif Headlines (1:1 with user's website typography)
    ctx.fillStyle = '#111827';
    ctx.font = 'bold 78px "Playfair Display", Georgia, serif';
    ctx.fillText('One career.', heroX, 248);

    ctx.fillStyle = '#0f766e';
    ctx.font = 'italic 78px "Playfair Display", Georgia, serif';
    ctx.fillText('Two perspectives.', heroX, 332);

    // Subtitle paragraph
    ctx.fillStyle = '#4b5563';
    ctx.font = '400 19px "Manrope", "Plus Jakarta Sans", sans-serif';
    ctx.fillText(
      'Discover how I turn complex requirements into reliable, user-friendly',
      heroX,
      378
    );
    ctx.fillText(
      'products while helping engineering teams deliver with confidence.',
      heroX,
      406
    );

    // 3. Toggle & Action Row (y = 442 to 505)
    // Left CV Switcher Pill
    const swX = heroX;
    const swY = 445;
    ctx.fillStyle = '#e6dfd4';
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(swX, swY, 345, 50, 25) : ctx.rect(swX, swY, 345, 50);
    ctx.fill();

    // Active Vietnam CV switch
    ctx.fillStyle = '#14222b';
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(swX + 3, swY + 3, 164, 44, 22) : ctx.rect(swX + 3, swY + 3, 164, 44);
    ctx.fill();

    // Green circular badge 'VN'
    ctx.fillStyle = '#0f766e';
    ctx.beginPath();
    ctx.arc(swX + 26, swY + 25, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 10px "Manrope", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('VN', swX + 26, swY + 29);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px "Manrope", "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Vietnam CV', swX + 48, swY + 30);

    // Inactive International CV switch
    ctx.fillStyle = '#d5ccbf';
    ctx.beginPath();
    ctx.arc(swX + 192, swY + 25, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#4b5563';
    ctx.font = 'bold 8px "Manrope", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('INTL', swX + 192, swY + 28);

    ctx.fillStyle = '#4b5563';
    ctx.font = '600 13px "Manrope", "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('International CV', swX + 214, swY + 30);

    // Right Action Buttons: Print View + Download PDF
    const pvX = 1220;
    const pvY = 446;
    // Print View
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#d1d5db';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(pvX, pvY, 145, 48, 24) : ctx.rect(pvX, pvY, 145, 48);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#111827';
    ctx.font = 'bold 14px "Manrope", "Plus Jakarta Sans", sans-serif';
    ctx.fillText('🖨️  Print View', pvX + 22, pvY + 30);

    // Download PDF (Teal button)
    const dlX = 1380;
    ctx.fillStyle = '#0f766e';
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(dlX, pvY, 175, 48, 24) : ctx.rect(dlX, pvY, 175, 48);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px "Manrope", "Plus Jakarta Sans", sans-serif';
    ctx.fillText('📥  Download PDF', dlX + 22, pvY + 30);

    // 4. Dark Obsidian Profile Card (y = 520 to 880)
    const cardX = heroX;
    const cardY = 520;
    const cardW = 1500;
    const cardH = 355;
    ctx.fillStyle = '#132029';
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(cardX, cardY, cardW, cardH, 36) : ctx.rect(cardX, cardY, cardW, cardH);
    ctx.fill();

    // Subtle curved contour rings inside the card
    ctx.save();
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(cardX, cardY, cardW, cardH, 36) : ctx.rect(cardX, cardY, cardW, cardH);
    ctx.clip();

    ctx.strokeStyle = 'rgba(45, 212, 191, 0.08)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cardX + cardW - 80, cardY + 60, 360, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cardX + cardW - 80, cardY + 60, 520, 0, Math.PI * 2);
    ctx.stroke();

    // Profile Photo Avatar (Left side of card)
    const avX = cardX + 135;
    const avY = cardY + cardH / 2;
    const avR = 102;

    // Glowing cyan accent ring around avatar
    ctx.strokeStyle = 'rgba(45, 212, 191, 0.4)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(avX, avY, avR + 4, 0, Math.PI * 2);
    ctx.stroke();

    // Draw user avatar photo
    const avatar = getOrLoadAvatarImage();
    if (avatar && avatar.complete && avatar.naturalWidth > 0) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(avX, avY, avR, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(avatar, avX - avR, avY - avR, avR * 2, avR * 2);
      ctx.restore();
    } else {
      // Elegant fallback silhouette
      ctx.fillStyle = '#0e1820';
      ctx.beginPath();
      ctx.arc(avX, avY, avR, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#2dd4bf';
      ctx.font = 'bold 36px "Playfair Display", Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText('NH', avX, avY + 12);
      ctx.textAlign = 'left';
    }

    // Bio Details (Middle of card)
    const bioX = cardX + 275;
    // Eyebrow
    ctx.fillStyle = '#2dd4bf';
    ctx.font = 'bold 13px "Manrope", "Plus Jakarta Sans", sans-serif';
    ctx.fillText("HELLO, I'M", bioX, cardY + 95);

    // Full Name in grand serif
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 56px "Playfair Display", Georgia, serif';
    ctx.fillText('Hoàng Văn Hòa', bioX, cardY + 160);

    // Title / Specialty
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '500 21px "Manrope", "Plus Jakarta Sans", sans-serif';
    ctx.fillText('Senior Frontend Developer · Angular & React · Enterprise UI', bioX, cardY + 206);

    // Contact line
    ctx.fillStyle = '#94a3b8';
    ctx.font = '500 15px "JetBrains Mono", monospace';
    ctx.fillText('novahoangdev@gmail.com   •   (+84) 328 369 788   •   linkedin.com/in/novahoangdev', bioX, cardY + 258);

    // 7+ Years Circular Badge (Right side of card)
    const expX = cardX + cardW - 135;
    const expY = cardY + cardH / 2;
    const expR = 82;

    ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
    ctx.beginPath();
    ctx.arc(expX, expY, expR, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.16)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 50px "Playfair Display", Georgia, serif';
    ctx.fillText('7+', expX, expY - 4);

    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 11px "Manrope", "Plus Jakarta Sans", sans-serif';
    ctx.fillText('YEARS OF', expX, expY + 22);
    ctx.fillText('EXPERIENCE', expX, expY + 40);
    ctx.textAlign = 'left';

    ctx.restore();

  } else if (mode === 1) {
    // =========================================================================
    // MODE 1: VS CODE IDE (ThreeCanvas.tsx & Portfolio Architecture)
    // =========================================================================
    // Window header bar
    ctx.fillStyle = '#0b1120';
    ctx.fillRect(0, 0, w, 32);

    // Traffic light buttons
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(18, 16, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(34, 16, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.arc(50, 16, 5, 0, Math.PI * 2);
    ctx.fill();

    // Tabs
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(72, 4, 160, 28);
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 12px monospace';
    ctx.fillText('⚡ ThreeCanvas.tsx', 86, 22);

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(238, 4, 140, 28);
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('workstation.ts', 256, 22);

    // Code lines
    const lines = [
      { text: '// Hoàng Văn Hòa (Nova Hoang) - Senior Software Engineer', color: '#64748b' },
      { text: 'import { ThreeCanvas } from "./three/ThreeCanvas";', color: '#c084fc' },
      { text: 'import { DeveloperDesk } from "./three/workstation";', color: '#c084fc' },
      { text: 'import { PERSONAL_INFO, PROJECTS, EXPERIENCES } from "../data/cvData";', color: '#c084fc' },
      { text: '', color: '' },
      { text: 'export async function launchCreativeExperience() {', color: '#38bdf8' },
      { text: '  const engineer = new SeniorSoftwareEngineer({', color: '#f1f5f9' },
      { text: '    name: "Hoàng Văn Hòa",', color: '#34d399' },
      { text: '    alias: "Nova Hoang",', color: '#34d399' },
      { text: '    title: "Senior Frontend Developer · Enterprise UI",', color: '#34d399' },
      { text: '    experience: "7+ Years (Angular, React, NestJS, TypeScript)",', color: '#fbbf24' },
      { text: '    website: "https://novahoangdev.web.app/",', color: '#38bdf8' },
      { text: '  });', color: '#f1f5f9' },
      { text: '  return await engineer.launchInteractiveWorkstation();', color: '#38bdf8' },
      { text: '}', color: '#38bdf8' },
    ];

    ctx.font = '13px "JetBrains Mono", Consolas, monospace';
    let y = 64;
    lines.forEach((line, i) => {
      ctx.fillStyle = '#475569';
      ctx.fillText(`${i + 1}`.padStart(2, ' '), 20, y);

      if (line.text) {
        ctx.fillStyle = line.color;
        ctx.fillText(line.text, 56, y);
      }
      y += 24;
    });

    // Blinking cursor
    if (Math.floor(frame / 25) % 2 === 0) {
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(56 + ctx.measureText('}').width + 8, y - 24 - 13, 9, 16);
    }
  } else {
    // =========================================================================
    // MODE 2: TERMINAL CLI & MATRIX RAIN TELEMETRY
    // =========================================================================
    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, w, 32);
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 12px monospace';
    ctx.fillText('● novahoang@workstation: ~/portfolio (main)', 20, 21);

    const termLines = [
      { text: 'novahoang@dev:~$ pnpm run build:3d-engine', color: '#38bdf8' },
      { text: '[vite] vite building for production...', color: '#94a3b8' },
      { text: '✓ 142 modules transformed.', color: '#34d399' },
      { text: '✓ Workstation procedural models initialized.', color: '#34d399' },
      { text: '✓ Developer Workstation upgraded: 360° Orbit & Focus Active.', color: '#fbbf24' },
      { text: 'novahoang@dev:~$ ./deploy-portfolio --target=production', color: '#38bdf8' },
      { text: '>>> STATUS: SUCCESS! System live at https://novahoangdev.web.app/', color: '#4ade80' },
      { text: 'novahoang@dev:~$ _', color: '#f8fafc' },
    ];

    ctx.font = '13px monospace';
    let y = 64;
    termLines.forEach((line) => {
      ctx.fillStyle = line.color;
      ctx.fillText(line.text, 24, y);
      y += 24;
    });

    // Animated status bar at bottom
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, h - 28, w, 28);
    ctx.fillStyle = '#38bdf8';
    ctx.font = '11px monospace';
    ctx.fillText('UTF-8 | LF | TypeScript 5.7 | 60 FPS WebGL | READY', 24, h - 9);
  }
}

// Draw Vertical Screen (Mode 0: Terminal Codex / Mode 1: Claude CLI)
function drawVerticalScreen(canvas: HTMLCanvasElement, mode: number, frame: number) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const w = canvas.width;
  const h = canvas.height;

  if (mode === 0) {
    // =========================================================
    // MODE 0: TERMINAL CODEX (OpenAI Codex / Autonomous AI Coding CLI)
    // =========================================================
    // Background: High-tech dark terminal slate
    ctx.fillStyle = '#0a0d14';
    ctx.fillRect(0, 0, w, h);

    // Subtle terminal scanline grid
    ctx.fillStyle = 'rgba(15, 23, 42, 0.4)';
    for (let sy = 0; sy < h; sy += 6) {
      ctx.fillRect(0, sy, w, 1);
    }

    // Window top titlebar
    ctx.fillStyle = '#111827';
    ctx.fillRect(0, 0, w, 44);
    ctx.fillStyle = '#1f2937';
    ctx.fillRect(0, 43, w, 1);

    // Traffic lights (Close, Minimize, Maximize)
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(22, 22, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(42, 22, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.arc(62, 22, 6, 0, Math.PI * 2);
    ctx.fill();

    // Title & status pill
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 13px monospace';
    ctx.fillText('codex-agent — terminal · zsh', 86, 26);

    // Active Pulse Badge
    ctx.fillStyle = '#064e3b';
    ctx.beginPath();
    ctx.roundRect(w - 145, 12, 130, 22, 11);
    ctx.fill();
    ctx.strokeStyle = '#059669';
    ctx.lineWidth = 1;
    ctx.stroke();

    const pulseAlpha = 0.6 + 0.4 * Math.sin(frame * 0.1);
    ctx.fillStyle = `rgba(52, 211, 153, ${pulseAlpha})`;
    ctx.beginPath();
    ctx.arc(w - 132, 23, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#34d399';
    ctx.font = 'bold 10px monospace';
    ctx.fillText('CODEX ACTIVE', w - 120, 26);

    let y = 72;

    // Shell prompt
    ctx.fillStyle = '#38bdf8';
    ctx.font = '12px monospace';
    ctx.fillText('nova@workstation:~/enterprise-systems (main)', 20, y);
    y += 22;

    ctx.fillStyle = '#a855f7';
    ctx.fillText('$', 20, y);
    ctx.fillStyle = '#f1f5f9';
    ctx.fillText(' codex run --agent --model=gpt-5-codex --stream', 32, y);
    y += 30;

    // Codex AI Engine Banner Box
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.roundRect(16, y, w - 32, 88, 8);
    ctx.fill();
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = '#60a5fa';
    ctx.font = 'bold 13px monospace';
    ctx.fillText('🤖 CODEX AUTONOMOUS AGENT v3.4', 28, y + 26);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px monospace';
    ctx.fillText('Context: enterprise-systems · NestJS microservices', 28, y + 48);
    ctx.fillText('Target: audit export & telemetry pipeline', 28, y + 68);
    y += 106;

    // Real-time Agent thought steps stream
    ctx.fillStyle = '#c084fc';
    ctx.font = 'bold 12px monospace';
    ctx.fillText('▸ EXECUTION STREAM', 20, y);
    y += 20;

    const streamLogs = [
      { tag: '[AST]', msg: 'Parsed 42 modules (TypeScript 5.7)', color: '#38bdf8' },
      { tag: '[PLAN]', msg: 'Decouple ingestion queue into Redis streams', color: '#fbbf24' },
      { tag: '[CODEX]', msg: 'Generating non-blocking worker pool...', color: '#34d399' },
      { tag: '[PATCH]', msg: 'Injected batch processor with backpressure', color: '#a78bfa' },
    ];

    streamLogs.forEach((log) => {
      ctx.fillStyle = log.color;
      ctx.font = 'bold 11px monospace';
      ctx.fillText(log.tag, 20, y);
      ctx.fillStyle = '#cbd5e1';
      ctx.font = '11px monospace';
      ctx.fillText(` ${log.msg}`, 74, y);
      y += 22;
    });

    y += 10;

    // Generated Code Box
    ctx.fillStyle = '#090d16';
    ctx.beginPath();
    ctx.roundRect(16, y, w - 32, 260, 8);
    ctx.fill();
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Header of code box
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.roundRect(16, y, w - 32, 28, [8, 8, 0, 0]);
    ctx.fill();
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 11px monospace';
    ctx.fillText('📄 src/telemetry/audit-export.worker.ts', 28, y + 18);

    // Code lines with syntax highlighting
    const codeLines = [
      { text: "import { Processor, Process } from '@nestjs/bull';", color: '#f43f5e' },
      { text: "import { Job } from 'bull';", color: '#f43f5e' },
      { text: '', color: '#ffffff' },
      { text: "@Processor('telemetry')", color: '#fbbf24' },
      { text: 'export class AuditStreamWorker {', color: '#60a5fa' },
      { text: "  @Process('batch-ingest')", color: '#fbbf24' },
      { text: '  async handle(job: Job<AuditEvent[]>) {', color: '#60a5fa' },
      { text: '    const { events, clusterId } = job.data;', color: '#e2e8f0' },
      { text: '    // High-throughput Redis bulk commit', color: '#64748b' },
      { text: '    await this.cluster.bulkInsert(clusterId, events);', color: '#34d399' },
      { text: "    return { count: events.length, status: 'ok' };", color: '#38bdf8' },
      { text: '  }', color: '#60a5fa' },
      { text: '}', color: '#60a5fa' },
    ];

    let codeY = y + 48;
    codeLines.forEach((cl, idx) => {
      ctx.fillStyle = '#475569';
      ctx.font = '10px monospace';
      ctx.fillText(String(idx + 1).padStart(2, '0'), 24, codeY);

      ctx.fillStyle = cl.color;
      ctx.font = '11px monospace';
      ctx.fillText(cl.text, 50, codeY);
      codeY += 16;
    });

    y += 278;

    // Benchmark & Validation Stats
    ctx.fillStyle = '#131d2e';
    ctx.beginPath();
    ctx.roundRect(16, y, w - 32, 90, 8);
    ctx.fill();
    ctx.strokeStyle = '#059669';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = '#34d399';
    ctx.font = 'bold 12px monospace';
    ctx.fillText('✔ 48/48 End-to-End Tests Passed (142ms)', 28, y + 26);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px monospace';
    ctx.fillText('⚡ Redis caching: −70% database response latency', 28, y + 48);
    ctx.fillText('⚡ 230M+ records exported · zero memory overflow', 28, y + 68);

    y += 114;

    // Active blinking cursor line
    const blink = Math.floor(frame / 15) % 2 === 0;
    ctx.fillStyle = '#38bdf8';
    ctx.font = '12px monospace';
    ctx.fillText('codex@workstation:~/novahoangdev $', 20, y);
    ctx.fillStyle = '#f1f5f9';
    ctx.fillText(' codex --verify --deploy-preview', 255, y);
    if (blink) {
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(495, y - 12, 8, 15);
    }

    // Bottom Navigation Bar
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, h - 38, w, 38);
    ctx.fillStyle = '#334155';
    ctx.fillRect(0, h - 39, w, 1);

    ctx.fillStyle = '#da7756';
    ctx.font = 'bold 11px monospace';
    ctx.fillText('⟳ Click screen to switch to CLAUDE CLI', 20, h - 15);

    ctx.fillStyle = '#64748b';
    ctx.font = '10px monospace';
    ctx.fillText('TERMINAL CODEX · MODE 0', w - 165, h - 15);
  } else {
    // =========================================================
    // MODE 1: CLAUDE CLI (Anthropic Claude Code Terminal Agent)
    // =========================================================
    // Warm deep obsidian terminal background
    ctx.fillStyle = '#0d0e12';
    ctx.fillRect(0, 0, w, h);

    // Subtle dark slate scanline grid
    ctx.fillStyle = 'rgba(24, 24, 30, 0.35)';
    for (let sy = 0; sy < h; sy += 6) {
      ctx.fillRect(0, sy, w, 1);
    }

    // Window top titlebar
    ctx.fillStyle = '#181920';
    ctx.fillRect(0, 0, w, 44);
    ctx.fillStyle = '#272832';
    ctx.fillRect(0, 43, w, 1);

    // Traffic lights (Close, Minimize, Maximize)
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(22, 22, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(42, 22, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.arc(62, 22, 6, 0, Math.PI * 2);
    ctx.fill();

    // Title & status pill
    ctx.fillStyle = '#cbd5e1';
    ctx.font = 'bold 13px monospace';
    ctx.fillText('claude-code — ~/enterprise-systems — zsh', 86, 26);

    // Active Claude Terracotta Pulse Badge
    ctx.fillStyle = '#451a03';
    ctx.beginPath();
    ctx.roundRect(w - 145, 12, 130, 22, 11);
    ctx.fill();
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 1;
    ctx.stroke();

    const pulseAlpha = 0.6 + 0.4 * Math.sin(frame * 0.1);
    ctx.fillStyle = `rgba(251, 146, 60, ${pulseAlpha})`;
    ctx.beginPath();
    ctx.arc(w - 132, 23, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#fb923c';
    ctx.font = 'bold 10px monospace';
    ctx.fillText('CLAUDE ACTIVE', w - 120, 26);

    let cy = 72;

    // Shell invocation command
    ctx.fillStyle = '#94a3b8';
    ctx.font = '12px monospace';
    ctx.fillText('nova@workstation:~/enterprise-systems (main)', 20, cy);
    cy += 22;

    ctx.fillStyle = '#da7756';
    ctx.fillText('❯', 20, cy);
    ctx.fillStyle = '#f8fafc';
    ctx.fillText(' claude "Refactor telemetry pipeline with Redlock"', 32, cy);
    cy += 30;

    // Claude Code Official Banner (Rounded Box with Terracotta border)
    ctx.fillStyle = '#16171e';
    ctx.beginPath();
    ctx.roundRect(16, cy, w - 32, 94, 8);
    ctx.fill();
    ctx.strokeStyle = '#da7756';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Claude Sparkle icon
    ctx.fillStyle = '#da7756';
    ctx.font = 'bold 16px monospace';
    ctx.fillText('✳', 28, cy + 28);

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 14px monospace';
    ctx.fillText('Claude Code (v1.0.18)', 48, cy + 28);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px monospace';
    ctx.fillText('Model: claude-3-7-sonnet-20250219 (extended thinking enabled)', 28, cy + 52);
    ctx.fillText('Cwd: ~/enterprise-systems/telemetry', 28, cy + 72);
    cy += 114;

    // Thinking Process Accordion Box
    ctx.fillStyle = '#13141a';
    ctx.beginPath();
    ctx.roundRect(16, cy, w - 32, 108, 8);
    ctx.fill();
    ctx.strokeStyle = '#2e303e';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = '#fb923c';
    ctx.font = 'bold 12px monospace';
    ctx.fillText('⚡ Thinking Process (1,840 tokens)', 28, cy + 24);

    const thinkingSteps = [
      '1. Inspect high-frequency ingestion schema in src/telemetry/schema.ts',
      '2. Implement Redlock pattern to prevent race conditions across cluster nodes',
      '3. Batch Redis XADD writes through a pipeline',
      '4. Run automated benchmark & regression test suite',
    ];

    let stepY = cy + 44;
    thinkingSteps.forEach((step) => {
      ctx.fillStyle = '#94a3b8';
      ctx.font = '10px monospace';
      ctx.fillText(step, 28, stepY);
      stepY += 18;
    });

    cy += 124;

    // Tool Call Executions
    ctx.fillStyle = '#da7756';
    ctx.font = 'bold 12px monospace';
    ctx.fillText('▸ TOOL EXECUTIONS', 20, cy);
    cy += 20;

    const toolCalls = [
      { op: '⏺ ReadFile', arg: 'src/telemetry/pipeline.ts', res: '142 lines read', color: '#38bdf8' },
      { op: '⏺ Edit', arg: 'src/telemetry/pipeline.ts', res: 'Applied 2 diff hunks', color: '#34d399' },
      { op: '⏺ Bash', arg: 'npm test -- telemetry', res: '✔ 48 passed (118ms)', color: '#fbbf24' },
    ];

    toolCalls.forEach((tc) => {
      ctx.fillStyle = tc.color;
      ctx.font = 'bold 11px monospace';
      ctx.fillText(tc.op, 20, cy);
      ctx.fillStyle = '#e2e8f0';
      ctx.font = '11px monospace';
      ctx.fillText(`(${tc.arg})`, 108, cy);
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(`→ ${tc.res}`, 360, cy);
      cy += 22;
    });

    cy += 10;

    // Diff View Box
    ctx.fillStyle = '#0a0b0e';
    ctx.beginPath();
    ctx.roundRect(16, cy, w - 32, 220, 8);
    ctx.fill();
    ctx.strokeStyle = '#272832';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Diff header
    ctx.fillStyle = '#1e1f2a';
    ctx.beginPath();
    ctx.roundRect(16, cy, w - 32, 28, [8, 8, 0, 0]);
    ctx.fill();
    ctx.fillStyle = '#da7756';
    ctx.font = 'bold 11px monospace';
    ctx.fillText('DIFF: src/telemetry/pipeline.ts (Distributed Locking Patch)', 28, cy + 18);

    const diffLines = [
      { text: '@@ -38,6 +38,12 @@ export class TelemetryPipeline {', color: '#64748b' },
      { text: '-   // Legacy direct DB insert (slow bottleneck)', color: '#ef4444' },
      { text: "-   await this.db.query('INSERT INTO audit_logs...');", color: '#ef4444' },
      { text: '+   // Redlock distributed lock with 2,000ms TTL', color: '#10b981' },
      { text: "+   const lock = await this.redlock.acquire(['lock:telemetry'], 2000);", color: '#10b981' },
      { text: '+   try {', color: '#10b981' },
      { text: "+     await this.redisPipeline.xadd('stream:telemetry', '*', 'data', batch);", color: '#10b981' },
      { text: '+   } finally {', color: '#10b981' },
      { text: '+     await lock.release();', color: '#10b981' },
      { text: '+   }', color: '#10b981' },
    ];

    let diffY = cy + 48;
    diffLines.forEach((dl) => {
      ctx.fillStyle = dl.color;
      ctx.font = '11px monospace';
      ctx.fillText(dl.text, 28, diffY);
      diffY += 17;
    });

    cy += 238;

    // Claude Cost & Summary Card
    ctx.fillStyle = '#151722';
    ctx.beginPath();
    ctx.roundRect(16, cy, w - 32, 78, 8);
    ctx.fill();
    ctx.strokeStyle = '#059669';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = '#34d399';
    ctx.font = 'bold 12px monospace';
    ctx.fillText('✔ Completed refactor in 3.2s with zero regressions', 28, cy + 24);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px monospace';
    ctx.fillText('Tokens: 24.2k in · 2.8k out | Cost: $0.088 | Context: 18% of 200k', 28, cy + 46);
    ctx.fillText('Redis caching layer: −70% database response latency', 28, cy + 64);

    cy += 100;

    // Interactive Claude prompt with blinking cursor
    const blink = Math.floor(frame / 15) % 2 === 0;
    ctx.fillStyle = '#da7756';
    ctx.font = '12px monospace';
    ctx.fillText('> claude:', 20, cy);
    ctx.fillStyle = '#f1f5f9';
    ctx.fillText(' Refactor complete. Ready to push to main branch?', 85, cy);
    cy += 22;

    ctx.fillStyle = '#da7756';
    ctx.fillText('❯', 20, cy);
    ctx.fillStyle = '#f8fafc';
    ctx.fillText(' git commit -am "feat: distributed locks for telemetry stream"', 34, cy);
    if (blink) {
      ctx.fillStyle = '#da7756';
      ctx.fillRect(495, cy - 12, 8, 15);
    }

    // Bottom Navigation Bar
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, h - 38, w, 38);
    ctx.fillStyle = '#334155';
    ctx.fillRect(0, h - 39, w, 1);

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 11px monospace';
    ctx.fillText('⟳ Click screen to switch to TERMINAL CODEX', 20, h - 15);

    ctx.fillStyle = '#fb923c';
    ctx.font = '10px monospace';
    ctx.fillText('CLAUDE CLI · MODE 1', w - 145, h - 15);
  }
}

// Draw MacBook Pro M2 Retina Display (macOS Sequoia with VS Code, Terminal & Floating Dock)
function drawLaptopScreen(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const w = canvas.width;
  const h = canvas.height;

  // 1. macOS Sequoia / Sonoma Vibrant Dynamic Wallpaper
  const grad = ctx.createLinearGradient(0, 0, w, h);
  grad.addColorStop(0, '#0a0f1d');
  grad.addColorStop(0.25, '#1e1b4b');
  grad.addColorStop(0.55, '#0c4a6e');
  grad.addColorStop(0.8, '#4338ca');
  grad.addColorStop(1, '#9333ea');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Dynamic sweeping light ribbons
  ctx.save();
  const ribbonGrad = ctx.createRadialGradient(w * 0.45, h * 0.4, 40, w * 0.5, h * 0.5, w * 0.6);
  ribbonGrad.addColorStop(0, 'rgba(56, 189, 248, 0.25)');
  ribbonGrad.addColorStop(0.5, 'rgba(168, 85, 247, 0.15)');
  ribbonGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = ribbonGrad;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();

  // 2. macOS Top Menu Bar
  ctx.fillStyle = 'rgba(15, 23, 42, 0.82)';
  ctx.fillRect(0, 0, w, 28);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, 28);
  ctx.lineTo(w, 28);
  ctx.stroke();

  // Apple Logo 
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 15px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  ctx.fillText('', 18, 19);

  // Active App Name
  ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  ctx.fillText('Code', 42, 19);

  // Menu items
  ctx.fillStyle = '#94a3b8';
  ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  ['File', 'Edit', 'Selection', 'View', 'Go', 'Run', 'Terminal', 'Window', 'Help'].forEach((item, idx) => {
    ctx.fillText(item, 85 + idx * 48, 19);
  });

  // Right status bar items (Battery, Wi-Fi, Control Center, Time)
  ctx.fillStyle = '#e2e8f0';
  ctx.font = '11px -apple-system, BlinkMacSystemFont, "Segoe UI", monospace';
  ctx.fillText('🔋 100% ⚡', w - 240, 19);
  ctx.fillText('Wi-Fi', w - 175, 19);
  ctx.fillText('🎛️', w - 135, 19);
  ctx.fillText('🔍', w - 110, 19);
  ctx.fillText('10:42 AM', w - 85, 19);

  // 3. Main Window: Visual Studio Code (Left/Center)
  const codeX = 24;
  const codeY = 42;
  const codeW = 590;
  const codeH = 520;

  // Window dropshadow & body
  ctx.fillStyle = 'rgba(17, 24, 39, 0.96)';
  ctx.beginPath();
  ctx.roundRect(codeX, codeY, codeW, codeH, 10);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // VS Code Titlebar
  ctx.fillStyle = 'rgba(15, 20, 32, 0.98)';
  ctx.beginPath();
  ctx.roundRect(codeX, codeY, codeW, 34, [10, 10, 0, 0]);
  ctx.fill();

  // Traffic light buttons
  [
    { x: codeX + 16, color: '#ef4444' },
    { x: codeX + 34, color: '#f59e0b' },
    { x: codeX + 52, color: '#10b981' },
  ].forEach((b) => {
    ctx.fillStyle = b.color;
    ctx.beginPath();
    ctx.arc(b.x, codeY + 17, 5, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.fillStyle = '#94a3b8';
  ctx.font = '11px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  ctx.fillText('portfolio-3d — src/three/workstation.ts — Visual Studio Code', codeX + 80, codeY + 21);

  // Tabs Bar
  ctx.fillStyle = 'rgba(24, 31, 46, 0.95)';
  ctx.fillRect(codeX, codeY + 34, codeW, 28);

  // Active Tab
  ctx.fillStyle = 'rgba(17, 24, 39, 0.96)';
  ctx.fillRect(codeX + 50, codeY + 34, 150, 28);
  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 11px monospace';
  ctx.fillText('TS workstation.ts', codeX + 62, codeY + 52);

  // Inactive Tab
  ctx.fillStyle = '#64748b';
  ctx.font = '11px monospace';
  ctx.fillText('TSX ThreeCanvas.tsx', codeX + 215, codeY + 52);
  ctx.fillText('TSX App.tsx', codeX + 370, codeY + 52);

  // Code Lines with syntax highlighting
  const codeLines: Array<{ num: number; tokens: Array<{ t: string; c: string }> }> = [
    { num: 1, tokens: [{ t: "import", c: "#c084fc" }, { t: " * as THREE", c: "#38bdf8" }, { t: " from", c: "#c084fc" }, { t: " 'three';", c: "#34d399" }] },
    { num: 2, tokens: [{ t: "import", c: "#c084fc" }, { t: " { createWorkstation }", c: "#e2e8f0" }, { t: " from", c: "#c084fc" }, { t: " './workstation';", c: "#34d399" }] },
    { num: 3, tokens: [{ t: "// 🚀 Developer Profile: Hoang Van Hoa", c: "#64748b" }] },
    { num: 4, tokens: [{ t: "export const", c: "#c084fc" }, { t: " developerProfile", c: "#38bdf8" }, { t: " = {", c: "#e2e8f0" }] },
    { num: 5, tokens: [{ t: "  name:", c: "#94a3b8" }, { t: ' "Hoang Van Hoa",', c: "#fde047" }] },
    { num: 6, tokens: [{ t: "  role:", c: "#94a3b8" }, { t: ' "Senior 3D WebGL & Full-Stack Developer",', c: "#34d399" }] },
    { num: 7, tokens: [{ t: "  hardware:", c: "#94a3b8" }, { t: ' "Apple MacBook Pro 16\\" (M2 Max)",', c: "#f472b6" }] },
    { num: 8, tokens: [{ t: "  stack:", c: "#94a3b8" }, { t: ' ["React", "TypeScript", "Three.js", "Tailwind"],', c: "#38bdf8" }] },
    { num: 9, tokens: [{ t: "  performance:", c: "#94a3b8" }, { t: ' "60.0 FPS Locked • Ultra-Smooth 3D",', c: "#a3e635" }] },
    { num: 10, tokens: [{ t: "  status:", c: "#94a3b8" }, { t: ' "Ready for Opportunities 🚀",', c: "#fde047" }] },
    { num: 11, tokens: [{ t: "};", c: "#e2e8f0" }] },
    { num: 12, tokens: [{ t: "console", c: "#38bdf8" }, { t: ".log(", c: "#e2e8f0" }, { t: '"Portfolio Workstation Initialized ✓"', c: "#34d399" }, { t: ");", c: "#e2e8f0" }] },
  ];

  ctx.font = '12px "SF Mono", "Fira Code", monospace';
  codeLines.forEach((line, idx) => {
    const ly = codeY + 86 + idx * 26;
    // Line Number
    ctx.fillStyle = '#475569';
    ctx.textAlign = 'right';
    ctx.fillText(String(line.num), codeX + 38, ly);

    // Code Tokens
    ctx.textAlign = 'left';
    let curX = codeX + 54;
    line.tokens.forEach((tk) => {
      ctx.fillStyle = tk.c;
      ctx.fillText(tk.t, curX, ly);
      curX += ctx.measureText(tk.t).width;
    });
  });

  // VS Code Bottom Status Bar
  ctx.fillStyle = '#0284c7';
  ctx.beginPath();
  ctx.roundRect(codeX, codeY + codeH - 22, codeW, 22, [0, 0, 10, 10]);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = '10px -apple-system, BlinkMacSystemFont, monospace';
  ctx.fillText('⎇ main*  ⊘ 0  ⚠ 0  TypeScript 5.5  UTF-8  LF  60 FPS Locked', codeX + 16, codeY + codeH - 7);

  // 4. Secondary Window: Terminal (Right)
  const termX = 630;
  const termY = 42;
  const termW = 370;
  const termH = 470;

  ctx.fillStyle = 'rgba(10, 14, 26, 0.95)';
  ctx.beginPath();
  ctx.roundRect(termX, termY, termW, termH, 10);
  ctx.fill();
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.25)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Terminal Titlebar
  ctx.fillStyle = 'rgba(15, 20, 32, 0.98)';
  ctx.beginPath();
  ctx.roundRect(termX, termY, termW, 34, [10, 10, 0, 0]);
  ctx.fill();

  [
    { x: termX + 16, color: '#ef4444' },
    { x: termX + 34, color: '#f59e0b' },
    { x: termX + 52, color: '#10b981' },
  ].forEach((b) => {
    ctx.fillStyle = b.color;
    ctx.beginPath();
    ctx.arc(b.x, termY + 17, 5, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.fillStyle = '#94a3b8';
  ctx.font = '11px monospace';
  ctx.fillText('hoanghoa@MacBook-Pro-M2: ~ (zsh)', termX + 76, termY + 21);

  // Terminal Logs & Neofetch
  const termLogs = [
    { text: '$ neofetch --apple-m2', color: '#38bdf8' },
    { text: 'OS: macOS Sequoia 15.1 (Apple Silicon)', color: '#34d399' },
    { text: 'Host: MacBook Pro 16" (M2 Max)', color: '#34d399' },
    { text: 'CPU: Apple M2 Max (12-Core, 3.68 GHz)', color: '#e2e8f0' },
    { text: 'GPU: Apple M2 Max 38-Core WebGL Engine', color: '#e2e8f0' },
    { text: 'Memory: 64 GB Unified LPDDR5', color: '#e2e8f0' },
    { text: '----------------------------------------', color: '#475569' },
    { text: '➜ yarn dev', color: '#fde047' },
    { text: '⚡ Vite v5.4.2 ready in 118 ms', color: '#34d399' },
    { text: '➜ Local:   http://localhost:3000/', color: '#38bdf8' },
    { text: '➜ Network: 192.168.1.108:3000/', color: '#94a3b8' },
    { text: '✓ 3D WebGL Canvas: 60.0 FPS Active', color: '#10b981' },
  ];

  ctx.font = '11px "SF Mono", monospace';
  termLogs.forEach((log, idx) => {
    ctx.fillStyle = log.color;
    ctx.fillText(log.text, termX + 16, termY + 62 + idx * 24);
  });

  // 5. Floating macOS Dock at Bottom
  const dockW = 440;
  const dockH = 40;
  const dockX = (w - dockW) / 2;
  const dockY = h - 48;

  ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
  ctx.beginPath();
  ctx.roundRect(dockX, dockY, dockW, dockH, 14);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // App Icons (Finder, Safari, Messages, VS Code, Terminal, Figma, Slack, Spotify, Settings, Trash)
  const dockApps = [
    { label: 'Finder', bg: '#0284c7', sym: '🙂' },
    { label: 'Safari', bg: '#0369a1', sym: '🧭' },
    { label: 'Messages', bg: '#22c55e', sym: '💬' },
    { label: 'VS Code', bg: '#007acc', sym: '⚡' },
    { label: 'Terminal', bg: '#090d16', sym: '>_' },
    { label: 'Figma', bg: '#a855f7', sym: '🎨' },
    { label: 'Slack', bg: '#e11d48', sym: '#' },
    { label: 'Spotify', bg: '#10b981', sym: '♫' },
    { label: 'Settings', bg: '#475569', sym: '⚙️' },
    { label: 'Trash', bg: '#334155', sym: '🗑️' },
  ];

  dockApps.forEach((app, idx) => {
    const ax = dockX + 12 + idx * 42;
    const ay = dockY + 5;
    ctx.fillStyle = app.bg;
    ctx.beginPath();
    ctx.roundRect(ax, ay, 30, 30, 8);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(app.sym, ax + 15, ay + 20);
  });
  ctx.textAlign = 'left';
}

// Draw dynamic digital desk clock / Pomodoro display (High-Res 512x320)
function drawDeskClock(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const w = canvas.width;
  const h = canvas.height;

  // Dark sleek gradient background
  const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
  bgGrad.addColorStop(0, '#090d16');
  bgGrad.addColorStop(1, '#0d1527');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, w, h);

  // Elegant rounded border frame
  ctx.strokeStyle = '#0284c7';
  ctx.lineWidth = 4;
  pathRoundedRect(ctx, 10, 10, w - 20, h - 20, 18);
  ctx.stroke();

  // Subtle inner glowing border
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.25)';
  ctx.lineWidth = 1.5;
  pathRoundedRect(ctx, 16, 16, w - 32, h - 32, 14);
  ctx.stroke();

  const now = new Date();
  const hrs = String(now.getHours()).padStart(2, '0');
  const mins = String(now.getMinutes()).padStart(2, '0');
  const secs = String(now.getSeconds()).padStart(2, '0');

  // Top Status Bar
  ctx.fillStyle = '#94a3b8';
  ctx.font = 'bold 18px "SF Pro Text", -apple-system, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('WED, 17 SEP', 32, 46);

  ctx.textAlign = 'right';
  ctx.fillStyle = '#38bdf8';
  ctx.fillText('24°C ☀️', w - 32, 46);

  // Big Bold Digital Time (Centered with plenty of vertical margin)
  ctx.textAlign = 'center';
  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 96px "SF Pro Display", "Arial Black", monospace';
  ctx.fillText(`${hrs}:${mins}`, w / 2 - 28, 154);

  // Smaller seconds counter badge
  ctx.fillStyle = '#0284c7';
  ctx.font = 'bold 36px "SF Pro Display", monospace';
  ctx.textAlign = 'left';
  ctx.fillText(`:${secs}`, w / 2 + 120, 134);

  // Bottom Pomodoro Focus Status Pill
  const pillW = 260;
  const pillH = 46;
  const pillX = (w - pillW) / 2;
  const pillY = 224;

  ctx.fillStyle = '#022c22';
  pathRoundedRect(ctx, pillX, pillY, pillW, pillH, 23);
  ctx.fill();

  ctx.strokeStyle = '#059669';
  ctx.lineWidth = 2;
  pathRoundedRect(ctx, pillX, pillY, pillW, pillH, 23);
  ctx.stroke();

  // Glowing emerald status indicator dot
  ctx.fillStyle = '#10b981';
  ctx.beginPath();
  ctx.arc(pillX + 32, pillY + pillH / 2, 7, 0, Math.PI * 2);
  ctx.fill();

  // Pomodoro text
  ctx.fillStyle = '#34d399';
  ctx.font = 'bold 20px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('FOCUS 25:00', pillX + pillW / 2 + 10, pillY + 29);
}

// Safe cross-browser 2D rounded rectangle path helper for canvas
function pathRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.lineTo(x + w - rad, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rad);
  ctx.lineTo(x + w, y + h - rad);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rad, y + h);
  ctx.lineTo(x + rad, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rad);
  ctx.lineTo(x, y + rad);
  ctx.quadraticCurveTo(x, y, x + rad, y);
  ctx.closePath();
}

// Draw photorealistic smartphone lockscreen (Flagship iOS Lock Screen with 4 rounded corners)
function drawPhoneScreen(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const w = canvas.width;
  const h = canvas.height;

  // Clear canvas
  ctx.clearRect(0, 0, w, h);

  // Clip the entire canvas to 4 smooth rounded corners (authentic iPhone 16 Pro display)
  ctx.save();
  pathRoundedRect(ctx, 0, 0, w, h, 46);
  ctx.clip();

  // 1. Deep OLED Cosmic Fluid Wallpaper (Bright, saturated and luminous)
  const grad = ctx.createLinearGradient(0, 0, w, h);
  grad.addColorStop(0, '#0a1428');
  grad.addColorStop(0.28, '#1e1b4b');
  grad.addColorStop(0.65, '#0284c7');
  grad.addColorStop(0.9, '#38bdf8');
  grad.addColorStop(1, '#818cf8');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // High-luminance radial aura in the center
  ctx.save();
  const orb = ctx.createRadialGradient(w * 0.5, h * 0.38, 20, w * 0.5, h * 0.38, w * 0.65);
  orb.addColorStop(0, 'rgba(56, 189, 248, 0.45)');
  orb.addColorStop(0.5, 'rgba(168, 85, 247, 0.25)');
  orb.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = orb;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();

  // 2. Top Status Bar (5G, Wi-Fi, Battery)
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 13px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('5G', 26, 29);

  // Battery Capsule
  ctx.fillStyle = '#10b981';
  pathRoundedRect(ctx, w - 58, 18, 34, 15, 4);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 9px monospace';
  ctx.fillText('100%', w - 52, 30);

  // 3. Iconic Dynamic Island Pill
  ctx.fillStyle = '#000000';
  pathRoundedRect(ctx, w / 2 - 55, 14, 110, 28, 14);
  ctx.fill();

  // Camera lens reflection inside Island
  ctx.fillStyle = '#1e293b';
  ctx.beginPath();
  ctx.arc(w / 2 + 28, 28, 5, 0, Math.PI * 2);
  ctx.fill();

  // Mini live activity inside Dynamic Island (Now Playing music equalizer)
  ctx.fillStyle = '#10b981';
  ctx.font = '11px sans-serif';
  ctx.fillText('♫ ılılı', w / 2 - 42, 32);

  // 4. Large Apple San Francisco Display Clock
  const now = new Date();
  const hrs = String(now.getHours()).padStart(2, '0');
  const mins = String(now.getMinutes()).padStart(2, '0');
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 72px -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`${hrs}:${mins}`, w / 2, 148);

  // Date in English
  ctx.fillStyle = '#bae6fd';
  ctx.font = '600 16px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillText(`${days[now.getDay()]}, ${months[now.getMonth()]} ${now.getDate()}`, w / 2, 180);

  // Weather / Fitness Widget Pill
  ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
  pathRoundedRect(ctx, w / 2 - 130, 198, 260, 32, 16);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = '500 12px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillText('🌤️ 76°F San Francisco • Clear Skies', w / 2, 219);

  // 5. Translucent Frosted Glass Notification Card
  const notifX = 18;
  const notifY = 248;
  const notifW = w - 36;
  const notifH = 156;

  ctx.fillStyle = 'rgba(15, 23, 42, 0.65)';
  pathRoundedRect(ctx, notifX, notifY, notifW, notifH, 20);
  ctx.fill();
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.45)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // App Icon Badge (Messages)
  ctx.fillStyle = '#22c55e';
  pathRoundedRect(ctx, notifX + 16, notifY + 16, 32, 32, 8);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 16px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('💬', notifX + 32, notifY + 38);

  // Header
  ctx.textAlign = 'left';
  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 11px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillText('MESSAGES • JUST NOW', notifX + 58, notifY + 28);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 15px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillText('Hoang Van Hoa', notifX + 58, notifY + 45);

  ctx.fillStyle = '#f1f5f9';
  ctx.font = '13px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillText('3D WebGL Portfolio is online!', notifX + 18, notifY + 76);
  ctx.fillStyle = '#94a3b8';
  ctx.font = '12px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillText('Lighting & photorealistic models loaded.', notifX + 18, notifY + 98);
  ctx.fillText('Interactive 3D workstation running 60 FPS 🚀', notifX + 18, notifY + 118);

  // Wireless Fast Charging Status
  ctx.fillStyle = '#34d399';
  ctx.font = 'bold 13px -apple-system, BlinkMacSystemFont, monospace';
  ctx.textAlign = 'center';
  ctx.fillText('⚡ MagSafe Fast Charging • 100%', w / 2, h - 85);

  // 6. Bottom Lock Screen Buttons (Flashlight & Camera)
  const btnY = h - 60;
  // Left: Flashlight
  ctx.fillStyle = 'rgba(255, 255, 255, 0.28)';
  ctx.beginPath();
  ctx.arc(48, btnY, 22, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = '16px sans-serif';
  ctx.fillText('🔦', 48, btnY + 6);

  // Right: Camera
  ctx.fillStyle = 'rgba(255, 255, 255, 0.28)';
  ctx.beginPath();
  ctx.arc(w - 48, btnY, 22, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = '16px sans-serif';
  ctx.fillText('📷', w - 48, btnY + 6);

  // 7. Home Indicator Bar
  ctx.fillStyle = '#ffffff';
  pathRoundedRect(ctx, w / 2 - 65, h - 14, 130, 5, 2.5);
  ctx.fill();

  ctx.restore();

  // Subtle outer edge highlight
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
  ctx.lineWidth = 2;
  pathRoundedRect(ctx, 1, 1, w - 2, h - 2, 46);
  ctx.stroke();
}

// Draw authentic digital OLED handset display for motorized sit-stand desk
function drawControlPadDisplay(canvas: HTMLCanvasElement, heightCm: number, direction: 'up' | 'down' | 'idle') {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  // Sleek OLED glass bezel
  ctx.fillStyle = '#090d16';
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = direction !== 'idle' ? '#00f0ff' : '#0369a1';
  ctx.lineWidth = 3;
  ctx.strokeRect(2, 2, w - 4, h - 4);

  // Left: Digital 7-segment / LED numbers
  ctx.fillStyle = direction !== 'idle' ? '#00f0ff' : '#38bdf8';
  ctx.shadowColor = '#00f0ff';
  ctx.shadowBlur = 6;
  ctx.font = 'bold 36px "SF Pro Display", "JetBrains Mono", monospace';
  ctx.textAlign = 'left';
  ctx.fillText(`${heightCm.toFixed(1)}`, 14, 46);

  ctx.font = 'bold 15px monospace';
  ctx.fillStyle = '#94a3b8';
  ctx.shadowBlur = 0;
  ctx.fillText('cm', 122, 46);

  // Status label
  ctx.font = 'bold 12px monospace';
  if (direction === 'up') {
    ctx.fillStyle = '#34d399';
    ctx.fillText('▲ RAISING...', 14, 76);
  } else if (direction === 'down') {
    ctx.fillStyle = '#f59e0b';
    ctx.fillText('▼ LOWERING...', 14, 76);
  } else if (heightCm >= 95) {
    ctx.fillStyle = '#38bdf8';
    ctx.fillText('⚡ STAND PRESET [2]', 14, 76);
  } else {
    ctx.fillStyle = '#38bdf8';
    ctx.fillText('💤 SIT PRESET [1]', 14, 76);
  }

  // Divider
  ctx.strokeStyle = '#1e293b';
  ctx.beginPath();
  ctx.moveTo(170, 6);
  ctx.lineTo(170, h - 6);
  ctx.stroke();

  // Up Button
  ctx.fillStyle = direction === 'up' ? '#00f0ff' : '#1e293b';
  ctx.beginPath();
  ctx.arc(195, 26, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = direction === 'up' ? '#000000' : '#ffffff';
  ctx.font = 'bold 15px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('▲', 195, 32);

  // Down Button
  ctx.fillStyle = direction === 'down' ? '#f59e0b' : '#1e293b';
  ctx.beginPath();
  ctx.arc(195, 66, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = direction === 'down' ? '#000000' : '#ffffff';
  ctx.fillText('▼', 195, 72);

  // Preset 1 Button
  ctx.fillStyle = heightCm < 95 && direction === 'idle' ? '#0284c7' : '#1e293b';
  ctx.beginPath();
  ctx.arc(232, 26, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 13px sans-serif';
  ctx.fillText('1', 232, 31);

  // Preset 2 Button
  ctx.fillStyle = heightCm >= 95 && direction === 'idle' ? '#0284c7' : '#1e293b';
  ctx.beginPath();
  ctx.arc(232, 66, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.fillText('2', 232, 71);
}

/**
 * Creates the high-detail low-poly Developer Workstation with interactive objects
 */
export function createDetailedWorkstation(): WorkstationInstance {
  const workstation = new THREE.Group();
  workstation.name = 'developer-workstation';

  const state: WorkstationState = {
    lampOn: true,
    lampMode: 'warm',
    screenbarOn: true,
    mainScreenMode: 0,
    verticalScreenMode: 0,
    speakerPlaying: false,
    pcColorIdx: 0,
    chairSwivelTarget: 0,
    deskElevation: 0.22,
    deskElevationTarget: 0.22,
    deskIsElevated: false,
    deskCurrentHeightCm: 74.0,
  };

  // Materials palette
  const darkMetalMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    metalness: 0.85,
    roughness: 0.25,
    flatShading: true,
  });

  const aluminumMat = new THREE.MeshStandardMaterial({
    color: 0x94a3b8,
    metalness: 0.9,
    roughness: 0.2,
  });

  const deskMat = new THREE.MeshStandardMaterial({
    color: 0x18202f,
    roughness: 0.45,
    metalness: 0.2,
    flatShading: true,
  });

  // -------------------------------------------------------------
  // 1. SIT-STAND DESK TABLE & FRAME (Ergonomically Elevated Sit-Stand Desk)
  // -------------------------------------------------------------
  const DESK_ELEVATION = 0.22; // Elevate desk surface for optimal armrest clearance and standing ergonomics
  const deskTopGroup = new THREE.Group();
  deskTopGroup.name = 'desk-top';
  deskTopGroup.position.set(0, DESK_ELEVATION, 0);
  workstation.add(deskTopGroup);

  const deskTopGeo = new THREE.BoxGeometry(4.1, 0.12, 2.0);
  const deskTop = new THREE.Mesh(deskTopGeo, deskMat);
  deskTop.position.set(0, 1.22, 0);
  deskTop.castShadow = true;
  deskTop.receiveShadow = true;
  deskTopGroup.add(deskTop);

  // Large cyber desk mat with glowing border (seated on desk surface at y = 1.28)
  const deskPadGeo = new THREE.BoxGeometry(2.8, 0.015, 1.05);
  const deskPadMat = new THREE.MeshStandardMaterial({
    color: 0x020617,
    roughness: 0.8,
  });
  const deskPad = new THREE.Mesh(deskPadGeo, deskPadMat);
  deskPad.position.set(0, 1.285, 0.1);
  deskPad.receiveShadow = true;
  deskTopGroup.add(deskPad);

  // Desk pad cyan glow border
  const padBorderGeo = new THREE.BoxGeometry(2.84, 0.012, 1.09);
  const padBorderMat = new THREE.MeshStandardMaterial({
    color: 0x0284c7,
    emissive: 0x0369a1,
    emissiveIntensity: 0.4,
  });
  const padBorder = new THREE.Mesh(padBorderGeo, padBorderMat);
  padBorder.position.set(0, 1.282, 0.1);
  deskTopGroup.add(padBorder);

  // Dual motorized desk legs (Two-stage heavy-duty telescoping T-frame)
  const outerColGeo = new THREE.BoxGeometry(0.16, 0.76, 0.16);
  const innerColGeo = new THREE.BoxGeometry(0.12, 1.15, 0.12);
  const footGeo = new THREE.BoxGeometry(0.20, 0.08, 1.6);
  const legPositions = [-1.75, 1.75];

  legPositions.forEach((x) => {
    // Floor foot bracket (anchored firmly on floor at y = 0.04)
    const foot = new THREE.Mesh(footGeo, darkMetalMat);
    foot.position.set(x, 0.04, 0);
    foot.castShadow = true;
    workstation.add(foot);

    // Stationary outer lower column (spans from y = 0.08 to y = 0.84)
    const lowerCol = new THREE.Mesh(outerColGeo, darkMetalMat);
    lowerCol.position.set(x, 0.46, 0);
    lowerCol.castShadow = true;
    workstation.add(lowerCol);

    // Sleek chamfered collar ring on top of lower column
    const collar = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.05, 0.18), darkMetalMat);
    collar.position.set(x, 0.84, 0);
    workstation.add(collar);

    // Top under-desk bracket (attached to desk underside inside deskTopGroup)
    const topBracket = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.06, 1.4), darkMetalMat);
    topBracket.position.set(x, 1.17, 0);
    deskTopGroup.add(topBracket);

    // Telescoping inner upper column (attached to deskTopGroup, seamlessly slides out of lowerCol)
    const upperCol = new THREE.Mesh(innerColGeo, darkMetalMat);
    upperCol.position.set(x, 0.60, 0);
    upperCol.castShadow = true;
    deskTopGroup.add(upperCol);
  });

  // Crossbar connecting stationary lower legs
  const crossbar = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.08, 0.08), darkMetalMat);
  crossbar.position.set(0, 0.68, 0);
  workstation.add(crossbar);

  // -------------------------------------------------------------
  // SMART DIGITAL HEIGHT CONTROL PAD (Mounted on Front-Right of Desk)
  // -------------------------------------------------------------
  const controlPadCanvas = document.createElement('canvas');
  controlPadCanvas.width = 256;
  controlPadCanvas.height = 96;
  drawControlPadDisplay(controlPadCanvas, state.deskCurrentHeightCm, 'idle');
  const controlPadTex = new THREE.CanvasTexture(controlPadCanvas);
  controlPadTex.anisotropy = 4;

  const controlPadGroup = new THREE.Group();
  controlPadGroup.position.set(1.68, 1.14, 0.98);

  // Matte chassis casing with beveled front
  const padCasingGeo = new THREE.BoxGeometry(0.24, 0.048, 0.12);
  const padCasing = new THREE.Mesh(padCasingGeo, darkMetalMat);
  padCasing.castShadow = true;
  controlPadGroup.add(padCasing);

  // Under-desk metal mounting bracket
  const padBracket = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.02, 0.08), darkMetalMat);
  padBracket.position.set(0, 0.028, -0.02);
  controlPadGroup.add(padBracket);

  // OLED Screen Panel (facing forward on front face of handset)
  const screenMat = new THREE.MeshStandardMaterial({
    map: controlPadTex,
    emissive: 0xffffff,
    emissiveMap: controlPadTex,
    emissiveIntensity: 1.0,
    roughness: 0.2,
    metalness: 0.1,
  });
  const screenMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.042), screenMat);
  screenMesh.position.set(0, 0, 0.061);
  controlPadGroup.add(screenMesh);

  // Subtle pulsing blue LED power indicator
  const padLed = new THREE.Mesh(
    new THREE.SphereGeometry(0.005, 8, 8),
    new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x00f0ff, emissiveIntensity: 2.0 })
  );
  padLed.position.set(-0.10, 0.016, 0.062);
  controlPadGroup.add(padLed);

  controlPadGroup.name = 'desk-controller';
  controlPadGroup.userData = {
    isClickable: true,
    workstationItem: 'desk-controller',
    label: '🎛️ Smart Sit/Stand Controller: Click to elevate / lower desk',
  };
  controlPadGroup.traverse((child) => {
    child.userData = {
      isClickable: true,
      workstationItem: 'desk-controller',
      label: '🎛️ Smart Sit/Stand Controller: Click to elevate / lower desk',
    };
  });
  deskTopGroup.add(controlPadGroup);

  // Set deskTop as desk root so clicks on the desk surface do not bubble to island
  deskTop.userData = {
    isDeskRoot: true,
  };

  // -------------------------------------------------------------
  // 2. MAIN DISPLAY: BenQ MA270S 27" 4K MONITOR FOR MAC
  // (Elevated Ergonomic Height, Space Gray Finish, 16:9 Aspect Ratio)
  // -------------------------------------------------------------
  const mainScreenCanvas = document.createElement('canvas');
  mainScreenCanvas.width = 1600;
  mainScreenCanvas.height = 900; // 16:9 4K scaled canvas
  const mainScreenTex = new THREE.CanvasTexture(mainScreenCanvas);
  mainScreenTex.colorSpace = THREE.SRGBColorSpace;
  mainScreenTex.anisotropy = 16;
  drawMainScreen(mainScreenCanvas, 0, 0);

  // When user avatar image finishes loading, redraw with authentic portrait photo
  getOrLoadAvatarImage(() => {
    drawMainScreen(mainScreenCanvas, state.mainScreenMode, 0);
    mainScreenTex.needsUpdate = true;
  });

  // BenQ MA270S Space Gray / Anodized Aluminum chassis
  const benqChassisMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    metalness: 0.85,
    roughness: 0.28,
  });

  const benqAccentMat = new THREE.MeshStandardMaterial({
    color: 0x94a3b8,
    metalness: 0.92,
    roughness: 0.2,
  });

  // Elevated height: y = 2.33 (Generous ergonomic clearance above elevated desk)
  const mainScreenFrameGeo = new THREE.BoxGeometry(2.14, 1.23, 0.048);
  const mainFrame = new THREE.Mesh(mainScreenFrameGeo, benqChassisMat);
  mainFrame.position.set(0, 2.33, -0.65);
  mainFrame.castShadow = true;
  deskTopGroup.add(mainFrame);

  // Rear ergonomic enclosure with VESA housing
  const rearEnclosure = new THREE.Mesh(new THREE.BoxGeometry(1.82, 1.04, 0.05), benqChassisMat);
  rearEnclosure.position.set(0, 2.33, -0.69);
  deskTopGroup.add(rearEnclosure);

  // Screen display panel (16:9 aspect ratio: 2.10 / 1.18 = 1.779 ≈ 16:9)
  const mainScreenMat = new THREE.MeshStandardMaterial({
    map: mainScreenTex,
    roughness: 0.18,
    metalness: 0.05,
    emissive: 0xffffff,
    emissiveMap: mainScreenTex,
    emissiveIntensity: 0.65,
  });

  const mainScreenMesh = new THREE.Mesh(new THREE.PlaneGeometry(2.10, 1.18), mainScreenMat);
  mainScreenMesh.position.set(0, 2.33 + 0.012, -0.624);
  mainScreenMesh.name = 'screen-main';
  mainScreenMesh.userData = {
    isClickable: true,
    workstationItem: 'main-screen',
    label: '🖥️ BenQ MA270S 27" 4K Display (for Mac): Interactive Portfolio CV — Hoang Van Hoa',
  };
  deskTopGroup.add(mainScreenMesh);

  // BenQ signature Space Gray bottom chin with laser-engraved BenQ logo
  const bottomChin = new THREE.Mesh(new THREE.BoxGeometry(2.14, 0.042, 0.052), benqChassisMat);
  bottomChin.position.set(0, 2.33 - 0.595, -0.623);
  deskTopGroup.add(bottomChin);

  // BenQ logo badge on bottom chin center
  const benqCanvas = document.createElement('canvas');
  benqCanvas.width = 256;
  benqCanvas.height = 64;
  const benqCtx = benqCanvas.getContext('2d');
  if (benqCtx) {
    benqCtx.fillStyle = '#1e293b';
    benqCtx.fillRect(0, 0, 256, 64);
    benqCtx.fillStyle = '#f8fafc';
    benqCtx.font = 'bold 28px "Space Grotesk", system-ui, sans-serif';
    benqCtx.textAlign = 'center';
    benqCtx.textBaseline = 'middle';
    benqCtx.fillText('BenQ', 128, 32);
  }
  const benqTex = new THREE.CanvasTexture(benqCanvas);
  const benqBadge = new THREE.Mesh(
    new THREE.PlaneGeometry(0.12, 0.028),
    new THREE.MeshStandardMaterial({
      map: benqTex,
      metalness: 0.8,
      roughness: 0.3,
    })
  );
  benqBadge.position.set(0, 2.33 - 0.595, -0.596);
  deskTopGroup.add(benqBadge);

  // Power / Mac Sync indicator LED on bottom-right of chin
  const macSyncLed = new THREE.Mesh(
    new THREE.SphereGeometry(0.005, 8, 8),
    new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x38bdf8, emissiveIntensity: 1.5 })
  );
  macSyncLed.position.set(1.00, 2.33 - 0.595, -0.596);
  deskTopGroup.add(macSyncLed);

  // -------------------------------------------------------------
  // BENQ MA270S ERGONOMIC STAND WITH ENLARGED SOLID BASE PLATE
  // (Large heavy-duty monolithic aluminum base: 0.92m x 0.44m, perfectly stable)
  // -------------------------------------------------------------
  const standGroup = new THREE.Group();

  // 1. Massive Solid Aluminum Flat Base Plate (Bệ đỡ kim loại nguyên khối chuẩn BenQ MA-Series)
  // Wide 0.92m, Deep 0.44m, Thickness 0.024m on desk surface at y = 1.28
  const benqStandBaseGeo = new THREE.BoxGeometry(0.92, 0.024, 0.44);
  const benqStandBase = new THREE.Mesh(benqStandBaseGeo, benqChassisMat);
  benqStandBase.position.set(0, 1.292, -0.70);
  benqStandBase.castShadow = true;
  benqStandBase.receiveShadow = true;
  standGroup.add(benqStandBase);

  // Non-slip high-density rubber foot pads underneath base
  const benqBasePad = new THREE.Mesh(
    new THREE.BoxGeometry(0.88, 0.004, 0.40),
    new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.9 })
  );
  benqBasePad.position.set(0, 1.282, -0.70);
  standGroup.add(benqBasePad);

  // Chamfered polished aluminum edge detail around base plate perimeter
  const benqBaseRim = new THREE.Mesh(
    new THREE.BoxGeometry(0.924, 0.004, 0.444),
    benqAccentMat
  );
  benqBaseRim.position.set(0, 1.290, -0.70);
  standGroup.add(benqBaseRim);

  // Recessed Front Organizer Tray for Apple Pencil / AirPods / Flash Drives
  const benqTray = new THREE.Mesh(
    new THREE.BoxGeometry(0.72, 0.003, 0.09),
    new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8, metalness: 0.1 })
  );
  benqTray.position.set(0, 1.296, -0.55);
  standGroup.add(benqTray);

  // 2. Upright Ergonomic Heavy-Duty Pillar Column (Trụ nâng chân đế BenQ khổ lớn)
  // Width 0.22m, Depth 0.12m, Height 1.08m
  const standColumn = new THREE.Mesh(
    new THREE.BoxGeometry(0.22, 1.08, 0.12),
    benqChassisMat
  );
  standColumn.position.set(0, 1.82, -0.78);
  standColumn.castShadow = true;
  standGroup.add(standColumn);

  // Chrome sliding track rail on front of pillar for smooth vertical height travel
  const heightTrack = new THREE.Mesh(
    new THREE.BoxGeometry(0.04, 0.85, 0.012),
    aluminumMat
  );
  heightTrack.position.set(0, 1.82, -0.718);
  standGroup.add(heightTrack);

  // Rear cable management pass-through slot on the stand column
  const cableSlot = new THREE.Mesh(
    new THREE.BoxGeometry(0.06, 0.65, 0.02),
    darkMetalMat
  );
  cableSlot.position.set(0, 1.76, -0.835);
  standGroup.add(cableSlot);

  // 3. Ergonomic Tilt & Swivel Hinge / VESA Mount Bracket
  const vesaMount = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.24, 0.04), benqAccentMat);
  vesaMount.position.set(0, 2.33, -0.71);
  standGroup.add(vesaMount);

  // Swivel joint cylinder
  const swivelJoint = new THREE.Mesh(
    new THREE.CylinderGeometry(0.04, 0.04, 0.12, 12),
    darkMetalMat
  );
  swivelJoint.rotation.z = Math.PI / 2;
  swivelJoint.position.set(0, 2.33, -0.74);
  standGroup.add(swivelJoint);

  deskTopGroup.add(standGroup);

  // Webcam on top with green indicator LED
  const webcam = new THREE.Mesh(new THREE.BoxGeometry(0.20, 0.042, 0.06), darkMetalMat);
  webcam.position.set(0, 2.96, -0.64);
  deskTopGroup.add(webcam);

  const webcamLed = new THREE.Mesh(
    new THREE.SphereGeometry(0.012, 6, 6),
    new THREE.MeshStandardMaterial({ color: 0x10b981, emissive: 0x10b981, emissiveIntensity: 1 })
  );
  webcamLed.position.set(0.06, 2.96, -0.605);
  deskTopGroup.add(webcamLed);

  // BenQ ScreenBar Light mounted on top of BenQ MA270S monitor
  const screenbarGroup = new THREE.Group();
  screenbarGroup.position.set(0, 2.97, -0.61);

  const barTube = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 1.48, 12), darkMetalMat);
  barTube.rotation.z = Math.PI / 2;
  screenbarGroup.add(barTube);

  const clampArm = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.08, 0.12), darkMetalMat);
  clampArm.position.set(0, -0.02, -0.06);
  screenbarGroup.add(clampArm);

  const clampWeight = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.08, 10), darkMetalMat);
  clampWeight.rotation.x = Math.PI / 2;
  clampWeight.position.set(0, -0.05, -0.11);
  screenbarGroup.add(clampWeight);

  const barLedMat = new THREE.MeshStandardMaterial({
    color: 0xffedd5,
    emissive: 0xfef08a,
    emissiveIntensity: 1.8,
  });
  const barLed = new THREE.Mesh(new THREE.BoxGeometry(1.40, 0.008, 0.012), barLedMat);
  barLed.position.set(0, -0.016, 0.002);
  screenbarGroup.add(barLed);

  const screenbarLight = new THREE.SpotLight(0xffedd5, 3.2, 4.0, Math.PI / 3.2, 0.4, 1.2);
  screenbarLight.position.set(0, 2.95, -0.58);
  screenbarLight.target.position.set(0, 1.28, 0.12);
  deskTopGroup.add(screenbarLight);
  deskTopGroup.add(screenbarLight.target);

  screenbarGroup.name = 'screenbar-lamp';
  screenbarGroup.userData = {
    isClickable: true,
    workstationItem: 'screenbar',
    label: '💡 BenQ ScreenBar Monitor Light: Click to toggle on/off',
  };
  deskTopGroup.add(screenbarGroup);

  // Focusrite Scarlett 2i2 Studio Audio Interface
  // Positioned neatly to the left of the keyboard, completely free from the monitor base
  const audioInterface = new THREE.Group();
  audioInterface.position.set(-0.64, 1.33, -0.28);
  audioInterface.rotation.y = 0.12;

  const scarlettCaseMat = new THREE.MeshStandardMaterial({
    color: 0xdc2626,
    metalness: 0.8,
    roughness: 0.25,
  });
  const scarlettBody = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.065, 0.16), scarlettCaseMat);
  audioInterface.add(scarlettBody);

  // Non-slip rubber feet underneath Scarlett audio interface
  [-0.15, 0.15].forEach((fx) => {
    [-0.06, 0.06].forEach((fz) => {
      const foot = new THREE.Mesh(
        new THREE.CylinderGeometry(0.012, 0.012, 0.006, 8),
        new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.9 })
      );
      foot.position.set(fx, -0.035, fz);
      audioInterface.add(foot);
    });
  });

  const frontPlate = new THREE.Mesh(new THREE.BoxGeometry(0.37, 0.058, 0.01), darkMetalMat);
  frontPlate.position.set(0, 0, 0.081);
  audioInterface.add(frontPlate);

  [-0.12, -0.04].forEach((x) => {
    const xlr = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.01, 8), darkMetalMat);
    xlr.rotation.x = Math.PI / 2;
    xlr.position.set(x, 0, 0.087);
    audioInterface.add(xlr);

    const halo = new THREE.Mesh(
      new THREE.RingGeometry(0.017, 0.021, 12),
      new THREE.MeshStandardMaterial({ color: 0x10b981, emissive: 0x10b981, emissiveIntensity: 1.2 })
    );
    halo.position.set(x, 0, 0.088);
    audioInterface.add(halo);
  });

  const masterKnob = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.02, 12), aluminumMat);
  masterKnob.rotation.x = Math.PI / 2;
  masterKnob.position.set(0.07, 0, 0.09);
  audioInterface.add(masterKnob);

  const hpKnob = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.018, 10), aluminumMat);
  hpKnob.rotation.x = Math.PI / 2;
  hpKnob.position.set(0.14, 0, 0.09);
  audioInterface.add(hpKnob);

  audioInterface.name = 'audio-interface';
  audioInterface.userData = {
    isClickable: true,
    workstationItem: 'audio-interface',
    label: '🎛️ Focusrite Scarlett 2i2 Audio Interface: Click to test audio output',
  };
  deskTopGroup.add(audioInterface);

  // Digital Smart Desk Clock & Pomodoro Display (Crisp High-Res, Zero-Clipping Ergonomic Stand)
  const clockCanvas = document.createElement('canvas');
  clockCanvas.width = 512;
  clockCanvas.height = 320;
  drawDeskClock(clockCanvas);
  const clockTex = new THREE.CanvasTexture(clockCanvas);
  clockTex.colorSpace = THREE.SRGBColorSpace;
  clockTex.anisotropy = 8;
  clockTex.needsUpdate = true;

  const clockGroup = new THREE.Group();
  // Seated comfortably inside the desk pad bounds (z = -0.32) on top of the desk pad surface (y = 1.293)
  clockGroup.position.set(1.06, 1.293, -0.32);
  clockGroup.rotation.y = -Math.PI / 6;

  // 1. Sleek Aluminum Desktop Base Plate (Rests firmly on desk pad)
  const clockBasePlate = new THREE.Mesh(
    new THREE.BoxGeometry(0.14, 0.008, 0.10),
    darkMetalMat
  );
  clockBasePlate.position.set(0, 0.004, 0);
  clockBasePlate.castShadow = true;
  clockGroup.add(clockBasePlate);

  // Anti-slip rubber feet
  const clockFootMat = new THREE.MeshStandardMaterial({ color: 0x020617, roughness: 0.9 });
  [-0.05, 0.05].forEach((fx) => {
    [-0.035, 0.035].forEach((fz) => {
      const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.003, 8), clockFootMat);
      foot.position.set(fx, 0.0015, fz);
      clockGroup.add(foot);
    });
  });

  // 2. Angled Aluminum Riser Arm (Lifts clock body cleanly above desk surface)
  const clockArm = new THREE.Mesh(
    new THREE.BoxGeometry(0.04, 0.065, 0.012),
    aluminumMat
  );
  clockArm.position.set(0, 0.038, -0.015);
  clockArm.rotation.x = -0.22;
  clockGroup.add(clockArm);

  // 3. Clock Chassis (Curved Matte Black / Space Gray Casing)
  const clockChassisMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.35,
    metalness: 0.8,
  });
  const clockBody = new THREE.Mesh(
    new THREE.BoxGeometry(0.19, 0.125, 0.032),
    clockChassisMat
  );
  clockBody.position.set(0, 0.078, 0);
  clockBody.rotation.x = -0.18;
  clockBody.castShadow = true;
  clockGroup.add(clockBody);

  // 4. Glossy OLED Screen Display
  const clockScreenMat = new THREE.MeshStandardMaterial({
    map: clockTex,
    emissive: 0xffffff,
    emissiveMap: clockTex,
    emissiveIntensity: 0.9,
    roughness: 0.1,
  });
  const clockScreen = new THREE.Mesh(new THREE.PlaneGeometry(0.178, 0.112), clockScreenMat);
  clockScreen.rotation.x = -0.18;
  clockScreen.position.set(0, 0.078, 0.017);
  clockGroup.add(clockScreen);

  clockGroup.name = 'desk-clock';
  clockGroup.userData = {
    isClickable: true,
    workstationItem: 'clock',
    label: '⏱️ Pomodoro Smart Desk Clock: Click to check focus cycle',
  };
  deskTopGroup.add(clockGroup);

  // Smartphone on Wireless MagSafe Magnetic Charging Stand
  const phoneCanvas = document.createElement('canvas');
  phoneCanvas.width = 384;
  phoneCanvas.height = 768;
  drawPhoneScreen(phoneCanvas);
  const phoneTex = new THREE.CanvasTexture(phoneCanvas);
  phoneTex.colorSpace = THREE.SRGBColorSpace;
  phoneTex.anisotropy = 8;
  phoneTex.needsUpdate = true;

  const phoneGroup = new THREE.Group();
  phoneGroup.position.set(-1.45, 1.30, 0.55);
  phoneGroup.rotation.y = Math.PI / 5;

  // 1. Premium Brushed Aluminum MagSafe Stand (Belkin/Nomad style)
  const standMetalMat = new THREE.MeshStandardMaterial({
    color: 0x475569,
    metalness: 0.92,
    roughness: 0.22,
  });

  // Solid weighted circular aluminum base with chamfer
  const phoneBasePuck = new THREE.Mesh(new THREE.CylinderGeometry(0.068, 0.074, 0.016, 24), standMetalMat);
  phoneBasePuck.position.set(0, 0.008, 0);
  phoneBasePuck.castShadow = true;
  phoneGroup.add(phoneBasePuck);

  // Non-slip silicone base pad
  const phoneBaseFoot = new THREE.Mesh(
    new THREE.CylinderGeometry(0.065, 0.065, 0.004, 20),
    new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.9 })
  );
  phoneBaseFoot.position.set(0, 0.002, 0);
  phoneGroup.add(phoneBaseFoot);

  // Slender angled solid aluminum post
  const phoneStem = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.009, 0.16, 12), standMetalMat);
  phoneStem.position.set(0, 0.09, -0.025);
  phoneStem.rotation.x = 0.22;
  phoneStem.castShadow = true;
  phoneGroup.add(phoneStem);

  // MagSafe Magnetic Charging Puck (Oriented strictly behind the phone back plate)
  const magPuckGeo = new THREE.CylinderGeometry(0.036, 0.036, 0.006, 32);
  magPuckGeo.rotateX(Math.PI / 2);
  const phoneMagPuck = new THREE.Mesh(magPuckGeo, standMetalMat);
  phoneMagPuck.position.set(0, 0.185, 0.008);
  phoneMagPuck.rotation.x = -0.32;
  phoneGroup.add(phoneMagPuck);

  const magFaceGeo = new THREE.RingGeometry(0.016, 0.034, 32);
  const phoneMagFace = new THREE.Mesh(
    magFaceGeo,
    new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.35 })
  );
  phoneMagFace.position.set(0, 0.185, 0.0112);
  phoneMagFace.rotation.x = -0.32;
  phoneGroup.add(phoneMagFace);

  // 2. Photorealistic Flagship Smartphone (iPhone 16 Pro Titanium Unibody with 4 Curved Corners)
  const phoneWidth = 0.142;
  const phoneHeight = 0.288;
  const phoneCornerRad = 0.018;
  const phoneThick = 0.012;

  // Titanium Satin Edge Frame with 4 distinct rounded corners
  const phoneShape = createRoundedRectShape(phoneWidth, phoneHeight, phoneCornerRad);
  const phoneBodyGeo = new THREE.ExtrudeGeometry(phoneShape, {
    depth: phoneThick,
    bevelEnabled: true,
    bevelSegments: 3,
    steps: 1,
    bevelSize: 0.0012,
    bevelThickness: 0.0012,
  });
  phoneBodyGeo.center();

  const phoneFrameMat = new THREE.MeshStandardMaterial({
    color: 0x334155, // Satin Space Black Titanium
    metalness: 0.92,
    roughness: 0.24,
  });

  const phoneBody = new THREE.Mesh(phoneBodyGeo, phoneFrameMat);
  phoneBody.position.set(0, 0.185, 0.024);
  phoneBody.rotation.x = -0.32;
  phoneBody.castShadow = true;
  phoneGroup.add(phoneBody);

  // Frosted Matte Glass Back Panel with 4 rounded corners
  const backShape = createRoundedRectShape(phoneWidth - 0.004, phoneHeight - 0.004, phoneCornerRad - 0.002);
  const phoneBackGeo = new THREE.ShapeGeometry(backShape);
  const phoneBackMat = new THREE.MeshStandardMaterial({
    color: 0x182030,
    metalness: 0.35,
    roughness: 0.4,
  });
  const phoneBack = new THREE.Mesh(phoneBackGeo, phoneBackMat);
  phoneBack.position.set(0, 0.185, 0.0178);
  phoneBack.rotation.x = -0.32;
  phoneBack.rotation.y = Math.PI;
  phoneGroup.add(phoneBack);

  // Polished Mirrored Chrome Apple Logo on Back
  const phoneLogo = new THREE.Mesh(
    new THREE.CircleGeometry(0.014, 20),
    new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 1.0, roughness: 0.05 })
  );
  phoneLogo.rotation.x = -0.32;
  phoneLogo.rotation.y = Math.PI;
  phoneLogo.position.set(0, 0.185, 0.0176);
  phoneGroup.add(phoneLogo);

  // Iconic Pro Triple-Camera Island (Top-Left of Back)
  const camBumpMat = new THREE.MeshStandardMaterial({
    color: 0x1b202e,
    metalness: 0.85,
    roughness: 0.2,
  });
  const camPlateauShape = createRoundedRectShape(0.062, 0.064, 0.014);
  const camPlateau = new THREE.Mesh(
    new THREE.ShapeGeometry(camPlateauShape),
    camBumpMat
  );
  camPlateau.position.set(-0.034, 0.224, 0.014);
  camPlateau.rotation.x = -0.32;
  camPlateau.rotation.y = Math.PI;
  phoneGroup.add(camPlateau);

  // 3 Pro Lens Rings with Sapphire Crystal Anti-Reflective Optics
  const lensBezelMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.98, roughness: 0.1 });
  const lensGlassMat = new THREE.MeshStandardMaterial({
    color: 0x040812,
    metalness: 0.1,
    roughness: 0.05,
    emissive: 0x06b6d4,
    emissiveIntensity: 0.25,
  });

  const lensOffsets = [
    { x: -0.046, y: 0.237 },
    { x: -0.046, y: 0.210 },
    { x: -0.022, y: 0.223 },
  ];

  lensOffsets.forEach((lp) => {
    const ringGeo = new THREE.CylinderGeometry(0.011, 0.011, 0.005, 16);
    ringGeo.rotateX(Math.PI / 2);
    const ring = new THREE.Mesh(ringGeo, lensBezelMat);
    ring.rotation.x = -0.32;
    ring.position.set(lp.x, lp.y, 0.011);
    phoneGroup.add(ring);

    const lens = new THREE.Mesh(new THREE.SphereGeometry(0.007, 10, 10), lensGlassMat);
    lens.position.set(lp.x, lp.y, 0.010);
    phoneGroup.add(lens);
  });

  // True Tone LED Flash & LiDAR Sensor
  const flashLedGeo = new THREE.CylinderGeometry(0.004, 0.004, 0.003, 12);
  flashLedGeo.rotateX(Math.PI / 2);
  const flashLed = new THREE.Mesh(
    flashLedGeo,
    new THREE.MeshStandardMaterial({ color: 0xfef08a, emissive: 0xfef08a, emissiveIntensity: 0.6 })
  );
  flashLed.rotation.x = -0.32;
  flashLed.position.set(-0.022, 0.238, 0.011);
  phoneGroup.add(flashLed);

  const lidarGeo = new THREE.CylinderGeometry(0.004, 0.004, 0.003, 12);
  lidarGeo.rotateX(Math.PI / 2);
  const lidarSensor = new THREE.Mesh(
    lidarGeo,
    new THREE.MeshStandardMaterial({ color: 0x020617, roughness: 0.2 })
  );
  lidarSensor.rotation.x = -0.32;
  lidarSensor.position.set(-0.022, 0.208, 0.011);
  phoneGroup.add(lidarSensor);

  // Side Hardware Buttons
  const buttonMat = darkMetalMat;
  // Left: Action button & Volume rocker
  [-0.072].forEach((bx) => {
    const actionBtn = new THREE.Mesh(new THREE.BoxGeometry(0.003, 0.016, 0.004), buttonMat);
    actionBtn.position.set(bx, 0.235, 0.024);
    actionBtn.rotation.x = -0.32;
    phoneGroup.add(actionBtn);

    const volUp = new THREE.Mesh(new THREE.BoxGeometry(0.003, 0.024, 0.004), buttonMat);
    volUp.position.set(bx, 0.205, 0.024);
    volUp.rotation.x = -0.32;
    phoneGroup.add(volUp);

    const volDown = new THREE.Mesh(new THREE.BoxGeometry(0.003, 0.024, 0.004), buttonMat);
    volDown.position.set(bx, 0.175, 0.024);
    volDown.rotation.x = -0.32;
    phoneGroup.add(volDown);
  });

  // Right: Side Power / Siri button
  const pwrBtn = new THREE.Mesh(new THREE.BoxGeometry(0.003, 0.034, 0.004), buttonMat);
  pwrBtn.position.set(0.072, 0.205, 0.024);
  pwrBtn.rotation.x = -0.32;
  phoneGroup.add(pwrBtn);

  // Bottom: USB-C port cutout
  const usbcCutout = new THREE.Mesh(new THREE.BoxGeometry(0.024, 0.004, 0.006), darkMetalMat);
  usbcCutout.position.set(0, 0.045, 0.024);
  usbcCutout.rotation.x = -0.32;
  phoneGroup.add(usbcCutout);

  // Front Ceramic Shield OLED Screen (4 Distinct Rounded Corners matching chassis)
  const bezelShape = createRoundedRectShape(0.138, 0.284, 0.017);
  const bezelGeo = new THREE.ShapeGeometry(bezelShape);
  const phoneScreenBezel = new THREE.Mesh(
    bezelGeo,
    new THREE.MeshStandardMaterial({
      color: 0x030712,
      roughness: 0.15,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    })
  );
  phoneScreenBezel.position.set(0, 0.185, 0.0322);
  phoneScreenBezel.rotation.x = -0.32;
  phoneGroup.add(phoneScreenBezel);

  // OLED Active Display with 4 curved corners and normalized UV texture coordinates
  const screenShape = createRoundedRectShape(0.134, 0.280, 0.016);
  const screenGeo = new THREE.ShapeGeometry(screenShape);
  const posAttr = screenGeo.attributes.position;
  const uvsArray = new Float32Array(posAttr.count * 2);
  for (let i = 0; i < posAttr.count; i++) {
    const px = posAttr.getX(i);
    const py = posAttr.getY(i);
    uvsArray[i * 2] = (px + 0.134 / 2) / 0.134;
    uvsArray[i * 2 + 1] = (py + 0.280 / 2) / 0.280;
  }
  screenGeo.setAttribute('uv', new THREE.BufferAttribute(uvsArray, 2));

  const phoneScreenMat = new THREE.MeshStandardMaterial({
    map: phoneTex,
    roughness: 0.06,
    metalness: 0.02,
    emissive: 0xffffff,
    emissiveMap: phoneTex,
    emissiveIntensity: 1.35, // High OLED brightness
    polygonOffset: true,
    polygonOffsetFactor: -3,
    polygonOffsetUnits: -3,
    side: THREE.FrontSide,
  });
  const phoneScreen = new THREE.Mesh(screenGeo, phoneScreenMat);
  phoneScreen.position.set(0, 0.185, 0.0330);
  phoneScreen.rotation.x = -0.32;
  phoneGroup.add(phoneScreen);

  phoneGroup.name = 'smartphone';
  phoneGroup.userData = {
    isClickable: true,
    workstationItem: 'phone',
    label: '📱 Smartphone on MagSafe: Click to inspect notifications',
  };
  deskTopGroup.add(phoneGroup);

  // -------------------------------------------------------------
  // 3. VERTICAL SECONDARY DISPLAY (Standard Micro-Edge Bezel, Enlarged Heavy-Duty Stand)
  // -------------------------------------------------------------
  const vertScreenCanvas = document.createElement('canvas');
  vertScreenCanvas.width = 600;
  vertScreenCanvas.height = 1050; // Ultra high-res 9:16 vertical canvas
  const vertScreenTex = new THREE.CanvasTexture(vertScreenCanvas);
  vertScreenTex.colorSpace = THREE.SRGBColorSpace;
  vertScreenTex.anisotropy = 16;
  drawVerticalScreen(vertScreenCanvas, 0, 0);

  const vertRotY = -Math.PI / 5.5;
  const vertPosX = 1.54;
  const vertPosY = 2.15; // Ergonomically elevated matching elevated desk
  const vertPosZ = -0.45;

  const vertMonitorGroup = new THREE.Group();
  vertMonitorGroup.position.set(vertPosX, vertPosY, vertPosZ);
  vertMonitorGroup.rotation.y = vertRotY;

  // Precision Rear Chassis with Stepped VESA Housing
  const vertRearGeo = new THREE.BoxGeometry(0.74, 1.30, 0.038);
  const vertRearMesh = new THREE.Mesh(vertRearGeo, darkMetalMat);
  vertRearMesh.position.set(0, 0, -0.019);
  vertRearMesh.castShadow = true;
  vertMonitorGroup.add(vertRearMesh);

  // Stepped back VESA casing with ventilation grill
  const vertBackCover = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.96, 0.024), darkMetalMat);
  vertBackCover.position.set(0, 0, -0.045);
  vertMonitorGroup.add(vertBackCover);

  // Precision 3-Sided Micro-Edge Border (Top, Left, Right razor-thin frame)
  const vertBorderTop = new THREE.Mesh(new THREE.BoxGeometry(0.74, 0.012, 0.042), darkMetalMat);
  vertBorderTop.position.set(0, 0.644, 0);
  vertMonitorGroup.add(vertBorderTop);

  const vertBorderLeft = new THREE.Mesh(new THREE.BoxGeometry(0.012, 1.28, 0.042), darkMetalMat);
  vertBorderLeft.position.set(-0.364, 0, 0);
  vertMonitorGroup.add(vertBorderLeft);

  const vertBorderRight = new THREE.Mesh(new THREE.BoxGeometry(0.012, 1.28, 0.042), darkMetalMat);
  vertBorderRight.position.set(0.364, 0, 0);
  vertMonitorGroup.add(vertBorderRight);

  // Standard Bottom Chin Bezel (Thanh viền đáy vát chuẩn Dell/LG UltraSharp Pivot)
  const vertBottomChinMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    metalness: 0.85,
    roughness: 0.25,
  });
  const vertBottomChin = new THREE.Mesh(new THREE.BoxGeometry(0.74, 0.038, 0.044), vertBottomChinMat);
  vertBottomChin.position.set(0, -0.631, 0.002);
  vertMonitorGroup.add(vertBottomChin);

  // Micro logo badge & power LED on bottom chin
  const vertBadge = new THREE.Mesh(
    new THREE.PlaneGeometry(0.05, 0.014),
    new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.2 })
  );
  vertBadge.position.set(0, -0.631, 0.025);
  vertMonitorGroup.add(vertBadge);

  const vertPowerLed = new THREE.Mesh(
    new THREE.SphereGeometry(0.0035, 6, 6),
    new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x38bdf8, emissiveIntensity: 2.0 })
  );
  vertPowerLed.position.set(0.33, -0.631, 0.025);
  vertMonitorGroup.add(vertPowerLed);

  // Active Screen Panel
  const vertScreenMat = new THREE.MeshStandardMaterial({
    map: vertScreenTex,
    roughness: 0.25,
    emissive: 0xffffff,
    emissiveMap: vertScreenTex,
    emissiveIntensity: 0.65,
  });

  const vertScreenMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.70, 1.24), vertScreenMat);
  vertScreenMesh.position.set(0, 0.008, 0.020);
  vertScreenMesh.name = 'screen-vertical';
  vertScreenMesh.userData = {
    isClickable: true,
    workstationItem: 'vertical-screen',
    label: '📱 24" Pivot Vertical Screen: Terminal Codex / Claude CLI (Click to switch)',
  };
  vertMonitorGroup.add(vertScreenMesh);
  deskTopGroup.add(vertMonitorGroup);

  // -------------------------------------------------------------
  // ENLARGED VERTICAL MONITOR STAND (Heavy-Duty Solid Rectangular Base)
  // -------------------------------------------------------------
  const vertStandGroup = new THREE.Group();
  vertStandGroup.position.set(1.56, 1.291, -0.48);
  vertStandGroup.rotation.y = vertRotY;

  // 1. Enlarged Solid Weighted Base Plate (0.44m x 0.32m x 0.022m)
  const vertStandBaseGeo = new THREE.BoxGeometry(0.44, 0.022, 0.32);
  const vertStandBase = new THREE.Mesh(vertStandBaseGeo, darkMetalMat);
  vertStandBase.castShadow = true;
  vertStandBase.receiveShadow = true;
  vertStandGroup.add(vertStandBase);

  // Non-slip rubber feet underneath base plate corners
  [
    [-0.19, -0.13],
    [0.19, -0.13],
    [-0.19, 0.13],
    [0.19, 0.13],
  ].forEach(([rx, rz]) => {
    const rubberFoot = new THREE.Mesh(
      new THREE.CylinderGeometry(0.018, 0.018, 0.004, 12),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.9 })
    );
    rubberFoot.position.set(rx, -0.012, rz);
    vertStandGroup.add(rubberFoot);
  });

  // Polished perimeter chamfer rim
  const vertStandRim = new THREE.Mesh(
    new THREE.BoxGeometry(0.444, 0.003, 0.324),
    aluminumMat
  );
  vertStandRim.position.set(0, 0.010, 0);
  vertStandGroup.add(vertStandRim);

  // 2. Heavy-Duty Telescoping Stand Column
  const vertStandColumn = new THREE.Mesh(
    new THREE.BoxGeometry(0.10, 0.98, 0.085),
    darkMetalMat
  );
  vertStandColumn.position.set(0, 0.49, -0.05);
  vertStandColumn.castShadow = true;
  vertStandGroup.add(vertStandColumn);

  // Chrome vertical adjustment track on front face of column
  const vertTrack = new THREE.Mesh(
    new THREE.BoxGeometry(0.024, 0.75, 0.008),
    aluminumMat
  );
  vertTrack.position.set(0, 0.49, -0.006);
  vertStandGroup.add(vertTrack);

  // Cable management grommet hole in lower rear
  const vertGrommet = new THREE.Mesh(
    new THREE.CylinderGeometry(0.022, 0.022, 0.09, 12),
    new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.9 })
  );
  vertGrommet.rotation.x = Math.PI / 2;
  vertGrommet.position.set(0, 0.22, -0.05);
  vertStandGroup.add(vertGrommet);

  // 3. 360° Pivot VESA Mount Joint Disc
  const vertPivotDisc = new THREE.Mesh(
    new THREE.CylinderGeometry(0.09, 0.09, 0.035, 24),
    aluminumMat
  );
  vertPivotDisc.rotation.x = Math.PI / 2;
  vertPivotDisc.position.set(0, 0.86, 0.01);
  vertStandGroup.add(vertPivotDisc);

  deskTopGroup.add(vertStandGroup);

  // -------------------------------------------------------------
  // MAC MINI (M5 Pro, 48GB) on the desk behind the rubber duck, under the main screen.
  // Real unit is 12.7 x 12.7 x 5 cm; this scene runs at ~2.1x (the 27" panel is 0.70 wide).
  // Clear of the BenQ base plate (x <= 0.46), the duck (z >= -0.30) and the desk clock (x >= 1.0).
  // -------------------------------------------------------------
  const MAC_W = 0.25;
  const MAC_H = 0.098;
  const MAC_R = 0.034; // corner radius
  const macMini = new THREE.Group();
  macMini.name = 'mac-mini';
  macMini.position.set(0.7, 1.28, -0.5); // desk top is at y = 1.28

  const macAluminumMat = new THREE.MeshStandardMaterial({ color: 0xd9dbde, metalness: 0.55, roughness: 0.32 });
  const macPortMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.6 });

  // Foot: dark round base the body floats on
  const macFoot = new THREE.Mesh(new THREE.CylinderGeometry(MAC_W * 0.36, MAC_W * 0.36, 0.008, 40), macPortMat);
  macFoot.position.y = 0.004;
  macMini.add(macFoot);

  // Body: rounded square extruded upward with a soft edge bevel
  const macShape = new THREE.Shape();
  const mh = MAC_W / 2 - MAC_R;
  macShape.moveTo(-mh, -MAC_W / 2);
  macShape.lineTo(mh, -MAC_W / 2);
  macShape.quadraticCurveTo(MAC_W / 2, -MAC_W / 2, MAC_W / 2, -mh);
  macShape.lineTo(MAC_W / 2, mh);
  macShape.quadraticCurveTo(MAC_W / 2, MAC_W / 2, mh, MAC_W / 2);
  macShape.lineTo(-mh, MAC_W / 2);
  macShape.quadraticCurveTo(-MAC_W / 2, MAC_W / 2, -MAC_W / 2, mh);
  macShape.lineTo(-MAC_W / 2, -mh);
  macShape.quadraticCurveTo(-MAC_W / 2, -MAC_W / 2, -mh, -MAC_W / 2);
  const macBevel = 0.006;
  const macBodyGeo = new THREE.ExtrudeGeometry(macShape, {
    depth: MAC_H - 0.008 - macBevel * 2,
    bevelEnabled: true,
    bevelThickness: macBevel,
    bevelSize: macBevel,
    bevelSegments: 4,
    curveSegments: 10,
  });
  macBodyGeo.rotateX(-Math.PI / 2); // extrude along +Y
  const macBody = new THREE.Mesh(macBodyGeo, macAluminumMat);
  macBody.position.y = 0.008 + macBevel;
  macBody.castShadow = true;
  macBody.receiveShadow = true;
  macMini.add(macBody);

  // Ports as Apple lists them for Mac mini with M5 Pro (apple.com/mac-mini/specs):
  //   front: two USB-C (USB 3), status light, 3.5 mm headphone jack
  //   back:  power, Ethernet, HDMI, three Thunderbolt 5
  // Sizes are the real connector openings scaled by the scene's ~2.1x.
  const frontZ = MAC_W / 2 + macBevel + 0.0005;
  const rearZ = -frontZ;
  const portY = 0.008 + (MAC_H - 0.008) * 0.5; // middle of the side wall
  const portMat = new THREE.MeshStandardMaterial({
    color: 0x111114,
    roughness: 0.7,
    polygonOffset: true,
    polygonOffsetFactor: -2,
  });
  const portInnerMat = new THREE.MeshStandardMaterial({
    color: 0x45474d,
    roughness: 0.5,
    polygonOffset: true,
    polygonOffsetFactor: -4,
  });

  const roundedRectShape = (w: number, h: number, r: number) => {
    const sh = new THREE.Shape();
    const x = -w / 2;
    const y = -h / 2;
    sh.moveTo(x + r, y);
    sh.lineTo(x + w - r, y);
    sh.quadraticCurveTo(x + w, y, x + w, y + r);
    sh.lineTo(x + w, y + h - r);
    sh.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    sh.lineTo(x + r, y + h);
    sh.quadraticCurveTo(x, y + h, x, y + h - r);
    sh.lineTo(x, y + r);
    sh.quadraticCurveTo(x, y, x + r, y);
    return sh;
  };
  // Adds a flat port shape on the front (+Z) or back (-Z) face
  const addPort = (shape: THREE.Shape | THREE.Shape[], mat: THREE.Material, x: number, y: number, back: boolean, lift = 0) => {
    const m = new THREE.Mesh(new THREE.ShapeGeometry(shape, 12), mat);
    m.position.set(x, y, back ? rearZ - lift : frontZ + lift);
    if (back) m.rotation.y = Math.PI;
    macMini.add(m);
  };
  // USB-C / Thunderbolt: 8.4 x 2.6 mm pill with the centre tongue
  const usbCPort = (x: number, back: boolean) => {
    addPort(roundedRectShape(0.0176, 0.0056, 0.0028), portMat, x, portY, back);
    addPort(roundedRectShape(0.0112, 0.0016, 0.0006), portInnerMat, x, portY, back, 0.0002);
  };

  // Front, left to right as seen from the desk
  usbCPort(-0.052, false);
  usbCPort(-0.027, false);
  const statusLight = new THREE.Mesh(
    new THREE.CircleGeometry(0.0014, 12),
    new THREE.MeshBasicMaterial({ color: 0xf1f5f9, polygonOffset: true, polygonOffsetFactor: -2 })
  );
  statusLight.position.set(-0.008, portY, frontZ);
  macMini.add(statusLight);
  const jackShape = new THREE.Shape();
  jackShape.absarc(0, 0, 0.0042, 0, Math.PI * 2, false);
  addPort(jackShape, portMat, 0.01, portY, false);

  // Back, left to right as seen from behind (mirrored X because it faces -Z)
  // power socket: round recess with two pins
  const powerShape = new THREE.Shape();
  powerShape.absarc(0, 0, 0.0115, 0, Math.PI * 2, false);
  addPort(powerShape, portMat, 0.082, portY, true);
  [-0.0042, 0.0042].forEach((dx) => {
    const pin = new THREE.Shape();
    pin.absarc(0, 0, 0.0018, 0, Math.PI * 2, false);
    addPort(pin, portInnerMat, 0.082 + dx, portY, true, 0.0002);
  });
  // Ethernet: square jack with the latch notch at the bottom
  addPort(roundedRectShape(0.03, 0.024, 0.0015), portMat, 0.047, portY + 0.002, true);
  addPort(roundedRectShape(0.012, 0.004, 0.001), portMat, 0.047, portY + 0.002 - 0.013, true);
  addPort(roundedRectShape(0.022, 0.0025, 0.0008), portInnerMat, 0.047, portY + 0.002 + 0.007, true, 0.0002);
  // HDMI: wide trapezoid
  const hdmiShape = new THREE.Shape();
  hdmiShape.moveTo(-0.015, 0.0048);
  hdmiShape.lineTo(0.015, 0.0048);
  hdmiShape.lineTo(0.015, 0.0008);
  hdmiShape.lineTo(0.0115, -0.0048);
  hdmiShape.lineTo(-0.0115, -0.0048);
  hdmiShape.lineTo(-0.015, 0.0008);
  hdmiShape.closePath();
  addPort(hdmiShape, portMat, 0.011, portY, true);
  addPort(roundedRectShape(0.021, 0.0016, 0.0005), portInnerMat, 0.011, portY + 0.0012, true, 0.0002);
  // three Thunderbolt 5
  [-0.017, -0.042, -0.067].forEach((x) => usbCPort(x, true));

  // Mac-local coordinates: the BenQ base plate's right edge is 0.24 to the left of the Mac's
  // centre. The cable leaves the rear ports, drops to the desk and plugs into that edge.
  const macCableCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.017, portY, rearZ - 0.004), // first Thunderbolt 5 port
    new THREE.Vector3(-0.03, 0.02, rearZ - 0.04),
    new THREE.Vector3(-0.15, 0.012, -0.2),
    new THREE.Vector3(-0.236, 0.012, -0.21),
  ]);
  const macCable = new THREE.Mesh(new THREE.TubeGeometry(macCableCurve, 24, 0.0045, 6, false), macPortMat);
  macMini.add(macCable);

  // Apple logo on the lid, upright when read from the front of the desk
  const appleBody = new THREE.Shape();
  appleBody.moveTo(0, 0.28);
  appleBody.bezierCurveTo(0.1, 0.36, 0.3, 0.36, 0.4, 0.24);
  appleBody.quadraticCurveTo(0.27, 0.05, 0.44, -0.14); // the bite
  appleBody.bezierCurveTo(0.4, -0.36, 0.26, -0.52, 0.14, -0.52);
  appleBody.bezierCurveTo(0.06, -0.52, 0.04, -0.47, 0, -0.47);
  appleBody.bezierCurveTo(-0.04, -0.47, -0.06, -0.52, -0.14, -0.52);
  appleBody.bezierCurveTo(-0.3, -0.52, -0.46, -0.26, -0.46, -0.04);
  appleBody.bezierCurveTo(-0.46, 0.2, -0.3, 0.34, -0.18, 0.34);
  appleBody.bezierCurveTo(-0.1, 0.34, -0.05, 0.3, 0, 0.28);
  const appleLeaf = new THREE.Shape();
  appleLeaf.moveTo(0.02, 0.38);
  appleLeaf.bezierCurveTo(0.02, 0.5, 0.12, 0.6, 0.2, 0.6);
  appleLeaf.bezierCurveTo(0.2, 0.48, 0.1, 0.38, 0.02, 0.38);
  const appleLogoGeo = new THREE.ShapeGeometry([appleBody, appleLeaf], 16);
  appleLogoGeo.scale(0.058, 0.058, 1); // ~0.065 tall, about the real logo's share of the lid
  appleLogoGeo.rotateX(-Math.PI / 2); // lie flat, top of the apple toward the back
  const appleLogo = new THREE.Mesh(
    appleLogoGeo,
    new THREE.MeshStandardMaterial({
      color: 0xa9adb3,
      metalness: 0.75,
      roughness: 0.16,
      polygonOffset: true,
      polygonOffsetFactor: -2,
    })
  );
  appleLogo.position.set(0, MAC_H + 0.0006, 0);
  macMini.add(appleLogo);

  const macLabel = '🖥️ Mac mini · M5 Pro · 48GB: Click to inspect';
  macMini.userData = { isClickable: true, workstationItem: 'mac-mini', label: macLabel };
  macMini.traverse((child) => {
    child.userData = { isClickable: true, workstationItem: 'mac-mini', label: macLabel };
  });
  deskTopGroup.add(macMini);

  // -------------------------------------------------------------
  // -------------------------------------------------------------
  // 4. AUTHENTIC APPLE MACBOOK PRO 16-INCH M2 MAX (High Fidelity)
  // -------------------------------------------------------------
  const laptopGroup = new THREE.Group();
  laptopGroup.position.set(-1.58, 1.30, -0.32);
  laptopGroup.rotation.y = Math.PI / 6; // Angled 30° toward user with clear separation from main monitor

  // Space Gray / Silver Apple Anodized Bead-blasted Aluminum Material
  const macbookChassisMat = new THREE.MeshStandardMaterial({
    color: 0xb4bac4, // Authentic Apple Silver/Space Gray aluminum luminance
    metalness: 0.76,
    roughness: 0.30,
  });

  const macbookKeyboardMat = new THREE.MeshStandardMaterial({
    color: 0x0a0e17,
    metalness: 0.2,
    roughness: 0.8,
  });

  // Designer Minimalist Curved Aluminum Laptop Riser Stand
  const standCurve = new THREE.Group();
  const standRiserMat = new THREE.MeshStandardMaterial({
    color: 0x475569,
    metalness: 0.9,
    roughness: 0.25,
  });
  // Base plate of stand
  const standBase = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.015, 0.44), standRiserMat);
  standBase.position.set(0, 0.008, 0.04);
  standBase.castShadow = true;
  standCurve.add(standBase);

  // Angled riser arms
  [-0.24, 0.24].forEach((ax) => {
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.12, 0.38), standRiserMat);
    arm.position.set(ax, 0.065, 0);
    arm.rotation.x = Math.PI / 15;
    standCurve.add(arm);

    // Silicone anti-scratch grip pads
    const pad = new THREE.Mesh(
      new THREE.BoxGeometry(0.042, 0.006, 0.36),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.9 })
    );
    pad.position.set(ax, 0.126, 0);
    pad.rotation.x = Math.PI / 15;
    standCurve.add(pad);
  });
  laptopGroup.add(standCurve);

  // -------------------------------------------------------------
  // MacBook M2 Unibody Base Chassis & Authentic Magic Keyboard Group
  // -------------------------------------------------------------
  const baseWidth = 0.86;
  const baseDepth = 0.58;
  const baseThickness = 0.020;
  const laptopTilt = Math.PI / 15;

  const laptopBaseGroup = new THREE.Group();
  laptopBaseGroup.position.set(0, 0.145, 0);
  laptopBaseGroup.rotation.x = laptopTilt;
  laptopGroup.add(laptopBaseGroup);

  // 1. Unibody Base Chassis with 4 curved corners (Top surface at Y = 0.000)
  const baseShape = createRoundedRectShape(baseWidth, baseDepth, 0.022);
  const baseGeo = new THREE.ExtrudeGeometry(baseShape, {
    depth: baseThickness,
    bevelEnabled: true,
    bevelSegments: 3,
    steps: 1,
    bevelSize: 0.002,
    bevelThickness: 0.002,
  });
  baseGeo.rotateX(Math.PI / 2); // Orient horizontally so width is X, thickness is Y, depth is Z
  baseGeo.center();

  const laptopBaseMesh = new THREE.Mesh(baseGeo, macbookChassisMat);
  laptopBaseMesh.position.set(0, -0.012, 0); // Top surface is at Y = 0.000, bottom at Y = -0.024
  laptopBaseMesh.castShadow = true;
  laptopBaseGroup.add(laptopBaseMesh);

  // 2. Four Black Rubber Grip Feet on Bottom Chassis
  const rubberFootMat = new THREE.MeshStandardMaterial({ color: 0x090d16, roughness: 0.9 });
  [
    { x: -0.38, z: -0.23 },
    { x: 0.38, z: -0.23 },
    { x: -0.38, z: 0.23 },
    { x: 0.38, z: 0.23 },
  ].forEach((fp) => {
    const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.004, 16), rubberFootMat);
    foot.position.set(fp.x, -0.024, fp.z);
    laptopBaseGroup.add(foot);
  });

  // 3. Front Display Open Notch (Chamfered Ergonomic Scoop)
  const lipGroove = new THREE.Mesh(
    new THREE.BoxGeometry(0.14, 0.008, 0.012),
    new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.4 })
  );
  lipGroove.position.set(0, 0.0006, 0.288);
  laptopBaseGroup.add(lipGroove);

  // 4. Force Touch Glass Trackpad with razor-thin perimeter outline (Strictly separated from keyboard)
  const trackpadWidth = 0.34;
  const trackpadDepth = 0.20;
  const trackpadShape = createRoundedRectShape(trackpadWidth, trackpadDepth, 0.010);
  const trackpadGeo = new THREE.ExtrudeGeometry(trackpadShape, {
    depth: 0.002,
    bevelEnabled: true,
    bevelSegments: 2,
    steps: 1,
    bevelSize: 0.001,
    bevelThickness: 0.001,
  });
  trackpadGeo.rotateX(Math.PI / 2);
  trackpadGeo.center();

  const trackpadMesh = new THREE.Mesh(
    trackpadGeo,
    new THREE.MeshStandardMaterial({
      color: 0xa1a8b5,
      metalness: 0.38,
      roughness: 0.26,
    })
  );
  // Positioned comfortably in front of the keyboard with a clear 45mm aluminum unibody bridge
  trackpadMesh.position.set(0, 0.0008, 0.135);
  laptopBaseGroup.add(trackpadMesh);

  const trackpadBorderGeo = new THREE.ShapeGeometry(
    createRoundedRectShape(trackpadWidth + 0.002, trackpadDepth + 0.002, 0.010)
  );
  trackpadBorderGeo.rotateX(-Math.PI / 2);
  const trackpadBorder = new THREE.LineSegments(
    new THREE.EdgesGeometry(trackpadBorderGeo),
    new THREE.LineBasicMaterial({ color: 0x475569, transparent: true, opacity: 0.75 })
  );
  trackpadBorder.position.set(0, 0.0010, 0.135);
  laptopBaseGroup.add(trackpadBorder);

  // 5. Recessed Anodized Black Keyboard Well
  const keyWellWidth = 0.68;
  const keyWellDepth = 0.23;
  const keyWellShape = createRoundedRectShape(keyWellWidth, keyWellDepth, 0.010);
  const keyWellGeo = new THREE.ShapeGeometry(keyWellShape);
  keyWellGeo.rotateX(-Math.PI / 2);

  const keyWell = new THREE.Mesh(
    keyWellGeo,
    new THREE.MeshStandardMaterial({
      color: 0x04060b,
      metalness: 0.3,
      roughness: 0.8,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    })
  );
  keyWell.position.set(0, 0.0005, -0.125);
  laptopBaseGroup.add(keyWell);

  // 6. High-Resolution Apple Magic Keyboard Surface with Backlight & Stereo Grilles
  const kbCanvas = document.createElement('canvas');
  kbCanvas.width = 2048;
  kbCanvas.height = 700;
  drawMacBookKeyboard(kbCanvas);
  const keyboardTex = new THREE.CanvasTexture(kbCanvas);
  keyboardTex.colorSpace = THREE.SRGBColorSpace;
  keyboardTex.anisotropy = 8;
  keyboardTex.needsUpdate = true;

  const keyboardMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(0.676, 0.226),
    new THREE.MeshStandardMaterial({
      map: keyboardTex,
      roughness: 0.40,
      metalness: 0.15,
      emissive: 0xffffff,
      emissiveMap: keyboardTex,
      emissiveIntensity: 0.22, // Realistic crisp backlighting without washing out keycaps
      polygonOffset: true,
      polygonOffsetFactor: -3,
      polygonOffsetUnits: -3,
      side: THREE.DoubleSide,
    })
  );
  keyboardMesh.rotation.x = -Math.PI / 2;
  keyboardMesh.position.set(0, 0.0012, -0.125);
  laptopBaseGroup.add(keyboardMesh);

  // 7. Left Side Ports: MagSafe 3 (with Amber Charging LED), 2x Thunderbolt 4 / USB-C, 3.5mm Headphone Jack
  const magSafeLed = new THREE.Mesh(
    new THREE.SphereGeometry(0.005, 8, 8),
    new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0xf59e0b, emissiveIntensity: 1.6 })
  );
  magSafeLed.position.set(-0.433, -0.012, -0.20);
  laptopBaseGroup.add(magSafeLed);

  [-0.12, -0.06].forEach((pz) => {
    const tbPort = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.005, 0.016), darkMetalMat);
    tbPort.position.set(-0.432, -0.012, pz);
    laptopBaseGroup.add(tbPort);
  });

  const audioJack = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.008, 10), darkMetalMat);
  audioJack.rotation.z = Math.PI / 2;
  audioJack.position.set(-0.432, -0.012, 0.02);
  laptopBaseGroup.add(audioJack);

  // 8. Right Side Ports: HDMI 2.1, SDXC Card Slot, Thunderbolt 4 Port
  const hdmiPort = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.006, 0.02), darkMetalMat);
  hdmiPort.position.set(0.432, -0.012, -0.20);
  laptopBaseGroup.add(hdmiPort);

  const sdSlot = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.004, 0.032), darkMetalMat);
  sdSlot.position.set(0.432, -0.012, -0.11);
  laptopBaseGroup.add(sdSlot);

  const rightTbPort = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.005, 0.016), darkMetalMat);
  rightTbPort.position.set(0.432, -0.012, -0.03);
  laptopBaseGroup.add(rightTbPort);

  // 9. Black Anodized Display Hinge Barrel
  const hingeLocalY = 0.006;
  const hingeLocalZ = -0.275;
  const hingeY = 0.145 + hingeLocalY * Math.cos(laptopTilt) - hingeLocalZ * Math.sin(laptopTilt);
  const hingeZ = hingeLocalY * Math.sin(laptopTilt) + hingeLocalZ * Math.cos(laptopTilt);

  const hinge = new THREE.Mesh(
    new THREE.CylinderGeometry(0.012, 0.012, 0.76, 16),
    new THREE.MeshStandardMaterial({ color: 0x090d16, metalness: 0.8, roughness: 0.3 })
  );
  hinge.rotation.z = Math.PI / 2;
  hinge.position.set(0, hingeY, hingeZ);
  laptopGroup.add(hinge);

  // -------------------------------------------------------------
  // MacBook M2 Liquid Retina XDR Display Lid (Hierarchical Group)
  // -------------------------------------------------------------
  const laptopCanvas = document.createElement('canvas');
  laptopCanvas.width = 1024;
  laptopCanvas.height = 640;
  drawLaptopScreen(laptopCanvas);
  const laptopTex = new THREE.CanvasTexture(laptopCanvas);
  laptopTex.colorSpace = THREE.SRGBColorSpace;
  laptopTex.anisotropy = 8;

  // Apple Logo Back Texture (Official Apple silhouette with mirror chrome reflection)
  const logoCanvas = document.createElement('canvas');
  logoCanvas.width = 512;
  logoCanvas.height = 512;
  drawAppleLogoBack(logoCanvas);
  const appleLogoTex = new THREE.CanvasTexture(logoCanvas);
  appleLogoTex.colorSpace = THREE.SRGBColorSpace;
  appleLogoTex.anisotropy = 8;
  appleLogoTex.needsUpdate = true;

  const lidAngle = -Math.PI / 13;

  // Dedicated Lid Group pivoting around hinge axis
  const lidGroup = new THREE.Group();
  lidGroup.position.set(0, hingeY, hingeZ);
  lidGroup.rotation.x = lidAngle;
  laptopGroup.add(lidGroup);

  // 1. Aluminum Display Lid Outer Shell (Rounded Corners)
  const lidShape = createRoundedRectShape(baseWidth, 0.58, 0.022);
  const lidGeo = new THREE.ExtrudeGeometry(lidShape, {
    depth: 0.012,
    bevelEnabled: true,
    bevelSegments: 2,
    steps: 1,
    bevelSize: 0.001,
    bevelThickness: 0.001,
  });
  lidGeo.center();

  const lidShell = new THREE.Mesh(lidGeo, macbookChassisMat);
  lidShell.position.set(0, 0.29, -0.007);
  lidShell.castShadow = true;
  lidGroup.add(lidShell);

  // 2. Back of Lid: Official Mirrored Chrome Apple Logo Inlay Emblem
  // Proportional Apple logo sized at 0.12m x 0.12m with bite pointing to the right
  const appleLogoMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(0.12, 0.12),
    new THREE.MeshStandardMaterial({
      map: appleLogoTex,
      transparent: true,
      metalness: 0.95,
      roughness: 0.08,
      emissive: 0xffffff,
      emissiveMap: appleLogoTex,
      emissiveIntensity: 0.35,
      polygonOffset: true,
      polygonOffsetFactor: -4,
      polygonOffsetUnits: -4,
      depthWrite: false,
      side: THREE.FrontSide,
    })
  );
  appleLogoMesh.position.set(0, 0.29, -0.0143);
  appleLogoMesh.rotation.y = Math.PI; // Faces rearwards towards viewers behind the desk
  appleLogoMesh.name = 'macbook-apple-logo';
  appleLogoMesh.userData = {
    isClickable: true,
    workstationItem: 'laptop',
    label: '🍏 Mirror Chrome Apple Logo on MacBook Pro M2 Max lid',
  };
  lidGroup.add(appleLogoMesh);

  // 3. Front of Lid: Pitch-Black Edge-to-Edge Glass Display Bezel
  // Covers the entire front face so all bezels around the screen are deep, authentic Apple black
  const bezelWidth = baseWidth - 0.004; // 0.856m
  const bezelHeight = 0.576;
  const laptopBezelShape = createRoundedRectShape(bezelWidth, bezelHeight, 0.020);
  const laptopBezelGeo = new THREE.ShapeGeometry(laptopBezelShape);
  const frontBezelMesh = new THREE.Mesh(
    laptopBezelGeo,
    new THREE.MeshStandardMaterial({
      color: 0x020306, // Deep pitch-black Apple Retina glass bezel
      roughness: 0.12,
      metalness: 0.2,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    })
  );
  frontBezelMesh.position.set(0, 0.29, 0.0006);
  lidGroup.add(frontBezelMesh);

  // Black Protective Rubber Display Gasket around perimeter
  const gasketShape = createRoundedRectShape(baseWidth - 0.002, 0.578, 0.021);
  const gasketMesh = new THREE.Mesh(
    new THREE.ShapeGeometry(gasketShape),
    new THREE.MeshStandardMaterial({
      color: 0x080a0f,
      roughness: 0.95,
      polygonOffset: true,
      polygonOffsetFactor: 0,
      polygonOffsetUnits: 0,
    })
  );
  gasketMesh.position.set(0, 0.29, 0.0004);
  lidGroup.add(gasketMesh);

  // 4. Front of Lid: High-Brightness Liquid Retina XDR Screen
  // Centered with a uniform pitch-black bezel framing on all 4 edges
  const screenW = 0.814;
  const screenH = 0.534;
  const laptopScreenShape = createRoundedRectShape(screenW, screenH, 0.012);
  const laptopScreenGeo = new THREE.ShapeGeometry(laptopScreenShape);
  const scrPos = laptopScreenGeo.attributes.position;
  const scrUvs = new Float32Array(scrPos.count * 2);
  for (let i = 0; i < scrPos.count; i++) {
    const px = scrPos.getX(i);
    const py = scrPos.getY(i);
    scrUvs[i * 2] = (px + screenW / 2) / screenW;
    scrUvs[i * 2 + 1] = (py + screenH / 2) / screenH;
  }
  laptopScreenGeo.setAttribute('uv', new THREE.BufferAttribute(scrUvs, 2));

  const laptopScreenMesh = new THREE.Mesh(
    laptopScreenGeo,
    new THREE.MeshStandardMaterial({
      map: laptopTex,
      roughness: 0.1,
      metalness: 0.02,
      emissive: 0xffffff,
      emissiveMap: laptopTex,
      emissiveIntensity: 0.98,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
    })
  );
  laptopScreenMesh.position.set(0, 0.288, 0.0012);
  lidGroup.add(laptopScreenMesh);

  // 5. Iconic Top Camera Notch housing 1080p FaceTime HD Camera
  const notchShape = createRoundedRectShape(0.09, 0.026, 0.006);
  const notchMesh = new THREE.Mesh(
    new THREE.ShapeGeometry(notchShape),
    new THREE.MeshStandardMaterial({
      color: 0x020306,
      roughness: 0.3,
      polygonOffset: true,
      polygonOffsetFactor: -3,
      polygonOffsetUnits: -3,
    })
  );
  notchMesh.position.set(0, 0.542, 0.0018);
  lidGroup.add(notchMesh);

  // FaceTime HD Camera Lens with Anti-Reflective Optical Sheen
  const camLens = new THREE.Mesh(
    new THREE.SphereGeometry(0.004, 8, 8),
    new THREE.MeshStandardMaterial({ color: 0x06b6d4, emissive: 0x0284c7, emissiveIntensity: 0.8 })
  );
  camLens.position.set(-0.014, 0.542, 0.0025);
  lidGroup.add(camLens);

  // Microscopic Green Indicator LED (Active Camera status)
  const camGreenLed = new THREE.Mesh(
    new THREE.SphereGeometry(0.0025, 6, 6),
    new THREE.MeshStandardMaterial({ color: 0x22c55e, emissive: 0x22c55e, emissiveIntensity: 1.8 })
  );
  camGreenLed.position.set(0.014, 0.542, 0.0025);
  lidGroup.add(camGreenLed);

  // Laser-etched dark silver "MacBook Pro" typography centered on the bottom black bezel
  const mbpLabelCanvas = document.createElement('canvas');
  mbpLabelCanvas.width = 256;
  mbpLabelCanvas.height = 32;
  const mbpCtx = mbpLabelCanvas.getContext('2d');
  if (mbpCtx) {
    mbpCtx.fillStyle = '#64748b';
    mbpCtx.font = '600 13px -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif';
    mbpCtx.textAlign = 'center';
    mbpCtx.textBaseline = 'middle';
    mbpCtx.fillText('MacBook Pro', 128, 16);
  }
  const mbpLabelTex = new THREE.CanvasTexture(mbpLabelCanvas);
  const mbpLabelMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(0.12, 0.015),
    new THREE.MeshBasicMaterial({ map: mbpLabelTex, transparent: true, opacity: 0.8 })
  );
  mbpLabelMesh.position.set(0, 0.013, 0.0014);
  lidGroup.add(mbpLabelMesh);

  laptopGroup.name = 'laptop-group';
  laptopGroup.userData = {
    isClickable: true,
    workstationItem: 'laptop',
    label: '💻 MacBook Pro M2 Max: Apple Silicon Chip, Liquid Retina XDR & macOS Sequoia',
  };
  deskTopGroup.add(laptopGroup);

  // -------------------------------------------------------------
  // 6. MECHANICAL KEYBOARD AKKO 3068B PLUS BLACK & CYAN (65% COMPACT, HOTSWAP, DAMPENING FOAM, JELLY PINK)
  // -------------------------------------------------------------
  const keyboardGroup = new THREE.Group();
  keyboardGroup.position.set(0, 1.305, 0.10);
  keyboardGroup.scale.set(1.18, 1.18, 1.18); // Scaled up slightly for enhanced ergonomics and presence

  // Ergonomic Matching Black & Cyan Leatherette Wrist Rest (0.70m wide, exact fit for 65%)
  const wristRestWidth = 0.70;
  const wristRestDepth = 0.11;
  const wristRestMat = new THREE.MeshStandardMaterial({
    color: 0x141720,
    roughness: 0.65,
    metalness: 0.05,
  });
  const wristRest = new THREE.Mesh(new THREE.BoxGeometry(wristRestWidth, 0.024, wristRestDepth), wristRestMat);
  wristRest.position.set(0, -0.002, 0.205);
  wristRest.castShadow = true;
  keyboardGroup.add(wristRest);

  // Sleek Electric Cyan Accent Racing Inset Line along the wrist rest
  const wristCyanLineMat = new THREE.MeshStandardMaterial({
    color: 0x00f0ff,
    emissive: 0x00c4e6,
    emissiveIntensity: 0.6,
    roughness: 0.2,
  });
  const wristCyanLine = new THREE.Mesh(
    new THREE.BoxGeometry(wristRestWidth - 0.04, 0.002, 0.003),
    wristCyanLineMat
  );
  wristCyanLine.position.set(0, 0.0105, 0.23);
  keyboardGroup.add(wristCyanLine);

  // Front smooth ergonomic palm roll bevel
  const wristBevel = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, wristRestWidth, 16), wristRestMat);
  wristBevel.rotation.z = Math.PI / 2;
  wristBevel.position.set(0, 0.009, 0.258);
  keyboardGroup.add(wristBevel);

  // Keyboard Chassis with Natural 6° Ergonomic Incline (-0.09 rad)
  const kbChassis = new THREE.Group();
  kbChassis.rotation.x = -0.09;

  // Case Materials
  const akkoCaseMat = new THREE.MeshStandardMaterial({
    color: 0x141822, // Low-Profile Matte Stealth Obsidian Base
    roughness: 0.55,
    metalness: 0.12,
  });

  const kbWidth = 0.70;
  const kbDepth = 0.245;
  const kbHeight = 0.016; // Low-profile slim base case below the switch plate

  // 1. Slim Low-Profile Base Case with Smooth Beveled Rounded Corners (Bottom of keyboard)
  const kbCaseShape = createRoundedRectShape(kbWidth, kbDepth, 0.012);
  const kbCaseGeo = new THREE.ExtrudeGeometry(kbCaseShape, {
    depth: kbHeight,
    bevelEnabled: true,
    bevelSegments: 2,
    steps: 1,
    bevelSize: 0.0025,
    bevelThickness: 0.0025,
  });
  kbCaseGeo.rotateX(-Math.PI / 2);
  const kbCase = new THREE.Mesh(kbCaseGeo, akkoCaseMat);
  kbCase.position.set(0, -kbHeight, 0);
  kbCase.castShadow = true;
  kbChassis.add(kbCase);

  // 2. High-Density Bottom Silicone & EVA Acoustic Foam
  const caseFoam = new THREE.Mesh(
    new THREE.BoxGeometry(0.686, 0.004, 0.232),
    new THREE.MeshStandardMaterial({ color: 0x090c14, roughness: 0.95 })
  );
  caseFoam.position.set(0, -0.002, 0);
  kbChassis.add(caseFoam);

  // 3. Exposed Anodized Aircraft-Grade Brushed Aluminum Top Plate (True Floating-Key Architecture)
  // In a floating mechanical keyboard, the top plate is completely flat and exposed with no sunken bezels or raised lip
  const switchPlateMat = new THREE.MeshStandardMaterial({
    color: 0x1a202c, // Dark Gunmetal Brushed Anodized Aluminum Plate
    roughness: 0.28,
    metalness: 0.88,
  });
  const switchPlate = new THREE.Mesh(
    new THREE.BoxGeometry(kbWidth - 0.004, 0.0045, kbDepth - 0.004),
    switchPlateMat
  );
  switchPlate.position.set(0, 0.0025, 0);
  switchPlate.receiveShadow = true;
  kbChassis.add(switchPlate);

  // CNC Diamond-Cut Chamfer Silver Accent Rim around the aluminum plate perimeter
  const chamferMat = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    metalness: 0.95,
    roughness: 0.12,
  });
  const chamferTrim = new THREE.Mesh(
    new THREE.BoxGeometry(kbWidth - 0.002, 0.0015, kbDepth - 0.002),
    chamferMat
  );
  chamferTrim.position.set(0, 0.0048, 0);
  kbChassis.add(chamferTrim);

  // 4. Perimeter RGB Ambient Underglow Glow Channel
  const kbUnderglowMat = new THREE.MeshStandardMaterial({
    color: 0x00f0ff,
    emissive: 0x00c4e6,
    emissiveIntensity: 0.95,
    roughness: 0.25,
  });
  const underglowStrip = new THREE.Mesh(new THREE.BoxGeometry(0.692, 0.003, 0.238), kbUnderglowMat);
  underglowStrip.position.set(0, -0.004, 0);
  kbChassis.add(underglowStrip);

  // 5. AKKO CS Jelly Pink 3D Switches (Translucent Pink Housings + Box Stems mounted on top of plate)
  const jellyPinkMat = new THREE.MeshStandardMaterial({
    color: 0xff6b9d, // Signature Jelly Pink Translucent Housing
    roughness: 0.18,
    metalness: 0.08,
    transparent: true,
    opacity: 0.92,
  });
  const jellyStemMat = new THREE.MeshStandardMaterial({
    color: 0xff3b7b, // Bright Jelly Pink Cross Box Stem
    roughness: 0.25,
    metalness: 0.05,
  });

  // Create instanced switch housings across the 68 key locations (Exposed on top of the plate)
  const switchGeo = new THREE.BoxGeometry(0.0185, 0.0085, 0.0185);
  const stemGeo = new THREE.BoxGeometry(0.008, 0.009, 0.008);
  const switchInst = new THREE.InstancedMesh(switchGeo, jellyPinkMat, 68);
  const stemInst = new THREE.InstancedMesh(stemGeo, jellyStemMat, 68);

  const dummy = new THREE.Object3D();
  const plateW = 0.672;
  const plateD = 0.218;
  const uW = plateW / 16;
  const rH = plateD / 5;

  let swIdx = 0;
  for (let r = 0; r < AKKO_65_LAYOUT.length; r++) {
    const row = AKKO_65_LAYOUT[r];
    const zPos = -plateD / 2 + (r + 0.5) * rH;
    let curX = -plateW / 2;

    for (let i = 0; i < row.length; i++) {
      const k = row[i];
      const xPos = curX + (k.u * uW) / 2;

      // Switch housing sits proudly on top of switch plate (y = 0.005 to 0.014, fully exposed)
      dummy.position.set(xPos, 0.0095, zPos);
      dummy.updateMatrix();
      switchInst.setMatrixAt(swIdx, dummy.matrix);

      // Pink cross-box stem rising into floating keycap (y = 0.014 to 0.022)
      dummy.position.set(xPos, 0.0175, zPos);
      dummy.updateMatrix();
      stemInst.setMatrixAt(swIdx, dummy.matrix);

      swIdx++;
      curX += k.u * uW;
    }
  }
  switchInst.instanceMatrix.needsUpdate = true;
  stemInst.instanceMatrix.needsUpdate = true;
  kbChassis.add(switchInst);
  kbChassis.add(stemInst);

  // Mechanical Keyboard Cherry Stabilizers for wide keys (Space, Enter, Backspace, Shifts)
  const stabWireMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.92, roughness: 0.18 });
  const stabStemMat = new THREE.MeshStandardMaterial({ color: 0x11151e, roughness: 0.4 });
  const wideKeyStabs: { x: number; z: number; span: number }[] = [
    { x: -plateW / 2 + 3.125 * uW, z: -plateD / 2 + 4.5 * rH, span: 0.14 }, // Spacebar (6.25u)
    { x: -plateW / 2 + 13.875 * uW, z: -plateD / 2 + 2.5 * rH, span: 0.046 }, // Enter (2.25u)
    { x: -plateW / 2 + 1.125 * uW, z: -plateD / 2 + 3.5 * rH, span: 0.046 }, // Left Shift (2.25u)
    { x: -plateW / 2 + 14.0 * uW, z: -plateD / 2 + 0.5 * rH, span: 0.040 }, // Backspace (2.0u)
    { x: -plateW / 2 + 12.875 * uW, z: -plateD / 2 + 3.5 * rH, span: 0.036 }, // Right Shift (1.75u)
  ];

  wideKeyStabs.forEach((stab) => {
    // Steel connecting wire sitting on plate surface
    const wire = new THREE.Mesh(new THREE.CylinderGeometry(0.0012, 0.0012, stab.span, 8), stabWireMat);
    wire.rotation.z = Math.PI / 2;
    wire.position.set(stab.x, 0.007, stab.z);
    kbChassis.add(wire);

    // Left & right dummy stabilizer stems
    [-stab.span / 2, stab.span / 2].forEach((sx) => {
      const stem = new THREE.Mesh(new THREE.BoxGeometry(0.0055, 0.008, 0.0055), stabStemMat);
      stem.position.set(stab.x + sx, 0.012, stab.z);
      kbChassis.add(stem);
    });
  });

  // 7. Authentic 3D Floating Mechanical Keycaps (Bare switch design, ASA Profile Double-Shot PBT)
  // High-resolution Canvas Texture for Keycap Top Legends
  const akkoCanvas = document.createElement('canvas');
  akkoCanvas.width = 2048;
  akkoCanvas.height = 720;
  drawAkko3068BKeyboard(akkoCanvas, '#00f0ff');
  const akkoTex = new THREE.CanvasTexture(akkoCanvas);
  akkoTex.colorSpace = THREE.SRGBColorSpace;
  akkoTex.anisotropy = 8;
  akkoTex.needsUpdate = true;

  // Keycap Materials (PBT Side Walls + Double-Shot Top Legend)
  const pbtCyanSideMat = new THREE.MeshStandardMaterial({
    color: 0x00c2db, // Akko Signature Electric Cyan
    roughness: 0.38,
    metalness: 0.05,
  });
  const pbtModSideMat = new THREE.MeshStandardMaterial({
    color: 0x12151d, // Stealth Midnight Black
    roughness: 0.48,
    metalness: 0.06,
  });
  const pbtAlphaSideMat = new THREE.MeshStandardMaterial({
    color: 0x1a1e28, // Deep Charcoal PBT
    roughness: 0.48,
    metalness: 0.06,
  });
  const pbtBottomMat = new THREE.MeshStandardMaterial({
    color: 0x0b0d13, // Dark Keycap Underside Socket
    roughness: 0.8,
  });
  const pbtTopMat = new THREE.MeshStandardMaterial({
    map: akkoTex,
    roughness: 0.35,
    metalness: 0.05,
    emissive: 0xffffff,
    emissiveMap: akkoTex,
    emissiveIntensity: 0.32,
  });

  // Build the 68 individual floating 3D keycaps
  const keycapsGroup = new THREE.Group();
  const keyGap3D = 0.0035; // 3.5mm physical air channel between floating keycaps
  const hKeycap = 0.0135; // 13.5mm tall 3D keycaps

  const canvasMarginX = 36;
  const canvasMarginY = 30;
  const canvasAvailW = 2048 - canvasMarginX * 2;
  const canvasAvailH = 720 - canvasMarginY * 2;
  const canvasUWidth = canvasAvailW / 16;
  const canvasRowH = canvasAvailH / 5;
  const canvasKeyGap = 7;

  for (let r = 0; r < AKKO_65_LAYOUT.length; r++) {
    const row = AKKO_65_LAYOUT[r];
    const zCenter = -plateD / 2 + (r + 0.5) * rH;
    let curX3D = -plateW / 2;
    let uAccum = 0;

    for (let i = 0; i < row.length; i++) {
      const k = row[i];
      const wKey3D = k.u * uW - keyGap3D;
      const dKey3D = rH - keyGap3D;
      const xCenter = curX3D + (k.u * uW) / 2;

      // Create individual 3D keycap box geometry
      const kGeo = new THREE.BoxGeometry(wKey3D, hKeycap, dKey3D, 1, 1, 1);

      // Sculpt ASA Profile: Taper top face inward by 18% & apply subtle ergonomic row sculpting
      const pos = kGeo.attributes.position;
      const taperX = k.space ? 0.96 : (k.u > 1.5 ? 0.88 : 0.82);
      const taperZ = 0.82;

      for (let v = 0; v < pos.count; v++) {
        if (pos.getY(v) > 0) {
          // Top vertices of keycap
          pos.setX(v, pos.getX(v) * taperX);
          pos.setZ(v, pos.getZ(v) * taperZ);

          // ASA profile row-by-row curvature
          if (r === 0) {
            pos.setY(v, pos.getY(v) + 0.002);
            pos.setZ(v, pos.getZ(v) + 0.001);
          } else if (r === 1) {
            pos.setY(v, pos.getY(v) + 0.001);
          } else if (r === 4) {
            pos.setY(v, pos.getY(v) + 0.001);
            pos.setZ(v, pos.getZ(v) - 0.0012);
          }
        }
      }
      pos.needsUpdate = true;

      // UV Map the +Y face (Top face: vertices 8, 9, 10, 11) directly to its key in akkoTex
      const curXPix = canvasMarginX + uAccum * canvasUWidth;
      const curYPix = canvasMarginY + r * canvasRowH;
      const wKeyPix = k.u * canvasUWidth - canvasKeyGap;
      const hKeyPix = canvasRowH - canvasKeyGap;

      const u0 = curXPix / 2048;
      const u1 = (curXPix + wKeyPix) / 2048;
      const v0 = 1 - (curYPix + hKeyPix) / 720;
      const v1 = 1 - curYPix / 720;

      const uv = kGeo.attributes.uv;
      uv.setXY(8, u0, v1);
      uv.setXY(9, u1, v1);
      uv.setXY(10, u0, v0);
      uv.setXY(11, u1, v0);
      uv.needsUpdate = true;
      kGeo.computeVertexNormals();

      // Material assignment: 6 faces of BoxGeometry [ +X, -X, +Y, -Y, +Z, -Z ]
      const sideMat = k.cyan ? pbtCyanSideMat : (k.mod ? pbtModSideMat : pbtAlphaSideMat);
      const materials = [sideMat, sideMat, pbtTopMat, pbtBottomMat, sideMat, sideMat];

      const keyMesh = new THREE.Mesh(kGeo, materials);
      // Elevate keycap: bottom rests at y = 0.0185, top stands prominently at y = 0.032 to 0.034
      keyMesh.position.set(xCenter, 0.0252, zCenter);
      keyMesh.castShadow = true;
      keyMesh.receiveShadow = true;
      keycapsGroup.add(keyMesh);

      curX3D += k.u * uW;
      uAccum += k.u;
    }
  }
  kbChassis.add(keycapsGroup);

  // 8. Authentic AKKO Hardware Details
  // Front-Right Bezel "AKKO" emblem metal badge
  const akkoBadgeMat = new THREE.MeshStandardMaterial({
    color: 0x00f0ff,
    emissive: 0x00b4d8,
    emissiveIntensity: 0.5,
    metalness: 0.85,
    roughness: 0.25,
  });
  const akkoBadge = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.003, 0.010), akkoBadgeMat);
  akkoBadge.position.set(0.28, 0.020, 0.114);
  kbChassis.add(akkoBadge);

  // Top-Left Chamfered USB Type-C Port
  const usbPortMat = new THREE.MeshStandardMaterial({ color: 0xd1d5db, metalness: 0.8, roughness: 0.3 });
  const usbPort = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.007, 0.010), usbPortMat);
  usbPort.position.set(-0.27, 0.014, -0.125);
  kbChassis.add(usbPort);

  // Bottom 4 Silicone Non-Slip Rubber Foot Pads
  const footMat = new THREE.MeshStandardMaterial({ color: 0x0a0c10, roughness: 0.95 });
  const footCoords = [
    [-0.32, -0.098],
    [0.32, -0.098],
    [-0.32, 0.098],
    [0.32, 0.098],
  ];
  footCoords.forEach(([fx, fz]) => {
    const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.010, 0.010, 0.004, 12), footMat);
    foot.position.set(fx, -0.020, fz);
    kbChassis.add(foot);
  });

  // Dual-Tier Foldable Magnetic Kickstands on the underside
  [-0.26, 0.26].forEach((kx) => {
    const legBase = new THREE.Mesh(
      new THREE.BoxGeometry(0.035, 0.006, 0.025),
      new THREE.MeshStandardMaterial({ color: 0x1f2430, roughness: 0.6 })
    );
    legBase.position.set(kx, -0.018, -0.08);
    kbChassis.add(legBase);
  });

  // Underside 3-way Wireless Mode Switch: Bluetooth 5.0 | USB | 2.4Ghz
  const switchKnob = new THREE.Mesh(
    new THREE.BoxGeometry(0.016, 0.005, 0.008),
    new THREE.MeshStandardMaterial({ color: 0x00f0ff, metalness: 0.7, roughness: 0.3 })
  );
  switchKnob.position.set(0, -0.019, -0.04);
  kbChassis.add(switchKnob);

  // Docked 2.4GHz Magnetic Nano Receiver Dongle
  const dongle = new THREE.Mesh(
    new THREE.BoxGeometry(0.014, 0.004, 0.008),
    new THREE.MeshStandardMaterial({ color: 0x090b10, roughness: 0.5 })
  );
  dongle.position.set(0.08, -0.019, -0.04);
  kbChassis.add(dongle);

  keyboardGroup.add(kbChassis);

  // Note: Keyboard cable removed as requested - AKKO 3068B Plus operates in wireless Bluetooth / 2.4GHz mode

  // Ensure ALL sub-meshes are clickable
  keyboardGroup.name = 'keyboard-group';
  keyboardGroup.userData = {
    isClickable: true,
    workstationItem: 'keyboard',
    label: '⌨️ AKKO 3068B Plus Floating Mechanical Keyboard: Click to type & cycle RGB',
  };
  keyboardGroup.traverse((child) => {
    child.userData = {
      isClickable: true,
      workstationItem: 'keyboard',
      label: '⌨️ AKKO 3068B Plus Floating Mechanical Keyboard: Click to type & cycle RGB',
    };
  });
  deskTopGroup.add(keyboardGroup);

  // -------------------------------------------------------------
  // 7. BLUETOOTH SILENT MOUSE LOGITECH SIGNATURE M650 (GRAPHITE)
  // Premium Ergonomic Pebble Sculpt with SmartWheel & Soft Grips
  // -------------------------------------------------------------
  const mouseGroup = new THREE.Group();
  mouseGroup.position.set(0.74, 1.30, 0.18);

  // Logitech Signature M650 Materials Palette
  const m650ShellMat = new THREE.MeshStandardMaterial({
    color: 0x222630, // Graphite Matte ABS Shell
    roughness: 0.38,
    metalness: 0.14,
  });
  const m650PalmMat = new THREE.MeshStandardMaterial({
    color: 0x252a35, // Ergonomic Palm Top Coat
    roughness: 0.34,
    metalness: 0.12,
  });
  const m650GripMat = new THREE.MeshStandardMaterial({
    color: 0x13161e, // Textured Soft-Touch Elastomer Rubber
    roughness: 0.85,
    metalness: 0.04,
  });
  const m650ButtonMat = new THREE.MeshStandardMaterial({
    color: 0x20242d, // Smooth SilentTouch Click Paddle Finish
    roughness: 0.36,
    metalness: 0.12,
  });
  const m650WheelMat = new THREE.MeshStandardMaterial({
    color: 0x161920, // SmartWheel High-Traction Rubber
    roughness: 0.72,
    metalness: 0.08,
  });
  const m650ChromeMat = new THREE.MeshStandardMaterial({
    color: 0xd1d5db, // SmartWheel Polished Chrome Rims
    metalness: 0.95,
    roughness: 0.14,
  });
  const m650SideBtnMat = new THREE.MeshStandardMaterial({
    color: 0x3b4252, // Satin Thumb Buttons (Forward & Back)
    metalness: 0.65,
    roughness: 0.25,
  });
  const m650PtfeMat = new THREE.MeshStandardMaterial({
    color: 0x090b10, // Low-friction PTFE Glide Feet
    roughness: 0.22,
    metalness: 0.10,
  });

  // Dimensions: 10.7cm length, 6.2cm width, 3.8cm height scaled appropriately
  const mLen = 0.205;
  const mWid = 0.118;
  const mHgt = 0.046;

  // 1. Smooth Ergonomic Outer Contour Chassis using ExtrudeGeometry with Bevel
  const mouseShape = new THREE.Shape();
  // Draw smooth ergonomic outline: narrow front, gentle waist curve, rounded rear
  const fW = mWid * 0.42; // half width front
  const mW = mWid * 0.48; // half width waist
  const rW = mWid * 0.46; // half width rear
  const fL = -mLen * 0.48; // front edge
  const wL = 0.01;         // waist location
  const rL = mLen * 0.48;  // rear edge

  mouseShape.moveTo(0, fL);
  // Front right curve to waist
  mouseShape.bezierCurveTo(fW * 0.7, fL, fW, fL * 0.5, mW * 0.94, wL * 0.4);
  // Waist right curve to rear
  mouseShape.bezierCurveTo(mW * 1.05, wL + 0.03, rW * 1.02, rL * 0.7, rW * 0.7, rL);
  // Rear center rounding
  mouseShape.bezierCurveTo(rW * 0.35, rL + 0.012, -rW * 0.35, rL + 0.012, -rW * 0.7, rL);
  // Rear left to waist
  mouseShape.bezierCurveTo(-rW * 1.02, rL * 0.7, -mW * 1.05, wL + 0.03, -mW * 0.94, wL * 0.4);
  // Waist left to front
  mouseShape.bezierCurveTo(-fW, fL * 0.5, -fW * 0.7, fL, 0, fL);

  const extrudeSettings: THREE.ExtrudeGeometryOptions = {
    depth: 0.014,
    bevelEnabled: true,
    bevelSegments: 5,
    bevelSize: 0.007,
    bevelThickness: 0.007,
  };
  const baseChassisGeo = new THREE.ExtrudeGeometry(mouseShape, extrudeSettings);
  baseChassisGeo.rotateX(Math.PI / 2);
  const baseChassis = new THREE.Mesh(baseChassisGeo, m650ShellMat);
  baseChassis.position.set(0, 0.021, 0);
  baseChassis.castShadow = true;
  mouseGroup.add(baseChassis);

  // 2. Sculpted Organic Palm Dome (High palm arch with gentle canting)
  const palmDomeGeo = new THREE.SphereGeometry(1, 28, 20);
  palmDomeGeo.scale(mWid * 0.44, mHgt * 0.72, mLen * 0.36);
  // Deform sphere to create natural ergonomic slope towards the click buttons
  const pPos = palmDomeGeo.attributes.position;
  for (let i = 0; i < pPos.count; i++) {
    const z = pPos.getZ(i);
    const x = pPos.getX(i);
    let y = pPos.getY(i);
    if (y < 0) {
      pPos.setY(i, y * 0.15); // flatten underside
    }
    // Slight ergonomic tilt to right (1.5 degrees) for natural palm relaxation
    pPos.setY(i, pPos.getY(i) - x * 0.06);
    // Smooth rear falloff
    if (z > 0.02) {
      pPos.setY(i, pPos.getY(i) * (1.0 - (z - 0.02) * 4.5));
    }
  }
  pPos.needsUpdate = true;
  palmDomeGeo.computeVertexNormals();

  const palmDomeMesh = new THREE.Mesh(palmDomeGeo, m650PalmMat);
  palmDomeMesh.position.set(0, 0.024, 0.028);
  palmDomeMesh.castShadow = true;
  mouseGroup.add(palmDomeMesh);

  // 3. Ergonomic SilentTouch Click Buttons (Left & Right Paddles)
  const clickLength = mLen * 0.44;
  const clickHalfWidth = mWid * 0.40;

  // Left Click with subtle finger scoop
  const clickGeo = new THREE.BoxGeometry(clickHalfWidth, 0.014, clickLength, 8, 2, 8);
  const cPos = clickGeo.attributes.position;
  for (let i = 0; i < cPos.count; i++) {
    const cz = cPos.getZ(i);
    const cx = cPos.getX(i);
    let cy = cPos.getY(i);
    // Gentle forward downward slope
    if (cz < 0) {
      cy += cz * 0.12;
    }
    // Subtle ergonomic finger scoop (concave trough in center of key paddle)
    const distFromCenter = Math.abs(cx);
    cy -= (0.0018 * (1.0 - distFromCenter / (clickHalfWidth * 0.6)));
    cPos.setY(i, cy);
  }
  cPos.needsUpdate = true;
  clickGeo.computeVertexNormals();

  const leftClickBtn = new THREE.Mesh(clickGeo, m650ButtonMat);
  leftClickBtn.position.set(-clickHalfWidth * 0.52 - 0.002, 0.027, -clickLength * 0.48);
  leftClickBtn.rotation.x = -0.05;
  leftClickBtn.castShadow = true;
  mouseGroup.add(leftClickBtn);

  const rightClickBtn = new THREE.Mesh(clickGeo.clone(), m650ButtonMat);
  rightClickBtn.position.set(clickHalfWidth * 0.52 + 0.002, 0.027, -clickLength * 0.48);
  rightClickBtn.rotation.x = -0.05;
  rightClickBtn.castShadow = true;
  mouseGroup.add(rightClickBtn);

  // Crisp recessed separator channel
  const clickChannel = new THREE.Mesh(
    new THREE.BoxGeometry(0.0025, 0.010, clickLength * 0.98),
    m650GripMat
  );
  clickChannel.position.set(0, 0.027, -clickLength * 0.48);
  mouseGroup.add(clickChannel);

  // 4. Iconic Ribbed Soft Rubber Side Grips (Contoured left & right flanks)
  [-1, 1].forEach((side) => {
    // Sculpted rubber grip insert
    const gripGeo = new THREE.CylinderGeometry(0.012, 0.016, mLen * 0.60, 16);
    gripGeo.rotateX(Math.PI / 2);
    gripGeo.scale(side === -1 ? 1.08 : 0.95, 0.9, 1);
    const gripMesh = new THREE.Mesh(gripGeo, m650GripMat);
    gripMesh.position.set(side * (mWid * 0.44), 0.019, 0.005);
    mouseGroup.add(gripMesh);

    // Horizontal tactile elastomer ribs (5 textured wave ribs)
    for (let rib = 0; rib < 5; rib++) {
      const ribMesh = new THREE.Mesh(
        new THREE.CylinderGeometry(0.0018, 0.0018, mLen * 0.48, 8),
        m650ShellMat
      );
      ribMesh.rotateX(Math.PI / 2);
      ribMesh.position.set(
        side * (mWid * 0.455 + (side === -1 ? 0.002 : 0)),
        0.010 + rib * 0.0042,
        0.005
      );
      mouseGroup.add(ribMesh);
    }
  });

  // 5. Logitech SmartWheel (Adaptive Speed Precision Scroll Wheel with Satin Trim)
  const wheelRadius = 0.0165;
  const wheelWidth = 0.013;

  // Recessed cockpit well with polished inner bevel
  const cockpitWell = new THREE.Mesh(
    new THREE.BoxGeometry(wheelWidth + 0.008, 0.016, wheelRadius * 2.3),
    m650GripMat
  );
  cockpitWell.position.set(0, 0.027, -0.045);
  mouseGroup.add(cockpitWell);

  // Main high-traction rubber wheel
  const wheelGeo = new THREE.CylinderGeometry(wheelRadius, wheelRadius, wheelWidth * 0.68, 24);
  wheelGeo.rotateZ(Math.PI / 2);
  const m650Wheel = new THREE.Mesh(wheelGeo, m650WheelMat);
  m650Wheel.position.set(0, 0.034, -0.045);
  m650Wheel.castShadow = true;
  mouseGroup.add(m650Wheel);

  // Precision micro-ribs across the wheel tread
  for (let r = 0; r < 14; r++) {
    const angle = (r / 14) * Math.PI * 2;
    const ribTread = new THREE.Mesh(
      new THREE.BoxGeometry(wheelWidth * 0.64, 0.0012, 0.0012),
      m650ShellMat
    );
    ribTread.position.set(
      0,
      0.034 + Math.sin(angle) * wheelRadius,
      -0.045 + Math.cos(angle) * wheelRadius
    );
    mouseGroup.add(ribTread);
  }

  // Dual polished satin chrome side rims
  [-wheelWidth * 0.42, wheelWidth * 0.42].forEach((wx) => {
    const chromeRimGeo = new THREE.CylinderGeometry(wheelRadius * 0.96, wheelRadius * 0.96, wheelWidth * 0.16, 20);
    chromeRimGeo.rotateZ(Math.PI / 2);
    const chromeRim = new THREE.Mesh(chromeRimGeo, m650ChromeMat);
    chromeRim.position.set(wx, 0.034, -0.045);
    mouseGroup.add(chromeRim);
  });

  // 6. Dual Side Navigation Buttons (Back & Forward Pill Buttons on Left Flank)
  const sideBtnGeo = new THREE.CapsuleGeometry(0.0032, 0.012, 8, 12);
  sideBtnGeo.rotateX(Math.PI / 2);

  const btnBack = new THREE.Mesh(sideBtnGeo, m650SideBtnMat);
  btnBack.position.set(-mWid * 0.465, 0.026, 0.018);
  btnBack.rotation.y = -0.08;
  btnBack.castShadow = true;
  mouseGroup.add(btnBack);

  const btnFwd = new THREE.Mesh(sideBtnGeo, m650SideBtnMat);
  btnFwd.position.set(-mWid * 0.465, 0.026, -0.007);
  btnFwd.rotation.y = -0.08;
  btnFwd.castShadow = true;
  mouseGroup.add(btnFwd);

  // 7. Logitech Branding: Crisp "logi" laser-etched badge on lower palm
  const logiCanvas = document.createElement('canvas');
  logiCanvas.width = 256;
  logiCanvas.height = 128;
  const lctx = logiCanvas.getContext('2d');
  if (lctx) {
    lctx.clearRect(0, 0, 256, 128);
    lctx.fillStyle = '#94a3b8';
    lctx.font = 'bold 54px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    lctx.textAlign = 'center';
    lctx.textBaseline = 'middle';
    lctx.letterSpacing = '-1px';
    lctx.fillText('logi', 128, 64);
  }
  const logiTex = new THREE.CanvasTexture(logiCanvas);
  logiTex.colorSpace = THREE.SRGBColorSpace;

  const logiBadge = new THREE.Mesh(
    new THREE.PlaneGeometry(0.030, 0.015),
    new THREE.MeshStandardMaterial({
      map: logiTex,
      transparent: true,
      metalness: 0.5,
      roughness: 0.35,
      opacity: 0.85,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    })
  );
  logiBadge.rotation.x = -Math.PI / 2 + 0.32;
  logiBadge.position.set(0, 0.035, 0.062);
  mouseGroup.add(logiBadge);

  // Battery & Bluetooth Connection Status LED (Subtle emerald jewel)
  const statusLed = new THREE.Mesh(
    new THREE.SphereGeometry(0.0018, 8, 8),
    new THREE.MeshStandardMaterial({
      color: 0x10b981,
      emissive: 0x10b981,
      emissiveIntensity: 1.4,
    })
  );
  statusLed.position.set(0, 0.0335, -0.023);
  mouseGroup.add(statusLed);

  // 8. Base Underside: PTFE Low-Friction Glide Skates, Optical Sensor & Power Switch
  const skateFront = new THREE.Mesh(
    new THREE.BoxGeometry(mWid * 0.72, 0.0025, 0.018),
    m650PtfeMat
  );
  skateFront.position.set(0, 0.001, -mLen * 0.38);
  mouseGroup.add(skateFront);

  const skateRear = new THREE.Mesh(
    new THREE.BoxGeometry(mWid * 0.68, 0.0025, 0.022),
    m650PtfeMat
  );
  skateRear.position.set(0, 0.001, mLen * 0.37);
  mouseGroup.add(skateRear);

  // Optical sensor well with tracking light
  const sensorWell = new THREE.Mesh(
    new THREE.CylinderGeometry(0.009, 0.009, 0.004, 16),
    new THREE.MeshStandardMaterial({ color: 0x05070a, roughness: 0.9 })
  );
  sensorWell.position.set(0, 0.002, 0);
  mouseGroup.add(sensorWell);

  const sensorLed = new THREE.Mesh(
    new THREE.SphereGeometry(0.002, 8, 8),
    new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 1.0,
    })
  );
  sensorLed.position.set(0, 0.003, 0);
  mouseGroup.add(sensorLed);

  // Power on/off switch with green accent dot
  const powerSwitch = new THREE.Mesh(
    new THREE.BoxGeometry(0.007, 0.003, 0.013),
    new THREE.MeshStandardMaterial({ color: 0x10b981, roughness: 0.4 })
  );
  powerSwitch.position.set(0.026, 0.002, 0.01);
  mouseGroup.add(powerSwitch);

  // Easy-Switch / Bluetooth Pairing Button
  const connectBtn = new THREE.Mesh(
    new THREE.CylinderGeometry(0.004, 0.004, 0.002, 12),
    m650ChromeMat
  );
  connectBtn.position.set(-0.026, 0.002, 0.01);
  mouseGroup.add(connectBtn);

  mouseGroup.name = 'mouse-group';
  mouseGroup.userData = {
    isClickable: true,
    workstationItem: 'mouse',
    label: '🖱️ Logitech Signature M650 Silent Mouse: Click to test silent switch',
  };
  mouseGroup.traverse((child) => {
    child.userData = {
      isClickable: true,
      workstationItem: 'mouse',
      label: '🖱️ Logitech Signature M650 Silent Mouse: Click to test silent switch',
    };
  });
  deskTopGroup.add(mouseGroup);

  // -------------------------------------------------------------
  // 8. STUDIO AUDIO MONITORS (Mounted Under-Desk with Heavy-Duty Brackets)
  // -------------------------------------------------------------
  const speakerMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5 });
  const wooferMat = new THREE.MeshStandardMaterial({
    color: 0x0284c7,
    emissive: 0x0369a1,
    emissiveIntensity: 0.5,
  });

  const woofers: THREE.Mesh[] = [];
  const speakerConfigs = [
    { sx: -1.25, rotY: 0.26, name: 'speaker-left' },
    { sx: 1.05, rotY: -0.26, name: 'speaker-right' },
  ];

  speakerConfigs.forEach(({ sx, rotY, name }) => {
    const spk = new THREE.Group();
    // Mounted under the desk tabletop at y = 0.88
    spk.position.set(sx, 0.88, 0.28);
    spk.rotation.x = -0.16; // Angled slightly upward towards user ears
    spk.rotation.y = rotY; // Angled inward

    // Heavy-duty under-desk acoustic suspension clamp bracket (connecting desk underside y = 1.08 to speaker)
    const bracket = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.22, 0.24), darkMetalMat);
    bracket.position.set(0, 0.18, 0);
    bracket.castShadow = true;
    spk.add(bracket);

    // Top mounting plate attaching flush to underside of desk
    const mountPlate = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.02, 0.24), darkMetalMat);
    mountPlate.position.set(0, 0.29, 0);
    spk.add(mountPlate);

    // Studio Monitor Cabinet (High-end under-desk studio sound)
    const cab = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.38, 0.26), speakerMat);
    cab.castShadow = true;
    spk.add(cab);

    // Tweeter
    const tw = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.02, 10), darkMetalMat);
    tw.rotation.x = Math.PI / 2;
    tw.position.set(0, 0.10, 0.131);
    spk.add(tw);

    // Woofer
    const wf = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.02, 12), wooferMat);
    wf.rotation.x = Math.PI / 2;
    wf.position.set(0, -0.06, 0.131);
    spk.add(wf);
    woofers.push(wf);

    spk.name = name;
    spk.userData = {
      isClickable: true,
      workstationItem: 'speakers',
      label: '🔊 Studio Monitor Speakers: Click to toggle Lo-Fi coding beats',
    };
    deskTopGroup.add(spk);
  });

  // -------------------------------------------------------------
  // 9. HAVIT H630BT WIRELESS OVER-EAR HEADPHONES (CREAM) & SLIM MINIMALIST STAND
  // -------------------------------------------------------------
  // 9. HAVIT H630BT WIRELESS OVER-EAR HEADPHONES (WARM IVORY CREAM) & SLIM MINIMALIST STAND
  // Fully integrated, gap-free continuous frame matching authentic reference image
  // -------------------------------------------------------------
  const hpStand = new THREE.Group();
  hpStand.position.set(1.78, 1.28, 0.05);
  // Scale up headphones and stand to be prominent, luxurious, and easy to inspect
  hpStand.scale.set(1.25, 1.25, 1.25);

  // Minimalist Matte Gunmetal / Dark Titanium Stand Materials
  const hpStandMetalMat = new THREE.MeshStandardMaterial({
    color: 0x222226,
    metalness: 0.90,
    roughness: 0.20,
  });
  const hpStandSiliconeMat = new THREE.MeshStandardMaterial({
    color: 0x1c1c1f,
    roughness: 0.92,
  });

  // 1. Ultra-Slim Chamfered CNC Base (17cm diameter, 1.0cm thin profile)
  const hpBase = new THREE.Mesh(
    new THREE.CylinderGeometry(0.082, 0.086, 0.010, 32),
    hpStandMetalMat
  );
  hpBase.castShadow = true;
  hpBase.receiveShadow = true;
  hpStand.add(hpBase);

  // Subtle circular valet groove for AirPods / ring
  const hpBaseGroove = new THREE.Mesh(
    new THREE.CylinderGeometry(0.048, 0.050, 0.002, 24),
    new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.85 })
  );
  hpBaseGroove.position.set(0, 0.006, 0);
  hpStand.add(hpBaseGroove);

  // Non-slip bottom rubber pad
  const hpBasePad = new THREE.Mesh(
    new THREE.CylinderGeometry(0.080, 0.080, 0.003, 24),
    hpStandSiliconeMat
  );
  hpBasePad.position.set(0, -0.006, 0);
  hpStand.add(hpBasePad);

  // 2. Slender Matte Black Metal Pillar (offset slightly back so headphones hang perfectly centered)
  const hpPillar = new THREE.Mesh(
    new THREE.CylinderGeometry(0.0065, 0.0065, 0.485, 16),
    hpStandMetalMat
  );
  hpPillar.position.set(0, 0.242, -0.010);
  hpPillar.castShadow = true;
  hpStand.add(hpPillar);

  // 3. Ultra-Slim Curved Headband Rest (Follows inner contour of headband - completely hidden underneath)
  const hangerArcPoints: THREE.Vector3[] = [];
  for (let i = 0; i <= 16; i++) {
    const angle = Math.PI * 0.72 - (i / 16) * (Math.PI * 0.44);
    const x = Math.cos(angle) * 0.070;
    const y = 0.415 + Math.sin(angle) * 0.068;
    hangerArcPoints.push(new THREE.Vector3(x, y, -0.002));
  }
  const hangerArcCurve = new THREE.CatmullRomCurve3(hangerArcPoints);
  const hangerMesh = new THREE.Mesh(
    new THREE.TubeGeometry(hangerArcCurve, 16, 0.004, 12, false),
    hpStandMetalMat
  );
  hangerMesh.castShadow = true;
  hpStand.add(hangerMesh);

  // -------------------------------------------------------------
  // 4. HAVIT H630BT OVER-EAR HEADPHONES (CREAM), HANGING ON THE STAND
  // The headband rests on the stand's curved hanger; both cups hang straight
  // down with the cushions facing each other, held by a yoke on each side.
  // -------------------------------------------------------------
  const hpGroup = new THREE.Group();
  hpGroup.rotation.y = 0.18; // slight turn so both cups read from the default camera

  const hpShellMat = new THREE.MeshStandardMaterial({ color: 0xf2ece1, roughness: 0.42, metalness: 0.02 });
  const hpPadMat = new THREE.MeshStandardMaterial({ color: 0xd9cbb4, roughness: 0.82, metalness: 0.0 });
  const hpFabricMat = new THREE.MeshStandardMaterial({ color: 0x4a433c, roughness: 0.95, metalness: 0.0 });
  const hpSliderMat = new THREE.MeshStandardMaterial({ color: 0xc9c9ce, roughness: 0.3, metalness: 0.9 });
  const hpAccentMat = new THREE.MeshStandardMaterial({ color: 0xbda078, roughness: 0.25, metalness: 0.9 });

  // Shared dimensions (stand-local units)
  const HP_CUP_X = 0.078; // cup centre, left/right of the pillar
  const HP_CUP_Y = 0.33; // cup centre height
  const HP_BAND_END_Y = 0.40; // where the headband meets the sliders
  const HP_BAND_APEX_Y = 0.497; // headband centre-line apex (rests on the hanger)
  const HP_CUP_RY = 0.040; // cup half-height
  const HP_CUP_RZ = 0.032; // cup half-depth

  const ellipseArc = (a: number, b: number, cy: number, from: number, to: number, steps: number) => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= steps; i++) {
      const t = from + (to - from) * (i / steps);
      pts.push(new THREE.Vector3(Math.cos(t) * a, cy + Math.sin(t) * b, 0));
    }
    return new THREE.CatmullRomCurve3(pts);
  };

  // A. Headband: a flattened tube (wider front-to-back than it is thick)
  const bandMesh = new THREE.Mesh(
    new THREE.TubeGeometry(ellipseArc(HP_CUP_X, HP_BAND_APEX_Y - HP_BAND_END_Y, HP_BAND_END_Y, 0, Math.PI, 48), 48, 0.0065, 12, false),
    hpShellMat
  );
  bandMesh.scale.z = 2.2;
  bandMesh.castShadow = true;
  hpGroup.add(bandMesh);

  // Soft cushion under the top of the headband (this is what touches the hanger)
  const bandCushion = new THREE.Mesh(
    new THREE.TubeGeometry(
      ellipseArc(HP_CUP_X - 0.007, HP_BAND_APEX_Y - HP_BAND_END_Y - 0.010, HP_BAND_END_Y, Math.PI * 0.2, Math.PI * 0.8, 32),
      32,
      0.005,
      10,
      false
    ),
    hpPadMat
  );
  bandCushion.scale.z = 1.8;
  hpGroup.add(bandCushion);

  // B. Sliders, yokes and cups
  [-1, 1].forEach((sideSign) => {
    const side = new THREE.Group();
    side.position.set(sideSign * HP_CUP_X, HP_CUP_Y, 0);

    // Collar where the band ends, then a short brushed-metal slider
    const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.0072, 0.0072, 0.010, 16), hpShellMat);
    collar.scale.z = 1.6;
    collar.position.y = HP_BAND_END_Y - HP_CUP_Y - 0.003;
    side.add(collar);

    const sliderTop = HP_BAND_END_Y - HP_CUP_Y - 0.008;
    const sliderBottom = HP_CUP_RY + 0.006;
    const slider = new THREE.Mesh(
      new THREE.CylinderGeometry(0.0032, 0.0032, sliderTop - sliderBottom, 12),
      hpSliderMat
    );
    slider.position.y = (sliderTop + sliderBottom) / 2;
    side.add(slider);

    // Yoke: half-ellipse fork around the top of the cup, pivoting on its front and back
    const yokeGeo = new THREE.TorusGeometry(1, 0.09, 10, 40, Math.PI);
    yokeGeo.rotateY(Math.PI / 2);
    yokeGeo.scale(0.039, HP_CUP_RY + 0.006, HP_CUP_RZ + 0.008);
    const yoke = new THREE.Mesh(yokeGeo, hpShellMat);
    yoke.castShadow = true;
    side.add(yoke);

    [-1, 1].forEach((zSign) => {
      const pivot = new THREE.Mesh(new THREE.CylinderGeometry(0.0045, 0.0045, 0.010, 14), hpShellMat);
      pivot.rotation.x = Math.PI / 2;
      pivot.position.set(0, 0, zSign * (HP_CUP_RZ + 0.004));
      side.add(pivot);
    });

    // Cup shell: an oval puck with a rounded outer dome
    const shellGeo = new THREE.CylinderGeometry(1, 1, 0.020, 48);
    shellGeo.rotateZ(Math.PI / 2);
    shellGeo.scale(1, HP_CUP_RY, HP_CUP_RZ);
    const shell = new THREE.Mesh(shellGeo, hpShellMat);
    shell.castShadow = true;
    side.add(shell);

    const domeGeo = new THREE.SphereGeometry(1, 40, 20);
    domeGeo.scale(0.008, HP_CUP_RY, HP_CUP_RZ);
    const dome = new THREE.Mesh(domeGeo, hpShellMat);
    dome.position.x = sideSign * 0.010;
    side.add(dome);

    // Thin champagne accent ring on the outer face
    const accentGeo = new THREE.TorusGeometry(1, 0.06, 8, 48);
    accentGeo.rotateY(Math.PI / 2);
    accentGeo.scale(0.03, HP_CUP_RY * 0.75, HP_CUP_RZ * 0.75);
    const accent = new THREE.Mesh(accentGeo, hpAccentMat);
    accent.position.x = sideSign * 0.0153;
    side.add(accent);

    // Ear cushion: a plush oval ring on the inner face
    const padGeo = new THREE.TorusGeometry(1, 0.32, 18, 48);
    padGeo.rotateY(Math.PI / 2);
    padGeo.scale(0.028, HP_CUP_RY / 1.32, HP_CUP_RZ / 1.32);
    const pad = new THREE.Mesh(padGeo, hpPadMat);
    pad.position.x = -sideSign * 0.019;
    pad.castShadow = true;
    side.add(pad);

    // Dark speaker fabric inside the cushion
    const fabricGeo = new THREE.CircleGeometry(1, 40);
    fabricGeo.rotateY(sideSign > 0 ? -Math.PI / 2 : Math.PI / 2);
    fabricGeo.scale(1, HP_CUP_RY * 0.55, HP_CUP_RZ * 0.55);
    const fabric = new THREE.Mesh(fabricGeo, hpFabricMat);
    fabric.position.x = -sideSign * 0.0105;
    side.add(fabric);

    hpGroup.add(side);
  });

  hpStand.add(hpGroup);

  hpStand.name = 'headphones-group';
  hpStand.userData = {
    isClickable: true,
    workstationItem: 'headphones',
    label: '🎧 Havit H630BT Wireless Headphones (Cream): Click to inspect',
  };
  hpStand.traverse((child) => {
    child.userData = {
      isClickable: true,
      workstationItem: 'headphones',
      label: '🎧 Havit H630BT Wireless Headphones (Cream): Click to inspect',
    };
  });
  deskTopGroup.add(hpStand);

  // -------------------------------------------------------------
  // -------------------------------------------------------------
  // 10. COFFEE MUG & STEAM PARTICLES (Interactive - Handle Outward & Away from Keyboard)
  // -------------------------------------------------------------
  const coffeeGroup = new THREE.Group();
  // Moved further to the left (away from keyboard at x=0)
  coffeeGroup.position.set(-0.96, 1.29, 0.32);
  // Rotated 160° so the handle points outward to the left, away from the keyboard
  coffeeGroup.rotation.y = Math.PI * 0.9;

  // Natural Cork / Walnut Coaster Base
  const coasterMat = new THREE.MeshStandardMaterial({
    color: 0x854d0e,
    roughness: 0.85,
    metalness: 0.05,
  });
  const mugCoaster = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.012, 24), coasterMat);
  mugCoaster.position.set(0, 0.006, 0);
  mugCoaster.castShadow = true;
  coffeeGroup.add(mugCoaster);

  // Ceramic Mug Body (Deep Ruby Red Ceramic with soft gloss)
  const mugMat = new THREE.MeshStandardMaterial({
    color: 0xbe123c,
    roughness: 0.18,
    metalness: 0.08,
  });
  const mugBody = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.076, 0.17, 24), mugMat);
  mugBody.position.set(0, 0.096, 0);
  mugBody.castShadow = true;
  coffeeGroup.add(mugBody);

  // White Ceramic Inner Rim Liner
  const innerRim = new THREE.Mesh(
    new THREE.CylinderGeometry(0.078, 0.078, 0.02, 20),
    new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.2 })
  );
  innerRim.position.set(0, 0.172, 0);
  coffeeGroup.add(innerRim);

  // Rich Espresso / Americano Liquid Surface with Crema Foam
  const coffeeLiquid = new THREE.Mesh(
    new THREE.CylinderGeometry(0.076, 0.076, 0.008, 20),
    new THREE.MeshStandardMaterial({ color: 0x3b1d11, roughness: 0.2, metalness: 0.1 })
  );
  coffeeLiquid.position.set(0, 0.168, 0);
  coffeeGroup.add(coffeeLiquid);

  // Smooth Ergonomic Ceramic Handle pointing outward
  const handleCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.075, 0.155, 0),
    new THREE.Vector3(0.152, 0.140, 0),
    new THREE.Vector3(0.162, 0.095, 0),
    new THREE.Vector3(0.148, 0.050, 0),
    new THREE.Vector3(0.072, 0.035, 0),
  ]);
  const mugHandleGeo = new THREE.TubeGeometry(handleCurve, 24, 0.015, 12, false);
  const mugHandle = new THREE.Mesh(mugHandleGeo, mugMat);
  mugHandle.castShadow = true;
  coffeeGroup.add(mugHandle);

  // Rising steam puffs (animated in tick)
  const steamGroup = new THREE.Group();
  const steamParticles: THREE.Mesh[] = [];
  const steamMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.35,
    roughness: 0.9,
  });

  for (let i = 0; i < 5; i++) {
    const puff = new THREE.Mesh(new THREE.SphereGeometry(0.022 + i * 0.005, 8, 8), steamMat);
    puff.position.set((Math.random() - 0.5) * 0.03, 0.2 + i * 0.065, (Math.random() - 0.5) * 0.03);
    steamGroup.add(puff);
    steamParticles.push(puff);
  }
  coffeeGroup.add(steamGroup);

  coffeeGroup.name = 'coffee-mug';
  coffeeGroup.userData = {
    isClickable: true,
    workstationItem: 'coffee',
    label: '☕ Fresh Hot Espresso: Click to sip (+100 Energy)',
  };
  deskTopGroup.add(coffeeGroup);

  // -------------------------------------------------------------
  // 11. RUBBER DUCK DEBUGGER (Interactive)
  // -------------------------------------------------------------
  const duckGroup = new THREE.Group();
  duckGroup.position.set(0.7, 1.29, -0.22);

  const duckYellowMat = new THREE.MeshStandardMaterial({
    color: 0xfacc15,
    roughness: 0.4,
    flatShading: true,
  });

  // Body
  const duckBody = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 8), duckYellowMat);
  duckBody.scale.set(1, 0.8, 1.3);
  duckBody.position.set(0, 0.06, 0);
  duckGroup.add(duckBody);

  // Head
  const duckHead = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), duckYellowMat);
  duckHead.position.set(0, 0.14, 0.05);
  duckGroup.add(duckHead);

  // Beak
  const duckBeak = new THREE.Mesh(
    new THREE.ConeGeometry(0.03, 0.05, 6),
    new THREE.MeshStandardMaterial({ color: 0xf97316 })
  );
  duckBeak.rotation.x = Math.PI / 2;
  duckBeak.position.set(0, 0.13, 0.1);
  duckGroup.add(duckBeak);

  duckGroup.name = 'rubber-duck';
  duckGroup.userData = {
    isClickable: true,
    workstationItem: 'rubber-duck',
    label: '🦆 Rubber Duck Debugger: Click for coding advice',
  };
  deskTopGroup.add(duckGroup);

  // -------------------------------------------------------------
  // 12. SUCCULENT PLANT IN GEOMETRIC POT
  // -------------------------------------------------------------
  const plantGroup = new THREE.Group();
  plantGroup.position.set(-0.84, 1.29, -0.46);

  // Geometric faceted pot
  const potMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.06, 0.12, 6),
    new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.3, flatShading: true })
  );
  potMesh.position.set(0, 0.06, 0);
  plantGroup.add(potMesh);

  // Succulent green leaves
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x10b981, roughness: 0.4, flatShading: true });
  for (let i = 0; i < 6; i++) {
    const ang = (i / 6) * Math.PI * 2;
    const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.09, 4), leafMat);
    leaf.position.set(Math.cos(ang) * 0.04, 0.13, Math.sin(ang) * 0.04);
    leaf.rotation.x = Math.sin(ang) * 0.4;
    leaf.rotation.z = -Math.cos(ang) * 0.4;
    plantGroup.add(leaf);
  }
  const centerLeaf = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.08, 4), leafMat);
  centerLeaf.position.set(0, 0.16, 0);
  plantGroup.add(centerLeaf);

  plantGroup.name = 'succulent-plant';
  plantGroup.userData = {
    isClickable: true,
    workstationItem: 'plant',
    label: '🪴 Desk Succulent Plant: Purifying workspace air',
  };
  deskTopGroup.add(plantGroup);

  // -------------------------------------------------------------
  // 13. CUSTOM MINI-ITX PC TOWER (Placed Under Desk with RGB Fans)
  // -------------------------------------------------------------
  // Aluminum floor stand / riser under desk
  const pcStand = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.04, 0.64), darkMetalMat);
  pcStand.position.set(1.42, 0.02, 0.05);
  pcStand.castShadow = true;
  pcStand.receiveShadow = true;
  workstation.add(pcStand);

  // Anti-vibration rubber feet on PC stand
  [-0.15, 0.15].forEach((fx) => {
    [-0.26, 0.26].forEach((fz) => {
      const foot = new THREE.Mesh(
        new THREE.CylinderGeometry(0.02, 0.02, 0.015, 8),
        new THREE.MeshStandardMaterial({ color: 0x020617 })
      );
      foot.position.set(1.42 + fx, 0.007, 0.05 + fz);
      workstation.add(foot);
    });
  });

  const pcGroup = new THREE.Group();
  pcGroup.position.set(1.42, 0.39, 0.05); // Under desk, safe clearance below tabletop underside (1.08)

  // Chassis
  const chassisMat = new THREE.MeshStandardMaterial({ color: 0x090d16, roughness: 0.3 });
  const chassis = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.7, 0.6), chassisMat);
  chassis.castShadow = true;
  pcGroup.add(chassis);

  // Tempered glass panel facing inward towards center/user
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0x1e293b,
    roughness: 0.1,
    transmission: 0.6,
    thickness: 0.5,
  });
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(0.56, 0.66), glassMat);
  glass.position.set(-0.171, 0, 0);
  glass.rotation.y = -Math.PI / 2;
  pcGroup.add(glass);

  // Spinning RGB Fans inside PC
  const fanGroup = new THREE.Group();
  fanGroup.position.set(-0.12, 0, 0);
  const fanColors = [0x38bdf8, 0xa855f7, 0x10b981, 0xf43f5e, 0xfbbf24];

  const fanMat = new THREE.MeshStandardMaterial({
    color: fanColors[0],
    emissive: fanColors[0],
    emissiveIntensity: 0.8,
  });

  const fanBlades: THREE.Mesh[] = [];
  [-0.16, 0.16].forEach((fy) => {
    const fanRing = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.015, 6, 16), fanMat);
    fanRing.position.set(0, fy, 0.18);
    fanRing.rotation.y = Math.PI / 2;
    fanGroup.add(fanRing);

    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.16, 0.04), fanMat);
    blade.position.set(0, fy, 0.18);
    fanGroup.add(blade);
    fanBlades.push(blade);
  });
  pcGroup.add(fanGroup);

  pcGroup.name = 'pc-tower';
  pcGroup.userData = {
    isClickable: true,
    workstationItem: 'pc-tower',
    label: '🖥️ High-End PC Workstation: Click to cycle cooling fan RGB',
  };
  workstation.add(pcGroup);

  // -------------------------------------------------------------
  // 14A. 8-CUBBY WHITE CABINET WITH SHOEBOX STACKS (Left Side of Room)
  // Reconstructed exactly from user's photo: 8 cubbies below + shoebox stacks on top
  // -------------------------------------------------------------
  const sneakerShelfGroup = createSneakerCabinet();
  workstation.add(sneakerShelfGroup);


  // -------------------------------------------------------------
  // 14B. TECH BOOKSHELF & AWARDS (Right Side of Room)
  // Scaled & Elevated to Match the Sneaker Cabinet's Grandeur & Height
  // -------------------------------------------------------------
  const bookshelfGroup = new THREE.Group();
  bookshelfGroup.position.set(3.40, 0, -0.05);
  // Scale up the bookshelf so it is substantially bigger, taller, and symmetrically balanced with the sneaker cabinet
  bookshelfGroup.scale.set(1.60, 1.55, 1.45);

  const steelRackMat = new THREE.MeshStandardMaterial({
    color: 0x111827,
    metalness: 0.9,
    roughness: 0.28,
  });

  // 5 Shelving Tiers for majestic height
  const shelfYPositions = [0.32, 0.85, 1.38, 1.92, 2.46];

  // 4 Upright Walnut & Dark Metal Posts (Height 2.80m, Width 1.36m, Depth 0.54m)
  [
    [-0.66, -0.24],
    [0.66, -0.24],
    [-0.66, 0.24],
    [0.66, 0.24],
  ].forEach(([px, pz]) => {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.05, 2.80, 0.05), steelRackMat);
    post.position.set(px, 1.40, pz);
    post.castShadow = true;
    bookshelfGroup.add(post);

    // Decorative chrome foot cap at base
    const footCap = new THREE.Mesh(
      new THREE.CylinderGeometry(0.035, 0.035, 0.02, 12),
      new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.95, roughness: 0.15 })
    );
    footCap.position.set(px, 0.01, pz);
    bookshelfGroup.add(footCap);
  });

  // 5 Walnut Wood Shelves with Warm Under-Glow LED Strips
  const walnutShelfMat = new THREE.MeshStandardMaterial({
    color: 0x3a2818,
    roughness: 0.55,
    metalness: 0.1,
  });

  const ledStripMat = new THREE.MeshStandardMaterial({
    color: 0xfef08a,
    emissive: 0xfef08a,
    emissiveIntensity: 0.65,
    roughness: 0.2,
  });

  shelfYPositions.forEach((sy) => {
    const shelfPlate = new THREE.Mesh(new THREE.BoxGeometry(1.36, 0.05, 0.54), walnutShelfMat);
    shelfPlate.position.set(0, sy, 0);
    shelfPlate.castShadow = true;
    shelfPlate.receiveShadow = true;
    bookshelfGroup.add(shelfPlate);

    // Subtle warm LED accent bar recessed beneath each shelf
    const ledBar = new THREE.Mesh(new THREE.BoxGeometry(1.28, 0.008, 0.02), ledStripMat);
    ledBar.position.set(0, sy - 0.027, 0.22);
    bookshelfGroup.add(ledBar);
  });

  // TIER 1 (y = 0.32): Heavy Tech & Programming Masterclass Books
  const techBooks = [
    { name: 'JavaScript Deep Dive', color: 0xf59e0b, w: 0.07, h: 0.32 },
    { name: 'TypeScript Design Patterns', color: 0x3b82f6, w: 0.08, h: 0.34 },
    { name: 'Designing Data-Intensive Apps', color: 0xdc2626, w: 0.11, h: 0.36 },
    { name: 'Three.js & WebGL 3D Journey', color: 0x10b981, w: 0.09, h: 0.35 },
    { name: 'Clean Architecture & Code', color: 0x8b5cf6, w: 0.08, h: 0.33 },
    { name: 'Full-Stack React & Node', color: 0x06b6d4, w: 0.09, h: 0.32 },
    { name: 'AI & Machine Learning Eng', color: 0xec4899, w: 0.08, h: 0.34 },
    { name: 'Cloud Native & Kubernetes', color: 0x0284c7, w: 0.08, h: 0.33 },
    { name: 'Systems Programming in Rust', color: 0xb45309, w: 0.07, h: 0.31 },
  ];

  // Left Bookend (Matte Black Steel L-bracket)
  const leftBookend = new THREE.Mesh(
    new THREE.BoxGeometry(0.015, 0.28, 0.28),
    steelRackMat
  );
  leftBookend.position.set(-0.58, 0.345 + 0.14, 0);
  bookshelfGroup.add(leftBookend);

  let bx = -0.56;
  techBooks.forEach((b) => {
    const bookMesh = new THREE.Mesh(
      new THREE.BoxGeometry(b.w, b.h, 0.32),
      new THREE.MeshStandardMaterial({ color: b.color, roughness: 0.5 })
    );
    bookMesh.position.set(bx + b.w / 2, 0.345 + b.h / 2, 0);
    bookMesh.castShadow = true;
    bookshelfGroup.add(bookMesh);

    // Gold embossed spine stripe
    const spineStripe = new THREE.Mesh(
      new THREE.BoxGeometry(b.w * 0.7, 0.02, 0.005),
      new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.8, roughness: 0.2 })
    );
    spineStripe.position.set(bx + b.w / 2, 0.345 + b.h * 0.75, 0.162);
    bookshelfGroup.add(spineStripe);

    bx += b.w + 0.015;
  });

  // Right Bookend
  const rightBookend = new THREE.Mesh(
    new THREE.BoxGeometry(0.015, 0.28, 0.28),
    steelRackMat
  );
  rightBookend.position.set(bx + 0.01, 0.345 + 0.14, 0);
  bookshelfGroup.add(rightBookend);

  // TIER 2 (y = 0.85): WebGL 3D Star Trophy & Framed Certification Plaque
  // 1. Gold cup trophy on a dark marble block.
  // The scene has no environment map, so the gold uses moderate metalness plus a warm
  // emissive floor; a near-1.0 metalness renders almost black with coloured streaks.
  const TROPHY_X = -0.35;
  const TROPHY_BASE_TOP = 0.99;
  const trophyGoldMat = new THREE.MeshStandardMaterial({
    color: 0xe0b445,
    metalness: 0.55,
    roughness: 0.28,
    emissive: 0x6b4a0a,
    emissiveIntensity: 0.35,
    side: THREE.DoubleSide, // the open cup shows its inside
  });

  const marbleBase = new THREE.Mesh(
    new THREE.BoxGeometry(0.24, 0.12, 0.24),
    new THREE.MeshStandardMaterial({ color: 0x1b2433, roughness: 0.35, metalness: 0.15 })
  );
  marbleBase.position.set(TROPHY_X, TROPHY_BASE_TOP - 0.06, 0);
  marbleBase.castShadow = true;
  bookshelfGroup.add(marbleBase);

  // small engraved plate on the front of the block
  const trophyPlate = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.045, 0.006), trophyGoldMat);
  trophyPlate.position.set(TROPHY_X, TROPHY_BASE_TOP - 0.06, 0.122);
  bookshelfGroup.add(trophyPlate);

  // foot + stem + bowl as one lathe profile (radius, height above the block)
  const trophyProfile = [
    [0.0, 0.0], [0.06, 0.0], [0.06, 0.012], [0.045, 0.02], [0.02, 0.035],
    [0.014, 0.07], [0.02, 0.09], [0.032, 0.1], [0.07, 0.12], [0.092, 0.165],
    [0.1, 0.215], [0.104, 0.222], [0.096, 0.222], [0.09, 0.17], [0.065, 0.13], [0.0, 0.118],
  ].map(([r, y]) => new THREE.Vector2(r, y));
  const trophyCup = new THREE.Mesh(new THREE.LatheGeometry(trophyProfile, 32), trophyGoldMat);
  trophyCup.position.set(TROPHY_X, TROPHY_BASE_TOP, 0);
  trophyCup.castShadow = true;
  bookshelfGroup.add(trophyCup);

  // two C-shaped handles on the sides of the bowl
  [-1, 1].forEach((side) => {
    const handle = new THREE.Mesh(new THREE.TorusGeometry(0.036, 0.007, 8, 20, Math.PI), trophyGoldMat);
    handle.rotation.z = side > 0 ? -Math.PI / 2 : Math.PI / 2;
    handle.position.set(TROPHY_X + side * 0.092, TROPHY_BASE_TOP + 0.17, 0);
    bookshelfGroup.add(handle);
  });

  // 2. Framed Developer Certification Plaque
  const frameMesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.38, 0.28, 0.03),
    new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8, roughness: 0.3 })
  );
  frameMesh.position.set(0.28, 1.05, -0.05);
  bookshelfGroup.add(frameMesh);

  const certPaper = new THREE.Mesh(
    new THREE.PlaneGeometry(0.34, 0.24),
    new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.6 })
  );
  certPaper.position.set(0.28, 1.05, -0.032);
  bookshelfGroup.add(certPaper);

  // Decorative Figurine / Tech Cube next to frame
  const techCube = new THREE.Mesh(
    new THREE.DodecahedronGeometry(0.075),
    new THREE.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.85, roughness: 0.2, emissive: 0x0284c7, emissiveIntensity: 0.3 })
  );
  techCube.position.set(-0.02, 0.95, 0.05);
  techCube.rotation.set(0.3, 0.5, 0.2);
  bookshelfGroup.add(techCube);

  // TIER 3 (y = 1.38): Vintage Collector Camera & Succulent Pot & Design Books
  const cameraBody = new THREE.Mesh(
    new THREE.BoxGeometry(0.24, 0.14, 0.12),
    new THREE.MeshStandardMaterial({ color: 0x1f2937, metalness: 0.7, roughness: 0.4 })
  );
  cameraBody.position.set(-0.35, 1.48, 0);
  bookshelfGroup.add(cameraBody);

  const camLensGlass = new THREE.Mesh(
    new THREE.CylinderGeometry(0.06, 0.06, 0.08, 16),
    new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.9, roughness: 0.1 })
  );
  camLensGlass.rotation.x = Math.PI / 2;
  camLensGlass.position.set(-0.35, 1.48, 0.08);
  bookshelfGroup.add(camLensGlass);

  // Stack of 3 Design Hardcovers (Horizontal)
  const designBooks = [
    { color: 0x475569, h: 0.035, w: 0.22, d: 0.28 },
    { color: 0x0284c7, h: 0.032, w: 0.20, d: 0.26 },
    { color: 0xe2e8f0, h: 0.028, w: 0.18, d: 0.24 },
  ];
  let curStackY = 1.405;
  designBooks.forEach((db) => {
    const bookStackMesh = new THREE.Mesh(
      new THREE.BoxGeometry(db.w, db.h, db.d),
      new THREE.MeshStandardMaterial({ color: db.color, roughness: 0.45 })
    );
    bookStackMesh.position.set(0.02, curStackY + db.h / 2, 0);
    bookStackMesh.rotation.y = (Math.random() - 0.5) * 0.1;
    bookshelfGroup.add(bookStackMesh);
    curStackY += db.h;
  });

  // Succulent Planter
  const plantPot = new THREE.Mesh(
    new THREE.CylinderGeometry(0.09, 0.07, 0.14, 12),
    new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.8 })
  );
  plantPot.position.set(0.38, 1.48, 0);
  bookshelfGroup.add(plantPot);

  const plantLeaves = new THREE.Mesh(
    new THREE.DodecahedronGeometry(0.1),
    new THREE.MeshStandardMaterial({ color: 0x10b981, roughness: 0.6 })
  );
  plantLeaves.position.set(0.38, 1.60, 0);
  bookshelfGroup.add(plantLeaves);

  // TIER 4 (y = 1.92): Minimalist Storage Box & Audiophile Headphone on Stand
  const storageBox = new THREE.Mesh(
    new THREE.BoxGeometry(0.46, 0.24, 0.36),
    new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.7 })
  );
  storageBox.position.set(-0.35, 2.06, 0);
  bookshelfGroup.add(storageBox);

  // Storage box leather handle
  const handleMesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.12, 0.025, 0.015),
    new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.5 })
  );
  handleMesh.position.set(-0.35, 2.06, 0.185);
  bookshelfGroup.add(handleMesh);

  // Walnut Headphone Stand & Headset on Tier 4
  const hpStandBase = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.09, 0.02, 16),
    walnutShelfMat
  );
  hpStandBase.position.set(0.28, 1.95, 0);
  bookshelfGroup.add(hpStandBase);

  const hpStandPole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.012, 0.012, 0.24, 12),
    steelRackMat
  );
  hpStandPole.position.set(0.28, 2.07, 0);
  bookshelfGroup.add(hpStandPole);

  const hpStandTop = new THREE.Mesh(
    new THREE.BoxGeometry(0.10, 0.015, 0.04),
    walnutShelfMat
  );
  hpStandTop.position.set(0.28, 2.19, 0);
  bookshelfGroup.add(hpStandTop);

  // Studio Headset Earcups
  const shelfHpBand = new THREE.Mesh(
    new THREE.TorusGeometry(0.075, 0.012, 8, 16, Math.PI),
    new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.35 })
  );
  shelfHpBand.rotation.z = Math.PI;
  shelfHpBand.position.set(0.28, 2.18, 0);
  bookshelfGroup.add(shelfHpBand);

  // TIER 5 (TOP TIER, y = 2.46): Cascading Hanging Vine & Geometric Brass Sculpture
  // Cascading Plant with hanging vines
  const vinePot = new THREE.Mesh(
    new THREE.CylinderGeometry(0.10, 0.08, 0.14, 12),
    new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.7 })
  );
  vinePot.position.set(0.38, 2.55, 0.05);
  bookshelfGroup.add(vinePot);

  const vineLeaves = new THREE.Mesh(
    new THREE.SphereGeometry(0.14, 8, 8),
    new THREE.MeshStandardMaterial({ color: 0x059669, roughness: 0.7 })
  );
  vineLeaves.position.set(0.38, 2.65, 0.05);
  bookshelfGroup.add(vineLeaves);

  // Trailing vines: leave the pot, run over the shelf's front edge (z = 0.27)
  // and hang in front of it, so nothing passes through the shelf board.
  const vineStemMat = new THREE.MeshStandardMaterial({ color: 0x047857, roughness: 0.8 });
  const vineLeafMat = new THREE.MeshStandardMaterial({ color: 0x10b981, roughness: 0.65 });
  const vineLeafGeo = new THREE.SphereGeometry(0.02, 8, 6);
  vineLeafGeo.scale(1.25, 0.45, 0.9);
  const vinePaths: [number, number, number][][] = [
    [[0.45, 2.61, 0.12], [0.46, 2.53, 0.24], [0.465, 2.50, 0.295], [0.47, 2.40, 0.305], [0.465, 2.26, 0.30], [0.475, 2.12, 0.295]],
    [[0.31, 2.61, 0.13], [0.30, 2.53, 0.25], [0.295, 2.50, 0.295], [0.29, 2.42, 0.305], [0.30, 2.30, 0.30]],
    [[0.39, 2.62, 0.15], [0.385, 2.53, 0.26], [0.38, 2.49, 0.30], [0.385, 2.38, 0.305]],
  ];
  vinePaths.forEach((path, vineIdx) => {
    const curve = new THREE.CatmullRomCurve3(path.map(([x, y, z]) => new THREE.Vector3(x, y, z)));
    const stem = new THREE.Mesh(new THREE.TubeGeometry(curve, 24, 0.0045, 6, false), vineStemMat);
    bookshelfGroup.add(stem);

    const leafCount = 6 + vineIdx;
    for (let i = 1; i <= leafCount; i++) {
      const t = i / (leafCount + 0.5);
      const leaf = new THREE.Mesh(vineLeafGeo, vineLeafMat);
      leaf.position.copy(curve.getPointAt(t));
      const side = i % 2 === 0 ? 1 : -1;
      leaf.position.x += side * 0.014;
      leaf.rotation.set(0.6 + side * 0.2, i * 1.3, side * 0.5);
      leaf.scale.setScalar(1 - t * 0.35); // leaves get smaller towards the tip
      bookshelfGroup.add(leaf);
    }
  });

  // Minimalist Geometric Brass Polyhedron Sculpture on Top Tier
  const brassSculpture = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.12, 0),
    new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.95, roughness: 0.15 })
  );
  brassSculpture.position.set(-0.35, 2.60, 0);
  brassSculpture.rotation.set(0.4, 0.6, 0.2);
  bookshelfGroup.add(brassSculpture);

  // Warm LED downlight illuminating the bookshelf with museum-grade gallery warmth
  const shelfSpotLight = new THREE.PointLight(0xfef08a, 1.8, 5.0);
  shelfSpotLight.position.set(0, 2.85, 0.35);
  bookshelfGroup.add(shelfSpotLight);

  bookshelfGroup.name = 'bookshelf';
  bookshelfGroup.userData = {
    isClickable: true,
    workstationItem: 'bookshelf',
    label: '📚 Tủ Sách Công Nghệ & Giải Thưởng (Tech Bookshelf & Awards)',
  };
  workstation.add(bookshelfGroup);

  // -------------------------------------------------------------
  // 15. FLAGSHIP ERGONOMIC CHAIR (Herman Miller Aeron Style)
  // -------------------------------------------------------------
  // -------------------------------------------------------------
  // 15. AUTHENTIC GH-328 ERGONOMIC CHAIR (Ghế xoay Công Thái Học GH-328)
  // Featuring Bionic S-Spine, Adaptive Butterfly Double-Back, 3D Headrest & Waterfall Seat
  // -------------------------------------------------------------
  const chair = new THREE.Group();
  chair.position.set(0, 0, 1.84); // Shifted outward for ample clearance and spacious ergonomics
  chair.scale.set(1.18, 1.18, 1.18); // Scaled up proportionally for better presence and executive ergonomics

  // GH-328 Specialized Material Palette
  const gh328FrameMat = new THREE.MeshStandardMaterial({
    color: 0x111827, // Matte Obsidian Reinforced Nylon Frame
    roughness: 0.42,
    metalness: 0.28,
  });

  const gh328MeshMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b, // Charcoal Breathable Dragon Mesh
    roughness: 0.60,
    metalness: 0.15,
  });

  const gh328AccentMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8, // Electric Cyan Ergonomic Accent Line
    roughness: 0.35,
    metalness: 0.45,
    emissive: 0x0284c7,
    emissiveIntensity: 0.25,
  });

  const gh328PadMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a, // Soft-touch high-density PU foam
    roughness: 0.55,
    metalness: 0.10,
  });

  // 1. 5-star base: satin black nylon arms that sweep down to twin-wheel casters
  const spiderBase = new THREE.Group();
  chair.add(spiderBase);

  const baseNylonMat = new THREE.MeshStandardMaterial({ color: 0x17191e, roughness: 0.36, metalness: 0.15 });
  const casterWheelMat = new THREE.MeshStandardMaterial({ color: 0x24272d, roughness: 0.6, metalness: 0.05 });
  const casterHubMat = new THREE.MeshStandardMaterial({ color: 0x9aa1ab, roughness: 0.35, metalness: 0.7 });

  const ARM_ROOT_Z = 0.05;
  const ARM_TIP_Z = 0.50;
  const ARM_TIP_Y = 0.085;
  const armCenterY = (s: number) => 0.118 + 0.010 * Math.sin(s * Math.PI) - (0.118 - ARM_TIP_Y) * s * s;

  // Tapered arm with a smooth rounded-rectangle (superellipse) cross-section
  function createBaseArmGeo(): THREE.BufferGeometry {
    const rings = 24;
    const numPts = 20;
    const positions: number[] = [];
    const indices: number[] = [];

    for (let i = 0; i <= rings; i++) {
      const s = i / rings;
      const z = ARM_ROOT_Z + s * (ARM_TIP_Z - ARM_ROOT_Z);
      const yc = armCenterY(s);
      const halfW = 0.034 - 0.012 * s;
      const halfH = 0.028 - 0.010 * s;
      for (let j = 0; j < numPts; j++) {
        const t = (j / numPts) * Math.PI * 2;
        const c = Math.cos(t);
        const sn = Math.sin(t);
        // exponent 0.5 -> soft rounded rectangle
        const px = Math.sign(c) * Math.pow(Math.abs(c), 0.5) * halfW;
        const py = Math.sign(sn) * Math.pow(Math.abs(sn), 0.5) * halfH;
        positions.push(px, yc + py, z);
      }
    }

    for (let i = 0; i < rings; i++) {
      const r1 = i * numPts;
      const r2 = (i + 1) * numPts;
      for (let j = 0; j < numPts; j++) {
        const next = (j + 1) % numPts;
        indices.push(r1 + j, r1 + next, r2 + next);
        indices.push(r1 + j, r2 + next, r2 + j);
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    return geo;
  }

  // Central hub: a tapered drum that hides the arm roots, with a metal collar for the gas lift
  const chairBaseHub = new THREE.Mesh(new THREE.CylinderGeometry(0.072, 0.092, 0.080, 40), baseNylonMat);
  chairBaseHub.position.set(0, 0.118, 0);
  chairBaseHub.castShadow = true;
  spiderBase.add(chairBaseHub);

  const hubTopRing = new THREE.Mesh(new THREE.CylinderGeometry(0.058, 0.064, 0.012, 40), casterHubMat);
  hubTopRing.position.set(0, 0.163, 0);
  spiderBase.add(hubTopRing);

  const armGeo = createBaseArmGeo();
  const tipBossGeo = new THREE.CylinderGeometry(0.024, 0.026, 0.040, 28);
  const casterStemGeo = new THREE.CylinderGeometry(0.0065, 0.0065, 0.020, 12);
  const hoodGeo = new THREE.CylinderGeometry(0.031, 0.031, 0.020, 28, 1, false, 0, Math.PI);
  hoodGeo.rotateZ(Math.PI / 2); // axis along X, covering the top half of the wheels
  const casterWheelGeo = new THREE.CylinderGeometry(0.027, 0.027, 0.014, 28);
  casterWheelGeo.rotateZ(Math.PI / 2);
  const casterCapGeo = new THREE.CylinderGeometry(0.011, 0.011, 0.015, 18);
  casterCapGeo.rotateZ(Math.PI / 2);

  const CASTER_WHEEL_R = 0.027;
  const CASTER_Z = ARM_TIP_Z + 0.014; // wheels trail slightly behind the swivel stem

  for (let i = 0; i < 5; i++) {
    const legArm = new THREE.Group();
    legArm.rotation.y = (i / 5) * Math.PI * 2;

    const armMesh = new THREE.Mesh(armGeo, baseNylonMat);
    armMesh.castShadow = true;
    armMesh.receiveShadow = true;
    legArm.add(armMesh);

    // Rounded boss at the tip that houses the caster stem
    const tipBoss = new THREE.Mesh(tipBossGeo, baseNylonMat);
    tipBoss.position.set(0, ARM_TIP_Y, ARM_TIP_Z);
    tipBoss.castShadow = true;
    legArm.add(tipBoss);

    const casterStem = new THREE.Mesh(casterStemGeo, casterHubMat);
    casterStem.position.set(0, ARM_TIP_Y - 0.026, ARM_TIP_Z);
    legArm.add(casterStem);

    // Twin-wheel caster: a hood in the middle with a wheel on each side
    const hood = new THREE.Mesh(hoodGeo, baseNylonMat);
    hood.position.set(0, CASTER_WHEEL_R, CASTER_Z);
    hood.castShadow = true;
    legArm.add(hood);

    [-1, 1].forEach((sideSign) => {
      const wheel = new THREE.Mesh(casterWheelGeo, casterWheelMat);
      wheel.position.set(sideSign * 0.018, CASTER_WHEEL_R, CASTER_Z);
      wheel.castShadow = true;
      legArm.add(wheel);

      const cap = new THREE.Mesh(casterCapGeo, casterHubMat);
      cap.position.set(sideSign * 0.0185, CASTER_WHEEL_R, CASTER_Z);
      legArm.add(cap);
    });

    spiderBase.add(legArm);
  }

  // Heavy-duty Class 4 explosion-proof gas lift cylinder
  const pistonColumn = new THREE.Mesh(new THREE.CylinderGeometry(0.050, 0.054, 0.26, 20), darkMetalMat);
  pistonColumn.position.set(0, 0.24, 0);
  chair.add(pistonColumn);

  const chromePiston = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.036, 0.32, 24), aluminumMat);
  chromePiston.position.set(0, 0.44, 0);
  chair.add(chromePiston);

  // 2. Interactive Swivel Upper Group (seat, double backrest, lumbar, 3D headrest, 3D armrests)
  const chairUpperGroup = new THREE.Group();
  chairUpperGroup.position.set(0, 0.58, 0);
  // Scale up chair body, seat and backrest by 20% while keeping spider base solid and grounded
  chairUpperGroup.scale.set(1.20, 1.20, 1.20);

  // Synchronized Multi-lock Butterfly Control Chassis
  const tiltChassisMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    metalness: 0.85,
    roughness: 0.25,
  });
  const tiltBox = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.09, 0.34), tiltChassisMat);
  tiltBox.position.set(0, 0, 0);
  chairUpperGroup.add(tiltBox);

  // Ergonomic rotary tilt tension knob & height lever paddles
  const tensionKnob = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.036, 0.06, 16), aluminumMat);
  tensionKnob.rotation.z = Math.PI / 2;
  tensionKnob.position.set(0.19, -0.02, 0.04);
  chairUpperGroup.add(tensionKnob);

  const tiltLever = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.016, 0.14), aluminumMat);
  tiltLever.position.set(-0.20, -0.02, 0.06);
  tiltLever.rotation.y = 0.38;
  chairUpperGroup.add(tiltLever);

  // 3. Ergonomic Waterfall Mesh Seat Pan (Mâm ghế đệm thác nước cong dốc mềm mại GH-328)
  const seatGroup = new THREE.Group();
  seatGroup.position.set(0, 0.065, -0.04);

  // Smooth contoured seat perimeter frame
  const seatBorder = new THREE.Mesh(new THREE.BoxGeometry(0.70, 0.055, 0.65), gh328FrameMat);
  seatBorder.position.set(0, 0, 0);
  seatBorder.castShadow = true;
  seatGroup.add(seatBorder);

  // High-tension breathable Dragon Mesh seat cushion
  const seatMesh = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.038, 0.57), gh328MeshMat);
  seatMesh.position.set(0, 0.014, 0);
  seatGroup.add(seatMesh);

  // Smooth Waterfall Curved Front Lip (Mép ghế dốc hình thác nước chống tê bì đùi)
  const waterfallLip = new THREE.Mesh(
    new THREE.CylinderGeometry(0.036, 0.036, 0.62, 24),
    gh328MeshMat
  );
  waterfallLip.rotation.z = Math.PI / 2;
  waterfallLip.position.set(0, 0.002, -0.32);
  seatGroup.add(waterfallLip);

  // Lateral contour thigh supports (hai bên mâm ghế ôm nhẹ đùi)
  [-0.30, 0.30].forEach((sx) => {
    const thighSupport = new THREE.Mesh(
      new THREE.CylinderGeometry(0.022, 0.022, 0.58, 16),
      gh328FrameMat
    );
    thighSupport.rotation.x = Math.PI / 2;
    thighSupport.position.set(sx, 0.02, 0);
    seatGroup.add(thighSupport);
  });

  chairUpperGroup.add(seatGroup);

  // 4. BIONIC S-SPINE STRUCTURAL BACKBONE (Cột sống chữ S liền khối kiên cố từ gầm ghế đến tựa đầu)
  const spineGroup = new THREE.Group();
  chairUpperGroup.add(spineGroup);

  // Lower spine bridge connecting from underseat chassis
  const lowerSpineBridge = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, 0.045, 0.22),
    aluminumMat
  );
  lowerSpineBridge.position.set(0, 0.02, 0.16);
  spineGroup.add(lowerSpineBridge);

  // Main vertical arching S-spine alloy pillar
  const spinePillar = new THREE.Mesh(
    new THREE.CylinderGeometry(0.028, 0.036, 0.86, 16),
    aluminumMat
  );
  spinePillar.position.set(0, 0.46, 0.26);
  spinePillar.rotation.x = -0.06;
  spineGroup.add(spinePillar);

  // Heavy-duty nylon protective vertebrae cage
  const spineCage = new THREE.Mesh(
    new THREE.BoxGeometry(0.10, 0.82, 0.055),
    gh328FrameMat
  );
  spineCage.position.set(0, 0.46, 0.28);
  spineCage.rotation.x = -0.06;
  spineGroup.add(spineCage);

  // 5. GH-328 ADAPTIVE BUTTERFLY DOUBLE-BACK SYSTEM (Hệ thống lưng đôi cánh bướm GH-328)
  // A. Lower Adaptive Butterfly Lumbar Wings (Đệm thắt lưng cánh bướm tự thích ứng L1-L5)
  const lumbarGroup = new THREE.Group();
  lumbarGroup.position.set(0, 0.30, 0.23);
  lumbarGroup.rotation.x = -0.06;

  // Central lumbar bridge mounting bracket
  const lumbarHub = new THREE.Mesh(
    new THREE.CylinderGeometry(0.036, 0.036, 0.14, 16),
    aluminumMat
  );
  lumbarHub.rotation.z = Math.PI / 2;
  lumbarGroup.add(lumbarHub);

  // Left and right butterfly lumbar wing plates
  [-1, 1].forEach((side) => {
    const wingGroup = new THREE.Group();
    wingGroup.position.set(side * 0.15, 0, -0.01);
    wingGroup.rotation.y = -side * 0.22; // 12° forward wrap around lumbar

    // Dual dampening compression springs connecting wing to spine
    const springJoint = new THREE.Mesh(
      new THREE.CylinderGeometry(0.012, 0.012, 0.05, 12),
      aluminumMat
    );
    springJoint.rotation.x = Math.PI / 2;
    springJoint.position.set(-side * 0.04, 0, 0.03);
    wingGroup.add(springJoint);

    // Wing contoured outer rim
    const wingFrame = new THREE.Mesh(
      new THREE.BoxGeometry(0.22, 0.18, 0.032),
      gh328FrameMat
    );
    wingFrame.position.set(0, 0, 0);
    wingGroup.add(wingFrame);

    // Wing Dragon Mesh cushion pad
    const wingMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.20, 0.16, 0.024),
      gh328MeshMat
    );
    wingMesh.position.set(0, 0, -0.01);
    wingGroup.add(wingMesh);

    // Subtle cyan ergonomic accent trim
    const wingAccent = new THREE.Mesh(
      new THREE.BoxGeometry(0.008, 0.16, 0.01),
      gh328AccentMat
    );
    wingAccent.position.set(side * 0.10, 0, -0.012);
    wingGroup.add(wingAccent);

    lumbarGroup.add(wingGroup);
  });

  chairUpperGroup.add(lumbarGroup);

  // B. Upper Thoracic Backrest (Tựa lưng trên uốn lượn ôm trọn lồng ngực & vai)
  const thoracicGroup = new THREE.Group();
  thoracicGroup.position.set(0, 0.58, 0.24);
  thoracicGroup.rotation.x = -0.07;

  // Solid bracket mounting thoracic backrest to central spine
  const thoracicBracket = new THREE.Mesh(
    new THREE.BoxGeometry(0.12, 0.08, 0.04),
    aluminumMat
  );
  thoracicBracket.position.set(0, 0, 0.025);
  thoracicGroup.add(thoracicBracket);

  // Contoured upper backrest frame
  const backFrame = new THREE.Mesh(
    new THREE.BoxGeometry(0.62, 0.44, 0.045),
    gh328FrameMat
  );
  backFrame.position.set(0, 0, 0);
  backFrame.castShadow = true;
  thoracicGroup.add(backFrame);

  // Upper breathable dragon mesh panel
  const thoracicMesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.56, 0.38, 0.025),
    gh328MeshMat
  );
  thoracicMesh.position.set(0, 0, -0.012);
  thoracicGroup.add(thoracicMesh);

  // Shoulder ergonomic contour wings
  [-0.29, 0.29].forEach((shx) => {
    const shoulderCurve = new THREE.Mesh(
      new THREE.CylinderGeometry(0.020, 0.020, 0.40, 12),
      gh328FrameMat
    );
    shoulderCurve.position.set(shx, 0, -0.005);
    thoracicGroup.add(shoulderCurve);
  });

  // GH-328 Signature Rear Coat Hanger / Handle
  const coatHanger = new THREE.Mesh(
    new THREE.TorusGeometry(0.14, 0.012, 8, 20, Math.PI),
    aluminumMat
  );
  coatHanger.position.set(0, 0.16, 0.045);
  coatHanger.rotation.z = Math.PI;
  thoracicGroup.add(coatHanger);

  chairUpperGroup.add(thoracicGroup);

  // 6. 3D MULTI-ADJUSTABLE CURVED HEADREST (Tựa đầu 3D gắn liền khối kiên cố vào đỉnh lưng ghế)
  const headrestGroup = new THREE.Group();
  headrestGroup.position.set(0, 0.82, 0.22);
  headrestGroup.rotation.x = -0.08;

  // Solid mounting bracket bolted to top spine & backrest frame
  const headrestBaseMount = new THREE.Mesh(
    new THREE.BoxGeometry(0.10, 0.06, 0.04),
    gh328FrameMat
  );
  headrestBaseMount.position.set(0, 0, 0.02);
  headrestGroup.add(headrestBaseMount);

  // Dual telescoping aluminum height-adjustment riser rails
  [-0.035, 0.035].forEach((hx) => {
    const stemBar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.010, 0.010, 0.16, 12),
      aluminumMat
    );
    stemBar.position.set(hx, 0.07, 0.01);
    headrestGroup.add(stemBar);
  });

  // Dual-axis tilt articulation knuckle hinge
  const headrestHub = new THREE.Mesh(
    new THREE.CylinderGeometry(0.020, 0.020, 0.11, 16),
    aluminumMat
  );
  headrestHub.rotation.z = Math.PI / 2;
  headrestHub.position.set(0, 0.14, -0.01);
  headrestGroup.add(headrestHub);

  // Rear protective nylon shell
  const headrestShell = new THREE.Mesh(
    new THREE.BoxGeometry(0.34, 0.14, 0.035),
    gh328FrameMat
  );
  headrestShell.position.set(0, 0.14, 0.01);
  headrestGroup.add(headrestShell);

  // Contoured crescent-moon 3D headrest cushion (ôm trọn đốt sống cổ C1-C7, cong về phía trước)
  const headrestPillow = new THREE.Mesh(
    new THREE.BoxGeometry(0.32, 0.13, 0.045),
    gh328MeshMat
  );
  headrestPillow.position.set(0, 0.14, -0.025);
  headrestGroup.add(headrestPillow);

  chairUpperGroup.add(headrestGroup);

  // 7. 3D STREAMLINED ERGONOMIC ARMRESTS (Tay vịn 3D gắn chắc chắn vào khung mâm ghế)
  [-0.38, 0.38].forEach((ax) => {
    const armGroup = new THREE.Group();
    armGroup.position.set(ax, 0, 0);

    // Heavy-duty curved aluminum cantilever arm rooted into chassis
    const cantileverArm = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.040, 0.050),
      aluminumMat
    );
    cantileverArm.position.set(ax > 0 ? -0.05 : 0.05, 0.02, 0.02);
    armGroup.add(cantileverArm);

    // Streamlined vertical telescoping aluminum pillar
    const armPillar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.024, 0.028, 0.26, 16),
      aluminumMat
    );
    armPillar.position.set(0, 0.15, 0.02);
    armGroup.add(armPillar);

    // Chrome height adjustment trigger button
    const armTrigger = new THREE.Mesh(
      new THREE.BoxGeometry(0.012, 0.022, 0.012),
      darkMetalMat
    );
    armTrigger.position.set(ax > 0 ? -0.025 : 0.025, 0.16, 0.02);
    armGroup.add(armTrigger);

    // 3D Contoured soft-touch PU arm pad with rounded ends & inward 5° ergonomic cant
    const padShape = new THREE.BoxGeometry(0.11, 0.034, 0.28);
    const armPad = new THREE.Mesh(padShape, gh328PadMat);
    armPad.position.set(0, 0.29, 0.01);
    armPad.rotation.y = ax > 0 ? -0.08 : 0.08;
    armGroup.add(armPad);

    // Beveled front and rear rounded caps
    [-0.135, 0.135].forEach((pz) => {
      const padCap = new THREE.Mesh(
        new THREE.CylinderGeometry(0.050, 0.050, 0.032, 16),
        gh328PadMat
      );
      padCap.position.set(0, 0.29, 0.01 + pz);
      padCap.rotation.y = ax > 0 ? -0.08 : 0.08;
      armGroup.add(padCap);
    });

    chairUpperGroup.add(armGroup);
  });

  chair.add(chairUpperGroup);

  chair.name = 'chair-ergonomic';
  chair.userData = {
    isClickable: true,
    workstationItem: 'chair',
    label: '🪑 GH-328 Ergonomic Chair: Click to rotate 45° & relax spine',
  };
  chair.traverse((child) => {
    child.userData = {
      isClickable: true,
      workstationItem: 'chair',
      label: '🪑 GH-328 Ergonomic Chair: Click to rotate 45° & relax spine',
    };
  });
  workstation.add(chair);

  // -------------------------------------------------------------
  // ANIMATION TICK LOOP
  // -------------------------------------------------------------
  let animTick = 0;

  const tick = (elapsedTime: number) => {
    animTick++;

    // Spin PC fans
    fanBlades.forEach((b) => {
      b.rotation.x += 0.15;
    });

    // Steam particles rising from coffee
    steamParticles.forEach((puff, idx) => {
      puff.position.y += 0.003;
      puff.position.x = Math.sin(elapsedTime * 2 + idx) * 0.02;
      if (puff.position.y > 0.55) {
        puff.position.y = 0.18;
      }
    });

    // Pulse speaker woofers if playing
    if (state.speakerPlaying) {
      const pulse = 1.0 + Math.sin(elapsedTime * 12) * 0.08;
      woofers.forEach((w) => {
        w.scale.set(pulse, pulse, 1);
      });
    }

    // Smooth swivel chair rotation
    const chairDiff = state.chairSwivelTarget - chairUpperGroup.rotation.y;
    if (Math.abs(chairDiff) > 0.0005) {
      chairUpperGroup.rotation.y += chairDiff * 0.08;
    } else {
      chairUpperGroup.rotation.y = state.chairSwivelTarget;
    }

    // Smooth motorized sit-stand desk elevation animation
    const elevationDiff = state.deskElevationTarget - deskTopGroup.position.y;
    if (Math.abs(elevationDiff) > 0.001) {
      const step = Math.sign(elevationDiff) * Math.min(Math.abs(elevationDiff), 0.006);
      deskTopGroup.position.y += step;
      state.deskElevation = deskTopGroup.position.y;

      // Real-time height in cm: 0.22m -> 74.0cm, 0.58m -> 108.0cm
      const progress = (deskTopGroup.position.y - 0.22) / (0.58 - 0.22);
      const clamped = Math.max(0, Math.min(1, progress));
      state.deskCurrentHeightCm = 74.0 + clamped * 34.0;

      // Update LED display on handset frequently during movement
      if (animTick % 2 === 0) {
        drawControlPadDisplay(controlPadCanvas, state.deskCurrentHeightCm, elevationDiff > 0 ? 'up' : 'down');
        controlPadTex.needsUpdate = true;
      }
    } else if (deskTopGroup.position.y !== state.deskElevationTarget) {
      deskTopGroup.position.y = state.deskElevationTarget;
      state.deskElevation = state.deskElevationTarget;
      const targetCm = state.deskElevationTarget > 0.3 ? 108.0 : 74.0;
      state.deskCurrentHeightCm = targetCm;
      drawControlPadDisplay(controlPadCanvas, state.deskCurrentHeightCm, 'idle');
      controlPadTex.needsUpdate = true;
    }

    // Refresh desk clock and phone display every 60 frames (~1 sec)
    if (animTick % 60 === 0) {
      drawDeskClock(clockCanvas);
      clockTex.needsUpdate = true;
      drawPhoneScreen(phoneCanvas);
      phoneTex.needsUpdate = true;
    }

    // Refresh dynamic textures periodically (only when in active dynamic animated modes like Matrix / Terminal)
    if (state.mainScreenMode !== 0 && animTick % 30 === 0) {
      drawMainScreen(mainScreenCanvas, state.mainScreenMode, animTick);
      mainScreenTex.needsUpdate = true;
    }

    // Refresh vertical display dynamically (animating cursor and orca sequence)
    if (animTick % 20 === 0) {
      drawVerticalScreen(vertScreenCanvas, state.verticalScreenMode, animTick);
      vertScreenTex.needsUpdate = true;
    }
  };

  // -------------------------------------------------------------
  // INTERACTION DISPATCHER
  // -------------------------------------------------------------
  const interact = (itemType: string): { title: string; message: string; icon?: string } => {
    switch (itemType) {
      case 'desk-controller':
      case 'desk':
      case 'sit-stand': {
        state.deskIsElevated = !state.deskIsElevated;
        state.deskElevationTarget = state.deskIsElevated ? 0.58 : 0.22;
        soundManager.playDeskMotor(state.deskIsElevated);

        // Immediate responsive visual feedback on the OLED handset screen
        drawControlPadDisplay(
          controlPadCanvas,
          state.deskCurrentHeightCm,
          state.deskIsElevated ? 'up' : 'down'
        );
        controlPadTex.needsUpdate = true;

        return {
          title: state.deskIsElevated
            ? '⚡ Smart Desk: Rising (Standing Mode)'
            : '⚡ Smart Desk: Lowering (Sitting Mode)',
          message: state.deskIsElevated
            ? 'Raising desk to 108.0 cm standing height • Dual-motor WhisperQuiet™ 38mm/s • Ergonomic posture & spine relief'
            : 'Lowering desk to 74.0 cm seated height • Aligned with GH-328 chair armrests & waterfall edge',
          icon: 'sliders',
        };
      }

      case 'main-screen':
      case 'screen-main': {
        state.mainScreenMode = (state.mainScreenMode + 1) % 3;
        drawMainScreen(mainScreenCanvas, state.mainScreenMode, animTick);
        mainScreenTex.needsUpdate = true;
        soundManager.playClick(true);

        const modes = [
          '🌐 Portfolio CV Website (Nova Hoang)',
          '⚡ VS Code IDE (ThreeCanvas.tsx Source Code)',
          '💻 Cyber Terminal & Matrix Telemetry',
        ];
        return {
          title: '🖥️ BenQ MA270S (27" 4K Display)',
          message:
            state.mainScreenMode === 0
              ? 'Live website: https://novahoangdev.web.app/ (One career. Two perspectives.)'
              : `Display mode: ${modes[state.mainScreenMode]}`,
          icon: 'screen',
        };
      }

      case 'vertical-screen': {
        state.verticalScreenMode = (state.verticalScreenMode + 1) % 2;
        drawVerticalScreen(vertScreenCanvas, state.verticalScreenMode, animTick);
        vertScreenTex.needsUpdate = true;
        soundManager.playClick(true);

        const vModes = [
          '💻 Terminal Codex (AI Autonomous Agent CLI)',
          '✳️ Claude CLI (Anthropic Claude Code Terminal)',
        ];
        return {
          title: '📱 Vertical Pivot Monitor (24")',
          message: `Displaying: ${vModes[state.verticalScreenMode]}`,
          icon: state.verticalScreenMode === 0 ? 'terminal' : 'sparkles',
        };
      }

      case 'screenbar':
      case 'screen-bar': {
        state.screenbarOn = !state.screenbarOn;
        screenbarLight.intensity = state.screenbarOn ? 3.2 : 0.0;
        barLedMat.emissiveIntensity = state.screenbarOn ? 1.8 : 0.0;
        soundManager.playLampSwitch(state.screenbarOn);

        return {
          title: '💡 BenQ ScreenBar Monitor Light',
          message: state.screenbarOn
            ? 'Monitor light turned on (4000K Neutral Eye-Care Illumination)'
            : 'ScreenBar turned off',
          icon: 'lamp',
        };
      }

      case 'audio-interface': {
        soundManager.playSpeakerBeat();
        return {
          title: '🎛️ Audio Interface Focusrite Scarlett 2i2',
          message: 'Direct Monitor: On • 192kHz/24-bit • Studio audio test signal active',
          icon: 'audio',
        };
      }

      case 'clock': {
        soundManager.playClockBeep();
        drawDeskClock(clockCanvas);
        clockTex.needsUpdate = true;
        return {
          title: '⏱️ Smart Desk Clock & Pomodoro Timer',
          message: '25-minute deep focus sprint • Disciplined and productive engineering rhythm',
          icon: 'clock',
        };
      }

      case 'phone': {
        soundManager.playPhoneChime();
        drawPhoneScreen(phoneCanvas);
        phoneTex.needsUpdate = true;
        return {
          title: '📱 Smartphone on MagSafe Charger',
          message: 'New notification: "Hello Hoa! Loved your 3D WebGL interactive portfolio."',
          icon: 'phone',
        };
      }

      case 'chair': {
        state.chairSwivelTarget += Math.PI / 4;
        soundManager.playChairSwivel();
        return {
          title: '🪑 GH-328 Ergonomic Mesh Chair',
          message: 'Adaptive butterfly dual-backrest L1-L5 • Breathable Dragon Mesh • Smooth 45° rotation',
          icon: 'chair',
        };
      }

      case 'headphones': {
        soundManager.playSpeakerBeat();
        return {
          title: '🎧 Havit H630BT Wireless Headphones (Cream)',
          message: 'Bluetooth 5.3 • 55h Long Battery Life • Ergonomic Foldable Design • Soft Memory-Foam Protein Leather',
          icon: 'headphones',
        };
      }

      case 'keyboard': {
        soundManager.playKeyboardClack();
        // Trigger RGB color cycle on underglow, switch plate, and keycap legends
        const rgbPalette = [
          { hexStr: '#00f0ff', hexNum: 0x00f0ff },
          { hexStr: '#a855f7', hexNum: 0xa855f7 },
          { hexStr: '#10b981', hexNum: 0x10b981 },
          { hexStr: '#f43f5e', hexNum: 0xf43f5e },
          { hexStr: '#fbbf24', hexNum: 0xfbbf24 },
          { hexStr: '#38bdf8', hexNum: 0x38bdf8 },
        ];
        const choice = rgbPalette[Math.floor(Math.random() * rgbPalette.length)];
        kbUnderglowMat.color.setHex(choice.hexNum);
        kbUnderglowMat.emissive.setHex(choice.hexNum);
        akkoBadgeMat.color.setHex(choice.hexNum);
        akkoBadgeMat.emissive.setHex(choice.hexNum);
        wristCyanLineMat.color.setHex(choice.hexNum);
        wristCyanLineMat.emissive.setHex(choice.hexNum);
        drawAkko3068BKeyboard(akkoCanvas, choice.hexStr);
        akkoTex.needsUpdate = true;

        return {
          title: '⌨️ AKKO 3068B Plus Floating Mechanical Keyboard',
          message: 'Floating-keys architectural design • 68 ASA PBT Double-Shot elevated keycaps • AKKO CS Jelly Pink Linear switches • Dual sound dampening EVA + Silicone • Tri-mode Bluetooth 5.0 / 2.4Ghz / Type-C',
          icon: 'keyboard',
        };
      }

      case 'mouse': {
        soundManager.playSilentClick();
        return {
          title: '🖱️ Logitech Signature M650 Silent Mouse',
          message: 'SilentTouch technology reduces 90% click noise • SmartWheel precision & speed scroll • Bluetooth BLE & Logi Bolt • Contoured rubber side grips',
          icon: 'mouse',
        };
      }

      case 'coffee': {
        soundManager.playSip();
        // Trigger steam burst
        steamParticles.forEach((p) => {
          p.position.y += 0.08;
        });

        return {
          title: '☕ Fresh Espresso',
          message: '+100 Energy! Turning caffeine into high-performance 60 FPS code.',
          icon: 'coffee',
        };
      }

      case 'rubber-duck':
      case 'duck': {
        soundManager.playDuckQuack();
        const tips = [
          '"Explain the bug out loud to me before rewriting the logic!"',
          '"Did you check null and undefined at the input boundaries?"',
          '"60 FPS WebGL needs optimized draw calls and geometry instancing!"',
          '"Take a 5-minute break to rest your eyes and refresh your mind."',
        ];
        const tip = tips[Math.floor(Math.random() * tips.length)];

        return {
          title: '🦆 Rubber Duck Debugger',
          message: tip,
          icon: 'duck',
        };
      }

      case 'speakers':
      case 'speaker': {
        state.speakerPlaying = !state.speakerPlaying;
        soundManager.playSpeakerBeat();

        return {
          title: '🔊 Studio Monitor Speakers',
          message: state.speakerPlaying ? 'Now playing Lo-Fi coding beats 🎶' : 'Music paused',
          icon: 'speaker',
        };
      }

      case 'mac-mini': {
        soundManager.playNavChime(523.25);
        return {
          title: '🖥️ Mac mini · M5 Pro',
          message: 'M5 Pro chip · 48GB unified memory · drives the vertical screen',
          icon: 'pc',
        };
      }

      case 'pc-tower':
      case 'pc': {
        state.pcColorIdx = (state.pcColorIdx + 1) % fanColors.length;
        const newColor = fanColors[state.pcColorIdx];
        fanMat.color.setHex(newColor);
        fanMat.emissive.setHex(newColor);
        soundManager.playClick(false);

        return {
          title: '🖥️ High-End PC Workstation',
          message: 'Switched RGB lighting on cooling fans and waterblock',
          icon: 'pc',
        };
      }

      case 'laptop': {
        soundManager.playClick(true);
        return {
          title: '💻 MacBook Pro M2 Max (Space Gray)',
          message: 'Apple Silicon M2 Max • Liquid Retina XDR with notch • macOS Sonoma & Terminal',
          icon: 'laptop',
        };
      }

      case 'sneaker-shelf':
      case 'sneakers': {
        soundManager.playClick(true);
        return {
          title: '👟 8-Cubby Shelf & Sneaker Box Towers',
          message: 'Multifunction organizer: scented candles, board game, skincare, beverage & designer boxes (Nike, Adidas NY 90, Yeezy 380, Vans)',
          icon: 'sneaker',
        };
      }

      case 'bookshelf':
      case 'books': {
        soundManager.playClick(false);
        return {
          title: '📚 Tech Bookshelf & Awards (Right)',
          message: 'Three.js Masterclass, Clean Architecture, WebGL 3D Best Practices & WebGL Star Award',
          icon: 'book',
        };
      }

      case 'plant': {
        soundManager.playClick(false);
        return {
          title: '🌿 Desk Succulent & Air Plant',
          message: 'Adding organic warmth and fresh biophilic balance to the coding workspace',
          icon: 'plant',
        };
      }

      default:
        soundManager.playClick();
        return {
          title: '🛠️ Developer Workstation',
          message: 'Creative digital engineering environment of Hoang Van Hoa',
        };
    }
  };

  return {
    group: workstation,
    tick,
    interact,
    getState: () => state,
  };
}
