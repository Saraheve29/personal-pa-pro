// Gmail API handler — send emails on behalf of user
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { access_token, to, subject, body, action } = req.body;
  if (!access_token) return res.status(401).json({ error: "No access token" });

  // Get user email
  if (action === "profile") {
    const r = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${access_token}` }
    });
    return res.status(200).json(await r.json());
  }

  // List recent emails
  if (action === "list") {
    const r = await fetch(
      "https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=20&q=in:inbox",
      { headers: { Authorization: `Bearer ${access_token}` } }
    );
    const data = await r.json();
    if (!data.messages) return res.status(200).json({ messages: [] });
    
    // Get snippets for each message
    const messages = await Promise.all(
      data.messages.slice(0, 10).map(async m => {
        const msg = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${m.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date`,
          { headers: { Authorization: `Bearer ${access_token}` } }
        ).then(r => r.json());
        const headers = msg.payload?.headers || [];
        return {
          id: m.id,
          subject: headers.find(h => h.name === "Subject")?.value || "(no subject)",
          from: headers.find(h => h.name === "From")?.value || "",
          date: headers.find(h => h.name === "Date")?.value || "",
          snippet: msg.snippet || ""
        };
      })
    );
    return res.status(200).json({ messages });
  }

  // Send email
  if (action === "send") {
    if (!to || !subject || !body) return res.status(400).json({ error: "Missing to, subject or body" });
    
    const email = [
      `To: ${to}`,
      `Subject: ${subject}`,
      `Content-Type: text/plain; charset=utf-8`,
      `MIME-Version: 1.0`,
      ``,
      body
    ].join("\n");

    const encoded = btoa(unescape(encodeURIComponent(email)))
      .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

    const r = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${access_token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ raw: encoded })
    });
    const data = await r.json();
    if (!r.ok) return res.status(r.status).json({ error: data.error?.message || "Send failed" });
    return res.status(200).json({ success: true, id: data.id });
  }

  return res.status(400).json({ error: "Invalid action" });
}
