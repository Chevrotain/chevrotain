import {AstNode, NIL} from "../../src/pudu/ast"
import {
    BaseBySuperTypeDispatcher,
    findHandleMethodsOnDispatcher,
    validateBaseDispatcher,
    findClassNamesThatNeedDispatcherImpel,
    IAstPatternDispatcher
} from "../../src/pudu/dispatcher"
import {expect} from "chai"


export class A extends AstNode {
    constructor(public b:B, public c:C, _parent:AstNode = NIL) {
        super(_parent)
    }
}

export abstract class B extends AstNode {}

export class B1 extends B {}
export class B2 extends B {}
export class B3 extends B {}

export class C extends AstNode {
    constructor(public d:D, _parent:AstNode = NIL) {
        super(_parent)
    }
}

export class D extends AstNode {}

class BaseDummyDispatcher<IN, OUT> extends BaseBySuperTypeDispatcher<IN, OUT> {

    private static performedBaseValidations = false

    constructor() {
        super()
        if (!BaseDummyDispatcher.performedBaseValidations) {
            BaseDummyDispatcher.performedBaseValidations = true
            // don't worry the static flag prevents infinite recursion
            let baseDispatcher = new BaseDummyDispatcher()
            let actualHandlerMethods = findHandleMethodsOnDispatcher(baseDispatcher)
            let classesThatNeedHandlers = this.getSupportedClassNames()
            validateBaseDispatcher(classesThatNeedHandlers, actualHandlerMethods)
        }
    }

    getSupportedClassNames():string[] {
        return findClassNamesThatNeedDispatcherImpel([A, B, C, D, B1, B2, B3]).concat(
            super.getSupportedClassNames()
        )
    }

    getBaseDispatcherInstance():IAstPatternDispatcher<IN, OUT> {
        return new BaseDummyDispatcher<IN, OUT>()
    }

    handleA(node:A, param?:IN, currClass?):OUT {
        return this.dispatchAsSuperClass(node, param, currClass)
    }

    handleB(node:A, param?:IN, currClass?):OUT {
        return this.dispatchAsSuperClass(node, param, currClass)
    }

    handleB1(node:A, param?:IN, currClass?):OUT {
        return this.dispatchAsSuperClass(node, param, currClass)
    }

    handleB2(node:A, param?:IN, currClass?):OUT {
        return this.dispatchAsSuperClass(node, param, currClass)
    }

    handleB3(node:A, param?:IN, currClass?):OUT {
        return this.dispatchAsSuperClass(node, param, currClass)
    }

    handleC(node:A, param?:IN, currClass?):OUT {
        return this.dispatchAsSuperClass(node, param, currClass)
    }

    handleD(node:A, param?:IN, currClass?):OUT {
        return this.dispatchAsSuperClass(node, param, currClass)
    }
}

describe("The dispatcher for pudu capabilities", () => {

    it("can dispatch according to a type", () => {
        let d_dispathcer = class extends BaseDummyDispatcher<void, string> {
            handleD(node:D):string {
                return "yey"
            }
        }

        let dispatcher = new d_dispathcer()
        let b1_node = new B1()
        expect(dispatcher.dispatch(b1_node)).to.be.undefined

        let d_node = new D()
        expect(dispatcher.dispatch(d_node)).to.equal("yey")
    })

    it("can dispatch according to a superType", () => {
        let b_dispathcer = class extends BaseDummyDispatcher<void, string> {
            handleB(node:B):string {
                return "yey"
            }
        }

        let dispatcher = new b_dispathcer()
        let d_node = new D()
        expect(dispatcher.dispatch(d_node)).to.be.undefined

        let b2_node = new B2()
        expect(dispatcher.dispatch(b2_node)).to.equal("yey")

        let b3_node = new B3()
        expect(dispatcher.dispatch(b3_node)).to.equal("yey")
    })

    it("will dispatch according to multiTypes", () => {
        let multiDispatcher = class extends BaseDummyDispatcher<void, string> {
            handleB1(node:B1):string {
                return "yey1"
            }

            handleB2(node:B2):string {
                return "yey2"
            }

            handleAstNode(node:AstNode):string {
                return "ney"
            }
        }

        let dispatcher = new multiDispatcher()
        let d_node = new D()
        expect(dispatcher.dispatch(d_node)).to.equal("ney")

        let b1_node = new B1()
        expect(dispatcher.dispatch(b1_node)).to.equal("yey1")

        let b2_node = new B2()
        expect(dispatcher.dispatch(b2_node)).to.equal("yey2")
    })

    it("will detect invalid overrides in dispatcher instances", () => {
        let multiDispatcher = class extends BaseDummyDispatcher<void, string> {
            handle_TYPO_B1(node:B1):string {
                return "yey1"
            }
        }

        let dispatcher = new multiDispatcher()
        let d_node = new D()
        expect(() => dispatcher.dispatch(d_node)).to.throw(/invalid(.|\n)*handle_TYPO_B1/)
    })

    it("will detect redundant handlers in BaseDispatchers", () => {
        let baseDispatcherProto = Object.getPrototypeOf(new BaseDummyDispatcher())
        baseDispatcherProto.handleBamba = function () {};
        (<any>BaseDummyDispatcher).performedBaseValidations = false
        expect(() => new BaseDummyDispatcher()).to.throw("redundant handler impel methods in BaseDispatcher: Bamba")
        delete baseDispatcherProto.handleBamba
    })

    it("will detect missing handlers in BaseDispatchers", () => {
        let baseDispatcherProto = Object.getPrototypeOf(new BaseDummyDispatcher())
        let handleB = baseDispatcherProto.handleB
        delete baseDispatcherProto.handleB;
        (<any>BaseDummyDispatcher).performedBaseValidations = false
        expect(() => new BaseDummyDispatcher()).to.throw("Missing handler impel methods in BaseDispatcher: B")
        baseDispatcherProto.handleB = handleB
    })
})
