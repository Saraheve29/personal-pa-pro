export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if(req.method==="OPTIONS") return res.status(200).end();

  const { action, code, tokens, client_id, client_secret } = 
    req.method==="POST" ? req.body : req.query;

  const CLIENT_ID = process.env.GOOGLE_CLIENT_ID || client_id;
  const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || client_secret;
  if(!CLIENT_ID||!CLIENT_SECRET) return res.status(500).json({error:"Google credentials not configured"});
  const REDIRECT_URI = "https://personal-pa-pro.vercel.app/api/auth/callback";
  console.log("Auth request, action:", action, "CLIENT_ID present:", !!CLIENT_ID);

  if(action==="url"){
    const params=new URLSearchParams({
      client_id:CLIENT_ID,
      redirect_uri:REDIRECT_URI,
      response_type:"code",
      scope:"https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events email profile",
      access_type:"offline",
      prompt:"consent"
    });
    return res.status(200).json({url:`https://accounts.google.com/o/oauth2/v2/auth?${params}`});
  }

  if(action==="token"&&code){
    const r=await fetch("https://oauth2.googleapis.com/token",{
      method:"POST",
      headers:{"Content-Type":"application/x-www-form-urlencoded"},
      body:new URLSearchParams({code,client_id:CLIENT_ID,client_secret:CLIENT_SECRET,redirect_uri:REDIRECT_URI,grant_type:"authorization_code"})
    });
    const data=await r.json();
    if(!r.ok) return res.status(400).json({error:data.error_description||"Token exchange failed"});
    return res.status(200).json(data);
  }

  if(action==="refresh"&&tokens){
    const r=await fetch("https://oauth2.googleapis.com/token",{
      method:"POST",
      headers:{"Content-Type":"application/x-www-form-urlencoded"},
      body:new URLSearchParams({refresh_token:tokens.refresh_token,client_id:CLIENT_ID,client_secret:CLIENT_SECRET,grant_type:"refresh_token"})
    });
    return res.status(200).json(await r.json());
  }

  return res.status(400).json({error:"Invalid action"});
}
