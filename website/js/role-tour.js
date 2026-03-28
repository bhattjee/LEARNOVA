/**
 * Role-based screenshot tour for tour.html
 * Paths are relative to tour.html (inside /website/).
 */
(function () {
  var TOURS = {
    learner: {
      title: "Learner",
      steps: [
        { src: "screenshots/signuppage.png", label: "Sign up" },
        { src: "screenshots/loginpage.png", label: "Log in" },
        { src: "screenshots/Learner-Images/Learner-Dashabord.png", label: "Learner dashboard" },
        { src: "screenshots/Learner-Images/Learner-courses.png", label: "My courses" },
        { src: "screenshots/Learner-Images/Learner-Total-Courses.png", label: "Course catalog" },
        { src: "screenshots/Learner-Images/Learner-COurse-Main-Section.png", label: "Course experience" },
        { src: "screenshots/Learner-Images/Lerner-Rating.png", label: "Ratings & feedback" },
      ],
    },
    instructor: {
      title: "Instructor",
      steps: [
        { src: "screenshots/signuppage.png", label: "Sign up" },
        { src: "screenshots/loginpage.png", label: "Log in" },
        { src: "screenshots/Instructor-Images/Instrctor-Dashbaord.png", label: "Instructor dashboard" },
        { src: "screenshots/Instructor-Images/Instructor-Dashabord.png", label: "Studio overview" },
        { src: "screenshots/Instructor-Images/Instrcutor-Settings.png", label: "Settings" },
      ],
    },
    admin: {
      title: "Admin",
      steps: [
        { src: "screenshots/signuppage.png", label: "Sign up" },
        { src: "screenshots/loginpage.png", label: "Log in" },
        { src: "screenshots/Admin-Images/Admin-Mainpage.png", label: "Admin dashboard" },
        { src: "screenshots/Admin-Images/Admin-reporting.png", label: "Reporting" },
        { src: "screenshots/Admin-Images/Admin-Settings.png", label: "Settings" },
      ],
    },
  };

  function getRole() {
    var params = new URLSearchParams(window.location.search);
    var r = (params.get("role") || "learner").toLowerCase();
    return TOURS[r] ? r : "learner";
  }

  function updateNavHighlight(role) {
    document.querySelectorAll("a[data-tour-role]").forEach(function (a) {
      var r = a.getAttribute("data-tour-role");
      var on = r === role;
      a.setAttribute("aria-current", on ? "page" : "false");
    });
  }

  function escapeHtml(s) {
    var d = document.createElement("div");
    d.textContent = s;
    return d.innerHTML;
  }

  function throttle(fn, wait) {
    var t;
    return function () {
      var ctx = this;
      var args = arguments;
      clearTimeout(t);
      t = setTimeout(function () {
        fn.apply(ctx, args);
      }, wait);
    };
  }

  function render() {
    var role = getRole();
    updateNavHighlight(role);
    var tour = TOURS[role];
    var main = document.getElementById("tour-main");
    var arrowBtn = document.getElementById("tour-scroll-next");
    var progressEl = document.getElementById("tour-progress-text");
    var indicator = document.getElementById("tour-indicator");
    if (!main || !tour) return;

    document.documentElement.setAttribute("data-tour-role", role);
    var titleEl = document.getElementById("tour-page-title");
    if (titleEl) titleEl.textContent = tour.title + " · Product tour · Learnova";

    main.innerHTML = "";
    tour.steps.forEach(function (step, i) {
      var section = document.createElement("section");
      section.className = "tour-section";
      section.id = "tour-step-" + i;
      section.setAttribute("data-step", String(i));
      section.innerHTML =
        '<div class="tour-section-inner">' +
        '<p class="tour-step-label"><span class="tour-step-num">' +
        (i + 1) +
        "</span> " +
        escapeHtml(step.label) +
        "</p>" +
        '<figure class="tour-figure">' +
        '<img src="' +
        encodeURI(step.src) +
        '" alt="' +
        escapeHtml(step.label) +
        '" loading="' +
        (i < 2 ? "eager" : "lazy") +
        '" />' +
        "</figure>" +
        "</div>";
      main.appendChild(section);
    });

    var sections = main.querySelectorAll(".tour-section");
    var total = sections.length;
    var current = 0;

    function updateDock() {
      if (progressEl) {
        progressEl.textContent = "Step " + (current + 1) + " of " + total;
      }
      if (!arrowBtn) return;

      var label = arrowBtn.querySelector("[data-next-label]");
      var iconWrap = arrowBtn.querySelector("[data-arrow-icon]");
      if (current >= total - 1) {
        arrowBtn.classList.add("tour-arrow--done");
        if (label) {
          label.textContent = "Back to home";
        }
        if (iconWrap) {
          iconWrap.innerHTML = '<i data-lucide="home" class="h-7 w-7" aria-hidden="true"></i>';
        }
        arrowBtn.setAttribute("aria-label", "Back to home");
      } else {
        arrowBtn.classList.remove("tour-arrow--done");
        if (label) {
          label.textContent = "Next screen";
        }
        if (iconWrap) {
          iconWrap.innerHTML = '<i data-lucide="chevron-down" class="h-7 w-7" aria-hidden="true"></i>';
        }
        arrowBtn.setAttribute("aria-label", "Scroll to next screen");
      }
      if (typeof lucide !== "undefined" && lucide.createIcons) {
        lucide.createIcons();
      }
    }

    function computeCurrentFromScroll() {
      var mid = window.innerHeight * 0.35;
      var best = 0;
      var bestDist = Infinity;
      sections.forEach(function (s, i) {
        var r = s.getBoundingClientRect();
        var center = r.top + r.height / 2;
        var dist = Math.abs(center - mid);
        if (r.top < window.innerHeight && r.bottom > 0 && dist < bestDist) {
          bestDist = dist;
          best = i;
        }
      });
      current = best;
      updateDock();
    }

    if (arrowBtn) {
      arrowBtn.addEventListener("click", function () {
        if (current >= total - 1) {
          window.location.href = "index.html";
          return;
        }
        var next = document.getElementById("tour-step-" + (current + 1));
        if (next) {
          next.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      });
    }

    var onScroll = throttle(function () {
      computeCurrentFromScroll();
    }, 80);

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    computeCurrentFromScroll();

    if (indicator) {
      indicator.style.opacity = total > 1 ? "1" : "0.95";
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", render);
  } else {
    render();
  }
})();
