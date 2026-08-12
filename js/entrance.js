(function () {
  var photos = [
    "images/download.jpeg",
    "images/t1.png",
    "images/t2.png",
    "images/axel.png",
    "images/axel1.png",
    "images/axel2.png"
  ];

  var entrance = document.getElementById("entrance");
  if (!entrance || !window.APHORISMS || !window.APHORISMS.length) {
    document.body.classList.remove("is-locked");
    return;
  }

  function pick(list) {
    return list[Math.floor(Math.random() * list.length)];
  }

  var thought = pick(window.APHORISMS);
  var img = entrance.querySelector(".entrance__photo");
  var aphorism = entrance.querySelector(".entrance__aphorism");
  var folio = entrance.querySelector(".entrance__folio");

  img.src = pick(photos);
  img.alt = "";
  aphorism.textContent = thought.text;
  folio.textContent = thought.n + " / " + window.APHORISMS.length;

  var entered = false;
  function enter() {
    if (entered) return;
    entered = true;
    entrance.classList.add("is-gone");
    document.body.classList.remove("is-locked");
  }

  var enterBtn = entrance.querySelector(".entrance__enter");
  if (enterBtn) enterBtn.addEventListener("click", enter);

  window.addEventListener(
    "wheel",
    function onWheel() {
      enter();
      window.removeEventListener("wheel", onWheel);
    },
    { passive: true }
  );

  window.addEventListener("touchmove", function onTouch() {
    enter();
    window.removeEventListener("touchmove", onTouch);
  }, { passive: true });

  window.addEventListener("keydown", function onKey(event) {
    if (
      event.key === "Enter" ||
      event.key === " " ||
      event.key === "ArrowDown" ||
      event.key === "Escape"
    ) {
      event.preventDefault();
      enter();
      window.removeEventListener("keydown", onKey);
    }
  });
})();
