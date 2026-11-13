import { GoogleGenAI } from "@google/genai";

const SYSTEM_INSTRUCTION = `You are Brandy Assistant, the friendly and sharp AI chatbot for Brandy Digital Agency.

About Brandy:
- Services: Short-form vertical video production (Reels, Shorts, TikToks), social media management, SEO blogs/guides, and conversion-focused brand websites.
- Focus categories: Consumer tech (earphones, cell phones), food & beverage (chocolates, snacks), and emerging D2C brands.
- Pricing: Simple, flat-rate Weekly Growth Sprint at $100/week (no long-term monthly lock-in).
- Payment: Instant PayPal QR checkout on the Pricing page (PayPal to Pawan Kumar), then submit transaction ID.
- Contact: creativepawan89@gmail.com or via the Contact page.

Your role:
- Answer visitor questions about Brandy's services, $100/week pricing, onboarding, and deliverables clearly and concisely.
- Help brand owners brainstorm short-form video hooks, content ideas, or landing page improvements for their products.
- Keep responses concise, practical, and easy to read. Never invent fake past view counts or inflated metrics.`;

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(503).json({
      error: "GEMINI_API_KEY is not configured in Vercel Environment Variables.",
      code: "MISSING_API_KEY",
    });
  }

  try {
    const { messages = [] } = req.body || {};
    const validMessages = Array.isArray(messages)
      ? messages
          .filter((m) => m && typeof m.text === "string" && m.text.trim())
          .slice(-16)
          .map((m) => ({
            role: m.role === "assistant" || m.role === "model" ? "model" : "user",
            parts: [{ text: m.text.trim().slice(0, 2000) }],
          }))
      : [];

    if (!validMessages.length) {
      return res.status(400).json({ error: "Please enter a message." });
    }

    const client = new GoogleGenAI({ apiKey });
    const response = await client.models.generateContent({
      model: "gemini-2.5-flash",
      contents: validMessages,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
      },
    });

    return res.status(200).json({
      ok: true,
      model: "gemini-2.5-flash",
      reply: response.text || "I couldn't generate a response. Please try again.",
    });
  } catch (err) {
    console.error("Gemini chatbot error:", err);
    return res.status(500).json({ error: err?.message || "Failed to generate reply." });
  }
}
