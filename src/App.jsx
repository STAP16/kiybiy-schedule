import { MoonStar, SunMedium } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import backgroundSummerUrl from '../assets/background_summer.webp';
import summerEveningUrl from '../assets/summer_evening.webp';
import summerNightUrl from '../assets/summer_night.webp';
import InfoCard from './components/InfoCard';
import TimelineItem from './components/TimelineItem';
import scheduleData from './data/schedule.json';
import {
  formatClock,
  formatDuration,
  formatEventTime,
  formatLongDate,
  getMinutesUntil,
  getProgressPercent,
  getScheduleState,
  normalizeSchedule,
} from './utils/schedule';

const schedule = normalizeSchedule(scheduleData);
const NIGHT_ACCENT_COLOR = '#f3cd76';
const EVENING_ACCENT_COLOR = '#f6b457';
const EVENING_START_MINUTES = 17 * 60;

function getCardEvent(event, theme) {
  if (!event) {
    return event;
  }

  if (theme === 'night' && (event.icon === 'LampDesk' || event.icon === 'AlarmClock')) {
    return {
      ...event,
      color: NIGHT_ACCENT_COLOR,
    };
  }

  if (theme === 'evening') {
    return {
      ...event,
      color: EVENING_ACCENT_COLOR,
    };
  }

  return event;
}

function preloadImage(src) {
  const image = new Image();
  image.src = src;
  return image;
}

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

  useEffect(() => {
    const preloadedImages = [
      preloadImage(backgroundSummerUrl),
      preloadImage(summerEveningUrl),
      preloadImage(summerNightUrl),
    ];

    return () => {
      preloadedImages.forEach((image) => {
        image.src = '';
      });
    };
  }, []);

  const {
    currentMinutes,
    currentEvent,
    nextEvent,
    upcomingEvents,
    isOvernightLightsOut,
    startOfNewDayMinutes,
  } = useMemo(() => getScheduleState(schedule, now), [now]);

  const isLightsOut = currentEvent?.icon === 'LampDesk';
  const isEvening = !isLightsOut && currentMinutes >= EVENING_START_MINUTES;
  const theme = isLightsOut ? 'night' : isEvening ? 'evening' : 'day';
  const currentCardEvent = getCardEvent(currentEvent, theme);
  const nextCardEvent = getCardEvent(nextEvent, theme);

  const timelineItems = useMemo(
    () =>
      upcomingEvents.map((event) => ({
        ...getCardEvent(event, theme),
        displayTime: formatEventTime(event),
      })),
    [theme, upcomingEvents],
  );

  useEffect(() => {
    document.body.classList.toggle('night-mode', theme === 'night');
    document.body.classList.toggle('evening-mode', theme === 'evening');

    return () => {
      document.body.classList.remove('night-mode');
      document.body.classList.remove('evening-mode');
    };
  }, [theme]);

  const currentCardHelperText = isLightsOut
    ? isOvernightLightsOut
      ? 'До подъема'
      : 'До начала нового дня'
    : 'До конца';

  const currentCardAccentText = currentEvent
    ? isLightsOut
      ? formatDuration(
          getMinutesUntil(
            isOvernightLightsOut
              ? nextEvent?.startMinutes ?? startOfNewDayMinutes
              : startOfNewDayMinutes,
            currentMinutes,
          ),
        )
      : formatDuration(getMinutesUntil(currentEvent.endMinutes, currentMinutes))
    : '-';

  const currentCardProgress = currentEvent
    ? isLightsOut && isOvernightLightsOut
      ? 100
      : getProgressPercent(currentEvent, currentMinutes)
    : undefined;

  return (
    <main className={`page-shell page-shell-${theme}`}>
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
            {theme === 'night' ? (
              <MoonStar size={28} color={NIGHT_ACCENT_COLOR} />
            ) : (
              <SunMedium size={28} color={theme === 'evening' ? EVENING_ACCENT_COLOR : '#f5b700'} />
            )}
          </div>
        </div>
      </section>

      <section className="cards-grid">
        <InfoCard
          label="Сейчас"
          event={currentCardEvent}
          helperText={currentCardHelperText}
          accentText={currentCardAccentText}
          progress={currentCardProgress}
          filledIcon
        />
        <InfoCard
          label="Далее"
          event={nextCardEvent}
          helperText="Начнется"
          accentText={
            nextEvent
              ? `через ${formatDuration(getMinutesUntil(nextEvent.startMinutes, currentMinutes))}`
              : '-'
          }
        />
      </section>

      {!isLightsOut ? (
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
      ) : null}
    </main>
  );
}
