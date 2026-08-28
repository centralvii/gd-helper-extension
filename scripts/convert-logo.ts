import sharp from 'sharp';
import path from 'path';
import fs from 'fs';

const srcLogo = path.resolve('icon.jpg');
const iconsDir = path.resolve('public/icons');

if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
}

async function convert() {
    console.log('Reading source logo:', srcLogo);

    // Convert to full-res logo.png
    await sharp(srcLogo).png().toFile(path.join(iconsDir, 'logo.png'));
    console.log('Created logo.png');

    // Convert to 128x128
    await sharp(srcLogo)
        .resize(128, 128, { fit: 'cover' })
        .png()
        .toFile(path.join(iconsDir, 'icon128.png'));
    console.log('Created icon128.png');

    // Convert to 48x48
    await sharp(srcLogo)
        .resize(48, 48, { fit: 'cover' })
        .png()
        .toFile(path.join(iconsDir, 'icon48.png'));
    console.log('Created icon48.png');

    // Convert to 16x16
    await sharp(srcLogo)
        .resize(16, 16, { fit: 'cover' })
        .png()
        .toFile(path.join(iconsDir, 'icon16.png'));
    console.log('Created icon16.png');
}

convert().catch((err) => {
    console.error('Error generating icons:', err);
    process.exit(1);
});
