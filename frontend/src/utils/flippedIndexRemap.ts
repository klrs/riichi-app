export const remapFlippedAfterRemoval = (
  flippedIndices: Set<number>,
  removedIndex: number,
): Set<number> => {
  const newFlipped = new Set<number>();
  for (const idx of flippedIndices) {
    if (idx === removedIndex) continue;
    newFlipped.add(idx > removedIndex ? idx - 1 : idx);
  }
  return newFlipped;
};

export const remapFlippedAfterInsertion = (
  flippedIndices: Set<number>,
  insertIndex: number,
  isInsertedFlipped: boolean,
): Set<number> => {
  const newFlipped = new Set<number>();
  for (const idx of flippedIndices) {
    newFlipped.add(idx >= insertIndex ? idx + 1 : idx);
  }
  if (isInsertedFlipped) {
    newFlipped.add(insertIndex);
  }
  return newFlipped;
};
