
(function () {
  "use strict";
  const uiState = { menu: false, ingame: false, map: false, esc: false };
  let _uiCache = { playBtn: null, map: null, escMenu: null, weaponContainer: null, ts: 0 };
  function getUIEls() {
    const now = Date.now();
    if (now - _uiCache.ts > 1000) {
      _uiCache.playBtn = document.getElementById("btn-start-mode-0");
      _uiCache.map = document.getElementById("big-map");
      _uiCache.escMenu = document.getElementById("ui-game-menu");
      _uiCache.weaponContainer = document.getElementById("ui-weapon-container");
      _uiCache.ts = now;
    }
    return _uiCache;
  }

  function detectUIStates() {
    const { playBtn, map, escMenu, weaponContainer } = getUIEls();

    const mapOpen = map && (map.style.display === "block" || (map.style.display === "" && map.offsetParent !== null));
    const escOpen = escMenu && (escMenu.style.display === "block" || (escMenu.style.display === "" && escMenu.offsetParent !== null));

    let inGame = false;
    if (weaponContainer && document.body.contains(weaponContainer)) {
      inGame = weaponContainer.offsetParent !== null;
    }

    const menuOpen = !inGame && !!(playBtn && playBtn.offsetParent !== null);

    uiState.menu = menuOpen;
    uiState.ingame = inGame;
    uiState.map = !!mapOpen;
    uiState.esc = !!escOpen;
  }

  setInterval(detectUIStates, 150);

  // controller checking :3
  function getControllerType(id) {
    if (!id) return "ps";
    const low = id.toLowerCase();
    if (low.includes("xbox") || low.includes("xinput") || low.includes("045e"))
      return "xbox";
    if (
      low.includes("dualshock") ||
      low.includes("dualsense") ||
      low.includes("playstation") ||
      low.includes("054c") ||
      low.includes("ps3") ||
      low.includes("ps4") ||
      low.includes("ps5")
    )
      return "ps";
    return "ps";
  }

  let controllerType = "ps";

  function activeIconType() {
    if (settings.iconSet === "xbox" || settings.iconSet === "ps")
      return settings.iconSet;
    return controllerType;
  }

  function confirmSymbols() {
    const t = activeIconType();
    return settings.swapXB
      ? { confirm: t === "xbox" ? "B" : "○", close: t === "xbox" ? "A" : "✕" }
      : { confirm: t === "xbox" ? "A" : "✕", close: t === "xbox" ? "B" : "○" };
  }

  const PS_BUTTON_NAMES = {
    0: "✕", 1: "○", 2: "□", 3: "△",
    4: "L1", 5: "R1", 6: "L2", 7: "R2",
    8: "Share", 9: "Options", 10: "L3", 11: "R3",
    12: "↑", 13: "↓", 14: "←", 15: "→", 16: "PS",
  };
  const XBOX_BUTTON_NAMES = {
    0: "A", 1: "B", 2: "X", 3: "Y",
    4: "LB", 5: "RB", 6: "LT", 7: "RT",
    8: "View", 9: "Menu", 10: "LS", 11: "RS",
    12: "↑", 13: "↓", 14: "←", 15: "→", 16: "Guide",
  };

  function btnName(idx) {
    const names =
      activeIconType() === "xbox" ? XBOX_BUTTON_NAMES : PS_BUTTON_NAMES;
    return names[idx] !== undefined ? names[idx] : "Btn " + idx;
  }

  function getBadgeDefs() {
    const xbox = activeIconType() === "xbox";
    const face = xbox
      ? [
          { symbol: "A", badgeClass: "ctrl-badge-xbox-a" },
          { symbol: "B", badgeClass: "ctrl-badge-xbox-b" },
          { symbol: "Y", badgeClass: "ctrl-badge-xbox-y" },
        ]
      : [
          { symbol: "✕", badgeClass: "ctrl-badge-x" },
          { symbol: "○", badgeClass: "ctrl-badge-circle" },
          { symbol: "△", badgeClass: "ctrl-badge-triangle" },
        ];
    if (settings.swapXB)
      return [
        { id: "btn-start-mode-0", badgeClass: face[1].badgeClass, symbol: face[1].symbol },
        { id: "btn-start-mode-1", badgeClass: face[2].badgeClass, symbol: face[2].symbol },
        { id: "btn-start-mode-2", badgeClass: face[0].badgeClass, symbol: face[0].symbol },
      ];
    return [
      { id: "btn-start-mode-0", badgeClass: face[0].badgeClass, symbol: face[0].symbol },
      { id: "btn-start-mode-1", badgeClass: face[2].badgeClass, symbol: face[2].symbol },
      { id: "btn-start-mode-2", badgeClass: face[1].badgeClass, symbol: face[1].symbol },
    ];
  }

  // DEFAULT SETTINGS!!1!!!!
  const DEFAULT_SETTINGS = {
    enabled: true, // master toggle
    autoLoot: true, // auto loot ammo and grenades
    autoOpenDoors: false, // auto opens doors when nearby
    consumableWheel: true, // ahh yes consumable wheel awhh yess yummy
    spamFire: false, // auto spams shoot for pistol or semi auto
    blockKeyboard: true, // self explanatory
    hideCursor: true, // self explanatory
    swapXB: false, // self explanatory
    iconSet: "auto",
    forceDesktop: false, // force desktop for mobile/handheld
    aimWithLeft: false, // left stick also aims when right stick idle
    aimLine: true, // line from screen center to crosshair
    simpleUI: false, // strip CSS
    guiScale: 100, // UI scale percentage (50–150)
    aimSensitivity: 50, // aim sensitivity
    aimSmoothing: 5, // aim smoothing
    analogInterp: false, // smooths sticks that lock to the 4 axes
    analogInterpStrength: 7, // 1-10
    freeLookSpeed: 5, // cursor speed
    leftDeadzone: 15, // deadzone
    rightDeadzone: 12, // deadzone
    reloadHold: {
      enabled: true,
      holdMs: 400,
    },
    crosshair: {
      style: "cross",
      size: 12,
      thickness: 2,
      gap: 4,
      color: "#00ff88",
      opacity: 90,
      strokeColor: "#000000",
      strokeWidth: 0,
    },
    binds: {
      btnInteract: 0,
      btnThrowable: 3,
      btnMelee: 2,
      btnPickupOther: 6,
      btnFire: 7,
      btnR1: 5,
      btnL1: 4,
      btnConsWheel: 13,
      btnDpadUp: 12,
      btnDpadLeft: 14,
      btnDpadRight: 15,
      btnMap: 8,
      btnMenu: 9,
      btnCircle: 1,
      btnL3: 10,
      btnR3: 11,
    },
    menuBinds: {
      playSolo: 0,
      playDuo: 3,
      playSquad: 1,
    },
  };


  let settings = JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
  try {
    const saved = localStorage.getItem("ctrl_ext_settings_v2");
    if (saved) settings = deepMerge(DEFAULT_SETTINGS, JSON.parse(saved));
  } catch (e) {}

  let controllerIndex = null;
  let prevButtons = [];
  let animFrameId = null;
  let isInGame = false;
  let quitMode = false;
  let aimAngle = 0;
  let leftX = 0,
    leftY = 0,
    rightX = 0,
    rightY = 0;
  let mouseVX = 0,
    mouseVY = 0;
  let currentMouseX = window.innerWidth / 2;
  let currentMouseY = window.innerHeight / 2;
  let settingsOpen = false;
  let listeningFor = null;

  let meleeHoldTimer = null;
  let meleeHoldFired = false;

  let dropMenuOpen = false;
  let autoLootPauseUntil = 0; 

  // Droppable items 
  // Id is the element name and label is the menu name

  const DROP_ITEMS = [
    { id: "ui-scope-2xscope", label: "2x Scope" },
    { id: "ui-scope-4xscope", label: "4x Scope" },
    { id: "ui-scope-8xscope", label: "8x Scope" },
    { id: "ui-scope-15xscope", label: "15x Scope" },
    { id: "ui-loot-bandage", label: "Bandage" },
    { id: "ui-loot-healthkit", label: "Med Kit" },
    { id: "ui-loot-soda", label: "Soda" },
    { id: "ui-loot-painkiller", label: "Pills" }, // PILLS NOT PAINKILLERS U DUMBASSS!!
    { id: "ui-loot-9mm", label: "9mm" },
    { id: "ui-loot-762mm", label: "7.62mm" },
    { id: "ui-loot-556mm", label: "5.56mm" },
    { id: "ui-loot-12gauge", label: "12 Gauge" },
    { id: "ui-loot-50ae", label: ".50 AE" },
    { id: "ui-loot-308sub", label: ".308 Sub" },
    { id: "ui-loot-flare", label: "Flare" },
    { id: "ui-loot-45acp", label: ".45 ACP" },
    { id: "ui-weapon-id-1", label: "Primary", isWeapon: true },
    { id: "ui-weapon-id-2", label: "Secondary", isWeapon: true },
    { id: "ui-weapon-id-3", label: "Melee", isWeapon: true },
  ];
  let dropSelectedIdx = 0;

  const SCOPE_IDS = [
    "ui-scope-1xscope",
    "ui-scope-2xscope",
    "ui-scope-4xscope",
    "ui-scope-8xscope",
    "ui-scope-15xscope",
  ];
  let currentScopeIdx = 0;

  // xb swap
  // DISCAMLER there is a bug where the icons will not change alongside this setting but im too lazy to fix it
  function swapBtn(idx) {
    if (!settings.swapXB) return idx;
    if (idx === 0) return 1;
    if (idx === 1) return 0;
    return idx;
  }


  function deepMerge(base, override) {
    const out = Object.assign({}, base);
    for (const k in override) {
      if (
        override[k] &&
        typeof override[k] === "object" &&
        !Array.isArray(override[k])
      ) {
        out[k] = deepMerge(base[k] || {}, override[k]);
      } else {
        out[k] = override[k];
      }
    }
    return out;
  }
  function saveSettings() {
    try {
      localStorage.setItem("ctrl_ext_settings_v2", JSON.stringify(settings));
    } catch (e) {}
  }

  // notification toast (im very proud of this)

  function showToast(type, title, sub) {
    let c = document.getElementById("ctrl-toast-container");
    if (!c) {
      c = document.createElement("div");
      c.id = "ctrl-toast-container";
      document.body.appendChild(c);
    }
    const toast = document.createElement("div");
    toast.className = `ctrl-toast ${type}`;
    const icon = type === "connected" ? "🎮" : "⛔";
    toast.innerHTML = `<div class="ctrl-toast-icon">${icon}</div><div class="ctrl-toast-text"><div class="ctrl-toast-title">${title}</div>${sub ? `<div class="ctrl-toast-sub">${sub}</div>` : ""}</div>`;
    c.appendChild(toast);
    requestAnimationFrame(() =>
      requestAnimationFrame(() => toast.classList.add("show")),
    );
    setTimeout(() => {
      toast.classList.remove("show");
      toast.classList.add("hide");
      setTimeout(() => toast.remove(), 400);
    }, 3200);
  }

  // CURSOR HIDE
  let cursorStyleEl = null;
  let _cursorHideActive = null;
  function updateCursorHide() {
    if (!cursorStyleEl) {
      cursorStyleEl = document.createElement("style");
      cursorStyleEl.id = "ctrl-cursor-style";
      document.head.appendChild(cursorStyleEl);
    }
    const shouldHide =
      settings.hideCursor &&
      controllerIndex !== null &&
      uiState.ingame &&
      !uiState.map &&
      !uiState.esc;
    if (shouldHide === _cursorHideActive) return; // no change — skip DOM write
    _cursorHideActive = shouldHide;
    cursorStyleEl.textContent = shouldHide ? "* { cursor: none !important; }" : "";
  }

  // keyboard block Fixed bug which made moving and every keyboard functoin unusable with controller
  function handleKeyboardBlock(e) {
    if (
      !settings.blockKeyboard ||
      controllerIndex === null ||
      !settings.enabled
    )
      return;
    if (e.key === "F9") return;
    if (e.ctrlKey || e.altKey || e.metaKey) return;
    if (!e.isTrusted) return;
    e.stopImmediatePropagation();
    e.preventDefault();
  }
  document.addEventListener("keydown", handleKeyboardBlock, true);
  document.addEventListener("keyup", handleKeyboardBlock, true);

  // DESKTOP SPOOF for handheld users (only 1 person 🫩) or mobile
  let desktopModeActive = false,
    vpObserver = null,
    touchToMouseBound = null,
    origMatchMedia = null;

  function applyForceDesktop() {
    if (desktopModeActive) return;
    desktopModeActive = true;
    try {
      const ua =
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
      Object.defineProperty(navigator, "userAgent", {
        get: () => ua,
        configurable: true,
      });
      Object.defineProperty(navigator, "userAgentData", {
        get: () => ({
          brands: [
            { brand: "Chromium", version: "124" },
            { brand: "Google Chrome", version: "124" },
          ],
          mobile: false,
          platform: "Windows",
          getHighEntropyValues: async () => ({
            platform: "Windows",
            mobile: false,
          }),
        }),
        configurable: true,
      });
    } catch (e) {}
    try {
      Object.defineProperty(navigator, "maxTouchPoints", {
        get: () => 0,
        configurable: true,
      });
    } catch (e) {}
    function patchViewport() {
      const ex = document.querySelector('meta[name="viewport"]');
      const content =
        "width=1920, initial-scale=" + (window.screen.width / 1920).toFixed(4);
      if (ex) ex.setAttribute("content", content);
      else {
        const m = document.createElement("meta");
        m.name = "viewport";
        m.content = content;
        (document.head || document.documentElement).appendChild(m);
      }
    }
    patchViewport();
    vpObserver = new MutationObserver(patchViewport);
    if (document.head)
      vpObserver.observe(document.head, { childList: true, subtree: true });
    origMatchMedia = window.matchMedia.bind(window);
    window.matchMedia = function (q) {
      const r = origMatchMedia(q);
      if (
        [
          "(pointer: coarse)",
          "(hover: none)",
          "(any-pointer: coarse)",
        ].includes(q.trim())
      )
        return Object.assign(Object.create(r), { matches: false });
      if (
        ["(pointer: fine)", "(hover: hover)", "(any-pointer: fine)"].includes(
          q.trim(),
        )
      )
        return Object.assign(Object.create(r), { matches: true });
      return r;
    };
    touchToMouseBound = function (evt) {
      const t = evt.changedTouches[0];
      if (!t) return;
      const map = {
        touchstart: "mousedown",
        touchmove: "mousemove",
        touchend: "mouseup",
      };
      const mt = map[evt.type];
      if (!mt) return;
      t.target.dispatchEvent(
        new MouseEvent(mt, {
          bubbles: true,
          cancelable: true,
          view: window,
          clientX: t.clientX,
          clientY: t.clientY,
          screenX: t.screenX,
          screenY: t.screenY,
          button: 0,
          buttons: mt === "mouseup" ? 0 : 1,
        }),
      );
    };
    document.addEventListener("touchstart", touchToMouseBound, {
      passive: true,
      capture: true,
    });
    document.addEventListener("touchmove", touchToMouseBound, {
      passive: true,
      capture: true,
    });
    document.addEventListener("touchend", touchToMouseBound, {
      passive: true,
      capture: true,
    });
    showToast(
      "connected",
      "Force Desktop Layout ON",
      "Reload page to fully apply UA spoof",
    );
  }
  function removeForceDesktop() {
    if (!desktopModeActive) return;
    desktopModeActive = false;
    if (vpObserver) {
      vpObserver.disconnect();
      vpObserver = null;
    }
    if (origMatchMedia) {
      window.matchMedia = origMatchMedia;
      origMatchMedia = null;
    }
    if (touchToMouseBound) {
      document.removeEventListener("touchstart", touchToMouseBound, true);
      document.removeEventListener("touchmove", touchToMouseBound, true);
      document.removeEventListener("touchend", touchToMouseBound, true);
      touchToMouseBound = null;
    }
    showToast(
      "disconnected",
      "Force Desktop Layout OFF",
      "Reload page to restore UA",
    );
  }
  function syncForceDesktop() {
    if (settings.forceDesktop) applyForceDesktop();
    else removeForceDesktop();
  }
  if (settings.forceDesktop) applyForceDesktop();

  // SIMPLE UI — strips css decorations for perf
  let simpleUIEl = null;
  function applySimpleUI() {
    if (!simpleUIEl) {
      simpleUIEl = document.createElement("style");
      simpleUIEl.id = "ctrl-simple-ui";
      document.head.appendChild(simpleUIEl);
    }
    simpleUIEl.textContent = settings.simpleUI
      ? `* { box-shadow:none!important; text-shadow:none!important; backdrop-filter:none!important; filter:none!important; transition:none!important; animation:none!important; }
         #ctrl-settings-modal, #ctrl-settings-header, #ctrl-nav, #ctrl-settings-footer { background:#14171c!important; }`
      : "";
  }

  // KOFI BEGONE
  function removeKofi() {
    document
      .querySelectorAll('a[href="https://ko-fi.com/survev"]')
      .forEach((el) => el.remove());
  }

  let _menuA = false,
    _menuL = false,
    _menuD = false,
    _menuS = false;

  function setupMenuKeyListeners() {
    document.addEventListener("keydown", (e) => {
      if (e.isTrusted) return; // only our own controllere events
      if (e.key === "a") _menuA = true;
      if (e.key === "l") _menuL = true;
      if (e.key === "d") _menuD = true;
      if (e.key === "s") _menuS = true;

      if (_menuA && _menuL) {
        const btn = document.getElementById("btn-start-mode-0");
        if (btn) btn.click();
        _menuA = _menuL = false;
      }
      if (_menuD && _menuL) {
        const btn = document.getElementById("btn-start-mode-1");
        if (btn) btn.click();
        _menuD = _menuL = false;
      }
      if (_menuS && _menuL) {
        const btn = document.getElementById("btn-start-mode-2");
        if (btn) btn.click();
        _menuS = _menuL = false;
      }
    });
    document.addEventListener("keyup", (e) => {
      if (e.isTrusted) return;
      if (e.key === "a") _menuA = false;
      if (e.key === "l") _menuL = false;
      if (e.key === "d") _menuD = false;
      if (e.key === "s") _menuS = false;
    });
  }

  // fires the right key combo for the given menu slot
  // 0=solo(A+L), 1=duo(D+L), 2=squad(S+L)
  function fireMenuCombo(slot) {
    const fire = (key) => {
      document.dispatchEvent(
        new KeyboardEvent("keydown", {
          key,
          bubbles: true,
          cancelable: true,
          view: window,
        }),
      );
      setTimeout(
        () =>
          document.dispatchEvent(
            new KeyboardEvent("keyup", {
              key,
              bubbles: true,
              cancelable: true,
              view: window,
            }),
          ),
        60,
      );
    };
    if (slot === 0) {
      fire("a");
      setTimeout(() => fire("l"), 15);
    }
    if (slot === 1) {
      fire("d");
      setTimeout(() => fire("l"), 15);
    }
    if (slot === 2) {
      fire("s");
      setTimeout(() => fire("l"), 15);
    }
  }

  // Controller connect disconnect (mainly for toasts)
  window.addEventListener("gamepadconnected", (e) => {
    controllerIndex = e.gamepad.index;
    prevButtons = [];
    controllerType = getControllerType(e.gamepad.id);
    showToast(
      "connected",
      (controllerType === "xbox"
        ? "Xbox Controller"
        : "PlayStation Controller") + " Connected",
      e.gamepad.id.slice(0, 42),
    );
    updateConnectedDot(true);
    updateMenuBadges();
    updateStatusBar();
    updateCursorHide();
    if (!animFrameId) startLoop();
  });
  window.addEventListener("gamepaddisconnected", (e) => {
    if (e.gamepad.index !== controllerIndex) return;
    controllerIndex = null;
    showToast(
      "disconnected",
      "Controller Disconnected",
      "Plug in again to reconnect",
    );
    updateConnectedDot(false);
    updateStatusBar();
    updateCursorHide();
    if (animFrameId) {
      cancelAnimationFrame(animFrameId);
      animFrameId = null;
    }
  });

  function updateConnectedDot(on) {
    const dot = document.querySelector(".ctrl-connected-dot");
    if (dot) dot.style.display = on ? "block" : "none";
  }
  function updateStatusBar() {
    const ind = document.getElementById("ctrl-status-indicator");
    const txt = document.getElementById("ctrl-status-text");
    if (!ind || !txt) return;
    if (controllerIndex !== null) {
      ind.className = "on";
      const gp = navigator.getGamepads()[controllerIndex];
      txt.textContent =
        (gp ? gp.id.slice(0, 46) : "Connected") +
        ` [${controllerType.toUpperCase()}]`;
    } else {
      ind.className = "off";
      txt.textContent = "No controller detected";
    }
  }

  // loops
  function startLoop() {
    let _lastInGame = false;
    let _lastMap = false;
    let _lastEsc = false;

    function loop() {
      animFrameId = requestAnimationFrame(loop);
      if (controllerIndex === null || !settings.enabled) return;

      const gp = navigator.getGamepads()[controllerIndex];
      if (!gp) return;

      isInGame = uiState.ingame;

      // Only call updateCursorHide when relevant state changes — not every frame that will lag you so much
      if (isInGame !== _lastInGame || uiState.map !== _lastMap || uiState.esc !== _lastEsc) {
        _lastInGame = isInGame;
        _lastMap = uiState.map;
        _lastEsc = uiState.esc;
        updateCursorHide();
      }

      const ldz = settings.leftDeadzone / 100;
      const rdz = settings.rightDeadzone / 100;
      leftX = applyDeadzone(gp.axes[0] || 0, ldz);
      leftY = applyDeadzone(gp.axes[1] || 0, ldz);
      rightX = applyDeadzone(gp.axes[2] || 0, rdz);
      rightY = applyDeadzone(gp.axes[3] || 0, rdz);

      gp.buttons.forEach((btn, idx) => {
        const pressed = btn.pressed || btn.value > 0.5;
        const was = prevButtons[idx] || false;
        if (pressed && !was) onButtonDown(idx);
        if (!pressed && was) onButtonUp(idx);
        prevButtons[idx] = pressed;
      });

      if (!dropMenuOpen) {
        handleMovement();
        handleMouseMode(gp);
        const rtHeld = (gp.buttons[settings.binds.btnFire]?.value || 0) > 0.5;
        if (isInGame && !uiState.map && !uiState.esc) {
// Fix grenades being unusbale due to spam fire
          const grenadeEl = document.getElementById("ui-weapon-id-4");
          const grenadeActive = grenadeEl && grenadeEl.style.opacity === "1";
          if (settings.spamFire && !grenadeActive) setMouseButtonSpam(rtHeld);
          else setMouseButtonHeld(rtHeld);
        } else {
          // clear fire state when not ingame
          setMouseButtonHeld(false);
          setMouseButtonSpam(false);
        }
      }

      updateCrosshairPosition();
      updateAimLine();
    }
    loop();
  }

  function applyDeadzone(val, dz) {
    if (Math.abs(val) < dz) return 0;
    return (val - Math.sign(val) * dz) / (1 - dz);
  }

  // ANALOG INTERPOLATION
  // cheap sticks often gate input into a cross shape, so aim snaps to the 4
  // cardinal directions and diagonal angles are unreachable. expanding the
  // angle away from the nearest axis brings the in-between angles back
  function interpolateAxes(x, y) {
    const mag = Math.hypot(x, y);
    if (mag < 0.01) return [x, y];
    const quarter = Math.PI / 2;
    const raw = Math.atan2(y, x);
    const nearest = Math.round(raw / quarter) * quarter;
    const maxErr = Math.PI / 4;
    const err = raw - nearest;
    const t = Math.min(Math.abs(err) / maxErr, 1);
    const curve = 1 - (settings.analogInterpStrength / 10) * 0.72;
    const eased = Math.pow(t, curve) * maxErr * Math.sign(err);
    const a = nearest + eased;
    return [Math.cos(a) * mag, Math.sin(a) * mag];
  }

  // MOUSE MODE — context-aware aiming vs free cursor
  // free mode: menu open, map open, or esc open (same as mouse mode?!)
  // aim mode: ingame, no overlays

  let freeCursorHeld = false;
  const _mouseOpts = { bubbles: true, cancelable: true, view: window, clientX: 0, clientY: 0 };
  const _mouseOptsBtn = { bubbles: true, cancelable: true, view: window, clientX: 0, clientY: 0, button: 0, buttons: 0 };

  function handleMouseMode(gp) {
    const freeMode = uiState.menu || uiState.map || uiState.esc;

    if (freeMode) {
      const rx = rightX, ry = rightY;
      const lx = leftX, ly = leftY;
      const rightActive = Math.hypot(rx, ry) > 0.05;
      const mx = rightActive ? rx : lx;
      const my = rightActive ? ry : ly;
      const speed = (settings.freeLookSpeed / 5) * 12;
      if (Math.hypot(mx, my) > 0.05) {
        currentMouseX = Math.max(0, Math.min(window.innerWidth, currentMouseX + mx * speed));
        currentMouseY = Math.max(0, Math.min(window.innerHeight, currentMouseY + my * speed));
        _mouseOpts.clientX = currentMouseX;
        _mouseOpts.clientY = currentMouseY;
        document.dispatchEvent(new MouseEvent("mousemove", _mouseOpts));
        const el = document.elementFromPoint(currentMouseX, currentMouseY);
        if (el && el !== document.body) el.dispatchEvent(new MouseEvent("mousemove", _mouseOpts));
      }
      const rtHeld = (gp.buttons[settings.binds.btnFire]?.value || 0) > 0.5;
      if (rtHeld && !freeCursorHeld) {
        freeCursorHeld = true;
        fireMouseAt(currentMouseX, currentMouseY, "mousedown");
      } else if (!rtHeld && freeCursorHeld) {
        freeCursorHeld = false;
        fireMouseAt(currentMouseX, currentMouseY, "mouseup");
        fireMouseAt(currentMouseX, currentMouseY, "click");
        const el = document.elementFromPoint(currentMouseX, currentMouseY);
        if (el) el.click();
      }
    } else if (isInGame) {
      freeCursorHeld = false;
      handleAiming();
    }
  }

  // onButtonDown
  function onButtonDown(idx) {
    if (listeningFor) {
      finishListening(idx);
      return;
    }
    if (dropMenuOpen) {
      handleDropMenuInput(idx);
      return;
    }

    const b = settings.binds;
    const mb = settings.menuBinds;
    const effIdx = swapBtn(idx);

    // menu only
    if (!isInGame) {
      if (effIdx === mb.playSolo) {
        fireMenuCombo(0);
        return;
      }
      if (effIdx === mb.playDuo) {
        fireMenuCombo(1);
        return;
      }
      if (effIdx === mb.playSquad) {
        fireMenuCombo(2);
        return;
      }
    }

    // drop menu toggle
    if (effIdx === b.btnR3 && isInGame) {
      toggleDropMenu();
      return;
    }

    // in-game stuffs
    if (isInGame) {
      if (effIdx === b.btnInteract) simulateKey("f", "keydown");
      if (effIdx === b.btnThrowable) simulateKey("4", "keydown");
      if (effIdx === b.btnPickupOther) simulateKey("j", "keydown");
      if (effIdx === b.btnR1) simulateKey("q", "keydown");
      if (effIdx === b.btnL1) simulateKey("c", "keydown");
      if (effIdx === b.btnL3) simulateKey("t", "keydown");

      // melee
        if (effIdx === b.btnMelee) {
        meleeHoldFired = false;
        if (settings.reloadHold.enabled) {
          meleeHoldTimer = setTimeout(() => {
            meleeHoldFired = true;
            simulateKey("r", "keydown");
            setTimeout(() => simulateKey("r", "keyup"), 80);
          }, settings.reloadHold.holdMs);
        } else {
          simulateKey("e", "keydown");
        }
      }

      if (effIdx === b.btnConsWheel) {
        if (settings.consumableWheel) simulateKey("h", "keydown");
        else clickGameEl("ui-loot-bandage");
      }
      if (effIdx === b.btnDpadUp) {
        if (!settings.consumableWheel) clickGameEl("ui-loot-healthkit");
      }
      if (effIdx === b.btnDpadLeft) {
        if (settings.consumableWheel) cycleScope(-1);
        else clickGameEl("ui-loot-soda");
      }
      if (effIdx === b.btnDpadRight) {
        if (settings.consumableWheel) cycleScope(1);
        else clickGameEl("ui-loot-painkiller");
      }
    }




    if (effIdx === b.btnMap) simulateKey("m", "keydown");

    if (effIdx === b.btnMenu) {
      if (isInGame) {
        if (!quitMode) {
          simulateKey("Escape", "keydown");
          quitMode = true;
        } else {
          quitMode = false;
          simulateKey("Escape", "keydown");
        }
      } else {
        simulateKey("Escape", "keydown");
      }
    }

    if (effIdx === b.btnCircle && isInGame && quitMode) {
      hardClick("btn-game-quit");
      quitMode = false;
    }
  }

  function onButtonUp(idx) {
    if (dropMenuOpen) return;
    const b = settings.binds;
    const effIdx = swapBtn(idx);

    if (effIdx === b.btnInteract) simulateKey("f", "keyup");
    if (effIdx === b.btnThrowable) simulateKey("4", "keyup");
    if (effIdx === b.btnPickupOther) simulateKey("j", "keyup");
    if (effIdx === b.btnR1) simulateKey("q", "keyup");
    if (effIdx === b.btnL1) simulateKey("c", "keyup");
    if (effIdx === b.btnL3) simulateKey("t", "keyup");
    if (effIdx === b.btnMap) simulateKey("m", "keyup");
    if (effIdx === b.btnMenu) simulateKey("Escape", "keyup");
    if (effIdx === b.btnConsWheel && settings.consumableWheel)
      simulateKey("h", "keyup");

    if (effIdx === b.btnMelee) {
      if (meleeHoldTimer) {
        clearTimeout(meleeHoldTimer);
        meleeHoldTimer = null;
      }
      if (!meleeHoldFired) {
        simulateKey("e", "keydown");
        setTimeout(() => simulateKey("e", "keyup"), 80);
      }
    }
  }

  // SCOPE CYCLING doesnt even work some of the times but yeh
  function cycleScope(dir) {
    let activeIdx = currentScopeIdx;
    for (let i = 0; i < SCOPE_IDS.length; i++) {
      const el = document.getElementById(SCOPE_IDS[i]);
      if (el && el.classList.contains("ui-zoom-active")) {
        activeIdx = i;
        break;
      }
    }
    const next = (activeIdx + dir + SCOPE_IDS.length) % SCOPE_IDS.length;
    const target = document.getElementById(SCOPE_IDS[next]);
    if (target) {
      currentScopeIdx = next;
      forceClick(target);
    }
  }

  // DROP MENU MY BELOVED
  function toggleDropMenu() {
    if (dropMenuOpen) closeDropMenu();
    else openDropMenu();
  }

  function openDropMenu() {
    dropMenuOpen = true;
    dropSelectedIdx = 0;
    renderDropMenu();
  }

  function closeDropMenu() {
    dropMenuOpen = false;
    document.getElementById("ctrl-drop-menu")?.remove();
    autoLootPauseUntil = Date.now() + 8430;
  }
//gets the name for the weapons so it isnt just primary weapon and secondary weapon
  function getDropItemLabel(item) {
    if (!item.isWeapon) return item.label;
    const el = document.getElementById(item.id);
    if (!el) return item.label;
    const nameEl = el.querySelector(".ui-weapon-name");
    return nameEl ? nameEl.textContent.trim() : item.label;
  }

  function renderDropMenu() {
    document.getElementById("ctrl-drop-menu")?.remove();
    const menu = document.createElement("div");
    menu.id = "ctrl-drop-menu";
    const { confirm, close } = confirmSymbols();
    menu.innerHTML = `
      <div class="ctrl-drop-head">
        <span class="ctrl-drop-title">Drop Item</span>
        <span class="ctrl-drop-keys"><span class="ctrl-key-chip">${confirm}</span><span>drop</span><span class="ctrl-key-chip">${close}</span><span>close</span></span>
      </div>
      <div class="ctrl-drop-list" id="ctrl-drop-list"></div>
      <div class="ctrl-drop-foot"><span class="ctrl-key-chip">↑</span><span class="ctrl-key-chip">↓</span><span>navigate</span></div>`;
    document.body.appendChild(menu);
    renderDropList();
  }

  function renderDropList() {
    const list = document.getElementById("ctrl-drop-list");
    if (!list) return;
    list.innerHTML = "";
    DROP_ITEMS.forEach((item, i) => {
      const exists = !!document.getElementById(item.id);
      const row = document.createElement("div");
      row.className =
        "ctrl-drop-item" +
        (i === dropSelectedIdx ? " selected" : "") +
        (!exists ? " unavailable" : "");
      row.textContent = getDropItemLabel(item);
      list.appendChild(row);
    });
    list.children[dropSelectedIdx]?.scrollIntoView({ block: "nearest" });
  }

  function handleDropMenuInput(idx) {
    const b = settings.binds;
    const effIdx = swapBtn(idx);
    if (effIdx === b.btnDpadUp || idx === 12) {
      dropSelectedIdx =
        (dropSelectedIdx - 1 + DROP_ITEMS.length) % DROP_ITEMS.length;
      renderDropList();
    } else if (effIdx === b.btnConsWheel || idx === 13) {
      dropSelectedIdx = (dropSelectedIdx + 1) % DROP_ITEMS.length;
      renderDropList();
    } else if (effIdx === b.btnInteract || effIdx === 0) {
      const target = document.getElementById(DROP_ITEMS[dropSelectedIdx].id);
      if (target) forceRightClick(target);
    } else if (
      effIdx === b.btnCircle ||
      effIdx === 1 ||
      effIdx === b.btnR3 ||
      idx === 11
    ) {
      closeDropMenu();
    }
  }

  // Movement
  let moveKeyState = { w: false, a: false, s: false, d: false };

  function handleMovement() {
    // no movement in menus
    if (uiState.menu) return;
    const t = 0.25;
    const nW = leftY < -t,
      nS = leftY > t,
      nA = leftX < -t,
      nD = leftX > t;
    if (nW !== moveKeyState.w) {
      simulateKey("w", nW ? "keydown" : "keyup");
      moveKeyState.w = nW;
    }
    if (nS !== moveKeyState.s) {
      simulateKey("s", nS ? "keydown" : "keyup");
      moveKeyState.s = nS;
    }
    if (nA !== moveKeyState.a) {
      simulateKey("a", nA ? "keydown" : "keyup");
      moveKeyState.a = nA;
    }
    if (nD !== moveKeyState.d) {
      simulateKey("d", nD ? "keydown" : "keyup");
      moveKeyState.d = nD;
    }
  }

  const _aimEventOpts = { bubbles: true, cancelable: true, view: window, clientX: 0, clientY: 0 };
  let _cachedCanvas = null;
  let _canvasCacheTs = 0;
  function getCanvas() {
    const now = Date.now();
    if (!_cachedCanvas || now - _canvasCacheTs > 2000) {
      _cachedCanvas = document.querySelector("canvas");
      _canvasCacheTs = now;
    }
    return _cachedCanvas;
  }

  function handleAiming() {
    const rightActive = Math.hypot(rightX, rightY) > 0.05;
    const leftActive = settings.aimWithLeft && Math.hypot(leftX, leftY) > 0.05;

    let axX = 0, axY = 0;
    if (rightActive) {
      axX = rightX; axY = rightY;
    } else if (leftActive) {
      axX = leftX; axY = leftY;
    } else {
      return; // keep angle where it is
    }

    if (settings.analogInterp) {
      const i = interpolateAxes(axX, axY);
      axX = i[0];
      axY = i[1];
    }

    const sf = 0.08 + (settings.aimSmoothing / 100) * 0.12;
    mouseVX += (axX - mouseVX) * sf * 10;
    mouseVY += (axY - mouseVY) * sf * 10;
    if (Math.hypot(mouseVX, mouseVY) > 0.05)
      aimAngle = Math.atan2(mouseVY, mouseVX);

    const r = (settings.aimSensitivity / 50) * 180 + 60;
    const tx = window.innerWidth / 2 + Math.cos(aimAngle) * r;
    const ty = window.innerHeight / 2 + Math.sin(aimAngle) * r;
    const ls = 0.18 + (settings.aimSmoothing / 100) * 0.25;
    currentMouseX += (tx - currentMouseX) * ls;
    currentMouseY += (ty - currentMouseY) * ls;

    // reuse opts, only update the coords
    _aimEventOpts.clientX = currentMouseX;
    _aimEventOpts.clientY = currentMouseY;
    const ev = new MouseEvent("mousemove", _aimEventOpts);
    document.dispatchEvent(ev);

    const canvas = getCanvas();
    if (canvas) canvas.dispatchEvent(new MouseEvent("mousemove", _aimEventOpts));
  }
//aimline
  let aimLineEl = null;
  let _aimLineEl = null; // the <line> element inside the SVG — reused, not rebuilt

  function ensureAimLine() {
    if (aimLineEl) return;
    aimLineEl = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    aimLineEl.id = "ctrl-aim-line";
    aimLineEl.style.cssText =
      "position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:99996;overflow:visible;";
    // Create the <line> once and keep it — setAttribute is far cheaper than innerHTML
    _aimLineEl = document.createElementNS("http://www.w3.org/2000/svg", "line");
    _aimLineEl.setAttribute("stroke-width", "1.5");
    _aimLineEl.setAttribute("stroke-opacity", "0.4");
    _aimLineEl.setAttribute("stroke-dasharray", "5 5");
    aimLineEl.appendChild(_aimLineEl);
    document.body.appendChild(aimLineEl);
  }

  function updateAimLine() {
    if (!settings.aimLine) {
      if (aimLineEl) aimLineEl.style.display = "none";
      return;
    }
    if (!aimLineEl) ensureAimLine();

    // hide when no gameplay
    if (!isInGame || uiState.map || uiState.esc) {
      aimLineEl.style.display = "none";
      return;
    }

    aimLineEl.style.display = "block";
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    _aimLineEl.setAttribute("x1", cx);
    _aimLineEl.setAttribute("y1", cy);
    _aimLineEl.setAttribute("x2", currentMouseX);
    _aimLineEl.setAttribute("y2", currentMouseY);
    _aimLineEl.setAttribute("stroke", settings.crosshair.color);
  }

  // CROSSHAIR
  let crosshairEl = null;

  function ensureCrosshair() {
    if (crosshairEl) return;
    crosshairEl = document.createElement("div");
    crosshairEl.id = "ctrl-crosshair";
    document.body.appendChild(crosshairEl);
  }
  function updateCrosshairPosition() {
    if (!crosshairEl || controllerIndex === null) return;
    crosshairEl.style.transform = `translate(calc(${currentMouseX}px - 50%), calc(${currentMouseY}px - 50%))`;
  }
  function rebuildCrosshair() {
    crosshairEl?.remove();
    crosshairEl = null;
    ensureCrosshair();
    applyCrosshairStyle();
  }
  function applyCrosshairStyle() {
    if (!crosshairEl) return;
    crosshairEl.innerHTML = "";
    crosshairEl.style.cssText = `position:fixed;pointer-events:none;z-index:99997;transform:translate(-50%,-50%);top:0;left:0;`;
    crosshairEl.innerHTML = crosshairSvg(settings.crosshair);
  }

  // fire and lclick
  let fireInterval = null;
  const heldMouseBtn = { held: false };

  function setMouseButtonHeld(held) {
    if (held && !heldMouseBtn.held) {
      heldMouseBtn.held = true;
      fireMouseAt(currentMouseX, currentMouseY, "mousedown");
// 33ms to reduce lag (16 ms will fry low end pcs like mine)
      fireInterval = setInterval(
        () => fireMouseAt(currentMouseX, currentMouseY, "mousedown"),
        33,
      );
    } else if (!held && heldMouseBtn.held) {
      heldMouseBtn.held = false;
      clearInterval(fireInterval);
      fireInterval = null;
      fireMouseAt(currentMouseX, currentMouseY, "mouseup");
      fireMouseAt(currentMouseX, currentMouseY, "click");
    }
  }

  let spamInterval = null,
    spamActive = false;
  function setMouseButtonSpam(held) {
    if (held && !spamActive) {
      spamActive = true;
      doSpamShot();
      spamInterval = setInterval(doSpamShot, 65);
    } else if (!held && spamActive) {
      spamActive = false;
      clearInterval(spamInterval);
      spamInterval = null;
      fireMouseAt(currentMouseX, currentMouseY, "mouseup");
    }
  }
  function doSpamShot() {
    fireMouseAt(currentMouseX, currentMouseY, "mousedown");
    setTimeout(() => fireMouseAt(currentMouseX, currentMouseY, "mouseup"), 25);
    setTimeout(() => fireMouseAt(currentMouseX, currentMouseY, "click"), 30);
  }
  function fireMouseAt(x, y, type) {
    const opts = {
      bubbles: true,
      cancelable: true,
      view: window,
      clientX: x,
      clientY: y,
      button: 0,
      buttons: type === "mousedown" ? 1 : 0,
    };
    const el = document.elementFromPoint(x, y) || document.body;
    el.dispatchEvent(new MouseEvent(type, opts));
    document.dispatchEvent(new MouseEvent(type, opts));
  }

  // CLICK HELPERS
  function hardClick(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.focus();
    el.click();
    el.dispatchEvent(
      new MouseEvent("mousedown", {
        bubbles: true,
        cancelable: true,
        view: window,
      }),
    );
    el.dispatchEvent(
      new MouseEvent("mouseup", {
        bubbles: true,
        cancelable: true,
        view: window,
      }),
    );
    el.dispatchEvent(
      new MouseEvent("click", {
        bubbles: true,
        cancelable: true,
        view: window,
      }),
    );
    el.dispatchEvent(
      new PointerEvent("pointerdown", { bubbles: true, cancelable: true }),
    );
    el.dispatchEvent(
      new PointerEvent("pointerup", { bubbles: true, cancelable: true }),
    );
  }
  function clickGameEl(id) {
    const el = document.getElementById(id);
    if (el) forceClick(el);
  }
  function forceClick(el) {
    const r = el.getBoundingClientRect(),
      cx = r.left + r.width / 2,
      cy = r.top + r.height / 2;
    ["mousedown", "mouseup", "click"].forEach((t) =>
      el.dispatchEvent(
        new MouseEvent(t, {
          bubbles: true,
          cancelable: true,
          view: window,
          clientX: cx,
          clientY: cy,
        }),
      ),
    );
    el.click();
  }
  function forceRightClick(el) {
    const r = el.getBoundingClientRect(),
      cx = r.left + r.width / 2,
      cy = r.top + r.height / 2;
    const base = {
      bubbles: true,
      cancelable: true,
      view: window,
      clientX: cx,
      clientY: cy,
      button: 2,
      buttons: 2,
    };
    el.dispatchEvent(new MouseEvent("contextmenu", base));
    el.dispatchEvent(new MouseEvent("mousedown", base));
    el.dispatchEvent(new MouseEvent("mouseup", base));
    el.dispatchEvent(
      new PointerEvent("pointerdown", {
        bubbles: true,
        cancelable: true,
        pointerId: 1,
        clientX: cx,
        clientY: cy,
        button: 2,
        buttons: 2,
      }),
    );
    el.dispatchEvent(
      new PointerEvent("pointerup", {
        bubbles: true,
        cancelable: true,
        pointerId: 1,
        clientX: cx,
        clientY: cy,
        button: 2,
        buttons: 2,
      }),
    );
    try {
      const touch = new Touch({
        identifier: Date.now(),
        target: el,
        clientX: cx,
        clientY: cy,
      });
      el.dispatchEvent(
        new TouchEvent("touchstart", {
          bubbles: true,
          touches: [touch],
          changedTouches: [touch],
        }),
      );
      el.dispatchEvent(
        new TouchEvent("touchend", {
          bubbles: true,
          touches: [],
          changedTouches: [touch],
        }),
      );
    } catch (e) {}
    el.dispatchEvent(
      new MouseEvent("mousedown", {
        bubbles: true,
        cancelable: true,
        view: window,
        clientX: cx,
        clientY: cy,
        button: 0,
      }),
    );
    setTimeout(
      () =>
        el.dispatchEvent(
          new MouseEvent("mouseup", {
            bubbles: true,
            cancelable: true,
            view: window,
            clientX: cx,
            clientY: cy,
            button: 0,
          }),
        ),
      600,
    );
  }

  // KEY SIMULATION
  const _keyCodeMap = {
    w: 87, a: 65, s: 83, d: 68, e: 69, f: 70, h: 72, j: 74,
    m: 77, r: 82, q: 81, c: 67, t: 84, l: 76,
    1: 49, 2: 50, 3: 51, 4: 52, Escape: 27,
  };
  const _keyCodeStr = {
    w: "KeyW", a: "KeyA", s: "KeyS", d: "KeyD", e: "KeyE", f: "KeyF",
    h: "KeyH", j: "KeyJ", m: "KeyM", r: "KeyR", q: "KeyQ", c: "KeyC",
    t: "KeyT", l: "KeyL", 1: "Digit1", 2: "Digit2", 3: "Digit3", 4: "Digit4",
    Escape: "Escape",
  };

  function simulateKey(key, type) {
    const code = _keyCodeStr[key] || `Key${key.toUpperCase()}`;
    const keyCode = _keyCodeMap[key] || key.charCodeAt(0);
    const ev = new KeyboardEvent(type, {
      key, code, keyCode, which: keyCode,
      bubbles: true, cancelable: true, view: window,
    });
    window.dispatchEvent(ev);
    document.dispatchEvent(ev);
    const canvas = getCanvas();
    if (canvas) canvas.dispatchEvent(ev);
  }

  function setupAutoLoot() {
    function burst() {
      if (!settings.autoLoot || controllerIndex === null) return;
      if (dropMenuOpen) return; 
      if (Date.now() < autoLootPauseUntil) return; 
      const el = document.querySelector("#ui-interaction-outer");
      if (!el) return;
      for (let i = 0; i < 4; i++) {
        el.dispatchEvent(new TouchEvent("touchstart", { bubbles: true }));
        el.dispatchEvent(new TouchEvent("touchend", { bubbles: true }));
      }
    }
    function shouldPickup(t) {
      t = t.toLowerCase();
      // always-on items
      const alwaysPick = [
        "9mm",
        "7.62",
        "5.56",
        "12 gauge",
        ".50",
        "flare",
        "subsonic",
        "45 acp",
        "bandage",
        "med",
        "soda",
        "pill",
        "frag",
        "mirv",
        "smoke",
        "snowball",
        "potato",
        "strobe",
        "level",
        "military",
        "pack",
        "regular",
        "small",
        "mine",
        "scope",
        "2x",
        "4x",
        "8x",
        "15x",
      ].some((w) => t.includes(w));
      if (alwaysPick) return true;
      // auto open doors
            if (settings.autoOpenDoors && t.includes("open door")) return true;
      return false;
    }
    function watch() {
      const desc = document.querySelector("#ui-interaction-description");
      if (!desc) {
        setTimeout(watch, 500);
        return;
      }
      new MutationObserver(() => {
        if (shouldPickup(desc.textContent.trim())) burst();
      }).observe(desc, { childList: true, characterData: true, subtree: true });
    }
    watch();
  }

  // CONSUMABLE WHEEL
  const slotToId = {
    top: "ui-loot-healthkit",
    bottom: "ui-loot-bandage",
    left: "ui-loot-painkiller",
    right: "ui-loot-soda",
  };
  let wheelOpen = false,
    wheelSlot = null,
    wheelCX = 0,
    wheelCY = 0,
    wheelMX = 0,
    wheelMY = 0;

  window.addEventListener("mousemove", (e) => {
    wheelMX = e.clientX;
    wheelMY = e.clientY;
    if (wheelOpen) updateWheel();
  });
  window.addEventListener("keydown", (e) => {
    if (e.key.toLowerCase() === "h" && !wheelOpen && settings.consumableWheel) {
      const w = document.getElementById("ui-consumables");
      if (!w) return;
      wheelOpen = true;
      wheelCX = wheelMX;
      wheelCY = wheelMY;
      w.style.left = wheelCX + "px";
      w.style.top = wheelCY + "px";
      w.style.display = "block";
      updateWheel();
    }
  });
  window.addEventListener("keyup", (e) => {
    if (e.key.toLowerCase() === "h" && wheelOpen) {
      wheelOpen = false;
      const w = document.getElementById("ui-consumables");
      if (!w) return;
      if (wheelSlot && wheelSlot !== "middle") {
        const target = document.getElementById(slotToId[wheelSlot]);
        if (target) forceClick(target);
      }
      w.style.display = "none";
      w.querySelectorAll(".ui-emote-hl").forEach(
        (h) => (h.style.display = "none"),
      );
    }
  });
  function updateWheel() {
    const w = document.getElementById("ui-consumables");
    if (!w) return;
    const dx = wheelMX - wheelCX,
      dy = wheelMY - wheelCY;
    const dist = Math.hypot(dx, dy);
    const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
    wheelSlot =
      dist < 40
        ? "middle"
        : angle >= -45 && angle < 45
          ? "right"
          : angle >= 45 && angle < 135
            ? "bottom"
            : angle >= -135 && angle < -45
              ? "top"
              : "left";
    w.querySelectorAll(".ui-emote-parent").forEach((s) => {
      s.querySelector(".ui-emote-hl").style.display =
        s.dataset.key === wheelSlot ? "block" : "none";
    });
  }
  function setupConsumableWheel() {
    if (document.getElementById("ui-consumables")) return;
    const gameUI = document.getElementById("ui-game");
    if (!gameUI) return;
    gameUI.insertAdjacentHTML(
      "beforeend",
      `
      <div id="ui-consumables" class="ui-emote-wheel" style="display:none;position:fixed;z-index:10000;opacity:1;transform:translate(-50%,-50%);margin:0;">
        <div id="ui-cons-middle" class="ui-emote-middle ui-emote-circle ui-emote-parent" data-key="middle">
          <div class="ui-emote ui-emote-bg-circle"></div><div class="ui-emote ui-emote-hl" style="display:none;"></div>
          <div class="ui-emote-image ui-emote-image-large" style="background-image:url('img/gui/close.svg');"></div></div>
        <div id="ui-cons-top" class="ui-emote-top ui-emote-quarter ui-emote-parent" data-key="top">
          <div class="ui-emote ui-emote-bg-quarter"></div><div class="ui-emote ui-emote-hl" style="display:none;"></div>
          <div class="ui-emote-image ui-emote-image-large" style="background-image:url('https://survev.io/img/loot/loot-medical-healthkit.svg');"></div></div>
        <div id="ui-cons-right" class="ui-emote-right ui-emote-quarter ui-emote-parent" data-key="right">
          <div class="ui-emote ui-emote-bg-quarter"></div><div class="ui-emote ui-emote-hl" style="display:none;"></div>
          <div class="ui-emote-image ui-emote-image-large" style="background-image:url('https://survev.io/img/loot/loot-medical-soda.svg');"></div></div>
        <div id="ui-cons-bottom" class="ui-emote-bottom ui-emote-quarter ui-emote-parent" data-key="bottom">
          <div class="ui-emote ui-emote-bg-quarter"></div><div class="ui-emote ui-emote-hl" style="display:none;"></div>
          <div class="ui-emote-image ui-emote-image-large" style="background-image:url('https://survev.io/img/loot/loot-medical-bandage.svg');"></div></div>
        <div id="ui-cons-left" class="ui-emote-left ui-emote-quarter ui-emote-parent" data-key="left">
          <div class="ui-emote ui-emote-bg-quarter"></div><div class="ui-emote ui-emote-hl" style="display:none;"></div>
          <div class="ui-emote-image ui-emote-image-large" style="background-image:url('https://survev.io/img/loot/loot-medical-pill.svg');"></div></div>
      </div>`,
    );
  }

  // SETTINGS UI
  const ALL_BIND_DEFS = [
    { key: "btnInteract", label: "Interact", sub: "F" },
    { key: "btnThrowable", label: "Throwable", sub: "4" },
    { key: "btnMelee", label: "Melee / Reload", sub: "Tap melee · hold reload" },
    { key: "btnPickupOther", label: "Swap Weapon", sub: "J" },
    { key: "btnFire", label: "Fire", sub: "Hold to shoot" },
    { key: "btnR1", label: "R1 / RB", sub: "Q" },
    { key: "btnL1", label: "L1 / LB", sub: "C" },
    { key: "btnConsWheel", label: "Heal / Wheel", sub: "D-Pad down, hold" },
    { key: "btnDpadUp", label: "D-Pad Up", sub: "Med kit when wheel is off" },
    { key: "btnDpadLeft", label: "D-Pad Left", sub: "Scope cycle / soda" },
    { key: "btnDpadRight", label: "D-Pad Right", sub: "Scope cycle / pills" },
    { key: "btnMap", label: "Map", sub: "M" },
    { key: "btnMenu", label: "Menu / Esc", sub: "" },
    { key: "btnCircle", label: "Quit Confirm", sub: "After pressing Esc" },
    { key: "btnL3", label: "L3 Click", sub: "T" },
    { key: "btnR3", label: "R3 Click", sub: "Opens drop menu" },
  ];
  const MENU_BIND_DEFS = [
    { key: "playSolo", label: "Play Solo" },
    { key: "playDuo", label: "Play Duo" },
    { key: "playSquad", label: "Play Squad" },
  ];
  const CROSSHAIR_COLORS = [
    "#00ff88",
    "#ffffff",
    "#ff4444",
    "#ffff00",
    "#00aaff",
    "#ff00ff",
    "#ff8800",
  ];
  const NAV_ITEMS = [
    { id: "general", label: "General" },
    { id: "binds", label: "Binds" },
    { id: "gameplay", label: "Gameplay" },
    { id: "sensitivity", label: "Sensitivity" },
    { id: "crosshair", label: "Crosshair" },
  ];

  let saveTimer = null;
  function scheduleSave() {
    if (saveTimer) return;
    saveTimer = setTimeout(() => {
      saveTimer = null;
      saveSettings();
    }, 250);
  }

  function segControl(id, options, current) {
    return (
      `<div class="ctrl-seg" id="${id}">` +
      options
        .map(
          (o) =>
            `<button type="button" class="ctrl-seg-btn${o.value === current ? " active" : ""}" data-value="${o.value}">${o.label}</button>`,
        )
        .join("") +
      `</div>`
    );
  }

  function toggleRow(id, label, sub, checked) {
    return `<div class="ctrl-row">
      <div class="ctrl-row-text">
        <div class="ctrl-row-label">${label}</div>
        ${sub ? `<div class="ctrl-row-sub">${sub}</div>` : ""}
      </div>
      <label class="ctrl-switch"><input type="checkbox" id="toggle-${id}"${checked ? " checked" : ""}><span class="ctrl-switch-slider"></span></label>
    </div>`;
  }

  function sliderRow(id, label, sub, min, max, val, suffix) {
    const pct = max > min ? (((val - min) / (max - min)) * 100).toFixed(1) : "0";
    return `<div class="ctrl-row ctrl-slider-row">
      <div class="ctrl-slider-head">
        <div class="ctrl-row-text">
          <div class="ctrl-row-label">${label}</div>
          ${sub ? `<div class="ctrl-row-sub">${sub}</div>` : ""}
        </div>
        <div class="ctrl-slider-val" id="val-${id}">${val}${suffix}</div>
      </div>
      <input type="range" class="ctrl-slider" id="slider-${id}" min="${min}" max="${max}" value="${val}" style="--pct:${pct}%">
    </div>`;
  }

  function bindCell(category, def) {
    const val = settings[category][def.key];
    return `<div class="ctrl-bind-row">
      <div class="ctrl-bind-info">
        <div class="ctrl-row-label">${def.label}</div>
        ${def.sub ? `<div class="ctrl-row-sub">${def.sub}</div>` : ""}
      </div>
      <button type="button" class="ctrl-bind-btn" data-category="${category}" data-key="${def.key}">${btnName(val)}</button>
    </div>`;
  }

  function controlsRefRows() {
    const xb = activeIconType() === "xbox";
    const rows = [
      ["Move", "L-Stick"],
      ["Aim", "R-Stick"],
      ["Fire", xb ? "RT" : "R2"],
      ["Swap Weapon", xb ? "LT" : "L2"],
      ["Interact", confirmSymbols().confirm],
      ["Throwable", xb ? "Y" : "△"],
      ["Melee / Reload", xb ? "X" : "□"],
      [xb ? "RB" : "R1", "Q"],
      [xb ? "LB" : "L1", "C"],
      ["Heal / Wheel", "D-↓"],
      ["Scope Cycle", "D-←"],
      ["T Key", "L3"],
      ["Drop Menu", "R3"],
      ["Map", xb ? "View" : "Share"],
      ["Menu", xb ? "Menu" : "Options"],
    ];
    return rows
      .map(
        ([label, key]) =>
          `<div class="ctrl-ref-item"><span class="ctrl-key-chip">${key}</span><span>${label}</span></div>`,
      )
      .join("");
  }

  function crosshairSvg(c) {
    const col = c.color;
    const sw = c.strokeWidth || 0;
    const sc = c.strokeColor || "#000000";
    const alpha = (c.opacity / 100).toFixed(2);
    if (c.style === "dot") {
      const total = c.size + sw * 2;
      return `<svg width="${total}" height="${total}" style="opacity:${alpha};display:block;">
        ${sw > 0 ? `<circle cx="${total / 2}" cy="${total / 2}" r="${c.size / 2 + sw}" fill="${sc}"/>` : ""}
        <circle cx="${total / 2}" cy="${total / 2}" r="${c.size / 2}" fill="${col}"/></svg>`;
    }
    if (c.style === "circle") {
      const r = c.size;
      const dim = (r + c.thickness + sw) * 2 + 2;
      const cx = dim / 2;
      return `<svg width="${dim}" height="${dim}" style="opacity:${alpha};display:block;">
        ${sw > 0 ? `<circle cx="${cx}" cy="${cx}" r="${r}" stroke="${sc}" stroke-width="${c.thickness + sw * 2}" fill="none"/>` : ""}
        <circle cx="${cx}" cy="${cx}" r="${r}" stroke="${col}" stroke-width="${c.thickness}" fill="none"/></svg>`;
    }
    const g = c.gap,
      s = c.size,
      t = c.thickness;
    const w = (s + g) * 2 + t + sw * 2;
    const cx = w / 2,
      cy = w / 2;
    const line = (x1, y1, x2, y2) =>
      (sw > 0
        ? `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${sc}" stroke-width="${t + sw * 2}" stroke-linecap="round"/>`
        : "") +
      `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${col}" stroke-width="${t}" stroke-linecap="round"/>`;
    const lines =
      line(cx, sw, cx, cy - g) +
      line(cx, cy + g, cx, w - sw) +
      line(sw, cy, cx - g, cy) +
      line(cx + g, cy, w - sw, cy);
    const dot =
      c.style === "crossdot"
        ? (sw > 0
            ? `<circle cx="${cx}" cy="${cy}" r="${t + sw}" fill="${sc}"/>`
            : "") + `<circle cx="${cx}" cy="${cy}" r="${t}" fill="${col}"/>`
        : "";
    return `<svg width="${w}" height="${w}" style="opacity:${alpha};display:block;">${lines}${dot}</svg>`;
  }

  function buildGeneralPanel() {
    const t = activeIconType();
    const swapLabel = t === "xbox" ? "Swap A / B" : "Swap ✕ / ○";
    const gpId =
      controllerIndex !== null
        ? (navigator.getGamepads()[controllerIndex]?.id?.slice(0, 46) ||
            "Connected") + ` [${controllerType.toUpperCase()}]`
        : "No controller detected";
    return `<div class="ctrl-panel active" id="ctrl-panel-general">
      <div id="ctrl-status-card">
        <div id="ctrl-status-indicator" class="${controllerIndex !== null ? "on" : "off"}"></div>
        <div id="ctrl-status-text">${gpId}</div>
      </div>
      ${toggleRow("enabled", "Controller Support", "Master toggle — turns everything on or off", settings.enabled)}
      <div class="ctrl-section">Controller</div>
      <div class="ctrl-row ctrl-row-stack">
        <div class="ctrl-row-text">
          <div class="ctrl-row-label">Button Icons</div>
          <div class="ctrl-row-sub">Symbols used across menus, badges and hints. Auto follows your controller.</div>
        </div>
        ${segControl(
          "ctrl-iconset-seg",
          [
            { value: "auto", label: "Auto" },
            { value: "xbox", label: "Xbox" },
            { value: "ps", label: "PlayStation" },
          ],
          settings.iconSet || "auto",
        )}
      </div>
      ${toggleRow(
        "swapXB",
        `<span id="ctrl-swap-label">${swapLabel}</span><span class="ctrl-chip${settings.swapXB ? "" : " off"}" id="ctrl-swap-chip">${settings.swapXB ? "ON" : "OFF"}</span>`,
        "Swaps the interact and quit-confirm buttons.",
        settings.swapXB,
      )}
      <div class="ctrl-section">Input</div>
      ${toggleRow("blockKeyboard", "Block Keyboard", "Ignores keyboard input while a controller is connected", settings.blockKeyboard)}
      ${toggleRow("hideCursor", "Hide Cursor In-Game", "Hides the mouse cursor during a match", settings.hideCursor)}
      ${sliderRow("guiScale", "Menu Scale", "Size of this settings window", 50, 150, settings.guiScale, "%")}
      <div class="ctrl-section">Compatibility</div>
      ${toggleRow("forceDesktop", "Force Desktop Layout", "Spoofs desktop mode for handhelds and mobile. Reload the page after toggling.", settings.forceDesktop)}
      ${toggleRow("simpleUI", "Simple UI", "Strips shadows, blur and animations for low-end devices", settings.simpleUI)}
      <div class="ctrl-section">Controls</div>
      <div id="ctrl-controls-ref" class="ctrl-ref-grid">${controlsRefRows()}</div>
      <div class="ctrl-section">Reset</div>
      <div class="ctrl-reset-row">
        <button type="button" class="ctrl-ghost-btn" id="ctrl-reset-binds-btn">Reset Binds</button>
        <button type="button" class="ctrl-ghost-btn danger" id="ctrl-reset-btn">Reset Everything</button>
      </div>
    </div>`;
  }

  function buildBindsPanel() {
    const gameRows = ALL_BIND_DEFS.map((d) => bindCell("binds", d)).join("");
    const menuRows = MENU_BIND_DEFS.map((d) => bindCell("menuBinds", d)).join(
      "",
    );
    return `<div class="ctrl-panel" id="ctrl-panel-binds">
      <div class="ctrl-hint-bar">Click an action, then press the controller button you want. Duplicates get flagged in red.</div>
      <div class="ctrl-conflict-banner" id="ctrl-conflict-banner" style="display:none">Two actions share the same button — highlighted rows need fixing.</div>
      <div class="ctrl-section">In-Game</div>
      <div class="ctrl-bind-grid">${gameRows}</div>
      <div class="ctrl-section">Main Menu</div>
      <div class="ctrl-bind-grid">${menuRows}</div>
      <div class="ctrl-footnote">Menu binds only work on the main menu.</div>
    </div>`;
  }

  function buildGameplayPanel() {
    const { confirm, close } = confirmSymbols();
    return `<div class="ctrl-panel" id="ctrl-panel-gameplay">
      <div class="ctrl-section">Automation</div>
      ${toggleRow("autoLoot", "Auto Loot", "Picks up ammo, heals, throwables and scopes on contact", settings.autoLoot)}
      ${toggleRow("autoOpenDoors", "Auto Open Doors", "Opens doors automatically when you walk into them", settings.autoOpenDoors)}
      ${toggleRow(
        "consumableWheel",
        `<span id="ctrl-wheel-label">Consumable Wheel</span><span class="ctrl-chip${settings.consumableWheel ? "" : " off"}" id="ctrl-wheel-chip">${settings.consumableWheel ? "ON" : "OFF"}</span>`,
        "Hold D-Pad down for a radial heal menu",
        settings.consumableWheel,
      )}
      <div class="ctrl-warn-note" id="ctrl-wheel-warn" style="display:${settings.consumableWheel ? "none" : "block"}">Wheel is off — D-Pad heals directly: down bandage, up med kit, left soda, right pills.</div>
      <div class="ctrl-section">Combat</div>
      ${toggleRow("spamFire", "Spam Fire", "Rapid taps instead of hold — for pistols and semi-auto weapons", settings.spamFire)}
      ${toggleRow(
        "reloadHold",
        `<span id="ctrl-reload-label">Hold to Reload</span><span class="ctrl-chip${settings.reloadHold.enabled ? "" : " off"}" id="ctrl-reload-chip">${settings.reloadHold.enabled ? "ON" : "OFF"}</span>`,
        "Hold melee past the threshold to reload, tap to melee",
        settings.reloadHold.enabled,
      )}
      <div id="ctrl-reload-slider" style="display:${settings.reloadHold.enabled ? "block" : "none"}">
        ${sliderRow("reloadHoldMs", "Reload Threshold", "How long the hold lasts before reloading", 100, 1000, settings.reloadHold.holdMs, "ms")}
      </div>
      <div class="ctrl-section">Aiming</div>
      ${toggleRow("aimWithLeft", "Aim with Left Stick", "Left stick also aims while the right stick is idle", settings.aimWithLeft)}
      ${toggleRow("aimLine", "Aim Line", "Dashed line from screen center to the crosshair", settings.aimLine)}
      <div class="ctrl-section">Drop Menu</div>
      <div class="ctrl-hint-bar" id="ctrl-dropmenu-info">Press <b>R3</b> in-game to open. <span class="ctrl-key-chip">↑</span><span class="ctrl-key-chip">↓</span> navigate, <span class="ctrl-key-chip">${confirm}</span> drops, <span class="ctrl-key-chip">${close}</span> closes. Auto-loot pauses briefly after closing.</div>
    </div>`;
  }

  function buildSensitivityPanel() {
    return `<div class="ctrl-panel" id="ctrl-panel-sensitivity">
      <div class="ctrl-section">Aiming</div>
      ${sliderRow("aimSensitivity", "Aim Sensitivity", "Distance of the aim circle from screen center", 1, 150, settings.aimSensitivity, "")}
      ${sliderRow("aimSmoothing", "Aim Smoothing", "Stick response curve", 1, 10, settings.aimSmoothing, "")}
      ${toggleRow("analogInterp", "Analog Interpolation", "Smooths out aim that snaps to the 4 cardinal directions on cheaper controllers", settings.analogInterp)}
      <div id="ctrl-interp-slider" style="display:${settings.analogInterp ? "block" : "none"}">
        ${sliderRow("analogInterpStrength", "Interpolation Strength", "How strongly aim is eased away from the axes", 1, 10, settings.analogInterpStrength, "")}
      </div>
      <div class="ctrl-section">Free Cursor</div>
      ${sliderRow("freeLookSpeed", "Cursor Speed", "Cursor speed in menus, map and pause screen", 1, 10, settings.freeLookSpeed, "")}
      <div class="ctrl-section">Deadzones</div>
      ${sliderRow("leftDeadzone", "Left Stick", "Movement stick deadzone", 1, 50, settings.leftDeadzone, "%")}
      ${sliderRow("rightDeadzone", "Right Stick", "Aim stick deadzone", 1, 50, settings.rightDeadzone, "%")}
    </div>`;
  }

  function buildCrosshairPanel() {
    const c = settings.crosshair;
    const swatches = CROSSHAIR_COLORS.map(
      (col) =>
        `<button type="button" class="ctrl-swatch${c.color === col ? " active" : ""}" data-color="${col}" style="background:${col}"></button>`,
    ).join("");
    return `<div class="ctrl-panel" id="ctrl-panel-crosshair">
      <div class="ctrl-section">Style</div>
      ${segControl(
        "ctrl-style-seg",
        [
          { value: "cross", label: "Cross" },
          { value: "dot", label: "Dot" },
          { value: "circle", label: "Circle" },
          { value: "crossdot", label: "Cross + Dot" },
        ],
        c.style,
      )}
      <div class="ctrl-section">Color</div>
      <div class="ctrl-swatch-row">
        ${swatches}
        <input type="color" id="crosshair-color-picker" class="ctrl-color-input" value="${c.color}" title="Custom color">
      </div>
      <div class="ctrl-section">Outline</div>
      <div class="ctrl-row">
        <div class="ctrl-row-text">
          <div class="ctrl-row-label">Stroke Color</div>
          <div class="ctrl-row-sub">Outline drawn around the crosshair</div>
        </div>
        <input type="color" id="crosshair-stroke-picker" class="ctrl-color-input" value="${c.strokeColor || "#000000"}">
      </div>
      ${sliderRow("chStrokeWidth", "Stroke Width", "0 = no outline", 0, 5, c.strokeWidth || 0, "")}
      <div class="ctrl-section">Shape</div>
      ${sliderRow("chSize", "Size", "Arm length or dot radius", 4, 30, c.size, "")}
      ${sliderRow("chThickness", "Thickness", "Line width", 1, 6, c.thickness, "")}
      ${sliderRow("chGap", "Center Gap", "", 0, 16, c.gap, "")}
      ${sliderRow("chOpacity", "Opacity", "", 10, 100, c.opacity, "%")}
      <div class="ctrl-section">Preview</div>
      <div id="crosshair-preview-box"></div>
    </div>`;
  }

  function buildSettingsUI() {
    document.getElementById("ctrl-settings-overlay")?.remove();
    const overlay = document.createElement("div");
    overlay.id = "ctrl-settings-overlay";
    overlay.innerHTML = `
      <div id="ctrl-settings-modal" role="dialog">
        <div id="ctrl-settings-header">
          <div class="ctrl-header-title">Controller Settings</div>
          <button type="button" id="ctrl-close-btn" title="Close (F9)">✕</button>
        </div>
        <div id="ctrl-body">
          <nav id="ctrl-nav">${NAV_ITEMS.map(
            (n, i) =>
              `<button type="button" class="ctrl-nav-item${i === 0 ? " active" : ""}" data-tab="${n.id}">${n.label}</button>`,
          ).join("")}</nav>
          <div id="ctrl-content">
            ${buildGeneralPanel()}
            ${buildBindsPanel()}
            ${buildGameplayPanel()}
            ${buildSensitivityPanel()}
            ${buildCrosshairPanel()}
          </div>
        </div>
        <div id="ctrl-settings-footer">
          <span class="ctrl-save-hint">Changes save automatically</span>
          <button type="button" class="ctrl-primary-btn" id="ctrl-done-btn">Done</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    setupSettingsEvents(overlay);
    applyCrosshairStyle();
    applyGuiScale();
  }

  function setupSettingsEvents(overlay) {
    overlay
      .querySelector("#ctrl-close-btn")
      .addEventListener("click", closeSettings);
    overlay
      .querySelector("#ctrl-done-btn")
      .addEventListener("click", closeSettings);
    overlay.addEventListener("mousedown", (e) => {
      if (e.target === overlay) closeSettings();
    });

    overlay.querySelectorAll(".ctrl-nav-item").forEach((tab) => {
      tab.addEventListener("click", () => {
        overlay
          .querySelectorAll(".ctrl-nav-item")
          .forEach((t) => t.classList.remove("active"));
        overlay
          .querySelectorAll(".ctrl-panel")
          .forEach((p) => p.classList.remove("active"));
        tab.classList.add("active");
        overlay
          .querySelector("#ctrl-panel-" + tab.dataset.tab)
          ?.classList.add("active");
      });
    });

    overlay.querySelectorAll(".ctrl-switch input").forEach((input) => {
      input.addEventListener("change", () => {
        const id = input.id.replace("toggle-", "");
        applyToggle(id, input.checked, overlay);
        scheduleSave();
      });
    });

    bindSlider(overlay, "guiScale", (v) => {
      settings.guiScale = v;
      applyGuiScale();
    }, "%");
    bindSlider(overlay, "aimSensitivity", (v) => {
      settings.aimSensitivity = v;
    });
    bindSlider(overlay, "aimSmoothing", (v) => {
      settings.aimSmoothing = v;
    });
    bindSlider(overlay, "analogInterpStrength", (v) => {
      settings.analogInterpStrength = v;
    });
    bindSlider(overlay, "freeLookSpeed", (v) => {
      settings.freeLookSpeed = v;
    });
    bindSlider(overlay, "leftDeadzone", (v) => {
      settings.leftDeadzone = v;
    }, "%");
    bindSlider(overlay, "rightDeadzone", (v) => {
      settings.rightDeadzone = v;
    }, "%");
    bindSlider(overlay, "reloadHoldMs", (v) => {
      settings.reloadHold.holdMs = v;
    }, "ms");
    bindSlider(overlay, "chSize", (v) => {
      settings.crosshair.size = v;
      refreshCrosshair(overlay);
    });
    bindSlider(overlay, "chThickness", (v) => {
      settings.crosshair.thickness = v;
      refreshCrosshair(overlay);
    });
    bindSlider(overlay, "chGap", (v) => {
      settings.crosshair.gap = v;
      refreshCrosshair(overlay);
    });
    bindSlider(overlay, "chOpacity", (v) => {
      settings.crosshair.opacity = v;
      refreshCrosshair(overlay);
    }, "%");
    bindSlider(overlay, "chStrokeWidth", (v) => {
      settings.crosshair.strokeWidth = v;
      refreshCrosshair(overlay);
    });

    overlay.querySelectorAll("#ctrl-iconset-seg .ctrl-seg-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (settings.iconSet === btn.dataset.value) return;
        settings.iconSet = btn.dataset.value;
        overlay
          .querySelectorAll("#ctrl-iconset-seg .ctrl-seg-btn")
          .forEach((b) => b.classList.toggle("active", b === btn));
        refreshIconSet(overlay);
        scheduleSave();
      });
    });

    overlay.querySelectorAll("#ctrl-style-seg .ctrl-seg-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        settings.crosshair.style = btn.dataset.value;
        overlay
          .querySelectorAll("#ctrl-style-seg .ctrl-seg-btn")
          .forEach((b) => b.classList.toggle("active", b === btn));
        refreshCrosshair(overlay);
        scheduleSave();
      });
    });

    overlay.querySelectorAll(".ctrl-swatch").forEach((sw) => {
      sw.addEventListener("click", () => {
        settings.crosshair.color = sw.dataset.color;
        overlay
          .querySelectorAll(".ctrl-swatch")
          .forEach((s) => s.classList.toggle("active", s === sw));
        const picker = overlay.querySelector("#crosshair-color-picker");
        if (picker) picker.value = sw.dataset.color;
        refreshCrosshair(overlay);
        scheduleSave();
      });
    });

    overlay
      .querySelector("#crosshair-color-picker")
      ?.addEventListener("input", (e) => {
        settings.crosshair.color = e.target.value;
        overlay
          .querySelectorAll(".ctrl-swatch")
          .forEach((s) => s.classList.remove("active"));
        refreshCrosshair(overlay);
        scheduleSave();
      });
    overlay
      .querySelector("#crosshair-stroke-picker")
      ?.addEventListener("input", (e) => {
        settings.crosshair.strokeColor = e.target.value;
        refreshCrosshair(overlay);
        scheduleSave();
      });

    overlay
      .querySelector("#ctrl-reset-binds-btn")
      .addEventListener("click", () => {
        if (!confirm("Reset all keybinds to defaults?")) return;
        settings.binds = JSON.parse(JSON.stringify(DEFAULT_SETTINGS.binds));
        settings.menuBinds = JSON.parse(
          JSON.stringify(DEFAULT_SETTINGS.menuBinds),
        );
        saveSettings();
        buildSettingsUI();
        openSettings();
      });
    overlay.querySelector("#ctrl-reset-btn").addEventListener("click", () => {
      if (!confirm("Reset ALL settings to defaults?")) return;
      settings = JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
      saveSettings();
      buildSettingsUI();
      openSettings();
    });

    attachBindListeners(overlay);
    updateConflicts();
    updateCrosshairPreview(overlay);
  }

  function applyToggle(id, on, overlay) {
    switch (id) {
      case "enabled":
        settings.enabled = on;
        break;
      case "autoLoot":
        settings.autoLoot = on;
        break;
      case "autoOpenDoors":
        settings.autoOpenDoors = on;
        break;
      case "consumableWheel": {
        settings.consumableWheel = on;
        setChip(overlay, "#ctrl-wheel-chip", on);
        const warn = overlay.querySelector("#ctrl-wheel-warn");
        if (warn) warn.style.display = on ? "none" : "block";
        break;
      }
      case "spamFire":
        settings.spamFire = on;
        break;
      case "reloadHold": {
        settings.reloadHold.enabled = on;
        setChip(overlay, "#ctrl-reload-chip", on);
        const wrap = overlay.querySelector("#ctrl-reload-slider");
        if (wrap) wrap.style.display = on ? "block" : "none";
        break;
      }
      case "aimWithLeft":
        settings.aimWithLeft = on;
        break;
      case "analogInterp": {
        settings.analogInterp = on;
        const wrap = overlay.querySelector("#ctrl-interp-slider");
        if (wrap) wrap.style.display = on ? "block" : "none";
        break;
      }
      case "aimLine":
        settings.aimLine = on;
        if (!on && aimLineEl) aimLineEl.style.display = "none";
        break;
      case "swapXB":
        settings.swapXB = on;
        setChip(overlay, "#ctrl-swap-chip", on);
        refreshIconSet(overlay);
        break;
      case "blockKeyboard":
        settings.blockKeyboard = on;
        break;
      case "hideCursor":
        settings.hideCursor = on;
        updateCursorHide();
        break;
      case "forceDesktop":
        settings.forceDesktop = on;
        syncForceDesktop();
        break;
      case "simpleUI":
        settings.simpleUI = on;
        applySimpleUI();
        break;
    }
  }

  function setChip(overlay, sel, on) {
    const chip = overlay.querySelector(sel);
    if (!chip) return;
    chip.textContent = on ? "ON" : "OFF";
    chip.classList.toggle("off", !on);
  }

  function bindSlider(overlay, id, apply, suffix = "") {
    const sl = overlay.querySelector("#slider-" + id);
    const vl = overlay.querySelector("#val-" + id);
    if (!sl) return;
    const min = Number(sl.min),
      max = Number(sl.max);
    sl.addEventListener("input", () => {
      const v = Number(sl.value);
      apply(v);
      if (vl) vl.textContent = v + suffix;
      sl.style.setProperty(
        "--pct",
        (((v - min) / (max - min)) * 100).toFixed(1) + "%",
      );
      scheduleSave();
    });
  }

  function refreshCrosshair(overlay) {
    rebuildCrosshair();
    updateCrosshairPreview(overlay);
  }

  function refreshIconSet(overlay) {
    const t = activeIconType();
    const swapLabel = overlay.querySelector("#ctrl-swap-label");
    if (swapLabel)
      swapLabel.textContent = t === "xbox" ? "Swap A / B" : "Swap ✕ / ○";
    const ref = overlay.querySelector("#ctrl-controls-ref");
    if (ref) ref.innerHTML = controlsRefRows();
    const dropInfo = overlay.querySelector("#ctrl-dropmenu-info");
    if (dropInfo) {
      const { confirm, close } = confirmSymbols();
      dropInfo.innerHTML = `Press <b>R3</b> in-game to open. <span class="ctrl-key-chip">↑</span><span class="ctrl-key-chip">↓</span> navigate, <span class="ctrl-key-chip">${confirm}</span> drops, <span class="ctrl-key-chip">${close}</span> closes. Auto-loot pauses briefly after closing.`;
    }
    overlay.querySelectorAll(".ctrl-bind-btn[data-key]").forEach((btn) => {
      if (listeningFor && listeningFor.btn === btn) return;
      const val = settings[btn.dataset.category]?.[btn.dataset.key];
      if (val !== undefined) btn.textContent = btnName(val);
    });
    updateMenuBadges();
  }

  function attachBindListeners(overlay) {
    overlay.querySelectorAll(".ctrl-bind-btn[data-key]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        if (listeningFor) {
          const same = listeningFor.btn === btn;
          cancelListening();
          if (same) return;
        }
        listeningFor = {
          category: btn.dataset.category,
          key: btn.dataset.key,
          btn,
        };
        btn.classList.add("listening");
        btn.textContent = "Press…";
      });
    });
  }

  function cancelListening() {
    if (!listeningFor) return;
    listeningFor.btn.classList.remove("listening");
    const val = settings[listeningFor.category]?.[listeningFor.key];
    if (val !== undefined) listeningFor.btn.textContent = btnName(val);
    listeningFor = null;
  }

  function finishListening(buttonIdx) {
    if (!listeningFor) return;
    const { category, key, btn } = listeningFor;
    settings[category][key] = buttonIdx;
    btn.classList.remove("listening");
    btn.textContent = btnName(buttonIdx);
    listeningFor = null;
    if (category === "menuBinds") updateMenuBadges();
    updateConflicts();
    scheduleSave();
  }

  function updateConflicts() {
    const overlay = document.getElementById("ctrl-settings-overlay");
    if (!overlay) return;
    const panel = overlay.querySelector("#ctrl-panel-binds");
    if (!panel) return;
    const btns = panel.querySelectorAll(".ctrl-bind-btn[data-key]");
    const counts = {};
    btns.forEach((btn) => {
      const val = settings[btn.dataset.category]?.[btn.dataset.key];
      if (val === undefined || val === null) return;
      const id = btn.dataset.category + ":" + val;
      counts[id] = (counts[id] || 0) + 1;
    });
    let hasConflict = false;
    btns.forEach((btn) => {
      const val = settings[btn.dataset.category]?.[btn.dataset.key];
      const bad =
        val !== undefined &&
        val !== null &&
        counts[btn.dataset.category + ":" + val] > 1;
      if (bad) hasConflict = true;
      btn.classList.toggle("conflict", bad);
      btn.closest(".ctrl-bind-row")?.classList.toggle("conflict-row", bad);
    });
    const banner = panel.querySelector("#ctrl-conflict-banner");
    if (banner) banner.style.display = hasConflict ? "block" : "none";
  }

  function updateCrosshairPreview(overlay) {
    const box = overlay.querySelector("#crosshair-preview-box");
    if (!box) return;
    box.innerHTML = crosshairSvg(settings.crosshair);
  }

  function applyGuiScale() {
    const modal = document.getElementById("ctrl-settings-modal");
    if (!modal) return;
    const s = Math.max(0.5, Math.min(1.5, (settings.guiScale || 100) / 100));
    modal.style.transform = s === 1 ? "" : `scale(${s})`;
    modal.style.animation = s === 1 ? "" : "none";
  }

  function openSettings() {
    settingsOpen = true;
    document.getElementById("ctrl-settings-overlay")?.classList.add("open");
    applyGuiScale();
  }

  function closeSettings() {
    settingsOpen = false;
    cancelListening();
    saveSettings();
    document.getElementById("ctrl-settings-overlay")?.classList.remove("open");
  }
  // UI injections
  function injectControllerButton() {
    if (document.querySelector(".controller-settings-btn")) return;
    const target = document.getElementById("start-bottom-right");
    if (!target) return;
    const btn = document.createElement("div");
    btn.className =
      "btn-settings menu-option btn-darken btn-start-option controller-settings-btn";
    btn.title = "Controller Settings (F9)";
    btn.style.backgroundImage = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23d4e88a' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='2' y='6' width='20' height='12' rx='4'/%3E%3Ccircle cx='8.5' cy='12' r='1.5'/%3E%3Cpath d='M15 10v4M13 12h4'/%3E%3C/svg%3E")`;
    const dot = document.createElement("div");
    dot.className = "ctrl-connected-dot";
    dot.style.display = controllerIndex !== null ? "block" : "none";
    btn.appendChild(dot);
    btn.addEventListener("click", () => {
      buildSettingsUI();
      openSettings();
    });
    target.appendChild(btn);
  }

  function updateMenuBadges() {
    document.querySelectorAll(".ctrl-btn-badge").forEach((b) => b.remove());
    injectMenuBadges();
  }
  function injectMenuBadges() {
    const defs = getBadgeDefs();
    defs.forEach(({ id, badgeClass, symbol }) => {
      const el = document.getElementById(id);
      if (!el || el.querySelector(".ctrl-btn-badge")) return;
      const badge = document.createElement("span");
      badge.className = `ctrl-btn-badge ${badgeClass}`;
      badge.textContent = symbol;
      el.appendChild(badge);
    });
  }

  // mut obv
  new MutationObserver(() => {
    injectControllerButton();
    injectMenuBadges();
    if (
      document.getElementById("ui-game") &&
      !document.getElementById("ui-consumables")
    )
      setupConsumableWheel();
    updateCursorHide();
    removeKofi(); // hi devs
  }).observe(document.body, { childList: true, subtree: true });

  //Init 
  setupMenuKeyListeners();
  injectControllerButton();
  injectMenuBadges();
  setupAutoLoot();
  ensureCrosshair();
  applyCrosshairStyle();
  ensureAimLine();
  applySimpleUI();
  removeKofi();

  // controller already connected before the page loaded
  Array.from(navigator.getGamepads()).forEach((gp) => {
    if (gp && controllerIndex === null) {
      controllerIndex = gp.index;
      prevButtons = [];
      controllerType = getControllerType(gp.id);
      updateConnectedDot(true);
      updateMenuBadges();
      updateCursorHide();
      if (!animFrameId) startLoop();
    }
  });

  // F9 opens settings 
  document.addEventListener("keydown", (e) => {
    if (e.key === "F9") {
      buildSettingsUI();
      openSettings();
    }
  });

  // auto-inject keybind code on load
  (() => {
    if (window.__survevKeybindLoaded) return;
    window.__survevKeybindLoaded = true;
    const KEYBIND_CODE =
      "AQVF1FVTAiQVVkYAAABAMck0Ew0AACxwAAAp9RRUN+GUE0xFUdWUVVEAAJBWQ7b+";
    function injectKeybind() {
      const input = document.getElementById("keybind-code-input");
      const button = document.getElementById("btn-keybind-code-load");
      if (!input || !button) return;
      input.value = KEYBIND_CODE;
      input.dispatchEvent(new Event("input", { bubbles: true }));
      button.click();
    }
    if (document.readyState === "loading")
      document.addEventListener("DOMContentLoaded", injectKeybind, {
        once: true,
      });
    else injectKeybind();
  })();
})();
