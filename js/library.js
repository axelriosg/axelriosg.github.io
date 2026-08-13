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
  var COUNT = thoughts.length;
  var DRAG_SLOP = mobile ? 14 : 6;

  document.documentElement.style.setProperty("--hex-w", HEX_W + "px");
  document.documentElement.style.setProperty("--hex-h", HEX_H + "px");

  function excerpt(text) {
    var max = mobile ? 72 : 52;
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

  function hashCoords(q, r) {
    var x = Math.imul(q, 374761393) + Math.imul(r, 668265263);
    x = Math.imul(x ^ (x >>> 16), 2246822519);
    x = Math.imul(x ^ (x >>> 13), 3266489917);
    return (x ^ (x >>> 16)) >>> 0;
  }

  function thoughtAt(q, r) {
    return thoughts[hashCoords(q, r) % COUNT];
  }

  function findIndex(index) {
    var q;
    var r;
    var layer;
    if (hashCoords(0, 0) % COUNT === index) return { q: 0, r: 0 };
    for (layer = 1; layer < 120; layer++) {
      for (q = -layer; q <= layer; q++) {
        if (hashCoords(q, -layer) % COUNT === index) return { q: q, r: -layer };
        if (hashCoords(q, layer) % COUNT === index) return { q: q, r: layer };
      }
      for (r = -layer + 1; r <= layer - 1; r++) {
        if (hashCoords(-layer, r) % COUNT === index) return { q: -layer, r: r };
        if (hashCoords(layer, r) % COUNT === index) return { q: layer, r: r };
      }
    }
    return { q: 0, r: 0 };
  }

  function isOddCol(q) {
    return ((q % 2) + 2) % 2 === 1;
  }

  var now = new Date();
  var dayKey = now.getFullYear() + "-" + (now.getMonth() + 1) + "-" + now.getDate();
  var todayIndex = hashDay(dayKey) % COUNT;
  var todayN = thoughts[todayIndex].n;
  var todayCell = findIndex(todayIndex);
  var todayQ = todayCell.q;
  var todayR = todayCell.r;

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
    dirty = true;
  }

  var panX = 0;
  var panY = 0;
  var targetX = 0;
  var targetY = 0;
  var dragging = false;
  var moved = false;
  var lastX = 0;
  var lastY = 0;
  var active = null;
  var pool = {};
  var dirty = true;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  centerOn(todayQ, todayR);
  panX = targetX;
  panY = targetY;

  function atmosphere(q, r) {
    var c = hexCenter(q, r);
    var dx = c.x - stage.clientWidth / 2;
    var dy = c.y - stage.clientHeight / 2;
    var dist = Math.sqrt(dx * dx + dy * dy);
    var radius = Math.max(stage.clientWidth, stage.clientHeight) * 0.58;
    var t = Math.min(1, dist / radius);
    return {
      opacity: Math.max(0.06, 1 - t * 1.05)
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
    var dx = targetX - panX;
    var dy = targetY - panY;
    if (dx * dx + dy * dy > 0.04) {
      panX += dx * 0.14;
      panY += dy * 0.14;
      dirty = true;
    } else if (panX !== targetX || panY !== targetY) {
      panX = targetX;
      panY = targetY;
      dirty = true;
    }
    if (dirty) {
      render();
      dirty = false;
    }
    requestAnimationFrame(tick);
  }
  tick();

  function endDrag(event) {
    dragging = false;
    document.body.classList.remove("is-dragging");
    if (event && stage.releasePointerCapture) {
      try {
        stage.releasePointerCapture(event.pointerId);
      } catch (err) {}
    }
  }

  stage.addEventListener("pointerdown", function (event) {
    if (event.target.closest(".volume") || event.target.closest(".leaf") || event.target.closest(".lib-top")) return;
    dragging = true;
    moved = false;
    document.body.classList.add("is-dragging");
    lastX = event.clientX;
    lastY = event.clientY;
    if (stage.setPointerCapture) stage.setPointerCapture(event.pointerId);
  });

  window.addEventListener("pointermove", function (event) {
    if (!dragging) return;
    var dx = event.clientX - lastX;
    var dy = event.clientY - lastY;
    if (Math.abs(dx) + Math.abs(dy) > DRAG_SLOP) moved = true;
    if (!moved) return;
    targetX += dx;
    targetY += dy;
    lastX = event.clientX;
    lastY = event.clientY;
    dirty = true;
  });

  window.addEventListener("pointerup", endDrag);
  window.addEventListener("pointercancel", endDrag);

  stage.addEventListener("wheel", function (event) {
    event.preventDefault();
    targetX -= event.deltaX || event.deltaY * 0.35;
    targetY -= event.deltaY;
    dirty = true;
  }, { passive: false });

  var volume = document.getElementById("volume");
  var volumeText = document.getElementById("volume-text");
  var leaf = document.getElementById("leaf");
  var leafDate = document.getElementById("leaf-date");
  var leafText = document.getElementById("leaf-text");
  var months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  leafDate.textContent = now.getDate() + " " + months[now.getMonth()] + " " + now.getFullYear();
  leafText.textContent = thoughts[todayIndex].text;

  function closeAll() {
    active = null;
    volume.hidden = true;
    leaf.hidden = true;
    document.body.classList.remove("is-reading");
    dirty = true;
  }

  function openAt(q, r) {
    var thought = thoughtAt(q, r);
    active = { q: q, r: r };
    document.body.classList.add("is-reading");
    leaf.hidden = true;
    volumeText.textContent = thought.text;
    volume.hidden = false;
    dirty = true;
  }

  function goToday() {
    centerOn(todayQ, todayR);
    active = { q: todayQ, r: todayR };
    document.body.classList.add("is-reading");
    volume.hidden = true;
    leaf.hidden = false;
    dirty = true;
  }

  lattice.addEventListener("click", function (event) {
    if (moved) return;
    var hex = event.target.closest(".hex");
    if (!hex) return;
    openAt(Number(hex.dataset.q), Number(hex.dataset.r));
  });

  stage.addEventListener("click", function (event) {
    if (moved || !active) return;
    if (event.target.closest(".hex") || event.target.closest(".volume") || event.target.closest(".leaf")) return;
    closeAll();
  });

  document.getElementById("volume-close").addEventListener("click", function (event) {
    event.stopPropagation();
    closeAll();
  });
  document.getElementById("leaf-close").addEventListener("click", function (event) {
    event.stopPropagation();
    closeAll();
  });
  document.getElementById("lib-today").addEventListener("click", function (event) {
    event.stopPropagation();
    goToday();
  });
  window.addEventListener("keydown", function (event) {
    if (event.key === "Escape") closeAll();
  });

  window.addEventListener("resize", function () {
    dirty = true;
    if (active) centerOn(active.q, active.r);
  });

  goToday();

  if (!reduceMotion) {
    setInterval(function () {
      if (dragging || active) return;
      targetX -= 0.28;
      targetY -= 0.14;
      dirty = true;
    }, 40);
  }
})();
