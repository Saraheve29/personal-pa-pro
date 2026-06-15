import { useState, useEffect, useRef } from "react";


// ── Palette & constants ──────────────────────────────────────────────────────
const PALETTE = {
  honey:   "#F5A623",
  amber:   "#E8891A",
  comb:    "#FDF3E3",
  pollen:  "#FFF8EE",
  sage:    "#7BB369",
  sky:     "#5B9BD5",
  lavender:"#9B8BC4",
  blush:   "#E8737A",
  dark:    "#2C2016",
  mid:     "#6B5744",
  soft:    "#A8937E",
};

const EMOTIONS = [
  // Positive
  { label:"Joyful",     emoji:"😄", color:"#F5A623", valence:"positive", score:10 },
  { label:"Excited",    emoji:"🤩", color:"#FF9500", valence:"positive", score:9  },
  { label:"Grateful",   emoji:"🙏", color:"#7BB369", valence:"positive", score:9  },
  { label:"Peaceful",   emoji:"😌", color:"#5B9BD5", valence:"positive", score:8  },
  { label:"Happy",      emoji:"😊", color:"#F5A623", valence:"positive", score:8  },
  { label:"Hopeful",    emoji:"🌟", color:"#FFD700", valence:"positive", score:7  },
  { label:"Loved",      emoji:"🥰", color:"#FF6B9D", valence:"positive", score:7  },
  // Neutral
  { label:"Okay",       emoji:"😐", color:"#A8937E", valence:"neutral",  score:6  },
  { label:"Calm",       emoji:"😊", color:"#5B9BD5", valence:"neutral",  score:6  },
  { label:"Tired",      emoji:"😴", color:"#9B8BC4", valence:"neutral",  score:5  },
  { label:"Confused",   emoji:"🤔", color:"#6B9BB8", valence:"neutral",  score:4  },
  // Difficult
  { label:"Anxious",    emoji:"😰", color:"#E8737A", valence:"difficult", score:3 },
  { label:"Irritated",  emoji:"😤", color:"#E8731A", valence:"difficult", score:3 },
  { label:"Angry",      emoji:"😠", color:"#CC2200", valence:"difficult", score:2 },
  { label:"Sad",        emoji:"😢", color:"#7B90CC", valence:"difficult", score:2 },
  { label:"Low",        emoji:"😔", color:"#9B8BC4", valence:"difficult", score:2 },
  { label:"Struggling", emoji:"💔", color:"#C45B6A", valence:"difficult", score:1 },
  { label:"Overwhelmed",emoji:"😵", color:"#A05080", valence:"difficult", score:1 },
];
const MOODS = EMOTIONS; // legacy alias


const CHEST_CLOSED = "/chest-closed.webp";
const CHEST_OPEN   = "/chest-open.webp";

const SEA_BG = "/sea.jpg";

const RELEASE_STYLES = [
  { id:"sea",   label:"Release to the Sea", emoji:"🌊" },
  { id:"sky",   label:"Send to the Sky",    emoji:"☁️" },
  { id:"fire",  label:"Burn Away",          emoji:"🔥" },
  { id:"wind",  label:"Let the Wind Take It",emoji:"🍃" },
];

// ── Tiny helpers ─────────────────────────────────────────────────────────────
const today = () => new Date().toISOString().slice(0,10);
const fmtDate = d => new Date(d).toLocaleDateString("en-GB",{day:"numeric",month:"short"});
const uid = () => Math.random().toString(36).slice(2,9);

// ── Bee SVG mascot ───────────────────────────────────────────────────────────
function BeeMascot({ size=64, outfit="default", animated=false }) {
  return (
    <div style={{
      width: size,
      height: size,
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      animation: animated ? "beeBob 2s ease-in-out infinite" : "none",
      flexShrink: 0,
    }}>
      <style>{`@keyframes beeBob{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}`}</style>
      <img
        src="/bea.jpg"
        alt="Bea the bee therapist"
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
        }}
      />
    </div>
  );
}

// ── Breathing circle ─────────────────────────────────────────────────────────
function BreathingCircle() {
  const [phase, setPhase] = useState("inhale");
  const [count, setCount] = useState(0);
  const [active, setActive] = useState(false);
  const ref = useRef();
  useEffect(()=>{
    if(!active) return;
    const phases=[{p:"inhale",d:4},{p:"hold",d:4},{p:"exhale",d:6}];
    let i=0, timer;
    const run=()=>{
      const {p,d}=phases[i%3];
      setPhase(p); setCount(d);
      let c=d;
      timer=setInterval(()=>{
        c--;
        setCount(c);
        if(c<=0){ clearInterval(timer); i++; run(); }
      },1000);
    };
    run();
    return ()=>clearInterval(timer);
  },[active]);
  const size = phase==="inhale"?120:phase==="hold"?120:80;
  const label = phase==="inhale"?"Breathe in…":phase==="hold"?"Hold…":"Breathe out…";
  return (
    <div style={{textAlign:"center",padding:24}}>
      <div style={{
        width:size,height:size,borderRadius:"50%",
        background:`radial-gradient(circle, ${PALETTE.sky}88, ${PALETTE.lavender}55)`,
        margin:"0 auto 12px",
        transition:"all 1s ease",
        display:"flex",alignItems:"center",justifyContent:"center",
        fontSize:28,fontWeight:700,color:"white"
      }}>{count||""}</div>
      <p style={{color:PALETTE.mid,fontWeight:600,marginBottom:12}}>{active?label:"Press start to begin"}</p>
      <button onClick={()=>setActive(a=>!a)} style={btnStyle(active?PALETTE.blush:PALETTE.sage)}>
        {active?"Stop":"Start Breathing"}
      </button>
    </div>
  );
}

// ── Wave sound generator ─────────────────────────────────────────────────────
function playWaves(duration=4000) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const master = ctx.createGain();
    master.gain.setValueAtTime(0, ctx.currentTime);
    master.gain.linearRampToValueAtTime(0.4, ctx.currentTime + 0.5);
    master.gain.linearRampToValueAtTime(0, ctx.currentTime + duration/1000);
    master.connect(ctx.destination);

    // Create layered wave sounds using filtered noise
    for(let i=0; i<3; i++) {
      const buf = ctx.createBuffer(1, ctx.sampleRate * (duration/1000 + 1), ctx.sampleRate);
      const data = buf.getChannelData(0);
      for(let j=0; j<data.length; j++) data[j] = Math.random()*2-1;

      const src = ctx.createBufferSource();
      src.buffer = buf;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 200 + i*100;
      filter.Q.value = 0.5;

      const gain = ctx.createGain();
      gain.gain.value = 0.3 + i*0.1;

      // Oscillate gain to create wave rhythm
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.value = 0.3 + i*0.15;
      lfoGain.gain.value = 0.2;
      lfo.connect(lfoGain);
      lfoGain.connect(gain.gain);
      lfo.start();

      src.connect(filter);
      filter.connect(gain);
      gain.connect(master);
      src.start(ctx.currentTime + i*0.3);
    }

    setTimeout(()=>ctx.close(), duration + 1000);
  } catch(e) {
    // Audio not available - silent fallback
  }
}

// ── Release Animation — sea sunset ───────────────────────────────────────────
function ReleaseAnimation({ style, onDone, text="" }) {
  const [opacity, setOpacity] = useState(0);
  const [floatY, setFloatY]   = useState(0);
  const [phase, setPhase]     = useState("fadein"); // fadein | floating | fadeout

  useEffect(()=>{
    // Start wave sounds
    playWaves(5000);

    let frame;
    let start = null;
    const totalDuration = 5000;

    const animate = (ts) => {
      if(!start) start = ts;
      const elapsed = ts - start;
      const p = Math.min(elapsed / totalDuration, 1);

      if(p < 0.15) {
        // Fade in
        setOpacity(p / 0.15);
        setPhase("fadein");
      } else if(p < 0.8) {
        // Float and drift
        setOpacity(1);
        setFloatY(-180 * ((p - 0.15) / 0.65));
        setPhase("floating");
      } else {
        // Fade out
        setOpacity(1 - (p - 0.8) / 0.2);
        setPhase("fadeout");
      }

      if(p < 1) {
        frame = requestAnimationFrame(animate);
      } else {
        onDone();
      }
    };

    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div style={{
      position:"fixed", inset:0, zIndex:999,
      backgroundImage:`url(${SEA_BG})`,
      backgroundSize:"cover",
      backgroundPosition:"center",
      opacity,
      transition:"none",
      display:"flex",
      flexDirection:"column",
      alignItems:"center",
      justifyContent:"flex-end",
      paddingBottom:80,
    }}>
      {/* Dark overlay at bottom for text readability */}
      <div style={{
        position:"absolute",inset:0,
        background:"linear-gradient(180deg, rgba(0,0,0,0) 40%, rgba(0,0,0,0.5) 100%)",
        pointerEvents:"none",
      }}/>

      {/* Animated wave overlay */}
      <div style={{
        position:"absolute",bottom:0,left:0,right:0,height:120,
        background:"linear-gradient(180deg, transparent, rgba(100,150,200,0.3))",
        animation:"waveRise 2s ease-in-out infinite alternate",
      }}/>
      <style>{`
        @keyframes waveRise {
          from { transform: translateY(10px) scaleX(1); }
          to   { transform: translateY(-10px) scaleX(1.02); }
        }
        @keyframes floatAway {
          from { transform: translateY(0) scale(1); opacity: 1; }
          to   { transform: translateY(-200px) scale(0.3); opacity: 0; }
        }
      `}</style>

      {/* The problem/item floating away */}
      {text && (
        <div style={{
          position:"absolute",
          bottom: 200,
          left:"50%",
          transform:`translateX(-50%) translateY(${floatY}px)`,
          background:"rgba(255,255,255,0.15)",
          backdropFilter:"blur(8px)",
          border:"1px solid rgba(255,255,255,0.3)",
          borderRadius:16,
          padding:"12px 20px",
          maxWidth:260,
          textAlign:"center",
          transition:"none",
        }}>
          <p style={{
            margin:0, color:"white", fontSize:14, lineHeight:1.5,
            textShadow:"0 1px 4px rgba(0,0,0,0.5)",
            fontStyle:"italic",
          }}>{text}</p>
        </div>
      )}

      {/* Message */}
      <div style={{position:"relative",zIndex:1,textAlign:"center",padding:"0 24px"}}>
        <p style={{
          color:"white",fontSize:18,fontWeight:700,margin:"0 0 6px",
          textShadow:"0 2px 8px rgba(0,0,0,0.6)",
        }}>
          {phase==="fadein" ? "Let it go…" : phase==="floating" ? "Releasing…" : "It's gone 🌊"}
        </p>
        <p style={{
          color:"rgba(255,255,255,0.8)",fontSize:13,margin:0,
          textShadow:"0 1px 4px rgba(0,0,0,0.5)",
        }}>
          The sea takes it from here
        </p>
      </div>
    </div>
  );
}

// ── Shared button style ───────────────────────────────────────────────────────
const btnStyle = (bg=PALETTE.honey, small=false) => ({
  background:bg, color:"white", border:"none", borderRadius:999,
  padding: small?"6px 14px":"10px 22px",
  fontSize: small?13:15, fontWeight:700, cursor:"pointer",
  boxShadow:"0 2px 8px rgba(0,0,0,0.15)",
  transition:"opacity .15s",
});

// ── AI chat helper ────────────────────────────────────────────────────────────
async function askBee(messages) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({
      model:"claude-sonnet-4-6",
      max_tokens:1000,
      system:`You are Bea — a warm, gentle bee therapist mascot for BeeWell, a mental wellness app.
You are non-judgmental, supportive, and use calm, encouraging language.
Keep responses concise (2-4 sentences) and conversational.
Occasionally use 🐝 at the end of a thought, but sparingly.
Never give medical advice. If someone seems in crisis, gently suggest they reach out to a professional or crisis line.
You guide users through CBT tools, mood tracking, and grounding exercises with care and warmth.`,
      messages,
    })
  });
  const data = await res.json();
  return data.content?.find(b=>b.type==="text")?.text || "I'm here with you. 🐝";
}

// ═══════════════════════════════════════════════════════════════════════════════
// SCREENS
// ═══════════════════════════════════════════════════════════════════════════════

// ── Onboarding ────────────────────────────────────────────────────────────────
function Onboarding({ onDone }) {
  const [step, setStep] = useState(0);
  const steps = [
    { title:"Welcome to your Hive 🍯", body:"This is your private, safe space. Everything here belongs to you — no judgement, no pressure, just support whenever you need it.", emoji:"🏡" },
    { title:"Meet Bea 🐝", body:"I'm Bea, your gentle bee therapist. I'm here to listen, guide you through tools, and cheer you on. You're never alone in the hive.", emoji:null, bee:true },
    { title:"Track your mood", body:"Log how you're feeling each day — I'll quietly spot patterns and help you understand yourself better over time.", emoji:"📊" },
    { title:"Your Feel Better Box", body:"Save everything that lifts you up: songs, quotes, photos, moments. Pull it open any time you need a lift.", emoji:"💛" },
    { title:"Let things go", body:"When worries feel heavy, you can store them safely or release them — send them to the sea, the sky, wherever feels right.", emoji:"🌊" },
    { title:"Thought Courtroom", body:"When a difficult thought won't leave you alone, we'll examine it together — fairly, gently — and find a balanced truth.", emoji:"⚖️" },
  ];
  const s = steps[step];
  return (
    <div style={{minHeight:"100vh",background:`linear-gradient(160deg,${PALETTE.comb} 0%,#FFF5D6 100%)`,
      display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24}}>
      <div style={{maxWidth:360,textAlign:"center"}}>
        <div style={{marginBottom:16}}>
          {s.bee ? <BeeMascot size={100} outfit="therapist" animated/> : <div style={{fontSize:72}}>{s.emoji}</div>}
        </div>
        <h2 style={{fontFamily:"Georgia,serif",fontSize:24,color:PALETTE.dark,marginBottom:12}}>{s.title}</h2>
        <p style={{color:PALETTE.mid,fontSize:16,lineHeight:1.6,marginBottom:32}}>{s.body}</p>
        <div style={{display:"flex",gap:8,justifyContent:"center",marginBottom:24}}>
          {steps.map((_,i)=>(
            <div key={i} style={{width:8,height:8,borderRadius:4,
              background:i===step?PALETTE.honey:"#DDD",transition:"background .2s"}}/>
          ))}
        </div>
        <button onClick={()=> step<steps.length-1 ? setStep(s=>s+1) : onDone()}
          style={btnStyle()}>
          {step<steps.length-1 ? "Next →" : "Enter My Hive 🍯"}
        </button>
      </div>
    </div>
  );
}

// ── Mood Tracker ──────────────────────────────────────────────────────────────
function MoodTracker({ logs, onSaveMood, onAddFeel, onAddDifficult }) {
  // step: "emotion" → "rating" → "followup" → "done"
  const [step, setStep]       = useState("emotion");
  const [emotion, setEmotion] = useState(null);
  const [rating, setRating]   = useState(null);
  const [followupText, setFollowupText] = useState("");
  const [saved, setSaved]     = useState(false);

  const reset = () => { setStep("emotion"); setEmotion(null); setRating(null); setFollowupText(""); setSaved(false); };

  const followupQ = emotion
    ? emotion.valence === "positive"
      ? `What's helped you feel ${emotion.label.toLowerCase()} today? 💛`
      : emotion.valence === "difficult"
      ? `What's been making you feel ${emotion.label.toLowerCase()}? It's safe to share here.`
      : "Anything on your mind you'd like to note?"
    : "";

  const handleSave = () => {
    if(!emotion || !rating) return;
    // Save the mood log
    onSaveMood({ id:uid(), date:today(), mood:emotion, rating, note:followupText });
    // Auto-save to appropriate box if text was entered
    if(followupText.trim()) {
      if(emotion.valence === "positive") {
        onAddFeel({ id:uid(), text:followupText.trim(), type:"moment",
          source:`Felt ${emotion.label} (${rating}/10)`, date:today() });
      } else if(emotion.valence === "difficult") {
        onAddDifficult({ id:uid(), text:followupText.trim(),
          emotion: emotion.label, date:today(), status:"pending" });
      }
    }
    setSaved(true);
    setTimeout(()=>{ reset(); },2200);
  };

  // Chart last 14 days
  const last14 = [...Array(14)].map((_,i)=>{
    const d = new Date(); d.setDate(d.getDate()-13+i);
    const key = d.toISOString().slice(0,10);
    const entry = ([...logs].filter(l=>l.date===key).slice(-1)[0]);
    return { key, rating: entry?.rating||null, emotion: entry?.mood, label:d.toLocaleDateString("en-GB",{day:"numeric",month:"short"}) };
  });

  if(saved) return (
    <div style={{textAlign:"center",padding:40}}>
      <div style={{fontSize:48,marginBottom:12}}>{emotion?.emoji}</div>
      <h3 style={{...sectionTitle,textAlign:"center"}}>Logged 🐝</h3>
      <p style={{color:PALETTE.mid,fontSize:14}}>
        {followupText && emotion?.valence==="positive" && "Added to your Feel Better Box 💛"}
        {followupText && emotion?.valence==="difficult" && "Sent to your Problem Box 📦 — open it when ready"}
      </p>
    </div>
  );

  return (
    <div>
      {/* Step 1 — Pick emotion group then specific emotion */}
      {step === "emotion" && <>
        <h3 style={sectionTitle}>How are you feeling right now?</h3>
        <p style={{color:PALETTE.soft,fontSize:13,marginBottom:20}}>Choose a group to see your options.</p>

        {/* Three big attractive group buttons */}
        {[
          { valence:"positive", label:"Positive",  emoji:"☀️",
            sub:"Joyful · Excited · Grateful · Peaceful · Happy · Hopeful · Loved",
            grad:"linear-gradient(135deg,#F5A623,#FFD700)",
            shadow:"0 4px 20px rgba(245,166,35,0.45)" },
          { valence:"neutral",  label:"Neutral",   emoji:"🌤️",
            sub:"Okay · Calm · Tired · Confused",
            grad:"linear-gradient(135deg,#6B9BB8,#9B8BC4)",
            shadow:"0 4px 20px rgba(107,155,184,0.45)" },
          { valence:"difficult",label:"Difficult", emoji:"🌧️",
            sub:"Anxious · Angry · Sad · Low · Overwhelmed · Irritated · Struggling",
            grad:"linear-gradient(135deg,#C45B6A,#9B6BC4)",
            shadow:"0 4px 20px rgba(196,91,106,0.4)" },
        ].map(group=>(
          <div key={group.valence} style={{marginBottom:12}}>
            <button
              onClick={()=>setEmotion(group.valence==="expand" ? null : {_group:group.valence})}
              style={{
                width:"100%", border:"none", borderRadius:16, cursor:"pointer",
                background: group.grad,
                boxShadow: group.shadow,
                padding:"18px 20px",
                display:"flex", alignItems:"center", gap:14,
                transition:"transform .15s",
              }}
              onMouseDown={e=>e.currentTarget.style.transform="scale(0.98)"}
              onMouseUp={e=>e.currentTarget.style.transform="scale(1)"}
            >
              <span style={{fontSize:36}}>{group.emoji}</span>
              <div style={{textAlign:"left",flex:1}}>
                <div style={{color:"white",fontWeight:800,fontSize:18,marginBottom:3,
                  textShadow:"0 1px 3px rgba(0,0,0,0.2)"}}>{group.label}</div>
                <div style={{color:"rgba(255,255,255,0.85)",fontSize:12,lineHeight:1.4}}>
                  {group.sub}
                </div>
              </div>
              <span style={{color:"rgba(255,255,255,0.8)",fontSize:20}}>›</span>
            </button>

            {/* Expanded emotion pills — show when this group is selected */}
            {emotion?._group === group.valence && (
              <div style={{
                background:"white", borderRadius:"0 0 16px 16px",
                padding:"14px 14px 10px",
                boxShadow:"0 6px 20px rgba(0,0,0,0.1)",
                marginTop:-4,
                display:"flex", flexWrap:"wrap", gap:8,
              }}>
                {EMOTIONS.filter(e=>e.valence===group.valence).map(e=>(
                  <button key={e.label}
                    onClick={()=>{ setEmotion(e); setStep("rating"); }}
                    style={{
                      padding:"8px 14px", borderRadius:999, border:"none",
                      background:`${e.color}18`, cursor:"pointer",
                      display:"flex", alignItems:"center", gap:6,
                      fontSize:14, color:PALETTE.dark, fontWeight:600,
                      boxShadow:`inset 0 0 0 1.5px ${e.color}55`,
                      transition:"all .15s",
                    }}
                    onMouseDown={ev=>ev.currentTarget.style.background=`${e.color}33`}
                    onMouseUp={ev=>ev.currentTarget.style.background=`${e.color}18`}
                  >
                    <span style={{fontSize:18}}>{e.emoji}</span>
                    <span>{e.label}</span>
                  </button>
                ))}
                <button onClick={()=>setEmotion(null)}
                  style={{padding:"6px 12px",borderRadius:999,border:"none",
                    background:"#F0F0F0",color:PALETTE.soft,fontSize:12,cursor:"pointer"}}>
                  ✕ Close
                </button>
              </div>
            )}
          </div>
        ))}
      </>}

      {/* Step 2 — Rate 1–10 */}
      {step === "rating" && emotion && !emotion._group && <>
        <button onClick={()=>{setStep("emotion");setEmotion({_group:emotion.valence});}} style={{...btnStyle("#EEE",true),color:PALETTE.mid,marginBottom:16}}>← Back</button>
        <div style={{textAlign:"center",marginBottom:20}}>
          <div style={{fontSize:52,marginBottom:6}}>{emotion.emoji}</div>
          <h3 style={{...sectionTitle,textAlign:"center",margin:0}}>{emotion.label}</h3>
        </div>
        <h4 style={{color:PALETTE.mid,marginBottom:12,fontWeight:600}}>How strongly are you feeling this? (1–10)</h4>
        <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:8,marginBottom:20}}>
          {[1,2,3,4,5,6,7,8,9,10].map(n=>{
            const isSelected = rating===n;
            // colour shifts from blue→amber→orange as intensity rises
            const col = n<=3?"#7BA8CC": n<=6?"#F5A623": n<=8?"#E8891A":"#CC4400";
            return (
              <button key={n} onClick={()=>setRating(n)}
                style={{
                  padding:"12px 4px", borderRadius:12, border:"none", cursor:"pointer",
                  background: isSelected ? col : "#F5F3F0",
                  color: isSelected?"white":PALETTE.mid,
                  fontWeight:700, fontSize:16,
                  transform: isSelected?"scale(1.1)":"scale(1)",
                  transition:"all .15s",
                  boxShadow: isSelected?`0 3px 10px ${col}66`:"none",
                }}>
                {n}
              </button>
            );
          })}
        </div>
        {rating && (
          <div style={{textAlign:"center",marginBottom:16}}>
            <span style={{fontSize:13,color:PALETTE.soft}}>
              {rating<=3?"Mild":rating<=5?"Moderate":rating<=7?"Strong":"Very strong"} {emotion.label.toLowerCase()}
            </span>
          </div>
        )}
        <button onClick={()=>rating&&setStep("followup")} disabled={!rating}
          style={{...btnStyle(emotion.color), opacity:rating?1:0.4, width:"100%"}}>
          Next →
        </button>
      </>}

      {/* Step 3 — Follow-up question */}
      {step === "followup" && emotion && <>
        <button onClick={()=>setStep("rating")} style={{...btnStyle("#EEE",true),color:PALETTE.mid,marginBottom:16}}>← Back</button>
        <div style={{...card, background: emotion.valence==="positive"?`${PALETTE.honey}18`:`${PALETTE.lavender}18`, marginBottom:16}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
            <BeeMascot size={28}/>
            <span style={{fontSize:13,fontWeight:600,color:PALETTE.mid}}>Bea asks…</span>
          </div>
          <p style={{margin:0,color:PALETTE.dark,fontSize:15,lineHeight:1.5}}>{followupQ}</p>
        </div>
        <textarea value={followupText} onChange={e=>setFollowupText(e.target.value)}
          placeholder="Type here… or leave blank to skip"
          style={{...textareaStyle, marginBottom:12}}/>
        {followupText && (
          <p style={{fontSize:12,color:emotion.valence==="positive"?PALETTE.sage:PALETTE.blush,marginBottom:12}}>
            {emotion.valence==="positive"
              ? "✓ This will be saved to your Feel Better Box 💛"
              : "✓ This will be sent to your Problem Box 📦"}
          </p>
        )}
        <button onClick={handleSave} style={{...btnStyle(emotion.color), width:"100%"}}>
          Save & Finish
        </button>
      </>}

      {/* History chart */}
      {step === "emotion" && logs.length > 1 && <>
        <h3 style={{...sectionTitle,marginTop:28}}>Your last 14 days</h3>
        <div style={{display:"flex",alignItems:"flex-end",gap:3,height:80,padding:"0 4px"}}>
          {last14.map(d=>(
            <div key={d.key} title={d.emotion?`${d.emotion.label} — ${d.rating}/10`:""} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center"}}>
              <div style={{
                width:"100%",borderRadius:4,
                background:d.rating ? (d.emotion?.color||PALETTE.honey) : "#EEE",
                height: d.rating ? `${d.rating*7}px` : "6px",
                transition:"height .4s ease", cursor:"default",
              }}/>
            </div>
          ))}
        </div>
        <div style={{display:"flex",justifyContent:"space-between",marginTop:4,fontSize:10,color:PALETTE.soft}}>
          <span>{last14[0].label}</span><span>Today</span>
        </div>
        <p style={{fontSize:11,color:PALETTE.soft,marginTop:4,textAlign:"center"}}>Bars taller = stronger intensity</p>
      </>}
    </div>
  );
}

