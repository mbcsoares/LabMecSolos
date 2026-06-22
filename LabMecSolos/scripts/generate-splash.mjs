import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');

const splashSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1920" width="1080" height="1920">
  <rect width="1080" height="1920" fill="#1a1a2e"/>
  <g transform="translate(140, 750) scale(1.0)">
    <line x1="0" y1="0" x2="800" y2="0" stroke="#1E56B2" stroke-width="10" stroke-linecap="round"/>
    <path d="M 0,25 L 520,25 L 520,45 L 800,45 L 800,95 L 520,95 L 520,75 L 0,75 Z" fill="#225EC3"/>
    <path d="M 0,105 L 520,105 L 520,90 L 800,90 L 800,140 L 520,140 L 520,130 L 0,130 Z" fill="#88D7C0"/>
    <path d="M 0,150 L 520,150 L 520,175 L 800,175 L 800,225 L 520,225 L 520,200 L 0,200 Z" fill="#4B937D"/>
    <path d="M 0,235 L 520,235 L 520,220 L 800,220 L 800,270 L 520,270 L 520,260 L 0,260 Z" fill="#9CA3AF"/>
    <path d="M 0,280 L 520,280 L 520,305 L 800,305 L 800,355 L 520,355 L 520,330 L 0,330 Z" fill="#374151"/>
    <line x1="0" y1="380" x2="800" y2="380" stroke="#374151" stroke-width="10" stroke-linecap="round"/>
  </g>
</svg>`;

const sizes = [
  { name: 'mdpi', w: 320, h: 480 },
  { name: 'hdpi', w: 480, h: 800 },
  { name: 'xhdpi', w: 720, h: 1280 },
  { name: 'xxhdpi', w: 960, h: 1600 },
  { name: 'xxxhdpi', w: 1280, h: 1920 },
];

async function main() {
  console.log('Gerando splash screens...');
  const resDir = join(projectRoot, 'android', 'app', 'src', 'main', 'res');

  for (const s of sizes) {
    const dir = join(resDir, `drawable-port-${s.name}`);
    await sharp(Buffer.from(splashSvg))
      .resize(s.w, s.h, { fit: 'fill' })
      .png()
      .toFile(join(dir, 'splash.png'));
    console.log(`  drawable-port-${s.name}/splash.png (${s.w}x${s.h})`);
  }

  // Landscape version (just swap dimensions)
  const landscapeSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080" width="1920" height="1080">
  <rect width="1920" height="1080" fill="#1a1a2e"/>
  <g transform="translate(560, 310) scale(1.0)">
    <line x1="0" y1="0" x2="800" y2="0" stroke="#1E56B2" stroke-width="10" stroke-linecap="round"/>
    <path d="M 0,25 L 520,25 L 520,45 L 800,45 L 800,95 L 520,95 L 520,75 L 0,75 Z" fill="#225EC3"/>
    <path d="M 0,105 L 520,105 L 520,90 L 800,90 L 800,140 L 520,140 L 520,130 L 0,130 Z" fill="#88D7C0"/>
    <path d="M 0,150 L 520,150 L 520,175 L 800,175 L 800,225 L 520,225 L 520,200 L 0,200 Z" fill="#4B937D"/>
    <path d="M 0,235 L 520,235 L 520,220 L 800,220 L 800,270 L 520,270 L 520,260 L 0,260 Z" fill="#9CA3AF"/>
    <path d="M 0,280 L 520,280 L 520,305 L 800,305 L 800,355 L 520,355 L 520,330 L 0,330 Z" fill="#374151"/>
    <line x1="0" y1="380" x2="800" y2="380" stroke="#374151" stroke-width="10" stroke-linecap="round"/>
  </g>
</svg>`;

  const landscapeSizes = [
    { name: 'mdpi', w: 480, h: 320 },
    { name: 'hdpi', w: 800, h: 480 },
    { name: 'xhdpi', w: 1280, h: 720 },
    { name: 'xxhdpi', w: 1600, h: 960 },
    { name: 'xxxhdpi', w: 1920, h: 1280 },
  ];

  for (const s of landscapeSizes) {
    const dir = join(resDir, `drawable-land-${s.name}`);
    await sharp(Buffer.from(landscapeSvg))
      .resize(s.w, s.h, { fit: 'fill' })
      .png()
      .toFile(join(dir, 'splash.png'));
    console.log(`  drawable-land-${s.name}/splash.png (${s.w}x${s.h})`);
  }

  // Also update the main drawable/splash.png
  await sharp(Buffer.from(splashSvg))
    .resize(720, 1280, { fit: 'fill' })
    .png()
    .toFile(join(resDir, 'drawable', 'splash.png'));
  console.log('  drawable/splash.png (720x1280)');

  console.log('\nSplash screens geradas com sucesso!');
}

main().catch(err => {
  console.error('Erro:', err.message);
  process.exit(1);
});
