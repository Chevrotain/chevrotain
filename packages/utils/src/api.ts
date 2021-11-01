export function keys(obj: any): string[] {
  if (obj === undefined || obj === null) {
    return []
  }
  return Object.keys(obj)
}

export function values(obj: any): any[] {
  const vals = []
  const keys = Object.keys(obj)
  for (let i = 0; i < keys.length; i++) {
    vals.push(obj[keys[i]])
  }
  return vals
}

export function filter<T>(
  arr: T[],
  predicate: (value: T, index: number, array: T[]) => unknown
): T[] {
  return arr.filter(predicate)
}

export function pick(obj: Object, predicate: (item: any) => boolean) {
  const keys = Object.keys(obj)
  const result: any = {}

  for (let i = 0; i < keys.length; i++) {
    const currKey = keys[i]
    const currItem = (obj as any)[currKey]
    if (predicate(currItem)) {
      result[currKey] = currItem
    }
  }

  return result
}

export function contains<T>(arr: T[], item: T): boolean {
  return arr.includes(item)
}

/**
 * shallow clone
 */
export function cloneArr<T>(arr: T[]): T[] {
  const newArr = []
  for (let i = 0; i < arr.length; i++) {
    newArr.push(arr[i])
  }
  return newArr
}

/**
 * shallow clone
 */
export function cloneObj(obj: Object): any {
  return Object.assign({}, obj)
}

export function find<T>(
  arr: T[],
  predicate: (item: T) => boolean
): T | undefined {
  for (let i = 0; i < arr.length; i++) {
    const item = arr[i]
    if (predicate.call(null, item)) {
      return item
    }
  }
  return undefined
}

export function reduce<T, A>(
  arrOrObj: Array<T>,
  iterator: (result: A, item: T, idx: number) => A,
  initial: A
): A
export function reduce<T, A>(
  arrOrObj: Record<string, T>,
  iterator: (result: A, item: T, idx: string) => A,
  initial: A
): A
export function reduce<T, A>(
  arrOrObj: Array<T> | Object,
  iterator: (result: A, item: T, idx: any) => A,
  initial: A
): A {
  const isArr = Array.isArray(arrOrObj)

  const vals: T[] = isArr ? <Array<T>>arrOrObj : values(arrOrObj)
  const objKeys = isArr ? [] : keys(arrOrObj)

  let accumulator = initial
  for (let i = 0; i < vals.length; i++) {
    accumulator = iterator(accumulator, vals[i], isArr ? i : objKeys[i])
  }
  return accumulator
}

export function isRegExp(obj: any): obj is RegExp {
  return obj instanceof RegExp
}

export function isObject(obj: any): obj is Object {
  return obj instanceof Object
}

export function sortBy<T>(arr: T[], orderFunc: (item: T) => number): T[] {
  const result = cloneArr(arr)
  result.sort((a, b) => orderFunc(a) - orderFunc(b))
  return result
}

export function zipObject(keys: any[], values: any[]): Object {
  if (keys.length !== values.length) {
    throw Error("can't zipObject with different number of keys and values!")
  }

  const result: Record<string, any> = {}
  for (let i = 0; i < keys.length; i++) {
    result[keys[i]] = values[i]
  }
  return result
}

/**
 * mutates! (and returns) target
 */
export const assign = Object.assign

export function defaults<S, T>(a: S, b: T): S & T {
  return Object.assign(b, a)
}

/**
 * Merge obj2 into obj1.
 * Will overwrite existing properties with the same name
 */
export function merge(obj1: any, obj2: any): any {
  const result = cloneObj(obj1)
  const keys2 = keys(obj2)
  for (let i = 0; i < keys2.length; i++) {
    const key = keys2[i]
    const value = obj2[key]
    result[key] = value
  }

  return result
}

export function IDENTITY<T>(item: T): T {
  return item
}

export function PRINT_ERROR(msg: string) {
  /* istanbul ignore else - can't override global.console in node.js */
  if (console && console.error) {
    console.error(`Error: ${msg}`)
  }
}

export function PRINT_WARNING(msg: string) {
  /* istanbul ignore else - can't override global.console in node.js*/
  if (console && console.warn) {
    // TODO: modify docs accordingly
    console.warn(`Warning: ${msg}`)
  }
}

/* istanbul ignore next - for performance tracing*/
export function timer<T>(func: () => T): { time: number; value: T } {
  const start = new Date().getTime()
  const val = func()
  const end = new Date().getTime()
  const total = end - start
  return { time: total, value: val }
}

// based on: https://github.com/petkaantonov/bluebird/blob/b97c0d2d487e8c5076e8bd897e0dcd4622d31846/src/util.js#L201-L216
export function toFastProperties(toBecomeFast: any) {
  function FakeConstructor() {}

  // If our object is used as a constructor it would receive
  FakeConstructor.prototype = toBecomeFast
  const fakeInstance = new (FakeConstructor as any)()

  function fakeAccess() {
    return typeof fakeInstance.bar
  }

  // help V8 understand this is a "real" prototype by actually using
  // the fake instance.
  fakeAccess()
  fakeAccess()

  return toBecomeFast
  // Eval prevents optimization of this method (even though this is dead code)
  /* istanbul ignore next */
  // tslint:disable-next-line
  eval(toBecomeFast)
}

export function upperFirst(str: string): string {
  if (!str) {
    return str
  }

  const firstChar = getCharacterFromCodePointAt(str, 0)
  return firstChar.toUpperCase() + str.substring(firstChar.length)
}

const surrogatePairPattern = /[\uD800-\uDBFF][\uDC00-\uDFFF]/

function getCharacterFromCodePointAt(str: string, idx: number): string {
  const surrogatePairCandidate = str.substring(idx, idx + 1)
  return surrogatePairPattern.test(surrogatePairCandidate)
    ? surrogatePairCandidate
    : str[idx]
}

export function flatMap<U, R>(arr: U[], callback: (x: U) => R[]): R[] {
  const result: R[] = []

  for (const u of arr) {
    result.push(...callback(u))
  }

  return result
}
