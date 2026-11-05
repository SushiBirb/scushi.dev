// oneko.js - Retro 90s desktop cat modified for scushi.dev fun mode
(function () {
  let nekoEl = null;
  let animId = null;
  let mouseMoveHandler = null;
  let touchMoveHandler = null;

  let nekoPosX = 32;
  let nekoPosY = 32;
  let mousePosX = 0;
  let mousePosY = 0;
  let frameCount = 0;
  let idleTime = 0;
  let idleAnimation = null;
  let idleAnimationFrame = 0;
  let lastFrameTimestamp = 0;
  const nekoSpeed = 11;

  const spriteSets = {
    idle: [[-3, -3]],
    alert: [[-7, -3]],
    scratchSelf: [[-5, 0], [-6, 0], [-7, 0]],
    scratchWallN: [[0, 0], [0, -1]],
    scratchWallS: [[-7, -1], [-6, -2]],
    scratchWallE: [[-2, -2], [-2, -3]],
    scratchWallW: [[-4, 0], [-4, -1]],
    tired: [[-3, -2]],
    sleeping: [[-2, 0], [-2, -1]],
    N: [[-1, -2], [-1, -3]],
    NE: [[0, -2], [0, -3]],
    E: [[-3, 0], [-3, -1]],
    SE: [[-5, -1], [-5, -2]],
    S: [[-6, -3], [-7, -2]],
    SW: [[-5, -3], [-6, -1]],
    W: [[-4, -2], [-4, -3]],
    NW: [[-1, 0], [-1, -1]],
  };

  function setSprite(name, frame) {
    if (!nekoEl) return;
    const set = spriteSets[name] || spriteSets.idle;
    const sprite = set[frame % set.length];
    nekoEl.style.backgroundPosition = `${sprite[0] * 32}px ${sprite[1] * 32}px`;
  }

  function resetIdleAnimation() {
    idleAnimation = null;
    idleAnimationFrame = 0;
  }

  function idle() {
    idleTime += 1;
    if (idleTime > 10 && Math.floor(Math.random() * 200) === 0 && idleAnimation === null) {
      const avail = ["sleeping", "scratchSelf"];
      if (nekoPosX < 32) avail.push("scratchWallW");
      if (nekoPosY < 32) avail.push("scratchWallN");
      if (nekoPosX > window.innerWidth - 32) avail.push("scratchWallE");
      if (nekoPosY > window.innerHeight - 32) avail.push("scratchWallS");
      idleAnimation = avail[Math.floor(Math.random() * avail.length)];
    }

    switch (idleAnimation) {
      case "sleeping":
        if (idleAnimationFrame < 8) {
          setSprite("tired", 0);
          break;
        }
        setSprite("sleeping", Math.floor(idleAnimationFrame / 4));
        if (idleAnimationFrame > 192) resetIdleAnimation();
        break;
      case "scratchWallN":
      case "scratchWallS":
      case "scratchWallE":
      case "scratchWallW":
      case "scratchSelf":
        setSprite(idleAnimation, idleAnimationFrame);
        if (idleAnimationFrame > 9) resetIdleAnimation();
        break;
      default:
        setSprite("idle", 0);
        return;
    }
    idleAnimationFrame += 1;
  }

  function frame() {
    frameCount += 1;
    const diffX = nekoPosX - mousePosX;
    const diffY = nekoPosY - mousePosY;
    const distance = Math.sqrt(diffX ** 2 + diffY ** 2);

    if (distance < nekoSpeed || distance < 48) {
      idle();
      return;
    }

    idleAnimation = null;
    idleAnimationFrame = 0;

    if (idleTime > 1) {
      setSprite("alert", 0);
      idleTime = Math.min(idleTime, 7);
      idleTime -= 1;
      return;
    }

    let direction = "";
    direction += diffY / distance > 0.5 ? "N" : "";
    direction += diffY / distance < -0.5 ? "S" : "";
    direction += diffX / distance > 0.5 ? "W" : "";
    direction += diffX / distance < -0.5 ? "E" : "";
    setSprite(direction || "S", frameCount);

    nekoPosX -= (diffX / distance) * nekoSpeed;
    nekoPosY -= (diffY / distance) * nekoSpeed;

    nekoPosX = Math.min(Math.max(16, nekoPosX), window.innerWidth - 16);
    nekoPosY = Math.min(Math.max(16, nekoPosY), window.innerHeight - 16);

    if (nekoEl) {
      nekoEl.style.left = `${nekoPosX - 16}px`;
      nekoEl.style.top = `${nekoPosY - 16}px`;
    }
  }

  function onAnimationFrame(timestamp) {
    if (!nekoEl || !nekoEl.isConnected) return;
    if (!lastFrameTimestamp) lastFrameTimestamp = timestamp;
    if (timestamp - lastFrameTimestamp > 95) {
      lastFrameTimestamp = timestamp;
      frame();
    }
    animId = window.requestAnimationFrame(onAnimationFrame);
  }

  function start() {
    if (nekoEl) return;
    nekoEl = document.createElement("div");
    nekoEl.id = "oneko";
    nekoEl.ariaHidden = "true";
    nekoEl.style.width = "32px";
    nekoEl.style.height = "32px";
    nekoEl.style.position = "fixed";
    nekoEl.style.pointerEvents = "none";
    nekoEl.style.imageRendering = "pixelated";
    nekoEl.style.left = `${nekoPosX - 16}px`;
    nekoEl.style.top = `${nekoPosY - 16}px`;
    nekoEl.style.zIndex = "2147483640";
    nekoEl.style.backgroundImage = 'url("/toys/oneko.gif")';
    document.body.appendChild(nekoEl);

    mousePosX = window.innerWidth / 2;
    mousePosY = window.innerHeight / 2;

    mouseMoveHandler = (e) => {
      mousePosX = e.clientX;
      mousePosY = e.clientY;
    };
    window.addEventListener("mousemove", mouseMoveHandler, { passive: true });

    touchMoveHandler = (e) => {
      if (e.touches && e.touches[0]) {
        mousePosX = e.touches[0].clientX;
        mousePosY = e.touches[0].clientY;
      }
    };
    window.addEventListener("touchmove", touchMoveHandler, { passive: true });
    window.addEventListener("touchstart", touchMoveHandler, { passive: true });
    animId = window.requestAnimationFrame(onAnimationFrame);
  }

  function stop() {
    if (animId) {
      window.cancelAnimationFrame(animId);
      animId = null;
    }
    if (mouseMoveHandler) {
      window.removeEventListener("mousemove", mouseMoveHandler);
      mouseMoveHandler = null;
    }
    if (touchMoveHandler) {
      window.removeEventListener("touchmove", touchMoveHandler);
      window.removeEventListener("touchstart", touchMoveHandler);
      touchMoveHandler = null;
    }
    if (nekoEl) {
      nekoEl.remove();
      nekoEl = null;
    }
  }

  function toggle() {
    if (nekoEl) stop();
    else start();
  }

  window.__oneko = {
    start,
    stop,
    toggle,
    isRunning: () => Boolean(nekoEl),
  };

  start();
})();
