export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { url } = req.body;
  if (!url) return res.status(400).json({ error: "No URL provided" });

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; PersonalPAPro/1.0)",
      },
    });

    if (!response.ok) {
      return res.status(response.status).json({ 
        error: `Calendar returned status ${response.status}. Please check your iCal URL is correct.` 
      });
    }

    const text = await response.text();

    if (!text.includes("BEGIN:VCALENDAR")) {
      return res.status(400).json({ 
        error: "This doesn't look like a calendar file. Please paste the full iCal URL from Google Calendar settings." 
      });
    }

    return res.status(200).json({ ical: text });
  } catch (e) {
    return res.status(500).json({ error: "Could not fetch calendar: " + e.message });
  }
}
