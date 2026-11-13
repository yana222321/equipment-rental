/* Карточка заявки в модальном окне (клиент и администратор). */
(function () {
  const DOC_LABELS = { invoice: "Квитанция", act: "Акт выполненных работ" };

  function timeline(order) {
    if (!order.history || !order.history.length) {
      return `<p class="muted">История пока пуста</p>`;
    }
    return `<ol class="timeline">
      ${order.history
        .map((item, index) => {
          const isLast = index === order.history.length - 1;
          return `<li class="${isLast ? "is-current" : ""}">
            <span class="timeline-dot"></span>
            <div class="timeline-body">
              <div class="timeline-head">
                <b>${item.new_status_label}</b>
                <time>${UI.formatDate(item.changed_at)}</time>
              </div>
              ${item.comment ? `<p>${UI.escapeHtml(item.comment)}</p>` : ""}
              ${item.changed_by_name ? `<small>${UI.escapeHtml(item.changed_by_name)}</small>` : ""}
            </div>
          </li>`;
        })
        .join("")}
    </ol>`;
  }

  function partsTable(order) {
    if (!order.parts || !order.parts.length) return "";
    return `<div class="table-wrap">
      <table class="data-table data-table-compact">
        <thead><tr><th>Запчасть</th><th class="num">Кол-во</th><th class="num">Цена</th><th class="num">Сумма</th></tr></thead>
        <tbody>
          ${order.parts
            .map(
              (part) => `<tr>
                <td><b>${UI.escapeHtml(part.part_name)}</b><span class="cell-sub">${UI.escapeHtml(part.part_sku)}</span></td>
                <td class="num">${part.quantity}</td>
                <td class="num">${UI.money(part.fixed_price)}</td>
                <td class="num">${UI.money(part.total)}</td>
              </tr>`
            )
            .join("")}
        </tbody>
      </table>
    </div>`;
  }

  function receiptsBlock(order) {
    if (!order.receipts || !order.receipts.length) return "";
    return `<div class="receipt-links">
      ${order.receipts
        .map(
          (receipt) => `<a class="receipt-link" href="/r/${receipt.qr_token}" target="_blank" rel="noopener">
            <span class="receipt-icon">${window.icon("receipt", 20)}</span>
            <span><b>${DOC_LABELS[receipt.doc_type] || "Документ"}</b>
            <small>от ${UI.formatDate(receipt.issued_at)}</small></span>
            ${window.icon("external-link", 16)}
          </a>`
        )
        .join("")}
    </div>`;
  }

  function show(order, options = {}) {
    const { mode = "client", onRefresh } = options;
    const canCancel =
      mode === "client" && ["new", "accepted"].includes(order.status);
    const isAdmin = mode === "admin";

    const content = `
      <div class="detail-top">
        <div class="detail-device">
          <span class="device-badge">${window.icon(UI.deviceIcon(order.device_type), 26)}</span>
          <div>
            <h3>${UI.escapeHtml(order.device_model)}</h3>
            <p>${UI.escapeHtml(order.device_type)} · заявка №${order.id}</p>
          </div>
        </div>
        ${UI.statusBadge(order.status)}
      </div>

      <div class="detail-grid">
        <div><span>Услуга</span><b>${UI.escapeHtml(order.service_name)}</b></div>
        <div><span>Мастер</span><b>${UI.escapeHtml(order.master_name || "Не назначен")}</b></div>
        <div><span>Создана</span><b>${UI.formatDate(order.created_at)}</b></div>
        <div><span>Итого</span><b class="accent-text">${UI.money(order.total_cost)}</b></div>
        ${
          isAdmin
            ? `<div><span>Клиент</span><b>${UI.escapeHtml(order.client_name)}</b></div>
               <div><span>Телефон</span><b>${UI.escapeHtml(order.client_phone)}</b></div>`
            : ""
        }
        ${
          order.completed_at
            ? `<div><span>Завершена</span><b>${UI.formatDate(order.completed_at)}</b></div>`
            : ""
        }
      </div>

      <div class="detail-block">
        <h4>Неисправность</h4>
        <p class="detail-issue">${UI.escapeHtml(order.issue_desc)}</p>
        ${
          order.photo_url
            ? `<a class="detail-photo" href="${UI.escapeHtml(order.photo_url)}" target="_blank" rel="noopener">
                 <img src="${UI.escapeHtml(order.photo_url)}" alt="Фото устройства" loading="lazy">
               </a>`
            : ""
        }
      </div>

      <div class="detail-block">
        <h4>Смета</h4>
        <div class="cost-rows">
          <div><span>Работы</span><b>${UI.money(order.labor_cost)}</b></div>
          <div><span>Запчасти</span><b>${UI.money(order.parts_cost)}</b></div>
          <div class="cost-total"><span>Итого</span><b>${UI.money(order.total_cost)}</b></div>
        </div>
      </div>

      ${order.parts && order.parts.length ? `<div class="detail-block"><h4>Запчасти</h4>${partsTable(order)}</div>` : ""}
      ${order.receipts && order.receipts.length ? `<div class="detail-block"><h4>Документы</h4>${receiptsBlock(order)}</div>` : ""}

      <div class="detail-block">
        <h4>История заявки</h4>
        ${timeline(order)}
      </div>`;

    const footer = `
      <button class="btn btn-ghost" data-close>Закрыть</button>
      ${canCancel ? `<button class="btn btn-danger" data-cancel-order>Отменить заявку</button>` : ""}`;

    const instance = UI.modal({
      title: `Заявка №${order.id}`,
      content,
      footer,
      wide: true,
      onOpen(modal, close) {
        modal.querySelector("[data-close]").addEventListener("click", close);
        const cancelBtn = modal.querySelector("[data-cancel-order]");
        if (cancelBtn) {
          cancelBtn.addEventListener("click", async () => {
            const confirmed = await UI.confirm({
              title: "Отменить заявку?",
              message: "Заявка будет закрыта. Если устройство уже в работе, лучше связаться с мастером.",
              confirmText: "Да, отменить",
              danger: true,
            });
            if (!confirmed) return;
            try {
              await API.request(`/api/client/requests/${order.id}/cancel`, { method: "PATCH" });
              UI.toast("Заявка отменена", "info");
              close();
              if (onRefresh) onRefresh();
            } catch (error) {
              UI.toast(error.message, "error");
            }
          });
        }
      },
    });
    return instance;
  }

  window.OrderDetail = { show };
})();
