export function getClassNameFromInstance(instance:any):string {
    return functionName((<any>instance).constructor)
}

const NAME_REGEXP = /^\s*function\s*(\S*)\s*\(/
const HAS_NATIVE_NAME = typeof (<any>(function f() {})).name !== "undefined"

export function functionName(func:Function):string {
    if (HAS_NATIVE_NAME) {
        return (<any>func).name
    }
    else if ((<any>func).puduFuncNameCache) {
        // super 'special' property name on INSTANCE to avoid hurting those who use browsers that
        // do not support name property even more (IE...)
        return (<any>func).puduFuncNameCache
    }
    else {
        let name = func.toString().match(NAME_REGEXP)[1];
        (<any>func).puduFuncNameCache = name
        return name
    }
}

export function getSuperClass(clazz:any):any {
    return Object.getPrototypeOf(clazz.prototype).constructor
}
