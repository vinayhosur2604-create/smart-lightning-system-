/**
 * Smart Lighting System - Web Bluetooth API Integration
 * Handles BLE scanning, connection, and command transmission
 */

const Bluetooth = {
  device: null,
  server: null,
  service: null,
  characteristic: null,
  isScanning: false,
  commandLog: [],

  // BLE Service/Characteristic UUIDs (Arduino BLE)
  SERVICE_UUID: '0000ffe0-0000-1000-8000-00805f9b34fb',
  CHAR_UUID: '0000ffe1-0000-1000-8000-00805f9b34fb',

  // Command protocol
  COMMANDS: {
    LED_ON: '1',
    LED_OFF: '0',
    MODE_AUTO: 'A',
    MODE_SLEEP: 'S',
    MODE_PARTY: 'P',
    MODE_READING: 'R',
    MODE_CUSTOM: 'C',
    BRIGHTNESS: 'B',
    STATUS: '?',
  },

  isSupported() {
    return 'bluetooth' in navigator;
  },

  async scan() {
    if (!this.isSupported()) {
      Notifications.add('Bluetooth Error', 'Web Bluetooth API not supported in this browser. Use Chrome or Edge.', 'error', 'fa-bluetooth');
      this.updateUI('error', 'Web Bluetooth API not supported. Please use Chrome or Edge.');
      return;
    }

    this.isScanning = true;
    this.updateScanUI(true);
    Notifications.add('Scanning...', 'Searching for nearby BLE devices', 'info', 'fa-magnifying-glass');

    try {
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [this.SERVICE_UUID, 'generic_access', 'device_information'],
      });

      this.device = device;
      AppState.btDevice = device;

      // Add to discovered list
      const deviceEntry = {
        name: device.name || 'Unknown Device',
        id: device.id,
        rssi: -Math.floor(Math.random() * 40 + 50),
        type: this.guessDeviceType(device.name),
        paired: false,
        connected: false,
      };

      const existing = AppState.btDeviceList.find(d => d.id === device.id);
      if (!existing) AppState.btDeviceList.push(deviceEntry);

      this.renderDeviceList();
      Notifications.add('Device Found', `Discovered: ${deviceEntry.name}`, 'success', 'fa-bluetooth');

      device.addEventListener('gattserverdisconnected', () => this.onDisconnected());

      // Auto-connect prompt
      await this.connect(device);

    } catch (err) {
      if (err.name === 'NotFoundError') {
        Notifications.add('Scan Cancelled', 'Device selection was cancelled', 'warning', 'fa-xmark');
      } else {
        Notifications.add('Scan Error', err.message, 'error', 'fa-circle-exclamation');
      }
    } finally {
      this.isScanning = false;
      this.updateScanUI(false);
    }
  },

  async connect(device) {
    if (!device && !this.device) {
      Notifications.add('No Device', 'Please scan for a device first', 'warning', 'fa-bluetooth');
      return;
    }

    const dev = device || this.device;
    this.updateUI('connecting', `Connecting to ${dev.name || 'device'}...`);
    Notifications.add('Connecting...', `Establishing connection to ${dev.name || 'BLE device'}`, 'info', 'fa-bluetooth');

    try {
      this.server = await dev.gatt.connect();
      this.logCommand(`Connected to GATT server: ${dev.name}`);

      try {
        this.service = await this.server.getPrimaryService(this.SERVICE_UUID);
        this.characteristic = await this.service.getCharacteristic(this.CHAR_UUID);

        // Enable notifications from device
        await this.characteristic.startNotifications();
        this.characteristic.addEventListener('characteristicvaluechanged', (e) => this.onDataReceived(e));
      } catch (serviceErr) {
        // Device doesn't have our specific service — treat as generic
        this.logCommand('Device connected (generic mode — no service UUID matched)');
      }

      AppState.btConnected = true;
      AppState.controlSource = 'BLUETOOTH';
      AppState.btDevice = dev;

      this.updateUI('connected', `Connected to ${dev.name || 'BLE Device'}`);
      Notifications.add('Bluetooth Connected', `Successfully connected to ${dev.name || 'BLE Device'}`, 'success', 'fa-bluetooth');
      Dashboard.updateAll();

      // Send current state
      await this.sendCommand(AppState.ledOn ? 'LED_ON' : 'LED_OFF');

      // Update device list
      const entry = AppState.btDeviceList.find(d => d.id === dev.id);
      if (entry) { entry.connected = true; entry.paired = true; }
      this.renderDeviceList();

    } catch (err) {
      AppState.btConnected = false;
      this.updateUI('error', `Connection failed: ${err.message}`);
      Notifications.add('Connection Failed', err.message, 'error', 'fa-circle-exclamation');
    }
  },

  async disconnect() {
    if (this.server && this.server.connected) {
      this.server.disconnect();
    }
    this.onDisconnected();
  },

  onDisconnected() {
    AppState.btConnected = false;
    AppState.btDevice = null;
    AppState.controlSource = 'AUTONOMOUS';

    this.server = null;
    this.characteristic = null;

    this.updateUI('disconnected', 'Disconnected — Autonomous mode activated');
    Notifications.add('Bluetooth Disconnected', 'System switched to Autonomous control mode', 'warning', 'fa-bluetooth');
    Dashboard.updateAll();

    // Update device list
    AppState.btDeviceList.forEach(d => d.connected = false);
    this.renderDeviceList();
  },

  async sendCommand(cmdKey) {
    const payload = this.COMMANDS[cmdKey] || cmdKey;
    const logEntry = `→ SENT: ${cmdKey} (${payload}) @ ${new Date().toLocaleTimeString()}`;
    this.logCommand(logEntry);

    if (!this.characteristic) {
      // Simulate sending
      this.logCommand(`[SIM] Command sent: ${cmdKey}`);
      return;
    }

    try {
      const encoder = new TextEncoder();
      await this.characteristic.writeValue(encoder.encode(payload + '\n'));
      this.logCommand(`✓ Command delivered: ${cmdKey}`);
    } catch (err) {
      this.logCommand(`✗ Send failed: ${err.message}`);
      Notifications.add('Command Error', `Failed to send: ${cmdKey}`, 'error', 'fa-circle-exclamation');
    }
  },

  onDataReceived(event) {
    const decoder = new TextDecoder();
    const data = decoder.decode(event.target.value).trim();
    this.logCommand(`← RECV: ${data} @ ${new Date().toLocaleTimeString()}`);

    // Parse responses
    if (data === 'OK_ON') { AppState.ledOn = true; Lighting.updateUI(); }
    else if (data === 'OK_OFF') { AppState.ledOn = false; Lighting.updateUI(); }
    else if (data.startsWith('B:')) {
      const pct = parseInt(data.split(':')[1]);
      Lighting.setBrightness(pct);
    }
  },

  logCommand(msg) {
    this.commandLog.unshift({ msg, time: new Date() });
    if (this.commandLog.length > 50) this.commandLog.pop();
    this.renderCommandLog();
  },

  renderCommandLog() {
    const container = document.getElementById('bt-command-log');
    if (!container) return;
    container.innerHTML = this.commandLog.slice(0, 20).map(entry => `
      <div style="padding: 6px 0; border-bottom: 1px solid rgba(255,255,255,0.05); font-size: 0.78rem;">
        <span class="font-mono" style="color: var(--accent-blue);">${entry.time.toLocaleTimeString()}</span>
        <span style="color: var(--text-secondary); margin-left: 10px;">${entry.msg}</span>
      </div>
    `).join('');
  },

  updateUI(status, message) {
    const statusEl = document.getElementById('bt-status-text');
    const connBadge = document.getElementById('bt-conn-badge');
    const connectBtn = document.getElementById('bt-connect-btn');
    const disconnectBtn = document.getElementById('bt-disconnect-btn');

    if (statusEl) statusEl.textContent = message || '';

    if (connBadge) {
      const statusMap = {
        connected: { text: 'CONNECTED', class: 'badge-green' },
        disconnected: { text: 'DISCONNECTED', class: 'badge-red' },
        connecting: { text: 'CONNECTING...', class: 'badge-yellow' },
        error: { text: 'ERROR', class: 'badge-red' },
        scanning: { text: 'SCANNING...', class: 'badge-blue' },
      };
      const s = statusMap[status] || { text: status, class: 'badge-blue' };
      connBadge.textContent = s.text;
      connBadge.className = `conn-badge ${s.class}`;
    }

    if (connectBtn) connectBtn.disabled = status === 'connected' || status === 'connecting';
    if (disconnectBtn) disconnectBtn.disabled = status !== 'connected';

    // Sidebar dot
    Dashboard.updateConnectionStatus();
  },

  updateScanUI(scanning) {
    const scanArea = document.getElementById('bt-scan-area');
    const scanBtn = document.getElementById('bt-scan-btn');
    const radarEl = document.getElementById('bt-radar');

    if (scanArea) {
      scanArea.classList.toggle('scanning', scanning);
    }
    if (scanBtn) {
      scanBtn.disabled = scanning;
      scanBtn.innerHTML = scanning
        ? '<span class="loading-spinner loading-spinner-sm"></span> Scanning...'
        : '<i class="fa-solid fa-magnifying-glass"></i> Scan Devices';
    }
    if (radarEl) {
      radarEl.style.display = scanning ? 'block' : 'block';
    }
  },

  addSimulatedDevices() {
    const simDevices = [
      { name: 'Arduino BLE Module', id: 'sim-001', rssi: -45, type: 'arduino', paired: false, connected: false },
      { name: 'Smart Bulb Pro X1', id: 'sim-002', rssi: -62, type: 'bulb', paired: false, connected: false },
      { name: 'HC-08 BT Module', id: 'sim-003', rssi: -71, type: 'module', paired: false, connected: false },
      { name: 'Philips Hue Lamp', id: 'sim-004', rssi: -58, type: 'bulb', paired: false, connected: false },
      { name: 'ESP32-BLE-01', id: 'sim-005', rssi: -80, type: 'arduino', paired: false, connected: false },
    ];

    simDevices.forEach(d => {
      if (!AppState.btDeviceList.find(x => x.id === d.id)) {
        AppState.btDeviceList.push(d);
      }
    });

    this.renderDeviceList();
    Notifications.add('Devices Found', `Discovered ${simDevices.length} nearby devices`, 'info', 'fa-bluetooth');
  },

  connectSimulated(deviceId) {
    const device = AppState.btDeviceList.find(d => d.id === deviceId);
    if (!device) return;

    // Simulate connection
    this.updateUI('connecting', `Connecting to ${device.name}...`);
    Notifications.add('Connecting...', `Establishing BLE connection to ${device.name}`, 'info', 'fa-bluetooth');

    setTimeout(() => {
      AppState.btConnected = true;
      AppState.controlSource = 'BLUETOOTH';
      device.connected = true;
      device.paired = true;

      this.updateUI('connected', `Connected to ${device.name}`);
      Notifications.add('Bluetooth Connected', `Paired & connected to ${device.name}`, 'success', 'fa-bluetooth');
      this.logCommand(`Connected to ${device.name} (${device.id})`);
      this.logCommand(`RSSI: ${device.rssi} dBm`);
      this.logCommand('Service discovery complete');
      this.logCommand('Ready to send commands');

      // Send initial state
      this.logCommand(`→ SENT: LED_${AppState.ledOn ? 'ON' : 'OFF'}`);

      Dashboard.updateAll();
      this.renderDeviceList();
    }, 1500);
  },

  disconnectSimulated() {
    AppState.btDeviceList.forEach(d => d.connected = false);
    this.onDisconnected();
  },

  renderDeviceList() {
    const container = document.getElementById('bt-device-list');
    if (!container) return;

    if (AppState.btDeviceList.length === 0) {
      container.innerHTML = `
        <div style="text-align:center; padding: 30px; color: var(--text-secondary);">
          <i class="fa-solid fa-bluetooth" style="font-size:2rem; margin-bottom:10px; display:block; opacity:0.3;"></i>
          No devices found. Click "Scan Devices" to search.
        </div>`;
      return;
    }

    const typeIcons = { arduino: '🤖', bulb: '💡', module: '📡' };
    const typeColors = { arduino: 'var(--accent-blue)', bulb: 'var(--accent-yellow)', module: 'var(--accent-violet)' };

    container.innerHTML = AppState.btDeviceList.map(dev => `
      <div class="device-item ${dev.connected ? 'connected' : ''}" id="device-${dev.id}">
        <div class="device-icon" style="background: rgba(0,0,0,0.3); font-size: 1.4rem;">${typeIcons[dev.type] || '📶'}</div>
        <div class="device-info">
          <div class="device-name">${dev.name} ${dev.paired ? '<i class="fa-solid fa-shield-check" style="color:var(--accent-green);font-size:0.75rem;"></i>' : ''}</div>
          <div class="device-mac mono" style="color:var(--text-muted);">ID: ${dev.id} &nbsp;|&nbsp; RSSI: ${dev.rssi} dBm</div>
          <div style="margin-top:4px;">
            <span class="signal-bars">
              ${[1,2,3,4].map((_, i) => `<div class="signal-bar ${-dev.rssi < (40 + i * 12) ? 'active' : ''}"></div>`).join('')}
            </span>
          </div>
        </div>
        <div style="display:flex;flex-direction:column;gap:6px;align-items:flex-end;">
          ${dev.connected
            ? `<span style="color:var(--accent-green);font-size:0.78rem;font-weight:600;">● CONNECTED</span>
               <button class="btn-neon btn-danger btn-sm" onclick="Bluetooth.disconnectSimulated()">Disconnect</button>`
            : `<button class="btn-neon btn-secondary btn-sm" onclick="Bluetooth.connectSimulated('${dev.id}')">Connect</button>`
          }
        </div>
      </div>
    `).join('');
  },

  guessDeviceType(name) {
    if (!name) return 'module';
    const n = name.toLowerCase();
    if (n.includes('bulb') || n.includes('hue') || n.includes('lamp')) return 'bulb';
    if (n.includes('arduino') || n.includes('esp') || n.includes('hc')) return 'arduino';
    return 'module';
  },

  sendBTCommand(cmdKey) {
    if (!AppState.btConnected) {
      Notifications.add('Not Connected', 'Connect to a Bluetooth device first', 'warning', 'fa-bluetooth');
      return;
    }
    this.logCommand(`→ CMD: ${cmdKey}`);

    // Apply command locally too
    switch(cmdKey) {
      case 'LED_ON': Lighting.setLED(true, 80, 'bluetooth'); break;
      case 'LED_OFF': Lighting.setLED(false, 0, 'bluetooth'); break;
      case 'MODE_AUTO': Lighting.setMode('AUTO'); break;
      case 'MODE_SLEEP': Lighting.setMode('SLEEP'); break;
      case 'MODE_PARTY': Lighting.setMode('PARTY'); break;
      case 'MODE_READING': Lighting.setMode('READING'); break;
    }

    Notifications.add('Command Sent', `BLE → Arduino: ${cmdKey}`, 'success', 'fa-paper-plane');
  }
};
