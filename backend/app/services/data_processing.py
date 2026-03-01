import pandas as pd

def load_and_preprocess_data(file_stream):
    """Loads and preprocesses data from an in-memory file."""
    try:
        df = pd.read_csv(file_stream, encoding='utf-8')
    except Exception as e:
        raise ValueError(f"Error reading CSV: {e}")

    # Ensure required columns exist
    required_columns = ['DATE OCC', 'TIME OCC', 'LAT', 'LON', 'Crm Cd Desc', 'AREA NAME']
    if not all(col in df.columns for col in required_columns):
        raise ValueError(f"Missing one or more required columns: {required_columns}")

    # Data Preprocessing
    # 1. Pad TIME OCC (e.g., '930' -> '0930')
    df['TIME OCC'] = df['TIME OCC'].astype(str).str.zfill(4)

    # 2. Convert DATE OCC to datetime objects
    # Fix: Added explicit format to suppress UserWarning and improve speed.
    # Standard LAPD format is usually 'MM/DD/YYYY hh:mm:ss AM/PM'
    # If your CSV uses a different format (like 'YYYY-MM-DD'), change the format string below.
    try:
        df['date_only'] = pd.to_datetime(df['DATE OCC'], format='%m/%d/%Y %I:%M:%S %p', errors='coerce')
    except:
        # Fallback if the specific format fails
        df['date_only'] = pd.to_datetime(df['DATE OCC'], errors='coerce')

    # 3. Create a full datetime column by combining Date + Time
    # We take the date part and add the hours and minutes from TIME OCC
    df['datetime_occ'] = df['date_only'] + \
                         pd.to_timedelta(df['TIME OCC'].str[:2].astype(int), unit='h') + \
                         pd.to_timedelta(df['TIME OCC'].str[2:].astype(int), unit='m')

    # 4. Extract features for analysis
    df['hour'] = df['datetime_occ'].dt.hour
    df['month'] = df['datetime_occ'].dt.month
    df['day_of_week'] = df['datetime_occ'].dt.day_name()
    
    # 5. Clean data
    # Remove rows with invalid coordinates (0,0 is often used as a placeholder for null location)
    df = df[(df['LAT'] != 0) & (df['LON'] != 0)]
    
    # Drop rows where critical data is missing
    df.dropna(subset=['datetime_occ', 'LAT', 'LON', 'Crm Cd Desc'], inplace=True)
    
    # Clean up temporary columns if desired, or keep them if needed
    if 'date_only' in df.columns:
        df.drop(columns=['date_only'], inplace=True)

    return df

def classify_severity(df):
    """Tags crimes with a severity level."""
    def get_severity(crime_desc):
        crime_desc = str(crime_desc).upper()
        # High Severity: Violent crimes or crimes involving weapons
        if any(word in crime_desc for word in ['HOMICIDE', 'ROBBERY', 'ASSAULT', 'WEAPON', 'RAPE', 'KIDNAPPING']):
            return 'High'
        # Medium Severity: Property crimes, major theft
        elif any(word in crime_desc for word in ['BURGLARY', 'THEFT', 'VEHICLE STOLEN', 'VANDALISM']):
            return 'Medium'
        # Low Severity: Minor offenses
        else:
            return 'Low'

    df['Severity'] = df['Crm Cd Desc'].apply(get_severity)
    return df