// dvd.js - Bouncing DVD Logo screensaver with 24 vibrant colors for scushi.dev fun mode
(function () {
  let canvas = null;
  let ctx = null;
  let hud = null;
  let animId = null;
  let resizeHandler = null;
  let isRunning = false;
  let audioCtx = null;

  let x = 100;
  let y = 100;
  let vx = 3.2;
  let vy = 2.4;
  const logoWidth = 120;
  const logoHeight = 65;

  let bounces = 0;
  let cornerHits = 0;
  let confetti = [];

  const COLORS = [
    '#ff0055', '#ff3399', '#ff00cc', '#9d00ff', '#651fff',
    '#2979ff', '#00b0ff', '#00e5ff', '#1de9b6', '#00e676',
    '#76ff03', '#c6ff00', '#ffea00', '#ffd600', '#ff9100',
    '#ff3d00', '#ff1744', '#f43f5e', '#ec4899', '#a855f7',
    '#06b6d4', '#10b981', '#e3c28d', '#ffffff'
  ];
  let currentColor = COLORS[0];

  function playTone(freq) {
    try {
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state === 'suspended') audioCtx.resume();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.15);
    } catch (_) {}
  }

  function spawnConfetti(cx, cy) {
    for (let i = 0; i < 60; i++) {
      const a = Math.random() * Math.PI * 2;
      const speed = 3 + Math.random() * 8;
      confetti.push({
        x: cx,
        y: cy,
        vx: Math.cos(a) * speed,
        vy: Math.sin(a) * speed,
        size: 4 + Math.random() * 6,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        life: 80,
      });
    }
  }

  function pickNextColor() {
    let next;
    do {
      next = COLORS[Math.floor(Math.random() * COLORS.length)];
    } while (next === currentColor && COLORS.length > 1);
    currentColor = next;
    const dot = document.getElementById('dvd-color-dot');
    if (dot) dot.style.background = currentColor;
  }

  function createHUD() {
    hud = document.createElement('div');
    hud.id = 'dvd-hud';
    hud.style.cssText = `
      position: fixed;
      top: 16px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 2147483646;
      display: flex;
      align-items: center;
      gap: 12px;
      background: rgba(15, 15, 15, 0.9);
      border: 1px solid rgba(255, 255, 255, 0.3);
      border-radius: 9999px;
      padding: 6px 18px;
      font-family: monospace;
      font-size: 11px;
      color: #fff;
      backdrop-filter: blur(8px);
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.6);
      user-select: none;
    `;
    hud.innerHTML = `
      <span><strong>DVD SCREENSAVER</strong></span>
      <span>BOUNCES: <strong id="dvd-bounces">0</strong></span>
      <span>CORNERS: <strong id="dvd-corners" style="color: #ffeb3b;">0</strong></span>
      <button id="dvd-color-btn" type="button" style="
        background: rgba(255,255,255,0.1);
        border: 1px solid rgba(255,255,255,0.25);
        color: #fff;
        border-radius: 4px;
        padding: 2px 8px;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 5px;
        font-family: monospace;
        font-size: 10px;
      "><span id="dvd-color-dot" style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${currentColor}"></span> Color</button>
      <button id="dvd-exit-btn" type="button" style="
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.25);
        color: #fff;
        border-radius: 4px;
        padding: 2px 8px;
        cursor: pointer;
        font-family: monospace;
        font-size: 10px;
      ">Exit</button>
    `;
    document.body.appendChild(hud);

    hud.querySelector('#dvd-exit-btn').addEventListener('click', stop);
    hud.querySelector('#dvd-color-btn').addEventListener('click', pickNextColor);
  }

  function drawDVDLogo(ctx, px, py, color) {
    ctx.save();
    ctx.translate(px, py);

    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 3;

    // Disc ellipse
    ctx.beginPath();
    ctx.ellipse(60, 48, 54, 13, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Disc inner hole
    ctx.beginPath();
    ctx.ellipse(60, 48, 14, 4, 0, 0, Math.PI * 2);
    ctx.stroke();

    // "DVD" bold stylized letters
    ctx.font = 'bold 32px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('DVD', 60, 24);

    // "VIDEO" small subtitle
    ctx.font = 'bold 9px sans-serif';
    ctx.letterSpacing = '3px';
    ctx.fillText('VIDEO', 60, 49);

    ctx.restore();
  }

  function start() {
    if (isRunning) return;
    isRunning = true;

    canvas = document.createElement('canvas');
    canvas.id = 'dvd-canvas';
    canvas.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:2147483640;';
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    document.body.appendChild(canvas);
    ctx = canvas.getContext('2d');

    x = 50 + Math.random() * (window.innerWidth - logoWidth - 100);
    y = 50 + Math.random() * (window.innerHeight - logoHeight - 100);
    vx = (Math.random() > 0.5 ? 1 : -1) * 3.2;
    vy = (Math.random() > 0.5 ? 1 : -1) * 2.5;
    bounces = 0;
    cornerHits = 0;
    confetti = [];
    pickNextColor();

    createHUD();

    resizeHandler = () => {
      if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }
    };
    window.addEventListener('resize', resizeHandler);

    function loop() {
      if (!ctx || !canvas) return;

      const w = window.innerWidth;
      const h = window.innerHeight;

      x += vx;
      y += vy;

      let hitX = false;
      let hitY = false;

      if (x <= 0) {
        x = 0;
        vx = Math.abs(vx);
        hitX = true;
      } else if (x + logoWidth >= w) {
        x = w - logoWidth;
        vx = -Math.abs(vx);
        hitX = true;
      }

      if (y <= 0) {
        y = 0;
        vy = Math.abs(vy);
        hitY = true;
      } else if (y + logoHeight >= h) {
        y = h - logoHeight;
        vy = -Math.abs(vy);
        hitY = true;
      }

      if (hitX || hitY) {
        bounces++;
        pickNextColor();
        const bEl = document.getElementById('dvd-bounces');
        if (bEl) bEl.textContent = bounces.toString();

        if (hitX && hitY) {
          cornerHits++;
          const cEl = document.getElementById('dvd-corners');
          if (cEl) cEl.textContent = cornerHits.toString();
          spawnConfetti(x + logoWidth / 2, y + logoHeight / 2);
          playTone(880);
          setTimeout(() => playTone(1320), 120);
        } else {
          playTone(330);
        }
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw confetti
      for (let i = confetti.length - 1; i >= 0; i--) {
        const c = confetti[i];
        c.x += c.vx;
        c.y += c.vy;
        c.vy += 0.15;
        c.life--;
        ctx.fillStyle = c.color;
        ctx.fillRect(c.x, c.y, c.size, c.size);
        if (c.life <= 0) confetti.splice(i, 1);
      }

      // Draw Logo
      drawDVDLogo(ctx, x, y, currentColor);

      animId = window.requestAnimationFrame(loop);
    }

    animId = window.requestAnimationFrame(loop);
  }

  function stop() {
    if (!isRunning) return;
    isRunning = false;

    if (animId) {
      window.cancelAnimationFrame(animId);
      animId = null;
    }
    if (resizeHandler) {
      window.removeEventListener('resize', resizeHandler);
      resizeHandler = null;
    }
    if (hud) {
      hud.remove();
      hud = null;
    }
    if (canvas) {
      canvas.remove();
      canvas = null;
      ctx = null;
    }

    try {
      sessionStorage.removeItem('scushi_active_toy');
    } catch (_) {}
  }

  function toggle() {
    if (isRunning) stop();
    else start();
  }

  window.__dvd = {
    start,
    stop,
    toggle,
    isRunning: () => isRunning,
  };

  start();
})();
