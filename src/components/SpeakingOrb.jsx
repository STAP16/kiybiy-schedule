import { useEffect, useRef, useState } from 'react';

const ORB_EXIT_DURATION_MS = 420;

export default function SpeakingOrb({ announcement }) {
  const [renderedAnnouncement, setRenderedAnnouncement] = useState(announcement);
  const [isClosing, setIsClosing] = useState(false);
  const exitTimeoutRef = useRef(null);

  useEffect(() => {
    if (exitTimeoutRef.current) {
      window.clearTimeout(exitTimeoutRef.current);
      exitTimeoutRef.current = null;
    }

    if (announcement) {
      setRenderedAnnouncement(announcement);
      setIsClosing(false);
      return undefined;
    }

    if (!renderedAnnouncement) {
      return undefined;
    }

    setIsClosing(true);
    exitTimeoutRef.current = window.setTimeout(() => {
      setRenderedAnnouncement(null);
      setIsClosing(false);
      exitTimeoutRef.current = null;
    }, ORB_EXIT_DURATION_MS);

    return () => {
      if (exitTimeoutRef.current) {
        window.clearTimeout(exitTimeoutRef.current);
        exitTimeoutRef.current = null;
      }
    };
  }, [announcement, renderedAnnouncement]);

  useEffect(
    () => () => {
      if (exitTimeoutRef.current) {
        window.clearTimeout(exitTimeoutRef.current);
      }
    },
    [],
  );

  if (!renderedAnnouncement) {
    return null;
  }

  return (
    <div
      className={`orb-overlay ${isClosing ? 'orb-overlay-closing' : 'orb-overlay-open'}`}
      role="status"
      aria-live="assertive"
    >
      <div className={`orb-panel ${isClosing ? 'orb-panel-closing' : ''}`}>
        <div className={`orb-core ${isClosing ? 'orb-core-closing' : ''}`} aria-hidden="true">
          <div className="orb-halo orb-halo-outer" />
          <div className="orb-halo orb-halo-middle" />
          <div className="orb-halo orb-halo-inner" />
          <div className="orb-pulse" />
        </div>
        <div className={`orb-copy ${isClosing ? 'orb-copy-closing' : ''}`}>
          <p className="orb-kicker">ИИгнат говорит</p>
          <h2>{renderedAnnouncement.orbTitle}</h2>
          <p>{renderedAnnouncement.orbText}</p>
        </div>
      </div>
    </div>
  );
}
