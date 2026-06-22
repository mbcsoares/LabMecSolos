import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');

const svgPath = join(projectRoot, 'public', 'assets', 'icon', 'icon.svg');
const svgBuffer = readFileSync(svgPath);

async function generatePNG(size, outputPath) {
  const dir = dirname(outputPath);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  await sharp(svgBuffer).resize(size, size).png().toFile(outputPath);
  console.log(`  ${size}x${size} -> ${outputPath}`);
}

async function main() {
  console.log('Gerando icones do LabMecSolos...\n');

  // Favicon (multiple sizes in one file? No, use 64x64 as favicon.png)
  console.log('Favicon:');
  await generatePNG(64, join(projectRoot, 'public', 'favicon.png'));

  // PWA icons
  console.log('\nPWA icons:');
  const iconDir = join(projectRoot, 'public', 'assets', 'icon');
  await generatePNG(192, join(iconDir, 'icon-192.png'));
  await generatePNG(512, join(iconDir, 'icon-512.png'));

  // Android launcher icons (legacy + round)
  const androidRes = join(projectRoot, 'android', 'app', 'src', 'main', 'res');
  const densities = [
    { name: 'mdpi', size: 48, foregroundSize: 108 },
    { name: 'hdpi', size: 72, foregroundSize: 162 },
    { name: 'xhdpi', size: 96, foregroundSize: 216 },
    { name: 'xxhdpi', size: 144, foregroundSize: 324 },
    { name: 'xxxhdpi', size: 192, foregroundSize: 432 },
  ];

  console.log('\nAndroid launcher icons:');
  for (const d of densities) {
    const mipmapDir = join(androidRes, `mipmap-${d.name}`);
    await generatePNG(d.size, join(mipmapDir, 'ic_launcher.png'));
    await generatePNG(d.size, join(mipmapDir, 'ic_launcher_round.png'));
    await generatePNG(d.foregroundSize, join(mipmapDir, 'ic_launcher_foreground.png'));
  }

  // Also generate for the drawable directories (native splash uses these)
  // Actually, the default Ionic drawables are used for splash, not launcher

  // Create foreground-only icon on transparent background for adaptive icons
  console.log('\nAdaptive icon foreground (transparent):');
  // Read the icon.svg and modify to use a different SVG without background
  // For now, just use the same icon - the gradient bg works fine
  
  // Also create a legacy icon at high-res in drawable for good measure
  await generatePNG(512, join(androidRes, 'drawable', 'ic_launcher.png'));
  
  // Also update drawable-port-* splash icons to use our branding
  // (skip for now - splash uses existing files)

  console.log('\nTodos os icones gerados com sucesso!');
}

main().catch(err => {
  console.error('Erro:', err.message);
  process.exit(1);
});
