# AI Image Detector

## Introduction 🌟

Identifying whether images are AI-generated or human-made is crucial as AI's capability to produce lifelike images improves. This project tackles this challenge through advanced machine learning, effectively classifying images with minimal uncertainty.

The AI Image Detector project provides a tool for reliably distinguishing between AI-generated and human-created images, critical for journalism, forensic validation, and digital integrity.

## Overview and Model Information 🌐📊

This tool is designed around Microsoft's **CvT-13** (Convolutional Vision Transformer) model, combining the convolutional inductive bias with vision transformer self-attention mechanisms.

### Key Features 🚀

- **CvT-13 Architecture**: Vision Transformer with depthwise separable convolutional token embeddings and projection.
- **Binary Classification**: Differentiates Real (Class 0) from AI-Generated (Class 1).
- **Mixed Precision Training**: PyTorch AMP (Automatic Mixed Precision) for fast training and low VRAM usage.
- **Custom Evaluation Metrics**: Comprehensive accuracy, precision, recall, F1 score, and confusion matrix visualization.
- **Inference CLI & API**: Command-line image evaluator and modular Python API.

---

## File Structure

```
ai-image-detector/
│
├── models/                     # Checkpoints (model_epoch_*.pth)
├── metrics/                    # Generated confusion matrices & loss graphs
├── data/                       # Dataset directory (A_real / B_fake)
│   ├── A_real/
│   └── B_fake/
│
├── src/
│   ├── custom_dataset.py       # Data loader & torchvision transforms
│   ├── model.py                # CvT-13 model builder & checkpoint loader
│   ├── train.py                # Training loop with AMP & checkpointing
│   ├── evaluate.py             # Evaluation & confusion matrix generator
│   └── main.py                 # Single-image prediction CLI
│
├── requirements.txt            # Python dependencies
└── README.md                   # Project documentation
```

---

## Installation & Setup 🛠️

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

*(For GPU CUDA support, install PyTorch with CUDA matching your driver from [pytorch.org](https://pytorch.org))*

### 2. Dataset Organization

Organize your dataset into alphabetical folders for automatic label mapping:
- `A_real` &rarr; Class 0 (Human/Real)
- `B_fake` &rarr; Class 1 (AI-Generated)

```
data/
├── A_real/
│   ├── photo1.jpg
│   └── photo2.jpg
└── B_fake/
    ├── synth1.jpg
    └── synth2.jpg
```

---

## Usage 🚀

### 1. Single Image Prediction (`main.py`)
```bash
python src/main.py path/to/sample.jpg --weights_folder=./models
```

### 2. Evaluate on Test Dataset (`evaluate.py`)
```bash
python src/evaluate.py path/to/test_data --weights_folder=./models
```

### 3. Train from Scratch or Fine-tune (`train.py`)
```bash
python src/train.py path/to/train_data --val_data_dir=path/to/val_data --total_epochs=25 --batch_size=64 --learning_rate=1e-4
```
