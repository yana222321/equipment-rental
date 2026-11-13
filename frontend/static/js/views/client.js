/* Личный кабинет клиента. */
(function () {
  window.Views = window.Views || {};

  const FILTERS = [
    { key: "all", label: "Все заявки" },
    { key: "active", label: "В работе" },
    { key: "ready", label: "Готовы" },
    { key: "completed", label: "Завершены" },
    { key: "canceled", label: "Отменены" },
  ];

  const ACTIVE = ["new", "accepted", "diagnostics", "in_progress", "waiting_parts"];

  function orderCard(order) {
    return `<article class="order-card" data-order-id="${order.id}" tabindex="0" role="button" aria-label="Открыть заявку №${order.id}">
      <div class="order-icon">${window.icon(UI.deviceIcon(order.device_type), 24)}</div>
      <div class="order-main">
        <div class="order-top">
          <h3>${UI.escapeHtml(order.device_model)}</h3>
          ${UI.statusBadge(order.status)}
        </div>
        <p class="order-service">${UI.escapeHtml(order.service_name)} · заявка №${order.id}</p>
        <div class="order-meta">
          <span>${window.icon("calendar", 14)} ${UI.formatDate(order.created_at, { withTime: false })}</span>
          <span>${window.icon("user", 14)} ${UI.escapeHtml(order.master_name || "Мастер подбирается")}</span>
          ${order.receipts.length ? `<span>${window.icon("receipt", 14)} ${order.receipts.length} ${UI.plural(order.receipts.length, "документ", "документа", "документов")}</span>` : ""}
        </div>
      </div>
      <div class="order-side">
        <b>${UI.money(order.total_cost)}</b>
        <small>итого</small>
      </div>
      <span class="order-chevron">${window.icon("chevron-right", 18)}</span>
    </article>`;
  }

  Views.client = async function clientView(root, ctx) {
    const user = API.user;
    root.innerHTML = `<div class="container page-loading"><div class="skeleton skeleton-title"></div>
      <div class="skeleton-grid">${UI.skeletonCards(3)}</div></div>`;

    let orders = [];
    let filter = "all";
    let openedFromQuery = false;

    const draw = () => {
      const counts = {
        all: orders.length,
        active: orders.filter((o) => ACTIVE.includes(o.status)).length,
        ready: orders.filter((o) => o.status === "ready").length,
        completed: orders.filter((o) => o.status === "completed").length,
        canceled: orders.filter((o) => o.status === "canceled").length,
      };
      const filtered = orders.filter((order) => {
        if (filter === "all") return true;
        if (filter === "active") return ACTIVE.includes(order.status);
        return order.status === filter;
      });
      const activeCount = counts.active;
      const inWork = orders.filter((o) => ["accepted", "diagnostics", "in_progress", "waiting_parts"].includes(o.status)).length;
      const total = orders
        .filter((o) => o.status === "completed")
        .reduce((sum, o) => sum + o.total_cost, 0);

      root.innerHTML = `<section class="page-hero dashboard-hero">
        <div class="container">
          <div class="page-head">
            <div>
              <span class="eyebrow">Личный кабинет</span>
              <h1>Здравствуйте, ${UI.escapeHtml(user.full_name.split(" ")[0])}</h1>
              <p>Здесь собраны все ваши заявки и документы по ремонту.</p>
            </div>
            <a class="btn btn-primary btn-lg" href="#/new-order">${window.icon("plus", 18)} Новая заявка</a>
          </div>
        </div>
      </section>

      <section class="section section-flush">
        <div class="container">
          <div class="kpi-grid">
            <div class="kpi-card">
              <span class="kpi-icon kpi-brand">${window.icon("receipt", 22)}</span>
              <div><b>${counts.all}</b><span>Всего заявок</span></div>
            </div>
            <div class="kpi-card">
              <span class="kpi-icon kpi-warn">${window.icon("wrench", 22)}</span>
              <div><b>${inWork}</b><span>В работе сейчас</span></div>
            </div>
            <div class="kpi-card">
              <span class="kpi-icon kpi-ok">${window.icon("check-circle", 22)}</span>
              <div><b>${counts.completed}</b><span>Завершено ремонтов</span></div>
            </div>
            <div class="kpi-card">
              <span class="kpi-icon kpi-info">${window.icon("credit-card", 22)}</span>
              <div><b>${UI.money(total)}</b><span>Оплачено за ремонты</span></div>
            </div>
          </div>

          <div class="toolbar">
            <div class="filter-chips">
              ${FILTERS.map(
                (item) =>
                  `<button class="chip ${filter === item.key ? "is-active" : ""}" data-filter="${item.key}">
                    ${item.label} <span class="chip-count">${counts[item.key]}</span>
                  </button>`
              ).join("")}
            </div>
          </div>

          <div class="orders-list">
            ${
              filtered.length
                ? filtered.map(orderCard).join("")
                : `<div class="empty-state card">
                    ${window.icon("wrench", 34)}
                    <h3>${orders.length ? "В этой категории пока пусто" : "У вас ещё нет заявок"}</h3>
                    <p>${orders.length ? "Выберите другой фильтр, чтобы увидеть остальные заявки." : "Оставьте заявку — мастер свяжется с вами и согласует диагностику."}</p>
                    ${orders.length ? "" : `<a class="btn btn-primary" href="#/new-order">${window.icon("plus", 16)} Создать заявку</a>`}
                  </div>`
            }
          </div>
        </div>
      </section>`;

      root.querySelectorAll("[data-filter]").forEach((chip) => {
        chip.addEventListener("click", () => {
          filter = chip.dataset.filter;
          draw();
        });
      });

      root.querySelectorAll("[data-order-id]").forEach((card) => {
        const open = () => {
          const order = orders.find((o) => String(o.id) === card.dataset.orderId);
          if (order) OrderDetail.show(order, { mode: "client", onRefresh: load });
        };
        card.addEventListener("click", open);
        card.addEventListener("keydown", (event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            open();
          }
        });
      });

      if (!openedFromQuery && ctx?.query?.order) {
        openedFromQuery = true;
        const target = orders.find((o) => String(o.id) === String(ctx.query.order));
        if (target) setTimeout(() => OrderDetail.show(target, { mode: "client", onRefresh: load }), 120);
      }
    };

    const load = async () => {
      try {
        orders = await API.request("/api/client/requests");
        draw();
      } catch (error) {
        root.innerHTML = `<div class="container"><div class="empty-state card">
          ${window.icon("alert", 30)}<h3>Не удалось загрузить заявки</h3>
          <p>${UI.escapeHtml(error.message)}</p>
          <button class="btn btn-ghost" id="retry-orders">Повторить</button>
        </div></div>`;
        root.querySelector("#retry-orders")?.addEventListener("click", load);
      }
    };

    await load();
  };
})();
