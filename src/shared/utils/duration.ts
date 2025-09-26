const durationPattern = /^(\d+)([smhd])$/i;

type DurationUnit = 's' | 'm' | 'h' | 'd';

const unitToSeconds: Record<DurationUnit, number> = {
  s: 1,
  m: 60,
  h: 3600,
  d: 86400,
};

const parseDuration = (value: string): number | null => {
  const trimmed = value.trim();
  const match = durationPattern.exec(trimmed);

  if (!match) {
    return null;
  }

  const amount = Number.parseInt(match[1] ?? '0', 10);
  const unit = (match[2] ?? 's').toLowerCase() as DurationUnit;

  if (!Number.isFinite(amount) || amount <= 0) {
    return null;
  }

  return amount * unitToSeconds[unit];
};

export const durationToSeconds = (value: string, fallback: string): number => {
  const parsed = parseDuration(value);
  if (parsed !== null) {
    return parsed;
  }

  const fallbackParsed = parseDuration(fallback);
  return fallbackParsed ?? 0;
};

export const addDuration = (start: Date, duration: string, fallback: string): Date => {
  const seconds = durationToSeconds(duration, fallback);
  return new Date(start.getTime() + seconds * 1000);
};
