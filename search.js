/* Vyhledávání — lupa v hlavičce otevře panel pod lištou. Odkrývá se shora
   stejně jako mega menu, sdílí s ním overlay i bílou hlavičku a stejně jako
   ono drží stránku pod sebou na místě. Linka pod polem a obsah si pořadí
   nájezdu řeší v CSS; tady jde jen o otevírání a zavírání. */
(function () {
  "use strict";

  var trigger = document.querySelector("[data-search-trigger]");
  var panel = document.querySelector("[data-search-panel]");
  var overlay = document.querySelector("[data-menu-overlay]");
  var bar = document.querySelector(".topbar");
  if (!trigger || !panel || !overlay || !bar) return;

  var closeBtn = panel.querySelector("[data-search-close]");
  var input = panel.querySelector("[data-search-input]");
  var open = false;
  var lockedY = 0;

  function setOpen(next, moveFocus) {
    if (next === open) return;
    open = next;
    if (open) lockedY = window.scrollY;

    panel.classList.toggle("is-open", open);
    /* Vlastní třídy, ne ty od mega menu: kdyby se sdílely, zavření menu
       po otevření vyhledávání by stáhlo bílou hlavičku i overlay s sebou. */
    overlay.classList.toggle("is-search-open", open);
    bar.classList.toggle("is-search-open", open);

    trigger.setAttribute("aria-expanded", open ? "true" : "false");
    panel.setAttribute("aria-hidden", open ? "false" : "true");

    // Zavřený panel se vrací do výchozího stavu, ať se příště neotevře
    // rovnou s výsledky od minule.
    if (!open && input) {
      input.value = "";
      panel.dataset.query = "0";
    }

    document.dispatchEvent(new CustomEvent("search:toggle", { detail: { open: open } }));

    // Kurzor do pole, ale až po odkrytí — jinak prohlížeč odroluje panel
    // dřív, než se vůbec rozbalí.
    if (open && moveFocus !== false && input) {
      window.setTimeout(function () { input.focus({ preventScroll: true }); }, 180);
    }
  }

  /* ------------------------------------------------------- stav obsahu
     Prázdné pole = historie a doporučené produkty, cokoli napsaného =
     nalezené produkty. Přepíná se jediným atributem; zbytek (včetně
     opakování nájezdu zleva) řeší CSS. */
  function setQuery(hasText) {
    var next = hasText ? "1" : "0";
    if (panel.dataset.query === next) return;
    panel.dataset.query = next;
    document.dispatchEvent(new CustomEvent("search:query", { detail: { query: next } }));
  }

  if (input) {
    input.addEventListener("input", function () {
      setQuery(input.value.trim() !== "");
    });
  }

  trigger.addEventListener("click", function () { setOpen(!open); });

  if (closeBtn) {
    closeBtn.addEventListener("click", function () {
      // Křížek nejdřív uklidí dotaz a vrátí výchozí obsah; teprve když je
      // pole prázdné, zavře celý panel.
      if (input && input.value !== "") {
        input.value = "";
        setQuery(false);
        input.focus({ preventScroll: true });
        return;
      }
      setOpen(false);
      trigger.focus({ preventScroll: true });
    });
  }
  overlay.addEventListener("click", function () { setOpen(false); });

  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape" || !open) return;
    setOpen(false);
    trigger.focus({ preventScroll: true });
  });

  /* ------------------------------------------------- vymazání historie
     Křížek u „Vymazat historii" sundá celý řádek Naposledy hledané. Je to
     jen pro tenhle běh — nic se nikam neukládá, takže po načtení stránky
     je historie zase zpátky. */
  var clearBtn = panel.querySelector("[data-search-clear]");
  if (clearBtn) {
    clearBtn.addEventListener("click", function () {
      var row = clearBtn.closest(".searchRow");
      if (!row) return;

      var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduced) { row.remove(); return; }

      row.classList.add("is-gone");
      var done = false;
      var drop = function () {
        if (done) return;
        done = true;
        row.remove();
      };
      row.addEventListener("transitionend", drop, { once: true });
      window.setTimeout(drop, 400);   // kdyby přechod nedoběhl
    });
  }

  /* ------------------------------------------------ pásek doporučených
     Šipky posouvají pásek o jednu obrazovku. Pravá je vidět vždycky, levá
     se objeví, až se pásek pohne, a na začátku zase zmizí. Pásky jsou dva
     — jeden ve výchozím stavu, druhý mezi výsledky — a každý se obsluhuje
     sám za sebe. */
  var strips = Array.prototype.slice.call(panel.querySelectorAll("[data-strip]"));

  strips.forEach(function (strip) {
    var track = strip.querySelector("[data-strip-track]");
    var prev = strip.querySelector("[data-strip-prev]");
    var next = strip.querySelector("[data-strip-next]");
    if (!track || !prev || !next) return;

    var syncNav = function () {
      prev.hidden = track.scrollLeft <= 1;
    };

    var page = function (dir) {
      // o jednu obrazovku, ale ať poslední viditelná karta zůstane
      // na druhém konci jako záchytný bod
      var card = track.firstElementChild;
      var step = card
        ? Math.max(track.clientWidth - card.offsetWidth, card.offsetWidth)
        : track.clientWidth;
      track.scrollBy({ left: dir * step, behavior: "smooth" });
    };

    next.addEventListener("click", function () { page(1); });
    prev.addEventListener("click", function () { page(-1); });
    track.addEventListener("scroll", syncNav, { passive: true });

    // Po zavření panelu začíná pásek zase od začátku.
    document.addEventListener("search:toggle", function (e) {
      if (e.detail && !e.detail.open) {
        track.scrollLeft = 0;
        syncNav();
      }
    });

    syncNav();
  });

  /* ----------------------------------------------- video místo fotky
     Dvě cesty, jak se video pustí: sama od sebe jako ukázka (ta má upoutat
     pozornost) a na najetí myší. Vždycky hraje **nejvýš jedno** — kdo
     přijde, toho předchozí pustí a vrátí se k fotce. Platí to pro oba
     stavy panelu; ukázka se vybírá jen z karet, které jsou právě vidět.

     Videa se nestahují dopředu (`preload="none"`): je jich pět po ~15 MB
     a bez spuštění nemají proč zatěžovat. Dotykových zařízení se to
     netýká, hover tam není. */
  var ATTRACT_FIRST = 900;    // než se po otevření panelu rozjede první
  var ATTRACT_GAP = 1200;     // pauza mezi ukázkami
  var ATTRACT_AFTER_HOVER = 1600;

  if (window.matchMedia("(hover: hover)").matches) {
    var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    var cards = Array.prototype.slice
      .call(panel.querySelectorAll(".searchCard"))
      .filter(function (c) { return c.querySelector(".searchCard__video"); });

    var playing = null;      // právě hrající video
    var lastTeased = null;   // ať ukázka nespustí dvakrát po sobě totéž
    var hovered = null;
    var attractTimer = null;

    var stop = function () {
      if (!playing) return;
      playing.pause();
      playing.currentTime = 0;
      playing.classList.remove("is-on");
      playing.loop = false;
      playing = null;
    };

    var start = function (video, loop, markAttract) {
      stop();
      playing = video;
      video.loop = loop;
      if (markAttract) video.classList.add("is-on");
      var p = video.play();
      if (p && p.catch) p.catch(function () { stop(); });
    };

    /* Schovaný stav panelu nemá `offsetParent` — karty z něj do výběru
       nepatří, stejně jako ty, které jsou zrovna odsunuté mimo pásek:
       upoutat pozornost může těžko video, na které není vidět. */
    var shown = function (c) { return c.offsetParent !== null; };

    var inView = function (c) {
      var box = c.parentElement;
      if (!box || box.scrollWidth <= box.clientWidth + 1) return true;
      var b = c.getBoundingClientRect();
      var r = box.getBoundingClientRect();
      return b.left >= r.left - 1 && b.right <= r.right + 1;
    };

    var playAttract = function () {
      /* Když se zrovna nehodí (skrytá záložka, kurzor na kartě, žádná
         karta v záběru), ukázka se nevzdá — jen to zkusí za chvíli znovu.
         Jinak by stačilo jedno nevhodné kolo a už by se nerozjela. */
      if (!open || document.hidden || hovered) {
        if (open && !hovered) scheduleAttract(ATTRACT_GAP);
        return;
      }
      var seen = cards.filter(function (c) { return shown(c) && inView(c); });
      var pool = seen.filter(function (c) { return c !== lastTeased; });
      if (!pool.length) pool = seen;
      if (!pool.length) { scheduleAttract(ATTRACT_GAP); return; }

      var card = pool[Math.floor(Math.random() * pool.length)];
      lastTeased = card;
      var video = card.querySelector(".searchCard__video");

      video.addEventListener("ended", function onEnd() {
        video.removeEventListener("ended", onEnd);
        if (playing === video) stop();
        scheduleAttract(ATTRACT_GAP);
      });
      start(video, false, true);
    };

    var scheduleAttract = function (delay) {
      window.clearTimeout(attractTimer);
      if (reducedMotion.matches) return;
      attractTimer = window.setTimeout(playAttract, delay);
    };

    cards.forEach(function (cardEl) {
      var video = cardEl.querySelector(".searchCard__video");

      cardEl.addEventListener("mouseenter", function () {
        hovered = cardEl;
        window.clearTimeout(attractTimer);
        start(video, true, false);     // pod kurzorem hraje dokola
      });

      cardEl.addEventListener("mouseleave", function () {
        if (hovered !== cardEl) return;
        hovered = null;
        stop();
        scheduleAttract(ATTRACT_AFTER_HOVER);
      });
    });

    document.addEventListener("search:toggle", function (e) {
      var isOpen = e.detail && e.detail.open;
      window.clearTimeout(attractTimer);
      stop();
      hovered = null;
      if (isOpen) scheduleAttract(ATTRACT_FIRST);
    });

    /* Přepnutí stavu vymění karty pod kurzorem i v záběru — ukázka proto
       začíná nanovo. */
    document.addEventListener("search:query", function () {
      window.clearTimeout(attractTimer);
      stop();
      hovered = null;
      lastTeased = null;
      scheduleAttract(ATTRACT_FIRST);
    });

    // Na skryté záložce nemá co hrát.
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) {
        window.clearTimeout(attractTimer);
        stop();
      } else if (open && !hovered) {
        scheduleAttract(ATTRACT_GAP);
      }
    });
  }

  /* Panel, menu a šuplík se nikdy nepřekrývají. */
  document.addEventListener("megamenu:toggle", function (e) {
    if (e.detail && e.detail.open) setOpen(false);
  });
  document.addEventListener("drawer:toggle", function (e) {
    if (e.detail && e.detail.open) setOpen(false);
  });

  /* ------------------------------------------------------------ page hold
     Stejně jako u menu: stránka pod panelem stojí, ale scrollbar zůstává,
     takže se nikde neobjeví nepokrytý pruh. */
  var SCROLL_KEYS = { " ": true, PageUp: true, PageDown: true, Home: true,
                      End: true, ArrowUp: true, ArrowDown: true };

  function panelScrolls() {
    return panel.scrollHeight > panel.clientHeight + 1;
  }

  function holdPage(e) {
    if (!open) return;
    if (panel.contains(e.target) && panelScrolls()) return;
    e.preventDefault();
  }

  document.addEventListener("wheel", holdPage, { passive: false });
  document.addEventListener("touchmove", holdPage, { passive: false });

  document.addEventListener("keydown", function (e) {
    if (!open || !SCROLL_KEYS[e.key]) return;
    var t = e.target;
    if (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) return;
    if (e.key === " " && t.tagName === "BUTTON") return;
    if (panel.contains(t) && panelScrolls()) return;
    e.preventDefault();
  });

  window.addEventListener("scroll", function () {
    if (open && Math.abs(window.scrollY - lockedY) > 2) setOpen(false);
  }, { passive: true });
})();
