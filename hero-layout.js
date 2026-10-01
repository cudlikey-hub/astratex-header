/* Hero layout switch — the logo toggles the hero between its primary
   full-bleed layout and an inset card (16px in, 16px corners). Every load
   starts full-bleed; the switch is not remembered.

   The morph is CSS (--hero-morph in styles.css), but it is only switched on
   for the duration of a toggle: the hero's height also tracks the window,
   and a standing transition would make it lag behind every resize. */
(function () {
  "use strict";

  var page = document.querySelector(".page");
  var hero = document.querySelector(".hero");
  var toggle = document.querySelector("[data-hero-toggle]");
  if (!page || !hero || !toggle) return;

  var settleTimer = null;

  function endMorph() {
    if (settleTimer !== null) {
      window.clearTimeout(settleTimer);
      settleTimer = null;
    }
    page.classList.remove("is-hero-morphing");
  }

  // The morph's own length, read from CSS, plus a margin — a fallback in
  // case transitionend never arrives (tab in the background, no change).
  function morphMs() {
    var d = getComputedStyle(hero).transitionDuration.split(",")[0];
    var ms = parseFloat(d) * (/ms$/.test(d) ? 1 : 1000);
    return (isFinite(ms) ? ms : 560) + 120;
  }

  toggle.addEventListener("click", function () {
    var inset = page.dataset.hero !== "inset";

    // Transition on first, then the new layout, in the same frame — the
    // incoming style carries the transition, so it animates from here.
    page.classList.add("is-hero-morphing");
    page.dataset.hero = inset ? "inset" : "full";
    toggle.setAttribute("aria-pressed", inset ? "true" : "false");

    if (settleTimer !== null) window.clearTimeout(settleTimer);
    settleTimer = window.setTimeout(endMorph, morphMs());
  });

  hero.addEventListener("transitionend", function (e) {
    if (e.target === hero && e.propertyName === "margin-top") endMorph();
  });
})();
