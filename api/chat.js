export const config = { api: { bodyParser: true } };

export default async function handler(req, res) {

  // ── CORS ──────────────────────────────────────────────────
  res.setHeader("Access-Control-Allow-Origin",  "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST")
    return res.status(405).json({ error: "Méthode non autorisée" });

  // ── Clé API Groq ──────────────────────────────────────────
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: "GROQ_API_KEY manquante. Configurez-la dans Vercel → Settings → Environment Variables."
    });
  }

  // ── Lecture body ──────────────────────────────────────────
  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  const { system = "", message, model, max_tokens } = body || {};
  if (!message || typeof message !== "string" || !message.trim()) {
    return res.status(400).json({ error: "Le champ 'message' est requis et doit être une chaîne non vide." });
  }

  // ── Appel Groq API ────────────────────────────────────────
  try {
    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method:  "POST",
      headers: {
        "Content-Type":  "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model:      model      || "llama-3.3-70b-versatile",
        max_tokens: max_tokens || 4000,
        messages: [
          ...(system ? [{ role: "system", content: system }] : []),
          { role: "user", content: message }
        ]
      })
    });

    if (!groqRes.ok) {
      const errBody = await groqRes.json().catch(() => ({}));
      const errMsg  = errBody.error?.message || `Erreur Groq HTTP ${groqRes.status}`;
      return res.status(groqRes.status).json({ error: errMsg });
    }

    const data = await groqRes.json();
    const text = data.choices?.[0]?.message?.content || "";
    return res.status(200).json({ text });

  } catch (err) {
    return res.status(500).json({ error: "Erreur serveur proxy : " + (err.message || String(err)) });
  }
}
