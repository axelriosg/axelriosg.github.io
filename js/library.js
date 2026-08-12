(function () {
  var thoughts = window.APHORISMS || [];
  var lattice = document.getElementById("lattice");
  var stage = document.querySelector(".lib-stage");
  var linesSvg = document.getElementById("lines");
  if (!thoughts.length || !lattice || !stage) return;

  var HEX_W = 148;
  var HEX_H = 128;
  var COL_STEP = HEX_W * 0.75;
  var ROW_STEP = HEX_H;
  var TILE_W = 28;
  var TILE_H = 21;
  var COUNT = thoughts.length;

  var STOP = {
    that: 1, this: 1, with: 1, from: 1, have: 1, were: 1, been: 1, they: 1,
    their: 1, them: 1, your: 1, youre: 1, about: 1, would: 1, could: 1,
    should: 1, there: 1, what: 1, when: 1, where: 1, which: 1, while: 1,
    into: 1, just: 1, like: 1, more: 1, some: 1, than: 1, then: 1, also: 1,
    only: 1, over: 1, such: 1, very: 1, because: 1, para: 1, como: 1,
    cuando: 1, donde: 1, este: 1, esta: 1, estos: 1, estas: 1, eso: 1,
    esa: 1, esos: 1, esas: 1, porque: 1, pero: 1, por: 1, una: 1, uno: 1,
    unos: 1, unas: 1, del: 1, las: 1, los: 1, que: 1, con: 1, sin: 1,
    sobre: 1, entre: 1, hasta: 1, desde: 1, todo: 1, toda: 1, todos: 1,
    todas: 1, algo: 1, alguien: 1, nada: 1, nunca: 1, siempre: 1, muy: 1,
    mas: 1, menos: 1, bien: 1, mal: 1, hay: 1, ser: 1, son: 1, esta: 1,
    estan: 1, tiene: 1, tienen: 1, hacer: 1, hace: 1, puede: 1, pueden: 1,
    debe: 1, debes: 1, cada: 1, otro: 1, otra: 1, otros: 1, otras: 1,
    mismo: 1, misma: 1, mejor: 1, peor: 1, gran: 1, gran: 1, after: 1,
    before: 1, being: 1, will: 1, dont: 1, isnt: 1, arent: 1, was: 1,
    are: 1, and: 1, the: 1, for: 1, not: 1, you: 1, all: 1, but: 1,
    his: 1, her: 1, she: 1, him: 1, who: 1, how: 1, our: 1, out: 1,
    any: 1, had: 1, has: 1, its: 1, let: 1, get: 1, got: 1, too: 1
  };

  function excerpt(text) {
    if (text.length <= 110) return text;
    return text.slice(0, 110).replace(/\s+\S*$/, "") + "…";
  }

  function pad(n) {
    return String(n).padStart(3, "0");
  }

  function tokens(text) {
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .split(/[^a-z0-9]+/)
      .filter(function (w) {
        return w.length > 3 && !STOP[w];
      });
  }

  var tokenSets = thoughts.map(function (t) {
    var set = {};
    tokens(t.text).forEach(function (w) { set[w] = 1; });
    return set;
  });

  var related = thoughts.map(function (_, i) {
    var a = tokenSets[i];
    var scored = [];
    for (var j = 0; j < COUNT; j++) {
      if (j === i) continue;
      var b = tokenSets[j];
      var shared = 0;
      for (var w in a) {
        if (b[w]) shared += 1;
      }
      if (shared) scored.push({ j: j, s: shared });
    }
    scored.sort(function (x, y) { return y.s - x.s; });
    return scored.slice(0, 6).map(function (x) { return x.j; });
  });

  function thoughtAt(q, r) {
    var qq = ((q % TILE_W) + TILE_W) % TILE_W;
    var rr = ((r % TILE_H) + TILE_H) % TILE_H;
    return thoughts[(qq + rr * TILE_W) % COUNT];
  }

  function homeOf(index) {
    return { q: index % TILE_W, r: Math.floor(index / TILE_W) };
  }

  function nearestCopy(index, q, r) {
    var home = homeOf(index);
    var bestQ = home.q;
    var bestR = home.r;
    var best = Infinity;
    for (var dq = -1; dq <= 1; dq++) {
      for (var dr = -1; dr <= 1; dr++) {
        var cq = home.q + dq * TILE_W;
        var cr = home.r + dr * TILE_H;
        var d = (cq - q) * (cq - q) + (cr - r) * (cr - r);
        if (d < best) {
          best = d;
          bestQ = cq;
          bestR = cr;
        }
      }
    }
    return { q: bestQ, r: bestR };
  }

  function hexCenter(q, r) {
    return {
      x: q * COL_STEP + HEX_W / 2 + panX,
      y: r * ROW_STEP + (Math.abs(q) % 2 ? HEX_H / 2 : 0) + HEX_H / 2 + panY
    };
  }

  var panX = stage.clientWidth / 2 - (TILE_W * COL_STEP) / 2;
  var panY = stage.clientHeight / 2 - (TILE_H * ROW_STEP) / 2;
  var targetX = panX;
  var targetY = panY;
  var dragging = false;
  var moved = false;
  var lastX = 0;
  var lastY = 0;
  var active = null;
  var pool = {};
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function ensureHex(q, r) {
    var key = q + ":" + r;
    var el = pool[key];
    if (!el) {
      el = document.createElement("button");
      el.type = "button";
      el.className = "hex";
      el.innerHTML = '<span class="hex__n"></span><p class="hex__text"></p>';
      lattice.appendChild(el);
      pool[key] = el;
    }
    var thought = thoughtAt(q, r);
    el.dataset.q = String(q);
    el.dataset.r = String(r);
    el.dataset.index = String(thought.n - 1);
    el.querySelector(".hex__n").textContent = pad(thought.n);
    el.querySelector(".hex__text").textContent = excerpt(thought.text);
    el.style.left = q * COL_STEP + panX + "px";
    el.style.top = r * ROW_STEP + (Math.abs(q) % 2 ? HEX_H / 2 : 0) + panY + "px";
    el.classList.toggle("is-active", !!(active && active.q === q && active.r === r));
    var rel = false;
    if (active) {
      var wanted = related[active.index] || [];
      for (var i = 0; i < wanted.length; i++) {
        var copy = nearestCopy(wanted[i], active.q, active.r);
        if (copy.q === q && copy.r === r) rel = true;
      }
    }
    el.classList.toggle("is-related", rel);
    el._used = true;
    return el;
  }

  function drawLines() {
    while (linesSvg.firstChild) linesSvg.removeChild(linesSvg.firstChild);
    if (!active) return;
    var from = hexCenter(active.q, active.r);
    var wanted = related[active.index] || [];
    wanted.forEach(function (idx) {
      var copy = nearestCopy(idx, active.q, active.r);
      var to = hexCenter(copy.q, copy.r);
      var line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("class", "lib-line");
      line.setAttribute("x1", from.x);
      line.setAttribute("y1", from.y);
      line.setAttribute("x2", to.x);
      line.setAttribute("y2", to.y);
      linesSvg.appendChild(line);
    });
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
    if (active) {
      needed[active.q + ":" + active.r] = 1;
      (related[active.index] || []).forEach(function (idx) {
        var copy = nearestCopy(idx, active.q, active.r);
        needed[copy.q + ":" + copy.r] = 1;
      });
    }
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
    drawLines();
  }

  function tick() {
    panX += (targetX - panX) * 0.14;
    panY += (targetY - panY) * 0.14;
    render();
    requestAnimationFrame(tick);
  }
  tick();

  stage.addEventListener("pointerdown", function (event) {
    if (event.target.closest(".volume")) return;
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
    if (Math.abs(dx) + Math.abs(dy) > 4) moved = true;
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
  var volumeRelated = document.getElementById("volume-related");

  function openAt(q, r) {
    var thought = thoughtAt(q, r);
    active = { q: q, r: r, index: thought.n - 1 };
    volumeN.textContent = "hexagon " + thought.n + " / " + COUNT;
    volumeText.textContent = thought.text;
    var rel = related[active.index] || [];
    volumeRelated.innerHTML = "";
    if (rel.length) {
      volumeRelated.appendChild(document.createTextNode("connected  "));
      rel.forEach(function (idx) {
        var btn = document.createElement("button");
        btn.type = "button";
        btn.textContent = pad(thoughts[idx].n);
        btn.addEventListener("click", function (event) {
          event.stopPropagation();
          var copy = nearestCopy(idx, active.q, active.r);
          targetX += (active.q - copy.q) * COL_STEP;
          targetY += (active.r - copy.r) * ROW_STEP;
          openAt(copy.q, copy.r);
        });
        volumeRelated.appendChild(btn);
      });
    }
    volume.hidden = false;
  }

  function closeVolume() {
    active = null;
    volume.hidden = true;
  }

  lattice.addEventListener("click", function (event) {
    if (moved) return;
    var hex = event.target.closest(".hex");
    if (!hex) return;
    openAt(Number(hex.dataset.q), Number(hex.dataset.r));
  });

  document.getElementById("volume-close").addEventListener("click", closeVolume);
  window.addEventListener("keydown", function (event) {
    if (event.key === "Escape") closeVolume();
  });

  if (!reduceMotion) {
    setInterval(function () {
      if (dragging || active) return;
      targetX -= 0.35;
      targetY -= 0.18;
    }, 40);
  }
})();
