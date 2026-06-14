(async () => {
  const root = document.getElementById("module-root");
  const mode = document.body.dataset.mode === "dashboard" ? "dashboard" : "page";
  const api = "/api/modules/runtime/ups-monitor/api/status";

  try {
    const manifest = await requestJson("module.json", "Не удалось загрузить UPS.");
    renderShell(manifest);
    await loadStatus();
  } catch (error) {
    renderError(error instanceof Error ? error.message : "Не удалось открыть UPS.");
  }

  function renderShell(manifest) {
    root.innerHTML = `
      <header class="module-heading">
        <div class="min-width-0">
          <p class="module-eyebrow">${escapeHtml(manifest.categoryLabel || "System")}</p>
          <h1>${escapeHtml(manifest.name || "UPS")}</h1>
          <p class="module-summary">${escapeHtml(manifest.summary || manifest.description || "")}</p>
        </div>
        <button class="refresh-button" id="refresh" type="button">Обновить</button>
      </header>
      <div id="module-content"><div class="module-loading"><span class="spinner"></span>Получаю данные UPS...</div></div>
    `;
    document.getElementById("refresh")?.addEventListener("click", () => void loadStatus());
  }

  async function loadStatus() {
    const refresh = document.getElementById("refresh");
    if (refresh) {
      refresh.disabled = true;
      refresh.textContent = "Обновляю...";
    }

    try {
      const response = await fetch(api, { cache: "no-store", credentials: "same-origin" });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        renderDiagnostic(errorMessage(payload, `UPS returned HTTP ${response.status}`));
        return;
      }
      renderOverview(payload.data || payload);
    } catch (error) {
      renderDiagnostic(error instanceof Error ? error.message : "UPS не отвечает.");
    } finally {
      if (refresh) {
        refresh.disabled = false;
        refresh.textContent = "Обновить";
      }
    }
  }

  function renderOverview(data) {
    const content = document.getElementById("module-content");
    const battery = data.battery || {};
    const identity = data.identity || {};
    const input = data.input || {};
    const output = data.output || {};
    const inputLine = Array.isArray(input.lines) ? input.lines[0] || {} : {};
    const outputLine = Array.isArray(output.lines) ? output.lines[0] || {} : {};
    const alarms = Array.isArray(data.alarms) ? data.alarms : [];
    const events = Array.isArray(data.events) ? data.events : [];
    const statusTone = ["on_battery", "low_battery", "depleted"].includes(data.status) ? "warning" : data.status === "offline" ? "critical" : "healthy";
    const name = identity.name || identity.model || "UPS";

    if (mode === "dashboard") {
      content.innerHTML = `
        <section class="dashboard-card">
          <div class="dashboard-header">
            <div class="min-width-0"><p class="module-eyebrow">${escapeHtml(identity.manufacturer || "UPS")}</p><h2>${escapeHtml(name)}</h2></div>
            <span class="status status--${statusTone}"><span></span>${escapeHtml(statusLabel(data))}</span>
          </div>
          <div class="battery-compact">
            <div class="battery-compact__value">${escapeHtml(formatPercent(battery.chargePercent))}</div>
            <div class="battery-bar"><span style="width:${normalizePercent(battery.chargePercent)}%"></span></div>
            <div class="battery-compact__meta"><span>${escapeHtml(formatRuntime(battery.estimatedMinutesRemaining))}</span><span>${alarms.length ? `${alarms.length} аварий` : "Без аварий"}</span></div>
          </div>
        </section>
      `;
      return;
    }

    content.innerHTML = `
      ${(data.warnings || []).length ? `<div class="notice">${escapeHtml(data.warnings.map((warning) => warning.message).filter(Boolean).join(" "))}</div>` : ""}
      <section class="ups-hero">
        <div class="ups-icon"><span class="ups-icon__fill" style="height:${normalizePercent(battery.chargePercent)}%"></span><strong>${escapeHtml(formatPercent(battery.chargePercent))}</strong></div>
        <div class="min-width-0">
          <div class="hero-status"><span class="status status--${statusTone}"><span></span>${escapeHtml(statusLabel(data))}</span><span class="source-pill">${escapeHtml(sourceLabel(data))}</span></div>
          <h2>${escapeHtml(name)}</h2>
          <p>${escapeHtml([identity.manufacturer, identity.model].filter(Boolean).join(" · ") || "Источник бесперебойного питания")}</p>
          <div class="hero-meta"><span>Synology: ${escapeHtml(data.synologyHost || "подключён")}</span><span>Обновлено: ${escapeHtml(formatDate(data.lastUpdated))}</span></div>
        </div>
      </section>

      <section class="metric-grid">
        ${metric("Заряд", formatPercent(battery.chargePercent), battery.statusLabel || "Батарея", statusTone === "healthy" ? "green" : "amber")}
        ${metric("Осталось", formatRuntime(battery.estimatedMinutesRemaining), battery.secondsOnBattery ? `${formatDuration(battery.secondsOnBattery)} на батарее` : "Расчёт UPS", "blue")}
        ${metric("Нагрузка", formatPercent(outputLine.loadPercent), output.sourceLabel || "Выход", "violet")}
        ${metric("Аварии", String(data.alarmsPresent ?? alarms.length), alarms.length ? "Требуют внимания" : "Активных нет", alarms.length ? "amber" : "green")}
      </section>

      <section class="content-grid">
        <article class="panel panel--battery">
          <div class="panel-heading"><div><p class="module-eyebrow">Батарея</p><h2>${escapeHtml(battery.statusLabel || statusLabel(data))}</h2></div><strong>${escapeHtml(formatPercent(battery.chargePercent))}</strong></div>
          <div class="battery-bar battery-bar--large"><span style="width:${normalizePercent(battery.chargePercent)}%"></span></div>
          <div class="detail-grid">
            ${detailTile("Напряжение", formatUnit(battery.voltageVolts, "В"))}
            ${detailTile("Ток", formatUnit(battery.currentAmps, "А"))}
            ${detailTile("Температура", formatUnit(battery.temperatureC, "°C"))}
            ${detailTile("Осталось", formatRuntime(battery.estimatedMinutesRemaining))}
          </div>
        </article>

        <article class="panel">
          <div class="panel-heading"><div><p class="module-eyebrow">Электропитание</p><h2>${escapeHtml(output.sourceLabel || "Выход UPS")}</h2></div></div>
          <dl class="detail-list">
            ${detail("Входное напряжение", formatUnit(inputLine.voltageVolts, "В"))}
            ${detail("Входная частота", formatUnit(inputLine.frequencyHz, "Гц"))}
            ${detail("Выходное напряжение", formatUnit(outputLine.voltageVolts, "В"))}
            ${detail("Выходная мощность", formatUnit(outputLine.powerWatts, "Вт"))}
            ${detail("Выходная частота", formatUnit(output.frequencyHz, "Гц"))}
          </dl>
        </article>

        <article class="panel">
          <div class="panel-heading"><div><p class="module-eyebrow">Аварии</p><h2>${alarms.length ? `${alarms.length} активно` : "Всё спокойно"}</h2></div></div>
          <div class="list">${renderAlarms(alarms)}</div>
        </article>

        <article class="panel">
          <div class="panel-heading"><div><p class="module-eyebrow">Журнал</p><h2>Последние события</h2></div></div>
          <div class="list">${renderEvents(events)}</div>
        </article>
      </section>
    `;
  }

  function renderDiagnostic(message) {
    const lower = String(message).toLowerCase();
    let eyebrow = "Требуется настройка";
    let title = "UPS не подключён";
    let hint = "Сначала подключите Synology Safe Monitoring или Advanced DSM Integration в настройках модуля Synology.";

    if (/required|not configured|не настроен|not connected/.test(lower)) {
      // The UPS module reads its connection from the Synology module.
    } else if (/timeout|timed out|econnrefused|unreachable|failed to fetch|network/.test(lower)) {
      eyebrow = "Нет ответа";
      title = "Synology не отвечает";
      hint = "Проверьте IP-адрес Synology, порт 161, службу SNMP и правила firewall.";
    } else if (/auth|credential|password|username|unauthor|forbidden|400|401|403/.test(lower)) {
      eyebrow = "Ошибка авторизации";
      title = "Не удалось получить данные UPS";
      hint = "Проверьте имя пользователя, пароли и протоколы SNMPv3 или учётные данные Advanced DSM.";
    } else {
      eyebrow = "Ошибка UPS";
      title = "Не удалось получить телеметрию UPS";
      hint = message;
    }

    const content = document.getElementById("module-content") || root;
    content.innerHTML = `
      <section class="connection-state connection-state--error">
        <div class="connection-icon">UPS</div>
        <div><p class="module-eyebrow">${escapeHtml(eyebrow)}</p><h2>${escapeHtml(title)}</h2><p>${escapeHtml(hint)}</p><a class="module-button" href="/settings#module-synology" target="_top">Открыть настройки Synology</a></div>
      </section>
    `;
  }

  function renderAlarms(alarms) {
    if (!alarms.length) return '<div class="empty empty--success">Активных аварий нет.</div>';
    return alarms.map((alarm) => `<div class="list-row list-row--alarm"><div class="min-width-0"><strong>${escapeHtml(alarm.description || "UPS alarm")}</strong><span>${escapeHtml(alarm.timeSeconds == null ? "" : `${alarm.timeSeconds} сек.`)}</span></div></div>`).join("");
  }

  function renderEvents(events) {
    if (!events.length) return '<div class="empty">Событий UPS пока нет.</div>';
    return events.slice(0, 8).map((event) => `<div class="list-row"><span class="event-dot event-dot--${escapeAttribute(event.severity || "info")}"></span><div class="min-width-0"><strong>${escapeHtml(event.message || event.statusLabel || "UPS")}</strong><span>${escapeHtml(formatDate(event.createdAt))}</span></div></div>`).join("");
  }

  function metric(label, value, detail, tone) {
    return `<article class="metric metric--${tone}"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong><small>${escapeHtml(detail)}</small></article>`;
  }

  function detail(label, value) {
    if (!value) return "";
    return `<div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd></div>`;
  }

  function detailTile(label, value) {
    if (!value) return "";
    return `<div class="detail-tile"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`;
  }

  async function requestJson(url, fallback) {
    const response = await fetch(url, { cache: "no-store", credentials: "same-origin" });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(errorMessage(payload, fallback));
    return payload;
  }

  function errorMessage(payload, fallback) {
    if (typeof payload === "string" && payload.trim()) return payload;
    if (typeof payload?.error === "string" && payload.error.trim()) return payload.error;
    if (typeof payload?.error?.message === "string" && payload.error.message.trim()) return payload.error.message;
    if (typeof payload?.message === "string" && payload.message.trim()) return payload.message;
    return fallback;
  }

  function renderError(message) {
    root.innerHTML = `<section class="connection-state connection-state--error"><div class="connection-icon">!</div><div><h2>Не удалось открыть UPS</h2><p>${escapeHtml(message)}</p></div></section>`;
  }

  function statusLabel(data) {
    return data.statusLabel || {
      normal: "Работает нормально",
      on_battery: "Работает от батареи",
      low_battery: "Низкий заряд",
      depleted: "Батарея разряжена",
      bypass: "Режим bypass",
      offline: "Не подключён"
    }[data.status] || "Нет данных";
  }

  function sourceLabel(data) {
    return data.connectionMode === "advanced_dsm" || data.source === "synology_dsm" ? "Advanced DSM" : "Safe Monitoring";
  }

  function formatPercent(value) {
    return value === null || value === undefined || !Number.isFinite(Number(value)) ? "Нет данных" : `${Math.round(Number(value))}%`;
  }

  function normalizePercent(value) {
    if (value === null || value === undefined || !Number.isFinite(Number(value))) return 0;
    return Math.min(100, Math.max(0, Number(value)));
  }

  function formatRuntime(minutes) {
    if (minutes === null || minutes === undefined || !Number.isFinite(Number(minutes))) return "Нет данных";
    const value = Math.max(0, Number(minutes));
    const hours = Math.floor(value / 60);
    const rest = Math.round(value % 60);
    return hours ? `${hours} ч ${rest} мин` : `${rest} мин`;
  }

  function formatDuration(seconds) {
    if (!Number.isFinite(Number(seconds))) return "";
    const minutes = Math.floor(Number(seconds) / 60);
    return formatRuntime(minutes);
  }

  function formatUnit(value, unit) {
    if (value === null || value === undefined || !Number.isFinite(Number(value))) return "";
    const numeric = Number(value);
    return `${Number.isInteger(numeric) ? numeric : numeric.toFixed(1)} ${unit}`;
  }

  function formatDate(value) {
    if (!value) return "Нет данных";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
  }

  function escapeHtml(value) {
    return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
  }

  function escapeAttribute(value) {
    return escapeHtml(value).replaceAll("`", "&#096;");
  }
})();
