import React, { useState, useMemo } from 'react';
import Leaderboard from './components/Leaderboard';
import Matches from './components/Matches';
import PlayerDetail from './components/PlayerDetail';
import AdminPanel from './components/AdminPanel';
import BonusPanel from './components/BonusPanel';
import { PLAYERS, MATCHES } from './data/gameData';
import { calcLeaderboard, mergeLiveResults, mergeBonus } from './data/scoring';
import { useLiveResults } from './hooks/useLiveResults';
import { useSharedOverrides } from './hooks/useSharedOverrides';

export default function App() {
  const [tab, setTab] = useState('leaderboard');
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [adminOpen, setAdminOpen] = useState(false);
  const [bonusOpen, setBonusOpen] = useState(false);

  const { liveData, knockoutData, error: liveError } = useLiveResults();
  const { overrides, refetch: refetchOverrides } = useSharedOverrides();

  const results = overrides.results || {};
  const manualBonus = overrides.bonus || {};

  const mergedResults = useMemo(
    () => mergeLiveResults(results, liveData),
    [results, liveData]
  );

  // Merge ESPN knockout data with any manual overrides in bonus
  const bonusResults = useMemo(
    () => mergeBonus(manualBonus, knockoutData),
    [manualBonus, knockoutData]
  );

  const hasLiveMatch = useMemo(
    () => Object.values(mergedResults).some(r => r.live),
    [mergedResults]
  );

  const leaderboard = calcLeaderboard(PLAYERS, mergedResults, bonusResults);

  const playedCount = MATCHES.filter(m => mergedResults[m.id]?.homeGoals !== undefined).length;

  return (
    <div className="app">
      <header className="header">
        <div className="header-inner">
          <div className="header-brand">
            <span className="header-trophy">🏆</span>
            <div>
              <h1 className="header-title">VM Tips 2026</h1>
              <p className="header-sub">{playedCount} / {MATCHES.length} kampe spillet</p>
            </div>
          </div>
          <div className="header-actions">
            <button className="btn-ghost" onClick={() => setBonusOpen(true)} title="Bonus svar">
              ⭐ Bonus
            </button>
            <button className="btn-ghost" onClick={() => setAdminOpen(true)} title="Opdater resultater">
              ✏️ Resultater
            </button>
          </div>
        </div>
        {hasLiveMatch && (
          <div className="live-banner">
            <span className="live-dot" /> LIVE — kampe i gang lige nu
          </div>
        )}
        {liveError && (
          <div className="sync-error-banner">
            ⚠️ Kunne ikke synkronisere live-resultater automatisk. Brug ✏️ Resultater til at indtaste manuelt.
          </div>
        )}
      </header>

      <nav className="tabs">
        {[
          { id: 'leaderboard', label: '🏅 Stilling' },
          { id: 'matches', label: '⚽ Kampe' },
        ].map(t => (
          <button
            key={t.id}
            className={`tab ${tab === t.id ? 'tab--active' : ''}`}
            onClick={() => { setTab(t.id); setSelectedPlayer(null); }}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <main className="main">
        {tab === 'leaderboard' && !selectedPlayer && (
          <Leaderboard
            leaderboard={leaderboard}
            onSelectPlayer={(p) => { setSelectedPlayer(p); setTab('matches'); }}
          />
        )}
        {tab === 'matches' && !selectedPlayer && (
          <Matches
            results={mergedResults}
            onSelectPlayer={(p) => setSelectedPlayer(p)}
            leaderboard={leaderboard}
          />
        )}
        {selectedPlayer && (
          <PlayerDetail
            player={selectedPlayer}
            results={mergedResults}
            bonusResults={bonusResults}
            leaderboard={leaderboard}
            onBack={() => setSelectedPlayer(null)}
          />
        )}
      </main>

      {adminOpen && (
        <AdminPanel
          results={results}
          fullOverrides={overrides}
          onClose={() => { setAdminOpen(false); refetchOverrides(); }}
        />
      )}

      {bonusOpen && (
        <BonusPanel
          bonusResults={bonusResults}
          manualBonus={manualBonus}
          knockoutData={knockoutData}
          fullOverrides={overrides}
          onClose={() => { setBonusOpen(false); refetchOverrides(); }}
        />
      )}
    </div>
  );
}
