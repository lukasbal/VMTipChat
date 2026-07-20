import { MATCHES, PREDICTIONS, BONUS_PREDICTIONS, SCORING } from './gameData';

// Merge live ESPN data with shared manual overrides (from overrides.json).
// Shared overrides always win for a given match if present (e.g. corrections,
// or matches ESPN doesn't have); otherwise live ESPN data is used.
// Each entry also carries a `live` boolean + status.
export function mergeLiveResults(overrides, liveData) {
  const merged = {};
  MATCHES.forEach(m => {
    const override = overrides[m.id];
    const live = liveData[m.id];

    if (override && override.homeGoals !== undefined && override.awayGoals !== undefined) {
      merged[m.id] = { ...override, live: false, status: 'final' };
      return;
    }

    if (live && live.homeGoals !== null && live.awayGoals !== null) {
      merged[m.id] = {
        homeGoals: live.homeGoals,
        awayGoals: live.awayGoals,
        live: live.status === 'live',
        status: live.status,
        clock: live.clock,
      };
    }
  });
  return merged;
}

// Merge ESPN knockout data with manually-set bonus overrides.
// For each field, manual override wins if present; otherwise ESPN live data is used.
// knockoutData comes from useLiveResults; manualBonus comes from overrides.json's bonus key.
export function mergeBonus(manualBonus, knockoutData) {
  return {
    groupFinishes: manualBonus.groupFinishes || {},
    // r16: our bonus rounds 2 uses R16 (round of 16), not R32
    r16: manualBonus.r16?.length > 0 ? manualBonus.r16 : (knockoutData.r16 || []),
    qf:  manualBonus.qf?.length  > 0 ? manualBonus.qf  : (knockoutData.qf  || []),
    sf:  manualBonus.sf?.length  > 0 ? manualBonus.sf   : (knockoutData.sf  || []),
    // ESPN scoreboard does not provide the tournament top scorer, so this is manual.
    topscorer: manualBonus.topscorer || null,
    winner: manualBonus.winner || knockoutData.winner || null,
  };
}

// Derive outcome from actual score
export function getOutcome(homeGoals, awayGoals) {
  if (homeGoals === null || homeGoals === undefined || awayGoals === null || awayGoals === undefined) return null;
  if (homeGoals > awayGoals) return '1';
  if (homeGoals < awayGoals) return '2';
  return 'X';
}

// Calculate points for a single match
export function calcMatchPoints(prediction, actual) {
  if (!actual || actual.homeGoals === null || actual.homeGoals === undefined) return null;
  if (!prediction) return 0;

  let pts = 0;
  const actualOutcome = getOutcome(actual.homeGoals, actual.awayGoals);

  // 3 pts for correct outcome
  if (prediction.o === actualOutcome) pts += SCORING.correctOutcome;

  // 2 pts per correct digit
  if (prediction.h === actual.homeGoals) pts += SCORING.correctGoal;
  if (prediction.a === actual.awayGoals) pts += SCORING.correctGoal;

  // 1 bonus for exact score (both correct)
  if (prediction.h === actual.homeGoals && prediction.a === actual.awayGoals) pts += SCORING.exactScoreBonus;

  return pts;
}

// Calculate group points for a player given results.
// Returns { total, livePts, finalPts } — livePts is the portion of total
// coming from matches currently in progress (status: 'live').
export function calcGroupPoints(playerId, results) {
  let finalPts = 0;
  let livePts = 0;
  const playerPreds = PREDICTIONS[playerId] || {};
  MATCHES.forEach(m => {
    const actual = results[m.id];
    if (!actual) return;
    const pred = playerPreds[m.id];
    const pts = calcMatchPoints(pred, actual);
    if (pts === null) return;
    if (actual.live) livePts += pts;
    else finalPts += pts;
  });
  return { total: finalPts + livePts, livePts, finalPts };
}

// Calculate bonus points for a player given bonus results
export function calcBonusPoints(playerId, bonusResults) {
  const preds = BONUS_PREDICTIONS[playerId];
  if (!preds) return { b1: 0, b2: 0, b3: 0, b4: 0, b5: 0, total: 0 };
  
  let b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0;

  // Bonus 1: group finishes (10 pts each)
  if (bonusResults.groupFinishes) {
    Object.entries(preds.groupFinishes || {}).forEach(([key, val]) => {
      if (bonusResults.groupFinishes[key] === val) b1 += SCORING.bonus1;
    });
  }

  // Bonus 2: R16 participants (15 pts each)
  if (bonusResults.r16) {
    (preds.r16 || []).forEach(team => {
      if (bonusResults.r16.includes(team)) b2 += SCORING.bonus2;
    });
  }

  // Bonus 3: QF (20 pts each)
  if (bonusResults.qf) {
    (preds.qf || []).forEach(team => {
      if (bonusResults.qf.includes(team)) b3 += SCORING.bonus3;
    });
  }

  // Bonus 4: SF (30 pts each)
  if (bonusResults.sf) {
    (preds.sf || []).forEach(team => {
      if (bonusResults.sf.includes(team)) b4 += SCORING.bonus4;
    });
  }

  // Bonus 5: topscorer + winner
  if (bonusResults.topscorer && bonusResults.topscorer === preds.topscorer) b5 += SCORING.bonus5_topscorer;
  if (bonusResults.winner && bonusResults.winner === preds.winner) b5 += SCORING.bonus5_winner;

  return { b1, b2, b3, b4, b5, total: b1 + b2 + b3 + b4 + b5 };
}

// Full leaderboard calculation
export function calcLeaderboard(players, results, bonusResults) {
  return players.map(p => {
    const group = calcGroupPoints(p.id, results);
    const bonus = calcBonusPoints(p.id, bonusResults);
    const total = group.total + bonus.total;
    return { ...p, groupPts: group.total, livePts: group.livePts, bonus, total };
  }).sort((a, b) => b.total - a.total || b.groupPts - a.groupPts);
}

// Per-match breakdown for a player
export function getMatchBreakdown(playerId, results) {
  const playerPreds = PREDICTIONS[playerId] || {};
  return MATCHES.map(m => {
    const actual = results[m.id];
    const pred = playerPreds[m.id];
    const pts = actual ? calcMatchPoints(pred, actual) : null;
    return { match: m, pred, actual, pts };
  });
}
