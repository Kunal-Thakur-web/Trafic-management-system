# Traffic Management System 🚦

An ML-based smart route planner that predicts road congestion and recommends the best route based on actual traffic conditions — not just the shortest path.

The idea was simple — most navigation apps just optimize for distance or a fixed speed estimate. This system actually uses a trained ML model to predict how many vehicles are on the road at a given time and location, then uses that to figure out which route will be fastest *right now*.

---

## How it works (quick summary)

1. User enters origin, destination and travel time on the web app
2. Frontend fetches up to 3 real road routes from OSRM (free routing engine, no API key)
3. For each route, the backend samples 10 points along the road geometry
4. ML model predicts vehicle count at each of those 10 points
5. Average vehicle count → congestion % → effective speed → estimated travel time
6. All 3 routes get ranked and shown on the map, best one highlighted

---

## Project Structure

```
Trafic-management-system/
│
├── scrapper.py                   # Run this FIRST — filters the raw DfT dataset (chunked)
│
├── server.py                     # Flask API — loads the model, scores routes
│
├── app/
│   ├── models/
│   │   └── app_model.pkl         # Saved trained model (joblib)
│   ├── public/
│   │   ├── app.html              # Main frontend (map + side panel)
│   │   └── styles.css
│   └── src/
│       ├── index.js              # All frontend JS — OSRM calls, map rendering, UI
│       └── model.py              # Model training script — run after scrapper.py
│
└── notebooks/
    ├── London_Traffic_DecisionTree.ipynb    # Main notebook (Decision Tree experiments)
    └── London_Traffic_LR_AllJunctions.ipynb # Linear Regression comparison
```

---

## Setup and Running

### Step 1 — Install dependencies

```bash
pip install flask flask-cors scikit-learn joblib numpy pandas
```

### Step 2 — Get the dataset

Download these two files from the [UK DfT open data portal](https://roadtraffic.dft.gov.uk/downloads) and put them in the root folder:

- `dft_traffic_counts_raw_counts.csv`
- `count_points.csv`

These are large files (the raw counts CSV is several GBs). That's why the next step exists.

### Step 3 — Run the scrapper

```bash
python scrapper.py
```

This reads the massive raw CSV in chunks of 100k rows at a time so it doesn't blow up your RAM, filters only the relevant data, and saves a much smaller `london_traffic.csv`. This is what the model actually trains on.

### Step 4 — Train the model

```bash
python app/src/model.py
```

Update the file path at the top of `model.py` to point to your `london_traffic.csv`. This trains a Decision Tree Regressor and saves it as `app/models/app_model.pkl`.

> The `.pkl` file is already included in this repo so you can skip steps 2–4 and go straight to running the server if you just want to test the app.

### Step 5 — Start the server

```bash
python server.py
```

Runs on `http://localhost:5050`

### Step 6 — Open the frontend

Just open `app/public/app.html` in your browser. No extra server needed for the frontend.

---

## ML Model

**Algorithm:** Decision Tree Regressor (scikit-learn)

**Features used for training:**

| Feature | Description |
|---|---|
| `latitude` | Road/junction latitude |
| `longitude` | Road/junction longitude |
| `hour` | Hour of the day (0–23), taken directly from the `hour` column in dataset |
| `day` | Day of the month |
| `month` | Month number |
| `weekday` | Day of week (0=Monday, 6=Sunday) |

**Target:** `all_motor_vehicles` — total vehicle count at that junction

**Split:** 80% train / 20% test, `random_state=42`

After training, the script prints MAE, RMSE and R² on the test set.

Also tried Linear Regression — Decision Tree did better because traffic patterns aren't linear (rush hours, weekends etc. create spikes that LR can't model well).

---

## Route Scoring Logic

This is the actual ML part that runs in `server.py` for every route request:

