import IconBadge from './IconBadge';

export default function InfoCard({
  label,
  event,
  helperText,
  accentText,
  progress,
  filledIcon = false,
}) {
  if (!event) {
    return null;
  }

  return (
    <section className="info-card">
      <IconBadge icon={event.icon} color={event.color} size="lg" filled={filledIcon} />
      <div className="info-card-content">
        <p className="section-label">{label}</p>
        <h2>{event.title}</h2>
        {event.description ? <p className="event-description">{event.description}</p> : null}
        <div className="info-card-meta">
          <span>{helperText}</span>
          <strong>{accentText}</strong>
        </div>
        {typeof progress === 'number' ? (
          <div className="progress-bar" aria-hidden="true">
            <span style={{ width: `${progress}%` }} />
          </div>
        ) : null}
      </div>
    </section>
  );
}
