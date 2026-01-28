from ultralytics import YOLO
from pathlib import Path
import torch

def print_torch_version():
    print(torch.__version__)
    print("CUDA available:", torch.cuda.is_available())
    print("GPU:", torch.cuda.get_device_name(0))

def train_model():

    project_root = Path(__file__).resolve().parent

    print_torch_version()

    model = YOLO("yolov8s.pt")

    model.train(
        data=project_root / "data/data.yaml",
        epochs=20,
        imgsz=640,
        batch=16,
        device=0,
        project=project_root / "runs",
        name="train"
    )



