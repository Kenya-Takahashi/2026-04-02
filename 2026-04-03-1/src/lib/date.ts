const DATE_LOCALE = "ja-JP";
export const APP_TIME_ZONE = process.env.APP_TIME_ZONE ?? "Asia/Tokyo";

export function getTodayDate() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export function formatDateLabel(date: string) {
  const value = new Date(`${date}T00:00:00`);

  return new Intl.DateTimeFormat(DATE_LOCALE, {
    timeZone: APP_TIME_ZONE,
    month: "long",
    day: "numeric",
    weekday: "short",
  }).format(value);
}

export function formatDateTimeLabel(value: string) {
  return new Intl.DateTimeFormat(DATE_LOCALE, {
    timeZone: APP_TIME_ZONE,
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function formatShortDateLabel(value: string) {
  return new Intl.DateTimeFormat(DATE_LOCALE, {
    timeZone: APP_TIME_ZONE,
    month: "numeric",
    day: "numeric",
  }).format(new Date(value));
}
