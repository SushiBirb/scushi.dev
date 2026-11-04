// webamp.js - Classic Winamp 2.9 player with Jono - Please Hold default autoplay for scushi.dev fun mode
(function () {
  let webampInstance = null;
  let isRunning = false;
  let container = null;

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const existing = document.querySelector(`script[src="${src}"]`);
      if (existing) {
        if ((window).Webamp) return resolve();
        existing.addEventListener('load', () => resolve());
        existing.addEventListener('error', reject);
        return;
      }
      const s = document.createElement('script');
      s.src = src;
      s.onload = () => resolve();
      s.onerror = reject;
      document.body.appendChild(s);
    });
  }

  async function start() {
    if (isRunning) return;
    isRunning = true;

    try {
      await loadScript('/toys/webamp.bundle.min.js');

      if (!window.Webamp || !window.Webamp.browserIsSupported()) {
        console.warn('Webamp is not supported on this browser.');
        return;
      }

      container = document.createElement('div');
      container.id = 'webamp-app-root';
      container.style.cssText = 'position:fixed;bottom:20px;right:20px;z-index:2147483640;';
      document.body.appendChild(container);

      webampInstance = new window.Webamp({
        initialTracks: [
          {
            metaData: {
              artist: 'Jono',
              title: 'Please Hold (Hermitcraft Permit Office Song)',
            },
            url: '/toys/audio/please-hold.mp3',
            duration: 172.5,
          },
        ],
        zIndex: 2147483640,
      });

      webampInstance.onClose(() => {
        stop();
      });

      await webampInstance.renderWhenReady(container);

      // Autoplay the default song
      try {
        await webampInstance.play();
      } catch (e) {
        console.warn('Autoplay waiting for user gesture:', e);
      }
    } catch (err) {
      console.error('Failed to initialize Webamp:', err);
      stop();
    }
  }

  function stop() {
    if (!isRunning) return;
    isRunning = false;

    if (webampInstance) {
      try {
        webampInstance.dispose();
      } catch (_) {}
      webampInstance = null;
    }

    if (container) {
      container.remove();
      container = null;
    }

    try {
      sessionStorage.removeItem('scushi_active_toy');
    } catch (_) {}
  }

  function toggle() {
    if (isRunning) stop();
    else start();
  }

  window.__webamp = {
    start,
    stop,
    toggle,
    isRunning: () => isRunning,
  };

  start();
})();
