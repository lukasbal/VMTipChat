# VM Tips 2026 🏆

Live leaderboard app for the 2026 World Cup tips competition.

## Players
Jeppe, Christian Qvist, Paddy, Lukas, Chrilled, Chrisser, Magnor (Von Thistle)

## Features
- 🏅 Live leaderboard with group points + bonus points
- 🔴 **Automatic live results** — pulls real scores from ESPN's free public scoreboard API every 30 seconds, no API key needed
- **Live (+X pts) highlight** — while a match is in progress, anyone whose prediction matches the current score gets a flashing `(+X pts)` next to their name on the leaderboard, so you can watch points roll in live
- ⚽ All 72 group stage matches — see who predicted what
- 👤 Player detail view with per-match breakdown
- ⭐ Bonus rounds tracker (group finishes, R16, QF, SF, top scorer, winner)
- ✏️ Admin panel to manually correct results if needed (auto-sync is the default; manual entry overrides it)
- 🌑 Dark mode throughout

## How live results work

The app polls `https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard` — ESPN's free, public, no-key scoreboard endpoint — every 30 seconds while the app is open. It matches matches by team name to your prediction sheet automatically.

- **No setup required** — works the moment you deploy
- **No cost** — this is a free public endpoint
- **Manual override available** — if ESPN's data is ever wrong, missing, or delayed, use the ✏️ Resultater panel to correct it; corrections always take priority over the live feed
- If the live fetch is ever blocked by a browser's CORS policy, the app automatically retries through a public CORS proxy. If both fail, a small warning banner appears and you can fall back to manual entry — nothing else breaks
- Since this is an unofficial/undocumented ESPN endpoint, it could theoretically change without notice; the manual entry panel is always there as a backup

## How shared corrections work (no backend needed)

There's no server, so manual corrections (✏️ Resultater and ⭐ Bonus) can't save themselves automatically — but they're still visible to everyone, not just your device. Here's how:

1. Everything you enter in those panels gets turned into the content of one file: `public/overrides.json`
2. Click **"📋 Kopiér JSON"** in the panel — this copies the *entire* new file content to your clipboard
3. Go to `overrides.json` in your GitHub repository (in the `public` folder) on github.com
4. Click the ✏️ pencil icon to edit the file
5. Select all existing content, delete it, paste in what you copied
6. Click **"Commit changes"** at the bottom

Once committed, GitHub Pages rebuilds automatically (via the same Actions workflow) and everyone's app picks up the change within a minute or two — no app reinstall or redeploy needed beyond that.

**Note:** GitHub Pages briefly caches files, so it can take 1–2 minutes after committing before everyone sees the update.


## Scoring Rules
| Event | Points |
|---|---|
| Correct outcome (1X2) | 3 |
| Correct goal per digit | 2 |
| Exact score bonus | 1 |
| Group placement (bonus 1) | 10 |
| R16 participant (bonus 2) | 15 |
| Quarterfinal (bonus 3) | 20 |
| Semifinal (bonus 4) | 30 |
| Top scorer (bonus 5) | 40 |
| Tournament winner (bonus 5) | 50 |

## Setup

```bash
npm install
npm run dev
```

Open http://localhost:5173

## Deploy to GitHub Pages (fully automatic — no terminal needed)

This project includes a GitHub Actions workflow that builds and publishes the app automatically every time you push, straight from GitHub Desktop. You only need to do this **once**:

1. Push this project to a GitHub repository (e.g. via GitHub Desktop → "Publish repository")
2. On GitHub.com, go to your repo → **Settings** → **Pages**
3. Under "Build and deployment" → **Source**, select **GitHub Actions** (not "Deploy from a branch")
4. Go to the **Actions** tab in your repo — you should see a workflow run start automatically (it runs on every push to `main`)
5. Wait about 1–2 minutes for it to finish (green checkmark ✅)
6. Your site is live at `https://YOUR-USERNAME.github.io/YOUR-REPO-NAME/`

From now on, every time you commit and push changes (even from GitHub Desktop, no terminal needed), the site rebuilds and updates automatically within a minute or two.

**Note:** the `base` path in `vite.config.js` is auto-detected from your repo name during the GitHub Actions build, so you never need to edit it manually.

## How to use

- Open the app — everyone can see the live leaderboard and match predictions, updating automatically as real matches happen
- Watch the leaderboard during a live match — anyone whose prediction matches the current score shows a flashing `(+X pts)` next to their name
- Click **✏️ Resultater** only if you need to correct or manually add a result ESPN's feed missed — then follow the in-app steps to publish it via GitHub (see above)
- Click **⭐ Bonus** to enter knockout round results as the tournament progresses (no free live source covers these long-term bonus bets, so they stay manual) — same publish steps apply
- Tap any player on the leaderboard to see their full prediction breakdown
- Tap any match in the Matches tab to see all 7 predictions side by side, with a 🔴 LIVE badge and match clock while it's in progress

## Data

All predictions are pre-loaded from the Excel sheet and baked into the code. Match-result corrections and bonus answers live in `public/overrides.json` in the repo, which every visitor's browser fetches directly — so once you commit a change there, it's visible to everyone, not just your own device.
