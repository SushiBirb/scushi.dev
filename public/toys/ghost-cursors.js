// ghost-cursors.js - Smooth motion-blur ghost cursor trail for scushi.dev fun mode
(function () {
  let canvas = null;
  let ctx = null;
  let hud = null;
  let animId = null;
  let mousemoveHandler = null;
  let resizeHandler = null;
  let isRunning = false;

  let history = [];
  let currentX = window.innerWidth / 2;
  let currentY = window.innerHeight / 2;
  let currentAngle = -Math.PI / 4;
  let lastX = currentX;
  let lastY = currentY;

  // Delays for 8 ghost cursors (in milliseconds behind current time)
  const GHOST_DELAYS = [70, 150, 240, 340, 460, 590, 740, 900];
  const MAX_HISTORY_MS = 1800; // 1.8s persistent trail

  function createHUD() {
    hud = document.createElement('div');
    hud.id = 'ghost-hud';
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
      border: 1px solid rgba(227, 194, 141, 0.4);
      border-radius: 9999px;
      padding: 6px 18px;
      font-family: monospace;
      font-size: 11px;
      color: #e3c28d;
      backdrop-filter: blur(8px);
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
      user-select: none;
    `;
    hud.innerHTML = `
      <span><strong>GHOST CURSORS</strong>: 8-node motion wake</span>
      <button id="ghost-exit-btn" type="button" style="
        background: rgba(227, 194, 141, 0.15);
        border: 1px solid rgba(227, 194, 141, 0.4);
        color: #fff;
        border-radius: 4px;
        padding: 2px 8px;
        cursor: pointer;
        font-family: monospace;
        font-size: 10px;
      ">Exit</button>
    `;
    document.body.appendChild(hud);

    hud.querySelector('#ghost-exit-btn').addEventListener('click', stop);
  }

  function drawCursor(ctx, x, y, angle, scale, alpha) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.scale(scale, scale);
    ctx.globalAlpha = alpha;

    ctx.fillStyle = '#ffade4';
    ctx.strokeStyle = '#111111';
    ctx.lineWidth = 1.4;
    ctx.shadowColor = '#e3c28d';
    ctx.shadowBlur = 6;

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, 16);
    ctx.lineTo(4, 12);
    ctx.lineTo(8, 19);
    ctx.lineTo(11, 18);
    ctx.lineTo(7, 11);
    ctx.lineTo(12, 11);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }

  function sampleHistory(targetTime) {
    if (history.length === 0) return null;
    if (targetTime >= history[history.length - 1].time) {
      return history[history.length - 1];
    }
    if (targetTime <= history[0].time) {
      return history[0];
    }

    // Binary search for time interval
    let low = 0;
    let high = history.length - 1;
    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      if (history[mid].time < targetTime) {
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }

    const i0 = Math.max(0, low - 1);
    const i1 = Math.min(history.length - 1, low);
    const p0 = history[i0];
    const p1 = history[i1];

    if (p0 === p1) return p0;

    const span = p1.time - p0.time;
    const t = span > 0 ? (targetTime - p0.time) / span : 0;

    return {
      x: p0.x + (p1.x - p0.x) * t,
      y: p0.y + (p1.y - p0.y) * t,
      angle: p1.angle,
    };
  }

  function start() {
    if (isRunning) return;
    isRunning = true;

    canvas = document.createElement('canvas');
    canvas.id = 'ghost-canvas';
    canvas.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:2147483640;';
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    document.body.appendChild(canvas);
    ctx = canvas.getContext('2d');

    history = [];
    const now = performance.now();
    currentX = window.innerWidth / 2;
    currentY = window.innerHeight / 2;
    lastX = currentX;
    lastY = currentY;
    currentAngle = 0;
    history.push({ x: currentX, y: currentY, angle: 0, time: now });

    createHUD();

    mousemoveHandler = (e) => {
      currentX = e.clientX;
      currentY = e.clientY;
      const dx = currentX - lastX;
      const dy = currentY - lastY;
      const dist = Math.hypot(dx, dy);

      // Only update orientation when moved significantly
      if (dist > 4) {
        currentAngle = Math.atan2(dy, dx) - Math.PI / 4;
        lastX = currentX;
        lastY = currentY;
      }

      history.push({
        x: currentX,
        y: currentY,
        angle: currentAngle,
        time: performance.now(),
      });
    };
    window.addEventListener('mousemove', mousemoveHandler);

    resizeHandler = () => {
      if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }
    };
    window.addEventListener('resize', resizeHandler);

    function loop(now) {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Prune history older than MAX_HISTORY_MS
      const cutoff = now - MAX_HISTORY_MS;
      while (history.length > 2 && history[0].time < cutoff) {
        history.shift();
      }

      // Add a stationary frame if mouse hasn't moved
      if (history.length > 0 && now - history[history.length - 1].time > 40) {
        history.push({
          x: currentX,
          y: currentY,
          angle: currentAngle,
          time: now,
        });
      }

      // 1. Draw glowing persistent wake ribbon
      if (history.length > 3) {
        ctx.save();
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        for (let i = 1; i < history.length; i++) {
          const pPrev = history[i - 1];
          const pCur = history[i];
          const age = now - pCur.time;
          if (age > MAX_HISTORY_MS) continue;

          const progress = 1 - age / MAX_HISTORY_MS; // 1 at head, 0 at tail
          ctx.beginPath();
          ctx.moveTo(pPrev.x, pPrev.y);
          ctx.lineTo(pCur.x, pCur.y);

          ctx.strokeStyle = `rgba(255, 173, 228, ${progress * 0.35})`;
          ctx.lineWidth = 1 + progress * 4.5;
          ctx.stroke();
        }
        ctx.restore();
      }

      // 2. Draw 8 Ghost Cursors along the historical trail
      for (let i = GHOST_DELAYS.length - 1; i >= 0; i--) {
        const delay = GHOST_DELAYS[i];
        const sample = sampleHistory(now - delay);
        if (!sample) continue;

        // Skip if ghost has caught up to the current mouse position
        const distToMouse = Math.hypot(sample.x - currentX, sample.y - currentY);
        if (distToMouse < 2) continue;

        const progress = 1 - i / GHOST_DELAYS.length;
        const scale = 0.65 + progress * 0.35;
        const alpha = Math.min(0.85, 0.2 + progress * 0.65);

        drawCursor(ctx, sample.x, sample.y, sample.angle, scale, alpha);
      }

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
    if (mousemoveHandler) {
      window.removeEventListener('mousemove', mousemoveHandler);
      mousemoveHandler = null;
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

  window.__ghostCursors = {
    start,
    stop,
    toggle,
    isRunning: () => isRunning,
  };

  start();
})();
