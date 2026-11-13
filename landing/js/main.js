(function () {
  "use strict";

  var header = document.querySelector("[data-header]");
  var burger = document.querySelector("[data-burger]");
  var menu = document.querySelector("[data-mobile-menu]");

  function setMenu(open) {
    if (!header || !burger) return;
    header.classList.toggle("menu-open", open);
    burger.setAttribute("aria-expanded", String(open));
    burger.setAttribute("aria-label", open ? "Закрыть меню" : "Открыть меню");
  }

  if (burger) {
    burger.addEventListener("click", function () {
      setMenu(!header.classList.contains("menu-open"));
    });
  }

  if (menu) {
    menu.addEventListener("click", function (event) {
      if (event.target.closest("a")) setMenu(false);
    });
  }

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && header && header.classList.contains("menu-open")) {
      setMenu(false);
      if (burger) burger.focus();
    }
  });

  window.addEventListener("resize", function () {
    if (window.innerWidth > 1024) setMenu(false);
  });

  var searchForms = document.querySelectorAll("[data-search]");
  Array.prototype.forEach.call(searchForms, function (form) {
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var input = form.querySelector("input[type='search']");
      if (input) input.focus();
    });
  });

  var year = document.querySelector("[data-year]");
  if (year) year.textContent = String(new Date().getFullYear());
})();
