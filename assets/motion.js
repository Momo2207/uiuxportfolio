/* PARVALLE — progressive enhancement only.
 *
 * Everything on this site is visible, readable and navigable before this file
 * runs. Nothing here reveals content; JavaScript is never a precondition for
 * reading the page. Two jobs only:
 *   1. the operating-chain rail, the site's single authored motion
 *   2. mobile menu housekeeping (the <details> element does the actual work)
 */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  /* ---- 1. The operating chain fills as it is read ---------------------- */
  function chain() {
    var chainEl = document.querySelector("[data-chain]");
    if (!chainEl) return;

    var rail = chainEl.querySelector(".chain__rail");
    var steps = Array.prototype.slice.call(chainEl.querySelectorAll(".chain__step"));
    if (!rail || !steps.length) return;

    // Reduced motion: show the chain complete and stop. State, not travel.
    if (reduceMotion.matches) {
      rail.style.setProperty("--fill", "100%");
      steps.forEach(function (s) { s.classList.add("is-passed"); });
      return;
    }

    var ticking = false;

    function update() {
      ticking = false;
      var rect = chainEl.getBoundingClientRect();
      var anchor = window.innerHeight * 0.62;           // the reading line
      var progress = (anchor - rect.top) / rect.height;
      progress = Math.max(0, Math.min(1, progress));
      rail.style.setProperty("--fill", (progress * 100).toFixed(2) + "%");

      var mark = rect.top + rect.height * progress;
      steps.forEach(function (step) {
        var r = step.getBoundingClientRect();
        step.classList.toggle("is-passed", r.top + r.height / 2 <= mark + 1);
      });
    }

    function onScroll() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(update);
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    reduceMotion.addEventListener("change", function () {
      window.removeEventListener("scroll", onScroll);
      chain();
    });
    update();
  }

  /* ---- 2. Mobile menu housekeeping ------------------------------------ */
  function menu() {
    var menuEl = document.querySelector("[data-menu]");
    if (!menuEl) return;

    function close() {
      if (menuEl.open) menuEl.removeAttribute("open");
    }

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && menuEl.open) {
        close();
        var summary = menuEl.querySelector("summary");
        if (summary) summary.focus();
      }
    });

    document.addEventListener("click", function (e) {
      if (menuEl.open && !menuEl.contains(e.target)) close();
    });

    menuEl.addEventListener("click", function (e) {
      if (e.target.closest(".menu__panel a")) close();
    });

    window.matchMedia("(min-width: 901px)").addEventListener("change", function (e) {
      if (e.matches) close();
    });
  }

  function init() { chain(); menu(); }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
