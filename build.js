const fs = require('fs');
const path = require('path');

const rootDir = __dirname;
const wwwDir = path.join(rootDir, 'www');
const androidPublicDir = path.join(rootDir, 'android', 'app', 'src', 'main', 'assets', 'public');

// Ensure clean directories
if (!fs.existsSync(wwwDir)) {
  fs.mkdirSync(wwwDir, { recursive: true });
}
if (fs.existsSync(path.join(rootDir, 'android')) && !fs.existsSync(androidPublicDir)) {
  fs.mkdirSync(androidPublicDir, { recursive: true });
}

const filesToCopy = [
  'index.html',
  'styles.css',
  'app.js',
  'audio-engine.js',
  'manifest.json',
  'sw.js',
  'privacy-policy.html',
  'icon-192.png',
  'icon-512.png',
  'icon-maskable.png',
  'apple-touch-icon.png'
];

filesToCopy.forEach(file => {
  const src = path.join(rootDir, file);
  if (fs.existsSync(src)) {
    // Copy to www
    const destWww = path.join(wwwDir, file);
    fs.copyFileSync(src, destWww);

    // Sync to android public assets if directory exists
    if (fs.existsSync(androidPublicDir)) {
      const destAndroid = path.join(androidPublicDir, file);
      fs.copyFileSync(src, destAndroid);
    }

    console.log(`Synced: ${file}`);
  } else {
    console.warn(`Warning: file not found: ${file}`);
  }
});

console.log('✅ VelvetRain assets synchronized successfully to /www and /android!');