```
1. Sample 10 evenly spaced coordinates along the route geometry
2. Run ML model at each point → predicted vehicle count
3. Average vehicle count → congestion % (0 to 100, capped at 3200 vehicles)
4. Effective speed: 45 km/h (free flow) → 8 km/h (gridlock), linear degradation
5. base_travel_time = (distance_km / eff_speed) * 60
6. stop_start_delay = base_time * (congestion% / 100) * 0.40
7. final_score = base_time + delay  ← routes sorted by this, lowest = best
```

CO₂ estimate is also included (110 to 150 g/km depending on congestion).

If the model file isn't found, the server automatically falls back to a heuristic based on rush hour times so the app doesn't completely break.

---

## API Endpoints

### `POST /score_routes` — main endpoint

Send OSRM routes, get them ranked by predicted travel time.

**Request body:**
```json
{
  "datetime": "2024-11-15T08:30",
  "routes": [
    {
      "index": 0,
      "distance_m": 12500,
      "duration_s": 920,
      "coordinates": [[-0.12, 51.50], "..."],
      "roads": ["Euston Rd", "Marylebone Rd"]
    }
  ]
}
```

**Response:**
```json
{
  "ranked": [
    {
      "rank": 1,
      "travelMin": 24,
      "roadKm": 11.3,
      "trafficPct": 38.5,
      "avgSpeed": 31,
      "co2": 125,
      "vehicles": 1232.0,
      "score": 24
    }
  ]
}
```

### `POST /predict` — single point debug helper

```json
{ "lat": 51.52, "lon": -0.13, "hour": 8, "day": 15, "month": 11, "weekday": 0 }
```

Returns vehicle count and congestion % at that coordinate.

---

## Bugs Fixed in This Version

A few things were broken in the earlier version that I fixed:

**1. Hour was always 0**
`count_date` in the dataset is a date-only string like `2000-03-27`, so calling `.dt.hour` on it always gives 0. The CSV already has a dedicated `hour` column — `model.py` now uses that directly. This was causing the model to train without any actual hour information, which is a pretty critical feature for traffic prediction.

**2. Feature mismatch between training and inference**
In some earlier code, `year` was accidentally being extracted and used in certain paths but wasn't consistently part of the training features. This caused silent prediction errors where the feature vector shape didn't match. Feature list is now locked to exactly 6 features that match on both sides.

**3. Empty coordinates crash**
If OSRM returned a route with no geometry, the server would crash when trying to sort results. Added a guard to skip those routes instead.

**4. Scrapper added**
The raw DfT CSV is too large to load into memory on most machines. `scrapper.py` processes it in 100k-row chunks, making it actually usable on a normal laptop.

---

## Tech Stack

- **ML / Data:** scikit-learn, pandas, numpy, joblib, matplotlib, seaborn
- **Backend:** Python, Flask, Flask-CORS
- **Frontend:** HTML, CSS, Vanilla JS
- **Map:** Leaflet.js + OpenStreetMap (completely free, no API key needed)
- **Routing:** OSRM public API (also free)
- **Dataset:** UK Department for Transport — publicly available traffic count data

---

## Limitations and What Could Be Improved

- Decision Tree overfits pretty badly on unseen junction+hour combinations. Random Forest or XGBoost would generalize much better — I have a comment about this in model.py but didn't switch before submission
- The dataset uses hourly counts taken at fixed survey points, not live data. Integrating something like the TfL API would make this actually real-time
- Weather is completely ignored — rain increases congestion a lot especially in UK
- The UI isn't mobile-responsive
- Currently only works for one specific region's road network — extending it to other cities would need retraining on data from those areas

---

## Dataset

**Source:** [UK Department for Transport Traffic Counts](https://roadtraffic.dft.gov.uk/downloads)

The raw CSV files are excluded from this repo via `.gitignore` because they're too big for GitHub. Run `scrapper.py` after downloading them to generate the filtered dataset used for training.

---

B.Tech (CSE) — 3rd Year Project | Machine Learning*
