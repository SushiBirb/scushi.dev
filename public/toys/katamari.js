// katamari.js - Katamari Damacy DOM collector for scushi.dev fun mode
(function () {
  let canvas = null;
  let ctx = null;
  let hud = null;
  let animId = null;
  let mousemoveHandler = null;
  let touchHandler = null;
  let isRunning = false;

  let ballX = window.innerWidth / 2;
  let ballY = window.innerHeight / 2;
  let ballRadius = 28;
  let ballAngle = 0;
  let targetX = ballX;
  let targetY = ballY;

  let collected = [];
  let sparkles = [];

  function createHUD() {
    hud = document.createElement('div');
    hud.id = 'katamari-hud';
    hud.style.cssText = `
      position: fixed;
      top: 14px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 2147483646;
      display: flex;
      align-items: center;
      gap: 12px;
      max-width: calc(100% - 24px);
      box-sizing: border-box;
      flex-wrap: wrap;
      justify-content: center;
      background: rgba(15, 15, 15, 0.92);
      border: 1px solid rgba(255, 173, 228, 0.5);
      border-radius: 9999px;
      padding: 5px 14px;
      font-family: monospace;
      font-size: 11px;
      color: #ffade4;
      backdrop-filter: blur(8px);
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.6);
      user-select: none;
    `;
    hud.innerHTML = `
      <span><strong>KATAMARI</strong>: <span id="kat-size">0.28m</span> (<span id="kat-count">0</span> items)</span>
      <span class="hidden sm:inline" style="color: #666;">| Move / touch to roll</span>
      <button id="kat-exit-btn" type="button" style="
        background: rgba(255, 173, 228, 0.15);
        border: 1px solid rgba(255, 173, 228, 0.4);
        color: #fff;
        border-radius: 4px;
        padding: 2px 8px;
        cursor: pointer;
        font-family: monospace;
        font-size: 10px;
      ">Exit</button>
    `;
    document.body.appendChild(hud);

    hud.querySelector('#kat-exit-btn').addEventListener('click', stop);
  }

  function start() {
    if (isRunning) return;
    isRunning = true;

    canvas = document.createElement('canvas');
    canvas.id = 'katamari-canvas';
    canvas.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:2147483640;';
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    document.body.appendChild(canvas);
    ctx = canvas.getContext('2d');

    ballX = window.innerWidth / 2;
    ballY = window.innerHeight / 2;
    targetX = ballX;
    targetY = ballY;
    ballRadius = 28;
    ballAngle = 0;
    collected = [];
    sparkles = [];

    createHUD();

    mousemoveHandler = (e) => {
      targetX = e.clientX;
      targetY = e.clientY;
    };
    window.addEventListener('mousemove', mousemoveHandler);

    touchHandler = (e) => {
      if (e.touches && e.touches[0]) {
        targetX = e.touches[0].clientX;
        targetY = e.touches[0].clientY;
      }
    };
    window.addEventListener('touchmove', touchHandler, { passive: true });
    window.addEventListener('touchstart', touchHandler, { passive: true });

    function checkCollision() {
      // Pick up compact elements only (headings, links, tags, buttons, code blocks, spans)
      const candidates = document.querySelectorAll('a, button, code, strong, em, li, h1, h2, h3, nav a, .tag, blockquote');
      for (const el of candidates) {
        if (el.dataset.katamariCollected === 'true') continue;
        if (el.closest('#katamari-hud') || el.closest('#fun-mode-dropdown-root')) continue;

        const r = el.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) continue;

        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        const dist = Math.hypot(cx - ballX, cy - ballY);

        // Pick up when touching
        if (dist < ballRadius + 15) {
          el.dataset.katamariCollected = 'true';
          const origStyle = el.getAttribute('style') || '';

          // Lock element tightly to ball surface
          const relAngle = Math.atan2(cy - ballY, cx - ballX) - ballAngle;

          el.style.position = 'fixed';
          el.style.pointerEvents = 'none';
          el.style.zIndex = '2147483641';
          el.style.transformOrigin = 'center center';
          el.style.transition = 'none';
          el.style.maxWidth = '180px';
          el.style.overflow = 'hidden';
          el.style.textOverflow = 'ellipsis';
          el.style.whiteSpace = 'nowrap';

          collected.push({
            el,
            origStyle,
            relAngle,
            w: r.width,
            h: r.height,
          });

          // Grow the Katamari
          ballRadius += 0.9;
          const sizeMeters = (ballRadius * 0.01).toFixed(2);
          const sizeEl = document.getElementById('kat-size');
          const countEl = document.getElementById('kat-count');
          if (sizeEl) sizeEl.textContent = `${sizeMeters}m`;
          if (countEl) countEl.textContent = collected.length.toString();

          // Sparkles
          for (let i = 0; i < 8; i++) {
            const a = Math.random() * Math.PI * 2;
            sparkles.push({
              x: cx,
              y: cy,
              vx: Math.cos(a) * (2 + Math.random() * 4),
              vy: Math.sin(a) * (2 + Math.random() * 4),
              size: 2 + Math.random() * 3,
              color: ['#ffade4', '#ffea79', '#a6e3a1', '#89dceb'][Math.floor(Math.random() * 4)],
              life: 25,
            });
          }
        }
      }
    }

    function loop() {
      if (!ctx || !canvas) return;

      const dx = targetX - ballX;
      const dy = targetY - ballY;
      const speed = Math.hypot(dx, dy);

      if (speed > 1) {
        const moveStep = Math.min(speed, 6.5);
        ballX += (dx / speed) * moveStep;
        ballY += (dy / speed) * moveStep;
        ballAngle += (moveStep / ballRadius) * (dx >= 0 ? 1 : -1);
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw sparkles
      for (let i = sparkles.length - 1; i >= 0; i--) {
        const s = sparkles[i];
        s.x += s.vx;
        s.y += s.vy;
        s.life--;
        ctx.fillStyle = s.color;
        ctx.fillRect(s.x, s.y, s.size, s.size);
        if (s.life <= 0) sparkles.splice(i, 1);
      }

      // Draw Katamari Core Sphere
      ctx.save();
      ctx.translate(ballX, ballY);
      ctx.rotate(ballAngle);

      const grad = ctx.createRadialGradient(-ballRadius * 0.3, -ballRadius * 0.3, ballRadius * 0.1, 0, 0, ballRadius);
      grad.addColorStop(0, '#a6e3a1');
      grad.addColorStop(0.65, '#40a02b');
      grad.addColorStop(1, '#1e66f5');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, ballRadius, 0, Math.PI * 2);
      ctx.fill();

      // Bumps
      const bumpCount = 12;
      for (let i = 0; i < bumpCount; i++) {
        const a = (i / bumpCount) * Math.PI * 2;
        const bx = Math.cos(a) * ballRadius;
        const by = Math.sin(a) * ballRadius;
        ctx.fillStyle = i % 2 === 0 ? '#ffea79' : '#ffade4';
        ctx.beginPath();
        ctx.arc(bx, by, ballRadius * 0.18, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // Position collected elements tightly on sphere surface
      for (const item of collected) {
        const curAngle = ballAngle + item.relAngle;
        const surfaceDist = ballRadius + 4;
        const ix = ballX + Math.cos(curAngle) * surfaceDist;
        const iy = ballY + Math.sin(curAngle) * surfaceDist;

        item.el.style.left = `${ix - item.w * 0.2}px`;
        item.el.style.top = `${iy - item.h * 0.2}px`;
        item.el.style.transform = `rotate(${curAngle + Math.PI / 2}rad) scale(0.4)`;
      }

      checkCollision();
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
    if (touchHandler) {
      window.removeEventListener('touchmove', touchHandler);
      window.removeEventListener('touchstart', touchHandler);
      touchHandler = null;
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

    for (const item of collected) {
      delete item.el.dataset.katamariCollected;
      if (item.origStyle) item.el.setAttribute('style', item.origStyle);
      else item.el.removeAttribute('style');
    }
    collected = [];

    try {
      sessionStorage.removeItem('scushi_active_toy');
    } catch (_) {}
  }

  function toggle() {
    if (isRunning) stop();
    else start();
  }

  window.__katamari = {
    start,
    stop,
    toggle,
    isRunning: () => isRunning,
  };

  start();
})();
