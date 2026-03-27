import { IOrAlt } from "@chevrotain/types";

export function addOrFastMapEntry(
  orFastMaps: Record<number, Record<number, number>>,
  orFastMapAltsRef: Record<number, IOrAlt<any>[]>,
  mapKey: number,
  tokenTypeIdx: number,
  altIdx: number,
  alts: IOrAlt<any>[],
  gatedOffset: number,
): void {
  let map = orFastMaps[mapKey];
  if (map === undefined) {
    map = Object.create(null);
    orFastMaps[mapKey] = map;
    orFastMapAltsRef[mapKey] = alts;
  }
  let hasGatedPredecessor = false;
  for (let g = 0; g < altIdx; g++) {
    if (alts[g].GATE !== undefined) {
      hasGatedPredecessor = true;
      break;
    }
  }
  const encodedAlt = hasGatedPredecessor ? altIdx + gatedOffset : altIdx;
  const existing = map[tokenTypeIdx];
  if (existing === undefined) {
    map[tokenTypeIdx] = encodedAlt;
  } else if (existing >= 0) {
    const existingAlt =
      existing >= gatedOffset ? existing - gatedOffset : existing;
    if (existingAlt !== altIdx) {
      const existingGated = alts[existingAlt].GATE !== undefined;
      const newGated = alts[altIdx].GATE !== undefined;
      if (existingGated && !newGated) {
        map[tokenTypeIdx] = encodedAlt;
      } else if (!existingGated && newGated) {
        if (hasGatedPredecessor && existing < gatedOffset) {
          map[tokenTypeIdx] = existing + gatedOffset;
        }
      } else if (!existingGated && !newGated) {
        map[tokenTypeIdx] = -1;
      }
    }
  }
}

export function cloneNullProtoRecord<T>(
  src: Record<number, T> | undefined,
): Record<number, T> | undefined {
  if (src === undefined) return undefined;
  const clone: Record<number, T> = Object.create(null);
  for (const key of Object.keys(src)) {
    clone[key as any] = src[key as any];
  }
  return clone;
}

export function cloneSparseRecordTable<T>(
  src: Record<number, Record<number, T>>,
): Record<number, Record<number, T>> {
  const clone: Record<number, Record<number, T>> = [];
  for (const key of Object.keys(src)) {
    clone[key as any] = cloneNullProtoRecord(src[key as any]) as Record<
      number,
      T
    >;
  }
  return clone;
}

export function cloneSparseNumberArrayTable(
  src: Record<number, number[]>,
): Record<number, number[]> {
  const clone: Record<number, number[]> = [];
  for (const key of Object.keys(src)) {
    clone[key as any] = src[key as any].slice();
  }
  return clone;
}

export function cloneSparseValueTable<T>(
  src: Record<number, T>,
): Record<number, T> {
  const clone: Record<number, T> = [];
  for (const key of Object.keys(src)) {
    clone[key as any] = src[key as any];
  }
  return clone;
}

export function cloneSparseArray<T>(src: T[]): T[] {
  const clone: T[] = [];
  for (const key of Object.keys(src)) {
    clone[key as any] = src[key as any];
  }
  return clone;
}
