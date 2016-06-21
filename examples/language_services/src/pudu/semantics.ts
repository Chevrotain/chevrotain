import {AstNode} from "./ast"
import * as _ from "lodash"


export enum Severity {INFO, WEAK_WARNING, WARNING, ERROR}

function wrapWithSeverity(severity:Severity, check:(node:AstNode) => ISemanticIssue[]):SemanticCheckWithSeverity {
    return function (node:AstNode):ISemanticIssueWithSeverity[] {
        let issues = check.call(null, node)

        return _.map(issues, (currIssue:ISemanticIssue) => {
            return {
                message:  currIssue.message,
                astNode:  currIssue.astNode,
                severity: severity
            }
        })
    }
}

export function INFO(check:(node:AstNode) => ISemanticIssue[]):SemanticCheckWithSeverity {
    return wrapWithSeverity(Severity.INFO, check)
}

export function WEAK_WARNING(check:(node:AstNode) => ISemanticIssue[]):SemanticCheckWithSeverity {
    return wrapWithSeverity(Severity.WEAK_WARNING, check)
}

export function WARNING(check:(node:AstNode) => ISemanticIssue[]):SemanticCheckWithSeverity {
    return wrapWithSeverity(Severity.WARNING, check)
}

export function ERROR(check:(node:AstNode) => ISemanticIssue[]):SemanticCheckWithSeverity {
    return wrapWithSeverity(Severity.ERROR, check)
}

export type SemanticCheck = (node:AstNode) => ISemanticIssue[]
export type SemanticCheckWithSeverity = (node:AstNode) => ISemanticIssueWithSeverity[]

/**
 * Someone implementing a semantic check must create a function that returns this interface.
 * Note that this does not define the severity, the severity is defined separately from the logic of the semantic check.
 * As those are two different concerns (how to perform the semantic check / How severe/important it is)
 */
export interface ISemanticIssue {
    message:string,
    astNode:AstNode
}

export interface ISemanticIssueWithSeverity extends ISemanticIssue {
    severity:Severity
}

export interface ISemanticChecksForClazz {
    clazz:Function,
    // TODO : ISemanticIssueWithSeverity[] | ISemanticIssueWithSeverity so semanticChecks implementors can be idiot proof?
    checks:((node:AstNode) => ISemanticIssueWithSeverity[])[]
}

export type ISemanticCheckConfig = ISemanticChecksForClazz[]

export function performSemanticChecks(nodes:AstNode[], checksToPerform:ISemanticCheckConfig):ISemanticIssueWithSeverity[] {

    let issues:ISemanticIssueWithSeverity[] = _.reduce(nodes, (allIssues:ISemanticIssueWithSeverity[], currNode) => {
        let configsForCurrNode = _.filter(checksToPerform, (currCheckConfig) => currNode instanceof currCheckConfig.clazz)
        let checks = _.flatten(_.map(configsForCurrNode, (currConfig) => currConfig.checks))

        let currIssues = _.flatten(_.map(checks, (currCheck) => currCheck.call(null, currNode)))

        allIssues = allIssues.concat(currIssues)
        return allIssues
    }, [])

    // compacting just in case a semantic check was not implemented correctly and did not return an empty array
    // in case no issues were found.
    return _.compact(issues)
}
