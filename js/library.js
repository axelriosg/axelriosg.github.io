(function () {
  var thoughts = window.APHORISMS || [];
  var lattice = document.getElementById("lattice");
  var stage = document.getElementById("stage");
  var linesSvg = document.getElementById("lines");
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
    mas: 1, menos: 1, bien: 1, mal: 1, hay: 1, ser: 1, son: 1,
    estan: 1, tiene: 1, tienen: 1, hacer: 1, hace: 1, puede: 1, pueden: 1,
    debe: 1, debes: 1, cada: 1, otro: 1, otra: 1, otros: 1, otras: 1,
    mismo: 1, misma: 1, mejor: 1, peor: 1, gran: 1, after: 1,
    before: 1, being: 1, will: 1, dont: 1, isnt: 1, arent: 1, was: 1,
    are: 1, and: 1, the: 1, for: 1, not: 1, you: 1, all: 1, but: 1,
    his: 1, her: 1, she: 1, him: 1, who: 1, how: 1, our: 1, out: 1,
    any: 1, had: 1, has: 1, its: 1, let: 1, get: 1, got: 1, too: 1
  };

  function excerpt(text) {
    var max = mobile ? 150 : 120;
    if (text.length <= max) return text;
    return text.slice(0, max).replace(/\s+\S*$/, "") + "…";
  }

  function pad(n) {
    return String(n).padStart(3, "0");
  }

  var ALIAS = {
    love: "amor", ama: "amor", amar: "amor", amas: "amor",
    intelligence: "inteligencia", inteligente: "inteligencia",
    intelligentes: "inteligencia",
    dog: "perro", dogs: "perro", perrito: "perro", chihuahua: "perro",
    chihuahuas: "perro",
    book: "libro", books: "libro", libros: "libro", biblioteca: "libro",
    death: "muerte", morir: "muerte", muero: "muerte",
    alien: "extraterrestre", aliens: "extraterrestre",
    extraterrestres: "extraterrestre",
    agi: "ia", ai: "ia",
    language: "lenguaje", lengua: "lenguaje", idiomas: "lenguaje",
    god: "dios",
    life: "vida", vivir: "vida",
    human: "humano", humans: "humano", humanos: "humano",
    latenscracia: "latenscracia"
  };

  function tokens(text) {
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .split(/[^a-z0-9]+/)
      .filter(function (w) {
        return w.length > 3 && !STOP[w];
      })
      .map(function (w) {
        return ALIAS[w] || w;
      });
  }

  var tokenSets = thoughts.map(function (t) {
    var set = {};
    tokens(t.text).forEach(function (w) { set[w] = 1; });
    return set;
  });

  var df = {};
  tokenSets.forEach(function (set) {
    Object.keys(set).forEach(function (w) {
      df[w] = (df[w] || 0) + 1;
    });
  });

  var NAME = {
    ia: "AGI",
    amor: "love",
    inteligencia: "intelligence",
    perro: "dogs",
    libro: "books",
    muerte: "death",
    extraterrestre: "aliens",
    lenguaje: "language",
    dios: "God",
    vida: "life",
    humano: "humans",
    latenscracia: "Latenscracia"
  };

  function isEnglish(text) {
    return !/[áéíóúñ¿¡]/i.test(text) && !/\b(que|los|las|una|para|como|por|del)\b/i.test(text);
  }

  function doorsAt(q, r) {
    var thought = thoughtAt(q, r);
    var i = thought.n - 1;
    var used = {};
    used[i] = true;
    var doors = [];
    var rare = Object.keys(tokenSets[i]).sort(function (a, b) {
      return (df[a] || 99) - (df[b] || 99);
    });

    var nq = q + 1;
    var neighbor = thoughtAt(nq, r);
    if (!used[neighbor.n - 1]) {
      used[neighbor.n - 1] = true;
      doors.push({
        j: neighbor.n - 1,
        q: nq,
        r: r,
        kind: "the next gallery",
        why: "the hexagon beside this one"
      });
    }

    var theme = rare[0];
    if (theme && doors.length < 3) {
      var best = -1;
      var bestLen = 0;
      for (var j = 0; j < COUNT; j++) {
        if (used[j] || !tokenSets[j][theme]) continue;
        if (thoughts[j].text.length > bestLen) {
          best = j;
          bestLen = thoughts[j].text.length;
        }
      }
      if (best >= 0) {
        used[best] = true;
        var copy = nearestCopy(best, q, r);
        doors.push({
          j: best,
          q: copy.q,
          r: copy.r,
          kind: "a commentary",
          why: "both speak of " + (NAME[theme] || theme)
        });
      }
    }

    if (doors.length < 3) {
      var srcEn = isEnglish(thoughts[i].text);
      var trans = -1;
      var transWord = "";
      for (var k = 0; k < rare.length && trans < 0; k++) {
        var w = rare[k];
        for (var j = 0; j < COUNT; j++) {
          if (used[j] || !tokenSets[j][w]) continue;
          if (isEnglish(thoughts[j].text) !== srcEn) {
            trans = j;
            transWord = w;
            break;
          }
        }
      }
      if (trans >= 0) {
        var copyT = nearestCopy(trans, q, r);
        doors.push({
          j: trans,
          q: copyT.q,
          r: copyT.r,
          kind: "the other tongue",
          why: "the same idea in another language"
        });
      } else if (rare[1]) {
        var theme2 = rare[1];
        for (var j = 0; j < COUNT; j++) {
          if (used[j] || !tokenSets[j][theme2]) continue;
          var copy2 = nearestCopy(j, q, r);
          doors.push({
            j: j,
            q: copy2.q,
            r: copy2.r,
            kind: "another volume",
            why: "both speak of " + (NAME[theme2] || theme2)
          });
          break;
        }
      }
    }

    return doors.slice(0, 3);
  }

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

  function isOddCol(q) {
    return ((q % 2) + 2) % 2 === 1;
  }

  function hexCenter(q, r) {
    return {
      x: q * COL_STEP + HEX_W / 2 + panX,
      y: r * ROW_STEP + (isOddCol(q) ? HEX_H / 2 : 0) + HEX_H / 2 + panY
    };
  }

  var panX = stage.clientWidth / 2 - HEX_W / 2;
  var panY = stage.clientHeight / 2 - HEX_H / 2;
  var targetX = panX;
  var targetY = panY;
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
    var rel = false;
    if (active && active.doors) {
      for (var i = 0; i < active.doors.length; i++) {
        var door = active.doors[i];
        if (door.q === q && door.r === r) rel = true;
      }
    }
    el.dataset.q = String(q);
    el.dataset.r = String(r);
    el.dataset.index = String(thought.n - 1);
    el.querySelector(".hex__n").textContent = pad(thought.n);
    el.querySelector(".hex__text").textContent = excerpt(thought.text);
    el.style.left = q * COL_STEP + panX + "px";
    el.style.top = r * ROW_STEP + (isOddCol(q) ? HEX_H / 2 : 0) + panY + "px";
    el.style.opacity = String(isActive || rel ? 1 : air.opacity);
    el.style.transform = "none";
    el.classList.toggle("is-active", isActive);
    el.classList.toggle("is-related", rel);
    el.classList.toggle("is-dim", !!(active && !isActive && !rel));
    el._used = true;
    return el;
  }

  function drawLines() {
    while (linesSvg.firstChild) linesSvg.removeChild(linesSvg.firstChild);
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
      (active.doors || []).forEach(function (door) {
        needed[door.q + ":" + door.r] = 1;
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
  var volumeRelated = document.getElementById("volume-related");

  function openAt(q, r) {
    var thought = thoughtAt(q, r);
    active = { q: q, r: r, index: thought.n - 1, doors: doorsAt(q, r) };
    document.body.classList.add("is-reading");
    volumeN.textContent = "hexagon " + thought.n + " / " + COUNT;
    volumeText.textContent = thought.text;
    volumeRelated.innerHTML = "";
    if (active.doors.length) {
      var lead = document.createElement("li");
      lead.className = "doors-lead";
      lead.textContent = "this gallery opens onto";
      volumeRelated.appendChild(lead);
    }
    active.doors.forEach(function (door) {
      var item = document.createElement("li");
      var btn = document.createElement("button");
      btn.type = "button";
      btn.innerHTML =
        '<span class="door-kind"></span>' +
        '<span class="door-why"></span>' +
        '<span class="door-text"></span>';
      btn.querySelector(".door-kind").textContent = door.kind;
      btn.querySelector(".door-why").textContent = door.why;
      btn.querySelector(".door-text").textContent = excerpt(thoughts[door.j].text);
      btn.addEventListener("click", function (event) {
        event.stopPropagation();
        targetX += (active.q - door.q) * COL_STEP;
        targetY += (active.r - door.r) * ROW_STEP;
        openAt(door.q, door.r);
      });
      item.appendChild(btn);
      volumeRelated.appendChild(item);
    });
    volume.hidden = false;
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
  window.addEventListener("keydown", function (event) {
    if (event.key === "Escape") closeVolume();
  });

  if (!reduceMotion) {
    setInterval(function () {
      if (dragging || active) return;
      targetX -= 0.28;
      targetY -= 0.14;
    }, 40);
  }
})();
