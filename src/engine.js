export const SUBJECTS = [
  { name: "Math", color: "#b7cba5", symbol: "∑" },
  { name: "History", color: "#deb191", symbol: "H" },
  { name: "Science", color: "#acbddd", symbol: "⚗" },
  { name: "English", color: "#c5add0", symbol: "Aa" },
  { name: "Spanish", color: "#e4ce8c", symbol: "Ñ" },
];
export const freshState = () => ({
  version: 1,
  name: "",
  sessions: [],
  theme: "ember",
  dailyGoal: 45,
  subjects: SUBJECTS.map((s) => s.name),
  active: null,
  friends: [],
  restDays: [],
  bonusXP: [],
  pactCode: null,
});
export function dayKey(value = Date.now()) {
  const d = new Date(value);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
export function shiftDay(key, n) {
  const d = new Date(`${key}T12:00:00`);
  d.setDate(d.getDate() + n);
  return dayKey(d);
}
export function monday(value = Date.now()) {
  const d = new Date(value);
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return dayKey(d);
}
export const totalXP = (state) =>
  state.sessions.reduce((n, s) => n + (s.xp || 0), 0) +
  (state.bonusXP || []).reduce((n, b) => n + b.xp, 0);
export function levelInfo(xp) {
  let level = 1,
    spent = 0,
    cost = 100;
  while (xp >= spent + cost) {
    spent += cost;
    level++;
    cost = Math.round(100 * level ** 1.5);
  }
  return { level, current: xp - spent, cost, progress: (xp - spent) / cost };
}
export function streak(state, today = dayKey()) {
  const studied = new Set(
    state.sessions.filter((s) => s.duration >= 600).map((s) => s.day),
  );
  const days = new Set([...studied, ...state.restDays]);
  let key = days.has(today) ? today : shiftDay(today, -1),
    count = 0;
  while (days.has(key)) {
    if (studied.has(key)) count++;
    key = shiftDay(key, -1);
  }
  return count;
}
export function bestGhost(state, subject, minutes) {
  return (
    state.sessions
      .filter(
        (s) => s.subject === subject && s.planned === minutes && s.completed,
      )
      .sort((a, b) => b.score - a.score)[0] || null
  );
}
export function secondsElapsed(active, now = Date.now()) {
  return Math.max(
    0,
    Math.min(active.planned * 60, Math.floor((now - active.startedAt) / 1000)),
  );
}
// Intervals use wall-clock time, so sleep/reload never slows the timer.
export function focusedSeconds(active, elapsed) {
  let total = 0;
  for (let i = 0; i < active.events.length; i++) {
    const e = active.events[i],
      end = Math.min(elapsed, active.events[i + 1]?.at ?? elapsed);
    if (e.focused && end > e.at) total += end - e.at;
  }
  return Math.max(0, total);
}
export const scoreAt = (active, elapsed) =>
  Math.round((focusedSeconds(active, elapsed) / 60) * 4 * 10) / 10;
export function setFocus(active, focused, now = Date.now()) {
  const at = secondsElapsed(active, now);
  if (active.events.at(-1).focused === focused) return active;
  return {
    ...active,
    events: [...active.events, { at, focused }],
    distractions: active.distractions + (!focused ? 1 : 0),
  };
}
export function perMinute(active, duration) {
  const result = [];
  for (let seconds = 60; seconds <= duration; seconds += 60)
    result.push(scoreAt(active, seconds));
  if (duration % 60) result.push(scoreAt(active, duration));
  return result;
}
export function makeSession(state, active, now, tasksCompleted, proof) {
  const duration = secondsElapsed(active, now),
    focused = focusedSeconds(active, duration),
    day = dayKey(now);
  const completed = duration >= active.planned * 60;
  const multiplier =
    streak(state) >= 14
      ? 1.5
      : streak(state) >= 7
        ? 1.25
        : streak(state) >= 3
          ? 1.1
          : 1;
  const prior =
    state.sessions.filter((s) => s.day === day).reduce((n, s) => n + s.xp, 0) +
    (state.bonusXP || [])
      .filter((b) => b.day === day)
      .reduce((n, b) => n + b.xp, 0);
  const base =
    Math.floor(focused / 60) + (tasksCompleted ? 10 : 0) + (completed ? 20 : 0);
  const xp =
    duration >= 600
      ? Math.max(0, Math.min(300 - prior, Math.floor(base * multiplier)))
      : 0;
  const score = scoreAt(active, duration),
    minute = duration / 60,
    index = Math.floor(minute),
    points = active.ghost?.perMinute || [],
    before = index === 0 ? 0 : points[index - 1] || 0,
    after = points[index] ?? points.at(-1) ?? 0,
    ghostScore = before + (after - before) * (minute - index);
  return {
    id: crypto.randomUUID(),
    endedAt: now,
    day,
    subject: active.subject,
    planned: active.planned,
    duration,
    focused,
    score,
    perMinute: perMinute(active, duration),
    events: active.events,
    distractions: active.distractions,
    completed,
    task: active.task,
    tasksCompleted: !!tasksCompleted,
    proof: proof.slice(0, 160),
    xp,
    ghostScore,
    hadGhost: !!active.ghost,
    ghostName: active.ghostName || "Your ghost",
    beatGhost: completed && !!active.ghost && score > ghostScore,
  };
}
export function weeklyStats(state, start = monday()) {
  const end = shiftDay(start, 7),
    sessions = state.sessions.filter((s) => s.day >= start && s.day < end);
  const focused = sessions.reduce((n, s) => n + s.focused, 0) / 60,
    xp =
      sessions.reduce((n, s) => n + s.xp, 0) +
      (state.bonusXP || [])
        .filter((b) => b.day >= start && b.day < end)
        .reduce((n, b) => n + b.xp, 0),
    completed = sessions.filter((s) => s.completed).length;
  const days = Array.from({ length: 7 }, (_, i) => {
    const day = shiftDay(start, i);
    return {
      day,
      minutes:
        sessions
          .filter((s) => s.day === day)
          .reduce((n, s) => n + s.focused, 0) / 60,
    };
  });
  const best = days.reduce((a, b) => (b.minutes > a.minutes ? b : a), days[0]);
  return {
    sessions,
    focused,
    xp,
    completed,
    days,
    best,
    longest: Math.max(0, ...sessions.map((s) => s.duration / 60)),
    wins: sessions.filter((s) => s.beatGhost).length,
  };
}
export function badgeList(state) {
  const focus = state.sessions.reduce((n, s) => n + s.focused, 0),
    days = {};
  state.sessions.forEach((s) => (days[s.day] = (days[s.day] || 0) + s.focused));
  return [
    {
      id: "first",
      name: "First spark",
      desc: "Complete your first session",
      earned: state.sessions.some((s) => s.completed),
      icon: "flame",
    },
    {
      id: "ghost",
      name: "Ghost chaser",
      desc: "Beat your personal ghost",
      earned: state.sessions.some((s) => s.beatGhost),
      icon: "ghost",
    },
    {
      id: "week",
      name: "Steady flame",
      desc: "Build a 7-day streak",
      earned: state.sessions.some((s) => streak(state, s.day) >= 7),
      icon: "streak",
    },
    {
      id: "ten",
      name: "Deep thinker",
      desc: "Reach 10 focused hours",
      earned: focus >= 36000,
      icon: "brain",
    },
    {
      id: "day",
      name: "Raise the bar",
      desc: "Beat your previous best day",
      earned:
        Object.values(days).filter((n) => n > 0).length >= 2 &&
        Object.values(days).at(-1) >
          Math.max(...Object.values(days).slice(0, -1)),
      icon: "trophy",
    },
    {
      id: "pact",
      name: "Pact keeper",
      desc: "Check in together on 3 different days",
      earned: new Set((state.bonusXP || []).map((b) => b.day)).size >= 3,
      icon: "check",
    },
    {
      id: "proof",
      name: "Show your work",
      desc: "Add proof of work to 5 sessions",
      earned: state.sessions.filter((s) => s.proof).length >= 5,
      icon: "check",
    },
  ];
}
export function leaguePoints(state, start = monday()) {
  const w = weeklyStats(state, start),
    before = state.sessions.filter((s) => s.day < start && s.duration >= 600);
  const baseline = before.length
    ? before.reduce((n, s) => n + s.focused / s.duration, 0) / before.length
    : 0;
  const improvements = w.sessions.filter(
    (s) => s.duration >= 600 && s.focused / s.duration > baseline,
  ).length;
  return (
    Math.round(w.focused) + w.completed * 10 + w.wins * 15 + improvements * 5
  );
}
export function insights(state) {
  const rows = state.sessions.filter((s) => s.autopsy);
  if (rows.length < 3)
    return "A few honest reflections will help reveal what works for you. Add a reflection after a session.";
  const groups = {};
  rows.forEach((s) => {
    const place = s.autopsy.place;
    (groups[place] ||= []).push(s.focused / Math.max(1, s.duration));
  });
  const ranked = Object.entries(groups)
    .filter(([, v]) => v.length >= 2)
    .map(([place, v]) => ({
      place,
      avg: v.reduce((a, b) => a + b, 0) / v.length,
    }))
    .sort((a, b) => b.avg - a.avg);
  if (ranked.length > 1)
    return `You reported ${Math.round(ranked[0].avg * 100)}% focus in ${ranked[0].place.toLowerCase()}. Try your next session there. This is an early pattern, not a prediction.`;
  return "Keep reflecting in different places to see which environments support your focus.";
}
export function validBackup(data) {
  return (
    data?.version === 1 &&
    Array.isArray(data.sessions) &&
    data.sessions.length < 10000 &&
    typeof data.name === "string" &&
    data.name.length <= 24 &&
    Number.isFinite(data.dailyGoal) &&
    data.dailyGoal >= 10 &&
    data.dailyGoal <= 240 &&
    Array.isArray(data.subjects) &&
    data.subjects.length > 0 &&
    data.subjects.length <= 12 &&
    data.subjects.every((s) => typeof s === "string" && s.length <= 30) &&
    ["ember", "dark", "forest", "neon"].includes(data.theme) &&
    Array.isArray(data.restDays) &&
    Array.isArray(data.friends) &&
    (!data.bonusXP ||
      (Array.isArray(data.bonusXP) &&
        data.bonusXP.every(
          (b) =>
            typeof b.id === "string" &&
            typeof b.day === "string" &&
            Number.isFinite(b.xp) &&
            b.xp >= 0 &&
            b.xp <= 15,
        ))) &&
    (!data.active ||
      (Array.isArray(data.active.events) &&
        data.active.events.length > 0 &&
        data.active.events.every(
          (e) => Number.isFinite(e.at) && typeof e.focused === "boolean",
        ) &&
        Number.isFinite(data.active.startedAt) &&
        [25, 45, 60].includes(data.active.planned))) &&
    data.sessions.every(
      (s) =>
        typeof s.id === "string" &&
        typeof s.day === "string" &&
        typeof s.subject === "string" &&
        [25, 45, 60].includes(s.planned) &&
        Number.isFinite(s.score) &&
        Number.isFinite(s.duration) &&
        s.duration >= 0 &&
        Number.isFinite(s.focused) &&
        s.focused >= 0 &&
        s.focused <= s.duration &&
        Number.isFinite(s.xp) &&
        s.xp >= 0 &&
        s.xp <= 300 &&
        Array.isArray(s.perMinute) &&
        s.perMinute.every(Number.isFinite) &&
        Array.isArray(s.events),
    )
  );
}
