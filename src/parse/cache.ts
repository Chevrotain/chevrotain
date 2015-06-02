/// <reference path="grammar/interpreter.ts" />

/**
 *  Module used to cache static information about parsers,
 */
module chevrotain.cache {


    export var CLASS_TO_SELF_ANALYSIS_DONE = new lang.HashTable<boolean>()

    export var CLASS_TO_GRAMMAR_PRODUCTIONS = new lang.HashTable<lang.HashTable<gast.TOP_LEVEL>>()

    export function getProductionsForClass(className:string):lang.HashTable<gast.TOP_LEVEL> {
        return getFromNestedHashTable(className, CLASS_TO_GRAMMAR_PRODUCTIONS)
    }

    export var CLASS_TO_RESYNC_FOLLOW_SETS = new lang.HashTable<lang.HashTable<Function[]>>()

    export function getResyncFollowsForClass(className:string):lang.HashTable<Function[]> {
        return getFromNestedHashTable(className, CLASS_TO_RESYNC_FOLLOW_SETS)
    }

    export function setResyncFollowsForClass(className:string, followSet:lang.HashTable<Function[]>):void {
        CLASS_TO_RESYNC_FOLLOW_SETS.put(className, followSet)
    }

    export var CLASS_TO_LOOKAHEAD_FUNCS = new lang.HashTable<lang.HashTable<Function>>()

    export function getLookaheadFuncsForClass(className:string):lang.HashTable<Function> {
        return getFromNestedHashTable(className, CLASS_TO_LOOKAHEAD_FUNCS)
    }

    export var CLASS_TO_FIRST_AFTER_REPETITION = new lang.HashTable<lang.HashTable<interpreter.IFirstAfterRepetition>>()

    export function getFirstAfterRepForClass(className:string):lang.HashTable<interpreter.IFirstAfterRepetition> {
        return getFromNestedHashTable(className, CLASS_TO_FIRST_AFTER_REPETITION)
    }

    function getFromNestedHashTable(className:string, hashTable:lang.HashTable<any>) {
        var result = hashTable.get(className)
        if (result === undefined) {
            hashTable.put(className, new lang.HashTable<any>())
            result = hashTable.get(className)
        }
        return result
    }
}
