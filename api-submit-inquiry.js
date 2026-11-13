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

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { type = "inquiry", payload = {} } = req.body || {};
    const db = getDb();
    if (db) {
      const collectionName = type === "order" ? "orders" : "inquiries";
      const docRef = await db.collection(collectionName).add({
        ...payload,
        createdAt: new Date().toISOString(),
        source: "vercel-api",
      });
      return res.status(200).json({ ok: true, id: docRef.id, storedIn: "firestore" });
    }

    return res.status(200).json({
      ok: true,
      storedIn: "client-fallback",
      message: "Received. Configure Firebase Admin env vars in Vercel for server-side persistence.",
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
