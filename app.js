const STORAGE_KEY = "dailyRoutineChecklist.v1";

const DEFAULT_TASKS = [
  { id: createId(), name: "Wake up on time", time: "06:30", duration: "5 min", type: "Health", priority: "High" },
  { id: createId(), name: "Exercise or walk", time: "07:00", duration: "30 min", type: "Health", priority: "High" },
  { id: createId(), name: "Plan the day", time: "09:00", duration: "10 min", type: "Work", priority: "Medium" }
];

const state = {
  unlocked: false,
  selectedDate: toDateKey(new Date()),
  calendarDate: new Date(),
  calendarView: "day",
  colorMode: "status",
  data: loadData()
};

const els = {};

document.addEventListener("DOMContentLoaded", () => {
  cacheElements();
  bindEvents();
  ensureIcons();
  els.activeDate.value = state.selectedDate;
  renderAll();
});

function cacheElements() {
  [
    "lockScreen", "appShell", "pinForm", "pinInput", "pinError", "todayHeading", "calendarButton",
    "exportButton", "settingsButton", "lockButton", "previousDay", "nextDay", "todayButton",
    "activeDate", "completedCount", "totalCount", "completionPercent", "addTaskButton", "taskList",
    "emptyTasks", "dailyNotes", "taskDialog", "taskForm", "taskDialogTitle", "taskId", "taskName",
    "taskTime", "taskDuration", "taskType", "taskPriority", "calendarDialog", "calendarRange",
    "calendarGrid", "calendarTitle", "calendarPrevious", "calendarNext", "settingsDialog",
    "pinChangeForm", "currentPin", "newPin", "pinChangeMessage"
  ].forEach((id) => {
    els[id] = document.getElementById(id);
  });
}

function bindEvents() {
  els.pinForm.addEventListener("submit", unlock);
  els.lockButton.addEventListener("click", lock);
  els.activeDate.addEventListener("change", () => setSelectedDate(els.activeDate.value));
  els.previousDay.addEventListener("click", () => moveSelectedDate(-1));
  els.nextDay.addEventListener("click", () => moveSelectedDate(1));
  els.todayButton.addEventListener("click", () => setSelectedDate(toDateKey(new Date())));
  els.addTaskButton.addEventListener("click", () => openTaskDialog());
  els.taskForm.addEventListener("submit", saveTask);
  els.dailyNotes.addEventListener("input", saveNotes);
  els.calendarButton.addEventListener("click", openCalendar);
  els.calendarPrevious.addEventListener("click", () => moveCalendar(-1));
  els.calendarNext.addEventListener("click", () => moveCalendar(1));
  els.exportButton.addEventListener("click", exportExcel);
  els.settingsButton.addEventListener("click", () => openDialog(els.settingsDialog));
  els.pinChangeForm.addEventListener("submit", changePin);

  document.querySelectorAll("[data-close-dialog]").forEach((button) => {
    button.addEventListener("click", () => document.getElementById(button.dataset.closeDialog).close());
  });

  document.querySelectorAll("[data-calendar-view]").forEach((button) => {
    button.addEventListener("click", () => {
      state.calendarView = button.dataset.calendarView;
      setActiveSegment("[data-calendar-view]", state.calendarView);
      renderCalendar();
    });
  });

  document.querySelectorAll("[data-color-mode]").forEach((button) => {
    button.addEventListener("click", () => {
      state.colorMode = button.dataset.colorMode;
      setActiveSegment("[data-color-mode]", state.colorMode);
      renderCalendar();
    });
  });
}

function loadData() {
  const fallback = {
    pin: "0000",
    tasks: DEFAULT_TASKS,
    days: {}
  };

  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!saved || !Array.isArray(saved.tasks)) return fallback;
    return {
      pin: /^\d{4}$/.test(saved.pin) ? saved.pin : "0000",
      tasks: saved.tasks,
      days: saved.days && typeof saved.days === "object" ? saved.days : {}
    };
  } catch {
    return fallback;
  }
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.data));
}

function unlock(event) {
  event.preventDefault();
  if (els.pinInput.value === state.data.pin) {
    state.unlocked = true;
    els.pinInput.value = "";
    els.pinError.textContent = "";
    els.lockScreen.classList.add("is-hidden");
    els.appShell.classList.remove("is-hidden");
    renderAll();
    return;
  }

  els.pinError.textContent = "Incorrect PIN. Try again.";
}

function lock() {
  state.unlocked = false;
  els.appShell.classList.add("is-hidden");
  els.lockScreen.classList.remove("is-hidden");
  els.pinInput.focus();
}

