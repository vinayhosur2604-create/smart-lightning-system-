/**
 * Smart Lighting System - Core Application Logic
 * State management, navigation, automation engine
 */

// ===========================
// GLOBAL STATE
// ===========================
const AppState = {
  // System
  systemOnline: true,
  currentTime: new Date(),

  // Sensors
  pirMotion: false,
  ldrValue: 65,        // 0-100%
  ldrRaw: 420,         // raw 0-1023
  ambientLight: 'MODERATE',  // DARK | MODERATE | BRIGHT

  // LED Control
  ledOn: false,
  brightness: 0,
  targetBrightness: 0,

  // Lighting Mode
  currentMode: 'AUTO',   // AUTO | SLEEP | PARTY | READING | CUSTOM
  previousMode: null,
  partyBlinkRate: 500,   // ms
  partyActive: false,
  partyIntervalId: null,
  customBrightness: 70,
  noMotionTimeout: 30,   // seconds
  noMotionTimer: null,
  lastMotionTime: null,

  // Bluetooth
  btConnected: false,
  btDevice: null,
  btCharacteristic: null,
  btDeviceList: [],
  pairedDevices: [],

  // Connection
  websiteConnected: true, // always true when app is open
  controlSource: 'WEBSITE',  // WEBSITE | BLUETOOTH | AUTONOMOUS

  // Energy
  dailyConsumption: [],
  weeklyConsumption: [],
  totalEnergySaved: 12.4,   // kWh
  sessionRuntime: 0,        // minutes
  sessionStartTime: Date.now(),

  // Notifications
  notifications: [],
  unreadCount: 0,

  // RTC
  rtcTime: new Date(),
  isDaytime: true,
};

// ===========================
// NAVIGATION
// ===========================
const Pages = {
  dashboard: 'Dashboard',
  sensors: 'Sensor Monitoring',
  control: 'Device Control',
  modes: 'Lighting Modes',
  energy: 'Energy Analytics',
  bluetooth: 'Bluetooth Connection',
  visualization: 'Smart Visualization',
  notifications: 'Notifications',
  settings: 'Settings',
};

let currentPage = 'dashboard';

function navigateTo(page) {
  // Hide all sections
  document.querySelectorAll('.page-section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

  // Show target
  const section = document.getElementById(`section-${page}`);
  if (section) section.classList.add('active');

  const navItem = document.querySelector(`[data-page="${page}"]`);
  if (navItem) navItem.classList.add('active');

  // Update header
  const headerTitle = document.getElementById('header-page-title');
  const headerSubtitle = document.getElementById('header-page-subtitle');
  if (headerTitle) headerTitle.textContent = Pages[page] || page;
  if (headerSubtitle) headerSubtitle.textContent = getPageSubtitle(page);

  currentPage = page;

  // Close mobile sidebar
  document.querySelector('.sidebar')?.classList.remove('open');
  document.querySelector('.sidebar-overlay')?.classList.remove('open');

  // Page-specific init
  if (page === 'energy') Charts.initAll();
  if (page === 'sensors') Sensors.updateUI();
  if (page === 'visualization') Visualization.render();
}

function getPageSubtitle(page) {
  const subtitles = {
    dashboard: 'Real-time system overview',
    sensors: 'Live PIR, LDR & RTC readings',
    control: 'LED brightness & power control',
    modes: 'Automatic, Sleep, Party, Reading & Custom',
    energy: 'Power consumption analytics',
    bluetooth: 'BLE device management',
    visualization: 'Smart room 3D view',
    notifications: 'System alerts & activity log',
    settings: 'System configuration',
  };
  return subtitles[page] || '';
}

// ===========================
// RTC CLOCK
// ===========================
function updateRTC() {
  const now = new Date();
  AppState.rtcTime = now;
  AppState.currentTime = now;

  const hour = now.getHours();
  AppState.isDaytime = hour >= 6 && hour < 18;

  const timeStr = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });

  document.getElementById('rtc-time-header')?.setAttribute('data-time', timeStr);

  const rtcEl = document.getElementById('rtc-display');
  if (rtcEl) rtcEl.textContent = `${timeStr}`;

  const rtcDateEl = document.getElementById('rtc-date');
  if (rtcDateEl) rtcDateEl.textContent = dateStr;

  const kpiTimeEl = document.getElementById('kpi-rtc-time');
  if (kpiTimeEl) kpiTimeEl.textContent = timeStr;

  const kpiDateEl = document.getElementById('kpi-rtc-date');
  if (kpiDateEl) kpiDateEl.textContent = dateStr;

  const sensorRtcEl = document.getElementById('sensor-rtc-time');
  if (sensorRtcEl) sensorRtcEl.textContent = timeStr;

  const sensorRtcDateEl = document.getElementById('sensor-rtc-date');
  if (sensorRtcDateEl) sensorRtcDateEl.textContent = dateStr;

  const dayNightEl = document.getElementById('day-night-indicator');
  if (dayNightEl) {
    dayNightEl.textContent = AppState.isDaytime ? '☀️ DAYTIME' : '🌙 NIGHTTIME';
    dayNightEl.className = 'day-night-badge ' + (AppState.isDaytime ? 'day' : 'night');
  }
}

