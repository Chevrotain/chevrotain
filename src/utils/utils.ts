/*
 Utils using lodash style API. (not necessarily 100% compliant) for functional and other utils.
 These utils should replace usage of lodash in the production code base. not because they are any better...
 but for the purpose of being a dependency free library.

 The hotspots in the code are already written in imperative style for performance reasons.
 so writing several dozen utils which may be slower than the original lodash, does not matter as much
 considering they will not be invoked in hotspots...
 */

namespace utils {

    export function isEmpty(arr:any[]):boolean {
        return arr.length === 0
    }

    export function keys(obj:any):string[] {
        return Object.keys(obj)
    }

    export function values(obj:any):any[] {
        let vals = []
        let keys = Object.keys(obj);
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
}
