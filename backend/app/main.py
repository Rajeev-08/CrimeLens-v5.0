from fastapi import FastAPI, UploadFile, File, HTTPException, Depends
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
from io import StringIO
import os
from google import genai
from google.genai import types
from dotenv import load_dotenv
from pydantic import BaseModel
from typing import List, Optional
import asyncio
from pathlib import Path
import requests 
from sklearn.cluster import KMeans 
import numpy as np 
from textblob import TextBlob # <--- NEW IMPORT
from fastapi.responses import StreamingResponse
from app.services.surveillance import video_service
import shutil
import hashlib  
import json
from app.services.stgat_inference import run_stgat_prediction
#try:
    #from app.services.vision import VideoDetector
    #detector = VideoDetector() # Initialize the AI model once here
#except ImportError as e:
   # print(f"❌ Vision Service Import Error: {e}")
detector = None
# --- IMPORT SERVICES ---
try:
    from app.services.data_processing import load_and_preprocess_data, classify_severity
    from app.services.analysis import (
        detect_hotspots, get_time_series_data, get_time_series_forecast, train_risk_prediction_model
    )
except ImportError:
    # Fallback dummies
    def load_and_preprocess_data(f): return pd.read_csv(f)
    def classify_severity(df): return df
    def get_time_series_data(df): return []
    def get_time_series_forecast(df): return []
    def train_risk_prediction_model(df): return {"accuracy": "N/A", "risk_factors": []}

try:
    from app.services.routing import get_nearby_amenities, calculate_safe_route
except ImportError:
    def get_nearby_amenities(*args, **kwargs): return []
    def calculate_safe_route(*args): return []
CACHE_DIR = "cache"
os.makedirs(CACHE_DIR, exist_ok=True)
# --- 1. CONFIGURATION ---
env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

api_key = os.getenv("GEMINI_API_KEY") 
news_api_key = os.getenv("NEWS_API_KEY")

client = None
if api_key:
    try:
        client = genai.Client(api_key=api_key)
        print("✅ Gemini Client Initialized")
    except Exception as e:
        print(f"❌ Gemini Init Error: {e}")

# --- 2. MODELS ---
class MapContextRequest(BaseModel):
    lat: float
    lon: float

class SafetyRequest(BaseModel):
    message: str
    context: str = "" 

class ReportRequest(BaseModel):
    area: str = "All Areas"
    crime_types: List[str] = []
    total_crimes: int
    top_trend: str = "Stable"

class RouteRequest(BaseModel):
    start: List[float]
    end: List[float]

# Flat Payload (Analytics)
class FilterPayload(BaseModel):
    areas: List[str] = []
    crimes: List[str] = []
    severities: List[str] = []
    class Config: extra = "ignore"

# Nested Payload (3D Map)
class FilterModel(BaseModel):
    areas: List[str] = []
    crimes: List[str] = []
    severities: List[str] = []

# ✅ NEW (Flat - Matches your Frontend)
class HotspotRequest(BaseModel):
    areas: List[str] = []
    crimes: List[str] = []
    severities: List[str] = []

# ✅ NEW: Incident Report Model
class IncidentRequest(BaseModel):
    lat: float
    lon: float
    description: str
    category: str = "General" # e.g., "Theft", "Suspicious Activity", "Hazard"

