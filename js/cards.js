/*
 * Card behaviour shared by the services and reviews sections:
 *  1. "Більше" — long card text is cut to a few lines with "… Більше" at the end;
 *     clicking expands it ("Згорнути" collapses it again).
 *     Mark a paragraph with data-clamp="DESKTOP/MOBILE" (line counts), default 5/4.
 *  2. Mobile carousel arrows — scroll a [data-slider] track one card at a time.
 *     The arrows are the [data-slider-prev]/[data-slider-next] buttons in the same section.
 */
(function () {
  var desktop = window.matchMedia("(min-width: 900px)");

  function label(key, fallback) {
    var value = window.i18n && window.i18n.t(key);
    return typeof value === "string" ? value : fallback;
  }

  function toggleButton(text, onClick) {
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "link-button";
    btn.textContent = text;
    btn.addEventListener("click", onClick);
    return btn;
  }

  function lineLimit(p) {
    var parts = (p.getAttribute("data-clamp") || "5/4").split("/");
    var desktopLines = parseInt(parts[0], 10) || 5;
    var mobileLines = parseInt(parts[1], 10) || 4;
    return desktop.matches ? desktopLines : mobileLines;
  }

  /* ---------- "Більше" ---------- */
  function layoutClamp(p) {
    var full = p.dataset.full;
    if (full === undefined) {
      full = p.dataset.full = p.textContent.trim();
    }

    if (p.dataset.expanded === "true") {
      p.textContent = full + " ";
      p.appendChild(
        toggleButton(label("common.less", "Згорнути"), function () {
          p.dataset.expanded = "false";
          layoutClamp(p);
        })
      );
      return;
    }

    p.textContent = full;
    var lineHeight = parseFloat(getComputedStyle(p).lineHeight);
    var maxHeight = lineHeight * lineLimit(p) + 1;
    if (p.getBoundingClientRect().height <= maxHeight) return; // fits, no button needed

    function render(count) {
      p.textContent = full.slice(0, count).trimEnd() + "… ";
      p.appendChild(
        toggleButton(label("common.more", "Більше"), function () {
          p.dataset.expanded = "true";
          layoutClamp(p);
        })
      );
    }

    var low = 0;
    var high = full.length;
    while (low < high) {
      var mid = Math.ceil((low + high) / 2);
      render(mid);
      if (p.getBoundingClientRect().height <= maxHeight) low = mid;
      else high = mid - 1;
    }
    render(low);
  }

  function initClamps() {
    var items = document.querySelectorAll("[data-clamp]");
    items.forEach(layoutClamp);

    var timer;
    function relayout() {
      clearTimeout(timer);
      timer = setTimeout(function () {
        items.forEach(function (p) {
          if (p.dataset.expanded !== "true") layoutClamp(p);
        });
      }, 150);
    }
    window.addEventListener("resize", relayout);

    // Web fonts change text widths, so measure again once they have loaded.
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(relayout);
    }
  }

  /* ---------- Carousel arrows (mobile) ---------- */
  function initSlider(track) {
    var scope = track.closest("section") || document;
    var prev = scope.querySelector("[data-slider-prev]");
    var next = scope.querySelector("[data-slider-next]");
    if (!prev || !next) return;

    function step(direction) {
      var first = track.firstElementChild;
      var gap = parseFloat(getComputedStyle(track).columnGap) || 0;
      var distance = first ? first.getBoundingClientRect().width + gap : track.clientWidth;
      track.scrollBy({ left: direction * distance, behavior: "smooth" });
    }

    function updateState() {
      var max = track.scrollWidth - track.clientWidth - 1;
      prev.disabled = track.scrollLeft <= 0;
      next.disabled = track.scrollLeft >= max;
    }

    prev.addEventListener("click", function () {
      step(-1);
    });
    next.addEventListener("click", function () {
      step(1);
    });
    track.addEventListener("scroll", updateState, { passive: true });
    window.addEventListener("resize", updateState);
    updateState();
  }

  function init() {
    initClamps();
    document.querySelectorAll("[data-slider]").forEach(initSlider);
  }

  if (window.i18n) init();
  else document.addEventListener("i18n:ready", init, { once: true });
})();
