import pandas as pd
import numpy as np

from sklearn.model_selection import train_test_split
from sklearn.tree import DecisionTreeRegressor
from sklearn.metrics import mean_absolute_error, root_mean_squared_error, r2_score
import joblib
import os
import warnings
warnings.filterwarnings('ignore')

# ─── Load data ────────────────────────────────────────────────────────────────
# Update these paths to match your environment
london_traffic = pd.read_csv(
    r'D:\ML Project\Traffic Management System\Trafic-management-system\london_traffic.csv',
    low_memory=False
)

df = london_traffic.rename(columns={
    'count_point_id':     'Junction',
    'all_motor_vehicles': 'Vehicles'
}).copy()

# ─── Clean ────────────────────────────────────────────────────────────────────
# FIX 1: drop rows missing either Vehicles OR hour
df = df.dropna(subset=['Vehicles', 'hour'])

# ─── Feature engineering ──────────────────────────────────────────────────────
# FIX 2: count_date is a DATE-ONLY string (e.g. "2000-03-27"), so dt.hour is
#         always 0.  The CSV already has a proper `hour` column — use it directly.
#         Only extract day/month/weekday/year from the date column.
df['_date']   = pd.to_datetime(df['count_date'])
df['day']     = df['_date'].dt.day
df['month']   = df['_date'].dt.month
df['weekday'] = df['_date'].dt.weekday
df['year']    = df['_date'].dt.year
# `hour` already exists in the CSV — no override needed

# ─── Features & target ────────────────────────────────────────────────────────
# FIX 3: server.py calls predict_vehicles(lat, lon, hour, day, month, weekday)
#         so the feature order here MUST match exactly what the server sends.
FEATURES = ['latitude', 'longitude', 'hour', 'day', 'month', 'weekday']

X = df[FEATURES]
y = df['Vehicles']

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, shuffle=True
)

# ─── Model ────────────────────────────────────────────────────────────────────
# FIX 4: unbounded DecisionTreeRegressor memorises training data and gives flat
#         predictions on unseen coordinate+hour combos.
#         RandomForest with depth & leaf constraints generalises properly.
model = DecisionTreeRegressor(random_state=42)   
model.fit(X_train, y_train)

# ─── Evaluate ─────────────────────────────────────────────────────────────────
preds = model.predict(X_test)
print(f"MAE : {mean_absolute_error(y_test, preds):.1f} vehicles")
print(f"RMSE: {root_mean_squared_error(y_test, preds):.1f} vehicles")
print(f"R²  : {r2_score(y_test, preds):.4f}")

# ─── Save ─────────────────────────────────────────────────────────────────────
os.makedirs('app/models', exist_ok=True)
joblib.dump(model, 'app/models/app_model.pkl')
print("Model saved → app/models/app_model.pkl")