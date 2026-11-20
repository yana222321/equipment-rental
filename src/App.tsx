import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";

type IconName =
  | "overview"
  | "orders"
  | "box"
  | "tool"
  | "people"
  | "chart"
  | "plus"
  | "arrow"
  | "search"
  | "bell"
  | "close"
  | "phone"
  | "laptop"
  | "printer"
  | "check"
  | "clock"
  | "logout";
function Icon({ name, size = 22 }: { name: IconName; size?: number }) {
  const paths: Record<IconName, ReactNode> = {
    overview: (
      <>
        <path d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z" />
      </>
    ),
    orders: (
      <>
        <path d="M6 3h12v18H6zM9 7h6M9 11h6M9 15h4M3 6v12M21 6v12" />
      </>
    ),
    box: (
      <>
        <path d="m3 7 9-4 9 4v11l-9 4-9-4zM3 7l9 4 9-4M12 11v11M7 5l10 4" />
      </>
    ),
    tool: (
      <>
        <path d="m14 4 4-1-3 4 2 2 4-3-1 5-5 2-9 9-4-4 9-9z" />
      </>
    ),
    people: (
      <>
        <path d="M8 3h7v7H8zM3 21v-6l5-2h7l5 2v6M18 3h3v7h-3M21 14l2 2v5" />
      </>
    ),
    chart: (
      <>
        <path d="M3 3v18h19M7 17v-5h3v5M13 17V8h3v9M19 17V4h3v13" />
      </>
    ),
    plus: <path d="M12 4v16M4 12h16" />,
    arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
    search: (
      <>
        <path d="M4 3h10v2h2v10H4zM16 15l6 6" />
      </>
    ),
    bell: (
      <>
        <path d="M6 9V6h3V3h6v3h3v10h3v3H3v-3h3zM10 22h4" />
      </>
    ),
    close: <path d="m5 5 14 14M19 5 5 19" />,
    phone: (
      <>
        <path d="M6 2h12v20H6zM6 5h12M6 18h12M10 20h4" />
      </>
    ),
    laptop: (
      <>
        <path d="M4 3h16v13H4zM2 17h20v4H2zM8 7h8v5H8" />
      </>
    ),
    printer: (
      <>
        <path d="M7 3h10v5H7zM3 8h18v11h-4M7 19H3M7 14h10v8H7zM17 11h1" />
      </>
    ),
    check: <path d="m4 12 5 5L20 5" />,
    clock: (
      <>
        <path d="M7 2h10v2h4v16h-4v2H7v-2H3V4h4zM12 6v7h5" />
      </>
    ),
    logout: (
      <>
        <path d="M10 3H3v18h7M9 12h13M17 7l5 5-5 5" />
      </>
    ),
  };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.65"
      strokeLinecap="square"
      strokeLinejoin="miter"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}

