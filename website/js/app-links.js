/**
 * Links static marketing pages to the Learnova SPA.
 * Override the app origin before this file loads, e.g.:
 *   <script>window.LEARNOVA_APP_BASE = "https://app.yoursite.com";</script>
 *   <script src="js/app-links.js"></script>
 */
(function () {
  var DEFAULT_APP_BASE = "http://localhost:5173";

  function appBase() {
    var b = window.LEARNOVA_APP_BASE || DEFAULT_APP_BASE;
    return String(b).replace(/\/$/, "");
  }

  var ROUTES = {
    login: "/login",
    register: "/register",
    courses: "/courses",
    admin: "/admin/dashboard",
  };

  function navigate(action) {
    var path = ROUTES[action];
    if (!path) return;
    window.location.href = appBase() + path;
  }

  document.addEventListener("DOMContentLoaded", function () {
    document.body.addEventListener("click", function (e) {
      var el = e.target.closest("[data-learnova]");
      if (!el) return;
      var action = el.getAttribute("data-learnova");
      if (!action || !ROUTES[action]) return;
      e.preventDefault();
      navigate(action);
    });

    document.body.addEventListener("keydown", function (e) {
      if (e.key !== "Enter" && e.key !== " ") return;
      var el = e.target.closest("[data-learnova]");
      if (!el) return;
      var tag = el.tagName;
      if (tag === "A" || tag === "BUTTON") return;
      var action = el.getAttribute("data-learnova");
      if (!action || !ROUTES[action]) return;
      e.preventDefault();
      navigate(action);
    });
  });
})();
