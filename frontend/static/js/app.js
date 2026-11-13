/* Роутер, шапка сайта и общие обработчики. */
(function () {
  const ROUTES = {
    "/": { render: () => Views.home, public: true },
    "/services": { render: () => Views.services, public: true },
    "/login": { render: () => Views.login, public: true, guestOnly: true },
    "/register": { render: () => Views.register, public: true, guestOnly: true },
    "/new-order": { render: () => Views.newOrder, roles: ["client", "admin"] },
    "/client": { render: () => Views.client, roles: ["client", "admin"] },
    "/master": { render: () => Views.master, roles: ["master", "admin"] },
    "/admin": { render: () => Views.admin, roles: ["admin"] },
    "/stats": { render: () => Views.stats, roles: ["admin"] },
  };

  const main = document.getElementById("app");
  const header = document.getElementById("site-header");
  const footer = document.getElementById("site-footer");

  function parseHash() {
    let raw = window.location.hash.replace(/^#/, "") || "/";
    if (!raw.startsWith("/")) raw = `/${raw}`;
    const [pathPart, queryPart] = raw.split("?");
    const path = pathPart.replace(/\/+$/, "") || "/";
    const query = {};
    new URLSearchParams(queryPart || "").forEach((value, key) => {
      query[key] = value;
    });
    return { path, query };
  }

  function navigate(path) {
    const target = `#${path}`;
    if (window.location.hash === target) render();
    else window.location.hash = target;
  }

  function roleNav(role) {
    if (role === "admin") {
      return [
        { href: "/admin", label: "Админ-панель", icon: "settings" },
        { href: "/stats", label: "Статистика", icon: "chart" },
      ];
    }
    if (role === "master") return [{ href: "/master", label: "Мои заявки", icon: "wrench" }];
    return [{ href: "/client", label: "Мои заявки", icon: "receipt" }];
  }

  function logoMarkup(extraClass = "") {
    return `<a class="logo ${extraClass}" href="#/">
      <span class="logo-mark">М+</span>
      <span class="logo-text"><b>Мастер+</b><small>ремонтная мастерская</small></span>
    </a>`;
  }

  function renderHeader() {
    const user = API.user;
    const { path } = parseHash();
    const links = [
      { href: "/", label: "Главная" },
      { href: "/services", label: "Услуги" },
      ...(user ? roleNav(user.role) : []),
    ];

    const navLink = (link) => {
      const active = link.href === "/" ? path === "/" : path.startsWith(link.href);
      return `<a href="#${link.href}" class="nav-link ${active ? "is-active" : ""}">
        ${link.icon ? window.icon(link.icon, 15) : ""} ${link.label}
      </a>`;
    };

    const userBlock = user
      ? `<div class="user-menu">
          <button class="user-trigger" data-user-toggle aria-expanded="false">
            <span class="avatar">${UI.initials(user.full_name)}</span>
            <span class="user-trigger-text"><b>${UI.escapeHtml(user.full_name.split(" ")[0])}</b><small>${UI.ROLE_LABELS[user.role]}</small></span>
            ${window.icon("chevron-down", 15)}
          </button>
          <div class="user-dropdown" data-user-dropdown>
            <div class="dropdown-head">
              <span class="avatar">${UI.initials(user.full_name)}</span>
              <div><b>${UI.escapeHtml(user.full_name)}</b><small>${UI.escapeHtml(user.email)}</small></div>
            </div>
            <a href="#${UI.roleHome(user.role)}">${window.icon("user", 16)} Личный кабинет</a>
            ${user.role === "admin" ? `<a href="#/stats">${window.icon("chart", 16)} Статистика</a>` : ""}
            <button type="button" data-logout>${window.icon("logout", 16)} Выйти</button>
          </div>
        </div>`
      : `<a class="btn btn-ghost btn-sm login-link" href="#/login">${window.icon("user", 16)} Войти</a>
         <a class="btn btn-primary btn-sm header-cta" href="#/new-order">Оставить заявку</a>`;

    header.innerHTML = `<div class="container header-inner">
      ${logoMarkup()}
      <nav class="main-nav" aria-label="Основная навигация">
        ${links.map(navLink).join("")}
      </nav>
      <div class="header-actions">
        <a class="header-phone" href="tel:+74951204567">${window.icon("phone", 15)}<span>+7 (495) 120-45-67</span></a>
        ${userBlock}
      </div>
      <button class="burger" data-burger aria-label="Открыть меню" aria-expanded="false">${window.icon("menu", 22)}</button>
    </div>
    <div class="mobile-menu" data-mobile-menu>
      <div class="container">
        <nav class="mobile-nav">
          ${links.map(navLink).join("")}
          <a class="nav-link" href="#/new-order">${window.icon("plus", 15)} Новая заявка</a>
        </nav>
        <div class="mobile-actions">
          ${
            user
              ? `<div class="mobile-user">${window.icon("user", 16)} ${UI.escapeHtml(user.full_name)} · ${UI.ROLE_LABELS[user.role]}</div>
                 <button class="btn btn-ghost btn-block" data-logout>${window.icon("logout", 16)} Выйти</button>`
              : `<a class="btn btn-ghost" href="#/login">Войти</a>
                 <a class="btn btn-primary" href="#/register">Регистрация</a>`
          }
        </div>
        <a class="mobile-phone" href="tel:+74951204567">${window.icon("phone", 15)} +7 (495) 120-45-67</a>
      </div>
    </div>`;

    const burger = header.querySelector("[data-burger]");
    burger.addEventListener("click", () => {
      const open = header.classList.toggle("menu-open");
      burger.setAttribute("aria-expanded", String(open));
      burger.innerHTML = window.icon(open ? "close" : "menu", 22);
    });

    const trigger = header.querySelector("[data-user-toggle]");
    if (trigger) {
      trigger.addEventListener("click", (event) => {
        event.stopPropagation();
        const menu = header.querySelector("[data-user-dropdown]");
        const open = menu.classList.toggle("is-open");
        trigger.setAttribute("aria-expanded", String(open));
      });
    }

    header.querySelectorAll("[data-logout]").forEach((button) => {
      button.addEventListener("click", () => {
        API.clearSession();
        UI.toast("Вы вышли из аккаунта", "info");
        header.classList.remove("menu-open");
        navigate("/");
        renderHeader();
      });
    });
  }

  function renderFooter() {
    footer.innerHTML = `<div class="container footer-top">
      <div class="footer-brand">
        ${logoMarkup("logo-light")}
        <p>Сервисный центр по ремонту цифровой и бытовой техники. Честные цены, оригинальные запчасти и гарантия до 12 месяцев.</p>
        <div class="footer-socials">
          <a href="tel:+74951204567" aria-label="Позвонить">${window.icon("phone", 17)}</a>
          <a href="mailto:hello@master-plus.ru" aria-label="Написать">${window.icon("mail", 17)}</a>
          <a href="#/new-order" aria-label="Оставить заявку">${window.icon("wrench", 17)}</a>
        </div>
      </div>
      <div class="footer-col">
        <h4>Услуги</h4>
        <a href="#/services?category=Смартфоны">Ремонт смартфонов</a>
        <a href="#/services?category=Ноутбуки">Ремонт ноутбуков</a>
        <a href="#/services?category=Планшеты">Ремонт планшетов</a>
        <a href="#/services?category=Бытовая техника">Бытовая техника</a>
        <a href="#/services?category=Аудиотехника">Аудиотехника</a>
      </div>
      <div class="footer-col">
        <h4>Клиентам</h4>
        <a href="#/services">Каталог и цены</a>
        <a href="#/new-order">Оставить заявку</a>
        <a href="#/login">Личный кабинет</a>
        <a href="#/register">Регистрация</a>
      </div>
      <div class="footer-col footer-contacts">
        <h4>Контакты</h4>
        <p>${window.icon("map-pin", 16)} Москва, ул. Техническая, 12</p>
        <a href="tel:+74951204567">${window.icon("phone", 16)} +7 (495) 120-45-67</a>
        <a href="mailto:hello@master-plus.ru">${window.icon("mail", 16)} hello@master-plus.ru</a>
        <p>${window.icon("clock", 16)} Ежедневно, 9:00–21:00</p>
      </div>
    </div>
    <div class="container footer-bottom">
      <span>© ${new Date().getFullYear()} Ремонтная мастерская «Мастер+»</span>
      <span>ИНН 7700000000 · Политика конфиденциальности</span>
    </div>`;
  }

  function unauthorized() {
    const { path, query } = parseHash();
    const suffix = Object.keys(query).length ? `?${new URLSearchParams(query)}` : "";
    API.setNext(`${path}${suffix}`);
    UI.toast("Войдите, чтобы продолжить", "info");
    navigate("/login");
  }

  async function render() {
    const { path, query } = parseHash();
    const route = ROUTES[path];
    const user = API.user;
    renderHeader();

    if (!route) {
      main.innerHTML = `<section class="section"><div class="container">
        <div class="empty-state card not-found">
          <span class="not-found-code">404</span>
          <h1>Страница не найдена</h1>
          <p>Возможно, ссылка устарела или в адресе опечатка.</p>
          <a class="btn btn-primary" href="#/">На главную</a>
        </div>
      </div></section>`;
      window.scrollTo({ top: 0 });
      return;
    }

    if (route.guestOnly && user) {
      navigate(UI.roleHome(user.role));
      return;
    }
    if (route.roles) {
      if (!user) {
        unauthorized();
        return;
      }
      if (!route.roles.includes(user.role)) {
        UI.toast("Этот раздел недоступен для вашей роли", "error");
        navigate("/");
        return;
      }
    }

    document.body.classList.remove("menu-open");
    window.scrollTo({ top: 0 });
    try {
      await route.render()(main, { query, path });
    } catch (error) {
      console.error(error);
      main.innerHTML = `<section class="section"><div class="container">
        <div class="empty-state card">${window.icon("alert", 32)}
          <h3>Что-то пошло не так</h3>
          <p>${UI.escapeHtml(error.message || "Не удалось открыть страницу")}</p>
          <button class="btn btn-ghost" id="reload-page">Попробовать снова</button>
        </div>
      </div></section>`;
      main.querySelector("#reload-page")?.addEventListener("click", render);
    }
  }

  window.App = { navigate, render, parseHash };

  window.addEventListener("hashchange", render);
  window.addEventListener("session:expired", () => {
    UI.toast("Сессия истекла — войдите снова", "info");
    navigate("/login");
    renderHeader();
  });

  // Закрытие меню пользователя по клику вне его.
  document.addEventListener("click", (event) => {
    const menu = header.querySelector("[data-user-dropdown]");
    const trigger = header.querySelector("[data-user-toggle]");
    if (menu && menu.classList.contains("is-open") && !event.target.closest(".user-menu")) {
      menu.classList.remove("is-open");
      trigger?.setAttribute("aria-expanded", "false");
    }
    if (
      header.classList.contains("menu-open") &&
      !event.target.closest("[data-mobile-menu]") &&
      !event.target.closest("[data-burger]")
    ) {
      header.classList.remove("menu-open");
      const burger = header.querySelector("[data-burger]");
      if (burger) {
        burger.innerHTML = window.icon("menu", 22);
        burger.setAttribute("aria-expanded", "false");
      }
    }
  });

  renderFooter();
  render();
})();
