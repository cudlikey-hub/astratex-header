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

/* ----------------------------------------------------------- odpočet
   Čas na tmavé kartě (525:3017) tiká po vteřinách. Výchozí cíl je
   nejbližší půlnoc — formát v návrhu je HH:MM:SS a do dvou číslic se
   vejde jen necelý den. Cíl se přepočítává při každém tiku, takže se po
   půlnoci sám překlopí na další den. Konkrétní termín jde zadat
   v markupu atributem `data-deadline` s datem v ISO.

   Vlastní blok, ať odpočet neskončí jen proto, že by na stránce chyběly
   šipky pásku. */
(function () {
  "use strict";

  var clocks = document.querySelectorAll("[data-countdown]");
  if (!clocks.length) return;

  function pad(n) { return (n < 10 ? "0" : "") + n; }

  function deadline(el) {
    var iso = el.getAttribute("data-deadline");
    if (iso) {
      var set = new Date(iso);
      if (!isNaN(set.getTime())) return set.getTime();
    }
    var midnight = new Date();
    midnight.setHours(24, 0, 0, 0);
    return midnight.getTime();
  }

  function tick() {
    var now = Date.now();
    Array.prototype.forEach.call(clocks, function (el) {
      var left = Math.max(0, Math.floor((deadline(el) - now) / 1000));
      el.textContent =
        pad(Math.floor(left / 3600)) + ":" +
        pad(Math.floor(left / 60) % 60) + ":" +
        pad(left % 60);
      el.setAttribute("datetime", "PT" + Math.floor(left / 3600) + "H" +
        (Math.floor(left / 60) % 60) + "M" + (left % 60) + "S");
    });
    // Příští tik na hranu vteřiny, ať se odpočet nerozejde s hodinami.
    window.setTimeout(tick, 1000 - (Date.now() % 1000));
  }

  tick();
})();
