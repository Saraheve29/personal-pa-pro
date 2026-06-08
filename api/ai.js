export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  try {
    const { prompt, messages, system, max_tokens = 2000, model = "claude-sonnet-4-20250514" } = req.body;
    const msgs = messages || [{ role: "user", content: prompt }];
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
        "x-api-key": process.env.ANTHROPIC_API_KEY,
      },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      console.error("Anthropic error:", err);
      return res.status(response.status).json({ error: err });
    }
    const data = await response.json();
    return res.status(200).json(data);
  } catch (e) {
    console.error("Proxy error:", e);
    return res.status(500).json({ error: e.message });
  }
}