// ── Feel Better Box ───────────────────────────────────────────────────────────
function FeelBetterBox({ items, onAdd, onDelete }) {
  const [isOpen, setIsOpen]   = useState(false);
  const [adding, setAdding]   = useState(false);
  const [text, setText]       = useState("");
  const [type, setType]       = useState("moment");
  const [justAdded, setJustAdded] = useState(false);

  const types = [
    {id:"moment",   label:"Moment",   emoji:"✨", color:"#F5A623"},
    {id:"activity", label:"Activity", emoji:"🎯", color:"#7BB369"},
    {id:"thought",  label:"Thought",  emoji:"💭", color:"#9B8BC4"},
    {id:"quote",    label:"Quote",    emoji:"📖", color:"#5B9BD5"},
    {id:"song",     label:"Song",     emoji:"🎵", color:"#E8737A"},
  ];

  const add = () => {
    if(!text.trim()) return;
    onAdd({ id:uid(), text:text.trim(), type, date:today() });
    setText("");
    setAdding(false);
    setJustAdded(true);
    setTimeout(()=>setJustAdded(false), 2000);
  };

  // Group items by type
  const grouped = types.map(t=>({
    ...t,
    items: items.filter(i=>i.type===t.id)
  })).filter(g=>g.items.length>0);

  return (
    <div style={{padding:"0 0 80px"}}>
      <h3 style={sectionTitle}>Feel Better Box</h3>
      <p style={{color:PALETTE.soft,fontSize:13,marginBottom:20,lineHeight:1.6}}>
        {isOpen
          ? "Everything that lifts you — open whenever you need it 💛"
          : "Tap the chest to open your collection of good things 💛"}
      </p>

      {/* ── THE GOLDEN CHEST ── */}
      <div style={{textAlign:"center",marginBottom:24}}>
        <div onClick={()=>setIsOpen(o=>!o)} style={{cursor:"pointer",display:"inline-block",position:"relative"}}>
          <img
            src={isOpen ? CHEST_OPEN : CHEST_CLOSED}
            alt={isOpen ? "Open feel better box" : "Closed feel better box"}
            style={{
              width:"100%", maxWidth:420, height:"auto",
              transition:"opacity .4s",
              filter:"drop-shadow(0 4px 16px rgba(245,166,35,0.35))",
            }}
          />
          {/* Item count badge */}
          {items.length > 0 && !isOpen && (
            <div style={{
              position:"absolute",top:-8,right:"10%",
              background:PALETTE.honey,color:"white",
              borderRadius:999,width:26,height:26,
              display:"flex",alignItems:"center",justifyContent:"center",
              fontSize:13,fontWeight:700,boxShadow:"0 2px 8px rgba(0,0,0,0.2)"
            }}>
              {items.length}
            </div>
          )}
          {justAdded && (
            <div style={{
              position:"absolute",inset:0,display:"flex",
              alignItems:"center",justifyContent:"center",
              fontSize:36
            }}>💛</div>
          )}
        </div>
        <p style={{fontSize:12,color:PALETTE.soft,marginTop:6}}>
          {isOpen ? "Tap to close" : "Tap to open"}
        </p>
      </div>

      {/* ── ADD BUTTON ── */}
      {isOpen && (
        <button onClick={()=>setAdding(a=>!a)}
          style={{...btnStyle(PALETTE.honey),width:"100%",marginBottom:16}}>
          {adding ? "Cancel" : "+ Add something good"}
        </button>
      )}

      {/* ── ADD FORM ── */}
      {isOpen && adding && (
        <div style={{...card,marginBottom:16,background:`${PALETTE.honey}0D`,border:`1.5px solid ${PALETTE.honey}44`}}>
          <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:12}}>
            {types.map(t=>(
              <button key={t.id} onClick={()=>setType(t.id)}
                style={{...btnStyle(type===t.id?t.color:"#EEE",true),
                  color:type===t.id?"white":PALETTE.mid,borderRadius:20}}>
                {t.emoji} {t.label}
              </button>
            ))}
          </div>
          <div style={{display:"flex",gap:8}}>
            <input value={text} onChange={e=>setText(e.target.value)}
              onKeyDown={e=>e.key==="Enter"&&add()}
              placeholder={`What ${type} lifts you?`}
              style={{...inputStyle,flex:1}}/>
            <button onClick={add} disabled={!text.trim()}
              style={{...btnStyle(PALETTE.honey),opacity:text.trim()?1:0.5}}>Add</button>
          </div>
        </div>
      )}

      {/* ── CONTENTS ── */}
      {isOpen && items.length===0 && (
        <div style={emptyState}>
          <p style={{margin:0,fontSize:13}}>
            Your box is empty. Good things come from your mood check-ins automatically — or add your own above. 🌸
          </p>
        </div>
      )}

      {isOpen && grouped.map(group=>(
        <div key={group.id} style={{marginBottom:20}}>
          <div style={{
            display:"flex",alignItems:"center",gap:8,marginBottom:10,
            padding:"6px 0",borderBottom:`2px solid ${group.color}33`
          }}>
            <span style={{fontSize:20}}>{group.emoji}</span>
            <span style={{fontWeight:700,color:PALETTE.dark,fontSize:14}}>{group.label}s</span>
            <span style={{fontSize:12,color:PALETTE.soft,marginLeft:"auto"}}>{group.items.length}</span>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {group.items.map(item=>(
              <div key={item.id}
                style={{
                  background:`${group.color}0D`,
                  borderRadius:12,padding:"12px 14px",
                  border:`1.5px solid ${group.color}33`,
                  display:"flex",alignItems:"flex-start",gap:10,
                }}>
                <div style={{flex:1}}>
                  <p style={{margin:0,color:PALETTE.dark,fontSize:14,lineHeight:1.6}}>{item.text}</p>
                  {item.source && (
                    <p style={{margin:"3px 0 0",fontSize:11,color:group.color,fontStyle:"italic"}}>{item.source}</p>
                  )}
                  <p style={{margin:"3px 0 0",fontSize:11,color:PALETTE.soft}}>{fmtDate(item.date)}</p>
                </div>
                <button onClick={()=>onDelete(item.id)}
                  style={{background:"none",border:"none",cursor:"pointer",
                    color:PALETTE.soft,fontSize:16,padding:"0 4px"}}>×</button>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Problem Box ──────────────────────────────────────────────────────────────
function ProblemBox({ items, onAdd, onUpdate, onRelease, onSetTab }) {
  const [chestOpen, setChestOpen]   = useState(false);
  const [newText, setNewText]       = useState("");
  const [justDropped, setJustDropped] = useState(false);
  const [viewItem, setViewItem]     = useState(null);
  const [releasing, setReleasing]   = useState(null);
  const [beaSuggestion, setBeaSuggestion] = useState(null);
  const [loadingSuggest, setLoadingSuggest] = useState(false);

  const stored  = items.filter(i=>i.status==="stored");
  const pending = items.filter(i=>i.status==="pending");
  const total   = stored.length + pending.length;

  // ── Add new problem directly ─────────────────────────────────────────────
  const handleAdd = () => {
    if(!newText.trim()) return;
    onAdd({ id:uid(), text:newText.trim(), date:today(), status:"pending" });
    setNewText("");
  };

  // ── Drop into box ────────────────────────────────────────────────────────
  const dropInBox = (item) => {
    onUpdate(item.id, {status:"stored"});
    setJustDropped(true);
    setTimeout(()=>{ setChestOpen(false); setJustDropped(false); }, 1000);
  };

  // ── Bea detects best tool ────────────────────────────────────────────────
  const getBeaSuggestion = async (text) => {
    setLoadingSuggest(true);
    setBeaSuggestion(null);
    try {
      const reply = await askBee([{role:"user", content:
        `You are Bea, a CBT/ACT bee therapist. Someone has this problem or worry: "${text}"
Based on this, recommend the SINGLE best therapy tool from these options:
- Courtroom (CBT thought trial — best for negative self-beliefs, "I am..." thoughts, black-and-white thinking)
- Distortions (best for recognising cognitive distortions like catastrophising, mind-reading, overgeneralising)
- ACT Matrix (best for avoidance patterns, values conflicts, "stuck" feelings)
- Defusion (best for repetitive intrusive thoughts that won't go away)
- Bea Chat (best for processing emotions, feeling heard, general support)
- Release to Sea (best for worries outside their control, past events, things they cannot change)

Reply in this exact format:
TOOL: [tool name]
REASON: [one warm sentence explaining why this tool fits this problem]`
      }]);

      const toolMatch   = reply.match(/TOOL:\s*(.+)/);
      const reasonMatch = reply.match(/REASON:\s*(.+)/);
      setBeaSuggestion({
        tool:   toolMatch?.[1]?.trim()   || "Bea Chat",
        reason: reasonMatch?.[1]?.trim() || "I think talking it through would help.",
      });
    } catch(e) {
      setBeaSuggestion({ tool:"Bea Chat", reason:"Let's talk this through together." });
    } finally { setLoadingSuggest(false); }
  };

  const toolAction = (toolName) => {
    const map = {
      "Courtroom":      ()=>onSetTab("court"),
      "Distortions":    ()=>onSetTab("distort"),
      "ACT Matrix":     ()=>onSetTab("act"),
      "Defusion":       ()=>onSetTab("act"),
      "Bea Chat":       ()=>onSetTab("bea"),
      "Release to Sea": ()=>setReleasing(viewItem?.id || "direct"),
    };
    (map[toolName] || (()=>onSetTab("bea")))();
    setViewItem(null);
    setBeaSuggestion(null);
  };

  // ── Working through a stored item ────────────────────────────────────────
  if(viewItem) return (
    <div style={{padding:"0 0 80px"}}>
      {releasing && (
        <ReleaseAnimation
          text={viewItem.text}
          onDone={()=>{ onRelease(viewItem.id); setReleasing(null); setViewItem(null); }}
        />
      )}
      <button onClick={()=>{ setViewItem(null); setBeaSuggestion(null); setLoadingSuggest(false); }}
        style={{...btnStyle("#EEE",true),color:PALETTE.mid,marginBottom:16}}>
        ← Back to Box
      </button>

      {/* The problem */}
      <div style={{...card,borderLeft:`3px solid ${PALETTE.lavender}`,marginBottom:20}}>
        <div style={{fontSize:11,fontWeight:700,color:PALETTE.soft,letterSpacing:1,marginBottom:8}}>
          YOUR PROBLEM · {fmtDate(viewItem.date)}
        </div>
        <p style={{margin:0,color:PALETTE.dark,fontSize:15,lineHeight:1.7}}>{viewItem.text}</p>
      </div>

      {/* Bea's tool suggestion */}
      {!beaSuggestion && !loadingSuggest && (
        <button onClick={()=>getBeaSuggestion(viewItem.text)}
          style={{
            width:"100%",marginBottom:16,padding:"12px 16px",
            background:`linear-gradient(135deg,${PALETTE.honey},${PALETTE.amber})`,
            border:"none",borderRadius:12,cursor:"pointer",
            display:"flex",alignItems:"center",gap:10,
          }}>
          <BeeMascot size={32}/>
          <div style={{textAlign:"left"}}>
            <div style={{color:"white",fontWeight:700,fontSize:14}}>Ask Bea which tool to use</div>
            <div style={{color:"rgba(255,255,255,0.85)",fontSize:12}}>I'll read this and suggest the best approach</div>
          </div>
        </button>
      )}

      {loadingSuggest && (
        <div style={{...card,marginBottom:16,textAlign:"center",padding:16}}>
          <BeeMascot size={36} animated/>
          <p style={{color:PALETTE.mid,fontSize:13,margin:"8px 0 0"}}>Bea is reading your problem…</p>
        </div>
      )}

      {beaSuggestion && (
        <div style={{
          ...card,marginBottom:16,
          background:`linear-gradient(135deg,${PALETTE.honey}15,${PALETTE.amber}08)`,
          border:`1.5px solid ${PALETTE.honey}44`,
        }}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
            <BeeMascot size={28}/>
            <span style={{fontWeight:700,color:PALETTE.amber,fontSize:14}}>Bea suggests:</span>
          </div>
          <div style={{
            background:PALETTE.honey,borderRadius:8,
            padding:"8px 12px",marginBottom:8,
            display:"inline-block",
          }}>
            <span style={{color:"white",fontWeight:700,fontSize:15}}>
              {beaSuggestion.tool}
            </span>
          </div>
          <p style={{margin:0,color:PALETTE.mid,fontSize:13,lineHeight:1.6}}>
            {beaSuggestion.reason}
          </p>
          <button onClick={()=>toolAction(beaSuggestion.tool)}
            style={{...btnStyle(PALETTE.honey),width:"100%",marginTop:12}}>
            Use {beaSuggestion.tool} →
          </button>
        </div>
      )}

      {/* All options */}
      <div style={{fontSize:11,fontWeight:700,color:PALETTE.soft,letterSpacing:1,marginBottom:10}}>
        OR CHOOSE YOUR OWN
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {[
          {label:"⚖️ Thought Courtroom",  sub:"Put this thought on trial",              tab:"court",   grad:"linear-gradient(135deg,#8B6A2A,#D4AF37)"},
          {label:"🔍 Spot the Distortion",sub:"Find the thinking pattern",              tab:"distort", grad:"linear-gradient(135deg,#7B4A8B,#9B6BC4)"},
          {label:"🌀 ACT Matrix",         sub:"Map your toward and away moves",         tab:"act",     grad:"linear-gradient(135deg,#2A7A5C,#5BAA8C)"},
          {label:"🐝 Talk to Bea",        sub:"Process this with your bee therapist",   tab:"bea",     grad:"linear-gradient(135deg,#F5A623,#E8891A)"},
          {label:"📦 Put back in box",    sub:"Not ready yet — save for another day",   tab:null,      grad:"linear-gradient(135deg,#6B5744,#8B7355)"},
          {label:"🌊 Release to the Sea", sub:"Let it go — send it to the waves",       tab:"sea",     grad:"linear-gradient(135deg,#1A6B9B,#5B9BD5)"},
        ].map(opt=>(
          <button key={opt.label}
            onClick={()=>{
              if(opt.tab==="sea")  { setReleasing(viewItem.id); }
              else if(opt.tab===null) { setViewItem(null); setBeaSuggestion(null); }
              else { onSetTab(opt.tab); setViewItem(null); setBeaSuggestion(null); }
            }}
            style={{
              background:opt.grad,border:"none",borderRadius:12,
              cursor:"pointer",padding:"12px 16px",textAlign:"left",
            }}>
            <div style={{color:"white",fontWeight:700,fontSize:14,marginBottom:2}}>{opt.label}</div>
            <div style={{color:"rgba(255,255,255,0.8)",fontSize:12}}>{opt.sub}</div>
          </button>
        ))}
      </div>
    </div>
  );

  // ── Main box view ─────────────────────────────────────────────────────────
  return (
    <div style={{padding:"0 0 80px"}}>
      {releasing && (
        <ReleaseAnimation
          text={items.find(i=>i.id===releasing)?.text||""}
          onDone={()=>{ onRelease(releasing); setReleasing(null); }}
        />
      )}

      <h3 style={sectionTitle}>📦 Problem Box</h3>
      <p style={{color:PALETTE.soft,fontSize:13,marginBottom:16,lineHeight:1.6}}>
        Name what's weighing on you. Drop it in the box, work through it with therapy tools, or release it to the sea.
      </p>

      {/* Add new problem */}
      <div style={{display:"flex",gap:8,marginBottom:20}}>
        <input value={newText} onChange={e=>setNewText(e.target.value)}
          onKeyDown={e=>e.key==="Enter"&&handleAdd()}
          placeholder="What's on your mind?"
          style={{...inputStyle,flex:1}}/>
        <button onClick={handleAdd} disabled={!newText.trim()}
          style={{...btnStyle(PALETTE.lavender),opacity:newText.trim()?1:0.5}}>
          Add
        </button>
      </div>

      {/* The chest */}
      <div style={{textAlign:"center",marginBottom:20}}>
        <div onClick={()=>setChestOpen(o=>!o)}
          style={{cursor:"pointer",display:"inline-block",position:"relative"}}>
          <img
            src={chestOpen ? CHEST_OPEN : CHEST_CLOSED}
            alt={chestOpen?"Open box":"Closed box"}
            style={{width:"100%",maxWidth:420,height:"auto",transition:"opacity .3s"}}
          />
          {total > 0 && !chestOpen && (
            <div style={{
              position:"absolute",top:-8,right:"8%",
              background:PALETTE.lavender,color:"white",
              borderRadius:999,minWidth:26,height:26,padding:"0 6px",
              display:"flex",alignItems:"center",justifyContent:"center",
              fontSize:13,fontWeight:700,boxShadow:"0 2px 8px rgba(0,0,0,0.2)"
            }}>{total}</div>
          )}
          {justDropped && (
            <div style={{
              position:"absolute",inset:0,
              display:"flex",alignItems:"center",justifyContent:"center",
              fontSize:40,
            }}>✓</div>
          )}
        </div>
        <p style={{fontSize:12,color:PALETTE.soft,marginTop:6}}>
          {chestOpen ? "Tap chest to close" : "Tap chest to open"}
        </p>
      </div>

      {/* Pending — tap to drop */}
      {chestOpen && pending.length > 0 && (
        <div style={{marginBottom:16}}>
          <div style={{fontSize:11,fontWeight:700,color:PALETTE.mid,letterSpacing:1,marginBottom:8}}>
            NEW — TAP TO DROP IN BOX
          </div>
          {pending.map(item=>(
            <div key={item.id} style={{marginBottom:10}}>
              <div style={{
                ...card,cursor:"pointer",
                border:`2px dashed ${PALETTE.lavender}`,
                background:`${PALETTE.lavender}0A`,
              }}>
                <p style={{margin:"0 0 10px",color:PALETTE.dark,fontSize:14,lineHeight:1.5}}>{item.text}</p>
                <p style={{margin:"0 0 12px",fontSize:11,color:PALETTE.soft}}>{fmtDate(item.date)}</p>
                <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                  <button onClick={()=>dropInBox(item)}
                    style={{...btnStyle(PALETTE.lavender,true),flex:1}}>
                    📦 Put in box for later
                  </button>
                  <button onClick={()=>{ setViewItem(item); }}
                    style={{...btnStyle(PALETTE.honey,true),flex:1}}>
                    🐝 Work through it now
                  </button>
                  <button onClick={()=>{ setReleasing(item.id); }}
                    style={{...btnStyle(PALETTE.sky,true),flex:1}}>
                    🌊 Release to sea
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Stored in box */}
      {chestOpen && stored.length > 0 && (
        <div>
          <div style={{fontSize:11,fontWeight:700,color:PALETTE.mid,letterSpacing:1,marginBottom:8}}>
            IN YOUR BOX — TAP TO WORK THROUGH
          </div>
          {stored.map(item=>(
            <div key={item.id} onClick={()=>{ setViewItem(item); setBeaSuggestion(null); }}
              style={{
                ...card,cursor:"pointer",marginBottom:8,
                borderLeft:`3px solid ${PALETTE.lavender}`,
                display:"flex",alignItems:"center",gap:10,
              }}>
              <span style={{fontSize:20}}>📦</span>
              <div style={{flex:1}}>
                <p style={{margin:0,color:PALETTE.dark,fontSize:14,lineHeight:1.5}}>{item.text}</p>
                <p style={{margin:"3px 0 0",fontSize:11,color:PALETTE.soft}}>{fmtDate(item.date)}</p>
              </div>
              <span style={{fontSize:16,color:PALETTE.soft}}>›</span>
            </div>
          ))}
        </div>
      )}

      {chestOpen && total===0 && (
        <div style={emptyState}>
          <p style={{margin:0,fontSize:13}}>
            Type a problem above, or log a difficult mood and it will appear here. 🐝
          </p>
        </div>
      )}
    </div>
  );
}


  const [dragging, setDragging]     = useState(null);  // item being dragged
  const [dragOver, setDragOver]     = useState(false);  // hovering over chest
  const [chestOpen, setChestOpen]   = useState(true);   // open by default so you can drop
  const [justDropped, setJustDropped] = useState(false);
  const [viewItem, setViewItem]     = useState(null);   // item being worked through
  const [releasing, setReleasing]   = useState(null);

  const stored = items.filter(i=>i.status==="stored");


function RobedFigure({ role, size=52 }) {
  const cols = { CLERK:"#8B7355", PROSECUTOR:"#8B1A1A", DEFENCE:"#1A4A8B", JUDGE:"#2C1810" };
  const col = cols[role] || "#555";
  return (
    <svg width={size} height={size} viewBox="0 0 60 60">
      {/* Robe */}
      <ellipse cx="30" cy="48" rx="18" ry="14" fill={col}/>
      <rect x="12" y="32" width="36" height="22" rx="4" fill={col}/>
      {/* White collar */}
      <rect x="24" y="30" width="12" height="10" rx="2" fill="white" opacity="0.9"/>
      {/* Head */}
      <circle cx="30" cy="24" r="12" fill="#F5D5A0"/>
      {/* Wig for Judge */}
      {role==="JUDGE" && <>
        <ellipse cx="30" cy="15" rx="13" ry="7" fill="#F0EEE0"/>
        <rect x="17" y="15" width="4" height="12" rx="2" fill="#F0EEE0"/>
        <rect x="39" y="15" width="4" height="12" rx="2" fill="#F0EEE0"/>
      </>}
      {/* Face */}
      <circle cx="26" cy="23" r="1.5" fill="#555"/>
      <circle cx="34" cy="23" r="1.5" fill="#555"/>
      {role==="PROSECUTOR"
        ? <path d="M26 29 Q30 27 34 29" stroke="#555" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
        : <path d="M26 28 Q30 31 34 28" stroke="#555" strokeWidth="1.5" fill="none" strokeLinecap="round"/>}
      {/* Gavel for Judge */}
      {role==="JUDGE" && <text x="38" y="44" fontSize="14">🔨</text>}
      {role==="PROSECUTOR" && <text x="38" y="44" fontSize="12">📋</text>}
      {role==="DEFENCE" && <text x="38" y="44" fontSize="12">📁</text>}
      {role==="CLERK" && <text x="38" y="44" fontSize="12">📜</text>}
    </svg>
  );
}

// Courtroom wood-panel CSS background
const COURTROOM_DEFAULT_BG = "/courtroom.jpg";

const courtroomBg = (imgUrl) => ({
  backgroundImage:`url(${imgUrl || COURTROOM_DEFAULT_BG})`,
  backgroundSize:"cover",
  backgroundPosition:"center top",
});

function Courtroom({ cases, onSave }) {
  const [view, setView]           = useState("list");   // list | trial | detail | upload
  const [gavel, setGavel]   = useState(false);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(null);
  const [form, setForm]       = useState({ thought:"" });

  const bang = () => { setGavel(true); setTimeout(()=>setGavel(false),400); };

  // ── Trial phases ──────────────────────────────────────────────────────────
  // phase: "clerk" → "prosecution_opening" → "prosecution_q1..3" →
  //        "defence_opening" → "defence_q1..3" → "summing_up" → "verdict"

  const [phase, setPhase]           = useState("clerk");
  const [currentQ, setCurrentQ]     = useState("");      // current AI question text
  const [answers, setAnswers]       = useState({});      // { q_key: answer_text }
  const [inputVal, setInputVal]     = useState("");
  const [hint, setHint]             = useState("");      // lawyer "prompt if needed" hint
  const [verdictText, setVerdictText] = useState("");
  const [balancedThought, setBalancedThought] = useState("");

  const startTrial = () => {
    setForm({ thought:"" });
    setPhase("clerk");
    setAnswers({});
    setInputVal("");
    setCurrentQ("");
    setHint("");
    setVerdictText("");
    setBalancedThought("");
    setView("trial");
    bang();
  };

  // Which robed figure is speaking
  const speakerFor = (p) => {
    if(p==="clerk")              return { role:"CLERK",      name:"Court Clerk",          emoji:"📜", color:"#6B5744" };
    if(p.startsWith("pros"))     return { role:"PROSECUTOR", name:"The Prosecutor",       emoji:"⚔️",  color:"#8B1A1A" };
    if(p.startsWith("def"))      return { role:"DEFENCE",    name:"Your Defence Counsel", emoji:"🛡️",  color:"#1A4A8B" };
    if(p==="summing_up")         return { role:"PROSECUTOR", name:"Closing Statements",   emoji:"📋", color:"#5A0A0A" };
    return                              { role:"JUDGE",      name:"The Honourable Judge", emoji:"⚖️",  color:"#2C1810" };
  };
  const speaker = speakerFor(phase);

  // Progress bar segments
  const PHASES_ORDER = [
    "clerk","prosecution_opening","prosecution_q1","prosecution_q2","prosecution_q3",
    "defence_opening","defence_q1","defence_q2","defence_q3","summing_up","verdict"
  ];
  const phaseIdx = PHASES_ORDER.indexOf(phase);
  const progress = Math.round((phaseIdx / (PHASES_ORDER.length-1)) * 100);

  // ── AI calls ────────────────────────────────────────────────────────────────
  const ai = async (prompt) => {
    const r = await askBee([{role:"user", content:prompt}]);
    return r;
  };

  const getHint = async (questionText) => {
    setHint("…");
    const h = await ai(`You are Bea, a gentle CBT-trained bee therapist assistant.
A person working alone is stuck on this CBT courtroom question: "${questionText}"
Give ONE short, practical thinking prompt (max 20 words) — something factual they can reflect on from their own experience, with no need for other people.
No preamble. Just the prompt, starting with "Try thinking about..."`);
    setHint(h);
  };

  // Move to next phase, triggering AI where needed
  const advance = async (answerKey, answerValue) => {
    bang();
    const newAnswers = { ...answers, [answerKey]: answerValue };
    setAnswers(newAnswers);
    setInputVal("");
    setHint("");

    if(phase === "clerk") {
      setLoading(true);
      setPhase("prosecution_opening");
      const opening = await ai(
        `You are a precise, fair courtroom prosecutor in a CBT thought trial.
The thought on trial: "${answerValue}"
Deliver a 2-sentence opening statement setting out the case you will examine — that this thought may be inaccurate, exaggerated, or based on incomplete evidence.
Be factual and measured, not dramatic. Start with: "Members of this court, the evidence will show that..."`
      );
      setCurrentQ(opening);
      setLoading(false);

    } else if(phase === "prosecution_opening") {
      setLoading(true);
      setPhase("prosecution_q1");
      // Q1: factual evidence FOR — what specific facts support it?
      const q = await ai(
        `You are a prosecutor in a CBT thought trial. The thought on trial: "${newAnswers.thought}"
Ask ONE factual question about what specific, observable evidence the person has that this thought is true — real events, facts, or behaviours they have directly witnessed or experienced themselves.
No mention of other people's opinions. One sentence. Start with "Prosecutor: "`
      );
      setCurrentQ(q);
      setLoading(false);

    } else if(phase === "prosecution_q1") {
      setLoading(true);
      setPhase("prosecution_q2");
      // Q2: frequency check — how often is it ACTUALLY true?
      const q = await ai(
        `You are a prosecutor in a CBT thought trial. The thought on trial: "${newAnswers.thought}"
The defendant said: "${answerValue}"
Ask ONE question challenging whether this thought is true 100% of the time, or whether there are occasions — even small ones — when it has not been true. Focus on frequency and consistency of the evidence.
One sentence. Start with "Prosecutor: "`
      );
      setCurrentQ(q);
      setLoading(false);

    } else if(phase === "prosecution_q2") {
      setLoading(true);
      setPhase("prosecution_q3");
      // Q3: cognitive distortion probe — is this thought fact or interpretation?
      const q = await ai(
        `You are a prosecutor in a CBT thought trial. The thought on trial: "${newAnswers.thought}"
Ask ONE question probing whether this thought is a verifiable fact, or whether it is an interpretation, prediction, or conclusion the person has drawn — and what the difference might be.
One sentence. Start with "Prosecutor: "`
      );
      setCurrentQ(q);
      setLoading(false);

    } else if(phase === "prosecution_q3") {
      setLoading(true);
      setPhase("defence_opening");
      const opening = await ai(
        `You are a calm, methodical defence counsel in a CBT thought trial.
The thought on trial: "${newAnswers.thought}"
Evidence submitted by prosecution: "${newAnswers.pros_q1}" / "${newAnswers.pros_q2}" / "${newAnswers.pros_q3}"
Deliver a 2-sentence opening statement — you will examine the factual counter-evidence and challenge whether the thought holds up under scrutiny.
Start with: "The defence will demonstrate, using facts and observable evidence, that..."`
      );
      setCurrentQ(opening);
      setLoading(false);

    } else if(phase === "defence_opening") {
      setLoading(true);
      setPhase("defence_q1");
      // D-Q1: factual exceptions — has there been even ONE time it wasn't true?
      const q = await ai(
        `You are a defence counsel in a CBT thought trial. The thought on trial: "${newAnswers.thought}"
Ask ONE factual question: has there been even a single occasion — however small — when this thought was not true? Ask them to recall a specific time, situation, or example from their own direct experience.
No reference to other people's views. One sentence. Start with "Defence: "`
      );
      setCurrentQ(q);
      setLoading(false);

    } else if(phase === "defence_q1") {
      setLoading(true);
      setPhase("defence_q2");
      // D-Q2: percentage reality check
      const q = await ai(
        `You are a defence counsel in a CBT thought trial. The thought on trial: "${newAnswers.thought}"
The defendant said: "${answerValue}"
Ask ONE question: if they had to put a realistic percentage on how often this thought is completely, factually true — what would it be, and what does that percentage tell them about the thought?
One sentence. Start with "Defence: "`
      );
      setCurrentQ(q);
      setLoading(false);

    } else if(phase === "defence_q2") {
      setLoading(true);
      setPhase("defence_q3");
      // D-Q3: alternative factual explanation
      const q = await ai(
        `You are a defence counsel in a CBT thought trial. The thought on trial: "${newAnswers.thought}"
Ask ONE question: is there another factual, evidence-based explanation for the situation this thought is about — one that does not involve this thought being completely true?
Focus on observable alternative explanations, not feelings or opinions. One sentence. Start with "Defence: "`
      );
      setCurrentQ(q);
      setLoading(false);

    } else if(phase === "defence_q3") {
      setLoading(true);
      setPhase("summing_up");
      const summary = await ai(
        `You are a judge summarising all evidence in a CBT thought trial before delivering a verdict.
The thought on trial: "${newAnswers.thought}"

PROSECUTION evidence (facts supporting the thought):
1. ${newAnswers.pros_q1 || "—"}
2. ${newAnswers.pros_q2 || "—"}
3. ${newAnswers.pros_q3 || "—"}

DEFENCE evidence (facts challenging the thought):
1. ${newAnswers.def_q1 || "—"}
2. ${newAnswers.def_q2 || "—"}
3. ${newAnswers.def_q3 || "—"}

Summarise neutrally in exactly 3 bullet points. No verdict yet.
Format precisely as:
• FOR: [one factual line summarising the evidence that supports the thought]
• AGAINST: [one factual line summarising the evidence that challenges it]
• KEY QUESTION: [one precise, observable question the defendant should sit with]`
      );
      setCurrentQ(summary);
      setLoading(false);

    } else if(phase === "summing_up") {
      setLoading(true);
      setPhase("verdict");
      const verdictReply = await ai(
        `You are a wise, experienced judge delivering the final verdict in a CBT thought trial. You are trained in cognitive behavioural therapy.

The thought on trial: "${newAnswers.thought}"

All evidence:
Prosecution (evidence FOR the thought): "${newAnswers.pros_q1}" / "${newAnswers.pros_q2}" / "${newAnswers.pros_q3}"
Defence (evidence AGAINST the thought): "${newAnswers.def_q1}" / "${newAnswers.def_q2}" / "${newAnswers.def_q3}"

Deliver a structured verdict with exactly FOUR labelled sections, each on its own line:

FINDING: [One sentence — what is factually true or partially true in this thought, based only on the evidence given]

DISTORTION: [Identify the specific CBT cognitive distortion present. Choose from: All-or-Nothing Thinking, Overgeneralisation, Mental Filter, Disqualifying the Positive, Mind Reading, Fortune Telling, Catastrophising, Emotional Reasoning, Should Statements, Labelling, Personalisation, or Magnification. Name it and explain it in one sentence.]

RULING: [One sentence — a balanced, factual, realistic alternative thought that replaces the distorted one. This should be something the person can genuinely believe based on the evidence, not a positive affirmation.]

ACTION: [One concrete, small, observable thing the person can do in the next 24 hours to act in line with the ruling rather than the distorted thought. Practical, specific, achievable alone.]

Start with: "ORDER IN COURT. 🔨"`
      );
      const rulingMatch = verdictReply.match(/RULING:\s*(.+)/);
      setVerdictText(verdictReply);
      setBalancedThought(rulingMatch ? rulingMatch[1].trim() : "");
      setLoading(false);

    } else if(phase === "verdict") {
      // Save and go to list
      onSave({
        id:uid(), date:today(),
        thought: newAnswers.thought,
        prosecutionEvidence: [newAnswers.pros_q1, newAnswers.pros_q2, newAnswers.pros_q3].filter(Boolean),
        defenceEvidence: [newAnswers.def_q1, newAnswers.def_q2, newAnswers.def_q3].filter(Boolean),
        verdict: verdictText,
        balancedThought,
      });
      setView("list");
    }
  };

  // Which answer key does the current phase write to?
  const answerKeyFor = (p) => ({
    clerk:"thought", prosecution_q1:"pros_q1", prosecution_q2:"pros_q2",
    prosecution_q3:"pros_q3", defence_q1:"def_q1", defence_q2:"def_q2",
    defence_q3:"def_q3",
  }[p] || null);

  const currentKey   = answerKeyFor(phase);
  const needsInput   = !!currentKey;
  const inputReady   = !needsInput || (inputVal.trim().length > 0);
  const isReadOnly   = ["prosecution_opening","defence_opening","summing_up"].includes(phase);
  const isVerdict    = phase === "verdict";


  // ── Gavel button label ──────────────────────────────────────────────────────
  const gavelLabel = loading ? "⏳ Court is deliberating…"
    : phase==="clerk"              ? "🔨 Open Court — Call the Prosecutor"
    : phase==="prosecution_opening"? "🔨 Begin Cross-Examination"
    : phase==="prosecution_q1"     ? "🔨 Answer Given — Continue"
    : phase==="prosecution_q2"     ? "🔨 Answer Given — Continue"
    : phase==="prosecution_q3"     ? "🔨 Prosecution Rests — Call the Defence"
    : phase==="defence_opening"    ? "🔨 Begin Defence Examination"
    : phase==="defence_q1"         ? "🔨 Answer Given — Continue"
    : phase==="defence_q2"         ? "🔨 Answer Given — Continue"
    : phase==="defence_q3"         ? "🔨 Defence Rests — Summing Up"
    : phase==="summing_up"         ? "🔨 I'm Ready — Deliver the Verdict"
    : phase==="verdict"            ? "🔨 Save Case & Adjourn Court"
    : "🔨 Continue";

  // ── Trial screen ────────────────────────────────────────────────────────────
  if(view==="trial") {
    return (
      <div style={{margin:"-20px -20px 0",minHeight:"100vh"}}>
        <div style={{
          ...courtroomBg(null),
          padding:"16px 16px 0",
          minHeight:"100vh",
          display:"flex",
          flexDirection:"column",
          position:"relative",
        }}>
          {/* Dark overlay */}
          <div style={{position:"absolute",inset:0,
            background:"linear-gradient(180deg,rgba(0,0,0,0.6) 0%,rgba(0,0,0,0.35) 35%,rgba(0,0,0,0.78) 100%)",
            pointerEvents:"none"}}/>

          {/* Top bar */}
          <div style={{position:"relative",zIndex:2,display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
            <button onClick={()=>setView("list")}
              style={{background:"rgba(255,255,255,0.15)",border:"1px solid rgba(255,255,255,0.3)",
                borderRadius:999,padding:"5px 12px",color:"white",fontSize:12,cursor:"pointer"}}>
              ✕ Exit
            </button>
            <div style={{
              background:"rgba(0,0,0,0.5)",border:"1px solid rgba(212,175,55,0.5)",
              borderRadius:8,padding:"4px 14px",textAlign:"center",
            }}>
              <div style={{color:"#D4AF37",fontSize:10,letterSpacing:3,fontWeight:700}}>⚖️ THE MIND COURT</div>
            </div>
          </div>

          {/* Progress bar */}
          <div style={{position:"relative",zIndex:2,marginBottom:10}}>
            <div style={{height:3,background:"rgba(255,255,255,0.2)",borderRadius:2}}>
              <div style={{height:"100%",width:`${progress}%`,background:"#D4AF37",borderRadius:2,transition:"width .5s ease"}}/>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",marginTop:3,fontSize:9,color:"rgba(255,255,255,0.5)"}}>
              <span>OPENING</span><span>PROSECUTION</span><span>DEFENCE</span><span>VERDICT</span>
            </div>
          </div>

          {/* Speaker */}
          <div style={{position:"relative",zIndex:2,textAlign:"center",marginBottom:8}}>
            <div style={{
              display:"inline-block",background:"rgba(0,0,0,0.45)",borderRadius:50,padding:8,
              border:`2px solid ${speaker.color}99`,
              animation:gavel?"shake .3s ease":"none",
            }}>
              <RobedFigure role={speaker.role} size={56}/>
            </div>
            <div style={{color:"#D4AF37",fontSize:11,fontWeight:700,marginTop:3,letterSpacing:1}}>
              {speaker.emoji} {speaker.name.toUpperCase()}
            </div>
          </div>

          {/* Content card */}
          <div style={{
            position:"relative",zIndex:2,
            background:"rgba(253,243,227,0.97)",
            borderRadius:16,padding:16,marginBottom:12,
            boxShadow:"0 8px 32px rgba(0,0,0,0.55)",
            border:`2px solid ${speaker.color}33`,
            flex:1,overflowY:"auto",
          }}>
            <style>{`
              @keyframes shake{0%,100%{transform:rotate(0)}25%{transform:rotate(-3deg)}75%{transform:rotate(3deg)}}
              @keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
            `}</style>

            {/* CLERK — state the thought */}
            {phase==="clerk" && <div style={{animation:"fadeIn .4s"}}>
              <div style={{fontSize:10,fontWeight:700,color:PALETTE.soft,letterSpacing:1,marginBottom:8}}>ALL RISE — COURT IS NOW IN SESSION</div>
              <p style={{color:PALETTE.mid,fontSize:14,lineHeight:1.7,fontStyle:"italic",
                borderLeft:"3px solid #6B5744",paddingLeft:10,marginBottom:14}}>
                "This court is convened to examine a thought that has been causing distress. The first order of business — state the thought clearly, so it may be heard, examined, and judged fairly."
              </p>
              <label style={labelStyle}>The thought on trial</label>
              <textarea value={inputVal} onChange={e=>setInputVal(e.target.value)}
                placeholder={`e.g. "I am a failure." or "Nobody really cares about me." or "I always ruin everything."`}
                style={{...textareaStyle,background:"#FFFDF8",minHeight:80}}/>
            </div>}

            {/* PROSECUTION OPENING */}
            {phase==="prosecution_opening" && <div style={{animation:"fadeIn .4s"}}>
              <div style={{fontSize:10,fontWeight:700,color:"#8B1A1A",letterSpacing:1,marginBottom:8}}>PROSECUTION — OPENING STATEMENT</div>
              {loading
                ? <p style={{color:PALETTE.mid,fontStyle:"italic",fontSize:13}}>⚔️ The prosecutor is rising to speak…</p>
                : <p style={{color:PALETTE.dark,fontSize:14,lineHeight:1.8,fontStyle:"italic",
                    borderLeft:"3px solid #8B1A1A",paddingLeft:12}}>
                    {currentQ}
                  </p>}
              {!loading && <p style={{fontSize:12,color:PALETTE.soft,marginTop:12}}>
                The prosecution will now cross-examine you. Answer honestly — this is a safe space.
              </p>}
            </div>}

            {/* PROSECUTION Qs */}
            {["prosecution_q1","prosecution_q2","prosecution_q3"].includes(phase) && <div style={{animation:"fadeIn .4s"}}>
              <div style={{fontSize:10,fontWeight:700,color:"#8B1A1A",letterSpacing:1,marginBottom:8}}>
                CROSS-EXAMINATION — EVIDENCE FOR THE THOUGHT
              </div>
              {loading
                ? <p style={{color:PALETTE.mid,fontStyle:"italic",fontSize:13}}>⚔️ Prosecutor is forming the question…</p>
                : <>
                  <p style={{color:PALETTE.dark,fontSize:14,lineHeight:1.8,fontStyle:"italic",
                    borderLeft:"3px solid #8B1A1A",paddingLeft:12,marginBottom:14}}>
                    {currentQ}
                  </p>
                  <label style={labelStyle}>Your answer</label>
                  <textarea value={inputVal} onChange={e=>setInputVal(e.target.value)}
                    placeholder={`Answer the prosecutors question`}
                    style={{...textareaStyle,background:"#FFF8F8",minHeight:70}}/>
                  {/* Lawyer hint */}
                  <div style={{marginTop:8,display:"flex",alignItems:"flex-start",gap:8}}>
                    <button onClick={()=>getHint(currentQ)}
                      style={{...btnStyle("#8B1A1A",true),fontSize:11,whiteSpace:"nowrap",flexShrink:0}}>
                      💡 Prompt me
                    </button>
                    {hint && <p style={{fontSize:12,color:PALETTE.mid,fontStyle:"italic",margin:0,lineHeight:1.5}}>
                      {hint==="…"?"Thinking…":hint}
                    </p>}
                  </div>
                </>}
            </div>}

            {/* DEFENCE OPENING */}
            {phase==="defence_opening" && <div style={{animation:"fadeIn .4s"}}>
              <div style={{fontSize:10,fontWeight:700,color:"#1A4A8B",letterSpacing:1,marginBottom:8}}>DEFENCE — OPENING STATEMENT</div>
              {loading
                ? <p style={{color:PALETTE.mid,fontStyle:"italic",fontSize:13}}>🛡️ Your defence counsel is rising…</p>
                : <p style={{color:PALETTE.dark,fontSize:14,lineHeight:1.8,fontStyle:"italic",
                    borderLeft:"3px solid #1A4A8B",paddingLeft:12}}>
                    {currentQ}
                  </p>}
              {!loading && <p style={{fontSize:12,color:PALETTE.soft,marginTop:12}}>
                Your defence counsel will now ask you questions to bring out the other side of this thought.
              </p>}
            </div>}

            {/* DEFENCE Qs */}
            {["defence_q1","defence_q2","defence_q3"].includes(phase) && <div style={{animation:"fadeIn .4s"}}>
              <div style={{fontSize:10,fontWeight:700,color:"#1A4A8B",letterSpacing:1,marginBottom:8}}>
                EXAMINATION — EVIDENCE AGAINST THE THOUGHT
              </div>
              {loading
                ? <p style={{color:PALETTE.mid,fontStyle:"italic",fontSize:13}}>🛡️ Defence counsel is preparing the question…</p>
                : <>
                  <p style={{color:PALETTE.dark,fontSize:14,lineHeight:1.8,fontStyle:"italic",
                    borderLeft:"3px solid #1A4A8B",paddingLeft:12,marginBottom:14}}>
                    {currentQ}
                  </p>
                  <label style={labelStyle}>Your answer</label>
                  <textarea value={inputVal} onChange={e=>setInputVal(e.target.value)}
                    placeholder="Speak freely — your defence counsel is on your side…"
                    style={{...textareaStyle,background:"#F5F8FF",minHeight:70}}/>
                  <div style={{marginTop:8,display:"flex",alignItems:"flex-start",gap:8}}>
                    <button onClick={()=>getHint(currentQ)}
                      style={{...btnStyle("#1A4A8B",true),fontSize:11,whiteSpace:"nowrap",flexShrink:0}}>
                      💡 Prompt me
                    </button>
                    {hint && <p style={{fontSize:12,color:PALETTE.mid,fontStyle:"italic",margin:0,lineHeight:1.5}}>
                      {hint==="…"?"Thinking…":hint}
                    </p>}
                  </div>
                </>}
            </div>}

            {/* SUMMING UP */}
            {phase==="summing_up" && <div style={{animation:"fadeIn .4s"}}>
              <div style={{fontSize:10,fontWeight:700,color:"#2C1810",letterSpacing:1,marginBottom:8}}>
                THE JUDGE — SUMMING UP THE EVIDENCE
              </div>
              {loading
                ? <p style={{color:PALETTE.mid,fontStyle:"italic",fontSize:13}}>⚖️ The judge is reviewing all evidence…</p>
                : <>
                  <p style={{fontSize:13,color:PALETTE.mid,marginBottom:10,lineHeight:1.6}}>
                    "Both sides have been heard. Before I deliver my verdict, here is a summary of what this court has established:"
                  </p>
                  {currentQ.split("\n").filter(l=>l.trim()).map((line,i)=>(
                    <div key={i} style={{
                      padding:"8px 12px",marginBottom:6,borderRadius:8,fontSize:13,lineHeight:1.6,
                      background: line.startsWith("•")
                        ? line.includes("FOR:") ? "#FFF0F0"
                          : line.includes("AGAINST:") ? "#F0F5FF"
                          : "#FFFBF0"
                        : "transparent",
                      color:PALETTE.dark,borderLeft:
                        line.includes("FOR:") ? "3px solid #8B1A1A"
                        : line.includes("AGAINST:") ? "3px solid #1A4A8B"
                        : line.includes("KEY") ? "3px solid #D4AF37"
                        : "none",
                    }}>{line}</div>
                  ))}
                </>}
            </div>}

            {/* VERDICT */}
            {phase==="verdict" && <div style={{animation:"fadeIn .4s"}}>
              <div style={{fontSize:10,fontWeight:700,color:"#2C1810",letterSpacing:1,marginBottom:8}}>
                ⚖️ THE JUDGE — FINAL VERDICT
              </div>
              {loading
                ? <p style={{color:PALETTE.mid,fontStyle:"italic",fontSize:13}}>⚖️ The judge is deliberating…</p>
                : <>
                  {verdictText.split("\n").filter(l=>l.trim()).map((line,i)=>{
                    const isLabel = ["FINDING:","DISTORTION:","RULING:","SENTENCE:","ORDER IN COURT"].some(l=>line.includes(l));
                    const bg = line.includes("RULING:") ? "#F0FFF4"
                             : line.includes("FINDING:") ? "#FFF8F0"
                             : line.includes("DISTORTION:") ? "#FFF0F0"
                             : line.includes("ACTION:") ? "#F0F4FF"
                             : "transparent";
                    const border = line.includes("RULING:") ? "3px solid #2A7A4A"
                                 : line.includes("FINDING:") ? "3px solid #D4AF37"
                                 : line.includes("DISTORTION:") ? "3px solid #8B1A1A"
                                 : line.includes("ACTION:") ? "3px solid #1A4A8B"
                                 : "none";
                    return (
                      <div key={i} style={{
                        padding: isLabel?"10px 12px":"6px 0",
                        marginBottom:6,borderRadius:8,
                        background:bg,
                        borderLeft:border,
                        fontSize: line.includes("ORDER")? 15 : 13,
                        fontWeight: line.includes("ORDER")? 700 : 400,
                        fontStyle: line.includes("ORDER")? "normal":"normal",
                        lineHeight:1.7,color:PALETTE.dark,
                      }}>{line}</div>
                    );
                  })}
                  {balancedThought && (
                    <div style={{
                      marginTop:14,padding:"12px 14px",
                      background:"linear-gradient(135deg,#F5FFF8,#FFFBF0)",
                      borderRadius:10,border:"2px solid #D4AF3788",
                    }}>
                      <div style={{fontSize:10,fontWeight:700,color:"#2A7A4A",letterSpacing:1,marginBottom:4}}>
                        🌱 YOUR BALANCED THOUGHT TO CARRY FORWARD
                      </div>
                      <p style={{margin:0,fontSize:14,color:PALETTE.dark,lineHeight:1.7,fontStyle:"italic"}}>
                        "{balancedThought}"
                      </p>
                    </div>
                  )}
                  <div style={{marginTop:12,padding:"8px 12px",background:"#FFF8E8",borderRadius:8,
                    border:"1px solid #D4AF3766",textAlign:"center"}}>
                    <div style={{fontSize:11,fontWeight:700,color:PALETTE.amber}}>🔨 COURT IS ADJOURNED</div>
                    <p style={{margin:"4px 0 0",fontSize:11,color:PALETTE.soft}}>This case will be saved to your library</p>
                  </div>
                </>}
            </div>}
          </div>

          {/* Gavel advance button */}
          <div style={{position:"relative",zIndex:2,paddingBottom:80}}>
            <button
              onClick={()=>{
                if(isReadOnly || isVerdict) {
                  advance(currentKey, inputVal);
                } else if(needsInput && inputVal.trim()) {
                  advance(currentKey, inputVal);
                } else if(phase==="clerk" && inputVal.trim()) {
                  setForm(f=>({...f,thought:inputVal.trim()}));
                  advance("thought", inputVal.trim());
                }
              }}
              disabled={loading || (!isReadOnly && !isVerdict && !inputVal.trim())}
              style={{
                width:"100%",
                background: (loading||(!isReadOnly&&!isVerdict&&!inputVal.trim()))
                  ? "rgba(255,255,255,0.15)"
                  : "linear-gradient(135deg,#D4AF37,#F5C842)",
                border:"none",borderRadius:12,padding:"13px",
                fontSize:14,fontWeight:700,letterSpacing:.5,
                color:(loading||(!isReadOnly&&!isVerdict&&!inputVal.trim()))
                  ?"rgba(255,255,255,0.35)":"#2C1810",
                cursor:(loading||(!isReadOnly&&!isVerdict&&!inputVal.trim()))?"not-allowed":"pointer",
                boxShadow:(loading||(!isReadOnly&&!isVerdict&&!inputVal.trim()))
                  ?"none":"0 4px 20px rgba(212,175,55,0.45)",
              }}>
              {gavelLabel}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Detail view ─────────────────────────────────────────────────────────────
  if(view==="detail" && active) return (
    <div>
      <button onClick={()=>{setView("list");setActive(null)}}
        style={{...btnStyle("#EEE",true),color:PALETTE.mid,marginBottom:16}}>← Back to Cases</button>
      <div style={{
        ...courtroomBg(null),
        borderRadius:16,overflow:"hidden",marginBottom:16,
        position:"relative",padding:16,
      }}>
        <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.6)",borderRadius:16}}/>
        <div style={{position:"relative",zIndex:1,textAlign:"center"}}>
          <div style={{color:"#D4AF37",fontSize:12,fontWeight:700,letterSpacing:2}}>⚖️ CASE RECORD</div>
          <div style={{color:"rgba(255,255,255,0.7)",fontSize:11}}>{fmtDate(active.date)}</div>
        </div>
      </div>

      <div style={{...card,marginBottom:10,borderLeft:"3px solid #6B5744"}}>
        <div style={{fontSize:10,fontWeight:700,color:PALETTE.soft,letterSpacing:1,marginBottom:6}}>📜 THE THOUGHT ON TRIAL</div>
        <p style={{margin:0,color:PALETTE.dark,fontSize:15}}>{active.thought}</p>
      </div>
      {active.prosecutionEvidence?.length>0 && (
        <div style={{...card,marginBottom:10,borderLeft:"3px solid #8B1A1A",background:"#FFF8F8"}}>
          <div style={{fontSize:10,fontWeight:700,color:"#8B1A1A",letterSpacing:1,marginBottom:6}}>⚔️ PROSECUTION EVIDENCE</div>
          {active.prosecutionEvidence.map((e,i)=><p key={i} style={{margin:"0 0 4px",color:PALETTE.dark,fontSize:13}}>• {e}</p>)}
        </div>
      )}
      {active.defenceEvidence?.length>0 && (
        <div style={{...card,marginBottom:10,borderLeft:"3px solid #1A4A8B",background:"#F8F9FF"}}>
          <div style={{fontSize:10,fontWeight:700,color:"#1A4A8B",letterSpacing:1,marginBottom:6}}>🛡️ DEFENCE EVIDENCE</div>
          {active.defenceEvidence.map((e,i)=><p key={i} style={{margin:"0 0 4px",color:PALETTE.dark,fontSize:13}}>• {e}</p>)}
        </div>
      )}
      {active.balancedThought && (
        <div style={{...card,marginBottom:10,borderLeft:"3px solid #D4AF37",background:"#FFFBF0"}}>
          <div style={{fontSize:10,fontWeight:700,color:"#B8860B",letterSpacing:1,marginBottom:6}}>🌱 BALANCED THOUGHT (RULING)</div>
          <p style={{margin:0,color:PALETTE.dark,fontSize:14,fontStyle:"italic"}}>"{active.balancedThought}"</p>
        </div>
      )}
      {active.verdict && (
        <div style={{...card,borderLeft:"3px solid #2C1810",background:"#FDF8F0"}}>
          <div style={{fontSize:10,fontWeight:700,color:"#2C1810",letterSpacing:1,marginBottom:6}}>⚖️ FULL VERDICT</div>
          <p style={{margin:0,color:PALETTE.dark,fontSize:12,lineHeight:1.7,fontStyle:"italic"}}>{active.verdict}</p>
        </div>
      )}
    </div>
  );

  // ── Case list ───────────────────────────────────────────────────────────────
  return (
    <div>
      {/* Header banner */}
      <div style={{
        ...courtroomBg(null),
        borderRadius:16,overflow:"hidden",
        position:"relative",padding:"20px 16px",marginBottom:16,
        minHeight:100,display:"flex",alignItems:"center",justifyContent:"center",
      }}>
        <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.55)"}}/>
        <div style={{position:"relative",zIndex:1,textAlign:"center"}}>
          <div style={{color:"#D4AF37",fontSize:18,fontWeight:700,letterSpacing:2}}>⚖️ THE MIND COURT</div>
          <div style={{color:"rgba(255,255,255,0.75)",fontSize:12,marginTop:4}}>
            Where difficult thoughts get a fair trial
          </div>
        </div>
      </div>

      <div style={{display:"flex",gap:8,marginBottom:20}}>
        <button onClick={startTrial} style={{...btnStyle("#D4AF37"),flex:1,fontSize:14}}>
          🔨 Open New Case
        </button>
      </div>

      <h4 style={{color:PALETTE.mid,marginBottom:10,fontSize:14}}>📁 Case Library</h4>
      {cases.length===0 && <div style={emptyState}>No cases yet. When a thought won't leave you alone, bring it to court. ⚖️</div>}
      {cases.map(c=>(
        <div key={c.id} onClick={()=>{setActive(c);setView("detail");}}
          style={{...card,cursor:"pointer",marginBottom:10,borderLeft:"3px solid #D4AF37",
            display:"flex",alignItems:"center",gap:12}}>
          <span style={{fontSize:24}}>📋</span>
          <div>
            <p style={{margin:0,fontWeight:600,color:PALETTE.dark,fontSize:14}}>{c.thought}</p>
            <p style={{margin:"3px 0 0",fontSize:11,color:PALETTE.soft}}>Case filed {fmtDate(c.date)}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── CBT Distortions Spotter ───────────────────────────────────────────────────
const DISTORTIONS = [
  { id:"aon",  name:"All-or-Nothing",      emoji:"⬛",  color:"#5C3A8B",
    desc:"Seeing things in black and white, with no middle ground.",
    example:"If I am not perfect, I am a total failure.",
    challenge:"What would the middle ground look like? What is a partial success?" },
  { id:"over", name:"Overgeneralisation",  emoji:"🔁",  color:"#8B3A3A",
    desc:"Drawing a broad conclusion from a single event.",
    example:"This went wrong, so everything always goes wrong.",
    challenge:"Is this ONE event, or does it really happen every time? What is the evidence?" },
  { id:"filter",name:"Mental Filter",      emoji:"🔍",  color:"#3A5C8B",
    desc:"Focusing only on negatives while ignoring positives.",
    example:"I got one piece of criticism so the whole thing was a disaster.",
    challenge:"What positives am I filtering out? What is the full picture?" },
  { id:"disq", name:"Disqualifying Positive",emoji:"🚫",color:"#8B6A3A",
    desc:"Dismissing positive experiences as not counting.",
    example:"That only went well by accident — it does not count.",
    challenge:"Why does it not count? What would count, by your own rules?" },
  { id:"mind", name:"Mind Reading",        emoji:"🧠",  color:"#3A7A5C",
    desc:"Assuming you know what others are thinking.",
    example:"They did not reply — they must be annoyed with me.",
    challenge:"What are 3 other explanations? What is the actual evidence?" },
  { id:"fort", name:"Fortune Telling",     emoji:"🔮",  color:"#6A3A8B",
    desc:"Predicting the future negatively as though it is fact.",
    example:"This will definitely go wrong.",
    challenge:"How many times has the feared outcome actually happened? What is the base rate?" },
  { id:"catas",name:"Catastrophising",     emoji:"💥",  color:"#8B2A2A",
    desc:"Exaggerating the importance or impact of problems.",
    example:"This mistake is going to ruin everything.",
    challenge:"On a scale of 1 to 10, how bad is this really? What is the most realistic outcome?" },
  { id:"emot", name:"Emotional Reasoning", emoji:"💢",  color:"#8B4A6A",
    desc:"Assuming feelings reflect facts — I feel it, so it must be true.",
    example:"I feel stupid, therefore I am stupid.",
    challenge:"What are the observable facts — separate from the feeling?" },
  { id:"should",name:"Should Statements",  emoji:"📏",  color:"#4A6A8B",
    desc:"Rigid rules about how you or others must behave.",
    example:"I should be able to cope. I must never make mistakes.",
    challenge:"Where did this rule come from? Would you apply it to anyone else?" },
  { id:"label",name:"Labelling",           emoji:"🏷️",  color:"#8B5A2A",
    desc:"Attaching a global negative label to yourself or others.",
    example:"I made a mistake — I am an idiot.",
    challenge:"Is the label fair and accurate? What is a more precise, factual description?" },
  { id:"pers", name:"Personalisation",     emoji:"👈",  color:"#2A6A6A",
    desc:"Taking excessive blame for things outside your control.",
    example:"It is my fault they are in a bad mood.",
    challenge:"What other factors contributed? What was actually in your control?" },
];

function DistortionsSpotter({ onAddFeel }) {
  const [selected, setSelected]   = useState(null);
  const [thought, setThought]     = useState("");
  const [challenge, setChallenge] = useState("");
  const [aiHelp, setAiHelp]       = useState("");
  const [loading, setLoading]     = useState(false);
  const [saved, setSaved]         = useState(false);

  const getAiChallenge = async () => {
    if(!thought.trim()||!selected) return;
    setLoading(true);
    try {
      const reply = await askBee([{role:"user", content:
        `You are Bea, a CBT-trained bee therapist.
A person has identified their thought: "${thought}"
They believe the distortion present is: ${selected.name} — ${selected.desc}
Write 2 short, practical, factual challenge questions they can ask themselves to test this thought — no reference to other people.
Keep it gentle, clear, and grounded. No preamble.`}]);
      setAiHelp(reply);
    } finally { setLoading(false); }
  };

  const handleSave = () => {
    if(thought && challenge && selected) {
      onAddFeel({ id:uid(), text:`Spotted: ${selected.name} → "${thought}" → Reframe: ${challenge}`,
        type:"thought", date:today() });
      setSaved(true);
      setTimeout(()=>{ setSaved(false); setSelected(null); setThought(""); setChallenge(""); setAiHelp(""); },2000);
    }
  };

  return (
    <div>
      <h3 style={sectionTitle}>🔍 Distortions Spotter</h3>
      <p style={{color:PALETTE.soft,fontSize:13,marginBottom:4}}>
        CBT identifies 11 common thinking errors. Tap one you recognise, then examine your thought.
      </p>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:16,padding:"8px 12px",
        background:`${PALETTE.honey}18`,borderRadius:10,border:`1px solid ${PALETTE.honey}44`}}>
        <BeeMascot size={28}/>
        <p style={{margin:0,fontSize:12,color:PALETTE.mid,lineHeight:1.5}}>
          Naming a distortion doesn't mean your feelings aren't real — it means you're examining the thought, not accepting it as fact. 🐝
        </p>
      </div>

      {/* Distortion grid */}
      {!selected && (
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {DISTORTIONS.map(d=>(
            <div key={d.id} onClick={()=>setSelected(d)}
              style={{...card,cursor:"pointer",display:"flex",alignItems:"flex-start",gap:12,
                borderLeft:`3px solid ${d.color}`,padding:"12px 14px"}}>
              <span style={{fontSize:22,flexShrink:0}}>{d.emoji}</span>
              <div>
                <div style={{fontWeight:700,color:PALETTE.dark,fontSize:14,marginBottom:2}}>{d.name}</div>
                <div style={{fontSize:12,color:PALETTE.soft,lineHeight:1.5}}>{d.desc}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Selected distortion — work through it */}
      {selected && !saved && (
        <div>
          <button onClick={()=>{setSelected(null);setThought("");setChallenge("");setAiHelp("");}}
            style={{...btnStyle("#EEE",true),color:PALETTE.mid,marginBottom:14}}>← All distortions</button>
          <div style={{...card,borderLeft:`3px solid ${selected.color}`,marginBottom:14}}>
            <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:6}}>
              <span style={{fontSize:24}}>{selected.emoji}</span>
              <div style={{fontWeight:700,color:PALETTE.dark,fontSize:16}}>{selected.name}</div>
            </div>
            <p style={{margin:"0 0 8px",fontSize:13,color:PALETTE.mid,lineHeight:1.6}}>{selected.desc}</p>
            <div style={{background:"#F9F9F9",borderRadius:8,padding:"8px 10px",marginBottom:8}}>
              <div style={{fontSize:10,fontWeight:700,color:PALETTE.soft,letterSpacing:1,marginBottom:3}}>EXAMPLE</div>
              <p style={{margin:0,fontSize:12,color:PALETTE.dark,fontStyle:"italic"}}>{selected.example}</p>
            </div>
            <div style={{background:`${selected.color}11`,borderRadius:8,padding:"8px 10px"}}>
              <div style={{fontSize:10,fontWeight:700,color:selected.color,letterSpacing:1,marginBottom:3}}>CBT CHALLENGE QUESTION</div>
              <p style={{margin:0,fontSize:12,color:PALETTE.dark}}>{selected.challenge}</p>
            </div>
          </div>

          <label style={labelStyle}>Your thought to examine</label>
          <textarea value={thought} onChange={e=>setThought(e.target.value)}
                placeholder={`Write the exact thought, e.g. I always get everything wrong.`}
            style={{...textareaStyle,marginBottom:10}}/>

          <button onClick={getAiChallenge} disabled={loading||!thought.trim()}
            style={{...btnStyle(selected.color,true),marginBottom:10,opacity:thought.trim()?1:0.5}}>
            {loading?"🐝 Bea is thinking…":"🐝 Ask Bea to challenge this thought"}
          </button>
          {aiHelp && <div style={{...card,background:`${selected.color}0D`,borderLeft:`3px solid ${selected.color}`,
            marginBottom:10,fontSize:13,color:PALETTE.dark,lineHeight:1.7}}>{aiHelp}</div>}

          <label style={labelStyle}>Your reframed, balanced thought</label>
          <textarea value={challenge} onChange={e=>setChallenge(e.target.value)}
            placeholder="Write a more accurate, evidence-based version of the thought…"
            style={{...textareaStyle,marginBottom:12}}/>
          <button onClick={handleSave} disabled={!thought||!challenge}
            style={{...btnStyle(selected.color),opacity:thought&&challenge?1:0.5,width:"100%"}}>
            ✓ Save Reframe to Feel Better Box
          </button>
        </div>
      )}
      {saved && <div style={{...emptyState,color:PALETTE.sage}}>✓ Reframe saved to your Feel Better Box 💛</div>}
    </div>
  );
}

// ── Behavioural Activation ────────────────────────────────────────────────────
const BA_CATEGORIES = [
  {id:"self",   label:"Self-care",   emoji:"🛁", color:"#5B9BD5"},
  {id:"move",   label:"Movement",    emoji:"🚶", color:"#7BB369"},
  {id:"create", label:"Creative",    emoji:"🎨", color:"#F5A623"},
  {id:"nature", label:"Nature",      emoji:"🌿", color:"#5C8B3A"},
  {id:"mind",   label:"Mind",        emoji:"📖", color:"#9B8BC4"},
  {id:"connect",label:"Connect",     emoji:"💬", color:"#E8737A"},
  {id:"achieve",label:"Achieve",     emoji:"✅", color:"#D4AF37"},
  {id:"rest",   label:"Rest",        emoji:"☁️",  color:"#6B9BB8"},
];

function BehaviouralActivation() {
  const [activities, setActivities] = useState([]);
  const [adding, setAdding]         = useState(false);
  const [newAct, setNewAct]         = useState({text:"",cat:"self",duration:15,mood_before:null,mood_after:null});
  const [active, setActive]         = useState(null); // activity being "done"
  const [aiSuggest, setAiSuggest]   = useState("");
  const [loadingSuggest, setLoadingSuggest] = useState(false);

  const getSuggestion = async (currentMood) => {
    setLoadingSuggest(true);
    try {
      const reply = await askBee([{role:"user",content:
        `You are Bea, a CBT bee therapist. 
A person is feeling ${currentMood||"low"} right now.
Using Behavioural Activation principles from CBT, suggest 3 small, specific activities they can do alone in the next 30 minutes to gently lift their mood.
Each activity should be achievable, concrete, and free or low-cost.
Format as 3 short bullet points. No preamble.`}]);
      setAiSuggest(reply);
    } finally { setLoadingSuggest(false); }
  };

  const completedToday = activities.filter(a=>a.date===today()&&a.mood_after!==null).length;

  return (
    <div>
      <h3 style={sectionTitle}>🌱 Behavioural Activation</h3>
      <p style={{color:PALETTE.soft,fontSize:13,marginBottom:8}}>
        CBT shows that doing small, meaningful activities — even when motivation is zero — is one of the most effective ways to lift mood. Action comes before motivation, not after.
      </p>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:16,padding:"8px 12px",
        background:`${PALETTE.sage}18`,borderRadius:10,border:`1px solid ${PALETTE.sage}44`}}>
        <BeeMascot size={28}/>
        <p style={{margin:0,fontSize:12,color:PALETTE.mid,lineHeight:1.5}}>
          You don"t have to feel like doing it. Do the smallest version of one thing. That's enough. 🐝
        </p>
      </div>

      {/* Bea's suggestions */}
      <div style={{...card,marginBottom:16}}>
        <div style={{fontWeight:700,color:PALETTE.dark,fontSize:14,marginBottom:8}}>🐝 Ask Bea to suggest activities</div>
        <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:10}}>
          {["low","anxious","flat","restless","overwhelmed"].map(m=>(
            <button key={m} onClick={()=>getSuggestion(m)}
              style={{...btnStyle("#EEE",true),color:PALETTE.mid,fontSize:12}}>
              I feel {m}
            </button>
          ))}
        </div>
        {loadingSuggest && <p style={{color:PALETTE.soft,fontSize:13,fontStyle:"italic"}}>🐝 Bea is thinking of ideas…</p>}
        {aiSuggest && <div style={{fontSize:13,color:PALETTE.dark,lineHeight:1.8,whiteSpace:"pre-line"}}>{aiSuggest}</div>}
      </div>

      {/* Add activity */}
      {!adding ? (
        <button onClick={()=>setAdding(true)} style={{...btnStyle(PALETTE.sage),width:"100%",marginBottom:16}}>
          + Schedule an Activity
        </button>
      ) : (
        <div style={{...card,marginBottom:16}}>
          <label style={labelStyle}>Activity</label>
          <input value={newAct.text} onChange={e=>setNewAct(a=>({...a,text:e.target.value}))}
            placeholder="e.g. 10-minute walk, make a cup of tea slowly, tidy one surface"
            style={{...inputStyle,width:"100%",boxSizing:"border-box",marginBottom:10}}/>
          <label style={labelStyle}>Category</label>
          <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:10}}>
            {BA_CATEGORIES.map(c=>(
              <button key={c.id} onClick={()=>setNewAct(a=>({...a,cat:c.id}))}
                style={{...btnStyle(newAct.cat===c.id?c.color:"#EEE",true),
                  color:newAct.cat===c.id?"white":PALETTE.mid}}>
                {c.emoji} {c.label}
              </button>
            ))}
          </div>
          <div style={{display:"flex",gap:8}}>
            <button onClick={()=>{
              if(newAct.text.trim()){
                setActivities(a=>[{id:uid(),date:today(),...newAct,mood_after:null},...a]);
                setAdding(false);setNewAct({text:"",cat:"self",duration:15,mood_before:null,mood_after:null});
              }
            }} style={btnStyle(PALETTE.sage)}>Add</button>
            <button onClick={()=>setAdding(false)} style={btnStyle("#EEE",true)}>Cancel</button>
          </div>
        </div>
      )}

      {/* Activity list */}
      {activities.length===0 && <div style={emptyState}>No activities scheduled yet. Start small — even 5 minutes counts 🌱</div>}
      {activities.map(act=>{
        const cat = BA_CATEGORIES.find(c=>c.id===act.cat);
        const done = act.mood_after !== null;
        return (
          <div key={act.id} style={{...card,marginBottom:10,borderLeft:`3px solid ${cat?.color||PALETTE.sage}`,
            opacity:done?0.7:1}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
              <div>
                <div style={{fontWeight:600,color:PALETTE.dark,fontSize:14}}>{cat?.emoji} {act.text}</div>
                {done && <div style={{fontSize:12,color:PALETTE.sage,marginTop:2}}>✓ Completed — mood: {act.mood_before}→{act.mood_after}/10</div>}
              </div>
              {!done && <button onClick={()=>setActive(act)}
                style={{...btnStyle(cat?.color||PALETTE.sage,true),fontSize:12}}>
                Do it ▶
              </button>}
            </div>
          </div>
        );
      })}

      {/* Mood before/after check-in */}
      {active && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:99,
          display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
          <div style={{...card,width:"100%",maxWidth:360}}>
            <h4 style={{margin:"0 0 12px",color:PALETTE.dark}}>Before you start</h4>
            <p style={{fontSize:14,color:PALETTE.mid,marginBottom:8}}>Rate your mood right now (1=very low, 10=great)</p>
            <div style={{display:"flex",gap:6,marginBottom:16,flexWrap:"wrap"}}>
              {[1,2,3,4,5,6,7,8,9,10].map(n=>(
                <button key={n} onClick={()=>setActivities(a=>a.map(x=>x.id===active.id?{...x,mood_before:n}:x))}
                  style={{...btnStyle(activities.find(x=>x.id===active.id)?.mood_before===n?PALETTE.honey:"#EEE",true),
                    color:activities.find(x=>x.id===active.id)?.mood_before===n?"white":PALETTE.mid,fontWeight:700}}>
                  {n}
                </button>
              ))}
            </div>
            {activities.find(x=>x.id===active.id)?.mood_before && <>
              <p style={{fontSize:13,color:PALETTE.mid,marginBottom:8}}>
                Now go do: <strong>{active.text}</strong>. Come back when done.
              </p>
              <p style={{fontSize:14,color:PALETTE.mid,marginBottom:8,marginTop:12}}>After — rate your mood now:</p>
              <div style={{display:"flex",gap:6,marginBottom:12,flexWrap:"wrap"}}>
                {[1,2,3,4,5,6,7,8,9,10].map(n=>(
                  <button key={n} onClick={()=>setActivities(a=>a.map(x=>x.id===active.id?{...x,mood_after:n}:x))}
                    style={{...btnStyle(activities.find(x=>x.id===active.id)?.mood_after===n?PALETTE.sage:"#EEE",true),
                      color:activities.find(x=>x.id===active.id)?.mood_after===n?"white":PALETTE.mid,fontWeight:700}}>
                    {n}
                  </button>
                ))}
              </div>
            </>}
            <button onClick={()=>setActive(null)} style={btnStyle(PALETTE.sage)}>Done ✓</button>
          </div>
        </div>
      )}

      {completedToday>0 && (
        <div style={{...card,background:`${PALETTE.sage}18`,textAlign:"center",marginTop:8}}>
          <p style={{margin:0,fontSize:13,color:PALETTE.sage,fontWeight:600}}>
            🌱 {completedToday} activit{completedToday===1?"y":"ies"} completed today. That matters.
          </p>
        </div>
      )}
    </div>
  );
}

// ── Values & Goals (ACT/CBT) ──────────────────────────────────────────────────
const VALUES_AREAS = [
  {id:"health",  label:"Health & Body",   emoji:"💪"},
  {id:"mind",    label:"Mind & Learning",  emoji:"📚"},
  {id:"create",  label:"Creativity",       emoji:"🎨"},
  {id:"spirit",  label:"Spirituality",     emoji:"✨"},
  {id:"work",    label:"Work & Purpose",   emoji:"🎯"},
  {id:"finance", label:"Financial",        emoji:"💰"},
  {id:"home",    label:"Home & Space",     emoji:"🏡"},
  {id:"growth",  label:"Personal Growth",  emoji:"🌱"},
];

function ValuesGoals() {
  const [goals, setGoals]         = useState([]);
  const [beliefs, setBeliefs]     = useState([]);
  const [view, setView]           = useState("goals"); // goals | beliefs | add_goal | add_belief
  const [newGoal, setNewGoal]     = useState({text:"",area:"growth",why:"",limit_belief:"",reframe:""});
  const [newBelief, setNewBelief] = useState({belief:"",origin:"",reframe:""});
  const [loading, setLoading]     = useState(false);
  const [aiReframe, setAiReframe] = useState("");

  const getReframe = async (belief) => {
    if(!belief.trim()) return;
    setLoading(true);
    try {
      const r = await askBee([{role:"user",content:
        `You are Bea, a CBT-trained bee therapist working with ACT (Acceptance and Commitment Therapy).
A person has this limiting belief: "${belief}"
1. In one sentence, identify what cognitive distortion this belief contains.
2. In one sentence, write a defused, values-based reframe — not a positive affirmation, but a realistic, flexible alternative that makes room for both difficulty and possibility.
3. In one sentence, suggest one small concrete action this week that would be consistent with someone who holds the reframed belief.
Format as three numbered points.`}]);
      setAiReframe(r);
    } finally { setLoading(false); }
  };

  return (
    <div>
      <h3 style={sectionTitle}>🌟 Values & Goals</h3>
      <p style={{color:PALETTE.soft,fontSize:13,marginBottom:8}}>
        CBT and ACT both show that connecting actions to personal values — and examining the limiting beliefs that block them — is more powerful than willpower alone.
      </p>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:16,padding:"8px 12px",
        background:`${PALETTE.lavender}18`,borderRadius:10,border:`1px solid ${PALETTE.lavender}44`}}>
        <BeeMascot size={28}/>
        <p style={{margin:0,fontSize:12,color:PALETTE.mid,lineHeight:1.5}}>
          Goals work best when they're rooted in what genuinely matters to you — not what you think you should want. 🐝
        </p>
      </div>

      {/* Tab switcher */}
      <div style={{display:"flex",gap:8,marginBottom:16}}>
        {[{id:"goals",label:"🎯 My Goals"},{id:"beliefs",label:"🔓 Limiting Beliefs"}].map(t=>(
          <button key={t.id} onClick={()=>setView(t.id)}
            style={{...btnStyle(view===t.id?PALETTE.lavender:"#EEE",true),
              flex:1,color:view===t.id?"white":PALETTE.mid}}>
            {t.label}
          </button>
        ))}
      </div>

      {/* GOALS view */}
      {view==="goals" && <>
        <button onClick={()=>setView("add_goal")} style={{...btnStyle(PALETTE.lavender),width:"100%",marginBottom:14}}>
          + Add a Goal
        </button>
        {goals.length===0 && <div style={emptyState}>No goals yet. Start with one area of your life that matters to you 🌟</div>}
        {goals.map(g=>{
          const area = VALUES_AREAS.find(a=>a.id===g.area);
          return (
            <div key={g.id} style={{...card,marginBottom:10,borderLeft:`3px solid ${PALETTE.lavender}`}}>
              <div style={{fontSize:11,color:PALETTE.soft,marginBottom:4}}>{area?.emoji} {area?.label}</div>
              <div style={{fontWeight:700,color:PALETTE.dark,fontSize:15,marginBottom:4}}>{g.text}</div>
              {g.why && <p style={{margin:"0 0 6px",fontSize:12,color:PALETTE.mid,lineHeight:1.5}}>
                <strong>Why it matters:</strong> {g.why}
              </p>}
              {g.limit_belief && <div style={{background:"#FFF0F0",borderRadius:6,padding:"6px 10px",marginBottom:6,fontSize:12,color:PALETTE.dark}}>
                <strong style={{color:PALETTE.blush}}>Limiting belief:</strong> {g.limit_belief}
              </div>}
              {g.reframe && <div style={{background:"#F0FFF4",borderRadius:6,padding:"6px 10px",fontSize:12,color:PALETTE.dark}}>
                <strong style={{color:PALETTE.sage}}>Reframe:</strong> {g.reframe}
              </div>}
            </div>
          );
        })}
      </>}

      {/* ADD GOAL */}
      {view==="add_goal" && (
        <div>
          <button onClick={()=>setView("goals")} style={{...btnStyle("#EEE",true),color:PALETTE.mid,marginBottom:14}}>← Back</button>
          <label style={labelStyle}>Life area</label>
          <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:10}}>
            {VALUES_AREAS.map(a=>(
              <button key={a.id} onClick={()=>setNewGoal(g=>({...g,area:a.id}))}
                style={{...btnStyle(newGoal.area===a.id?PALETTE.lavender:"#EEE",true),
                  color:newGoal.area===a.id?"white":PALETTE.mid}}>
                {a.emoji} {a.label}
              </button>
            ))}
          </div>
          <label style={labelStyle}>The goal</label>
          <textarea value={newGoal.text} onChange={e=>setNewGoal(g=>({...g,text:e.target.value}))}
            placeholder={`e.g. Build a daily creative practice or Get my finances organised`}
            style={{...textareaStyle,marginBottom:10,minHeight:60}}/>
          <label style={labelStyle}>Why does this matter to you?</label>
          <textarea value={newGoal.why} onChange={e=>setNewGoal(g=>({...g,why:e.target.value}))}
            placeholder="What value does this connect to? How will it change your daily life?"
            style={{...textareaStyle,marginBottom:10,minHeight:60}}/>
          <label style={labelStyle}>What limiting belief might block you? (optional)</label>
          <input value={newGoal.limit_belief} onChange={e=>setNewGoal(g=>({...g,limit_belief:e.target.value}))}
            placeholder={`e.g. I am not the kind of person who can do this.`}
            style={{...inputStyle,width:"100%",boxSizing:"border-box",marginBottom:10}}/>
          <label style={labelStyle}>Reframe of that belief (optional)</label>
          <input value={newGoal.reframe} onChange={e=>setNewGoal(g=>({...g,reframe:e.target.value}))}
            placeholder={`e.g. I can take one small step, even without certainty.`}
            style={{...inputStyle,width:"100%",boxSizing:"border-box",marginBottom:14}}/>
          <button onClick={()=>{
            if(newGoal.text.trim()){
              setGoals(g=>[{id:uid(),date:today(),...newGoal},...g]);
              setNewGoal({text:"",area:"growth",why:"",limit_belief:"",reframe:""});
              setView("goals");
            }
          }} style={{...btnStyle(PALETTE.lavender),width:"100%"}}>Save Goal</button>
        </div>
      )}

      {/* LIMITING BELIEFS view */}
      {view==="beliefs" && <>
        <button onClick={()=>setView("add_belief")} style={{...btnStyle(PALETTE.lavender),width:"100%",marginBottom:14}}>
          + Examine a Limiting Belief
        </button>
        {beliefs.length===0 && <div style={emptyState}>
          Limiting beliefs are deeply held "I am..." or "I can"t..." thoughts that quietly shape what you try.
          Bring one here to examine it. 🔓
        </div>}
        {beliefs.map(b=>(
          <div key={b.id} style={{...card,marginBottom:10,borderLeft:`3px solid ${PALETTE.blush}`}}>
            <div style={{fontWeight:700,color:PALETTE.dark,fontSize:14,marginBottom:4}}>"{b.belief}"</div>
            {b.origin && <p style={{margin:"0 0 8px",fontSize:12,color:PALETTE.soft}}>Origin: {b.origin}</p>}
            {b.reframe && <div style={{background:"#F0FFF4",borderRadius:6,padding:"8px 10px",fontSize:13,color:PALETTE.dark,lineHeight:1.6,whiteSpace:"pre-line"}}>{b.reframe}</div>}
          </div>
        ))}
      </>}

      {/* ADD BELIEF */}
      {view==="add_belief" && (
        <div>
          <button onClick={()=>{setView("beliefs");setAiReframe("");}} style={{...btnStyle("#EEE",true),color:PALETTE.mid,marginBottom:14}}>← Back</button>
          <label style={labelStyle}>The limiting belief</label>
          <textarea value={newBelief.belief} onChange={e=>setNewBelief(b=>({...b,belief:e.target.value}))}
            placeholder="e.g. I am not capable. / I do not deserve good things. / I always fail." 
            style={{...textareaStyle,marginBottom:10,minHeight:60}}/>
          <label style={labelStyle}>Where do you think this belief came from? (optional)</label>
          <input value={newBelief.origin} onChange={e=>setNewBelief(b=>({...b,origin:e.target.value}))}
            placeholder="e.g. childhood, a specific experience, something someone said"
            style={{...inputStyle,width:"100%",boxSizing:"border-box",marginBottom:10}}/>
          <button onClick={()=>getReframe(newBelief.belief)}
            disabled={loading||!newBelief.belief.trim()}
            style={{...btnStyle(PALETTE.lavender,true),marginBottom:10,opacity:newBelief.belief.trim()?1:0.5}}>
            {loading?"🐝 Bea is working on this…":"🐝 Ask Bea to reframe this belief"}
          </button>
          {aiReframe && <>
            <div style={{...card,background:`${PALETTE.lavender}11`,borderLeft:`3px solid ${PALETTE.lavender}`,
              marginBottom:10,fontSize:13,color:PALETTE.dark,lineHeight:1.8,whiteSpace:"pre-line"}}>
              {aiReframe}
            </div>
            <label style={labelStyle}>Your reframe (edit Bea's, or write your own)</label>
            <textarea value={newBelief.reframe||aiReframe} onChange={e=>setNewBelief(b=>({...b,reframe:e.target.value}))}
              style={{...textareaStyle,marginBottom:10,minHeight:80}}/>
          </>}
          <button onClick={()=>{
            if(newBelief.belief.trim()){
              setBeliefs(b=>[{id:uid(),date:today(),...newBelief,reframe:newBelief.reframe||aiReframe},...b]);
              setNewBelief({belief:"",origin:"",reframe:""});
              setAiReframe("");
              setView("beliefs");
            }
          }} disabled={!newBelief.belief.trim()}
            style={{...btnStyle(PALETTE.lavender),width:"100%",opacity:newBelief.belief.trim()?1:0.5}}>
            Save Belief Work
          </button>
        </div>
      )}
    </div>
  );
}


// ════════════════════════════════════════════════════════════════════════════
// ACT TOOLKIT — Acceptance & Commitment Therapy
// ════════════════════════════════════════════════════════════════════════════

const ACT_AREAS = [
  {id:"health",   label:"Health",       emoji:"💪", color:"#7BB369"},
  {id:"spirit",   label:"Spirituality", emoji:"✨", color:"#9B8BC4"},
  {id:"create",   label:"Creativity",   emoji:"🎨", color:"#F5A623"},
  {id:"mind",     label:"Mind/Growth",  emoji:"📚", color:"#5B9BD5"},
  {id:"home",     label:"Home/Space",   emoji:"🏡", color:"#E8891A"},
  {id:"work",     label:"Purpose/Work", emoji:"🎯", color:"#D4AF37"},
  {id:"finance",  label:"Financial",    emoji:"💰", color:"#5C8B3A"},
  {id:"joy",      label:"Play/Joy",     emoji:"🎉", color:"#E8737A"},
];

const DEFUSION_TECHNIQUES = [
  { id:"notice",  label:"Notice the thought",    emoji:"👁️",
    instruction:"Instead of 'I am a failure', say out loud or write: 'I notice I am having the thought that I am a failure.' Say it a few times. Notice the distance that creates.",
    prompt:"Write your thought below, then rewrite it starting with 'I notice I am having the thought that…'" },
  { id:"name",    label:"Name the story",         emoji:"📖",
    instruction:"Your mind tells familiar stories. Give this one a title — like a book. 'The Not Good Enough Story'. 'The Doomed Story'. Naming it makes it a story, not a fact.",
    prompt:"Write the thought, then give your mind's story a title:" },
  { id:"thank",   label:"Thank your mind",        emoji:"🙏",
    instruction:"Your mind is trying to protect you, even when it's unhelpful. Try saying: 'Thanks, mind. I see you're trying to help. I've got this.' Not sarcastic — genuinely.",
    prompt:"What is your mind trying to protect you from with this thought?" },
  { id:"clouds",  label:"Clouds passing",         emoji:"☁️",
    instruction:"Imagine sitting on a hillside watching clouds. Each cloud is a thought. You don't have to chase them or push them away. Just watch this thought drift past.",
    prompt:"Describe the thought as if it were a cloud — what shape, colour, how fast is it moving?" },
  { id:"sing",    label:"Silly voice",            emoji:"🎵",
    instruction:"Take the thought and say it in a silly voice — a cartoon character, a robot, a pirate. The thought is the same, but your relationship to it changes completely.",
    prompt:"Write the thought here — then notice how it feels to hear it differently:" },
  { id:"leaves",  label:"Leaves on a stream",     emoji:"🍂",
    instruction:"Imagine a gently flowing stream. Place each distressing thought onto a leaf and watch it float slowly downstream. You don't fight the current — you just observe.",
    prompt:"What thoughts are you placing on leaves today?" },
];

const SMART_TEMPLATES = [
  {field:"specific",  label:"Specific",   question:"What exactly will you do? Be precise — who, what, where.",  emoji:"🎯"},
  {field:"measurable",label:"Measurable", question:"How will you know you've done it? What can you count or observe?", emoji:"📏"},
  {field:"achievable",label:"Achievable", question:"Is this genuinely doable for you right now, given your current situation?", emoji:"✅"},
  {field:"relevant",  label:"Relevant",   question:"How does this connect to your values? Why does it matter to you personally?", emoji:"💎"},
  {field:"timebound", label:"Time-bound", question:"When exactly will you do this? Give a specific day and time.", emoji:"⏰"},
];

function ACTToolkit() {
  const [tool, setTool]         = useState(null); // null | "hexaflex"|"compass"|"defusion"|"matrix"|"smart"|"willingness"
  const [compassRatings, setCompassRatings] = useState({}); // {area_id: {importance:0-10, living:0-10}}
  const [defTechnique, setDefTechnique]     = useState(null);
  const [defText, setDefText]   = useState("");
  const [defRewrite, setDefRewrite] = useState("");
  const [matrix, setMatrix]     = useState({toward_inner:"", toward_outer:"", away_inner:"", away_outer:""});
  const [smart, setSmart]       = useState({title:"", value:"", specific:"", measurable:"", achievable:"", relevant:"", timebound:"", experiment:""});
  const [smartSaved, setSmartSaved] = useState([]);
  const [smartStep, setSmartStep]   = useState(0);
  const [willingness, setWillingness] = useState({feeling:"", score:0, value:"", action:""});
  const [activeP, setActiveP]         = useState(null);
  const [aiText, setAiText]     = useState("");
  const [loading, setLoading]   = useState(false);

  const ai = async (prompt) => {
    const r = await askBee([{role:"user", content:prompt}]);
    return r;
  };

  const getAI = async (prompt) => { setLoading(true); try { const r=await ai(prompt); setAiText(r); } finally { setLoading(false); } };

  // ── Tool selector ──────────────────────────────────────────────────────────
  if(!tool) return (
    <div>
      <h3 style={sectionTitle}>🌀 ACT Toolkit</h3>
      <p style={{color:PALETTE.soft,fontSize:13,marginBottom:8}}>
        Acceptance & Commitment Therapy — a modern evolution of CBT. Instead of fighting difficult thoughts and feelings, ACT teaches you to hold them differently, clarify what truly matters, and take values-based action.
      </p>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:16,padding:"8px 12px",
        background:`${PALETTE.sky}18`,borderRadius:10,border:`1px solid ${PALETTE.sky}44`}}>
        <BeeMascot size={28}/>
        <p style={{margin:0,fontSize:12,color:PALETTE.mid,lineHeight:1.5}}>
          ACT doesn't try to eliminate pain. It helps you carry it lightly while you move toward what matters. 🐝
        </p>
      </div>

      {/* The 6 ACT processes as tappable tiles */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
        {[
          {id:"compass",    emoji:"🧭", title:"Values Compass",       sub:"What truly matters to you?",           color:"#5B9BD5"},
          {id:"defusion",   emoji:"🌪️", title:"Defusion Board",       sub:"Create distance from difficult thoughts", color:"#9B8BC4"},
          {id:"matrix",     emoji:"🗺️", title:"ACT Matrix",           sub:"Toward vs Away moves",                  color:"#7BB369"},
          {id:"smart",      emoji:"🧪", title:"SMART Experiments",    sub:"Values-based goal experiments",          color:"#F5A623"},
          {id:"willingness",emoji:"🌊", title:"Willingness Meter",    sub:"Carry difficult feelings toward values",  color:"#E8737A"},
          {id:"hexaflex",   emoji:"🔷", title:"The Hexaflex",         sub:"ACT's 6 core skills explained",          color:"#D4AF37"},
        ].map(t=>(
          <div key={t.id} onClick={()=>setTool(t.id)}
            style={{...card,cursor:"pointer",padding:"14px 12px",borderTop:`3px solid ${t.color}`,textAlign:"center"}}>
            <div style={{fontSize:28,marginBottom:6}}>{t.emoji}</div>
            <div style={{fontWeight:700,color:PALETTE.dark,fontSize:13,marginBottom:3}}>{t.title}</div>
            <div style={{fontSize:11,color:PALETTE.soft,lineHeight:1.4}}>{t.sub}</div>
          </div>
        ))}
      </div>
    </div>
  );

  const backBtn = <button onClick={()=>{setTool(null);setAiText("");setDefTechnique(null);setDefText("");setDefRewrite("");setSmartStep(0);}}
    style={{...btnStyle("#EEE",true),color:PALETTE.mid,marginBottom:16}}>← ACT Toolkit</button>;

  // ── HEXAFLEX ────────────────────────────────────────────────────────────────
  if(tool==="hexaflex") {
    const processes = [
      {label:"Present Moment",  emoji:"⏱️",  color:"#5B9BD5",
       desc:"Paying flexible attention to NOW — your thoughts, feelings, sensations — without getting lost in past or future.",
       practice:"Right now, take 3 slow breaths. Name 3 things you can observe in this moment — one thought, one feeling, one sensation."},
      {label:"Acceptance",      emoji:"🤲",  color:"#7BB369",
       desc:"Making room for difficult feelings without trying to control, fight, or suppress them. Not liking them — just allowing them to be.",
       practice:"Name a difficult feeling you've been resisting. Say: 'I am making room for this feeling. It can be here.'"},
      {label:"Defusion",        emoji:"🌪️",  color:"#9B8BC4",
       desc:"Creating distance from unhelpful thoughts — seeing them as words and mental events, not facts or commands.",
       practice:"Take a difficult thought. Say: 'I notice I'm having the thought that [thought].' Notice the shift."},
      {label:"Self-as-Context", emoji:"🌅",  color:"#E8891A",
       desc:"The observing self — the 'you' that notices thoughts and feelings but is not defined by them. You are the sky; thoughts are weather.",
       practice:"Close your eyes. Notice that there is a 'you' that is watching your thoughts right now. You are not the thoughts — you are the noticer."},
      {label:"Values",          emoji:"🧭",  color:"#F5A623",
       desc:"What truly matters to you — not rules or obligations, but the kind of person you want to be and the life you want to live.",
       practice:"Finish this sentence: 'Deep down, what matters most to me is ___.' Don't overthink it."},
      {label:"Committed Action",emoji:"🚶",  color:"#D4AF37",
       desc:"Taking concrete steps toward your values — even when it's hard, even when feelings push back. Small consistent steps over time.",
       practice:"Name one tiny action — achievable today — that is consistent with one of your core values."},
    ];
    return (
      <div>
        {backBtn}
        <h3 style={sectionTitle}>🔷 The ACT Hexaflex</h3>
        <p style={{color:PALETTE.soft,fontSize:13,marginBottom:16}}>The six skills of psychological flexibility. Tap each one to explore.</p>
        {/* Hexaflex visual */}
        <div style={{position:"relative",width:"100%",paddingBottom:"85%",marginBottom:16}}>
          <svg viewBox="0 0 300 255" style={{position:"absolute",inset:0,width:"100%",height:"100%"}}>
            {/* Connecting lines */}
            {[[0,1],[1,2],[2,3],[3,4],[4,5],[5,0],[0,3],[1,4],[2,5]].map(([a,b],i)=>{
              const hexAngle=(idx)=>(-90+idx*60)*Math.PI/180;
              const r=85, cx=150, cy=128;
              return <line key={i}
                x1={cx+r*Math.cos(hexAngle(a))} y1={cy+r*Math.sin(hexAngle(a))}
                x2={cx+r*Math.cos(hexAngle(b))} y2={cy+r*Math.sin(hexAngle(b))}
                stroke="#DDD" strokeWidth="1"/>;
            })}
            {/* Center circle */}
            <circle cx="150" cy="128" r="32" fill="#FDF3E3" stroke="#F5A623" strokeWidth="1.5"/>
            <text x="150" y="123" textAnchor="middle" fontSize="10" fill="#6B5744" fontWeight="700">Psychological</text>
            <text x="150" y="136" textAnchor="middle" fontSize="10" fill="#6B5744" fontWeight="700">Flexibility</text>
            {/* Six nodes */}
            {processes.map((p,i)=>{
              const nodeAngle=(-90+i*60)*Math.PI/180;
              const r=85, cx=150, cy=128;
              const x=cx+r*Math.cos(nodeAngle2), y=cy+r*Math.sin(nodeAngle2);
              const active=activeP===i;
              return (
                <g key={i} onClick={()=>setActiveP(active?null:i)} style={{cursor:"pointer"}}>
                  <circle cx={x} cy={y} r="26" fill={active?p.color:"white"} stroke={p.color} strokeWidth="2"
                    filter={active?"drop-shadow(0 2px 6px rgba(0,0,0,0.2))":"none"}/>
                  <text x={x} y={y-4} textAnchor="middle" fontSize="14">{p.emoji}</text>
                  <text x={x} y={y+10} textAnchor="middle" fontSize="6.5" fill={active?"white":PALETTE.dark}
                    fontWeight="600">{p.label.split(" ")[0]}</text>
                  {p.label.split(" ")[1] && <text x={x} y={y+18} textAnchor="middle" fontSize="6.5"
                    fill={active?"white":PALETTE.dark}>{p.label.split(" ")[1]}</text>}
                </g>
              );
            })}
          </svg>
        </div>
        {activeP!==null && (
          <div style={{...card,borderLeft:`3px solid ${processes[activeP].color}`,animation:"fadeIn .3s ease"}}>
            <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:8}}>
              <span style={{fontSize:24}}>{processes[activeP].emoji}</span>
              <div style={{fontWeight:700,color:PALETTE.dark,fontSize:16}}>{processes[activeP].label}</div>
            </div>
            <p style={{margin:"0 0 12px",fontSize:14,color:PALETTE.mid,lineHeight:1.7}}>{processes[activeP].desc}</p>
            <div style={{background:`${processes[activeP].color}15`,borderRadius:8,padding:"10px 12px"}}>
              <div style={{fontSize:10,fontWeight:700,color:processes[activeP].color,letterSpacing:1,marginBottom:4}}>TRY THIS NOW</div>
              <p style={{margin:0,fontSize:13,color:PALETTE.dark,lineHeight:1.6}}>{processes[activeP].practice}</p>
            </div>
          </div>
        )}
        {activeP===null && <p style={{color:PALETTE.soft,fontSize:13,textAlign:"center"}}>Tap any node to explore that skill 🔷</p>}
      </div>
    );
  }

  // ── VALUES COMPASS ──────────────────────────────────────────────────────────
  if(tool==="compass") {
    const setRating = (areaId, field, val) =>
      setCompassRatings(r=>({...r,[areaId]:{...(r[areaId]||{}), [field]:val}}));
    const gaps = ACT_AREAS.filter(a=>{
      const r=compassRatings[a.id]||{};
      return (r.importance||0)>=7 && (r.living||0)<5;
    });
    return (
      <div>
        {backBtn}
        <h3 style={sectionTitle}>🧭 Values Compass</h3>
        <p style={{color:PALETTE.soft,fontSize:13,marginBottom:8}}>
          For each area of life: rate how important it is to you, and how much you're currently living in line with it. The gap between the two shows where to focus.
        </p>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:16,padding:"8px 12px",
          background:`${PALETTE.sky}18`,borderRadius:10}}>
          <BeeMascot size={24}/>
          <p style={{margin:0,fontSize:12,color:PALETTE.mid}}>This isn't about achievement — it's about direction. 🐝</p>
        </div>

        {/* Visual wheel */}
        <div style={{position:"relative",width:"100%",paddingBottom:"100%",marginBottom:16}}>
          <svg viewBox="0 0 300 300" style={{position:"absolute",inset:0,width:"100%",height:"100%"}}>
            {ACT_AREAS.map((area,i)=>{
              const n=ACT_AREAS.length, angle=(i/n)*2*Math.PI-Math.PI/2;
              const r=compassRatings[area.id]||{};
              const imp=(r.importance||0)/10, liv=(r.living||0)/10;
              const cx=150, cy=150, maxR=100;
              const ix=cx+maxR*imp*Math.cos(nodeAngle), iy=cy+maxR*imp*Math.sin(nodeAngle);
              const lx=cx+maxR*liv*Math.cos(nodeAngle), ly=cy+maxR*liv*Math.sin(nodeAngle);
              const labelX=cx+(maxR+20)*Math.cos(nodeAngle), labelY=cy+(maxR+20)*Math.sin(nodeAngle);
              return (
                <g key={area.id}>
                  <line x1={cx} y1={cy} x2={cx+maxR*Math.cos(angle)} y2={cy+maxR*Math.sin(angle)}
                    stroke="#EEE" strokeWidth="1"/>
                  {imp>0 && <line x1={cx} y1={cy} x2={ix} y2={iy} stroke={area.color} strokeWidth="3" opacity="0.4"/>}
                  {liv>0 && <line x1={cx} y1={cy} x2={lx} y2={ly} stroke={area.color} strokeWidth="3"/>}
                  <text x={labelX} y={labelY+4} textAnchor="middle" fontSize="14">{area.emoji}</text>
                </g>
              );
            })}
            {[2,4,6,8,10].map(v=>(
              <circle key={v} cx="150" cy="150" r={v*10} fill="none" stroke="#EEE" strokeWidth="0.5"/>
            ))}
            <circle cx="150" cy="150" r="4" fill={PALETTE.honey}/>
          </svg>
        </div>

        {/* Sliders per area */}
        {ACT_AREAS.map(area=>{
          const r=compassRatings[area.id]||{};
          return (
            <div key={area.id} style={{...card,marginBottom:10}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
                <span style={{fontSize:20}}>{area.emoji}</span>
                <span style={{fontWeight:700,color:PALETTE.dark,fontSize:14}}>{area.label}</span>
              </div>
              <div style={{marginBottom:8}}>
                <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:PALETTE.soft,marginBottom:4}}>
                  <span>Importance to me</span><span style={{color:area.color,fontWeight:700}}>{r.importance||0}/10</span>
                </div>
                <input type="range" min="0" max="10" value={r.importance||0}
                  onChange={e=>setRating(area.id,"importance",+e.target.value)}
                  style={{width:"100%",accentColor:area.color}}/>
              </div>
              <div>
                <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:PALETTE.soft,marginBottom:4}}>
                  <span>Living in line with it</span><span style={{color:(r.living||0)<5&&(r.importance||0)>=7?PALETTE.blush:area.color,fontWeight:700}}>{r.living||0}/10</span>
                </div>
                <input type="range" min="0" max="10" value={r.living||0}
                  onChange={e=>setRating(area.id,"living",+e.target.value)}
                  style={{width:"100%",accentColor:area.color}}/>
              </div>
            </div>
          );
        })}

        {gaps.length>0 && (
          <div style={{...card,background:"#FFF8EE",borderLeft:"3px solid #F5A623",marginTop:8}}>
            <div style={{fontWeight:700,color:PALETTE.amber,fontSize:13,marginBottom:8}}>🧭 Your biggest gaps</div>
            {gaps.map(a=>(
              <div key={a.id} style={{fontSize:13,color:PALETTE.dark,marginBottom:4}}>
                {a.emoji} <strong>{a.label}</strong> — highly important to you, but you're not living it yet
              </div>
            ))}
            <p style={{margin:"10px 0 0",fontSize:12,color:PALETTE.soft}}>
              These are where one small committed action could make the most difference.
            </p>
          </div>
        )}
      </div>
    );
  }

  // ── DEFUSION BOARD ──────────────────────────────────────────────────────────
  if(tool==="defusion") {
    return (
      <div>
        {backBtn}
        <h3 style={sectionTitle}>🌪️ Defusion Board</h3>
        <p style={{color:PALETTE.soft,fontSize:13,marginBottom:8}}>
          Defusion doesn't challenge thoughts or try to replace them. It changes your <em>relationship</em> to them — from fused (thought = fact) to defused (thought = just a thought).
        </p>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:16,padding:"8px 12px",
          background:`${PALETTE.lavender}18`,borderRadius:10}}>
          <BeeMascot size={24}/>
          <p style={{margin:0,fontSize:12,color:PALETTE.mid}}>You don't have to believe everything your mind says. 🐝</p>
        </div>

        {!defTechnique ? (
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {DEFUSION_TECHNIQUES.map(t=>(
              <div key={t.id} onClick={()=>setDefTechnique(t)}
                style={{...card,cursor:"pointer",display:"flex",alignItems:"center",gap:12,
                  borderLeft:`3px solid ${PALETTE.lavender}`}}>
                <span style={{fontSize:24}}>{t.emoji}</span>
                <div>
                  <div style={{fontWeight:700,color:PALETTE.dark,fontSize:14}}>{t.label}</div>
                  <div style={{fontSize:12,color:PALETTE.soft,marginTop:2,lineHeight:1.4}}>{t.instruction.slice(0,60)}…</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div>
            <button onClick={()=>{setDefTechnique(null);setDefText("");setDefRewrite("");setAiText("");}}
              style={{...btnStyle("#EEE",true),color:PALETTE.mid,marginBottom:14}}>← All techniques</button>
            <div style={{...card,borderLeft:`3px solid ${PALETTE.lavender}`,marginBottom:14}}>
              <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:8}}>
                <span style={{fontSize:24}}>{defTechnique.emoji}</span>
                <span style={{fontWeight:700,color:PALETTE.dark,fontSize:16}}>{defTechnique.label}</span>
              </div>
              <p style={{margin:0,fontSize:13,color:PALETTE.mid,lineHeight:1.7}}>{defTechnique.instruction}</p>
            </div>
            <label style={labelStyle}>{defTechnique.prompt}</label>
            <textarea value={defText} onChange={e=>setDefText(e.target.value)}
              placeholder="Write here…"
              style={{...textareaStyle,marginBottom:10}}/>
            <button onClick={()=>getAI(`You are Bea, an ACT-trained therapist.
A person is practising the "${defTechnique.label}" defusion technique.
They wrote: "${defText}"
In 2 warm, brief sentences, reflect back what they've done well and offer one gentle observation about how this defusion might help them carry the thought more lightly. No preamble.`)}
              disabled={loading||!defText.trim()}
              style={{...btnStyle(PALETTE.lavender,true),marginBottom:10,opacity:defText.trim()?1:0.5}}>
              {loading?"🐝 Bea is reflecting…":"🐝 Bea reflects on this"}
            </button>
            {aiText && <div style={{...card,background:`${PALETTE.lavender}11`,
              borderLeft:`3px solid ${PALETTE.lavender}`,fontSize:13,color:PALETTE.dark,lineHeight:1.7}}>
              {aiText}
            </div>}
          </div>
        )}
      </div>
    );
  }

  // ── ACT MATRIX ─────────────────────────────────────────────────────────────
  if(tool==="matrix") {
    const quadrants = [
      {key:"toward_inner", label:"Toward — Inner", color:"#7BB369", bg:"#F5FFF5",
       desc:"What matters to you? What do you want to stand for?",
       placeholder:"Values, hopes, what truly matters…"},
      {key:"toward_outer", label:"Toward — Outer", color:"#5B9BD5", bg:"#F5F8FF",
       desc:"What actions move you toward those values?",
       placeholder:"Behaviours, steps, things you could do…"},
      {key:"away_inner",   label:"Away — Inner",   color:"#E8737A", bg:"#FFF5F5",
       desc:"What difficult thoughts and feelings show up?",
       placeholder:"Fears, worries, pain, difficult thoughts…"},
      {key:"away_outer",   label:"Away — Outer",   color:"#F5A623", bg:"#FFFBF0",
       desc:"What do you do to get away from those feelings?",
       placeholder:"Avoidance, distractions, unhelpful habits…"},
    ];
    return (
      <div>
        {backBtn}
        <h3 style={sectionTitle}>🗺️ ACT Matrix</h3>
        <p style={{color:PALETTE.soft,fontSize:13,marginBottom:8}}>
          A powerful two-axis map. The vertical axis: moving <strong>Toward</strong> your values vs <strong>Away</strong> from pain. The horizontal: your inner world vs your outer behaviour. Fill in each quadrant.
        </p>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14,padding:"8px 12px",
          background:`${PALETTE.sage}18`,borderRadius:10}}>
          <BeeMascot size={24}/>
          <p style={{margin:0,fontSize:12,color:PALETTE.mid}}>Away moves aren't bad — they're human. The question is: are they working? 🐝</p>
        </div>
        {/* Matrix labels */}
        <div style={{display:"flex",justifyContent:"space-between",fontSize:11,fontWeight:700,
          color:PALETTE.soft,letterSpacing:1,marginBottom:4,padding:"0 4px"}}>
          <span>⬆️ TOWARD YOUR VALUES</span>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
          {quadrants.map(q=>(
            <div key={q.key} style={{background:q.bg,borderRadius:12,padding:10,border:`1.5px solid ${q.color}44`}}>
              <div style={{fontSize:10,fontWeight:700,color:q.color,letterSpacing:1,marginBottom:4}}>{q.label.toUpperCase()}</div>
              <div style={{fontSize:11,color:PALETTE.soft,marginBottom:6,lineHeight:1.4}}>{q.desc}</div>
              <textarea value={matrix[q.key]} onChange={e=>setMatrix(m=>({...m,[q.key]:e.target.value}))}
                placeholder={q.placeholder}
                style={{width:"100%",minHeight:70,padding:"6px 8px",borderRadius:8,border:`1px solid ${q.color}44`,
                  fontSize:12,color:PALETTE.dark,resize:"vertical",fontFamily:"inherit",
                  background:"rgba(255,255,255,0.7)",boxSizing:"border-box",outline:"none"}}/>
            </div>
          ))}
        </div>
        <div style={{display:"flex",justifyContent:"space-between",fontSize:11,fontWeight:700,
          color:PALETTE.soft,letterSpacing:1,marginBottom:12,padding:"0 4px"}}>
          <span>⬇️ AWAY FROM PAIN</span>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",fontSize:11,fontWeight:700,
          color:PALETTE.soft,letterSpacing:1,marginBottom:16,textAlign:"center"}}>
          <span>🧠 INNER WORLD</span><span>🌍 OUTER BEHAVIOUR</span>
        </div>
        {Object.values(matrix).some(v=>v.trim()) && (
          <button onClick={()=>getAI(`You are Bea, an ACT therapist.
A person completed their ACT Matrix:
Toward (inner — values): "${matrix.toward_inner}"
Toward (outer — actions): "${matrix.toward_outer}"
Away (inner — difficult feelings): "${matrix.away_inner}"
Away (outer — avoidance behaviours): "${matrix.away_outer}"

In 3 sentences: (1) Name what their toward moves tell you about their values. (2) Gently name the away pattern you see. (3) Suggest one tiny toward move they could make this week. Be warm and specific.`)}
            disabled={loading}
            style={{...btnStyle(PALETTE.sage),width:"100%",marginBottom:10}}>
            {loading?"🐝 Bea is reading your matrix…":"🐝 Ask Bea to reflect on your matrix"}
          </button>
        )}
        {aiText && <div style={{...card,background:`${PALETTE.sage}11`,borderLeft:`3px solid ${PALETTE.sage}`,
          fontSize:13,color:PALETTE.dark,lineHeight:1.8}}>{aiText}</div>}
      </div>
    );
  }

  // ── SMART EXPERIMENTS ───────────────────────────────────────────────────────
  if(tool==="smart") {
    const currentField = SMART_TEMPLATES[smartStep];
    const allFilled = SMART_TEMPLATES.every(t=>smart[t.field]?.trim());
    return (
      <div>
        {backBtn}
        <h3 style={sectionTitle}>🧪 SMART Experiments</h3>
        <p style={{color:PALETTE.soft,fontSize:13,marginBottom:8}}>
          In ACT, goals are treated as behavioural <em>experiments</em> — you take a values-based action and observe what actually happens. No pressure to succeed — just to try and learn.
        </p>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14,padding:"8px 12px",
          background:`${PALETTE.honey}18`,borderRadius:10}}>
          <BeeMascot size={24}/>
          <p style={{margin:0,fontSize:12,color:PALETTE.mid}}>A goal isn't a pass/fail test. It's an experiment with useful data either way. 🐝</p>
        </div>

        {smartSaved.length>0 && !smart.title && (
          <>
            <h4 style={{color:PALETTE.mid,fontSize:13,marginBottom:8}}>Your experiments</h4>
            {smartSaved.map(s=>(
              <div key={s.id} style={{...card,marginBottom:10,borderLeft:`3px solid ${PALETTE.honey}`}}>
                <div style={{fontWeight:700,color:PALETTE.dark,fontSize:14,marginBottom:4}}>{s.title}</div>
                <div style={{fontSize:12,color:PALETTE.soft,marginBottom:6}}>{s.relevant}</div>
                {s.experiment && <div style={{background:"#F5FFF8",borderRadius:6,padding:"6px 10px",fontSize:12,color:PALETTE.dark}}>
                  <strong>What happened:</strong> {s.experiment}
                </div>}
              </div>
            ))}
            <div style={{height:12}}/>
          </>
        )}

        {!smart.title ? (
          <>
            <label style={labelStyle}>What's the experiment about?</label>
            <input value={smart.title||""} onChange={e=>setSmart(s=>({...s,title:e.target.value}))}
            placeholder={`e.g. Building a creative practice or Getting my finances in order`}
              style={{...inputStyle,width:"100%",boxSizing:"border-box",marginBottom:10}}/>
            <label style={labelStyle}>Which value does this serve?</label>
            <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:12}}>
              {ACT_AREAS.map(a=>(
                <button key={a.id} onClick={()=>setSmart(s=>({...s,value:a.label}))}
                  style={{...btnStyle(smart.value===a.label?PALETTE.honey:"#EEE",true),
                    color:smart.value===a.label?"white":PALETTE.mid}}>
                  {a.emoji} {a.label}
                </button>
              ))}
            </div>
            <button onClick={()=>{ if(smart.title?.trim()) setSmartStep(0); }}
              disabled={!smart.title?.trim()}
              style={{...btnStyle(PALETTE.honey),width:"100%",opacity:smart.title?.trim()?1:0.5}}>
              Build the Experiment →
            </button>
          </>
        ) : smartStep < SMART_TEMPLATES.length ? (
          <div>
            {/* Progress */}
            <div style={{display:"flex",gap:4,marginBottom:14}}>
              {SMART_TEMPLATES.map((_,i)=>(
                <div key={i} style={{flex:1,height:4,borderRadius:2,
                  background:i<=smartStep?PALETTE.honey:"#EEE",transition:"background .3s"}}/>
              ))}
            </div>
            <div style={{...card,borderLeft:`3px solid ${PALETTE.honey}`,marginBottom:14}}>
              <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:8}}>
                <span style={{fontSize:22}}>{currentField.emoji}</span>
                <span style={{fontWeight:700,color:PALETTE.dark,fontSize:16}}>{currentField.label}</span>
              </div>
              <p style={{margin:0,fontSize:13,color:PALETTE.mid,lineHeight:1.6}}>{currentField.question}</p>
            </div>
            <textarea value={smart[currentField.field]||""} onChange={e=>setSmart(s=>({...s,[currentField.field]:e.target.value}))}
              placeholder="Your answer…"
              style={{...textareaStyle,marginBottom:10,minHeight:80}}/>
            <div style={{display:"flex",gap:8}}>
              {smartStep>0 && <button onClick={()=>setSmartStep(s=>s-1)} style={btnStyle("#EEE",true)}>← Back</button>}
              <button onClick={()=>{ if(smart[currentField.field]?.trim()) setSmartStep(s=>s+1); }}
                disabled={!smart[currentField.field]?.trim()}
                style={{...btnStyle(PALETTE.honey),flex:1,opacity:smart[currentField.field]?.trim()?1:0.5}}>
                {smartStep<SMART_TEMPLATES.length-1?"Next →":"Review Experiment →"}
              </button>
            </div>
          </div>
        ) : (
          <div>
            <h4 style={{color:PALETTE.mid,fontSize:13,marginBottom:12}}>📋 Your Experiment</h4>
            <div style={{...card,borderLeft:`3px solid ${PALETTE.honey}`,marginBottom:12}}>
              <div style={{fontWeight:700,color:PALETTE.dark,fontSize:15,marginBottom:8}}>{smart.title}</div>
              {SMART_TEMPLATES.map(t=>(
                <div key={t.field} style={{marginBottom:8}}>
                  <span style={{fontSize:11,fontWeight:700,color:PALETTE.soft,letterSpacing:1}}>{t.emoji} {t.label.toUpperCase()}: </span>
                  <span style={{fontSize:13,color:PALETTE.dark}}>{smart[t.field]}</span>
                </div>
              ))}
            </div>
            <label style={labelStyle}>What actually happened? (fill in after attempting)</label>
            <textarea value={smart.experiment||""} onChange={e=>setSmart(s=>({...s,experiment:e.target.value}))}
              placeholder="What did you observe? What did you learn — regardless of outcome?"
              style={{...textareaStyle,marginBottom:10,minHeight:70}}/>
            <button onClick={()=>{
              setSmartSaved(s=>[{id:uid(),...smart},...s]);
              setSmart({title:"",value:"",specific:"",measurable:"",achievable:"",relevant:"",timebound:"",experiment:""});
              setSmartStep(0);
            }} style={{...btnStyle(PALETTE.honey),width:"100%"}}>Save Experiment</button>
          </div>
        )}
      </div>
    );
  }

  // ── WILLINGNESS METER ───────────────────────────────────────────────────────
  if(tool==="willingness") {
    return (
      <div>
        {backBtn}
        <h3 style={sectionTitle}>🌊 Willingness Meter</h3>
        <p style={{color:PALETTE.soft,fontSize:13,marginBottom:8}}>
          Some pain can"t be thought away. ACT asks: can you be <em>willing</em> to carry this feeling — not like it, not want it — but allow it to be there while you still move toward what matters?
        </p>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14,padding:"8px 12px",
          background:`${PALETTE.blush}18`,borderRadius:10}}>
          <BeeMascot size={24}/>
          <p style={{margin:0,fontSize:12,color:PALETTE.mid}}>Willingness isn't wanting the pain. It's choosing not to fight it at the cost of your life. 🐝</p>
        </div>

        <label style={labelStyle}>What difficult feeling are you carrying?</label>
        <input value={willingness.feeling} onChange={e=>setWillingness(w=>({...w,feeling:e.target.value}))}
          placeholder={`e.g. loneliness, grief, anxiety, shame`}
          style={{...inputStyle,width:"100%",boxSizing:"border-box",marginBottom:14}}/>

        <label style={labelStyle}>Willingness to carry it (without fighting or escaping)</label>
        <div style={{...card,marginBottom:14,padding:"16px"}}>
          {/* Visual meter */}
          <div style={{position:"relative",height:40,background:"linear-gradient(90deg,#E8737A,#F5A623,#7BB369)",
            borderRadius:20,marginBottom:12,overflow:"hidden"}}>
            <div style={{position:"absolute",top:0,left:0,right:`${100-willingness.score*10}%`,
              bottom:0,background:"rgba(255,255,255,0.6)",borderRadius:20,transition:"right .3s"}}/>
            <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",
              justifyContent:"center",fontWeight:800,fontSize:18,color:"white",
              textShadow:"0 1px 3px rgba(0,0,0,0.3)"}}>
              {willingness.score}/10
            </div>
          </div>
          <input type="range" min="0" max="10" value={willingness.score}
            onChange={e=>setWillingness(w=>({...w,score:+e.target.value}))}
            style={{width:"100%",accentColor:PALETTE.sage,marginBottom:6}}/>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:PALETTE.soft}}>
            <span>0 — Completely closed, fighting it</span>
            <span>10 — Fully open, allowing it</span>
          </div>
        </div>

        <label style={labelStyle}>What value matters to you right now, despite this feeling?</label>
        <input value={willingness.value} onChange={e=>setWillingness(w=>({...w,value:e.target.value}))}
          placeholder={`e.g. showing up for myself, creativity, growth`}
          style={{...inputStyle,width:"100%",boxSizing:"border-box",marginBottom:10}}/>

        <label style={labelStyle}>One small toward move you could make while carrying this feeling</label>
        <input value={willingness.action} onChange={e=>setWillingness(w=>({...w,action:e.target.value}))}
          placeholder={`e.g. Spend 10 minutes on something I care about`}
          style={{...inputStyle,width:"100%",boxSizing:"border-box",marginBottom:12}}/>

        {willingness.feeling && (
          <button onClick={()=>getAI(`You are Bea, an ACT therapist.
A person is working with willingness for: "${willingness.feeling}"
Their current willingness score: ${willingness.score}/10
The value they want to move toward: "${willingness.value}"
Their intended action: "${willingness.action}"

In 2 warm, ACT-consistent sentences: validate their experience, and affirm the values-based direction they"ve identified. Do not minimise the pain. Do not use toxic positivity.`)}
            disabled={loading}
            style={{...btnStyle(PALETTE.blush),width:"100%",marginBottom:10}}>
            {loading?"🐝 Bea is with you…":"🐝 Bea reflects on this"}
          </button>
        )}
        {aiText && <div style={{...card,background:`${PALETTE.blush}0D`,borderLeft:`3px solid ${PALETTE.blush}`,
          fontSize:13,color:PALETTE.dark,lineHeight:1.8}}>{aiText}</div>}
      </div>
    );
  }

  return null;
}

