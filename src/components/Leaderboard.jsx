import React from 'react';

const MEDALS = ['🥇', '🥈', '🥉'];

export default function Leaderboard({ leaderboard, onSelectPlayer }) {
  return (
    <div className="section">
      <div className="section-header">
        <h2 className="section-title">Stilling</h2>
        <span className="section-hint">Tryk på en spiller for detaljer</span>
      </div>

      <div className="leaderboard">
        {leaderboard.map((p, i) => (
          <button
            key={p.id}
            className={`lb-row ${i === 0 ? 'lb-row--first' : ''} ${p.livePts > 0 ? 'lb-row--live' : ''}`}
            onClick={() => onSelectPlayer(p)}
          >
            <span className="lb-rank">
              {i < 3 ? MEDALS[i] : <span className="lb-rank-num">{i + 1}</span>}
            </span>
            <span className="lb-name">{p.name}</span>
            <div className="lb-score-col">
              <span className="lb-total">
                {p.total}
                {p.livePts > 0 && <span className="lb-live-delta"> (+{p.livePts} pts)</span>}
              </span>
              <span className="lb-breakdown">
                <span className="lb-tag">⚽ {p.groupPts}</span>
                <span className="lb-tag lb-tag--bonus">⭐ {p.bonus.total}</span>
              </span>
            </div>
            <span className="lb-arrow">›</span>
          </button>
        ))}
      </div>

      <div className="scoring-legend">
        <h3 className="legend-title">Pointsystem</h3>
        <div className="legend-grid">
          <div className="legend-item"><span className="legend-pts">3 pt</span><span>Korrekt udfald (1X2)</span></div>
          <div className="legend-item"><span className="legend-pts">2 pt</span><span>Korrekt mål (per ciffer)</span></div>
          <div className="legend-item"><span className="legend-pts">1 pt</span><span>Bonus ved eksakt resultat</span></div>
          <div className="legend-item"><span className="legend-pts">10 pt</span><span>Korrekt gruppeplacering</span></div>
          <div className="legend-item"><span className="legend-pts">15 pt</span><span>1/8-finalist (8 ud af 16)</span></div>
          <div className="legend-item"><span className="legend-pts">20 pt</span><span>Kvartfinalist (4 ud af 8)</span></div>
          <div className="legend-item"><span className="legend-pts">30 pt</span><span>Semifinalist (2 ud af 4)</span></div>
          <div className="legend-item"><span className="legend-pts">40 pt</span><span>VM Topscorer</span></div>
          <div className="legend-item"><span className="legend-pts">50 pt</span><span>VM Vinder</span></div>
        </div>
      </div>
    </div>
  );
}
