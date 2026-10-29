/**
 * Pure Node.js PNG Generator for VelvetRain
 * Uses built-in 'zlib' and 'fs' — zero external dependencies needed!
 */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// CRC32 Table
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
  }
  crcTable[n] = c >>> 0;
}

function crc32(buf) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ buf[i]) & 0xFF];
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function writeChunk(type, data) {
  const len = data.length;
  const buf = Buffer.alloc(4 + 4 + len + 4);
  buf.writeUInt32BE(len, 0);
  buf.write(type, 4, 4, 'ascii');
  data.copy(buf, 8);
  const typeAndData = buf.subarray(4, 8 + len);
  buf.writeUInt32BE(crc32(typeAndData), 8 + len);
  return buf;
}

function createPng(width, height, pixelFn) {
  const sig = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);

  // IHDR
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // 8 bits per channel
  ihdrData[9] = 6; // RGBA
  ihdrData[10] = 0;
  ihdrData[11] = 0;
  ihdrData[12] = 0;
  const ihdrChunk = writeChunk('IHDR', ihdrData);

  // Raw Scanlines: Filter byte (0) + 4 bytes per pixel
  const rowLength = 1 + width * 4;
  const rawData = Buffer.alloc(height * rowLength);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowLength;
    rawData[rowOffset] = 0; // Filter: None
    for (let x = 0; x < width; x++) {
      const idx = rowOffset + 1 + x * 4;
      const [r, g, b, a] = pixelFn(x, y, width, height);
      rawData[idx] = r;
      rawData[idx + 1] = g;
      rawData[idx + 2] = b;
      rawData[idx + 3] = a;
    }
  }

  const compressed = zlib.deflateSync(rawData, { level: 9 });
  const idatChunk = writeChunk('IDAT', compressed);
  const iendChunk = writeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([sig, ihdrChunk, idatChunk, iendChunk]);
}

/**
 * Procedural Art for VelvetRain Icon
 * Deep Midnight Violet-Indigo background with a glowing luminescent raindrop
 */
function velvetRainShader(x, y, w, h) {
  const nx = (x / w) * 2 - 1; // -1 to 1
  const ny = (y / h) * 2 - 1; // -1 to 1
  const dist = Math.sqrt(nx * nx + ny * ny);

  // Background gradient: Center deep midnight indigo (#151A30), outer pitch black (#04060C)
  const bgGrad = Math.max(0, 1 - dist * 0.85);
  let r = Math.round(5 + bgGrad * 24);
  let g = Math.round(8 + bgGrad * 32);
  let b = Math.round(18 + bgGrad * 65);
  let a = 255;

  // Rounded squircle app corner mask
  const cornerRadius = 0.88;
  const cornerDist = Math.pow(Math.abs(nx), 4) + Math.pow(Math.abs(ny), 4);
  if (cornerDist > 1.0) {
    return [0, 0, 0, 0]; // Transparent outer corners for standalone icon
  }

  // Outer ambient glowing halo (Indigo/Cyan)
  const haloDist = Math.abs(dist - 0.62);
  if (haloDist < 0.18) {
    const haloIntensity = (1 - haloDist / 0.18) * 0.28;
    r = Math.min(255, r + Math.round(99 * haloIntensity));
    g = Math.min(255, g + Math.round(102 * haloIntensity));
    b = Math.min(255, b + Math.round(241 * haloIntensity));
  }

  // Raindrop Shape Formula:
  // Center is at (0, 0.08)
  const dropX = nx * 1.5;
  const dropY = (ny + 0.05) * 1.5;

  // Mathematical Teardrop/Raindrop: x^2 + (y - 0.5*x)^2 or circle with pinch
  // Pointed tip at top (y = -0.65), rounded base at bottom (y = 0.35)
  if (dropY >= -0.65 && dropY <= 0.45) {
    // Width expands smoothly downwards
    const t = (dropY + 0.65) / 1.1; // 0 at tip, 1 at bottom
    const maxDropWidth = 0.48 * Math.sin(t * Math.PI * 0.85);
    const dDist = Math.abs(dropX);

    if (dDist < maxDropWidth) {
      const dropEdgeFactor = 1 - (dDist / maxDropWidth);
      // Raindrop gradient: Bright Cyan at top/core -> Rich Indigo Blue at base
      const innerT = Math.pow(dropEdgeFactor, 0.6);

      const coreR = Math.round(56 + (1 - t) * 160 + innerT * 35);
      const coreG = Math.round(189 + (1 - t) * 50 + innerT * 15);
      const coreB = Math.round(248 + t * 7);

      r = Math.min(255, Math.max(0, coreR));
      g = Math.min(255, Math.max(0, coreG));
      b = Math.min(255, Math.max(0, coreB));

      // Specular highlight on upper-left inside droplet
      const specX = dropX + 0.12;
      const specY = dropY + 0.18;
      const specDist = Math.sqrt(specX * specX + specY * specY);
      if (specDist < 0.14) {
        const specGlow = Math.pow(1 - specDist / 0.14, 2) * 0.85;
        r = Math.min(255, Math.round(r + (255 - r) * specGlow));
        g = Math.min(255, Math.round(g + (255 - g) * specGlow));
        b = Math.min(255, Math.round(b + (255 - b) * specGlow));
      }
    }
  }

  // Rippling water ring 1 at base (y ≈ 0.52)
  const ripY1 = Math.abs(ny - 0.48);
  const ripX1 = Math.abs(nx);
  const ripEllipse1 = Math.sqrt((ripX1 * ripX1) / (0.45 * 0.45) + (ripY1 * ripY1) / (0.08 * 0.08));
  if (Math.abs(ripEllipse1 - 1.0) < 0.12) {
    const ripGlow = (1 - Math.abs(ripEllipse1 - 1.0) / 0.12) * 0.45;
    r = Math.min(255, r + Math.round(56 * ripGlow));
    g = Math.min(255, g + Math.round(189 * ripGlow));
    b = Math.min(255, b + Math.round(248 * ripGlow));
  }

  // Rippling water ring 2 (larger, fainter, y ≈ 0.62)
  const ripY2 = Math.abs(ny - 0.58);
  const ripX2 = Math.abs(nx);
  const ripEllipse2 = Math.sqrt((ripX2 * ripX2) / (0.65 * 0.65) + (ripY2 * ripY2) / (0.10 * 0.10));
  if (Math.abs(ripEllipse2 - 1.0) < 0.10) {
    const ripGlow2 = (1 - Math.abs(ripEllipse2 - 1.0) / 0.10) * 0.25;
    r = Math.min(255, r + Math.round(99 * ripGlow2));
    g = Math.min(255, g + Math.round(102 * ripGlow2));
    b = Math.min(255, b + Math.round(241 * ripGlow2));
  }

  return [r, g, b, a];
}

console.log('🎨 Generating VelvetRain High-Resolution App Icons...');

const root = __dirname;
const icon512 = createPng(512, 512, velvetRainShader);
fs.writeFileSync(path.join(root, 'icon-512.png'), icon512);
fs.writeFileSync(path.join(root, 'icon-maskable.png'), icon512);
console.log('✅ Generated icon-512.png & icon-maskable.png');

const icon192 = createPng(192, 192, velvetRainShader);
fs.writeFileSync(path.join(root, 'icon-192.png'), icon192);
console.log('✅ Generated icon-192.png');

const iconApple = createPng(180, 180, velvetRainShader);
fs.writeFileSync(path.join(root, 'apple-touch-icon.png'), iconApple);
console.log('✅ Generated apple-touch-icon.png');

console.log('🎉 All app icons generated with zero external dependencies!');
