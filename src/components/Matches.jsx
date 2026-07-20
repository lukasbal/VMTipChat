import React, { useState } from 'react';
import { MATCHES, PLAYERS, PREDICTIONS } from '../data/gameData';
import { getOutcome, calcMatchPoints } from '../data/scoring';

function getMatchStatus(actual) {
  if (!actual || actual.homeGoals === undefined) return 'upcoming';
  return 'played';
}

export default function Matches({ results, onSelectPlayer, leaderboard }) {
  const [filter, setFilter] = useState('all');
  const [selectedMatch, setSelectedMatch] = useState(null);

  const filtered = MATCHES.filter(m => {
    if (filter === 'live') return results[m.id]?.live;
    if (filter === 'played') return results[m.id]?.homeGoals !== undefined && !results[m.id]?.live;
    if (filter === 'upcoming') return results[m.id]?.homeGoals === undefined;
    return true;
  });

  return (
    <div className="section">
      <div className="section-header">
        <h2 className="section-title">Kampe</h2>
      </div>

      <div className="filter-bar">
        {[['all', 'Alle'], ['live', '🔴 Live'], ['played', '✅ Spillet'], ['upcoming', '🕒 Kommende']].map(([v, l]) => (
          <button
            key={v}
            className={`filter-btn ${filter === v ? 'filter-btn--active' : ''}`}
            onClick={() => setFilter(v)}
          >{l}</button>
        ))}
      </div>

      <div className="match-list">
        {filtered.map(m => {
          const actual = results[m.id];
          const played = actual?.homeGoals !== undefined;
          const isLive = actual?.live;
          const actualOutcome = played ? getOutcome(actual.homeGoals, actual.awayGoals) : null;
          const isSelected = selectedMatch === m.id;

          return (
            <div key={m.id} className={`match-card ${isLive ? 'match-card--live' : ''}`}>
              <button
                className={`match-header ${played ? 'match-header--played' : 'match-header--upcoming'}`}
                onClick={() => setSelectedMatch(isSelected ? null : m.id)}
              >
                <div className="match-teams">
                  <span className="match-team">{m.home}</span>
                  {played ? (
                    <span className="match-score">{actual.homeGoals} – {actual.awayGoals}</span>
                  ) : (
                    <span className="match-vs">vs</span>
                  )}
                  <span className="match-team match-team--right">{m.away}</span>
                </div>
                {isLive && (
                  <span className="live-badge">
                    <span className="live-dot live-dot--sm" /> {actual.clock || 'LIVE'}
                  </span>
                )}
                {played && !isLive && <span className={`outcome-badge outcome-badge--${actualOutcome}`}>{actualOutcome}</span>}
                <span className="match-toggle">{isSelected ? '▲' : '▼'}</span>
              </button>

              {isSelected && (
                <div className="match-predictions">
                  <div className="predictions-header">
                    <span>Spiller</span>
                    <span>Tip</span>
                    <span>Point</span>
                  </div>
                  {PLAYERS.map(player => {
                    const pred = PREDICTIONS[player.id]?.[m.id];
                    const pts = played ? calcMatchPoints(pred, actual) : null;
                    const correct = pts !== null && pred?.o === actualOutcome;
                    return (
                      <button
                        key={player.id}
                        className={`prediction-row ${correct ? 'prediction-row--correct' : played ? 'prediction-row--wrong' : ''}`}
                        onClick={() => onSelectPlayer(leaderboard.find(p => p.id === player.id))}
                      >
                        <span className="pred-name">{player.name}</span>
                        <span className="pred-score">
                          {pred ? `${pred.h} – ${pred.a}` : '–'}
                          {pred && <span className="pred-outcome">({pred.o})</span>}
                        </span>
                        <span className="pred-pts">
                          {pts !== null ? (
                            <span className={pts > 0 ? 'pts-positive' : 'pts-zero'}>
                              {pts} pt
                              {isLive && pts > 0 && <span className="pts-live-tag"> LIVE</span>}
                            </span>
                          ) : '–'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
