import IconBadge from './IconBadge';

export default function TimelineItem({ event, active = false }) {
  return (
    <li className={`timeline-item ${active ? 'timeline-item-active' : ''}`}>
      <div className="timeline-marker">
        <span />
      </div>
      <div className="timeline-time">{event.displayTime}</div>
      <IconBadge icon={event.icon} color={event.color} filled={active} />
      <div className="timeline-content">
        <h3>{event.title}</h3>
        {event.description ? <p>{event.description}</p> : null}
      </div>
    </li>
  );
}
