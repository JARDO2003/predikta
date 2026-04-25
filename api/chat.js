// api/chat.js — Proxy Vercel pour Anthropic Claude (COMEO AI)
// ─────────────────────────────────────────────────────────────
// INSTALLATION :
//   1. Placez ce fichier dans /api/chat.js à la racine de votre projet Vercel
//   2. Dans Vercel Dashboard → Settings → Environment Variables, ajoutez :
//      Nom : ANTHROPIC_API_KEY   Valeur : sk-ant-xxxxxxxxxxxx
//   3. Redéployez

export const config = { api: { bodyParser: true } };

export default async function handler(req, res) {
  // ── CORS ──────────────────────────────────────────────────
  res.setHeader("Access-Control-Allow-Origin",  "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST")
    return res.status(405).json({ error: "Méthode non autorisée" });

  // ── Clé API ───────────────────────────────────────────────
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: "ANTHROPIC_API_KEY manquante. Configurez-la dans Vercel → Settings → Environment Variables."
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

  // ── Appel Anthropic ───────────────────────────────────────
  try {
    const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method:  "POST",
      headers: {
        "Content-Type":      "application/json",
        "x-api-key":         apiKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model:      model      || "claude-sonnet-4-20250514",
        max_tokens: max_tokens || 4000,
        system:     system,
        messages:   [{ role: "user", content: message }]
      })
    });

    if (!anthropicRes.ok) {
      const errBody = await anthropicRes.json().catch(() => ({}));
      const errMsg  = errBody.error?.message || `Erreur Anthropic HTTP ${anthropicRes.status}`;
      return res.status(anthropicRes.status).json({ error: errMsg });
    }

    const data = await anthropicRes.json();
    const text = (data.content || []).map(b => b.text || "").join("");
    return res.status(200).json({ text });

  } catch (err) {
    return res.status(500).json({ error: "Erreur serveur proxy : " + (err.message || String(err)) });
  }
}
