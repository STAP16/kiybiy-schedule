import {
  AlarmClock,
  Archive,
  BedDouble,
  CircleDot,
  ClipboardCheck,
  CookingPot,
  Crosshair,
  Croissant,
  CupSoda,
  Dribbble,
  Dumbbell,
  Flag,
  LampDesk,
  MoonStar,
  Palette,
  PersonStanding,
  Smartphone,
  Soup,
  Sparkles,
  Target,
  Utensils,
} from 'lucide-react';

const icons = {
  AlarmClock,
  Archive,
  BedDouble,
  CircleDot,
  ClipboardCheck,
  CookingPot,
  Croissant,
  CupSoda,
  Dribbble,
  Dumbbell,
  Flag,
  LampDesk,
  MoonStar,
  Palette,
  Paintball: Crosshair,
  SmallHall: PersonStanding,
  Smartphone,
  Soup,
  Sparkles,
  Target,
  Utensils,
};

export default function IconBadge({ icon, color, size = 'md', filled = false }) {
  const Icon = icons[icon] ?? AlarmClock;
  const dimensions = size === 'lg' ? 60 : 42;
  const iconSize = size === 'lg' ? 28 : 20;

  return (
    <div
      className={`icon-badge ${filled ? 'icon-badge-filled' : ''}`}
      style={{
        '--badge-color': color,
        width: `${dimensions}px`,
        height: `${dimensions}px`,
      }}
    >
      <Icon size={iconSize} strokeWidth={2.1} />
    </div>
  );
}
