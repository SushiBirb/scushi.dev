// crt.js - Real animated CRT Monitor Shader with moving scanline beam for scushi.dev fun mode
(function () {
  let canvas = null;
  let ctx = null;
  let hud = null;
  let animId = null;
  let resizeHandler = null;
  let keyHandler = null;
  let audioCtx = null;
  let isRunning = false;

  let sweepY = 0;
  let currentPhosphor = 'amber';

  const PHOSPHORS = {
    amber: {
      name: 'Amber (P3)',
      filter: 'sepia(1) saturate(3.5) hue-rotate(345deg) brightness(0.95) contrast(1.15)',
      sweepColor: 'rgba(255, 176, 0, 0.08)',
    },
    green: {
      name: 'Phosphor Green (P1)',
      filter: 'sepia(1) saturate(5) hue-rotate(75deg) brightness(0.9) contrast(1.2)',
      sweepColor: 'rgba(51, 255, 51, 0.09)',
    },
    cyan: {
      name: 'Cyber Cyan',
      filter: 'sepia(1) saturate(4) hue-rotate(145deg) brightness(0.95) contrast(1.15)',
      sweepColor: 'rgba(0, 240, 255, 0.08)',
    },
    mono: {
      name: 'Monochrome (P4)',
      filter: 'grayscale(1) brightness(1.1) contrast(1.25)',
      sweepColor: 'rgba(255, 255, 255, 0.07)',
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

      gain.gain.setValueAtTime(0.06, audioCtx.currentTime);
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
      top: 14px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 2147483646;
      display: flex;
      align-items: center;
      gap: 10px;
      max-width: calc(100% - 24px);
      box-sizing: border-box;
      flex-wrap: wrap;
      justify-content: center;
      background: rgba(10, 10, 10, 0.92);
      border: 1px solid rgba(255, 176, 0, 0.5);
      border-radius: 9999px;
      padding: 5px 14px;
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
      ">Phosphor: <span id="crt-phos-name">Amber</span></button>
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

  function drawCRTShader() {
    if (!ctx || !canvas) return;
    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    // 1. Moving Cathode Ray Sweep Beam (rolls down every ~3.5 seconds)
    sweepY = (sweepY + 2.5) % (h + 80);
    const p = PHOSPHORS[currentPhosphor];

    const sweepGrad = ctx.createLinearGradient(0, sweepY - 40, 0, sweepY + 40);
    sweepGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
    sweepGrad.addColorStop(0.5, p.sweepColor);
    sweepGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = sweepGrad;
    ctx.fillRect(0, sweepY - 40, w, 80);

    // 2. High-density alternating scanline raster (2px pitch)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.18)';
    for (let y = 0; y < h; y += 3) {
      ctx.fillRect(0, y, w, 1);
    }

    // 3. Subtle curved tube vignette & edge shadow
    const radGrad = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.45, w / 2, h / 2, Math.max(w, h) * 0.72);
    radGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    radGrad.addColorStop(0.75, 'rgba(0, 0, 0, 0.35)');
    radGrad.addColorStop(1, 'rgba(0, 0, 0, 0.85)');
    ctx.fillStyle = radGrad;
    ctx.fillRect(0, 0, w, h);

    // 4. Subtle phosphor grain noise (randomized flicker)
    if (Math.random() > 0.3) {
      ctx.fillStyle = `rgba(255, 255, 255, ${0.01 + Math.random() * 0.015})`;
      for (let i = 0; i < 40; i++) {
        const nx = Math.random() * w;
        const ny = Math.random() * h;
        ctx.fillRect(nx, ny, 2, 1);
      }
    }
  }

  function loop() {
    drawCRTShader();
    animId = window.requestAnimationFrame(loop);
  }

  function start() {
    if (isRunning) return;
    isRunning = true;

    canvas = document.createElement('canvas');
    canvas.id = 'crt-shader-canvas';
    canvas.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:2147483630;width:100%;height:100%;';
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    document.body.appendChild(canvas);
    ctx = canvas.getContext('2d');

    createHUD();
    applyPhosphor();

    keyHandler = (e) => {
      playKeyClick();
      if (e.key === 'Escape') stop();
    };
    resizeHandler = () => {
      if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }
    };

    window.addEventListener('keydown', keyHandler);
    window.addEventListener('click', playKeyClick);
    window.addEventListener('resize', resizeHandler);

    animId = window.requestAnimationFrame(loop);
  }

  function stop() {
    if (!isRunning) return;
    isRunning = false;

    if (animId) {
      window.cancelAnimationFrame(animId);
      animId = null;
    }
    if (canvas) {
      canvas.remove();
      canvas = null;
      ctx = null;
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
    if (resizeHandler) {
      window.removeEventListener('resize', resizeHandler);
      resizeHandler = null;
    }
    document.documentElement.style.filter = '';

    try {
      sessionStorage.removeItem('scushi_active_toy');
    } catch (_) {}
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
