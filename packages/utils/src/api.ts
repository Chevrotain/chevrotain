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

export function mapValues<I, O>(
  obj: Record<string, I>,
  callback: (value: I, key?: string) => O
): O[] {
  const result: O[] = []
  const objKeys = keys(obj)
  for (let idx = 0; idx < objKeys.length; idx++) {
    const currKey = objKeys[idx]
    result.push(callback(obj[currKey], currKey))
  }
  return result
}

export function map<I, O>(
  arr: I[],
  callback: (value: I, idx?: number) => O
): O[] {
  const result: O[] = []
  for (let idx = 0; idx < arr.length; idx++) {
    result.push(callback(arr[idx], idx))
  }
  return result
}

export function flatten<T>(arr: T[][]): T[]
export function flatten(arr: any[]): any[]
export function flatten(arr: any[]): any[] {
  const result: any[] = []

  for (let idx = 0; idx < arr.length; idx++) {
    const currItem = arr[idx]
    if (Array.isArray(currItem)) {
      result.push(...flatten(currItem))
    } else {
      result.push(currItem)
    }
  }
  return result
}

export function last<T>(arr: T[]): T | undefined {
  const len = arr && arr.length
  return len ? arr[len - 1] : undefined
}

export function forEach<T>(
  collection: T[],
  iteratorCallback: (item: T, index: number) => void
): void
export function forEach<K extends string | number, T>(
  collection: Record<K, T>,
  iteratorCallback: (value: T, key: K) => void
): void
export function forEach(collection: any, iteratorCallback: Function): void {
  /* istanbul ignore else */
  if (Array.isArray(collection)) {
    for (let i = 0; i < collection.length; i++) {
      iteratorCallback(collection[i], i)
    }
  } else if (isObject(collection)) {
    const colKeys = keys(collection)
    for (let i = 0; i < colKeys.length; i++) {
      const key = colKeys[i]
      const value = collection[key]
      iteratorCallback(value, key)
    }
  } else {
    throw Error("non exhaustive match")
  }
}

export function isString(item: any): item is string {
  return typeof item === "string"
}

export function isUndefined(item: any): boolean {
  return item === undefined
}

export function isFunction(item: any): item is (...args: any[]) => any {
  return item instanceof Function
}

export function drop<T>(arr: T[], howMuch: number = 1): T[] {
  return arr.slice(howMuch, arr.length)
}

export function dropRight<T>(arr: T[], howMuch: number = 1): T[] {
  return arr.slice(0, arr.length - howMuch)
}

export function filter<T>(
  arr: T[],
  predicate: (value: T, index: number, array: T[]) => unknown
): T[] {
  return arr.filter(predicate)
}

export function reject<T>(arr: T[], predicate: (item: T) => boolean): T[] {
  return filter(arr, (item) => !predicate(item))
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

export function has(obj: any, prop: string | number): boolean {
  if (isObject(obj)) {
    return obj.hasOwnProperty(prop)
  }
  return false
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

export function findAll<T>(arr: T[], predicate: (item: T) => boolean): T[] {
  const found = []
  for (let i = 0; i < arr.length; i++) {
    const item = arr[i]
    if (predicate.call(null, item)) {
      found.push(item)
    }
  }
  return found
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

export function uniq<T>(
  arr: T[],
  identity: (item: T) => any = (item) => item
): T[] {
  const identities: T[] = []
  return reduce(
    arr,
    (result, currItem) => {
      const currIdentity = identity(currItem)
      if (contains(identities, currIdentity)) {
        return result
      } else {
        identities.push(currIdentity)
        return result.concat(currItem)
      }
    },
    [] as T[]
  )
}

export function partial(func: Function, ...restArgs: any[]): Function {
  return func.bind(null, ...restArgs)
}

export function isArray(obj: any): obj is any[] {
  return Array.isArray(obj)
}

export function isRegExp(obj: any): obj is RegExp {
  return obj instanceof RegExp
}

export function isObject(obj: any): obj is Object {
  return obj instanceof Object
}

export function every<T>(
  arr: T[],
  predicate: (item: T, idx: number) => boolean
): boolean {
  for (let i = 0; i < arr.length; i++) {
    if (!predicate(arr[i], i)) {
      return false
    }
  }
  return true
}

export function difference<T>(arr: T[], values: T[]): T[] {
  return reject(arr, (item) => contains(values, item))
}

export function some<T>(arr: T[], predicate: (item: T) => boolean): boolean {
  for (let i = 0; i < arr.length; i++) {
    if (predicate(arr[i])) {
      return true
    }
  }
  return false
}

export function indexOf<T>(arr: T[], value: T): number {
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] === value) {
      return i
    }
  }
  return -1
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

/**
 * mutates! (and returns) target
 */
export function assignNoOverwrite(
  target: Record<string, any>,
  ...sources: Record<string, any>[]
): Object {
  for (let i = 0; i < sources.length; i++) {
    const curSource = sources[i]
    const currSourceKeys = keys(curSource)
    for (let j = 0; j < currSourceKeys.length; j++) {
      const currKey = currSourceKeys[j]
      if (!has(target, currKey)) {
        target[currKey] = curSource[currKey]
      }
    }
  }
  return target
}

export function defaults<S, T>(a: S, b: T): S & T {
  return Object.assign(b, a)
}

export function groupBy<T>(
  arr: T[],
  groupKeyFunc: (item: T) => string
): { [groupKey: string]: T[] } {
  const result: { [groupKey: string]: T[] } = {}

  forEach(arr, (item) => {
    const currGroupKey = groupKeyFunc(item)
    const currGroupArr = result[currGroupKey]

    if (currGroupArr) {
      currGroupArr.push(item)
    } else {
      result[currGroupKey] = [item]
    }
  })

  return result
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
