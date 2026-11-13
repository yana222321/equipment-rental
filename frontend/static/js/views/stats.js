/* Статистика с графиками. */
(function () {
  window.Views = window.Views || {};

  Views.stats = async function statsView(root) {
    root.innerHTML = `<div class="container page-loading"><div class="skeleton skeleton-title"></div>
      <div class="skeleton-grid">${UI.skeletonCards(3)}</div></div>`;

    const load = async () => {
      let data;
      try {
        data = await API.request("/api/stats/overview");
      } catch (error) {
        root.innerHTML = `<div class="container"><div class="empty-state card">
          ${window.icon("alert", 30)}<h3>Не удалось загрузить статистику</h3>
          <p>${UI.escapeHtml(error.message)}</p>
          <button class="btn btn-ghost" id="retry-stats">Повторить</button></div></div>`;
        root.querySelector("#retry-stats")?.addEventListener("click", load);
        return;
      }

      const totals = data.totals;
      root.innerHTML = `<section class="page-hero dashboard-hero">
        <div class="container">
          <div class="page-head">
            <div>
              <span class="eyebrow">Аналитика</span>
              <h1>Статистика мастерской</h1>
              <p>Ключевые показатели за последние 6 месяцев.</p>
            </div>
            <button class="btn btn-ghost" data-refresh>${window.icon("refresh", 17)} Обновить</button>
          </div>
          <div class="kpi-grid">
            <div class="kpi-card"><span class="kpi-icon kpi-brand">${window.icon("receipt", 22)}</span>
              <div><b>${totals.orders}</b><span>Всего заявок</span></div></div>
            <div class="kpi-card"><span class="kpi-icon kpi-warn">${window.icon("wrench", 22)}</span>
              <div><b>${totals.active}</b><span>Активных заявок</span></div></div>
            <div class="kpi-card"><span class="kpi-icon kpi-ok">${window.icon("credit-card", 22)}</span>
              <div><b>${UI.money(totals.revenue)}</b><span>Выручка по завершённым</span></div></div>
            <div class="kpi-card"><span class="kpi-icon kpi-info">${window.icon("clock", 22)}</span>
              <div><b>${totals.avg_days} ${UI.plural(totals.avg_days, "день", "дня", "дней")}</b><span>Средний срок ремонта</span></div></div>
          </div>
        </div>
      </section>

      <section class="section section-flush">
        <div class="container">
          <div class="charts-grid">
            <div class="chart-card span-2">
              <div class="chart-head"><div><h3>Заявки по месяцам</h3><p>Сколько обращений поступает в мастерскую</p></div>
                <span class="chart-total">${totals.orders} заявок</span></div>
              <div id="chart-orders"></div>
            </div>
            <div class="chart-card">
              <div class="chart-head"><div><h3>Статусы заявок</h3><p>Текущее распределение</p></div></div>
              <div id="chart-status"></div>
            </div>
            <div class="chart-card span-2">
              <div class="chart-head"><div><h3>Выручка</h3><p>Оплаченные ремонты по месяцам</p></div>
                <span class="chart-total">${UI.money(totals.revenue)}</span></div>
              <div id="chart-revenue"></div>
            </div>
            <div class="chart-card">
              <div class="chart-head"><div><h3>Топ услуг</h3><p>По количеству заявок</p></div></div>
              <div id="chart-services"></div>
            </div>
            <div class="chart-card span-2">
              <div class="chart-head"><div><h3>Загрузка мастеров</h3><p>Активные и завершённые заявки</p></div></div>
              <div class="master-load">
                ${
                  data.master_load.length
                    ? data.master_load
                        .map((master) => {
                          const max = Math.max(...data.master_load.map((m) => m.completed + m.active), 1);
                          return `<div class="master-row">
                            <div class="master-person">
                              <span class="avatar sm">${UI.initials(master.name)}</span>
                              <div><b>${UI.escapeHtml(master.name)}</b><small>${UI.money(master.revenue)} выручка</small></div>
                            </div>
                            <div class="master-bars">
                              <div class="master-bar"><span class="master-bar-active" style="width:${(master.active / max) * 100}%"></span></div>
                              <div class="master-bar"><span class="master-bar-done" style="width:${(master.completed / max) * 100}%"></span></div>
                            </div>
                            <div class="master-nums"><span class="tag tag-warn">${master.active} в работе</span><span class="tag tag-ok">${master.completed} завершено</span></div>
                          </div>`;
                        })
                        .join("")
                    : `<p class="muted">Мастеров пока нет</p>`
                }
              </div>
            </div>
            <div class="chart-card">
              <div class="chart-head"><div><h3>Дефицит на складе</h3><p>Позиции ниже минимального остатка</p></div></div>
              ${
                data.low_stock.length
                  ? `<ul class="stock-alert-list">${data.low_stock
                      .map(
                        (part) => `<li>
                          <div><b>${UI.escapeHtml(part.name)}</b><small>${UI.escapeHtml(part.sku)}</small></div>
                          <span class="tag tag-danger">${part.stock_qty} / ${part.min_threshold}</span>
                        </li>`
                      )
                      .join("")}</ul>`
                  : `<div class="empty-state compact">${window.icon("check-circle", 28)}<p>Все запасы в норме</p></div>`
              }
            </div>
          </div>
          <div class="stats-footnote">
            <span>${window.icon("info", 15)} Данные обновляются в реальном времени</span>
            <span>Клиентов: <b>${totals.clients}</b> · Мастеров: <b>${totals.masters}</b> · Позиций в дефиците: <b>${totals.low_stock}</b></span>
          </div>
        </div>
      </section>`;

      Charts.barChart(root.querySelector("#chart-orders"), data.monthly, {
        value: (d) => d.orders,
        label: (d) => d.label,
        format: (v) => String(v),
      });

      Charts.areaChart(root.querySelector("#chart-revenue"), data.monthly, {
        value: (d) => d.revenue,
        label: (d) => d.label,
        format: (v) => UI.money(v),
      });

      Charts.donut(
        root.querySelector("#chart-status"),
        data.by_status
          .filter((item) => item.count > 0)
          .map((item) => ({ ...item, tone: UI.STATUS[item.status]?.tone || "muted" })),
        {
          value: (d) => d.count,
          label: (d) => d.label,
          tone: (d) => d.tone,
          centerLabel: "заявок",
        }
      );

      Charts.hbars(root.querySelector("#chart-services"), data.top_services, {
        value: (d) => d.count,
        label: (d) => d.name,
        format: (v) => `${v} ${UI.plural(v, "заявка", "заявки", "заявок")}`,
        hint: (d) => `Выручка: ${UI.money(d.revenue)}`,
      });

      root.querySelector("[data-refresh]")?.addEventListener("click", () => {
        UI.toast("Статистика обновлена", "info", 1500);
        load();
      });
    };

    await load();
  };
})();
