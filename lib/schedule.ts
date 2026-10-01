// CTPMI weekly programme and contact details, taken from ctpmi.online.
// Static for now; move to the API (editable from the Reporting Portal) later so
// the office can change times without an app release.

export const FACEBOOK_URL = "https://www.facebook.com/CTPMIpage";

export const LOCATIONS = [
  { key: "church", label: "Church building", address: "180 Moses Kotane Road, Overport, Durban" },
  { key: "office", label: "Office & chapel", address: "282 Moses Kotane Road, Overport, Durban" },
] as const;

export const CONTACT = {
  phoneDisplay: "+27 63 861 8667",
  phoneUrl: "tel:+27638618667",
  whatsappDisplay: "+27 83 483 4334",
  whatsappUrl: "https://wa.me/27834834334",
  email: "info@ctpmi.co.za",
  hours: "Monday to Thursday, 7:30 AM to 4:30 PM",
};

export const SOCIALS = [
  { label: "Facebook", url: FACEBOOK_URL },
  { label: "Instagram", url: "https://www.instagram.com/ctpm.i" },
  { label: "Youth Instagram", url: "https://www.instagram.com/ctpmi_conquerors_crew" },
  { label: "TikTok", url: "https://www.tiktok.com/@conquerors.crew" },
];

export interface Slot {
  day: number; // 0 = Sunday
  h: number;
  m: number;
}

export type CtaAction = "directions" | "facebook" | "youth";

export interface Service {
  id: string;
  days: string;
  title: string;
  time: string;
  note: string;
  online: boolean;
  slots: Slot[];
  cta?: { label: string; action: CtaAction };
}

export const SERVICES: Service[] = [
  {
    id: "sunday",
    days: "SUN",
    title: "Sunday Services",
    time: "7:30 AM & 10:00 AM",
    note: "Two morning services. Communion is shared at both on the first Sunday of every month.",
    online: false,
    slots: [{ day: 0, h: 7, m: 30 }, { day: 0, h: 10, m: 0 }],
    cta: { label: "Directions", action: "directions" },
  },
  {
    id: "tue-prayer",
    days: "TUE",
    title: "Tuesday Prayer",
    time: "10:00 AM",
    note: "Join the church family in prayer on Tuesday mornings.",
    online: false,
    slots: [{ day: 2, h: 10, m: 0 }],
    cta: { label: "Directions", action: "directions" },
  },
  {
    id: "youth",
    days: "TUE",
    title: "Conquerors Crew (Youth)",
    time: "7:00 PM",
    note: "The weekly youth gathering. Follow ctpmi_conquerors_crew on Instagram for updates.",
    online: false,
    slots: [{ day: 2, h: 19, m: 0 }],
    cta: { label: "Youth page", action: "youth" },
  },
  {
    id: "online-prayer",
    days: "TUE/SAT",
    title: "Online Prayer",
    time: "6:00 AM",
    note: "Start the day in prayer from wherever you are, every Tuesday and Saturday.",
    online: true,
    slots: [{ day: 2, h: 6, m: 0 }, { day: 6, h: 6, m: 0 }],
    cta: { label: "Watch on Facebook", action: "facebook" },
  },
  {
    id: "cells",
    days: "THU",
    title: "Cell Groups",
    time: "7:00 PM",
    note: "Prayer cells meet across Durban on Thursday evenings.",
    online: false,
    slots: [{ day: 4, h: 19, m: 0 }],
  },
];

/** Earliest upcoming occurrence of any of the slots, strictly after `now`. */
export function nextOccurrence(slots: Slot[], now: Date): Date {
  let best: Date | null = null;
  for (const s of slots) {
    for (let d = 0; d <= 7; d++) {
      const c = new Date(now.getFullYear(), now.getMonth(), now.getDate() + d, s.h, s.m, 0, 0);
      if (c.getDay() === s.day && c.getTime() > now.getTime()) {
        if (!best || c.getTime() < best.getTime()) best = c;
        break;
      }
    }
  }
  return best ?? now;
}

export function nextService(now: Date): { service: Service; at: Date } {
  let pick = { service: SERVICES[0], at: nextOccurrence(SERVICES[0].slots, now) };
  for (const svc of SERVICES) {
    const at = nextOccurrence(svc.slots, now);
    if (at.getTime() < pick.at.getTime()) pick = { service: svc, at };
  }
  return pick;
}

export function clock(d: Date): string {
  const h = d.getHours();
  const m = d.getMinutes();
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/** "Tonight", "Today", "Tomorrow" or the weekday name. */
export function dayWord(at: Date, now: Date): string {
  const a = new Date(at.getFullYear(), at.getMonth(), at.getDate()).getTime();
  const b = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const diff = Math.round((a - b) / 86400000);
  if (diff === 0) return at.getHours() >= 17 ? "Tonight" : "Today";
  if (diff === 1) return "Tomorrow";
  return WEEKDAYS[at.getDay()];
}

/** First Sunday of the month is communion Sunday (both morning services). */
export function isCommunion(at: Date): boolean {
  return at.getDay() === 0 && at.getDate() <= 7;
}
