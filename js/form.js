/*
 * Contact form: validation, sending to Netlify Forms, and the visible states
 * (error under a field, "sending", success, send failure).
 *
 * Netlify detects the form from the HTML (data-netlify="true") when the site is
 * deployed. We then post it with fetch so the page does not reload.
 */
(function () {
  var form = document.querySelector(".contact__form");
  if (!form) return;

  var success = document.querySelector(".contact__success");
  var status = form.querySelector(".contact__status");
  var submit = form.querySelector(".contact__submit");
  var nameField = form.elements.name;
  var emailField = form.elements.email;

  function t(key, fallback) {
    var value = window.i18n && window.i18n.t(key);
    return typeof value === "string" ? value : fallback;
  }

  function errorEl(field) {
    return document.getElementById(field.id + "-error");
  }

  function showError(field, message) {
    var el = errorEl(field);
    el.textContent = message;
    el.hidden = false;
    field.setAttribute("aria-invalid", "true");
  }

  function clearError(field) {
    var el = errorEl(field);
    el.textContent = "";
    el.hidden = true;
    field.removeAttribute("aria-invalid");
  }

  function validate() {
    var firstInvalid = null;

    if (!nameField.value.trim()) {
      showError(nameField, t("contact.form.errorName", "Please enter your name"));
      firstInvalid = firstInvalid || nameField;
    } else {
      clearError(nameField);
    }

    var email = emailField.value.trim();
    if (!email) {
      showError(emailField, t("contact.form.errorEmailEmpty", "Please enter your email"));
      firstInvalid = firstInvalid || emailField;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      showError(emailField, t("contact.form.errorEmailInvalid", "Please check your email"));
      firstInvalid = firstInvalid || emailField;
    } else {
      clearError(emailField);
    }

    return firstInvalid;
  }

  function setSending(isSending) {
    if (submit.dataset.label === undefined) submit.dataset.label = submit.textContent;
    submit.disabled = isSending;
    submit.textContent = isSending ? t("contact.form.sending", "Sending…") : submit.dataset.label;
  }

  function showStatus(message) {
    status.textContent = message;
    status.hidden = !message;
  }

  [nameField, emailField].forEach(function (field) {
    // Once the visitor starts fixing a field, its error goes away.
    field.addEventListener("input", function () {
      if (field.hasAttribute("aria-invalid")) clearError(field);
    });
  });

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    showStatus("");

    var firstInvalid = validate();
    if (firstInvalid) {
      firstInvalid.focus();
      return;
    }

    setSending(true);

    fetch(form.getAttribute("action") || "/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(new FormData(form)).toString()
    })
      .then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status);
        form.hidden = true;
        success.hidden = false;
        success.focus();
        form.reset();
      })
      .catch(function () {
        showStatus(t("contact.form.errorSend", "Could not send the form. Please try again later."));
      })
      .then(function () {
        setSending(false);
      });
  });
})();
