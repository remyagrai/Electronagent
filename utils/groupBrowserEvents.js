export function groupBrowserEvents(events) {
  if (!events || events.length === 0) return [];

  const grouped = [];
  let current = { ...events[0] };

  for (let i = 1; i < events.length; i++) {
    const event = events[i];
    // If same domain and times are consecutive or overlapping, merge
    const prevEnd = new Date(`1970-01-01T${current.end}:00`);
    const currStart = new Date(`1970-01-01T${event.start}:00`);

    if (
      event.domain === current.domain &&
      (currStart - prevEnd <= 60000) // 1 minute gap or less
    ) {
      current.end = event.end;
    } else {
      grouped.push(current);
      current = { ...event };
    }
  }
  grouped.push(current);
  return grouped;
}
