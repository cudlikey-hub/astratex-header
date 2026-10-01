/* Nájezd USP sekce. Sloupce se vysunou, až se na ně doopravdy dojede —
   jednou, ne při každém průchodu, aby se sekce při scrollování nahoru
   a dolů nerozblikala. Když prohlížeč IntersectionObserver neumí nebo
   uživatel nechce pohyb, sekce prostě rovnou stojí na místě. */
(function () {
  "use strict";

  var usp = document.querySelector(".usp");
  if (!usp) return;

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced || !("IntersectionObserver" in window)) return;

  usp.dataset.motion = "wait";

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      usp.dataset.motion = "in";
      io.disconnect();
    });
  }, { threshold: 0.35 });

  io.observe(usp);
})();
