/* Scroll hint — the pill with the down arrow at the bottom of the hero.
   It waits a few seconds before showing itself, so it reads as an invitation
   rather than part of the furniture, and steps aside the moment the page
   moves. Clicking it scrolls to whatever comes after the hero. */
(function () {
  "use strict";

  var SHOW_AFTER_MS = 3500;   // long enough to take in the photo first
  var HIDE_AFTER_PX = 40;     // any real scroll and the hint has done its job

  var hint = document.querySelector("[data-scroll-hint]");
  var hero = document.querySelector(".hero");
  if (!hint || !hero) return;

  var armed = false;

  function update() {
    hint.classList.toggle("is-in", armed && window.scrollY <= HIDE_AFTER_PX);
  }

  window.setTimeout(function () {
    armed = true;
    update();
  }, SHOW_AFTER_MS);

  window.addEventListener("scroll", update, { passive: true });

  /* Cíl kliknutí: USP sekce těsně pod hlavičkou. Hlavička je fixed, takže
     se odečítá její výška — jinak by prvnímu řádku USP seděla přes obsah.
     Když sekce chybí, spadne se to na spodní hranu hero. */
  hint.addEventListener("click", function () {
    var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var usp = document.querySelector(".usp");
    var bar = parseFloat(
      getComputedStyle(document.documentElement).getPropertyValue("--bar-height")
    ) || 0;
    var target = usp
      ? usp.getBoundingClientRect().top + window.scrollY - bar
      : hero.getBoundingClientRect().bottom + window.scrollY;

    window.scrollTo({ top: Math.round(target), behavior: reduced ? "auto" : "smooth" });
  });
})();
