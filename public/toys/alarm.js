// alarm.js - Fake SOC Security Incident Alarm for scushi.dev fun mode
(function () {
  let isRunning = false;
  let banner = null;
  let strobe = null;
  let terminal = null;
  let audioCtx = null;
  let sirenTimer = null;
  let hexTimer = null;
  let currentStep = 1;

  function initAudio() {
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      let high = true;

      function beep() {
        if (!isRunning || !audioCtx) return;
        if (audioCtx.state === 'suspended') audioCtx.resume();

        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(high ? 750 : 520, audioCtx.currentTime);
        high = !high;

        gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.28);

        osc.connect(gain);
        gain.connect(audioCtx.destination);

        osc.start();
        osc.stop(audioCtx.currentTime + 0.28);

        sirenTimer = setTimeout(beep, 320);
      }
      beep();
    } catch (_) {}
  }

  function start() {
    if (isRunning) return;
    isRunning = true;
    currentStep = 1;

    // Strobe overlay
    strobe = document.createElement('div');
    strobe.id = 'alarm-strobe';
    strobe.style.cssText = `
      position: fixed;
      inset: 0;
      pointer-events: none;
      z-index: 2147483640;
      box-shadow: inset 0 0 100px rgba(239, 68, 68, 0.7);
      animation: alarm-pulse 0.7s infinite alternate ease-in-out;
    `;
    const styleEl = document.createElement('style');
    styleEl.id = 'alarm-keyframe-style';
    styleEl.innerHTML = `
      @keyframes alarm-pulse {
        0% { box-shadow: inset 0 0 40px rgba(239, 68, 68, 0.3); }
        100% { box-shadow: inset 0 0 140px rgba(239, 68, 68, 0.85); background: rgba(239, 68, 68, 0.05); }
      }
    `;
    document.head.appendChild(styleEl);
    document.body.appendChild(strobe);

    // Top banner
    banner = document.createElement('div');
    banner.id = 'alarm-banner';
    banner.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      background: #dc2626;
      color: #fff;
      font-family: monospace;
      font-size: 12px;
      font-weight: bold;
      padding: 8px 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      z-index: 2147483647;
      letter-spacing: 1px;
      box-shadow: 0 4px 20px rgba(220, 38, 38, 0.8);
      user-select: none;
    `;
    banner.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px;">
        <span style="animation: ping 1s infinite;">🚨</span>
        <span>DEFCON 1: SECURITY COMPROMISE DETECTED · C2 BEACON INTERCEPTED</span>
      </div>
      <div style="display: flex; align-items: center; gap: 8px;">
        <button id="alarm-disarm-btn" type="button" style="
          background: #000;
          color: #ffea79;
          border: 1px solid #ffea79;
          font-family: monospace;
          font-size: 11px;
          padding: 3px 12px;
          border-radius: 4px;
          cursor: pointer;
        ">DISARM [KEY: 1337]</button>
        <button id="alarm-exit-btn" type="button" style="
          background: rgba(0,0,0,0.4);
          color: #fff;
          border: 1px solid #fff;
          font-family: monospace;
          font-size: 11px;
          padding: 3px 8px;
          border-radius: 4px;
          cursor: pointer;
        ">EXIT</button>
      </div>
    `;
    document.body.appendChild(banner);

    // Live hex dump telemetry terminal in corner
    terminal = document.createElement('div');
    terminal.id = 'alarm-terminal';
    terminal.style.cssText = `
      position: fixed;
      bottom: 24px;
      right: 24px;
      width: 320px;
      height: 180px;
      background: rgba(10, 10, 10, 0.92);
      border: 1px solid #ef4444;
      border-radius: 8px;
      padding: 10px;
      font-family: monospace;
      font-size: 10px;
      color: #fca5a5;
      overflow: hidden;
      z-index: 2147483645;
      box-shadow: 0 4px 25px rgba(0,0,0,0.7);
      backdrop-filter: blur(8px);
      pointer-events: none;
    `;
    terminal.innerHTML = '<div style="color: #ef4444; font-weight: bold; margin-bottom: 6px;">[MEM_DUMP: BUFFER OVERFLOW]</div><div id="alarm-hex-body"></div>';
    document.body.appendChild(terminal);

    const hexBody = terminal.querySelector('#alarm-hex-body');
    const hexLines = [];
    hexTimer = setInterval(() => {
      if (!hexBody) return;
      const addr = '0x' + Math.floor(Math.random() * 0xffffffff).toString(16).padStart(8, '0');
      const bytes = Array.from({ length: 6 }, () => Math.floor(Math.random() * 256).toString(16).padStart(2, '0')).join(' ');
      hexLines.push(`${addr}: ${bytes}`);
      if (hexLines.length > 8) hexLines.shift();
      hexBody.innerHTML = hexLines.join('<br/>');
    }, 120);

    initAudio();

    banner.querySelector('#alarm-exit-btn').addEventListener('click', stop);
    banner.querySelector('#alarm-disarm-btn').addEventListener('click', disarm);
  }

  function disarm() {
    if (!isRunning) return;
    if (sirenTimer) {
      clearTimeout(sirenTimer);
      sirenTimer = null;
    }

    // Play victory success tone
    try {
      if (audioCtx) {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.frequency.setValueAtTime(440, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.3);
      }
    } catch (_) {}

    if (banner) {
      banner.style.background = '#16a34a';
      banner.innerHTML = '<span>🛡️ THREAT NEUTRALIZED: FIREWALL RESTORED · ALL SYSTEMS NOMINAL</span>';
      setTimeout(stop, 1800);
    }
  }

  function stop() {
    if (!isRunning) return;
    isRunning = false;

    if (sirenTimer) clearTimeout(sirenTimer);
    if (hexTimer) clearInterval(hexTimer);

    if (audioCtx) {
      audioCtx.close();
      audioCtx = null;
    }

    if (strobe) {
      strobe.remove();
      strobe = null;
    }
    const styleEl = document.getElementById('alarm-keyframe-style');
    if (styleEl) styleEl.remove();

    if (banner) {
      banner.remove();
      banner = null;
    }
    if (terminal) {
      terminal.remove();
      terminal = null;
    }
  }

  function toggle() {
    if (isRunning) stop();
    else start();
  }

  window.__alarm = {
    start,
    stop,
    toggle,
    isRunning: () => isRunning,
  };

  start();
})();
