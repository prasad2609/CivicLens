import os
import re
import glob
import torch
from transformers import AutoModelForImageClassification

def get_model(device, num_labels=2, pretrained_backbone="microsoft/cvt-13"):
    """
    Initializes Microsoft's CvT-13 architecture for binary classification.
    Class 0: Human/Real
    Class 1: AI-Generated
    """
    print(f"Initializing model backbone: {pretrained_backbone} with {num_labels} classes...")
    model = AutoModelForImageClassification.from_pretrained(
        pretrained_backbone,
        num_labels=num_labels,
        ignore_mismatched_sizes=True
    )
    model.to(device)
    return model

def load_latest_model(model, device, weights_folder="./models"):
    """
    Finds and loads the latest checkpoint (e.g., model_epoch_24.pth) from the weights folder.
    """
    if not os.path.exists(weights_folder):
        os.makedirs(weights_folder, exist_ok=True)
        print(f"[Warning] Weights folder '{weights_folder}' is empty. Using initial pretrained weights.")
        return model

    # Check for model_epoch_*.pth pattern first
    checkpoint_files = glob.glob(os.path.join(weights_folder, "model_epoch_*.pth"))
    
    # Fallback to any .pth file in the folder
    if not checkpoint_files:
        checkpoint_files = glob.glob(os.path.join(weights_folder, "*.pth"))

    if not checkpoint_files:
        print(f"[Notice] No .pth checkpoints found in '{weights_folder}'. Proceeding with base model.")
        return model

    # Sort numerically by epoch number if possible, else by modification time
    def extract_epoch(filepath):
        basename = os.path.basename(filepath)
        match = re.search(r"model_epoch_(\d+)\.pth", basename)
        if match:
            return int(match.group(1))
        return int(os.path.getmtime(filepath))

    latest_file = max(checkpoint_files, key=extract_epoch)
    print(f"Loading checkpoint: {latest_file}")

    try:
        checkpoint = torch.load(latest_file, map_location=device)
        if isinstance(checkpoint, dict):
            if "model_state_dict" in checkpoint:
                model.load_state_dict(checkpoint["model_state_dict"])
            elif "state_dict" in checkpoint:
                model.load_state_dict(checkpoint["state_dict"])
            else:
                model.load_state_dict(checkpoint)
        else:
            model.load_state_dict(checkpoint)
        print("Model weights successfully loaded!")
    except Exception as e:
        print(f"[Error] Failed to load checkpoint weights: {e}. Using base model.")

    return model

def save_model(model, epoch, save_folder="./models", optimizer=None, loss=None):
    """Saves checkpoint to specified directory."""
    os.makedirs(save_folder, exist_ok=True)
    save_path = os.path.join(save_folder, f"model_epoch_{epoch}.pth")
    payload = {
        "epoch": epoch,
        "model_state_dict": model.state_dict(),
    }
    if optimizer:
        payload["optimizer_state_dict"] = optimizer.state_dict()
    if loss is not None:
        payload["loss"] = loss

    torch.save(payload, save_path)
    print(f"Saved checkpoint: {save_path}")
    return save_path
