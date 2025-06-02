export function groupBrowserEvents(events) {
  if (events.length === 0) return [];

  const grouped = [];
  let current = {...events[0]};

  for (let i = 1; i < events.length; i++) {
    const event = events[i];

    // Group if same domain and continuous (within 5 min gap)
    if (event.domain === current.domain && event.startTime - current.endTime < 5 * 60 * 1000) {
      current.endTime = event.endTime;
    } else {
      grouped.push(current);
      current = {...event};
    }
  }
  grouped.push(current);
  return grouped;
}
