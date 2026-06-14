import React, { useState, useEffect, useRef } from "react";

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
const PA_PHOTO = "/eleanor.jpg";

// ── ERROR BOUNDARY ──
class ErrorBoundary extends React.Component{
  constructor(p){super(p);this.state={hasError:false,error:null};}
  static getDerivedStateFromError(e){return{hasError:true,error:e};}
  componentDidCatch(e,info){console.error("App crash:",e,info);}
  render(){
    if(this.state.hasError){
      return(
        <div style={{maxWidth:480,margin:"0 auto",padding:32,fontFamily:"Georgia,serif",background:"#FAF6EE",minHeight:"100vh"}}>
          <div style={{fontSize:32,marginBottom:16}}>✦</div>
          <div style={{fontSize:22,color:"#1C1812",fontStyle:"italic",marginBottom:8}}>Something went wrong</div>
          <div style={{fontSize:13,color:"#6B6355",lineHeight:1.7,marginBottom:24}}>Eleanor encountered an unexpected error. Your data is safe. Please reload the app.</div>
          <div style={{fontSize:11,color:"#9A8F7A",fontFamily:"monospace",background:"#EBE4D2",padding:12,borderRadius:4,marginBottom:24,wordBreak:"break-all"}}>{this.state.error?.message}</div>
          <button onClick={()=>{localStorage.removeItem("papa_msgs");window.location.reload();}} style={{padding:"12px 24px",background:"#9A7B3C",color:"#FAF6EE",border:"none",borderRadius:4,fontFamily:"Georgia,serif",fontSize:14,cursor:"pointer"}}>Reload App</button>
        </div>
      );
    }
    return this.props.children;
  }
}

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

