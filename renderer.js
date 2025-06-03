const userIdInput = document.getElementById('userId');
const dateInput = document.getElementById('date');
const fetchBtn = document.getElementById('fetchBtn');
const saveBtn = document.getElementById('saveBtn');

const tasksContainer = document.getElementById('tasks');
const activityContainer = document.getElementById('activity');
const browserContainer = document.getElementById('browser');

let currentTimeline = null;

function renderList(container, list, isTask = false) {
  container.innerHTML = '';
  list.forEach((item, i) => {
    const div = document.createElement('div');
    if (isTask) {
      div.textContent = `${item.name} - Duration: ${item.duration} mins`;
    } else if (item.status) {
      div.textContent = `${item.start} to ${item.end} — ${item.status}`;
    } else {
      div.textContent = `${item.domain} from ${item.start} to ${item.end}`;
    }
    container.appendChild(div);
  });
}

fetchBtn.addEventListener('click', async () => {
  const userId = userIdInput.value.trim();
  const date = dateInput.value;
  if (!userId || !date) {
    alert('Enter user ID and date');
    return;
  }
  const timeline = await window.api.fetchTimeline(userId, date);
  if (timeline) {
    currentTimeline = timeline;
    renderList(tasksContainer, timeline.tasks, true);
    renderList(activityContainer, timeline.activity);
    renderList(browserContainer, timeline.browser);
  } else {
    alert('No timeline found');
    currentTimeline = null;
    tasksContainer.innerHTML = '';
    activityContainer.innerHTML = '';
    browserContainer.innerHTML = '';
  }
});

saveBtn.addEventListener('click', async () => {
  if (!currentTimeline) {
    alert('Fetch a timeline first');
    return;
  }
  // For demo, just re-save current data (you can add UI editing later)
  const result = await window.api.saveTimeline(currentTimeline);
  alert(`Timeline ${result.status}`);
});
