// webamp.js - Embedded classic Winamp 2.9 for scushi.dev fun mode
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
      container.style.cssText = 'position:fixed;top:40px;right:40px;z-index:2147483640;';
      document.body.appendChild(container);

      webampInstance = new window.Webamp({
        initialTracks: [
          {
            metaData: {
              artist: 'DJ Mike Llama',
              title: "Llama Whippin' Intro",
            },
            url: 'https://cdn.jsdelivr.net/gh/captbaritone/webamp@43434d82/packages/webamp/demo/mp3/llama-2.29.mp3',
            duration: 5.322286,
          },
        ],
        zIndex: 2147483640,
      });

      webampInstance.onClose(() => {
        stop();
      });

      await webampInstance.renderWhenReady(container);
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
