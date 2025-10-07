/**
 * Generate PWA Icons for Field Force CRM
 * Creates 192x192 and 512x512 SVG icons
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Simple SVG icon with medical briefcase and location pin
const createSVG = (size) => `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <!-- Background gradient -->
  <defs>
    <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#3730a3;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#1e3a8a;stop-opacity:1" />
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="${size}" height="${size}" fill="url(#bgGradient)" rx="${size * 0.1}"/>

  <!-- Medical briefcase (centered) -->
  <g transform="translate(${size * 0.5}, ${size * 0.5})">
    <!-- Briefcase body -->
    <rect x="${-size * 0.2}" y="${-size * 0.1}" width="${size * 0.4}" height="${size * 0.25}"
          fill="#ffffff" rx="${size * 0.02}"/>

    <!-- Briefcase handle -->
    <rect x="${-size * 0.1}" y="${-size * 0.15}" width="${size * 0.2}" height="${size * 0.05}"
          fill="#ffffff" rx="${size * 0.01}"/>

    <!-- Medical cross (pink accent) -->
    <rect x="${-size * 0.025}" y="${-size * 0.05}" width="${size * 0.05}" height="${size * 0.15}"
          fill="#db2777"/>
    <rect x="${-size * 0.075}" y="${size * 0.0}" width="${size * 0.15}" height="${size * 0.05}"
          fill="#db2777"/>
  </g>

  <!-- Location pin (top right corner) -->
  <g transform="translate(${size * 0.75}, ${size * 0.25})">
    <circle cx="0" cy="0" r="${size * 0.06}" fill="#10b981"/>
    <circle cx="0" cy="0" r="${size * 0.03}" fill="#ffffff"/>
    <path d="M 0,${size * 0.06} L 0,${size * 0.12} L ${-size * 0.025},${size * 0.09} Z" fill="#10b981"/>
  </g>
</svg>`;

// Generate SVG files
const sizes = [192, 512];

sizes.forEach(size => {
  const svg = createSVG(size);
  const filename = `pwa-${size}x${size}.svg`;
  const filepath = path.join(__dirname, 'public', filename);

  fs.writeFileSync(filepath, svg);
  console.log(`✅ Generated ${filename}`);
});

console.log('\n🎉 SVG icons generated successfully!');
console.log('📝 Note: Using SVG format which is widely supported by modern browsers');
console.log('💡 To convert to PNG, use: https://svgtopng.com/ or similar tool');
