/**
 * VelvetRain Application Controller
 * Handles UI interactions, Soundboard State, Presets, Sleep Timer, and Modals
 */

document.addEventListener('DOMContentLoaded', () => {
  const engine = window.velvetAudio;

  // DOM Elements
  const soundsGrid = document.getElementById('sounds-grid');
  const presetsContainer = document.getElementById('presets-container');
  const playAllBtn = document.getElementById('play-all-btn');
  const playAllIcon = document.getElementById('play-all-icon');
  const masterVolumeSlider = document.getElementById('master-volume');
  const activeCountLabel = document.getElementById('active-count');
  const timerStatusLabel = document.getElementById('timer-status');

  // Subtle Haptic Feedback for tactile mobile feel
  function triggerHaptic(type = 'light') {
    if ('vibrate' in navigator) {
      try {
        if (type === 'light') navigator.vibrate(10);
        else if (type === 'medium') navigator.vibrate(22);
      } catch (e) {}
    }
  }

  // Sync Lock-Screen MediaSession play/pause with Master Bar UI
  window.onVelvetEnginePlayStateChange = () => {
    updateMasterBar();
  };

  // Modals
  const timerModal = document.getElementById('timer-modal');
  const presetsModal = document.getElementById('presets-modal');
  const breathModal = document.getElementById('breath-modal');
  const settingsModal = document.getElementById('settings-modal');

  // Buttons to open modals
  document.getElementById('open-timer-btn').addEventListener('click', () => openModal(timerModal));
  document.getElementById('open-presets-btn').addEventListener('click', () => {
    renderSavedMixesList();
    openModal(presetsModal);
  });
  document.getElementById('open-breath-btn').addEventListener('click', () => {
    openModal(breathModal);
    startBreathingCycle();
  });
  document.getElementById('open-settings-btn').addEventListener('click', () => openModal(settingsModal));

  // Close buttons
  document.querySelectorAll('.close-modal-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const modal = e.target.closest('.modal-overlay');
      closeModal(modal);
      if (modal === breathModal) stopBreathingCycle();
    });
  });

  // Close on outside click
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        closeModal(overlay);
        if (overlay === breathModal) stopBreathingCycle();
      }
    });
  });

  function openModal(modal) {
    if (modal) modal.classList.add('open');
  }

  function closeModal(modal) {
    if (modal) modal.classList.remove('open');
  }

  // ==========================================
  // PRESET SOUNDSCAPES
  // ==========================================
  const builtInPresets = [
    {
      id: 'storm',
      name: 'Midnight Storm',
      icon: '🌧️',
      mix: { rain: 0.80, thunder: 0.45, wind: 0.25 }
    },
    {
      id: 'cabin',
      name: 'Cozy Hearth',
      icon: '🔥',
      mix: { campfire: 0.75, rain: 0.35, crickets: 0.20 }
    },
    {
      id: 'shore',
      name: 'Moonlit Shore',
      icon: '🌊',
      mix: { ocean: 0.70, wind: 0.30, brown: 0.20 }
    },
    {
      id: 'adhd',
      name: 'ADHD Deep Focus',
      icon: '🧠',
      mix: { brown: 0.65, binaural: 0.40, rain: 0.25 }
    },
    {
      id: 'delta',
      name: 'Deep Delta Sleep',
      icon: '💤',
      mix: { binaural: 0.70, crickets: 0.25, ocean: 0.30 }
    },
    {
      id: 'fan',
      name: 'Cool Breeze',
      icon: '💨',
      mix: { fan: 0.60, brown: 0.35, rain: 0.20 }
    }
  ];

  // Render Preset Chips
  function renderPresets() {
    presetsContainer.innerHTML = '';
    builtInPresets.forEach(preset => {
      const chip = document.createElement('div');
      chip.className = 'preset-chip';
      chip.innerHTML = `<span>${preset.icon}</span><span>${preset.name}</span>`;
      chip.addEventListener('click', () => {
        triggerHaptic('light');
        document.querySelectorAll('.preset-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        applyMix(preset.mix);
      });
      presetsContainer.appendChild(chip);
    });
  }

  function applyMix(mixConfig) {
    engine.stopAll();
    setTimeout(() => {
      Object.entries(mixConfig).forEach(([soundId, vol]) => {
        if (engine.sounds[soundId]) {
          engine.sounds[soundId].volume = vol;
          engine.startSound(soundId);
        }
      });
      updateAllCardUIs();
      updateMasterBar();
    }, 250);
  }

  // ==========================================
  // RENDER SOUNDBOARD GRID
  // ==========================================
  function renderSoundboard() {
    soundsGrid.innerHTML = '';
    Object.values(engine.sounds).forEach(sound => {
      const card = document.createElement('div');
      card.className = `sound-card ${sound.active ? 'active' : ''}`;
      card.id = `card-${sound.id}`;

      card.innerHTML = `
        <div class="card-top" data-id="${sound.id}">
          <div class="card-info">
            <div class="card-icon">${sound.icon}</div>
            <div class="card-text">
              <h3>${sound.name}</h3>
              <p>${sound.desc}</p>
            </div>
          </div>
          <div class="eq-bars">
            <div class="eq-bar"></div>
            <div class="eq-bar"></div>
            <div class="eq-bar"></div>
          </div>
        </div>
        <div class="slider-container">
          <input type="range" class="volume-slider" min="0" max="100" value="${Math.round(sound.volume * 100)}" data-id="${sound.id}">
          <span class="volume-percent" id="pct-${sound.id}">${Math.round(sound.volume * 100)}%</span>
        </div>
      `;

      // Tap card top to toggle on/off
      card.querySelector('.card-top').addEventListener('click', () => {
        triggerHaptic('light');
        engine.toggleSound(sound.id);
        updateCardUI(sound.id);
        updateMasterBar();
      });

      // Volume slider change
      const slider = card.querySelector('.volume-slider');
      slider.addEventListener('input', (e) => {
        const val = parseInt(e.target.value, 10) / 100;
        engine.setSoundVolume(sound.id, val);
        document.getElementById(`pct-${sound.id}`).textContent = `${Math.round(val * 100)}%`;
        if (!sound.active && val > 0) {
          engine.startSound(sound.id);
          updateCardUI(sound.id);
          updateMasterBar();
        }
      });

      soundsGrid.appendChild(card);
    });
  }

  function updateCardUI(id) {
    const sound = engine.sounds[id];
    const card = document.getElementById(`card-${id}`);
    if (!card) return;

    if (sound.active) {
      card.classList.add('active');
    } else {
      card.classList.remove('active');
    }
  }

  function updateAllCardUIs() {
    Object.keys(engine.sounds).forEach(id => {
      updateCardUI(id);
      const sound = engine.sounds[id];
      const slider = document.querySelector(`.volume-slider[data-id="${id}"]`);
      if (slider) slider.value = Math.round(sound.volume * 100);
      const pct = document.getElementById(`pct-${id}`);
      if (pct) pct.textContent = `${Math.round(sound.volume * 100)}%`;
    });
  }

  function updateMasterBar() {
    const activeCount = engine.getActiveCount();
    activeCountLabel.textContent = activeCount === 0 
      ? 'Tap any sound to start' 
      : `${activeCount} sound${activeCount > 1 ? 's' : ''} playing`;

    if (engine.isPlaying && activeCount > 0) {
      playAllIcon.textContent = '⏸️';
    } else {
      playAllIcon.textContent = '▶️';
    }
  }

  // Play/Pause Master
  playAllBtn.addEventListener('click', () => {
    triggerHaptic('medium');
    if (engine.getActiveCount() === 0) {
      // If nothing is playing, start Midnight Storm preset by default
      applyMix(builtInPresets[0].mix);
      return;
    }
    engine.togglePlayAll();
    updateMasterBar();
  });

  // Master Volume
  masterVolumeSlider.addEventListener('input', (e) => {
    engine.setMasterVolume(parseInt(e.target.value, 10) / 100);
  });

  // ==========================================
  // SLEEP TIMER LOGIC
  // ==========================================
  document.querySelectorAll('.timer-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      triggerHaptic('light');
      document.querySelectorAll('.timer-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const mins = parseInt(btn.dataset.mins, 10);
      if (mins === 0) {
        engine.stopTimer();
        timerStatusLabel.textContent = 'Timer off';
      } else {
        engine.startTimer(
          mins,
          (remainingSec) => {
            const m = Math.floor(remainingSec / 60);
            const s = remainingSec % 60;
            const formatted = `${m}:${s < 10 ? '0' : ''}${s}`;
            timerStatusLabel.textContent = `⏳ ${formatted} (fading)`;
          },
          () => {
            timerStatusLabel.textContent = 'Timer complete';
            updateAllCardUIs();
            updateMasterBar();
          }
        );
      }
      closeModal(timerModal);
    });
  });

  // ==========================================
  // SAVED MIXES (CUSTOM PRESETS PERSISTENCE)
  // ==========================================
  const saveMixBtn = document.getElementById('save-mix-btn');
  const mixNameInput = document.getElementById('mix-name-input');
  const savedMixesList = document.getElementById('saved-mixes-list');

  function getSavedMixes() {
    try {
      return JSON.parse(localStorage.getItem('velvet_saved_mixes') || '[]');
    } catch (e) {
      return [];
    }
  }

  function saveMixesToStorage(mixes) {
    localStorage.setItem('velvet_saved_mixes', JSON.stringify(mixes));
  }

  saveMixBtn.addEventListener('click', () => {
    const name = mixNameInput.value.trim() || `My Mix ${new Date().toLocaleDateString()}`;
    const currentMix = {};
    let count = 0;

    Object.values(engine.sounds).forEach(sound => {
      if (sound.active && sound.volume > 0) {
        currentMix[sound.id] = sound.volume;
        count++;
      }
    });

    if (count === 0) {
      alert('Please turn on at least one sound before saving your mix.');
      return;
    }

    const mixes = getSavedMixes();
    mixes.unshift({ id: 'mix_' + Date.now(), name, mix: currentMix, count });
    saveMixesToStorage(mixes);

    mixNameInput.value = '';
    renderSavedMixesList();
  });

  function renderSavedMixesList() {
    const mixes = getSavedMixes();
    savedMixesList.innerHTML = '';

    if (mixes.length === 0) {
      savedMixesList.innerHTML = '<p style="color:var(--text-muted);font-size:13px;text-align:center;padding:12px;">No saved mixes yet. Customize sounds and save your first mix above!</p>';
      return;
    }

    mixes.forEach(item => {
      const row = document.createElement('div');
      row.className = 'mix-item';
      row.innerHTML = `
        <div class="mix-info" style="cursor:pointer;flex:1;">
          <h4>${item.name}</h4>
          <p>${item.count} layers configured</p>
        </div>
        <div style="display:flex;gap:8px;">
          <button class="icon-btn" style="width:34px;height:34px;font-size:13px;" title="Load">▶️</button>
          <button class="icon-btn delete-mix-btn" style="width:34px;height:34px;font-size:13px;color:#EF4444;" title="Delete">🗑️</button>
        </div>
      `;

      row.querySelector('.mix-info').addEventListener('click', () => {
        applyMix(item.mix);
        closeModal(presetsModal);
      });
      row.querySelector('button[title="Load"]').addEventListener('click', () => {
        applyMix(item.mix);
        closeModal(presetsModal);
      });
      row.querySelector('.delete-mix-btn').addEventListener('click', () => {
        const filtered = getSavedMixes().filter(m => m.id !== item.id);
        saveMixesToStorage(filtered);
        renderSavedMixesList();
      });

      savedMixesList.appendChild(row);
    });
  }

  // ==========================================
  // 4-7-8 BREATHING PACER
  // ==========================================
  let breathInterval = null;
  const breathCircle = document.getElementById('breath-circle');
  const breathLabel = document.getElementById('breath-label');
  const breathCount = document.getElementById('breath-count');

  function startBreathingCycle() {
    stopBreathingCycle();
    let phase = 0; // 0: Inhale (4s), 1: Hold (7s), 2: Exhale (8s)
    let secondsLeft = 4;

    function setPhase(p) {
      phase = p;
      if (phase === 0) {
        secondsLeft = 4;
        breathLabel.textContent = 'Inhale Gently';
        breathCircle.className = 'breath-circle inhale';
      } else if (phase === 1) {
        secondsLeft = 7;
        breathLabel.textContent = 'Hold Breath';
        breathCircle.className = 'breath-circle hold';
      } else {
        secondsLeft = 8;
        breathLabel.textContent = 'Exhale Slowly';
        breathCircle.className = 'breath-circle exhale';
      }
      breathCount.textContent = secondsLeft;
    }

    setPhase(0);

    breathInterval = setInterval(() => {
      secondsLeft--;
      if (secondsLeft <= 0) {
        const nextPhase = (phase + 1) % 3;
        setPhase(nextPhase);
      } else {
        breathCount.textContent = secondsLeft;
      }
    }, 1000);
  }

  function stopBreathingCycle() {
    if (breathInterval) {
      clearInterval(breathInterval);
      breathInterval = null;
    }
  }

  // ==========================================
  // SETTINGS & OLED TRUE BLACK TOGGLE
  // ==========================================
  const oledToggle = document.getElementById('oled-toggle');
  const isOledStored = localStorage.getItem('velvet_oled') === 'true';
  if (isOledStored) {
    document.body.classList.add('oled-mode');
    oledToggle.checked = true;
  }

  oledToggle.addEventListener('change', (e) => {
    if (e.target.checked) {
      document.body.classList.add('oled-mode');
      localStorage.setItem('velvet_oled', 'true');
    } else {
      document.body.classList.remove('oled-mode');
      localStorage.setItem('velvet_oled', 'false');
    }
  });

  // ==========================================
  // SUBTLE AMBIENT RAIN CANVAS ANIMATION
  // ==========================================
  const canvas = document.getElementById('bg-canvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    window.addEventListener('resize', () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    });

    const drops = [];
    for (let i = 0; i < 45; i++) {
      drops.push({
        x: Math.random() * width,
        y: Math.random() * height,
        length: 12 + Math.random() * 18,
        speed: 3 + Math.random() * 4,
        opacity: 0.15 + Math.random() * 0.2
      });
    }

    function animateDrops() {
      ctx.clearRect(0, 0, width, height);
      ctx.strokeStyle = '#6366F1';
      ctx.lineWidth = 1;

      for (let i = 0; i < drops.length; i++) {
        const d = drops[i];
        ctx.beginPath();
        ctx.globalAlpha = d.opacity;
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x - 1, d.y + d.length);
        ctx.stroke();

        d.y += d.speed;
        if (d.y > height) {
          d.y = -d.length;
          d.x = Math.random() * width;
        }
      }

      requestAnimationFrame(animateDrops);
    }
    animateDrops();
  }

  // Initialize UI
  renderPresets();
  renderSoundboard();
  updateMasterBar();
});
