export function has<T>(obj: T, prop: string | number): boolean {
  if (obj !== null && obj !== undefined) {
    return obj.hasOwnProperty(prop)
  }
  return false
}