function changePin(event) {
  event.preventDefault();
  const currentPin = els.currentPin.value;
  const newPin = els.newPin.value;

  if (currentPin !== state.data.pin) {
    els.pinChangeMessage.textContent = "Current PIN does not match.";
    return;
  }

  if (!/^\d{4}$/.test(newPin)) {
    els.pinChangeMessage.textContent = "New PIN must be exactly 4 digits.";
    return;
  }

  state.data.pin = newPin;
  saveData();
  els.currentPin.value = "";
  els.newPin.value = "";
  els.pinChangeMessage.textContent = "PIN changed.";
  setTimeout(() => {
    els.pinChangeMessage.textContent = "";
    els.settingsDialog.close();
  }, 700);
}

function renderAll() {
  renderHeading();
  renderTasks();
  renderSummary();
  renderNotes();
  renderCalendar();
  ensureIcons();
}

function renderHeading() {
  els.todayHeading.textContent = formatLongDate(parseDateKey(state.selectedDate));
}

function renderTasks() {
  const day = getDayRecord(state.selectedDate);
  els.taskList.innerHTML = "";
  els.emptyTasks.classList.toggle("is-hidden", state.data.tasks.length > 0);

  state.data.tasks.forEach((task) => {
    const taskRecord = day.tasks[task.id] || {};
    const card = document.createElement("article");
    card.className = `task-card ${taskRecord.done ? "done" : ""}`;
    card.innerHTML = `
      <input class="task-checkbox" type="checkbox" aria-label="Mark ${escapeHtml(task.name)} complete" ${taskRecord.done ? "checked" : ""}>
      <div class="task-main">
        <div class="task-title-row">
          <div>
            <div class="task-title">${escapeHtml(task.name)}</div>
            <small>${escapeHtml(task.type)} • ${escapeHtml(task.priority)} priority</small>
          </div>
          <div class="task-actions">
            <button class="icon-only subtle" type="button" data-action="edit" title="Edit task" aria-label="Edit task"><i data-lucide="pencil"></i></button>
            <button class="icon-only subtle" type="button" data-action="delete" title="Remove task" aria-label="Remove task"><i data-lucide="trash-2"></i></button>
          </div>
        </div>
        <div class="task-meta">
          ${selectField("Time", "time", timeOptions(task.time), taskRecord.time || task.time || "")}
          ${selectField("Duration", "duration", ["5 min", "10 min", "15 min", "30 min", "45 min", "60 min", "90 min"], taskRecord.duration || task.duration)}
          ${selectField("Type", "type", ["Health", "Work", "Study", "Home", "Mindfulness", "Custom"], taskRecord.type || task.type)}
          ${selectField("Mood", "mood", ["Great", "Good", "Okay", "Hard", "Skipped"], taskRecord.mood || "Good")}
        </div>
      </div>
    `;

    card.querySelector(".task-checkbox").addEventListener("change", (event) => {
      updateTaskRecord(task.id, { done: event.target.checked });
    });

    card.querySelectorAll("select").forEach((select) => {
      select.addEventListener("change", () => updateTaskRecord(task.id, { [select.dataset.field]: select.value }));
    });

    card.querySelector('[data-action="edit"]').addEventListener("click", () => openTaskDialog(task));
    card.querySelector('[data-action="delete"]').addEventListener("click", () => deleteTask(task.id));
    els.taskList.appendChild(card);
  });
}

function selectField(label, field, options, selected) {
  return `
    <label>
      ${label}
      <select data-field="${field}">
        ${options.map((option) => `<option value="${escapeHtml(option)}" ${option === selected ? "selected" : ""}>${escapeHtml(option)}</option>`).join("")}
      </select>
    </label>
  `;
}

function timeOptions(defaultTime) {
  const options = new Set(["", defaultTime].filter(Boolean));
  for (let hour = 4; hour <= 23; hour += 1) {
    ["00", "30"].forEach((minute) => options.add(`${String(hour).padStart(2, "0")}:${minute}`));
  }
  return Array.from(options);
}

function renderSummary() {
  const summary = getDaySummary(state.selectedDate);
  els.completedCount.textContent = summary.completed;
  els.totalCount.textContent = summary.total;
  els.completionPercent.textContent = `${summary.percent}%`;
}

function renderNotes() {
  els.dailyNotes.value = getDayRecord(state.selectedDate).notes || "";
}

function saveNotes() {
  const day = getDayRecord(state.selectedDate);
  day.notes = els.dailyNotes.value;
  saveData();
  renderCalendar();
}

