import { useEffect, useMemo, useRef, useState } from "react";
import { BrowserRouter, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Activity, ArrowRight, CalendarDays, Check, ChevronDown, ChevronRight, Clock3, Copy, DoorOpen, Download, ExternalLink, Instagram, Mail, MapPin, Menu, QrCode, Radio, ScanLine, Share2, Shield, Sparkles, Ticket, UserPlus, Users, X, Zap } from "lucide-react";
import { toPng } from "html-to-image";
import "@/App.css";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const agenda = { day1: { theme: "Y2K REBOOT", food: "Snacks provided", date: "01 SEPT", items: [["09:00", "Welcome + opening speech — CSE Hall", "Kick-off with the BAS crew, faculty greetings, and the official Freshers '26 signal drop."], ["09:30", "KBC, Hyrox, Human Tic-Tac-Toe & 8 Brains", "Squad-based games designed to break the ice and put your batch on the leaderboard."], ["17:00", "Awards, closing ceremony & Day 2 reveal", "Winners, standing ovations, and a first look at Day 2's Indo-Western surprises."]] }, day2: { theme: "INDO-WESTERN", food: "Lunch 14:00–15:00", date: "02 SEPT", items: [["09:00", "Welcome to day two", "Grand entry in Indo-Western fits, batch photo, and the day two brief."], ["09:30", "Introduce yourself uniquely", "Every fresher gets 60 seconds on stage — make it memorable."], ["12:00", "Culturals", "Music, dance, and open-mic performances from the batch and seniors."], ["15:00", "Stress round — Mr & Mrs Fresher", "The finale contest — quick thinking, style, and stage presence decide the crown."], ["17:00", "Awards & closing ceremony", "Crowning, closing speech, and the official welcome to the B.Com family."]] } };

function App() {
  const [tab, setTab] = useState("home");
  const [modal, setModal] = useState(null);
  const [pass, setPass] = useState(null);
  const [notice, setNotice] = useState("");
  const [isAdmin, setIsAdmin] = useState(() => Boolean(sessionStorage.getItem("frenzy_admin_token")));
  const [adminOpen, setAdminOpen] = useState(false);
  const [passHidden, setPassHidden] = useState(() => sessionStorage.getItem("frenzy-pass-hidden") === "1");
  const hidePass = () => { sessionStorage.setItem("frenzy-pass-hidden", "1"); setPassHidden(true); };
  const restorePass = () => { sessionStorage.removeItem("frenzy-pass-hidden"); setPassHidden(false); };
  const navigate = useNavigate();
  const go = (next) => { setTab(next); setNotice(""); if (next === "gate") navigate("/gate-display"); else navigate("/"); window.scrollTo({ top: 0, behavior: "smooth" }); };
  useEffect(() => { const saved = localStorage.getItem("frenzy-pass"); if (saved) setPass(JSON.parse(saved)); }, []);
  return <div className={`app-shell ${tab === "gate" ? "gate-shell" : ""}`}>
    <TopBar tab={tab} go={go} isAdmin={isAdmin} onAdmin={() => setAdminOpen(true)} />
    {notice && <div className="toast" data-testid="global-notice"><Zap size={16} />{notice}<button data-testid="dismiss-notice" onClick={() => setNotice("")}><X size={16} /></button></div>}
    <main className="page-wrap"><AnimatePresence mode="wait"><motion.div key={tab} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: .35 }}>
      {tab === "home" && <Home go={go} openLetter={() => setModal("letter")} />}
      {tab === "agenda" && <Agenda go={go} />}
      {tab === "join" && <Register onDone={(item) => { setPass(item); localStorage.setItem("frenzy-pass", JSON.stringify(item)); restorePass(); go("pass"); }} />}
      {tab === "pass" && <Pass pass={pass} onPass={setPass} onNotice={setNotice} hidden={passHidden} onHide={hidePass} onRestore={restorePass} go={go} />}
      {tab === "contacts" && <Contacts />}
      {tab === "scan" && <Scanner isAdmin={isAdmin} onAdmin={() => setAdminOpen(true)} onNotice={setNotice} />}
      {tab === "admin" && <Admin isAdmin={isAdmin} onAdmin={() => setAdminOpen(true)} onLogout={() => setIsAdmin(false)} />}
    </motion.div></AnimatePresence></main>
    {tab !== "gate" && <Nav tab={tab} go={go} />}
    {modal === "letter" && <Letter onClose={() => setModal(null)} onContinue={() => { setModal(null); go("join"); }} />}
    {adminOpen && <AdminModal onClose={() => setAdminOpen(false)} onSuccess={(token) => { if (token) sessionStorage.setItem("frenzy_admin_token", token); setIsAdmin(true); setAdminOpen(false); go("admin"); }} />}
  </div>;
}