// ===========================
// SENSOR SIMULATION ENGINE
// ===========================
const Sensors = {
  pirDebounce: null,

  simulateLDR() {
    // Realistic LDR variation based on time of day + random noise
    const hour = AppState.rtcTime.getHours();
    let baseLDR;
    if (hour >= 7 && hour < 17) {
      baseLDR = 70 + (Math.random() - 0.5) * 20;
    } else if (hour >= 17 && hour < 20) {
      baseLDR = 35 + (Math.random() - 0.5) * 20;
    } else {
      baseLDR = 10 + (Math.random() - 0.5) * 10;
    }
    AppState.ldrValue = Math.max(0, Math.min(100, baseLDR));
    AppState.ldrRaw = Math.round(AppState.ldrValue * 10.23);

    if (AppState.ldrValue < 25) AppState.ambientLight = 'DARK';
    else if (AppState.ldrValue < 60) AppState.ambientLight = 'MODERATE';
    else AppState.ambientLight = 'BRIGHT';

    this.updateLDRUI();
  },

  simulatePIR() {
    // Random motion detection (more likely at night/evening)
    const hour = AppState.rtcTime.getHours();
    const motionProbability = (hour >= 18 || hour < 6) ? 0.15 : 0.08;
    const newMotion = Math.random() < motionProbability;

    if (newMotion !== AppState.pirMotion) {
      AppState.pirMotion = newMotion;
      if (newMotion) {
        AppState.lastMotionTime = Date.now();
        Notifications.add('Motion Detected', 'PIR sensor triggered — movement in room', 'warning', 'fa-person-walking');
        this.triggerMotionEffect();
      } else {
        Notifications.add('No Motion', 'PIR sensor — no movement detected', 'info', 'fa-person');
      }
      this.updatePIRUI();
    }
  },

  updateLDRUI() {
    const pct = Math.round(AppState.ldrValue);
    ['ldr-value', 'sensor-ldr-value', 'kpi-ldr'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.textContent = pct + '%';
    });

    const bars = document.querySelectorAll('.ldr-bar-fill');
    bars.forEach(b => {
      b.style.width = pct + '%';
      b.style.background = pct > 60
        ? 'linear-gradient(90deg, #f59e0b, #ef4444)'
        : pct > 30
        ? 'linear-gradient(90deg, #10b981, #f59e0b)'
        : 'linear-gradient(90deg, #00d4ff, #10b981)';
    });

    const ambEl = document.getElementById('ambient-light-status');
    if (ambEl) ambEl.textContent = AppState.ambientLight;

    const icons = document.querySelectorAll('.ldr-icon');
    icons.forEach(i => {
      i.textContent = AppState.ambientLight === 'BRIGHT' ? '☀️' : AppState.ambientLight === 'DARK' ? '🌑' : '🌤️';
    });
  },

  updatePIRUI() {
    const detected = AppState.pirMotion;

    ['pir-status', 'kpi-pir', 'sensor-pir-status'].forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      el.textContent = detected ? 'MOTION DETECTED' : 'NO MOTION';
      el.className = el.className.replace(/(motion-on|motion-off)/g, '') + ' ' + (detected ? 'motion-on' : 'motion-off');
    });

    const pirDot = document.getElementById('pir-dot');
    if (pirDot) {
      pirDot.className = `status-dot ${detected ? 'warning' : 'online'}`;
    }

    const motionIcon = document.getElementById('motion-icon-anim');
    if (motionIcon) {
      motionIcon.style.animation = detected ? 'heartbeat 0.8s ease-in-out infinite' : 'none';
    }

    // Update visualization
    Visualization.updateMotion(detected);
  },

  triggerMotionEffect() {
    const motionOverlay = document.getElementById('motion-overlay');
    if (motionOverlay) {
      motionOverlay.style.opacity = '1';
      setTimeout(() => { motionOverlay.style.opacity = '0'; }, 600);
    }
  },

  updateUI() {
    this.updateLDRUI();
    this.updatePIRUI();
  }
};

