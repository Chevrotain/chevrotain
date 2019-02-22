import { TokenType } from "../../api";
export declare function classNameFromInstance(instance: any): string;
export declare function functionName(func: TokenType): string;
/**
 * @returns {boolean} - has the property been successfully defined
 */
export declare function defineNameProp(obj: any, nameValue: any): boolean;
/**
 * simple Hashtable between a string and some generic value
 * this should be removed once typescript supports ES6 style Hashtable
 */
export declare class HashTable<V> {
    private _state;
    keys(): string[];
    values(): V[];
    put(key: string | number, value: V): void;
    putAll(other: HashTable<V>): void;
    get(key: string): V;
    containsKey(key: string): boolean;
    clear(): void;
}
