/* Mobilní menu — hamburger v liště otevře přes celou obrazovku sheet
   (node 375:2566). Na rozdíl od mega menu nemusí držet stránku pod sebou:
   překrývá celé okno a scrolluje sám v sobě, `overscroll-behavior: contain`
   v CSS zabrání tomu, aby se scroll na konci přelil na stránku.

   Hlásí se událostí "mobilemenu:toggle" a stejně jako ostatní vrstvy se
   zavře, když se otevře některá z nich. */
(function () {
  "use strict";

  var trigger = document.querySelector("[data-mobile-menu-trigger]");
  var menu = document.querySelector("[data-mobile-menu]");
  if (!trigger || !menu) return;

  var closeBtns = Array.prototype.slice.call(menu.querySelectorAll("[data-mobile-menu-close]"));
  var closeBtn = closeBtns[0];
  var root = menu.querySelector('[data-level-panel="root"]');
  var open = false;

  function setOpen(next, moveFocus) {
    if (next === open) return;
    open = next;

    menu.classList.toggle("is-open", open);
    trigger.setAttribute("aria-expanded", open ? "true" : "false");
    menu.setAttribute("aria-hidden", open ? "false" : "true");

    /* Návrat na první úroveň až po dojetí zavření. Kdyby se přepnul hned,
       podúroveň by odjela doprava a odkryla první — a místo jednoho
       zavření by to vypadalo na dvě po sobě. */
    if (!open) {
      resetPending = true;
      window.clearTimeout(resetTimer);
      resetTimer = window.setTimeout(flushReset, closeMs());
    } else {
      flushReset();   // dokonči úklid po předchozím zavření, nic víc
    }

    document.dispatchEvent(new CustomEvent("mobilemenu:toggle", { detail: { open: open } }));

    if (moveFocus === false) return;
    if (open && closeBtn) {
      // Až po odkrytí — jinak prohlížeč stihne sheet odrolovat.
      window.setTimeout(function () { closeBtn.focus({ preventScroll: true }); }, 180);
    } else if (!open) {
      trigger.focus({ preventScroll: true });
    }
  }

  /* Délku zavření si beru z tokenu, ať se nerozejde s CSS. */
  function closeMs() {
    var v = getComputedStyle(document.documentElement)
      .getPropertyValue("--menu-out").trim();
    var n = parseFloat(v) || 240;
    return /ms$/.test(v) || !/s$/.test(v) ? n : n * 1000;
  }

  var resetTimer = null;
  var resetPending = false;

  /* Dokončí odložený úklid. Volá se i při otevírání, aby menu nikdy
     nezačalo s polohou z minula — ale jen když je co uklízet, jinak by
     přepsal úroveň, se kterou se menu právě otevírá (lupa). */
  function flushReset() {
    if (!resetPending) return;
    resetPending = false;
    resetLevels();
  }

  /* Sheet se vrací na první úroveň a nahoru. Běží to až na schovaném menu,
     takže se přechody na tu chvíli vypnou — jinak by se při rychlém
     znovuotevření dojížděl posun z minula. */
  function resetLevels() {
    window.clearTimeout(resetTimer);
    if (level === "root" && menu.scrollTop === 0 && (!root || root.scrollTop === 0)) return;
    menu.classList.add("is-resetting");
    setLevel("root", false);
    menu.scrollTop = 0;
    if (root) root.scrollTop = 0;
    if (findInput) { findInput.value = ""; setQuery(false); }
    window.requestAnimationFrame(function () {
      window.requestAnimationFrame(function () {
        menu.classList.remove("is-resetting");
      });
    });
  }

  /* ------------------------------------------------------- úrovně
     Druhá úroveň leží vedle první za pravým okrajem a vjíždí zprava;
     první se pod ní odsune doleva. Řídí to jediný atribut na obalu,
     zbytek (posun, viditelnost) je v CSS. */
  var level = "root";

  function setLevel(next, moveFocus) {
    if (next === level) return;
    level = next;
    menu.dataset.level = level;

    var panels = menu.querySelectorAll("[data-level-panel]");
    Array.prototype.forEach.call(panels, function (p) {
      var on = p.getAttribute("data-level-panel") === level;
      p.setAttribute("aria-hidden", on ? "false" : "true");
      // Podúroveň vždy začíná odshora.
      if (on && p !== root) p.scrollTop = 0;
    });

    if (moveFocus === false) return;
    var panel = menu.querySelector('[data-level-panel="' + level + '"]');
    var first = panel && panel.querySelector("[data-mobile-menu-back], [data-mobile-menu-close]");
    if (first) {
      window.setTimeout(function () { first.focus({ preventScroll: true }); }, 180);
    }
  }

  Array.prototype.forEach.call(menu.querySelectorAll("[data-submenu]"), function (item) {
    item.addEventListener("click", function () {
      setLevel(item.getAttribute("data-submenu"));
    });
  });
  Array.prototype.forEach.call(menu.querySelectorAll("[data-mobile-menu-back]"), function (b) {
    b.addEventListener("click", function () { setLevel("root"); });
  });

  trigger.addEventListener("click", function () { setOpen(!open); });

  /* Lupa v liště otevře rovnou úroveň hledání — menu se odkryje shora
     a je v něm hned ta správná obrazovka, bez posunu do strany. */
  var searchTrigger = document.querySelector("[data-search-trigger]");
  if (searchTrigger) {
    searchTrigger.addEventListener("click", function () {
      if (!window.matchMedia("(max-width: 1279px)").matches) return;
      if (open && level === "search") { setOpen(false); return; }
      if (!open) {
        flushReset();                       // nejdřív úklid po minulém zavření
        menu.classList.add("is-resetting");  // a teprve pak skok na hledání
        setLevel("search", false);
        window.requestAnimationFrame(function () {
          window.requestAnimationFrame(function () {
            menu.classList.remove("is-resetting");
          });
        });
        setOpen(true);
      } else {
        setLevel("search");
      }
    });
  }
  closeBtns.forEach(function (b) {
    b.addEventListener("click", function () { setOpen(false); });
  });

  /* Esc vrací o úroveň výš, z první úrovně zavře celé menu. */
  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape" || !open) return;
    if (level !== "root") setLevel("root");
    else setOpen(false);
  });

  /* Menu, vyhledávání a šuplík se nikdy nepřekrývají. */
  document.addEventListener("search:toggle", function (e) {
    if (e.detail && e.detail.open) setOpen(false, false);
  });
  document.addEventListener("drawer:toggle", function (e) {
    if (e.detail && e.detail.open) setOpen(false, false);
  });
  document.addEventListener("megamenu:toggle", function (e) {
    if (e.detail && e.detail.open) setOpen(false, false);
  });

  /* ------------------------------------------------- nájezd po položkách
     Každá úroveň si své prvky očísluje sama v pořadí, v jakém jsou na
     obrazovce — ručně psaná čísla v markupu by se při každé přidané
     položce musela přepisovat a je jich tu přes čtyřicet. Stav s dotazem
     má vlastní mechaniku (spouští ho dotaz, ne vstup do úrovně), proto se
     vynechává. */
  var REVEAL = [
    ".mobileMenu__top",
    ".mobileTabs",
    ".mobileCat",
    ".mobileSub__title",
    ".mobileMenu__labelRow",
    ".mobileMenu__label",
    ".mobileSubCat",
    ".mobileChips > .mobileChip",
    ".mobileLink",
    ".mobileFind__bar",
    ".mobileFind__head",
    ".mobileFind__chips",
    ".mobileHit",
    ".mobileMenu__tiles"
  ].join(",");

  Array.prototype.forEach.call(menu.querySelectorAll("[data-level-panel]"), function (panel) {
    var chosen = [];
    Array.prototype.forEach.call(panel.querySelectorAll(REVEAL), function (el) {
      if (el.closest('[data-state="results"]')) return;        // vlastní nájezd
      if (chosen.some(function (c) { return c.contains(el); })) return;  // už jede s rodičem
      el.classList.add("mobileMenu__reveal");
      el.style.setProperty("--i", chosen.length);
      chosen.push(el);
    });
  });

  /* ------------------------------------------------- stav hledání
     Prázdné pole = historie a doporučené, cokoli napsaného = nalezené
     produkty a odkazy. Přepíná se jediným atributem, zbytek řeší CSS. */
  var find = menu.querySelector(".mobileFind");
  var findInput = menu.querySelector("[data-mobile-find-input]");
  var findWipe = menu.querySelector("[data-mobile-find-wipe]");

  function setQuery(hasText) {
    if (!find) return;
    var next = hasText ? "1" : "0";
    if (find.dataset.query === next) return;
    find.dataset.query = next;
  }

  if (findInput) {
    findInput.addEventListener("input", function () {
      setQuery(findInput.value.trim() !== "");
    });
  }
  if (findWipe && findInput) {
    findWipe.addEventListener("click", function () {
      findInput.value = "";
      setQuery(false);
      findInput.focus({ preventScroll: true });
    });
  }

  /* „Vymazat historii" sundá celý blok naposledy hledaných — stejně jako
     na desktopu je to jen pro tenhle běh, po načtení stránky je zpátky. */
  var clear = menu.querySelector("[data-level-panel='search'] .mobileFind__clear");
  if (clear) {
    clear.addEventListener("click", function () {
      var block = clear.closest(".mobileFind__block");
      if (block) block.remove();
    });
  }

  /* Záložky oddělení. Návrh kreslí jen obsah pro Dámské, takže přepnutí
     zatím jen přenese aktivní stav — seznam kategorií zůstává. */
  var tabs = Array.prototype.slice.call(menu.querySelectorAll(".mobileTab"));
  tabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
      tabs.forEach(function (t) {
        var on = t === tab;
        t.classList.toggle("is-active", on);
        t.setAttribute("aria-selected", on ? "true" : "false");
      });
    });
  });
})();
