import { useState, useEffect, useRef } from "react";

const C={
  parchment:"#FAF6EE",cream:"#F4EDD8",creamDeep:"#EDE0C4",
  card:"#FFFDF8",cardWarm:"#FDF8EE",
  ink:"#1C1812",inkMid:"#3D3628",inkLight:"#7A6E5C",inkFaint:"#B0A690",
  gold:"#9A7B3C",goldBright:"#C4993E",goldLight:"#E8C97A",
  goldPale:"#F7EDCC",goldBorder:"#D4B86A",
  crimson:"#7A2530",crimsonBg:"#FDF0EF",
  emerald:"#2A5C42",emeraldBg:"#EEF6F1",
  sapphire:"#2A3E6A",sapphireBg:"#EEF1F8",
  border:"#DDD5C0",borderSoft:"#EBE4D2",
  shadow:"rgba(60,40,10,0.08)",shadowMed:"rgba(60,40,10,0.14)",
};
const FD="'Cormorant Garamond','Didot','Big Caslon',Georgia,serif";
const FB="'Tenor Sans','Optima','Gill Sans','Century Gothic',sans-serif";
const FM="'Courier Prime','Courier New',monospace";

const today=new Date();
const fmt=d=>d.toISOString().slice(0,10);

const UK_HOLIDAYS=[
  {name:"Summer Holiday",      start:"2025-07-22",end:"2025-09-01",type:"school"},
  {name:"Autumn Half Term",    start:"2025-10-27",end:"2025-10-31",type:"school"},
  {name:"Christmas Holiday",   start:"2025-12-20",end:"2026-01-05",type:"school"},
  {name:"February Half Term",  start:"2026-02-16",end:"2026-02-20",type:"school"},
  {name:"Easter Holiday",      start:"2026-03-30",end:"2026-04-14",type:"school"},
  {name:"May Bank Holiday",    start:"2026-05-04",end:"2026-05-04",type:"bank"},
  {name:"Spring Half Term",    start:"2026-05-25",end:"2026-05-29",type:"school"},
  {name:"Summer Holiday 2026", start:"2026-07-21",end:"2026-09-07",type:"school"},
];
const upcomingHols=(n=5)=>{const t=fmt(today);return UK_HOLIDAYS.filter(h=>h.end>=t).sort((a,b)=>a.start.localeCompare(b.start)).slice(0,n);};
const daysUntil=ds=>Math.ceil((new Date(ds+"T12:00:00")-today)/86400000);
const fmtRange=(s,e)=>{const sd=new Date(s+"T12:00:00"),ed=new Date(e+"T12:00:00");if(s===e)return sd.toLocaleDateString("en-GB",{day:"numeric",month:"long"});return`${sd.toLocaleDateString("en-GB",{day:"numeric",month:"short"})} – ${ed.toLocaleDateString("en-GB",{day:"numeric",month:"short"})}`;};

const INIT=[];
const PM={
  critical:{label:"Critical",color:C.crimson,  bg:C.crimsonBg, glyph:"◆"},
  high:    {label:"High",    color:C.gold,     bg:C.goldPale,  glyph:"◈"},
  medium:  {label:"Medium",  color:C.sapphire, bg:C.sapphireBg,glyph:"◇"},
  low:     {label:"Low",     color:C.inkFaint, bg:C.parchment, glyph:"○"},
};
const getConflicts=evs=>{
  const out=[];
  const byD={};
  evs.forEach(e=>{(byD[e.date]=byD[e.date]||[]).push(e);});
  Object.values(byD).forEach(day=>{
    for(let i=0;i<day.length;i++){
      for(let j=i+1;j<day.length;j++){
        const a=day[i],b=day[j];
        // duplicate: same title and date
        if(a.title.toLowerCase()===b.title.toLowerCase()){
          out.push([a.id,b.id,"duplicate"]);
        // time conflict: same time slot
        } else if(a.time&&b.time&&a.time===b.time){
          out.push([a.id,b.id,"conflict"]);
        }
      }
    }
  });
  return out;
};

/* ── COMPONENTS ── */
/* ── SWAP THIS PATH when you have a real photo ── */
const PA_PHOTO = null; /* e.g.  "/eleanor.jpg"  once uploaded to /public */

function PaAvatar({size=52,pulse=false,speaking=false}){
  return(
    <div style={{position:"relative",width:size,height:size,flexShrink:0}}>
      <div style={{position:"absolute",inset:-4,borderRadius:"50%",background:`conic-gradient(${C.goldBright},${C.goldLight},${C.goldBorder},${C.gold},${C.goldBright})`,opacity:speaking?0.9:0.5,animation:speaking?"paRing 1.8s linear infinite":pulse?"paRingIdle 3s ease-in-out infinite":"none",boxShadow:speaking?`0 0 18px ${C.goldLight}`:pulse?`0 0 10px ${C.goldPale}`:"none"}}/>
      <div style={{position:"absolute",inset:2,borderRadius:"50%",background:`linear-gradient(145deg,${C.cream},${C.creamDeep})`,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`inset 0 1px 3px ${C.shadow}`,overflow:"hidden"}}>
        {PA_PHOTO
          ? <img src={PA_PHOTO} alt="Eleanor" style={{width:"100%",height:"100%",objectFit:"cover",borderRadius:"50%"}}/>
          : <span style={{fontFamily:FD,fontSize:size*0.38,color:C.gold,fontStyle:"italic",lineHeight:1,userSelect:"none"}}>PA</span>
        }
      </div>
      {speaking&&<div style={{position:"absolute",bottom:1,right:1,width:10,height:10,borderRadius:"50%",background:C.emerald,border:`2px solid ${C.card}`,boxShadow:`0 0 6px ${C.emerald}`}}/>}
    </div>
  );
}
function Waveform({active=false}){
  const bars=[0.4,0.7,1,0.85,0.55,0.9,0.65,0.45,0.8,0.6,0.95,0.5,0.75,0.4,0.6];
  return(<div style={{display:"flex",alignItems:"center",gap:2,height:24,padding:"0 2px"}}>{bars.map((h,i)=>(<div key={i} style={{width:3,borderRadius:2,background:`linear-gradient(to top,${C.gold},${C.goldLight})`,height:active?`${h*100}%`:"18%",animation:active?`wave${i%5} ${0.6+i*0.07}s ease-in-out infinite alternate`:"none",transition:"height 0.3s ease",opacity:active?0.9:0.3}}/>))}</div>);
}
function TypingDots(){
  return(<div style={{display:"flex",gap:5,alignItems:"center",padding:"4px 2px"}}>{[0,1,2].map(i=>(<div key={i} style={{width:7,height:7,borderRadius:"50%",background:C.gold,animation:`typingDot 1.2s ${i*0.2}s ease-in-out infinite`}}/>))}</div>);
}
function StatusBadge({status}){
  const map={idle:{label:"Available",color:C.emerald},thinking:{label:"Thinking…",color:C.gold},speaking:{label:"Responding",color:C.sapphire}};
  const s=map[status]||map.idle;
  return(<div style={{display:"flex",alignItems:"center",gap:6}}><div style={{width:6,height:6,borderRadius:"50%",background:s.color,boxShadow:`0 0 6px ${s.color}`,animation:status!=="idle"?"statusPulse 1.5s ease-in-out infinite":"none"}}/><span style={{fontSize:10,fontFamily:FM,letterSpacing:"0.14em",color:s.color,textTransform:"uppercase"}}>{s.label}</span></div>);
}