function TopBar({ tab, go, isAdmin, onAdmin }) { return <header className="topbar"><button className="brand-mark" data-testid="home-nav-button" onClick={() => go("home")}><span className="brand-symbol">✳</span><span>BCOM<span className="brand-accent">/</span>BAS</span></button><div className="top-status"><span className="pulse-dot" /> LIVE / BATCH 26</div><button className="admin-trigger" data-testid="admin-access-button" onClick={isAdmin ? () => go("admin") : onAdmin}>{isAdmin ? <Shield size={16} /> : <Zap size={16} />}<span>{isAdmin ? "COMMAND" : "ACCESS"}</span></button></header> }
function Nav({ tab, go }) { const items = [["home", "ORBIT", Sparkles], ["agenda", "LINEUP", CalendarDays], ["join", "REGISTER", UserPlus], ["pass", "PASS", Ticket], ["scan", "SCAN", ScanLine], ["contacts", "CREW", Users]]; return <nav className="nav-dock" aria-label="Main navigation">{items.map(([id, label, Icon]) => <button key={id} data-testid={`${id}-nav-button`} className={tab === id ? "active" : ""} onClick={() => go(id)}><Icon size={18} /><span>{label}</span></button>)}</nav> }

function Home({ go, openLetter }) { const [left, setLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 }); const targetTs = new Date("2026-09-01T09:00:00").getTime(); useEffect(() => { const tick = () => { const diff = Math.max(0, targetTs - Date.now()); setLeft({ days: Math.floor(diff / 86400000), hours: Math.floor(diff / 3600000) % 24, minutes: Math.floor(diff / 60000) % 60, seconds: Math.floor(diff / 1000) % 60 }); }; tick(); const id = setInterval(tick, 1000); return () => clearInterval(id); }, [targetTs]); const totalWindow = 60 * 86400000; const remaining = Math.max(0, targetTs - Date.now()); const progressWidth = `${Math.min(100, Math.max(6, 100 - (remaining / totalWindow) * 100))}%`; return <div className="home-view">
  <section className="hero-stage"><div className="scan-grid" /><div className="hero-orbit orbit-a" /><div className="hero-orbit orbit-b" /><div className="hero-copy"><div className="brand-tag" data-testid="brand-tag"><span>B.COM ASSOCIATION</span><i>×</i><span>GOKUL CAMPUS</span></div><div className="eyebrow"><span>01—02 / 09 / 2026</span><span>KLE TECH · HUBBALLI</span></div><h1><span className="outline-word">FRESHERS</span><span className="gradient-word">&apos;26 <i>·</i></span></h1><p className="hero-tagline" data-testid="hero-tagline">Two Days, One Campus, New Faces, New Journey, <em>Join B.Com Family</em>.</p><p className="hero-lede">A high-voltage welcome to Batch 2026 — hosted by the B.Com Association at Gokul Campus.</p><div className="hero-actions"><button className="primary-cta" data-testid="open-invitation-button" onClick={openLetter}><Mail size={18} /> OPEN INVITATION <ArrowRight size={17} /></button><button className="ghost-cta" data-testid="hero-pass-button" onClick={() => go("pass")}><QrCode size={17} /> GET YOUR PASS</button></div></div><div className="hero-side-note" data-testid="hero-side-note"><span>COUNTDOWN</span><b className="hero-side-badge">FRESHERS<br />&apos;26</b><small>01 SEPT · 09:00<br />GOKUL CAMPUS</small></div><div className="scroll-cue"><span /> SCROLL TO EXPLORE</div></section>
  <section className="intro-band"><div><span className="section-kicker">THE SIGNAL</span><h2>COME AS YOU ARE.<br /><em>LEAVE WITH A SQUAD.</em></h2></div><p>Freshers &apos;26 is a high-voltage welcome to your next chapter — games, culture, food, and an entry pass with your name on it.</p></section>
  <section className="info-grid"><article className="holo-panel countdown-panel" data-testid="countdown-panel"><div className="panel-label"><Radio size={15} /> COUNTDOWN · FRESHERS &apos;26</div><h4>THE WAIT IS <em>ALMOST OVER</em></h4><div className="countdown">{Object.entries(left).map(([key, val]) => <div key={key} data-testid={`countdown-${key}`}><motion.strong key={val} className="count-flip" initial={{ y: -18, opacity: 0, filter: "blur(4px)" }} animate={{ y: 0, opacity: 1, filter: "blur(0px)" }} transition={{ duration: .35 }}>{String(val).padStart(2, "0")}</motion.strong><span>{key}</span></div>)}</div><div className="countdown-progress" aria-hidden><b style={{ width: progressWidth }} /></div><small>UNTIL THE FIRST SIGNAL · 01 SEPT · 09:00 AM · GOKUL CAMPUS</small></article><article className="holo-panel date-panel"><span className="section-kicker">WHERE / WHEN</span><h3>01 + 02<br /><em>SEPTEMBER</em></h3><p><MapPin size={16} /> KLE Technological University<br />Gokul Road, Vidyanagar</p><button data-testid="agenda-link-button" onClick={() => go("agenda")}>VIEW THE LINEUP <ChevronRight size={16} /></button></article></section>
  <section className="invitation-strip" data-testid="invitation-strip" onClick={openLetter}><div className="seal">✦</div><div><span className="section-kicker">A SEALED TRANSMISSION FROM BAS</span><h3>THE GOLDEN INVITATION</h3></div><ArrowRight className="strip-arrow" /></section>
  <section className="home-cta"><span className="section-kicker">YOUR SEAT IS RESERVED</span><h2>READY TO<br /><em>REGISTER?</em></h2><button className="primary-cta" data-testid="register-now-button" onClick={() => go("join")}>REGISTER NOW <ArrowRight size={18} /></button></section>
 </div> }

