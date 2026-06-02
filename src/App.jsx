import { useEffect, useState, useMemo, useCallback, useRef } from "react";

// ─── IndexedDB ───────────────────────────────────────────────
const DB = "pennywise_v6";
const ST = "d";
const odb = () => new Promise((res, rej) => { const r = indexedDB.open(DB, 1); r.onupgradeneeded = () => { if (!r.result.objectStoreNames.contains(ST)) r.result.createObjectStore(ST); }; r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
const iSet = async (k, v) => { const db = await odb(); const tx = db.transaction(ST, "readwrite"); tx.objectStore(ST).put(v, k); return new Promise((res, rej) => { tx.oncomplete = res; tx.onerror = rej; }); };
const iGet = async k => { const db = await odb(); return new Promise(res => { const r = db.transaction(ST, "readonly").objectStore(ST).get(k); r.onsuccess = () => res(r.result ?? null); r.onerror = () => res(null); }); };

// ─── Constants ──────────────────────────────────────────────
const DAYS = 30;
const newMeals = () => Array(DAYS).fill(0);
const F = "'Cause','Outfit','DM Sans',sans-serif";

const FIXED_BILLS = [
  { id: "rent", label: "Rent", color: "#a78bfa", ik: "home" },
  { id: "svc", label: "Service Charge", color: "#94a3b8", ik: "wrench" },
  { id: "elec", label: "Electricity", color: "#f59e0b", ik: "bolt" },
  { id: "gas", label: "Gas", color: "#ef4444", ik: "flame" },
  { id: "net", label: "Internet", color: "#818cf8", ik: "wifi" },
  { id: "bua", label: "Bua", color: "#34d399", ik: "broom" },
];
const mkBills = () => FIXED_BILLS.map(b => ({ ...b, amount: "", custom: false }));

const PAL = [
  { bg: "#7c3aed", dl: "rgba(167,139,250,.15)", dt: "#c4b5fd", ll: "#f5f3ff", lt: "#6d28d9", gr: "linear-gradient(135deg,#7c3aed,#a855f7)" },
  { bg: "#0284c7", dl: "rgba(56,189,248,.15)", dt: "#7dd3fc", ll: "#e0f2fe", lt: "#0369a1", gr: "linear-gradient(135deg,#0284c7,#38bdf8)" },
  { bg: "#059669", dl: "rgba(52,211,153,.15)", dt: "#6ee7b7", ll: "#d1fae5", lt: "#047857", gr: "linear-gradient(135deg,#059669,#34d399)" },
  { bg: "#d97706", dl: "rgba(251,191,36,.15)", dt: "#fcd34d", ll: "#fef3c7", lt: "#b45309", gr: "linear-gradient(135deg,#d97706,#fbbf24)" },
  { bg: "#dc2626", dl: "rgba(248,113,113,.15)", dt: "#fca5a5", ll: "#fee2e2", lt: "#b91c1c", gr: "linear-gradient(135deg,#dc2626,#f87171)" },
  { bg: "#0f766e", dl: "rgba(45,212,191,.15)", dt: "#5eead4", ll: "#ccfbf1", lt: "#0f766e", gr: "linear-gradient(135deg,#0f766e,#2dd4bf)" },
];

function mkTheme(dark) {
  return dark ? {
    dark: true, bg: "#0d0d11", sur: "#16161d", sur2: "#1c1c26",
    brd: "#27273a", brd2: "#32324a",
    txt: "#f0effe", sub: "#8887a8", mut: "#50506a",
    acc: "#a78bfa", accBg: "rgba(167,139,250,.10)",
    grn: "#34d399", red: "#f87171", amb: "#fbbf24", sky: "#38bdf8",
  } : {
    dark: false, bg: "#f4f4f8", sur: "#ffffff", sur2: "#f8f8fc",
    brd: "#e8e8f0", brd2: "#dcdcec",
    txt: "#0f0f1a", sub: "#5c5c7a", mut: "#9898b8",
    acc: "#7c3aed", accBg: "rgba(124,58,237,.07)",
    grn: "#059669", red: "#dc2626", amb: "#d97706", sky: "#0284c7",
  };
}

// ─── SVG Icons ───────────────────────────────────────────────
function Ic({ k, z = 18, c = "currentColor" }) {
  const s = { width: z, height: z, display: "inline-flex", flexShrink: 0, verticalAlign: "middle" };
  const P = {
    utensils: <svg viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={s}><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 002-2V2" /><path d="M7 2v20" /><path d="M21 15V2a5 5 0 00-5 5v6c0 1.1.9 2 2 2h3zm0 0v7" /></svg>,
    receipt: <svg viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={s}><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1z" /><path d="M9 7h6M9 11h6M9 15h4" /></svg>,
    chart: <svg viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={s}><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>,
    home: <svg viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={s}><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><polyline points="9,22 9,12 15,12 15,22" /></svg>,
    sun: <svg viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={s}><circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" /></svg>,
    moon: <svg viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={s}><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" /></svg>,
    reset: <svg viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={s}><polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 102.13-9.36L1 10" /></svg>,
    close: <svg viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" style={s}><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>,
    edit: <svg viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={s}><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>,
    trash: <svg viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={s}><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" /><path d="M10 11v6M14 11v6M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" /></svg>,
    check: <svg viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={s}><polyline points="20 6 9 17 4 12" /></svg>,
    plus: <svg viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" style={s}><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>,
    users: <svg viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={s}><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" /></svg>,
    user: <svg viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={s}><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>,
    warn: <svg viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={s}><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>,
    calendar: <svg viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={s}><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>,
    arrow: <svg viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={s}><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>,
    cart: <svg viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={s}><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" /></svg>,
    rate: <svg viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={s}><polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /><polyline points="16 7 22 7 22 13" /></svg>,
    settle: <svg viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={s}><path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" /></svg>,
    allchk: <svg viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={s}><polyline points="20 6 9 17 4 12" /></svg>,
    note: <svg viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={s}><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>,
    bolt: <svg viewBox="0 0 24 24" fill={c} stroke="none" style={s}><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>,
    flame: <svg viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={s}><path d="M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 11-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 002.5 3z" /></svg>,
    wifi: <svg viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={s}><path d="M1.42 9a16 16 0 0121.16 0" /><path d="M5 12.55a11 11 0 0114.08 0" /><path d="M10.54 16.1a6 6 0 012.92 0" /><line x1="12" y1="20" x2="12.01" y2="20" /></svg>,
    wrench: <svg viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={s}><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" /></svg>,
    broom: <svg viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={s}><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10" /><path d="M12 12l8.5-8.5M17.5 6.5L12 12" /></svg>,
  };
  return P[k] || P["receipt"];
}

function Avatar({ name, ci, size = 36 }) {
  const p = PAL[ci % PAL.length];
  const ini = (name || "?").split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) || "?";
  return <div style={{ width: size, height: size, borderRadius: "50%", background: p.gr, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: size * .38, flexShrink: 0, fontFamily: F, boxShadow: `0 2px 8px ${p.bg}44` }}>{ini}</div>;
}

function Toast({ msg, type }) {
  return <div style={{ position: "fixed", bottom: 88, left: "50%", transform: "translateX(-50%)", background: type === "error" ? "linear-gradient(135deg,#dc2626,#ef4444)" : "linear-gradient(135deg,#059669,#34d399)", color: "#fff", padding: "11px 24px", borderRadius: 14, fontWeight: 700, fontSize: 14, zIndex: 9999, fontFamily: F, boxShadow: "0 8px 28px rgba(0,0,0,0.4)", animation: "tin .2s ease", whiteSpace: "nowrap", pointerEvents: "none" }}>{msg}</div>;
}

function ConfirmSheet({ title, body, onOk, onClose, T }) {
  return (
    <div onClick={e => e.target === e.currentTarget && onClose()} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.6)", zIndex: 1000, backdropFilter: "blur(6px)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div style={{ background: T.sur, borderRadius: "20px 20px 0 0", width: "100%", maxWidth: 520, padding: "16px 20px 32px", border: `1px solid ${T.brd2}`, boxShadow: "0 -8px 32px rgba(0,0,0,.4)" }}>
        <div style={{ width: 40, height: 4, borderRadius: 2, background: T.brd2, margin: "0 auto 16px" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <Ic k="warn" z={20} c={T.red} /><span style={{ fontWeight: 800, fontSize: 17, color: T.txt, fontFamily: F }}>{title}</span>
        </div>
        <p style={{ color: T.sub, lineHeight: 1.7, marginBottom: 20, fontSize: 14, fontFamily: F }}>{body}</p>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: "12px", borderRadius: 12, border: `1px solid ${T.brd2}`, background: T.sur2, color: T.sub, fontWeight: 700, fontSize: 14, fontFamily: F, cursor: "pointer" }}>Cancel</button>
          <button onClick={onOk} style={{ flex: 1, padding: "12px", borderRadius: 12, border: "none", background: "linear-gradient(135deg,#dc2626,#ef4444)", color: "#fff", fontWeight: 700, fontSize: 14, fontFamily: F, cursor: "pointer", boxShadow: "0 4px 14px rgba(220,38,38,.35)" }}>
            <Ic k="reset" z={14} c="#fff" /> Reset
          </button>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════

// ─── CalNote helpers ─────────────────────────────────────────
const BN2 = "০১২৩৪৫৬৭৮৯";
const toBn2 = n => String(n).replace(/\d/g, d => BN2[d]);
const toEn2 = s => String(s)
  .replace(/[০-৯]/g, d => String(BN2.indexOf(d)))
  .replace(/×/g, "*").replace(/÷/g, "/").replace(/−/g, "-");

function cnSafeCalc(expr) {
  const clean = toEn2(expr).replace(/[^0-9+\-*/.() ]/g, "").trim();
  if (!clean) return null;
  try {
    // eslint-disable-next-line no-useless-escape
    const tokens = clean.match(/(\d+\.?\d*)|([+\-*\/()])/) ? clean.match(/(\d+\.?\d*)|([+\-*\/()])/g) : null;
    if (!tokens) return null;
    let i = 0;
    const peek = () => tokens[i], consume = () => tokens[i++];
    const parseNum = () => { const t = consume(); if (t === "(") { const v = cnAdd(); consume(); return v; } return t === undefined ? 0 : parseFloat(t); };
    const cnMul = () => { let v = parseNum(); while (peek() === "*" || peek() === "/") { const op = consume(), r = parseNum(); v = op === "*" ? v * r : r !== 0 ? v / r : NaN; } return v; };
    const cnAdd = () => { let v = cnMul(); while (peek() === "+" || peek() === "-") { const op = consume(), r = cnMul(); v = op === "+" ? v + r : v - r; } return v; };
    const result = cnAdd(); return isFinite(result) ? result : null;
  } catch { return null; }
}
function cnEvalLine(raw) {
  const en = toEn2(raw);
  // eslint-disable-next-line no-useless-escape
  if (/[+\-*\/]/.test(en)) return cnSafeCalc(en);
  const m = en.match(/-?\d+(\.\d+)?/); return m ? parseFloat(m[0]) : null;
}
function cnCalcTotal(arr) { let s = 0; arr.forEach(l => { const v = cnEvalLine(l); if (v !== null && !isNaN(v)) s += v; }); return s; }
function cnFmtNum(n) {
  if (n === null || isNaN(n)) return "";
  const sign = n < 0 ? "−" : "", abs = Math.abs(n);
  const str = Number.isInteger(abs) ? String(abs) : abs.toFixed(4).replace(/\.?0+$/, "");
  return sign + toBn2(str);
}
const CN_KEY = "calnote_pw1";
const cnLoad = () => { try { const r = localStorage.getItem(CN_KEY); return r ? JSON.parse(r) : null; } catch { return null; } };
const cnSave = o => { try { localStorage.setItem(CN_KEY, JSON.stringify(o)); } catch { /* ignore */ } };
function CalNoteApp({ onClose, dark }) {
  const saved = cnLoad();
  const [title, setTitle] = useState(saved?.title ?? "আমার হিসাব");
  const [lines, setLines] = useState(Array.isArray(saved?.lines) && saved.lines.length > 0 ? saved.lines : [""]);
  const refs = useRef([]);
  const stimer = useRef(null);
  const ptimer = useRef(null);
  const prev = useRef(0);
  const [pulse, setPulse] = useState(false);
  const total = useMemo(() => cnCalcTotal(lines), [lines]);
  // eslint-disable-next-line no-useless-escape
  const lres = useMemo(() => lines.map(l => { const en = toEn2(l); if (!/[+\-*\/]/.test(en)) return null; return cnEvalLine(l); }), [lines]);
  useEffect(() => { refs.current = refs.current.slice(0, lines.length); }, [lines.length]);
  useEffect(() => {
    if (total !== prev.current) { prev.current = total; setPulse(true); clearTimeout(ptimer.current); ptimer.current = setTimeout(() => setPulse(false), 700); }
  }, [total]);
  const save2 = useCallback((t, l) => { clearTimeout(stimer.current); stimer.current = setTimeout(() => cnSave({ title: t, lines: l }), 500); }, []);
  const resize = el => { if (!el) return; el.style.height = "auto"; el.style.height = el.scrollHeight + "px"; };
  const onChange = (i, e) => { const nl = [...lines]; nl[i] = e.target.value; setLines(nl); resize(e.target); save2(title, nl); };
  const onKD = (i, e) => {
    if (e.key === "Enter") { e.preventDefault(); const el = refs.current[i], pos = el?.selectionStart ?? lines[i].length; const nl = [...lines.slice(0, i), lines[i].slice(0, pos), lines[i].slice(pos), ...lines.slice(i + 1)]; setLines(nl); save2(title, nl); setTimeout(() => { const nx = refs.current[i + 1]; if (nx) { nx.focus(); nx.setSelectionRange(0, 0); resize(nx); } }, 0); }
    if (e.key === "Backspace") { const el = refs.current[i], pos = el?.selectionStart ?? 0; if (pos === 0 && i > 0) { e.preventDefault(); const pL = lines[i - 1].length; const nl = [...lines.slice(0, i - 1), lines[i - 1] + lines[i], ...lines.slice(i + 1)]; setLines(nl); save2(title, nl); setTimeout(() => { const pv = refs.current[i - 1]; if (pv) { pv.focus(); pv.setSelectionRange(pL, pL); resize(pv); } }, 0); } }
  };
  const bg = dark ? "#0d0d11" : "#eeece8", pBg = dark ? "#16161d" : "#ffffff",
    brd = dark ? "#27273a" : "#e5e0d8", txt = dark ? "#f0effe" : "#1a1a1a",
    sub = dark ? "#8887a8" : "#999", mut = dark ? "#50506a" : "#ccc";
  return (
    <div className="calnote-container" style={{ position: "fixed", inset: 0, zIndex: 500, background: bg, display: "flex", flexDirection: "column", fontFamily: "'Atma',sans-serif", animation: "cnUp .28s cubic-bezier(.4,0,.2,1)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px 10px", borderBottom: `1px solid ${brd}`, background: pBg, flexShrink: 0, boxShadow: dark ? "0 2px 12px rgba(0,0,0,.4)" : "0 1px 6px rgba(0,0,0,.07)" }}>
        <div>
          <div style={{ fontSize: 25, fontWeight: 700, color: "#7c3aed", fontFamily: "'Atma',sans-serif", lineHeight: 1.1 }}>ক্যালনোট</div>
          <div style={{ fontSize: 11, color: sub, marginTop: 2, fontFamily: "'Atma',sans-serif" }}> </div>
        </div>
        <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: 10, border: `1px solid ${brd}`, background: dark ? "#1c1c26" : "#f4f4f8", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
          <Ic k="close" z={16} c={sub} />
        </button>
      </div>
      <div style={{ flex: 1, overflowY: "auto", WebkitOverflowScrolling: "touch", padding: "14px 14px 60px" }}>
        <div style={{ background: pBg, borderRadius: 18, border: `1px solid ${brd}`, overflow: "hidden", boxShadow: dark ? "0 2px 16px rgba(0,0,0,.3)" : "0 2px 16px rgba(0,0,0,.06)" }}>
          <div style={{ padding: "14px 16px 12px", borderBottom: `1px solid ${brd}` }}>
            <input value={title} onChange={e => { setTitle(e.target.value); save2(e.target.value, lines); }} placeholder="হিসাবের নাম লিখুন"
              style={{ width: "100%", background: "transparent", border: "none", outline: "none", fontFamily: "'Atma',sans-serif", fontSize: 18, fontWeight: 700, color: txt, caretColor: sub }} />
          </div>
          {lines.map((line, i) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", borderBottom: i < lines.length - 1 ? `1px solid ${brd}` : "none" }}>
              <span style={{ width: 38, flexShrink: 0, paddingTop: 14, textAlign: "center", fontFamily: "'Atma',sans-serif", fontSize: 11, fontWeight: 600, color: mut, userSelect: "none" }}>{toBn2(i + 1)}</span>
              <textarea ref={el => { refs.current[i] = el; }} rows={1} spellCheck={false} value={line}
                onChange={e => onChange(i, e)} onKeyDown={e => onKD(i, e)} onFocus={e => resize(e.target)}
                style={{ flex: 1, background: "transparent", border: "none", outline: "none", resize: "none", overflow: "hidden", fontFamily: "'Atma',sans-serif", fontSize: 16, fontWeight: 400, lineHeight: 1.85, color: txt, padding: "10px 8px 10px 0", minHeight: 46, caretColor: sub, wordBreak: "break-word" }} />
              {lres[i] !== null && <span style={{ alignSelf: "center", marginRight: 12, fontFamily: "'Atma',sans-serif", fontSize: 12, fontWeight: 600, color: sub, whiteSpace: "nowrap" }}>= {cnFmtNum(lres[i])}</span>}
            </div>
          ))}
          <div style={{ borderTop: `1.5px solid ${brd}`, padding: "13px 16px 16px", display: "flex", justifyContent: "flex-end" }}>
            <span style={{ fontFamily: "'Atma',sans-serif", fontSize: 32, fontWeight: 700, color: txt, letterSpacing: "-0.5px", display: "inline-block", transition: "transform .38s cubic-bezier(.34,1.56,.64,1)", transform: pulse ? "scale(1.1)" : "scale(1)" }}>
              {cnFmtNum(total)}
            </span>
          </div>
        </div>
      </div>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Atma:wght@300;400;500;600;700&display=swap');
        .calnote-container, .calnote-container * {
          font-family: 'Atma', sans-serif !important;
        }
        @keyframes cnUp{from{transform:translateY(100%);opacity:0}to{transform:translateY(0);opacity:1}}
        @keyframes tin{from{opacity:0;transform:translateX(-50%) translateY(8px);}to{opacity:1;transform:translateX(-50%) translateY(0);}}
        .calnote-container *, .calnote-container *::before, .calnote-container *::after {
          transition: background-color 0.14s ease, border-color 0.14s ease, color 0.14s ease, box-shadow 0.14s ease !important;
        }
        .calnote-container input, .calnote-container textarea { transition: border-color 0.15s ease, background-color 0.15s ease !important; }
        .calnote-container svg, .calnote-container svg * { transition: none !important; }
      `}</style>
    </div>
  );
}

function Chip({ ik, val, lbl, c, T, dark, style, large }) {
  const padding = large ? "14px 18px" : "10px 12px";
  const radius = large ? 16 : 14;
  const iconSize = large ? 22 : 18;
  const valSize = large ? 19 : 17;
  const lblSize = large ? 10 : 9;
  return (
    <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 9, padding: padding, background: T.sur, borderRadius: radius, border: `1px solid ${T.brd}`, boxShadow: dark ? "0 2px 10px rgba(0,0,0,.25)" : "0 1px 8px rgba(0,0,0,.05)", minWidth: 0, ...style }}>
      <Ic k={ik} z={iconSize} c={c} />
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: valSize, fontWeight: 800, color: c, letterSpacing: "-0.3px", lineHeight: 1.1, fontFamily: F, whiteSpace: "nowrap" }}>{val}</div>
        <div style={{ fontSize: lblSize, color: T.mut, fontWeight: 700, letterSpacing: "0.06em", fontFamily: F, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{lbl}</div>
      </div>
    </div>
  );
}

function SH({ ik, title, right, T }) {
  return (
    <div style={{ padding: "13px 14px", borderBottom: `1px solid ${T.brd}`, background: T.sur2, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Ic k={ik} z={16} c={T.acc} /><span style={{ fontWeight: 800, fontSize: 15, color: T.txt, fontFamily: F }}>{title}</span>
      </div>
      {right}
    </div>
  );
}

export default function Pennywise() {
  const [dark, setDark] = useState(true);
  const T = mkTheme(dark);

  // page index: 0=MEALS 1=BILLS 2=SUMMARY
  const [pageIdx, setPageIdx] = useState(0);
  const [toast, setToast] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [showReset, setShowReset] = useState(false);

  // meals state
  const [people, setPeople] = useState([
    { name: "Person 1", market: "", meals: newMeals() },
    { name: "Person 2", market: "", meals: newMeals() },
  ]);
  const [mealTab, setMealTab] = useState("table");
  const [hlDay, setHlDay] = useState(null);
  const [editPerson, setEditPerson] = useState(null);
  const [showAddP, setShowAddP] = useState(false);
  const [newPName, setNewPName] = useState("");

  const [showCalNote, setShowCalNote] = useState(false);

  // bills state
  const [bills, setBills] = useState(mkBills());
  const [showAddBill, setShowAddBill] = useState(false);
  const [newBillName, setNewBillName] = useState("");

  // swipe refs
  const trackRef = useRef(null);
  const panel0 = useRef(null);
  const panel1 = useRef(null);
  const panel2 = useRef(null);
  const idxRef = useRef(0);
  const tx0 = useRef(null);
  const ty0 = useRef(null);
  const dragging = useRef(false);
  const axisLock = useRef(null); // "h" | "v" | null

  // ── Persist ─────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      const d = await iGet("pw_main");
      if (d) {
        if (Array.isArray(d.people) && d.people.length > 0)
          setPeople(d.people.map(p => ({ ...p, meals: Array.isArray(p.meals) ? [...p.meals, ...newMeals()].slice(0, DAYS) : newMeals() })));
        if (typeof d.dark === "boolean") setDark(d.dark);
        if (Array.isArray(d.bills) && d.bills.length > 0) {
          const fixed = FIXED_BILLS.map(fb => {
            const sv = d.bills.find(b => b.id === fb.id);
            return { ...fb, amount: sv?.amount || "", custom: false };
          });
          setBills([...fixed, ...d.bills.filter(b => b.custom)]);
        }
      }
      setLoaded(true);
    })();
  }, []);

  useEffect(() => {
    if (!loaded) return;
    iSet("pw_main", { people, bills, dark });
  }, [people, bills, dark, loaded]);

  // ── Toast ────────────────────────────────────────────────
  const notify = useCallback((msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2400);
  }, []);

  // ── Navigate ─────────────────────────────────────────────
  const goTo = useCallback(idx => {
    const n = Math.max(0, Math.min(2, idx));
    setPageIdx(n);
    idxRef.current = n;
    if (trackRef.current) {
      trackRef.current.style.transition = "transform .45s cubic-bezier(0.16, 1, 0.3, 1)";
      trackRef.current.style.transform = `translateX(-${n * 100 / 3}%)`;
    }
    // scroll to top
    const p = [panel0, panel1, panel2][n];
    if (p?.current) p.current.scrollTop = 0;
  }, [panel0, panel1, panel2]);

  // ── Swipe handlers ───────────────────────────────────────
  const onTS = e => {
    tx0.current = e.touches[0].clientX;
    ty0.current = e.touches[0].clientY;
    dragging.current = false;
    axisLock.current = null;
  };
  const onTM = e => {
    if (tx0.current === null) return;
    const dx = e.touches[0].clientX - tx0.current;
    const dy = e.touches[0].clientY - ty0.current;
    if (!axisLock.current) {
      if (Math.abs(dx) < 5 && Math.abs(dy) < 5) return;
      axisLock.current = Math.abs(dx) > Math.abs(dy) ? "h" : "v";
    }
    if (axisLock.current === "v") return;
    e.preventDefault();
    dragging.current = true;
    const W = trackRef.current?.parentElement?.offsetWidth || window.innerWidth;
    const idx = idxRef.current;
    // base position in track %
    const base = idx * (100 / 3);
    let dPct = (dx / (W * 3)) * 100;
    // rubber-band edges
    if (dx > 0 && idx === 0) dPct *= .2;
    if (dx < 0 && idx === 2) dPct *= .2;
    if (trackRef.current) {
      trackRef.current.style.transition = "none";
      trackRef.current.style.transform = `translateX(-${base - dPct}%)`;
    }
  };
  const onTE = e => {
    if (tx0.current === null) return;
    const dx = e.changedTouches[0].clientX - tx0.current;
    tx0.current = null;
    if (!dragging.current || axisLock.current !== "h") {
      dragging.current = false; axisLock.current = null; return;
    }
    dragging.current = false; axisLock.current = null;
    const W = trackRef.current?.parentElement?.offsetWidth || window.innerWidth;
    if (Math.abs(dx) > W * 0.25) {
      if (dx < 0) goTo(idxRef.current + 1);
      else goTo(idxRef.current - 1);
    } else {
      // snap back
      if (trackRef.current) {
        trackRef.current.style.transition = "transform .45s cubic-bezier(0.16, 1, 0.3, 1)";
        trackRef.current.style.transform = `translateX(-${idxRef.current * (100 / 3)}%)`;
      }
    }
  };

  // ── Calculations ─────────────────────────────────────────
  const sumMeals = useCallback(p => p.meals.reduce((a, b) => a + Number(b || 0), 0), []);
  const totMeals = useMemo(() => people.reduce((a, p) => a + sumMeals(p), 0), [people, sumMeals]);
  const totMkt = useMemo(() => people.reduce((a, p) => a + Number(p.market || 0), 0), [people]);
  const rate = totMeals > 0 ? totMkt / totMeals : 0;
  const pStats = useMemo(() => people.map((p, i) => {
    const m = sumMeals(p), cost = m * rate, paid = Number(p.market || 0);
    return { ...p, m, cost, paid, bal: paid - cost, i };
  }), [people, rate, sumMeals]);
  const dayTots = useMemo(() => Array.from({ length: DAYS }, (_, di) => people.reduce((s, p) => s + Number(p.meals[di] || 0), 0)), [people]);
  const totBills = useMemo(() => bills.reduce((a, b) => a + Number(b.amount || 0), 0), [bills]);

  // ── Helpers ──────────────────────────────────────────────
  const updMeal = (pi, di, v) => setPeople(p => p.map((x, i) => i === pi ? { ...x, meals: x.meals.map((m, d) => d === di ? Math.max(0, Number(v) || 0) : m) } : x));
  const updMkt = (pi, v) => setPeople(p => p.map((x, i) => i === pi ? { ...x, market: v } : x));
  const updName = (pi, v) => setPeople(p => p.map((x, i) => i === pi ? { ...x, name: v } : x));
  const addPerson = () => {
    const n = newPName.trim(); if (!n) return;
    setPeople(p => [...p, { name: n, market: "", meals: newMeals() }]);
    setNewPName(""); setShowAddP(false); notify(`${n} added!`);
  };
  const delPerson = pi => {
    if (people.length <= 1) return notify("At least one member required", "error");
    setPeople(p => p.filter((_, i) => i !== pi)); setEditPerson(null); notify("Removed");
  };
  const updBill = (i, v) => setBills(b => b.map((x, idx) => idx === i ? { ...x, amount: v } : x));
  const delBill = i => { setBills(b => b.filter((_, idx) => idx !== i)); notify("Removed"); };
  const addBill = () => {
    const n = newBillName.trim(); if (!n) return;
    setBills(b => [...b, { id: `c_${Date.now()}`, label: n, color: "#a78bfa", ik: "receipt", amount: "", custom: true }]);
    setNewBillName(""); setShowAddBill(false); notify(`${n} added!`);
  };
  const resetAll = () => {
    setPeople(p => p.map(x => ({ ...x, market: "", meals: newMeals() })));
    setBills(mkBills()); setShowReset(false); notify("Reset ✓");
  };

  // ── Styles ───────────────────────────────────────────────
  const card = (extra = {}) => ({ background: T.sur, borderRadius: 16, border: `1px solid ${T.brd}`, overflow: "hidden", boxShadow: dark ? "0 2px 14px rgba(0,0,0,.3)" : "0 1px 10px rgba(0,0,0,.06)", ...extra });

  const Btn = (v = "primary") => ({
    padding: "11px 18px", borderRadius: 11, cursor: "pointer", fontWeight: 700, fontSize: 14, fontFamily: F,
    display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6, whiteSpace: "nowrap",
    border: "none",
    background: v === "primary" ? "linear-gradient(135deg,#7c3aed,#a855f7)" : v === "danger" ? "linear-gradient(135deg,#dc2626,#ef4444)" : v === "green" ? "linear-gradient(135deg,#059669,#34d399)" : T.sur2,
    color: v === "ghost" ? T.sub : "#fff",
    outline: v === "ghost" ? `1px solid ${T.brd2}` : "none",
    boxShadow: v === "primary" ? "0 4px 14px rgba(124,58,237,.3)" : v === "danger" ? "0 3px 12px rgba(220,38,38,.28)" : "none",
  });

  const inp = (ex = {}) => ({ width: "100%", padding: "11px 13px", borderRadius: 11, border: `1.5px solid ${T.brd2}`, outline: "none", fontSize: 15, fontWeight: 600, fontFamily: F, boxSizing: "border-box", background: T.sur2, color: T.txt, transition: "border-color .2s", ...ex });

  // ──────────────────────────────────────────────────────────
  // Page 0: MEALS
  const mealsJSX = (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Panel header */}
      <div style={{ marginBottom: 2 }}>
        <h2 style={{ fontSize: 20, fontWeight: 900, color: T.txt, letterSpacing: "-0.5px", fontFamily: F, margin: 0, lineHeight: 1.2 }}>Meals</h2>
        <p style={{ fontSize: 12, color: T.sub, fontWeight: 500, fontFamily: F, marginTop: 2 }}>Track daily meals & bazar contributions</p>
      </div>
      {/* Chips + CalNote button */}
      <div style={{ display: "flex", gap: 10, alignItems: "stretch" }}>
        <Chip ik="cart" val={totMkt.toFixed(0)} lbl="TOTAL BAZAR" c={T.acc} T={T} dark={dark} />
        <div
          onClick={() => setShowCalNote(true)}
          style={{
            flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
            gap: 7, padding: "10px 12px",
            background: dark ? "linear-gradient(135deg,rgba(167,139,250,.12),rgba(124,58,237,.08))" : "linear-gradient(135deg,#f5f3ff,#ede9fe)",
            borderRadius: 14, border: `1.5px solid ${dark ? "rgba(167,139,250,.3)" : "#c4b5fd"}`,
            cursor: "pointer", boxShadow: dark ? "0 2px 10px rgba(124,58,237,.2)" : "0 2px 10px rgba(124,58,237,.1)",
            transition: "all .2s",
          }}
        >
          <Ic k="note" z={18} c="#7c3aed" />
          <span style={{ fontSize: 18, fontWeight: 800, color: "#7c3aed", fontFamily: F, letterSpacing: "-0.2px" }}>CalNote</span>
        </div>
      </div>

      {/* Person cards */}
      {pStats.map((p, i) => {
        const cc = PAL[i % PAL.length], pos = p.bal >= 0;
        const cL = dark ? cc.dl : cc.ll, cT = dark ? cc.dt : cc.lt;
        return (
          <div key={i} style={card({ borderLeft: `3px solid ${cc.bg}` })}>
            <div style={{ padding: "14px 14px 0" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <Avatar name={p.name} ci={i} size={40} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  {editPerson === i
                    ? <input autoFocus value={p.name} onChange={e => updName(i, e.target.value)} onBlur={() => setEditPerson(null)} onKeyDown={e => e.key === "Enter" && setEditPerson(null)}
                      style={{ border: "none", borderBottom: `2px solid ${cc.bg}`, outline: "none", fontWeight: 800, fontSize: 16, width: "100%", background: "transparent", color: T.txt, fontFamily: F, padding: "2px 0" }} />
                    : <div onClick={() => setEditPerson(i)} style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                      <span style={{ fontWeight: 800, fontSize: 16, color: T.txt, fontFamily: F }}>{p.name}</span>
                      <Ic k="edit" z={13} c={T.mut} />
                    </div>
                  }
                </div>
                <button onClick={() => delPerson(i)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex" }}>
                  <Ic k="close" z={16} c={T.mut} />
                </button>
              </div>
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 10, color: T.mut, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 5, fontFamily: F }}>BAZAR</div>
                <input type="number" min="0" value={p.market} onChange={e => updMkt(i, e.target.value)} placeholder="0"
                  style={{ ...inp({ border: `1.5px solid ${p.market ? cc.bg + "88" : T.brd2}`, color: p.market ? cT : T.mut, background: p.market ? cL : T.sur2, fontSize: 18, fontWeight: 800 }) }} />
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 0, borderTop: `1px solid ${T.brd}` }}>
              {[
                { l: "MEALS", v: p.m, co: cT, bg: cL },
                { l: "COST", v: p.cost.toFixed(0), co: cT, bg: cL },
                { l: "BALANCE", v: (pos ? "+" : "") + p.bal.toFixed(0), co: pos ? T.grn : T.red, bg: pos ? (dark ? "rgba(52,211,153,.1)" : "rgba(5,150,105,.07)") : (dark ? "rgba(248,113,113,.1)" : "rgba(220,38,38,.07)") },
              ].map((x, j) => (
                <div key={j} style={{ padding: "10px 8px", background: x.bg, borderLeft: j > 0 ? `1px solid ${T.brd}` : "none", textAlign: "center" }}>
                  <div style={{ fontSize: 9, color: T.mut, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", fontFamily: F, marginBottom: 4, lineHeight: 1 }}>{x.l}</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: x.co, fontFamily: F, lineHeight: 1 }}>{x.v}</div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {/* Add member */}
      {showAddP
        ? <div style={card({ padding: 14, display: "flex", flexDirection: "column", gap: 10 })}>
          <input autoFocus value={newPName} onChange={e => setNewPName(e.target.value)} onKeyDown={e => e.key === "Enter" && addPerson()} placeholder="Enter name…" style={inp()} />
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={addPerson} style={{ ...Btn("primary"), flex: 1 }}><Ic k="check" z={14} c="#fff" />Add</button>
            <button onClick={() => { setShowAddP(false); setNewPName(""); }} style={{ ...Btn("ghost"), flex: 1 }}>Cancel</button>
          </div>
        </div>
        : <button onClick={() => setShowAddP(true)} style={{ width: "100%", padding: "14px", borderRadius: 16, border: `2px dashed ${T.brd2}`, background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, color: T.acc, fontWeight: 700, fontSize: 14, fontFamily: F }}>
          <Ic k="plus" z={18} c={T.acc} />ADD MEMBER
        </button>
      }

      {/* Meal table / chart */}
      <div style={card()}>
        <div style={{ display: "flex", gap: 4, padding: "10px 12px", borderBottom: `1px solid ${T.brd}`, background: T.sur2 }}>
          {[{ k: "table", l: "TABLE" }, { k: "pie", l: "CHART" }].map(t => (
            <button key={t.k} onClick={() => setMealTab(t.k)} style={{ flex: 1, padding: "9px 0", borderRadius: 10, border: "none", cursor: "pointer", fontWeight: 700, fontSize: 12, fontFamily: F, background: mealTab === t.k ? "linear-gradient(135deg,#7c3aed,#a855f7)" : "transparent", color: mealTab === t.k ? "#fff" : T.sub, boxShadow: mealTab === t.k ? "0 2px 10px rgba(124,58,237,.3)" : "none", transition: "all .15s" }}>{t.l}</button>
          ))}
        </div>

        {mealTab === "table" && (
          <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: Math.max(280, people.length * 88 + 80) }}>
              <thead>
                <tr style={{ background: T.sur2 }}>
                  <th style={{ padding: "8px 10px", textAlign: "center", fontWeight: 800, color: T.sub, borderBottom: `1px solid ${T.brd}`, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.07em", fontFamily: F, width: 36 }}>DAY</th>
                  {people.map((p, i) => (
                    <th key={i} style={{ padding: "10px 8px", borderBottom: `1px solid ${T.brd}`, minWidth: 80 }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
                        <Avatar name={p.name} ci={i} size={20} />
                        <span style={{ fontWeight: 800, color: T.txt, fontSize: 12, fontFamily: F, whiteSpace: "nowrap" }}>{p.name}</span>
                      </div>
                    </th>
                  ))}
                  <th style={{ padding: "10px 8px", borderBottom: `1px solid ${T.brd}`, fontSize: 11, fontWeight: 800, color: T.sub, textTransform: "uppercase", letterSpacing: "0.07em", fontFamily: F, minWidth: 48, textAlign: "center" }}>Σ</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: DAYS }, (_, di) => {
                  const dt = dayTots[di], hl = hlDay === di;
                  const rb = hl ? T.accBg : di % 2 === 0 ? T.sur : T.sur2;
                  return (
                    <tr key={di} onMouseEnter={() => setHlDay(di)} onMouseLeave={() => setHlDay(null)} style={{ background: rb, borderBottom: `1px solid ${T.brd}`, transition: "background .1s" }}>
                      <td style={{ padding: "6px 8px", fontWeight: 700, color: T.mut, fontSize: 12, fontFamily: F, textAlign: "center", verticalAlign: "middle" }}>{di + 1}</td>
                      {people.map((p, pi) => {
                        const cc = PAL[pi % PAL.length], v = p.meals[di] || 0;
                        const cL = dark ? cc.dl : cc.ll, cT = dark ? cc.dt : cc.lt;
                        return (
                          <td key={pi} style={{ padding: "4px 5px", textAlign: "center" }}>
                            <input type="number" min={0} value={v === 0 ? "" : v}
                              onChange={e => updMeal(pi, di, e.target.value)}
                              onBlur={e => { if (e.target.value === "") updMeal(pi, di, 0); }}
                              placeholder="0"
                              style={{ width: 56, padding: "6px 4px", borderRadius: 8, border: `1.5px solid ${v > 0 ? cc.bg + "88" : T.brd}`, textAlign: "center", fontWeight: v > 0 ? 800 : 400, color: v > 0 ? cT : T.mut, background: v > 0 ? cL : T.sur2, outline: "none", fontSize: 14, fontFamily: F, transition: "all .15s" }} />
                          </td>
                        );
                      })}
                      <td style={{ padding: "6px 8px", textAlign: "center" }}>
                        {dt > 0 ? <span style={{ background: "linear-gradient(135deg,#7c3aed,#a855f7)", color: "#fff", borderRadius: 20, padding: "2px 10px", fontWeight: 800, fontSize: 12, fontFamily: F }}>{dt}</span> : <span style={{ color: T.brd2 }}>—</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr style={{ background: T.accBg, borderTop: `2px solid ${T.acc}44` }}>
                  <td style={{ padding: "10px 12px", fontWeight: 800, color: T.acc, fontSize: 11, textTransform: "uppercase", fontFamily: F, textAlign: "center" }}>Σ</td>
                  {pStats.map((p, i) => {
                    const cc = PAL[i % PAL.length];
                    return <td key={i} style={{ padding: "10px 5px", textAlign: "center" }}><span style={{ background: cc.gr, color: "#fff", borderRadius: 20, padding: "3px 12px", fontWeight: 800, fontSize: 13, fontFamily: F }}>{p.m}</span></td>;
                  })}
                  <td style={{ padding: "10px 8px", textAlign: "center", fontWeight: 800, color: T.acc, fontSize: 14, fontFamily: F }}>{totMeals}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {mealTab === "pie" && (() => {
          // Build pie chart data
          const slices = pStats.map((p, i) => ({
            name: p.name, meals: p.m, color: PAL[i % PAL.length].bg, grad: PAL[i % PAL.length].gr, ci: i
          })).filter(s => s.meals > 0);
          const total = slices.reduce((a, s) => a + s.meals, 0);

          // SVG donut chart
          const R = 80, r = 48, cx = 100, cy = 100;
          let startAngle = -Math.PI / 2;
          const arcs = slices.map(s => {
            const pct = s.meals / total;
            const end = startAngle + pct * 2 * Math.PI;
            const x1 = cx + R * Math.cos(startAngle), y1 = cy + R * Math.sin(startAngle);
            const x2 = cx + R * Math.cos(end), y2 = cy + R * Math.sin(end);
            const ix1 = cx + r * Math.cos(startAngle), iy1 = cy + r * Math.sin(startAngle);
            const ix2 = cx + r * Math.cos(end), iy2 = cy + r * Math.sin(end);
            const large = pct > 0.5 ? 1 : 0;
            const d = `M${x1},${y1} A${R},${R} 0 ${large},1 ${x2},${y2} L${ix2},${iy2} A${r},${r} 0 ${large},0 ${ix1},${iy1} Z`;
            const midAngle = startAngle + pct * Math.PI;
            startAngle = end;
            return { ...s, d, pct, midAngle };
          });

          return (
            <div style={{ padding: "18px 14px" }}>
              <div style={{ fontSize: 12, color: T.sub, fontFamily: F, marginBottom: 16, fontWeight: 500 }}>Meal distribution by member</div>
              {total === 0
                ? <div style={{ textAlign: "center", padding: "32px 0", color: T.mut, fontFamily: F, fontSize: 14 }}>No meals recorded yet</div>
                : <>
                  {/* SVG Donut */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
                    <div style={{ position: "relative", width: 200, height: 200 }}>
                      <svg viewBox="0 0 200 200" width="200" height="200">
                        <defs>
                          {arcs.map((a, i) => (
                            <linearGradient key={i} id={`pg${i}`} x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" stopColor={PAL[a.ci % PAL.length].bg} />
                              <stop offset="100%" stopColor={PAL[a.ci % PAL.length].bg + "cc"} />
                            </linearGradient>
                          ))}
                        </defs>
                        {arcs.map((a, i) => (
                          <path key={i} d={a.d} fill={`url(#pg${i})`}
                            style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.3))", transition: "opacity .2s" }} />
                        ))}
                        {/* Centre text */}
                        <text x="100" y="96" textAnchor="middle" fill={T.txt} fontSize="22" fontWeight="800" fontFamily="Cause,Outfit,sans-serif">{total}</text>
                        <text x="100" y="112" textAnchor="middle" fill={T.mut} fontSize="10" fontWeight="600" fontFamily="Cause,Outfit,sans-serif">TOTAL MEALS</text>
                      </svg>
                    </div>
                  </div>
                  {/* Legend */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {arcs.map((a, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: T.sur2, borderRadius: 12, border: `1px solid ${T.brd}` }}>
                        <div style={{ width: 14, height: 14, borderRadius: 4, background: a.grad, flexShrink: 0, boxShadow: `0 2px 6px ${a.color}55` }} />
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0 }}>
                          <Avatar name={a.name} ci={a.ci} size={28} />
                          <span style={{ fontWeight: 700, fontSize: 14, color: T.txt, fontFamily: F, flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{a.name}</span>
                        </div>
                        <div style={{ textAlign: "right", flexShrink: 0 }}>
                          <div style={{ fontSize: 16, fontWeight: 800, color: a.color, fontFamily: F }}>{a.meals}</div>
                          <div style={{ fontSize: 10, color: T.mut, fontWeight: 700, fontFamily: F }}>{(a.pct * 100).toFixed(1)}%</div>
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

  // Page 1: BILLS
  const billsJSX = (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Panel header */}
      <div style={{ marginBottom: 2 }}>
        <h2 style={{ fontSize: 20, fontWeight: 900, color: T.txt, letterSpacing: "-0.5px", fontFamily: F, margin: 0, lineHeight: 1.2 }}>Bills</h2>
        <p style={{ fontSize: 12, color: T.sub, fontWeight: 500, fontFamily: F, marginTop: 2 }}>Manage monthly household expenses</p>
      </div>
      {/* Chips */}
      <div style={{ display: "flex", gap: 10 }}>
        <Chip ik="receipt" val={totBills.toFixed(0)} lbl="TOTAL BILLS" c={T.sky} T={T} dark={dark} />
        <Chip ik="user" val={(people.length ? totBills / people.length : 0).toFixed(0)} lbl="PER PERSON" c={T.acc} T={T} dark={dark} />
      </div>

      {/* Bill rows */}
      {bills.map((b, i) => (
        <div key={b.id} style={card({ borderLeft: `3px solid ${b.color}`, padding: "13px 14px", display: "flex", alignItems: "center", gap: 10, overflow: "visible" })}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: b.color + "1a", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Ic k={b.ik || "receipt"} z={18} c={b.color} />
          </div>
          <span style={{ fontWeight: 700, fontSize: 14, color: T.txt, fontFamily: F, flexShrink: 0, minWidth: 0, flex: "0 0 auto", maxWidth: "38%", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{b.label}</span>
          <input type="number" min="0" value={b.amount} onChange={e => updBill(i, e.target.value)} placeholder="0"
            style={{ flex: 1, padding: "8px 11px", borderRadius: 9, border: `1.5px solid ${b.amount ? b.color + "88" : T.brd2}`, outline: "none", fontSize: 16, fontWeight: 800, color: b.amount ? b.color : T.mut, background: b.amount ? b.color + "12" : T.sur2, fontFamily: F, boxSizing: "border-box", transition: "all .2s", minWidth: 0 }} />
          {b.custom && (
            <button onClick={() => delBill(i)} style={{ width: 32, height: 32, borderRadius: 8, border: "none", background: "rgba(220,38,38,.15)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
              <Ic k="trash" z={14} c={T.red} />
            </button>
          )}
        </div>
      ))}

      {/* ADD BILL — at bottom */}
      {showAddBill
        ? <div style={card({ padding: 14, display: "flex", flexDirection: "column", gap: 10 })}>
          <div style={{ fontSize: 11, color: T.mut, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", fontFamily: F, marginBottom: 2 }}>New Bill</div>
          <input autoFocus value={newBillName} onChange={e => setNewBillName(e.target.value)} onKeyDown={e => e.key === "Enter" && addBill()} placeholder="Bill name…"
            style={{ width: "100%", padding: "10px 13px", borderRadius: 10, border: `1.5px solid ${T.acc}`, outline: "none", fontSize: 14, fontWeight: 700, fontFamily: F, background: T.sur2, color: T.txt, boxSizing: "border-box" }} />
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={addBill} style={{ ...Btn("primary"), flex: 1 }}><Ic k="check" z={14} c="#fff" />Add Bill</button>
            <button onClick={() => { setShowAddBill(false); setNewBillName(""); }} style={{ ...Btn("ghost"), flex: 1 }}>Cancel</button>
          </div>
        </div>
        : <button onClick={() => setShowAddBill(true)} style={{ width: "100%", padding: "13px", borderRadius: 14, border: `2px dashed ${T.brd2}`, background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, color: T.acc, fontWeight: 700, fontSize: 14, fontFamily: F }}>
          <Ic k="plus" z={18} c={T.acc} />ADD NEW BILL
        </button>
      }
    </div>
  );

  // Page 2: SUMMARY
  const summaryJSX = (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Panel header */}
      <div style={{ marginBottom: 2 }}>
        <h2 style={{ fontSize: 20, fontWeight: 900, color: T.txt, letterSpacing: "-0.5px", fontFamily: F, margin: 0, lineHeight: 1.2 }}>Summary</h2>
        <p style={{ fontSize: 12, color: T.sub, fontWeight: 500, fontFamily: F, marginTop: 3 }}>Full financial overview & settlement guide</p>
      </div>
      {/* Chips 2×2 */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <Chip ik="cart" val={totMkt.toFixed(0)} lbl="BAZAR" c={T.acc} T={T} dark={dark} />
        <Chip ik="receipt" val={totBills.toFixed(0)} lbl="BILLS" c={T.sky} T={T} dark={dark} />
        <Chip ik="rate" val={rate.toFixed(2)} lbl="RATE" c={T.amb} T={T} dark={dark} />
        <Chip ik="users" val={people.length} lbl="PEOPLE" c={T.grn} T={T} dark={dark} />
      </div>

      {/* Meal breakdown */}
      <div style={card()}>
        <SH ik="utensils" title="MEAL BREAKDOWN" T={T} />
        <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, minWidth: 0 }}>
            <thead>
              <tr style={{ background: T.sur2 }}>
                {["PERSON", "MEALS", "RATE", "COST", "BAL"].map((h, idx) => (
                  <th key={h} style={{ padding: "9px 8px", textAlign: idx === 0 ? "left" : "center", fontWeight: 800, color: T.mut, borderBottom: `2px solid ${T.brd}`, fontSize: 9, textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: F, whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pStats.map((p, i) => {
                const pos = p.bal >= 0;
                return (
                  <tr key={i} style={{ borderBottom: `1px solid ${T.brd}` }}>
                    <td style={{ padding: "10px 8px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <Avatar name={p.name} ci={i} size={22} />
                        <span style={{ fontWeight: 800, color: T.txt, fontFamily: F, fontSize: 12, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 72 }}>{p.name}</span>
                      </div>
                    </td>
                    <td style={{ textAlign: "center", padding: "10px 6px", fontWeight: 800, color: T.txt, fontFamily: F, fontSize: 13 }}>{p.m}</td>
                    <td style={{ textAlign: "center", padding: "10px 6px", fontWeight: 600, color: T.sub, fontFamily: F, fontSize: 11 }}>{rate.toFixed(1)}</td>
                    <td style={{ textAlign: "center", padding: "10px 6px", fontWeight: 800, color: T.red, fontFamily: F, fontSize: 13 }}>{p.cost.toFixed(0)}</td>
                    <td style={{ textAlign: "center", padding: "10px 6px" }}>
                      <span style={{ fontWeight: 800, fontSize: 13, color: pos ? T.grn : T.red, fontFamily: F }}>{pos ? "+" : ""}{p.bal.toFixed(0)}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ background: T.accBg, borderTop: `2px solid ${T.acc}44` }}>
                <td style={{ padding: "10px 10px", fontWeight: 800, color: T.acc, fontSize: 11, textTransform: "uppercase", fontFamily: F }}>TOTAL</td>
                <td style={{ textAlign: "center", padding: "10px 10px", fontWeight: 800, color: T.acc, fontFamily: F }}>{totMeals}</td>
                <td />
                <td style={{ textAlign: "center", padding: "10px 10px", fontWeight: 800, color: T.red, fontFamily: F }}>{(rate * totMeals).toFixed(0)}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Settlement */}
      <div style={card()}>
        <SH ik="settle" title="SETTLEMENT" T={T} />
        <div style={{ padding: "12px 14px", display: "flex", flexDirection: "column", gap: 10 }}>
          {pStats.filter(p => p.bal < -0.01).flatMap(debtor =>
            pStats.filter(p => p.bal > 0.01).map((creditor, j) => (
              <div key={`${debtor.i}-${j}`} style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 13px", background: dark ? "rgba(251,191,36,.08)" : "rgba(217,119,6,.06)", borderRadius: 12, border: `1px solid ${dark ? "rgba(251,191,36,.18)" : "rgba(217,119,6,.14)"}`, flexWrap: "wrap" }}>
                <Avatar name={debtor.name} ci={debtor.i} size={26} />
                <span style={{ fontWeight: 800, color: T.txt, fontFamily: F, fontSize: 13 }}>{debtor.name}</span>
                <Ic k="arrow" z={14} c={T.mut} />
                <Avatar name={creditor.name} ci={creditor.i} size={26} />
                <span style={{ fontWeight: 800, color: T.txt, fontFamily: F, fontSize: 13 }}>{creditor.name}</span>
                <span style={{ marginLeft: "auto", fontWeight: 800, color: T.amb, fontSize: 16, fontFamily: F }}>{Math.min(Math.abs(debtor.bal), creditor.bal).toFixed(2)}</span>
              </div>
            ))
          )}
          {!pStats.some(p => p.bal < -0.01) && (
            <div style={{ padding: "13px", borderRadius: 12, background: dark ? "rgba(52,211,153,.1)" : "rgba(5,150,105,.07)", border: `1px solid ${dark ? "rgba(52,211,153,.18)" : "rgba(5,150,105,.14)"}`, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <Ic k="allchk" z={17} c={T.grn} />
              <span style={{ color: T.grn, fontWeight: 700, fontSize: 14, fontFamily: F }}>All settled!</span>
            </div>
          )}
        </div>
      </div>

      {/* Bill details */}
      {bills.some(b => b.amount) && (
        <div style={card()}>
          <SH ik="receipt" title="BILL DETAILS" right={<span style={{ fontWeight: 800, color: T.sky, fontSize: 14, fontFamily: F }}>{totBills.toFixed(2)}</span>} T={T} />
          <div style={{ padding: "4px 14px 12px" }}>
            {bills.filter(b => b.amount).map((b, i, arr) => (
              <div key={b.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: i < arr.length - 1 ? `1px solid ${T.brd}` : "none" }}>
                <Ic k={b.ik || "receipt"} z={16} c={b.color || T.acc} />
                <span style={{ fontWeight: 700, flex: 1, color: T.txt, fontFamily: F }}>{b.label}</span>
                <span style={{ fontWeight: 800, color: b.color || T.acc, fontSize: 14, fontFamily: F }}>{Number(b.amount).toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  // ── Render ────────────────────────────────────────────────
  return (
    <div style={{ height: "100dvh", display: "flex", flexDirection: "column", background: T.bg, fontFamily: F, color: T.txt, overflow: "hidden" }}>

      {toast && <Toast msg={toast.msg} type={toast.type} />}
      {showCalNote && <CalNoteApp onClose={() => setShowCalNote(false)} T={T} dark={dark} />}
      {showReset && <ConfirmSheet title="Reset month?" body="All meals and bill amounts will be cleared. Cannot be undone." onOk={resetAll} onClose={() => setShowReset(false)} T={T} />}

      {/* ── HEADER ── */}
      <div style={{ background: T.sur, borderBottom: `1px solid ${T.brd}`, padding: "10px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0, boxShadow: dark ? "0 2px 16px rgba(0,0,0,.4)" : "0 1px 8px rgba(0,0,0,.07)", minHeight: 56 }}>
        <span style={{ fontSize: 22, fontWeight: 900, letterSpacing: "-0.8px", color: "#7c3aed", fontFamily: F }}>Pennywise</span>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: T.sub, fontFamily: F, letterSpacing: "0.04em" }}>
            {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }).toUpperCase()}
          </span>
          <button onClick={() => setDark(d => !d)} style={{ width: 36, height: 36, borderRadius: 10, border: `1.5px solid ${T.brd2}`, background: T.sur2, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <Ic k={dark ? "sun" : "moon"} z={17} c={dark ? "#fbbf24" : "#7c3aed"} />
          </button>
          <button onClick={() => setShowReset(true)} style={{ width: 36, height: 36, borderRadius: 10, border: "none", background: "linear-gradient(135deg,#dc2626,#ef4444)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 3px 10px rgba(220,38,38,.35)" }}>
            <Ic k="reset" z={16} c="#fff" />
          </button>
        </div>
      </div>

      {/* ── SWIPE AREA ── */}
      <div
        style={{ flex: 1, overflow: "hidden", position: "relative" }}
        onTouchStart={onTS}
        onTouchMove={onTM}
        onTouchEnd={onTE}
      >
        {/* Track: 300% wide, holds 3 panels */}
        <div
          ref={trackRef}
          data-track="1"
          style={{ display: "flex", width: "300%", height: "100%", willChange: "transform", transform: "translateX(0%)" }}
        >
          {/* Panel 0 */}
          <div ref={panel0} style={{ width: "33.333%", height: "100%", overflowY: "auto", overflowX: "hidden", WebkitOverflowScrolling: "touch" }}>
            <div style={{ padding: "14px 12px 100px" }}>{mealsJSX}</div>
          </div>
          {/* Panel 1 */}
          <div ref={panel1} style={{ width: "33.333%", height: "100%", overflowY: "auto", overflowX: "hidden", WebkitOverflowScrolling: "touch" }}>
            <div style={{ padding: "14px 12px 100px" }}>{billsJSX}</div>
          </div>
          {/* Panel 2 */}
          <div ref={panel2} style={{ width: "33.333%", height: "100%", overflowY: "auto", overflowX: "hidden", WebkitOverflowScrolling: "touch" }}>
            <div style={{ padding: "14px 12px 100px" }}>{summaryJSX}</div>
          </div>
        </div>
      </div>

      {/* ── BOTTOM NAV ── */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 100, background: T.sur, borderTop: `1px solid ${T.brd}`, display: "flex", padding: "6px 0 max(10px,env(safe-area-inset-bottom))", boxShadow: dark ? "0 -4px 20px rgba(0,0,0,.35)" : "0 -2px 14px rgba(0,0,0,.08)" }}>
        {[{ idx: 0, ik: "utensils", l: "MEALS" }, { idx: 1, ik: "receipt", l: "BILLS" }, { idx: 2, ik: "chart", l: "SUMMARY" }].map(n => (
          <button key={n.idx} onClick={() => goTo(n.idx)} style={{ flex: 1, padding: "4px 0", border: "none", background: "transparent", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
            <div style={{ width: 40, height: 36, borderRadius: 11, background: pageIdx === n.idx ? T.accBg : "transparent", display: "flex", alignItems: "center", justifyContent: "center", transition: "background .15s" }}>
              <Ic k={n.ik} z={22} c={pageIdx === n.idx ? T.acc : T.sub} />
            </div>
            <span style={{ fontSize: 10, fontWeight: 700, color: pageIdx === n.idx ? T.acc : T.mut, fontFamily: F, letterSpacing: "0.04em", lineHeight: 1, marginTop: 1 }}>{n.l}</span>
          </button>
        ))}
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cause:wght@400;600;700;800;900&family=Outfit:wght@400;600;700;800;900&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        html,body,#root{height:100%;overflow:hidden;}
        body{background:${T.bg};color:${T.txt};font-family:${F};-webkit-font-smoothing:antialiased;}
        input,select,button,td,th,span,div,p,h2,h3,label{font-family:${F}!important;}
        input[type=number]::-webkit-inner-spin-button{-webkit-appearance:none;}
        input:focus,select:focus{border-color:${T.acc}!important;box-shadow:0 0 0 3px ${dark ? "rgba(167,139,250,.16)" : "rgba(124,58,237,.12)"}!important;}
        select option{background:${T.sur2};color:${T.txt};}
        button:active{opacity:.8;transform:scale(.97);}
        ::-webkit-scrollbar{height:3px;width:3px;}
        ::-webkit-scrollbar-track{background:transparent;}
        ::-webkit-scrollbar-thumb{background:${T.brd2};border-radius:10px;}
        @keyframes tin{from{opacity:0;transform:translateX(-50%) translateY(8px);}to{opacity:1;transform:translateX(-50%) translateY(0);}}
        *, *::before, *::after {
          transition: background-color 0.14s ease, border-color 0.14s ease, color 0.14s ease, box-shadow 0.14s ease !important;
        }
        svg, svg * { transition: none !important; }
        input, textarea { transition: border-color 0.15s ease, background-color 0.15s ease !important; }
      `}</style>
    </div>
  );
}

