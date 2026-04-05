"""
server.py — Flask backend for London Traffic Route Planner

Endpoints:
  POST /score_routes   ← MAIN endpoint
    Receives up to 3 OSRM candidate routes (real road geometry + distance/duration).
    Runs the ML model on each route's actual road coordinates to predict vehicle
    counts at ~10 sampled points along every route.
    Scores each route as:
        score = travel_time_with_traffic  (lower = better)
    Returns all routes ranked, best route first.

  POST /predict        ← single-point helper (kept for debugging)
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import numpy as np
import os
import math
from datetime import datetime, timedelta

app = Flask(__name__)
CORS(app)

# ─── Load model ───────────────────────────────────────────────────────────────
MODEL_PATH = os.path.join(os.path.dirname(__file__), 'app', 'models', 'app_model.pkl')

try:
    model = joblib.load(MODEL_PATH)
    print(f"[server] Model loaded from {MODEL_PATH}")
except FileNotFoundError:
    model = None
    print(f"[server] WARNING: model not found at {MODEL_PATH}. "
          "Run model.py first. Falling back to heuristic.")


# ─── Core ML helpers ──────────────────────────────────────────────────────────

def predict_vehicles(lat, lon, hour, day, month, weekday):
    """Predict vehicle count at a single road coordinate."""
    if model is not None:
        X = np.array([[lat, lon, hour, day, month, weekday]])
        return float(model.predict(X)[0])
    # Heuristic fallback — deterministic so different routes get different scores
    rush = (7 <= hour <= 9) or (17 <= hour <= 19)
    base = 1800 if rush else 900
    noise = (hash((round(lat, 3), round(lon, 3), hour)) % 400) - 200
    return max(200.0, base + noise)


def vehicles_to_traffic_pct(vehicles):
    """Vehicle count → 0-100 congestion %."""
    return min(100.0, max(0.0, (vehicles / 3200.0) * 100.0))


def sample_route_coords(coordinates, n_samples=10):
    """
    Evenly sample n_samples points from a route geometry.
    coordinates: list of [lon, lat]  (GeoJSON / OSRM order)
    Returns list of (lat, lon) tuples for the model.
    """
    total = len(coordinates)
    if total == 0:
        return []
    if total <= n_samples:
        return [(c[1], c[0]) for c in coordinates]
    indices = [round(i * (total - 1) / (n_samples - 1)) for i in range(n_samples)]
    return [(coordinates[i][1], coordinates[i][0]) for i in indices]


def score_route(coordinates, distance_m, hour, day, month, weekday):
    """
    Score one OSRM route using ML traffic predictions on its actual geometry.

    Traffic-aware travel time:
      - Sample 10 real road points spread evenly along the route
      - ML predicts vehicle count at each point
      - Average vehicle counts → traffic_pct (0-100)
      - Effective speed = 45 - (45-8) * traffic_pct/100  (free-flow to gridlock)
      - travel_min = (km / effective_speed) * 60  +  stop-start delay
      - score = travel_min  (lower = better — this is what the selection is based on)
    """
    road_km = round(distance_m / 1000.0, 2)

    sampled = sample_route_coords(coordinates, n_samples=10)
    if not sampled:
        return None

    preds = [predict_vehicles(lat, lon, hour, day, month, weekday)
             for lat, lon in sampled]

    avg_vehicles = float(np.mean(preds))
    traffic_pct  = vehicles_to_traffic_pct(avg_vehicles)

    # Speed degrades linearly with congestion: 45 km/h → 8 km/h
    free_flow  = 45.0
    min_speed  = 8.0
    eff_speed  = max(min_speed, free_flow - (free_flow - min_speed) * (traffic_pct / 100.0))

    base_min   = (road_km / eff_speed) * 60.0
    # Stop-start penalty: up to 40% of base time added at full congestion
    delay      = round(base_min * (traffic_pct / 100.0) * 0.40)
    travel_min = round(base_min) + delay
    co2        = round(110 + (traffic_pct / 100.0) * 40)

    return {
        'roadKm':     road_km,
        'travelMin':  travel_min,
        'delay':      delay,
        'avgSpeed':   round(eff_speed),
        'trafficPct': round(traffic_pct, 1),
        'co2':        co2,
        'vehicles':   round(avg_vehicles, 1),
        'score':      travel_min,   # ← the key selection criterion
    }


# ─── Endpoints ────────────────────────────────────────────────────────────────

@app.route('/predict', methods=['POST'])
def predict():
    data = request.get_json(force=True)
    try:
        lat     = float(data['lat'])
        lon     = float(data['lon'])
        hour    = int(data['hour'])
        day     = int(data['day'])
        month   = int(data['month'])
        weekday = int(data['weekday'])
    except (KeyError, ValueError) as e:
        return jsonify({'error': f'Bad input: {e}'}), 400

    vehicles    = predict_vehicles(lat, lon, hour, day, month, weekday)
    traffic_pct = vehicles_to_traffic_pct(vehicles)
    return jsonify({'vehicles': round(vehicles, 1), 'traffic_pct': round(traffic_pct, 1)})


@app.route('/score_routes', methods=['POST'])
def score_routes_endpoint():
    """
    Request body:
    {
      "datetime": "YYYY-MM-DDTHH:MM",
      "routes": [
        {
          "index":       0,
          "distance_m":  12500,
          "duration_s":  920,
          "coordinates": [[lon, lat], ...],   ← full GeoJSON geometry from OSRM
          "roads":       ["Euston Rd", ...]   ← step names from OSRM
        },
        ...up to 3
      ]
    }

    Response:
    {
      "ranked": [
        {
          "osrm_index": 0,       ← original OSRM route index
          "rank":       1,       ← 1 = best (lowest traffic-weighted travel time)
          "roadKm":     12.5,
          "travelMin":  28,
          "delay":      4,
          "avgSpeed":   28,
          "trafficPct": 42.1,
          "co2":        127,
          "vehicles":   1348,
          "score":      28,
          "roads":      [...],
          "coordinates": [[lon,lat], ...]
        },
        ...sorted best-first
      ]
    }
    """
    data = request.get_json(force=True)

    try:
        dt_str = data.get('datetime', datetime.now().isoformat()[:16])
        dt     = datetime.fromisoformat(dt_str)
        routes = data['routes']
        if not routes:
            return jsonify({'error': 'No routes supplied'}), 400
    except (KeyError, ValueError) as e:
        return jsonify({'error': f'Bad input: {e}'}), 400

    hour    = dt.hour
    day     = dt.day
    month   = dt.month
    weekday = dt.weekday()

    scored = []
    for r in routes:
        coords     = r.get('coordinates', [])
        distance_m = float(r.get('distance_m', 0))
        roads      = r.get('roads', [])
        osrm_index = int(r.get('index', 0))

        stats = score_route(coords, distance_m, hour, day, month, weekday)
        if stats is None:
            continue

        stats['osrm_index']  = osrm_index
        stats['roads']       = roads
        stats['coordinates'] = coords
        scored.append(stats)

    if not scored:
        return jsonify({'error': 'Could not score any route'}), 500

    # Sort ascending by score — best (lowest travel time) first
    scored.sort(key=lambda x: x['score'])
    for i, s in enumerate(scored):
        s['rank'] = i + 1

    return jsonify({'ranked': scored})


if __name__ == '__main__':
    print("[server] Starting on http://localhost:5050")
    app.run(host='0.0.0.0', port=5050, debug=True)