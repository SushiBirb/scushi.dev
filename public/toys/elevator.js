// elevator.js - Smooth Elevator.js ride to the top with synthesized chime for scushi.dev fun mode
(function () {
  let isRunning = false;
  let animId = null;
  let hud = null;
  let audioCtx = null;
  let musicTimer = null;

  function initAudio() {
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state === 'suspended') audioCtx.resume();
    } catch (_) {}
  }

  function playMuzakChord(notes) {
    if (!audioCtx) return;
    for (const freq of notes) {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.015, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.6);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.6);
    }
  }

  function playElevatorDing() {
    if (!audioCtx) return;
    const freqs = [1046.5, 2093.0]; // C6 & C7
    for (const freq of freqs) {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.06, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 1.8);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 1.8);
    }
  }

  function start() {
    if (isRunning) return;
    isRunning = true;
    initAudio();

    // If already at the top, scroll down first so there's an actual elevator ride
    if (window.scrollY < 200) {
      window.scrollTo({ top: 700, behavior: 'instant' });
    }

    const startY = window.scrollY;
    const duration = 4500; // 4.5 seconds
    const startTime = performance.now();

    hud = document.createElement('div');
    hud.id = 'elevator-hud';
    hud.style.cssText = `
      position: fixed;
      top: 24px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 2147483647;
      background: rgba(20, 20, 20, 0.95);
      border: 1px solid rgba(227, 194, 141, 0.6);
      border-radius: 9999px;
      padding: 8px 24px;
      font-family: monospace;
      font-size: 12px;
      color: #e3c28d;
      backdrop-filter: blur(10px);
      box-shadow: 0 4px 25px rgba(0,0,0,0.6);
      display: flex;
      align-items: center;
      gap: 12px;
      letter-spacing: 1px;
    `;
    hud.innerHTML = '<span style="animation: pulse 1s infinite;">▲</span> <span>ELEVATOR ASCENDING... <strong id="elev-floor">FLOOR 3</strong></span>';
    document.body.appendChild(hud);

    // Bossa nova progression (Cmaj7 -> Dm7 -> Em7 -> Fmaj7)
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

      // EaseInOutCubic
      const ease = progress < 0.5 ? 4 * progress * progress * progress : 1 - Math.pow(-2 * progress + 2, 3) / 2;
      const curY = startY * (1 - ease);
      window.scrollTo(0, curY);

      // Update floor badge
      const floorEl = document.getElementById('elev-floor');
      if (floorEl) {
        if (progress < 0.3) floorEl.textContent = 'FLOOR 3';
        else if (progress < 0.6) floorEl.textContent = 'FLOOR 2';
        else if (progress < 0.9) floorEl.textContent = 'FLOOR 1';
        else floorEl.textContent = 'PENTHOUSE';
      }

      if (progress < 1) {
        animId = window.requestAnimationFrame(step);
      } else {
        clearInterval(musicTimer);
        playElevatorDing();
        if (hud) {
          hud.innerHTML = '<span>🔔 <strong>ARRIVED: PENTHOUSE</strong> (Ding!)</span>';
          setTimeout(stop, 2000);
        }
      }
    }

    animId = window.requestAnimationFrame(step);
  }

  function stop() {
    if (!isRunning) return;
    isRunning = false;

    if (animId) {
      window.cancelAnimationFrame(animId);
      animId = null;
    }
    if (musicTimer) {
      clearInterval(musicTimer);
      musicTimer = null;
    }
    if (hud) {
      hud.remove();
      hud = null;
    }
    if (audioCtx) {
      audioCtx.close();
      audioCtx = null;
    }
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
