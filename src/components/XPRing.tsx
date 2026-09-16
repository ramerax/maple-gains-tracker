interface XPRingProps {
  level: number;
  xpPercent: number;
  size?: number;
  strokeWidth?: number;
}

export function XPRing({ level, xpPercent, size = 148, strokeWidth = 8 }: XPRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(Math.max(xpPercent, 0), 100);
  const offset = circumference - (pct / 100) * circumference;
  const center = size / 2;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="hsl(var(--color-primary))"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-black text-text" style={{ fontSize: size * 0.28 }}>{level}</span>
        <span className="font-bold tracking-widest text-text-faint" style={{ fontSize: Math.max(size * 0.068, 8) }}>NIVEL</span>
      </div>
    </div>
  );
}
