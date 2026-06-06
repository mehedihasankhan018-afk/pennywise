import { useEffect, useState, useMemo, useCallback, useRef } from "react";

/* ── IndexedDB ─────────────────────────────────────────────── */
const DB="pennywise_v6",ST="d";
const odb=()=>new Promise((res,rej)=>{const r=indexedDB.open(DB,1);r.onupgradeneeded=()=>{if(!r.result.objectStoreNames.contains(ST))r.result.createObjectStore(ST);};r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error);});
const iSet=async(k,v)=>{const db=await odb();const tx=db.transaction(ST,"readwrite");tx.objectStore(ST).put(v,k);return new Promise((res,rej)=>{tx.oncomplete=res;tx.onerror=rej;});};
const iGet=async k=>{const db=await odb();return new Promise(res=>{const r=db.transaction(ST,"readonly").objectStore(ST).get(k);r.onsuccess=()=>res(r.result??null);r.onerror=()=>res(null);});};

/* ── Constants ─────────────────────────────────────────────── */
const DAYS=30;
const newMeals=()=>Array(DAYS).fill(0);
const F="'Outfit',sans-serif";
const FA="'Atma',sans-serif";

const FIXED_BILLS=[
  {id:"rent",label:"Rent",          color:"#1B4FD8",ik:"home"},
  {id:"svc", label:"Service Charge",color:"#374151",ik:"wrench"},
  {id:"elec",label:"Electricity",   color:"#D97706",ik:"bolt"},
  {id:"gas", label:"Gas",           color:"#DC2626",ik:"flame"},
  {id:"net", label:"Internet",      color:"#1B4FD8",ik:"wifi"},
  {id:"bua", label:"Bua",           color:"#059669",ik:"broom"},
];
const mkBills=()=>FIXED_BILLS.map(b=>({...b,amount:"",custom:false}));

/* Bauhaus avatar palette – blue, red, yellow, black, green, purple */
const BPAL=[
  {bg:"#1B4FD8",txt:"#fff"},
  {bg:"#DC2626",txt:"#fff"},
  {bg:"#E6A800",txt:"#111"},
  {bg:"#111827",txt:"#fff"},
  {bg:"#059669",txt:"#fff"},
  {bg:"#7C3AED",txt:"#fff"},
];

/* ── Colour tokens ──────────────────────────────────────────── */
const BLU="#1B4FD8",RED="#DC2626",YEL="#E6A800",BLK="#111827";
const CREAM="#F5F0E4",CREAM2="#ECE7D8",WHT="#FFFFFF";

function mkT(dark){
  return dark?{
    dark:true,
    pg:"#15120C",card:"#1D1910",cardAlt:"#242018",
    brd:"rgba(255,255,255,0.08)",brdDk:"rgba(255,255,255,0.13)",
    t1:"#F4EFE3",t2:"#BEB49E",t3:"#827A68",t4:"#524E42",
    acc:"#4F7FFF",red:"#EF5350",yel:"#F9C74F",grn:"#34D399",org:"#FB923C",prp:"#A78BFA",
    sh:"0 2px 10px rgba(0,0,0,0.45)",
    nav:"#1D1910",inp:"#242018",
  }:{
    dark:false,
    pg:CREAM,card:WHT,cardAlt:CREAM2,
    brd:"rgba(17,24,39,0.09)",brdDk:"rgba(17,24,39,0.15)",
    t1:BLK,t2:"#374151",t3:"#6B7280",t4:"#9CA3AF",
    acc:BLU,red:RED,yel:YEL,grn:"#059669",org:"#D97706",prp:"#7C3AED",
    sh:"0 2px 8px rgba(17,24,39,0.07)",
    nav:WHT,inp:"#FEFCF8",
  };
}

/* ── SVG Icons ──────────────────────────────────────────────── */
function Ic({k,z=18,c="currentColor"}){
  const s={width:z,height:z,display:"inline-flex",flexShrink:0,verticalAlign:"middle"};
  const P={
    utensils:<svg viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={s}><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 002-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 00-5 5v6c0 1.1.9 2 2 2h3zm0 0v7"/></svg>,
    receipt:<svg viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={s}><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1z"/><path d="M9 7h6M9 11h6M9 15h4"/></svg>,
    chart:<svg viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={s}><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
    home:<svg viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={s}><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/></svg>,
    sun:<svg viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={s}><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>,
    moon:<svg viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={s}><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>,
    reset:<svg viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={s}><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10"/></svg>,
    close:<svg viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.2" strokeLinecap="round" style={s}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
    edit:<svg viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={s}><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
    trash:<svg viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={s}><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>,
    check:<svg viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={s}><polyline points="20 6 9 17 4 12"/></svg>,
    plus:<svg viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" style={s}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
    users:<svg viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={s}><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>,
    user:<svg viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={s}><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
    warn:<svg viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={s}><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
    arrow:<svg viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={s}><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
    cart:<svg viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={s}><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/></svg>,
    rate:<svg viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={s}><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>,
    settle:<svg viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={s}><path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>,
    allchk:<svg viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={s}><polyline points="20 6 9 17 4 12"/></svg>,
    note:<svg viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={s}><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
    bolt:<svg viewBox="0 0 24 24" fill={c} stroke="none" style={s}><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>,
    flame:<svg viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={s}><path d="M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 11-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 002.5 3z"/></svg>,
    wifi:<svg viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={s}><path d="M1.42 9a16 16 0 0121.16 0"/><path d="M5 12.55a11 11 0 0114.08 0"/><path d="M10.54 16.1a6 6 0 012.92 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg>,
    wrench:<svg viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={s}><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>,
    broom:<svg viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={s}><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10"/><path d="M12 12l8.5-8.5M17.5 6.5L12 12"/></svg>,
    trendUp:<svg viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={s}><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>,
    trendDn:<svg viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={s}><polyline points="22 17 13.5 8.5 8.5 13.5 2 7"/><polyline points="16 17 22 17 22 11"/></svg>,
    wallet:<svg viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={s}><path d="M20 12V8H6a2 2 0 01-2-2c0-1.1.9-2 2-2h12v4"/><path d="M4 6v12a2 2 0 002 2h14v-4"/><circle cx="16" cy="14" r="1" fill={c}/></svg>,
  };
  return P[k]||P["receipt"];
}

/* ── Bauhaus Avatar ─────────────────────────────────────────── */
function Avatar({name,ci,size=40}){
  const p=BPAL[ci%BPAL.length];
  const ini=(name||"?").split(" ").map(w=>w[0]).join("").toUpperCase().slice(0,2)||"?";
  return(
    <div style={{
      width:size,height:size,borderRadius:"50%",
      background:p.bg,color:p.txt,
      display:"flex",alignItems:"center",justifyContent:"center",
      fontWeight:800,fontSize:size*0.38,fontFamily:F,
      flexShrink:0,letterSpacing:"-0.5px",
      boxShadow:`0 4px 12px ${p.bg}55`,
    }}>{ini}</div>
  );
}

/* ── Toast ──────────────────────────────────────────────────── */
function Toast({msg,type}){
  return(
    <div style={{
      position:"fixed",bottom:108,left:"50%",transform:"translateX(-50%)",
      background:type==="error"?RED:"#059669",
      color:"#fff",padding:"10px 24px",borderRadius:100,
      fontWeight:700,fontSize:13,fontFamily:F,
      zIndex:9999,whiteSpace:"nowrap",pointerEvents:"none",
      boxShadow:"0 4px 20px rgba(0,0,0,0.20)",
      animation:"toastIn 220ms cubic-bezier(0.34,1.56,0.64,1)",
    }}>{msg}</div>
  );
}

