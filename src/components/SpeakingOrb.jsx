export default function SpeakingOrb({ announcement }) {
  if (!announcement) {
    return null;
  }

  return (
    <div className="orb-overlay" role="status" aria-live="assertive">
      <div className="orb-panel">
        <div className="orb-core" aria-hidden="true">
          <div className="orb-halo orb-halo-outer" />
          <div className="orb-halo orb-halo-middle" />
          <div className="orb-halo orb-halo-inner" />
          <div className="orb-pulse" />
        </div>
        <div className="orb-copy">
          <p className="orb-kicker">ИИгнат говорит</p>
          <h2>{announcement.orbTitle}</h2>
          <p>{announcement.orbText}</p>
        </div>
      </div>
    </div>
  );
}
