// Google Calendar API handler
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { access_token, action, event, calendarId = "primary" } = req.body;
  if (!access_token) return res.status(401).json({ error: "No access token" });

  const base = "https://www.googleapis.com/calendar/v3";
  const headers = { Authorization: `Bearer ${access_token}`, "Content-Type": "application/json" };

  // List upcoming events
  if (action === "list") {
    const now = new Date().toISOString();
    const future = new Date(Date.now() + 90 * 86400000).toISOString();
    const r = await fetch(
      `${base}/calendars/${calendarId}/events?timeMin=${now}&timeMax=${future}&maxResults=50&singleEvents=true&orderBy=startTime`,
      { headers }
    );
    const data = await r.json();
    if (!r.ok) return res.status(r.status).json({ error: data.error?.message });
    
    const events = (data.items || []).map(e => ({
      id: e.id,
      title: e.summary || "(no title)",
      date: (e.start?.dateTime || e.start?.date || "").slice(0, 10),
      time: e.start?.dateTime ? e.start.dateTime.slice(11, 16) : "09:00",
      notes: e.description || e.location || "",
      source: "calendar"
    }));
    return res.status(200).json({ events });
  }

  // Add event to Google Calendar
  if (action === "add" && event) {
    const startDateTime = event.time && event.time !== "09:00"
      ? `${event.date}T${event.time}:00`
      : event.date;
    const isAllDay = !event.time || event.time === "09:00";
    
    const body = {
      summary: event.title,
      description: event.notes || "",
      start: isAllDay ? { date: event.date } : { dateTime: startDateTime, timeZone: "Europe/London" },
      end: isAllDay ? { date: event.date } : { dateTime: `${event.date}T${event.time.replace(/(\d{2}):(\d{2})/, (_, h, m) => `${String(parseInt(h)+1).padStart(2,'0')}:${m}`)}:00`, timeZone: "Europe/London" },
      reminders: { useDefault: true }
    };

    const r = await fetch(`${base}/calendars/${calendarId}/events`, {
      method: "POST", headers,
      body: JSON.stringify(body)
    });
    const data = await r.json();
    if (!r.ok) return res.status(r.status).json({ error: data.error?.message || "Failed to add event" });
    return res.status(200).json({ success: true, id: data.id });
  }

  return res.status(400).json({ error: "Invalid action" });
}
