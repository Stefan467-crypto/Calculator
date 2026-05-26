import { useState, useCallback, useRef, useEffect } from "react";

const truncate2 = (n) => Math.trunc(n * 100) / 100;
const fmt2 = (n) => truncate2(n).toFixed(2);

const parseGrade = (raw) => {
  const s = raw.trim().replace(",", ".");
  if (s === "") return null;
  const v = parseFloat(s);
  if (isNaN(v)) return { error: raw };
  return { value: v };
};

const STATUS = (avg) =>
  avg >= 5
    ? { label: "ADMIS", color: "#10b981", bg: "#10b98118" }
    : { label: "NEADMIS", color: "#ef4444", bg: "#ef444418" };

export default function GradeCalc() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState(null);
  const [errors, setErrors] = useState([]);
  const [dark, setDark] = useState(false);
  const [history, setHistory] = useState([]);
  const [animKey, setAnimKey] = useState(0);
  const [copied, setCopied] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    setDark(mq.matches);
    const handler = (e) => setDark(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const calculate = useCallback(() => {
    const tokens = input.trim().split(/\s+/).filter(Boolean);
    if (!tokens.length) return;
    const parsed = tokens.map(parseGrade);
    const bad = parsed.filter((p) => p && p.error).map((p) => p.error);
    const good = parsed.filter((p) => p && p.value !== undefined).map((p) => p.value);
    setErrors(bad);
    if (!good.length) return;
    const sum = good.reduce((a, b) => a + b, 0);
    const avg = sum / good.length;
    const res = { grades: good, sum, count: good.length, avg, truncated: fmt2(avg) };
    setResult(res);
    setCopied(false);
    setAnimKey((k) => k + 1);
    setHistory((h) => [{ ...res, id: Date.now(), input: input.trim() }, ...h].slice(0, 10));
  }, [input]);

  const clear = () => {
    setInput("");
    setResult(null);
    setErrors([]);
    setCopied(false);
    inputRef.current?.focus();
  };

  const copyResult = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.truncated).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const loadHistory = (item) => {
    setInput(item.input);
    setResult(item);
    setErrors([]);
    setCopied(false);
    setAnimKey((k) => k + 1);
  };

  const deleteHistoryItem = (id, e) => {
    e.stopPropagation();
    setHistory((h) => h.filter((x) => x.id !== id));
  };

  const clearHistory = () => setHistory([]);

  const onKey = (e) => { if (e.key === "Enter") calculate(); };

  const t = dark
    ? { bg: "#0f0f13", card: "#1a1a24", cardBorder: "#2e2e42", surface: "#22223a", text: "#f0f0fa", sub: "#9090b0", accent: "#818cf8", input: "#1a1a28", inputBorder: "#3f3f5f", divider: "#2a2a3e", resultBg: "#1e1e2e", histBg: "#161624", btnHover: "#2a2a42" }
    : { bg: "#f4f4f8", card: "#ffffff", cardBorder: "#e5e5ed", surface: "#f0f0fa", text: "#1a1a2e", sub: "#6464a0", accent: "#6366f1", input: "#ffffff", inputBorder: "#d0d0e8", divider: "#ebebf5", resultBg: "#fafafe", histBg: "#f7f7fc", btnHover: "#ededfa" };

  const r = result;
  const status = r ? STATUS(r.avg) : null;

  return (
    <div style={{ minHeight: "100vh", background: t.bg, display: "flex", flexDirection: "column", alignItems: "center", padding: "2rem 1rem", fontFamily: "'DM Sans','Segoe UI',sans-serif", transition: "background 0.3s" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; }
        @keyframes pop { 0%{transform:scale(0.7);opacity:0} 60%{transform:scale(1.08)} 100%{transform:scale(1);opacity:1} }
        @keyframes slide { from{transform:translateY(12px);opacity:0} to{transform:translateY(0);opacity:1} }
        @keyframes bar { from{width:0} to{width:var(--w)} }
        .grade-bar { animation: bar 0.6s cubic-bezier(.4,0,.2,1) forwards; }
        .pop-in { animation: pop 0.45s cubic-bezier(.4,0,.2,1) forwards; }
        .slide-in { animation: slide 0.35s ease forwards; }
        input[type=text]:focus { outline: none; box-shadow: 0 0 0 3px rgba(99,102,241,0.25); }
        button { cursor: pointer; font-family: inherit; }
        button:active { transform: scale(0.97); }
        .hist-item:hover { background: ${t.btnHover} !important; }
        .icon-btn:hover { background: ${dark ? "#2e2e42" : "#eeeef8"} !important; }
        @media(max-width:600px){
          .stat-grid { grid-template-columns: 1fr 1fr !important; }
        }
      `}</style>

      {/* Antet */}
      <div style={{ width: "100%", maxWidth: 560, display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.12em", color: t.accent, textTransform: "uppercase", marginBottom: 2 }}>Calculator Note</div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 600, color: t.text, letterSpacing: "-0.02em" }}>Media Elevilor</h1>
        </div>
        <button onClick={() => setDark((d) => !d)} title="Comută modul întunecat" style={{ background: t.surface, border: `1.5px solid ${t.cardBorder}`, borderRadius: 10, width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, transition: "all 0.2s" }}>
          {dark ? "☀️" : "🌙"}
        </button>
      </div>

      {/* Card principal */}
      <div style={{ width: "100%", maxWidth: 560, background: t.card, border: `1.5px solid ${t.cardBorder}`, borderRadius: 20, padding: "1.75rem", boxShadow: dark ? "0 8px 32px rgba(0,0,0,0.5)" : "0 4px 24px rgba(99,102,241,0.07)", marginBottom: "1.25rem" }}>
        <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: t.sub, marginBottom: 8, letterSpacing: "0.03em" }}>
          Introduceți notele separate prin spații
        </label>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKey}
          placeholder="ex: 8.5 7 9,3 6.98"
          style={{ width: "100%", padding: "0.75rem 1rem", background: t.input, border: `1.5px solid ${t.inputBorder}`, borderRadius: 12, fontSize: 16, color: t.text, fontFamily: "'DM Mono',monospace", transition: "border 0.2s, box-shadow 0.2s", letterSpacing: "0.03em" }}
        />

        {errors.length > 0 && (
          <div style={{ marginTop: 10, padding: "0.6rem 1rem", background: dark ? "#2d1a1a" : "#fff5f5", border: `1px solid ${dark ? "#5a2020" : "#fecaca"}`, borderRadius: 10, fontSize: 13, color: dark ? "#f87171" : "#dc2626" }}>
            ⚠ Valori invalide ignorate: <strong>{errors.join(", ")}</strong>
          </div>
        )}

        <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
          <button
            onClick={calculate}
            style={{ flex: 1, padding: "0.75rem", background: t.accent, color: "#fff", border: "none", borderRadius: 12, fontSize: 15, fontWeight: 600, letterSpacing: "0.02em", transition: "opacity 0.2s, transform 0.15s", opacity: input.trim() ? 1 : 0.5 }}
          >
            Calculează Media
          </button>
          <button
            onClick={clear}
            style={{ padding: "0.75rem 1.1rem", background: "transparent", color: t.sub, border: `1.5px solid ${t.cardBorder}`, borderRadius: 12, fontSize: 15, fontWeight: 500, transition: "background 0.2s" }}
          >
            Șterge
          </button>
        </div>
      </div>

      {/* Card Rezultat */}
      {r && (
        <div key={animKey} className="slide-in" style={{ width: "100%", maxWidth: 560, background: t.resultBg, border: `1.5px solid ${t.cardBorder}`, borderRadius: 20, padding: "1.75rem", boxShadow: dark ? "0 8px 32px rgba(0,0,0,0.4)" : "0 4px 24px rgba(99,102,241,0.06)", marginBottom: "1.25rem" }}>

          {/* Media + status + buton copiere */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "1.5rem" }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.1em", color: t.sub, textTransform: "uppercase", marginBottom: 4 }}>Media Finală</div>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div className="pop-in" style={{ fontSize: "4.5rem", fontWeight: 600, color: t.text, lineHeight: 1, fontFamily: "'DM Mono',monospace", letterSpacing: "-0.03em" }}>
                  {r.truncated}
                </div>
                {/* Buton copiere */}
                <button
                  className="icon-btn"
                  onClick={copyResult}
                  title="Copiază media"
                  style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", background: copied ? (dark ? "#14532d" : "#dcfce7") : t.surface, border: `1.5px solid ${copied ? "#10b981" : t.cardBorder}`, borderRadius: 10, fontSize: 13, fontWeight: 600, color: copied ? "#10b981" : t.sub, transition: "all 0.2s", marginTop: 6 }}
                >
                  {copied ? "✓ Copiat!" : "⧉ Copiază"}
                </button>
              </div>
              <div style={{ fontSize: 13, color: t.sub, marginTop: 6 }}>(trunchiat la 2 zecimale)</div>
            </div>
            {/* Badge Admis / Neadmis */}
            <div style={{ marginTop: 4, padding: "8px 18px", borderRadius: 12, background: status.bg, border: `2px solid ${status.color}40`, fontSize: 13, fontWeight: 700, color: status.color, letterSpacing: "0.06em", textAlign: "center", whiteSpace: "nowrap" }}>
              {status.label}
            </div>
          </div>

          {/* Bară progres */}
          <div style={{ marginBottom: "1.5rem" }}>
            <div style={{ height: 6, background: t.surface, borderRadius: 99, overflow: "hidden" }}>
              <div className="grade-bar" style={{ "--w": `${Math.min(100, (r.avg / 10) * 100)}%`, height: "100%", background: `linear-gradient(90deg, ${status.color}99, ${status.color})`, borderRadius: 99 }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, fontSize: 11, color: t.sub }}>
              <span>0</span><span>5</span><span>10</span>
            </div>
          </div>

          {/* Grid statistici */}
          <div className="stat-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
            {[
              { label: "Nr. Note", value: r.count, icon: "#" },
              { label: "Sumă Totală", value: fmt2(r.sum), icon: "Σ" },
              { label: "Media Exactă", value: r.avg.toFixed(6), icon: "÷" },
            ].map((s) => (
              <div key={s.label} style={{ background: t.surface, borderRadius: 12, padding: "0.85rem", textAlign: "center" }}>
                <div style={{ fontSize: 18, color: t.accent, fontFamily: "'DM Mono',monospace", fontWeight: 600, marginBottom: 2 }}>{s.icon}</div>
                <div style={{ fontSize: s.label === "Media Exactă" ? 11 : 18, fontWeight: 600, color: t.text, fontFamily: "'DM Mono',monospace" }}>{s.value}</div>
                <div style={{ fontSize: 11, color: t.sub, marginTop: 2, fontWeight: 500, letterSpacing: "0.04em" }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Note individuale */}
          <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1.5px solid ${t.divider}` }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: t.sub, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10 }}>Note Individuale</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {r.grades.map((g, i) => {
                const st = STATUS(g);
                return (
                  <div key={i} style={{ padding: "4px 14px", borderRadius: 99, background: st.color + (dark ? "28" : "15"), border: `1.5px solid ${st.color}55`, fontSize: 14, fontWeight: 600, color: st.color, fontFamily: "'DM Mono',monospace" }}>
                    {g % 1 === 0 ? g.toFixed(0) : g}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Calcul detaliat */}
          <div style={{ marginTop: 14, padding: "0.85rem 1rem", background: t.surface, borderRadius: 12, fontSize: 13, color: t.sub, fontFamily: "'DM Mono',monospace", wordBreak: "break-word" }}>
            <span style={{ color: t.text }}>{r.grades.map(g => g % 1 === 0 ? g.toFixed(0) : g).join(" + ")}</span>
            <span> = </span>
            <span style={{ color: t.accent }}>{fmt2(r.sum)}</span>
            <span> ÷ {r.count} = </span>
            <span style={{ color: t.text, fontWeight: 600 }}>{r.truncated}</span>
          </div>
        </div>
      )}

      {/* Istoric */}
      {history.length > 0 && (
        <div style={{ width: "100%", maxWidth: 560, background: t.card, border: `1.5px solid ${t.cardBorder}`, borderRadius: 20, padding: "1.25rem 1.5rem", boxShadow: dark ? "0 4px 16px rgba(0,0,0,0.4)" : "0 2px 12px rgba(99,102,241,0.05)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: t.sub, letterSpacing: "0.08em", textTransform: "uppercase" }}>Calcule Recente</div>
            <button
              onClick={clearHistory}
              style={{ fontSize: 12, fontWeight: 600, color: dark ? "#f87171" : "#dc2626", background: "transparent", border: "none", padding: "2px 8px", borderRadius: 6, letterSpacing: "0.03em", transition: "opacity 0.2s" }}
            >
              Șterge tot
            </button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {history.map((h) => {
              const st = STATUS(h.avg);
              return (
                <div key={h.id} className="hist-item" onClick={() => loadHistory(h)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.6rem 0.85rem", borderRadius: 10, background: t.histBg, cursor: "pointer", transition: "background 0.15s" }}>
                  <div style={{ fontSize: 13, color: t.sub, fontFamily: "'DM Mono',monospace", maxWidth: "50%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{h.input}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: t.text, fontFamily: "'DM Mono',monospace" }}>{h.truncated}</div>
                    <div style={{ padding: "2px 10px", borderRadius: 6, background: st.color + "22", fontSize: 11, fontWeight: 700, color: st.color, letterSpacing: "0.04em" }}>{st.label}</div>
                    {/* Buton ștergere element */}
                    <button
                      onClick={(e) => deleteHistoryItem(h.id, e)}
                      title="Șterge"
                      style={{ width: 24, height: 24, borderRadius: 6, background: "transparent", border: `1px solid ${t.cardBorder}`, color: t.sub, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1, transition: "all 0.15s", flexShrink: 0 }}
                    >
                      ×
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div style={{ marginTop: "2rem", fontSize: 12, color: t.sub, textAlign: "center", letterSpacing: "0.03em" }}>
        Suportă note zecimale · Separatori punct și virgulă · Trunchiere (fără rotunjire)
      </div>
    </div>
  );
}
