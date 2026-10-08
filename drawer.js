/* Coupon drawer — the coupon icon in the top bar slides the drawer in from
   the right over a dimmer. The × button, the dimmer and Escape close it.
   It keeps focus inside while open and hands it back on the way out, holds
   the page still underneath, and drives the design's slim scroll thumb and
   bottom fade. Announces "drawer:toggle" so the menu and carousel can
   step aside. */
(function () {
  "use strict";

  var trigger = document.querySelector("[data-drawer-trigger]");
  var drawer = trigger && document.getElementById(trigger.getAttribute("aria-controls"));
  var overlay = document.querySelector("[data-drawer-overlay]");
  if (!trigger || !drawer || !overlay) return;

  var scroller = drawer.querySelector(".drawer__scroll");
  var track = drawer.querySelector(".drawer__track");
  var thumb = drawer.querySelector(".drawer__thumb");
  var closeBtn = drawer.querySelector("[data-drawer-close]");

  var open = false;
  var lockedY = 0;
  var returnFocus = null;

  // `restoreFocus: false` when something else is taking over (the mega menu
  // opening), so closing the drawer doesn't pull focus back to the bar.
  function setOpen(next, restoreFocus) {
    if (next === open) return;
    open = next;

    if (open) {
      lockedY = window.scrollY;
      returnFocus = document.activeElement;
      scroller.scrollTop = 0;
    }

    drawer.classList.toggle("is-open", open);
    overlay.classList.toggle("is-open", open);
    drawer.setAttribute("aria-hidden", open ? "false" : "true");
    trigger.setAttribute("aria-expanded", open ? "true" : "false");

    document.dispatchEvent(new CustomEvent("drawer:toggle", { detail: { open: open } }));

    if (open) {
      syncScroll();
      closeBtn.focus({ preventScroll: true });
    } else if (restoreFocus !== false) {
      // Back to where focus was before opening — or to the coupon button
      // when that was nowhere (a mouse click doesn't focus a button in
      // every browser, so it is often <body>).
      var back = returnFocus && returnFocus !== document.body &&
                 document.contains(returnFocus) ? returnFocus : trigger;
      back.focus({ preventScroll: true });
    }
  }

  trigger.addEventListener("click", function () { setOpen(!open); });
  closeBtn.addEventListener("click", function () { setOpen(false); });
  overlay.addEventListener("click", function () { setOpen(false); });

  // The mega menu and the drawer never stack.
  document.addEventListener("megamenu:toggle", function (e) {
    if (e.detail && e.detail.open) setOpen(false, false);
  });
  document.addEventListener("search:toggle", function (e) {
    if (e.detail && e.detail.open) setOpen(false, false);
  });

  /* ------------------------------------------------------ keyboard */
  function focusables() {
    return Array.prototype.filter.call(
      drawer.querySelectorAll("a[href], button:not([disabled]), [tabindex]:not([tabindex='-1'])"),
      function (el) { return el.getClientRects().length > 0; }
    );
  }

  document.addEventListener("keydown", function (e) {
    if (!open) return;

    if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
      return;
    }

    // A modal keeps Tab inside itself.
    if (e.key === "Tab") {
      var items = focusables();
      if (!items.length) return;
      var first = items[0];
      var last = items[items.length - 1];
      if (!drawer.contains(document.activeElement)) {
        e.preventDefault();
        first.focus();
      } else if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  });

  /* ---------------------------------------------------- page hold
     Same approach as the mega menu: the page scrollbar stays where it is,
     and the input that would scroll the page is stopped instead. The
     drawer's own list still scrolls; overscroll-behavior keeps it there. */
  var SCROLL_KEYS = { " ": true, PageUp: true, PageDown: true, Home: true,
                      End: true, ArrowUp: true, ArrowDown: true };

  function listScrolls() {
    return scroller.scrollHeight > scroller.clientHeight + 1;
  }

  function holdPage(e) {
    if (!open) return;
    if (scroller.contains(e.target) && listScrolls()) return;
    e.preventDefault();
  }
  document.addEventListener("wheel", holdPage, { passive: false });
  document.addEventListener("touchmove", holdPage, { passive: false });

  document.addEventListener("keydown", function (e) {
    if (!open || !SCROLL_KEYS[e.key]) return;
    var t = e.target;
    if (e.key === " " && t.tagName === "BUTTON") return;   // Space presses buttons
    if (scroller.contains(t) && listScrolls()) return;
    e.preventDefault();
  });

  window.addEventListener("scroll", function () {
    if (open && Math.abs(window.scrollY - lockedY) > 2) setOpen(false);
  }, { passive: true });

  /* ---------------------------------------------- thumb and fade
     The native scrollbar is hidden; this 64px thumb stands in for it, as
     drawn in the frame, and can be dragged. The bottom fade hints that
     there is more below, and bows out once there isn't. */
  function syncScroll() {
    var max = scroller.scrollHeight - scroller.clientHeight;
    var scrollable = max > 1;
    drawer.classList.toggle("is-static", !scrollable);
    drawer.classList.toggle("is-at-end", !scrollable || scroller.scrollTop >= max - 1);
    if (!scrollable) return;
    var room = track.clientHeight - thumb.offsetHeight;
    // The last pixel of scroll is often fractional; treat "at the end" as
    // the end, so the thumb lands flush on the bottom of its track.
    var progress = scroller.scrollTop >= max - 1 ? 1 : Math.max(0, scroller.scrollTop / max);
    var y = room > 0 ? room * progress : 0;
    thumb.style.transform = "translateY(" + y.toFixed(2) + "px)";
  }

  scroller.addEventListener("scroll", syncScroll, { passive: true });
  window.addEventListener("resize", syncScroll);

  var drag = null;

  thumb.addEventListener("pointerdown", function (e) {
    if (e.button !== 0) return;
    e.preventDefault();
    thumb.setPointerCapture(e.pointerId);
    drag = { y: e.clientY, top: scroller.scrollTop };
    drawer.classList.add("is-dragging");
  });

  thumb.addEventListener("pointermove", function (e) {
    if (!drag) return;
    var max = scroller.scrollHeight - scroller.clientHeight;
    var room = track.clientHeight - thumb.offsetHeight;
    if (room <= 0 || max <= 0) return;
    scroller.scrollTop = drag.top + ((e.clientY - drag.y) * max) / room;
  });

  function endDrag() {
    if (!drag) return;
    drag = null;
    drawer.classList.remove("is-dragging");
  }
  thumb.addEventListener("pointerup", endDrag);
  thumb.addEventListener("pointercancel", endDrag);

  syncScroll();
})();
