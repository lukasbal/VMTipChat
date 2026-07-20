import { useEffect, useRef, useState } from 'react';
import { MATCHES } from '../data/gameData';
import { toEnglish, toDanish } from '../data/teamNames';

const ESPN_BASE = 'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard';
const CORS_PROXY = 'https://corsproxy.io/?url=';
const POLL_MS = 30000;

// ESPN season.slug values for each knockout round
const SLUG_TO_ROUND = {
  'round-of-32': 'r32',
  'round-of-16': 'r16',
  'quarterfinals': 'qf',
  'semifinals': 'sf',
  'final': 'final',
};

function buildMatchKey(teamA, teamB) {
  return [teamA, teamB].map(s => s.toLowerCase().trim()).sort().join('__');
}

const MATCH_LOOKUP = (() => {
  const map = {};
  MATCHES.forEach(m => {
    const key = buildMatchKey(toEnglish(m.home), toEnglish(m.away));
    map[key] = m.id;
  });
  return map;
})();

function parseEspnEvents(events) {
  const matchResults = {};  // group stage scores

  // Important distinction:
  // - r32 = teams that reached the Round of 32
  // - r16 = teams that QUALIFIED for the Round of 16 (winners of R32)
  // - qf  = teams that QUALIFIED for quarterfinals (winners of R16)
  // - sf  = teams that QUALIFIED for semifinals (winners of QF)
  // The old version filled r16 with teams from R16 matches only after those
  // matches had started. That meant only the first 8 teams were counted while
  // the last four R16 matches were still waiting to be played.
  const knockoutTeams = { r32: new Set(), r16: new Set(), qf: new Set(), sf: new Set(), winner: null };

  events.forEach(ev => {
    const comp = ev.competitions?.[0];
    if (!comp) return;
    const competitors = comp.competitors || [];
    const home = competitors.find(c => c.homeAway === 'home');
    const away = competitors.find(c => c.homeAway === 'away');
    if (!home || !away) return;

    const homeName = home.team?.displayName;
    const awayName = away.team?.displayName;
    if (!homeName || !awayName) return;

    const slug = ev.season?.slug || '';
    const statusState = comp.status?.type?.state;  // 'pre' | 'in' | 'post'
    const hasStarted = statusState === 'in' || statusState === 'post';
    const isCompleted = statusState === 'post';
    const isLive = statusState === 'in';

    // ── Group stage match scores ──
    if (slug === 'group-stage') {
      const key = buildMatchKey(homeName, awayName);
      const ourMatchId = MATCH_LOOKUP[key];
      if (!ourMatchId) return;

      const ourMatch = MATCHES.find(m => m.id === ourMatchId);
      const ourHomeIsEspnHome = toEnglish(ourMatch.home) === homeName;
      const espnHomeGoals = hasStarted ? Number(home.score) : null;
      const espnAwayGoals = hasStarted ? Number(away.score) : null;

      matchResults[ourMatchId] = {
        status: isLive ? 'live' : isCompleted ? 'final' : 'scheduled',
        clock: comp.status?.displayClock || null,
        homeGoals: ourHomeIsEspnHome ? espnHomeGoals : espnAwayGoals,
        awayGoals: ourHomeIsEspnHome ? espnAwayGoals : espnHomeGoals,
      };
      return;
    }

    // ── Knockout stage ──
    const round = SLUG_TO_ROUND[slug];
    if (!round) return;

    const homeDanish = toDanish(homeName);
    const awayDanish = toDanish(awayName);

    // Count the teams that actually reached/appeared in a knockout round once
    // that match is visible as started/completed. This is mostly for display.
    if (hasStarted) {
      if (round === 'r32') {
        knockoutTeams.r32.add(homeDanish);
        knockoutTeams.r32.add(awayDanish);
      }
    }

    // For bonus scoring, use QUALIFICATION instead of match participation:
    // a completed R32 match gives two R32 participants and one R16 qualifier.
    // This makes all 16 R16 qualifiers count as soon as R32 is complete, even
    // before all R16 matches have started.
    if (!isCompleted) return;

    const winnerComp = competitors.find(c => c.winner);
    const winnerName = winnerComp?.team?.displayName;
    const winnerDanish = winnerName ? toDanish(winnerName) : null;
    if (!winnerDanish) return;

    if (round === 'r32') {
      knockoutTeams.r16.add(winnerDanish);
    }
    if (round === 'r16') {
      knockoutTeams.qf.add(winnerDanish);
    }
    if (round === 'qf') {
      knockoutTeams.sf.add(winnerDanish);
    }
    if (round === 'final') {
      knockoutTeams.winner = winnerDanish;
    }
  });

  return {
    matchResults,
    knockoutTeams: {
      r32: [...knockoutTeams.r32],
      r16: [...knockoutTeams.r16],
      qf: [...knockoutTeams.qf],
      sf: [...knockoutTeams.sf],
      winner: knockoutTeams.winner,
    },
  };
}

export function useLiveResults() {
  const [liveData, setLiveData] = useState({});
  const [knockoutData, setKnockoutData] = useState({ r32: [], r16: [], qf: [], sf: [], winner: null });
  const [lastFetch, setLastFetch] = useState(null);
  const [error, setError] = useState(null);
  const intervalRef = useRef(null);

  const fetchOnce = async () => {
    const url = `${ESPN_BASE}?dates=20260611-20260719&limit=300`;
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`ESPN API ${res.status}`);
      const json = await res.json();
      const { matchResults, knockoutTeams } = parseEspnEvents(json.events || []);
      setLiveData(matchResults);
      setKnockoutData(knockoutTeams);
      setLastFetch(Date.now());
      setError(null);
    } catch (e) {
      try {
        const proxied = `${CORS_PROXY}${encodeURIComponent(url)}`;
        const res2 = await fetch(proxied);
        if (!res2.ok) throw new Error(`Proxy ${res2.status}`);
        const json2 = await res2.json();
        const { matchResults, knockoutTeams } = parseEspnEvents(json2.events || []);
        setLiveData(matchResults);
        setKnockoutData(knockoutTeams);
        setLastFetch(Date.now());
        setError(null);
      } catch (e2) {
        setError(e2.message || e.message);
      }
    }
  };

  useEffect(() => {
    fetchOnce();
    intervalRef.current = setInterval(fetchOnce, POLL_MS);
    return () => clearInterval(intervalRef.current);
  }, []);

  return { liveData, knockoutData, lastFetch, error, refetch: fetchOnce };
}
