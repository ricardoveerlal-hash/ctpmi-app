// Monthly Bible Quiz season rollout.
//
// Per Ricardo (2026-09-21): nothing in production changes before 30 Sep 22:00 SAST.
//
// - The winner BANNER needs no date here: it is data-gated. /web/season returns no winner until
//   the Season Winner workflow freezes Season 1 at 30 Sep 22:00 SAST, so the banner cannot
//   appear any earlier.
// - The MONTH leaderboard tab switches on at 1 Oct 00:00 rather than 22:00. Between 22:00 and
//   midnight on 30 Sep the "current month" is still September, whose monthly counters only began
//   on 20 Sep - showing that as "This month" beside a Season 1 champion judged on all-time totals
//   would contradict the banner. From midnight the month view is a genuinely fresh season.
export const MONTH_VIEW_FROM = new Date("2026-10-01T00:00:00+02:00");

export function isMonthViewLive(now: Date = new Date()): boolean {
  return now.getTime() >= MONTH_VIEW_FROM.getTime();
}

// Season 1 was judged on all-time totals, so it gets its own title rather than "September".
export function winnerTitle(monthKey: string, monthLabel: string): string {
  return monthKey === "2026-09" ? "Season 1 Champion" : `${monthLabel} Champion`;
}
