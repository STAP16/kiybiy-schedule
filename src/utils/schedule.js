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

export function getScheduleState(schedule, now = new Date(), options = {}) {
  const { upcomingLimit = 7 } = options;
  const parts = getMoscowNowParts(now);
  const currentMinutes = parts.hour * 60 + parts.minute;
  const firstEvent = schedule[0] ?? null;
  const lastEvent = schedule[schedule.length - 1] ?? null;

  let currentEvent =
    schedule.find(
      (item) => currentMinutes >= item.startMinutes && currentMinutes < item.endMinutes,
    ) ?? null;

  const isOvernightLightsOut =
    !currentEvent &&
    firstEvent &&
    lastEvent &&
    currentMinutes < firstEvent.startMinutes &&
    lastEvent.icon === 'LampDesk';

  if (isOvernightLightsOut) {
    currentEvent = {
      ...lastEvent,
      carriesIntoNextDay: true,
    };
  }

  const nextEvent =
    schedule.find((item) => item.startMinutes > currentMinutes) ?? firstEvent ?? null;

  const filteredUpcomingEvents = schedule.filter((item) => item.endMinutes > currentMinutes);
  const upcomingEvents =
    typeof upcomingLimit === 'number'
      ? filteredUpcomingEvents.slice(0, upcomingLimit)
      : filteredUpcomingEvents;

  return {
    currentMinutes,
    currentEvent,
    nextEvent,
    upcomingEvents,
    isOvernightLightsOut,
    startOfNewDayMinutes: 24 * 60,
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

function pluralize(value, forms) {
  const mod10 = value % 10;
  const mod100 = value % 100;

  if (mod10 === 1 && mod100 !== 11) {
    return forms[0];
  }

  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return forms[1];
  }

  return forms[2];
}

export function formatDuration(minutes) {
  if (minutes < 60) {
    return `${minutes} ${pluralize(minutes, ['минута', 'минуты', 'минут'])}`;
  }

  const hours = Math.floor(minutes / 60);
  const restMinutes = minutes % 60;
  const parts = [`${hours} ${pluralize(hours, ['час', 'часа', 'часов'])}`];

  if (restMinutes > 0) {
    parts.push(`${restMinutes} ${pluralize(restMinutes, ['минута', 'минуты', 'минут'])}`);
  }

  return parts.join(' ');
}

export function getProgressPercent(event, currentMinutes) {
  const duration = event.endMinutes - event.startMinutes;

  if (duration <= 0) {
    return 100;
  }

  const elapsed = currentMinutes - event.startMinutes;
  return Math.max(0, Math.min(100, Math.round((elapsed / duration) * 100)));
}
