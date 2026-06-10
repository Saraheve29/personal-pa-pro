export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const body = req.body;
  const { action } = body;

  // ── GOOGLE OAUTH ──
  if (action === "url" || action === "token" || action === "refresh") {
    const { code, tokens, client_id, client_secret } = body;
    const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
    const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
    const REDIRECT_URI = "https://personal-pa-pro.vercel.app/api/auth/callback";

    if (action === "url") {
      const params = new URLSearchParams({
        client_id: CLIENT_ID,
        redirect_uri: REDIRECT_URI,
        response_type: "code",
        scope: "https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events email profile",
        access_type: "offline",
        prompt: "consent"
      });
      return res.status(200).json({ url: `https://accounts.google.com/o/oauth2/v2/auth?${params}` });
    }

    if (action === "token" && code) {
      const r = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ code, client_id: CLIENT_ID, client_secret: CLIENT_SECRET, redirect_uri: REDIRECT_URI, grant_type: "authorization_code" })
      });
      const data = await r.json();
      if (!r.ok) return res.status(400).json({ error: data.error_description || "Token exchange failed" });
      return res.status(200).json(data);
    }

    if (action === "refresh") {
      const r = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ refresh_token: tokens.refresh_token, client_id: CLIENT_ID, client_secret: CLIENT_SECRET, grant_type: "refresh_token" })
      });
      return res.status(200).json(await r.json());
    }
  }

  // ── GMAIL ──
  if (action === "gmail_profile" || action === "gmail_list" || action === "gmail_send") {
    const { access_token, to, subject, body: emailBody } = body;
    if (!access_token) return res.status(401).json({ error: "No access token" });

    if (action === "gmail_profile") {
      const r = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: { Authorization: `Bearer ${access_token}` }
      });
      return res.status(200).json(await r.json());
    }

    if (action === "gmail_list") {
      const r = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=20&q=in:inbox", {
        headers: { Authorization: `Bearer ${access_token}` }
      });
      const data = await r.json();
      if (!data.messages) return res.status(200).json({ messages: [] });
      const messages = await Promise.all(data.messages.slice(0, 10).map(async m => {
        const msg = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${m.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date`, {
          headers: { Authorization: `Bearer ${access_token}` }
        }).then(r => r.json());
        const h = msg.payload?.headers || [];
        return { id: m.id, subject: h.find(x => x.name === "Subject")?.value || "(no subject)", from: h.find(x => x.name === "From")?.value || "", date: h.find(x => x.name === "Date")?.value || "", snippet: msg.snippet || "" };
      }));
      return res.status(200).json({ messages });
    }

    if (action === "gmail_send") {
      const email = [`To: ${to}`, `Subject: ${subject}`, `Content-Type: text/plain; charset=utf-8`, `MIME-Version: 1.0`, ``, emailBody].join("\n");
      const encoded = Buffer.from(email).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
      const r = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
        method: "POST",
        headers: { Authorization: `Bearer ${access_token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ raw: encoded })
      });
      const data = await r.json();
      if (!r.ok) return res.status(r.status).json({ error: data.error?.message || "Send failed" });
      return res.status(200).json({ success: true });
    }
  }

  // ── GOOGLE CALENDAR ──
  if (action === "cal_list" || action === "cal_add") {
    const { access_token, event, calendarId = "primary" } = body;
    if (!access_token) return res.status(401).json({ error: "No access token" });
    const base = "https://www.googleapis.com/calendar/v3";
    const headers = { Authorization: `Bearer ${access_token}`, "Content-Type": "application/json" };

    if (action === "cal_list") {
      const now = new Date().toISOString();
      const future = new Date(Date.now() + 90 * 86400000).toISOString();
      const r = await fetch(`${base}/calendars/${calendarId}/events?timeMin=${now}&timeMax=${future}&maxResults=50&singleEvents=true&orderBy=startTime`, { headers });
      const data = await r.json();
      if (!r.ok) return res.status(r.status).json({ error: data.error?.message });
      const events = (data.items || []).map(e => ({
        id: e.id, title: e.summary || "(no title)",
        date: (e.start?.dateTime || e.start?.date || "").slice(0, 10),
        time: e.start?.dateTime ? e.start.dateTime.slice(11, 16) : "09:00",
        notes: e.description || e.location || "", source: "calendar"
      }));
      return res.status(200).json({ events });
    }

    if (action === "cal_add" && event) {
      const isAllDay = !event.time || event.time === "09:00";
      const startDateTime = `${event.date}T${event.time || "09:00"}:00`;
      const endHour = String(parseInt((event.time || "09:00").slice(0, 2)) + 1).padStart(2, "0");
      const endDateTime = `${event.date}T${endHour}:${(event.time || "09:00").slice(3)}:00`;
      const b = {
        summary: event.title, description: event.notes || "",
        start: isAllDay ? { date: event.date } : { dateTime: startDateTime, timeZone: "Europe/London" },
        end: isAllDay ? { date: event.date } : { dateTime: endDateTime, timeZone: "Europe/London" },
        reminders: { useDefault: true }
      };
      const r = await fetch(`${base}/calendars/${calendarId}/events`, { method: "POST", headers, body: JSON.stringify(b) });
      const data = await r.json();
      if (!r.ok) return res.status(r.status).json({ error: data.error?.message || "Failed to add event" });
      return res.status(200).json({ success: true, id: data.id });
    }
  }

  // ── ANTHROPIC AI ──
  try {
    const { prompt, messages, system, max_tokens = 2000, model = "claude-sonnet-4-6" } = body;
    const msgs = messages || [{ role: "user", content: prompt }];
    if (!msgs || !msgs.length) return res.status(400).json({ error: "Missing messages" });
    const requestBody = { model, max_tokens, messages: msgs };
    if (system) requestBody.system = system;
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "anthropic-version": "2023-06-01", "x-api-key": process.env.ANTHROPIC_API_KEY },
      body: JSON.stringify(requestBody),
    });
    const data = await response.json();
    if (!response.ok) return res.status(response.status).json({ error: data?.error?.message || "Anthropic API error" });
    return res.status(200).json(data);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
