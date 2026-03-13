// ==========================================
// FocusForge — Main Application Logic
// ==========================================

const APP_DATA_KEY = 'focusforge_data';

// --- State ---
let state = {
  mode: 'work', // work, shortBreak, longBreak
  timeLeft: 25 * 60,
  isRunning: false,
  sessionsCompleted: 0, // Pomodoros completed today
  totalMinutesFocused: 0,
  tasks: [],
  intervalId: null
};

// --- Config Configuration ---
const MODES = {
  work: { time: 25 * 60, color: '#f85b5b', label: "Focus Session" },
  shortBreak: { time: 5 * 60, color: '#00d287', label: "Short Break" },
  longBreak: { time: 15 * 60, color: '#00a8e8', label: "Long Break" }
};

// --- DOM Elements ---
const el = {
  minutes: document.getElementById('timer-minutes'),
  seconds: document.getElementById('timer-seconds'),
  ringProgress: document.getElementById('ring-progress'),
  btnStart: document.getElementById('btn-start'),
  btnReset: document.getElementById('btn-reset'),
  modeTabs: document.querySelectorAll('.mode-tab'),
  sessionDots: document.getElementById('session-dots'),
  
  taskInput: document.getElementById('task-input'),
  btnAddTask: document.getElementById('btn-add-task'),
  taskList: document.getElementById('task-list'),
  
  statSessions: document.getElementById('stat-sessions'),
  statMinutes: document.getElementById('stat-minutes'),
  statTasks: document.getElementById('stat-tasks'),
  btnCopyStats: document.getElementById('btn-copy-stats'),
  
  // Titlebar controls
  btnMinimize: document.getElementById('btn-minimize'),
  btnHide: document.getElementById('btn-hide'),
  btnClose: document.getElementById('btn-close')
};

// --- Initialize App ---
Neutralino.init();

Neutralino.events.on("ready", async () => {
  // 1. Native API: Register Window Draggable Region
  try {
    await Neutralino.window.setDraggableRegion("titlebar-drag");
  } catch (e) {
    console.log("Draggable region not supported on this platform/mode.");
  }

  // 2. Native API: Setup System Tray
  setupTray();
  
  // 3. Native API: Load Persistent Data
  await loadState();
  
  // Setup UI
  setupEventListeners();
  updateUI();
  updateTasksUI();
  updateStatsUI();
  renderSessionDots();
});

// Hide app on close to keep it in tray
Neutralino.events.on("windowClose", async () => {
  await Neutralino.window.hide();
});

// Tray interaction
Neutralino.events.on("trayMenuItemClicked", async (e) => {
  switch (e.detail.id) {
    case "show":
      await Neutralino.window.show();
      break;
    case "start_work":
      switchMode('work');
      toggleTimer();
      break;
    case "take_break":
      switchMode('shortBreak');
      toggleTimer();
      break;
    case "quit":
      // Clean exit
      await Neutralino.app.exit();
      break;
  }
});

// --- Core Timer Logic ---

function toggleTimer() {
  if (state.isRunning) {
    clearInterval(state.intervalId);
    state.intervalId = null;
    state.isRunning = false;
    el.btnStart.innerHTML = "▶ Start";
  } else {
    state.isRunning = true;
    el.btnStart.innerHTML = "⏸ Pause";
    
    // Start interval
    state.intervalId = setInterval(() => {
      state.timeLeft--;
      if (state.timeLeft < 0) {
        completeSession();
      } else {
        updateTimerDisplay();
      }
    }, 1000);
  }
}

function resetTimer() {
  if (state.isRunning) toggleTimer();
  state.timeLeft = MODES[state.mode].time;
  updateTimerDisplay();
}

function switchMode(newMode) {
  if (state.isRunning) toggleTimer();
  state.mode = newMode;
  state.timeLeft = MODES[state.mode].time;
  
  document.body.setAttribute('data-mode', newMode);
  el.modeTabs.forEach(tab => {
    tab.classList.toggle('active', tab.dataset.mode === newMode);
  });
  
  updateTimerDisplay();
}

async function completeSession() {
  if (state.isRunning) toggleTimer();
  
  let notificationTitle = "Session Complete";
  let notificationBody = "";

  if (state.mode === 'work') {
    state.sessionsCompleted++;
    state.totalMinutesFocused += Math.floor(MODES.work.time / 60);
    
    // Every 4 sessions, auto-suggest long break
    if (state.sessionsCompleted > 0 && state.sessionsCompleted % 4 === 0) {
      switchMode('longBreak');
      notificationBody = "Great focus! Time for a long break.";
    } else {
      switchMode('shortBreak');
      notificationBody = "Good job! Take a quick break.";
    }
  } else {
    switchMode('work');
    notificationBody = "Break is over. Ready to focus?";
  }

  // 4. Native API: OS Notification
  try {
    await Neutralino.os.showNotification(notificationTitle, notificationBody, 'INFO');
  } catch(e) { console.log("Notifications disabled"); }
  
  renderSessionDots();
  updateStatsUI();
  saveState();
  
  // Bring window to front
  await Neutralino.window.show();
}

// --- UI Updates ---

function updateTimerDisplay() {
  const m = Math.floor(state.timeLeft / 60);
  const s = state.timeLeft % 60;
  
  el.minutes.textContent = m.toString().padStart(2, '0');
  el.seconds.textContent = s.toString().padStart(2, '0');
  
  const total = MODES[state.mode].time;
  const progress = ((total - state.timeLeft) / total);
  
  // 565.48 is the dasharray circumference of our circle
  el.ringProgress.style.strokeDashoffset = 565.48 - (progress * 565.48);

  // Set window title dynamically
  document.title = `${m}:${s.toString().padStart(2, '0')} - FocusForge`;
}

