// asteroids.js - Kickass-style DOM Destroyer game for scushi.dev fun mode
(function () {
  let canvas = null;
  let ctx = null;
  let hud = null;
  let animId = null;
  let keydownHandler = null;
  let keyupHandler = null;
  let resizeHandler = null;

  let ship = null;
  let lasers = [];
  let particles = [];
  let destroyedElements = [];
  let score = 0;
  let destroyedCount = 0;
  let keys = {};

  const BREAKABLE_SELECTOR = 'h1, h2, h3, p, a, button, pre, code, li, article, section, .project-card, nav a';

  function initShip() {
    return {
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
      angle: -Math.PI / 2,
      vx: 0,
      vy: 0,
      radius: 14,
      thrusting: false,
    };
  }

  function createHUD() {
    hud = document.createElement('div');
    hud.id = 'asteroids-hud';
    hud.style.cssText = `
      position: fixed;
      top: 16px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 2147483645;
      display: flex;
      align-items: center;
      gap: 16px;
      background: rgba(10, 10, 10, 0.85);
      border: 1px solid rgba(227, 194, 141, 0.4);
      border-radius: 9999px;
      padding: 6px 18px;
      font-family: monospace;
      font-size: 11px;
      color: #e3c28d;
      backdrop-filter: blur(8px);
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
      user-select: none;
      pointer-events: auto;
    `;
    hud.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px;">
        <span style="font-weight: bold; letter-spacing: 1px;">ASTEROIDS</span>
        <span style="color: #666;">|</span>
        <span>SCORE: <strong id="ast-score" style="color: #fff;">0</strong></span>
        <span style="color: #666;">|</span>
        <span>DESTROYED: <strong id="ast-count" style="color: #fff;">0</strong></span>
      </div>
      <div style="color: #888; font-size: 10px;">
        [WASD/Arrows] Fly · [Space] Shoot · [B] Bomb · [Esc]
      </div>
      <button id="ast-exit-btn" type="button" style="
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

    hud.querySelector('#ast-exit-btn').addEventListener('click', stop);
  }

  function fireLaser() {
    if (!ship) return;
    const speed = 14;
    const tipX = ship.x + Math.cos(ship.angle) * ship.radius * 1.4;
    const tipY = ship.y + Math.sin(ship.angle) * ship.radius * 1.4;

    lasers.push({
      x: tipX,
      y: tipY,
      vx: Math.cos(ship.angle) * speed + ship.vx * 0.3,
      vy: Math.sin(ship.angle) * speed + ship.vy * 0.3,
      life: 60,
    });
  }

  function fireBomb() {
    if (!ship) return;
    for (let i = 0; i < 36; i++) {
      const a = (i / 36) * Math.PI * 2;
      lasers.push({
        x: ship.x,
        y: ship.y,
        vx: Math.cos(a) * 12,
        vy: Math.sin(a) * 12,
        life: 45,
      });
    }
  }

  function shatterElement(el, hitX, hitY) {
    if (el.dataset.astDestroyed === 'true') return;
    el.dataset.astDestroyed = 'true';
    destroyedElements.push(el);

    const rect = el.getBoundingClientRect();
    el.style.visibility = 'hidden';

    score += 100;
    destroyedCount += 1;
    const scoreEl = document.getElementById('ast-score');
    const countEl = document.getElementById('ast-count');
    if (scoreEl) scoreEl.textContent = score.toLocaleString();
    if (countEl) countEl.textContent = destroyedCount.toString();

    // Spawn physics debris
    const shardCount = Math.min(24, Math.max(8, Math.floor((rect.width * rect.height) / 800)));
    for (let i = 0; i < shardCount; i++) {
      const px = rect.left + Math.random() * rect.width;
      const py = rect.top + Math.random() * rect.height;
      const angle = Math.atan2(py - hitY, px - hitX) + (Math.random() - 0.5);
      const speed = 2 + Math.random() * 6;

      particles.push({
        x: px,
        y: py,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 2 + Math.random() * 5,
        color: Math.random() > 0.4 ? '#e3c28d' : (Math.random() > 0.5 ? '#ffffff' : '#888888'),
        alpha: 1,
        life: 50 + Math.random() * 30,
        maxLife: 80,
      });
    }
  }

  function checkCollisions() {
    const breakables = Array.from(document.querySelectorAll(BREAKABLE_SELECTOR)).filter(
      (el) => !el.closest('#asteroids-hud') && !el.closest('#fun-mode-dropdown-root') && el.dataset.astDestroyed !== 'true'
    );

    for (let i = lasers.length - 1; i >= 0; i--) {
      const l = lasers[i];
      let hit = false;

      for (let j = 0; j < breakables.length; j++) {
        const el = breakables[j];
        const r = el.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) continue;

        if (l.x >= r.left && l.x <= r.right && l.y >= r.top && l.y <= r.bottom) {
          shatterElement(el, l.x, l.y);
          hit = true;
          break;
        }
      }

      if (hit) {
        lasers.splice(i, 1);
      }
    }
  }

  function update() {
    if (!ship) return;

    // Rotation
    if (keys['ArrowLeft'] || keys['KeyA']) ship.angle -= 0.07;
    if (keys['ArrowRight'] || keys['KeyD']) ship.angle += 0.07;

    // Thrust
    ship.thrusting = keys['ArrowUp'] || keys['KeyW'];
    if (ship.thrusting) {
      ship.vx += Math.cos(ship.angle) * 0.35;
      ship.vy += Math.sin(ship.angle) * 0.35;

      // Exhaust particle
      const exX = ship.x - Math.cos(ship.angle) * (ship.radius + 2);
      const exY = ship.y - Math.sin(ship.angle) * (ship.radius + 2);
      particles.push({
        x: exX + (Math.random() - 0.5) * 4,
        y: exY + (Math.random() - 0.5) * 4,
        vx: -Math.cos(ship.angle) * (3 + Math.random() * 3) + (Math.random() - 0.5) * 2,
        vy: -Math.sin(ship.angle) * (3 + Math.random() * 3) + (Math.random() - 0.5) * 2,
        size: 3 + Math.random() * 3,
        color: Math.random() > 0.5 ? '#ff8c3b' : '#ffea79',
        alpha: 1,
        life: 20,
        maxLife: 20,
      });
    }

    // Drag & Move
    ship.vx *= 0.98;
    ship.vy *= 0.98;
    ship.x += ship.vx;
    ship.y += ship.vy;

    // Wrap around screen
    const w = window.innerWidth;
    const h = window.innerHeight;
    if (ship.x < 0) ship.x = w;
    if (ship.x > w) ship.x = 0;
    if (ship.y < 0) ship.y = h;
    if (ship.y > h) ship.y = 0;

    // Update lasers
    for (let i = lasers.length - 1; i >= 0; i--) {
      const l = lasers[i];
      l.x += l.vx;
      l.y += l.vy;
      l.life--;
      if (l.life <= 0 || l.x < 0 || l.x > w || l.y < 0 || l.y > h) {
        lasers.splice(i, 1);
      }
    }

    // Update particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.08; // subtle gravity
      p.life--;
      p.alpha = p.life / p.maxLife;
      if (p.life <= 0) {
        particles.splice(i, 1);
      }
    }

    checkCollisions();
  }

  function draw() {
    if (!ctx || !canvas) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw Lasers
    ctx.save();
    for (const l of lasers) {
      ctx.fillStyle = '#ffea79';
      ctx.shadowColor = '#ffea79';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(l.x, l.y, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // Draw Particles
    ctx.save();
    for (const p of particles) {
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, p.size, p.size);
    }
    ctx.restore();

    // Draw Ship
    if (ship) {
      ctx.save();
      ctx.translate(ship.x, ship.y);
      ctx.rotate(ship.angle);

      // Ship wireframe
      ctx.strokeStyle = '#e3c28d';
      ctx.lineWidth = 2;
      ctx.fillStyle = 'rgba(20, 20, 20, 0.85)';
      ctx.shadowColor = '#e3c28d';
      ctx.shadowBlur = 10;

      ctx.beginPath();
      ctx.moveTo(ship.radius * 1.4, 0);
      ctx.lineTo(-ship.radius, -ship.radius * 0.8);
      ctx.lineTo(-ship.radius * 0.6, 0);
      ctx.lineTo(-ship.radius, ship.radius * 0.8);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Thruster flame when active
      if (ship.thrusting) {
        ctx.strokeStyle = '#ff6b35';
        ctx.fillStyle = '#ffea79';
        ctx.beginPath();
        ctx.moveTo(-ship.radius * 0.6, -ship.radius * 0.3);
        ctx.lineTo(-ship.radius * 1.5 - Math.random() * 8, 0);
        ctx.lineTo(-ship.radius * 0.6, ship.radius * 0.3);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }

      ctx.restore();
    }
  }

  function loop() {
    update();
    draw();
    animId = window.requestAnimationFrame(loop);
  }

  function start() {
    if (canvas) return;

    ship = initShip();
    lasers = [];
    particles = [];
    score = 0;
    destroyedCount = 0;
    keys = {};

    canvas = document.createElement('canvas');
    canvas.id = 'asteroids-canvas';
    canvas.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:2147483640;';
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    document.body.appendChild(canvas);
    ctx = canvas.getContext('2d');

    createHUD();

    keydownHandler = (e) => {
      keys[e.code] = true;
      if (e.code === 'Space') {
        e.preventDefault();
        fireLaser();
      } else if (e.code === 'KeyB') {
        e.preventDefault();
        fireBomb();
      } else if (e.code === 'Escape') {
        e.preventDefault();
        stop();
      } else if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
      }
    };

    keyupHandler = (e) => {
      keys[e.code] = false;
    };

    resizeHandler = () => {
      if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }
    };

    window.addEventListener('keydown', keydownHandler);
    window.addEventListener('keyup', keyupHandler);
    window.addEventListener('resize', resizeHandler);

    animId = window.requestAnimationFrame(loop);
  }

  function stop() {
    if (animId) {
      window.cancelAnimationFrame(animId);
      animId = null;
    }
    if (keydownHandler) {
      window.removeEventListener('keydown', keydownHandler);
      keydownHandler = null;
    }
    if (keyupHandler) {
      window.removeEventListener('keyup', keyupHandler);
      keyupHandler = null;
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

    // Restore destroyed DOM elements
    for (const el of destroyedElements) {
      el.style.visibility = '';
      delete el.dataset.astDestroyed;
    }
    destroyedElements = [];
    ship = null;
  }

  function toggle() {
    if (canvas) stop();
    else start();
  }

  window.__asteroids = {
    start,
    stop,
    toggle,
    isRunning: () => Boolean(canvas),
  };

  start();
})();
