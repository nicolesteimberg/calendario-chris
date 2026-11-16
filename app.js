/* Calendário de postagens do Chris — site estático, sem dependências. */
(function () {
  "use strict";

  const HOUR_START = 6;
  const HOUR_END = 24;
  const HOUR_H = 48;
  const SLOT_MIN = 30;
  const MONTHS = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
  ];
  const DOW = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
  const DOW_FULL = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];
  const PLATFORMS = ["youtube", "tiktok", "instagram_teste", "instagram_reel"];
  const PLATFORM_LABEL = {
    youtube: "YouTube",
    tiktok: "TikTok",
    instagram_teste: "Instagram teste",
    instagram_reel: "Instagram reel",
  };
  const PLATFORM_SHORT = {
    youtube: "YT",
    tiktok: "TT",
    instagram_teste: "IG teste",
    instagram_reel: "IG reel",
  };
  const TZ = "America/Sao_Paulo";

  const state = {
    data: null,
    view: "mes",
    cursor: null,
    enabled: { youtube: true, tiktok: true, instagram_teste: true, instagram_reel: true },
    selected: null,
    today: "",
    now: "",
  };

  function pad(n) { return String(n).padStart(2, "0"); }
  function toIso(y, m, d) { return y + "-" + pad(m) + "-" + pad(d); }
  function parts(iso) {
    const [y, m, d] = iso.split("-").map(Number);
    return { y, m, d };
  }
  function addDays(iso, n) {
    const { y, m, d } = parts(iso);
    const dt = new Date(Date.UTC(y, m - 1, d + n));
    return toIso(dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate());
  }
  function addMonths(iso, n) {
    const { y, m, d } = parts(iso);
    const dt = new Date(Date.UTC(y, m - 1 + n, 1));
    const last = new Date(Date.UTC(dt.getUTCFullYear(), dt.getUTCMonth() + 1, 0)).getUTCDate();
    return toIso(dt.getUTCFullYear(), dt.getUTCMonth() + 1, Math.min(d, last));
  }
  function mon0(iso) {
    const { y, m, d } = parts(iso);
    return (new Date(Date.UTC(y, m - 1, d)).getUTCDay() + 6) % 7;
  }
  function weekStart(iso) { return addDays(iso, -mon0(iso)); }
  function monthStart(iso) { const { y, m } = parts(iso); return toIso(y, m, 1); }
  function monthGrid(iso) {
    const start = weekStart(monthStart(iso));
    return Array.from({ length: 42 }, (_, i) => addDays(start, i));
  }
  function fmtDay(iso) {
    const { d, m, y } = parts(iso);
    return pad(d) + "/" + pad(m) + "/" + y;
  }
  function fmtLong(iso) {
    const { d, m, y } = parts(iso);
    return DOW_FULL[mon0(iso)] + ", " + d + " de " + MONTHS[m - 1].toLowerCase() + " de " + y;
  }
  function monthTitle(iso) {
    const { m, y } = parts(iso);
    return MONTHS[m - 1] + " " + y;
  }
  function timeToMin(time) {
    const [h, m] = time.split(":").map(Number);
    return h * 60 + m;
  }
  function hourLabel(h) { return pad(h) + ":00"; }

  function nowInBRT() {
    const fmt = new Intl.DateTimeFormat("en-CA", {
      timeZone: TZ,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    });
    const bits = Object.fromEntries(fmt.formatToParts(new Date()).map((p) => [p.type, p.value]));
    return { date: bits.year + "-" + bits.month + "-" + bits.day, time: bits.hour + ":" + bits.minute };
  }

  function el(tag, attrs, children) {
    const node = document.createElement(tag);
    if (attrs) {
      Object.entries(attrs).forEach(([k, v]) => {
        if (v == null || v === false) return;
        if (k === "class") node.className = v;
        else if (k === "dataset") Object.assign(node.dataset, v);
        else if (k.startsWith("on") && typeof v === "function") node.addEventListener(k.slice(2), v);
        else if (k === "text") node.textContent = v;
        else if (k === "html") node.innerHTML = v;
        else if (k === "style" && typeof v === "object") Object.assign(node.style, v);
        else node.setAttribute(k, v === true ? "" : String(v));
      });
    }
    (children || []).forEach((c) => { if (c) node.appendChild(c); });
    return node;
  }

  function svgEl(tag, attrs, children) {
    const node = document.createElementNS("http://www.w3.org/2000/svg", tag);
    if (attrs) Object.entries(attrs).forEach(([k, v]) => node.setAttribute(k, String(v)));
    (children || []).forEach((c) => node.appendChild(c));
    return node;
  }

  function logoYouTube(size) {
    const s = size || 16;
    const svg = svgEl("svg", { width: s, height: s, viewBox: "0 0 24 24", "aria-hidden": "true" }, [
      svgEl("rect", { width: 24, height: 24, rx: 6, fill: "#FF0000" }),
      svgEl("path", { d: "M10 8.2l6.5 3.8L10 15.8V8.2z", fill: "#fff" }),
    ]);
    const wrap = el("span", { class: "logo" });
    wrap.appendChild(svg);
    return wrap;
  }
  function logoTikTok(size) {
    const s = size || 16;
    const note = "M16.2 5.2v9.05a3.65 3.65 0 1 1-2.15-3.32V8.15c1.05.7 2.3 1.15 3.65 1.25V5.2h-1.5z";
    const svg = svgEl("svg", { width: s, height: s, viewBox: "0 0 24 24", "aria-hidden": "true" }, [
      svgEl("rect", { width: 24, height: 24, rx: 6, fill: "#0F0F0F" }),
    ]);
    const g1 = svgEl("g", { transform: "translate(-0.9,0.7)" }, [svgEl("path", { d: note, fill: "#25F4EE" })]);
    const g2 = svgEl("g", { transform: "translate(0.9,-0.7)" }, [svgEl("path", { d: note, fill: "#FE2C55" })]);
    svg.appendChild(g1); svg.appendChild(g2);
    svg.appendChild(svgEl("path", { d: note, fill: "#fff" }));
    const wrap = el("span", { class: "logo" });
    wrap.appendChild(svg);
    return wrap;
  }
  function logoInstagram(size) {
    const s = size || 16;
    const icon = Math.round(s * 0.68);
    const span = el("span", {
      class: "logo",
      style: {
        width: s + "px",
        height: s + "px",
        borderRadius: Math.max(4, Math.round(s * 0.28)) + "px",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #E1306C 0%, #C13584 48%, #F77737 100%)",
        flexShrink: "0",
      },
    });
    const svg = svgEl("svg", { width: icon, height: icon, viewBox: "0 0 24 24", fill: "none", "aria-hidden": "true" }, [
      svgEl("rect", { x: 4, y: 4, width: 16, height: 16, rx: 5, stroke: "#fff", "stroke-width": 2 }),
      svgEl("circle", { cx: 12, cy: 12, r: 3.6, stroke: "#fff", "stroke-width": 2 }),
      svgEl("circle", { cx: 16.6, cy: 7.4, r: 1.15, fill: "#fff" }),
    ]);
    span.appendChild(svg);
    return span;
  }
  function platformLogo(platform, size) {
    if (platform === "youtube") return logoYouTube(size);
    if (platform === "tiktok") return logoTikTok(size);
    return logoInstagram(size);
  }

  function statusColor(status, light) {
    if (light) return "#FFFFFF";
    if (status === "publicado") return "#3D451C";
    if (status === "falhou" || status === "atencao") return "#B00020";
    if (status === "vazio") return "#6B6B6B";
    return "#846339";
  }
  function statusMark(status, size, light) {
    const s = size || 13;
    const color = statusColor(status, light);
    const svg = svgEl("svg", { width: s, height: s, viewBox: "0 0 16 16", fill: "none", "aria-hidden": "true" });
    if (status === "publicado") {
      svg.appendChild(svgEl("circle", { cx: 8, cy: 8, r: 6.4, stroke: color, "stroke-width": 1.5 }));
      svg.appendChild(svgEl("path", { d: "M4.9 8.2l2.1 2.15 4.2-4.5", stroke: color, "stroke-width": 1.6, "stroke-linecap": "round", "stroke-linejoin": "round" }));
    } else if (status === "falhou" || status === "atencao") {
      svg.appendChild(svgEl("circle", { cx: 8, cy: 8, r: 6.4, stroke: color, "stroke-width": 1.5 }));
      svg.appendChild(svgEl("path", { d: "M5.5 5.5l5 5M10.5 5.5l-5 5", stroke: color, "stroke-width": 1.6, "stroke-linecap": "round" }));
    } else if (status === "vazio") {
      svg.appendChild(svgEl("circle", { cx: 8, cy: 8, r: 6.4, stroke: color, "stroke-width": 1.5, "stroke-dasharray": "2.4 2.1" }));
    } else {
      svg.appendChild(svgEl("circle", { cx: 8, cy: 8, r: 6.4, stroke: color, "stroke-width": 1.5 }));
      svg.appendChild(svgEl("path", { d: "M8 4.8v3.7l2.6 1.7", stroke: color, "stroke-width": 1.5, "stroke-linecap": "round", "stroke-linejoin": "round" }));
    }
    return svg;
  }
  function statusWord(status) {
    return ({ publicado: "Postou", agendado: "Agendado", falhou: "Falhou", atencao: "Bloqueado", pendente: "Pendente", vazio: "Vazio" })[status] || status;
  }
  function shortTitle(post) {
    const ig = post.platform === "instagram_teste" ? "TESTE · " : post.platform === "instagram_reel" ? "REEL · " : "";
    return ig + post.kind + " · " + post.title;
  }
  function sortPosts(a, b) {
    return a.time.localeCompare(b.time) || a.platform.localeCompare(b.platform);
  }

  function layoutDay(posts) {
    const items = posts.slice().sort(sortPosts).map((post) => {
      const start = timeToMin(post.time);
      return { post, start, end: start + SLOT_MIN };
    });
    const colEnd = [];
    const colOf = [];
    items.forEach((it) => {
      let c = 0;
      while (c < colEnd.length && colEnd[c] > it.start) c++;
      if (c === colEnd.length) colEnd.push(it.end);
      else colEnd[c] = it.end;
      colOf.push(c);
    });
    const n = items.length;
    const parent = items.map((_, i) => i);
    const find = (i) => (parent[i] === i ? i : (parent[i] = find(parent[i])));
    const union = (a, b) => { a = find(a); b = find(b); if (a !== b) parent[a] = b; };
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        if (items[i].start < items[j].end && items[j].start < items[i].end) union(i, j);
      }
    }
    const maxCol = new Map();
    for (let i = 0; i < n; i++) {
      const r = find(i);
      maxCol.set(r, Math.max(maxCol.get(r) || 0, colOf[i]));
    }
    return items.map((it, i) => ({
      post: it.post,
      col: colOf[i],
      cols: (maxCol.get(find(i)) || 0) + 1,
      top: ((it.start - HOUR_START * 60) / 60) * HOUR_H,
      height: (SLOT_MIN / 60) * HOUR_H - 2,
    }));
  }

  function visiblePosts() {
    return (state.data.posts || []).filter((p) => state.enabled[p.platform]).slice().sort(sortPosts);
  }

  function chip(label, active, onClick) {
    return el("button", { type: "button", class: "chip" + (active ? " active" : ""), onClick, text: label });
  }
  function navBtn(label, onClick, aria) {
    return el("button", { type: "button", class: "nav-btn", "aria-label": aria || label, onClick, text: label });
  }

  function renderMiniMonth() {
    const days = monthGrid(state.cursor);
    const { m } = parts(state.cursor);
    const grid = el("div", { class: "mini-grid" }, DOW.map((d) => el("div", { class: "mini-dow", text: d })));
    days.forEach((date) => {
      const isToday = date === state.today;
      const isSel = date === state.cursor && !isToday;
      const inMonth = parts(date).m === m;
      grid.appendChild(el("button", {
        type: "button",
        class: "mini-day" + (isToday ? " today" : "") + (isSel ? " sel" : "") + (inMonth ? "" : " out"),
        title: fmtDay(date),
        text: String(parts(date).d),
        onClick: () => { state.cursor = date; render(); },
      }));
    });
    return el("div", { class: "card mini-month" }, [
      el("div", { class: "mini-head" }, [
        navBtn("‹", () => { state.cursor = addMonths(state.cursor, -1); render(); }, "Mês anterior"),
        el("div", { class: "mini-title", text: monthTitle(state.cursor) }),
        navBtn("›", () => { state.cursor = addMonths(state.cursor, 1); render(); }, "Próximo mês"),
      ]),
      grid,
    ]);
  }

  function renderPlatFilters() {
    const box = el("div", { class: "card plat-card" }, [el("div", { class: "card-kicker", text: "Plataformas" })]);
    PLATFORMS.forEach((p) => {
      const checked = state.enabled[p];
      const btn = el("button", {
        type: "button",
        class: "plat-check",
        "aria-pressed": checked ? "true" : "false",
        onClick: () => { state.enabled[p] = !state.enabled[p]; render(); },
      });
      const mark = el("span", { class: "check plat-" + p + (checked ? " on" : "") });
      if (checked) {
        const svg = svgEl("svg", { width: 10, height: 10, viewBox: "0 0 16 16", "aria-hidden": "true" }, [
          svgEl("path", { d: "M3.5 8.2l3 3.1 6-6.6", stroke: "#fff", "stroke-width": 2, fill: "none", "stroke-linecap": "round", "stroke-linejoin": "round" }),
        ]);
        mark.appendChild(svg);
      }
      btn.appendChild(mark);
      btn.appendChild(platformLogo(p, 16));
      btn.appendChild(el("span", { text: PLATFORM_LABEL[p] }));
      box.appendChild(btn);
    });
    return box;
  }

  function renderLegend() {
    const items = [
      ["publicado", "Postou"],
      ["agendado", "Agendado / pendente"],
      ["atencao", "Falhou / bloqueado"],
      ["vazio", "Vazio"],
    ];
    const box = el("div", { class: "card legend-card" }, [el("div", { class: "card-kicker", text: "Status" })]);
    items.forEach(([st, label]) => {
      const row = el("span", { class: "legend-item" });
      row.appendChild(statusMark(st, 13, false));
      row.appendChild(document.createTextNode(label));
      box.appendChild(row);
    });
    return box;
  }

  function openDay(date) {
    state.cursor = date;
    state.view = "dia";
    render();
  }

  function renderMonth(byDate) {
    const wrap = el("div", { class: "month" });
    const grid = el("div", { class: "month-grid" }, DOW.map((d) => el("div", { class: "month-dow", text: d })));
    monthGrid(state.cursor).forEach((date) => {
      const inMonth = parts(date).m === parts(state.cursor).m;
      const isToday = date === state.today;
      const posts = byDate[date] || [];
      let yt = 0, tt = 0, ig = 0;
      posts.forEach((p) => {
        if (p.platform === "youtube") yt += 1;
        else if (p.platform === "tiktok") tt += 1;
        else ig += 1;
      });
      const cell = el("div", {
        class: "day-cell" + (inMonth ? "" : " out") + (isToday ? " today" : ""),
        onClick: () => openDay(date),
      });
      const head = el("div", { class: "day-head" }, [
        el("span", { class: "day-num" + (isToday ? " today" : ""), text: String(parts(date).d) }),
      ]);
      if (posts.length) {
        head.appendChild(el("span", { class: "day-total", text: posts.length + (posts.length === 1 ? " post" : " posts") }));
      }
      cell.appendChild(head);
      if (posts.length) {
        const counts = el("div", { class: "plat-counts" });
        if (yt) { const s = el("span"); s.appendChild(logoYouTube(12)); s.appendChild(document.createTextNode(" " + yt)); counts.appendChild(s); }
        if (tt) { const s = el("span"); s.appendChild(logoTikTok(12)); s.appendChild(document.createTextNode(" " + tt)); counts.appendChild(s); }
        if (ig) { const s = el("span"); s.appendChild(logoInstagram(12)); s.appendChild(document.createTextNode(" " + ig)); counts.appendChild(s); }
        cell.appendChild(counts);
        const dots = el("div", { class: "dots" });
        posts.forEach((p) => {
          dots.appendChild(el("span", {
            class: "dot dot-" + p.status,
            title: PLATFORM_SHORT[p.platform] + " · " + statusWord(p.status) + " · " + p.time,
          }));
        });
        cell.appendChild(dots);
      }
      grid.appendChild(cell);
    });
    wrap.appendChild(grid);
    return wrap;
  }

  function renderEvent(ev, compact) {
    const { post, col, cols, top, height } = ev;
    const vazio = post.status === "vazio";
    const btn = el("button", {
      type: "button",
      class: "event " + post.platform + (compact ? " compact" : " wide") + (state.selected === post.id ? " selected" : "") + (vazio ? " vazio" : ""),
      title: PLATFORM_LABEL[post.platform] + " · " + statusWord(post.status) + " · " + post.time + " · " + post.title,
      style: {
        top: top + "px",
        left: "calc(" + ((col / cols) * 100) + "% + 1px)",
        width: "calc(" + ((1 / cols) * 100) + "% - 3px)",
        height: Math.max(height, 22) + "px",
      },
      onClick: (e) => { e.stopPropagation(); state.selected = post.id; render(); },
    });
    btn.appendChild(el("span", { class: "event-stripe " + post.platform }));
    const row = el("div", { class: "event-row" });
    row.appendChild(platformLogo(post.platform, compact ? 11 : 12));
    row.appendChild(statusMark(post.status, compact ? 10 : 11, !vazio));
    row.appendChild(el("span", { class: "event-time", text: post.time }));
    row.appendChild(el("span", { class: "event-title", text: shortTitle(post) }));
    btn.appendChild(row);
    return btn;
  }

  function renderTimeGrid(dates, byDate, canOpenDay) {
    const totalH = (HOUR_END - HOUR_START) * HOUR_H;
    const hours = Array.from({ length: HOUR_END - HOUR_START + 1 }, (_, i) => HOUR_START + i);
    const nowMin = timeToMin(state.now);
    const nowTop = ((nowMin - HOUR_START * 60) / 60) * HOUR_H;
    const showNow = nowMin >= HOUR_START * 60 && nowMin <= HOUR_END * 60;
    const compact = dates.length > 1;
    const cols = "56px repeat(" + dates.length + ", minmax(" + (compact ? 108 : 240) + "px, 1fr))";

    const wrap = el("div", { class: "time-grid" });
    const head = el("div", { class: "tg-head", style: { gridTemplateColumns: cols } }, [el("div", { class: "gmt", text: "GMT-3" })]);
    dates.forEach((date) => {
      const isToday = date === state.today;
      const btn = el("button", {
        type: "button",
        class: "day-head-btn" + (canOpenDay ? "" : " static"),
        onClick: canOpenDay ? () => openDay(date) : undefined,
      }, [
        el("div", { class: "dow-label" + (isToday ? " today" : ""), text: DOW[mon0(date)] }),
        el("div", { class: "date-badge" + (isToday ? " today" : ""), text: String(parts(date).d) }),
      ]);
      head.appendChild(btn);
    });
    wrap.appendChild(head);

    const bodyInner = el("div", {
      class: "tg-body",
      style: { gridTemplateColumns: cols, minWidth: compact ? (56 + dates.length * 108) + "px" : undefined },
    });
    const hourCol = el("div", { class: "hour-col", style: { height: (totalH + 8) + "px" } });
    hours.forEach((h) => {
      hourCol.appendChild(el("div", { class: "hour-lab", text: hourLabel(h), style: { top: ((h - HOUR_START) * HOUR_H - 7) + "px" } }));
    });
    if (showNow && dates.includes(state.today)) {
      hourCol.appendChild(el("div", { class: "now-lab", text: state.now, style: { top: (nowTop - 7) + "px" } }));
    }
    bodyInner.appendChild(hourCol);

    dates.forEach((date) => {
      const col = el("div", { class: "day-col", style: { height: (totalH + 8) + "px" } });
      hours.forEach((h) => {
        col.appendChild(el("div", { class: "hour-line", style: { top: ((h - HOUR_START) * HOUR_H) + "px" } }));
      });
      layoutDay(byDate[date] || []).forEach((ev) => col.appendChild(renderEvent(ev, compact)));
      if (date === state.today && showNow) {
        const line = el("div", { class: "now-line", style: { top: nowTop + "px" } });
        line.appendChild(el("span", { class: "now-dot" }));
        col.appendChild(line);
      }
      bodyInner.appendChild(col);
    });
    wrap.appendChild(el("div", { class: "tg-scroll" }, [bodyInner]));
    return wrap;
  }

  function renderDetail(post) {
    const close = el("button", { type: "button", class: "detail-close", text: "Fechar", onClick: () => { state.selected = null; render(); } });
    const aside = el("aside", { class: "detail" }, [
      el("div", { class: "detail-head" }, [el("div", { class: "detail-title", text: post.title }), close]),
    ]);
    const rows = el("div", { class: "detail-rows" });
    function row(label, child) {
      const box = el("div", {}, [el("div", { class: "detail-k", text: label })]);
      const v = el("div", { class: "detail-v" });
      if (typeof child === "string") v.textContent = child;
      else v.appendChild(child);
      box.appendChild(v);
      rows.appendChild(box);
    }
    const plat = el("span", { class: "plat-line" });
    plat.appendChild(platformLogo(post.platform, 18));
    plat.appendChild(document.createTextNode(PLATFORM_LABEL[post.platform]));
    row("Plataforma", plat);
    row("Horário (BRT)", fmtDay(post.date) + ", " + post.time);
    row("Status", el("span", { class: "pill pill-" + post.status, text: statusWord(post.status) }));
    row("Tipo", post.kind);
    if (post.link) {
      row("Link", el("a", { href: post.link, target: "_blank", rel: "noreferrer", text: "Abrir post" }));
    } else {
      row("Link", "Sem link no ar");
    }
    row("Observação", post.note || "—");
    aside.appendChild(rows);
    return aside;
  }

  function render() {
    const root = document.getElementById("app");
    const clock = nowInBRT();
    state.today = clock.date;
    state.now = clock.time;
    if (!state.cursor) state.cursor = state.today;

    const posts = visiblePosts();
    const selectedPost = posts.find((p) => p.id === state.selected) || null;
    const week0 = weekStart(state.cursor);
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(week0, i));
    const todayWeek0 = weekStart(state.today);
    const postsToday = posts.filter((p) => p.date === state.today && p.status === "publicado").length;
    const agendadosSemana = posts.filter((p) => p.date >= todayWeek0 && p.date <= addDays(todayWeek0, 6) && p.status === "agendado").length;
    const erros = posts.filter((p) => p.date >= state.today && (p.status === "falhou" || p.status === "atencao")).length;
    const vaziosSemana = new Set(
      posts.filter((p) => p.status === "vazio" && p.date >= todayWeek0 && p.date <= addDays(todayWeek0, 6)).map((p) => p.date + "T" + p.time)
    ).size;

    const headerLabel = state.view === "mes"
      ? monthTitle(state.cursor)
      : state.view === "semana"
        ? fmtDay(weekDays[0]).slice(0, 5) + " – " + fmtDay(weekDays[6])
        : fmtLong(state.cursor);

    const byDate = {};
    posts.forEach((p) => { (byDate[p.date] ||= []).push(p); });

    const page = el("div", { class: "page" });
    const top = el("div", { class: "topbar" });
    const left = el("div", { style: { display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" } }, [
      el("div", { class: "nav-group" }, [
        navBtn("‹", () => {
          if (state.view === "mes") state.cursor = addMonths(state.cursor, -1);
          else if (state.view === "semana") state.cursor = addDays(state.cursor, -7);
          else state.cursor = addDays(state.cursor, -1);
          render();
        }, "Anterior"),
        el("div", { class: "header-label", text: headerLabel }),
        navBtn("›", () => {
          if (state.view === "mes") state.cursor = addMonths(state.cursor, 1);
          else if (state.view === "semana") state.cursor = addDays(state.cursor, 7);
          else state.cursor = addDays(state.cursor, 1);
          render();
        }, "Próximo"),
      ]),
      chip("Hoje", state.cursor === state.today, () => { state.cursor = state.today; render(); }),
    ]);
    const views = el("div", { class: "view-toggle" }, [
      chip("Mês", state.view === "mes", () => { state.view = "mes"; render(); }),
      chip("Semana", state.view === "semana", () => { state.view = "semana"; render(); }),
      chip("Dia", state.view === "dia", () => { state.view = "dia"; render(); }),
    ]);
    top.appendChild(left);
    top.appendChild(views);
    page.appendChild(top);
    page.appendChild(el("div", { class: "updated", text: "Atualizado em " + (state.data.updated || "") }));

    const layout = el("div", { class: "layout" });
    layout.appendChild(el("aside", { class: "sidebar" }, [
      renderMiniMonth(),
      renderPlatFilters(),
      renderLegend(),
    ]));

    const main = el("div", { class: "main" });
    const metrics = el("div", { class: "metrics" });
    [
      [String(postsToday), "Posts hoje"],
      [String(agendadosSemana), "Agendados na semana"],
      [String(erros), "Erros e bloqueados"],
      [String(vaziosSemana), "Vazios na semana"],
    ].forEach(([value, label]) => {
      metrics.appendChild(el("div", { class: "metric" }, [
        el("div", { class: "metric-value", text: value }),
        el("div", { class: "metric-label", text: label }),
      ]));
    });
    main.appendChild(metrics);
    if (state.view === "mes") main.appendChild(renderMonth(byDate));
    else if (state.view === "semana") main.appendChild(renderTimeGrid(weekDays, byDate, true));
    else main.appendChild(renderTimeGrid([state.cursor], byDate, false));
    layout.appendChild(main);
    if (selectedPost) layout.appendChild(renderDetail(selectedPost));
    page.appendChild(layout);

    root.replaceChildren(page);
  }

  function boot() {
    const root = document.getElementById("app");
    fetch("data.json", { cache: "no-store" })
      .then((r) => {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.json();
      })
      .then((data) => {
        state.data = data;
        const clock = nowInBRT();
        state.today = clock.date;
        state.now = clock.time;
        state.cursor = clock.date;
        const params = new URLSearchParams(location.search);
        if (["mes", "semana", "dia"].includes(params.get("view"))) state.view = params.get("view");
        if (/^\d{4}-\d{2}-\d{2}$/.test(params.get("date") || "")) state.cursor = params.get("date");
        document.title = data.title || document.title;
        render();
      })
      .catch((err) => {
        root.replaceChildren(el("p", { class: "error", text: "Não foi possível carregar o calendário. Abra o site por um servidor (não pelo arquivo local). " + err.message }));
      });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
