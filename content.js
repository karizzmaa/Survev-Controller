// survev controller extension - content.js
// if u break something its not my fault

(function () {
  "use strict";

  // ---------- controller type stuff ----------
  // had to figure out all these vendor ids myself, took way too long
  // IMPORTANT: if ur controller isnt detected add the vendor id here
  function getControllerType(id) {
    if (!id) return "ps"; // default to ps idk
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

  // ps names - DONT TOUCH these indices they match the gamepad api exactly
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
  // xbox names - same deal
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

  // badge defs for the menu buttons
  const PS_BADGE_DEFS = [
    { id: "btn-start-mode-0", badgeClass: "ctrl-badge-x", symbol: "✕" },
    { id: "btn-start-mode-1", badgeClass: "ctrl-badge-triangle", symbol: "△" },
    { id: "btn-start-mode-2", badgeClass: "ctrl-badge-circle", symbol: "○" },
  ];
  const XBOX_BADGE_DEFS = [
    { id: "btn-start-mode-0", badgeClass: "ctrl-badge-xbox-a", symbol: "A" },
    { id: "btn-start-mode-1", badgeClass: "ctrl-badge-xbox-y", symbol: "Y" },
    { id: "btn-start-mode-2", badgeClass: "ctrl-badge-xbox-b", symbol: "B" },
  ];

  // ---------- default settings ----------
  // IMPORTANT: if u add a new setting put it here too or it wont save/load properly
  const DEFAULT_SETTINGS = {
    enabled: true,
    autoLoot: true,
    consumableWheel: true,
    spamFire: false, // spam fire mode for pistols etc
    blockKeyboard: true, // block kb when controller connected
    hideCursor: true, // hide cursor ingame
    aimSensitivity: 50,
    aimSmoothing: 5,
    leftDeadzone: 15,
    rightDeadzone: 12,
    // hold-to-reload settings
    reloadHold: {
      enabled: true,
      holdMs: 400, // ms u need to hold square before reload fires
    },
    crosshair: {
      style: "cross", // cross | dot | circle | crossdot
      size: 12,
      thickness: 2,
      gap: 4,
      color: "#00ff88",
      opacity: 90,
      strokeColor: "#000000",
      strokeWidth: 0, // 0 = no stroke
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
      btnL3: 10, // L3 -> key 3
      btnR3: 11, // R3 -> drop menu
    },
    menuBinds: {
      playSolo: 0, // cross/A
      playDuo: 3, // triangle/Y
      playSquad: 1, // circle/B
    },
  };

  // ---------- state ----------
  // this is kinda messy but whatever it works
  let settings = JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
  try {
    const saved = localStorage.getItem("ctrl_ext_settings_v2");
    if (saved) settings = deepMerge(DEFAULT_SETTINGS, JSON.parse(saved));
  } catch (e) {
    // localstorage blocked or whatever, just use defaults
  }

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
  let listeningFor = null; // for rebinding

  // hold-to-reload state
  // super trash code but it works, tracks how long square has been held
  let meleeHoldTimer = null;
  let meleeHoldFired = false; // so reload only fires once per hold

  // drop menu
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

  // scope cycling - just cycles through these in order
  const SCOPE_IDS = [
    "ui-scope-1xscope",
    "ui-scope-2xscope",
    "ui-scope-4xscope",
    "ui-scope-8xscope",
    "ui-scope-15xscope",
  ];
  let currentScopeIdx = 0;

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
  // little popup in the corner, works fine dont touch it
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
  // hides the mouse cursor when in game and controller is active
  // kinda hacky with the style injection but whatever
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

  // keyboard blocking - intercepts ALL keydowns when controller is connected
  // IMPORTANT: this uses capture phase so it runs before the game sees the event
  // DO NOT change useCapture to false or it wont work
  function handleKeyboardBlock(e) {
    if (
      !settings.blockKeyboard ||
      controllerIndex === null ||
      !settings.enabled
    )
      return;
    // always let F9 through to open settings
    if (e.key === "F9") return;
    // let browser shortcuts through (ctrl+, alt+, etc)
    if (e.ctrlKey || e.altKey || e.metaKey) return;
    e.stopImmediatePropagation();
    e.preventDefault();
  }
  // attach in capture phase - runs before game's own listeners
  document.addEventListener("keydown", handleKeyboardBlock, true);
  document.addEventListener("keyup", handleKeyboardBlock, true);

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
  // runs every frame, reads gamepad state and does stuff
  // IMPORTANT: keep this lean or youll get input lag
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

      // block everything else when drop menu is up
      if (!dropMenuOpen) {
        handleMovement();
        if (isInGame) handleAiming();
        // fire logic - spam mode or normal hold
        const rtHeld = (gp.buttons[settings.binds.btnFire]?.value || 0) > 0.5;
        if (settings.spamFire) {
          setMouseButtonSpam(rtHeld);
        } else {
          setMouseButtonHeld(rtHeld);
        }
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
  // this function is a mess but it handles basically everything lol
  function onButtonDown(idx) {
    // rebind intercept - has to be first or it wont capture
    if (listeningFor) {
      finishListening(idx);
      return;
    }

    // drop menu eats all inputs
    if (dropMenuOpen) {
      handleDropMenuInput(idx);
      return;
    }

    const b = settings.binds;
    const mb = settings.menuBinds;

    // ---- MENU ONLY (not in game) ----
    // NOTE: these use the menuBinds values which are customizable
    // hardClick tries every possible click method so it should work
    if (!isInGame) {
      if (idx === mb.playSolo) {
        hardClick("btn-start-mode-0");
        return;
      }
      if (idx === mb.playDuo) {
        hardClick("btn-start-mode-1");
        return;
      }
      if (idx === mb.playSquad) {
        hardClick("btn-start-mode-2");
        return;
      }
    }

    // drop menu toggle
    if (idx === b.btnR3 && isInGame) {
      toggleDropMenu();
      return;
    }

    // ---- IN GAME ----
    if (isInGame) {
      if (idx === b.btnInteract) simulateKey("f", "keydown");
      if (idx === b.btnThrowable) simulateKey("4", "keydown");
      if (idx === b.btnPickupOther) simulateKey("j", "keydown");
      if (idx === b.btnR1) simulateKey("q", "keydown");
      if (idx === b.btnL1) simulateKey("c", "keydown");
      if (idx === b.btnL3) simulateKey("3", "keydown");

      // melee + hold-to-reload on same button (square)
      // the hold timer starts on down, if held long enough = reload
      // if released before timeout = melee
      if (idx === b.btnMelee) {
        meleeHoldFired = false;
        if (settings.reloadHold.enabled) {
meleeHoldTimer = setTimeout(() => {
            meleeHoldFired = true;
            simulateKey('r', 'keydown');
            setTimeout(() => simulateKey('r', 'keyup'), 80);
          }, settings.reloadHold.holdMs);
          // don't fire melee yet — wait to see if they hold or tap
        } else {
          // reload hold disabled, just do melee immediately as before
          simulateKey("e", "keydown");
        }
      }

      // dpad down = wheel or direct bandage
      if (idx === b.btnConsWheel) {
        if (settings.consumableWheel) simulateKey("h", "keydown");
        else clickGameEl("ui-loot-bandage");
      }

      // dpad up
      if (idx === b.btnDpadUp) {
        if (!settings.consumableWheel) clickGameEl("ui-loot-healthkit");
      }

      // dpad left = scope cycle (wheel on) or soda (wheel off)
      if (idx === b.btnDpadLeft) {
        if (settings.consumableWheel) cycleScope(-1);
        else clickGameEl("ui-loot-soda");
      }

      // dpad right = scope cycle other way (wheel on) or painkiller (wheel off)
      if (idx === b.btnDpadRight) {
        if (settings.consumableWheel) cycleScope(1);
        else clickGameEl("ui-loot-painkiller");
      }
    }

    // ---- UNIVERSAL ----
    if (idx === b.btnMap) simulateKey("m", "keydown");

    // options = esc toggle
    // first press opens menu, sets quitMode
    // second press closes menu, clears quitMode
    if (idx === b.btnMenu) {
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

    // circle in quitMode = confirm quit
    if (idx === b.btnCircle && isInGame && quitMode) {
      hardClick("btn-game-quit");
      quitMode = false;
    }
  }

  // ---------- button up ----------
  function onButtonUp(idx) {
    if (dropMenuOpen) return;
    const b = settings.binds;

    if (idx === b.btnInteract) simulateKey("f", "keyup");
    if (idx === b.btnThrowable) simulateKey("4", "keyup");
    if (idx === b.btnPickupOther) simulateKey("j", "keyup");
    if (idx === b.btnR1) simulateKey("q", "keyup");
    if (idx === b.btnL1) simulateKey("c", "keyup");
    if (idx === b.btnL3) simulateKey("3", "keyup");
    if (idx === b.btnMap) simulateKey("m", "keyup");
    if (idx === b.btnMenu) simulateKey("Escape", "keyup");
    if (idx === b.btnConsWheel && settings.consumableWheel)
      simulateKey("h", "keyup");

    // melee release logic
    // if the hold timer hasnt fired, clear it (just a tap = melee)
    // if it already fired (reload), ignore
    if (idx === b.btnMelee) {
      if (meleeHoldTimer) {
        clearTimeout(meleeHoldTimer);
        meleeHoldTimer = null;
      }
      if (!meleeHoldFired) {
        // they released before reload triggered = tap = melee
        simulateKey("e", "keydown");
        setTimeout(() => simulateKey("e", "keyup"), 80);
      }
    }
  }
  // if meleeHoldFired = true, reload already happened, skip melee entirely

  // ---------- scope cycling ----------
  // cycles through 1x 2x 4x 8x 15x, finds whichever is currently active
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
    const hint =
      controllerType === "xbox"
        ? "↑↓ Navigate  •  A = Drop  •  B = Close"
        : "↑↓ Navigate  •  ✕ = Drop  •  ○ = Close";
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
    if (idx === b.btnDpadUp || idx === 12) {
      dropSelectedIdx =
        (dropSelectedIdx - 1 + DROP_ITEMS.length) % DROP_ITEMS.length;
      renderDropList();
    } else if (idx === b.btnConsWheel || idx === 13) {
      dropSelectedIdx = (dropSelectedIdx + 1) % DROP_ITEMS.length;
      renderDropList();
    } else if (idx === b.btnInteract || idx === 0) {
      const target = document.getElementById(DROP_ITEMS[dropSelectedIdx].id);
      if (target) forceRightClick(target);
    } else if (
      idx === b.btnCircle ||
      idx === 1 ||
      idx === b.btnR3 ||
      idx === 11
    ) {
      closeDropMenu();
    }
  }

  // ---------- movement ----------
  // left stick -> WASD, just thresholded not analog
  // tried doing analog force but the game doesnt support it anyway
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
  // right stick moves angle of an invisible circle centered on player
  // sensitivity slider changes the radius of that circle
  // this is way better than free mouse movement for controllers trust
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
  // renders an svg crosshair at the current aim position
  // supports stroke (outline) now too - that was annoying to add
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

  // generates the actual svg for the crosshair
  // stroke renders underneath the main color so it looks like an outline
  function applyCrosshairStyle() {
    if (!crosshairEl) return;
    const c = settings.crosshair;
    const col = c.color;
    const sw = c.strokeWidth || 0;
    const sc = c.strokeColor || "#000000";
    const alpha = (c.opacity / 100).toFixed(2);

    crosshairEl.innerHTML = "";
    crosshairEl.style.cssText = `position:fixed;pointer-events:none;z-index:99997;transform:translate(-50%,-50%);left:${currentMouseX}px;top:${currentMouseY}px;`;

    if (c.style === "dot") {
      const total = c.size + sw * 2;
      crosshairEl.innerHTML = `<svg width="${total}" height="${total}" style="opacity:${alpha};display:block;">
        ${sw > 0 ? `<circle cx="${total / 2}" cy="${total / 2}" r="${c.size / 2 + sw}" fill="${sc}"/>` : ""}
        <circle cx="${total / 2}" cy="${total / 2}" r="${c.size / 2}" fill="${col}"/>
      </svg>`;
    } else if (c.style === "circle") {
      const r = c.size;
      const dim = (r + c.thickness + sw) * 2 + 2;
      const cx = dim / 2;
      crosshairEl.innerHTML = `<svg width="${dim}" height="${dim}" style="opacity:${alpha};display:block;">
        ${sw > 0 ? `<circle cx="${cx}" cy="${cx}" r="${r}" stroke="${sc}" stroke-width="${c.thickness + sw * 2}" fill="none"/>` : ""}
        <circle cx="${cx}" cy="${cx}" r="${r}" stroke="${col}" stroke-width="${c.thickness}" fill="none"/>
      </svg>`;
    } else {
      // cross or crossdot
      const g = c.gap,
        s = c.size,
        t = c.thickness;
      const w = (s + g) * 2 + t + sw * 2;
      const cx = w / 2,
        cy = w / 2;

      // helper renders stroke line then color line on top
      const line = (x1, y1, x2, y2) =>
        (sw > 0
          ? `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${sc}" stroke-width="${t + sw * 2}" stroke-linecap="round"/>`
          : "") +
        `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${col}" stroke-width="${t}" stroke-linecap="round"/>`;

      const lines =
        line(cx, sw, cx, cy - g) + // top
        line(cx, cy + g, cx, w - sw) + // bottom
        line(sw, cy, cx - g, cy) + // left
        line(cx + g, cy, w - sw, cy); // right

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
  // normal hold mode - sends repeated mousedown while held
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

  // spam mode - rapid clicks, good for pistols / semi-auto
  let spamInterval = null;
  let spamActive = false;

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
  // hardClick specifically for menu buttons - uses every method just in case
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
    const r = el.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
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

  // right click for dropping - tries every event type
  // some of these probably dont work but one of them does so whatever
  function forceRightClick(el) {
    const r = el.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    el.dispatchEvent(
      new MouseEvent("contextmenu", {
        bubbles: true,
        cancelable: true,
        view: window,
        clientX: cx,
        clientY: cy,
        button: 2,
        buttons: 2,
      }),
    );
    el.dispatchEvent(
      new MouseEvent("mousedown", {
        bubbles: true,
        cancelable: true,
        view: window,
        clientX: cx,
        clientY: cy,
        button: 2,
        buttons: 2,
      }),
    );
    el.dispatchEvent(
      new MouseEvent("mouseup", {
        bubbles: true,
        cancelable: true,
        view: window,
        clientX: cx,
        clientY: cy,
        button: 2,
        buttons: 2,
      }),
    );
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
    // long press fallback just in case
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
  // IMPORTANT: keyCode is deprecated but survev still uses it so we have to send it
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
    const canvas = document.querySelector('canvas');
    if (canvas) canvas.dispatchEvent(ev);
  }

  // ---------- auto loot ----------
  // watches the interaction description and bursts interact when it matches loot
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
  // the radial menu thing, listens for H key (which we simulate from dpad)
  const slotToId = {
    top: "ui-loot-healthkit",
    bottom: "ui-loot-bandage",
    left: "ui-loot-painkiller",
    right: "ui-loot-soda",
  };
  let wheelOpen = false,
    wheelSlot = null;
  let wheelCX = 0,
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
    const dx = wheelMX - wheelCX;
    const dy = wheelMY - wheelCY;
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
    { key: "btnL3", label: "L3 Stick Click", sub: "3 key (weapon slot)" },
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
    const r =
      controllerType === "xbox"
        ? `<b style="color:#c8d8a0">Left Stick</b> → Move &nbsp;<b style="color:#c8d8a0">Right Stick</b> → Aim<br>
         <b style="color:#c8d8a0">RT</b> → Fire &nbsp;<b style="color:#c8d8a0">LT</b> → Swap Weapon<br>
         <b style="color:#c8d8a0">A</b> → Interact &nbsp;<b style="color:#c8d8a0">Y</b> → Throwable &nbsp;<b style="color:#c8d8a0">X</b> → Melee/Reload<br>
         <b style="color:#c8d8a0">RB</b> → Q &nbsp;<b style="color:#c8d8a0">LB</b> → C<br>
         <b style="color:#c8d8a0">↓ Dpad</b> → Heal/Wheel &nbsp;<b style="color:#c8d8a0">← Dpad</b> → Scope Cycle<br>
         <b style="color:#c8d8a0">LS</b> → Slot 3 &nbsp;<b style="color:#c8d8a0">RS</b> → Drop Menu<br>
         <b style="color:#c8d8a0">View</b> → Map &nbsp;<b style="color:#c8d8a0">Menu</b> → Esc`
        : `<b style="color:#c8d8a0">Left Stick</b> → Move &nbsp;<b style="color:#c8d8a0">Right Stick</b> → Aim<br>
         <b style="color:#c8d8a0">R2</b> → Fire &nbsp;<b style="color:#c8d8a0">L2</b> → Swap Weapon<br>
         <b style="color:#c8d8a0">✕</b> → Interact &nbsp;<b style="color:#c8d8a0">△</b> → Throwable &nbsp;<b style="color:#c8d8a0">□</b> → Melee/Reload<br>
         <b style="color:#c8d8a0">R1</b> → Q &nbsp;<b style="color:#c8d8a0">L1</b> → C<br>
         <b style="color:#c8d8a0">↓ Dpad</b> → Heal/Wheel &nbsp;<b style="color:#c8d8a0">← Dpad</b> → Scope Cycle<br>
         <b style="color:#c8d8a0">L3</b> → Slot 3 &nbsp;<b style="color:#c8d8a0">R3</b> → Drop Menu<br>
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
      <div class="ctrl-section-label">Drop Menu</div>
      <div style="font-size:11px;color:#8aaa50;line-height:1.7;padding:8px 10px;background:rgba(0,0,0,0.2);border-radius:6px;border:1px solid rgba(90,122,48,0.25);">
        Press <b style="color:#c8d8a0">R3/RS</b> to open. Navigate <b style="color:#c8d8a0">↑↓ Dpad</b>,
        confirm with <b style="color:#c8d8a0">${controllerType === "xbox" ? "A" : "✕"}</b>,
        close with <b style="color:#c8d8a0">${controllerType === "xbox" ? "B" : "○"}</b>.
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
    const strokePct = (((c.strokeWidth || 0) / 5) * 100).toFixed(0);
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
        const fp = overlay.querySelector("#ctrl-panel-features");
        if (fp) {
          fp.outerHTML = buildFeaturesPanel();
          setupFeaturesEvents(overlay);
        }
      });

    overlay
      .querySelector("#toggle-reloadHold")
      ?.addEventListener("change", (e) => {
        settings.reloadHold.enabled = e.target.checked;
        const fp = overlay.querySelector("#ctrl-panel-features");
        if (fp) {
          fp.outerHTML = buildFeaturesPanel();
          setupFeaturesEvents(overlay);
        }
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
      const sl = overlay.querySelector(`#slider-${id}`);
      const vl = overlay.querySelector(`#val-${id}`);
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
      const sl = overlay.querySelector(`#slider-${id}`);
      const vl = overlay.querySelector(`#val-${id}`);
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

    // reload hold ms slider
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

    // crosshair style btns
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

    // bind buttons - click to start listening, main loop picks up next press
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

  // separate because features panel rebuilds itself on toggle changes
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
  }

  function updateCrosshairPreview(overlay) {
    const box = overlay.querySelector("#crosshair-preview-box");
    if (!box) return;
    const c = settings.crosshair;
    const col = c.color;
    const sw = c.strokeWidth || 0;
    const sc = c.strokeColor || "#000000";
    const alpha = (c.opacity / 100).toFixed(2);
    let inner = "";

    if (c.style === "dot") {
      const total = c.size + sw * 2;
      inner = `<svg width="${total}" height="${total}" style="opacity:${alpha};display:block;">
        ${sw > 0 ? `<circle cx="${total / 2}" cy="${total / 2}" r="${c.size / 2 + sw}" fill="${sc}"/>` : ""}
        <circle cx="${total / 2}" cy="${total / 2}" r="${c.size / 2}" fill="${col}"/>
      </svg>`;
    } else if (c.style === "circle") {
      const r = c.size,
        dim = (r + c.thickness + sw) * 2 + 2,
        cx = dim / 2;
      inner = `<svg width="${dim}" height="${dim}" style="opacity:${alpha};display:block;">
        ${sw > 0 ? `<circle cx="${cx}" cy="${cx}" r="${r}" stroke="${sc}" stroke-width="${c.thickness + sw * 2}" fill="none"/>` : ""}
        <circle cx="${cx}" cy="${cx}" r="${r}" stroke="${col}" stroke-width="${c.thickness}" fill="none"/>
      </svg>`;
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

  // called from main loop when a button is pressed while listeningFor is set
  function finishListening(buttonIdx) {
    if (!listeningFor) return;
    const { category, key, btn } = listeningFor;
    settings[category][key] = buttonIdx;
    btn.classList.remove("listening");
    btn.textContent = btnName(buttonIdx);
    listeningFor = null;
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
    // inline svg so we dont need the extension assets path
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
    const defs = controllerType === "xbox" ? XBOX_BADGE_DEFS : PS_BADGE_DEFS;
    defs.forEach(({ id, badgeClass, symbol }) => {
      const el = document.getElementById(id);
      if (!el || el.querySelector(".ctrl-btn-badge")) return;
      const badge = document.createElement("span");
      badge.className = `ctrl-btn-badge ${badgeClass}`;
      badge.textContent = symbol;
      el.appendChild(badge);
    });
  }

  // watches for the game ui to appear/change and re-injects stuff
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

  // in case controller was already plugged in when page loaded
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

  // F9 opens settings from anywhere on the page
  document.addEventListener("keydown", (e) => {
    if (e.key === "F9") {
      buildSettingsUI();
      openSettings();
    }
  });
})();
