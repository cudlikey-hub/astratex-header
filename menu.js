/* Mega menu — "Dámské" in the top bar opens its sheet under the bar, dims
   the page beneath, turns the bar white with near-black ink and draws the
   1px rule between them. Clicking the trigger again, the dimmer, or Escape
   closes it. It announces itself with a "megamenu:toggle" event so the hero
   carousel can hold still behind it. */
(function () {
  "use strict";

  var trigger = document.querySelector("[data-menu-trigger]");
  var menu = trigger && document.getElementById(trigger.getAttribute("aria-controls"));
  var overlay = document.querySelector("[data-menu-overlay]");
  var bar = document.querySelector(".topbar");
  if (!trigger || !menu || !overlay || !bar) return;

  var open = false;
  var lockedY = 0;

  function setOpen(next) {
    if (next === open) return;
    open = next;
    if (open) lockedY = window.scrollY;

    menu.classList.toggle("is-open", open);
    overlay.classList.toggle("is-open", open);
    bar.classList.toggle("is-menu-open", open);

    trigger.setAttribute("aria-expanded", open ? "true" : "false");
    menu.setAttribute("aria-hidden", open ? "false" : "true");

    document.dispatchEvent(new CustomEvent("megamenu:toggle", { detail: { open: open } }));
  }

  trigger.addEventListener("click", function (e) {
    var opening = !open;
    setOpen(opening);

    // Opened from the keyboard (a click with no pointer behind it): take
    // focus into the sheet, since it sits after the whole bar in tab order.
    if (opening && e.detail === 0) {
      var first = menu.querySelector("a[href]");
      if (first) first.focus({ preventScroll: true });
    }
  });

  overlay.addEventListener("click", function () {
    setOpen(false);
  });

  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape" || !open) return;
    setOpen(false);
    trigger.focus({ preventScroll: true });
  });

  /* ---------------------------------------------------------- page hold
     While the menu is open the page underneath stays put. The scrollbar is
     left exactly where it is — taking it away (overflow: hidden) leaves an
     uncovered strip down the right edge wherever scrollbars take up room —
     so the wheel, touch and keyboard input that would scroll the page is
     stopped instead. The sheet itself still scrolls when it is taller than
     the window; its overscroll-behavior keeps that from reaching the page. */
  var SCROLL_KEYS = { " ": true, PageUp: true, PageDown: true, Home: true,
                      End: true, ArrowUp: true, ArrowDown: true };

  function sheetScrolls() {
    return menu.scrollHeight > menu.clientHeight + 1;
  }

  function holdPage(e) {
    if (!open) return;
    if (menu.contains(e.target) && sheetScrolls()) return;
    e.preventDefault();
  }

  document.addEventListener("wheel", holdPage, { passive: false });
  document.addEventListener("touchmove", holdPage, { passive: false });

  document.addEventListener("keydown", function (e) {
    if (!open || !SCROLL_KEYS[e.key]) return;
    var t = e.target;
    if (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) return;
    if (e.key === " " && t.tagName === "BUTTON") return;   // Space presses buttons
    if (menu.contains(t) && sheetScrolls()) return;
    e.preventDefault();
  });

  // What can't be stopped — dragging the scrollbar, middle-click autoscroll —
  // reads as a wish to get back to the page, so the menu gets out of the way.
  window.addEventListener("scroll", function () {
    if (open && Math.abs(window.scrollY - lockedY) > 2) setOpen(false);
  }, { passive: true });

  // The coupon drawer and the menu never stack.
  document.addEventListener("drawer:toggle", function (e) {
    if (e.detail && e.detail.open) setOpen(false);
  });
})();