function updateTaskRecord(taskId, patch) {
  const day = getDayRecord(state.selectedDate);
  day.tasks[taskId] = { ...(day.tasks[taskId] || {}), ...patch };
  saveData();
  renderTasks();
  renderSummary();
  renderCalendar();
  ensureIcons();
}

function openTaskDialog(task = null) {
  els.taskDialogTitle.textContent = task ? "Edit task" : "Add task";
  els.taskId.value = task?.id || "";
  els.taskName.value = task?.name || "";
  els.taskTime.value = task?.time || "";
  els.taskDuration.value = task?.duration || "15 min";
  els.taskType.value = task?.type || "Health";
  els.taskPriority.value = task?.priority || "Medium";
  openDialog(els.taskDialog);
}

function saveTask(event) {
  event.preventDefault();
  const task = {
    id: els.taskId.value || createId(),
    name: els.taskName.value.trim(),
    time: els.taskTime.value,
    duration: els.taskDuration.value,
    type: els.taskType.value,
    priority: els.taskPriority.value
  };

  if (!task.name) return;

  const existingIndex = state.data.tasks.findIndex((item) => item.id === task.id);
  if (existingIndex >= 0) {
    state.data.tasks[existingIndex] = task;
  } else {
    state.data.tasks.push(task);
  }

  saveData();
  els.taskDialog.close();
  renderAll();
}

function deleteTask(taskId) {
  const task = state.data.tasks.find((item) => item.id === taskId);
  if (!task) return;

  const confirmed = confirm(`Remove "${task.name}" from your daily task list? Past records will stay in the export as archived IDs.`);
  if (!confirmed) return;

  state.data.tasks = state.data.tasks.filter((item) => item.id !== taskId);
  saveData();
  renderAll();
}

function openCalendar() {
  state.calendarDate = parseDateKey(state.selectedDate);
  setActiveSegment("[data-calendar-view]", state.calendarView);
  setActiveSegment("[data-color-mode]", state.colorMode);
  renderCalendar();
  openDialog(els.calendarDialog);
}

function renderCalendar() {
  if (!els.calendarGrid) return;
  els.calendarGrid.className = `calendar-grid ${state.calendarView}`;
  els.calendarGrid.innerHTML = "";

  const dates = getCalendarDates();
  els.calendarTitle.textContent = getCalendarTitle();
  els.calendarRange.textContent = state.colorMode === "status"
    ? "Green means all daily goals are achieved."
    : "Darker green means more goals completed.";

  dates.forEach(({ date, label, muted = false }) => {
    const dateKey = toDateKey(date);
    const summary = state.calendarView === "year" ? getMonthSummary(date) : getDaySummary(dateKey);
    const cell = document.createElement("button");
    cell.type = "button";
    cell.className = `calendar-cell ${muted ? "muted" : ""} ${calendarClass(summary)}`;
    cell.style.background = gradientBackground(summary);
    cell.innerHTML = `
      <strong>${escapeHtml(label)}</strong>
      <small>${escapeHtml(summary.label || `${summary.completed}/${summary.total} goals`)} • ${summary.percent}%</small>
      <span class="bar" aria-hidden="true"><span style="width:${summary.percent}%"></span></span>
    `;
    cell.addEventListener("click", () => {
      setSelectedDate(dateKey);
      state.calendarDate = parseDateKey(dateKey);
      renderCalendar();
    });
    els.calendarGrid.appendChild(cell);
  });
}

function getCalendarDates() {
  const base = new Date(state.calendarDate);

  if (state.calendarView === "day") {
    return [{ date: base, label: formatLongDate(base) }];
  }

  if (state.calendarView === "week") {
    const start = startOfWeek(base);
    return Array.from({ length: 7 }, (_, index) => {
      const date = addDays(start, index);
      return { date, label: date.toLocaleDateString(undefined, { weekday: "short", day: "numeric" }) };
    });
  }

  if (state.calendarView === "year") {
    return Array.from({ length: 12 }, (_, month) => {
      const date = new Date(base.getFullYear(), month, 1);
      return { date, label: date.toLocaleDateString(undefined, { month: "long" }) };
    });
  }

  const first = new Date(base.getFullYear(), base.getMonth(), 1);
  const gridStart = startOfWeek(first);
  return Array.from({ length: 42 }, (_, index) => {
    const date = addDays(gridStart, index);
    return {
      date,
      label: String(date.getDate()),
      muted: date.getMonth() !== base.getMonth()
    };
  });
}

