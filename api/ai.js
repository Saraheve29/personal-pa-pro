export default async function handler(req, res) {
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    return res.status(200).end();
  }
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "No API key found in environment" });
  }

  try {
    const { prompt, messages, system, max_tokens = 2000, model = "claude-sonnet-4-20250514" } = req.body || {};
    const msgs = messages || (prompt ? [{ role: "user", content: prompt }] : null);
    if (!msgs || !msgs.length) {
      return res.status(400).json({ error: "Missing prompt or messages" });
    }
    const body = { model, max_tokens, messages: msgs };
    if (system) body.system = system;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "anthropic-version": "2023-06-01",
        "x-api-key": apiKey,
      },
      body: JSON.stringify(body),
    });

    const text = await response.text();
    let data;
    try { data = JSON.parse(text); } catch(e) { return res.status(500).json({ error: "Bad response from Anthropic: " + text.slice(0,200) }); }

    if (!response.ok) {
      return res.status(response.status).json({ error: data?.error?.message || data?.error || text.slice(0,300) });
    }
    return res.status(200).json(data);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
