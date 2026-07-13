# F1 Intelligence

AI-Powered Formula One race prediction and analytics platform. Uses XGBoost trained on historical F1 data to predict race winners, podiums, and outcomes, with interactive charts and a dataset explorer.

## Run & Operate

- `artifacts/f1-intelligence: web` workflow — React + Vite frontend (port auto-assigned, route: `/`)
- `artifacts/api-server: API Server` workflow — Python FastAPI ML backend (port 8080, route: `/api`)
- Frontend hits `/api/*` routes via the shared Replit reverse proxy

## Stack

- **Frontend**: React + Vite + Tailwind CSS, Wouter routing, Recharts, Framer Motion
- **Backend**: Python FastAPI + Uvicorn
- **ML**: XGBoost (scikit-learn pipeline), trained on Jolpica F1 API data (Ergast-compatible)
- **Data**: Jolpica F1 API (`api.jolpi.ca/ergast/f1/`) — race results, standings, qualifying
- **Cache**: JSON file cache in `artifacts/api-server/.f1_cache/` (24h TTL)

## Pages

- `/` — Landing page with F1 track animation and Matrix Green hero
- `/dashboard` — Season/GP selectors, XGBoost race prediction, 6 interactive analytics charts
- `/insights` — ML model explanation, feature importance, XGBoost details
- `/dataset` — Historical race data explorer with search, filter, sort, pagination

## Backend Files

- `artifacts/api-server/main.py` — FastAPI app, routes, lifespan (data warm + model train)
- `artifacts/api-server/f1_data.py` — F1DataService: fetches + caches all historical data
- `artifacts/api-server/ml_model.py` — F1Predictor: XGBoost training + prediction + explanations

## Key API Endpoints

- `POST /api/predict` — Run XGBoost prediction for a race (year + round)
- `GET /api/races?year=2024` — Race calendar
- `GET /api/drivers?year=2024` — Driver list
- `GET /api/analytics/driver-performance?driver=VER&year=2024` — Driver finish positions
- `GET /api/analytics/constructor-standings?year=2024` — Points progression
- `GET /api/analytics/win-percentage?year=2024` — Win % by driver
- `GET /api/analytics/pole-positions?year=2024` — Pole stats
- `GET /api/analytics/circuit-performance?driver=VER` — Driver by circuit
- `GET /api/analytics/avg-finish?year=2024` — Average finish positions
- `GET /api/dataset?search=...&year=...` — Dataset explorer (paginated)

## Architecture decisions

- Python FastAPI replaces the original Node.js api-server artifact (artifact.toml updated via verifyAndReplaceArtifactToml)
- No auth — public app, no login required
- XGBoost trained at startup on 2021-2024 race data (~1,200+ entries); falls back to standings-based prediction if API is rate-limited
- Jolpica API responses cached to `.f1_cache/` JSON files to avoid rate limiting on repeated calls
- OpenAPI spec in `lib/api-spec/openapi.yaml` drives codegen for typed React Query hooks

## Visual Identity (Telemetry Command DS)

- Background: `#131313` (Obsidian dark)
- Primary: `#00ff41` (Matrix Green)
- Font: JetBrains Mono (monospaced throughout)
- ASCII borders, █░ progress bars, terminal aesthetic

## Gotchas

- Jolpica F1 API rate-limits at ~50 req/min — startup warm-up intentionally skips missing rounds
- First startup takes ~15-30s to fetch and cache race data, then train the model
- `.f1_cache/` persists across restarts; delete it to force a fresh data fetch
- `pnpm --filter @workspace/api-spec run codegen` must be re-run after any OpenAPI spec changes

## User preferences

_Populate as you build._