function getCalendarTitle() {
  const date = state.calendarDate;
  if (state.calendarView === "day") return formatLongDate(date);
  if (state.calendarView === "week") {
    const start = startOfWeek(date);
    const end = addDays(start, 6);
    return `${shortDate(start)} - ${shortDate(end)}`;
  }
  if (state.calendarView === "year") return String(date.getFullYear());
  return date.toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

function moveCalendar(direction) {
  const date = new Date(state.calendarDate);
  if (state.calendarView === "day") date.setDate(date.getDate() + direction);
  if (state.calendarView === "week") date.setDate(date.getDate() + direction * 7);
  if (state.calendarView === "month") date.setMonth(date.getMonth() + direction);
  if (state.calendarView === "year") date.setFullYear(date.getFullYear() + direction);
  state.calendarDate = date;
  renderCalendar();
}

function calendarClass(summary) {
  if (summary.total === 0) return "missed";
  if (summary.completed === summary.total) return "complete";
  if (summary.completed > 0) return "partial";
  return "missed";
}

function gradientBackground(summary) {
  if (state.colorMode !== "gradient") return "";
  const alpha = Math.max(0.08, summary.percent / 100);
  return `linear-gradient(135deg, rgba(46, 139, 87, ${alpha}), rgba(255,255,255,0.92))`;
}

function setActiveSegment(selector, value) {
  document.querySelectorAll(selector).forEach((button) => {
    const active = button.dataset.calendarView === value || button.dataset.colorMode === value;
    button.classList.toggle("active", active);
  });
}

function setSelectedDate(dateKey) {
  if (!dateKey) return;
  state.selectedDate = dateKey;
  els.activeDate.value = dateKey;
  renderAll();
}

function moveSelectedDate(days) {
  setSelectedDate(toDateKey(addDays(parseDateKey(state.selectedDate), days)));
}

function getDayRecord(dateKey) {
  if (!state.data.days[dateKey]) {
    state.data.days[dateKey] = { notes: "", tasks: {} };
  }
  return state.data.days[dateKey];
}

function getDaySummary(dateKey) {
  const day = state.data.days[dateKey] || { tasks: {} };
  const total = state.data.tasks.length;
  const completed = state.data.tasks.filter((task) => day.tasks[task.id]?.done).length;
  const percent = total ? Math.round((completed / total) * 100) : 0;
  return { completed, total, percent };
}

function getMonthSummary(date) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  let completed = 0;
  let total = 0;
  let completeDays = 0;
  let trackedDays = 0;

  for (let day = 1; day <= daysInMonth; day += 1) {
    const dateKey = toDateKey(new Date(year, month, day));
    if (!state.data.days[dateKey]) continue;
    const summary = getDaySummary(dateKey);
    completed += summary.completed;
    total += summary.total;
    trackedDays += 1;
    if (summary.total > 0 && summary.completed === summary.total) completeDays += 1;
  }

  const percent = total ? Math.round((completed / total) * 100) : 0;
  return {
    completed,
    total,
    percent,
    label: trackedDays ? `${completeDays}/${trackedDays} complete days` : "No tracked days"
  };
}

