/* Solid header — once the page has scrolled past a small threshold and
   stayed there for a beat, the fixed top bar takes a white ground with
   near-black type and icons. The beat is what keeps it calm: a nudge of the
   wheel that comes straight back never commits, and neither does a scroll
   that only grazes the threshold. */
(function () {
  "use strict";

  var THRESHOLD_PX = 32;   // how far down counts as "scrolled"
  var SETTLE_MS = 220;     // how long the new state must hold before it shows

  var bar = document.querySelector(".topbar");
  if (!bar) return;

  var solid = false;
  var timer = null;

  function wantsSolid() {
    return window.scrollY > THRESHOLD_PX;
  }

  function commit(next) {
    solid = next;
    bar.classList.toggle("is-solid", next);
  }

  function onScroll() {
    var next = wantsSolid();

    // Back where we already are — drop any change that was waiting.
    if (next === solid) {
      if (timer !== null) {
        window.clearTimeout(timer);
        timer = null;
      }
      return;
    }

    // A change is pending; let it keep counting down rather than restart it
    // on every scroll event, or a long smooth scroll would never commit.
    if (timer !== null) return;

    timer = window.setTimeout(function () {
      timer = null;
      if (wantsSolid() !== solid) commit(!solid);
    }, SETTLE_MS);
  }

  // A reload that lands mid-page starts solid straight away.
  commit(wantsSolid());

  window.addEventListener("scroll", onScroll, { passive: true });
})();
