import osmnx as ox
import networkx as nx
from math import radians, cos, sin, asin, sqrt, isnan, isinf

# Global Caches
city_graph = None
graph_center = None 
current_radius = 0

# NEW: Cache for amenities to prevent re-downloading
AMENITIES_CACHE = {} 

def haversine(lon1, lat1, lon2, lat2):
    """Calculate distance between two points in meters"""
    lon1, lat1, lon2, lat2 = map(radians, [lon1, lat1, lon2, lat2])
    dlon = lon2 - lon1 
    dlat = lat2 - lat1 
    a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
    c = 2 * asin(sqrt(a)) 
    r = 6371 
    return c * r * 1000 

def get_graph_robust(mid_lat, mid_lon, radius_meters):
    global city_graph, graph_center, current_radius

    # Check Reuse
    if city_graph is not None and graph_center is not None:
        dist = haversine(graph_center[1], graph_center[0], mid_lon, mid_lat)
        if dist < 1000 and current_radius >= radius_meters:
            return city_graph

    print(f"Downloading map at {mid_lat:.4f}, {mid_lon:.4f} (r={int(radius_meters)}m)...")
    try:
        G = ox.graph_from_point((mid_lat, mid_lon), dist=radius_meters, network_type='walk')
        
        try:
            city_graph = ox.truncate.largest_component(G, strongly=False)
        except AttributeError:
            city_graph = ox.utils_graph.get_largest_component(G, strongly=False)
        
        graph_center = (mid_lat, mid_lon)
        current_radius = radius_meters
        
        for u, v, k, data in city_graph.edges(keys=True, data=True):
            data['crime_weight'] = data['length']
            
        return city_graph
    except Exception as e:
        print(f"Graph load failed: {e}")
        return None

def calculate_safe_route(start_lat, start_lon, end_lat, end_lon):
    mid_lat = (start_lat + end_lat) / 2
    mid_lon = (start_lon + end_lon) / 2
    trip_dist = haversine(start_lon, start_lat, end_lon, end_lat)
    
    attempts = [max(2000, trip_dist * 0.75), max(5000, trip_dist * 1.5)]
    
    for radius in attempts:
        graph = get_graph_robust(mid_lat, mid_lon, radius)
        if graph is None: continue

        try:
            orig = ox.distance.nearest_nodes(graph, start_lon, start_lat)
            dest = ox.distance.nearest_nodes(graph, end_lon, end_lat)

            if not nx.has_path(graph, orig, dest):
                continue

            route_fastest = nx.shortest_path(graph, orig, dest, weight='length')
            route_safest = nx.shortest_path(graph, orig, dest, weight='crime_weight')

            return {
                "fastest": [[graph.nodes[n]['y'], graph.nodes[n]['x']] for n in route_fastest],
                "safest": [[graph.nodes[n]['y'], graph.nodes[n]['x']] for n in route_safest]
            }
        except Exception:
            continue

    return None

# --- OPTIMIZED AMENITIES FETCHING ---
def get_nearby_amenities(lat, lon, dist=30000):
    """
    Fetches POIs with caching to speed up subsequent loads.
    """
    global AMENITIES_CACHE

    # Create a simple cache key (round coordinates to avoid slight variations)
    cache_key = f"{round(lat, 3)}_{round(lon, 3)}_{dist}"

    if cache_key in AMENITIES_CACHE:
        print("✅ Returning amenities from CACHE")
        return AMENITIES_CACHE[cache_key]

    print(f"⏳ Downloading amenities from OSM (Radius: {dist}m)...")
    try:
        tags = {'amenity': ['police', 'hospital']}
        gdf = ox.features_from_point((lat, lon), tags, dist=dist)
        
        if gdf.empty: 
            AMENITIES_CACHE[cache_key] = []
            return []

        pois = []
        for _, row in gdf.iterrows():
            c = row.geometry.centroid
            if isnan(c.y) or isnan(c.x) or isinf(c.y) or isinf(c.x): continue
            
            pois.append({
                "name": str(row.get('name', 'Unknown')), 
                "type": row['amenity'], 
                "lat": c.y, 
                "lon": c.x
            })
        
        # Save to cache
        AMENITIES_CACHE[cache_key] = pois
        print(f"✅ Download complete. {len(pois)} items cached.")
        return pois

    except Exception as e:
        print(f"Error fetching amenities: {e}")
        return []

# Placeholder
def update_graph_weights_by_hotspots(centers, radius=150, penalty=2000):
    pass