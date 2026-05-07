const STORAGE_KEY = "dailyRoutineChecklist.v1";

const DEFAULT_DROPDOWNS = [
  { id: "time", label: "Time", options: ["06:00", "06:30", "07:00", "07:30", "08:00", "09:00", "12:00", "18:00", "21:00"] },
  { id: "duration", label: "Duration", options: ["5 min", "10 min", "15 min", "30 min", "45 min", "60 min", "90 min"] },
  { id: "type", label: "Type", options: ["Health", "Work", "Study", "Home", "Mindfulness", "Custom"] },
  { id: "priority", label: "Priority", options: ["Low", "Medium", "High"] },
  { id: "mood", label: "Mood", options: ["Great", "Good", "Okay", "Hard", "Skipped"] }
];

const DEFAULT_TASKS = [
  {
    id: createId(),
    name: "Wake up on time",
    dropdowns: [
      { definitionId: "time", defaultValue: "06:30" },
      { definitionId: "priority", defaultValue: "High" }
    ]
  },
  {
    id: createId(),
    name: "Exercise or walk",
    dropdowns: [
      { definitionId: "time", defaultValue: "07:00" },
      { definitionId: "duration", defaultValue: "30 min" },
      { definitionId: "type", defaultValue: "Health" }
    ]
  },
  {
    id: createId(),
    name: "Plan the day",
    dropdowns: [
      { definitionId: "duration", defaultValue: "10 min" },
      { definitionId: "type", defaultValue: "Work" }
    ]
  }
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
  lock();
  renderAll();
});

function cacheElements() {
  [
    "lockScreen", "appShell", "pinForm", "pinInput", "pinError", "todayHeading", "calendarButton",
    "exportButton", "settingsButton", "lockButton", "previousDay", "nextDay", "todayButton",
    "activeDate", "completedCount", "totalCount", "completionPercent", "addTaskButton", "taskList",
    "emptyTasks", "dailyNotes", "taskDialog", "taskForm", "taskDialogTitle", "taskId", "taskName",
    "taskDropdownChoices", "manageDropdownsFromTask", "calendarDialog", "calendarRange",
    "calendarGrid", "calendarTitle", "calendarPrevious", "calendarNext", "settingsDialog",
    "pinChangeForm", "currentPin", "newPin", "pinChangeMessage", "manageDropdownsButton",
    "dropdownDialog", "dropdownList", "dropdownForm", "dropdownId", "dropdownLabel",
    "dropdownOptions", "newDropdownButton"
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
  els.manageDropdownsButton.addEventListener("click", openDropdownManager);
  els.manageDropdownsFromTask.addEventListener("click", openDropdownManager);
  els.dropdownForm.addEventListener("submit", saveDropdownDefinition);
  els.newDropdownButton.addEventListener("click", resetDropdownForm);

  document.querySelectorAll("[data-close-dialog]").forEach((button) => {
    button.addEventListener("click", () => document.getElementById(button.dataset.closeDialog).close());
  });

  document.querySelectorAll("[data-calendar-view]").forEach((button) => {
