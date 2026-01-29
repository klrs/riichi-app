from mahjong.constants import (
    CHUN,
    EAST,
    HAKU,
    HATSU,
    NORTH,
    SOUTH,
    WEST,
)


YOLO_TO_34_INDEX: dict[str, int] = {
    # Man (characters) - indices 0-8
    "1m": 0,
    "2m": 1,
    "3m": 2,
    "4m": 3,
    "5m": 4,
    "6m": 5,
    "7m": 6,
    "8m": 7,
    "9m": 8,
    # Pin (circles) - indices 9-17
    "1p": 9,
    "2p": 10,
    "3p": 11,
    "4p": 12,
    "5p": 13,
    "6p": 14,
    "7p": 15,
    "8p": 16,
    "9p": 17,
    # Sou (bamboo) - indices 18-26
    "1s": 18,
    "2s": 19,
    "3s": 20,
    "4s": 21,
    "5s": 22,
    "6s": 23,
    "7s": 24,
    "8s": 25,
    "9s": 26,
    # Honor tiles - indices 27-33
    "1z": EAST,  # 27
    "2z": SOUTH,  # 28
    "3z": WEST,  # 29
    "4z": NORTH,  # 30
    "5z": HAKU,  # 31 - White Dragon
    "6z": HATSU,  # 32 - Green Dragon
    "7z": CHUN,  # 33 - Red Dragon
}

INDEX_TO_YOLO: dict[int, str] = {v: k for k, v in YOLO_TO_34_INDEX.items()}

TILE_DISPLAY_NAMES: dict[int, str] = {
    # Man
    0: "1 Man",
    1: "2 Man",
    2: "3 Man",
    3: "4 Man",
    4: "5 Man",
    5: "6 Man",
    6: "7 Man",
    7: "8 Man",
    8: "9 Man",
    # Pin
    9: "1 Pin",
    10: "2 Pin",
    11: "3 Pin",
    12: "4 Pin",
    13: "5 Pin",
    14: "6 Pin",
    15: "7 Pin",
    16: "8 Pin",
    17: "9 Pin",
    # Sou
    18: "1 Sou",
    19: "2 Sou",
    20: "3 Sou",
    21: "4 Sou",
    22: "5 Sou",
    23: "6 Sou",
    24: "7 Sou",
    25: "8 Sou",
    26: "9 Sou",
    # Honors
    EAST: "East Wind",
    SOUTH: "South Wind",
    WEST: "West Wind",
    NORTH: "North Wind",
    HAKU: "White Dragon",
    HATSU: "Green Dragon",
    CHUN: "Red Dragon",
}


def yolo_class_to_tile_index(yolo_class: str) -> int | None:
    """Convert a YOLO class name (e.g., '1m', '5z') to a mahjong 34-tile index."""
    return YOLO_TO_34_INDEX.get(yolo_class)


def tile_index_to_yolo_class(index: int) -> str | None:
    """Convert a mahjong 34-tile index to a YOLO class name."""
    return INDEX_TO_YOLO.get(index)


def get_tile_display_name(yolo_class: str) -> str:
    """Get a human-readable display name for a YOLO class."""
    index = YOLO_TO_34_INDEX.get(yolo_class)
    if index is not None:
        return TILE_DISPLAY_NAMES.get(index, yolo_class)
    return yolo_class


def yolo_classes_to_one_line_string(yolo_classes: list[str]) -> str:
    """
    Convert a list of YOLO classes to mahjong one-line string format.

    Example: ['1m', '2m', '3m', '1p', '2p'] -> '123m12p'
    """
    man = []
    pin = []
    sou = []
    honors = []

    for cls in yolo_classes:
        if len(cls) >= 2:
            number = cls[:-1]
            suit = cls[-1]
            if suit == "m":
                man.append(number)
            elif suit == "p":
                pin.append(number)
            elif suit == "s":
                sou.append(number)
            elif suit == "z":
                honors.append(number)

    result = ""
    if man:
        result += "".join(sorted(man)) + "m"
    if pin:
        result += "".join(sorted(pin)) + "p"
    if sou:
        result += "".join(sorted(sou)) + "s"
    if honors:
        result += "".join(sorted(honors)) + "z"

    return result
