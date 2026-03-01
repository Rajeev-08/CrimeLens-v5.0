import pandas as pd
from sklearn.cluster import KMeans
from prophet import Prophet
import xgboost as xgb
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score
from sklearn.preprocessing import LabelEncoder

def detect_hotspots(df, n_clusters=10):
    """Detects high-crime areas using K-Means clustering."""
    # Drop invalid rows first
    df_clean = df.dropna(subset=['LAT', 'LON'])
    
    if len(df_clean) < n_clusters:
        return []

    coords = df_clean[['LAT', 'LON']]
    kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
    kmeans.fit(coords)
    
    # Convert to list and ensure no NaNs
    centers = []
    for center in kmeans.cluster_centers_:
        if not (pd.isna(center[0]) or pd.isna(center[1])):
            centers.append([float(center[0]), float(center[1])])
            
    return centers
def get_time_series_data(df):
    """Aggregates crime counts for time-series analysis."""
    time_series_df = df.set_index('datetime_occ').resample('ME').size().reset_index(name='count')
    time_series_df.columns = ['ds', 'y']
    return time_series_df.to_dict(orient='records')

def get_time_series_forecast(df):
    """Generates a 12-month crime forecast using Prophet."""
    time_series_df = df.set_index('datetime_occ').resample('ME').size().reset_index(name='count')
    time_series_df.columns = ['ds', 'y']
    
    if len(time_series_df) < 3:
        return None

    m = Prophet()
    m.fit(time_series_df)
    future = m.make_future_dataframe(periods=12, freq='ME')
    forecast = m.predict(future)
    return forecast[['ds', 'yhat', 'yhat_lower', 'yhat_upper']].to_dict(orient='records')

def train_risk_prediction_model(df):
    """Trains an XGBoost classifier for crime severity."""
    model_df = df[['hour', 'month', 'LAT', 'LON', 'AREA NAME', 'Severity']].copy()
    model_df.dropna(inplace=True)

    if len(model_df) <= 100:
        return None

    le_area = LabelEncoder()
    le_sev = LabelEncoder()
    model_df['AREA NAME'] = le_area.fit_transform(model_df['AREA NAME'])
    model_df['Severity'] = le_sev.fit_transform(model_df['Severity'])

    X = model_df[['hour', 'month', 'LAT', 'LON', 'AREA NAME']]
    y = model_df['Severity']
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.3, random_state=42, stratify=y)
    
    model = xgb.XGBClassifier(objective='multi:softmax', num_class=len(le_sev.classes_), use_label_encoder=False, eval_metric='mlogloss')
    model.fit(X_train, y_train)
    
    preds = model.predict(X_test)
    accuracy = accuracy_score(y_test, preds)
    
    feature_importance = pd.DataFrame({
        'feature': X.columns, 
        'importance': model.feature_importances_
    }).sort_values('importance', ascending=False)

    return {
        "accuracy": accuracy,
        "feature_importance": feature_importance.to_dict(orient='records')
    }