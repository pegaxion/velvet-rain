# 🌧️ VelvetRain — Ambient Sleep, Rain & Focus Mixer

> **Aesthetic, zero-distraction ambient sound mixer for deep sleep, ADHD focus, and bedtime relaxation.**

Built with modern Web Audio synthesis, responsive OLED Dark UI, and packaged for Android & iOS via Capacitor 6.

---

## 🌟 Key Features

* **True Procedural Web Audio Engine:**
  * 100% gapless audio synthesis — zero audio loop clicks, pops, or stutters.
  * 9 multi-track ambient sound layers: Heavy Rain, Distant Thunder, Cozy Campfire, Deep Brown Noise, Night Crickets, Ocean Swell, Gentle Breeze, Delta Waves (2.5Hz Binaural Beats), Bedroom Fan.
  * Individual volume sliders with real-time percentage readouts.
  * Master dynamics compressor & limiter to eliminate distortion.
* **Curated Atmospheres:**
  * 1-tap presets: *Midnight Storm*, *Cozy Hearth*, *Moonlit Shore*, *ADHD Deep Focus*, *Deep Delta Sleep*, *Cool Breeze*.
* **Custom Mix Presets:**
  * Save unlimited personalized sound combinations to local storage.
* **Smart Sleep Dimmer:**
  * Timers for 15m, 30m, 45m, 60m, 90m, or continuous.
  * Exponential volume fade-out over the final minutes.
* **4-7-8 Sleep Breathing Pacer:**
  * Guided visual relaxation circle (4s Inhale, 7s Hold, 8s Exhale) to activate the parasympathetic nervous system.
* **True OLED Pitch-Black Mode:**
  * Pitch-black background (`#000000`) for AMOLED battery savings and comfortable dark-bedroom viewing.
* **100% Offline & Private:**
  * Zero servers, zero trackers, zero accounts. Works in Airplane Mode.

---

## 🚀 Quick Start (Local Preview)

To run and test the app locally in your browser:

### Option 1: Double-Click
Double-click `Start-Velvet-Rain.bat`

### Option 2: Command Line
```bash
node server.js
```
Then open: **`http://localhost:3030`**

---

## 📦 Project Structure

```text
velvet-rain/
├── index.html                   # Semantic HTML5 App Shell & Modals
├── styles.css                   # OLED Dark Theme & Glassmorphism Styling
├── app.js                       # UI Controller, Presets, Timer, & Canvas Rain
├── audio-engine.js              # High-Fidelity Procedural Web Audio Engine
├── manifest.json                # PWA Manifest
├── sw.js                        # Offline Service Worker
├── privacy-policy.html          # Google Play & App Store Compliant Privacy Policy
├── generate-icons.js            # Pure Node.js PNG Icon Generator
├── build.js                     # Asset compiler into /www
├── server.js                    # Local test server (port 3030)
├── Start-Velvet-Rain.bat        # 1-click Windows runner
├── capacitor.config.json        # Capacitor 6 Android & iOS Native Config
├── PLAY_STORE_LAUNCH_GUIDE.md   # Step-by-step Play Store & 14-day Testing Guide
├── .github/workflows/
│   └── build-apk.yml            # Automated GitHub Actions Cloud APK/AAB Builder
├── android/                     # Full Native Android Studio Project
│   └── app/src/main/
│       ├── AndroidManifest.xml  # Configured with Foreground Audio Permissions
│       └── res/                 # High-Res Icons & Splash Screens
└── www/                         # Packaged Production Web Assets
```

---

## 📱 Compiling Android APK & Google Play Bundle

### Method A: Automated Cloud Build (Recommended)
1. Push this folder to a GitHub repository.
2. Go to the **Actions** tab on GitHub.
3. The `Build VelvetRain Android APK & AAB` workflow will run automatically.
4. Download the ready-to-install `.apk` directly from GitHub Artifacts!

### Method B: Local Sync (if Android Studio is installed)
```bash
node build.js
npx cap sync android
npx cap open android
```

---

## 📜 License
MIT License • Built by Velvet Labs
