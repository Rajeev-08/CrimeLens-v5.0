import torch

try:
    print("Loading violence_model.pth...")
    # Load dictionary
    state_dict = torch.load("violence_model.pth", map_location="cpu")
    
    print("\n--- LAYER SIZES ---")
    # Print the shape of the LSTM and Fully Connected layers
    if 'lstm.weight_ih_l0' in state_dict:
        print(f"LSTM Input Size: {state_dict['lstm.weight_ih_l0'].shape}")
        print(f"LSTM Hidden Size: {state_dict['lstm.weight_hh_l0'].shape}")
    
    if 'fc.weight' in state_dict:
        print(f"Classifier (FC) Shape: {state_dict['fc.weight'].shape}")
        
    print("\n--- FIRST 5 KEYS ---")
    for i, key in enumerate(list(state_dict.keys())[:5]):
        print(f"{i}: {key}")

except Exception as e:
    print(f"Error: {e}")