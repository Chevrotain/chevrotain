/**
 * module used to cache static information about parsers,
 */

import { HashTable } from "../lang/lang_extensions"
import { IFirstAfterRepetition } from "./grammar/interpreter"
import { filter, forEach, values } from "../utils/utils"
import { Rule } from "./grammar/gast/gast_public"
import { IParserDefinitionError, TokenType } from "../../api"

export const CLASS_TO_DEFINITION_ERRORS = new HashTable<
    IParserDefinitionError[]
>()

export const CLASS_TO_SELF_ANALYSIS_DONE = new HashTable<boolean>()
export const CLASS_TO_CONSTRUCTOR = new HashTable<Function>()

export const CLASS_TO_GRAMMAR_PRODUCTIONS = new HashTable<HashTable<Rule>>()

export function getProductionsForClass(className: string): HashTable<Rule> {
    return getFromNestedHashTable(className, CLASS_TO_GRAMMAR_PRODUCTIONS)
}

export const CLASS_TO_RESYNC_FOLLOW_SETS = new HashTable<
    HashTable<TokenType[]>
>()

export function getResyncFollowsForClass(
    className: string
): HashTable<TokenType[]> {
    return getFromNestedHashTable(className, CLASS_TO_RESYNC_FOLLOW_SETS)
}

export function setResyncFollowsForClass(
    className: string,
    followSet: HashTable<TokenType[]>
): void {
    CLASS_TO_RESYNC_FOLLOW_SETS.put(className, followSet)
}

export const CLASS_TO_LOOKAHEAD_FUNCS = new HashTable<HashTable<Function>>()

export function getLookaheadFuncsForClass(className: string): Function[] {
    return getArrFromHashTable(className, CLASS_TO_LOOKAHEAD_FUNCS)
}

export const CLASS_TO_FIRST_AFTER_REPETITION = new HashTable<
    HashTable<IFirstAfterRepetition>
>()

export function getFirstAfterRepForClass(
    className: string
): HashTable<IFirstAfterRepetition> {
    return getFromNestedHashTable(className, CLASS_TO_FIRST_AFTER_REPETITION)
}

export const CLASS_TO_PRODUCTION_OVERRIDEN = new HashTable<HashTable<boolean>>()

export function getProductionOverriddenForClass(
    className: string
): HashTable<boolean> {
    return getFromNestedHashTable(className, CLASS_TO_PRODUCTION_OVERRIDEN)
}

export const CLASS_TO_BASE_CST_VISITOR = new HashTable<Function>()
export const CLASS_TO_BASE_CST_VISITOR_WITH_DEFAULTS = new HashTable<Function>()
export const CLASS_TO_ALL_RULE_NAMES = new HashTable<string[]>()

function getFromNestedHashTable(className: string, hashTable: HashTable<any>) {
    let result = hashTable.get(className)
    if (result === undefined) {
        hashTable.put(className, new HashTable<any>())
        result = hashTable.get(className)
    }
    return result
}

function getArrFromHashTable(className: string, hashTable: HashTable<any>) {
    let result = hashTable.get(className)
    if (result === undefined) {
        hashTable.put(className, [])
        result = hashTable.get(className)
    }
    return result
}

export function clearCache(): void {
    const hasTables = filter(
        values(module.exports),
        currHashTable => currHashTable instanceof HashTable
    )
    forEach(hasTables, currHashTable => currHashTable.clear())
}