function Agenda({ go }) { const [day, setDay] = useState("day1"); const [open, setOpen] = useState(null); const data = agenda[day]; const toggle = (i) => setOpen(open === i ? null : i); return <section className="content-page"><PageTitle kicker="THE FULL TRANSMISSION" title="PARTY LINEUP" desc="Two days of games, culture, and new connections — tap a slot to open the details." /><div className="day-tabs">{["day1", "day2"].map((key, i) => <button key={key} data-testid={`${key}-agenda-tab`} className={day === key ? "selected" : ""} onClick={() => { setDay(key); setOpen(null); }}><span>DAY 0{i + 1}</span><small>{i ? "02 SEPT · INDO-WESTERN" : "01 SEPT · Y2K REBOOT"}</small></button>)}</div><div className="agenda-layout"><div className="agenda-feature"><span className="section-kicker">OFFICIAL THEME</span><strong>{data.theme}</strong><span className="food-chip">✦ {data.food}</span></div><div className="timeline">{data.items.map(([time, item, desc], i) => <motion.div className={`timeline-row ${open === i ? "expanded" : ""}`} key={time} data-testid={`lineup-row-${day}-${i}`} onClick={() => toggle(i)} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}><span>{time}</span><i>{String(i + 1).padStart(2, "0")}</i><p>{item}</p><ChevronDown size={16} className="row-toggle" /><AnimatePresence>{open === i && desc && <motion.div className="row-more" data-testid={`lineup-row-${day}-${i}-more`} initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: .25 }}>{desc}</motion.div>}</AnimatePresence></motion.div>)}</div></div><button className="primary-cta center-cta" data-testid="agenda-register-button" onClick={() => go("join")}>REGISTER NOW <ArrowRight size={18} /></button></section> }
function PageTitle({ kicker, title, desc }) { return <div className="page-title"><span className="section-kicker">{kicker}</span><h1>{title}</h1><p>{desc}</p></div> }

