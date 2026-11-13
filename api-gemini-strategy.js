import { GoogleGenAI } from "@google/genai";

const SYSTEM_PROMPTS = {
  social: `You are Brandy's Senior Social Media & Short-Form Video Strategist.
Create a concise, high-converting, executive-ready 14-day social campaign plan tailored to the user's brand, audience, and goal.
Include:
1. Core Positioning & Content Pillars (3 pillars)
2. 4 High-Retention Short-Form Video Hooks (Reels/TikTok/Shorts) with visual direction
3. 2 Carousel / Static Post concepts with slide-by-slide outline
4. Influencer & Community Engagement cadence
Keep formatting crisp with Markdown headings and bullet points. Avoid fluff.`,

  content: `You are Brandy's Editorial & Content Marketing Director.
Create a structured B2B/B2C content engine blueprint tailored to the user's brand.
Include:
1. 3 High-Intent Blog / Guide Titles with target SEO angle
2. 1 Flagship Case Study structure (Challenge -> Execution -> Measurable Lift)
3. 1 Lead Magnet / Guide concept to capture qualified emails
Keep it practical, authoritative, and conversion-focused.`,

  cro: `You are Brandy's Principal Web Designer & Conversion Rate Optimization (CRO) Architect.
Deliver an actionable website & landing page blueprint for the user's brand.
Include:
1. Above-the-Fold Hero Copy (Headline, Subheadline, Primary CTA)
2. Page Architecture & Trust Signals (Proof of work, social proof, objection handling)
3. 3 High-Impact CRO Experiments to lift demo bookings or checkout conversions
Keep it crisp and structured.`,
};

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
    const {
      brandName = "Your Brand",
      industry = "Technology / Consumer",
      audience = "Decision makers and online buyers",
      goal = "Increase qualified leads and social engagement",
      mode = "social",
      notes = "",
    } = req.body || {};

    const systemInstruction = SYSTEM_PROMPTS[mode] || SYSTEM_PROMPTS.social;
    const prompt = [
      `Brand Name: ${String(brandName).slice(0, 120)}`,
      `Industry / Niche: ${String(industry).slice(0, 120)}`,
      `Target Audience: ${String(audience).slice(0, 240)}`,
      `Primary Goal: ${String(goal).slice(0, 240)}`,
      notes ? `Additional Context: ${String(notes).slice(0, 500)}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    const client = new GoogleGenAI({ apiKey });
    const interaction = await client.interactions.create({
      model: "gemini-3.8-flash",
      system_instruction: systemInstruction,
      input: prompt,
      store: false,
    });

    return res.status(200).json({
      ok: true,
      model: "gemini-3.8-flash",
      output: interaction.output_text || "No response generated.",
    });
  } catch (err) {
    console.error("Gemini strategy error:", err);
    return res.status(500).json({ error: err?.message || "Failed to generate strategy." });
  }
}
