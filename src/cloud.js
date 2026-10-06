import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously } from "firebase/auth";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  collection,
  runTransaction,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { leaguePoints, monday } from "./engine";
const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};
export const cloudConfigured = !!(
  config.apiKey &&
  config.projectId &&
  config.appId
);
let db, uid;
const root = "ember/v1";
const path = (...parts) => doc(db, root, ...parts);
const shortCode = (prefix) =>
  `${prefix}-${Array.from(crypto.getRandomValues(new Uint8Array(6)), (n) => "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[n % 32]).join("")}`;
function safeProfile(id, data) {
  if (!data) throw new Error("This profile is unavailable.");
  return {
    uid: id,
    name:
      typeof data.name === "string" ? data.name.slice(0, 24) : "Study buddy",
    code: typeof data.code === "string" ? data.code : "",
    ghosts: (Array.isArray(data.ghosts) ? data.ghosts : [])
      .filter(
        (g) =>
          typeof g.subject === "string" &&
          [25, 45, 60].includes(g.planned) &&
          Number.isFinite(g.score) &&
          g.score >= 0 &&
          g.score <= g.planned * 4 &&
          Array.isArray(g.perMinute) &&
          g.perMinute.length === g.planned &&
          g.perMinute.every(
            (n) => Number.isFinite(n) && n >= 0 && n <= g.planned * 4,
          ),
      )
      .slice(0, 30),
    league: {
      week: typeof data.league?.week === "string" ? data.league.week : "",
      points: Number.isFinite(data.league?.points)
        ? Math.min(10000, Math.max(0, data.league.points))
        : 0,
    },
  };
}
export async function connectCloud(name) {
  if (!cloudConfigured)
    throw new Error("Firebase is not configured. See README for setup.");
  const app = initializeApp(config);
  db = getFirestore(app);
  const auth = getAuth(app);
  uid = (await signInAnonymously(auth)).user.uid;
  let profile = (await getDoc(path("profiles", uid))).data();
  if (!profile) {
    for (let attempts = 0; attempts < 5; attempts++) {
      const code = shortCode("LOCK");
      try {
        await runTransaction(db, async (tx) => {
          const ref = path("codes", code);
          if ((await tx.get(ref)).exists()) throw new Error("Code collision");
          tx.set(ref, { uid });
          tx.set(path("profiles", uid), {
            name: (name || "Study buddy").slice(0, 24),
            code,
            ghosts: [],
            league: { week: monday(), points: 0 },
            createdAt: serverTimestamp(),
          });
        });
        profile = (await getDoc(path("profiles", uid))).data();
        break;
      } catch (e) {
        if (attempts === 4) throw e;
      }
    }
  }
  return { uid, ...profile };
}
export async function friendByCode(code) {
  const record = await getDoc(path("codes", code.trim().toUpperCase()));
  if (!record.exists()) throw new Error("No friend found. Check the code.");
  if (record.data().uid === uid) throw new Error("That’s your own code.");
  const friend = (await getDoc(path("profiles", record.data().uid))).data();
  return safeProfile(record.data().uid, friend);
}
export async function refreshFriend(id) {
  const snapshot = await getDoc(path("profiles", id));
  return snapshot.exists() ? safeProfile(id, snapshot.data()) : null;
}
export async function publishProgress(state) {
  const ghosts = [];
  for (const s of state.sessions.filter((s) => s.completed)) {
    const i = ghosts.findIndex(
      (g) => g.subject === s.subject && g.planned === s.planned,
    );
    const ghost = {
      subject: s.subject,
      planned: s.planned,
      score: s.score,
      perMinute: s.perMinute,
    };
    if (i < 0) ghosts.push(ghost);
    else if (ghosts[i].score < s.score) ghosts[i] = ghost;
  }
  await updateDoc(path("profiles", uid), {
    name: (state.name || "Study buddy").slice(0, 24),
    ghosts: ghosts.slice(0, 30),
    league: { week: monday(), points: leaguePoints(state) },
  });
}
export async function createRoom({ mode, subject, planned, target }) {
  const code = shortCode("ROOM"),
    room = {
      owner: uid,
      mode,
      subject,
      planned,
      target,
      memberCount: 0,
      startedAt: null,
      createdAt: serverTimestamp(),
    };
  await setDoc(path("rooms", code), room);
  return code;
}
export async function joinRoom(code, name, team = "A") {
  code = code.trim().toUpperCase();
  const ref = path("rooms", code),
    member = path("rooms", code, "members", uid);
  const room = await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref),
      existing = await tx.get(member);
    if (!snap.exists()) throw new Error("Room not found.");
    const data = snap.data();
    if (existing.exists()) return data;
    if (data.startedAt) throw new Error("This room has already started.");
    if (data.memberCount >= 8) throw new Error("This room is full.");
    tx.set(member, {
      name: (name || "Study buddy").slice(0, 24),
      team,
      score: 0,
      done: false,
      joinedAt: serverTimestamp(),
    });
    tx.update(ref, { memberCount: data.memberCount + 1 });
    return { ...data, memberCount: data.memberCount + 1 };
  });
  return { code, ...room };
}
export function watchRoom(code, onRoom, onMembers, onError) {
  const a = onSnapshot(
    path("rooms", code),
    (s) => onRoom({ code, ...s.data() }),
    onError,
  );
  const b = onSnapshot(
    collection(db, root, "rooms", code, "members"),
    (s) => onMembers(s.docs.map((d) => ({ uid: d.id, ...d.data() }))),
    onError,
  );
  return () => {
    a();
    b();
  };
}
export async function startRoom(code) {
  await updateDoc(path("rooms", code), { startedAt: serverTimestamp() });
}
export async function sendScore(code, score, done = false) {
  await updateDoc(path("rooms", code, "members", uid), { score, done });
}
export async function leaveRoom(code) {
  await runTransaction(db, async (tx) => {
    const ref = path("rooms", code),
      member = path("rooms", code, "members", uid);
    const room = await tx.get(ref),
      mine = await tx.get(member);
    if (mine.exists()) {
      tx.delete(member);
      tx.update(ref, { memberCount: room.data().memberCount - 1 });
    }
  });
}
export async function createPact(name, goal) {
  const code = shortCode("PACT");
  await setDoc(path("pacts", code), {
    owner: uid,
    memberIds: [uid],
    names: { [uid]: (name || "Study buddy").slice(0, 24) },
    goal,
    createdAt: serverTimestamp(),
  });
  return code;
}
export async function joinPact(code, name) {
  code = code.trim().toUpperCase();
  await runTransaction(db, async (tx) => {
    const ref = path("pacts", code),
      snap = await tx.get(ref);
    if (!snap.exists()) throw new Error("Pact not found.");
    const p = snap.data();
    if (p.memberIds.includes(uid)) return;
    if (p.memberIds.length === 2)
      throw new Error("This pact already has two people.");
    tx.update(ref, {
      memberIds: [...p.memberIds, uid],
      names: { ...p.names, [uid]: (name || "Study buddy").slice(0, 24) },
    });
  });
  return code;
}
export function watchPact(code, onPact, onChecks, onCovers, onError) {
  const a = onSnapshot(
      path("pacts", code),
      (s) => onPact({ code, ...s.data() }),
      onError,
    ),
    b = onSnapshot(
      collection(db, root, "pacts", code, "checkins"),
      (s) => onChecks(s.docs.map((d) => d.data())),
      onError,
    ),
    c = onSnapshot(
      collection(db, root, "pacts", code, "covers"),
      (s) => onCovers(s.docs.map((d) => d.data())),
      onError,
    );
  return () => {
    a();
    b();
    c();
  };
}
export async function checkInPact(code, day, minutes) {
  await setDoc(path("pacts", code, "checkins", `${uid}-${day}`), {
    uid,
    day,
    minutes: Math.round(minutes),
    createdAt: serverTimestamp(),
  });
}
export async function coverPact(code, coveredUid, day, week) {
  await setDoc(path("pacts", code, "covers", `${uid}-${week}`), {
    usedBy: uid,
    coveredUid,
    day,
    week,
    createdAt: serverTimestamp(),
  });
}
