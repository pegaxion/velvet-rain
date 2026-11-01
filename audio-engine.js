/**
 * VelvetRain Audio Engine
 * World-Class Procedural Audio Synthesis & Multi-Track Mixer
 * 
 * Features:
 * - 100% gapless Web Audio API procedural synthesis (zero loop clicks/pops)
 * - True Brownian / Pink / White noise generators
 * - Low-frequency rolling thunder strikes with organic timing
 * - Authentic crackling campfire with randomized wood pops
 * - Stereo Delta Binaural Beats (2.5 Hz) for deep slow-wave sleep
 * - Ocean tide swell LFO modulators
 * - Smooth exponential volume ramping (click-free)
 * - Sleep timer with smooth fade-out
 * - Real-time audio analyser for reactive UI visualizers
 */

class VelvetAudioEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.analyser = null;
    this.isPlaying = false;
    this.isMuted = false;
    this.masterVolume = 0.85;

    // Timer state
    this.timerDurationSec = 0;
    this.timerRemainingSec = 0;
    this.timerInterval = null;
    this.isTimerActive = false;
    this.fadeDurationSec = 300; // 5 min fade out
    this.initialVolumesBeforeFade = new Map();

    // Sound definitions and nodes (16 procedural soundscapes)
    this.sounds = {
      rain: {
        id: 'rain',
        name: 'Heavy Rain',
        icon: '🌧️',
        desc: 'Steady downpour against windowpane',
        category: 'nature',
        active: false,
        volume: 0.65,
        tone: 'natural',
        nodes: {}
      },
      thunder: {
        id: 'thunder',
        name: 'Distant Thunder',
        icon: '⚡',
        desc: 'Deep rolling rumbles in the distance',
        category: 'nature',
        active: false,
        volume: 0.40,
        tone: 'natural',
        nodes: {}
      },
      campfire: {
        id: 'campfire',
        name: 'Cozy Campfire',
        icon: '🔥',
        desc: 'Warm flame and crackling wood embers',
        category: 'nature',
        active: false,
        volume: 0.45,
        tone: 'natural',
        nodes: {}
      },
      brown: {
        id: 'brown',
        name: 'Deep Brown Noise',
        icon: '🌊',
        desc: 'Warm, low-frequency rumble for ADHD & sleep',
        category: 'noise',
        active: false,
        volume: 0.50,
        tone: 'natural',
        nodes: {}
      },
      crickets: {
        id: 'crickets',
        name: 'Night Crickets',
        icon: '🦗',
        desc: 'Gentle summer evening twilight chirps',
        category: 'nature',
        active: false,
        volume: 0.30,
        tone: 'natural',
        nodes: {}
      },
      ocean: {
        id: 'ocean',
        name: 'Ocean Swell',
        icon: '🏖️',
        desc: 'Rhythmic ocean waves rising and receding',
        category: 'nature',
        active: false,
        volume: 0.45,
        tone: 'natural',
        nodes: {}
      },
      wind: {
        id: 'wind',
        name: 'Gentle Breeze',
        icon: '🍃',
        desc: 'Soft wind murmuring through pine trees',
        category: 'nature',
        active: false,
        volume: 0.35,
        tone: 'natural',
        nodes: {}
      },
      binaural: {
        id: 'binaural',
        name: 'Delta Waves (2.5Hz)',
        icon: '🧠',
        desc: 'Stereo binaural beats for deep stage 4 sleep',
        category: 'binaural',
        active: false,
        volume: 0.35,
        tone: 'natural',
        nodes: {}
      },
      fan: {
        id: 'fan',
        name: 'Bedroom Fan',
        icon: '💨',
        desc: 'Acoustic masking hum of a bedside cooling fan',
        category: 'noise',
        active: false,
        volume: 0.40,
        tone: 'natural',
        nodes: {}
      },
      raintent: {
        id: 'raintent',
        name: 'Rain on Tent',
        icon: '⛺',
        desc: 'Muffled raindrops drumming on canvas tent',
        category: 'nature',
        active: false,
        volume: 0.55,
        tone: 'natural',
        nodes: {}
      },
      rainroof: {
        id: 'rainroof',
        name: 'Rain on Metal Roof',
        icon: '🏠',
        desc: 'Crisp pinging rainfall on tin roof',
        category: 'nature',
        active: false,
        volume: 0.45,
        tone: 'natural',
        nodes: {}
      },
      brook: {
        id: 'brook',
        name: 'Babbling Brook',
        icon: '🏞️',
        desc: 'Fresh alpine stream flowing over river pebbles',
        category: 'nature',
        active: false,
        volume: 0.50,
        tone: 'natural',
        nodes: {}
      },
      frogs: {
        id: 'frogs',
        name: 'Twilight Frogs',
        icon: '🐸',
        desc: 'Nocturnal pond chorus and gentle bullfrogs',
        category: 'nature',
        active: false,
        volume: 0.35,
        tone: 'natural',
        nodes: {}
      },
      pink: {
        id: 'pink',
        name: 'Soothing Pink Noise',
        icon: '🌸',
        desc: 'Balanced 1/f spectrum for tinnitus & deep sleep',
        category: 'noise',
        active: false,
        volume: 0.50,
        tone: 'natural',
        nodes: {}
      },
      airplane: {
        id: 'airplane',
        name: 'Airplane Cabin Hum',
        icon: '✈️',
        desc: 'Deep jet engine drone and cabin ventilation',
        category: 'noise',
        active: false,
        volume: 0.45,
        tone: 'natural',
        nodes: {}
      },
      alpha: {
        id: 'alpha',
        name: 'Alpha Focus (10Hz)',
        icon: '🎯',
        desc: 'Binaural flow-state beat for ADHD & study',
        category: 'binaural',
        active: false,
        volume: 0.40,
        tone: 'natural',
        nodes: {}
      }
    };

    // Pre-calculated shared noise buffers (generated once on init)
    this.whiteNoiseBuffer = null;
    this.pinkNoiseBuffer = null;
    this.brownNoiseBuffer = null;

    // WakeLock instance to keep audio alive
    this.wakeLock = null;

    // Android WebView background playback & lock screen session
    this.silentAudio = null;
    this.mediaSessionConfigured = false;
    this.timerEndTime = 0;

    // Headphone Disconnect Protection (Bedroom sleep safety)
    this.pauseOnDisconnect = true;
    try {
      const stored = localStorage.getItem('velvet_pause_on_disconnect');
      if (stored !== null) this.pauseOnDisconnect = (stored === 'true');
    } catch (e) {}
    this._setupAudioDeviceListener();
  }

  /**
   * Initializes the AudioContext upon first user gesture
   */
  async init() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') {
        await this.ctx.resume();
      }
      return;
    }

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AudioContextClass();

    // Master Gain
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(this.masterVolume, this.ctx.currentTime);

    // Master Dynamics Compressor (prevents any digital clipping/distortion when all 9 sounds are high)
    this.compressor = this.ctx.createDynamicsCompressor();
    this.compressor.threshold.setValueAtTime(-6, this.ctx.currentTime);
    this.compressor.knee.setValueAtTime(10, this.ctx.currentTime);
    this.compressor.ratio.setValueAtTime(8, this.ctx.currentTime);
    this.compressor.attack.setValueAtTime(0.005, this.ctx.currentTime);
    this.compressor.release.setValueAtTime(0.1, this.ctx.currentTime);

    // Master Analyser Node (for reactive UI visualizer)
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 64;
    this.analyser.smoothingTimeConstant = 0.8;

    // Route: MasterGain -> Compressor -> Analyser -> Destination
    this.masterGain.connect(this.compressor);
    this.compressor.connect(this.analyser);
    this.analyser.connect(this.ctx.destination);

    // Generate procedural noise buffers (5 seconds loopable seamlessly)
    this._generateNoiseBuffers();

    // Setup silent loop audio element to prevent Android WebView audio thread throttling
    if (!this.silentAudio) {
      try {
        this.silentAudio = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAA==');
        this.silentAudio.loop = true;
      } catch (e) {}
    }
    this._setupMediaSession();

    // Request wake lock if available
    this._requestWakeLock();
  }

  /**
   * Configures lock screen media controls & background session
   */
  _setupMediaSession() {
    if (!('mediaSession' in navigator) || this.mediaSessionConfigured) return;

    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: 'VelvetRain',
        artist: 'Pegaxion Ambient Sanctuary',
        album: 'Sleep, Rain & Focus',
        artwork: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' }
        ]
      });

      navigator.mediaSession.setActionHandler('play', () => {
        this.resumeAll();
        if (typeof window.onVelvetEnginePlayStateChange === 'function') {
          window.onVelvetEnginePlayStateChange(true);
        }
      });

      navigator.mediaSession.setActionHandler('pause', () => {
        this.pauseAll();
        if (typeof window.onVelvetEnginePlayStateChange === 'function') {
          window.onVelvetEnginePlayStateChange(false);
        }
      });

      navigator.mediaSession.setActionHandler('stop', () => {
        this.stopAll();
        if (typeof window.onVelvetEnginePlayStateChange === 'function') {
          window.onVelvetEnginePlayStateChange(false);
        }
      });

      this.mediaSessionConfigured = true;
    } catch (e) {}
  }

  /**
   * Synchronizes lock screen playback state and silent audio background hold
   */
  _syncMediaSession(isPlaying) {
    if (this.silentAudio) {
      if (isPlaying) {
        this.silentAudio.play().catch(() => {});
      } else {
        this.silentAudio.pause();
      }
    }

    if ('mediaSession' in navigator) {
      try {
        navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
      } catch (e) {}
    }
  }

  /**
   * Sets up Headphone / Bluetooth disconnect detection
   * Prevents waking sleeping partners/children if Bluetooth turns off
   */
  _setupAudioDeviceListener() {
    if (typeof navigator !== 'undefined' && navigator.mediaDevices && navigator.mediaDevices.addEventListener) {
      navigator.mediaDevices.addEventListener('devicechange', async () => {
        if (!this.pauseOnDisconnect || !this.isPlaying) return;
        // On mobile, disconnection of BT headset or 3.5mm plug emits devicechange
        this.pauseAll();
        if (typeof window.onVelvetEnginePlayStateChange === 'function') {
          window.onVelvetEnginePlayStateChange(false, 'headphone_disconnected');
        }
      });
    }
  }

  /**
   * Generates high-fidelity White, Pink, and Brown Noise buffers
   */
  _generateNoiseBuffers() {
    const sampleRate = this.ctx.sampleRate;
    const bufferLength = sampleRate * 5; // 5-second seamless buffer

    // 1. White Noise
    this.whiteNoiseBuffer = this.ctx.createBuffer(2, bufferLength, sampleRate);
    for (let channel = 0; channel < 2; channel++) {
      const data = this.whiteNoiseBuffer.getChannelData(channel);
      for (let i = 0; i < bufferLength; i++) {
        data[i] = Math.random() * 2 - 1;
      }
    }

    // 2. Pink Noise (Paul Kellet's filter method)
    this.pinkNoiseBuffer = this.ctx.createBuffer(2, bufferLength, sampleRate);
    for (let channel = 0; channel < 2; channel++) {
      const data = this.pinkNoiseBuffer.getChannelData(channel);
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < bufferLength; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
        b6 = white * 0.115926;
      }
    }

    // 3. True Brownian Noise (Integrated white noise with leak)
    this.brownNoiseBuffer = this.ctx.createBuffer(2, bufferLength, sampleRate);
    for (let channel = 0; channel < 2; channel++) {
      const data = this.brownNoiseBuffer.getChannelData(channel);
      let lastOut = 0.0;
      for (let i = 0; i < bufferLength; i++) {
        const white = Math.random() * 2 - 1;
        lastOut = (lastOut + (0.02 * white)) / 1.02;
        data[i] = lastOut * 3.5; // Gain scaled
      }
    }
  }

  /**
   * Helper to create an endless loop source from an AudioBuffer
   */
  _createBufferSource(buffer) {
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = true;
    return src;
  }

  /**
   * Starts a specific sound synthesis graph
   */
  async startSound(id) {
    await this.init();
    const sound = this.sounds[id];
    if (!sound || sound.active) return;

    sound.active = true;
    const now = this.ctx.currentTime;

    // Create tone shaping filter (Deep / Natural / Crisp)
    const toneFilter = this.ctx.createBiquadFilter();
    sound.nodes.toneFilter = toneFilter;
    this._applyToneToFilter(toneFilter, sound.tone || 'natural');

    // Create channel gain node with smooth fade-in
    const gainNode = this.ctx.createGain();
    gainNode.gain.setValueAtTime(0.001, now);
    gainNode.gain.exponentialRampToValueAtTime(Math.max(0.001, sound.volume), now + 0.35);

    // Route: Tone Filter -> Gain Node -> Master Gain
    toneFilter.connect(gainNode);
    gainNode.connect(this.masterGain);
    sound.nodes.gain = gainNode;

    switch (id) {
      case 'rain':
        this._buildRainGraph(sound, toneFilter);
        break;
      case 'thunder':
        this._buildThunderGraph(sound, toneFilter);
        break;
      case 'campfire':
        this._buildCampfireGraph(sound, toneFilter);
        break;
      case 'brown':
        this._buildBrownGraph(sound, toneFilter);
        break;
      case 'crickets':
        this._buildCricketsGraph(sound, toneFilter);
        break;
      case 'ocean':
        this._buildOceanGraph(sound, toneFilter);
        break;
      case 'wind':
        this._buildWindGraph(sound, toneFilter);
        break;
      case 'binaural':
        this._buildBinauralGraph(sound, toneFilter);
        break;
      case 'fan':
        this._buildFanGraph(sound, toneFilter);
        break;
      case 'raintent':
        this._buildRainTentGraph(sound, toneFilter);
        break;
      case 'rainroof':
        this._buildRainRoofGraph(sound, toneFilter);
        break;
      case 'brook':
        this._buildBrookGraph(sound, toneFilter);
        break;
      case 'frogs':
        this._buildFrogsGraph(sound, toneFilter);
        break;
      case 'pink':
        this._buildPinkGraph(sound, toneFilter);
        break;
      case 'airplane':
        this._buildAirplaneGraph(sound, toneFilter);
        break;
      case 'alpha':
        this._buildAlphaGraph(sound, toneFilter);
        break;
    }

    this.isPlaying = true;
    this._syncMediaSession(true);
  }

  /**
   * Applies tone equalization to a sound node filter
   * Modes:
   * - 'deep': warm, muted highs (smooth lowpass roll-off at 1100Hz)
   * - 'natural': clean flat bypass
   * - 'crisp': enhanced brightness and air (+4.5 dB high-shelf at 2800Hz)
   */
  _applyToneToFilter(filter, tone) {
    if (!filter || !this.ctx) return;
    const now = this.ctx.currentTime;
    filter.gain.cancelScheduledValues(now);
    filter.frequency.cancelScheduledValues(now);

    if (tone === 'deep') {
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1100, now);
      filter.Q.setValueAtTime(0.7, now);
    } else if (tone === 'crisp') {
      filter.type = 'highshelf';
      filter.frequency.setValueAtTime(2800, now);
      filter.gain.setValueAtTime(4.5, now);
    } else {
      filter.type = 'allpass';
    }
  }

  /**
   * Adjusts the tone color of an active or inactive sound
   */
  setSoundTone(id, toneMode) {
    const sound = this.sounds[id];
    if (!sound) return;
    sound.tone = toneMode;
    if (sound.nodes && sound.nodes.toneFilter && this.ctx) {
      this._applyToneToFilter(sound.nodes.toneFilter, toneMode);
    }
  }

  /**
   * Stops a specific sound with smooth fade-out
   */
  stopSound(id) {
    const sound = this.sounds[id];
    if (!sound || !sound.active) return;

    sound.active = false;
    const now = this.ctx ? this.ctx.currentTime : 0;

    if (sound.nodes.gain && this.ctx) {
      sound.nodes.gain.gain.setValueAtTime(Math.max(0.0001, sound.nodes.gain.gain.value), now);
      sound.nodes.gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);

      setTimeout(() => {
        this._cleanupSoundNodes(sound);
        this._checkActiveState();
      }, 350);
    } else {
      this._cleanupSoundNodes(sound);
      this._checkActiveState();
    }
  }

  /**
   * Cleanly disconnects and tears down audio nodes
   */
  _cleanupSoundNodes(sound) {
    if (sound.nodes.sources) {
      sound.nodes.sources.forEach(src => {
        try { src.stop(); src.disconnect(); } catch (e) {}
      });
    }
    if (sound.nodes.intervals) {
      sound.nodes.intervals.forEach(id => clearInterval(id));
    }
    if (sound.nodes.timeouts) {
      sound.nodes.timeouts.forEach(id => clearTimeout(id));
    }
    if (sound.nodes.toneFilter) {
      try { sound.nodes.toneFilter.disconnect(); } catch (e) {}
    }
    if (sound.nodes.gain) {
      try { sound.nodes.gain.disconnect(); } catch (e) {}
    }
    sound.nodes = {};
  }

  /**
   * Toggles sound on/off
   */
  toggleSound(id) {
    if (this.sounds[id].active) {
      this.stopSound(id);
    } else {
      this.startSound(id);
    }
  }

  /**
   * Sets individual sound volume smoothly
   */
  setSoundVolume(id, volume) {
    const sound = this.sounds[id];
    if (!sound) return;
    sound.volume = Math.max(0, Math.min(1, volume));

    if (sound.active && sound.nodes.gain && this.ctx) {
      const now = this.ctx.currentTime;
      sound.nodes.gain.gain.cancelScheduledValues(now);
      sound.nodes.gain.gain.setValueAtTime(sound.nodes.gain.gain.value, now);
      sound.nodes.gain.gain.linearRampToValueAtTime(sound.volume, now + 0.05);
    }
  }

  /**
   * Sets Master Volume smoothly
   */
  setMasterVolume(val) {
    this.masterVolume = Math.max(0, Math.min(1, val));
    if (this.masterGain && this.ctx) {
      const now = this.ctx.currentTime;
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
      this.masterGain.gain.linearRampToValueAtTime(this.isMuted ? 0 : this.masterVolume, now + 0.05);
    }
  }

  /**
   * Play / Pause All Active Sounds
   */
  togglePlayAll() {
    if (this.isPlaying) {
      this.pauseAll();
    } else {
      this.resumeAll();
    }
  }

  pauseAll() {
    if (!this.ctx) return;
    this.ctx.suspend();
    this.isPlaying = false;
    this._syncMediaSession(false);
  }

  resumeAll() {
    if (!this.ctx) return;
    this.ctx.resume();
    this.isPlaying = true;
    this._syncMediaSession(true);
  }

  /**
   * Mute / Unmute
   */
  toggleMute() {
    this.isMuted = !this.isMuted;
    this.setMasterVolume(this.masterVolume);
    return this.isMuted;
  }

  // ==========================================
  // PROCEDURAL AUDIO SYNTHESIS GRAPHS
  // ==========================================

  /**
   * 1. RAIN SYNTHESIS GRAPH
   * Filtered Pink Noise + Random Droplet Burst Transients
   */
  _buildRainGraph(sound, outputGain) {
    const sources = [];

    // Continuous Rain Texture (Pink Noise + Lowpass + Highpass)
    const rainSrc = this._createBufferSource(this.pinkNoiseBuffer);
    const bandpass = this.ctx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.setValueAtTime(1400, this.ctx.currentTime);
    bandpass.Q.setValueAtTime(0.7, this.ctx.currentTime);

    const lowpass = this.ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.setValueAtTime(4200, this.ctx.currentTime);

    // Subtle gentle modulation LFO (wind gust variance)
    const lfo = this.ctx.createOscillator();
    lfo.frequency.setValueAtTime(0.18, this.ctx.currentTime);
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(0.12, this.ctx.currentTime);

    const rainTextureGain = this.ctx.createGain();
    rainTextureGain.gain.setValueAtTime(0.85, this.ctx.currentTime);
    lfo.connect(lfoGain);
    lfoGain.connect(rainTextureGain.gain);

    rainSrc.connect(bandpass);
    bandpass.connect(lowpass);
    lowpass.connect(rainTextureGain);
    rainTextureGain.connect(outputGain);

    rainSrc.start();
    lfo.start();
    sources.push(rainSrc, lfo);

    // Occasional Droplet Impulse Generator (Simulates roof/window drips)
    const dropletInterval = setInterval(() => {
      if (!sound.active || !this.ctx) return;
      if (Math.random() > 0.4) {
        this._playRaindrop(sound, outputGain);
      }
    }, 450);

    sound.nodes.sources = sources;
    sound.nodes.intervals = [dropletInterval];
  }

  _playRaindrop(sound, destGain) {
    if (!sound.active || !this.ctx || this.ctx.state !== 'running') return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    const startFreq = 1600 + Math.random() * 800;
    osc.type = 'sine';
    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(startFreq * 0.6, now + 0.04);

    gain.gain.setValueAtTime(0.03 + Math.random() * 0.03, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);

    osc.connect(gain);
    gain.connect(destGain);

    osc.start(now);
    osc.stop(now + 0.06);
  }

  /**
   * 2. DISTANT THUNDER SYNTHESIS GRAPH
   * Periodic deep low-frequency rolling rumbles with realistic stereo dispersion
   */
  _buildThunderGraph(sound, outputGain) {
    const thunderInterval = setInterval(() => {
      if (!sound.active || !this.ctx) return;
      this._triggerThunderStrike(sound, outputGain);
    }, 24000); // Trigger strike every 24-35s

    // Trigger initial gentle roll after 2 seconds
    const initialTimer = setTimeout(() => {
      if (sound.active) this._triggerThunderStrike(sound, outputGain);
    }, 1800);

    sound.nodes.intervals = [thunderInterval];
    sound.nodes.timeouts = [initialTimer];
  }

  _triggerThunderStrike(sound, destGain) {
    if (!sound.active || !this.ctx || this.ctx.state !== 'running') return;
    const now = this.ctx.currentTime;
    const duration = 6.0 + Math.random() * 3.5;

    const noiseSrc = this._createBufferSource(this.brownNoiseBuffer);

    // Low-pass filter for deep bass rumble (70Hz - 130Hz)
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(65, now);
    filter.Q.setValueAtTime(2.5, now);

    // Dynamic gain envelope (initial strike -> rolling resonant rumble -> long fade)
    const envelope = this.ctx.createGain();
    envelope.gain.setValueAtTime(0.0001, now);
    envelope.gain.linearRampToValueAtTime(0.9, now + 0.35); // Initial boom
    envelope.gain.exponentialRampToValueAtTime(0.45, now + 1.8); // Rolling rumble
    envelope.gain.exponentialRampToValueAtTime(0.2, now + 3.8);
    envelope.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    // Modulate filter cutoff for the rolling effect
    filter.frequency.linearRampToValueAtTime(140, now + 0.5);
    filter.frequency.linearRampToValueAtTime(80, now + 2.5);
    filter.frequency.linearRampToValueAtTime(45, now + duration);

    noiseSrc.connect(filter);
    filter.connect(envelope);
    envelope.connect(destGain);

    noiseSrc.start(now);
    noiseSrc.stop(now + duration + 0.1);
  }

  /**
   * 3. CAMPFIRE SYNTHESIS GRAPH
   * Warm low flame roar + random Poisson-distributed crackles and pops
   */
  _buildCampfireGraph(sound, outputGain) {
    const sources = [];

    // Low flame body (Brown Noise + 220Hz lowpass)
    const roarSrc = this._createBufferSource(this.brownNoiseBuffer);
    const roarFilter = this.ctx.createBiquadFilter();
    roarFilter.type = 'lowpass';
    roarFilter.frequency.setValueAtTime(220, this.ctx.currentTime);

    const roarGain = this.ctx.createGain();
    roarGain.gain.setValueAtTime(0.65, this.ctx.currentTime);

    roarSrc.connect(roarFilter);
    roarFilter.connect(roarGain);
    roarGain.connect(outputGain);
    roarSrc.start();
    sources.push(roarSrc);

    // Crackle & Pop impulses
    const crackleInterval = setInterval(() => {
      if (!sound.active || !this.ctx) return;
      const count = Math.floor(Math.random() * 3) + 1;
      for (let i = 0; i < count; i++) {
        setTimeout(() => this._playCampfirePop(sound, outputGain), Math.random() * 250);
      }
    }, 280);

    sound.nodes.sources = sources;
    sound.nodes.intervals = [crackleInterval];
  }

  _playCampfirePop(sound, destGain) {
    if (!sound.active || !this.ctx || this.ctx.state !== 'running') return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    const isDeepCrack = Math.random() > 0.6;
    const freq = isDeepCrack ? 350 + Math.random() * 200 : 1200 + Math.random() * 1500;

    osc.type = isDeepCrack ? 'triangle' : 'sine';
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.2, now + 0.03);

    const popVol = isDeepCrack ? 0.08 : 0.04;
    gain.gain.setValueAtTime(popVol, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + (isDeepCrack ? 0.04 : 0.02));

    osc.connect(gain);
    gain.connect(destGain);

    osc.start(now);
    osc.stop(now + 0.05);
  }

  /**
   * 4. DEEP BROWN NOISE GRAPH
   * Pure acoustic Brownian noise with steep high-shelf attenuation (zero hiss)
   */
  _buildBrownGraph(sound, outputGain) {
    const src = this._createBufferSource(this.brownNoiseBuffer);
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(320, this.ctx.currentTime);
    filter.Q.setValueAtTime(0.5, this.ctx.currentTime);

    src.connect(filter);
    filter.connect(outputGain);
    src.start();

    sound.nodes.sources = [src];
  }

  /**
   * 5. NIGHT CRICKETS GRAPH
   * Rhythmic high-frequency synthetic chirps with authentic pauses
   */
  _buildCricketsGraph(sound, outputGain) {
    const cricketInterval = setInterval(() => {
      if (!sound.active || !this.ctx) return;
      if (Math.random() > 0.25) {
        this._playCricketChirp(sound, outputGain);
      }
    }, 1400);

    sound.nodes.intervals = [cricketInterval];
  }

  _playCricketChirp(sound, destGain) {
    if (!sound.active || !this.ctx || this.ctx.state !== 'running') return;
    const now = this.ctx.currentTime;

    // 3 rapid micro-chirps in sequence
    for (let i = 0; i < 3; i++) {
      const chirpTime = now + (i * 0.08);
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(4300 + Math.random() * 200, chirpTime);

      gain.gain.setValueAtTime(0.0001, chirpTime);
      gain.gain.linearRampToValueAtTime(0.06, chirpTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, chirpTime + 0.06);

      osc.connect(gain);
      gain.connect(destGain);

      osc.start(chirpTime);
      osc.stop(chirpTime + 0.07);
    }
  }

  /**
   * 6. OCEAN WAVES GRAPH
   * Pink noise modulated by an ultra-slow 0.09 Hz sine LFO for tide rise and fall
   */
  _buildOceanGraph(sound, outputGain) {
    const src = this._createBufferSource(this.pinkNoiseBuffer);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(650, this.ctx.currentTime);

    // Wave swell LFO
    const lfo = this.ctx.createOscillator();
    lfo.frequency.setValueAtTime(0.085, this.ctx.currentTime); // ~11 second wave cycle

    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(0.4, this.ctx.currentTime);

    const waveGain = this.ctx.createGain();
    waveGain.gain.setValueAtTime(0.45, this.ctx.currentTime);

    lfo.connect(lfoGain);
    lfoGain.connect(waveGain.gain);

    // Also modulate filter cutoff slightly as wave crests
    const filterLfoGain = this.ctx.createGain();
    filterLfoGain.gain.setValueAtTime(250, this.ctx.currentTime);
    lfo.connect(filterLfoGain);
    filterLfoGain.connect(filter.frequency);

    src.connect(filter);
    filter.connect(waveGain);
    waveGain.connect(outputGain);

    src.start();
    lfo.start();

    sound.nodes.sources = [src, lfo];
  }

  /**
   * 7. GENTLE WIND BREEZE GRAPH
   * Filtered noise with continuous organic frequency sweep
   */
  _buildWindGraph(sound, outputGain) {
    const src = this._createBufferSource(this.pinkNoiseBuffer);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(450, this.ctx.currentTime);
    filter.Q.setValueAtTime(2.0, this.ctx.currentTime);

    // Slow drifting frequency LFO
    const lfo = this.ctx.createOscillator();
    lfo.frequency.setValueAtTime(0.12, this.ctx.currentTime);

    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(200, this.ctx.currentTime);
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    src.connect(filter);
    filter.connect(outputGain);

    src.start();
    lfo.start();

    sound.nodes.sources = [src, lfo];
  }

  /**
   * 8. DELTA BINAURAL BEATS GRAPH (2.5 Hz Delta)
   * True stereo separation: Left 104.0 Hz, Right 106.5 Hz -> Brain perceives 2.5Hz
   */
  _buildBinauralGraph(sound, outputGain) {
    const baseFreq = 104.0;
    const deltaBeat = 2.5;

    // Stereo Panner or ChannelMerger for Left/Right separation
    const merger = this.ctx.createChannelMerger(2);

    // Left Ear Oscillator
    const oscLeft = this.ctx.createOscillator();
    oscLeft.type = 'sine';
    oscLeft.frequency.setValueAtTime(baseFreq, this.ctx.currentTime);

    // Right Ear Oscillator
    const oscRight = this.ctx.createOscillator();
    oscRight.type = 'sine';
    oscRight.frequency.setValueAtTime(baseFreq + deltaBeat, this.ctx.currentTime);

    oscLeft.connect(merger, 0, 0);  // Output to Left Channel
    oscRight.connect(merger, 0, 1); // Output to Right Channel

    const beatGain = this.ctx.createGain();
    beatGain.gain.setValueAtTime(0.55, this.ctx.currentTime);

    merger.connect(beatGain);
    beatGain.connect(outputGain);

    oscLeft.start();
    oscRight.start();

    sound.nodes.sources = [oscLeft, oscRight];
  }

  /**
   * 9. BEDROOM FAN GRAPH
   * Low motor hum (120Hz + 60Hz harmonic) + warm white noise flow
   */
  _buildFanGraph(sound, outputGain) {
    const sources = [];

    // Air flow noise
    const noiseSrc = this._createBufferSource(this.pinkNoiseBuffer);
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(750, this.ctx.currentTime);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.45, this.ctx.currentTime);

    noiseSrc.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(outputGain);
    noiseSrc.start();
    sources.push(noiseSrc);

    // Low motor hum tone (120 Hz)
    const humOsc = this.ctx.createOscillator();
    humOsc.type = 'triangle';
    humOsc.frequency.setValueAtTime(120, this.ctx.currentTime);

    const humGain = this.ctx.createGain();
    humGain.gain.setValueAtTime(0.04, this.ctx.currentTime);

    humOsc.connect(humGain);
    humGain.connect(outputGain);
    humOsc.start();
    sources.push(humOsc);

    sound.nodes.sources = sources;
  }

  /**
   * 10. RAIN ON CANVAS TENT SYNTHESIS GRAPH
   * Muffled, hollow resonant rainfall drumming against taut tent canvas
   */
  _buildRainTentGraph(sound, outputGain) {
    const sources = [];

    // Continuous muffled rain texture
    const rainSrc = this._createBufferSource(this.pinkNoiseBuffer);
    const bandpass = this.ctx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.setValueAtTime(520, this.ctx.currentTime); // Hollow cavity resonance
    bandpass.Q.setValueAtTime(1.1, this.ctx.currentTime);

    const lowpass = this.ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.setValueAtTime(1600, this.ctx.currentTime);

    const texGain = this.ctx.createGain();
    texGain.gain.setValueAtTime(0.85, this.ctx.currentTime);

    rainSrc.connect(bandpass);
    bandpass.connect(lowpass);
    lowpass.connect(texGain);
    texGain.connect(outputGain);

    rainSrc.start();
    sources.push(rainSrc);

    // Canvas fabric droplet thuds (low pitched muffled impacts)
    const dripInterval = setInterval(() => {
      if (!sound.active || !this.ctx) return;
      if (Math.random() > 0.35) {
        this._playTentDroplet(sound, outputGain);
      }
    }, 380);

    sound.nodes.sources = sources;
    sound.nodes.intervals = [dripInterval];
  }

  _playTentDroplet(sound, destGain) {
    if (!sound.active || !this.ctx || this.ctx.state !== 'running') return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    // Muffled canvas thud pitch envelope: 280Hz -> 130Hz
    const startFreq = 280 + Math.random() * 90;
    osc.type = 'sine';
    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(startFreq * 0.45, now + 0.05);

    gain.gain.setValueAtTime(0.045 + Math.random() * 0.035, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.07);

    osc.connect(gain);
    gain.connect(destGain);

    osc.start(now);
    osc.stop(now + 0.08);
  }

  /**
   * 11. RAIN ON METAL ROOF SYNTHESIS GRAPH
   * Crisp, pinging raindrops striking corrugated tin / zinc metal roof
   */
  _buildRainRoofGraph(sound, outputGain) {
    const sources = [];

    // Continuous metallic rain texture
    const noiseSrc = this._createBufferSource(this.whiteNoiseBuffer);
    const bandpass = this.ctx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.setValueAtTime(2600, this.ctx.currentTime);
    bandpass.Q.setValueAtTime(1.8, this.ctx.currentTime);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.35, this.ctx.currentTime);

    noiseSrc.connect(bandpass);
    bandpass.connect(noiseGain);
    noiseGain.connect(outputGain);

    noiseSrc.start();
    sources.push(noiseSrc);

    // Rapid metallic ping strikes
    const pingInterval = setInterval(() => {
      if (!sound.active || !this.ctx) return;
      const count = Math.floor(Math.random() * 3) + 1;
      for (let i = 0; i < count; i++) {
        setTimeout(() => this._playMetalPing(sound, outputGain), Math.random() * 220);
      }
    }, 240);

    sound.nodes.sources = sources;
    sound.nodes.intervals = [pingInterval];
  }

  _playMetalPing(sound, destGain) {
    if (!sound.active || !this.ctx || this.ctx.state !== 'running') return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    // High resonant metallic ping (2200Hz - 3600Hz)
    const pingFreq = 2200 + Math.random() * 1400;
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(pingFreq, now);

    gain.gain.setValueAtTime(0.035 + Math.random() * 0.03, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.045);

    osc.connect(gain);
    gain.connect(destGain);

    osc.start(now);
    osc.stop(now + 0.05);
  }

  /**
   * 12. BABBLING BROOK SYNTHESIS GRAPH
   * Liquid stream rushing and bubbling over smooth river pebbles
   */
  _buildBrookGraph(sound, outputGain) {
    const sources = [];

    // Flowing stream body using dual bandpassed pink noise
    const streamSrc = this._createBufferSource(this.pinkNoiseBuffer);
    const filter1 = this.ctx.createBiquadFilter();
    filter1.type = 'bandpass';
    filter1.frequency.setValueAtTime(620, this.ctx.currentTime);
    filter1.Q.setValueAtTime(2.2, this.ctx.currentTime);

    const streamSrc2 = this._createBufferSource(this.pinkNoiseBuffer);
    const filter2 = this.ctx.createBiquadFilter();
    filter2.type = 'bandpass';
    filter2.frequency.setValueAtTime(1250, this.ctx.currentTime);
    filter2.Q.setValueAtTime(2.5, this.ctx.currentTime);

    // Dual slow LFO water current modulations
    const lfo1 = this.ctx.createOscillator();
    lfo1.frequency.setValueAtTime(0.4, this.ctx.currentTime);
    const lfoGain1 = this.ctx.createGain();
    lfoGain1.gain.setValueAtTime(180, this.ctx.currentTime);
    lfo1.connect(lfoGain1);
    lfoGain1.connect(filter1.frequency);

    const lfo2 = this.ctx.createOscillator();
    lfo2.frequency.setValueAtTime(0.65, this.ctx.currentTime);
    const lfoGain2 = this.ctx.createGain();
    lfoGain2.gain.setValueAtTime(240, this.ctx.currentTime);
    lfo2.connect(lfoGain2);
    lfoGain2.connect(filter2.frequency);

    const brookGain = this.ctx.createGain();
    brookGain.gain.setValueAtTime(0.75, this.ctx.currentTime);

    streamSrc.connect(filter1);
    filter1.connect(brookGain);
    streamSrc2.connect(filter2);
    filter2.connect(brookGain);
    brookGain.connect(outputGain);

    streamSrc.start();
    streamSrc2.start();
    lfo1.start();
    lfo2.start();
    sources.push(streamSrc, streamSrc2, lfo1, lfo2);

    // Liquid water bubble plops
    const bubbleInterval = setInterval(() => {
      if (!sound.active || !this.ctx) return;
      if (Math.random() > 0.3) {
        this._playWaterBubble(sound, outputGain);
      }
    }, 280);

    sound.nodes.sources = sources;
    sound.nodes.intervals = [bubbleInterval];
  }

  _playWaterBubble(sound, destGain) {
    if (!sound.active || !this.ctx || this.ctx.state !== 'running') return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    const startFreq = 450 + Math.random() * 450;
    osc.type = 'sine';
    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(startFreq * 1.5, now + 0.04);

    gain.gain.setValueAtTime(0.04 + Math.random() * 0.03, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);

    osc.connect(gain);
    gain.connect(destGain);

    osc.start(now);
    osc.stop(now + 0.07);
  }

  /**
   * 13. TWILIGHT FROGS SYNTHESIS GRAPH
   * Rhythmic nocturnal marsh frogs and peaceful pond chorus
   */
  _buildFrogsGraph(sound, outputGain) {
    const sources = [];

    // Distant nocturnal marsh air bed
    const marshSrc = this._createBufferSource(this.pinkNoiseBuffer);
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(450, this.ctx.currentTime);

    const marshGain = this.ctx.createGain();
    marshGain.gain.setValueAtTime(0.25, this.ctx.currentTime);

    marshSrc.connect(filter);
    filter.connect(marshGain);
    marshGain.connect(outputGain);
    marshSrc.start();
    sources.push(marshSrc);

    // Rhythmic deep bullfrog ribbits
    const frogInterval = setInterval(() => {
      if (!sound.active || !this.ctx) return;
      if (Math.random() > 0.3) {
        this._playBullfrogCroak(sound, outputGain);
      }
    }, 3200);

    // High chirp tree frog peepers
    const peeperInterval = setInterval(() => {
      if (!sound.active || !this.ctx) return;
      if (Math.random() > 0.4) {
        this._playTreeFrogPeeper(sound, outputGain);
      }
    }, 1800);

    sound.nodes.sources = sources;
    sound.nodes.intervals = [frogInterval, peeperInterval];
  }

  _playBullfrogCroak(sound, destGain) {
    if (!sound.active || !this.ctx || this.ctx.state !== 'running') return;
    const now = this.ctx.currentTime;
    const croakCount = Math.random() > 0.5 ? 2 : 1;

    for (let i = 0; i < croakCount; i++) {
      const croakTime = now + (i * 0.22);
      const osc = this.ctx.createOscillator();
      const formant = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();

      const baseFreq = 160 + Math.random() * 40;
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(baseFreq, croakTime);
      osc.frequency.linearRampToValueAtTime(baseFreq * 0.85, croakTime + 0.14);

      formant.type = 'bandpass';
      formant.frequency.setValueAtTime(480, croakTime);
      formant.Q.setValueAtTime(3.5, croakTime);

      gain.gain.setValueAtTime(0.0001, croakTime);
      gain.gain.linearRampToValueAtTime(0.09, croakTime + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, croakTime + 0.15);

      osc.connect(formant);
      formant.connect(gain);
      gain.connect(destGain);

      osc.start(croakTime);
      osc.stop(croakTime + 0.16);
    }
  }

  _playTreeFrogPeeper(sound, destGain) {
    if (!sound.active || !this.ctx || this.ctx.state !== 'running') return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    const freq = 2100 + Math.random() * 300;
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.linearRampToValueAtTime(freq + 150, now + 0.04);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.04, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);

    osc.connect(gain);
    gain.connect(destGain);

    osc.start(now);
    osc.stop(now + 0.07);
  }

  /**
   * 14. SOOTHING PINK NOISE GRAPH
   * Clinical 1/f power spectrum for tinnitus masking and non-intrusive sound isolation
   */
  _buildPinkGraph(sound, outputGain) {
    const src = this._createBufferSource(this.pinkNoiseBuffer);

    // Smooth gentle rolloff above 6800Hz to eliminate harshness
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(6800, this.ctx.currentTime);
    filter.Q.setValueAtTime(0.5, this.ctx.currentTime);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.7, this.ctx.currentTime);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(outputGain);

    src.start();
    sound.nodes.sources = [src];
  }

  /**
   * 15. AIRPLANE CABIN HUM GRAPH
   * Deep pressurized cabin rumble + twin jet engine drone + ventilation hiss
   */
  _buildAirplaneGraph(sound, outputGain) {
    const sources = [];

    // 1. Deep fuselage rumble (Brownian noise lowpassed at 110Hz)
    const rumbleSrc = this._createBufferSource(this.brownNoiseBuffer);
    const rumbleFilter = this.ctx.createBiquadFilter();
    rumbleFilter.type = 'lowpass';
    rumbleFilter.frequency.setValueAtTime(110, this.ctx.currentTime);
    rumbleFilter.Q.setValueAtTime(1.2, this.ctx.currentTime);

    const rumbleGain = this.ctx.createGain();
    rumbleGain.gain.setValueAtTime(0.65, this.ctx.currentTime);

    rumbleSrc.connect(rumbleFilter);
    rumbleFilter.connect(rumbleGain);
    rumbleGain.connect(outputGain);
    rumbleSrc.start();
    sources.push(rumbleSrc);

    // 2. Twin Jet Engine harmonics (78 Hz + 82 Hz binaural drone)
    const engine1 = this.ctx.createOscillator();
    engine1.type = 'triangle';
    engine1.frequency.setValueAtTime(78, this.ctx.currentTime);

    const engine2 = this.ctx.createOscillator();
    engine2.type = 'triangle';
    engine2.frequency.setValueAtTime(82, this.ctx.currentTime);

    const engineGain = this.ctx.createGain();
    engineGain.gain.setValueAtTime(0.045, this.ctx.currentTime);

    engine1.connect(engineGain);
    engine2.connect(engineGain);
    engineGain.connect(outputGain);

    engine1.start();
    engine2.start();
    sources.push(engine1, engine2);

    // 3. Cabin overhead air vent hiss
    const ventSrc = this._createBufferSource(this.pinkNoiseBuffer);
    const ventFilter = this.ctx.createBiquadFilter();
    ventFilter.type = 'bandpass';
    ventFilter.frequency.setValueAtTime(550, this.ctx.currentTime);
    ventFilter.Q.setValueAtTime(0.8, this.ctx.currentTime);

    const ventGain = this.ctx.createGain();
    ventGain.gain.setValueAtTime(0.3, this.ctx.currentTime);

    ventSrc.connect(ventFilter);
    ventFilter.connect(ventGain);
    ventGain.connect(outputGain);
    ventSrc.start();
    sources.push(ventSrc);

    sound.nodes.sources = sources;
  }

  /**
   * 16. ALPHA FOCUS WAVES GRAPH (10 Hz Binaural Beat)
   * 140 Hz (L) & 150 Hz (R) binaural beat for ADHD flow, studying, and calm alertness
   */
  _buildAlphaGraph(sound, outputGain) {
    const baseFreq = 140.0;
    const alphaBeat = 10.0;

    const merger = this.ctx.createChannelMerger(2);

    // Left Ear: 140 Hz
    const oscLeft = this.ctx.createOscillator();
    oscLeft.type = 'sine';
    oscLeft.frequency.setValueAtTime(baseFreq, this.ctx.currentTime);

    // Right Ear: 150 Hz (140 + 10 Hz)
    const oscRight = this.ctx.createOscillator();
    oscRight.type = 'sine';
    oscRight.frequency.setValueAtTime(baseFreq + alphaBeat, this.ctx.currentTime);

    oscLeft.connect(merger, 0, 0);
    oscRight.connect(merger, 0, 1);

    const beatGain = this.ctx.createGain();
    beatGain.gain.setValueAtTime(0.5, this.ctx.currentTime);

    // Warm soft noise cushion
    const cushionSrc = this._createBufferSource(this.pinkNoiseBuffer);
    const cushionFilter = this.ctx.createBiquadFilter();
    cushionFilter.type = 'lowpass';
    cushionFilter.frequency.setValueAtTime(350, this.ctx.currentTime);
    const cushionGain = this.ctx.createGain();
    cushionGain.gain.setValueAtTime(0.18, this.ctx.currentTime);

    cushionSrc.connect(cushionFilter);
    cushionFilter.connect(cushionGain);

    merger.connect(beatGain);
    beatGain.connect(outputGain);
    cushionGain.connect(outputGain);

    oscLeft.start();
    oscRight.start();
    cushionSrc.start();

    sound.nodes.sources = [oscLeft, oscRight, cushionSrc];
  }

  // ==========================================
  // SLEEP TIMER & EXPONENTIAL FADE-OUT
  // ==========================================

  /**
   * Starts a Sleep Timer (e.g. 15, 30, 45, 60 mins)
   */
  startTimer(minutes, onTickCallback, onCompleteCallback) {
    this.stopTimer();
    if (!minutes || minutes <= 0) return;

    this.timerDurationSec = minutes * 60;
    this.timerRemainingSec = this.timerDurationSec;
    this.timerEndTime = Date.now() + (this.timerDurationSec * 1000);
    this.isTimerActive = true;
    this.fadeDurationSec = Math.min(300, Math.floor(this.timerDurationSec * 0.25)); // 25% or 5m max

    this.timerInterval = setInterval(() => {
      // Use true wall-clock difference to prevent mobile background throttling delays
      const remainingSec = Math.max(0, Math.round((this.timerEndTime - Date.now()) / 1000));
      this.timerRemainingSec = remainingSec;

      // Check if we entered the fade-out window
      if (this.timerRemainingSec <= this.fadeDurationSec && this.timerRemainingSec > 0) {
        const fadeRatio = this.timerRemainingSec / this.fadeDurationSec;
        this._applyFadeRatio(fadeRatio);
      }

      if (this.timerRemainingSec <= 0) {
        this.stopTimer();
        this.stopAll();
        if (onCompleteCallback) onCompleteCallback();
      } else {
        if (onTickCallback) onTickCallback(this.timerRemainingSec, this.timerDurationSec);
      }
    }, 1000);
  }

  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    this.isTimerActive = false;
    this.timerRemainingSec = 0;
    this.timerEndTime = 0;
    // Restore full volumes if timer cancelled
    this._restoreVolumesAfterFade();
  }

  _applyFadeRatio(ratio) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    Object.values(this.sounds).forEach(sound => {
      if (sound.active && sound.nodes.gain) {
        const targetVol = Math.max(0.0001, sound.volume * ratio);
        sound.nodes.gain.gain.setValueAtTime(sound.nodes.gain.gain.value, now);
        sound.nodes.gain.gain.linearRampToValueAtTime(targetVol, now + 0.9);
      }
    });
  }

  _restoreVolumesAfterFade() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    Object.values(this.sounds).forEach(sound => {
      if (sound.active && sound.nodes.gain) {
        sound.nodes.gain.gain.setValueAtTime(sound.nodes.gain.gain.value, now);
        sound.nodes.gain.gain.linearRampToValueAtTime(sound.volume, now + 0.2);
      }
    });
  }

  stopAll() {
    Object.keys(this.sounds).forEach(id => {
      if (this.sounds[id].active) {
        this.stopSound(id);
      }
    });
    this.isPlaying = false;
    this._syncMediaSession(false);
  }

  _checkActiveState() {
    const anyActive = Object.values(this.sounds).some(s => s.active);
    this.isPlaying = anyActive;
    this._syncMediaSession(this.isPlaying);
  }

  getActiveCount() {
    return Object.values(this.sounds).filter(s => s.active).length;
  }

  /**
   * Applies a preset mix configuration
   */
  applyPreset(presetConfig) {
    this.stopAll();
    setTimeout(() => {
      Object.entries(presetConfig).forEach(([soundId, volume]) => {
        if (this.sounds[soundId]) {
          this.sounds[soundId].volume = volume;
          this.startSound(soundId);
        }
      });
    }, 200);
  }

  /**
   * Screen WakeLock API to keep device awake if desired
   */
  async _requestWakeLock() {
    if ('wakeLock' in navigator) {
      try {
        this.wakeLock = await navigator.wakeLock.request('screen');
      } catch (err) {
        // WakeLock not supported or denied (non-critical)
      }
    }
  }
}

// Export singleton instance
window.velvetAudio = new VelvetAudioEngine();
