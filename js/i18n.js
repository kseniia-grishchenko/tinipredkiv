/*
 * Tiny translation loader — no dependencies.
 *
 * All page text lives in locales/<lang>.json. Elements opt in with:
 *   data-i18n="key.path"                     -> sets textContent
 *   data-i18n-html="key.path"                -> sets innerHTML (our own trusted text, e.g. <em>)
 *   data-i18n-attr="attr=key.path;attr2=key" -> sets attributes (alt, aria-label, ...)
 *
 * Ukrainian is the default. Another language can be added later by dropping in
 * locales/en.json and choosing it below (the choice logic is deliberately the
 * only thing that will change when localisation is added).
 */
(function () {
  var DEFAULT_LANG = "uk";
  var root = document.documentElement;

  function pickLang() {
    return DEFAULT_LANG;
  }

  function lookup(dict, path) {
    return path.split(".").reduce(function (node, part) {
      return node && node[part] !== undefined ? node[part] : undefined;
    }, dict);
  }

  function apply(dict) {
    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      var value = lookup(dict, el.getAttribute("data-i18n"));
      if (typeof value === "string") el.textContent = value;
    });

    document.querySelectorAll("[data-i18n-html]").forEach(function (el) {
      var value = lookup(dict, el.getAttribute("data-i18n-html"));
      if (typeof value === "string") el.innerHTML = value;
    });

    document.querySelectorAll("[data-i18n-attr]").forEach(function (el) {
      el.getAttribute("data-i18n-attr")
        .split(";")
        .forEach(function (pair) {
          var parts = pair.split("=");
          var value = lookup(dict, (parts[1] || "").trim());
          if (parts[0] && typeof value === "string") el.setAttribute(parts[0].trim(), value);
        });
    });

    var title = lookup(dict, "meta.title");
    if (typeof title === "string") document.title = title;

    var description = lookup(dict, "meta.description");
    var meta = document.querySelector('meta[name="description"]');
    if (meta && typeof description === "string") meta.setAttribute("content", description);
  }

  var lang = pickLang();

  fetch("locales/" + lang + ".json")
    .then(function (res) {
      if (!res.ok) throw new Error("HTTP " + res.status);
      return res.json();
    })
    .then(function (dict) {
      root.lang = lang;
      apply(dict);
      // Other scripts (e.g. services.js) read strings through window.i18n.
      window.i18n = {
        lang: lang,
        t: function (path) {
          return lookup(dict, path);
        }
      };
    })
    .catch(function (err) {
      console.error("Could not load translations:", err);
    })
    .then(function () {
      root.classList.remove("i18n-pending");
      document.dispatchEvent(new CustomEvent("i18n:ready"));
    });
})();