// ===========================
// AUTOMATION ENGINE
// ===========================
const Automation = {
  run() {
    if (AppState.currentMode !== 'AUTO') return;
    if (AppState.controlSource === 'WEBSITE' || AppState.controlSource === 'BLUETOOTH') return;

    const { isDaytime, ldrValue, pirMotion, ambientLight } = AppState;

    if (isDaytime && ldrValue > 40) {
      // Daytime with sufficient light → OFF
      if (AppState.ledOn) Lighting.setLED(false, 0, 'autonomous');
    } else {
      // Night or dark
      if (pirMotion) {
        // Motion detected at night → ON
        if (!AppState.ledOn) {
          Lighting.setLED(true, 80, 'autonomous');
          Notifications.add('Autonomous Mode', 'Night motion detected — lights ON', 'success', 'fa-bolt');
        }
        // Clear no-motion timer
        clearTimeout(AppState.noMotionTimer);
        AppState.noMotionTimer = null;
      } else {
        // No motion → start countdown to turn off
        if (AppState.ledOn && !AppState.noMotionTimer) {
          AppState.noMotionTimer = setTimeout(() => {
            Lighting.setLED(false, 0, 'autonomous');
            Notifications.add('Autonomous Mode', `No motion for ${AppState.noMotionTimeout}s — lights OFF`, 'info', 'fa-moon');
            AppState.noMotionTimer = null;
          }, AppState.noMotionTimeout * 1000);
        }
      }
    }
  }
};

