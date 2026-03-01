import torch


def build_static_graph(grids):
    """
    Build spatial adjacency graph using grid_id list.
    Assumes grid_id format: 'grid_x_grid_y'
    """

    grid_coords = {}

    for idx, grid in enumerate(grids):
        x, y = map(int, grid.split("_"))
        grid_coords[idx] = (x, y)

    edge_index = []

    for i in grid_coords:
        x1, y1 = grid_coords[i]

        for j in grid_coords:
            if i == j:
                continue

            x2, y2 = grid_coords[j]

            # 4-neighbour connectivity
            if abs(x1 - x2) + abs(y1 - y2) == 1:
                edge_index.append([i, j])

    edge_index = torch.tensor(edge_index, dtype=torch.long).t().contiguous()

    return edge_index