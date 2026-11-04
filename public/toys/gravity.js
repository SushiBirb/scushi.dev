// gravity.js - Google Gravity physics sandbox for scushi.dev fun mode
(function () {
  let animId = null;
  let hud = null;
  let bodies = [];
  let isRunning = false;
  let draggedBody = null;
  let dragOffsetX = 0;
  let dragOffsetY = 0;
  let lastMouseX = 0;
  let lastMouseY = 0;
  let mouseVx = 0;
  let mouseVy = 0;

  let mousedownHandler = null;
  let mousemoveHandler = null;
  let mouseupHandler = null;

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
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
      user-select: none;
    `;
    hud.innerHTML = `
      <span><strong>GRAVITY MODE</strong>: Grab & fling elements</span>
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

  function start() {
    if (isRunning) return;
    isRunning = true;

    createHUD();

    // Collect elements to subject to gravity
    const selector = '.project-card, article, section, h1, h2, h3, p, pre, blockquote, .system-status, #nav-home, a[href^="/"]';
    const elements = Array.from(document.querySelectorAll(selector)).filter((el) => {
      if (el.closest('#gravity-hud') || el.closest('#fun-mode-dropdown-root') || el.closest('#asteroids-hud')) return false;
      const r = el.getBoundingClientRect();
      return r.width > 30 && r.height > 15;
    });

    // Save initial inline styles and compute initial fixed layout
    bodies = elements.map((el) => {
      const r = el.getBoundingClientRect();
      const origStyle = el.getAttribute('style') || '';

      el.style.position = 'fixed';
      el.style.left = `${r.left}px`;
      el.style.top = `${r.top}px`;
      el.style.width = `${r.width}px`;
      el.style.margin = '0';
      el.style.boxSizing = 'border-box';
      el.style.zIndex = '1000';
      el.style.cursor = 'grab';
      el.style.userSelect = 'none';
      el.style.touchAction = 'none';

      return {
        el,
        origStyle,
        x: r.left,
        y: r.top,
        width: r.width,
        height: r.height,
        vx: (Math.random() - 0.5) * 4,
        vy: Math.random() * -3,
        angle: 0,
        vAngle: (Math.random() - 0.5) * 0.04,
      };
    });

    // Mouse Dragging
    mousedownHandler = (e) => {
      const target = e.target.closest(selector);
      if (!target) return;
      const body = bodies.find((b) => b.el === target || b.el.contains(target));
      if (body) {
        draggedBody = body;
        dragOffsetX = e.clientX - body.x;
        dragOffsetY = e.clientY - body.y;
        body.el.style.cursor = 'grabbing';
        lastMouseX = e.clientX;
        lastMouseY = e.clientY;
        mouseVx = 0;
        mouseVy = 0;
      }
    };

    mousemoveHandler = (e) => {
      mouseVx = e.clientX - lastMouseX;
      mouseVy = e.clientY - lastMouseY;
      lastMouseX = e.clientX;
      lastMouseY = e.clientY;

      if (draggedBody) {
        draggedBody.x = e.clientX - dragOffsetX;
        draggedBody.y = e.clientY - dragOffsetY;
        draggedBody.vx = mouseVx * 0.8;
        draggedBody.vy = mouseVy * 0.8;
      }
    };

    mouseupHandler = () => {
      if (draggedBody) {
        draggedBody.el.style.cursor = 'grab';
        draggedBody.vx = mouseVx * 0.9;
        draggedBody.vy = mouseVy * 0.9;
        draggedBody = null;
      }
    };

    window.addEventListener('mousedown', mousedownHandler);
    window.addEventListener('mousemove', mousemoveHandler);
    window.addEventListener('mouseup', mouseupHandler);

    function loop() {
      const gravity = 0.55;
      const bounce = 0.4;
      const friction = 0.94;
      const floor = window.innerHeight;
      const rightWall = window.innerWidth;

      for (const b of bodies) {
        if (b === draggedBody) {
          b.el.style.left = `${b.x}px`;
          b.el.style.top = `${b.y}px`;
          continue;
        }

        b.vy += gravity;
        b.vx *= friction;
        b.vy *= 0.99;
        b.vAngle *= 0.95;

        b.x += b.vx;
        b.y += b.vy;
        b.angle += b.vAngle;

        // Bottom floor collision
        if (b.y + b.height >= floor) {
          b.y = floor - b.height;
          b.vy = -b.vy * bounce;
          b.vx *= 0.85;
          b.vAngle *= 0.8;
          if (Math.abs(b.vy) < 0.5) b.vy = 0;
        }

        // Left wall
        if (b.x < 0) {
          b.x = 0;
          b.vx = -b.vx * bounce;
        }

        // Right wall
        if (b.x + b.width > rightWall) {
          b.x = rightWall - b.width;
          b.vx = -b.vx * bounce;
        }

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
      mousedownHandler = null;
    }

    if (hud) {
      hud.remove();
      hud = null;
    }

    // Reset styles
    for (const b of bodies) {
      if (b.origStyle) {
        b.el.setAttribute('style', b.origStyle);
      } else {
        b.el.removeAttribute('style');
      }
    }
    bodies = [];
    draggedBody = null;
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
