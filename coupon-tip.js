/* Tooltip u ikonky kupónů (309:10360).
   Sám se ukáže po prvním načtení — až dojede nájezd hlavičky, aby to nebylo
   všechno najednou — a po dobu, co je vidět, drží ikonka pod ním svůj hover
   stav. Klik na kartu je totéž jako klik na ikonku (otevře šuplík), křížek
   ji jen zavře. Otevřené menu, šuplík nebo scroll ji taky zavřou: je to
   pobídka pro první pohled na stránku, ne stálý prvek. */
(function () {
  "use strict";

  var AFTER_BAR_MS = 420;   // pauza po dojetí lišty
  var FALLBACK_MS = 2600;   // pojistka, když se nájezd nedojede
  var HIDE_AFTER_PX = 120;  // uživatel odscrolloval — pobídka doslouzila

  var tip = document.querySelector("[data-coupon-tip]");
  var page = document.querySelector(".page");
  var trigger = document.querySelector("[data-drawer-trigger]");
  if (!tip || !page || !trigger) return;

  var card = tip.querySelector("[data-tip-open]");
  var closeBtn = tip.querySelector("[data-tip-close]");
  var open = false;
  var done = false;

  function setOpen(next) {
    if (open === next) return;
    open = next;
    tip.classList.toggle("is-in", open);
    if (open) trigger.dataset.nudge = "on";
    else delete trigger.dataset.nudge;
  }

  function show() {
    if (done) return;
    done = true;
    if (window.scrollY > HIDE_AFTER_PX) return;
    setOpen(true);
  }

  /* Nájezd lišty pouští carousel, až se doopravdy načte fotka, takže se
     čeká na něj — ne na pevný čas od načtení dokumentu. Pojistka běží
     nezávisle: kdyby se animace nikdy nedojela (uspaná záložka, zaseknutý
     obrázek), tooltip se ukáže i tak. */
  window.setTimeout(show, FALLBACK_MS);

  function armFromIntro() {
    var bar = document.querySelector(".topbar");
    if (!bar) return window.setTimeout(show, AFTER_BAR_MS);
    bar.addEventListener("animationend", function () {
      window.setTimeout(show, AFTER_BAR_MS);
    }, { once: true });
  }

  if (page.dataset.intro === "play") {
    armFromIntro();
  } else {
    new MutationObserver(function (records, obs) {
      if (page.dataset.intro === "play") {
        obs.disconnect();
        armFromIntro();
      }
    }).observe(page, { attributes: true, attributeFilter: ["data-intro"] });
  }

  card.addEventListener("click", function () {
    setOpen(false);
    trigger.click();
  });

  closeBtn.addEventListener("click", function (e) {
    e.stopPropagation();
    setOpen(false);
  });

  document.addEventListener("drawer:toggle", function (e) {
    if (e.detail && e.detail.open) setOpen(false);
  });
  /* Vyhledávací panel tooltip nezavírá — jen ho překryje (má vyšší vrstvu),
     takže po zavření panelu je tooltip pořád na svém místě. */
  document.addEventListener("megamenu:toggle", function (e) {
    if (e.detail && e.detail.open) setOpen(false);
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && open) setOpen(false);
  });
  window.addEventListener("scroll", function () {
    if (open && window.scrollY > HIDE_AFTER_PX) setOpen(false);
  }, { passive: true });
})();
