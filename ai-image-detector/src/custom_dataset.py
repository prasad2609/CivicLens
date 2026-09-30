import os
import shutil
from PIL import Image, ImageFile
from torchvision import datasets, transforms

# Prevent PIL from throwing errors on truncated images
ImageFile.LOAD_TRUNCATED_IMAGES = True

def get_transform(image_size=(200, 200)):
    """Standard normalization and resizing pipeline for CvT-13."""
    return transforms.Compose([
        transforms.Resize(image_size),
        transforms.ToTensor(),
        transforms.Normalize(
            mean=[0.485, 0.456, 0.406],
            std=[0.229, 0.224, 0.225]
        ),
    ])

def get_train_transform(image_size=(200, 200)):
    """Augmented transform pipeline for training."""
    return transforms.Compose([
        transforms.Resize(image_size),
        transforms.RandomHorizontalFlip(p=0.5),
        transforms.RandomRotation(degrees=10),
        transforms.ColorJitter(brightness=0.1, contrast=0.1),
        transforms.ToTensor(),
        transforms.Normalize(
            mean=[0.485, 0.456, 0.406],
            std=[0.229, 0.224, 0.225]
        ),
    ])

def is_valid_file(filename):
    """Filter files by valid image extensions."""
    valid_extensions = ('.jpg', '.jpeg', '.png', '.ppm', '.bmp', '.pgm', '.tif', '.tiff', '.webp')
    return filename.lower().endswith(valid_extensions)

def remove_ipynb_checkpoints(data_dir):
    """Clean Jupyter notebook checkpoint directories from dataset folders."""
    if not os.path.exists(data_dir):
        return
    for root, dirs, _ in os.walk(data_dir):
        if '.ipynb_checkpoints' in dirs:
            checkpoint_path = os.path.join(root, '.ipynb_checkpoints')
            shutil.rmtree(checkpoint_path, ignore_errors=True)

def get_dataset(data_dir, is_train=False):
    """
    Build and return a PyTorch ImageFolder dataset.
    
    Expected folder structure:
      data_dir/
        A_real/ -> Class 0
        B_fake/ -> Class 1
    """
    if not os.path.exists(data_dir):
        raise FileNotFoundError(f"Dataset directory '{data_dir}' does not exist.")

    remove_ipynb_checkpoints(data_dir)
    transform = get_train_transform() if is_train else get_transform()
    dataset = datasets.ImageFolder(root=data_dir, transform=transform, is_valid_file=is_valid_file)
    return dataset