function ICalImport({onAdd}){
  const [icalUrl,setIcalUrl]=useState(()=>localStorage.getItem("papa_ical_url")||"");
  const [showSetup,setShowSetup]=useState(!localStorage.getItem("papa_ical_url"));
  const [loading,setLoading]=useState(false);
  const [events,setEvents]=useState([]);
  const [error,setError]=useState("");

  async function fetchIcal(){
    if(!icalUrl.trim())return;
    setLoading(true);setError("");setEvents([]);
    localStorage.setItem("papa_ical_url",icalUrl.trim());
    // Fetch iCal via server-side proxy (avoids CORS issues with Google Calendar)
    let url=icalUrl.trim();
    if(!url.startsWith("http")){
      url="https://calendar.google.com/calendar/ical/"+encodeURIComponent(url)+"/basic.ics";
    }
    const r=await fetch("/api/ical",{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({url})
    });
    const data=await r.json();
    if(data.error){setError(data.error);setLoading(false);return;}
    const text=data.ical;
    if(!text){setError("No calendar data received.");setLoading(false);return;}
    // Parse iCal
    const evs=[];
    const blocks=text.split("BEGIN:VEVENT");
    for(let i=1;i<blocks.length;i++){
      const b=blocks[i];
      const get=k=>{const m=b.match(new RegExp(k+"[^:]*:([^\r\n]+)"));return m?m[1].trim():"";};
      const dtstart=get("DTSTART");
      const summary=get("SUMMARY")||"Event";
      const desc=get("DESCRIPTION")||"";
      const loc=get("LOCATION")||"";
      if(!dtstart)continue;
      // Parse date
      let date="",time="09:00";
      const d=dtstart.replace(/[TZ]/g,"");
      if(d.length>=8){
        date=d.slice(0,4)+"-"+d.slice(4,6)+"-"+d.slice(6,8);
        if(d.length>=12)time=d.slice(8,10)+":"+d.slice(10,12);
      }
      // Only future events
      if(date&&date>=fmt(today)){
        evs.push({title:summary,date,time,priority:"medium",notes:(loc||desc).slice(0,100),source:"calendar"});
      }
    }
    evs.sort((a,b)=>a.date.localeCompare(b.date));
    setEvents(evs.slice(0,50));
    if(!evs.length)setError("No upcoming events found in this calendar.");
    setLoading(false);
  }

  const goldBtn=(ghost=false)=>({padding:"13px 24px",borderRadius:3,border:ghost?`1.5px solid ${C.goldBorder}`:"none",cursor:"pointer",fontSize:11,fontFamily:FB,letterSpacing:"0.16em",textTransform:"uppercase",background:ghost?"transparent":`linear-gradient(135deg,${C.gold},${C.goldBright} 50%,${C.gold})`,color:ghost?C.gold:C.card,width:"100%",marginBottom:8,boxShadow:ghost?"none":`0 2px 14px rgba(154,123,60,0.28)`,transition:"all 0.2s"});
  const SL={fontSize:9,color:C.gold,letterSpacing:"0.25em",textTransform:"uppercase",fontFamily:FM,marginBottom:14};
  const chip=(color,bg)=>({fontSize:9,padding:"3px 10px",borderRadius:2,background:bg,color,letterSpacing:"0.14em",textTransform:"uppercase",fontFamily:FM,border:`1px solid ${color}40`});
  return(<div>
    <div style={{fontSize:13,color:C.inkLight,fontFamily:FB,lineHeight:1.75,marginBottom:14}}>Connect your Google Calendar using your private iCal link — no sign-in needed.</div>

    {showSetup?<div>
      <div style={{background:C.goldPale,border:`1px solid ${C.goldBorder}`,borderRadius:6,padding:"14px 16px",marginBottom:14}}>
        <div style={{fontSize:13,fontFamily:FD,color:C.ink,fontStyle:"italic",marginBottom:8}}>How to get your iCal link:</div>
        <div style={{fontSize:12,color:C.inkLight,fontFamily:FB,lineHeight:1.8}}>
          1. Open <strong>Google Calendar</strong> on a computer<br/>
          2. Click the <strong>⚙ Settings</strong> icon<br/>
          3. Click your calendar name on the left<br/>
          4. Scroll to <strong>"Secret address in iCal format"</strong><br/>
          5. Copy the link and paste it below
        </div>
      </div>
      <textarea
        id="ical-url-input"
        defaultValue={icalUrl}
        onBlur={e=>setIcalUrl(e.target.value)}
        placeholder="Paste your iCal link here..."
        style={{width:"100%",padding:"12px",border:`1px solid ${C.border}`,borderRadius:3,fontSize:12,fontFamily:FM,minHeight:80,resize:"none",background:C.parchment,color:C.ink,outline:"none",marginBottom:12,boxSizing:"border-box"}}
      />
      <button style={goldBtn()} onClick={()=>{const el=document.getElementById("ical-url-input");const val=el?el.value:icalUrl;if(val.trim()){setIcalUrl(val);setShowSetup(false);fetchIcal();}}}>Connect Calendar</button>
    </div>:<div>
      <div style={{border:`1px solid ${C.emerald}40`,background:C.emeraldBg,padding:"12px 16px",marginBottom:14,fontSize:13,color:C.emerald,fontFamily:FB,borderRadius:4,borderLeft:`4px solid ${C.emerald}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <span>✦ Calendar connected</span>
        <button onClick={()=>{localStorage.removeItem("papa_ical_url");setIcalUrl("");setShowSetup(true);setEvents([]);}} style={{background:"none",border:`1px solid ${C.emerald}`,color:C.emerald,fontFamily:FM,fontSize:9,padding:"3px 8px",cursor:"pointer",borderRadius:2,letterSpacing:"0.1em",textTransform:"uppercase"}}>Change</button>
      </div>
      <button style={goldBtn()} onClick={fetchIcal} disabled={loading}>{loading?"Syncing…":"Sync Calendar"}</button>
    </div>}

    {loading&&<div style={{textAlign:"center",color:C.gold,padding:"20px 0",fontFamily:FM,fontSize:10,letterSpacing:"0.2em",textTransform:"uppercase"}} className="shimmer">Loading calendar…</div>}
    {error&&<div style={{border:`1px solid ${C.crimson}`,background:C.crimsonBg,padding:"12px 16px",fontSize:13,color:C.crimson,fontFamily:FB,borderRadius:4,marginTop:8}}>{error}</div>}
    {events.length>0&&<div style={{marginTop:12}}>
      <div style={{fontSize:9,color:C.gold,letterSpacing:"0.25em",textTransform:"uppercase",fontFamily:FM,marginBottom:12}}>{events.length} Upcoming Events</div>
      {events.map((e,i)=>{const p=PM[e.priority]||PM.medium;return(
        <div key={i} style={{background:C.card,border:`1px solid ${C.borderSoft}`,borderLeft:`4px solid ${C.goldBorder}`,padding:"12px 15px",marginBottom:7,borderRadius:4}}>
          <div style={{fontSize:10,color:C.gold,fontFamily:FM,marginBottom:2}}>{e.date} · {e.time}</div>
          <div style={{fontSize:14,fontFamily:FD,color:C.ink,marginBottom:3}}>{e.title}</div>
          {e.notes&&<div style={{fontSize:11,color:C.inkLight,marginBottom:4}}>{e.notes}</div>}
          <span style={chip(p.color,p.bg)}>{p.glyph} {p.label}</span>
        </div>
      );})}
      <div style={{height:8}}/>
      <button style={goldBtn()} onClick={()=>onAdd(events)}>Add All to Schedule</button>
      <button style={goldBtn(true)} onClick={()=>setEvents([])}>Discard</button>
    </div>}
  </div>);
}

// Isolated chat input - never re-renders with parent App
const ChatInput=React.memo(function ChatInput({onSend,disabled}){
  const ref=React.useRef(null);
  function send(){
    if(!ref.current||!ref.current.value.trim()||disabled)return;
    onSend(ref.current.value.trim());
    ref.current.value="";
  }
  return(
    <div style={{display:"flex",gap:8,alignItems:"center"}}>
      <input
        ref={ref}
        style={{flex:1,padding:"12px 16px",border:"1px solid #DDD5C0",fontSize:13,background:"#FAF6EE",color:"#1C1812",fontFamily:"'Tenor Sans','Optima','Gill Sans','Century Gothic',sans-serif",letterSpacing:"0.03em",outline:"none",borderRadius:24,boxShadow:"inset 0 1px 3px rgba(60,40,10,0.08)"}}
        placeholder="Message Eleanor…"
        disabled={disabled}
        onKeyDown={e=>{if(e.key==="Enter")send();}}
      />
      <button
        onClick={send}
        disabled={disabled}
        style={{width:44,height:44,borderRadius:"50%",border:"none",background:disabled?"#EBE4D2":"linear-gradient(135deg,#9A7B3C,#C4993E)",color:"#FFFDF8",cursor:disabled?"not-allowed":"pointer",fontSize:16,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"all 0.2s"}}
      >→</button>
    </div>
  );
});

// ── ONBOARDING SCREEN ──
function OnboardingScreen({onComplete,PA_PHOTO,C,FD,FB,FM}){
  const [step,setStep]=React.useState(0);
  const [name,setName]=React.useState("");
  const [address,setAddress]=React.useState("");
  const [travelMode,setTravelMode]=React.useState("transit");
  const [notifGranted,setNotifGranted]=React.useState(false);

  const steps=[
    // Step 0 - Welcome
    ()=>(<div style={{textAlign:"center",padding:"20px 0"}}>
      {PA_PHOTO&&<div style={{width:100,height:100,borderRadius:"50%",overflow:"hidden",margin:"0 auto 20px",border:`3px solid ${C.goldBorder}`,boxShadow:`0 0 30px rgba(196,153,62,0.4)`}}>
        <img src={PA_PHOTO} alt="Eleanor" style={{width:"100%",height:"100%",objectFit:"cover",objectPosition:"top"}}/>
      </div>}
      <div style={{fontFamily:FD,fontSize:28,color:C.ink,fontStyle:"italic",marginBottom:8}}>Hello, I'm Eleanor</div>
      <div style={{fontSize:14,color:C.inkLight,fontFamily:FB,lineHeight:1.7,marginBottom:24}}>Your Personal Executive Assistant. I'll help you manage your schedule, appointments, reminders and much more.</div>
      <div style={{fontSize:12,color:C.inkFaint,fontFamily:FM,lineHeight:1.6}}>Let me take a moment to get to know you.</div>
    </div>),

    // Step 1 - Name
    ()=>(<div style={{padding:"10px 0"}}>
      <div style={{fontFamily:FD,fontSize:22,color:C.ink,fontStyle:"italic",marginBottom:6}}>What's your name?</div>
      <div style={{fontSize:13,color:C.inkLight,fontFamily:FB,lineHeight:1.6,marginBottom:20}}>I'll use this to personalise your experience.</div>
      <input
        id="onboard-name"
        style={{width:"100%",padding:"14px 16px",border:`1.5px solid ${C.goldBorder}`,borderRadius:6,fontSize:16,fontFamily:FD,background:"#FAF6EE",color:"#1C1812",outline:"none",boxSizing:"border-box",fontStyle:"italic"}}
        placeholder="e.g. Sarah"
        defaultValue={name}
        onBlur={e=>setName(e.target.value)}
      />
    </div>),

    // Step 2 - Home address
    ()=>(<div style={{padding:"10px 0"}}>
      <div style={{fontFamily:FD,fontSize:22,color:C.ink,fontStyle:"italic",marginBottom:6}}>Where do you live?</div>
      <div style={{fontSize:13,color:C.inkLight,fontFamily:FB,lineHeight:1.6,marginBottom:20}}>Your home address helps me calculate travel time to appointments and plan your journeys.</div>
      <input
        id="onboard-address"
        style={{width:"100%",padding:"14px 16px",border:`1.5px solid ${C.goldBorder}`,borderRadius:6,fontSize:14,fontFamily:FB,background:"#FAF6EE",color:"#1C1812",outline:"none",boxSizing:"border-box"}}
        placeholder="e.g. 14 High Street, March, PE15 9JY"
        defaultValue={address}
        onBlur={e=>setAddress(e.target.value)}
      />
      <div style={{fontSize:11,color:C.inkFaint,fontFamily:FB,marginTop:8}}>You can always change this in Settings later.</div>
    </div>),

    // Step 3 - Travel mode
    ()=>(<div style={{padding:"10px 0"}}>
      <div style={{fontFamily:FD,fontSize:22,color:C.ink,fontStyle:"italic",marginBottom:6}}>How do you usually travel?</div>
      <div style={{fontSize:13,color:C.inkLight,fontFamily:FB,lineHeight:1.6,marginBottom:20}}>I'll use this for journey planning and event briefings.</div>
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {[["transit","🚌","Public Transport","Bus, train, tram"],["walking","🚶","Walking","On foot"],["bicycling","🚲","Cycling","Bike"],["driving","🚗","Driving","Car or taxi"]].map(([mode,icon,label,sub])=>(
          <button key={mode} onClick={()=>setTravelMode(mode)} style={{padding:"14px 16px",borderRadius:6,border:`2px solid ${travelMode===mode?C.goldBorder:"#DDD5C0"}`,background:travelMode===mode?"#F5EDD8":"#FFFDF8",cursor:"pointer",textAlign:"left",display:"flex",gap:14,alignItems:"center",transition:"all 0.15s"}}>
            <span style={{fontSize:26}}>{icon}</span>
            <div>
              <div style={{fontSize:15,fontFamily:FD,color:"#1C1812",fontStyle:"italic"}}>{label}</div>
              <div style={{fontSize:11,color:"#9A8F7A",fontFamily:FB}}>{sub}</div>
            </div>
          </button>
        ))}
      </div>
    </div>),

    // Step 4 - Notifications
    ()=>(<div style={{padding:"10px 0",textAlign:"center"}}>
      <div style={{fontSize:40,marginBottom:16}}>🔔</div>
      <div style={{fontFamily:FD,fontSize:22,color:C.ink,fontStyle:"italic",marginBottom:6}}>Stay on top of everything</div>
      <div style={{fontSize:13,color:C.inkLight,fontFamily:FB,lineHeight:1.7,marginBottom:24}}>Allow notifications so Eleanor can remind you about appointments, reminders and important dates — even when the app is closed.</div>
      {!notifGranted
        ?<button onClick={async()=>{
          const perm=await Notification.requestPermission();
          if(perm==="granted")setNotifGranted(true);
        }} style={{width:"100%",padding:"14px",borderRadius:6,border:"none",background:"linear-gradient(135deg,#9A7B3C,#C4993E)",color:"#FFFDF8",fontFamily:"'Tenor Sans',sans-serif",fontSize:12,letterSpacing:"0.2em",textTransform:"uppercase",cursor:"pointer",marginBottom:10}}>
          ✦ Allow Notifications
        </button>
        :<div style={{padding:"14px",background:"#E8F5E9",borderRadius:6,color:"#2E7D32",fontFamily:FB,fontSize:13,marginBottom:10}}>✓ Notifications enabled — Eleanor will keep you informed</div>
      }
      <button onClick={()=>setStep(s=>s+1)} style={{background:"none",border:"none",color:"#9A8F7A",fontFamily:FB,fontSize:12,cursor:"pointer",textDecoration:"underline"}}>
        {notifGranted?"Continue":"Skip for now"}
      </button>
    </div>),

    // Step 5 - All done
    ()=>(<div style={{textAlign:"center",padding:"10px 0"}}>
      {PA_PHOTO&&<div style={{width:80,height:80,borderRadius:"50%",overflow:"hidden",margin:"0 auto 16px",border:`2px solid ${C.goldBorder}`}}>
        <img src={PA_PHOTO} alt="Eleanor" style={{width:"100%",height:"100%",objectFit:"cover",objectPosition:"top"}}/>
      </div>}
      <div style={{fontFamily:FD,fontSize:24,color:C.ink,fontStyle:"italic",marginBottom:8}}>All set{name?", "+name:""}!</div>
      <div style={{fontSize:14,color:C.inkLight,fontFamily:FB,lineHeight:1.7,marginBottom:6}}>I'm Eleanor, your Personal Executive Assistant. I'm here whenever you need me.</div>
      <div style={{fontSize:13,color:C.inkFaint,fontFamily:FB,lineHeight:1.7}}>Start by importing your appointments or asking me anything in chat.</div>
    </div>),
  ];

  function handleNext(){
    // Save data from current step
    if(step===1){const el=document.getElementById("onboard-name");if(el&&el.value)setName(el.value);}
    if(step===2){const el=document.getElementById("onboard-address");if(el&&el.value)setAddress(el.value);}
    if(step<steps.length-1){setStep(s=>s+1);}
    else{
      // Complete onboarding
      const n=name||document.getElementById("onboard-name")?.value||"";
      const a=address||document.getElementById("onboard-address")?.value||"";
      if(n)localStorage.setItem("papa_user_name",n);
      if(a)localStorage.setItem("papa_home_address",a);
      localStorage.setItem("papa_travel_mode",travelMode);
      localStorage.setItem("papa_user_context",`Name: ${n||"Sarah"}. ${a?"Home address: "+a+". ":""}Rover dog-sitter and app developer. Personal Assistant user.`);
      localStorage.setItem("papa_onboarded","true");
      onComplete({name:n,address:a,travelMode});
    }
  }

  return(
    <div style={{position:"fixed",inset:0,background:"#FAF6EE",zIndex:2000,display:"flex",flexDirection:"column",padding:"0"}}>
      {/* Progress bar */}
      <div style={{height:3,background:"#EBE4D2"}}>
        <div style={{height:"100%",background:"linear-gradient(90deg,#9A7B3C,#C4993E)",width:((step+1)/steps.length*100)+"%",transition:"width 0.4s"}}/>
      </div>

      {/* Content */}
      <div style={{flex:1,overflowY:"auto",padding:"32px 24px 24px"}}>
        {/* Logo */}
        <div style={{textAlign:"center",marginBottom:28}}>
          <div style={{fontSize:9,color:"#9A7B3C",fontFamily:"'Tenor Sans',sans-serif",letterSpacing:"0.3em",textTransform:"uppercase"}}>Personal PA Pro · Private Service</div>
        </div>
        {steps[step]()}
      </div>

      {/* Bottom buttons */}
      <div style={{padding:"16px 24px 32px",background:"#FAF6EE",borderTop:"1px solid #EBE4D2"}}>
        {step!==4&&<button onClick={handleNext} style={{width:"100%",padding:"15px",borderRadius:6,border:"none",background:"linear-gradient(135deg,#9A7B3C,#C4993E)",color:"#FFFDF8",fontFamily:"'Tenor Sans',sans-serif",fontSize:12,letterSpacing:"0.2em",textTransform:"uppercase",cursor:"pointer",marginBottom:10,boxShadow:"0 4px 16px rgba(154,123,60,0.3)"}}>
          {step===steps.length-1?"Enter Personal PA Pro →":"Continue →"}
        </button>}
        {step>0&&step!==steps.length-1&&<button onClick={()=>setStep(s=>s-1)} style={{width:"100%",padding:"11px",borderRadius:6,border:"1px solid #DDD5C0",background:"transparent",color:"#9A8F7A",fontFamily:"'Tenor Sans',sans-serif",fontSize:11,letterSpacing:"0.15em",textTransform:"uppercase",cursor:"pointer"}}>← Back</button>}
      </div>
    </div>
  );
}

function BriefingLoader(){
  const [step,setStep]=React.useState(0);
  const steps=[
    "Eleanor is reviewing your schedule…",
    "Checking upcoming holidays and school dates…",
    "Looking for conflicts and busy periods…",
    "Reviewing your commitments this week…",
    "Checking the weather for your events…",
    "Identifying opportunities and preparation needed…",
    "Composing your personal briefing…",
  ];
  React.useEffect(()=>{
    const t=setInterval(()=>setStep(s=>(s+1)%steps.length),2200);
    return()=>clearInterval(t);
  },[]);
  return(
    <div style={{textAlign:"center",padding:"60px 20px"}}>
      {PA_PHOTO&&<div style={{width:64,height:64,borderRadius:"50%",overflow:"hidden",margin:"0 auto 16px",border:`2px solid ${C.goldBorder}`,boxShadow:`0 0 20px rgba(196,153,62,0.3)`}}>
        <img src={PA_PHOTO} alt="Eleanor" style={{width:"100%",height:"100%",objectFit:"cover",objectPosition:"top"}}/>
      </div>}
      <div className="shimmer" style={{fontSize:18,fontFamily:FD,color:C.gold,fontStyle:"italic",marginBottom:12,lineHeight:1.5,transition:"all 0.5s"}}>{steps[step]}</div>
      <div style={{display:"flex",justifyContent:"center",gap:6,marginTop:8}}>
        {steps.map((_,i)=><div key={i} style={{width:i===step?20:6,height:6,borderRadius:3,background:i===step?C.goldBright:C.goldPale,transition:"all 0.3s"}}/>)}
      </div>
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
  @keyframes pulse{0%,100%{transform:scale(0.7);opacity:0.4}50%{transform:scale(1.1);opacity:1}}
  @keyframes memoryPulse{0%,100%{opacity:0.5}50%{opacity:1}}
  @keyframes typingCursor{0%,100%{opacity:1}50%{opacity:0}}
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

function AppInner(){
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
        if(parsed.length>0)return parsed.map(m=>({...m,ts:new Date(m.ts)}));
      }
    }catch{}
    // Smart greeting based on memory and time of day
    const hour=new Date().getHours();
    const tod=hour<12?"morning":hour<17?"afternoon":"evening";
    let mem={};
    try{mem=JSON.parse(localStorage.getItem("papa_persistent_memory")||"{}");}catch{}
    const lastSession=localStorage.getItem("papa_last_session")||"";
    const hasMem=(mem.facts||[]).length>0||(mem.pending_tasks||[]).length>0;
    let greeting;
    if(hasMem&&(mem.pending_tasks||[]).length>0){
      greeting="Good "+tod+". I've reviewed my notes and I'm fully up to date. I still have \""+mem.pending_tasks[0]+"\" noted as pending from our last conversation. How can I help you today?";
    }else if(hasMem&&lastSession){
      greeting="Good "+tod+". I've reviewed my notes from our previous conversations and I'm ready. How may I assist you today?";
    }else{
      greeting="Good "+tod+". I'm Eleanor, your Personal Executive Assistant. How may I assist you today?";
    }
    return [{role:"assistant",text:greeting,ts:new Date()}];
  });
  const [chatIn,    setChatIn]   =useState("");
  const [paStatus,  setPaStatus] =useState("idle");
  const [showWave,  setShowWave] =useState(false);
  const [streamedText,setStreamedText]=useState("");
  const [isStreaming,setIsStreaming]=useState(false);
  const [editingMemory,setEditingMemory]=useState(null);
  const [newEv,     setNewEv]    =useState({title:"",date:fmt(today),time:"",priority:"medium",notes:"",source:"manual"});
  const [pasteText, setPasteText]=useState("");
  const [importContext,setImportContext]=useState("");
  const [userContext,setUserContext]=useState(()=>localStorage.getItem("papa_user_context")||"Single mother. Children: Maleeka and Maliki. Lives in March, Cambridgeshire. Rover dog-sitter. App developer. Benefits include Carer's Allowance.");
  const [persistentMemory,setPersistentMemory]=useState(()=>{try{return JSON.parse(localStorage.getItem("papa_persistent_memory")||"{}");} catch{return {};}});
  const [sessionSummary,setSessionSummary]=useState(()=>localStorage.getItem("papa_last_session")||"");
  const [criticalOnly,setCriticalOnly]=useState(false);
  const [criticalDismissed,setCriticalDismissed]=useState(false);
  const [dismissedCriticalIds,setDismissedCriticalIds]=useState(()=>{try{return JSON.parse(localStorage.getItem("papa_dismissed_critical")||"[]");}catch{return [];}});
  const [eventNotes,setEventNotes]=useState(()=>{try{return JSON.parse(localStorage.getItem("papa_event_notes")||"{}");}catch{return {};}});
  const [editingEventId,setEditingEventId]=useState(null);
  const [rescheduleId,setRescheduleId]=useState(null);
  const [rescheduleSearch,setRescheduleSearch]=useState("");
  const [rescheduleDate,setRescheduleDate]=useState("");
  const [rescheduleTime,setRescheduleTime]=useState("");
  const importContextRef=useRef("");
  const [pasteBusy, setPasteBusy]=useState(false);
  const [pasteRes,  setPasteRes] =useState(null);
  const [confirmCosts, setConfirmCosts] = useState(false);
  const [editedFinancials, setEditedFinancials] = useState([]);
  const [imgFile,   setImgFile]  =useState(null);
  const [imgB64,    setImgB64]   =useState(null);
  const [multiImgQueue,setMultiImgQueue]=useState([]);
  const [imgPrev,   setImgPrev]  =useState(null);
  const [imgBusy,   setImgBusy]  =useState(false);
  const [imgRes,    setImgRes]   =useState(null);
  const [emailSt,   setEmailSt]  =useState("idle");
  const [emailEvs,  setEmailEvs] =useState(null);
  const [calSt,     setCalSt]    =useState("idle");
  const [homeAddress,setHomeAddress]=useState(()=>localStorage.getItem("papa_home_address")||"");
  const [travelMode,setTravelMode]=useState(()=>localStorage.getItem("papa_travel_mode")||"");
  const [showTravelModal,setShowTravelModal]=useState(false);
  const [eventWeather,setEventWeather]=useState({});
  const [reminders,setReminders]=useState(()=>{try{return JSON.parse(localStorage.getItem("papa_reminders")||"[]");}catch{return [];}});
  const [birthdays,setBirthdays]=useState(()=>{try{return JSON.parse(localStorage.getItem("papa_birthdays")||"[]");}catch{return [];}});
  const [birthdayActions,setBirthdayActions]=useState(()=>{try{return JSON.parse(localStorage.getItem("papa_birthday_actions")||"{}");}catch{return {};}});
  const [showReminderModal,setShowReminderModal]=useState(false);
  const [newReminder,setNewReminder]=useState({text:"",time:"08:00",days:["1","2","3","4","5","6","7"]});
  const [voiceListening,setVoiceListening]=useState(false);
  const [eleanorSpeaking,setEleanorSpeaking]=useState(false);
  const [elevenLabsKey,setElevenLabsKey]=useState(()=>localStorage.getItem("papa_11labs_key")||"");
  const [premiumVoice,setPremiumVoice]=useState(()=>localStorage.getItem("papa_premium_voice")!=="false");
  const audioRef=React.useRef(null);
  const [eleanorVoiceOn,setEleanorVoiceOn]=useState(()=>localStorage.getItem("papa_voice_on")!=="false");
  const [briefingVoiceOn,setBriefingVoiceOn]=useState(()=>localStorage.getItem("papa_briefing_voice")!=="false");
  const [autoBriefingDone,setAutoBriefingDone]=useState(()=>localStorage.getItem("papa_auto_brief_date")===new Date().toDateString());
  const [notifPermission,setNotifPermission]=useState(()=>typeof Notification!=="undefined"?Notification.permission:"default");
  const [onboarded,setOnboarded]=useState(()=>localStorage.getItem("papa_onboarded")==="true");
  const [weeklyGoals,setWeeklyGoals]=useState(()=>{try{return JSON.parse(localStorage.getItem("papa_weekly_goals")||"null");}catch{return null;}});
  const [showGoalsModal,setShowGoalsModal]=useState(false);
  const [goalInput,setGoalInput]=useState(["","",""]);
  const [searchQuery,setSearchQuery]=useState("");
  const [showSearch,setShowSearch]=useState(false);
  const [isOnline,setIsOnline]=useState(navigator.onLine);
  const [weekWeather,setWeekWeather]=useState(null);
  const [apiError,setApiError]=useState(null);
  const [onboardStep,setOnboardStep]=useState(0);
  const [swRegistered,setSwRegistered]=useState(false);
  const [conflictWarning,setConflictWarning]=useState(null);
  const [dismissedConflicts,setDismissedConflicts]=useState(()=>{try{return JSON.parse(localStorage.getItem("papa_dismissed_conflicts")||"[]");}catch{return [];}});
  const [finances,setFinances]=useState(()=>{try{return JSON.parse(localStorage.getItem("papa_finances")||"[]");}catch{return [];}});
  const [tripAlerts,setTripAlerts]=useState([]);
  const [voiceText,setVoiceText]=useState("");
  const [wishlist,  setWishlist]  =useState(()=>{try{return JSON.parse(localStorage.getItem("papa_wishlist")||"[]");}catch{return [];}});
  const [wishlistPaste,setWishlistPaste]=useState("");
  const [wishlistImportMode,setWishlistImportMode]=useState(null);
  const [wishlistImgFile,setWishlistImgFile]=useState(null);
  const [wishlistImgB64,setWishlistImgB64]=useState(null);
  const [wishlistImportBusy,setWishlistImportBusy]=useState(false);
  const [wishlistImportRes,setWishlistImportRes]=useState(null);
  const [wishlistPasteBusy,setWishlistPasteBusy]=useState(false);
  const [linkUrl,   setLinkUrl]   =useState("");
  const [checkerText,setCheckerText]=useState("");
  const [calMonth,setCalMonth]=useState(()=>{const d=new Date();return{y:d.getFullYear(),m:d.getMonth()};});
  const [selectedDay,setSelectedDay]=useState(fmt(today));
  const [reminderText,setReminderText]=useState("");
  const [eventWx,setEventWx]=useState({});
  const [eventBriefs,setEventBriefs]=useState({});
  const [eventBriefBusy,setEventBriefBusy]=useState({});
  const [eventExpanded,setEventExpanded]=useState({});
  const [reminderTime,setReminderTime]=useState("08:00");
  const [reminderDays,setReminderDays]=useState(["0","1","2","3","4","5","6"]);
  const [checkerFile,setCheckerFile]=useState(null);
  const [checkerBusy,setCheckerBusy]=useState(false);
  const [checkerRes, setCheckerRes] =useState(null);
  const [emailText, setEmailText] =useState("");
  const [emailBusy, setEmailBusy] =useState(false);
  const [emailRes,  setEmailRes]  =useState(null);
  const [handleText,setHandleText]=useState("");
  const [handleDocFile,setHandleDocFile]=useState(null);
  const [handleBusy,setHandleBusy]=useState(false);
  const [handleRes, setHandleRes] =useState(null);
  const [docFile,   setDocFile]   =useState(null);
  const [pdfFile,   setPdfFile]   =useState(null);
  const [pdfBusy,   setPdfBusy]   =useState(false);
  const [pdfRes,    setPdfRes]    =useState(null);
  const [docBusy,   setDocBusy]   =useState(false);
  const [docRes,    setDocRes]    =useState(null);
  const [linkBusy,  setLinkBusy]  =useState(false);
  const [linkRes,   setLinkRes]   =useState(null);
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

  // Consolidated storage - all saves in one effect per state
  useEffect(()=>{try{localStorage.setItem("papa_wishlist",JSON.stringify(wishlist));}catch{}},[wishlist]);
  useEffect(()=>{if(homeAddress)localStorage.setItem("papa_home_address",homeAddress);},[homeAddress]);
  useEffect(()=>{try{localStorage.setItem("papa_reminders",JSON.stringify(reminders));}catch{}},[reminders]);
  useEffect(()=>{try{localStorage.setItem("papa_birthdays",JSON.stringify(birthdays));}catch{}},[birthdays]);
  useEffect(()=>{try{localStorage.setItem("papa_finances",JSON.stringify(finances));}catch{}},[finances]);
  useEffect(()=>{if(weeklyGoals)localStorage.setItem("papa_weekly_goals",JSON.stringify(weeklyGoals));},[weeklyGoals]);
  useEffect(()=>{try{const s={eventNotes,birthdayActions,dismissedCriticalIds,dismissedConflicts};Object.entries({papa_event_notes:eventNotes,papa_birthday_actions:birthdayActions,papa_dismissed_critical:dismissedCriticalIds,papa_dismissed_conflicts:dismissedConflicts}).forEach(([k,v])=>localStorage.setItem(k,JSON.stringify(v)));}catch{}},[eventNotes,birthdayActions,dismissedCriticalIds,dismissedConflicts]);
  // Save messages debounced to avoid too many writes
  const msgSaveTimer=React.useRef(null);
  useEffect(()=>{
    if(msgSaveTimer.current)clearTimeout(msgSaveTimer.current);
    msgSaveTimer.current=setTimeout(()=>{
      try{
        const toSave=msgs.slice(-30).map(m=>({...m,ts:m.ts?.toISOString?m.ts.toISOString():m.ts}));
        localStorage.setItem("papa_msgs",JSON.stringify(toSave));
      }catch{}
    },1000);
  },[msgs]);

  // msgs saved via debounced effect below

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

  function addEvs(list,src){
    setEvents(ev=>{
      const mx=Math.max(0,...ev.map(e=>e.id));
      // Deduplicate - skip events within 1 day of same title
      const existingKeys=new Set(ev.map(e=>e.title.toLowerCase().trim().slice(0,20)+"_"+e.date));
      const filtered=list.filter(e=>{
        const key=e.title.toLowerCase().trim().slice(0,20)+"_"+e.date;
        if(existingKeys.has(key))return false;
        existingKeys.add(key);
        return true;
      });
      if(!filtered.length)return ev;
      const newEvs=filtered.map((e,i)=>({...e,id:mx+i+1+(Math.floor(Math.random()*10000)),source:src}));
      // Check first event for conflicts
      if(newEvs.length>0){
        const clashes=ev.filter(e=>e.date===newEvs[0].date);
        const dayBefore=fmt(new Date(new Date(newEvs[0].date+"T12:00:00").getTime()-86400000));
        const dayAfter=fmt(new Date(new Date(newEvs[0].date+"T12:00:00").getTime()+86400000));
        const nearby=ev.filter(e=>e.date===dayBefore||e.date===dayAfter);
        if(clashes.length>0||nearby.length>0){
          setTimeout(()=>setConflictWarning({event:newEvs[0],clashes,nearby,dayBefore,dayAfter}),300);
        }
      }
      return [...ev,...newEvs];
    });
  }
  function del(id){setEvents(ev=>ev.filter(e=>e.id!==id));}

  // Robust JSON extractor - handles truncated, malformed, escaped JSON
  function robustJSON(raw){
    if(!raw)return null;
    // Remove markdown fences
    let s=raw.replace(/```json/g,"").replace(/```/g,"").trim();
    // Find outermost { }
    const start=s.indexOf("{");
    const end=s.lastIndexOf("}");
    if(start<0)return null;
    let sub=start>=0&&end>start?s.slice(start,end+1):s;
    // Try direct parse
    try{return JSON.parse(sub);}catch{}
    // Fix common issues:
    // 1. Remove trailing commas before } or ]
    sub=sub.replace(/,(\s*[}\]])/g,"$1");
    // 2. Fix unquoted property names
    sub=sub.replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)(\s*:)/g,'$1"$2"$3');
    // 3. Fix single quotes
    sub=sub.replace(/'/g,'"');
    try{return JSON.parse(sub);}catch{}
    // 4. Truncation repair - find last complete array element
    // Remove trailing incomplete string
    sub=sub.replace(/,?\s*"[^"]*$/,"");
    // Count and close unclosed brackets
    let opens=0,openSq=0;
    for(const ch of sub){
      if(ch==="{")opens++;
      else if(ch==="}")opens--;
      else if(ch==="[")openSq++;
      else if(ch==="]")openSq--;
    }
    for(let i=0;i<openSq;i++)sub+="]";
    for(let i=0;i<opens;i++)sub+="}";
    try{return JSON.parse(sub);}catch{}
    return null;
  }

  async function callAI(body){
    if(!navigator.onLine){
      setApiError("You're offline. Eleanor needs an internet connection to think. Your schedule is still available.");
      return "";
    }
    try{
      const r=await fetch("/api/ai",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-5",max_tokens:2000,...body})});
      const d=await r.json();
      if(!r.ok){
        setApiError("Eleanor couldn't respond right now. Please try again in a moment.");
        return "";
      }
      setApiError(null);
      return d.content?.find(b=>b.type==="text")?.text||"";
    }catch(e){
      setApiError("Connection issue. Please check your internet and try again.");
      return "";
    }
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

  async function sendChat(directText){
    const el=document.getElementById("chat-input");
    const inputVal=directText||chatIn;
    if(!inputVal.trim()||paStatus!=="idle")return;
    const u=inputVal.trim();
    setChatIn("");
    if(el)el.value="";
    setMsgs(m=>[...m,{role:"user",text:u,ts:new Date()}]);
    setPaStatus("thinking");
    // Merge events state with localStorage - take whichever has more
    let freshEvents=[];
    try{freshEvents=JSON.parse(localStorage.getItem("papa_events")||"[]");}catch{}
    const allEvents=events.length>=freshEvents.length?[...events]:[...freshEvents];
    const ctx=allEvents.length>0
      ?allEvents.sort((a,b)=>a.date.localeCompare(b.date)).map(e=>`${e.date} ${e.time||"anytime"} – ${e.title} (${e.priority})`).join("\n")
      :"No events scheduled yet.";
    console.log("Eleanor context events count:", allEvents.length, "\nFirst 3:", allEvents.slice(0,3).map(e=>e.title));
    try{
      // Build fresh context - inject as a system-level context message
      const now=new Date();
      const dateStr=now.toLocaleDateString("en-GB",{weekday:"long",day:"numeric",month:"long",year:"numeric"});
      const timeStr=now.toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit"});
      
      // Sort events chronologically - future events first
      const futureEvents=[...allEvents].filter(e=>e.date>=fmt(today)).sort((a,b)=>a.date.localeCompare(b.date));
      const futureCtx=futureEvents.length>0
        ?futureEvents.map((e,i)=>(i+1)+". "+e.date+" ("+new Date(e.date+"T12:00:00").toLocaleDateString("en-GB",{weekday:"short"})+") "+(e.time||"all day")+" — "+e.title+(e.notes?" ["+e.notes+"]":"")).join("\n")
        :"No upcoming events";
      const memParts=[];
      if((persistentMemory.facts||[]).length>0)memParts.push("ELEANOR REMEMBERS:\n"+persistentMemory.facts.map(f=>"- "+f).join("\n"));
      if((persistentMemory.pending_tasks||[]).length>0)memParts.push("PENDING TASKS ELEANOR NOTED:\n"+persistentMemory.pending_tasks.map(t=>"- "+t).join("\n"));
      if((persistentMemory.emotional_notes||[]).length>0)memParts.push("RECENT EMOTIONAL CONTEXT:\n"+persistentMemory.emotional_notes.map(n=>"- "+n).join("\n"));
      if((persistentMemory.preferences||[]).length>0)memParts.push("SARAH'S PREFERENCES:\n"+persistentMemory.preferences.map(p=>"- "+p).join("\n"));
      const memFacts=memParts.join("\n\n");
      const lastSession=sessionSummary?"LAST CONVERSATION:\n"+sessionSummary:"";
      const sessionHistory=(()=>{try{const h=JSON.parse(localStorage.getItem("papa_session_history")||"[]");return h.length>0?"PREVIOUS SESSIONS:\n"+h.slice(0,2).map(s=>s.date+": "+s.text).join("\n"):"";}catch{return "";}})();
      const activeReminders=reminders.length>0?"ACTIVE REMINDERS:\n"+reminders.map(r=>"- "+r.text+" at "+r.time).join("\n"):"";
      const upcomingBdays=getBirthdayAlerts().filter(b=>b.days<=30).map(b=>"- "+b.name+" in "+b.days+" days ("+b.next+")").join("\n");
      // Build weather context string
      const weatherCtx=weekWeather?.length>0
        ?"7-DAY WEATHER FORECAST (March, Cambridgeshire):\n"+weekWeather.map(w=>w.date+" ("+w.day+"): "+w.icon+" "+w.desc+", "+w.max+"°C/"+w.min+"°C, rain "+w.rain+"%, wind "+w.wind+"km/h").join("\n")
        :"Weather: unavailable";

      // Build finances context
      const thisMonth=new Date().getMonth();
      const thisYear=new Date().getFullYear();
      const monthFin=finances.filter(f=>f.status!=="paid"&&f.date&&new Date(f.date+"T12:00:00").getMonth()===thisMonth&&new Date(f.date+"T12:00:00").getFullYear()===thisYear);
      const finCtx=monthFin.length>0?"THIS MONTH'S FINANCES:\n"+monthFin.map(f=>"- "+f.label+": £"+(f.amount||0).toFixed(2)+" ("+f.type+") due "+f.date).join("\n"):"";

      // Build weekly goals context
      const goalsCtx=weeklyGoals?.goals?.length>0?"THIS WEEK'S GOALS:\n"+weeklyGoals.goals.map((g,i)=>"- "+g+(weeklyGoals.done?.[i]?" [DONE]":"")).join("\n"):"";

      // Recent past events (last 2 weeks) for context
      const pastEvs=allEvents.filter(e=>e.date<fmt(today)&&e.date>=fmt(new Date(today.getTime()-14*86400000))).sort((a,b)=>b.date.localeCompare(a.date)).slice(0,5);
      const pastCtx=pastEvs.length>0?"RECENT PAST EVENTS:\n"+pastEvs.map(e=>"- "+e.date+" "+e.title).join("\n"):"";

      const contextContent=[
        "DATE/TIME: "+dateStr+" at "+timeStr,
        "UPCOMING EVENTS ("+futureEvents.length+", sorted soonest first):\n"+futureCtx,
        pastCtx,
        lastSession,
        sessionHistory,
        memFacts,
        activeReminders,
        upcomingBdays?"UPCOMING BIRTHDAYS:\n"+upcomingBdays:"",
        weatherCtx,
        finCtx,
        goalsCtx,
        "ABOUT SARAH: "+userContext,
        "CONFLICTS: "+cfls.length
      ].filter(Boolean).join("\n\n");
      // Detect patterns in events - generic for any user
      const patternNotes=[];
      const titleFreq={};
      const dayFreq={};
      const monthFreq={};
      allEvents.forEach(e=>{
        // Title frequency - anything appearing 2+ times
        const key=e.title.toLowerCase().trim().slice(0,25);
        titleFreq[key]=(titleFreq[key]||[]); 
        titleFreq[key].push(e.date);
        // Day of week frequency
        const dow=new Date(e.date+"T12:00:00").getDay();
        const dowName=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][dow];
        dayFreq[key]=dayFreq[key]||{};
        dayFreq[key][dowName]=(dayFreq[key][dowName]||0)+1;
      });
      Object.entries(titleFreq).forEach(([title,dates])=>{
        if(dates.length<2)return;
        // Check if same day of week (weekly pattern)
        const days=Object.entries(dayFreq[title]||{}).filter(([,v])=>v>=2);
        if(days.length>0){
          patternNotes.push(`Recurring pattern: "${title}" appears ${dates.length} times, often on ${days[0][0]}s`);
        } else if(dates.length>=3){
          patternNotes.push(`Recurring pattern: "${title}" appears ${dates.length} times in schedule`);
        }
      });
      // Check for monthly patterns (e.g. benefits, payments)
      allEvents.forEach(e=>{
        const dom=new Date(e.date+"T12:00:00").getDate();
        if([1,7,14,15,21,28].includes(dom)){
          const key=e.title.toLowerCase().slice(0,20);
          if((monthFreq[key]||0)>=2){
            patternNotes.push(`Monthly pattern: "${e.title}" may recur around the ${dom}${dom===1?"st":dom===2?"nd":dom===3?"rd":"th"} of each month`);
          }
          monthFreq[key]=(monthFreq[key]||0)+1;
        }
      });

      const contextMsg={role:"user",content:"[ELEANOR MEMORY SYNC - READ THIS FIRST]\n"+contextContent+(patternNotes.length?"\n\nPATTERNS NOTICED:\n"+patternNotes.join("\n"):"")+"\n[END SYNC]"};
      // Trim conversation to last 20 messages to avoid token limits
      const trimmedMsgs=msgs.slice(-20);
      const raw=await callAI({system:`You are Eleanor — a warm, brilliant, deeply trusted Personal Executive Assistant to Sarah. You are not a generic AI. You know Sarah's life intimately and care about her wellbeing.

SARAH: Single mother, indie app developer (Skyla, Thinko, GigNest), Rover dog-sitter, March, Cambridgeshire, UK. Children: Maleeka and Maliki (school age). Has ME/CFS. Benefits include Carer's Allowance. Dog: Ringo.

TODAY: ${new Date().toLocaleDateString("en-GB",{weekday:"long",day:"numeric",month:"long",year:"numeric"})} at ${new Date().toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit"})}. NEVER contradict this date.

YOUR CHARACTER:
- Warm and calm — especially if Sarah seems tired or overwhelmed, acknowledge it gently
- Proactive — spot things before she asks. Trip mentioned? Offer packing list. Deadline near? Flag it.
- Specific — always use exact dates, times, amounts from the schedule. Never be vague.
- Personal — reference her memory: "As I noted..." or "You mentioned last time..."
- Concise — one clear paragraph. One proactive follow-up max. Never bullet points. Never ** or *.
- Use Sarah by name naturally. Use Maleeka and Maliki when relevant.

SCHEDULE INTELLIGENCE:
- Read ELEANOR MEMORY SYNC block before every answer — complete schedule is there
- Sort ALL events by date — SOONEST first always
- Never mention school events on weekends or bank holidays
- UK school holidays 2026: Easter 3-17 April, Summer from 21 July
- Cross-reference 7-DAY WEATHER FORECAST for outdoor activity questions
- Notice patterns in bookings and flag them helpfully

PROACTIVE TRIGGERS:
- Date mentioned by Sarah → immediately check if she is free
- Trip or holiday → offer packing list, weather, travel time
- She seems stressed → suggest rest day, acknowledge the load she carries
- Approaching deadline → flag before she asks
- Scheduling clash spotted → warn immediately
- Rover booking pattern → suggest setting up recurring

CRITICAL: Always read ELEANOR MEMORY SYNC fully. Sort events soonest first.`,messages:[contextMsg,...trimmedMsgs.map(m=>({role:m.role,content:m.text})),{role:"user",content:u}]});
      // Strip markdown formatting from Eleanor's response
      const clean=raw.replace(/\*\*(.*?)\*\*/g,"$1").replace(/\*(.*?)\*/g,"$1").replace(/#{1,3} /g,"").trim();
      // Add message immediately, then typewriter shows it being typed
      const finalMsg={role:"assistant",text:clean,ts:new Date()};
      setPaStatus("speaking");
      // Start typewriter - message added after it completes
      typewriterEffect(clean,()=>{
        setShowWave(false);
        setPaStatus("idle");
        if(eleanorVoiceOn)eleanorSpeak(clean);
        // Add message to chat
        setMsgs(m=>{
          const updated=[...m,{role:"assistant",text:clean,ts:new Date()}];
          const assistantCount=updated.filter(x=>x.role==="assistant").length;
          if(assistantCount>0&&assistantCount%10===0){
            setTimeout(()=>saveSessionSummary(updated),100);
          }
          return updated;
        });
        // Background memory extraction - completely outside setMsgs
        setTimeout(()=>{
          const allMsgs=JSON.parse(localStorage.getItem("papa_msgs")||"[]");
          const assistantCount=allMsgs.filter(x=>x.role==="assistant").length;
          if(assistantCount>0&&assistantCount%3===0){
            const recentTranscript=allMsgs.slice(-6).map(x=>(x.role==="user"?"Sarah":"Eleanor")+": "+x.text).join("\n");
            callAI({
              system:'Extract NEW facts only. Return ONLY raw JSON: {"facts":[],"pending_tasks":[],"preferences":[]}. Max 2 each. Empty arrays if nothing new.',
              messages:[{role:"user",content:recentTranscript}]
            }).then(r=>{
              try{
                const p=JSON.parse(r.replace(/```json|```/g,"").trim());
                if(p.facts?.length||p.pending_tasks?.length||p.preferences?.length){
                  const existing=JSON.parse(localStorage.getItem("papa_persistent_memory")||"{}");
                  const upd={...existing,facts:[...(existing.facts||[]),...(p.facts||[])].slice(-25),pending_tasks:[...(existing.pending_tasks||[]),...(p.pending_tasks||[])].slice(-10),preferences:[...(existing.preferences||[]),...(p.preferences||[])].slice(-15)};
                  localStorage.setItem("papa_persistent_memory",JSON.stringify(upd));
                  setPersistentMemory(upd);
                }
              }catch{}
            }).catch(()=>{});
          }
        },500);
      });
    }catch{setMsgs(m=>[...m,{role:"assistant",text:"I do apologise — something went wrong. Please try once more.",ts:new Date()}]);setPaStatus("idle");setShowWave(false);}
  }

  async function generateBriefing(){
    setBriefBusy(true);setBriefing(null);
    const hols=upcomingHols(6);
    const freshEvs=JSON.parse(localStorage.getItem("papa_events")||"[]");
    const allEvs=freshEvs.length>=events.length?freshEvs:events;
    const schedCtx=(()=>{const lines=[];for(let i=0;i<90;i++){const d=new Date(today.getTime()+i*86400000),ds=fmt(d);const de=allEvs.filter(e=>e.date===ds);if(de.length)lines.push(`${ds}: `+de.map(e=>`${e.time} ${e.title} (${e.priority})`).join(", "));}return lines.join("\n")||"No events scheduled.";})();
    const holCtx=hols.map(h=>`${h.name}: ${h.start} to ${h.end} (${daysUntil(h.start)} days away)`).join("\n");
    const hour=new Date().getHours();
    const timeOfDay=hour<12?"morning":hour<17?"afternoon":"evening";
    // Build EXACT date-to-day mapping so Eleanor cannot get days wrong
    const dayCalendar=Array.from({length:14},(_,i)=>{
      const d=new Date(today.getTime()+i*86400000);
      return fmt(d)+" = "+d.toLocaleDateString("en-GB",{weekday:"long",day:"numeric",month:"long",year:"numeric"});
    }).join("\n");
    const wxBriefCtx=weekWeather?.length>0
      ?"7-DAY WEATHER:\n"+weekWeather.map(w=>w.date+" ("+w.day+"): "+w.icon+" "+w.desc+", "+w.max+"°/"+w.min+"°, rain "+w.rain+"%").join("\n")
      :"";
    try{const raw=await callAI({system:'You are Eleanor, Personal Executive Assistant to Sarah (single mother, March Cambridgeshire, children Maleeka and Maliki, Rover dog-sitter, app developer). Produce a briefing. Return ONLY valid JSON, no markdown: {"headline":string,"today_summary":string,"how_are_you":string,"best_day_this_week":{"date":"YYYY-MM-DD","day_name":string,"reason":string},"alerts":[{"title":string,"detail":string,"severity":"high|medium|low"}],"holiday_advice":[{"holiday":string,"date_range":string,"days_until":number,"advice":string}],"opportunities":[{"title":string,"detail":string}],"weekly_balance":{"score":number,"comment":string},"recommendations":[{"title":string,"detail":string}]}. CRITICAL: Use ONLY the exact date-to-day mapping — never calculate day names yourself. Include weather in opportunities and recommendations. best_day_this_week: consider both schedule AND weather — pick the best day for outdoor activities or scheduling.',messages:[{role:"user",content:"EXACT DATE-TO-DAY MAPPING:\n"+dayCalendar+"\n\n"+wxBriefCtx+"\n\nSchedule:\n"+schedCtx+"\n\nHolidays:\n"+holCtx+"\n\nConflicts:"+cfls.length+"."}]});
    const parsed=JSON.parse(raw.replace(/```json|```/g,"").trim());
    setBriefing(parsed);
    if(parsed.how_are_you&&briefingVoiceOn){
      setTimeout(()=>eleanorSpeak(parsed.how_are_you),600);
    }
    }catch{setBriefing({error:true});}
    setBriefBusy(false);
  }

  async function parsePaste(){
    if(!pasteText.trim()||pasteBusy)return;
    setPasteBusy(true);setPasteRes(null);setConfirmCosts(false);setEditedFinancials([]);
    try{
      const r=await fetch("/api/ai",{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          model:"claude-sonnet-4-5",
          max_tokens:16000,
          system:`You are a life assistant. Extract info from text as compact JSON. Return ONLY raw JSON, no markdown.
Format: {"events":[{"title":string,"date":"YYYY-MM-DD","time":"HH:MM","priority":"critical|high|medium|low","notes":string}],"financials":[{"label":string,"amount":number,"type":"cost|saving|payment","date":string,"notes":string}],"destinations":[{"name":string,"dates":string}],"insights":[{"text":string}],"summary":string,"total_cost":number,"total_saving":number}
Rules: extract every date/trip/payment/cost. No time="09:00". Use future year if none stated. Keep ALL string values under 80 chars. Max 4 insights. Empty array if nothing relevant.${importContext?` IMPORTANT CONTEXT FROM USER: ${importContext} — use this to filter and prioritise what to extract.`:""}`,
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
      const parsed=robustJSON(raw);
      if(!parsed||!parsed.events||parsed.events.length===0){
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

    function handleImgMultiple(e){
    const files=Array.from(e.target.files);
    if(!files.length)return;
    setImgRes(null);setMultiImgQueue(files);
    // Read ALL files immediately into base64 to avoid permission expiry
    const readFile=(file)=>new Promise((res,rej)=>{
      const r=new FileReader();
      r.onload=ev=>{const parts=ev.target.result.split(",");res({file,b64:parts[1]||"",prev:ev.target.result});};
      r.onerror=rej;
      r.readAsDataURL(file);
    });
    Promise.all(files.map(readFile)).then(results=>{
      if(results.length>0){
        setImgFile(results[0].file);
        setImgPrev(results[0].prev);
        setImgB64(results[0].b64);
        if(results.length>1){
          // Store all b64 data
          setMultiImgQueue(results.map(r=>({...r,name:r.file.name})));
        }
      }
    }).catch(err=>console.error("File read error:",err));
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
      // Use pre-read b64 only - never re-read from file (Android permission expiry)
      const b64=imgB64;
      if(!b64){
        setImgErr("Could not read image. Please try selecting it again.");
        setImgBusy(false);return;
      }
      const mt=imgFile?.type&&imgFile.type.startsWith("image/")?imgFile.type:"image/jpeg";

      // Step 2: Build prompt
      const imgPrompt=`You are Eleanor, an expert PA with perfect vision reading a document for Sarah. Read ALL text in this image carefully.
This may be: NHS message, Rover booking, ticket, poster, letter, invoice, payslip, bank statement, benefit letter, or screenshot.
Extract EVERY date, event, appointment AND financial amount visible.
Return ONLY raw JSON — no markdown, no backticks:
{"events":[{"title":string,"date":"YYYY-MM-DD","time":"HH:MM","priority":"critical|high|medium|low","notes":string}],"financials":[{"label":string,"amount":number,"type":"income|expense|payment","date":string,"notes":string}],"summary":string}
Rules:
- title: clear description e.g. "NHS Therapy Appointment", "Dog Boarding — Ringo"
- date: convert all formats. "22 Jun 2026"="2026-06-22"
- No year: use ${today.getFullYear()} if future else ${today.getFullYear()+1}
- time: "13:30"="13:30", "3pm"="15:00", unknown="09:00"
- financials: extract ANY money amounts — earnings, payments due, costs, fees, benefits
- notes: name, price, reference, location. Max 100 chars
- priority: medical=critical, bookings=high, social=medium
- NEVER return empty events — include any date you see
${importContext?"CONTEXT: "+importContext:""}`;

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
            model:"claude-sonnet-4-5",
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
        // Auto-save any financial items found
        if(parsed.financials?.length){
          setFinances(f=>[...f,...parsed.financials.map(fi=>({...fi,id:Date.now()+Math.random(),status:"pending",source:"image"}))]);
        }
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

    // ── LINK READER ──
  async function readLink(){
    if(!linkUrl.trim()||linkBusy)return;
    setLinkBusy(true);setLinkRes(null);
    try{
      // Fetch page via proxy
      const proxyUrl="https://api.allorigins.win/raw?url="+encodeURIComponent(linkUrl.trim());
      const r=await fetch(proxyUrl,{signal:AbortSignal.timeout(10000)});
      const html=await r.text();
      // Strip HTML tags, get text content
      const text=html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi,"")
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi,"")
        .replace(/<[^>]+>/g," ")
        .replace(/\s+/g," ")
        .slice(0,3000);
      // Send to AI
      const aiR=await fetch("/api/ai",{method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({model:"claude-sonnet-4-5",max_tokens:1500,
          system:'Extract event details from this webpage text. Return ONLY raw JSON: {"events":[{"title":string,"date":"YYYY-MM-DD","time":"HH:MM","priority":"high","notes":string}],"summary":string,"venue":string,"price":string}',
          messages:[{role:"user",content:"Extract event from this page:\n\n"+text}]
        })
      });
      const d=await aiR.json();
      const raw=d.content?.find(b=>b.type==="text")?.text||"{}";
      const s=raw.indexOf("{"),e=raw.lastIndexOf("}");
      const parsed=s>=0?JSON.parse(raw.slice(s,e+1)):{};
      setLinkRes(parsed);
    }catch(e){
      setLinkRes({error:true,msg:"Could not read that link: "+e.message});
    }
    setLinkBusy(false);
  }

  // ── WISHLIST ANALYSIS ──
  async function analyseWishlistEvent(idx){
    const item=wishlist[idx];
    if(!item||item.analysing)return;
    setWishlist(w=>w.map((x,i)=>i===idx?{...x,analysing:true}:x));
    try{
      // Check weather
      let weatherInfo="";
      if(item.date){
        try{
          const wr=await fetch("https://api.open-meteo.com/v1/forecast?latitude=52.55&longitude=0.09&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=Europe/London&start_date="+item.date+"&end_date="+item.date);
          const wd=await wr.json();
          if(wd.daily?.temperature_2m_max?.[0]){
            const temp=wd.daily.temperature_2m_max[0];
            const code=wd.daily.weathercode[0];
            const wx=code<=1?"☀️ Sunny":code<=3?"⛅ Cloudy":code<=67?"🌧 Rain":"❄️ Snow";
            weatherInfo=wx+" "+Math.round(temp)+"°C";
          }
        }catch{}
      }
      // Check clashes
      const clashEvs=events.filter(e=>e.date===item.date);
      const clashInfo=clashEvs.length?"Clashes: "+clashEvs.map(e=>e.title).join(", "):"No clashes";
      // Travel time via Google Maps embed link
      const mapsUrl=homeAddress?"https://www.google.com/maps/dir/"+encodeURIComponent(homeAddress)+"/"+encodeURIComponent(item.venue||item.title):"";
      // AI analysis
      const aiR=await fetch("/api/ai",{method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({model:"claude-sonnet-4-5",max_tokens:600,
          system:"You are Eleanor, a professional PA. Give a brief practical assessment of this event in 2-3 sentences covering: whether to go, any concerns, and one recommendation. Be warm but direct.",
          messages:[{role:"user",content:"Event: "+item.title+"\nDate: "+item.date+"\nVenue: "+(item.venue||"unknown")+"\nPrice: "+(item.price||"unknown")+"\nWeather: "+(weatherInfo||"unknown")+"\n"+clashInfo+"\nHome: "+(homeAddress||"not set")}]
        })
      });
      const d=await aiR.json();
      const advice=d.content?.find(b=>b.type==="text")?.text||"";
      setWishlist(w=>w.map((x,i)=>i===idx?{...x,analysing:false,analysis:{weather:weatherInfo,clashes:clashEvs,advice,mapsUrl}}:x));
    }catch(e){
      setWishlist(w=>w.map((x,i)=>i===idx?{...x,analysing:false,analysis:{advice:"Could not analyse: "+e.message}}:x));
    }
  }

  // ── PASTE EMAIL ──
  async function parseEmail(){
    if(!emailText.trim()||emailBusy)return;
    setEmailBusy(true);setEmailRes(null);
    try{
      const r=await fetch("/api/ai",{method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({model:"claude-sonnet-4-5",max_tokens:2000,
          system:`You are Eleanor, a highly skilled Personal Executive Assistant reading an email on behalf of Sarah. Extract ALL useful information thoroughly.${importContext?" Context from Sarah: "+importContext:""}

Return ONLY raw JSON:
{"events":[{"title":string,"date":"YYYY-MM-DD","time":"HH:MM","priority":"critical|high|medium|low","notes":string}],"actions":[{"text":string,"deadline":string,"priority":"critical|high|medium|low"}],"key_info":[{"label":string,"value":string}],"summary":string,"sender":string,"sender_email":string,"subject":string,"urgent":boolean,"email_type":"appointment|payment|school|medical|legal|delivery|invitation|bill|benefit|reminder|other","payment":{"amount":string,"due_date":string,"reference":string},"reply_needed":boolean,"reply_suggestion":string}

Rules:
- email_type: categorise what kind of email this is
- payment: extract any amounts, due dates, reference numbers
- reply_suggestion: if reply_needed, draft a brief suggested reply
- urgent: true if deadline within 7 days, legal matter, medical, or payment overdue
- Extract ALL dates mentioned even in passing
- Today is ${fmt(today)}. Use ${today.getFullYear()} if no year stated.`,
          messages:[{role:"user",content:"Read this email and extract all information:\n\n"+emailText}]
        })
      });
      const d=await r.json();
      const raw=d.content?.find(b=>b.type==="text")?.text||"{}";
      const parsed=robustJSON(raw)||{};
      setEmailRes(parsed);
    }catch(e){setEmailRes({error:true,msg:e.message});}
    setEmailBusy(false);
  }

  // ── HANDLE THIS ──
  async function handleThis(){
    if((!handleText.trim()&&!handleDocFile)||handleBusy)return;
    setHandleBusy(true);setHandleRes(null);
    try{
      let messages;
      if(handleDocFile){
        const b64=await new Promise((res,rej)=>{
          const reader=new FileReader();
          reader.onload=()=>res(reader.result.split(",")[1]);
          reader.onerror=rej;
          reader.readAsDataURL(handleDocFile);
        });
        const isPDF=handleDocFile.type==="application/pdf";
        messages=[{role:"user",content:[
          {type:isPDF?"document":"image",source:{type:"base64",media_type:handleDocFile.type,data:b64}},
          {type:"text",text:"Please handle this"+(handleText.trim()?":\n\n"+handleText:" — read this document and draft an appropriate professional response.")}
        ]}];
      }else{
        messages=[{role:"user",content:"Please handle this for me:\n\n"+handleText}];
      }
      const r=await fetch("/api/ai",{method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({model:"claude-sonnet-4-5",max_tokens:2000,
          system:"You are Eleanor, a highly skilled Personal Executive Assistant. Draft a professional, formal letter or email to handle this situation. Be assertive but polite. Include a subject line. Format as: SUBJECT: [subject]\\n\\n[letter body]. Sign off as the user's PA.",
          messages
        })
      });
      const d=await r.json();
      const raw=d.content?.find(b=>b.type==="text")?.text||"";
      setHandleRes(raw);
    }catch(e){setHandleRes("Error: "+e.message);}
    setHandleBusy(false);
  }

  // ── BIRTHDAY HELPERS ──
  function nextOccurrence(monthDay){
    // monthDay format: "MM-DD"
    const [m,d]=monthDay.split("-").map(Number);
    const now=new Date();
    let year=now.getFullYear();
    const next=new Date(year,m-1,d);
    if(next<=now)next.setFullYear(year+1);
    return fmt(next);
  }
  function daysUntilDate(dateStr){
    return Math.ceil((new Date(dateStr+"T12:00:00")-new Date())/86400000);
  }
  function getBirthdayAlerts(){
    return birthdays.map(b=>{
      const next=nextOccurrence(b.monthDay);
      const days=daysUntilDate(next);
      const action=birthdayActions[b.id];
      return{...b,next,days,action};
    }).filter(b=>b.days<=30).sort((a,b)=>a.days-b.days);
  }

  // ── SCHEDULE CHECKER ──
  async function checkSchedule(){
    if((!checkerText.trim()&&!checkerFile)||checkerBusy)return;
    setCheckerBusy(true);setCheckerRes(null);
    try{
      let messages;
      if(checkerFile){
        const b64=await new Promise((res,rej)=>{
          const reader=new FileReader();
          reader.onload=()=>res(reader.result.split(",")[1]);
          reader.onerror=rej;
          reader.readAsDataURL(checkerFile);
        });
        const isPDF=checkerFile.type==="application/pdf";
        messages=[{role:"user",content:[
          {type:isPDF?"document":"image",source:{type:"base64",media_type:checkerFile.type,data:b64}},
          {type:"text",text:"Extract all dates from this document so I can check my schedule."}
        ]}];
      }else{
        messages=[{role:"user",content:checkerText}];
      }

      // First extract dates from the input
      const extractR=await fetch("/api/ai",{method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({model:"claude-sonnet-4-5",max_tokens:1000,
          system:`Extract all dates from this text or document. Return ONLY raw JSON: {"dates":[{"date":"YYYY-MM-DD","label":string,"time":"HH:MM or null"}]}. Today is ${fmt(today)}.`,
          messages
        })
      });
      const extractD=await extractR.json();
      const extractRaw=extractD.content?.find(b=>b.type==="text")?.text||"{}";
      const s=extractRaw.indexOf("{"),e=extractRaw.lastIndexOf("}");
      const extracted=s>=0?JSON.parse(extractRaw.slice(s,e+1)):{dates:[]};

      if(!extracted.dates?.length){
        setCheckerRes({error:true,msg:"No dates found. Please enter specific dates like '14th July' or upload a document with dates."});
        setCheckerBusy(false);return;
      }

      // Check ALL dates in range - if two dates given, fill in every day between them
      let datesToCheck=[];
      if(extracted.dates.length===2){
        const d1=new Date(extracted.dates[0].date+"T12:00:00");
        const d2=new Date(extracted.dates[1].date+"T12:00:00");
        const start=d1<d2?d1:d2;
        const end=d1<d2?d2:d1;
        const cur=new Date(start);
        while(cur<=end){
          datesToCheck.push({date:fmt(cur),label:fmt(cur)===extracted.dates[0].date?extracted.dates[0].label:fmt(cur)===extracted.dates[1].date?extracted.dates[1].label:null,time:null,isRange:true});
          cur.setDate(cur.getDate()+1);
        }
      } else {
        datesToCheck=extracted.dates;
      }

      const results=datesToCheck.map(d=>{
        const dateStr=d.date;
        const dayBefore=fmt(new Date(new Date(dateStr+"T12:00:00").getTime()-86400000));
        const dayAfter=fmt(new Date(new Date(dateStr+"T12:00:00").getTime()+86400000));
        const sameDay=events.filter(e=>e.date===dateStr);
        const before=events.filter(e=>e.date===dayBefore);
        const after=events.filter(e=>e.date===dayAfter);
        const timeClash=d.time?sameDay.filter(e=>e.time&&e.time===d.time):[];
        const isFree=sameDay.length===0;
        const hasConflict=timeClash.length>0;
        return{date:dateStr,label:d.label,time:d.time,isFree,hasConflict,sameDay,before,after,
          verdict:hasConflict?"clash":isFree?"free":sameDay.length<=1?"busy":"very busy"};
      });

      // If it was a range query, show a summary instead of every single day
      if(extracted.dates.length===2&&datesToCheck.length>2){
        const busyDays=results.filter(r=>!r.isFree);
        const clashDays=results.filter(r=>r.hasConflict);
        const freeDays=results.filter(r=>r.isFree);
        // Find alternative free periods nearby
        const rangeEnd=new Date(extracted.dates[1].date+"T12:00:00");
        const alternatives=[];
        for(let i=1;i<=14;i++){
          const altStart=new Date(rangeEnd.getTime()+i*86400000);
          const altEnd=new Date(altStart.getTime()+(datesToCheck.length-1)*86400000);
          const altDays=[];
          let cur=new Date(altStart);
          while(cur<=altEnd){
            const ds=fmt(cur);
            altDays.push({date:ds,busy:events.filter(e=>e.date===ds).length>0});
            cur.setDate(cur.getDate()+1);
          }
          if(altDays.every(d=>!d.busy)){
            alternatives.push({start:fmt(altStart),end:fmt(altEnd),label:altStart.toLocaleDateString("en-GB",{day:"numeric",month:"long"})+" – "+altEnd.toLocaleDateString("en-GB",{day:"numeric",month:"long"})});
            if(alternatives.length>=2)break;
          }
        }
        setCheckerRes({isRange:true,rangeStart:extracted.dates[0].date,rangeEnd:extracted.dates[1].date,totalDays:results.length,freeDays:freeDays.length,busyDays,clashDays,allResults:results,alternatives});
      } else {
        setCheckerRes({dates:results});
      }
    }catch(e){setCheckerRes({error:true,msg:e.message});}
    setCheckerBusy(false);
  }

  // ── PDF UPLOAD & EXTRACT ──
  async function parsePdf(){
    if(!pdfFile||pdfBusy)return;
    setPdfBusy(true);setPdfRes(null);
    try{
      const b64=await new Promise((res,rej)=>{
        const reader=new FileReader();
        reader.onload=()=>res(reader.result.split(",")[1]);
        reader.onerror=rej;
        reader.readAsDataURL(pdfFile);
      });
      const r=await fetch("/api/ai",{method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({model:"claude-sonnet-4-5",max_tokens:8000,
          system:`You are Eleanor, an expert document analyst. Read this entire PDF thoroughly. Extract every date, appointment, deadline, payment, event, action item and key piece of information. Return ONLY raw JSON, no markdown: {"events":[{"title":string,"date":"YYYY-MM-DD","time":"HH:MM","priority":"critical|high|medium|low","notes":string}],"actions":[{"text":string,"deadline":string}],"key_info":[{"label":string,"value":string}],"summary":string}. Today is ${fmt(today)}. If no year stated use ${today.getFullYear()} or ${today.getFullYear()+1} whichever is future. Extract EVERYTHING you can find.`,
          messages:[{role:"user",content:[
            {type:"document",source:{type:"base64",media_type:"application/pdf",data:b64}},
            {type:"text",text:"Please read this entire PDF carefully and extract all dates, events, appointments, deadlines, payments and action items. Be thorough."}
          ]}]
        })
      });
      const d=await r.json();
      if(d.error){setPdfRes({error:true,msg:d.error?.message||"Could not read PDF"});setPdfBusy(false);return;}
      const raw=d.content?.find(b=>b.type==="text")?.text||"{}";
      const parsed=robustJSON(raw)||{};
      setPdfRes(parsed);
    }catch(e){setPdfRes({error:true,msg:e.message});}
    setPdfBusy(false);
  }

  // ── DOCUMENT UPLOAD ──
  async function parseDoc(){
    if(!docFile||docBusy)return;
    setDocBusy(true);setDocRes(null);
    try{
      const b64=await new Promise((res,rej)=>{
        const reader=new FileReader();
        reader.onload=()=>res(reader.result.split(",")[1]);
        reader.onerror=rej;
        reader.readAsDataURL(docFile);
      });
      const isPDF=docFile.type==="application/pdf";
      const r=await fetch("/api/ai",{method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({model:"claude-sonnet-4-5",max_tokens:3000,
          system:'You are Eleanor, a highly intelligent PA. Analyse this document thoroughly. Return ONLY raw JSON: {"events":[{"title":string,"date":"YYYY-MM-DD","time":"HH:MM","priority":"critical|high|medium|low","notes":string}],"actions":[{"text":string,"deadline":string}],"key_info":[{"label":string,"value":string}],"summary":string,"plain_english":string,"important_points":[{"point":string,"type":"warning|info|deadline|money|right"}],"document_type":string}. plain_english: explain the whole document in simple everyday language as if talking to a friend. important_points: bullet the most important things the person needs to know — warnings, rights, deadlines, money amounts, things they must do. document_type: what kind of document this is.',
          messages:[{role:"user",content:[
            {type:isPDF?"document":"image",source:{type:"base64",media_type:docFile.type,data:b64}},
            {type:"text",text:"Extract all key dates, deadlines, appointments and action items from this document."}
          ]}]
        })
      });
      const d=await r.json();
      const raw=d.content?.find(b=>b.type==="text")?.text||"{}";
      const parsed=robustJSON(raw)||{};
      setDocRes(parsed);
    }catch(e){setDocRes({error:true,msg:e.message});}
    setDocBusy(false);
  }

  // ── TYPEWRITER EFFECT - safe version ──
  const typewriterRef=React.useRef(null);
  function typewriterEffect(text,onComplete){
    if(typewriterRef.current)clearTimeout(typewriterRef.current);
    setIsStreaming(true);
    setStreamedText(text);
    // Simple delay instead of word-by-word to avoid mobile crashes
    const readTime=Math.min(Math.max(text.split(" ").length*40,800),3000);
    typewriterRef.current=setTimeout(()=>{
      setIsStreaming(false);
      setStreamedText("");
      if(onComplete)onComplete();
    },readTime);
  }

  // ── SHARE EVENT ──
  function shareEvent(e){
    const text=`${e.title}
${e.date}${e.time?" at "+e.time:""}
${e.notes||""}`.trim();
    if(navigator.share){
      navigator.share({title:e.title,text,url:window.location.href}).catch(()=>{});
    }else{
      const wa="https://wa.me/?text="+encodeURIComponent(text);
      window.open(wa,"_blank");
    }
  }

  // ── WEEKLY GOALS ──
  // Weekly goals auto-show disabled - caused crash

  // ── WEEKLY SUNDAY REVIEW ──
  // Weekly review - disabled auto-nav on mobile

  // ── WISHLIST IMPORT FROM IMAGE/PDF/EMAIL ──
  async function wishlistImport(type,content,b64,mime){
    setWishlistImportBusy(true);setWishlistImportRes(null);
    try{
      const sys='You are Eleanor helping Sarah find events, holidays, experiences or things she might like to attend. Extract ALL potential events from this content. Return ONLY raw JSON: {"items":[{"title":string,"date":"YYYY-MM-DD or empty","venue":string,"price":string,"notes":string,"type":"holiday|concert|event|trip|experience|other"}]}. These are wishlist items — things she might want to attend, NOT confirmed bookings.';
      let messages;
      if(type==="image"&&b64){
        messages=[{role:"user",content:[{type:"image",source:{type:"base64",media_type:mime||"image/jpeg",data:b64}},{type:"text",text:"Extract events and experiences I might want to attend from this image."}]}];
      }else if(type==="pdf"&&b64){
        messages=[{role:"user",content:[{type:"document",source:{type:"base64",media_type:"application/pdf",data:b64}},{type:"text",text:"Extract events, holidays, experiences I might want to attend from this."}]}];
      }else{
        messages=[{role:"user",content:"Extract events and experiences from:\n\n"+content}];
      }
      const raw=await callAI({system:sys,messages,max_tokens:2000});
      const parsed=robustJSON(raw);
      if(parsed?.items?.length){
        setWishlistImportRes(parsed.items);
      }else{
        setWishlistImportRes([]);
      }
    }catch(e){console.error(e);setWishlistImportRes([]);}
    setWishlistImportBusy(false);
  }

  // ── WISHLIST PASTE EXTRACT ──
  async function extractWishlistFromText(){
    const text=wishlistPaste.trim();
    if(!text||wishlistPasteBusy)return;
    setWishlistPasteBusy(true);
    try{
      const r=await callAI({
        system:'Extract events, experiences or things the person is thinking of attending from this text. Return ONLY raw JSON: {"items":[{"title":string,"date":"YYYY-MM-DD or empty","venue":string,"price":string,"notes":string}]}. These are wishlist items not confirmed bookings.',
        messages:[{role:"user",content:"Extract wishlist events from:\n\n"+text}]
      });
      const parsed=robustJSON(r);
      if(parsed?.items?.length){
        setWishlist(w=>[...w,...parsed.items.map(i=>({...i,id:Date.now()+Math.random(),source:"paste"}))]);
        setWishlistPaste("");
        const el=document.getElementById("wishlist-paste-input");
        if(el)el.value="";
      }
    }catch(e){console.error(e);}
    setWishlistPasteBusy(false);
  }

  // ── WEEKLY WEATHER FETCH ──
  useEffect(()=>{
    async function fetchWeekWeather(){
      try{
        const startDate=fmt(today);
        const endDate=fmt(new Date(today.getTime()+6*86400000));
        const r=await fetch(`https://api.open-meteo.com/v1/forecast?latitude=52.55&longitude=0.09&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_probability_max,windspeed_10m_max&timezone=Europe/London&start_date=${startDate}&end_date=${endDate}`);
        const d=await r.json();
        if(!d.daily)return;
        const icons=["☀️","⛅","⛅","⛅","🌫","🌫","🌦","🌦","🌧","🌧","🌧","🌧","❄️","❄️","❄️","❄️","🌦","🌦","🌦","🌦","🌦","🌦","🌦","🌦","⛈","⛈","⛈","⛈","⛈","⛈","⛈","⛈","⛈","⛈","⛈","⛈","⛈","⛈","⛈","⛈","⛈","⛈","⛈","⛈","⛈","⛈","⛈","⛈","⛈","⛈","⛈","⛈","⛈","⛈","⛈","⛈","⛈","⛈","⛈","⛈","⛈","⛈","⛈","⛈","⛈","⛈","⛈","⛈","⛈","⛈","⛈","⛈","⛈","⛈","⛈","⛈","⛈","⛈","⛈","⛈","☀️","⛅"];
        const descs=["Sunny","Mainly sunny","Partly cloudy","Overcast","Foggy","Icy fog","Light drizzle","Drizzle","Rain","Heavy rain","Freezing rain","Heavy freezing rain","Light snow","Snow","Heavy snow","Blizzard","Rain shower","Heavy rain shower","Snow shower","Heavy snow shower","Thunderstorm","Heavy thunderstorm"];
        const getIcon=code=>icons[Math.min(code,icons.length-1)]||"⛅";
        const getDesc=code=>{if(code<=1)return"Sunny";if(code<=3)return"Partly cloudy";if(code<=48)return"Foggy";if(code<=67)return"Rain";if(code<=77)return"Snow";if(code<=82)return"Showers";return"Thunderstorm";};
        const week=d.daily.time.map((date,i)=>({
          date,
          day:new Date(date+"T12:00:00").toLocaleDateString("en-GB",{weekday:"long"}),
          icon:getIcon(d.daily.weathercode[i]),
          desc:getDesc(d.daily.weathercode[i]),
          max:Math.round(d.daily.temperature_2m_max[i]),
          min:Math.round(d.daily.temperature_2m_min[i]),
          rain:d.daily.precipitation_probability_max[i],
          wind:Math.round(d.daily.windspeed_10m_max[i]),
          code:d.daily.weathercode[i]
        }));
        setWeekWeather(week);
      }catch(e){console.warn("Weather fetch failed:",e);}
    }
    fetchWeekWeather();
    // Refresh weather every hour
    const interval=setInterval(fetchWeekWeather,3600000);
    return()=>clearInterval(interval);
  },[]);

  // ── OFFLINE DETECTION ──
  useEffect(()=>{
    const goOnline=()=>setIsOnline(true);
    const goOffline=()=>setIsOnline(false);
    window.addEventListener("online",goOnline);
    window.addEventListener("offline",goOffline);
    return()=>{window.removeEventListener("online",goOnline);window.removeEventListener("offline",goOffline);};
  },[]);

  // ── RECURRING EVENTS ──
  // Expand recurring events into actual dates (up to 90 days ahead)
  useEffect(()=>{
    try{
      const recurring=JSON.parse(localStorage.getItem("papa_recurring")||"[]");
      if(!recurring.length)return;
      const toAdd=[];
      const existingKeys=new Set(events.map(e=>e.date+"_"+e.title.slice(0,20)));
      recurring.forEach(r=>{
        let d=new Date();
        let safety=0;
        const end=new Date(d.getTime()+90*86400000);
        while(d<=end&&safety<200){
          safety++;
          const ds=fmt(d);
          const key=ds+"_"+r.title.slice(0,20);
          if(!existingKeys.has(key)){
            toAdd.push({id:Date.now()+Math.random()*10000,title:r.title,date:ds,time:r.time||"09:00",priority:r.priority||"medium",notes:"",source:"recurring"});
            existingKeys.add(key);
          }
          if(r.freq==="daily")d.setDate(d.getDate()+1);
          else if(r.freq==="weekly")d.setDate(d.getDate()+7);
          else if(r.freq==="fortnightly")d.setDate(d.getDate()+14);
          else if(r.freq==="monthly")d.setMonth(d.getMonth()+1);
          else break;
        }
      });
      if(toAdd.length>0)setEvents(ev=>[...ev,...toAdd.slice(0,50)]);
    }catch(e){console.warn("Recurring events error:",e);}
  },[]);

  // ── SERVICE WORKER & NOTIFICATIONS ──
  useEffect(()=>{
    if("serviceWorker" in navigator){
      navigator.serviceWorker.register("/sw.js").then(reg=>{
        setSwRegistered(true);
        // Schedule periodic sync if supported
        if("periodicSync" in reg){
          reg.periodicSync.register("reminder-check",{minInterval:60*60*1000}).catch(()=>{});
        }
      }).catch(()=>{});
    }
  },[]);

  async function requestNotifications(){
    if(typeof Notification==="undefined")return false;
    const perm=await Notification.requestPermission();
    setNotifPermission(perm);
    return perm==="granted";
  }

  function scheduleNotification(title,body,fireAt,tag){
    if(notifPermission!=="granted")return;
    const delay=new Date(fireAt).getTime()-Date.now();
    if(delay<0)return;
    if(delay<2*60*1000){
      // Fire immediately if within 2 minutes
      new Notification(title,{body,icon:"/icon-192.png",tag});
      return;
    }
    // Store for service worker to fire
    const scheduled=JSON.parse(localStorage.getItem("papa_schedu
