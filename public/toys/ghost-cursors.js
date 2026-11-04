// ghost-cursors.js - Multi-segment spring physics cursor trail for scushi.dev fun mode
(function () {
  let canvas = null;
  let ctx = null;
  let hud = null;
  let animId = null;
  let mousemoveHandler = null;
  let resizeHandler = null;
  let isRunning = false;

  const NUM_POINTS = 18;
  let points = [];
  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;

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
      <span><strong>GHOST CURSORS</strong>: 18-node spring physics trail</span>
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
    ctx.strokeStyle = '#111';
    ctx.lineWidth = 1.5;
    ctx.shadowColor = '#e3c28d';
    ctx.shadowBlur = 8;

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

    points = [];
    for (let i = 0; i < NUM_POINTS; i++) {
      points.push({
        x: mouseX,
        y: mouseY,
        vx: 0,
        vy: 0,
        angle: 0,
      });
    }

    createHUD();

    mousemoveHandler = (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };
    window.addEventListener('mousemove', mousemoveHandler);

    resizeHandler = () => {
      if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }
    };
    window.addEventListener('resize', resizeHandler);

    function loop() {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Spring physics
      let leadX = mouseX;
      let leadY = mouseY;

      for (let i = 0; i < NUM_POINTS; i++) {
        const p = points[i];
        const dx = leadX - p.x;
        const dy = leadY - p.y;

        const spring = 0.22 - (i / NUM_POINTS) * 0.08;
        const damping = 0.65;

        p.vx += dx * spring;
        p.vy += dy * spring;
        p.vx *= damping;
        p.vy *= damping;

        p.x += p.vx;
        p.y += p.vy;

        p.angle = Math.atan2(p.vy, p.vx) + Math.PI / 4;

        leadX = p.x;
        leadY = p.y;
      }

      // Draw connecting ribbon
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < NUM_POINTS; i++) {
        const xc = (points[i].x + points[i - 1].x) / 2;
        const yc = (points[i].y + points[i - 1].y) / 2;
        ctx.quadraticCurveTo(points[i - 1].x, points[i - 1].y, xc, yc);
      }
      ctx.strokeStyle = 'rgba(255, 173, 228, 0.25)';
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.restore();

      // Draw cursors from tail to head
      for (let i = NUM_POINTS - 1; i >= 0; i--) {
        const p = points[i];
        const scale = 1 - (i / NUM_POINTS) * 0.5;
        const alpha = 1 - (i / NUM_POINTS) * 0.7;
        drawCursor(ctx, p.x, p.y, p.angle, scale, alpha);
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
