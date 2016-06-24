import {AstNode, NIL} from "../../src/pudu/ast"
import {
    SemanticCheck,
    ISemanticIssue, INFO, Severity, ERROR, WARNING, WEAK_WARNING, performSemanticChecks
} from "../../src/pudu/semantics"
import {expect} from "chai"

export class B extends AstNode {
    constructor(public str:string, _parent:AstNode = NIL) {
        super(_parent)
    }
}

import * as _ from "lodash"

export class B1 extends B {}

export class B2 extends B {}

describe("The pudu semantic checks capabilities", () => {

        let semanticCheck:SemanticCheck = function (node:B):ISemanticIssue[] {
            return [{
                message: "oops " + node.str,
                astNode: node
            }]
        }

        context("Severities", () => {

            it("can create an INFO severity semantic check", () => {
                let infoCheck = INFO(semanticCheck)
                let node = new B1("bamba")
                let result = infoCheck(node)

                expect(result).to.deep.equal([{
                    message:  "oops bamba",
                    astNode:  node,
                    severity: Severity.INFO
                }])
            })

            it("can create a WEAK_WARNING severity semantic check", () => {
                let infoCheck = WEAK_WARNING(semanticCheck)
                let node = new B1("bamba")
                let result = infoCheck(node)

                expect(result).to.deep.equal([{
                    message:  "oops bamba",
                    astNode:  node,
                    severity: Severity.WEAK_WARNING
                }])
            })

            it("can create a WARNING severity semantic check", () => {
                let infoCheck = WARNING(semanticCheck)
                let node = new B1("bamba")
                let result = infoCheck(node)

                expect(result).to.deep.equal([{
                    message:  "oops bamba",
                    astNode:  node,
                    severity: Severity.WARNING
                }])
            })

            it("can create an ERROR severity semantic check", () => {
                let infoCheck = ERROR(semanticCheck)
                let node = new B1("bamba")
                let result = infoCheck(node)

                expect(result).to.deep.equal([{
                    message:  "oops bamba",
                    astNode:  node,
                    severity: Severity.ERROR
                }])
            })
        })


        context("configurations and full flow", () => {

            let errorCheckA = ERROR((node:B) => {
                if (_.includes(node.str, "A")) {
                    return [{
                        message: "AAA",
                        astNode: node
                    }]
                }
                else {
                    return []
                }
            })

            let infoCheckB = INFO((node:B) => {
                if (_.includes(node.str, "B")) {
                    return [{
                        message: "BBB",
                        astNode: node
                    }]
                }
                else {
                    return []
                }
            })

            let warningCheckC = WARNING((node:B) => {
                if (_.includes(node.str, "C")) {
                    return [{
                        message: "CCC",
                        astNode: node
                    }]
                }
                else {
                    return []
                }
            })

            it("can perform an empty set of semantic checks without error", () => {
                let emptyChecksConfig = []
                let node = new B1("bamba")
                let result = performSemanticChecks([node], emptyChecksConfig)
                expect(result).to.be.empty
            })

            it("can perform an set of semantic checks with different severities and for different types", () => {
                let checksConfig = [
                    {
                        clazz:  B,
                        checks: [errorCheckA]
                    },
                    {
                        clazz:  B2,
                        checks: [infoCheckB, warningCheckC]
                    }
                ]
                let b = new B("ABC") // expected one error only
                let b1 = new B1("ABC") // expected one error only
                let b2 = new B2("ABC") // expected error, info and warning
                let goodB = new B2("GOOD!") // expected no issues

                let result = performSemanticChecks([b, b1, b2, goodB], checksConfig)
                expect(result).to.have.lengthOf(5)
                expect(result).to.deep.include.members([
                    {
                        message:  "AAA",
                        astNode:  b,
                        severity: Severity.ERROR
                    },
                    {
                        message:  "AAA",
                        astNode:  b1,
                        severity: Severity.ERROR
                    },
                    {
                        message:  "AAA",
                        astNode:  b2,
                        severity: Severity.ERROR
                    },
                    {
                        message:  "BBB",
                        astNode:  b2,
                        severity: Severity.INFO
                    },
                    {
                        message:  "CCC",
                        astNode:  b2,
                        severity: Severity.WARNING
                    }

                ])
            })
        })
    }
)
