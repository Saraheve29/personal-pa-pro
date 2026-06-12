const DEFAULT_API_KEY = "6ba6f15affeafd0bbaaf8ebf9bc406506ca82fcfbf9c1907894f63307f060cf8";
const DEFAULT_VOICE_ID = "TYKLc7ViOIGE13dSZYlK"; // Rachel

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { text, apiKey, voiceId } = req.body;
  if (!text) return res.status(400).json({ error: "No text provided" });

  const key = process.env.ELEVENLABS_API_KEY || apiKey || DEFAULT_API_KEY;
  const voice = voiceId || DEFAULT_VOICE_ID;

  try {
    const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice}`, {
      method: "POST",
      headers: {
        "xi-api-key": key,
        "Content-Type": "application/json",
        "Accept": "audio/mpeg"
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_monolingual_v1",
        voice_settings: { stability: 0.5, similarity_boost: 0.8, style: 0.2, use_speaker_boost: true }
      })
    });

    if (!r.ok) {
      const err = await r.text();
      return res.status(r.status).json({ error: "ElevenLabs error: " + err });
    }

    const buffer = await r.arrayBuffer();
    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Content-Length", buffer.byteLength);
    return res.status(200).send(Buffer.from(buffer));
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
