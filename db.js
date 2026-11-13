import {
  collection,
  addDoc,
  getDocs,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";
import { db, isFirebaseConfigured } from "./firebase-config.js";

const LOCAL_PREFIX = "brandy_db_";

const DEFAULT_PORTFOLIO = [
  {
    id: "reel-1",
    type: "short_video",
    title: "ANC Earphones — Commute Sound Test",
    client: "PulseAudio Buds",
    metrics: "Earphones • Studio + Street Cut",
    hook: "Can these pocket earbuds block out a crowded metro?",
    summary: "Crisp macro shots, real-world noise cancellation demo, and fast-paced sound comparison designed for tech shoppers.",
    createdAt: "2026-10-12T10:00:00Z",
  },
  {
    id: "reel-2",
    type: "short_video",
    title: "Flagship Cell Phone — Low-Light Camera Test",
    client: "NovaFone X1",
    metrics: "Cell Phones • Night Camera Reel",
    hook: "One pocket phone vs. neon city streets after midnight.",
    summary: "Side-by-side low-light camera showcase with sharp motion transitions and spec callouts.",
    createdAt: "2026-10-18T10:00:00Z",
  },
  {
    id: "reel-3",
    type: "short_video",
    title: "70% Dark Chocolate — ASMR Snap & Melt",
    client: "VelvetCacao",
    metrics: "Food & Chocolates • ASMR Reel",
    hook: "Listen to that clean dark-chocolate snap.",
    summary: "Close-up studio food cinematography with rich cocoa pour-overs, crisp ASMR audio, and ingredient storytelling.",
    createdAt: "2026-10-25T10:00:00Z",
  },
  {
    id: "reel-4",
    type: "short_video",
    title: "Hazelnut Praline Box — Gift Unboxing",
    client: "CrispMelt Truffles",
    metrics: "Food & Chocolates • Lifestyle Cut",
    hook: "The 60-second unboxing made for gifting season.",
    summary: "Warm tabletop lighting, tactile packaging reveal, and cross-section texture shots tailored for food & beverage brands.",
    createdAt: "2026-11-02T10:00:00Z",
  },
];

function readLocal(col) {
  try {
    const raw = localStorage.getItem(LOCAL_PREFIX + col);
    if (!raw) {
      if (col === "portfolio") {
        localStorage.setItem(LOCAL_PREFIX + col, JSON.stringify(DEFAULT_PORTFOLIO));
        return [...DEFAULT_PORTFOLIO];
      }
      return [];
    }
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function writeLocal(col, items) {
  localStorage.setItem(LOCAL_PREFIX + col, JSON.stringify(items));
}

export async function createRecord(col, data) {
  const payload = {
    ...data,
    createdAt: data.createdAt || new Date().toISOString(),
  };

  if (isFirebaseConfigured && db) {
    const ref = await addDoc(collection(db, col), payload);
    return { id: ref.id, ...payload };
  }

  const items = readLocal(col);
  const item = { id: `${col}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`, ...payload };
  items.unshift(item);
  writeLocal(col, items);
  return item;
}

export async function upsertUserProfile(uid, data) {
  const payload = { uid, ...data, updatedAt: new Date().toISOString() };
  if (isFirebaseConfigured && db) {
    await setDoc(doc(db, "users", uid), payload, { merge: true });
    return payload;
  }
  const users = readLocal("users");
  const idx = users.findIndex((u) => u.uid === uid || u.id === uid);
  if (idx >= 0) {
    users[idx] = { ...users[idx], ...payload };
  } else {
    users.unshift({ id: uid, ...payload, createdAt: new Date().toISOString() });
  }
  writeLocal("users", users);
  return payload;
}

export async function listRecords(col, { userId = null, max = 50 } = {}) {
  if (isFirebaseConfigured && db) {
    const ref = collection(db, col);
    const q = userId
      ? query(ref, where("userId", "==", userId), orderBy("createdAt", "desc"), limit(max))
      : query(ref, orderBy("createdAt", "desc"), limit(max));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  }

  const items = readLocal(col);
  const filtered = userId ? items.filter((i) => i.userId === userId) : items;
  return filtered.slice(0, max);
}

export async function updateRecord(col, id, patch) {
  if (isFirebaseConfigured && db) {
    await updateDoc(doc(db, col, id), patch);
    return;
  }
  const items = readLocal(col);
  const idx = items.findIndex((i) => i.id === id);
  if (idx >= 0) {
    items[idx] = { ...items[idx], ...patch };
    writeLocal(col, items);
  }
}

export async function deleteRecord(col, id) {
  if (isFirebaseConfigured && db) {
    await deleteDoc(doc(db, col, id));
    return;
  }
  const items = readLocal(col).filter((i) => i.id !== id);
  writeLocal(col, items);
}