// ── Grounding ─────────────────────────────────────────────────────────────────
function Grounding() {
  const [tool, setTool] = useState(null);
  const [step54, setStep54] = useState(0);
  const senses = [
    {n:5,q:"Name 5 things you can SEE right now",emoji:"👁️"},
    {n:4,q:"Name 4 things you can TOUCH or feel",emoji:"✋"},
    {n:3,q:"Name 3 things you can HEAR",emoji:"👂"},
    {n:2,q:"Name 2 things you can SMELL",emoji:"👃"},
    {n:1,q:"Name 1 thing you can TASTE",emoji:"👅"},
  ];

  return (
    <div>
      <h3 style={sectionTitle}>🌿 Grounding Toolkit</h3>
      <p style={{color:PALETTE.soft,fontSize:13,marginBottom:16}}>Quick tools for when you feel overwhelmed or anxious.</p>
      <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:20}}>
        {["breathing","5-4-3-2-1"].map(t=>(
          <button key={t} onClick={()=>setTool(t===tool?null:t)}
            style={btnStyle(tool===t?PALETTE.sky:"#EEE",true)}>
            {t==="breathing"?"🌬️ Breathing":"🖐 5-4-3-2-1"}
            <span style={{color:tool===t?"white":PALETTE.mid}}> </span>
          </button>
        ))}
      </div>

      {tool==="breathing" && <BreathingCircle/>}

      {tool==="5-4-3-2-1" && (
        <div>
          <div style={{...card,textAlign:"center",marginBottom:12}}>
            <div style={{fontSize:48,marginBottom:8}}>{senses[step54].emoji}</div>
            <p style={{fontWeight:700,color:PALETTE.dark,fontSize:16,margin:0}}>{senses[step54].q}</p>
          </div>
          <div style={{display:"flex",gap:8,justifyContent:"center"}}>
            {step54>0 && <button onClick={()=>setStep54(s=>s-1)} style={btnStyle("#EEE",true)}>← Back</button>}
            {step54<4
              ? <button onClick={()=>setStep54(s=>s+1)} style={btnStyle(PALETTE.sky)}>Next →</button>
              : <button onClick={()=>setStep54(0)} style={btnStyle(PALETTE.sage)}>✓ Done — feel more grounded?</button>
            }
          </div>
        </div>
      )}
    </div>
  );
}

