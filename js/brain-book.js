(function () {
  var thoughts = window.APHORISMS || [];
  var textEl = document.getElementById("thought-text");
  var folioEl = document.getElementById("thought-folio");
  if (!thoughts.length || !textEl) return;

  var index = 0;

  function show(i) {
    index = ((i % thoughts.length) + thoughts.length) % thoughts.length;
    var thought = thoughts[index];
    textEl.classList.remove("is-revealed");
    void textEl.offsetWidth;
    textEl.textContent = thought.text;
    textEl.classList.add("is-revealed");
    if (folioEl) folioEl.textContent = thought.n + " / " + thoughts.length;
    if (history.replaceState) {
      history.replaceState(null, "", "#" + thought.n);
    }
  }

  var hash = parseInt(String(location.hash || "").replace("#", ""), 10);
  if (hash >= 1 && hash <= thoughts.length) {
    show(hash - 1);
  } else {
    show(Math.floor(Math.random() * thoughts.length));
  }

  var prev = document.getElementById("thought-prev");
  var next = document.getElementById("thought-next");
  var random = document.getElementById("thought-random");

  if (prev) prev.addEventListener("click", function () { show(index - 1); });
  if (next) next.addEventListener("click", function () { show(index + 1); });
  if (random) {
    random.addEventListener("click", function () {
      var nextIndex = index;
      if (thoughts.length > 1) {
        while (nextIndex === index) {
          nextIndex = Math.floor(Math.random() * thoughts.length);
        }
      }
      show(nextIndex);
    });
  }
})();