/* ── IMPORT METHOD ICONS (SVG) ── */
const ImportIcon=({type,size=36})=>{
  const paths={
    text:{d:"M4 6h16M4 10h12M4 14h14M4 18h10",stroke:C.gold},
    image:{d:"M3 7a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7zm5 2a2 2 0 100 4 2 2 0 000-4zm9 7l-3-4-3 3-2-2-3 3",stroke:C.gold},
    email:{d:"M3 8l9 6 9-6M3 8a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z",stroke:C.gold},
    calendar:{d:"M8 4v2m8-2v2M3 10h18M5 6h14a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2zm4 8h2m2 0h2m-6 4h2m2 0h2",stroke:C.gold},
  };
  const p=paths[type]||paths.text;
  return(<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={p.stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d={p.d}/></svg>);
};

function ConflictAlert({cfls,events,onDelete}){
  const [open,setOpen]=useState(false);
  if(!cfls.length)return null;
  const dupes=cfls.filter(c=>c[2]==="duplicate");
  const conflicts=cfls.filter(c=>c[2]==="conflict");
  const label=dupes.length&&conflicts.length?"Duplicates & Conflicts detected":
    dupes.length?`${dupes.length} duplicate${dupes.length>1?"s":""} detected`:
    `${conflicts.length} scheduling conflict${conflicts.length>1?"s":""} detected`;
  return(
    <div style={{marginBottom:12}}>
      <div onClick={()=>setOpen(o=>!o)} style={{border:`1px solid ${C.crimson}`,background:C.crimsonBg,padding:"12px 16px",borderRadius:4,borderLeft:`4px solid ${C.crimson}`,cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div style={{fontSize:13,color:C.crimson,fontFamily:FB,fontWeight:500}}>◆ {label}</div>
        <div style={{fontSize:11,color:C.crimson,fontFamily:FM}}>{open?"▲ Hide":"▼ Show"}</div>
      </div>
      {open&&<div style={{background:C.crimsonBg,border:`1px solid ${C.crimson}`,borderTop:"none",borderRadius:"0 0 4px 4px",padding:"12px 16px"}}>
        {cfls.map(([id1,id2,type],i)=>{
          const e1=events.find(e=>e.id===id1);
          const e2=events.find(e=>e.id===id2);
          if(!e1||!e2)return null;
          const isDupe=type==="duplicate";
          return(
            <div key={i} style={{background:"rgba(255,255,255,0.6)",borderRadius:4,padding:"10px 12px",marginBottom:i<cfls.length-1?8:0}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                <div style={{fontSize:10,color:C.crimson,fontFamily:FM,letterSpacing:"0.1em",textTransform:"uppercase"}}>{isDupe?"⚠ Duplicate":"⚡ Time Conflict"}</div>
              </div>
              <div style={{display:"flex",gap:8,alignItems:"stretch"}}>
                <div style={{flex:1,background:C.card,borderRadius:3,padding:"9px 11px",border:`1px solid ${C.crimson}30`}}>
                  <div style={{fontSize:12,color:C.crimson,fontFamily:FM,marginBottom:2}}>{e1.date} {e1.time}</div>
                  <div style={{fontSize:13,fontFamily:FD,color:C.ink,marginBottom:6}}>{e1.title}</div>
                  <button onClick={()=>onDelete(e1.id)} style={{width:"100%",padding:"5px",border:`1px solid ${C.crimson}`,borderRadius:3,background:"transparent",color:C.crimson,fontFamily:FM,fontSize:9,letterSpacing:"0.1em",textTransform:"uppercase",cursor:"pointer"}}>Remove</button>
                </div>
                <div style={{display:"flex",alignItems:"center",color:C.crimson,fontFamily:FM,fontSize:14}}>{isDupe?"=":"⚡"}</div>
                <div style={{flex:1,background:C.card,borderRadius:3,padding:"9px 11px",border:`1px solid ${C.crimson}30`}}>
                  <div style={{fontSize:12,color:C.crimson,fontFamily:FM,marginBottom:2}}>{e2.date} {e2.time}</div>
                  <div style={{fontSize:13,fontFamily:FD,color:C.ink,marginBottom:6}}>{e2.title}</div>
                  <button onClick={()=>onDelete(e2.id)} style={{width:"100%",padding:"5px",border:`1px solid ${C.crimson}`,borderRadius:3,background:"transparent",color:C.crimson,fontFamily:FM,fontSize:9,letterSpacing:"0.1em",textTransform:"uppercase",cursor:"pointer"}}>Remove</button>
                </div>
              </div>
              {isDupe&&<div style={{fontSize:11,color:C.crimson,fontFamily:FB,marginTop:6,textAlign:"center"}}>Same event added twice — remove one.</div>}
              {!isDupe&&<div style={{fontSize:11,color:C.crimson,fontFamily:FB,marginTop:6,textAlign:"center"}}>{e1.date} — both at {e1.time}</div>}
            </div>
          );
        })}
      </div>}
    </div>
  );
}

const GLOBAL_CSS=`
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400;1,600&family=Tenor+Sans&family=Courier+Prime&display=swap');
  *{box-sizing:border-box;margin:0;padding:0;}
  html,body{background:${C.parchment};}
  ::-webkit-scrollbar{width:4px;}
  ::-webkit-scrollbar-track{background:${C.cream};}
  ::-webkit-scrollbar-thumb{background:${C.goldBorder};border-radius:2px;}
  input,textarea,select{background:${C.card}!important;color:${C.ink}!important;}
  input::placeholder,textarea::placeholder{color:${C.inkFaint}!important;}
  option{background:${C.card};color:${C.ink};}
  button:active{opacity:0.88;}
  @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
  @keyframes fadeIn{from{opacity:0}to{opacity:1}}
  @keyframes shimmer{0%,100%{opacity:0.45}50%{opacity:1}}
  @keyframes goldPulse{0%,100%{box-shadow:0 0 0 0 rgba(196,153,62,0.35)}60%{box-shadow:0 0 0 12px rgba(196,153,62,0)}}
  @keyframes statusPulse{0%,100%{opacity:0.5}50%{opacity:1}}
  @keyframes paRing{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
  @keyframes paRingIdle{0%,100%{opacity:0.35}50%{opacity:0.65}}
  @keyframes wave0{from{height:18%}to{height:88%}}
  @keyframes wave1{from{height:28%}to{height:72%}}
  @keyframes wave2{from{height:14%}to{height:100%}}
  @keyframes wave3{from{height:24%}to{height:68%}}
  @keyframes wave4{from{height:18%}to{height:82%}}
  @keyframes typingDot{0%,100%{transform:translateY(0);opacity:0.35}50%{transform:translateY(-5px);opacity:1}}
  @keyframes bubblePop{0%{opacity:0;transform:scale(0.93) translateY(6px)}100%{opacity:1;transform:scale(1) translateY(0)}}
  @keyframes heroFadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
  .ev-card{animation:fadeUp 0.3s ease both;}
  .msg-bubble{animation:bubblePop 0.26s cubic-bezier(0.34,1.56,0.64,1) both;}
  .shimmer{animation:shimmer 2.5s ease-in-out infinite;}
  .gold-pulse{animation:goldPulse 2.5s ease-in-out infinite;}
  .hero-card{animation:heroFadeUp 0.4s ease both;}
  .hero-card:hover{transform:translateY(-2px);box-shadow:0 8px 32px rgba(60,40,10,0.16)!important;}
  .import-method:hover{border-color:${C.goldBorder}!important;background:${C.goldPale}!important;}
`;

export default function App(){
  const [events, setEvents] = useState(()=>{
    try{
      const saved=localStorage.getItem("papa_events");
      return saved?JSON.parse(saved):[];
    }catch{return [];}
  });
  const [view,      setView]     =useState("home");    // home | schedule | week | briefing | import | chat | add
  const [impTab,    setImpTab]   =useState("text");
  const [briefing,  setBriefing] =useState(null);
  const [briefBusy, setBriefBusy]=useState(false);
  const [briefExp,  setBriefExp] =useState(null);
  const [msgs, setMsgs] = useState(()=>{
    try{
      const saved=localStorage.getItem("papa_msgs");
      if(saved){
        const parsed=JSON.parse(saved);
        return parsed.map(m=>({...m,ts:new Date(m.ts)}));
      }
    }catch{}
    return [{role:"assistant",text:"Good morning. I'm Eleanor, your Personal Assistant. How may I assist you?",ts:new Date()}];
  });
  const [chatIn,    setChatIn]   =useState("");
  const [paStatus,  setPaStatus] =useState("idle");
  const [showWave,  setShowWave] =useState(false);
  const [newEv,     setNewEv]    =useState({title:"",date:fmt(today),time:"",priority:"medium",notes:"",source:"manual"});
  const [pasteText, setPasteText]=useState("");
  const [pasteBusy, setPasteBusy]=useState(false);
  const [pasteRes,  setPasteRes] =useState(null);
  const [confirmCosts, setConfirmCosts] = useState(false);
  const [editedFinancials, setEditedFinancials] = useState([]);
  const [imgFile,   setImgFile]  =useState(null);
  const [imgB64,    setImgB64]   =useState(null);
  const [imgPrev,   setImgPrev]  =useState(null);
  const [imgBusy,   setImgBusy]  =useState(false);
  const [imgRes,    setImgRes]   =useState(null);
  const [emailSt,   setEmailSt]  =useState("idle");
  const [emailEvs,  setEmailEvs] =useState(null);
  const [calSt,     setCalSt]    =useState("idle");
  const [calEvs,    setCalEvs]   =useState(null);
  // PWA install prompt
  const [installPrompt, setInstallPrompt] = useState(null);
  const [installed, setInstalled] = useState(false);
  useEffect(()=>{
    const handler = e => { e.preventDefault(); setInstallPrompt(e); };
    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", ()=>setInstalled(true));
    return ()=>window.removeEventListener("beforeinstallprompt", handler);
  },[]);
  async function installApp(){
    if(!installPrompt)return;
    installPrompt.prompt();
    const {outcome} = await installPrompt.userChoice;
    if(outcome==="accepted") setInstalled(true);
    setInstallPrompt(null);
  }

  // Save events to localStorage whenever they change
  useEffect(()=>{
    try{ localStorage.setItem("papa_events",JSON.stringify(events)); }catch{}
  },[events]);

  // Save msgs to localStorage whenever they change
  useEffect(()=>{
    try{ localStorage.setItem("papa_msgs",JSON.stringify(msgs)); }catch{}
  },[msgs]);

  // Google OAuth state
  const [googleTokens, setGoogleTokens] = useState(()=>{
    try{const t=localStorage.getItem("papa_google_tokens");return t?JSON.parse(t):null;}catch{return null;}
  });
  const [googleProfile, setGoogleProfile] = useState(()=>{
    try{const p=localStorage.getItem("papa_google_profile");return p?JSON.parse(p):null;}catch{return null;}
  });
  const [googleBusy, setGoogleBusy] = useState(false);

  // Handle OAuth callback
  useEffect(()=>{
    const params=new URLSearchParams(window.location.search);
    const code=params.get("oauth_code")||params.get("code");
    const err=params.get("oauth_error")||params.get("error");
    if(err){alert("Google sign-in failed: "+err);window.history.replaceState({},"","/");return;}
    if(code){
      window.history.replaceState({},"","/");
      exchangeGoogleCode(code);
    }
  },[]);

  async function connectGoogle(){
    setGoogleBusy(true);
    try{
      const r=await fetch("/api/ai",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"url"})});
      const {url}=await r.json();
      window.location.href=url;
    }catch(e){
      alert("Could not connect to Google: "+e.message);
      setGoogleBusy(false);
    }
  }

  async function exchangeGoogleCode(code){
    setGoogleBusy(true);
    try{
      const r=await fetch("/api/ai",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"token",code})});
      const tokens=await r.json();
      if(tokens.error){alert("Auth failed: "+tokens.error);setGoogleBusy(false);return;}
      localStorage.setItem("papa_google_tokens",JSON.stringify(tokens));
      setGoogleTokens(tokens);
      // Get profile
      const pr=await fetch("/api/ai",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({access_token:tokens.access_token,action:"gmail_profile"})});
      const profile=await pr.json();
      localStorage.setItem("papa_google_profile",JSON.stringify(profile));
      setGoogleProfile(profile);
    }catch(e){alert("Auth error: "+e.message);}
    setGoogleBusy(false);
  }

  function disconnectGoogle(){
    localStorage.removeItem("papa_google_tokens");
    localStorage.removeItem("papa_google_profile");
    setGoogleTokens(null);setGoogleProfile(null);
  }

  async function syncGoogleCalendar(){
    if(!googleTokens)return;
    setEmailSt("connecting");
    try{
      const r=await fetch("/api/ai",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({access_token:googleTokens.access_token,action:"gmail_list"})});
      const data=await r.json();
      if(data.error){setEmailSt("idle");alert("Calendar error: "+data.error);return;}
      setCalEvs(data.events||[]);
      setCalSt("mock");
    }catch(e){setCalSt("idle");alert("Calendar sync failed: "+e.message);}
  }

  async function addToGoogleCalendar(event){
    if(!googleTokens)return false;
    try{
      const r=await fetch("/api/ai",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({access_token:googleTokens.access_token,action:"cal_add",event})});
      const data=await r.json();
      return data.success;
    }catch{return false;}
  }

  const chatEnd=useRef(null);

  useEffect(()=>{chatEnd.current?.scrollIntoView({behavior:"smooth"});},[msgs,paStatus]);

  const cfls=getConflicts(events);
  const cflIds=new Set(cfls.flat());
  const todayEvs=events.filter(e=>e.date===fmt(today)).sort((a,b)=>a.time.localeCompare(b.time));
  const weekDays=Array.from({length:7},(_,i)=>{const d=new Date(today.getTime()+i*86400000),ds=fmt(d);return{ds,label:i===0?"Today":d.toLocaleDateString("en-GB",{weekday:"short",day:"numeric",month:"short"}),evs:events.filter(e=>e.date===ds).sort((a,b)=>a.time.localeCompare(b.time))};});
  const nextHol=upcomingHols(1)[0];

  function addEvs(list,src){const mx=Math.max(...events.map(e=>e.id),0);setEvents(ev=>[...ev,...list.map((e,i)=>({...e,id:mx+i+1,source:src}))]);}
  function del(id){setEvents(ev=>ev.filter(e=>e.id!==id));}

  async function callAI(body){
    const r=await fetch("/api/ai",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-6",max_tokens:1500,...body})});
    const d=await r.json();return d.content?.find(b=>b.type==="text")?.text||"";
  }
  const PARSE_SYS=`You are a smart calendar assistant. Extract EVERY date, appointment, trip, holiday, booking, plan or event from the text — no matter how long, messy or informal the input is. Be generous: if something looks like a date or plan, include it. Return ONLY valid JSON with no markdown fences, no explanation, nothing else:
{"events":[{"title":string,"date":"YYYY-MM-DD","time":"HH:MM","priority":"critical|high|medium|low","notes":string}],"summary":string}
Rules:
- If no year is mentioned assume ${today.getFullYear()} or ${today.getFullYear()+1} whichever is in the future
- If no time is given use "09:00"
- If no date is clear use today: ${fmt(today)}
- For multi-day trips create one event for the start date with notes covering the full range
- Priority: flights/medical/school = critical, travel/bookings = high, social = medium, optional = low
- Never return an empty events array — if you find ANY dates at all, include them
- summary should be a warm one-sentence overview of what was found`;

  async function sendChat(){
    if(!chatIn.trim()||paStatus!=="idle")return;
    const u=chatIn.trim();setChatIn("");
    setMsgs(m=>[...m,{role:"user",text:u,ts:new Date()}]);
    setPaStatus("thinking");
    const ctx=events.slice(0,20).map(e=>`${e.date} ${e.time} – ${e.title} (${e.priority})`).join("\n");
    try{
      const raw=await callAI({system:`You are Eleanor, a discreet and impeccably professional Personal Executive Assistant. You serve Sarah — single mother, indie app developer (Thinko, Skyla), Rover dog-sitter, Cambridgeshire. Warm, composed, precise. Write in natural flowing sentences — never bullet points. One question max at a time. Schedule:\n${ctx}\nConflicts:${cfls.length}. Today:${fmt(today)}.`,messages:[...msgs.map(m=>({role:m.role,content:m.text})),{role:"user",content:u}]});
      await new Promise(r=>setTimeout(r,350));setPaStatus("speaking");setShowWave(true);
      await new Promise(r=>setTimeout(r,850));setShowWave(false);
      setMsgs(m=>[...m,{role:"assistant",text:raw,ts:new Date()}]);setPaStatus("idle");
    }catch{setMsgs(m=>[...m,{role:"assistant",text:"I do apologise — something went wrong. Please try once more.",ts:new Date()}]);setPaStatus("idle");setShowWave(false);}
  }

  async function generateBriefing(){
    setBriefBusy(true);setBriefing(null);
    const hols=upcomingHols(6);
    const schedCtx=(()=>{const lines=[];for(let i=0;i<30;i++){const d=new Date(today.getTime()+i*86400000),ds=fmt(d);const de=events.filter(e=>e.date===ds);if(de.length)lines.push(`${ds}: `+de.map(e=>`${e.time} ${e.title} (${e.priority})`).join(", "));}return lines.join("\n")||"No events in next 30 days.";})();
    const holCtx=hols.map(h=>`${h.name}: ${h.start} to ${h.end} (${daysUntil(h.start)} days away)`).join("\n");
    try{const raw=await callAI({system:`You are a discreet, highly intelligent Executive PA. Produce a private executive briefing. Return ONLY valid JSON, no markdown:\n{"headline":string,"today_summary":string,"alerts":[{"title":string,"detail":string,"severity":"high"|"medium"|"low"}],"holiday_advice":[{"holiday":string,"date_range":string,"days_until":number,"advice":string}],"opportunities":[{"title":string,"detail":string}],"weekly_balance":{"score":number,"comment":string},"recommendations":[{"title":string,"detail":string}]}\nToday:${fmt(today)}.`,messages:[{role:"user",content:`Schedule:\n${schedCtx}\n\nHolidays:\n${holCtx}\n\nConflicts:${cfls.length}.`}]});setBriefing(JSON.parse(raw.replace(/```json|```/g,"").trim()));}catch{setBriefing({error:true});}
    setBriefBusy(false);
  }

  async function parsePaste(){
    if(!pasteText.trim()||pasteBusy)return;
    setPasteBusy(true);setPasteRes(null);setConfirmCosts(false);setEditedFinancials([]);
    try{
      const r=await fetch("/api/ai",{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          model:"claude-sonnet-4-6",
          max_tokens:8000,
          system:`You are a life assistant. Extract info from text as compact JSON. Return ONLY raw JSON, no markdown.
Format: {"events":[{"title":string,"date":"YYYY-MM-DD","time":"HH:MM","priority":"critical|high|medium|low","notes":string}],"financials":[{"label":string,"amount":number,"type":"cost|saving|payment","date":string,"notes":string}],"destinations":[{"name":string,"dates":string}],"insights":[{"text":string}],"summary":string,"total_cost":number,"total_saving":number}
Rules: extract every date/trip/payment/cost. No time="09:00". Use future year if none stated. Keep ALL string values under 80 chars. Max 4 insights. Empty array if nothing relevant.`,
          messages:[{role:"user",content:`Analyse this text and extract all information:

${pasteText}`}]
        })
      });
      const d=await r.json();
      if(d.error){
        const msg=typeof d.error==="string"?d.error:d.error?.message||JSON.stringify(d.error);
        setPasteRes({error:true,msg:"API error: "+msg});
        setPasteBusy(false);return;
      }
      const raw=d.content?.find(b=>b.type==="text")?.text||"{}";
      let clean=raw.trim();
      if(clean.includes("```")){
        clean=clean.replace(/```[a-z]*/g,"").replace(/```/g,"").trim();
      }
      const parsed=JSON.parse(clean);
      if(!parsed.events||parsed.events.length===0){
        setPasteRes({error:true,msg:"No dates found. Make sure your text contains specific dates."});
      }else{
        setPasteRes(parsed);
      }
    }catch(e){
      console.error("parsePaste error:",e);
      setPasteRes({error:true,msg:"Something went wrong: "+e.message});
    }
    setPasteBusy(false);
  }

    function handleImg(e){
    const f=e.target.files[0];
    if(!f)return;
    setImgFile(f);setImgRes(null);setImgB64(null);
    const r=new FileReader();
    r.onload=ev=>{
      const result=ev.target.result;
      setImgPrev(result);
      // Store b64 now so parseImg doesn't need to re-read
      const parts=result.split(",");
      if(parts.length>=2) setImgB64(parts[1]);
    };
    r.onerror=()=>console.error("Preview read failed");
    r.readAsDataURL(f);
  }

  async function parseImg(){
    if(!imgFile||imgBusy)return;
    setImgBusy(true);setImgRes(null);
    try{
      // Step 1: Use pre-read b64 from handleImg — avoids double-read ProgressEvent bug
      const b64=imgB64||await new Promise((resolve,reject)=>{
        const reader=new FileReader();
        reader.onload=evt=>{
          try{
            const result=evt.target.result;
            if(!result)return reject(new Error("Empty file result"));
            const parts=result.split(",");
            if(parts.length<2)return reject(new Error("Invalid file format"));
            resolve(parts[1]);
          }catch(e){reject(e);}
        };
        reader.onerror=evt=>reject(new Error("Cannot read file: "+(evt.target?.error?.message||"unknown")));
        reader.onabort=()=>reject(new Error("File read aborted"));
        reader.readAsDataURL(imgFile);
      });

      const mt=imgFile.type&&imgFile.type.startsWith("image/")?imgFile.type:"image/jpeg";
      console.log("Image read OK:",Math.round(b64.length/1024),"KB as",mt);

      // Step 2: Build prompt
      const imgPrompt=`You are an AI with perfect vision. Read ALL text in this image carefully.
This may be an NHS message, Rover booking, ticket, poster, letter, calendar, or any screenshot.
Extract every date, time, event, appointment or booking visible.
Return ONLY raw JSON — no markdown, no backticks:
{"events":[{"title":string,"date":"YYYY-MM-DD","time":"HH:MM","priority":"critical|high|medium|low","notes":string}],"summary":string}
Rules:
- title: clear description e.g. "NHS Therapy Appointment", "Dog Boarding — Sox"
- date: convert all formats. "22 Jun 2026"="2026-06-22", "Mon 12 Oct"="2026-10-12"
- No year: use ${today.getFullYear()} if future else ${today.getFullYear()+1}
- time: "13:30"="13:30", "3pm"="15:00", unknown="09:00"  
- notes: clinician name, pet name, price, reference, location. Max 100 chars
- priority: medical/critical=critical, bookings=high, social=medium
- NEVER return empty events — include any date you see`;

      // Step 3: Send to proxy
      const controller=new AbortController();
      const timer=setTimeout(()=>controller.abort(),30000);
      let response;
      try{
        response=await fetch("/api/ai",{
          method:"POST",
          headers:{"Content-Type":"application/json"},
          signal:controller.signal,
          body:JSON.stringify({
            model:"claude-sonnet-4-6",
            max_tokens:2000,
            system:imgPrompt,
            messages:[{role:"user",content:[
              {type:"image",source:{type:"base64",media_type:mt,data:b64}},
              {type:"text",text:"Extract all dates, times and events from this image. Return as JSON."}
            ]}]
          })
        });
      }finally{clearTimeout(timer);}

      // Step 4: Parse response
      const text=await response.text();
      let d;
      try{d=JSON.parse(text);}catch{
        setImgRes({error:true,msg:"Server error: "+text.slice(0,150)});
        setImgBusy(false);return;
      }
      if(d.error){
        setImgRes({error:true,msg:"API error: "+(d.error?.message||JSON.stringify(d.error).slice(0,100))});
        setImgBusy(false);return;
      }
      const raw=d.content?.find(b=>b.type==="text")?.text||"";
      if(!raw){setImgRes({error:true,msg:"No response from AI."});setImgBusy(false);return;}

      // Step 5: Extract JSON robustly
      let parsed=null;
      const s=raw.indexOf("{"),e=raw.lastIndexOf("}");
      if(s>=0&&e>s){
        try{parsed=JSON.parse(raw.slice(s,e+1));}catch{
          // Try to repair truncated JSON
          let sub=raw.slice(s,e+1).replace(/,?\s*"[^"]*$/,"");
          let opens=0,openSq=0;
          for(const ch of sub){if(ch==="{")opens++;else if(ch==="}")opens--;else if(ch==="[")openSq++;else if(ch==="]")openSq--;}
          for(let i=0;i<openSq;i++)sub+="]";
          for(let i=0;i<opens;i++)sub+="}";
          try{parsed=JSON.parse(sub);}catch{}
        }
      }
      if(!parsed?.events?.length){
        setImgRes({error:true,msg:"No dates found. Make sure dates are clearly visible in the image."});
      }else{
        parsed.events=parsed.events.filter(ev=>ev.title&&ev.date);
        setImgRes(parsed);
      }
    }catch(e){
      console.error("parseImg:",e);
      const msg=e.name==="AbortError"?"Timed out — please try again":
        e instanceof Error?e.message:
        String(e).includes("ProgressEvent")?"Could not read image file — please try again":
        "Error: "+String(e);
      setImgRes({error:true,msg});
    }
    setImgBusy(false);
  }

    function mockConnect(ss,se,data){ss("connecting");setTimeout(()=>{ss("mock");se(data);},2000);}

  /* ── style atoms ── */
  const inp={width:"100%",padding:"12px 16px",borderRadius:3,border:`1px solid ${C.border}`,fontSize:14,background:C.card,color:C.ink,fontFamily:FB,outline:"none",marginBottom:12,letterSpacing:"0.03em",boxShadow:`inset 0 1px 3px ${C.shadow}`};
  const goldBtn=(ghost=false,sm=false)=>({padding:sm?"10px 18px":"13px 24px",borderRadius:3,border:ghost?`1.5px solid ${C.goldBorder}`:"none",cursor:"pointer",fontSize:sm?10:11,fontFamily:FB,letterSpacing:"0.16em",textTransform:"uppercase",background:ghost?"transparent":`linear-gradient(135deg,${C.gold},${C.goldBright} 50%,${C.gold})`,color:ghost?C.gold:C.card,width:"100%",marginBottom:8,boxShadow:ghost?"none":`0 2px 14px rgba(154,123,60,0.28)`,transition:"all 0.2s"});
  const chip=(color,bg)=>({fontSize:9,padding:"3px 10px",borderRadius:2,background:bg,color,letterSpacing:"0.14em",textTransform:"uppercase",fontFamily:FM,border:`1px solid ${color}40`});
  const SL={fontSize:9,color:C.gold,letterSpacing:"0.25em",textTransform:"uppercase",fontFamily:FM,marginBottom:14};
  const navTab=a=>({padding:"12px 13px",border:"none",cursor:"pointer",fontSize:9,letterSpacing:"0.18em",textTransform:"uppercase",fontFamily:FM,whiteSpace:"nowrap",background:"transparent",color:a?C.gold:C.inkFaint,borderBottom:a?`2px solid ${C.gold}`:"2px solid transparent",transition:"all 0.2s"});
  const sevColor=s=>s==="high"?C.crimson:s==="medium"?C.gold:C.emerald;
  const sevBg=s=>s==="high"?C.crimsonBg:s==="medium"?C.goldPale:C.emeraldBg;
  const fmtTime=ts=>ts?.toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit"})||"";

  function EvCard({e,delay=0}){
    const p=PM[e.priority]||PM.medium,isC=cflIds.has(e.id);
    return(<div className="ev-card" style={{animationDelay:`${delay}ms`,background:C.card,marginBottom:10,borderRadius:4,border:`1px solid ${isC?C.crimson:C.borderSoft}`,borderLeft:`4px solid ${isC?C.crimson:C.goldBorder}`,padding:"15px 17px",position:"relative",boxShadow:`0 2px 10px ${C.shadow}`,transition:"box-shadow 0.2s"}}>
      <button onClick={()=>del(e.id)} style={{position:"absolute",top:11,right:13,background:"none",border:"none",cursor:"pointer",color:C.inkFaint,fontSize:12,fontFamily:FM}}>✕</button>
      <div style={{display:"flex",gap:13,alignItems:"flex-start"}}>
        <div style={{textAlign:"center",minWidth:38,paddingTop:2}}>
          <div style={{fontSize:19,fontFamily:FD,color:C.gold,lineHeight:1,fontWeight:300}}>{e.time?.slice(0,2)||"—"}</div>
          <div style={{fontSize:10,color:C.inkFaint,fontFamily:FM}}>{e.time?.slice(3)||"00"}</div>
        </div>
        <div style={{flex:1}}>
          <div style={{fontSize:15,fontFamily:FD,color:C.ink,letterSpacing:"0.02em",marginBottom:3,fontWeight:500,paddingRight:20,lineHeight:1.3}}>{e.title}</div>
          {e.notes&&<div style={{fontSize:12,color:C.inkLight,fontFamily:FB,marginBottom:7,lineHeight:1.5}}>{e.notes}</div>}
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
            <span style={chip(p.color,p.bg)}>{p.glyph} {p.label}</span>
            <span style={chip(C.gold,C.goldPale)}>{e.source}</span>
            {isC&&<span style={chip(C.crimson,C.crimsonBg)}>⚠ Conflict</span>}
          </div>
        </div>
      </div>
    </div>);
  }

  function ResultPreview({result,onAdd,onDiscard}){
    if(!result)return null;
    if(result.error)return(
      <div style={{border:`1px solid ${C.crimson}`,background:C.crimsonBg,padding:"14px 16px",marginTop:8,fontSize:13,color:C.crimson,fontFamily:FB,borderRadius:4,lineHeight:1.6}}>
        <div style={{fontWeight:600,marginBottom:4}}>⚠ Could not extract</div>
        <div>{result.msg||"Please try again."}</div>
        <div style={{fontSize:11,color:C.inkLight,marginTop:6}}>Tip: include specific dates like "14th July 2026" or "Monday 10th August".</div>
      </div>
    );
    const totalCost=result.total_cost||(result.financials?.filter(f=>f.type==="cost"||f.type==="payment").reduce((a,f)=>a+(f.amount||0),0))||0;
    const totalSaving=result.total_saving||(result.financials?.filter(f=>f.type==="saving").reduce((a,f)=>a+(f.amount||0),0))||0;
    return(
      <div style={{marginTop:16}}>
        {/* Summary */}
        {result.summary&&<div style={{border:`1px solid ${C.emerald}40`,background:C.emeraldBg,padding:"13px 16px",marginBottom:14,fontSize:13,color:C.emerald,fontFamily:FB,borderRadius:4,borderLeft:`4px solid ${C.emerald}`,lineHeight:1.6}}>✦ {result.summary}</div>}

        {/* AI Insights */}
        {result.insights?.length>0&&<div style={{marginBottom:16}}>
          <div style={SL}>Eleanor's Insights</div>
          {result.insights.map((ins,i)=>(
            <div key={i} style={{background:C.goldPale,border:`1px solid ${C.goldBorder}40`,borderLeft:`4px solid ${C.gold}`,padding:"11px 14px",marginBottom:7,borderRadius:3,fontSize:13,color:C.inkMid,fontFamily:FB,lineHeight:1.6}}>
              💡 {ins.text}
            </div>
          ))}
        </div>}

        {/* Destinations */}
        {result.destinations?.length>0&&<div style={{marginBottom:16}}>
          <div style={SL}>Destinations & Trips</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:7}}>
            {result.destinations.map((d,i)=>(
              <div key={i} style={{background:C.sapphireBg,border:`1px solid ${C.sapphire}30`,borderRadius:4,padding:"10px 13px",flex:"1 1 140px"}}>
                <div style={{fontSize:14,fontFamily:FD,color:C.sapphire,marginBottom:2}}>📍 {d.name}</div>
                {d.dates&&<div style={{fontSize:10,color:C.inkFaint,fontFamily:FM,marginBottom:2}}>{d.dates}</div>}
                {d.notes&&<div style={{fontSize:11,color:C.inkLight,fontFamily:FB}}>{d.notes}</div>}
              </div>
            ))}
          </div>
        </div>}

        {/* Financials */}
        {result.financials?.length>0&&<div style={{marginBottom:16}}>

          {/* Ask to confirm costs */}
          {!confirmCosts&&<div style={{background:C.goldPale,border:`1px solid ${C.goldBorder}`,borderRadius:6,padding:"14px 16px",marginBottom:12}}>
            <div style={{fontSize:14,fontFamily:FD,color:C.ink,marginBottom:4}}>Eleanor found {result.financials.length} financial items.</div>
            <div style={{fontSize:12,color:C.inkLight,fontFamily:FB,marginBottom:12,lineHeight:1.6}}>Would you like to confirm or edit the costs before saving?</div>
            <div style={{display:"flex",gap:8}}>
              <button onClick={()=>{setEditedFinancials(result.financials.map(f=>({...f})));setConfirmCosts(true);}} style={{flex:1,padding:"10px",borderRadius:3,border:"none",background:`linear-gradient(135deg,${C.gold},${C.goldBright})`,color:C.card,fontFamily:FM,fontSize:10,letterSpacing:"0.14em",textTransform:"uppercase",cursor:"pointer"}}>Yes, Review Costs</button>
              <button onClick={()=>setConfirmCosts(null)} style={{flex:1,padding:"10px",borderRadius:3,border:`1px solid ${C.border}`,background:"transparent",color:C.inkLight,fontFamily:FM,fontSize:10,letterSpacing:"0.14em",textTransform:"uppercase",cursor:"pointer"}}>No, Skip</button>
            </div>
          </div>}

          {/* Editable costs */}
          {confirmCosts===true&&<div>
            <div style={SL}>Confirm & Edit Costs</div>
            <div style={{fontSize:12,color:C.inkLight,fontFamily:FB,marginBottom:12,lineHeight:1.6}}>Tap any amount to edit it. Changes are saved automatically.</div>
            {(totalCost>0||totalSaving>0)&&<div style={{display:"flex",gap:8,marginBottom:12}}>
              {totalCost>0&&<div style={{flex:1,background:C.crimsonBg,border:`1px solid ${C.crimson}30`,borderRadius:4,padding:"11px",textAlign:"center"}}>
                <div style={{fontSize:18,fontFamily:FD,color:C.crimson,fontWeight:300}}>£{(editedFinancials.filter(f=>f.type==="cost"||f.type==="payment").reduce((a,f)=>a+(parseFloat(f.amount)||0),0)).toLocaleString()}</div>
                <div style={{fontSize:9,color:C.inkFaint,fontFamily:FM,letterSpacing:"0.1em",textTransform:"uppercase",marginTop:2}}>Total Cost</div>
              </div>}
              {totalSaving>0&&<div style={{flex:1,background:C.emeraldBg,border:`1px solid ${C.emerald}30`,borderRadius:4,padding:"11px",textAlign:"center"}}>
                <div style={{fontSize:18,fontFamily:FD,color:C.emerald,fontWeight:300}}>£{(editedFinancials.filter(f=>f.type==="saving").reduce((a,f)=>a+(parseFloat(f.amount)||0),0)).toLocaleString()}</div>
                <div style={{fontSize:9,color:C.inkFaint,fontFamily:FM,letterSpacing:"0.1em",textTransform:"uppercase",marginTop:2}}>Saving Target</div>
              </div>}
            </div>}
            {editedFinancials.map((f,i)=>(
              <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"11px 13px",background:C.card,border:`1px solid ${C.borderSoft}`,borderRadius:4,marginBottom:6,gap:10}}>
                <div style={{flex:1}}>
                  <div style={{fontSize:13,fontFamily:FD,color:C.ink}}>{f.label}</div>
                  {f.date&&<div style={{fontSize:10,color:C.inkFaint,fontFamily:FM,marginTop:1}}>{f.date}</div>}
                </div>
                <div style={{display:"flex",alignItems:"center",gap:4}}>
                  <span style={{fontSize:13,color:f.type==="saving"?C.emerald:f.type==="payment"?C.gold:C.crimson,fontFamily:FD}}>£</span>
                  <input
                    type="number"
                    value={f.amount||0}
                    onChange={e=>{const updated=[...editedFinancials];updated[i]={...f,amount:parseFloat(e.target.value)||0};setEditedFinancials(updated);}}
                    style={{width:80,padding:"6px 8px",border:`1px solid ${C.goldBorder}`,borderRadius:3,fontSize:14,fontFamily:FD,color:f.type==="saving"?C.emerald:f.type==="payment"?C.gold:C.crimson,textAlign:"right",background:C.goldPale,outline:"none"}}
                  />
                </div>
              </div>
            ))}
            <button onClick={()=>setConfirmCosts("done")} style={{width:"100%",padding:"11px",borderRadius:3,border:"none",background:`linear-gradient(135deg,${C.emerald},#3A8A58)`,color:"#fff",fontFamily:FM,fontSize:10,letterSpacing:"0.14em",textTransform:"uppercase",cursor:"pointer",marginTop:4}}>✓ Confirm Costs</button>
          </div>}

          {/* Confirmed summary */}
          {(confirmCosts==="done"||confirmCosts===null)&&<div>
            <div style={SL}>Costs & Savings</div>
            {(totalCost>0||totalSaving>0)&&<div style={{display:"flex",gap:8,marginBottom:10}}>
              {totalCost>0&&<div style={{flex:1,background:C.crimsonBg,border:`1px solid ${C.crimson}30`,borderRadius:4,padding:"11px",textAlign:"center"}}>
                <div style={{fontSize:18,fontFamily:FD,color:C.crimson,fontWeight:300}}>£{totalCost.toLocaleString()}</div>
                <div style={{fontSize:9,color:C.inkFaint,fontFamily:FM,letterSpacing:"0.1em",textTransform:"uppercase",marginTop:2}}>Total Cost</div>
              </div>}
              {totalSaving>0&&<div style={{flex:1,background:C.emeraldBg,border:`1px solid ${C.emerald}30`,borderRadius:4,padding:"11px",textAlign:"center"}}>
                <div style={{fontSize:18,fontFamily:FD,color:C.emerald,fontWeight:300}}>£{totalSaving.toLocaleString()}</div>
                <div style={{fontSize:9,color:C.inkFaint,fontFamily:FM,letterSpacing:"0.1em",textTransform:"uppercase",marginTop:2}}>Saving Target</div>
              </div>}
            </div>}
            {(confirmCosts==="done"?editedFinancials:result.financials).map((f,i)=>(
              <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 13px",background:C.card,border:`1px solid ${C.borderSoft}`,borderRadius:3,marginBottom:5}}>
                <div>
                  <div style={{fontSize:13,fontFamily:FD,color:C.ink}}>{f.label}</div>
                  {f.date&&<div style={{fontSize:10,color:C.inkFaint,fontFamily:FM,marginTop:1}}>{f.date}</div>}
                </div>
                <div style={{fontSize:15,fontFamily:FD,color:f.type==="saving"?C.emerald:f.type==="payment"?C.gold:C.crimson,fontWeight:300,marginLeft:10,whiteSpace:"nowrap"}}>
                  £{(f.amount||0).toLocaleString()}
                </div>
              </div>
            ))}
            {confirmCosts==="done"&&<div style={{fontSize:11,color:C.emerald,fontFamily:FM,letterSpacing:"0.1em",textTransform:"uppercase",textAlign:"center",marginTop:6}}>✓ Costs confirmed</div>}
          </div>}

        </div>}

        {/* Events */}
        {result.events?.length>0&&<div style={{marginBottom:8}}>
          <div style={SL}>{result.events.length} Appointments Found</div>
          {result.events.map((e,i)=>{const p=PM[e.priority]||PM.medium;return(
            <div key={i} style={{background:C.card,border:`1px solid ${C.borderSoft}`,borderLeft:`4px solid ${C.goldBorder}`,padding:"12px 15px",marginBottom:7,borderRadius:4}}>
              <div style={{fontSize:10,color:C.gold,fontFamily:FM,marginBottom:2}}>{e.date} · {e.time}</div>
              <div style={{fontSize:14,fontFamily:FD,color:C.ink,marginBottom:3}}>{e.title}</div>
              {e.notes&&<div style={{fontSize:11,color:C.inkLight,marginBottom:5,lineHeight:1.5}}>{e.notes}</div>}
              <span style={chip(p.color,p.bg)}>{p.glyph} {p.label}</span>
            </div>
          );})}
        </div>}

        <div style={{height:8}}/>
        <button style={goldBtn()} onClick={onAdd}>Add All Events to Schedule</button>
        <button style={goldBtn(true)} onClick={onDiscard}>Discard</button>
      </div>
    );
  }

  /* ════════════════════════════════════════════════
     VIEWS
  ════════════════════════════════════════════════ */

  /* ── HOME DASHBOARD ── */
  const HomeView=()=>(
    <div>

      {/* ══ INSTALL APP BUTTON — top of page ══ */}
      {installed?(
        <div style={{textAlign:"center",padding:"11px",background:C.emeraldBg,border:`1px solid ${C.emerald}40`,borderRadius:4,fontSize:10,color:C.emerald,fontFamily:FM,letterSpacing:"0.16em",textTransform:"uppercase",marginBottom:12}}>✓ App Installed</div>
      ):installPrompt?(
        <button onClick={installApp} style={{width:"100%",padding:"14px",borderRadius:6,border:"none",background:`linear-gradient(135deg,${C.ink},${C.inkMid})`,color:C.goldLight,fontFamily:FM,fontSize:11,letterSpacing:"0.2em",textTransform:"uppercase",cursor:"pointer",boxShadow:`0 3px 14px rgba(28,24,18,0.25)`,display:"flex",alignItems:"center",justifyContent:"center",gap:10,marginBottom:12}}>
          <span style={{fontSize:18}}>⬇</span><span>Install App on Your Phone</span>
        </button>
      ):(
        <div style={{background:`linear-gradient(135deg,${C.ink},${C.inkMid})`,borderRadius:6,padding:"14px 16px",marginBottom:12}}>
          <div style={{fontSize:11,color:C.goldLight,fontFamily:FM,letterSpacing:"0.18em",textTransform:"uppercase",marginBottom:8}}>⬇ Install App on Your Phone</div>
          <div style={{fontSize:12,color:"#C8B99A",fontFamily:FB,lineHeight:1.7}}>
            <strong style={{color:C.goldLight}}>Android Chrome:</strong> tap ⋮ menu → "Add to Home Screen"
          </div>
          <div style={{fontSize:12,color:"#C8B99A",fontFamily:FB,lineHeight:1.7,marginTop:3}}>
            <strong style={{color:C.goldLight}}>iPhone Safari:</strong> tap Share □↑ → "Add to Home Screen"
          </div>
        </div>
      )}

      {/* ══ HERO 1 — BRIEFING ══ */}
      <div className="hero-card" onClick={()=>setView("briefing")} style={{marginBottom:10,borderRadius:8,overflow:"hidden",boxShadow:`0 6px 24px ${C.shadowMed}`,cursor:"pointer",transition:"all 0.25s"}}>
        <div style={{background:`linear-gradient(135deg,${C.inkMid} 0%,#4A3A10 55%,#3D2E0A 100%)`,padding:"24px 22px 20px",position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",right:-10,top:-10,fontSize:110,fontFamily:FD,color:"rgba(255,255,255,0.04)",lineHeight:1,userSelect:"none",fontStyle:"italic"}}>✦</div>
          <div style={{position:"absolute",bottom:0,left:0,right:0,height:1,background:`linear-gradient(90deg,transparent,${C.goldBorder},transparent)`}}/>
          <div style={{fontSize:9,color:C.goldLight,letterSpacing:"0.3em",textTransform:"uppercase",fontFamily:FM,marginBottom:8,opacity:0.75}}>Executive Intelligence</div>
          <div style={{fontFamily:FD,fontSize:30,color:C.goldLight,fontStyle:"italic",fontWeight:300,lineHeight:1.1,marginBottom:8}}>Daily Briefing</div>
          <div style={{fontSize:12,color:"rgba(232,201,122,0.65)",fontFamily:FB,lineHeight:1.6}}>Schedule · Holidays · Alerts · Recommendations</div>
        </div>
        <div style={{background:C.card,padding:"13px 22px",borderTop:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          {nextHol&&<div><div style={{fontSize:9,color:C.inkFaint,fontFamily:FM,letterSpacing:"0.1em",textTransform:"uppercase"}}>Next Holiday</div><div style={{fontSize:13,fontFamily:FD,color:daysUntil(nextHol.start)<=14?C.crimson:C.gold,marginTop:2}}>{nextHol.name} — {daysUntil(nextHol.start)} days away</div></div>}
          <div style={{fontSize:11,color:C.inkFaint,fontFamily:FM,letterSpacing:"0.1em",textTransform:"uppercase"}}>{events.filter(e=>daysUntil(e.date)>=0&&daysUntil(e.date)<7).length} events this week →</div>
        </div>
      </div>

      {/* ══ HERO 2 — IMPORT ══ */}
      <div className="hero-card" onClick={()=>setView("import")} style={{marginBottom:18,borderRadius:8,overflow:"hidden",boxShadow:`0 6px 24px ${C.shadowMed}`,cursor:"pointer",transition:"all 0.25s",animationDelay:"60ms"}}>
        <div style={{background:`linear-gradient(135deg,#1A3820 0%,#122A18 55%,#0C1E10 100%)`,padding:"24px 22px 20px",position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",right:-10,top:-10,fontSize:110,fontFamily:FD,color:"rgba(255,255,255,0.04)",lineHeight:1,userSelect:"none",fontStyle:"italic"}}>✦</div>
          <div style={{position:"absolute",bottom:0,left:0,right:0,height:1,background:`linear-gradient(90deg,transparent,${C.emerald}99,transparent)`}}/>
          <div style={{fontSize:9,color:"rgba(160,220,175,0.85)",letterSpacing:"0.3em",textTransform:"uppercase",fontFamily:FM,marginBottom:8}}>Add to Calendar</div>
          <div style={{fontFamily:FD,fontSize:30,color:"#C8EAC0",fontStyle:"italic",fontWeight:300,lineHeight:1.1,marginBottom:8}}>Import Appointments</div>
          <div style={{fontSize:12,color:"rgba(160,220,175,0.6)",fontFamily:FB,lineHeight:1.6}}>Paste text · Screenshot · Email · Calendar sync</div>
        </div>
        <div style={{background:C.card,padding:"13px 22px",borderTop:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div style={{fontSize:12,color:C.inkLight,fontFamily:FB,letterSpacing:"0.03em"}}>Text · Screenshot · Email · Calendar</div>
          <div style={{fontSize:11,color:C.emerald,fontFamily:FM,letterSpacing:"0.1em",textTransform:"uppercase"}}>Tap to open →</div>
        </div>
      </div>

      {/* Eleanor strip */}
      <div style={{background:C.card,border:`1px solid ${C.borderSoft}`,borderRadius:6,padding:"14px 16px",marginBottom:16,display:"flex",gap:12,alignItems:"center",boxShadow:`0 2px 10px ${C.shadow}`,cursor:"pointer"}} onClick={()=>setView("chat")}>
        <PaAvatar size={44} pulse={true}/>
        <div style={{flex:1}}>
          <div style={{fontFamily:FD,fontSize:17,color:C.ink,fontStyle:"italic",lineHeight:1,marginBottom:3}}>Eleanor</div>
          <div style={{fontSize:10,color:C.inkFaint,fontFamily:FM,letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:4}}>Personal Executive Assistant</div>
          <StatusBadge status="idle"/>
        </div>
        <div style={{fontSize:10,color:C.gold,fontFamily:FM,letterSpacing:"0.1em"}}>Chat →</div>
      </div>

      {/* Today summary */}
      <div style={{marginBottom:16}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <div style={SL}>Today's Schedule</div>
          <button onClick={()=>setView("week")} style={{background:"none",border:"none",cursor:"pointer",fontSize:10,color:C.gold,fontFamily:FM,letterSpacing:"0.12em",textTransform:"uppercase"}}>See Week →</button>
        </div>
        {cfls.length>0&&<ConflictAlert cfls={cfls} events={events} onDelete={del}/>}
        {todayEvs.length===0
          ?<div style={{textAlign:"center",color:C.inkFaint,padding:"20px 0",background:C.card,borderRadius:6,border:`1px solid ${C.borderSoft}`}}><div style={{fontSize:16,fontFamily:FD,fontStyle:"italic",color:C.inkLight}}>Your day is clear.</div></div>
          :todayEvs.map((e,i)=><EvCard key={e.id} e={e} delay={i*50}/>)}
      </div>

      {/* quick actions */}
      <div style={{display:"flex",gap:8,marginBottom:10}}>
        <button onClick={()=>setView("add")} style={{flex:1,padding:"11px",borderRadius:4,border:`1.5px solid ${C.goldBorder}`,background:C.card,color:C.gold,fontFamily:FM,fontSize:9,letterSpacing:"0.16em",textTransform:"uppercase",cursor:"pointer",boxShadow:`0 1px 6px ${C.shadow}`}}>＋ New Event</button>
        <button onClick={()=>setView("week")} style={{flex:1,padding:"11px",borderRadius:4,border:`1px solid ${C.borderSoft}`,background:C.card,color:C.inkLight,fontFamily:FM,fontSize:9,letterSpacing:"0.16em",textTransform:"uppercase",cursor:"pointer",boxShadow:`0 1px 6px ${C.shadow}`}}>📆 Week View</button>
      </div>

    </div>
  );

  /* ── SCHEDULE (TODAY DETAIL) ── */
  const ScheduleView=()=>(
    <div>
      {cfls.length>0&&<ConflictAlert cfls={cfls} events={events} onDelete={del}/>}
      <div style={SL}>{today.toLocaleDateString("en-GB",{weekday:"long"})} — {todayEvs.length} appointment{todayEvs.length!==1?"s":""}</div>
      {todayEvs.length===0?<div style={{textAlign:"center",color:C.inkFaint,padding:"50px 0"}}><div style={{fontSize:22,fontFamily:FD,fontStyle:"italic",color:C.inkLight,marginBottom:8}}>Your day is clear.</div></div>:todayEvs.map((e,i)=><EvCard key={e.id} e={e} delay={i*55}/>)}
    </div>
  );

  /* ── WEEK VIEW ── */
  const WeekView=()=>(
    <div>
      <div style={SL}>Seven-Day View</div>
      {weekDays.map(day=>(
        <div key={day.ds} style={{marginBottom:22}}>
          <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:10}}>
            <div style={{fontSize:15,fontFamily:FD,color:day.ds===fmt(today)?C.gold:C.ink,fontStyle:day.ds===fmt(today)?"italic":"normal",fontWeight:300}}>{day.label}</div>
            <div style={{flex:1,height:1,background:C.borderSoft}}/>
            <div style={{fontSize:9,color:C.inkFaint,fontFamily:FM}}>{day.evs.length} appt{day.evs.length!==1?"s":""}</div>
          </div>
          {day.evs.length===0?<div style={{fontSize:12,color:C.inkFaint,fontFamily:FB,paddingLeft:4,fontStyle:"italic"}}>— Clear</div>
          :day.evs.map(e=>(
            <div key={e.id} style={{background:C.card,border:`1px solid ${C.borderSoft}`,borderLeft:`4px solid ${(PM[e.priority]||PM.medium).color}40`,padding:"11px 15px",marginBottom:6,borderRadius:3,display:"flex",gap:12,alignItems:"center",position:"relative",boxShadow:`0 1px 5px ${C.shadow}`}}>
              <button onClick={()=>del(e.id)} style={{position:"absolute",top:8,right:10,background:"none",border:"none",cursor:"pointer",color:C.inkFaint,fontSize:12,fontFamily:FM}}>✕</button>
              <div style={{fontSize:12,fontFamily:FM,color:C.gold,minWidth:36}}>{e.time}</div>
              <div><div style={{fontSize:14,fontFamily:FD,color:C.ink,marginBottom:3}}>{e.title}</div><span style={{...chip((PM[e.priority]||PM.medium).color,(PM[e.priority]||PM.medium).bg),fontSize:9}}>{(PM[e.priority]||PM.medium).label}</span></div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );

  /* ── BRIEFING VIEW ── */
  const BriefingView=()=>(
    <div>
      <div style={SL}>Executive Briefing</div>
      {!briefing&&!briefBusy&&<div>
        <div style={{fontFamily:FD,fontSize:22,color:C.ink,fontStyle:"italic",marginBottom:8,lineHeight:1.4,fontWeight:300}}>Your personal intelligence briefing</div>
        <div style={{fontSize:13,color:C.inkLight,fontFamily:FB,lineHeight:1.75,marginBottom:22}}>Eleanor will analyse your schedule, UK school holidays, conflicts, and free time — then deliver a tailored briefing with actionable recommendations.</div>
        <div style={{border:`1px solid ${C.border}`,borderRadius:6,overflow:"hidden",marginBottom:22,boxShadow:`0 2px 12px ${C.shadow}`}}>
          <div style={{padding:"12px 16px",borderBottom:`1px solid ${C.border}`,background:C.cream,fontSize:9,color:C.gold,letterSpacing:"0.22em",textTransform:"uppercase",fontFamily:FM}}>Upcoming UK School & Bank Holidays</div>
          {upcomingHols(5).map((h,i,arr)=>{const du=daysUntil(h.start);return(<div key={i} style={{padding:"13px 16px",borderBottom:i<arr.length-1?`1px solid ${C.borderSoft}`:"none",background:C.card,display:"flex",justifyContent:"space-between",alignItems:"center"}}><div><div style={{fontSize:14,fontFamily:FD,color:C.ink}}>{h.name}</div><div style={{fontSize:10,color:C.inkFaint,fontFamily:FM,marginTop:2}}>{fmtRange(h.start,h.end)}</div></div><div style={{textAlign:"right"}}><div style={{fontSize:20,fontFamily:FD,color:du<=14?C.crimson:du<=30?C.gold:C.inkFaint,fontWeight:300}}>{du}</div><div style={{fontSize:9,color:C.inkFaint,fontFamily:FM}}>days</div></div></div>);})}
        </div>
        <button className="gold-pulse" style={goldBtn()} onClick={generateBriefing}>Generate My Briefing</button>
      </div>}
      {briefBusy&&<div style={{textAlign:"center",padding:"60px 0"}}><div className="shimmer" style={{fontSize:22,fontFamily:FD,color:C.gold,fontStyle:"italic",marginBottom:12}}>Preparing your briefing…</div><div style={{fontSize:10,color:C.inkFaint,fontFamily:FM,letterSpacing:"0.2em",textTransform:"uppercase"}}>Analysing schedule · Checking holidays</div></div>}
      {briefing?.error&&<div><div style={{border:`1px solid ${C.crimson}40`,background:C.crimsonBg,padding:"14px 16px",marginBottom:16,fontSize:13,color:C.crimson,fontFamily:FB,borderRadius:4}}>Unable to generate briefing. Please try again.</div><button style={goldBtn()} onClick={generateBriefing}>Retry</button></div>}
      {briefing&&!briefing.error&&<div>
        <div style={{borderLeft:`4px solid ${C.goldBorder}`,paddingLeft:18,marginBottom:24}}><div style={{fontFamily:FD,fontSize:22,color:C.ink,fontStyle:"italic",lineHeight:1.45,fontWeight:300}}>{briefing.headline}</div></div>
        {briefing.today_summary&&<div style={{background:C.card,border:`1px solid ${C.borderSoft}`,borderTop:`3px solid ${C.goldBorder}`,padding:"16px 18px",marginBottom:18,borderRadius:4,boxShadow:`0 2px 10px ${C.shadow}`}}><div style={{...SL,marginBottom:10}}>Today at a Glance</div><div style={{fontSize:14,fontFamily:FB,color:C.inkMid,lineHeight:1.7}}>{briefing.today_summary}</div></div>}
        {briefing.weekly_balance&&<div style={{background:C.card,border:`1px solid ${C.borderSoft}`,padding:"16px 18px",marginBottom:18,borderRadius:4,boxShadow:`0 2px 10px ${C.shadow}`}}><div style={{...SL,marginBottom:12}}>Schedule Balance</div><div style={{display:"flex",alignItems:"center",gap:16}}><div style={{textAlign:"center",minWidth:50}}><div style={{fontSize:34,fontFamily:FD,color:briefing.weekly_balance.score>=7?C.emerald:briefing.weekly_balance.score>=4?C.gold:C.crimson,fontWeight:300,lineHeight:1}}>{briefing.weekly_balance.score}</div><div style={{fontSize:9,color:C.inkFaint,fontFamily:FM}}>/10</div></div><div style={{flex:1}}><div style={{height:3,background:C.borderSoft,borderRadius:2,marginBottom:10,overflow:"hidden"}}><div style={{height:3,width:`${briefing.weekly_balance.score*10}%`,background:`linear-gradient(90deg,${C.gold},${C.goldLight})`,borderRadius:2}}/></div><div style={{fontSize:13,color:C.inkLight,fontFamily:FB,lineHeight:1.6}}>{briefing.weekly_balance.comment}</div></div></div></div>}
        {briefing.alerts?.length>0&&<div style={{marginBottom:18}}><div style={SL}>Alerts & Flags</div>{briefing.alerts.map((a,i)=><div key={i} style={{background:sevBg(a.severity),border:`1px solid ${sevColor(a.severity)}30`,borderLeft:`4px solid ${sevColor(a.severity)}`,padding:"13px 16px",marginBottom:8,borderRadius:3}}><div style={{fontSize:14,fontFamily:FD,color:sevColor(a.severity),marginBottom:4,fontWeight:500}}>{a.title}</div><div style={{fontSize:12,color:C.inkLight,fontFamily:FB,lineHeight:1.6}}>{a.detail}</div></div>)}</div>}
        {briefing.holiday_advice?.length>0&&<div style={{marginBottom:18}}><div style={SL}>Holiday Intelligence</div>{briefing.holiday_advice.map((h,i)=><div key={i} style={{background:C.card,border:`1px solid ${C.borderSoft}`,borderLeft:`4px solid ${C.goldBorder}`,padding:"13px 16px",marginBottom:8,borderRadius:3,cursor:"pointer",boxShadow:`0 1px 6px ${C.shadow}`}} onClick={()=>setBriefExp(briefExp===`h${i}`?null:`h${i}`)}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><div style={{fontSize:15,fontFamily:FD,color:C.ink}}>{h.holiday}</div><div style={{display:"flex",alignItems:"center",gap:10}}><div style={{textAlign:"right"}}><div style={{fontSize:18,fontFamily:FD,color:h.days_until<=14?C.crimson:h.days_until<=30?C.gold:C.inkFaint,fontWeight:300,lineHeight:1}}>{h.days_until}</div><div style={{fontSize:9,color:C.inkFaint,fontFamily:FM}}>days</div></div><div style={{fontSize:10,color:C.inkFaint,fontFamily:FM}}>{briefExp===`h${i}`?"▲":"▼"}</div></div></div><div style={{fontSize:10,color:C.inkFaint,fontFamily:FM,marginTop:3}}>{h.date_range}</div>{briefExp===`h${i}`&&<div style={{fontSize:13,color:C.inkMid,fontFamily:FB,lineHeight:1.65,marginTop:10,paddingTop:10,borderTop:`1px solid ${C.borderSoft}`}}>{h.advice}</div>}</div>)}</div>}
        {briefing.opportunities?.length>0&&<div style={{marginBottom:18}}><div style={SL}>Opportunities</div>{briefing.opportunities.map((o,i)=><div key={i} style={{background:C.emeraldBg,border:`1px solid ${C.emerald}30`,borderLeft:`4px solid ${C.emerald}`,padding:"13px 16px",marginBottom:8,borderRadius:3}}><div style={{fontSize:14,fontFamily:FD,color:C.emerald,marginBottom:4,fontWeight:500}}>{o.title}</div><div style={{fontSize:12,color:C.inkLight,fontFamily:FB,lineHeight:1.6}}>{o.detail}</div></div>)}</div>}
        {briefing.recommendations?.length>0&&<div style={{marginBottom:18}}><div style={SL}>Recommendations</div>{briefing.recommendations.map((r,i)=><div key={i} style={{background:C.card,border:`1px solid ${C.borderSoft}`,padding:"13px 16px",marginBottom:8,borderRadius:3,display:"flex",gap:14,alignItems:"flex-start",boxShadow:`0 1px 6px ${C.shadow}`}}><div style={{fontSize:20,color:C.goldBright,fontFamily:FD,lineHeight:1,paddingTop:2,minWidth:20,textAlign:"center",fontWeight:300}}>{i+1}</div><div><div style={{fontSize:14,fontFamily:FD,color:C.ink,marginBottom:4}}>{r.title}</div><div style={{fontSize:12,color:C.inkLight,fontFamily:FB,lineHeight:1.6}}>{r.detail}</div></div></div>)}</div>}
        <button style={goldBtn(true)} onClick={()=>{setBriefing(null);generateBriefing();}}>↺ Refresh Briefing</button>
      </div>}
    </div>
  );

  /* ── IMPORT VIEW ── */
  const ImportView=()=>(
    <div>
      <div style={SL}>Import Appointments</div>
      {/* visual method picker */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:20}}>
        {[{type:"text",label:"Paste Text",sub:"Any text or message",tab:"text"},{type:"image",label:"Screenshot",sub:"Photo or image",tab:"image"},{type:"email",label:"Email",sub:"Gmail or Outlook",tab:"email"},{type:"calendar",label:"Calendar",sub:"Google Cal / iCal",tab:"calendar"}].map(m=>(
          <div key={m.type} className="import-method" onClick={()=>setImpTab(m.tab)}
            style={{background:impTab===m.tab?C.goldPale:C.card,border:`1.5px solid ${impTab===m.tab?C.goldBorder:C.borderSoft}`,borderRadius:6,padding:"14px 14px",cursor:"pointer",transition:"all 0.18s",textAlign:"center",boxShadow:`0 1px 6px ${C.shadow}`}}>
            <div style={{width:40,height:40,borderRadius:6,background:impTab===m.tab?`linear-gradient(135deg,${C.gold},${C.goldBright})`:C.parchment,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 10px"}}>
              <ImportIcon type={m.type} size={20}/>
            </div>
            <div style={{fontSize:13,fontFamily:FD,color:C.ink,fontWeight:400,marginBottom:2}}>{m.label}</div>
            <div style={{fontSize:10,color:C.inkFaint,fontFamily:FB,lineHeight:1.3}}>{m.sub}</div>
          </div>
        ))}
      </div>

      {/* divider */}
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:18}}>
        <div style={{flex:1,height:1,background:C.borderSoft}}/><div style={{fontSize:9,color:C.inkFaint,fontFamily:FM,letterSpacing:"0.15em"}}>{["text","image","email","calendar"].find(t=>t===impTab)?.toUpperCase()}</div><div style={{flex:1,height:1,background:C.borderSoft}}/>
      </div>

      {impTab==="text"&&<div>
        <div style={{fontSize:13,color:C.inkLight,fontFamily:FB,lineHeight:1.75,marginBottom:14}}>Paste any text — an email, WhatsApp conversation, a list of dates. Eleanor will identify all commitments automatically.</div>
        <textarea style={{...inp,minHeight:150,resize:"vertical"}} value={pasteText} onChange={e=>setPasteText(e.target.value)} placeholder={"e.g. 'Dentist Thursday 14th at 2:30pm'\nor paste a full email confirmation\nor 'Can you do school pickup Monday at 3:30?'"}/>
        <button style={goldBtn()} onClick={parsePaste} disabled={pasteBusy}>{pasteBusy?"Analysing…":"Extract Appointments"}</button>
        <ResultPreview result={pasteRes} onAdd={()=>{addEvs(pasteRes.events,"text");setPasteRes(null);setPasteText("");setView("home");}} onDiscard={()=>setPasteRes(null)}/>
      </div>}
      {impTab==="image"&&<div>
        <div style={{fontSize:13,color:C.inkLight,fontFamily:FB,lineHeight:1.75,marginBottom:14}}>Upload <strong>any image</strong> — a poster, flyer, event ticket, booking confirmation, screenshot, letter, or even a handwritten note. Eleanor will read the whole image and extract every date, time, and location she can find.</div>
        <label style={{display:"block",border:`1.5px dashed ${C.goldBorder}`,padding:"32px 20px",textAlign:"center",cursor:"pointer",marginBottom:12,background:C.cardWarm,color:C.gold,fontSize:13,fontFamily:FB,letterSpacing:"0.06em",borderRadius:6}}>
          {imgPrev?"✦ Image ready — tap Extract below":"📸 Tap to upload — poster, ticket, flyer, screenshot, letter…"}
          <input type="file" accept="image/*" onChange={handleImg} style={{display:"none"}}/>
        </label>
        {imgPrev&&<img src={imgPrev} alt="Preview" style={{width:"100%",marginBottom:12,maxHeight:220,objectFit:"contain",border:`1px solid ${C.border}`,background:C.parchment,borderRadius:4}}/>}
        {imgFile&&<button style={goldBtn()} onClick={parseImg} disabled={imgBusy}>{imgBusy?"Reading image…":"Extract Appointments from Image"}</button>}
        {imgRes&&!imgRes.error&&imgRes.summary&&<div style={{border:`1px solid ${C.emerald}40`,background:C.emeraldBg,padding:"13px 16px",marginBottom:14,fontSize:13,color:C.emerald,fontFamily:FB,borderRadius:4,borderLeft:`4px solid ${C.emerald}`,lineHeight:1.6}}>✦ {imgRes.summary}</div>}
        {imgRes?.error&&<div style={{border:`1px solid ${C.crimson}`,background:C.crimsonBg,padding:"14px 16px",marginTop:8,fontSize:13,color:C.crimson,fontFamily:FB,borderRadius:4,lineHeight:1.6}}><div style={{fontWeight:600,marginBottom:4}}>⚠ Could not extract</div><div>{imgRes.msg||"Please try again."}</div></div>}
        {imgRes&&!imgRes.error&&imgRes.events?.length>0&&<div>
          <div style={{fontSize:9,color:C.gold,letterSpacing:"0.25em",textTransform:"uppercase",fontFamily:FM,marginBottom:12}}>{imgRes.events.length} Events Found</div>
          {imgRes.events.map((e,i)=>{const p=PM[e.priority]||PM.medium;return(
            <div key={i} style={{background:C.card,border:`1px solid ${C.borderSoft}`,borderLeft:`4px solid ${C.goldBorder}`,padding:"12px 15px",marginBottom:7,borderRadius:4}}>
              <div style={{fontSize:10,color:C.gold,fontFamily:FM,marginBottom:2}}>{e.date} · {e.time}</div>
              <div style={{fontSize:14,fontFamily:FD,color:C.ink,marginBottom:3}}>{e.title}</div>
              {e.notes&&<div style={{fontSize:11,color:C.inkLight,marginBottom:5,lineHeight:1.5}}>{e.notes}</div>}
              <span style={chip(p.color,p.bg)}>{p.glyph} {p.label}</span>
            </div>
          );})}
          <div style={{height:8}}/>
          <button style={goldBtn()} onClick={()=>{addEvs(imgRes.events,"image");setImgRes(null);setImgFile(null);setImgPrev(null);setView("home");}}>Add All to Schedule</button>
          <button style={goldBtn(true)} onClick={()=>{setImgRes(null);setImgFile(null);setImgPrev(null);}}>Discard</button>
        </div>}
      </div>}
      {impTab==="email"&&<div>
        <div style={{fontSize:13,color:C.inkLight,fontFamily:FB,lineHeight:1.75,marginBottom:14}}>Connect Gmail so Eleanor can scan your inbox for bookings, appointments and confirmations.</div>
        {!googleTokens&&<button style={goldBtn()} onClick={connectGoogle} disabled={googleBusy}>{googleBusy?"Connecting…":"Connect Gmail"}</button>}
        {googleTokens&&<div>
          <div style={{border:`1px solid ${C.emerald}40`,background:C.emeraldBg,padding:"12px 16px",marginBottom:14,fontSize:13,color:C.emerald,fontFamily:FB,borderRadius:4,borderLeft:`4px solid ${C.emerald}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <span>✦ Connected: {googleProfile?.email||"Gmail"}</span>
            <button onClick={disconnectGoogle} style={{background:"none",border:`1px solid ${C.emerald}`,color:C.emerald,fontFamily:FM,fontSize:9,padding:"3px 8px",cursor:"pointer",borderRadius:2,letterSpacing:"0.1em",textTransform:"uppercase"}}>Disconnect</button>
          </div>
          <button style={goldBtn()} onClick={async()=>{
            setEmailSt("connecting");
            try{
              const r=await fetch("/api/ai",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({access_token:googleTokens.access_token,action:"gmail_list"})});
              const data=await r.json();
              if(data.error){setEmailSt("idle");alert("Error: "+data.error);return;}
              // Use AI to extract appointments from email snippets
              const snippets=(data.messages||[]).map(m=>"From: "+m.from+"\nSubject: "+m.subject+"\nDate: "+m.date+"\n"+m.snippet).join("\n\n")||"";
              if(!snippets){setEmailSt("idle");alert("No emails found.");return;}
              const aiR=await fetch("/api/ai",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-6",max_tokens:2000,system:`Extract calendar events from these email snippets. Return ONLY raw JSON: {"events":[{"title":string,"date":"YYYY-MM-DD","time":"HH:MM","priority":"critical|high|medium|low","notes":string}],"summary":string}. Today is ${fmt(today)}.`,messages:[{role:"user",content:"Extract appointments from these emails:\n\n"+snippets}]})});
              const aiData=await aiR.json();
              const raw=aiData.content?.find(b=>b.type==="text")?.text||"{}";
              const s=raw.indexOf("{"),e=raw.lastIndexOf("}");
              const parsed=s>=0?JSON.parse(raw.slice(s,e+1)):{events:[]};
              setEmailEvs(parsed.events||[]);
              setEmailSt("mock");
            }catch(err){setEmailSt("idle");alert("Scan failed: "+err.message);}
          }}>Scan Inbox for Appointments</button>
        </div>}
        {emailSt==="connecting"&&<div style={{textAlign:"center",color:C.gold,padding:"28px 0",fontFamily:FM,fontSize:10,letterSpacing:"0.22em",textTransform:"uppercase"}} className="shimmer">Scanning inbox…</div>}
        {emailSt==="mock"&&emailEvs&&<div>
          <div style={{border:`1px solid ${C.emerald}40`,background:C.emeraldBg,padding:"12px 16px",marginBottom:14,fontSize:13,color:C.emerald,fontFamily:FB,borderRadius:4,borderLeft:`4px solid ${C.emerald}`}}>✦ {emailEvs.length} appointment{emailEvs.length!==1?"s":""} found in inbox.</div>
          {emailEvs.map((e,i)=>{const p=PM[e.priority]||PM.medium;return(<div key={i} style={{background:C.card,border:`1px solid ${C.borderSoft}`,borderLeft:`4px solid ${C.goldBorder}`,padding:"13px 16px",marginBottom:8,borderRadius:3}}><div style={{fontSize:10,color:C.gold,fontFamily:FM,marginBottom:3}}>{e.date} · {e.time}</div><div style={{fontSize:15,fontFamily:FD,color:C.ink,marginBottom:4}}>{e.title}</div><div style={{fontSize:12,color:C.inkLight,marginBottom:6}}>{e.notes}</div><span style={chip(p.color,p.bg)}>{p.glyph} {p.label}</span></div>);})}
          <div style={{height:8}}/>
          <button style={goldBtn()} onClick={()=>{addEvs(emailEvs,"email");setEmailSt("idle");setEmailEvs(null);setView("home");}}>Add All to Schedule</button>
          <button style={goldBtn(true)} onClick={()=>{setEmailSt("idle");setEmailEvs(null);}}>Discard</button>
        </div>}
      </div>}
      {impTab==="calendar"&&<div>
        <div style={{fontSize:13,color:C.inkLight,fontFamily:FB,lineHeight:1.75,marginBottom:14}}>Connect Google Calendar to sync your upcoming events directly into Personal PA Pro.</div>
        {!googleTokens&&<button style={goldBtn()} onClick={connectGoogle} disabled={googleBusy}>{googleBusy?"Connecting…":"Connect Google Calendar"}</button>}
        {googleTokens&&<div>
          <div style={{border:`1px solid ${C.emerald}40`,background:C.emeraldBg,padding:"12px 16px",marginBottom:14,fontSize:13,color:C.emerald,fontFamily:FB,borderRadius:4,borderLeft:`4px solid ${C.emerald}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <span>✦ Connected: {googleProfile?.email||"Google"}</span>
            <button onClick={disconnectGoogle} style={{background:"none",border:`1px solid ${C.emerald}`,color:C.emerald,fontFamily:FM,fontSize:9,padding:"3px 8px",cursor:"pointer",borderRadius:2,letterSpacing:"0.1em",textTransform:"uppercase"}}>Disconnect</button>
          </div>
          <button style={goldBtn()} onClick={syncGoogleCalendar} disabled={calSt==="connecting"}>Sync Google Calendar</button>
        </div>}
        {calSt==="connecting"&&<div style={{textAlign:"center",color:C.gold,padding:"28px 0",fontFamily:FM,fontSize:10,letterSpacing:"0.22em",textTransform:"uppercase"}} className="shimmer">Syncing calendar…</div>}
        {calSt==="mock"&&calEvs&&<div>
          <div style={{border:`1px solid ${C.emerald}40`,background:C.emeraldBg,padding:"12px 16px",marginBottom:14,fontSize:13,color:C.emerald,fontFamily:FB,borderRadius:4,borderLeft:`4px solid ${C.emerald}`}}>✦ {calEvs.length} event{calEvs.length!==1?"s":""} found in Google Calendar.</div>
          {calEvs.map((e,i)=>{const p=PM[e.priority]||PM.medium;return(<div key={i} style={{background:C.card,border:`1px solid ${C.borderSoft}`,borderLeft:`4px solid ${C.goldBorder}`,padding:"13px 16px",marginBottom:8,borderRadius:3}}><div style={{fontSize:10,color:C.gold,fontFamily:FM,marginBottom:3}}>{e.date} · {e.time}</div><div style={{fontSize:15,fontFamily:FD,color:C.ink,marginBottom:4}}>{e.title}</div><div style={{fontSize:12,color:C.inkLight,marginBottom:6}}>{e.notes}</div><span style={chip(p.color,p.bg)}>{p.glyph} {p.label}</span></div>);})}
          <div style={{height:8}}/>
          <button style={goldBtn()} onClick={()=>{addEvs(calEvs,"calendar");setCalSt("idle");setCalEvs(null);setView("home");}}>Add All to Schedule</button>
          <button style={goldBtn(true)} onClick={()=>{setCalSt("idle");setCalEvs(null);}}>Discard</button>
        </div>}
      </div>}
    </div>
  );

  /* ── CHAT VIEW ── */
  const ChatView=()=>(
    <div style={{display:"flex",flexDirection:"column",height:"100%",background:C.parchment}}>
      <div style={{padding:"15px 20px 13px",background:C.card,borderBottom:`1px solid ${C.border}`,boxShadow:`0 2px 8px ${C.shadow}`}}>
        <div style={{display:"flex",alignItems:"center",gap:13}}>
          <PaAvatar size={50} pulse={paStatus==="idle"} speaking={paStatus==="speaking"}/>
          <div style={{flex:1}}>
            <div style={{fontFamily:FD,fontSize:20,color:C.ink,fontStyle:"italic",fontWeight:400,lineHeight:1}}>Eleanor</div>
            <div style={{fontSize:9,color:C.inkFaint,fontFamily:FM,letterSpacing:"0.14em",textTransform:"uppercase",marginTop:3,marginBottom:4}}>Personal Executive Assistant</div>
            <StatusBadge status={paStatus}/>
          </div>
          <div style={{width:64,height:28,display:"flex",alignItems:"center",justifyContent:"center",background:C.cream,borderRadius:4,border:`1px solid ${C.borderSoft}`}}><Waveform active={showWave}/></div>
        </div>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"18px 16px",display:"flex",flexDirection:"column",gap:12}}>
        {msgs.map((m,i)=>{
          const isPA=m.role==="assistant";
          return(<div key={i} className="msg-bubble" style={{display:"flex",flexDirection:isPA?"row":"row-reverse",gap:9,alignItems:"flex-end"}}>
            {isPA&&<PaAvatar size={30} pulse={false}/>}
            <div style={{maxWidth:"76%"}}>
              <div style={{padding:"12px 16px",borderRadius:isPA?"4px 16px 16px 4px":"16px 4px 4px 16px",background:isPA?C.card:`linear-gradient(135deg,${C.gold},${C.goldBright})`,color:isPA?C.ink:C.card,fontSize:14,lineHeight:1.65,fontFamily:FB,letterSpacing:"0.025em",border:isPA?`1px solid ${C.borderSoft}`:"none",boxShadow:isPA?`0 2px 10px ${C.shadow}`:`0 3px 12px rgba(154,123,60,0.28)`}}>{m.text}</div>
              <div style={{fontSize:9,color:C.inkFaint,fontFamily:FM,marginTop:3,textAlign:isPA?"left":"right",letterSpacing:"0.08em"}}>{fmtTime(m.ts)}</div>
            </div>
          </div>);
        })}
        {paStatus==="thinking"&&<div className="msg-bubble" style={{display:"flex",gap:9,alignItems:"flex-end"}}><PaAvatar size={30} pulse={true}/><div style={{padding:"12px 16px",borderRadius:"4px 16px 16px 4px",background:C.card,border:`1px solid ${C.borderSoft}`,boxShadow:`0 2px 10px ${C.shadow}`}}><TypingDots/></div></div>}
        {paStatus==="speaking"&&<div className="msg-bubble" style={{display:"flex",gap:9,alignItems:"flex-end"}}><PaAvatar size={30} speaking={true}/><div style={{padding:"10px 14px",borderRadius:"4px 16px 16px 4px",background:C.card,border:`1px solid ${C.goldBorder}`,boxShadow:`0 2px 12px rgba(196,153,62,0.18)`,display:"flex",alignItems:"center",gap:8}}><Waveform active={true}/><span style={{fontSize:10,color:C.gold,fontFamily:FM,letterSpacing:"0.1em"}}>Eleanor is responding…</span></div></div>}
        <div ref={chatEnd}/>
      </div>
      {msgs.length<=1&&paStatus==="idle"&&<div style={{padding:"0 16px 8px",display:"flex",gap:6,flexWrap:"wrap"}}>{["What's on today?","Any conflicts?","Free time this week?","Holiday advice"].map(q=>(<button key={q} onClick={()=>setChatIn(q)} style={{padding:"7px 12px",borderRadius:20,border:`1px solid ${C.goldBorder}`,background:C.card,color:C.gold,fontSize:10,fontFamily:FM,letterSpacing:"0.1em",cursor:"pointer"}}>{q}</button>))}</div>}
      <div style={{padding:"12px 16px",borderTop:`1px solid ${C.border}`,background:C.card,boxShadow:`0 -2px 10px ${C.shadow}`}}>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          <input style={{flex:1,padding:"12px 16px",border:`1px solid ${C.border}`,fontSize:13,background:C.parchment,color:C.ink,fontFamily:FB,letterSpacing:"0.03em",outline:"none",borderRadius:24,boxShadow:`inset 0 1px 3px ${C.shadow}`}} value={chatIn} onChange={e=>setChatIn(e.target.value)} onKeyDown={e=>e.key==="Enter"&&sendChat()} placeholder="Message Eleanor…" disabled={paStatus!=="idle"}/>
          <button onClick={sendChat} disabled={paStatus!=="idle"||!chatIn.trim()} style={{width:44,height:44,borderRadius:"50%",border:"none",background:paStatus!=="idle"||!chatIn.trim()?C.borderSoft:`linear-gradient(135deg,${C.gold},${C.goldBright})`,color:C.card,cursor:paStatus!=="idle"||!chatIn.trim()?"not-allowed":"pointer",fontSize:16,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,boxShadow:paStatus==="idle"&&chatIn.trim()?`0 2px 10px rgba(154,123,60,0.35)`:"none",transition:"all 0.2s"}}>→</button>
        </div>
      </div>
    </div>
  );

  /* ── ADD EVENT ── */
  const AddView=()=>(
    <div>
      <div style={SL}>New Appointment</div>
      {[{ph:"Appointment title *",key:"title",type:"text"},{ph:"Date",key:"date",type:"date"},{ph:"Time",key:"time",type:"time"}].map(f=>(<input key={f.key} style={inp} type={f.type} placeholder={f.ph} value={newEv[f.key]} onChange={e=>setNewEv(n=>({...n,[f.key]:e.target.value}))}/>))}
      {[{key:"priority",opts:[["critical","◆ Critical"],["high","◈ High"],["medium","◇ Medium"],["low","○ Low"]]},{key:"source",opts:[["manual","✦ Manual"],["email","✦ Email"],["whatsapp","✦ WhatsApp"],["rover","✦ Rover"]]}].map(s=>(<select key={s.key} style={{...inp}} value={newEv[s.key]} onChange={e=>setNewEv(n=>({...n,[s.key]:e.target.value}))}>{s.opts.map(([v,l])=><option key={v} value={v}>{l}</option>)}</select>))}
      <input style={inp} placeholder="Notes (optional)" value={newEv.notes} onChange={e=>setNewEv(n=>({...n,notes:e.target.value}))}/>
      <div style={{height:6}}/>
      <button style={goldBtn()} onClick={()=>{if(!newEv.title)return;const mx=Math.max(...events.map(e=>e.id),0);setEvents(ev=>[...ev,{...newEv,id:mx+1}]);setNewEv({title:"",date:fmt(today),time:"",priority:"medium",notes:"",source:"manual"});setView("home");}} disabled={!newEv.title}>Add to Schedule</button>
      <button style={goldBtn(true)} onClick={()=>setView("home")}>Cancel</button>
    </div>
  );

  const BACK_VIEWS=["schedule","week","briefing","import","chat","add"];
  const VIEW_LABELS={home:"Home",schedule:"Today",week:"This Week",briefing:"Briefing",import:"Import",chat:"Eleanor",add:"New Event"};

  return(
    <div style={{fontFamily:FB,background:C.parchment,minHeight:"100vh",maxWidth:480,margin:"0 auto",display:"flex",flexDirection:"column",color:C.ink}}>
      <style>{GLOBAL_CSS}</style>

      {/* MASTHEAD */}
      <div style={{background:`linear-gradient(165deg,${C.cream} 0%,${C.creamDeep} 100%)`,borderBottom:`1px solid ${C.border}`,padding:"24px 24px 18px",position:"relative",overflow:"hidden",boxShadow:`0 2px 20px ${C.shadow}`}}>
        <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:`linear-gradient(90deg,${C.cream},${C.goldBright},${C.goldLight},${C.goldBright},${C.cream})`}}/>
        <div style={{position:"absolute",right:18,top:14,fontSize:72,fontFamily:FD,color:C.goldBorder,opacity:0.1,lineHeight:1,userSelect:"none",fontStyle:"italic"}}>✦</div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
          <div>
            <div style={{fontSize:9,color:C.gold,letterSpacing:"0.35em",textTransform:"uppercase",fontFamily:FM,marginBottom:6}}>Private Executive Service</div>
            <h1 style={{fontFamily:FD,fontSize:26,fontWeight:300,color:C.ink,letterSpacing:"0.04em",lineHeight:1,margin:0,fontStyle:"italic"}}>Personal PA <span style={{fontFamily:FM,fontSize:12,fontStyle:"normal",letterSpacing:"0.2em",color:C.gold,textTransform:"uppercase",verticalAlign:"middle",marginLeft:4}}>Pro</span></h1>
            <div style={{width:44,height:1,background:`linear-gradient(90deg,${C.goldBorder},transparent)`,margin:"7px 0"}}/>
            <div style={{fontSize:12,color:C.inkLight,letterSpacing:"0.07em",fontFamily:FB}}>{today.toLocaleDateString("en-GB",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}</div>
          </div>
          {cfls.length>0&&<div className="gold-pulse" onClick={()=>setView(view==="home"?"schedule":view)} style={{background:C.crimsonBg,border:`1.5px solid ${C.crimson}`,color:C.crimson,padding:"5px 12px",fontSize:9,fontFamily:FM,letterSpacing:"0.15em",textTransform:"uppercase",borderRadius:2,cursor:"pointer"}}>⚠ {cfls.length} Conflict{cfls.length>1?"s":""}</div>}
        </div>
        {view==="home"&&<div style={{display:"flex",gap:0,marginTop:16,border:`1px solid ${C.border}`,borderRadius:4,overflow:"hidden",boxShadow:`0 1px 8px ${C.shadow}`}}>
          {[{n:todayEvs.length,l:"Today",a:C.gold,action:()=>setView("schedule")},{n:events.filter(e=>e.priority==="critical").length,l:"Critical",a:C.crimson,action:()=>setView("schedule")},{n:events.filter(e=>e.source==="rover").length,l:"Rover",a:C.emerald,action:()=>{}}].map((s,i)=>(
            <div key={i} onClick={s.action} style={{flex:1,padding:"13px 8px",textAlign:"center",background:C.card,borderRight:i<2?`1px solid ${C.border}`:"none",cursor:"pointer"}}>
              <div style={{fontSize:24,fontFamily:FD,color:s.a,fontWeight:300,lineHeight:1}}>{s.n}</div>
              <div style={{fontSize:9,color:C.inkFaint,letterSpacing:"0.15em",textTransform:"uppercase",fontFamily:FM,marginTop:3}}>{s.l}</div>
            </div>
          ))}
        </div>}
      </div>

      {/* NAV / BACK BAR */}
      <div style={{display:"flex",alignItems:"center",background:C.card,borderBottom:`1px solid ${C.border}`,boxShadow:`0 1px 6px ${C.shadow}`,overflowX:"auto"}}>
        {BACK_VIEWS.includes(view)
          ?<>
            <button onClick={()=>setView("home")} style={{padding:"12px 16px",border:"none",background:"none",cursor:"pointer",color:C.gold,fontFamily:FM,fontSize:9,letterSpacing:"0.16em",textTransform:"uppercase",borderRight:`1px solid ${C.borderSoft}`,whiteSpace:"nowrap"}}>← Home</button>
            <div style={{flex:1,padding:"0 16px",fontSize:10,color:C.inkFaint,fontFamily:FM,letterSpacing:"0.18em",textTransform:"uppercase"}}>{VIEW_LABELS[view]}</div>
          </>
          :[["home","Home"],["week","Week"],["chat","Eleanor"],["add","＋ Add"]].map(([v,l])=>(
            <button key={v} onClick={()=>setView(v)} style={{padding:"12px 14px",border:"none",cursor:"pointer",fontSize:9,letterSpacing:"0.18em",textTransform:"uppercase",fontFamily:FM,whiteSpace:"nowrap",background:"transparent",color:view===v?C.gold:C.inkFaint,borderBottom:view===v?`2px solid ${C.gold}`:"2px solid transparent",transition:"all 0.2s"}}>{l}</button>
          ))
        }
      </div>

      {/* CONTENT */}
      <div style={{flex:1,padding:view==="chat"?"0":"20px 18px",overflowY:view==="chat"?"hidden":"auto"}}>
        {view==="home"     && <HomeView/>}
        {view==="schedule" && <ScheduleView/>}
        {view==="week"     && <WeekView/>}
        {view==="briefing" && <BriefingView/>}
        {view==="import"   && <ImportView/>}
        {view==="chat"     && <ChatView/>}
        {view==="add"      && <AddView/>}
      </div>

      {view!=="chat"&&<div style={{padding:"11px 20px",borderTop:`1px solid ${C.border}`,background:C.cream,display:"flex",justifyContent:"space-between",alignItems:"center",gap:10}}>
        <div style={{fontSize:9,color:C.inkFaint,fontFamily:FM,letterSpacing:"0.22em",textTransform:"uppercase"}}>Personal PA Pro · Private Service</div>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          <button onClick={()=>{if(window.confirm("Clear all events and chat history? This cannot be undone.")){localStorage.clear();setEvents([]);setMsgs([{role:"assistant",text:"Good morning. I'm Eleanor. Your schedule has been cleared. How may I assist you?",ts:new Date()}]);}}} style={{padding:"5px 10px",borderRadius:3,border:`1px solid ${C.border}`,background:"transparent",color:C.inkFaint,fontFamily:FM,fontSize:8,letterSpacing:"0.12em",textTransform:"uppercase",cursor:"pointer"}}>Clear Data</button>
          {!installed&&installPrompt&&<button onClick={installApp} style={{padding:"6px 14px",borderRadius:20,border:`1px solid ${C.goldBorder}`,background:`linear-gradient(135deg,${C.gold},${C.goldBright})`,color:C.card,fontSize:9,fontFamily:FM,letterSpacing:"0.14em",textTransform:"uppercase",cursor:"pointer",whiteSpace:"nowrap",flexShrink:0}}>⬇ Install App</button>}
          {installed&&<div style={{fontSize:9,color:C.emerald,fontFamily:FM,letterSpacing:"0.14em",textTransform:"uppercase"}}>✓ Installed</div>}
          {!installed&&!installPrompt&&<div style={{fontSize:11,color:C.goldBorder,fontFamily:FD}}>✦</div>}
        </div>
      </div>}
    </div>
  );
}
