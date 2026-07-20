import React, { useState } from 'react';
import { MATCHES, BONUS_PREDICTIONS } from '../data/gameData';
import { getMatchBreakdown, calcBonusPoints, getOutcome } from '../data/scoring';

export default function PlayerDetail({ player, results, bonusResults, leaderboard, onBack }) {
  const [tab, setTab] = useState('group');
  const breakdown = getMatchBreakdown(player.id, results);
  const bonusPts = calcBonusPoints(player.id, bonusResults);
  const preds = BONUS_PREDICTIONS[player.id] || {};
  const rank = leaderboard.findIndex(p => p.id === player.id) + 1;
  const lbEntry = leaderboard.find(p => p.id === player.id);

  const played = breakdown.filter(b => b.pts !== null);
  const pointsPerMatch = played.length > 0
    ? (played.reduce((s, b) => s + b.pts, 0) / played.length).toFixed(1)
    : '–';

  const bestMatch = played.length > 0 ? played.reduce((best, b) => b.pts > best.pts ? b : best) : null;

  return (
    <div className="section">
      <button className="back-btn" onClick={onBack}>← Tilbage</button>

      <div className="player-hero">
        <div className="player-rank">#{rank}</div>
        <div>
          <h2 className="player-name">{player.name}</h2>
          <p className="player-sub">
            {lbEntry?.total ?? 0} point totalt
          </p>
        </div>
      </div>

      <div className="stat-row">
        <div className="stat-card">
          <span className="stat-label">Gruppe</span>
          <span className="stat-value">{lbEntry?.groupPts ?? 0}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Bonus</span>
          <span className="stat-value">{lbEntry?.bonus.total ?? 0}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Pt/kamp</span>
          <span className="stat-value">{pointsPerMatch}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Kampe</span>
          <span className="stat-value">{played.length}</span>
        </div>
      </div>

      {bestMatch && (
        <div className="best-match">
          🎯 Bedste kamp: <strong>{bestMatch.match.home} vs {bestMatch.match.away}</strong> — {bestMatch.pts} point
        </div>
      )}

      <div className="tabs tabs--inner">
        {[['group', '⚽ Gruppespil'], ['bonus', '⭐ Bonusrunder']].map(([id, label]) => (
          <button key={id} className={`tab ${tab === id ? 'tab--active' : ''}`} onClick={() => setTab(id)}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'group' && (
        <div className="match-list">
          {breakdown.map(({ match, pred, actual, pts }) => {
            const played = pts !== null;
            const isLive = actual?.live;
            const actualOutcome = actual ? getOutcome(actual.homeGoals, actual.awayGoals) : null;
            const correct = played && pred?.o === actualOutcome;
            return (
              <div key={match.id} className={`match-card match-card--compact ${played ? (correct ? 'match-card--correct' : 'match-card--wrong') : ''} ${isLive ? 'match-card--live' : ''}`}>
                <div className="match-compact-row">
                  <div className="match-teams">
                    <span className="match-team">{match.home}</span>
                    <span className="match-vs-block">
                      {played ? (
                        <>
                          <span className="pred-score-sm">{pred?.h ?? '?'}-{pred?.a ?? '?'}</span>
                          <span className="actual-score">{actual.homeGoals}-{actual.awayGoals}</span>
                        </>
                      ) : (
                        <span className="pred-score-sm">{pred?.h ?? '?'}-{pred?.a ?? '?'}</span>
                      )}
                    </span>
                    <span className="match-team match-team--right">{match.away}</span>
                  </div>
                  <span className={`match-pts ${pts > 0 ? 'pts-positive' : pts === 0 ? 'pts-zero' : 'pts-pending'}`}>
                    {pts !== null ? (
                      <>
                        {isLive && pts > 0 ? `(+${pts} pts)` : `${pts}pt`}
                      </>
                    ) : '–'}
                  </span>
                </div>
                {played && (
                  <div className="match-detail-row">
                    <span>Tip: {pred?.h ?? '?'}-{pred?.a ?? '?'} ({pred?.o})</span>
                    <span>{isLive ? `Lige nu: ${actual.homeGoals}-${actual.awayGoals} (${actual.clock || 'LIVE'})` : `Facit: ${actual.homeGoals}-${actual.awayGoals} (${actualOutcome})`}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {tab === 'bonus' && (
        <div className="bonus-detail">
          <BonusSection
            title="Bonusrunde 1 — Gruppeplacering (10 pt)"
            earned={bonusPts.b1}
            maxPossible={120}
          >
            <div className="bonus-grid">
              {Object.entries(preds.groupFinishes || {}).map(([key, val]) => {
                const correct = bonusResults.groupFinishes?.[key] === val;
                const decided = !!bonusResults.groupFinishes?.[key];
                return (
                  <div key={key} className={`bonus-item ${decided ? (correct ? 'bonus-item--correct' : 'bonus-item--wrong') : ''}`}>
                    <span className="bonus-key">{key}</span>
                    <span className="bonus-val">{val}</span>
                    {decided && <span>{correct ? '✅' : '❌'}</span>}
                  </div>
                );
              })}
            </div>
          </BonusSection>

          <BonusSection title="Bonusrunde 2 — 1/8-finalist (15 pt)" earned={bonusPts.b2} maxPossible={120}>
            <div className="bonus-chips">
              {(preds.r16 || []).map(team => {
                const correct = bonusResults.r16?.includes(team);
                const decided = bonusResults.r16?.length > 0;
                return (
                  <span key={team} className={`chip ${decided ? (correct ? 'chip--correct' : 'chip--wrong') : ''}`}>
                    {team}
                  </span>
                );
              })}
            </div>
          </BonusSection>

          <BonusSection title="Bonusrunde 3 — Kvartfinalist (20 pt)" earned={bonusPts.b3} maxPossible={80}>
            <div className="bonus-chips">
              {(preds.qf || []).map(team => {
                const correct = bonusResults.qf?.includes(team);
                const decided = bonusResults.qf?.length > 0;
                return (
                  <span key={team} className={`chip ${decided ? (correct ? 'chip--correct' : 'chip--wrong') : ''}`}>
                    {team}
                  </span>
                );
              })}
            </div>
          </BonusSection>

          <BonusSection title="Bonusrunde 4 — Semifinalist (30 pt)" earned={bonusPts.b4} maxPossible={60}>
            <div className="bonus-chips">
              {(preds.sf || []).map(team => {
                const correct = bonusResults.sf?.includes(team);
                const decided = bonusResults.sf?.length > 0;
                return (
                  <span key={team} className={`chip ${decided ? (correct ? 'chip--correct' : 'chip--wrong') : ''}`}>
                    {team}
                  </span>
                );
              })}
            </div>
          </BonusSection>

          <BonusSection title="Bonusrunde 5 — Topscorer & Vinder" earned={bonusPts.b5} maxPossible={90}>
            <div className="bonus-list">
              <BonusRow label="Topscorer (40 pt)" value={preds.topscorer} actual={bonusResults.topscorer} />
              <BonusRow label="VM Vinder (50 pt)" value={preds.winner} actual={bonusResults.winner} />
            </div>
          </BonusSection>
        </div>
      )}
    </div>
  );
}

function BonusSection({ title, earned, maxPossible, children }) {
  return (
    <div className="bonus-section">
      <div className="bonus-section-header">
        <span className="bonus-section-title">{title}</span>
        <span className="bonus-section-pts">{earned} pt</span>
      </div>
      {children}
    </div>
  );
}

function BonusRow({ label, value, actual }) {
  const decided = !!actual;
  const correct = decided && actual === value;
  return (
    <div className={`bonus-row-item ${decided ? (correct ? 'bonus-item--correct' : 'bonus-item--wrong') : ''}`}>
      <span className="bonus-key">{label}</span>
      <span className="bonus-val">{value}</span>
      {decided && (
        <span className="bonus-actual">
          {correct ? '✅' : `❌ (${actual})`}
        </span>
      )}
    </div>
  );
}
