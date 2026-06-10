const MOSCOW_TIME_ZONE = 'Europe/Moscow';

function timeToMinutes(value) {
  const [hours, minutes] = value.split(':').map(Number);
  return hours * 60 + minutes;
}

export function getMoscowNowParts(now = new Date()) {
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: MOSCOW_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const parts = Object.fromEntries(
    formatter
      .formatToParts(now)
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, part.value]),
  );

  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
    second: Number(parts.second),
  };
}

export function formatClock(now = new Date()) {
  return new Intl.DateTimeFormat('ru-RU', {
    timeZone: MOSCOW_TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(now);
}

export function formatLongDate(now = new Date()) {
  return new Intl.DateTimeFormat('ru-RU', {
    timeZone: MOSCOW_TIME_ZONE,
    day: 'numeric',
    month: 'long',
    weekday: 'long',
  }).format(now);
}

export function normalizeSchedule(rawSchedule) {
  const normalized = rawSchedule.map((item, index) => {
    const start = item.start ?? item.time;
    const end = item.end ?? null;

    return {
      id: `${index}-${item.title}`,
      ...item,
      start,
      end,
      startMinutes: timeToMinutes(start),
      endMinutes: end ? timeToMinutes(end) : null,
    };
  });

  const sorted = [...normalized].sort((a, b) => a.startMinutes - b.startMinutes);

  return sorted.map((item, index) => {
    if (item.endMinutes !== null) {
      return item;
    }

    const nextItem = sorted[index + 1];

    return {
      ...item,
      endMinutes: nextItem ? nextItem.startMinutes : 24 * 60,
    };
  });
}

export function getScheduleState(schedule, now = new Date()) {
  const parts = getMoscowNowParts(now);
  const currentMinutes = parts.hour * 60 + parts.minute;

  const currentEvent =
    schedule.find(
      (item) => currentMinutes >= item.startMinutes && currentMinutes < item.endMinutes,
    ) ?? null;

  const nextEvent =
    schedule.find((item) => item.startMinutes > currentMinutes) ?? schedule[0] ?? null;

  const upcomingEvents = schedule
    .filter((item) => item.endMinutes > currentMinutes)
    .slice(0, 7);

  return {
    currentMinutes,
    currentEvent,
    nextEvent,
    upcomingEvents,
  };
}

export function formatEventTime(event) {
  if (event.start && event.end) {
    return `${event.start} - ${event.end}`;
  }

  return event.start;
}

export function getMinutesUntil(targetMinutes, currentMinutes) {
  const diff = targetMinutes - currentMinutes;
  return diff >= 0 ? diff : 24 * 60 + diff;
}

export function getProgressPercent(event, currentMinutes) {
  const duration = event.endMinutes - event.startMinutes;

  if (duration <= 0) {
    return 100;
  }

  const elapsed = currentMinutes - event.startMinutes;
  return Math.max(0, Math.min(100, Math.round((elapsed / duration) * 100)));
}