function renderSessionDots() {
  el.sessionDots.innerHTML = '';
  // Show dots in groups of 4
  const currentCycle = state.sessionsCompleted % 4;
  for (let i = 0; i < 4; i++) {
    const dot = document.createElement('div');
    dot.className = `dot ${i < currentCycle ? 'filled' : ''}`;
    el.sessionDots.appendChild(dot);
  }
}

function updateStatsUI() {
  el.statSessions.textContent = state.sessionsCompleted;
  el.statMinutes.textContent = state.totalMinutesFocused;
  const completedTasks = state.tasks.filter(t => t.completed).length;
  el.statTasks.textContent = completedTasks;
}

// --- Task Management ---

function addTask() {
  const text = el.taskInput.value.trim();
  if (!text) return;
  
  state.tasks.push({
    id: Date.now().toString(),
    text: text,
    completed: false
  });
  
  el.taskInput.value = '';
  updateTasksUI();
  saveState();
}

function toggleTask(id) {
  const task = state.tasks.find(t => t.id === id);
  if (task) {
    task.completed = !task.completed;
    updateTasksUI();
    updateStatsUI();
    saveState();
  }
}

function deleteTask(id) {
  state.tasks = state.tasks.filter(t => t.id !== id);
  updateTasksUI();
  updateStatsUI();
  saveState();
}

function updateTasksUI() {
  el.taskList.innerHTML = '';
  state.tasks.forEach(task => {
    const li = document.createElement('li');
    li.className = `task-item ${task.completed ? 'completed' : ''}`;
    
    li.innerHTML = `
      <div class="task-checkbox ${task.completed ? 'checked' : ''}" onclick="toggleTask('${task.id}')"></div>
      <span class="task-text" onclick="toggleTask('${task.id}')">${escapeHTML(task.text)}</span>
      <span class="btn-delete-task" onclick="deleteTask('${task.id}')">✕</span>
    `;
    
    el.taskList.appendChild(li);
  });
}

// --- Persistence & Integrations ---

async function loadState() {
  try {
    // 5. Native API: Read from storage
    const dataStr = await Neutralino.storage.getData(APP_DATA_KEY);
    if (dataStr) {
      const data = JSON.parse(dataStr);
      // Only load today's data (reset daily)
      const today = new Date().toDateString();
      if (data.date === today) {
        state.sessionsCompleted = data.sessionsCompleted || 0;
        state.totalMinutesFocused = data.totalMinutesFocused || 0;
        state.tasks = data.tasks || [];
      }
    }
  } catch (err) {
    if (err.code !== 'NE_ST_NOSTKEX') {
      console.error("Storage error:", err);
    }
  }
}

async function saveState() {
  const today = new Date().toDateString();
  const data = {
    date: today,
    sessionsCompleted: state.sessionsCompleted,
    totalMinutesFocused: state.totalMinutesFocused,
    tasks: state.tasks
  };
  
  try {
    // 6. Native API: Write to storage
    await Neutralino.storage.setData(APP_DATA_KEY, JSON.stringify(data));
  } catch (err) {
    console.error("Failed to save state:", err);
  }
}

async function setupTray() {
  let tray = {
    icon: '/resources/icons/appIcon.png',
    menuItems: [
      { id: "show", text: "Show FocusForge" },
      { text: "-" },
      { id: "start_work", text: "Start Focus Session" },
      { id: "take_break", text: "Take a Short Break" },
      { text: "-" },
      { id: "quit", text: "Quit" }
    ]
  };
  
  if(NL_OS === 'Darwin') {
      tray.menuItems.unshift({ id: "mac_title", text: "FocusForge", isDisabled: true }, { text: "-" });
  }

  // 7. Native API: Set Tray
  await Neutralino.os.setTray(tray);
}

// --- Event Listeners Setup ---

function setupEventListeners() {
  el.btnStart.addEventListener('click', toggleTimer);
  el.btnReset.addEventListener('click', resetTimer);
  
  el.modeTabs.forEach(tab => {
    tab.addEventListener('click', () => switchMode(tab.dataset.mode));
  });
  
  el.btnAddTask.addEventListener('click', addTask);
  el.taskInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addTask();
  });
  
  el.btnCopyStats.addEventListener('click', async () => {
    const text = `FocusForge Stats Today:\n🔥 ${state.sessionsCompleted} sessions\n⏱ ${state.totalMinutesFocused} mins focused\n✅ ${state.tasks.filter(t=>t.completed).length} tasks done!`;
    try {
        // 8. Native API: Write to Clipboard
        await Neutralino.clipboard.writeText(text);
        
        const oldText = el.btnCopyStats.innerHTML;
        el.btnCopyStats.innerHTML = "✓";
        setTimeout(() => el.btnCopyStats.innerHTML = oldText, 2000);
    } catch(err) {
        console.error("Clipboard failed");
    }
  });

  // Window Controls
  el.btnMinimize.addEventListener('click', async () => await Neutralino.window.minimize());
  el.btnHide.addEventListener('click', async () => await Neutralino.window.hide());
  el.btnClose.addEventListener('click', async () => await Neutralino.app.exit());
}

// Utility
function updateUI() {
  updateTimerDisplay();
}

function escapeHTML(str) {
  return str.replace(/[&<>'"]/g, tag => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  }[tag]));
}