// ===========================
// LIGHTING CONTROL
// ===========================
const Lighting = {
  brightnessAnimFrame: null,

  setLED(on, brightness, source) {
    const wasOn = AppState.ledOn;
    AppState.ledOn = on;
    AppState.targetBrightness = on ? Math.max(brightness, 10) : 0;

    if (source) {
      AppState.controlSource = source === 'autonomous' ? 'AUTONOMOUS' :
                               source === 'bluetooth' ? 'BLUETOOTH' : 'WEBSITE';
    }

    if (on && !wasOn) {
      Notifications.add('LED Turned ON', `Brightness: ${brightness}% | Source: ${AppState.controlSource}`, 'success', 'fa-lightbulb');
    } else if (!on && wasOn) {
      Notifications.add('LED Turned OFF', `Source: ${AppState.controlSource}`, 'info', 'fa-lightbulb');
    }

    this.animateBrightness(AppState.targetBrightness);
    this.updateUI();
    Dashboard.updateAll();

    // Send BT command if connected
    if (AppState.btConnected && source !== 'bluetooth') {
      Bluetooth.sendCommand(on ? 'LED_ON' : 'LED_OFF');
    }
  },

  setBrightness(value) {
    AppState.targetBrightness = value;
    if (value > 0 && !AppState.ledOn) AppState.ledOn = true;
    if (value === 0) AppState.ledOn = false;
    this.animateBrightness(value);
    this.updateUI();
    Dashboard.updateKPIs();

    if (AppState.btConnected) {
      Bluetooth.sendCommand(`BRIGHTNESS:${value}`);
    }
  },

  animateBrightness(target) {
    cancelAnimationFrame(this.brightnessAnimFrame);
    const animate = () => {
      const current = AppState.brightness;
      const diff = target - current;
      if (Math.abs(diff) < 0.5) {
        AppState.brightness = target;
        this.updateBrightnessVisuals();
        return;
      }
      AppState.brightness = current + diff * 0.08;
      this.updateBrightnessVisuals();
      this.brightnessAnimFrame = requestAnimationFrame(animate);
    };
    this.brightnessAnimFrame = requestAnimationFrame(animate);
  },

  updateBrightnessVisuals() {
    const pct = Math.round(AppState.brightness);

    // Sliders
    document.querySelectorAll('.brightness-slider').forEach(sl => { sl.value = pct; });
    document.querySelectorAll('.brightness-value-display').forEach(el => { el.textContent = pct + '%'; });
    document.querySelectorAll('.slider-track-fill').forEach(fill => {
      fill.style.width = pct + '%';
    });

    // LED indicator glow
    const leds = document.querySelectorAll('.led-indicator');
    leds.forEach(led => {
      if (AppState.ledOn && pct > 0) {
        led.className = 'led-indicator on ' + (led.classList.contains('led-large') ? 'led-large' : '');
        led.style.boxShadow = `0 0 ${pct / 5}px #ffaa00, 0 0 ${pct / 3}px rgba(255,170,0,0.5), 0 0 ${pct}px rgba(255,170,0,0.15)`;
      } else {
        led.className = 'led-indicator off ' + (led.classList.contains('led-large') ? 'led-large' : '');
        led.style.boxShadow = 'none';
      }
    });

    // Progress circles
    document.querySelectorAll('.brightness-circle-progress').forEach(circle => {
      const circumference = 2 * Math.PI * 54;
      const offset = circumference - (pct / 100) * circumference;
      circle.style.strokeDashoffset = offset;
    });

    document.querySelectorAll('.brightness-circle-text').forEach(el => {
      el.textContent = pct + '%';
    });

    // Room visualization brightness
    Visualization.updateBrightness(pct);
  },

  updateUI() {
    const on = AppState.ledOn;

    // Toggle buttons
    document.querySelectorAll('.led-toggle-btn').forEach(btn => {
      btn.textContent = on ? '⚡ Turn OFF' : '⚡ Turn ON';
      btn.className = btn.className.replace(/(btn-success|btn-danger)/g, '') + ' ' + (on ? 'btn-danger' : 'btn-success');
    });

    // Control toggles
    document.querySelectorAll('.led-power-toggle input').forEach(inp => { inp.checked = on; });

    // KPI
    const kpiLed = document.getElementById('kpi-led-status');
    if (kpiLed) {
      kpiLed.textContent = on ? 'ON' : 'OFF';
      kpiLed.style.color = on ? 'var(--accent-green)' : 'var(--text-secondary)';
    }
  },

  setMode(mode) {
    AppState.previousMode = AppState.currentMode;
    AppState.currentMode = mode;

    // Stop party mode if switching away
    if (mode !== 'PARTY' && AppState.partyActive) {
      this.stopPartyMode();
    }

    switch(mode) {
      case 'AUTO':
        AppState.controlSource = 'WEBSITE';
        Notifications.add('Automatic Mode', 'System will auto-control based on sensors', 'info', 'fa-robot');
        if (AppState.btConnected) Bluetooth.sendCommand('MODE_AUTO');
        break;
      case 'SLEEP':
        this.setLED(true, 20);
        Notifications.add('Sleep Mode Activated', 'Dimmed to 20% — saving energy', 'info', 'fa-moon');
        if (AppState.btConnected) Bluetooth.sendCommand('MODE_SLEEP');
        break;
      case 'PARTY':
        this.startPartyMode();
        Notifications.add('Party Mode Activated', '🎉 Let the party begin!', 'party', 'fa-music');
        if (AppState.btConnected) Bluetooth.sendCommand('MODE_PARTY');
        break;
      case 'READING':
        this.setLED(true, 80);
        Notifications.add('Reading Mode Activated', 'Stable bright lighting at 80%', 'success', 'fa-book');
        if (AppState.btConnected) Bluetooth.sendCommand('MODE_READING');
        break;
      case 'CUSTOM':
        this.setLED(true, AppState.customBrightness);
        Notifications.add('Custom Mode Activated', `Brightness: ${AppState.customBrightness}%`, 'info', 'fa-sliders');
        if (AppState.btConnected) Bluetooth.sendCommand(`MODE_CUSTOM:${AppState.customBrightness}`);
        break;
    }

    this.updateModeUI();
    Dashboard.updateAll();
  },

  startPartyMode() {
    AppState.partyActive = true;
    document.body.classList.add('party-active');
    const partyBg = document.getElementById('party-bg');
    if (partyBg) partyBg.style.display = 'block';

    const blink = () => {
      AppState.ledOn = !AppState.ledOn;
      AppState.brightness = AppState.ledOn ? 100 : 0;
      this.updateBrightnessVisuals();
      this.updateUI();
    };

    AppState.partyIntervalId = setInterval(blink, AppState.partyBlinkRate);
  },

  stopPartyMode() {
    AppState.partyActive = false;
    document.body.classList.remove('party-active');
    if (AppState.partyIntervalId) {
      clearInterval(AppState.partyIntervalId);
      AppState.partyIntervalId = null;
    }
    const partyBg = document.getElementById('party-bg');
    if (partyBg) partyBg.style.display = 'none';
    this.setLED(true, 80);
  },

  updateModeUI() {
    const mode = AppState.currentMode;

    // Mode cards
    document.querySelectorAll('.mode-card').forEach(card => {
      card.classList.remove('active');
      const badge = card.querySelector('.mode-badge');
      if (badge) badge.textContent = 'INACTIVE';
    });

    const activeCard = document.querySelector(`[data-mode="${mode}"]`);
    if (activeCard) {
      activeCard.classList.add('active');
      const badge = activeCard.querySelector('.mode-badge');
      if (badge) badge.textContent = 'ACTIVE';
    }

    // KPI
    const kpiMode = document.getElementById('kpi-mode');
    const modeNames = { AUTO: 'Automatic', SLEEP: 'Sleep', PARTY: 'Party 🎉', READING: 'Reading', CUSTOM: 'Custom' };
    if (kpiMode) kpiMode.textContent = modeNames[mode] || mode;
  }
};

