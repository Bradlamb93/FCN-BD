
import React, { useState } from "react";

const MARGIN_PH = 6;
const DEFAULT_REPS = ["Mia", "Adam", "Carmen", "Kye"];
const METRICS = [
  "Service calls per day",
  "Reactivated clients",
  "Days of client meetings per month",
  "New clients per month",
];
const METRIC_SHORT = ["Service Calls", "Reactivated", "Meeting Days", "New Clients"];
const PIPELINE_STAGES = ["Cold / Untouched", "Contacted", "Meeting Booked", "Terms Sent", "Signed (Awaiting First Fill)", "Active (Billing)"];
const PIPE_SHORT = ["Cold", "Contacted", "Meeting", "Terms Sent", "Signed", "Active"];
const PIPE_COLORS = ["#8E8E93", "#FF9500", "#FF3B30", "#AF52DE", "#34C759", "#007AFF"];

const fmtDate = (str) => {
  if (!str) return "";
  const d = new Date(str + "T12:00:00");
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
};
const fmtWeekRange = (str) => {
  if (!str) return "";
  const mon = new Date(str + "T12:00:00");
  const fri = new Date(mon); fri.setDate(mon.getDate() + 4);
  const fmt = (dt) => dt.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  return `${fmt(mon)} \u2013 ${fmt(fri)}`;
};

const CLIENT_STATUS = ["New Lead", "Progressing", "Stalled", "No Activity"];
const STATUS_COLORS = { "New Lead": "#007AFF", "Progressing": "#34C759", "Stalled": "#FF9500", "No Activity": "#FF3B30" };

function initData(reps) {
  const activity = {}, repNotes = {};
  reps.forEach((r) => {
    activity[r] = { target: {}, actual: {} };
    METRICS.forEach((m) => { activity[r].target[m] = ""; activity[r].actual[m] = ""; });
    repNotes[r] = { summary: "", clients: [{ name: "", stage: "Contacted", hours: "", notes: "", lastContact: "", nextAction: "", status: "New Lead", closeDate: "" }] };
  });
  const pipeline = {};
  PIPELINE_STAGES.forEach((s) => { pipeline[s] = { count: "", hours: "" }; });
  return { activity, pipeline, repNotes, highlights: "", risks: "", nextWeek: "" };
}

const font = "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Helvetica Neue', sans-serif";
const card = { background: "#fff", borderRadius: 16, padding: "20px 24px", boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.04)" };
const inp = { border: "none", background: "#F2F2F7", borderRadius: 8, padding: "7px 10px", fontSize: 14, fontFamily: font, outline: "none", transition: "background 0.2s" };
const label = { fontSize: 11, fontWeight: 600, color: "#86868B", textTransform: "uppercase", letterSpacing: 0.6 };
const blue = "#007AFF";
const green = "#34C759";
const orange = "#FF9500";
const red = "#FF3B30";

function Ring({ pct, size = 44, stroke = 5, color = blue }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const p = Math.min(Math.max(pct || 0, 0), 150);
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#F2F2F7" strokeWidth={stroke} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={circ * (1 - p / 100)} strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 0.6s ease" }} />
    </svg>
  );
}

function Bar({ pct, color = blue, height = 6 }) {
  const p = Math.min(Math.max(pct || 0, 0), 100);
  return (
    <div style={{ background: "#F2F2F7", borderRadius: height / 2, height, width: "100%", overflow: "hidden" }}>
      <div style={{ background: color, height: "100%", width: `${p}%`, borderRadius: height / 2, transition: "width 0.5s ease" }} />
    </div>
  );
}

