const fs = require('fs');
const path = require('path');

const root = __dirname;
const resDir = path.join(root, 'android', 'app', 'src', 'main', 'res');

const icon512Path = path.join(root, 'icon-512.png');
const icon192Path = path.join(root, 'icon-192.png');

if (fs.existsSync(resDir)) {
  const mipmapDirs = [
    'mipmap-mdpi',
    'mipmap-hdpi',
    'mipmap-xhdpi',
    'mipmap-xxhdpi',
    'mipmap-xxxhdpi'
  ];

  mipmapDirs.forEach(dirName => {
    const targetDir = path.join(resDir, dirName);
    if (fs.existsSync(targetDir)) {
      fs.copyFileSync(icon192Path, path.join(targetDir, 'ic_launcher.png'));
      fs.copyFileSync(icon192Path, path.join(targetDir, 'ic_launcher_round.png'));
      fs.copyFileSync(icon512Path, path.join(targetDir, 'ic_launcher_foreground.png'));
      console.log(`Updated icons in: ${dirName}`);
    }
  });

  // Also update splash screens if present
  const drawableDirs = [
    'drawable-port-hdpi',
    'drawable-port-mdpi',
    'drawable-port-xhdpi',
    'drawable-port-xxhdpi',
    'drawable-port-xxxhdpi'
  ];

  drawableDirs.forEach(dirName => {
    const targetDir = path.join(resDir, dirName);
    if (fs.existsSync(targetDir)) {
      const splashDest = path.join(targetDir, 'splash.png');
      if (fs.existsSync(splashDest)) {
        fs.copyFileSync(icon512Path, splashDest);
        console.log(`Updated splash in: ${dirName}`);
      }
    }
  });

  console.log('✅ Android mipmap icons and splash screens updated successfully!');
}
