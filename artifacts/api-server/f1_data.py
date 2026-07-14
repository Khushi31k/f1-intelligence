"""
F1 Data Service — fetches and caches historical F1 data from Jolpica F1 API
(Ergast-compatible: https://api.jolpi.ca/ergast/f1/)
"""
import json
import os
import time
import logging
import requests
from typing import Optional, List, Dict, Any

logger = logging.getLogger(__name__)

# Cache directory — use /tmp on read-only filesystems (e.g. Vercel), local dir otherwise
_default_cache = os.path.join(os.path.dirname(__file__), ".f1_cache")
try:
    os.makedirs(_default_cache, exist_ok=True)
    CACHE_DIR = _default_cache
except OSError:
    CACHE_DIR = "/tmp/f1_cache"
    os.makedirs(CACHE_DIR, exist_ok=True)

BASE_URL = "https://api.jolpi.ca/ergast/f1"

TEAM_COLORS = {
    "Red Bull": "#3671C6",
    "red_bull": "#3671C6",
    "Ferrari": "#E8002D",
    "ferrari": "#E8002D",
    "Mercedes": "#27F4D2",
    "mercedes": "#27F4D2",
    "McLaren": "#FF8000",
    "mclaren": "#FF8000",
    "Aston Martin": "#229971",
    "aston_martin": "#229971",
    "Alpine": "#FF87BC",
    "alpine": "#FF87BC",
    "Williams": "#64C4FF",
    "williams": "#64C4FF",
    "RB": "#6692FF",
    "rb": "#6692FF",
    "AlphaTauri": "#5E8FAA",
    "alphatauri": "#5E8FAA",
    "Haas": "#B6BABD",
    "haas": "#B6BABD",
    "Alfa Romeo": "#C92D4B",
    "alfa": "#C92D4B",
    "Sauber": "#00E48B",
    "kick_sauber": "#00E48B",
}


def get_team_color(team_name: str) -> Optional[str]:
    if not team_name:
        return None
    for key, color in TEAM_COLORS.items():
        if key.lower() in team_name.lower():
            return color
    return "#00ff41"


def _cache_path(key: str) -> str:
    safe = key.replace("/", "_").replace("?", "_").replace("&", "_")
    return os.path.join(CACHE_DIR, f"{safe}.json")


def _load_cache(key: str, max_age_hours: int = 24) -> Optional[Any]:
    path = _cache_path(key)
    if not os.path.exists(path):
        return None
    age = time.time() - os.path.getmtime(path)
    if age > max_age_hours * 3600:
        return None
    try:
        with open(path) as f:
            return json.load(f)
    except Exception:
        return None


def _save_cache(key: str, data: Any):
    path = _cache_path(key)
    try:
        with open(path, "w") as f:
            json.dump(data, f)
    except Exception as e:
        logger.warning(f"Cache write failed: {e}")


def _fetch(path: str, params: dict = None, max_age_hours: int = 24) -> Optional[dict]:
    """Fetch from Jolpica API with caching"""
    cache_key = path + str(params or "")
    cached = _load_cache(cache_key, max_age_hours)
    if cached is not None:
        return cached

    url = f"{BASE_URL}{path}.json"
    try:
        resp = requests.get(url, params=params, timeout=15)
        resp.raise_for_status()
        data = resp.json()
        _save_cache(cache_key, data)
        return data
    except Exception as e:
        logger.warning(f"API fetch failed {url}: {e}")
        return None


