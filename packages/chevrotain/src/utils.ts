/**
 *  ES2019 Array.prototype.flatMap
 *  TODO: Can be removed once we use ES2019 as the compile target
 */
export function flatMap<U, R>(
  arr: U[],
  callback: (x: U, idx: number) => R[]
): R[] {
  return Array.prototype.concat.apply([], arr.map(callback))
}

/**
 *
 * Could be replaced with built-in Array.prototype.group in the future
 *   - https://tc39.es/proposal-array-grouping/#sec-array.prototype.group
 */
export function groupBy<T>(
  values: T[],
  predicate: (val: T) => string
): Record<string, T[]> {
  const result: Record<string, T[]> = Object.create(null)

  if (!Array.isArray(values)) {
    return result
  }

  values.forEach((val: T) => {
    const valKey = predicate(val)
    if (result[valKey] === undefined) {
      result[valKey] = []
    }
    result[valKey].push(val)
  })

  return result
}

export function difference<T>(arrA: T[], arrB: T[]): T[] {
  if (!Array.isArray(arrA)) {
    return []
  }
  if (!Array.isArray(arrB)) {
    return arrA
  }

  return arrA.filter((val) => !includes(arrB, val))
}

export function isEmpty<T>(arr: T[] | undefined): boolean {
  return arr?.length === 0
}

/**
 * TODO: Can be replaced with ECMAScript 2016 includes once the compilation
 *       Target is updated
 *       - https://262.ecma-international.org/7.0/#sec-array.prototype.includes*
 */
export function includes<T>(arr: T[], target: T): boolean {
  if (!Array.isArray(arr)) {
    return false
  }
  return arr.indexOf(target) !== -1
}
