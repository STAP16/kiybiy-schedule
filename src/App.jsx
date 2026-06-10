import { SunMedium } from 'lucide-react';
import scheduleData from './data/schedule.json';
import InfoCard from './components/InfoCard';
import TimelineItem from './components/TimelineItem';
import {
  formatClock,
  formatEventTime,
  formatLongDate,
  getMinutesUntil,
  getProgressPercent,
  getScheduleState,
  normalizeSchedule,
} from './utils/schedule';

import { useEffect, useMemo, useState } from 'react';

const schedule = normalizeSchedule(scheduleData);

export default function App() {
  const [now, setNow] = useState(() => new Date());
  const clockText = formatClock(now);
  const clockParts = clockText.split(':');
  const clockMain = clockParts.slice(0, 2).join(':');
  const clockSeconds = clockParts[2] ?? '00';

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  const { currentMinutes, currentEvent, nextEvent, upcomingEvents } = useMemo(
    () => getScheduleState(schedule, now),
    [now],
  );

  const timelineItems = useMemo(
    () =>
      upcomingEvents.map((event) => ({
        ...event,
        displayTime: formatEventTime(event),
      })),
    [upcomingEvents],
  );

  return (
    <main className="page-shell">
      <div className="background-glow background-glow-left" />
      <div className="background-glow background-glow-right" />

      <section className="hero">
        <div className="hero-time">
          <p className="hero-label">Время сейчас</p>
          <div className="clock" aria-label={clockText}>
            <span className="clock-main">{clockMain}</span>
            <span className="clock-seconds">:{clockSeconds}</span>
          </div>
          <div className="hero-date-row">
            <p className="hero-date">{formatLongDate(now)}</p>
            <SunMedium size={28} color="#f5b700" />
          </div>
        </div>
      </section>

      <section className="cards-grid">
        <InfoCard
          label="Сейчас"
          event={currentEvent}
          helperText="До конца"
          accentText={
            currentEvent
              ? `${getMinutesUntil(currentEvent.endMinutes, currentMinutes)} мин`
              : '-'
          }
          progress={
            currentEvent ? getProgressPercent(currentEvent, currentMinutes) : undefined
          }
          filledIcon
        />
        <InfoCard
          label="Далее"
          event={nextEvent}
          helperText="Начнется"
          accentText={
            nextEvent ? `через ${getMinutesUntil(nextEvent.startMinutes, currentMinutes)} мин` : '-'
          }
        />
      </section>

      <section className="timeline-section">
        <div className="section-header">
          <p className="section-label">Ближайшие события</p>
        </div>
        <ul className="timeline-list">
          {timelineItems.map((event, index) => (
            <TimelineItem
              key={event.id}
              event={event}
              active={index === 0}
            />
          ))}
        </ul>
      </section>
    </main>
  );
}
