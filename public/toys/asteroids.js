// asteroids.js - Kickass-style DOM Destroyer game with vertical scrolling camera for scushi.dev fun mode
(function () {
  let canvas = null;
  let ctx = null;
  let hud = null;
  let touchControls = null;
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
      worldX: window.innerWidth / 2,
      worldY: window.scrollY + window.innerHeight / 2,
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
      top: 14px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 2147483645;
      display: flex;
      align-items: center;
      gap: 12px;
      max-width: calc(100% - 24px);
      box-sizing: border-box;
      flex-wrap: wrap;
      justify-content: center;
      background: rgba(10, 10, 10, 0.92);
      border: 1px solid rgba(227, 194, 141, 0.5);
      border-radius: 9999px;
      padding: 5px 14px;
      font-family: monospace;
      font-size: 11px;
      color: #e3c28d;
      backdrop-filter: blur(8px);
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.6);
      user-select: none;
      pointer-events: auto;
    `;
    hud.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px;">
        <span style="font-weight: bold; letter-spacing: 1px;">ASTEROIDS</span>
        <span style="color: #666;">|</span>
        <span>SCORE: <strong id="ast-score" style="color: #fff;">0</strong></span>
        <span style="color: #666;">|</span>
        <span>KILLS: <strong id="ast-count" style="color: #fff;">0</strong></span>
      </div>
      <div class="hidden sm:block" style="color: #888; font-size: 10px;">
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

  function createTouchControls() {
    const isTouch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0 || window.innerWidth < 768;
    if (!isTouch) return;

    touchControls = document.createElement('div');
    touchControls.id = 'asteroids-touch-controls';
    touchControls.style.cssText = `
      position: fixed;
      bottom: 24px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 2147483645;
      display: flex;
      align-items: center;
      gap: 12px;
      width: calc(100% - 28px);
      max-width: 400px;
      justify-content: space-between;
      user-select: none;
      pointer-events: auto;
      touch-action: none;
    `;

    touchControls.innerHTML = `
      <div style="display: flex; gap: 8px;">
        <button id="ast-touch-left" type="button" aria-label="Steer Left" style="
          width: 48px; height: 48px; border-radius: 50%;
          background: rgba(18, 18, 18, 0.88); border: 1.5px solid rgba(227, 194, 141, 0.55);
          color: #e3c28d; font-size: 20px; display: flex; align-items: center; justify-content: center;
          box-shadow: 0 4px 15px rgba(0,0,0,0.6); backdrop-filter: blur(8px); cursor: pointer;
        ">⟲</button>
        <button id="ast-touch-right" type="button" aria-label="Steer Right" style="
          width: 48px; height: 48px; border-radius: 50%;
          background: rgba(18, 18, 18, 0.88); border: 1.5px solid rgba(227, 194, 141, 0.55);
          color: #e3c28d; font-size: 20px; display: flex; align-items: center; justify-content: center;
          box-shadow: 0 4px 15px rgba(0,0,0,0.6); backdrop-filter: blur(8px); cursor: pointer;
        ">⟳</button>
      </div>

      <div>
        <button id="ast-touch-thrust" type="button" aria-label="Thrust Forward" style="
          width: 56px; height: 56px; border-radius: 50%;
          background: rgba(227, 194, 141, 0.18); border: 2px solid rgba(227, 194, 141, 0.85);
          color: #ffea79; font-size: 22px; display: flex; align-items: center; justify-content: center;
          box-shadow: 0 4px 20px rgba(0,0,0,0.7); backdrop-filter: blur(8px); cursor: pointer;
        ">▲</button>
      </div>

      <div style="display: flex; gap: 8px;">
        <button id="ast-touch-fire" type="button" aria-label="Fire Laser" style="
          width: 50px; height: 50px; border-radius: 50%;
          background: rgba(255, 107, 53, 0.22); border: 2px solid rgba(255, 107, 53, 0.85);
          color: #ff8c3b; font-size: 11px; font-weight: bold; font-family: monospace;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 4px 15px rgba(0,0,0,0.6); backdrop-filter: blur(8px); cursor: pointer;
        ">FIRE</button>
        <button id="ast-touch-bomb" type="button" aria-label="Fire Bomb" style="
          width: 44px; height: 44px; border-radius: 50%;
          background: rgba(255, 173, 228, 0.18); border: 1.5px solid rgba(255, 173, 228, 0.7);
          color: #ffade4; font-size: 16px; display: flex; align-items: center; justify-content: center;
          box-shadow: 0 4px 12px rgba(0,0,0,0.5); backdrop-filter: blur(8px); cursor: pointer;
        ">💣</button>
      </div>
    `;

    document.body.appendChild(touchControls);

    const bindHold = (btnId, keyName) => {
      const btn = touchControls.querySelector(btnId);
      if (!btn) return;
      const onStart = (e) => {
        e.preventDefault();
        e.stopPropagation();
        keys[keyName] = true;
        btn.style.transform = 'scale(0.92)';
      };
      const onEnd = (e) => {
        e.preventDefault();
        e.stopPropagation();
        keys[keyName] = false;
        btn.style.transform = 'scale(1)';
      };
      btn.addEventListener('touchstart', onStart, { passive: false });
      btn.addEventListener('touchend', onEnd, { passive: false });
      btn.addEventListener('touchcancel', onEnd, { passive: false });
      btn.addEventListener('mousedown', onStart);
      btn.addEventListener('mouseup', onEnd);
      btn.addEventListener('mouseleave', onEnd);
    };

    bindHold('#ast-touch-left', 'KeyA');
    bindHold('#ast-touch-right', 'KeyD');
    bindHold('#ast-touch-thrust', 'KeyW');

    const fireBtn = touchControls.querySelector('#ast-touch-fire');
    if (fireBtn) {
      const onFire = (e) => {
        e.preventDefault();
        e.stopPropagation();
        fireLaser();
      };
      fireBtn.addEventListener('touchstart', onFire, { passive: false });
      fireBtn.addEventListener('mousedown', onFire);
    }

    const bombBtn = touchControls.querySelector('#ast-touch-bomb');
    if (bombBtn) {
      const onBomb = (e) => {
        e.preventDefault();
        e.stopPropagation();
        fireBomb();
      };
      bombBtn.addEventListener('touchstart', onBomb, { passive: false });
      bombBtn.addEventListener('mousedown', onBomb);
    }
  }

  function fireLaser() {
    if (!ship) return;
    const speed = 14;
    const tipX = ship.worldX + Math.cos(ship.angle) * ship.radius * 1.4;
    const tipY = ship.worldY + Math.sin(ship.angle) * ship.radius * 1.4;

    lasers.push({
      worldX: tipX,
      worldY: tipY,
      vx: Math.cos(ship.angle) * speed + ship.vx * 0.3,
      vy: Math.sin(ship.angle) * speed + ship.vy * 0.3,
      life: 70,
    });
  }

  function fireBomb() {
    if (!ship) return;
    for (let i = 0; i < 36; i++) {
      const a = (i / 36) * Math.PI * 2;
      lasers.push({
        worldX: ship.worldX,
        worldY: ship.worldY,
        vx: Math.cos(a) * 12,
        vy: Math.sin(a) * 12,
        life: 50,
      });
    }
  }

  function shatterElement(el, hitScreenX, hitScreenY) {
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

    // Spawn physics debris in world space
    const shardCount = Math.min(24, Math.max(8, Math.floor((rect.width * rect.height) / 800)));
    for (let i = 0; i < shardCount; i++) {
      const sx = rect.left + Math.random() * rect.width;
      const sy = rect.top + Math.random() * rect.height;
      const angle = Math.atan2(sy - hitScreenY, sx - hitScreenX) + (Math.random() - 0.5);
      const speed = 2 + Math.random() * 6;

      particles.push({
        worldX: sx,
        worldY: sy + window.scrollY,
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

    const scrollY = window.scrollY;

    for (let i = lasers.length - 1; i >= 0; i--) {
      const l = lasers[i];
      const screenLx = l.worldX;
      const screenLy = l.worldY - scrollY;

      let hit = false;
      for (let j = 0; j < breakables.length; j++) {
        const el = breakables[j];
        const r = el.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) continue;

        if (screenLx >= r.left && screenLx <= r.right && screenLy >= r.top && screenLy <= r.bottom) {
          shatterElement(el, screenLx, screenLy);
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

    // Controlled, comfortable rotation speed (0.038 rad/frame)
    if (keys['ArrowLeft'] || keys['KeyA']) ship.angle -= 0.038;
    if (keys['ArrowRight'] || keys['KeyD']) ship.angle += 0.038;

    // Thrust
    ship.thrusting = keys['ArrowUp'] || keys['KeyW'];
    if (ship.thrusting) {
      ship.vx += Math.cos(ship.angle) * 0.35;
      ship.vy += Math.sin(ship.angle) * 0.35;

      // Exhaust particle
      const exX = ship.worldX - Math.cos(ship.angle) * (ship.radius + 2);
      const exY = ship.worldY - Math.sin(ship.angle) * (ship.radius + 2);
      particles.push({
        worldX: exX + (Math.random() - 0.5) * 4,
        worldY: exY + (Math.random() - 0.5) * 4,
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
    ship.worldX += ship.vx;
    ship.worldY += ship.vy;

    // Horizontal wrap
    const w = window.innerWidth;
    if (ship.worldX < 0) ship.worldX = w;
    if (ship.worldX > w) ship.worldX = 0;

    const docHeight = Math.max(document.documentElement.scrollHeight, window.innerHeight);
    const viewHeight = window.innerHeight;
    const maxScroll = Math.max(0, docHeight - viewHeight);

    // Vertical wrap / teleport between top and bottom extremes of the page
    if (ship.worldY < 0) {
      ship.worldY = docHeight - 20;
      window.scrollTo(0, maxScroll);
    } else if (ship.worldY > docHeight) {
      ship.worldY = 20;
      window.scrollTo(0, 0);
    } else if (maxScroll > 0) {
      // Keep ship centered vertically as long as page has scroll room
      const idealScroll = ship.worldY - viewHeight / 2;
      const targetScroll = Math.max(0, Math.min(maxScroll, idealScroll));
      window.scrollTo(0, targetScroll);
    }

    // Update lasers
    for (let i = lasers.length - 1; i >= 0; i--) {
      const l = lasers[i];
      l.worldX += l.vx;
      l.worldY += l.vy;
      l.life--;
      if (l.life <= 0 || l.worldX < 0 || l.worldX > w || l.worldY < 0 || l.worldY > docHeight) {
        lasers.splice(i, 1);
      }
    }

    // Update particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.worldX += p.vx;
      p.worldY += p.vy;
      p.vy += 0.08;
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

    const scrollY = window.scrollY;

    // Draw Lasers
    ctx.save();
    for (const l of lasers) {
      const sx = l.worldX;
      const sy = l.worldY - scrollY;
      if (sy < -20 || sy > canvas.height + 20) continue;

      ctx.fillStyle = '#ffea79';
      ctx.shadowColor = '#ffea79';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(sx, sy, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // Draw Particles
    ctx.save();
    for (const p of particles) {
      const sx = p.worldX;
      const sy = p.worldY - scrollY;
      if (sy < -20 || sy > canvas.height + 20) continue;

      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.fillRect(sx, sy, p.size, p.size);
    }
    ctx.restore();

    // Draw Ship
    if (ship) {
      const screenX = ship.worldX;
      const screenY = ship.worldY - scrollY;

      ctx.save();
      ctx.translate(screenX, screenY);
      ctx.rotate(ship.angle);

      // Ship wireframe
      ctx.strokeStyle = '#e3c28d';
      ctx.lineWidth = 2;
      ctx.fillStyle = 'rgba(20, 20, 20, 0.9)';
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
    createTouchControls();

    keydownHandler = (e) => {
      // Prevent navigation keys like 's' from escaping
      if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'Space', 'KeyB', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.stopPropagation();
      }

      keys[e.code] = true;
      if (e.code === 'Space') {
        e.preventDefault();
        if (e.repeat) return; // Prevent machine gun auto-fire: requires discrete taps per shot
        fireLaser();
      } else if (e.code === 'KeyB') {
        e.preventDefault();
        if (e.repeat) return;
        fireBomb();
      } else if (e.code === 'Escape') {
        e.preventDefault();
        stop();
      } else if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
      }
    };

    keyupHandler = (e) => {
      if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'Space', 'KeyB', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.stopPropagation();
      }
      keys[e.code] = false;
    };

    resizeHandler = () => {
      if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }
    };

    window.addEventListener('keydown', keydownHandler, true);
    window.addEventListener('keyup', keyupHandler, true);
    window.addEventListener('resize', resizeHandler);

    animId = window.requestAnimationFrame(loop);
  }

  function stop() {
    if (animId) {
      window.cancelAnimationFrame(animId);
      animId = null;
    }
    if (keydownHandler) {
      window.removeEventListener('keydown', keydownHandler, true);
      keydownHandler = null;
    }
    if (keyupHandler) {
      window.removeEventListener('keyup', keyupHandler, true);
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
    if (touchControls) {
      touchControls.remove();
      touchControls = null;
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

    try {
      sessionStorage.removeItem('scushi_active_toy');
    } catch (_) {}
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
