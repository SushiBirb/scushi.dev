// elevator.js - Elevator ride that waits at bottom and forces smooth return to top on scroll up
(function () {
  let isRunning = false;
  let animId = null;
  let hud = null;
  let audioCtx = null;
  let musicTimer = null;
  let scrollHandler = null;
  let wheelHandler = null;
  let keyHandler = null;
  let touchStartHandler = null;
  let touchMoveHandler = null;
  let touchStartY = 0;

  // States: 'STANDBY', 'AT_BOTTOM', 'ASCENDING', 'ARRIVED'
  let state = 'STANDBY';

  function initAudio() {
    try {
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state === 'suspended') audioCtx.resume();
    } catch (_) {}
  }

  function playTone(freq, dur, gainVal = 0.03) {
    if (!audioCtx) return;
    try {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      gain.gain.setValueAtTime(gainVal, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + dur);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + dur);
    } catch (_) {}
  }

  function playDingDong() {
    initAudio();
    playTone(659.25, 0.5, 0.05); // E5
    setTimeout(() => playTone(523.25, 0.7, 0.05), 220); // C5
  }

  function playMuzakChord(notes) {
    if (!audioCtx) return;
    for (const freq of notes) {
      playTone(freq, 0.6, 0.015);
    }
  }

  function playElevatorBell() {
    initAudio();
    playTone(1046.5, 1.8, 0.07); // C6
    playTone(2093.0, 1.8, 0.04); // C7
  }

  function startAscent() {
    if (state === 'ASCENDING' || state === 'ARRIVED') return;
    state = 'ASCENDING';
    initAudio();

    document.documentElement.style.overflow = 'hidden';

    const startY = window.scrollY;
    const duration = 5200; // 5.2 seconds
    const startTime = performance.now();

    const hudText = document.getElementById('elev-status-text');
    if (hudText) {
      hudText.innerHTML = '<span style="animation: pulse 1s infinite; color: #ffea79;">▲</span> <strong>ASCENDING...</strong> <span id="elev-floor">GROUND FLOOR</span>';
    }

    const chords = [
      [261.63, 329.63, 392.00, 493.88],
      [293.66, 349.23, 440.00, 523.25],
      [329.63, 392.00, 493.88, 587.33],
      [349.23, 440.00, 523.25, 659.25],
    ];
    let chordIdx = 0;
    musicTimer = setInterval(() => {
      playMuzakChord(chords[chordIdx]);
      chordIdx = (chordIdx + 1) % chords.length;
    }, 550);

    function step(now) {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);

      // Smooth easeInOutCubic
      const ease = progress < 0.5 ? 4 * progress * progress * progress : 1 - Math.pow(-2 * progress + 2, 3) / 2;
      const curY = startY * (1 - ease);
      window.scrollTo(0, curY);

      const floorEl = document.getElementById('elev-floor');
      if (floorEl) {
        if (progress < 0.25) floorEl.textContent = 'GROUND FLOOR';
        else if (progress < 0.55) floorEl.textContent = 'FLOOR 2';
        else if (progress < 0.85) floorEl.textContent = 'FLOOR 3';
        else floorEl.textContent = 'PENTHOUSE';
      }

      if (progress < 1) {
        animId = window.requestAnimationFrame(step);
      } else {
        clearInterval(musicTimer);
        musicTimer = null;
        state = 'ARRIVED';
        document.documentElement.style.overflow = '';
        playElevatorBell();

        if (hudText) {
          hudText.innerHTML = '<span>🔔 <strong>ARRIVED: PENTHOUSE</strong> (Ding!)</span>';
        }
        setTimeout(stop, 3000);
      }
    }

    animId = window.requestAnimationFrame(step);
  }

  function start() {
    if (isRunning) return;
    isRunning = true;
    state = 'STANDBY';

    hud = document.createElement('div');
    hud.id = 'elevator-hud';
    hud.style.cssText = `
      position: fixed;
      top: 14px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 2147483647;
      background: rgba(18, 18, 18, 0.95);
      border: 1px solid rgba(227, 194, 141, 0.6);
      border-radius: 9999px;
      padding: 6px 16px;
      max-width: calc(100% - 24px);
      box-sizing: border-box;
      flex-wrap: wrap;
      justify-content: center;
      font-family: monospace;
      font-size: 11px;
      color: #e3c28d;
      backdrop-filter: blur(10px);
      box-shadow: 0 4px 25px rgba(0,0,0,0.6);
      display: flex;
      align-items: center;
      gap: 10px;
      letter-spacing: 0.5px;
      user-select: none;
    `;
    hud.innerHTML = `
      <span id="elev-status-text">🛗 <strong>ELEVATOR:</strong> Scroll down to ground floor</span>
      <button id="elev-ascend-btn" type="button" style="
        display: none;
        background: rgba(227, 194, 141, 0.2);
        border: 1px solid rgba(227, 194, 141, 0.7);
        color: #ffea79;
        border-radius: 4px;
        padding: 2px 8px;
        cursor: pointer;
        font-family: monospace;
        font-size: 10px;
        font-weight: bold;
      ">Ascend ▲</button>
      <button id="elev-exit-btn" type="button" style="
        background: rgba(255,255,255,0.1);
        border: 1px solid rgba(255,255,255,0.25);
        color: #fff;
        border-radius: 4px;
        padding: 2px 8px;
        cursor: pointer;
        font-family: monospace;
        font-size: 10px;
      ">Exit</button>
    `;
    document.body.appendChild(hud);
    hud.querySelector('#elev-exit-btn').addEventListener('click', stop);
    hud.querySelector('#elev-ascend-btn').addEventListener('click', startAscent);

    // Check if user is at the bottom
    function checkBottom() {
      const docHeight = Math.max(document.documentElement.scrollHeight, window.innerHeight);
      const atBottom = window.scrollY + window.innerHeight >= docHeight - 65;

      if (atBottom && state === 'STANDBY') {
        state = 'AT_BOTTOM';
        playDingDong();
        const hudText = document.getElementById('elev-status-text');
        if (hudText) {
          hudText.innerHTML = '🛗 <strong>DOORS CLOSED:</strong> Swipe/Scroll up to ascend';
        }
        const ascendBtn = document.getElementById('elev-ascend-btn');
        if (ascendBtn) ascendBtn.style.display = 'inline-block';
      }
    }

    scrollHandler = () => {
      if (state === 'STANDBY') checkBottom();
    };

    // When at bottom, intercept any scroll-up attempt to launch ascent
    wheelHandler = (e) => {
      if (state === 'AT_BOTTOM' && e.deltaY < 0) {
        e.preventDefault();
        startAscent();
      } else if (state === 'ASCENDING') {
        e.preventDefault();
      }
    };

    keyHandler = (e) => {
      if (state === 'AT_BOTTOM' && ['ArrowUp', 'PageUp', 'Home', 'KeyK'].includes(e.code)) {
        e.preventDefault();
        startAscent();
      } else if (state === 'ASCENDING') {
        e.preventDefault();
      }
    };

    touchStartHandler = (e) => {
      if (e.touches && e.touches[0]) {
        touchStartY = e.touches[0].clientY;
      }
    };

    touchMoveHandler = (e) => {
      if (state === 'ASCENDING') {
        e.preventDefault();
        return;
      }
      if (state === 'AT_BOTTOM' && e.touches && e.touches[0]) {
        const deltaY = e.touches[0].clientY - touchStartY;
        // User dragged finger downwards by > 20px, attempting to scroll up
        if (deltaY > 20) {
          e.preventDefault();
          startAscent();
        }
      }
    };

    window.addEventListener('scroll', scrollHandler, { passive: true });
    window.addEventListener('wheel', wheelHandler, { passive: false });
    window.addEventListener('keydown', keyHandler, false);
    window.addEventListener('touchstart', touchStartHandler, { passive: true });
    window.addEventListener('touchmove', touchMoveHandler, { passive: false });

    checkBottom();
  }

  function stop() {
    if (!isRunning) return;
    isRunning = false;
    state = 'STANDBY';

    document.documentElement.style.overflow = '';

    if (animId) {
      window.cancelAnimationFrame(animId);
      animId = null;
    }
    if (musicTimer) {
      clearInterval(musicTimer);
      musicTimer = null;
    }
    if (scrollHandler) {
      window.removeEventListener('scroll', scrollHandler);
      scrollHandler = null;
    }
    if (wheelHandler) {
      window.removeEventListener('wheel', wheelHandler);
      wheelHandler = null;
    }
    if (keyHandler) {
      window.removeEventListener('keydown', keyHandler);
      keyHandler = null;
    }
    if (touchStartHandler) {
      window.removeEventListener('touchstart', touchStartHandler);
      touchStartHandler = null;
    }
    if (touchMoveHandler) {
      window.removeEventListener('touchmove', touchMoveHandler);
      touchMoveHandler = null;
    }
    if (hud) {
      hud.remove();
      hud = null;
    }
    if (audioCtx) {
      audioCtx.close();
      audioCtx = null;
    }

    try {
      sessionStorage.removeItem('scushi_active_toy');
    } catch (_) {}
  }

  function toggle() {
    if (isRunning) stop();
    else start();
  }

  window.__elevator = {
    start,
    stop,
    toggle,
    isRunning: () => isRunning,
  };

  start();
})();
