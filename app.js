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

  // Now Playing & Filter Elements
  const nowPlayingSection = document.getElementById('now-playing-section');
  const nowPlayingCount = document.getElementById('now-playing-count');
  const activeChipsContainer = document.getElementById('active-chips-container');
  const stopAllActiveBtn = document.getElementById('stop-all-active-btn');
  const filterAllBtn = document.getElementById('filter-all-btn');
  const filterFavoritesBtn = document.getElementById('filter-favorites-btn');
  const filterFavoritesCount = document.getElementById('filter-favorites-count');
  const filterActiveBtn = document.getElementById('filter-active-btn');
  const filterActiveCount = document.getElementById('filter-active-count');
  const masterStopBtn = document.getElementById('stop-master-btn');

  let currentFilter = 'all'; // 'all', 'favorites', or 'active'

  // Subtle Haptic Feedback for tactile mobile feel
  function triggerHaptic(type = 'light') {
    if ('vibrate' in navigator) {
      try {
        if (type === 'light') navigator.vibrate(10);
        else if (type === 'medium') navigator.vibrate(22);
      } catch (e) {}
    }
  }

  // Floating Toast Alert
  let toastTimeout = null;
  function showToast(message, duration = 3500) {
    let toast = document.getElementById('app-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'app-toast';
      toast.className = 'app-toast';
      document.body.appendChild(toast);
    }
    toast.innerHTML = message;
    toast.classList.add('visible');
    if (toastTimeout) clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
      toast.classList.remove('visible');
    }, duration);
  }

  // Sync Lock-Screen MediaSession play/pause with Master Bar UI
  window.onVelvetEnginePlayStateChange = (isPlaying, reason) => {
    syncAllUI();
    if (reason === 'headphone_disconnected') {
      showToast('🎧 Headphone disconnected — audio paused to protect your bedroom', 4500);
      triggerHaptic('medium');
    }
  };

  // Favorites (❤️) Management backed by localStorage
  function getFavorites() {
    try {
      return JSON.parse(localStorage.getItem('velvet_favorites') || '[]');
    } catch (e) {
      return [];
    }
  }

  function saveFavorites(favs) {
    localStorage.setItem('velvet_favorites', JSON.stringify(favs));
  }

  function isFavorite(id) {
    return getFavorites().includes(id);
  }

  function toggleFavorite(id) {
    let favs = getFavorites();
    if (favs.includes(id)) {
      favs = favs.filter(item => item !== id);
    } else {
      favs.push(id);
    }
    saveFavorites(favs);
    updateFavoritesCount();
    updateCardFavUI(id);
    if (currentFilter === 'favorites') {
      applyFilterToCards();
    }
  }

  function updateFavoritesCount() {
    const count = getFavorites().length;
    if (filterFavoritesCount) filterFavoritesCount.textContent = count;
  }

  function updateCardFavUI(id) {
    const card = document.getElementById(`card-${id}`);
    if (!card) return;
    const favBtn = card.querySelector('.card-fav-btn');
    if (favBtn) {
      const faved = isFavorite(id);
      favBtn.classList.toggle('favorited', faved);
      favBtn.innerHTML = faved ? '❤️' : '🤍';
      favBtn.title = faved ? 'Remove favorite' : 'Add favorite';
    }
  }

  // Tone Color Presets Persistence
  function getSavedTones() {
    try {
      return JSON.parse(localStorage.getItem('velvet_tones') || '{}');
    } catch (e) {
      return {};
    }
  }

  function saveTonePref(id, tone) {
    const tones = getSavedTones();
    tones[id] = tone;
    localStorage.setItem('velvet_tones', JSON.stringify(tones));
  }

  // Restore saved tones into engine
  const initialTones = getSavedTones();
  Object.keys(engine.sounds).forEach(id => {
    if (initialTones[id]) {
      engine.sounds[id].tone = initialTones[id];
    }
  });

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
  // PRESET SOUNDSCAPES (EXPANDED TO 8 ATMOSPHERES)
  // ==========================================
  const builtInPresets = [
    {
      id: 'storm',
      name: 'Midnight Storm',
      icon: '🌧️',
      mix: { rain: 0.80, thunder: 0.45, wind: 0.25 }
    },
    {
      id: 'tent',
      name: 'Canvas Tent',
      icon: '⛺',
      mix: { raintent: 0.75, campfire: 0.35, crickets: 0.20 }
    },
    {
      id: 'tinroof',
      name: 'Tin Roof Slumber',
      icon: '🏠',
      mix: { rainroof: 0.70, brown: 0.35 }
    },
    {
      id: 'stream',
      name: 'Alpine Stream',
      icon: '🏞️',
      mix: { brook: 0.70, frogs: 0.30, wind: 0.25 }
    },
    {
      id: 'adhd',
      name: 'ADHD Flow State',
      icon: '🎯',
      mix: { alpha: 0.65, brown: 0.45, brook: 0.25 }
    },
    {
      id: 'flight',
      name: 'Night Flight',
      icon: '✈️',
      mix: { airplane: 0.70, pink: 0.40 }
    },
    {
      id: 'delta',
      name: 'Deep Delta Sleep',
      icon: '💤',
      mix: { binaural: 0.70, ocean: 0.35, fan: 0.30 }
    },
    {
      id: 'tinnitus',
      name: 'Tinnitus Relief',
      icon: '🌸',
      mix: { pink: 0.75, raintent: 0.30 }
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
      syncAllUI();
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
      const isFav = isFavorite(sound.id);
      const currentTone = sound.tone || 'natural';

      card.innerHTML = `
        <div class="card-top">
          <div class="card-info" data-id="${sound.id}">
            <div class="card-icon">${sound.icon}</div>
            <div class="card-text">
              <h3>${sound.name}</h3>
              <p>${sound.desc}</p>
            </div>
          </div>
          <div class="card-actions">
            <button class="card-fav-btn ${isFav ? 'favorited' : ''}" data-id="${sound.id}" title="${isFav ? 'Remove favorite' : 'Add favorite'}">
              ${isFav ? '❤️' : '🤍'}
            </button>
            <button class="card-toggle-btn ${sound.active ? 'active' : ''}" data-id="${sound.id}" title="${sound.active ? 'Turn off ' + sound.name : 'Turn on ' + sound.name}">
              <span class="toggle-icon">⏻</span>
              <span class="toggle-status">${sound.active ? 'PLAYING' : 'OFF'}</span>
            </button>
          </div>
        </div>
        <div class="slider-container">
          <input type="range" class="volume-slider" min="0" max="100" value="${Math.round(sound.volume * 100)}" data-id="${sound.id}">
          <span class="volume-percent" id="pct-${sound.id}">${Math.round(sound.volume * 100)}%</span>
        </div>
        <div class="tone-container">
          <span class="tone-label">Tone Color</span>
          <div class="tone-selector" data-id="${sound.id}">
            <button class="tone-btn ${currentTone === 'deep' ? 'active' : ''}" data-tone="deep">Deep</button>
            <button class="tone-btn ${currentTone === 'natural' ? 'active' : ''}" data-tone="natural">Natural</button>
            <button class="tone-btn ${currentTone === 'crisp' ? 'active' : ''}" data-tone="crisp">Crisp</button>
          </div>
        </div>
      `;

      // Tap card info to toggle on/off
      card.querySelector('.card-info').addEventListener('click', () => {
        triggerSoundToggle(sound.id, card);
      });

      // Toggle button click
      card.querySelector('.card-toggle-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        triggerSoundToggle(sound.id, card);
      });

      // Favorite button click
      card.querySelector('.card-fav-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        triggerHaptic('light');
        toggleFavorite(sound.id);
      });

      // Tone selection buttons
      card.querySelectorAll('.tone-btn').forEach(toneBtn => {
        toneBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          triggerHaptic('light');
          const chosenTone = toneBtn.dataset.tone;
          engine.setSoundTone(sound.id, chosenTone);
          saveTonePref(sound.id, chosenTone);

          // Update active style on tone buttons
          card.querySelectorAll('.tone-btn').forEach(b => b.classList.remove('active'));
          toneBtn.classList.add('active');
        });
      });

      // Volume slider change
      const slider = card.querySelector('.volume-slider');
      slider.addEventListener('input', (e) => {
        const val = parseInt(e.target.value, 10) / 100;
        engine.setSoundVolume(sound.id, val);
        document.getElementById(`pct-${sound.id}`).textContent = `${Math.round(val * 100)}%`;
        if (val === 0 && sound.active) {
          engine.stopSound(sound.id);
          updateCardUI(sound.id);
          syncAllUI();
        } else if (val > 0 && !sound.active) {
          engine.startSound(sound.id);
          updateCardUI(sound.id);
          syncAllUI();
        } else {
          renderNowPlayingStrip();
        }
      });

      soundsGrid.appendChild(card);
    });

    updateFavoritesCount();
  }

  function triggerSoundToggle(soundId, card) {
    triggerHaptic('light');
    const sound = engine.sounds[soundId];
    if (sound.active) {
      engine.stopSound(sound.id);
    } else {
      if (sound.volume === 0) {
        sound.volume = 0.65;
        const s = card ? card.querySelector('.volume-slider') : document.querySelector(`.volume-slider[data-id="${soundId}"]`);
        if (s) s.value = 65;
        const p = document.getElementById(`pct-${sound.id}`);
        if (p) p.textContent = '65%';
        engine.setSoundVolume(sound.id, 0.65);
      }
      engine.startSound(sound.id);
    }
    updateCardUI(sound.id);
    syncAllUI();
  }

  function updateCardUI(id) {
    const sound = engine.sounds[id];
    const card = document.getElementById(`card-${id}`);
    if (!card) return;

    const toggleBtn = card.querySelector('.card-toggle-btn');
    const toggleStatus = card.querySelector('.toggle-status');

    if (sound.active) {
      card.classList.add('active');
      if (toggleBtn) toggleBtn.classList.add('active');
      if (toggleStatus) toggleStatus.textContent = 'PLAYING';
    } else {
      card.classList.remove('active');
      if (toggleBtn) toggleBtn.classList.remove('active');
      if (toggleStatus) toggleStatus.textContent = 'OFF';
    }

    if (currentFilter === 'active') {
      card.style.display = sound.active ? 'flex' : 'none';
    } else if (currentFilter === 'favorites') {
      card.style.display = isFavorite(sound.id) ? 'flex' : 'none';
    } else {
      card.style.display = 'flex';
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

  function applyFilterToCards() {
    let visibleCount = 0;
    Object.keys(engine.sounds).forEach(id => {
      const card = document.getElementById(`card-${id}`);
      if (!card) return;
      let show = true;
      if (currentFilter === 'active') {
        show = engine.sounds[id].active;
      } else if (currentFilter === 'favorites') {
        show = isFavorite(id);
      }
      card.style.display = show ? 'flex' : 'none';
      if (show) visibleCount++;
    });

    let emptyNotice = document.getElementById('filter-empty-state');
    if (visibleCount === 0) {
      if (!emptyNotice) {
        emptyNotice = document.createElement('div');
        emptyNotice.id = 'filter-empty-state';
        emptyNotice.className = 'empty-filter-state';
        soundsGrid.appendChild(emptyNotice);
      }
      if (currentFilter === 'favorites') {
        emptyNotice.innerHTML = `<span>❤️</span><p><strong>No favorite soundscapes yet</strong><br>Tap the ❤️ on any card to pin your favorite layers here.</p>`;
      } else if (currentFilter === 'active') {
        emptyNotice.innerHTML = `<span>🌧️</span><p><strong>No sounds currently playing</strong><br>Tap any soundscape or preset above to start listening.</p>`;
      }
      emptyNotice.style.display = 'block';
    } else if (emptyNotice) {
      emptyNotice.style.display = 'none';
    }
  }

  function renderNowPlayingStrip() {
    const activeSounds = Object.values(engine.sounds).filter(s => s.active);
    const count = activeSounds.length;

    if (nowPlayingCount) nowPlayingCount.textContent = count;
    if (filterActiveCount) filterActiveCount.textContent = count;

    if (count > 0 && nowPlayingSection) {
      nowPlayingSection.style.display = 'block';
      if (activeChipsContainer) {
        activeChipsContainer.innerHTML = activeSounds.map(s => `
          <div class="active-sound-chip" data-id="${s.id}">
            <span>${s.icon} ${s.name} <strong class="chip-vol">${Math.round(s.volume * 100)}%</strong></span>
            <button class="chip-remove-btn" data-id="${s.id}" title="Turn off ${s.name}">✕</button>
          </div>
        `).join('');

        activeChipsContainer.querySelectorAll('.chip-remove-btn').forEach(btn => {
          btn.addEventListener('click', (e) => {
            e.stopPropagation();
            triggerHaptic('light');
            const sid = btn.dataset.id;
            engine.stopSound(sid);
            updateCardUI(sid);
            syncAllUI();
          });
        });
      }
    } else if (nowPlayingSection) {
      nowPlayingSection.style.display = 'none';
      if (currentFilter === 'active') {
        currentFilter = 'all';
        if (filterAllBtn) filterAllBtn.classList.add('active');
        if (filterActiveBtn) filterActiveBtn.classList.remove('active');
        applyFilterToCards();
      }
    }
  }

  function updateMasterBar() {
    const activeSounds = Object.values(engine.sounds).filter(s => s.active);
    const count = activeSounds.length;

    if (count === 0) {
      activeCountLabel.textContent = 'Tap any sound to start';
      if (masterStopBtn) masterStopBtn.style.display = 'none';
      playAllIcon.textContent = '▶️';
    } else {
      const names = activeSounds.map(s => s.name).join(', ');
      activeCountLabel.textContent = `${count} Active: ${names}`;
      if (masterStopBtn) masterStopBtn.style.display = 'flex';
      playAllIcon.textContent = engine.isPlaying ? '⏸️' : '▶️';
    }
  }

  function syncAllUI() {
    renderNowPlayingStrip();
    updateMasterBar();
    applyFilterToCards();
  }

  function stopEverything() {
    triggerHaptic('medium');
    engine.stopAll();
    updateAllCardUIs();
    syncAllUI();
  }

  // Filter tab events
  if (filterAllBtn) {
    filterAllBtn.addEventListener('click', () => {
      triggerHaptic('light');
      currentFilter = 'all';
      filterAllBtn.classList.add('active');
      if (filterFavoritesBtn) filterFavoritesBtn.classList.remove('active');
      if (filterActiveBtn) filterActiveBtn.classList.remove('active');
      applyFilterToCards();
    });
  }

  if (filterFavoritesBtn) {
    filterFavoritesBtn.addEventListener('click', () => {
      triggerHaptic('light');
      currentFilter = 'favorites';
      filterFavoritesBtn.classList.add('active');
      if (filterAllBtn) filterAllBtn.classList.remove('active');
      if (filterActiveBtn) filterActiveBtn.classList.remove('active');
      applyFilterToCards();
    });
  }

  if (filterActiveBtn) {
    filterActiveBtn.addEventListener('click', () => {
      triggerHaptic('light');
      currentFilter = 'active';
      filterActiveBtn.classList.add('active');
      if (filterAllBtn) filterAllBtn.classList.remove('active');
      if (filterFavoritesBtn) filterFavoritesBtn.classList.remove('active');
      applyFilterToCards();
    });
  }

  // Stop All Buttons
  if (stopAllActiveBtn) {
    stopAllActiveBtn.addEventListener('click', stopEverything);
  }
  if (masterStopBtn) {
    masterStopBtn.addEventListener('click', stopEverything);
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
    syncAllUI();
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
            syncAllUI();
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
  // SETTINGS: HEADPHONE DISCONNECT & OLED
  // ==========================================
  const disconnectToggle = document.getElementById('disconnect-toggle');
  if (disconnectToggle) {
    disconnectToggle.checked = engine.pauseOnDisconnect;
    disconnectToggle.addEventListener('change', (e) => {
      triggerHaptic('light');
      engine.pauseOnDisconnect = e.target.checked;
      localStorage.setItem('velvet_pause_on_disconnect', e.target.checked ? 'true' : 'false');
    });
  }

  const oledToggle = document.getElementById('oled-toggle');
  const isOledStored = localStorage.getItem('velvet_oled') === 'true';
  if (isOledStored) {
    document.body.classList.add('oled-mode');
    oledToggle.checked = true;
  }

  oledToggle.addEventListener('change', (e) => {
    triggerHaptic('light');
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
  syncAllUI();
});