const statuses = ["Принята", "В диагностике", "В ремонте", "Готова к выдаче", "Выдана"] as const;
type Status = (typeof statuses)[number];
type Order = {
  id: number;
  client: string;
  phone: string;
  device: string;
  type: string;
  issue: string;
  status: Status;
  master: string;
  date: string;
  cost: number;
  comments: string[];
  photo?: string;
};
const initialOrders: Order[] = [
  {
    id: 1048,
    client: "Анна Смирнова",
    phone: "+7 999 123-45-67",
    device: "iPhone 13",
    type: "Смартфон",
    issue: "Замена дисплея",
    status: "В ремонте",
    master: "Алексей Морозов",
    date: "18.06.2025",
    cost: 8500,
    comments: ["Диагностика завершена. Требуется замена дисплейного модуля."],
  },
  {
    id: 1047,
    client: "Дмитрий Волков",
    phone: "+7 916 222-33-44",
    device: "MacBook Air M1",
    type: "Ноутбук",
    issue: "Не включается",
    status: "В диагностике",
    master: "Иван Петров",
    date: "18.06.2025",
    cost: 1500,
    comments: [],
  },
  {
    id: 1046,
    client: "Мария Козлова",
    phone: "+7 925 555-66-77",
    device: "Samsung UE43",
    type: "Телевизор",
    issue: "Нет изображения",
    status: "Принята",
    master: "Не назначен",
    date: "18.06.2025",
    cost: 0,
    comments: [],
  },
  {
    id: 1045,
    client: "Сергей Иванов",
    phone: "+7 903 456-78-90",
    device: "PlayStation 5",
    type: "Другое",
    issue: "Чистка системы охлаждения",
    status: "Готова к выдаче",
    master: "Алексей Морозов",
    date: "17.06.2025",
    cost: 3500,
    comments: ["Чистка и замена термоинтерфейса выполнены. Консоль прошла проверку."],
  },
  {
    id: 1044,
    client: "Елена Соколова",
    phone: "+7 910 777-88-99",
    device: "HP LaserJet Pro",
    type: "Принтер",
    issue: "Не захватывает бумагу",
    status: "В ремонте",
    master: "Иван Петров",
    date: "17.06.2025",
    cost: 2800,
    comments: [],
  },
  {
    id: 1043,
    client: "Михаил Орлов",
    phone: "+7 915 444-55-66",
    device: "Xiaomi Redmi Note 12",
    type: "Смартфон",
    issue: "Замена аккумулятора",
    status: "Выдана",
    master: "Елена Белова",
    date: "16.06.2025",
    cost: 2200,
    comments: [],
  },
  {
    id: 1042,
    client: "Ольга Петрова",
    phone: "+7 903 111-22-33",
    device: "ASUS VivoBook 15",
    type: "Ноутбук",
    issue: "Замена клавиатуры",
    status: "В ремонте",
    master: "Елена Белова",
    date: "16.06.2025",
    cost: 4200,
    comments: [],
  },
];
const initialParts = [
  {
    id: 1,
    name: "Дисплей iPhone 13",
    sku: "DSP-IP13-01",
    category: "Дисплеи",
    count: 8,
    price: 5200,
  },
  {
    id: 2,
    name: "Аккумулятор Redmi Note 12",
    sku: "BAT-RN12-02",
    category: "Аккумуляторы",
    count: 3,
    price: 1100,
  },
  {
    id: 3,
    name: "Термопаста Arctic MX-4",
    sku: "THM-MX4-04",
    category: "Расходники",
    count: 18,
    price: 650,
  },
  {
    id: 4,
    name: "SSD Kingston 512 ГБ",
    sku: "SSD-K512-03",
    category: "Накопители",
    count: 2,
    price: 3800,
  },
  {
    id: 5,
    name: "Клавиатура ASUS VivoBook",
    sku: "KEY-AS15-05",
    category: "Комплектующие",
    count: 6,
    price: 2400,
  },
];
const services = [
  {
    name: "Диагностика устройства",
    category: "Любая техника",
    price: 500,
    time: "от 30 минут",
    icon: "search",
  },
  {
    name: "Замена дисплея",
    category: "Смартфоны и планшеты",
    price: 2500,
    time: "от 1 часа",
    icon: "phone",
  },
  {
    name: "Чистка и обслуживание",
    category: "Ноутбуки и компьютеры",
    price: 1800,
    time: "от 2 часов",
    icon: "laptop",
  },
  {
    name: "Ремонт материнской платы",
    category: "Ноутбуки и компьютеры",
    price: 3500,
    time: "от 2 дней",
    icon: "tool",
  },
  {
    name: "Замена аккумулятора",
    category: "Смартфоны и планшеты",
    price: 1200,
    time: "от 40 минут",
    icon: "phone",
  },
  {
    name: "Ремонт принтера",
    category: "Оргтехника",
    price: 1500,
    time: "от 1 дня",
    icon: "printer",
  },
] as const;
const masters = ["Алексей Морозов", "Иван Петров", "Елена Белова"];
const nav = [
  { name: "Обзор", icon: "overview" },
  { name: "Заявки", icon: "orders" },
  { name: "Склад запчастей", icon: "box" },
  { name: "Услуги и цены", icon: "tool" },
  { name: "Сотрудники", icon: "people" },
  { name: "Статистика", icon: "chart" },
] as const;
const money = (n: number) => new Intl.NumberFormat("ru-RU").format(n) + " ₽";
const statusClass = (status: Status) => `status status-${statuses.indexOf(status)}`;
function Window({
  title,
  children,
  className = "",
  extra,
}: {
  title: string;
  children: ReactNode;
  className?: string;
  extra?: ReactNode;
}) {
  return (
    <section className={`window ${className}`}>
      <div className="window-bar">
        <span className="window-square" />
        <span className="window-stripes" />
        <h2>{title}</h2>
        <span className="window-stripes" />
        {extra || <span className="window-square double" />}
      </div>
      {children}
    </section>
  );
}
function PixelComputer() {
  return (
    <svg
      className="pixel-computer"
      viewBox="0 0 180 164"
      shapeRendering="crispEdges"
      aria-hidden="true"
    >
      <path d="M28 8h112v8h8v116h-8v16H28v-16h-8V16h8z" fill="#22221e" />
      <path d="M29 17h110v109H29z" fill="#f6f4e9" />
      <path d="M39 27h90v72H39z" fill="#22221e" />
      <path d="M46 34h76v58H46z" fill="#dfff00" />
      <path d="M64 48h5v8h-5zM100 48h5v8h-5zM66 71h5v5h27v-5h5v10H66z" fill="#22221e" />
      <path d="M40 109h12v10H40zM93 111h34v5H93zM37 134h94v7H37z" fill="#22221e" />
      <path d="M22 147h126v8H22zM14 155h142v6H14z" fill="#22221e" />
      <path d="M30 148h108v6H30z" fill="#f6f4e9" />
      <path
        d="M147 127h15v7h8v17h-23v-7h-8v-8h8z"
        fill="#f6f4e9"
        stroke="#22221e"
        strokeWidth="3"
      />
      <path d="M156 129v9" stroke="#22221e" strokeWidth="3" />
    </svg>
  );
}

