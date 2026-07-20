import React, { useState } from 'react';
import { MATCHES } from '../data/gameData';

export default function AdminPanel({ results, fullOverrides, onClose }) {
  const [local, setLocal] = useState(() => {
    const copy = {};
    Object.entries(results).forEach(([k, v]) => { copy[k] = { homeGoals: v.homeGoals, awayGoals: v.awayGoals }; });
    return copy;
  });
  const [filter, setFilter] = useState('upcoming');
  const [search, setSearch] = useState('');
  const [copied, setCopied] = useState(false);

  const handleSet = (matchId, field, val) => {
    setLocal(prev => ({
      ...prev,
      [matchId]: { ...(prev[matchId] || {}), [field]: val === '' ? undefined : Number(val) },
    }));
  };

  const handleClear = (matchId) => {
    setLocal(prev => {
      const next = { ...prev };
      delete next[matchId];
      return next;
    });
  };

  const buildOverridesJson = () => {
    const clean = {};
    Object.entries(local).forEach(([k, v]) => {
      if (v.homeGoals !== undefined && v.awayGoals !== undefined) clean[k] = v;
    });
    const next = { ...fullOverrides, results: clean };
    return JSON.stringify(next, null, 2);
  };

  const handleCopy = async () => {
    const json = buildOverridesJson();
    try {
      await navigator.clipboard.writeText(json);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Clipboard API unavailable — fall back to selecting the textarea
    }
  };

  const filtered = MATCHES.filter(m => {
    const played = local[m.id]?.homeGoals !== undefined;
    if (filter === 'played' && !played) return false;
    if (filter === 'upcoming' && played) return false;
    if (search) {
      const q = search.toLowerCase();
      return m.home.toLowerCase().includes(q) || m.away.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Opdater resultater</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="admin-live-note">
          🔴 Live-kampe og afsluttede resultater synkroniseres automatisk fra ESPN. Brug kun dette panel til at <strong>rette</strong> et forkert resultat, eller tilføje en kamp ESPN ikke fanger. Efter du committer ændringen på GitHub, kan det tage et par minutter før alle ser det (GitHub Pages cacher filer kortvarigt).
        </div>

        <div className="modal-controls">
          <input
            className="search-input"
            placeholder="Søg hold..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <div className="filter-bar">
            {[['all', 'Alle'], ['upcoming', 'Ikke spillet'], ['played', 'Spillet']].map(([v, l]) => (
              <button key={v} className={`filter-btn ${filter === v ? 'filter-btn--active' : ''}`} onClick={() => setFilter(v)}>{l}</button>
            ))}
          </div>
        </div>

        <div className="modal-body">
          {filtered.map(m => {
            const r = local[m.id] || {};
            const played = r.homeGoals !== undefined && r.awayGoals !== undefined;
            return (
              <div key={m.id} className={`admin-row ${played ? 'admin-row--played' : ''}`}>
                <div className="admin-teams">
                  <span className="admin-team">{m.home}</span>
                  <span className="admin-vs">vs</span>
                  <span className="admin-team">{m.away}</span>
                </div>
                <div className="admin-inputs">
                  <input
                    type="number"
                    min="0"
                    max="20"
                    className="score-input"
                    placeholder="–"
                    value={r.homeGoals ?? ''}
                    onChange={e => handleSet(m.id, 'homeGoals', e.target.value)}
                  />
                  <span className="score-sep">–</span>
                  <input
                    type="number"
                    min="0"
                    max="20"
                    className="score-input"
                    placeholder="–"
                    value={r.awayGoals ?? ''}
                    onChange={e => handleSet(m.id, 'awayGoals', e.target.value)}
                  />
                  {played && (
                    <button className="clear-btn" onClick={() => handleClear(m.id)} title="Slet resultat">✕</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="modal-footer modal-footer--column">
          <div className="publish-instructions">
            <strong>Sådan deler du rettelsen med alle:</strong>
            <ol>
              <li>Tryk "Kopiér JSON" herunder</li>
              <li>Gå til <code>overrides.json</code> i dit GitHub-repo (i mappen <code>public</code>)</li>
              <li>Tryk på blyant-ikonet (✏️ "Edit") øverst til højre på filen</li>
              <li>Markér alt indhold, slet det, og indsæt det du har kopieret</li>
              <li>Tryk "Commit changes" nederst på siden</li>
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
