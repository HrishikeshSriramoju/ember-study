import React, { useEffect, useState } from "react";
import {
  Handshake,
  Plus,
  Check,
  Share2,
  Heart,
  ArrowRight,
} from "lucide-react";
import * as C from "./cloud";
import * as E from "./engine";
export default function Pacts({ state, uid, onCode, onBonus, tell }) {
  const [pact, setPact] = useState(null),
    [checks, setChecks] = useState([]),
    [covers, setCovers] = useState([]),
    [input, setInput] = useState(""),
    [goal, setGoal] = useState("daily"),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const today = E.dayKey(),
    week = E.monday(),
    other = pact?.memberIds.find((id) => id !== uid),
    myCheck = checks.find((c) => c.uid === uid && c.day === today),
    theirCheck = checks.find((c) => c.uid === other && c.day === today),
    used = covers.some((c) => c.usedBy === uid && c.week === week),
    covered = covers.some((c) => c.coveredUid === other && c.day === today);
  useEffect(() => {
    if (!state.pactCode) return;
    setError("");
    return C.watchPact(state.pactCode, setPact, setChecks, setCovers, (e) =>
      setError(e.message),
    );
  }, [state.pactCode]);
  useEffect(() => {
    if (myCheck && theirCheck) onBonus(`${state.pactCode}-${today}`, today);
  }, [!!myCheck, !!theirCheck, today, state.pactCode]);
  async function task(fn) {
    setBusy(true);
    try {
      await fn();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  const focused =
    state.sessions
      .filter((s) => s.day === today)
      .reduce((n, s) => n + s.focused, 0) / 60;
  const eligible =
    pact?.goal === "weekly"
      ? E.weeklyStats(state).focused >= 180
      : state.sessions.some((s) => s.day === today && s.duration >= 600);
  let sharedStreak = 0,
    key = today;
  const counts = (day) =>
    pact?.memberIds.length === 2 &&
    pact.memberIds.every(
      (id) =>
        checks.some((c) => c.uid === id && c.day === day) ||
        covers.some((c) => c.coveredUid === id && c.day === day),
    );
  if (!counts(key)) key = E.shiftDay(key, -1);
  while (counts(key)) {
    sharedStreak++;
    key = E.shiftDay(key, -1);
  }
  return (
    <section className="card pact-card">
      <div className="card-title">
        <h3>
          <Handshake size={20} />A promise to show up
        </h3>
        {pact && <span className="mini-pill">{sharedStreak} SHARED DAYS</span>}
      </div>
      {error && <p className="error">{error}</p>}
      {!state.pactCode ? (
        <>
          <p>
            Set a small shared goal with one friend. Both check-ins earn up to
            15 bonus XP each day.
          </p>
          <div className="pact-create">
            <select
              aria-label="Pact goal"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
            >
              <option value="daily">
                One session a day (at least 10 minutes)
              </option>
              <option value="weekly">3 focused hours this week</option>
            </select>
            <button
              className="primary"
              disabled={busy}
              onClick={() =>
                task(async () => onCode(await C.createPact(state.name, goal)))
              }
            >
              <Plus size={16} />
              Create a pact
            </button>
          </div>
          <div className="input-row">
            <input
              aria-label="Pact code"
              placeholder="Or enter a PACT code"
              value={input}
              onChange={(e) => setInput(e.target.value.toUpperCase())}
              maxLength={20}
            />
            <button
              className="secondary"
              disabled={busy || !input.trim()}
              onClick={() =>
                task(async () => onCode(await C.joinPact(input, state.name)))
              }
            >
              Join
              <ArrowRight size={15} />
            </button>
          </div>
        </>
      ) : pact ? (
        <>
          <div className="pact-meta">
            <b>{pact.code}</b>
            <span>
              {pact.goal === "daily"
                ? "One session a day"
                : "3 focused hours a week"}
            </span>
          </div>
          <div className="pact-people">
            {pact.memberIds.map((id) => (
              <div key={id}>
                <span className="avatar">{pact.names[id]?.[0] || "?"}</span>
                <b>
                  {pact.names[id]}
                  {id === uid ? " (you)" : ""}
                </b>
                <span>
                  {checks.some((c) => c.uid === id && c.day === today)
                    ? "Checked in ✓"
                    : covers.some((c) => c.coveredUid === id && c.day === today)
                      ? "Covered with care"
                      : "A fresh chance today"}
                </span>
              </div>
            ))}
            {!other && (
              <p>Share {pact.code} with your friend so they can join.</p>
            )}
          </div>
          <div className="button-row">
            <button
              className="primary"
              disabled={busy || !!myCheck || !eligible}
              onClick={() =>
                task(async () => {
                  await C.checkInPact(
                    pact.code,
                    today,
                    pact.goal === "weekly"
                      ? E.weeklyStats(state).focused
                      : focused,
                  );
                  tell("Pact check-in saved.");
                })
              }
            >
              <Check size={16} />
              {myCheck
                ? "You checked in"
                : eligible
                  ? "Check in today"
                  : pact.goal === "weekly"
                    ? "Reach 3 hours to check in"
                    : "Study 10 minutes to check in"}
            </button>
            {other && (
              <button
                className="secondary"
                disabled={busy || used || !!theirCheck || covered}
                onClick={() =>
                  task(async () => {
                    await C.coverPact(pact.code, other, today, week);
                    tell("You covered your friend. One small act of care.");
                  })
                }
              >
                <Heart size={16} />
                {used ? "Weekly cover used" : "Cover for you"}
              </button>
            )}
            <button
              className="secondary"
              onClick={() =>
                task(async () => {
                  const text = other
                    ? `A gentle nudge from Ember: let’s show up for our ${pact.goal === "daily" ? "daily session" : "weekly focus goal"} today. Pact ${pact.code}.`
                    : `Study with me on Ember. Join my pact with code ${pact.code}: ${location.origin}`;
                  if (navigator.share)
                    await navigator.share({ title: "Our Ember pact", text });
                  else {
                    await navigator.clipboard.writeText(text);
                    tell("Pact message copied.");
                  }
                })
              }
            >
              <Share2 size={16} />
              {other ? "Share a gentle nudge" : "Share pact code"}
            </button>
          </div>
          <p className="quiet-text">
            One cover token per person per week protects a friend’s shared
            streak. A cover earns no check-in XP. Messages are sent only when
            you choose a recipient in your device’s share menu.
          </p>
          <button
            className="text-button"
            onClick={() => {
              onCode(null);
              setPact(null);
              setChecks([]);
              setCovers([]);
            }}
          >
            Hide this pact from this device
          </button>
        </>
      ) : (
        <p>Loading your pact…</p>
      )}
    </section>
  );
}
