import crypto from "node:crypto";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

function getDb() {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!projectId || !clientEmail || !privateKey) return null;

  if (!getApps().length) {
    initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
  }
  return getFirestore();
}

function signToken(payload, secret) {
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = crypto.createHmac("sha256", secret).update(data).digest("base64url");
  return `${data}.${sig}`;
}

function verifyToken(token, secret) {
  if (!token || !token.includes(".")) return null;
  const [data, sig] = token.split(".");
  const expected = crypto.createHmac("sha256", secret).update(data).digest("base64url");
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  const parsed = JSON.parse(Buffer.from(data, "base64url").toString("utf8"));
  if (parsed.exp && Date.now() > parsed.exp) return null;
  return parsed;
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const adminUser = process.env.ADMIN_USERNAME || "admin";
  const adminPass = process.env.ADMIN_PASSWORD || "BrandyAdmin@2026";
  const adminEmail = process.env.ADMIN_EMAIL || "creativepawan89@gmail.com";
  const secret = process.env.ADMIN_SESSION_SECRET || "brandy-dev-session-secret-change-me";

  try {
    const body = req.body || {};

    if (body.action === "login") {
      const { username, password } = body;
      const validUser = username === adminUser || username === adminEmail;
      if (validUser && password === adminPass) {
        const token = signToken(
          { role: "admin", username: adminUser, email: adminEmail, exp: Date.now() + 1000 * 60 * 60 * 12 },
          secret
        );
        return res.status(200).json({ ok: true, token, admin: { username: adminUser, email: adminEmail } });
      }
      return res.status(401).json({ error: "Invalid administrator credentials." });
    }

    const authHeader = req.headers.authorization || "";
    const token = authHeader.replace(/^Bearer\s+/i, "");
    const session = verifyToken(token, secret);
    if (!session || session.role !== "admin") {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const db = getDb();
    if (!db) {
      return res.status(200).json({
        ok: true,
        firebaseAdminConfigured: false,
        message: "Authenticated. Add FIREBASE_PROJECT_ID / CLIENT_EMAIL / PRIVATE_KEY in Vercel for server-side Firestore sync.",
      });
    }

    const allowed = new Set(["users", "orders", "inquiries", "portfolio", "briefs", "ai_generations"]);
    const col = body.collection;
    if (!allowed.has(col)) return res.status(400).json({ error: "Invalid collection" });

    if (body.action === "list") {
      const snap = await db.collection(col).orderBy("createdAt", "desc").limit(100).get();
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      return res.status(200).json({ ok: true, firebaseAdminConfigured: true, items });
    }

    if (body.action === "update" && body.id && body.data) {
      await db.collection(col).doc(body.id).set(body.data, { merge: true });
      return res.status(200).json({ ok: true });
    }

    if (body.action === "delete" && body.id) {
      await db.collection(col).doc(body.id).delete();
      return res.status(200).json({ ok: true });
    }

    return res.status(400).json({ error: "Unknown action" });
  } catch (err) {
    console.error("Admin API error:", err);
    return res.status(500).json({ error: err.message });
  }
}
