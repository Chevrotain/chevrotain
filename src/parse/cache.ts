/// <reference path="grammar/interpreter.ts" />

/**
 *  Module used to cache static information about parsers,
 */
module chevrotain.cache {


    export var CLASS_TO_SELF_ANALYSIS_DONE = new lang.HashTable<boolean>()

    export var CLASS_TO_GRAMMAR_PRODUCTIONS = new lang.HashTable<lang.HashTable<gast.TOP_LEVEL>>()

    export function getProductionsForClass(classInstance:any):lang.HashTable<gast.TOP_LEVEL> {
        return getFromNestedHashTable(classInstance, CLASS_TO_GRAMMAR_PRODUCTIONS)
    }

    export var CLASS_TO_RESYNC_FOLLOW_SETS = new lang.HashTable<lang.HashTable<Function[]>>()

    export function getResyncFollowsForClass(classInstance:any):lang.HashTable<Function[]> {
        return getFromNestedHashTable(classInstance, CLASS_TO_RESYNC_FOLLOW_SETS)
    }

    export function setResyncFollowsForClass(classInstance:any, followSet:lang.HashTable<Function[]>):void {
        var className = lang.classNameFromInstance(classInstance)
        CLASS_TO_RESYNC_FOLLOW_SETS.put(className, followSet)
    }

    export var CLASS_TO_LOOKAHEAD_FUNCS = new lang.HashTable<lang.HashTable<Function>>()

    export function getLookaheadFuncsForClass(classInstance:any):lang.HashTable<Function> {
        return getFromNestedHashTable(classInstance, CLASS_TO_LOOKAHEAD_FUNCS)
    }

    export var CLASS_TO_FIRST_AFTER_REPETITION = new lang.HashTable<lang.HashTable<interpreter.IFirstAfterRepetition>>()

    export function getFirstAfterRepForClass(classInstance:any):lang.HashTable<interpreter.IFirstAfterRepetition> {
        return getFromNestedHashTable(classInstance, CLASS_TO_FIRST_AFTER_REPETITION)
    }

    function getFromNestedHashTable(classInstance:any, hashTable:lang.HashTable<any>) {
        var className = lang.classNameFromInstance(classInstance)
        if (!hashTable.containsKey(className)) {
            hashTable.put(className, new lang.HashTable<any>())
        }
        return hashTable.get(className)
    }
}