// ── Progress ──────────────────────────────────────────────────────────────────
function Progress({ moodLogs, feelItems, triggerItems, courtCases, difficultItems=[] }) {
  const total = moodLogs.length;
  const avg = total ? (moodLogs.reduce((s,l)=>s+(l.rating||l.mood?.score||5),0)/total).toFixed(1) : null;
  const released = triggerItems.filter(t=>t.status==="released").length;
  const stored   = triggerItems.filter(t=>t.status==="stored").length;
  const diffStored = difficultItems.filter(t=>t.status==="stored").length;
  const diffReleased = difficultItems.filter(t=>t.status==="released").length;

  const streakDays = (() => {
    let streak=0, d=new Date();
    while(true) {
      const key = d.toISOString().slice(0,10);
      if(moodLogs.some(l=>l.date===key)) { streak++; d.setDate(d.getDate()-1); }
      else break;
    }
    return streak;
  })();

  const milestones = [
    streakDays>=3 && `🔥 ${streakDays}-day check-in streak — you're showing up for yourself!`,
    released>=3   && `🌊 You've let go of ${released} worries — that takes real courage.`,
    feelItems.length>=5 && `💛 Your Feel Better Box has ${feelItems.length} things in it — beautiful.`,
    courtCases.length>=1 && `⚖️ You've challenged ${courtCases.length} difficult thought${courtCases.length>1?"s":""} — that's growth.`,
    diffReleased>=2    && `🌿 You've let go of ${diffReleased} difficult feelings — that's real courage.`,
    diffStored>=3      && `💜 You've named ${diffStored} hard feelings — awareness is the first step.`,
  ].filter(Boolean);

  return (
    <div>
      <h3 style={sectionTitle}>📈 Your Progress</h3>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:20}}>
        {[
          {label:"Mood logs",value:total,color:PALETTE.honey},
          {label:"Avg mood",value:avg?`${avg}/5`:"—",color:PALETTE.sage},
          {label:"Worries released",value:released,color:PALETTE.sky},
          {label:"Stored safely",value:stored,color:PALETTE.lavender},
        ].map(s=>(
          <div key={s.label} style={{...card,textAlign:"center"}}>
            <div style={{fontSize:28,fontWeight:800,color:s.color}}>{s.value}</div>
            <div style={{fontSize:12,color:PALETTE.soft,marginTop:2}}>{s.label}</div>
          </div>
        ))}
      </div>

      {milestones.length>0 && <>
        <h4 style={{color:PALETTE.mid,marginBottom:10,fontSize:14}}>Celebrations 🎉</h4>
        {milestones.map((m,i)=>(
          <div key={i} style={{...card,background:`${PALETTE.honey}22`,marginBottom:8,fontSize:14,color:PALETTE.dark}}>
            {m}
          </div>
        ))}
      </>}

      {total===0 && <div style={emptyState}>Start logging your mood and I'll show your journey here 🐝</div>}
    </div>
  );
}

