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
