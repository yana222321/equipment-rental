/* API-клиент, сессия, форматирование, тосты и модальные окна. */
(function () {
  const TOKEN_KEY = "workshop.token";
  const USER_KEY = "workshop.user";
  const DRAFT_KEY = "workshop.draft";
  const NEXT_KEY = "workshop.next";

  const STATUS = {
    new: { label: "Новая", tone: "info" },
    accepted: { label: "Принята", tone: "info" },
    diagnostics: { label: "Диагностика", tone: "warn" },
    in_progress: { label: "В работе", tone: "warn" },
    waiting_parts: { label: "Ждёт запчасти", tone: "danger" },
    ready: { label: "Готова к выдаче", tone: "ok" },
    completed: { label: "Завершена", tone: "ok" },
    canceled: { label: "Отменена", tone: "muted" },
  };

  const TRANSITIONS = {
    new: ["accepted", "diagnostics", "canceled"],
    accepted: ["diagnostics", "in_progress", "canceled"],
    diagnostics: ["in_progress", "waiting_parts", "ready", "canceled"],
    in_progress: ["waiting_parts", "ready", "canceled"],
    waiting_parts: ["in_progress", "ready", "canceled"],
    ready: ["completed", "in_progress"],
    completed: [],
    canceled: [],
  };

  const ROLE_LABELS = { client: "Клиент", master: "Мастер", admin: "Администратор" };

  let memoryToken = null;
  let memoryUser = null;

  function safeParse(value, fallback = null) {
    try {
      return JSON.parse(value);
    } catch {
      return fallback;
    }
  }

  const API = {
    status: STATUS,
    transitions: TRANSITIONS,
    roleLabels: ROLE_LABELS,

    get token() {
      return localStorage.getItem(TOKEN_KEY) || memoryToken;
    },
    get user() {
      return safeParse(localStorage.getItem(USER_KEY)) || memoryUser;
    },
    setSession(token, user) {
      memoryToken = token;
      memoryUser = user;
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    },
    clearSession() {
      memoryToken = null;
      memoryUser = null;
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    },
    get draft() {
      return safeParse(localStorage.getItem(DRAFT_KEY));
    },
    saveDraft(draft) {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    },
    clearDraft() {
      localStorage.removeItem(DRAFT_KEY);
    },
    setNext(path) {
      sessionStorage.setItem(NEXT_KEY, path);
    },
    popNext() {
      const path = sessionStorage.getItem(NEXT_KEY);
      sessionStorage.removeItem(NEXT_KEY);
      return path;
    },

    async request(path, options = {}) {
      const { method = "GET", body, headers = {}, signal } = options;
      const finalHeaders = { Accept: "application/json", ...headers };
      let payload = body;
      if (body !== undefined && body !== null && !(body instanceof FormData)) {
        finalHeaders["Content-Type"] = "application/json";
        payload = JSON.stringify(body);
      }
      if (this.token) finalHeaders.Authorization = `Bearer ${this.token}`;

      let response;
      try {
        response = await fetch(path, { method, headers: finalHeaders, body: payload, signal });
      } catch (error) {
        if (error.name === "AbortError") throw error;
        throw new Error("Нет связи с сервером. Проверьте интернет и попробуйте ещё раз.");
      }

      if (response.status === 204) return null;

      const isJson = (response.headers.get("content-type") || "").includes("application/json");
      const data = isJson ? await response.json().catch(() => null) : await response.text().catch(() => null);

      if (!response.ok) {
        if (response.status === 401 && this.token) {
          this.clearSession();
          window.dispatchEvent(new CustomEvent("session:expired"));
        }
        const error = new Error(errorMessage(data, response.status));
        error.status = response.status;
        throw error;
      }
      return data;
    },

    login(email, password) {
      return this.request("/api/auth/login", { method: "POST", body: { email, password } });
    },
    register(payload) {
      return this.request("/api/auth/register", { method: "POST", body: payload });
    },
    me() {
      return this.request("/api/auth/me");
    },
    services(params = {}) {
      const query = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== "") query.set(k, v);
      });
      const suffix = query.toString() ? `?${query}` : "";
      return this.request(`/api/services${suffix}`);
    },
    categories() {
      return this.request("/api/services/categories");
    },
  };

  function errorMessage(data, status) {
    if (data && typeof data.detail === "string") return data.detail;
    if (data && Array.isArray(data.detail)) {
      return data.detail
        .map((item) => {
          const field = Array.isArray(item.loc) ? item.loc[item.loc.length - 1] : "";
          const map = { email: "Email", password: "Пароль", phone: "Телефон", full_name: "ФИО" };
          return item.msg ? `${map[field] || ""} ${item.msg}`.trim() : "";
        })
        .filter(Boolean)
        .join("; ");
    }
    if (status === 403) return "Недостаточно прав для этого действия";
    if (status === 404) return "Не найдено";
    if (status >= 500) return "Ошибка сервера. Попробуйте позже";
    return "Не удалось выполнить запрос";
  }

  function parseDate(value) {
    if (!value) return null;
    const raw = /Z$|[+-]\d{2}:?\d{2}$/.test(value) ? value : `${value}Z`;
    const date = new Date(raw);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  function formatDate(value, options = {}) {
    const date = parseDate(value);
    if (!date) return "—";
    const { withTime = true, short = false } = options;
    return new Intl.DateTimeFormat("ru-RU", {
      day: "numeric",
      month: short ? "short" : "long",
      year: "numeric",
      ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
    }).format(date);
  }

  function formatDay(value) {
    const date = parseDate(value);
    if (!date) return "—";
    return new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "short", year: "numeric" }).format(date);
  }

  const moneyFormatter = new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 });

  function money(value) {
    return `${moneyFormatter.format(Number(value) || 0)} ₽`;
  }

  function plural(number, one, few, many) {
    const n = Math.abs(number) % 100;
    const n1 = n % 10;
    if (n > 10 && n < 20) return many;
    if (n1 > 1 && n1 < 5) return few;
    if (n1 === 1) return one;
    return many;
  }

  function initials(name = "") {
    return name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join("");
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function statusBadge(status, extra = "") {
    const meta = STATUS[status] || { label: status, tone: "muted" };
    return `<span class="status status-${meta.tone} ${extra}"><span class="status-dot"></span>${meta.label}</span>`;
  }

  function deviceIcon(type = "") {
    const value = type.toLowerCase();
    if (value.includes("ноут")) return "laptop";
    if (value.includes("планш")) return "tablet";
    if (value.includes("стирал") || value.includes("бытов") || value.includes("микроволн") || value.includes("пылес")) return "washer";
    if (value.includes("науш") || value.includes("колонк") || value.includes("аудио")) return "headphones";
    if (value.includes("смарт") || value.includes("телефон")) return "smartphone";
    return "wrench";
  }

  function roleHome(role) {
    if (role === "admin") return "/admin";
    if (role === "master") return "/master";
    return "/client";
  }

  // ---------- Тосты ----------
  function toast(message, type = "success", timeout = 4200) {
    const root = document.getElementById("toasts");
    if (!root) return;
    const el = document.createElement("div");
    el.className = `toast toast-${type}`;
    const iconName = type === "error" ? "alert" : type === "info" ? "info" : "check-circle";
    el.innerHTML = `<span class="toast-icon">${window.icon(iconName, 20)}</span><span class="toast-text">${escapeHtml(message)}</span><button class="toast-close" aria-label="Закрыть">${window.icon("close", 16)}</button>`;
    root.appendChild(el);
    requestAnimationFrame(() => el.classList.add("is-visible"));
    const remove = () => {
      el.classList.remove("is-visible");
      setTimeout(() => el.remove(), 250);
    };
    el.querySelector(".toast-close").addEventListener("click", remove);
    if (timeout) setTimeout(remove, timeout);
  }

  // ---------- Модальные окна ----------
  function modal({ title, content, footer = "", wide = false, onOpen }) {
    const root = document.getElementById("modal-root");
    root.innerHTML = "";
    const overlay = document.createElement("div");
    overlay.className = "modal-overlay";
    overlay.innerHTML = `
      <div class="modal ${wide ? "modal-wide" : ""}" role="dialog" aria-modal="true" aria-label="${escapeHtml(title)}">
        <div class="modal-head">
          <h2>${escapeHtml(title)}</h2>
          <button class="icon-btn modal-close" aria-label="Закрыть">${window.icon("close", 20)}</button>
        </div>
        <div class="modal-body">${content}</div>
        ${footer ? `<div class="modal-foot">${footer}</div>` : ""}
      </div>`;
    root.appendChild(overlay);
    document.body.classList.add("modal-open");
    requestAnimationFrame(() => overlay.classList.add("is-visible"));

    const close = () => {
      overlay.classList.remove("is-visible");
      document.body.classList.remove("modal-open");
      setTimeout(() => {
        root.innerHTML = "";
      }, 200);
      document.removeEventListener("keydown", onKey);
    };
    const onKey = (event) => {
      if (event.key === "Escape") close();
    };
    overlay.addEventListener("click", (event) => {
      if (event.target === overlay) close();
    });
    overlay.querySelector(".modal-close").addEventListener("click", close);
    document.addEventListener("keydown", onKey);
    if (onOpen) onOpen(overlay.querySelector(".modal"), close);
    return { overlay, close, element: overlay.querySelector(".modal") };
  }

  function confirmDialog({ title, message, confirmText = "Подтвердить", danger = false }) {
    return new Promise((resolve) => {
      const instance = modal({
        title,
        content: `<p class="modal-text">${escapeHtml(message)}</p>`,
        footer: `<button class="btn btn-ghost" data-cancel>Отмена</button>
                 <button class="btn ${danger ? "btn-danger" : "btn-primary"}" data-confirm>${escapeHtml(confirmText)}</button>`,
      });
      instance.element.querySelector("[data-cancel]").addEventListener("click", () => {
        instance.close();
        resolve(false);
      });
      instance.element.querySelector("[data-confirm]").addEventListener("click", () => {
        instance.close();
        resolve(true);
      });
    });
  }

  function debounce(fn, delay = 350) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), delay);
    };
  }

  function skeletonCards(count = 3) {
    return `<div class="skeleton-grid">${Array.from({ length: count })
      .map(() => `<div class="skeleton skeleton-card"></div>`)
      .join("")}</div>`;
  }

  window.API = API;
  window.UI = {
    toast,
    modal,
    confirm: confirmDialog,
    debounce,
    statusBadge,
    deviceIcon,
    initials,
    escapeHtml,
    formatDate,
    formatDay,
    parseDate,
    money,
    plural,
    roleHome,
    skeletonCards,
    STATUS,
    TRANSITIONS,
    ROLE_LABELS,
  };
})();
