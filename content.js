// survev controller extension - content.js
// if u break something its not my fault

(function () {
  "use strict";

  // ---------- controller type stuff ----------
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

  const PS_BUTTON_NAMES = {
    0: "✕ Cross",
    1: "○ Circle",
    2: "□ Square",
    3: "△ Triangle",
    4: "L1",
    5: "R1",
    6: "L2 (Trigger)",
    7: "R2 (Trigger)",
    8: "Share",
    9: "Options",
    10: "L3 (Click)",
    11: "R3 (Click)",
    12: "↑ D-Pad",
    13: "↓ D-Pad",
    14: "← D-Pad",
    15: "→ D-Pad",
    16: "PS Button",
  };
  const XBOX_BUTTON_NAMES = {
    0: "A",
    1: "B",
    2: "X",
    3: "Y",
    4: "LB",
    5: "RB",
    6: "LT (Trigger)",
    7: "RT (Trigger)",
    8: "View",
    9: "Menu",
    10: "LS (Click)",
    11: "RS (Click)",
    12: "↑ D-Pad",
    13: "↓ D-Pad",
    14: "← D-Pad",
    15: "→ D-Pad",
    16: "Xbox Button",
  };

  function btnName(idx) {
    const names =
      controllerType === "xbox" ? XBOX_BUTTON_NAMES : PS_BUTTON_NAMES;
    return names[idx] !== undefined ? names[idx] : "Btn " + idx;
  }

  // badge defs - these update dynamically based on swapXB setting
  function getPS_BADGE_DEFS() {
    if (settings && settings.swapXB) {
      return [
        { id: "btn-start-mode-0", badgeClass: "ctrl-badge-x", symbol: "○" },
        {
          id: "btn-start-mode-1",
          badgeClass: "ctrl-badge-triangle",
          symbol: "△",
        },
        {
          id: "btn-start-mode-2",
          badgeClass: "ctrl-badge-circle",
          symbol: "✕",
        },
      ];
    }
    return [
      { id: "btn-start-mode-0", badgeClass: "ctrl-badge-x", symbol: "✕" },
      {
        id: "btn-start-mode-1",
        badgeClass: "ctrl-badge-triangle",
        symbol: "△",
      },
      { id: "btn-start-mode-2", badgeClass: "ctrl-badge-circle", symbol: "○" },
    ];
  }
  function getXBOX_BADGE_DEFS() {
    if (settings && settings.swapXB) {
      return [
        {
          id: "btn-start-mode-0",
          badgeClass: "ctrl-badge-xbox-a",
          symbol: "B",
        },
        {
          id: "btn-start-mode-1",
          badgeClass: "ctrl-badge-xbox-y",
          symbol: "Y",
        },
        {
          id: "btn-start-mode-2",
          badgeClass: "ctrl-badge-xbox-b",
          symbol: "A",
        },
      ];
    }
    return [
      { id: "btn-start-mode-0", badgeClass: "ctrl-badge-xbox-a", symbol: "A" },
      { id: "btn-start-mode-1", badgeClass: "ctrl-badge-xbox-y", symbol: "Y" },
      { id: "btn-start-mode-2", badgeClass: "ctrl-badge-xbox-b", symbol: "B" },
    ];
  }

  // ---------- default settings ----------
  const DEFAULT_SETTINGS = {
    enabled: true,
    autoLoot: true,
    consumableWheel: true,
    spamFire: false,
    blockKeyboard: true,
    hideCursor: true,
    swapXB: false, // X/B (or Cross/Circle) button swap
    forceDesktop: false, // Force desktop layout
    aimSensitivity: 50,
    aimSmoothing: 5,
    leftDeadzone: 15,
    rightDeadzone: 12,
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
      btnInteract: 0, // cross/A  -> F
      btnThrowable: 3, // triangle/Y -> 4
      btnMelee: 2, // square/X -> E  (also hold = reload)
      btnPickupOther: 6, // L2/LT -> J
      btnFire: 7, // R2/RT -> hold click
      btnR1: 5, // R1/RB -> Q
      btnL1: 4, // L1/LB -> C
      btnConsWheel: 13, // dpad down -> H / direct heal
      btnDpadUp: 12, // dpad up
      btnDpadLeft: 14, // dpad left -> scope cycle / soda
      btnDpadRight: 15, // dpad right
      btnMap: 8, // share/view -> M
      btnMenu: 9, // options/start -> Esc
      btnCircle: 1, // circle/B -> quit confirm
      btnL3: 10, // L3 -> T key
      btnR3: 11, // R3 -> drop menu
    },
    menuBinds: {
      playSolo: 0, // cross/A
      playDuo: 3, // triangle/Y
      playSquad: 1, // circle/B
    },
  };

  // ---------- state ----------
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
  const DROP_ITEMS = [
    { id: "ui-scope-1xscope", label: "1x Scope" },
    { id: "ui-scope-2xscope", label: "2x Scope" },
    { id: "ui-scope-4xscope", label: "4x Scope" },
    { id: "ui-scope-8xscope", label: "8x Scope" },
    { id: "ui-scope-15xscope", label: "15x Scope" },
    { id: "ui-loot-bandage", label: "Bandage" },
    { id: "ui-loot-healthkit", label: "Med Kit" },
    { id: "ui-loot-soda", label: "Soda" },
    { id: "ui-loot-painkiller", label: "Painkillers" },
    { id: "ui-loot-9mm", label: "9mm" },
    { id: "ui-loot-762mm", label: "7.62mm" },
    { id: "ui-loot-556mm", label: "5.56mm" },
    { id: "ui-loot-12gauge", label: "12 Gauge" },
    { id: "ui-loot-50ae", label: ".50 AE" },
    { id: "ui-loot-308sub", label: ".308 Sub" },
    { id: "ui-loot-flare", label: "Flare" },
    { id: "ui-loot-45acp", label: ".45 ACP" },
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

  // ---------- X/B swap helpers ----------
  // When swapXB is on, btn index 0 and 1 are flipped for all logic
  function swapBtn(idx) {
    if (!settings.swapXB) return idx;
    if (idx === 0) return 1;
    if (idx === 1) return 0;
    return idx;
  }

  // ---------- util ----------
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

  // ---------- toast ----------
  function showToast(type, title, sub) {
    let c = document.getElementById("ctrl-toast-container");
    if (!c) {
      c = document.createElement("div");
      c.id = "ctrl-toast-container";
      document.body.appendChild(c);
    }
    const toast = document.createElement("div");
    toast.className = `ctrl-toast ${type}`;
    const icon =
      type === "connected" ? (controllerType === "xbox" ? "🟩" : "🎮") : "⛔";
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

  // ---------- cursor hide / keyboard block ----------
  let cursorStyleEl = null;
  function updateCursorHide() {
    if (!cursorStyleEl) {
      cursorStyleEl = document.createElement("style");
      cursorStyleEl.id = "ctrl-cursor-style";
      document.head.appendChild(cursorStyleEl);
    }
    if (settings.hideCursor && controllerIndex !== null && isInGame) {
      cursorStyleEl.textContent = "* { cursor: none !important; }";
    } else {
      cursorStyleEl.textContent = "";
    }
  }

  function handleKeyboardBlock(e) {
    if (
      !settings.blockKeyboard ||
      controllerIndex === null ||
      !settings.enabled
    )
      return;
    if (e.key === "F9") return;
    if (e.ctrlKey || e.altKey || e.metaKey) return;
    e.stopImmediatePropagation();
    e.preventDefault();
  }
  document.addEventListener("keydown", handleKeyboardBlock, true);
  document.addEventListener("keyup", handleKeyboardBlock, true);

  // ---------- force desktop layout ----------
  // Mirrors the standalone ForceDesktop userscript, applied on demand
  let desktopModeActive = false;
  let vpObserver = null;
  let touchToMouseBound = null;
  let origMatchMedia = null;

  function applyForceDesktop() {
    if (desktopModeActive) return;
    desktopModeActive = true;

    // Spoof UA
    try {
      const desktopUA =
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
      Object.defineProperty(navigator, "userAgent", {
        get: () => desktopUA,
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

    // Patch viewport
    function patchViewport() {
      const existing = document.querySelector('meta[name="viewport"]');
      const content =
        "width=1920, initial-scale=" + (window.screen.width / 1920).toFixed(4);
      if (existing) {
        existing.setAttribute("content", content);
      } else {
        const meta = document.createElement("meta");
        meta.name = "viewport";
        meta.content = content;
        (document.head || document.documentElement).appendChild(meta);
      }
    }
    patchViewport();

    vpObserver = new MutationObserver(patchViewport);
    if (document.head)
      vpObserver.observe(document.head, { childList: true, subtree: true });

    // Override matchMedia
    origMatchMedia = window.matchMedia.bind(window);
    window.matchMedia = function (query) {
      const result = origMatchMedia(query);
      const mobileQ = [
        "(pointer: coarse)",
        "(hover: none)",
        "(any-pointer: coarse)",
      ];
      const desktopQ = [
        "(pointer: fine)",
        "(hover: hover)",
        "(any-pointer: fine)",
      ];
      if (mobileQ.some((q) => query.trim() === q))
        return Object.assign(Object.create(result), { matches: false });
      if (desktopQ.some((q) => query.trim() === q))
        return Object.assign(Object.create(result), { matches: true });
      return result;
    };

    // Touch -> mouse
    touchToMouseBound = function (evt) {
      const touch = evt.changedTouches[0];
      if (!touch) return;
      const typeMap = {
        touchstart: "mousedown",
        touchmove: "mousemove",
        touchend: "mouseup",
      };
      const mouseType = typeMap[evt.type];
      if (!mouseType) return;
      const mouseEvt = new MouseEvent(mouseType, {
        bubbles: true,
        cancelable: true,
        view: window,
        clientX: touch.clientX,
        clientY: touch.clientY,
        screenX: touch.screenX,
        screenY: touch.screenY,
        button: 0,
        buttons: mouseType === "mouseup" ? 0 : 1,
      });
      touch.target.dispatchEvent(mouseEvt);
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

  // Apply on load if saved
  if (settings.forceDesktop) applyForceDesktop();

  // ---------- gamepad connect/disconnect ----------
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

  // ---------- main poll loop ----------
  function startLoop() {
    function loop() {
      animFrameId = requestAnimationFrame(loop);
      if (controllerIndex === null || !settings.enabled) return;

      const gp = navigator.getGamepads()[controllerIndex];
      if (!gp) return;

      isInGame = !!document.getElementById("ui-game");
      updateCursorHide();

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
        if (isInGame) handleAiming();
        const rtHeld = (gp.buttons[settings.binds.btnFire]?.value || 0) > 0.5;
        if (settings.spamFire) setMouseButtonSpam(rtHeld);
        else setMouseButtonHeld(rtHeld);
      }

      updateCrosshairPosition();
    }
    loop();
  }

  function applyDeadzone(val, dz) {
    if (Math.abs(val) < dz) return 0;
    return (val - Math.sign(val) * dz) / (1 - dz);
  }

  // ---------- button down ----------
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

    // Apply X/B swap for the raw index before matching
    const effIdx = swapBtn(idx);

    // ---- MENU ONLY ----
    if (!isInGame) {
      if (effIdx === mb.playSolo) {
        hardClick("btn-start-mode-0");
        return;
      }
      if (effIdx === mb.playDuo) {
        hardClick("btn-start-mode-1");
        return;
      }
      if (effIdx === mb.playSquad) {
        hardClick("btn-start-mode-2");
        return;
      }
    }

    // drop menu toggle
    if (effIdx === b.btnR3 && isInGame) {
      toggleDropMenu();
      return;
    }

    // ---- IN GAME ----
    if (isInGame) {
      if (effIdx === b.btnInteract) simulateKey("f", "keydown");
      if (effIdx === b.btnThrowable) simulateKey("4", "keydown");
      if (effIdx === b.btnPickupOther) simulateKey("j", "keydown");
      if (effIdx === b.btnR1) simulateKey("q", "keydown");
      if (effIdx === b.btnL1) simulateKey("c", "keydown");
      if (effIdx === b.btnL3) simulateKey("t", "keydown");

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

    // ---- UNIVERSAL ----
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

    // quit confirm - uses swapped circle button
    if (effIdx === b.btnCircle && isInGame && quitMode) {
      hardClick("btn-game-quit");
      quitMode = false;
    }
  }

  // ---------- button up ----------
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

  // ---------- scope cycling ----------
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

  // ---------- drop menu ----------
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
  }

  function renderDropMenu() {
    document.getElementById("ctrl-drop-menu")?.remove();
    const menu = document.createElement("div");
    menu.id = "ctrl-drop-menu";
    const confirmBtn = settings.swapXB
      ? controllerType === "xbox"
        ? "B"
        : "○"
      : controllerType === "xbox"
        ? "A"
        : "✕";
    const closeBtn = settings.swapXB
      ? controllerType === "xbox"
        ? "A"
        : "✕"
      : controllerType === "xbox"
        ? "B"
        : "○";
    const hint = `↑↓ Navigate  •  ${confirmBtn} = Drop  •  ${closeBtn} = Close`;
    menu.innerHTML = `
      <div class="ctrl-drop-title">DROP ITEM</div>
      <div class="ctrl-drop-hint">${hint}</div>
      <div class="ctrl-drop-list" id="ctrl-drop-list"></div>`;
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
      row.textContent = item.label;
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

  // ---------- movement ----------
  let moveKeyState = { w: false, a: false, s: false, d: false };
  function handleMovement() {
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

  // ---------- aiming ----------
  function handleAiming() {
    if (Math.hypot(rightX, rightY) < 0.05) return;
    const sf = 0.08 + (settings.aimSmoothing / 100) * 0.12;
    mouseVX += (rightX - mouseVX) * sf * 10;
    mouseVY += (rightY - mouseVY) * sf * 10;
    if (Math.hypot(mouseVX, mouseVY) > 0.05)
      aimAngle = Math.atan2(mouseVY, mouseVX);
    const r = (settings.aimSensitivity / 50) * 180 + 60;
    const tx = window.innerWidth / 2 + Math.cos(aimAngle) * r;
    const ty = window.innerHeight / 2 + Math.sin(aimAngle) * r;
    const ls = 0.18 + (settings.aimSmoothing / 100) * 0.25;
    currentMouseX += (tx - currentMouseX) * ls;
    currentMouseY += (ty - currentMouseY) * ls;
    const opts = {
      bubbles: true,
      cancelable: true,
      view: window,
      clientX: currentMouseX,
      clientY: currentMouseY,
    };
    document.dispatchEvent(new MouseEvent("mousemove", opts));
    const el = document.elementFromPoint(currentMouseX, currentMouseY);
    if (el) el.dispatchEvent(new MouseEvent("mousemove", opts));
  }

  // ---------- crosshair ----------
  let crosshairEl = null;
  function ensureCrosshair() {
    if (crosshairEl) return;
    crosshairEl = document.createElement("div");
    crosshairEl.id = "ctrl-crosshair";
    document.body.appendChild(crosshairEl);
  }
  function updateCrosshairPosition() {
    if (!crosshairEl || controllerIndex === null) return;
    crosshairEl.style.left = currentMouseX + "px";
    crosshairEl.style.top = currentMouseY + "px";
  }
  function rebuildCrosshair() {
    crosshairEl?.remove();
    crosshairEl = null;
    ensureCrosshair();
    applyCrosshairStyle();
  }
  function applyCrosshairStyle() {
    if (!crosshairEl) return;
    const c = settings.crosshair;
    const col = c.color,
      sw = c.strokeWidth || 0,
      sc = c.strokeColor || "#000000";
    const alpha = (c.opacity / 100).toFixed(2);
    crosshairEl.innerHTML = "";
    crosshairEl.style.cssText = `position:fixed;pointer-events:none;z-index:99997;transform:translate(-50%,-50%);left:${currentMouseX}px;top:${currentMouseY}px;`;
    if (c.style === "dot") {
      const total = c.size + sw * 2;
      crosshairEl.innerHTML = `<svg width="${total}" height="${total}" style="opacity:${alpha};display:block;">
        ${sw > 0 ? `<circle cx="${total / 2}" cy="${total / 2}" r="${c.size / 2 + sw}" fill="${sc}"/>` : ""}
        <circle cx="${total / 2}" cy="${total / 2}" r="${c.size / 2}" fill="${col}"/></svg>`;
    } else if (c.style === "circle") {
      const r = c.size,
        dim = (r + c.thickness + sw) * 2 + 2,
        cx = dim / 2;
      crosshairEl.innerHTML = `<svg width="${dim}" height="${dim}" style="opacity:${alpha};display:block;">
        ${sw > 0 ? `<circle cx="${cx}" cy="${cx}" r="${r}" stroke="${sc}" stroke-width="${c.thickness + sw * 2}" fill="none"/>` : ""}
        <circle cx="${cx}" cy="${cx}" r="${r}" stroke="${col}" stroke-width="${c.thickness}" fill="none"/></svg>`;
    } else {
      const g = c.gap,
        s = c.size,
        t = c.thickness;
      const w = (s + g) * 2 + t + sw * 2,
        cx = w / 2,
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
      const dotPart =
        c.style === "crossdot"
          ? (sw > 0
              ? `<circle cx="${cx}" cy="${cy}" r="${t + sw}" fill="${sc}"/>`
              : "") + `<circle cx="${cx}" cy="${cy}" r="${t}" fill="${col}"/>`
          : "";
      crosshairEl.innerHTML = `<svg width="${w}" height="${w}" style="opacity:${alpha};display:block;">${lines}${dotPart}</svg>`;
    }
  }

  // ---------- fire / click ----------
  let fireInterval = null;
  const heldMouseBtn = { held: false };
  function setMouseButtonHeld(held) {
    if (held && !heldMouseBtn.held) {
      heldMouseBtn.held = true;
      fireMouseAt(currentMouseX, currentMouseY, "mousedown");
      fireInterval = setInterval(
        () => fireMouseAt(currentMouseX, currentMouseY, "mousedown"),
        16,
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

  // ---------- click helpers ----------
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

  // ---------- key simulation ----------
  function simulateKey(key, type) {
    const codeMap = {
      w: "KeyW",
      a: "KeyA",
      s: "KeyS",
      d: "KeyD",
      e: "KeyE",
      f: "KeyF",
      h: "KeyH",
      j: "KeyJ",
      m: "KeyM",
      r: "KeyR",
      q: "KeyQ",
      c: "KeyC",
      t: "KeyT",
      1: "Digit1",
      2: "Digit2",
      3: "Digit3",
      4: "Digit4",
      Escape: "Escape",
    };
    const keyCodeMap = {
      w: 87,
      a: 65,
      s: 83,
      d: 68,
      e: 69,
      f: 70,
      h: 72,
      j: 74,
      m: 77,
      r: 82,
      q: 81,
      c: 67,
      t: 84,
      1: 49,
      2: 50,
      3: 51,
      4: 52,
      Escape: 27,
    };
    const code = codeMap[key] || `Key${key.toUpperCase()}`;
    const keyCode = keyCodeMap[key] || key.charCodeAt(0);
    const ev = new KeyboardEvent(type, {
      key,
      code,
      keyCode,
      which: keyCode,
      bubbles: true,
      cancelable: true,
      view: window,
    });
    document.dispatchEvent(ev);
    window.dispatchEvent(ev);
    document.body.dispatchEvent(ev);
    const canvas = document.querySelector("canvas");
    if (canvas) canvas.dispatchEvent(ev);
  }

  // ---------- auto loot ----------
  function setupAutoLoot() {
    function burst() {
      if (!settings.autoLoot || controllerIndex === null) return;
      const el = document.querySelector("#ui-interaction-outer");
      if (!el) return;
      for (let i = 0; i < 4; i++) {
        el.dispatchEvent(new TouchEvent("touchstart", { bubbles: true }));
        el.dispatchEvent(new TouchEvent("touchend", { bubbles: true }));
      }
    }
    function shouldPickup(t) {
      t = t.toLowerCase();
      return [
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
        "mine",
        "scope",
        "2x",
        "4x",
        "8x",
        "15x",
      ].some((w) => t.includes(w));
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

  // ---------- consumable wheel ----------
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
    const dist = Math.hypot(dx, dy),
      angle = (Math.atan2(dy, dx) * 180) / Math.PI;
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
          <div class="ui-emote-image ui-emote-image-large" style="background-image:url('img/gui/close.svg');"></div>
        </div>
        <div id="ui-cons-top" class="ui-emote-top ui-emote-quarter ui-emote-parent" data-key="top">
          <div class="ui-emote ui-emote-bg-quarter"></div><div class="ui-emote ui-emote-hl" style="display:none;"></div>
          <div class="ui-emote-image ui-emote-image-large" style="background-image:url('https://survev.io/img/loot/loot-medical-healthkit.svg');"></div>
        </div>
        <div id="ui-cons-right" class="ui-emote-right ui-emote-quarter ui-emote-parent" data-key="right">
          <div class="ui-emote ui-emote-bg-quarter"></div><div class="ui-emote ui-emote-hl" style="display:none;"></div>
          <div class="ui-emote-image ui-emote-image-large" style="background-image:url('https://survev.io/img/loot/loot-medical-soda.svg');"></div>
        </div>
        <div id="ui-cons-bottom" class="ui-emote-bottom ui-emote-quarter ui-emote-parent" data-key="bottom">
          <div class="ui-emote ui-emote-bg-quarter"></div><div class="ui-emote ui-emote-hl" style="display:none;"></div>
          <div class="ui-emote-image ui-emote-image-large" style="background-image:url('https://survev.io/img/loot/loot-medical-bandage.svg');"></div>
        </div>
        <div id="ui-cons-left" class="ui-emote-left ui-emote-quarter ui-emote-parent" data-key="left">
          <div class="ui-emote ui-emote-bg-quarter"></div><div class="ui-emote ui-emote-hl" style="display:none;"></div>
          <div class="ui-emote-image ui-emote-image-large" style="background-image:url('https://survev.io/img/loot/loot-medical-pill.svg');"></div>
        </div>
      </div>`,
    );
  }

  // ---------- settings ui ----------
  const ALL_BIND_DEFS = [
    { key: "btnInteract", label: "Interact", sub: "F key" },
    { key: "btnThrowable", label: "Throwable", sub: "4 key" },
    {
      key: "btnMelee",
      label: "Melee / Reload",
      sub: "Tap = melee (E), Hold = reload (R)",
    },
    { key: "btnPickupOther", label: "Swap Weapon", sub: "J key" },
    { key: "btnFire", label: "Fire", sub: "Hold trigger to shoot" },
    { key: "btnR1", label: "R1 / RB", sub: "Q key" },
    { key: "btnL1", label: "L1 / LB", sub: "C key" },
    { key: "btnConsWheel", label: "Heal / Cons Wheel", sub: "Dpad down" },
    { key: "btnDpadUp", label: "D-Pad Up", sub: "Med Kit (wheel off)" },
    {
      key: "btnDpadLeft",
      label: "D-Pad Left",
      sub: "Scope cycle (wheel on) / Soda",
    },
    {
      key: "btnDpadRight",
      label: "D-Pad Right",
      sub: "Scope other way / Painkiller",
    },
    { key: "btnMap", label: "Map", sub: "M key" },
    { key: "btnMenu", label: "Menu / Esc", sub: "" },
    { key: "btnCircle", label: "Quit confirm", sub: "○ / B  (after esc only)" },
    { key: "btnL3", label: "L3 Stick Click", sub: "T key" },
    { key: "btnR3", label: "R3 Stick Click", sub: "Toggle drop item menu" },
  ];

  const MENU_BIND_DEFS = [
    { key: "playSolo", label: "Play Solo" },
    { key: "playDuo", label: "Play Duo" },
    { key: "playSquad", label: "Play Squad" },
  ];

  function buildSettingsUI() {
    document.getElementById("ctrl-settings-overlay")?.remove();
    const overlay = document.createElement("div");
    overlay.id = "ctrl-settings-overlay";
    overlay.innerHTML = `
      <div id="ctrl-settings-modal" role="dialog">
        <div id="ctrl-settings-header">
          <h2>Controller Settings</h2>
          <button id="ctrl-close-btn" title="Close">✕</button>
        </div>
        <div id="ctrl-tabs">
          <div class="ctrl-tab active" data-tab="status">Status</div>
          <div class="ctrl-tab" data-tab="binds">Binds</div>
          <div class="ctrl-tab" data-tab="menu-binds">Menu</div>
          <div class="ctrl-tab" data-tab="features">Features</div>
          <div class="ctrl-tab" data-tab="analog">Analog</div>
          <div class="ctrl-tab" data-tab="crosshair">Crosshair</div>
        </div>
        <div id="ctrl-content">
          ${buildStatusPanel()}
          ${buildBindsPanel()}
          ${buildMenuBindsPanel()}
          ${buildFeaturesPanel()}
          ${buildAnalogPanel()}
          ${buildCrosshairPanel()}
        </div>
        <div id="ctrl-settings-footer">
          <button class="ctrl-footer-btn save" id="ctrl-save-btn">Save Settings</button>
          <button class="ctrl-footer-btn reset" id="ctrl-reset-btn">Restore Defaults</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    setupSettingsEvents(overlay);
    applyCrosshairStyle();
  }

  function buildStatusPanel() {
    const gpId =
      controllerIndex !== null
        ? (navigator.getGamepads()[controllerIndex]?.id?.slice(0, 46) ||
            "Connected") + ` [${controllerType.toUpperCase()}]`
        : "No controller detected";

    // Swap-aware button label helper for status panel
    const xbtn = settings.swapXB
      ? controllerType === "xbox"
        ? "B"
        : "○"
      : controllerType === "xbox"
        ? "A"
        : "✕";
    const bbtn = settings.swapXB
      ? controllerType === "xbox"
        ? "A"
        : "✕"
      : controllerType === "xbox"
        ? "B"
        : "○";

    const r =
      controllerType === "xbox"
        ? `<b style="color:#c8d8a0">Left Stick</b> → Move &nbsp;<b style="color:#c8d8a0">Right Stick</b> → Aim<br>
         <b style="color:#c8d8a0">RT</b> → Fire &nbsp;<b style="color:#c8d8a0">LT</b> → Swap Weapon<br>
         <b style="color:#c8d8a0">${xbtn}</b> → Interact &nbsp;<b style="color:#c8d8a0">Y</b> → Throwable &nbsp;<b style="color:#c8d8a0">X</b> → Melee/Reload<br>
         <b style="color:#c8d8a0">RB</b> → Q &nbsp;<b style="color:#c8d8a0">LB</b> → C<br>
         <b style="color:#c8d8a0">↓ Dpad</b> → Heal/Wheel &nbsp;<b style="color:#c8d8a0">← Dpad</b> → Scope Cycle<br>
         <b style="color:#c8d8a0">LS</b> → T &nbsp;<b style="color:#c8d8a0">RS</b> → Drop Menu<br>
         <b style="color:#c8d8a0">View</b> → Map &nbsp;<b style="color:#c8d8a0">Menu</b> → Esc`
        : `<b style="color:#c8d8a0">Left Stick</b> → Move &nbsp;<b style="color:#c8d8a0">Right Stick</b> → Aim<br>
         <b style="color:#c8d8a0">R2</b> → Fire &nbsp;<b style="color:#c8d8a0">L2</b> → Swap Weapon<br>
         <b style="color:#c8d8a0">${xbtn}</b> → Interact &nbsp;<b style="color:#c8d8a0">△</b> → Throwable &nbsp;<b style="color:#c8d8a0">□</b> → Melee/Reload<br>
         <b style="color:#c8d8a0">R1</b> → Q &nbsp;<b style="color:#c8d8a0">L1</b> → C<br>
         <b style="color:#c8d8a0">↓ Dpad</b> → Heal/Wheel &nbsp;<b style="color:#c8d8a0">← Dpad</b> → Scope Cycle<br>
         <b style="color:#c8d8a0">L3</b> → T &nbsp;<b style="color:#c8d8a0">R3</b> → Drop Menu<br>
         <b style="color:#c8d8a0">Share</b> → Map &nbsp;<b style="color:#c8d8a0">Options</b> → Esc`;

    return `<div class="ctrl-tab-panel active" id="ctrl-panel-status">
      <div id="ctrl-status-bar"><div id="ctrl-status-indicator" class="${controllerIndex !== null ? "on" : "off"}"></div><div id="ctrl-status-text">${gpId}</div></div>
      <div class="ctrl-section-label">Master Toggle</div>
      <div class="ctrl-toggle-row">
        <div><div class="ctrl-toggle-label">Controller Support</div><div class="ctrl-toggle-sub">Turns everything on/off</div></div>
        <label class="ctrl-switch"><input type="checkbox" id="toggle-enabled" ${settings.enabled ? "checked" : ""}><span class="ctrl-switch-slider"></span></label>
      </div>
      <div class="ctrl-section-label">Controls Reference</div>
      <div style="font-size:11px;color:#8aaa50;line-height:1.8;padding:8px 10px;background:rgba(0,0,0,0.2);border-radius:6px;border:1px solid rgba(90,122,48,0.25);">${r}</div>
    </div>`;
  }

  function buildBindsPanel() {
    const rows = ALL_BIND_DEFS.map(
      (def) => `
      <div class="ctrl-bind-row">
        <div class="ctrl-bind-label">${def.label}${def.sub ? `<div class="ctrl-bind-sublabel">${def.sub}</div>` : ""}</div>
        <button class="ctrl-bind-btn" data-category="binds" data-key="${def.key}">${btnName(settings.binds[def.key])}</button>
      </div>`,
    ).join("");
    return `<div class="ctrl-tab-panel" id="ctrl-panel-binds">
      <div class="ctrl-section-label">Game Keybinds — click then press controller button to rebind</div>
      ${rows}
    </div>`;
  }

  function buildMenuBindsPanel() {
    // Show current button names based on swapXB state
    const rows = MENU_BIND_DEFS.map(
      (def) => `
      <div class="ctrl-bind-row">
        <div class="ctrl-bind-label">${def.label}</div>
        <button class="ctrl-bind-btn" data-category="menuBinds" data-key="${def.key}">${btnName(settings.menuBinds[def.key])}</button>
      </div>`,
    ).join("");
    return `<div class="ctrl-tab-panel" id="ctrl-panel-menu-binds">
      <div class="ctrl-section-label">Main Menu Binds</div>
      ${rows}
      <div style="font-size:10px;color:#6a8a40;margin-top:8px;">Only active on the main menu, not in-game.</div>
    </div>`;
  }

  function buildFeaturesPanel() {
    const holdPct = (((settings.reloadHold.holdMs - 100) / 900) * 100).toFixed(
      0,
    );
    const xLabel = controllerType === "xbox" ? "A/B" : "✕/○";
    return `<div class="ctrl-tab-panel" id="ctrl-panel-features">
      <div class="ctrl-section-label">Automation</div>
      <div class="ctrl-toggle-row">
        <div><div class="ctrl-toggle-label">Auto Loot <span class="ctrl-feature-status ${settings.autoLoot ? "" : "off"}">${settings.autoLoot ? "ON" : "OFF"}</span></div>
        <div class="ctrl-toggle-sub">Auto-picks up ammo, heals, grenades, scopes</div></div>
        <label class="ctrl-switch"><input type="checkbox" id="toggle-autoLoot" ${settings.autoLoot ? "checked" : ""}><span class="ctrl-switch-slider"></span></label>
      </div>
      <div class="ctrl-toggle-row">
        <div>
          <div class="ctrl-toggle-label">Consumable Wheel <span class="ctrl-feature-status ${settings.consumableWheel ? "" : "off"}">${settings.consumableWheel ? "ON" : "OFF"}</span></div>
          <div class="ctrl-toggle-sub">Hold dpad down to open radial heal menu</div>
          ${!settings.consumableWheel ? `<div class="ctrl-warn-note">⚠ Wheel OFF — Dpad controls direct heals. Scope cycling moves to ← / → Dpad.</div>` : ""}
        </div>
        <label class="ctrl-switch"><input type="checkbox" id="toggle-consumableWheel" ${settings.consumableWheel ? "checked" : ""}><span class="ctrl-switch-slider"></span></label>
      </div>
      <div class="ctrl-section-label">Combat</div>
      <div class="ctrl-toggle-row">
        <div><div class="ctrl-toggle-label">Spam Fire <span class="ctrl-feature-status ${settings.spamFire ? "" : "off"}">${settings.spamFire ? "ON" : "OFF"}</span></div>
        <div class="ctrl-toggle-sub">Rapid clicks instead of hold — great for pistols / semi-auto</div></div>
        <label class="ctrl-switch"><input type="checkbox" id="toggle-spamFire" ${settings.spamFire ? "checked" : ""}><span class="ctrl-switch-slider"></span></label>
      </div>
      <div class="ctrl-toggle-row">
        <div><div class="ctrl-toggle-label">Hold to Reload <span class="ctrl-feature-status ${settings.reloadHold.enabled ? "" : "off"}">${settings.reloadHold.enabled ? "ON" : "OFF"}</span></div>
        <div class="ctrl-toggle-sub">Hold □ / X past threshold to reload (R). Tap = melee.</div></div>
        <label class="ctrl-switch"><input type="checkbox" id="toggle-reloadHold" ${settings.reloadHold.enabled ? "checked" : ""}><span class="ctrl-switch-slider"></span></label>
      </div>
      ${
        settings.reloadHold.enabled
          ? `
      <div class="ctrl-slider-row">
        <div class="ctrl-slider-label">Hold Threshold<div class="ctrl-slider-sub">ms before reload triggers</div></div>
        <input type="range" class="ctrl-slider" id="slider-reloadHoldMs" min="100" max="1000" value="${settings.reloadHold.holdMs}" style="--pct:${holdPct}%">
        <div class="ctrl-slider-val" id="val-reloadHoldMs">${settings.reloadHold.holdMs}ms</div>
      </div>`
          : ""
      }
      <div class="ctrl-section-label">Controller Layout</div>
      <div class="ctrl-toggle-row">
        <div><div class="ctrl-toggle-label">${xLabel} Button Swap <span class="ctrl-feature-status ${settings.swapXB ? "" : "off"}">${settings.swapXB ? "ON" : "OFF"}</span></div>
        <div class="ctrl-toggle-sub">Swaps Interact and Quit-confirm buttons (${xLabel}). Also updates badges and drop menu hints.</div></div>
        <label class="ctrl-switch"><input type="checkbox" id="toggle-swapXB" ${settings.swapXB ? "checked" : ""}><span class="ctrl-switch-slider"></span></label>
      </div>
      <div class="ctrl-section-label">Input</div>
      <div class="ctrl-toggle-row">
        <div><div class="ctrl-toggle-label">Block Keyboard <span class="ctrl-feature-status ${settings.blockKeyboard ? "" : "off"}">${settings.blockKeyboard ? "ON" : "OFF"}</span></div>
        <div class="ctrl-toggle-sub">Disables keyboard while controller is connected</div></div>
        <label class="ctrl-switch"><input type="checkbox" id="toggle-blockKeyboard" ${settings.blockKeyboard ? "checked" : ""}><span class="ctrl-switch-slider"></span></label>
      </div>
      <div class="ctrl-toggle-row">
        <div><div class="ctrl-toggle-label">Hide Cursor In-Game <span class="ctrl-feature-status ${settings.hideCursor ? "" : "off"}">${settings.hideCursor ? "ON" : "OFF"}</span></div>
        <div class="ctrl-toggle-sub">Hides the mouse cursor during a match</div></div>
        <label class="ctrl-switch"><input type="checkbox" id="toggle-hideCursor" ${settings.hideCursor ? "checked" : ""}><span class="ctrl-switch-slider"></span></label>
      </div>
      <div class="ctrl-section-label">Compatibility</div>
      <div class="ctrl-toggle-row">
        <div><div class="ctrl-toggle-label">Force Desktop Layout <span class="ctrl-feature-status ${settings.forceDesktop ? "" : "off"}">${settings.forceDesktop ? "ON" : "OFF"}</span></div>
        <div class="ctrl-toggle-sub">Spoofs desktop UA, disables touch detection, forces mouse events. Useful on mobile/tablet browsers. Reload page after toggling for full effect.</div></div>
        <label class="ctrl-switch"><input type="checkbox" id="toggle-forceDesktop" ${settings.forceDesktop ? "checked" : ""}><span class="ctrl-switch-slider"></span></label>
      </div>
      <div class="ctrl-section-label">Drop Menu</div>
      <div style="font-size:11px;color:#8aaa50;line-height:1.7;padding:8px 10px;background:rgba(0,0,0,0.2);border-radius:6px;border:1px solid rgba(90,122,48,0.25);">
        Press <b style="color:#c8d8a0">R3/RS</b> to open. Navigate <b style="color:#c8d8a0">↑↓ Dpad</b>,
        confirm with <b style="color:#c8d8a0">${settings.swapXB ? (controllerType === "xbox" ? "B" : "○") : controllerType === "xbox" ? "A" : "✕"}</b>,
        close with <b style="color:#c8d8a0">${settings.swapXB ? (controllerType === "xbox" ? "A" : "✕") : controllerType === "xbox" ? "B" : "○"}</b>.
        All other inputs blocked while open.
      </div>
    </div>`;
  }

  function buildAnalogPanel() {
    return `<div class="ctrl-tab-panel" id="ctrl-panel-analog">
      <div class="ctrl-section-label">Aiming</div>
      ${makeSlider("aimSensitivity", "Aim Sensitivity", "Radius of aim circle", 1, 99, settings.aimSensitivity, "")}
      ${makeSlider("aimSmoothing", "Aim Smoothing", "Stick response curve", 1, 10, settings.aimSmoothing, "")}
      <div class="ctrl-section-label">Deadzones</div>
      ${makeSlider("leftDeadzone", "Left Stick Deadzone", "Movement stick", 1, 50, settings.leftDeadzone, "%")}
      ${makeSlider("rightDeadzone", "Right Stick Deadzone", "Aim stick", 1, 50, settings.rightDeadzone, "%")}
    </div>`;
  }

  function makeSlider(id, label, sub, min, max, val, suffix) {
    const pct = (((val - min) / (max - min)) * 100).toFixed(0);
    return `<div class="ctrl-slider-row">
      <div class="ctrl-slider-label">${label}<div class="ctrl-slider-sub">${sub}</div></div>
      <input type="range" class="ctrl-slider" id="slider-${id}" min="${min}" max="${max}" value="${val}" style="--pct:${pct}%">
      <div class="ctrl-slider-val" id="val-${id}">${val}${suffix}</div>
    </div>`;
  }

  const CROSSHAIR_COLORS = [
    "#00ff88",
    "#ffffff",
    "#ff4444",
    "#ffff00",
    "#00aaff",
    "#ff00ff",
    "#ff8800",
  ];

  function buildCrosshairPanel() {
    const c = settings.crosshair;
    const swatches = CROSSHAIR_COLORS.map(
      (col) =>
        `<div class="ctrl-color-swatch${c.color === col ? " active" : ""}" data-color="${col}" style="background:${col}"></div>`,
    ).join("");
    return `<div class="ctrl-tab-panel" id="ctrl-panel-crosshair">
      <div class="ctrl-section-label">Style</div>
      <div class="ctrl-bind-row" style="flex-wrap:wrap;gap:6px;">
        ${["cross", "dot", "circle", "crossdot"]
          .map(
            (s) =>
              `<button class="ctrl-bind-btn ctrl-style-btn${c.style === s ? " active-style" : ""}" data-style="${s}" style="min-width:70px;flex:1">${s}</button>`,
          )
          .join("")}
      </div>
      <div class="ctrl-section-label">Color</div>
      <div style="display:flex;gap:8px;padding:6px 0;flex-wrap:wrap;align-items:center;">
        ${swatches}
        <input type="color" id="crosshair-color-picker" value="${c.color}" title="Custom color" style="width:28px;height:28px;border:none;background:none;cursor:pointer;padding:0;">
      </div>
      <div class="ctrl-section-label">Outline / Stroke</div>
      <div style="display:flex;gap:8px;padding:4px 0 6px;align-items:center;">
        <span style="font-size:11px;color:#8aaa50;min-width:80px;">Stroke Color</span>
        <input type="color" id="crosshair-stroke-picker" value="${c.strokeColor || "#000000"}" style="width:28px;height:28px;border:none;background:none;cursor:pointer;padding:0;">
      </div>
      ${makeSlider("chStrokeWidth", "Stroke Width", "0 = no outline", 0, 5, c.strokeWidth || 0, "")}
      <div class="ctrl-section-label">Size & Shape</div>
      ${makeSlider("chSize", "Size", "Arm length / dot radius", 4, 30, c.size, "")}
      ${makeSlider("chThickness", "Thickness", "Line width", 1, 6, c.thickness, "")}
      ${makeSlider("chGap", "Gap", "Center gap size", 0, 16, c.gap, "")}
      ${makeSlider("chOpacity", "Opacity", "Crosshair visibility", 10, 100, c.opacity, "%")}
      <div class="ctrl-section-label">Preview</div>
      <div id="crosshair-preview-box"></div>
    </div>`;
  }

  function setupSettingsEvents(overlay) {
    overlay
      .querySelector("#ctrl-close-btn")
      .addEventListener("click", closeSettings);
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) closeSettings();
    });

    overlay.querySelectorAll(".ctrl-tab").forEach((tab) => {
      tab.addEventListener("click", () => {
        overlay
          .querySelectorAll(".ctrl-tab")
          .forEach((t) => t.classList.remove("active"));
        overlay
          .querySelectorAll(".ctrl-tab-panel")
          .forEach((p) => p.classList.remove("active"));
        tab.classList.add("active");
        overlay
          .querySelector("#ctrl-panel-" + tab.dataset.tab)
          ?.classList.add("active");
      });
    });

    overlay
      .querySelector("#toggle-enabled")
      ?.addEventListener("change", (e) => {
        settings.enabled = e.target.checked;
      });

    overlay
      .querySelector("#toggle-consumableWheel")
      ?.addEventListener("change", (e) => {
        settings.consumableWheel = e.target.checked;
        rebuildFeaturesPanel(overlay);
      });
    overlay
      .querySelector("#toggle-reloadHold")
      ?.addEventListener("change", (e) => {
        settings.reloadHold.enabled = e.target.checked;
        rebuildFeaturesPanel(overlay);
      });

    setupFeaturesEvents(overlay);

    // game sliders
    [
      {
        id: "aimSensitivity",
        min: 1,
        max: 99,
        suffix: "",
        key: "aimSensitivity",
      },
      { id: "aimSmoothing", min: 1, max: 10, suffix: "", key: "aimSmoothing" },
      { id: "leftDeadzone", min: 1, max: 50, suffix: "%", key: "leftDeadzone" },
      {
        id: "rightDeadzone",
        min: 1,
        max: 50,
        suffix: "%",
        key: "rightDeadzone",
      },
    ].forEach(({ id, min, max, suffix, key }) => {
      const sl = overlay.querySelector(`#slider-${id}`),
        vl = overlay.querySelector(`#val-${id}`);
      if (!sl) return;
      sl.addEventListener("input", () => {
        settings[key] = Number(sl.value);
        if (vl) vl.textContent = sl.value + suffix;
        sl.style.setProperty(
          "--pct",
          (((sl.value - min) / (max - min)) * 100).toFixed(0) + "%",
        );
      });
    });

    // crosshair sliders
    [
      { id: "chSize", key: "size", min: 4, max: 30, suffix: "" },
      { id: "chThickness", key: "thickness", min: 1, max: 6, suffix: "" },
      { id: "chGap", key: "gap", min: 0, max: 16, suffix: "" },
      { id: "chOpacity", key: "opacity", min: 10, max: 100, suffix: "%" },
      { id: "chStrokeWidth", key: "strokeWidth", min: 0, max: 5, suffix: "" },
    ].forEach(({ id, key, min, max, suffix }) => {
      const sl = overlay.querySelector(`#slider-${id}`),
        vl = overlay.querySelector(`#val-${id}`);
      if (!sl) return;
      sl.addEventListener("input", () => {
        settings.crosshair[key] = Number(sl.value);
        if (vl) vl.textContent = sl.value + suffix;
        sl.style.setProperty(
          "--pct",
          (((sl.value - min) / (max - min)) * 100).toFixed(0) + "%",
        );
        rebuildCrosshair();
        updateCrosshairPreview(overlay);
      });
    });

    const rSlider = overlay.querySelector("#slider-reloadHoldMs");
    const rVal = overlay.querySelector("#val-reloadHoldMs");
    if (rSlider) {
      rSlider.addEventListener("input", () => {
        settings.reloadHold.holdMs = Number(rSlider.value);
        if (rVal) rVal.textContent = rSlider.value + "ms";
        rSlider.style.setProperty(
          "--pct",
          (((rSlider.value - 100) / 900) * 100).toFixed(0) + "%",
        );
      });
    }

    overlay.querySelectorAll(".ctrl-style-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        overlay
          .querySelectorAll(".ctrl-style-btn")
          .forEach((b) => b.classList.remove("active-style"));
        btn.classList.add("active-style");
        settings.crosshair.style = btn.dataset.style;
        rebuildCrosshair();
        updateCrosshairPreview(overlay);
      });
    });

    overlay.querySelectorAll(".ctrl-color-swatch").forEach((sw) => {
      sw.addEventListener("click", () => {
        overlay
          .querySelectorAll(".ctrl-color-swatch")
          .forEach((s) => s.classList.remove("active"));
        sw.classList.add("active");
        settings.crosshair.color = sw.dataset.color;
        const picker = overlay.querySelector("#crosshair-color-picker");
        if (picker) picker.value = sw.dataset.color;
        rebuildCrosshair();
        updateCrosshairPreview(overlay);
      });
    });

    overlay
      .querySelector("#crosshair-color-picker")
      ?.addEventListener("input", (e) => {
        settings.crosshair.color = e.target.value;
        rebuildCrosshair();
        updateCrosshairPreview(overlay);
      });
    overlay
      .querySelector("#crosshair-stroke-picker")
      ?.addEventListener("input", (e) => {
        settings.crosshair.strokeColor = e.target.value;
        rebuildCrosshair();
        updateCrosshairPreview(overlay);
      });

    updateCrosshairPreview(overlay);

    // bind buttons
    overlay
      .querySelectorAll(".ctrl-bind-btn:not(.ctrl-style-btn)")
      .forEach((btn) => {
        btn.addEventListener("click", (e) => {
          e.stopPropagation();
          if (listeningFor) {
            listeningFor.btn.classList.remove("listening");
            listeningFor.btn.textContent = btnName(
              settings[listeningFor.category][listeningFor.key],
            );
            listeningFor = null;
          }
          listeningFor = {
            category: btn.dataset.category,
            key: btn.dataset.key,
            btn,
          };
          btn.classList.add("listening");
          btn.textContent = "Press a button…";
        });
      });

    overlay.querySelector("#ctrl-save-btn").addEventListener("click", () => {
      saveSettings();
      const b = overlay.querySelector("#ctrl-save-btn");
      b.textContent = "Saved!";
      setTimeout(() => {
        b.textContent = "Save Settings";
      }, 1500);
    });

    overlay.querySelector("#ctrl-reset-btn").addEventListener("click", () => {
      if (confirm("Reset all settings to defaults?")) {
        settings = JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
        saveSettings();
        buildSettingsUI();
        openSettings();
      }
    });
  }

  // Helper to rebuild features panel in-place and re-attach events
  function rebuildFeaturesPanel(overlay) {
    const fp = overlay.querySelector("#ctrl-panel-features");
    if (!fp) return;
    const wasActive = fp.classList.contains("active");
    fp.outerHTML = buildFeaturesPanel();
    const newFp = overlay.querySelector("#ctrl-panel-features");
    if (wasActive) newFp.classList.add("active");
    setupFeaturesEvents(overlay);

    // Also re-attach reload hold slider if it appeared
    const rSlider = overlay.querySelector("#slider-reloadHoldMs");
    const rVal = overlay.querySelector("#val-reloadHoldMs");
    if (rSlider) {
      rSlider.addEventListener("input", () => {
        settings.reloadHold.holdMs = Number(rSlider.value);
        if (rVal) rVal.textContent = rSlider.value + "ms";
        rSlider.style.setProperty(
          "--pct",
          (((rSlider.value - 100) / 900) * 100).toFixed(0) + "%",
        );
      });
    }
  }

  function setupFeaturesEvents(overlay) {
    overlay
      .querySelector("#toggle-autoLoot")
      ?.addEventListener("change", (e) => {
        settings.autoLoot = e.target.checked;
      });
    overlay
      .querySelector("#toggle-consumableWheel")
      ?.addEventListener("change", (e) => {
        settings.consumableWheel = e.target.checked;
        rebuildFeaturesPanel(overlay);
      });
    overlay
      .querySelector("#toggle-spamFire")
      ?.addEventListener("change", (e) => {
        settings.spamFire = e.target.checked;
      });
    overlay
      .querySelector("#toggle-reloadHold")
      ?.addEventListener("change", (e) => {
        settings.reloadHold.enabled = e.target.checked;
        rebuildFeaturesPanel(overlay);
      });
    overlay.querySelector("#toggle-swapXB")?.addEventListener("change", (e) => {
      settings.swapXB = e.target.checked;
      // Rebuild menu binds panel so button labels update
      const mbp = overlay.querySelector("#ctrl-panel-menu-binds");
      if (mbp) {
        const wasActive = mbp.classList.contains("active");
        mbp.outerHTML = buildMenuBindsPanel();
        const newMbp = overlay.querySelector("#ctrl-panel-menu-binds");
        if (wasActive) newMbp.classList.add("active");
        // Re-attach bind button listeners for menu binds
        newMbp.querySelectorAll(".ctrl-bind-btn").forEach((btn) => {
          btn.addEventListener("click", (ev) => {
            ev.stopPropagation();
            if (listeningFor) {
              listeningFor.btn.classList.remove("listening");
              listeningFor.btn.textContent = btnName(
                settings[listeningFor.category][listeningFor.key],
              );
              listeningFor = null;
            }
            listeningFor = {
              category: btn.dataset.category,
              key: btn.dataset.key,
              btn,
            };
            btn.classList.add("listening");
            btn.textContent = "Press a button…";
          });
        });
      }
      // Rebuild status reference
      const sp = overlay.querySelector("#ctrl-panel-status");
      if (sp) {
        const wasActiveS = sp.classList.contains("active");
        sp.outerHTML = buildStatusPanel();
        const newSp = overlay.querySelector("#ctrl-panel-status");
        if (wasActiveS) newSp.classList.add("active");
        // Re-attach master toggle
        overlay
          .querySelector("#toggle-enabled")
          ?.addEventListener("change", (ev) => {
            settings.enabled = ev.target.checked;
          });
      }
      rebuildFeaturesPanel(overlay);
      updateMenuBadges();
    });
    overlay
      .querySelector("#toggle-blockKeyboard")
      ?.addEventListener("change", (e) => {
        settings.blockKeyboard = e.target.checked;
      });
    overlay
      .querySelector("#toggle-hideCursor")
      ?.addEventListener("change", (e) => {
        settings.hideCursor = e.target.checked;
        updateCursorHide();
      });
    overlay
      .querySelector("#toggle-forceDesktop")
      ?.addEventListener("change", (e) => {
        settings.forceDesktop = e.target.checked;
        syncForceDesktop();
      });
  }

  function updateCrosshairPreview(overlay) {
    const box = overlay.querySelector("#crosshair-preview-box");
    if (!box) return;
    const c = settings.crosshair,
      col = c.color,
      sw = c.strokeWidth || 0,
      sc = c.strokeColor || "#000000";
    const alpha = (c.opacity / 100).toFixed(2);
    let inner = "";
    if (c.style === "dot") {
      const total = c.size + sw * 2;
      inner = `<svg width="${total}" height="${total}" style="opacity:${alpha};display:block;">
        ${sw > 0 ? `<circle cx="${total / 2}" cy="${total / 2}" r="${c.size / 2 + sw}" fill="${sc}"/>` : ""}
        <circle cx="${total / 2}" cy="${total / 2}" r="${c.size / 2}" fill="${col}"/></svg>`;
    } else if (c.style === "circle") {
      const r = c.size,
        dim = (r + c.thickness + sw) * 2 + 2,
        cx = dim / 2;
      inner = `<svg width="${dim}" height="${dim}" style="opacity:${alpha};display:block;">
        ${sw > 0 ? `<circle cx="${cx}" cy="${cx}" r="${r}" stroke="${sc}" stroke-width="${c.thickness + sw * 2}" fill="none"/>` : ""}
        <circle cx="${cx}" cy="${cx}" r="${r}" stroke="${col}" stroke-width="${c.thickness}" fill="none"/></svg>`;
    } else {
      const g = c.gap,
        s = c.size,
        t = c.thickness;
      const w = (s + g) * 2 + t + sw * 2,
        cx = w / 2,
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
      inner = `<svg width="${w}" height="${w}" style="opacity:${alpha};display:block;">${lines}${dot}</svg>`;
    }
    box.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;width:100%;height:60px;background:rgba(0,0,0,0.4);border-radius:6px;border:1px solid rgba(90,122,48,0.3);">${inner}</div>`;
  }

  function finishListening(buttonIdx) {
    if (!listeningFor) return;
    const { category, key, btn } = listeningFor;
    settings[category][key] = buttonIdx;
    btn.classList.remove("listening");
    btn.textContent = btnName(buttonIdx);
    listeningFor = null;
    // If a menu bind was changed, update the badges immediately
    if (category === "menuBinds") updateMenuBadges();
  }

  function openSettings() {
    settingsOpen = true;
    document.getElementById("ctrl-settings-overlay")?.classList.add("open");
  }
  function closeSettings() {
    settingsOpen = false;
    listeningFor = null;
    document.getElementById("ctrl-settings-overlay")?.classList.remove("open");
  }

  // ---------- ui injection ----------
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
    const defs =
      controllerType === "xbox" ? getXBOX_BADGE_DEFS() : getPS_BADGE_DEFS();
    defs.forEach(({ id, badgeClass, symbol }) => {
      const el = document.getElementById(id);
      if (!el || el.querySelector(".ctrl-btn-badge")) return;
      const badge = document.createElement("span");
      badge.className = `ctrl-btn-badge ${badgeClass}`;
      badge.textContent = symbol;
      el.appendChild(badge);
    });
  }

  new MutationObserver(() => {
    injectControllerButton();
    injectMenuBadges();
    if (
      document.getElementById("ui-game") &&
      !document.getElementById("ui-consumables")
    )
      setupConsumableWheel();
    updateCursorHide();
  }).observe(document.body, { childList: true, subtree: true });

  // ---------- init ----------
  injectControllerButton();
  injectMenuBadges();
  setupAutoLoot();
  ensureCrosshair();
  applyCrosshairStyle();

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

  document.addEventListener("keydown", (e) => {
    if (e.key === "F9") {
      buildSettingsUI();
      openSettings();
    }
  });
  (() => {
    "use strict";

    // Prevent running twice
    if (window.__survevKeybindLoaded) return;
    window.__survevKeybindLoaded = true;

    const KEYBIND_CODE =
      "AQVF1FVTAiQVVkYAAABAMck0Ew0AACxwAAAp9RRUN+GUE0xFUdWUVVEAAJBWQ7b+";

    function injectKeybind() {
      const input = document.getElementById("keybind-code-input");
      const button = document.getElementById("btn-keybind-code-load");

      if (!input || !button) return;

      input.value = KEYBIND_CODE;

      // Let the site detect the change
      input.dispatchEvent(new Event("input", { bubbles: true }));

      button.click();

      console.log("Keybind code loaded automatically.");
    }

    // Run once after page load
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", injectKeybind, {
        once: true,
      });
    } else {
      injectKeybind();
    }
  })();
})();
