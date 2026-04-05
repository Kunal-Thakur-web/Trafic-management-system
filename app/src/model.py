import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns

from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression
from sklearn.tree import DecisionTreeRegressor
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import joblib
import os

import warnings
warnings.filterwarnings('ignore')

print(os.getcwd())

count_points = pd.read_csv(r'D:\ML Project\Traffic Management System\Trafic-management-system\count_points.csv', low_memory=False)
london_traffic = pd.read_csv(r'D:\ML Project\Traffic Management System\Trafic-management-system\london_traffic.csv', low_memory=False)



df = london_traffic.rename(columns={
    'count_point_id':    'Junction',
    'all_motor_vehicles': 'Vehicles'
}).copy()

# Drop rows with missing vehicle counts
df = df.dropna(subset=['Vehicles'])

time_cols = [c for c in df.columns if any(t in c.lower()
             for t in ['year', 'month', 'day', 'hour', 'date', 'time'])]

df['Date'] = pd.to_datetime(df['count_date'])

df['day']     = df['Date'].dt.day
df['month']   = df['Date'].dt.month
df['weekday'] = df['Date'].dt.weekday


X_base = df[['latitude','longitude', 'hour', 'day', 'month', 'weekday']]
Y_base = df['Vehicles']


X_base_train, X_base_test, Y_base_train, Y_base_test = train_test_split(
    X_base, Y_base, test_size=0.2, random_state=42, shuffle=True
)

model = DecisionTreeRegressor(random_state=42)
model.fit(X_base_train, Y_base_train)

os.makedirs('app/models', exist_ok=True)
joblib.dump(model, 'app/models/app_model.pkl')