function exportExcel() {
  const rows = buildExportRows();
  const xml = buildWorkbookXml(rows);
  const blob = new Blob([xml], { type: "application/vnd.ms-excel;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `daily-routine-${toDateKey(new Date())}.xls`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(link.href);
}

function buildExportRows() {
  const trackedDates = new Set(Object.keys(state.data.days));
  trackedDates.add(state.selectedDate);
  const sortedDates = Array.from(trackedDates).sort();

  return sortedDates.flatMap((dateKey) => {
    const day = getDayRecord(dateKey);
    const summary = getDaySummary(dateKey);
    if (state.data.tasks.length === 0) {
      return [{
        date: dateKey,
        task: "No tasks configured",
        type: "",
        priority: "",
        time: "",
        duration: "",
        mood: "",
        status: "No goals",
        completed: 0,
        total: 0,
        percent: 0,
        notes: day.notes || ""
      }];
    }

    return state.data.tasks.map((task) => {
      const record = day.tasks[task.id] || {};
      return {
        date: dateKey,
        task: task.name,
        type: record.type || task.type,
        priority: task.priority,
        time: record.time || task.time || "",
        duration: record.duration || task.duration,
        mood: record.mood || "",
        status: record.done ? "Completed" : "Not completed",
        completed: summary.completed,
        total: summary.total,
        percent: summary.percent,
        notes: day.notes || ""
      };
    });
  });
}

function buildWorkbookXml(rows) {
  const headers = ["Date", "Task", "Type", "Priority", "Time", "Duration", "Mood", "Status", "Completed Goals", "Total Goals", "Day Completion %", "Daily Notes"];
  const bodyRows = rows.map((row) => {
    const style = row.status === "Completed" ? "sComplete" : row.percent > 0 ? "sPartial" : "sMissed";
    return `
      <Row ss:AutoFitHeight="1">
        ${cell(row.date, style)}
        ${cell(row.task, style)}
        ${cell(row.type, style)}
        ${cell(row.priority, style)}
        ${cell(row.time, style)}
        ${cell(row.duration, style)}
        ${cell(row.mood, style)}
        ${cell(row.status, style)}
        ${cell(row.completed, style, "Number")}
        ${cell(row.total, style, "Number")}
        ${cell(row.percent / 100, style, "Number", "Percent")}
        ${cell(row.notes, style)}
      </Row>
    `;
  }).join("");

  return `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Styles>
    <Style ss:ID="Default" ss:Name="Normal"><Alignment ss:Vertical="Center"/><Font ss:FontName="Calibri" ss:Size="11"/></Style>
    <Style ss:ID="sHeader"><Font ss:Bold="1" ss:Color="#FFFFFF"/><Interior ss:Color="#176B87" ss:Pattern="Solid"/><Borders>${borderXml()}</Borders></Style>
    <Style ss:ID="sComplete"><Interior ss:Color="#E9F7EE" ss:Pattern="Solid"/><Borders>${borderXml()}</Borders></Style>
    <Style ss:ID="sPartial"><Interior ss:Color="#FFF6DF" ss:Pattern="Solid"/><Borders>${borderXml()}</Borders></Style>
    <Style ss:ID="sMissed"><Interior ss:Color="#FDECEA" ss:Pattern="Solid"/><Borders>${borderXml()}</Borders></Style>
    <Style ss:ID="Percent"><NumberFormat ss:Format="0%"/></Style>
  </Styles>
  <Worksheet ss:Name="Routine Log">
    <Table>
      <Column ss:Width="86"/><Column ss:Width="190"/><Column ss:Width="90"/><Column ss:Width="80"/>
      <Column ss:Width="70"/><Column ss:Width="85"/><Column ss:Width="80"/><Column ss:Width="105"/>
      <Column ss:Width="105"/><Column ss:Width="90"/><Column ss:Width="110"/><Column ss:Width="260"/>
      <Row ss:AutoFitHeight="1">${headers.map((header) => cell(header, "sHeader")).join("")}</Row>
      ${bodyRows}
    </Table>
    <ConditionalFormatting xmlns="urn:schemas-microsoft-com:office:excel">
      <Range>R2C11:R${Math.max(rows.length + 1, 2)}C11</Range>
      <Condition>
        <Value1>0.999</Value1>
        <Format Style="background:#E9F7EE"/>
      </Condition>
    </ConditionalFormatting>
    <WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel">
      <FreezePanes/><FrozenNoSplit/><SplitHorizontal>1</SplitHorizontal><TopRowBottomPane>1</TopRowBottomPane>
      <Panes><Pane><Number>3</Number><ActiveRow>1</ActiveRow></Pane></Panes>
    </WorksheetOptions>
  </Worksheet>
</Workbook>`;
}

function cell(value, styleId, type = "String", dataStyle = "") {
  const style = dataStyle || styleId;
  return `<Cell ss:StyleID="${style}"><Data ss:Type="${type}">${escapeXml(value)}</Data></Cell>`;
}

function borderXml() {
  return `<Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#DED7CC"/>
  <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#DED7CC"/>
  <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#DED7CC"/>
  <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#DED7CC"/>`;
}

function openDialog(dialog) {
  if (typeof dialog.showModal === "function") {
    dialog.showModal();
  } else {
    dialog.setAttribute("open", "");
  }
  ensureIcons();
}

function toDateKey(date) {
  const normalized = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const year = normalized.getFullYear();
  const month = String(normalized.getMonth() + 1).padStart(2, "0");
  const day = String(normalized.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseDateKey(dateKey) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function startOfWeek(date) {
  const next = new Date(date);
  const day = next.getDay();
  next.setDate(next.getDate() - day);
  return next;
}

function formatLongDate(date) {
  return date.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}

function shortDate(date) {
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeXml(value) {
  return escapeHtml(value).replaceAll("\n", "&#10;");
}

function createId() {
  if (window.crypto && typeof window.crypto.randomUUID === "function") {
    return window.crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function ensureIcons() {
  if (window.lucide) {
    window.lucide.createIcons();
  }
}
