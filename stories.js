/* Pásek karet pod USP — šipka pro posun doprava (510:5746).

   Pět karet je 2136 široko, takže se pásek nevejde ani na 1920 a bez
   šipky nebylo jak se na poslední dvě dostat: `.page` má
   `overflow-x: hidden`, takže přetékající karty jen zmizely.

   Posouvá se o jednu obrazovku, ale ne na doraz — poslední viditelná
   karta zůstane na druhém konci jako záchytný bod, stejně jako to dělají
   pásky doporučených ve vyhledávání. Na konci šipka zmizí. */
(function () {
  "use strict";

  var row = document.querySelector(".storiesRow");
  if (!row) return;

  var track = row.querySelector(".stories");
  var next = row.querySelector("[data-stories-next]");
  if (!track || !next) return;

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)");

  function atEnd() {
    // Zaokrouhlení v prohlížečích dělá i půlpixelové zbytky.
    return track.scrollLeft >= track.scrollWidth - track.clientWidth - 1;
  }

  function sync() {
    var done = atEnd();
    row.dataset.end = done ? "1" : "0";
    next.disabled = done;
  }

  next.addEventListener("click", function () {
    var card = track.firstElementChild;
    var step = card
      ? Math.max(track.clientWidth - card.offsetWidth, card.offsetWidth)
      : track.clientWidth;
    track.scrollBy({ left: step, behavior: reduced.matches ? "auto" : "smooth" });
  });

  track.addEventListener("scroll", sync, { passive: true });
  window.addEventListener("resize", sync);
  sync();
})();
