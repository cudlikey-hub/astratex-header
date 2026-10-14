/* Nájezd sekcí pod hero — USP a karty. Vysunou se, až se na ně doopravdy
   dojede, a jednou, ne při každém průchodu, aby se při scrollování nahoru
   a dolů nerozblikaly. Když prohlížeč IntersectionObserver neumí nebo
   uživatel nechce pohyb, sekce prostě rovnou stojí na místě. */
(function () {
  "use strict";

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced || !("IntersectionObserver" in window)) return;

  /* Karty jsou širší než okno a poslední z nich se nikdy nedostane celá
     do záběru, proto mají nižší práh než USP. */
  [[".usp", 0.35], [".stories", 0.2]].forEach(function (pair) {
    var el = document.querySelector(pair[0]);
    if (!el) return;

    el.dataset.motion = "wait";

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        el.dataset.motion = "in";
        io.disconnect();
      });
    }, { threshold: pair[1] });

    io.observe(el);
  });
})();
