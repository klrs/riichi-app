import pathlib
import sys

# Patch WindowsPath for models trained on Windows
pathlib.WindowsPath = pathlib.PosixPath

import cv2
from ultralytics import YOLO

HONOR_TILES = {
    "1z": "East Wind",
    "2z": "South Wind",
    "3z": "West Wind",
    "4z": "North Wind",
    "5z": "White Dragon",
    "6z": "Green Dragon",
    "7z": "Red Dragon",
}

SUIT_NAMES = {
    "m": "MAN",
    "p": "PIN",
    "s": "SOU",
}


def format_tile_name(code: str) -> str:
    if code in HONOR_TILES:
        return HONOR_TILES[code]
    if len(code) >= 2:
        number = code[:-1]
        suit = code[-1]
        if suit in SUIT_NAMES:
            return f"{number} {SUIT_NAMES[suit]}"
    return code


def main():
    if len(sys.argv) < 2:
        print("Usage: uv run test_model.py <image_path>")
        sys.exit(1)

    image_path = pathlib.Path(sys.argv[1])
    if not image_path.exists():
        print(f"Error: Image not found at {image_path}")
        sys.exit(1)

    model_path = pathlib.Path(__file__).parent / "best.pt"
    if not model_path.exists():
        print(f"Error: Model not found at {model_path}")
        sys.exit(1)

    model = YOLO(model_path)
    results = model(image_path)

    image = cv2.imread(str(image_path))

    print("Detected tiles:")
    for result in results:
        if len(result.boxes) == 0:
            print("  No detections found")
            continue

        for box in result.boxes:
            cls_id = int(box.cls[0])
            cls_name = result.names[cls_id]
            confidence = float(box.conf[0])
            x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())
            tile_name = format_tile_name(cls_name)

            print(f"  {tile_name}: {confidence:.2%}")

            cv2.rectangle(image, (x1, y1), (x2, y2), (0, 255, 0), 2)

            label = f"{tile_name} {confidence:.0%}"
            font = cv2.FONT_HERSHEY_SIMPLEX
            font_scale = 0.5
            thickness = 1
            (text_w, text_h), baseline = cv2.getTextSize(label, font, font_scale, thickness)

            cv2.rectangle(image, (x1, y1 - text_h - 6), (x1 + text_w, y1), (0, 255, 0), -1)
            cv2.putText(image, label, (x1, y1 - 4), font, font_scale, (0, 0, 0), thickness)

    output_path = image_path.stem + "_output" + image_path.suffix
    cv2.imwrite(output_path, image)
    print(f"\nOutput saved to: {output_path}")

if __name__ == "__main__":
    main()
