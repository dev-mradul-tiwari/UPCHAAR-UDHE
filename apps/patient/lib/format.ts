/** Presentation helpers. Everything over the wire is an ISO-8601 UTC string. */

const dateFormatter = new Intl.DateTimeFormat("en-IN", {
  weekday: "short",
  day: "numeric",
  month: "short",
  year: "numeric",
});

const shortDateFormatter = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
});

const timeFormatter = new Intl.DateTimeFormat("en-IN", {
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

export function formatDate(iso: string): string {
  return dateFormatter.format(new Date(iso));
}

export function formatShortDate(iso: string): string {
  return shortDateFormatter.format(new Date(iso));
}

export function formatTime(iso: string): string {
  return timeFormatter.format(new Date(iso));
}

export function formatDateTime(iso: string): string {
  return `${formatDate(iso)} · ${formatTime(iso)}`;
}

/** "in 2 days" / "3 hours ago" — calm, human phrasing for a patient. */
export function formatRelative(iso: string, now: Date = new Date()): string {
  const target = new Date(iso).getTime();
  const diffMs = target - now.getTime();
  const diffMinutes = Math.round(diffMs / 60_000);
  const abs = Math.abs(diffMinutes);

  if (abs < 1) return "just now";
  if (abs < 60) return diffMinutes > 0 ? `in ${abs} min` : `${abs} min ago`;

  const hours = Math.round(abs / 60);
  if (abs < 60 * 24) {
    const unit = hours === 1 ? "hour" : "hours";
    return diffMinutes > 0 ? `in ${hours} ${unit}` : `${hours} ${unit} ago`;
  }

  const days = Math.round(abs / (60 * 24));
  const unit = days === 1 ? "day" : "days";
  return diffMinutes > 0 ? `in ${days} ${unit}` : `${days} ${unit} ago`;
}

/** "~25 min" / "~1 hr 10 min". */
export function formatWait(minutes: number): string {
  if (minutes <= 0) return "Any moment now";
  if (minutes < 60) return `~${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `~${hours} hr` : `~${hours} hr ${rest} min`;
}

export function formatAge(dateOfBirth: string): number {
  const dob = new Date(dateOfBirth);
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const monthDelta = now.getMonth() - dob.getMonth();
  if (monthDelta < 0 || (monthDelta === 0 && now.getDate() < dob.getDate())) age -= 1;
  return age;
}

const genderLabels: Record<string, string> = {
  MALE: "Male",
  FEMALE: "Female",
  OTHER: "Other",
};

export function formatGender(gender: string): string {
  return genderLabels[gender] ?? gender;
}

/** `2026-08-19` + `09:30` (local) → an ISO string the API accepts. */
export function toIsoDateTime(date: string, time: string): string | null {
  if (date.length === 0 || time.length === 0) return null;
  const parsed = new Date(`${date}T${time}`);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString();
}

/** Comma / newline separated free text → a clean list. */
export function parseList(value: string): string[] {
  return value
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}
