/* Hero carousel — cross-fades the slides, flips the page ink with them and
   stretches the active pagination dot into a bar. Arrows and dots drive it;
   it also advances on its own, holding while someone is reading the copy,
   reaching for a control, tabbing through it, or has the tab in the
   background. */
(function () {
  "use strict";

  var AUTOPLAY_MS = 6000;
  var MIN_RESUME_MS = 1500;   // never flip the slide the instant a hold lifts

  var page = document.querySelector(".page");
  var hero = document.querySelector(".hero");
  if (!page || !hero) return;

  var slides = Array.prototype.slice.call(hero.querySelectorAll(".hero__slide"));
  var sets = Array.prototype.slice.call(hero.querySelectorAll(".hero__set"));
  var dots = Array.prototype.slice.call(hero.querySelectorAll(".dots__dot"));
  var arrows = Array.prototype.slice.call(hero.querySelectorAll(".arrows__btn"));
  if (slides.length < 2) return;

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  var index = slides.findIndex(function (s) { return s.classList.contains("is-active"); });
  if (index < 0) index = 0;

  function show(next) {
    next = (next + slides.length) % slides.length;
    if (next === index) return;

    hero.classList.add("has-switched");   // arms the copy's entrance
    slides[index].classList.remove("is-active");
    slides[next].classList.add("is-active");

    // Headline, subtitle and CTA travel with the photo.
    sets.forEach(function (set, i) {
      var on = i === next;
      set.classList.toggle("is-active", on);
      set.inert = !on;
      set.setAttribute("aria-hidden", on ? "false" : "true");
    });

    dots.forEach(function (dot, i) {
      dot.classList.toggle("dots__dot--active", i === next);
      dot.setAttribute("aria-selected", i === next ? "true" : "false");
    });

    // The photo decides the ink: dark photo -> white type, ivory photo -> black.
    page.dataset.ink = slides[next].dataset.ink || "light";

    index = next;
  }

  /* ---------------------------------------------------------------- autoplay
     A countdown rather than an interval. Every reason to hold is tracked on
     its own, so one source lifting its hold (the tab coming back, focus
     leaving) cannot release another (the pointer still on the arrows). And
     a hold banks the time that was left instead of throwing it away, so
     brushing past a control does not push the next slide back a full cycle. */
  var holds = {};
  var timer = null;
  var dueAt = 0;
  var remaining = AUTOPLAY_MS;

  function isHeld() {
    for (var key in holds) {
      if (holds[key]) return true;
    }
    return false;
  }

  function clearTimer() {
    if (timer !== null) {
      window.clearTimeout(timer);
      timer = null;
    }
  }

  // Start a fresh countdown of `ms`; if something is holding, bank it instead.
  function schedule(ms) {
    clearTimer();
    remaining = ms;
    if (reduced.matches || isHeld()) return;
    dueAt = Date.now() + ms;
    timer = window.setTimeout(advance, ms);
  }

  function advance() {
    timer = null;
    show(index + 1);
    schedule(AUTOPLAY_MS);
  }

  function hold(reason, on) {
    on = Boolean(on);
    if (Boolean(holds[reason]) === on) return;

    var wasHeld = isHeld();
    holds[reason] = on;
    if (isHeld() === wasHeld) return;

    if (!wasHeld) {
      // Going still: bank what was left on the running countdown.
      if (timer !== null) remaining = Math.max(0, dueAt - Date.now());
      clearTimer();
    } else {
      schedule(Math.max(remaining, MIN_RESUME_MS));
    }
  }

  // Someone choosing a slide gets a whole cycle on it.
  function go(step) {
    show(index + step);
    schedule(AUTOPLAY_MS);
  }

  arrows.forEach(function (btn) {
    btn.addEventListener("click", function () {
      go(Number(btn.dataset.dir) || 1);
    });
  });

  dots.forEach(function (dot) {
    dot.addEventListener("click", function () {
      show(Number(dot.dataset.goto) || 0);
      schedule(AUTOPLAY_MS);
    });
  });

  hero.addEventListener("keydown", function (e) {
    if (e.key === "ArrowLeft") { go(-1); e.preventDefault(); }
    if (e.key === "ArrowRight") { go(1); e.preventDefault(); }
  });

  // Hover holds only over what someone reads or reaches for — the copy, the
  // dots and the arrows. The photo fills most of the first screen, so
  // holding on the whole hero would stop the carousel wherever the pointer
  // happened to rest.
  [".hero__stack", ".dots", ".arrows"].forEach(function (selector, i) {
    var zone = hero.querySelector(selector);
    if (!zone) return;
    zone.addEventListener("pointerenter", function () { hold("hover" + i, true); });
    zone.addEventListener("pointerleave", function () { hold("hover" + i, false); });
  });

  // Focus holds only when it came from the keyboard. A mouse click leaves
  // focus sitting on the arrow it pressed, which would otherwise hold the
  // carousel until the next click somewhere else on the page.
  function isKeyboardFocus(el) {
    try {
      return el.matches(":focus-visible");
    } catch (err) {
      return false;
    }
  }
  hero.addEventListener("focusin", function (e) {
    hold("focus", isKeyboardFocus(e.target));
  });
  hero.addEventListener("focusout", function (e) {
    var next = e.relatedTarget;
    if (!next || !hero.contains(next)) hold("focus", false);
  });

  document.addEventListener("visibilitychange", function () {
    hold("hidden", document.hidden);
  });

  // Behind an open mega menu the hero is dimmed; don't keep changing it.
  document.addEventListener("megamenu:toggle", function (e) {
    hold("menu", Boolean(e.detail && e.detail.open));
  });
  document.addEventListener("drawer:toggle", function (e) {
    hold("drawer", Boolean(e.detail && e.detail.open));
  });

  if (reduced.addEventListener) {
    reduced.addEventListener("change", function () { schedule(AUTOPLAY_MS); });
  }

  // Match the off-slide copy's inert state to the markup's starting slide.
  sets.forEach(function (set, i) {
    set.inert = i !== index;
    set.setAttribute("aria-hidden", i === index ? "false" : "true");
  });

  // The top bar's entrance waits for the hero photo rather than for a guessed
  // delay: the photo is several megabytes, and dropping the header in over a
  // blank hero wastes the animation. Fonts too, so the type does not reflow
  // mid-drop. Capped, so a slow or dead image never keeps the header hidden.
  (function playIntro() {
    var INTRO_CAP_MS = 2500;
    var BEAT_MS = 140;        // let the photo land before the bar moves
    var started = false;

    function start() {
      if (started) return;
      started = true;
      window.setTimeout(function () {
        page.dataset.intro = "play";
      }, BEAT_MS);
    }

    var photo = slides[index].querySelector("img");
    var waits = [];

    if (photo && !(photo.complete && photo.naturalWidth)) {
      waits.push(new Promise(function (resolve) {
        photo.addEventListener("load", resolve, { once: true });
        photo.addEventListener("error", resolve, { once: true });
      }));
    }
    if (document.fonts && document.fonts.ready) waits.push(document.fonts.ready);

    Promise.all(waits).then(start);
    window.setTimeout(start, INTRO_CAP_MS);
  })();

  hold("hidden", document.hidden);
  schedule(AUTOPLAY_MS);
})();
