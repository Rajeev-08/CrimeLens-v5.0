# backend/app/services/stgat_inference.py
import torch
import pickle
import numpy as np
import pandas as pd
from app.services.stgat_model import STGAT
from app.services.feature_engineering import create_monthly_features
from app.services.graph_builder import build_static_graph

# Load artifacts globally so they don't reload on every request
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")

with open("saved_models/grids.pkl", "rb") as f:
    grids = pickle.load(f)

with open("saved_models/scaler.pkl", "rb") as f:
    scaler = pickle.load(f)

# Initialize model
feature_dim = 33 # 1 (count) + 32 (PCA text embeddings)
model = STGAT(window_size=6, feature_dim=feature_dim).to(DEVICE)
model.load_state_dict(torch.load("saved_models/stgat_model.pth", map_location=DEVICE))
model.eval()

def run_stgat_prediction(df: pd.DataFrame):
    """Formats recent data and runs ST-GAT inference."""
    # 1. Recreate grids and features for the uploaded data
    # (Note: You'll need to copy create_grid, create_monthly_features, and graph_builder to your services folder)
    from app.services.grid_builder import create_grid
    df_gridded = create_grid(df)
    
    # Generate features (this requires the sentence-transformer)
    data, months = create_monthly_features(df_gridded, grids)
    
    # 2. Extract the last 6 months (window_size = 6)
    if data.shape[0] < 6:
        raise ValueError("Uploaded data must contain at least 6 months of history for ST-GAT.")
    
    recent_window = data[-6:] # Shape: (6, num_nodes, feature_dim)
    
    # 3. Scale features
    recent_flat = recent_window.reshape(-1, feature_dim)
    recent_scaled = scaler.transform(recent_flat).reshape(1, 6, len(grids), feature_dim)
    
    # 4. Build graph
    edge_index = build_static_graph(grids).to(DEVICE)
    
    # 5. Inference
    x_input = torch.tensor(recent_scaled[0], dtype=torch.float).permute(1, 0, 2).to(DEVICE)
    
    with torch.no_grad():
        output = model(x_input, edge_index)
        preds = output.cpu().numpy()
        
    # Inverse log transform (since you used log1p in training)
    # Inverse log transform
    # Inverse log transform predictions
    # Inverse log transform
    predicted_counts = np.expm1(preds)
    
    # Format response: Map predictions back to their grid coordinates
    results = []
    for idx, grid_id in enumerate(grids):
        grid_x, grid_y = map(int, grid_id.split("_"))
        pred_val = float(predicted_counts[idx])

        results.append({
            "grid_id": grid_id,
            "lat": grid_x * 0.01, # Update to 0.02 if that's your cell_size
            "lon": grid_y * 0.01, # Update to 0.02 if that's your cell_size
            "predicted_crimes": round(pred_val, 3),
            "risk_level": "High" if pred_val > np.percentile(predicted_counts, 90) else "Normal"
        })
        
    # Sort by highest risk first
    results.sort(key=lambda x: x["predicted_crimes"], reverse=True)
    
    # Filter out grids with virtually zero predicted crime to save frontend memory
    filtered_results = [r for r in results if r["predicted_crimes"] > 0.01]
    
    # Return Top 100 grids
    return filtered_results[:25]