// ── Bea Chat ──────────────────────────────────────────────────────────────────
function BeaChat() {
  const [messages, setMessages] = useState([
    { role:"assistant", content:"Hello, I'm Bea 🐝 I'm here whenever you need to talk, process something, or just be heard. What's on your mind today?" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef();

  useEffect(()=>{ bottomRef.current?.scrollIntoView({behavior:"smooth"}); },[messages]);

  const send = async () => {
    if(!input.trim()||loading) return;
    const userMsg = { role:"user", content:input.trim() };
    const history = [...messages, userMsg];
    setMessages(history);
    setInput("");
    setLoading(true);
    try {
      const apiMsgs = history.map(m=>({ role:m.role, content:m.content }));
      const reply = await askBee(apiMsgs);
      setMessages(h=>[...h, { role:"assistant", content:reply }]);
    } catch {
      setMessages(h=>[...h,{role:"assistant",content:"Sorry, I'm having a little trouble connecting right now. Try again in a moment 🐝"}]);
    } finally { setLoading(false); }
  };

  return (
    <div style={{display:"flex",flexDirection:"column",height:"calc(100vh - 180px)"}}>
      <h3 style={{...sectionTitle,marginBottom:8}}>Chat with Bea 🐝</h3>
      <div style={{flex:1,overflowY:"auto",display:"flex",flexDirection:"column",gap:10,padding:"4px 0 8px"}}>
        {messages.map((m,i)=>(
          <div key={i} style={{display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start",alignItems:"flex-end",gap:8}}>
            {m.role==="assistant" && <BeeMascot size={32} outfit="therapist"/>}
            <div style={{
              maxWidth:"75%",padding:"10px 14px",borderRadius:18,fontSize:14,lineHeight:1.5,
              background:m.role==="user"?PALETTE.honey:PALETTE.comb,
              color:m.role==="user"?"white":PALETTE.dark,
              borderBottomRightRadius:m.role==="user"?4:18,
              borderBottomLeftRadius:m.role==="assistant"?4:18,
            }}>{m.content}</div>
          </div>
        ))}
        {loading && (
          <div style={{display:"flex",alignItems:"flex-end",gap:8}}>
            <BeeMascot size={32} outfit="therapist"/>
            <div style={{...card,padding:"10px 14px",fontSize:14,color:PALETTE.soft}}>Bea is typing…</div>
          </div>
        )}
        <div ref={bottomRef}/>
      </div>
      <div style={{display:"flex",gap:8,paddingTop:8,borderTop:`1px solid #EEE`}}>
        <input value={input} onChange={e=>setInput(e.target.value)}
          onKeyDown={e=>e.key==="Enter"&&send()}
          placeholder="Talk to Bea…"
          style={{...inputStyle,flex:1}}/>
        <button onClick={send} disabled={loading||!input.trim()}
          style={btnStyle(PALETTE.honey)}>Send</button>
      </div>
    </div>
  );
}

// ── Shared styles ─────────────────────────────────────────────────────────────
const sectionTitle = { fontFamily:"Georgia,serif", fontSize:20, color:PALETTE.dark, margin:"0 0 12px" };
const card = { background:"white", borderRadius:12, padding:14, boxShadow:"0 1px 6px rgba(0,0,0,0.07)" };
const emptyState = { textAlign:"center", color:PALETTE.soft, fontSize:14, padding:"32px 16px", background:PALETTE.pollen, borderRadius:12 };
const inputStyle = { padding:"10px 14px", borderRadius:999, border:`1.5px solid #DDD`, fontSize:14, color:PALETTE.dark, outline:"none", background:"white" };
const textareaStyle = { width:"100%", padding:"10px 14px", borderRadius:12, border:`1.5px solid #DDD`, fontSize:14, color:PALETTE.dark, minHeight:72, resize:"vertical", fontFamily:"inherit", boxSizing:"border-box", outline:"none" };
const labelStyle = { display:"block", fontSize:12, fontWeight:700, color:PALETTE.mid, marginBottom:4, textTransform:"uppercase", letterSpacing:.5 };

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════════════════════════
export default function BeeWell() {
  const [onboarded, setOnboarded] = useState(false);
  const [tab, setTab] = useState("mood");
  const [moodLogs, setMoodLogs]     = useState([]);
  const [feelItems, setFeelItems]       = useState([]);
  const [difficultItems, setDifficultItems] = useState([]);
  const [triggers, setTriggers]         = useState([]);
  const [cases, setCases]           = useState([]);
  const [releaseStyle, setReleaseStyle] = useState("sea");
  const [showSettings, setShowSettings] = useState(false);
  const [theme, setTheme]           = useState("honey");
  const [outfit, setOutfit]         = useState("therapist");
  const [installPrompt, setInstallPrompt] = useState(null);
  const [installed, setInstalled]   = useState(false);

  useEffect(()=>{
    const handler = (e) => { e.preventDefault(); setInstallPrompt(e); };
    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', ()=>setInstalled(true));
    return ()=>{ window.removeEventListener('beforeinstallprompt', handler); };
  },[]);

  const handleInstall = async () => {
    if(!installPrompt) return;
    installPrompt.prompt();
    const {outcome} = await installPrompt.userChoice;
    if(outcome==='accepted') setInstalled(true);
    setInstallPrompt(null);
  };

  const themeAccent = { honey:PALETTE.honey, sage:PALETTE.sage, lavender:PALETTE.lavender, sky:PALETTE.sky }[theme] || PALETTE.honey;

  if(!onboarded) return <Onboarding onDone={()=>setOnboarded(true)}/>;

  const tabs = [
    {id:"mood",      label:"Mood",        emoji:"📊"},
    {id:"feel",      label:"Feel Better", emoji:"💛"},
    {id:"difficult", label:"Problem Box", emoji:"📦"},
    {id:"court",     label:"Courtroom",   emoji:"⚖️"},
    {id:"distort",   label:"Distortions", emoji:"🔍"},
    {id:"activate",  label:"Activate",    emoji:"🌱"},
    {id:"values",    label:"Values",      emoji:"🌟"},
    {id:"act",       label:"ACT",         emoji:"🌀"},
    {id:"ground",    label:"Ground",      emoji:"🍃"},
    {id:"progress",  label:"Progress",    emoji:"📈"},
    {id:"bea",       label:"Bea",         emoji:"🐝"},
  ];

  const handleRelease = (id) => {
    setTriggers(ts=>ts.map(t=>t.id===id?{...t,status:"released"}:t));
  };

  return (
    <div style={{
      minHeight:"100vh",
      background:`linear-gradient(160deg, ${PALETTE.comb} 0%, #FFF8EE 100%)`,
      fontFamily:"-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    }}>
      {/* Header */}
      <div style={{
        background:`linear-gradient(90deg, ${themeAccent} 0%, ${PALETTE.amber} 100%)`,
        padding:"16px 20px 12px",
        display:"flex",alignItems:"center",justifyContent:"space-between",
        boxShadow:"0 2px 12px rgba(0,0,0,0.12)"
      }}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <BeeMascot size={40} outfit={outfit}/>
          <div>
            <div style={{fontFamily:"Georgia,serif",fontSize:20,color:"white",fontWeight:700,lineHeight:1}}>BeeWell</div>
            <div style={{fontSize:11,color:"rgba(255,255,255,0.8)"}}>Your private hive 🍯</div>
          </div>
        </div>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          {installPrompt && !installed && (
            <button onClick={handleInstall}
              style={{background:"rgba(255,255,255,0.25)",border:"1px solid rgba(255,255,255,0.5)",
                borderRadius:999,padding:"6px 12px",color:"white",fontSize:13,
                cursor:"pointer",fontWeight:700}}>
              📲 Install App
            </button>
          )}
          <button onClick={()=>setShowSettings(s=>!s)}
            style={{background:"rgba(255,255,255,0.25)",border:"none",borderRadius:999,
              padding:"6px 12px",color:"white",fontSize:13,cursor:"pointer",fontWeight:600}}>
            ⚙️ Hive
          </button>
        </div>
      </div>

      {/* Settings panel */}
      {showSettings && (
        <div style={{background:"white",padding:20,boxShadow:"0 4px 16px rgba(0,0,0,0.1)"}}>
          <h4 style={{margin:"0 0 12px",color:PALETTE.mid}}>🎨 Customise Your Hive</h4>
          <div style={{marginBottom:12}}>
            <div style={{fontSize:12,fontWeight:700,color:PALETTE.soft,marginBottom:6}}>COLOUR THEME</div>
            <div style={{display:"flex",gap:8}}>
              {Object.entries({honey:"#F5A623",sage:"#7BB369",lavender:"#9B8BC4",sky:"#5B9BD5"}).map(([k,c])=>(
                <button key={k} onClick={()=>setTheme(k)}
                  style={{width:32,height:32,borderRadius:16,background:c,border:theme===k?"3px solid #333":"3px solid transparent",cursor:"pointer"}}/>
              ))}
            </div>
          </div>
          <div style={{marginBottom:12}}>
            <div style={{fontSize:12,fontWeight:700,color:PALETTE.soft,marginBottom:6}}>BEA'S OUTFIT</div>
            <div style={{display:"flex",gap:8}}>
              {[{id:"therapist",label:"🩺 Therapist"},{id:"cozy",label:"🧣 Cosy"},{id:"party",label:"🎉 Fun"}].map(o=>(
                <button key={o.id} onClick={()=>setOutfit(o.id)}
                  style={{...btnStyle(outfit===o.id?themeAccent:"#EEE",true),color:outfit===o.id?"white":PALETTE.mid}}>
                  {o.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div style={{fontSize:12,fontWeight:700,color:PALETTE.soft,marginBottom:6}}>RELEASE STYLE</div>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              {RELEASE_STYLES.map(r=>(
                <button key={r.id} onClick={()=>setReleaseStyle(r.id)}
                  style={{...btnStyle(releaseStyle===r.id?themeAccent:"#EEE",true),color:releaseStyle===r.id?"white":PALETTE.mid}}>
                  {r.emoji} {r.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <div style={{padding:"20px 20px 90px",maxWidth:500,margin:"0 auto"}}>
        {tab==="mood"     && <MoodTracker
          logs={moodLogs}
          onSaveMood={e=>setMoodLogs(l=>[e,...l])}
          onAddFeel={e=>setFeelItems(l=>[e,...l])}
          onAddDifficult={e=>setDifficultItems(l=>[e,...l])}
        />}
        {tab==="feel"     && <FeelBetterBox items={feelItems} onAdd={e=>setFeelItems(l=>[e,...l])} onDelete={id=>setFeelItems(l=>l.filter(i=>i.id!==id))}/>}
        {tab==="difficult" && <ProblemBox
          items={difficultItems}
          onAdd={e=>setDifficultItems(l=>[e,...l])}
          onUpdate={(id,changes)=>setDifficultItems(ts=>ts.map(t=>t.id===id?{...t,...changes}:t))}
          onRelease={id=>setDifficultItems(ts=>ts.map(t=>t.id===id?{...t,status:"released"}:t))}
          onSetTab={setTab}
        />}
        {tab==="court"    && <Courtroom cases={cases} onSave={c=>setCases(l=>[c,...l])}/>}
        {tab==="distort"  && <DistortionsSpotter onAddFeel={e=>setFeelItems(l=>[e,...l])}/>}
        {tab==="activate" && <BehaviouralActivation/>}
        {tab==="values"   && <ValuesGoals/>}
        {tab==="act"      && <ACTToolkit/>}
        {tab==="ground"   && <Grounding/>}
        {tab==="progress" && <Progress moodLogs={moodLogs} feelItems={feelItems} triggerItems={triggers} courtCases={cases} difficultItems={difficultItems}/>}
        {tab==="bea"      && <BeaChat/>}
      </div>

      {/* Bottom nav */}
      <div style={{
        position:"fixed",bottom:0,left:0,right:0,
        background:"white",
        borderTop:"1px solid #EEE",
        display:"flex",
        boxShadow:"0 -2px 12px rgba(0,0,0,0.08)",
        overflowX:"auto",
      }}>
        {tabs.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)}
            style={{
              flex:1,padding:"10px 4px 8px",border:"none",background:"none",cursor:"pointer",
              display:"flex",flexDirection:"column",alignItems:"center",gap:2,
              borderTop:`2px solid ${tab===t.id?themeAccent:"transparent"}`,
              transition:"border-color .2s",
            }}>
            <span style={{fontSize:18}}>{t.emoji}</span>
            <span style={{fontSize:9.5,color:tab===t.id?themeAccent:PALETTE.soft,fontWeight:tab===t.id?700:400}}>
              {t.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
