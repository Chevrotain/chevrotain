/// <reference path="../../libs/lodash.d.ts" />

module chevrotain.lang {

    var nameRegex = /^\s*function\s*(\S*)\s*\(/
    /* istanbul ignore next */
    var hasNativeName = typeof (<any>(function f() {})).name !== "undefined"

    export function classNameFromInstance(instance:any):string {
        return functionName(instance.constructor)
    }

    /* istanbul ignore next too many hacks for IE here*/
    export function functionName(func:Function):string {
        if (hasNativeName) {
            return (<any>func).name
        }

        else if ((<any>func).rdtFuncNameCache666) {
            // super 'special' property name on INSTANCE to avoid hurting those who use browsers that
            // do not support name property even more (IE...)
            return (<any>func).rdtFuncNameCache666
        }
        /* istanbul ignore next */
        else {
            var name = func.toString().match(nameRegex)[1];
            (<any>func).rdtFuncNameCache666 = name
            return name
        }
    }

    /**
     * simple Hashtable between a string and some generic value
     * this should be removed once typescript supports ES6 style Hashtable
     */
    export class HashTable<V> {

        private _state = {}

        keys():string[] {
            return _.keys(this._state)
        }

        values():V[] {
            return _.values(this._state)
        }

        put(key:string, value:V):void {
            this._state[key] = value
        }

        putAll(other:HashTable<V>):void {
            this._state = _.assign(this._state, other._state)
        }

        get(key:string):V {
            // To avoid edge case with a key called "hasOwnProperty" we need to perform the commented out check below
            // -> if (Object.prototype.hasOwnProperty.call(this._state, key)) { ... } <-
            // however this costs nearly 25% of the parser's runtime.
            // if someone decides to name their Parser class "hasOwnProperty" they deserve what they will get :)
            return this._state[key]
        }

        containsKey(key:string):boolean {
            return _.has(this._state, key)
        }

    }

}



