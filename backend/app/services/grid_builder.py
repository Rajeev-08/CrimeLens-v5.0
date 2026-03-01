import numpy as np


def create_grid(df, cell_size=0.01):
    """
    Divide city into spatial grid cells.
    cell_size controls resolution (smaller = more grids)
    """

    # Drop rows without coordinates
    df = df.dropna(subset=["LAT", "LON"]).copy()

    # Create grid indices
    df["grid_x"] = (df["LAT"] / cell_size).astype(int)
    df["grid_y"] = (df["LON"] / cell_size).astype(int)

    # Create unique grid id
    df["grid_id"] = df["grid_x"].astype(str) + "_" + df["grid_y"].astype(str)

    return df


def get_unique_grids(df):
    """
    Return sorted unique grid IDs
    """
    return sorted(df["grid_id"].unique())