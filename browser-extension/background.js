// background.js in browser extension

let ws;

function connectWebSocket() {
  ws = new WebSocket('ws://localhost:8765');

  ws.onopen = () => {
    console.log('WebSocket connected');
  };

  ws.onclose = () => {
    console.log('WebSocket disconnected, retrying in 3s');
    setTimeout(connectWebSocket, 3000);
  };

  ws.onerror = (error) => {
    console.error('WebSocket error:', error);
  };
}

// Connect initially
connectWebSocket();

// Listen to tab updates (e.g. URL change or new page load)
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.url && ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({
      event: 'url-change',
      url: changeInfo.url,
      title: tab.title,
      timestamp: Date.now(),
    }));
  }
});

// Also listen to tab activation (switching tabs)
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  const tab = await chrome.tabs.get(activeInfo.tabId);
  if (tab.url && ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({
      event: 'tab-activated',
      url: tab.url,
      title: tab.title,
      timestamp: Date.now(),
    }));
  }
});