// ===========================
// DASHBOARD
// ===========================
const Dashboard = {
  updateAll() {
    this.updateKPIs();
    this.updateConnectionStatus();
    this.updateControlSource();
  },

  updateKPIs() {
    // System Status
    const sysStatus = document.getElementById('kpi-system-status');
    if (sysStatus) {
      sysStatus.textContent = AppState.systemOnline ? 'ONLINE' : 'OFFLINE';
      sysStatus.style.color = AppState.systemOnline ? 'var(--accent-green)' : 'var(--accent-red)';
    }

    // Brightness
    const pct = Math.round(AppState.brightness);
    const brightEl = document.getElementById('kpi-brightness');
    if (brightEl) brightEl.textContent = pct + '%';

    // Energy savings
    const saved = document.getElementById('kpi-energy-saved');
    if (saved) saved.textContent = AppState.totalEnergySaved.toFixed(1) + ' kWh';

    // BT Status
    const btStat = document.getElementById('kpi-bt-status');
    if (btStat) {
      btStat.textContent = AppState.btConnected ? 'CONNECTED' : 'DISCONNECTED';
      btStat.style.color = AppState.btConnected ? 'var(--accent-green)' : 'var(--text-secondary)';
    }

    // Runtime
    const runtime = Math.round((Date.now() - AppState.sessionStartTime) / 60000);
    AppState.sessionRuntime = runtime;
    const rtEl = document.getElementById('kpi-runtime');
    if (rtEl) rtEl.textContent = runtime + ' min';
  },

  updateConnectionStatus() {
    const btDot = document.getElementById('sidebar-bt-dot');
    const webDot = document.getElementById('sidebar-web-dot');
    if (btDot) btDot.className = `status-dot ${AppState.btConnected ? 'online' : 'offline'}`;
    if (webDot) webDot.className = `status-dot ${AppState.websiteConnected ? 'online' : 'offline'}`;
  },

  updateControlSource() {
    const src = document.getElementById('kpi-control-source');
    if (!src) return;
    const labels = {
      WEBSITE: '🌐 Website',
      BLUETOOTH: '📶 Bluetooth',
      AUTONOMOUS: '🤖 Autonomous'
    };
    src.textContent = labels[AppState.controlSource] || AppState.controlSource;
    src.style.color = AppState.controlSource === 'AUTONOMOUS' ? 'var(--accent-violet)' :
                      AppState.controlSource === 'BLUETOOTH' ? 'var(--accent-blue)' : 'var(--accent-green)';
  }
};

