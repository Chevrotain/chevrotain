module chevrotain.typescript.lang.extensions {

    export function startsWith(src, target):boolean {
        return src.slice(0, target.length) === target;
    }

    var nameRegex = /^\s*function\s*(\S*)\s*\(/;
    var hasNativeName = typeof (<any>(function f() {})).name !== "undefined";

    export function classNameFromInstance(instance:any):string {
        return functionName(instance.constructor);
    }

    export function functionName(func:Function):string {
        if (hasNativeName) {
            return (<any>func).name;
        }
        else if ((<any>func).rdtFuncNameCache666) {
            // super 'special' property name on INSTANCE to avoid hurting those who use browsers that
            // do not support name property even more (IE...)
            return (<any>func).rdtFuncNameCache666;
        }
        else {
            var name = func.toString().match(nameRegex)[1];
            (<any>func).rdtFuncNameCache666 = name;
            return name;
        }
    }

    export function applyMixin(derivedCtor, baseCtor) {
        Object.keys(baseCtor.prototype).forEach(name => {
            // keys should not return "constructor" but just in case :)
            if (name !== "constructor") {
                // must use getOwnPropertyDescriptor to mixin the ES5 properties defined with Object.defineProperty
                var basePropDescriptor = Object.getOwnPropertyDescriptor(baseCtor.prototype, name);
                Object.defineProperty(derivedCtor.prototype, name, basePropDescriptor);
            }
        });
    }

}



