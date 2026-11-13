/* Лёгкие графики на CSS и SVG — без сторонних библиотек. */
(function () {
  const TONES = {
    info: "#3b82f6",
    warn: "#f59e0b",
    ok: "#16a34a",
    danger: "#ef4444",
    muted: "#94a3b8",
    brand: "#ff6a2b",
  };

  function barChart(el, data, { value = (d) => d.value, label = (d) => d.label, format = String, title = "" } = {}) {
    if (!el) return;
    const max = Math.max(...data.map((d) => Number(value(d)) || 0), 1);
    el.innerHTML = `
      <div class="bars-chart" ${title ? `aria-label="${title}"` : ""}>
        ${data
          .map((d, i) => {
            const v = Number(value(d)) || 0;
            return `<div class="bar-col" title="${label(d)}: ${format(v)}">
              <div class="bar-amount">${format(v)}</div>
              <div class="bar-track"><div class="bar-fill" style="height:${Math.max(3, (v / max) * 100)}%;animation-delay:${i * 70}ms"></div></div>
              <div class="bar-label">${label(d)}</div>
            </div>`;
          })
          .join("")}
      </div>`;
  }

  function areaChart(el, data, { value = (d) => d.value, label = (d) => d.label, format = String } = {}) {
    if (!el) return;
    const width = 640;
    const height = 240;
    const pad = { top: 24, right: 16, bottom: 34, left: 16 };
    const innerW = width - pad.left - pad.right;
    const innerH = height - pad.top - pad.bottom;
    const values = data.map((d) => Number(value(d)) || 0);
    const max = Math.max(...values, 1) * 1.18;
    const step = data.length > 1 ? innerW / (data.length - 1) : innerW;

    const points = data.map((d, i) => {
      const x = pad.left + (data.length > 1 ? step * i : innerW / 2);
      const y = pad.top + innerH - ((Number(value(d)) || 0) / max) * innerH;
      return { x, y, d };
    });

    const line = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
    const area = `${line} L${points[points.length - 1].x.toFixed(1)},${pad.top + innerH} L${points[0].x.toFixed(1)},${pad.top + innerH} Z`;

    el.innerHTML = `
      <svg class="area-chart" viewBox="0 0 ${width} ${height}" role="img">
        <defs>
          <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#ff6a2b" stop-opacity="0.28"/>
            <stop offset="100%" stop-color="#ff6a2b" stop-opacity="0"/>
          </linearGradient>
        </defs>
        ${[0, 1, 2].map((i) => {
          const y = pad.top + (innerH / 2) * i;
          return `<line x1="${pad.left}" y1="${y}" x2="${width - pad.right}" y2="${y}" class="chart-grid"/>`;
        }).join("")}
        <path d="${area}" fill="url(#areaFill)"/>
        <path d="${line}" class="chart-line"/>
        ${points
          .map(
            (p) => `<g class="chart-point">
              <circle cx="${p.x}" cy="${p.y}" r="9" fill="transparent"><title>${label(p.d)}: ${format(Number(value(p.d)) || 0)}</title></circle>
              <circle cx="${p.x}" cy="${p.y}" r="4"/>
            </g>`
          )
          .join("")}
        ${points
          .map(
            (p) => `<text x="${p.x}" y="${height - 10}" text-anchor="middle" class="chart-label">${label(p.d)}</text>`
          )
          .join("")}
      </svg>`;
  }

  function donut(el, data, { value = (d) => d.value, label = (d) => d.label, tone = (d) => d.tone || "brand", centerLabel = "всего" } = {}) {
    if (!el) return;
    const total = data.reduce((sum, d) => sum + (Number(value(d)) || 0), 0);
    let acc = 0;
    const stops = [];
    const legend = [];
    data.forEach((d) => {
      const v = Number(value(d)) || 0;
      if (!v) return;
      const from = (acc / total) * 100;
      acc += v;
      const to = (acc / total) * 100;
      const color = TONES[tone(d)] || tone(d);
      stops.push(`${color} ${from.toFixed(2)}% ${to.toFixed(2)}%`);
      legend.push(
        `<li><span class="dot" style="background:${color}"></span><span class="legend-label">${label(d)}</span><b>${v}</b></li>`
      );
    });
    el.innerHTML = `
      <div class="donut-wrap">
        <div class="donut" style="background:${total ? `conic-gradient(${stops.join(",")})` : "#e8ecf2"}">
          <div class="donut-hole"><b>${total}</b><span>${centerLabel}</span></div>
        </div>
        <ul class="donut-legend">${legend.join("")}</ul>
      </div>`;
  }

  function hbars(el, data, { value = (d) => d.value, label = (d) => d.label, hint = () => "", format = String } = {}) {
    if (!el) return;
    const max = Math.max(...data.map((d) => Number(value(d)) || 0), 1);
    el.innerHTML = data
      .map(
        (d) => `<div class="hbar-row">
          <div class="hbar-top"><span>${label(d)}</span><b>${format(Number(value(d)) || 0)}</b></div>
          <div class="hbar-track"><div class="hbar-fill" style="width:${Math.max(2, ((Number(value(d)) || 0) / max) * 100)}%"></div></div>
          ${hint(d) ? `<div class="hbar-hint">${hint(d)}</div>` : ""}
        </div>`
      )
      .join("");
  }

  window.Charts = { barChart, areaChart, donut, hbars, TONES };
})();
