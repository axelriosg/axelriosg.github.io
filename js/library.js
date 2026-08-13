(function () {
  var thoughts = window.APHORISMS || [];
  var lattice = document.getElementById("lattice");
  var stage = document.getElementById("stage");
  if (!thoughts.length || !lattice || !stage) return;

  var mobile = window.innerWidth < 720;
  var HEX_W = mobile ? 220 : 180;
  var HEX_H = Math.round(HEX_W * 0.866);
  var COL_STEP = HEX_W * 0.75;
  var ROW_STEP = HEX_H;
  var TILE_W = 28;
  var TILE_H = 21;
  var COUNT = thoughts.length;

  document.documentElement.style.setProperty("--hex-w", HEX_W + "px");
  document.documentElement.style.setProperty("--hex-h", HEX_H + "px");

  function excerpt(text) {
    var max = mobile ? 150 : 120;
    if (text.length <= max) return text;
    return text.slice(0, max).replace(/\s+\S*$/, "") + "…";
  }

  function pad(n) {
    return String(n).padStart(3, "0");
  }

  function hashDay(s) {
    var h = 2166136261;
    var i;
    for (i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function thoughtAt(q, r) {
    var qq = ((q % TILE_W) + TILE_W) % TILE_W;
    var rr = ((r % TILE_H) + TILE_H) % TILE_H;
    return thoughts[(qq + rr * TILE_W) % COUNT];
  }

  function isOddCol(q) {
    return ((q % 2) + 2) % 2 === 1;
  }

  var now = new Date();
  var dayKey = now.getFullYear() + "-" + (now.getMonth() + 1) + "-" + now.getDate();
  var todayIndex = hashDay(dayKey) % COUNT;
  var todayN = thoughts[todayIndex].n;
  var todayQ = todayIndex % TILE_W;
  var todayR = Math.floor(todayIndex / TILE_W);

  function cellLeft(q) {
    return q * COL_STEP;
  }

  function cellTop(q, r) {
    return r * ROW_STEP + (isOddCol(q) ? HEX_H / 2 : 0);
  }

  function hexCenter(q, r) {
    return {
      x: cellLeft(q) + HEX_W / 2 + panX,
      y: cellTop(q, r) + HEX_H / 2 + panY
    };
  }

  function centerOn(q, r) {
    targetX = stage.clientWidth / 2 - cellLeft(q) - HEX_W / 2;
    targetY = stage.clientHeight / 2 - cellTop(q, r) - HEX_H / 2;
  }

  var panX = 0;
  var panY = 0;
  var targetX = 0;
  var targetY = 0;
  centerOn(todayQ, todayR);
  panX = targetX;
  panY = targetY;
  var dragging = false;
  var moved = false;
  var lastX = 0;
  var lastY = 0;
  var active = null;
  var pool = {};
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function atmosphere(q, r) {
    var c = hexCenter(q, r);
    var dx = c.x - stage.clientWidth / 2;
    var dy = c.y - stage.clientHeight / 2;
    var dist = Math.sqrt(dx * dx + dy * dy);
    var radius = Math.max(stage.clientWidth, stage.clientHeight) * 0.62;
    var t = Math.min(1, dist / radius);
    return {
      opacity: Math.max(0.4, 1 - t * 0.55)
    };
  }

  function ensureHex(q, r) {
    var key = q + ":" + r;
    var el = pool[key];
    if (!el) {
      el = document.createElement("button");
      el.type = "button";
      el.className = "hex";
      el.innerHTML =
        '<svg class="hex__shape" viewBox="0 0 200 173" aria-hidden="true"><polygon points="50,2 150,2 198,86.5 150,171 50,171 2,86.5"/></svg>' +
        '<span class="hex__content"><span class="hex__n"></span><p class="hex__text"></p></span>';
      lattice.appendChild(el);
      pool[key] = el;
    }
    var thought = thoughtAt(q, r);
    var air = atmosphere(q, r);
    var isActive = !!(active && active.q === q && active.r === r);
    var isToday = thought.n === todayN;
    el.dataset.q = String(q);
    el.dataset.r = String(r);
    el.querySelector(".hex__n").textContent = isToday ? "today" : pad(thought.n);
    el.querySelector(".hex__text").textContent = excerpt(thought.text);
    el.style.left = cellLeft(q) + panX + "px";
    el.style.top = cellTop(q, r) + panY + "px";
    el.style.opacity = String(isActive ? 1 : air.opacity);
    el.classList.toggle("is-active", isActive);
    el.classList.toggle("is-today", isToday);
    el.classList.toggle("is-dim", !!(active && !isActive));
    el._used = true;
  }

  function render() {
    var qMin = Math.floor((-panX - HEX_W) / COL_STEP) - 1;
    var qMax = Math.ceil((-panX + stage.clientWidth + HEX_W) / COL_STEP) + 1;
    var rMin = Math.floor((-panY - HEX_H) / ROW_STEP) - 1;
    var rMax = Math.ceil((-panY + stage.clientHeight + HEX_H) / ROW_STEP) + 1;
    var needed = {};
    var q;
    var r;
    for (q = qMin; q <= qMax; q++) {
      for (r = rMin; r <= rMax; r++) {
        needed[q + ":" + r] = 1;
      }
    }
    if (active) needed[active.q + ":" + active.r] = 1;
    Object.keys(pool).forEach(function (key) {
      pool[key]._used = false;
    });
    Object.keys(needed).forEach(function (key) {
      var parts = key.split(":");
      ensureHex(Number(parts[0]), Number(parts[1]));
    });
    Object.keys(pool).forEach(function (key) {
      if (!pool[key]._used) {
        pool[key].remove();
        delete pool[key];
      }
    });
  }

  function tick() {
    panX += (targetX - panX) * 0.14;
    panY += (targetY - panY) * 0.14;
    render();
    requestAnimationFrame(tick);
  }
  tick();

  stage.addEventListener("pointerdown", function (event) {
    if (event.target.closest(".volume") || event.target.closest(".lib-top")) return;
    dragging = true;
    moved = false;
    document.body.classList.add("is-dragging");
    lastX = event.clientX;
    lastY = event.clientY;
  });

  window.addEventListener("pointermove", function (event) {
    if (!dragging) return;
    var dx = event.clientX - lastX;
    var dy = event.clientY - lastY;
    if (Math.abs(dx) + Math.abs(dy) > 6) moved = true;
    targetX += dx;
    targetY += dy;
    lastX = event.clientX;
    lastY = event.clientY;
  });

  window.addEventListener("pointerup", function () {
    dragging = false;
    document.body.classList.remove("is-dragging");
  });

  stage.addEventListener("wheel", function (event) {
    event.preventDefault();
    targetX -= event.deltaX || event.deltaY * 0.35;
    targetY -= event.deltaY;
  }, { passive: false });

  var volume = document.getElementById("volume");
  var volumeN = document.getElementById("volume-n");
  var volumeText = document.getElementById("volume-text");

  function openAt(q, r) {
    var thought = thoughtAt(q, r);
    active = { q: q, r: r };
    document.body.classList.add("is-reading");
    volumeN.textContent = thought.n === todayN ? "today" : "hexagon " + thought.n + " / " + COUNT;
    volumeText.textContent = thought.text;
    volume.hidden = false;
  }

  function goToday() {
    centerOn(todayQ, todayR);
    openAt(todayQ, todayR);
  }

  function closeVolume() {
    active = null;
    volume.hidden = true;
    document.body.classList.remove("is-reading");
  }

  lattice.addEventListener("click", function (event) {
    if (moved) return;
    var hex = event.target.closest(".hex");
    if (!hex) return;
    openAt(Number(hex.dataset.q), Number(hex.dataset.r));
  });

  document.getElementById("volume-close").addEventListener("click", function (event) {
    event.stopPropagation();
    closeVolume();
  });
  document.getElementById("lib-today").addEventListener("click", function (event) {
    event.stopPropagation();
    goToday();
  });
  window.addEventListener("keydown", function (event) {
    if (event.key === "Escape") closeVolume();
  });

  goToday();

  if (!reduceMotion) {
    setInterval(function () {
      if (dragging || active) return;
      targetX -= 0.28;
      targetY -= 0.14;
    }, 40);
  }
})();
