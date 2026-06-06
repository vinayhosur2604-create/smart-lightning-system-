/**
 * Smart Lighting System - Smart Room SVG Visualization
 * Renders an animated interactive smart room
 */

const Visualization = {
  currentBrightness: 0,
  motionDetected: false,

  render() {
    const container = document.getElementById('smart-room-svg-container');
    if (!container) return;

    container.innerHTML = this.buildRoomSVG();
    this.updateBrightness(AppState.brightness);
    this.updateMotion(AppState.pirMotion);
  },

  buildRoomSVG() {
    return `
    <svg viewBox="0 0 800 500" xmlns="http://www.w3.org/2000/svg" class="smart-room-svg" id="smart-room-svg">
      <defs>
        <!-- Room gradient backgrounds -->
        <linearGradient id="wallGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:#1a1a3e;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#0d0d2e;stop-opacity:1" />
        </linearGradient>
        <linearGradient id="floorGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:#12122a;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#0a0a1e;stop-opacity:1" />
        </linearGradient>

        <!-- Light cone gradient -->
        <radialGradient id="lightCone" cx="50%" cy="0%" r="100%">
          <stop offset="0%" style="stop-color:#fff8dc;stop-opacity:0.9" id="lightStop0"/>
          <stop offset="40%" style="stop-color:#ffe87c;stop-opacity:0.4" id="lightStop1"/>
          <stop offset="100%" style="stop-color:#ffaa00;stop-opacity:0" id="lightStop2"/>
        </radialGradient>

        <!-- Ambient glow -->
        <radialGradient id="ambientGlow" cx="50%" cy="30%" r="70%">
          <stop offset="0%" style="stop-color:#fff8dc;stop-opacity:0.15" id="ambientStop0"/>
          <stop offset="100%" style="stop-color:#ffe87c;stop-opacity:0" id="ambientStop1"/>
        </radialGradient>

        <!-- PIR sensor gradient -->
        <radialGradient id="pirGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" style="stop-color:#f59e0b;stop-opacity:0.9" />
          <stop offset="100%" style="stop-color:#d97706;stop-opacity:0.7" />
        </radialGradient>

        <!-- LDR sensor gradient -->
        <radialGradient id="ldrGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" style="stop-color:#00d4ff;stop-opacity:0.9" />
          <stop offset="100%" style="stop-color:#0099cc;stop-opacity:0.7" />
        </radialGradient>

        <!-- BLE module gradient -->
        <radialGradient id="bleGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" style="stop-color:#a855f7;stop-opacity:0.9" />
          <stop offset="100%" style="stop-color:#7c3aed;stop-opacity:0.7" />
        </radialGradient>

        <!-- Filters -->
        <filter id="glow-light" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="12" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
        <filter id="glow-sensor" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
        <filter id="glow-motion" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="8" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      <!-- Room background -->
      <rect width="800" height="500" fill="url(#wallGrad)" rx="12"/>

      <!-- Floor -->
      <rect x="0" y="380" width="800" height="120" fill="url(#floorGrad)"/>
      <line x1="0" y1="380" x2="800" y2="380" stroke="rgba(0,212,255,0.15)" stroke-width="1"/>

      <!-- Floor reflections (grid) -->
      ${[100,200,300,400,500,600,700].map(x => `<line x1="${x}" y1="380" x2="${x}" y2="500" stroke="rgba(0,212,255,0.04)" stroke-width="1"/>`).join('')}
      ${[420,460].map(y => `<line x1="0" y1="${y}" x2="800" y2="${y}" stroke="rgba(0,212,255,0.04)" stroke-width="1"/>`).join('')}

      <!-- Left wall -->
      <rect x="0" y="0" width="60" height="500" fill="rgba(0,0,0,0.3)"/>
      <line x1="60" y1="0" x2="60" y2="500" stroke="rgba(0,212,255,0.08)" stroke-width="1"/>

      <!-- Right wall -->
      <rect x="740" y="0" width="60" height="500" fill="rgba(0,0,0,0.3)"/>
      <line x1="740" y1="0" x2="740" y2="500" stroke="rgba(0,212,255,0.08)" stroke-width="1"/>

      <!-- Ceiling -->
      <rect x="0" y="0" width="800" height="40" fill="rgba(0,0,0,0.4)"/>
      <line x1="0" y1="40" x2="800" y2="40" stroke="rgba(0,212,255,0.1)" stroke-width="1"/>

      <!-- AMBIENT LIGHT OVERLAY -->
      <rect id="room-ambient" width="800" height="500" fill="url(#ambientGlow)" opacity="0" style="transition: opacity 0.8s ease;"/>

      <!-- LIGHT CONE (from ceiling light) -->
      <ellipse id="light-cone" cx="400" cy="40" rx="200" ry="340" fill="url(#lightCone)" opacity="0" style="transition: opacity 0.8s ease;"/>

      <!-- ===== CEILING LIGHT FIXTURE ===== -->
      <!-- Pendant light -->
      <line x1="400" y1="0" x2="400" y2="35" stroke="#888" stroke-width="2"/>
      <!-- Fixture housing -->
      <rect x="370" y="35" width="60" height="18" rx="4" fill="#333" stroke="rgba(255,255,255,0.15)" stroke-width="1"/>
      <!-- LED bulb -->
      <ellipse id="led-bulb" cx="400" cy="53" rx="22" ry="14" fill="#2a2a2a" stroke="#444" stroke-width="1"/>
      <!-- Bulb glow ring -->
      <ellipse id="led-bulb-glow" cx="400" cy="53" rx="28" ry="18" fill="none" stroke="#ffdd66" stroke-width="0" opacity="0" style="transition: all 0.5s ease;"/>
      <!-- LED text -->
      <text x="400" y="57" text-anchor="middle" fill="#555" font-size="8" font-family="JetBrains Mono">LED</text>

      <!-- ===== SECOND LIGHT ===== -->
      <line x1="620" y1="0" x2="620" y2="30" stroke="#888" stroke-width="1.5"/>
      <rect x="598" y="30" width="44" height="14" rx="3" fill="#333" stroke="rgba(255,255,255,0.1)" stroke-width="1"/>
      <ellipse id="led-bulb-2" cx="620" cy="44" rx="16" ry="10" fill="#2a2a2a" stroke="#444" stroke-width="1"/>
      <ellipse cx="620" cy="60" rx="80" ry="120" fill="url(#lightCone)" opacity="0" id="light-cone-2" style="transition: opacity 0.8s ease;"/>

      <!-- ===== FURNITURE ===== -->
      <!-- Sofa -->
      <rect x="100" y="310" width="200" height="70" rx="8" fill="#1e1e3e" stroke="rgba(0,212,255,0.15)" stroke-width="1"/>
      <rect x="90" y="300" width="220" height="25" rx="6" fill="#2a2a4e" stroke="rgba(0,212,255,0.1)" stroke-width="1"/>
      <!-- Sofa cushions -->
      <rect x="105" y="315" width="85" height="50" rx="6" fill="#252545"/>
      <rect x="205" y="315" width="85" height="50" rx="6" fill="#252545"/>
      <!-- Sofa armrests -->
      <rect x="92" y="305" width="18" height="75" rx="4" fill="#2a2a4e"/>
      <rect x="290" y="305" width="18" height="75" rx="4" fill="#2a2a4e"/>

      <!-- Coffee Table -->
      <rect x="155" y="380" width="90" height="8" rx="3" fill="#1a1a30" stroke="rgba(0,212,255,0.1)" stroke-width="1"/>
      <!-- Table legs -->
      <rect x="162" y="388" width="6" height="20" fill="#151525"/>
      <rect x="232" y="388" width="6" height="20" fill="#151525"/>

      <!-- Bookshelf -->
      <rect x="650" y="180" width="80" height="200" rx="4" fill="#1a1a30" stroke="rgba(0,212,255,0.08)" stroke-width="1"/>
      <!-- Shelf dividers -->
      <rect x="650" y="220" width="80" height="3" fill="rgba(0,212,255,0.15)"/>
      <rect x="650" y="280" width="80" height="3" fill="rgba(0,212,255,0.15)"/>
      <rect x="650" y="340" width="80" height="3" fill="rgba(0,212,255,0.15)"/>
      <!-- Books -->
      ${[0,1,2,3].map(shelf => {
        const y = 185 + shelf * 60;
        const colors = ['#7c3aed','#0099cc','#f59e0b','#ec4899','#10b981'];
        return [0,1,2,3].map(book => {
          const x = 655 + book * 18;
          const h = 20 + Math.random() * 15;
          const c = colors[Math.floor(Math.random() * colors.length)];
          return `<rect x="${x}" y="${y + (35 - h)}" width="14" height="${h}" rx="2" fill="${c}" opacity="0.7"/>`;
        }).join('');
      }).join('')}

      <!-- Desk -->
      <rect x="480" y="310" width="160" height="10" rx="3" fill="#1e1e3e" stroke="rgba(0,212,255,0.12)" stroke-width="1"/>
      <rect x="488" y="320" width="6" height="60" fill="#181830"/>
      <rect x="626" y="320" width="6" height="60" fill="#181830"/>
      <!-- Monitor on desk -->
      <rect x="530" y="250" width="70" height="55" rx="4" fill="#111" stroke="rgba(0,212,255,0.3)" stroke-width="1"/>
      <rect x="532" y="252" width="66" height="51" rx="2" fill="#0a192f"/>
      <!-- Monitor screen (glowing) -->
      <rect x="533" y="253" width="64" height="49" rx="2" fill="none" stroke="rgba(0,212,255,0.4)" stroke-width="0.5"/>
      <!-- Code lines on screen -->
      <rect x="537" y="258" width="30" height="2" rx="1" fill="rgba(0,212,255,0.5)" opacity="0.7"/>
      <rect x="537" y="263" width="45" height="2" rx="1" fill="rgba(168,85,247,0.5)" opacity="0.7"/>
      <rect x="537" y="268" width="25" height="2" rx="1" fill="rgba(16,185,129,0.5)" opacity="0.7"/>
      <rect x="537" y="273" width="40" height="2" rx="1" fill="rgba(245,158,11,0.5)" opacity="0.7"/>
      <rect x="537" y="278" width="35" height="2" rx="1" fill="rgba(0,212,255,0.5)" opacity="0.7"/>
      <rect x="537" y="283" width="50" height="2" rx="1" fill="rgba(168,85,247,0.4)" opacity="0.7"/>
      <!-- Monitor stand -->
      <rect x="561" y="305" width="8" height="6" rx="1" fill="#222"/>
      <rect x="553" y="309" width="24" height="3" rx="1" fill="#222"/>
      <!-- Keyboard -->
      <rect x="518" y="316" width="80" height="8" rx="2" fill="#181830" stroke="rgba(255,255,255,0.08)" stroke-width="0.5"/>

      <!-- PLANT -->
      <rect x="710" y="340" width="22" height="40" rx="3" fill="#2a1a10"/>
      <ellipse cx="721" cy="335" rx="18" ry="15" fill="#155a20"/>
      <ellipse cx="708" cy="345" rx="12" ry="10" fill="#1a6b28"/>
      <ellipse cx="734" cy="343" rx="12" ry="10" fill="#1a6b28"/>
      <ellipse cx="718" cy="325" rx="10" ry="8" fill="#1e7a2f"/>

      <!-- ===== SENSORS ===== -->

      <!-- PIR MOTION SENSOR (top-right area) -->
      <g id="pir-sensor" transform="translate(680, 100)">
        <!-- Mount base -->
        <rect x="-12" y="-5" width="24" height="8" rx="2" fill="#2a2a2a" stroke="#444" stroke-width="1"/>
        <!-- Sensor dome -->
        <ellipse cx="0" cy="-12" rx="14" ry="12" fill="url(#pirGrad)" filter="url(#glow-sensor)"/>
        <ellipse cx="0" cy="-12" rx="10" ry="8" fill="rgba(245,158,11,0.3)"/>
        <!-- Detection lines when active -->
        <g id="pir-detection-lines" opacity="0">
          <line x1="0" y1="-20" x2="-60" y2="80" stroke="#f59e0b" stroke-width="0.5" stroke-dasharray="4,4" opacity="0.4"/>
          <line x1="0" y1="-20" x2="-30" y2="80" stroke="#f59e0b" stroke-width="0.5" stroke-dasharray="4,4" opacity="0.3"/>
          <line x1="0" y1="-20" x2="0" y2="80" stroke="#f59e0b" stroke-width="0.5" stroke-dasharray="4,4" opacity="0.4"/>
          <line x1="0" y1="-20" x2="30" y2="80" stroke="#f59e0b" stroke-width="0.5" stroke-dasharray="4,4" opacity="0.3"/>
          <line x1="0" y1="-20" x2="60" y2="80" stroke="#f59e0b" stroke-width="0.5" stroke-dasharray="4,4" opacity="0.4"/>
        </g>
        <!-- Motion ring animation -->
        <circle id="pir-ring-1" cx="0" cy="-12" r="18" fill="none" stroke="#f59e0b" stroke-width="1.5" opacity="0"/>
        <circle id="pir-ring-2" cx="0" cy="-12" r="18" fill="none" stroke="#f59e0b" stroke-width="1" opacity="0"/>
        <!-- Label -->
        <text x="0" y="10" text-anchor="middle" fill="#f59e0b" font-size="9" font-family="JetBrains Mono" font-weight="600">PIR</text>
      </g>

      <!-- LDR SENSOR (top-left area) -->
      <g id="ldr-sensor" transform="translate(120, 100)">
        <rect x="-12" y="-5" width="24" height="8" rx="2" fill="#2a2a2a" stroke="#444" stroke-width="1"/>
        <rect x="-10" y="-16" width="20" height="14" rx="3" fill="url(#ldrGrad)" filter="url(#glow-sensor)"/>
        <rect x="-7" y="-13" width="14" height="8" rx="2" fill="rgba(0,212,255,0.3)"/>
        <!-- Grid lines on LDR -->
        <line x1="-3" y1="-13" x2="-3" y2="-5" stroke="rgba(0,212,255,0.5)" stroke-width="0.7"/>
        <line x1="3" y1="-13" x2="3" y2="-5" stroke="rgba(0,212,255,0.5)" stroke-width="0.7"/>
        <line x1="-7" y1="-9" x2="7" y2="-9" stroke="rgba(0,212,255,0.5)" stroke-width="0.7"/>
        <text x="0" y="10" text-anchor="middle" fill="#00d4ff" font-size="9" font-family="JetBrains Mono" font-weight="600">LDR</text>
      </g>

      <!-- BLE MODULE (wall, right side) -->
      <g id="ble-sensor" transform="translate(740, 220)">
        <rect x="-15" y="-20" width="28" height="40" rx="4" fill="#1a1a2e" stroke="rgba(168,85,247,0.5)" stroke-width="1.5"/>
        <!-- BT symbol -->
        <text x="-1" y="4" text-anchor="middle" fill="url(#bleGrad)" font-size="16" font-weight="bold">&#8260;</text>
        <!-- Wireless rings -->
        <path id="ble-ring-1" d="M 5 -10 Q 20 0 5 10" fill="none" stroke="rgba(168,85,247,0.6)" stroke-width="1.5" opacity="0"/>
        <path id="ble-ring-2" d="M 5 -16 Q 30 0 5 16" fill="none" stroke="rgba(168,85,247,0.4)" stroke-width="1" opacity="0"/>
        <text x="-1" y="28" text-anchor="middle" fill="#a855f7" font-size="7" font-family="JetBrains Mono">BLE</text>
      </g>

      <!-- ARDUINO UNO (bottom-right) -->
      <g transform="translate(580, 400)">
        <rect x="0" y="0" width="100" height="65" rx="4" fill="#006633" stroke="#00aa55" stroke-width="1.5"/>
        <!-- Arduino logo area -->
        <rect x="5" y="5" width="90" height="55" rx="3" fill="#007a3d"/>
        <!-- Pin headers -->
        ${Array.from({length:14}, (_,i) => `<rect x="${8 + i*6}" y="3" width="3" height="5" rx="1" fill="#ccc"/>`).join('')}
        ${Array.from({length:6}, (_,i) => `<rect x="${8 + i*10}" y="57" width="3" height="5" rx="1" fill="#ccc"/>`).join('')}
        <!-- USB port -->
        <rect x="80" y="18" width="20" height="15" rx="2" fill="#333"/>
        <!-- Chips -->
        <rect x="20" y="20" width="30" height="25" rx="2" fill="#222" stroke="#555" stroke-width="0.5"/>
        <rect x="55" y="22" width="18" height="18" rx="2" fill="#111" stroke="#444" stroke-width="0.5"/>
        <!-- LED on board -->
        <circle id="arduino-led" cx="15" cy="45" r="4" fill="#10b981" filter="url(#glow-sensor)"/>
        <!-- Label -->
        <text x="50" y="75" text-anchor="middle" fill="#00d4ff" font-size="9" font-family="JetBrains Mono">Arduino Uno</text>
      </g>

      <!-- RTC MODULE -->
      <g transform="translate(500, 410)">
        <rect x="0" y="0" width="60" height="35" rx="3" fill="#1a1a3e" stroke="rgba(0,212,255,0.3)" stroke-width="1"/>
        <!-- Crystal -->
        <rect x="8" y="8" width="16" height="20" rx="2" fill="#222" stroke="#555" stroke-width="0.5"/>
        <!-- Battery -->
        <circle cx="45" cy="18" r="10" fill="#c0a000" stroke="#888" stroke-width="0.5"/>
        <!-- Time display -->
        <text x="30" y="50" text-anchor="middle" fill="#00d4ff" font-size="8" font-family="JetBrains Mono">RTC DS3231</text>
      </g>

      <!-- PERSON (when motion detected) -->
      <g id="room-person" opacity="0" style="transition: opacity 0.5s ease;" transform="translate(320, 260)">
        <!-- Head -->
        <circle cx="0" cy="-60" r="18" fill="#d4a574" stroke="rgba(255,255,255,0.1)" stroke-width="1"/>
        <!-- Hair -->
        <ellipse cx="0" cy="-75" rx="18" ry="8" fill="#4a3020"/>
        <!-- Body -->
        <rect x="-16" y="-42" width="32" height="55" rx="8" fill="#2a4a8a"/>
        <!-- Pants -->
        <rect x="-16" y="10" width="14" height="40" rx="4" fill="#1a2a5a"/>
        <rect x="2" y="10" width="14" height="40" rx="4" fill="#1a2a5a"/>
        <!-- Arms -->
        <rect x="-32" y="-40" width="16" height="40" rx="6" fill="#d4a574"/>
        <rect x="16" y="-40" width="16" height="40" rx="6" fill="#d4a574"/>
        <!-- Eyes -->
        <circle cx="-6" cy="-62" r="3" fill="#333"/>
        <circle cx="6" cy="-62" r="3" fill="#333"/>
        <!-- Smile -->
        <path d="M -6 -54 Q 0 -49 6 -54" fill="none" stroke="#333" stroke-width="1.5" stroke-linecap="round"/>
        <!-- Motion rings around person -->
        <circle cx="0" cy="-20" r="50" fill="none" stroke="#f59e0b" stroke-width="1" opacity="0.3" id="person-ring-1"/>
        <circle cx="0" cy="-20" r="70" fill="none" stroke="#f59e0b" stroke-width="0.7" opacity="0.2" id="person-ring-2"/>
      </g>

      <!-- MOTION DETECTED INDICATOR -->
      <g id="motion-detected-badge" opacity="0" style="transition: opacity 0.5s ease;" transform="translate(260, 200)">
        <rect x="0" y="0" width="120" height="32" rx="16" fill="rgba(245,158,11,0.2)" stroke="rgba(245,158,11,0.6)" stroke-width="1.5"/>
        <circle cx="20" cy="16" r="5" fill="#f59e0b"/>
        <text x="32" y="21" fill="#f59e0b" font-size="11" font-family="Outfit" font-weight="700">MOTION DETECTED</text>
      </g>

      <!-- BLE CONNECTED INDICATOR -->
      <g id="ble-connected-badge" opacity="0" style="transition: opacity 0.5s ease;" transform="translate(590, 160)">
        <rect x="0" y="0" width="130" height="28" rx="14" fill="rgba(168,85,247,0.2)" stroke="rgba(168,85,247,0.6)" stroke-width="1.5"/>
        <circle cx="18" cy="14" r="4" fill="#a855f7"/>
        <text x="30" y="19" fill="#a855f7" font-size="10" font-family="Outfit" font-weight="700">BLE CONNECTED</text>
      </g>

      <!-- LED STATUS BADGE -->
      <g id="led-status-badge" transform="translate(340, 30)">
        <rect x="0" y="0" width="120" height="28" rx="14" fill="rgba(0,0,0,0.5)" stroke="rgba(255,221,102,0.3)" stroke-width="1" id="led-badge-bg"/>
        <circle cx="18" cy="14" r="5" fill="#333" id="led-badge-dot"/>
        <text x="30" y="19" fill="#888" font-size="10" font-family="JetBrains Mono" font-weight="600" id="led-badge-text">LED OFF</text>
      </g>

      <!-- BRIGHTNESS BADGE -->
      <g transform="translate(460, 30)">
        <rect x="0" y="0" width="110" height="28" rx="14" fill="rgba(0,0,0,0.5)" stroke="rgba(0,212,255,0.2)" stroke-width="1"/>
        <text x="10" y="19" fill="#00d4ff" font-size="10" font-family="JetBrains Mono" id="svg-brightness-text">BRT: 0%</text>
      </g>

      <!-- MODE BADGE -->
      <g transform="translate(80" y="30">
      </g>
      <g transform="translate(80, 30)">
        <rect x="0" y="0" width="120" height="28" rx="14" fill="rgba(0,0,0,0.5)" stroke="rgba(124,58,237,0.3)" stroke-width="1"/>
        <text x="10" y="19" fill="#a855f7" font-size="10" font-family="JetBrains Mono" id="svg-mode-text">MODE: AUTO</text>
      </g>

      <!-- SCAN LINE EFFECT (top to bottom) -->
      <rect x="60" y="0" width="680" height="2" fill="rgba(0,212,255,0.3)" id="room-scan-line">
        <animateTransform attributeName="transform" type="translate" values="0,40;0,380;0,40" dur="6s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0.4;0.1;0.4" dur="6s" repeatCount="indefinite"/>
      </rect>

      <!-- Corner decorations -->
      <text x="72" y="490" fill="rgba(0,212,255,0.3)" font-size="8" font-family="JetBrains Mono">SmartLight v1.0 | Arduino UNO | PIR+LDR+RTC+BLE</text>
      <text x="728" y="490" text-anchor="end" fill="rgba(0,212,255,0.3)" font-size="8" font-family="JetBrains Mono" id="svg-time-display">00:00:00</text>
    </svg>`;
  },

  updateBrightness(pct) {
    this.currentBrightness = pct;
    const opacity = pct / 100;

    // Light cone
    const lightCone = document.getElementById('light-cone');
    const lightCone2 = document.getElementById('light-cone-2');
    const roomAmbient = document.getElementById('room-ambient');

    if (lightCone) lightCone.setAttribute('opacity', (opacity * 0.85).toFixed(2));
    if (lightCone2) lightCone2.setAttribute('opacity', (opacity * 0.6).toFixed(2));
    if (roomAmbient) roomAmbient.setAttribute('opacity', (opacity * 0.3).toFixed(2));

    // LED bulb glow
    const bulbGlow = document.getElementById('led-bulb-glow');
    if (bulbGlow) {
      bulbGlow.setAttribute('stroke-width', (pct / 10).toFixed(1));
      bulbGlow.setAttribute('opacity', opacity.toFixed(2));
    }

    const ledBulb = document.getElementById('led-bulb');
    if (ledBulb) {
      if (pct > 0) {
        ledBulb.setAttribute('fill', `rgba(255, ${200 + Math.round(pct * 0.55)}, ${Math.round(pct)}, 0.9)`);
        ledBulb.setAttribute('filter', 'url(#glow-light)');
      } else {
        ledBulb.setAttribute('fill', '#2a2a2a');
        ledBulb.removeAttribute('filter');
      }
    }

    // LED status badge
    const ledBadgeDot = document.getElementById('led-badge-dot');
    const ledBadgeText = document.getElementById('led-badge-text');
    const ledBadgeBg = document.getElementById('led-badge-bg');

    if (pct > 0) {
      if (ledBadgeDot) ledBadgeDot.setAttribute('fill', '#ffdd66');
      if (ledBadgeText) { ledBadgeText.setAttribute('fill', '#ffdd66'); ledBadgeText.textContent = `LED ON`; }
      if (ledBadgeBg) ledBadgeBg.setAttribute('stroke', 'rgba(255,221,102,0.6)');
    } else {
      if (ledBadgeDot) ledBadgeDot.setAttribute('fill', '#333');
      if (ledBadgeText) { ledBadgeText.setAttribute('fill', '#888'); ledBadgeText.textContent = 'LED OFF'; }
      if (ledBadgeBg) ledBadgeBg.setAttribute('stroke', 'rgba(255,221,102,0.2)');
    }

    // Brightness text
    const svgBrt = document.getElementById('svg-brightness-text');
    if (svgBrt) svgBrt.textContent = `BRT: ${Math.round(pct)}%`;

    // Mode text
    const svgMode = document.getElementById('svg-mode-text');
    if (svgMode) svgMode.textContent = `MODE: ${AppState.currentMode}`;

    // Time
    const svgTime = document.getElementById('svg-time-display');
    if (svgTime) svgTime.textContent = AppState.rtcTime.toLocaleTimeString('en-US', {hour12:false});
  },

  updateMotion(detected) {
    this.motionDetected = detected;

    const person = document.getElementById('room-person');
    const badge = document.getElementById('motion-detected-badge');
    const pirLines = document.getElementById('pir-detection-lines');
    const pirRing1 = document.getElementById('pir-ring-1');
    const pirRing2 = document.getElementById('pir-ring-2');

    if (person) person.setAttribute('opacity', detected ? '1' : '0');
    if (badge) badge.setAttribute('opacity', detected ? '1' : '0');
    if (pirLines) pirLines.setAttribute('opacity', detected ? '1' : '0');

    if (detected) {
      // Animate PIR rings
      if (pirRing1) {
        pirRing1.setAttribute('opacity', '0.8');
        pirRing1.innerHTML = `
          <animate attributeName="r" values="18;35;18" dur="1.5s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="0.8;0;0.8" dur="1.5s" repeatCount="indefinite"/>
        `;
      }
      if (pirRing2) {
        pirRing2.setAttribute('opacity', '0.5');
        pirRing2.innerHTML = `
          <animate attributeName="r" values="18;40;18" dur="1.5s" begin="0.5s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="0.5;0;0.5" dur="1.5s" begin="0.5s" repeatCount="indefinite"/>
        `;
      }
    } else {
      if (pirRing1) { pirRing1.setAttribute('opacity', '0'); pirRing1.innerHTML = ''; }
      if (pirRing2) { pirRing2.setAttribute('opacity', '0'); pirRing2.innerHTML = ''; }
    }

    // BLE badge
    const bleBadge = document.getElementById('ble-connected-badge');
    const bleRing1 = document.getElementById('ble-ring-1');
    const bleRing2 = document.getElementById('ble-ring-2');

    if (bleBadge) bleBadge.setAttribute('opacity', AppState.btConnected ? '1' : '0');

    if (AppState.btConnected) {
      if (bleRing1) bleRing1.setAttribute('opacity', '1');
      if (bleRing2) bleRing2.setAttribute('opacity', '1');
    }
  }
};