function Register({ onDone }) { const [form, setForm] = useState({ name: "", roll_no: "", gender: "", email: "", phone: "" }); const [error, setError] = useState(""); const [loading, setLoading] = useState(false); const submit = async (e) => { e.preventDefault(); setLoading(true); setError(""); try { const res = await fetch(`${API}/register`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, branch: "BCom" }) }); const data = await res.json().catch(() => ({})); if (!res.ok) throw new Error(data.detail || data.error || "Registration could not be completed"); onDone(data.registration); } catch (err) { setError(err.message || "Unable to reach the registration desk. Please try again."); } finally { setLoading(false); } }; const update = (e) => setForm({ ...form, [e.target.name]: e.target.value }); return <section className="content-page narrow"><PageTitle kicker="NEW SIGNAL DETECTED" title="REGISTER FOR FRESHERS '26" desc="Secure your official entry pass for the B.Com Association welcome party." /><form className="register-form" onSubmit={submit}><div className="form-rail"><span>01</span><span>02</span><span>03</span></div>{[["name", "FULL NAME", "Your name"], ["roll_no", "USN / ROLL NUMBER", "01FM26BCM001"], ["email", "UNIVERSITY EMAIL", "you@university.edu"], ["phone", "PHONE / WHATSAPP", "+91 00000 00000"]].map(([name, label, placeholder], i) => <label key={name} data-testid={`${name}-field`}><span>{String(i + 1).padStart(2, "0")} / {label}</span><input required={name !== "phone"} name={name} value={form[name]} onChange={update} placeholder={placeholder} /></label>)}<label data-testid="gender-field"><span>05 / IDENTITY MARKER</span><select required name="gender" value={form.gender} onChange={update}><option value="">Select gender</option><option>Male</option><option>Female</option><option>Custom</option><option>Other</option></select></label>{error && <div className="form-error" data-testid="registration-error"><Zap size={15} /> {error}</div>}<button className="primary-cta form-submit" data-testid="registration-submit-button" disabled={loading}>{loading ? "GENERATING PASS..." : "GENERATE MY PASS"} <ArrowRight size={18} /></button></form></section> }

function Pass({ pass: initial, onPass, onNotice, hidden, onHide, onRestore, go }) {
  const [query, setQuery] = useState("");
  const [pass, setPass] = useState(initial);
  const [busy, setBusy] = useState(null);
  const ticketRef = useRef(null);
  const lookup = async (e) => { e.preventDefault(); try { const res = await fetch(`${API}/pass/${encodeURIComponent(query)}`); const data = await res.json(); if (!res.ok) throw new Error(data.error); setPass(data.registration); onPass(data.registration); onRestore?.(); } catch { onNotice("No pass found. Try your roll number or Pass ID."); } };
  const capture = async () => {
    if (!ticketRef.current) return null;
    return toPng(ticketRef.current, { pixelRatio: 3, cacheBust: true, backgroundColor: "#0a0a10", filter: (node) => !node.classList || !node.classList.contains("pass-dismiss") });
  };
  const download = async () => {
    setBusy("download");
    try { const url = await capture(); if (!url) return; const a = document.createElement("a"); a.download = `Freshers26-${pass.qr_code_id || pass.roll_no || "pass"}.png`; a.href = url; a.click(); onNotice("Ticket saved as PNG."); }
    catch { onNotice("Could not export the ticket. Try again."); }
    finally { setBusy(null); }
  };
  const share = async () => {
    setBusy("share");
    try {
      const url = await capture(); if (!url) return;
      const blob = await (await fetch(url)).blob();
      const file = new File([blob], `Freshers26-${pass.qr_code_id || "pass"}.png`, { type: "image/png" });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: "My Freshers '26 Pass", text: `I'm in for Freshers '26! Pass ${pass.qr_code_id || ""}` });
        onNotice("Shared successfully.");
      } else {
        const a = document.createElement("a"); a.download = file.name; a.href = url; a.click();
        onNotice("Sharing not supported here — downloaded PNG instead.");
      }
    } catch (err) { if (err?.name !== "AbortError") onNotice("Could not share. Downloaded PNG instead."); }
    finally { setBusy(null); }
  };
  return <section className="content-page narrow"><PageTitle kicker="IDENTITY CONFIRMED" title="YOUR ENTRY PASS" desc="Present this QR at the gate. Download it, share it, or keep it close." /><form className="pass-search" onSubmit={lookup}><input data-testid="pass-lookup-input" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search roll number or FF-8492" /><button data-testid="pass-lookup-button"><ScanLine size={17} /> FIND</button></form>{pass && hidden && <div className="empty-state" data-testid="pass-hidden-state"><Ticket size={32} /><p>Your pass is safely stored.</p><small>It stays saved on our end — reveal it below when you need it at the gate.</small><button className="ghost-cta" style={{ marginTop: 22 }} data-testid="restore-pass-button" onClick={onRestore}>REVEAL MY PASS <ArrowRight size={17} /></button></div>}{pass && !hidden && <div className="ticket-card digital-ticket" data-testid="entry-pass-card"><button className="pass-dismiss" data-testid="dismiss-pass-button" aria-label="Hide pass" onClick={onHide}><X size={16} /></button><div className="ticket-inner" ref={ticketRef}><span className="foil-strip" /><div className="ticket-top"><span>B.COM ASSOCIATION · GOKUL CAMPUS</span><b className="ticket-badge">FRESHERS &apos;26 · VIP</b><h2>YOU&apos;RE<br /><em>IN.</em></h2><span className="ticket-serial">SERIAL · {pass.qr_code_id || "PENDING"}</span></div><div className="ticket-body"><div><span>ATTENDEE</span><strong data-testid="pass-attendee-name">{pass.name}</strong></div><div><span>ROLL / USN</span><b data-testid="pass-roll">{pass.roll_no}</b></div><div className="ticket-meta"><div><i>EVENT DATE</i><p>01 + 02 SEPT 2026</p></div><div><i>VENUE</i><p>KLE TECH · GOKUL CAMPUS</p></div><div><i>GATES OPEN</i><p>09:00 IST</p></div><div><i>DRESS CODE</i><p>Y2K · INDO-WESTERN</p></div></div><div className="qr-box">{pass.qr_code_data_url ? <img src={pass.qr_code_data_url} alt="Entry QR code" crossOrigin="anonymous" /> : <QrCode size={140} />}</div><div className="pass-id ticket-fullrow">PASS ID · #{pass.qr_code_id || "PENDING"}</div></div><div className="ticket-foot"><span><span className="status-dot" />STATUS · {pass.status === "scanned" ? "ADMITTED" : "CONFIRMED"}</span><div className="ticket-actions"><button data-testid="copy-pass-button" onClick={() => { navigator.clipboard?.writeText(pass.qr_code_id || ""); onNotice("Pass ID copied to clipboard."); }}><Copy size={14} /> COPY</button><button data-testid="download-pass-button" onClick={download} disabled={busy === "download"}><Download size={14} /> {busy === "download" ? "SAVING..." : "PNG"}</button><button data-testid="share-pass-button" onClick={share} disabled={busy === "share"}><Share2 size={14} /> {busy === "share" ? "SHARING..." : "SHARE"}</button></div></div></div></div>}{!pass && <div className="empty-state" data-testid="empty-pass-state"><Ticket size={32} /><p>No active pass yet.</p><small>Register first or look up an existing pass above.</small><button className="primary-cta" style={{ marginTop: 22 }} data-testid="empty-pass-register-button" onClick={() => go?.("join")}>REGISTER NOW <ArrowRight size={17} /></button></div>}</section>;
}

