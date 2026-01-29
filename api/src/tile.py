from dataclasses import dataclass
from enum import Enum
from typing import Optional


class Suit(Enum):
    MAN = "m"
    PIN = "p"
    SOU = "s"
    HONOR = "z"


@dataclass(frozen=True)
class DetectedTile:
    code: str  # "1m", "0p" (red 5), "5z", "0z" (back)
    confidence: float
    bbox: tuple[int, int, int, int]

    @property
    def is_back(self) -> bool:
        return self.code == "0z"

    @property
    def is_red_five(self) -> bool:
        return self.code in ("0m", "0p", "0s")

    @property
    def suit(self) -> Optional[Suit]:
        if self.is_back:
            return None
        return Suit(self.code[-1])

    @property
    def number(self) -> Optional[int]:
        """Returns tile number 1-9, or None for back tiles."""
        if self.is_back:
            return None
        num = int(self.code[:-1])
        return 5 if num == 0 else num  # red 5 → 5

    @property
    def name(self) -> str:
        """Human readable name: RED 5 MAN, 1 SOU, EAST, HAKU, BACK."""
        if self.is_back:
            return "BACK"

        suit = self.suit
        num = int(self.code[:-1])

        if suit == Suit.HONOR:
            honor_names = {
                1: "EAST",
                2: "SOUTH",
                3: "WEST",
                4: "NORTH",
                5: "HAKU",
                6: "HATSU",
                7: "CHUN",
            }
            return honor_names[num]

        suit_name = suit.name  # MAN, PIN, SOU
        if num == 0:
            return f"RED 5 {suit_name}"
        return f"{num} {suit_name}"

    def to_34(self) -> Optional[int]:
        """Convert to 34-format index. Returns None for back tiles."""
        if self.is_back:
            return None

        suit = self.suit
        num = self.number
        assert suit is not None and num is not None

        base = {"m": 0, "p": 9, "s": 18, "z": 27}[suit.value]
        return base + (num - 1)

    def to_136(self, copy_index: int = 0) -> Optional[int]:
        """
        Convert to 136-format index. Returns None for back tiles.

        For red fives, copy_index is ignored (there's only one red per suit).
        For regular tiles, copy_index 0-3 selects which copy.
        """
        if self.is_back:
            return None

        if self.is_red_five:
            red_fives = {"m": 16, "p": 52, "s": 88}
            return red_fives[self.suit.value]

        tile_34 = self.to_34()
        assert tile_34 is not None
        base = tile_34 * 4

        # Skip red five index for regular 5s
        if self.number == 5 and self.suit in (Suit.MAN, Suit.PIN, Suit.SOU):
            # Indices for regular 5: base+1, base+2, base+3 (base+0 is red)
            return base + 1 + min(copy_index, 2)

        return base + min(copy_index, 3)
