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
const DAY_SECONDS = DAY_MINUTES * 60;
const FALLBACK_ORB_DURATION_MS = 9000;
const PLAYED_STORAGE_KEY = 'tv-scheduler-played-announcements';
const DEV_SETTINGS_STORAGE_KEY = 'tv-scheduler-dev-settings';
const DEFAULT_DEV_SETTINGS = {
  enabled: false,
  time: '07:40:00',
  speedMultiplier: 60,
  mealLeadMinutes: DEFAULT_ANNOUNCEMENT_SETTINGS.mealLeadMinutes,
  secondBreakfastLeadMinutes: DEFAULT_ANNOUNCEMENT_SETTINGS.secondBreakfastLeadMinutes,
};

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

function loadDevSettings() {
  if (typeof window === 'undefined') {
    return DEFAULT_DEV_SETTINGS;
  }

  try {
    const rawValue = window.localStorage.getItem(DEV_SETTINGS_STORAGE_KEY);

    if (!rawValue) {
      return DEFAULT_DEV_SETTINGS;
    }

    return {
      ...DEFAULT_DEV_SETTINGS,
      ...JSON.parse(rawValue),
    };
  } catch {
    return DEFAULT_DEV_SETTINGS;
  }
}

function parseTimeInput(value) {
  const [hours = '0', minutes = '0', seconds = '0'] = value.split(':');
  const safeHours = Math.min(23, Math.max(0, Number.parseInt(hours, 10) || 0));
  const safeMinutes = Math.min(59, Math.max(0, Number.parseInt(minutes, 10) || 0));
  const safeSeconds = Math.min(59, Math.max(0, Number.parseInt(seconds, 10) || 0));

  return safeHours * 3600 + safeMinutes * 60 + safeSeconds;
}

function formatTimeInput(totalSeconds) {
  const normalizedSeconds = ((totalSeconds % DAY_SECONDS) + DAY_SECONDS) % DAY_SECONDS;
  const hours = Math.floor(normalizedSeconds / 3600);
  const minutes = Math.floor((normalizedSeconds % 3600) / 60);
  const seconds = normalizedSeconds % 60;

  return [hours, minutes, seconds].map((value) => String(value).padStart(2, '0')).join(':');
}

function buildSimulatedDate(baseParts, timeString) {
  const totalSeconds = parseTimeInput(timeString);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return new Date(
    Date.UTC(baseParts.year, baseParts.month - 1, baseParts.day, hours - 3, minutes, seconds),
  );
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
  const [devSettings, setDevSettings] = useState(loadDevSettings);
  const [activeAnnouncement, setActiveAnnouncement] = useState(null);
  const [audioStatus, setAudioStatus] = useState('idle');
  const audioRef = useRef(null);
  const orbTimeoutRef = useRef(null);
  const previousMomentRef = useRef(null);
  const playedAnnouncementsRef = useRef(readPlayedAnnouncements());

  useEffect(() => {
    window.localStorage.setItem(DEV_SETTINGS_STORAGE_KEY, JSON.stringify(devSettings));
  }, [devSettings]);

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

  useEffect(() => {
    if (!devSettings.enabled) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setDevSettings((current) => ({
        ...current,
        time: formatTimeInput(
          parseTimeInput(current.time) + Math.max(1, Number(current.speedMultiplier) || 1),
        ),
      }));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [devSettings.enabled]);

  const now = useMemo(() => {
    if (!devSettings.enabled) {
      return realNow;
    }

    return buildSimulatedDate(getMoscowNowParts(realNow), devSettings.time);
  }, [devSettings.enabled, devSettings.time, realNow]);

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

  const announcementSettings = useMemo(
    () => ({
      mealLeadMinutes: Number(devSettings.mealLeadMinutes),
      secondBreakfastLeadMinutes: Number(devSettings.secondBreakfastLeadMinutes),
    }),
    [devSettings.mealLeadMinutes, devSettings.secondBreakfastLeadMinutes],
  );

  const announcements = useMemo(
    () => normalizeAnnouncements(createAnnouncementPlan(announcementSettings), schedule),
    [announcementSettings],
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

  const adjustDevTime = (deltaSeconds) => {
    setDevSettings((current) => ({
      ...current,
      enabled: true,
      time: formatTimeInput(parseTimeInput(current.time) + deltaSeconds),
    }));
  };

  const resetPlayedAnnouncements = () => {
    playedAnnouncementsRef.current = {};
    writePlayedAnnouncements({});
    previousMomentRef.current = null;
    setAudioStatus('idle');
  };

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

      <section className="dev-panel">
        <div className="dev-panel-header">
          <div>
            <p className="dev-panel-kicker">Проверка сценариев</p>
            <h2>Режим разработки</h2>
          </div>
          <label className="dev-toggle">
            <input
              type="checkbox"
              checked={devSettings.enabled}
              onChange={(event) =>
                setDevSettings((current) => ({
                  ...current,
                  enabled: event.target.checked,
                  time: event.target.checked ? current.time : DEFAULT_DEV_SETTINGS.time,
                }))
              }
            />
            <span>{devSettings.enabled ? 'Включен' : 'Выключен'}</span>
          </label>
        </div>

        <div className="dev-grid">
          <label className="dev-field">
            <span>Тестовое время</span>
            <input
              type="time"
              step="1"
              value={devSettings.time}
              onChange={(event) =>
                setDevSettings((current) => ({
                  ...current,
                  time: event.target.value || DEFAULT_DEV_SETTINGS.time,
                }))
              }
            />
          </label>

          <label className="dev-field">
            <span>Скорость времени</span>
            <select
              value={devSettings.speedMultiplier}
              onChange={(event) =>
                setDevSettings((current) => ({
                  ...current,
                  speedMultiplier: Number(event.target.value),
                }))
              }
            >
              <option value={1}>1x</option>
              <option value={10}>10x</option>
              <option value={60}>60x</option>
              <option value={300}>300x</option>
            </select>
          </label>

          <label className="dev-field">
            <span>Еда заранее, минут</span>
            <input
              type="number"
              min="0"
              max="120"
              value={devSettings.mealLeadMinutes}
              onChange={(event) =>
                setDevSettings((current) => ({
                  ...current,
                  mealLeadMinutes: Number(event.target.value),
                }))
              }
            />
          </label>

          <label className="dev-field">
            <span>Второй завтрак, минут</span>
            <input
              type="number"
              min="0"
              max="120"
              value={devSettings.secondBreakfastLeadMinutes}
              onChange={(event) =>
                setDevSettings((current) => ({
                  ...current,
                  secondBreakfastLeadMinutes: Number(event.target.value),
                }))
              }
            />
          </label>
        </div>

        <div className="dev-actions">
          <button type="button" onClick={() => adjustDevTime(-300)}>
            -5 мин
          </button>
          <button type="button" onClick={() => adjustDevTime(-60)}>
            -1 мин
          </button>
          <button type="button" onClick={() => adjustDevTime(60)}>
            +1 мин
          </button>
          <button type="button" onClick={() => adjustDevTime(300)}>
            +5 мин
          </button>
          <button type="button" onClick={resetPlayedAnnouncements}>
            Сбросить реплики
          </button>
        </div>

        <p className="dev-status">
          {audioStatus === 'blocked'
            ? 'Браузер заблокировал автозвук. Один раз кликните по странице и повторите проверку.'
            : 'Реплики проигрываются по сценарию, а время можно проматывать для проверки.'}
        </p>
      </section>
    </main>
  );
}
