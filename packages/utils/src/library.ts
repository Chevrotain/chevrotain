// TODO: should this be tested or is it too trivial?
export function first<T>(arr: T[]): T {
  return arr?.[0]
}

type MaybeOneLevelNestedArray<T> = (T | T[])[]

/**
 * Flatten but for only a single level
 * TODO: replace with `Array.prototype.flat` once we upgrade `target` to es2019
 *       - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/flat
 *       - Not the depth=1 is meaningful in Chevrotain's logic and this function should **not**
 *       - be replaced with infinite depth implementation.
 *
 *  Note that currently `just-flatten-it` cannot be used due to a bug:
 *    - https://github.com/angus-c/just/issues/564
 */
export function flatten<T>(rootArr: MaybeOneLevelNestedArray<T>): T[] {
  const result: T[] = []

  for (let idx = 0; idx < rootArr.length; idx++) {
    const currItem = rootArr[idx]
    if (Array.isArray(currItem)) {
      for (let subIdx = 0; subIdx < currItem.length; subIdx++) {
        const nestedItem = currItem[subIdx]
        result.push(nestedItem)
      }
    } else {
      result.push(currItem)
    }
  }
  return result
}
