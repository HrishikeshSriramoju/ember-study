import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { Chart, registerables } from "chart.js";
import html2canvas from "html2canvas";
import {
  Flame,
  LayoutDashboard,
  Ghost,
  Trophy,
  Users,
  BarChart3,
  ArrowUpRight,
  ArrowRight,
  Play,
  Plus,
  X,
  Check,
  ChevronLeft,
  ChevronRight,
  Settings,
  Download,
  Upload,
  Smartphone,
  Share2,
  Clock,
  Target,
  Zap,
  Coffee,
  Brain,
  CheckCircle2,
  LockKeyhole,
  Volume2,
  VolumeX,
  Copy,
  Radio,
  Sparkles,
  BookOpen,
  AlertCircle,
  Leaf,
} from "lucide-react";
import * as E from "./engine";
import * as C from "./cloud";
import "./style.css";
import Pacts from "./Pacts";
Chart.register(...registerables);
const STORAGE = "ember-study-v1";
function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE));
    if (!E.validBackup(saved)) return E.freshState();
    if (saved.active) {
      const a = saved.active;
      const last = Math.max(
        a.events.at(-1)?.at || 0,
        E.secondsElapsed(a, a.lastSeenAt || a.startedAt),
      );
      saved.active = {
        ...a,
        events: a.events.at(-1)?.focused
          ? [...a.events, { at: last, focused: false }]
          : a.events,
      };
    }
    return saved;
  } catch {
    return E.freshState();
  }
}
const niceMinutes = (n) =>
  n >= 60
    ? `${Math.floor(n / 60)}h ${Math.round(n % 60)}m`
    : `${Math.round(n)}m`;
const timerText = (n) =>
  `${String(Math.floor(n / 60)).padStart(2, "0")}:${String(Math.floor(n % 60)).padStart(2, "0")}`;
const weekday = (key) =>
  new Date(`${key}T12:00:00`).toLocaleDateString(undefined, {
    weekday: "short",
  });
