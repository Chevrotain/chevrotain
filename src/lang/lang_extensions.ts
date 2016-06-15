import * as utils from "../utils/utils"
import {isUndefined} from "../utils/utils"

export function classNameFromInstance(instance:any):string {
    return functionName(instance.constructor)
}

const FUNC_NAME_REGEXP = /^\s*function\s*(\S*)\s*\(/
const NAME = "name"
export const SPECIAL_NAME_CACHE_KEY = "CHEV_FUNC_NAME_CACHE666"

/**
 * Will Modify the func argument and define a 'name' property if none exists.
 */
/* istanbul ignore next too many hacks for IE/old versions of node.js here*/
export function functionName(func:Function):string {

    // Engines that support Function.prototype.name OR the nth (n>1) time after
    // the name has been computed in the following else block.
    let existingNameProp = (<any>func).name
    if (existingNameProp) {
        return existingNameProp
    }

    // hack for IE and engines that do not support Object.defineProperty on function.name (Node.js 0.10 && 0.12)
    let existingSpecialCacheNameProp = func[SPECIAL_NAME_CACHE_KEY]
    if (existingSpecialCacheNameProp) {
        return existingSpecialCacheNameProp
    }

    let computedName = func.toString().match(FUNC_NAME_REGEXP)[1]

    if (!defineNameProp(func, computedName)) {
        func[SPECIAL_NAME_CACHE_KEY] = computedName
    }
    return computedName
}

/**
 * @returns {boolean} - has the property been successfully defined
 */
export function defineNameProp(obj, nameValue):boolean {
    let namePropDescriptor = Object.getOwnPropertyDescriptor(obj, NAME)
    /* istanbul ignore else -> will only run in old versions of node.js */
    if (isUndefined(namePropDescriptor) ||
        namePropDescriptor.configurable) {
        Object.defineProperty(obj, NAME, {
            enumerable:   false,
            configurable: true,
            writable:     false,
            value:        nameValue
        })

        return true
    }
    /* istanbul ignore next -> will only run in old versions of node.js */
    return false
}

/**
 * simple Hashtable between a string and some generic value
 * this should be removed once typescript supports ES6 style Hashtable
 */
export class HashTable<V> {

    private _state = {}

    keys():string[] {
        return utils.keys(this._state)
    }

    values():V[] {
        return <any>utils.values(this._state)
    }

    put(key:string, value:V):void {
        this._state[key] = value
    }

    putAll(other:HashTable<V>):void {
        this._state = utils.assign(this._state, other._state)
    }

    get(key:string):V {
        // To avoid edge case with a key called "hasOwnProperty" we need to perform the commented out check below
        // -> if (Object.prototype.hasOwnProperty.call(this._state, key)) { ... } <-
        // however this costs nearly 25% of the parser's runtime.
        // if someone decides to name their Parser class "hasOwnProperty" they deserve what they will get :)
        return this._state[key]
    }

    containsKey(key:string):boolean {
        return utils.has(this._state, key)
    }

    clear():void {
        this._state = {}
    }
}

