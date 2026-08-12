(function () {
  var thoughts = window.APHORISMS || [];
  var lattice = document.getElementById("lattice");
  if (!thoughts.length || !lattice) return;

  var HEX_W = 210;
  var HEX_H = 182;
  var COL_STEP = HEX_W * 0.75;
  var ROW_STEP = HEX_H;
  var cols = Math.ceil(Math.sqrt(thoughts.length * 1.2));

  function excerpt(text) {
    if (text.length <= 140) return text;
    return text.slice(0, 140).replace(/\s+\S*$/, "") + "…";
  }

  function pad(n) {
    return String(n).padStart(3, "0");
  }

  thoughts.forEach(function (thought, i) {
    var col = i % cols;
    var row = Math.floor(i / cols);
    var x = col * COL_STEP;
    var y = row * ROW_STEP + (col % 2 ? HEX_H / 2 : 0);
    var cell = document.createElement("button");
    cell.type = "button";
    cell.className = "hex";
    cell.style.left = x + "px";
    cell.style.top = y + "px";
    cell.style.animationDelay = (i % 48) * 0.035 + "s";
    cell.dataset.index = String(i);
    cell.innerHTML =
      '<span class="hex__n">' + pad(thought.n) + "</span>" +
      '<p class="hex__text"></p>';
    cell.querySelector(".hex__text").textContent = excerpt(thought.text);
    lattice.appendChild(cell);
  });

  var fieldW = cols * COL_STEP + HEX_W * 0.25;
  var rows = Math.ceil(thoughts.length / cols);
  var fieldH = rows * ROW_STEP + HEX_H;
  lattice.style.width = fieldW + "px";
  lattice.style.height = fieldH + "px";

  var x = (window.innerWidth - fieldW) / 2;
  var y = (window.innerHeight - fieldH) / 2;
  var targetX = x;
  var targetY = y;
  var dragging = false;
  var lastX = 0;
  var lastY = 0;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function apply() {
    lattice.style.transform = "translate3d(" + x + "px," + y + "px,0)";
  }

  function tick() {
    x += (targetX - x) * 0.12;
    y += (targetY - y) * 0.12;
    apply();
    requestAnimationFrame(tick);
  }
  tick();

  window.addEventListener("pointerdown", function (event) {
    if (event.target.closest(".volume") || event.target.closest(".lib-back")) return;
    dragging = true;
    document.body.classList.add("is-dragging");
    lastX = event.clientX;
    lastY = event.clientY;
  });

  window.addEventListener("pointermove", function (event) {
    if (!dragging) return;
    targetX += event.clientX - lastX;
    targetY += event.clientY - lastY;
    lastX = event.clientX;
    lastY = event.clientY;
  });

  window.addEventListener("pointerup", function () {
    dragging = false;
    document.body.classList.remove("is-dragging");
  });

  window.addEventListener("wheel", function (event) {
    event.preventDefault();
    targetX -= event.deltaX || event.deltaY * 0.4;
    targetY -= event.deltaY;
  }, { passive: false });

  var volume = document.getElementById("volume");
  var volumeN = document.getElementById("volume-n");
  var volumeText = document.getElementById("volume-text");

  function openVolume(thought) {
    volumeN.textContent = "hexagon " + thought.n + " / " + thoughts.length;
    volumeText.textContent = thought.text;
    volume.hidden = false;
  }

  function closeVolume() {
    volume.hidden = true;
  }

  lattice.addEventListener("click", function (event) {
    var hex = event.target.closest(".hex");
    if (!hex) return;
    var thought = thoughts[Number(hex.dataset.index)];
    if (thought) openVolume(thought);
  });

  document.getElementById("volume-close").addEventListener("click", closeVolume);
  volume.addEventListener("click", function (event) {
    if (event.target === volume) closeVolume();
  });
  window.addEventListener("keydown", function (event) {
    if (event.key === "Escape") closeVolume();
  });

  function shuffle() {
    if (reduceMotion) return;
    var hexes = lattice.querySelectorAll(".hex");
    var count = Math.min(11, hexes.length);
    for (var i = 0; i < count; i++) {
      var hex = hexes[Math.floor(Math.random() * hexes.length)];
      var next = thoughts[Math.floor(Math.random() * thoughts.length)];
      hex.dataset.index = String(next.n - 1);
      hex.classList.remove("is-swapping");
      void hex.offsetWidth;
      hex.classList.add("is-swapping");
      hex.querySelector(".hex__n").textContent = pad(next.n);
      hex.querySelector(".hex__text").textContent = excerpt(next.text);
    }
  }

  if (!reduceMotion) setInterval(shuffle, 4200);
})();
