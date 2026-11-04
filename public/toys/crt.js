// crt.js - Retro CRT Terminal Shader & Mechanical Clicker for scushi.dev fun mode
(function () {
  let overlay = null;
  let hud = null;
  let isRunning = false;
  let keyHandler = null;
  let audioCtx = null;
  let currentPhosphor = 'amber';

  const PHOSPHORS = {
    amber: {
      name: 'Amber (P3)',
      filter: 'sepia(1) saturate(3) hue-rotate(345deg) brightness(0.95) contrast(1.15)',
      glow: 'rgba(255, 176, 0, 0.15)',
    },
    green: {
      name: 'Phosphor Green (P1)',
      filter: 'sepia(1) saturate(5) hue-rotate(75deg) brightness(0.9) contrast(1.2)',
      glow: 'rgba(51, 255, 51, 0.18)',
    },
    cyan: {
      name: 'Cyber Cyan',
      filter: 'sepia(1) saturate(4) hue-rotate(145deg) brightness(0.95) contrast(1.15)',
      glow: 'rgba(0, 240, 255, 0.15)',
    },
    mono: {
      name: 'Monochrome (P4)',
      filter: 'grayscale(1) brightness(1.1) contrast(1.3)',
      glow: 'rgba(255, 255, 255, 0.12)',
    },
  };

  function playKeyClick() {
    try {
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state === 'suspended') audioCtx.resume();

      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(140 + Math.random() * 80, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(30, audioCtx.currentTime + 0.04);

      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.04);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + 0.04);
    } catch (_) {}
  }

  function createHUD() {
    hud = document.createElement('div');
    hud.id = 'crt-hud';
    hud.style.cssText = `
      position: fixed;
      top: 16px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 2147483646;
      display: flex;
      align-items: center;
      gap: 12px;
      background: rgba(10, 10, 10, 0.9);
      border: 1px solid rgba(255, 176, 0, 0.5);
      border-radius: 9999px;
      padding: 6px 18px;
      font-family: monospace;
      font-size: 11px;
      color: #ffb000;
      backdrop-filter: blur(8px);
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.7);
      user-select: none;
    `;
    hud.innerHTML = `
      <span><strong>CRT TERMINAL</strong></span>
      <button id="crt-toggle-phos" type="button" style="
        background: rgba(255,176,0,0.15);
        border: 1px solid rgba(255,176,0,0.4);
        color: #fff;
        border-radius: 4px;
        padding: 2px 8px;
        cursor: pointer;
        font-family: monospace;
        font-size: 10px;
      ">Color: <span id="crt-phos-name">Amber</span></button>
      <button id="crt-exit-btn" type="button" style="
        background: rgba(255,255,255,0.1);
        border: 1px solid rgba(255,255,255,0.2);
        color: #fff;
        border-radius: 4px;
        padding: 2px 8px;
        cursor: pointer;
        font-family: monospace;
        font-size: 10px;
      ">Exit</button>
    `;
    document.body.appendChild(hud);

    hud.querySelector('#crt-exit-btn').addEventListener('click', stop);
    hud.querySelector('#crt-toggle-phos').addEventListener('click', cyclePhosphor);
  }

  function cyclePhosphor() {
    const keys = Object.keys(PHOSPHORS);
    const nextIdx = (keys.indexOf(currentPhosphor) + 1) % keys.length;
    currentPhosphor = keys[nextIdx];
    applyPhosphor();
  }

  function applyPhosphor() {
    const p = PHOSPHORS[currentPhosphor];
    const nameEl = document.getElementById('crt-phos-name');
    if (nameEl) nameEl.textContent = p.name;
    document.documentElement.style.filter = p.filter;
  }

  function start() {
    if (isRunning) return;
    isRunning = true;

    // Inject CRT Scanlines & Bezel Overlay
    overlay = document.createElement('div');
    overlay.id = 'crt-overlay';
    overlay.style.cssText = `
      position: fixed;
      inset: 0;
      pointer-events: none;
      z-index: 2147483630;
      background:
        radial-gradient(circle at center, transparent 65%, rgba(0, 0, 0, 0.6) 100%),
        linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%),
        linear-gradient(90deg, rgba(255, 0, 0, 0.03), rgba(0, 255, 0, 0.01), rgba(0, 0, 255, 0.03));
      background-size: 100% 100%, 100% 3px, 3px 100%;
      box-shadow: inset 0 0 100px rgba(0, 0, 0, 0.85);
    `;
    document.body.appendChild(overlay);

    createHUD();
    applyPhosphor();

    keyHandler = (e) => {
      playKeyClick();
      if (e.key === 'Escape') stop();
    };
    window.addEventListener('keydown', keyHandler);
    window.addEventListener('click', playKeyClick);
  }

  function stop() {
    if (!isRunning) return;
    isRunning = false;

    if (overlay) {
      overlay.remove();
      overlay = null;
    }
    if (hud) {
      hud.remove();
      hud = null;
    }
    if (keyHandler) {
      window.removeEventListener('keydown', keyHandler);
      window.removeEventListener('click', playKeyClick);
      keyHandler = null;
    }
    document.documentElement.style.filter = '';
  }

  function toggle() {
    if (isRunning) stop();
    else start();
  }

  window.__crt = {
    start,
    stop,
    toggle,
    isRunning: () => isRunning,
  };

  start();
})();
