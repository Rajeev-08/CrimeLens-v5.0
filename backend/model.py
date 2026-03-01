import torch
import torch.nn as nn
from torchvision.models import mobilenet_v2, MobileNet_V2_Weights

class ViolenceModel(nn.Module):
    # ✅ FIX 1: Changed lstm_hidden_size from 128 to 256 to match your .pth file
    def __init__(self, num_classes=1, lstm_hidden_size=256, lstm_num_layers=1):
        super(ViolenceModel, self).__init__()
        
        # ✅ FIX 2: Use modern 'weights' syntax to silence UserWarnings
        base_model = mobilenet_v2(weights=MobileNet_V2_Weights.IMAGENET1K_V1)
        
        # Remove the classifier head, keep only feature extractor
        self.cnn = base_model.features
        
        # MobileNetV2 outputs 1280 channels
        self.cnn_out_size = 1280
        
        # LSTM for Temporal Analysis
        self.lstm = nn.LSTM(
            input_size=self.cnn_out_size,
            hidden_size=lstm_hidden_size,
            num_layers=lstm_num_layers,
            batch_first=True
        )
        
        # Classifier
        self.fc = nn.Linear(lstm_hidden_size, num_classes)
        
        # Activation
        self.dropout = nn.Dropout(0.5)

    def forward(self, x):
        # Input shape: (Batch, Channels, Frames, Height, Width)
        b, c, f, h, w = x.shape
        
        # Reshape to (Batch * Frames, C, H, W) to pass through CNN
        x = x.permute(0, 2, 1, 3, 4).contiguous().view(b * f, c, h, w)
        
        # CNN Feature Extraction
        features = self.cnn(x)
        
        # Global Average Pooling to get vector per frame
        features = features.mean([2, 3]) # Shape: (Batch * Frames, 1280)
        
        # Reshape back to (Batch, Frames, Features) for LSTM
        features = features.view(b, f, -1)
        
        # LSTM
        lstm_out, _ = self.lstm(features)
        
        # Take the output of the last frame
        last_frame_out = lstm_out[:, -1, :]
        
        # Classification
        out = self.dropout(last_frame_out)
        out = self.fc(out)
        
        return out