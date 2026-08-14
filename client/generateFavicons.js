const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function generate() {
  const publicDir = path.join(__dirname, 'public');
  const svgPath = path.join(publicDir, 'favicon.svg');
  const svgBuffer = fs.readFileSync(svgPath);

  const sizes = [
    { name: 'favicon-48x48.png', width: 48, height: 48 },
    { name: 'favicon-96x96.png', width: 96, height: 96 },
    { name: 'apple-touch-icon.png', width: 180, height: 180 },
    { name: 'favicon-192x192.png', width: 192, height: 192 },
    { name: 'favicon-512x512.png', width: 512, height: 512 },
    { name: 'favicon.ico', width: 48, height: 48 }
  ];

  for (const s of sizes) {
    const outPath = path.join(publicDir, s.name);
    await sharp(svgBuffer)
      .resize(s.width, s.height)
      .png()
      .toFile(outPath);
    console.log(`Generated: ${s.name} (${s.width}x${s.height})`);
  }

  // Generate OpenGraph Banner 1200x630 with cyber gradient background & logo
  const ogSvg = `
    <svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bgGrad" x1="0" y1="0" x2="1200" y2="630" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#050811"/>
          <stop offset="50%" stop-color="#080e1a"/>
          <stop offset="100%" stop-color="#050811"/>
        </linearGradient>
        <linearGradient id="glow" x1="0" y1="0" x2="100" y2="0">
          <stop offset="0%" stop-color="#00d4ff"/>
          <stop offset="100%" stop-color="#00ff88"/>
        </linearGradient>
      </defs>
      <rect width="1200" height="630" fill="url(#bgGrad)"/>
      <g transform="translate(525, 120) scale(1.5)">
        <path d="M50 5 L92 20 L92 65 C92 82 50 95 50 95 C50 95 8 82 8 65 L8 20 Z" fill="#080c14" stroke="url(#glow)" stroke-width="8"/>
        <path d="M30 35 L44 50 L30 65 L38 73 L50 58 L62 73 L70 65 L56 50 L70 35 L62 27 L50 42 L38 27 Z" fill="url(#glow)"/>
      </g>
      <text x="600" y="380" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="54" font-weight="900" fill="#ffffff" text-anchor="middle" letter-spacing="4">CYBERSHIELD X</text>
      <text x="600" y="440" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="24" font-weight="500" fill="#00d4ff" text-anchor="middle" letter-spacing="2">AI-POWERED THREAT INTELLIGENCE &amp; VULNERABILITY PLATFORM</text>
      <text x="600" y="520" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="20" font-weight="600" fill="#00ff88" text-anchor="middle" letter-spacing="3">WWW.CYBERSHIELDX.IN</text>
    </svg>
  `;
  await sharp(Buffer.from(ogSvg))
    .png()
    .toFile(path.join(publicDir, 'og-banner.png'));
  console.log('Generated: og-banner.png (1200x630)');
}

generate().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