class F1DataService:
    def __init__(self):
        self._dataset_cache: Optional[List[Dict]] = None
        self._races_cache: Dict[int, List] = {}

    @property
    def is_cached(self) -> bool:
        return self._dataset_cache is not None and len(self._dataset_cache) > 0

    def warm_cache(self):
        """Pre-fetch key data for recent seasons"""
        for year in [2022, 2023, 2024]:
            self.get_races(year)
            self._fetch_all_results(year)
        logger.info("Cache warmed")

    # ─────────────────────────────────────────
    # Core fetchers
    # ─────────────────────────────────────────

    def get_races(self, year: int = 2024) -> List[Dict]:
        if year in self._races_cache:
            return self._races_cache[year]

        data = _fetch(f"/{year}")
        if not data:
            return self._fallback_races(year)

        races_raw = data.get("MRData", {}).get("RaceTable", {}).get("Races", [])
        races = []
        for r in races_raw:
            races.append({
                "round": int(r.get("round", 0)),
                "name": r.get("raceName", ""),
                "circuit": r.get("Circuit", {}).get("circuitName", ""),
                "country": r.get("Circuit", {}).get("Location", {}).get("country", ""),
                "locality": r.get("Circuit", {}).get("Location", {}).get("locality", ""),
                "date": r.get("date", ""),
                "year": year,
            })

        self._races_cache[year] = races
        return races

    def get_drivers(self, year: int = 2024) -> List[Dict]:
        data = _fetch(f"/{year}/drivers", max_age_hours=168)
        if not data:
            return self._fallback_drivers()

        drivers_raw = data.get("MRData", {}).get("DriverTable", {}).get("Drivers", [])
        # Get standings to get team info
        standings = self.get_driver_standings(year)
        team_map = {s["driver"]: (s["team"], s.get("teamColor")) for s in standings}

        results = []
        for d in drivers_raw:
            full = f"{d.get('givenName', '')} {d.get('familyName', '')}".strip()
            code = d.get("code", "")
            team, color = team_map.get(full, ("Unknown", None))
            results.append({
                "code": code,
                "name": full,
                "team": team,
                "number": int(d.get("permanentNumber", 0) or 0),
                "nationality": d.get("nationality", ""),
                "teamColor": color or get_team_color(team),
            })
        return results

    def get_constructors(self, year: int = 2024) -> List[Dict]:
        data = _fetch(f"/{year}/constructors", max_age_hours=168)
        if not data:
            return []

        raw = data.get("MRData", {}).get("ConstructorTable", {}).get("Constructors", [])
        return [
            {
                "id": c.get("constructorId", ""),
                "name": c.get("name", ""),
                "nationality": c.get("nationality", ""),
                "color": get_team_color(c.get("name", "")),
            }
            for c in raw
        ]

    def get_driver_standings(self, year: int = 2024) -> List[Dict]:
        data = _fetch(f"/{year}/driverStandings", max_age_hours=6)
        if not data:
            return []

        standings_lists = (
            data.get("MRData", {})
            .get("StandingsTable", {})
            .get("StandingsLists", [])
        )
        standings_raw = standings_lists[0].get("DriverStandings", []) if standings_lists else []

        results = []
        for s in standings_raw:
            driver = s.get("Driver", {})
            team = s.get("Constructors", [{}])[0].get("name", "Unknown")
            full = f"{driver.get('givenName', '')} {driver.get('familyName', '')}".strip()
            results.append({
                "position": int(s.get("position", 0)),
                "driver": full,
                "team": team,
                "points": float(s.get("points", 0)),
                "wins": int(s.get("wins", 0)),
                "nationality": driver.get("nationality", ""),
                "teamColor": get_team_color(team),
            })
        return results

    def _fetch_all_results(self, year: int) -> List[Dict]:
        """Fetch all race results for a season and flatten into rows"""
        cache_key = f"all_results_{year}"
        cached = _load_cache(cache_key, max_age_hours=24)
        if cached:
            return cached

        races = self.get_races(year)
        rows = []
        for race in races:
            round_num = race["round"]
            data = _fetch(f"/{year}/{round_num}/results")
            if not data:
                continue
            races_in_data = (
                data.get("MRData", {})
                .get("RaceTable", {})
                .get("Races", [])
            )
            if not races_in_data:
                continue
            results_raw = races_in_data[0].get("Results", [])
            for r in results_raw:
                driver = r.get("Driver", {})
                constructor = r.get("Constructor", {})
                team_name = constructor.get("name", "Unknown")
                full_name = f"{driver.get('givenName', '')} {driver.get('familyName', '')}".strip()
                pos = r.get("position")
                grid = r.get("grid")
                fl = r.get("FastestLap", {}).get("rank") == "1"
                rows.append({
                    "year": year,
                    "round": round_num,
                    "raceName": race["name"],
                    "circuit": race["circuit"],
                    "country": race["country"],
                    "driver": full_name,
                    "driverCode": driver.get("code", ""),
                    "team": team_name,
                    "position": int(pos) if pos and pos.isdigit() else None,
                    "points": float(r.get("points", 0)),
                    "gridPosition": int(grid) if grid and grid.isdigit() else None,
                    "fastestLap": fl,
                    "lapsCompleted": int(r.get("laps", 0) or 0),
                    "status": r.get("status", ""),
                    "teamColor": get_team_color(team_name),
                })

        _save_cache(cache_key, rows)
        return rows

    def _get_qualifying(self, year: int, round_num: int) -> List[Dict]:
        """Get qualifying results for grid position mapping"""
        data = _fetch(f"/{year}/{round_num}/qualifying")
        if not data:
            return []
        races_in_data = (
            data.get("MRData", {})
            .get("RaceTable", {})
            .get("Races", [])
        )
        raw = races_in_data[0].get("QualifyingResults", []) if races_in_data else []
        results = []
        for q in raw:
            driver = q.get("Driver", {})
            full = f"{driver.get('givenName', '')} {driver.get('familyName', '')}".strip()
            results.append({
                "driver": full,
                "driverCode": driver.get("code", ""),
                "position": int(q.get("position", 0)),
                "team": q.get("Constructor", {}).get("name", ""),
            })
        return results

    # ─────────────────────────────────────────
    # Analytics
    # ─────────────────────────────────────────

    def get_driver_performance(self, driver_code: str, year: int = 2024) -> List[Dict]:
        rows = self._fetch_all_results(year)
        # Match by code or name contains code
        driver_rows = [
            r for r in rows
            if r.get("driverCode", "").upper() == driver_code.upper()
            or driver_code.upper() in r.get("driver", "").upper()
        ]
        return [
            {
                "round": r["round"],
                "raceName": r["raceName"],
                "position": r["position"],
                "points": r["points"],
                "team": r["team"],
                "teamColor": r.get("teamColor"),
                "fastestLap": r["fastestLap"],
            }
            for r in sorted(driver_rows, key=lambda x: x["round"])
        ]

    def get_constructor_standings_progression(self, year: int = 2024) -> List[Dict]:
        rows = self._fetch_all_results(year)
        from collections import defaultdict

        # Cumulative points per constructor per round
        team_points: Dict[str, float] = defaultdict(float)
        team_colors: Dict[str, str] = {}
        progression = []

        rounds = sorted(set(r["round"] for r in rows))
        for rnd in rounds:
            rnd_rows = [r for r in rows if r["round"] == rnd]
            race_name = rnd_rows[0]["raceName"] if rnd_rows else f"Round {rnd}"
            for r in rnd_rows:
                team_points[r["team"]] += r["points"]
                team_colors[r["team"]] = r.get("teamColor") or get_team_color(r["team"])

            for team, pts in sorted(team_points.items(), key=lambda x: -x[1])[:10]:
                progression.append({
                    "round": rnd,
                    "raceName": race_name,
                    "constructor": team,
                    "points": pts,
                    "color": team_colors.get(team),
                })
        return progression

    def get_win_percentage(self, year: int = 2024) -> List[Dict]:
        rows = self._fetch_all_results(year)
        from collections import defaultdict
        races_count = len(set(r["round"] for r in rows))
        wins: Dict[str, int] = defaultdict(int)
        race_counts: Dict[str, int] = defaultdict(int)
        teams: Dict[str, str] = {}
        colors: Dict[str, str] = {}

        for r in rows:
            driver = r["driver"]
            race_counts[driver] += 1
            teams[driver] = r["team"]
            colors[driver] = r.get("teamColor") or ""
            if r["position"] == 1:
                wins[driver] += 1

        results = []
        for driver, count in race_counts.items():
            results.append({
                "driver": driver,
                "wins": wins[driver],
                "races": count,
                "winPct": round(wins[driver] / count * 100, 1) if count else 0,
                "team": teams[driver],
                "teamColor": colors.get(driver) or get_team_color(teams[driver]),
            })
        return sorted(results, key=lambda x: -x["wins"])[:15]

    def get_pole_positions(self, year: int = 2024) -> List[Dict]:
        rows = self._fetch_all_results(year)
        from collections import defaultdict
        poles: Dict[str, int] = defaultdict(int)
        teams: Dict[str, str] = {}
        colors: Dict[str, str] = {}

        for r in rows:
            driver = r["driver"]
            teams[driver] = r["team"]
            colors[driver] = r.get("teamColor") or ""
            if r.get("gridPosition") == 1:
                poles[driver] += 1

        return sorted([
            {
                "driver": driver,
                "poles": count,
                "team": teams[driver],
                "teamColor": colors.get(driver) or get_team_color(teams[driver]),
            }
            for driver, count in poles.items()
            if count > 0
        ], key=lambda x: -x["poles"])

    def get_circuit_performance(self, driver_code: str, year: int = 2024) -> List[Dict]:
        """Driver performance by circuit across recent seasons"""
        from collections import defaultdict
        circuit_stats: Dict[str, Dict] = defaultdict(lambda: {"positions": [], "country": "", "wins": 0})

        for yr in [2022, 2023, 2024]:
            rows = self._fetch_all_results(yr)
            for r in rows:
                if (
                    r.get("driverCode", "").upper() == driver_code.upper()
                    or driver_code.upper() in r.get("driver", "").upper()
                ):
                    circ = r["circuit"]
                    circuit_stats[circ]["country"] = r.get("country", "")
                    if r["position"] is not None:
                        circuit_stats[circ]["positions"].append(r["position"])
                    if r["position"] == 1:
                        circuit_stats[circ]["wins"] += 1

        results = []
        for circ, stats in circuit_stats.items():
            positions = stats["positions"]
            if not positions:
                continue
            results.append({
                "circuit": circ,
                "country": stats["country"],
                "avgPosition": round(sum(positions) / len(positions), 1),
                "bestPosition": min(positions),
                "races": len(positions),
                "wins": stats["wins"],
            })
        return sorted(results, key=lambda x: x["avgPosition"])

    def get_avg_finish(self, year: int = 2024) -> List[Dict]:
        rows = self._fetch_all_results(year)
        from collections import defaultdict
        positions: Dict[str, List[int]] = defaultdict(list)
        teams: Dict[str, str] = {}
        colors: Dict[str, str] = {}

        for r in rows:
            if r["position"] is not None:
                positions[r["driver"]].append(r["position"])
                teams[r["driver"]] = r["team"]
                colors[r["driver"]] = r.get("teamColor") or ""

        return sorted([
            {
                "driver": driver,
                "avgPosition": round(sum(pos_list) / len(pos_list), 2),
                "team": teams[driver],
                "races": len(pos_list),
                "teamColor": colors.get(driver) or get_team_color(teams[driver]),
            }
            for driver, pos_list in positions.items()
            if len(pos_list) >= 3
        ], key=lambda x: x["avgPosition"])[:20]

    # ─────────────────────────────────────────
    # Dataset explorer
    # ─────────────────────────────────────────

    def get_dataset(
        self,
        search: Optional[str] = None,
        year: Optional[int] = None,
        driver: Optional[str] = None,
        constructor: Optional[str] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> Dict:
        # Aggregate across recent seasons
        all_rows = []
        years_to_load = [year] if year else [2022, 2023, 2024]
        for yr in years_to_load:
            all_rows.extend(self._fetch_all_results(yr))

        # Filter
        filtered = all_rows
        if search:
            s = search.lower()
            filtered = [
                r for r in filtered
                if s in r["driver"].lower()
                or s in r["team"].lower()
                or s in r["circuit"].lower()
                or s in r["raceName"].lower()
                or s in r.get("driverCode", "").lower()
            ]
        if driver:
            filtered = [
                r for r in filtered
                if driver.upper() in r.get("driverCode", "").upper()
                or driver.lower() in r["driver"].lower()
            ]
        if constructor:
            filtered = [
                r for r in filtered
                if constructor.lower() in r["team"].lower()
            ]

        total = len(filtered)
        page = filtered[offset : offset + limit]

        # Remove teamColor from dataset rows (not in schema)
        rows = []
        for r in page:
            row = dict(r)
            row.pop("teamColor", None)
            rows.append(row)

        return {"total": total, "rows": rows}

    # ─────────────────────────────────────────
    # ML helpers
    # ─────────────────────────────────────────

    def get_training_data(self) -> List[Dict]:
        """Return all historical rows for model training"""
        all_rows = []
        for yr in [2021, 2022, 2023, 2024]:
            all_rows.extend(self._fetch_all_results(yr))
        return all_rows

    def get_race_entry_list(self, year: int, round_num: int) -> List[Dict]:
        """Return the expected entry list for a future/target race"""
        # Use current season driver standings as the entry list
        standings = self.get_driver_standings(year)

        # Get qualifying if available (for grid position)
        qual = self._get_qualifying(year, round_num)
        qual_map = {q["driver"]: q["position"] for q in qual}

        # Get circuit name
        races = self.get_races(year)
        race = next((r for r in races if r["round"] == round_num), {})

        entries = []
        for s in standings:
            driver = s["driver"]
            entries.append({
                "driver": driver,
                "team": s["team"],
                "teamColor": s.get("teamColor"),
                "gridPosition": qual_map.get(driver, len(standings)),
                "points": s["points"],
                "wins": s["wins"],
                "circuit": race.get("circuit", "Unknown"),
                "country": race.get("country", "Unknown"),
            })
        return entries

    # ─────────────────────────────────────────
    # Fallbacks (static data if API is down)
    # ─────────────────────────────────────────

    def _fallback_races(self, year: int) -> List[Dict]:
        return [
            {"round": 1, "name": "Bahrain Grand Prix", "circuit": "Bahrain International Circuit", "country": "Bahrain", "locality": "Sakhir", "date": f"{year}-03-05", "year": year},
            {"round": 2, "name": "Saudi Arabian Grand Prix", "circuit": "Jeddah Corniche Circuit", "country": "Saudi Arabia", "locality": "Jeddah", "date": f"{year}-03-19", "year": year},
            {"round": 3, "name": "Australian Grand Prix", "circuit": "Albert Park Grand Prix Circuit", "country": "Australia", "locality": "Melbourne", "date": f"{year}-03-26", "year": year},
        ]

    def _fallback_drivers(self) -> List[Dict]:
        return [
            {"code": "VER", "name": "Max Verstappen", "team": "Red Bull", "number": 1, "nationality": "Dutch", "teamColor": "#3671C6"},
            {"code": "PER", "name": "Sergio Perez", "team": "Red Bull", "number": 11, "nationality": "Mexican", "teamColor": "#3671C6"},
            {"code": "HAM", "name": "Lewis Hamilton", "team": "Mercedes", "number": 44, "nationality": "British", "teamColor": "#27F4D2"},
        ]
