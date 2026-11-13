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
    title: "SaaS Launch Hook — 30s Product Reveal",
    client: "MetricFlow AI",
    metrics: "148K views • 4.8% CTR",
    hook: "Stop losing 40% of trial users on day 1.",
    summary: "Fast-paced vertical reel with kinetic captions, UI zoom-ins, and problem-agitate-solve pacing.",
    createdAt: "2026-10-12T10:00:00Z",
  },
  {
    id: "reel-2",
    type: "short_video",
    title: "Founder Story — Behind the Brand",
    client: "Verve Skin",
    metrics: "92K views • 1,420 saves",
    hook: "Why we threw away 14 formulas before launch.",
    summary: "Authentic founder-led short-form video engineered for high retention and organic shares.",
    createdAt: "2026-10-18T10:00:00Z",
  },
  {
    id: "reel-3",
    type: "short_video",
    title: "3 CRO Mistakes Costing You Demos",
    client: "CloudLedger",
    metrics: "215K views • 68 booked calls",
    hook: "Your hero section has 3 seconds to answer this.",
    summary: "Educational talking-head + screen teardown format built for LinkedIn & Instagram Reels.",
    createdAt: "2026-10-25T10:00:00Z",
  },
  {
    id: "reel-4",
    type: "short_video",
    title: "Creator Partnership — Unboxing & Proof",
    client: "Kinetix Gear",
    metrics: "310K views • 3.9x ROAS",
    hook: "Tested for 30 days in real conditions.",
    summary: "Influencer-seeded UGC short cut for paid social + organic TikTok distribution.",
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
