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

export function forEach<T>(arr: T[], cb: (elem: T, idx: number) => void): void {
  if (!Array.isArray(arr)) {
    return
  }
  return arr.forEach(cb)
}

export function map<T, R>(arr: T[], cb: (elem: T, idx: number) => R): R[] {
  if (!Array.isArray(arr)) {
    return []
  }
  return arr.map(cb)
}

export function filter<T>(arr: T[], cb: (elem: T, idx: number) => T): T[] {
  if (!Array.isArray(arr)) {
    return []
  }
  return arr.filter(cb)
}

export function reject<T>(arr: T[], cb: (elem: T, idx: number) => T): T[] {
  if (!Array.isArray(arr)) {
    return []
  }
  const result = [] as T[]
  for (let i = 0; i < arr.length; i++) {
    const elem = arr[i]
    if (cb(elem, i)) {
      result.push(elem)
    }
  }
  return result
}

export function flatten<T>(arr: (T | T[])[]): T[] {
  if (!Array.isArray(arr)) {
    return []
  }
  // @ts-expect-error -- implement later without ES2019 flatten
  return arr.flat(1)
}

export function mapObj<T, R>(
  obj: Record<string, T>,
  cb: (val: T, key: string | number) => R
): R[] {
  if (obj === undefined || obj === null) {
    return []
  }

  const keys = Object.keys(obj)
  const result = new Array(keys.length) as R[]

  for (let i = 0; i < keys.length; i++) {
    const currKey = keys[i]
    result.push(cb(obj[currKey], i))
  }

  return result
}

export function reduce<T, A>(
  arr: T[],
  cb: (acc: A, val: T, idx: number) => A,
  initial: A
): A {
  if (!Array.isArray(arr)) {
    return initial
  }

  return arr.reduce(cb, initial)
}

export function flatMap<T, K>(arr: T[], cb: (input: T) => K | Array<K>): K[] {
  if (!Array.isArray(arr)) {
    return []
  }

  // @ts-expect-error -- implement later without ES2019 flatten
  return arr.flatMap(cb)
}

export function uniq<T>(arr: T[]): T[] {
  if (!Array.isArray(arr)) {
    return []
  }

  return [...new Set(arr)]
}

export function compact<T>(arr: (T | null | undefined)[]): T[] {
  if (!Array.isArray(arr)) {
    return []
  }

  const result = [] as T[]
  for (let i = 0; i < arr.length; i++) {
    const elem = arr[i]
    if (elem !== undefined && elem !== null) {
      result.push(elem)
    }
  }
  return result
}

export function difference<T>(arrA: T[], arrB: T[]): T[] {
  if (!Array.isArray(arrA) || !Array.isArray(arrB)) {
    return []
  }
  return arrA.filter((x) => !arrB.includes(x))
}

export function find<T>(
  arr: ReadonlyArray<T>,
  predicate: (elem: T) => boolean
): T | undefined {
  if (!Array.isArray(arr)) {
    return undefined
  }

  return arr.find(predicate)
}
