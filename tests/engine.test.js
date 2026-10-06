import test from "node:test";
import assert from "node:assert/strict";
import * as E from "../src/engine.js";
const active = (events = [{ at: 0, focused: true }]) => ({
  subject: "Math",
  planned: 25,
  task: "Practice",
  startedAt: new Date("2026-10-05T12:00:00").getTime(),
  events,
  distractions: 0,
});
test("clock caps at planned duration even after device sleeps", () => {
  const a = active();
  assert.equal(E.secondsElapsed(a, a.startedAt + 3600000), 1500);
  assert.equal(E.secondsElapsed(a, a.startedAt - 1000), 0);
});
test("honest slips pause score and resume without retroactive points", () => {
  const a = active([
    { at: 0, focused: true },
    { at: 300, focused: false },
    { at: 480, focused: true },
  ]);
  assert.equal(E.focusedSeconds(a, 600), 420);
  assert.equal(E.scoreAt(a, 600), 28);
  assert.deepEqual(E.perMinute(a, 600), [4, 8, 12, 16, 20, 20, 20, 20, 24, 28]);
});
test("sessions under 10 minutes earn no XP even with task completed", () => {
  const a = active();
  const r = E.makeSession(
    E.freshState(),
    a,
    a.startedAt + 599000,
    true,
    "Two problems",
  );
  assert.equal(r.xp, 0);
  assert.equal(r.completed, false);
});
test("daily XP cap is applied after bonus and streak multipliers", () => {
  const a = active();
  const state = {
    ...E.freshState(),
    sessions: [{ day: E.dayKey(a.startedAt), xp: 295, duration: 1500 }],
  };
  const r = E.makeSession(state, a, a.startedAt + 1500000, true, "Done");
  assert.equal(r.xp, 5);
});
test("completed session scores and XP match focused minutes", () => {
  const a = active();
  const r = E.makeSession(
    E.freshState(),
    a,
    a.startedAt + 1500000,
    true,
    "Done",
  );
  assert.equal(r.xp, 55);
  assert.equal(r.score, 100);
  assert.equal(r.perMinute.length, 25);
  assert.equal(r.completed, true);
});
test("ghosts are separate for subject and planned length; early finishes cannot replace one", () => {
  const sessions = [
    { subject: "Math", planned: 25, completed: true, score: 88 },
    { subject: "Math", planned: 45, completed: true, score: 120 },
    { subject: "Math", planned: 25, completed: false, score: 99 },
    { subject: "History", planned: 25, completed: true, score: 100 },
  ];
  const state = { sessions };
  assert.equal(E.bestGhost(state, "Math", 25).score, 88);
  assert.equal(E.bestGhost(state, "Math", 45).score, 120);
  assert.equal(E.bestGhost(state, "Science", 25), null);
});
test("weekly rest day bridges a gap without inflating studied-day count", () => {
  const state = {
    ...E.freshState(),
    sessions: [
      { day: "2026-10-01", duration: 1500 },
      { day: "2026-10-03", duration: 1500 },
    ],
    restDays: ["2026-10-02"],
  };
  assert.equal(E.streak(state, "2026-10-03"), 2);
  assert.equal(E.streak(state, "2026-10-04"), 2);
  assert.equal(E.streak(state, "2026-10-05"), 0);
});
test("Monday boundaries and local dates handle calendar transitions", () => {
  assert.equal(E.monday(new Date("2026-10-05T12:00:00")), "2026-10-05");
  assert.equal(E.monday(new Date("2026-10-04T12:00:00")), "2026-09-28");
  assert.equal(E.shiftDay("2026-12-31", 1), "2027-01-01");
});
test("level costs increase as 100 × level ^ 1.5", () => {
  assert.equal(E.levelInfo(0).level, 1);
  assert.equal(E.levelInfo(100).level, 2);
  assert.equal(E.levelInfo(100).cost, 283);
  assert.equal(E.levelInfo(383).level, 3);
});
test("league week contains only current week sessions", () => {
  const state = {
    ...E.freshState(),
    sessions: [
      {
        day: "2026-10-04",
        focused: 1200,
        duration: 1500,
        xp: 40,
        completed: true,
      },
      {
        day: "2026-10-05",
        focused: 1500,
        duration: 1500,
        xp: 45,
        completed: true,
        beatGhost: true,
      },
    ],
  };
  const w = E.weeklyStats(state, "2026-10-05");
  assert.equal(w.focused, 25);
  assert.equal(w.xp, 45);
  assert.equal(E.leaguePoints(state, "2026-10-05"), 55);
});
test("invalid backups are rejected", () => {
  assert.equal(E.validBackup(E.freshState()), true);
  assert.equal(E.validBackup({ version: 1, sessions: [{}] }), false);
});
