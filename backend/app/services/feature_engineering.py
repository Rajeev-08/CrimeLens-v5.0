import numpy as np
import pandas as pd
from sentence_transformers import SentenceTransformer
from sklearn.decomposition import PCA
from tqdm import tqdm


def create_monthly_features(df, grids):

    # ---------------------------------------------------
    # Safety Checks
    # ---------------------------------------------------
    if "grid_id" not in df.columns:
        raise ValueError(
            "grid_id column not found. Make sure create_grid() adds df['grid_id']"
        )

    # ---------------------------------------------------
    # Create Month Column
    # ---------------------------------------------------
    df["DATE OCC"] = pd.to_datetime(df["DATE OCC"], errors="coerce")
    df["month"] = df["DATE OCC"].dt.to_period("M").astype(str)

    # ---------------------------------------------------
    # TEXT EMBEDDING (FAST VERSION)
    # Encode unique crime descriptions only
    # ---------------------------------------------------
    print("Encoding crime descriptions...")

    model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")

    unique_crimes = df["Crm Cd Desc"].fillna("Unknown").unique()
    print("Unique crime types found:", len(unique_crimes))

    crime_to_embedding = {}

    batch_size = 32

    for i in tqdm(range(0, len(unique_crimes), batch_size)):
        batch = unique_crimes[i:i + batch_size]
        embeddings = model.encode(batch, convert_to_numpy=True)
        for crime, emb in zip(batch, embeddings):
            crime_to_embedding[crime] = emb

    # Map embeddings back to dataframe
    df["text_emb"] = df["Crm Cd Desc"].fillna("Unknown").map(crime_to_embedding)

    # ---------------------------------------------------
    # PCA REDUCTION (384 → 32)
    # ---------------------------------------------------
    print("Applying PCA to text embeddings...")

    all_embeddings = np.vstack(df["text_emb"].values)

    pca = PCA(n_components=32)
    reduced_embeddings = pca.fit_transform(all_embeddings)

    df["text_emb_reduced"] = list(reduced_embeddings)

    # ---------------------------------------------------
    # GROUP BY MONTH + GRID
    # ---------------------------------------------------
    grouped = df.groupby(["month", "grid_id"])

    months = sorted(df["month"].unique())
    num_months = len(months)
    num_grids = len(grids)

    # Feature dimension:
    # 1 (crime count) + 32 (text embedding)
    feature_dim = 1 + 32

    data = np.zeros((num_months, num_grids, feature_dim))

    month_to_index = {m: i for i, m in enumerate(months)}
    grid_to_index = {g: i for i, g in enumerate(grids)}

    # ---------------------------------------------------
    # Build Feature Tensor
    # ---------------------------------------------------
    print("Building monthly feature tensor...")

    for (month, grid), group in tqdm(grouped):

        if grid not in grid_to_index:
            continue

        t = month_to_index[month]
        node = grid_to_index[grid]

        # Crime count
        crime_count = np.log1p(len(group))

        # Mean text embedding for that grid + month
        mean_embedding = np.mean(
            np.vstack(group["text_emb_reduced"].values),
            axis=0
        )

        data[t, node, 0] = crime_count
        data[t, node, 1:] = mean_embedding

    return data, months