/* Форма создания заявки: используется на главной и на отдельной странице. */
(function () {
  const DEVICE_TYPES = [
    "Смартфон",
    "Ноутбук",
    "Планшет",
    "Бытовая техника",
    "Аудиотехника",
    "Другое",
  ];

  let cache = null;

  async function loadServices(force = false) {
    if (!cache || force) {
      cache = await API.services();
    }
    return cache;
  }

  function optionsGrouped(services, selectedId) {
    const groups = new Map();
    services.forEach((service) => {
      if (!groups.has(service.category)) groups.set(service.category, []);
      groups.get(service.category).push(service);
    });
    return [...groups.entries()]
      .map(
        ([category, items]) =>
          `<optgroup label="${UI.escapeHtml(category)}">${items
            .map(
              (s) =>
                `<option value="${s.id}" ${String(s.id) === String(selectedId) ? "selected" : ""}>${UI.escapeHtml(
                  s.name
                )} — от ${UI.money(s.base_price)}</option>`
            )
            .join("")}</optgroup>`
      )
      .join("");
  }

  function markup(services, options) {
    const draft = API.draft || {};
    const selectedService = options.serviceId || draft.service_id || "";
    const device = draft.device_type || "Смартфон";
    const model = draft.device_model || "";
    const issue = draft.issue_desc || "";
    return `
      <form class="order-form" novalidate>
        <div class="field">
          <label for="of-service">Услуга</label>
          <div class="select-wrap">
            <select id="of-service" name="service_id" required>
              <option value="">Выберите услугу</option>
              ${optionsGrouped(services, selectedService)}
            </select>
          </div>
          <p class="field-hint" data-estimate>Стоимость и срок уточнит мастер после диагностики</p>
          <p class="field-error" data-error-for="service_id"></p>
        </div>

        <div class="order-form-grid">
          <div class="field">
            <label for="of-device">Тип устройства</label>
            <div class="select-wrap">
              <select id="of-device" name="device_type" required>
                ${DEVICE_TYPES.map(
                  (type) => `<option ${type === device ? "selected" : ""}>${type}</option>`
                ).join("")}
              </select>
            </div>
            <p class="field-error" data-error-for="device_type"></p>
          </div>
          <div class="field">
            <label for="of-model">Модель</label>
            <input id="of-model" name="device_model" type="text" maxlength="160"
              placeholder="Например, iPhone 13" value="${UI.escapeHtml(model)}" required>
            <p class="field-error" data-error-for="device_model"></p>
          </div>
        </div>

        <div class="field">
          <label for="of-issue">Опишите проблему</label>
          <textarea id="of-issue" name="issue_desc" rows="3" maxlength="2000" required
            placeholder="Что случилось с устройством? Когда началось?">${UI.escapeHtml(issue)}</textarea>
          <p class="field-error" data-error-for="issue_desc"></p>
        </div>

        <div class="field">
          <label>Фото устройства <span class="label-optional">необязательно</span></label>
          <label class="upload" data-upload>
            <span class="upload-icon">${window.icon("camera", 20)}</span>
            <span class="upload-text"><b>Прикрепить фото</b><small>JPG, PNG или WebP до 5 МБ</small></span>
            <input type="file" accept="image/jpeg,image/png,image/webp" hidden>
          </label>
          <div class="upload-preview" data-preview hidden></div>
        </div>

        <button type="submit" class="btn btn-primary btn-block btn-lg" data-submit>
          ${window.icon("wrench", 18)} <span>Отправить заявку</span>
        </button>
        <p class="form-note">${window.icon("shield", 15)}
          <span>${
            API.user
              ? "Мастер свяжется с вами в течение 15 минут в рабочее время."
              : "Для отправки потребуется войти — это займёт 30 секунд."
          }</span>
        </p>
      </form>`;
  }

  function mount(root, options = {}) {
    const { services: provided, serviceId = "", compact = false, onSuccess } = options;
    if (!root) return;

    const render = (services) => {
      root.innerHTML = markup(services, { serviceId });
      bind(root, services, { onSuccess });
    };

    if (provided && provided.length) {
      render(provided);
      return;
    }
    root.innerHTML = `<div class="order-form-skeleton">
      <div class="skeleton skeleton-text"></div>
      <div class="skeleton skeleton-input"></div>
      <div class="skeleton skeleton-input"></div>
      <div class="skeleton skeleton-input tall"></div>
      <div class="skeleton skeleton-button"></div>
    </div>`;
    loadServices()
      .then(render)
      .catch((error) => {
        root.innerHTML = `<div class="empty-state compact">
          ${window.icon("alert", 28)}
          <p>Не удалось загрузить услуги</p>
          <button class="btn btn-ghost btn-sm" data-retry>Повторить</button>
        </div>`;
        root.querySelector("[data-retry]")?.addEventListener("click", () => mount(root, options));
      });
  }

  function bind(root, services, { onSuccess }) {
    const form = root.querySelector("form");
    const serviceSelect = form.querySelector("#of-service");
    const modelInput = form.querySelector("#of-model");
    const issueInput = form.querySelector("#of-issue");
    const estimate = form.querySelector("[data-estimate]");
    const upload = form.querySelector("[data-upload]");
    const fileInput = upload.querySelector("input[type=file]");
    const preview = form.querySelector("[data-preview]");
    const submit = form.querySelector("[data-submit]");
    let photoFile = null;
    let previewUrl = null;

    const showEstimate = () => {
      const service = services.find((s) => String(s.id) === serviceSelect.value);
      if (!service) {
        estimate.textContent = "Стоимость и срок уточнит мастер после диагностики";
        return;
      }
      const days = service.est_days;
      estimate.innerHTML = `Ориентировочно <b>от ${UI.money(service.base_price)}</b> · ${days} ${UI.plural(
        days,
        "день",
        "дня",
        "дней"
      )}`;
    };

    const setError = (name, message) => {
      const field = form.querySelector(`[data-error-for="${name}"]`);
      if (field) field.textContent = message || "";
      const input = form.querySelector(`[name="${name}"]`);
      if (input) {
        input.classList.toggle("is-invalid", Boolean(message));
        input.setAttribute("aria-invalid", message ? "true" : "false");
      }
    };

    const clearErrors = () => {
      ["service_id", "device_type", "device_model", "issue_desc"].forEach((name) => setError(name, ""));
    };

    const resetPreview = () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      previewUrl = null;
      preview.hidden = true;
      preview.innerHTML = "";
    };

    const showPreview = (file) => {
      resetPreview();
      previewUrl = URL.createObjectURL(file);
      preview.hidden = false;
      preview.innerHTML = `<img src="${previewUrl}" alt="Фото устройства">
        <div class="upload-preview-meta"><b>${UI.escapeHtml(file.name)}</b>
        <small>${(file.size / 1024 / 1024).toFixed(1)} МБ</small></div>
        <button type="button" class="icon-btn" data-remove-photo aria-label="Убрать фото">${window.icon("close", 16)}</button>`;
      preview.querySelector("[data-remove-photo]").addEventListener("click", () => {
        photoFile = null;
        fileInput.value = "";
        upload.classList.remove("has-file");
        resetPreview();
      });
      upload.classList.add("has-file");
    };

    fileInput.addEventListener("change", () => {
      const file = fileInput.files[0];
      if (!file) return;
      if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
        UI.toast("Поддерживаются только JPG, PNG и WebP", "error");
        fileInput.value = "";
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        UI.toast("Файл больше 5 МБ", "error");
        fileInput.value = "";
        return;
      }
      photoFile = file;
      showPreview(file);
    });

    serviceSelect.addEventListener("change", () => {
      setError("service_id", "");
      showEstimate();
    });
    modelInput.addEventListener("input", () => setError("device_model", ""));
    issueInput.addEventListener("input", () => setError("issue_desc", ""));

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      clearErrors();
      const serviceId = serviceSelect.value;
      const model = modelInput.value.trim();
      const issue = issueInput.value.trim();
      let valid = true;
      if (!serviceId) {
        setError("service_id", "Выберите услугу");
        valid = false;
      }
      if (!model) {
        setError("device_model", "Укажите модель устройства");
        valid = false;
      }
      if (issue.length < 10) {
        setError("issue_desc", "Опишите проблему подробнее — минимум 10 символов");
        valid = false;
      }
      if (!valid) {
        form.querySelector(".is-invalid")?.focus();
        return;
      }

      const draft = {
        service_id: Number(serviceId),
        device_type: form.querySelector("#of-device").value,
        device_model: model,
        issue_desc: issue,
        created: Date.now(),
      };

      if (!API.user) {
        API.saveDraft(draft);
        API.setNext("/new-order");
        UI.toast("Войдите или зарегистрируйтесь, чтобы отправить заявку", "info");
        if (window.App) App.navigate("/login");
        else window.location.hash = "#/login";
        return;
      }

      submit.disabled = true;
      const original = submit.innerHTML;
      submit.innerHTML = `<span class="spinner"></span><span>Отправляем…</span>`;
      try {
        let photoUrl = null;
        if (photoFile && API.token) {
          const data = new FormData();
          data.append("file", photoFile);
          const uploaded = await API.request("/api/uploads", { method: "POST", body: data });
          photoUrl = uploaded.url;
        }
        const order = await API.request("/api/client/requests", {
          method: "POST",
          body: { ...draft, photo_url: photoUrl },
        });
        API.clearDraft();
        UI.toast(`Заявка №${order.id} создана. Мастер уже получил уведомление`, "success");
        if (onSuccess) onSuccess(order);
        else if (window.App) App.navigate(`/client?order=${order.id}`);
      } catch (error) {
        UI.toast(error.message, "error", 6000);
      } finally {
        submit.disabled = false;
        submit.innerHTML = original;
      }
    });

    showEstimate();
  }

  window.OrderForm = { mount, loadServices, DEVICE_TYPES };
})();
