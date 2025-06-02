const { ipcRenderer } = require('electron');

const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const selectedTaskNameInput = document.getElementById('selectedTaskName');
const currentTaskStatus = document.getElementById('currentTaskStatus');
const activityStateDiv = document.getElementById('activityState');
const activityLogDiv = document.getElementById('browserActivityLog');
const timelineCanvas = document.getElementById('timelineCanvas');
const taskRadioList = document.getElementById('taskRadioList');

const userId = 'Ram';
const date = new Date().toISOString().split('T')[0];

async function fetchTasksFromAPI(userId, date) {
  try {
    const response = await fetch(`http://localhost:8000/api/user/${userId}/`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();
    return data.tasks || [];
  } catch (err) {
    console.error('Failed to fetch tasks:', err);
    return [];
  }
}
async function postToTimelineAPI(task) {
    const response = await fetch(`http://localhost:8000/api/user/${userId}/`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const userData = await response.json();
    const existingTask = userData.tasks.find(t => t.name === task.name);

if (existingTask) {
  // Add the new duration (convert ms to seconds)
  existingTask.duration += Math.round(task.duration / 1000);
} else {
  // Optionally add new task if not found
  userData.tasks.push({
    name: task.name,
    duration: Math.round(task.duration / 1000),
  });
}

  try {
    const response = await fetch('http://localhost:8000/api/task/update/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({"name":task.name,"duration":task.duration,"date":userData.date,"userId":userData.userId}),
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  } catch (err) {
    console.error('Failed to send task to backend:', err);
  }
}

class TaskManager {
  constructor() {
    this.tasks = [];
    this.currentTask = null;
    this.taskStartTime = null;
  }

  startTask(index) {
    if (this.currentTask !== null) this.stopTask(this.currentTask);

    this.currentTask = index;
    this.taskStartTime = Date.now();
    const task = this.tasks[index];
    task.start = Date.now();
    task.end = null;
    task.duration = 0;

    currentTaskStatus.textContent = `Running: ${task.name}`;
    startBtn.disabled = true;
    stopBtn.disabled = false;
  }

  stopTask() {
    if (this.currentTask === null) return;

    const now = Date.now();
    const task = this.tasks[this.currentTask];
    task.duration += now - this.taskStartTime;
    task.end = now;

   // postTaskToAPI(task);
  postToTimelineAPI(task);       // Save to timeline DB

    this.currentTask = null;
    this.taskStartTime = null;

    currentTaskStatus.textContent = 'No active task';
    startBtn.disabled = false;
    stopBtn.disabled = true;
    this.renderTaskRadioList();
  }


  
  loadTasks(tasksFromAPI) {
    this.tasks = tasksFromAPI.map(t => ({
      name: t.name,
      start: new Date(t.start_time).getTime(),
      end: t.end_time ? new Date(t.end_time).getTime() : null,
      duration: t.duration_seconds * 1000
    }));
    this.renderTaskRadioList();
  }

  renderTaskRadioList() {
    taskRadioList.innerHTML = '';
    this.tasks.forEach((task, index) => {
      const li = document.createElement('li');
      li.classList.add('task-radio');

      const radio = document.createElement('input');
      radio.type = 'radio';
      radio.name = 'task';
      radio.value = index;
      radio.id = `task_${index}`;

      radio.addEventListener('change', () => {
        selectedTaskNameInput.value = task.name;
        selectedTaskIndex = index;
      });

      const label = document.createElement('label');
      label.htmlFor = `task_${index}`;
      label.textContent = task.name;

      li.appendChild(radio);
      li.appendChild(label);
      taskRadioList.appendChild(li);
    });
  }

  updateCurrentTaskDuration() {
    if (this.currentTask === null) return;
    const now = Date.now();
    const task = this.tasks[this.currentTask];
    task.duration += now - this.taskStartTime;
    this.taskStartTime = now;
  }
}

let selectedTaskIndex = null;
const taskManager = new TaskManager();

startBtn.onclick = () => {
  if (selectedTaskIndex === null) {
    alert('Please select a task to start.');
    return;
  }
  taskManager.startTask(selectedTaskIndex);
};

stopBtn.onclick = () => {
  taskManager.stopTask();
};

async function postTaskToAPI(task) {
  try {
    const response = await fetch('http://localhost:8000/api/tasks/create/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: userId,
        name: task.name,
        start_time: new Date(task.start).toISOString(),
        duration_seconds: task.duration / 1000
      }),
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  } catch (err) {
    console.error('Failed to send task to backend:', err);
  }
}

async function init() {
  const tasksFromDB = await fetchTasksFromAPI(userId, date);
  taskManager.loadTasks(tasksFromDB);
}
init();

// Browser + Laptop activity simulation

let laptopStatus = 'Active';
function simulateLaptopActivity() {
  setInterval(() => {
    laptopStatus = laptopStatus === 'Active' ? 'Inactive' : 'Active';
    activityStateDiv.textContent = `Status: ${laptopStatus}`;
  }, 60000);
}
simulateLaptopActivity();

const browserActivityData = [];

ipcRenderer.on('visited-url', (event, message) => {
  try {
    const data = JSON.parse(message);
    browserActivityData.push({
      url: data.url,
      title: data.title,
      timestamp: data.time
    });
  } catch (e) {
    console.error('Failed to parse visited-url message:', e);
  }
});

ipcRenderer.on('browser-activity', (event, message) => {
  const msgObj = JSON.parse(message);
  const logEntry = `[${new Date().toLocaleTimeString()}] URL: ${msgObj.url}, Title: ${msgObj.title}\n`;
  activityLogDiv.textContent += logEntry;
  activityLogDiv.scrollTop = activityLogDiv.scrollHeight;
  browserActivityData.push({
    url: msgObj.url,
    title: msgObj.title,
    timestamp: Date.now()
  });
});

function drawTimeline() {
  //const ctx = timelineCanvas.getContext('2d');
  //tx.clearRect(0, 0, timelineCanvas.width, timelineCanvas.height);

  const now = Date.now();
  let x = 10;
  //ctx.font = '12px Arial';

  taskManager.tasks.forEach(task => {
    const durationSeconds = task.duration / 1000;
    const width = durationSeconds * 5;
    ctx.fillStyle = '#4caf50';
    ctx.fillRect(x, 20, width, 20);
    ctx.fillStyle = 'white';
    ctx.fillText(task.name, x + 5, 35);
    x += width + 10;
  });

  ctx.fillStyle = laptopStatus === 'Active' ? '#2196f3' : '#f44336';
  ctx.fillRect(10, 60, 200, 20);
  ctx.fillStyle = 'black';
  ctx.fillText(`Laptop: ${laptopStatus}`, 15, 75);

  const timeWindow = 60 * 1000;
  const browserXStart = 10;
  const browserY = 100;
  const scalePxPerMs = 400 / timeWindow;

  const recentBrowserActivity = browserActivityData.filter(
    a => now - a.timestamp <= timeWindow
  );

  recentBrowserActivity.forEach(act => {
    const age = now - act.timestamp;
    const blockX = browserXStart + 400 - age * scalePxPerMs;
    const blockWidth = 10;

    ctx.fillStyle = '#ff9800';
    ctx.fillRect(blockX, browserY, blockWidth, 20);

    const text = act.title ? act.title[0].toUpperCase() : 'B';
    ctx.fillStyle = 'black';
    ctx.fillText(text, blockX + 2, browserY + 15);
  });

  ctx.fillStyle = 'black';
  ctx.fillText('Browser Activity (last 60s)', browserXStart, browserY - 5);
}

setInterval(() => {
  if (taskManager.currentTask !== null) {
    taskManager.updateCurrentTaskDuration();
  }
  //drawTimeline();
}, 1000);
document.getElementById('exportFullPageImageBtn').onclick = () => {
  html2canvas(document.body).then(canvas => {
    const imageData = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = imageData;
    a.download = `fullpage_${new Date().toISOString()}.png`;
    a.click();
  });
};
function formatTime(ms) {
  return new Date(ms).toLocaleTimeString();
}

function updateTimelineTable(tasks, groupedBrowserActivity) {
  const tbody = document.querySelector('#timelineTable tbody');
  tbody.innerHTML = ''; // clear old entries

  // Add task entries
  tasks.forEach(task => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>Task</td>
      <td>${task.name}</td>
      <td>${formatTime(task.start)}</td>
      <td>${task.end ? formatTime(task.end) : '-'}</td>
      <td>${Math.round(task.duration / 1000)}</td>
    `;
    tbody.appendChild(row);
  });

  // Add grouped browser activity
  groupedBrowserActivity.forEach(entry => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>Browser</td>
      <td>${entry.domain}</td>
      <td>${formatTime(entry.start)}</td>
      <td>${formatTime(entry.end)}</td>
      <td>${Math.round((entry.end - entry.start) / 1000)}</td>
    `;
    tbody.appendChild(row);
  });
}
function groupBrowserActivity(events) {
  const grouped = [];
  if (events.length === 0) return grouped;

  events.sort((a, b) => a.timestamp - b.timestamp);

  let current = {
    domain: new URL(events[0].url).hostname,
    start: events[0].timestamp,
    end: events[0].timestamp
  };

  for (let i = 1; i < events.length; i++) {
    const domain = new URL(events[i].url).hostname;
    const timeDiff = events[i].timestamp - current.end;

    if (domain === current.domain && timeDiff <= 30000) {
      current.end = events[i].timestamp;
    } else {
      grouped.push({ ...current });
      current = { domain, start: events[i].timestamp, end: events[i].timestamp };
    }
  }
  grouped.push(current);
  return grouped;
}

setInterval(() => {
  if (taskManager.currentTask !== null) {
    taskManager.updateCurrentTaskDuration();
  }

 // drawTimeline();

  const groupedBrowser = groupBrowserActivity(browserActivityData);
  updateTimelineTable(taskManager.tasks, groupedBrowser);
}, 1000);


document.getElementById('exportFullPagePdfBtn').onclick = () => {
  html2canvas(document.body).then(canvas => {
    const imgData = canvas.toDataURL('image/png');

    const pdf = new jspdf.jsPDF({
      orientation: 'portrait',
      unit: 'px',
      format: [canvas.width, canvas.height]
    });

    pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
    pdf.save(`fullpage_${new Date().toISOString()}.pdf`);
  });
};

function renderBrowserActivityTable() {
  const tbody = document.getElementById('browserActivityTableBody');
  tbody.innerHTML = ''; // Clear old rows

  // Show only recent activities (last 60s or as you want)
  const now = Date.now();
  const timeWindow = 60 * 1000; // 60 seconds
  const recentActivities = browserActivityData.filter(act => now - act.timestamp <= timeWindow);

  recentActivities.forEach(act => {
    const row = document.createElement('tr');

    const timeCell = document.createElement('td');
    timeCell.textContent = new Date(act.timestamp).toLocaleTimeString();

    const titleCell = document.createElement('td');
    titleCell.textContent = act.title || '—';

    const urlCell = document.createElement('td');
    urlCell.textContent = act.url || '—';

    row.appendChild(timeCell);
    row.appendChild(titleCell);
    row.appendChild(urlCell);

    tbody.appendChild(row);
  });
}






// Store periods of active/inactive with start and end times
const activePeriods = [];
const inactivePeriods = [];

let lastStatus = null;
let statusPeriodStart = Date.now();

// Function to update periods when status changes
function updateLaptopStatus(newStatus) {
  const now = Date.now();

  if (lastStatus === null) {
    // First time initialization
    statusPeriodStart = now;
    lastStatus = newStatus;
  } else if (lastStatus !== newStatus) {
    // Close previous period
    const period = {
      start: statusPeriodStart,
      end: now,
      duration: now - statusPeriodStart,
    };

    if (lastStatus === 'Active') {
      activePeriods.push(period);
    } else {
      inactivePeriods.push(period);
    }

    // Start new period
    statusPeriodStart = now;
    lastStatus = newStatus;
  }
  // else same status, keep ongoing period open
}

// Override your simulateLaptopActivity to update periods:
function simulateLaptopActivity() {
  setInterval(() => {
    const newStatus = laptopStatus === 'Active' ? 'Inactive' : 'Active';
    laptopStatus = newStatus;
    activityStateDiv.textContent = `Status: ${laptopStatus}`;

    updateLaptopStatus(newStatus);
    renderActiveInactiveTables();
  }, 20000);
}
simulateLaptopActivity();
function renderActiveInactiveTables() {
  // Helper to render any period array into a table body element
  function renderPeriods(tbodyId, periods) {
    const tbody = document.getElementById(tbodyId);
    tbody.innerHTML = '';

    periods.forEach(period => {
      const row = document.createElement('tr');

      const startCell = document.createElement('td');
      startCell.textContent = new Date(period.start).toLocaleTimeString();

      const endCell = document.createElement('td');
      endCell.textContent = new Date(period.end).toLocaleTimeString();

      const durationCell = document.createElement('td');
      durationCell.textContent = Math.round(period.duration / 1000);

      row.appendChild(startCell);
      row.appendChild(endCell);
      row.appendChild(durationCell);

      tbody.appendChild(row);
    });
  }

  renderPeriods('activePeriodsTableBody', activePeriods);
  renderPeriods('inactivePeriodsTableBody', inactivePeriods);
}
