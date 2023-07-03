export function has<T>(obj: T, prop: string | number): boolean {
  if (obj !== null && obj !== undefined) {
    return obj.hasOwnProperty(prop)
  }
  return false
}

export function includes<T>(arr: T[], elem: T): boolean {
  return Array.isArray(arr) && arr.includes(elem)
}

export function shallowClone<T>(obj: T): T {
  if (Array.isArray(obj)) {
    return [...obj] as T
  } else {
    return { ...obj }
  }
}

/**
 * Array.prototype.some wrapper
 * Keep edge case handling of lodash for invalid inputs "just in case"
 */
export function some<T>(
  arr: T[],
  predicate: (elem: T, idx: number) => boolean
) {
  if (!Array.isArray(arr)) {
    return false
  }
  return arr.some(predicate)
}

/**
 * Array.prototype.every wrapper
 * Keep edge case handling of lodash for invalid inputs "just in case"
 */
export function every<T>(
  arr: T[],
  predicate: (elem: T, idx: number) => boolean
) {
  if (!Array.isArray(arr)) {
    return false
  }
  return arr.every(predicate)
}
