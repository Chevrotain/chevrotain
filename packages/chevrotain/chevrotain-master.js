/*! chevrotain - v4.8.1 */
;(function webpackUniversalModuleDefinition(root, factory) {
    if (typeof exports === "object" && typeof module === "object")
        module.exports = factory()
    else if (typeof define === "function" && define.amd)
        define("chevrotain", [], factory)
    else if (typeof exports === "object") exports["chevrotain"] = factory()
    else root["chevrotain"] = factory()
})(typeof self !== "undefined" ? self : this, function() {
    return /******/ (function(modules) {
        // webpackBootstrap
        /******/ // The module cache
        /******/ var installedModules = {} // The require function
        /******/
        /******/ /******/ function __webpack_require__(moduleId) {
            /******/
            /******/ // Check if module is in cache
            /******/ if (installedModules[moduleId]) {
                /******/ return installedModules[moduleId].exports
                /******/
            } // Create a new module (and put it into the cache)
            /******/ /******/ var module = (installedModules[moduleId] = {
                /******/ i: moduleId,
                /******/ l: false,
                /******/ exports: {}
                /******/
            }) // Execute the module function
            /******/
            /******/ /******/ modules[moduleId].call(
                module.exports,
                module,
                module.exports,
                __webpack_require__
            ) // Flag the module as loaded
            /******/
            /******/ /******/ module.l = true // Return the exports of the module
            /******/
            /******/ /******/ return module.exports
            /******/
        } // expose the modules object (__webpack_modules__)
        /******/
        /******/
        /******/ /******/ __webpack_require__.m = modules // expose the module cache
        /******/
        /******/ /******/ __webpack_require__.c = installedModules // define getter function for harmony exports
        /******/
        /******/ /******/ __webpack_require__.d = function(
            exports,
            name,
            getter
        ) {
            /******/ if (!__webpack_require__.o(exports, name)) {
                /******/ Object.defineProperty(exports, name, {
                    enumerable: true,
                    get: getter
                })
                /******/
            }
            /******/
        } // define __esModule on exports
        /******/
        /******/ /******/ __webpack_require__.r = function(exports) {
            /******/ if (typeof Symbol !== "undefined" && Symbol.toStringTag) {
                /******/ Object.defineProperty(exports, Symbol.toStringTag, {
                    value: "Module"
                })
                /******/
            }
            /******/ Object.defineProperty(exports, "__esModule", {
                value: true
            })
            /******/
        } // create a fake namespace object // mode & 1: value is a module id, require it // mode & 2: merge all properties of value into the ns // mode & 4: return value when already ns object // mode & 8|1: behave like require
        /******/
        /******/ /******/ /******/ /******/ /******/ /******/ __webpack_require__.t = function(
            value,
            mode
        ) {
            /******/ if (mode & 1) value = __webpack_require__(value)
            /******/ if (mode & 8) return value
            /******/ if (
                mode & 4 &&
                typeof value === "object" &&
                value &&
                value.__esModule
            )
                return value
            /******/ var ns = Object.create(null)
            /******/ __webpack_require__.r(ns)
            /******/ Object.defineProperty(ns, "default", {
                enumerable: true,
                value: value
            })
            /******/ if (mode & 2 && typeof value != "string")
                for (var key in value)
                    __webpack_require__.d(
                        ns,
                        key,
                        function(key) {
                            return value[key]
                        }.bind(null, key)
                    )
            /******/ return ns
            /******/
        } // getDefaultExport function for compatibility with non-harmony modules
        /******/
        /******/ /******/ __webpack_require__.n = function(module) {
            /******/ var getter =
                module && module.__esModule
                    ? /******/ function getDefault() {
                          return module["default"]
                      }
                    : /******/ function getModuleExports() {
                          return module
                      }
            /******/ __webpack_require__.d(getter, "a", getter)
            /******/ return getter
            /******/
        } // Object.prototype.hasOwnProperty.call
        /******/
        /******/ /******/ __webpack_require__.o = function(object, property) {
            return Object.prototype.hasOwnProperty.call(object, property)
        } // __webpack_public_path__
        /******/
        /******/ /******/ __webpack_require__.p = "" // Load entry module and return exports
        /******/
        /******/
        /******/ /******/ return __webpack_require__(
            (__webpack_require__.s = 18)
        )
        /******/
    })(
        /************************************************************************/
        /******/ [
            /* 0 */
            /***/ function(module, exports, __webpack_require__) {
                "use strict"

                /*
 Utils using lodash style API. (not necessarily 100% compliant) for functional and other utils.
 These utils should replace usage of lodash in the production code base. not because they are any better...
 but for the purpose of being a dependency free library.

 The hotspots in the code are already written in imperative style for performance reasons.
 so writing several dozen utils which may be slower than the original lodash, does not matter as much
 considering they will not be invoked in hotspots...
 */
                Object.defineProperty(exports, "__esModule", { value: true })
                function isEmpty(arr) {
                    return arr && arr.length === 0
                }
                exports.isEmpty = isEmpty
                function keys(obj) {
                    if (obj === undefined || obj === null) {
                        return []
                    }
                    return Object.keys(obj)
                }
                exports.keys = keys
                function values(obj) {
                    var vals = []
                    var keys = Object.keys(obj)
                    for (var i = 0; i < keys.length; i++) {
                        vals.push(obj[keys[i]])
                    }
                    return vals
                }
                exports.values = values
                function mapValues(obj, callback) {
                    var result = []
                    var objKeys = keys(obj)
                    for (var idx = 0; idx < objKeys.length; idx++) {
                        var currKey = objKeys[idx]
                        result.push(callback.call(null, obj[currKey], currKey))
                    }
                    return result
                }
                exports.mapValues = mapValues
                function map(arr, callback) {
                    var result = []
                    for (var idx = 0; idx < arr.length; idx++) {
                        result.push(callback.call(null, arr[idx], idx))
                    }
                    return result
                }
                exports.map = map
                function flatten(arr) {
                    var result = []
                    for (var idx = 0; idx < arr.length; idx++) {
                        var currItem = arr[idx]
                        if (Array.isArray(currItem)) {
                            result = result.concat(flatten(currItem))
                        } else {
                            result.push(currItem)
                        }
                    }
                    return result
                }
                exports.flatten = flatten
                function first(arr) {
                    return isEmpty(arr) ? undefined : arr[0]
                }
                exports.first = first
                function last(arr) {
                    var len = arr && arr.length
                    return len ? arr[len - 1] : undefined
                }
                exports.last = last
                function forEach(collection, iteratorCallback) {
                    /* istanbul ignore else */
                    if (Array.isArray(collection)) {
                        for (var i = 0; i < collection.length; i++) {
                            iteratorCallback.call(null, collection[i], i)
                        }
                    } else if (isObject(collection)) {
                        var colKeys = keys(collection)
                        for (var i = 0; i < colKeys.length; i++) {
                            var key = colKeys[i]
                            var value = collection[key]
                            iteratorCallback.call(null, value, key)
                        }
                    } else {
                        throw Error("non exhaustive match")
                    }
                }
                exports.forEach = forEach
                function isString(item) {
                    return typeof item === "string"
                }
                exports.isString = isString
                function isUndefined(item) {
                    return item === undefined
                }
                exports.isUndefined = isUndefined
                function isFunction(item) {
                    return item instanceof Function
                }
                exports.isFunction = isFunction
                function drop(arr, howMuch) {
                    if (howMuch === void 0) {
                        howMuch = 1
                    }
                    return arr.slice(howMuch, arr.length)
                }
                exports.drop = drop
                function dropRight(arr, howMuch) {
                    if (howMuch === void 0) {
                        howMuch = 1
                    }
                    return arr.slice(0, arr.length - howMuch)
                }
                exports.dropRight = dropRight
                function filter(arr, predicate) {
                    var result = []
                    if (Array.isArray(arr)) {
                        for (var i = 0; i < arr.length; i++) {
                            var item = arr[i]
                            if (predicate.call(null, item)) {
                                result.push(item)
                            }
                        }
                    }
                    return result
                }
                exports.filter = filter
                function reject(arr, predicate) {
                    return filter(arr, function(item) {
                        return !predicate(item)
                    })
                }
                exports.reject = reject
                function pick(obj, predicate) {
                    var keys = Object.keys(obj)
                    var result = {}
                    for (var i = 0; i < keys.length; i++) {
                        var currKey = keys[i]
                        var currItem = obj[currKey]
                        if (predicate(currItem)) {
                            result[currKey] = currItem
                        }
                    }
                    return result
                }
                exports.pick = pick
                function has(obj, prop) {
                    if (isObject(obj)) {
                        return obj.hasOwnProperty(prop)
                    }
                    return false
                }
                exports.has = has
                function contains(arr, item) {
                    return find(arr, function(currItem) {
                        return currItem === item
                    }) !== undefined
                        ? true
                        : false
                }
                exports.contains = contains
                /**
                 * shallow clone
                 */
                function cloneArr(arr) {
                    var newArr = []
                    for (var i = 0; i < arr.length; i++) {
                        newArr.push(arr[i])
                    }
                    return newArr
                }
                exports.cloneArr = cloneArr
                /**
                 * shallow clone
                 */
                function cloneObj(obj) {
                    var clonedObj = {}
                    for (var key in obj) {
                        /* istanbul ignore else */
                        if (Object.prototype.hasOwnProperty.call(obj, key)) {
                            clonedObj[key] = obj[key]
                        }
                    }
                    return clonedObj
                }
                exports.cloneObj = cloneObj
                function find(arr, predicate) {
                    for (var i = 0; i < arr.length; i++) {
                        var item = arr[i]
                        if (predicate.call(null, item)) {
                            return item
                        }
                    }
                    return undefined
                }
                exports.find = find
                function findAll(arr, predicate) {
                    var found = []
                    for (var i = 0; i < arr.length; i++) {
                        var item = arr[i]
                        if (predicate.call(null, item)) {
                            found.push(item)
                        }
                    }
                    return found
                }
                exports.findAll = findAll
                function reduce(arrOrObj, iterator, initial) {
                    var isArr = Array.isArray(arrOrObj)
                    var vals = isArr ? arrOrObj : values(arrOrObj)
                    var objKeys = isArr ? [] : keys(arrOrObj)
                    var accumulator = initial
                    for (var i = 0; i < vals.length; i++) {
                        accumulator = iterator.call(
                            null,
                            accumulator,
                            vals[i],
                            isArr ? i : objKeys[i]
                        )
                    }
                    return accumulator
                }
                exports.reduce = reduce
                function compact(arr) {
                    return reject(arr, function(item) {
                        return item === null || item === undefined
                    })
                }
                exports.compact = compact
                function uniq(arr, identity) {
                    if (identity === void 0) {
                        identity = function(item) {
                            return item
                        }
                    }
                    var identities = []
                    return reduce(
                        arr,
                        function(result, currItem) {
                            var currIdentity = identity(currItem)
                            if (contains(identities, currIdentity)) {
                                return result
                            } else {
                                identities.push(currIdentity)
                                return result.concat(currItem)
                            }
                        },
                        []
                    )
                }
                exports.uniq = uniq
                function partial(func) {
                    var restArgs = []
                    for (var _i = 1; _i < arguments.length; _i++) {
                        restArgs[_i - 1] = arguments[_i]
                    }
                    var firstArg = [null]
                    var allArgs = firstArg.concat(restArgs)
                    return Function.bind.apply(func, allArgs)
                }
                exports.partial = partial
                function isArray(obj) {
                    return Array.isArray(obj)
                }
                exports.isArray = isArray
                function isRegExp(obj) {
                    return obj instanceof RegExp
                }
                exports.isRegExp = isRegExp
                function isObject(obj) {
                    return obj instanceof Object
                }
                exports.isObject = isObject
                function every(arr, predicate) {
                    for (var i = 0; i < arr.length; i++) {
                        if (!predicate(arr[i], i)) {
                            return false
                        }
                    }
                    return true
                }
                exports.every = every
                function difference(arr, values) {
                    return reject(arr, function(item) {
                        return contains(values, item)
                    })
                }
                exports.difference = difference
                function some(arr, predicate) {
                    for (var i = 0; i < arr.length; i++) {
                        if (predicate(arr[i])) {
                            return true
                        }
                    }
                    return false
                }
                exports.some = some
                function indexOf(arr, value) {
                    for (var i = 0; i < arr.length; i++) {
                        if (arr[i] === value) {
                            return i
                        }
                    }
                    return -1
                }
                exports.indexOf = indexOf
                function sortBy(arr, orderFunc) {
                    var result = cloneArr(arr)
                    result.sort(function(a, b) {
                        return orderFunc(a) - orderFunc(b)
                    })
                    return result
                }
                exports.sortBy = sortBy
                function zipObject(keys, values) {
                    if (keys.length !== values.length) {
                        throw Error(
                            "can't zipObject with different number of keys and values!"
                        )
                    }
                    var result = {}
                    for (var i = 0; i < keys.length; i++) {
                        result[keys[i]] = values[i]
                    }
                    return result
                }
                exports.zipObject = zipObject
                /**
                 * mutates! (and returns) target
                 */
                function assign(target) {
                    var sources = []
                    for (var _i = 1; _i < arguments.length; _i++) {
                        sources[_i - 1] = arguments[_i]
                    }
                    for (var i = 0; i < sources.length; i++) {
                        var curSource = sources[i]
                        var currSourceKeys = keys(curSource)
                        for (var j = 0; j < currSourceKeys.length; j++) {
                            var currKey = currSourceKeys[j]
                            target[currKey] = curSource[currKey]
                        }
                    }
                    return target
                }
                exports.assign = assign
                /**
                 * mutates! (and returns) target
                 */
                function assignNoOverwrite(target) {
                    var sources = []
                    for (var _i = 1; _i < arguments.length; _i++) {
                        sources[_i - 1] = arguments[_i]
                    }
                    for (var i = 0; i < sources.length; i++) {
                        var curSource = sources[i]
                        if (isUndefined(curSource)) {
                            continue
                        }
                        var currSourceKeys = keys(curSource)
                        for (var j = 0; j < currSourceKeys.length; j++) {
                            var currKey = currSourceKeys[j]
                            if (!has(target, currKey)) {
                                target[currKey] = curSource[currKey]
                            }
                        }
                    }
                    return target
                }
                exports.assignNoOverwrite = assignNoOverwrite
                function defaults() {
                    var sources = []
                    for (var _i = 0; _i < arguments.length; _i++) {
                        sources[_i] = arguments[_i]
                    }
                    return assignNoOverwrite.apply(null, [{}].concat(sources))
                }
                exports.defaults = defaults
                function groupBy(arr, groupKeyFunc) {
                    var result = {}
                    forEach(arr, function(item) {
                        var currGroupKey = groupKeyFunc(item)
                        var currGroupArr = result[currGroupKey]
                        if (currGroupArr) {
                            currGroupArr.push(item)
                        } else {
                            result[currGroupKey] = [item]
                        }
                    })
                    return result
                }
                exports.groupBy = groupBy
                /**
                 * Merge obj2 into obj1.
                 * Will overwrite existing properties with the same name
                 */
                function merge(obj1, obj2) {
                    var result = cloneObj(obj1)
                    var keys2 = keys(obj2)
                    for (var i = 0; i < keys2.length; i++) {
                        var key = keys2[i]
                        var value = obj2[key]
                        result[key] = value
                    }
                    return result
                }
                exports.merge = merge
                function NOOP() {}
                exports.NOOP = NOOP
                function IDENTITY(item) {
                    return item
                }
                exports.IDENTITY = IDENTITY
                /**
                 * Will return a new packed array with same values.
                 */
                function packArray(holeyArr) {
                    var result = []
                    for (var i = 0; i < holeyArr.length; i++) {
                        var orgValue = holeyArr[i]
                        result.push(
                            orgValue !== undefined ? orgValue : undefined
                        )
                    }
                    return result
                }
                exports.packArray = packArray
                function PRINT_ERROR(msg) {
                    /* istanbul ignore else - can't override global.console in node.js */
                    if (console && console.error) {
                        console.error("Error: " + msg)
                    }
                }
                exports.PRINT_ERROR = PRINT_ERROR
                function PRINT_WARNING(msg) {
                    /* istanbul ignore else - can't override global.console in node.js*/
                    if (console && console.warn) {
                        // TODO: modify docs accordingly
                        console.warn("Warning: " + msg)
                    }
                }
                exports.PRINT_WARNING = PRINT_WARNING
                function isES2015MapSupported() {
                    return typeof Map === "function"
                }
                exports.isES2015MapSupported = isES2015MapSupported
                function applyMixins(derivedCtor, baseCtors) {
                    baseCtors.forEach(function(baseCtor) {
                        var baseProto = baseCtor.prototype
                        Object.getOwnPropertyNames(baseProto).forEach(function(
                            propName
                        ) {
                            if (propName === "constructor") {
                                return
                            }
                            var basePropDescriptor = Object.getOwnPropertyDescriptor(
                                baseProto,
                                propName
                            )
                            // Handle Accessors
                            if (
                                basePropDescriptor &&
                                (basePropDescriptor.get ||
                                    basePropDescriptor.set)
                            ) {
                                Object.defineProperty(
                                    derivedCtor.prototype,
                                    propName,
                                    basePropDescriptor
                                )
                            } else {
                                derivedCtor.prototype[propName] =
                                    baseCtor.prototype[propName]
                            }
                        })
                    })
                }
                exports.applyMixins = applyMixins
                // base on: https://github.com/petkaantonov/bluebird/blob/b97c0d2d487e8c5076e8bd897e0dcd4622d31846/src/util.js#L201-L216
                function toFastProperties(toBecomeFast) {
                    function FakeConstructor() {}
                    // If our object is used as a constructor it would receive
                    FakeConstructor.prototype = toBecomeFast
                    var fakeInstance = new FakeConstructor()
                    function fakeAccess() {
                        return typeof fakeInstance.bar
                    }
                    // help V8 understand this is a "real" prototype by actually using
                    // the fake instance.
                    fakeAccess()
                    fakeAccess()
                    return toBecomeFast
                    // Eval prevents optimization of this method (even though this is dead code)
                    /* istanbul ignore next */
                    // tslint:disable-next-line
                    eval(toBecomeFast)
                }
                exports.toFastProperties = toFastProperties
                //# sourceMappingURL=utils.js.map

                /***/
            },
            /* 1 */
            /***/ function(module, exports, __webpack_require__) {
                "use strict"

                var __extends =
                    (this && this.__extends) ||
                    (function() {
                        var extendStatics = function(d, b) {
                            extendStatics =
                                Object.setPrototypeOf ||
                                ({ __proto__: [] } instanceof Array &&
                                    function(d, b) {
                                        d.__proto__ = b
                                    }) ||
                                function(d, b) {
                                    for (var p in b)
                                        if (b.hasOwnProperty(p)) d[p] = b[p]
                                }
                            return extendStatics(d, b)
                        }
                        return function(d, b) {
                            extendStatics(d, b)
                            function __() {
                                this.constructor = d
                            }
                            d.prototype =
                                b === null
                                    ? Object.create(b)
                                    : ((__.prototype = b.prototype), new __())
                        }
                    })()
                Object.defineProperty(exports, "__esModule", { value: true })
                var utils_1 = __webpack_require__(0)
                var tokens_public_1 = __webpack_require__(2)
                var AbstractProduction = /** @class */ (function() {
                    function AbstractProduction(definition) {
                        this.definition = definition
                    }
                    AbstractProduction.prototype.accept = function(visitor) {
                        visitor.visit(this)
                        utils_1.forEach(this.definition, function(prod) {
                            prod.accept(visitor)
                        })
                    }
                    return AbstractProduction
                })()
                exports.AbstractProduction = AbstractProduction
                var NonTerminal = /** @class */ (function(_super) {
                    __extends(NonTerminal, _super)
                    function NonTerminal(options) {
                        var _this = _super.call(this, []) || this
                        _this.idx = 1
                        utils_1.assign(
                            _this,
                            utils_1.pick(options, function(v) {
                                return v !== undefined
                            })
                        )
                        return _this
                    }
                    Object.defineProperty(NonTerminal.prototype, "definition", {
                        get: function() {
                            if (this.referencedRule !== undefined) {
                                return this.referencedRule.definition
                            }
                            return []
                        },
                        set: function(definition) {
                            // immutable
                        },
                        enumerable: true,
                        configurable: true
                    })
                    NonTerminal.prototype.accept = function(visitor) {
                        visitor.visit(this)
                        // don't visit children of a reference, we will get cyclic infinite loops if we do so
                    }
                    return NonTerminal
                })(AbstractProduction)
                exports.NonTerminal = NonTerminal
                var Rule = /** @class */ (function(_super) {
                    __extends(Rule, _super)
                    function Rule(options) {
                        var _this =
                            _super.call(this, options.definition) || this
                        _this.orgText = ""
                        utils_1.assign(
                            _this,
                            utils_1.pick(options, function(v) {
                                return v !== undefined
                            })
                        )
                        return _this
                    }
                    return Rule
                })(AbstractProduction)
                exports.Rule = Rule
                var Flat = /** @class */ (function(_super) {
                    __extends(Flat, _super)
                    // A named Flat production is used to indicate a Nested Rule in an alternation
                    function Flat(options) {
                        var _this =
                            _super.call(this, options.definition) || this
                        utils_1.assign(
                            _this,
                            utils_1.pick(options, function(v) {
                                return v !== undefined
                            })
                        )
                        return _this
                    }
                    return Flat
                })(AbstractProduction)
                exports.Flat = Flat
                var Option = /** @class */ (function(_super) {
                    __extends(Option, _super)
                    function Option(options) {
                        var _this =
                            _super.call(this, options.definition) || this
                        _this.idx = 1
                        utils_1.assign(
                            _this,
                            utils_1.pick(options, function(v) {
                                return v !== undefined
                            })
                        )
                        return _this
                    }
                    return Option
                })(AbstractProduction)
                exports.Option = Option
                var RepetitionMandatory = /** @class */ (function(_super) {
                    __extends(RepetitionMandatory, _super)
                    function RepetitionMandatory(options) {
                        var _this =
                            _super.call(this, options.definition) || this
                        _this.idx = 1
                        utils_1.assign(
                            _this,
                            utils_1.pick(options, function(v) {
                                return v !== undefined
                            })
                        )
                        return _this
                    }
                    return RepetitionMandatory
                })(AbstractProduction)
                exports.RepetitionMandatory = RepetitionMandatory
                var RepetitionMandatoryWithSeparator = /** @class */ (function(
                    _super
                ) {
                    __extends(RepetitionMandatoryWithSeparator, _super)
                    function RepetitionMandatoryWithSeparator(options) {
                        var _this =
                            _super.call(this, options.definition) || this
                        _this.idx = 1
                        utils_1.assign(
                            _this,
                            utils_1.pick(options, function(v) {
                                return v !== undefined
                            })
                        )
                        return _this
                    }
                    return RepetitionMandatoryWithSeparator
                })(AbstractProduction)
                exports.RepetitionMandatoryWithSeparator = RepetitionMandatoryWithSeparator
                var Repetition = /** @class */ (function(_super) {
                    __extends(Repetition, _super)
                    function Repetition(options) {
                        var _this =
                            _super.call(this, options.definition) || this
                        _this.idx = 1
                        utils_1.assign(
                            _this,
                            utils_1.pick(options, function(v) {
                                return v !== undefined
                            })
                        )
                        return _this
                    }
                    return Repetition
                })(AbstractProduction)
                exports.Repetition = Repetition
                var RepetitionWithSeparator = /** @class */ (function(_super) {
                    __extends(RepetitionWithSeparator, _super)
                    function RepetitionWithSeparator(options) {
                        var _this =
                            _super.call(this, options.definition) || this
                        _this.idx = 1
                        utils_1.assign(
                            _this,
                            utils_1.pick(options, function(v) {
                                return v !== undefined
                            })
                        )
                        return _this
                    }
                    return RepetitionWithSeparator
                })(AbstractProduction)
                exports.RepetitionWithSeparator = RepetitionWithSeparator
                var Alternation = /** @class */ (function(_super) {
                    __extends(Alternation, _super)
                    function Alternation(options) {
                        var _this =
                            _super.call(this, options.definition) || this
                        _this.idx = 1
                        utils_1.assign(
                            _this,
                            utils_1.pick(options, function(v) {
                                return v !== undefined
                            })
                        )
                        return _this
                    }
                    return Alternation
                })(AbstractProduction)
                exports.Alternation = Alternation
                var Terminal = /** @class */ (function() {
                    function Terminal(options) {
                        this.idx = 1
                        utils_1.assign(
                            this,
                            utils_1.pick(options, function(v) {
                                return v !== undefined
                            })
                        )
                    }
                    Terminal.prototype.accept = function(visitor) {
                        visitor.visit(this)
                    }
                    return Terminal
                })()
                exports.Terminal = Terminal
                function serializeGrammar(topRules) {
                    return utils_1.map(topRules, serializeProduction)
                }
                exports.serializeGrammar = serializeGrammar
                function serializeProduction(node) {
                    function convertDefinition(definition) {
                        return utils_1.map(definition, serializeProduction)
                    }
                    /* istanbul ignore else */
                    if (node instanceof NonTerminal) {
                        return {
                            type: "NonTerminal",
                            name: node.nonTerminalName,
                            idx: node.idx
                        }
                    } else if (node instanceof Flat) {
                        return {
                            type: "Flat",
                            definition: convertDefinition(node.definition)
                        }
                    } else if (node instanceof Option) {
                        return {
                            type: "Option",
                            idx: node.idx,
                            definition: convertDefinition(node.definition)
                        }
                    } else if (node instanceof RepetitionMandatory) {
                        return {
                            type: "RepetitionMandatory",
                            name: node.name,
                            idx: node.idx,
                            definition: convertDefinition(node.definition)
                        }
                    } else if (
                        node instanceof RepetitionMandatoryWithSeparator
                    ) {
                        return {
                            type: "RepetitionMandatoryWithSeparator",
                            name: node.name,
                            idx: node.idx,
                            separator: serializeProduction(
                                new Terminal({ terminalType: node.separator })
                            ),
                            definition: convertDefinition(node.definition)
                        }
                    } else if (node instanceof RepetitionWithSeparator) {
                        return {
                            type: "RepetitionWithSeparator",
                            name: node.name,
                            idx: node.idx,
                            separator: serializeProduction(
                                new Terminal({ terminalType: node.separator })
                            ),
                            definition: convertDefinition(node.definition)
                        }
                    } else if (node instanceof Repetition) {
                        return {
                            type: "Repetition",
                            name: node.name,
                            idx: node.idx,
                            definition: convertDefinition(node.definition)
                        }
                    } else if (node instanceof Alternation) {
                        return {
                            type: "Alternation",
                            name: node.name,
                            idx: node.idx,
                            definition: convertDefinition(node.definition)
                        }
                    } else if (node instanceof Terminal) {
                        var serializedTerminal = {
                            type: "Terminal",
                            name: tokens_public_1.tokenName(node.terminalType),
                            label: tokens_public_1.tokenLabel(
                                node.terminalType
                            ),
                            idx: node.idx
                        }
                        var pattern = node.terminalType.PATTERN
                        if (node.terminalType.PATTERN) {
                            serializedTerminal.pattern = utils_1.isRegExp(
                                pattern
                            )
                                ? pattern.source
                                : pattern
                        }
                        return serializedTerminal
                    } else if (node instanceof Rule) {
                        return {
                            type: "Rule",
                            name: node.name,
                            orgText: node.orgText,
                            definition: convertDefinition(node.definition)
                        }
                    } else {
                        throw Error("non exhaustive match")
                    }
                }
                exports.serializeProduction = serializeProduction
                //# sourceMappingURL=gast_public.js.map

                /***/
            },
            /* 2 */
            /***/ function(module, exports, __webpack_require__) {
                "use strict"

                Object.defineProperty(exports, "__esModule", { value: true })
                var utils_1 = __webpack_require__(0)
                var lang_extensions_1 = __webpack_require__(4)
                var lexer_public_1 = __webpack_require__(15)
                var tokens_1 = __webpack_require__(7)
                function tokenLabel(clazz) {
                    if (hasTokenLabel(clazz)) {
                        return clazz.LABEL
                    } else {
                        return tokenName(clazz)
                    }
                }
                exports.tokenLabel = tokenLabel
                function hasTokenLabel(obj) {
                    return utils_1.isString(obj.LABEL) && obj.LABEL !== ""
                }
                exports.hasTokenLabel = hasTokenLabel
                function tokenName(obj) {
                    // The tokenName property is needed under some old versions of node.js (0.10/0.12)
                    // where the Function.prototype.name property is not defined as a 'configurable' property
                    // enable producing readable error messages.
                    /* istanbul ignore if -> will only run in old versions of node.js */
                    if (
                        utils_1.isObject(obj) &&
                        obj.hasOwnProperty("tokenName") &&
                        utils_1.isString(obj.tokenName)
                    ) {
                        return obj.tokenName
                    } else {
                        return lang_extensions_1.functionName(obj)
                    }
                }
                exports.tokenName = tokenName
                var PARENT = "parent"
                var CATEGORIES = "categories"
                var LABEL = "label"
                var GROUP = "group"
                var PUSH_MODE = "push_mode"
                var POP_MODE = "pop_mode"
                var LONGER_ALT = "longer_alt"
                var LINE_BREAKS = "line_breaks"
                var START_CHARS_HINT = "start_chars_hint"
                function createToken(config) {
                    return createTokenInternal(config)
                }
                exports.createToken = createToken
                function createTokenInternal(config) {
                    var tokenName = config.name
                    var pattern = config.pattern
                    var tokenType = {}
                    // can be overwritten according to:
                    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/
                    // name?redirectlocale=en-US&redirectslug=JavaScript%2FReference%2FGlobal_Objects%2FFunction%2Fname
                    /* istanbul ignore if -> will only run in old versions of node.js */
                    if (
                        !lang_extensions_1.defineNameProp(tokenType, tokenName)
                    ) {
                        // hack to save the tokenName in situations where the constructor's name property cannot be reconfigured
                        tokenType.tokenName = tokenName
                    }
                    if (!utils_1.isUndefined(pattern)) {
                        tokenType.PATTERN = pattern
                    }
                    if (utils_1.has(config, PARENT)) {
                        throw "The parent property is no longer supported.\n" +
                            "See: https://github.com/SAP/chevrotain/issues/564#issuecomment-349062346 for details."
                    }
                    if (utils_1.has(config, CATEGORIES)) {
                        tokenType.CATEGORIES = config[CATEGORIES]
                    }
                    tokens_1.augmentTokenTypes([tokenType])
                    if (utils_1.has(config, LABEL)) {
                        tokenType.LABEL = config[LABEL]
                    }
                    if (utils_1.has(config, GROUP)) {
                        tokenType.GROUP = config[GROUP]
                    }
                    if (utils_1.has(config, POP_MODE)) {
                        tokenType.POP_MODE = config[POP_MODE]
                    }
                    if (utils_1.has(config, PUSH_MODE)) {
                        tokenType.PUSH_MODE = config[PUSH_MODE]
                    }
                    if (utils_1.has(config, LONGER_ALT)) {
                        tokenType.LONGER_ALT = config[LONGER_ALT]
                    }
                    if (utils_1.has(config, LINE_BREAKS)) {
                        tokenType.LINE_BREAKS = config[LINE_BREAKS]
                    }
                    if (utils_1.has(config, START_CHARS_HINT)) {
                        tokenType.START_CHARS_HINT = config[START_CHARS_HINT]
                    }
                    return tokenType
                }
                exports.EOF = createToken({
                    name: "EOF",
                    pattern: lexer_public_1.Lexer.NA
                })
                tokens_1.augmentTokenTypes([exports.EOF])
                function createTokenInstance(
                    tokType,
                    image,
                    startOffset,
                    endOffset,
                    startLine,
                    endLine,
                    startColumn,
                    endColumn
                ) {
                    return {
                        image: image,
                        startOffset: startOffset,
                        endOffset: endOffset,
                        startLine: startLine,
                        endLine: endLine,
                        startColumn: startColumn,
                        endColumn: endColumn,
                        tokenTypeIdx: tokType.tokenTypeIdx,
                        tokenType: tokType
                    }
                }
                exports.createTokenInstance = createTokenInstance
                function tokenMatcher(token, tokType) {
                    return tokens_1.tokenStructuredMatcher(token, tokType)
                }
                exports.tokenMatcher = tokenMatcher
                //# sourceMappingURL=tokens_public.js.map

                /***/
            },
            /* 3 */
            /***/ function(module, exports, __webpack_require__) {
                "use strict"

                var __extends =
                    (this && this.__extends) ||
                    (function() {
                        var extendStatics = function(d, b) {
                            extendStatics =
                                Object.setPrototypeOf ||
                                ({ __proto__: [] } instanceof Array &&
                                    function(d, b) {
                                        d.__proto__ = b
                                    }) ||
                                function(d, b) {
                                    for (var p in b)
                                        if (b.hasOwnProperty(p)) d[p] = b[p]
                                }
                            return extendStatics(d, b)
                        }
                        return function(d, b) {
                            extendStatics(d, b)
                            function __() {
                                this.constructor = d
                            }
                            d.prototype =
                                b === null
                                    ? Object.create(b)
                                    : ((__.prototype = b.prototype), new __())
                        }
                    })()
                Object.defineProperty(exports, "__esModule", { value: true })
                var lang_extensions_1 = __webpack_require__(4)
                var utils_1 = __webpack_require__(0)
                var follow_1 = __webpack_require__(26)
                var tokens_public_1 = __webpack_require__(2)
                var gast_builder_1 = __webpack_require__(23)
                var cst_1 = __webpack_require__(16)
                var errors_public_1 = __webpack_require__(10)
                var gast_resolver_public_1 = __webpack_require__(24)
                var recoverable_1 = __webpack_require__(25)
                var looksahead_1 = __webpack_require__(31)
                var tree_builder_1 = __webpack_require__(32)
                var lexer_adapter_1 = __webpack_require__(34)
                var recognizer_api_1 = __webpack_require__(35)
                var recognizer_engine_1 = __webpack_require__(36)
                var error_handler_1 = __webpack_require__(37)
                var context_assist_1 = __webpack_require__(38)
                exports.END_OF_FILE = tokens_public_1.createTokenInstance(
                    tokens_public_1.EOF,
                    "",
                    NaN,
                    NaN,
                    NaN,
                    NaN,
                    NaN,
                    NaN
                )
                Object.freeze(exports.END_OF_FILE)
                exports.DEFAULT_PARSER_CONFIG = Object.freeze({
                    recoveryEnabled: false,
                    maxLookahead: 4,
                    ignoredIssues: {},
                    dynamicTokensEnabled: false,
                    outputCst: true,
                    errorMessageProvider:
                        errors_public_1.defaultParserErrorProvider,
                    serializedGrammar: null,
                    nodeLocationTracking: "none"
                })
                exports.DEFAULT_RULE_CONFIG = Object.freeze({
                    recoveryValueFunc: function() {
                        return undefined
                    },
                    resyncEnabled: true
                })
                var ParserDefinitionErrorType
                ;(function(ParserDefinitionErrorType) {
                    ParserDefinitionErrorType[
                        (ParserDefinitionErrorType["INVALID_RULE_NAME"] = 0)
                    ] = "INVALID_RULE_NAME"
                    ParserDefinitionErrorType[
                        (ParserDefinitionErrorType["DUPLICATE_RULE_NAME"] = 1)
                    ] = "DUPLICATE_RULE_NAME"
                    ParserDefinitionErrorType[
                        (ParserDefinitionErrorType["INVALID_RULE_OVERRIDE"] = 2)
                    ] = "INVALID_RULE_OVERRIDE"
                    ParserDefinitionErrorType[
                        (ParserDefinitionErrorType["DUPLICATE_PRODUCTIONS"] = 3)
                    ] = "DUPLICATE_PRODUCTIONS"
                    ParserDefinitionErrorType[
                        (ParserDefinitionErrorType[
                            "UNRESOLVED_SUBRULE_REF"
                        ] = 4)
                    ] = "UNRESOLVED_SUBRULE_REF"
                    ParserDefinitionErrorType[
                        (ParserDefinitionErrorType["LEFT_RECURSION"] = 5)
                    ] = "LEFT_RECURSION"
                    ParserDefinitionErrorType[
                        (ParserDefinitionErrorType["NONE_LAST_EMPTY_ALT"] = 6)
                    ] = "NONE_LAST_EMPTY_ALT"
                    ParserDefinitionErrorType[
                        (ParserDefinitionErrorType["AMBIGUOUS_ALTS"] = 7)
                    ] = "AMBIGUOUS_ALTS"
                    ParserDefinitionErrorType[
                        (ParserDefinitionErrorType[
                            "CONFLICT_TOKENS_RULES_NAMESPACE"
                        ] = 8)
                    ] = "CONFLICT_TOKENS_RULES_NAMESPACE"
                    ParserDefinitionErrorType[
                        (ParserDefinitionErrorType["INVALID_TOKEN_NAME"] = 9)
                    ] = "INVALID_TOKEN_NAME"
                    ParserDefinitionErrorType[
                        (ParserDefinitionErrorType[
                            "INVALID_NESTED_RULE_NAME"
                        ] = 10)
                    ] = "INVALID_NESTED_RULE_NAME"
                    ParserDefinitionErrorType[
                        (ParserDefinitionErrorType[
                            "DUPLICATE_NESTED_NAME"
                        ] = 11)
                    ] = "DUPLICATE_NESTED_NAME"
                    ParserDefinitionErrorType[
                        (ParserDefinitionErrorType[
                            "NO_NON_EMPTY_LOOKAHEAD"
                        ] = 12)
                    ] = "NO_NON_EMPTY_LOOKAHEAD"
                    ParserDefinitionErrorType[
                        (ParserDefinitionErrorType[
                            "AMBIGUOUS_PREFIX_ALTS"
                        ] = 13)
                    ] = "AMBIGUOUS_PREFIX_ALTS"
                    ParserDefinitionErrorType[
                        (ParserDefinitionErrorType["TOO_MANY_ALTS"] = 14)
                    ] = "TOO_MANY_ALTS"
                })(
                    (ParserDefinitionErrorType =
                        exports.ParserDefinitionErrorType ||
                        (exports.ParserDefinitionErrorType = {}))
                )
                function EMPTY_ALT(value) {
                    if (value === void 0) {
                        value = undefined
                    }
                    return function() {
                        return value
                    }
                }
                exports.EMPTY_ALT = EMPTY_ALT
                var Parser = /** @class */ (function() {
                    function Parser(tokenVocabulary, config) {
                        if (config === void 0) {
                            config = exports.DEFAULT_PARSER_CONFIG
                        }
                        this.ignoredIssues =
                            exports.DEFAULT_PARSER_CONFIG.ignoredIssues
                        this.definitionErrors = []
                        this.selfAnalysisDone = false
                        var that = this
                        that.initErrorHandler(config)
                        that.initLexerAdapter()
                        that.initLooksAhead(config)
                        that.initRecognizerEngine(tokenVocabulary, config)
                        that.initRecoverable(config)
                        that.initTreeBuilder(config)
                        that.initContentAssist()
                        this.ignoredIssues = utils_1.has(
                            config,
                            "ignoredIssues"
                        )
                            ? config.ignoredIssues
                            : exports.DEFAULT_PARSER_CONFIG.ignoredIssues
                        // Avoid performance regressions in newer versions of V8
                        utils_1.toFastProperties(this)
                    }
                    /**
                     *  @deprecated use the **instance** method with the same name instead
                     */
                    Parser.performSelfAnalysis = function(parserInstance) {
                        parserInstance.performSelfAnalysis()
                    }
                    Parser.prototype.performSelfAnalysis = function() {
                        var _this = this
                        var defErrorsMsgs
                        this.selfAnalysisDone = true
                        var className = lang_extensions_1.classNameFromInstance(
                            this
                        )
                        var productions = this.gastProductionsCache
                        if (this.serializedGrammar) {
                            var rules = gast_builder_1.deserializeGrammar(
                                this.serializedGrammar,
                                this.tokensMap
                            )
                            utils_1.forEach(rules, function(rule) {
                                _this.gastProductionsCache.put(rule.name, rule)
                            })
                        }
                        var resolverErrors = gast_resolver_public_1.resolveGrammar(
                            {
                                rules: productions.values()
                            }
                        )
                        this.definitionErrors.push.apply(
                            this.definitionErrors,
                            resolverErrors
                        ) // mutability for the win?
                        // only perform additional grammar validations IFF no resolving errors have occurred.
                        // as unresolved grammar may lead to unhandled runtime exceptions in the follow up validations.
                        if (utils_1.isEmpty(resolverErrors)) {
                            var validationErrors = gast_resolver_public_1.validateGrammar(
                                {
                                    rules: productions.values(),
                                    maxLookahead: this.maxLookahead,
                                    tokenTypes: utils_1.values(this.tokensMap),
                                    ignoredIssues: this.ignoredIssues,
                                    errMsgProvider:
                                        errors_public_1.defaultGrammarValidatorErrorProvider,
                                    grammarName: className
                                }
                            )
                            this.definitionErrors.push.apply(
                                this.definitionErrors,
                                validationErrors
                            ) // mutability for the win?
                        }
                        if (utils_1.isEmpty(this.definitionErrors)) {
                            // this analysis may fail if the grammar is not perfectly valid
                            var allFollows = follow_1.computeAllProdsFollows(
                                productions.values()
                            )
                            this.resyncFollows = allFollows
                        }
                        var cstAnalysisResult = cst_1.analyzeCst(
                            productions.values(),
                            this.fullRuleNameToShort
                        )
                        this.allRuleNames = cstAnalysisResult.allRuleNames
                        if (
                            !Parser.DEFER_DEFINITION_ERRORS_HANDLING &&
                            !utils_1.isEmpty(this.definitionErrors)
                        ) {
                            defErrorsMsgs = utils_1.map(
                                this.definitionErrors,
                                function(defError) {
                                    return defError.message
                                }
                            )
                            throw new Error(
                                "Parser Definition Errors detected:\n " +
                                    defErrorsMsgs.join(
                                        "\n-------------------------------\n"
                                    )
                            )
                        }
                    }
                    // Set this flag to true if you don't want the Parser to throw error when problems in it's definition are detected.
                    // (normally during the parser's constructor).
                    // This is a design time flag, it will not affect the runtime error handling of the parser, just design time errors,
                    // for example: duplicate rule names, referencing an unresolved subrule, ect...
                    // This flag should not be enabled during normal usage, it is used in special situations, for example when
                    // needing to display the parser definition errors in some GUI(online playground).
                    Parser.DEFER_DEFINITION_ERRORS_HANDLING = false
                    return Parser
                })()
                exports.Parser = Parser
                utils_1.applyMixins(Parser, [
                    recoverable_1.Recoverable,
                    looksahead_1.LooksAhead,
                    tree_builder_1.TreeBuilder,
                    lexer_adapter_1.LexerAdapter,
                    recognizer_engine_1.RecognizerEngine,
                    recognizer_api_1.RecognizerApi,
                    error_handler_1.ErrorHandler,
                    context_assist_1.ContentAssist
                ])
                var CstParser = /** @class */ (function(_super) {
                    __extends(CstParser, _super)
                    function CstParser(tokenVocabulary, config) {
                        if (config === void 0) {
                            config = exports.DEFAULT_PARSER_CONFIG
                        }
                        var _this = this
                        var configClone = utils_1.cloneObj(config)
                        configClone.outputCst = true
                        _this =
                            _super.call(this, tokenVocabulary, configClone) ||
                            this
                        return _this
                    }
                    return CstParser
                })(Parser)
                exports.CstParser = CstParser
                var EmbeddedActionsParser = /** @class */ (function(_super) {
                    __extends(EmbeddedActionsParser, _super)
                    function EmbeddedActionsParser(tokenVocabulary, config) {
                        if (config === void 0) {
                            config = exports.DEFAULT_PARSER_CONFIG
                        }
                        var _this = this
                        var configClone = utils_1.cloneObj(config)
                        configClone.outputCst = false
                        _this =
                            _super.call(this, tokenVocabulary, configClone) ||
                            this
                        return _this
                    }
                    return EmbeddedActionsParser
                })(Parser)
                exports.EmbeddedActionsParser = EmbeddedActionsParser
                //# sourceMappingURL=parser.js.map

                /***/
            },
            /* 4 */
            /***/ function(module, exports, __webpack_require__) {
                "use strict"

                Object.defineProperty(exports, "__esModule", { value: true })
                var utils_1 = __webpack_require__(0)
                function classNameFromInstance(instance) {
                    return functionName(instance.constructor)
                }
                exports.classNameFromInstance = classNameFromInstance
                var FUNC_NAME_REGEXP = /^\s*function\s*(\S*)\s*\(/
                var NAME = "name"
                /* istanbul ignore next too many hacks for IE/old versions of node.js here*/
                function functionName(func) {
                    // Engines that support Function.prototype.name OR the nth (n>1) time after
                    // the name has been computed in the following else block.
                    var existingNameProp = func.name
                    if (existingNameProp) {
                        return existingNameProp
                    }
                    // hack for IE and engines that do not support Object.defineProperty on function.name (Node.js 0.10 && 0.12)
                    var computedName = func
                        .toString()
                        .match(FUNC_NAME_REGEXP)[1]
                    return computedName
                }
                exports.functionName = functionName
                /**
                 * @returns {boolean} - has the property been successfully defined
                 */
                function defineNameProp(obj, nameValue) {
                    var namePropDescriptor = Object.getOwnPropertyDescriptor(
                        obj,
                        NAME
                    )
                    /* istanbul ignore else -> will only run in old versions of node.js */
                    if (
                        utils_1.isUndefined(namePropDescriptor) ||
                        namePropDescriptor.configurable
                    ) {
                        Object.defineProperty(obj, NAME, {
                            enumerable: false,
                            configurable: true,
                            writable: false,
                            value: nameValue
                        })
                        return true
                    }
                    /* istanbul ignore next -> will only run in old versions of node.js */
                    return false
                }
                exports.defineNameProp = defineNameProp
                /**
                 * simple Hashtable between a string and some generic value
                 * this should be removed once typescript supports ES6 style Hashtable
                 */
                var HashTable = /** @class */ (function() {
                    function HashTable() {
                        this._state = {}
                    }
                    HashTable.prototype.keys = function() {
                        return utils_1.keys(this._state)
                    }
                    HashTable.prototype.values = function() {
                        return utils_1.values(this._state)
                    }
                    HashTable.prototype.put = function(key, value) {
                        this._state[key] = value
                    }
                    HashTable.prototype.putAll = function(other) {
                        this._state = utils_1.assign(this._state, other._state)
                    }
                    HashTable.prototype.get = function(key) {
                        // To avoid edge case with a key called "hasOwnProperty" we need to perform the commented out check below
                        // -> if (Object.prototype.hasOwnProperty.call(this._state, key)) { ... } <-
                        // however this costs nearly 25% of the parser's runtime.
                        // if someone decides to name their Parser class "hasOwnProperty" they deserve what they will get :)
                        return this._state[key]
                    }
                    HashTable.prototype.containsKey = function(key) {
                        return utils_1.has(this._state, key)
                    }
                    HashTable.prototype.clear = function() {
                        this._state = {}
                    }
                    return HashTable
                })()
                exports.HashTable = HashTable
                //# sourceMappingURL=lang_extensions.js.map

                /***/
            },
            /* 5 */
            /***/ function(module, exports, __webpack_require__) {
                "use strict"

                Object.defineProperty(exports, "__esModule", { value: true })
                var gast_public_1 = __webpack_require__(1)
                var GAstVisitor = /** @class */ (function() {
                    function GAstVisitor() {}
                    GAstVisitor.prototype.visit = function(node) {
                        /* istanbul ignore next */
                        if (node instanceof gast_public_1.NonTerminal) {
                            return this.visitNonTerminal(node)
                        } else if (node instanceof gast_public_1.Flat) {
                            return this.visitFlat(node)
                        } else if (node instanceof gast_public_1.Option) {
                            return this.visitOption(node)
                        } else if (
                            node instanceof gast_public_1.RepetitionMandatory
                        ) {
                            return this.visitRepetitionMandatory(node)
                        } else if (
                            node instanceof
                            gast_public_1.RepetitionMandatoryWithSeparator
                        ) {
                            return this.visitRepetitionMandatoryWithSeparator(
                                node
                            )
                        } else if (
                            node instanceof
                            gast_public_1.RepetitionWithSeparator
                        ) {
                            return this.visitRepetitionWithSeparator(node)
                        } else if (node instanceof gast_public_1.Repetition) {
                            return this.visitRepetition(node)
                        } else if (node instanceof gast_public_1.Alternation) {
                            return this.visitAlternation(node)
                        } else if (node instanceof gast_public_1.Terminal) {
                            return this.visitTerminal(node)
                        } else if (node instanceof gast_public_1.Rule) {
                            return this.visitRule(node)
                        } else {
                            throw Error("non exhaustive match")
                        }
                    }
                    GAstVisitor.prototype.visitNonTerminal = function(node) {}
                    GAstVisitor.prototype.visitFlat = function(node) {}
                    GAstVisitor.prototype.visitOption = function(node) {}
                    GAstVisitor.prototype.visitRepetition = function(node) {}
                    GAstVisitor.prototype.visitRepetitionMandatory = function(
                        node
                    ) {}
                    GAstVisitor.prototype.visitRepetitionMandatoryWithSeparator = function(
                        node
                    ) {}
                    GAstVisitor.prototype.visitRepetitionWithSeparator = function(
                        node
                    ) {}
                    GAstVisitor.prototype.visitAlternation = function(node) {}
                    GAstVisitor.prototype.visitTerminal = function(node) {}
                    GAstVisitor.prototype.visitRule = function(node) {}
                    return GAstVisitor
                })()
                exports.GAstVisitor = GAstVisitor
                //# sourceMappingURL=gast_visitor_public.js.map

                /***/
            },
            /* 6 */
            /***/ function(module, exports, __webpack_require__) {
                "use strict"

                Object.defineProperty(exports, "__esModule", { value: true })
                var utils_1 = __webpack_require__(0)
                var MISMATCHED_TOKEN_EXCEPTION = "MismatchedTokenException"
                var NO_VIABLE_ALT_EXCEPTION = "NoViableAltException"
                var EARLY_EXIT_EXCEPTION = "EarlyExitException"
                var NOT_ALL_INPUT_PARSED_EXCEPTION =
                    "NotAllInputParsedException"
                var RECOGNITION_EXCEPTION_NAMES = [
                    MISMATCHED_TOKEN_EXCEPTION,
                    NO_VIABLE_ALT_EXCEPTION,
                    EARLY_EXIT_EXCEPTION,
                    NOT_ALL_INPUT_PARSED_EXCEPTION
                ]
                Object.freeze(RECOGNITION_EXCEPTION_NAMES)
                // hacks to bypass no support for custom Errors in javascript/typescript
                function isRecognitionException(error) {
                    // can't do instanceof on hacked custom js exceptions
                    return utils_1.contains(
                        RECOGNITION_EXCEPTION_NAMES,
                        error.name
                    )
                }
                exports.isRecognitionException = isRecognitionException
                function MismatchedTokenException(
                    message,
                    token,
                    previousToken
                ) {
                    this.name = MISMATCHED_TOKEN_EXCEPTION
                    this.message = message
                    this.token = token
                    this.previousToken = previousToken
                    this.resyncedTokens = []
                }
                exports.MismatchedTokenException = MismatchedTokenException
                // must use the "Error.prototype" instead of "new Error"
                // because the stack trace points to where "new Error" was invoked"
                MismatchedTokenException.prototype = Error.prototype
                function NoViableAltException(message, token, previousToken) {
                    this.name = NO_VIABLE_ALT_EXCEPTION
                    this.message = message
                    this.token = token
                    this.previousToken = previousToken
                    this.resyncedTokens = []
                }
                exports.NoViableAltException = NoViableAltException
                NoViableAltException.prototype = Error.prototype
                function NotAllInputParsedException(message, token) {
                    this.name = NOT_ALL_INPUT_PARSED_EXCEPTION
                    this.message = message
                    this.token = token
                    this.resyncedTokens = []
                }
                exports.NotAllInputParsedException = NotAllInputParsedException
                NotAllInputParsedException.prototype = Error.prototype
                function EarlyExitException(message, token, previousToken) {
                    this.name = EARLY_EXIT_EXCEPTION
                    this.message = message
                    this.token = token
                    this.previousToken = previousToken
                    this.resyncedTokens = []
                }
                exports.EarlyExitException = EarlyExitException
                EarlyExitException.prototype = Error.prototype
                //# sourceMappingURL=exceptions_public.js.map

                /***/
            },
            /* 7 */
            /***/ function(module, exports, __webpack_require__) {
                "use strict"

                Object.defineProperty(exports, "__esModule", { value: true })
                var utils_1 = __webpack_require__(0)
                var lang_extensions_1 = __webpack_require__(4)
                var tokens_public_1 = __webpack_require__(2)
                function tokenStructuredMatcher(tokInstance, tokConstructor) {
                    var instanceType = tokInstance.tokenTypeIdx
                    if (instanceType === tokConstructor.tokenTypeIdx) {
                        return true
                    } else {
                        return (
                            tokConstructor.isParent === true &&
                            tokConstructor.categoryMatchesMap[instanceType] ===
                                true
                        )
                    }
                }
                exports.tokenStructuredMatcher = tokenStructuredMatcher
                // Optimized tokenMatcher in case our grammar does not use token categories
                // Being so tiny it is much more likely to be in-lined and this avoid the function call overhead
                function tokenStructuredMatcherNoCategories(token, tokType) {
                    return token.tokenTypeIdx === tokType.tokenTypeIdx
                }
                exports.tokenStructuredMatcherNoCategories = tokenStructuredMatcherNoCategories
                exports.tokenShortNameIdx = 1
                exports.tokenIdxToClass = new lang_extensions_1.HashTable()
                function augmentTokenTypes(tokenTypes) {
                    // collect the parent Token Types as well.
                    var tokenTypesAndParents = expandCategories(tokenTypes)
                    // add required tokenType and categoryMatches properties
                    assignTokenDefaultProps(tokenTypesAndParents)
                    // fill up the categoryMatches
                    assignCategoriesMapProp(tokenTypesAndParents)
                    assignCategoriesTokensProp(tokenTypesAndParents)
                    utils_1.forEach(tokenTypesAndParents, function(tokType) {
                        tokType.isParent = tokType.categoryMatches.length > 0
                    })
                }
                exports.augmentTokenTypes = augmentTokenTypes
                function expandCategories(tokenTypes) {
                    var result = utils_1.cloneArr(tokenTypes)
                    var categories = tokenTypes
                    var searching = true
                    while (searching) {
                        categories = utils_1.compact(
                            utils_1.flatten(
                                utils_1.map(categories, function(currTokType) {
                                    return currTokType.CATEGORIES
                                })
                            )
                        )
                        var newCategories = utils_1.difference(
                            categories,
                            result
                        )
                        result = result.concat(newCategories)
                        if (utils_1.isEmpty(newCategories)) {
                            searching = false
                        } else {
                            categories = newCategories
                        }
                    }
                    return result
                }
                exports.expandCategories = expandCategories
                function assignTokenDefaultProps(tokenTypes) {
                    utils_1.forEach(tokenTypes, function(currTokType) {
                        if (!hasShortKeyProperty(currTokType)) {
                            exports.tokenIdxToClass.put(
                                exports.tokenShortNameIdx,
                                currTokType
                            )
                            currTokType.tokenTypeIdx = exports.tokenShortNameIdx++
                        }
                        // CATEGORIES? : TokenType | TokenType[]
                        if (
                            hasCategoriesProperty(currTokType) &&
                            !utils_1.isArray(currTokType.CATEGORIES)
                            // &&
                            // !isUndefined(currTokType.CATEGORIES.PATTERN)
                        ) {
                            currTokType.CATEGORIES = [currTokType.CATEGORIES]
                        }
                        if (!hasCategoriesProperty(currTokType)) {
                            currTokType.CATEGORIES = []
                        }
                        if (!hasExtendingTokensTypesProperty(currTokType)) {
                            currTokType.categoryMatches = []
                        }
                        if (!hasExtendingTokensTypesMapProperty(currTokType)) {
                            currTokType.categoryMatchesMap = {}
                        }
                        if (!hasTokenNameProperty(currTokType)) {
                            // saved for fast access during CST building.
                            currTokType.tokenName = tokens_public_1.tokenName(
                                currTokType
                            )
                        }
                    })
                }
                exports.assignTokenDefaultProps = assignTokenDefaultProps
                function assignCategoriesTokensProp(tokenTypes) {
                    utils_1.forEach(tokenTypes, function(currTokType) {
                        // avoid duplications
                        currTokType.categoryMatches = []
                        utils_1.forEach(
                            currTokType.categoryMatchesMap,
                            function(val, key) {
                                currTokType.categoryMatches.push(
                                    exports.tokenIdxToClass.get(key)
                                        .tokenTypeIdx
                                )
                            }
                        )
                    })
                }
                exports.assignCategoriesTokensProp = assignCategoriesTokensProp
                function assignCategoriesMapProp(tokenTypes) {
                    utils_1.forEach(tokenTypes, function(currTokType) {
                        singleAssignCategoriesToksMap([], currTokType)
                    })
                }
                exports.assignCategoriesMapProp = assignCategoriesMapProp
                function singleAssignCategoriesToksMap(path, nextNode) {
                    utils_1.forEach(path, function(pathNode) {
                        nextNode.categoryMatchesMap[
                            pathNode.tokenTypeIdx
                        ] = true
                    })
                    utils_1.forEach(nextNode.CATEGORIES, function(
                        nextCategory
                    ) {
                        var newPath = path.concat(nextNode)
                        // avoids infinite loops due to cyclic categories.
                        if (!utils_1.contains(newPath, nextCategory)) {
                            singleAssignCategoriesToksMap(newPath, nextCategory)
                        }
                    })
                }
                exports.singleAssignCategoriesToksMap = singleAssignCategoriesToksMap
                function hasShortKeyProperty(tokType) {
                    return utils_1.has(tokType, "tokenTypeIdx")
                }
                exports.hasShortKeyProperty = hasShortKeyProperty
                function hasCategoriesProperty(tokType) {
                    return utils_1.has(tokType, "CATEGORIES")
                }
                exports.hasCategoriesProperty = hasCategoriesProperty
                function hasExtendingTokensTypesProperty(tokType) {
                    return utils_1.has(tokType, "categoryMatches")
                }
                exports.hasExtendingTokensTypesProperty = hasExtendingTokensTypesProperty
                function hasExtendingTokensTypesMapProperty(tokType) {
                    return utils_1.has(tokType, "categoryMatchesMap")
                }
                exports.hasExtendingTokensTypesMapProperty = hasExtendingTokensTypesMapProperty
                function hasTokenNameProperty(tokType) {
                    return utils_1.has(tokType, "tokenName")
                }
                exports.hasTokenNameProperty = hasTokenNameProperty
                function isTokenType(tokType) {
                    return utils_1.has(tokType, "tokenTypeIdx")
                }
                exports.isTokenType = isTokenType
                //# sourceMappingURL=tokens.js.map

                /***/
            },
            /* 8 */
            /***/ function(module, exports, __webpack_require__) {
                "use strict"

                var __extends =
                    (this && this.__extends) ||
                    (function() {
                        var extendStatics = function(d, b) {
                            extendStatics =
                                Object.setPrototypeOf ||
                                ({ __proto__: [] } instanceof Array &&
                                    function(d, b) {
                                        d.__proto__ = b
                                    }) ||
                                function(d, b) {
                                    for (var p in b)
                                        if (b.hasOwnProperty(p)) d[p] = b[p]
                                }
                            return extendStatics(d, b)
                        }
                        return function(d, b) {
                            extendStatics(d, b)
                            function __() {
                                this.constructor = d
                            }
                            d.prototype =
                                b === null
                                    ? Object.create(b)
                                    : ((__.prototype = b.prototype), new __())
                        }
                    })()
                Object.defineProperty(exports, "__esModule", { value: true })
                var utils_1 = __webpack_require__(0)
                var gast_public_1 = __webpack_require__(1)
                var gast_visitor_public_1 = __webpack_require__(5)
                var tokens_public_1 = __webpack_require__(2)
                function isSequenceProd(prod) {
                    return (
                        prod instanceof gast_public_1.Flat ||
                        prod instanceof gast_public_1.Option ||
                        prod instanceof gast_public_1.Repetition ||
                        prod instanceof gast_public_1.RepetitionMandatory ||
                        prod instanceof
                            gast_public_1.RepetitionMandatoryWithSeparator ||
                        prod instanceof gast_public_1.RepetitionWithSeparator ||
                        prod instanceof gast_public_1.Terminal ||
                        prod instanceof gast_public_1.Rule
                    )
                }
                exports.isSequenceProd = isSequenceProd
                function isOptionalProd(prod, alreadyVisited) {
                    if (alreadyVisited === void 0) {
                        alreadyVisited = []
                    }
                    var isDirectlyOptional =
                        prod instanceof gast_public_1.Option ||
                        prod instanceof gast_public_1.Repetition ||
                        prod instanceof gast_public_1.RepetitionWithSeparator
                    if (isDirectlyOptional) {
                        return true
                    }
                    // note that this can cause infinite loop if one optional empty TOP production has a cyclic dependency with another
                    // empty optional top rule
                    // may be indirectly optional ((A?B?C?) | (D?E?F?))
                    if (prod instanceof gast_public_1.Alternation) {
                        // for OR its enough for just one of the alternatives to be optional
                        return utils_1.some(prod.definition, function(subProd) {
                            return isOptionalProd(subProd, alreadyVisited)
                        })
                    } else if (
                        prod instanceof gast_public_1.NonTerminal &&
                        utils_1.contains(alreadyVisited, prod)
                    ) {
                        // avoiding stack overflow due to infinite recursion
                        return false
                    } else if (
                        prod instanceof gast_public_1.AbstractProduction
                    ) {
                        if (prod instanceof gast_public_1.NonTerminal) {
                            alreadyVisited.push(prod)
                        }
                        return utils_1.every(prod.definition, function(
                            subProd
                        ) {
                            return isOptionalProd(subProd, alreadyVisited)
                        })
                    } else {
                        return false
                    }
                }
                exports.isOptionalProd = isOptionalProd
                function isBranchingProd(prod) {
                    return prod instanceof gast_public_1.Alternation
                }
                exports.isBranchingProd = isBranchingProd
                function getProductionDslName(prod) {
                    /* istanbul ignore else */
                    if (prod instanceof gast_public_1.NonTerminal) {
                        return "SUBRULE"
                    } else if (prod instanceof gast_public_1.Option) {
                        return "OPTION"
                    } else if (prod instanceof gast_public_1.Alternation) {
                        return "OR"
                    } else if (
                        prod instanceof gast_public_1.RepetitionMandatory
                    ) {
                        return "AT_LEAST_ONE"
                    } else if (
                        prod instanceof
                        gast_public_1.RepetitionMandatoryWithSeparator
                    ) {
                        return "AT_LEAST_ONE_SEP"
                    } else if (
                        prod instanceof gast_public_1.RepetitionWithSeparator
                    ) {
                        return "MANY_SEP"
                    } else if (prod instanceof gast_public_1.Repetition) {
                        return "MANY"
                    } else if (prod instanceof gast_public_1.Terminal) {
                        return "CONSUME"
                    } else {
                        throw Error("non exhaustive match")
                    }
                }
                exports.getProductionDslName = getProductionDslName
                var DslMethodsCollectorVisitor = /** @class */ (function(
                    _super
                ) {
                    __extends(DslMethodsCollectorVisitor, _super)
                    function DslMethodsCollectorVisitor() {
                        var _this =
                            (_super !== null &&
                                _super.apply(this, arguments)) ||
                            this
                        // A minus is never valid in an identifier name
                        _this.separator = "-"
                        _this.dslMethods = {
                            option: [],
                            alternation: [],
                            repetition: [],
                            repetitionWithSeparator: [],
                            repetitionMandatory: [],
                            repetitionMandatoryWithSeparator: []
                        }
                        return _this
                    }
                    DslMethodsCollectorVisitor.prototype.visitTerminal = function(
                        terminal
                    ) {
                        var key =
                            tokens_public_1.tokenName(terminal.terminalType) +
                            this.separator +
                            "Terminal"
                        if (!utils_1.has(this.dslMethods, key)) {
                            this.dslMethods[key] = []
                        }
                        this.dslMethods[key].push(terminal)
                    }
                    DslMethodsCollectorVisitor.prototype.visitNonTerminal = function(
                        subrule
                    ) {
                        var key =
                            subrule.nonTerminalName +
                            this.separator +
                            "Terminal"
                        if (!utils_1.has(this.dslMethods, key)) {
                            this.dslMethods[key] = []
                        }
                        this.dslMethods[key].push(subrule)
                    }
                    DslMethodsCollectorVisitor.prototype.visitOption = function(
                        option
                    ) {
                        this.dslMethods.option.push(option)
                    }
                    DslMethodsCollectorVisitor.prototype.visitRepetitionWithSeparator = function(
                        manySep
                    ) {
                        this.dslMethods.repetitionWithSeparator.push(manySep)
                    }
                    DslMethodsCollectorVisitor.prototype.visitRepetitionMandatory = function(
                        atLeastOne
                    ) {
                        this.dslMethods.repetitionMandatory.push(atLeastOne)
                    }
                    DslMethodsCollectorVisitor.prototype.visitRepetitionMandatoryWithSeparator = function(
                        atLeastOneSep
                    ) {
                        this.dslMethods.repetitionMandatoryWithSeparator.push(
                            atLeastOneSep
                        )
                    }
                    DslMethodsCollectorVisitor.prototype.visitRepetition = function(
                        many
                    ) {
                        this.dslMethods.repetition.push(many)
                    }
                    DslMethodsCollectorVisitor.prototype.visitAlternation = function(
                        or
                    ) {
                        this.dslMethods.alternation.push(or)
                    }
                    return DslMethodsCollectorVisitor
                })(gast_visitor_public_1.GAstVisitor)
                exports.DslMethodsCollectorVisitor = DslMethodsCollectorVisitor
                //# sourceMappingURL=gast.js.map

                /***/
            },
            /* 9 */
            /***/ function(module, exports, __webpack_require__) {
                "use strict"

                // Lookahead keys are 32Bit integers in the form
                // TTTTTTTTT-ZZZZZZZZZZZZZZZ-YYYY-XXXX
                // XXXX -> Occurrence Index bitmap.
                // YYYY -> DSL Method Name bitmap.
                // ZZZZZZZZZZZZZZZ -> Rule short Index bitmap.
                // TTTTTTTTT -> alternation alternative index bitmap
                Object.defineProperty(exports, "__esModule", { value: true })
                exports.BITS_FOR_METHOD_IDX = 4
                exports.BITS_FOR_OCCURRENCE_IDX = 4
                exports.BITS_FOR_RULE_IDX = 24
                // TODO: validation, this means that there may at most 2^8 --> 256 alternatives for an alternation.
                exports.BITS_FOR_ALT_IDX = 8
                // short string used as part of mapping keys.
                // being short improves the performance when composing KEYS for maps out of these
                // The 5 - 8 bits (16 possible values, are reserved for the DSL method indices)
                /* tslint:disable */
                exports.OR_IDX = 1 << exports.BITS_FOR_METHOD_IDX
                exports.OPTION_IDX = 2 << exports.BITS_FOR_METHOD_IDX
                exports.MANY_IDX = 3 << exports.BITS_FOR_METHOD_IDX
                exports.AT_LEAST_ONE_IDX = 4 << exports.BITS_FOR_METHOD_IDX
                exports.MANY_SEP_IDX = 5 << exports.BITS_FOR_METHOD_IDX
                exports.AT_LEAST_ONE_SEP_IDX = 6 << exports.BITS_FOR_METHOD_IDX
                /* tslint:enable */
                // this actually returns a number, but it is always used as a string (object prop key)
                function getKeyForAutomaticLookahead(
                    ruleIdx,
                    dslMethodIdx,
                    occurrence
                ) {
                    /* tslint:disable */
                    return occurrence | dslMethodIdx | ruleIdx
                    /* tslint:enable */
                }
                exports.getKeyForAutomaticLookahead = getKeyForAutomaticLookahead
                var BITS_START_FOR_ALT_IDX = 32 - exports.BITS_FOR_ALT_IDX
                function getKeyForAltIndex(
                    ruleIdx,
                    dslMethodIdx,
                    occurrence,
                    altIdx
                ) {
                    /* tslint:disable */
                    // alternative indices are zero based, thus must always add one (turn on one bit) to guarantee uniqueness.
                    var altIdxBitMap = (altIdx + 1) << BITS_START_FOR_ALT_IDX
                    return (
                        getKeyForAutomaticLookahead(
                            ruleIdx,
                            dslMethodIdx,
                            occurrence
                        ) | altIdxBitMap
                    )
                    /* tslint:enable */
                }
                exports.getKeyForAltIndex = getKeyForAltIndex
                //# sourceMappingURL=keys.js.map

                /***/
            },
            /* 10 */
            /***/ function(module, exports, __webpack_require__) {
                "use strict"

                Object.defineProperty(exports, "__esModule", { value: true })
                var tokens_public_1 = __webpack_require__(2)
                var utils = __webpack_require__(0)
                var utils_1 = __webpack_require__(0)
                var gast_public_1 = __webpack_require__(1)
                var gast_1 = __webpack_require__(8)
                var checks_1 = __webpack_require__(11)
                var version_1 = __webpack_require__(17)
                var parser_1 = __webpack_require__(3)
                exports.defaultParserErrorProvider = {
                    buildMismatchTokenMessage: function(_a) {
                        var expected = _a.expected,
                            actual = _a.actual,
                            previous = _a.previous,
                            ruleName = _a.ruleName
                        var hasLabel = tokens_public_1.hasTokenLabel(expected)
                        var expectedMsg = hasLabel
                            ? "--> " +
                              tokens_public_1.tokenLabel(expected) +
                              " <--"
                            : "token of type --> " +
                              tokens_public_1.tokenName(expected) +
                              " <--"
                        var msg =
                            "Expecting " +
                            expectedMsg +
                            " but found --> '" +
                            actual.image +
                            "' <--"
                        return msg
                    },
                    buildNotAllInputParsedMessage: function(_a) {
                        var firstRedundant = _a.firstRedundant,
                            ruleName = _a.ruleName
                        return (
                            "Redundant input, expecting EOF but found: " +
                            firstRedundant.image
                        )
                    },
                    buildNoViableAltMessage: function(_a) {
                        var expectedPathsPerAlt = _a.expectedPathsPerAlt,
                            actual = _a.actual,
                            previous = _a.previous,
                            customUserDescription = _a.customUserDescription,
                            ruleName = _a.ruleName
                        var errPrefix = "Expecting: "
                        // TODO: issue: No Viable Alternative Error may have incomplete details. #502
                        var actualText = utils_1.first(actual).image
                        var errSuffix = "\nbut found: '" + actualText + "'"
                        if (customUserDescription) {
                            return errPrefix + customUserDescription + errSuffix
                        } else {
                            var allLookAheadPaths = utils_1.reduce(
                                expectedPathsPerAlt,
                                function(result, currAltPaths) {
                                    return result.concat(currAltPaths)
                                },
                                []
                            )
                            var nextValidTokenSequences = utils_1.map(
                                allLookAheadPaths,
                                function(currPath) {
                                    return (
                                        "[" +
                                        utils_1
                                            .map(currPath, function(
                                                currTokenType
                                            ) {
                                                return tokens_public_1.tokenLabel(
                                                    currTokenType
                                                )
                                            })
                                            .join(", ") +
                                        "]"
                                    )
                                }
                            )
                            var nextValidSequenceItems = utils_1.map(
                                nextValidTokenSequences,
                                function(itemMsg, idx) {
                                    return "  " + (idx + 1) + ". " + itemMsg
                                }
                            )
                            var calculatedDescription =
                                "one of these possible Token sequences:\n" +
                                nextValidSequenceItems.join("\n")
                            return errPrefix + calculatedDescription + errSuffix
                        }
                    },
                    buildEarlyExitMessage: function(_a) {
                        var expectedIterationPaths = _a.expectedIterationPaths,
                            actual = _a.actual,
                            customUserDescription = _a.customUserDescription,
                            ruleName = _a.ruleName
                        var errPrefix = "Expecting: "
                        // TODO: issue: No Viable Alternative Error may have incomplete details. #502
                        var actualText = utils_1.first(actual).image
                        var errSuffix = "\nbut found: '" + actualText + "'"
                        if (customUserDescription) {
                            return errPrefix + customUserDescription + errSuffix
                        } else {
                            var nextValidTokenSequences = utils_1.map(
                                expectedIterationPaths,
                                function(currPath) {
                                    return (
                                        "[" +
                                        utils_1
                                            .map(currPath, function(
                                                currTokenType
                                            ) {
                                                return tokens_public_1.tokenLabel(
                                                    currTokenType
                                                )
                                            })
                                            .join(",") +
                                        "]"
                                    )
                                }
                            )
                            var calculatedDescription =
                                "expecting at least one iteration which starts with one of these possible Token sequences::\n  " +
                                ("<" + nextValidTokenSequences.join(" ,") + ">")
                            return errPrefix + calculatedDescription + errSuffix
                        }
                    }
                }
                Object.freeze(exports.defaultParserErrorProvider)
                exports.defaultGrammarResolverErrorProvider = {
                    buildRuleNotFoundError: function(
                        topLevelRule,
                        undefinedRule
                    ) {
                        var msg =
                            "Invalid grammar, reference to a rule which is not defined: ->" +
                            undefinedRule.nonTerminalName +
                            "<-\n" +
                            "inside top level rule: ->" +
                            topLevelRule.name +
                            "<-"
                        return msg
                    }
                }
                exports.defaultGrammarValidatorErrorProvider = {
                    buildDuplicateFoundError: function(
                        topLevelRule,
                        duplicateProds
                    ) {
                        function getExtraProductionArgument(prod) {
                            if (prod instanceof gast_public_1.Terminal) {
                                return tokens_public_1.tokenName(
                                    prod.terminalType
                                )
                            } else if (
                                prod instanceof gast_public_1.NonTerminal
                            ) {
                                return prod.nonTerminalName
                            } else {
                                return ""
                            }
                        }
                        var topLevelName = topLevelRule.name
                        var duplicateProd = utils_1.first(duplicateProds)
                        var index = duplicateProd.idx
                        var dslName = gast_1.getProductionDslName(duplicateProd)
                        var extraArgument = getExtraProductionArgument(
                            duplicateProd
                        )
                        var msg =
                            "->" +
                            dslName +
                            "<- with numerical suffix: ->" +
                            index +
                            "<-\n                  " +
                            (extraArgument
                                ? "and argument: ->" + extraArgument + "<-"
                                : "") +
                            "\n                  appears more than once (" +
                            duplicateProds.length +
                            " times) in the top level rule: ->" +
                            topLevelName +
                            "<-.\n                  " +
                            (index === 0
                                ? "Also note that numerical suffix 0 means " +
                                  dslName +
                                  " without any suffix."
                                : "") +
                            "\n                  To fix this make sure each usage of " +
                            dslName +
                            " " +
                            (extraArgument
                                ? "with the argument: ->" + extraArgument + "<-"
                                : "") +
                            "\n                  in the rule ->" +
                            topLevelName +
                            "<- has a different occurrence index (0-5), as that combination acts as a unique\n                  position key in the grammar, which is needed by the parsing engine.\n                  \n                  For further details see: https://sap.github.io/chevrotain/docs/FAQ.html#NUMERICAL_SUFFIXES \n                  "
                        // white space trimming time! better to trim afterwards as it allows to use WELL formatted multi line template strings...
                        msg = msg.replace(/[ \t]+/g, " ")
                        msg = msg.replace(/\s\s+/g, "\n")
                        return msg
                    },
                    buildInvalidNestedRuleNameError: function(
                        topLevelRule,
                        nestedProd
                    ) {
                        var msg =
                            "Invalid nested rule name: ->" +
                            nestedProd.name +
                            "<- inside rule: ->" +
                            topLevelRule.name +
                            "<-\n" +
                            ("it must match the pattern: ->" +
                                checks_1.validNestedRuleName.toString() +
                                "<-.\n") +
                            "Note that this means a nested rule name must start with the '$'(dollar) sign."
                        return msg
                    },
                    buildDuplicateNestedRuleNameError: function(
                        topLevelRule,
                        nestedProd
                    ) {
                        var duplicateName = utils_1.first(nestedProd).name
                        var errMsg =
                            "Duplicate nested rule name: ->" +
                            duplicateName +
                            "<- inside rule: ->" +
                            topLevelRule.name +
                            "<-\n" +
                            "A nested name must be unique in the scope of a top level grammar rule."
                        return errMsg
                    },
                    buildNamespaceConflictError: function(rule) {
                        var errMsg =
                            "Namespace conflict found in grammar.\n" +
                            ("The grammar has both a Terminal(Token) and a Non-Terminal(Rule) named: <" +
                                rule.name +
                                ">.\n") +
                            "To resolve this make sure each Terminal and Non-Terminal names are unique\n" +
                            "This is easy to accomplish by using the convention that Terminal names start with an uppercase letter\n" +
                            "and Non-Terminal names start with a lower case letter."
                        return errMsg
                    },
                    buildAlternationPrefixAmbiguityError: function(options) {
                        var pathMsg = utils_1
                            .map(options.prefixPath, function(currTok) {
                                return tokens_public_1.tokenLabel(currTok)
                            })
                            .join(", ")
                        var occurrence =
                            options.alternation.idx === 0
                                ? ""
                                : options.alternation.idx
                        var errMsg =
                            "Ambiguous alternatives: <" +
                            options.ambiguityIndices.join(" ,") +
                            "> due to common lookahead prefix\n" +
                            ("in <OR" +
                                occurrence +
                                "> inside <" +
                                options.topLevelRule.name +
                                "> Rule,\n") +
                            ("<" +
                                pathMsg +
                                "> may appears as a prefix path in all these alternatives.\n") +
                            "https://sap.github.io/chevrotain/docs/guide/resolving_grammar_errors.html#COMMON_PREFIX\n" +
                            "For Further details."
                        return errMsg
                    },
                    buildAlternationAmbiguityError: function(options) {
                        var pathMsg = utils_1
                            .map(options.prefixPath, function(currtok) {
                                return tokens_public_1.tokenLabel(currtok)
                            })
                            .join(", ")
                        var occurrence =
                            options.alternation.idx === 0
                                ? ""
                                : options.alternation.idx
                        var currMessage =
                            "Ambiguous alternatives: <" +
                            options.ambiguityIndices.join(" ,") +
                            "> in <OR" +
                            occurrence +
                            ">" +
                            (" inside <" +
                                options.topLevelRule.name +
                                "> Rule,\n") +
                            ("<" +
                                pathMsg +
                                "> may appears as a prefix path in all these alternatives.\n")
                        var docs_version = version_1.VERSION.replace(/\./g, "_")
                        // Should this information be on the error message or in some common errors docs?
                        currMessage =
                            currMessage +
                            "To Resolve this, try one of of the following: \n" +
                            ("1. Refactor your grammar to be LL(K) for the current value of k (by default k=" +
                                parser_1.DEFAULT_PARSER_CONFIG.maxLookahead +
                                "})\n") +
                            "2. Increase the value of K for your grammar by providing a larger 'maxLookahead' value in the parser's config\n" +
                            "3. This issue can be ignored (if you know what you are doing...), see" +
                            " https://sap.github.io/chevrotain/documentation/" +
                            docs_version +
                            "/interfaces/iparserconfig.html#ignoredissues for more" +
                            " details\n"
                        return currMessage
                    },
                    buildEmptyRepetitionError: function(options) {
                        var dslName = gast_1.getProductionDslName(
                            options.repetition
                        )
                        if (options.repetition.idx !== 0) {
                            dslName += options.repetition.idx
                        }
                        var errMsg =
                            "The repetition <" +
                            dslName +
                            "> within Rule <" +
                            options.topLevelRule.name +
                            "> can never consume any tokens.\n" +
                            "This could lead to an infinite loop."
                        return errMsg
                    },
                    buildTokenNameError: function(options) {
                        var tokTypeName = tokens_public_1.tokenName(
                            options.tokenType
                        )
                        var errMsg =
                            "Invalid Grammar Token name: ->" +
                            tokTypeName +
                            "<- it must match the pattern: ->" +
                            options.expectedPattern.toString() +
                            "<-"
                        return errMsg
                    },
                    buildEmptyAlternationError: function(options) {
                        var errMsg =
                            "Ambiguous empty alternative: <" +
                            (options.emptyChoiceIdx + 1) +
                            ">" +
                            (" in <OR" +
                                options.alternation.idx +
                                "> inside <" +
                                options.topLevelRule.name +
                                "> Rule.\n") +
                            "Only the last alternative may be an empty alternative."
                        return errMsg
                    },
                    buildTooManyAlternativesError: function(options) {
                        var errMsg =
                            "An Alternation cannot have more than 256 alternatives:\n" +
                            ("<OR" +
                                options.alternation.idx +
                                "> inside <" +
                                options.topLevelRule.name +
                                "> Rule.\n has " +
                                (options.alternation.definition.length + 1) +
                                " alternatives.")
                        return errMsg
                    },
                    buildLeftRecursionError: function(options) {
                        var ruleName = options.topLevelRule.name
                        var pathNames = utils.map(
                            options.leftRecursionPath,
                            function(currRule) {
                                return currRule.name
                            }
                        )
                        var leftRecursivePath =
                            ruleName +
                            " --> " +
                            pathNames.concat([ruleName]).join(" --> ")
                        var errMsg =
                            "Left Recursion found in grammar.\n" +
                            ("rule: <" +
                                ruleName +
                                "> can be invoked from itself (directly or indirectly)\n") +
                            ("without consuming any Tokens. The grammar path that causes this is: \n " +
                                leftRecursivePath +
                                "\n") +
                            " To fix this refactor your grammar to remove the left recursion.\n" +
                            "see: https://en.wikipedia.org/wiki/LL_parser#Left_Factoring."
                        return errMsg
                    },
                    buildInvalidRuleNameError: function(options) {
                        var ruleName = options.topLevelRule.name
                        var expectedPatternString = options.expectedPattern.toString()
                        var errMsg =
                            "Invalid grammar rule name: ->" +
                            ruleName +
                            "<- it must match the pattern: ->" +
                            expectedPatternString +
                            "<-"
                        return errMsg
                    },
                    buildDuplicateRuleNameError: function(options) {
                        var ruleName
                        if (
                            options.topLevelRule instanceof gast_public_1.Rule
                        ) {
                            ruleName = options.topLevelRule.name
                        } else {
                            ruleName = options.topLevelRule
                        }
                        var errMsg =
                            "Duplicate definition, rule: ->" +
                            ruleName +
                            "<- is already defined in the grammar: ->" +
                            options.grammarName +
                            "<-"
                        return errMsg
                    }
                }
                //# sourceMappingURL=errors_public.js.map

                /***/
            },
            /* 11 */
            /***/ function(module, exports, __webpack_require__) {
                "use strict"

                var __extends =
                    (this && this.__extends) ||
                    (function() {
                        var extendStatics = function(d, b) {
                            extendStatics =
                                Object.setPrototypeOf ||
                                ({ __proto__: [] } instanceof Array &&
                                    function(d, b) {
                                        d.__proto__ = b
                                    }) ||
                                function(d, b) {
                                    for (var p in b)
                                        if (b.hasOwnProperty(p)) d[p] = b[p]
                                }
                            return extendStatics(d, b)
                        }
                        return function(d, b) {
                            extendStatics(d, b)
                            function __() {
                                this.constructor = d
                            }
                            d.prototype =
                                b === null
                                    ? Object.create(b)
                                    : ((__.prototype = b.prototype), new __())
                        }
                    })()
                Object.defineProperty(exports, "__esModule", { value: true })
                var utils = __webpack_require__(0)
                var utils_1 = __webpack_require__(0)
                var parser_1 = __webpack_require__(3)
                var gast_1 = __webpack_require__(8)
                var tokens_public_1 = __webpack_require__(2)
                var lookahead_1 = __webpack_require__(12)
                var cst_1 = __webpack_require__(16)
                var interpreter_1 = __webpack_require__(13)
                var gast_public_1 = __webpack_require__(1)
                var gast_visitor_public_1 = __webpack_require__(5)
                function validateGrammar(
                    topLevels,
                    maxLookahead,
                    tokenTypes,
                    ignoredIssues,
                    errMsgProvider,
                    grammarName
                ) {
                    var duplicateErrors = utils.map(topLevels, function(
                        currTopLevel
                    ) {
                        return validateDuplicateProductions(
                            currTopLevel,
                            errMsgProvider
                        )
                    })
                    var leftRecursionErrors = utils.map(topLevels, function(
                        currTopRule
                    ) {
                        return validateNoLeftRecursion(
                            currTopRule,
                            currTopRule,
                            errMsgProvider
                        )
                    })
                    var emptyAltErrors = []
                    var ambiguousAltsErrors = []
                    var emptyRepetitionErrors = []
                    // left recursion could cause infinite loops in the following validations.
                    // It is safest to first have the user fix the left recursion errors first and only then examine Further issues.
                    if (utils_1.every(leftRecursionErrors, utils_1.isEmpty)) {
                        emptyAltErrors = utils_1.map(topLevels, function(
                            currTopRule
                        ) {
                            return validateEmptyOrAlternative(
                                currTopRule,
                                errMsgProvider
                            )
                        })
                        ambiguousAltsErrors = utils_1.map(topLevels, function(
                            currTopRule
                        ) {
                            return validateAmbiguousAlternationAlternatives(
                                currTopRule,
                                maxLookahead,
                                ignoredIssues,
                                errMsgProvider
                            )
                        })
                        emptyRepetitionErrors = validateSomeNonEmptyLookaheadPath(
                            topLevels,
                            maxLookahead,
                            errMsgProvider
                        )
                    }
                    var termsNamespaceConflictErrors = checkTerminalAndNoneTerminalsNameSpace(
                        topLevels,
                        tokenTypes,
                        errMsgProvider
                    )
                    var tokenNameErrors = utils.map(tokenTypes, function(
                        currTokType
                    ) {
                        return validateTokenName(currTokType, errMsgProvider)
                    })
                    var nestedRulesNameErrors = validateNestedRulesNames(
                        topLevels,
                        errMsgProvider
                    )
                    var nestedRulesDuplicateErrors = validateDuplicateNestedRules(
                        topLevels,
                        errMsgProvider
                    )
                    var tooManyAltsErrors = utils_1.map(topLevels, function(
                        curRule
                    ) {
                        return validateTooManyAlts(curRule, errMsgProvider)
                    })
                    var ruleNameErrors = utils_1.map(topLevels, function(
                        curRule
                    ) {
                        return validateRuleName(curRule, errMsgProvider)
                    })
                    var duplicateRulesError = utils_1.map(topLevels, function(
                        curRule
                    ) {
                        return validateRuleDoesNotAlreadyExist(
                            curRule,
                            topLevels,
                            grammarName,
                            errMsgProvider
                        )
                    })
                    return utils.flatten(
                        duplicateErrors.concat(
                            tokenNameErrors,
                            nestedRulesNameErrors,
                            nestedRulesDuplicateErrors,
                            emptyRepetitionErrors,
                            leftRecursionErrors,
                            emptyAltErrors,
                            ambiguousAltsErrors,
                            termsNamespaceConflictErrors,
                            tooManyAltsErrors,
                            ruleNameErrors,
                            duplicateRulesError
                        )
                    )
                }
                exports.validateGrammar = validateGrammar
                function validateNestedRulesNames(topLevels, errMsgProvider) {
                    var result = []
                    utils_1.forEach(topLevels, function(curTopLevel) {
                        var namedCollectorVisitor = new cst_1.NamedDSLMethodsCollectorVisitor(
                            ""
                        )
                        curTopLevel.accept(namedCollectorVisitor)
                        var nestedProds = utils_1.map(
                            namedCollectorVisitor.result,
                            function(currItem) {
                                return currItem.orgProd
                            }
                        )
                        result.push(
                            utils_1.map(nestedProds, function(currNestedProd) {
                                return validateNestedRuleName(
                                    curTopLevel,
                                    currNestedProd,
                                    errMsgProvider
                                )
                            })
                        )
                    })
                    return utils_1.flatten(result)
                }
                function validateDuplicateProductions(
                    topLevelRule,
                    errMsgProvider
                ) {
                    var collectorVisitor = new OccurrenceValidationCollector()
                    topLevelRule.accept(collectorVisitor)
                    var allRuleProductions = collectorVisitor.allProductions
                    var productionGroups = utils.groupBy(
                        allRuleProductions,
                        identifyProductionForDuplicates
                    )
                    var duplicates = utils.pick(productionGroups, function(
                        currGroup
                    ) {
                        return currGroup.length > 1
                    })
                    var errors = utils.map(utils.values(duplicates), function(
                        currDuplicates
                    ) {
                        var firstProd = utils.first(currDuplicates)
                        var msg = errMsgProvider.buildDuplicateFoundError(
                            topLevelRule,
                            currDuplicates
                        )
                        var dslName = gast_1.getProductionDslName(firstProd)
                        var defError = {
                            message: msg,
                            type:
                                parser_1.ParserDefinitionErrorType
                                    .DUPLICATE_PRODUCTIONS,
                            ruleName: topLevelRule.name,
                            dslName: dslName,
                            occurrence: firstProd.idx
                        }
                        var param = getExtraProductionArgument(firstProd)
                        if (param) {
                            defError.parameter = param
                        }
                        return defError
                    })
                    return errors
                }
                function identifyProductionForDuplicates(prod) {
                    return (
                        gast_1.getProductionDslName(prod) +
                        "_#_" +
                        prod.idx +
                        "_#_" +
                        getExtraProductionArgument(prod)
                    )
                }
                exports.identifyProductionForDuplicates = identifyProductionForDuplicates
                function getExtraProductionArgument(prod) {
                    if (prod instanceof gast_public_1.Terminal) {
                        return tokens_public_1.tokenName(prod.terminalType)
                    } else if (prod instanceof gast_public_1.NonTerminal) {
                        return prod.nonTerminalName
                    } else {
                        return ""
                    }
                }
                var OccurrenceValidationCollector = /** @class */ (function(
                    _super
                ) {
                    __extends(OccurrenceValidationCollector, _super)
                    function OccurrenceValidationCollector() {
                        var _this =
                            (_super !== null &&
                                _super.apply(this, arguments)) ||
                            this
                        _this.allProductions = []
                        return _this
                    }
                    OccurrenceValidationCollector.prototype.visitNonTerminal = function(
                        subrule
                    ) {
                        this.allProductions.push(subrule)
                    }
                    OccurrenceValidationCollector.prototype.visitOption = function(
                        option
                    ) {
                        this.allProductions.push(option)
                    }
                    OccurrenceValidationCollector.prototype.visitRepetitionWithSeparator = function(
                        manySep
                    ) {
                        this.allProductions.push(manySep)
                    }
                    OccurrenceValidationCollector.prototype.visitRepetitionMandatory = function(
                        atLeastOne
                    ) {
                        this.allProductions.push(atLeastOne)
                    }
                    OccurrenceValidationCollector.prototype.visitRepetitionMandatoryWithSeparator = function(
                        atLeastOneSep
                    ) {
                        this.allProductions.push(atLeastOneSep)
                    }
                    OccurrenceValidationCollector.prototype.visitRepetition = function(
                        many
                    ) {
                        this.allProductions.push(many)
                    }
                    OccurrenceValidationCollector.prototype.visitAlternation = function(
                        or
                    ) {
                        this.allProductions.push(or)
                    }
                    OccurrenceValidationCollector.prototype.visitTerminal = function(
                        terminal
                    ) {
                        this.allProductions.push(terminal)
                    }
                    return OccurrenceValidationCollector
                })(gast_visitor_public_1.GAstVisitor)
                exports.OccurrenceValidationCollector = OccurrenceValidationCollector
                exports.validTermsPattern = /^[a-zA-Z_]\w*$/
                exports.validNestedRuleName = new RegExp(
                    exports.validTermsPattern.source.replace("^", "^\\$")
                )
                function validateRuleName(rule, errMsgProvider) {
                    var errors = []
                    var ruleName = rule.name
                    if (!ruleName.match(exports.validTermsPattern)) {
                        errors.push({
                            message: errMsgProvider.buildInvalidRuleNameError({
                                topLevelRule: rule,
                                expectedPattern: exports.validTermsPattern
                            }),
                            type:
                                parser_1.ParserDefinitionErrorType
                                    .INVALID_RULE_NAME,
                            ruleName: ruleName
                        })
                    }
                    return errors
                }
                exports.validateRuleName = validateRuleName
                function validateNestedRuleName(
                    topLevel,
                    nestedProd,
                    errMsgProvider
                ) {
                    var errors = []
                    var errMsg
                    if (!nestedProd.name.match(exports.validNestedRuleName)) {
                        errMsg = errMsgProvider.buildInvalidNestedRuleNameError(
                            topLevel,
                            nestedProd
                        )
                        errors.push({
                            message: errMsg,
                            type:
                                parser_1.ParserDefinitionErrorType
                                    .INVALID_NESTED_RULE_NAME,
                            ruleName: topLevel.name
                        })
                    }
                    return errors
                }
                exports.validateNestedRuleName = validateNestedRuleName
                function validateTokenName(tokenType, errMsgProvider) {
                    var errors = []
                    var tokTypeName = tokens_public_1.tokenName(tokenType)
                    if (!tokTypeName.match(exports.validTermsPattern)) {
                        errors.push({
                            message: errMsgProvider.buildTokenNameError({
                                tokenType: tokenType,
                                expectedPattern: exports.validTermsPattern
                            }),
                            type:
                                parser_1.ParserDefinitionErrorType
                                    .INVALID_TOKEN_NAME
                        })
                    }
                    return errors
                }
                exports.validateTokenName = validateTokenName
                function validateRuleDoesNotAlreadyExist(
                    rule,
                    allRules,
                    className,
                    errMsgProvider
                ) {
                    var errors = []
                    var occurrences = utils_1.reduce(
                        allRules,
                        function(result, curRule) {
                            if (curRule.name === rule.name) {
                                return result + 1
                            }
                            return result
                        },
                        0
                    )
                    if (occurrences > 1) {
                        var errMsg = errMsgProvider.buildDuplicateRuleNameError(
                            {
                                topLevelRule: rule,
                                grammarName: className
                            }
                        )
                        errors.push({
                            message: errMsg,
                            type:
                                parser_1.ParserDefinitionErrorType
                                    .DUPLICATE_RULE_NAME,
                            ruleName: rule.name
                        })
                    }
                    return errors
                }
                exports.validateRuleDoesNotAlreadyExist = validateRuleDoesNotAlreadyExist
                // TODO: is there anyway to get only the rule names of rules inherited from the super grammars?
                // This is not part of the IGrammarErrorProvider because the validation cannot be performed on
                // The grammar structure, only at runtime.
                function validateRuleIsOverridden(
                    ruleName,
                    definedRulesNames,
                    className
                ) {
                    var errors = []
                    var errMsg
                    if (!utils.contains(definedRulesNames, ruleName)) {
                        errMsg =
                            "Invalid rule override, rule: ->" +
                            ruleName +
                            "<- cannot be overridden in the grammar: ->" +
                            className +
                            "<-" +
                            "as it is not defined in any of the super grammars "
                        errors.push({
                            message: errMsg,
                            type:
                                parser_1.ParserDefinitionErrorType
                                    .INVALID_RULE_OVERRIDE,
                            ruleName: ruleName
                        })
                    }
                    return errors
                }
                exports.validateRuleIsOverridden = validateRuleIsOverridden
                function validateNoLeftRecursion(
                    topRule,
                    currRule,
                    errMsgProvider,
                    path
                ) {
                    if (path === void 0) {
                        path = []
                    }
                    var errors = []
                    var nextNonTerminals = getFirstNoneTerminal(
                        currRule.definition
                    )
                    if (utils.isEmpty(nextNonTerminals)) {
                        return []
                    } else {
                        var ruleName = topRule.name
                        var foundLeftRecursion = utils.contains(
                            nextNonTerminals,
                            topRule
                        )
                        if (foundLeftRecursion) {
                            errors.push({
                                message: errMsgProvider.buildLeftRecursionError(
                                    {
                                        topLevelRule: topRule,
                                        leftRecursionPath: path
                                    }
                                ),
                                type:
                                    parser_1.ParserDefinitionErrorType
                                        .LEFT_RECURSION,
                                ruleName: ruleName
                            })
                        }
                        // we are only looking for cyclic paths leading back to the specific topRule
                        // other cyclic paths are ignored, we still need this difference to avoid infinite loops...
                        var validNextSteps = utils.difference(
                            nextNonTerminals,
                            path.concat([topRule])
                        )
                        var errorsFromNextSteps = utils.map(
                            validNextSteps,
                            function(currRefRule) {
                                var newPath = utils.cloneArr(path)
                                newPath.push(currRefRule)
                                return validateNoLeftRecursion(
                                    topRule,
                                    currRefRule,
                                    errMsgProvider,
                                    newPath
                                )
                            }
                        )
                        return errors.concat(utils.flatten(errorsFromNextSteps))
                    }
                }
                exports.validateNoLeftRecursion = validateNoLeftRecursion
                function getFirstNoneTerminal(definition) {
                    var result = []
                    if (utils.isEmpty(definition)) {
                        return result
                    }
                    var firstProd = utils.first(definition)
                    /* istanbul ignore else */
                    if (firstProd instanceof gast_public_1.NonTerminal) {
                        result.push(firstProd.referencedRule)
                    } else if (
                        firstProd instanceof gast_public_1.Flat ||
                        firstProd instanceof gast_public_1.Option ||
                        firstProd instanceof
                            gast_public_1.RepetitionMandatory ||
                        firstProd instanceof
                            gast_public_1.RepetitionMandatoryWithSeparator ||
                        firstProd instanceof
                            gast_public_1.RepetitionWithSeparator ||
                        firstProd instanceof gast_public_1.Repetition
                    ) {
                        result = result.concat(
                            getFirstNoneTerminal(firstProd.definition)
                        )
                    } else if (firstProd instanceof gast_public_1.Alternation) {
                        // each sub definition in alternation is a FLAT
                        result = utils.flatten(
                            utils.map(firstProd.definition, function(
                                currSubDef
                            ) {
                                return getFirstNoneTerminal(
                                    currSubDef.definition
                                )
                            })
                        )
                    } else if (firstProd instanceof gast_public_1.Terminal) {
                        // nothing to see, move along
                    } else {
                        throw Error("non exhaustive match")
                    }
                    var isFirstOptional = gast_1.isOptionalProd(firstProd)
                    var hasMore = definition.length > 1
                    if (isFirstOptional && hasMore) {
                        var rest = utils.drop(definition)
                        return result.concat(getFirstNoneTerminal(rest))
                    } else {
                        return result
                    }
                }
                exports.getFirstNoneTerminal = getFirstNoneTerminal
                var OrCollector = /** @class */ (function(_super) {
                    __extends(OrCollector, _super)
                    function OrCollector() {
                        var _this =
                            (_super !== null &&
                                _super.apply(this, arguments)) ||
                            this
                        _this.alternations = []
                        return _this
                    }
                    OrCollector.prototype.visitAlternation = function(node) {
                        this.alternations.push(node)
                    }
                    return OrCollector
                })(gast_visitor_public_1.GAstVisitor)
                function validateEmptyOrAlternative(
                    topLevelRule,
                    errMsgProvider
                ) {
                    var orCollector = new OrCollector()
                    topLevelRule.accept(orCollector)
                    var ors = orCollector.alternations
                    var errors = utils.reduce(
                        ors,
                        function(errors, currOr) {
                            var exceptLast = utils.dropRight(currOr.definition)
                            var currErrors = utils.map(exceptLast, function(
                                currAlternative,
                                currAltIdx
                            ) {
                                var possibleFirstInAlt = interpreter_1.nextPossibleTokensAfter(
                                    [currAlternative],
                                    [],
                                    null,
                                    1
                                )
                                if (utils.isEmpty(possibleFirstInAlt)) {
                                    return {
                                        message: errMsgProvider.buildEmptyAlternationError(
                                            {
                                                topLevelRule: topLevelRule,
                                                alternation: currOr,
                                                emptyChoiceIdx: currAltIdx
                                            }
                                        ),
                                        type:
                                            parser_1.ParserDefinitionErrorType
                                                .NONE_LAST_EMPTY_ALT,
                                        ruleName: topLevelRule.name,
                                        occurrence: currOr.idx,
                                        alternative: currAltIdx + 1
                                    }
                                } else {
                                    return null
                                }
                            })
                            return errors.concat(utils.compact(currErrors))
                        },
                        []
                    )
                    return errors
                }
                exports.validateEmptyOrAlternative = validateEmptyOrAlternative
                function validateAmbiguousAlternationAlternatives(
                    topLevelRule,
                    maxLookahead,
                    ignoredIssues,
                    errMsgProvider
                ) {
                    var orCollector = new OrCollector()
                    topLevelRule.accept(orCollector)
                    var ors = orCollector.alternations
                    var ignoredIssuesForCurrentRule =
                        ignoredIssues[topLevelRule.name]
                    if (ignoredIssuesForCurrentRule) {
                        ors = utils_1.reject(ors, function(currOr) {
                            return ignoredIssuesForCurrentRule[
                                gast_1.getProductionDslName(currOr) +
                                    (currOr.idx === 0 ? "" : currOr.idx)
                            ]
                        })
                    }
                    var errors = utils.reduce(
                        ors,
                        function(result, currOr) {
                            var currOccurrence = currOr.idx
                            var alternatives = lookahead_1.getLookaheadPathsForOr(
                                currOccurrence,
                                topLevelRule,
                                maxLookahead
                            )
                            var altsAmbiguityErrors = checkAlternativesAmbiguities(
                                alternatives,
                                currOr,
                                topLevelRule,
                                errMsgProvider
                            )
                            var altsPrefixAmbiguityErrors = checkPrefixAlternativesAmbiguities(
                                alternatives,
                                currOr,
                                topLevelRule,
                                errMsgProvider
                            )
                            return result.concat(
                                altsAmbiguityErrors,
                                altsPrefixAmbiguityErrors
                            )
                        },
                        []
                    )
                    return errors
                }
                exports.validateAmbiguousAlternationAlternatives = validateAmbiguousAlternationAlternatives
                var RepetionCollector = /** @class */ (function(_super) {
                    __extends(RepetionCollector, _super)
                    function RepetionCollector() {
                        var _this =
                            (_super !== null &&
                                _super.apply(this, arguments)) ||
                            this
                        _this.allProductions = []
                        return _this
                    }
                    RepetionCollector.prototype.visitRepetitionWithSeparator = function(
                        manySep
                    ) {
                        this.allProductions.push(manySep)
                    }
                    RepetionCollector.prototype.visitRepetitionMandatory = function(
                        atLeastOne
                    ) {
                        this.allProductions.push(atLeastOne)
                    }
                    RepetionCollector.prototype.visitRepetitionMandatoryWithSeparator = function(
                        atLeastOneSep
                    ) {
                        this.allProductions.push(atLeastOneSep)
                    }
                    RepetionCollector.prototype.visitRepetition = function(
                        many
                    ) {
                        this.allProductions.push(many)
                    }
                    return RepetionCollector
                })(gast_visitor_public_1.GAstVisitor)
                exports.RepetionCollector = RepetionCollector
                function validateTooManyAlts(topLevelRule, errMsgProvider) {
                    var orCollector = new OrCollector()
                    topLevelRule.accept(orCollector)
                    var ors = orCollector.alternations
                    var errors = utils.reduce(
                        ors,
                        function(errors, currOr) {
                            if (currOr.definition.length > 255) {
                                errors.push({
                                    message: errMsgProvider.buildTooManyAlternativesError(
                                        {
                                            topLevelRule: topLevelRule,
                                            alternation: currOr
                                        }
                                    ),
                                    type:
                                        parser_1.ParserDefinitionErrorType
                                            .TOO_MANY_ALTS,
                                    ruleName: topLevelRule.name,
                                    occurrence: currOr.idx
                                })
                            }
                            return errors
                        },
                        []
                    )
                    return errors
                }
                exports.validateTooManyAlts = validateTooManyAlts
                function validateSomeNonEmptyLookaheadPath(
                    topLevelRules,
                    maxLookahead,
                    errMsgProvider
                ) {
                    var errors = []
                    utils_1.forEach(topLevelRules, function(currTopRule) {
                        var collectorVisitor = new RepetionCollector()
                        currTopRule.accept(collectorVisitor)
                        var allRuleProductions = collectorVisitor.allProductions
                        utils_1.forEach(allRuleProductions, function(currProd) {
                            var prodType = lookahead_1.getProdType(currProd)
                            var currOccurrence = currProd.idx
                            var paths = lookahead_1.getLookaheadPathsForOptionalProd(
                                currOccurrence,
                                currTopRule,
                                prodType,
                                maxLookahead
                            )
                            var pathsInsideProduction = paths[0]
                            if (
                                utils_1.isEmpty(
                                    utils_1.flatten(pathsInsideProduction)
                                )
                            ) {
                                var errMsg = errMsgProvider.buildEmptyRepetitionError(
                                    {
                                        topLevelRule: currTopRule,
                                        repetition: currProd
                                    }
                                )
                                errors.push({
                                    message: errMsg,
                                    type:
                                        parser_1.ParserDefinitionErrorType
                                            .NO_NON_EMPTY_LOOKAHEAD,
                                    ruleName: currTopRule.name
                                })
                            }
                        })
                    })
                    return errors
                }
                exports.validateSomeNonEmptyLookaheadPath = validateSomeNonEmptyLookaheadPath
                function checkAlternativesAmbiguities(
                    alternatives,
                    alternation,
                    rule,
                    errMsgProvider
                ) {
                    var foundAmbiguousPaths = []
                    var identicalAmbiguities = utils_1.reduce(
                        alternatives,
                        function(result, currAlt, currAltIdx) {
                            utils_1.forEach(currAlt, function(currPath) {
                                var altsCurrPathAppearsIn = [currAltIdx]
                                utils_1.forEach(alternatives, function(
                                    currOtherAlt,
                                    currOtherAltIdx
                                ) {
                                    if (
                                        currAltIdx !== currOtherAltIdx &&
                                        lookahead_1.containsPath(
                                            currOtherAlt,
                                            currPath
                                        )
                                    ) {
                                        altsCurrPathAppearsIn.push(
                                            currOtherAltIdx
                                        )
                                    }
                                })
                                if (
                                    altsCurrPathAppearsIn.length > 1 &&
                                    !lookahead_1.containsPath(
                                        foundAmbiguousPaths,
                                        currPath
                                    )
                                ) {
                                    foundAmbiguousPaths.push(currPath)
                                    result.push({
                                        alts: altsCurrPathAppearsIn,
                                        path: currPath
                                    })
                                }
                            })
                            return result
                        },
                        []
                    )
                    var currErrors = utils.map(identicalAmbiguities, function(
                        currAmbDescriptor
                    ) {
                        var ambgIndices = utils_1.map(
                            currAmbDescriptor.alts,
                            function(currAltIdx) {
                                return currAltIdx + 1
                            }
                        )
                        var currMessage = errMsgProvider.buildAlternationAmbiguityError(
                            {
                                topLevelRule: rule,
                                alternation: alternation,
                                ambiguityIndices: ambgIndices,
                                prefixPath: currAmbDescriptor.path
                            }
                        )
                        return {
                            message: currMessage,
                            type:
                                parser_1.ParserDefinitionErrorType
                                    .AMBIGUOUS_ALTS,
                            ruleName: rule.name,
                            occurrence: alternation.idx,
                            alternatives: [currAmbDescriptor.alts]
                        }
                    })
                    return currErrors
                }
                function checkPrefixAlternativesAmbiguities(
                    alternatives,
                    alternation,
                    rule,
                    errMsgProvider
                ) {
                    var errors = []
                    // flatten
                    var pathsAndIndices = utils_1.reduce(
                        alternatives,
                        function(result, currAlt, idx) {
                            var currPathsAndIdx = utils_1.map(currAlt, function(
                                currPath
                            ) {
                                return { idx: idx, path: currPath }
                            })
                            return result.concat(currPathsAndIdx)
                        },
                        []
                    )
                    utils_1.forEach(pathsAndIndices, function(currPathAndIdx) {
                        var targetIdx = currPathAndIdx.idx
                        var targetPath = currPathAndIdx.path
                        var prefixAmbiguitiesPathsAndIndices = utils_1.findAll(
                            pathsAndIndices,
                            function(searchPathAndIdx) {
                                // prefix ambiguity can only be created from lower idx (higher priority) path
                                return (
                                    searchPathAndIdx.idx < targetIdx &&
                                    // checking for strict prefix because identical lookaheads
                                    // will be be detected using a different validation.
                                    lookahead_1.isStrictPrefixOfPath(
                                        searchPathAndIdx.path,
                                        targetPath
                                    )
                                )
                            }
                        )
                        var currPathPrefixErrors = utils_1.map(
                            prefixAmbiguitiesPathsAndIndices,
                            function(currAmbPathAndIdx) {
                                var ambgIndices = [
                                    currAmbPathAndIdx.idx + 1,
                                    targetIdx + 1
                                ]
                                var occurrence =
                                    alternation.idx === 0 ? "" : alternation.idx
                                var message = errMsgProvider.buildAlternationPrefixAmbiguityError(
                                    {
                                        topLevelRule: rule,
                                        alternation: alternation,
                                        ambiguityIndices: ambgIndices,
                                        prefixPath: currAmbPathAndIdx.path
                                    }
                                )
                                return {
                                    message: message,
                                    type:
                                        parser_1.ParserDefinitionErrorType
                                            .AMBIGUOUS_PREFIX_ALTS,
                                    ruleName: rule.name,
                                    occurrence: occurrence,
                                    alternatives: ambgIndices
                                }
                            }
                        )
                        errors = errors.concat(currPathPrefixErrors)
                    })
                    return errors
                }
                exports.checkPrefixAlternativesAmbiguities = checkPrefixAlternativesAmbiguities
                function checkTerminalAndNoneTerminalsNameSpace(
                    topLevels,
                    tokenTypes,
                    errMsgProvider
                ) {
                    var errors = []
                    var tokenNames = utils_1.map(tokenTypes, function(
                        currToken
                    ) {
                        return tokens_public_1.tokenName(currToken)
                    })
                    utils_1.forEach(topLevels, function(currRule) {
                        var currRuleName = currRule.name
                        if (utils_1.contains(tokenNames, currRuleName)) {
                            var errMsg = errMsgProvider.buildNamespaceConflictError(
                                currRule
                            )
                            errors.push({
                                message: errMsg,
                                type:
                                    parser_1.ParserDefinitionErrorType
                                        .CONFLICT_TOKENS_RULES_NAMESPACE,
                                ruleName: currRuleName
                            })
                        }
                    })
                    return errors
                }
                function validateDuplicateNestedRules(
                    topLevelRules,
                    errMsgProvider
                ) {
                    var errors = []
                    utils_1.forEach(topLevelRules, function(currTopRule) {
                        var namedCollectorVisitor = new cst_1.NamedDSLMethodsCollectorVisitor(
                            ""
                        )
                        currTopRule.accept(namedCollectorVisitor)
                        var prodsByGroup = utils_1.groupBy(
                            namedCollectorVisitor.result,
                            function(item) {
                                return item.name
                            }
                        )
                        var duplicates = utils_1.pick(prodsByGroup, function(
                            currGroup
                        ) {
                            return currGroup.length > 1
                        })
                        utils_1.forEach(utils_1.values(duplicates), function(
                            currDupGroup
                        ) {
                            var currDupProds = utils_1.map(
                                currDupGroup,
                                function(dupGroup) {
                                    return dupGroup.orgProd
                                }
                            )
                            var errMsg = errMsgProvider.buildDuplicateNestedRuleNameError(
                                currTopRule,
                                currDupProds
                            )
                            errors.push({
                                message: errMsg,
                                type:
                                    parser_1.ParserDefinitionErrorType
                                        .DUPLICATE_NESTED_NAME,
                                ruleName: currTopRule.name
                            })
                        })
                    })
                    return errors
                }
                //# sourceMappingURL=checks.js.map

                /***/
            },
            /* 12 */
            /***/ function(module, exports, __webpack_require__) {
                "use strict"

                var __extends =
                    (this && this.__extends) ||
                    (function() {
                        var extendStatics = function(d, b) {
                            extendStatics =
                                Object.setPrototypeOf ||
                                ({ __proto__: [] } instanceof Array &&
                                    function(d, b) {
                                        d.__proto__ = b
                                    }) ||
                                function(d, b) {
                                    for (var p in b)
                                        if (b.hasOwnProperty(p)) d[p] = b[p]
                                }
                            return extendStatics(d, b)
                        }
                        return function(d, b) {
                            extendStatics(d, b)
                            function __() {
                                this.constructor = d
                            }
                            d.prototype =
                                b === null
                                    ? Object.create(b)
                                    : ((__.prototype = b.prototype), new __())
                        }
                    })()
                Object.defineProperty(exports, "__esModule", { value: true })
                var utils_1 = __webpack_require__(0)
                var interpreter_1 = __webpack_require__(13)
                var rest_1 = __webpack_require__(14)
                var tokens_1 = __webpack_require__(7)
                var gast_public_1 = __webpack_require__(1)
                var gast_visitor_public_1 = __webpack_require__(5)
                var PROD_TYPE
                ;(function(PROD_TYPE) {
                    PROD_TYPE[(PROD_TYPE["OPTION"] = 0)] = "OPTION"
                    PROD_TYPE[(PROD_TYPE["REPETITION"] = 1)] = "REPETITION"
                    PROD_TYPE[(PROD_TYPE["REPETITION_MANDATORY"] = 2)] =
                        "REPETITION_MANDATORY"
                    PROD_TYPE[
                        (PROD_TYPE["REPETITION_MANDATORY_WITH_SEPARATOR"] = 3)
                    ] = "REPETITION_MANDATORY_WITH_SEPARATOR"
                    PROD_TYPE[(PROD_TYPE["REPETITION_WITH_SEPARATOR"] = 4)] =
                        "REPETITION_WITH_SEPARATOR"
                    PROD_TYPE[(PROD_TYPE["ALTERNATION"] = 5)] = "ALTERNATION"
                })((PROD_TYPE = exports.PROD_TYPE || (exports.PROD_TYPE = {})))
                function getProdType(prod) {
                    /* istanbul ignore else */
                    if (prod instanceof gast_public_1.Option) {
                        return PROD_TYPE.OPTION
                    } else if (prod instanceof gast_public_1.Repetition) {
                        return PROD_TYPE.REPETITION
                    } else if (
                        prod instanceof gast_public_1.RepetitionMandatory
                    ) {
                        return PROD_TYPE.REPETITION_MANDATORY
                    } else if (
                        prod instanceof
                        gast_public_1.RepetitionMandatoryWithSeparator
                    ) {
                        return PROD_TYPE.REPETITION_MANDATORY_WITH_SEPARATOR
                    } else if (
                        prod instanceof gast_public_1.RepetitionWithSeparator
                    ) {
                        return PROD_TYPE.REPETITION_WITH_SEPARATOR
                    } else if (prod instanceof gast_public_1.Alternation) {
                        return PROD_TYPE.ALTERNATION
                    } else {
                        throw Error("non exhaustive match")
                    }
                }
                exports.getProdType = getProdType
                function buildLookaheadFuncForOr(
                    occurrence,
                    ruleGrammar,
                    k,
                    hasPredicates,
                    dynamicTokensEnabled,
                    laFuncBuilder
                ) {
                    var lookAheadPaths = getLookaheadPathsForOr(
                        occurrence,
                        ruleGrammar,
                        k
                    )
                    var tokenMatcher = areTokenCategoriesNotUsed(lookAheadPaths)
                        ? tokens_1.tokenStructuredMatcherNoCategories
                        : tokens_1.tokenStructuredMatcher
                    return laFuncBuilder(
                        lookAheadPaths,
                        hasPredicates,
                        tokenMatcher,
                        dynamicTokensEnabled
                    )
                }
                exports.buildLookaheadFuncForOr = buildLookaheadFuncForOr
                /**
                 *  When dealing with an Optional production (OPTION/MANY/2nd iteration of AT_LEAST_ONE/...) we need to compare
                 *  the lookahead "inside" the production and the lookahead immediately "after" it in the same top level rule (context free).
                 *
                 *  Example: given a production:
                 *  ABC(DE)?DF
                 *
                 *  The optional '(DE)?' should only be entered if we see 'DE'. a single Token 'D' is not sufficient to distinguish between the two
                 *  alternatives.
                 *
                 *  @returns A Lookahead function which will return true IFF the parser should parse the Optional production.
                 */
                function buildLookaheadFuncForOptionalProd(
                    occurrence,
                    ruleGrammar,
                    k,
                    dynamicTokensEnabled,
                    prodType,
                    lookaheadBuilder
                ) {
                    var lookAheadPaths = getLookaheadPathsForOptionalProd(
                        occurrence,
                        ruleGrammar,
                        prodType,
                        k
                    )
                    var tokenMatcher = areTokenCategoriesNotUsed(lookAheadPaths)
                        ? tokens_1.tokenStructuredMatcherNoCategories
                        : tokens_1.tokenStructuredMatcher
                    return lookaheadBuilder(
                        lookAheadPaths[0],
                        tokenMatcher,
                        dynamicTokensEnabled
                    )
                }
                exports.buildLookaheadFuncForOptionalProd = buildLookaheadFuncForOptionalProd
                function buildAlternativesLookAheadFunc(
                    alts,
                    hasPredicates,
                    tokenMatcher,
                    dynamicTokensEnabled
                ) {
                    var numOfAlts = alts.length
                    var areAllOneTokenLookahead = utils_1.every(alts, function(
                        currAlt
                    ) {
                        return utils_1.every(currAlt, function(currPath) {
                            return currPath.length === 1
                        })
                    })
                    // This version takes into account the predicates as well.
                    if (hasPredicates) {
                        /**
                         * @returns {number} - The chosen alternative index
                         */
                        return function(orAlts) {
                            // unfortunately the predicates must be extracted every single time
                            // as they cannot be cached due to references to parameters(vars) which are no longer valid.
                            // note that in the common case of no predicates, no cpu time will be wasted on this (see else block)
                            var predicates = utils_1.map(orAlts, function(
                                currAlt
                            ) {
                                return currAlt.GATE
                            })
                            for (var t = 0; t < numOfAlts; t++) {
                                var currAlt = alts[t]
                                var currNumOfPaths = currAlt.length
                                var currPredicate = predicates[t]
                                if (
                                    currPredicate !== undefined &&
                                    currPredicate.call(this) === false
                                ) {
                                    // if the predicate does not match there is no point in checking the paths
                                    continue
                                }
                                nextPath: for (
                                    var j = 0;
                                    j < currNumOfPaths;
                                    j++
                                ) {
                                    var currPath = currAlt[j]
                                    var currPathLength = currPath.length
                                    for (var i = 0; i < currPathLength; i++) {
                                        var nextToken = this.LA(i + 1)
                                        if (
                                            tokenMatcher(
                                                nextToken,
                                                currPath[i]
                                            ) === false
                                        ) {
                                            // mismatch in current path
                                            // try the next pth
                                            continue nextPath
                                        }
                                    }
                                    // found a full path that matches.
                                    // this will also work for an empty ALT as the loop will be skipped
                                    return t
                                }
                                // none of the paths for the current alternative matched
                                // try the next alternative
                            }
                            // none of the alternatives could be matched
                            return undefined
                        }
                    } else if (
                        areAllOneTokenLookahead &&
                        !dynamicTokensEnabled
                    ) {
                        // optimized (common) case of all the lookaheads paths requiring only
                        // a single token lookahead. These Optimizations cannot work if dynamically defined Tokens are used.
                        var singleTokenAlts = utils_1.map(alts, function(
                            currAlt
                        ) {
                            return utils_1.flatten(currAlt)
                        })
                        var choiceToAlt_1 = utils_1.reduce(
                            singleTokenAlts,
                            function(result, currAlt, idx) {
                                utils_1.forEach(currAlt, function(currTokType) {
                                    if (
                                        !utils_1.has(
                                            result,
                                            currTokType.tokenTypeIdx
                                        )
                                    ) {
                                        result[currTokType.tokenTypeIdx] = idx
                                    }
                                    utils_1.forEach(
                                        currTokType.categoryMatches,
                                        function(currExtendingType) {
                                            if (
                                                !utils_1.has(
                                                    result,
                                                    currExtendingType
                                                )
                                            ) {
                                                result[currExtendingType] = idx
                                            }
                                        }
                                    )
                                })
                                return result
                            },
                            []
                        )
                        /**
                         * @returns {number} - The chosen alternative index
                         */
                        return function() {
                            var nextToken = this.LA(1)
                            return choiceToAlt_1[nextToken.tokenTypeIdx]
                        }
                    } else {
                        // optimized lookahead without needing to check the predicates at all.
                        // this causes code duplication which is intentional to improve performance.
                        /**
                         * @returns {number} - The chosen alternative index
                         */
                        return function() {
                            for (var t = 0; t < numOfAlts; t++) {
                                var currAlt = alts[t]
                                var currNumOfPaths = currAlt.length
                                nextPath: for (
                                    var j = 0;
                                    j < currNumOfPaths;
                                    j++
                                ) {
                                    var currPath = currAlt[j]
                                    var currPathLength = currPath.length
                                    for (var i = 0; i < currPathLength; i++) {
                                        var nextToken = this.LA(i + 1)
                                        if (
                                            tokenMatcher(
                                                nextToken,
                                                currPath[i]
                                            ) === false
                                        ) {
                                            // mismatch in current path
                                            // try the next pth
                                            continue nextPath
                                        }
                                    }
                                    // found a full path that matches.
                                    // this will also work for an empty ALT as the loop will be skipped
                                    return t
                                }
                                // none of the paths for the current alternative matched
                                // try the next alternative
                            }
                            // none of the alternatives could be matched
                            return undefined
                        }
                    }
                }
                exports.buildAlternativesLookAheadFunc = buildAlternativesLookAheadFunc
                function buildSingleAlternativeLookaheadFunction(
                    alt,
                    tokenMatcher,
                    dynamicTokensEnabled
                ) {
                    var areAllOneTokenLookahead = utils_1.every(alt, function(
                        currPath
                    ) {
                        return currPath.length === 1
                    })
                    var numOfPaths = alt.length
                    // optimized (common) case of all the lookaheads paths requiring only
                    // a single token lookahead.
                    if (areAllOneTokenLookahead && !dynamicTokensEnabled) {
                        var singleTokensTypes = utils_1.flatten(alt)
                        if (
                            singleTokensTypes.length === 1 &&
                            utils_1.isEmpty(
                                singleTokensTypes[0].categoryMatches
                            )
                        ) {
                            var expectedTokenType = singleTokensTypes[0]
                            var expectedTokenUniqueKey_1 =
                                expectedTokenType.tokenTypeIdx
                            return function() {
                                return (
                                    this.LA(1).tokenTypeIdx ===
                                    expectedTokenUniqueKey_1
                                )
                            }
                        } else {
                            var choiceToAlt_2 = utils_1.reduce(
                                singleTokensTypes,
                                function(result, currTokType, idx) {
                                    result[currTokType.tokenTypeIdx] = true
                                    utils_1.forEach(
                                        currTokType.categoryMatches,
                                        function(currExtendingType) {
                                            result[currExtendingType] = true
                                        }
                                    )
                                    return result
                                },
                                []
                            )
                            return function() {
                                var nextToken = this.LA(1)
                                return (
                                    choiceToAlt_2[nextToken.tokenTypeIdx] ===
                                    true
                                )
                            }
                        }
                    } else {
                        return function() {
                            nextPath: for (var j = 0; j < numOfPaths; j++) {
                                var currPath = alt[j]
                                var currPathLength = currPath.length
                                for (var i = 0; i < currPathLength; i++) {
                                    var nextToken = this.LA(i + 1)
                                    if (
                                        tokenMatcher(nextToken, currPath[i]) ===
                                        false
                                    ) {
                                        // mismatch in current path
                                        // try the next pth
                                        continue nextPath
                                    }
                                }
                                // found a full path that matches.
                                return true
                            }
                            // none of the paths matched
                            return false
                        }
                    }
                }
                exports.buildSingleAlternativeLookaheadFunction = buildSingleAlternativeLookaheadFunction
                var RestDefinitionFinderWalker = /** @class */ (function(
                    _super
                ) {
                    __extends(RestDefinitionFinderWalker, _super)
                    function RestDefinitionFinderWalker(
                        topProd,
                        targetOccurrence,
                        targetProdType
                    ) {
                        var _this = _super.call(this) || this
                        _this.topProd = topProd
                        _this.targetOccurrence = targetOccurrence
                        _this.targetProdType = targetProdType
                        return _this
                    }
                    RestDefinitionFinderWalker.prototype.startWalking = function() {
                        this.walk(this.topProd)
                        return this.restDef
                    }
                    RestDefinitionFinderWalker.prototype.checkIsTarget = function(
                        node,
                        expectedProdType,
                        currRest,
                        prevRest
                    ) {
                        if (
                            node.idx === this.targetOccurrence &&
                            this.targetProdType === expectedProdType
                        ) {
                            this.restDef = currRest.concat(prevRest)
                            return true
                        }
                        // performance optimization, do not iterate over the entire Grammar ast after we have found the target
                        return false
                    }
                    RestDefinitionFinderWalker.prototype.walkOption = function(
                        optionProd,
                        currRest,
                        prevRest
                    ) {
                        if (
                            !this.checkIsTarget(
                                optionProd,
                                PROD_TYPE.OPTION,
                                currRest,
                                prevRest
                            )
                        ) {
                            _super.prototype.walkOption.call(
                                this,
                                optionProd,
                                currRest,
                                prevRest
                            )
                        }
                    }
                    RestDefinitionFinderWalker.prototype.walkAtLeastOne = function(
                        atLeastOneProd,
                        currRest,
                        prevRest
                    ) {
                        if (
                            !this.checkIsTarget(
                                atLeastOneProd,
                                PROD_TYPE.REPETITION_MANDATORY,
                                currRest,
                                prevRest
                            )
                        ) {
                            _super.prototype.walkOption.call(
                                this,
                                atLeastOneProd,
                                currRest,
                                prevRest
                            )
                        }
                    }
                    RestDefinitionFinderWalker.prototype.walkAtLeastOneSep = function(
                        atLeastOneSepProd,
                        currRest,
                        prevRest
                    ) {
                        if (
                            !this.checkIsTarget(
                                atLeastOneSepProd,
                                PROD_TYPE.REPETITION_MANDATORY_WITH_SEPARATOR,
                                currRest,
                                prevRest
                            )
                        ) {
                            _super.prototype.walkOption.call(
                                this,
                                atLeastOneSepProd,
                                currRest,
                                prevRest
                            )
                        }
                    }
                    RestDefinitionFinderWalker.prototype.walkMany = function(
                        manyProd,
                        currRest,
                        prevRest
                    ) {
                        if (
                            !this.checkIsTarget(
                                manyProd,
                                PROD_TYPE.REPETITION,
                                currRest,
                                prevRest
                            )
                        ) {
                            _super.prototype.walkOption.call(
                                this,
                                manyProd,
                                currRest,
                                prevRest
                            )
                        }
                    }
                    RestDefinitionFinderWalker.prototype.walkManySep = function(
                        manySepProd,
                        currRest,
                        prevRest
                    ) {
                        if (
                            !this.checkIsTarget(
                                manySepProd,
                                PROD_TYPE.REPETITION_WITH_SEPARATOR,
                                currRest,
                                prevRest
                            )
                        ) {
                            _super.prototype.walkOption.call(
                                this,
                                manySepProd,
                                currRest,
                                prevRest
                            )
                        }
                    }
                    return RestDefinitionFinderWalker
                })(rest_1.RestWalker)
                /**
                 * Returns the definition of a target production in a top level level rule.
                 */
                var InsideDefinitionFinderVisitor = /** @class */ (function(
                    _super
                ) {
                    __extends(InsideDefinitionFinderVisitor, _super)
                    function InsideDefinitionFinderVisitor(
                        targetOccurrence,
                        targetProdType
                    ) {
                        var _this = _super.call(this) || this
                        _this.targetOccurrence = targetOccurrence
                        _this.targetProdType = targetProdType
                        _this.result = []
                        return _this
                    }
                    InsideDefinitionFinderVisitor.prototype.checkIsTarget = function(
                        node,
                        expectedProdName
                    ) {
                        if (
                            node.idx === this.targetOccurrence &&
                            this.targetProdType === expectedProdName
                        ) {
                            this.result = node.definition
                        }
                    }
                    InsideDefinitionFinderVisitor.prototype.visitOption = function(
                        node
                    ) {
                        this.checkIsTarget(node, PROD_TYPE.OPTION)
                    }
                    InsideDefinitionFinderVisitor.prototype.visitRepetition = function(
                        node
                    ) {
                        this.checkIsTarget(node, PROD_TYPE.REPETITION)
                    }
                    InsideDefinitionFinderVisitor.prototype.visitRepetitionMandatory = function(
                        node
                    ) {
                        this.checkIsTarget(node, PROD_TYPE.REPETITION_MANDATORY)
                    }
                    InsideDefinitionFinderVisitor.prototype.visitRepetitionMandatoryWithSeparator = function(
                        node
                    ) {
                        this.checkIsTarget(
                            node,
                            PROD_TYPE.REPETITION_MANDATORY_WITH_SEPARATOR
                        )
                    }
                    InsideDefinitionFinderVisitor.prototype.visitRepetitionWithSeparator = function(
                        node
                    ) {
                        this.checkIsTarget(
                            node,
                            PROD_TYPE.REPETITION_WITH_SEPARATOR
                        )
                    }
                    InsideDefinitionFinderVisitor.prototype.visitAlternation = function(
                        node
                    ) {
                        this.checkIsTarget(node, PROD_TYPE.ALTERNATION)
                    }
                    return InsideDefinitionFinderVisitor
                })(gast_visitor_public_1.GAstVisitor)
                function lookAheadSequenceFromAlternatives(altsDefs, k) {
                    function getOtherPaths(pathsAndSuffixes, filterIdx) {
                        return utils_1.reduce(
                            pathsAndSuffixes,
                            function(result, currPathsAndSuffixes, currIdx) {
                                if (currIdx !== filterIdx) {
                                    var currPartialPaths = utils_1.map(
                                        currPathsAndSuffixes,
                                        function(singlePathAndSuffix) {
                                            return singlePathAndSuffix.partialPath
                                        }
                                    )
                                    return result.concat(currPartialPaths)
                                }
                                return result
                            },
                            []
                        )
                    }
                    function isUniquePrefix(arr, item) {
                        return (
                            utils_1.find(arr, function(currOtherPath) {
                                return utils_1.every(item, function(
                                    currPathTok,
                                    idx
                                ) {
                                    return possibleTokenTypeMatch(
                                        currPathTok,
                                        currOtherPath[idx]
                                    )
                                })
                            }) === undefined
                        )
                    }
                    function possibleTokenTypeMatch(tokTypeA, tokTypeB) {
                        return (
                            tokTypeA === tokTypeB ||
                            (tokTypeA &&
                                tokTypeB &&
                                (tokTypeA.categoryMatchesMap[
                                    tokTypeB.tokenTypeIdx
                                ] ||
                                    tokTypeB.categoryMatchesMap[
                                        tokTypeA.tokenTypeIdx
                                    ]))
                        )
                    }
                    function initializeArrayOfArrays(size) {
                        var result = []
                        for (var i = 0; i < size; i++) {
                            result.push([])
                        }
                        return result
                    }
                    var partialAlts = utils_1.map(altsDefs, function(currAlt) {
                        return interpreter_1.possiblePathsFrom([currAlt], 1)
                    })
                    var finalResult = initializeArrayOfArrays(
                        partialAlts.length
                    )
                    var newData = partialAlts
                    // maxLookahead loop
                    for (var pathLength = 1; pathLength <= k; pathLength++) {
                        var currDataset = newData
                        newData = initializeArrayOfArrays(currDataset.length)
                        // alternatives loop
                        for (
                            var resultIdx = 0;
                            resultIdx < currDataset.length;
                            resultIdx++
                        ) {
                            var currAltPathsAndSuffixes = currDataset[resultIdx]
                            var otherPaths = getOtherPaths(
                                currDataset,
                                resultIdx
                            )
                            // paths in current alternative loop
                            for (
                                var currPathIdx = 0;
                                currPathIdx < currAltPathsAndSuffixes.length;
                                currPathIdx++
                            ) {
                                var currPathPrefix =
                                    currAltPathsAndSuffixes[currPathIdx]
                                        .partialPath
                                var suffixDef =
                                    currAltPathsAndSuffixes[currPathIdx]
                                        .suffixDef
                                var isUnique = isUniquePrefix(
                                    otherPaths,
                                    currPathPrefix
                                )
                                // even if a path is not unique, but there are no longer alternatives to try
                                // or if we have reached the maximum lookahead (k) permitted.
                                if (
                                    isUnique ||
                                    utils_1.isEmpty(suffixDef) ||
                                    currPathPrefix.length === k
                                ) {
                                    var currAltResult = finalResult[resultIdx]
                                    if (
                                        !containsPath(
                                            currAltResult,
                                            currPathPrefix
                                        )
                                    ) {
                                        currAltResult.push(currPathPrefix)
                                    }
                                } else {
                                    var newPartialPathsAndSuffixes = interpreter_1.possiblePathsFrom(
                                        suffixDef,
                                        pathLength + 1,
                                        currPathPrefix
                                    )
                                    newData[resultIdx] = newData[
                                        resultIdx
                                    ].concat(newPartialPathsAndSuffixes)
                                }
                            }
                        }
                    }
                    return finalResult
                }
                exports.lookAheadSequenceFromAlternatives = lookAheadSequenceFromAlternatives
                function getLookaheadPathsForOr(occurrence, ruleGrammar, k) {
                    var visitor = new InsideDefinitionFinderVisitor(
                        occurrence,
                        PROD_TYPE.ALTERNATION
                    )
                    ruleGrammar.accept(visitor)
                    return lookAheadSequenceFromAlternatives(visitor.result, k)
                }
                exports.getLookaheadPathsForOr = getLookaheadPathsForOr
                function getLookaheadPathsForOptionalProd(
                    occurrence,
                    ruleGrammar,
                    prodType,
                    k
                ) {
                    var insideDefVisitor = new InsideDefinitionFinderVisitor(
                        occurrence,
                        prodType
                    )
                    ruleGrammar.accept(insideDefVisitor)
                    var insideDef = insideDefVisitor.result
                    var afterDefWalker = new RestDefinitionFinderWalker(
                        ruleGrammar,
                        occurrence,
                        prodType
                    )
                    var afterDef = afterDefWalker.startWalking()
                    var insideFlat = new gast_public_1.Flat({
                        definition: insideDef
                    })
                    var afterFlat = new gast_public_1.Flat({
                        definition: afterDef
                    })
                    return lookAheadSequenceFromAlternatives(
                        [insideFlat, afterFlat],
                        k
                    )
                }
                exports.getLookaheadPathsForOptionalProd = getLookaheadPathsForOptionalProd
                function containsPath(alternative, path) {
                    var found = utils_1.find(alternative, function(otherPath) {
                        return (
                            path.length === otherPath.length &&
                            utils_1.every(path, function(targetItem, idx) {
                                // TODO: take categories into account here too?
                                return (
                                    targetItem === otherPath[idx] ||
                                    otherPath[idx].categoryMatchesMap[
                                        targetItem.tokenTypeIdx
                                    ]
                                )
                            })
                        )
                    })
                    return found !== undefined
                }
                exports.containsPath = containsPath
                function isStrictPrefixOfPath(prefix, other) {
                    return (
                        prefix.length < other.length &&
                        utils_1.every(prefix, function(tokType, idx) {
                            var otherTokType = other[idx]
                            return (
                                tokType === otherTokType ||
                                otherTokType.categoryMatchesMap[
                                    tokType.tokenTypeIdx
                                ]
                            )
                        })
                    )
                }
                exports.isStrictPrefixOfPath = isStrictPrefixOfPath
                function areTokenCategoriesNotUsed(lookAheadPaths) {
                    return utils_1.every(lookAheadPaths, function(
                        singleAltPaths
                    ) {
                        return utils_1.every(singleAltPaths, function(
                            singlePath
                        ) {
                            return utils_1.every(singlePath, function(token) {
                                return utils_1.isEmpty(token.categoryMatches)
                            })
                        })
                    })
                }
                exports.areTokenCategoriesNotUsed = areTokenCategoriesNotUsed
                //# sourceMappingURL=lookahead.js.map

                /***/
            },
            /* 13 */
            /***/ function(module, exports, __webpack_require__) {
                "use strict"

                var __extends =
                    (this && this.__extends) ||
                    (function() {
                        var extendStatics = function(d, b) {
                            extendStatics =
                                Object.setPrototypeOf ||
                                ({ __proto__: [] } instanceof Array &&
                                    function(d, b) {
                                        d.__proto__ = b
                                    }) ||
                                function(d, b) {
                                    for (var p in b)
                                        if (b.hasOwnProperty(p)) d[p] = b[p]
                                }
                            return extendStatics(d, b)
                        }
                        return function(d, b) {
                            extendStatics(d, b)
                            function __() {
                                this.constructor = d
                            }
                            d.prototype =
                                b === null
                                    ? Object.create(b)
                                    : ((__.prototype = b.prototype), new __())
                        }
                    })()
                Object.defineProperty(exports, "__esModule", { value: true })
                var rest_1 = __webpack_require__(14)
                var utils_1 = __webpack_require__(0)
                var tokens_public_1 = __webpack_require__(2)
                var first_1 = __webpack_require__(21)
                var gast_public_1 = __webpack_require__(1)
                var AbstractNextPossibleTokensWalker = /** @class */ (function(
                    _super
                ) {
                    __extends(AbstractNextPossibleTokensWalker, _super)
                    function AbstractNextPossibleTokensWalker(topProd, path) {
                        var _this = _super.call(this) || this
                        _this.topProd = topProd
                        _this.path = path
                        _this.possibleTokTypes = []
                        _this.nextProductionName = ""
                        _this.nextProductionOccurrence = 0
                        _this.found = false
                        _this.isAtEndOfPath = false
                        return _this
                    }
                    AbstractNextPossibleTokensWalker.prototype.startWalking = function() {
                        this.found = false
                        if (this.path.ruleStack[0] !== this.topProd.name) {
                            throw Error(
                                "The path does not start with the walker's top Rule!"
                            )
                        }
                        // immutable for the win
                        this.ruleStack = utils_1
                            .cloneArr(this.path.ruleStack)
                            .reverse() // intelij bug requires assertion
                        this.occurrenceStack = utils_1
                            .cloneArr(this.path.occurrenceStack)
                            .reverse() // intelij bug requires assertion
                        // already verified that the first production is valid, we now seek the 2nd production
                        this.ruleStack.pop()
                        this.occurrenceStack.pop()
                        this.updateExpectedNext()
                        this.walk(this.topProd)
                        return this.possibleTokTypes
                    }
                    AbstractNextPossibleTokensWalker.prototype.walk = function(
                        prod,
                        prevRest
                    ) {
                        if (prevRest === void 0) {
                            prevRest = []
                        }
                        // stop scanning once we found the path
                        if (!this.found) {
                            _super.prototype.walk.call(this, prod, prevRest)
                        }
                    }
                    AbstractNextPossibleTokensWalker.prototype.walkProdRef = function(
                        refProd,
                        currRest,
                        prevRest
                    ) {
                        // found the next production, need to keep walking in it
                        if (
                            refProd.referencedRule.name ===
                                this.nextProductionName &&
                            refProd.idx === this.nextProductionOccurrence
                        ) {
                            var fullRest = currRest.concat(prevRest)
                            this.updateExpectedNext()
                            this.walk(refProd.referencedRule, fullRest)
                        }
                    }
                    AbstractNextPossibleTokensWalker.prototype.updateExpectedNext = function() {
                        // need to consume the Terminal
                        if (utils_1.isEmpty(this.ruleStack)) {
                            // must reset nextProductionXXX to avoid walking down another Top Level production while what we are
                            // really seeking is the last Terminal...
                            this.nextProductionName = ""
                            this.nextProductionOccurrence = 0
                            this.isAtEndOfPath = true
                        } else {
                            this.nextProductionName = this.ruleStack.pop()
                            this.nextProductionOccurrence = this.occurrenceStack.pop()
                        }
                    }
                    return AbstractNextPossibleTokensWalker
                })(rest_1.RestWalker)
                exports.AbstractNextPossibleTokensWalker = AbstractNextPossibleTokensWalker
                var NextAfterTokenWalker = /** @class */ (function(_super) {
                    __extends(NextAfterTokenWalker, _super)
                    function NextAfterTokenWalker(topProd, path) {
                        var _this = _super.call(this, topProd, path) || this
                        _this.path = path
                        _this.nextTerminalName = ""
                        _this.nextTerminalOccurrence = 0
                        _this.nextTerminalName = tokens_public_1.tokenName(
                            _this.path.lastTok
                        )
                        _this.nextTerminalOccurrence =
                            _this.path.lastTokOccurrence
                        return _this
                    }
                    NextAfterTokenWalker.prototype.walkTerminal = function(
                        terminal,
                        currRest,
                        prevRest
                    ) {
                        if (
                            this.isAtEndOfPath &&
                            tokens_public_1.tokenName(terminal.terminalType) ===
                                this.nextTerminalName &&
                            terminal.idx === this.nextTerminalOccurrence &&
                            !this.found
                        ) {
                            var fullRest = currRest.concat(prevRest)
                            var restProd = new gast_public_1.Flat({
                                definition: fullRest
                            })
                            this.possibleTokTypes = first_1.first(restProd)
                            this.found = true
                        }
                    }
                    return NextAfterTokenWalker
                })(AbstractNextPossibleTokensWalker)
                exports.NextAfterTokenWalker = NextAfterTokenWalker
                /**
                 * This walker only "walks" a single "TOP" level in the Grammar Ast, this means
                 * it never "follows" production refs
                 */
                var AbstractNextTerminalAfterProductionWalker = /** @class */ (function(
                    _super
                ) {
                    __extends(AbstractNextTerminalAfterProductionWalker, _super)
                    function AbstractNextTerminalAfterProductionWalker(
                        topRule,
                        occurrence
                    ) {
                        var _this = _super.call(this) || this
                        _this.topRule = topRule
                        _this.occurrence = occurrence
                        _this.result = {
                            token: undefined,
                            occurrence: undefined,
                            isEndOfRule: undefined
                        }
                        return _this
                    }
                    AbstractNextTerminalAfterProductionWalker.prototype.startWalking = function() {
                        this.walk(this.topRule)
                        return this.result
                    }
                    return AbstractNextTerminalAfterProductionWalker
                })(rest_1.RestWalker)
                exports.AbstractNextTerminalAfterProductionWalker = AbstractNextTerminalAfterProductionWalker
                var NextTerminalAfterManyWalker = /** @class */ (function(
                    _super
                ) {
                    __extends(NextTerminalAfterManyWalker, _super)
                    function NextTerminalAfterManyWalker() {
                        return (
                            (_super !== null &&
                                _super.apply(this, arguments)) ||
                            this
                        )
                    }
                    NextTerminalAfterManyWalker.prototype.walkMany = function(
                        manyProd,
                        currRest,
                        prevRest
                    ) {
                        if (manyProd.idx === this.occurrence) {
                            var firstAfterMany = utils_1.first(
                                currRest.concat(prevRest)
                            )
                            this.result.isEndOfRule =
                                firstAfterMany === undefined
                            if (
                                firstAfterMany instanceof gast_public_1.Terminal
                            ) {
                                this.result.token = firstAfterMany.terminalType
                                this.result.occurrence = firstAfterMany.idx
                            }
                        } else {
                            _super.prototype.walkMany.call(
                                this,
                                manyProd,
                                currRest,
                                prevRest
                            )
                        }
                    }
                    return NextTerminalAfterManyWalker
                })(AbstractNextTerminalAfterProductionWalker)
                exports.NextTerminalAfterManyWalker = NextTerminalAfterManyWalker
                var NextTerminalAfterManySepWalker = /** @class */ (function(
                    _super
                ) {
                    __extends(NextTerminalAfterManySepWalker, _super)
                    function NextTerminalAfterManySepWalker() {
                        return (
                            (_super !== null &&
                                _super.apply(this, arguments)) ||
                            this
                        )
                    }
                    NextTerminalAfterManySepWalker.prototype.walkManySep = function(
                        manySepProd,
                        currRest,
                        prevRest
                    ) {
                        if (manySepProd.idx === this.occurrence) {
                            var firstAfterManySep = utils_1.first(
                                currRest.concat(prevRest)
                            )
                            this.result.isEndOfRule =
                                firstAfterManySep === undefined
                            if (
                                firstAfterManySep instanceof
                                gast_public_1.Terminal
                            ) {
                                this.result.token =
                                    firstAfterManySep.terminalType
                                this.result.occurrence = firstAfterManySep.idx
                            }
                        } else {
                            _super.prototype.walkManySep.call(
                                this,
                                manySepProd,
                                currRest,
                                prevRest
                            )
                        }
                    }
                    return NextTerminalAfterManySepWalker
                })(AbstractNextTerminalAfterProductionWalker)
                exports.NextTerminalAfterManySepWalker = NextTerminalAfterManySepWalker
                var NextTerminalAfterAtLeastOneWalker = /** @class */ (function(
                    _super
                ) {
                    __extends(NextTerminalAfterAtLeastOneWalker, _super)
                    function NextTerminalAfterAtLeastOneWalker() {
                        return (
                            (_super !== null &&
                                _super.apply(this, arguments)) ||
                            this
                        )
                    }
                    NextTerminalAfterAtLeastOneWalker.prototype.walkAtLeastOne = function(
                        atLeastOneProd,
                        currRest,
                        prevRest
                    ) {
                        if (atLeastOneProd.idx === this.occurrence) {
                            var firstAfterAtLeastOne = utils_1.first(
                                currRest.concat(prevRest)
                            )
                            this.result.isEndOfRule =
                                firstAfterAtLeastOne === undefined
                            if (
                                firstAfterAtLeastOne instanceof
                                gast_public_1.Terminal
                            ) {
                                this.result.token =
                                    firstAfterAtLeastOne.terminalType
                                this.result.occurrence =
                                    firstAfterAtLeastOne.idx
                            }
                        } else {
                            _super.prototype.walkAtLeastOne.call(
                                this,
                                atLeastOneProd,
                                currRest,
                                prevRest
                            )
                        }
                    }
                    return NextTerminalAfterAtLeastOneWalker
                })(AbstractNextTerminalAfterProductionWalker)
                exports.NextTerminalAfterAtLeastOneWalker = NextTerminalAfterAtLeastOneWalker
                // TODO: reduce code duplication in the AfterWalkers
                var NextTerminalAfterAtLeastOneSepWalker = /** @class */ (function(
                    _super
                ) {
                    __extends(NextTerminalAfterAtLeastOneSepWalker, _super)
                    function NextTerminalAfterAtLeastOneSepWalker() {
                        return (
                            (_super !== null &&
                                _super.apply(this, arguments)) ||
                            this
                        )
                    }
                    NextTerminalAfterAtLeastOneSepWalker.prototype.walkAtLeastOneSep = function(
                        atleastOneSepProd,
                        currRest,
                        prevRest
                    ) {
                        if (atleastOneSepProd.idx === this.occurrence) {
                            var firstAfterfirstAfterAtLeastOneSep = utils_1.first(
                                currRest.concat(prevRest)
                            )
                            this.result.isEndOfRule =
                                firstAfterfirstAfterAtLeastOneSep === undefined
                            if (
                                firstAfterfirstAfterAtLeastOneSep instanceof
                                gast_public_1.Terminal
                            ) {
                                this.result.token =
                                    firstAfterfirstAfterAtLeastOneSep.terminalType
                                this.result.occurrence =
                                    firstAfterfirstAfterAtLeastOneSep.idx
                            }
                        } else {
                            _super.prototype.walkAtLeastOneSep.call(
                                this,
                                atleastOneSepProd,
                                currRest,
                                prevRest
                            )
                        }
                    }
                    return NextTerminalAfterAtLeastOneSepWalker
                })(AbstractNextTerminalAfterProductionWalker)
                exports.NextTerminalAfterAtLeastOneSepWalker = NextTerminalAfterAtLeastOneSepWalker
                function possiblePathsFrom(targetDef, maxLength, currPath) {
                    if (currPath === void 0) {
                        currPath = []
                    }
                    // avoid side effects
                    currPath = utils_1.cloneArr(currPath)
                    var result = []
                    var i = 0
                    function remainingPathWith(nextDef) {
                        return nextDef.concat(utils_1.drop(targetDef, i + 1))
                    }
                    function getAlternativesForProd(definition) {
                        var alternatives = possiblePathsFrom(
                            remainingPathWith(definition),
                            maxLength,
                            currPath
                        )
                        return result.concat(alternatives)
                    }
                    /**
                     * Mandatory productions will halt the loop as the paths computed from their recursive calls will already contain the
                     * following (rest) of the targetDef.
                     *
                     * For optional productions (Option/Repetition/...) the loop will continue to represent the paths that do not include the
                     * the optional production.
                     */
                    while (
                        currPath.length < maxLength &&
                        i < targetDef.length
                    ) {
                        var prod = targetDef[i]
                        /* istanbul ignore else */
                        if (prod instanceof gast_public_1.Flat) {
                            return getAlternativesForProd(prod.definition)
                        } else if (prod instanceof gast_public_1.NonTerminal) {
                            return getAlternativesForProd(prod.definition)
                        } else if (prod instanceof gast_public_1.Option) {
                            result = getAlternativesForProd(prod.definition)
                        } else if (
                            prod instanceof gast_public_1.RepetitionMandatory
                        ) {
                            var newDef = prod.definition.concat([
                                new gast_public_1.Repetition({
                                    definition: prod.definition
                                })
                            ])
                            return getAlternativesForProd(newDef)
                        } else if (
                            prod instanceof
                            gast_public_1.RepetitionMandatoryWithSeparator
                        ) {
                            var newDef = [
                                new gast_public_1.Flat({
                                    definition: prod.definition
                                }),
                                new gast_public_1.Repetition({
                                    definition: [
                                        new gast_public_1.Terminal({
                                            terminalType: prod.separator
                                        })
                                    ].concat(prod.definition)
                                })
                            ]
                            return getAlternativesForProd(newDef)
                        } else if (
                            prod instanceof
                            gast_public_1.RepetitionWithSeparator
                        ) {
                            var newDef = prod.definition.concat([
                                new gast_public_1.Repetition({
                                    definition: [
                                        new gast_public_1.Terminal({
                                            terminalType: prod.separator
                                        })
                                    ].concat(prod.definition)
                                })
                            ])
                            result = getAlternativesForProd(newDef)
                        } else if (prod instanceof gast_public_1.Repetition) {
                            var newDef = prod.definition.concat([
                                new gast_public_1.Repetition({
                                    definition: prod.definition
                                })
                            ])
                            result = getAlternativesForProd(newDef)
                        } else if (prod instanceof gast_public_1.Alternation) {
                            utils_1.forEach(prod.definition, function(currAlt) {
                                result = getAlternativesForProd(
                                    currAlt.definition
                                )
                            })
                            return result
                        } else if (prod instanceof gast_public_1.Terminal) {
                            currPath.push(prod.terminalType)
                        } else {
                            throw Error("non exhaustive match")
                        }
                        i++
                    }
                    result.push({
                        partialPath: currPath,
                        suffixDef: utils_1.drop(targetDef, i)
                    })
                    return result
                }
                exports.possiblePathsFrom = possiblePathsFrom
                function nextPossibleTokensAfter(
                    initialDef,
                    tokenVector,
                    tokMatcher,
                    maxLookAhead
                ) {
                    var EXIT_NON_TERMINAL = "EXIT_NONE_TERMINAL"
                    // to avoid creating a new Array each time.
                    var EXIT_NON_TERMINAL_ARR = [EXIT_NON_TERMINAL]
                    var EXIT_ALTERNATIVE = "EXIT_ALTERNATIVE"
                    var foundCompletePath = false
                    var tokenVectorLength = tokenVector.length
                    var minimalAlternativesIndex =
                        tokenVectorLength - maxLookAhead - 1
                    var result = []
                    var possiblePaths = []
                    possiblePaths.push({
                        idx: -1,
                        def: initialDef,
                        ruleStack: [],
                        occurrenceStack: []
                    })
                    while (!utils_1.isEmpty(possiblePaths)) {
                        var currPath = possiblePaths.pop()
                        // skip alternatives if no more results can be found (assuming deterministic grammar with fixed lookahead)
                        if (currPath === EXIT_ALTERNATIVE) {
                            if (
                                foundCompletePath &&
                                utils_1.last(possiblePaths).idx <=
                                    minimalAlternativesIndex
                            ) {
                                // remove irrelevant alternative
                                possiblePaths.pop()
                            }
                            continue
                        }
                        var currDef = currPath.def
                        var currIdx = currPath.idx
                        var currRuleStack = currPath.ruleStack
                        var currOccurrenceStack = currPath.occurrenceStack
                        // For Example: an empty path could exist in a valid grammar in the case of an EMPTY_ALT
                        if (utils_1.isEmpty(currDef)) {
                            continue
                        }
                        var prod = currDef[0]
                        /* istanbul ignore else */
                        if (prod === EXIT_NON_TERMINAL) {
                            var nextPath = {
                                idx: currIdx,
                                def: utils_1.drop(currDef),
                                ruleStack: utils_1.dropRight(currRuleStack),
                                occurrenceStack: utils_1.dropRight(
                                    currOccurrenceStack
                                )
                            }
                            possiblePaths.push(nextPath)
                        } else if (prod instanceof gast_public_1.Terminal) {
                            /* istanbul ignore else */
                            if (currIdx < tokenVectorLength - 1) {
                                var nextIdx = currIdx + 1
                                var actualToken = tokenVector[nextIdx]
                                if (
                                    tokMatcher(actualToken, prod.terminalType)
                                ) {
                                    var nextPath = {
                                        idx: nextIdx,
                                        def: utils_1.drop(currDef),
                                        ruleStack: currRuleStack,
                                        occurrenceStack: currOccurrenceStack
                                    }
                                    possiblePaths.push(nextPath)
                                }
                                // end of the line
                            } else if (currIdx === tokenVectorLength - 1) {
                                // IGNORE ABOVE ELSE
                                result.push({
                                    nextTokenType: prod.terminalType,
                                    nextTokenOccurrence: prod.idx,
                                    ruleStack: currRuleStack,
                                    occurrenceStack: currOccurrenceStack
                                })
                                foundCompletePath = true
                            } else {
                                throw Error("non exhaustive match")
                            }
                        } else if (prod instanceof gast_public_1.NonTerminal) {
                            var newRuleStack = utils_1.cloneArr(currRuleStack)
                            newRuleStack.push(prod.nonTerminalName)
                            var newOccurrenceStack = utils_1.cloneArr(
                                currOccurrenceStack
                            )
                            newOccurrenceStack.push(prod.idx)
                            var nextPath = {
                                idx: currIdx,
                                def: prod.definition.concat(
                                    EXIT_NON_TERMINAL_ARR,
                                    utils_1.drop(currDef)
                                ),
                                ruleStack: newRuleStack,
                                occurrenceStack: newOccurrenceStack
                            }
                            possiblePaths.push(nextPath)
                        } else if (prod instanceof gast_public_1.Option) {
                            // the order of alternatives is meaningful, FILO (Last path will be traversed first).
                            var nextPathWithout = {
                                idx: currIdx,
                                def: utils_1.drop(currDef),
                                ruleStack: currRuleStack,
                                occurrenceStack: currOccurrenceStack
                            }
                            possiblePaths.push(nextPathWithout)
                            // required marker to avoid backtracking paths whose higher priority alternatives already matched
                            possiblePaths.push(EXIT_ALTERNATIVE)
                            var nextPathWith = {
                                idx: currIdx,
                                def: prod.definition.concat(
                                    utils_1.drop(currDef)
                                ),
                                ruleStack: currRuleStack,
                                occurrenceStack: currOccurrenceStack
                            }
                            possiblePaths.push(nextPathWith)
                        } else if (
                            prod instanceof gast_public_1.RepetitionMandatory
                        ) {
                            // TODO:(THE NEW operators here take a while...) (convert once?)
                            var secondIteration = new gast_public_1.Repetition({
                                definition: prod.definition,
                                idx: prod.idx
                            })
                            var nextDef = prod.definition.concat(
                                [secondIteration],
                                utils_1.drop(currDef)
                            )
                            var nextPath = {
                                idx: currIdx,
                                def: nextDef,
                                ruleStack: currRuleStack,
                                occurrenceStack: currOccurrenceStack
                            }
                            possiblePaths.push(nextPath)
                        } else if (
                            prod instanceof
                            gast_public_1.RepetitionMandatoryWithSeparator
                        ) {
                            // TODO:(THE NEW operators here take a while...) (convert once?)
                            var separatorGast = new gast_public_1.Terminal({
                                terminalType: prod.separator
                            })
                            var secondIteration = new gast_public_1.Repetition({
                                definition: [separatorGast].concat(
                                    prod.definition
                                ),
                                idx: prod.idx
                            })
                            var nextDef = prod.definition.concat(
                                [secondIteration],
                                utils_1.drop(currDef)
                            )
                            var nextPath = {
                                idx: currIdx,
                                def: nextDef,
                                ruleStack: currRuleStack,
                                occurrenceStack: currOccurrenceStack
                            }
                            possiblePaths.push(nextPath)
                        } else if (
                            prod instanceof
                            gast_public_1.RepetitionWithSeparator
                        ) {
                            // the order of alternatives is meaningful, FILO (Last path will be traversed first).
                            var nextPathWithout = {
                                idx: currIdx,
                                def: utils_1.drop(currDef),
                                ruleStack: currRuleStack,
                                occurrenceStack: currOccurrenceStack
                            }
                            possiblePaths.push(nextPathWithout)
                            // required marker to avoid backtracking paths whose higher priority alternatives already matched
                            possiblePaths.push(EXIT_ALTERNATIVE)
                            var separatorGast = new gast_public_1.Terminal({
                                terminalType: prod.separator
                            })
                            var nthRepetition = new gast_public_1.Repetition({
                                definition: [separatorGast].concat(
                                    prod.definition
                                ),
                                idx: prod.idx
                            })
                            var nextDef = prod.definition.concat(
                                [nthRepetition],
                                utils_1.drop(currDef)
                            )
                            var nextPathWith = {
                                idx: currIdx,
                                def: nextDef,
                                ruleStack: currRuleStack,
                                occurrenceStack: currOccurrenceStack
                            }
                            possiblePaths.push(nextPathWith)
                        } else if (prod instanceof gast_public_1.Repetition) {
                            // the order of alternatives is meaningful, FILO (Last path will be traversed first).
                            var nextPathWithout = {
                                idx: currIdx,
                                def: utils_1.drop(currDef),
                                ruleStack: currRuleStack,
                                occurrenceStack: currOccurrenceStack
                            }
                            possiblePaths.push(nextPathWithout)
                            // required marker to avoid backtracking paths whose higher priority alternatives already matched
                            possiblePaths.push(EXIT_ALTERNATIVE)
                            // TODO: an empty repetition will cause infinite loops here, will the parser detect this in selfAnalysis?
                            var nthRepetition = new gast_public_1.Repetition({
                                definition: prod.definition,
                                idx: prod.idx
                            })
                            var nextDef = prod.definition.concat(
                                [nthRepetition],
                                utils_1.drop(currDef)
                            )
                            var nextPathWith = {
                                idx: currIdx,
                                def: nextDef,
                                ruleStack: currRuleStack,
                                occurrenceStack: currOccurrenceStack
                            }
                            possiblePaths.push(nextPathWith)
                        } else if (prod instanceof gast_public_1.Alternation) {
                            // the order of alternatives is meaningful, FILO (Last path will be traversed first).
                            for (
                                var i = prod.definition.length - 1;
                                i >= 0;
                                i--
                            ) {
                                var currAlt = prod.definition[i]
                                var currAltPath = {
                                    idx: currIdx,
                                    def: currAlt.definition.concat(
                                        utils_1.drop(currDef)
                                    ),
                                    ruleStack: currRuleStack,
                                    occurrenceStack: currOccurrenceStack
                                }
                                possiblePaths.push(currAltPath)
                                possiblePaths.push(EXIT_ALTERNATIVE)
                            }
                        } else if (prod instanceof gast_public_1.Flat) {
                            possiblePaths.push({
                                idx: currIdx,
                                def: prod.definition.concat(
                                    utils_1.drop(currDef)
                                ),
                                ruleStack: currRuleStack,
                                occurrenceStack: currOccurrenceStack
                            })
                        } else if (prod instanceof gast_public_1.Rule) {
                            // last because we should only encounter at most a single one of these per invocation.
                            possiblePaths.push(
                                expandTopLevelRule(
                                    prod,
                                    currIdx,
                                    currRuleStack,
                                    currOccurrenceStack
                                )
                            )
                        } else {
                            throw Error("non exhaustive match")
                        }
                    }
                    return result
                }
                exports.nextPossibleTokensAfter = nextPossibleTokensAfter
                function expandTopLevelRule(
                    topRule,
                    currIdx,
                    currRuleStack,
                    currOccurrenceStack
                ) {
                    var newRuleStack = utils_1.cloneArr(currRuleStack)
                    newRuleStack.push(topRule.name)
                    var newCurrOccurrenceStack = utils_1.cloneArr(
                        currOccurrenceStack
                    )
                    // top rule is always assumed to have been called with occurrence index 1
                    newCurrOccurrenceStack.push(1)
                    return {
                        idx: currIdx,
                        def: topRule.definition,
                        ruleStack: newRuleStack,
                        occurrenceStack: newCurrOccurrenceStack
                    }
                }
                //# sourceMappingURL=interpreter.js.map

                /***/
            },
            /* 14 */
            /***/ function(module, exports, __webpack_require__) {
                "use strict"

                Object.defineProperty(exports, "__esModule", { value: true })
                var utils_1 = __webpack_require__(0)
                var gast_public_1 = __webpack_require__(1)
                /**
                 *  A Grammar Walker that computes the "remaining" grammar "after" a productions in the grammar.
                 */
                var RestWalker = /** @class */ (function() {
                    function RestWalker() {}
                    RestWalker.prototype.walk = function(prod, prevRest) {
                        var _this = this
                        if (prevRest === void 0) {
                            prevRest = []
                        }
                        utils_1.forEach(prod.definition, function(
                            subProd,
                            index
                        ) {
                            var currRest = utils_1.drop(
                                prod.definition,
                                index + 1
                            )
                            /* istanbul ignore else */
                            if (subProd instanceof gast_public_1.NonTerminal) {
                                _this.walkProdRef(subProd, currRest, prevRest)
                            } else if (
                                subProd instanceof gast_public_1.Terminal
                            ) {
                                _this.walkTerminal(subProd, currRest, prevRest)
                            } else if (subProd instanceof gast_public_1.Flat) {
                                _this.walkFlat(subProd, currRest, prevRest)
                            } else if (
                                subProd instanceof gast_public_1.Option
                            ) {
                                _this.walkOption(subProd, currRest, prevRest)
                            } else if (
                                subProd instanceof
                                gast_public_1.RepetitionMandatory
                            ) {
                                _this.walkAtLeastOne(
                                    subProd,
                                    currRest,
                                    prevRest
                                )
                            } else if (
                                subProd instanceof
                                gast_public_1.RepetitionMandatoryWithSeparator
                            ) {
                                _this.walkAtLeastOneSep(
                                    subProd,
                                    currRest,
                                    prevRest
                                )
                            } else if (
                                subProd instanceof
                                gast_public_1.RepetitionWithSeparator
                            ) {
                                _this.walkManySep(subProd, currRest, prevRest)
                            } else if (
                                subProd instanceof gast_public_1.Repetition
                            ) {
                                _this.walkMany(subProd, currRest, prevRest)
                            } else if (
                                subProd instanceof gast_public_1.Alternation
                            ) {
                                _this.walkOr(subProd, currRest, prevRest)
                            } else {
                                throw Error("non exhaustive match")
                            }
                        })
                    }
                    RestWalker.prototype.walkTerminal = function(
                        terminal,
                        currRest,
                        prevRest
                    ) {}
                    RestWalker.prototype.walkProdRef = function(
                        refProd,
                        currRest,
                        prevRest
                    ) {}
                    RestWalker.prototype.walkFlat = function(
                        flatProd,
                        currRest,
                        prevRest
                    ) {
                        // ABCDEF => after the D the rest is EF
                        var fullOrRest = currRest.concat(prevRest)
                        this.walk(flatProd, fullOrRest)
                    }
                    RestWalker.prototype.walkOption = function(
                        optionProd,
                        currRest,
                        prevRest
                    ) {
                        // ABC(DE)?F => after the (DE)? the rest is F
                        var fullOrRest = currRest.concat(prevRest)
                        this.walk(optionProd, fullOrRest)
                    }
                    RestWalker.prototype.walkAtLeastOne = function(
                        atLeastOneProd,
                        currRest,
                        prevRest
                    ) {
                        // ABC(DE)+F => after the (DE)+ the rest is (DE)?F
                        var fullAtLeastOneRest = [
                            new gast_public_1.Option({
                                definition: atLeastOneProd.definition
                            })
                        ].concat(currRest, prevRest)
                        this.walk(atLeastOneProd, fullAtLeastOneRest)
                    }
                    RestWalker.prototype.walkAtLeastOneSep = function(
                        atLeastOneSepProd,
                        currRest,
                        prevRest
                    ) {
                        // ABC DE(,DE)* F => after the (,DE)+ the rest is (,DE)?F
                        var fullAtLeastOneSepRest = restForRepetitionWithSeparator(
                            atLeastOneSepProd,
                            currRest,
                            prevRest
                        )
                        this.walk(atLeastOneSepProd, fullAtLeastOneSepRest)
                    }
                    RestWalker.prototype.walkMany = function(
                        manyProd,
                        currRest,
                        prevRest
                    ) {
                        // ABC(DE)*F => after the (DE)* the rest is (DE)?F
                        var fullManyRest = [
                            new gast_public_1.Option({
                                definition: manyProd.definition
                            })
                        ].concat(currRest, prevRest)
                        this.walk(manyProd, fullManyRest)
                    }
                    RestWalker.prototype.walkManySep = function(
                        manySepProd,
                        currRest,
                        prevRest
                    ) {
                        // ABC (DE(,DE)*)? F => after the (,DE)* the rest is (,DE)?F
                        var fullManySepRest = restForRepetitionWithSeparator(
                            manySepProd,
                            currRest,
                            prevRest
                        )
                        this.walk(manySepProd, fullManySepRest)
                    }
                    RestWalker.prototype.walkOr = function(
                        orProd,
                        currRest,
                        prevRest
                    ) {
                        var _this = this
                        // ABC(D|E|F)G => when finding the (D|E|F) the rest is G
                        var fullOrRest = currRest.concat(prevRest)
                        // walk all different alternatives
                        utils_1.forEach(orProd.definition, function(alt) {
                            // wrapping each alternative in a single definition wrapper
                            // to avoid errors in computing the rest of that alternative in the invocation to computeInProdFollows
                            // (otherwise for OR([alt1,alt2]) alt2 will be considered in 'rest' of alt1
                            var prodWrapper = new gast_public_1.Flat({
                                definition: [alt]
                            })
                            _this.walk(prodWrapper, fullOrRest)
                        })
                    }
                    return RestWalker
                })()
                exports.RestWalker = RestWalker
                function restForRepetitionWithSeparator(
                    repSepProd,
                    currRest,
                    prevRest
                ) {
                    var repSepRest = [
                        new gast_public_1.Option({
                            definition: [
                                new gast_public_1.Terminal({
                                    terminalType: repSepProd.separator
                                })
                            ].concat(repSepProd.definition)
                        })
                    ]
                    var fullRepSepRest = repSepRest.concat(currRest, prevRest)
                    return fullRepSepRest
                }
                //# sourceMappingURL=rest.js.map

                /***/
            },
            /* 15 */
            /***/ function(module, exports, __webpack_require__) {
                "use strict"

                Object.defineProperty(exports, "__esModule", { value: true })
                var lexer_1 = __webpack_require__(27)
                var utils_1 = __webpack_require__(0)
                var tokens_1 = __webpack_require__(7)
                var lexer_errors_public_1 = __webpack_require__(20)
                var LexerDefinitionErrorType
                ;(function(LexerDefinitionErrorType) {
                    LexerDefinitionErrorType[
                        (LexerDefinitionErrorType["MISSING_PATTERN"] = 0)
                    ] = "MISSING_PATTERN"
                    LexerDefinitionErrorType[
                        (LexerDefinitionErrorType["INVALID_PATTERN"] = 1)
                    ] = "INVALID_PATTERN"
                    LexerDefinitionErrorType[
                        (LexerDefinitionErrorType["EOI_ANCHOR_FOUND"] = 2)
                    ] = "EOI_ANCHOR_FOUND"
                    LexerDefinitionErrorType[
                        (LexerDefinitionErrorType[
                            "UNSUPPORTED_FLAGS_FOUND"
                        ] = 3)
                    ] = "UNSUPPORTED_FLAGS_FOUND"
                    LexerDefinitionErrorType[
                        (LexerDefinitionErrorType[
                            "DUPLICATE_PATTERNS_FOUND"
                        ] = 4)
                    ] = "DUPLICATE_PATTERNS_FOUND"
                    LexerDefinitionErrorType[
                        (LexerDefinitionErrorType[
                            "INVALID_GROUP_TYPE_FOUND"
                        ] = 5)
                    ] = "INVALID_GROUP_TYPE_FOUND"
                    LexerDefinitionErrorType[
                        (LexerDefinitionErrorType[
                            "PUSH_MODE_DOES_NOT_EXIST"
                        ] = 6)
                    ] = "PUSH_MODE_DOES_NOT_EXIST"
                    LexerDefinitionErrorType[
                        (LexerDefinitionErrorType[
                            "MULTI_MODE_LEXER_WITHOUT_DEFAULT_MODE"
                        ] = 7)
                    ] = "MULTI_MODE_LEXER_WITHOUT_DEFAULT_MODE"
                    LexerDefinitionErrorType[
                        (LexerDefinitionErrorType[
                            "MULTI_MODE_LEXER_WITHOUT_MODES_PROPERTY"
                        ] = 8)
                    ] = "MULTI_MODE_LEXER_WITHOUT_MODES_PROPERTY"
                    LexerDefinitionErrorType[
                        (LexerDefinitionErrorType[
                            "MULTI_MODE_LEXER_DEFAULT_MODE_VALUE_DOES_NOT_EXIST"
                        ] = 9)
                    ] = "MULTI_MODE_LEXER_DEFAULT_MODE_VALUE_DOES_NOT_EXIST"
                    LexerDefinitionErrorType[
                        (LexerDefinitionErrorType[
                            "LEXER_DEFINITION_CANNOT_CONTAIN_UNDEFINED"
                        ] = 10)
                    ] = "LEXER_DEFINITION_CANNOT_CONTAIN_UNDEFINED"
                    LexerDefinitionErrorType[
                        (LexerDefinitionErrorType["SOI_ANCHOR_FOUND"] = 11)
                    ] = "SOI_ANCHOR_FOUND"
                    LexerDefinitionErrorType[
                        (LexerDefinitionErrorType["EMPTY_MATCH_PATTERN"] = 12)
                    ] = "EMPTY_MATCH_PATTERN"
                    LexerDefinitionErrorType[
                        (LexerDefinitionErrorType["NO_LINE_BREAKS_FLAGS"] = 13)
                    ] = "NO_LINE_BREAKS_FLAGS"
                    LexerDefinitionErrorType[
                        (LexerDefinitionErrorType["UNREACHABLE_PATTERN"] = 14)
                    ] = "UNREACHABLE_PATTERN"
                    LexerDefinitionErrorType[
                        (LexerDefinitionErrorType["IDENTIFY_TERMINATOR"] = 15)
                    ] = "IDENTIFY_TERMINATOR"
                    LexerDefinitionErrorType[
                        (LexerDefinitionErrorType["CUSTOM_LINE_BREAK"] = 16)
                    ] = "CUSTOM_LINE_BREAK"
                })(
                    (LexerDefinitionErrorType =
                        exports.LexerDefinitionErrorType ||
                        (exports.LexerDefinitionErrorType = {}))
                )
                var DEFAULT_LEXER_CONFIG = {
                    deferDefinitionErrorsHandling: false,
                    positionTracking: "full",
                    lineTerminatorsPattern: /\n|\r\n?/g,
                    lineTerminatorCharacters: ["\n", "\r"],
                    ensureOptimizations: false,
                    safeMode: false,
                    errorMessageProvider:
                        lexer_errors_public_1.defaultLexerErrorProvider
                }
                Object.freeze(DEFAULT_LEXER_CONFIG)
                var Lexer = /** @class */ (function() {
                    function Lexer(lexerDefinition, config) {
                        var _this = this
                        if (config === void 0) {
                            config = DEFAULT_LEXER_CONFIG
                        }
                        this.lexerDefinition = lexerDefinition
                        this.lexerDefinitionErrors = []
                        this.lexerDefinitionWarning = []
                        this.patternIdxToConfig = {}
                        this.charCodeToPatternIdxToConfig = {}
                        this.modes = []
                        this.emptyGroups = {}
                        this.config = undefined
                        this.trackStartLines = true
                        this.trackEndLines = true
                        this.hasCustom = false
                        this.canModeBeOptimized = {}
                        if (typeof config === "boolean") {
                            throw Error(
                                "The second argument to the Lexer constructor is now an ILexerConfig Object.\n" +
                                    "a boolean 2nd argument is no longer supported"
                            )
                        }
                        // todo: defaults func?
                        this.config = utils_1.merge(
                            DEFAULT_LEXER_CONFIG,
                            config
                        )
                        if (
                            this.config.lineTerminatorsPattern ===
                            DEFAULT_LEXER_CONFIG.lineTerminatorsPattern
                        ) {
                            // optimized built-in implementation for the defaults definition of lineTerminators
                            this.config.lineTerminatorsPattern =
                                lexer_1.LineTerminatorOptimizedTester
                        } else {
                            if (
                                this.config.lineTerminatorCharacters ===
                                DEFAULT_LEXER_CONFIG.lineTerminatorCharacters
                            ) {
                                throw Error(
                                    "Error: Missing <lineTerminatorCharacters> property on the Lexer config.\n" +
                                        "\tFor details See: https://sap.github.io/chevrotain/docs/guide/resolving_lexer_errors.html#MISSING_LINE_TERM_CHARS"
                                )
                            }
                        }
                        if (config.safeMode && config.ensureOptimizations) {
                            throw Error(
                                '"safeMode" and "ensureOptimizations" flags are mutually exclusive.'
                            )
                        }
                        this.trackStartLines = /full|onlyStart/i.test(
                            this.config.positionTracking
                        )
                        this.trackEndLines = /full/i.test(
                            this.config.positionTracking
                        )
                        var hasOnlySingleMode = true
                        var actualDefinition
                        // Convert SingleModeLexerDefinition into a IMultiModeLexerDefinition.
                        if (utils_1.isArray(lexerDefinition)) {
                            actualDefinition = { modes: {} }
                            actualDefinition.modes[
                                lexer_1.DEFAULT_MODE
                            ] = utils_1.cloneArr(lexerDefinition)
                            actualDefinition[lexer_1.DEFAULT_MODE] =
                                lexer_1.DEFAULT_MODE
                        } else {
                            // no conversion needed, input should already be a IMultiModeLexerDefinition
                            hasOnlySingleMode = false
                            actualDefinition = utils_1.cloneObj(lexerDefinition)
                        }
                        this.lexerDefinitionErrors = this.lexerDefinitionErrors.concat(
                            lexer_1.performRuntimeChecks(
                                actualDefinition,
                                this.trackStartLines,
                                this.config.lineTerminatorCharacters
                            )
                        )
                        this.lexerDefinitionWarning = this.lexerDefinitionWarning.concat(
                            lexer_1.performWarningRuntimeChecks(
                                actualDefinition,
                                this.trackStartLines,
                                this.config.lineTerminatorCharacters
                            )
                        )
                        // for extra robustness to avoid throwing an none informative error message
                        actualDefinition.modes = actualDefinition.modes
                            ? actualDefinition.modes
                            : {}
                        // an error of undefined TokenTypes will be detected in "performRuntimeChecks" above.
                        // this transformation is to increase robustness in the case of partially invalid lexer definition.
                        utils_1.forEach(actualDefinition.modes, function(
                            currModeValue,
                            currModeName
                        ) {
                            actualDefinition.modes[
                                currModeName
                            ] = utils_1.reject(currModeValue, function(
                                currTokType
                            ) {
                                return utils_1.isUndefined(currTokType)
                            })
                        })
                        var allModeNames = utils_1.keys(actualDefinition.modes)
                        utils_1.forEach(actualDefinition.modes, function(
                            currModDef,
                            currModName
                        ) {
                            _this.modes.push(currModName)
                            _this.lexerDefinitionErrors = _this.lexerDefinitionErrors.concat(
                                lexer_1.validatePatterns(
                                    currModDef,
                                    allModeNames
                                )
                            )
                            // If definition errors were encountered, the analysis phase may fail unexpectedly/
                            // Considering a lexer with definition errors may never be used, there is no point
                            // to performing the analysis anyhow...
                            if (utils_1.isEmpty(_this.lexerDefinitionErrors)) {
                                tokens_1.augmentTokenTypes(currModDef)
                                var currAnalyzeResult = lexer_1.analyzeTokenTypes(
                                    currModDef,
                                    {
                                        lineTerminatorCharacters:
                                            _this.config
                                                .lineTerminatorCharacters,
                                        positionTracking:
                                            config.positionTracking,
                                        ensureOptimizations:
                                            config.ensureOptimizations,
                                        safeMode: config.safeMode
                                    }
                                )
                                _this.patternIdxToConfig[currModName] =
                                    currAnalyzeResult.patternIdxToConfig
                                _this.charCodeToPatternIdxToConfig[
                                    currModName
                                ] =
                                    currAnalyzeResult.charCodeToPatternIdxToConfig
                                _this.emptyGroups = utils_1.merge(
                                    _this.emptyGroups,
                                    currAnalyzeResult.emptyGroups
                                )
                                _this.hasCustom =
                                    currAnalyzeResult.hasCustom ||
                                    _this.hasCustom
                                _this.canModeBeOptimized[currModName] =
                                    currAnalyzeResult.canBeOptimized
                            }
                        })
                        this.defaultMode = actualDefinition.defaultMode
                        if (
                            !utils_1.isEmpty(this.lexerDefinitionErrors) &&
                            !this.config.deferDefinitionErrorsHandling
                        ) {
                            var allErrMessages = utils_1.map(
                                this.lexerDefinitionErrors,
                                function(error) {
                                    return error.message
                                }
                            )
                            var allErrMessagesString = allErrMessages.join(
                                "-----------------------\n"
                            )
                            throw new Error(
                                "Errors detected in definition of Lexer:\n" +
                                    allErrMessagesString
                            )
                        }
                        // Only print warning if there are no errors, This will avoid pl
                        utils_1.forEach(this.lexerDefinitionWarning, function(
                            warningDescriptor
                        ) {
                            utils_1.PRINT_WARNING(warningDescriptor.message)
                        })
                        // Choose the relevant internal implementations for this specific parser.
                        // These implementations should be in-lined by the JavaScript engine
                        // to provide optimal performance in each scenario.
                        if (lexer_1.SUPPORT_STICKY) {
                            this.chopInput = utils_1.IDENTITY
                            this.match = this.matchWithTest
                        } else {
                            this.updateLastIndex = utils_1.NOOP
                            this.match = this.matchWithExec
                        }
                        if (hasOnlySingleMode) {
                            this.handleModes = utils_1.NOOP
                        }
                        if (this.trackStartLines === false) {
                            this.computeNewColumn = utils_1.IDENTITY
                        }
                        if (this.trackEndLines === false) {
                            this.updateTokenEndLineColumnLocation = utils_1.NOOP
                        }
                        if (/full/i.test(this.config.positionTracking)) {
                            this.createTokenInstance = this.createFullToken
                        } else if (
                            /onlyStart/i.test(this.config.positionTracking)
                        ) {
                            this.createTokenInstance = this.createStartOnlyToken
                        } else if (
                            /onlyOffset/i.test(this.config.positionTracking)
                        ) {
                            this.createTokenInstance = this.createOffsetOnlyToken
                        } else {
                            throw Error(
                                'Invalid <positionTracking> config option: "' +
                                    this.config.positionTracking +
                                    '"'
                            )
                        }
                        if (this.hasCustom) {
                            this.addToken = this.addTokenUsingPush
                            this.handlePayload = this.handlePayloadWithCustom
                        } else {
                            this.addToken = this.addTokenUsingMemberAccess
                            this.handlePayload = this.handlePayloadNoCustom
                        }
                        var unOptimizedModes = utils_1.reduce(
                            this.canModeBeOptimized,
                            function(
                                cannotBeOptimized,
                                canBeOptimized,
                                modeName
                            ) {
                                if (canBeOptimized === false) {
                                    cannotBeOptimized.push(modeName)
                                }
                                return cannotBeOptimized
                            },
                            []
                        )
                        if (
                            config.ensureOptimizations &&
                            !utils_1.isEmpty(unOptimizedModes)
                        ) {
                            throw Error(
                                "Lexer Modes: < " +
                                    unOptimizedModes.join(", ") +
                                    " > cannot be optimized.\n" +
                                    '\t Disable the "ensureOptimizations" lexer config flag to silently ignore this and run the lexer in an un-optimized mode.\n' +
                                    "\t Or inspect the console log for details on how to resolve these issues."
                            )
                        }
                        utils_1.toFastProperties(this)
                    }
                    Lexer.prototype.tokenize = function(text, initialMode) {
                        if (initialMode === void 0) {
                            initialMode = this.defaultMode
                        }
                        if (!utils_1.isEmpty(this.lexerDefinitionErrors)) {
                            var allErrMessages = utils_1.map(
                                this.lexerDefinitionErrors,
                                function(error) {
                                    return error.message
                                }
                            )
                            var allErrMessagesString = allErrMessages.join(
                                "-----------------------\n"
                            )
                            throw new Error(
                                "Unable to Tokenize because Errors detected in definition of Lexer:\n" +
                                    allErrMessagesString
                            )
                        }
                        var lexResult = this.tokenizeInternal(text, initialMode)
                        return lexResult
                    }
                    // There is quite a bit of duplication between this and "tokenizeInternalLazy"
                    // This is intentional due to performance considerations.
                    Lexer.prototype.tokenizeInternal = function(
                        text,
                        initialMode
                    ) {
                        var _this = this
                        var i,
                            j,
                            matchAltImage,
                            longerAltIdx,
                            matchedImage,
                            payload,
                            altPayload,
                            imageLength,
                            group,
                            tokType,
                            newToken,
                            errLength,
                            droppedChar,
                            msg,
                            match
                        var orgText = text
                        var orgLength = orgText.length
                        var offset = 0
                        var matchedTokensIndex = 0
                        // initializing the tokensArray to the "guessed" size.
                        // guessing too little will still reduce the number of array re-sizes on pushes.
                        // guessing too large (Tested by guessing x4 too large) may cost a bit more of memory
                        // but would still have a faster runtime by avoiding (All but one) array resizing.
                        var guessedNumberOfTokens = this.hasCustom
                            ? 0 // will break custom token pattern APIs the matchedTokens array will contain undefined elements.
                            : Math.floor(text.length / 10)
                        var matchedTokens = new Array(guessedNumberOfTokens)
                        var errors = []
                        var line = this.trackStartLines ? 1 : undefined
                        var column = this.trackStartLines ? 1 : undefined
                        var groups = lexer_1.cloneEmptyGroups(this.emptyGroups)
                        var trackLines = this.trackStartLines
                        var lineTerminatorPattern = this.config
                            .lineTerminatorsPattern
                        var currModePatternsLength = 0
                        var patternIdxToConfig = []
                        var currCharCodeToPatternIdxToConfig = []
                        var modeStack = []
                        var emptyArray = []
                        Object.freeze(emptyArray)
                        var getPossiblePatterns = undefined
                        var pop_mode = function(popToken) {
                            // TODO: perhaps avoid this error in the edge case there is no more input?
                            if (
                                modeStack.length === 1 &&
                                // if we have both a POP_MODE and a PUSH_MODE this is in-fact a "transition"
                                // So no error should occur.
                                popToken.tokenType.PUSH_MODE === undefined
                            ) {
                                // if we try to pop the last mode there lexer will no longer have ANY mode.
                                // thus the pop is ignored, an error will be created and the lexer will continue parsing in the previous mode.
                                var msg_1 = _this.config.errorMessageProvider.buildUnableToPopLexerModeMessage(
                                    popToken
                                )
                                errors.push({
                                    offset: popToken.startOffset,
                                    line:
                                        popToken.startLine !== undefined
                                            ? popToken.startLine
                                            : undefined,
                                    column:
                                        popToken.startColumn !== undefined
                                            ? popToken.startColumn
                                            : undefined,
                                    length: popToken.image.length,
                                    message: msg_1
                                })
                            } else {
                                modeStack.pop()
                                var newMode = utils_1.last(modeStack)
                                patternIdxToConfig =
                                    _this.patternIdxToConfig[newMode]
                                currCharCodeToPatternIdxToConfig =
                                    _this.charCodeToPatternIdxToConfig[newMode]
                                currModePatternsLength =
                                    patternIdxToConfig.length
                                var modeCanBeOptimized =
                                    _this.canModeBeOptimized[newMode] &&
                                    _this.config.safeMode === false
                                if (
                                    currCharCodeToPatternIdxToConfig &&
                                    modeCanBeOptimized
                                ) {
                                    getPossiblePatterns = function(charCode) {
                                        var possiblePatterns =
                                            currCharCodeToPatternIdxToConfig[
                                                charCode
                                            ]
                                        if (possiblePatterns === undefined) {
                                            return emptyArray
                                        } else {
                                            return possiblePatterns
                                        }
                                    }
                                } else {
                                    getPossiblePatterns = function() {
                                        return patternIdxToConfig
                                    }
                                }
                            }
                        }
                        function push_mode(newMode) {
                            modeStack.push(newMode)
                            currCharCodeToPatternIdxToConfig = this
                                .charCodeToPatternIdxToConfig[newMode]
                            patternIdxToConfig = this.patternIdxToConfig[
                                newMode
                            ]
                            currModePatternsLength = patternIdxToConfig.length
                            currModePatternsLength = patternIdxToConfig.length
                            var modeCanBeOptimized =
                                this.canModeBeOptimized[newMode] &&
                                this.config.safeMode === false
                            if (
                                currCharCodeToPatternIdxToConfig &&
                                modeCanBeOptimized
                            ) {
                                getPossiblePatterns = function(charCode) {
                                    var possiblePatterns =
                                        currCharCodeToPatternIdxToConfig[
                                            charCode
                                        ]
                                    if (possiblePatterns === undefined) {
                                        return emptyArray
                                    } else {
                                        return possiblePatterns
                                    }
                                }
                            } else {
                                getPossiblePatterns = function() {
                                    return patternIdxToConfig
                                }
                            }
                        }
                        // this pattern seems to avoid a V8 de-optimization, although that de-optimization does not
                        // seem to matter performance wise.
                        push_mode.call(this, initialMode)
                        var currConfig
                        while (offset < orgLength) {
                            matchedImage = null
                            var nextCharCode = orgText.charCodeAt(offset)
                            var chosenPatternIdxToConfig = getPossiblePatterns(
                                nextCharCode
                            )
                            var chosenPatternsLength =
                                chosenPatternIdxToConfig.length
                            for (i = 0; i < chosenPatternsLength; i++) {
                                currConfig = chosenPatternIdxToConfig[i]
                                var currPattern = currConfig.pattern
                                payload = null
                                // manually in-lined because > 600 chars won't be in-lined in V8
                                var singleCharCode = currConfig.short
                                if (singleCharCode !== false) {
                                    if (nextCharCode === singleCharCode) {
                                        // single character string
                                        matchedImage = currPattern
                                    }
                                } else if (currConfig.isCustom === true) {
                                    match = currPattern.exec(
                                        orgText,
                                        offset,
                                        matchedTokens,
                                        groups
                                    )
                                    if (match !== null) {
                                        matchedImage = match[0]
                                        if (match.payload !== undefined) {
                                            payload = match.payload
                                        }
                                    } else {
                                        matchedImage = null
                                    }
                                } else {
                                    this.updateLastIndex(currPattern, offset)
                                    matchedImage = this.match(
                                        currPattern,
                                        text,
                                        offset
                                    )
                                }
                                if (matchedImage !== null) {
                                    // even though this pattern matched we must try a another longer alternative.
                                    // this can be used to prioritize keywords over identifiers
                                    longerAltIdx = currConfig.longerAlt
                                    if (longerAltIdx !== undefined) {
                                        // TODO: micro optimize, avoid extra prop access
                                        // by saving/linking longerAlt on the original config?
                                        var longerAltConfig =
                                            patternIdxToConfig[longerAltIdx]
                                        var longerAltPattern =
                                            longerAltConfig.pattern
                                        altPayload = null
                                        // single Char can never be a longer alt so no need to test it.
                                        // manually in-lined because > 600 chars won't be in-lined in V8
                                        if (longerAltConfig.isCustom === true) {
                                            match = longerAltPattern.exec(
                                                orgText,
                                                offset,
                                                matchedTokens,
                                                groups
                                            )
                                            if (match !== null) {
                                                matchAltImage = match[0]
                                                if (
                                                    match.payload !== undefined
                                                ) {
                                                    altPayload = match.payload
                                                }
                                            } else {
                                                matchAltImage = null
                                            }
                                        } else {
                                            this.updateLastIndex(
                                                longerAltPattern,
                                                offset
                                            )
                                            matchAltImage = this.match(
                                                longerAltPattern,
                                                text,
                                                offset
                                            )
                                        }
                                        if (
                                            matchAltImage &&
                                            matchAltImage.length >
                                                matchedImage.length
                                        ) {
                                            matchedImage = matchAltImage
                                            payload = altPayload
                                            currConfig = longerAltConfig
                                        }
                                    }
                                    break
                                }
                            }
                            // successful match
                            if (matchedImage !== null) {
                                imageLength = matchedImage.length
                                group = currConfig.group
                                if (group !== undefined) {
                                    tokType = currConfig.tokenTypeIdx
                                    // TODO: "offset + imageLength" and the new column may be computed twice in case of "full" location information inside
                                    // createFullToken method
                                    newToken = this.createTokenInstance(
                                        matchedImage,
                                        offset,
                                        tokType,
                                        currConfig.tokenType,
                                        line,
                                        column,
                                        imageLength
                                    )
                                    this.handlePayload(newToken, payload)
                                    // TODO: optimize NOOP in case there are no special groups?
                                    if (group === false) {
                                        matchedTokensIndex = this.addToken(
                                            matchedTokens,
                                            matchedTokensIndex,
                                            newToken
                                        )
                                    } else {
                                        groups[group].push(newToken)
                                    }
                                }
                                text = this.chopInput(text, imageLength)
                                offset = offset + imageLength
                                // TODO: with newlines the column may be assigned twice
                                column = this.computeNewColumn(
                                    column,
                                    imageLength
                                )
                                if (
                                    trackLines === true &&
                                    currConfig.canLineTerminator === true
                                ) {
                                    var numOfLTsInMatch = 0
                                    var foundTerminator = void 0
                                    var lastLTEndOffset = void 0
                                    lineTerminatorPattern.lastIndex = 0
                                    do {
                                        foundTerminator = lineTerminatorPattern.test(
                                            matchedImage
                                        )
                                        if (foundTerminator === true) {
                                            lastLTEndOffset =
                                                lineTerminatorPattern.lastIndex -
                                                1
                                            numOfLTsInMatch++
                                        }
                                    } while (foundTerminator === true)
                                    if (numOfLTsInMatch !== 0) {
                                        line = line + numOfLTsInMatch
                                        column = imageLength - lastLTEndOffset
                                        this.updateTokenEndLineColumnLocation(
                                            newToken,
                                            group,
                                            lastLTEndOffset,
                                            numOfLTsInMatch,
                                            line,
                                            column,
                                            imageLength
                                        )
                                    }
                                }
                                // will be NOOP if no modes present
                                this.handleModes(
                                    currConfig,
                                    pop_mode,
                                    push_mode,
                                    newToken
                                )
                            } else {
                                // error recovery, drop characters until we identify a valid token's start point
                                var errorStartOffset = offset
                                var errorLine = line
                                var errorColumn = column
                                var foundResyncPoint = false
                                while (
                                    !foundResyncPoint &&
                                    offset < orgLength
                                ) {
                                    // drop chars until we succeed in matching something
                                    droppedChar = orgText.charCodeAt(offset)
                                    // Identity Func (when sticky flag is enabled)
                                    text = this.chopInput(text, 1)
                                    offset++
                                    for (
                                        j = 0;
                                        j < currModePatternsLength;
                                        j++
                                    ) {
                                        var currConfig_1 = patternIdxToConfig[j]
                                        var currPattern = currConfig_1.pattern
                                        // manually in-lined because > 600 chars won't be in-lined in V8
                                        var singleCharCode = currConfig_1.short
                                        if (singleCharCode !== false) {
                                            if (
                                                orgText.charCodeAt(offset) ===
                                                singleCharCode
                                            ) {
                                                // single character string
                                                foundResyncPoint = true
                                            }
                                        } else if (
                                            currConfig_1.isCustom === true
                                        ) {
                                            foundResyncPoint =
                                                currPattern.exec(
                                                    orgText,
                                                    offset,
                                                    matchedTokens,
                                                    groups
                                                ) !== null
                                        } else {
                                            this.updateLastIndex(
                                                currPattern,
                                                offset
                                            )
                                            foundResyncPoint =
                                                currPattern.exec(text) !== null
                                        }
                                        if (foundResyncPoint === true) {
                                            break
                                        }
                                    }
                                }
                                errLength = offset - errorStartOffset
                                // at this point we either re-synced or reached the end of the input text
                                msg = this.config.errorMessageProvider.buildUnexpectedCharactersMessage(
                                    orgText,
                                    errorStartOffset,
                                    errLength,
                                    errorLine,
                                    errorColumn
                                )
                                errors.push({
                                    offset: errorStartOffset,
                                    line: errorLine,
                                    column: errorColumn,
                                    length: errLength,
                                    message: msg
                                })
                            }
                        }
                        // if we do have custom patterns which push directly into the
                        // TODO: custom tokens should not push directly??
                        if (!this.hasCustom) {
                            // if we guessed a too large size for the tokens array this will shrink it to the right size.
                            matchedTokens.length = matchedTokensIndex
                        }
                        return {
                            tokens: matchedTokens,
                            groups: groups,
                            errors: errors
                        }
                    }
                    Lexer.prototype.handleModes = function(
                        config,
                        pop_mode,
                        push_mode,
                        newToken
                    ) {
                        if (config.pop === true) {
                            // need to save the PUSH_MODE property as if the mode is popped
                            // patternIdxToPopMode is updated to reflect the new mode after popping the stack
                            var pushMode = config.push
                            pop_mode(newToken)
                            if (pushMode !== undefined) {
                                push_mode.call(this, pushMode)
                            }
                        } else if (config.push !== undefined) {
                            push_mode.call(this, config.push)
                        }
                    }
                    Lexer.prototype.chopInput = function(text, length) {
                        return text.substring(length)
                    }
                    Lexer.prototype.updateLastIndex = function(
                        regExp,
                        newLastIndex
                    ) {
                        regExp.lastIndex = newLastIndex
                    }
                    // TODO: decrease this under 600 characters? inspect stripping comments option in TSC compiler
                    Lexer.prototype.updateTokenEndLineColumnLocation = function(
                        newToken,
                        group,
                        lastLTIdx,
                        numOfLTsInMatch,
                        line,
                        column,
                        imageLength
                    ) {
                        var lastCharIsLT, fixForEndingInLT
                        if (group !== undefined) {
                            // a none skipped multi line Token, need to update endLine/endColumn
                            lastCharIsLT = lastLTIdx === imageLength - 1
                            fixForEndingInLT = lastCharIsLT ? -1 : 0
                            if (
                                !(
                                    numOfLTsInMatch === 1 &&
                                    lastCharIsLT === true
                                )
                            ) {
                                // if a token ends in a LT that last LT only affects the line numbering of following Tokens
                                newToken.endLine = line + fixForEndingInLT
                                // the last LT in a token does not affect the endColumn either as the [columnStart ... columnEnd)
                                // inclusive to exclusive range.
                                newToken.endColumn =
                                    column - 1 + -fixForEndingInLT
                            }
                            // else single LT in the last character of a token, no need to modify the endLine/EndColumn
                        }
                    }
                    Lexer.prototype.computeNewColumn = function(
                        oldColumn,
                        imageLength
                    ) {
                        return oldColumn + imageLength
                    }
                    // Place holder, will be replaced by the correct variant according to the locationTracking option at runtime.
                    /* istanbul ignore next - place holder */
                    Lexer.prototype.createTokenInstance = function() {
                        var args = []
                        for (var _i = 0; _i < arguments.length; _i++) {
                            args[_i] = arguments[_i]
                        }
                        return null
                    }
                    Lexer.prototype.createOffsetOnlyToken = function(
                        image,
                        startOffset,
                        tokenTypeIdx,
                        tokenType
                    ) {
                        return {
                            image: image,
                            startOffset: startOffset,
                            tokenTypeIdx: tokenTypeIdx,
                            tokenType: tokenType
                        }
                    }
                    Lexer.prototype.createStartOnlyToken = function(
                        image,
                        startOffset,
                        tokenTypeIdx,
                        tokenType,
                        startLine,
                        startColumn
                    ) {
                        return {
                            image: image,
                            startOffset: startOffset,
                            startLine: startLine,
                            startColumn: startColumn,
                            tokenTypeIdx: tokenTypeIdx,
                            tokenType: tokenType
                        }
                    }
                    Lexer.prototype.createFullToken = function(
                        image,
                        startOffset,
                        tokenTypeIdx,
                        tokenType,
                        startLine,
                        startColumn,
                        imageLength
                    ) {
                        return {
                            image: image,
                            startOffset: startOffset,
                            endOffset: startOffset + imageLength - 1,
                            startLine: startLine,
                            endLine: startLine,
                            startColumn: startColumn,
                            endColumn: startColumn + imageLength - 1,
                            tokenTypeIdx: tokenTypeIdx,
                            tokenType: tokenType
                        }
                    }
                    // Place holder, will be replaced by the correct variant according to the locationTracking option at runtime.
                    /* istanbul ignore next - place holder */
                    Lexer.prototype.addToken = function(
                        tokenVector,
                        index,
                        tokenToAdd
                    ) {
                        return 666
                    }
                    Lexer.prototype.addTokenUsingPush = function(
                        tokenVector,
                        index,
                        tokenToAdd
                    ) {
                        tokenVector.push(tokenToAdd)
                        return index
                    }
                    Lexer.prototype.addTokenUsingMemberAccess = function(
                        tokenVector,
                        index,
                        tokenToAdd
                    ) {
                        tokenVector[index] = tokenToAdd
                        index++
                        return index
                    }
                    // Place holder, will be replaced by the correct variant according to the hasCustom flag option at runtime.
                    /* istanbul ignore next - place holder */
                    Lexer.prototype.handlePayload = function(token, payload) {}
                    Lexer.prototype.handlePayloadNoCustom = function(
                        token,
                        payload
                    ) {}
                    Lexer.prototype.handlePayloadWithCustom = function(
                        token,
                        payload
                    ) {
                        if (payload !== null) {
                            token.payload = payload
                        }
                    }
                    /* istanbul ignore next - place holder to be replaced with chosen alternative at runtime */
                    Lexer.prototype.match = function(pattern, text, offset) {
                        return null
                    }
                    Lexer.prototype.matchWithTest = function(
                        pattern,
                        text,
                        offset
                    ) {
                        var found = pattern.test(text)
                        if (found === true) {
                            return text.substring(offset, pattern.lastIndex)
                        }
                        return null
                    }
                    Lexer.prototype.matchWithExec = function(pattern, text) {
                        var regExpArray = pattern.exec(text)
                        return regExpArray !== null
                            ? regExpArray[0]
                            : regExpArray
                    }
                    Lexer.SKIPPED =
                        "This marks a skipped Token pattern, this means each token identified by it will" +
                        "be consumed and then thrown into oblivion, this can be used to for example to completely ignore whitespace."
                    Lexer.NA = /NOT_APPLICABLE/
                    return Lexer
                })()
                exports.Lexer = Lexer
                //# sourceMappingURL=lexer_public.js.map

                /***/
            },
            /* 16 */
            /***/ function(module, exports, __webpack_require__) {
                "use strict"

                var __extends =
                    (this && this.__extends) ||
                    (function() {
                        var extendStatics = function(d, b) {
                            extendStatics =
                                Object.setPrototypeOf ||
                                ({ __proto__: [] } instanceof Array &&
                                    function(d, b) {
                                        d.__proto__ = b
                                    }) ||
                                function(d, b) {
                                    for (var p in b)
                                        if (b.hasOwnProperty(p)) d[p] = b[p]
                                }
                            return extendStatics(d, b)
                        }
                        return function(d, b) {
                            extendStatics(d, b)
                            function __() {
                                this.constructor = d
                            }
                            d.prototype =
                                b === null
                                    ? Object.create(b)
                                    : ((__.prototype = b.prototype), new __())
                        }
                    })()
                Object.defineProperty(exports, "__esModule", { value: true })
                var utils_1 = __webpack_require__(0)
                var lang_extensions_1 = __webpack_require__(4)
                var keys_1 = __webpack_require__(9)
                var gast_public_1 = __webpack_require__(1)
                var gast_visitor_public_1 = __webpack_require__(5)
                /**
                 * This nodeLocation tracking is not efficient and should only be used
                 * when error recovery is enabled or the Token Vector contains virtual Tokens
                 * (e.g, Python Indent/Outdent)
                 * As it executes the calculation for every single terminal/nonTerminal
                 * and does not rely on the fact the token vector is **sorted**
                 */
                function setNodeLocationOnlyOffset(
                    currNodeLocation,
                    newLocationInfo
                ) {
                    // First (valid) update for this cst node
                    if (isNaN(currNodeLocation.startOffset) === true) {
                        // assumption1: Token location information is either NaN or a valid number
                        // assumption2: Token location information is fully valid if it exist
                        // (both start/end offsets exist and are numbers).
                        currNodeLocation.startOffset =
                            newLocationInfo.startOffset
                        currNodeLocation.endOffset = newLocationInfo.endOffset
                    }
                    // Once the startOffset has been updated with a valid number it should never receive
                    // any farther updates as the Token vector is sorted.
                    // We still have to check this this condition for every new possible location info
                    // because with error recovery enabled we may encounter invalid tokens (NaN location props)
                    else if (
                        currNodeLocation.endOffset <
                            newLocationInfo.endOffset ===
                        true
                    ) {
                        currNodeLocation.endOffset = newLocationInfo.endOffset
                    }
                }
                exports.setNodeLocationOnlyOffset = setNodeLocationOnlyOffset
                /**
                 * This nodeLocation tracking is not efficient and should only be used
                 * when error recovery is enabled or the Token Vector contains virtual Tokens
                 * (e.g, Python Indent/Outdent)
                 * As it executes the calculation for every single terminal/nonTerminal
                 * and does not rely on the fact the token vector is **sorted**
                 */
                function setNodeLocationFull(
                    currNodeLocation,
                    newLocationInfo
                ) {
                    // First (valid) update for this cst node
                    if (isNaN(currNodeLocation.startOffset) === true) {
                        // assumption1: Token location information is either NaN or a valid number
                        // assumption2: Token location information is fully valid if it exist
                        // (all start/end props exist and are numbers).
                        currNodeLocation.startOffset =
                            newLocationInfo.startOffset
                        currNodeLocation.startColumn =
                            newLocationInfo.startColumn
                        currNodeLocation.startLine = newLocationInfo.startLine
                        currNodeLocation.endOffset = newLocationInfo.endOffset
                        currNodeLocation.endColumn = newLocationInfo.endColumn
                        currNodeLocation.endLine = newLocationInfo.endLine
                    }
                    // Once the start props has been updated with a valid number it should never receive
                    // any farther updates as the Token vector is sorted.
                    // We still have to check this this condition for every new possible location info
                    // because with error recovery enabled we may encounter invalid tokens (NaN location props)
                    else if (
                        currNodeLocation.endOffset <
                            newLocationInfo.endOffset ===
                        true
                    ) {
                        currNodeLocation.endOffset = newLocationInfo.endOffset
                        currNodeLocation.endColumn = newLocationInfo.endColumn
                        currNodeLocation.endLine = newLocationInfo.endLine
                    }
                }
                exports.setNodeLocationFull = setNodeLocationFull
                function addTerminalToCst(node, token, tokenTypeName) {
                    if (node.children[tokenTypeName] === undefined) {
                        node.children[tokenTypeName] = [token]
                    } else {
                        node.children[tokenTypeName].push(token)
                    }
                }
                exports.addTerminalToCst = addTerminalToCst
                function addNoneTerminalToCst(node, ruleName, ruleResult) {
                    if (node.children[ruleName] === undefined) {
                        node.children[ruleName] = [ruleResult]
                    } else {
                        node.children[ruleName].push(ruleResult)
                    }
                }
                exports.addNoneTerminalToCst = addNoneTerminalToCst
                var NamedDSLMethodsCollectorVisitor = /** @class */ (function(
                    _super
                ) {
                    __extends(NamedDSLMethodsCollectorVisitor, _super)
                    function NamedDSLMethodsCollectorVisitor(ruleIdx) {
                        var _this = _super.call(this) || this
                        _this.result = []
                        _this.ruleIdx = ruleIdx
                        return _this
                    }
                    NamedDSLMethodsCollectorVisitor.prototype.collectNamedDSLMethod = function(
                        node,
                        newNodeConstructor,
                        methodIdx
                    ) {
                        // TODO: better hack to copy what we need here...
                        if (!utils_1.isUndefined(node.name)) {
                            // copy without name so this will indeed be processed later.
                            var nameLessNode =
                                /* istanbul ignore else */
                                void 0
                            /* istanbul ignore else */
                            if (
                                node instanceof gast_public_1.Option ||
                                node instanceof gast_public_1.Repetition ||
                                node instanceof
                                    gast_public_1.RepetitionMandatory ||
                                node instanceof gast_public_1.Alternation
                            ) {
                                nameLessNode = new newNodeConstructor({
                                    definition: node.definition,
                                    idx: node.idx
                                })
                            } else if (
                                node instanceof
                                    gast_public_1.RepetitionMandatoryWithSeparator ||
                                node instanceof
                                    gast_public_1.RepetitionWithSeparator
                            ) {
                                nameLessNode = new newNodeConstructor({
                                    definition: node.definition,
                                    idx: node.idx,
                                    separator: node.separator
                                })
                            } else {
                                throw Error("non exhaustive match")
                            }
                            var def = [nameLessNode]
                            var key = keys_1.getKeyForAutomaticLookahead(
                                this.ruleIdx,
                                methodIdx,
                                node.idx
                            )
                            this.result.push({
                                def: def,
                                key: key,
                                name: node.name,
                                orgProd: node
                            })
                        }
                    }
                    NamedDSLMethodsCollectorVisitor.prototype.visitOption = function(
                        node
                    ) {
                        this.collectNamedDSLMethod(
                            node,
                            gast_public_1.Option,
                            keys_1.OPTION_IDX
                        )
                    }
                    NamedDSLMethodsCollectorVisitor.prototype.visitRepetition = function(
                        node
                    ) {
                        this.collectNamedDSLMethod(
                            node,
                            gast_public_1.Repetition,
                            keys_1.MANY_IDX
                        )
                    }
                    NamedDSLMethodsCollectorVisitor.prototype.visitRepetitionMandatory = function(
                        node
                    ) {
                        this.collectNamedDSLMethod(
                            node,
                            gast_public_1.RepetitionMandatory,
                            keys_1.AT_LEAST_ONE_IDX
                        )
                    }
                    NamedDSLMethodsCollectorVisitor.prototype.visitRepetitionMandatoryWithSeparator = function(
                        node
                    ) {
                        this.collectNamedDSLMethod(
                            node,
                            gast_public_1.RepetitionMandatoryWithSeparator,
                            keys_1.AT_LEAST_ONE_SEP_IDX
                        )
                    }
                    NamedDSLMethodsCollectorVisitor.prototype.visitRepetitionWithSeparator = function(
                        node
                    ) {
                        this.collectNamedDSLMethod(
                            node,
                            gast_public_1.RepetitionWithSeparator,
                            keys_1.MANY_SEP_IDX
                        )
                    }
                    NamedDSLMethodsCollectorVisitor.prototype.visitAlternation = function(
                        node
                    ) {
                        var _this = this
                        this.collectNamedDSLMethod(
                            node,
                            gast_public_1.Alternation,
                            keys_1.OR_IDX
                        )
                        var hasMoreThanOneAlternative =
                            node.definition.length > 1
                        utils_1.forEach(node.definition, function(
                            currFlatAlt,
                            altIdx
                        ) {
                            if (!utils_1.isUndefined(currFlatAlt.name)) {
                                var def = currFlatAlt.definition
                                if (hasMoreThanOneAlternative) {
                                    def = [
                                        new gast_public_1.Option({
                                            definition: currFlatAlt.definition
                                        })
                                    ]
                                } else {
                                    // mandatory
                                    def = currFlatAlt.definition
                                }
                                var key = keys_1.getKeyForAltIndex(
                                    _this.ruleIdx,
                                    keys_1.OR_IDX,
                                    node.idx,
                                    altIdx
                                )
                                _this.result.push({
                                    def: def,
                                    key: key,
                                    name: currFlatAlt.name,
                                    orgProd: currFlatAlt
                                })
                            }
                        })
                    }
                    return NamedDSLMethodsCollectorVisitor
                })(gast_visitor_public_1.GAstVisitor)
                exports.NamedDSLMethodsCollectorVisitor = NamedDSLMethodsCollectorVisitor
                function analyzeCst(topRules, fullToShortName) {
                    var result = {
                        dictDef: new lang_extensions_1.HashTable(),
                        allRuleNames: []
                    }
                    utils_1.forEach(topRules, function(currTopRule) {
                        var currTopRuleShortName = fullToShortName.get(
                            currTopRule.name
                        )
                        result.allRuleNames.push(currTopRule.name)
                        var namedCollectorVisitor = new NamedDSLMethodsCollectorVisitor(
                            currTopRuleShortName
                        )
                        currTopRule.accept(namedCollectorVisitor)
                        utils_1.forEach(namedCollectorVisitor.result, function(
                            _a
                        ) {
                            var def = _a.def,
                                key = _a.key,
                                name = _a.name
                            result.allRuleNames.push(currTopRule.name + name)
                        })
                    })
                    return result
                }
                exports.analyzeCst = analyzeCst
                //# sourceMappingURL=cst.js.map

                /***/
            },
            /* 17 */
            /***/ function(module, exports, __webpack_require__) {
                "use strict"

                Object.defineProperty(exports, "__esModule", { value: true })
                // needs a separate module as this is required inside chevrotain productive code
                // and also in the entry point for webpack(api.ts).
                // A separate file avoids cyclic dependencies and webpack errors.
                exports.VERSION = "4.8.1"
                //# sourceMappingURL=version.js.map

                /***/
            },
            /* 18 */
            /***/ function(module, exports, __webpack_require__) {
                "use strict"

                Object.defineProperty(exports, "__esModule", { value: true })
                var parser_1 = __webpack_require__(3)
                var lexer_public_1 = __webpack_require__(15)
                var tokens_public_1 = __webpack_require__(2)
                var exceptions_public_1 = __webpack_require__(6)
                var version_1 = __webpack_require__(17)
                var errors_public_1 = __webpack_require__(10)
                var render_public_1 = __webpack_require__(39)
                var gast_visitor_public_1 = __webpack_require__(5)
                var gast_public_1 = __webpack_require__(1)
                var gast_resolver_public_1 = __webpack_require__(24)
                var generate_public_1 = __webpack_require__(40)
                var lexer_errors_public_1 = __webpack_require__(20)
                /**
                 * defines the public API of
                 * changes here may require major version change. (semVer)
                 */
                var API = {}
                // semantic version
                API.VERSION = version_1.VERSION
                // runtime API
                API.Parser = parser_1.Parser
                API.CstParser = parser_1.CstParser
                API.EmbeddedActionsParser = parser_1.EmbeddedActionsParser
                // TypeCheck Multi Trait Parser API against official Chevrotain API
                // The only thing this does not check is the constructor signature.
                var mixedDummyInstance = null
                var officalDummyInstance = mixedDummyInstance
                API.ParserDefinitionErrorType =
                    parser_1.ParserDefinitionErrorType
                API.Lexer = lexer_public_1.Lexer
                API.LexerDefinitionErrorType =
                    lexer_public_1.LexerDefinitionErrorType
                API.EOF = tokens_public_1.EOF
                // Tokens utilities
                API.tokenName = tokens_public_1.tokenName
                API.tokenLabel = tokens_public_1.tokenLabel
                API.tokenMatcher = tokens_public_1.tokenMatcher
                API.createToken = tokens_public_1.createToken
                API.createTokenInstance = tokens_public_1.createTokenInstance
                //
                // // Other Utilities
                API.EMPTY_ALT = parser_1.EMPTY_ALT
                API.defaultParserErrorProvider =
                    errors_public_1.defaultParserErrorProvider
                API.isRecognitionException =
                    exceptions_public_1.isRecognitionException
                API.EarlyExitException = exceptions_public_1.EarlyExitException
                API.MismatchedTokenException =
                    exceptions_public_1.MismatchedTokenException
                API.NotAllInputParsedException =
                    exceptions_public_1.NotAllInputParsedException
                API.NoViableAltException =
                    exceptions_public_1.NoViableAltException
                API.defaultLexerErrorProvider =
                    lexer_errors_public_1.defaultLexerErrorProvider
                //
                // // grammar reflection API
                API.Flat = gast_public_1.Flat
                API.Repetition = gast_public_1.Repetition
                API.RepetitionWithSeparator =
                    gast_public_1.RepetitionWithSeparator
                API.RepetitionMandatory = gast_public_1.RepetitionMandatory
                API.RepetitionMandatoryWithSeparator =
                    gast_public_1.RepetitionMandatoryWithSeparator
                API.Option = gast_public_1.Option
                API.Alternation = gast_public_1.Alternation
                API.NonTerminal = gast_public_1.NonTerminal
                API.Terminal = gast_public_1.Terminal
                API.Rule = gast_public_1.Rule
                // // GAST Utilities
                API.GAstVisitor = gast_visitor_public_1.GAstVisitor
                API.serializeGrammar = gast_public_1.serializeGrammar
                API.serializeProduction = gast_public_1.serializeProduction
                API.resolveGrammar = gast_resolver_public_1.resolveGrammar
                API.defaultGrammarResolverErrorProvider =
                    errors_public_1.defaultGrammarResolverErrorProvider
                API.validateGrammar = gast_resolver_public_1.validateGrammar
                API.defaultGrammarValidatorErrorProvider =
                    errors_public_1.defaultGrammarValidatorErrorProvider
                API.assignOccurrenceIndices =
                    gast_resolver_public_1.assignOccurrenceIndices
                /* istanbul ignore next */
                API.clearCache = function() {
                    console.warn(
                        "The clearCache function was 'soft' removed from the Chevrotain API." +
                            "\n\t It performs no action other than printing this message." +
                            "\n\t Please avoid using it as it will be completely removed in the future"
                    )
                }
                API.createSyntaxDiagramsCode =
                    render_public_1.createSyntaxDiagramsCode
                API.generateParserFactory =
                    generate_public_1.generateParserFactory
                API.generateParserModule =
                    generate_public_1.generateParserModule
                module.exports = API
                //# sourceMappingURL=api.js.map

                /***/
            },
            /* 19 */
            /***/ function(module, exports, __webpack_require__) {
                var __WEBPACK_AMD_DEFINE_FACTORY__,
                    __WEBPACK_AMD_DEFINE_ARRAY__,
                    __WEBPACK_AMD_DEFINE_RESULT__
                ;(function(root, factory) {
                    // istanbul ignore next
                    if (true) {
                        // istanbul ignore next
                        !((__WEBPACK_AMD_DEFINE_ARRAY__ = []),
                        (__WEBPACK_AMD_DEFINE_FACTORY__ = factory),
                        (__WEBPACK_AMD_DEFINE_RESULT__ =
                            typeof __WEBPACK_AMD_DEFINE_FACTORY__ === "function"
                                ? __WEBPACK_AMD_DEFINE_FACTORY__.apply(
                                      exports,
                                      __WEBPACK_AMD_DEFINE_ARRAY__
                                  )
                                : __WEBPACK_AMD_DEFINE_FACTORY__),
                        __WEBPACK_AMD_DEFINE_RESULT__ !== undefined &&
                            (module.exports = __WEBPACK_AMD_DEFINE_RESULT__))
                    } else {
                    }
                })(
                    typeof self !== "undefined"
                        ? // istanbul ignore next
                          self
                        : this,
                    function() {
                        // references
                        // https://hackernoon.com/the-madness-of-parsing-real-world-javascript-regexps-d9ee336df983
                        // https://www.ecma-international.org/ecma-262/8.0/index.html#prod-Pattern
                        function RegExpParser() {}

                        RegExpParser.prototype.saveState = function() {
                            return {
                                idx: this.idx,
                                input: this.input,
                                groupIdx: this.groupIdx
                            }
                        }

                        RegExpParser.prototype.restoreState = function(
                            newState
                        ) {
                            this.idx = newState.idx
                            this.input = newState.input
                            this.groupIdx = newState.groupIdx
                        }

                        RegExpParser.prototype.pattern = function(input) {
                            // parser state
                            this.idx = 0
                            this.input = input
                            this.groupIdx = 0

                            this.consumeChar("/")
                            var value = this.disjunction()
                            this.consumeChar("/")

                            var flags = {
                                type: "Flags",
                                global: false,
                                ignoreCase: false,
                                multiLine: false,
                                unicode: false,
                                sticky: false
                            }

                            while (this.isRegExpFlag()) {
                                switch (this.popChar()) {
                                    case "g":
                                        addFlag(flags, "global")
                                        break
                                    case "i":
                                        addFlag(flags, "ignoreCase")
                                        break
                                    case "m":
                                        addFlag(flags, "multiLine")
                                        break
                                    case "u":
                                        addFlag(flags, "unicode")
                                        break
                                    case "y":
                                        addFlag(flags, "sticky")
                                        break
                                }
                            }

                            if (this.idx !== this.input.length) {
                                throw Error(
                                    "Redundant input: " +
                                        this.input.substring(this.idx)
                                )
                            }
                            return {
                                type: "Pattern",
                                flags: flags,
                                value: value
                            }
                        }

                        RegExpParser.prototype.disjunction = function() {
                            var alts = []
                            alts.push(this.alternative())

                            while (this.peekChar() === "|") {
                                this.consumeChar("|")
                                alts.push(this.alternative())
                            }

                            return { type: "Disjunction", value: alts }
                        }

                        RegExpParser.prototype.alternative = function() {
                            var terms = []

                            while (this.isTerm()) {
                                terms.push(this.term())
                            }

                            return { type: "Alternative", value: terms }
                        }

                        RegExpParser.prototype.term = function() {
                            if (this.isAssertion()) {
                                return this.assertion()
                            } else {
                                return this.atom()
                            }
                        }

                        RegExpParser.prototype.assertion = function() {
                            switch (this.popChar()) {
                                case "^":
                                    return { type: "StartAnchor" }
                                case "$":
                                    return { type: "EndAnchor" }
                                // '\b' or '\B'
                                case "\\":
                                    switch (this.popChar()) {
                                        case "b":
                                            return { type: "WordBoundary" }
                                        case "B":
                                            return { type: "NonWordBoundary" }
                                    }
                                    // istanbul ignore next
                                    throw Error("Invalid Assertion Escape")
                                // '(?=' or '(?!'
                                case "(":
                                    this.consumeChar("?")

                                    var type
                                    switch (this.popChar()) {
                                        case "=":
                                            type = "Lookahead"
                                            break
                                        case "!":
                                            type = "NegativeLookahead"
                                            break
                                    }
                                    ASSERT_EXISTS(type)

                                    var disjunction = this.disjunction()

                                    this.consumeChar(")")

                                    return { type: type, value: disjunction }
                            }
                            // istanbul ignore next
                            ASSERT_NEVER_REACH_HERE()
                        }

                        RegExpParser.prototype.quantifier = function(
                            isBacktracking
                        ) {
                            var range
                            switch (this.popChar()) {
                                case "*":
                                    range = {
                                        atLeast: 0,
                                        atMost: Infinity
                                    }
                                    break
                                case "+":
                                    range = {
                                        atLeast: 1,
                                        atMost: Infinity
                                    }
                                    break
                                case "?":
                                    range = {
                                        atLeast: 0,
                                        atMost: 1
                                    }
                                    break
                                case "{":
                                    var atLeast = this.integerIncludingZero()
                                    switch (this.popChar()) {
                                        case "}":
                                            range = {
                                                atLeast: atLeast,
                                                atMost: atLeast
                                            }
                                            break
                                        case ",":
                                            var atMost
                                            if (this.isDigit()) {
                                                atMost = this.integerIncludingZero()
                                                range = {
                                                    atLeast: atLeast,
                                                    atMost: atMost
                                                }
                                            } else {
                                                range = {
                                                    atLeast: atLeast,
                                                    atMost: Infinity
                                                }
                                            }
                                            this.consumeChar("}")
                                            break
                                    }
                                    // throwing exceptions from "ASSERT_EXISTS" during backtracking
                                    // causes severe performance degradations
                                    if (
                                        isBacktracking === true &&
                                        range === undefined
                                    ) {
                                        return undefined
                                    }
                                    ASSERT_EXISTS(range)
                                    break
                            }

                            // throwing exceptions from "ASSERT_EXISTS" during backtracking
                            // causes severe performance degradations
                            if (
                                isBacktracking === true &&
                                range === undefined
                            ) {
                                return undefined
                            }

                            ASSERT_EXISTS(range)

                            if (this.peekChar(0) === "?") {
                                this.consumeChar("?")
                                range.greedy = false
                            } else {
                                range.greedy = true
                            }

                            range.type = "Quantifier"
                            return range
                        }

                        RegExpParser.prototype.atom = function() {
                            var atom
                            switch (this.peekChar()) {
                                case ".":
                                    atom = this.dotAll()
                                    break
                                case "\\":
                                    atom = this.atomEscape()
                                    break
                                case "[":
                                    atom = this.characterClass()
                                    break
                                case "(":
                                    atom = this.group()
                                    break
                            }

                            if (
                                atom === undefined &&
                                this.isPatternCharacter()
                            ) {
                                atom = this.patternCharacter()
                            }

                            ASSERT_EXISTS(atom)

                            if (this.isQuantifier()) {
                                atom.quantifier = this.quantifier()
                            }

                            return atom
                        }

                        RegExpParser.prototype.dotAll = function() {
                            this.consumeChar(".")
                            return {
                                type: "Set",
                                complement: true,
                                value: [
                                    cc("\n"),
                                    cc("\r"),
                                    cc("\u2028"),
                                    cc("\u2029")
                                ]
                            }
                        }

                        RegExpParser.prototype.atomEscape = function() {
                            this.consumeChar("\\")

                            switch (this.peekChar()) {
                                case "1":
                                case "2":
                                case "3":
                                case "4":
                                case "5":
                                case "6":
                                case "7":
                                case "8":
                                case "9":
                                    return this.decimalEscapeAtom()
                                case "d":
                                case "D":
                                case "s":
                                case "S":
                                case "w":
                                case "W":
                                    return this.characterClassEscape()
                                case "f":
                                case "n":
                                case "r":
                                case "t":
                                case "v":
                                    return this.controlEscapeAtom()
                                case "c":
                                    return this.controlLetterEscapeAtom()
                                case "0":
                                    return this.nulCharacterAtom()
                                case "x":
                                    return this.hexEscapeSequenceAtom()
                                case "u":
                                    return this.regExpUnicodeEscapeSequenceAtom()
                                default:
                                    return this.identityEscapeAtom()
                            }
                        }

                        RegExpParser.prototype.decimalEscapeAtom = function() {
                            var value = this.positiveInteger()

                            return { type: "GroupBackReference", value: value }
                        }

                        RegExpParser.prototype.characterClassEscape = function() {
                            var set
                            var complement = false
                            switch (this.popChar()) {
                                case "d":
                                    set = digitsCharCodes
                                    break
                                case "D":
                                    set = digitsCharCodes
                                    complement = true
                                    break
                                case "s":
                                    set = whitespaceCodes
                                    break
                                case "S":
                                    set = whitespaceCodes
                                    complement = true
                                    break
                                case "w":
                                    set = wordCharCodes
                                    break
                                case "W":
                                    set = wordCharCodes
                                    complement = true
                                    break
                            }

                            ASSERT_EXISTS(set)

                            return {
                                type: "Set",
                                value: set,
                                complement: complement
                            }
                        }

                        RegExpParser.prototype.controlEscapeAtom = function() {
                            var escapeCode
                            switch (this.popChar()) {
                                case "f":
                                    escapeCode = cc("\f")
                                    break
                                case "n":
                                    escapeCode = cc("\n")
                                    break
                                case "r":
                                    escapeCode = cc("\r")
                                    break
                                case "t":
                                    escapeCode = cc("\t")
                                    break
                                case "v":
                                    escapeCode = cc("\v")
                                    break
                            }
                            ASSERT_EXISTS(escapeCode)

                            return { type: "Character", value: escapeCode }
                        }

                        RegExpParser.prototype.controlLetterEscapeAtom = function() {
                            this.consumeChar("c")
                            var letter = this.popChar()
                            if (/[a-zA-Z]/.test(letter) === false) {
                                throw Error("Invalid ")
                            }

                            var letterCode =
                                letter.toUpperCase().charCodeAt(0) - 64
                            return { type: "Character", value: letterCode }
                        }

                        RegExpParser.prototype.nulCharacterAtom = function() {
                            // TODO implement '[lookahead ∉ DecimalDigit]'
                            // TODO: for the deprecated octal escape sequence
                            this.consumeChar("0")
                            return { type: "Character", value: cc("\0") }
                        }

                        RegExpParser.prototype.hexEscapeSequenceAtom = function() {
                            this.consumeChar("x")
                            return this.parseHexDigits(2)
                        }

                        RegExpParser.prototype.regExpUnicodeEscapeSequenceAtom = function() {
                            this.consumeChar("u")
                            return this.parseHexDigits(4)
                        }

                        RegExpParser.prototype.identityEscapeAtom = function() {
                            // TODO: implement "SourceCharacter but not UnicodeIDContinue"
                            // // http://unicode.org/reports/tr31/#Specific_Character_Adjustments
                            var escapedChar = this.popChar()
                            return { type: "Character", value: cc(escapedChar) }
                        }

                        RegExpParser.prototype.classPatternCharacterAtom = function() {
                            switch (this.peekChar()) {
                                // istanbul ignore next
                                case "\n":
                                // istanbul ignore next
                                case "\r":
                                // istanbul ignore next
                                case "\u2028":
                                // istanbul ignore next
                                case "\u2029":
                                // istanbul ignore next
                                case "\\":
                                // istanbul ignore next
                                case "]":
                                    throw Error("TBD")
                                default:
                                    var nextChar = this.popChar()
                                    return {
                                        type: "Character",
                                        value: cc(nextChar)
                                    }
                            }
                        }

                        RegExpParser.prototype.characterClass = function() {
                            var set = []
                            var complement = false
                            this.consumeChar("[")
                            if (this.peekChar(0) === "^") {
                                this.consumeChar("^")
                                complement = true
                            }

                            while (this.isClassAtom()) {
                                var from = this.classAtom()
                                var isFromSingleChar = from.type === "Character"
                                if (isFromSingleChar && this.isRangeDash()) {
                                    this.consumeChar("-")
                                    var to = this.classAtom()
                                    var isToSingleChar = to.type === "Character"

                                    // a range can only be used when both sides are single characters
                                    if (isToSingleChar) {
                                        if (to.value < from.value) {
                                            throw Error(
                                                "Range out of order in character class"
                                            )
                                        }
                                        set.push({
                                            from: from.value,
                                            to: to.value
                                        })
                                    } else {
                                        // literal dash
                                        insertToSet(from.value, set)
                                        set.push(cc("-"))
                                        insertToSet(to.value, set)
                                    }
                                } else {
                                    insertToSet(from.value, set)
                                }
                            }

                            this.consumeChar("]")

                            return {
                                type: "Set",
                                complement: complement,
                                value: set
                            }
                        }

                        RegExpParser.prototype.classAtom = function() {
                            switch (this.peekChar()) {
                                // istanbul ignore next
                                case "]":
                                // istanbul ignore next
                                case "\n":
                                // istanbul ignore next
                                case "\r":
                                // istanbul ignore next
                                case "\u2028":
                                // istanbul ignore next
                                case "\u2029":
                                    throw Error("TBD")
                                case "\\":
                                    return this.classEscape()
                                default:
                                    return this.classPatternCharacterAtom()
                            }
                        }

                        RegExpParser.prototype.classEscape = function() {
                            this.consumeChar("\\")
                            switch (this.peekChar()) {
                                // Matches a backspace.
                                // (Not to be confused with \b word boundary outside characterClass)
                                case "b":
                                    this.consumeChar("b")
                                    return {
                                        type: "Character",
                                        value: cc("\u0008")
                                    }
                                case "d":
                                case "D":
                                case "s":
                                case "S":
                                case "w":
                                case "W":
                                    return this.characterClassEscape()
                                case "f":
                                case "n":
                                case "r":
                                case "t":
                                case "v":
                                    return this.controlEscapeAtom()
                                case "c":
                                    return this.controlLetterEscapeAtom()
                                case "0":
                                    return this.nulCharacterAtom()
                                case "x":
                                    return this.hexEscapeSequenceAtom()
                                case "u":
                                    return this.regExpUnicodeEscapeSequenceAtom()
                                default:
                                    return this.identityEscapeAtom()
                            }
                        }

                        RegExpParser.prototype.group = function() {
                            var capturing = true
                            this.consumeChar("(")
                            switch (this.peekChar(0)) {
                                case "?":
                                    this.consumeChar("?")
                                    this.consumeChar(":")
                                    capturing = false
                                    break
                                default:
                                    this.groupIdx++
                                    break
                            }
                            var value = this.disjunction()
                            this.consumeChar(")")

                            var groupAst = {
                                type: "Group",
                                capturing: capturing,
                                value: value
                            }

                            if (capturing) {
                                groupAst.idx = this.groupIdx
                            }

                            return groupAst
                        }

                        RegExpParser.prototype.positiveInteger = function() {
                            var number = this.popChar()

                            // istanbul ignore next - can't ever get here due to previous lookahead checks
                            // still implementing this error checking in case this ever changes.
                            if (decimalPatternNoZero.test(number) === false) {
                                throw Error("Expecting a positive integer")
                            }

                            while (decimalPattern.test(this.peekChar(0))) {
                                number += this.popChar()
                            }

                            return parseInt(number, 10)
                        }

                        RegExpParser.prototype.integerIncludingZero = function() {
                            var number = this.popChar()
                            if (decimalPattern.test(number) === false) {
                                throw Error("Expecting an integer")
                            }

                            while (decimalPattern.test(this.peekChar(0))) {
                                number += this.popChar()
                            }

                            return parseInt(number, 10)
                        }

                        RegExpParser.prototype.patternCharacter = function() {
                            var nextChar = this.popChar()
                            switch (nextChar) {
                                // istanbul ignore next
                                case "\n":
                                // istanbul ignore next
                                case "\r":
                                // istanbul ignore next
                                case "\u2028":
                                // istanbul ignore next
                                case "\u2029":
                                // istanbul ignore next
                                case "^":
                                // istanbul ignore next
                                case "$":
                                // istanbul ignore next
                                case "\\":
                                // istanbul ignore next
                                case ".":
                                // istanbul ignore next
                                case "*":
                                // istanbul ignore next
                                case "+":
                                // istanbul ignore next
                                case "?":
                                // istanbul ignore next
                                case "(":
                                // istanbul ignore next
                                case ")":
                                // istanbul ignore next
                                case "[":
                                // istanbul ignore next
                                case "|":
                                    // istanbul ignore next
                                    throw Error("TBD")
                                default:
                                    return {
                                        type: "Character",
                                        value: cc(nextChar)
                                    }
                            }
                        }
                        RegExpParser.prototype.isRegExpFlag = function() {
                            switch (this.peekChar(0)) {
                                case "g":
                                case "i":
                                case "m":
                                case "u":
                                case "y":
                                    return true
                                default:
                                    return false
                            }
                        }

                        RegExpParser.prototype.isRangeDash = function() {
                            return (
                                this.peekChar() === "-" && this.isClassAtom(1)
                            )
                        }

                        RegExpParser.prototype.isDigit = function() {
                            return decimalPattern.test(this.peekChar(0))
                        }

                        RegExpParser.prototype.isClassAtom = function(howMuch) {
                            if (howMuch === undefined) {
                                howMuch = 0
                            }

                            switch (this.peekChar(howMuch)) {
                                case "]":
                                case "\n":
                                case "\r":
                                case "\u2028":
                                case "\u2029":
                                    return false
                                default:
                                    return true
                            }
                        }

                        RegExpParser.prototype.isTerm = function() {
                            return this.isAtom() || this.isAssertion()
                        }

                        RegExpParser.prototype.isAtom = function() {
                            if (this.isPatternCharacter()) {
                                return true
                            }

                            switch (this.peekChar(0)) {
                                case ".":
                                case "\\": // atomEscape
                                case "[": // characterClass
                                // TODO: isAtom must be called before isAssertion - disambiguate
                                case "(": // group
                                    return true
                                default:
                                    return false
                            }
                        }

                        RegExpParser.prototype.isAssertion = function() {
                            switch (this.peekChar(0)) {
                                case "^":
                                case "$":
                                    return true
                                // '\b' or '\B'
                                case "\\":
                                    switch (this.peekChar(1)) {
                                        case "b":
                                        case "B":
                                            return true
                                        default:
                                            return false
                                    }
                                // '(?=' or '(?!'
                                case "(":
                                    return (
                                        this.peekChar(1) === "?" &&
                                        (this.peekChar(2) === "=" ||
                                            this.peekChar(2) === "!")
                                    )
                                default:
                                    return false
                            }
                        }

                        RegExpParser.prototype.isQuantifier = function() {
                            var prevState = this.saveState()
                            try {
                                return this.quantifier(true) !== undefined
                            } catch (e) {
                                return false
                            } finally {
                                this.restoreState(prevState)
                            }
                        }

                        RegExpParser.prototype.isPatternCharacter = function() {
                            switch (this.peekChar()) {
                                case "^":
                                case "$":
                                case "\\":
                                case ".":
                                case "*":
                                case "+":
                                case "?":
                                case "(":
                                case ")":
                                case "[":
                                case "|":
                                case "/":
                                case "\n":
                                case "\r":
                                case "\u2028":
                                case "\u2029":
                                    return false
                                default:
                                    return true
                            }
                        }

                        RegExpParser.prototype.parseHexDigits = function(
                            howMany
                        ) {
                            var hexString = ""
                            for (var i = 0; i < howMany; i++) {
                                var hexChar = this.popChar()
                                if (hexDigitPattern.test(hexChar) === false) {
                                    throw Error("Expecting a HexDecimal digits")
                                }
                                hexString += hexChar
                            }
                            var charCode = parseInt(hexString, 16)
                            return { type: "Character", value: charCode }
                        }

                        RegExpParser.prototype.peekChar = function(howMuch) {
                            if (howMuch === undefined) {
                                howMuch = 0
                            }
                            return this.input[this.idx + howMuch]
                        }

                        RegExpParser.prototype.popChar = function() {
                            var nextChar = this.peekChar(0)
                            this.consumeChar()
                            return nextChar
                        }

                        RegExpParser.prototype.consumeChar = function(char) {
                            if (
                                char !== undefined &&
                                this.input[this.idx] !== char
                            ) {
                                throw Error(
                                    "Expected: '" +
                                        char +
                                        "' but found: '" +
                                        this.input[this.idx] +
                                        "' at offset: " +
                                        this.idx
                                )
                            }

                            if (this.idx >= this.input.length) {
                                throw Error("Unexpected end of input")
                            }
                            this.idx++
                        }

                        // consts and utilities
                        var hexDigitPattern = /[0-9a-fA-F]/
                        var decimalPattern = /[0-9]/
                        var decimalPatternNoZero = /[1-9]/

                        function cc(char) {
                            return char.charCodeAt(0)
                        }

                        function insertToSet(item, set) {
                            if (item.length !== undefined) {
                                item.forEach(function(subItem) {
                                    set.push(subItem)
                                })
                            } else {
                                set.push(item)
                            }
                        }

                        function addFlag(flagObj, flagKey) {
                            if (flagObj[flagKey] === true) {
                                throw "duplicate flag " + flagKey
                            }

                            flagObj[flagKey] = true
                        }

                        function ASSERT_EXISTS(obj) {
                            // istanbul ignore next
                            if (obj === undefined) {
                                throw Error(
                                    "Internal Error - Should never get here!"
                                )
                            }
                        }

                        // istanbul ignore next
                        function ASSERT_NEVER_REACH_HERE() {
                            throw Error(
                                "Internal Error - Should never get here!"
                            )
                        }

                        var i
                        var digitsCharCodes = []
                        for (i = cc("0"); i <= cc("9"); i++) {
                            digitsCharCodes.push(i)
                        }

                        var wordCharCodes = [cc("_")].concat(digitsCharCodes)
                        for (i = cc("a"); i <= cc("z"); i++) {
                            wordCharCodes.push(i)
                        }

                        for (i = cc("A"); i <= cc("Z"); i++) {
                            wordCharCodes.push(i)
                        }

                        // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp#character-classes
                        var whitespaceCodes = [
                            cc(" "),
                            cc("\f"),
                            cc("\n"),
                            cc("\r"),
                            cc("\t"),
                            cc("\v"),
                            cc("\t"),
                            cc("\u00a0"),
                            cc("\u1680"),
                            cc("\u2000"),
                            cc("\u2001"),
                            cc("\u2002"),
                            cc("\u2003"),
                            cc("\u2004"),
                            cc("\u2005"),
                            cc("\u2006"),
                            cc("\u2007"),
                            cc("\u2008"),
                            cc("\u2009"),
                            cc("\u200a"),
                            cc("\u2028"),
                            cc("\u2029"),
                            cc("\u202f"),
                            cc("\u205f"),
                            cc("\u3000"),
                            cc("\ufeff")
                        ]

                        function BaseRegExpVisitor() {}

                        BaseRegExpVisitor.prototype.visitChildren = function(
                            node
                        ) {
                            for (var key in node) {
                                var child = node[key]
                                /* istanbul ignore else */
                                if (node.hasOwnProperty(key)) {
                                    if (child.type !== undefined) {
                                        this.visit(child)
                                    } else if (Array.isArray(child)) {
                                        child.forEach(function(subChild) {
                                            this.visit(subChild)
                                        }, this)
                                    }
                                }
                            }
                        }

                        BaseRegExpVisitor.prototype.visit = function(node) {
                            switch (node.type) {
                                case "Pattern":
                                    this.visitPattern(node)
                                    break
                                case "Flags":
                                    this.visitFlags(node)
                                    break
                                case "Disjunction":
                                    this.visitDisjunction(node)
                                    break
                                case "Alternative":
                                    this.visitAlternative(node)
                                    break
                                case "StartAnchor":
                                    this.visitStartAnchor(node)
                                    break
                                case "EndAnchor":
                                    this.visitEndAnchor(node)
                                    break
                                case "WordBoundary":
                                    this.visitWordBoundary(node)
                                    break
                                case "NonWordBoundary":
                                    this.visitNonWordBoundary(node)
                                    break
                                case "Lookahead":
                                    this.visitLookahead(node)
                                    break
                                case "NegativeLookahead":
                                    this.visitNegativeLookahead(node)
                                    break
                                case "Character":
                                    this.visitCharacter(node)
                                    break
                                case "Set":
                                    this.visitSet(node)
                                    break
                                case "Group":
                                    this.visitGroup(node)
                                    break
                                case "GroupBackReference":
                                    this.visitGroupBackReference(node)
                                    break
                                case "Quantifier":
                                    this.visitQuantifier(node)
                                    break
                            }

                            this.visitChildren(node)
                        }

                        BaseRegExpVisitor.prototype.visitPattern = function(
                            node
                        ) {}

                        BaseRegExpVisitor.prototype.visitFlags = function(
                            node
                        ) {}

                        BaseRegExpVisitor.prototype.visitDisjunction = function(
                            node
                        ) {}

                        BaseRegExpVisitor.prototype.visitAlternative = function(
                            node
                        ) {}

                        // Assertion
                        BaseRegExpVisitor.prototype.visitStartAnchor = function(
                            node
                        ) {}

                        BaseRegExpVisitor.prototype.visitEndAnchor = function(
                            node
                        ) {}

                        BaseRegExpVisitor.prototype.visitWordBoundary = function(
                            node
                        ) {}

                        BaseRegExpVisitor.prototype.visitNonWordBoundary = function(
                            node
                        ) {}

                        BaseRegExpVisitor.prototype.visitLookahead = function(
                            node
                        ) {}

                        BaseRegExpVisitor.prototype.visitNegativeLookahead = function(
                            node
                        ) {}

                        // atoms
                        BaseRegExpVisitor.prototype.visitCharacter = function(
                            node
                        ) {}

                        BaseRegExpVisitor.prototype.visitSet = function(node) {}

                        BaseRegExpVisitor.prototype.visitGroup = function(
                            node
                        ) {}

                        BaseRegExpVisitor.prototype.visitGroupBackReference = function(
                            node
                        ) {}

                        BaseRegExpVisitor.prototype.visitQuantifier = function(
                            node
                        ) {}

                        return {
                            RegExpParser: RegExpParser,
                            BaseRegExpVisitor: BaseRegExpVisitor,
                            VERSION: "0.4.0"
                        }
                    }
                )

                /***/
            },
            /* 20 */
            /***/ function(module, exports, __webpack_require__) {
                "use strict"

                Object.defineProperty(exports, "__esModule", { value: true })
                exports.defaultLexerErrorProvider = {
                    buildUnableToPopLexerModeMessage: function(token) {
                        return (
                            "Unable to pop Lexer Mode after encountering Token ->" +
                            token.image +
                            "<- The Mode Stack is empty"
                        )
                    },
                    buildUnexpectedCharactersMessage: function(
                        fullText,
                        startOffset,
                        length,
                        line,
                        column
                    ) {
                        return (
                            "unexpected character: ->" +
                            fullText.charAt(startOffset) +
                            "<- at offset: " +
                            startOffset +
                            "," +
                            (" skipped " + length + " characters.")
                        )
                    }
                }
                //# sourceMappingURL=lexer_errors_public.js.map

                /***/
            },
            /* 21 */
            /***/ function(module, exports, __webpack_require__) {
                "use strict"

                Object.defineProperty(exports, "__esModule", { value: true })
                var utils_1 = __webpack_require__(0)
                var gast_public_1 = __webpack_require__(1)
                var gast_1 = __webpack_require__(8)
                function first(prod) {
                    /* istanbul ignore else */
                    if (prod instanceof gast_public_1.NonTerminal) {
                        // this could in theory cause infinite loops if
                        // (1) prod A refs prod B.
                        // (2) prod B refs prod A
                        // (3) AB can match the empty set
                        // in other words a cycle where everything is optional so the first will keep
                        // looking ahead for the next optional part and will never exit
                        // currently there is no safeguard for this unique edge case because
                        // (1) not sure a grammar in which this can happen is useful for anything (productive)
                        return first(prod.referencedRule)
                    } else if (prod instanceof gast_public_1.Terminal) {
                        return firstForTerminal(prod)
                    } else if (gast_1.isSequenceProd(prod)) {
                        return firstForSequence(prod)
                    } else if (gast_1.isBranchingProd(prod)) {
                        return firstForBranching(prod)
                    } else {
                        throw Error("non exhaustive match")
                    }
                }
                exports.first = first
                function firstForSequence(prod) {
                    var firstSet = []
                    var seq = prod.definition
                    var nextSubProdIdx = 0
                    var hasInnerProdsRemaining = seq.length > nextSubProdIdx
                    var currSubProd
                    // so we enter the loop at least once (if the definition is not empty
                    var isLastInnerProdOptional = true
                    // scan a sequence until it's end or until we have found a NONE optional production in it
                    while (hasInnerProdsRemaining && isLastInnerProdOptional) {
                        currSubProd = seq[nextSubProdIdx]
                        isLastInnerProdOptional = gast_1.isOptionalProd(
                            currSubProd
                        )
                        firstSet = firstSet.concat(first(currSubProd))
                        nextSubProdIdx = nextSubProdIdx + 1
                        hasInnerProdsRemaining = seq.length > nextSubProdIdx
                    }
                    return utils_1.uniq(firstSet)
                }
                exports.firstForSequence = firstForSequence
                function firstForBranching(prod) {
                    var allAlternativesFirsts = utils_1.map(
                        prod.definition,
                        function(innerProd) {
                            return first(innerProd)
                        }
                    )
                    return utils_1.uniq(utils_1.flatten(allAlternativesFirsts))
                }
                exports.firstForBranching = firstForBranching
                function firstForTerminal(terminal) {
                    return [terminal.terminalType]
                }
                exports.firstForTerminal = firstForTerminal
                //# sourceMappingURL=first.js.map

                /***/
            },
            /* 22 */
            /***/ function(module, exports, __webpack_require__) {
                "use strict"

                Object.defineProperty(exports, "__esModule", { value: true })
                // TODO: can this be removed? where is it used?
                exports.IN = "_~IN~_"
                //# sourceMappingURL=constants.js.map

                /***/
            },
            /* 23 */
            /***/ function(module, exports, __webpack_require__) {
                "use strict"

                Object.defineProperty(exports, "__esModule", { value: true })
                var range_1 = __webpack_require__(29)
                var utils_1 = __webpack_require__(0)
                var gast_public_1 = __webpack_require__(1)
                var ProdType
                ;(function(ProdType) {
                    ProdType[(ProdType["OPTION"] = 0)] = "OPTION"
                    ProdType[(ProdType["OR"] = 1)] = "OR"
                    ProdType[(ProdType["MANY"] = 2)] = "MANY"
                    ProdType[(ProdType["MANY_SEP"] = 3)] = "MANY_SEP"
                    ProdType[(ProdType["AT_LEAST_ONE"] = 4)] = "AT_LEAST_ONE"
                    ProdType[(ProdType["AT_LEAST_ONE_SEP"] = 5)] =
                        "AT_LEAST_ONE_SEP"
                    ProdType[(ProdType["REF"] = 6)] = "REF"
                    ProdType[(ProdType["TERMINAL"] = 7)] = "TERMINAL"
                    ProdType[(ProdType["FLAT"] = 8)] = "FLAT"
                })((ProdType = exports.ProdType || (exports.ProdType = {})))
                var namePropRegExp = /(?:\s*{\s*NAME\s*:\s*["'`]([\w$]*)["'`])?/
                var namePropRegExpNoCurlyFirstOfTwo = new RegExp(
                    namePropRegExp.source
                        // remove opening curly brackets
                        .replace("{", "")
                        // add the comma between the NAME prop and the following prop
                        .replace(")?", "\\s*,)?")
                )
                var terminalRegEx = /\.\s*CONSUME(\d+)?\s*\(\s*(?:[a-zA-Z_$]\w*\s*\.\s*)*([a-zA-Z_$]\w*)/
                var terminalRegGlobal = new RegExp(terminalRegEx.source, "g")
                var refRegEx = /\.\s*SUBRULE(\d+)?\s*\(\s*(?:[a-zA-Z_$]\w*\s*\.\s*)*([a-zA-Z_$]\w*)/
                var refRegExGlobal = new RegExp(refRegEx.source, "g")
                var optionPrefixRegEx = /\.\s*OPTION(\d+)?\s*\(/
                var optionRegEx = new RegExp(
                    optionPrefixRegEx.source + namePropRegExp.source
                )
                var optionRegExGlobal = new RegExp(
                    optionPrefixRegEx.source,
                    "g"
                )
                var manyPrefixRegEx = /\.\s*MANY(\d+)?\s*\(/
                var manyRegEx = new RegExp(
                    manyPrefixRegEx.source + namePropRegExp.source
                )
                var manyRegExGlobal = new RegExp(manyPrefixRegEx.source, "g")
                var sepPropRegEx = /\s*SEP\s*:\s*(?:[a-zA-Z_$]\w*\s*\.\s*)*([a-zA-Z_$]\w*)/
                var manySepPrefixRegEx = /\.\s*MANY_SEP(\d+)?\s*\(\s*{/
                var manyWithSeparatorRegEx = new RegExp(
                    manySepPrefixRegEx.source +
                        namePropRegExpNoCurlyFirstOfTwo.source +
                        sepPropRegEx.source
                )
                var manyWithSeparatorRegExGlobal = new RegExp(
                    manyWithSeparatorRegEx.source,
                    "g"
                )
                var atLeastOneSepPrefixRegEx = /\.\s*AT_LEAST_ONE_SEP(\d+)?\s*\(\s*{/
                var atLeastOneWithSeparatorRegEx = new RegExp(
                    atLeastOneSepPrefixRegEx.source +
                        namePropRegExpNoCurlyFirstOfTwo.source +
                        sepPropRegEx.source
                )
                var atLeastOneWithSeparatorRegExGlobal = new RegExp(
                    atLeastOneWithSeparatorRegEx.source,
                    "g"
                )
                var atLeastOnePrefixRegEx = /\.\s*AT_LEAST_ONE(\d+)?\s*\(/
                var atLeastOneRegEx = new RegExp(
                    atLeastOnePrefixRegEx.source + namePropRegExp.source
                )
                var atLeastOneRegExGlobal = new RegExp(
                    atLeastOnePrefixRegEx.source,
                    "g"
                )
                var orPrefixRegEx = /\.\s*OR(\d+)?\s*\(/
                var orRegEx = new RegExp(
                    orPrefixRegEx.source + namePropRegExp.source
                )
                var orRegExGlobal = new RegExp(orPrefixRegEx.source, "g")
                var orPartSuffixRegEx = /\s*(ALT)\s*:/
                var orPartRegEx = new RegExp(
                    namePropRegExpNoCurlyFirstOfTwo.source +
                        orPartSuffixRegEx.source
                )
                var orPartRegExGlobal = new RegExp(orPartRegEx.source, "g")
                exports.terminalNameToConstructor = {}
                function buildTopProduction(impelText, name, terminals) {
                    // pseudo state. so little state does not yet mandate the complexity of wrapping in a class...
                    // TODO: this is confusing, might be time to create a class..
                    exports.terminalNameToConstructor = terminals
                    // the top most range must strictly contain all the other ranges
                    // which is why we prefix the text with " " (curr Range impel is only for positive ranges)
                    var spacedImpelText = " " + impelText
                    // TODO: why do we add whitespace twice?
                    var txtWithoutComments = removeComments(
                        " " + spacedImpelText
                    )
                    var textWithoutCommentsAndStrings = removeStringLiterals(
                        txtWithoutComments
                    )
                    var prodRanges = createRanges(textWithoutCommentsAndStrings)
                    var topRange = new range_1.Range(0, impelText.length + 2)
                    var topRule = buildTopLevel(
                        name,
                        topRange,
                        prodRanges,
                        impelText
                    )
                    return topRule
                }
                exports.buildTopProduction = buildTopProduction
                function buildTopLevel(name, topRange, allRanges, orgText) {
                    var topLevelProd = new gast_public_1.Rule({
                        name: name,
                        definition: [],
                        orgText: orgText
                    })
                    return buildAbstractProd(
                        topLevelProd,
                        topRange,
                        allRanges,
                        name
                    )
                }
                function buildProdGast(prodRange, allRanges, ruleName) {
                    switch (prodRange.type) {
                        case ProdType.AT_LEAST_ONE:
                            return buildAtLeastOneProd(
                                prodRange,
                                allRanges,
                                ruleName
                            )
                        case ProdType.AT_LEAST_ONE_SEP:
                            return buildAtLeastOneSepProd(
                                prodRange,
                                allRanges,
                                ruleName
                            )
                        case ProdType.MANY_SEP:
                            return buildManySepProd(
                                prodRange,
                                allRanges,
                                ruleName
                            )
                        case ProdType.MANY:
                            return buildManyProd(prodRange, allRanges, ruleName)
                        case ProdType.OPTION:
                            return buildOptionProd(
                                prodRange,
                                allRanges,
                                ruleName
                            )
                        case ProdType.OR:
                            return buildOrProd(prodRange, allRanges, ruleName)
                        case ProdType.FLAT:
                            return buildFlatProd(prodRange, allRanges, ruleName)
                        case ProdType.REF:
                            return buildRefProd(prodRange)
                        case ProdType.TERMINAL:
                            return buildTerminalProd(prodRange, ruleName)
                        /* istanbul ignore next */
                        default:
                            throw Error("non exhaustive match")
                    }
                }
                exports.buildProdGast = buildProdGast
                function buildRefProd(prodRange) {
                    var reResult = refRegEx.exec(prodRange.text)
                    var isImplicitOccurrenceIdx = reResult[1] === undefined
                    var refOccurrence = isImplicitOccurrenceIdx
                        ? 0
                        : parseInt(reResult[1], 10)
                    var refProdName = reResult[2]
                    var newRef = new gast_public_1.NonTerminal({
                        nonTerminalName: refProdName,
                        idx: refOccurrence
                    })
                    return newRef
                }
                function buildTerminalProd(prodRange, ruleName) {
                    var reResult = terminalRegEx.exec(prodRange.text)
                    var isImplicitOccurrenceIdx = reResult[1] === undefined
                    var terminalOccurrence = isImplicitOccurrenceIdx
                        ? 0
                        : parseInt(reResult[1], 10)
                    var terminalName = reResult[2]
                    var terminalType =
                        exports.terminalNameToConstructor[terminalName]
                    if (!terminalType) {
                        throw Error(
                            "Terminal Token name: <" +
                                terminalName +
                                "> not found in rule: <" +
                                ruleName +
                                ">  \n" +
                                "\tSee: https://sap.github.io/chevrotain/docs/guide/resolving_grammar_errors.html#TERMINAL_NAME_NOT_FOUND\n" +
                                "\tFor Further details."
                        )
                    }
                    var newTerminal = new gast_public_1.Terminal({
                        terminalType: terminalType,
                        idx: terminalOccurrence
                    })
                    return newTerminal
                }
                function buildProdWithOccurrence(
                    regEx,
                    prodInstance,
                    prodRange,
                    allRanges,
                    ruleName
                ) {
                    var reResult = regEx.exec(prodRange.text)
                    var isImplicitOccurrenceIdx = reResult[1] === undefined
                    prodInstance.idx = isImplicitOccurrenceIdx
                        ? 0
                        : parseInt(reResult[1], 10)
                    var nestedName = reResult[2]
                    if (!utils_1.isUndefined(nestedName)) {
                        prodInstance.name = nestedName
                    }
                    return buildAbstractProd(
                        prodInstance,
                        prodRange.range,
                        allRanges,
                        ruleName
                    )
                }
                function buildAtLeastOneProd(prodRange, allRanges, ruleName) {
                    return buildProdWithOccurrence(
                        atLeastOneRegEx,
                        new gast_public_1.RepetitionMandatory({
                            definition: []
                        }),
                        prodRange,
                        allRanges,
                        ruleName
                    )
                }
                function buildAtLeastOneSepProd(
                    prodRange,
                    allRanges,
                    ruleName
                ) {
                    return buildRepetitionWithSep(
                        prodRange,
                        allRanges,
                        gast_public_1.RepetitionMandatoryWithSeparator,
                        atLeastOneWithSeparatorRegEx,
                        ruleName
                    )
                }
                function buildManyProd(prodRange, allRanges, ruleName) {
                    return buildProdWithOccurrence(
                        manyRegEx,
                        new gast_public_1.Repetition({ definition: [] }),
                        prodRange,
                        allRanges,
                        ruleName
                    )
                }
                function buildManySepProd(prodRange, allRanges, ruleName) {
                    return buildRepetitionWithSep(
                        prodRange,
                        allRanges,
                        gast_public_1.RepetitionWithSeparator,
                        manyWithSeparatorRegEx,
                        ruleName
                    )
                }
                function buildRepetitionWithSep(
                    prodRange,
                    allRanges,
                    repConstructor,
                    regExp,
                    ruleName
                ) {
                    var reResult = regExp.exec(prodRange.text)
                    var isImplicitOccurrenceIdx = reResult[1] === undefined
                    var occurrenceIdx = isImplicitOccurrenceIdx
                        ? 0
                        : parseInt(reResult[1], 10)
                    var sepName = reResult[3]
                    var separatorType =
                        exports.terminalNameToConstructor[sepName]
                    if (!separatorType) {
                        throw Error(
                            "Separator Terminal Token name: " +
                                sepName +
                                " not found"
                        )
                    }
                    var repetitionInstance = new repConstructor({
                        definition: [],
                        separator: separatorType,
                        idx: occurrenceIdx
                    })
                    var nestedName = reResult[2]
                    if (!utils_1.isUndefined(nestedName)) {
                        repetitionInstance.name = nestedName
                    }
                    return buildAbstractProd(
                        repetitionInstance,
                        prodRange.range,
                        allRanges,
                        ruleName
                    )
                }
                function buildOptionProd(prodRange, allRanges, ruleName) {
                    return buildProdWithOccurrence(
                        optionRegEx,
                        new gast_public_1.Option({ definition: [] }),
                        prodRange,
                        allRanges,
                        ruleName
                    )
                }
                function buildOrProd(prodRange, allRanges, ruleName) {
                    return buildProdWithOccurrence(
                        orRegEx,
                        new gast_public_1.Alternation({ definition: [] }),
                        prodRange,
                        allRanges,
                        ruleName
                    )
                }
                function buildFlatProd(prodRange, allRanges, ruleName) {
                    var prodInstance = new gast_public_1.Flat({
                        definition: []
                    })
                    var reResult = orPartRegEx.exec(prodRange.text)
                    var nestedName = reResult[1]
                    if (!utils_1.isUndefined(nestedName)) {
                        prodInstance.name = nestedName
                    }
                    return buildAbstractProd(
                        prodInstance,
                        prodRange.range,
                        allRanges,
                        ruleName
                    )
                }
                function buildAbstractProd(
                    prod,
                    topLevelRange,
                    allRanges,
                    ruleName
                ) {
                    var secondLevelProds = getDirectlyContainedRanges(
                        topLevelRange,
                        allRanges
                    )
                    var secondLevelInOrder = utils_1.sortBy(
                        secondLevelProds,
                        function(prodRng) {
                            return prodRng.range.start
                        }
                    )
                    var definition = []
                    utils_1.forEach(secondLevelInOrder, function(prodRng) {
                        definition.push(
                            buildProdGast(prodRng, allRanges, ruleName)
                        )
                    })
                    prod.definition = definition
                    return prod
                }
                function getDirectlyContainedRanges(y, prodRanges) {
                    return utils_1.filter(prodRanges, function(x) {
                        var isXDescendantOfY = y.strictlyContainsRange(x.range)
                        var xDoesNotHaveAnyAncestorWhichIsDecendantOfY = utils_1.every(
                            prodRanges,
                            function(maybeAnotherParent) {
                                var isParentOfX = maybeAnotherParent.range.strictlyContainsRange(
                                    x.range
                                )
                                var isChildOfY = maybeAnotherParent.range.isStrictlyContainedInRange(
                                    y
                                )
                                return !(isParentOfX && isChildOfY)
                            }
                        )
                        return (
                            isXDescendantOfY &&
                            xDoesNotHaveAnyAncestorWhichIsDecendantOfY
                        )
                    })
                }
                exports.getDirectlyContainedRanges = getDirectlyContainedRanges
                var singleLineCommentRegEx = /\/\/.*/g
                var multiLineCommentRegEx = /\/\*([^*]|[\r\n]|(\*+([^*/]|[\r\n])))*\*+\//g
                var doubleQuoteStringLiteralRegEx = /(NAME\s*:\s*)?"([^\\"]|\\([bfnrtv"\\/]|u[0-9a-fA-F]{4}))*"/g
                var singleQuoteStringLiteralRegEx = /(NAME\s*:\s*)?'([^\\']|\\([bfnrtv'\\/]|u[0-9a-fA-F]{4}))*'/g
                function removeComments(text) {
                    var noSingleLine = text.replace(singleLineCommentRegEx, "")
                    var noComments = noSingleLine.replace(
                        multiLineCommentRegEx,
                        ""
                    )
                    return noComments
                }
                exports.removeComments = removeComments
                function replaceWithEmptyStringExceptNestedRules(
                    match,
                    nestedRuleGroup
                ) {
                    // do not replace with empty string if a nest rule (NAME:"bamba") was detected
                    if (nestedRuleGroup !== undefined) {
                        return match
                    }
                    return ""
                }
                function removeStringLiterals(text) {
                    var noDoubleQuotes = text.replace(
                        doubleQuoteStringLiteralRegEx,
                        replaceWithEmptyStringExceptNestedRules
                    )
                    var noSingleQuotes = noDoubleQuotes.replace(
                        singleQuoteStringLiteralRegEx,
                        replaceWithEmptyStringExceptNestedRules
                    )
                    return noSingleQuotes
                }
                exports.removeStringLiterals = removeStringLiterals
                function createRanges(text) {
                    var terminalRanges = createTerminalRanges(text)
                    var refsRanges = createRefsRanges(text)
                    var atLeastOneRanges = createAtLeastOneRanges(text)
                    var atLeastOneSepRanges = createAtLeastOneSepRanges(text)
                    var manyRanges = createManyRanges(text)
                    var manySepRanges = createManySepRanges(text)
                    var optionRanges = createOptionRanges(text)
                    var orRanges = createOrRanges(text)
                    return [].concat(
                        terminalRanges,
                        refsRanges,
                        atLeastOneRanges,
                        atLeastOneSepRanges,
                        manyRanges,
                        manySepRanges,
                        optionRanges,
                        orRanges
                    )
                }
                exports.createRanges = createRanges
                function createTerminalRanges(text) {
                    return createRefOrTerminalProdRangeInternal(
                        text,
                        ProdType.TERMINAL,
                        terminalRegGlobal
                    )
                }
                exports.createTerminalRanges = createTerminalRanges
                function createRefsRanges(text) {
                    return createRefOrTerminalProdRangeInternal(
                        text,
                        ProdType.REF,
                        refRegExGlobal
                    )
                }
                exports.createRefsRanges = createRefsRanges
                function createAtLeastOneRanges(text) {
                    return createOperatorProdRangeParenthesis(
                        text,
                        ProdType.AT_LEAST_ONE,
                        atLeastOneRegExGlobal
                    )
                }
                exports.createAtLeastOneRanges = createAtLeastOneRanges
                function createAtLeastOneSepRanges(text) {
                    return createOperatorProdRangeParenthesis(
                        text,
                        ProdType.AT_LEAST_ONE_SEP,
                        atLeastOneWithSeparatorRegExGlobal
                    )
                }
                exports.createAtLeastOneSepRanges = createAtLeastOneSepRanges
                function createManyRanges(text) {
                    return createOperatorProdRangeParenthesis(
                        text,
                        ProdType.MANY,
                        manyRegExGlobal
                    )
                }
                exports.createManyRanges = createManyRanges
                function createManySepRanges(text) {
                    return createOperatorProdRangeParenthesis(
                        text,
                        ProdType.MANY_SEP,
                        manyWithSeparatorRegExGlobal
                    )
                }
                exports.createManySepRanges = createManySepRanges
                function createOptionRanges(text) {
                    return createOperatorProdRangeParenthesis(
                        text,
                        ProdType.OPTION,
                        optionRegExGlobal
                    )
                }
                exports.createOptionRanges = createOptionRanges
                function createOrRanges(text) {
                    var orRanges = createOperatorProdRangeParenthesis(
                        text,
                        ProdType.OR,
                        orRegExGlobal
                    )
                    // have to split up the OR cases into separate FLAT productions
                    // (A |BB | CDE) ==> or.def[0] --> FLAT(A) , or.def[1] --> FLAT(BB) , or.def[2] --> FLAT(CCDE)
                    var orSubPartsRanges = createOrPartRanges(orRanges)
                    return orRanges.concat(orSubPartsRanges)
                }
                exports.createOrRanges = createOrRanges
                var findClosingCurly = utils_1.partial(
                    findClosingOffset,
                    "{",
                    "}"
                )
                var findClosingParen = utils_1.partial(
                    findClosingOffset,
                    "(",
                    ")"
                )
                function createOrPartRanges(orRanges) {
                    var orPartRanges = []
                    utils_1.forEach(orRanges, function(orRange) {
                        var currOrParts = createOperatorProdRangeInternal(
                            orRange.text,
                            ProdType.FLAT,
                            orPartRegExGlobal,
                            findClosingCurly
                        )
                        var currOrRangeStart = orRange.range.start
                        // fix offsets as we are working on a subset of the text
                        utils_1.forEach(currOrParts, function(orPart) {
                            orPart.range.start += currOrRangeStart
                            orPart.range.end += currOrRangeStart
                        })
                        orPartRanges = orPartRanges.concat(currOrParts)
                    })
                    var uniqueOrPartRanges = utils_1.uniq(
                        orPartRanges,
                        function(prodRange) {
                            // using "~" as a separator for the identify function as its not a valid char in javascript
                            return (
                                prodRange.type +
                                "~" +
                                prodRange.range.start +
                                "~" +
                                prodRange.range.end +
                                "~" +
                                prodRange.text
                            )
                        }
                    )
                    return uniqueOrPartRanges
                }
                exports.createOrPartRanges = createOrPartRanges
                function createRefOrTerminalProdRangeInternal(
                    text,
                    prodType,
                    pattern
                ) {
                    var prodRanges = []
                    var matched
                    while ((matched = pattern.exec(text))) {
                        var start = matched.index
                        var stop_1 = pattern.lastIndex
                        var currRange = new range_1.Range(start, stop_1)
                        var currText = matched[0]
                        prodRanges.push({
                            range: currRange,
                            text: currText,
                            type: prodType
                        })
                    }
                    return prodRanges
                }
                function createOperatorProdRangeParenthesis(
                    text,
                    prodType,
                    pattern
                ) {
                    return createOperatorProdRangeInternal(
                        text,
                        prodType,
                        pattern,
                        findClosingParen
                    )
                }
                function createOperatorProdRangeInternal(
                    text,
                    prodType,
                    pattern,
                    findTerminatorOffSet
                ) {
                    var operatorRanges = []
                    var matched
                    while ((matched = pattern.exec(text))) {
                        var start = matched.index
                        // note that (start + matched[0].length) is the first character AFTER the match
                        var stop_2 = findTerminatorOffSet(
                            start + matched[0].length,
                            text
                        )
                        var currRange = new range_1.Range(start, stop_2)
                        var currText = text.substr(start, stop_2 - start + 1)
                        operatorRanges.push({
                            range: currRange,
                            text: currText,
                            type: prodType
                        })
                    }
                    return operatorRanges
                }
                function findClosingOffset(opening, closing, start, text) {
                    var parenthesisStack = [1]
                    var i = -1
                    while (
                        !utils_1.isEmpty(parenthesisStack) &&
                        i + start < text.length
                    ) {
                        i++
                        var nextChar = text.charAt(start + i)
                        if (nextChar === opening) {
                            parenthesisStack.push(1)
                        } else if (nextChar === closing) {
                            parenthesisStack.pop()
                        }
                    }
                    // valid termination of the search loop
                    if (utils_1.isEmpty(parenthesisStack)) {
                        return i + start
                    } else {
                        throw new Error(
                            "INVALID INPUT TEXT, UNTERMINATED PARENTHESIS"
                        )
                    }
                }
                exports.findClosingOffset = findClosingOffset
                function deserializeGrammar(grammar, terminals) {
                    return utils_1.map(grammar, function(production) {
                        return deserializeProduction(production, terminals)
                    })
                }
                exports.deserializeGrammar = deserializeGrammar
                function deserializeProduction(node, terminals) {
                    switch (node.type) {
                        case "NonTerminal":
                            return new gast_public_1.NonTerminal({
                                nonTerminalName: node.name,
                                idx: node.idx
                            })
                        case "Flat":
                            return new gast_public_1.Flat({
                                name: node.name,
                                definition: deserializeGrammar(
                                    node.definition,
                                    terminals
                                )
                            })
                        case "Option":
                            return new gast_public_1.Option({
                                name: node.name,
                                idx: node.idx,
                                definition: deserializeGrammar(
                                    node.definition,
                                    terminals
                                )
                            })
                        case "RepetitionMandatory":
                            return new gast_public_1.RepetitionMandatory({
                                name: node.name,
                                idx: node.idx,
                                definition: deserializeGrammar(
                                    node.definition,
                                    terminals
                                )
                            })
                        case "RepetitionMandatoryWithSeparator":
                            return new gast_public_1.RepetitionMandatoryWithSeparator(
                                {
                                    name: node.name,
                                    idx: node.idx,
                                    separator: terminals[node.separator.name],
                                    definition: deserializeGrammar(
                                        node.definition,
                                        terminals
                                    )
                                }
                            )
                        case "RepetitionWithSeparator":
                            return new gast_public_1.RepetitionWithSeparator({
                                name: node.name,
                                idx: node.idx,
                                separator: terminals[node.separator.name],
                                definition: deserializeGrammar(
                                    node.definition,
                                    terminals
                                )
                            })
                        case "Repetition":
                            return new gast_public_1.Repetition({
                                name: node.name,
                                idx: node.idx,
                                definition: deserializeGrammar(
                                    node.definition,
                                    terminals
                                )
                            })
                        case "Alternation":
                            return new gast_public_1.Alternation({
                                name: node.name,
                                idx: node.idx,
                                definition: deserializeGrammar(
                                    node.definition,
                                    terminals
                                )
                            })
                        case "Terminal":
                            return new gast_public_1.Terminal({
                                terminalType: terminals[node.name],
                                idx: node.idx
                            })
                        case "Rule":
                            return new gast_public_1.Rule({
                                name: node.name,
                                orgText: node.orgText,
                                definition: deserializeGrammar(
                                    node.definition,
                                    terminals
                                )
                            })
                        /* istanbul ignore next */
                        default:
                            var _never = node
                    }
                }
                exports.deserializeProduction = deserializeProduction
                //# sourceMappingURL=gast_builder.js.map

                /***/
            },
            /* 24 */
            /***/ function(module, exports, __webpack_require__) {
                "use strict"

                Object.defineProperty(exports, "__esModule", { value: true })
                var utils_1 = __webpack_require__(0)
                var lang_extensions_1 = __webpack_require__(4)
                var resolver_1 = __webpack_require__(30)
                var checks_1 = __webpack_require__(11)
                var errors_public_1 = __webpack_require__(10)
                var gast_1 = __webpack_require__(8)
                function resolveGrammar(options) {
                    options = utils_1.defaults(options, {
                        errMsgProvider:
                            errors_public_1.defaultGrammarResolverErrorProvider
                    })
                    var topRulesTable = new lang_extensions_1.HashTable()
                    utils_1.forEach(options.rules, function(rule) {
                        topRulesTable.put(rule.name, rule)
                    })
                    return resolver_1.resolveGrammar(
                        topRulesTable,
                        options.errMsgProvider
                    )
                }
                exports.resolveGrammar = resolveGrammar
                function validateGrammar(options) {
                    options = utils_1.defaults(options, {
                        errMsgProvider:
                            errors_public_1.defaultGrammarValidatorErrorProvider,
                        ignoredIssues: {}
                    })
                    return checks_1.validateGrammar(
                        options.rules,
                        options.maxLookahead,
                        options.tokenTypes,
                        options.ignoredIssues,
                        options.errMsgProvider,
                        options.grammarName
                    )
                }
                exports.validateGrammar = validateGrammar
                function assignOccurrenceIndices(options) {
                    utils_1.forEach(options.rules, function(currRule) {
                        var methodsCollector = new gast_1.DslMethodsCollectorVisitor()
                        currRule.accept(methodsCollector)
                        utils_1.forEach(methodsCollector.dslMethods, function(
                            methods
                        ) {
                            utils_1.forEach(methods, function(
                                currMethod,
                                arrIdx
                            ) {
                                currMethod.idx = arrIdx + 1
                            })
                        })
                    })
                }
                exports.assignOccurrenceIndices = assignOccurrenceIndices
                //# sourceMappingURL=gast_resolver_public.js.map

                /***/
            },
            /* 25 */
            /***/ function(module, exports, __webpack_require__) {
                "use strict"

                Object.defineProperty(exports, "__esModule", { value: true })
                var tokens_public_1 = __webpack_require__(2)
                var utils_1 = __webpack_require__(0)
                var exceptions_public_1 = __webpack_require__(6)
                var constants_1 = __webpack_require__(22)
                var lang_extensions_1 = __webpack_require__(4)
                var parser_1 = __webpack_require__(3)
                exports.EOF_FOLLOW_KEY = {}
                exports.IN_RULE_RECOVERY_EXCEPTION = "InRuleRecoveryException"
                function InRuleRecoveryException(message) {
                    this.name = exports.IN_RULE_RECOVERY_EXCEPTION
                    this.message = message
                }
                exports.InRuleRecoveryException = InRuleRecoveryException
                InRuleRecoveryException.prototype = Error.prototype
                /**
                 * This trait is responsible for the error recovery and fault tolerant logic
                 */
                var Recoverable = /** @class */ (function() {
                    function Recoverable() {}
                    Recoverable.prototype.initRecoverable = function(config) {
                        this.firstAfterRepMap = new lang_extensions_1.HashTable()
                        this.resyncFollows = new lang_extensions_1.HashTable()
                        this.recoveryEnabled = utils_1.has(
                            config,
                            "recoveryEnabled"
                        )
                            ? config.recoveryEnabled
                            : parser_1.DEFAULT_PARSER_CONFIG.recoveryEnabled
                        // performance optimization, NOOP will be inlined which
                        // effectively means that this optional feature does not exist
                        // when not used.
                        if (this.recoveryEnabled) {
                            this.attemptInRepetitionRecovery = attemptInRepetitionRecovery
                        }
                    }
                    Recoverable.prototype.getTokenToInsert = function(tokType) {
                        var tokToInsert = tokens_public_1.createTokenInstance(
                            tokType,
                            "",
                            NaN,
                            NaN,
                            NaN,
                            NaN,
                            NaN,
                            NaN
                        )
                        tokToInsert.isInsertedInRecovery = true
                        return tokToInsert
                    }
                    Recoverable.prototype.canTokenTypeBeInsertedInRecovery = function(
                        tokType
                    ) {
                        return true
                    }
                    Recoverable.prototype.tryInRepetitionRecovery = function(
                        grammarRule,
                        grammarRuleArgs,
                        lookAheadFunc,
                        expectedTokType
                    ) {
                        var _this = this
                        // TODO: can the resyncTokenType be cached?
                        var reSyncTokType = this.findReSyncTokenType()
                        var savedLexerState = this.exportLexerState()
                        var resyncedTokens = []
                        var passedResyncPoint = false
                        var nextTokenWithoutResync = this.LA(1)
                        var currToken = this.LA(1)
                        var generateErrorMessage = function() {
                            var previousToken = _this.LA(0)
                            // we are preemptively re-syncing before an error has been detected, therefor we must reproduce
                            // the error that would have been thrown
                            var msg = _this.errorMessageProvider.buildMismatchTokenMessage(
                                {
                                    expected: expectedTokType,
                                    actual: nextTokenWithoutResync,
                                    previous: previousToken,
                                    ruleName: _this.getCurrRuleFullName()
                                }
                            )
                            var error = new exceptions_public_1.MismatchedTokenException(
                                msg,
                                nextTokenWithoutResync,
                                _this.LA(0)
                            )
                            // the first token here will be the original cause of the error, this is not part of the resyncedTokens property.
                            error.resyncedTokens = utils_1.dropRight(
                                resyncedTokens
                            )
                            _this.SAVE_ERROR(error)
                        }
                        while (!passedResyncPoint) {
                            // re-synced to a point where we can safely exit the repetition/
                            if (this.tokenMatcher(currToken, expectedTokType)) {
                                generateErrorMessage()
                                return // must return here to avoid reverting the inputIdx
                            } else if (lookAheadFunc.call(this)) {
                                // we skipped enough tokens so we can resync right back into another iteration of the repetition grammar rule
                                generateErrorMessage()
                                // recursive invocation in other to support multiple re-syncs in the same top level repetition grammar rule
                                grammarRule.apply(this, grammarRuleArgs)
                                return // must return here to avoid reverting the inputIdx
                            } else if (
                                this.tokenMatcher(currToken, reSyncTokType)
                            ) {
                                passedResyncPoint = true
                            } else {
                                currToken = this.SKIP_TOKEN()
                                this.addToResyncTokens(
                                    currToken,
                                    resyncedTokens
                                )
                            }
                        }
                        // we were unable to find a CLOSER point to resync inside the Repetition, reset the state.
                        // The parsing exception we were trying to prevent will happen in the NEXT parsing step. it may be handled by
                        // "between rules" resync recovery later in the flow.
                        this.importLexerState(savedLexerState)
                    }
                    Recoverable.prototype.shouldInRepetitionRecoveryBeTried = function(
                        expectTokAfterLastMatch,
                        nextTokIdx,
                        notStuck
                    ) {
                        // Edge case of arriving from a MANY repetition which is stuck
                        // Attempting recovery in this case could cause an infinite loop
                        if (notStuck === false) {
                            return false
                        }
                        // arguments to try and perform resync into the next iteration of the many are missing
                        if (
                            expectTokAfterLastMatch === undefined ||
                            nextTokIdx === undefined
                        ) {
                            return false
                        }
                        // no need to recover, next token is what we expect...
                        if (
                            this.tokenMatcher(
                                this.LA(1),
                                expectTokAfterLastMatch
                            )
                        ) {
                            return false
                        }
                        // error recovery is disabled during backtracking as it can make the parser ignore a valid grammar path
                        // and prefer some backtracking path that includes recovered errors.
                        if (this.isBackTracking()) {
                            return false
                        }
                        // if we can perform inRule recovery (single token insertion or deletion) we always prefer that recovery algorithm
                        // because if it works, it makes the least amount of changes to the input stream (greedy algorithm)
                        //noinspection RedundantIfStatementJS
                        if (
                            this.canPerformInRuleRecovery(
                                expectTokAfterLastMatch,
                                this.getFollowsForInRuleRecovery(
                                    expectTokAfterLastMatch,
                                    nextTokIdx
                                )
                            )
                        ) {
                            return false
                        }
                        return true
                    }
                    // Error Recovery functionality
                    Recoverable.prototype.getFollowsForInRuleRecovery = function(
                        tokType,
                        tokIdxInRule
                    ) {
                        var grammarPath = this.getCurrentGrammarPath(
                            tokType,
                            tokIdxInRule
                        )
                        var follows = this.getNextPossibleTokenTypes(
                            grammarPath
                        )
                        return follows
                    }
                    Recoverable.prototype.tryInRuleRecovery = function(
                        expectedTokType,
                        follows
                    ) {
                        if (
                            this.canRecoverWithSingleTokenInsertion(
                                expectedTokType,
                                follows
                            )
                        ) {
                            var tokToInsert = this.getTokenToInsert(
                                expectedTokType
                            )
                            return tokToInsert
                        }
                        if (
                            this.canRecoverWithSingleTokenDeletion(
                                expectedTokType
                            )
                        ) {
                            var nextTok = this.SKIP_TOKEN()
                            this.consumeToken()
                            return nextTok
                        }
                        throw new InRuleRecoveryException("sad sad panda")
                    }
                    Recoverable.prototype.canPerformInRuleRecovery = function(
                        expectedToken,
                        follows
                    ) {
                        return (
                            this.canRecoverWithSingleTokenInsertion(
                                expectedToken,
                                follows
                            ) ||
                            this.canRecoverWithSingleTokenDeletion(
                                expectedToken
                            )
                        )
                    }
                    Recoverable.prototype.canRecoverWithSingleTokenInsertion = function(
                        expectedTokType,
                        follows
                    ) {
                        var _this = this
                        if (
                            !this.canTokenTypeBeInsertedInRecovery(
                                expectedTokType
                            )
                        ) {
                            return false
                        }
                        // must know the possible following tokens to perform single token insertion
                        if (utils_1.isEmpty(follows)) {
                            return false
                        }
                        var mismatchedTok = this.LA(1)
                        var isMisMatchedTokInFollows =
                            utils_1.find(follows, function(
                                possibleFollowsTokType
                            ) {
                                return _this.tokenMatcher(
                                    mismatchedTok,
                                    possibleFollowsTokType
                                )
                            }) !== undefined
                        return isMisMatchedTokInFollows
                    }
                    Recoverable.prototype.canRecoverWithSingleTokenDeletion = function(
                        expectedTokType
                    ) {
                        var isNextTokenWhatIsExpected = this.tokenMatcher(
                            this.LA(2),
                            expectedTokType
                        )
                        return isNextTokenWhatIsExpected
                    }
                    Recoverable.prototype.isInCurrentRuleReSyncSet = function(
                        tokenTypeIdx
                    ) {
                        var followKey = this.getCurrFollowKey()
                        var currentRuleReSyncSet = this.getFollowSetFromFollowKey(
                            followKey
                        )
                        return utils_1.contains(
                            currentRuleReSyncSet,
                            tokenTypeIdx
                        )
                    }
                    Recoverable.prototype.findReSyncTokenType = function() {
                        var allPossibleReSyncTokTypes = this.flattenFollowSet()
                        // this loop will always terminate as EOF is always in the follow stack and also always (virtually) in the input
                        var nextToken = this.LA(1)
                        var k = 2
                        while (true) {
                            var nextTokenType = nextToken.tokenType
                            if (
                                utils_1.contains(
                                    allPossibleReSyncTokTypes,
                                    nextTokenType
                                )
                            ) {
                                return nextTokenType
                            }
                            nextToken = this.LA(k)
                            k++
                        }
                    }
                    Recoverable.prototype.getCurrFollowKey = function() {
                        // the length is at least one as we always add the ruleName to the stack before invoking the rule.
                        if (this.RULE_STACK.length === 1) {
                            return exports.EOF_FOLLOW_KEY
                        }
                        var currRuleShortName = this.getLastExplicitRuleShortName()
                        var currRuleIdx = this.getLastExplicitRuleOccurrenceIndex()
                        var prevRuleShortName = this.getPreviousExplicitRuleShortName()
                        return {
                            ruleName: this.shortRuleNameToFullName(
                                currRuleShortName
                            ),
                            idxInCallingRule: currRuleIdx,
                            inRule: this.shortRuleNameToFullName(
                                prevRuleShortName
                            )
                        }
                    }
                    Recoverable.prototype.buildFullFollowKeyStack = function() {
                        var _this = this
                        var explicitRuleStack = this.RULE_STACK
                        var explicitOccurrenceStack = this.RULE_OCCURRENCE_STACK
                        if (!utils_1.isEmpty(this.LAST_EXPLICIT_RULE_STACK)) {
                            explicitRuleStack = utils_1.map(
                                this.LAST_EXPLICIT_RULE_STACK,
                                function(idx) {
                                    return _this.RULE_STACK[idx]
                                }
                            )
                            explicitOccurrenceStack = utils_1.map(
                                this.LAST_EXPLICIT_RULE_STACK,
                                function(idx) {
                                    return _this.RULE_OCCURRENCE_STACK[idx]
                                }
                            )
                        }
                        // TODO: only iterate over explicit rules here
                        return utils_1.map(explicitRuleStack, function(
                            ruleName,
                            idx
                        ) {
                            if (idx === 0) {
                                return exports.EOF_FOLLOW_KEY
                            }
                            return {
                                ruleName: _this.shortRuleNameToFullName(
                                    ruleName
                                ),
                                idxInCallingRule: explicitOccurrenceStack[idx],
                                inRule: _this.shortRuleNameToFullName(
                                    explicitRuleStack[idx - 1]
                                )
                            }
                        })
                    }
                    Recoverable.prototype.flattenFollowSet = function() {
                        var _this = this
                        var followStack = utils_1.map(
                            this.buildFullFollowKeyStack(),
                            function(currKey) {
                                return _this.getFollowSetFromFollowKey(currKey)
                            }
                        )
                        return utils_1.flatten(followStack)
                    }
                    Recoverable.prototype.getFollowSetFromFollowKey = function(
                        followKey
                    ) {
                        if (followKey === exports.EOF_FOLLOW_KEY) {
                            return [tokens_public_1.EOF]
                        }
                        var followName =
                            followKey.ruleName +
                            followKey.idxInCallingRule +
                            constants_1.IN +
                            followKey.inRule
                        return this.resyncFollows.get(followName)
                    }
                    // It does not make any sense to include a virtual EOF token in the list of resynced tokens
                    // as EOF does not really exist and thus does not contain any useful information (line/column numbers)
                    Recoverable.prototype.addToResyncTokens = function(
                        token,
                        resyncTokens
                    ) {
                        if (!this.tokenMatcher(token, tokens_public_1.EOF)) {
                            resyncTokens.push(token)
                        }
                        return resyncTokens
                    }
                    Recoverable.prototype.reSyncTo = function(tokType) {
                        var resyncedTokens = []
                        var nextTok = this.LA(1)
                        while (this.tokenMatcher(nextTok, tokType) === false) {
                            nextTok = this.SKIP_TOKEN()
                            this.addToResyncTokens(nextTok, resyncedTokens)
                        }
                        // the last token is not part of the error.
                        return utils_1.dropRight(resyncedTokens)
                    }
                    Recoverable.prototype.attemptInRepetitionRecovery = function(
                        prodFunc,
                        args,
                        lookaheadFunc,
                        dslMethodIdx,
                        prodOccurrence,
                        nextToksWalker,
                        notStuck
                    ) {
                        // by default this is a NO-OP
                        // The actual implementation is with the function(not method) below
                    }
                    Recoverable.prototype.getCurrentGrammarPath = function(
                        tokType,
                        tokIdxInRule
                    ) {
                        var pathRuleStack = this.getHumanReadableRuleStack()
                        var pathOccurrenceStack = utils_1.cloneArr(
                            this.RULE_OCCURRENCE_STACK
                        )
                        var grammarPath = {
                            ruleStack: pathRuleStack,
                            occurrenceStack: pathOccurrenceStack,
                            lastTok: tokType,
                            lastTokOccurrence: tokIdxInRule
                        }
                        return grammarPath
                    }
                    Recoverable.prototype.getHumanReadableRuleStack = function() {
                        var _this = this
                        if (!utils_1.isEmpty(this.LAST_EXPLICIT_RULE_STACK)) {
                            return utils_1.map(
                                this.LAST_EXPLICIT_RULE_STACK,
                                function(currIdx) {
                                    return _this.shortRuleNameToFullName(
                                        _this.RULE_STACK[currIdx]
                                    )
                                }
                            )
                        } else {
                            return utils_1.map(this.RULE_STACK, function(
                                currShortName
                            ) {
                                return _this.shortRuleNameToFullName(
                                    currShortName
                                )
                            })
                        }
                    }
                    return Recoverable
                })()
                exports.Recoverable = Recoverable
                function attemptInRepetitionRecovery(
                    prodFunc,
                    args,
                    lookaheadFunc,
                    dslMethodIdx,
                    prodOccurrence,
                    nextToksWalker,
                    notStuck
                ) {
                    var key = this.getKeyForAutomaticLookahead(
                        dslMethodIdx,
                        prodOccurrence
                    )
                    var firstAfterRepInfo = this.firstAfterRepMap.get(key)
                    if (firstAfterRepInfo === undefined) {
                        var currRuleName = this.getCurrRuleFullName()
                        var ruleGrammar = this.getGAstProductions().get(
                            currRuleName
                        )
                        var walker = new nextToksWalker(
                            ruleGrammar,
                            prodOccurrence
                        )
                        firstAfterRepInfo = walker.startWalking()
                        this.firstAfterRepMap.put(key, firstAfterRepInfo)
                    }
                    var expectTokAfterLastMatch = firstAfterRepInfo.token
                    var nextTokIdx = firstAfterRepInfo.occurrence
                    var isEndOfRule = firstAfterRepInfo.isEndOfRule
                    // special edge case of a TOP most repetition after which the input should END.
                    // this will force an attempt for inRule recovery in that scenario.
                    if (
                        this.RULE_STACK.length === 1 &&
                        isEndOfRule &&
                        expectTokAfterLastMatch === undefined
                    ) {
                        expectTokAfterLastMatch = tokens_public_1.EOF
                        nextTokIdx = 1
                    }
                    if (
                        this.shouldInRepetitionRecoveryBeTried(
                            expectTokAfterLastMatch,
                            nextTokIdx,
                            notStuck
                        )
                    ) {
                        // TODO: performance optimization: instead of passing the original args here, we modify
                        // the args param (or create a new one) and make sure the lookahead func is explicitly provided
                        // to avoid searching the cache for it once more.
                        this.tryInRepetitionRecovery(
                            prodFunc,
                            args,
                            lookaheadFunc,
                            expectTokAfterLastMatch
                        )
                    }
                }
                exports.attemptInRepetitionRecovery = attemptInRepetitionRecovery
                //# sourceMappingURL=recoverable.js.map

                /***/
            },
            /* 26 */
            /***/ function(module, exports, __webpack_require__) {
                "use strict"

                var __extends =
                    (this && this.__extends) ||
                    (function() {
                        var extendStatics = function(d, b) {
                            extendStatics =
                                Object.setPrototypeOf ||
                                ({ __proto__: [] } instanceof Array &&
                                    function(d, b) {
                                        d.__proto__ = b
                                    }) ||
                                function(d, b) {
                                    for (var p in b)
                                        if (b.hasOwnProperty(p)) d[p] = b[p]
                                }
                            return extendStatics(d, b)
                        }
                        return function(d, b) {
                            extendStatics(d, b)
                            function __() {
                                this.constructor = d
                            }
                            d.prototype =
                                b === null
                                    ? Object.create(b)
                                    : ((__.prototype = b.prototype), new __())
                        }
                    })()
                Object.defineProperty(exports, "__esModule", { value: true })
                var rest_1 = __webpack_require__(14)
                var lang_extensions_1 = __webpack_require__(4)
                var first_1 = __webpack_require__(21)
                var utils_1 = __webpack_require__(0)
                var constants_1 = __webpack_require__(22)
                var tokens_public_1 = __webpack_require__(2)
                var gast_public_1 = __webpack_require__(1)
                // This ResyncFollowsWalker computes all of the follows required for RESYNC
                // (skipping reference production).
                var ResyncFollowsWalker = /** @class */ (function(_super) {
                    __extends(ResyncFollowsWalker, _super)
                    function ResyncFollowsWalker(topProd) {
                        var _this = _super.call(this) || this
                        _this.topProd = topProd
                        _this.follows = new lang_extensions_1.HashTable()
                        return _this
                    }
                    ResyncFollowsWalker.prototype.startWalking = function() {
                        this.walk(this.topProd)
                        return this.follows
                    }
                    ResyncFollowsWalker.prototype.walkTerminal = function(
                        terminal,
                        currRest,
                        prevRest
                    ) {
                        // do nothing! just like in the public sector after 13:00
                    }
                    ResyncFollowsWalker.prototype.walkProdRef = function(
                        refProd,
                        currRest,
                        prevRest
                    ) {
                        var followName =
                            buildBetweenProdsFollowPrefix(
                                refProd.referencedRule,
                                refProd.idx
                            ) + this.topProd.name
                        var fullRest = currRest.concat(prevRest)
                        var restProd = new gast_public_1.Flat({
                            definition: fullRest
                        })
                        var t_in_topProd_follows = first_1.first(restProd)
                        this.follows.put(followName, t_in_topProd_follows)
                    }
                    return ResyncFollowsWalker
                })(rest_1.RestWalker)
                exports.ResyncFollowsWalker = ResyncFollowsWalker
                function computeAllProdsFollows(topProductions) {
                    var reSyncFollows = new lang_extensions_1.HashTable()
                    utils_1.forEach(topProductions, function(topProd) {
                        var currRefsFollow = new ResyncFollowsWalker(
                            topProd
                        ).startWalking()
                        reSyncFollows.putAll(currRefsFollow)
                    })
                    return reSyncFollows
                }
                exports.computeAllProdsFollows = computeAllProdsFollows
                function buildBetweenProdsFollowPrefix(
                    inner,
                    occurenceInParent
                ) {
                    return inner.name + occurenceInParent + constants_1.IN
                }
                exports.buildBetweenProdsFollowPrefix = buildBetweenProdsFollowPrefix
                function buildInProdFollowPrefix(terminal) {
                    var terminalName = tokens_public_1.tokenName(
                        terminal.terminalType
                    )
                    return terminalName + terminal.idx + constants_1.IN
                }
                exports.buildInProdFollowPrefix = buildInProdFollowPrefix
                //# sourceMappingURL=follow.js.map

                /***/
            },
            /* 27 */
            /***/ function(module, exports, __webpack_require__) {
                "use strict"

                var __extends =
                    (this && this.__extends) ||
                    (function() {
                        var extendStatics = function(d, b) {
                            extendStatics =
                                Object.setPrototypeOf ||
                                ({ __proto__: [] } instanceof Array &&
                                    function(d, b) {
                                        d.__proto__ = b
                                    }) ||
                                function(d, b) {
                                    for (var p in b)
                                        if (b.hasOwnProperty(p)) d[p] = b[p]
                                }
                            return extendStatics(d, b)
                        }
                        return function(d, b) {
                            extendStatics(d, b)
                            function __() {
                                this.constructor = d
                            }
                            d.prototype =
                                b === null
                                    ? Object.create(b)
                                    : ((__.prototype = b.prototype), new __())
                        }
                    })()
                Object.defineProperty(exports, "__esModule", { value: true })
                var regexp_to_ast_1 = __webpack_require__(19)
                var tokens_public_1 = __webpack_require__(2)
                var lexer_public_1 = __webpack_require__(15)
                var utils_1 = __webpack_require__(0)
                var reg_exp_1 = __webpack_require__(28)
                var regExpParser = new regexp_to_ast_1.RegExpParser()
                var PATTERN = "PATTERN"
                exports.DEFAULT_MODE = "defaultMode"
                exports.MODES = "modes"
                exports.SUPPORT_STICKY =
                    typeof new RegExp("(?:)").sticky === "boolean"
                function disableSticky() {
                    exports.SUPPORT_STICKY = false
                }
                exports.disableSticky = disableSticky
                function enableSticky() {
                    exports.SUPPORT_STICKY = true
                }
                exports.enableSticky = enableSticky
                function analyzeTokenTypes(tokenTypes, options) {
                    options = utils_1.defaults(options, {
                        useSticky: exports.SUPPORT_STICKY,
                        debug: false,
                        safeMode: false,
                        positionTracking: "full",
                        lineTerminatorCharacters: ["\r", "\n"]
                    })
                    var onlyRelevantTypes = utils_1.reject(tokenTypes, function(
                        currType
                    ) {
                        return currType[PATTERN] === lexer_public_1.Lexer.NA
                    })
                    var hasCustom = false
                    var allTransformedPatterns = utils_1.map(
                        onlyRelevantTypes,
                        function(currType) {
                            var currPattern = currType[PATTERN]
                            /* istanbul ignore else */
                            if (utils_1.isRegExp(currPattern)) {
                                var regExpSource = currPattern.source
                                if (
                                    regExpSource.length === 1 &&
                                    // only these regExp meta characters which can appear in a length one regExp
                                    regExpSource !== "^" &&
                                    regExpSource !== "$" &&
                                    regExpSource !== "."
                                ) {
                                    return regExpSource
                                } else if (
                                    regExpSource.length === 2 &&
                                    regExpSource[0] === "\\" &&
                                    // not a meta character
                                    !utils_1.contains(
                                        [
                                            "d",
                                            "D",
                                            "s",
                                            "S",
                                            "t",
                                            "r",
                                            "n",
                                            "t",
                                            "0",
                                            "c",
                                            "b",
                                            "B",
                                            "f",
                                            "v",
                                            "w",
                                            "W"
                                        ],
                                        regExpSource[1]
                                    )
                                ) {
                                    // escaped meta Characters: /\+/ /\[/
                                    // or redundant escaping: /\a/
                                    // without the escaping "\"
                                    return regExpSource[1]
                                } else {
                                    return options.useSticky
                                        ? addStickyFlag(currPattern)
                                        : addStartOfInput(currPattern)
                                }
                            } else if (utils_1.isFunction(currPattern)) {
                                hasCustom = true
                                // CustomPatternMatcherFunc - custom patterns do not require any transformations, only wrapping in a RegExp Like object
                                return { exec: currPattern }
                            } else if (utils_1.has(currPattern, "exec")) {
                                hasCustom = true
                                // ICustomPattern
                                return currPattern
                            } else if (typeof currPattern === "string") {
                                // IGNORE ABOVE ELSE
                                if (currPattern.length === 1) {
                                    return currPattern
                                } else {
                                    var escapedRegExpString = currPattern.replace(
                                        /[\\^$.*+?()[\]{}|]/g,
                                        "\\$&"
                                    )
                                    var wrappedRegExp = new RegExp(
                                        escapedRegExpString
                                    )
                                    return options.useSticky
                                        ? addStickyFlag(wrappedRegExp)
                                        : addStartOfInput(wrappedRegExp)
                                }
                            } else {
                                throw Error("non exhaustive match")
                            }
                        }
                    )
                    var patternIdxToType = utils_1.map(
                        onlyRelevantTypes,
                        function(currType) {
                            return currType.tokenTypeIdx
                        }
                    )
                    var patternIdxToGroup = utils_1.map(
                        onlyRelevantTypes,
                        function(clazz) {
                            var groupName = clazz.GROUP
                            /* istanbul ignore next */
                            if (groupName === lexer_public_1.Lexer.SKIPPED) {
                                return undefined
                            } else if (utils_1.isString(groupName)) {
                                return groupName
                            } else if (utils_1.isUndefined(groupName)) {
                                return false
                            } else {
                                throw Error("non exhaustive match")
                            }
                        }
                    )
                    var patternIdxToLongerAltIdx = utils_1.map(
                        onlyRelevantTypes,
                        function(clazz) {
                            var longerAltType = clazz.LONGER_ALT
                            if (longerAltType) {
                                var longerAltIdx = utils_1.indexOf(
                                    onlyRelevantTypes,
                                    longerAltType
                                )
                                return longerAltIdx
                            }
                        }
                    )
                    var patternIdxToPushMode = utils_1.map(
                        onlyRelevantTypes,
                        function(clazz) {
                            return clazz.PUSH_MODE
                        }
                    )
                    var patternIdxToPopMode = utils_1.map(
                        onlyRelevantTypes,
                        function(clazz) {
                            return utils_1.has(clazz, "POP_MODE")
                        }
                    )
                    var lineTerminatorCharCodes = getCharCodes(
                        options.lineTerminatorCharacters
                    )
                    var patternIdxToCanLineTerminator = utils_1.map(
                        onlyRelevantTypes,
                        function(tokType) {
                            return false
                        }
                    )
                    if (options.positionTracking !== "onlyOffset") {
                        patternIdxToCanLineTerminator = utils_1.map(
                            onlyRelevantTypes,
                            function(tokType) {
                                if (utils_1.has(tokType, "LINE_BREAKS")) {
                                    return tokType.LINE_BREAKS
                                } else {
                                    if (
                                        checkLineBreaksIssues(
                                            tokType,
                                            lineTerminatorCharCodes
                                        ) === false
                                    ) {
                                        return reg_exp_1.canMatchCharCode(
                                            lineTerminatorCharCodes,
                                            tokType.PATTERN
                                        )
                                    }
                                }
                            }
                        )
                    }
                    var patternIdxToIsCustom = utils_1.map(
                        onlyRelevantTypes,
                        isCustomPattern
                    )
                    var patternIdxToShort = utils_1.map(
                        allTransformedPatterns,
                        isShortPattern
                    )
                    var emptyGroups = utils_1.reduce(
                        onlyRelevantTypes,
                        function(acc, clazz) {
                            var groupName = clazz.GROUP
                            if (
                                utils_1.isString(groupName) &&
                                !(groupName === lexer_public_1.Lexer.SKIPPED)
                            ) {
                                acc[groupName] = []
                            }
                            return acc
                        },
                        {}
                    )
                    var patternIdxToConfig = utils_1.map(
                        allTransformedPatterns,
                        function(x, idx) {
                            return {
                                pattern: allTransformedPatterns[idx],
                                longerAlt: patternIdxToLongerAltIdx[idx],
                                canLineTerminator:
                                    patternIdxToCanLineTerminator[idx],
                                isCustom: patternIdxToIsCustom[idx],
                                short: patternIdxToShort[idx],
                                group: patternIdxToGroup[idx],
                                push: patternIdxToPushMode[idx],
                                pop: patternIdxToPopMode[idx],
                                tokenTypeIdx: patternIdxToType[idx],
                                tokenType: onlyRelevantTypes[idx]
                            }
                        }
                    )
                    function addToMapOfArrays(map, key, value) {
                        if (map[key] === undefined) {
                            map[key] = []
                        }
                        map[key].push(value)
                    }
                    var canBeOptimized = true
                    var charCodeToPatternIdxToConfig = []
                    if (!options.safeMode) {
                        charCodeToPatternIdxToConfig = utils_1.reduce(
                            onlyRelevantTypes,
                            function(result, currTokType, idx) {
                                if (typeof currTokType.PATTERN === "string") {
                                    var key = currTokType.PATTERN.charCodeAt(0)
                                    addToMapOfArrays(
                                        result,
                                        key,
                                        patternIdxToConfig[idx]
                                    )
                                } else if (
                                    utils_1.isArray(
                                        currTokType.START_CHARS_HINT
                                    )
                                ) {
                                    utils_1.forEach(
                                        currTokType.START_CHARS_HINT,
                                        function(charOrInt) {
                                            var key =
                                                typeof charOrInt === "string"
                                                    ? charOrInt.charCodeAt(0)
                                                    : charOrInt
                                            addToMapOfArrays(
                                                result,
                                                key,
                                                patternIdxToConfig[idx]
                                            )
                                        }
                                    )
                                } else if (
                                    utils_1.isRegExp(currTokType.PATTERN)
                                ) {
                                    if (currTokType.PATTERN.unicode) {
                                        canBeOptimized = false
                                        if (options.ensureOptimizations) {
                                            utils_1.PRINT_ERROR(
                                                "" +
                                                    reg_exp_1.failedOptimizationPrefixMsg +
                                                    ("\tUnable to analyze < " +
                                                        currTokType.PATTERN.toString() +
                                                        " > pattern.\n") +
                                                    "\tThe regexp unicode flag is not currently supported by the regexp-to-ast library.\n" +
                                                    "\tThis will disable the lexer's first char optimizations.\n" +
                                                    "\tFor details See: https://sap.github.io/chevrotain/docs/guide/resolving_lexer_errors.html#UNICODE_OPTIMIZE"
                                            )
                                        }
                                    } else {
                                        var startCodes = reg_exp_1.getStartCodes(
                                            currTokType.PATTERN,
                                            options.ensureOptimizations
                                        )
                                        /* istanbul ignore if */
                                        // start code will only be empty given an empty regExp or failure of regexp-to-ast library
                                        // the first should be a different validation and the second cannot be tested.
                                        if (utils_1.isEmpty(startCodes)) {
                                            // we cannot understand what codes may start possible matches
                                            // The optimization correctness requires knowing start codes for ALL patterns.
                                            // Not actually sure this is an error, no debug message
                                            canBeOptimized = false
                                        }
                                        utils_1.forEach(startCodes, function(
                                            code
                                        ) {
                                            addToMapOfArrays(
                                                result,
                                                code,
                                                patternIdxToConfig[idx]
                                            )
                                        })
                                    }
                                } else {
                                    if (options.ensureOptimizations) {
                                        utils_1.PRINT_ERROR(
                                            "" +
                                                reg_exp_1.failedOptimizationPrefixMsg +
                                                ("\tTokenType: <" +
                                                    tokens_public_1.tokenName(
                                                        currTokType
                                                    ) +
                                                    "> is using a custom token pattern without providing <start_chars_hint> parameter.\n") +
                                                "\tThis will disable the lexer's first char optimizations.\n" +
                                                "\tFor details See: https://sap.github.io/chevrotain/docs/guide/resolving_lexer_errors.html#CUSTOM_OPTIMIZE"
                                        )
                                    }
                                    canBeOptimized = false
                                }
                                return result
                            },
                            []
                        )
                    }
                    if (
                        canBeOptimized &&
                        charCodeToPatternIdxToConfig.length < 65536
                    ) {
                        charCodeToPatternIdxToConfig = utils_1.packArray(
                            charCodeToPatternIdxToConfig
                        )
                    }
                    return {
                        emptyGroups: emptyGroups,
                        patternIdxToConfig: patternIdxToConfig,
                        charCodeToPatternIdxToConfig: charCodeToPatternIdxToConfig,
                        hasCustom: hasCustom,
                        canBeOptimized: canBeOptimized
                    }
                }
                exports.analyzeTokenTypes = analyzeTokenTypes
                function validatePatterns(tokenTypes, validModesNames) {
                    var errors = []
                    var missingResult = findMissingPatterns(tokenTypes)
                    errors = errors.concat(missingResult.errors)
                    var invalidResult = findInvalidPatterns(missingResult.valid)
                    var validTokenTypes = invalidResult.valid
                    errors = errors.concat(invalidResult.errors)
                    errors = errors.concat(
                        validateRegExpPattern(validTokenTypes)
                    )
                    errors = errors.concat(
                        findInvalidGroupType(validTokenTypes)
                    )
                    errors = errors.concat(
                        findModesThatDoNotExist(
                            validTokenTypes,
                            validModesNames
                        )
                    )
                    errors = errors.concat(
                        findUnreachablePatterns(validTokenTypes)
                    )
                    return errors
                }
                exports.validatePatterns = validatePatterns
                function validateRegExpPattern(tokenTypes) {
                    var errors = []
                    var withRegExpPatterns = utils_1.filter(
                        tokenTypes,
                        function(currTokType) {
                            return utils_1.isRegExp(currTokType[PATTERN])
                        }
                    )
                    errors = errors.concat(
                        findEndOfInputAnchor(withRegExpPatterns)
                    )
                    errors = errors.concat(
                        findStartOfInputAnchor(withRegExpPatterns)
                    )
                    errors = errors.concat(
                        findUnsupportedFlags(withRegExpPatterns)
                    )
                    errors = errors.concat(
                        findDuplicatePatterns(withRegExpPatterns)
                    )
                    errors = errors.concat(
                        findEmptyMatchRegExps(withRegExpPatterns)
                    )
                    return errors
                }
                function findMissingPatterns(tokenTypes) {
                    var tokenTypesWithMissingPattern = utils_1.filter(
                        tokenTypes,
                        function(currType) {
                            return !utils_1.has(currType, PATTERN)
                        }
                    )
                    var errors = utils_1.map(
                        tokenTypesWithMissingPattern,
                        function(currType) {
                            return {
                                message:
                                    "Token Type: ->" +
                                    tokens_public_1.tokenName(currType) +
                                    "<- missing static 'PATTERN' property",
                                type:
                                    lexer_public_1.LexerDefinitionErrorType
                                        .MISSING_PATTERN,
                                tokenTypes: [currType]
                            }
                        }
                    )
                    var valid = utils_1.difference(
                        tokenTypes,
                        tokenTypesWithMissingPattern
                    )
                    return { errors: errors, valid: valid }
                }
                exports.findMissingPatterns = findMissingPatterns
                function findInvalidPatterns(tokenTypes) {
                    var tokenTypesWithInvalidPattern = utils_1.filter(
                        tokenTypes,
                        function(currType) {
                            var pattern = currType[PATTERN]
                            return (
                                !utils_1.isRegExp(pattern) &&
                                !utils_1.isFunction(pattern) &&
                                !utils_1.has(pattern, "exec") &&
                                !utils_1.isString(pattern)
                            )
                        }
                    )
                    var errors = utils_1.map(
                        tokenTypesWithInvalidPattern,
                        function(currType) {
                            return {
                                message:
                                    "Token Type: ->" +
                                    tokens_public_1.tokenName(currType) +
                                    "<- static 'PATTERN' can only be a RegExp, a" +
                                    " Function matching the {CustomPatternMatcherFunc} type or an Object matching the {ICustomPattern} interface.",
                                type:
                                    lexer_public_1.LexerDefinitionErrorType
                                        .INVALID_PATTERN,
                                tokenTypes: [currType]
                            }
                        }
                    )
                    var valid = utils_1.difference(
                        tokenTypes,
                        tokenTypesWithInvalidPattern
                    )
                    return { errors: errors, valid: valid }
                }
                exports.findInvalidPatterns = findInvalidPatterns
                var end_of_input = /[^\\][\$]/
                function findEndOfInputAnchor(tokenTypes) {
                    var EndAnchorFinder = /** @class */ (function(_super) {
                        __extends(EndAnchorFinder, _super)
                        function EndAnchorFinder() {
                            var _this =
                                (_super !== null &&
                                    _super.apply(this, arguments)) ||
                                this
                            _this.found = false
                            return _this
                        }
                        EndAnchorFinder.prototype.visitEndAnchor = function(
                            node
                        ) {
                            this.found = true
                        }
                        return EndAnchorFinder
                    })(regexp_to_ast_1.BaseRegExpVisitor)
                    var invalidRegex = utils_1.filter(tokenTypes, function(
                        currType
                    ) {
                        var pattern = currType[PATTERN]
                        try {
                            var regexpAst = regExpParser.pattern(
                                pattern.toString()
                            )
                            var endAnchorVisitor = new EndAnchorFinder()
                            endAnchorVisitor.visit(regexpAst)
                            return endAnchorVisitor.found
                        } catch (e) {
                            // old behavior in case of runtime exceptions with regexp-to-ast.
                            /* istanbul ignore next - cannot ensure an error in regexp-to-ast*/
                            return end_of_input.test(pattern.source)
                        }
                    })
                    var errors = utils_1.map(invalidRegex, function(currType) {
                        return {
                            message:
                                "Unexpected RegExp Anchor Error:\n" +
                                "\tToken Type: ->" +
                                tokens_public_1.tokenName(currType) +
                                "<- static 'PATTERN' cannot contain end of input anchor '$'\n" +
                                "\tSee sap.github.io/chevrotain/docs/guide/resolving_lexer_errors.html#ANCHORS" +
                                "\tfor details.",
                            type:
                                lexer_public_1.LexerDefinitionErrorType
                                    .EOI_ANCHOR_FOUND,
                            tokenTypes: [currType]
                        }
                    })
                    return errors
                }
                exports.findEndOfInputAnchor = findEndOfInputAnchor
                function findEmptyMatchRegExps(tokenTypes) {
                    var matchesEmptyString = utils_1.filter(
                        tokenTypes,
                        function(currType) {
                            var pattern = currType[PATTERN]
                            return pattern.test("")
                        }
                    )
                    var errors = utils_1.map(matchesEmptyString, function(
                        currType
                    ) {
                        return {
                            message:
                                "Token Type: ->" +
                                tokens_public_1.tokenName(currType) +
                                "<- static 'PATTERN' must not match an empty string",
                            type:
                                lexer_public_1.LexerDefinitionErrorType
                                    .EMPTY_MATCH_PATTERN,
                            tokenTypes: [currType]
                        }
                    })
                    return errors
                }
                exports.findEmptyMatchRegExps = findEmptyMatchRegExps
                var start_of_input = /[^\\[][\^]|^\^/
                function findStartOfInputAnchor(tokenTypes) {
                    var StartAnchorFinder = /** @class */ (function(_super) {
                        __extends(StartAnchorFinder, _super)
                        function StartAnchorFinder() {
                            var _this =
                                (_super !== null &&
                                    _super.apply(this, arguments)) ||
                                this
                            _this.found = false
                            return _this
                        }
                        StartAnchorFinder.prototype.visitStartAnchor = function(
                            node
                        ) {
                            this.found = true
                        }
                        return StartAnchorFinder
                    })(regexp_to_ast_1.BaseRegExpVisitor)
                    var invalidRegex = utils_1.filter(tokenTypes, function(
                        currType
                    ) {
                        var pattern = currType[PATTERN]
                        try {
                            var regexpAst = regExpParser.pattern(
                                pattern.toString()
                            )
                            var startAnchorVisitor = new StartAnchorFinder()
                            startAnchorVisitor.visit(regexpAst)
                            return startAnchorVisitor.found
                        } catch (e) {
                            // old behavior in case of runtime exceptions with regexp-to-ast.
                            /* istanbul ignore next - cannot ensure an error in regexp-to-ast*/
                            return start_of_input.test(pattern.source)
                        }
                    })
                    var errors = utils_1.map(invalidRegex, function(currType) {
                        return {
                            message:
                                "Unexpected RegExp Anchor Error:\n" +
                                "\tToken Type: ->" +
                                tokens_public_1.tokenName(currType) +
                                "<- static 'PATTERN' cannot contain start of input anchor '^'\n" +
                                "\tSee https://sap.github.io/chevrotain/docs/guide/resolving_lexer_errors.html#ANCHORS" +
                                "\tfor details.",
                            type:
                                lexer_public_1.LexerDefinitionErrorType
                                    .SOI_ANCHOR_FOUND,
                            tokenTypes: [currType]
                        }
                    })
                    return errors
                }
                exports.findStartOfInputAnchor = findStartOfInputAnchor
                function findUnsupportedFlags(tokenTypes) {
                    var invalidFlags = utils_1.filter(tokenTypes, function(
                        currType
                    ) {
                        var pattern = currType[PATTERN]
                        return (
                            pattern instanceof RegExp &&
                            (pattern.multiline || pattern.global)
                        )
                    })
                    var errors = utils_1.map(invalidFlags, function(currType) {
                        return {
                            message:
                                "Token Type: ->" +
                                tokens_public_1.tokenName(currType) +
                                "<- static 'PATTERN' may NOT contain global('g') or multiline('m')",
                            type:
                                lexer_public_1.LexerDefinitionErrorType
                                    .UNSUPPORTED_FLAGS_FOUND,
                            tokenTypes: [currType]
                        }
                    })
                    return errors
                }
                exports.findUnsupportedFlags = findUnsupportedFlags
                // This can only test for identical duplicate RegExps, not semantically equivalent ones.
                function findDuplicatePatterns(tokenTypes) {
                    var found = []
                    var identicalPatterns = utils_1.map(tokenTypes, function(
                        outerType
                    ) {
                        return utils_1.reduce(
                            tokenTypes,
                            function(result, innerType) {
                                if (
                                    outerType.PATTERN.source ===
                                        innerType.PATTERN.source &&
                                    !utils_1.contains(found, innerType) &&
                                    innerType.PATTERN !==
                                        lexer_public_1.Lexer.NA
                                ) {
                                    // this avoids duplicates in the result, each Token Type may only appear in one "set"
                                    // in essence we are creating Equivalence classes on equality relation.
                                    found.push(innerType)
                                    result.push(innerType)
                                    return result
                                }
                                return result
                            },
                            []
                        )
                    })
                    identicalPatterns = utils_1.compact(identicalPatterns)
                    var duplicatePatterns = utils_1.filter(
                        identicalPatterns,
                        function(currIdenticalSet) {
                            return currIdenticalSet.length > 1
                        }
                    )
                    var errors = utils_1.map(duplicatePatterns, function(
                        setOfIdentical
                    ) {
                        var tokenTypeNames = utils_1.map(
                            setOfIdentical,
                            function(currType) {
                                return tokens_public_1.tokenName(currType)
                            }
                        )
                        var dupPatternSrc = utils_1.first(setOfIdentical)
                            .PATTERN
                        return {
                            message:
                                "The same RegExp pattern ->" +
                                dupPatternSrc +
                                "<-" +
                                ("has been used in all of the following Token Types: " +
                                    tokenTypeNames.join(", ") +
                                    " <-"),
                            type:
                                lexer_public_1.LexerDefinitionErrorType
                                    .DUPLICATE_PATTERNS_FOUND,
                            tokenTypes: setOfIdentical
                        }
                    })
                    return errors
                }
                exports.findDuplicatePatterns = findDuplicatePatterns
                function findInvalidGroupType(tokenTypes) {
                    var invalidTypes = utils_1.filter(tokenTypes, function(
                        clazz
                    ) {
                        if (!utils_1.has(clazz, "GROUP")) {
                            return false
                        }
                        var group = clazz.GROUP
                        return (
                            group !== lexer_public_1.Lexer.SKIPPED &&
                            group !== lexer_public_1.Lexer.NA &&
                            !utils_1.isString(group)
                        )
                    })
                    var errors = utils_1.map(invalidTypes, function(currType) {
                        return {
                            message:
                                "Token Type: ->" +
                                tokens_public_1.tokenName(currType) +
                                "<- static 'GROUP' can only be Lexer.SKIPPED/Lexer.NA/A String",
                            type:
                                lexer_public_1.LexerDefinitionErrorType
                                    .INVALID_GROUP_TYPE_FOUND,
                            tokenTypes: [currType]
                        }
                    })
                    return errors
                }
                exports.findInvalidGroupType = findInvalidGroupType
                function findModesThatDoNotExist(tokenTypes, validModes) {
                    var invalidModes = utils_1.filter(tokenTypes, function(
                        clazz
                    ) {
                        return (
                            clazz.PUSH_MODE !== undefined &&
                            !utils_1.contains(validModes, clazz.PUSH_MODE)
                        )
                    })
                    var errors = utils_1.map(invalidModes, function(clazz) {
                        var msg =
                            "Token Type: ->" +
                            tokens_public_1.tokenName(clazz) +
                            "<- static 'PUSH_MODE' value cannot refer to a Lexer Mode ->" +
                            clazz.PUSH_MODE +
                            "<-" +
                            "which does not exist"
                        return {
                            message: msg,
                            type:
                                lexer_public_1.LexerDefinitionErrorType
                                    .PUSH_MODE_DOES_NOT_EXIST,
                            tokenTypes: [clazz]
                        }
                    })
                    return errors
                }
                exports.findModesThatDoNotExist = findModesThatDoNotExist
                function findUnreachablePatterns(tokenTypes) {
                    var errors = []
                    var canBeTested = utils_1.reduce(
                        tokenTypes,
                        function(result, tokType, idx) {
                            var pattern = tokType.PATTERN
                            if (pattern === lexer_public_1.Lexer.NA) {
                                return result
                            }
                            // a more comprehensive validation for all forms of regExps would require
                            // deeper regExp analysis capabilities
                            if (utils_1.isString(pattern)) {
                                result.push({
                                    str: pattern,
                                    idx: idx,
                                    tokenType: tokType
                                })
                            } else if (
                                utils_1.isRegExp(pattern) &&
                                noMetaChar(pattern)
                            ) {
                                result.push({
                                    str: pattern.source,
                                    idx: idx,
                                    tokenType: tokType
                                })
                            }
                            return result
                        },
                        []
                    )
                    utils_1.forEach(tokenTypes, function(tokType, testIdx) {
                        utils_1.forEach(canBeTested, function(_a) {
                            var str = _a.str,
                                idx = _a.idx,
                                tokenType = _a.tokenType
                            if (
                                testIdx < idx &&
                                testTokenType(str, tokType.PATTERN)
                            ) {
                                var msg =
                                    "Token: ->" +
                                    tokens_public_1.tokenName(tokenType) +
                                    "<- can never be matched.\n" +
                                    ("Because it appears AFTER the Token Type ->" +
                                        tokens_public_1.tokenName(tokType) +
                                        "<-") +
                                    "in the lexer's definition.\n" +
                                    "See https://sap.github.io/chevrotain/docs/guide/resolving_lexer_errors.html#UNREACHABLE"
                                errors.push({
                                    message: msg,
                                    type:
                                        lexer_public_1.LexerDefinitionErrorType
                                            .UNREACHABLE_PATTERN,
                                    tokenTypes: [tokType, tokenType]
                                })
                            }
                        })
                    })
                    return errors
                }
                exports.findUnreachablePatterns = findUnreachablePatterns
                function testTokenType(str, pattern) {
                    /* istanbul ignore else */
                    if (utils_1.isRegExp(pattern)) {
                        var regExpArray = pattern.exec(str)
                        return regExpArray !== null && regExpArray.index === 0
                    } else if (utils_1.isFunction(pattern)) {
                        // maintain the API of custom patterns
                        return pattern(str, 0, [], {})
                    } else if (utils_1.has(pattern, "exec")) {
                        // maintain the API of custom patterns
                        return pattern.exec(str, 0, [], {})
                    } else if (typeof pattern === "string") {
                        return pattern === str
                    } else {
                        throw Error("non exhaustive match")
                    }
                }
                function noMetaChar(regExp) {
                    //https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp
                    var metaChars = [
                        ".",
                        "\\",
                        "[",
                        "]",
                        "|",
                        "^",
                        "$",
                        "(",
                        ")",
                        "?",
                        "*",
                        "+",
                        "{"
                    ]
                    return (
                        utils_1.find(metaChars, function(char) {
                            return regExp.source.indexOf(char) !== -1
                        }) === undefined
                    )
                }
                function addStartOfInput(pattern) {
                    var flags = pattern.ignoreCase ? "i" : ""
                    // always wrapping in a none capturing group preceded by '^' to make sure matching can only work on start of input.
                    // duplicate/redundant start of input markers have no meaning (/^^^^A/ === /^A/)
                    return new RegExp("^(?:" + pattern.source + ")", flags)
                }
                exports.addStartOfInput = addStartOfInput
                function addStickyFlag(pattern) {
                    var flags = pattern.ignoreCase ? "iy" : "y"
                    // always wrapping in a none capturing group preceded by '^' to make sure matching can only work on start of input.
                    // duplicate/redundant start of input markers have no meaning (/^^^^A/ === /^A/)
                    return new RegExp("" + pattern.source, flags)
                }
                exports.addStickyFlag = addStickyFlag
                function performRuntimeChecks(
                    lexerDefinition,
                    trackLines,
                    lineTerminatorCharacters
                ) {
                    var errors = []
                    // some run time checks to help the end users.
                    if (!utils_1.has(lexerDefinition, exports.DEFAULT_MODE)) {
                        errors.push({
                            message:
                                "A MultiMode Lexer cannot be initialized without a <" +
                                exports.DEFAULT_MODE +
                                "> property in its definition\n",
                            type:
                                lexer_public_1.LexerDefinitionErrorType
                                    .MULTI_MODE_LEXER_WITHOUT_DEFAULT_MODE
                        })
                    }
                    if (!utils_1.has(lexerDefinition, exports.MODES)) {
                        errors.push({
                            message:
                                "A MultiMode Lexer cannot be initialized without a <" +
                                exports.MODES +
                                "> property in its definition\n",
                            type:
                                lexer_public_1.LexerDefinitionErrorType
                                    .MULTI_MODE_LEXER_WITHOUT_MODES_PROPERTY
                        })
                    }
                    if (
                        utils_1.has(lexerDefinition, exports.MODES) &&
                        utils_1.has(lexerDefinition, exports.DEFAULT_MODE) &&
                        !utils_1.has(
                            lexerDefinition.modes,
                            lexerDefinition.defaultMode
                        )
                    ) {
                        errors.push({
                            message:
                                "A MultiMode Lexer cannot be initialized with a " +
                                exports.DEFAULT_MODE +
                                ": <" +
                                lexerDefinition.defaultMode +
                                ">" +
                                "which does not exist\n",
                            type:
                                lexer_public_1.LexerDefinitionErrorType
                                    .MULTI_MODE_LEXER_DEFAULT_MODE_VALUE_DOES_NOT_EXIST
                        })
                    }
                    if (utils_1.has(lexerDefinition, exports.MODES)) {
                        utils_1.forEach(lexerDefinition.modes, function(
                            currModeValue,
                            currModeName
                        ) {
                            utils_1.forEach(currModeValue, function(
                                currTokType,
                                currIdx
                            ) {
                                if (utils_1.isUndefined(currTokType)) {
                                    errors.push({
                                        message:
                                            "A Lexer cannot be initialized using an undefined Token Type. Mode:" +
                                            ("<" +
                                                currModeName +
                                                "> at index: <" +
                                                currIdx +
                                                ">\n"),
                                        type:
                                            lexer_public_1
                                                .LexerDefinitionErrorType
                                                .LEXER_DEFINITION_CANNOT_CONTAIN_UNDEFINED
                                    })
                                }
                            })
                        })
                    }
                    return errors
                }
                exports.performRuntimeChecks = performRuntimeChecks
                function performWarningRuntimeChecks(
                    lexerDefinition,
                    trackLines,
                    lineTerminatorCharacters
                ) {
                    var warnings = []
                    var hasAnyLineBreak = false
                    var allTokenTypes = utils_1.compact(
                        utils_1.flatten(
                            utils_1.mapValues(lexerDefinition.modes, function(
                                tokTypes
                            ) {
                                return tokTypes
                            })
                        )
                    )
                    var concreteTokenTypes = utils_1.reject(
                        allTokenTypes,
                        function(currType) {
                            return currType[PATTERN] === lexer_public_1.Lexer.NA
                        }
                    )
                    var terminatorCharCodes = getCharCodes(
                        lineTerminatorCharacters
                    )
                    if (trackLines) {
                        utils_1.forEach(concreteTokenTypes, function(tokType) {
                            var currIssue = checkLineBreaksIssues(
                                tokType,
                                terminatorCharCodes
                            )
                            if (currIssue !== false) {
                                var message = buildLineBreakIssueMessage(
                                    tokType,
                                    currIssue
                                )
                                var warningDescriptor = {
                                    message: message,
                                    type: currIssue.issue,
                                    tokenType: tokType
                                }
                                warnings.push(warningDescriptor)
                            } else {
                                // we don't want to attempt to scan if the user explicitly specified the line_breaks option.
                                if (utils_1.has(tokType, "LINE_BREAKS")) {
                                    if (tokType.LINE_BREAKS === true) {
                                        hasAnyLineBreak = true
                                    }
                                } else {
                                    if (
                                        reg_exp_1.canMatchCharCode(
                                            terminatorCharCodes,
                                            tokType.PATTERN
                                        )
                                    ) {
                                        hasAnyLineBreak = true
                                    }
                                }
                            }
                        })
                    }
                    if (trackLines && !hasAnyLineBreak) {
                        warnings.push({
                            message:
                                "Warning: No LINE_BREAKS Found.\n" +
                                "\tThis Lexer has been defined to track line and column information,\n" +
                                "\tBut none of the Token Types can be identified as matching a line terminator.\n" +
                                "\tSee https://sap.github.io/chevrotain/docs/guide/resolving_lexer_errors.html#LINE_BREAKS \n" +
                                "\tfor details.",
                            type:
                                lexer_public_1.LexerDefinitionErrorType
                                    .NO_LINE_BREAKS_FLAGS
                        })
                    }
                    return warnings
                }
                exports.performWarningRuntimeChecks = performWarningRuntimeChecks
                function cloneEmptyGroups(emptyGroups) {
                    var clonedResult = {}
                    var groupKeys = utils_1.keys(emptyGroups)
                    utils_1.forEach(groupKeys, function(currKey) {
                        var currGroupValue = emptyGroups[currKey]
                        /* istanbul ignore else */
                        if (utils_1.isArray(currGroupValue)) {
                            clonedResult[currKey] = []
                        } else {
                            throw Error("non exhaustive match")
                        }
                    })
                    return clonedResult
                }
                exports.cloneEmptyGroups = cloneEmptyGroups
                // TODO: refactor to avoid duplication
                function isCustomPattern(tokenType) {
                    var pattern = tokenType.PATTERN
                    /* istanbul ignore else */
                    if (utils_1.isRegExp(pattern)) {
                        return false
                    } else if (utils_1.isFunction(pattern)) {
                        // CustomPatternMatcherFunc - custom patterns do not require any transformations, only wrapping in a RegExp Like object
                        return true
                    } else if (utils_1.has(pattern, "exec")) {
                        // ICustomPattern
                        return true
                    } else if (utils_1.isString(pattern)) {
                        return false
                    } else {
                        throw Error("non exhaustive match")
                    }
                }
                exports.isCustomPattern = isCustomPattern
                function isShortPattern(pattern) {
                    if (utils_1.isString(pattern) && pattern.length === 1) {
                        return pattern.charCodeAt(0)
                    } else {
                        return false
                    }
                }
                exports.isShortPattern = isShortPattern
                /**
                 * Faster than using a RegExp for default newline detection during lexing.
                 */
                exports.LineTerminatorOptimizedTester = {
                    // implements /\n|\r\n?/g.test
                    test: function(text) {
                        var len = text.length
                        for (var i = this.lastIndex; i < len; i++) {
                            var c = text.charCodeAt(i)
                            if (c === 10) {
                                this.lastIndex = i + 1
                                return true
                            } else if (c === 13) {
                                if (text.charCodeAt(i + 1) === 10) {
                                    this.lastIndex = i + 2
                                } else {
                                    this.lastIndex = i + 1
                                }
                                return true
                            }
                        }
                        return false
                    },
                    lastIndex: 0
                }
                function checkLineBreaksIssues(
                    tokType,
                    lineTerminatorCharCodes
                ) {
                    if (utils_1.has(tokType, "LINE_BREAKS")) {
                        // if the user explicitly declared the line_breaks option we will respect their choice
                        // and assume it is correct.
                        return false
                    } else {
                        /* istanbul ignore else */
                        if (utils_1.isRegExp(tokType.PATTERN)) {
                            try {
                                reg_exp_1.canMatchCharCode(
                                    lineTerminatorCharCodes,
                                    tokType.PATTERN
                                )
                            } catch (e) {
                                /* istanbul ignore next - to test this we would have to mock <canMatchCharCode> to throw an error */
                                return {
                                    issue:
                                        lexer_public_1.LexerDefinitionErrorType
                                            .IDENTIFY_TERMINATOR,
                                    errMsg: e.message
                                }
                            }
                            return false
                        } else if (utils_1.isString(tokType.PATTERN)) {
                            // string literal patterns can always be analyzed to detect line terminator usage
                            return false
                        } else if (isCustomPattern(tokType)) {
                            // custom token types
                            return {
                                issue:
                                    lexer_public_1.LexerDefinitionErrorType
                                        .CUSTOM_LINE_BREAK
                            }
                        } else {
                            throw Error("non exhaustive match")
                        }
                    }
                }
                function buildLineBreakIssueMessage(tokType, details) {
                    /* istanbul ignore else */
                    if (
                        details.issue ===
                        lexer_public_1.LexerDefinitionErrorType
                            .IDENTIFY_TERMINATOR
                    ) {
                        return (
                            "Warning: unable to identify line terminator usage in pattern.\n" +
                            ("\tThe problem is in the <" +
                                tokType.name +
                                "> Token Type\n") +
                            ("\t Root cause: " + details.errMsg + ".\n") +
                            "\tFor details See: https://sap.github.io/chevrotain/docs/guide/resolving_lexer_errors.html#IDENTIFY_TERMINATOR"
                        )
                    } else if (
                        details.issue ===
                        lexer_public_1.LexerDefinitionErrorType
                            .CUSTOM_LINE_BREAK
                    ) {
                        return (
                            "Warning: A Custom Token Pattern should specify the <line_breaks> option.\n" +
                            ("\tThe problem is in the <" +
                                tokType.name +
                                "> Token Type\n") +
                            "\tFor details See: https://sap.github.io/chevrotain/docs/guide/resolving_lexer_errors.html#CUSTOM_LINE_BREAK"
                        )
                    } else {
                        throw Error("non exhaustive match")
                    }
                }
                exports.buildLineBreakIssueMessage = buildLineBreakIssueMessage
                function getCharCodes(charsOrCodes) {
                    var charCodes = utils_1.map(charsOrCodes, function(
                        numOrString
                    ) {
                        if (
                            utils_1.isString(numOrString) &&
                            numOrString.length > 0
                        ) {
                            return numOrString.charCodeAt(0)
                        } else {
                            return numOrString
                        }
                    })
                    return charCodes
                }
                //# sourceMappingURL=lexer.js.map

                /***/
            },
            /* 28 */
            /***/ function(module, exports, __webpack_require__) {
                "use strict"

                var __extends =
                    (this && this.__extends) ||
                    (function() {
                        var extendStatics = function(d, b) {
                            extendStatics =
                                Object.setPrototypeOf ||
                                ({ __proto__: [] } instanceof Array &&
                                    function(d, b) {
                                        d.__proto__ = b
                                    }) ||
                                function(d, b) {
                                    for (var p in b)
                                        if (b.hasOwnProperty(p)) d[p] = b[p]
                                }
                            return extendStatics(d, b)
                        }
                        return function(d, b) {
                            extendStatics(d, b)
                            function __() {
                                this.constructor = d
                            }
                            d.prototype =
                                b === null
                                    ? Object.create(b)
                                    : ((__.prototype = b.prototype), new __())
                        }
                    })()
                Object.defineProperty(exports, "__esModule", { value: true })
                var regexp_to_ast_1 = __webpack_require__(19)
                var utils_1 = __webpack_require__(0)
                var regExpParser = new regexp_to_ast_1.RegExpParser()
                var complementErrorMessage =
                    "Complement Sets are not supported for first char optimization"
                exports.failedOptimizationPrefixMsg =
                    'Unable to use "first char" lexer optimizations:\n'
                function getStartCodes(regExp, ensureOptimizations) {
                    if (ensureOptimizations === void 0) {
                        ensureOptimizations = false
                    }
                    try {
                        var ast = regExpParser.pattern(regExp.toString())
                        var firstChars = firstChar(ast.value)
                        if (ast.flags.ignoreCase) {
                            firstChars = applyIgnoreCase(firstChars)
                        }
                        return firstChars
                    } catch (e) {
                        /* istanbul ignore next */
                        // Testing this relies on the regexp-to-ast library having a bug... */
                        // TODO: only the else branch needs to be ignored, try to fix with newer prettier / tsc
                        if (e.message === complementErrorMessage) {
                            if (ensureOptimizations) {
                                utils_1.PRINT_WARNING(
                                    "" +
                                        exports.failedOptimizationPrefixMsg +
                                        ("\tUnable to optimize: < " +
                                            regExp.toString() +
                                            " >\n") +
                                        "\tComplement Sets cannot be automatically optimized.\n" +
                                        "\tThis will disable the lexer's first char optimizations.\n" +
                                        "\tSee: https://sap.github.io/chevrotain/docs/guide/resolving_lexer_errors.html#COMPLEMENT for details."
                                )
                            }
                        } else {
                            var msgSuffix = ""
                            if (ensureOptimizations) {
                                msgSuffix =
                                    "\n\tThis will disable the lexer's first char optimizations.\n" +
                                    "\tSee: https://sap.github.io/chevrotain/docs/guide/resolving_lexer_errors.html#REGEXP_PARSING for details."
                            }
                            utils_1.PRINT_ERROR(
                                exports.failedOptimizationPrefixMsg +
                                    "\n" +
                                    ("\tFailed parsing: < " +
                                        regExp.toString() +
                                        " >\n") +
                                    ("\tUsing the regexp-to-ast library version: " +
                                        regexp_to_ast_1.VERSION +
                                        "\n") +
                                    "\tPlease open an issue at: https://github.com/bd82/regexp-to-ast/issues" +
                                    msgSuffix
                            )
                        }
                    }
                    return []
                }
                exports.getStartCodes = getStartCodes
                function firstChar(ast) {
                    switch (ast.type) {
                        case "Disjunction":
                            return utils_1.flatten(
                                utils_1.map(ast.value, firstChar)
                            )
                        case "Alternative":
                            var startChars_1 = []
                            var terms = ast.value
                            for (var i = 0; i < terms.length; i++) {
                                var term = terms[i]
                                if (
                                    utils_1.contains(
                                        [
                                            // A group back reference cannot affect potential starting char.
                                            // because if a back reference is the first production than automatically
                                            // the group being referenced has had to come BEFORE so its codes have already been added
                                            "GroupBackReference",
                                            // assertions do not affect potential starting codes
                                            "Lookahead",
                                            "NegativeLookahead",
                                            "StartAnchor",
                                            "EndAnchor",
                                            "WordBoundary",
                                            "NonWordBoundary"
                                        ],
                                        term.type
                                    )
                                ) {
                                    continue
                                }
                                var atom = term
                                switch (atom.type) {
                                    case "Character":
                                        startChars_1.push(atom.value)
                                        break
                                    case "Set":
                                        if (atom.complement === true) {
                                            throw Error(complementErrorMessage)
                                        }
                                        // TODO: this may still be slow when there are many codes
                                        utils_1.forEach(atom.value, function(
                                            code
                                        ) {
                                            if (typeof code === "number") {
                                                startChars_1.push(code)
                                            } else {
                                                //range
                                                var range = code
                                                for (
                                                    var rangeCode = range.from;
                                                    rangeCode <= range.to;
                                                    rangeCode++
                                                ) {
                                                    startChars_1.push(rangeCode)
                                                }
                                            }
                                        })
                                        break
                                    case "Group":
                                        var groupCodes = firstChar(atom.value)
                                        utils_1.forEach(groupCodes, function(
                                            code
                                        ) {
                                            return startChars_1.push(code)
                                        })
                                        break
                                    /* istanbul ignore next */
                                    default:
                                        throw Error("Non Exhaustive Match")
                                }
                                // reached a mandatory production, no more **start** codes can be found on this alternative
                                var isOptionalQuantifier =
                                    atom.quantifier !== undefined &&
                                    atom.quantifier.atLeast === 0
                                if (
                                    // A group may be optional due to empty contents /(?:)/
                                    // or if everything inside it is optional /((a)?)/
                                    (atom.type === "Group" &&
                                        isWholeOptional(atom) === false) ||
                                    // If this term is not a group it may only be optional if it has an optional quantifier
                                    (atom.type !== "Group" &&
                                        isOptionalQuantifier === false)
                                ) {
                                    break
                                }
                            }
                            return startChars_1
                        /* istanbul ignore next */
                        default:
                            throw Error("non exhaustive match!")
                    }
                }
                exports.firstChar = firstChar
                function applyIgnoreCase(firstChars) {
                    var firstCharsCase = []
                    utils_1.forEach(firstChars, function(charCode) {
                        firstCharsCase.push(charCode)
                        var char = String.fromCharCode(charCode)
                        /* istanbul ignore else */
                        if (char.toUpperCase() !== char) {
                            firstCharsCase.push(
                                char.toUpperCase().charCodeAt(0)
                            )
                        } else if (char.toLowerCase() !== char) {
                            firstCharsCase.push(
                                char.toLowerCase().charCodeAt(0)
                            )
                        }
                    })
                    return firstCharsCase
                }
                exports.applyIgnoreCase = applyIgnoreCase
                function findCode(setNode, targetCharCodes) {
                    return utils_1.find(setNode.value, function(codeOrRange) {
                        if (typeof codeOrRange === "number") {
                            return utils_1.contains(
                                targetCharCodes,
                                codeOrRange
                            )
                        } else {
                            // range
                            var range_1 = codeOrRange
                            return (
                                utils_1.find(targetCharCodes, function(
                                    targetCode
                                ) {
                                    return (
                                        range_1.from <= targetCode &&
                                        targetCode <= range_1.to
                                    )
                                }) !== undefined
                            )
                        }
                    })
                }
                function isWholeOptional(ast) {
                    if (ast.quantifier && ast.quantifier.atLeast === 0) {
                        return true
                    }
                    if (!ast.value) {
                        return false
                    }
                    return utils_1.isArray(ast.value)
                        ? utils_1.every(ast.value, isWholeOptional)
                        : isWholeOptional(ast.value)
                }
                var CharCodeFinder = /** @class */ (function(_super) {
                    __extends(CharCodeFinder, _super)
                    function CharCodeFinder(targetCharCodes) {
                        var _this = _super.call(this) || this
                        _this.targetCharCodes = targetCharCodes
                        _this.found = false
                        return _this
                    }
                    CharCodeFinder.prototype.visitChildren = function(node) {
                        // switch lookaheads as they do not actually consume any characters thus
                        // finding a charCode at lookahead context does not mean that regexp can actually contain it in a match.
                        switch (node.type) {
                            case "Lookahead":
                                this.visitLookahead(node)
                                return
                            case "NegativeLookahead":
                                this.visitNegativeLookahead(node)
                                return
                        }
                        _super.prototype.visitChildren.call(this, node)
                    }
                    CharCodeFinder.prototype.visitCharacter = function(node) {
                        if (
                            utils_1.contains(this.targetCharCodes, node.value)
                        ) {
                            this.found = true
                        }
                    }
                    CharCodeFinder.prototype.visitSet = function(node) {
                        if (node.complement) {
                            if (
                                findCode(node, this.targetCharCodes) ===
                                undefined
                            ) {
                                this.found = true
                            }
                        } else {
                            if (
                                findCode(node, this.targetCharCodes) !==
                                undefined
                            ) {
                                this.found = true
                            }
                        }
                    }
                    return CharCodeFinder
                })(regexp_to_ast_1.BaseRegExpVisitor)
                function canMatchCharCode(charCodes, pattern) {
                    if (pattern instanceof RegExp) {
                        var ast = regExpParser.pattern(pattern.toString())
                        var charCodeFinder = new CharCodeFinder(charCodes)
                        charCodeFinder.visit(ast)
                        return charCodeFinder.found
                    } else {
                        return (
                            utils_1.find(pattern, function(char) {
                                return utils_1.contains(
                                    charCodes,
                                    char.charCodeAt(0)
                                )
                            }) !== undefined
                        )
                    }
                }
                exports.canMatchCharCode = canMatchCharCode
                //# sourceMappingURL=reg_exp.js.map

                /***/
            },
            /* 29 */
            /***/ function(module, exports, __webpack_require__) {
                "use strict"

                Object.defineProperty(exports, "__esModule", { value: true })
                var Range = /** @class */ (function() {
                    function Range(start, end) {
                        this.start = start
                        this.end = end
                        if (!isValidRange(start, end)) {
                            throw new Error("INVALID RANGE")
                        }
                    }
                    Range.prototype.contains = function(num) {
                        return this.start <= num && this.end >= num
                    }
                    Range.prototype.containsRange = function(other) {
                        return (
                            this.start <= other.start && this.end >= other.end
                        )
                    }
                    Range.prototype.isContainedInRange = function(other) {
                        return other.containsRange(this)
                    }
                    Range.prototype.strictlyContainsRange = function(other) {
                        return this.start < other.start && this.end > other.end
                    }
                    Range.prototype.isStrictlyContainedInRange = function(
                        other
                    ) {
                        return other.strictlyContainsRange(this)
                    }
                    return Range
                })()
                exports.Range = Range
                function isValidRange(start, end) {
                    return !(start < 0 || end < start)
                }
                exports.isValidRange = isValidRange
                //# sourceMappingURL=range.js.map

                /***/
            },
            /* 30 */
            /***/ function(module, exports, __webpack_require__) {
                "use strict"

                var __extends =
                    (this && this.__extends) ||
                    (function() {
                        var extendStatics = function(d, b) {
                            extendStatics =
                                Object.setPrototypeOf ||
                                ({ __proto__: [] } instanceof Array &&
                                    function(d, b) {
                                        d.__proto__ = b
                                    }) ||
                                function(d, b) {
                                    for (var p in b)
                                        if (b.hasOwnProperty(p)) d[p] = b[p]
                                }
                            return extendStatics(d, b)
                        }
                        return function(d, b) {
                            extendStatics(d, b)
                            function __() {
                                this.constructor = d
                            }
                            d.prototype =
                                b === null
                                    ? Object.create(b)
                                    : ((__.prototype = b.prototype), new __())
                        }
                    })()
                Object.defineProperty(exports, "__esModule", { value: true })
                var parser_1 = __webpack_require__(3)
                var utils_1 = __webpack_require__(0)
                var gast_visitor_public_1 = __webpack_require__(5)
                function resolveGrammar(topLevels, errMsgProvider) {
                    var refResolver = new GastRefResolverVisitor(
                        topLevels,
                        errMsgProvider
                    )
                    refResolver.resolveRefs()
                    return refResolver.errors
                }
                exports.resolveGrammar = resolveGrammar
                var GastRefResolverVisitor = /** @class */ (function(_super) {
                    __extends(GastRefResolverVisitor, _super)
                    function GastRefResolverVisitor(
                        nameToTopRule,
                        errMsgProvider
                    ) {
                        var _this = _super.call(this) || this
                        _this.nameToTopRule = nameToTopRule
                        _this.errMsgProvider = errMsgProvider
                        _this.errors = []
                        return _this
                    }
                    GastRefResolverVisitor.prototype.resolveRefs = function() {
                        var _this = this
                        utils_1.forEach(this.nameToTopRule.values(), function(
                            prod
                        ) {
                            _this.currTopLevel = prod
                            prod.accept(_this)
                        })
                    }
                    GastRefResolverVisitor.prototype.visitNonTerminal = function(
                        node
                    ) {
                        var ref = this.nameToTopRule.get(node.nonTerminalName)
                        if (!ref) {
                            var msg = this.errMsgProvider.buildRuleNotFoundError(
                                this.currTopLevel,
                                node
                            )
                            this.errors.push({
                                message: msg,
                                type:
                                    parser_1.ParserDefinitionErrorType
                                        .UNRESOLVED_SUBRULE_REF,
                                ruleName: this.currTopLevel.name,
                                unresolvedRefName: node.nonTerminalName
                            })
                        } else {
                            node.referencedRule = ref
                        }
                    }
                    return GastRefResolverVisitor
                })(gast_visitor_public_1.GAstVisitor)
                exports.GastRefResolverVisitor = GastRefResolverVisitor
                //# sourceMappingURL=resolver.js.map

                /***/
            },
            /* 31 */
            /***/ function(module, exports, __webpack_require__) {
                "use strict"

                Object.defineProperty(exports, "__esModule", { value: true })
                var lookahead_1 = __webpack_require__(12)
                var utils_1 = __webpack_require__(0)
                var parser_1 = __webpack_require__(3)
                var keys_1 = __webpack_require__(9)
                /**
                 * Trait responsible for the lookahead related utilities and optimizations.
                 */
                var LooksAhead = /** @class */ (function() {
                    function LooksAhead() {}
                    LooksAhead.prototype.initLooksAhead = function(config) {
                        this.dynamicTokensEnabled = utils_1.has(
                            config,
                            "dynamicTokensEnabled"
                        )
                            ? config.dynamicTokensEnabled
                            : parser_1.DEFAULT_PARSER_CONFIG
                                  .dynamicTokensEnabled
                        this.maxLookahead = utils_1.has(config, "maxLookahead")
                            ? config.maxLookahead
                            : parser_1.DEFAULT_PARSER_CONFIG.maxLookahead
                        /* istanbul ignore next - Using plain array as dictionary will be tested on older node.js versions and IE11 */
                        this.lookAheadFuncsCache = utils_1.isES2015MapSupported()
                            ? new Map()
                            : []
                        // Performance optimization on newer engines that support ES6 Map
                        // For larger Maps this is slightly faster than using a plain object (array in our case).
                        /* istanbul ignore else - The else branch will be tested on older node.js versions and IE11 */
                        if (utils_1.isES2015MapSupported()) {
                            this.getLaFuncFromCache = this.getLaFuncFromMap
                            this.setLaFuncCache = this.setLaFuncCacheUsingMap
                        } else {
                            this.getLaFuncFromCache = this.getLaFuncFromObj
                            this.setLaFuncCache = this.setLaFuncUsingObj
                        }
                    }
                    LooksAhead.prototype.lookAheadBuilderForOptional = function(
                        alt,
                        tokenMatcher,
                        dynamicTokensEnabled
                    ) {
                        return lookahead_1.buildSingleAlternativeLookaheadFunction(
                            alt,
                            tokenMatcher,
                            dynamicTokensEnabled
                        )
                    }
                    LooksAhead.prototype.lookAheadBuilderForAlternatives = function(
                        alts,
                        hasPredicates,
                        tokenMatcher,
                        dynamicTokensEnabled
                    ) {
                        return lookahead_1.buildAlternativesLookAheadFunc(
                            alts,
                            hasPredicates,
                            tokenMatcher,
                            dynamicTokensEnabled
                        )
                    }
                    // this actually returns a number, but it is always used as a string (object prop key)
                    LooksAhead.prototype.getKeyForAutomaticLookahead = function(
                        dslMethodIdx,
                        occurrence
                    ) {
                        var currRuleShortName = this.getLastExplicitRuleShortName()
                        return keys_1.getKeyForAutomaticLookahead(
                            currRuleShortName,
                            dslMethodIdx,
                            occurrence
                        )
                    }
                    LooksAhead.prototype.getLookaheadFuncForOr = function(
                        occurrence,
                        alts
                    ) {
                        var key = this.getKeyForAutomaticLookahead(
                            keys_1.OR_IDX,
                            occurrence
                        )
                        var laFunc = this.getLaFuncFromCache(key)
                        if (laFunc === undefined) {
                            var ruleName = this.getCurrRuleFullName()
                            var ruleGrammar = this.getGAstProductions().get(
                                ruleName
                            )
                            // note that hasPredicates is only computed once.
                            var hasPredicates = utils_1.some(alts, function(
                                currAlt
                            ) {
                                return utils_1.isFunction(currAlt.GATE)
                            })
                            laFunc = lookahead_1.buildLookaheadFuncForOr(
                                occurrence,
                                ruleGrammar,
                                this.maxLookahead,
                                hasPredicates,
                                this.dynamicTokensEnabled,
                                this.lookAheadBuilderForAlternatives
                            )
                            this.setLaFuncCache(key, laFunc)
                            return laFunc
                        } else {
                            return laFunc
                        }
                    }
                    // Automatic lookahead calculation
                    LooksAhead.prototype.getLookaheadFuncForOption = function(
                        key,
                        occurrence
                    ) {
                        return this.getLookaheadFuncFor(
                            key,
                            occurrence,
                            this.maxLookahead,
                            lookahead_1.PROD_TYPE.OPTION
                        )
                    }
                    LooksAhead.prototype.getLookaheadFuncForMany = function(
                        key,
                        occurrence
                    ) {
                        return this.getLookaheadFuncFor(
                            key,
                            occurrence,
                            this.maxLookahead,
                            lookahead_1.PROD_TYPE.REPETITION
                        )
                    }
                    LooksAhead.prototype.getLookaheadFuncForManySep = function(
                        key,
                        occurrence
                    ) {
                        return this.getLookaheadFuncFor(
                            key,
                            occurrence,
                            this.maxLookahead,
                            lookahead_1.PROD_TYPE.REPETITION_WITH_SEPARATOR
                        )
                    }
                    LooksAhead.prototype.getLookaheadFuncForAtLeastOne = function(
                        key,
                        occurrence
                    ) {
                        return this.getLookaheadFuncFor(
                            key,
                            occurrence,
                            this.maxLookahead,
                            lookahead_1.PROD_TYPE.REPETITION_MANDATORY
                        )
                    }
                    LooksAhead.prototype.getLookaheadFuncForAtLeastOneSep = function(
                        key,
                        occurrence
                    ) {
                        return this.getLookaheadFuncFor(
                            key,
                            occurrence,
                            this.maxLookahead,
                            lookahead_1.PROD_TYPE
                                .REPETITION_MANDATORY_WITH_SEPARATOR
                        )
                    }
                    LooksAhead.prototype.getLookaheadFuncFor = function(
                        key,
                        occurrence,
                        maxLookahead,
                        prodType
                    ) {
                        var laFunc = this.getLaFuncFromCache(key)
                        if (laFunc === undefined) {
                            var ruleName = this.getCurrRuleFullName()
                            var ruleGrammar = this.getGAstProductions().get(
                                ruleName
                            )
                            laFunc = lookahead_1.buildLookaheadFuncForOptionalProd(
                                occurrence,
                                ruleGrammar,
                                maxLookahead,
                                this.dynamicTokensEnabled,
                                prodType,
                                this.lookAheadBuilderForOptional
                            )
                            this.setLaFuncCache(key, laFunc)
                            return laFunc
                        } else {
                            return laFunc
                        }
                    }
                    /* istanbul ignore next */
                    LooksAhead.prototype.getLaFuncFromCache = function(key) {
                        return undefined
                    }
                    LooksAhead.prototype.getLaFuncFromMap = function(key) {
                        return this.lookAheadFuncsCache.get(key)
                    }
                    /* istanbul ignore next - Using plain array as dictionary will be tested on older node.js versions and IE11 */
                    LooksAhead.prototype.getLaFuncFromObj = function(key) {
                        return this.lookAheadFuncsCache[key]
                    }
                    /* istanbul ignore next */
                    LooksAhead.prototype.setLaFuncCache = function(
                        key,
                        value
                    ) {}
                    LooksAhead.prototype.setLaFuncCacheUsingMap = function(
                        key,
                        value
                    ) {
                        this.lookAheadFuncsCache.set(key, value)
                    }
                    /* istanbul ignore next - Using plain array as dictionary will be tested on older node.js versions and IE11 */
                    LooksAhead.prototype.setLaFuncUsingObj = function(
                        key,
                        value
                    ) {
                        this.lookAheadFuncsCache[key] = value
                    }
                    return LooksAhead
                })()
                exports.LooksAhead = LooksAhead
                //# sourceMappingURL=looksahead.js.map

                /***/
            },
            /* 32 */
            /***/ function(module, exports, __webpack_require__) {
                "use strict"

                Object.defineProperty(exports, "__esModule", { value: true })
                var cst_1 = __webpack_require__(16)
                var utils_1 = __webpack_require__(0)
                var cst_visitor_1 = __webpack_require__(33)
                var keys_1 = __webpack_require__(9)
                var parser_1 = __webpack_require__(3)
                /**
                 * This trait is responsible for the CST building logic.
                 */
                var TreeBuilder = /** @class */ (function() {
                    function TreeBuilder() {}
                    TreeBuilder.prototype.initTreeBuilder = function(config) {
                        this.LAST_EXPLICIT_RULE_STACK = []
                        this.CST_STACK = []
                        this.outputCst = utils_1.has(config, "outputCst")
                            ? config.outputCst
                            : parser_1.DEFAULT_PARSER_CONFIG.outputCst
                        this.nodeLocationTracking = utils_1.has(
                            config,
                            "nodeLocationTracking"
                        )
                            ? config.nodeLocationTracking
                            : parser_1.DEFAULT_PARSER_CONFIG
                                  .nodeLocationTracking
                        if (!this.outputCst) {
                            this.cstInvocationStateUpdate = utils_1.NOOP
                            this.cstFinallyStateUpdate = utils_1.NOOP
                            this.cstPostTerminal = utils_1.NOOP
                            this.cstPostNonTerminal = utils_1.NOOP
                            this.cstPostRule = utils_1.NOOP
                            this.getLastExplicitRuleShortName = this.getLastExplicitRuleShortNameNoCst
                            this.getPreviousExplicitRuleShortName = this.getPreviousExplicitRuleShortNameNoCst
                            this.getLastExplicitRuleOccurrenceIndex = this.getLastExplicitRuleOccurrenceIndexNoCst
                            this.manyInternal = this.manyInternalNoCst
                            this.orInternal = this.orInternalNoCst
                            this.optionInternal = this.optionInternalNoCst
                            this.atLeastOneInternal = this.atLeastOneInternalNoCst
                            this.manySepFirstInternal = this.manySepFirstInternalNoCst
                            this.atLeastOneSepFirstInternal = this.atLeastOneSepFirstInternalNoCst
                        } else {
                            if (/full/i.test(this.nodeLocationTracking)) {
                                if (this.recoveryEnabled) {
                                    this.setNodeLocationFromToken =
                                        cst_1.setNodeLocationFull
                                    this.setNodeLocationFromNode =
                                        cst_1.setNodeLocationFull
                                    this.cstPostRule = utils_1.NOOP
                                    this.setInitialNodeLocation = this.setInitialNodeLocationFullRecovery
                                } else {
                                    this.setNodeLocationFromToken = utils_1.NOOP
                                    this.setNodeLocationFromNode = utils_1.NOOP
                                    this.cstPostRule = this.cstPostRuleFull
                                    this.setInitialNodeLocation = this.setInitialNodeLocationFullRegular
                                }
                            } else if (
                                /onlyOffset/i.test(this.nodeLocationTracking)
                            ) {
                                if (this.recoveryEnabled) {
                                    this.setNodeLocationFromToken =
                                        cst_1.setNodeLocationOnlyOffset
                                    this.setNodeLocationFromNode =
                                        cst_1.setNodeLocationOnlyOffset
                                    this.cstPostRule = utils_1.NOOP
                                    this.setInitialNodeLocation = this.setInitialNodeLocationOnlyOffsetRecovery
                                } else {
                                    this.setNodeLocationFromToken = utils_1.NOOP
                                    this.setNodeLocationFromNode = utils_1.NOOP
                                    this.cstPostRule = this.cstPostRuleOnlyOffset
                                    this.setInitialNodeLocation = this.setInitialNodeLocationOnlyOffsetRegular
                                }
                            } else if (
                                /none/i.test(this.nodeLocationTracking)
                            ) {
                                this.setNodeLocationFromToken = utils_1.NOOP
                                this.setNodeLocationFromNode = utils_1.NOOP
                                this.cstPostRule = utils_1.NOOP
                                this.setInitialNodeLocation = utils_1.NOOP
                            } else {
                                throw Error(
                                    'Invalid <nodeLocationTracking> config option: "' +
                                        config.nodeLocationTracking +
                                        '"'
                                )
                            }
                        }
                    }
                    TreeBuilder.prototype.setInitialNodeLocationOnlyOffsetRecovery = function(
                        cstNode
                    ) {
                        cstNode.location = {
                            startOffset: NaN,
                            endOffset: NaN
                        }
                    }
                    TreeBuilder.prototype.setInitialNodeLocationOnlyOffsetRegular = function(
                        cstNode
                    ) {
                        cstNode.location = {
                            // without error recovery the starting Location of a new CstNode is guaranteed
                            // To be the next Token's startOffset (for valid inputs).
                            // For invalid inputs there won't be any CSTOutput so this potential
                            // inaccuracy does not matter
                            startOffset: this.LA(1).startOffset,
                            endOffset: NaN
                        }
                    }
                    TreeBuilder.prototype.setInitialNodeLocationFullRecovery = function(
                        cstNode
                    ) {
                        cstNode.location = {
                            startOffset: NaN,
                            startLine: NaN,
                            startColumn: NaN,
                            endOffset: NaN,
                            endLine: NaN,
                            endColumn: NaN
                        }
                    }
                    /**
     *  @see setInitialNodeLocationOnlyOffsetRegular for explanation why this work

     * @param cstNode
     */
                    TreeBuilder.prototype.setInitialNodeLocationFullRegular = function(
                        cstNode
                    ) {
                        var nextToken = this.LA(1)
                        cstNode.location = {
                            startOffset: nextToken.startOffset,
                            startLine: nextToken.startLine,
                            startColumn: nextToken.startColumn,
                            endOffset: NaN,
                            endLine: NaN,
                            endColumn: NaN
                        }
                    }
                    // CST
                    TreeBuilder.prototype.cstNestedInvocationStateUpdate = function(
                        nestedName,
                        shortName
                    ) {
                        var cstNode = {
                            name: nestedName,
                            fullName:
                                this.shortRuleNameToFull.get(
                                    this.getLastExplicitRuleShortName()
                                ) + nestedName,
                            children: {}
                        }
                        this.setInitialNodeLocation(cstNode)
                        this.CST_STACK.push(cstNode)
                    }
                    TreeBuilder.prototype.cstInvocationStateUpdate = function(
                        fullRuleName,
                        shortName
                    ) {
                        this.LAST_EXPLICIT_RULE_STACK.push(
                            this.RULE_STACK.length - 1
                        )
                        var cstNode = {
                            name: fullRuleName,
                            children: {}
                        }
                        this.setInitialNodeLocation(cstNode)
                        this.CST_STACK.push(cstNode)
                    }
                    TreeBuilder.prototype.cstFinallyStateUpdate = function() {
                        this.LAST_EXPLICIT_RULE_STACK.pop()
                        this.CST_STACK.pop()
                    }
                    TreeBuilder.prototype.cstNestedFinallyStateUpdate = function() {
                        var lastCstNode = this.CST_STACK.pop()
                        // TODO: the naming is bad, this should go directly to the
                        //       (correct) cstLocation update method
                        //       e.g if we put other logic in postRule...
                        this.cstPostRule(lastCstNode)
                    }
                    TreeBuilder.prototype.cstPostRuleFull = function(
                        ruleCstNode
                    ) {
                        var prevToken = this.LA(0)
                        var loc = ruleCstNode.location
                        // If this condition is true it means we consumed at least one Token
                        // In this CstNode or its nested children.
                        if (loc.startOffset <= prevToken.startOffset === true) {
                            loc.endOffset = prevToken.endOffset
                            loc.endLine = prevToken.endLine
                            loc.endColumn = prevToken.endColumn
                        }
                        // "empty" CstNode edge case
                        else {
                            loc.startOffset = NaN
                            loc.startLine = NaN
                            loc.startColumn = NaN
                        }
                    }
                    TreeBuilder.prototype.cstPostRuleOnlyOffset = function(
                        ruleCstNode
                    ) {
                        var prevToken = this.LA(0)
                        var loc = ruleCstNode.location
                        // If this condition is true it means we consumed at least one Token
                        // In this CstNode or its nested children.
                        if (loc.startOffset <= prevToken.startOffset === true) {
                            loc.endOffset = prevToken.endOffset
                        }
                        // "empty" CstNode edge case
                        else {
                            loc.startOffset = NaN
                        }
                    }
                    TreeBuilder.prototype.cstPostTerminal = function(
                        key,
                        consumedToken
                    ) {
                        var rootCst = this.CST_STACK[this.CST_STACK.length - 1]
                        cst_1.addTerminalToCst(rootCst, consumedToken, key)
                        // This is only used when **both** error recovery and CST Output are enabled.
                        this.setNodeLocationFromToken(
                            rootCst.location,
                            consumedToken
                        )
                    }
                    TreeBuilder.prototype.cstPostNonTerminal = function(
                        ruleCstResult,
                        ruleName
                    ) {
                        var node = this.CST_STACK[this.CST_STACK.length - 1]
                        cst_1.addNoneTerminalToCst(
                            node,
                            ruleName,
                            ruleCstResult
                        )
                        // This is only used when **both** error recovery and CST Output are enabled.
                        this.setNodeLocationFromNode(
                            node.location,
                            ruleCstResult.location
                        )
                    }
                    TreeBuilder.prototype.getBaseCstVisitorConstructor = function() {
                        if (
                            utils_1.isUndefined(this.baseCstVisitorConstructor)
                        ) {
                            var newBaseCstVisitorConstructor = cst_visitor_1.createBaseSemanticVisitorConstructor(
                                this.className,
                                this.allRuleNames
                            )
                            this.baseCstVisitorConstructor = newBaseCstVisitorConstructor
                            return newBaseCstVisitorConstructor
                        }
                        return this.baseCstVisitorConstructor
                    }
                    TreeBuilder.prototype.getBaseCstVisitorConstructorWithDefaults = function() {
                        if (
                            utils_1.isUndefined(
                                this.baseCstVisitorWithDefaultsConstructor
                            )
                        ) {
                            var newConstructor = cst_visitor_1.createBaseVisitorConstructorWithDefaults(
                                this.className,
                                this.allRuleNames,
                                this.getBaseCstVisitorConstructor()
                            )
                            this.baseCstVisitorWithDefaultsConstructor = newConstructor
                            return newConstructor
                        }
                        return this.baseCstVisitorWithDefaultsConstructor
                    }
                    TreeBuilder.prototype.nestedRuleBeforeClause = function(
                        methodOpts,
                        laKey
                    ) {
                        var nestedName
                        if (methodOpts.NAME !== undefined) {
                            nestedName = methodOpts.NAME
                            this.nestedRuleInvocationStateUpdate(
                                nestedName,
                                laKey
                            )
                            return nestedName
                        } else {
                            return undefined
                        }
                    }
                    TreeBuilder.prototype.nestedAltBeforeClause = function(
                        methodOpts,
                        occurrence,
                        methodKeyIdx,
                        altIdx
                    ) {
                        var ruleIdx = this.getLastExplicitRuleShortName()
                        var shortName = keys_1.getKeyForAltIndex(
                            ruleIdx,
                            methodKeyIdx,
                            occurrence,
                            altIdx
                        )
                        var nestedName
                        if (methodOpts.NAME !== undefined) {
                            nestedName = methodOpts.NAME
                            this.nestedRuleInvocationStateUpdate(
                                nestedName,
                                shortName
                            )
                            return {
                                shortName: shortName,
                                nestedName: nestedName
                            }
                        } else {
                            return undefined
                        }
                    }
                    TreeBuilder.prototype.nestedRuleFinallyClause = function(
                        laKey,
                        nestedName
                    ) {
                        var cstStack = this.CST_STACK
                        var nestedRuleCst = cstStack[cstStack.length - 1]
                        this.nestedRuleFinallyStateUpdate()
                        // this return a different result than the previous invocation because "nestedRuleFinallyStateUpdate" pops the cst stack
                        var parentCstNode = cstStack[cstStack.length - 1]
                        cst_1.addNoneTerminalToCst(
                            parentCstNode,
                            nestedName,
                            nestedRuleCst
                        )
                        this.setNodeLocationFromNode(
                            parentCstNode.location,
                            nestedRuleCst.location
                        )
                    }
                    TreeBuilder.prototype.getLastExplicitRuleShortName = function() {
                        var lastExplictIndex = this.LAST_EXPLICIT_RULE_STACK[
                            this.LAST_EXPLICIT_RULE_STACK.length - 1
                        ]
                        return this.RULE_STACK[lastExplictIndex]
                    }
                    TreeBuilder.prototype.getLastExplicitRuleShortNameNoCst = function() {
                        var ruleStack = this.RULE_STACK
                        return ruleStack[ruleStack.length - 1]
                    }
                    TreeBuilder.prototype.getPreviousExplicitRuleShortName = function() {
                        var lastExplicitIndex = this.LAST_EXPLICIT_RULE_STACK[
                            this.LAST_EXPLICIT_RULE_STACK.length - 2
                        ]
                        return this.RULE_STACK[lastExplicitIndex]
                    }
                    TreeBuilder.prototype.getPreviousExplicitRuleShortNameNoCst = function() {
                        var ruleStack = this.RULE_STACK
                        return ruleStack[ruleStack.length - 2]
                    }
                    TreeBuilder.prototype.getLastExplicitRuleOccurrenceIndex = function() {
                        var lastExplicitIndex = this.LAST_EXPLICIT_RULE_STACK[
                            this.LAST_EXPLICIT_RULE_STACK.length - 1
                        ]
                        return this.RULE_OCCURRENCE_STACK[lastExplicitIndex]
                    }
                    TreeBuilder.prototype.getLastExplicitRuleOccurrenceIndexNoCst = function() {
                        var occurrenceStack = this.RULE_OCCURRENCE_STACK
                        return occurrenceStack[occurrenceStack.length - 1]
                    }
                    TreeBuilder.prototype.nestedRuleInvocationStateUpdate = function(
                        nestedRuleName,
                        shortNameKey
                    ) {
                        this.RULE_OCCURRENCE_STACK.push(1)
                        this.RULE_STACK.push(shortNameKey)
                        this.cstNestedInvocationStateUpdate(
                            nestedRuleName,
                            shortNameKey
                        )
                    }
                    TreeBuilder.prototype.nestedRuleFinallyStateUpdate = function() {
                        this.RULE_STACK.pop()
                        this.RULE_OCCURRENCE_STACK.pop()
                        // NOOP when cst is disabled
                        this.cstNestedFinallyStateUpdate()
                    }
                    return TreeBuilder
                })()
                exports.TreeBuilder = TreeBuilder
                //# sourceMappingURL=tree_builder.js.map

                /***/
            },
            /* 33 */
            /***/ function(module, exports, __webpack_require__) {
                "use strict"

                Object.defineProperty(exports, "__esModule", { value: true })
                var utils_1 = __webpack_require__(0)
                var lang_extensions_1 = __webpack_require__(4)
                var checks_1 = __webpack_require__(11)
                function defaultVisit(ctx, param) {
                    var childrenNames = utils_1.keys(ctx)
                    var childrenNamesLength = childrenNames.length
                    for (var i = 0; i < childrenNamesLength; i++) {
                        var currChildName = childrenNames[i]
                        var currChildArray = ctx[currChildName]
                        var currChildArrayLength = currChildArray.length
                        for (var j = 0; j < currChildArrayLength; j++) {
                            var currChild = currChildArray[j]
                            // distinction between Tokens Children and CstNode children
                            if (currChild.tokenTypeIdx === undefined) {
                                if (currChild.fullName !== undefined) {
                                    this[currChild.fullName](
                                        currChild.children,
                                        param
                                    )
                                } else {
                                    this[currChild.name](
                                        currChild.children,
                                        param
                                    )
                                }
                            }
                        }
                    }
                    // defaultVisit does not support generic out param
                    return undefined
                }
                exports.defaultVisit = defaultVisit
                function createBaseSemanticVisitorConstructor(
                    grammarName,
                    ruleNames
                ) {
                    var derivedConstructor = function() {}
                    // can be overwritten according to:
                    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/
                    // name?redirectlocale=en-US&redirectslug=JavaScript%2FReference%2FGlobal_Objects%2FFunction%2Fname
                    lang_extensions_1.defineNameProp(
                        derivedConstructor,
                        grammarName + "BaseSemantics"
                    )
                    var semanticProto = {
                        visit: function(cstNode, param) {
                            // enables writing more concise visitor methods when CstNode has only a single child
                            if (utils_1.isArray(cstNode)) {
                                // A CST Node's children dictionary can never have empty arrays as values
                                // If a key is defined there will be at least one element in the corresponding value array.
                                cstNode = cstNode[0]
                            }
                            // enables passing optional CstNodes concisely.
                            if (utils_1.isUndefined(cstNode)) {
                                return undefined
                            }
                            if (cstNode.fullName !== undefined) {
                                return this[cstNode.fullName](
                                    cstNode.children,
                                    param
                                )
                            } else {
                                return this[cstNode.name](
                                    cstNode.children,
                                    param
                                )
                            }
                        },
                        validateVisitor: function() {
                            var semanticDefinitionErrors = validateVisitor(
                                this,
                                ruleNames
                            )
                            if (!utils_1.isEmpty(semanticDefinitionErrors)) {
                                var errorMessages = utils_1.map(
                                    semanticDefinitionErrors,
                                    function(currDefError) {
                                        return currDefError.msg
                                    }
                                )
                                throw Error(
                                    "Errors Detected in CST Visitor <" +
                                        lang_extensions_1.functionName(
                                            this.constructor
                                        ) +
                                        ">:\n\t" +
                                        ("" +
                                            errorMessages
                                                .join("\n\n")
                                                .replace(/\n/g, "\n\t"))
                                )
                            }
                        }
                    }
                    derivedConstructor.prototype = semanticProto
                    derivedConstructor.prototype.constructor = derivedConstructor
                    derivedConstructor._RULE_NAMES = ruleNames
                    return derivedConstructor
                }
                exports.createBaseSemanticVisitorConstructor = createBaseSemanticVisitorConstructor
                function createBaseVisitorConstructorWithDefaults(
                    grammarName,
                    ruleNames,
                    baseConstructor
                ) {
                    var derivedConstructor = function() {}
                    // can be overwritten according to:
                    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/
                    // name?redirectlocale=en-US&redirectslug=JavaScript%2FReference%2FGlobal_Objects%2FFunction%2Fname
                    lang_extensions_1.defineNameProp(
                        derivedConstructor,
                        grammarName + "BaseSemanticsWithDefaults"
                    )
                    var withDefaultsProto = Object.create(
                        baseConstructor.prototype
                    )
                    utils_1.forEach(ruleNames, function(ruleName) {
                        withDefaultsProto[ruleName] = defaultVisit
                    })
                    derivedConstructor.prototype = withDefaultsProto
                    derivedConstructor.prototype.constructor = derivedConstructor
                    return derivedConstructor
                }
                exports.createBaseVisitorConstructorWithDefaults = createBaseVisitorConstructorWithDefaults
                var CstVisitorDefinitionError
                ;(function(CstVisitorDefinitionError) {
                    CstVisitorDefinitionError[
                        (CstVisitorDefinitionError["REDUNDANT_METHOD"] = 0)
                    ] = "REDUNDANT_METHOD"
                    CstVisitorDefinitionError[
                        (CstVisitorDefinitionError["MISSING_METHOD"] = 1)
                    ] = "MISSING_METHOD"
                })(
                    (CstVisitorDefinitionError =
                        exports.CstVisitorDefinitionError ||
                        (exports.CstVisitorDefinitionError = {}))
                )
                function validateVisitor(visitorInstance, ruleNames) {
                    var missingErrors = validateMissingCstMethods(
                        visitorInstance,
                        ruleNames
                    )
                    var redundantErrors = validateRedundantMethods(
                        visitorInstance,
                        ruleNames
                    )
                    return missingErrors.concat(redundantErrors)
                }
                exports.validateVisitor = validateVisitor
                function validateMissingCstMethods(visitorInstance, ruleNames) {
                    var errors = utils_1.map(ruleNames, function(currRuleName) {
                        if (
                            !utils_1.isFunction(visitorInstance[currRuleName])
                        ) {
                            return {
                                msg:
                                    "Missing visitor method: <" +
                                    currRuleName +
                                    "> on " +
                                    lang_extensions_1.functionName(
                                        visitorInstance.constructor
                                    ) +
                                    " CST Visitor.",
                                type: CstVisitorDefinitionError.MISSING_METHOD,
                                methodName: currRuleName
                            }
                        }
                    })
                    return utils_1.compact(errors)
                }
                exports.validateMissingCstMethods = validateMissingCstMethods
                var VALID_PROP_NAMES = [
                    "constructor",
                    "visit",
                    "validateVisitor"
                ]
                function validateRedundantMethods(visitorInstance, ruleNames) {
                    var errors = []
                    for (var prop in visitorInstance) {
                        if (
                            checks_1.validTermsPattern.test(prop) &&
                            utils_1.isFunction(visitorInstance[prop]) &&
                            !utils_1.contains(VALID_PROP_NAMES, prop) &&
                            !utils_1.contains(ruleNames, prop)
                        ) {
                            errors.push({
                                msg:
                                    "Redundant visitor method: <" +
                                    prop +
                                    "> on " +
                                    lang_extensions_1.functionName(
                                        visitorInstance.constructor
                                    ) +
                                    " CST Visitor\n" +
                                    "There is no Grammar Rule corresponding to this method's name.\n" +
                                    ("For utility methods on visitor classes use methods names that do not match /" +
                                        checks_1.validTermsPattern.source +
                                        "/."),
                                type:
                                    CstVisitorDefinitionError.REDUNDANT_METHOD,
                                methodName: prop
                            })
                        }
                    }
                    return errors
                }
                exports.validateRedundantMethods = validateRedundantMethods
                //# sourceMappingURL=cst_visitor.js.map

                /***/
            },
            /* 34 */
            /***/ function(module, exports, __webpack_require__) {
                "use strict"

                Object.defineProperty(exports, "__esModule", { value: true })
                var parser_1 = __webpack_require__(3)
                /**
                 * Trait responsible abstracting over the interaction with Lexer output (Token vector).
                 *
                 * This could be generalized to support other kinds of lexers, e.g.
                 * - Just in Time Lexing / Lexer-Less parsing.
                 * - Streaming Lexer.
                 */
                var LexerAdapter = /** @class */ (function() {
                    function LexerAdapter() {}
                    LexerAdapter.prototype.initLexerAdapter = function() {
                        this.tokVector = []
                        this.tokVectorLength = 0
                        this.currIdx = -1
                    }
                    Object.defineProperty(LexerAdapter.prototype, "input", {
                        get: function() {
                            return this.tokVector
                        },
                        set: function(newInput) {
                            this.reset()
                            this.tokVector = newInput
                            this.tokVectorLength = newInput.length
                        },
                        enumerable: true,
                        configurable: true
                    })
                    // skips a token and returns the next token
                    LexerAdapter.prototype.SKIP_TOKEN = function() {
                        if (this.currIdx <= this.tokVector.length - 2) {
                            this.consumeToken()
                            return this.LA(1)
                        } else {
                            return parser_1.END_OF_FILE
                        }
                    }
                    // Lexer (accessing Token vector) related methods which can be overridden to implement lazy lexers
                    // or lexers dependent on parser context.
                    LexerAdapter.prototype.LA = function(howMuch) {
                        // does: is this optimization (saving tokVectorLength benefits?)
                        if (
                            this.currIdx + howMuch < 0 ||
                            this.tokVectorLength <= this.currIdx + howMuch
                        ) {
                            return parser_1.END_OF_FILE
                        } else {
                            return this.tokVector[this.currIdx + howMuch]
                        }
                    }
                    LexerAdapter.prototype.consumeToken = function() {
                        this.currIdx++
                    }
                    LexerAdapter.prototype.exportLexerState = function() {
                        return this.currIdx
                    }
                    LexerAdapter.prototype.importLexerState = function(
                        newState
                    ) {
                        this.currIdx = newState
                    }
                    LexerAdapter.prototype.resetLexerState = function() {
                        this.currIdx = -1
                    }
                    LexerAdapter.prototype.moveToTerminatedState = function() {
                        this.currIdx = this.tokVector.length - 1
                    }
                    LexerAdapter.prototype.getLexerPosition = function() {
                        return this.exportLexerState()
                    }
                    return LexerAdapter
                })()
                exports.LexerAdapter = LexerAdapter
                //# sourceMappingURL=lexer_adapter.js.map

                /***/
            },
            /* 35 */
            /***/ function(module, exports, __webpack_require__) {
                "use strict"

                Object.defineProperty(exports, "__esModule", { value: true })
                var utils_1 = __webpack_require__(0)
                var exceptions_public_1 = __webpack_require__(6)
                var parser_1 = __webpack_require__(3)
                var errors_public_1 = __webpack_require__(10)
                var gast_builder_1 = __webpack_require__(23)
                var checks_1 = __webpack_require__(11)
                var gast_public_1 = __webpack_require__(1)
                /**
                 * This trait is responsible for implementing the offical API
                 * for defining Chevrotain parsers, i.e:
                 * - CONSUME
                 * - RULE
                 * - OPTION
                 * - ...
                 */
                var RecognizerApi = /** @class */ (function() {
                    function RecognizerApi() {}
                    RecognizerApi.prototype.CONSUME = function(
                        tokType,
                        options
                    ) {
                        return this.consumeInternal(tokType, 0, options)
                    }
                    RecognizerApi.prototype.CONSUME1 = function(
                        tokType,
                        options
                    ) {
                        return this.consumeInternal(tokType, 1, options)
                    }
                    RecognizerApi.prototype.CONSUME2 = function(
                        tokType,
                        options
                    ) {
                        return this.consumeInternal(tokType, 2, options)
                    }
                    RecognizerApi.prototype.CONSUME3 = function(
                        tokType,
                        options
                    ) {
                        return this.consumeInternal(tokType, 3, options)
                    }
                    RecognizerApi.prototype.CONSUME4 = function(
                        tokType,
                        options
                    ) {
                        return this.consumeInternal(tokType, 4, options)
                    }
                    RecognizerApi.prototype.CONSUME5 = function(
                        tokType,
                        options
                    ) {
                        return this.consumeInternal(tokType, 5, options)
                    }
                    RecognizerApi.prototype.CONSUME6 = function(
                        tokType,
                        options
                    ) {
                        return this.consumeInternal(tokType, 6, options)
                    }
                    RecognizerApi.prototype.CONSUME7 = function(
                        tokType,
                        options
                    ) {
                        return this.consumeInternal(tokType, 7, options)
                    }
                    RecognizerApi.prototype.CONSUME8 = function(
                        tokType,
                        options
                    ) {
                        return this.consumeInternal(tokType, 8, options)
                    }
                    RecognizerApi.prototype.CONSUME9 = function(
                        tokType,
                        options
                    ) {
                        return this.consumeInternal(tokType, 9, options)
                    }
                    RecognizerApi.prototype.SUBRULE = function(
                        ruleToCall,
                        options
                    ) {
                        return this.subruleInternal(ruleToCall, 0, options)
                    }
                    RecognizerApi.prototype.SUBRULE1 = function(
                        ruleToCall,
                        options
                    ) {
                        return this.subruleInternal(ruleToCall, 1, options)
                    }
                    RecognizerApi.prototype.SUBRULE2 = function(
                        ruleToCall,
                        options
                    ) {
                        return this.subruleInternal(ruleToCall, 2, options)
                    }
                    RecognizerApi.prototype.SUBRULE3 = function(
                        ruleToCall,
                        options
                    ) {
                        return this.subruleInternal(ruleToCall, 3, options)
                    }
                    RecognizerApi.prototype.SUBRULE4 = function(
                        ruleToCall,
                        options
                    ) {
                        return this.subruleInternal(ruleToCall, 4, options)
                    }
                    RecognizerApi.prototype.SUBRULE5 = function(
                        ruleToCall,
                        options
                    ) {
                        return this.subruleInternal(ruleToCall, 5, options)
                    }
                    RecognizerApi.prototype.SUBRULE6 = function(
                        ruleToCall,
                        options
                    ) {
                        return this.subruleInternal(ruleToCall, 6, options)
                    }
                    RecognizerApi.prototype.SUBRULE7 = function(
                        ruleToCall,
                        options
                    ) {
                        return this.subruleInternal(ruleToCall, 7, options)
                    }
                    RecognizerApi.prototype.SUBRULE8 = function(
                        ruleToCall,
                        options
                    ) {
                        return this.subruleInternal(ruleToCall, 8, options)
                    }
                    RecognizerApi.prototype.SUBRULE9 = function(
                        ruleToCall,
                        options
                    ) {
                        return this.subruleInternal(ruleToCall, 9, options)
                    }
                    RecognizerApi.prototype.OPTION = function(
                        actionORMethodDef
                    ) {
                        return this.optionInternal(actionORMethodDef, 0)
                    }
                    RecognizerApi.prototype.OPTION1 = function(
                        actionORMethodDef
                    ) {
                        return this.optionInternal(actionORMethodDef, 1)
                    }
                    RecognizerApi.prototype.OPTION2 = function(
                        actionORMethodDef
                    ) {
                        return this.optionInternal(actionORMethodDef, 2)
                    }
                    RecognizerApi.prototype.OPTION3 = function(
                        actionORMethodDef
                    ) {
                        return this.optionInternal(actionORMethodDef, 3)
                    }
                    RecognizerApi.prototype.OPTION4 = function(
                        actionORMethodDef
                    ) {
                        return this.optionInternal(actionORMethodDef, 4)
                    }
                    RecognizerApi.prototype.OPTION5 = function(
                        actionORMethodDef
                    ) {
                        return this.optionInternal(actionORMethodDef, 5)
                    }
                    RecognizerApi.prototype.OPTION6 = function(
                        actionORMethodDef
                    ) {
                        return this.optionInternal(actionORMethodDef, 6)
                    }
                    RecognizerApi.prototype.OPTION7 = function(
                        actionORMethodDef
                    ) {
                        return this.optionInternal(actionORMethodDef, 7)
                    }
                    RecognizerApi.prototype.OPTION8 = function(
                        actionORMethodDef
                    ) {
                        return this.optionInternal(actionORMethodDef, 8)
                    }
                    RecognizerApi.prototype.OPTION9 = function(
                        actionORMethodDef
                    ) {
                        return this.optionInternal(actionORMethodDef, 9)
                    }
                    RecognizerApi.prototype.OR = function(altsOrOpts) {
                        return this.orInternal(altsOrOpts, 0)
                    }
                    RecognizerApi.prototype.OR1 = function(altsOrOpts) {
                        return this.orInternal(altsOrOpts, 1)
                    }
                    RecognizerApi.prototype.OR2 = function(altsOrOpts) {
                        return this.orInternal(altsOrOpts, 2)
                    }
                    RecognizerApi.prototype.OR3 = function(altsOrOpts) {
                        return this.orInternal(altsOrOpts, 3)
                    }
                    RecognizerApi.prototype.OR4 = function(altsOrOpts) {
                        return this.orInternal(altsOrOpts, 4)
                    }
                    RecognizerApi.prototype.OR5 = function(altsOrOpts) {
                        return this.orInternal(altsOrOpts, 5)
                    }
                    RecognizerApi.prototype.OR6 = function(altsOrOpts) {
                        return this.orInternal(altsOrOpts, 6)
                    }
                    RecognizerApi.prototype.OR7 = function(altsOrOpts) {
                        return this.orInternal(altsOrOpts, 7)
                    }
                    RecognizerApi.prototype.OR8 = function(altsOrOpts) {
                        return this.orInternal(altsOrOpts, 8)
                    }
                    RecognizerApi.prototype.OR9 = function(altsOrOpts) {
                        return this.orInternal(altsOrOpts, 9)
                    }
                    RecognizerApi.prototype.MANY = function(actionORMethodDef) {
                        this.manyInternal(0, actionORMethodDef)
                    }
                    RecognizerApi.prototype.MANY1 = function(
                        actionORMethodDef
                    ) {
                        this.manyInternal(1, actionORMethodDef)
                    }
                    RecognizerApi.prototype.MANY2 = function(
                        actionORMethodDef
                    ) {
                        this.manyInternal(2, actionORMethodDef)
                    }
                    RecognizerApi.prototype.MANY3 = function(
                        actionORMethodDef
                    ) {
                        this.manyInternal(3, actionORMethodDef)
                    }
                    RecognizerApi.prototype.MANY4 = function(
                        actionORMethodDef
                    ) {
                        this.manyInternal(4, actionORMethodDef)
                    }
                    RecognizerApi.prototype.MANY5 = function(
                        actionORMethodDef
                    ) {
                        this.manyInternal(5, actionORMethodDef)
                    }
                    RecognizerApi.prototype.MANY6 = function(
                        actionORMethodDef
                    ) {
                        this.manyInternal(6, actionORMethodDef)
                    }
                    RecognizerApi.prototype.MANY7 = function(
                        actionORMethodDef
                    ) {
                        this.manyInternal(7, actionORMethodDef)
                    }
                    RecognizerApi.prototype.MANY8 = function(
                        actionORMethodDef
                    ) {
                        this.manyInternal(8, actionORMethodDef)
                    }
                    RecognizerApi.prototype.MANY9 = function(
                        actionORMethodDef
                    ) {
                        this.manyInternal(9, actionORMethodDef)
                    }
                    RecognizerApi.prototype.MANY_SEP = function(options) {
                        this.manySepFirstInternal(0, options)
                    }
                    RecognizerApi.prototype.MANY_SEP1 = function(options) {
                        this.manySepFirstInternal(1, options)
                    }
                    RecognizerApi.prototype.MANY_SEP2 = function(options) {
                        this.manySepFirstInternal(2, options)
                    }
                    RecognizerApi.prototype.MANY_SEP3 = function(options) {
                        this.manySepFirstInternal(3, options)
                    }
                    RecognizerApi.prototype.MANY_SEP4 = function(options) {
                        this.manySepFirstInternal(4, options)
                    }
                    RecognizerApi.prototype.MANY_SEP5 = function(options) {
                        this.manySepFirstInternal(5, options)
                    }
                    RecognizerApi.prototype.MANY_SEP6 = function(options) {
                        this.manySepFirstInternal(6, options)
                    }
                    RecognizerApi.prototype.MANY_SEP7 = function(options) {
                        this.manySepFirstInternal(7, options)
                    }
                    RecognizerApi.prototype.MANY_SEP8 = function(options) {
                        this.manySepFirstInternal(8, options)
                    }
                    RecognizerApi.prototype.MANY_SEP9 = function(options) {
                        this.manySepFirstInternal(9, options)
                    }
                    RecognizerApi.prototype.AT_LEAST_ONE = function(
                        actionORMethodDef
                    ) {
                        this.atLeastOneInternal(0, actionORMethodDef)
                    }
                    RecognizerApi.prototype.AT_LEAST_ONE1 = function(
                        actionORMethodDef
                    ) {
                        return this.atLeastOneInternal(1, actionORMethodDef)
                    }
                    RecognizerApi.prototype.AT_LEAST_ONE2 = function(
                        actionORMethodDef
                    ) {
                        this.atLeastOneInternal(2, actionORMethodDef)
                    }
                    RecognizerApi.prototype.AT_LEAST_ONE3 = function(
                        actionORMethodDef
                    ) {
                        this.atLeastOneInternal(3, actionORMethodDef)
                    }
                    RecognizerApi.prototype.AT_LEAST_ONE4 = function(
                        actionORMethodDef
                    ) {
                        this.atLeastOneInternal(4, actionORMethodDef)
                    }
                    RecognizerApi.prototype.AT_LEAST_ONE5 = function(
                        actionORMethodDef
                    ) {
                        this.atLeastOneInternal(5, actionORMethodDef)
                    }
                    RecognizerApi.prototype.AT_LEAST_ONE6 = function(
                        actionORMethodDef
                    ) {
                        this.atLeastOneInternal(6, actionORMethodDef)
                    }
                    RecognizerApi.prototype.AT_LEAST_ONE7 = function(
                        actionORMethodDef
                    ) {
                        this.atLeastOneInternal(7, actionORMethodDef)
                    }
                    RecognizerApi.prototype.AT_LEAST_ONE8 = function(
                        actionORMethodDef
                    ) {
                        this.atLeastOneInternal(8, actionORMethodDef)
                    }
                    RecognizerApi.prototype.AT_LEAST_ONE9 = function(
                        actionORMethodDef
                    ) {
                        this.atLeastOneInternal(9, actionORMethodDef)
                    }
                    RecognizerApi.prototype.AT_LEAST_ONE_SEP = function(
                        options
                    ) {
                        this.atLeastOneSepFirstInternal(0, options)
                    }
                    RecognizerApi.prototype.AT_LEAST_ONE_SEP1 = function(
                        options
                    ) {
                        this.atLeastOneSepFirstInternal(1, options)
                    }
                    RecognizerApi.prototype.AT_LEAST_ONE_SEP2 = function(
                        options
                    ) {
                        this.atLeastOneSepFirstInternal(2, options)
                    }
                    RecognizerApi.prototype.AT_LEAST_ONE_SEP3 = function(
                        options
                    ) {
                        this.atLeastOneSepFirstInternal(3, options)
                    }
                    RecognizerApi.prototype.AT_LEAST_ONE_SEP4 = function(
                        options
                    ) {
                        this.atLeastOneSepFirstInternal(4, options)
                    }
                    RecognizerApi.prototype.AT_LEAST_ONE_SEP5 = function(
                        options
                    ) {
                        this.atLeastOneSepFirstInternal(5, options)
                    }
                    RecognizerApi.prototype.AT_LEAST_ONE_SEP6 = function(
                        options
                    ) {
                        this.atLeastOneSepFirstInternal(6, options)
                    }
                    RecognizerApi.prototype.AT_LEAST_ONE_SEP7 = function(
                        options
                    ) {
                        this.atLeastOneSepFirstInternal(7, options)
                    }
                    RecognizerApi.prototype.AT_LEAST_ONE_SEP8 = function(
                        options
                    ) {
                        this.atLeastOneSepFirstInternal(8, options)
                    }
                    RecognizerApi.prototype.AT_LEAST_ONE_SEP9 = function(
                        options
                    ) {
                        this.atLeastOneSepFirstInternal(9, options)
                    }
                    RecognizerApi.prototype.RULE = function(
                        name,
                        implementation,
                        // TODO: how to describe the optional return type of CSTNode? T|CstNode is not good because it is not backward
                        // compatible, T|any is very general...
                        config
                    ) {
                        if (config === void 0) {
                            config = parser_1.DEFAULT_RULE_CONFIG
                        }
                        if (utils_1.contains(this.definedRulesNames, name)) {
                            var errMsg = errors_public_1.defaultGrammarValidatorErrorProvider.buildDuplicateRuleNameError(
                                {
                                    topLevelRule: name,
                                    grammarName: this.className
                                }
                            )
                            var error = {
                                message: errMsg,
                                type:
                                    parser_1.ParserDefinitionErrorType
                                        .DUPLICATE_RULE_NAME,
                                ruleName: name
                            }
                            this.definitionErrors.push(error)
                        }
                        this.definedRulesNames.push(name)
                        // only build the gast representation once.
                        if (
                            !this.gastProductionsCache.containsKey(name) &&
                            !this.serializedGrammar
                        ) {
                            var gastProduction = gast_builder_1.buildTopProduction(
                                implementation.toString(),
                                name,
                                this.tokensMap
                            )
                            this.gastProductionsCache.put(name, gastProduction)
                        }
                        var ruleImplementation = this.defineRule(
                            name,
                            implementation,
                            config
                        )
                        this[name] = ruleImplementation
                        return ruleImplementation
                    }
                    RecognizerApi.prototype.OVERRIDE_RULE = function(
                        name,
                        impl,
                        config
                    ) {
                        if (config === void 0) {
                            config = parser_1.DEFAULT_RULE_CONFIG
                        }
                        var ruleErrors = []
                        ruleErrors = ruleErrors.concat(
                            checks_1.validateRuleIsOverridden(
                                name,
                                this.definedRulesNames,
                                this.className
                            )
                        )
                        this.definitionErrors.push.apply(
                            this.definitionErrors,
                            ruleErrors
                        ) // mutability for the win
                        // Avoid constructing the GAST if we have serialized it
                        if (!this.serializedGrammar) {
                            var gastProduction = gast_builder_1.buildTopProduction(
                                impl.toString(),
                                name,
                                this.tokensMap
                            )
                            this.gastProductionsCache.put(name, gastProduction)
                        }
                        var ruleImplementation = this.defineRule(
                            name,
                            impl,
                            config
                        )
                        this[name] = ruleImplementation
                        return ruleImplementation
                    }
                    RecognizerApi.prototype.BACKTRACK = function(
                        grammarRule,
                        args
                    ) {
                        return function() {
                            // save org state
                            this.isBackTrackingStack.push(1)
                            var orgState = this.saveRecogState()
                            try {
                                grammarRule.apply(this, args)
                                // if no exception was thrown we have succeed parsing the rule.
                                return true
                            } catch (e) {
                                if (
                                    exceptions_public_1.isRecognitionException(
                                        e
                                    )
                                ) {
                                    return false
                                } else {
                                    throw e
                                }
                            } finally {
                                this.reloadRecogState(orgState)
                                this.isBackTrackingStack.pop()
                            }
                        }
                    }
                    // GAST export APIs
                    RecognizerApi.prototype.getGAstProductions = function() {
                        return this.gastProductionsCache
                    }
                    RecognizerApi.prototype.getSerializedGastProductions = function() {
                        return gast_public_1.serializeGrammar(
                            this.gastProductionsCache.values()
                        )
                    }
                    return RecognizerApi
                })()
                exports.RecognizerApi = RecognizerApi
                //# sourceMappingURL=recognizer_api.js.map

                /***/
            },
            /* 36 */
            /***/ function(module, exports, __webpack_require__) {
                "use strict"

                Object.defineProperty(exports, "__esModule", { value: true })
                var utils_1 = __webpack_require__(0)
                var keys_1 = __webpack_require__(9)
                var exceptions_public_1 = __webpack_require__(6)
                var lookahead_1 = __webpack_require__(12)
                var interpreter_1 = __webpack_require__(13)
                var parser_1 = __webpack_require__(3)
                var recoverable_1 = __webpack_require__(25)
                var tokens_public_1 = __webpack_require__(2)
                var tokens_1 = __webpack_require__(7)
                var lang_extensions_1 = __webpack_require__(4)
                /**
                 * This trait is responsible for the runtime parsing engine
                 * Used by the official API (recognizer_api.ts)
                 */
                var RecognizerEngine = /** @class */ (function() {
                    function RecognizerEngine() {}
                    RecognizerEngine.prototype.initRecognizerEngine = function(
                        tokenVocabulary,
                        config
                    ) {
                        this.className = lang_extensions_1.classNameFromInstance(
                            this
                        )
                        // TODO: would using an ES6 Map or plain object be faster (CST building scenario)
                        this.shortRuleNameToFull = new lang_extensions_1.HashTable()
                        this.fullRuleNameToShort = new lang_extensions_1.HashTable()
                        this.ruleShortNameIdx = 256
                        this.tokenMatcher =
                            tokens_1.tokenStructuredMatcherNoCategories
                        this.definedRulesNames = []
                        this.tokensMap = {}
                        this.allRuleNames = []
                        this.isBackTrackingStack = []
                        this.RULE_STACK = []
                        this.RULE_OCCURRENCE_STACK = []
                        this.gastProductionsCache = new lang_extensions_1.HashTable()
                        this.serializedGrammar = utils_1.has(
                            config,
                            "serializedGrammar"
                        )
                            ? config.serializedGrammar
                            : parser_1.DEFAULT_PARSER_CONFIG.serializedGrammar
                        if (utils_1.isArray(tokenVocabulary)) {
                            // This only checks for Token vocabularies provided as arrays.
                            // That is good enough because the main objective is to detect users of pre-V4.0 APIs
                            // rather than all edge cases of empty Token vocabularies.
                            if (utils_1.isEmpty(tokenVocabulary)) {
                                throw Error(
                                    "A Token Vocabulary cannot be empty.\n" +
                                        "\tNote that the first argument for the parser constructor\n" +
                                        "\tis no longer a Token vector (since v4.0)."
                                )
                            }
                            if (
                                typeof tokenVocabulary[0].startOffset ===
                                "number"
                            ) {
                                throw Error(
                                    "The Parser constructor no longer accepts a token vector as the first argument.\n" +
                                        "\tSee: https://sap.github.io/chevrotain/docs/changes/BREAKING_CHANGES.html#_4-0-0\n" +
                                        "\tFor Further details."
                                )
                            }
                        }
                        if (utils_1.isArray(tokenVocabulary)) {
                            this.tokensMap = utils_1.reduce(
                                tokenVocabulary,
                                function(acc, tokenClazz) {
                                    acc[
                                        tokens_public_1.tokenName(tokenClazz)
                                    ] = tokenClazz
                                    return acc
                                },
                                {}
                            )
                        } else if (
                            utils_1.has(tokenVocabulary, "modes") &&
                            utils_1.every(
                                utils_1.flatten(
                                    utils_1.values(tokenVocabulary.modes)
                                ),
                                tokens_1.isTokenType
                            )
                        ) {
                            var allTokenTypes = utils_1.flatten(
                                utils_1.values(tokenVocabulary.modes)
                            )
                            var uniqueTokens = utils_1.uniq(allTokenTypes)
                            this.tokensMap = utils_1.reduce(
                                uniqueTokens,
                                function(acc, tokenClazz) {
                                    acc[
                                        tokens_public_1.tokenName(tokenClazz)
                                    ] = tokenClazz
                                    return acc
                                },
                                {}
                            )
                        } else if (utils_1.isObject(tokenVocabulary)) {
                            this.tokensMap = utils_1.cloneObj(tokenVocabulary)
                        } else {
                            throw new Error(
                                "<tokensDictionary> argument must be An Array of Token constructors," +
                                    " A dictionary of Token constructors or an IMultiModeLexerDefinition"
                            )
                        }
                        // always add EOF to the tokenNames -> constructors map. it is useful to assure all the input has been
                        // parsed with a clear error message ("expecting EOF but found ...")
                        /* tslint:disable */
                        this.tokensMap["EOF"] = tokens_public_1.EOF
                        // TODO: This check may not be accurate for multi mode lexers
                        var noTokenCategoriesUsed = utils_1.every(
                            utils_1.values(tokenVocabulary),
                            function(tokenConstructor) {
                                return utils_1.isEmpty(
                                    tokenConstructor.categoryMatches
                                )
                            }
                        )
                        this.tokenMatcher = noTokenCategoriesUsed
                            ? tokens_1.tokenStructuredMatcherNoCategories
                            : tokens_1.tokenStructuredMatcher
                        // Because ES2015+ syntax should be supported for creating Token classes
                        // We cannot assume that the Token classes were created using the "extendToken" utilities
                        // Therefore we must augment the Token classes both on Lexer initialization and on Parser initialization
                        tokens_1.augmentTokenTypes(
                            utils_1.values(this.tokensMap)
                        )
                    }
                    RecognizerEngine.prototype.defineRule = function(
                        ruleName,
                        impl,
                        config
                    ) {
                        if (this.selfAnalysisDone) {
                            throw Error(
                                "Grammar rule <" +
                                    ruleName +
                                    "> may not be defined after the 'performSelfAnalysis' method has been called'\n" +
                                    "Make sure that all grammar rule definitions are done before 'performSelfAnalysis' is called."
                            )
                        }
                        var resyncEnabled = utils_1.has(config, "resyncEnabled")
                            ? config.resyncEnabled
                            : parser_1.DEFAULT_RULE_CONFIG.resyncEnabled
                        var recoveryValueFunc = utils_1.has(
                            config,
                            "recoveryValueFunc"
                        )
                            ? config.recoveryValueFunc
                            : parser_1.DEFAULT_RULE_CONFIG.recoveryValueFunc
                        // performance optimization: Use small integers as keys for the longer human readable "full" rule names.
                        // this greatly improves Map access time (as much as 8% for some performance benchmarks).
                        /* tslint:disable */
                        var shortName =
                            this.ruleShortNameIdx <<
                            (keys_1.BITS_FOR_METHOD_IDX +
                                keys_1.BITS_FOR_OCCURRENCE_IDX)
                        /* tslint:enable */
                        this.ruleShortNameIdx++
                        this.shortRuleNameToFull.put(shortName, ruleName)
                        this.fullRuleNameToShort.put(ruleName, shortName)
                        function invokeRuleWithTry(args) {
                            try {
                                // TODO: dynamically get rid of this?
                                if (this.outputCst === true) {
                                    impl.apply(this, args)
                                    var cst = this.CST_STACK[
                                        this.CST_STACK.length - 1
                                    ]
                                    this.cstPostRule(cst)
                                    return cst
                                } else {
                                    return impl.apply(this, args)
                                }
                            } catch (e) {
                                var isFirstInvokedRule =
                                    this.RULE_STACK.length === 1
                                // note the reSync is always enabled for the first rule invocation, because we must always be able to
                                // reSync with EOF and just output some INVALID ParseTree
                                // during backtracking reSync recovery is disabled, otherwise we can't be certain the backtracking
                                // path is really the most valid one
                                var reSyncEnabled =
                                    resyncEnabled &&
                                    !this.isBackTracking() &&
                                    this.recoveryEnabled
                                if (
                                    exceptions_public_1.isRecognitionException(
                                        e
                                    )
                                ) {
                                    if (reSyncEnabled) {
                                        var reSyncTokType = this.findReSyncTokenType()
                                        if (
                                            this.isInCurrentRuleReSyncSet(
                                                reSyncTokType
                                            )
                                        ) {
                                            e.resyncedTokens = this.reSyncTo(
                                                reSyncTokType
                                            )
                                            if (this.outputCst) {
                                                var partialCstResult = this
                                                    .CST_STACK[
                                                    this.CST_STACK.length - 1
                                                ]
                                                partialCstResult.recoveredNode = true
                                                return partialCstResult
                                            } else {
                                                return recoveryValueFunc()
                                            }
                                        } else {
                                            if (this.outputCst) {
                                                var partialCstResult = this
                                                    .CST_STACK[
                                                    this.CST_STACK.length - 1
                                                ]
                                                partialCstResult.recoveredNode = true
                                                e.partialCstResult = partialCstResult
                                            }
                                            // to be handled Further up the call stack
                                            throw e
                                        }
                                    } else if (isFirstInvokedRule) {
                                        // otherwise a Redundant input error will be created as well and we cannot guarantee that this is indeed the case
                                        this.moveToTerminatedState()
                                        // the parser should never throw one of its own errors outside its flow.
                                        // even if error recovery is disabled
                                        return recoveryValueFunc()
                                    } else {
                                        // to be handled Further up the call stack
                                        throw e
                                    }
                                } else {
                                    // some other Error type which we don't know how to handle (for example a built in JavaScript Error)
                                    throw e
                                }
                            } finally {
                                this.ruleFinallyStateUpdate()
                            }
                        }
                        var wrappedGrammarRule
                        wrappedGrammarRule = function(idxInCallingRule, args) {
                            if (idxInCallingRule === void 0) {
                                idxInCallingRule = 0
                            }
                            this.ruleInvocationStateUpdate(
                                shortName,
                                ruleName,
                                idxInCallingRule
                            )
                            return invokeRuleWithTry.call(this, args)
                        }
                        var ruleNamePropName = "ruleName"
                        wrappedGrammarRule[ruleNamePropName] = ruleName
                        return wrappedGrammarRule
                    }
                    // Implementation of parsing DSL
                    RecognizerEngine.prototype.optionInternal = function(
                        actionORMethodDef,
                        occurrence
                    ) {
                        var key = this.getKeyForAutomaticLookahead(
                            keys_1.OPTION_IDX,
                            occurrence
                        )
                        var nestedName = this.nestedRuleBeforeClause(
                            actionORMethodDef,
                            key
                        )
                        try {
                            return this.optionInternalLogic(
                                actionORMethodDef,
                                occurrence,
                                key
                            )
                        } finally {
                            if (nestedName !== undefined) {
                                this.nestedRuleFinallyClause(key, nestedName)
                            }
                        }
                    }
                    RecognizerEngine.prototype.optionInternalNoCst = function(
                        actionORMethodDef,
                        occurrence
                    ) {
                        var key = this.getKeyForAutomaticLookahead(
                            keys_1.OPTION_IDX,
                            occurrence
                        )
                        return this.optionInternalLogic(
                            actionORMethodDef,
                            occurrence,
                            key
                        )
                    }
                    RecognizerEngine.prototype.optionInternalLogic = function(
                        actionORMethodDef,
                        occurrence,
                        key
                    ) {
                        var _this = this
                        var lookAheadFunc = this.getLookaheadFuncForOption(
                            key,
                            occurrence
                        )
                        var action
                        var predicate
                        if (actionORMethodDef.DEF !== undefined) {
                            action = actionORMethodDef.DEF
                            predicate = actionORMethodDef.GATE
                            // predicate present
                            if (predicate !== undefined) {
                                var orgLookaheadFunction_1 = lookAheadFunc
                                lookAheadFunc = function() {
                                    return (
                                        predicate.call(_this) &&
                                        orgLookaheadFunction_1.call(_this)
                                    )
                                }
                            }
                        } else {
                            action = actionORMethodDef
                        }
                        if (lookAheadFunc.call(this) === true) {
                            return action.call(this)
                        }
                        return undefined
                    }
                    RecognizerEngine.prototype.atLeastOneInternal = function(
                        prodOccurrence,
                        actionORMethodDef
                    ) {
                        var laKey = this.getKeyForAutomaticLookahead(
                            keys_1.AT_LEAST_ONE_IDX,
                            prodOccurrence
                        )
                        var nestedName = this.nestedRuleBeforeClause(
                            actionORMethodDef,
                            laKey
                        )
                        try {
                            return this.atLeastOneInternalLogic(
                                prodOccurrence,
                                actionORMethodDef,
                                laKey
                            )
                        } finally {
                            if (nestedName !== undefined) {
                                this.nestedRuleFinallyClause(laKey, nestedName)
                            }
                        }
                    }
                    RecognizerEngine.prototype.atLeastOneInternalNoCst = function(
                        prodOccurrence,
                        actionORMethodDef
                    ) {
                        var key = this.getKeyForAutomaticLookahead(
                            keys_1.AT_LEAST_ONE_IDX,
                            prodOccurrence
                        )
                        this.atLeastOneInternalLogic(
                            prodOccurrence,
                            actionORMethodDef,
                            key
                        )
                    }
                    RecognizerEngine.prototype.atLeastOneInternalLogic = function(
                        prodOccurrence,
                        actionORMethodDef,
                        key
                    ) {
                        var _this = this
                        var lookAheadFunc = this.getLookaheadFuncForAtLeastOne(
                            key,
                            prodOccurrence
                        )
                        var action
                        var predicate
                        if (actionORMethodDef.DEF !== undefined) {
                            action = actionORMethodDef.DEF
                            predicate = actionORMethodDef.GATE
                            // predicate present
                            if (predicate !== undefined) {
                                var orgLookaheadFunction_2 = lookAheadFunc
                                lookAheadFunc = function() {
                                    return (
                                        predicate.call(_this) &&
                                        orgLookaheadFunction_2.call(_this)
                                    )
                                }
                            }
                        } else {
                            action = actionORMethodDef
                        }
                        if (lookAheadFunc.call(this) === true) {
                            var notStuck = this.doSingleRepetition(action)
                            while (
                                lookAheadFunc.call(this) === true &&
                                notStuck === true
                            ) {
                                notStuck = this.doSingleRepetition(action)
                            }
                        } else {
                            throw this.raiseEarlyExitException(
                                prodOccurrence,
                                lookahead_1.PROD_TYPE.REPETITION_MANDATORY,
                                actionORMethodDef.ERR_MSG
                            )
                        }
                        // note that while it may seem that this can cause an error because by using a recursive call to
                        // AT_LEAST_ONE we change the grammar to AT_LEAST_TWO, AT_LEAST_THREE ... , the possible recursive call
                        // from the tryInRepetitionRecovery(...) will only happen IFF there really are TWO/THREE/.... items.
                        // Performance optimization: "attemptInRepetitionRecovery" will be defined as NOOP unless recovery is enabled
                        this.attemptInRepetitionRecovery(
                            this.atLeastOneInternal,
                            [prodOccurrence, actionORMethodDef],
                            lookAheadFunc,
                            keys_1.AT_LEAST_ONE_IDX,
                            prodOccurrence,
                            interpreter_1.NextTerminalAfterAtLeastOneWalker
                        )
                    }
                    RecognizerEngine.prototype.atLeastOneSepFirstInternal = function(
                        prodOccurrence,
                        options
                    ) {
                        var laKey = this.getKeyForAutomaticLookahead(
                            keys_1.AT_LEAST_ONE_SEP_IDX,
                            prodOccurrence
                        )
                        var nestedName = this.nestedRuleBeforeClause(
                            options,
                            laKey
                        )
                        try {
                            this.atLeastOneSepFirstInternalLogic(
                                prodOccurrence,
                                options,
                                laKey
                            )
                        } finally {
                            if (nestedName !== undefined) {
                                this.nestedRuleFinallyClause(laKey, nestedName)
                            }
                        }
                    }
                    RecognizerEngine.prototype.atLeastOneSepFirstInternalNoCst = function(
                        prodOccurrence,
                        options
                    ) {
                        var laKey = this.getKeyForAutomaticLookahead(
                            keys_1.AT_LEAST_ONE_SEP_IDX,
                            prodOccurrence
                        )
                        this.atLeastOneSepFirstInternalLogic(
                            prodOccurrence,
                            options,
                            laKey
                        )
                    }
                    RecognizerEngine.prototype.atLeastOneSepFirstInternalLogic = function(
                        prodOccurrence,
                        options,
                        key
                    ) {
                        var _this = this
                        var action = options.DEF
                        var separator = options.SEP
                        var firstIterationLookaheadFunc = this.getLookaheadFuncForAtLeastOneSep(
                            key,
                            prodOccurrence
                        )
                        // 1st iteration
                        if (firstIterationLookaheadFunc.call(this) === true) {
                            action.call(this)
                            //  TODO: Optimization can move this function construction into "attemptInRepetitionRecovery"
                            //  because it is only needed in error recovery scenarios.
                            var separatorLookAheadFunc = function() {
                                return _this.tokenMatcher(
                                    _this.LA(1),
                                    separator
                                )
                            }
                            // 2nd..nth iterations
                            while (
                                this.tokenMatcher(this.LA(1), separator) ===
                                true
                            ) {
                                // note that this CONSUME will never enter recovery because
                                // the separatorLookAheadFunc checks that the separator really does exist.
                                this.CONSUME(separator)
                                action.call(this)
                            }
                            // Performance optimization: "attemptInRepetitionRecovery" will be defined as NOOP unless recovery is enabled
                            this.attemptInRepetitionRecovery(
                                this.repetitionSepSecondInternal,
                                [
                                    prodOccurrence,
                                    separator,
                                    separatorLookAheadFunc,
                                    action,
                                    interpreter_1.NextTerminalAfterAtLeastOneSepWalker
                                ],
                                separatorLookAheadFunc,
                                keys_1.AT_LEAST_ONE_SEP_IDX,
                                prodOccurrence,
                                interpreter_1.NextTerminalAfterAtLeastOneSepWalker
                            )
                        } else {
                            throw this.raiseEarlyExitException(
                                prodOccurrence,
                                lookahead_1.PROD_TYPE
                                    .REPETITION_MANDATORY_WITH_SEPARATOR,
                                options.ERR_MSG
                            )
                        }
                    }
                    RecognizerEngine.prototype.manyInternal = function(
                        prodOccurrence,
                        actionORMethodDef
                    ) {
                        var laKey = this.getKeyForAutomaticLookahead(
                            keys_1.MANY_IDX,
                            prodOccurrence
                        )
                        var nestedName = this.nestedRuleBeforeClause(
                            actionORMethodDef,
                            laKey
                        )
                        try {
                            return this.manyInternalLogic(
                                prodOccurrence,
                                actionORMethodDef,
                                laKey
                            )
                        } finally {
                            if (nestedName !== undefined) {
                                this.nestedRuleFinallyClause(laKey, nestedName)
                            }
                        }
                    }
                    RecognizerEngine.prototype.manyInternalNoCst = function(
                        prodOccurrence,
                        actionORMethodDef
                    ) {
                        var laKey = this.getKeyForAutomaticLookahead(
                            keys_1.MANY_IDX,
                            prodOccurrence
                        )
                        return this.manyInternalLogic(
                            prodOccurrence,
                            actionORMethodDef,
                            laKey
                        )
                    }
                    RecognizerEngine.prototype.manyInternalLogic = function(
                        prodOccurrence,
                        actionORMethodDef,
                        key
                    ) {
                        var _this = this
                        var lookaheadFunction = this.getLookaheadFuncForMany(
                            key,
                            prodOccurrence
                        )
                        var action
                        var predicate
                        if (actionORMethodDef.DEF !== undefined) {
                            action = actionORMethodDef.DEF
                            predicate = actionORMethodDef.GATE
                            // predicate present
                            if (predicate !== undefined) {
                                var orgLookaheadFunction_3 = lookaheadFunction
                                lookaheadFunction = function() {
                                    return (
                                        predicate.call(_this) &&
                                        orgLookaheadFunction_3.call(_this)
                                    )
                                }
                            }
                        } else {
                            action = actionORMethodDef
                        }
                        var notStuck = true
                        while (
                            lookaheadFunction.call(this) === true &&
                            notStuck === true
                        ) {
                            notStuck = this.doSingleRepetition(action)
                        }
                        // Performance optimization: "attemptInRepetitionRecovery" will be defined as NOOP unless recovery is enabled
                        this.attemptInRepetitionRecovery(
                            this.manyInternal,
                            [prodOccurrence, actionORMethodDef],
                            lookaheadFunction,
                            keys_1.MANY_IDX,
                            prodOccurrence,
                            interpreter_1.NextTerminalAfterManyWalker,
                            // The notStuck parameter is only relevant when "attemptInRepetitionRecovery"
                            // is invoked from manyInternal, in the MANY_SEP case and AT_LEAST_ONE[_SEP]
                            // An infinite loop cannot occur as:
                            // - Either the lookahead is guaranteed to consume something (Single Token Separator)
                            // - AT_LEAST_ONE by definition is guaranteed to consume something (or error out).
                            notStuck
                        )
                    }
                    RecognizerEngine.prototype.manySepFirstInternal = function(
                        prodOccurrence,
                        options
                    ) {
                        var laKey = this.getKeyForAutomaticLookahead(
                            keys_1.MANY_SEP_IDX,
                            prodOccurrence
                        )
                        var nestedName = this.nestedRuleBeforeClause(
                            options,
                            laKey
                        )
                        try {
                            this.manySepFirstInternalLogic(
                                prodOccurrence,
                                options,
                                laKey
                            )
                        } finally {
                            if (nestedName !== undefined) {
                                this.nestedRuleFinallyClause(laKey, nestedName)
                            }
                        }
                    }
                    RecognizerEngine.prototype.manySepFirstInternalNoCst = function(
                        prodOccurrence,
                        options
                    ) {
                        var laKey = this.getKeyForAutomaticLookahead(
                            keys_1.MANY_SEP_IDX,
                            prodOccurrence
                        )
                        this.manySepFirstInternalLogic(
                            prodOccurrence,
                            options,
                            laKey
                        )
                    }
                    RecognizerEngine.prototype.manySepFirstInternalLogic = function(
                        prodOccurrence,
                        options,
                        key
                    ) {
                        var _this = this
                        var action = options.DEF
                        var separator = options.SEP
                        var firstIterationLaFunc = this.getLookaheadFuncForManySep(
                            key,
                            prodOccurrence
                        )
                        // 1st iteration
                        if (firstIterationLaFunc.call(this) === true) {
                            action.call(this)
                            var separatorLookAheadFunc = function() {
                                return _this.tokenMatcher(
                                    _this.LA(1),
                                    separator
                                )
                            }
                            // 2nd..nth iterations
                            while (
                                this.tokenMatcher(this.LA(1), separator) ===
                                true
                            ) {
                                // note that this CONSUME will never enter recovery because
                                // the separatorLookAheadFunc checks that the separator really does exist.
                                this.CONSUME(separator)
                                // No need for checking infinite loop here due to consuming the separator.
                                action.call(this)
                            }
                            // Performance optimization: "attemptInRepetitionRecovery" will be defined as NOOP unless recovery is enabled
                            this.attemptInRepetitionRecovery(
                                this.repetitionSepSecondInternal,
                                [
                                    prodOccurrence,
                                    separator,
                                    separatorLookAheadFunc,
                                    action,
                                    interpreter_1.NextTerminalAfterManySepWalker
                                ],
                                separatorLookAheadFunc,
                                keys_1.MANY_SEP_IDX,
                                prodOccurrence,
                                interpreter_1.NextTerminalAfterManySepWalker
                            )
                        }
                    }
                    RecognizerEngine.prototype.repetitionSepSecondInternal = function(
                        prodOccurrence,
                        separator,
                        separatorLookAheadFunc,
                        action,
                        nextTerminalAfterWalker
                    ) {
                        while (separatorLookAheadFunc()) {
                            // note that this CONSUME will never enter recovery because
                            // the separatorLookAheadFunc checks that the separator really does exist.
                            this.CONSUME(separator)
                            action.call(this)
                        }
                        // we can only arrive to this function after an error
                        // has occurred (hence the name 'second') so the following
                        // IF will always be entered, its possible to remove it...
                        // however it is kept to avoid confusion and be consistent.
                        // Performance optimization: "attemptInRepetitionRecovery" will be defined as NOOP unless recovery is enabled
                        /* istanbul ignore else */
                        this.attemptInRepetitionRecovery(
                            this.repetitionSepSecondInternal,
                            [
                                prodOccurrence,
                                separator,
                                separatorLookAheadFunc,
                                action,
                                nextTerminalAfterWalker
                            ],
                            separatorLookAheadFunc,
                            keys_1.AT_LEAST_ONE_SEP_IDX,
                            prodOccurrence,
                            nextTerminalAfterWalker
                        )
                    }
                    RecognizerEngine.prototype.doSingleRepetition = function(
                        action
                    ) {
                        var beforeIteration = this.getLexerPosition()
                        action.call(this)
                        var afterIteration = this.getLexerPosition()
                        // This boolean will indicate if this repetition progressed
                        // or if we are "stuck" (potential infinite loop in the repetition).
                        return afterIteration > beforeIteration
                    }
                    RecognizerEngine.prototype.orInternalNoCst = function(
                        altsOrOpts,
                        occurrence
                    ) {
                        var alts = utils_1.isArray(altsOrOpts)
                            ? altsOrOpts
                            : altsOrOpts.DEF
                        var laFunc = this.getLookaheadFuncForOr(
                            occurrence,
                            alts
                        )
                        var altIdxToTake = laFunc.call(this, alts)
                        if (altIdxToTake !== undefined) {
                            var chosenAlternative = alts[altIdxToTake]
                            return chosenAlternative.ALT.call(this)
                        }
                        this.raiseNoAltException(occurrence, altsOrOpts.ERR_MSG)
                    }
                    RecognizerEngine.prototype.orInternal = function(
                        altsOrOpts,
                        occurrence
                    ) {
                        var laKey = this.getKeyForAutomaticLookahead(
                            keys_1.OR_IDX,
                            occurrence
                        )
                        var nestedName = this.nestedRuleBeforeClause(
                            altsOrOpts,
                            laKey
                        )
                        try {
                            var alts = utils_1.isArray(altsOrOpts)
                                ? altsOrOpts
                                : altsOrOpts.DEF
                            var laFunc = this.getLookaheadFuncForOr(
                                occurrence,
                                alts
                            )
                            var altIdxToTake = laFunc.call(this, alts)
                            if (altIdxToTake !== undefined) {
                                var chosenAlternative = alts[altIdxToTake]
                                var nestedAltBeforeClauseResult = this.nestedAltBeforeClause(
                                    chosenAlternative,
                                    occurrence,
                                    keys_1.OR_IDX,
                                    altIdxToTake
                                )
                                try {
                                    return chosenAlternative.ALT.call(this)
                                } finally {
                                    if (
                                        nestedAltBeforeClauseResult !==
                                        undefined
                                    ) {
                                        this.nestedRuleFinallyClause(
                                            nestedAltBeforeClauseResult.shortName,
                                            nestedAltBeforeClauseResult.nestedName
                                        )
                                    }
                                }
                            }
                            this.raiseNoAltException(
                                occurrence,
                                altsOrOpts.ERR_MSG
                            )
                        } finally {
                            if (nestedName !== undefined) {
                                this.nestedRuleFinallyClause(laKey, nestedName)
                            }
                        }
                    }
                    RecognizerEngine.prototype.ruleFinallyStateUpdate = function() {
                        this.RULE_STACK.pop()
                        this.RULE_OCCURRENCE_STACK.pop()
                        // NOOP when cst is disabled
                        this.cstFinallyStateUpdate()
                        if (
                            this.RULE_STACK.length === 0 &&
                            !this.isAtEndOfInput()
                        ) {
                            var firstRedundantTok = this.LA(1)
                            var errMsg = this.errorMessageProvider.buildNotAllInputParsedMessage(
                                {
                                    firstRedundant: firstRedundantTok,
                                    ruleName: this.getCurrRuleFullName()
                                }
                            )
                            this.SAVE_ERROR(
                                new exceptions_public_1.NotAllInputParsedException(
                                    errMsg,
                                    firstRedundantTok
                                )
                            )
                        }
                    }
                    RecognizerEngine.prototype.subruleInternal = function(
                        ruleToCall,
                        idx,
                        options
                    ) {
                        var ruleResult
                        try {
                            var args =
                                options !== undefined ? options.ARGS : undefined
                            ruleResult = ruleToCall.call(this, idx, args)
                            this.cstPostNonTerminal(
                                ruleResult,
                                options !== undefined &&
                                    options.LABEL !== undefined
                                    ? options.LABEL
                                    : ruleToCall.ruleName
                            )
                            return ruleResult
                        } catch (e) {
                            if (
                                exceptions_public_1.isRecognitionException(e) &&
                                e.partialCstResult !== undefined
                            ) {
                                this.cstPostNonTerminal(
                                    e.partialCstResult,
                                    options !== undefined &&
                                        options.LABEL !== undefined
                                        ? options.LABEL
                                        : ruleToCall.ruleName
                                )
                                delete e.partialCstResult
                            }
                            throw e
                        }
                    }
                    RecognizerEngine.prototype.consumeInternal = function(
                        tokType,
                        idx,
                        options
                    ) {
                        var consumedToken
                        try {
                            var nextToken = this.LA(1)
                            if (
                                this.tokenMatcher(nextToken, tokType) === true
                            ) {
                                this.consumeToken()
                                consumedToken = nextToken
                            } else {
                                var msg = void 0
                                var previousToken = this.LA(0)
                                if (options !== undefined && options.ERR_MSG) {
                                    msg = options.ERR_MSG
                                } else {
                                    msg = this.errorMessageProvider.buildMismatchTokenMessage(
                                        {
                                            expected: tokType,
                                            actual: nextToken,
                                            previous: previousToken,
                                            ruleName: this.getCurrRuleFullName()
                                        }
                                    )
                                }
                                throw this.SAVE_ERROR(
                                    new exceptions_public_1.MismatchedTokenException(
                                        msg,
                                        nextToken,
                                        previousToken
                                    )
                                )
                            }
                        } catch (eFromConsumption) {
                            // no recovery allowed during backtracking, otherwise backtracking may recover invalid syntax and accept it
                            // but the original syntax could have been parsed successfully without any backtracking + recovery
                            if (
                                this.recoveryEnabled &&
                                // TODO: more robust checking of the exception type. Perhaps Typescript extending expressions?
                                eFromConsumption.name ===
                                    "MismatchedTokenException" &&
                                !this.isBackTracking()
                            ) {
                                var follows = this.getFollowsForInRuleRecovery(
                                    tokType,
                                    idx
                                )
                                try {
                                    consumedToken = this.tryInRuleRecovery(
                                        tokType,
                                        follows
                                    )
                                } catch (eFromInRuleRecovery) {
                                    if (
                                        eFromInRuleRecovery.name ===
                                        recoverable_1.IN_RULE_RECOVERY_EXCEPTION
                                    ) {
                                        // failed in RuleRecovery.
                                        // throw the original error in order to trigger reSync error recovery
                                        throw eFromConsumption
                                    } else {
                                        throw eFromInRuleRecovery
                                    }
                                }
                            } else {
                                throw eFromConsumption
                            }
                        }
                        this.cstPostTerminal(
                            options !== undefined && options.LABEL !== undefined
                                ? options.LABEL
                                : tokType.tokenName,
                            consumedToken
                        )
                        return consumedToken
                    }
                    RecognizerEngine.prototype.saveRecogState = function() {
                        // errors is a getter which will clone the errors array
                        var savedErrors = this.errors
                        var savedRuleStack = utils_1.cloneArr(this.RULE_STACK)
                        return {
                            errors: savedErrors,
                            lexerState: this.exportLexerState(),
                            RULE_STACK: savedRuleStack,
                            CST_STACK: this.CST_STACK,
                            LAST_EXPLICIT_RULE_STACK: this
                                .LAST_EXPLICIT_RULE_STACK
                        }
                    }
                    RecognizerEngine.prototype.reloadRecogState = function(
                        newState
                    ) {
                        this.errors = newState.errors
                        this.importLexerState(newState.lexerState)
                        this.RULE_STACK = newState.RULE_STACK
                    }
                    RecognizerEngine.prototype.ruleInvocationStateUpdate = function(
                        shortName,
                        fullName,
                        idxInCallingRule
                    ) {
                        this.RULE_OCCURRENCE_STACK.push(idxInCallingRule)
                        this.RULE_STACK.push(shortName)
                        // NOOP when cst is disabled
                        this.cstInvocationStateUpdate(fullName, shortName)
                    }
                    RecognizerEngine.prototype.isBackTracking = function() {
                        return !utils_1.isEmpty(this.isBackTrackingStack)
                    }
                    RecognizerEngine.prototype.getCurrRuleFullName = function() {
                        var shortName = this.getLastExplicitRuleShortName()
                        return this.shortRuleNameToFull.get(shortName)
                    }
                    RecognizerEngine.prototype.shortRuleNameToFullName = function(
                        shortName
                    ) {
                        return this.shortRuleNameToFull.get(shortName)
                    }
                    RecognizerEngine.prototype.isAtEndOfInput = function() {
                        return this.tokenMatcher(
                            this.LA(1),
                            tokens_public_1.EOF
                        )
                    }
                    RecognizerEngine.prototype.reset = function() {
                        this.resetLexerState()
                        this.isBackTrackingStack = []
                        this.errors = []
                        this.RULE_STACK = []
                        this.LAST_EXPLICIT_RULE_STACK = []
                        // TODO: extract a specific rest for TreeBuilder trait
                        this.CST_STACK = []
                        this.RULE_OCCURRENCE_STACK = []
                    }
                    return RecognizerEngine
                })()
                exports.RecognizerEngine = RecognizerEngine
                //# sourceMappingURL=recognizer_engine.js.map

                /***/
            },
            /* 37 */
            /***/ function(module, exports, __webpack_require__) {
                "use strict"

                Object.defineProperty(exports, "__esModule", { value: true })
                var exceptions_public_1 = __webpack_require__(6)
                var utils_1 = __webpack_require__(0)
                var lookahead_1 = __webpack_require__(12)
                var parser_1 = __webpack_require__(3)
                /**
                 * Trait responsible for runtime parsing errors.
                 */
                var ErrorHandler = /** @class */ (function() {
                    function ErrorHandler() {}
                    ErrorHandler.prototype.initErrorHandler = function(config) {
                        this._errors = []
                        this.errorMessageProvider = utils_1.defaults(
                            config.errorMessageProvider,
                            parser_1.DEFAULT_PARSER_CONFIG.errorMessageProvider
                        )
                    }
                    ErrorHandler.prototype.SAVE_ERROR = function(error) {
                        if (exceptions_public_1.isRecognitionException(error)) {
                            error.context = {
                                ruleStack: this.getHumanReadableRuleStack(),
                                ruleOccurrenceStack: utils_1.cloneArr(
                                    this.RULE_OCCURRENCE_STACK
                                )
                            }
                            this._errors.push(error)
                            return error
                        } else {
                            throw Error(
                                "Trying to save an Error which is not a RecognitionException"
                            )
                        }
                    }
                    Object.defineProperty(ErrorHandler.prototype, "errors", {
                        // TODO: extract these methods to ErrorHandler Trait?
                        get: function() {
                            return utils_1.cloneArr(this._errors)
                        },
                        set: function(newErrors) {
                            this._errors = newErrors
                        },
                        enumerable: true,
                        configurable: true
                    })
                    // TODO: consider caching the error message computed information
                    ErrorHandler.prototype.raiseEarlyExitException = function(
                        occurrence,
                        prodType,
                        userDefinedErrMsg
                    ) {
                        var ruleName = this.getCurrRuleFullName()
                        var ruleGrammar = this.getGAstProductions().get(
                            ruleName
                        )
                        var lookAheadPathsPerAlternative = lookahead_1.getLookaheadPathsForOptionalProd(
                            occurrence,
                            ruleGrammar,
                            prodType,
                            this.maxLookahead
                        )
                        var insideProdPaths = lookAheadPathsPerAlternative[0]
                        var actualTokens = []
                        for (var i = 1; i < this.maxLookahead; i++) {
                            actualTokens.push(this.LA(i))
                        }
                        var msg = this.errorMessageProvider.buildEarlyExitMessage(
                            {
                                expectedIterationPaths: insideProdPaths,
                                actual: actualTokens,
                                previous: this.LA(0),
                                customUserDescription: userDefinedErrMsg,
                                ruleName: ruleName
                            }
                        )
                        throw this.SAVE_ERROR(
                            new exceptions_public_1.EarlyExitException(
                                msg,
                                this.LA(1),
                                this.LA(0)
                            )
                        )
                    }
                    // TODO: consider caching the error message computed information
                    ErrorHandler.prototype.raiseNoAltException = function(
                        occurrence,
                        errMsgTypes
                    ) {
                        var ruleName = this.getCurrRuleFullName()
                        var ruleGrammar = this.getGAstProductions().get(
                            ruleName
                        )
                        // TODO: getLookaheadPathsForOr can be slow for large enough maxLookahead and certain grammars, consider caching ?
                        var lookAheadPathsPerAlternative = lookahead_1.getLookaheadPathsForOr(
                            occurrence,
                            ruleGrammar,
                            this.maxLookahead
                        )
                        var actualTokens = []
                        for (var i = 1; i <= this.maxLookahead; i++) {
                            actualTokens.push(this.LA(i))
                        }
                        var previousToken = this.LA(0)
                        var errMsg = this.errorMessageProvider.buildNoViableAltMessage(
                            {
                                expectedPathsPerAlt: lookAheadPathsPerAlternative,
                                actual: actualTokens,
                                previous: previousToken,
                                customUserDescription: errMsgTypes,
                                ruleName: this.getCurrRuleFullName()
                            }
                        )
                        throw this.SAVE_ERROR(
                            new exceptions_public_1.NoViableAltException(
                                errMsg,
                                this.LA(1),
                                previousToken
                            )
                        )
                    }
                    return ErrorHandler
                })()
                exports.ErrorHandler = ErrorHandler
                //# sourceMappingURL=error_handler.js.map

                /***/
            },
            /* 38 */
            /***/ function(module, exports, __webpack_require__) {
                "use strict"

                Object.defineProperty(exports, "__esModule", { value: true })
                var interpreter_1 = __webpack_require__(13)
                var utils_1 = __webpack_require__(0)
                var ContentAssist = /** @class */ (function() {
                    function ContentAssist() {}
                    ContentAssist.prototype.initContentAssist = function() {}
                    ContentAssist.prototype.computeContentAssist = function(
                        startRuleName,
                        precedingInput
                    ) {
                        var startRuleGast = this.gastProductionsCache.get(
                            startRuleName
                        )
                        if (utils_1.isUndefined(startRuleGast)) {
                            throw Error(
                                "Rule ->" +
                                    startRuleName +
                                    "<- does not exist in this grammar."
                            )
                        }
                        return interpreter_1.nextPossibleTokensAfter(
                            [startRuleGast],
                            precedingInput,
                            this.tokenMatcher,
                            this.maxLookahead
                        )
                    }
                    // TODO: should this be a member method or a utility? it does not have any state or usage of 'this'...
                    // TODO: should this be more explicitly part of the public API?
                    ContentAssist.prototype.getNextPossibleTokenTypes = function(
                        grammarPath
                    ) {
                        var topRuleName = utils_1.first(grammarPath.ruleStack)
                        var gastProductions = this.getGAstProductions()
                        var topProduction = gastProductions.get(topRuleName)
                        var nextPossibleTokenTypes = new interpreter_1.NextAfterTokenWalker(
                            topProduction,
                            grammarPath
                        ).startWalking()
                        return nextPossibleTokenTypes
                    }
                    return ContentAssist
                })()
                exports.ContentAssist = ContentAssist
                //# sourceMappingURL=context_assist.js.map

                /***/
            },
            /* 39 */
            /***/ function(module, exports, __webpack_require__) {
                "use strict"

                Object.defineProperty(exports, "__esModule", { value: true })
                var version_1 = __webpack_require__(17)
                function createSyntaxDiagramsCode(grammar, _a) {
                    var _b = _a === void 0 ? {} : _a,
                        _c = _b.resourceBase,
                        resourceBase =
                            _c === void 0
                                ? "https://unpkg.com/chevrotain@" +
                                  version_1.VERSION +
                                  "/diagrams/"
                                : _c,
                        _d = _b.css,
                        css =
                            _d === void 0
                                ? "https://unpkg.com/chevrotain@" +
                                  version_1.VERSION +
                                  "/diagrams/diagrams.css"
                                : _d
                    var header =
                        '\n<!-- This is a generated file -->\n<!DOCTYPE html>\n<meta charset="utf-8">\n<style>\n  body {\n    background-color: hsl(30, 20%, 95%)\n  }\n</style>\n\n'
                    var cssHtml =
                        "\n<link rel='stylesheet' href='" + css + "'>\n"
                    var scripts =
                        "\n<script src='" +
                        resourceBase +
                        "vendor/railroad-diagrams.js'></script>\n<script src='" +
                        resourceBase +
                        "src/diagrams_builder.js'></script>\n<script src='" +
                        resourceBase +
                        "src/diagrams_behavior.js'></script>\n<script src='" +
                        resourceBase +
                        "src/main.js'></script>\n"
                    var diagramsDiv =
                        '\n<div id="diagrams" align="center"></div>    \n'
                    var serializedGrammar =
                        "\n<script>\n    window.serializedGrammar = " +
                        JSON.stringify(grammar, null, "  ") +
                        ";\n</script>\n"
                    var initLogic =
                        '\n<script>\n    var diagramsDiv = document.getElementById("diagrams");\n    main.drawDiagramsFromSerializedGrammar(serializedGrammar, diagramsDiv);\n</script>\n'
                    return (
                        header +
                        cssHtml +
                        scripts +
                        diagramsDiv +
                        serializedGrammar +
                        initLogic
                    )
                }
                exports.createSyntaxDiagramsCode = createSyntaxDiagramsCode
                //# sourceMappingURL=render_public.js.map

                /***/
            },
            /* 40 */
            /***/ function(module, exports, __webpack_require__) {
                "use strict"

                Object.defineProperty(exports, "__esModule", { value: true })
                var generate_1 = __webpack_require__(41)
                function generateParserFactory(options) {
                    var wrapperText = generate_1.genWrapperFunction({
                        name: options.name,
                        rules: options.rules
                    })
                    var constructorWrapper = new Function(
                        "tokenVocabulary",
                        "config",
                        "chevrotain",
                        wrapperText
                    )
                    return function(config) {
                        return constructorWrapper(
                            options.tokenVocabulary,
                            config,
                            // TODO: check how the require is transpiled/webpacked
                            __webpack_require__(18)
                        )
                    }
                }
                exports.generateParserFactory = generateParserFactory
                function generateParserModule(options) {
                    return generate_1.genUmdModule({
                        name: options.name,
                        rules: options.rules
                    })
                }
                exports.generateParserModule = generateParserModule
                //# sourceMappingURL=generate_public.js.map

                /***/
            },
            /* 41 */
            /***/ function(module, exports, __webpack_require__) {
                "use strict"

                Object.defineProperty(exports, "__esModule", { value: true })
                var utils_1 = __webpack_require__(0)
                var tokens_public_1 = __webpack_require__(2)
                var gast_public_1 = __webpack_require__(1)
                /**
                 * Missing features
                 * 1. Rule arguments
                 * 2. Gates
                 * 3. embedded actions
                 */
                var NL = "\n"
                function genUmdModule(options) {
                    return (
                        "\n(function (root, factory) {\n    if (typeof define === 'function' && define.amd) {\n        // AMD. Register as an anonymous module.\n        define(['chevrotain'], factory);\n    } else if (typeof module === 'object' && module.exports) {\n        // Node. Does not work with strict CommonJS, but\n        // only CommonJS-like environments that support module.exports,\n        // like Node.\n        module.exports = factory(require('chevrotain'));\n    } else {\n        // Browser globals (root is window)\n        root.returnExports = factory(root.b);\n    }\n}(typeof self !== 'undefined' ? self : this, function (chevrotain) {\n\n" +
                        genClass(options) +
                        "\n    \nreturn {\n    " +
                        options.name +
                        ": " +
                        options.name +
                        " \n}\n}));\n"
                    )
                }
                exports.genUmdModule = genUmdModule
                function genWrapperFunction(options) {
                    return (
                        "    \n" +
                        genClass(options) +
                        "\nreturn new " +
                        options.name +
                        "(tokenVocabulary, config)    \n"
                    )
                }
                exports.genWrapperFunction = genWrapperFunction
                function genClass(options) {
                    // TODO: how to pass the token vocabulary? Constructor? other?
                    var result =
                        "\nfunction " +
                        options.name +
                        "(tokenVocabulary, config) {\n    // invoke super constructor\n    // No support for embedded actions currently, so we can 'hardcode'\n    // The use of CstParser.\n    chevrotain.CstParser.call(this, tokenVocabulary, config)\n\n    const $ = this\n\n    " +
                        genAllRules(options.rules) +
                        "\n\n    // very important to call this after all the rules have been defined.\n    // otherwise the parser may not work correctly as it will lack information\n    // derived during the self analysis phase.\n    this.performSelfAnalysis(this)\n}\n\n// inheritance as implemented in javascript in the previous decade... :(\n" +
                        options.name +
                        ".prototype = Object.create(chevrotain.CstParser.prototype)\n" +
                        options.name +
                        ".prototype.constructor = " +
                        options.name +
                        "    \n    "
                    return result
                }
                exports.genClass = genClass
                function genAllRules(rules) {
                    var rulesText = utils_1.map(rules, function(currRule) {
                        return genRule(currRule, 1)
                    })
                    return rulesText.join("\n")
                }
                exports.genAllRules = genAllRules
                function genRule(prod, n) {
                    var result =
                        indent(n, '$.RULE("' + prod.name + '", function() {') +
                        NL
                    result += genDefinition(prod.definition, n + 1)
                    result += indent(n + 1, "})") + NL
                    return result
                }
                exports.genRule = genRule
                function genTerminal(prod, n) {
                    var name = tokens_public_1.tokenName(prod.terminalType)
                    // TODO: potential performance optimization, avoid tokenMap Dictionary access
                    return indent(
                        n,
                        "$.CONSUME" +
                            prod.idx +
                            "(this.tokensMap." +
                            name +
                            ")" +
                            NL
                    )
                }
                exports.genTerminal = genTerminal
                function genNonTerminal(prod, n) {
                    return indent(
                        n,
                        "$.SUBRULE" +
                            prod.idx +
                            "($." +
                            prod.nonTerminalName +
                            ")" +
                            NL
                    )
                }
                exports.genNonTerminal = genNonTerminal
                function genAlternation(prod, n) {
                    var result = indent(n, "$.OR" + prod.idx + "([") + NL
                    var alts = utils_1.map(prod.definition, function(altDef) {
                        return genSingleAlt(altDef, n + 1)
                    })
                    result += alts.join("," + NL)
                    result += NL + indent(n, "])" + NL)
                    return result
                }
                exports.genAlternation = genAlternation
                function genSingleAlt(prod, n) {
                    var result = indent(n, "{") + NL
                    if (prod.name) {
                        result +=
                            indent(n + 1, 'NAME: "' + prod.name + '",') + NL
                    }
                    result += indent(n + 1, "ALT: function() {") + NL
                    result += genDefinition(prod.definition, n + 1)
                    result += indent(n + 1, "}") + NL
                    result += indent(n, "}")
                    return result
                }
                exports.genSingleAlt = genSingleAlt
                function genProd(prod, n) {
                    /* istanbul ignore else */
                    if (prod instanceof gast_public_1.NonTerminal) {
                        return genNonTerminal(prod, n)
                    } else if (prod instanceof gast_public_1.Option) {
                        return genDSLRule("OPTION", prod, n)
                    } else if (
                        prod instanceof gast_public_1.RepetitionMandatory
                    ) {
                        return genDSLRule("AT_LEAST_ONE", prod, n)
                    } else if (
                        prod instanceof
                        gast_public_1.RepetitionMandatoryWithSeparator
                    ) {
                        return genDSLRule("AT_LEAST_ONE_SEP", prod, n)
                    } else if (
                        prod instanceof gast_public_1.RepetitionWithSeparator
                    ) {
                        return genDSLRule("MANY_SEP", prod, n)
                    } else if (prod instanceof gast_public_1.Repetition) {
                        return genDSLRule("MANY", prod, n)
                    } else if (prod instanceof gast_public_1.Alternation) {
                        return genAlternation(prod, n)
                    } else if (prod instanceof gast_public_1.Terminal) {
                        return genTerminal(prod, n)
                    } else if (prod instanceof gast_public_1.Flat) {
                        return genDefinition(prod.definition, n)
                    } else {
                        throw Error("non exhaustive match")
                    }
                }
                function genDSLRule(dslName, prod, n) {
                    var result = indent(n, "$." + (dslName + prod.idx) + "(")
                    if (prod.name || prod.separator) {
                        result += "{" + NL
                        if (prod.name) {
                            result +=
                                indent(n + 1, 'NAME: "' + prod.name + '"') +
                                "," +
                                NL
                        }
                        if (prod.separator) {
                            result +=
                                indent(
                                    n + 1,
                                    "SEP: this.tokensMap." +
                                        tokens_public_1.tokenName(
                                            prod.separator
                                        )
                                ) +
                                "," +
                                NL
                        }
                        result +=
                            "DEF: " +
                            genDefFunction(prod.definition, n + 2) +
                            NL
                        result += indent(n, "}") + NL
                    } else {
                        result += genDefFunction(prod.definition, n + 1)
                    }
                    result += indent(n, ")") + NL
                    return result
                }
                function genDefFunction(definition, n) {
                    var def = "function() {" + NL
                    def += genDefinition(definition, n)
                    def += indent(n, "}") + NL
                    return def
                }
                function genDefinition(def, n) {
                    var result = ""
                    utils_1.forEach(def, function(prod) {
                        result += genProd(prod, n + 1)
                    })
                    return result
                }
                function indent(howMuch, text) {
                    var spaces = Array(howMuch * 4 + 1).join(" ")
                    return spaces + text
                }
                //# sourceMappingURL=generate.js.map

                /***/
            }
            /******/
        ]
    )
})
