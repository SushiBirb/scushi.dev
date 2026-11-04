// gravity.js - Google Gravity physics sandbox with proper rigid-body collisions & flinging for scushi.dev fun mode
(function () {
  let animId = null;
  let hud = null;
  let bodies = [];
  let isRunning = false;
  let draggedBody = null;
  let dragOffsetX = 0;
  let dragOffsetY = 0;
  let hasDragged = false;
  let mouseHistory = [];

  let mousedownHandler = null;
  let mousemoveHandler = null;
  let mouseupHandler = null;
  let clickCaptureHandler = null;
  let dragstartHandler = null;

  function createHUD() {
    hud = document.createElement('div');
    hud.id = 'gravity-hud';
    hud.style.cssText = `
      position: fixed;
      top: 16px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 2147483646;
      display: flex;
      align-items: center;
      gap: 14px;
      background: rgba(15, 15, 15, 0.9);
      border: 1px solid rgba(227, 194, 141, 0.5);
      border-radius: 9999px;
      padding: 6px 18px;
      font-family: monospace;
      font-size: 11px;
      color: #e3c28d;
      backdrop-filter: blur(8px);
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.6);
      user-select: none;
    `;
    hud.innerHTML = `
      <span><strong>GRAVITY MODE</strong>: Elements stack with collision. Click & fling!</span>
      <button id="grav-reset-btn" type="button" style="
        background: rgba(227, 194, 141, 0.15);
        border: 1px solid rgba(227, 194, 141, 0.4);
        color: #fff;
        border-radius: 4px;
        padding: 3px 10px;
        cursor: pointer;
        font-family: monospace;
        font-size: 10px;
      ">Reset Layout</button>
    `;
    document.body.appendChild(hud);

    hud.querySelector('#grav-reset-btn').addEventListener('click', stop);
  }

  function collectTargetElements() {
    // 1. Gather all compound cards that should fall as one cohesive unit
    const cardSelectors = [
      'a.group.block.rounded-xl', // Project cards
      '.rounded-xl.border',       // Award cards & metric boxes
      '.homelab-node > div',      // Infrastructure node containers
      'header > div:first-child', // "available for security" pill
      'header a',                 // Cert pills (Security+, A+)
      'nav a',                    // Nav links
      '#copy-email-btn',
      '#elsewhere a',
      'pre',
    ];

    const rawCards = Array.from(document.querySelectorAll(cardSelectors.join(', '))).filter(
      (el) => !el.closest('#gravity-hud') && !el.closest('#fun-mode-dropdown-root') && !el.closest('#asteroids-hud')
    );

    const isInsideCard = (el) => rawCards.some((card) => card !== el && card.contains(el));

    // 2. Gather top-level text elements strictly outside of compound cards
    const textSelectors = ['h1', 'h2', 'header p', 'section > p', '#elsewhere p'];
    const rawTexts = Array.from(document.querySelectorAll(textSelectors.join(', '))).filter(
      (el) => !isInsideCard(el) && !el.closest('#gravity-hud') && !el.closest('#fun-mode-dropdown-root') && !el.closest('#asteroids-hud')
    );

    // Filter out zero-size or invisible elements and major layout containers
    const combined = [...rawCards, ...rawTexts].filter((el) => {
      const tag = el.tagName.toUpperCase();
      if (['SECTION', 'ARTICLE', 'MAIN', 'NAV', 'HEADER', 'BODY', 'HTML'].includes(tag)) return false;
      const r = el.getBoundingClientRect();
      return r.width > 24 && r.height > 12;
    });

    return combined;
  }

  function start() {
    if (isRunning) return;
    isRunning = true;

    createHUD();

    const elements = collectTargetElements();

    bodies = elements.map((el) => {
      const r = el.getBoundingClientRect();
      const origStyle = el.getAttribute('style') || '';

      let tightWidth = r.width;
      let tightLeft = r.left;

      // Tighten bounds for block-level headings and paragraphs that would otherwise span 720px full column
      if (/^H[1-6]$/i.test(el.tagName) || el.tagName === 'P') {
        try {
          const range = document.createRange();
          range.selectNodeContents(el);
          const cr = range.getBoundingClientRect();
          if (cr.width > 20 && cr.width < r.width - 15) {
            tightWidth = Math.ceil(cr.width + 12);
            tightLeft = cr.left;
          }
        } catch (_) {}
      }

      el.style.position = 'fixed';
      el.style.left = `${tightLeft}px`;
      el.style.top = `${r.top}px`;
      el.style.width = `${tightWidth}px`;
      el.style.margin = '0';
      el.style.boxSizing = 'border-box';
      el.style.zIndex = '1000';
      el.style.cursor = 'grab';
      el.style.userSelect = 'none';
      el.style.touchAction = 'none';

      // Mass proportional to surface area
      const mass = Math.max(1, (tightWidth * r.height) / 6000);

      return {
        el,
        origStyle,
        x: tightLeft,
        y: r.top,
        width: tightWidth,
        height: r.height,
        vx: (Math.random() - 0.5) * 1.5,
        vy: 0,
        angle: 0,
        vAngle: 0,
        mass,
        invMass: 1 / mass,
      };
    });

    mousedownHandler = (e) => {
      // Find body clicked
      const body = bodies.find((b) => b.el === e.target || b.el.contains(e.target));
      if (!body) return;

      // Prevent native HTML5 link drag and text selection
      e.preventDefault();

      draggedBody = body;
      dragOffsetX = e.clientX - body.x;
      dragOffsetY = e.clientY - body.y;
      body.el.style.cursor = 'grabbing';
      body.vx = 0;
      body.vy = 0;
      body.vAngle = 0;
      hasDragged = false;

      mouseHistory = [{ x: e.clientX, y: e.clientY, time: performance.now() }];
    };

    mousemoveHandler = (e) => {
      if (!draggedBody) return;

      const now = performance.now();
      mouseHistory.push({ x: e.clientX, y: e.clientY, time: now });

      // Keep recent 120ms window of cursor positions
      while (mouseHistory.length > 1 && now - mouseHistory[0].time > 120) {
        mouseHistory.shift();
      }

      const newX = e.clientX - dragOffsetX;
      const newY = e.clientY - dragOffsetY;

      if (Math.hypot(newX - draggedBody.x, newY - draggedBody.y) > 4) {
        hasDragged = true;
      }

      draggedBody.x = newX;
      draggedBody.y = newY;
    };

    mouseupHandler = () => {
      if (!draggedBody) return;

      draggedBody.el.style.cursor = 'grab';

      // Calculate release fling velocity from recent history
      if (mouseHistory.length >= 2) {
        const oldest = mouseHistory[0];
        const newest = mouseHistory[mouseHistory.length - 1];
        const dt = Math.max(16, newest.time - oldest.time);
        const vx = ((newest.x - oldest.x) / dt) * 16.67;
        const vy = ((newest.y - oldest.y) / dt) * 16.67;

        // Snappy, energetic fling multiplier
        draggedBody.vx = Math.max(-45, Math.min(45, vx * 1.35));
        draggedBody.vy = Math.max(-45, Math.min(45, vy * 1.35));
        draggedBody.vAngle = Math.max(-0.25, Math.min(0.25, draggedBody.vx * 0.012));
      }

      draggedBody = null;
      mouseHistory = [];
    };

    // Suppress accidental navigation when releasing a dragged card
    clickCaptureHandler = (e) => {
      if (hasDragged) {
        e.preventDefault();
        e.stopPropagation();
        hasDragged = false;
      }
    };

    dragstartHandler = (e) => {
      e.preventDefault();
    };

    window.addEventListener('mousedown', mousedownHandler, { passive: false });
    window.addEventListener('mousemove', mousemoveHandler, { passive: true });
    window.addEventListener('mouseup', mouseupHandler);
    window.addEventListener('click', clickCaptureHandler, true);
    window.addEventListener('dragstart', dragstartHandler);

    function resolveCollisions() {
      const n = bodies.length;
      for (let i = 0; i < n; i++) {
        const a = bodies[i];
        for (let j = i + 1; j < n; j++) {
          const b = bodies[j];

          // AABB overlap check
          const overlapX = (a.width + b.width) / 2 - Math.abs(a.x + a.width / 2 - (b.x + b.width / 2));
          if (overlapX <= 0) continue;

          const overlapY = (a.height + b.height) / 2 - Math.abs(a.y + a.height / 2 - (b.y + b.height / 2));
          if (overlapY <= 0) continue;

          const isADragged = a === draggedBody;
          const isBDragged = b === draggedBody;

          const invMassA = isADragged ? 0 : a.invMass;
          const invMassB = isBDragged ? 0 : b.invMass;
          const invMassSum = invMassA + invMassB;
          if (invMassSum === 0) continue;

          // Resolve on axis of least penetration
          if (overlapY < overlapX) {
            // Vertical collision
            const signY = a.y < b.y ? -1 : 1;

            if (!isADragged) a.y += signY * overlapY * (invMassA / invMassSum);
            if (!isBDragged) b.y -= signY * overlapY * (invMassB / invMassSum);

            const relVy = a.vy - b.vy;
            // Only reflect if bodies are moving towards each other
            if (relVy * signY < 0) {
              const restitution = 0.35;
              const jImpulse = (-(1 + restitution) * relVy) / invMassSum;

              if (!isADragged) a.vy += jImpulse * invMassA;
              if (!isBDragged) {
                b.vy -= jImpulse * invMassB;
                b.vAngle += (a.vx - b.vx) * 0.004;
              }
            }
          } else {
            // Horizontal collision
            const signX = a.x < b.x ? -1 : 1;

            if (!isADragged) a.x += signX * overlapX * (invMassA / invMassSum);
            if (!isBDragged) b.x -= signX * overlapX * (invMassB / invMassSum);

            const relVx = a.vx - b.vx;
            if (relVx * signX < 0) {
              const restitution = 0.4;
              const jImpulse = (-(1 + restitution) * relVx) / invMassSum;

              if (!isADragged) a.vx += jImpulse * invMassA;
              if (!isBDragged) {
                b.vx -= jImpulse * invMassB;
                b.vAngle += (a.vy - b.vy) * 0.004;
              }
            }
          }
        }
      }
    }

    function loop() {
      const gravity = 0.55;
      const airFriction = 0.985;
      const floor = window.innerHeight;
      const rightWall = window.innerWidth;

      for (const b of bodies) {
        if (b === draggedBody) {
          b.el.style.left = `${b.x}px`;
          b.el.style.top = `${b.y}px`;
          continue;
        }

        b.vy += gravity;
        b.vx *= airFriction;
        b.vAngle *= 0.94;

        b.x += b.vx;
        b.y += b.vy;
        b.angle += b.vAngle;

        // Floor boundary
        if (b.y + b.height >= floor) {
          b.y = floor - b.height;
          b.vy = -b.vy * 0.35;
          b.vx *= 0.88;
          b.vAngle *= 0.8;
          if (Math.abs(b.vy) < 0.6) b.vy = 0;
          if (Math.abs(b.vx) < 0.1) b.vx = 0;
        }

        // Left boundary
        if (b.x < 0) {
          b.x = 0;
          b.vx = -b.vx * 0.45;
          b.vAngle *= 0.8;
        }

        // Right boundary
        if (b.x + b.width > rightWall) {
          b.x = rightWall - b.width;
          b.vx = -b.vx * 0.45;
          b.vAngle *= 0.8;
        }

        // Ceiling boundary (for high flings)
        if (b.y < 0) {
          b.y = 0;
          b.vy = -b.vy * 0.45;
        }
      }

      // Two passes for stable stacking
      resolveCollisions();
      resolveCollisions();

      for (const b of bodies) {
        b.el.style.left = `${b.x}px`;
        b.el.style.top = `${b.y}px`;
        b.el.style.transform = `rotate(${b.angle}rad)`;
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

    if (mousedownHandler) {
      window.removeEventListener('mousedown', mousedownHandler);
      window.removeEventListener('mousemove', mousemoveHandler);
      window.removeEventListener('mouseup', mouseupHandler);
      window.removeEventListener('click', clickCaptureHandler, true);
      window.removeEventListener('dragstart', dragstartHandler);
      mousedownHandler = null;
      mousemoveHandler = null;
      mouseupHandler = null;
      clickCaptureHandler = null;
      dragstartHandler = null;
    }

    if (hud) {
      hud.remove();
      hud = null;
    }

    for (const b of bodies) {
      if (b.origStyle) {
        b.el.setAttribute('style', b.origStyle);
      } else {
        b.el.removeAttribute('style');
      }
    }
    bodies = [];
    draggedBody = null;
    mouseHistory = [];

    try {
      sessionStorage.removeItem('scushi_active_toy');
    } catch (_) {}
  }

  function toggle() {
    if (isRunning) stop();
    else start();
  }

  window.__gravity = {
    start,
    stop,
    toggle,
    isRunning: () => isRunning,
  };

  start();
})();