const prettyDate = (key) =>
  new Date(`${key}T12:00:00`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
const subjectStyle = (name) =>
  E.SUBJECTS.find((s) => s.name === name) || {
    name,
    color: "#b7cba5",
    symbol: name.slice(0, 2),
  };
function Icon({ name, ...props }) {
  const Map = {
    flame: Flame,
    ghost: Ghost,
    streak: Zap,
    brain: Brain,
    trophy: Trophy,
    check: CheckCircle2,
  };
  const Component = Map[name] || Flame;
  return <Component {...props} />;
}
function FlameArt() {
  return (
    <svg className="flame-art" viewBox="0 0 300 280" aria-hidden="true">
      <defs>
        <linearGradient id="fire" x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#f6d2a2" />
          <stop offset="1" stopColor="#ec926c" />
        </linearGradient>
      </defs>
      <ellipse cx="155" cy="258" rx="73" ry="9" fill="#111c15" opacity=".3" />
      <circle
        cx="154"
        cy="138"
        r="109"
        fill="none"
        stroke="#94a28d"
        strokeDasharray="3 10"
        opacity=".3"
      />
      <circle
        cx="154"
        cy="138"
        r="85"
        fill="none"
        stroke="#94a28d"
        opacity=".16"
      />
      <path
        d="M168 20c24 90-79 99-39 165 20-34 34-44 37-79 79 65 104 107 70 154-42 49-130 40-157-13-35-62 6-104 37-148-5 58 17 75 17 75-20-87 29-98 35-154Z"
        transform="translate(0,-16)"
        fill="url(#fire)"
      />
      <path
        d="M159 179c26 26 40 40 28 65-11 25-48 28-60 3-15-25 19-51 32-68Z"
        fill="#ffefd0"
      />
      <path d="M240 67l5 12 12 5-12 4-5 12-4-12-12-4 12-5Z" fill="#c7d4b9" />
      <circle cx="65" cy="169" r="4" fill="#c7d4b9" />
      <circle cx="220" cy="207" r="3" fill="#dba77a" />
      <path d="M68 50l3 7 7 3-7 3-3 7-3-7-7-3 7-3Z" fill="#c7d4b9" />
    </svg>
  );
}
function Graph({ labels, series, type = "line", height = 180 }) {
  const ref = useRef();
  useEffect(() => {
    const chart = new Chart(ref.current, {
      type,
      data: {
        labels,
        datasets: series.map((s) => ({
          ...s,
          borderWidth: 2,
          pointRadius: 0,
          tension: 0.35,
          borderRadius: 5,
        })),
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        plugins: {
          legend: { display: false },
          tooltip: { mode: "index", intersect: false },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: "#858b83", maxTicksLimit: 7 },
            border: { display: false },
          },
          y: {
            beginAtZero: true,
            grid: { color: "rgba(125,135,120,.1)" },
            border: { display: false },
            ticks: { color: "#858b83", maxTicksLimit: 4 },
          },
        },
      },
    });
    return () => chart.destroy();
  }, [JSON.stringify(labels), JSON.stringify(series), type]);
  return (
    <div style={{ height }}>
      <canvas
        ref={ref}
        role="img"
        aria-label={series.map((s) => s.label).join(" and ") + " chart"}
      />
    </div>
  );
}
function Modal({ title, onClose, children, wide = false }) {
  const ref = useRef();
  useEffect(() => {
    const old = document.activeElement;
    const el = ref.current;
    el?.focus();
    const key = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab") {
        const items = [
          ...el.querySelectorAll("button,input,select,textarea,a[href]"),
        ].filter((x) => !x.disabled);
        if (!items.length) {
          e.preventDefault();
          return;
        }
        if (e.shiftKey && document.activeElement === items[0]) {
          e.preventDefault();
          items.at(-1).focus();
        } else if (!e.shiftKey && document.activeElement === items.at(-1)) {
          e.preventDefault();
          items[0].focus();
        }
      }
    };
    document.addEventListener("keydown", key);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", key);
      document.body.style.overflow = "";
      old?.focus();
    };
  }, []);
  return (
    <div
      className="overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <section
        ref={ref}
        tabIndex={-1}
        className={`modal ${wide ? "wide" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <header>
          <h2>{title}</h2>
          <button
            className="icon-btn"
            aria-label="Close dialog"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </header>
        {children}
      </section>
    </div>
  );
}
function App() {
  const [state, setState] = useState(load),
    [page, setPage] = useState("home"),
    [modal, setModal] = useState(null),
    [toast, setToast] = useState(""),
    [now, setNow] = useState(Date.now()),
    [result, setResult] = useState(null),
    [checkin, setCheckin] = useState(
      () => !!state.active && !state.active.events.at(-1).focused,
    ),
    [cloud, setCloud] = useState(null),
    [cloudError, setCloudError] = useState(""),
    [busy, setBusy] = useState(false),
    [room, setRoom] = useState(null),
    [members, setMembers] = useState([]),
    [roomError, setRoomError] = useState(""),
    [installPrompt, setInstallPrompt] = useState(null),
    [sound, setSound] = useState(false);
  const stateRef = useRef(state),
    finishRef = useRef(false),
    roomStart = useRef(null),
    reportRef = useRef(),
    audioRef = useRef(null),
    wakeRef = useRef(null);
  stateRef.current = state;
  const tell = (message) => setToast(message);
  useEffect(() => {
    let id = setTimeout(() => setToast(""), 4500);
    return () => clearTimeout(id);
  }, [toast]);
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE, JSON.stringify(state));
    } catch {
      tell("Storage is full or unavailable. Export a backup in Settings.");
    }
    document.documentElement.dataset.theme = state.theme;
  }, [state]);
  useEffect(() => {
    const id = setInterval(() => {
      setNow(Date.now());
      const s = stateRef.current;
      if (s.active) {
        try {
          localStorage.setItem(
            STORAGE,
            JSON.stringify({
              ...s,
              active: { ...s.active, lastSeenAt: Date.now() },
            }),
          );
        } catch {}
      }
    }, 1000);
    const install = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", install);
    if ("serviceWorker" in navigator && import.meta.env.PROD)
      navigator.serviceWorker
        .register("/sw.js")
        .catch(() =>
          tell("Offline setup failed. You can still use Ember online."),
        );
    return () => {
      clearInterval(id);
      window.removeEventListener("beforeinstallprompt", install);
    };
  }, []);
  useEffect(() => {
    if (!C.cloudConfigured) return;
    C.connectCloud(stateRef.current.name)
      .then(setCloud)
      .catch((e) => setCloudError(e.message));
  }, []);
  useEffect(() => {
    if (!room?.code) return;
    return C.watchRoom(room.code, setRoom, setMembers, (e) =>
      setRoomError(e.message),
    );
  }, [room?.code]);
  const active = state.active,
    elapsed = active ? E.secondsElapsed(active, now) : 0,
    score = active ? E.scoreAt(active, elapsed) : 0,
    level = E.levelInfo(E.totalXP(state)),
    streak = E.streak(state),
    week = E.weeklyStats(state),
    today = E.dayKey(now),
    todaySessions = state.sessions.filter((s) => s.day === today),
    todayFocus = todaySessions.reduce((n, s) => n + s.focused, 0) / 60;
  useEffect(() => {
    if (!active) return;
    if (elapsed >= active.planned * 60 && !finishRef.current) {
      finishRef.current = true;
      setModal("finish");
    }
    const due = (active.lastCheck || 0) + 300;
    if (elapsed >= due && due < active.planned * 60) {
      setState((s) => ({
        ...s,
        active: {
          ...E.setFocus(s.active, false, s.active.startedAt + due * 1000),
          lastCheck: due,
          distractions: s.active.distractions,
        },
      }));
      setCheckin(true);
    }
  }, [elapsed, active?.lastCheck]);
  useEffect(() => {
    const visibility = () => {
      if (document.hidden && stateRef.current.active) {
        setState((s) => ({ ...s, active: E.setFocus(s.active, false) }));
      } else if (!document.hidden) {
        setNow(Date.now());
        if (
          stateRef.current.active &&
          !stateRef.current.active.events.at(-1).focused
        )
          setCheckin(true);
      }
    };
    const leaving = () => {
      const s = stateRef.current;
      if (s.active) {
        const updated = E.setFocus(s.active, false);
        try {
          localStorage.setItem(
            STORAGE,
            JSON.stringify({ ...s, active: updated }),
          );
        } catch {}
      }
    };
    document.addEventListener("visibilitychange", visibility);
    window.addEventListener("pagehide", leaving);
    return () => {
      document.removeEventListener("visibilitychange", visibility);
      window.removeEventListener("pagehide", leaving);
    };
  }, []);
  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    async function lock() {
      try {
        const lock = await navigator.wakeLock?.request("screen");
        if (cancelled) lock?.release();
        else wakeRef.current = lock;
      } catch {}
    }
    lock();
    const visible = () => {
      if (!document.hidden) lock();
    };
    document.addEventListener("visibilitychange", visible);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", visible);
      wakeRef.current?.release();
    };
  }, [active?.startedAt]);
  useEffect(() => {
    if (active?.room && cloud && elapsed % 10 === 0)
      C.sendScore(active.room, score).catch((e) => setRoomError(e.message));
  }, [elapsed]);
  useEffect(() => {
    if (room?.startedAt && roomStart.current !== room.code) {
      roomStart.current = room.code;
      begin({
        subject: room.subject,
        planned: room.planned,
        task: "",
        room: room.code,
        startedAt: room.startedAt.toMillis(),
      });
    }
  }, [room?.startedAt]);
  useEffect(() => {
    if (!sound) {
      audioRef.current?.close().catch(() => {});
      audioRef.current = null;
      return;
    }
    try {
      const context = new (window.AudioContext || window.webkitAudioContext)();
      const buffer = context.createBuffer(
          1,
          context.sampleRate * 3,
          context.sampleRate,
        ),
        data = buffer.getChannelData(0);
      let last = 0;
      for (let i = 0; i < data.length; i++) {
        last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02;
        data[i] = last * 3;
      }
      const node = context.createBufferSource();
      node.buffer = buffer;
      node.loop = true;
      const gain = context.createGain();
      gain.gain.value = 0.16;
      node.connect(gain).connect(context.destination);
      node.start();
      audioRef.current = context;
    } catch {
      tell("Ambient audio is unavailable in this browser.");
    }
    return () => {
      audioRef.current?.close().catch(() => {});
      audioRef.current = null;
    };
  }, [sound]);
  function begin(options) {
    if (stateRef.current.active) return;
    finishRef.current = false;
    const ghost =
      options.ghost ||
      E.bestGhost(stateRef.current, options.subject, options.planned);
    setState((s) => ({
      ...s,
      active: {
        ...options,
        ghost: ghost
          ? { perMinute: ghost.perMinute, score: ghost.score }
          : null,
        ghostName: options.ghostName || "Your ghost",
        startedAt: options.startedAt || Date.now(),
        events: [{ at: 0, focused: true }],
        distractions: 0,
        lastSeenAt: Date.now(),
        lastCheck: 0,
      },
    }));
    setPage("session");
    setModal(null);
    setResult(null);
  }
  function finish(taskDone, proof) {
    const current = stateRef.current;
    if (!current.active) return;
    const session = E.makeSession(
      current,
      current.active,
      Date.now(),
      taskDone,
      proof,
    );
    const next = {
      ...current,
      sessions: [...current.sessions, session],
      active: null,
    };
    setState(next);
    setResult(session);
    setPage("results");
    setModal(null);
    setCheckin(false);
    setSound(false);
    if (session.duration < 600)
      tell("Saved your reflection. Sessions under 10 minutes earn no XP.");
    if (current.active.room)
      C.sendScore(current.active.room, session.score, true).catch((e) =>
        setRoomError(e.message),
      );
    if (cloud) C.publishProgress(next).catch((e) => setCloudError(e.message));
  }
  async function task(fn) {
    setBusy(true);
    try {
      await fn();
    } catch (e) {
      tell(e.message);
    } finally {
      setBusy(false);
    }
  }
  function exportBackup() {
    downloadBlob(
      new Blob([JSON.stringify({ ...state, active: null }, null, 2)], {
        type: "application/json",
      }),
      `ember-backup-${today}.json`,
    );
    tell("Backup downloaded.");
  }
  function takeRest() {
    if (
      state.restDays.some(
        (day) => E.monday(new Date(day + "T12:00:00")) === E.monday(),
      )
    )
      return tell("You already used this week’s rest day.");
    setState((s) => ({ ...s, restDays: [...s.restDays, today] }));
    tell("Rest day saved. Your streak has room to breathe.");
  }
  async function shareReport() {
    const canvas = await html2canvas(reportRef.current, {
      scale: 2,
      backgroundColor: state.theme === "ember" ? "#f7f7f0" : "#171b1a",
    });
    const blob = await new Promise((resolve) =>
      canvas.toBlob(resolve, "image/png"),
    );
    const file = new File([blob], `ember-week-${E.monday()}.png`, {
      type: "image/png",
    });
    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: "My week with Ember" });
      } catch (e) {
        if (e.name !== "AbortError") downloadBlob(blob, file.name);
      }
    } else downloadBlob(blob, file.name);
  }
  const nav = [
    ["home", LayoutDashboard, "Overview"],
    ["ghosts", Ghost, "My ghosts"],
    ["rewards", Trophy, "Rewards"],
    ["report", BarChart3, "Weekly report"],
    ["friends", Users, "Study circle"],
  ];
  return (
    <div className="app">
      <aside className="sidebar">
        <a
          className="brand"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            setPage("home");
          }}
        >
          <span className="brand-mark">
            <Flame size={25} fill="currentColor" />
          </span>
          ember<span className="brand-dot">.</span>
        </a>
        <div className="nav-label">YOUR STUDY SPACE</div>
        <nav>
          {nav.map(([id, I, label]) => (
            <button
              key={id}
              className={page === id ? "selected" : ""}
              onClick={() => setPage(id)}
            >
              <I size={19} />
              <span>{label}</span>
              {id === "friends" && (
                <span className="nav-badge">{state.friends.length}</span>
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="small-note">
            <Leaf size={22} />
            <p>
              A little focus.
              <br />A little more you.
            </p>
          </div>
          <button className="nav-setting" onClick={() => setModal("install")}>
            <Smartphone size={18} />
            Get the app
            <ArrowUpRight size={16} />
          </button>
          <button className="profile" onClick={() => setModal("settings")}>
            <span className="avatar">
              {state.name ? state.name[0].toUpperCase() : "Y"}
            </span>
            <span>
              <b>{state.name || "Your space"}</b>
              <small>
                Level {level.level} · {cloud ? "Connected" : "On this device"}
              </small>
            </span>
            <Settings size={17} />
          </button>
        </div>
      </aside>
      <div className="main">
        <header className="topbar">
          <span className="breadcrumb">
            Your space <span>/</span>{" "}
            {nav.find((n) => n[0] === page)?.[2] || "Focus session"}
          </span>
          <a className="mobile-brand" onClick={() => setPage("home")}>
            <Flame size={22} />
            ember.
          </a>
          <div className="top-actions">
            <span className="date">
              {new Date(now).toLocaleDateString(undefined, {
                weekday: "short",
                month: "short",
                day: "numeric",
              })}
            </span>
            <button
              className="streak-pill"
              onClick={takeRest}
              title="Use your weekly rest day"
            >
              <Flame size={16} />
              {streak} day streak
            </button>
            <button
              className="icon-btn"
              aria-label="Settings"
              onClick={() => setModal("settings")}
            >
              <Settings size={19} />
            </button>
          </div>
        </header>
        {active && page !== "session" && (
          <button className="active-banner" onClick={() => setPage("session")}>
            <Radio size={16} />
            Your {active.subject} session is running ·{" "}
            {timerText(active.planned * 60 - elapsed)} remaining
            <ArrowRight size={16} />
          </button>
        )}
        <main>
          {page === "home" && (
            <>
              <div className="page-heading">
                <div>
                  <div className="eyebrow">MAKE ROOM FOR YOUR BEST SELF</div>
                  <h1>
                    {greeting(now)}
                    {state.name ? `, ${state.name}` : ""}
                    <span className="heading-dot">.</span>
                  </h1>
                  <p>
                    No pressure. Just you, your ghost, and a little momentum.
                  </p>
                </div>
                <button
                  className="secondary desktop-only"
                  onClick={() => setModal("setup")}
                >
                  <Plus size={17} />
                  New session
                </button>
              </div>
              <div className="home-grid">
                <section className="hero">
                  <div className="hero-copy">
                    <span className="hero-chip">
                      <span />A FRESH SPARK, EVERY DAY
                    </span>
                    <h2>
                      Your only competition?
                      <br />
                      <em>You, yesterday.</em>
                    </h2>
                    <p>
                      Find your rhythm. Race your ghost.
                      <br />
                      Build focus that feels like you.
                    </p>
                    <button
                      className="light-button"
                      onClick={() =>
                        active ? setPage("session") : setModal("setup")
                      }
                    >
                      <Play size={16} fill="currentColor" />
                      {active ? "Back to session" : "Let’s lock in"}
                      <ArrowRight size={18} />
                    </button>
                    <small>25 minutes is a great place to start.</small>
                  </div>
                  <FlameArt />
                </section>
                <section className="card daily-card">
                  <div className="card-title">
                    <h3>Today’s intention</h3>
                    <Target size={18} />
                  </div>
                  <div
                    className="goal-ring"
                    style={{
                      "--progress": `${Math.min(100, (todayFocus / state.dailyGoal) * 100)}%`,
                    }}
                  >
                    <div>
                      <b>
                        {Math.round(todayFocus)}
                        <span>/{state.dailyGoal}</span>
                      </b>
                      <small>FOCUSED MINUTES</small>
                    </div>
                  </div>
                  <p>
                    {todayFocus >= state.dailyGoal
                      ? "You showed up. That’s what matters."
                      : "Small steps. Real progress."}
                  </p>
                  <button
                    className="text-button"
                    onClick={() => setModal("settings")}
                  >
                    Adjust your goal
                    <ArrowRight size={14} />
                  </button>
                </section>
                <section className="card journey-card">
                  <div className="card-title">
                    <h3>Your spark is growing</h3>
                    <span className="mini-pill">LEVEL {level.level}</span>
                  </div>
                  <div className="level-row">
                    <div className="level-icon">
                      <Flame size={26} />
                    </div>
                    <div>
                      <b>
                        {level.level < 3
                          ? "The beginning of something good"
                          : level.level < 7
                            ? "Finding your rhythm"
                            : "A steady flame"}
                      </b>
                      <p>
                        {Math.round(level.cost - level.current)} XP to level{" "}
                        {level.level + 1}
                      </p>
                    </div>
                    <strong>
                      {level.current}
                      <span> / {level.cost} XP</span>
                    </strong>
                  </div>
                  <div className="progress">
                    <i style={{ width: `${level.progress * 100}%` }} />
                  </div>
                  <div className="journey-foot">
                    <span>
                      <Sparkles size={14} />
                      Every honest minute counts.
                    </span>
                    <button
                      className="text-button"
                      onClick={() => setPage("rewards")}
                    >
                      View rewards
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </section>
              </div>
              <div className="stats-grid">
                <Stat
                  icon={Clock}
                  label="Focused this week"
                  value={niceMinutes(week.focused)}
                  detail="Time you made for yourself"
                />
                <Stat
                  icon={CheckCircle2}
                  label="Sessions completed"
                  value={week.completed}
                  detail="One step at a time"
                />
                <Stat
                  icon={Ghost}
                  label="Ghosts beaten"
                  value={week.wins}
                  detail="Progress over perfection"
                />
                <Stat
                  icon={Zap}
                  label="XP this week"
                  value={week.xp}
                  detail={`${todaySessions.reduce((n, s) => n + s.xp, 0) + (state.bonusXP || []).filter((b) => b.day === today).reduce((n, b) => n + b.xp, 0)} / 300 earned today`}
                />
              </div>
              <div className="section-heading">
                <h2>Pick up where you left off</h2>
                <button
                  className="text-button"
                  onClick={() => setPage("ghosts")}
                >
                  All subjects
                  <ArrowUpRight size={15} />
                </button>
              </div>
              <div className="subject-grid">
                {state.subjects.slice(0, 3).map((subject) => {
                  const style = subjectStyle(subject),
                    best = E.bestGhost(state, subject, 25),
                    last = state.sessions
                      .filter((s) => s.subject === subject)
                      .at(-1);
                  return (
                    <button
                      className="card subject-card"
                      key={subject}
                      onClick={() => setModal({ type: "setup", subject })}
                    >
                      <span
                        className="subject-symbol"
                        style={{ background: style.color }}
                      >
                        {style.symbol}
                      </span>
                      <ArrowUpRight className="subject-arrow" size={19} />
                      <h3>{subject}</h3>
                      <p>
                        {last
                          ? `Last session · ${prettyDate(last.day)}`
                          : "Your next chapter starts here"}
                      </p>
                      <div>
                        <Ghost size={15} />
                        {best
                          ? `25m ghost · ${best.score} points`
                          : "No ghost yet. Make your first."}
                      </div>
                    </button>
                  );
                })}
              </div>
              <div className="bottom-grid">
                <section className="card activity-card">
                  <div className="card-title">
                    <h3>A week of showing up</h3>
                    <span className="muted">FOCUSED MINUTES</span>
                  </div>
                  <Graph
                    type="bar"
                    labels={week.days.map((d) => weekday(d.day))}
                    series={[
                      {
                        label: "Focused minutes",
                        data: week.days.map((d) => Math.round(d.minutes)),
                        backgroundColor: week.days.map((d) =>
                          d.day === today ? "#ebaa87" : "#b8c8ab",
                        ),
                      },
                    ]}
                    height={155}
                  />
                </section>
                <section className="card insight-card">
                  <span className="insight-icon">
                    <Brain size={22} />
                  </span>
                  <div className="eyebrow">A NOTE TO YOURSELF</div>
                  <h3>Honesty is a superpower.</h3>
                  <p>{E.insights(state)}</p>
                  <button
                    className="text-button"
                    onClick={() => setPage("ghosts")}
                  >
                    Explore your sessions
                    <ArrowRight size={15} />
                  </button>
                </section>
              </div>
              <p className="footer-quote">
                “You don’t have to be perfect. You just have to begin.”{" "}
                <span>— A reminder from Ember</span>
              </p>
            </>
          )}
          {page === "session" &&
            (active ? (
              <Session
                active={active}
                elapsed={elapsed}
                score={score}
                sound={sound}
                toggleSound={() => setSound((v) => !v)}
                members={members}
                room={room}
                onSlip={() => {
                  setState((s) => ({
                    ...s,
                    active: E.setFocus(
                      s.active,
                      !s.active.events.at(-1).focused,
                    ),
                  }));
                }}
                onEnd={() => setModal("finish")}
              />
            ) : (
              <Empty
                icon={Flame}
                title="A little focus starts here"
                description="Pick a subject, set an intention, and meet your ghost."
                action={() => setModal("setup")}
                actionLabel="Start a session"
              />
            ))}
          {page === "results" && result && (
            <Results
              result={result}
              onHome={() => setPage("home")}
              onReflect={() => setModal("reflect")}
            />
          )}
          {page === "ghosts" && (
            <>
              <Heading
                eyebrow="YOUR PAST SELF, IN YOUR CORNER"
                title="Meet your ghosts."
                description="A personal best for every subject and session length."
              />
              <div className="ghost-grid">
                {state.subjects.map((subject) => (
                  <section className="card ghost-card" key={subject}>
                    <div className="card-title">
                      <span
                        className="subject-symbol"
                        style={{ background: subjectStyle(subject).color }}
                      >
                        {subjectStyle(subject).symbol}
                      </span>
                      <h3>{subject}</h3>
                    </div>
                    {[25, 45, 60].map((minutes) => {
                      const ghost = E.bestGhost(state, subject, minutes);
                      return (
                        <button
                          className="ghost-option"
                          key={minutes}
                          onClick={() =>
                            setModal({
                              type: "setup",
                              subject,
                              planned: minutes,
                            })
                          }
                        >
                          <span>
                            <Clock size={15} />
                            {minutes} min
                          </span>
                          <b>
                            {ghost
                              ? `${ghost.score} pts`
                              : "Set your first ghost"}
                          </b>
                          <ArrowRight size={15} />
                        </button>
                      );
                    })}
                  </section>
                ))}
              </div>
              <div className="section-heading">
                <h2>Your session journal</h2>
                <span className="muted">Distractions stay private.</span>
              </div>
              {state.sessions.length ? (
                <div className="card journal">
                  {[...state.sessions]
                    .reverse()
                    .slice(0, 30)
                    .map((s) => (
                      <button
                        className="journal-row"
                        key={s.id}
                        onClick={() => {
                          setResult(s);
                          setPage("results");
                        }}
                      >
                        <span
                          className="subject-symbol"
                          style={{ background: subjectStyle(s.subject).color }}
                        >
                          {subjectStyle(s.subject).symbol}
                        </span>
                        <span>
                          <b>{s.subject}</b>
                          <small>
                            {prettyDate(s.day)} · {niceMinutes(s.duration / 60)}{" "}
                            {s.completed ? "" : "· Ended early"}
                          </small>
                        </span>
                        <span className="journal-proof">
                          {s.proof || s.task || "Made time to focus"}
                        </span>
                        <span>
                          <b>
                            {Math.round(
                              (s.focused / Math.max(1, s.duration)) * 100,
                            )}
                            % focus
                          </b>
                          <small>+{s.xp} XP</small>
                        </span>
                        <ChevronRight size={17} />
                      </button>
                    ))}
                </div>
              ) : (
                <Empty
                  icon={BookOpen}
                  title="A blank page, full of possibility"
                  description="Your sessions and reflections will live here."
                  action={() => setModal("setup")}
                  actionLabel="Begin your first session"
                />
              )}
            </>
          )}
          {page === "rewards" && (
            <>
              <Heading
                eyebrow="BUILT ONE HONEST MINUTE AT A TIME"
                title="Keep your spark."
                description="Celebrate showing up. A perfect score isn’t the goal."
              />
              <section className="card reward-level">
                <span className="big-flame">
                  <Flame size={44} />
                </span>
                <div>
                  <span className="eyebrow">LEVEL {level.level}</span>
                  <h2>{E.totalXP(state).toLocaleString()} total XP</h2>
                  <p>
                    {level.current} / {level.cost} XP toward level{" "}
                    {level.level + 1}
                  </p>
                  <div className="progress">
                    <i style={{ width: `${level.progress * 100}%` }} />
                  </div>
                </div>
              </section>
              <div className="section-heading">
                <h2>Little milestones. Big meaning.</h2>
                <span className="muted">
                  {E.badgeList(state).filter((b) => b.earned).length} of{" "}
                  {E.badgeList(state).length} unlocked
                </span>
              </div>
              <div className="badge-grid">
                {E.badgeList(state).map((b) => (
                  <section
                    className={`card badge-card ${b.earned ? "earned" : "locked"}`}
                    key={b.id}
                  >
                    <span className="badge-icon">
                      <Icon name={b.icon} size={28} />
                    </span>
                    <h3>{b.name}</h3>
                    <p>{b.desc}</p>
                    <small>
                      {b.earned ? (
                        <>
                          <Check size={14} />
                          Earned
                        </>
                      ) : (
                        <>
                          <LockKeyhole size={13} />
                          Keep growing
                        </>
                      )}
                    </small>
                  </section>
                ))}
              </div>
              <div className="section-heading">
                <h2>Make it feel like you</h2>
              </div>
              <div className="theme-grid">
                {[
                  ["ember", 1, "Ember", "#e8e9dc"],
                  ["dark", 3, "After hours", "#252a29"],
                  ["forest", 7, "Forest", "#324c3e"],
                  ["neon", 12, "Neon", "#302841"],
                ].map(([id, required, name, color]) => (
                  <button
                    className={`card theme-card ${state.theme === id ? "chosen" : ""}`}
                    key={id}
                    disabled={level.level < required}
                    onClick={() => setState((s) => ({ ...s, theme: id }))}
                  >
                    <span style={{ background: color }}>
                      <Flame size={28} />
                    </span>
                    <b>{name}</b>
                    <small>
                      {level.level < required
                        ? `Unlock at level ${required}`
                        : state.theme === id
                          ? "Your current theme"
                          : "Use this theme"}
                    </small>
                  </button>
                ))}
              </div>
              <p className="quiet-text">
                1 XP per focused minute · 10 per completed task · 20 per
                completed session.
                <br />
                Streak boosts: ×1.1 at 3 days, ×1.25 at 7, ×1.5 at 14. Daily XP
                is capped at 300.
              </p>
            </>
          )}
          {page === "report" && (
            <>
              <div className="page-heading">
                <Heading
                  eyebrow="TAKE A MOMENT TO LOOK BACK"
                  title="Your week, in focus."
                  description="Not a grade. A little reminder of how far you’ve come."
                />
                <button
                  className="secondary"
                  disabled={busy}
                  onClick={() => task(shareReport)}
                >
                  <Share2 size={16} />
                  Share report
                </button>
              </div>
              <WeeklyReport state={state} reportRef={reportRef} />
              <p className="quiet-text">
                Your report updates all week. Export it on Sunday for a finished
                keepsake.
              </p>
            </>
          )}
          {page === "friends" && (
            <>
              <Heading
                eyebrow="A LITTLE BETTER, TOGETHER"
                title="Your study circle."
                description="Race a saved ghost or make room for a shared focus session."
              />
              {!cloud ? (
                <section className="card cloud-connect">
                  <Users size={35} />
                  <h2>
                    {cloudError
                      ? "Firebase needs a setup step"
                      : "Connecting your study circle…"}
                  </h2>
                  <p>
                    {cloudError ||
                      "Anonymous sign-in keeps email addresses out of your study circle."}
                  </p>
                  <p className="quiet-text">
                    Solo study works offline while your cloud connection is
                    unavailable.
                  </p>
                  <button
                    className="secondary"
                    disabled={busy}
                    onClick={() =>
                      task(async () => {
                        const connected = await C.connectCloud(state.name);
                        setCloud(connected);
                        setCloudError("");
                      })
                    }
                  >
                    Try connecting
                  </button>
                </section>
              ) : (
                <>
                  <section className="card friend-code">
                    <div>
                      <span className="eyebrow">YOUR FRIEND CODE</span>
                      <h2>{cloud.code}</h2>
                      <p>
                        Share your code. Keep your distractions to yourself.
                      </p>
                    </div>
                    <button
                      className="secondary"
                      onClick={() =>
                        task(async () => {
                          await navigator.clipboard.writeText(cloud.code);
                          tell("Friend code copied.");
                        })
                      }
                    >
                      <Copy size={16} />
                      Copy code
                    </button>
                  </section>
                  <div className="friend-controls">
                    <button
                      className="primary"
                      onClick={() => setModal("add-friend")}
                    >
                      <Plus size={17} />
                      Add a friend
                    </button>
                    <button
                      className="secondary"
                      disabled={busy}
                      onClick={() =>
                        task(async () => {
                          await C.publishProgress(state);
                          tell(
                            "Your best ghosts and weekly points are shared. Tasks and reflections stay private.",
                          );
                        })
                      }
                    >
                      <Ghost size={17} />
                      Share my ghosts
                    </button>
                    <button
                      className="secondary"
                      onClick={() => setModal("room")}
                    >
                      <Radio size={17} />
                      Live study room
                    </button>
                  </div>
                  <div className="section-heading">
                    <h2>Friends & saved ghosts</h2>
                    <button
                      className="text-button"
                      disabled={busy}
                      onClick={() =>
                        task(async () => {
                          const friends = (
                            await Promise.all(
                              state.friends.map((f) => C.refreshFriend(f.uid)),
                            )
                          ).filter(Boolean);
                          setState((s) => ({ ...s, friends }));
                          tell("Your circle is up to date.");
                        })
                      }
                    >
                      Refresh
                      <ArrowRight size={15} />
                    </button>
                  </div>
                  {state.friends.length ? (
                    <div className="ghost-grid">
                      {state.friends.map((f) => (
                        <section className="card friend-card" key={f.uid}>
                          <div className="card-title">
                            <span className="avatar">{f.name[0]}</span>
                            <h3>{f.name}</h3>
                            <button
                              className="icon-btn"
                              aria-label={`Remove ${f.name}`}
                              onClick={() =>
                                setState((s) => ({
                                  ...s,
                                  friends: s.friends.filter(
                                    (x) => x.uid !== f.uid,
                                  ),
                                }))
                              }
                            >
                              <X size={15} />
                            </button>
                          </div>
                          <small className="muted">{f.code}</small>
                          {f.ghosts?.length ? (
                            f.ghosts.map((g) => (
                              <button
                                className="ghost-option"
                                key={g.subject + g.planned}
                                onClick={() => {
                                  if (active)
                                    return tell(
                                      "Finish your current session first.",
                                    );
                                  begin({
                                    subject: g.subject,
                                    planned: g.planned,
                                    task: "",
                                    ghost: g,
                                    ghostName: `${f.name}’s ghost`,
                                  });
                                }}
                              >
                                <span>
                                  {g.subject} · {g.planned}m
                                </span>
                                <b>{g.score} pts</b>
                                <Play size={14} />
                              </button>
                            ))
                          ) : (
                            <p>No shared ghosts yet.</p>
                          )}
                        </section>
                      ))}
                    </div>
                  ) : (
                    <Empty
                      icon={Users}
                      title="Good company, better focus"
                      description="Add a friend with their LOCK code to start your circle."
                    />
                  )}
                  <div className="section-heading">
                    <h2>This week’s circle league</h2>
                    <span className="muted">
                      Resets Monday · {prettyDate(E.monday())}
                    </span>
                  </div>
                  <div className="card league">
                    {[
                      {
                        uid: cloud.uid,
                        name: state.name || "You",
                        points: E.leaguePoints(state),
                      },
                      ...state.friends.map((f) => ({
                        uid: f.uid,
                        name: f.name,
                        points:
                          f.league?.week === E.monday() ? f.league.points : 0,
                      })),
                    ]
                      .sort((a, b) => b.points - a.points)
                      .map((f, i) => (
                        <div className="league-row" key={f.uid}>
                          <span className="rank">{i + 1}</span>
                          <span className="avatar">{f.name[0]}</span>
                          <b>
                            {f.name}
                            {f.uid === cloud.uid ? " (you)" : ""}
                          </b>
                          <strong>
                            {f.points} <small>pts</small>
                          </strong>
                        </div>
                      ))}
                  </div>
                  <p className="quiet-text">
                    League points reward focused minutes, completed sessions,
                    improvement over your average, and beating your own ghost.
                    Friends’ standings update when they share progress.
                  </p>
                  {room && (
                    <Room
                      room={room}
                      members={members}
                      uid={cloud.uid}
                      error={roomError}
                      busy={busy}
                      onStart={() => task(() => C.startRoom(room.code))}
                      onLeave={() =>
                        task(async () => {
                          await C.leaveRoom(room.code);
                          setState((s) => ({
                            ...s,
                            active: s.active
                              ? { ...s.active, room: null }
                              : null,
                          }));
                          setRoom(null);
                          setMembers([]);
                        })
                      }
                      onSession={() => setPage("session")}
                    />
                  )}
                  <Pacts
                    state={state}
                    uid={cloud.uid}
                    tell={tell}
                    onCode={(code) =>
                      setState((s) => ({ ...s, pactCode: code }))
                    }
                    onBonus={(id, day) =>
                      setState((s) => {
                        if ((s.bonusXP || []).some((b) => b.id === id))
                          return s;
                        const prior =
                          s.sessions
                            .filter((x) => x.day === day)
                            .reduce((n, x) => n + x.xp, 0) +
                          (s.bonusXP || [])
                            .filter((b) => b.day === day)
                            .reduce((n, b) => n + b.xp, 0);
                        return {
                          ...s,
                          bonusXP: [
                            ...(s.bonusXP || []),
                            {
                              id,
                              day,
                              xp: Math.max(0, Math.min(15, 300 - prior)),
                            },
                          ],
                        };
                      })
                    }
                  />
                </>
              )}
            </>
          )}
        </main>
        <footer className="main-footer">
          <span>
            <Flame size={13} />
            Made for a little more focus.
          </span>
          <button onClick={() => setModal("install")}>
            Install Ember
            <ArrowUpRight size={13} />
          </button>
        </footer>
      </div>
      <nav className="mobile-nav">
        {nav.map(([id, I, label]) => (
          <button
            key={id}
            className={page === id ? "selected" : ""}
            onClick={() => setPage(id)}
          >
            <I size={20} />
            <span>
              {id === "home"
                ? "Home"
                : id === "report"
                  ? "Report"
                  : id === "friends"
                    ? "Circle"
                    : label.replace("My ", "")}
            </span>
          </button>
        ))}
      </nav>
      {toast && (
        <div className="toast" role="status">
          <CheckCircle2 size={18} />
          {toast}
        </div>
      )}
      {(modal === "setup" || modal?.type === "setup") && (
        <Setup
          state={state}
          initial={typeof modal === "object" ? modal : {}}
          onClose={() => setModal(null)}
          onStart={begin}
          active={!!active}
        />
      )}
      {modal === "finish" && active && (
        <Finish
          active={active}
          elapsed={elapsed}
          onClose={() => {
            if (elapsed < active.planned * 60) setModal(null);
          }}
          onFinish={finish}
        />
      )}
      {checkin && active && modal !== "finish" && (
        <Modal title="Still with us?" onClose={() => setCheckin(false)}>
          <div className="checkin-art">
            <Flame size={38} />
          </div>
          <p className="modal-intro">An honest check-in. How’s your focus?</p>
          <p className="quiet-text">
            Focus points pause while you’re away or a check-in is waiting. No
            judgment — just useful information.
          </p>
          <div className="button-row">
            <button
              className="primary"
              onClick={() => {
                setState((s) => ({ ...s, active: E.setFocus(s.active, true) }));
                setCheckin(false);
              }}
            >
              Yes, I’m focused
              <Check size={17} />
            </button>
            <button
              className="secondary"
              onClick={() => {
                setState((s) => ({
                  ...s,
                  active: {
                    ...s.active,
                    distractions: s.active.distractions + 1,
                  },
                }));
                setCheckin(false);
              }}
            >
              I drifted a little
            </button>
          </div>
        </Modal>
      )}
      {modal === "reflect" && result && (
        <Reflection
          result={result}
          onClose={() => setModal(null)}
          onSave={(autopsy) => {
            setState((s) => ({
              ...s,
              sessions: s.sessions.map((x) =>
                x.id === result.id ? { ...x, autopsy } : x,
              ),
            }));
            setResult((r) => ({ ...r, autopsy }));
            setModal(null);
            tell("Reflection saved. Thanks for being honest.");
          }}
        />
      )}
      {modal === "settings" && (
        <SettingsForm
          state={state}
          onClose={() => setModal(null)}
          onSave={(values) => {
            setState((s) => ({ ...s, ...values }));
            setModal(null);
            tell("Your space is updated.");
          }}
          exportBackup={exportBackup}
          onImport={async (file) => {
            try {
              const data = JSON.parse(await file.text());
              if (!E.validBackup(data))
                throw new Error("This isn’t a valid Ember backup.");
              setState({ ...data, active: null });
              setModal(null);
              tell("Backup restored.");
            } catch (e) {
              tell(e.message);
            }
          }}
        />
      )}
      {modal === "install" && (
        <Modal
          title="A little focus, on your Home Screen"
          onClose={() => setModal(null)}
        >
          <div className="install-icon">
            <Flame size={45} fill="currentColor" />
          </div>
          <h3 className="center">Your study space. One tap away.</h3>
          <p className="modal-intro">
            On iPhone or iPad, open Ember in Safari:
          </p>
          <ol className="install-steps">
            <li>
              <Share2 size={19} />
              <span>
                Tap the <b>Share</b> button. It may be inside the <b>…</b> menu.
              </span>
            </li>
            <li>
              <Plus size={19} />
              <span>
                Choose <b>Add to Home Screen</b>.
              </span>
            </li>
            <li>
              <Smartphone size={19} />
              <span>
                Keep <b>Open as Web App</b> enabled if shown, then tap{" "}
                <b>Add</b>.
              </span>
            </li>
          </ol>
          <p className="quiet-text">
            After your first online visit, solo study works offline. Live rooms
            and friends need an internet connection. Home Screen storage may be
            separate from Safari — export and restore your backup if needed.
          </p>
          {installPrompt && (
            <button
              className="primary full"
              onClick={() =>
                task(async () => {
                  await installPrompt.prompt();
                  setInstallPrompt(null);
                })
              }
            >
              Install on this device
              <Download size={17} />
            </button>
          )}
        </Modal>
      )}
      {modal === "add-friend" && (
        <CodeForm
          title="Find your study buddy"
          placeholder="LOCK-ABC234"
          label="Friend code"
          busy={busy}
          onClose={() => setModal(null)}
          onSubmit={(code) =>
            task(async () => {
              const f = await C.friendByCode(code);
              setState((s) => ({
                ...s,
                friends: [...s.friends.filter((x) => x.uid !== f.uid), f],
              }));
              setModal(null);
              tell(`${f.name} added to your circle.`);
            })
          }
        />
      )}
      {modal === "room" && (
        <RoomForm
          subjects={state.subjects}
          busy={busy}
          active={!!active}
          onClose={() => setModal(null)}
          onCreate={(options) =>
            task(async () => {
              const code = await C.createRoom(options);
              const r = await C.joinRoom(code, state.name, options.team);
              setRoom(r);
              setModal(null);
              tell("Room created. Share the room code with your circle.");
            })
          }
          onJoin={(code, team) =>
            task(async () => {
              const r = await C.joinRoom(code, state.name, team);
              setRoom(r);
              setModal(null);
            })
          }
        />
      )}
    </div>
  );
}
function greeting(now) {
  const hour = new Date(now).getHours();
  return hour < 12
    ? "Good morning"
    : hour < 18
      ? "Good afternoon"
      : "Good evening";
}
function downloadBlob(blob, name) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
function Heading({ eyebrow, title, description }) {
  return (
    <div className="heading-block">
      <div className="eyebrow">{eyebrow}</div>
      <h1>{title}</h1>
      <p>{description}</p>
    </div>
  );
}
function Stat({ icon: I, label, value, detail }) {
  return (
    <section className="card stat">
      <div>
        <span>{label}</span>
        <I size={18} />
      </div>
      <b>{value}</b>
      <p>{detail}</p>
    </section>
  );
}
function Empty({ icon: I, title, description, action, actionLabel }) {
  return (
    <section className="empty">
      <I size={34} />
      <h3>{title}</h3>
      <p>{description}</p>
      {action && (
        <button className="primary" onClick={action}>
          {actionLabel}
          <ArrowRight size={16} />
        </button>
      )}
    </section>
  );
}
function Setup({ state, initial, onClose, onStart, active }) {
  const [subject, setSubject] = useState(initial.subject || state.subjects[0]),
    [planned, setPlanned] = useState(initial.planned || 25),
    [task, setTask] = useState("");
  const ghost = E.bestGhost(state, subject, planned);
  return (
    <Modal title="Make a little room for focus" onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onStart({ subject, planned, task });
        }}
      >
        <label>
          What are you working on?
          <select value={subject} onChange={(e) => setSubject(e.target.value)}>
            {state.subjects.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        <label>How long feels right?</label>
        <div className="duration-picker">
          {[25, 45, 60].map((n) => (
            <button
              type="button"
              key={n}
              className={planned === n ? "chosen" : ""}
              onClick={() => setPlanned(n)}
            >
              <b>{n}</b>
              <span>minutes</span>
            </button>
          ))}
        </div>
        <label>
          A small intention <span>(optional)</span>
          <input
            value={task}
            maxLength={120}
            onChange={(e) => setTask(e.target.value)}
            placeholder="e.g. Work through 5 practice problems"
          />
        </label>
        <div className="ghost-hint">
          <Ghost size={23} />
          <div>
            <b>
              {ghost
                ? "Your ghost is ready"
                : "Your first session writes the ghost"}
            </b>
            <p>
              {ghost
                ? `${ghost.score} points · Same subject. Same duration.`
                : "No competition yet. Just find your rhythm."}
            </p>
          </div>
        </div>
        <p className="quiet-text">
          Check in every 5 minutes. If you leave the app, focus pauses until
          you’re back. The timer keeps going.
        </p>
        <button className="primary full" disabled={active} type="submit">
          <Play size={17} fill="currentColor" />
          {active ? "Finish your current session first" : "Start my session"}
          <ArrowRight size={17} />
        </button>
      </form>
    </Modal>
  );
}
function Session({
  active,
  elapsed,
  score,
  sound,
  toggleSound,
  onSlip,
  onEnd,
  members,
  room,
}) {
  const duration = active.planned * 60,
    focused = active.events.at(-1).focused,
    ghostScore = active.ghost
      ? interpolateGhost(active.ghost.perMinute, elapsed)
      : 0,
    max = active.planned * 4;
  return (
    <>
      <div className="session-heading">
        <button className="text-button" onClick={onEnd}>
          <ChevronLeft size={16} />
          Finish session
        </button>
        <span className="session-subject">
          <span className="live-dot" />
          {active.subject} · {active.planned} MIN
        </span>
        <button
          className="icon-btn"
          aria-label={sound ? "Mute ambient sound" : "Play ambient sound"}
          onClick={toggleSound}
        >
          {sound ? <Volume2 size={20} /> : <VolumeX size={20} />}
        </button>
      </div>
      <section className="session-main">
        <div className="eyebrow">
          {focused
            ? "ONE MOMENT AT A TIME"
            : "A BREATH. A RESET. A FRESH START."}
        </div>
        <div
          className="timer"
          style={{ "--angle": `${(elapsed / duration) * 360}deg` }}
        >
          <div>
            <span className="timer-label">TIME REMAINING</span>
            <b>{timerText(duration - elapsed)}</b>
            <p>
              <Flame size={16} />
              {focused ? "You’re locked in" : "Focus is paused"}
            </p>
          </div>
        </div>
        <h2>{active.task || "A little focus goes a long way."}</h2>
        <p className="muted">
          {timerText(elapsed)} elapsed · No need to be perfect.
        </p>
        <div className="race-card card">
          <div className="race-title">
            <h3>
              {active.ghost
                ? "A race against your ghost"
                : "Your first ghost is taking shape"}
            </h3>
            <span className="mini-pill">{score} POINTS</span>
          </div>
          <div className="race-row">
            <span>
              <Flame size={18} />
              You
            </span>
            <div className="race-track">
              <i style={{ width: `${(score / max) * 100}%` }} />
            </div>
            <b>{score}</b>
          </div>
          <div className="race-row ghost">
            <span>
              <Ghost size={18} />
              {active.ghostName}
            </span>
            <div className="race-track">
              <i style={{ width: `${(ghostScore / max) * 100}%` }} />
            </div>
            <b>{Math.round(ghostScore * 10) / 10}</b>
          </div>
          <p>
            {active.ghost
              ? score >= ghostScore
                ? `You’re ${Math.round((score - ghostScore) * 10) / 10} points ahead. Stay with it.`
                : `${Math.round((ghostScore - score) * 10) / 10} points behind. There’s still time to find your rhythm.`
              : "Your completed session becomes a replay for next time."}
          </p>
        </div>
        <button
          className={
            focused
              ? "secondary distraction-button"
              : "primary distraction-button"
          }
          onClick={onSlip}
        >
          {focused ? (
            <>
              <Coffee size={18} />I got distracted
            </>
          ) : (
            <>
              <Play size={17} />
              I’m focused again
            </>
          )}
        </button>
        <small className="quiet-text">
          Distractions are private. Being honest helps you grow.
        </small>
        {active.room && (
          <div className="card room-race">
            <h3>In the room</h3>
            {members.map((m) => (
              <div className="race-row" key={m.uid}>
                <span>{m.name}</span>
                <div className="race-track">
                  <i style={{ width: `${(m.score / max) * 100}%` }} />
                </div>
                <b>{m.score}</b>
              </div>
            ))}
            {room?.mode === "coop" && (
              <p>Everyone aims for {room.target} points by the end.</p>
            )}
          </div>
        )}
      </section>
    </>
  );
}
function interpolateGhost(points, seconds) {
  const minute = seconds / 60,
    i = Math.floor(minute),
    before = i === 0 ? 0 : points[i - 1] || 0,
    after = points[i] ?? points.at(-1) ?? 0;
  return before + (after - before) * (minute - i);
}
function Finish({ active, elapsed, onClose, onFinish }) {
  const [done, setDone] = useState(false),
    [proof, setProof] = useState("");
  const complete = elapsed >= active.planned * 60;
  return (
    <Modal
      title={complete ? "You made room for yourself." : "Ready to wrap up?"}
      onClose={onClose}
    >
      <div className="checkin-art">
        <Flame size={40} />
      </div>
      <p className="modal-intro">
        {complete
          ? "A finished session is a win. Take a second to celebrate."
          : "Your progress will be saved. Finishing early is okay."}
      </p>
      {active.task && (
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={done}
            onChange={(e) => setDone(e.target.checked)}
          />
          <span>I finished: {active.task}</span>
        </label>
      )}
      <label>
        Proof of work <span>(optional, private)</span>
        <input
          value={proof}
          maxLength={160}
          placeholder="e.g. Finished two problems"
          onChange={(e) => setProof(e.target.value)}
        />
      </label>
      {elapsed < 600 && (
        <p className="quiet-text">
          Sessions under 10 minutes don’t earn XP. Your session is still saved.
        </p>
      )}
      <button className="primary full" onClick={() => onFinish(done, proof)}>
        Save my session
        <ArrowRight size={17} />
      </button>
      {!complete && (
        <button className="text-button full center" onClick={onClose}>
          Keep going
        </button>
      )}
    </Modal>
  );
}
function Results({ result: r, onHome, onReflect }) {
  const percent = Math.round((r.focused / Math.max(1, r.duration)) * 100);
  const focusedMinutes = r.perMinute.map((n, i) =>
    Math.max(0, (n - (r.perMinute[i - 1] || 0)) / 4),
  );
  return (
    <div className="results">
      <div className="result-flame">
        <Flame size={44} />
      </div>
      <div className="eyebrow">
        {r.subject.toUpperCase()} · {niceMinutes(r.duration / 60)} SESSION
      </div>
      <h1>
        {r.beatGhost
          ? "A little better than yesterday."
          : r.completed
            ? "You showed up for yourself."
            : "Every honest step counts."}
      </h1>
      <p className="muted">
        {r.hadGhost
          ? `${r.beatGhost ? "Ahead of" : "Compared with"} ${r.ghostName.toLowerCase()} · ${r.score - r.ghostScore >= 0 ? "+" : ""}${Math.round((r.score - r.ghostScore) * 10) / 10} points`
          : "Your first chapter in this subject is written."}
      </p>
      <div className="stats-grid">
        <Stat
          icon={Target}
          label="Focus score"
          value={r.score}
          detail={`${percent}% self-reported focus`}
        />
        <Stat
          icon={Clock}
          label="Focused time"
          value={niceMinutes(r.focused / 60)}
          detail="Minutes that mattered"
        />
        <Stat
          icon={Zap}
          label="XP earned"
          value={`+${r.xp}`}
          detail={
            r.duration < 600 ? "Less than 10 minutes" : "Added to your journey"
          }
        />
        <Stat
          icon={Coffee}
          label="Distractions"
          value={r.distractions}
          detail="Only visible to you"
        />
      </div>
      <section className="card result-graph">
        <div className="card-title">
          <h3>Your focus, minute by minute</h3>
          <span className="muted">0–1 FOCUSED MINUTE</span>
        </div>
        <Graph
          type="bar"
          labels={focusedMinutes.map((_, i) => `${i + 1}m`)}
          series={[
            {
              label: "Focused fraction",
              data: focusedMinutes,
              backgroundColor: focusedMinutes.map((n) =>
                n >= 0.8 ? "#b8c8ab" : "#e7ac87",
              ),
            },
          ]}
          height={210}
        />
      </section>
      {r.task && (
        <p className="result-proof">
          <CheckCircle2 size={18} />
          {r.tasksCompleted ? "Completed" : "Worked on"}: {r.task}
        </p>
      )}
      {r.proof && <blockquote>“{r.proof}”</blockquote>}
      <div className="button-row center">
        <button className="primary" onClick={onHome}>
          Back to my space
          <ArrowRight size={17} />
        </button>
        <button className="secondary" onClick={onReflect}>
          <Brain size={17} />
          {r.autopsy ? "Edit reflection" : "Quick reflection"}
        </button>
      </div>
    </div>
  );
}
function Reflection({ result, onClose, onSave }) {
  const [place, setPlace] = useState(result.autopsy?.place || "My room"),
    [distraction, setDistraction] = useState(
      result.autopsy?.distraction || "Nothing much",
    ),
    [sleep, setSleep] = useState(result.autopsy?.sleep || "Okay");
  return (
    <Modal title="Get curious. Be kind." onClose={onClose}>
      <p className="modal-intro">
        Three small questions. No judgment. These reflections stay on your
        device.
      </p>
      <label>
        Where did you study?
        <select value={place} onChange={(e) => setPlace(e.target.value)}>
          {["My room", "Library", "School", "Café", "Somewhere else"].map(
            (x) => (
              <option key={x}>{x}</option>
            ),
          )}
        </select>
      </label>
      <label>
        What pulled your attention?
        <select
          value={distraction}
          onChange={(e) => setDistraction(e.target.value)}
        >
          {[
            "Nothing much",
            "My phone",
            "Noise",
            "Worry",
            "Tiredness",
            "Other people",
          ].map((x) => (
            <option key={x}>{x}</option>
          ))}
        </select>
      </label>
      <label>
        How did you sleep?
        <select value={sleep} onChange={(e) => setSleep(e.target.value)}>
          {["Well", "Okay", "Not enough"].map((x) => (
            <option key={x}>{x}</option>
          ))}
        </select>
      </label>
      <button
        className="primary full"
        onClick={() => onSave({ place, distraction, sleep })}
      >
        Save my reflection
        <Check size={17} />
      </button>
    </Modal>
  );
}
function WeeklyReport({ state, reportRef }) {
  const w = E.weeklyStats(state),
    previous = E.weeklyStats(state, E.shiftDay(E.monday(), -7)),
    change = previous.focused
      ? Math.round(((w.focused - previous.focused) / previous.focused) * 100)
      : null;
  return (
    <section className="weekly-report card" ref={reportRef}>
      <div className="report-top">
        <span className="brand">
          <Flame size={24} />
          ember.
        </span>
        <span>
          {prettyDate(E.monday())} — {prettyDate(E.shiftDay(E.monday(), 6))}
        </span>
      </div>
      <span className="eyebrow">
        {state.name ? `${state.name.toUpperCase()}’S` : "YOUR"} WEEKLY RECAP
      </span>
      <h2>A week of little sparks.</h2>
      <div className="report-big">
        <b>{niceMinutes(w.focused)}</b>
        <span>of making time for yourself</span>
      </div>
      <div className="report-metrics">
        <div>
          <b>{w.completed}</b>
          <span>sessions completed</span>
        </div>
        <div>
          <b>{w.xp}</b>
          <span>XP earned</span>
        </div>
        <div>
          <b>{E.streak(state)}</b>
          <span>day streak</span>
        </div>
        <div>
          <b>{E.levelInfo(E.totalXP(state)).level}</b>
          <span>your level</span>
        </div>
      </div>
      <Graph
        type="bar"
        labels={w.days.map((d) => weekday(d.day))}
        series={[
          {
            label: "Focused minutes",
            data: w.days.map((d) => Math.round(d.minutes)),
            backgroundColor: "#b8c8ab",
          },
        ]}
        height={190}
      />
      <div className="report-details">
        <p>
          <Sparkles size={17} />
          <span>
            Best day <b>{w.focused ? weekday(w.best.day) : "Your next one"}</b>
          </span>
        </p>
        <p>
          <Clock size={17} />
          <span>
            Longest session <b>{niceMinutes(w.longest)}</b>
          </span>
        </p>
        <p>
          <ArrowUpRight size={17} />
          <span>
            From last week{" "}
            <b>
              {change === null
                ? "A fresh beginning"
                : `${change > 0 ? "+" : ""}${change}%`}
            </b>
          </span>
        </p>
      </div>
      <div className="report-badges">
        {E.badgeList(state)
          .filter((b) => b.earned)
          .map((b) => (
            <span key={b.id}>
              <Icon name={b.icon} size={15} />
              {b.name}
            </span>
          ))}
      </div>
      <p className="report-bottom">Your only competition is you, yesterday.</p>
    </section>
  );
}
function SettingsForm({ state, onClose, onSave, exportBackup, onImport }) {
  const [name, setName] = useState(state.name),
    [dailyGoal, setGoal] = useState(state.dailyGoal),
    [newSubject, setSubject] = useState(""),
    [subjects, setSubjects] = useState(state.subjects);
  return (
    <Modal title="Make this space yours" onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSave({ name: name.trim(), dailyGoal: Number(dailyGoal), subjects });
        }}
      >
        <label>
          Your first name <span>(optional)</span>
          <input
            value={name}
            maxLength={24}
            placeholder="What should we call you?"
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <label>
          Daily focused-minute goal
          <input
            type="number"
            min="10"
            max="240"
            required
            value={dailyGoal}
            onChange={(e) => setGoal(e.target.value)}
          />
        </label>
        <label>Your subjects</label>
        <div className="subject-tags">
          {subjects.map((s) => (
            <span key={s}>
              {s}
              <button
                type="button"
                aria-label={`Remove ${s}`}
                disabled={subjects.length <= 1}
                onClick={() => setSubjects((a) => a.filter((x) => x !== s))}
              >
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
        <div className="input-row">
          <input
            value={newSubject}
            maxLength={30}
            placeholder="Add a subject"
            onChange={(e) => setSubject(e.target.value)}
          />
          <button
            type="button"
            className="secondary"
            disabled={!newSubject.trim() || subjects.length >= 12}
            onClick={() => {
              if (!subjects.includes(newSubject.trim()))
                setSubjects((a) => [...a, newSubject.trim()]);
              setSubject("");
            }}
          >
            <Plus size={18} />
          </button>
        </div>
        <button className="primary full">
          Save changes
          <Check size={16} />
        </button>
      </form>
      <hr />
      <div className="card-title">
        <h3>Your data stays yours</h3>
        <LockKeyhole size={17} />
      </div>
      <p className="quiet-text">
        Sessions, tasks, and reflections are saved in this browser. Export a
        backup before changing devices or clearing storage. Firebase only shares
        your chosen name, ghosts, and league totals.
      </p>
      <div className="button-row">
        <button className="secondary" onClick={exportBackup}>
          <Download size={16} />
          Export backup
        </button>
        <label className="secondary import-label">
          <Upload size={16} />
          Restore backup
          <input
            type="file"
            accept="application/json"
            onChange={(e) => e.target.files[0] && onImport(e.target.files[0])}
          />
        </label>
      </div>
      <p className="quiet-text">
        Restoring replaces this device’s progress. Anonymous friend identity is
        tied to your browser and is not included in the backup.
      </p>
    </Modal>
  );
}
function CodeForm({ title, label, placeholder, busy, onClose, onSubmit }) {
  const [code, setCode] = useState("");
  return (
    <Modal title={title} onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit(code);
        }}
      >
        <label>
          {label}
          <input
            value={code}
            autoCapitalize="characters"
            maxLength={20}
            placeholder={placeholder}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            required
          />
        </label>
        <button className="primary full" disabled={busy}>
          Find my friend
          <ArrowRight size={16} />
        </button>
      </form>
    </Modal>
  );
}
function RoomForm({ subjects, busy, active, onClose, onCreate, onJoin }) {
  const [tab, setTab] = useState("create"),
    [mode, setMode] = useState("race"),
    [subject, setSubject] = useState(subjects[0]),
    [planned, setPlanned] = useState(25),
    [code, setCode] = useState(""),
    [team, setTeam] = useState("A");
  return (
    <Modal title="Make focus a shared thing" onClose={onClose}>
      <div className="segmented">
        <button
          className={tab === "create" ? "chosen" : ""}
          onClick={() => setTab("create")}
        >
          Create a room
        </button>
        <button
          className={tab === "join" ? "chosen" : ""}
          onClick={() => setTab("join")}
        >
          Join a room
        </button>
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          tab === "create"
            ? onCreate({
                mode,
                subject,
                planned: Number(planned),
                target: Math.round(Number(planned) * 4 * 0.7),
                team,
              })
            : onJoin(code, team);
        }}
      >
        {tab === "create" ? (
          <>
            <label>
              Room style
              <select value={mode} onChange={(e) => setMode(e.target.value)}>
                <option value="race">Friendly race · individual scores</option>
                <option value="coop">Co-op · everyone reaches 70% focus</option>
                <option value="teams">
                  Team A vs Team B · combined scores
                </option>
              </select>
            </label>
            <label>
              Subject
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              >
                {subjects.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </label>
            <label>
              Session length
              <select
                value={planned}
                onChange={(e) => setPlanned(e.target.value)}
              >
                {[25, 45, 60].map((n) => (
                  <option value={n} key={n}>
                    {n} minutes
                  </option>
                ))}
              </select>
            </label>
          </>
        ) : (
          <label>
            Room code
            <input
              value={code}
              placeholder="ROOM-ABC234"
              required
              maxLength={20}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
            />
          </label>
        )}
        <label>
          Your team <span>(used in team rooms)</span>
          <select value={team} onChange={(e) => setTeam(e.target.value)}>
            <option>A</option>
            <option>B</option>
          </select>
        </label>
        <p className="quiet-text">
          The host starts everyone together. Scores update about every 10
          seconds. Tasks and distractions stay private.
        </p>
        <button className="primary full" disabled={busy || active}>
          {active
            ? "Finish your current session first"
            : tab === "create"
              ? "Create my room"
              : "Join the room"}
          <ArrowRight size={16} />
        </button>
      </form>
    </Modal>
  );
}
function Room({
  room,
  members,
  uid,
  error,
  busy,
  onStart,
  onLeave,
  onSession,
}) {
  const teamScore = (team) =>
    Math.round(
      members.filter((m) => m.team === team).reduce((n, m) => n + m.score, 0),
    );
  const done = members.length > 0 && members.every((m) => m.done);
  return (
    <section className="card room-card">
      <div className="card-title">
        <h3>
          <Radio size={18} />{" "}
          {room.startedAt ? "Live room" : "Your room is ready"}
        </h3>
        <span className="mini-pill">{room.code}</span>
      </div>
      <p>
        {room.subject} · {room.planned} minutes ·{" "}
        {room.mode === "coop"
          ? "Everyone aims for " + room.target + " points"
          : room.mode === "teams"
            ? "Two teams, one shared rhythm"
            : "A friendly race"}
      </p>
      {error && <p className="error">{error}</p>}
      <div className="room-members">
        {members.map((m) => (
          <span key={m.uid}>
            <span className="avatar">{m.name[0]}</span>
            {m.name} · {room.mode === "teams" ? `Team ${m.team} · ` : ""}
            {m.score} pts {m.done ? "✓" : ""}
          </span>
        ))}
      </div>
      {room.mode === "teams" && (
        <p>
          Team A: {teamScore("A")} · Team B: {teamScore("B")}
        </p>
      )}
      {done && (
        <p className="room-outcome">
          {room.mode === "coop"
            ? members.every((m) => m.score >= room.target)
              ? "You did it, together. Everyone reached the target."
              : "You showed up together. Try the shared target next time."
            : room.mode === "teams"
              ? teamScore("A") === teamScore("B")
                ? "A tie. A good session for both teams."
                : `Team ${teamScore("A") > teamScore("B") ? "A" : "B"} wins this session.`
              : `${[...members].sort((a, b) => b.score - a.score)[0].name} finished ahead. Every honest minute counted.`}
        </p>
      )}
      <div className="button-row">
        {!room.startedAt && room.owner === uid && (
          <button className="primary" disabled={busy} onClick={onStart}>
            Start together
            <Play size={16} />
          </button>
        )}
        {room.startedAt && !done && (
          <button className="primary" onClick={onSession}>
            Back to the session
            <ArrowRight size={16} />
          </button>
        )}
        <button className="secondary" disabled={busy} onClick={onLeave}>
          Leave room
        </button>
      </div>
    </section>
  );
}
createRoot(document.getElementById("root")).render(<App />);
