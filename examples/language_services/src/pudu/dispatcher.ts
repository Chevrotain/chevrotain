import {AstNode} from "./ast"
import * as utils from "./utils"
import * as _ from "lodash"
const HANDLE = "handle"

/**
 * Base Dispatcher interface, note it only specifies a single method.
 * This should not normally be implemented directly by consumers
 */
export interface IAstPatternDispatcher<IN, OUT> {
    dispatch(node:AstNode, param?:IN):OUT
}

/**
 * basic dispatching implementation.
 * Each type/class of AstNode has its own handler.
 * The default behavior of an handler is to delegate to the super class's handler
 *
 * The concern of Iteration over a Tree of AstNodes (visitor) is implemented on the AstNode (accept method)
 * This class only handles the concern of dispatching for a SINGLE AstNode.
 */
export abstract class BaseBySuperTypeDispatcher<IN, OUT> implements IAstPatternDispatcher<IN, OUT> {

    protected performedInstanceValidations = false

    /**
     * @param node - The AstNode to dispatch to some handler function
     *        note that this only perform dispatching for this SINGLE node.
     *        No handling of a Node's children here. (see accept method on AstNode for that)
     * @param param generic parameter, will be passed along all the handlers
     */
    dispatch(node:AstNode, param?:IN):OUT {
        // perform validation of extending strategies, but only ONCE
        if (!this.performedInstanceValidations) {
            this.validateDispatcherInstance()
            this.performedInstanceValidations = true
        }

        let nodeClassName = utils.getClassNameFromInstance(node)
        let handlerName = HANDLE + nodeClassName
        let specificHandleMethod = this[handlerName]
        if (!_.isFunction(specificHandleMethod)) {
            throw Error("missing handler impel: " + handlerName)
        }
        return specificHandleMethod.call(this, node, param, (<any>node).constructor)
    }

    /**
     * same as dispatch only in this method we invoke the handler for a Node's ->superclass<-
     */
    protected dispatchAsSuperClass(node:any, param:IN, currClass:any):OUT {
        let superClass = utils.getSuperClass(currClass)
        let superClassName = utils.functionName(superClass)
        let handlerName = HANDLE + superClassName
        let specificHandleMethod = this[handlerName]
        if (!_.isFunction(specificHandleMethod)) {
            throw Error("missing super handler impel: " + handlerName + " for node")
        }
        return specificHandleMethod.call(this, node, param, superClass)
    }

    handleAstNode(node:AstNode, param?:IN):OUT {
        // end of the line, no more superclass handlers to invoke
        return undefined
    }

    /**
     * Will return an instance of a BaseDispatcher for a specific Ast node's hierarchy
     * 'against' which validations will be performed.
     *
     * for example : invalid overrides for handle methods...
     *
     * This should be implemented in each root dispatcher
     */
    protected abstract getBaseDispatcherInstance():IAstPatternDispatcher<IN, OUT>

    protected getBaseDispatcherHandleMethodNames():string[] {
        let baseDispatcherInstance = this.getBaseDispatcherInstance()
        // keysIn also returns the inherited properties, these are needed
        // as the baseDispatcher for a specific Ast (DTS/JSON/...
        // may not (and probably is not) the root in the whole dispatcher class hierarchy
        let baseDispatcherProps = _.keysIn(baseDispatcherInstance)
        return _.filter(baseDispatcherProps, (prop) => {
            return prop.substr(0, HANDLE.length) === HANDLE
        })
    }

    protected validateDispatcherInstance():void {
        let baseDispatcherMethods = this.getBaseDispatcherHandleMethodNames()
        let currentDispatcherProps = _.keys(Object.getPrototypeOf(this))
        let currDispatcherMethods = _.filter(currentDispatcherProps, (prop) => {
            return prop.substr(0, HANDLE.length) === HANDLE
        })

        let invalidHandleOverrides = _.difference(currDispatcherMethods, baseDispatcherMethods)
        if (!_.isEmpty(invalidHandleOverrides)) {
            throw Error("invalid overrides handle methods in class: " + utils.getClassNameFromInstance(this) +
                " method names: \n" + invalidHandleOverrides.join("\n"))
        }
    }

    /**
     * Must be implemented in dispatcher subclasses.
     * As this information is needed to perform runtime validations on the base dispatchers.
     * For example: missing 'handle' methods or redundant 'handle' methods.
     *
     * This should preferably be implemented in a dynamic manner (not as a hardcoded list)
     * @see findClassNamesThatNeedDispatcherImpel -  a utility to extract class names from
     *      a javascript namespace that may be usefull for this purpose
     *
     * @returns a list of constructor names for classes that are supported by this dispatcher
     */
    protected getSupportedClassNames():string[] {
        // TODO: avoid hardcoded values
        return [utils.functionName(AstNode)]
    }
}

/**
 * A utility used in extracting the data to perform a baseDispatcher's validations
 *
 * @param ns - a javascript object on which the AstNode class hierarchy is defined.
 *
 * @returns {string[]} - names of the classes in the hierarchy.
 */
export function findClassNamesThatNeedDispatcherImpel(ns:Object):string[] {
    let classNamesThatNeedDispatcherImpel = [utils.functionName(AstNode)]
    let astNodeProto = AstNode.prototype
    _.forOwn(ns, (possibleConstructor) => {
        if (_.isFunction(possibleConstructor) &&
            astNodeProto.isPrototypeOf(possibleConstructor.prototype)) {
            classNamesThatNeedDispatcherImpel.push(possibleConstructor.name)
        }
    })
    return classNamesThatNeedDispatcherImpel
}

/**
 * A utility used in extracting the data to perform a baseDispatcher's validations
 *
 * @param dispatcher - The instance from which to extract the handler method names.
 *
 * @returns {string[]} - The list of handler method names ([handleXXX, handleYYY, ...])
 *                       which exists on the dispatcher instance.
 */
export function findHandleMethodsOnDispatcher<IN, OUT>(dispatcher:IAstPatternDispatcher<IN, OUT>):string[] {
    let baseDispatcherProps = _.keysIn(Object.getPrototypeOf(dispatcher))
    return _.filter(baseDispatcherProps, (prop) => {
        return prop.substr(0, HANDLE.length) === HANDLE
    })
}

/**
 * A utility that checks a BaseDispatcher's implementation at runtime.
 * This should normally be invoked from the constructor of a BaseDispatcher.
 *
 * @param classesForWhichHandlersMustExist
 * @param actualImplementedHandleMethods
 *
 * @throws an Error if an issue has been detected.
 */
export function validateBaseDispatcher(classesForWhichHandlersMustExist:string[], actualImplementedHandleMethods:string[]):void {
    let actualImplementedClassNames = _.map(actualImplementedHandleMethods, (methodName) => {
        return methodName.substr(HANDLE.length)
    })

    let redundantHandleImpel = _.difference(actualImplementedClassNames, classesForWhichHandlersMustExist)
    let missingHandleImpel = _.difference(classesForWhichHandlersMustExist, actualImplementedClassNames)

    if (redundantHandleImpel.length > 0) {
        throw Error("redundant handler impel methods in BaseDispatcher: " + redundantHandleImpel.join(" &\n "))
    }

    if (missingHandleImpel.length > 0) {
        throw Error("Missing handler impel methods in BaseDispatcher: " + missingHandleImpel.join(" &\n "))
    }
}

