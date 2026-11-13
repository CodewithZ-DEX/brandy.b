import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
import { auth, isFirebaseConfigured, ADMIN_EMAIL } from "./firebase-config.js";
import { upsertUserProfile } from "./db.js";

const LOCAL_USER_KEY = "brandy_local_user";
const ADMIN_SESSION_KEY = "brandy_admin_session";

export function getLocalUser() {
  try {
    const raw = localStorage.getItem(LOCAL_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function getAdminSession() {
  try {
    const raw = sessionStorage.getItem(ADMIN_SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function subscribeAuth(callback) {
  if (isFirebaseConfigured && auth) {
    return onAuthStateChanged(auth, (user) => {
      callback(user);
    });
  }
  callback(getLocalUser());
  return () => {};
}

export async function loginWithGoogle() {
  if (isFirebaseConfigured && auth) {
    const provider = new GoogleAuthProvider();
    const res = await signInWithPopup(auth, provider);
    const u = res.user;
    await upsertUserProfile(u.uid, {
      email: u.email,
      displayName: u.displayName || "Client",
      role: u.email === ADMIN_EMAIL ? "admin" : "client",
      provider: "google",
    });
    return u;
  }

  // Local preview fallback when Firebase keys are not yet pasted
  const demoUser = {
    uid: "google_demo_" + Date.now(),
    email: "client.google@brandy.demo",
    displayName: "Google Demo User",
    provider: "google-demo",
  };
  localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(demoUser));
  await upsertUserProfile(demoUser.uid, {
    email: demoUser.email,
    displayName: demoUser.displayName,
    role: "client",
    plan: "none",
  });
  return demoUser;
}

export async function registerWithEmail(name, email, password) {
  if (isFirebaseConfigured && auth) {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    if (name) {
      await updateProfile(cred.user, { displayName: name });
    }
    await upsertUserProfile(cred.user.uid, {
      email,
      displayName: name || email.split("@")[0],
      role: "client",
      plan: "none",
      provider: "password",
    });
    return cred.user;
  }

  const user = {
    uid: "local_" + Date.now(),
    email,
    displayName: name || email.split("@")[0],
    provider: "local-demo",
  };
  localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(user));
  await upsertUserProfile(user.uid, {
    email: user.email,
    displayName: user.displayName,
    role: "client",
    plan: "none",
  });
  return user;
}

export async function loginWithEmail(email, password) {
  if (isFirebaseConfigured && auth) {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    return cred.user;
  }

  const user = {
    uid: "local_" + btoa(email).slice(0, 8),
    email,
    displayName: email.split("@")[0],
    provider: "local-demo",
  };
  localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(user));
  return user;
}

export async function loginAsAdmin(username, password) {
  try {
    const res = await fetch("/api/admin-api", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "login", username, password }),
    });
    if (res.ok) {
      const data = await res.json();
      sessionStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(data));
      return data;
    }
    if (res.status === 401) {
      throw new Error("Invalid administrator username or password.");
    }
  } catch (err) {
    if (err.message.includes("Invalid administrator")) throw err;
    // Static local preview fallback when Vercel API routes aren't running locally
    const validUser = username === "admin" || username === ADMIN_EMAIL;
    if (validUser && password === "BrandyAdmin@2026") {
      const session = {
        ok: true,
        token: "local-preview-admin-token",
        admin: { username: "admin", email: ADMIN_EMAIL },
      };
      sessionStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
      return session;
    }
    throw new Error("Invalid administrator username or password.");
  }
}

export async function logoutAll() {
  localStorage.removeItem(LOCAL_USER_KEY);
  sessionStorage.removeItem(ADMIN_SESSION_KEY);
  if (isFirebaseConfigured && auth) {
    await signOut(auth);
  }
}
