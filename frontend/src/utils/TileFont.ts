export const TileFont = {
  MANZU1: "q",
  MANZU2: "w",
  MANZU3: "e",
  MANZU4: "r",
  MANZU5: "t",
  MANZU6: "y",
  MANZU7: "u",
  MANZU8: "i",
  MANZU9: "o",
  PINZU1: "a",
  PINZU2: "s",
  PINZU3: "d",
  PINZU4: "f",
  PINZU5: "g",
  PINZU6: "h",
  PINZU7: "j",
  PINZU8: "k",
  PINZU9: "l",
  SOUZU1: "z",
  SOUZU2: "x",
  SOUZU3: "c",
  SOUZU4: "v",
  SOUZU5: "b",
  SOUZU6: "n",
  SOUZU7: "m",
  SOUZU8: ",",
  SOUZU9: ".",
  TON: "1",
  NAN: "2",
  SHA: "3",
  PEI: "4",
  HAKU: "5",
  HATSU: "6",
  CHUN: "7",
} as const;

const MANZU_CHARS = [
  TileFont.MANZU1,
  TileFont.MANZU2,
  TileFont.MANZU3,
  TileFont.MANZU4,
  TileFont.MANZU5,
  TileFont.MANZU6,
  TileFont.MANZU7,
  TileFont.MANZU8,
  TileFont.MANZU9,
];

const PINZU_CHARS = [
  TileFont.PINZU1,
  TileFont.PINZU2,
  TileFont.PINZU3,
  TileFont.PINZU4,
  TileFont.PINZU5,
  TileFont.PINZU6,
  TileFont.PINZU7,
  TileFont.PINZU8,
  TileFont.PINZU9,
];

const SOUZU_CHARS = [
  TileFont.SOUZU1,
  TileFont.SOUZU2,
  TileFont.SOUZU3,
  TileFont.SOUZU4,
  TileFont.SOUZU5,
  TileFont.SOUZU6,
  TileFont.SOUZU7,
  TileFont.SOUZU8,
  TileFont.SOUZU9,
];

const HONOR_CHARS = [
  TileFont.TON,
  TileFont.NAN,
  TileFont.SHA,
  TileFont.PEI,
  TileFont.HAKU,
  TileFont.HATSU,
  TileFont.CHUN,
];

export const tileCodeToFontChar = (code: string): string | null => {
  const match = code.match(/^(\d)([mpsz])$/);
  if (!match) return null;

  const num = parseInt(match[1], 10);
  const suit = match[2];

  switch (suit) {
    case "m":
      return MANZU_CHARS[num - 1] ?? null;
    case "p":
      return PINZU_CHARS[num - 1] ?? null;
    case "s":
      return SOUZU_CHARS[num - 1] ?? null;
    case "z":
      return HONOR_CHARS[num - 1] ?? null;
    default:
      return null;
  }
};
