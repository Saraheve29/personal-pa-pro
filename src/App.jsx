// VERSION_CHECK: Day-Of-Week-Fix build - June 21 2026 v30
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

// Always compute "now" fresh so the app never gets stuck on a stale day.
// (A PWA left open would otherwise freeze the date at first load.)
const getToday=()=>new Date();
// Format a date as YYYY-MM-DD in LOCAL time (not UTC) to avoid day-shift near midnight.
const fmt=d=>{const x=d||new Date();const y=x.getFullYear();const m=String(x.getMonth()+1).padStart(2,"0");const day=String(x.getDate()).padStart(2,"0");return y+"-"+m+"-"+day;};

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
const upcomingHols=(n=5)=>{const t=fmt(getToday());return UK_HOLIDAYS.filter(h=>h.end>=t).sort((a,b)=>a.start.localeCompare(b.start)).slice(0,n);};
const daysUntil=ds=>Math.ceil((new Date(ds+"T12:00:00")-getToday())/86400000);
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
        if(a.title.toLowerCase()===b.title.toLowerCase()){
          out.push([a.id,b.id,"duplicate"]);
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
const PA_FALLBACK = true; // Show initials if photo fails

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
  const [imgErr,setImgErr]=React.useState(false);
  return(
    <div style={{position:"relative",width:size,height:size,flexShrink:0}}>
      <div style={{position:"absolute",inset:-4,borderRadius:"50%",background:`conic-gradient(${C.goldBright},${C.goldLight},${C.goldBorder},${C.gold},${C.goldBright})`,opacity:speaking?0.9:0.5,animation:speaking?"paRing 1.8s linear infinite":pulse?"paRingIdle 3s ease-in-out infinite":"none",boxShadow:speaking?`0 0 18px ${C.goldLight}`:pulse?`0 0 10px ${C.goldPale}`:"none"}}/>
      <div style={{position:"absolute",inset:2,borderRadius:"50%",background:`linear-gradient(145deg,${C.cream},${C.creamDeep})`,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`inset 0 1px 3px ${C.shadow}`,overflow:"hidden"}}>
        {PA_PHOTO
          ? <img src={PA_PHOTO} alt="Eleanor" style={{width:"100%",height:"100%",objectFit:"cover",borderRadius:"50%"}} onError={e=>{e.target.style.display="none";e.target.nextSibling.style.display="flex";}}/>
          : null
        }
        <span style={{fontFamily:FD,fontSize:size*0.38,color:C.gold,fontStyle:"italic",lineHeight:1,userSelect:"none",display:PA_PHOTO?"none":"flex",alignItems:"center",justifyContent:"center",width:"100%",height:"100%"}}>PA</span>
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

// Safe localStorage with quota handling and auto-cleanup of stale per-date keys
function cleanupOldStorage(){
  try{
    const now=Date.now();
    const keysToCheck=[];
    for(let i=0;i<localStorage.length;i++){
      const k=localStorage.key(i);
      if(!k)continue;
      // Remove old per-date keys (meal, trip alerts, dated notifs) older than ~45 days
      if(k.startsWith("papa_meal_")||k.startsWith("papa_meal_dismissed_")||k.startsWith("papa_trip_alert_")){
        keysToCheck.push(k);
      }
    }
    // Keep only the most recent 20 dated keys of each type, remove the rest
    const mealKeys=keysToCheck.filter(k=>k.startsWith("papa_meal_"));
    const tripKeys=keysToCheck.filter(k=>k.startsWith("papa_trip_alert_"));
    [mealKeys,tripKeys].forEach(group=>{
      if(group.length>20){
        group.slice(0,group.length-20).forEach(k=>{try{localStorage.removeItem(k);}catch{}});
      }
    });
  }catch{}
}

function safeSave(key,value){
  try{
    localStorage.setItem(key,value);
    return true;
  }catch(e){
    // Quota exceeded — try cleanup then retry once
    cleanupOldStorage();
    try{
      // Also trim chat history aggressively as last resort
      const msgs=localStorage.getItem("papa_msgs");
      if(msgs){try{const arr=JSON.parse(msgs);if(arr.length>15)localStorage.setItem("papa_msgs",JSON.stringify(arr.slice(-15)));}catch{}}
      localStorage.setItem(key,value);
      return true;
    }catch(e2){
      return false;
    }
  }
}

// Compress/resize an image file before processing to avoid running the phone out of RAM.
// Phone photos can be 20MB+; this shrinks them to a sane size for OCR while staying readable.
function compressImage(file,maxDim=2000,quality=0.8){
  return new Promise((resolve)=>{
    // PDFs and non-images pass through unchanged
    if(!file||!file.type||!file.type.startsWith("image/")){
      const r=new FileReader();
      r.onload=()=>resolve({b64:(r.result.split(",")[1]||""),dataUrl:r.result,type:file.type});
      r.onerror=()=>resolve(null);
      r.readAsDataURL(file);
      return;
    }
    const img=new Image();
    const url=URL.createObjectURL(file);
    img.onload=()=>{
      try{
        let{width,height}=img;
        if(width>maxDim||height>maxDim){
          if(width>height){height=Math.round(height*maxDim/width);width=maxDim;}
          else{width=Math.round(width*maxDim/height);height=maxDim;}
        }
        const canvas=document.createElement("canvas");
        canvas.width=width;canvas.height=height;
        const ctx=canvas.getContext("2d");
        ctx.drawImage(img,0,0,width,height);
        const dataUrl=canvas.toDataURL("image/jpeg",quality);
        URL.revokeObjectURL(url);
        resolve({b64:dataUrl.split(",")[1]||"",dataUrl,type:"image/jpeg"});
      }catch(e){
        URL.revokeObjectURL(url);
        // fallback to raw read
        const r=new FileReader();
        r.onload=()=>resolve({b64:(r.result.split(",")[1]||""),dataUrl:r.result,type:file.type});
        r.onerror=()=>resolve(null);
        r.readAsDataURL(file);
      }
    };
    img.onerror=()=>{URL.revokeObjectURL(url);resolve(null);};
    img.src=url;
  });
}

function AmountInput({initial,color,onSave}){
  const [val,setVal]=React.useState(initial==null?"":String(initial));
  return(
    <input
      type="number"
      inputMode="decimal"
      value={val}
      onChange={e=>setVal(e.target.value)}
      onBlur={()=>onSave(parseFloat(val)||0)}
      style={{width:80,padding:"6px 8px",border:"1px solid #D4B86A",borderRadius:3,fontSize:14,fontFamily:"'Cormorant Garamond',Georgia,serif",color,textAlign:"right",background:"#F7EDCC",outline:"none"}}
    />
  );
}

function ConflictAlert({cfls,events,onDelete,onDismiss,defaultOpen}){
  const [open,setOpen]=useState(defaultOpen||false);
  useEffect(()=>{if(defaultOpen)setOpen(true);},[defaultOpen]);
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
              {onDismiss&&<button onClick={()=>onDismiss(id1,id2)} style={{width:"100%",marginTop:8,padding:"7px",border:`1px solid ${C.borderSoft}`,borderRadius:3,background:C.card,color:C.inkLight,fontFamily:FM,fontSize:9,letterSpacing:"0.1em",textTransform:"uppercase",cursor:"pointer"}}>✓ Keep Both — Dismiss This Warning</button>}
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
      let date="",time="09:00";
      const d=dtstart.replace(/[TZ]/g,"");
      if(d.length>=8){
        date=d.slice(0,4)+"-"+d.slice(4,6)+"-"+d.slice(6,8);
        if(d.length>=12)time=d.slice(8,10)+":"+d.slice(10,12);
      }
      if(date&&date>=fmt(getToday())){
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

function OnboardingScreen({onComplete,PA_PHOTO,C,FD,FB,FM}){
  const [step,setStep]=React.useState(0);
  const [name,setName]=React.useState("");
  const [address,setAddress]=React.useState("");
  const [travelMode,setTravelMode]=React.useState("transit");
  const [notifGranted,setNotifGranted]=React.useState(false);

  const steps=[
    ()=>(<div style={{textAlign:"center",padding:"20px 0"}}>
      {PA_PHOTO&&<div style={{width:100,height:100,borderRadius:"50%",overflow:"hidden",margin:"0 auto 20px",border:`3px solid ${C.goldBorder}`,boxShadow:`0 0 30px rgba(196,153,62,0.4)`}}>
        <img src={PA_PHOTO} alt="Eleanor" style={{width:"100%",height:"100%",objectFit:"cover",objectPosition:"top"}}/>
      </div>}
      <div style={{fontFamily:FD,fontSize:28,color:C.ink,fontStyle:"italic",marginBottom:8}}>Hello, I'm Eleanor</div>
      <div style={{fontSize:14,color:C.inkLight,fontFamily:FB,lineHeight:1.7,marginBottom:24}}>Your Personal Executive Assistant. I'll help you manage your schedule, appointments, reminders and much more.</div>
      <div style={{fontSize:12,color:C.inkFaint,fontFamily:FM,lineHeight:1.6}}>Let me take a moment to get to know you.</div>
    </div>),

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
    if(step===1){const el=document.getElementById("onboard-name");if(el&&el.value)setName(el.value);}
    if(step===2){const el=document.getElementById("onboard-address");if(el&&el.value)setAddress(el.value);}
    if(step<steps.length-1){setStep(s=>s+1);}
    else{
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
  // Recompute today on every render AND tick it over at midnight so the date is never stale.
  const [todayTick,setTodayTick]=useState(()=>getToday());
  const today=todayTick;
  useEffect(()=>{
    // Re-check the date every time the app becomes visible (covers PWA left open)
    const refresh=()=>setTodayTick(getToday());
    const onVis=()=>{if(document.visibilityState==="visible")refresh();};
    document.addEventListener("visibilitychange",onVis);
    window.addEventListener("focus",refresh);
    // Also tick every 5 minutes as a safety net
    const iv=setInterval(refresh,5*60*1000);
    return()=>{document.removeEventListener("visibilitychange",onVis);window.removeEventListener("focus",refresh);clearInterval(iv);};
  },[]);
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
  const [imgEventEdit,setImgEventEdit]=useState(null);
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
  const [monthlyGoals,setMonthlyGoals]=useState(()=>{try{return JSON.parse(localStorage.getItem("papa_monthly_goals")||"null");}catch{return null;}});
  const [monthlyCheckinDismissed,setMonthlyCheckinDismissed]=useState(()=>{try{return localStorage.getItem("papa_monthly_checkin_month")||"";}catch{return "";}});
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
  const [forceConflictOpen,setForceConflictOpen]=useState(false);
  const [finances,setFinances]=useState(()=>{try{return JSON.parse(localStorage.getItem("papa_finances")||"[]");}catch{return [];}});
  const [tripAlerts,setTripAlerts]=useState([]);
  const [voiceText,setVoiceText]=useState("");
  const [wishlist,  setWishlist]  =useState(()=>{try{return JSON.parse(localStorage.getItem("papa_wishlist")||"[]");}catch{return [];}});
  const [wishlistPaste,setWishlistPaste]=useState("");
  const [finPlanText,setFinPlanText]=useState("");
  const [eventAction,setEventAction]=useState(null); // {event} for quick edit modal
  const [eventActionBusy,setEventActionBusy]=useState(false);
  const [finAction,setFinAction]=useState(null); // {item} for finance quick edit
  const [finActionBusy,setFinActionBusy]=useState(false);
  const [finEditingId,setFinEditingId]=useState(null);
  const [finEditDraft,setFinEditDraft]=useState({});
  const [finShowAdd,setFinShowAdd]=useState(false);
  const [finShowHistory,setFinShowHistory]=useState(false);
  const [todayMeal,setTodayMeal]=useState(()=>localStorage.getItem("papa_meal_"+new Date().toDateString())||"");
  const [mealDismissed,setMealDismissed]=useState(()=>localStorage.getItem("papa_meal_dismissed_"+new Date().toDateString())==="true");
  const [finPlanFile,setFinPlanFile]=useState(null);
  const [finPlanB64,setFinPlanB64]=useState(null);
  const [finPlanBusy,setFinPlanBusy]=useState(false);
  const [finPlanRes,setFinPlanRes]=useState(null);
  const [finReminderEdit,setFinReminderEdit]=useState(null);
  const [expandedPlanId,setExpandedPlanId]=useState(null);
  const [finPlanNote,setFinPlanNote]=useState("");
  const [finStepEdit,setFinStepEdit]=useState(null);
  const [finQEdit,setFinQEdit]=useState(null);
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

  useEffect(()=>{cleanupOldStorage();},[]);
  useEffect(()=>{
    try{ safeSave("papa_events",JSON.stringify(events)); }catch{}
  },[events]);

  useEffect(()=>{try{safeSave("papa_wishlist",JSON.stringify(wishlist));}catch{}},[wishlist]);
  useEffect(()=>{if(homeAddress)localStorage.setItem("papa_home_address",homeAddress);},[homeAddress]);
  useEffect(()=>{try{safeSave("papa_reminders",JSON.stringify(reminders));}catch{}},[reminders]);
  useEffect(()=>{try{localStorage.setItem("papa_birthdays",JSON.stringify(birthdays));}catch{}},[birthdays]);
  useEffect(()=>{try{safeSave("papa_finances",JSON.stringify(finances));}catch{}},[finances]);
  useEffect(()=>{if(weeklyGoals)localStorage.setItem("papa_weekly_goals",JSON.stringify(weeklyGoals));},[weeklyGoals]);
  useEffect(()=>{if(monthlyGoals)localStorage.setItem("papa_monthly_goals",JSON.stringify(monthlyGoals));},[monthlyGoals]);
  useEffect(()=>{try{const s={eventNotes,birthdayActions,dismissedCriticalIds,dismissedConflicts};Object.entries({papa_event_notes:eventNotes,papa_birthday_actions:birthdayActions,papa_dismissed_critical:dismissedCriticalIds,papa_dismissed_conflicts:dismissedConflicts}).forEach(([k,v])=>localStorage.setItem(k,JSON.stringify(v)));}catch{}},[eventNotes,birthdayActions,dismissedCriticalIds,dismissedConflicts]);
  const msgSaveTimer=React.useRef(null);
  useEffect(()=>{
    if(msgSaveTimer.current)clearTimeout(msgSaveTimer.current);
    msgSaveTimer.current=setTimeout(()=>{
      try{
        const toSave=msgs.slice(-30).map(m=>({...m,ts:m.ts?.toISOString?m.ts.toISOString():m.ts}));
        safeSave("papa_msgs",JSON.stringify(toSave));
      }catch{}
    },1000);
  },[msgs]);


  const [googleTokens, setGoogleTokens] = useState(()=>{
    try{const t=localStorage.getItem("papa_google_tokens");return t?JSON.parse(t):null;}catch{return null;}
  });
  const [googleProfile, setGoogleProfile] = useState(()=>{
    try{const p=localStorage.getItem("papa_google_profile");return p?JSON.parse(p):null;}catch{return null;}
  });
  const [googleBusy, setGoogleBusy] = useState(false);

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

  const cflsRaw=getConflicts(events);
  const cfls=cflsRaw.filter(c=>!dismissedConflicts.includes(c[0]+"_"+c[1])&&!dismissedConflicts.includes(c[1]+"_"+c[0]));
  const cflIds=new Set(cfls.flat());
  const dismissConflict=(id1,id2)=>setDismissedConflicts(d=>[...d,id1+"_"+id2]);
  const todayEvs=events.filter(e=>e.date===fmt(today)).sort((a,b)=>a.time.localeCompare(b.time));
  const weekDays=Array.from({length:7},(_,i)=>{const d=new Date(today.getTime()+i*86400000),ds=fmt(d);return{ds,label:i===0?"Today":d.toLocaleDateString("en-GB",{weekday:"short",day:"numeric",month:"short"}),evs:events.filter(e=>e.date===ds).sort((a,b)=>a.time.localeCompare(b.time))};});
  const nextHol=upcomingHols(1)[0];

  function addEvs(list,src){
    setEvents(ev=>{
      const mx=Math.max(0,...ev.map(e=>e.id));
      const existingKeys=new Set(ev.map(e=>e.title.toLowerCase().trim().slice(0,20)+"_"+e.date));
      const filtered=list.filter(e=>{
        const key=e.title.toLowerCase().trim().slice(0,20)+"_"+e.date;
        if(existingKeys.has(key))return false;
        existingKeys.add(key);
        return true;
      });
      if(!filtered.length)return ev;
      const newEvs=filtered.map((e,i)=>({...e,id:mx+i+1+(Math.floor(Math.random()*10000)),source:src}));
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

  function robustJSON(raw){
    if(!raw)return null;
    let s=raw.replace(/```json/g,"").replace(/```/g,"").trim();
    const start=s.indexOf("{");
    const end=s.lastIndexOf("}");
    if(start<0)return null;
    let sub=start>=0&&end>start?s.slice(start,end+1):s;
    try{return JSON.parse(sub);}catch{}
    sub=sub.replace(/,(\s*[}\]])/g,"$1");
    sub=sub.replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)(\s*:)/g,'$1"$2"$3');
    sub=sub.replace(/'/g,'"');
    try{return JSON.parse(sub);}catch{}
    sub=sub.replace(/,?\s*"[^"]*$/,"");
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
    let freshEvents=[];
    try{freshEvents=JSON.parse(localStorage.getItem("papa_events")||"[]");}catch{}
    const allEvents=events.length>=freshEvents.length?[...events]:[...freshEvents];
    const ctx=allEvents.length>0
      ?allEvents.sort((a,b)=>a.date.localeCompare(b.date)).map(e=>`${e.date} ${e.time||"anytime"} – ${e.title} (${e.priority})`).join("\n")
      :"No events scheduled yet.";
    console.log("Eleanor context events count:", allEvents.length, "\nFirst 3:", allEvents.slice(0,3).map(e=>e.title));
    try{
      const now=new Date();
      const dateStr=now.toLocaleDateString("en-GB",{weekday:"long",day:"numeric",month:"long",year:"numeric"});
      const timeStr=now.toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit"});
      
      const futureEvents=[...allEvents].filter(e=>e.date>=fmt(today)).sort((a,b)=>a.date.localeCompare(b.date));
      const futureCtx=futureEvents.length>0
        ?futureEvents.map((e,i)=>{
          const txt=((e.title||"")+" "+(e.notes||"")).toLowerCase();
          const isReminder=/remind|remember|bring|pack|don't forget|dont forget|take |buy |pick up|water bottle|pe kit|homework|library book/.test(txt)||e.type==="reminder"||e.priority==="low";
          const kind=isReminder?" [REMINDER - quick task, does not block the day]":(e.time&&e.time!=="09:00"?" [APPOINTMENT]":"");
          return (i+1)+". "+e.date+" ("+new Date(e.date+"T12:00:00").toLocaleDateString("en-GB",{weekday:"short"})+") "+(e.time||"all day")+" — "+e.title+kind+(e.notes?" ["+e.notes+"]":"");
        }).join("\n")
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
      const weatherCtx=weekWeather?.length>0
        ?"7-DAY WEATHER FORECAST (March, Cambridgeshire):\n"+weekWeather.map(w=>w.date+" ("+w.day+"): "+w.icon+" "+w.desc+", "+w.max+"°C/"+w.min+"°C, rain "+w.rain+"%, wind "+w.wind+"km/h").join("\n")
        :"Weather: unavailable";

      const thisMonth=new Date().getMonth();
      const thisYear=new Date().getFullYear();
      const allIncome=finances.filter(f=>f.type==="income"&&f.status!=="paid");
      const allOutgoings=finances.filter(f=>(f.type==="expense"||f.type==="payment")&&f.status!=="paid");
      const totalIncome=allIncome.reduce((s,f)=>s+(f.amount||0),0);
      const totalOutgoings=allOutgoings.reduce((s,f)=>s+(f.amount||0),0);
      const finParts=[];
      if(allIncome.length>0)finParts.push("MONEY COMING IN (income, total £"+totalIncome.toFixed(2)+"):\n"+allIncome.map(f=>"- "+f.label+": £"+(f.amount||0).toFixed(2)+(f.date?" ("+f.date+")":"")).join("\n"));
      if(allOutgoings.length>0)finParts.push("MONEY GOING OUT (outgoings, total £"+totalOutgoings.toFixed(2)+"):\n"+allOutgoings.map(f=>"- "+f.label+": £"+(f.amount||0).toFixed(2)+(f.date?" ("+f.date+")":"")).join("\n"));
      const finCtx=finParts.length>0?"SARAH'S FINANCES (from her Finances section — treat income as money IN, outgoings as money OUT, never swap them):\n"+finParts.join("\n\n"):"";

      const goalsCtx=weeklyGoals?.goals?.length>0?"THIS WEEK'S GOALS:\n"+weeklyGoals.goals.map((g,i)=>"- "+g+(weeklyGoals.done?.[i]?" [DONE]":"")).join("\n"):"";

      const pastEvs=allEvents.filter(e=>e.date<fmt(today)&&e.date>=fmt(new Date(today.getTime()-14*86400000))).sort((a,b)=>b.date.localeCompare(a.date)).slice(0,5);
      const pastCtx=pastEvs.length>0?"RECENT PAST EVENTS:\n"+pastEvs.map(e=>"- "+e.date+" "+e.title).join("\n"):"";

      const contextContent=[
        "TODAY IS "+dateStr+" at "+timeStr+". Today's day of the week is "+now.toLocaleDateString("en-GB",{weekday:"long"})+". This is absolute fact — never say it is a different day. Do not calculate the day yourself; use exactly what is stated here.",
        "NEXT 7 DAYS (use this to map any day Sarah mentions):\n"+Array.from({length:7},(_,i)=>{const d=new Date(now.getTime()+i*86400000);return (i===0?"Today = ":i===1?"Tomorrow = ":"")+d.toLocaleDateString("en-GB",{weekday:"long",day:"numeric",month:"long"});}).join("\n"),
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
        todayMeal?"TODAY'S MEAL PLAN: "+todayMeal:"",
        "ABOUT SARAH: "+userContext,
        "CONFLICTS: "+cfls.length
      ].filter(Boolean).join("\n\n");
      const patternNotes=[];
      const titleFreq={};
      const dayFreq={};
      const monthFreq={};
      allEvents.forEach(e=>{
        const key=e.title.toLowerCase().trim().slice(0,25);
        titleFreq[key]=(titleFreq[key]||[]); 
        titleFreq[key].push(e.date);
        const dow=new Date(e.date+"T12:00:00").getDay();
        const dowName=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][dow];
        dayFreq[key]=dayFreq[key]||{};
        dayFreq[key][dowName]=(dayFreq[key][dowName]||0)+1;
      });
      Object.entries(titleFreq).forEach(([title,dates])=>{
        if(dates.length<2)return;
        const days=Object.entries(dayFreq[title]||{}).filter(([,v])=>v>=2);
        if(days.length>0){
          patternNotes.push(`Recurring pattern: "${title}" appears ${dates.length} times, often on ${days[0][0]}s`);
        } else if(dates.length>=3){
          patternNotes.push(`Recurring pattern: "${title}" appears ${dates.length} times in schedule`);
        }
      });
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
      const trimmedMsgs=msgs.slice(-20);
      const nowDate=new Date();
      const nowYear=nowDate.getFullYear();
      const elSysPrompt=[
        "You are Eleanor - a warm, brilliant, deeply trusted Personal Executive Assistant to Sarah. You are not a generic AI. You know Sarah's life intimately and care about her wellbeing.",
        "SARAH: Single mother, indie app developer (Skyla, Thinko, GigNest), Rover dog-sitter, March, Cambridgeshire, UK. Children: Maleeka and Maliki (school age). Has ME/CFS. Benefits include Carer's Allowance. Dog: Ringo.",
        "TODAY IS: "+nowDate.toLocaleDateString("en-GB",{weekday:"long",day:"numeric",month:"long",year:"numeric"})+" at "+nowDate.toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit"})+". This is the definitive current date and time — NEVER use any other date as today, NEVER contradict it, and NEVER work out the day of the week yourself. The MEMORY SYNC gives you the exact day-of-week and a 7-day map — always trust those, never recalculate.",
        "DATE YEAR RULES: When Sarah mentions a date with NO year e.g. '4th July' - ALWAYS assume "+nowYear+" UNLESS that exact date has already passed this year. NEVER assume "+(nowYear+1)+" or beyond unless Sarah explicitly says so.",
        "YOUR CHARACTER: Warm and calm. Proactive - spot things before she asks. Specific - always use exact dates and times. Personal - reference her memory. Concise - one clear paragraph, one follow-up max. Never bullet points. Never ** or *. Use Sarah by name. Use Maleeka and Maliki when relevant.",
        "SCHEDULE INTELLIGENCE: Read ELEANOR MEMORY SYNC block before every answer. Sort ALL events by date - SOONEST first always. Never mention school events on weekends or bank holidays. UK school holidays 2026: Easter 3-17 April, Summer from 21 July. Cross-reference 7-DAY WEATHER FORECAST for outdoor questions.",
        "EVENT TYPES - VERY IMPORTANT: Events are labelled. [REMINDER] = a quick task (e.g. 'remind Maleeka to bring water bottle', 'pack PE kit') that takes seconds and does NOT make Sarah busy or block her day. [APPOINTMENT] = a real timed commitment that occupies a slot. When Sarah asks 'am I free' on a day, treat days with only reminders as FREE - she can still take an appointment. Only say she is NOT free if there's a genuine timed appointment that would clash. Mention what's on that day, but base the free/busy judgement on real commitments, never on reminders.",
        "YOU CAN FULLY EDIT THE SCHEDULE — delete, move, add, reschedule. You have this power through SCHEDULE_ACTION blocks. NEVER tell Sarah you cannot delete or edit events, and NEVER tell her to do it herself in her Calendar app — that is false. When she asks for a change, confirm it warmly in plain words, THEN add a SCHEDULE_ACTION block at the very END of your reply. Examples (use the exact title from the schedule): To delete - [SCHEDULE_ACTION:{action:delete,title:Garden Centre,date:2026-06-20}]. To add - [SCHEDULE_ACTION:{action:add,title:Garden Centre,date:2026-07-04,time:09:00,priority:medium}]. To move (deletes old AND adds new in one step) - [SCHEDULE_ACTION:{action:move,title:Garden Centre,fromDate:2026-06-20,toDate:2026-07-04,time:09:00}]. The block is invisible to Sarah - she only sees your plain English confirmation. To reschedule something, ALWAYS use a move action so the old one is deleted automatically. Use the current year for any date without a year.",
        "PROACTIVE TRIGGERS: Date mentioned -> check if free. Trip -> offer packing list and weather. Stressed -> suggest rest. Deadline approaching -> flag it. Scheduling clash -> warn immediately.",
        "CRITICAL: Always read ELEANOR MEMORY SYNC fully. Sort events soonest first."
      ].join("\n\n");
      const raw=await callAI({system:elSysPrompt,messages:[contextMsg,...trimmedMsgs.map(m=>({role:m.role,content:m.text})),{role:"user",content:u}]});
      // Parse and execute any SCHEDULE_ACTION commands from Eleanor
      const actionRegex=/\[SCHEDULE_ACTION:(\{.*?\})\]/g;
      let actionMatch;
      let actionExecuted=false;
      while((actionMatch=actionRegex.exec(raw))!==null){
        try{
          let action;
          try{
            action=JSON.parse(actionMatch[1]);
          }catch{
            // Fallback: parse loose format {key:value,key:value} without quotes
            const inner=actionMatch[1].replace(/^\{|\}$/g,"");
            action={};
            inner.split(",").forEach(pair=>{
              const ci=pair.indexOf(":");
              if(ci>0){
                const k=pair.slice(0,ci).trim().replace(/["']/g,"");
                const v=pair.slice(ci+1).trim().replace(/["']/g,"");
                action[k]=v;
              }
            });
          }
          if(action.action==="delete"||action.action==="move"){
            actionExecuted=true;
            // Delete matching event by title similarity and date
            setEvents(ev=>ev.filter(e=>{
              const titleMatch=e.title.toLowerCase().includes(action.title.toLowerCase().slice(0,10))||action.title.toLowerCase().includes(e.title.toLowerCase().slice(0,10));
              const dateMatch=!action.date||e.date===action.date||e.date===action.fromDate;
              return !(titleMatch&&dateMatch);
            }));
          }
          if(action.action==="add"||action.action==="move"){
            const newDate=action.toDate||action.date;
            if(newDate){
              actionExecuted=true;
              setTimeout(()=>setEvents(ev=>[...ev,{id:Date.now()+Math.random()*1000,title:action.title,date:newDate,time:action.time||"09:00",priority:action.priority||"medium",notes:action.notes||"",source:"eleanor"}]),200);
            }
          }
        }catch(e){console.warn("Action parse error:",e);}
      }
      // Show confirmation that schedule was updated
      if(actionExecuted){
        setTimeout(()=>setMsgs(m=>[...m,{role:"assistant",text:"✦ I've updated your schedule. Your briefing and calendar now reflect this change.",ts:new Date(),isSystem:true}]),400);
      }
      // Remove action blocks from displayed text
      const clean=raw.replace(/\[SCHEDULE_ACTION:\{.*?\}\]/g,"").replace(/\*\*(.*?)\*\*/g,"$1").replace(/\*(.*?)\*/g,"$1").replace(/#{1,3} /g,"").trim();
      if(!clean){
        setMsgs(m=>[...m,{role:"assistant",text:"I'm sorry, I didn't receive a response. Please try again.",ts:new Date()}]);
        setPaStatus("idle");setShowWave(false);
        return;
      }
      const finalMsg={role:"assistant",text:clean,ts:new Date()};
      setPaStatus("speaking");
      setMsgs(m=>[...m,{role:"assistant",text:clean,ts:new Date()}]);
      setPaStatus("idle");
      setShowWave(false);
      if(eleanorVoiceOn)eleanorSpeak(clean);
      setTimeout(()=>{
        const allMsgs=JSON.parse(localStorage.getItem("papa_msgs")||"[]");
        const assistantCount=allMsgs.filter(x=>x.role==="assistant").length;
        if(assistantCount>0&&assistantCount%10===0)saveSessionSummary(allMsgs);
        if(assistantCount>0&&assistantCount%3===0){
          const recent=allMsgs.slice(-6).map(x=>(x.role==="user"?"Sarah":"Eleanor")+": "+x.text).join("\n");
          callAI({system:'Extract NEW facts only. Return ONLY raw JSON: {"facts":[],"pending_tasks":[],"preferences":[]}. Max 2 each. Empty arrays if nothing new.',messages:[{role:"user",content:recent}]}).then(r=>{
            try{
              const p=JSON.parse(r.replace(/```json|```/g,"").trim());
              if(p.facts?.length||p.pending_tasks?.length||p.preferences?.length){
                const ex=JSON.parse(localStorage.getItem("papa_persistent_memory")||"{}");
                const upd={...ex,facts:[...(ex.facts||[]),...(p.facts||[])].slice(-25),pending_tasks:[...(ex.pending_tasks||[]),...(p.pending_tasks||[])].slice(-10),preferences:[...(ex.preferences||[]),...(p.preferences||[])].slice(-15)};
                safeSave("papa_persistent_memory",JSON.stringify(upd));
                setPersistentMemory(upd);
              }
            }catch{}
          }).catch(()=>{});
        }
      },500);
    }catch{setMsgs(m=>[...m,{role:"assistant",text:"I do apologise — something went wrong. Please try once more.",ts:new Date()}]);setPaStatus("idle");setShowWave(false);}
  }

  async function generateBriefing(){
    setBriefBusy(true);setBriefing(null);
    const hols=upcomingHols(6);
    const freshEvs=JSON.parse(localStorage.getItem("papa_events")||"[]");
    const allEvs=freshEvs.length>=events.length?freshEvs:events;
    const schedCtx=(()=>{const lines=[];for(let i=0;i<90;i++){const d=new Date(today.getTime()+i*86400000),ds=fmt(d);const de=allEvs.filter(e=>e.date===ds);if(de.length)lines.push(`${ds}: `+de.map(e=>`${e.time} ${e.title} (${e.priority})`).join(", "));}return lines.join("\n")||"No events scheduled.";})();

    // Finance context for briefing - same source as chat and finances section
    const brIncome=finances.filter(f=>f.type==="income"&&f.status!=="paid");
    const brOut=finances.filter(f=>(f.type==="expense"||f.type==="payment")&&f.status!=="paid");
    const brInTotal=brIncome.reduce((s,f)=>s+(f.amount||0),0);
    const brOutTotal=brOut.reduce((s,f)=>s+(f.amount||0),0);
    const brFinParts=[];
    if(brIncome.length>0)brFinParts.push("MONEY COMING IN (total GBP "+brInTotal.toFixed(2)+"): "+brIncome.map(f=>f.label+" GBP "+(f.amount||0).toFixed(2)).join(", "));
    if(brOut.length>0)brFinParts.push("MONEY GOING OUT (total GBP "+brOutTotal.toFixed(2)+"): "+brOut.map(f=>f.label+" GBP "+(f.amount||0).toFixed(2)).join(", "));
    const brFinCtx=brFinParts.length>0?"SARAH'S FINANCES (income is money IN, outgoings money OUT, never swap):\n"+brFinParts.join("\n"):"";
    const holCtx=hols.map(h=>`${h.name}: ${h.start} to ${h.end} (${daysUntil(h.start)} days away)`).join("\n");
    const hour=new Date().getHours();
    const timeOfDay=hour<12?"morning":hour<17?"afternoon":"evening";
    const dayCalendar=Array.from({length:14},(_,i)=>{
      const d=new Date(today.getTime()+i*86400000);
      return fmt(d)+" = "+d.toLocaleDateString("en-GB",{weekday:"long",day:"numeric",month:"long",year:"numeric"});
    }).join("\n");
    const wxBriefCtx=weekWeather?.length>0
      ?"7-DAY WEATHER:\n"+weekWeather.map(w=>w.date+" ("+w.day+"): "+w.icon+" "+w.desc+", "+w.max+"°/"+w.min+"°, rain "+w.rain+"%").join("\n")
      :"";
    try{const raw=await callAI({system:'You are Eleanor, Personal Executive Assistant to Sarah (single mother, March Cambridgeshire, children Maleeka and Maliki, Rover dog-sitter, app developer). Produce a briefing. Return ONLY valid JSON, no markdown: {"headline":string,"today_summary":string,"how_are_you":string,"best_day_this_week":{"date":"YYYY-MM-DD","day_name":string,"reason":string},"alerts":[{"title":string,"detail":string,"severity":"high|medium|low"}],"holiday_advice":[{"holiday":string,"date_range":string,"days_until":number,"advice":string}],"opportunities":[{"title":string,"detail":string}],"weekly_balance":{"score":number,"comment":string},"recommendations":[{"title":string,"detail":string}]}. CRITICAL: Use ONLY the exact date-to-day mapping — never calculate day names yourself. Include weather in opportunities and recommendations. best_day_this_week: consider both schedule AND weather — pick the best day for outdoor activities or scheduling. If finances are provided, you may gently mention money coming in or due out in your summary or recommendations — but treat income as money IN and outgoings as money OUT, never swap them.',messages:[{role:"user",content:"EXACT DATE-TO-DAY MAPPING:\n"+dayCalendar+"\n\n"+wxBriefCtx+"\n\nSchedule:\n"+schedCtx+"\n\nHolidays:\n"+holCtx+(brFinCtx?"\n\n"+brFinCtx:"")+(today.getDate()===1?"\n\nNOTE: Today is the 1st of the month — warmly acknowledge the new month in how_are_you and gently suggest Sarah set her goals for the month and review her financial forecast.":"")+"\n\nConflicts:"+cfls.length+"."}]});
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
Format: {"events":[{"title":string,"date":"YYYY-MM-DD","time":"HH:MM","priority":"critical|high|medium|low","notes":string}],"financials":[{"label":string,"amount":number,"type":"income|expense","date":string,"notes":string}],"destinations":[{"name":string,"dates":string}],"insights":[{"text":string}],"summary":string,"total_cost":number,"total_saving":number}
Rules: extract every date/trip/payment/cost. For financials: money Sarah RECEIVES (Rover earnings, wages, benefits, refunds, payments TO her) = type "income". Money Sarah PAYS (bills, costs, purchases) = type "expense". Rover dog-sitting payments are ALWAYS income. No time="09:00". YEAR RULE: if the text states a year (e.g. "23.6.26"=2026, "Term 2026/2027" means Sep-Dec=2026 and Jan-Aug=2027) ALWAYS use that exact year and never override it. Only if no year can be inferred, use the next upcoming occurrence from today. Keep ALL string values under 80 chars. Max 4 insights. Empty array if nothing relevant.${importContext?` IMPORTANT NOTE FROM SARAH: "${importContext}" — Use this note to correctly NAME and LABEL the appointment in the title field. If the note says what the appointment is (e.g. "this is a blood test"), use that as the event title even if the screenshot doesn't mention it. Also use it to filter and prioritise.`:""}`,
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

    async function handleImgMultiple(e){
    const files=Array.from(e.target.files);
    if(!files.length)return;
    setImgRes(null);
    // Compress each file BEFORE holding it in memory — prevents phone running out of RAM
    const results=[];
    for(const file of files){
      const c=await compressImage(file);
      if(c)results.push({file,b64:c.b64,prev:c.dataUrl,name:file.name});
    }
    if(results.length>0){
      setImgFile(results[0].file);
      setImgPrev(results[0].file.type==="application/pdf"?null:results[0].prev);
      setImgB64(results[0].b64);
      if(results.length>1){
        // Only keep b64 + name in the queue, not the full preview data, to save memory
        setMultiImgQueue(results.map(r=>({b64:r.b64,name:r.name,type:r.file.type})));
      }else{
        setMultiImgQueue([]);
      }
    }
  }

  async function handleImg(e){
    const f=e.target.files[0];
    if(!f)return;
    setImgFile(f);setImgRes(null);setImgB64(null);
    const c=await compressImage(f);
    if(c){
      setImgPrev(f.type==="application/pdf"?null:c.dataUrl);
      setImgB64(c.b64);
    }
  }

  async function parseImg(){
    if(!imgFile||imgBusy)return;
    setImgBusy(true);setImgRes(null);
    try{
      const b64=imgB64;
      if(!b64){
        setImgErr("Could not read image. Please try selecting it again.");
        setImgBusy(false);return;
      }
      const isPDF=imgFile?.type==="application/pdf";
      const mt=isPDF?"application/pdf":(imgFile?.type&&imgFile.type.startsWith("image/")?imgFile.type:"image/jpeg");

      const imgPrompt=`You are Eleanor, an expert PA with perfect vision reading a document for Sarah. Read ALL text in this ${isPDF?"PDF (it may have multiple pages — read every page)":"image"} carefully.
This may be: NHS message, Rover booking, ticket, poster, letter, invoice, payslip, bank statement, benefit letter, school calendar, or screenshot.
Extract EVERY date, event, appointment AND financial amount visible.
Return ONLY raw JSON — no markdown, no backticks:
{"events":[{"title":string,"date":"YYYY-MM-DD","time":"HH:MM","priority":"critical|high|medium|low","notes":string}],"financials":[{"label":string,"amount":number,"type":"income|expense|payment","date":string,"notes":string}],"summary":string}
Rules:
- title: clear description e.g. "NHS Therapy Appointment", "Year 5 Sports Day"
- date: convert all formats. "22 Jun 2026"="2026-06-22", "23.6.26"="2026-06-23", "23.6.2026"="2026-06-23"
- YEAR INTELLIGENCE — be smart about which year a date belongs to:
  - If the document states a year explicitly (e.g. "23.6.26", "2026/2027", "Autumn Term 2026"), ALWAYS use that exact year. Never override it.
  - A short date like "23.6.26" means 2026; "5.1.27" means 2027. The last number is the year.
  - If a section is headed "Term Dates 2026/2027" use the correct year for each month: Sep-Dec = 2026, Jan-Aug = 2027.
  - If a section is headed "2025/2026": Sep-Dec = 2025, Jan-Aug = 2026.
  - Only when NO year can be inferred at all, use ${today.getFullYear()} if the month is still ahead this year, otherwise ${today.getFullYear()+1}.
  - Today is ${fmt(today)} — use this only as a last resort, never to overwrite a year the document already gives.
- time: "13:30"="13:30", "3pm"="15:00", "9am"="09:00", "1.45pm"="13:45", unknown="09:00"
- financials: extract ANY money amounts — earnings, payments due, costs, fees, benefits
- notes: name, price, reference, location. Max 100 chars
- priority: medical=critical, bookings=high, social/school=medium
- NEVER return empty events — include any date you see
- For school calendars: extract every term date, sports day, trip, training day, holiday
${importContext?"CONTEXT FROM SARAH: "+importContext:""}`;

      const controller=new AbortController();
      const timer=setTimeout(()=>controller.abort(),45000);
      let response;
      try{
        response=await fetch("/api/ai",{
          method:"POST",
          headers:{"Content-Type":"application/json"},
          signal:controller.signal,
          body:JSON.stringify({
            model:"claude-sonnet-4-5",
            max_tokens:8000,
            system:imgPrompt,
            messages:[{role:"user",content:[
              isPDF?{type:"document",source:{type:"base64",media_type:"application/pdf",data:b64}}:{type:"image",source:{type:"base64",media_type:mt,data:b64}},
              {type:"text",text:"Extract all dates, times and events from this "+(isPDF?"PDF, reading every page":"image")+". Return as JSON."}
            ]}]
          })
        });
      }finally{clearTimeout(timer);}

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

      let parsed=null;
      const s=raw.indexOf("{"),e=raw.lastIndexOf("}");
      if(s>=0&&e>s){
        try{parsed=JSON.parse(raw.slice(s,e+1));}catch{
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
        if(parsed.financials?.length){
          setFinances(f=>[...f,...parsed.financials.map(fi=>{
            // Normalise type: saving/earning/income/received = income, everything else = expense
            const t=(fi.type||"").toLowerCase();
            const label=(fi.label||"").toLowerCase();
            const isIncome=t==="saving"||t==="income"||t==="earning"||t==="received"||/earning|income|payment received|paid to you|rover|wage|salary|benefit|allowance/.test(label);
            return {...fi,type:isIncome?"income":"expense",id:Date.now()+Math.random(),status:"pending",source:"image"};
          })]);
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

  async function readLink(){
    if(!linkUrl.trim()||linkBusy)return;
    setLinkBusy(true);setLinkRes(null);
    try{
      const proxyUrl="https://api.allorigins.win/raw?url="+encodeURIComponent(linkUrl.trim());
      const r=await fetch(proxyUrl,{signal:AbortSignal.timeout(10000)});
      const html=await r.text();
      const text=html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi,"")
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi,"")
        .replace(/<[^>]+>/g," ")
        .replace(/\s+/g," ")
        .slice(0,3000);
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

  async function analyseWishlistEvent(idx){
    const item=wishlist[idx];
    if(!item||item.analysing)return;
    setWishlist(w=>w.map((x,i)=>i===idx?{...x,analysing:true}:x));
    try{
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
      const clashEvs=events.filter(e=>e.date===item.date);
      const clashInfo=clashEvs.length?"Clashes: "+clashEvs.map(e=>e.title).join(", "):"No clashes";
      const mapsUrl=homeAddress?"https://www.google.com/maps/dir/"+encodeURIComponent(homeAddress)+"/"+encodeURIComponent(item.venue||item.title):"";
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

  async function parseEmail(){
    if(!emailText.trim()||emailBusy)return;
    setEmailBusy(true);setEmailRes(null);
    try{
      const r=await fetch("/api/ai",{method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({model:"claude-sonnet-4-5",max_tokens:2000,
          system:`You are Eleanor, a highly skilled Personal Executive Assistant reading an email for Sarah (single mother, Cambridgeshire, Rover dog-sitter, app developer, children Maleeka and Maliki).${importContext?" Context: "+importContext:""}

Extract EVERYTHING useful. Return ONLY raw JSON — no markdown:
{"events":[{"title":string,"date":"YYYY-MM-DD","time":"HH:MM","priority":"critical|high|medium|low","notes":string}],"actions":[{"text":string,"deadline":string,"priority":"critical|high|medium|low"}],"key_info":[{"label":string,"value":string}],"summary":string,"sender":string,"sender_email":string,"subject":string,"urgent":boolean,"email_type":"appointment|payment|school|medical|legal|delivery|invitation|bill|benefit|rover|reminder|newsletter|other","payment":{"amount":string,"due_date":string,"reference":string,"account":string},"reply_needed":boolean,"reply_suggestion":string,"important_numbers":[{"label":string,"value":string}],"deadlines":[{"task":string,"date":string}],"attachments_mentioned":boolean}

EXTRACTION RULES:
- summary: 1-2 sentences in plain English, no jargon
- email_type: rover = dog boarding emails, benefit = DWP/council/HMRC, school = school letters
- urgent: true if deadline within 7 days OR legal OR medical OR payment overdue OR school action required
- events: include ALL dates — appointments, deadlines, renewal dates, expiry dates
- actions: concrete things Sarah needs to DO — reply, pay, book, call, sign, send
- key_info: reference numbers, account numbers, case numbers, phone numbers, addresses
- important_numbers: any financial amounts, benefit rates, phone numbers worth saving
- payment: extract even partial amounts — "£333.20 fortnightly" counts
- reply_suggestion: warm, professional draft if reply needed. Sign off as Sarah.
- deadlines: any "by X date" or "before X" mentioned
- Today is ${fmt(today)}. Assume ${today.getFullYear()} if no year. Sort events soonest first.`,
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

  function nextOccurrence(monthDay){
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

  async function checkSchedule(){
    const todayNow=getToday();
    if((!checkerText.trim()&&!checkerFile)||checkerBusy)return;
    setCheckerBusy(true);setCheckerRes(null);
    try{
      // First check if this is a natural language question vs a date to check
      const isQuestion=/when|what|next|upcoming|any|do i have|am i free|am i busy|show me|list|find|how many|how long|how far|how soon|weeks|days|months|until|till|count|remaining|left/i.test(checkerText)&&!checkerFile;

      if(isQuestion){
        // Use same approach as Eleanor chat - full context with explicit day mapping
        const allEvsSorted=[...events].sort((a,b)=>a.date.localeCompare(b.date));

        // Build 60-day exact date mapping so Eleanor cannot get days wrong
        const dayCalendar=Array.from({length:60},(_,i)=>{
          const d=new Date(todayNow.getTime()+i*86400000);
          return fmt(d)+" = "+d.toLocaleDateString("en-GB",{weekday:"long",day:"numeric",month:"long",year:"numeric"});
        }).join("\n");

        // Full schedule - ALL events clearly labelled past and future, with type so Eleanor knows reminders vs appointments
        const fullSchedule=allEvsSorted.map((e,i)=>{
          const evDate=new Date(e.date+"T12:00:00");
          const isPast=e.date<fmt(todayNow);
          // Classify: a quick reminder (remind, remember, bring, pack, don't forget) does NOT block the day
          const txt=((e.title||"")+" "+(e.notes||"")).toLowerCase();
          const isReminder=/remind|remember|bring|pack|don't forget|dont forget|take |buy |pick up|water bottle|pe kit|homework|library book/.test(txt)||e.type==="reminder"||e.priority==="low";
          const kind=isReminder?"[REMINDER - quick task, does NOT block the day]":(e.time&&e.time!=="09:00"?"[APPOINTMENT at "+e.time+"]":"[EVENT]");
          return (i+1)+". "+e.date+" ("+evDate.toLocaleDateString("en-GB",{weekday:"long",day:"numeric",month:"long",year:"numeric"})+") "+(e.time||"all day")+" — "+e.title+" "+kind+(isPast?" [PAST]":"")+(e.notes?" ["+e.notes+"]":"");
        }).join("\n");

        const answer=await callAI({
          system:"You are Eleanor, Sarah's Personal Assistant. Answer questions about her schedule with precision and clarity.\n\nTODAY IS: "+todayNow.toLocaleDateString("en-GB",{weekday:"long",day:"numeric",month:"long",year:"numeric"})+" at "+todayNow.toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit"})+" ("+fmt(todayNow)+"). This is definitive — never use any other date as today.\n\nCRITICAL DATE RULES:\n- When Sarah mentions a date with NO year e.g. '4th July' — ALWAYS assume "+todayNow.getFullYear()+" UNLESS that exact date has already passed this year\n- NEVER assume 2027 or any year beyond "+( todayNow.getFullYear()+1)+" unless Sarah explicitly states it\n- Only use "+(todayNow.getFullYear()+1)+" if the date has genuinely already passed in "+todayNow.getFullYear()+"\n- If an event is marked [PAST] it has already happened — do not mention it as upcoming\n- Calculate weeks/days precisely from today "+fmt(todayNow)+"\n- Give one clear direct answer — no markdown, no bullet points\n\nCRITICAL — UNDERSTAND THE DIFFERENCE BETWEEN EVENT TYPES:\n- [REMINDER] = a quick task like 'remind Maleeka to bring her water bottle' or 'pack PE kit'. These take seconds and DO NOT make Sarah busy or block her day. When she asks 'am I free' you MUST treat reminder days as FREE.\n- [APPOINTMENT] = a real timed commitment (doctor, meeting, hospital) that occupies a slot. These DO make her busy at that time.\n- [EVENT] = something happening (a trip, a fayre) — note it but it may not block the whole day.\n- When Sarah asks 'am I free on Wednesday for an appointment', answer YES if she only has reminders or minor events that day. Only say she is NOT free if there is a genuine timed APPOINTMENT that would clash. Always mention what's there, but make the free/not-free judgement based on real commitments, not reminders.",
          messages:[{role:"user",content:"EXACT DATE-TO-DAY MAPPING (next 60 days — use this precisely):\n"+dayCalendar+"\n\nSARAH'S FULL SCHEDULE (note the type label on each):\n"+fullSchedule+"\n\nQuestion: "+checkerText}]
        });
        setCheckerRes({isAnswer:true,answer,question:checkerText});
        setCheckerBusy(false);return;
      }

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

      const extractR=await fetch("/api/ai",{method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({model:"claude-sonnet-4-5",max_tokens:1000,
          system:`Extract all dates from this text or document. Return ONLY raw JSON: {"dates":[{"date":"YYYY-MM-DD","label":string,"time":"HH:MM or null"}]}. Today is ${fmt(todayNow)}.`,
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

      if(extracted.dates.length===2&&datesToCheck.length>2){
        const busyDays=results.filter(r=>!r.isFree);
        const clashDays=results.filter(r=>r.hasConflict);
        const freeDays=results.filter(r=>r.isFree);
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
          system:`You are Eleanor, an expert document analyst. Read this entire PDF thoroughly. Extract every date, appointment, deadline, payment, event, action item and key piece of information. Return ONLY raw JSON, no markdown: {"events":[{"title":string,"date":"YYYY-MM-DD","time":"HH:MM","priority":"critical|high|medium|low","notes":string}],"actions":[{"text":string,"deadline":string}],"key_info":[{"label":string,"value":string}],"summary":string}. Today is ${fmt(today)}. YEAR RULE: if the document states a year (short dates like "5.1.27"=2027, or headings like "2026/2027" meaning Sep-Dec=2026 Jan-Aug=2027) ALWAYS use that exact year, never override it. Only if no year can be inferred use ${today.getFullYear()} or ${today.getFullYear()+1} whichever is future. Extract EVERYTHING you can find.`,
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

  const typewriterRef=React.useRef(null);
  function typewriterEffect(text,onComplete){
    if(typewriterRef.current)clearTimeout(typewriterRef.current);
    setIsStreaming(true);
    setStreamedText(text);
    const readTime=Math.min(Math.max(text.split(" ").length*40,800),3000);
    typewriterRef.current=setTimeout(()=>{
      setIsStreaming(false);
      setStreamedText("");
      if(onComplete)onComplete();
    },readTime);
  }

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



  // ── FINANCIAL PLANNING ──
  async function analyseFinancialPlan(){
    const text=finPlanText.trim();
    const hasFile=finPlanB64&&finPlanFile;
    if((!text&&!hasFile)||finPlanBusy)return;
    setFinPlanBusy(true);setFinPlanRes(null);
    try{
      let messages;
      if(hasFile){
        const isPDF=finPlanFile.type==="application/pdf";
        messages=[{role:"user",content:[
          {type:isPDF?"document":"image",source:{type:"base64",media_type:finPlanFile.type,data:finPlanB64}},
          {type:"text",text:"Analyse this financial document and give personalised advice."+(finPlanNote?" IMPORTANT NOTE FROM SARAH: "+finPlanNote+" Use this to correctly understand income vs outgoings and context.":"")}
        ]}];
      }else{
        messages=[{role:"user",content:"Analyse this financial plan:\n\n"+text+(finPlanNote?"\n\nIMPORTANT NOTE FROM SARAH: "+finPlanNote+"\nUse this note to correctly understand what is income vs outgoing and any context.":"")}];
      }
      const raw=await callAI({
        system:`You are Eleanor, a knowledgeable Personal Assistant helping Sarah (single mother, Cambridgeshire, children Maleeka and Maliki, ME/CFS, Rover dog-sitter, app developer) understand her finances. Today is ${fmt(today)}.
Analyse the plan and return ONLY raw JSON (no markdown, no text before or after):
{"summary":string,"positives":["string"],"considerations":["string"],"action_steps":[{"step":string,"when":string,"priority":"high|medium|low"}],"calendar_reminders":[{"title":string,"date":"YYYY-MM-DD","notes":string}],"questions_to_ask":["string"],"monthly_impact":{"amount":number,"label":string},"projected_value":string,"risk_level":"low|medium|high","eleanor_advice":string}
Rules: Keep ALL text values concise. summary=2 sentences max. positives=max 3 short strengths. considerations=max 3 short watch-outs. action_steps=max 3, each step under 100 chars. calendar_reminders=max 4 key dates (ISA year end 5 April, 6-month review, monthly investment day). questions_to_ask=max 3 short questions. eleanor_advice=2 warm sentences. Keep every string under 150 characters. Be encouraging but honest.`,
        messages,
        max_tokens:4000
      });
      let parsed=robustJSON(raw);
      // Fallback: if parsing failed, give a simple text-based result
      if(!parsed&&raw){
        parsed={
          summary:"Eleanor reviewed your plan but had trouble formatting the full breakdown. Here are her thoughts:",
          eleanor_advice:raw.replace(/[{}\[\]"]/g,"").slice(0,600),
          positives:[],considerations:[],action_steps:[],calendar_reminders:[],questions_to_ask:[]
        };
      }
      if(parsed){
        // If the plan mentions a monthly amount, offer to save it to finances
        if(parsed.monthly_impact?.amount){
          parsed._canSaveToFinances=true;
        }
        setFinPlanRes(parsed);
      }
      else setFinPlanRes({error:true});
    }catch(e){console.error(e);setFinPlanRes({error:true});}
    setFinPlanBusy(false);
  }

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
    const interval=setInterval(fetchWeekWeather,3600000);
    return()=>clearInterval(interval);
  },[]);

  useEffect(()=>{
    const goOnline=()=>setIsOnline(true);
    const goOffline=()=>setIsOnline(false);
    window.addEventListener("online",goOnline);
    window.addEventListener("offline",goOffline);
    return()=>{window.removeEventListener("online",goOnline);window.removeEventListener("offline",goOffline);};
  },[]);

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

  useEffect(()=>{
    if("serviceWorker" in navigator){
      navigator.serviceWorker.register("/sw.js").then(reg=>{
        setSwRegistered(true);
        if("periodicSync" in reg){
          reg.periodicSync.register("reminder-check",{minInterval:60*60*1000}).catch(()=>{});
        }
      }).catch(()=>{});
    }
  },[]);

  async function requestNotifications(){
    try{
      if(typeof Notification==="undefined")return false;
      const perm=await Notification.requestPermission();
      setNotifPermission(perm);
      return perm==="granted";
    }catch(e){
      console.warn("Notification permission error:",e);
      return false;
    }
  }

  function scheduleNotification(title,body,fireAt,tag){
    if(notifPermission!=="granted")return;
    const delay=new Date(fireAt).getTime()-Date.now();
    if(delay<0)return;
    if(delay<2*60*1000){
      // Use service worker for notifications on mobile (required by Android Chrome)
      if(navigator.serviceWorker?.controller){
        navigator.serviceWorker.ready.then(reg=>reg.showNotification(title,{body,icon:"/icon-192.png",tag})).catch(()=>{});
      } else if(typeof Notification!=="undefined"&&Notification.permission==="granted"){
        try{new Notification(title,{body,icon:"/icon-192.png",tag});}catch(e){console.warn("Notification failed:",e);}
      }
      return;
    }
    const scheduled=JSON.parse(localStorage.getItem("papa_scheduled_notifs")||"[]");
    scheduled.push({title,body,fireAt:new Date(fireAt).toISOString(),tag});
    safeSave("papa_scheduled_notifs",JSON.stringify(scheduled.slice(-100)));
  }

  useEffect(()=>{
    function checkNotifs(){
      if(notifPermission!=="granted")return;
      const scheduled=JSON.parse(localStorage.getItem("papa_scheduled_notifs")||"[]");
      const now=Date.now();
      const remaining=[];
      scheduled.forEach(n=>{
        if(new Date(n.fireAt).getTime()<=now){
          if(navigator.serviceWorker?.controller){
            navigator.serviceWorker.ready.then(reg=>reg.showNotification(n.title,{body:n.body,icon:"/icon-192.png",tag:n.tag})).catch(()=>{});
          } else {
            try{new Notification(n.title,{body:n.body,icon:"/icon-192.png",tag:n.tag});}catch(e){console.warn("Notification failed:",e);}
          }
        }else{
          remaining.push(n);
        }
      });
      localStorage.setItem("papa_scheduled_notifs",JSON.stringify(remaining));
    }
    checkNotifs();
    const interval=setInterval(checkNotifs,60000);
    return()=>clearInterval(interval);
  },[notifPermission]);

  useEffect(()=>{
    try{
      if(notifPermission!=="granted")return;
      reminders.forEach(r=>{
        if(!r.active)return;
        const now=new Date();
        const [h,m]=(r.time||"09:00").split(":").map(Number);
        const fireToday=new Date(now.getFullYear(),now.getMonth(),now.getDate(),h,m,0);
        const dayIdx=now.getDay().toString();
        if((r.days||[]).includes(dayIdx)&&fireToday>now){
          scheduleNotification("⏰ "+r.text,r.text+" — Eleanor reminder",fireToday,"reminder-"+r.id);
        }
      });
    }catch(e){console.warn("Reminder scheduling error:",e);}
  },[reminders,notifPermission]);


  useEffect(()=>{
    const alerts=[];
    events.forEach(e=>{
      const daysUntil=Math.ceil((new Date(e.date+"T12:00:00")-new Date())/86400000);
      const isTrip=e.source==="link"||e.source==="import"||["holiday","trip","stay","break","visiting","clacton","haven","fuerteventura","parkdean","coach","museum"].some(k=>e.title.toLowerCase().includes(k));
      if(isTrip&&(daysUntil===3||daysUntil===1)&&!localStorage.getItem("papa_trip_alert_"+e.id+"_"+daysUntil)){
        localStorage.setItem("papa_trip_alert_"+e.id+"_"+daysUntil,"done");
        alerts.push({event:e,daysUntil});
      }
    });
    if(alerts.length>0)setTripAlerts(alerts);
  },[events]);

  function checkConflicts(newEvent){
    const clashes=events.filter(e=>e.date===newEvent.date&&e.id!==newEvent.id);
    const dayBefore=fmt(new Date(new Date(newEvent.date+"T12:00:00").getTime()-86400000));
    const dayAfter=fmt(new Date(new Date(newEvent.date+"T12:00:00").getTime()+86400000));
    const nearby=events.filter(e=>e.date===dayBefore||e.date===dayAfter);
    if(clashes.length>0||nearby.length>0){
      setConflictWarning({event:newEvent,clashes,nearby,dayBefore,dayAfter});
    }
  }

  async function saveSessionSummary(messages){
    if(messages.length<3)return;
    try{
      const transcript=messages.slice(-20).map(m=>(m.role==="user"?"Sarah":"Eleanor")+": "+m.text).join("\n");
      const summary=await callAI({
        system:"Summarise this conversation in 3-4 sentences capturing: key topics discussed, any decisions made, dates mentioned, tasks Eleanor was asked to do, and anything unresolved. Be specific with dates and names.",
        messages:[{role:"user",content:"Summarise this conversation:\n\n"+transcript}]
      });
      const prevSessions=JSON.parse(localStorage.getItem("papa_session_history")||"[]");
      const currentSession=localStorage.getItem("papa_last_session")||"";
      if(currentSession){
        const dated={text:currentSession,date:new Date().toLocaleDateString("en-GB"),week:fmt(today)};
        const updated=[dated,...prevSessions].slice(0,4); // keep last 4 sessions
        localStorage.setItem("papa_session_history",JSON.stringify(updated));
      }
      localStorage.setItem("papa_last_session",summary);
      setSessionSummary(summary);
      const memR=await callAI({
        system:"You are Eleanor's memory system. Extract important facts from this conversation to remember about Sarah. Return ONLY raw JSON: {\"facts\":[\"fact1\"],\"pending_tasks\":[\"task1\"],\"emotional_notes\":[\"note1\"],\"preferences\":[\"pref1\"]}. facts: specific things to remember (names, dates, preferences, health info). pending_tasks: things Eleanor said she would do or follow up on. emotional_notes: if Sarah seemed stressed, tired, happy, worried. preferences: how Sarah likes things done. Only NEW information. Max 5 per category.",
        messages:[{role:"user",content:transcript}]
      });
      try{
        const parsed=JSON.parse(memR.replace(/```json|```/g,"").trim());
        const existing=JSON.parse(localStorage.getItem("papa_persistent_memory")||"{}");
        const updated={
          ...existing,
          facts:[...(existing.facts||[]),...(parsed.facts||[])].slice(-25),
          pending_tasks:[...(existing.pending_tasks||[]),...(parsed.pending_tasks||[])].slice(-10),
          emotional_notes:[...(parsed.emotional_notes||[])].slice(-5),
          preferences:[...(existing.preferences||[]),...(parsed.preferences||[])].slice(-15),
        };
        safeSave("papa_persistent_memory",JSON.stringify(updated));
        setPersistentMemory(updated);
      }catch{}
    }catch(e){console.warn("Memory save failed:",e);}
  }

  async function eleanorSpeak(text){
    if(!eleanorVoiceOn)return;
    stopSpeaking();

    if(premiumVoice){
      try{
        setEleanorSpeaking(true);
        const r=await fetch("/api/tts",{
          method:"POST",
          headers:{"Content-Type":"application/json"},
          body:JSON.stringify({text,apiKey:elevenLabsKey})
        });
        if(r.ok){
          const blob=await r.blob();
          const url=URL.createObjectURL(blob);
          const audio=new Audio(url);
          audioRef.current=audio;
          audio.onended=()=>{setEleanorSpeaking(false);URL.revokeObjectURL(url);};
          audio.onerror=()=>{setEleanorSpeaking(false);URL.revokeObjectURL(url);};
          audio.play();
          return;
        }
      }catch(e){console.warn("ElevenLabs failed:",e);}
      setEleanorSpeaking(false);
    }

    if(!window.speechSynthesis)return;
    function doSpeak(){
      const voices=window.speechSynthesis.getVoices();
      const utterance=new SpeechSynthesisUtterance(text);
      const preferred=voices.find(v=>v.lang==="en-GB"&&v.name.toLowerCase().includes("female"))
        ||voices.find(v=>v.lang==="en-GB")
        ||voices.find(v=>v.lang.startsWith("en")&&v.name.toLowerCase().includes("female"))
        ||voices.find(v=>v.lang.startsWith("en"))
        ||voices[0];
      if(preferred)utterance.voice=preferred;
      utterance.rate=0.92;utterance.pitch=1.05;utterance.volume=1;
      utterance.onstart=()=>setEleanorSpeaking(true);
      utterance.onend=()=>setEleanorSpeaking(false);
      utterance.onerror=()=>setEleanorSpeaking(false);
      window.speechSynthesis.speak(utterance);
    }
    const voices=window.speechSynthesis.getVoices();
    if(voices.length>0)doSpeak();
    else window.speechSynthesis.onvoiceschanged=()=>{window.speechSynthesis.onvoiceschanged=null;doSpeak();};
  }

  function stopSpeaking(){
    if(audioRef.current){audioRef.current.pause();audioRef.current=null;}
    window.speechSynthesis?.cancel();
    setEleanorSpeaking(false);
  }

  function startVoice(onResult){
    const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
    if(!SR){alert("Voice input is not supported on this browser. Please use Chrome.");return;}
    const recognition=new SR();
    recognition.lang="en-GB";
    recognition.continuous=false;
    recognition.interimResults=false;
    recognition.onstart=()=>setVoiceListening(true);
    recognition.onend=()=>setVoiceListening(false);
    recognition.onresult=e=>{
      const text=e.results[0][0].transcript;
      setVoiceText(text);
      if(onResult)onResult(text);
    };
    recognition.onerror=()=>setVoiceListening(false);
    recognition.start();
  }

  async function getAppointmentBriefing(e,setBriefFn,setBusyFn){
    setBusyFn(true);
    try{
      const wx=await fetchEventWeather(e.date);
      const wxInfo=wx?`${wx.icon} ${wx.desc}, ${wx.max}°C, rain ${wx.rain}%`:"unknown";
      const r=await fetch("/api/ai",{method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({model:"claude-sonnet-4-5",max_tokens:500,
          system:"You are Eleanor, a highly professional PA preparing your client for an upcoming appointment. Provide a warm, practical pre-appointment briefing covering: 1) What to bring or prepare, 2) What to expect, 3) Useful questions to ask, 4) Travel/timing advice based on weather and transport mode. Keep it concise — 3-4 short practical points. Write in flowing prose, not bullet points.",
          messages:[{role:"user",content:`Appointment: ${e.title}
Date: ${e.date} at ${e.time}
Notes/Location: ${e.notes||"not specified"}
Weather: ${wxInfo}
Travel mode: ${travelMode||"public transport"}
Home: ${homeAddress||"March, Cambridgeshire"}`}]
        })
      });
      const d=await r.json();
      setBriefFn(d.content?.find(b=>b.type==="text")?.text||"");
    }catch(e){setBriefFn("Could not prepare briefing. Please try again.");}
    setBusyFn(false);
  }

  function transportLinks(e){
    const dest=e.notes||e.title;
    const origin=homeAddress||"March, Cambridgeshire";
    const date=e.date;
    const time=e.time||"09:00";
    return {
      google: "https://www.google.com/maps/dir/?api=1&origin="+encodeURIComponent(origin)+"&destination="+encodeURIComponent(dest)+"&travelmode=transit",
      nationalRail: "https://www.nationalrail.co.uk/journey-planner/?origin=&destination=&leavingType=departing&leavingDate="+date.replace(/-/g,"")+"&leavingHour="+time.slice(0,2)+"&leavingMin="+time.slice(3,5)+"&adults=1",
      trainline: "https://www.thetrainline.com/book/results?origin="+encodeURIComponent(origin)+"&destination="+encodeURIComponent(dest)+"&outwardDate="+date+"T"+time+":00&outwardDateType=departAfter&passengers[]=adult",
      bustimes: "https://bustimes.org/journeys?from="+encodeURIComponent(origin)+"&to="+encodeURIComponent(dest),
      traveline: "https://www.travelineeastanglia.co.uk/ea/XSLT_TRIP_REQUEST2?language=en&type_origin=any&name_origin="+encodeURIComponent(origin)+"&type_destination=any&name_destination="+encodeURIComponent(dest)+"&itdDateYear="+date.slice(0,4)+"&itdDateMonth="+date.slice(5,7)+"&itdDateDay="+date.slice(8,10)+"&itdTimeHour="+time.slice(0,2)+"&itdTimeMinute="+time.slice(3,5)
    };
  }

  async function fetchEventWeather(date){
    if(eventWeather[date])return eventWeather[date];
    try{
      const r=await fetch(`https://api.open-meteo.com/v1/forecast?latitude=52.55&longitude=0.09&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_probability_max&hourly=temperature_2m,weathercode&timezone=Europe/London&start_date=${date}&end_date=${date}`);
      const d=await r.json();
      if(!d.daily)return null;
      const code=d.daily.weathercode[0];
      const max=Math.round(d.daily.temperature_2m_max[0]);
      const min=Math.round(d.daily.temperature_2m_min[0]);
      const rain=d.daily.precipitation_probability_max[0];
      const icon=code<=1?"☀️":code<=3?"⛅":code<=48?"🌫":code<=67?"🌧":code<=77?"❄️":code<=82?"🌦":"⛈";
      const desc=code<=1?"Sunny":code<=3?"Partly cloudy":code<=48?"Foggy":code<=67?"Rain":code<=77?"Snow":code<=82?"Showers":"Thunderstorm";
      const w={icon,desc,max,min,rain,date};
      setEventWeather(prev=>({...prev,[date]:w}));
      return w;
    }catch{return null;}
  }

  function travelLink(e,mode){
    if(!homeAddress)return null;
    const dest=e.notes||e.title;
    const m=mode||travelMode||"transit";
    return "https://www.google.com/maps/dir/?api=1&origin="+encodeURIComponent(homeAddress)+"&destination="+encodeURIComponent(dest)+"&travelmode="+m;
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
    const wx=eventWx[e.id]||null;
    const expanded=eventExpanded[e.id]||false;
    const brief=eventBriefs[e.id]||null;
    const briefBusy=eventBriefBusy[e.id]||false;

    if(e.date>=fmt(today)&&!eventWx[e.id]&&!eventWx["loading_"+e.id]){
      setEventWx(w=>({...w,["loading_"+e.id]:true}));
      fetchEventWeather(e.date).then(w=>{if(w)setEventWx(prev=>({...prev,[e.id]:w}));});
    }

    const link=travelLink(e);
    const modeLabel={driving:"driving",walking:"walking",transit:"public transport",bicycling:"cycling"}[travelMode]||"public transport";

    function getEleanorBrief(){
      if(brief||briefBusy)return;
      setEventBriefBusy(b=>({...b,[e.id]:true}));
      getAppointmentBriefing(e,
        txt=>setEventBriefs(b=>({...b,[e.id]:txt})),
        busy=>setEventBriefBusy(b=>({...b,[e.id]:busy}))
      );
    }

    return(<div className="ev-card" style={{animationDelay:`${delay}ms`,background:C.card,marginBottom:10,borderRadius:6,border:`1px solid ${isC?C.crimson:C.borderSoft}`,borderLeft:`4px solid ${isC?C.crimson:C.goldBorder}`,padding:"15px 17px",position:"relative",boxShadow:`0 2px 10px ${C.shadow}`,transition:"all 0.2s"}}>
      <button onClick={()=>del(e.id)} style={{position:"absolute",top:11,right:13,background:"none",border:"none",cursor:"pointer",color:C.inkFaint,fontSize:12,fontFamily:FM}}>✕</button>
      <div style={{display:"flex",gap:13,alignItems:"flex-start"}}>
        <div style={{textAlign:"center",minWidth:38,paddingTop:2}}>
          <div style={{fontSize:19,fontFamily:FD,color:C.gold,lineHeight:1,fontWeight:300}}>{e.time?.slice(0,2)||"—"}</div>
          <div style={{fontSize:10,color:C.inkFaint,fontFamily:FM}}>{e.time?.slice(3)||"00"}</div>
          {wx&&<div style={{fontSize:16,marginTop:4}}>{wx.icon}</div>}
        </div>
        <div style={{flex:1}}>
          <div style={{fontSize:15,fontFamily:FD,color:C.ink,letterSpacing:"0.02em",marginBottom:2,fontWeight:500,paddingRight:20,lineHeight:1.3}}>{e.title}</div>
          {e.notes&&<div style={{fontSize:12,color:C.inkLight,fontFamily:FB,marginBottom:5,lineHeight:1.5}}>{e.notes}</div>}
          {wx&&<div style={{fontSize:11,color:C.inkMid,fontFamily:FB,marginBottom:5}}>{wx.desc} · {wx.max}°/{wx.min}°{wx.rain>30?" · 💧"+wx.rain+"% rain":""}</div>}
          {/* Event note */}
          {eventNotes[e.id]&&editingEventId!==e.id&&<div style={{background:C.emeraldBg,borderRadius:3,padding:"7px 10px",marginBottom:6,fontSize:12,color:C.emerald,fontFamily:FB,lineHeight:1.5,borderLeft:`3px solid ${C.emerald}`,display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8}}>
            <span>📝 {eventNotes[e.id]}</span>
            <button onClick={()=>setEditingEventId(e.id)} style={{background:"none",border:"none",cursor:"pointer",color:C.emerald,fontSize:10,fontFamily:FM,flexShrink:0}}>edit</button>
          </div>}
          {editingEventId===e.id&&<div style={{marginBottom:8}}>
            <input
              defaultValue={eventNotes[e.id]||""}
              placeholder="Add a note e.g. 'Already paid' or 'Remind me 2 days before'"
              style={{width:"100%",padding:"8px 10px",border:`1px solid ${C.goldBorder}`,borderRadius:3,fontSize:12,fontFamily:FB,background:C.goldPale,color:C.ink,outline:"none",boxSizing:"border-box",marginBottom:6}}
              autoFocus
              onBlur={e2=>{setEventNotes(n=>({...n,[e.id]:e2.target.value}));setEditingEventId(null);}}
              onKeyDown={e2=>{if(e2.key==="Enter"){setEventNotes(n=>({...n,[e.id]:e2.target.value}));setEditingEventId(null);}}}
            />
            <button onClick={()=>{setEventNotes(n=>{const x={...n};delete x[e.id];return x;});setEditingEventId(null);}} style={{fontSize:9,color:C.crimson,fontFamily:FM,background:"none",border:"none",cursor:"pointer",letterSpacing:"0.1em",textTransform:"uppercase"}}>Clear note</button>
          </div>}
          {!eventNotes[e.id]&&editingEventId!==e.id&&<button onClick={()=>setEditingEventId(e.id)} style={{fontSize:9,color:C.inkFaint,fontFamily:FM,background:"none",border:`1px dashed ${C.borderSoft}`,borderRadius:3,padding:"3px 10px",cursor:"pointer",marginBottom:6,letterSpacing:"0.1em",textTransform:"uppercase"}}>+ Add note</button>}
          {brief&&<div style={{background:C.goldPale,borderRadius:3,padding:"8px 10px",marginBottom:8,fontSize:12,color:C.inkMid,fontFamily:FB,lineHeight:1.6,fontStyle:"italic",borderLeft:`3px solid ${C.goldBorder}`}}>✦ {brief}</div>}
          {briefBusy&&<div style={{fontSize:11,color:C.gold,fontFamily:FM,marginBottom:8}} className="shimmer">Eleanor is preparing your briefing…</div>}
          <div style={{display:"flex",gap:6,flexWrap:"wrap",alignItems:"center"}}>
            <span style={chip(p.color,p.bg)}>{p.glyph} {p.label}</span>
            {isC&&<span style={chip(C.crimson,C.crimsonBg)}>⚠ Conflict</span>}
            <button onClick={getEleanorBrief} disabled={briefBusy||!!brief} style={{fontSize:9,padding:"3px 10px",borderRadius:2,background:brief?C.goldPale:C.card,color:C.gold,letterSpacing:"0.12em",textTransform:"uppercase",fontFamily:FM,border:`1px solid ${C.goldBorder}`,cursor:"pointer"}}>✦ Brief Me</button>
            <button onClick={()=>shareEvent(e)} style={{fontSize:9,padding:"3px 10px",borderRadius:2,background:C.card,color:C.inkFaint,letterSpacing:"0.12em",textTransform:"uppercase",fontFamily:FM,border:`1px solid ${C.borderSoft}`,cursor:"pointer"}}>📤 Share</button>
            {homeAddress&&!travelMode&&<button onClick={()=>setShowTravelModal(true)} style={{fontSize:9,padding:"3px 10px",borderRadius:2,background:C.emeraldBg,color:C.emerald,letterSpacing:"0.12em",textTransform:"uppercase",fontFamily:FM,border:`1px solid ${C.emerald}40`,cursor:"pointer"}}>🗺 Travel</button>}
            {link&&travelMode&&travelMode!=="transit"&&<a href={link} target="_blank" rel="noreferrer" style={{fontSize:9,padding:"3px 10px",borderRadius:2,background:C.emeraldBg,color:C.emerald,letterSpacing:"0.12em",textTransform:"uppercase",fontFamily:FM,border:`1px solid ${C.emerald}40`,textDecoration:"none"}}>🗺 {modeLabel}</a>}
            {travelMode==="transit"&&homeAddress&&<button onClick={()=>setEventExpanded(x=>({...x,[e.id]:!expanded}))} style={{fontSize:9,padding:"3px 10px",borderRadius:2,background:C.emeraldBg,color:C.emerald,letterSpacing:"0.12em",textTransform:"uppercase",fontFamily:FM,border:`1px solid ${C.emerald}40`,cursor:"pointer"}}>🚌 Transport {expanded?"▲":"▼"}</button>}
          </div>
          {expanded&&travelMode==="transit"&&homeAddress&&(()=>{
            const t=transportLinks(e);
            return(<div style={{marginTop:10,padding:"12px",background:C.parchment,borderRadius:4,border:`1px solid ${C.borderSoft}`}}>
              <div style={{fontSize:9,color:C.gold,fontFamily:FM,letterSpacing:"0.2em",textTransform:"uppercase",marginBottom:10}}>Check Journey Times</div>
              <div style={{display:"flex",flexDirection:"column",gap:6}}>
                {[{href:t.google,icon:"🗺",label:"Google Maps",sub:"Live directions & times"},{href:t.nationalRail,icon:"🚂",label:"National Rail",sub:"Train times & tickets"},{href:t.trainline,icon:"🎫",label:"Trainline",sub:"Compare & book tickets"},{href:t.bustimes,icon:"🚌",label:"Bus Times",sub:"Live bus times near you"},{href:t.traveline,icon:"🗓",label:"Traveline East Anglia",sub:"Local bus & coach planner"}].map((l,i)=>(
                  <a key={i} href={l.href} target="_blank" rel="noreferrer" style={{display:"flex",alignItems:"center",gap:10,padding:"9px 12px",background:C.card,borderRadius:3,border:`1px solid ${C.borderSoft}`,textDecoration:"none"}}>
                    <span style={{fontSize:16}}>{l.icon}</span>
                    <div><div style={{fontSize:13,fontFamily:FD,color:C.ink}}>{l.label}</div><div style={{fontSize:10,color:C.inkFaint,fontFamily:FB}}>{l.sub}</div></div>
                  </a>
                ))}
              </div>
            </div>);
          })()}
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
              <div key={f.id||i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"11px 13px",background:C.card,border:`1px solid ${C.borderSoft}`,borderRadius:4,marginBottom:6,gap:10}}>
                <div style={{flex:1}}>
                  <div style={{fontSize:13,fontFamily:FD,color:C.ink}}>{f.label}</div>
                  {f.date&&<div style={{fontSize:10,color:C.inkFaint,fontFamily:FM,marginTop:1}}>{f.date}</div>}
                </div>
                <div style={{display:"flex",alignItems:"center",gap:4}}>
                  <span style={{fontSize:13,color:f.type==="saving"?C.emerald:f.type==="payment"?C.gold:C.crimson,fontFamily:FD}}>£</span>
                  <AmountInput
                    initial={f.amount||0}
                    color={f.type==="saving"?C.emerald:f.type==="payment"?C.gold:C.crimson}
                    onSave={amt=>{const updated=[...editedFinancials];updated[i]={...f,amount:amt};setEditedFinancials(updated);}}
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
      {installed?(null
      ):installPrompt?(
        <button onClick={installApp} style={{width:"100%",padding:"9px",borderRadius:4,border:`1px solid ${C.borderSoft}`,background:C.card,color:C.inkFaint,fontFamily:FM,fontSize:9,letterSpacing:"0.14em",textTransform:"uppercase",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:6,marginBottom:10}}>
          <span>📲</span><span>Install App</span>
        </button>
      ):(
        <div style={{background:C.card,borderRadius:4,padding:"7px 12px",marginBottom:10,border:`1px solid ${C.borderSoft}`,display:"flex",alignItems:"center",gap:6}}>
          <span style={{fontSize:11}}>📲</span>
          <div style={{fontSize:10,color:C.inkFaint,fontFamily:FB}}>Install: tap browser menu → Add to Home Screen</div>
        </div>
      )}

      {/* Offline banner */}
      {!isOnline&&<div style={{background:C.crimsonBg,border:`1px solid ${C.crimson}`,borderRadius:4,padding:"10px 14px",marginBottom:10,display:"flex",gap:8,alignItems:"center"}}>
        <span style={{fontSize:16}}>📵</span>
        <div>
          <div style={{fontSize:13,fontFamily:FD,color:C.crimson}}>You're offline</div>
          <div style={{fontSize:11,color:C.inkMid,fontFamily:FB}}>Your schedule is still available. Eleanor needs internet to respond.</div>
        </div>
      </div>}

      {/* API error banner */}
      {apiError&&<div style={{background:C.goldPale,border:`1px solid ${C.goldBorder}`,borderRadius:4,padding:"10px 14px",marginBottom:10,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div style={{fontSize:12,color:C.inkMid,fontFamily:FB}}>{apiError}</div>
        <button onClick={()=>setApiError(null)} style={{background:"none",border:"none",color:C.inkFaint,cursor:"pointer",fontSize:14}}>✕</button>
      </div>}

      {/* Search overlay */}
      {showSearch&&<div style={{background:C.card,border:`1px solid ${C.borderSoft}`,borderRadius:6,padding:"12px",marginBottom:10,boxShadow:`0 4px 16px ${C.shadow}`}}>
        <input
          id="search-input"
          style={{...inp,marginBottom:searchQuery?10:0}}
          placeholder="Search events, appointments, notes..."
          autoFocus
          onChange={e=>setSearchQuery(e.target.value)}
        />
        {searchQuery&&(()=>{
          const q=searchQuery.toLowerCase();
          const results=events.filter(e=>e.title.toLowerCase().includes(q)||e.notes?.toLowerCase().includes(q)||e.date.includes(q)).sort((a,b)=>a.date.localeCompare(b.date)).slice(0,10);
          return results.length>0?(
            <div>{results.map((e,i)=>{const p=PM[e.priority]||PM.medium;return(
              <div key={i} onClick={()=>{setShowSearch(false);setSearchQuery("");setCriticalOnly(false);setView("calendar");setSelectedDay(e.date);}} style={{padding:"9px 12px",background:C.parchment,borderRadius:3,marginBottom:4,cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div>
                  <div style={{fontSize:13,fontFamily:FD,color:C.ink}}>{e.title}</div>
                  <div style={{fontSize:10,color:C.inkFaint,fontFamily:FM}}>{e.date} {e.time&&"· "+e.time}</div>
                </div>
                <span style={chip(p.color,p.bg)}>{p.glyph}</span>
              </div>
            );})}</div>
          ):<div style={{fontSize:12,color:C.inkFaint,fontFamily:FB,textAlign:"center",padding:"8px 0"}}>No events found for "{searchQuery}"</div>;
        })()}
      </div>}

      {/* Greeting + compact weather */}
      {(()=>{
        const hour=new Date().getHours();
        const tod=hour<12?"Good morning":hour<17?"Good afternoon":"Good evening";
        const userName=localStorage.getItem("papa_user_name")||"Sarah";
        return(
          <div style={{textAlign:"center",marginBottom:14,paddingTop:4}}>
            <div style={{display:"flex",justifyContent:"center",alignItems:"center",gap:10}}>
              <div style={{fontFamily:FD,fontSize:24,color:C.ink,fontStyle:"italic"}}>{tod}, <span style={{color:C.gold}}>{userName}</span>.</div>
              {weekWeather?.[0]&&<span style={{fontSize:26}}>{weekWeather[0].icon}</span>}
            </div>
            <div style={{fontSize:11,color:C.inkFaint,fontFamily:FB,marginTop:3}}>{new Date().toLocaleDateString("en-GB",{weekday:"long",day:"numeric",month:"long"})}{weekWeather?.[0]?` · ${weekWeather[0].max}° ${weekWeather[0].desc}`:""}</div>
          </div>
        );
      })()}

      {/* ══ HERO 0 — SCHEDULE CHECKER ══ */}
      <div style={{background:C.card,border:`1px solid ${C.borderSoft}`,borderRadius:8,padding:"18px 18px 16px",marginBottom:10,boxShadow:`0 4px 20px ${C.shadow}`}}>
        <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:12}}>
          {PA_PHOTO&&<div style={{width:36,height:36,borderRadius:"50%",overflow:"hidden",flexShrink:0,border:`1.5px solid ${C.goldBorder}`}}><img src={PA_PHOTO} alt="Eleanor" style={{width:"100%",height:"100%",objectFit:"cover",objectPosition:"top"}}/></div>}
          <div>
            <div style={{fontFamily:FD,fontSize:17,color:C.ink,fontStyle:"italic",lineHeight:1}}>Am I free?</div>
            <div style={{fontSize:10,color:C.inkFaint,fontFamily:FM,letterSpacing:"0.12em",textTransform:"uppercase",marginTop:2}}>Schedule Checker</div>
          </div>
        </div>
        <textarea
          id="checker-textarea"
          key="checker-textarea-stable"
          style={{width:"100%",padding:"11px 14px",borderRadius:4,border:`1px solid ${C.border}`,fontSize:13,background:C.parchment,color:C.ink,fontFamily:FB,outline:"none",resize:"none",minHeight:70,boxSizing:"border-box",marginBottom:8,lineHeight:1.6}}
          placeholder={"Ask anything or paste dates to check...\ne.g. 'When is my next holiday?' · 'Am I free 20th July?' · 'What's on this week?'"}
        />
        <div style={{display:"flex",gap:8,marginBottom:checkerFile?8:0}}>
          <button style={{flex:1,padding:"11px",borderRadius:4,border:"none",background:`linear-gradient(135deg,${C.ink},${C.inkMid})`,color:C.goldLight,fontFamily:FM,fontSize:10,letterSpacing:"0.16em",textTransform:"uppercase",cursor:"pointer"}} onClick={()=>{const el=document.getElementById("checker-textarea");if(el)setCheckerText(el.value);checkSchedule();}} disabled={checkerBusy}>
            {checkerBusy?"Checking…":"✦ Check My Schedule"}
          </button>
          <label style={{padding:"11px 14px",borderRadius:4,border:`1px solid ${C.borderSoft}`,background:C.card,color:checkerFile?C.emerald:C.inkFaint,fontFamily:FM,fontSize:11,cursor:"pointer",display:"flex",alignItems:"center",whiteSpace:"nowrap"}}>
            📎 {checkerFile?checkerFile.name.slice(0,12)+"…":"Upload"}
            <input type="file" accept="image/*,application/pdf,.pdf" onChange={e=>{if(e.target.files[0]){setCheckerFile(e.target.files[0]);setCheckerText("");}}} style={{display:"none"}}/>
          </label>
        </div>
        {checkerFile&&<button onClick={()=>setCheckerFile(null)} style={{background:"none",border:"none",color:C.inkFaint,fontFamily:FM,fontSize:10,cursor:"pointer",letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:4}}>✕ Remove file</button>}

        {/* Results */}
        {checkerRes?.isAnswer&&<div style={{background:C.card,border:`1px solid ${C.goldBorder}`,borderLeft:`4px solid ${C.gold}`,borderRadius:6,padding:"16px",marginTop:12}}>
          <div style={{fontSize:10,color:C.gold,fontFamily:FM,letterSpacing:"0.2em",textTransform:"uppercase",marginBottom:8}}>✦ Eleanor</div>
          <div style={{fontSize:14,color:C.ink,fontFamily:FB,lineHeight:1.7}}>{checkerRes.answer}</div>
          <button onClick={()=>{setCheckerRes(null);setCheckerText("");const el=document.getElementById("checker-textarea");if(el)el.value="";}} style={{marginTop:10,background:"none",border:"none",color:C.inkFaint,fontFamily:FM,fontSize:9,cursor:"pointer",letterSpacing:"0.1em",textTransform:"uppercase"}}>Clear</button>
        </div>}
        {checkerRes?.error&&<div style={{border:`1px solid ${C.crimson}`,background:C.crimsonBg,padding:"11px 14px",fontSize:13,color:C.crimson,fontFamily:FB,borderRadius:4,marginTop:10}}>{checkerRes.msg}</div>}
        {/* Range result */}
        {checkerRes?.isRange&&<div style={{marginTop:12}}>
          <div style={{background:checkerRes.busyDays.length>0?C.crimsonBg:C.emeraldBg,border:`1px solid ${checkerRes.busyDays.length>0?C.crimson:C.emerald}30`,borderLeft:`4px solid ${checkerRes.busyDays.length>0?C.crimson:C.emerald}`,borderRadius:4,padding:"14px 16px",marginBottom:10}}>
            <div style={{fontFamily:FD,fontSize:16,color:C.ink,marginBottom:4}}>
              {checkerRes.rangeStart} → {checkerRes.rangeEnd} ({checkerRes.totalDays} days)
            </div>
            {checkerRes.busyDays.length===0
              ?<div style={{fontSize:14,color:C.emerald,fontFamily:FD}}>✓ You're completely free for this entire period</div>
              :<div style={{fontSize:14,color:C.crimson,fontFamily:FD}}>⚠ You have {checkerRes.busyDays.length} busy day{checkerRes.busyDays.length>1?"s":""} in this period</div>
            }
            <div style={{fontSize:11,color:C.inkFaint,fontFamily:FB,marginTop:4}}>{checkerRes.freeDays} free days · {checkerRes.busyDays.length} busy days</div>
          </div>
          {checkerRes.busyDays.length>0&&<div>
            <div style={{fontSize:9,color:C.crimson,fontFamily:FM,letterSpacing:"0.15em",textTransform:"uppercase",marginBottom:8}}>Busy Days in This Period</div>
            {checkerRes.busyDays.map((r,i)=>(
              <div key={i} style={{background:C.crimsonBg,border:`1px solid ${C.crimson}20`,borderLeft:`3px solid ${C.crimson}`,borderRadius:3,padding:"10px 12px",marginBottom:6}}>
                <div style={{display:"flex",justifyContent:"space-between"}}>
                  <div style={{fontFamily:FD,fontSize:13,color:C.ink}}>{r.date}</div>
                  <div style={{fontSize:11,color:C.crimson,fontFamily:FM}}>{r.sameDay.length} appointment{r.sameDay.length>1?"s":""}</div>
                </div>
                {r.sameDay.map((e,j)=><div key={j} style={{fontSize:11,color:C.inkMid,fontFamily:FB,marginTop:3}}>{e.time} — {e.title}</div>)}
              </div>
            ))}
          </div>}
          {checkerRes.alternatives?.length>0&&<div style={{marginTop:10}}>
            <div style={{fontSize:9,color:C.emerald,fontFamily:FM,letterSpacing:"0.15em",textTransform:"uppercase",marginBottom:8}}>✓ Free Alternative Dates</div>
            {checkerRes.alternatives.map((a,i)=>(
              <div key={i} style={{padding:"10px 12px",background:C.emeraldBg,border:`1px solid ${C.emerald}30`,borderLeft:`3px solid ${C.emerald}`,borderRadius:3,marginBottom:6,fontSize:13,fontFamily:FD,color:C.ink}}>{a.label}</div>
            ))}
          </div>}
          <button onClick={()=>{setCheckerRes(null);setCheckerText("");setCheckerFile(null);}} style={{background:"none",border:"none",color:C.inkFaint,fontFamily:FM,fontSize:10,cursor:"pointer",letterSpacing:"0.1em",textTransform:"uppercase",padding:"4px 0",marginTop:8}}>Clear results</button>
        </div>}

        {checkerRes?.dates&&<div style={{marginTop:12}}>
          {checkerRes.dates.map((r,i)=>{
            const verdictColor=r.hasConflict?C.crimson:r.isFree?C.emerald:r.verdict==="busy"?C.gold:C.crimson;
            const verdictBg=r.hasConflict?C.crimsonBg:r.isFree?C.emeraldBg:r.verdict==="busy"?C.goldPale:C.crimsonBg;
            const verdictIcon=r.hasConflict?"⚡ Clash":r.isFree?"✓ You're free":"◈ You have things on";
            const verdictText=r.hasConflict?`Direct clash with ${r.timeClash?.[0]?.title||"another appointment"}`:r.isFree?"This date is clear in your schedule":`${r.sameDay.length} appointment${r.sameDay.length>1?"s":""} on this day`;
            return(
              <div key={i} style={{background:verdictBg,border:`1px solid ${verdictColor}30`,borderLeft:`4px solid ${verdictColor}`,borderRadius:4,padding:"12px 14px",marginBottom:8}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
                  <div>
                    <div style={{fontFamily:FD,fontSize:15,color:C.ink,marginBottom:1}}>{r.label||r.date}</div>
                    <div style={{fontSize:10,color:C.inkFaint,fontFamily:FM}}>{r.date}{r.time?" at "+r.time:""}</div>
                  </div>
                  <div style={{textAlign:"right"}}>
                    <div style={{fontSize:13,fontFamily:FD,color:verdictColor,fontWeight:500}}>{verdictIcon}</div>
                  </div>
                </div>
                <div style={{fontSize:12,color:C.inkMid,fontFamily:FB,marginBottom:r.sameDay.length||r.before.length||r.after.length?8:0}}>{verdictText}</div>
                {r.sameDay.length>0&&<div style={{marginBottom:4}}>
                  {r.sameDay.map((e,j)=>(
                    <div key={j} style={{fontSize:11,color:C.inkMid,fontFamily:FB,padding:"3px 0",borderTop:j===0?`1px solid ${verdictColor}20`:""}}>{e.time} — {e.title}</div>
                  ))}
                </div>}
                {(r.before.length>0||r.after.length>0)&&<div style={{fontSize:11,color:C.inkFaint,fontFamily:FB,borderTop:`1px solid ${verdictColor}20`,paddingTop:6,marginTop:4}}>
                  {r.before.length>0&&<div>Day before: {r.before.map(e=>e.title).join(", ")}</div>}
                  {r.after.length>0&&<div>Day after: {r.after.map(e=>e.title).join(", ")}</div>}
                </div>}
              </div>
            );
          })}
          <button onClick={()=>{setCheckerRes(null);setCheckerText("");setCheckerFile(null);}} style={{background:"none",border:"none",color:C.inkFaint,fontFamily:FM,fontSize:10,cursor:"pointer",letterSpacing:"0.1em",textTransform:"uppercase",padding:"4px 0"}}>Clear results</button>

          {/* Reschedule option */}
          <div style={{marginTop:12,borderTop:`1px solid ${C.borderSoft}`,paddingTop:12}}>
            <div style={{fontSize:11,color:C.inkFaint,fontFamily:FB,marginBottom:8}}>Need to change a date? Find and reschedule any appointment:</div>
            <input
              id="reschedule-search"
              placeholder="Type event name or date to search…"
              style={{width:"100%",padding:"9px 12px",border:`1px solid ${C.border}`,borderRadius:3,fontSize:13,background:C.card,color:C.ink,fontFamily:FB,outline:"none",marginBottom:6,boxSizing:"border-box"}}
              onChange={e2=>{
                const q=e2.target.value.toLowerCase();
                setRescheduleSearch(q);
                setRescheduleId("");setRescheduleDate("");setRescheduleTime("");
              }}
            />
            {(()=>{
              const q=(rescheduleSearch||"").toLowerCase();
              const filtered=q.length>0?events.filter(e=>e.title.toLowerCase().includes(q)||e.date.includes(q)||e.notes?.toLowerCase().includes(q)):events;
              return filtered.length>0?(
                <div style={{maxHeight:200,overflowY:"auto",border:`1px solid ${C.borderSoft}`,borderRadius:3,marginBottom:8,background:C.card}}>
                  {filtered.sort((a,b)=>a.date.localeCompare(b.date)).map(e=>(
                    <div key={e.id} onClick={()=>{
                      setRescheduleId(String(e.id));
                      setRescheduleDate(e.date);
                      setRescheduleTime(e.time||"09:00");
                      const el=document.getElementById("reschedule-search");
                      if(el)el.value=e.title+" — "+e.date;
                    }} style={{padding:"9px 12px",cursor:"pointer",borderBottom:`1px solid ${C.borderSoft}`,background:rescheduleId===String(e.id)?C.goldPale:C.card,transition:"background 0.15s"}}>
                      <div style={{fontSize:13,fontFamily:FD,color:C.ink}}>{e.title}</div>
                      <div style={{fontSize:10,color:C.inkFaint,fontFamily:FM}}>{e.date} {e.time&&"· "+e.time}</div>
                    </div>
                  ))}
                </div>
              ):q.length>0?<div style={{fontSize:12,color:C.inkFaint,fontFamily:FB,padding:"8px 0",marginBottom:8}}>No events found matching "{rescheduleSearch}"</div>:null;
            })()}
            {rescheduleId&&<div>
              <div style={{display:"flex",gap:8,marginBottom:8}}>
                <div style={{flex:1}}>
                  <div style={{fontSize:10,color:C.inkFaint,fontFamily:FM,marginBottom:4,letterSpacing:"0.1em",textTransform:"uppercase"}}>New Date</div>
                  <input type="date" value={rescheduleDate} onChange={e2=>setRescheduleDate(e2.target.value)} style={{width:"100%",padding:"9px",border:`1px solid ${C.border}`,borderRadius:3,fontSize:13,background:C.card,color:C.ink,fontFamily:FB,outline:"none",boxSizing:"border-box"}}/>
                </div>
                <div style={{flex:1}}>
                  <div style={{fontSize:10,color:C.inkFaint,fontFamily:FM,marginBottom:4,letterSpacing:"0.1em",textTransform:"uppercase"}}>New Time</div>
                  <input type="time" value={rescheduleTime} onChange={e2=>setRescheduleTime(e2.target.value)} style={{width:"100%",padding:"9px",border:`1px solid ${C.border}`,borderRadius:3,fontSize:13,background:C.card,color:C.ink,fontFamily:FB,outline:"none",boxSizing:"border-box"}}/>
                </div>
              </div>
              <div style={{background:C.goldPale,border:`1px solid ${C.goldBorder}`,borderRadius:4,padding:"10px 12px",marginBottom:8,fontSize:12,fontFamily:FB,color:C.inkMid}}>
                ✦ Confirm: Move <strong>{events.find(e=>e.id===parseInt(rescheduleId))?.title}</strong> to {rescheduleDate} at {rescheduleTime}?
              </div>
              <div style={{display:"flex",gap:8}}>
                <button style={{flex:1,padding:"9px",border:"none",borderRadius:3,background:`linear-gradient(135deg,${C.gold},${C.goldBright})`,color:C.card,fontFamily:FM,fontSize:10,letterSpacing:"0.14em",textTransform:"uppercase",cursor:"pointer"}}
                  onClick={()=>{
                    setEvents(evs=>evs.map(e=>e.id===parseInt(rescheduleId)?{...e,date:rescheduleDate,time:rescheduleTime}:e));
                    setRescheduleId(null);setRescheduleDate("");setRescheduleTime("");
                  }}>✓ Confirm Change</button>
                <button style={{flex:1,padding:"9px",border:`1px solid ${C.borderSoft}`,borderRadius:3,background:"transparent",color:C.inkLight,fontFamily:FM,fontSize:10,letterSpacing:"0.14em",textTransform:"uppercase",cursor:"pointer"}}
                  onClick={()=>{setRescheduleId(null);setRescheduleDate("");setRescheduleTime("");}}>Cancel</button>
              </div>
            </div>}
          </div>
        </div>}
      </div>

      {/* Eleanor strip */}
      <div style={{background:C.card,border:`1px solid ${C.borderSoft}`,borderRadius:6,padding:"14px 16px",marginBottom:16,display:"flex",gap:12,alignItems:"center",boxShadow:`0 2px 10px ${C.shadow}`,cursor:"pointer"}} onClick={()=>setView("chat")}>
        <PaAvatar size={44} pulse={true}/>
        <div style={{flex:1}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
              <div style={{fontFamily:FD,fontSize:17,color:C.ink,fontStyle:"italic",lineHeight:1}}>Eleanor</div>
              <button onClick={()=>{if(window.confirm("Clear chat history?"))setMsgs([{role:"assistant",text:"Good day. I'm Eleanor — how may I assist you?",ts:new Date()}]);}} style={{background:"none",border:`1px solid ${C.borderSoft}`,borderRadius:3,padding:"3px 8px",cursor:"pointer",color:C.inkFaint,fontFamily:FM,fontSize:8,letterSpacing:"0.12em",textTransform:"uppercase"}}>Clear</button>
            </div>
          <div style={{fontSize:10,color:C.inkFaint,fontFamily:FM,letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:4}}>Personal Executive Assistant</div>
          <StatusBadge status="idle"/>
        </div>
        <div style={{fontSize:10,color:C.gold,fontFamily:FM,letterSpacing:"0.1em"}}>Chat →</div>
      </div>


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

      {/* ══ HERO — FINANCES ══ */}
      <div className="hero-card" onClick={()=>setView("finances")} style={{marginBottom:18,borderRadius:8,overflow:"hidden",boxShadow:`0 6px 24px ${C.shadowMed}`,cursor:"pointer",transition:"all 0.25s",animationDelay:"90ms"}}>
        <div style={{background:`linear-gradient(135deg,#3D2E0A 0%,#4A3A10 55%,#2E2208 100%)`,padding:"24px 22px 20px",position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",right:-10,top:-10,fontSize:110,fontFamily:FD,color:"rgba(255,255,255,0.04)",lineHeight:1,userSelect:"none",fontStyle:"italic"}}>£</div>
          <div style={{position:"absolute",bottom:0,left:0,right:0,height:1,background:`linear-gradient(90deg,transparent,${C.goldBorder},transparent)`}}/>
          <div style={{fontSize:9,color:C.goldLight,letterSpacing:"0.3em",textTransform:"uppercase",fontFamily:FM,marginBottom:8,opacity:0.75}}>Money & Planning</div>
          <div style={{fontFamily:FD,fontSize:30,color:C.goldLight,fontStyle:"italic",fontWeight:300,lineHeight:1.1,marginBottom:8}}>Finances</div>
          <div style={{fontSize:12,color:"rgba(232,201,122,0.65)",fontFamily:FB,lineHeight:1.6}}>Income · Outgoings · Payment history · Eleanor's planning advice</div>
        </div>
        <div style={{background:C.card,padding:"13px 22px",borderTop:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          {(()=>{
            const inc=finances.filter(f=>f.type==="income"&&f.status!=="paid").reduce((s,f)=>s+(f.amount||0),0);
            const out=finances.filter(f=>(f.type==="expense"||f.type==="payment")&&f.status!=="paid").reduce((s,f)=>s+(f.amount||0),0);
            return <div style={{display:"flex",gap:16}}>
              <div><div style={{fontSize:9,color:C.inkFaint,fontFamily:FM,letterSpacing:"0.1em",textTransform:"uppercase"}}>In</div><div style={{fontSize:13,fontFamily:FD,color:C.emerald,marginTop:2}}>£{inc.toFixed(2)}</div></div>
              <div><div style={{fontSize:9,color:C.inkFaint,fontFamily:FM,letterSpacing:"0.1em",textTransform:"uppercase"}}>Out</div><div style={{fontSize:13,fontFamily:FD,color:C.crimson,marginTop:2}}>£{out.toFixed(2)}</div></div>
            </div>;
          })()}
          <div style={{fontSize:11,color:C.gold,fontFamily:FM,letterSpacing:"0.1em",textTransform:"uppercase"}}>Tap to open →</div>
        </div>
      </div>

      {/* ══ HERO 3 — CALENDAR ══ */}
      <div className="hero-card" onClick={()=>setView("calendar")} style={{marginBottom:10,borderRadius:8,overflow:"hidden",boxShadow:`0 6px 24px ${C.shadowMed}`,cursor:"pointer",transition:"all 0.25s",animationDelay:"120ms"}}>
        <div style={{background:`linear-gradient(135deg,#1A2038 0%,#0F1628 55%,#0A1020 100%)`,padding:"24px 22px 20px",position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",right:-10,top:-10,fontSize:110,fontFamily:FD,color:"rgba(255,255,255,0.04)",lineHeight:1,userSelect:"none",fontStyle:"italic"}}>✦</div>
          <div style={{position:"absolute",bottom:0,left:0,right:0,height:1,background:`linear-gradient(90deg,transparent,${C.sapphire}99,transparent)`}}/>
          <div style={{fontSize:9,color:"rgba(160,180,255,0.85)",letterSpacing:"0.3em",textTransform:"uppercase",fontFamily:FM,marginBottom:8}}>My Schedule</div>
          <div style={{fontFamily:FD,fontSize:30,color:"#C0C8F0",fontStyle:"italic",fontWeight:300,lineHeight:1.1,marginBottom:8}}>Calendar</div>
          <div style={{fontSize:12,color:"rgba(160,180,255,0.6)",fontFamily:FB,lineHeight:1.6}}>Monthly view · Appointments · Add to Google</div>
        </div>
        <div style={{background:C.card,padding:"13px 22px",borderTop:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div style={{fontSize:12,color:C.inkLight,fontFamily:FB}}>{events.filter(e=>{const d=new Date(e.date+"T12:00:00");const n=new Date();return d>=n&&d<=new Date(n.getTime()+30*86400000);}).length} events in next 30 days</div>
          <div style={{fontSize:11,color:C.sapphire,fontFamily:FM,letterSpacing:"0.1em",textTransform:"uppercase"}}>View →</div>
        </div>
      </div>

      {/* Today summary */}
      <div style={{marginBottom:16}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <div style={SL}>Today's Schedule</div>
          <button onClick={()=>setView("week")} style={{background:"none",border:"none",cursor:"pointer",fontSize:10,color:C.gold,fontFamily:FM,letterSpacing:"0.12em",textTransform:"uppercase"}}>See Week →</button>
        </div>
        {cfls.length>0&&<ConflictAlert cfls={cfls} events={events} onDelete={del} onDismiss={dismissConflict} defaultOpen={forceConflictOpen}/>}
        {todayEvs.length===0
          ?<div style={{textAlign:"center",color:C.inkFaint,padding:"20px 0",background:C.card,borderRadius:6,border:`1px solid ${C.borderSoft}`}}><div style={{fontSize:16,fontFamily:FD,fontStyle:"italic",color:C.inkLight}}>Your day is clear.</div></div>
          :todayEvs.map((e,i)=><EvCard key={e.id} e={e} delay={i*50} cflIds={cflIds} del={del} fetchEventWeather={fetchEventWeather} travelLink={travelLink} travelMode={travelMode} transportLinks={transportLinks} homeAddress={homeAddress} getAppointmentBriefing={getAppointmentBriefing} today={today} fmt={fmt} C={C} FD={FD} FB={FB} FM={FM} PM={PM} chip={chip} SL={SL} goldBtn={goldBtn}/>)}
      </div>

      {/* quick actions */}
      <div style={{display:"flex",gap:8,marginBottom:10}}>
        <button onClick={()=>setView("add")} style={{flex:1,padding:"11px",borderRadius:4,border:`1.5px solid ${C.goldBorder}`,background:C.card,color:C.gold,fontFamily:FM,fontSize:9,letterSpacing:"0.16em",textTransform:"uppercase",cursor:"pointer",boxShadow:`0 1px 6px ${C.shadow}`}}>＋ New Event</button>
        <button onClick={()=>setView("reminders")} style={{flex:1,padding:"11px",borderRadius:4,border:`1px solid ${C.borderSoft}`,background:C.card,color:C.inkLight,fontFamily:FM,fontSize:9,letterSpacing:"0.16em",textTransform:"uppercase",cursor:"pointer",boxShadow:`0 1px 6px ${C.shadow}`}}>⏰ Reminders</button>
        <button onClick={()=>setView("birthdays")} style={{flex:1,padding:"11px",borderRadius:4,border:`1px solid ${C.borderSoft}`,background:C.card,color:C.inkLight,fontFamily:FM,fontSize:9,letterSpacing:"0.16em",textTransform:"uppercase",cursor:"pointer",boxShadow:`0 1px 6px ${C.shadow}`}}>🎂 Birthdays</button>
        <button onClick={()=>setView("settings")} style={{padding:"11px 14px",borderRadius:4,border:`1px solid ${C.borderSoft}`,background:C.card,color:C.inkLight,fontFamily:FM,fontSize:12,cursor:"pointer",boxShadow:`0 1px 6px ${C.shadow}`}}>⚙</button>
        <button onClick={()=>setShowSearch(s=>!s)} style={{padding:"11px 14px",borderRadius:4,border:`1px solid ${C.borderSoft}`,background:showSearch?C.goldPale:C.card,color:showSearch?C.gold:C.inkLight,fontFamily:FM,fontSize:12,cursor:"pointer",boxShadow:`0 1px 6px ${C.shadow}`}}>🔍</button>
      </div>

    </div>
  );

  /* ── SCHEDULE (TODAY DETAIL) ── */
  const ScheduleView=()=>{
    const criticalEvs=events.filter(e=>e.priority==="critical"&&!dismissedCriticalIds.includes(e.id)).sort((a,b)=>a.date.localeCompare(b.date)||a.time.localeCompare(b.time));
    const displayEvs=criticalOnly?criticalEvs:todayEvs;
    return(<div>
      {cfls.length>0&&<ConflictAlert cfls={cfls} events={events} onDelete={del} onDismiss={dismissConflict} defaultOpen={forceConflictOpen}/>}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
        <div style={SL}>{criticalOnly?`${criticalEvs.length} Critical Events`:today.toLocaleDateString("en-GB",{weekday:"long"})+" — "+todayEvs.length+" appointment"+(todayEvs.length!==1?"s":"")}</div>
        {criticalOnly&&<div style={{display:"flex",gap:6}}>
          <button onClick={()=>{setDismissedCriticalIds(ids=>[...ids,...criticalEvs.map(e=>e.id)]);setCriticalOnly(false);}} style={{background:"none",border:`1px solid ${C.crimson}`,borderRadius:3,padding:"4px 10px",color:C.crimson,fontFamily:FM,fontSize:9,letterSpacing:"0.12em",textTransform:"uppercase",cursor:"pointer"}}>✕ Dismiss All</button>
          <button onClick={()=>setCriticalOnly(false)} style={{background:"none",border:`1px solid ${C.borderSoft}`,borderRadius:3,padding:"4px 10px",color:C.inkFaint,fontFamily:FM,fontSize:9,letterSpacing:"0.12em",textTransform:"uppercase",cursor:"pointer"}}>Close</button>
        </div>}
      </div>
      {criticalOnly&&criticalEvs.length>0&&<div style={{background:C.crimsonBg,border:`1px solid ${C.crimson}40`,borderLeft:`4px solid ${C.crimson}`,borderRadius:4,padding:"10px 14px",marginBottom:12,fontSize:12,color:C.crimson,fontFamily:FB}}>Tap ✕ on any event to dismiss it from this view. The event stays in your schedule.</div>}
      {displayEvs.length===0
        ?<div style={{textAlign:"center",color:C.inkFaint,padding:"50px 0"}}><div style={{fontSize:22,fontFamily:FD,fontStyle:"italic",color:C.inkLight,marginBottom:8}}>{criticalOnly?"All critical events seen.":"Your day is clear."}</div></div>
        :displayEvs.map((e,i)=>(
          <div key={e.id} style={{position:"relative"}}>
            {criticalOnly&&<button onClick={()=>setDismissedCriticalIds(ids=>[...ids,e.id])} style={{position:"absolute",top:14,right:40,zIndex:10,background:C.crimsonBg,border:`1px solid ${C.crimson}`,borderRadius:3,padding:"2px 8px",color:C.crimson,fontFamily:FM,fontSize:8,letterSpacing:"0.1em",textTransform:"uppercase",cursor:"pointer"}}>✕ Seen</button>}
            <div onClick={()=>setEventAction({event:e})} style={{cursor:"pointer"}}>
              <EvCard e={e} delay={i*55} cflIds={cflIds} del={del} fetchEventWeather={fetchEventWeather} travelLink={travelLink} travelMode={travelMode} transportLinks={transportLinks} homeAddress={homeAddress} getAppointmentBriefing={getAppointmentBriefing} today={today} fmt={fmt} C={C} FD={FD} FB={FB} FM={FM} PM={PM} chip={chip} SL={SL} goldBtn={goldBtn}/>
            </div>
          </div>
        ))}
      {criticalOnly&&dismissedCriticalIds.length>0&&<button onClick={()=>setDismissedCriticalIds([])} style={{background:"none",border:"none",color:C.inkFaint,fontFamily:FM,fontSize:9,cursor:"pointer",letterSpacing:"0.1em",textTransform:"uppercase",marginTop:8}}>↺ Show all dismissed</button>}
    </div>);
  };

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
            <button onClick={()=>{setNewEv(n=>({...n,date:day.ds}));setView("add");}} style={{background:"none",border:`1px solid ${C.goldBorder}`,borderRadius:3,padding:"3px 9px",cursor:"pointer",color:C.gold,fontFamily:FM,fontSize:9,letterSpacing:"0.1em",textTransform:"uppercase"}}>＋ Event</button>
            <button onClick={()=>{setView("reminders");}} style={{background:"none",border:`1px solid ${C.borderSoft}`,borderRadius:3,padding:"3px 9px",cursor:"pointer",color:C.inkFaint,fontFamily:FM,fontSize:9,letterSpacing:"0.1em",textTransform:"uppercase"}}>⏰</button>
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
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
        <div style={SL}>Executive Briefing</div>
        <div style={{display:"flex",gap:6,alignItems:"center"}}>
          <button onClick={()=>{
            const next=!briefingVoiceOn;
            setBriefingVoiceOn(next);
            localStorage.setItem("papa_briefing_voice",String(next));
            if(!next)stopSpeaking();
            else eleanorSpeak("Briefing voice enabled.");
          }} style={{padding:"5px 12px",borderRadius:4,border:`1.5px solid ${briefingVoiceOn?C.goldBorder:C.borderSoft}`,background:briefingVoiceOn?C.goldPale:C.card,color:briefingVoiceOn?C.gold:C.inkFaint,fontFamily:FM,fontSize:9,letterSpacing:"0.1em",textTransform:"uppercase",cursor:"pointer"}}>
            {briefingVoiceOn?"🔊 Voice":"🔇 Muted"}
          </button>
          {eleanorSpeaking&&<button onClick={stopSpeaking} style={{padding:"5px 10px",borderRadius:4,border:`1px solid ${C.crimson}`,background:C.crimsonBg,color:C.crimson,fontFamily:FM,fontSize:9,cursor:"pointer"}}>■ Stop</button>}
        </div>
      </div>
      {/* Eleanor header */}
      <div style={{display:"flex",gap:14,alignItems:"center",background:C.card,border:`1px solid ${C.borderSoft}`,borderRadius:6,padding:"14px 16px",marginBottom:18,boxShadow:`0 2px 10px ${C.shadow}`}}>
        <div style={{width:56,height:56,borderRadius:"50%",overflow:"hidden",flexShrink:0,border:`2px solid ${C.goldBorder}`,boxShadow:`0 0 12px rgba(196,153,62,0.3)`}}>
          {PA_PHOTO
            ?<img src={PA_PHOTO} alt="Eleanor" style={{width:"100%",height:"100%",objectFit:"cover",objectPosition:"top"}}/>
            :<div style={{width:"100%",height:"100%",background:`linear-gradient(145deg,${C.cream},${C.creamDeep})`,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:FD,fontSize:22,color:C.gold,fontStyle:"italic"}}>E</div>
          }
        </div>
        <div>
          <div style={{fontFamily:FD,fontSize:18,color:C.ink,fontStyle:"italic",marginBottom:2}}>Good {new Date().getHours()<12?"morning":new Date().getHours()<17?"afternoon":"evening"}</div>
          <div style={{fontSize:12,color:C.inkLight,fontFamily:FB,lineHeight:1.5}}>I'm Eleanor, your Personal Assistant. I've reviewed your schedule and prepared your briefing.</div>
        </div>
      </div>
      {!briefing&&!briefBusy&&<div>
        <div style={{fontFamily:FD,fontSize:22,color:C.ink,fontStyle:"italic",marginBottom:8,lineHeight:1.4,fontWeight:300}}>Your personal intelligence briefing</div>
        <div style={{fontSize:13,color:C.inkLight,fontFamily:FB,lineHeight:1.75,marginBottom:22}}>Eleanor will analyse your schedule, UK school holidays, conflicts, and free time — then deliver a tailored briefing with actionable recommendations.</div>
        <div style={{border:`1px solid ${C.border}`,borderRadius:6,overflow:"hidden",marginBottom:22,boxShadow:`0 2px 12px ${C.shadow}`}}>
          <div style={{padding:"12px 16px",borderBottom:`1px solid ${C.border}`,background:C.cream,fontSize:9,color:C.gold,letterSpacing:"0.22em",textTransform:"uppercase",fontFamily:FM}}>Upcoming UK School & Bank Holidays</div>
          {upcomingHols(5).map((h,i,arr)=>{const du=daysUntil(h.start);return(<div key={i} style={{padding:"13px 16px",borderBottom:i<arr.length-1?`1px solid ${C.borderSoft}`:"none",background:C.card,display:"flex",justifyContent:"space-between",alignItems:"center"}}><div><div style={{fontSize:14,fontFamily:FD,color:C.ink}}>{h.name}</div><div style={{fontSize:10,color:C.inkFaint,fontFamily:FM,marginTop:2}}>{fmtRange(h.start,h.end)}</div></div><div style={{textAlign:"right"}}><div style={{fontSize:20,fontFamily:FD,color:du<=14?C.crimson:du<=30?C.gold:C.inkFaint,fontWeight:300}}>{du}</div><div style={{fontSize:9,color:C.inkFaint,fontFamily:FM}}>days</div></div></div>);})}
        </div>
        <button className="gold-pulse" style={goldBtn()} onClick={generateBriefing}>Generate My Briefing</button>
      </div>}
      {briefBusy&&<BriefingLoader/>}
      {briefing?.error&&<div><div style={{border:`1px solid ${C.crimson}40`,background:C.crimsonBg,padding:"14px 16px",marginBottom:16,fontSize:13,color:C.crimson,fontFamily:FB,borderRadius:4}}>Unable to generate briefing. Please try again.</div><button style={goldBtn()} onClick={generateBriefing}>Retry</button></div>}
      {briefing&&!briefing.error&&<div>
        <div style={{borderLeft:`4px solid ${C.goldBorder}`,paddingLeft:18,marginBottom:24}}><div style={{fontFamily:FD,fontSize:22,color:C.ink,fontStyle:"italic",lineHeight:1.45,fontWeight:300}}>{briefing.headline}</div></div>
        {briefing.today_summary&&<div onClick={()=>{sendChat("Give me more detail about today from my briefing: "+briefing.today_summary);setCriticalOnly(false);setView("chat");}} style={{background:C.card,border:`1px solid ${C.borderSoft}`,borderTop:`3px solid ${C.goldBorder}`,padding:"16px 18px",marginBottom:18,borderRadius:4,boxShadow:`0 2px 10px ${C.shadow}`,cursor:"pointer"}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}><div style={SL}>Today at a Glance</div><span style={{fontSize:9,color:C.gold,fontFamily:FM,letterSpacing:"0.1em",textTransform:"uppercase"}}>tap to ask Eleanor →</span></div><div style={{fontSize:14,fontFamily:FB,color:C.inkMid,lineHeight:1.7}}>{briefing.today_summary}</div></div>}
        {briefing.weekly_balance&&<div style={{background:C.card,border:`1px solid ${C.borderSoft}`,padding:"16px 18px",marginBottom:18,borderRadius:4,boxShadow:`0 2px 10px ${C.shadow}`}}><div style={{...SL,marginBottom:12}}>Schedule Balance</div><div style={{display:"flex",alignItems:"center",gap:16}}><div style={{textAlign:"center",minWidth:50}}><div style={{fontSize:34,fontFamily:FD,color:briefing.weekly_balance.score>=7?C.emerald:briefing.weekly_balance.score>=4?C.gold:C.crimson,fontWeight:300,lineHeight:1}}>{briefing.weekly_balance.score}</div><div style={{fontSize:9,color:C.inkFaint,fontFamily:FM}}>/10</div></div><div style={{flex:1}}><div style={{height:3,background:C.borderSoft,borderRadius:2,marginBottom:10,overflow:"hidden"}}><div style={{height:3,width:`${briefing.weekly_balance.score*10}%`,background:`linear-gradient(90deg,${C.gold},${C.goldLight})`,borderRadius:2}}/></div><div style={{fontSize:13,color:C.inkLight,fontFamily:FB,lineHeight:1.6}}>{briefing.weekly_balance.comment}</div></div></div></div>}
        {/* Eleanor chat updates notice */}
        {(persistentMemory.pending_tasks||[]).length>0&&<div style={{background:C.card,border:`1px solid ${C.goldBorder}`,borderLeft:`4px solid ${C.gold}`,borderRadius:6,padding:"12px 16px",marginBottom:14}}>
          <div style={{fontSize:9,color:C.gold,fontFamily:FM,letterSpacing:"0.2em",textTransform:"uppercase",marginBottom:8}}>✦ Eleanor's Notes from Chat</div>
          {(persistentMemory.pending_tasks||[]).map((t,i)=>(
            <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 0",borderBottom:i<(persistentMemory.pending_tasks||[]).length-1?`1px solid ${C.borderSoft}`:"none"}}>
              <div style={{fontSize:12,color:C.inkMid,fontFamily:FB}}>→ {t}</div>
              <button onClick={()=>{
                const updated={...persistentMemory,pending_tasks:(persistentMemory.pending_tasks||[]).filter((_,j)=>j!==i)};
                setPersistentMemory(updated);
                safeSave("papa_persistent_memory",JSON.stringify(updated));
              }} style={{background:"none",border:"none",color:C.inkFaint,cursor:"pointer",fontSize:11,flexShrink:0,marginLeft:8}}>✓ Done</button>
            </div>
          ))}
          <div style={{fontSize:10,color:C.inkFaint,fontFamily:FB,marginTop:8,fontStyle:"italic"}}>Note: To change events mentioned in chat, please update them directly in Calendar.</div>
        </div>}

        {/* Eleanor's personal greeting */}
        {briefing.how_are_you&&<div onClick={()=>{sendChat(briefing.how_are_you);setCriticalOnly(false);setView("chat");}} style={{background:C.card,border:`1px solid ${C.goldBorder}`,borderRadius:6,padding:"14px 16px",marginBottom:14,borderLeft:`4px solid ${C.gold}`,cursor:"pointer",position:"relative"}}>
          <div style={{fontSize:9,color:C.gold,fontFamily:FM,letterSpacing:"0.15em",textTransform:"uppercase",marginBottom:6}}>✦ Eleanor says — tap to reply</div>
          <div style={{fontSize:14,color:C.inkMid,fontFamily:FB,lineHeight:1.7,fontStyle:"italic"}}>"{briefing.how_are_you}"</div>
        </div>}

        {/* Meal plan question */}
        {!mealDismissed&&<div style={{background:C.card,border:`1px solid ${C.borderSoft}`,borderRadius:6,padding:"14px 16px",marginBottom:14,boxShadow:`0 2px 10px ${C.shadow}`}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
            <div style={{fontFamily:FD,fontSize:15,color:C.ink,fontStyle:"italic"}}>🍽 What are you planning to eat today?</div>
            <button onClick={()=>{setMealDismissed(true);localStorage.setItem("papa_meal_dismissed_"+new Date().toDateString(),"true");}} style={{background:"none",border:"none",color:C.inkFaint,cursor:"pointer",fontSize:14,padding:"0 4px"}}>✕</button>
          </div>
          {todayMeal
            ?<div style={{background:C.goldPale,border:`1px solid ${C.goldBorder}`,borderRadius:4,padding:"10px 12px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div style={{fontSize:13,color:C.ink,fontFamily:FB,lineHeight:1.5,flex:1}}>{todayMeal}</div>
              <button onClick={()=>{setTodayMeal("");localStorage.removeItem("papa_meal_"+new Date().toDateString());}} style={{background:"none",border:"none",color:C.inkFaint,cursor:"pointer",fontSize:12,marginLeft:8,flexShrink:0}}>✎</button>
            </div>
            :<div>
              <textarea
                id="meal-plan-input"
                style={{...inp,minHeight:60,resize:"none",marginBottom:8,fontSize:13}}
                placeholder={"e.g. Breakfast: porridge · Lunch: soup · Dinner: pasta\nOr just type tonight's dinner..."}
              />
              <div style={{display:"flex",gap:8}}>
                <button onClick={()=>{
                  const el=document.getElementById("meal-plan-input");
                  const val=el?.value?.trim();
                  if(!val)return;
                  setTodayMeal(val);
                  localStorage.setItem("papa_meal_"+new Date().toDateString(),val);
                }} style={{flex:1,...goldBtn(),margin:0}}>✓ Save</button>
                <button onClick={()=>{setMealDismissed(true);localStorage.setItem("papa_meal_dismissed_"+new Date().toDateString(),"true");}} style={{...goldBtn(true),margin:0,flex:0,padding:"9px 14px"}}>Skip</button>
              </div>
            </div>
          }
          <div style={{display:"flex",gap:8,marginTop:8,alignItems:"center",flexWrap:"wrap"}}>
            <a
              href="https://thinko-chores.vercel.app/?screen=meals"
              target="_blank"
              rel="noreferrer"
              style={{display:"inline-flex",alignItems:"center",gap:6,padding:"7px 14px",borderRadius:4,border:`1px solid ${C.goldBorder}`,background:C.goldPale,color:C.gold,fontFamily:FM,fontSize:9,letterSpacing:"0.12em",textTransform:"uppercase",textDecoration:"none",cursor:"pointer"}}>
              🦔 Open Thinko Chores Meal Plan
            </a>
          </div>
        </div>}

        {/* Best day this week */}
        {briefing.best_day_this_week?.day_name&&<div style={{background:C.emeraldBg,border:`1px solid ${C.emerald}30`,borderLeft:`4px solid ${C.emerald}`,borderRadius:4,padding:"12px 16px",marginBottom:14}}>
          <div style={{fontSize:9,color:C.emerald,fontFamily:FM,letterSpacing:"0.2em",textTransform:"uppercase",marginBottom:4}}>Best Day to Schedule Something</div>
          <div style={{fontFamily:FD,fontSize:16,color:C.ink}}>{briefing.best_day_this_week.day_name} — {briefing.best_day_this_week.date}</div>
          <div style={{fontSize:12,color:C.inkMid,fontFamily:FB,marginTop:3,lineHeight:1.5}}>{briefing.best_day_this_week.reason}</div>
          <div style={{display:"flex",gap:8,marginTop:8,flexWrap:"wrap"}}>
            <button onClick={()=>{setNewEv(n=>({...n,date:briefing.best_day_this_week.date}));setCriticalOnly(false);setView("add");}} style={{padding:"6px 14px",borderRadius:3,border:`1px solid ${C.emerald}`,background:"transparent",color:C.emerald,fontFamily:FM,fontSize:9,letterSpacing:"0.12em",textTransform:"uppercase",cursor:"pointer"}}>＋ Add Event</button>
            <button onClick={()=>{sendChat("What should I schedule on "+briefing.best_day_this_week.day_name+"?");setCriticalOnly(false);setView("chat");}} style={{padding:"6px 14px",borderRadius:3,border:`1px solid ${C.goldBorder}`,background:C.goldPale,color:C.gold,fontFamily:FM,fontSize:9,letterSpacing:"0.12em",textTransform:"uppercase",cursor:"pointer"}}>✦ Ask Eleanor</button>
          </div>
        </div>}

        {/* Week busyness indicator */}
        {(()=>{
          const weekEvs=Array.from({length:7},(_,i)=>{
            const d=new Date(today.getTime()+i*86400000);
            const ds=fmt(d);
            const evCount=events.filter(e=>e.date===ds).length;
            const hasCritical=events.some(e=>e.date===ds&&e.priority==="critical");
            return{day:d.toLocaleDateString("en-GB",{weekday:"short"}),date:ds,count:evCount,hasCritical};
          });
          const total=weekEvs.reduce((s,d)=>s+d.count,0);
          const level=total===0?"Clear week":total<=3?"Light week":total<=7?"Moderate week":total<=12?"Busy week":"Very demanding week";
          const color=total===0?C.emerald:total<=3?C.emerald:total<=7?C.gold:total<=12?C.gold:C.crimson;
          return(<div style={{background:C.card,border:`1px solid ${C.borderSoft}`,borderRadius:6,padding:"14px 16px",marginBottom:14}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
              <div style={{fontSize:9,color:C.gold,fontFamily:FM,letterSpacing:"0.2em",textTransform:"uppercase"}}>Week at a Glance</div>
              <div style={{fontSize:11,color,fontFamily:FM,fontWeight:500}}>{level}</div>
            </div>
            <div style={{display:"flex",gap:4}}>
              {weekEvs.map((d,i)=>(
                <div key={i} onClick={()=>{setSelectedDay(d.date);setCriticalOnly(false);setView("calendar");}} style={{flex:1,textAlign:"center",cursor:"pointer"}}>
                  <div style={{height:Math.max(4,d.count*8),background:d.hasCritical?C.crimson:d.count>0?C.gold:C.borderSoft,borderRadius:2,marginBottom:4,transition:"height 0.3s"}}/>
                  <div style={{fontSize:8,color:C.inkFaint,fontFamily:FM}}>{d.day}</div>
                  {d.count>0&&<div style={{fontSize:8,color:d.hasCritical?C.crimson:C.gold,fontFamily:FM}}>{d.count}</div>}
                </div>
              ))}
            </div>
          </div>);
        })()}

        {/* Monthly check-in — shows on the 1st of each month */}
        {(()=>{
          const thisMonthKey=today.getFullYear()+"-"+(today.getMonth()+1);
          const isFirstOfMonth=today.getDate()===1;
          const alreadyDone=monthlyCheckinDismissed===thisMonthKey;
          if(!isFirstOfMonth||alreadyDone)return null;
          const monthName=today.toLocaleDateString("en-GB",{month:"long",year:"numeric"});
          const inc=finances.filter(f=>f.type==="income"&&f.status!=="paid").reduce((s,f)=>s+(f.amount||0),0);
          const out=finances.filter(f=>(f.type==="expense"||f.type==="payment")&&f.status!=="paid").reduce((s,f)=>s+(f.amount||0),0);
          return(
            <div style={{background:`linear-gradient(135deg,${C.goldPale},${C.card})`,border:`1.5px solid ${C.goldBorder}`,borderRadius:8,padding:"16px 18px",marginBottom:14,boxShadow:`0 3px 14px ${C.shadow}`}}>
              <div style={{fontSize:9,color:C.gold,fontFamily:FM,letterSpacing:"0.2em",textTransform:"uppercase",marginBottom:6}}>✦ New Month — {monthName}</div>
              <div style={{fontFamily:FD,fontSize:19,color:C.ink,fontStyle:"italic",marginBottom:8}}>A fresh month, Sarah. Two things worth a moment.</div>

              {/* Goals prompt */}
              <div style={{background:C.card,border:`1px solid ${C.borderSoft}`,borderRadius:6,padding:"12px",marginBottom:10}}>
                <div style={{fontSize:12,color:C.inkMid,fontFamily:FB,marginBottom:8,lineHeight:1.5}}>What would you like to focus on this month? Set a few goals and I'll keep them in view.</div>
                <button onClick={()=>{sendChat("Help me set my goals for "+monthName+". Ask me what matters most this month.");setCriticalOnly(false);setView("chat");}} style={{width:"100%",padding:"9px",borderRadius:4,border:"none",background:`linear-gradient(135deg,${C.gold},${C.goldBright})`,color:C.card,fontFamily:FM,fontSize:9,letterSpacing:"0.12em",textTransform:"uppercase",cursor:"pointer",marginBottom:6}}>✦ Set This Month's Goals with Eleanor</button>
                <a href="https://thinko-goals.vercel.app/?screen=goals" target="_blank" rel="noreferrer" style={{display:"flex",alignItems:"center",justifyContent:"center",gap:6,width:"100%",padding:"9px",borderRadius:4,border:`1px solid ${C.goldBorder}`,background:C.goldPale,color:C.gold,fontFamily:FM,fontSize:9,letterSpacing:"0.12em",textTransform:"uppercase",textDecoration:"none",cursor:"pointer",boxSizing:"border-box"}}>🦔 Open Thinko Goals</a>
              </div>

              {/* Financial forecast prompt */}
              <div style={{background:C.card,border:`1px solid ${C.borderSoft}`,borderRadius:6,padding:"12px",marginBottom:10}}>
                <div style={{fontSize:12,color:C.inkMid,fontFamily:FB,marginBottom:6,lineHeight:1.5}}>Let's check your finances for the month ahead.</div>
                <div style={{display:"flex",gap:12,marginBottom:8}}>
                  <div><div style={{fontSize:8,color:C.inkFaint,fontFamily:FM,letterSpacing:"0.1em",textTransform:"uppercase"}}>Expected In</div><div style={{fontFamily:FD,fontSize:15,color:C.emerald}}>£{inc.toFixed(2)}</div></div>
                  <div><div style={{fontSize:8,color:C.inkFaint,fontFamily:FM,letterSpacing:"0.1em",textTransform:"uppercase"}}>Due Out</div><div style={{fontFamily:FD,fontSize:15,color:C.crimson}}>£{out.toFixed(2)}</div></div>
                  <div><div style={{fontSize:8,color:C.inkFaint,fontFamily:FM,letterSpacing:"0.1em",textTransform:"uppercase"}}>Net</div><div style={{fontFamily:FD,fontSize:15,color:inc-out>=0?C.emerald:C.crimson}}>£{(inc-out).toFixed(2)}</div></div>
                </div>
                <button onClick={()=>{setView("finances");}} style={{width:"100%",padding:"9px",borderRadius:4,border:`1px solid ${C.goldBorder}`,background:C.goldPale,color:C.gold,fontFamily:FM,fontSize:9,letterSpacing:"0.12em",textTransform:"uppercase",cursor:"pointer"}}>💰 Review Financial Forecast</button>
              </div>

              <button onClick={()=>{setMonthlyCheckinDismissed(thisMonthKey);localStorage.setItem("papa_monthly_checkin_month",thisMonthKey);}} style={{width:"100%",padding:"7px",borderRadius:4,border:"none",background:"transparent",color:C.inkFaint,fontFamily:FM,fontSize:9,letterSpacing:"0.1em",textTransform:"uppercase",cursor:"pointer"}}>Done for this month</button>
            </div>
          );
        })()}

        {/* Weekly Goals in briefing */}
        {weeklyGoals?.goals?.length>0&&weeklyGoals.status!=="dismissed"&&<div style={{background:C.card,border:`1px solid ${C.borderSoft}`,borderRadius:6,padding:"14px 16px",marginBottom:14}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
            <div style={{fontSize:9,color:C.sapphire,fontFamily:FM,letterSpacing:"0.2em",textTransform:"uppercase"}}>✦ This Week's Goals</div>
            <button onClick={()=>setShowGoalsModal(true)} style={{fontSize:9,color:C.gold,fontFamily:FM,letterSpacing:"0.1em",textTransform:"uppercase",background:"none",border:`1px solid ${C.goldBorder}`,borderRadius:3,padding:"3px 8px",cursor:"pointer"}}>Update</button>
          </div>
          {weeklyGoals.goals.map((g,i)=>(
            <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 10px",background:weeklyGoals.done?.[i]?C.emeraldBg:C.parchment,border:`1px solid ${weeklyGoals.done?.[i]?C.emerald:C.borderSoft}`,borderLeft:`3px solid ${weeklyGoals.done?.[i]?C.emerald:C.sapphire}`,borderRadius:3,marginBottom:6}}>
              <div style={{flex:1,fontSize:12,fontFamily:FB,color:weeklyGoals.done?.[i]?C.emerald:C.ink,textDecoration:weeklyGoals.done?.[i]?"line-through":"none",lineHeight:1.4}}>{g}</div>
              <div style={{display:"flex",gap:6,flexShrink:0,marginLeft:8}}>
                {!weeklyGoals.done?.[i]&&<button onClick={()=>setWeeklyGoals(wg=>({...wg,done:{...wg.done,[i]:true}}))} style={{padding:"4px 8px",borderRadius:2,border:`1px solid ${C.emerald}`,background:C.emeraldBg,color:C.emerald,fontFamily:FM,fontSize:8,cursor:"pointer",letterSpacing:"0.1em",textTransform:"uppercase"}}>✓ Done</button>}
                <button onClick={()=>setWeeklyGoals(wg=>({...wg,goals:wg.goals.filter((_,j)=>j!==i),done:Object.fromEntries(Object.entries(wg.done||{}).filter(([k])=>k!==String(i)))}))} style={{padding:"4px 8px",borderRadius:2,border:`1px solid ${C.borderSoft}`,background:"transparent",color:C.inkFaint,fontFamily:FM,fontSize:8,cursor:"pointer"}}>✕</button>
              </div>
            </div>
          ))}
          <div style={{display:"flex",gap:8,marginTop:4,alignItems:"center"}}>
            <button onClick={()=>{setCriticalOnly(false);setView("briefing");setShowGoalsModal(true);}} style={{fontSize:9,color:C.inkFaint,fontFamily:FM,letterSpacing:"0.1em",textTransform:"uppercase",background:"none",border:"none",cursor:"pointer",padding:"0"}}>+ Add goal</button>
            <a href="https://thinko-goals.vercel.app/?screen=goals" target="_blank" rel="noreferrer" style={{fontSize:9,color:C.gold,fontFamily:FM,letterSpacing:"0.1em",textTransform:"uppercase",textDecoration:"none",cursor:"pointer"}}>🦔 Thinko Goals</a>
          </div>
        </div>}

        {/* Financial summary in briefing */}
        {(()=>{
          const thisMonth=new Date().getMonth();
          const thisYear=new Date().getFullYear();
          const monthFinances=finances.filter(f=>{
            if(!f.date)return false;
            const d=new Date(f.date+"T12:00:00");
            return d.getMonth()===thisMonth&&d.getFullYear()===thisYear;
          });
          const income=monthFinances.filter(f=>f.type==="income"&&f.status!=="paid");
          const expenses=monthFinances.filter(f=>(f.type==="expense"||f.type==="payment")&&f.status!=="paid");
          const totalIn=income.reduce((s,f)=>s+(f.amount||0),0);
          const totalOut=expenses.reduce((s,f)=>s+(f.amount||0),0);
          if(!income.length&&!expenses.length)return null;
          return(<div style={{background:C.card,border:`1px solid ${C.borderSoft}`,borderRadius:6,padding:"14px 16px",marginBottom:14,boxShadow:`0 2px 10px ${C.shadow}`}}>
            <div style={{fontSize:9,color:C.gold,fontFamily:FM,letterSpacing:"0.2em",textTransform:"uppercase",marginBottom:10}}>💰 This Month's Finances</div>
            <div style={{display:"flex",gap:10,marginBottom:12}}>
              {totalIn>0&&<div style={{flex:1,background:C.emeraldBg,borderRadius:4,padding:"10px 12px",border:`1px solid ${C.emerald}30`}}>
                <div style={{fontSize:10,color:C.emerald,fontFamily:FM,letterSpacing:"0.1em",textTransform:"uppercase"}}>Expected In</div>
                <div style={{fontFamily:FD,fontSize:20,color:C.emerald}}>£{totalIn.toFixed(2)}</div>
              </div>}
              {totalOut>0&&<div style={{flex:1,background:C.crimsonBg,borderRadius:4,padding:"10px 12px",border:`1px solid ${C.crimson}30`}}>
                <div style={{fontSize:10,color:C.crimson,fontFamily:FM,letterSpacing:"0.1em",textTransform:"uppercase"}}>Due Out</div>
                <div style={{fontFamily:FD,fontSize:20,color:C.crimson}}>£{totalOut.toFixed(2)}</div>
              </div>}
            </div>
            {[...income,...expenses].map((f,i)=>(
              <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 10px",background:f.type==="income"?C.emeraldBg:C.crimsonBg,borderLeft:`3px solid ${f.type==="income"?C.emerald:C.crimson}`,borderRadius:3,marginBottom:6}}>
                <div>
                  <div style={{fontSize:13,fontFamily:FD,color:C.ink}}>{f.label}</div>
                  {f.date&&<div style={{fontSize:10,color:C.inkFaint,fontFamily:FM}}>{f.date}</div>}
                </div>
                <div style={{display:"flex",gap:6,alignItems:"center"}}>
                  <div style={{fontSize:14,fontFamily:FD,color:f.type==="income"?C.emerald:C.crimson}}>£{(f.amount||0).toFixed(2)}</div>
                  <button onClick={()=>setFinances(fs=>fs.map(x=>x.id===f.id?{...x,status:"paid"}:x))} style={{padding:"3px 8px",borderRadius:2,border:`1px solid ${C.borderSoft}`,background:C.card,color:C.inkFaint,fontFamily:FM,fontSize:8,letterSpacing:"0.1em",textTransform:"uppercase",cursor:"pointer"}}>✓ Paid</button>
                  <button onClick={()=>{setChatIn("Remind me to pay "+f.label+" of £"+(f.amount||0).toFixed(2)+(f.date?" on "+f.date:""));setCriticalOnly(false);setView("chat");}} style={{padding:"3px 8px",borderRadius:2,border:`1px solid ${C.goldBorder}`,background:C.goldPale,color:C.gold,fontFamily:FM,fontSize:8,letterSpacing:"0.1em",textTransform:"uppercase",cursor:"pointer"}}>⏰</button>
                </div>
              </div>
            ))}
          </div>);
        })()}

        {/* Birthday alerts in briefing */}
        {(()=>{const alerts=getBirthdayAlerts().filter(b=>b.days<=14&&b.action!=="done"&&b.action!=="skip");if(!alerts.length)return null;return(<div style={{marginBottom:18}}>
          <div style={SL}>🎂 Birthdays & Celebrations</div>
          {alerts.map(b=>{
            const isSoon=b.days<=7;
            const color=b.days===0?C.crimson:isSoon?C.gold:C.sapphire;
            const bg=b.days===0?C.crimsonBg:isSoon?C.goldPale:C.sapphireBg;
            return(<div key={b.id} style={{background:bg,border:`1px solid ${color}30`,borderLeft:`4px solid ${color}`,padding:"13px 16px",marginBottom:8,borderRadius:6}}>
              <div style={{fontFamily:FD,fontSize:15,color:C.ink,marginBottom:4}}>{b.days===0?"🎉 Today":"🎂 "+b.name+"'s "+(b.type==="birthday"?"Birthday":b.type)+" in "+b.days+" day"+(b.days>1?"s":"")}</div>
              <div style={{fontSize:12,color:C.inkMid,fontFamily:FB,lineHeight:1.6,marginBottom:10}}>{b.days<=1?"It's very soon — make sure you have a card or gift ready.":b.days<=7?"Consider buying a card or present this week before it's too late.":"You have "+b.days+" days — a good time to plan something thoughtful."}</div>
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                <button onClick={()=>{
                  setBirthdayActions(a=>({...a,[b.id]:"scheduled"}));
                  const mx=Math.max(...events.map(e=>e.id),0);
                  setEvents(ev=>[...ev,{id:mx+1,title:"Buy gift for "+b.name,date:fmt(new Date(new Date(b.next+"T12:00:00").getTime()-7*86400000)),time:"10:00",priority:"high",notes:b.type+" — "+b.name,source:"birthday"}]);
                }} style={{fontSize:10,padding:"6px 12px",borderRadius:3,border:"none",background:`linear-gradient(135deg,${C.gold},${C.goldBright})`,color:C.card,fontFamily:FM,letterSpacing:"0.1em",textTransform:"uppercase",cursor:"pointer"}}>📅 Schedule</button>
                <button onClick={()=>setBirthdayActions(a=>({...a,[b.id]:"done"}))} style={{fontSize:10,padding:"6px 12px",borderRadius:3,border:`1px solid ${C.emerald}`,background:C.emeraldBg,color:C.emerald,fontFamily:FM,letterSpacing:"0.1em",textTransform:"uppercase",cursor:"pointer"}}>✓ Done</button>
                <button onClick={()=>setBirthdayActions(a=>({...a,[b.id]:"skip"}))} style={{fontSize:10,padding:"6px 12px",borderRadius:3,border:`1px solid ${C.borderSoft}`,background:"transparent",color:C.inkFaint,fontFamily:FM,letterSpacing:"0.1em",textTransform:"uppercase",cursor:"pointer"}}>Dismiss</button>
                <button onClick={()=>{setChatIn("Help me plan something for "+b.name+"'s "+b.type+" on "+b.next);setView("chat");}} style={{fontSize:10,padding:"6px 12px",borderRadius:3,border:`1px solid ${C.sapphire}`,background:C.sapphireBg,color:C.sapphire,fontFamily:FM,letterSpacing:"0.1em",textTransform:"uppercase",cursor:"pointer"}}>✦ Ask Eleanor</button>
              </div>
            </div>);
          })}
        </div>);})()}

        {briefing.alerts?.length>0&&<div style={{marginBottom:18}}><div style={SL}>Alerts & Flags — tap any to ask Eleanor</div>{briefing.alerts.map((a,i)=><div key={i} onClick={()=>{setChatIn("Tell me more about: "+a.title);setView("chat");}} style={{background:sevBg(a.severity),border:`1px solid ${sevColor(a.severity)}30`,borderLeft:`4px solid ${sevColor(a.severity)}`,padding:"13px 16px",marginBottom:8,borderRadius:3,cursor:"pointer",position:"relative"}}><div style={{fontSize:14,fontFamily:FD,color:sevColor(a.severity),marginBottom:4,fontWeight:500}}>{a.title}</div><div style={{fontSize:12,color:C.inkLight,fontFamily:FB,lineHeight:1.6}}>{a.detail}</div><div style={{position:"absolute",top:10,right:12,fontSize:10,color:sevColor(a.severity),fontFamily:FM,opacity:0.6}}>tap to ask →</div></div>)}</div>}
        {briefing.holiday_advice?.length>0&&<div style={{marginBottom:18}}><div style={SL}>Holiday Intelligence</div>{briefing.holiday_advice.map((h,i)=><div key={i} style={{background:C.card,border:`1px solid ${C.borderSoft}`,borderLeft:`4px solid ${C.goldBorder}`,padding:"13px 16px",marginBottom:8,borderRadius:3,cursor:"pointer",boxShadow:`0 1px 6px ${C.shadow}`}} onClick={()=>setBriefExp(briefExp===`h${i}`?null:`h${i}`)}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><div style={{fontSize:15,fontFamily:FD,color:C.ink}}>{h.holiday}</div><div style={{display:"flex",alignItems:"center",gap:10}}><div style={{textAlign:"right"}}><div style={{fontSize:18,fontFamily:FD,color:h.days_until<=14?C.crimson:h.days_until<=30?C.gold:C.inkFaint,fontWeight:300,lineHeight:1}}>{h.days_until}</div><div style={{fontSize:9,color:C.inkFaint,fontFamily:FM}}>days</div></div><div style={{fontSize:10,color:C.inkFaint,fontFamily:FM}}>{briefExp===`h${i}`?"▲":"▼"}</div></div></div><div style={{fontSize:10,color:C.inkFaint,fontFamily:FM,marginTop:3}}>{h.date_range}</div>{briefExp===`h${i}`&&<div style={{fontSize:13,color:C.inkMid,fontFamily:FB,lineHeight:1.65,marginTop:10,paddingTop:10,borderTop:`1px solid ${C.borderSoft}`}}>{h.advice}</div>}</div>)}</div>}
        {briefing.opportunities?.length>0&&<div style={{marginBottom:18}}><div style={SL}>Opportunities — tap any to ask Eleanor</div>{briefing.opportunities.map((o,i)=><div key={i} onClick={()=>{setChatIn("Help me with this opportunity: "+o.title);setView("chat");}} style={{background:C.emeraldBg,border:`1px solid ${C.emerald}30`,borderLeft:`4px solid ${C.emerald}`,padding:"13px 16px",marginBottom:8,borderRadius:3,cursor:"pointer",position:"relative"}}><div style={{fontSize:14,fontFamily:FD,color:C.emerald,marginBottom:4,fontWeight:500}}>{o.title}</div><div style={{fontSize:12,color:C.inkLight,fontFamily:FB,lineHeight:1.6}}>{o.detail}</div><div style={{position:"absolute",top:10,right:12,fontSize:10,color:C.emerald,fontFamily:FM,opacity:0.6}}>tap to ask →</div></div>)}</div>}
        {briefing.recommendations?.length>0&&<div style={{marginBottom:18}}><div style={SL}>Recommendations — tap any to ask Eleanor</div>{briefing.recommendations.map((r,i)=><div key={i} onClick={()=>{setChatIn("Help me with: "+r.title);setView("chat");}} style={{background:C.card,border:`1px solid ${C.borderSoft}`,padding:"13px 16px",marginBottom:8,borderRadius:3,display:"flex",gap:14,alignItems:"flex-start",boxShadow:`0 1px 6px ${C.shadow}`,cursor:"pointer",position:"relative"}}><div style={{fontSize:20,color:C.goldBright,fontFamily:FD,lineHeight:1,paddingTop:2,minWidth:20,textAlign:"center",fontWeight:300}}>{i+1}</div><div><div style={{fontSize:14,fontFamily:FD,color:C.ink,marginBottom:4}}>{r.title}</div><div style={{fontSize:12,color:C.inkLight,fontFamily:FB,lineHeight:1.6}}>{r.detail}</div></div><div style={{position:"absolute",top:10,right:12,fontSize:10,color:C.inkFaint,fontFamily:FM}}>tap →</div></div>)}</div>}
        <button style={goldBtn(true)} onClick={()=>{setBriefing(null);generateBriefing();}}>↺ Refresh Briefing</button>
      </div>}
    </div>
  );

  /* ── IMPORT VIEW ── */
  const ImportView=()=>(
    <div>
      <div style={SL}>Import Appointments</div>

      {/* Add a note for Eleanor - uncontrolled to prevent typing lag */}
      <div style={{background:C.goldPale,border:`1px solid ${C.goldBorder}`,borderRadius:6,padding:"12px 14px",marginBottom:16}}>
        <div style={{fontSize:12,color:C.inkMid,fontFamily:FD,fontStyle:"italic",marginBottom:6}}>📝 Add a note (optional)</div>
        <div style={{fontSize:11,color:C.inkLight,fontFamily:FB,marginBottom:8,lineHeight:1.5}}>Tell Eleanor anything the screenshot doesn't say. She'll use this to label and save the appointment correctly.</div>
        <textarea
          id="import-context-input"
          style={{width:"100%",padding:"9px 12px",borderRadius:3,border:`1px solid ${C.border}`,fontSize:12,background:C.card,color:C.ink,fontFamily:FB,outline:"none",boxSizing:"border-box",minHeight:60,resize:"vertical"}}
          placeholder={"e.g. 'This is a blood test appointment' · 'This is Maleeka's hospital visit' · 'Save this as my PIP review' · 'This appointment is at Hinchingbrooke'"}
          defaultValue={importContext}
          onBlur={e=>{setImportContext(e.target.value);importContextRef.current=e.target.value;}}
        />
      </div>

      {/* visual method picker */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:20}} key="import-grid">
        {[{type:"text",label:"Paste Text",sub:"Any text or message",tab:"text"},{type:"image",label:"Screenshot",sub:"Photo or image",tab:"image"},{type:"email",label:"Paste Email",sub:"Forward any email",tab:"email"},{type:"text",label:"Paste Link",sub:"Event URL",tab:"link"},{type:"text",label:"Handle This",sub:"Eleanor drafts it",tab:"handle"},{type:"image",label:"Explain Document",sub:"PDF, Word or letter",tab:"doc"},{type:"text",label:"Voice",sub:"Speak to Eleanor",tab:"voice"},{type:"image",label:"Upload PDF",sub:"Extract from PDF",tab:"pdf"}].map(m=>(
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
        <div style={{flex:1,height:1,background:C.borderSoft}}/><div style={{fontSize:9,color:C.inkFaint,fontFamily:FM,letterSpacing:"0.15em"}}>{impTab?.toUpperCase()}</div><div style={{flex:1,height:1,background:C.borderSoft}}/>
      </div>

      {impTab==="text"&&<div>
        <div style={{fontSize:13,color:C.inkLight,fontFamily:FB,lineHeight:1.75,marginBottom:14}}>Paste any text — an email, WhatsApp conversation, a list of dates. Eleanor will identify all commitments automatically.</div>
        <textarea
          id="paste-text-input"
          style={{...inp,minHeight:150,resize:"vertical"}}
          defaultValue={pasteText}
          onChange={e=>{setPasteText(e.target.value);}}
          placeholder={"e.g. 'Dentist Thursday 14th at 2:30pm'\nor paste a full email confirmation\nor 'Can you do school pickup Monday at 3:30?'"}
        />
        <button style={goldBtn()} onClick={()=>{
          const el=document.getElementById("paste-text-input");
          if(el)setPasteText(el.value);
          parsePaste();
        }} disabled={pasteBusy}>{pasteBusy?"Analysing…":"Extract Appointments"}</button>
        <ResultPreview result={pasteRes} onAdd={()=>{addEvs(pasteRes.events,"text");setPasteRes(null);setPasteText("");setCriticalOnly(false);setView("home");}} onDiscard={()=>setPasteRes(null)}/>
      </div>}
      {impTab==="image"&&<div>
        <div style={{fontSize:13,color:C.inkLight,fontFamily:FB,lineHeight:1.75,marginBottom:14}}>Upload <strong>any image or PDF</strong> — a poster, flyer, ticket, booking confirmation, screenshot, letter, or a school calendar PDF. Eleanor will read the whole thing (every page of a PDF) and extract every date, time, and location she can find.</div>
        <label style={{display:"block",border:`1.5px dashed ${C.goldBorder}`,padding:"32px 20px",textAlign:"center",cursor:"pointer",marginBottom:12,background:C.cardWarm,color:C.gold,fontSize:13,fontFamily:FB,letterSpacing:"0.06em",borderRadius:6}}>
          {imgFile?.type==="application/pdf"?"✦ PDF ready ("+imgFile.name+") — tap Extract below":imgPrev?"✦ Image ready — tap Extract below":"📸 Tap to upload — poster, ticket, flyer, screenshot, letter, PDF…"}
          <input type="file" accept="image/*,application/pdf,.pdf" multiple onChange={handleImgMultiple} style={{display:"none"}}/>
        </label>
        {imgPrev&&imgFile?.type!=="application/pdf"&&<img src={imgPrev} alt="Preview" style={{width:"100%",marginBottom:8,maxHeight:220,objectFit:"contain",border:`1px solid ${C.border}`,background:C.parchment,borderRadius:4}}/>}
        {imgFile?.type==="application/pdf"&&<div style={{padding:"14px",marginBottom:8,background:C.parchment,border:`1px solid ${C.border}`,borderRadius:4,textAlign:"center",fontSize:13,fontFamily:FB,color:C.inkMid}}>📄 {imgFile.name}</div>}
        {imgFile&&<div style={{display:"flex",justifyContent:"flex-end",marginBottom:12}}>
          <button onClick={()=>{setImgFile(null);setImgPrev(null);setImgB64(null);setImgRes(null);setMultiImgQueue([]);setImgEventEdit(null);}} style={{background:"none",border:`1px solid ${C.borderSoft}`,borderRadius:3,padding:"6px 14px",color:C.inkLight,fontFamily:FM,fontSize:9,letterSpacing:"0.1em",textTransform:"uppercase",cursor:"pointer"}}>✕ Clear / Choose Different File</button>
        </div>}
        {imgFile&&<button style={goldBtn()} onClick={parseImg} disabled={imgBusy}>{imgBusy?(imgFile?.type==="application/pdf"?"Reading PDF…":"Reading image…"):"Extract Appointments"}</button>}
        {imgRes&&!imgRes.error&&imgRes.summary&&<div style={{border:`1px solid ${C.emerald}40`,background:C.emeraldBg,padding:"13px 16px",marginBottom:14,fontSize:13,color:C.emerald,fontFamily:FB,borderRadius:4,borderLeft:`4px solid ${C.emerald}`,lineHeight:1.6}}>✦ {imgRes.summary}</div>}
        {imgRes?.error&&<div style={{border:`1px solid ${C.crimson}`,background:C.crimsonBg,padding:"14px 16px",marginTop:8,fontSize:13,color:C.crimson,fontFamily:FB,borderRadius:4,lineHeight:1.6}}><div style={{fontWeight:600,marginBottom:4}}>⚠ Could not extract</div><div>{imgRes.msg||"Please try again."}</div></div>}
        {imgRes&&!imgRes.error&&imgRes.events?.length>0&&<div>
          <div style={{fontSize:9,color:C.gold,letterSpacing:"0.25em",textTransform:"uppercase",fontFamily:FM,marginBottom:6}}>{imgRes.events.length} Events Found</div>
          <div style={{fontSize:11,color:C.inkLight,fontFamily:FB,marginBottom:12,fontStyle:"italic"}}>Tap any event to edit it, or ✕ to remove ones you don't need. Then add only the ones you want.</div>
          {imgRes.events.map((e,i)=>{const p=PM[e.priority]||PM.medium;return(
            <div key={i} style={{background:C.card,border:`1px solid ${C.borderSoft}`,borderLeft:`4px solid ${p.color}`,padding:"12px 15px",marginBottom:7,borderRadius:4}}>
              {imgEventEdit===i?(
                <div>
                  <input defaultValue={e.title} onChange={ev=>{const arr=[...imgRes.events];arr[i]={...arr[i],title:ev.target.value};setImgRes({...imgRes,events:arr});}} style={{...inp,marginBottom:6}} placeholder="Title"/>
                  <div style={{display:"flex",gap:6}}>
                    <input type="date" defaultValue={e.date} onChange={ev=>{const arr=[...imgRes.events];arr[i]={...arr[i],date:ev.target.value};setImgRes({...imgRes,events:arr});}} style={{...inp,flex:1,marginBottom:6}}/>
                    <input type="time" defaultValue={e.time} onChange={ev=>{const arr=[...imgRes.events];arr[i]={...arr[i],time:ev.target.value};setImgRes({...imgRes,events:arr});}} style={{...inp,flex:1,marginBottom:6}}/>
                  </div>
                  <input defaultValue={e.notes||""} onChange={ev=>{const arr=[...imgRes.events];arr[i]={...arr[i],notes:ev.target.value};setImgRes({...imgRes,events:arr});}} style={{...inp,marginBottom:8}} placeholder="Notes (optional)"/>
                  <button onClick={()=>setImgEventEdit(null)} style={goldBtn()}>✓ Done</button>
                </div>
              ):(
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8}}>
                  <div style={{flex:1,cursor:"pointer"}} onClick={()=>setImgEventEdit(i)}>
                    <div style={{fontSize:10,color:C.gold,fontFamily:FM,marginBottom:2}}>{e.date} · {e.time}</div>
                    <div style={{fontSize:14,fontFamily:FD,color:C.ink,marginBottom:3}}>{e.title}</div>
                    {e.notes&&<div style={{fontSize:11,color:C.inkLight,marginBottom:5,lineHeight:1.5}}>{e.notes}</div>}
                    <span style={chip(p.color,p.bg)}>{p.glyph} {p.label}</span>
                    <span style={{fontSize:9,color:C.gold,fontFamily:FM,marginLeft:8,letterSpacing:"0.1em",textTransform:"uppercase"}}>tap to edit</span>
                  </div>
                  <button onClick={()=>{const arr=imgRes.events.filter((_,j)=>j!==i);setImgRes({...imgRes,events:arr});}} style={{background:"none",border:"none",color:C.inkFaint,cursor:"pointer",fontSize:15,flexShrink:0,padding:"2px 4px"}}>✕</button>
                </div>
              )}
            </div>
          );})}
          <div style={{height:8}}/>
          <button style={goldBtn()} onClick={()=>{addEvs(imgRes.events,"image");setImgRes(null);setImgFile(null);setImgPrev(null);setImgEventEdit(null);setCriticalOnly(false);setView("home");}}>Add {imgRes.events.length} Event{imgRes.events.length!==1?"s":""} to Schedule</button>
          <button style={goldBtn(true)} onClick={()=>{setImgRes(null);setImgFile(null);setImgPrev(null);setImgEventEdit(null);}}>Discard All</button>
        </div>}
      </div>}
      {impTab==="doc"&&<div>
        <div style={{fontSize:13,color:C.inkLight,fontFamily:FB,lineHeight:1.75,marginBottom:14}}>Upload any document — benefit letters, tenancy agreements, contracts, terms and conditions, NHS letters. Eleanor explains it in plain English and highlights what's important.</div>
        <label style={{display:"block",border:`1.5px dashed ${C.goldBorder}`,padding:"28px 20px",textAlign:"center",cursor:"pointer",marginBottom:12,background:C.cardWarm,color:C.gold,fontSize:13,fontFamily:FB,borderRadius:6}}>
          {docFile?"✦ "+docFile.name+" — tap Extract below":"📄 Tap to upload PDF or Word document"}
          <input type="file" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={e=>{if(e.target.files[0]){setDocFile(e.target.files[0]);setDocRes(null);}}} style={{display:"none"}}/>
        </label>
        {docFile&&<button style={goldBtn()} onClick={parseDoc} disabled={docBusy}>{docBusy?"Reading document…":"Extract from Document"}</button>}
        {docRes?.error&&<div style={{border:`1px solid ${C.crimson}`,background:C.crimsonBg,padding:"12px",fontSize:13,color:C.crimson,fontFamily:FB,borderRadius:4,marginTop:8}}>{docRes.msg}</div>}
        {docRes&&!docRes.error&&<div style={{marginTop:12}}>
          {/* Document type badge */}
          {docRes.document_type&&<div style={{fontSize:9,color:C.gold,fontFamily:FM,letterSpacing:"0.2em",textTransform:"uppercase",marginBottom:10}}>📄 {docRes.document_type}</div>}

          {/* Summary */}
          {docRes.summary&&<div style={{border:`1px solid ${C.emerald}40`,background:C.emeraldBg,padding:"12px",marginBottom:12,fontSize:13,color:C.emerald,fontFamily:FB,borderRadius:4,borderLeft:`4px solid ${C.emerald}`}}>✦ {docRes.summary}</div>}

          {/* Plain English explanation */}
          {docRes.plain_english&&<div style={{marginBottom:14}}>
            <div style={SL}>Eleanor Explains</div>
            <div style={{background:C.card,border:`1px solid ${C.borderSoft}`,borderRadius:6,padding:"14px 16px",fontSize:13,color:C.inkMid,fontFamily:FB,lineHeight:1.75,borderLeft:`4px solid ${C.goldBorder}`}}>
              {docRes.plain_english}
            </div>
          </div>}

          {/* Important points */}
          {docRes.important_points?.length>0&&<div style={{marginBottom:14}}>
            <div style={SL}>Important Points</div>
            {docRes.important_points.map((p,i)=>{
              const typeStyle={
                warning:{bg:C.crimsonBg,border:C.crimson,icon:"⚠"},
                deadline:{bg:C.goldPale,border:C.goldBorder,icon:"📅"},
                money:{bg:C.emeraldBg,border:C.emerald,icon:"💰"},
                right:{bg:C.sapphireBg,border:C.sapphire,icon:"✓"},
                info:{bg:C.parchment,border:C.border,icon:"•"},
              }[p.type]||{bg:C.parchment,border:C.border,icon:"•"};
              return(
                <div key={i} style={{display:"flex",gap:10,padding:"10px 13px",background:typeStyle.bg,border:`1px solid ${typeStyle.border}30`,borderLeft:`3px solid ${typeStyle.border}`,borderRadius:3,marginBottom:6}}>
                  <span style={{fontSize:14,flexShrink:0}}>{typeStyle.icon}</span>
                  <span style={{fontSize:13,color:C.inkMid,fontFamily:FB,lineHeight:1.5}}>{p.point}</span>
                </div>
              );
            })}
          </div>}

          {/* Key info */}
          {docRes.key_info?.length>0&&<div style={{marginBottom:12}}>
            <div style={SL}>Key Details</div>
            {docRes.key_info.map((k,i)=>(
              <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"8px 12px",background:C.card,border:`1px solid ${C.borderSoft}`,borderRadius:3,marginBottom:4}}>
                <span style={{fontSize:12,color:C.inkLight,fontFamily:FB}}>{k.label}</span>
                <span style={{fontSize:12,color:C.ink,fontFamily:FD,fontWeight:500}}>{k.value}</span>
              </div>
            ))}
          </div>}

          {/* Action items */}
          {docRes.actions?.length>0&&<div style={{marginBottom:12}}>
            <div style={SL}>What You Need to Do</div>
            {docRes.actions.map((a,i)=>(
              <div key={i} style={{padding:"9px 12px",background:C.goldPale,border:`1px solid ${C.goldBorder}`,borderLeft:`4px solid ${C.gold}`,borderRadius:3,marginBottom:5}}>
                <div style={{fontSize:13,color:C.inkMid,fontFamily:FB}}>→ {a.text}</div>
                {a.deadline&&<div style={{fontSize:10,color:C.gold,fontFamily:FM,marginTop:2}}>By: {a.deadline}</div>}
              </div>
            ))}
          </div>}

          {/* Dates */}
          {docRes.events?.length>0&&<div style={{marginBottom:8}}>
            <div style={SL}>{docRes.events.length} Important Dates</div>
            {docRes.events.map((e,i)=>{const p=PM[e.priority]||PM.medium;return(
              <div key={i} style={{background:C.card,border:`1px solid ${C.borderSoft}`,borderLeft:`4px solid ${C.goldBorder}`,padding:"11px 14px",marginBottom:6,borderRadius:4}}>
                <div style={{fontSize:10,color:C.gold,fontFamily:FM,marginBottom:2}}>{e.date} · {e.time}</div>
                <div style={{fontSize:14,fontFamily:FD,color:C.ink,marginBottom:2}}>{e.title}</div>
                {e.notes&&<div style={{fontSize:11,color:C.inkLight}}>{e.notes}</div>}
              </div>
            );})}
            <div style={{height:8}}/>
            <button style={goldBtn()} onClick={()=>{addEvs(docRes.events,"document");setDocRes(null);setDocFile(null);setCriticalOnly(false);setView("home");}}>Add Dates to Schedule</button>
          </div>}

          <button style={goldBtn(true)} onClick={()=>{setDocRes(null);setDocFile(null);}}>Clear</button>
        </div>}
      </div>}

      {impTab==="handle"&&<div>
        <div style={{fontSize:13,color:C.inkLight,fontFamily:FB,lineHeight:1.75,marginBottom:14}}>Describe a difficult situation — Eleanor drafts a professional letter or email for you to send.</div>
        <div style={{background:C.goldPale,border:`1px solid ${C.goldBorder}`,borderRadius:6,padding:"12px 14px",marginBottom:12}}>
          <div style={{fontSize:11,color:C.inkLight,fontFamily:FB,lineHeight:1.7}}>
            Examples: <em>"Chase my PIP review that's been delayed 3 months"</em> · <em>"Complain about my energy bill being too high"</em> · <em>"Request a refund from a company"</em> · <em>"Write to my landlord about repairs needed"</em>
          </div>
        </div>
        <textarea id="handle-textarea" style={{...inp,minHeight:120,resize:"vertical"}} defaultValue={handleText} placeholder="Describe what you need Eleanor to handle..." onBlur={e=>setHandleText(e.target.value)}/>
        <label style={{display:"block",border:`1.5px dashed ${C.borderSoft}`,padding:"12px",textAlign:"center",cursor:"pointer",marginBottom:12,background:C.card,color:handleDocFile?C.emerald:C.inkFaint,fontSize:12,fontFamily:FB,borderRadius:4}}>
          {handleDocFile?"📄 "+handleDocFile.name+" — ready":"📎 Optional: upload a document (PDF, letter, bill...)"}
          <input type="file" accept=".pdf,.doc,.docx,image/*" onChange={e=>{if(e.target.files[0])setHandleDocFile(e.target.files[0]);}} style={{display:"none"}}/>
        </label>
        {handleDocFile&&<button onClick={()=>setHandleDocFile(null)} style={{background:"none",border:"none",color:C.inkFaint,fontFamily:FM,fontSize:10,cursor:"pointer",marginBottom:8,letterSpacing:"0.1em",textTransform:"uppercase"}}>✕ Remove document</button>}
        <button style={goldBtn()} onClick={()=>{const el=document.getElementById("handle-textarea");if(el)setHandleText(el.value);handleThis();}} disabled={handleBusy}>{handleBusy?"Drafting…":"✦ Handle This for Me"}</button>
        {handleRes&&typeof handleRes==="string"&&!handleRes.startsWith("Error")&&<div style={{marginTop:14}}>
          <div style={SL}>Eleanor's Draft</div>
          <div style={{background:C.card,border:`1px solid ${C.borderSoft}`,borderRadius:6,padding:"16px",whiteSpace:"pre-wrap",fontSize:13,fontFamily:FB,color:C.inkMid,lineHeight:1.8,marginBottom:12}}>{handleRes}</div>
          <button style={goldBtn()} onClick={()=>{navigator.clipboard?.writeText(handleRes);alert("Copied to clipboard!");}}>Copy to Clipboard</button>
          <button style={goldBtn(true)} onClick={()=>{setHandleRes(null);setHandleText("");}}>Clear</button>
        </div>}
        {handleRes?.startsWith?.("Error")&&<div style={{border:`1px solid ${C.crimson}`,background:C.crimsonBg,padding:"12px",fontSize:13,color:C.crimson,fontFamily:FB,borderRadius:4,marginTop:8}}>{handleRes}</div>}
      </div>}

      {impTab==="voice"&&<div>
        <div style={{fontSize:13,color:C.inkLight,fontFamily:FB,lineHeight:1.75,marginBottom:14}}>Speak your appointments and Eleanor will transcribe and extract them.</div>
        <div style={{textAlign:"center",marginBottom:20}}>
          <button onClick={()=>startVoice(text=>{setPasteText(text);setImpTab("text");})} style={{width:100,height:100,borderRadius:"50%",border:`3px solid ${voiceListening?C.crimson:C.goldBorder}`,background:voiceListening?C.crimsonBg:C.goldPale,cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:6,margin:"0 auto",boxShadow:voiceListening?`0 0 20px ${C.crimson}40`:`0 4px 16px ${C.shadow}`,transition:"all 0.3s"}}>
            <span style={{fontSize:32}}>{voiceListening?"🔴":"🎙️"}</span>
            <span style={{fontSize:9,fontFamily:FM,letterSpacing:"0.12em",textTransform:"uppercase",color:voiceListening?C.crimson:C.gold}}>{voiceListening?"Listening…":"Tap to Speak"}</span>
          </button>
        </div>
        {voiceListening&&<div style={{textAlign:"center",color:C.crimson,fontFamily:FM,fontSize:10,letterSpacing:"0.2em",textTransform:"uppercase",marginBottom:16}} className="shimmer">Listening — speak clearly…</div>}
        {voiceText&&<div style={{background:C.card,border:`1px solid ${C.borderSoft}`,borderRadius:4,padding:"12px 14px",marginBottom:12}}>
          <div style={{fontSize:9,color:C.gold,fontFamily:FM,letterSpacing:"0.2em",textTransform:"uppercase",marginBottom:6}}>Eleanor heard</div>
          <div style={{fontSize:14,fontFamily:FD,color:C.ink,fontStyle:"italic",lineHeight:1.6}}>"{voiceText}"</div>
        </div>}
        {voiceText&&<button style={goldBtn()} onClick={()=>{setPasteText(voiceText);setImpTab("text");}}>Extract Appointments from Voice</button>}
        <div style={{marginTop:16,background:C.goldPale,border:`1px solid ${C.goldBorder}`,borderRadius:6,padding:"12px 14px"}}>
          <div style={{fontSize:12,color:C.inkLight,fontFamily:FB,lineHeight:1.7}}>
            Try saying: <em>"Dentist appointment Thursday 19th June at 2:30pm"</em> or <em>"School play next Friday at 6pm, Doddington Primary"</em>
          </div>
        </div>
      </div>}

      {impTab==="pdf"&&<div>
        <div style={{fontSize:13,color:C.inkLight,fontFamily:FB,lineHeight:1.75,marginBottom:14}}>Upload any PDF — invoices, appointment letters, contracts, statements. Eleanor extracts all key dates, amounts and actions.</div>
        <label style={{display:"block",border:`1.5px dashed ${C.goldBorder}`,padding:"32px 20px",textAlign:"center",cursor:"pointer",marginBottom:12,background:C.cardWarm,color:C.gold,fontSize:13,fontFamily:FB,borderRadius:6}}>
          {pdfFile?"✦ "+pdfFile.name+" — tap Extract below":"📄 Tap to upload a PDF"}
          <input type="file" accept="application/pdf,.pdf" onChange={e=>{if(e.target.files[0]){setPdfFile(e.target.files[0]);setPdfRes(null);}}} style={{display:"none"}}/>
        </label>
        {pdfFile&&<button style={goldBtn()} onClick={parsePdf} disabled={pdfBusy}>{pdfBusy?"Reading PDF…":"Extract from PDF"}</button>}
        {pdfRes?.error&&<div style={{border:`1px solid ${C.crimson}`,background:C.crimsonBg,padding:"12px",fontSize:13,color:C.crimson,fontFamily:FB,borderRadius:4,marginTop:8}}>{pdfRes.msg}</div>}
        {pdfRes&&!pdfRes.error&&<div style={{marginTop:12}}>
          {pdfRes.summary&&<div style={{border:`1px solid ${C.emerald}40`,background:C.emeraldBg,padding:"12px",marginBottom:10,fontSize:13,color:C.emerald,fontFamily:FB,borderRadius:4,borderLeft:`4px solid ${C.emerald}`}}>✦ {pdfRes.summary}</div>}
          {pdfRes.key_info?.length>0&&<div style={{marginBottom:10}}>
            <div style={SL}>Key Information</div>
            {pdfRes.key_info.map((k,i)=>(
              <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"8px 12px",background:C.card,border:`1px solid ${C.borderSoft}`,borderRadius:3,marginBottom:4}}>
                <span style={{fontSize:12,color:C.inkLight,fontFamily:FB}}>{k.label}</span>
                <span style={{fontSize:12,color:C.ink,fontFamily:FD,fontWeight:500}}>{k.value}</span>
              </div>
            ))}
          </div>}
          {pdfRes.actions?.length>0&&<div style={{marginBottom:10}}>
            <div style={SL}>Action Items</div>
            {pdfRes.actions.map((a,i)=>(
              <div key={i} style={{padding:"9px 12px",background:C.goldPale,border:`1px solid ${C.goldBorder}`,borderLeft:`4px solid ${C.gold}`,borderRadius:3,marginBottom:5}}>
                <div style={{fontSize:13,color:C.inkMid,fontFamily:FB}}>→ {a.text}</div>
                {a.deadline&&<div style={{fontSize:10,color:C.gold,fontFamily:FM,marginTop:2}}>By: {a.deadline}</div>}
              </div>
            ))}
          </div>}
          {pdfRes.events?.length>0&&<div>
            <div style={SL}>{pdfRes.events.length} Dates Found</div>
            {pdfRes.events.map((e,i)=>{const p=PM[e.priority]||PM.medium;return(
              <div key={i} style={{background:C.card,border:`1px solid ${C.borderSoft}`,borderLeft:`4px solid ${C.goldBorder}`,padding:"11px 14px",marginBottom:6,borderRadius:4}}>
                <div style={{fontSize:10,color:C.gold,fontFamily:FM,marginBottom:2}}>{e.date} · {e.time}</div>
                <div style={{fontSize:14,fontFamily:FD,color:C.ink,marginBottom:2}}>{e.title}</div>
                {e.notes&&<div style={{fontSize:11,color:C.inkLight}}>{e.notes}</div>}
              </div>
            );})}
            <div style={{height:8}}/>
            <button style={goldBtn()} onClick={()=>{addEvs(pdfRes.events,"pdf");setPdfRes(null);setPdfFile(null);setCriticalOnly(false);setView("home");}}>Add to Schedule</button>
            <button style={goldBtn(true)} onClick={()=>{setPdfRes(null);setPdfFile(null);}}>Clear</button>
          </div>}
        </div>}
      </div>}

      {impTab==="finance"&&<div>
        <div style={{background:C.goldPale,border:`1px solid ${C.goldBorder}`,borderLeft:`4px solid ${C.gold}`,borderRadius:6,padding:"12px 16px",marginBottom:16}}>
          <div style={{fontSize:13,fontFamily:FD,color:C.gold,fontStyle:"italic",marginBottom:4}}>✦ Financial Planning with Eleanor</div>
          <div style={{fontSize:12,color:C.inkMid,fontFamily:FB,lineHeight:1.6}}>Paste your financial plan, investment strategy, budget or statement below. Eleanor will analyse it and give you personalised advice, action steps and calendar reminders.</div>
        </div>

        {/* Paste text */}
        <textarea id="fin-plan-textarea" style={{...inp,minHeight:140,resize:"vertical",marginBottom:6}}
          placeholder={"Paste your financial plan, investment details, budget or statement here...\ne.g. VUSA ETF plan, ISA strategy, monthly budget, bank statement"}
          defaultValue={finPlanText}
          onBlur={e=>setFinPlanText(e.target.value)}
        />
        <div style={{display:"flex",justifyContent:"flex-end",marginBottom:10}}>
          <button onClick={()=>{setFinPlanText("");setFinPlanRes(null);setFinPlanNote("");const el=document.getElementById("fin-plan-textarea");if(el)el.value="";const nl=document.getElementById("fin-plan-note");if(nl)nl.value="";}} style={{background:"none",border:`1px solid ${C.borderSoft}`,borderRadius:3,padding:"5px 12px",color:C.inkLight,fontFamily:FM,fontSize:9,letterSpacing:"0.1em",textTransform:"uppercase",cursor:"pointer"}}>✕ Clear Text</button>
        </div>

        {/* Or upload PDF/statement */}
        <div style={{display:"flex",alignItems:"center",gap:8,margin:"10px 0"}}>
          <div style={{flex:1,height:1,background:C.borderSoft}}/>
          <div style={{fontSize:9,color:C.inkFaint,fontFamily:FM,letterSpacing:"0.15em"}}>OR UPLOAD FILE</div>
          <div style={{flex:1,height:1,background:C.borderSoft}}/>
        </div>
        <label style={{display:"block",border:`1.5px dashed ${C.goldBorder}`,padding:"16px",textAlign:"center",cursor:"pointer",marginBottom:finPlanFile?6:12,background:C.cardWarm,color:finPlanFile?C.emerald:C.gold,fontSize:12,fontFamily:FB,borderRadius:6}}>
          {finPlanFile?"✦ "+finPlanFile.name:"📄 Upload PDF or screenshot (optional)"}
          <input type="file" accept="application/pdf,.pdf,image/*" onChange={async e=>{if(e.target.files[0]){const f=e.target.files[0];setFinPlanFile(f);const c=await compressImage(f);if(c)setFinPlanB64(c.b64);}}} style={{display:"none"}}/>
        </label>
        {finPlanFile&&<div style={{display:"flex",justifyContent:"flex-end",marginBottom:12}}>
          <button onClick={()=>{setFinPlanFile(null);setFinPlanB64(null);}} style={{background:"none",border:`1px solid ${C.borderSoft}`,borderRadius:3,padding:"5px 12px",color:C.inkLight,fontFamily:FM,fontSize:9,letterSpacing:"0.1em",textTransform:"uppercase",cursor:"pointer"}}>✕ Remove File</button>
        </div>}

        {/* Notes for Eleanor */}
        <div style={{background:C.goldPale,border:`1px solid ${C.goldBorder}`,borderRadius:6,padding:"12px 14px",marginBottom:12}}>
          <div style={{fontSize:12,color:C.inkMid,fontFamily:FD,fontStyle:"italic",marginBottom:6}}>📝 Add a note (optional)</div>
          <div style={{fontSize:11,color:C.inkLight,fontFamily:FB,marginBottom:8,lineHeight:1.5}}>Tell Eleanor anything the plan doesn't say — what's income, what's a bill, context she should know.</div>
          <textarea
            id="fin-plan-note"
            style={{width:"100%",padding:"9px 12px",borderRadius:3,border:`1px solid ${C.border}`,fontSize:12,background:C.card,color:C.ink,fontFamily:FB,outline:"none",boxSizing:"border-box",minHeight:54,resize:"vertical"}}
            placeholder={"e.g. 'The £48 from Rover is income, not a bill' · 'This £225 is my monthly investment going out' · 'The Nationwide figure is savings'"}
            defaultValue={finPlanNote}
            onBlur={e=>setFinPlanNote(e.target.value)}
          />
        </div>

        <button style={goldBtn()} onClick={()=>{const el=document.getElementById("fin-plan-textarea");if(el)setFinPlanText(el.value);const nl=document.getElementById("fin-plan-note");if(nl)setFinPlanNote(nl.value);analyseFinancialPlan();}} disabled={finPlanBusy}>
          {finPlanBusy?"Eleanor is analysing…":"✦ Analyse My Financial Plan"}
        </button>

        {finPlanBusy&&<div style={{textAlign:"center",padding:"20px",color:C.gold,fontFamily:FM,fontSize:10,letterSpacing:"0.2em",textTransform:"uppercase"}} className="shimmer">Eleanor is reviewing your plan…</div>}

        {finPlanRes?.error&&<div style={{border:`1px solid ${C.crimson}`,background:C.crimsonBg,padding:"12px",fontSize:13,color:C.crimson,fontFamily:FB,borderRadius:4,marginTop:8}}>Could not analyse the plan. Please try again.</div>}

        {finPlanRes&&!finPlanRes.error&&<div style={{marginTop:16}}>
          {/* Eleanor's personal advice */}
          {finPlanRes.eleanor_advice&&<div style={{background:C.card,border:`1px solid ${C.goldBorder}`,borderLeft:`4px solid ${C.gold}`,borderRadius:6,padding:"14px 16px",marginBottom:14}}>
            <div style={{fontSize:9,color:C.gold,fontFamily:FM,letterSpacing:"0.2em",textTransform:"uppercase",marginBottom:6}}>✦ Eleanor's Advice for You</div>
            <div style={{fontSize:14,color:C.ink,fontFamily:FB,lineHeight:1.7,fontStyle:"italic"}}>"{finPlanRes.eleanor_advice}"</div>
          </div>}

          {/* Monthly impact + save to finances */}
          {finPlanRes.monthly_impact?.amount&&<div style={{background:C.sapphireBg,border:`1px solid ${C.sapphire}30`,borderLeft:`4px solid ${C.sapphire}`,borderRadius:4,padding:"12px 14px",marginBottom:12}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
              <div>
                <div style={{fontSize:9,color:C.sapphire,fontFamily:FM,letterSpacing:"0.15em",textTransform:"uppercase"}}>Monthly Commitment</div>
                <div style={{fontFamily:FD,fontSize:18,color:C.ink}}>£{finPlanRes.monthly_impact.amount} {finPlanRes.monthly_impact.label||""}</div>
              </div>
            </div>
            <button onClick={()=>{
              setFinances(fs=>[...fs,{id:Date.now()+Math.random(),label:finPlanRes.monthly_impact.label||"Investment",amount:finPlanRes.monthly_impact.amount,date:fmt(today),type:(/income|earning|rover|wage|salary|benefit|allowance|received|saving/i.test((finPlanRes.monthly_impact.label||"")+" "+(finPlanNote||"")))?"income":"expense",notes:"From financial plan",status:"pending",source:"finplan"}]);
              alert("Saved to your Finances — it'll now show in your briefing and Finances section.");
            }} style={{width:"100%",padding:"9px",borderRadius:3,border:"none",background:`linear-gradient(135deg,${C.sapphire},${C.sapphire}cc)`,color:"#fff",fontFamily:FM,fontSize:9,letterSpacing:"0.12em",textTransform:"uppercase",cursor:"pointer"}}>💰 Save to My Finances</button>
          </div>}

          {/* Summary */}
          {finPlanRes.summary&&<div style={{background:C.emeraldBg,border:`1px solid ${C.emerald}30`,borderLeft:`4px solid ${C.emerald}`,borderRadius:4,padding:"12px 14px",marginBottom:12,fontSize:13,color:C.inkMid,fontFamily:FB,lineHeight:1.6}}>{finPlanRes.summary}</div>}

          {/* Risk + projected */}
          <div style={{display:"flex",gap:8,marginBottom:12}}>
            {finPlanRes.risk_level&&<div style={{flex:1,textAlign:"center",padding:"10px",background:finPlanRes.risk_level==="low"?C.emeraldBg:finPlanRes.risk_level==="medium"?C.goldPale:C.crimsonBg,borderRadius:4,border:`1px solid ${finPlanRes.risk_level==="low"?C.emerald:finPlanRes.risk_level==="medium"?C.goldBorder:C.crimson}30`}}>
              <div style={{fontSize:9,color:C.inkFaint,fontFamily:FM,letterSpacing:"0.15em",textTransform:"uppercase"}}>Risk Level</div>
              <div style={{fontSize:14,fontFamily:FD,color:C.ink,textTransform:"capitalize"}}>{finPlanRes.risk_level}</div>
            </div>}
            {finPlanRes.projected_value&&<div style={{flex:2,textAlign:"center",padding:"10px",background:C.goldPale,borderRadius:4,border:`1px solid ${C.goldBorder}30`}}>
              <div style={{fontSize:9,color:C.inkFaint,fontFamily:FM,letterSpacing:"0.15em",textTransform:"uppercase"}}>Projected Value</div>
              <div style={{fontSize:14,fontFamily:FD,color:C.gold}}>{finPlanRes.projected_value}</div>
            </div>}
          </div>

          {/* Positives */}
          {finPlanRes.positives?.length>0&&<div style={{marginBottom:12}}>
            <div style={SL}>✓ What's Good About This Plan</div>
            {finPlanRes.positives.map((p,i)=>(
              <div key={i} style={{padding:"8px 12px",background:C.emeraldBg,borderLeft:`3px solid ${C.emerald}`,borderRadius:3,marginBottom:5,fontSize:13,color:C.inkMid,fontFamily:FB,display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8}}><span style={{flex:1}}>✓ {p}</span><button onClick={()=>{const arr=finPlanRes.positives.filter((_,j)=>j!==i);setFinPlanRes({...finPlanRes,positives:arr});}} style={{background:"none",border:"none",color:C.inkFaint,cursor:"pointer",fontSize:12,flexShrink:0}}>✕</button></div>
            ))}
          </div>}

          {/* Considerations */}
          {finPlanRes.considerations?.length>0&&<div style={{marginBottom:12}}>
            <div style={SL}>⚠ Things to Be Aware Of</div>
            {finPlanRes.considerations.map((p,i)=>(
              <div key={i} style={{padding:"8px 12px",background:C.goldPale,borderLeft:`3px solid ${C.goldBorder}`,borderRadius:3,marginBottom:5,fontSize:13,color:C.inkMid,fontFamily:FB,display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8}}>
                <span style={{flex:1}}>⚠ {p}</span>
                <button onClick={()=>{const arr=finPlanRes.considerations.filter((_,j)=>j!==i);setFinPlanRes({...finPlanRes,considerations:arr});}} style={{background:"none",border:"none",color:C.inkFaint,cursor:"pointer",fontSize:12,flexShrink:0}}>✕</button>
              </div>
            ))}
          </div>}

          {/* Action steps */}
          {finPlanRes.action_steps?.length>0&&<div style={{marginBottom:12}}>
            <div style={SL}>What to Do Next</div>
            <div style={{fontSize:11,color:C.inkLight,fontFamily:FB,marginBottom:8,fontStyle:"italic"}}>Tap any step to edit or add your notes.</div>
            {finPlanRes.action_steps.map((a,i)=>{const col=a.priority==="high"?C.crimson:a.priority==="medium"?C.gold:C.emerald;return(
              <div key={i} style={{padding:"10px 12px",background:C.card,border:`1px solid ${C.borderSoft}`,borderLeft:`3px solid ${col}`,borderRadius:3,marginBottom:6}}>
                {finStepEdit===i?(
                  <div>
                    <textarea defaultValue={a.step} onChange={e=>{const arr=[...finPlanRes.action_steps];arr[i]={...arr[i],step:e.target.value};setFinPlanRes({...finPlanRes,action_steps:arr});}} style={{...inp,minHeight:50,marginBottom:6}} placeholder="Step"/>
                    <textarea defaultValue={a.answer||""} onChange={e=>{const arr=[...finPlanRes.action_steps];arr[i]={...arr[i],answer:e.target.value};setFinPlanRes({...finPlanRes,action_steps:arr});}} style={{...inp,minHeight:50,marginBottom:6}} placeholder="Your notes / answer (saved when you tap Done)"/>
                    <button onClick={()=>{setFinStepEdit(null);localStorage.setItem("papa_working_plan",JSON.stringify(finPlanRes));}} style={goldBtn()}>✓ Done & Save</button>
                  </div>
                ):(
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8}}>
                    <div style={{flex:1,cursor:"pointer"}} onClick={()=>setFinStepEdit(i)}>
                      <div style={{fontSize:13,color:C.ink,fontFamily:FB}}>→ {a.step}</div>
                      {a.when&&<div style={{fontSize:10,color:col,fontFamily:FM,marginTop:3}}>When: {a.when}</div>}
                      {a.answer&&<div style={{fontSize:12,color:C.emerald,fontFamily:FB,marginTop:4,padding:"6px 8px",background:C.emeraldBg,borderRadius:3}}>✓ {a.answer}</div>}
                      <div style={{fontSize:9,color:C.gold,fontFamily:FM,marginTop:3,letterSpacing:"0.1em",textTransform:"uppercase"}}>tap to edit / answer</div>
                    </div>
                    <button onClick={()=>{const arr=finPlanRes.action_steps.filter((_,j)=>j!==i);setFinPlanRes({...finPlanRes,action_steps:arr});}} style={{background:"none",border:"none",color:C.inkFaint,cursor:"pointer",fontSize:13,flexShrink:0}}>✕</button>
                  </div>
                )}
              </div>
            );})}
          </div>}

          {/* Questions to ask */}
          {finPlanRes.questions_to_ask?.length>0&&<div style={{marginBottom:12}}>
            <div style={SL}>Questions to Ask Your Platform</div>
            <div style={{fontSize:11,color:C.inkLight,fontFamily:FB,marginBottom:8,fontStyle:"italic"}}>Tap a question to write your answer — it saves with the plan.</div>
            {finPlanRes.questions_to_ask.map((q,i)=>{
              const qObj=typeof q==="string"?{question:q,answer:""}:q;
              return(
              <div key={i} style={{padding:"10px 12px",background:C.parchment,border:`1px solid ${C.borderSoft}`,borderRadius:3,marginBottom:6}}>
                {finQEdit===i?(
                  <div>
                    <div style={{fontSize:12,color:C.inkMid,fontFamily:FB,marginBottom:6}}>? {qObj.question}</div>
                    <textarea defaultValue={qObj.answer||""} onChange={e=>{const arr=[...finPlanRes.questions_to_ask];arr[i]={question:qObj.question,answer:e.target.value};setFinPlanRes({...finPlanRes,questions_to_ask:arr});}} style={{...inp,minHeight:54,marginBottom:6}} placeholder="Type your answer here..."/>
                    <button onClick={()=>{setFinQEdit(null);localStorage.setItem("papa_working_plan",JSON.stringify(finPlanRes));}} style={goldBtn()}>✓ Save Answer</button>
                  </div>
                ):(
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8}}>
                    <div style={{flex:1,cursor:"pointer"}} onClick={()=>setFinQEdit(i)}>
                      <div style={{fontSize:12,color:C.inkMid,fontFamily:FB}}>? {qObj.question}</div>
                      {qObj.answer&&<div style={{fontSize:12,color:C.emerald,fontFamily:FB,marginTop:4,padding:"6px 8px",background:C.emeraldBg,borderRadius:3}}>✓ {qObj.answer}</div>}
                      <div style={{fontSize:9,color:C.gold,fontFamily:FM,marginTop:3,letterSpacing:"0.1em",textTransform:"uppercase"}}>{qObj.answer?"tap to edit answer":"tap to answer"}</div>
                    </div>
                    <button onClick={()=>{const arr=finPlanRes.questions_to_ask.filter((_,j)=>j!==i);setFinPlanRes({...finPlanRes,questions_to_ask:arr});}} style={{background:"none",border:"none",color:C.inkFaint,cursor:"pointer",fontSize:13,flexShrink:0}}>✕</button>
                  </div>
                )}
              </div>
            );})}
          </div>}

          {/* Calendar reminders */}
          {finPlanRes.calendar_reminders?.length>0&&<div style={{marginBottom:12}}>
            <div style={SL}>📅 Add to Your Calendar</div>
            <div style={{fontSize:11,color:C.inkLight,fontFamily:FB,marginBottom:8,fontStyle:"italic"}}>Tap any reminder to edit it before adding.</div>
            {finPlanRes.calendar_reminders.map((r,i)=>(
              <div key={i} style={{padding:"10px 12px",background:C.card,border:`1px solid ${C.borderSoft}`,borderRadius:4,marginBottom:6}}>
                {finReminderEdit===i?(
                  <div>
                    <input defaultValue={r.title} onChange={e=>{const cr=[...finPlanRes.calendar_reminders];cr[i]={...cr[i],title:e.target.value};setFinPlanRes({...finPlanRes,calendar_reminders:cr});}} style={{...inp,marginBottom:6}} placeholder="Title"/>
                    <div style={{display:"flex",gap:6}}>
                      <input type="date" defaultValue={r.date} onChange={e=>{const cr=[...finPlanRes.calendar_reminders];cr[i]={...cr[i],date:e.target.value};setFinPlanRes({...finPlanRes,calendar_reminders:cr});}} style={{...inp,flex:1,marginBottom:6}}/>
                    </div>
                    <input defaultValue={r.notes||""} onChange={e=>{const cr=[...finPlanRes.calendar_reminders];cr[i]={...cr[i],notes:e.target.value};setFinPlanRes({...finPlanRes,calendar_reminders:cr});}} style={{...inp,marginBottom:8}} placeholder="Notes"/>
                    <div style={{display:"flex",gap:8}}>
                      <button onClick={()=>setFinReminderEdit(null)} style={goldBtn()}>✓ Done Editing</button>
                    </div>
                  </div>
                ):(
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div style={{flex:1}} onClick={()=>setFinReminderEdit(i)}>
                      <div style={{fontSize:13,fontFamily:FD,color:C.ink,cursor:"pointer"}}>{r.title}</div>
                      <div style={{fontSize:10,color:C.inkFaint,fontFamily:FM}}>{r.date}</div>
                      {r.notes&&<div style={{fontSize:11,color:C.inkLight,fontFamily:FB,marginTop:2}}>{r.notes}</div>}
                      <div style={{fontSize:9,color:C.gold,fontFamily:FM,marginTop:2,letterSpacing:"0.1em",textTransform:"uppercase"}}>tap to edit</div>
                    </div>
                    <div style={{display:"flex",gap:6,flexShrink:0,marginLeft:8}}>
                      <button onClick={()=>setFinReminderEdit(i)} style={{padding:"6px 10px",borderRadius:3,border:`1px solid ${C.goldBorder}`,background:C.goldPale,color:C.gold,fontFamily:FM,fontSize:9,cursor:"pointer"}}>✎</button>
                      <button onClick={()=>{if(r.date)addEvs([{title:r.title,date:r.date,time:"09:00",priority:"medium",notes:r.notes||"Financial reminder"}],"finance");}} style={{padding:"6px 12px",borderRadius:3,border:"none",background:`linear-gradient(135deg,${C.gold},${C.goldBright})`,color:C.card,fontFamily:FM,fontSize:9,letterSpacing:"0.1em",textTransform:"uppercase",cursor:"pointer"}}>＋ Add</button>
                      <button onClick={()=>{const arr=finPlanRes.calendar_reminders.filter((_,j)=>j!==i);setFinPlanRes({...finPlanRes,calendar_reminders:arr});}} style={{background:"none",border:"none",color:C.inkFaint,cursor:"pointer",fontSize:13}}>✕</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
            <button style={goldBtn()} onClick={()=>{if(finPlanRes.calendar_reminders?.length){addEvs(finPlanRes.calendar_reminders.filter(r=>r.date).map(r=>({title:r.title,date:r.date,time:"09:00",priority:"medium",notes:r.notes||""})),"finance");alert("All reminders added to your schedule!");}}}>Add All Reminders to Schedule</button>
          </div>}

          <button onClick={()=>{
            const saved=JSON.parse(localStorage.getItem("papa_saved_plans")||"[]");
            saved.unshift({id:Date.now(),date:new Date().toLocaleDateString("en-GB"),summary:finPlanRes.summary||"Financial plan",data:finPlanRes,planText:finPlanText||document.getElementById("fin-plan-textarea")?.value||""});
            safeSave("papa_saved_plans",JSON.stringify(saved.slice(0,20)));
            alert("Plan saved! You can find it in the Finances section — tap it to open the full plan.");
          }} style={{...goldBtn(),marginTop:8}}>💾 Save This Plan & Advice</button>
          <button onClick={()=>{setFinPlanRes(null);setFinPlanText("");setFinPlanFile(null);setFinPlanB64(null);const el=document.getElementById("fin-plan-textarea");if(el)el.value="";}} style={{background:"none",border:"none",color:C.inkFaint,fontFamily:FM,fontSize:9,cursor:"pointer",letterSpacing:"0.1em",textTransform:"uppercase",marginTop:8}}>Clear</button>
        </div>}
      </div>}

      {impTab==="link"&&<div>
        <div style={{fontSize:13,color:C.inkLight,fontFamily:FB,lineHeight:1.75,marginBottom:14}}>Paste a link to any event page — Eleanor will read it and extract the date, time, venue and price.</div>
        <input id="link-url-input" style={{...inp,marginBottom:8}} placeholder="https://..." defaultValue={linkUrl} onBlur={e=>setLinkUrl(e.target.value)}/>
        <button style={goldBtn()} onClick={()=>{const el=document.getElementById("link-url-input");if(el)setLinkUrl(el.value);readLink();}} disabled={linkBusy}>{linkBusy?"Reading page…":"Read Event from Link"}</button>
        {linkRes?.error&&<div style={{border:`1px solid ${C.crimson}`,background:C.crimsonBg,padding:"12px 16px",fontSize:13,color:C.crimson,fontFamily:FB,borderRadius:4,marginTop:8}}>{linkRes.msg}</div>}
        {linkRes&&!linkRes.error&&<div style={{marginTop:14}}>
          {linkRes.summary&&<div style={{border:`1px solid ${C.emerald}40`,background:C.emeraldBg,padding:"12px 16px",marginBottom:12,fontSize:13,color:C.emerald,fontFamily:FB,borderRadius:4,borderLeft:`4px solid ${C.emerald}`}}>✦ {linkRes.summary}</div>}
          {linkRes.venue&&<div style={{fontSize:12,color:C.inkLight,fontFamily:FB,marginBottom:6}}>📍 {linkRes.venue}</div>}
          {linkRes.price&&<div style={{fontSize:12,color:C.inkLight,fontFamily:FB,marginBottom:10}}>💰 {linkRes.price}</div>}
          {linkRes.events?.length>0&&linkRes.events.map((e,i)=>(
            <div key={i} style={{background:C.card,border:`1px solid ${C.borderSoft}`,borderLeft:`4px solid ${C.goldBorder}`,padding:"12px 15px",marginBottom:8,borderRadius:4}}>
              <div style={{fontSize:10,color:C.gold,fontFamily:FM,marginBottom:2}}>{e.date} · {e.time}</div>
              <div style={{fontSize:14,fontFamily:FD,color:C.ink,marginBottom:3}}>{e.title}</div>
              {e.notes&&<div style={{fontSize:11,color:C.inkLight,marginBottom:4}}>{e.notes}</div>}
            </div>
          ))}
          <div style={{display:"flex",gap:8,marginTop:8}}>
            <button style={goldBtn()} onClick={()=>{
              if(linkRes.events?.length){addEvs(linkRes.events,"link");}
              if(linkRes.events?.[0]){
                const e=linkRes.events[0];
                setWishlist(w=>[...w,{id:Date.now(),title:e.title,date:e.date,venue:linkRes.venue||"",price:linkRes.price||"",notes:e.notes||"",url:linkUrl}]);
              }
              setLinkRes(null);setLinkUrl("");setCriticalOnly(false);setView("home");
            }}>Add to Schedule</button>
            <button style={{...goldBtn(true),flex:"0 0 auto",width:"auto",padding:"12px 16px"}} onClick={()=>{
              if(linkRes.events?.[0]){
                const e=linkRes.events[0];
                setWishlist(w=>[...w,{id:Date.now(),title:e.title,date:e.date,venue:linkRes.venue||"",price:linkRes.price||"",notes:e.notes||"",url:linkUrl}]);
              }
              setLinkRes(null);setLinkUrl("");setView("wishlist");
            }}>Add to Wishlist</button>
          </div>
        </div>}
      </div>}

      {impTab==="email"&&<div>
        <div style={{fontSize:13,color:C.inkLight,fontFamily:FB,lineHeight:1.75,marginBottom:14}}>Paste any email — Eleanor extracts appointments, actions and key info.</div>
        <textarea id="email-textarea" style={{...inp,minHeight:140,resize:"vertical"}} defaultValue={emailText} placeholder="Paste the full email here..."/>
        <button style={goldBtn()} onClick={()=>{const el=document.getElementById("email-textarea");if(el)setEmailText(el.value);parseEmail();}} disabled={emailBusy}>{emailBusy?"Reading…":"Extract from Email"}</button>
        {emailRes?.error&&<div style={{border:`1px solid ${C.crimson}`,background:C.crimsonBg,padding:"12px",fontSize:13,color:C.crimson,fontFamily:FB,borderRadius:4,marginTop:8}}>{emailRes.msg}</div>}
        {emailRes&&!emailRes.error&&<div style={{marginTop:12}}>
          {/* Email type badge */}
          {emailRes.email_type&&<div style={{fontSize:9,color:C.gold,fontFamily:FM,letterSpacing:"0.2em",textTransform:"uppercase",marginBottom:8}}>
            {{"appointment":"📅","payment":"💰","school":"🏫","medical":"🏥","legal":"⚖️","delivery":"📦","invitation":"🎉","bill":"💳","benefit":"🏛","reminder":"⏰","other":"📧"}[emailRes.email_type]||"📧"} {emailRes.email_type} email
          </div>}

          {/* Urgent flag */}
          {emailRes.urgent&&<div style={{background:C.crimsonBg,border:`1px solid ${C.crimson}`,borderLeft:`4px solid ${C.crimson}`,padding:"10px 14px",marginBottom:10,fontSize:13,color:C.crimson,fontFamily:FB,borderRadius:4}}>⚠ Eleanor flagged this as urgent</div>}

          {/* Summary */}
          {emailRes.summary&&<div style={{border:`1px solid ${C.emerald}40`,background:C.emeraldBg,padding:"12px",marginBottom:10,fontSize:13,color:C.emerald,fontFamily:FB,borderRadius:4,borderLeft:`4px solid ${C.emerald}`}}>✦ {emailRes.summary}</div>}

          {/* Sender */}
          {emailRes.sender&&<div style={{fontSize:12,color:C.inkLight,fontFamily:FB,marginBottom:4}}>From: <strong style={{color:C.ink}}>{emailRes.sender}</strong>{emailRes.sender_email?" ("+emailRes.sender_email+")":""}</div>}
          {emailRes.subject&&<div style={{fontSize:12,color:C.inkLight,fontFamily:FB,marginBottom:10}}>Subject: <strong style={{color:C.ink}}>{emailRes.subject}</strong></div>}

          {/* Payment info */}
          {emailRes.payment?.amount&&<div style={{background:C.goldPale,border:`1px solid ${C.goldBorder}`,borderLeft:`4px solid ${C.gold}`,borderRadius:4,padding:"10px 14px",marginBottom:10}}>
            <div style={{fontSize:10,color:C.gold,fontFamily:FM,letterSpacing:"0.15em",textTransform:"uppercase",marginBottom:4}}>💰 Payment Details</div>
            <div style={{fontSize:14,fontFamily:FD,color:C.ink}}>{emailRes.payment.amount}</div>
            {emailRes.payment.due_date&&<div style={{fontSize:11,color:C.crimson,fontFamily:FB,marginTop:2}}>Due: {emailRes.payment.due_date}</div>}
            {emailRes.payment.reference&&<div style={{fontSize:11,color:C.inkFaint,fontFamily:FM,marginTop:2}}>Ref: {emailRes.payment.reference}</div>}
          </div>}

          {/* Key info */}
          {emailRes.key_info?.length>0&&<div style={{marginBottom:10}}>
            <div style={SL}>Key Information</div>
            {emailRes.key_info.map((k,i)=>(
              <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"8px 12px",background:C.card,border:`1px solid ${C.borderSoft}`,borderRadius:3,marginBottom:4}}>
                <span style={{fontSize:12,color:C.inkLight,fontFamily:FB}}>{k.label}</span>
                <span style={{fontSize:12,color:C.ink,fontFamily:FD}}>{k.value}</span>
              </div>
            ))}
          </div>}

          {/* Action items */}
          {emailRes.actions?.length>0&&<div style={{marginBottom:10}}>
            <div style={SL}>What You Need to Do</div>
            {emailRes.actions.map((a,i)=>{const p=PM[a.priority]||PM.medium;return(
              <div key={i} style={{padding:"9px 12px",background:C.goldPale,border:`1px solid ${C.goldBorder}`,borderLeft:`4px solid ${p.color}`,borderRadius:3,marginBottom:5}}>
                <div style={{fontSize:13,color:C.inkMid,fontFamily:FB}}>→ {a.text}</div>
                {a.deadline&&<div style={{fontSize:10,color:C.crimson,fontFamily:FM,marginTop:2}}>By: {a.deadline}</div>}
              </div>
            );})}
          </div>}

          {/* Important numbers */}
          {emailRes.important_numbers?.length>0&&<div style={{marginBottom:10}}>
            <div style={SL}>Important Numbers</div>
            {emailRes.important_numbers.map((n,i)=>(
              <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"7px 12px",background:C.card,border:`1px solid ${C.borderSoft}`,borderRadius:3,marginBottom:4}}>
                <span style={{fontSize:12,color:C.inkLight,fontFamily:FB}}>{n.label}</span>
                <span style={{fontSize:12,color:C.ink,fontFamily:FD,fontWeight:"bold"}}>{n.value}</span>
              </div>
            ))}
          </div>}

          {/* Deadlines */}
          {emailRes.deadlines?.length>0&&<div style={{marginBottom:10}}>
            <div style={SL}>⏰ Deadlines</div>
            {emailRes.deadlines.map((d,i)=>(
              <div key={i} style={{padding:"8px 12px",background:C.crimsonBg,border:`1px solid ${C.crimson}30`,borderLeft:`3px solid ${C.crimson}`,borderRadius:3,marginBottom:5}}>
                <div style={{fontSize:13,color:C.inkMid,fontFamily:FB}}>{d.task}</div>
                <div style={{fontSize:10,color:C.crimson,fontFamily:FM,marginTop:2}}>By: {d.date}</div>
              </div>
            ))}
          </div>}

          {/* Reply suggestion */}
          {emailRes.reply_needed&&emailRes.reply_suggestion&&<div style={{marginBottom:10}}>
            <div style={SL}>✦ Suggested Reply</div>
            <div style={{background:C.card,border:`1px solid ${C.borderSoft}`,borderRadius:4,padding:"14px",fontSize:13,color:C.inkMid,fontFamily:FB,lineHeight:1.8,borderLeft:`3px solid ${C.sapphire}`}}>{emailRes.reply_suggestion}</div>
            <div style={{display:"flex",gap:8,marginTop:8}}>
              <button style={{...goldBtn(true),color:C.sapphire,borderColor:C.sapphire,flex:1}} onClick={()=>{navigator.clipboard?.writeText(emailRes.reply_suggestion).then(()=>alert("Copied!")).catch(()=>alert("Please copy manually"));}}>📋 Copy Reply</button>
              <button style={{...goldBtn(true),flex:1}} onClick={()=>{setChatIn("Can you help me reply to this email from "+emailRes.sender+": "+emailRes.reply_suggestion);setCriticalOnly(false);setView("chat");}}>✦ Improve with Eleanor</button>
            </div>
          </div>}

          {/* Events */}
          {emailRes.events?.length>0&&<div>
            <div style={SL}>{emailRes.events.length} Date{emailRes.events.length>1?"s":""} Found</div>
            {emailRes.events.map((e,i)=>{const p=PM[e.priority]||PM.medium;return(
              <div key={i} style={{background:C.card,border:`1px solid ${C.borderSoft}`,borderLeft:`4px solid ${p.color}`,padding:"11px 14px",marginBottom:6,borderRadius:4}}>
                <div style={{fontSize:10,color:p.color,fontFamily:FM,marginBottom:2}}>{e.date} · {e.time} · <span style={chip(p.color,p.bg)}>{p.glyph} {p.label}</span></div>
                <div style={{fontSize:14,fontFamily:FD,color:C.ink,marginBottom:2}}>{e.title}</div>
                {e.notes&&<div style={{fontSize:11,color:C.inkLight}}>{e.notes}</div>}
              </div>
            );})}
            <div style={{height:8}}/>
            <button style={goldBtn()} onClick={()=>{addEvs(emailRes.events,"email");setEmailRes(null);setEmailText("");setCriticalOnly(false);setView("home");}}>Add All to Schedule</button>
            <button style={goldBtn(true)} onClick={()=>{setEmailRes(null);setEmailText("");}}>Discard</button>
          </div>}
        </div>}
      </div>}
            {impTab==="calendar"&&<div>
        <ICalImport onAdd={evs=>{addEvs(evs,"calendar");setCriticalOnly(false);setView("home");}}/>
        {false&&!googleTokens&&<button style={goldBtn()} onClick={connectGoogle} disabled={googleBusy}>{googleBusy?"Connecting…":"Connect Google Calendar"}</button>}
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
          <button style={goldBtn()} onClick={()=>{addEvs(calEvs,"calendar");setCalSt("idle");setCalEvs(null);setCriticalOnly(false);setView("home");}}>Add All to Schedule</button>
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
          <div style={{display:"flex",gap:6,alignItems:"center"}}>
            <div style={{width:54,height:28,display:"flex",alignItems:"center",justifyContent:"center",background:C.cream,borderRadius:4,border:`1px solid ${C.borderSoft}`}}><Waveform active={showWave||eleanorSpeaking}/></div>
            <button onClick={()=>{
              const next=!eleanorVoiceOn;
              setEleanorVoiceOn(next);
              localStorage.setItem("papa_voice_on",String(next));
              if(!next)stopSpeaking();
            }} style={{padding:"5px 10px",borderRadius:4,border:`1.5px solid ${eleanorVoiceOn?C.goldBorder:C.borderSoft}`,background:eleanorVoiceOn?C.goldPale:C.card,color:eleanorVoiceOn?C.gold:C.inkFaint,fontFamily:FM,fontSize:9,letterSpacing:"0.1em",textTransform:"uppercase",cursor:"pointer",whiteSpace:"nowrap"}}>
              {eleanorVoiceOn?"🔊 On":"🔇 Off"}
            </button>
            {eleanorSpeaking&&<button onClick={stopSpeaking} style={{padding:"5px 8px",borderRadius:4,border:`1px solid ${C.crimson}`,background:C.crimsonBg,color:C.crimson,fontFamily:FM,fontSize:9,cursor:"pointer"}}>■ Stop</button>}
          </div>
        </div>
        {/* Memory indicator */}
        {((persistentMemory.facts||[]).length>0||(persistentMemory.pending_tasks||[]).length>0)&&<div style={{marginTop:6,padding:"6px 10px",background:C.goldPale,border:`1px solid ${C.goldBorder}`,borderRadius:4,display:"flex",alignItems:"center",gap:6}}>
          <div style={{width:6,height:6,borderRadius:"50%",background:C.gold,animation:"memoryPulse 2s ease-in-out infinite"}}/>
          <div style={{fontSize:9,color:C.gold,fontFamily:FM,letterSpacing:"0.12em",textTransform:"uppercase"}}>
            Eleanor has {(persistentMemory.facts||[]).length} memories · {(persistentMemory.pending_tasks||[]).length} pending tasks
          </div>
        </div>}

        {/* Action buttons row */}
        <div style={{display:"flex",gap:6,marginTop:8,paddingTop:8,borderTop:`1px solid ${C.borderSoft}`}}>
          <button onClick={()=>{setCriticalOnly(false);setView("finances");}} style={{flex:1,padding:"7px",borderRadius:4,border:`1.5px solid ${C.goldBorder}`,background:C.goldPale,color:C.gold,fontFamily:FM,fontSize:9,letterSpacing:"0.1em",textTransform:"uppercase",cursor:"pointer"}}>💰 Finances</button>
          <button onClick={()=>{
            const next=!eleanorVoiceOn;
            setEleanorVoiceOn(next);
            localStorage.setItem("papa_voice_on",String(next));
            if(!next)stopSpeaking();
          }} style={{flex:1,padding:"7px",borderRadius:4,border:`1.5px solid ${eleanorVoiceOn?C.goldBorder:C.borderSoft}`,background:eleanorVoiceOn?C.goldPale:C.card,color:eleanorVoiceOn?C.gold:C.inkFaint,fontFamily:FM,fontSize:9,letterSpacing:"0.1em",textTransform:"uppercase",cursor:"pointer"}}>
            {eleanorVoiceOn?"🔊 Voice On":"🔇 Voice Off"}
          </button>
          <button onClick={async()=>{if(window.confirm("Clear chat? Eleanor will remember a summary of this conversation.")){await saveSessionSummary(msgs);setMsgs([{role:"assistant",text:"Good day. I'm Eleanor. I've saved a note from our last conversation and I'm ready to continue.",ts:new Date()}]);}}} style={{flex:1,padding:"7px",borderRadius:4,border:`1px solid ${C.borderSoft}`,background:C.card,color:C.inkFaint,fontFamily:FM,fontSize:9,letterSpacing:"0.1em",textTransform:"uppercase",cursor:"pointer"}}>🗑 Clear Chat</button>
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
        {isStreaming&&streamedText&&<div className="msg-bubble" style={{display:"flex",gap:9,alignItems:"flex-end"}}>
          <PaAvatar size={30} speaking={true}/>
          <div style={{padding:"12px 16px",borderRadius:"4px 16px 16px 4px",background:C.card,border:`1px solid ${C.goldBorder}`,boxShadow:`0 2px 10px ${C.shadow}`,maxWidth:"78%",position:"relative"}}>
            <div style={{fontSize:14,color:C.ink,fontFamily:FB,lineHeight:1.7}}>{streamedText}<span style={{display:"inline-block",width:2,height:14,background:C.gold,marginLeft:2,animation:"typingCursor 0.7s ease-in-out infinite",verticalAlign:"middle"}}/></div>
          </div>
        </div>}
        {paStatus==="speaking"&&<div className="msg-bubble" style={{display:"flex",gap:9,alignItems:"flex-end"}}><PaAvatar size={30} speaking={true}/><div style={{padding:"10px 14px",borderRadius:"4px 16px 16px 4px",background:C.card,border:`1px solid ${C.goldBorder}`,boxShadow:`0 2px 12px rgba(196,153,62,0.18)`,display:"flex",alignItems:"center",gap:8}}><Waveform active={true}/><span style={{fontSize:10,color:C.gold,fontFamily:FM,letterSpacing:"0.1em"}}>Eleanor is responding…</span></div></div>}
        <div ref={chatEnd}/>
      </div>
      {msgs.length<=1&&paStatus==="idle"&&(()=>{
        const nextEv=events.filter(e=>e.date>=fmt(today)).sort((a,b)=>a.date.localeCompare(b.date))[0];
        const hasTrip=events.some(e=>{const d=Math.ceil((new Date(e.date+"T12:00:00")-new Date())/86400000);return d>0&&d<=7&&["holiday","trip","clacton","haven","museum","coach"].some(k=>e.title.toLowerCase().includes(k));});
        const chips=[
          nextEv?"What's coming up?":"What's on today?",
          hasTrip?"Help me prepare for my trip":"Any conflicts?",
          weeklyGoals?.goals?.length>0?"How am I doing on my goals?":"What should I achieve this week?",
          weekWeather?"Best day this week for going out?":"Free time this week?",
        ];
        return(<div style={{padding:"0 16px 8px",display:"flex",gap:6,flexWrap:"wrap"}}>
          {chips.map(q=>(<button key={q} onClick={()=>sendChat(q)} style={{padding:"7px 12px",borderRadius:20,border:`1px solid ${C.goldBorder}`,background:C.card,color:C.gold,fontSize:10,fontFamily:FM,letterSpacing:"0.08em",cursor:"pointer"}}>{q}</button>))}
        </div>);
      })()}
      <div style={{padding:"12px 16px",borderTop:`1px solid ${C.border}`,background:C.card,boxShadow:`0 -2px 10px ${C.shadow}`}}>
        <ChatInput disabled={paStatus!=="idle"} onSend={text=>{setChatIn(text);sendChat(text);}}/>
      </div>
    </div>
  );

  /* ── ADD EVENT ── */
  const AddView=()=>{
    const titleRef=useRef(null);
    const dateRef=useRef(null);
    const timeRef=useRef(null);
    const priorityRef=useRef(null);
    const sourceRef=useRef(null);
    const notesRef=useRef(null);
    function save(){
      const title=titleRef.current?.value||"";
      if(!title.trim())return;
      const date=dateRef.current?.value||fmt(today);
      const time=timeRef.current?.value||"";
      const priority=priorityRef.current?.value||"medium";
      const source=sourceRef.current?.value||"manual";
      const notes=notesRef.current?.value||"";
      const mx=Math.max(0,...events.map(e=>e.id));
      const newEv={id:mx+1+Math.floor(Math.random()*1000),title,date,time,priority,notes,source};
      setEvents(ev=>{
        const clashes=ev.filter(e=>e.date===date);
        const dayBefore=fmt(new Date(new Date(date+"T12:00:00").getTime()-86400000));
        const dayAfter=fmt(new Date(new Date(date+"T12:00:00").getTime()+86400000));
        const nearby=ev.filter(e=>e.date===dayBefore||e.date===dayAfter);
        if(clashes.length>0||nearby.length>0){
          setTimeout(()=>setConflictWarning({event:newEv,clashes,nearby,dayBefore,dayAfter}),300);
        }
        return [...ev,newEv];
      });
      setNewEv({title:"",date:fmt(today),time:"",priority:"medium",notes:"",source:"manual"});
      setCriticalOnly(false);setView("home");
    }
    return(<div>
      <div style={SL}>New Appointment</div>
      <input ref={titleRef} style={inp} type="text" placeholder="Appointment title *" defaultValue={newEv.title}/>
      <input ref={dateRef} style={inp} type="date" defaultValue={newEv.date}/>
      <input ref={timeRef} style={inp} type="time" defaultValue={newEv.time}/>
      <select ref={priorityRef} style={{...inp}} defaultValue={newEv.priority}>
        {[["critical","◆ Critical"],["high","◈ High"],["medium","◇ Medium"],["low","○ Low"]].map(([v,l])=><option key={v} value={v}>{l}</option>)}
      </select>
      <select ref={sourceRef} style={{...inp}} defaultValue={newEv.source}>
        {[["manual","✦ Manual"],["email","✦ Email"],["whatsapp","✦ WhatsApp"],["rover","✦ Rover"]].map(([v,l])=><option key={v} value={v}>{l}</option>)}
      </select>
      <input ref={notesRef} style={inp} placeholder="Notes (optional)" defaultValue={newEv.notes}/>
      <div style={{height:6}}/>
      <button style={goldBtn()} onClick={save}>Add to Schedule</button>
      <button style={goldBtn(true)} onClick={()=>{setCriticalOnly(false);setView("home");}}>Cancel</button>
    </div>);
  };

  /* ── CALENDAR VIEW ── */
  const CalendarView=()=>{
    const daysInMonth=(y,m)=>new Date(y,m+1,0).getDate();
    const firstDay=(y,m)=>new Date(y,m,1).getDay();
    const monthName=new Intl.DateTimeFormat("en-GB",{month:"long"}).format(new Date(calMonth.y,calMonth.m,1));
    const days=daysInMonth(calMonth.y,calMonth.m);
    const startDay=firstDay(calMonth.y,calMonth.m);
    const cells=[];
    for(let i=0;i<startDay;i++)cells.push(null);
    for(let d=1;d<=days;d++)cells.push(d);

    const selectedEvs=events.filter(e=>e.date===selectedDay).sort((a,b)=>a.time.localeCompare(b.time));

    function addToGoogleCalendar(e){
      const start=e.time&&e.time!=="09:00"?e.date+"T"+e.time+":00":e.date;
      const end=e.time&&e.time!=="09:00"?e.date+"T"+(String(parseInt(e.time.slice(0,2))+1).padStart(2,"0"))+e.time.slice(2)+":00":e.date;
      const url="https://calendar.google.com/calendar/render?action=TEMPLATE"+
        "&text="+encodeURIComponent(e.title)+
        "&dates="+start.replace(/-/g,"").replace(/:/g,"")+"/"+ end.replace(/-/g,"").replace(/:/g,"")+
        "&details="+encodeURIComponent(e.notes||"")+
        "&sf=true&output=xml";
      window.open(url,"_blank");
    }

    return(<div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
        <div style={SL}>Calendar</div>
        <a href="https://calendar.google.com" target="_blank" rel="noreferrer" style={{fontSize:9,padding:"5px 12px",borderRadius:3,background:C.sapphireBg,color:C.sapphire,fontFamily:FM,letterSpacing:"0.12em",textTransform:"uppercase",border:`1px solid ${C.sapphire}30`,textDecoration:"none"}}>📅 Open Google Calendar</a>
      </div>

      {/* iCal sync button */}
      <button onClick={()=>setImpTab("calendar")||setView("import")} style={{width:"100%",padding:"10px",borderRadius:4,border:`1px solid ${C.borderSoft}`,background:C.card,color:C.inkLight,fontFamily:FM,fontSize:9,letterSpacing:"0.14em",textTransform:"uppercase",cursor:"pointer",marginBottom:14,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
        <span>🔄</span> Sync Google Calendar via iCal
      </button>

      {/* Month navigation */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <button onClick={()=>setCalMonth(m=>m.m===0?{y:m.y-1,m:11}:{y:m.y,m:m.m-1})} style={{background:"none",border:`1px solid ${C.borderSoft}`,borderRadius:3,padding:"6px 12px",cursor:"pointer",color:C.inkLight,fontFamily:FM,fontSize:12}}>←</button>
        <div style={{fontFamily:FD,fontSize:20,color:C.ink,fontStyle:"italic"}}>{monthName} {calMonth.y}</div>
        <button onClick={()=>setCalMonth(m=>m.m===11?{y:m.y+1,m:0}:{y:m.y,m:m.m+1})} style={{background:"none",border:`1px solid ${C.borderSoft}`,borderRadius:3,padding:"6px 12px",cursor:"pointer",color:C.inkLight,fontFamily:FM,fontSize:12}}>→</button>
      </div>

      {/* Day labels */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2,marginBottom:4}}>
        {["Su","Mo","Tu","We","Th","Fr","Sa"].map(d=>(
          <div key={d} style={{textAlign:"center",fontSize:9,color:C.inkFaint,fontFamily:FM,letterSpacing:"0.1em",padding:"4px 0"}}>{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2,marginBottom:18}}>
        {cells.map((day,i)=>{
          if(!day)return<div key={i}/>;
          const ds=calMonth.y+"-"+String(calMonth.m+1).padStart(2,"0")+"-"+String(day).padStart(2,"0");
          const dayEvs=events.filter(e=>e.date===ds);
          const isToday=ds===fmt(today);
          const isSelected=ds===selectedDay;
          const hasCritical=dayEvs.some(e=>e.priority==="critical");
          return(
            <div key={i} onClick={()=>setSelectedDay(ds)} style={{
              textAlign:"center",padding:"6px 2px",borderRadius:4,cursor:"pointer",
              background:isSelected?C.gold:isToday?C.goldPale:"transparent",
              border:isSelected?`1px solid ${C.goldBright}`:isToday?`1px solid ${C.goldBorder}`:`1px solid transparent`,
              transition:"all 0.15s",position:"relative"
            }}>
              <div style={{fontSize:13,fontFamily:isToday?FM:FB,color:isSelected?C.card:isToday?C.gold:C.ink,fontWeight:isToday?"600":"normal"}}>{day}</div>
              {dayEvs.length>0&&<div style={{display:"flex",justifyContent:"center",gap:2,marginTop:2}}>
                {dayEvs.slice(0,3).map((_,i)=>(
                  <div key={i} style={{width:4,height:4,borderRadius:"50%",background:isSelected?C.card:hasCritical?C.crimson:C.gold}}/>
                ))}
              </div>}
            </div>
          );
        })}
      </div>

      {/* Selected day events */}
      <div style={{borderTop:`1px solid ${C.borderSoft}`,paddingTop:14}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <div style={SL}>{new Date(selectedDay+"T12:00:00").toLocaleDateString("en-GB",{weekday:"long",day:"numeric",month:"long"})}</div>
          <button onClick={()=>{setNewEv(n=>({...n,date:selectedDay}));setView("add");}} style={{background:"none",border:`1px solid ${C.goldBorder}`,borderRadius:3,padding:"5px 10px",cursor:"pointer",color:C.gold,fontFamily:FM,fontSize:9,letterSpacing:"0.12em",textTransform:"uppercase"}}>＋ Add</button>
        </div>
        {selectedEvs.length===0
          ?<div style={{textAlign:"center",color:C.inkFaint,padding:"20px 0",fontFamily:FD,fontStyle:"italic",fontSize:14}}>No appointments</div>
          :selectedEvs.map((e,i)=>{
            const p=PM[e.priority]||PM.medium;
            return(
              <div key={e.id} onClick={()=>setEventAction({event:e})} style={{background:C.card,border:`1px solid ${C.borderSoft}`,borderLeft:`4px solid ${p.color}`,borderRadius:4,padding:"12px 14px",marginBottom:8,display:"flex",gap:12,alignItems:"flex-start",cursor:"pointer"}}>
                <div style={{textAlign:"center",minWidth:36}}>
                  <div style={{fontSize:18,fontFamily:FD,color:C.gold,fontWeight:300,lineHeight:1}}>{e.time?.slice(0,2)||"—"}</div>
                  <div style={{fontSize:10,color:C.inkFaint,fontFamily:FM}}>{e.time?.slice(3)||"00"}</div>
                </div>
                <div style={{flex:1}}>
                  <div style={{fontSize:14,fontFamily:FD,color:C.ink,marginBottom:3}}>{e.title}</div>
                  {e.notes&&<div style={{fontSize:11,color:C.inkLight,marginBottom:6,lineHeight:1.4}}>{e.notes}</div>}
                  <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                    <span style={chip(p.color,p.bg)}>{p.glyph} {p.label}</span>
                    <button onClick={()=>addToGoogleCalendar(e)} style={{fontSize:9,padding:"3px 10px",borderRadius:2,background:C.sapphireBg,color:C.sapphire,letterSpacing:"0.12em",textTransform:"uppercase",fontFamily:FM,border:`1px solid ${C.sapphire}40`,cursor:"pointer"}}>+ Google Cal</button>
                    {homeAddress&&e.notes&&<a href={"https://www.google.com/maps/dir/"+encodeURIComponent(homeAddress)+"/"+encodeURIComponent(e.notes.split(" ").slice(0,5).join(" "))} target="_blank" rel="noreferrer" style={{fontSize:9,padding:"3px 10px",borderRadius:2,background:C.emeraldBg,color:C.emerald,letterSpacing:"0.12em",textTransform:"uppercase",fontFamily:FM,border:`1px solid ${C.emerald}40`,cursor:"pointer",textDecoration:"none"}}>🗺 Travel</a>}
                    {homeAddress&&!e.notes&&<a href={"https://www.google.com/maps/dir/"+encodeURIComponent(homeAddress)+"/"+encodeURIComponent(e.title)} target="_blank" rel="noreferrer" style={{fontSize:9,padding:"3px 10px",borderRadius:2,background:C.emeraldBg,color:C.emerald,letterSpacing:"0.12em",textTransform:"uppercase",fontFamily:FM,border:`1px solid ${C.emerald}40`,cursor:"pointer",textDecoration:"none"}}>🗺 Travel</a>}
                    <button onClick={()=>del(e.id)} style={{fontSize:9,padding:"3px 10px",borderRadius:2,background:"transparent",color:C.inkFaint,letterSpacing:"0.12em",textTransform:"uppercase",fontFamily:FM,border:`1px solid ${C.borderSoft}`,cursor:"pointer"}}>Remove</button>
                  </div>
                </div>
              </div>
            );
          })
        }
      </div>
    </div>);
  };

  // ── FINANCES VIEW ──
  // -- QUICK EVENT ACTION (tap any event, type a command) --
  async function processEventAction(command){
    if(!eventAction?.event||!command.trim())return;
    setEventActionBusy(true);
    const ev=eventAction.event;
    try{
      const raw=await callAI({
        system:"You are Eleanor managing Sarah's calendar. She tapped an event and typed a command. Today is "+fmt(today)+". The event is: \""+ev.title+"\" on "+ev.date+(ev.time?" at "+ev.time:"")+". Interpret her command. Respond with ONLY raw JSON: {\"action\":\"delete|move|edit|none\",\"newDate\":\"YYYY-MM-DD or null\",\"newTime\":\"HH:MM or null\",\"newTitle\":\"string or null\",\"memoryFact\":\"a fact to remember about Sarah or family, or null\",\"confirmation\":\"plain English confirmation\"}. If she states a fact worth remembering, capture it in memoryFact. For dates with no year assume "+today.getFullYear()+".",
        messages:[{role:"user",content:command}]
      });
      const parsed=robustJSON(raw);
      if(parsed){
        if(parsed.action==="delete"){
          setEvents(evs=>evs.filter(e=>e.id!==ev.id));
        } else if(parsed.action==="move"){
          setEvents(evs=>evs.map(e=>e.id===ev.id?{...e,date:parsed.newDate||e.date,time:parsed.newTime||e.time}:e));
        } else if(parsed.action==="edit"){
          setEvents(evs=>evs.map(e=>e.id===ev.id?{...e,title:parsed.newTitle||e.title,date:parsed.newDate||e.date,time:parsed.newTime||e.time}:e));
        }
        if(parsed.memoryFact){
          const existing=JSON.parse(localStorage.getItem("papa_persistent_memory")||"{}");
          const upd={...existing,facts:[...(existing.facts||[]),parsed.memoryFact].slice(-25)};
          safeSave("papa_persistent_memory",JSON.stringify(upd));
          setPersistentMemory(upd);
        }
        setEventAction({event:ev,result:(parsed.confirmation||"Done.")+(parsed.memoryFact?" I'll remember that.":"")});
      } else {
        setEventAction({event:ev,result:"I couldn't understand that. Please try again e.g. 'delete this event' or 'move to Friday'."});
      }
    }catch(e){
      setEventAction({event:ev,result:"Something went wrong. Please try again."});
    }
    setEventActionBusy(false);
  }

  // -- QUICK FINANCE ACTION (tap any finance item, type a command) --
  async function processFinAction(command){
    if(!finAction?.item||!command.trim())return;
    setFinActionBusy(true);
    const it=finAction.item;
    try{
      const raw=await callAI({
        system:"You are Eleanor managing Sarah's finances. She tapped a finance item and typed a command. Today is "+fmt(today)+". The item is: \""+it.label+"\" amount GBP "+(it.amount||0)+(it.date?" dated "+it.date:"")+" type "+it.type+". Interpret her command. Respond with ONLY raw JSON: {\"action\":\"edit|delete|none\",\"newLabel\":\"string or null\",\"newAmount\":number or null,\"newDate\":\"YYYY-MM-DD or null\",\"memoryFact\":\"a fact to remember about Sarah or her family, or null\",\"confirmation\":\"plain English confirmation\"}. If she states a fact (e.g. a child's age, a benefit change), capture it in memoryFact so you remember it. For dates with no year assume "+today.getFullYear()+".",
        messages:[{role:"user",content:command}]
      });
      const parsed=robustJSON(raw);
      if(parsed){
        if(parsed.action==="delete"){
          setFinances(fs=>fs.filter(f=>f.id!==it.id));
        } else if(parsed.action==="edit"){
          setFinances(fs=>fs.map(f=>f.id===it.id?{...f,label:parsed.newLabel||f.label,amount:parsed.newAmount!=null?parsed.newAmount:f.amount,date:parsed.newDate||f.date}:f));
        }
        // Save fact to memory
        if(parsed.memoryFact){
          const existing=JSON.parse(localStorage.getItem("papa_persistent_memory")||"{}");
          const upd={...existing,facts:[...(existing.facts||[]),parsed.memoryFact].slice(-25)};
          safeSave("papa_persistent_memory",JSON.stringify(upd));
          setPersistentMemory(upd);
        }
        setFinAction({item:it,result:parsed.confirmation||"Done."+(parsed.memoryFact?" I'll remember that.":"")});
      } else {
        setFinAction({item:it,result:"I couldn't understand that. Try e.g. 'change to £250' or 'Maliki is 19 now'."});
      }
    }catch(e){
      setFinAction({item:it,result:"Something went wrong. Please try again."});
    }
    setFinActionBusy(false);
  }

  const FinancesView=()=>{
    const editingId=finEditingId,setEditingId=setFinEditingId;
    const editDraft=finEditDraft,setEditDraft=setFinEditDraft;
    const showAdd=finShowAdd,setShowAdd=setFinShowAdd;
    const showHistory=finShowHistory,setShowHistory=setFinShowHistory;
    const income=finances.filter(f=>f.type==="income"&&f.status!=="paid");
    const expenses=finances.filter(f=>(f.type==="expense"||f.type==="payment")&&f.status!=="paid");
    const cleared=finances.filter(f=>f.status==="paid");
    const totalIn=income.reduce((s,f)=>s+(f.amount||0),0);
    const totalOut=expenses.reduce((s,f)=>s+(f.amount||0),0);

    // Load finance session history
    const finHistory=(() => { try { return JSON.parse(localStorage.getItem("papa_finance_history")||"[]"); } catch { return []; } })();

    // Save snapshot of current finances to history when marked paid
    function markPaid(id){
      const item=finances.find(f=>f.id===id);
      if(item){
        const hist=JSON.parse(localStorage.getItem("papa_finance_history")||"[]");
        hist.unshift({...item,paidDate:new Date().toLocaleDateString("en-GB"),status:"paid"});
        localStorage.setItem("papa_finance_history",JSON.stringify(hist.slice(0,50)));
      }
      setFinances(fs=>fs.map(x=>x.id===id?{...x,status:"paid"}:x));
    }

    function startEdit(f){
      setEditingId(f.id);
      setEditDraft({label:f.label,amount:f.amount,date:f.date||"",type:f.type,notes:f.notes||""});
    }

    function saveEdit(id){
      setFinances(fs=>fs.map(x=>x.id===id?{...x,...editDraft,amount:parseFloat(editDraft.amount)||0}:x));
      setEditingId(null);
    }

    const renderFinItem=(f,accentColor)=>(
      <div style={{background:C.card,border:`1px solid ${C.borderSoft}`,borderLeft:`3px solid ${accentColor}`,borderRadius:6,marginBottom:8,overflow:"hidden"}}>
        {editingId===f.id?(
          <div style={{padding:"12px"}}>
            <input id={`edit-label-${f.id}`} defaultValue={f.label} onChange={e=>setEditDraft(d=>({...d,label:e.target.value}))} style={{...inp,marginBottom:6}} placeholder="Label"/>
            <div style={{display:"flex",gap:6}}>
              <input id={`edit-amount-${f.id}`} defaultValue={f.amount} type="number" onChange={e=>setEditDraft(d=>({...d,amount:e.target.value}))} style={{...inp,flex:1,marginBottom:6}} placeholder="Amount"/>
              <input id={`edit-date-${f.id}`} defaultValue={f.date||""} type="date" onChange={e=>setEditDraft(d=>({...d,date:e.target.value}))} style={{...inp,flex:1,marginBottom:6}}/>
            </div>
            {/* Income / Outgoing toggle */}
            <div style={{display:"flex",gap:6,marginBottom:8}}>
              <button onClick={()=>setEditDraft(d=>({...d,type:"income"}))} style={{flex:1,padding:"9px",borderRadius:3,border:`1.5px solid ${(editDraft.type||f.type)==="income"?C.emerald:C.borderSoft}`,background:(editDraft.type||f.type)==="income"?C.emeraldBg:C.card,color:(editDraft.type||f.type)==="income"?C.emerald:C.inkFaint,fontFamily:FM,fontSize:9,letterSpacing:"0.1em",textTransform:"uppercase",cursor:"pointer"}}>↓ Money In (Income)</button>
              <button onClick={()=>setEditDraft(d=>({...d,type:"expense"}))} style={{flex:1,padding:"9px",borderRadius:3,border:`1.5px solid ${(editDraft.type||f.type)!=="income"?C.crimson:C.borderSoft}`,background:(editDraft.type||f.type)!=="income"?C.crimsonBg:C.card,color:(editDraft.type||f.type)!=="income"?C.crimson:C.inkFaint,fontFamily:FM,fontSize:9,letterSpacing:"0.1em",textTransform:"uppercase",cursor:"pointer"}}>↑ Money Out</button>
            </div>
            <input id={`edit-notes-${f.id}`} defaultValue={f.notes||""} onChange={e=>setEditDraft(d=>({...d,notes:e.target.value}))} style={{...inp,marginBottom:8}} placeholder="Notes (optional)"/>
            <div style={{display:"flex",gap:8}}>
              <button onClick={()=>saveEdit(f.id)} style={goldBtn()}>✓ Save</button>
              <button onClick={()=>setEditingId(null)} style={goldBtn(true)}>Cancel</button>
            </div>
          </div>
        ):(
          <div style={{padding:"10px 12px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div style={{flex:1}} onClick={()=>setFinAction({item:f})}>
              <div style={{fontSize:13,fontFamily:FD,color:C.ink,cursor:"pointer"}}>{f.label}</div>
              {f.date&&<div style={{fontSize:10,color:C.inkFaint,fontFamily:FM}}>{f.date}</div>}
              {f.notes&&<div style={{fontSize:11,color:C.inkLight,fontFamily:FB}}>{f.notes}</div>}
              <div style={{fontSize:9,color:accentColor,fontFamily:FM,marginTop:2,letterSpacing:"0.1em",textTransform:"uppercase"}}>tap to edit</div>
            </div>
            <div style={{display:"flex",gap:6,alignItems:"center",flexShrink:0,marginLeft:10}}>
              <div style={{fontFamily:FD,fontSize:15,color:accentColor}}>£{(f.amount||0).toFixed(2)}</div>
              <button onClick={()=>setFinAction({item:f})} style={{padding:"4px 8px",borderRadius:3,border:`1px solid ${C.goldBorder}`,background:C.goldPale,color:C.gold,fontFamily:FM,fontSize:8,cursor:"pointer",letterSpacing:"0.1em",textTransform:"uppercase"}}>✦ Edit</button>
              <button onClick={()=>markPaid(f.id)} style={{padding:"4px 8px",borderRadius:3,border:`1px solid ${accentColor}40`,background:accentColor+"15",color:accentColor,fontFamily:FM,fontSize:8,cursor:"pointer",letterSpacing:"0.1em",textTransform:"uppercase"}}>✓</button>
              {f.type!=="income"&&<button onClick={()=>{setChatIn("Remind me to pay "+f.label+" of £"+(f.amount||0).toFixed(2)+(f.date?" on "+f.date:""));setCriticalOnly(false);setView("chat");}} style={{padding:"4px 8px",borderRadius:3,border:`1px solid ${C.goldBorder}`,background:C.goldPale,color:C.gold,fontFamily:FM,fontSize:8,cursor:"pointer"}}>⏰</button>}
              <button onClick={()=>setFinances(fs=>fs.filter(x=>x.id!==f.id))} style={{background:"none",border:"none",color:C.inkFaint,cursor:"pointer",fontSize:13,padding:"2px 4px"}}>✕</button>
            </div>
          </div>
        )}
      </div>
    );

    return(<div style={{paddingBottom:90}}>
      {/* Save & Sync — forces a save and confirms everything is in sync */}
      <button onClick={()=>{
        // finances already auto-saves; this confirms and re-triggers sync to localStorage
        safeSave("papa_finances",JSON.stringify(finances));
        const inc=finances.filter(f=>f.type==="income"&&f.status!=="paid").reduce((s,f)=>s+(f.amount||0),0);
        const out=finances.filter(f=>(f.type==="expense"||f.type==="payment")&&f.status!=="paid").reduce((s,f)=>s+(f.amount||0),0);
        alert("✓ Saved & synced everywhere.\n\nMoney In: £"+inc.toFixed(2)+"\nMoney Out: £"+out.toFixed(2)+"\n\nEleanor's chat, your briefing and schedule checker now all see this.");
      }} style={{width:"100%",padding:"13px",borderRadius:8,border:"none",background:`linear-gradient(135deg,${C.emerald},${C.emerald}cc)`,color:"#fff",fontFamily:FM,fontSize:11,letterSpacing:"0.14em",textTransform:"uppercase",cursor:"pointer",marginBottom:12,boxShadow:`0 4px 16px ${C.shadowMed}`}}>✓ Save & Sync Everywhere</button>

      {/* Quick access to Financial Planner at very top */}
      <button onClick={()=>{setImpTab("finance");setView("import");}} style={{width:"100%",padding:"14px",borderRadius:8,border:"none",background:`linear-gradient(135deg,${C.gold},${C.goldBright})`,color:C.card,fontFamily:FM,fontSize:11,letterSpacing:"0.14em",textTransform:"uppercase",cursor:"pointer",marginBottom:16,boxShadow:`0 4px 16px ${C.shadowMed}`}}>✦ Upload / Analyse a Financial Plan</button>

      {/* Big bold header matching Executive Briefing style */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
        <div style={SL}>Financial Overview</div>
      </div>
      <div style={{display:"flex",gap:14,alignItems:"center",background:C.card,border:`1px solid ${C.borderSoft}`,borderRadius:6,padding:"14px 16px",marginBottom:18,boxShadow:`0 2px 10px ${C.shadow}`}}>
        <div style={{width:56,height:56,borderRadius:"50%",background:`linear-gradient(145deg,${C.cream},${C.creamDeep})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:28,flexShrink:0,border:`2px solid ${C.goldBorder}`,boxShadow:`0 0 12px rgba(196,153,62,0.3)`}}>💰</div>
        <div>
          <div style={{fontFamily:FD,fontSize:24,color:C.ink,fontStyle:"italic",marginBottom:2}}>Finances</div>
          <div style={{fontSize:12,color:C.inkLight,fontFamily:FB,lineHeight:1.5}}>Track income, outgoings and payment history all in one place.</div>
        </div>
      </div>

      {/* Summary cards */}
      <div style={{display:"flex",gap:10,marginBottom:14}}>
        <div style={{flex:1,background:C.emeraldBg,border:`1px solid ${C.emerald}30`,borderLeft:`4px solid ${C.emerald}`,borderRadius:6,padding:"12px 14px"}}>
          <div style={{fontSize:9,color:C.emerald,fontFamily:FM,letterSpacing:"0.15em",textTransform:"uppercase",marginBottom:4}}>Expected In</div>
          <div style={{fontFamily:FD,fontSize:22,color:C.emerald}}>£{totalIn.toFixed(2)}</div>
          <div style={{fontSize:10,color:C.inkFaint,fontFamily:FB,marginTop:2}}>{income.length} item{income.length!==1?"s":""}</div>
        </div>
        <div style={{flex:1,background:C.crimsonBg,border:`1px solid ${C.crimson}30`,borderLeft:`4px solid ${C.crimson}`,borderRadius:6,padding:"12px 14px"}}>
          <div style={{fontSize:9,color:C.crimson,fontFamily:FM,letterSpacing:"0.15em",textTransform:"uppercase",marginBottom:4}}>Due Out</div>
          <div style={{fontFamily:FD,fontSize:22,color:C.crimson}}>£{totalOut.toFixed(2)}</div>
          <div style={{fontSize:10,color:C.inkFaint,fontFamily:FB,marginTop:2}}>{expenses.length} item{expenses.length!==1?"s":""}</div>
        </div>
      </div>

      {/* Net */}
      {(totalIn>0||totalOut>0)&&<div style={{background:C.card,border:`1px solid ${C.borderSoft}`,borderRadius:6,padding:"10px 14px",marginBottom:14,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div style={{fontSize:12,color:C.inkMid,fontFamily:FB}}>Net this month</div>
        <div style={{fontFamily:FD,fontSize:18,color:totalIn-totalOut>=0?C.emerald:C.crimson}}>£{(totalIn-totalOut).toFixed(2)}</div>
      </div>}

      {/* Income */}
      {income.length>0&&<div style={{marginBottom:14}}>
        <div style={{fontSize:9,color:C.emerald,fontFamily:FM,letterSpacing:"0.2em",textTransform:"uppercase",marginBottom:8}}>✓ Income</div>
        {income.map(f=><div key={f.id}>{renderFinItem(f,C.emerald)}</div>)}
      </div>}

      {/* Expenses */}
      {expenses.length>0&&<div style={{marginBottom:14}}>
        <div style={{fontSize:9,color:C.crimson,fontFamily:FM,letterSpacing:"0.2em",textTransform:"uppercase",marginBottom:8}}>⬆ Outgoings</div>
        {expenses.map(f=><div key={f.id}>{renderFinItem(f,C.crimson)}</div>)}
      </div>}

      {/* Cleared */}
      {cleared.length>0&&<div style={{marginBottom:14}}>
        <div style={{fontSize:9,color:C.inkFaint,fontFamily:FM,letterSpacing:"0.2em",textTransform:"uppercase",marginBottom:8}}>✓ Cleared This Session</div>
        {cleared.map(f=>(
          <div key={f.id} style={{display:"flex",justifyContent:"space-between",padding:"8px 12px",background:C.parchment,border:`1px solid ${C.borderSoft}`,borderRadius:4,marginBottom:4,opacity:0.6}}>
            <div style={{fontSize:12,fontFamily:FB,color:C.inkFaint,textDecoration:"line-through",flex:1}}>{f.label}</div>
            <div style={{display:"flex",gap:6,alignItems:"center"}}>
              <div style={{fontSize:12,fontFamily:FD,color:C.inkFaint}}>£{(f.amount||0).toFixed(2)}</div>
              <button onClick={()=>setFinances(fs=>fs.filter(x=>x.id!==f.id))} style={{background:"none",border:"none",color:C.inkFaint,cursor:"pointer",fontSize:11}}>✕</button>
            </div>
          </div>
        ))}
      </div>}

      {/* Add manually */}
      <button onClick={()=>setShowAdd(s=>!s)} style={{...goldBtn(true),width:"100%",marginBottom:showAdd?10:0}}>＋ Add Manually</button>
      {showAdd&&<div style={{background:C.card,border:`1px solid ${C.borderSoft}`,borderRadius:6,padding:"14px",marginBottom:14}}>
        <input id="fin-label" style={inp} placeholder="Label e.g. Carer's Allowance"/>
        <input id="fin-amount" style={inp} type="number" placeholder="Amount e.g. 333.20"/>
        <input id="fin-date" style={inp} type="date"/>
        <select id="fin-type" style={inp}>
          <option value="income">Income</option>
          <option value="expense">Outgoing / Payment</option>
        </select>
        <input id="fin-notes" style={inp} placeholder="Notes (optional)"/>
        <button style={goldBtn()} onClick={()=>{
          const label=document.getElementById("fin-label")?.value?.trim();
          const amount=parseFloat(document.getElementById("fin-amount")?.value||"0");
          const date=document.getElementById("fin-date")?.value||"";
          const type=document.getElementById("fin-type")?.value||"income";
          const notes=document.getElementById("fin-notes")?.value||"";
          if(!label)return;
          setFinances(fs=>[...fs,{id:Date.now()+Math.random(),label,amount,date,type,notes,status:"pending",source:"manual"}]);
          ["fin-label","fin-amount","fin-date","fin-notes"].forEach(id=>{const el=document.getElementById(id);if(el)el.value="";});
          setShowAdd(false);
        }}>Add</button>
      </div>}

      {finances.length===0&&<div style={{textAlign:"center",padding:"30px 0",color:C.inkFaint}}>
        <div style={{fontFamily:FD,fontSize:16,fontStyle:"italic",color:C.inkLight,marginBottom:8}}>No finances tracked yet.</div>
        <div style={{fontSize:12,fontFamily:FB,lineHeight:1.6}}>Import screenshots, emails or invoices via Import to extract amounts automatically, or add manually above.</div>
      </div>}

      {/* Session history */}
      <div style={{marginTop:14}}>
        <button onClick={()=>setShowHistory(s=>!s)} style={{...goldBtn(true),width:"100%",marginBottom:showHistory?10:0}}>
          {showHistory?"Hide":"📋 Show"} Payment History ({finHistory.length})
        </button>
        {showHistory&&<div>
          {finHistory.length===0&&<div style={{fontSize:12,color:C.inkFaint,fontFamily:FB,textAlign:"center",padding:"12px"}}>No payment history yet.</div>}
          {finHistory.map((f,i)=>(
            <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"8px 12px",background:C.parchment,border:`1px solid ${C.borderSoft}`,borderRadius:4,marginBottom:4}}>
              <div>
                <div style={{fontSize:12,fontFamily:FD,color:C.ink}}>{f.label}</div>
                <div style={{fontSize:10,color:C.inkFaint,fontFamily:FM}}>{f.type==="income"?"Received":"Paid"} {f.paidDate}</div>
              </div>
              <div style={{fontFamily:FD,fontSize:13,color:f.type==="income"?C.emerald:C.crimson}}>£{(f.amount||0).toFixed(2)}</div>
            </div>
          ))}
          {finHistory.length>0&&<button onClick={()=>{localStorage.removeItem("papa_finance_history");setShowHistory(false);}} style={{...goldBtn(true),marginTop:6,color:C.crimson,borderColor:C.crimson}}>Clear History</button>}
        </div>}
      </div>

      {/* Saved Plans */}
      {(()=>{
        const savedPlans=(()=>{try{return JSON.parse(localStorage.getItem("papa_saved_plans")||"[]");}catch{return[];}})();
        if(!savedPlans.length)return null;
        return(<div style={{marginTop:14,marginBottom:14}}>
          <div style={{fontSize:9,color:C.gold,fontFamily:FM,letterSpacing:"0.2em",textTransform:"uppercase",marginBottom:8}}>✦ Saved Plans & Advice</div>
          {savedPlans.map((p)=>(
            <div key={p.id} style={{background:C.card,border:`1px solid ${expandedPlanId===p.id?C.goldBorder:C.borderSoft}`,borderRadius:6,padding:"12px 14px",marginBottom:8}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                <div style={{flex:1,cursor:"pointer"}} onClick={()=>setExpandedPlanId(expandedPlanId===p.id?null:p.id)}>
                  <div style={{fontSize:10,color:C.inkFaint,fontFamily:FM,marginBottom:4}}>{p.date}</div>
                  <div style={{fontSize:13,color:C.inkMid,fontFamily:FB,lineHeight:1.5}}>{p.summary}</div>
                  <div style={{fontSize:9,color:C.gold,fontFamily:FM,marginTop:4,letterSpacing:"0.1em",textTransform:"uppercase"}}>{expandedPlanId===p.id?"▲ tap to close":"▼ tap to open full plan"}</div>
                </div>
                <button onClick={()=>{const sp=JSON.parse(localStorage.getItem("papa_saved_plans")||"[]").filter(x=>x.id!==p.id);localStorage.setItem("papa_saved_plans",JSON.stringify(sp));setView("home");setTimeout(()=>setView("finances"),50);}} style={{background:"none",border:"none",color:C.inkFaint,cursor:"pointer",fontSize:12,marginLeft:8}}>✕</button>
              </div>
              {p.data?.eleanor_advice&&<div style={{marginTop:8,padding:"8px 10px",background:C.goldPale,borderRadius:4,fontSize:12,color:C.inkMid,fontFamily:FB,fontStyle:"italic",lineHeight:1.5}}>"{p.data.eleanor_advice}"</div>}

              {/* Expanded full plan */}
              {expandedPlanId===p.id&&<div style={{marginTop:10,paddingTop:10,borderTop:`1px solid ${C.borderSoft}`}}>
                {p.planText&&<div style={{marginBottom:10}}>
                  <div style={{fontSize:9,color:C.gold,fontFamily:FM,letterSpacing:"0.15em",textTransform:"uppercase",marginBottom:4}}>Your Plan</div>
                  <div style={{fontSize:12,color:C.inkMid,fontFamily:FB,lineHeight:1.6,whiteSpace:"pre-wrap",background:C.parchment,padding:"10px",borderRadius:4}}>{p.planText}</div>
                </div>}
                {p.data?.positives?.length>0&&<div style={{marginBottom:8}}>
                  <div style={{fontSize:9,color:C.emerald,fontFamily:FM,letterSpacing:"0.15em",textTransform:"uppercase",marginBottom:4}}>✓ Strengths</div>
                  {p.data.positives.map((x,i)=><div key={i} style={{fontSize:12,color:C.inkMid,fontFamily:FB,padding:"4px 0",lineHeight:1.5}}>✓ {x}</div>)}
                </div>}
                {p.data?.considerations?.length>0&&<div style={{marginBottom:8}}>
                  <div style={{fontSize:9,color:C.gold,fontFamily:FM,letterSpacing:"0.15em",textTransform:"uppercase",marginBottom:4}}>⚠ Watch-outs</div>
                  {p.data.considerations.map((x,i)=><div key={i} style={{fontSize:12,color:C.inkMid,fontFamily:FB,padding:"4px 0",lineHeight:1.5}}>⚠ {x}</div>)}
                </div>}
                {p.data?.action_steps?.length>0&&<div style={{marginBottom:8}}>
                  <div style={{fontSize:9,color:C.sapphire,fontFamily:FM,letterSpacing:"0.15em",textTransform:"uppercase",marginBottom:4}}>Action Steps</div>
                  {p.data.action_steps.map((x,i)=><div key={i} style={{fontSize:12,color:C.inkMid,fontFamily:FB,padding:"4px 0",lineHeight:1.5}}>→ {x.step}{x.when?" ("+x.when+")":""}</div>)}
                </div>}
                {p.data?.projected_value&&<div style={{fontSize:12,color:C.inkMid,fontFamily:FB,padding:"6px 0"}}>Projected value: <span style={{fontFamily:FD,color:C.gold}}>{p.data.projected_value}</span></div>}
                <button onClick={()=>{setFinPlanRes(p.data);setFinPlanText(p.planText||"");setImpTab("finance");setView("import");}} style={{...goldBtn(true),marginTop:8}}>Re-open in Financial Planner</button>
              </div>}
            </div>
          ))}
        </div>);
      })()}

      {/* Financial Planning link */}
      <div style={{marginTop:14,padding:"12px",background:C.goldPale,border:`1px solid ${C.goldBorder}`,borderRadius:6}}>
        <div style={{fontSize:11,color:C.gold,fontFamily:FM,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:4}}>✦ Financial Planning</div>
        <div style={{fontSize:12,color:C.inkMid,fontFamily:FB,marginBottom:8}}>Paste your financial plan for Eleanor to analyse and give personalised advice.</div>
        <button style={goldBtn()} onClick={()=>{setImpTab("finance");setView("import");}}>Open Financial Planner ✦</button>
      </div>
    </div>);
  };

    const WishlistView=()=>(
    <div>
      <div style={SL}>Events I'm Thinking About</div>
      <div style={{fontSize:12,color:C.inkLight,fontFamily:FB,lineHeight:1.6,marginBottom:14}}>Eleanor will check dates, budget, travel and weather for each event.</div>
      {/* Add to wishlist - tabs */}
      <div style={{background:C.card,border:`1px solid ${C.borderSoft}`,borderRadius:6,padding:"14px",marginBottom:14}}>
        <div style={{fontSize:12,color:C.inkMid,fontFamily:FD,fontStyle:"italic",marginBottom:10}}>Add events you're thinking about</div>

        {/* Manual add */}
        <input id="wishlist-title" style={inp} placeholder="Event name e.g. Taylor Swift concert, Spa day..."/>
        <input id="wishlist-date" style={inp} type="date"/>
        <input id="wishlist-venue" style={inp} placeholder="Venue or location (optional)"/>
        <input id="wishlist-price" style={inp} placeholder="Approximate price (optional)"/>
        <button style={goldBtn()} onClick={()=>{
          const title=document.getElementById("wishlist-title")?.value;
          if(!title?.trim())return;
          setWishlist(w=>[...w,{id:Date.now(),title:title.trim(),date:document.getElementById("wishlist-date")?.value||"",venue:document.getElementById("wishlist-venue")?.value||"",price:document.getElementById("wishlist-price")?.value||"",notes:""}]);
          ["wishlist-title","wishlist-date","wishlist-venue","wishlist-price"].forEach(id=>{const el=document.getElementById(id);if(el)el.value="";});
        }}>＋ Add to Wishlist</button>
      </div>

      {/* Wishlist Import - screenshot, email, PDF, text */}
      <div style={{background:C.card,border:`1px solid ${C.borderSoft}`,borderRadius:6,padding:"14px",marginBottom:14}}>
        <div style={{fontSize:12,color:C.inkMid,fontFamily:FD,fontStyle:"italic",marginBottom:10}}>Find events from a screenshot, email or document</div>
        <div style={{display:"flex",gap:6,marginBottom:12}}>
          {[["text","📝 Text"],["image","📸 Photo"],["pdf","📄 PDF"],["email","📧 Email"]].map(([type,label])=>(
            <button key={type} onClick={()=>{setWishlistImportMode(type);setWishlistImportRes(null);setWishlistImgFile(null);setWishlistImgB64(null);}} style={{flex:1,padding:"7px 2px",borderRadius:3,border:`1.5px solid ${wishlistImportMode===type?C.goldBorder:C.borderSoft}`,background:wishlistImportMode===type?C.goldPale:C.card,color:wishlistImportMode===type?C.gold:C.inkFaint,fontFamily:FM,fontSize:8,letterSpacing:"0.06em",textTransform:"uppercase",cursor:"pointer"}}>{label}</button>
          ))}
        </div>
        {(wishlistImportMode==="text"||wishlistImportMode==="email")&&<div>
          <textarea id="wishlist-import-text" style={{...inp,minHeight:90,resize:"vertical"}} placeholder={wishlistImportMode==="email"?"Paste the email here...":"Paste any text about events or holidays..."}/>
          <button style={goldBtn()} onClick={()=>{const el=document.getElementById("wishlist-import-text");if(el)wishlistImport("text",el.value);}} disabled={wishlistImportBusy}>{wishlistImportBusy?"Searching…":"✦ Find Events"}</button>
        </div>}
        {wishlistImportMode==="image"&&<div>
          <label style={{display:"block",border:`1.5px dashed ${C.goldBorder}`,padding:"20px",textAlign:"center",cursor:"pointer",marginBottom:10,background:C.cardWarm,color:wishlistImgFile?C.emerald:C.gold,fontSize:12,fontFamily:FB,borderRadius:4}}>
            {wishlistImgFile?"✦ "+wishlistImgFile.name:"📸 Tap to upload screenshot or photo"}
            <input type="file" accept="image/*" onChange={async e=>{if(e.target.files[0]){const f=e.target.files[0];setWishlistImgFile(f);setWishlistImportRes(null);const c=await compressImage(f);if(c)setWishlistImgB64(c.b64);}}} style={{display:"none"}}/>
          </label>
          {wishlistImgB64&&<button style={goldBtn()} onClick={()=>wishlistImport("image",null,wishlistImgB64,wishlistImgFile?.type)} disabled={wishlistImportBusy}>{wishlistImportBusy?"Reading…":"✦ Find Events in Photo"}</button>}
        </div>}
        {wishlistImportMode==="pdf"&&<div>
          <label style={{display:"block",border:`1.5px dashed ${C.goldBorder}`,padding:"20px",textAlign:"center",cursor:"pointer",marginBottom:10,background:C.cardWarm,color:wishlistImgFile?C.emerald:C.gold,fontSize:12,fontFamily:FB,borderRadius:4}}>
            {wishlistImgFile?"✦ "+wishlistImgFile.name:"📄 Tap to upload PDF"}
            <input type="file" accept="application/pdf,.pdf" onChange={async e=>{if(e.target.files[0]){const f=e.target.files[0];setWishlistImgFile(f);setWishlistImportRes(null);const c=await compressImage(f);if(c)setWishlistImgB64(c.b64);}}} style={{display:"none"}}/>
          </label>
          {wishlistImgB64&&<button style={goldBtn()} onClick={()=>wishlistImport("pdf",null,wishlistImgB64)} disabled={wishlistImportBusy}>{wishlistImportBusy?"Reading…":"✦ Find Events in PDF"}</button>}
        </div>}
        {wishlistImportBusy&&<div style={{textAlign:"center",padding:"14px",color:C.gold,fontFamily:FM,fontSize:10,letterSpacing:"0.2em",textTransform:"uppercase"}} className="shimmer">Eleanor is searching…</div>}
        {wishlistImportRes?.length===0&&<div style={{fontSize:12,color:C.inkFaint,fontFamily:FB,padding:"8px 0",textAlign:"center"}}>No events found. Try pasting more detail.</div>}
        {wishlistImportRes?.length>0&&<div style={{marginTop:10}}>
          <div style={{fontSize:9,color:C.gold,fontFamily:FM,letterSpacing:"0.15em",textTransform:"uppercase",marginBottom:8}}>Found {wishlistImportRes.length} events</div>
          {wishlistImportRes.map((item,i)=>(
            <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 12px",background:C.parchment,border:`1px solid ${C.borderSoft}`,borderRadius:4,marginBottom:6}}>
              <div style={{flex:1}}>
                <div style={{fontSize:13,fontFamily:FD,color:C.ink}}>{item.title}</div>
                <div style={{fontSize:10,color:C.inkFaint,fontFamily:FM}}>{[item.date,item.venue,item.price].filter(Boolean).join(" · ")}</div>
              </div>
              <button onClick={()=>{setWishlist(w=>[...w,{...item,id:Date.now()+Math.random()}]);setWishlistImportRes(r=>r.filter((_,j)=>j!==i));}} style={{padding:"6px 12px",borderRadius:3,border:"none",background:`linear-gradient(135deg,${C.gold},${C.goldBright})`,color:C.card,fontFamily:FM,fontSize:9,letterSpacing:"0.1em",textTransform:"uppercase",cursor:"pointer",flexShrink:0,marginLeft:8}}>＋ Add</button>
            </div>
          ))}
          <button style={goldBtn()} onClick={()=>{setWishlist(w=>[...w,...wishlistImportRes.map(i=>({...i,id:Date.now()+Math.random()}))]);setWishlistImportRes(null);}}>Add All</button>
        </div>}
      </div>

      {wishlist.length===0&&<div style={{textAlign:"center",padding:"30px 0",color:C.inkFaint}}>
        <div style={{fontFamily:FD,fontSize:18,fontStyle:"italic",color:C.inkLight,marginBottom:8}}>Your wishlist is empty.</div>
        <div style={{fontSize:12,fontFamily:FB,color:C.inkFaint}}>Add events above or use Import → Paste Link.</div>
      </div>}
      {wishlist.map((item,idx)=>(
        <div key={item.id} style={{background:C.card,border:`1px solid ${C.borderSoft}`,borderRadius:6,padding:"16px",marginBottom:12,boxShadow:`0 2px 10px ${C.shadow}`}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
            <div style={{flex:1}}>
              <div style={{fontFamily:FD,fontSize:16,color:C.ink,marginBottom:3}}>{item.title}</div>
              {item.date&&<div style={{fontSize:11,color:C.gold,fontFamily:FM}}>{item.date}</div>}
              {item.venue&&<div style={{fontSize:11,color:C.inkLight,fontFamily:FB,marginTop:2}}>📍 {item.venue}</div>}
              {item.price&&<div style={{fontSize:11,color:C.inkLight,fontFamily:FB,marginTop:2}}>💰 {item.price}</div>}
            </div>
            <button onClick={()=>setWishlist(w=>w.filter((_,i)=>i!==idx))} style={{background:"none",border:"none",cursor:"pointer",color:C.inkFaint,fontSize:14,padding:"0 0 0 8px"}}>✕</button>
          </div>

          {/* Analysis result */}
          {item.analysis&&<div style={{background:C.parchment,borderRadius:4,padding:"12px",marginBottom:10,border:`1px solid ${C.borderSoft}`}}>
            {item.analysis.weather&&<div style={{fontSize:12,color:C.inkMid,fontFamily:FB,marginBottom:6}}>🌤 Weather: <strong>{item.analysis.weather}</strong></div>}
            {item.analysis.clashes?.length>0&&<div style={{fontSize:12,color:C.crimson,fontFamily:FB,marginBottom:6}}>⚠ Clashes with: {item.analysis.clashes.map(e=>e.title).join(", ")}</div>}
            {item.analysis.clashes?.length===0&&<div style={{fontSize:12,color:C.emerald,fontFamily:FB,marginBottom:6}}>✓ No schedule clashes</div>}
            {item.analysis.advice&&<div style={{fontSize:13,color:C.inkMid,fontFamily:FB,lineHeight:1.6,marginBottom:6,fontStyle:"italic"}}>"{item.analysis.advice}"</div>}
            {item.analysis.mapsUrl&&<a href={item.analysis.mapsUrl} target="_blank" rel="noreferrer" style={{fontSize:11,color:C.sapphire,fontFamily:FM,letterSpacing:"0.1em",textTransform:"uppercase",textDecoration:"none"}}>🗺 Get Directions →</a>}
          </div>}

          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
            <button onClick={()=>analyseWishlistEvent(idx)} disabled={item.analysing} style={{flex:1,padding:"9px",border:"none",borderRadius:3,background:`linear-gradient(135deg,${C.gold},${C.goldBright})`,color:C.card,fontFamily:FM,fontSize:9,letterSpacing:"0.14em",textTransform:"uppercase",cursor:"pointer"}}>
              {item.analysing?"Analysing…":"✦ Analyse"}
            </button>
            <button onClick={()=>{
              if(!window.confirm("Move '"+item.title+"' from Wishlist to your Schedule?")){return;}
              const mx=Math.max(0,...events.map(e=>e.id));
              setEvents(ev=>[...ev,{id:mx+1+Math.floor(Math.random()*1000),title:item.title,date:item.date||fmt(today),time:"09:00",priority:"high",notes:item.venue||item.notes||"",source:"wishlist"}]);
              setWishlist(w=>w.filter((_,i)=>i!==idx));
              setCriticalOnly(false);setView("home");
            }} style={{flex:1,padding:"9px",border:`1px solid ${C.goldBorder}`,borderRadius:3,background:"transparent",color:C.gold,fontFamily:FM,fontSize:9,letterSpacing:"0.14em",textTransform:"uppercase",cursor:"pointer"}}>
              📅 Move to Schedule
            </button>
            {item.date&&<a href={"https://calendar.google.com/calendar/render?action=TEMPLATE&text="+encodeURIComponent(item.title)+"&dates="+item.date.replace(/-/g,"")+"&details="+encodeURIComponent(item.notes||item.venue||"")} target="_blank" rel="noreferrer" style={{flex:1,padding:"9px",border:`1px solid ${C.sapphire}40`,borderRadius:3,background:C.sapphireBg,color:C.sapphire,fontFamily:FM,fontSize:9,letterSpacing:"0.14em",textTransform:"uppercase",cursor:"pointer",textDecoration:"none",textAlign:"center"}}>
              📅 Google Cal
            </a>}
            <button onClick={()=>{if(window.confirm("Remove '"+item.title+"' from wishlist?"))setWishlist(w=>w.filter((_,i)=>i!==idx));}} style={{padding:"9px 12px",border:`1px solid ${C.crimson}30`,borderRadius:3,background:C.crimsonBg,color:C.crimson,fontFamily:FM,fontSize:9,cursor:"pointer"}}>🗑</button>
          </div>
        </div>
      ))}
    </div>
  );

  /* ── BIRTHDAYS VIEW ── */
  const BirthdaysView=()=>{
    const [newName,setNewName]=useState("");
    const [newDate,setNewDate]=useState("");
    const [newType,setNewType]=useState("birthday");

    const upcoming=getBirthdayAlerts();
    const typeIcons={birthday:"🎂",anniversary:"💍",celebration:"🎉",other:"⭐"};

    return(<div>
      <div style={SL}>Birthdays & Celebrations</div>

      {/* Upcoming alerts */}
      {upcoming.length>0&&<div style={{marginBottom:20}}>
        <div style={{fontSize:9,color:C.crimson,fontFamily:FM,letterSpacing:"0.2em",textTransform:"uppercase",marginBottom:10}}>Coming Up — Next 30 Days</div>
        {upcoming.map(b=>{
          const action=b.action;
          const isSoon=b.days<=7;
          const isToday=b.days===0;
          const color=isToday?C.crimson:isSoon?C.gold:C.sapphire;
          const bg=isToday?C.crimsonBg:isSoon?C.goldPale:C.sapphireBg;
          return(
            <div key={b.id} style={{background:bg,border:`1px solid ${color}30`,borderLeft:`4px solid ${color}`,borderRadius:6,padding:"14px 16px",marginBottom:10}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
                <div style={{display:"flex",gap:10,alignItems:"center"}}>
                  <span style={{fontSize:24}}>{typeIcons[b.type]||"🎂"}</span>
                  <div>
                    <div style={{fontFamily:FD,fontSize:16,color:C.ink}}>{b.name}</div>
                    <div style={{fontSize:10,color:color,fontFamily:FM,marginTop:1}}>
                      {isToday?"🎉 Today!":isSoon?`In ${b.days} day${b.days>1?"s":""}`:b.days+" days"} · {new Date(b.next+"T12:00:00").toLocaleDateString("en-GB",{day:"numeric",month:"long"})}
                    </div>
                  </div>
                </div>
                <button onClick={()=>setBirthdays(bs=>bs.filter(x=>x.id!==b.id))} style={{background:"none",border:"none",cursor:"pointer",color:C.inkFaint,fontSize:12}}>✕</button>
              </div>

              {/* Eleanor suggestion */}
              {!action&&isSoon&&<div style={{background:"rgba(255,255,255,0.6)",borderRadius:4,padding:"10px 12px",marginBottom:10,fontSize:13,color:C.inkMid,fontFamily:FB,lineHeight:1.6,fontStyle:"italic"}}>
                ✦ Eleanor suggests: {b.days<=1?"It's very soon — have you got a card or gift?":b.days<=7?"Consider buying a card or present this week.":"You have time — plan something thoughtful for "+b.name+"."}
              </div>}

              {/* Action buttons */}
              {!action&&<div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                <button onClick={()=>{
                  setBirthdayActions(a=>({...a,[b.id]:"scheduled"}));
                  const mx=Math.max(...events.map(e=>e.id),0);
                  setEvents(ev=>[...ev,{id:mx+1,title:"Buy gift for "+b.name,date:fmt(new Date(new Date(b.next+"T12:00:00").getTime()-7*86400000)),time:"10:00",priority:"high",notes:b.type+" — "+b.name,source:"birthday"}]);
                }} style={{fontSize:10,padding:"6px 12px",borderRadius:3,border:"none",background:`linear-gradient(135deg,${C.gold},${C.goldBright})`,color:C.card,fontFamily:FM,letterSpacing:"0.1em",textTransform:"uppercase",cursor:"pointer"}}>📅 Schedule Reminder</button>
                <button onClick={()=>setBirthdayActions(a=>({...a,[b.id]:"done"}))} style={{fontSize:10,padding:"6px 12px",borderRadius:3,border:`1px solid ${C.emerald}`,background:C.emeraldBg,color:C.emerald,fontFamily:FM,letterSpacing:"0.1em",textTransform:"uppercase",cursor:"pointer"}}>✓ Done</button>
                <button onClick={()=>setBirthdayActions(a=>({...a,[b.id]:"skip"}))} style={{fontSize:10,padding:"6px 12px",borderRadius:3,border:`1px solid ${C.borderSoft}`,background:"transparent",color:C.inkFaint,fontFamily:FM,letterSpacing:"0.1em",textTransform:"uppercase",cursor:"pointer"}}>Skip</button>
              </div>}

              {action==="scheduled"&&<div style={{fontSize:11,color:C.emerald,fontFamily:FM,letterSpacing:"0.1em",textTransform:"uppercase"}}>✓ Reminder added to your schedule</div>}
              {action==="done"&&<div style={{fontSize:11,color:C.emerald,fontFamily:FM,letterSpacing:"0.1em",textTransform:"uppercase"}}>✓ Marked as done</div>}
              {action==="skip"&&<div style={{display:"flex",gap:8,alignItems:"center"}}>
                <div style={{fontSize:11,color:C.inkFaint,fontFamily:FM,letterSpacing:"0.1em",textTransform:"uppercase"}}>Skipped</div>
                <button onClick={()=>setBirthdayActions(a=>{const n={...a};delete n[b.id];return n;})} style={{fontSize:9,padding:"2px 8px",borderRadius:2,border:`1px solid ${C.borderSoft}`,background:"transparent",color:C.inkFaint,fontFamily:FM,cursor:"pointer"}}>Undo</button>
              </div>}
            </div>
          );
        })}
      </div>}

      {/* All birthdays list */}
      {birthdays.filter(b=>!getBirthdayAlerts().find(u=>u.id===b.id)).length>0&&<div style={{marginBottom:20}}>
        <div style={{fontSize:9,color:C.inkFaint,fontFamily:FM,letterSpacing:"0.2em",textTransform:"uppercase",marginBottom:10}}>All Dates</div>
        {birthdays.filter(b=>!getBirthdayAlerts().find(u=>u.id===b.id)).map(b=>(
          <div key={b.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 14px",background:C.card,border:`1px solid ${C.borderSoft}`,borderRadius:4,marginBottom:6}}>
            <div style={{display:"flex",gap:10,alignItems:"center"}}>
              <span>{typeIcons[b.type]||"🎂"}</span>
              <div>
                <div style={{fontSize:13,fontFamily:FD,color:C.ink}}>{b.name}</div>
                <div style={{fontSize:10,color:C.inkFaint,fontFamily:FM}}>{new Date("2000-"+b.monthDay+"T12:00:00").toLocaleDateString("en-GB",{day:"numeric",month:"long"})}</div>
              </div>
            </div>
            <button onClick={()=>setBirthdays(bs=>bs.filter(x=>x.id!==b.id))} style={{background:"none",border:"none",cursor:"pointer",color:C.inkFaint,fontSize:12}}>✕</button>
          </div>
        ))}
      </div>}

      {/* Add new */}
      <div style={{background:C.card,border:`1px solid ${C.borderSoft}`,borderRadius:6,padding:"16px",boxShadow:`0 2px 10px ${C.shadow}`}}>
        <div style={{fontFamily:FD,fontSize:16,color:C.ink,fontStyle:"italic",marginBottom:12}}>Add Birthday or Celebration</div>
        <input style={inp} placeholder="Name e.g. Julie, Mum, Anniversary" value={newName} onChange={e=>setNewName(e.target.value)}/>
        <div style={{fontSize:12,color:C.inkLight,fontFamily:FB,marginBottom:6}}>Date (day and month):</div>
        <input type="date" style={{...inp,marginBottom:12}} value={newDate?"2000-"+newDate:""} onChange={e=>{const d=e.target.value;if(d)setNewDate(d.slice(5));}}/>
        <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:14}}>
          {[["birthday","🎂 Birthday"],["anniversary","💍 Anniversary"],["celebration","🎉 Celebration"],["other","⭐ Other"]].map(([type,label])=>(
            <button key={type} onClick={()=>setNewType(type)} style={{padding:"6px 12px",borderRadius:3,border:`1.5px solid ${newType===type?C.goldBorder:C.borderSoft}`,background:newType===type?C.goldPale:C.card,color:newType===type?C.gold:C.inkFaint,fontFamily:FB,fontSize:11,cursor:"pointer"}}>{label}</button>
          ))}
        </div>
        <button style={goldBtn()} onClick={()=>{
          if(!newName.trim()||!newDate)return;
          setBirthdays(bs=>[...bs,{id:Date.now(),name:newName.trim(),monthDay:newDate,type:newType}]);
          setBirthdayActions(a=>{const n={...a};return n;});
          setNewName("");setNewDate("");
        }} disabled={!newName.trim()||!newDate}>Add Date</button>
      </div>
    </div>);
  };

  /* ── REMINDERS VIEW ── */
  const RemindersView=()=>{
    const dayNames=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
    const todayReminders=reminders.filter(r=>{
      const d=new Date().getDay().toString();
      return r.days.includes(d);
    });

    function addReminder(){
      if(!reminderText.trim())return;
      setReminders(r=>[...r,{id:Date.now(),text:reminderText.trim(),time:reminderTime,days:reminderDays,active:true}]);
      setReminderText("");setReminderTime("08:00");setReminderDays(["0","1","2","3","4","5","6"]);
    }

    return(<div>
      <div style={SL}>Reminders</div>

      {/* Today's reminders */}
      {todayReminders.length>0&&<div style={{marginBottom:20}}>
        <div style={{fontSize:9,color:C.emerald,fontFamily:FM,letterSpacing:"0.2em",textTransform:"uppercase",marginBottom:10}}>Today</div>
        {todayReminders.map(r=>(
          <div key={r.id} style={{background:C.card,border:`1px solid ${C.borderSoft}`,borderLeft:`4px solid ${C.emerald}`,borderRadius:4,padding:"12px 14px",marginBottom:6,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div>
              <div style={{fontSize:14,fontFamily:FD,color:C.ink}}>{r.text}</div>
              <div style={{fontSize:10,color:C.emerald,fontFamily:FM,marginTop:2}}>⏰ {r.time}</div>
            </div>
            <button onClick={()=>setReminders(rs=>rs.filter(x=>x.id!==r.id))} style={{background:"none",border:"none",cursor:"pointer",color:C.inkFaint,fontSize:14}}>✕</button>
          </div>
        ))}
      </div>}

      {/* All reminders */}
      {reminders.length>0&&<div style={{marginBottom:20}}>
        <div style={{fontSize:9,color:C.gold,fontFamily:FM,letterSpacing:"0.2em",textTransform:"uppercase",marginBottom:10}}>All Reminders</div>
        {reminders.map(r=>(
          <div key={r.id} style={{background:C.card,border:`1px solid ${C.borderSoft}`,borderRadius:4,padding:"11px 14px",marginBottom:6,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div>
              <div style={{fontSize:13,fontFamily:FD,color:C.ink}}>{r.text}</div>
              <div style={{fontSize:10,color:C.inkFaint,fontFamily:FM,marginTop:2}}>
                {r.time} · {r.days.length===7?"Every day":r.days.map(d=>dayNames[parseInt(d)%7]).join(", ")}
              </div>
            </div>
            <button onClick={()=>setReminders(rs=>rs.filter(x=>x.id!==r.id))} style={{background:"none",border:"none",cursor:"pointer",color:C.inkFaint,fontSize:14}}>✕</button>
          </div>
        ))}
      </div>}

      {/* Add new reminder */}
      <div style={{background:C.card,border:`1px solid ${C.borderSoft}`,borderRadius:6,padding:"16px",boxShadow:`0 2px 10px ${C.shadow}`}}>
        <div style={{fontFamily:FD,fontSize:16,color:C.ink,fontStyle:"italic",marginBottom:4}}>Add Reminder</div>
        <div style={{fontSize:12,color:C.inkLight,fontFamily:FB,marginBottom:12,lineHeight:1.6}}>e.g. Take vitamins, What's for dinner, Walk the dog, Drink water</div>
        <input id="reminder-text-input" style={inp} placeholder="Reminder text..." defaultValue={reminderText} onBlur={e=>setReminderText(e.target.value)}/>
        <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:12}}>
          <div style={{fontSize:12,color:C.inkLight,fontFamily:FB,whiteSpace:"nowrap"}}>Time:</div>
          <input type="time" value={reminderTime} onChange={e=>setReminderTime(e.target.value)} style={{...inp,marginBottom:0,flex:1}}/>
        </div>
        <div style={{fontSize:12,color:C.inkLight,fontFamily:FB,marginBottom:8}}>Repeat on:</div>
        <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:14}}>
          {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((d,i)=>{
            const val=String(i);
            const sel=reminderDays.includes(val);
            return(<button key={i} onClick={()=>setReminderDays(ds=>sel?ds.filter(x=>x!==val):[...ds,val])} style={{padding:"6px 10px",borderRadius:3,border:`1.5px solid ${sel?C.goldBorder:C.borderSoft}`,background:sel?C.goldPale:C.card,color:sel?C.gold:C.inkFaint,fontFamily:FM,fontSize:10,cursor:"pointer",letterSpacing:"0.08em"}}>{d}</button>);
          })}
        </div>
        <button style={goldBtn()} onClick={()=>{const el=document.getElementById("reminder-text-input");if(el)setReminderText(el.value);addReminder();}} disabled={false}>Add Reminder</button>
      </div>

      {/* Quick add suggestions */}
      <div style={{marginTop:16}}>
        <div style={{fontSize:9,color:C.inkFaint,fontFamily:FM,letterSpacing:"0.15em",textTransform:"uppercase",marginBottom:8}}>Quick Add</div>
        <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
          {[{text:"💊 Take vitamins",time:"08:00"},{text:"💧 Drink water",time:"10:00"},{text:"🍽 What's for dinner?",time:"16:00"},{text:"🌙 Wind down",time:"21:00"},{text:"🐕 Walk the dog",time:"07:30"},{text:"💊 Evening medication",time:"21:00"}].map((s,i)=>(
            <button key={i} onClick={()=>{setReminderText(s.text);setReminderTime(s.time);const el=document.getElementById("reminder-text-input");if(el)el.value=s.text;}} style={{padding:"6px 12px",borderRadius:20,border:`1px solid ${C.borderSoft}`,background:C.card,color:C.inkLight,fontFamily:FB,fontSize:11,cursor:"pointer"}}>{s.text}</button>
          ))}
        </div>
      </div>
    </div>);
  };

  /* ── SETTINGS VIEW ── */
  const SettingsView=()=>(
    <div>
      <div style={SL}>Settings</div>
      {/* Eleanor Voice */}
      <div style={{background:C.card,border:`1px solid ${C.borderSoft}`,borderRadius:6,padding:"16px",marginBottom:14,boxShadow:`0 2px 10px ${C.shadow}`}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
          <div style={{fontFamily:FD,fontSize:16,color:C.ink,fontStyle:"italic"}}>Eleanor's Voice</div>
          <button onClick={()=>{
            const next=!eleanorVoiceOn;
            setEleanorVoiceOn(next);
            localStorage.setItem("papa_voice_on",String(next));
            if(next)eleanorSpeak("Hello. I'm Eleanor, your Personal Assistant. Voice is now enabled.");
            else stopSpeaking();
          }} style={{padding:"8px 16px",borderRadius:4,border:`1.5px solid ${eleanorVoiceOn?C.goldBorder:C.borderSoft}`,background:eleanorVoiceOn?C.goldPale:C.card,color:eleanorVoiceOn?C.gold:C.inkFaint,fontFamily:FM,fontSize:10,letterSpacing:"0.12em",textTransform:"uppercase",cursor:"pointer"}}>
            {eleanorVoiceOn?"🔊 Voice On":"🔇 Voice Off"}
          </button>
        </div>



        <div style={{fontSize:12,color:C.inkLight,fontFamily:FB,lineHeight:1.6}}>Standard voice uses your device's built-in voice for free.</div>
        <div style={{marginTop:14,borderTop:`1px solid ${C.borderSoft}`,paddingTop:12}}>
          <div style={{fontSize:12,fontFamily:FB,color:C.inkMid,marginBottom:8}}>Voice is controlled separately:</div>
          <div style={{display:"flex",gap:8}}>
            <button onClick={()=>{const n=!eleanorVoiceOn;setEleanorVoiceOn(n);localStorage.setItem("papa_voice_on",String(n));if(!n)stopSpeaking();}} style={{flex:1,padding:"8px",borderRadius:4,border:`1.5px solid ${eleanorVoiceOn?C.goldBorder:C.borderSoft}`,background:eleanorVoiceOn?C.goldPale:C.card,color:eleanorVoiceOn?C.gold:C.inkFaint,fontFamily:FM,fontSize:9,letterSpacing:"0.1em",textTransform:"uppercase",cursor:"pointer"}}>{eleanorVoiceOn?"🔊 Chat: On":"🔇 Chat: Off"}</button>
            <button onClick={()=>{const n=!briefingVoiceOn;setBriefingVoiceOn(n);localStorage.setItem("papa_briefing_voice",String(n));if(!n)stopSpeaking();}} style={{flex:1,padding:"8px",borderRadius:4,border:`1.5px solid ${briefingVoiceOn?C.goldBorder:C.borderSoft}`,background:briefingVoiceOn?C.goldPale:C.card,color:briefingVoiceOn?C.gold:C.inkFaint,fontFamily:FM,fontSize:9,letterSpacing:"0.1em",textTransform:"uppercase",cursor:"pointer"}}>{briefingVoiceOn?"🔊 Briefing: On":"🔇 Briefing: Off"}</button>
          </div>
        </div>
      </div>

      {/* Eleanor's Memory */}
      <div style={{background:C.card,border:`1px solid ${C.borderSoft}`,borderRadius:6,padding:"16px",marginBottom:14,boxShadow:`0 2px 10px ${C.shadow}`}}>
        <div style={{fontFamily:FD,fontSize:16,color:C.ink,fontStyle:"italic",marginBottom:4}}>Eleanor's Memory</div>
        <div style={{fontSize:12,color:C.inkLight,fontFamily:FB,marginBottom:10,lineHeight:1.6}}>Eleanor automatically saves key facts from your conversations and carries them into every new session.</div>
        {sessionSummary&&<div style={{background:C.goldPale,border:`1px solid ${C.goldBorder}`,borderRadius:4,padding:"10px 12px",marginBottom:10}}>
          <div style={{fontSize:9,color:C.gold,fontFamily:FM,letterSpacing:"0.15em",textTransform:"uppercase",marginBottom:4}}>Last Session Summary</div>
          <div style={{fontSize:12,color:C.inkMid,fontFamily:FB,lineHeight:1.6}}>{sessionSummary}</div>
        </div>}
        {[["facts","Things Eleanor Remembers"],["pending_tasks","Pending Tasks"],["preferences","Your Preferences"],["emotional_notes","Recent Emotional Context"]].map(([key,label])=>(
          <div key={key} style={{marginBottom:12}}>
            <div style={{fontSize:9,color:C.gold,fontFamily:FM,letterSpacing:"0.15em",textTransform:"uppercase",marginBottom:6}}>{label}</div>
            {(persistentMemory[key]||[]).length===0&&<div style={{fontSize:11,color:C.inkFaint,fontFamily:FB,fontStyle:"italic",padding:"4px 0"}}>Nothing saved yet</div>}
            {(persistentMemory[key]||[]).map((f,i)=>(
              <div key={i} style={{marginBottom:4}}>
                {editingMemory?.key===key&&editingMemory?.index===i?(
                  <div style={{display:"flex",gap:6,alignItems:"center"}}>
                    <input
                      id={`mem-edit-${key}-${i}`}
                      defaultValue={f}
                      style={{...inp,flex:1,fontSize:11,padding:"5px 8px",marginBottom:0}}
                      autoFocus
                    />
                    <button onClick={()=>{
                      const val=document.getElementById(`mem-edit-${key}-${i}`)?.value||f;
                      const arr=[...(persistentMemory[key]||[])];
                      arr[i]=val;
                      const updated={...persistentMemory,[key]:arr};
                      setPersistentMemory(updated);
                      safeSave("papa_persistent_memory",JSON.stringify(updated));
                      setEditingMemory(null);
                    }} style={{padding:"5px 10px",borderRadius:3,border:"none",background:C.gold,color:C.card,fontFamily:FM,fontSize:9,cursor:"pointer",flexShrink:0}}>Save</button>
                    <button onClick={()=>setEditingMemory(null)} style={{padding:"5px 8px",borderRadius:3,border:`1px solid ${C.borderSoft}`,background:"none",color:C.inkFaint,fontFamily:FM,fontSize:9,cursor:"pointer"}}>✕</button>
                  </div>
                ):(
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 10px",background:C.parchment,borderRadius:3,fontSize:12,color:C.inkMid,fontFamily:FB}}>
                    <span style={{flex:1,lineHeight:1.4}}>• {f}</span>
                    <div style={{display:"flex",gap:4,flexShrink:0,marginLeft:8}}>
                      <button onClick={()=>setEditingMemory({key,index:i})} style={{background:"none",border:`1px solid ${C.borderSoft}`,borderRadius:2,padding:"2px 7px",color:C.inkFaint,fontFamily:FM,fontSize:8,cursor:"pointer",letterSpacing:"0.1em",textTransform:"uppercase"}}>Edit</button>
                      <button onClick={()=>{const updated={...persistentMemory,[key]:(persistentMemory[key]||[]).filter((_,j)=>j!==i)};setPersistentMemory(updated);safeSave("papa_persistent_memory",JSON.stringify(updated));}} style={{background:"none",border:"none",color:C.crimson,cursor:"pointer",fontSize:12}}>✕</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
            {/* Add new memory */}
            <div style={{display:"flex",gap:6,marginTop:4}}>
              <input id={`mem-add-${key}`} style={{...inp,flex:1,fontSize:11,padding:"5px 8px",marginBottom:0}} placeholder={"Add to "+label.toLowerCase()+"..."}/>
              <button onClick={()=>{
                const val=document.getElementById(`mem-add-${key}`)?.value?.trim();
                if(!val)return;
                const updated={...persistentMemory,[key]:[...(persistentMemory[key]||[]),val]};
                setPersistentMemory(updated);
                safeSave("papa_persistent_memory",JSON.stringify(updated));
                const el=document.getElementById(`mem-add-${key}`);
                if(el)el.value="";
              }} style={{padding:"5px 12px",borderRadius:3,border:"none",background:C.gold,color:C.card,fontFamily:FM,fontSize:9,cursor:"pointer",flexShrink:0,letterSpacing:"0.1em",textTransform:"uppercase"}}>＋</button>
            </div>
          </div>
        ))}
        {/* Session history */}
        {(()=>{
          try{
            const hist=JSON.parse(localStorage.getItem("papa_session_history")||"[]");
            if(!hist.length)return null;
            return(<div style={{marginTop:10,borderTop:`1px solid ${C.borderSoft}`,paddingTop:10}}>
              <div style={{fontSize:9,color:C.inkFaint,fontFamily:FM,letterSpacing:"0.15em",textTransform:"uppercase",marginBottom:8}}>Previous Sessions</div>
              {hist.map((s,i)=>(
                <div key={i} style={{padding:"7px 10px",background:C.parchment,borderRadius:3,marginBottom:6}}>
                  <div style={{fontSize:9,color:C.gold,fontFamily:FM,marginBottom:2}}>{s.date}</div>
                  <div style={{fontSize:11,color:C.inkMid,fontFamily:FB,lineHeight:1.5}}>{s.text}</div>
                </div>
              ))}
            </div>);
          }catch{return null;}
        })()}
        {!sessionSummary&&!(persistentMemory.facts||[]).length&&<div style={{fontSize:12,color:C.inkFaint,fontFamily:FB,fontStyle:"italic"}}>Eleanor will start building memory after your first conversation.</div>}
        <button onClick={()=>{if(window.confirm("Clear Eleanor's memory? She will start fresh.")){setPersistentMemory({});setSessionSummary("");localStorage.removeItem("papa_persistent_memory");localStorage.removeItem("papa_last_session");}}} style={{...goldBtn(true),color:C.crimson,borderColor:C.crimson,marginTop:4}}>Clear Memory</button>
      </div>

      {/* About Me - persistent context */}
      <div style={{background:C.card,border:`1px solid ${C.borderSoft}`,borderRadius:6,padding:"16px",marginBottom:14,boxShadow:`0 2px 10px ${C.shadow}`}}>
        <div style={{fontFamily:FD,fontSize:16,color:C.ink,fontStyle:"italic",marginBottom:4}}>About Me</div>
        <div style={{fontSize:12,color:C.inkLight,fontFamily:FB,marginBottom:10,lineHeight:1.6}}>Eleanor remembers this every session — add anything important about you, your family or your situation.</div>
        <textarea
          id="user-context-input"
          style={{...inp,minHeight:100,resize:"vertical",marginBottom:8}}
          defaultValue={userContext}
          onBlur={e=>{setUserContext(e.target.value);localStorage.setItem("papa_user_context",e.target.value);}}
        />
        <div style={{fontSize:11,color:C.emerald,fontFamily:FM}}>✓ Eleanor reads this at the start of every conversation</div>
      </div>

      <div style={{background:C.card,border:`1px solid ${C.borderSoft}`,borderRadius:6,padding:"16px",marginBottom:14,boxShadow:`0 2px 10px ${C.shadow}`}}>
        <div style={{fontFamily:FD,fontSize:16,color:C.ink,fontStyle:"italic",marginBottom:4}}>Home Address</div>
        <div style={{fontSize:12,color:C.inkLight,fontFamily:FB,marginBottom:12,lineHeight:1.6}}>Save your home address once. Eleanor uses it to show a 🗺 Travel button on every appointment in your Calendar — tap it to get directions and travel time in Google Maps.</div>
        <input
          id="home-address-input"
          style={inp}
          placeholder="e.g. 14 High Street, March, PE15 9JY"
          defaultValue={homeAddress}
          onBlur={e=>{setHomeAddress(e.target.value);localStorage.setItem("papa_home_address",e.target.value);}}
        />
        <button style={goldBtn()} onClick={()=>{const el=document.getElementById("home-address-input");if(el){setHomeAddress(el.value);localStorage.setItem("papa_home_address",el.value);}alert("Address saved!");}}> Save Address</button>
        {homeAddress&&<div style={{fontSize:11,color:C.emerald,fontFamily:FM,letterSpacing:"0.1em",marginTop:4}}>✓ Address saved — travel buttons active</div>}
      </div>
      <div style={{background:C.card,border:`1px solid ${C.borderSoft}`,borderRadius:6,padding:"16px",marginBottom:14,boxShadow:`0 2px 10px ${C.shadow}`}}>
        <div style={{fontFamily:FD,fontSize:16,color:C.ink,fontStyle:"italic",marginBottom:4}}>Travel Mode</div>
        <div style={{fontSize:12,color:C.inkLight,fontFamily:FB,marginBottom:12,lineHeight:1.6}}>How Eleanor calculates your route to events.</div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          {[["transit","🚌 Public Transport"],["walking","🚶 Walking"],["bicycling","🚲 Cycling"],["driving","🚗 Driving"]].map(([mode,label])=>(
            <button key={mode} onClick={()=>{setTravelMode(mode);localStorage.setItem("papa_travel_mode",mode);}} style={{padding:"9px 14px",borderRadius:4,border:`1.5px solid ${travelMode===mode?C.goldBorder:C.borderSoft}`,background:travelMode===mode?C.goldPale:C.card,color:travelMode===mode?C.gold:C.inkLight,fontFamily:FB,fontSize:12,cursor:"pointer"}}>
              {label}
            </button>
          ))}
        </div>
      </div>
      {/* Recurring Events */}
      <div style={{background:C.card,border:`1px solid ${C.borderSoft}`,borderRadius:6,padding:"16px",marginBottom:14,boxShadow:`0 2px 10px ${C.shadow}`}}>
        <div style={{fontFamily:FD,fontSize:16,color:C.ink,fontStyle:"italic",marginBottom:4}}>Recurring Events</div>
        <div style={{fontSize:12,color:C.inkLight,fontFamily:FB,marginBottom:12,lineHeight:1.6}}>Events that repeat automatically — dog boarding, benefits, school runs.</div>
        {(()=>{
          const recurring=JSON.parse(localStorage.getItem("papa_recurring")||"[]");
          return(<div>
            {recurring.map((r,i)=>(
              <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 12px",background:C.parchment,border:`1px solid ${C.borderSoft}`,borderRadius:3,marginBottom:6}}>
                <div>
                  <div style={{fontSize:13,fontFamily:FD,color:C.ink}}>{r.title}</div>
                  <div style={{fontSize:10,color:C.inkFaint,fontFamily:FM}}>{r.time} · {r.freq}</div>
                </div>
                <button onClick={()=>{const arr=JSON.parse(localStorage.getItem("papa_recurring")||"[]");arr.splice(i,1);localStorage.setItem("papa_recurring",JSON.stringify(arr));}} style={{background:"none",border:"none",color:C.crimson,cursor:"pointer",fontSize:12}}>✕</button>
              </div>
            ))}
            <div style={{display:"flex",gap:6,flexDirection:"column",marginTop:8}}>
              <input id="rec-title" style={inp} placeholder="Event name"/>
              <input id="rec-time" style={inp} type="time" defaultValue="09:00"/>
              <select id="rec-freq" style={inp}>
                {[["daily","Every day"],["weekly","Every week"],["fortnightly","Every 2 weeks"],["monthly","Every month"]].map(([v,l])=><option key={v} value={v}>{l}</option>)}
              </select>
              <button style={goldBtn()} onClick={()=>{
                const title=document.getElementById("rec-title")?.value;
                if(!title?.trim())return;
                const time=document.getElementById("rec-time")?.value||"09:00";
                const freq=document.getElementById("rec-freq")?.value||"weekly";
                const arr=JSON.parse(localStorage.getItem("papa_recurring")||"[]");
                arr.push({title:title.trim(),time,freq,priority:"medium"});
                localStorage.setItem("papa_recurring",JSON.stringify(arr));
                document.getElementById("rec-title").value="";
              }}>Add Recurring Event</button>
            </div>
          </div>);
        })()}
      </div>

      {/* Notifications */}
      <div style={{background:C.card,border:`1px solid ${C.borderSoft}`,borderRadius:6,padding:"16px",marginBottom:14,boxShadow:`0 2px 10px ${C.shadow}`}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
          <div style={{fontFamily:FD,fontSize:16,color:C.ink,fontStyle:"italic"}}>Notifications</div>
          {notifPermission==="granted"
            ?<div style={{fontSize:10,color:C.emerald,fontFamily:FM,letterSpacing:"0.1em",textTransform:"uppercase"}}>✓ Enabled</div>
            :<button onClick={requestNotifications} style={{padding:"7px 14px",borderRadius:4,border:"none",background:`linear-gradient(135deg,${C.gold},${C.goldBright})`,color:C.card,fontFamily:FM,fontSize:9,letterSpacing:"0.12em",textTransform:"uppercase",cursor:"pointer"}}>Enable</button>
          }
        </div>
        <div style={{fontSize:12,color:C.inkLight,fontFamily:FB,lineHeight:1.6}}>{notifPermission==="granted"?"Eleanor will notify you about reminders, upcoming events and birthdays.":"Allow notifications so Eleanor can remind you even when the app is closed."}</div>
      </div>

      {/* Privacy Policy */}
      <div style={{textAlign:"center",marginBottom:14}}>
        <button onClick={()=>setView("privacy")} style={{background:"none",border:"none",color:C.inkFaint,fontFamily:FM,fontSize:10,cursor:"pointer",letterSpacing:"0.1em",textTransform:"uppercase",textDecoration:"underline"}}>Privacy Policy</button>
      </div>

      <div style={{background:C.card,border:`1px solid ${C.borderSoft}`,borderRadius:6,padding:"16px",boxShadow:`0 2px 10px ${C.shadow}`}}>
        <div style={{fontFamily:FD,fontSize:16,color:C.ink,fontStyle:"italic",marginBottom:4}}>Clear All Data</div>
        <div style={{fontSize:12,color:C.inkLight,fontFamily:FB,marginBottom:12,lineHeight:1.6}}>Remove all events, chat history and settings.</div>
        <button onClick={()=>{if(window.confirm("Clear all data? This cannot be undone.")){localStorage.clear();setEvents([]);setMsgs([{role:"assistant",text:"Good morning. I'm Eleanor. Your data has been cleared. How may I assist you?",ts:new Date()}]);setHomeAddress("");setWishlist([]);setCriticalOnly(false);setView("home");}}} style={{...goldBtn(true),color:C.crimson,borderColor:C.crimson}}>Clear All Data</button>
      </div>
    </div>
  );

  const BACK_VIEWS=["schedule","week","briefing","import","chat","add","wishlist","settings","calendar","reminders","birthdays"];
  const VIEW_LABELS={home:"Home",schedule:"Today",week:"This Week",briefing:"Briefing",import:"Import",chat:"Eleanor",add:"New Event",wishlist:"Wishlist",settings:"Settings",calendar:"Calendar",reminders:"Reminders",birthdays:"Birthdays"};

  if(!onboarded){
    return(<OnboardingScreen
      PA_PHOTO={PA_PHOTO} C={C} FD={FD} FB={FB} FM={FM}
      onComplete={({name,address,travelMode:tm})=>{
        if(address){setHomeAddress(address);localStorage.setItem("papa_home_address",address);}
        if(tm){setTravelMode(tm);localStorage.setItem("papa_travel_mode",tm);}
        if(name){
          const ctx="Name: "+name+". "+(address?"Home: "+address+". ":"")+"Rover dog-sitter. App developer.";
          setUserContext(ctx);localStorage.setItem("papa_user_context",ctx);
        }
        localStorage.setItem("papa_onboarded","true");
        setOnboarded(true);
        const hasMem=(persistentMemory.facts||[]).length>0||(persistentMemory.pending_tasks||[]).length>0;
        const memGreet=hasMem?" I've reviewed my notes from our previous conversations and I'm fully up to date.":"";
        setMsgs([{role:"assistant",text:"Good "+(new Date().getHours()<12?"morning":new Date().getHours()<17?"afternoon":"evening")+(name?", "+name:"")+". I'm Eleanor, your Personal Executive Assistant."+memGreet+" How can I assist you today?",ts:new Date()}]);
        if(typeof Notification!=="undefined"&&Notification.permission==="default")requestNotifications();
      }}
    />);
  }

  if(view==="privacy"){return(<div style={{maxWidth:480,margin:"0 auto",minHeight:"100dvh",background:C.parchment,padding:"24px",fontFamily:FB}}>
    <button onClick={()=>setView("home")} style={{background:"none",border:"none",color:C.gold,fontFamily:FM,fontSize:12,cursor:"pointer",marginBottom:24,letterSpacing:"0.1em",textTransform:"uppercase"}}>← Back</button>
    <div style={{fontFamily:FD,fontSize:24,color:C.ink,fontStyle:"italic",marginBottom:4}}>Privacy Policy</div>
    <div style={{fontSize:10,color:C.inkFaint,fontFamily:FM,marginBottom:24}}>Last updated: June 2026</div>
    {[["Data Storage","All your data — appointments, reminders, notes, preferences — is stored locally on your device only. We do not store any personal data on our servers."],["AI Processing","When you use Eleanor's AI features, your text is sent securely to Anthropic's API for processing. No conversation history is stored by us."],["Voice","When using premium voice, text is sent to ElevenLabs for text-to-speech conversion only. Standard voice is processed entirely on your device."],["Notifications","Push notifications are handled by your device's system. No notification data is sent to our servers."],["Calendar","If you connect Google Calendar via iCal, your calendar URL is stored locally. Calendar data is fetched directly from Google."],["No Tracking","We do not use analytics, advertising trackers, or any third-party tracking. We do not sell or share your data."],["Contact","For privacy questions, contact us through the Google Play Store listing."]].map(([title,text],i)=>(
      <div key={i} style={{marginBottom:20}}>
        <div style={{fontFamily:FD,fontSize:15,color:C.ink,fontStyle:"italic",marginBottom:5}}>{title}</div>
        <div style={{fontSize:13,color:C.inkMid,fontFamily:FB,lineHeight:1.7}}>{text}</div>
      </div>
    ))}
  </div>);}

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
          {cfls.length>0&&<div className="gold-pulse" onClick={()=>{setForceConflictOpen(true);setView("schedule");}} style={{background:C.crimsonBg,border:`1.5px solid ${C.crimson}`,color:C.crimson,padding:"5px 12px",fontSize:9,fontFamily:FM,letterSpacing:"0.15em",textTransform:"uppercase",borderRadius:2,cursor:"pointer"}}>⚠ {cfls.length} Conflict{cfls.length>1?"s":""}</div>}
        </div>
        {view==="home"&&<div style={{display:"flex",gap:0,marginTop:16,border:`1px solid ${C.border}`,borderRadius:4,overflow:"hidden",boxShadow:`0 1px 8px ${C.shadow}`}}>
          {[{n:todayEvs.length,l:"Today",a:C.gold,action:()=>setView("schedule")},{n:events.filter(e=>e.priority==="critical"&&!dismissedCriticalIds.includes(e.id)).length,l:"Critical",a:C.crimson,action:()=>{setCriticalOnly(true);setView("schedule");}},{n:events.filter(e=>{const d=new Date(e.date+"T12:00:00");const now=new Date();const next7=new Date(now.getTime()+7*86400000);return d>=now&&d<=next7;}).length,l:"This Week",a:C.emerald,action:()=>setView("week")}].map((s,i)=>(
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
            <button onClick={()=>{setCriticalOnly(false);setView("home");}} style={{padding:"12px 16px",border:"none",background:"none",cursor:"pointer",color:C.gold,fontFamily:FM,fontSize:9,letterSpacing:"0.16em",textTransform:"uppercase",borderRight:`1px solid ${C.borderSoft}`,whiteSpace:"nowrap"}}>← Home</button>
            <div style={{flex:1,padding:"0 16px",fontSize:10,color:C.inkFaint,fontFamily:FM,letterSpacing:"0.18em",textTransform:"uppercase"}}>{VIEW_LABELS[view]}</div>
          </>
          :[["home","Home"],["calendar","Calendar"],["wishlist","✦ Wishlist"],["chat","Eleanor"],["finances","💰 Finances"],["add","＋ Add"]].map(([v,l])=>(
            <button key={v} onClick={()=>{if(v==="home")setCriticalOnly(false);setView(v);}} style={{padding:"12px 14px",border:"none",cursor:"pointer",fontSize:9,letterSpacing:"0.18em",textTransform:"uppercase",fontFamily:FM,whiteSpace:"nowrap",background:"transparent",color:view===v?C.gold:C.inkFaint,borderBottom:view===v?`2px solid ${C.gold}`:"2px solid transparent",transition:"all 0.2s"}}>{l}</button>
          ))
        }
      </div>

      {/* CONTENT */}
      <div style={{flex:1,padding:view==="chat"?"0":"20px 18px",overflowY:view==="chat"?"hidden":"auto"}}>
        {view==="home"     && HomeView()}
        {view==="schedule" && ScheduleView()}
        {view==="week"     && WeekView()}
        {view==="briefing" && BriefingView()}
        {view==="import"   && ImportView()}
  {view==="finances" && FinancesView()}
        {view==="chat"     && ChatView()}
        {view==="add"      && <AddView/>}
        {view==="wishlist"  && WishlistView()}
        {view==="calendar"  && CalendarView()}
        {view==="settings"  && SettingsView()}
        {view==="reminders" && RemindersView()}
        {view==="birthdays"  && BirthdaysView()}
      </div>

      {/* Weekly Goals Modal */}
      {showGoalsModal&&<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",zIndex:1001,display:"flex",alignItems:"center",justifyContent:"center",padding:"20px"}}>
        <div style={{background:C.card,borderRadius:8,padding:"24px",width:"100%",maxWidth:420,boxShadow:`0 8px 32px rgba(0,0,0,0.3)`}}>
          {/* Check last week's goals first */}
          {weeklyGoals&&weeklyGoals.status!=="reviewed"&&new Date().getDay()===0?(<div>
            <div style={{fontFamily:FD,fontSize:20,color:C.ink,fontStyle:"italic",marginBottom:6}}>Last week's goals</div>
            <div style={{fontSize:12,color:C.inkLight,fontFamily:FB,marginBottom:16}}>How did you get on?</div>
            {(weeklyGoals.goals||[]).map((g,i)=>(
              <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 12px",background:C.parchment,border:`1px solid ${C.borderSoft}`,borderRadius:4,marginBottom:8}}>
                <div style={{fontSize:13,fontFamily:FB,color:C.ink,flex:1,textDecoration:weeklyGoals.done?.[i]?"line-through":"none",color:weeklyGoals.done?.[i]?C.inkFaint:C.ink}}>{g}</div>
                <div style={{display:"flex",gap:6}}>
                  <button onClick={()=>setWeeklyGoals(wg=>({...wg,done:{...wg.done,[i]:true}}))} style={{padding:"4px 10px",borderRadius:3,border:"none",background:weeklyGoals.done?.[i]?C.emerald:C.borderSoft,color:weeklyGoals.done?.[i]?"white":C.inkFaint,fontFamily:FM,fontSize:9,cursor:"pointer",letterSpacing:"0.1em",textTransform:"uppercase"}}>✓ Done</button>
                </div>
              </div>
            ))}
            <div style={{display:"flex",gap:8,marginTop:14}}>
              <button onClick={()=>{setWeeklyGoals(wg=>({...wg,status:"reviewed"}));}} style={{flex:1,padding:"11px",borderRadius:4,border:"none",background:`linear-gradient(135deg,${C.gold},${C.goldBright})`,color:C.card,fontFamily:FM,fontSize:10,letterSpacing:"0.14em",textTransform:"uppercase",cursor:"pointer"}}>Set This Week's Goals →</button>
            </div>
          </div>):(<div>
            <div style={{fontFamily:FD,fontSize:20,color:C.ink,fontStyle:"italic",marginBottom:4}}>✦ This week's goals</div>
            <div style={{fontSize:12,color:C.inkLight,fontFamily:FB,marginBottom:16,lineHeight:1.6}}>What are 3 things you'd like to achieve this week? Eleanor will find the best days to schedule them.</div>
            {[0,1,2].map(i=>(
              <input key={i} id={`goal-${i}`} style={{...inp,marginBottom:8}} placeholder={["Goal 1 e.g. Finish app feature","Goal 2 e.g. School trip research","Goal 3 e.g. Self-care day"][i]} defaultValue={goalInput[i]}/>
            ))}
            <div style={{display:"flex",gap:8,marginTop:6}}>
              <button onClick={async()=>{
                const goals=[0,1,2].map(i=>document.getElementById("goal-"+i)?.value||"").filter(Boolean);
                if(!goals.length){setShowGoalsModal(false);return;}
                const weekKey="goals-"+fmt(today);
                localStorage.setItem("papa_goals_week",weekKey);
                const newGoals={goals,done:{},status:"active",week:weekKey,scheduledDays:{}};
                setWeeklyGoals(newGoals);
                setShowGoalsModal(false);
                const eventsThisWeek=events.filter(e=>{
                  const d=new Date(e.date+"T12:00:00");
                  return d>=today&&d<=new Date(today.getTime()+7*86400000);
                });
                const dayMap=Array.from({length:7},(_,i)=>{const d=new Date(today.getTime()+i*86400000);return fmt(d)+" "+d.toLocaleDateString("en-GB",{weekday:"long"})+" ("+eventsThisWeek.filter(e=>e.date===fmt(d)).length+" events)";}).join(", ");
                sendChat("I have 3 goals this week: "+goals.join("; ")+". Based on my schedule this week ("+dayMap+"), which are the best days to work on each goal? Please suggest a day for each one.");
                setCriticalOnly(false);setView("chat");
              }} style={{flex:1,padding:"11px",borderRadius:4,border:"none",background:`linear-gradient(135deg,${C.gold},${C.goldBright})`,color:C.card,fontFamily:FM,fontSize:10,letterSpacing:"0.14em",textTransform:"uppercase",cursor:"pointer"}}>✦ Set Goals & Ask Eleanor</button>
              <button onClick={()=>setShowGoalsModal(false)} style={{padding:"11px 16px",borderRadius:4,border:`1px solid ${C.borderSoft}`,background:"transparent",color:C.inkLight,fontFamily:FM,fontSize:10,cursor:"pointer"}}>Later</button>
            </div>
          </div>)}
        </div>
      </div>}

      {/* Trip Alert Banner */}
      {tripAlerts.length>0&&<div style={{position:"fixed",top:0,left:0,right:0,zIndex:1001,background:`linear-gradient(135deg,${C.ink},${C.inkMid})`,padding:"14px 20px",boxShadow:"0 4px 20px rgba(0,0,0,0.3)"}}>
        {tripAlerts.map((a,i)=>(
          <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div>
              <div style={{fontFamily:FD,fontSize:16,color:C.goldLight,fontStyle:"italic",marginBottom:2}}>
                {a.daysUntil===1?"✦ Tomorrow:":"✦ In 3 days:"} {a.event.title}
              </div>
              <div style={{fontSize:11,color:"rgba(255,255,255,0.7)",fontFamily:FB}}>
                {a.daysUntil===1?"Shall I run through your checklist and packing list?":"Your trip is coming up — would you like Eleanor to help you prepare?"}
              </div>
            </div>
            <div style={{display:"flex",gap:8,flexShrink:0,marginLeft:12}}>
              <button onClick={()=>{setTripAlerts(t=>t.filter((_,j)=>j!==i));sendChat("Help me prepare for "+a.event.title+" in "+a.daysUntil+" day"+(a.daysUntil>1?"s":"")+" — give me a packing list and checklist");setCriticalOnly(false);setView("chat");}} style={{padding:"6px 12px",borderRadius:3,border:"none",background:C.gold,color:C.card,fontFamily:FM,fontSize:9,letterSpacing:"0.1em",textTransform:"uppercase",cursor:"pointer"}}>✦ Prepare</button>
              <button onClick={()=>setTripAlerts(t=>t.filter((_,j)=>j!==i))} style={{padding:"6px 10px",borderRadius:3,border:"1px solid rgba(255,255,255,0.3)",background:"transparent",color:"rgba(255,255,255,0.7)",fontFamily:FM,fontSize:9,cursor:"pointer"}}>✕</button>
            </div>
          </div>
        ))}
      </div>}

      {/* Conflict Warning Modal */}
      {/* Quick Finance Action Modal */}
      {finAction&&<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:"20px"}} onClick={()=>!finActionBusy&&setFinAction(null)}>
        <div style={{background:C.card,borderRadius:8,padding:"22px",width:"100%",maxWidth:420,boxShadow:`0 8px 32px rgba(0,0,0,0.3)`}} onClick={e=>e.stopPropagation()}>
          <div style={{fontFamily:FD,fontSize:19,color:C.ink,fontStyle:"italic",marginBottom:4}}>Edit / Ask Eleanor</div>
          <div style={{background:C.goldPale,border:`1px solid ${C.goldBorder}`,borderRadius:4,padding:"10px 12px",marginBottom:14}}>
            <div style={{fontSize:14,fontFamily:FD,color:C.ink}}>{finAction.item.label}</div>
            <div style={{fontSize:11,color:C.inkFaint,fontFamily:FM}}>£{(finAction.item.amount||0).toFixed(2)}{finAction.item.date?" · "+finAction.item.date:""}</div>
          </div>
          {finAction.result?(
            <div>
              <div style={{background:C.emeraldBg,border:`1px solid ${C.emerald}30`,borderLeft:`4px solid ${C.emerald}`,borderRadius:4,padding:"12px 14px",marginBottom:14,fontSize:13,color:C.inkMid,fontFamily:FB,lineHeight:1.6}}>✦ {finAction.result}</div>
              <button onClick={()=>setFinAction(null)} style={{width:"100%",padding:"11px",borderRadius:4,border:"none",background:`linear-gradient(135deg,${C.gold},${C.goldBright})`,color:C.card,fontFamily:FM,fontSize:10,letterSpacing:"0.14em",textTransform:"uppercase",cursor:"pointer"}}>Done</button>
            </div>
          ):(
            <div>
              <div style={{fontSize:12,color:C.inkLight,fontFamily:FB,marginBottom:10,lineHeight:1.5}}>Type a change or tell Eleanor something to remember:</div>
              <textarea id="fin-action-input" style={{...inp,minHeight:60,resize:"none",marginBottom:10}} placeholder="e.g. change to £250 · Maliki is 19 now · this stops next month · rename to PIP payment"/>
              <div style={{display:"flex",gap:8}}>
                <button onClick={()=>{const v=document.getElementById("fin-action-input")?.value;if(v)processFinAction(v);}} disabled={finActionBusy} style={{flex:1,padding:"11px",borderRadius:4,border:"none",background:finActionBusy?C.borderSoft:`linear-gradient(135deg,${C.gold},${C.goldBright})`,color:C.card,fontFamily:FM,fontSize:10,letterSpacing:"0.14em",textTransform:"uppercase",cursor:"pointer"}}>{finActionBusy?"Working…":"✦ Do It"}</button>
                <button onClick={()=>setFinAction(null)} disabled={finActionBusy} style={{padding:"11px 16px",borderRadius:4,border:`1px solid ${C.borderSoft}`,background:"transparent",color:C.inkFaint,fontFamily:FM,fontSize:10,letterSpacing:"0.1em",textTransform:"uppercase",cursor:"pointer"}}>Cancel</button>
              </div>
            </div>
          )}
        </div>
      </div>}

      {/* Quick Event Action Modal */}
      {eventAction&&<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:"20px"}} onClick={()=>!eventActionBusy&&setEventAction(null)}>
        <div style={{background:C.card,borderRadius:8,padding:"22px",width:"100%",maxWidth:420,boxShadow:`0 8px 32px rgba(0,0,0,0.3)`}} onClick={e=>e.stopPropagation()}>
          <div style={{fontFamily:FD,fontSize:19,color:C.ink,fontStyle:"italic",marginBottom:4}}>Edit Event</div>
          <div style={{background:C.goldPale,border:`1px solid ${C.goldBorder}`,borderRadius:4,padding:"10px 12px",marginBottom:14}}>
            <div style={{fontSize:14,fontFamily:FD,color:C.ink}}>{eventAction.event.title}</div>
            <div style={{fontSize:11,color:C.inkFaint,fontFamily:FM}}>{eventAction.event.date}{eventAction.event.time?" at "+eventAction.event.time:""}</div>
          </div>
          {eventAction.result?(
            <div>
              <div style={{background:C.emeraldBg,border:`1px solid ${C.emerald}30`,borderLeft:`4px solid ${C.emerald}`,borderRadius:4,padding:"12px 14px",marginBottom:14,fontSize:13,color:C.inkMid,fontFamily:FB,lineHeight:1.6}}>✦ {eventAction.result}</div>
              <button onClick={()=>setEventAction(null)} style={{width:"100%",padding:"11px",borderRadius:4,border:"none",background:`linear-gradient(135deg,${C.gold},${C.goldBright})`,color:C.card,fontFamily:FM,fontSize:10,letterSpacing:"0.14em",textTransform:"uppercase",cursor:"pointer"}}>Done</button>
            </div>
          ):(
            <div>
              <div style={{fontSize:12,color:C.inkLight,fontFamily:FB,marginBottom:10,lineHeight:1.5}}>Type what you'd like to do with this event:</div>
              <textarea id="event-action-input" style={{...inp,minHeight:60,resize:"none",marginBottom:10}} placeholder="e.g. delete this event · move to Friday 4th July · change time to 2pm · rename to Dentist"/>
              <div style={{display:"flex",gap:8}}>
                <button onClick={()=>{const v=document.getElementById("event-action-input")?.value;if(v)processEventAction(v);}} disabled={eventActionBusy} style={{flex:1,padding:"11px",borderRadius:4,border:"none",background:eventActionBusy?C.borderSoft:`linear-gradient(135deg,${C.gold},${C.goldBright})`,color:C.card,fontFamily:FM,fontSize:10,letterSpacing:"0.14em",textTransform:"uppercase",cursor:"pointer"}}>{eventActionBusy?"Working…":"✦ Do It"}</button>
                <button onClick={()=>setEventAction(null)} disabled={eventActionBusy} style={{padding:"11px 16px",borderRadius:4,border:`1px solid ${C.borderSoft}`,background:"transparent",color:C.inkFaint,fontFamily:FM,fontSize:10,letterSpacing:"0.1em",textTransform:"uppercase",cursor:"pointer"}}>Cancel</button>
              </div>
              {/* Quick action shortcuts */}
              <div style={{display:"flex",gap:6,marginTop:10,flexWrap:"wrap"}}>
                {["Delete this event","Move to tomorrow","Move to next week"].map(q=>(
                  <button key={q} onClick={()=>processEventAction(q)} disabled={eventActionBusy} style={{padding:"6px 10px",borderRadius:20,border:`1px solid ${C.goldBorder}`,background:C.card,color:C.gold,fontSize:9,fontFamily:FM,letterSpacing:"0.08em",cursor:"pointer"}}>{q}</button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>}

      {conflictWarning&&<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:"20px"}}>
        <div style={{background:C.card,borderRadius:8,padding:"24px",width:"100%",maxWidth:420,boxShadow:`0 8px 32px rgba(0,0,0,0.3)`}}>
          <div style={{fontFamily:FD,fontSize:20,color:C.crimson,fontStyle:"italic",marginBottom:4}}>⚠ Schedule Conflict Detected</div>
          <div style={{fontSize:12,color:C.inkLight,fontFamily:FB,lineHeight:1.6,marginBottom:14}}>Eleanor has noticed potential conflicts with your new event.</div>
          
          <div style={{background:C.goldPale,border:`1px solid ${C.goldBorder}`,borderRadius:4,padding:"10px 12px",marginBottom:12}}>
            <div style={{fontSize:10,color:C.gold,fontFamily:FM,letterSpacing:"0.15em",textTransform:"uppercase",marginBottom:3}}>New Event</div>
            <div style={{fontSize:14,fontFamily:FD,color:C.ink}}>{conflictWarning.event.title}</div>
            <div style={{fontSize:11,color:C.inkFaint,fontFamily:FM}}>{conflictWarning.event.date}</div>
          </div>

          {conflictWarning.clashes.length>0&&<div style={{marginBottom:10}}>
            <div style={{fontSize:10,color:C.crimson,fontFamily:FM,letterSpacing:"0.15em",textTransform:"uppercase",marginBottom:6}}>Same Day</div>
            {conflictWarning.clashes.map((e,i)=>(
              <div key={i} style={{padding:"7px 10px",background:C.crimsonBg,borderLeft:`3px solid ${C.crimson}`,borderRadius:3,marginBottom:4,fontSize:12,fontFamily:FB,color:C.inkMid}}>{e.time} — {e.title}</div>
            ))}
          </div>}

          {conflictWarning.nearby.length>0&&<div style={{marginBottom:14}}>
            <div style={{fontSize:10,color:C.gold,fontFamily:FM,letterSpacing:"0.15em",textTransform:"uppercase",marginBottom:6}}>Day Before / After</div>
            {conflictWarning.nearby.map((e,i)=>(
              <div key={i} style={{padding:"7px 10px",background:C.goldPale,borderLeft:`3px solid ${C.goldBorder}`,borderRadius:3,marginBottom:4,fontSize:12,fontFamily:FB,color:C.inkMid}}>{e.date} — {e.title}</div>
            ))}
          </div>}

          <div style={{display:"flex",gap:8,flexDirection:"column"}}>
            <button onClick={()=>{setConflictWarning(null);sendChat("I just added "+conflictWarning.event.title+" on "+conflictWarning.event.date+". What do you think about potential conflicts?");setCriticalOnly(false);setView("chat");}} style={{padding:"11px",borderRadius:4,border:"none",background:`linear-gradient(135deg,${C.gold},${C.goldBright})`,color:C.card,fontFamily:FM,fontSize:10,letterSpacing:"0.14em",textTransform:"uppercase",cursor:"pointer"}}>✦ Ask Eleanor to Advise</button>
            <button onClick={()=>{
              if(conflictWarning.key)setDismissedConflicts(d=>[...d,conflictWarning.key]);
              setConflictWarning(null);
            }} style={{padding:"11px",borderRadius:4,border:`1px solid ${C.borderSoft}`,background:"transparent",color:C.inkLight,fontFamily:FM,fontSize:10,letterSpacing:"0.14em",textTransform:"uppercase",cursor:"pointer"}}>Keep Event & Don't Warn Again</button>
            <button onClick={()=>setConflictWarning(null)} style={{padding:"9px",borderRadius:4,border:`1px solid ${C.borderSoft}`,background:"transparent",color:C.inkFaint,fontFamily:FM,fontSize:10,cursor:"pointer",letterSpacing:"0.1em",textTransform:"uppercase"}}>✕ Dismiss</button>
          </div>
        </div>
      </div>}

      {/* Travel Mode Modal */}
      {showTravelModal&&<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:"20px"}}>
        <div style={{background:C.card,borderRadius:8,padding:"24px",width:"100%",maxWidth:400,boxShadow:`0 8px 32px rgba(0,0,0,0.3)`}}>
          <div style={{fontFamily:FD,fontSize:22,color:C.ink,fontStyle:"italic",marginBottom:6}}>How do you travel?</div>
          <div style={{fontSize:13,color:C.inkLight,fontFamily:FB,marginBottom:20,lineHeight:1.6}}>Eleanor will use this for all travel directions and journey advice.</div>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {[["transit","🚌 Public Transport","Bus, train, tram"],["walking","🚶 Walking","On foot"],["bicycling","🚲 Cycling","Bike"],["driving","🚗 Driving","Car or taxi"]].map(([mode,label,sub])=>(
              <button key={mode} onClick={()=>{
                setTravelMode(mode);
                localStorage.setItem("papa_travel_mode",mode);
                setShowTravelModal(false);
              }} style={{padding:"14px 16px",borderRadius:6,border:`1.5px solid ${C.borderSoft}`,background:C.card,cursor:"pointer",textAlign:"left",display:"flex",gap:12,alignItems:"center",transition:"all 0.15s"}}>
                <span style={{fontSize:24}}>{label.split(" ")[0]}</span>
                <div>
                  <div style={{fontSize:14,fontFamily:FD,color:C.ink}}>{label.slice(2)}</div>
                  <div style={{fontSize:11,color:C.inkFaint,fontFamily:FB}}>{sub}</div>
                </div>
              </button>
            ))}
          </div>
          <button onClick={()=>setShowTravelModal(false)} style={{marginTop:14,width:"100%",padding:"11px",border:`1px solid ${C.borderSoft}`,borderRadius:4,background:"transparent",color:C.inkLight,fontFamily:FM,fontSize:10,letterSpacing:"0.14em",textTransform:"uppercase",cursor:"pointer"}}>Cancel</button>
        </div>
      </div>}

      {view!=="chat"&&<div style={{padding:"11px 20px",borderTop:`1px solid ${C.border}`,background:C.cream,display:"flex",justifyContent:"space-between",alignItems:"center",gap:10}}>
        <div style={{fontSize:9,color:C.inkFaint,fontFamily:FM,letterSpacing:"0.22em",textTransform:"uppercase"}}>Personal PA Pro · Private Service</div>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          <button onClick={()=>{
            if(window.confirm("⚠ Clear ALL data?\n\nThis will permanently delete all events, chat history, reminders, birthdays and notes.\n\nThis cannot be undone.")){
              localStorage.clear();
              setEvents([]);
              setMsgs([{role:"assistant",text:"Good morning. I'm Eleanor. All data has been cleared — a fresh start. How may I assist you?",ts:new Date()}]);
              setReminders([]);
              setBirthdays([]);
              setBirthdayActions({});
              setEventNotes({});
              setWishlist([]);
              setHomeAddress("");
            }
          }} style={{padding:"5px 10px",borderRadius:3,border:`1px solid ${C.border}`,background:"transparent",color:C.inkFaint,fontFamily:FM,fontSize:8,letterSpacing:"0.12em",textTransform:"uppercase",cursor:"pointer"}}>Clear Data</button>
          <button onClick={()=>{
            // Real diagnostic: measure every key's actual byte size
            let report=[];
            let total=0;
            for(let i=0;i<localStorage.length;i++){
              const k=localStorage.key(i);
              const v=localStorage.getItem(k)||"";
              const bytes=new Blob([k+v]).size;
              total+=bytes;
              report.push([k,bytes]);
            }
            report.sort((a,b)=>b[1]-a[1]);
            const top=report.slice(0,8).map(([k,b])=>k+": "+(b/1024).toFixed(1)+"KB").join("\n");
            alert("STORAGE USED: "+(total/1024/1024).toFixed(2)+"MB of ~5MB\n\nBIGGEST ITEMS:\n"+top);
          }} style={{padding:"5px 10px",borderRadius:3,border:`1px solid ${C.sapphire}`,background:C.sapphireBg,color:C.sapphire,fontFamily:FM,fontSize:8,letterSpacing:"0.12em",textTransform:"uppercase",cursor:"pointer"}}>Check Storage</button>
          <button onClick={()=>{
            cleanupOldStorage();
            try{const m=JSON.parse(localStorage.getItem("papa_msgs")||"[]");if(m.length>15)localStorage.setItem("papa_msgs",JSON.stringify(m.slice(-15)));}catch{}
            try{localStorage.removeItem("papa_session_history");}catch{}
            alert("✓ Freed up space. Old meal notes, alerts and excess chat history cleared. Your events, finances and plans are untouched.");
          }} style={{padding:"5px 10px",borderRadius:3,border:`1px solid ${C.goldBorder}`,background:C.goldPale,color:C.gold,fontFamily:FM,fontSize:8,letterSpacing:"0.12em",textTransform:"uppercase",cursor:"pointer"}}>Free Up Space</button>
          {!installed&&installPrompt&&<button onClick={installApp} style={{padding:"6px 14px",borderRadius:20,border:`1px solid ${C.goldBorder}`,background:`linear-gradient(135deg,${C.gold},${C.goldBright})`,color:C.card,fontSize:9,fontFamily:FM,letterSpacing:"0.14em",textTransform:"uppercase",cursor:"pointer",whiteSpace:"nowrap",flexShrink:0}}>⬇ Install App</button>}
          {installed&&<div style={{fontSize:9,color:C.emerald,fontFamily:FM,letterSpacing:"0.14em",textTransform:"uppercase"}}>✓ Installed</div>}
          {!installed&&!installPrompt&&<div style={{fontSize:11,color:C.goldBorder,fontFamily:FD}}>✦</div>}
        </div>
      </div>}
    </div>
  );
}

export default function App(){
  return <ErrorBoundary><AppInner/></ErrorBoundary>;
}