export default function App() {
  const [page, setPage] = useState("Обзор");
  const [orders, setOrders] = useState(initialOrders);
  const [parts, setParts] = useState(initialParts);
  const [filter, setFilter] = useState("Все заявки");
  const [search, setSearch] = useState("");
  const [period, setPeriod] = useState("Эта неделя");
  const [selected, setSelected] = useState<number | null>(null);
  const [newOrder, setNewOrder] = useState(false);
  const [photo, setPhoto] = useState<string>();
  const [toast, setToast] = useState("");
  const [notifications, setNotifications] = useState(false);
  const [help, setHelp] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [comment, setComment] = useState("");
  const [partId, setPartId] = useState("1");
  const [addPart, setAddPart] = useState(false);
  const [role, setRole] = useState("Администратор");
  const [profile, setProfile] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const active = orders.find((o) => o.id === selected);
  const notify = (text: string) => setToast(text);
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(""), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);
  const isModal = newOrder || !!active || help || addPart;
  useEffect(() => {
    if (!isModal) return;
    const before = document.activeElement as HTMLElement;
    document.body.style.overflow = "hidden";
    modalRef.current?.focus();
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setNewOrder(false);
        setSelected(null);
        setHelp(false);
        setAddPart(false);
      }
      if (e.key === "Tab") {
        const items = modalRef.current?.querySelectorAll<HTMLElement>(
          'button, input, select, textarea, [tabindex="0"]',
        );
        if (!items?.length) return;
        const first = items[0],
          last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handleKey);
      before?.focus();
    };
  }, [isModal]);
  const go = (name: string) => {
    setPage(name);
    setSearch("");
    setFilter("Все заявки");
    setMobileNav(false);
  };
  const updateOrder = (patch: Partial<Order>) =>
    setOrders((list) => list.map((o) => (o.id === selected ? { ...o, ...patch } : o)));
  const visible = orders.filter(
    (o) =>
      (filter === "Все заявки" ||
        (filter === "В работе"
          ? ["В диагностике", "В ремонте"].includes(o.status)
          : filter === "Готовые"
            ? o.status === "Готова к выдаче"
            : o.status === filter)) &&
      `${o.id} ${o.client} ${o.device}`.toLowerCase().includes(search.toLowerCase()) &&
      (role !== "Мастер" || o.master === masters[0]) &&
      (role !== "Клиент" || o.client === "Анна Смирнова"),
  );
  const openNew = () => {
    setPhoto(undefined);
    setNewOrder(true);
  };
  function submitOrder(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const order: Order = {
      id: Math.max(...orders.map((o) => o.id)) + 1,
      client: String(data.get("client")).trim(),
      phone: String(data.get("phone")),
      device: String(data.get("device")).trim(),
      type: String(data.get("type")),
      issue: String(data.get("issue")).trim(),
      status: "Принята",
      master: String(data.get("master") || "Не назначен"),
      date: new Date().toLocaleDateString("ru-RU"),
      cost: 0,
      comments: [],
      photo,
    };
    if (!order.client || !order.device || !order.issue) return;
    setOrders([order, ...orders]);
    setNewOrder(false);
    notify(`Заявка №${order.id} создана`);
    go("Заявки");
  }
  const counts = [
    orders.length + 41,
    orders.filter((o) => ["В ремонте", "В диагностике"].includes(o.status)).length + 8,
    orders.filter((o) => o.status === "Готова к выдаче").length + 5,
    orders.reduce((sum, o) => sum + o.cost, 0) + 124000,
  ];
  function OrdersTable() {
    return (
      <div className="table-scroll">
        <table className="orders-table">
          <thead>
            <tr>
              <th>№ заявки</th>
              <th>Устройство / клиент</th>
              <th>Статус</th>
              <th>Мастер</th>
              <th>
                Дата <span>↓</span>
              </th>
              <th aria-label="Открыть" />
            </tr>
          </thead>
          <tbody>
            {(page === "Обзор" ? visible.slice(0, 5) : visible).map((o) => (
              <tr
                key={o.id}
                onClick={() => {
                  setSelected(o.id);
                  setComment("");
                }}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter") setSelected(o.id);
                }}
                aria-label={`Открыть заявку ${o.id}`}
              >
                <td className="order-id">#{o.id}</td>
                <td>
                  <div className="device-cell">
                    <span className="device-icon">
                      <Icon
                        name={
                          o.type === "Смартфон"
                            ? "phone"
                            : o.type === "Принтер"
                              ? "printer"
                              : "laptop"
                        }
                        size={25}
                      />
                    </span>
                    <span>
                      <strong>{o.device}</strong>
                      <small>{o.client}</small>
                    </span>
                  </div>
                </td>
                <td>
                  <span className={statusClass(o.status)}>
                    <i />
                    {o.status}
                  </span>
                </td>
                <td className="master-cell">
                  {o.master === "Не назначен" ? (
                    <span className="muted">Не назначен</span>
                  ) : (
                    o.master.split(" ")[0] + " " + o.master.split(" ")[1][0] + "."
                  )}
                </td>
                <td className="date-cell">{o.date.slice(0, 5)}</td>
                <td>
                  <Icon name="arrow" size={17} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!visible.length && (
          <div className="empty-state">
            <Icon name="search" size={34} />
            <h3>Заявки не найдены</h3>
            <p>Попробуйте изменить поиск или фильтр.</p>
            <button
              className="button"
              onClick={() => {
                setSearch("");
                setFilter("Все заявки");
              }}
            >
              Сбросить фильтры
            </button>
          </div>
        )}
      </div>
    );
  }
  function Stats({ full = false }: { full?: boolean }) {
    const factor = period === "Этот месяц" ? 4 : period === "Сегодня" ? 0.2 : 1;
    return (
      <div className={`stats-grid ${full ? "full-stats" : ""}`}>
        {[
          {
            label: "Всего заявок",
            value: Math.round(counts[0] * factor),
            icon: "orders",
            note: "+12 к прошлой неделе",
            change: true,
          },
          {
            label: "В работе",
            value: Math.round(counts[1] * factor),
            icon: "tool",
            note: "Техника в надёжных руках",
          },
          {
            label: "Готовы к выдаче",
            value: Math.max(1, Math.round(counts[2] * factor)),
            icon: "check",
            note: "Ждут своих владельцев",
          },
          {
            label: "Выручка",
            value: money(Math.round(counts[3] * factor)),
            icon: "chart",
            note: "+18% к прошлой неделе",
            change: true,
          },
        ].map((s, i) => (
          <button
            className={`stat-card stat-${i}`}
            key={s.label}
            onClick={() => {
              go(i === 3 ? "Статистика" : "Заявки");
              if (i === 1) setFilter("В работе");
              if (i === 2) setFilter("Готовые");
            }}
          >
            <div className="stat-top">
              <span>{s.label}</span>
              <Icon name={s.icon as IconName} size={21} />
            </div>
            <div className="stat-value">
              {s.value}
              <span>↗</span>
            </div>
            <small className={s.change ? "positive" : ""}>
              {s.change && "↗ "}
              {s.note}
            </small>
          </button>
        ))}
      </div>
    );
  }
  return (
    <div className="app">
      <header className="system-bar">
        <div className="system-left">
          <span className="system-symbol">⌘</span>
          <strong>РАПИРА</strong>
          <span className="system-divider" />
          <span className="system-subtitle">Система управления мастерской</span>
        </div>
        <div className="system-right">
          <span className="live-dot" />
          <span>Мастерская открыта</span>
          <span className="system-divider" />
          <span>СР, 18 ИЮНЯ</span>
          <span className="system-time">09:41</span>
        </div>
      </header>
      <aside className={`sidebar ${mobileNav ? "mobile-open" : ""}`}>
        <a
          className="brand"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            go("Обзор");
          }}
        >
          <span className="brand-icon">
            <Icon name="tool" size={29} />
          </span>
          <span>
            РАПИРА<span className="brand-dot">®</span>
            <small>РЕМОНТ БЕЗ ЛИШНИХ СЛОВ</small>
          </span>
        </a>
        <div className="workspace-tag">
          <span className="live-square" />
          Мастерская на Ленина<small>РАБОЧЕЕ ПРОСТРАНСТВО № 01</small>
        </div>
        <div className="nav-label">РАБОЧИЙ СТОЛ</div>
        <nav>
          {nav
            .filter(
              (n) =>
                role === "Администратор" ||
                (role === "Мастер"
                  ? ["Обзор", "Заявки", "Склад запчастей", "Услуги и цены"].includes(n.name)
                  : ["Обзор", "Заявки", "Услуги и цены"].includes(n.name)),
            )
            .map((n) => (
              <button
                key={n.name}
                className={`nav-item ${page === n.name ? "active" : ""}`}
                onClick={() => go(n.name)}
              >
                <Icon name={n.icon} size={21} />
                <span>{n.name}</span>
                {n.name === "Заявки" && <b>{orders.length + 17}</b>}
                {n.name === "Склад запчастей" && <span className="nav-warning">!</span>}
              </button>
            ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="help-card">
            <span className="help-star">✳</span>
            <strong>Всё можно починить.</strong>
            <p>
              А если что-то непонятно —<br />
              мы рядом.
            </p>
            <button onClick={() => setHelp(true)}>
              Справочник <Icon name="arrow" size={15} />
            </button>
          </div>
          <div className="profile-wrap">
            <button className="profile" onClick={() => setProfile(!profile)}>
              <span className="avatar">АК</span>
              <span>
                <strong>Александр К.</strong>
                <small>{role}</small>
              </span>
              <span className="profile-dots">⌃</span>
            </button>
            {profile && (
              <div className="profile-menu">
                <strong>Демо: переключить роль</strong>
                {["Администратор", "Мастер", "Клиент"].map((r) => (
                  <button
                    key={r}
                    onClick={() => {
                      setRole(r);
                      setProfile(false);
                      go("Обзор");
                      notify(`Режим: ${r}. Это демонстрация интерфейса, не авторизация.`);
                    }}
                  >
                    {r}
                    {r === role && <Icon name="check" size={15} />}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="version">
            РАПИРА OS <span>v.1.0</span>
          </div>
        </div>
      </aside>
      <div className="main-shell">
        <div className="topbar">
          <div className="breadcrumb">
            <button
              className="mobile-toggle"
              onClick={() => setMobileNav(!mobileNav)}
              aria-label="Меню"
            >
              <Icon name="overview" size={18} />
            </button>
            <span>Рабочий стол</span>
            <span>/</span>
            <strong>{page}</strong>
          </div>
          <div className="top-actions">
            <span className="demo-tag">ДЕМО-РЕЖИМ</span>
            <button
              className="notification-button"
              aria-label="Уведомления"
              onClick={() => setNotifications(!notifications)}
            >
              <Icon name="bell" size={20} />
              <i />
            </button>
            {notifications && (
              <div className="notifications">
                <strong>
                  Центр уведомлений <span>02</span>
                </strong>
                <button
                  onClick={() => {
                    go("Заявки");
                    setSelected(1046);
                    setNotifications(false);
                  }}
                >
                  <b>Новая заявка #1046</b>
                  <span>Samsung UE43 ожидает назначения мастера.</span>
                  <small>10 минут назад</small>
                </button>
                <button
                  onClick={() => {
                    go("Склад запчастей");
                    setNotifications(false);
                  }}
                >
                  <b>Пора пополнить склад</b>
                  <span>2 позиции заканчиваются.</span>
                  <small>35 минут назад</small>
                </button>
              </div>
            )}
          </div>
        </div>
        <main>
          <div className="page-heading">
            <div>
              <div className="eyebrow">
                {role === "Администратор"
                  ? "ПУЛЬТ УПРАВЛЕНИЯ"
                  : role === "Мастер"
                    ? "РАБОЧЕЕ МЕСТО МАСТЕРА"
                    : "ЛИЧНЫЙ КАБИНЕТ"}
              </div>
              <h1>
                {page === "Обзор"
                  ? "Обзор мастерской"
                  : page === "Заявки" && role === "Клиент"
                    ? "Мои заявки"
                    : page}
              </h1>
            </div>
            <button className="button button-dark new-order" onClick={openNew}>
              <Icon name="plus" size={18} />
              Новая заявка
            </button>
          </div>
          {page === "Обзор" && (
            <>
              <section className="welcome-banner">
                <div className="welcome-copy">
                  <span className="banner-kicker">[ СЕРВИСНЫЙ ЦЕНТР НОВОГО ПОКОЛЕНИЯ ]</span>
                  <div className="hero-wordmark">
                    РАПИРА<span>®</span>
                  </div>
                  <div className="hero-tags">
                    <span>[ техника ]</span>
                    <span>[ забота ]</span>
                    <span>[ вторая жизнь ]</span>
                  </div>
                  <h2>
                    НЕ ВЫБРАСЫВАЙ.
                    <br />
                    <span>ПОЧИНИ.</span>
                  </h2>
                  <p>
                    Техника заслуживает второй шанс.
                    <br />А ваша мастерская — порядок в делах.
                  </p>
                  <button onClick={() => go("Заявки")}>
                    За работу <Icon name="arrow" size={19} />
                  </button>
                </div>
                <div className="computer-scene">
                  <div className="retro-dialog">
                    <div className="retro-dialog-bar">
                      <span>всё_поправимо.exe</span>
                      <span aria-hidden="true">− □ ×</span>
                    </div>
                    <div className="retro-dialog-body">
                      <PixelComputer />
                      <div className="retro-message">
                        SYSTEM IS HAPPY :)
                        <span>
                          Всё под контролем.
                          <br />
                          Можно начинать.
                        </span>
                      </div>
                    </div>
                    <button className="retro-start" onClick={openNew}>
                      НОВЫЙ РЕМОНТ <Icon name="arrow" size={21} />
                    </button>
                  </div>
                  <svg
                    className="pixel-heart"
                    viewBox="0 0 16 15"
                    shapeRendering="crispEdges"
                    aria-hidden="true"
                  >
                    <path
                      d="M2 1h4v1h1v1h2V2h1V1h4v1h1v2h1v5h-2v2h-2v2h-2v2H6v-2H4v-2H2V9H0V4h1V2h1z"
                      fill="currentColor"
                    />
                    <path d="M11 3h2v1h1v3h-2V5h-1z" fill="white" />
                  </svg>
                  <div className="repair-sticker">
                    100%
                    <span>
                      РЕМОНТНЫЙ
                      <br />
                      НАСТРОЙ
                    </span>
                  </div>
                  <div className="scene-caption">DON'T REPLACE. REPAIR. ↗</div>
                </div>
              </section>
              <div className="section-line">
                <h2>
                  Мастерская в цифрах <span>/ 01</span>
                </h2>
                <select
                  aria-label="Период статистики"
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                >
                  <option>Эта неделя</option>
                  <option>Этот месяц</option>
                  <option>Сегодня</option>
                </select>
              </div>
              <Stats />
              <div className="dashboard-grid">
                <Window title="Последние заявки" className="orders-window">
                  <div className="window-toolbar">
                    <div className="mini-tabs">
                      {["Все заявки", "В работе", "Готовые"].map((t) => (
                        <button
                          className={filter === t ? "selected" : ""}
                          key={t}
                          onClick={() => setFilter(t)}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                    <button className="text-link" onClick={() => go("Заявки")}>
                      Все заявки <Icon name="arrow" size={16} />
                    </button>
                  </div>
                  <OrdersTable />
                  <div className="window-footer">
                    <span>
                      <i className="live-square" />
                      Всё актуально. Можно работать.
                    </span>
                    <span>
                      Показано {Math.min(visible.length, 5)} из {orders.length}
                    </span>
                  </div>
                </Window>
                <div className="right-widgets">
                  <Window title="Загрузка мастеров">
                    <div className="workload-body">
                      <div className="widget-caption">
                        В хороших руках <span>3 МАСТЕРА</span>
                      </div>
                      {masters.map((m, i) => (
                        <button
                          className="master-workload"
                          key={m}
                          onClick={() => {
                            go("Сотрудники");
                          }}
                        >
                          <span className={`mini-avatar avatar-${i}`}>
                            {m
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </span>
                          <span className="workload-info">
                            <span>
                              {m.split(" ")[0]} {m.split(" ")[1][0]}.<b>{[5, 4, 3][i]} заявок</b>
                            </span>
                            <span className="progress">
                              <i style={{ width: `${[76, 60, 44][i]}%` }} />
                            </span>
                          </span>
                        </button>
                      ))}
                    </div>
                  </Window>
                  <div className="stock-note">
                    <div>
                      <Icon name="box" size={25} />
                      <span>Склад подаёт сигнал</span>
                      <b>!</b>
                    </div>
                    <p>
                      2 позиции заканчиваются.
                      <br />
                      Самое время пополнить запасы.
                    </p>
                    <button onClick={() => go("Склад запчастей")}>
                      Заглянуть на склад <Icon name="arrow" size={17} />
                    </button>
                  </div>
                </div>
              </div>
              <div className="bottom-strip">
                <span>✳</span>
                <p>Хороший ремонт начинается с порядка.</p>
                <span>А ПОРЯДОК — С РАПИРОЙ.</span>
                <span className="strip-pixels">▗ ▚ ▘</span>
              </div>
            </>
          )}
          {page === "Заявки" && (
            <>
              <p className="page-description">
                От первого «не работает» до последнего «спасибо». Весь путь устройства здесь.
              </p>
              <Window title={role === "Клиент" ? "История обращений" : "Реестр заявок"}>
                <div className="list-controls">
                  <div className="search-input">
                    <Icon name="search" size={18} />
                    <input
                      aria-label="Поиск заявок"
                      placeholder="Номер, устройство или клиент"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                  <select
                    aria-label="Фильтр по статусу"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                  >
                    <option>Все заявки</option>
                    {statuses.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                  <span className="result-count">{visible.length} заявок</span>
                </div>
                <OrdersTable />
              </Window>
              <p className="data-note">
                Демонстрационные данные. Новые заявки и изменения доступны в текущем сеансе.
              </p>
            </>
          )}
          {page === "Склад запчастей" && (
            <>
              <p className="page-description">
                Нужная деталь в нужный момент. Остатки, стоимость и ничего лишнего.
              </p>
              <div className="inventory-summary">
                <div>
                  <Icon name="box" />
                  <span>
                    <strong>{parts.reduce((s, p) => s + p.count, 0)}</strong> деталей на складе
                  </span>
                </div>
                <div>
                  <strong>{money(parts.reduce((s, p) => s + p.count * p.price, 0))}</strong>
                  <span>стоимость запасов</span>
                </div>
                <button className="button button-yellow" onClick={() => setAddPart(true)}>
                  <Icon name="plus" size={18} />
                  Добавить запчасть
                </button>
              </div>
              <Window title="Складской учёт">
                <div className="list-controls">
                  <div className="search-input">
                    <Icon name="search" size={18} />
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Название или артикул"
                      aria-label="Поиск запчастей"
                    />
                  </div>
                  <span className="result-count">МАЛО: МЕНЕЕ 4 ШТ.</span>
                </div>
                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th>Запчасть / артикул</th>
                        <th>Категория</th>
                        <th>Остаток</th>
                        <th>Цена</th>
                        <th>Приход</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parts
                        .filter((p) =>
                          `${p.name} ${p.sku}`.toLowerCase().includes(search.toLowerCase()),
                        )
                        .map((p) => (
                          <tr key={p.id}>
                            <td>
                              <strong>{p.name}</strong>
                              <small>{p.sku}</small>
                            </td>
                            <td>{p.category}</td>
                            <td>
                              <span className={p.count < 4 ? "low-stock" : ""}>
                                {p.count} шт.{p.count < 4 ? " · Мало" : ""}
                              </span>
                            </td>
                            <td>{money(p.price)}</td>
                            <td>
                              <button
                                className="square-button"
                                aria-label={`Пополнить ${p.name}`}
                                onClick={() => {
                                  setParts(
                                    parts.map((part) =>
                                      part.id === p.id ? { ...part, count: part.count + 1 } : part,
                                    ),
                                  );
                                  notify("Приход: +1 шт. " + p.name);
                                }}
                              >
                                <Icon name="plus" size={17} />
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </Window>
            </>
          )}
          {page === "Услуги и цены" && (
            <>
              <p className="page-description">
                Возвращаем технику к жизни. Прозрачные цены, бережный подход.
              </p>
              <div className="services-grid">
                {services.map((s, i) => (
                  <div className="service-card" key={s.name}>
                    <div className="service-top">
                      <Icon name={s.icon} size={36} />
                      <span>0{i + 1}</span>
                    </div>
                    <div className="eyebrow">{s.category}</div>
                    <h2>{s.name}</h2>
                    <p>
                      <Icon name="clock" size={15} />
                      {s.time}
                    </p>
                    <div className="service-bottom">
                      <strong>от {money(s.price)}</strong>
                      <button
                        className="square-button"
                        onClick={openNew}
                        aria-label={`Заявка: ${s.name}`}
                      >
                        <Icon name="arrow" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <p className="data-note">
                Окончательная стоимость определяется после диагностики и согласуется с клиентом.
              </p>
            </>
          )}
          {page === "Сотрудники" && (
            <>
              <p className="page-description">
                Люди, которые знают, какой провод куда. Команда мастерской.
              </p>
              <div className="team-grid">
                {masters.map((m, i) => (
                  <Window title={`Мастер / 0${i + 1}`} key={m}>
                    <div className="team-card">
                      <span className={`team-avatar avatar-${i}`}>
                        <Icon name={i === 1 ? "laptop" : "tool"} size={48} />
                      </span>
                      <span className="online-label">
                        <i />В мастерской
                      </span>
                      <h2>{m}</h2>
                      <p>
                        {
                          [
                            "Смартфоны и игровые консоли",
                            "Компьютеры и оргтехника",
                            "Ноутбуки и электроника",
                          ][i]
                        }
                      </p>
                      <div className="team-stats">
                        <div>
                          <strong>
                            {orders.filter((o) => o.master === m && o.status !== "Выдана").length}
                          </strong>
                          <small>в работе</small>
                        </div>
                        <div>
                          <strong>{[124, 98, 112][i]}</strong>
                          <small>ремонтов</small>
                        </div>
                      </div>
                      <button
                        className="button"
                        onClick={() => {
                          go("Заявки");
                          setSearch(
                            m === masters[0] ? "iPhone" : m === masters[1] ? "MacBook" : "ASUS",
                          );
                        }}
                      >
                        Открыть заявку мастера <Icon name="arrow" size={17} />
                      </button>
                    </div>
                  </Window>
                ))}
              </div>
            </>
          )}
          {page === "Статистика" && (
            <>
              <div className="section-line">
                <p className="page-description">Посмотрим, как идут дела. Только важные цифры.</p>
                <select
                  aria-label="Период аналитики"
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                >
                  <option>Эта неделя</option>
                  <option>Этот месяц</option>
                  <option>Сегодня</option>
                </select>
              </div>
              <Stats full />
              <div className="analytics-grid">
                <Window title="Динамика заявок">
                  <div className="chart-content">
                    <span className="eyebrow">КОЛИЧЕСТВО ЗАЯВОК / {period.toUpperCase()}</span>
                    <div className="bar-chart">
                      {[7, 10, 6, 13, 8, 4, 0].map((n, i) => (
                        <div key={i}>
                          <strong>
                            {Math.round(
                              n * (period === "Этот месяц" ? 4 : period === "Сегодня" ? 0.3 : 1),
                            )}
                          </strong>
                          <span style={{ height: `${Math.max(3, n * 12)}px` }} />
                          <small>{["ПН", "ВТ", "СР", "ЧТ", "ПТ", "СБ", "ВС"][i]}</small>
                        </div>
                      ))}
                    </div>
                  </div>
                </Window>
                <Window title="Что чиним чаще">
                  <div className="category-chart">
                    {[
                      ["Смартфоны", 46],
                      ["Ноутбуки", 31],
                      ["Оргтехника", 15],
                      ["Другое", 8],
                    ].map(([label, value]) => (
                      <div key={label}>
                        <div>
                          <span>{label}</span>
                          <strong>{value}%</strong>
                        </div>
                        <span className="category-track">
                          <i style={{ width: `${value}%` }} />
                        </span>
                      </div>
                    ))}
                  </div>
                </Window>
              </div>
              <p className="data-note">
                Аналитика демонстрирует пример отчёта. Для реальных показателей необходимо
                подключить backend.
              </p>
            </>
          )}
          <footer className="page-footer">
            <span>© 2025 Рапира. Сделано, чтобы работало.</span>
            <span>
              <span className="footer-indicator" />
              Работаем бережно <span className="footer-command">⌘</span>
            </span>
          </footer>
        </main>
      </div>
      {isModal && (
        <div
          className="modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setNewOrder(false);
              setSelected(null);
              setHelp(false);
              setAddPart(false);
            }
          }}
        >
          <div
            className={`modal ${active ? "detail-modal" : ""}`}
            role="dialog"
            aria-modal="true"
            aria-label={
              newOrder
                ? "Новая заявка"
                : active
                  ? `Заявка ${active.id}`
                  : help
                    ? "Справочник"
                    : "Новая запчасть"
            }
            ref={modalRef}
            tabIndex={-1}
          >
            <Window
              title={
                newOrder
                  ? "Новая заявка / приём техники"
                  : active
                    ? `Заявка #${active.id} / ${active.device}`
                    : help
                      ? "Рапира / справочник"
                      : "Приход / новая запчасть"
              }
              extra={
                <button
                  className="close-button"
                  aria-label="Закрыть"
                  onClick={() => {
                    setNewOrder(false);
                    setSelected(null);
                    setHelp(false);
                    setAddPart(false);
                  }}
                >
                  <Icon name="close" size={18} />
                </button>
              }
            >
              {newOrder && (
                <form className="order-form" onSubmit={submitOrder}>
                  <h2>Давайте починим.</h2>
                  <p>Расскажите об устройстве — мы возьмём остальное на себя.</p>
                  <div className="form-row">
                    <label>
                      Имя клиента
                      <input
                        name="client"
                        required
                        maxLength={80}
                        placeholder="Имя и фамилия"
                        defaultValue={role === "Клиент" ? "Анна Смирнова" : ""}
                      />
                    </label>
                    <label>
                      Телефон
                      <input
                        name="phone"
                        type="tel"
                        required
                        pattern="[+0-9 \(\)\-]{10,20}"
                        title="От 10 до 20 символов: цифры, +, пробелы, скобки и дефисы"
                        placeholder="+7 (___) ___-__-__"
                      />
                    </label>
                  </div>
                  <div className="form-row">
                    <label>
                      Тип устройства
                      <select name="type">
                        {["Смартфон", "Ноутбук", "Планшет", "Телевизор", "Принтер", "Другое"].map(
                          (t) => (
                            <option key={t}>{t}</option>
                          ),
                        )}
                      </select>
                    </label>
                    <label>
                      Модель
                      <input
                        name="device"
                        required
                        maxLength={100}
                        placeholder="Например, iPhone 13"
                      />
                    </label>
                  </div>
                  <label>
                    Что случилось?
                    <textarea
                      name="issue"
                      required
                      minLength={5}
                      maxLength={2000}
                      placeholder="Опишите неисправность, когда она появилась..."
                      rows={3}
                    />
                  </label>
                  <div className="form-row">
                    <label>
                      Фото устройства
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          if (file.size > 5 * 1024 * 1024) {
                            notify("Размер фото не должен превышать 5 МБ");
                            e.target.value = "";
                            return;
                          }
                          const reader = new FileReader();
                          reader.onload = () => setPhoto(String(reader.result));
                          reader.readAsDataURL(file);
                        }}
                      />
                      <small>JPG, PNG, WebP — до 5 МБ</small>
                      {photo && <img className="photo-preview" src={photo} alt="Фото устройства" />}
                    </label>
                    {role !== "Клиент" && (
                      <label>
                        Назначить мастера
                        <select name="master">
                          <option>Не назначен</option>
                          {masters.map((m) => (
                            <option key={m}>{m}</option>
                          ))}
                        </select>
                      </label>
                    )}
                  </div>
                  <div className="form-bottom">
                    <span>Данные останутся в текущем сеансе</span>
                    <button className="button button-dark" type="submit">
                      Создать заявку <Icon name="arrow" size={18} />
                    </button>
                  </div>
                </form>
              )}
              {active && (
                <div className="detail-content">
                  <div className="detail-heading">
                    <div>
                      <span className="eyebrow">ПРИНЯТА {active.date}</span>
                      <h2>{active.device}</h2>
                    </div>
                    <span className={statusClass(active.status)}>
                      <i />
                      {active.status}
                    </span>
                  </div>
                  <div className="detail-client">
                    <span>
                      <small>КЛИЕНТ</small>
                      <strong>{active.client}</strong>
                    </span>
                    <span>
                      <small>ТЕЛЕФОН</small>
                      <strong>{active.phone}</strong>
                    </span>
                  </div>
                  <div className="issue-box">
                    <span className="eyebrow">НЕИСПРАВНОСТЬ</span>
                    <p>{active.issue}</p>
                    {active.photo && (
                      <img
                        className="photo-preview"
                        src={active.photo}
                        alt="Прикреплённое фото устройства"
                      />
                    )}
                  </div>
                  <div className="status-timeline">
                    {statuses.map((s, i) => (
                      <div key={s} className={statuses.indexOf(active.status) >= i ? "done" : ""}>
                        <span>
                          {statuses.indexOf(active.status) > i ? (
                            <Icon name="check" size={12} />
                          ) : (
                            i + 1
                          )}
                        </span>
                        <small>{s}</small>
                      </div>
                    ))}
                  </div>
                  {role !== "Клиент" && (
                    <div className="detail-edit">
                      <div className="form-row">
                        <label>
                          Статус ремонта
                          <select
                            value={active.status}
                            onChange={(e) => {
                              updateOrder({ status: e.target.value as Status });
                              notify("Статус заявки обновлён");
                            }}
                          >
                            {statuses.map((s) => (
                              <option key={s}>{s}</option>
                            ))}
                          </select>
                        </label>
                        <label>
                          Ответственный мастер
                          <select
                            value={active.master}
                            disabled={role === "Мастер"}
                            onChange={(e) => updateOrder({ master: e.target.value })}
                          >
                            <option>Не назначен</option>
                            {masters.map((m) => (
                              <option key={m}>{m}</option>
                            ))}
                          </select>
                        </label>
                      </div>
                      <div className="form-row">
                        <label>
                          Стоимость работ и запчастей, ₽
                          <input
                            type="number"
                            min={0}
                            max={1000000}
                            value={active.cost}
                            onChange={(e) =>
                              updateOrder({
                                cost: Math.min(1000000, Math.max(0, Number(e.target.value))),
                              })
                            }
                          />
                        </label>
                        <label>
                          Использовать запчасть
                          <div className="part-use">
                            <select value={partId} onChange={(e) => setPartId(e.target.value)}>
                              {parts.map((p) => (
                                <option key={p.id} value={p.id} disabled={!p.count}>
                                  {p.name} ({p.count})
                                </option>
                              ))}
                            </select>
                            <button
                              className="square-button"
                              aria-label="Списать одну запчасть"
                              onClick={() => {
                                const p = parts.find((p) => String(p.id) === partId);
                                if (!p || p.count < 1) {
                                  notify("Запчасти нет на складе");
                                  return;
                                }
                                setParts(
                                  parts.map((item) =>
                                    item.id === p.id ? { ...item, count: item.count - 1 } : item,
                                  ),
                                );
                                updateOrder({
                                  cost: active.cost + p.price,
                                  comments: [
                                    ...active.comments,
                                    `Использована запчасть: ${p.name} — 1 шт. (${money(p.price)})`,
                                  ],
                                });
                                notify("Запчасть списана, стоимость добавлена в заявку");
                              }}
                            >
                              <Icon name="plus" size={17} />
                            </button>
                          </div>
                        </label>
                      </div>
                    </div>
                  )}
                  <div className="comments">
                    <h3>
                      Журнал ремонта <span>{active.comments.length}</span>
                    </h3>
                    {active.comments.length ? (
                      active.comments.map((c, i) => (
                        <div className="comment" key={i}>
                          <span className="comment-dot" />
                          <p>{c}</p>
                        </div>
                      ))
                    ) : (
                      <p className="muted">
                        Здесь появятся результаты диагностики и заметки мастера.
                      </p>
                    )}
                    {role !== "Клиент" && (
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          if (comment.trim()) {
                            updateOrder({ comments: [...active.comments, comment.trim()] });
                            setComment("");
                          }
                        }}
                        className="comment-form"
                      >
                        <input
                          aria-label="Комментарий"
                          placeholder="Добавить комментарий..."
                          required
                          maxLength={1000}
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                        />
                        <button className="button button-dark" aria-label="Отправить комментарий">
                          <Icon name="arrow" size={18} />
                        </button>
                      </form>
                    )}
                  </div>
                  <div className="detail-total">
                    <span>Итого по заявке</span>
                    <strong>{money(active.cost)}</strong>
                  </div>
                </div>
              )}
              {help && (
                <div className="help-content">
                  <Icon name="tool" size={40} />
                  <h2>Добро пожаловать в Рапиру.</h2>
                  <p>Это интерактивный прототип системы управления ремонтной мастерской.</p>
                  <h3>01 / Примите устройство</h3>
                  <p>
                    Нажмите «Новая заявка», укажите клиента, модель и неисправность. Прикрепите фото
                    и назначьте мастера.
                  </p>
                  <h3>02 / Ведите ремонт</h3>
                  <p>
                    Откройте заявку: меняйте статус, добавляйте комментарии и стоимость.
                    Использованная запчасть автоматически списывается со склада.
                  </p>
                  <h3>03 / Проверьте остатки</h3>
                  <p>
                    Во вкладке «Склад запчастей» можно пополнить остатки и добавить новую позицию.
                  </p>
                  <div className="help-disclaimer">
                    Демо-режим: данные не сохраняются после перезагрузки. Переключение ролей в
                    профиле показывает варианты интерфейса, но не является защищённой авторизацией.
                    Backend ещё не подключён.
                  </div>
                </div>
              )}
              {addPart && (
                <form
                  className="order-form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const d = new FormData(e.currentTarget);
                    const sku = String(d.get("sku")).trim();
                    if (parts.some((p) => p.sku.toLowerCase() === sku.toLowerCase())) {
                      notify("Запчасть с таким артикулом уже существует");
                      return;
                    }
                    setParts([
                      ...parts,
                      {
                        id: Math.max(...parts.map((p) => p.id)) + 1,
                        name: String(d.get("name")).trim(),
                        sku,
                        category: String(d.get("category")),
                        count: Number(d.get("count")),
                        price: Number(d.get("price")),
                      },
                    ]);
                    setAddPart(false);
                    notify("Запчасть добавлена на склад");
                  }}
                >
                  <h2>Хороший запас.</h2>
                  <label>
                    Название
                    <input name="name" required maxLength={100} />
                  </label>
                  <div className="form-row">
                    <label>
                      Артикул
                      <input name="sku" required maxLength={40} />
                    </label>
                    <label>
                      Категория
                      <select name="category">
                        {[
                          "Дисплеи",
                          "Аккумуляторы",
                          "Расходники",
                          "Накопители",
                          "Комплектующие",
                        ].map((c) => (
                          <option key={c}>{c}</option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <div className="form-row">
                    <label>
                      Количество, шт.
                      <input
                        name="count"
                        type="number"
                        min={0}
                        max={100000}
                        required
                        defaultValue={1}
                      />
                    </label>
                    <label>
                      Цена, ₽<input name="price" type="number" min={0} max={1000000} required />
                    </label>
                  </div>
                  <button className="button button-dark" type="submit">
                    Добавить на склад <Icon name="plus" size={18} />
                  </button>
                </form>
              )}
            </Window>
          </div>
        </div>
      )}
      {toast && (
        <div className="toast" role="status">
          <Icon name="check" size={20} />
          <span>{toast}</span>
          <button onClick={() => setToast("")} aria-label="Закрыть уведомление">
            <Icon name="close" size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
