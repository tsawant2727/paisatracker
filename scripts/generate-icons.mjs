// Generates the Paisa Tracker PWA icons + favicon from an inline SVG logo.
// Run with: node scripts/generate-icons.mjs
import sharp from "sharp";
import fs from "fs";
import path from "path";

const OUT = path.join(process.cwd(), "public", "icons");
fs.mkdirSync(OUT, { recursive: true });

const defs = `
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#141b24"/>
      <stop offset="1" stop-color="#0b0f14"/>
    </linearGradient>
    <linearGradient id="fg" x1="0.2" y1="0" x2="0.8" y2="1">
      <stop offset="0" stop-color="#6bffc2"/>
      <stop offset="1" stop-color="#2ee89a"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.72" cy="0.24" r="0.85">
      <stop offset="0" stop-color="#3dffa8" stop-opacity="0.30"/>
      <stop offset="1" stop-color="#3dffa8" stop-opacity="0"/>
    </radialGradient>
  </defs>`;

// Hand-drawn rupee (₹) mark so rendering never depends on an installed font.
// Drawn inside a 512x512 box, centred. `s` scales the mark about the centre.
function rupee(fill, s = 1) {
  const cx = 256,
    cy = 256;
  // Two solid top bars (always visible) + bowl and diagonal leg = clear ₹.
  const g = `
    <g fill="${fill}">
      <rect x="166" y="150" width="180" height="30" rx="15"/>
      <rect x="166" y="212" width="180" height="30" rx="15"/>
    </g>
    <g stroke="${fill}" stroke-width="30" fill="none" stroke-linecap="round" stroke-linejoin="round">
      <path d="M196 165 q92 4 92 76 q0 72 -92 76 l108 128"/>
    </g>`;
  return `<g transform="translate(${cx} ${cy}) scale(${s}) translate(${-cx} ${-cy})">${g}</g>`;
}

const rounded = `<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  ${defs}
  <rect width="512" height="512" rx="112" fill="url(#bg)"/>
  <rect width="512" height="512" rx="112" fill="url(#glow)"/>
  ${rupee("url(#fg)", 1)}
</svg>`;

const maskable = `<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  ${defs}
  <rect width="512" height="512" fill="#0b0f14"/>
  <rect width="512" height="512" fill="url(#glow)"/>
  ${rupee("url(#fg)", 0.72)}
</svg>`;

async function png(svg, size, file) {
  await sharp(Buffer.from(svg)).resize(size, size).png().toFile(path.join(OUT, file));
  console.log("wrote", file, size + "x" + size);
}

// Master SVG for crisp in-app use
fs.writeFileSync(path.join(process.cwd(), "public", "icon.svg"), rounded);

await png(rounded, 192, "icon-192.png");
await png(rounded, 512, "icon-512.png");
await png(maskable, 192, "icon-maskable-192.png");
await png(maskable, 512, "icon-maskable-512.png");
await png(rounded, 180, "apple-touch-icon.png");
await png(rounded, 32, "favicon-32.png");
await png(rounded, 16, "favicon-16.png");
console.log("done");
