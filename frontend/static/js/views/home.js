/* Главная, каталог услуг, вход/регистрация, новая заявка. */
(function () {
  window.Views = window.Views || {};

  const CATEGORY_ICONS = {
    Смартфоны: "smartphone",
    Ноутбуки: "laptop",
    Планшеты: "tablet",
    "Бытовая техника": "washer",
    Аудиотехника: "headphones",
  };

  function categoryIcon(category) {
    return CATEGORY_ICONS[category] || "wrench";
  }

  function serviceCard(service) {
    return `<article class="service-card reveal">
      <div class="service-top">
        <span class="cat-chip">${window.icon(categoryIcon(service.category), 15)} ${UI.escapeHtml(service.category)}</span>
        <span class="service-days">${window.icon("clock", 14)} ${service.est_days} ${UI.plural(service.est_days, "день", "дня", "дней")}</span>
      </div>
      <h3>${UI.escapeHtml(service.name)}</h3>
      <p>${UI.escapeHtml(service.description)}</p>
      <div class="service-bottom">
        <div class="price"><small>от</small> <b>${UI.money(service.base_price)}</b></div>
        <a class="btn btn-soft btn-sm" href="#/new-order?service=${service.id}">Заказать ${window.icon("arrow-right", 15)}</a>
      </div>
    </article>`;
  }

  function trustStrip() {
    const items = [
      { icon: "calendar", value: "с 2012", label: "года на рынке" },
      { icon: "wrench", value: "18 400+", label: "ремонтов выполнено" },
      { icon: "star", value: "4,9 / 5", label: "рейтинг клиентов" },
      { icon: "shield", value: "12 мес", label: "гарантия на работы" },
    ];
    return `<div class="container"><div class="trust-strip">
      ${items
        .map(
          (item) => `<div class="trust-item">
            <span class="trust-icon">${window.icon(item.icon, 20)}</span>
            <div><b>${item.value}</b><small>${item.label}</small></div>
          </div>`
        )
        .join("")}
    </div></div>`;
  }

  function heroSvg() {
    return `<div class="hero-visual" aria-hidden="true">
      <div class="visual-glow"></div>
      <div class="visual-grid"></div>
      <svg viewBox="0 0 320 300" class="visual-svg">
        <defs>
          <linearGradient id="screen" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#1b2a3f"/><stop offset="100%" stop-color="#0d1623"/>
          </linearGradient>
        </defs>
        <rect x="52" y="42" width="216" height="140" rx="16" fill="url(#screen)" />
        <rect x="64" y="54" width="192" height="106" rx="8" fill="#122033" />
        <path d="M78 138c18-26 34-8 50-30s30 4 46-18 34-10 46 4" stroke="#ff6a2b" stroke-width="4" fill="none" stroke-linecap="round"/>
        <circle cx="106" cy="84" r="10" fill="#ff6a2b" opacity=".85"/>
        <rect x="180" y="70" width="58" height="8" rx="4" fill="#2f4664"/>
        <rect x="180" y="86" width="40" height="8" rx="4" fill="#24374f"/>
        <rect x="38" y="182" width="244" height="12" rx="6" fill="#1b2a3f"/>
        <rect x="118" y="174" width="84" height="6" rx="3" fill="#2b3f5b"/>
        <g transform="translate(212 196) rotate(12)">
          <rect x="0" y="0" width="64" height="108" rx="14" fill="#16263b" stroke="#2c4766" stroke-width="3"/>
          <rect x="6" y="12" width="52" height="76" rx="7" fill="#0e1a2a"/>
          <circle cx="32" cy="98" r="4" fill="#3b5677"/>
          <path d="M18 56c10-14 18 4 28-6s14-2 20 4" stroke="#ff6a2b" stroke-width="3" fill="none" stroke-linecap="round"/>
        </g>
        <g stroke="#ff6a2b" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round">
          <path d="M244 66a16 16 0 0 0 19-19l-8 8-7.5-7.5 8-8a16 16 0 0 0-19 19l-12 12 7.5 7.5z" fill="#ff6a2b" opacity=".12"/>
        </g>
        <g class="visual-gear">
          <circle cx="70" cy="228" r="22" fill="#ff6a2b" opacity=".12"/>
          <circle cx="70" cy="228" r="9" fill="none" stroke="#ff6a2b" stroke-width="3"/>
          <path d="M70 198v8M70 250v8M40 228h8M92 228h8M49 207l6 6M85 243l6 6M91 207l-6 6M55 243l-6 6" stroke="#ff6a2b" stroke-width="3" stroke-linecap="round"/>
        </g>
      </svg>
      <div class="visual-tag tag-top">${window.icon("shield", 16)}<span><b>Гарантия 12 месяцев</b><small>на работы и детали</small></span></div>
      <div class="visual-tag tag-bottom">${window.icon("clock", 16)}<span><b>Диагностика за 30 минут</b><small>бесплатно при ремонте</small></span></div>
    </div>`;
  }

  Views.home = async function home(root) {
    root.innerHTML = `<section class="hero">
      <div class="container hero-grid">
        <div class="hero-copy">
          <span class="pill pill-brand">${window.icon("map-pin", 14)} Сервисный центр в Москве</span>
          <h1>Ремонт техники<br>без <span class="mark">сюрпризов</span></h1>
          <p class="hero-sub">Чиним смартфоны, ноутбуки и бытовую технику с прозрачной сметой.
            Бесплатная диагностика, оригинальные запчасти и гарантия до 12 месяцев.</p>
          <div class="hero-actions">
            <button class="btn btn-primary btn-lg" data-scroll-to="#home-order">${window.icon("wrench", 18)} Оставить заявку</button>
            <a class="btn btn-outline btn-lg" href="#/services">Каталог услуг ${window.icon("arrow-right", 17)}</a>
          </div>
          <div class="hero-rating">
            <span class="stars">${Array.from({ length: 5 }).map(() => window.icon("star", 16)).join("")}</span>
            <b>4,9 из 5</b><span>· 2 400+ отзывов</span>
          </div>
          <ul class="hero-points">
            <li>${window.icon("check", 15)} Выезд мастера по Москве</li>
            <li>${window.icon("check", 15)} Оплата после ремонта</li>
            <li>${window.icon("check", 15)} Запчасти в наличии</li>
          </ul>
        </div>
        <div class="hero-panel" id="home-order">
          <div class="form-card">
            <div class="form-card-head">
              <span class="eyebrow">Быстрая заявка</span>
              <h2>Заберём устройство в ремонт сегодня</h2>
              <p>Заполните форму — мастер перезвонит в течение 15 минут.</p>
            </div>
            <div id="home-order-form"></div>
          </div>
        </div>
      </div>
      <div class="hero-deco">${heroSvg()}</div>
    </section>
    <section class="trust-section">${trustStrip()}</section>

    <section class="section" id="home-services">
      <div class="container">
        <div class="section-head">
          <div>
            <span class="eyebrow">Что мы ремонтируем</span>
            <h2>Услуги и цены</h2>
            <p>Фиксированная стоимость работ — без скрытых доплат после диагностики.</p>
          </div>
          <a class="btn btn-ghost" href="#/services">Все услуги ${window.icon("arrow-right", 16)}</a>
        </div>
        <div class="services-grid" id="home-services-grid">${UI.skeletonCards(3)}</div>
      </div>
    </section>

    <section class="section section-muted">
      <div class="container">
        <div class="section-head centered">
          <span class="eyebrow">Как это работает</span>
          <h2>Четыре шага до готового устройства</h2>
          <p>Никакой бюрократии: заявка, диагностика, согласование и ремонт.</p>
        </div>
        <div class="steps">
          ${[
            ["Оставьте заявку", "Опишите проблему на сайте или позвоните. Мастер перезвонит в течение 15 минут."],
            ["Бесплатная диагностика", "Проверим устройство и назовём точную стоимость и срок ремонта."],
            ["Ремонт и согласование", "Приступаем только после вашего согласия. Держим в курсе на каждом этапе."],
            ["Выдача с гарантией", "Проверяем устройство вместе с вами и выдаём квитанцию с QR-кодом."],
          ]
            .map(
              (step, index) => `<div class="step-card">
                <span class="step-number">0${index + 1}</span>
                <h3>${step[0]}</h3>
                <p>${step[1]}</p>
              </div>`
            )
            .join("")}
        </div>
      </div>
    </section>

    <section class="section">
      <div class="container">
        <div class="section-head centered">
          <span class="eyebrow">Почему «Мастер+»</span>
          <h2>Ремонт, за который не стыдно</h2>
        </div>
        <div class="benefits">
          ${[
            ["shield", "Гарантия до 12 месяцев", "Письменная гарантия на все работы и установленные запчасти."],
            ["box", "Оригинальные детали", "Работаем с проверенными поставщиками и показываем упаковку."],
            ["clock", "Срочный ремонт", "Простые поломки устраняем в день обращения — за 1–2 часа."],
            ["credit-card", "Честные цены", "Смета до начала работ. Никаких доплат «по факту»."],
          ]
            .map(
              (item) => `<div class="benefit-card">
                <span class="benefit-icon">${window.icon(item[0], 24)}</span>
                <h3>${item[1]}</h3>
                <p>${item[2]}</p>
              </div>`
            )
            .join("")}
        </div>
      </div>
    </section>

    <section class="section section-tight">
      <div class="container">
        <div class="cta-band">
          <div>
            <span class="eyebrow light">Не откладывайте ремонт</span>
            <h2>Заберём устройство уже сегодня</h2>
            <p>Курьер по Москве — бесплатно при заказе ремонта от 3 000 ₽.</p>
          </div>
          <div class="cta-actions">
            <a class="btn btn-primary btn-lg" href="tel:+74951204567">${window.icon("phone", 18)} +7 (495) 120-45-67</a>
            <button class="btn btn-light btn-lg" data-scroll-to="#home-order">Оставить заявку</button>
          </div>
        </div>
      </div>
    </section>`;

    const grid = root.querySelector("#home-services-grid");
    try {
      const services = await OrderForm.loadServices();
      grid.innerHTML = services.slice(0, 6).map(serviceCard).join("");
      OrderForm.mount(root.querySelector("#home-order-form"), { services });
    } catch (error) {
      grid.innerHTML = `<div class="empty-state">${window.icon("alert", 30)}<p>${UI.escapeHtml(error.message)}</p></div>`;
      OrderForm.mount(root.querySelector("#home-order-form"), {});
    }

    root.querySelectorAll("[data-scroll-to]").forEach((button) => {
      button.addEventListener("click", () => {
        const target = document.querySelector(button.dataset.scrollTo);
        if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
  };

  Views.services = async function servicesView(root, ctx) {
    root.innerHTML = `<section class="page-hero">
      <div class="container">
        <nav class="breadcrumbs"><a href="#/">Главная</a> ${window.icon("chevron-right", 13)} <span>Услуги</span></nav>
        <h1>Каталог услуг</h1>
        <p>Прозрачные цены на ремонт. Итоговая стоимость фиксируется после бесплатной диагностики.</p>
      </div>
    </section>
    <section class="section section-flush">
      <div class="container">
        <div class="catalog-toolbar">
          <div class="search-field">${window.icon("search", 18)}
            <input type="search" id="catalog-search" placeholder="Поиск по услугам и категориям" autocomplete="off">
          </div>
          <div class="filter-chips" id="catalog-filters"></div>
        </div>
        <p class="results-count" id="catalog-count"></p>
        <div class="services-grid" id="catalog-grid">${UI.skeletonCards(6)}</div>
      </div>
    </section>`;

    let all = [];
    let activeCategory = ctx?.query?.category || "";
    let query = "";

    const grid = root.querySelector("#catalog-grid");
    const filters = root.querySelector("#catalog-filters");
    const count = root.querySelector("#catalog-count");
    const search = root.querySelector("#catalog-search");

    const draw = () => {
      const filtered = all.filter((service) => {
        const matchesCategory = !activeCategory || service.category === activeCategory;
        const haystack = `${service.name} ${service.description} ${service.category}`.toLowerCase();
        return matchesCategory && (!query || haystack.includes(query.toLowerCase()));
      });
      grid.innerHTML = filtered.length
        ? filtered.map(serviceCard).join("")
        : `<div class="empty-state">${window.icon("search", 30)}<h3>Ничего не найдено</h3><p>Попробуйте изменить запрос или выбрать другую категорию.</p><button class="btn btn-ghost" id="reset-filters">Сбросить фильтры</button></div>`;
      count.textContent = `${filtered.length} ${UI.plural(filtered.length, "услуга", "услуги", "услуг")}`;
      grid.querySelector("#reset-filters")?.addEventListener("click", () => {
        activeCategory = "";
        query = "";
        search.value = "";
        drawFilters();
        draw();
      });
    };

    const drawFilters = () => {
      const categories = [...new Set(all.map((s) => s.category))];
      filters.innerHTML = `<button class="chip ${!activeCategory ? "is-active" : ""}" data-category="">Все услуги</button>` +
        categories
          .map(
            (category) =>
              `<button class="chip ${activeCategory === category ? "is-active" : ""}" data-category="${UI.escapeHtml(category)}">${UI.escapeHtml(category)}</button>`
          )
          .join("");
      filters.querySelectorAll(".chip").forEach((chip) => {
        chip.addEventListener("click", () => {
          activeCategory = chip.dataset.category;
          drawFilters();
          draw();
        });
      });
    };

    search.addEventListener(
      "input",
      UI.debounce(() => {
        query = search.value.trim();
        draw();
      }, 200)
    );

    try {
      all = await OrderForm.loadServices();
      drawFilters();
      draw();
    } catch (error) {
      grid.innerHTML = `<div class="empty-state">${window.icon("alert", 30)}<p>${UI.escapeHtml(error.message)}</p></div>`;
    }
  };

  // ---------- Авторизация ----------

  function authVisual() {
    return `<div class="auth-visual">
      <a class="logo logo-light" href="#/">
        <span class="logo-mark">М+</span>
        <span class="logo-text"><b>Мастер+</b><small>ремонтная мастерская</small></span>
      </a>
      <div class="auth-visual-copy">
        <span class="pill pill-glass">${window.icon("sparkles", 14)} Сервисный центр №1</span>
        <h2>Техника снова<br>как новая</h2>
        <p>18 400 ремонтов, 4,9 из 5 и гарантия до 12 месяцев. Следите за статусом заявки онлайн.</p>
      </div>
      <ul class="auth-features">
        <li>${window.icon("check-circle", 18)} Прозрачная смета до начала работ</li>
        <li>${window.icon("check-circle", 18)} Запчасти в наличии на складе</li>
        <li>${window.icon("check-circle", 18)} Электронные квитанции с QR-кодом</li>
      </ul>
      <div class="auth-review">
        <span class="stars">${Array.from({ length: 5 }).map(() => window.icon("star", 14)).join("")}</span>
        <p>«Заменили экран за два часа, цена не изменилась. Приятно, когда всё честно».</p>
        <small>Анна С. · iPhone 13</small>
      </div>
    </div>`;
  }

  function passwordField(id, label, autocomplete = "current-password") {
    return `<div class="field">
      <label for="${id}">${label}</label>
      <div class="password-wrap">
        <input id="${id}" name="${id}" type="password" autocomplete="${autocomplete}" required minlength="6" placeholder="Минимум 6 символов">
        <button type="button" class="password-toggle" data-toggle-password="${id}" aria-label="Показать пароль">${window.icon("eye", 18)}</button>
      </div>
    </div>`;
  }

  function bindPasswordToggles(root) {
    root.querySelectorAll("[data-toggle-password]").forEach((button) => {
      button.addEventListener("click", () => {
        const input = root.querySelector(`#${button.dataset.togglePassword}`);
        const show = input.type === "password";
        input.type = show ? "text" : "password";
        button.innerHTML = window.icon(show ? "eye-off" : "eye", 18);
        button.setAttribute("aria-label", show ? "Скрыть пароль" : "Показать пароль");
      });
    });
  }

  function afterAuth(user) {
    const next = API.popNext();
    const destination = next && next !== "/login" && next !== "/register" ? next : UI.roleHome(user.role);
    UI.toast(`Добро пожаловать, ${user.full_name.split(" ")[0]}!`, "success");
    if (window.App) App.navigate(destination);
    else window.location.hash = `#${destination}`;
  }

  Views.login = async function login(root) {
    if (API.user) {
      if (window.App) App.navigate(UI.roleHome(API.user.role));
      return;
    }
    root.innerHTML = `<section class="auth-page">
      ${authVisual()}
      <div class="auth-panel">
        <div class="auth-card">
          <a class="logo logo-mobile" href="#/"><span class="logo-mark">М+</span><span class="logo-text"><b>Мастер+</b><small>ремонтная мастерская</small></span></a>
          <h1>С возвращением</h1>
          <p class="auth-sub">Войдите, чтобы отслеживать статус ремонта и получать квитанции.</p>
          <form id="login-form" novalidate>
            <div class="field">
              <label for="login-email">Email</label>
              <input id="login-email" name="email" type="email" autocomplete="email" required placeholder="you@example.com">
            </div>
            ${passwordField("login-password", "Пароль")}
            <p class="form-error" data-form-error hidden></p>
            <button type="submit" class="btn btn-primary btn-block btn-lg" data-submit>Войти</button>
          </form>
          <div class="demo-block">
            <div class="demo-head"><span>Демо-доступ</span><small>нажмите, чтобы подставить</small></div>
            <div class="demo-buttons">
              <button type="button" class="demo-chip" data-demo="client@workshop.ru|client123">Клиент</button>
              <button type="button" class="demo-chip" data-demo="master@workshop.ru|master123">Мастер</button>
              <button type="button" class="demo-chip" data-demo="admin@workshop.ru|admin123">Админ</button>
            </div>
          </div>
          <p class="auth-switch">Нет аккаунта? <a href="#/register">Зарегистрироваться</a></p>
        </div>
      </div>
    </section>`;

    const form = root.querySelector("#login-form");
    const errorBox = form.querySelector("[data-form-error]");
    bindPasswordToggles(root);

    root.querySelectorAll("[data-demo]").forEach((button) => {
      button.addEventListener("click", () => {
        const [email, password] = button.dataset.demo.split("|");
        form.querySelector("#login-email").value = email;
        form.querySelector("#login-password").value = password;
        form.querySelector("#login-password").focus();
        UI.toast("Данные подставлены — нажмите «Войти»", "info", 2200);
      });
    });

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      errorBox.hidden = true;
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }
      const submit = form.querySelector("[data-submit]");
      submit.disabled = true;
      submit.innerHTML = `<span class="spinner"></span> Входим…`;
      try {
        const data = await API.login(
          form.querySelector("#login-email").value.trim(),
          form.querySelector("#login-password").value
        );
        API.setSession(data.access_token, data.user);
        afterAuth(data.user);
      } catch (error) {
        errorBox.textContent = error.message;
        errorBox.hidden = false;
        submit.disabled = false;
        submit.textContent = "Войти";
      }
    });
  };

  Views.register = async function register(root) {
    if (API.user) {
      if (window.App) App.navigate(UI.roleHome(API.user.role));
      return;
    }
    root.innerHTML = `<section class="auth-page">
      ${authVisual()}
      <div class="auth-panel">
        <div class="auth-card">
          <a class="logo logo-mobile" href="#/"><span class="logo-mark">М+</span><span class="logo-text"><b>Мастер+</b><small>ремонтная мастерская</small></span></a>
          <h1>Создать аккаунт</h1>
          <p class="auth-sub">Заявки, статусы и документы — всё в одном личном кабинете.</p>
          <form id="register-form" novalidate>
            <div class="field">
              <label for="reg-name">Имя и фамилия</label>
              <input id="reg-name" name="full_name" type="text" autocomplete="name" required minlength="2" placeholder="Анна Смирнова">
            </div>
            <div class="grid-2">
              <div class="field">
                <label for="reg-email">Email</label>
                <input id="reg-email" name="email" type="email" autocomplete="email" required placeholder="you@example.com">
              </div>
              <div class="field">
                <label for="reg-phone">Телефон</label>
                <input id="reg-phone" name="phone" type="tel" autocomplete="tel" required placeholder="+7 (900) 000-00-00">
              </div>
            </div>
            <div class="grid-2">
              ${passwordField("reg-password", "Пароль", "new-password")}
              <div class="field">
                <label for="reg-password2">Повторите пароль</label>
                <input id="reg-password2" type="password" autocomplete="new-password" required minlength="6" placeholder="Ещё раз">
              </div>
            </div>
            <p class="form-error" data-form-error hidden></p>
            <button type="submit" class="btn btn-primary btn-block btn-lg" data-submit>Зарегистрироваться</button>
            <p class="form-note">${window.icon("shield", 15)} Данные защищены, пароль хранится в зашифрованном виде.</p>
          </form>
          <p class="auth-switch">Уже есть аккаунт? <a href="#/login">Войти</a></p>
        </div>
      </div>
    </section>`;

    const form = root.querySelector("#register-form");
    const errorBox = form.querySelector("[data-form-error]");
    bindPasswordToggles(root);

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      errorBox.hidden = true;
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }
      const password = form.querySelector("#reg-password").value;
      const repeat = form.querySelector("#reg-password2").value;
      if (password !== repeat) {
        errorBox.textContent = "Пароли не совпадают";
        errorBox.hidden = false;
        return;
      }
      const submit = form.querySelector("[data-submit]");
      submit.disabled = true;
      submit.innerHTML = `<span class="spinner"></span> Создаём аккаунт…`;
      try {
        const data = await API.register({
          full_name: form.querySelector("#reg-name").value.trim(),
          email: form.querySelector("#reg-email").value.trim(),
          phone: form.querySelector("#reg-phone").value.trim(),
          password,
        });
        API.setSession(data.access_token, data.user);
        afterAuth(data.user);
      } catch (error) {
        errorBox.textContent = error.message;
        errorBox.hidden = false;
        submit.disabled = false;
        submit.textContent = "Зарегистрироваться";
      }
    });
  };

  Views.newOrder = async function newOrder(root, ctx) {
    const serviceId = ctx?.query?.service || "";
    root.innerHTML = `<section class="page-hero">
      <div class="container">
        <nav class="breadcrumbs"><a href="#/">Главная</a> ${window.icon("chevron-right", 13)} <span>Новая заявка</span></nav>
        <h1>Оставить заявку</h1>
        <p>Заполните форму — мастер свяжется с вами в течение 15 минут и согласует диагностику.</p>
      </div>
    </section>
    <section class="section section-flush">
      <div class="container order-page-grid">
        <div class="card form-card form-card-page">
          <div class="form-card-head">
            <span class="eyebrow">Заявка на ремонт</span>
            <h2>Расскажите о поломке</h2>
            <p>Чем подробнее опишете проблему, тем точнее будет предварительная оценка.</p>
          </div>
          <div id="new-order-form"></div>
        </div>
        <aside class="order-aside">
          <div class="card aside-card">
            <h3>Что будет дальше</h3>
            <ol class="mini-steps">
              <li><span>1</span><div><b>Звонок мастера</b><small>Уточним детали и удобное время</small></div></li>
              <li><span>2</span><div><b>Бесплатная диагностика</b><small>Назовём точную стоимость</small></div></li>
              <li><span>3</span><div><b>Ремонт</b><small>Согласуем каждую запчасть</small></div></li>
              <li><span>4</span><div><b>Выдача</b><small>С гарантией и квитанцией</small></div></li>
            </ol>
          </div>
          <div class="card aside-card aside-contacts">
            <h3>Нужна помощь?</h3>
            <p>Позвоните нам — подскажем по стоимости и срокам.</p>
            <a class="aside-phone" href="tel:+74951204567">+7 (495) 120-45-67</a>
            <small>Ежедневно с 9:00 до 21:00</small>
          </div>
          <div class="assurance-list">
            <div>${window.icon("shield", 18)} Гарантия до 12 месяцев</div>
            <div>${window.icon("clock", 18)} Ремонт от 1 часа</div>
            <div>${window.icon("check-circle", 18)} Оплата после проверки</div>
          </div>
        </aside>
      </div>
    </section>`;

    OrderForm.mount(root.querySelector("#new-order-form"), {
      serviceId,
      onSuccess(order) {
        if (window.App) App.navigate(`/client?order=${order.id}`);
        else window.location.hash = `#/client?order=${order.id}`;
      },
    });
  };
})();
