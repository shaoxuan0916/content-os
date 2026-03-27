import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatScore(value: number | null | undefined) {
  if (value == null || Number.isNaN(value)) {
    return "0.0";
  }

  return value.toFixed(1);
}

export function formatDate(value: string | Date | null | undefined) {
  if (!value) {
    return "Unknown";
  }

  const date = value instanceof Date ? value : new Date(value);

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(date);
}

export function formatRelativeHours(value: string | Date | null | undefined) {
  if (!value) {
    return "n/a";
  }

  const date = value instanceof Date ? value : new Date(value);
  const diffMs = Date.now() - date.getTime();
  const hours = Math.max(0, Math.round(diffMs / (1000 * 60 * 60)));

  if (hours < 1) {
    return "<1h";
  }

  if (hours < 24) {
    return `${hours}h`;
  }

  const days = Math.round(hours / 24);
  return `${days}d`;
}
