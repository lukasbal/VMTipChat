import React, { useState } from 'react';

const GROUP_FINISH_KEYS = [
  'A1', 'B2', 'C3', 'D1', 'E2', 'F4',
  'G4', 'H2', 'I3', 'J4', 'K3', 'L1',
];

export default function BonusPanel({ bonusResults, manualBonus, knockoutData, fullOverrides, onClose }) {
  const [gf, setGf] = useState(() => ({ ...(manualBonus.groupFinishes || {}) }));
  const [winner, setWinner] = useState(manualBonus.winner || '');
  const [copied, setCopied] = useState(false);

  const setGfVal = (key, val) => setGf(prev => ({ ...prev, [key]: val }));

  const buildOverridesJson = () => {
    const bonusClean = { ...manualBonus };
    bonusClean.groupFinishes = gf;
    if (winner) bonusClean.winner = winner;
    else delete bonusClean.winner;
    // Keep existing manual r16/qf/sf if set, but don't expose them for editing (auto now)
    const next = { ...fullOverrides, bonus: bonusClean };
    return JSON.stringify(next, null, 2);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(buildOverridesJson());
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {}
  };

  const autoTag = (isAuto) => isAuto
    ? <span className="auto-tag">📡 automatisk</span>
    : <span className="manual-tag">✏️ manuel</span>;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>⭐ Bonusresultater</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">

          {/* Bonusrunde 1 — gruppeplaceringer (manual) */}
          <div className="bonus-admin-section">
            <div className="bonus-section-header-row">
              <h3 className="bonus-admin-title">Bonusrunde 1 — Gruppeplacering ✏️</h3>
            </div>
            <div className="bonus-admin-grid">
              {GROUP_FINISH_KEYS.map(key => (
                <div key={key} className="bonus-admin-row">
                  <label className="bonus-admin-label">{key}</label>
                  <input
                    className="bonus-admin-input"
                    placeholder="Hold..."
                    value={gf[key] || ''}
                    onChange={e => setGfVal(key, e.target.value)}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Bonusrunde 2 — R16 (auto) */}
          <AutoRoundSection
            title="Bonusrunde 2 — 1/8-finalister (15 pt)"
            teams={bonusResults.r16 || []}
            isAuto={!manualBonus.r16?.length}
            emptyMsg="Ingen 1/8-finalister fundet endnu — opdateres automatisk"
          />

          {/* Bonusrunde 3 — QF (auto) */}
          <AutoRoundSection
            title="Bonusrunde 3 — Kvartfinalister (20 pt)"
            teams={bonusResults.qf || []}
            isAuto={!manualBonus.qf?.length}
            emptyMsg="Ingen kvartfinalister fundet endnu — opdateres automatisk"
          />

          {/* Bonusrunde 4 — SF (auto) */}
          <AutoRoundSection
            title="Bonusrunde 4 — Semifinalister (30 pt)"
            teams={bonusResults.sf || []}
            isAuto={!manualBonus.sf?.length}
            emptyMsg="Ingen semifinalister fundet endnu — opdateres automatisk"
          />

          {/* Bonusrunde 5 — Vinder (auto + manuel fallback) */}
          <div className="bonus-admin-section">
            <div className="bonus-section-header-row">
              <h3 className="bonus-admin-title">Bonusrunde 5 — VM Vinder (50 pt)</h3>
              {autoTag(!manualBonus.winner && !!knockoutData.winner)}
            </div>
            {knockoutData.winner && !manualBonus.winner ? (
              <div className="auto-winner">
                🏆 {knockoutData.winner} <span className="auto-tag">fra ESPN</span>
              </div>
            ) : (
              <div className="bonus-admin-row">
                <label className="bonus-admin-label">VM Vinder</label>
                <input
                  className="bonus-admin-input"
                  placeholder="Skriv hold hvis ESPN ikke registrerer det automatisk..."
                  value={winner}
                  onChange={e => setWinner(e.target.value)}
                />
              </div>
            )}
          </div>

        </div>

        <div className="modal-footer modal-footer--column">
          <div className="publish-instructions">
            <strong>Kun bonusrunde 1 og vinderen (hvis nødvendig) skal opdateres manuelt.</strong>
            <p style={{marginTop:'0.3rem'}}>R16, QF og SF opdateres automatisk fra ESPN. Tryk "Kopiér JSON" og commit til GitHub som normalt.</p>
            <ol style={{marginTop:'0.4rem'}}>
              <li>Tryk "Kopiér JSON" herunder</li>
              <li>Gå til <code>overrides.json</code> i dit GitHub-repo (mappen <code>public</code>)</li>
              <li>Tryk blyant-ikonet ✏️ → markér alt → indsæt → "Commit changes"</li>
            </ol>
          </div>
          <div className="footer-buttons">
            <button className="btn-secondary" onClick={onClose}>Luk</button>
            <button className="btn-primary" onClick={handleCopy}>
              {copied ? '✅ Kopieret!' : '📋 Kopiér JSON'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AutoRoundSection({ title, teams, isAuto, emptyMsg }) {
  return (
    <div className="bonus-admin-section">
      <div className="bonus-section-header-row">
        <h3 className="bonus-admin-title">{title}</h3>
        {isAuto
          ? <span className="auto-tag">📡 automatisk</span>
          : <span className="manual-tag">✏️ manuel</span>}
      </div>
      {teams.length > 0 ? (
        <div className="bonus-chips-auto">
          {teams.map(t => <span key={t} className="chip chip--auto">{t}</span>)}
        </div>
      ) : (
        <p className="auto-empty">{emptyMsg}</p>
      )}
    </div>
  );
}
