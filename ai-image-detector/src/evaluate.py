import os
import argparse
import numpy as np
import matplotlib.pyplot as plt
import torch
from torch.utils.data import DataLoader
from torch.cuda.amp import autocast
from tqdm import tqdm
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix
from mlxtend.plotting import plot_confusion_matrix

from custom_dataset import get_dataset
from model import get_model, load_latest_model

def evaluate_model(test_data_dir, device, criterion, weights_folder="./models", batch_size=64, num_workers=2):
    """
    Evaluates the trained CvT-13 classifier on a labeled test dataset.
    Returns: avg_test_loss, accuracy, precision, recall, f1
    """
    print(f"Loading test dataset from: {test_data_dir}")
    test_data = get_dataset(test_data_dir, is_train=False)
    
    # Safe num_workers for Windows compatibility
    workers = num_workers if os.name != 'nt' else 0
    pin_mem = torch.cuda.is_available()

    test_loader = DataLoader(
        test_data,
        batch_size=batch_size,
        shuffle=False,
        num_workers=workers,
        pin_memory=pin_mem
    )

    model = get_model(device, num_labels=2)
    model = load_latest_model(model, device, weights_folder)
    model.eval()

    test_loss = 0.0
    all_predicted = []
    all_labels = []

    use_cuda_amp = (device.type == 'cuda')

    with torch.no_grad():
        with tqdm(total=len(test_loader), desc="Evaluating", unit="batch") as progress_bar:
            for inputs, labels in test_loader:
                inputs, labels = inputs.to(device), labels.to(device)
                with autocast(enabled=use_cuda_amp):
                    outputs = model(inputs)
                    loss = criterion(outputs.logits, labels)

                test_loss += loss.item()
                _, predicted = outputs.logits.max(1)
                all_predicted.extend(predicted.cpu().numpy())
                all_labels.extend(labels.cpu().numpy())

                progress_bar.set_postfix({"Test Loss": f"{loss.item():.4f}"})
                progress_bar.update()

    all_labels = np.array(all_labels)
    all_predicted = np.array(all_predicted)

    avg_test_loss = test_loss / max(len(test_loader), 1)
    accuracy = accuracy_score(all_labels, all_predicted)
    precision = precision_score(all_labels, all_predicted, average='macro', zero_division=0)
    recall = recall_score(all_labels, all_predicted, average='macro', zero_division=0)
    f1 = f1_score(all_labels, all_predicted, average='macro', zero_division=0)

    # Save Confusion Matrix
    metrics_dir = os.path.abspath("./metrics")
    os.makedirs(metrics_dir, exist_ok=True)
    cm = confusion_matrix(all_labels, all_predicted)

    fig, ax = plt.subplots(figsize=(8, 8))
    plot_confusion_matrix(
        conf_mat=cm,
        class_names=["Real (0)", "AI-Generated (1)"],
        figsize=(8, 8),
        show_absolute=True,
        show_normed=True
    )
    plt.title("Confusion Matrix: AI Image Detection")
    cm_path = os.path.join(metrics_dir, "Custom_Evaluation.png")
    plt.savefig(cm_path, bbox_inches='tight')
    plt.close()
    print(f"Confusion matrix saved to: {cm_path}")

    return avg_test_loss, accuracy, precision, recall, f1

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Evaluate trained CvT-13 AI Image Detector on a dataset.')
    parser.add_argument('test_data_dir', type=str, help='Directory path for test data (containing A_real/ and B_fake/).')
    parser.add_argument('--weights_folder', type=str, default='./models', help='Path to weights folder. Defaults to ./models.')
    parser.add_argument('--batch_size', type=int, default=64, help='Evaluation batch size.')
    parser.add_argument('--num_workers', type=int, default=2, help='DataLoader workers.')
    args = parser.parse_args()

    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    print(f"Using device: {device}")
    criterion = torch.nn.CrossEntropyLoss()

    avg_test_loss, accuracy, precision, recall, f1 = evaluate_model(
        test_data_dir=args.test_data_dir,
        device=device,
        criterion=criterion,
        weights_folder=args.weights_folder,
        batch_size=args.batch_size,
        num_workers=args.num_workers
    )

    print("\n" + "=" * 45)
    print("           EVALUATION METRICS                ")
    print("=" * 45)
    print(f"Average Test Loss : {avg_test_loss:.4f}")
    print(f"Accuracy          : {accuracy * 100:.2f}%")
    print(f"Precision (Macro) : {precision:.4f}")
    print(f"Recall (Macro)    : {recall:.4f}")
    print(f"F1 Score (Macro)  : {f1:.4f}")
    print("=" * 45)
