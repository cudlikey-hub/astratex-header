/* Pásek karet pod USP — šipky pro posun do stran (510:5746).

   Pět karet je 2136 široko, takže se pásek nevejde ani na 1920 a bez
   šipek nebylo jak se na poslední dvě dostat: `.page` má
   `overflow-x: hidden`, takže přetékající karty jen zmizely.

   Posouvá se o jednu obrazovku, ale ne na doraz — poslední viditelná
   karta zůstane na druhém konci jako záchytný bod, stejně jako to dělají
   pásky doporučených ve vyhledávání.

   Tady se jen hlídá, na kterém kraji pásek stojí, a podle toho se šipka
   vypne. Zbytek (odkrytí pod kurzorem, zmizení vypnuté) je v CSS. */
(function () {
  "use strict";

  var row = document.querySelector(".storiesRow");
  if (!row) return;

  var track = row.querySelector(".stories");
  var prev = row.querySelector("[data-stories-prev]");
  var next = row.querySelector("[data-stories-next]");
  if (!track || !prev || !next) return;

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)");

  function sync() {
    // Zaokrouhlení v prohlížečích dělá i půlpixelové zbytky.
    prev.disabled = track.scrollLeft <= 1;
    next.disabled = track.scrollLeft >= track.scrollWidth - track.clientWidth - 1;
  }

  function page(dir) {
    var card = track.firstElementChild;
    var step = card
      ? Math.max(track.clientWidth - card.offsetWidth, card.offsetWidth)
      : track.clientWidth;
    track.scrollBy({ left: dir * step, behavior: reduced.matches ? "auto" : "smooth" });
  }

  next.addEventListener("click", function () { page(1); });
  prev.addEventListener("click", function () { page(-1); });

  track.addEventListener("scroll", sync, { passive: true });
  window.addEventListener("resize", sync);
  sync();
})();