// ===========================
// NOTIFICATIONS
// ===========================
const Notifications = {
  add(title, message, type = 'info', icon = 'fa-bell') {
    const notif = {
      id: Date.now(),
      title,
      message,
      type,
      icon,
      time: new Date(),
      read: false,
    };

    AppState.notifications.unshift(notif);
    AppState.unreadCount++;

    // Cap at 50
    if (AppState.notifications.length > 50) AppState.notifications.pop();

    this.showToast(notif);
    this.updateBadge();
    this.renderLog();
  },

  showToast(notif) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${notif.type}`;
    toast.innerHTML = `
      <div class="toast-icon"><i class="fa-solid ${notif.icon}"></i></div>
      <div class="toast-body">
        <div class="toast-title">${notif.title}</div>
        <div class="toast-msg">${notif.message}</div>
      </div>
      <button onclick="this.parentElement.remove()" style="background:none;border:none;color:var(--text-muted);cursor:pointer;margin-left:8px;">✕</button>
    `;

    container.appendChild(toast);
    setTimeout(() => { toast.remove(); }, 4000);
  },

  updateBadge() {
    const badge = document.getElementById('notif-badge');
    if (badge) {
      badge.textContent = AppState.unreadCount > 9 ? '9+' : AppState.unreadCount;
      badge.style.display = AppState.unreadCount > 0 ? 'block' : 'none';
    }
  },

  markAllRead() {
    AppState.unreadCount = 0;
    AppState.notifications.forEach(n => n.read = true);
    this.updateBadge();
  },

  renderLog() {
    const container = document.getElementById('notification-log');
    if (!container) return;

    const typeColors = {
      success: 'var(--accent-green)', error: 'var(--accent-red)',
      warning: 'var(--accent-yellow)', info: 'var(--accent-blue)', party: 'var(--accent-pink)'
    };

    container.innerHTML = AppState.notifications.slice(0, 30).map(n => `
      <div class="log-item ${n.read ? '' : 'unread'}">
        <div class="log-icon" style="background: rgba(0,0,0,0.2); color: ${typeColors[n.type] || 'var(--accent-blue)'}">
          <i class="fa-solid ${n.icon}"></i>
        </div>
        <div class="log-content">
          <div class="log-title">${n.title} ${!n.read ? '<span style="color:var(--accent-blue);font-size:0.65rem;">NEW</span>' : ''}</div>
          <div class="log-desc">${n.message}</div>
          <div class="log-time">${n.time.toLocaleTimeString()}</div>
        </div>
      </div>
    `).join('');
  }
};

// ===========================
// ENERGY TRACKING
// ===========================
const Energy = {
  tick() {
    // Accumulate simulated energy
    const powerW = AppState.ledOn ? (AppState.brightness / 100) * 15 : 0; // 15W max LED
    const energyKWh = (powerW / 1000) / 3600; // per second
    AppState.totalEnergySaved += energyKWh * 0.5; // fictional savings vs incandescent

    const savedEl = document.getElementById('kpi-energy-saved');
    if (savedEl) savedEl.textContent = AppState.totalEnergySaved.toFixed(2) + ' kWh';
  }
};

// ===========================
// MAIN SIMULATION LOOP
// ===========================
let tickCount = 0;

function mainLoop() {
  tickCount++;
  updateRTC();

  // Sensor simulation (every 3 seconds)
  if (tickCount % 3 === 0) {
    Sensors.simulateLDR();
  }

  // PIR simulation (every 5 seconds)
  if (tickCount % 5 === 0) {
    Sensors.simulatePIR();
  }

  // Automation engine
  if (tickCount % 5 === 0) {
    Automation.run();
  }

  // Dashboard KPIs
  if (tickCount % 2 === 0) {
    Dashboard.updateAll();
  }

  // Energy tracking
  if (tickCount % 10 === 0) {
    Energy.tick();
  }
}

// ===========================
// MOBILE SIDEBAR TOGGLE
// ===========================
function toggleSidebar() {
  document.querySelector('.sidebar')?.classList.toggle('open');
  document.querySelector('.sidebar-overlay')?.classList.toggle('open');
}

// ===========================
// INIT
// ===========================
function initApp() {
  // Start main loop
  setInterval(mainLoop, 1000);

  // Initial state
  navigateTo('dashboard');
  Sensors.simulateLDR();
  Lighting.updateModeUI();
  Lighting.updateUI();
  Dashboard.updateAll();
  updateRTC();

  // Welcome notification
  setTimeout(() => {
    Notifications.add('System Online', 'Smart Lighting System initialized successfully', 'success', 'fa-check-circle');
    Notifications.add('Autonomous Mode Ready', 'System will auto-control lighting when disconnected', 'info', 'fa-robot');
  }, 1000);

  // Particle background
  Particles.init();
}

document.addEventListener('DOMContentLoaded', initApp);
