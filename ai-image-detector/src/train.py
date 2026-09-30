import os
import argparse
import matplotlib.pyplot as plt
import torch
import torch.nn as nn
from torch.utils.data import DataLoader, random_split
from torch.cuda.amp import autocast, GradScaler
from tqdm import tqdm
from sklearn.metrics import accuracy_score

from custom_dataset import get_dataset
from model import get_model, load_latest_model, save_model

def train(
    train_data_dir,
    val_data_dir=None,
    weights_folder="./models",
    save_folder="./models",
    total_epochs=25,
    batch_size=64,
    learning_rate=1e-4,
    weight_decay=1e-2,
    num_workers=2
):
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Training on device: {device}")

    # Safe workers for Windows
    workers = num_workers if os.name != 'nt' else 0
    pin_mem = torch.cuda.is_available()

    # Dataset loading
    print(f"Loading training data from: {train_data_dir}")
    full_dataset = get_dataset(train_data_dir, is_train=True)

    if val_data_dir and os.path.exists(val_data_dir):
        print(f"Loading validation data from: {val_data_dir}")
        train_dataset = full_dataset
        val_dataset = get_dataset(val_data_dir, is_train=False)
    else:
        # 90/10 train-validation split
        val_size = max(1, int(len(full_dataset) * 0.1))
        train_size = len(full_dataset) - val_size
        train_dataset, val_dataset = random_split(
            full_dataset,
            [train_size, val_size],
            generator=torch.Generator().manual_seed(42)
        )
        print(f"Split dataset: {train_size} train samples, {val_size} validation samples.")

    train_loader = DataLoader(
        train_dataset,
        batch_size=batch_size,
        shuffle=True,
        num_workers=workers,
        pin_memory=pin_mem
    )
    val_loader = DataLoader(
        val_dataset,
        batch_size=batch_size,
        shuffle=False,
        num_workers=workers,
        pin_memory=pin_mem
    )

    # Initialize model and load latest checkpoint if present
    model = get_model(device, num_labels=2)
    model = load_latest_model(model, device, weights_folder)

    criterion = nn.CrossEntropyLoss()
    optimizer = torch.optim.AdamW(model.parameters(), lr=learning_rate, weight_decay=weight_decay)
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=total_epochs, eta_min=1e-6)
    scaler = GradScaler(enabled=(device.type == "cuda"))

    history_loss = []
    history_val_acc = []

    print("\nStarting training loop...")
    for epoch in range(1, total_epochs + 1):
        model.train()
        running_loss = 0.0

        with tqdm(train_loader, desc=f"Epoch {epoch}/{total_epochs}", unit="batch") as pbar:
            for inputs, labels in pbar:
                inputs, labels = inputs.to(device), labels.to(device)

                optimizer.zero_grad()
                with autocast(enabled=(device.type == "cuda")):
                    outputs = model(inputs)
                    loss = criterion(outputs.logits, labels)

                scaler.scale(loss).backward()
                scaler.step(optimizer)
                scaler.update()

                running_loss += loss.item()
                pbar.set_postfix({"Loss": f"{loss.item():.4f}"})

        scheduler.step()
        epoch_loss = running_loss / max(len(train_loader), 1)
        history_loss.append(epoch_loss)

        # Validation phase
        model.eval()
        val_preds = []
        val_targets = []
        with torch.no_grad():
            for inputs, labels in val_loader:
                inputs, labels = inputs.to(device), labels.to(device)
                with autocast(enabled=(device.type == "cuda")):
                    outputs = model(inputs)
                _, preds = outputs.logits.max(1)
                val_preds.extend(preds.cpu().numpy())
                val_targets.extend(labels.cpu().numpy())

        val_acc = accuracy_score(val_targets, val_preds) if val_targets else 0.0
        history_val_acc.append(val_acc)

        print(f"Epoch {epoch} Completed | Avg Loss: {epoch_loss:.4f} | Val Accuracy: {val_acc * 100:.2f}%")

        # Save checkpoint
        save_model(model, epoch, save_folder=save_folder, optimizer=optimizer, loss=epoch_loss)

    # Save training loss graph
    metrics_dir = os.path.abspath("./metrics")
    os.makedirs(metrics_dir, exist_ok=True)
    plt.figure(figsize=(10, 5))
    plt.plot(range(1, total_epochs + 1), history_loss, label="Train Loss", color="blue")
    plt.title("CvT-13 Training Loss Progression")
    plt.xlabel("Epoch")
    plt.ylabel("CrossEntropy Loss")
    plt.grid(True)
    plt.legend()
    loss_chart_path = os.path.join(metrics_dir, "training_loss.png")
    plt.savefig(loss_chart_path, bbox_inches="tight")
    plt.close()
    print(f"Loss plot saved to: {loss_chart_path}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train Microsoft CvT-13 on AI vs Real image dataset.")
    parser.add_argument("train_data_dir", type=str, help="Directory containing training classes (A_real/ and B_fake/).")
    parser.add_argument("--val_data_dir", type=str, default=None, help="Optional directory for validation data.")
    parser.add_argument("--total_epochs", type=int, default=25, help="Total epochs to train.")
    parser.add_argument("--learning_rate", type=float, default=1e-4, help="Initial learning rate.")
    parser.add_argument("--batch_size", type=int, default=64, help="Batch size.")
    parser.add_argument("--weights_folder", type=str, default="./models", help="Folder to resume from.")
    parser.add_argument("--save_folder", type=str, default="./models", help="Folder to save checkpoints.")
    parser.add_argument("--num_workers", type=int, default=2, help="Number of worker threads.")
    args = parser.parse_args()

    train(
        train_data_dir=args.train_data_dir,
        val_data_dir=args.val_data_dir,
        weights_folder=args.weights_folder,
        save_folder=args.save_folder,
        total_epochs=args.total_epochs,
        batch_size=args.batch_size,
        learning_rate=args.learning_rate,
        num_workers=args.num_workers
    )
