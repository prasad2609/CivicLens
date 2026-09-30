import os
import argparse
from PIL import Image
import torch
import torch.nn.functional as F

from custom_dataset import get_transform
from model import get_model, load_latest_model

CLASS_NAMES = {
    0: "Real (Human-created)",
    1: "AI-Generated (Synthetic / Fake)"
}

def predict_image(image_path, model, device, transform=None):
    """
    Predicts whether an individual image is real or AI-generated.
    Returns: predicted_class_idx, predicted_class_name, confidence, probabilities dict
    """
    if not os.path.exists(image_path):
        raise FileNotFoundError(f"Image not found at path: {image_path}")

    if transform is None:
        transform = get_transform()

    image = Image.open(image_path).convert("RGB")
    input_tensor = transform(image).unsqueeze(0).to(device)

    model.eval()
    with torch.no_grad():
        outputs = model(input_tensor)
        probabilities = F.softmax(outputs.logits, dim=1).squeeze(0)

    prob_real = probabilities[0].item()
    prob_fake = probabilities[1].item()
    pred_idx = torch.argmax(probabilities).item()

    result = {
        "class_index": pred_idx,
        "class_name": CLASS_NAMES.get(pred_idx, "Unknown"),
        "confidence": max(prob_real, prob_fake),
        "prob_real": prob_real,
        "prob_fake": prob_fake,
    }
    return result

def main():
    parser = argparse.ArgumentParser(description="Classify an image as Real or AI-Generated using CvT-13.")
    parser.add_argument("image_path", type=str, help="Path to the image to classify.")
    parser.add_argument("--weights_folder", type=str, default="./models", help="Directory containing .pth model weights.")
    args = parser.parse_args()

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Device: {device}")

    model = get_model(device, num_labels=2)
    model = load_latest_model(model, device, args.weights_folder)

    try:
        res = predict_image(args.image_path, model, device)
        print("\n" + "=" * 50)
        print("          AI IMAGE DETECTION RESULT               ")
        print("=" * 50)
        print(f"Image Target    : {args.image_path}")
        print(f"Prediction      : {res['class_name']}")
        print(f"Confidence      : {res['confidence'] * 100:.2f}%")
        print("-" * 50)
        print(f"Real Probability: {res['prob_real'] * 100:.2f}%")
        print(f"Fake Probability: {res['prob_fake'] * 100:.2f}%")
        print("=" * 50)
    except Exception as e:
        print(f"[Error during prediction]: {e}")

if __name__ == "__main__":
    main()
