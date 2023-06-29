/**
 *  ES2019 Array.prototype.flatMap
 *  Can be removed once we use ES2019 as the compile target
 */
export function flatMap<U, R>(
  arr: U[],
  callback: (x: U, idx: number) => R[]
): R[] {
  return Array.prototype.concat.apply([], arr.map(callback))
}

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

  return arrA.filter((val) => arrB.indexOf(val) === -1)
}
