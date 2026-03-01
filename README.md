
---

# 🕵️‍♂️ CrimeLens v3.0

**CrimeLens** is an advanced AI-powered crime intelligence platform designed to analyze historical data, predict future risks, and provide real-time surveillance capabilities. It bridges the gap between raw data and actionable security insights using machine learning, computer vision, and generative AI.

## 🚀 Key Features

### 📊 Intelligence Dashboard

* **Unified Interactive Map:** 2D heatmap overlays, hotspot clustering, and amenity mapping (Police/Hospitals) using Leaflet.
* **3D Density Visualization:** Immersive 3D hexagonal layers (`deck.gl`) to visualize crime volume and severity in urban environments.
* **Temporal Analysis:** Time-series forecasting (using Prophet) to predict crime trends over the next 12 months.
* **Risk Prediction:** Machine learning models (XGBoost) that calculate risk levels based on time, location, and environmental factors.

### 👁️ Real-Time Surveillance

* **Live Video Monitoring:** Process webcam or uploaded video feeds in real-time.
* **Weapon Detection:** Integrated **YOLOv8/11** model to detect firearms and knives.
* **Violence Detection:** Custom **MobileNetV2 + LSTM** architecture to recognize violent actions and fights.

### 🧭 Safety & Perception

* **Public Perception Engine:** Scrapes and analyzes local news headlines using NLP (`TextBlob`) to generate a "Public Fear Index."
* **AI Safety Assistant:** A chat interface powered by **Google Gemini 1.5 Flash** for safety tips and situational advice.

### 📝 Reporting

* **Executive Summaries:** One-click generation of professional PDF crime intelligence reports with AI-written executive summaries.
* **Incident Reporting:** User-facing tools to pin and report suspicious activity directly on the map.

---

## 🛠️ System Architecture

### Backend (`/backend`)

* **Framework:** FastAPI (Python)
* **ML & Data:** Pandas, Scikit-learn (KMeans), XGBoost, Prophet
* **Computer Vision:** OpenCV, PyTorch, Ultralytics YOLO
* **Generative AI:** Google GenAI SDK (Gemini 1.5 Flash)
* **Geospatial:** OSMnx, NetworkX (for routing)

### Frontend (`/frontend`)

* **Framework:** React.js
* **Styling:** Tailwind CSS
* **Visualization:** React-Leaflet, Deck.gl, Chart.js
* **Effects:** OGL (WebGL for Aurora/Galaxy backgrounds)

---

## 📦 Installation & Setup

### Prerequisites

* Python 3.9+
* Node.js & npm
* Google Gemini API Key
* NewsAPI Key (Optional, for Sentiment analysis)

### 1. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
echo "GEMINI_API_KEY=your_key_here" > .env
echo "NEWS_API_KEY=your_news_key_here" >> .env

# Run the server
uvicorn app.main:app --reload

```

*The backend runs on `http://127.0.0.1:8000*`

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start the application
npm start

```

*The frontend runs on `http://localhost:3000*`

---

## 🖥️ Usage Guide

1. **Upload Data:**
* On the Welcome screen, select **"Upload Dataset"**.
* Upload a CSV file containing crime data (Standard LAPD format supported: `DATE OCC`, `TIME OCC`, `LAT`, `LON`, `Crm Cd Desc`).


2. **Analyze Trends:**
* Use the **Sidebar** to filter by crime type or area.
* Switch tabs to view **3D Density**, **Severity Breakdown**, or **Predictions**.


3. **Surveillance Mode:**
* From the Home screen, select **"Live Surveillance"**.
* Choose input source (Webcam or File) and Detection Mode (Weapon or Violence).


4. **Export Reports:**
* Click the **"Export Report"** button in the dashboard to download a comprehensive PDF summary.



---

## ⚠️ Important Notes

* **Model Weights:** Ensure `yolov5su.pt` (or `best.pt`) and `violence_model.pth` are placed in the `backend/` root directory for surveillance features to work.
* **API Quotas:** The system defaults to `gemini-1.5-flash` to respect free tier limits. Heavy usage may trigger 429 errors.
* **Map Data:** The system caches OpenStreetMap queries in `backend/cache/` to speed up subsequent loads.

---

## 📜 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

**Developed for CrimeLens Inc.**
*Turning Data into Defense.*