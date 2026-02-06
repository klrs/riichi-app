export const HAND_SIZE = 14;

export interface SuitDefinition {
  label: string;
  codes: string[];
}

export const SUIT_DEFINITIONS: SuitDefinition[] = [
  {
    label: "Man",
    codes: ["1m", "2m", "3m", "4m", "0m", "5m", "6m", "7m", "8m", "9m"],
  },
  {
    label: "Pin",
    codes: ["1p", "2p", "3p", "4p", "0p", "5p", "6p", "7p", "8p", "9p"],
  },
  {
    label: "Sou",
    codes: ["1s", "2s", "3s", "4s", "0s", "5s", "6s", "7s", "8s", "9s"],
  },
  {
    label: "Honors",
    codes: ["1z", "2z", "3z", "4z", "5z", "6z", "7z"],
  },
];
