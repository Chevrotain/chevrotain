/*
 Utils using lodash style API. (not necessarily 100% compliant) for functional and other utils.
 These utils should replace usage of lodash in the production code base. not because they are any better...
 but for the purpose of being a dependency free library.

 The hotspots in the code are already written in imperative style for performance reasons.
 so writing several dozen utils which may be slower than the original lodash, does not matter as much
 considering they will not be invoked in hotspots...
 */

namespace chevrotain.utils {

    export function isEmpty(arr:any[]):boolean {
        return arr && arr.length === 0
    }

    export function keys(obj:any):string[] {
        return Object.keys(obj)
    }

    export function values(obj:any):any[] {
        let vals = []
        let keys = Object.keys(obj)
        for (let i = 0; i < keys.length; i++) {
            vals.push(obj[keys[i]])
        }
        return vals
    }

    export function map<I, O>(arr:I[], callback:(I, idx?:number) => O):O[] {
        let result:O[] = []
        for (let idx = 0; idx < arr.length; idx++) {
            result.push(callback.call(null, arr[idx], idx))
        }
        return result
    }

    export function flatten<T>(arr:any[]):T[] {
        let result = []

        for (let idx = 0; idx < arr.length; idx++) {
            let currItem = arr[idx]
            if (Array.isArray(currItem)) {
                result = result.concat(flatten(currItem))
            }
            else {
                result.push(currItem)
            }
        }
        return result
    }

    export function first<T>(arr:T[]):T {
        return isEmpty(arr) ? undefined : arr[0]
    }

    export function last<T>(arr:T[]):T {
        let len = arr && arr.length
        return len ? arr[len - 1] : undefined
    }

    export function forEach(arr:any[], iteratorCallback:Function):void {
        if (Array.isArray(arr)) {
            for (let i = 0; i < arr.length; i++) {
                iteratorCallback.call(null, arr[i], i)
            }
        }
    }

    export function isString(item:any):boolean {
        return typeof item === "string"
    }

    export function isUndefined(item:any):boolean {
        return item === undefined
    }

    export function isFunction(item:any):boolean {
        return item instanceof Function
    }

    export function drop<T>(arr:T[], howMuch:number = 1):T[] {
        return arr.slice(howMuch, arr.length)
    }

    export function dropRight<T>(arr:T[], howMuch:number = 1):T[] {
        return arr.slice(0, arr.length - howMuch)
    }

    export function filter<T>(arr:T[], predicate:(T) => boolean):T[] {
        let result = []
        if (Array.isArray(arr)) {
            for (let i = 0; i < arr.length; i++) {
                let item = arr[i]
                if (predicate.call(null, item)) {
                    result.push(item)
                }
            }
        }
        return result
    }

    export function reject<T>(arr:T[], predicate:(T) => boolean):T[] {
        return filter(arr, (item) => !predicate(item))
    }

    export function pick(obj:Object, predicate:(item) => boolean) {
        let keys = Object.keys(obj)
        let result = {}

        for (let i = 0; i < keys.length; i++) {
            let currKey = keys[i]
            let currItem = obj[currKey]
            if (predicate(currItem)) {
                result[currKey] = currItem
            }
        }

        return result
    }

    export function has(obj:any, prop:string):boolean {
        return obj.hasOwnProperty(prop)
    }

    export function contains<T>(arr:T[], item):boolean {
        return find(arr, (currItem) => currItem === item) ? true : false
    }

    /**
     * shallow clone
     */
    export function cloneArr<T>(arr:T[]):T[] {
        return map(arr, (item) => item)
    }

    /**
     * shallow clone
     */
    export function cloneObj(obj:Object):any {
        let clonedObj = {}
        for (let key in obj) {
            /* istanbul ignore else */
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                clonedObj[key] = obj[key]
            }
        }
        return clonedObj
    }

    export function find<T>(arr:T[], predicate:(item:T) => boolean):T {
        for (let i = 0; i < arr.length; i++) {
            let item = arr[i]
            if (predicate.call(null, item)) {
                return item
            }
        }
        return undefined
    }

    export function reduce<T, A>(arrOrObj:Array<T>|Object, iterator:(result:A, item) => A, initial:A):A {
        let vals = Array.isArray(arrOrObj) ? arrOrObj : values(arrOrObj)

        let accumulator = initial
        for (let i = 0; i < vals.length; i++) {
            accumulator = iterator.call(null, accumulator, vals[i])
        }
        return accumulator
    }

    export function compact<T>(arr:T[]):T[] {
        return reject(arr, (item) => item === null || item === undefined)
    }

    export function uniq<T>(arr:T[], identity:(item:T) => any = (item) => item):T[] {
        let identities = []
        return reduce(arr, (result, currItem) => {
            let currIdentity = identity(currItem)
            if (contains(identities, currIdentity)) {
                return result
            }
            else {
                identities.push(currIdentity)
                return result.concat(currItem)
            }
        }, [])
    }

    export function partial(func:Function, ...restArgs:any[]):Function {
        let firstArg = [null]
        let allArgs = firstArg.concat(restArgs)
        return Function.bind.apply(func, allArgs)
    }

    export function isArray(obj:any):boolean {
        return Array.isArray(obj)
    }

    export function isRegExp(obj:any):boolean {
        return obj instanceof RegExp
    }

    export function isObject(obj:any):boolean {
        return obj instanceof Object
    }

    export function every<T>(arr:T[], predicate:(item:T) => boolean):boolean {
        for (let i = 0; i < arr.length; i++) {
            if (!predicate(arr[i])) {
                return false
            }
        }
        return true
    }

    export function difference<T>(arr:T[], values:T[]):T[] {
        return reject(arr, (item) => contains(values, item))
    }

    export function some<T>(arr:T[], predicate:(item:T) => boolean):boolean {
        for (let i = 0; i < arr.length; i++) {
            if (predicate(arr[i])) {
                return true
            }
        }
        return false
    }

    export function indexOf<T>(arr:T[], value:T):number {
        for (let i = 0; i < arr.length; i++) {
            if (arr[i] === value) {
                return i
            }
        }
        return -1
    }

    export function sortBy<T>(arr:T[], orderFunc:(item:T) => number):T[] {
        let result = cloneArr(arr)
        result.sort((a, b) => orderFunc(a) - orderFunc(b))
        return result
    }
}
