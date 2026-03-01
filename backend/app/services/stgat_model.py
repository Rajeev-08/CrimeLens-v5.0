import torch
import torch.nn as nn
from torch_geometric.nn import GATConv


class STGAT(nn.Module):

    def __init__(self, window_size, feature_dim):

        super(STGAT, self).__init__()

        self.window_size = window_size

        # ---------- Spatial GAT ----------
        self.gat1 = GATConv(feature_dim, 64, heads=4, concat=True)
        self.gat2 = GATConv(64 * 4, 64, heads=1, concat=False)

        self.dropout = nn.Dropout(0.2)
        self.norm = nn.LayerNorm(64)

        # ---------- Output Layer ----------
        self.fc = nn.Linear(64, 1)

    def forward(self, x, edge_index):
        """
        x: (nodes, window, features)
        """

        N, W, F = x.shape

        spatial_embeddings = []

        # ---- Spatial GAT applied per time step ----
        for t in range(W):

            x_t = x[:, t, :]  # (nodes, features)

            h = torch.relu(self.gat1(x_t, edge_index))
            h = torch.relu(self.gat2(h, edge_index))

            h = self.dropout(h)
            h = self.norm(h)

            spatial_embeddings.append(h)

        # Stack temporal embeddings
        # Shape: (nodes, window, 64)
        h_seq = torch.stack(spatial_embeddings, dim=1)

        # -------------------------------------------------
        # Residual Temporal Fusion (Scientifically Stable)
        # -------------------------------------------------

        # Most recent month (strongest predictor)
        h_last = h_seq[:, -1, :]

        # Temporal mean (smooth correction from history)
        h_mean = torch.mean(h_seq, dim=1)

        # Residual fusion
        h_combined = h_last + 0.3 * h_mean

        # Output
        out = self.fc(h_combined)

        return out.squeeze()