# --- 3. APP SETUP ---
app = FastAPI(title="CrimeLens API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

df_storage = {}
# ✅ NEW: In-memory storage for reported incidents
incidents_db = []

def get_dataframe():
    if 'main_df' not in df_storage:
        raise HTTPException(status_code=404, detail="No data uploaded yet.")
    return df_storage['main_df']

def apply_filters(df: pd.DataFrame, filters) -> pd.DataFrame:
    subset = df.copy()
    areas = getattr(filters, 'areas', [])
    crimes = getattr(filters, 'crimes', [])
    severities = getattr(filters, 'severities', [])

    if areas and 'AREA NAME' in subset.columns:
        subset = subset[subset['AREA NAME'].isin(areas)]
    if crimes and 'Crm Cd Desc' in subset.columns:
        subset = subset[subset['Crm Cd Desc'].isin(crimes)]
    if severities and 'Severity' in subset.columns:
        subset = subset[subset['Severity'].isin(severities)]
    return subset

# --- 4. ENDPOINTS ---

@app.post("/api/upload")
def upload_data(file: UploadFile = File(...)):
    try:
        print(f"Received file: {file.filename}")
        df = load_and_preprocess_data(file.file)
        if 'Severity' not in df.columns:
             df['Severity'] = np.random.choice(['High', 'Medium', 'Low'], size=len(df))

        df_storage['main_df'] = df
        
        unique_areas = sorted(df['AREA NAME'].unique().tolist()) if 'AREA NAME' in df.columns else []
        unique_crimes = sorted(df['Crm Cd Desc'].unique().tolist()) if 'Crm Cd Desc' in df.columns else []
        unique_severities = sorted(df['Severity'].unique().tolist()) if 'Severity' in df.columns else []

        return { 
            "message": "File processed.", 
            "total_records": len(df), 
            "filters": { "areas": unique_areas, "crimes": unique_crimes, "severities": unique_severities } 
        }
    except Exception as e:
        print(f"Upload Error: {e}")
        raise HTTPException(status_code=400, detail=str(e))

# --- NEW: SENTIMENT ANALYSIS ENDPOINT ---
@app.post("/api/sentiment")
def get_public_perception(payload: FilterPayload):
    """
    Fetches news and calculates a 'Fear Index' based on sentiment.
    """
    # 1. Determine Search Query
    query = "Crime"
    if payload.areas:
        query = f"{payload.areas[0]} Crime" # Search for the first selected area
    elif payload.crimes:
        query = f"{payload.crimes[0]} News"
        
    articles = []
    
    # 2. Fetch News (Real or Mock)
    if news_api_key:
        try:
            # In main.py inside /api/sentiment
            url = f"https://newsapi.org/v2/everything?q={query}&sortBy=publishedAt&apiKey={news_api_key}&language=en&pageSize=20" # <-- Increased to 20
            resp = requests.get(url, timeout=5)
            if resp.status_code == 200:
                data = resp.json()
                articles = [
                    {"title": a["title"], "source": a["source"]["name"], "url": a["url"]} 
                    for a in data.get("articles", [])
                ]
        except: pass

    # 3. Fallback Mock Data
    if not articles:
        area = payload.areas[0] if payload.areas else "City"
        articles = [
            {"title": f"Police report drop in {area} burglary rates", "source": "City News"},
            {"title": f"Residents concern grows over late night noise in {area}", "source": "Daily Local"},
            {"title": f"New safety measures implemented downtown", "source": "Metro Post"},
            {"title": f"Community meeting held to discuss recent vandalism", "source": "The Observer"},
            {"title": f"Op-Ed: Why {area} is safer than you think", "source": "City Views"},
            # --- ADD MORE HERE ---
            {"title": f"Local business owners discuss safety improvements", "source": "Neighborhood Watch"},
            {"title": f"Traffic safety analysis for {area}", "source": "City Planner"},
            {"title": f"Weekly crime statistics report released", "source": "Police Dept"},
        ]

    # 4. Perform Sentiment Analysis
    total_polarity = 0
    analyzed_articles = []
    
    for art in articles:
        blob = TextBlob(art['title'])
        score = blob.sentiment.polarity # -1 (Negative) to +1 (Positive)
        
        # Convert to "Fear/Safety" logic
        # Negative sentiment = High Fear. Positive sentiment = Low Fear.
        
        status = "Neutral"
        if score < -0.1: status = "Negative"
        elif score > 0.1: status = "Positive"
        
        analyzed_articles.append({
            **art,
            "sentimentScore": score,
            "sentimentLabel": status
        })
        total_polarity += score

    # 5. Calculate Aggregate Score
    avg_score = total_polarity / len(analyzed_articles) if analyzed_articles else 0
    
    # Map (-1 to 1) -> Fear Index (0 to 100)
    # If score is -1 (Very Bad), Fear is 100.
    # If score is +1 (Very Good), Fear is 0.
    fear_index = int((1 - avg_score) * 50) 
    fear_index = max(0, min(100, fear_index)) # Clamp

    perception_label = "Panic" if fear_index > 75 else "Anxious" if fear_index > 50 else "Calm"

    return {
        "fearIndex": fear_index,
        "perceptionLabel": perception_label,
        "articles": analyzed_articles,
        "query": query
    }
# --- 1. SURVEILLANCE ENDPOINTS (NEW) ---

@app.post("/api/surveillance/upload")
async def upload_video(file: UploadFile = File(...)):
    """
    Save uploaded video to disk so it can be streamed.
    """
    # Create a temp directory if it doesn't exist
    os.makedirs("temp_videos", exist_ok=True)
    file_location = f"temp_videos/{file.filename}"
    
    with open(file_location, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    return {"message": "Video uploaded", "path": file_location}

@app.get("/api/surveillance/feed")
async def video_feed(source: str = "0", mode: str = "weapon"):
    """
    Streams video. Source can be "webcam" or file path.
    """
    # Map 'webcam' string to 0 for logic consistency
    video_source = 0 if source == "webcam" else source
    
    # ✅ ALWAYS call start_stream. 
    # The service handles the "is it already running?" check internally now.
    video_service.start_stream(video_source, mode)

    if not video_service.is_running:
        # If it failed to start (e.g. file not found), return an error image or text
        return {"error": "Could not start video stream"}

    return StreamingResponse(
        video_service.generate_frames(), 
        media_type="multipart/x-mixed-replace; boundary=frame"
    )

@app.post("/api/hotspots")
def get_hotspots(request: HotspotRequest, df: pd.DataFrame = Depends(get_dataframe)):
    try:
        # ❌ OLD: filters = request.filters or FilterModel()
        
        # ✅ NEW: The request itself IS the filter object now
        filters = request 
        
        # Apply the filters directly
        subset = apply_filters(df, filters)
        subset = subset.fillna(0)
        
        # ... (Rest of the function remains exactly the same)
        if 'LAT' not in subset.columns or 'LON' not in subset.columns:
             return {"hotspots": [], "heat_data": [], "centers": []}
        
        subset = subset[(subset['LAT'] != 0) & (subset['LON'] != 0)]
        
        # ... (Keep existing logic for 3D data, Heatmap, Clusters) ...
        
        # 3D Data
        subset_3d = subset.head(15000)
        hotspots_3d = subset_3d[['LAT', 'LON', 'Severity']].rename(
            columns={'LAT': 'lat', 'LON': 'lng', 'Severity': 'severity'}
        ).to_dict(orient='records')

        # 2D Heatmap
        heat_data = subset[['LAT', 'LON']].values.tolist()

        # 2D Clusters
        centers = []
        try:
            centers = detect_hotspots(subset, 15)
        except:
             if len(subset) > 15:
                kmeans = KMeans(n_clusters=15, n_init=10, random_state=42)
                kmeans.fit(subset[['LAT', 'LON']])
                for i, center in enumerate(kmeans.cluster_centers_):
                    centers.append({"lat": center[0], "lng": center[1], "label": f"#{i+1}"})

        return {"hotspots": hotspots_3d, "heat_data": heat_data, "centers": centers}
    except Exception as e:
        print(f"Hotspot Error: {e}")
        return {"hotspots": [], "heat_data": [], "centers": []}
@app.post("/api/map-context")
def get_map_context(payload: MapContextRequest):
    # 1. Try Primary Service (Local Graph)
    try:
        amenities = get_nearby_amenities(payload.lat, payload.lon)
        if amenities and len(amenities) > 0:
            return {"amenities": amenities}
    except Exception as e:
        print(f"Primary Service Error: {e}")

    # 2. Fallback: Overpass API with Caching
    print(f"⚠️ Switching to Live Overpass API for {payload.lat}, {payload.lon}...")
    
    try:
        # Use a reliable public instance
        overpass_url = "https://overpass-api.de/api/interpreter"
        
        # Query: Search for Police & Hospitals within 25km (25000m)
        # We assume 1 degree lat ~= 111km. 25km is roughly 0.25 degrees.
        # [timeout:50] tells the server to work for up to 50 seconds.
        query = f"""
        [out:json][timeout:50];
        (
          node["amenity"="police"](around:25000, {payload.lat}, {payload.lon});
          way["amenity"="police"](around:25000, {payload.lat}, {payload.lon});
          node["amenity"="hospital"](around:25000, {payload.lat}, {payload.lon});
          way["amenity"="hospital"](around:25000, {payload.lat}, {payload.lon});
        );
        out center;
        """

        # Hash for Cache Key
        query_hash = hashlib.md5(query.encode('utf-8')).hexdigest()
        cache_path = os.path.join(CACHE_DIR, f"{query_hash}.json")
        data = None

        # A. Check Cache
        if os.path.exists(cache_path):
            print(f"⚡ Loading amenities from CACHE: {cache_path}")
            with open(cache_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
        else:
            # B. Fetch from Network
            print("⏳ Fetching from Overpass API (Network)... this may take ~10-20s")
            # Python timeout (60s) MUST be larger than Overpass timeout (50s)
            response = requests.get(overpass_url, params={'data': query}, timeout=60)
            
            if response.status_code == 200:
                data = response.json()
                # Validate data before caching
                if "elements" in data:
                    with open(cache_path, 'w', encoding='utf-8') as f:
                        json.dump(data, f)
                    print(f"💾 Saved response to cache: {cache_path}")
                else:
                    print(f"❌ API returned 200 but invalid JSON structure.")
            elif response.status_code == 429:
                print("❌ Overpass Rate Limit Reached (429). Try again in 30s.")
            else:
                print(f"❌ Overpass Failed. Status: {response.status_code}")
                print(f"Response: {response.text[:200]}") # Print first 200 chars of error

        # Process Data
        if data and "elements" in data:
            amenities = []
            for el in data['elements']:
                # 'center' is used for ways (buildings), 'lat'/'lon' for nodes
                lat = el.get('lat') or el.get('center', {}).get('lat')
                lon = el.get('lon') or el.get('center', {}).get('lon')
                
                if lat and lon:
                    amenities.append({
                        "lat": lat, 
                        "lon": lon,
                        "name": el.get('tags', {}).get('name', 'Unknown'),
                        "type": el.get('tags', {}).get('amenity')
                    })
            
            print(f"✅ Found {len(amenities)} real amenities.")
            if amenities:
                return {"amenities": amenities}

    except Exception as e:
        print(f"❌ Fallback Critical Error: {e}")
    
    # 3. Demo Data (Only used if everything above fails)
    print("⚠️ All lookups failed. Returning Demo Data.")
    return {"amenities": [
        {"lat": payload.lat + 0.005, "lon": payload.lon + 0.005, "name": "Central Station (Demo)", "type": "police"},
        {"lat": payload.lat - 0.005, "lon": payload.lon - 0.005, "name": "General Hospital (Demo)", "type": "hospital"}
    ]}
@app.post("/api/time-series")
def get_trends(payload: FilterPayload, df: pd.DataFrame = Depends(get_dataframe)):
    df_filtered = apply_filters(df, payload)
    counts = get_time_series_data(df_filtered.copy())
    forecast = get_time_series_forecast(df_filtered.copy())
    return {"counts": counts, "forecast": forecast or []}

@app.post("/api/severity-breakdown")
def get_severity_breakdown(payload: FilterPayload, df: pd.DataFrame = Depends(get_dataframe)):
    df_filtered = apply_filters(df, payload)
    severity_counts = df_filtered['Severity'].value_counts()
    
    # 1. PIE CHART
    pie_data = {
        "labels": severity_counts.index.tolist(), 
        "values": severity_counts.values.tolist()
    }
    
    # 2. BAR CHART
    bar_data = {}
    if 'AREA NAME' in df_filtered.columns:
        severity_by_area = df_filtered.groupby('AREA NAME')['Severity'].value_counts().unstack().fillna(0)
        bar_data = severity_by_area.reset_index().to_dict(orient='list')
    
    return {
        "pie_chart": pie_data, "bar_chart": bar_data,
        "pieChart": pie_data, "barChart": bar_data
    }

@app.post("/api/train-model")
def train_model(payload: FilterPayload, df: pd.DataFrame = Depends(get_dataframe)):
    df_filtered = apply_filters(df, payload)
    result = train_risk_prediction_model(df_filtered.copy()) or {"accuracy": "N/A"}
    if "risk_factors" in result: result["riskFactors"] = result["risk_factors"]
    return result

@app.post("/api/generate-report-summary")
def generate_report_summary(payload: ReportRequest):
    if not client: return {"summary": "AI Summarizer not connected."}
    
    # Updated Prompt: Concise, Plain Text, No Formatting
    prompt = f"""
    Write a concise executive summary of the crime risks for {payload.area} based on {payload.total_crimes} reported incidents.
    
    Constraints:
    - Keep it under 150 words.
    - Do NOT use markdown formatting (no bolding, no headers, no bullet points).
    - Provide just the plain text paragraph.
    - Focus on the top trend: {payload.top_trend}.
    """

    try:
        response = client.models.generate_content(
            model='gemini-flash-latest', 
            contents=prompt
        )
        return {"summary": response.text}
    except Exception as e: 
        print(f"Summary Error: {e}")
        return {"summary": "Summary generation failed."}

@app.post("/api/safety-assistant")
async def get_safety_tip(request: SafetyRequest):
    if not client: raise HTTPException(status_code=503, detail="AI Not Configured")
    
    async def stream():
        try:
            # ✅ FIX: Context removed from prompt to save tokens
            # We only send the user's message now.
            prompt = f"User: {request.message}\nBrief Safety Tip:"
            
            # ✅ FIX: Using Lite model for better rate limits
            response = client.models.generate_content_stream(
                model='gemini-flash-latest', 
                contents=prompt
            )
            for chunk in response:
                if chunk.text: 
                    yield chunk.text
                    await asyncio.sleep(0.01)
        except Exception as e:
            print(f"Streaming Error: {e}")
            # Graceful error handling for the frontend
            if "429" in str(e):
                yield "I'm currently busy (Rate Limit). Please try again in a few seconds."
            else:
                yield "Service unavailable."
            
    return StreamingResponse(stream(), media_type="text/plain")

@app.post("/api/navigate")
def get_navigation(payload: RouteRequest):
    start = payload.start
    end = payload.end
    
    # Calculate route using the service
    route_data = calculate_safe_route(start[0], start[1], end[0], end[1])
    
    if not route_data:
        raise HTTPException(status_code=404, detail="No route found")
        
    return route_data

# --- INCIDENT REPORTING ENDPOINTS ---
@app.post("/api/report-incident")
def report_incident(incident: IncidentRequest):
    """
    Submits a new user-generated incident report.
    """
    entry = incident.dict()
    entry['id'] = len(incidents_db) + 1
    entry['timestamp'] = pd.Timestamp.now().isoformat()
    incidents_db.append(entry)
    return {"message": "Incident reported successfully.", "report": entry, "total_reports": len(incidents_db)}

@app.get("/api/incidents")
def get_incidents():
    """
    Retrieves all user-reported incidents.
    """
    return {"incidents": incidents_db}

@app.get("/api/surveillance/stop")
async def stop_video_feed():
    """
    Explicitly stops the video capture and releases hardware locks.
    """
    video_service.stop_stream()
    return {"message": "Stream stopped successfully"}

@app.post("/api/predict-stgat")
def predict_stgat(payload: FilterPayload, df: pd.DataFrame = Depends(get_dataframe)):
    df_filtered = apply_filters(df, payload)
    try:
        predictions = run_stgat_prediction(df_filtered.copy())
        return {"predictions": predictions}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/")
def read_root():
    return {"status": "CrimeLens API is running"}