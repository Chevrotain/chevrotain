import { TokenType } from "../../api"
import { isUndefined } from "../utils/utils"

export function classNameFromInstance(instance: any): string {
  return functionName(instance.constructor)
}

const FUNC_NAME_REGEXP = /^\s*function\s*(\S*)\s*\(/
const NAME = "name"

/* istanbul ignore next too many hacks for IE/old versions of node.js here*/
export function functionName(func: TokenType): string {
  // Engines that support Function.prototype.name OR the nth (n>1) time after
  // the name has been computed in the following else block.
  let existingNameProp = (<any>func).name
  if (existingNameProp) {
    return existingNameProp
  }

  // hack for IE and engines that do not support Object.defineProperty on function.name (Node.js 0.10 && 0.12)
  let computedName = func.toString().match(FUNC_NAME_REGEXP)[1]

  return computedName
}

/**
 * @returns {boolean} - has the property been successfully defined
 */
export function defineNameProp(obj, nameValue): boolean {
  let namePropDescriptor = Object.getOwnPropertyDescriptor(obj, NAME)
  /* istanbul ignore else -> will only run in old versions of node.js */
  if (isUndefined(namePropDescriptor) || namePropDescriptor.configurable) {
    Object.defineProperty(obj, NAME, {
      enumerable: false,
      configurable: true,
      writable: false,
      value: nameValue
    })

    return true
  }
  /* istanbul ignore next -> will only run in old versions of node.js */
  return false
}
