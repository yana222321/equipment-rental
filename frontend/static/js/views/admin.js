/* Панель администратора: заявки, услуги, сотрудники, склад. */
(function () {
  window.Views = window.Views || {};

  const TABS = [
    { key: "orders", label: "Заявки", icon: "list" },
    { key: "services", label: "Услуги", icon: "wrench" },
    { key: "employees", label: "Сотрудники", icon: "users" },
    { key: "warehouse", label: "Склад", icon: "package" },
  ];

  const state = {
    tab: "orders",
    orders: { q: "", status: "", masterId: "" },
    services: { q: "" },
    employees: { q: "" },
    warehouse: { q: "", lowOnly: false },
  };

  function field(label, input, hint = "") {
    return `<div class="field"><label>${label}</label>${input}${hint ? `<p class="field-hint">${hint}</p>` : ""}</div>`;
  }

  function tabCountLabel(count, one, few, many) {
    return `${count} ${UI.plural(count, one, few, many)}`;
  }

  Views.admin = async function adminView(root) {
    const drawShell = () => {
      root.innerHTML = `<section class="page-hero dashboard-hero">
        <div class="container">
          <div class="page-head">
            <div>
              <span class="eyebrow">Администрирование</span>
              <h1>Панель управления</h1>
              <p>Заявки, услуги, сотрудники и склад — в одном месте.</p>
            </div>
            <a class="btn btn-ghost" href="#/stats">${window.icon("chart", 17)} Статистика</a>
          </div>
          <div class="tabs" role="tablist">
            ${TABS.map(
              (tab) => `<button role="tab" class="${state.tab === tab.key ? "is-active" : ""}" data-tab="${tab.key}">
                ${window.icon(tab.icon, 17)} ${tab.label}
              </button>`
            ).join("")}
          </div>
        </div>
      </section>
      <section class="section section-flush">
        <div class="container"><div id="admin-content">${UI.skeletonCards(2)}</div></div>
      </section>`;

      root.querySelectorAll("[data-tab]").forEach((button) => {
        button.addEventListener("click", () => {
          if (state.tab === button.dataset.tab) return;
          state.tab = button.dataset.tab;
          drawShell();
          loadTab();
        });
      });
    };

    const content = () => root.querySelector("#admin-content");

    const loadTab = () => {
      if (state.tab === "orders") loadOrders();
      else if (state.tab === "services") loadServices();
      else if (state.tab === "employees") loadEmployees();
      else loadWarehouse();
    };

    // ---------- Заявки ----------

    const loadOrders = async () => {
      const box = content();
      box.innerHTML = UI.skeletonCards(2);
      const params = new URLSearchParams();
      if (state.orders.q) params.set("q", state.orders.q);
      if (state.orders.status) params.set("status", state.orders.status);
      if (state.orders.masterId) params.set("master_id", state.orders.masterId);
      try {
        const [orders, masters] = await Promise.all([
          API.request(`/api/admin/orders?${params}`),
          API.request("/api/admin/masters"),
        ]);
        box.innerHTML = `<div class="admin-toolbar">
            <div class="search-field grow">${window.icon("search", 17)}
              <input type="search" data-orders-search placeholder="Поиск по клиенту, модели или описанию" value="${UI.escapeHtml(state.orders.q)}">
            </div>
            <div class="select-wrap">
              <select data-orders-status>
                <option value="">Все статусы</option>
                ${Object.entries(UI.STATUS)
                  .map(
                    ([key, meta]) =>
                      `<option value="${key}" ${state.orders.status === key ? "selected" : ""}>${meta.label}</option>`
                  )
                  .join("")}
              </select>
            </div>
            <div class="select-wrap">
              <select data-orders-master>
                <option value="">Все мастера</option>
                ${masters
                  .map(
                    (master) =>
                      `<option value="${master.id}" ${String(state.orders.masterId) === String(master.id) ? "selected" : ""}>${UI.escapeHtml(master.full_name)}</option>`
                  )
                  .join("")}
              </select>
            </div>
            <span class="toolbar-count">${tabCountLabel(orders.length, "заявка", "заявки", "заявок")}</span>
          </div>
          <div class="table-wrap card table-card">
            <table class="data-table admin-orders-table">
              <thead><tr>
                <th>№</th><th>Устройство</th><th>Клиент</th><th>Мастер</th>
                <th>Статус</th><th class="num">Сумма</th><th>Создана</th><th></th>
              </tr></thead>
              <tbody>
                ${
                  orders.length
                    ? orders
                        .map(
                          (order) => `<tr data-row="${order.id}">
                            <td class="mono">#${order.id}</td>
                            <td><b>${UI.escapeHtml(order.device_model)}</b><span class="cell-sub">${UI.escapeHtml(order.service_name)}</span></td>
                            <td>${UI.escapeHtml(order.client_name)}<span class="cell-sub">${UI.escapeHtml(order.client_phone)}</span></td>
                            <td>
                              <select class="select-inline" data-assign="${order.id}" ${["completed", "canceled"].includes(order.status) ? "disabled" : ""}>
                                <option value="">Не назначен</option>
                                ${masters
                                  .map(
                                    (master) =>
                                      `<option value="${master.id}" ${order.master_id === master.id ? "selected" : ""}>${UI.escapeHtml(master.full_name)}</option>`
                                  )
                                  .join("")}
                              </select>
                            </td>
                            <td>${UI.statusBadge(order.status)}</td>
                            <td class="num"><b>${UI.money(order.total_cost)}</b></td>
                            <td class="nowrap">${UI.formatDate(order.created_at, { withTime: false })}</td>
                            <td><button class="icon-btn" data-view="${order.id}" aria-label="Подробнее">${window.icon("chevron-right", 18)}</button></td>
                          </tr>`
                        )
                        .join("")
                    : `<tr><td colspan="8"><div class="empty-state compact">${window.icon("search", 26)}<p>Заявки не найдены</p></div></td></tr>`
                }
              </tbody>
            </table>
          </div>`;

        const search = box.querySelector("[data-orders-search]");
        search.addEventListener(
          "input",
          UI.debounce(() => {
            state.orders.q = search.value.trim();
            loadOrders();
          }, 350)
        );
        box.querySelector("[data-orders-status]").addEventListener("change", (event) => {
          state.orders.status = event.target.value;
          loadOrders();
        });
        box.querySelector("[data-orders-master]").addEventListener("change", (event) => {
          state.orders.masterId = event.target.value;
          loadOrders();
        });

        box.querySelectorAll("[data-assign]").forEach((select) => {
          select.addEventListener("click", (event) => event.stopPropagation());
          select.addEventListener("change", async () => {
            const id = select.dataset.assign;
            select.disabled = true;
            try {
              await API.request(`/api/admin/orders/${id}/assign`, {
                method: "PATCH",
                body: { master_id: select.value ? Number(select.value) : null },
              });
              UI.toast("Мастер назначен", "success");
              loadOrders();
            } catch (error) {
              UI.toast(error.message, "error");
              select.disabled = false;
            }
          });
        });

        box.querySelectorAll("[data-view]").forEach((button) => {
          button.addEventListener("click", () => {
            const order = orders.find((o) => String(o.id) === button.dataset.view);
            if (order) OrderDetail.show(order, { mode: "admin" });
          });
        });

        box.querySelectorAll("[data-row]").forEach((row) => {
          row.addEventListener("click", () => {
            const order = orders.find((o) => String(o.id) === row.dataset.row);
            if (order) OrderDetail.show(order, { mode: "admin" });
          });
        });
      } catch (error) {
        box.innerHTML = `<div class="empty-state card">${window.icon("alert", 30)}<p>${UI.escapeHtml(error.message)}</p></div>`;
      }
    };

    // ---------- Услуги ----------

    const loadServices = async () => {
      const box = content();
      box.innerHTML = UI.skeletonCards(2);
      try {
        const services = await API.request("/api/admin/services");
        const categories = [...new Set(services.map((s) => s.category))];
        const filtered = services.filter((service) => {
          if (!state.services.q) return true;
          const term = state.services.q.toLowerCase();
          return `${service.name} ${service.category} ${service.description}`.toLowerCase().includes(term);
        });
        box.innerHTML = `<div class="admin-toolbar">
            <div class="search-field grow">${window.icon("search", 17)}
              <input type="search" data-services-search placeholder="Поиск услуги" value="${UI.escapeHtml(state.services.q)}">
            </div>
            <span class="toolbar-count">${tabCountLabel(services.length, "услуга", "услуги", "услуг")}</span>
            <button class="btn btn-primary" data-add-service>${window.icon("plus", 17)} Добавить услугу</button>
          </div>
          <div class="table-wrap card table-card">
            <table class="data-table">
              <thead><tr><th>Категория</th><th>Услуга</th><th class="num">Цена</th><th class="num">Срок</th><th></th></tr></thead>
              <tbody>
                ${filtered
                  .map(
                    (service) => `<tr>
                      <td><span class="cat-chip">${window.icon("wrench", 14)} ${UI.escapeHtml(service.category)}</span></td>
                      <td><b>${UI.escapeHtml(service.name)}</b><span class="cell-sub clamp">${UI.escapeHtml(service.description)}</span></td>
                      <td class="num"><b>${UI.money(service.base_price)}</b></td>
                      <td class="num nowrap">${service.est_days} ${UI.plural(service.est_days, "день", "дня", "дней")}</td>
                      <td class="actions-cell">
                        <button class="icon-btn" data-edit-service="${service.id}" aria-label="Изменить">${window.icon("edit", 16)}</button>
                        <button class="icon-btn danger" data-delete-service="${service.id}" aria-label="Удалить">${window.icon("trash", 16)}</button>
                      </td>
                    </tr>`
                  )
                  .join("") || `<tr><td colspan="5"><div class="empty-state compact">${window.icon("search", 26)}<p>Услуги не найдены</p></div></td></tr>`}
              </tbody>
            </table>
          </div>`;

        const search = box.querySelector("[data-services-search]");
        search.addEventListener(
          "input",
          UI.debounce(() => {
            state.services.q = search.value.trim();
            loadServices();
            // сохраняем фокус после перерисовки
            setTimeout(() => {
              const next = content()?.querySelector("[data-services-search]");
              if (next) {
                next.focus();
                next.setSelectionRange(next.value.length, next.value.length);
              }
            }, 30);
          }, 350)
        );

        box.querySelector("[data-add-service]").addEventListener("click", () =>
          serviceModal(null, categories, loadServices)
        );
        box.querySelectorAll("[data-edit-service]").forEach((button) => {
          const service = services.find((s) => String(s.id) === button.dataset.editService);
          button.addEventListener("click", () => serviceModal(service, categories, loadServices));
        });
        box.querySelectorAll("[data-delete-service]").forEach((button) => {
          button.addEventListener("click", async () => {
            const service = services.find((s) => String(s.id) === button.dataset.deleteService);
            const confirmed = await UI.confirm({
              title: "Удалить услугу?",
              message: `«${service.name}» исчезнет из каталога. Услуги, использованные в заявках, удалить нельзя.`,
              confirmText: "Удалить",
              danger: true,
            });
            if (!confirmed) return;
            try {
              await API.request(`/api/admin/services/${service.id}`, { method: "DELETE" });
              UI.toast("Услуга удалена", "info");
              loadServices();
            } catch (error) {
              UI.toast(error.message, "error");
            }
          });
        });
      } catch (error) {
        box.innerHTML = `<div class="empty-state card">${window.icon("alert", 30)}<p>${UI.escapeHtml(error.message)}</p></div>`;
      }
    };

    const serviceModal = (service, categories, onDone) => {
      const isEdit = Boolean(service);
      const instance = UI.modal({
        title: isEdit ? "Изменить услугу" : "Новая услуга",
        content: `<form id="service-form" class="modal-form">
          ${field(
            "Категория",
            `<input name="category" list="category-list" required maxlength="80" value="${UI.escapeHtml(service?.category || "")}" placeholder="Например, Смартфоны">
             <datalist id="category-list">${categories.map((c) => `<option value="${UI.escapeHtml(c)}">`).join("")}</datalist>`
          )}
          ${field("Название", `<input name="name" required maxlength="160" value="${UI.escapeHtml(service?.name || "")}" placeholder="Замена экрана">`)}
          ${field("Описание", `<textarea name="description" rows="3" maxlength="2000" placeholder="Что входит в услугу">${UI.escapeHtml(service?.description || "")}</textarea>`)}
          <div class="grid-2">
            ${field("Базовая цена, ₽", `<input name="base_price" type="number" min="0" step="50" required value="${service?.base_price ?? 0}">`)}
            ${field("Срок, дней", `<input name="est_days" type="number" min="1" max="365" required value="${service?.est_days ?? 1}">`)}
          </div>
          <p class="form-error" data-error hidden></p>
        </form>`,
        footer: `<button class="btn btn-ghost" data-cancel>Отмена</button>
          <button class="btn btn-primary" data-save>${window.icon("check", 16)} Сохранить</button>`,
      });

      const form = instance.element.querySelector("#service-form");
      const errorBox = form.querySelector("[data-error]");
      instance.element.querySelector("[data-cancel]").addEventListener("click", instance.close);
      instance.element.querySelector("[data-save]").addEventListener("click", async () => {
        if (!form.checkValidity()) {
          form.reportValidity();
          return;
        }
        const data = Object.fromEntries(new FormData(form));
        data.base_price = Number(data.base_price);
        data.est_days = Number(data.est_days);
        try {
          await API.request(isEdit ? `/api/admin/services/${service.id}` : "/api/admin/services", {
            method: isEdit ? "PATCH" : "POST",
            body: data,
          });
          instance.close();
          UI.toast(isEdit ? "Услуга обновлена" : "Услуга добавлена", "success");
          onDone();
        } catch (error) {
          errorBox.textContent = error.message;
          errorBox.hidden = false;
        }
      });
    };

    // ---------- Сотрудники ----------

    const loadEmployees = async () => {
      const box = content();
      box.innerHTML = UI.skeletonCards(2);
      try {
        const employees = await API.request("/api/admin/employees");
        box.innerHTML = `<div class="admin-toolbar">
            <span class="toolbar-count">${tabCountLabel(employees.length, "сотрудник", "сотрудника", "сотрудников")}</span>
            <button class="btn btn-primary" data-add-employee>${window.icon("plus", 17)} Добавить сотрудника</button>
          </div>
          <div class="employee-grid">
            ${
              employees.length
                ? employees
                    .map(
                      (employee) => `<article class="employee-card">
                        <div class="employee-head">
                          <span class="avatar">${UI.initials(employee.full_name)}</span>
                          <div class="employee-name">
                            <b>${UI.escapeHtml(employee.full_name)}</b>
                            <span class="role-badge role-${employee.role}">${UI.ROLE_LABELS[employee.role] || employee.role}</span>
                          </div>
                          <div class="employee-actions">
                            <button class="icon-btn" data-edit-employee="${employee.id}" aria-label="Изменить">${window.icon("edit", 16)}</button>
                            ${
                              employee.id === API.user?.id
                                ? ""
                                : `<button class="icon-btn danger" data-delete-employee="${employee.id}" aria-label="Удалить">${window.icon("trash", 16)}</button>`
                            }
                          </div>
                        </div>
                        <div class="employee-contacts">
                          <a href="mailto:${UI.escapeHtml(employee.email)}">${window.icon("mail", 15)} ${UI.escapeHtml(employee.email)}</a>
                          <a href="tel:${UI.escapeHtml(employee.phone)}">${window.icon("phone", 15)} ${UI.escapeHtml(employee.phone)}</a>
                        </div>
                        <div class="employee-foot">В команде с ${UI.formatDay(employee.created_at)}</div>
                      </article>`
                    )
                    .join("")
                : `<div class="empty-state card">${window.icon("users", 30)}<p>Сотрудников пока нет</p></div>`
            }
          </div>`;

        box.querySelector("[data-add-employee]").addEventListener("click", () => employeeModal(null, loadEmployees));
        box.querySelectorAll("[data-edit-employee]").forEach((button) => {
          const employee = employees.find((e) => String(e.id) === button.dataset.editEmployee);
          button.addEventListener("click", () => employeeModal(employee, loadEmployees));
        });
        box.querySelectorAll("[data-delete-employee]").forEach((button) => {
          button.addEventListener("click", async () => {
            const employee = employees.find((e) => String(e.id) === button.dataset.deleteEmployee);
            const confirmed = await UI.confirm({
              title: "Удалить сотрудника?",
              message: `${employee.full_name} потеряет доступ к системе. Его заявки станут свободными.`,
              confirmText: "Удалить",
              danger: true,
            });
            if (!confirmed) return;
            try {
              await API.request(`/api/admin/employees/${employee.id}`, { method: "DELETE" });
              UI.toast("Сотрудник удалён", "info");
              loadEmployees();
            } catch (error) {
              UI.toast(error.message, "error");
            }
          });
        });
      } catch (error) {
        box.innerHTML = `<div class="empty-state card">${window.icon("alert", 30)}<p>${UI.escapeHtml(error.message)}</p></div>`;
      }
    };

    const employeeModal = (employee, onDone) => {
      const isEdit = Boolean(employee);
      const instance = UI.modal({
        title: isEdit ? "Профиль сотрудника" : "Новый сотрудник",
        content: `<form id="employee-form" class="modal-form">
          ${field("ФИО", `<input name="full_name" required maxlength="120" value="${UI.escapeHtml(employee?.full_name || "")}" placeholder="Иван Иванов">`)}
          ${
            isEdit
              ? ""
              : `<div class="grid-2">
                  ${field("Email", `<input name="email" type="email" required value="" placeholder="ivan@workshop.ru">`)}
                  ${field("Телефон", `<input name="phone" type="tel" required value="" placeholder="+7 (900) 000-00-00">`)}
                </div>
                ${field("Пароль", `<input name="password" type="password" required minlength="6" value="" placeholder="Минимум 6 символов" autocomplete="new-password">`)}`
          }
          ${field(
            "Роль",
            `<div class="select-wrap"><select name="role">
              <option value="master" ${employee?.role === "master" || !employee ? "selected" : ""}>Мастер</option>
              <option value="admin" ${employee?.role === "admin" ? "selected" : ""}>Администратор</option>
            </select></div>`
          )}
          ${isEdit ? field("Телефон", `<input name="phone" type="tel" required value="${UI.escapeHtml(employee.phone)}">`) : ""}
          <p class="form-error" data-error hidden></p>
        </form>`,
        footer: `<button class="btn btn-ghost" data-cancel>Отмена</button>
          <button class="btn btn-primary" data-save>${window.icon("check", 16)} Сохранить</button>`,
      });

      const form = instance.element.querySelector("#employee-form");
      const errorBox = form.querySelector("[data-error]");
      instance.element.querySelector("[data-cancel]").addEventListener("click", instance.close);
      instance.element.querySelector("[data-save]").addEventListener("click", async () => {
        if (!form.checkValidity()) {
          form.reportValidity();
          return;
        }
        const data = Object.fromEntries(new FormData(form));
        try {
          await API.request(
            isEdit ? `/api/admin/employees/${employee.id}` : "/api/admin/employees",
            { method: isEdit ? "PATCH" : "POST", body: data }
          );
          instance.close();
          UI.toast(isEdit ? "Данные обновлены" : "Сотрудник добавлен", "success");
          onDone();
        } catch (error) {
          errorBox.textContent = error.message;
          errorBox.hidden = false;
        }
      });
    };

    // ---------- Склад ----------

    const loadWarehouse = async () => {
      const box = content();
      box.innerHTML = UI.skeletonCards(2);
      const params = new URLSearchParams();
      if (state.warehouse.q) params.set("q", state.warehouse.q);
      if (state.warehouse.lowOnly) params.set("low_only", "true");
      try {
        const parts = await API.request(`/api/admin/spare-parts?${params}`);
        const all = await API.request("/api/admin/spare-parts");
        const low = all.filter((p) => p.low_stock);
        box.innerHTML = `<div class="admin-toolbar">
            <div class="search-field grow">${window.icon("search", 17)}
              <input type="search" data-warehouse-search placeholder="Поиск по названию или артикулу" value="${UI.escapeHtml(state.warehouse.q)}">
            </div>
            <label class="switch-label">
              <input type="checkbox" data-low-only ${state.warehouse.lowOnly ? "checked" : ""}>
              <span>Только дефицит</span>
            </label>
            <span class="toolbar-count">${tabCountLabel(parts.length, "позиция", "позиции", "позиций")}</span>
            <button class="btn btn-primary" data-add-part>${window.icon("plus", 17)} Добавить запчасть</button>
          </div>
          ${
            low.length
              ? `<div class="notice notice-warn">${window.icon("alert", 18)}
                  <span>Заканчиваются на складе: ${low.map((p) => `${UI.escapeHtml(p.name)} (${p.stock_qty})`).join(", ")}</span></div>`
              : ""
          }
          <div class="table-wrap card table-card">
            <table class="data-table">
              <thead><tr><th>Артикул</th><th>Запчасть</th><th class="num">Остаток</th><th class="num">Мин.</th><th class="num">Цена</th><th></th></tr></thead>
              <tbody>
                ${parts
                  .map(
                    (part) => `<tr class="${part.low_stock ? "row-warn" : ""}">
                      <td class="mono">${UI.escapeHtml(part.sku)}</td>
                      <td><b>${UI.escapeHtml(part.name)}</b>${part.low_stock ? `<span class="cell-sub danger-text">Ниже минимального остатка</span>` : ""}</td>
                      <td class="num">
                        <div class="stock-control">
                          <button class="stock-btn" data-stock="${part.id}" data-delta="-1" ${part.stock_qty <= 0 ? "disabled" : ""}>${window.icon("minus", 14)}</button>
                          <b>${part.stock_qty}</b>
                          <button class="stock-btn" data-stock="${part.id}" data-delta="1">${window.icon("plus", 14)}</button>
                        </div>
                      </td>
                      <td class="num">${part.min_threshold}</td>
                      <td class="num"><b>${UI.money(part.unit_price)}</b></td>
                      <td class="actions-cell">
                        <button class="icon-btn" data-edit-part="${part.id}" aria-label="Изменить">${window.icon("edit", 16)}</button>
                        <button class="icon-btn danger" data-delete-part="${part.id}" aria-label="Удалить">${window.icon("trash", 16)}</button>
                      </td>
                    </tr>`
                  )
                  .join("") || `<tr><td colspan="6"><div class="empty-state compact">${window.icon("package", 26)}<p>Запчасти не найдены</p></div></td></tr>`}
              </tbody>
            </table>
          </div>`;

        const search = box.querySelector("[data-warehouse-search]");
        search.addEventListener(
          "input",
          UI.debounce(() => {
            state.warehouse.q = search.value.trim();
            loadWarehouse();
            setTimeout(() => {
              const next = content()?.querySelector("[data-warehouse-search]");
              if (next) {
                next.focus();
                next.setSelectionRange(next.value.length, next.value.length);
              }
            }, 30);
          }, 350)
        );
        box.querySelector("[data-low-only]").addEventListener("change", (event) => {
          state.warehouse.lowOnly = event.target.checked;
          loadWarehouse();
        });

        box.querySelector("[data-add-part]").addEventListener("click", () => partModal(null, loadWarehouse));
        box.querySelectorAll("[data-edit-part]").forEach((button) => {
          const part = parts.find((p) => String(p.id) === button.dataset.editPart);
          button.addEventListener("click", () => partModal(part, loadWarehouse));
        });
        box.querySelectorAll("[data-delete-part]").forEach((button) => {
          button.addEventListener("click", async () => {
            const part = parts.find((p) => String(p.id) === button.dataset.deletePart);
            const confirmed = await UI.confirm({
              title: "Удалить запчасть?",
              message: `«${part.name}» будет удалена со склада. Позиции, использованные в заявках, удалить нельзя.`,
              confirmText: "Удалить",
              danger: true,
            });
            if (!confirmed) return;
            try {
              await API.request(`/api/admin/spare-parts/${part.id}`, { method: "DELETE" });
              UI.toast("Запчасть удалена", "info");
              loadWarehouse();
            } catch (error) {
              UI.toast(error.message, "error");
            }
          });
        });
        box.querySelectorAll("[data-stock]").forEach((button) => {
          button.addEventListener("click", async () => {
            const part = parts.find((p) => String(p.id) === button.dataset.stock);
            const delta = Number(button.dataset.delta);
            button.disabled = true;
            try {
              await API.request(`/api/admin/spare-parts/${part.id}`, {
                method: "PATCH",
                body: { stock_qty: part.stock_qty + delta },
              });
              loadWarehouse();
            } catch (error) {
              UI.toast(error.message, "error");
              button.disabled = false;
            }
          });
        });
      } catch (error) {
        box.innerHTML = `<div class="empty-state card">${window.icon("alert", 30)}<p>${UI.escapeHtml(error.message)}</p></div>`;
      }
    };

    const partModal = (part, onDone) => {
      const isEdit = Boolean(part);
      const instance = UI.modal({
        title: isEdit ? "Изменить запчасть" : "Новая запчасть",
        content: `<form id="part-form" class="modal-form">
          <div class="grid-2">
            ${field("Артикул", `<input name="sku" required maxlength="64" value="${UI.escapeHtml(part?.sku || "")}" placeholder="SCR-IP13">`)}
            ${field("Название", `<input name="name" required maxlength="160" value="${UI.escapeHtml(part?.name || "")}" placeholder="Дисплей iPhone 13">`)}
          </div>
          <div class="grid-2">
            ${field("Остаток, шт.", `<input name="stock_qty" type="number" min="0" required value="${part?.stock_qty ?? 0}">`)}
            ${field("Мин. остаток", `<input name="min_threshold" type="number" min="0" required value="${part?.min_threshold ?? 1}">`)}
          </div>
          ${field("Цена, ₽", `<input name="unit_price" type="number" min="0" step="10" required value="${part?.unit_price ?? 0}">`)}
          <p class="form-error" data-error hidden></p>
        </form>`,
        footer: `<button class="btn btn-ghost" data-cancel>Отмена</button>
          <button class="btn btn-primary" data-save>${window.icon("check", 16)} Сохранить</button>`,
      });

      const form = instance.element.querySelector("#part-form");
      const errorBox = form.querySelector("[data-error]");
      instance.element.querySelector("[data-cancel]").addEventListener("click", instance.close);
      instance.element.querySelector("[data-save]").addEventListener("click", async () => {
        if (!form.checkValidity()) {
          form.reportValidity();
          return;
        }
        const data = Object.fromEntries(new FormData(form));
        ["stock_qty", "min_threshold"].forEach((key) => (data[key] = Number(data[key])));
        data.unit_price = Number(data.unit_price);
        try {
          await API.request(isEdit ? `/api/admin/spare-parts/${part.id}` : "/api/admin/spare-parts", {
            method: isEdit ? "PATCH" : "POST",
            body: data,
          });
          instance.close();
          UI.toast(isEdit ? "Запчасть обновлена" : "Запчасть добавлена", "success");
          onDone();
        } catch (error) {
          errorBox.textContent = error.message;
          errorBox.hidden = false;
        }
      });
    };

    drawShell();
    loadTab();
  };
})();