/* ── Confirm Modal ──────────────────────────────────────────── */
function ConfirmSheet({title,body,onOk,onClose,T}){
  return(
    <div onClick={e=>e.target===e.currentTarget&&onClose()}
      style={{position:"fixed",inset:0,background:"rgba(17,24,39,0.60)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{
        background:T.card,borderRadius:20,width:"calc(100% - 40px)",maxWidth:360,
        padding:"0 0 24px",overflow:"hidden",
        border:`1.5px solid ${T.brdDk}`,boxShadow:T.sh,
        animation:"modalIn 240ms cubic-bezier(0.34,1.20,0.64,1)",
      }}>
        <div style={{background:T.red,padding:"20px 24px 16px",position:"relative"}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:36,height:36,borderRadius:10,background:"rgba(255,255,255,0.22)",display:"flex",alignItems:"center",justifyContent:"center"}}>
              <Ic k="warn" z={18} c="#fff"/>
            </div>
            <span style={{fontWeight:800,fontSize:18,color:"#fff",fontFamily:F,letterSpacing:"-0.4px"}}>{title}</span>
          </div>
        </div>
        <div style={{padding:"18px 24px 0"}}>
          <p style={{color:T.t2,lineHeight:1.6,marginBottom:22,fontSize:14,fontFamily:F}}>{body}</p>
          <div style={{display:"flex",gap:10}}>
            <button onClick={onClose} style={{flex:1,padding:"12px",borderRadius:10,border:`1.5px solid ${T.brd}`,background:"transparent",color:T.t2,fontWeight:700,fontSize:14,fontFamily:F,cursor:"pointer"}}>Cancel</button>
            <button onClick={onOk} style={{flex:1,padding:"12px",borderRadius:10,border:"none",background:T.red,color:"#fff",fontWeight:700,fontSize:14,fontFamily:F,cursor:"pointer"}}>Reset</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function GeoStack({colors=["#E6A800","#1B4FD8"]}){
  return(
    <div style={{position:"absolute",right:-2,top:0,bottom:0,width:44,pointerEvents:"none",overflow:"hidden"}}>
      <div style={{position:"absolute",bottom:-8,right:-8,width:52,height:52,borderRadius:"50%",background:colors[0]}}/>
      <div style={{position:"absolute",top:0,right:0,width:18,height:"55%",background:colors[1]}}/>
    </div>
  );
}

/* ── CalNote helpers ────────────────────────────────────────── */
const BN2="০১২৩৪৫৬৭৮৯";
const toBn2=n=>String(n).replace(/\d/g,d=>BN2[d]);
const toEn2=s=>String(s).replace(/[০-৯]/g,d=>String(BN2.indexOf(d))).replace(/×/g,"*").replace(/÷/g,"/").replace(/−/g,"-");
function cnSafeCalc(expr){const clean=toEn2(expr).replace(/[^0-9+\-*/.() ]/g,"").trim();if(!clean)return null;try{const tokens=clean.match(/(\d+\.?\d*)|([+\-*/()])/g);if(!tokens)return null;let i=0;const peek=()=>tokens[i],consume=()=>tokens[i++];const pN=()=>{const t=consume();if(t==="("){const v=cA();consume();return v;}return t===undefined?0:parseFloat(t);};const cM=()=>{let v=pN();while(peek()==="*"||peek()==="/"){const op=consume(),r=pN();v=op==="*"?v*r:r!==0?v/r:NaN;}return v;};const cA=()=>{let v=cM();while(peek()==="+"||peek()==="-"){const op=consume(),r=cM();v=op==="+"?v+r:v-r;}return v;};const result=cA();return isFinite(result)?result:null;}catch{return null;}}
function cnEvalLine(raw){const en=toEn2(raw);if(/[+\-*/]/.test(en))return cnSafeCalc(en);const m=en.match(/-?\d+(\.\d+)?/);return m?parseFloat(m[0]):null;}
function cnCalcTotal(arr){let s=0;arr.forEach(l=>{const v=cnEvalLine(l);if(v!==null&&!isNaN(v))s+=v;});return s;}
function cnFmtNum(n){if(n===null||isNaN(n))return "";const sign=n<0?"−":"",abs=Math.abs(n);const str=Number.isInteger(abs)?String(abs):abs.toFixed(4).replace(/\.?0+$/,"\"");return sign+toBn2(str);}
const CN_KEY="calnote_pw1";
const cnLoad=()=>{try{const r=localStorage.getItem(CN_KEY);return r?JSON.parse(r):null;}catch{return null;}};
const cnSave=o=>{try{localStorage.setItem(CN_KEY,JSON.stringify(o));}catch{return null;}};

/* ── CalNote App ────────────────────────────────────────────── */
function CalNoteApp({onClose,T}){
  const saved=cnLoad();
  const [title,setTitle]=useState(saved?.title??"আমার হিসাব");
  const [lines,setLines]=useState(Array.isArray(saved?.lines)&&saved.lines.length>0?saved.lines:[""]);
  const refs=useRef([]);const stimer=useRef(null);const ptimer=useRef(null);const prev=useRef(0);
  const [pulse,setPulse]=useState(false);
  const total=useMemo(()=>cnCalcTotal(lines),[lines]);
  const lres=useMemo(()=>lines.map(l=>{const en=toEn2(l);if(!/[+\-*/]/.test(en))return null;return cnEvalLine(l);}),[lines]);
  useEffect(()=>{refs.current=refs.current.slice(0,lines.length);},[lines.length]);
  useEffect(()=>{if(total!==prev.current){prev.current=total;setPulse(true);clearTimeout(ptimer.current);ptimer.current=setTimeout(()=>setPulse(false),700);}},[total]);
  const save2=useCallback((t,l)=>{clearTimeout(stimer.current);stimer.current=setTimeout(()=>cnSave({title:t,lines:l}),500);},[]);
  const resize=el=>{if(!el)return;el.style.height="auto";el.style.height=el.scrollHeight+"px";};
  const onChange=(i,e)=>{const nl=[...lines];nl[i]=e.target.value;setLines(nl);resize(e.target);save2(title,nl);};
  const onKD=(i,e)=>{
    if(e.key==="Enter"){e.preventDefault();const el=refs.current[i],pos=el?.selectionStart??lines[i].length;const nl=[...lines.slice(0,i),lines[i].slice(0,pos),lines[i].slice(pos),...lines.slice(i+1)];setLines(nl);save2(title,nl);setTimeout(()=>{const nx=refs.current[i+1];if(nx){nx.focus();nx.setSelectionRange(0,0);resize(nx);}},0);}
    if(e.key==="Backspace"){const el=refs.current[i],pos=el?.selectionStart??0;if(pos===0&&i>0){e.preventDefault();const pL=lines[i-1].length;const nl=[...lines.slice(0,i-1),lines[i-1]+lines[i],...lines.slice(i+1)];setLines(nl);save2(title,nl);setTimeout(()=>{const pv=refs.current[i-1];if(pv){pv.focus();pv.setSelectionRange(pL,pL);resize(pv);}},0);}}
  };
  return(
    <div style={{position:"fixed",inset:0,zIndex:500,display:"flex",flexDirection:"column",background:T.pg,animation:"slideUp 240ms cubic-bezier(0.34,1.10,0.64,1)"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 20px",height:58,borderBottom:`1.5px solid ${T.brdDk}`,background:T.nav,flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:34,height:34,borderRadius:10,background:T.prp,display:"flex",alignItems:"center",justifyContent:"center"}}>
            <Ic k="note" z={17} c="#fff"/>
          </div>
          <span style={{fontSize:18,fontWeight:800,color:T.t1,fontFamily:FA,letterSpacing:"-0.3px"}}>ক্যালনোট</span>
        </div>
        <button onClick={onClose} style={{width:36,height:36,borderRadius:10,border:`1.5px solid ${T.brd}`,background:"transparent",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}>
          <Ic k="close" z={16} c={T.t2}/>
        </button>
      </div>
      <div style={{flex:1,overflowY:"auto",WebkitOverflowScrolling:"touch",padding:"16px 18px 80px"}}>
        <div style={{background:T.card,borderRadius:16,border:`1.5px solid ${T.brdDk}`,overflow:"hidden",boxShadow:T.sh}}>
          <div style={{padding:"14px 18px 12px",borderBottom:`1px solid ${T.brd}`}}>
            <input value={title} onChange={e=>{setTitle(e.target.value);save2(e.target.value,lines);}} placeholder="হিসাবের নাম লিখুন"
              style={{width:"100%",background:"transparent",border:"none",outline:"none",fontFamily:FA,fontSize:17,fontWeight:700,color:T.t1}}/>
          </div>
          {lines.map((line,i)=>(
            <div key={i} style={{display:"flex",alignItems:"flex-start",borderBottom:i<lines.length-1?`1px solid ${T.brd}`:"none"}}>
              <span style={{width:36,flexShrink:0,paddingTop:12,textAlign:"center",fontFamily:FA,fontSize:11,fontWeight:600,color:T.t4,userSelect:"none"}}>{toBn2(i+1)}</span>
              <textarea ref={el=>{refs.current[i]=el;}} rows={1} spellCheck={false} value={line}
                onChange={e=>onChange(i,e)} onKeyDown={e=>onKD(i,e)} onFocus={e=>resize(e.target)}
                style={{flex:1,background:"transparent",border:"none",outline:"none",resize:"none",overflow:"hidden",fontFamily:FA,fontSize:15,lineHeight:1.8,color:T.t1,padding:"10px 8px 10px 0",minHeight:44,caretColor:BLU,wordBreak:"break-word"}}/>
              {lres[i]!==null&&<span style={{alignSelf:"center",marginRight:14,fontFamily:FA,fontSize:11,color:T.t3,whiteSpace:"nowrap"}}>= {cnFmtNum(lres[i])}</span>}
            </div>
          ))}
          <div style={{borderTop:`1.5px solid ${T.brdDk}`,padding:"14px 18px",display:"flex",justifyContent:"flex-end",alignItems:"baseline",gap:8,background:T.cardAlt}}>
            <span style={{fontFamily:FA,fontSize:11,color:T.t3,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.08em"}}>মোট</span>
            <span style={{fontFamily:FA,fontSize:36,fontWeight:800,color:T.t1,letterSpacing:"-1px",display:"inline-block",transition:"transform 300ms cubic-bezier(0.34,1.56,0.64,1)",transform:pulse?"scale(1.08)":"scale(1)"}}>
              {cnFmtNum(total)}
            </span>
          </div>
        </div>
      </div>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Atma:wght@400;600;700&display=swap');`}</style>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   MAIN APP
══════════════════════════════════════════════════════════════ */
export default function Pennywise(){
  const [dark,setDark]=useState(false);
  const T=mkT(dark);

  const [pageIdx,setPageIdx]=useState(0);
  const [toast,setToast]=useState(null);
  const [loaded,setLoaded]=useState(false);
  const [showReset,setShowReset]=useState(false);

  const [people,setPeople]=useState([
    {name:"Person 1",market:"",meals:newMeals()},
    {name:"Person 2",market:"",meals:newMeals()},
  ]);
  const [mealTab,setMealTab]=useState("table");
  const [hlDay,setHlDay]=useState(null);
  const [editPerson,setEditPerson]=useState(null);
  const [showAddP,setShowAddP]=useState(false);
  const [newPName,setNewPName]=useState("");
  const [showCalNote,setShowCalNote]=useState(false);

  const [bills,setBills]=useState(mkBills());
  const [showAddBill,setShowAddBill]=useState(false);
  const [newBillName,setNewBillName]=useState("");

  const trackRef=useRef(null);
  const panel0=useRef(null),panel1=useRef(null),panel2=useRef(null);
  const idxRef=useRef(0);
  const tx0=useRef(null),ty0=useRef(null);
  const dragging=useRef(false),axisLock=useRef(null);

  /* persist */
  useEffect(()=>{(async()=>{
    const d=await iGet("pw_main");
    if(d){
      if(Array.isArray(d.people)&&d.people.length>0)
        setPeople(d.people.map(p=>({...p,meals:Array.isArray(p.meals)?[...p.meals,...newMeals()].slice(0,DAYS):newMeals()})));
      if(typeof d.dark==="boolean")setDark(d.dark);
      if(Array.isArray(d.bills)&&d.bills.length>0){
        const fixed=FIXED_BILLS.map(fb=>{const sv=d.bills.find(b=>b.id===fb.id);return{...fb,amount:sv?.amount ?? "",custom:false};});
        setBills([...fixed,...d.bills.filter(b=>b.custom)]);
      }
    }
    setLoaded(true);
  })();},[]);
  useEffect(()=>{if(!loaded)return;iSet("pw_main",{people,bills,dark});},[people,bills,dark,loaded]);

  const notify=useCallback((msg,type="success")=>{setToast({msg,type});setTimeout(()=>setToast(null),2400);},[]);

  /* navigation */
  const goTo=useCallback(n=>{
    n=Math.max(0,Math.min(2,n));
    setPageIdx(n);idxRef.current=n;
    if(trackRef.current){
      trackRef.current.style.transition="transform 260ms cubic-bezier(0.4,0,0.2,1)";
      trackRef.current.style.transform=`translateX(-${n*100/3}%)`;
    }
    const p=[panel0,panel1,panel2][n];
    if(p?.current)p.current.scrollTop=0;
  },[]);

  /* swipe */
  const onTS=e=>{tx0.current=e.touches[0].clientX;ty0.current=e.touches[0].clientY;dragging.current=false;axisLock.current=null;};
  const onTM=e=>{
    if(tx0.current===null)return;
    const dx=e.touches[0].clientX-tx0.current,dy=e.touches[0].clientY-ty0.current;
    if(!axisLock.current){if(Math.abs(dx)<5&&Math.abs(dy)<5)return;axisLock.current=Math.abs(dx)>Math.abs(dy)?"h":"v";}
    if(axisLock.current==="v")return;
    e.preventDefault();dragging.current=true;
    const W=trackRef.current?.parentElement?.offsetWidth||window.innerWidth;
    const base=idxRef.current*(100/3);
    let dp=(dx/(W*3))*100;
    if(dx>0&&idxRef.current===0)dp*=.15;
    if(dx<0&&idxRef.current===2)dp*=.15;
    if(trackRef.current){trackRef.current.style.transition="none";trackRef.current.style.transform=`translateX(-${base-dp}%)`;}
  };
  const onTE=e=>{
    if(tx0.current===null)return;
    const dx=e.changedTouches[0].clientX-tx0.current;tx0.current=null;
    if(!dragging.current||axisLock.current!=="h"){dragging.current=false;axisLock.current=null;return;}
    dragging.current=false;axisLock.current=null;
    const W=trackRef.current?.parentElement?.offsetWidth||window.innerWidth;
    if(Math.abs(dx)>W*0.22){if(dx<0)goTo(idxRef.current+1);else goTo(idxRef.current-1);}
    else{if(trackRef.current){trackRef.current.style.transition="transform 340ms cubic-bezier(0.16,1,0.3,1)";trackRef.current.style.transform=`translateX(-${idxRef.current*(100/3)}%)`;}}
  };

  /* calculations */
  const sumMeals=useCallback(p=>p.meals.reduce((a,b)=>a+Number(b||0),0),[]);
  const totMeals=useMemo(()=>people.reduce((a,p)=>a+sumMeals(p),0),[people,sumMeals]);
  const totMkt=useMemo(()=>people.reduce((a,p)=>a+Number(p.market||0),0),[people]);
  const rate=totMeals>0?totMkt/totMeals:0;
  const pStats=useMemo(()=>people.map((p,i)=>{const m=sumMeals(p),cost=m*rate,paid=Number(p.market||0);return{...p,m,cost,paid,bal:paid-cost,i};}),[people,rate,sumMeals]);
  const dayTots=useMemo(()=>Array.from({length:DAYS},(_,di)=>people.reduce((s,p)=>s+Number(p.meals[di]||0),0)),[people]);
  const totBills=useMemo(()=>bills.reduce((a,b)=>a+Number(b.amount||0),0),[bills]);

  const updMeal=(pi,di,v)=>setPeople(p=>p.map((x,i)=>i===pi?{...x,meals:x.meals.map((m,d)=>d===di?Math.max(0,Number(v)||0):m)}:x));
  const updMkt=(pi,v)=>setPeople(p=>p.map((x,i)=>i===pi?{...x,market:v}:x));
  const updName=(pi,v)=>setPeople(p=>p.map((x,i)=>i===pi?{...x,name:v}:x));
  const addPerson=()=>{const n=newPName.trim();if(!n)return;setPeople(p=>[...p,{name:n,market:"",meals:newMeals()}]);setNewPName("");setShowAddP(false);notify(`${n} added!`);};
  const delPerson=pi=>{if(people.length<=1)return notify("At least one member required","error");setPeople(p=>p.filter((_,i)=>i!==pi));setEditPerson(null);notify("Removed");};
  const updBill=(i,v)=>setBills(b=>b.map((x,idx)=>idx===i?{...x,amount:v}:x));
  const delBill=i=>{setBills(b=>b.filter((_,idx)=>idx!==i));notify("Removed");};
  const addBill=()=>{const n=newBillName.trim();if(!n)return;setBills(b=>[...b,{id:`c_${Date.now()}`,label:n,color:BLU,ik:"receipt",amount:"",custom:true}]);setNewBillName("");setShowAddBill(false);notify(`${n} added!`);};
  const resetAll=()=>{setPeople(p=>p.map(x=>({...x,market:"",meals:newMeals()})));setBills(mkBills());setShowReset(false);notify("Reset ✓");};

  /* shared styles */
  const cardBase={background:T.card,borderRadius:20,border:`1.5px solid ${T.brdDk}`,boxShadow:T.sh,overflow:"hidden",position:"relative"};
  const inpBase=(extra={})=>({width:"100%",padding:"12px 14px",borderRadius:12,border:`1.5px solid ${T.brd}`,outline:"none",fontSize:15,fontWeight:600,fontFamily:F,boxSizing:"border-box",background:T.inp,color:T.t1,transition:"border-color 180ms",...extra});
  const btnPri={padding:"13px 20px",borderRadius:12,border:"none",background:T.acc,color:"#fff",fontWeight:700,fontSize:14,fontFamily:F,cursor:"pointer",display:"inline-flex",alignItems:"center",justifyContent:"center",gap:8};
  const btnGhost={padding:"13px 20px",borderRadius:12,border:`1.5px solid ${T.brd}`,background:"transparent",color:T.t2,fontWeight:700,fontSize:14,fontFamily:F,cursor:"pointer",display:"inline-flex",alignItems:"center",justifyContent:"center",gap:8};

  /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     PANEL 0 — MEALS
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
  const mealsJSX=(
    <div style={{display:"flex",flexDirection:"column",gap:14}}>

      {/* ── Top stat row: Total Bazar + CalNote ── */}
      <div style={{display:"flex",gap:12,alignItems:"stretch"}}>

        {/* Total Bazar tile */}
        <div style={{...cardBase,flex:1,padding:"18px 16px 14px",minWidth:0}}>
          {/* Bauhaus geo – yellow quarter + blue rect like image 1 */}
          <GeoStack colors={[YEL,BLU]}/>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8,position:"relative"}}>
            <div style={{width:38,height:38,borderRadius:11,background:T.acc,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              <Ic k="cart" z={19} c="#fff"/>
            </div>
          </div>
          <div style={{fontSize:30,fontWeight:800,color:T.acc,fontFamily:F,letterSpacing:"-1px",lineHeight:1,position:"relative"}}>{totMkt.toFixed(0)}</div>
          <div style={{fontSize:9,fontWeight:800,color:T.t4,fontFamily:F,textTransform:"uppercase",letterSpacing:"0.12em",marginTop:5,position:"relative"}}>Total Bazar</div>
        </div>

        {/* CalNote tile */}
        <div onClick={()=>setShowCalNote(true)}
          style={{...cardBase,flex:1,padding:"18px 14px 14px",cursor:"pointer",minWidth:0}}
          onTouchStart={e=>e.currentTarget.style.opacity="0.78"} onTouchEnd={e=>e.currentTarget.style.opacity="1"}>
          {/* Cylinder+sphere decoration like image 1 reference */}
          <div style={{position:"absolute",right:6,bottom:6,pointerEvents:"none"}}>
            {/* cylinder body */}
            <div style={{width:22,height:38,borderRadius:11,background:YEL,position:"absolute",right:14,bottom:0,opacity:0.9}}/>
            {/* sphere */}
            <div style={{width:16,height:16,borderRadius:"50%",background:T.prp,position:"absolute",right:0,bottom:10,opacity:0.85}}/>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
            <div style={{width:38,height:38,borderRadius:11,background:T.prp,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              <Ic k="note" z={19} c="#fff"/>
            </div>
          </div>
          <div style={{fontSize:17,fontWeight:800,color:T.prp,fontFamily:F,letterSpacing:"-0.4px",lineHeight:1}}>CalNote</div>
          <div style={{fontSize:10,color:T.t3,fontFamily:FA,marginTop:4,letterSpacing:"0.01em"}}>নোট লিখুন সহজে</div>
        </div>
      </div>

      {/* ── Member cards ── */}
      {pStats.map((p,i)=>{
        const cp=BPAL[i%BPAL.length];
        const pos=p.bal>=0;
        return(
          <div key={i} style={{...cardBase}}>
            {/* Right-side geo strip matching image 1 */}
            <div style={{position:"absolute",right:0,top:0,bottom:0,width:20,pointerEvents:"none",overflow:"hidden"}}>
              <div style={{position:"absolute",top:0,right:0,width:20,height:"58%",background:cp.bg}}/>
              <div style={{position:"absolute",bottom:-16,right:-16,width:44,height:44,borderRadius:"50%",background:YEL}}/>
            </div>

            <div style={{padding:"16px 16px 0",paddingRight:28}}>
              {/* Header row */}
              <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:14}}>
                <Avatar name={p.name} ci={i} size={44}/>
                <div style={{flex:1,minWidth:0}}>
                  {editPerson===i
                    ?<input autoFocus value={p.name} onChange={e=>updName(i,e.target.value)} onBlur={()=>setEditPerson(null)} onKeyDown={e=>e.key==="Enter"&&setEditPerson(null)}
                        style={{border:"none",borderBottom:`2.5px solid ${cp.bg}`,outline:"none",fontWeight:800,fontSize:18,width:"100%",background:"transparent",color:T.t1,fontFamily:F,padding:"2px 0"}}/>
                    :<div onClick={()=>setEditPerson(i)} style={{display:"flex",alignItems:"center",gap:7,cursor:"pointer"}}>
                        <span style={{fontWeight:800,fontSize:18,color:T.t1,fontFamily:F,letterSpacing:"-0.4px"}}>{p.name}</span>
                        <Ic k="edit" z={14} c={T.t4}/>
                      </div>
                  }
                </div>
                <button onClick={()=>delPerson(i)} style={{width:32,height:32,borderRadius:9,background:T.cardAlt,border:`1.5px solid ${T.brd}`,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",flexShrink:0}}>
                  <Ic k="close" z={14} c={T.t3}/>
                </button>
              </div>

              {/* Bazar input */}
              <div style={{marginBottom:0}}>
                <div style={{fontSize:9,color:T.t4,fontWeight:800,letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:8,fontFamily:F}}>Bazar</div>
                <input type="number" min="0" value={p.market} onChange={e=>updMkt(i,e.target.value)} placeholder="0"
                  style={inpBase({
                    border:`1.5px solid ${p.market?cp.bg+"99":T.brd}`,
                    color:p.market?cp.bg:T.t3,
                    background:p.market?cp.bg+"0d":T.inp,
                    fontSize:26,fontWeight:800,padding:"12px 14px",letterSpacing:"-0.8px",
                  })}/>
              </div>
            </div>

            {/* Stats footer */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",marginTop:14,borderTop:`1.5px solid ${T.brd}`}}>
              {[
                {ik:"utensils",l:"MEALS",  v:String(p.m),       c:T.acc},
                {ik:"wallet",  l:"COST",   v:p.cost.toFixed(0), c:T.red},
                {ik:pos?"trendUp":"trendDn",l:"BALANCE",v:(pos?"+":"")+p.bal.toFixed(0),c:pos?T.grn:T.red},
              ].map((x,j)=>(
                <div key={j} style={{padding:"10px 8px",borderLeft:j>0?`1.5px solid ${T.brd}`:"none",textAlign:"center",background:j===2?(pos?"rgba(5,150,105,0.05)":"rgba(220,38,38,0.05)"):T.cardAlt}}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:4,marginBottom:4}}>
                    <Ic k={x.ik} z={13} c={x.c}/>
                    <span style={{fontSize:8,fontWeight:800,color:T.t4,fontFamily:F,textTransform:"uppercase",letterSpacing:"0.10em"}}>{x.l}</span>
                  </div>
                  <div style={{fontSize:20,fontWeight:800,color:x.c,fontFamily:F,letterSpacing:"-0.5px"}}>{x.v}</div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {/* Add member */}
      {showAddP
        ?<div style={{...cardBase,padding:18}}>
            <div style={{fontSize:9,color:T.t4,fontWeight:800,letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:12,fontFamily:F}}>New Member</div>
            <input autoFocus value={newPName} onChange={e=>setNewPName(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addPerson()} placeholder="Enter name…" style={{...inpBase(),marginBottom:12}}/>
            <div style={{display:"flex",gap:10}}>
              <button onClick={addPerson} style={{...btnPri,flex:1}}><Ic k="check" z={14} c="#fff"/>Add</button>
              <button onClick={()=>{setShowAddP(false);setNewPName("");}} style={{...btnGhost,flex:1}}>Cancel</button>
            </div>
          </div>
        :<div style={{display:"flex",gap:12,alignItems:"center"}}>
            <button onClick={()=>setShowAddP(true)} style={{
              flex:1,padding:"14px 18px",borderRadius:12,
              border:`2px dashed ${T.brdDk}`,background:"transparent",
              cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",
              gap:10,color:T.acc,fontWeight:700,fontSize:14,fontFamily:F,
            }}>
              <Ic k="plus" z={17} c={T.acc}/> ADD MEMBER
            </button>
            {/* Bauhaus stripe accent on right of add row (image 1) */}
            <div style={{width:44,height:44,borderRadius:10,flexShrink:0,background:T.yel,display:"flex",flexDirection:"column",gap:3,alignItems:"center",justifyContent:"center"}}>
              {[0,1,2].map(k=><div key={k} style={{width:26,height:3,borderRadius:2,background:T.dark?"#111":"#111"}}/>)}
            </div>
          </div>
      }

      {/* TABLE / CHART toggle + content */}
      <div style={{...cardBase}}>
        {/* Toggle row – matching image 1 exactly */}
        <div style={{display:"flex",position:"relative"}}>
          <button onClick={()=>setMealTab("table")} style={{
            flex:1,padding:"14px 0",border:"none",cursor:"pointer",fontWeight:800,
            fontSize:14,fontFamily:F,letterSpacing:"0.04em",
            background:mealTab==="table"?T.acc:T.cardAlt,
            color:mealTab==="table"?"#fff":T.t3,
            borderRadius:"18px 0 0 0",
            transition:"all 200ms",
          }}>TABLE</button>
          <button onClick={()=>setMealTab("pie")} style={{
            flex:1,padding:"14px 0",border:"none",cursor:"pointer",fontWeight:800,
            fontSize:14,fontFamily:F,letterSpacing:"0.04em",
            background:mealTab==="pie"?T.t1:T.cardAlt,
            color:mealTab==="pie"?T.card:T.t3,
            transition:"all 200ms",
          }}>CHART</button>
          {/* Bauhaus geo right corner — matching image 1 */}
          <div style={{width:72,height:48,overflow:"hidden",borderRadius:"0 18px 0 0",position:"relative",flexShrink:0}}>
            <div style={{position:"absolute",inset:0,background:YEL}}/>
            <div style={{position:"absolute",bottom:-18,left:-18,width:52,height:52,borderRadius:"50%",background:BLK}}/>
            <div style={{position:"absolute",top:0,left:0,width:24,height:"100%",background:RED}}/>
          </div>
        </div>

        {/* TABLE */}
        {mealTab==="table"&&(
          <div style={{overflowX:"auto",WebkitOverflowScrolling:"touch"}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:12,minWidth:Math.max(280,people.length*90+80)}}>
              <thead>
                <tr style={{background:T.cardAlt}}>
                  <th style={{padding:"10px 12px",textAlign:"center",fontWeight:800,color:T.t4,borderBottom:`1.5px solid ${T.brd}`,fontSize:9,textTransform:"uppercase",letterSpacing:"0.10em",fontFamily:F,width:36}}>#</th>
                  {people.map((p,i)=>(
                    <th key={i} style={{padding:"10px 8px",borderBottom:`1.5px solid ${T.brd}`,minWidth:76}}>
                      <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
                        <Avatar name={p.name} ci={i} size={20}/>
                        <span style={{fontWeight:700,color:T.t1,fontSize:11,fontFamily:F,whiteSpace:"nowrap"}}>{p.name}</span>
                      </div>
                    </th>
                  ))}
                  <th style={{padding:"10px 8px",borderBottom:`1.5px solid ${T.brd}`,fontSize:11,fontWeight:800,color:T.t4,fontFamily:F,minWidth:44,textAlign:"center"}}>Σ</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({length:DAYS},(_,di)=>{
                  const dt=dayTots[di],hl=hlDay===di;
                  return(
                    <tr key={di} onMouseEnter={()=>setHlDay(di)} onMouseLeave={()=>setHlDay(null)}
                      style={{background:hl?`${T.acc}0f`:"transparent",borderBottom:`1px solid ${T.brd}`,transition:"background 100ms"}}>
                      <td style={{padding:"5px 10px",fontWeight:700,color:T.t4,fontSize:11,fontFamily:F,textAlign:"center"}}>{di+1}</td>
                      {people.map((p,pi)=>{
                        const cp=BPAL[pi%BPAL.length];const v=p.meals[di]||0;
                        return(
                          <td key={pi} style={{padding:"4px 5px",textAlign:"center"}}>
                            <input type="number" min={0} value={v===0?"":v}
                              onChange={e=>updMeal(pi,di,e.target.value)}
                              onBlur={e=>{if(e.target.value==="")updMeal(pi,di,0);}}
                              placeholder="0"
                              style={{width:52,padding:"6px 3px",borderRadius:8,textAlign:"center",
                                fontWeight:v>0?800:400,color:v>0?cp.bg:T.t4,
                                background:v>0?cp.bg+"12":T.inp,
                                border:`1.5px solid ${v>0?cp.bg+"66":T.brd}`,
                                outline:"none",fontSize:13,fontFamily:F,transition:"all 120ms",
                              }}/>
                          </td>
                        );
                      })}
                      <td style={{padding:"5px 10px",textAlign:"center"}}>
                        {dt>0
                          ?<span style={{background:T.acc,color:"#fff",borderRadius:6,padding:"2px 10px",fontWeight:800,fontSize:12,fontFamily:F}}>{dt}</span>
                          :<span style={{color:T.brd}}>—</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr style={{background:`${T.acc}0f`,borderTop:`2px solid ${T.acc}`}}>
                  <td style={{padding:"10px 12px",fontWeight:800,color:T.acc,fontSize:9,textTransform:"uppercase",letterSpacing:"0.10em",fontFamily:F,textAlign:"center"}}>Σ</td>
                  {pStats.map((p,i)=>{
                    const cp=BPAL[i%BPAL.length];
                    return<td key={i} style={{padding:"10px 5px",textAlign:"center"}}>
                      <span style={{background:cp.bg,color:cp.txt,borderRadius:6,padding:"3px 12px",fontWeight:800,fontSize:13,fontFamily:F}}>{p.m}</span>
                    </td>;
                  })}
                  <td style={{padding:"10px",textAlign:"center",fontWeight:800,color:T.acc,fontSize:16,fontFamily:F}}>{totMeals}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {/* CHART */}
        {mealTab==="pie"&&(()=>{
          const slices=pStats.map((p,i)=>({name:p.name,meals:p.m,col:BPAL[i%BPAL.length].bg,ci:i})).filter(s=>s.meals>0);
          const tot=slices.reduce((a,s)=>a+s.meals,0);
          const R=78,r=46,cx=100,cy=100;let sa=-Math.PI/2;
          const arcs=slices.map(s=>{
            const pct=s.meals/tot,end=sa+pct*2*Math.PI;
            const x1=cx+R*Math.cos(sa),y1=cy+R*Math.sin(sa),x2=cx+R*Math.cos(end),y2=cy+R*Math.sin(end);
            const ix1=cx+r*Math.cos(sa),iy1=cy+r*Math.sin(sa),ix2=cx+r*Math.cos(end),iy2=cy+r*Math.sin(end);
            const large=pct>0.5?1:0;
            const d=`M${x1},${y1} A${R},${R} 0 ${large},1 ${x2},${y2} L${ix2},${iy2} A${r},${r} 0 ${large},0 ${ix1},${iy1} Z`;
            sa=end;return{...s,d,pct};
          });
          return(
            <div style={{padding:"18px"}}>
              {tot===0
                ?<div style={{textAlign:"center",padding:"28px 0",color:T.t4,fontFamily:F,fontSize:14}}>No meals recorded yet</div>
                :<>
                  <div style={{display:"flex",justifyContent:"center",marginBottom:18}}>
                    <svg viewBox="0 0 200 200" width="190" height="190">
                      {arcs.map((a,i)=><path key={i} d={a.d} fill={a.col}/>)}
                      <text x="100" y="96" textAnchor="middle" fill={T.t1} fontSize="28" fontWeight="800" fontFamily="Outfit,sans-serif">{tot}</text>
                      <text x="100" y="114" textAnchor="middle" fill={T.t4} fontSize="10" fontWeight="700" fontFamily="Outfit,sans-serif" letterSpacing="2">MEALS</text>
                    </svg>
                  </div>
                  <div style={{display:"flex",flexDirection:"column",gap:8}}>
                    {arcs.map((a,i)=>(
                      <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",background:T.cardAlt,borderRadius:10,border:`1.5px solid ${T.brd}`}}>
                        <div style={{width:10,height:10,borderRadius:3,background:a.col,flexShrink:0}}/>
                        <div style={{display:"flex",alignItems:"center",gap:8,flex:1,minWidth:0}}>
                          <Avatar name={a.name} ci={a.ci} size={26}/>
                          <span style={{fontWeight:700,fontSize:13,color:T.t1,fontFamily:F,flex:1,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{a.name}</span>
                        </div>
                        <div style={{textAlign:"right",flexShrink:0}}>
                          <span style={{fontSize:18,fontWeight:800,color:a.col,fontFamily:F,letterSpacing:"-0.5px"}}>{a.meals}</span>
                          <span style={{fontSize:10,color:T.t4,fontFamily:F,marginLeft:4}}>{(a.pct*100).toFixed(1)}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              }
            </div>
          );
        })()}
      </div>
    </div>
  );

  /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     PANEL 1 — BILLS
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
  const billsJSX=(
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      {/* Stats row */}
      <div style={{display:"flex",gap:12}}>
        <div style={{...cardBase,flex:1,padding:"18px 16px 14px",minWidth:0}}>
          <GeoStack colors={[RED,BLU]}/>
          <div style={{width:38,height:38,borderRadius:11,background:T.red,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:8}}>
            <Ic k="receipt" z={19} c="#fff"/>
          </div>
          <div style={{fontSize:28,fontWeight:800,color:T.red,fontFamily:F,letterSpacing:"-1px",lineHeight:1,position:"relative"}}>{totBills.toFixed(0)}</div>
          <div style={{fontSize:9,fontWeight:800,color:T.t4,fontFamily:F,textTransform:"uppercase",letterSpacing:"0.12em",marginTop:5,position:"relative"}}>Total Bills</div>
        </div>
        <div style={{...cardBase,flex:1,padding:"18px 16px 14px",minWidth:0}}>
          <GeoStack colors={[YEL,BLK]}/>
          <div style={{width:38,height:38,borderRadius:11,background:T.acc,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:8}}>
            <Ic k="user" z={19} c="#fff"/>
          </div>
          <div style={{fontSize:28,fontWeight:800,color:T.acc,fontFamily:F,letterSpacing:"-1px",lineHeight:1,position:"relative"}}>{(people.length?totBills/people.length:0).toFixed(0)}</div>
          <div style={{fontSize:9,fontWeight:800,color:T.t4,fontFamily:F,textTransform:"uppercase",letterSpacing:"0.12em",marginTop:5,position:"relative"}}>Per Person</div>
        </div>
      </div>

      {/* Bill items */}
      {bills.map((b,i)=>(
        <div key={b.id} style={{...cardBase}}>
          {/* colored left bar */}
          <div style={{position:"absolute",left:0,top:0,bottom:0,width:5,background:b.color,borderRadius:"0 0 0 18px"}}/>
          <div style={{padding:"14px 14px 14px 18px",display:"flex",alignItems:"center",gap:12}}>
            <div style={{width:42,height:42,borderRadius:12,background:b.color,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              <Ic k={b.ik||"receipt"} z={20} c="#fff"/>
            </div>
            <span style={{fontWeight:700,fontSize:14,color:T.t1,fontFamily:F,flexShrink:0,maxWidth:"32%",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{b.label}</span>
            <input type="number" min="0" value={b.amount} onChange={e=>updBill(i,e.target.value)} placeholder="0"
              style={inpBase({
                flex:1,minWidth:0,
                border:`1.5px solid ${b.amount?b.color+"88":T.brd}`,
                color:b.amount?b.color:T.t3,
                background:b.amount?b.color+"0d":T.inp,
                fontSize:20,fontWeight:800,padding:"10px 12px",letterSpacing:"-0.5px",
              })}/>
            {b.custom&&(
              <button onClick={()=>delBill(i)} style={{width:32,height:32,borderRadius:9,border:`1.5px solid ${T.brd}`,background:"transparent",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",flexShrink:0}}>
                <Ic k="trash" z={14} c={T.red}/>
              </button>
            )}
          </div>
        </div>
      ))}

      {showAddBill
        ?<div style={{...cardBase,padding:18}}>
            <div style={{fontSize:9,color:T.t4,fontWeight:800,letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:12,fontFamily:F}}>New Bill</div>
            <input autoFocus value={newBillName} onChange={e=>setNewBillName(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addBill()} placeholder="Bill name…" style={{...inpBase(),marginBottom:12}}/>
            <div style={{display:"flex",gap:10}}>
              <button onClick={addBill} style={{...btnPri,flex:1}}><Ic k="check" z={14} c="#fff"/>Add Bill</button>
              <button onClick={()=>{setShowAddBill(false);setNewBillName("");}} style={{...btnGhost,flex:1}}>Cancel</button>
            </div>
          </div>
        :<button onClick={()=>setShowAddBill(true)} style={{
            width:"100%",padding:"14px 18px",borderRadius:12,
            border:`2px dashed ${T.brdDk}`,background:"transparent",
            cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",
            gap:10,color:T.red,fontWeight:700,fontSize:14,fontFamily:F,
          }}>
            <Ic k="plus" z={17} c={T.red}/> ADD NEW BILL
          </button>
      }
    </div>
  );

  /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     PANEL 2 — SUMMARY
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
  const summaryJSX=(
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      {/* 2×2 metric grid */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        {[
          {ik:"cart",   v:totMkt.toFixed(0),                          l:"Bazar",   c:T.acc, geo:[YEL,BLU]},
          {ik:"receipt",v:totBills.toFixed(0),                        l:"Bills",   c:T.red, geo:[RED,BLK]},
          {ik:"rate",   v:rate.toFixed(2),                            l:"Rate",    c:T.org, geo:[YEL,RED]},
          {ik:"users",  v:String(people.length),                      l:"Members", c:T.grn, geo:[YEL,BLU]},
        ].map((m,i)=>(
          <div key={i} style={{...cardBase,padding:"16px 14px 14px"}}>
            <GeoStack colors={m.geo}/>
            <div style={{width:36,height:36,borderRadius:10,background:m.c,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:8}}>
              <Ic k={m.ik} z={17} c="#fff"/>
            </div>
            <div style={{fontSize:26,fontWeight:800,color:m.c,fontFamily:F,letterSpacing:"-0.8px",lineHeight:1,position:"relative"}}>{m.v}</div>
            <div style={{fontSize:9,fontWeight:800,color:T.t4,fontFamily:F,textTransform:"uppercase",letterSpacing:"0.11em",marginTop:5,position:"relative"}}>{m.l}</div>
          </div>
        ))}
      </div>

      {/* Meal breakdown */}
      <div style={{fontSize:9,fontWeight:800,color:T.t3,fontFamily:F,textTransform:"uppercase",letterSpacing:"0.12em",display:"flex",alignItems:"center",gap:8}}>
        <div style={{width:4,height:14,borderRadius:2,background:YEL}}/>MEAL BREAKDOWN
      </div>
      <div style={{...cardBase}}>
        <div style={{overflowX:"auto",WebkitOverflowScrolling:"touch"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
            <thead>
              <tr style={{background:T.cardAlt}}>
                {["Person","Meals","Rate","Cost","Bal"].map((h,idx)=>(
                  <th key={h} style={{padding:"10px 10px",textAlign:idx===0?"left":"center",fontWeight:800,color:T.t4,borderBottom:`1.5px solid ${T.brd}`,fontSize:9,textTransform:"uppercase",letterSpacing:"0.10em",fontFamily:F,whiteSpace:"nowrap"}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pStats.map((p,i)=>{
                const pos=p.bal>=0;
                return(
                  <tr key={i} style={{borderBottom:`1px solid ${T.brd}`}}>
                    <td style={{padding:"11px 10px"}}>
                      <div style={{display:"flex",alignItems:"center",gap:8}}>
                        <Avatar name={p.name} ci={i} size={24}/>
                        <span style={{fontWeight:700,color:T.t1,fontFamily:F,fontSize:12,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",maxWidth:65}}>{p.name}</span>
                      </div>
                    </td>
                    <td style={{textAlign:"center",padding:"11px 8px",fontWeight:800,color:T.t1,fontFamily:F,fontSize:15}}>{p.m}</td>
                    <td style={{textAlign:"center",padding:"11px 8px",fontWeight:500,color:T.t3,fontFamily:F,fontSize:11}}>{rate.toFixed(1)}</td>
                    <td style={{textAlign:"center",padding:"11px 8px",fontWeight:700,color:T.red,fontFamily:F,fontSize:13}}>{p.cost.toFixed(0)}</td>
                    <td style={{textAlign:"center",padding:"11px 8px"}}>
                      <span style={{fontWeight:800,fontSize:13,color:pos?T.grn:T.red,fontFamily:F}}>{pos?"+":""}{p.bal.toFixed(0)}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{background:`${T.acc}0d`,borderTop:`2px solid ${T.acc}`}}>
                <td style={{padding:"10px 12px",fontWeight:800,color:T.acc,fontSize:9,textTransform:"uppercase",letterSpacing:"0.10em",fontFamily:F}}>Total</td>
                <td style={{textAlign:"center",padding:"10px",fontWeight:800,color:T.acc,fontFamily:F,fontSize:16}}>{totMeals}</td>
                <td/><td style={{textAlign:"center",padding:"10px",fontWeight:700,color:T.red,fontFamily:F}}>{(rate*totMeals).toFixed(0)}</td><td/>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Settlement */}
      <div style={{fontSize:9,fontWeight:800,color:T.t3,fontFamily:F,textTransform:"uppercase",letterSpacing:"0.12em",display:"flex",alignItems:"center",gap:8}}>
        <div style={{width:4,height:14,borderRadius:2,background:RED}}/>SETTLEMENT
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {pStats.filter(p=>p.bal<-0.01).flatMap(debtor=>
          pStats.filter(p=>p.bal>0.01).map((creditor,j)=>(
            <div key={`${debtor.i}-${j}`} style={{...cardBase,padding:"14px 16px"}}>
              <div style={{position:"absolute",left:0,top:0,bottom:0,width:5,background:YEL,borderRadius:"18px 0 0 18px"}}/>
              <div style={{paddingLeft:8,display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
                <Avatar name={debtor.name} ci={debtor.i} size={30}/>
                <span style={{fontWeight:700,color:T.t1,fontFamily:F,fontSize:13}}>{debtor.name}</span>
                <div style={{width:28,height:28,borderRadius:8,background:T.yel,display:"flex",alignItems:"center",justifyContent:"center"}}>
                  <Ic k="arrow" z={13} c="#111"/>
                </div>
                <Avatar name={creditor.name} ci={creditor.i} size={30}/>
                <span style={{fontWeight:700,color:T.t1,fontFamily:F,fontSize:13}}>{creditor.name}</span>
                <div style={{marginLeft:"auto",background:T.t1,borderRadius:8,padding:"5px 14px"}}>
                  <span style={{fontWeight:800,color:T.card,fontSize:16,fontFamily:F,letterSpacing:"-0.5px"}}>{Math.min(Math.abs(debtor.bal),creditor.bal).toFixed(2)}</span>
                </div>
              </div>
            </div>
          ))
        )}
        {!pStats.some(p=>p.bal<-0.01)&&(
          <div style={{...cardBase,padding:"14px 18px",background:T.grn+"10",border:`1.5px solid ${T.grn}`,display:"flex",alignItems:"center",gap:12}}>
            <div style={{width:36,height:36,borderRadius:10,background:T.grn,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              <Ic k="allchk" z={18} c="#fff"/>
            </div>
            <span style={{color:T.grn,fontWeight:800,fontSize:15,fontFamily:F}}>All settled up!</span>
          </div>
        )}
      </div>

      {/* Bill details */}
      {bills.some(b=>b.amount)&&<>
        <div style={{fontSize:9,fontWeight:800,color:T.t3,fontFamily:F,textTransform:"uppercase",letterSpacing:"0.12em",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}><div style={{width:4,height:14,borderRadius:2,background:BLU}}/>BILL DETAILS</div>
          <span style={{fontWeight:800,fontSize:16,color:T.red,fontFamily:F,letterSpacing:"-0.4px"}}>{totBills.toFixed(2)}</span>
        </div>
        <div style={{...cardBase}}>
          <div style={{padding:"8px 16px 14px"}}>
            {bills.filter(b=>b.amount).map((b,i,arr)=>(
              <div key={b.id} style={{display:"flex",alignItems:"center",gap:12,padding:"11px 0",borderBottom:i<arr.length-1?`1px solid ${T.brd}`:"none"}}>
                <div style={{width:34,height:34,borderRadius:10,background:b.color,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                  <Ic k={b.ik||"receipt"} z={16} c="#fff"/>
                </div>
                <span style={{fontWeight:600,flex:1,color:T.t1,fontFamily:F,fontSize:14}}>{b.label}</span>
                <div style={{background:b.color,borderRadius:8,padding:"4px 12px"}}>
                  <span style={{fontWeight:800,color:"#fff",fontSize:14,fontFamily:F}}>{Number(b.amount).toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </>}
    </div>
  );

  /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     ROOT RENDER
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
  const TABS=[
    {l:"MEALS",   ik:"utensils", acc:T.acc},
    {l:"BILLS",   ik:"receipt",  acc:T.red},
    {l:"SUMMARY", ik:"chart",    acc:T.grn},
  ];

  return(
    <div style={{height:"100dvh",display:"flex",flexDirection:"column",fontFamily:F,color:T.t1,overflow:"hidden",background:T.pg}}>

      {toast&&<Toast msg={toast.msg} type={toast.type}/>}
      {showCalNote&&<CalNoteApp onClose={()=>setShowCalNote(false)} T={T}/>}
      {showReset&&<ConfirmSheet title="Reset month?" body="All meals and bill amounts will be cleared. This cannot be undone." onOk={resetAll} onClose={()=>setShowReset(false)} T={T}/>}

      {/* ── HEADER ── */}
      <div style={{
        flexShrink:0,background:T.nav,
        borderBottom:`1.5px solid ${T.brdDk}`,
        padding:"0 18px",height:56,
        display:"flex",alignItems:"center",justifyContent:"space-between",
        position:"relative",zIndex:50,
      }}>
        <span style={{fontSize:20,fontWeight:800,color:T.t1,fontFamily:F,letterSpacing:"-0.6px"}}>Pennywise</span>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontSize:12,fontWeight:700,color:T.t2,fontFamily:F,letterSpacing:"0.02em",whiteSpace:"nowrap",textTransform:"uppercase"}}>
            {new Date().toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric"}).toUpperCase()}
          </span>
          <button onClick={()=>setDark(d=>!d)} style={{width:34,height:34,borderRadius:10,border:`1.5px solid ${T.brd}`,background:T.cardAlt,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}>
            <Ic k={dark?"sun":"moon"} z={16} c={dark?YEL:T.t2}/>
          </button>
          <button onClick={()=>setShowReset(true)} style={{width:34,height:34,borderRadius:10,border:"none",background:T.red,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",boxShadow:`0 3px 10px ${T.red}55`}}>
            <Ic k="reset" z={15} c="#fff"/>
          </button>
        </div>
      </div>

      {/* ── PANEL TRACK ── */}
      <div style={{flex:1,overflow:"hidden",position:"relative",zIndex:1}} onTouchStart={onTS} onTouchMove={onTM} onTouchEnd={onTE}>
        <div ref={trackRef} style={{display:"flex",width:"300%",height:"100%",willChange:"transform",transform:"translateX(0%)",transition:"transform 260ms cubic-bezier(0.4,0,0.2,1)"}}>
          {[mealsJSX,billsJSX,summaryJSX].map((jsx,i)=>(
            <div key={i} ref={[panel0,panel1,panel2][i]} style={{width:"33.333%",height:"100%",overflowY:"auto",overflowX:"hidden",WebkitOverflowScrolling:"touch"}}>
              <div style={{padding:"16px 16px 108px"}}>{jsx}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── BOTTOM NAV ── */}
      <div style={{
        position:"fixed",bottom:0,left:0,right:0,zIndex:100,
        background:T.nav,
        borderTop:`1.5px solid ${T.brdDk}`,
      }}>
        {/* Active colour bar */}
        <div style={{height:3,position:"relative"}}>
          <div style={{
            position:"absolute",top:0,height:3,
            width:`${100/3}%`,left:`${pageIdx*(100/3)}%`,
            background:TABS[pageIdx].acc,
            transition:"left 260ms cubic-bezier(0.4,0,0.2,1), background 200ms",
          }}/>
        </div>
        <div style={{display:"flex",paddingBottom:"max(10px,env(safe-area-inset-bottom))"}}>
          {TABS.map((tab,i)=>{
            const active=pageIdx===i;
            return(
              <button key={i} onClick={()=>goTo(i)} style={{
                flex:1,paddingTop:10,paddingBottom:8,border:"none",background:"transparent",
                cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:4,
              }}>
                <div style={{
                  width:44,height:32,borderRadius:10,
                  background:active?`${tab.acc}18`:"transparent",
                  display:"flex",alignItems:"center",justifyContent:"center",
                  transition:"background 200ms",
                }}>
                  <Ic k={tab.ik} z={22} c={active?tab.acc:T.t4}/>
                </div>
                <span style={{
                  fontSize:10,fontWeight:active?800:600,letterSpacing:"0.06em",
                  color:active?tab.acc:T.t4,fontFamily:F,lineHeight:1,
                  transition:"color 200ms",
                }}>{tab.l}</span>
              </button>
            );
          })}
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        html,body,#root{height:100%;overflow:hidden;}
        body{-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility;}
        input,select,button,td,th,span,div,p,h1,h2,h3,label{font-family:'Outfit',sans-serif!important;}
        input[type=number]::-webkit-inner-spin-button{-webkit-appearance:none;}
        input:focus{border-color:${T.acc}!important;box-shadow:0 0 0 3px ${T.acc}22!important;outline:none!important;}
        button{-webkit-tap-highlight-color:transparent;outline:none!important;cursor:pointer;}
        button:active{opacity:0.78!important;transform:scale(0.95)!important;}
        a{-webkit-tap-highlight-color:transparent;}
        ::-webkit-scrollbar{width:2px;height:2px;}
        ::-webkit-scrollbar-thumb{background:${T.brdDk};border-radius:4px;}
        ::-webkit-scrollbar-track{background:transparent;}
        @keyframes toastIn{from{opacity:0;transform:translateX(-50%) translateY(10px);}to{opacity:1;transform:translateX(-50%) translateY(0);}}
        @keyframes modalIn{from{opacity:0;transform:scale(0.90) translateY(14px);}to{opacity:1;transform:scale(1) translateY(0);}}
        @keyframes slideUp{from{transform:translateY(100%);opacity:0;}to{transform:translateY(0);opacity:1;}}
        @media(prefers-reduced-motion:reduce){*{transition:none!important;animation:none!important;}}
        svg,svg *{transition:none!important;}
      `}</style>
    </div>
  );
}