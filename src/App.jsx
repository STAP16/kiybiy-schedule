import { MoonStar, SunMedium } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import backgroundSummerUrl from '../assets/background_summer.webp';
import summerEveningUrl from '../assets/summer_evening.webp';
import summerNightUrl from '../assets/summer_night.webp';
import InfoCard from './components/InfoCard';
import SpeakingOrb from './components/SpeakingOrb';
import TimelineItem from './components/TimelineItem';
import {
  createAnnouncementPlan,
  DEFAULT_ANNOUNCEMENT_SETTINGS,
} from './data/announcements';
import scheduleData from './data/schedule.json';
import {
  formatClock,
  formatDuration,
  formatEventTime,
  formatLongDate,
  getMinutesUntil,
  getMoscowDateKey,
  getMoscowNowParts,
  getProgressPercent,
  getScheduleState,
  normalizeSchedule,
} from './utils/schedule';

const schedule = normalizeSchedule(scheduleData);
const NIGHT_ACCENT_COLOR = '#f3cd76';
const EVENING_ACCENT_COLOR = '#f6b457';
const EVENING_START_MINUTES = 17 * 60;
const MOBILE_BREAKPOINT = 640;
const DAY_MINUTES = 24 * 60;
const FALLBACK_ORB_DURATION_MS = 9000;
const PLAYED_STORAGE_KEY = 'tv-scheduler-played-announcements';

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

function getAnnouncementTriggerMinutes(item, event) {
  if (item.triggerType === 'before-start') {
    return ((event.startMinutes - item.leadMinutes) % DAY_MINUTES + DAY_MINUTES) % DAY_MINUTES;
  }

  if (item.triggerType === 'end') {
    return event.endMinutes % DAY_MINUTES;
  }

  return event.startMinutes % DAY_MINUTES;
}

function normalizeAnnouncements(plan, normalizedSchedule) {
  return plan
    .map((item) => {
      const event = normalizedSchedule.find((entry) => entry.title === item.eventTitle);

      if (!event) {
        return null;
      }

      const triggerMinutes = getAnnouncementTriggerMinutes(item, event);

      return {
        ...item,
        event,
        triggerMinutes,
        triggerSeconds: triggerMinutes * 60,
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.triggerSeconds - b.triggerSeconds);
}

function readPlayedAnnouncements() {
  if (typeof window === 'undefined') {
    return {};
  }

  try {
    return JSON.parse(window.localStorage.getItem(PLAYED_STORAGE_KEY) ?? '{}');
  } catch {
    return {};
  }
}

function writePlayedAnnouncements(value) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(PLAYED_STORAGE_KEY, JSON.stringify(value));
}

export default function App() {
  const [realNow, setRealNow] = useState(() => new Date());
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= MOBILE_BREAKPOINT);
  const [activeAnnouncement, setActiveAnnouncement] = useState(null);
  const [audioStatus, setAudioStatus] = useState('idle');
  const audioRef = useRef(null);
  const orbTimeoutRef = useRef(null);
  const previousMomentRef = useRef(null);
  const playedAnnouncementsRef = useRef(readPlayedAnnouncements());

  useEffect(() => {
    const timer = window.setInterval(() => {
      setRealNow(new Date());
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`);
    const updateIsMobile = (event) => {
      setIsMobile(event.matches);
    };

    setIsMobile(mediaQuery.matches);
    mediaQuery.addEventListener('change', updateIsMobile);

    return () => {
      mediaQuery.removeEventListener('change', updateIsMobile);
    };
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

  useEffect(
    () => () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }

      if (orbTimeoutRef.current) {
        window.clearTimeout(orbTimeoutRef.current);
      }
    },
    [],
  );

  const now = realNow;

  const clockText = formatClock(now);
  const clockParts = clockText.split(':');
  const clockMain = clockParts.slice(0, 2).join(':');
  const clockSeconds = clockParts[2] ?? '00';

  const {
    currentMinutes,
    currentEvent,
    nextEvent,
    upcomingEvents,
    isOvernightLightsOut,
    startOfNewDayMinutes,
  } = useMemo(
    () =>
      getScheduleState(schedule, now, {
        upcomingLimit: isMobile ? null : 7,
      }),
    [isMobile, now],
  );

  const announcements = useMemo(
    () => normalizeAnnouncements(createAnnouncementPlan(DEFAULT_ANNOUNCEMENT_SETTINGS), schedule),
    [],
  );

  useEffect(() => {
    const parts = getMoscowNowParts(now);
    const dayKey = getMoscowDateKey(now);
    const currentSecondOfDay = parts.hour * 3600 + parts.minute * 60 + parts.second;
    const previousMoment = previousMomentRef.current;

    if (
      !previousMoment ||
      previousMoment.dayKey !== dayKey ||
      currentSecondOfDay < previousMoment.currentSecondOfDay
    ) {
      previousMomentRef.current = { dayKey, currentSecondOfDay };
      return;
    }

    const dueAnnouncements = announcements.filter(
      (item) =>
        item.triggerSeconds > previousMoment.currentSecondOfDay &&
        item.triggerSeconds <= currentSecondOfDay,
    );

    previousMomentRef.current = { dayKey, currentSecondOfDay };

    if (dueAnnouncements.length === 0) {
      return;
    }

    dueAnnouncements.forEach((item) => {
      const playbackKey = `${dayKey}:${item.id}`;

      if (playedAnnouncementsRef.current[playbackKey]) {
        return;
      }

      playedAnnouncementsRef.current = {
        ...playedAnnouncementsRef.current,
        [playbackKey]: item.triggerSeconds,
      };
      writePlayedAnnouncements(playedAnnouncementsRef.current);
      setActiveAnnouncement(item);

      if (orbTimeoutRef.current) {
        window.clearTimeout(orbTimeoutRef.current);
      }

      if (audioRef.current) {
        audioRef.current.pause();
      }

      const audio = new Audio(item.audioSrc);
      audioRef.current = audio;

      const hideOrb = () => {
        setActiveAnnouncement((current) => (current?.id === item.id ? null : current));
      };

      audio.addEventListener('ended', hideOrb, { once: true });
      orbTimeoutRef.current = window.setTimeout(hideOrb, FALLBACK_ORB_DURATION_MS);

      audio
        .play()
        .then(() => {
          setAudioStatus('playing');
        })
        .catch(() => {
          setAudioStatus('blocked');
        });
    });
  }, [announcements, now]);

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
      <SpeakingOrb announcement={activeAnnouncement} />

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
              <SunMedium
                size={28}
                color={theme === 'evening' ? EVENING_ACCENT_COLOR : '#f5b700'}
              />
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
              <TimelineItem key={event.id} event={event} active={index === 0} />
            ))}
          </ul>
        </section>
      ) : null}
    </main>
  );
}