export default function App() {
  const [reps, setReps] = useState([...DEFAULT_REPS]);
  const [newRep, setNewRep] = useState("");
  const [week, setWeek] = useState("2026-03-30");
  const [data, setData] = useState(initData(DEFAULT_REPS));
  const [view, setView] = useState("input");
  const [activeRep, setActiveRep] = useState(null);

  const updateActivity = (rep, type, metric, val) => setData(d => ({ ...d, activity: { ...d.activity, [rep]: { ...d.activity[rep], [type]: { ...d.activity[rep][type], [metric]: val } } } }));
  const updatePipeline = (stage, field, val) => setData(d => ({ ...d, pipeline: { ...d.pipeline, [stage]: { ...d.pipeline[stage], [field]: val } } }));
  const updateRepNotes = (rep, field, val) => setData(d => ({ ...d, repNotes: { ...d.repNotes, [rep]: { ...d.repNotes[rep], [field]: val } } }));
  const updateClient = (rep, idx, field, val) => setData(d => { const c = [...(d.repNotes[rep]?.clients || [])]; c[idx] = { ...c[idx], [field]: val }; return { ...d, repNotes: { ...d.repNotes, [rep]: { ...d.repNotes[rep], clients: c } } }; });
  const addClient = (rep) => setData(d => ({ ...d, repNotes: { ...d.repNotes, [rep]: { ...d.repNotes[rep], clients: [...(d.repNotes[rep]?.clients || []), { name: "", stage: "Contacted", hours: "", notes: "", lastContact: "", nextAction: "", status: "New Lead", closeDate: "" }] } } }));
  const removeClient = (rep, idx) => setData(d => { const c = (d.repNotes[rep]?.clients || []).filter((_, i) => i !== idx); return { ...d, repNotes: { ...d.repNotes, [rep]: { ...d.repNotes[rep], clients: c.length ? c : [{ name: "", stage: "Contacted", hours: "", notes: "", lastContact: "", nextAction: "", status: "New Lead", closeDate: "" }] } } }; });
  const addRep = () => { if (newRep.trim() && !reps.includes(newRep.trim())) { const n = newRep.trim(); setReps([...reps, n]); setData(d => { const a = { target: {}, actual: {} }; METRICS.forEach(m => { a.target[m] = ""; a.actual[m] = ""; }); return { ...d, activity: { ...d.activity, [n]: a }, repNotes: { ...d.repNotes, [n]: { summary: "", clients: [{ name: "", stage: "Contacted", hours: "", notes: "", lastContact: "", nextAction: "", status: "New Lead", closeDate: "" }] } } }; }); setNewRep(""); } };
  const removeRep = (rep) => { if (reps.length <= 1) return; setReps(reps.filter(r => r !== rep)); setData(d => { const { [rep]: _a, ...ra } = d.activity; const { [rep]: _n, ...rn } = d.repNotes; return { ...d, activity: ra, repNotes: rn }; }); };

  const weekLabel = fmtWeekRange(week);
  const repClientHours = (rep) => (data.repNotes[rep]?.clients || []).reduce((s, c) => s + (parseFloat(c.hours) || 0), 0);
  const repActiveClients = (rep) => (data.repNotes[rep]?.clients || []).filter(c => c.name.trim()).length;

  // Auto-calculate pipeline from client data
  const allClients = reps.flatMap(r => (data.repNotes[r]?.clients || []).filter(c => c.name.trim()).map(c => ({ ...c, rep: r })));
  const computedPipeline = PIPELINE_STAGES.map(stage => {
    const inStage = allClients.filter(c => c.stage === stage);
    return { stage, count: inStage.length, hours: inStage.reduce((s, c) => s + (parseFloat(c.hours) || 0), 0) };
  });
  const totalHours = computedPipeline.reduce((s, p) => s + p.hours, 0);
  const totalCount = computedPipeline.reduce((s, p) => s + p.count, 0);

  const teamMetric = (m) => {
    const t = reps.reduce((s, r) => s + (parseInt(data.activity[r]?.target[m]) || 0), 0);
    const a = reps.reduce((s, r) => s + (parseInt(data.activity[r]?.actual[m]) || 0), 0);
    return { target: t, actual: a, pct: t > 0 ? Math.round((a / t) * 100) : null };
  };
  const repMetric = (rep, m) => {
    const t = parseInt(data.activity[rep]?.target[m]) || 0;
    const a = parseInt(data.activity[rep]?.actual[m]) || 0;
    return { target: t, actual: a, pct: t > 0 ? Math.round((a / t) * 100) : null };
  };
  const pctColor = (p) => p === null ? "#86868B" : p >= 100 ? green : p >= 75 ? orange : red;
  const overallTeamPct = (() => {
    let tT = 0, tA = 0;
    METRICS.forEach(m => { const d = teamMetric(m); tT += d.target; tA += d.actual; });
    return tT > 0 ? Math.round((tA / tT) * 100) : null;
  })();

  const wrap = { fontFamily: font, maxWidth: 960, margin: "0 auto", padding: 20, color: "#1D1D1F", background: "#F5F5F7", minHeight: "100vh" };
  const printWrap = { fontFamily: font, maxWidth: 960, margin: "0 auto", padding: 20, color: "#1D1D1F", background: "#fff", minHeight: "100vh" };

  // ======================== REP DETAIL ========================
  if (activeRep) {
    const rep = activeRep;
    const notes = data.repNotes[rep] || { summary: "", clients: [] };
    const clients = notes.clients || [];
    const totalRepHours = repClientHours(rep);
    return (
      <div style={wrap}>
        <button onClick={() => setActiveRep(null)} style={{ background: "none", border: "none", color: blue, fontSize: 15, cursor: "pointer", fontFamily: font, fontWeight: 500, padding: 0, marginBottom: 20 }}>&larr; Back</button>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
          <div style={{ width: 52, height: 52, borderRadius: "50%", background: `linear-gradient(135deg, ${blue}, #5856D6)`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 20, fontWeight: 700 }}>{rep[0]}</div>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: -0.5 }}>{rep}</h1>
            <p style={{ color: "#86868B", fontSize: 14 }}>{weekLabel} &middot; {repActiveClients(rep)} clients &middot; {totalRepHours} hrs/wk</p>
          </div>
        </div>

        {/* Activity cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12, marginBottom: 20 }}>
          {METRICS.map((m, i) => {
            const d = repMetric(rep, m);
            const col = pctColor(d.pct);
            return (
              <div key={m} style={{ ...card, padding: "16px 18px" }}>
                <div style={{ fontSize: 11, color: "#86868B", fontWeight: 500, marginBottom: 8 }}>{METRIC_SHORT[i]}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <Ring pct={d.pct || 0} size={40} stroke={4} color={col} />
                  <div>
                    <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: -0.5, color: col }}>{d.actual}</div>
                    <div style={{ fontSize: 12, color: "#86868B" }}>of {d.target} target</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Commentary */}
        <div style={{ ...card, marginBottom: 16 }}>
          <div style={label}>Weekly Commentary</div>
          <textarea value={notes.summary} onChange={e => updateRepNotes(rep, "summary", e.target.value)}
            placeholder="Coaching points, blockers, standout performance, development areas..."
            rows={3} style={{ ...inp, width: "100%", marginTop: 8, resize: "vertical" }} />
        </div>

        {/* Clients */}
        <div style={{ ...card, marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div style={label}>Client / Prospect Tracker</div>
            <div style={{ fontSize: 12, color: "#86868B" }}>&pound;{MARGIN_PH}/hr margin</div>
          </div>
          {clients.map((c, idx) => (
            <div key={idx} style={{ background: "#F9F9FB", borderRadius: 12, padding: "14px 16px", marginBottom: 10, position: "relative", borderLeft: `3px solid ${STATUS_COLORS[c.status] || "#C7C7CC"}` }}>
              <button onClick={() => removeClient(rep, idx)} style={{ position: "absolute", top: 10, right: 14, background: "none", border: "none", color: "#C7C7CC", cursor: "pointer", fontSize: 18 }}>&times;</button>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 130px 100px 100px", gap: 10, marginBottom: 8 }}>
                <div>
                  <div style={{ ...label, marginBottom: 4 }}>Client Name</div>
                  <input value={c.name} onChange={e => updateClient(rep, idx, "name", e.target.value)} placeholder="e.g. Sunrise Care Homes" style={{ ...inp, width: "100%" }} />
                </div>
                <div>
                  <div style={{ ...label, marginBottom: 4 }}>Stage</div>
                  <select value={c.stage} onChange={e => updateClient(rep, idx, "stage", e.target.value)} style={{ ...inp, width: "100%" }}>
                    {PIPELINE_STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <div style={{ ...label, marginBottom: 4 }}>Status</div>
                  <select value={c.status || "New Lead"} onChange={e => updateClient(rep, idx, "status", e.target.value)} style={{ ...inp, width: "100%", color: STATUS_COLORS[c.status] || "#333", fontWeight: 600 }}>
                    {CLIENT_STATUS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <div style={{ ...label, marginBottom: 4 }}>Hrs/Week</div>
                  <input value={c.hours} onChange={e => updateClient(rep, idx, "hours", e.target.value)} placeholder="0" type="number" style={{ ...inp, width: "100%" }} />
                  {c.hours && <div style={{ fontSize: 10, color: blue, marginTop: 3 }}>&pound;{(parseFloat(c.hours) * MARGIN_PH * 52).toLocaleString()}/yr</div>}
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "140px 140px 1fr", gap: 10, marginBottom: 8 }}>
                <div>
                  <div style={{ ...label, marginBottom: 4 }}>Last Contact</div>
                  <input type="date" value={c.lastContact || ""} onChange={e => updateClient(rep, idx, "lastContact", e.target.value)} style={{ ...inp, width: "100%" }} />
                </div>
                <div>
                  <div style={{ ...label, marginBottom: 4 }}>Est. Close Date</div>
                  <input type="date" value={c.closeDate || ""} onChange={e => updateClient(rep, idx, "closeDate", e.target.value)} style={{ ...inp, width: "100%" }} />
                </div>
                <div>
                  <div style={{ ...label, marginBottom: 4 }}>Next Action</div>
                  <input value={c.nextAction || ""} onChange={e => updateClient(rep, idx, "nextAction", e.target.value)} placeholder="e.g. Follow up call Thursday, send proposal..." style={{ ...inp, width: "100%" }} />
                </div>
              </div>
              <div>
                <div style={{ ...label, marginBottom: 4 }}>Notes</div>
                <textarea value={c.notes} onChange={e => updateClient(rep, idx, "notes", e.target.value)} placeholder="Key contacts, objections, competitive intel..." rows={2} style={{ ...inp, width: "100%", resize: "vertical" }} />
              </div>
            </div>
          ))}
          <button onClick={() => addClient(rep)} style={{ width: "100%", padding: 10, background: "none", border: `1.5px dashed #C7C7CC`, borderRadius: 10, color: blue, fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: font }}>+ Add Client</button>
          {totalRepHours > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginTop: 14 }}>
              {[["Hours/Week", totalRepHours], ["Weekly Margin", `\u00A3${(totalRepHours * MARGIN_PH).toLocaleString()}`], ["Annual Margin", `\u00A3${(totalRepHours * MARGIN_PH * 52).toLocaleString()}`]].map(([l, v]) => (
                <div key={l} style={{ background: "#F9F9FB", borderRadius: 10, padding: "10px 14px", textAlign: "center" }}>
                  <div style={{ fontSize: 10, color: "#86868B", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.4 }}>{l}</div>
                  <div style={{ fontSize: 20, fontWeight: 700, marginTop: 2 }}>{v}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ======================== INPUT VIEW ========================
  if (view === "input") {
    return (
      <div style={wrap}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 30, fontWeight: 700, letterSpacing: -0.7 }}>BD Weekly Tracker</h1>
          <p style={{ color: "#86868B", fontSize: 15, marginTop: 4 }}>FCN Group &middot; Business Development</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 14, marginBottom: 20 }}>
          <div style={card}>
            <div style={label}>Week Commencing</div>
            <input type="date" value={week} onChange={e => setWeek(e.target.value)} style={{ ...inp, width: "100%", marginTop: 8 }} />
            {week && <div style={{ fontSize: 12, color: "#86868B", marginTop: 6 }}>{fmtWeekRange(week)}</div>}
          </div>
          <div style={card}>
            <div style={label}>Team Members</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
              {reps.map(r => (
                <span key={r} style={{ background: "#F2F2F7", padding: "5px 12px", borderRadius: 20, fontSize: 13, fontWeight: 500, display: "flex", alignItems: "center", gap: 6 }}>
                  {r}<button onClick={() => removeRep(r)} style={{ background: "none", border: "none", cursor: "pointer", color: "#C7C7CC", fontSize: 14 }}>&times;</button>
                </span>
              ))}
              <span style={{ display: "flex", gap: 4, alignItems: "center" }}>
                <input value={newRep} onChange={e => setNewRep(e.target.value)} onKeyDown={e => e.key === "Enter" && addRep()} placeholder="Add..." style={{ ...inp, width: 100, borderRadius: 20, padding: "6px 12px" }} />
                <button onClick={() => addRep()} style={{ background: blue, color: "#fff", border: "none", borderRadius: 20, minWidth: 32, height: 32, cursor: "pointer", fontSize: 18, fontWeight: 500, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, padding: 0, lineHeight: 1 }}>+</button>
              </span>
            </div>
          </div>
        </div>

        {/* Activity */}
        <div style={{ ...card, marginBottom: 20, padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "18px 24px 12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 17, fontWeight: 600 }}>Activity KPIs</div>
              <div style={{ fontSize: 12, color: "#86868B", marginTop: 2 }}>Tap a name to open rep detail with client tracking</div>
            </div>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #E5E5EA" }}>
                  <th style={{ padding: "8px 14px", textAlign: "left", fontSize: 11, color: "#86868B", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.3 }}>Metric</th>
                  {reps.map(r => (
                    <th key={r} colSpan={2} style={{ padding: "8px 6px", textAlign: "center" }}>
                      <span onClick={() => setActiveRep(r)} style={{ color: blue, cursor: "pointer", fontWeight: 600, fontSize: 13 }}>{r}</span>
                    </th>
                  ))}
                </tr>
                <tr style={{ borderBottom: "1px solid #F2F2F7" }}>
                  <th></th>
                  {reps.map(r => (
                    <React.Fragment key={r}>
                      <th style={{ padding: "4px 6px", textAlign: "center", fontSize: 10, color: "#86868B", fontWeight: 500 }}>Target</th>
                      <th style={{ padding: "4px 6px", textAlign: "center", fontSize: 10, color: "#86868B", fontWeight: 500 }}>Actual</th>
                    </React.Fragment>
                  ))}
                </tr>
              </thead>
              <tbody>
                {METRICS.map((m, idx) => (
                  <tr key={m} style={{ borderBottom: "1px solid #F2F2F7" }}>
                    <td style={{ padding: "8px 14px", fontWeight: 500, fontSize: 13 }}>{m}</td>
                    {reps.map(r => {
                      const d = repMetric(r, m);
                      const col = pctColor(d.pct);
                      return (
                        <React.Fragment key={r}>
                          <td style={{ padding: "6px 4px", textAlign: "center" }}>
                            <input value={data.activity[r]?.target[m] || ""} onChange={e => updateActivity(r, "target", m, e.target.value)} style={{ ...inp, width: 48, textAlign: "center", padding: "5px 4px" }} />
                          </td>
                          <td style={{ padding: "6px 4px", textAlign: "center" }}>
                            <input value={data.activity[r]?.actual[m] || ""} onChange={e => updateActivity(r, "actual", m, e.target.value)} style={{ ...inp, width: 48, textAlign: "center", padding: "5px 4px", color: col, fontWeight: 600 }} />
                          </td>
                        </React.Fragment>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Rep cards */}
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(reps.length, 4)}, 1fr)`, gap: 12, marginBottom: 20 }}>
          {reps.map(r => {
            const hrs = repClientHours(r); const cls = repActiveClients(r);
            return (
              <div key={r} onClick={() => setActiveRep(r)} style={{ ...card, cursor: "pointer", padding: "16px 18px", transition: "transform 0.15s, box-shadow 0.15s" }}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.08)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = card.boxShadow; }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                  <div style={{ width: 32, height: 32, borderRadius: "50%", background: `linear-gradient(135deg, ${blue}, #5856D6)`, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700 }}>{r[0]}</div>
                  <div style={{ fontWeight: 600, fontSize: 15 }}>{r}</div>
                </div>
                <div style={{ fontSize: 12, color: "#86868B" }}>{cls} client{cls !== 1 ? "s" : ""} &middot; {hrs} hrs/wk</div>
                <div style={{ fontSize: 12, color: blue, marginTop: 4, fontWeight: 500 }}>View detail &rarr;</div>
              </div>
            );
          })}
        </div>

        {/* Pipeline - auto-calculated from client data */}
        <div style={{ ...card, marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
            <div style={{ fontSize: 17, fontWeight: 600 }}>Pipeline Summary</div>
            <div style={{ fontSize: 12, color: "#86868B" }}>&pound;{MARGIN_PH}/hr margin</div>
          </div>
          <div style={{ fontSize: 12, color: "#86868B", marginBottom: 14 }}>Auto-calculated from client data below</div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, maxWidth: 640 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #E5E5EA" }}>
                {["Stage", "Prospects", "Hrs/Week", "Weekly £", "Annual £"].map((h, i) => (
                  <th key={h} style={{ padding: "8px 10px", textAlign: i > 1 ? "right" : i === 1 ? "center" : "left", fontSize: 11, color: "#86868B", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.3 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {computedPipeline.map((p, idx) => (
                <tr key={p.stage} style={{ borderBottom: "1px solid #F2F2F7" }}>
                  <td style={{ padding: "8px 10px", fontWeight: 500 }}><span style={{ display: "inline-block", width: 8, height: 8, borderRadius: 4, background: PIPE_COLORS[idx], marginRight: 8 }} />{p.stage}</td>
                  <td style={{ padding: "8px 10px", textAlign: "center" }}>{p.count || "\u2014"}</td>
                  <td style={{ padding: "8px 10px", textAlign: "right" }}>{p.hours || "\u2014"}</td>
                  <td style={{ padding: "8px 10px", textAlign: "right", fontWeight: 500 }}>{p.hours > 0 ? `\u00A3${(p.hours * MARGIN_PH).toLocaleString()}` : "\u2014"}</td>
                  <td style={{ padding: "8px 10px", textAlign: "right", fontWeight: 600 }}>{p.hours > 0 ? `\u00A3${(p.hours * MARGIN_PH * 52).toLocaleString()}` : "\u2014"}</td>
                </tr>
              ))}
              <tr style={{ borderTop: "2px solid #E5E5EA" }}>
                <td style={{ padding: "10px 10px", fontWeight: 700 }}>Total</td>
                <td style={{ padding: "10px 10px", textAlign: "center", fontWeight: 700 }}>{totalCount}</td>
                <td style={{ padding: "10px 10px", textAlign: "right", fontWeight: 700 }}>{totalHours}</td>
                <td style={{ padding: "10px 10px", textAlign: "right", fontWeight: 700, color: blue }}>&pound;{(totalHours * MARGIN_PH).toLocaleString()}</td>
                <td style={{ padding: "10px 10px", textAlign: "right", fontWeight: 700 }}>&pound;{(totalHours * MARGIN_PH * 52).toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Active Pursuits */}
        <div style={{ ...card, marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
            <div style={{ fontSize: 17, fontWeight: 600 }}>Active Pursuits</div>
            <div style={{ fontSize: 12, color: "#86868B" }}>Click &lsquo;Manage&rsquo; to add clients per rep</div>
          </div>
          <div style={{ fontSize: 12, color: "#86868B", marginBottom: 14 }}>Track specific clients per rep to spot tail-offs and repeated names without progress</div>
          {reps.map(r => {
            const clients = (data.repNotes[r]?.clients || []);
            const named = clients.filter(c => c.name.trim());
            return (
              <div key={r} style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <div style={{ width: 26, height: 26, borderRadius: "50%", background: `linear-gradient(135deg, ${blue}, #5856D6)`, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700 }}>{r[0]}</div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{r}</div>
                  <span style={{ fontSize: 11, color: "#86868B", marginLeft: 4 }}>{named.length} active</span>
                  <button onClick={() => setActiveRep(r)} style={{ marginLeft: "auto", background: "none", border: "none", color: blue, fontSize: 12, cursor: "pointer", fontWeight: 500, fontFamily: font }}>Manage &rarr;</button>
                </div>
                {named.length > 0 ? (
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                      <thead>
                        <tr style={{ borderBottom: "1px solid #E5E5EA" }}>
                          {["Client", "Stage", "Status", "Last Contact", "Est. Close", "Next Action", "Hrs/Wk"].map(h => (
                            <th key={h} style={{ padding: "6px 8px", textAlign: "left", fontSize: 10, color: "#86868B", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.3 }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {named.map((c, i) => (
                          <tr key={i} style={{ borderBottom: "1px solid #F2F2F7" }}>
                            <td style={{ padding: "7px 8px", fontWeight: 500 }}>{c.name}</td>
                            <td style={{ padding: "7px 8px" }}>{c.stage}</td>
                            <td style={{ padding: "7px 8px" }}>
                              <span style={{ display: "inline-block", padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 600, background: `${STATUS_COLORS[c.status] || "#86868B"}18`, color: STATUS_COLORS[c.status] || "#86868B" }}>{c.status || "New Lead"}</span>
                            </td>
                            <td style={{ padding: "7px 8px", color: c.lastContact ? "#1D1D1F" : "#C7C7CC" }}>{c.lastContact ? fmtDate(c.lastContact) : "Not set"}</td>
                            <td style={{ padding: "7px 8px", color: c.closeDate ? "#1D1D1F" : "#C7C7CC" }}>{c.closeDate ? fmtDate(c.closeDate) : "Not set"}</td>
                            <td style={{ padding: "7px 8px", color: c.nextAction ? "#1D1D1F" : "#C7C7CC", maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.nextAction || "None"}</td>
                            <td style={{ padding: "7px 8px", fontWeight: 600 }}>{c.hours || "\u2014"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div style={{ padding: "12px 16px", background: "#F9F9FB", borderRadius: 10, fontSize: 13, color: "#C7C7CC", textAlign: "center" }}>
                    No clients added &mdash; <span onClick={() => setActiveRep(r)} style={{ color: blue, cursor: "pointer", fontWeight: 500 }}>add via rep detail</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Commentary */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 16 }}>
          {[["highlights", "Wins & Highlights", "New sign-ups, first fills, standout performance..."], ["risks", "Risks & Escalations", "Stalled deals, competitor activity, resource issues..."]].map(([k, l, ph]) => (
            <div key={k} style={card}>
              <div style={label}>{l}</div>
              <textarea value={data[k]} onChange={e => setData({ ...data, [k]: e.target.value })} placeholder={ph} rows={3} style={{ ...inp, width: "100%", marginTop: 8, resize: "vertical" }} />
            </div>
          ))}
        </div>
        <div style={{ ...card, marginBottom: 20 }}>
          <div style={label}>Next Week Focus</div>
          <textarea value={data.nextWeek} onChange={e => setData({ ...data, nextWeek: e.target.value })} placeholder="Key priorities for next week..." rows={2} style={{ ...inp, width: "100%", marginTop: 8, resize: "vertical" }} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <button onClick={() => setView("kpi")} style={{ padding: 14, background: "#fff", color: "#1D1D1F", border: "1px solid #E5E5EA", borderRadius: 14, fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: font, letterSpacing: -0.2 }}>
            Print KPI Sheet
          </button>
          <button onClick={() => setView("report")} style={{ padding: 14, background: "#1D1D1F", color: "#fff", border: "none", borderRadius: 14, fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: font, letterSpacing: -0.2 }}>
            Dashboard Report &rarr;
          </button>
        </div>
      </div>
    );
  }

  // ======================== DASHBOARD REPORT ========================
  if (view === "report") {
    return (
      <div style={printWrap}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <button onClick={() => setView("input")} style={{ background: "none", border: "none", color: blue, fontSize: 15, cursor: "pointer", fontFamily: font, fontWeight: 500 }}>&larr; Back to Input</button>
          <div style={{ fontSize: 12, color: "#86868B" }}>Use <strong>Ctrl+P</strong> (or Cmd+P) to print / save as PDF</div>
        </div>

      <div>
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 12, color: "#86868B", fontWeight: 500, textTransform: "uppercase", letterSpacing: 1 }}>FCN Group &middot; Business Development</div>
          <h1 style={{ fontSize: 30, fontWeight: 700, letterSpacing: -0.7, marginTop: 4 }}>Weekly Report</h1>
          <p style={{ color: "#86868B", fontSize: 14, marginTop: 4 }}>{weekLabel}</p>
        </div>

        {/* Top-level KPI cards */}
        <div className="dash-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 20 }}>
          <div className="dash-card" style={{ ...card, background: "#1D1D1F", color: "#fff" }}>
            <h4 style={{ ...label, color: "rgba(255,255,255,0.5)" }}>Team Performance</h4>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <Ring pct={overallTeamPct || 0} size={56} stroke={5} color={pctColor(overallTeamPct)} />
              <div>
                <div className="big-num" style={{ fontSize: 32, fontWeight: 700, letterSpacing: -0.5 }}>{overallTeamPct !== null ? `${overallTeamPct}%` : "—"}</div>
                <div className="sub-text" style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>of target across all KPIs</div>
              </div>
            </div>
          </div>
          <div className="dash-card" style={card}>
            <h4 style={label}>Pipeline Hours</h4>
            <div className="big-num" style={{ fontSize: 32, fontWeight: 700, letterSpacing: -0.5 }}>{totalHours}<span style={{ fontSize: 16, color: "#86868B", fontWeight: 500 }}> hrs/wk</span></div>
            <div className="sub-text" style={{ fontSize: 12, color: "#86868B", marginTop: 2 }}>&pound;{(totalHours * MARGIN_PH).toLocaleString()} weekly margin</div>
          </div>
          <div className="dash-card" style={card}>
            <h4 style={label}>Annual Margin (Pipeline)</h4>
            <div className="big-num" style={{ fontSize: 32, fontWeight: 700, letterSpacing: -0.5, color: blue }}>&pound;{(totalHours * MARGIN_PH * 52).toLocaleString()}</div>
            <div className="sub-text" style={{ fontSize: 12, color: "#86868B", marginTop: 2 }}>{totalCount} prospects in pipeline</div>
          </div>
        </div>

        {/* Activity breakdown */}
        <div style={{ ...card, marginBottom: 20 }}>
          <h2 style={{ fontSize: 17, fontWeight: 600, marginBottom: 16 }}>Activity Performance</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 14 }}>
            {METRICS.map((m, i) => {
              const d = teamMetric(m);
              const col = pctColor(d.pct);
              return (
                <div key={m} style={{ display: "flex", alignItems: "center", gap: 14, padding: "10px 0", borderBottom: i < METRICS.length - 2 ? "1px solid #F2F2F7" : "none" }}>
                  <Ring pct={d.pct || 0} size={38} stroke={4} color={col} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{METRIC_SHORT[i]}</div>
                    <div style={{ fontSize: 12, color: "#86868B" }}>{d.actual} of {d.target}</div>
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: col, minWidth: 48, textAlign: "right" }}>{d.pct !== null ? `${d.pct}%` : "—"}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Team & Pursuits - combined */}
        <h2 style={{ fontSize: 17, fontWeight: 600, marginBottom: 12 }}>Team &amp; Active Pursuits</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 20 }}>
          {reps.map(r => {
            const hrs = repClientHours(r);
            const clients = (data.repNotes[r]?.clients || []).filter(c => c.name.trim());
            const stalled = clients.filter(c => c.status === "Stalled" || c.status === "No Activity").length;
            let rT = 0, rA = 0;
            METRICS.forEach(m => { rT += parseInt(data.activity[r]?.target[m]) || 0; rA += parseInt(data.activity[r]?.actual[m]) || 0; });
            const rP = rT > 0 ? Math.round((rA / rT) * 100) : null;
            return (
              <div key={r} className="rep-card" style={card}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: "50%", background: `linear-gradient(135deg, ${blue}, #5856D6)`, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 700 }}>{r[0]}</div>
                  <div>
                    <div className="rep-name" style={{ fontWeight: 600, fontSize: 15 }}>{r}</div>
                    <div style={{ fontSize: 11, color: "#86868B" }}>{clients.length} client{clients.length !== 1 ? "s" : ""} &middot; {hrs} hrs/wk &middot; &pound;{(hrs * MARGIN_PH * 52).toLocaleString()}/yr</div>
                  </div>
                  <div style={{ display: "flex", gap: 6, marginLeft: "auto", alignItems: "center" }}>
                    {stalled > 0 && <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 5, background: "#FF3B3018", color: "#FF3B30" }}>{stalled} at risk</span>}
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 22, fontWeight: 700, color: pctColor(rP) }}>{rP !== null ? `${rP}%` : "\u2014"}</div>
                      <div style={{ fontSize: 10, color: "#86868B" }}>vs target</div>
                    </div>
                  </div>
                </div>
                {/* Mini metric bars */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 20px", marginBottom: clients.length > 0 ? 14 : 0 }}>
                  {METRICS.map((m, i) => {
                    const d = repMetric(r, m);
                    return (
                      <div key={m} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                        <div style={{ fontSize: 11, color: "#86868B", width: 90, flexShrink: 0 }}>{METRIC_SHORT[i]}</div>
                        <div style={{ flex: 1 }}><Bar pct={d.pct || 0} color={pctColor(d.pct)} /></div>
                        <div style={{ fontSize: 12, fontWeight: 600, minWidth: 36, textAlign: "right", color: pctColor(d.pct) }}>{d.actual}/{d.target}</div>
                      </div>
                    );
                  })}
                </div>
                {data.repNotes[r]?.summary && (
                  <div className="note-text" style={{ marginTop: 6, marginBottom: clients.length > 0 ? 12 : 0, padding: "8px 10px", background: "#F9F9FB", borderRadius: 8, fontSize: 12, color: "#3A3A3C", lineHeight: 1.5, whiteSpace: "pre-wrap" }}>{data.repNotes[r].summary}</div>
                )}
                {/* Client pursuit table */}
                {clients.length > 0 && (
                  <div style={{ borderTop: "1px solid #F2F2F7", paddingTop: 10 }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                      <thead>
                        <tr style={{ borderBottom: "1px solid #E5E5EA" }}>
                          {["Client", "Stage", "Status", "Last Contact", "Est. Close", "Next Action", "Hrs/Wk"].map(h => (
                            <th key={h} style={{ padding: "4px 6px", textAlign: "left", fontSize: 9, color: "#86868B", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.3 }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {clients.map((c, i) => (
                          <tr key={i} style={{ borderBottom: "1px solid #F2F2F7" }}>
                            <td style={{ padding: "4px 6px", fontWeight: 500 }}>{c.name}</td>
                            <td style={{ padding: "4px 6px", fontSize: 10 }}>{c.stage}</td>
                            <td style={{ padding: "4px 6px" }}>
                              <span style={{ display: "inline-block", padding: "1px 6px", borderRadius: 5, fontSize: 10, fontWeight: 600, background: `${STATUS_COLORS[c.status] || "#86868B"}18`, color: STATUS_COLORS[c.status] || "#86868B" }}>{c.status || "New Lead"}</span>
                            </td>
                            <td style={{ padding: "4px 6px", color: c.lastContact ? "#1D1D1F" : "#C7C7CC", fontSize: 10 }}>{c.lastContact ? fmtDate(c.lastContact) : "\u2014"}</td>
                            <td style={{ padding: "4px 6px", color: c.closeDate ? "#1D1D1F" : "#C7C7CC", fontSize: 10 }}>{c.closeDate ? fmtDate(c.closeDate) : "\u2014"}</td>
                            <td style={{ padding: "4px 6px", color: c.nextAction ? "#1D1D1F" : "#C7C7CC", fontSize: 10, maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.nextAction || "\u2014"}</td>
                            <td style={{ padding: "4px 6px", fontWeight: 600 }}>{c.hours || "\u2014"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Pipeline - auto-calculated from client data */}
        <div style={{ ...card, marginBottom: 20 }}>
          <h2 style={{ fontSize: 17, fontWeight: 600, marginBottom: 14 }}>Pipeline Breakdown</h2>
          {computedPipeline.map((p, idx) => {
            const maxHrs = Math.max(...computedPipeline.map(x => x.hours), 1);
            return (
              <div key={p.stage} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: idx < PIPELINE_STAGES.length - 1 ? "1px solid #F2F2F7" : "none" }}>
                <div style={{ width: 10, height: 10, borderRadius: 5, background: PIPE_COLORS[idx], flexShrink: 0 }} />
                <div style={{ width: 140, flexShrink: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{PIPE_SHORT[idx]}</div>
                  <div style={{ fontSize: 11, color: "#86868B" }}>{p.count} prospect{p.count !== 1 ? "s" : ""}</div>
                </div>
                <div style={{ flex: 1 }}><Bar pct={maxHrs > 0 ? (p.hours / maxHrs) * 100 : 0} color={PIPE_COLORS[idx]} height={8} /></div>
                <div style={{ textAlign: "right", minWidth: 100 }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{p.hours} hrs/wk</div>
                  <div style={{ fontSize: 11, color: "#86868B" }}>&pound;{(p.hours * MARGIN_PH * 52).toLocaleString()}/yr</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Commentary */}
        {(data.highlights || data.risks || data.nextWeek) && (
          <div style={{ display: "grid", gridTemplateColumns: data.highlights && data.risks ? "1fr 1fr" : "1fr", gap: 14, marginBottom: 20 }}>
            {data.highlights && (
              <div className="dash-card" style={card}>
                <h4 style={label}>Wins &amp; Highlights</h4>
                <div className="note-text" style={{ fontSize: 13, lineHeight: 1.6, whiteSpace: "pre-wrap", marginTop: 8 }}>{data.highlights}</div>
              </div>
            )}
            {data.risks && (
              <div className="dash-card" style={card}>
                <h4 style={label}>Risks &amp; Escalations</h4>
                <div className="note-text" style={{ fontSize: 13, lineHeight: 1.6, whiteSpace: "pre-wrap", marginTop: 8 }}>{data.risks}</div>
              </div>
            )}
            {data.nextWeek && (
              <div className="dash-card" style={{ ...card, gridColumn: data.highlights && data.risks ? "1 / -1" : undefined }}>
                <h4 style={label}>Next Week Focus</h4>
                <div className="note-text" style={{ fontSize: 13, lineHeight: 1.6, whiteSpace: "pre-wrap", marginTop: 8 }}>{data.nextWeek}</div>
              </div>
            )}
          </div>
        )}

        <div style={{ textAlign: "center", padding: "16px 0", fontSize: 11, color: "#C7C7CC" }}>
          FCN Group &middot; BD Weekly Report &middot; {weekLabel} &middot; Margin at &pound;{MARGIN_PH}/hr
        </div>
      </div>
    </div>
    );
  }

  // ======================== KPI SHEET ========================
  return (
    <div style={printWrap}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <button onClick={() => setView("input")} style={{ background: "none", border: "none", color: blue, fontSize: 15, cursor: "pointer", fontFamily: font, fontWeight: 500 }}>&larr; Back to Input</button>
        <div style={{ fontSize: 12, color: "#86868B" }}>Use <strong>Ctrl+P</strong> (or Cmd+P) to print / save as PDF</div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", borderBottom: "2px solid #1D1D1F", paddingBottom: 10, marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 10, color: "#86868B", textTransform: "uppercase", letterSpacing: 1 }}>FCN Group &middot; Business Development</div>
          <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: -0.5, marginTop: 2 }}>Weekly KPI Tracker</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 14, fontWeight: 600 }}>Week: {weekLabel}</div>
          <div style={{ fontSize: 12, color: "#86868B", marginTop: 2 }}>Print &rarr; Complete &rarr; Review at Friday Close</div>
        </div>
      </div>

      {reps.map(r => {
        const clients = (data.repNotes[r]?.clients || []).filter(c => c.name.trim());
        return (
          <div key={r} style={{ marginBottom: 28, pageBreakInside: "avoid" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <div style={{ width: 30, height: 30, borderRadius: "50%", background: `linear-gradient(135deg, ${blue}, #5856D6)`, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700 }}>{r[0]}</div>
              <div style={{ fontSize: 17, fontWeight: 600 }}>{r}</div>
            </div>

            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, marginBottom: 12 }}>
              <thead>
                <tr style={{ background: "#1D1D1F", color: "#fff" }}>
                  <th style={{ padding: "8px 10px", textAlign: "left" }}>Activity Metric</th>
                  <th style={{ padding: "8px 10px", textAlign: "center", width: 80 }}>Target</th>
                  <th style={{ padding: "8px 10px", textAlign: "center", width: 80 }}>Actual</th>
                  <th style={{ padding: "8px 10px", textAlign: "center", width: 60 }}>%</th>
                </tr>
              </thead>
              <tbody>
                {METRICS.map((m, idx) => {
                  const t = parseInt(data.activity[r]?.target[m]) || 0;
                  const a = parseInt(data.activity[r]?.actual[m]) || 0;
                  const p = t > 0 ? Math.round((a / t) * 100) : null;
                  const col = p === null ? "#1D1D1F" : p >= 100 ? "#34C759" : p >= 75 ? "#FF9500" : "#FF3B30";
                  return (
                    <tr key={m} style={{ borderBottom: "1px solid #E5E5EA", background: idx % 2 === 0 ? "#F9F9FB" : "#fff" }}>
                      <td style={{ padding: "7px 10px" }}>{m}</td>
                      <td style={{ padding: "7px 10px", textAlign: "center", fontWeight: 600 }}>{t || ""}</td>
                      <td style={{ padding: "7px 10px", textAlign: "center", fontWeight: 600, color: col, borderLeft: "1px solid #E5E5EA", borderRight: "1px solid #E5E5EA" }}>{a || ""}</td>
                      <td style={{ padding: "7px 10px", textAlign: "center", fontWeight: 600, color: col }}>{p !== null ? `${p}%` : ""}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {clients.length > 0 && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: "#86868B", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>Active Pursuits</div>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, marginBottom: 8 }}>
                  <thead>
                    <tr style={{ background: "#F2F2F7" }}>
                      {["Client", "Stage", "Est. Close", "Update / Status"].map(h => (
                        <th key={h} style={{ padding: "6px 8px", textAlign: "left", fontSize: 10, fontWeight: 600 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {clients.map((c, i) => (
                      <tr key={i} style={{ borderBottom: "1px solid #E5E5EA" }}>
                        <td style={{ padding: "5px 8px", fontWeight: 500 }}>{c.name}</td>
                        <td style={{ padding: "5px 8px", fontSize: 11 }}>{c.stage}</td>
                        <td style={{ padding: "5px 8px", fontSize: 11 }}>{c.closeDate ? fmtDate(c.closeDate) : "\u2014"}</td>
                        <td style={{ padding: "5px 8px", borderLeft: "1px solid #E5E5EA", minWidth: 160 }}></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div style={{ border: "1px solid #ddd", borderRadius: 6, padding: "8px 10px", minHeight: 44 }}>
              <div style={{ fontSize: 9, color: "#86868B", textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 2 }}>Notes / Actions</div>
            </div>
          </div>
        );
      })}

      <div style={{ marginTop: 20, borderTop: "1px solid #E5E5EA", paddingTop: 12 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: "#86868B", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>Team Summary / Director Notes</div>
        <div style={{ border: "1px solid #ddd", borderRadius: 6, minHeight: 80, padding: 10 }}></div>
      </div>
      <div style={{ marginTop: 16, textAlign: "center", fontSize: 9, color: "#C7C7CC" }}>
        FCN Group &middot; Confidential &middot; KPI Tracker &middot; {weekLabel} &middot; &pound;{MARGIN_PH}/hr margin
      </div>
    </div>
  );
}
