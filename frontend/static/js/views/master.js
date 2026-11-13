/* Рабочее место мастера: заявки, статусы, запчасти, квитанции. */
(function () {
  window.Views = window.Views || {};

  const SCOPE_LABELS = { mine: "Мои заявки", available: "Свободные" };

  function historyMarkup(order) {
    if (!order.history.length) return `<p class="muted">История пуста</p>`;
    return `<ol class="timeline timeline-compact">
      ${order.history
        .map(
          (item, index) => `<li class="${index === order.history.length - 1 ? "is-current" : ""}">
            <span class="timeline-dot"></span>
            <div class="timeline-body">
              <div class="timeline-head"><b>${item.new_status_label}</b><time>${UI.formatDate(item.changed_at)}</time></div>
              ${item.comment ? `<p>${UI.escapeHtml(item.comment)}</p>` : ""}
              ${item.changed_by_name ? `<small>${UI.escapeHtml(item.changed_by_name)}</small>` : ""}
            </div>
          </li>`
        )
        .join("")}
    </ol>`;
  }

  function listItem(order, selectedId) {
    const active = String(order.id) === String(selectedId);
    return `<button type="button" class="ws-item ${active ? "is-active" : ""}" data-order-id="${order.id}">
      <div class="ws-item-top">
        <span class="device-badge sm">${window.icon(UI.deviceIcon(order.device_type), 20)}</span>
        <div class="ws-item-title">
          <b>${UI.escapeHtml(order.device_model)}</b>
          <small>№${order.id} · ${UI.escapeHtml(order.service_name)}</small>
        </div>
        ${UI.statusBadge(order.status)}
      </div>
      <div class="ws-item-bottom">
        <span>${window.icon("user", 13)} ${UI.escapeHtml(order.client_name)}</span>
        <span>${UI.formatDate(order.created_at, { withTime: false })}</span>
        <b>${UI.money(order.total_cost)}</b>
      </div>
    </button>`;
  }

  function detailMarkup(order, parts) {
    if (!order) {
      return `<div class="empty-state ws-empty">
        ${window.icon("wrench", 36)}
        <h3>Выберите заявку</h3>
        <p>Слева появится информация об устройстве, клиенте и истории ремонта.</p>
      </div>`;
    }

    const closed = ["completed", "canceled"].includes(order.status);
    const transitions = (UI.TRANSITIONS[order.status] || []).slice();
    const statusOptions = [order.status, ...transitions];
    const unassigned = !order.master_id;
    const partsOptions = parts
      .filter((part) => part.stock_qty > 0)
      .map(
        (part) =>
          `<option value="${part.id}" data-price="${part.unit_price}" data-stock="${part.stock_qty}">
            ${UI.escapeHtml(part.name)} · ${part.stock_qty} шт.
          </option>`
      )
      .join("");

    return `<div class="ws-detail-head">
        <div class="detail-device">
          <span class="device-badge">${window.icon(UI.deviceIcon(order.device_type), 26)}</span>
          <div>
            <div class="ws-title-row"><h2>${UI.escapeHtml(order.device_model)}</h2>${UI.statusBadge(order.status)}</div>
            <p>${UI.escapeHtml(order.device_type)} · заявка №${order.id} от ${UI.formatDate(order.created_at, { withTime: false })}</p>
          </div>
        </div>
        <div class="ws-contact">
          <a class="phone-link" href="tel:${UI.escapeHtml(order.client_phone)}">${window.icon("phone", 16)} ${UI.escapeHtml(order.client_phone)}</a>
          <span>${UI.escapeHtml(order.client_name)}</span>
        </div>
      </div>

      ${unassigned ? `<div class="notice notice-warn">
        ${window.icon("info", 18)}
        <span>Заявка ещё не закреплена. Возьмите её в работу, чтобы менять статус.</span>
        <button class="btn btn-sm btn-dark" data-take>${window.icon("plus", 15)} Взять заявку</button>
      </div>` : ""}

      <div class="ws-section">
        <div class="ws-info-grid">
          <div><span>Услуга</span><b>${UI.escapeHtml(order.service_name)}</b></div>
          <div><span>Мастер</span><b>${UI.escapeHtml(order.master_name || "Не назначен")}</b></div>
          <div><span>Стоимость работ</span><b>${UI.money(order.labor_cost)}</b></div>
          <div><span>Запчасти</span><b>${UI.money(order.parts_cost)}</b></div>
        </div>
        <div class="issue-box">
          <span>Неисправность</span>
          <p>${UI.escapeHtml(order.issue_desc)}</p>
        </div>
        ${order.photo_url ? `<a class="detail-photo compact" href="${UI.escapeHtml(order.photo_url)}" target="_blank" rel="noopener"><img src="${UI.escapeHtml(order.photo_url)}" alt="Фото устройства" loading="lazy"></a>` : ""}
      </div>

      ${
        closed
          ? `<div class="notice notice-ok">${window.icon("check-circle", 18)} Заявка закрыта. Изменения недоступны.</div>`
          : `<div class="ws-section">
              <h3 class="ws-section-title">${window.icon("wrench", 18)} Статус и стоимость</h3>
              <form class="ws-form" data-status-form>
                <div class="grid-2">
                  <div class="field">
                    <label>Статус</label>
                    <div class="select-wrap">
                      <select data-status>
                        ${statusOptions
                          .map(
                            (status) =>
                              `<option value="${status}">${UI.STATUS[status]?.label || status}</option>`
                          )
                          .join("")}
                      </select>
                    </div>
                  </div>
                  <div class="field">
                    <label>Стоимость работ, ₽</label>
                    <input type="number" data-labor min="0" step="100" value="${order.labor_cost}" inputmode="numeric">
                  </div>
                </div>
                <div class="field">
                  <label>Комментарий к статусу</label>
                  <textarea rows="2" data-comment maxlength="1000" placeholder="Клиент согласовал замену, деталь заказана…"></textarea>
                </div>
                <button class="btn btn-primary" type="submit">${window.icon("check", 16)} Обновить заявку</button>
              </form>
            </div>

            <div class="ws-section">
              <h3 class="ws-section-title">${window.icon("package", 18)} Запчасти</h3>
              ${
                order.parts.length
                  ? `<div class="part-list">${order.parts
                      .map(
                        (part) => `<div class="part-row">
                          <div><b>${UI.escapeHtml(part.part_name)}</b><small>${UI.escapeHtml(part.part_sku)} · ${part.quantity} × ${UI.money(part.fixed_price)}</small></div>
                          <span>${UI.money(part.total)}</span>
                          <button class="icon-btn danger" data-remove-part="${part.id}" aria-label="Убрать запчасть">${window.icon("trash", 16)}</button>
                        </div>`
                      )
                      .join("")}</div>`
                  : `<p class="muted small">Запчасти ещё не списаны.</p>`
              }
              <form class="part-add" data-part-form>
                <div class="select-wrap grow">
                  <select data-part-select required>
                    <option value="">Выберите запчасть</option>
                    ${partsOptions || `<option disabled>Нет запчастей в наличии</option>`}
                  </select>
                </div>
                <input type="number" data-part-qty value="1" min="1" max="100" aria-label="Количество">
                <input type="number" data-part-price placeholder="Цена" min="0" step="10" aria-label="Цена">
                <button class="btn btn-dark" type="submit" ${partsOptions ? "" : "disabled"}>${window.icon("plus", 15)}</button>
              </form>
            </div>

            <div class="ws-section">
              <h3 class="ws-section-title">${window.icon("receipt", 18)} Документы</h3>
              <div class="receipt-actions">
                <button class="btn btn-ghost btn-sm" data-receipt="invoice">${window.icon("receipt", 15)} Квитанция</button>
                <button class="btn btn-ghost btn-sm" data-receipt="act">${window.icon("check-circle", 15)} Акт работ</button>
              </div>
              ${
                order.receipts.length
                  ? `<div class="receipt-links">${order.receipts
                      .map(
                        (receipt) => `<a class="receipt-link" href="/r/${receipt.qr_token}" target="_blank" rel="noopener">
                          <span class="receipt-icon">${window.icon("receipt", 18)}</span>
                          <span><b>${receipt.doc_type === "act" ? "Акт" : "Квитанция"} №${order.id}</b>
                          <small>${UI.formatDate(receipt.issued_at)}</small></span>
                          ${window.icon("external-link", 15)}
                        </a>`
                      )
                      .join("")}</div>`
                  : ""
              }
            </div>`
      }

      <div class="ws-section">
        <h3 class="ws-section-title">${window.icon("clock", 18)} История</h3>
        ${historyMarkup(order)}
      </div>

      <div class="ws-total">
        <span>Итого по заявке</span>
        <b>${UI.money(order.total_cost)}</b>
      </div>`;
  }

  Views.master = async function masterView(root) {
    const state = {
      scope: "mine",
      status: "",
      search: "",
      selectedId: null,
      orders: [],
      parts: [],
    };

    root.innerHTML = `<div class="container page-loading"><div class="skeleton skeleton-title"></div>
      <div class="skeleton skeleton-card"></div></div>`;

    const load = async () => {
      const params = new URLSearchParams({ scope: state.scope });
      if (state.status) params.set("status", state.status);
      try {
        const [orders, parts] = await Promise.all([
          API.request(`/api/master/requests?${params}`),
          API.request("/api/master/parts"),
        ]);
        state.orders = orders;
        state.parts = parts;
        if (!orders.some((order) => String(order.id) === String(state.selectedId))) {
          state.selectedId = orders.length ? orders[0].id : null;
        }
        draw();
      } catch (error) {
        root.innerHTML = `<div class="container"><div class="empty-state card">
          ${window.icon("alert", 30)}<h3>Не удалось загрузить заявки</h3><p>${UI.escapeHtml(error.message)}</p>
          <button class="btn btn-ghost" id="retry-master">Повторить</button></div></div>`;
        root.querySelector("#retry-master")?.addEventListener("click", load);
      }
    };

    const filteredOrders = () => {
      if (!state.search) return state.orders;
      const term = state.search.toLowerCase();
      return state.orders.filter((order) =>
        `${order.device_model} ${order.device_type} ${order.client_name} ${order.issue_desc}`
          .toLowerCase()
          .includes(term)
      );
    };

    const selected = () => state.orders.find((order) => String(order.id) === String(state.selectedId));

    const draw = () => {
      const orders = filteredOrders();
      const order = selected();
      const activeCount = state.orders.filter((o) => !["completed", "canceled"].includes(o.status)).length;

      root.innerHTML = `<section class="page-hero dashboard-hero">
        <div class="container">
          <div class="page-head">
            <div>
              <span class="eyebrow">Рабочее место</span>
              <h1>Заявки мастера</h1>
              <p>${activeCount} ${UI.plural(activeCount, "активная заявка", "активные заявки", "активных заявок")} · ${state.orders.length} всего в выборке</p>
            </div>
            <button class="btn btn-ghost" data-refresh>${window.icon("refresh", 17)} Обновить</button>
          </div>
        </div>
      </section>

      <section class="section section-flush">
        <div class="container">
          <div class="ws-toolbar">
            <div class="segmented">
              ${Object.entries(SCOPE_LABELS)
                .map(
                  ([key, label]) =>
                    `<button class="${state.scope === key ? "is-active" : ""}" data-scope="${key}">${label}</button>`
                )
                .join("")}
            </div>
            <div class="select-wrap ws-status-filter">
              <select data-status-filter>
                <option value="">Все статусы</option>
                ${Object.entries(UI.STATUS)
                  .map(
                    ([key, meta]) =>
                      `<option value="${key}" ${state.status === key ? "selected" : ""}>${meta.label}</option>`
                  )
                  .join("")}
              </select>
            </div>
            <div class="search-field grow">${window.icon("search", 17)}
              <input type="search" data-search placeholder="Поиск по устройству или клиенту" value="${UI.escapeHtml(state.search)}">
            </div>
          </div>

          <div class="workspace">
            <div class="ws-list">
              <div class="ws-list-head">Найдено: ${orders.length}</div>
              ${
                orders.length
                  ? orders.map((item) => listItem(item, state.selectedId)).join("")
                  : `<div class="empty-state compact">${window.icon("search", 28)}<p>Заявок нет</p></div>`
              }
            </div>
            <div class="ws-detail">${detailMarkup(order, state.parts)}</div>
          </div>
        </div>
      </section>`;

      bind();
    };

    const bind = () => {
      root.querySelector("[data-refresh]")?.addEventListener("click", () => {
        UI.toast("Данные обновлены", "info", 1500);
        load();
      });

      root.querySelectorAll("[data-scope]").forEach((button) => {
        button.addEventListener("click", () => {
          state.scope = button.dataset.scope;
          state.selectedId = null;
          load();
        });
      });

      root.querySelector("[data-status-filter]")?.addEventListener("change", (event) => {
        state.status = event.target.value;
        state.selectedId = null;
        load();
      });

      const search = root.querySelector("[data-search]");
      search?.addEventListener(
        "input",
        UI.debounce(() => {
          state.search = search.value.trim();
          const cursor = search.selectionStart;
          draw();
          const next = root.querySelector("[data-search]");
          if (next) {
            next.focus();
            next.setSelectionRange(cursor, cursor);
          }
        }, 250)
      );

      root.querySelectorAll("[data-order-id]").forEach((item) => {
        item.addEventListener("click", () => {
          state.selectedId = item.dataset.orderId;
          draw();
        });
      });

      const order = selected();
      if (!order) return;

      root.querySelector("[data-take]")?.addEventListener("click", async () => {
        try {
          await API.request(`/api/master/requests/${order.id}/take`, { method: "POST" });
          UI.toast("Заявка взята в работу", "success");
          load();
        } catch (error) {
          UI.toast(error.message, "error");
        }
      });

      const statusForm = root.querySelector("[data-status-form]");
      statusForm?.addEventListener("submit", async (event) => {
        event.preventDefault();
        const status = statusForm.querySelector("[data-status]").value;
        const comment = statusForm.querySelector("[data-comment]").value.trim();
        const labor = Number(statusForm.querySelector("[data-labor]").value);
        const button = statusForm.querySelector("button");
        button.disabled = true;
        try {
          await API.request(`/api/master/requests/${order.id}/status`, {
            method: "PATCH",
            body: { status, comment: comment || null, labor_cost: Number.isFinite(labor) ? labor : null },
          });
          UI.toast("Заявка обновлена", "success");
          await load();
        } catch (error) {
          UI.toast(error.message, "error", 5500);
          button.disabled = false;
        }
      });

      const partSelect = root.querySelector("[data-part-select]");
      const partPrice = root.querySelector("[data-part-price]");
      partSelect?.addEventListener("change", () => {
        const option = partSelect.selectedOptions[0];
        if (option && partPrice) partPrice.value = option.dataset.price || "";
      });

      const partForm = root.querySelector("[data-part-form]");
      partForm?.addEventListener("submit", async (event) => {
        event.preventDefault();
        const partId = Number(partSelect.value);
        const quantity = Number(root.querySelector("[data-part-qty]").value);
        const price = partPrice.value === "" ? null : Number(partPrice.value);
        if (!partId) {
          UI.toast("Выберите запчасть", "error");
          return;
        }
        if (!quantity || quantity < 1) {
          UI.toast("Укажите количество", "error");
          return;
        }
        const button = partForm.querySelector("button");
        button.disabled = true;
        try {
          await API.request(`/api/master/requests/${order.id}/parts`, {
            method: "POST",
            body: { part_id: partId, quantity, fixed_price: price },
          });
          UI.toast("Запчасть списана на заявку", "success");
          await load();
        } catch (error) {
          UI.toast(error.message, "error");
          button.disabled = false;
        }
      });

      root.querySelectorAll("[data-remove-part]").forEach((button) => {
        button.addEventListener("click", async () => {
          const confirmed = await UI.confirm({
            title: "Убрать запчасть?",
            message: "Запчасть вернётся на склад, стоимость заявки пересчитается.",
            confirmText: "Убрать",
            danger: true,
          });
          if (!confirmed) return;
          try {
            await API.request(`/api/master/requests/${order.id}/parts/${button.dataset.removePart}`, {
              method: "DELETE",
            });
            UI.toast("Запчасть возвращена на склад", "info");
            await load();
          } catch (error) {
            UI.toast(error.message, "error");
          }
        });
      });

      root.querySelectorAll("[data-receipt]").forEach((button) => {
        button.addEventListener("click", async () => {
          button.disabled = true;
          try {
            await API.request(`/api/master/requests/${order.id}/receipts`, {
              method: "POST",
              body: { doc_type: button.dataset.receipt },
            });
            UI.toast("Документ сформирован — откройте его в блоке ниже", "success");
            await load();
          } catch (error) {
            UI.toast(error.message, "error");
            button.disabled = false;
          }
        });
      });
    };

    await load();
  };
})();