function Contacts() { return <section className="content-page"><PageTitle kicker="OPEN CHANNELS" title="THE CREW" desc="Questions, directions, or a last-minute signal? Reach the organizing team." /><div className="crew-grid">{[["AMRUTH P", "GENERAL SECRETARY", "7019475272"], ["GP", "PORTAL + GATE OPS", "9632270887"]].map(([name, role, phone]) => <article className="crew-card" key={name}><div className="avatar">{name.slice(0, 2)}</div><span className="section-kicker">{role}</span><h2>{name}</h2><p>Direct contact for event questions, entry passes, directions, and coordination.</p><a data-testid={`call-${name.toLowerCase().replace(" ", "-")}`} href={`tel:${phone}`}><DoorOpen size={16} /> {phone}</a></article>)}</div><div className="venue-line"><MapPin size={20} /><span>KLE Technological University · Gokul Campus, Hubballi</span><ExternalLink size={16} /></div></section> }

function Scanner({ isAdmin, onAdmin }) {
  const [code, setCode] = useState("FF-TEST-001");
  const [result, setResult] = useState("");
  const [cameraOn, setCameraOn] = useState(false);
  const [cameraState, setCameraState] = useState("Camera is off");
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const frameRef = useRef(null);
  const busyRef = useRef(false);

  const verify = async (value) => {
    if (!value || busyRef.current) return;
    busyRef.current = true;
    setCode(value);
    try {
      const token = sessionStorage.getItem("frenzy_admin_token");
      const res = await fetch(`${API}/scan`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token || ""}` }, body: JSON.stringify({ qr_code_id: value }) });
      const data = await res.json();
      setResult(data.message || data.detail || data.error || "Scan complete");
    } catch {
      setResult("Scanner offline — check the gate connection.");
    } finally {
      setTimeout(() => { busyRef.current = false; }, 900);
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    setCameraOn(false);
    setCameraState("Camera is off");
  };

  const startCamera = async () => {
    if (!navigator.mediaDevices?.getUserMedia) { setCameraState("Camera unavailable — use manual entry"); return; }
    if (!window.BarcodeDetector) { setCameraState("QR camera unsupported — use manual entry"); return; }
    try {
      const detector = new window.BarcodeDetector({ formats: ["qr_code"] });
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false });
      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      setCameraOn(true);
      setCameraState("Live — point at a QR pass");
      const detect = async () => {
        if (!videoRef.current || videoRef.current.readyState < 2) { frameRef.current = requestAnimationFrame(detect); return; }
        try {
          const codes = await detector.detect(videoRef.current);
          if (codes[0]?.rawValue) { await verify(codes[0].rawValue.trim()); stopCamera(); return; }
        } catch { setCameraState("Hold the QR inside the frame"); }
        frameRef.current = requestAnimationFrame(detect);
      };
      detect();
    } catch { setCameraState("Camera permission denied — use manual entry"); stopCamera(); }
  };

  useEffect(() => () => stopCamera(), []);
  if (!isAdmin) return <section className="content-page narrow"><PageTitle kicker="SECURE CHANNEL" title="GATE SCANNER" desc="Admin-only entry verification for the main entrance." /><div className="locked-panel"><Shield size={42} /><h2>ADMIN ACCESS REQUIRED</h2><button className="primary-cta" data-testid="scanner-login-button" onClick={onAdmin}>UNLOCK SCANNER <ArrowRight size={17} /></button></div></section>;
  return <section className="content-page narrow"><PageTitle kicker="SECURE CHANNEL" title="GATE SCANNER" desc="Point the camera at a QR pass or use the manual fallback." /><div className="scanner-panel"><div className="viewfinder"><video ref={videoRef} data-testid="scanner-camera-feed" muted playsInline /><div className="scan-target"><span /><span /><span /><span /></div>{!cameraOn && <div className="camera-placeholder"><ScanLine size={48} /><b>CAMERA STANDBY</b></div>}<small data-testid="camera-status">{cameraState}</small></div><div className="scanner-actions"><button className="primary-cta" data-testid="camera-toggle-button" onClick={cameraOn ? stopCamera : startCamera}>{cameraOn ? "STOP CAMERA" : "START CAMERA"} <ScanLine size={17} /></button><div className="manual-row"><input data-testid="manual-scan-input" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="FF-TEST-001" /><button className="ghost-cta" data-testid="manual-scan-button" onClick={() => verify(code)}>VERIFY MANUALLY <Check size={17} /></button></div></div>{result && <p className="scan-result" data-testid="scan-result">{result}</p>}</div></section>;
}
function Admin({ isAdmin, onAdmin, onLogout }) {
  const [stats, setStats] = useState({ total: 0, admitted: 0, pending: 0 });
  const [open, setOpen] = useState("ops");
  useEffect(() => { if (!isAdmin) return; const token = sessionStorage.getItem("frenzy_admin_token"); fetch(`${API}/stats`, { headers: { Authorization: `Bearer ${token || ""}` } }).then((r) => r.json()).then((d) => { if (d && typeof d === "object") setStats({ total: d.total_registered ?? 0, admitted: d.total_scanned ?? 0, pending: d.total_pending ?? 0 }); }).catch(() => {}); }, [isAdmin]);
  if (!isAdmin) return <section className="content-page"><PageTitle kicker="CONTROL ROOM" title="COMMAND CENTER" desc="Manage the event pulse, registrations, and entry operations." /><div className="locked-panel"><Shield size={42} /><h2>PORTAL LOCKED</h2><button className="primary-cta" data-testid="admin-login-page-button" onClick={onAdmin}>SIGN IN AS ADMIN <ArrowRight size={17} /></button></div></section>;
  const sections = [
    { id: "ops", label: "SYSTEM STATUS", icon: Activity, rows: [["Registration API", "ONLINE"], ["Gate Scanner", "READY"], ["Projector Feed", "SYNCED"], ["Data Layer", "IN-MEMORY (DEMO)"]] },
    { id: "events", label: "EVENT DETAILS", icon: CalendarDays, rows: [["Event", "Freshers '26"], ["Host", "B.Com Association"], ["Campus", "KLE Tech · Gokul"], ["Dates", "01–02 Sept 2026"], ["Gates Open", "09:00 IST"]] },
    { id: "team", label: "OPERATIONS TEAM", icon: Users, rows: [["Amruth P", "General Secretary"], ["GP", "Portal + Gate Ops"], ["Faculty Coordinators", "3 assigned"]] },
  ];
  return <section className="content-page"><PageTitle kicker="CONTROL ROOM" title="COMMAND CENTER" desc="Manage the event pulse, registrations, and entry operations." /><div className="admin-shell"><div className="admin-hero" data-testid="admin-hero"><div><span className="section-kicker">SYSTEM STATUS</span><h2>ALL CHANNELS<br /><em>OPERATIONAL</em></h2><div className="admin-stats" data-testid="admin-stats"><div className="admin-stat"><span>REGISTRATIONS</span><b data-testid="stat-total">{stats.total}</b><small>Freshers &apos;26</small></div><div className="admin-stat"><span>ADMITTED</span><b data-testid="stat-admitted">{stats.admitted}</b><small>at gate</small></div><div className="admin-stat"><span>PENDING</span><b data-testid="stat-pending">{stats.pending}</b><small>awaiting scan</small></div></div></div><button data-testid="admin-logout-button" onClick={onLogout} className="ghost-cta">LOG OUT</button></div>{sections.map(({ id, label, icon: Icon, rows }) => <div className="admin-section" key={id} data-testid={`admin-section-${id}`}><button className="admin-section-head" data-testid={`admin-section-toggle-${id}`} onClick={() => setOpen(open === id ? null : id)}><span style={{ display: "flex", gap: 10, alignItems: "center" }}><Icon size={16} /> {label}</span><strong>{open === id ? "COLLAPSE −" : "EXPAND +"}</strong></button><AnimatePresence>{open === id && <motion.div className="admin-section-body" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}><ul>{rows.map(([k, v]) => <li key={k}><span>{k}</span><i>{v}</i></li>)}</ul></motion.div>}</AnimatePresence></div>)}</div></section>;
}
function Letter({ onClose, onContinue }) { return <div className="modal-backdrop"><motion.div initial={{ opacity: 0, scale: .92, rotate: -1 }} animate={{ opacity: 1, scale: 1, rotate: 0 }} className="letter-modal" data-testid="invitation-modal"><button className="modal-close" data-testid="close-invitation-button" onClick={onClose}><X /></button><span className="section-kicker">BAS / OFFICIAL TRANSMISSION</span><h2>A GOLDEN<br /><em>INVITATION</em></h2><p>Dear Freshers,</p><p>Welcome to the beginning of your most exciting college years. The BCom Association, seniors, student council, and faculty invite you to two unforgettable days of games, music, food, and camaraderie.</p><p>Bring your brightest smile. Your next chapter starts here.</p><strong>WITH WARMTH,<br />THE BAS CREW ✦</strong><button className="primary-cta" data-testid="invitation-continue-button" onClick={onContinue}>CONTINUE TO REGISTRATION <ArrowRight size={17} /></button></motion.div></div> }
function AdminModal({ onClose, onSuccess }) { const [email, setEmail] = useState("admin@frenzy.edu"); const [password, setPassword] = useState("frenzy2024"); const [error, setError] = useState(""); const [loading, setLoading] = useState(false); const submit = async (e) => { e.preventDefault(); setLoading(true); setError(""); try { const res = await fetch(`${API}/admin/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) }); const data = await res.json().catch(() => ({})); if (!res.ok || !data.token) throw new Error(data.detail || data.error || "Access denied"); onSuccess(data.token); } catch (err) { setError(err.message || "Access denied"); } finally { setLoading(false); } }; return <div className="modal-backdrop"><motion.form initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="admin-modal" onSubmit={submit} data-testid="admin-login-modal"><button type="button" className="modal-close" data-testid="close-admin-modal" onClick={onClose}><X /></button><Shield size={32} /><span className="section-kicker">RESTRICTED CHANNEL</span><h2>ADMIN AUTH</h2><input data-testid="admin-email-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} /><input data-testid="admin-password-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />{error && <div className="form-error" data-testid="admin-login-error"><Zap size={15} /> {error}</div>}<button className="primary-cta" data-testid="admin-submit-button" disabled={loading}>{loading ? "VERIFYING..." : "VERIFY ACCESS"} <ArrowRight size={17} /></button></motion.form></div> }

export default function RoutedApp() { return <BrowserRouter><App /></BrowserRouter>; }