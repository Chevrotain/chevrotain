(function (root, factory) {
  /* istanbul ignore next */
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module unless amdModuleId is set
    define('chevrotain', ["lodash"], function (a0) {
      return (root['API'] = factory(a0));
    });
  } else if (typeof exports === 'object') {
    // Node. Does not work with strict CommonJS, but
    // only CommonJS-like environments that support module.exports,
    // like Node.
    module.exports = factory(require("lodash"));
  } else {
    root['chevrotain'] = factory(_);
  }
}(this, function (_) {

/*! chevrotain - v0.4.7 - 2015-07-17 */
var chevrotain;
(function (chevrotain) {
    var lang;
    (function (lang) {
        var nameRegex = /^\s*function\s*(\S*)\s*\(/;
        /* istanbul ignore next */
        var hasNativeName = typeof (function f() {
        }).name !== "undefined";
        function classNameFromInstance(instance) {
            return functionName(instance.constructor);
        }
        lang.classNameFromInstance = classNameFromInstance;
        /* istanbul ignore next too many hacks for IE here*/
        function functionName(func) {
            if (hasNativeName) {
                return func.name;
            }
            else if (func.rdtFuncNameCache666) {
                // super 'special' property name on INSTANCE to avoid hurting those who use browsers that
                // do not support name property even more (IE...)
                return func.rdtFuncNameCache666;
            }
            else {
                var name = func.toString().match(nameRegex)[1];
                func.rdtFuncNameCache666 = name;
                return name;
            }
        }
        lang.functionName = functionName;
        /**
         * simple Hashtable between a string and some generic value
         * this should be removed once typescript supports ES6 style Hashtable
         */
        var HashTable = (function () {
            function HashTable() {
                this._state = {};
            }
            HashTable.prototype.keys = function () {
                return _.keys(this._state);
            };
            HashTable.prototype.values = function () {
                return _.values(this._state);
            };
            HashTable.prototype.put = function (key, value) {
                this._state[key] = value;
            };
            HashTable.prototype.putAll = function (other) {
                this._state = _.assign(this._state, other._state);
            };
            HashTable.prototype.get = function (key) {
                // To avoid edge case with a key called "hasOwnProperty" we need to perform the commented out check below
                // -> if (Object.prototype.hasOwnProperty.call(this._state, key)) { ... } <-
                // however this costs nearly 25% of the parser's runtime.
                // if someone decides to name their Parser class "hasOwnProperty" they deserve what they will get :)
                return this._state[key];
            };
            HashTable.prototype.containsKey = function (key) {
                return _.has(this._state, key);
            };
            return HashTable;
        })();
        lang.HashTable = HashTable;
    })/* istanbul ignore next */ (lang = chevrotain.lang || /* istanbul ignore next */ (chevrotain.lang = {}));
})/* istanbul ignore next */ (chevrotain || (chevrotain = {}));
var __extends = this.__extends || function (d, b) {
    for (var p in b) /* istanbul ignore next */  if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
// using only root module name ('chevrotain') and not a longer name ('chevrotain.tokens')
// because the external and internal API must have the same names for d.ts definition files to be valid
// TODO: examine module in module to reduce spam on chevrotain namespace
var chevrotain;
(function (chevrotain) {
    var lang = chevrotain.lang;
    function tokenName(clazz) {
        // used to support js inheritance patterns that do not use named functions
        // in that situation setting a property tokenName on a token constructor will
        // enable producing readable error messages.
        if (_.isString(clazz.tokenName)) {
            return clazz.tokenName;
        }
        else {
            return lang.functionName(clazz);
        }
    }
    chevrotain.tokenName = tokenName;
    /**
     * utility to help the poor souls who are still stuck writing pure javascript 5.1
     * extend and create Token subclasses in a less verbose manner
     *
     * @param {string} tokenName the name of the new TokenClass
     * @param {*} patternOrParent Pa
     * @param {Function} parentConstructor the Token class to be extended
     * @returns {Function} a constructor for the new extended Token subclass
     */
    function extendToken(tokenName, patternOrParent, parentConstructor) {
        if (patternOrParent === void 0) { patternOrParent = undefined; }
        if (parentConstructor === void 0) { parentConstructor = Token; }
        var pattern;
        if (_.isRegExp(patternOrParent) || patternOrParent === chevrotain.Lexer.SKIPPED || patternOrParent === chevrotain.Lexer.NA) {
            pattern = patternOrParent;
        }
        else if (_.isFunction(patternOrParent)) {
            parentConstructor = patternOrParent;
            pattern = undefined;
        }
        var derivedCostructor = function () {
            parentConstructor.apply(this, arguments);
        };
        // static properties mixing
        _.forOwn(parentConstructor, function (v, k) {
            derivedCostructor[k] = v;
        });
        // the tokenName property will be used by the Parser for Error Messages if the Token's constructor is anonymous
        derivedCostructor.tokenName = tokenName;
        derivedCostructor.prototype = Object.create(parentConstructor.prototype);
        derivedCostructor.prototype.constructor = derivedCostructor;
        if (!_.isUndefined(pattern)) {
            derivedCostructor.PATTERN = pattern;
        }
        return derivedCostructor;
    }
    chevrotain.extendToken = extendToken;
    var Token = (function () {
        /**
         * @param {string} image the textual representation of the Token as it appeared in the text
         * @param {number} offset offset of the first character of the Token
         * @param {number} startLine line of the first character of the Token
         * @param {number} startColumn column of the first character of the Token
         * @param {number} endLine line of the last character of the Token
         * @param {number} endColumn column of the last character of the Token
         *
         * Things to note:
         * * "do"  {startColumn : 1, endColumn: 2} --> the range is inclusive to exclusive 1...2 (2 chars long).
         * * "\n"  {startLine : 1, endLine: 1} --> a lineTerminator as the last character does not effect the Token's line numbering.
         * * "'hello\tworld\uBBBB'"  {image: "'hello\tworld\uBBBB'"} --> a Token's image is the "literal" text
         *                                                              (unicode escaping is untouched).
         */
        function Token(image, offset, startLine, startColumn, endLine, endColumn) {
            if (endLine === void 0) { endLine = startLine; }
            if (endColumn === void 0) { endColumn = startColumn + image.length - 1; }
            this.image = image;
            this.offset = offset;
            this.startLine = startLine;
            this.startColumn = startColumn;
            this.endLine = endLine;
            this.endColumn = endColumn;
            // this marks if a Token does not really exist and has been inserted "artificially" during parsing in rule error recovery
            this.isInsertedInRecovery = false;
        }
        return Token;
    })();
    chevrotain.Token = Token;
    /**
     * a special kind of Token which does not really exist in the input
     * (hence the 'Virtual' prefix). These type of Tokens can be used as special markers:
     * for example, EOF (end-of-file).
     */
    var VirtualToken = (function (_super) {
        __extends(VirtualToken, _super);
        function VirtualToken() {
            _super.call(this, "", -1, -1, -1, -1, -1);
        }
        return VirtualToken;
    })(Token);
    chevrotain.VirtualToken = VirtualToken;
    var EOF = (function (_super) {
        __extends(EOF, _super);
        function EOF() {
            _super.apply(this, arguments);
        }
        return EOF;
    })(VirtualToken);
    chevrotain.EOF = EOF;
})/* istanbul ignore next */ (chevrotain || (chevrotain = {}));
// using only root module name ('chevrotain') and not a longer name ('chevrotain.lexer')
// because the external and internal API must have the same names for d.ts definition files to be valid
// TODO: examine module in module to reduce spam on chevrotain namespace
var chevrotain;
(function (chevrotain) {
    var Lexer = (function () {
        /**
         * @param {Function[]} tokenClasses constructor functions for the Tokens types this scanner will support
         *                     These constructors must be in one of three forms:
         *
         *  1. With a PATTERN property that has a RegExp value for tokens to match:
         *     example: -->class Integer extends Token { static PATTERN = /[1-9]\d }<--
         *
         *  2. With a PATTERN property that has a RegExp value AND an IGNORE property with boolean value true.
         *     These tokens will be matched but not as part of the main token vector.
         *     this is usually used for ignoring whitespace/comments
         *     example: -->    class Whitespace extends Token { static PATTERN = /(\t| )/; static IGNORE = true}<--
         *
         *  3. With a PATTERN property that has the value of the var Lexer.NA defined above.
         *     This is a convenience form used to avoid matching Token classes that only act as categories.
         *     example: -->class Keyword extends Token { static PATTERN = NA }<--
         *
         *
         *   The following RegExp patterns are not supported:
         *   a. '$' for match at end of input
         *   b. /b global flag
         *   c. /m multi-line flag
         *
         *   The Lexer will identify the first pattern the matches, Therefor the order of Token Constructors passed
         *   To the SimpleLexer's constructor is meaningful. If two patterns may match the same string, the longer one
         *   should be before the shorter one.
         *
         *   Note that there are situations in which we may wish to place the longer pattern after the shorter one.
         *   For example: keywords vs Identifiers.
         *   'do'(/do/) and 'done'(/w+)
         *
         *   * If the Identifier pattern appears before the 'do' pattern both 'do' and 'done'
         *     will be lexed as an Identifier.
         *
         *   * If the 'do' pattern appears before the Identifier pattern 'do' will be lexed correctly as a keyword.
         *     however 'done' will be lexed as TWO tokens keyword 'do' and identifier 'ne'.
         *
         *   To resolve this problem, add a static property on the keyword's Tokens constructor named: LONGER_ALT
         *   example:
         *
         *       export class Identifier extends Keyword { static PATTERN = /[_a-zA-Z][_a-zA-Z0-9]/ }
         *       export class Keyword extends Token {
         *          static PATTERN = lex.NA
         *          static LONGER_ALT = Identifier
         *       }
         *       export class Do extends Keyword { static PATTERN = /do/ }
         *       export class While extends Keyword { static PATTERN = /while/ }
         *       export class Return extends Keyword { static PATTERN = /return/ }
         *
         *   The lexer will then also attempt to match a (longer) Identifier each time a keyword is matched
         *
         *
         */
        function Lexer(tokenClasses) {
            this.tokenClasses = tokenClasses;
            chevrotain.validatePatterns(tokenClasses);
            var analyzeResult = chevrotain.analyzeTokenClasses(tokenClasses);
            this.allPatterns = analyzeResult.allPatterns;
            this.patternIdxToClass = analyzeResult.patternIdxToClass;
            this.patternIdxToGroup = analyzeResult.patternIdxToGroup;
            this.patternIdxToLongerAltIdx = analyzeResult.patternIdxToLongerAltIdx;
            this.patternIdxToCanLineTerminator = analyzeResult.patternIdxToCanLineTerminator;
            this.emptyGroups = analyzeResult.emptyGroups;
        }
        /**
         * Will lex(Tokenize) a string.
         * Note that this can be called repeatedly on different strings as this method
         * does not modify the state of the Lexer.
         *
         * @param {string} text the string to lex
         * @returns {{tokens: {Token}[], errors: string[]}}
         */
        Lexer.prototype.tokenize = function (text) {
            var match, i, j, matchAlt, longerAltIdx, matchedImage, imageLength, group, tokClass, newToken, errLength, canMatchedContainLineTerminator, fixForEndingInLT, c, droppedChar, lastLTIdx, errorMessage, lastCharIsLT;
            var orgInput = text;
            var offset = 0;
            var matchedTokens = [];
            var errors = [];
            var line = 1;
            var column = 1;
            var groups = _.clone(this.emptyGroups);
            while (text.length > 0) {
                match = null;
                for (i = 0; i < this.allPatterns.length; i++) {
                    match = this.allPatterns[i].exec(text);
                    if (match !== null) {
                        // even though this pattern matched we must try a another longer alternative.
                        // this can be used to prioritize keywords over identifers
                        longerAltIdx = this.patternIdxToLongerAltIdx[i];
                        if (longerAltIdx) {
                            matchAlt = this.allPatterns[longerAltIdx].exec(text);
                            if (matchAlt && matchAlt[0].length > match[0].length) {
                                match = matchAlt;
                                i = longerAltIdx;
                            }
                        }
                        break;
                    }
                }
                if (match !== null) {
                    matchedImage = match[0];
                    imageLength = matchedImage.length;
                    group = this.patternIdxToGroup[i];
                    if (group !== undefined) {
                        tokClass = this.patternIdxToClass[i];
                        newToken = new tokClass(matchedImage, offset, line, column);
                        if (group === "default") {
                            matchedTokens.push(newToken);
                        }
                        else {
                            groups[group].push(newToken);
                        }
                    }
                    text = text.slice(imageLength);
                    offset = offset + imageLength;
                    column = column + imageLength; // TODO: with newlines the column may change be assigned twice
                    canMatchedContainLineTerminator = this.patternIdxToCanLineTerminator[i];
                    if (canMatchedContainLineTerminator) {
                        var lineTerminatorsInMatch = chevrotain.countLineTerminators(matchedImage);
                        // TODO: identify edge case of one token ending in '\r' and another one starting with '\n'
                        if (lineTerminatorsInMatch !== 0) {
                            line = line + lineTerminatorsInMatch;
                            lastLTIdx = imageLength - 1;
                            while (lastLTIdx >= 0) {
                                c = matchedImage.charCodeAt(lastLTIdx);
                                // scan in reverse to find last lineTerminator in image
                                if (c === 13 || c === 10) {
                                    break;
                                }
                                lastLTIdx--;
                            }
                            column = imageLength - lastLTIdx;
                            if (group !== undefined) {
                                lastCharIsLT = lastLTIdx === imageLength - 1;
                                fixForEndingInLT = lastCharIsLT ? -1 : 0;
                                if (!(lineTerminatorsInMatch === 1 && lastCharIsLT)) {
                                    // if a token ends in a LT that last LT only affects the line numbering of following Tokens
                                    newToken.endLine = line + fixForEndingInLT;
                                    // the last LT in a token does not affect the endColumn either as the [columnStart ... columnEnd)
                                    // inclusive to exclusive range.
                                    newToken.endColumn = column - 1 + -fixForEndingInLT;
                                }
                            }
                        }
                    }
                }
                else {
                    var errorStartOffset = offset;
                    var errorLine = line;
                    var errorColumn = column;
                    var foundResyncPoint = false;
                    while (!foundResyncPoint && text.length > 0) {
                        // drop chars until we succeed in matching something
                        droppedChar = text.charCodeAt(0);
                        if (droppedChar === 10 || (droppedChar === 13 && (text.length === 1 || (text.length > 1 && text.charCodeAt(1) !== 10)))) {
                            line++;
                            column = 1;
                        }
                        else {
                            // either when skipping the next char, or when consuming the following pattern
                            // (which will have to start in a '\n' if we manage to consume it)
                            column++;
                        }
                        text = text.substr(1);
                        offset++;
                        for (j = 0; j < this.allPatterns.length; j++) {
                            foundResyncPoint = this.allPatterns[j].test(text);
                            if (foundResyncPoint) {
                                break;
                            }
                        }
                    }
                    errLength = offset - errorStartOffset;
                    // at this point we either re-synced or reached the end of the input text
                    errorMessage = ("unexpected character: ->" + orgInput.charAt(errorStartOffset) + "<- at offset: " + errorStartOffset + ",") + (" skipped " + (offset - errorStartOffset) + " characters.");
                    errors.push({ line: errorLine, column: errorColumn, length: errLength, message: errorMessage });
                }
            }
            return { tokens: matchedTokens, groups: groups, errors: errors };
        };
        Lexer.SKIPPED = {
            description: "This marks a skipped Token pattern, this means each token identified by it will" + "be consumed and then throw into oblivion, this can be used to for example: skip whitespace."
        };
        Lexer.NA = /NOT_APPLICABLE/;
        return Lexer;
    })();
    chevrotain.Lexer = Lexer;
})/* istanbul ignore next */ (chevrotain || (chevrotain = {}));
// using only root module name ('chevrotain') and not a longer name ('chevrotain.lexer')
// because the external and internal API must have the same names for d.ts definition files to be valid
// TODO: examine module in module to reduce spam on chevrotain namespace
var chevrotain;
(function (chevrotain) {
    var PATTERN = "PATTERN";
    function analyzeTokenClasses(tokenClasses) {
        var onlyRelevantClasses = _.reject(tokenClasses, function (currClass) {
            return currClass[PATTERN] === chevrotain.Lexer.NA;
        });
        var allTransformedPatterns = _.map(onlyRelevantClasses, function (currClass) {
            return addStartOfInput(currClass[PATTERN]);
        });
        var allPatternsToClass = _.zipObject(allTransformedPatterns, onlyRelevantClasses);
        var patternIdxToClass = _.map(allTransformedPatterns, function (pattern) {
            return allPatternsToClass[pattern.toString()];
        });
        var patternIdxToGroup = _.map(onlyRelevantClasses, function (clazz) {
            var groupName = clazz.GROUP;
            if (groupName === chevrotain.Lexer.SKIPPED) {
                return undefined;
            }
            else if (_.isString(groupName)) {
                return groupName;
            }/* istanbul ignore else */ 
            else if (_.isUndefined(groupName)) {
                return "default";
            }
            else {
                /* istanbul ignore next */ throw Error("non exhaustive match");
            }
        });
        var patternIdxToLongerAltIdx = _.map(onlyRelevantClasses, function (clazz, idx) {
            var longerAltClass = clazz.LONGER_ALT;
            if (longerAltClass) {
                var longerAltIdx = _.indexOf(onlyRelevantClasses, longerAltClass);
                return longerAltIdx;
            }
        });
        var patternIdxToCanLineTerminator = _.map(allTransformedPatterns, function (pattern) {
            // TODO: unicode escapes of line terminators too?
            return /\\n|\\r|\\s/g.test(pattern.source);
        });
        var emptyGroups = _.reduce(onlyRelevantClasses, function (acc, clazz) {
            var groupName = clazz.GROUP;
            if (_.isString(groupName)) {
                acc[groupName] = [];
            }
            return acc;
        }, {});
        return {
            allPatterns: allTransformedPatterns,
            patternIdxToClass: patternIdxToClass,
            patternIdxToGroup: patternIdxToGroup,
            patternIdxToLongerAltIdx: patternIdxToLongerAltIdx,
            patternIdxToCanLineTerminator: patternIdxToCanLineTerminator,
            emptyGroups: emptyGroups
        };
    }
    chevrotain.analyzeTokenClasses = analyzeTokenClasses;
    function validatePatterns(tokenClasses) {
        var missingErrors = findMissingPatterns(tokenClasses);
        if (!_.isEmpty(missingErrors)) {
            throw new Error(missingErrors.join("\n ---------------- \n"));
        }
        var invalidPatterns = findInvalidPatterns(tokenClasses);
        if (!_.isEmpty(invalidPatterns)) {
            throw new Error(invalidPatterns.join("\n ---------------- \n"));
        }
        var InvalidEndOfInputAnchor = findEndOfInputAnchor(tokenClasses);
        if (!_.isEmpty(InvalidEndOfInputAnchor)) {
            throw new Error(InvalidEndOfInputAnchor.join("\n ---------------- \n"));
        }
        var invalidFlags = findUnsupportedFlags(tokenClasses);
        if (!_.isEmpty(invalidFlags)) {
            throw new Error(invalidFlags.join("\n ---------------- \n"));
        }
        var duplicates = findDuplicatePatterns(tokenClasses);
        if (!_.isEmpty(duplicates)) {
            throw new Error(duplicates.join("\n ---------------- \n"));
        }
        var invalidGroupType = findInvalidGroupType(tokenClasses);
        if (!_.isEmpty(invalidGroupType)) {
            throw new Error(invalidGroupType.join("\n ---------------- \n"));
        }
    }
    chevrotain.validatePatterns = validatePatterns;
    function findMissingPatterns(tokenClasses) {
        var noPatternClasses = _.filter(tokenClasses, function (currClass) {
            return !_.has(currClass, PATTERN);
        });
        var errors = _.map(noPatternClasses, function (currClass) {
            return "Token class: ->" + chevrotain.tokenName(currClass) + "<- missing static 'PATTERN' property";
        });
        return errors;
    }
    chevrotain.findMissingPatterns = findMissingPatterns;
    function findInvalidPatterns(tokenClasses) {
        var invalidRegex = _.filter(tokenClasses, function (currClass) {
            var pattern = currClass[PATTERN];
            return !_.isRegExp(pattern);
        });
        var errors = _.map(invalidRegex, function (currClass) {
            return "Token class: ->" + chevrotain.tokenName(currClass) + "<- static 'PATTERN' can only be a RegEx";
        });
        return errors;
    }
    chevrotain.findInvalidPatterns = findInvalidPatterns;
    var end_of_input = /[^\\][\$]/;
    function findEndOfInputAnchor(tokenClasses) {
        var invalidRegex = _.filter(tokenClasses, function (currClass) {
            var pattern = currClass[PATTERN];
            return end_of_input.test(pattern.source);
        });
        var errors = _.map(invalidRegex, function (currClass) {
            return "Token class: ->" + chevrotain.tokenName(currClass) + "<- static 'PATTERN' cannot contain end of input anchor '$'";
        });
        return errors;
    }
    chevrotain.findEndOfInputAnchor = findEndOfInputAnchor;
    function findUnsupportedFlags(tokenClasses) {
        var invalidFlags = _.filter(tokenClasses, function (currClass) {
            var pattern = currClass[PATTERN];
            return pattern instanceof RegExp && (pattern.multiline || pattern.global);
        });
        var errors = _.map(invalidFlags, function (currClass) {
            return "Token class: ->" + chevrotain.tokenName(currClass) + "<- static 'PATTERN' may NOT contain global('g') or multiline('m')";
        });
        return errors;
    }
    chevrotain.findUnsupportedFlags = findUnsupportedFlags;
    // This can only test for identical duplicate RegExps, not semantically equivalent ones.
    function findDuplicatePatterns(tokenClasses) {
        var found = [];
        var identicalPatterns = _.map(tokenClasses, function (outerClass) {
            return _.reduce(tokenClasses, function (result, innerClass) {
                if ((outerClass.PATTERN.source === innerClass.PATTERN.source) && !_.contains(found, innerClass) && innerClass.PATTERN !== chevrotain.Lexer.NA) {
                    // this avoids duplicates in the result, each class may only appear in one "set"
                    // in essence we are creating Equivalence classes on equality relation.
                    found.push(innerClass);
                    return _.union(result, [innerClass]);
                }
            }, []);
        });
        identicalPatterns = _.compact(identicalPatterns);
        var duplicatePatterns = _.filter(identicalPatterns, function (currIdenticalSet) {
            return _.size(currIdenticalSet) > 1;
        });
        var errors = _.map(duplicatePatterns, function (setOfIdentical) {
            var classNames = _.map(setOfIdentical, function (currClass) {
                return chevrotain.tokenName(currClass);
            });
            var dupPatternSrc = _.first(setOfIdentical).PATTERN;
            return ("The same RegExp pattern ->" + dupPatternSrc + "<-") + ("has been used in all the following classes: " + classNames.join(", ") + " <-");
        });
        return errors;
    }
    chevrotain.findDuplicatePatterns = findDuplicatePatterns;
    function findInvalidGroupType(tokenClasses) {
        var invalidTypes = _.filter(tokenClasses, function (clazz) {
            if (!_.has(clazz, "GROUP")) {
                return false;
            }
            var group = clazz.GROUP;
            return group !== chevrotain.Lexer.SKIPPED && group !== chevrotain.Lexer.NA && !_.isString(group);
        });
        var errors = _.map(invalidTypes, function (currClass) {
            return "Token class: ->" + chevrotain.tokenName(currClass) + "<- static 'GROUP' can only be Lexer.SKIPPED/Lexer.NA/A String";
        });
        return errors;
    }
    chevrotain.findInvalidGroupType = findInvalidGroupType;
    function addStartOfInput(pattern) {
        var flags = pattern.ignoreCase ? "i" : "";
        // always wrapping in a none capturing group preceded by '^' to make sure matching can only work on start of input.
        // duplicate/redundant start of input markers have no meaning (/^^^^A/ === /^A/)
        return new RegExp("^(?:" + pattern.source + ")", flags);
    }
    chevrotain.addStartOfInput = addStartOfInput;
    function countLineTerminators(text) {
        var lineTerminators = 0;
        var currOffset = 0;
        while (currOffset < text.length) {
            var c = text.charCodeAt(currOffset);
            if (c === 10) {
                lineTerminators++;
            }
            else if (c === 13) {
                if (currOffset !== text.length - 1 && text.charCodeAt(currOffset + 1) === 10) {
                }
                else {
                    lineTerminators++;
                }
            }
            currOffset++;
        }
        return lineTerminators;
    }
    chevrotain.countLineTerminators = countLineTerminators;
})/* istanbul ignore next */ (chevrotain || (chevrotain = {}));
// todo: consider if this module really belongs in chevrotain?
var chevrotain;
(function (chevrotain) {
    var tree;
    (function (tree) {
        var ParseTree = (function () {
            function ParseTree(payload, children) {
                if (children === void 0) { children = []; }
                this.payload = payload;
                this.children = children;
            }
            ParseTree.prototype.getImage = function () {
                return this.payload.image;
            };
            ParseTree.prototype.getLine = function () {
                return this.payload.startLine;
            };
            ParseTree.prototype.getColumn = function () {
                return this.payload.startColumn;
            };
            return ParseTree;
        })();
        tree.ParseTree = ParseTree;
        /**
         * convenience factory for ParseTrees
         *
         * @param {Function|Token} tokenOrTokenClass The Token instance to be used as the root node, or a constructor Function
         *                         that will create the root node.
         * @param {ParseTree[]} children The sub nodes of the ParseTree to the built
         * @returns {ParseTree}
         */
        function PT(tokenOrTokenClass, children) {
            if (children === void 0) { children = []; }
            var childrenCompact = _.compact(children);
            if (tokenOrTokenClass instanceof chevrotain.Token) {
                return new ParseTree(tokenOrTokenClass, childrenCompact);
            }
            else if (_.isFunction(tokenOrTokenClass)) {
                return new ParseTree(new tokenOrTokenClass(), childrenCompact);
            }
            else if (_.isUndefined(tokenOrTokenClass) || _.isNull(tokenOrTokenClass)) {
                return null;
            }
            else {
                throw "Invalid parameter " + tokenOrTokenClass + " to PT factory.";
            }
        }
        tree.PT = PT;
    })/* istanbul ignore next */ (tree = chevrotain.tree || /* istanbul ignore next */ (chevrotain.tree = {}));
})/* istanbul ignore next */ (chevrotain || (chevrotain = {}));
var chevrotain;
(function (chevrotain) {
    var range;
    (function (range) {
        var Range = (function () {
            function Range(start, end) {
                this.start = start;
                this.end = end;
                if (!isValidRange(start, end)) {
                    throw new Error("INVALID RANGE");
                }
            }
            Range.prototype.contains = function (num) {
                return this.start <= num && this.end >= num;
            };
            Range.prototype.containsRange = function (other) {
                return this.start <= other.start && this.end >= other.end;
            };
            Range.prototype.isContainedInRange = function (other) {
                return other.containsRange(this);
            };
            Range.prototype.strictlyContainsRange = function (other) {
                return this.start < other.start && this.end > other.end;
            };
            Range.prototype.isStrictlyContainedInRange = function (other) {
                return other.strictlyContainsRange(this);
            };
            return Range;
        })();
        range.Range = Range;
        function isValidRange(start, end) {
            return !(start < 0 || end < start);
        }
        range.isValidRange = isValidRange;
    })/* istanbul ignore next */ (range = chevrotain.range || /* istanbul ignore next */ (chevrotain.range = {}));
})/* istanbul ignore next */ (chevrotain || (chevrotain = {}));
var chevrotain;
(function (chevrotain) {
    var constants;
    (function (constants) {
        constants.IN = "_~IN~_";
    })/* istanbul ignore next */ (constants = chevrotain.constants || /* istanbul ignore next */ (chevrotain.constants = {}));
})/* istanbul ignore next */ (chevrotain || (chevrotain = {}));
var chevrotain;
(function (chevrotain) {
    var gast;
    (function (gast) {
        var AbstractProduction = (function () {
            function AbstractProduction(definition) {
                this.definition = definition;
                this.implicitOccurrenceIndex = false;
            }
            AbstractProduction.prototype.accept = function (visitor) {
                visitor.visit(this);
                _.forEach(this.definition, function (prod) {
                    prod.accept(visitor);
                });
            };
            return AbstractProduction;
        })();
        gast.AbstractProduction = AbstractProduction;
        var NonTerminal = (function (_super) {
            __extends(NonTerminal, _super);
            function NonTerminal(nonTerminalName, referencedRule, occurrenceInParent) {
                if (referencedRule === void 0) { referencedRule = undefined; }
                if (occurrenceInParent === void 0) { occurrenceInParent = 1; }
                _super.call(this, []);
                this.nonTerminalName = nonTerminalName;
                this.referencedRule = referencedRule;
                this.occurrenceInParent = occurrenceInParent;
            }
            Object.defineProperty(NonTerminal.prototype, "definition", {
                get: function () {
                    if (this.referencedRule !== undefined) {
                        return this.referencedRule.definition;
                    }
                    return [];
                },
                set: function (definition) {
                    // immutable
                },
                enumerable: true,
                configurable: true
            });
            NonTerminal.prototype.accept = function (visitor) {
                visitor.visit(this);
                // don't visit children of a reference, we will get cyclic infinite loops if we do so
            };
            return NonTerminal;
        })(AbstractProduction);
        gast.NonTerminal = NonTerminal;
        var Rule = (function (_super) {
            __extends(Rule, _super);
            function Rule(name, definition) {
                _super.call(this, definition);
                this.name = name;
            }
            return Rule;
        })(AbstractProduction);
        gast.Rule = Rule;
        var Flat = (function (_super) {
            __extends(Flat, _super);
            function Flat(definition) {
                _super.call(this, definition);
            }
            return Flat;
        })(AbstractProduction);
        gast.Flat = Flat;
        var Option = (function (_super) {
            __extends(Option, _super);
            function Option(definition, occurrenceInParent) {
                if (occurrenceInParent === void 0) { occurrenceInParent = 1; }
                _super.call(this, definition);
                this.occurrenceInParent = occurrenceInParent;
            }
            return Option;
        })(AbstractProduction);
        gast.Option = Option;
        var RepetitionMandatory = (function (_super) {
            __extends(RepetitionMandatory, _super);
            function RepetitionMandatory(definition, occurrenceInParent) {
                if (occurrenceInParent === void 0) { occurrenceInParent = 1; }
                _super.call(this, definition);
                this.occurrenceInParent = occurrenceInParent;
            }
            return RepetitionMandatory;
        })(AbstractProduction);
        gast.RepetitionMandatory = RepetitionMandatory;
        var Repetition = (function (_super) {
            __extends(Repetition, _super);
            function Repetition(definition, occurrenceInParent) {
                if (occurrenceInParent === void 0) { occurrenceInParent = 1; }
                _super.call(this, definition);
                this.occurrenceInParent = occurrenceInParent;
            }
            return Repetition;
        })(AbstractProduction);
        gast.Repetition = Repetition;
        var Alternation = (function (_super) {
            __extends(Alternation, _super);
            function Alternation(definition, occurrenceInParent) {
                if (occurrenceInParent === void 0) { occurrenceInParent = 1; }
                _super.call(this, definition);
                this.occurrenceInParent = occurrenceInParent;
            }
            return Alternation;
        })(AbstractProduction);
        gast.Alternation = Alternation;
        var Terminal = (function () {
            function Terminal(terminalType, occurrenceInParent) {
                if (occurrenceInParent === void 0) { occurrenceInParent = 1; }
                this.terminalType = terminalType;
                this.occurrenceInParent = occurrenceInParent;
                this.implicitOccurrenceIndex = false;
            }
            Terminal.prototype.accept = function (visitor) {
                visitor.visit(this);
            };
            return Terminal;
        })();
        gast.Terminal = Terminal;
        var GAstVisitor = (function () {
            function GAstVisitor() {
            }
            GAstVisitor.prototype.visit = function (node) {
                if (node instanceof NonTerminal) {
                    this.visitNonTerminal(node);
                }
                else if (node instanceof Flat) {
                    this.visitFlat(node);
                }
                else if (node instanceof Option) {
                    this.visitOption(node);
                }
                else if (node instanceof RepetitionMandatory) {
                    this.visitRepetitionMandatory(node);
                }
                else if (node instanceof Repetition) {
                    this.visitRepetition(node);
                }
                else if (node instanceof Alternation) {
                    this.visitAlternation(node);
                }
                else if (node instanceof Terminal) {
                    this.visitTerminal(node);
                }
            };
            /* istanbul ignore next */ // this is an "Abstract" method that does nothing, testing it is pointless.
            GAstVisitor.prototype.visitNonTerminal = function (node) {
            };
            GAstVisitor.prototype.visitFlat = function (node) {
            };
            GAstVisitor.prototype.visitOption = function (node) {
            };
            GAstVisitor.prototype.visitRepetitionMandatory = function (node) {
            };
            GAstVisitor.prototype.visitRepetition = function (node) {
            };
            GAstVisitor.prototype.visitAlternation = function (node) {
            };
            GAstVisitor.prototype.visitTerminal = function (node) {
            };
            return GAstVisitor;
        })();
        gast.GAstVisitor = GAstVisitor;
    })/* istanbul ignore next */ (gast = chevrotain.gast || /* istanbul ignore next */ (chevrotain.gast = {}));
})/* istanbul ignore next */ (chevrotain || (chevrotain = {}));
var chevrotain;
(function (chevrotain) {
    var gast;
    (function (gast) {
        var lang = chevrotain.lang;
        function isSequenceProd(prod) {
            return prod instanceof gast.Flat || prod instanceof gast.Option || prod instanceof gast.Repetition || prod instanceof gast.RepetitionMandatory || prod instanceof gast.Terminal || prod instanceof gast.Rule;
        }
        gast.isSequenceProd = isSequenceProd;
        function isOptionalProd(prod) {
            var isDirectlyOptional = prod instanceof gast.Option || prod instanceof gast.Repetition;
            if (isDirectlyOptional) {
                return true;
            }
            // note that this can cause infinite loop if one optional empty TOP production has a cyclic dependency with another
            // empty optional top rule
            // may be indirectly optional ((A?B?C?) | (D?E?F?))
            if (prod instanceof gast.Alternation) {
                // for OR its enough for just one of the alternatives to be optional
                return _.some(prod.definition, function (subProd) {
                    return isOptionalProd(subProd);
                });
            }
            else if (prod instanceof gast.AbstractProduction) {
                return _.every(prod.definition, function (subProd) {
                    return isOptionalProd(subProd);
                });
            }
            else {
                return false;
            }
        }
        gast.isOptionalProd = isOptionalProd;
        function isBranchingProd(prod) {
            return prod instanceof gast.Alternation;
        }
        gast.isBranchingProd = isBranchingProd;
        var productionToDslName = {};
        productionToDslName[lang.functionName(gast.NonTerminal)] = "SUBRULE";
        productionToDslName[lang.functionName(gast.Option)] = "OPTION";
        productionToDslName[lang.functionName(gast.RepetitionMandatory)] = "AT_LEAST_ONE";
        productionToDslName[lang.functionName(gast.Repetition)] = "MANY";
        productionToDslName[lang.functionName(gast.Alternation)] = "OR";
        productionToDslName[lang.functionName(gast.Terminal)] = "CONSUME";
        function getProductionDslName(prod) {
            var clazz = prod.constructor;
            var prodName = lang.functionName(clazz);
            return productionToDslName[prodName];
        }
        gast.getProductionDslName = getProductionDslName;
    })/* istanbul ignore next */ (gast = chevrotain.gast || /* istanbul ignore next */ (chevrotain.gast = {}));
})/* istanbul ignore next */ (chevrotain || (chevrotain = {}));
var chevrotain;
(function (chevrotain) {
    var first;
    (function (_first) {
        var gast = chevrotain.gast;
        function first(prod) {
            if (prod instanceof gast.NonTerminal) {
                // this could in theory cause infinite loops if
                // (1) prod A refs prod B.
                // (2) prod B refs prod A
                // (3) AB can match the empty set
                // in other words a cycle where everything is optional so the first will keep
                // looking ahead for the next optional part and will never exit
                // currently there is no safeguard for this unique edge case because
                // (1) not sure a grammar in which this can happen is useful for anything (productive)
                return first(prod.referencedRule);
            }
            else if (prod instanceof gast.Terminal) {
                return firstForTerminal(prod);
            }
            else if (gast.isSequenceProd(prod)) {
                return firstForSequence(prod);
            }/* istanbul ignore else */ 
            else if (gast.isBranchingProd(prod)) {
                return firstForBranching(prod);
            }
            else {
                /* istanbul ignore next */ throw Error("non exhaustive match");
            }
        }
        _first.first = first;
        function firstForSequence(prod) {
            var firstSet = [];
            var seq = prod.definition;
            var nextSubProdIdx = 0;
            var hasInnerProdsRemaining = seq.length > nextSubProdIdx;
            var currSubProd;
            // so we enter the loop at least once (if the definition is not empty
            var isLastInnerProdOptional = true;
            while (hasInnerProdsRemaining && isLastInnerProdOptional) {
                currSubProd = seq[nextSubProdIdx];
                isLastInnerProdOptional = gast.isOptionalProd(currSubProd);
                firstSet = firstSet.concat(first(currSubProd));
                nextSubProdIdx = nextSubProdIdx + 1;
                hasInnerProdsRemaining = seq.length > nextSubProdIdx;
            }
            return _.uniq(firstSet);
        }
        _first.firstForSequence = firstForSequence;
        function firstForBranching(prod) {
            var allAlternativesFirsts = _.map(prod.definition, function (innerProd) {
                return first(innerProd);
            });
            return _.uniq(_.flatten(allAlternativesFirsts));
        }
        _first.firstForBranching = firstForBranching;
        function firstForTerminal(terminal) {
            return [terminal.terminalType];
        }
        _first.firstForTerminal = firstForTerminal;
    })/* istanbul ignore next */ (first = chevrotain.first || /* istanbul ignore next */ (chevrotain.first = {}));
})/* istanbul ignore next */ (chevrotain || (chevrotain = {}));
var chevrotain;
(function (chevrotain) {
    var rest;
    (function (rest) {
        var g = chevrotain.gast;
        var RestWalker = (function () {
            function RestWalker() {
            }
            RestWalker.prototype.walk = function (prod, prevRest) {
                var _this = this;
                if (prevRest === void 0) { prevRest = []; }
                _.forEach(prod.definition, function (subProd, index) {
                    var currRest = _.drop(prod.definition, index + 1);
                    if (subProd instanceof g.NonTerminal) {
                        _this.walkProdRef(subProd, currRest, prevRest);
                    }
                    else if (subProd instanceof g.Terminal) {
                        _this.walkTerminal(subProd, currRest, prevRest);
                    }
                    else if (subProd instanceof g.Flat) {
                        _this.walkFlat(subProd, currRest, prevRest);
                    }
                    else if (subProd instanceof g.Option) {
                        _this.walkOption(subProd, currRest, prevRest);
                    }
                    else if (subProd instanceof g.RepetitionMandatory) {
                        _this.walkAtLeastOne(subProd, currRest, prevRest);
                    }
                    else if (subProd instanceof g.Repetition) {
                        _this.walkMany(subProd, currRest, prevRest);
                    }/* istanbul ignore else */ 
                    else if (subProd instanceof g.Alternation) {
                        _this.walkOr(subProd, currRest, prevRest);
                    }
                    else {
                        /* istanbul ignore next */ throw Error("non exhaustive match");
                    }
                });
            };
            RestWalker.prototype.walkTerminal = function (terminal, currRest, prevRest) {
            };
            RestWalker.prototype.walkProdRef = function (refProd, currRest, prevRest) {
            };
            RestWalker.prototype.walkFlat = function (flatProd, currRest, prevRest) {
                // ABCDEF => after the D the rest is EF
                var fullOrRest = currRest.concat(prevRest);
                this.walk(flatProd, fullOrRest);
            };
            RestWalker.prototype.walkOption = function (optionProd, currRest, prevRest) {
                // ABC(DE)?F => after the (DE)? the rest is F
                var fullOrRest = currRest.concat(prevRest);
                this.walk(optionProd, fullOrRest);
            };
            RestWalker.prototype.walkAtLeastOne = function (atLeastOneProd, currRest, prevRest) {
                // ABC(DE)+F => after the (DE)+ the rest is (DE)?F
                var fullAtLeastOneRest = [new g.Option(atLeastOneProd.definition)].concat(currRest, prevRest);
                this.walk(atLeastOneProd, fullAtLeastOneRest);
            };
            RestWalker.prototype.walkMany = function (manyProd, currRest, prevRest) {
                // ABC(DE)*F => after the (DE)* the rest is (DE)?F
                var fullManyRest = [new g.Option(manyProd.definition)].concat(currRest, prevRest);
                this.walk(manyProd, fullManyRest);
            };
            RestWalker.prototype.walkOr = function (orProd, currRest, prevRest) {
                var _this = this;
                // ABC(D|E|F)G => when finding the (D|E|F) the rest is G
                var fullOrRest = currRest.concat(prevRest);
                // walk all different alternatives
                _.forEach(orProd.definition, function (alt) {
                    // wrapping each alternative in a single definition wrapper
                    // to avoid errors in computing the rest of that alternative in the invocation to computeInProdFollows
                    // (otherwise for OR([alt1,alt2]) alt2 will be considered in 'rest' of alt1
                    var prodWrapper = new chevrotain.gast.Flat([alt]);
                    _this.walk(prodWrapper, fullOrRest);
                });
            };
            return RestWalker;
        })();
        rest.RestWalker = RestWalker;
    })/* istanbul ignore next */ (rest = chevrotain.rest || /* istanbul ignore next */ (chevrotain.rest = {}));
})/* istanbul ignore next */ (chevrotain || (chevrotain = {}));
var chevrotain;
(function (chevrotain) {
    var follow;
    (function (follow) {
        var g = chevrotain.gast;
        var r = chevrotain.rest;
        var f = chevrotain.first;
        var IN = chevrotain.constants.IN;
        var lang = chevrotain.lang;
        // This ResyncFollowsWalker computes all of the follows required for RESYNC
        // (skipping reference production).
        var ResyncFollowsWalker = (function (_super) {
            __extends(ResyncFollowsWalker, _super);
            function ResyncFollowsWalker(topProd) {
                _super.call(this);
                this.topProd = topProd;
                this.follows = new lang.HashTable();
            }
            ResyncFollowsWalker.prototype.startWalking = function () {
                this.walk(this.topProd);
                return this.follows;
            };
            ResyncFollowsWalker.prototype.walkTerminal = function (terminal, currRest, prevRest) {
                // do nothing! just like in the public sector after 13:00
            };
            ResyncFollowsWalker.prototype.walkProdRef = function (refProd, currRest, prevRest) {
                var followName = buildBetweenProdsFollowPrefix(refProd.referencedRule, refProd.occurrenceInParent) + this.topProd.name;
                var fullRest = currRest.concat(prevRest);
                var restProd = new g.Flat(fullRest);
                var t_in_topProd_follows = f.first(restProd);
                this.follows.put(followName, t_in_topProd_follows);
            };
            return ResyncFollowsWalker;
        })(r.RestWalker);
        follow.ResyncFollowsWalker = ResyncFollowsWalker;
        function computeAllProdsFollows(topProductions) {
            var reSyncFollows = new lang.HashTable();
            _.forEach(topProductions, function (topProd) {
                var currRefsFollow = new ResyncFollowsWalker(topProd).startWalking();
                reSyncFollows.putAll(currRefsFollow);
            });
            return reSyncFollows;
        }
        follow.computeAllProdsFollows = computeAllProdsFollows;
        function buildBetweenProdsFollowPrefix(inner, occurenceInParent) {
            return inner.name + occurenceInParent + IN;
        }
        follow.buildBetweenProdsFollowPrefix = buildBetweenProdsFollowPrefix;
        function buildInProdFollowPrefix(terminal) {
            var terminalName = chevrotain.tokenName(terminal.terminalType);
            return terminalName + terminal.occurrenceInParent + IN;
        }
        follow.buildInProdFollowPrefix = buildInProdFollowPrefix;
    })/* istanbul ignore next */ (follow = chevrotain.follow || /* istanbul ignore next */ (chevrotain.follow = {}));
})/* istanbul ignore next */ (chevrotain || (chevrotain = {}));
var chevrotain;
(function (chevrotain) {
    var interpreter;
    (function (interpreter) {
        var g = chevrotain.gast;
        var f = chevrotain.first;
        var r = chevrotain.rest;
        var AbstractNextPossibleTokensWalker = (function (_super) {
            __extends(AbstractNextPossibleTokensWalker, _super);
            function AbstractNextPossibleTokensWalker(topProd, path) {
                _super.call(this);
                this.topProd = topProd;
                this.path = path;
                this.possibleTokTypes = [];
                this.nextProductionName = "";
                this.nextProductionOccurrence = 0;
                this.found = false;
                this.isAtEndOfPath = false;
            }
            AbstractNextPossibleTokensWalker.prototype.startWalking = function () {
                this.found = false;
                if (this.path.ruleStack[0] !== this.topProd.name) {
                    throw Error("The path does not start with the walker's top Rule!");
                }
                // immutable for the win
                this.ruleStack = _.clone(this.path.ruleStack).reverse(); // intelij bug requires assertion
                this.occurrenceStack = _.clone(this.path.occurrenceStack).reverse(); // intelij bug requires assertion
                // already verified that the first production is valid, we now seek the 2nd production
                this.ruleStack.pop();
                this.occurrenceStack.pop();
                this.updateExpectedNext();
                this.walk(this.topProd);
                return this.possibleTokTypes;
            };
            AbstractNextPossibleTokensWalker.prototype.walk = function (prod, prevRest) {
                if (prevRest === void 0) { prevRest = []; }
                // stop scanning once we found the path
                if (!this.found) {
                    _super.prototype.walk.call(this, prod, prevRest);
                }
            };
            AbstractNextPossibleTokensWalker.prototype.walkProdRef = function (refProd, currRest, prevRest) {
                // found the next production, need to keep walking in it
                if (refProd.referencedRule.name === this.nextProductionName && refProd.occurrenceInParent === this.nextProductionOccurrence) {
                    var fullRest = currRest.concat(prevRest);
                    this.updateExpectedNext();
                    this.walk(refProd.referencedRule, fullRest);
                }
            };
            AbstractNextPossibleTokensWalker.prototype.updateExpectedNext = function () {
                // need to consume the Terminal
                if (_.isEmpty(this.ruleStack)) {
                    // must reset nextProductionXXX to avoid walking down another Top Level production while what we are
                    // really seeking is the last Terminal...
                    this.nextProductionName = "";
                    this.nextProductionOccurrence = 0;
                    this.isAtEndOfPath = true;
                }
                else {
                    this.nextProductionName = this.ruleStack.pop();
                    this.nextProductionOccurrence = this.occurrenceStack.pop();
                }
            };
            return AbstractNextPossibleTokensWalker;
        })(r.RestWalker);
        interpreter.AbstractNextPossibleTokensWalker = AbstractNextPossibleTokensWalker;
        var NextAfterTokenWalker = (function (_super) {
            __extends(NextAfterTokenWalker, _super);
            function NextAfterTokenWalker(topProd, path) {
                _super.call(this, topProd, path);
                this.path = path;
                this.nextTerminalName = "";
                this.nextTerminalOccurrence = 0;
                this.nextTerminalName = chevrotain.tokenName(this.path.lastTok);
                this.nextTerminalOccurrence = this.path.lastTokOccurrence;
            }
            NextAfterTokenWalker.prototype.walkTerminal = function (terminal, currRest, prevRest) {
                if (this.isAtEndOfPath && chevrotain.tokenName(terminal.terminalType) === this.nextTerminalName && terminal.occurrenceInParent === this.nextTerminalOccurrence && !(this.found)) {
                    var fullRest = currRest.concat(prevRest);
                    var restProd = new g.Flat(fullRest);
                    this.possibleTokTypes = f.first(restProd);
                    this.found = true;
                }
            };
            return NextAfterTokenWalker;
        })(AbstractNextPossibleTokensWalker);
        interpreter.NextAfterTokenWalker = NextAfterTokenWalker;
        var NextInsideOptionWalker = (function (_super) {
            __extends(NextInsideOptionWalker, _super);
            function NextInsideOptionWalker(topProd, path) {
                _super.call(this, topProd, path);
                this.path = path;
                this.nextOptionOccurrence = 0;
                this.nextOptionOccurrence = this.path.occurrence;
            }
            NextInsideOptionWalker.prototype.walkOption = function (optionProd, currRest, prevRest) {
                if (this.isAtEndOfPath && optionProd.occurrenceInParent === this.nextOptionOccurrence && !(this.found)) {
                    var restProd = new g.Flat(optionProd.definition);
                    this.possibleTokTypes = f.first(restProd);
                    this.found = true;
                }
                else {
                    _super.prototype.walkOption.call(this, optionProd, currRest, prevRest);
                }
            };
            return NextInsideOptionWalker;
        })(AbstractNextPossibleTokensWalker);
        interpreter.NextInsideOptionWalker = NextInsideOptionWalker;
        var NextInsideManyWalker = (function (_super) {
            __extends(NextInsideManyWalker, _super);
            function NextInsideManyWalker(topProd, path) {
                _super.call(this, topProd, path);
                this.path = path;
                this.nextOccurrence = 0;
                this.nextOccurrence = this.path.occurrence;
            }
            NextInsideManyWalker.prototype.walkMany = function (manyProd, currRest, prevRest) {
                if (this.isAtEndOfPath && manyProd.occurrenceInParent === this.nextOccurrence && !(this.found)) {
                    var restProd = new g.Flat(manyProd.definition);
                    this.possibleTokTypes = f.first(restProd);
                    this.found = true;
                }
                else {
                    _super.prototype.walkMany.call(this, manyProd, currRest, prevRest);
                }
            };
            return NextInsideManyWalker;
        })(AbstractNextPossibleTokensWalker);
        interpreter.NextInsideManyWalker = NextInsideManyWalker;
        var NextInsideAtLeastOneWalker = (function (_super) {
            __extends(NextInsideAtLeastOneWalker, _super);
            function NextInsideAtLeastOneWalker(topProd, path) {
                _super.call(this, topProd, path);
                this.path = path;
                this.nextOccurrence = 0;
                this.nextOccurrence = this.path.occurrence;
            }
            NextInsideAtLeastOneWalker.prototype.walkAtLeastOne = function (atLeastOneProd, currRest, prevRest) {
                if (this.isAtEndOfPath && atLeastOneProd.occurrenceInParent === this.nextOccurrence && !(this.found)) {
                    var restProd = new g.Flat(atLeastOneProd.definition);
                    this.possibleTokTypes = f.first(restProd);
                    this.found = true;
                }
                else {
                    _super.prototype.walkAtLeastOne.call(this, atLeastOneProd, currRest, prevRest);
                }
            };
            return NextInsideAtLeastOneWalker;
        })(AbstractNextPossibleTokensWalker);
        interpreter.NextInsideAtLeastOneWalker = NextInsideAtLeastOneWalker;
        var NextInsideOrWalker = (function (_super) {
            __extends(NextInsideOrWalker, _super);
            function NextInsideOrWalker(topRule, occurrence) {
                _super.call(this);
                this.topRule = topRule;
                this.occurrence = occurrence;
                this.result = [];
            }
            NextInsideOrWalker.prototype.startWalking = function () {
                this.walk(this.topRule);
                return this.result;
            };
            NextInsideOrWalker.prototype.walkOr = function (orProd, currRest, prevRest) {
                if (orProd.occurrenceInParent === this.occurrence) {
                    this.result = _.map(orProd.definition, function (alt) {
                        var altWrapper = new chevrotain.gast.Flat([alt]);
                        return f.first(altWrapper);
                    });
                }
                else {
                    _super.prototype.walkOr.call(this, orProd, currRest, prevRest);
                }
            };
            return NextInsideOrWalker;
        })(r.RestWalker);
        interpreter.NextInsideOrWalker = NextInsideOrWalker;
        /**
         * This walker only "walks" a single "TOP" level in the Grammar Ast, this means
         * it never "follows" production refs
         */
        var AbstractNextTerminalAfterProductionWalker = (function (_super) {
            __extends(AbstractNextTerminalAfterProductionWalker, _super);
            function AbstractNextTerminalAfterProductionWalker(topRule, occurrence) {
                _super.call(this);
                this.topRule = topRule;
                this.occurrence = occurrence;
                this.result = { token: undefined, occurrence: undefined, isEndOfRule: undefined };
            }
            AbstractNextTerminalAfterProductionWalker.prototype.startWalking = function () {
                this.walk(this.topRule);
                return this.result;
            };
            return AbstractNextTerminalAfterProductionWalker;
        })(r.RestWalker);
        interpreter.AbstractNextTerminalAfterProductionWalker = AbstractNextTerminalAfterProductionWalker;
        var NextTerminalAfterManyWalker = (function (_super) {
            __extends(NextTerminalAfterManyWalker, _super);
            function NextTerminalAfterManyWalker() {
                _super.apply(this, arguments);
            }
            NextTerminalAfterManyWalker.prototype.walkMany = function (manyProd, currRest, prevRest) {
                if (manyProd.occurrenceInParent === this.occurrence) {
                    var firstAfterMany = _.first(currRest.concat(prevRest));
                    this.result.isEndOfRule = firstAfterMany === undefined;
                    if (firstAfterMany instanceof chevrotain.gast.Terminal) {
                        this.result.token = firstAfterMany.terminalType;
                        this.result.occurrence = firstAfterMany.occurrenceInParent;
                    }
                }
                else {
                    _super.prototype.walkMany.call(this, manyProd, currRest, prevRest);
                }
            };
            return NextTerminalAfterManyWalker;
        })(AbstractNextTerminalAfterProductionWalker);
        interpreter.NextTerminalAfterManyWalker = NextTerminalAfterManyWalker;
        var NextTerminalAfterAtLeastOneWalker = (function (_super) {
            __extends(NextTerminalAfterAtLeastOneWalker, _super);
            function NextTerminalAfterAtLeastOneWalker() {
                _super.apply(this, arguments);
            }
            NextTerminalAfterAtLeastOneWalker.prototype.walkAtLeastOne = function (atLeastOneProd, currRest, prevRest) {
                if (atLeastOneProd.occurrenceInParent === this.occurrence) {
                    var firstAfterAtLeastOne = _.first(currRest.concat(prevRest));
                    this.result.isEndOfRule = firstAfterAtLeastOne === undefined;
                    if (firstAfterAtLeastOne instanceof chevrotain.gast.Terminal) {
                        this.result.token = firstAfterAtLeastOne.terminalType;
                        this.result.occurrence = firstAfterAtLeastOne.occurrenceInParent;
                    }
                }
                else {
                    _super.prototype.walkAtLeastOne.call(this, atLeastOneProd, currRest, prevRest);
                }
            };
            return NextTerminalAfterAtLeastOneWalker;
        })(AbstractNextTerminalAfterProductionWalker);
        interpreter.NextTerminalAfterAtLeastOneWalker = NextTerminalAfterAtLeastOneWalker;
    })/* istanbul ignore next */ (interpreter = chevrotain.interpreter || /* istanbul ignore next */ (chevrotain.interpreter = {}));
})/* istanbul ignore next */ (chevrotain || (chevrotain = {}));
/**
 *
module used to cache static information about parsers,
 */
var chevrotain;
(function (chevrotain) {
    var cache;
    (function (cache) {
        cache.CLASS_TO_VALIDTATION_ERRORS = new chevrotain.lang.HashTable();
        cache.CLASS_TO_SELF_ANALYSIS_DONE = new chevrotain.lang.HashTable();
        cache.CLASS_TO_GRAMMAR_PRODUCTIONS = new chevrotain.lang.HashTable();
        function getProductionsForClass(className) {
            return getFromNestedHashTable(className, cache.CLASS_TO_GRAMMAR_PRODUCTIONS);
        }
        cache.getProductionsForClass = getProductionsForClass;
        cache.CLASS_TO_RESYNC_FOLLOW_SETS = new chevrotain.lang.HashTable();
        function getResyncFollowsForClass(className) {
            return getFromNestedHashTable(className, cache.CLASS_TO_RESYNC_FOLLOW_SETS);
        }
        cache.getResyncFollowsForClass = getResyncFollowsForClass;
        function setResyncFollowsForClass(className, followSet) {
            cache.CLASS_TO_RESYNC_FOLLOW_SETS.put(className, followSet);
        }
        cache.setResyncFollowsForClass = setResyncFollowsForClass;
        cache.CLASS_TO_LOOKAHEAD_FUNCS = new chevrotain.lang.HashTable();
        function getLookaheadFuncsForClass(className) {
            return getFromNestedHashTable(className, cache.CLASS_TO_LOOKAHEAD_FUNCS);
        }
        cache.getLookaheadFuncsForClass = getLookaheadFuncsForClass;
        cache.CLASS_TO_FIRST_AFTER_REPETITION = new chevrotain.lang.HashTable();
        function getFirstAfterRepForClass(className) {
            return getFromNestedHashTable(className, cache.CLASS_TO_FIRST_AFTER_REPETITION);
        }
        cache.getFirstAfterRepForClass = getFirstAfterRepForClass;
        cache.CLASS_TO_OR_LA_CACHE = new chevrotain.lang.HashTable();
        cache.CLASS_TO_MANY_LA_CACHE = new chevrotain.lang.HashTable();
        cache.CLASS_TO_AT_LEAST_ONE_LA_CACHE = new chevrotain.lang.HashTable();
        cache.CLASS_TO_OPTION_LA_CACHE = new chevrotain.lang.HashTable();
        // TODO: CONST in typescript 1.5
        // TODO reflective test to verify this has not changed, for example (OPTION6 added)
        cache.MAX_OCCURRENCE_INDEX = 5;
        function initLookAheadKeyCache(className) {
            cache.CLASS_TO_OR_LA_CACHE[className] = new Array(cache.MAX_OCCURRENCE_INDEX);
            cache.CLASS_TO_MANY_LA_CACHE[className] = new Array(cache.MAX_OCCURRENCE_INDEX);
            cache.CLASS_TO_AT_LEAST_ONE_LA_CACHE[className] = new Array(cache.MAX_OCCURRENCE_INDEX);
            cache.CLASS_TO_OPTION_LA_CACHE[className] = new Array(cache.MAX_OCCURRENCE_INDEX);
            initSingleLookAheadKeyCache(cache.CLASS_TO_OR_LA_CACHE[className]);
            initSingleLookAheadKeyCache(cache.CLASS_TO_MANY_LA_CACHE[className]);
            initSingleLookAheadKeyCache(cache.CLASS_TO_AT_LEAST_ONE_LA_CACHE[className]);
            initSingleLookAheadKeyCache(cache.CLASS_TO_OPTION_LA_CACHE[className]);
        }
        cache.initLookAheadKeyCache = initLookAheadKeyCache;
        function initSingleLookAheadKeyCache(laCache) {
            for (var i = 0; i < cache.MAX_OCCURRENCE_INDEX; i++) {
                laCache[i] = new chevrotain.lang.HashTable();
            }
        }
        function getFromNestedHashTable(className, hashTable) {
            var result = hashTable.get(className);
            if (result === undefined) {
                hashTable.put(className, new chevrotain.lang.HashTable());
                result = hashTable.get(className);
            }
            return result;
        }
    })/* istanbul ignore next */ (cache = chevrotain.cache || /* istanbul ignore next */ (chevrotain.cache = {}));
})/* istanbul ignore next */ (chevrotain || (chevrotain = {}));
var chevrotain;
(function (chevrotain) {
    var lookahead;
    (function (lookahead) {
        var gast = chevrotain.gast;
        var interp = chevrotain.interpreter;
        var f = chevrotain.first;
        function buildLookaheadForTopLevel(rule) {
            var restProd = new gast.Flat(rule.definition);
            var possibleTokTypes = f.first(restProd);
            return getSimpleLookahead(possibleTokTypes);
        }
        lookahead.buildLookaheadForTopLevel = buildLookaheadForTopLevel;
        function buildLookaheadForOption(optionOccurrence, ruleGrammar) {
            return buildLookAheadForGrammarProd(interp.NextInsideOptionWalker, optionOccurrence, ruleGrammar);
        }
        lookahead.buildLookaheadForOption = buildLookaheadForOption;
        function buildLookaheadForMany(manyOccurrence, ruleGrammar) {
            return buildLookAheadForGrammarProd(interp.NextInsideManyWalker, manyOccurrence, ruleGrammar);
        }
        lookahead.buildLookaheadForMany = buildLookaheadForMany;
        function buildLookaheadForAtLeastOne(manyOccurrence, ruleGrammar) {
            return buildLookAheadForGrammarProd(interp.NextInsideAtLeastOneWalker, manyOccurrence, ruleGrammar);
        }
        lookahead.buildLookaheadForAtLeastOne = buildLookaheadForAtLeastOne;
        function buildLookaheadForOr(orOccurrence, ruleGrammar, ignoreAmbiguities) {
            if (ignoreAmbiguities === void 0) { ignoreAmbiguities = false; }
            var alternativesTokens = new interp.NextInsideOrWalker(ruleGrammar, orOccurrence).startWalking();
            if (!ignoreAmbiguities) {
                var altsAmbiguityErrors = checkAlternativesAmbiguities(alternativesTokens);
                if (!_.isEmpty(altsAmbiguityErrors)) {
                    var errorMessages = _.map(altsAmbiguityErrors, function (currAmbiguity) {
                        return ("Ambiguous alternatives " + currAmbiguity.alts.join(" ,") + " in OR" + orOccurrence + " inside " + ruleGrammar.name + " ") + ("Rule, " + chevrotain.tokenName(currAmbiguity.token) + " may appears as the first Terminal in all these alternatives.\n");
                    });
                    throw new Error(errorMessages.join("\n ---------------- \n") + "To Resolve this, either: \n" + "1. refactor your grammar to be LL(1)\n" + "2. provide explicit lookahead functions in the form {WHEN:laFunc, THEN_DO:...}\n" + "3. Add ignore arg to this OR Production:\n" + "OR([], 'msg', recognizer.IGNORE_AMBIGUITIES)\n" + "In that case the parser will always pick the first alternative that" + " matches and ignore all the others");
                }
            }
            /**
             * This will return the Index of the alternative to take or -1 if none of the alternatives match
             */
            return function () {
                var nextToken = this.NEXT_TOKEN();
                for (var i = 0; i < alternativesTokens.length; i++) {
                    var currAltTokens = alternativesTokens[i];
                    for (var j = 0; j < currAltTokens.length; j++) {
                        if (nextToken instanceof currAltTokens[j]) {
                            return i;
                        }
                    }
                }
                return -1;
            };
        }
        lookahead.buildLookaheadForOr = buildLookaheadForOr;
        function checkAlternativesAmbiguities(alternativesTokens) {
            var allTokensFlat = _.flatten(alternativesTokens);
            var uniqueTokensFlat = _.uniq(allTokensFlat);
            var tokensToAltsIndicesItAppearsIn = _.map(uniqueTokensFlat, function (seekToken) {
                var altsCurrTokenAppearsIn = _.pick(alternativesTokens, function (altToLookIn) {
                    return _.find(altToLookIn, function (currToken) {
                        return currToken === seekToken;
                    });
                });
                var altsIndicesTokenAppearsIn = _.map(_.keys(altsCurrTokenAppearsIn), function (index) {
                    return parseInt(index, 10) + 1;
                });
                return { token: seekToken, alts: altsIndicesTokenAppearsIn };
            });
            var tokensToAltsIndicesWithAmbiguity = _.filter(tokensToAltsIndicesItAppearsIn, function (tokAndAltsItAppearsIn) {
                return tokAndAltsItAppearsIn.alts.length > 1;
            });
            return tokensToAltsIndicesWithAmbiguity;
        }
        lookahead.checkAlternativesAmbiguities = checkAlternativesAmbiguities;
        function buildLookAheadForGrammarProd(prodWalker, ruleOccurrence, ruleGrammar) {
            var path = {
                ruleStack: [ruleGrammar.name],
                occurrenceStack: [1],
                occurrence: ruleOccurrence
            };
            var walker = new prodWalker(ruleGrammar, path);
            var possibleNextTokTypes = walker.startWalking();
            return getSimpleLookahead(possibleNextTokTypes);
        }
        function getSimpleLookahead(possibleNextTokTypes) {
            return function () {
                var nextToken = this.NEXT_TOKEN();
                for (var j = 0; j < possibleNextTokTypes.length; j++) {
                    if (nextToken instanceof possibleNextTokTypes[j]) {
                        return true;
                    }
                }
                return false;
            };
        }
    })/* istanbul ignore next */ (lookahead = chevrotain.lookahead || /* istanbul ignore next */ (chevrotain.lookahead = {}));
})/* istanbul ignore next */ (chevrotain || (chevrotain = {}));
// module for building the GAst representation of a Grammar
var chevrotain;
(function (chevrotain) {
    var gastBuilder;
    (function (gastBuilder) {
        var r = chevrotain.range;
        var gast = chevrotain.gast;
        (function (ProdType) {
            ProdType[ProdType["OPTION"] = 0] = "OPTION";
            ProdType[ProdType["OR"] = 1] = "OR";
            ProdType[ProdType["MANY"] = 2] = "MANY";
            ProdType[ProdType["AT_LEAST_ONE"] = 3] = "AT_LEAST_ONE";
            ProdType[ProdType["REF"] = 4] = "REF";
            ProdType[ProdType["TERMINAL"] = 5] = "TERMINAL";
            ProdType[ProdType["FLAT"] = 6] = "FLAT";
        })(gastBuilder.ProdType || (gastBuilder.ProdType = {}));
        var ProdType = gastBuilder.ProdType;
        // TODO: this regexp creates a constraint on names of Terminals (Tokens).
        // TODO: document and consider reducing the constraint by expanding the regexp
        var terminalRegEx = /\.\s*CONSUME(\d)?\s*\(\s*(?:[a-zA-Z_$]\w*\s*\.\s*)*([a-zA-Z_$]\w*)/;
        var terminalRegGlobal = new RegExp(terminalRegEx.source, "g");
        var refRegEx = /\.\s*SUBRULE(\d)?\s*\(\s*(?:[a-zA-Z_$]\w*\s*\.\s*)*([a-zA-Z_$]\w*)/;
        var refRegExGlobal = new RegExp(refRegEx.source, "g");
        var optionRegEx = /\.\s*OPTION(\d)?\s*\(/;
        var optionRegExGlobal = new RegExp(optionRegEx.source, "g");
        var manyRegEx = /.\s*MANY(\d)?\s*\(/;
        var manyRegExGlobal = new RegExp(manyRegEx.source, "g");
        var atLeastOneRegEx = /\.\s*AT_LEAST_ONE(\d)?\s*\(/;
        var atLeastOneRegExGlobal = new RegExp(atLeastOneRegEx.source, "g");
        var orRegEx = /\.\s*OR(\d)?\s*\(/;
        var orRegExGlobal = new RegExp(orRegEx.source, "g");
        var orPartRegEx = /{\s*(WHEN|ALT)\s*:/g;
        gastBuilder.terminalNameToConstructor = {};
        function buildTopProduction(impelText, name, terminals) {
            // pseudo state. so little state does not yet mandate the complexity of wrapping in a class...
            // TODO: this is confusing, might be time to create a class..
            gastBuilder.terminalNameToConstructor = terminals;
            // the top most range must strictly contain all the other ranges
            // which is why we prefix the text with " " (curr Range impel is only for positive ranges)
            impelText = " " + impelText;
            var txtWithoutComments = removeComments(" " + impelText);
            // TODO: consider removing literal strings too to avoid future errors (literal string with ')' for example)
            var prodRanges = createRanges(txtWithoutComments);
            var topRange = new r.Range(0, impelText.length + 2);
            return buildTopLevel(name, topRange, prodRanges);
        }
        gastBuilder.buildTopProduction = buildTopProduction;
        function buildTopLevel(name, topRange, allRanges) {
            var topLevelProd = new gast.Rule(name, []);
            return buildAbstractProd(topLevelProd, topRange, allRanges);
        }
        function buildProdGast(prodRange, allRanges) {
            "use strict";
            switch (prodRange.type) {
                case 3 /* AT_LEAST_ONE */:
                    return buildAtLeastOneProd(prodRange, allRanges);
                case 2 /* MANY */:
                    return buildManyProd(prodRange, allRanges);
                case 0 /* OPTION */:
                    return buildOptionProd(prodRange, allRanges);
                case 1 /* OR */:
                    return buildOrProd(prodRange, allRanges);
                case 6 /* FLAT */:
                    return buildAbstractProd(new gast.Flat([]), prodRange.range, allRanges);
                case 4 /* REF */:
                    return buildRefProd(prodRange);
                case 5 /* TERMINAL */:
                    return buildTerminalProd(prodRange);
                /* istanbul ignore next */ default:
                    /* istanbul ignore next */ throw Error("non exhaustive match");
            }
        }
        gastBuilder.buildProdGast = buildProdGast;
        function buildRefProd(prodRange) {
            var reResult = refRegEx.exec(prodRange.text);
            var isImplicitOccurrenceIdx = reResult[1] === undefined;
            var refOccurrence = isImplicitOccurrenceIdx ? 1 : parseInt(reResult[1], 10);
            var refProdName = reResult[2];
            var newRef = new gast.NonTerminal(refProdName, undefined, refOccurrence);
            newRef.implicitOccurrenceIndex = isImplicitOccurrenceIdx;
            return newRef;
        }
        function buildTerminalProd(prodRange) {
            var reResult = terminalRegEx.exec(prodRange.text);
            var isImplicitOccurrenceIdx = reResult[1] === undefined;
            var terminalOccurrence = isImplicitOccurrenceIdx ? 1 : parseInt(reResult[1], 10);
            var terminalName = reResult[2];
            var terminalType = gastBuilder.terminalNameToConstructor[terminalName];
            if (!terminalType) {
                throw Error("Terminal Token name: " + terminalName + " not found");
            }
            var newTerminal = new gast.Terminal(terminalType, terminalOccurrence);
            newTerminal.implicitOccurrenceIndex = isImplicitOccurrenceIdx;
            return newTerminal;
        }
        function buildProdWithOccurrence(regEx, prodInstance, prodRange, allRanges) {
            var reResult = regEx.exec(prodRange.text);
            var isImplicitOccurrenceIdx = reResult[1] === undefined;
            prodInstance.occurrenceInParent = isImplicitOccurrenceIdx ? 1 : parseInt(reResult[1], 10);
            prodInstance.implicitOccurrenceIndex = isImplicitOccurrenceIdx;
            // <any> due to intellij bugs
            return buildAbstractProd(prodInstance, prodRange.range, allRanges);
        }
        function buildAtLeastOneProd(prodRange, allRanges) {
            return buildProdWithOccurrence(atLeastOneRegEx, new gast.RepetitionMandatory([]), prodRange, allRanges);
        }
        function buildManyProd(prodRange, allRanges) {
            return buildProdWithOccurrence(manyRegEx, new gast.Repetition([]), prodRange, allRanges);
        }
        function buildOptionProd(prodRange, allRanges) {
            return buildProdWithOccurrence(optionRegEx, new gast.Option([]), prodRange, allRanges);
        }
        function buildOrProd(prodRange, allRanges) {
            return buildProdWithOccurrence(orRegEx, new gast.Alternation([]), prodRange, allRanges);
        }
        function buildAbstractProd(prod, topLevelRange, allRanges) {
            var secondLevelProds = getDirectlyContainedRanges(topLevelRange, allRanges);
            var secondLevelInOrder = _.sortBy(secondLevelProds, function (prodRng) {
                return prodRng.range.start;
            });
            var definition = [];
            _.forEach(secondLevelInOrder, function (prodRng) {
                definition.push(buildProdGast(prodRng, allRanges));
            });
            // IntelliJ bug workaround
            prod.definition = definition;
            return prod;
        }
        function getDirectlyContainedRanges(y, prodRanges) {
            return _.filter(prodRanges, function (x) {
                var isXDescendantOfY = y.strictlyContainsRange(x.range);
                var xDoesNotHaveAnyAncestorWhichIsDecendantOfY = _.every(prodRanges, function (maybeAnotherParent) {
                    var isParentOfX = maybeAnotherParent.range.strictlyContainsRange(x.range);
                    var isChildOfY = maybeAnotherParent.range.isStrictlyContainedInRange(y);
                    return !(isParentOfX && isChildOfY);
                });
                return isXDescendantOfY && xDoesNotHaveAnyAncestorWhichIsDecendantOfY;
            });
        }
        gastBuilder.getDirectlyContainedRanges = getDirectlyContainedRanges;
        var singleLineCommentRegEx = /\/\/.*/g;
        var multiLineCommentRegEx = /\/\*([^*]|[\r\n]|(\*+([^*/]|[\r\n])))*\*+\//g;
        function removeComments(text) {
            var noSingleLine = text.replace(singleLineCommentRegEx, "");
            var noComments = noSingleLine.replace(multiLineCommentRegEx, "");
            return noComments;
        }
        gastBuilder.removeComments = removeComments;
        function createRanges(text) {
            var terminalRanges = createTerminalRanges(text);
            var refsRanges = createRefsRanges(text);
            var atLeastOneRanges = createAtLeastOneRanges(text);
            var manyRanges = createManyRanges(text);
            var optionRanges = createOptionRanges(text);
            var orRanges = createOrRanges(text);
            return _.union(terminalRanges, refsRanges, atLeastOneRanges, atLeastOneRanges, manyRanges, optionRanges, orRanges);
        }
        gastBuilder.createRanges = createRanges;
        function createTerminalRanges(text) {
            return createRefOrTerminalProdRangeInternal(text, 5 /* TERMINAL */, terminalRegGlobal);
        }
        gastBuilder.createTerminalRanges = createTerminalRanges;
        function createRefsRanges(text) {
            return createRefOrTerminalProdRangeInternal(text, 4 /* REF */, refRegExGlobal);
        }
        gastBuilder.createRefsRanges = createRefsRanges;
        function createAtLeastOneRanges(text) {
            return createOperatorProdRangeParenthesis(text, 3 /* AT_LEAST_ONE */, atLeastOneRegExGlobal);
        }
        gastBuilder.createAtLeastOneRanges = createAtLeastOneRanges;
        function createManyRanges(text) {
            return createOperatorProdRangeParenthesis(text, 2 /* MANY */, manyRegExGlobal);
        }
        gastBuilder.createManyRanges = createManyRanges;
        function createOptionRanges(text) {
            return createOperatorProdRangeParenthesis(text, 0 /* OPTION */, optionRegExGlobal);
        }
        gastBuilder.createOptionRanges = createOptionRanges;
        function createOrRanges(text) {
            var orRanges = createOperatorProdRangeParenthesis(text, 1 /* OR */, orRegExGlobal);
            // have to split up the OR cases into separate FLAT productions
            // (A |BB | CDE) ==> or.def[0] --> FLAT(A) , or.def[1] --> FLAT(BB) , or.def[2] --> FLAT(CCDE)
            var orSubPartsRanges = createOrPartRanges(orRanges);
            return _.union(orRanges, orSubPartsRanges);
        }
        gastBuilder.createOrRanges = createOrRanges;
        var findClosingCurly = _.partial(findClosingOffset, "{", "}");
        var findClosingParen = _.partial(findClosingOffset, "(", ")");
        function createOrPartRanges(orRanges) {
            var orPartRanges = [];
            _.forEach(orRanges, function (orRange) {
                var currOrParts = createOperatorProdRangeInternal(orRange.text, 6 /* FLAT */, orPartRegEx, findClosingCurly);
                var currOrRangeStart = orRange.range.start;
                // fix offsets as we are working on a subset of the text
                _.forEach(currOrParts, function (orPart) {
                    orPart.range.start += currOrRangeStart;
                    orPart.range.end += currOrRangeStart;
                });
                orPartRanges = _.union(orPartRanges, currOrParts);
            });
            var uniqueOrPartRanges = _.uniq(orPartRanges, function (prodRange) {
                // using "~" as a separator for the identify function as its not a valid char in javascript
                return prodRange.type + "~" + prodRange.range.start + "~" + prodRange.range.end + "~" + prodRange.text;
            });
            return uniqueOrPartRanges;
        }
        gastBuilder.createOrPartRanges = createOrPartRanges;
        function createRefOrTerminalProdRangeInternal(text, prodType, pattern) {
            var prodRanges = [];
            var matched;
            while (matched = pattern.exec(text)) {
                var start = matched.index;
                var stop = pattern.lastIndex;
                var currRange = new r.Range(start, stop);
                var currText = matched[0];
                prodRanges.push({ range: currRange, text: currText, type: prodType });
            }
            return prodRanges;
        }
        function createOperatorProdRangeParenthesis(text, prodType, pattern) {
            return createOperatorProdRangeInternal(text, prodType, pattern, findClosingParen);
        }
        function createOperatorProdRangeInternal(text, prodType, pattern, findTerminatorOffSet) {
            var operatorRanges = [];
            var matched;
            while (matched = pattern.exec(text)) {
                var start = matched.index;
                var stop = findTerminatorOffSet(start + matched[0].length, text);
                var currRange = new r.Range(start, stop);
                var currText = text.substr(start, stop - start + 1);
                operatorRanges.push({ range: currRange, text: currText, type: prodType });
            }
            return operatorRanges;
        }
        function findClosingOffset(opening, closing, start, text) {
            var parenthesisStack = [1];
            var i = 0;
            while (!(_.isEmpty(parenthesisStack)) && i + start < text.length) {
                // TODO: verify this is indeed meant to skip the first character?
                i++;
                var nextChar = text.charAt(start + i);
                if (nextChar === opening) {
                    parenthesisStack.push(1);
                }
                else if (nextChar === closing) {
                    parenthesisStack.pop();
                }
            }
            // valid termination of the search loop
            if (_.isEmpty(parenthesisStack)) {
                return i + start;
            }
            else {
                throw new Error("INVALID INPUT TEXT, UNTERMINATED PARENTHESIS");
            }
        }
        gastBuilder.findClosingOffset = findClosingOffset;
        var GastRefResolverVisitor = (function (_super) {
            __extends(GastRefResolverVisitor, _super);
            function GastRefResolverVisitor(nameToProd) {
                _super.call(this);
                this.nameToProd = nameToProd;
            }
            GastRefResolverVisitor.prototype.resolveRefs = function () {
                var _this = this;
                _.forEach(this.nameToProd.values(), function (prod) {
                    prod.accept(_this);
                });
            };
            GastRefResolverVisitor.prototype.visitNonTerminal = function (node) {
                var ref = this.nameToProd.get(node.nonTerminalName);
                if (!ref) {
                    throw Error("Invalid grammar, reference to rule which is not defined --> " + node.nonTerminalName);
                }
                node.referencedRule = ref;
            };
            return GastRefResolverVisitor;
        })(gast.GAstVisitor);
        gastBuilder.GastRefResolverVisitor = GastRefResolverVisitor;
    })/* istanbul ignore next */ (gastBuilder = chevrotain.gastBuilder || /* istanbul ignore next */ (chevrotain.gastBuilder = {}));
})/* istanbul ignore next */ (chevrotain || (chevrotain = {}));
// TODO: rename to validations ?
var chevrotain;
(function (chevrotain) {
    var validations;
    (function (validations) {
        var gast = chevrotain.gast;
        function validateGrammar(topLevels) {
            var errorMessagesArrs = _.map(topLevels, validateSingleTopLevelRule);
            return _.flatten(errorMessagesArrs);
        }
        validations.validateGrammar = validateGrammar;
        function validateSingleTopLevelRule(topLevelRule) {
            var collectorVisitor = new OccurrenceValidationCollector();
            topLevelRule.accept(collectorVisitor);
            var allRuleProductions = collectorVisitor.allProductions;
            var productionGroups = _.groupBy(allRuleProductions, identifyProductionForDuplicates);
            var duplicates = _.pick(productionGroups, function (currGroup) {
                return currGroup.length > 1;
            });
            var errorMsgs = _.map(duplicates, function (currDuplicates) {
                return createDuplicatesErrorMessage(currDuplicates, topLevelRule.name);
            });
            return errorMsgs;
        }
        function createDuplicatesErrorMessage(duplicateProds, topLevelName) {
            var firstProd = _.first(duplicateProds);
            var index = firstProd.occurrenceInParent;
            var dslName = gast.getProductionDslName(firstProd);
            var extraArgument = getExtraProductionArgument(firstProd);
            var msg = "->" + dslName + "<- with occurrence index: ->" + index + "<-\n                  " + (extraArgument ? "and argument: " + extraArgument : "") + "\n                  appears more than once (" + duplicateProds.length + " times) in the top level rule: " + topLevelName + ".\n                  " + (index === 1 ? "note that " + dslName + " and " + dslName + "1 both have the same occurrence index 1}" : "") + "}\n                  to fix this make sure each usage of " + dslName + " " + (extraArgument ? "with the argument: " + extraArgument : "") + "\n                  in the rule " + topLevelName + " has a different occurrence index (1-5), as that combination acts as a unique\n                  position key in the grammar, which is needed by the parsing engine.";
            // white space trimming time! better to trim afterwards as it allows to use WELL formatted multi line template strings...
            msg = msg.replace(/[ \t]+/g, " ");
            msg = msg.replace(/\s\s+/g, "\n");
            return msg;
        }
        function identifyProductionForDuplicates(prod) {
            return "" + gast.getProductionDslName(prod) + "_#_" + prod.occurrenceInParent + "_#_" + getExtraProductionArgument(prod);
        }
        validations.identifyProductionForDuplicates = identifyProductionForDuplicates;
        function getExtraProductionArgument(prod) {
            if (prod instanceof gast.Terminal) {
                return chevrotain.tokenName(prod.terminalType);
            }
            else if (prod instanceof gast.NonTerminal) {
                return prod.nonTerminalName;
            }
            else {
                return "";
            }
        }
        var OccurrenceValidationCollector = (function (_super) {
            __extends(OccurrenceValidationCollector, _super);
            function OccurrenceValidationCollector() {
                _super.apply(this, arguments);
                this.allProductions = [];
            }
            OccurrenceValidationCollector.prototype.visitNonTerminal = function (subrule) {
                this.allProductions.push(subrule);
            };
            OccurrenceValidationCollector.prototype.visitOption = function (option) {
                this.allProductions.push(option);
            };
            OccurrenceValidationCollector.prototype.visitRepetitionMandatory = function (atLeastOne) {
                this.allProductions.push(atLeastOne);
            };
            OccurrenceValidationCollector.prototype.visitRepetition = function (many) {
                this.allProductions.push(many);
            };
            OccurrenceValidationCollector.prototype.visitAlternation = function (or) {
                this.allProductions.push(or);
            };
            OccurrenceValidationCollector.prototype.visitTerminal = function (terminal) {
                this.allProductions.push(terminal);
            };
            return OccurrenceValidationCollector;
        })(gast.GAstVisitor);
        validations.OccurrenceValidationCollector = OccurrenceValidationCollector;
    })/* istanbul ignore next */ (validations = chevrotain.validations || /* istanbul ignore next */ (chevrotain.validations = {}));
})/* istanbul ignore next */ (chevrotain || (chevrotain = {}));
var chevrotain;
(function (chevrotain) {
    var exceptions;
    (function (exceptions) {
        // hacks to bypass no support for custom Errors in javascript/typescript
        function isRecognitionException(error) {
            var recognitionExceptions = [
                chevrotain.lang.functionName(MismatchedTokenException),
                chevrotain.lang.functionName(NoViableAltException),
                chevrotain.lang.functionName(EarlyExitException),
                chevrotain.lang.functionName(NotAllInputParsedException)
            ];
            // can't do instanceof on hacked custom js exceptions
            return _.contains(recognitionExceptions, error.name);
        }
        exceptions.isRecognitionException = isRecognitionException;
        function MismatchedTokenException(message, token) {
            this.name = chevrotain.lang.functionName(MismatchedTokenException);
            this.message = message;
            this.token = token;
        }
        exceptions.MismatchedTokenException = MismatchedTokenException;
        // must use the "Error.prototype" instead of "new Error"
        // because the stack trace points to where "new Error" was invoked"
        MismatchedTokenException.prototype = Error.prototype;
        function NoViableAltException(message, token) {
            this.name = chevrotain.lang.functionName(NoViableAltException);
            this.message = message;
            this.token = token;
        }
        exceptions.NoViableAltException = NoViableAltException;
        NoViableAltException.prototype = Error.prototype;
        function NotAllInputParsedException(message, token) {
            this.name = chevrotain.lang.functionName(NotAllInputParsedException);
            this.message = message;
            this.token = token;
        }
        exceptions.NotAllInputParsedException = NotAllInputParsedException;
        NotAllInputParsedException.prototype = Error.prototype;
        function EarlyExitException(message, token) {
            this.name = chevrotain.lang.functionName(EarlyExitException);
            this.message = message;
            this.token = token;
        }
        exceptions.EarlyExitException = EarlyExitException;
        EarlyExitException.prototype = Error.prototype;
    })/* istanbul ignore next */ (exceptions = chevrotain.exceptions || /* istanbul ignore next */ (chevrotain.exceptions = {}));
})/* istanbul ignore next */ (chevrotain || (chevrotain = {}));
// using only root module name ('chevrotain') and not a longer name ('chevrotain.recognizer')
// because the external and internal API must have the same names for d.ts definition files to be valid
var chevrotain;
(function (chevrotain) {
    var cache = chevrotain.cache;
    var IN = chevrotain.constants.IN;
    var interp = chevrotain.interpreter;
    var lang = chevrotain.lang;
    var gastBuilder = chevrotain.gastBuilder;
    var follows = chevrotain.follow;
    var lookahead = chevrotain.lookahead;
    var validations = chevrotain.validations;
    var exceptions = chevrotain.exceptions;
    var EOF_FOLLOW_KEY = {};
    /**
     * A Recognizer capable of self analysis to determine it's grammar structure
     * This is used for more advanced features requiring such information.
     * for example: Error Recovery, Automatic lookahead calculation
     */
    var Parser = (function () {
        function Parser(input, tokensMapOrArr) {
            this.errors = [];
            this._input = [];
            this.inputIdx = -1;
            this.isBackTrackingStack = [];
            this.RULE_STACK = [];
            this.RULE_OCCURRENCE_STACK = [];
            this.tokensMap = undefined;
            // Not worth the hassle to support Unicode characters in rule names...
            this.ruleNamePattern = /^[a-zA-Z_]\w*$/;
            this.definedRulesNames = [];
            this._input = input;
            this.className = lang.classNameFromInstance(this);
            this.firstAfterRepMap = cache.getFirstAfterRepForClass(this.className);
            this.classLAFuncs = cache.getLookaheadFuncsForClass(this.className);
            if (_.isArray(tokensMapOrArr)) {
                this.tokensMap = _.reduce(tokensMapOrArr, function (acc, tokenClazz) {
                    acc[chevrotain.tokenName(tokenClazz)] = tokenClazz;
                    return acc;
                }, {});
            }
            else if (_.isObject(tokensMapOrArr)) {
                this.tokensMap = _.clone(tokensMapOrArr);
            }
            else {
                throw new Error("'tokensMapOrArr' argument must be An Array of Token constructors or a Dictionary of Tokens.");
            }
            // always add EOF to the tokenNames -> constructors map. it is useful to assure all the input has been
            // parsed with a clear error message ("expecting EOF but found ...")
            this.tokensMap[chevrotain.tokenName(chevrotain.EOF)] = chevrotain.EOF;
            if (cache.CLASS_TO_OR_LA_CACHE[this.className] === undefined) {
                cache.initLookAheadKeyCache(this.className);
            }
            this.orLookaheadKeys = cache.CLASS_TO_OR_LA_CACHE[this.className];
            this.manyLookaheadKeys = cache.CLASS_TO_MANY_LA_CACHE[this.className];
            this.atLeastOneLookaheadKeys = cache.CLASS_TO_AT_LEAST_ONE_LA_CACHE[this.className];
            this.optionLookaheadKeys = cache.CLASS_TO_OPTION_LA_CACHE[this.className];
        }
        Parser.performSelfAnalysis = function (classInstance) {
            var className = lang.classNameFromInstance(classInstance);
            // this information only needs to be computed once
            if (!cache.CLASS_TO_SELF_ANALYSIS_DONE.containsKey(className)) {
                var grammarProductions = cache.getProductionsForClass(className);
                var refResolver = new gastBuilder.GastRefResolverVisitor(grammarProductions);
                refResolver.resolveRefs();
                var allFollows = follows.computeAllProdsFollows(grammarProductions.values());
                cache.setResyncFollowsForClass(className, allFollows);
                cache.CLASS_TO_SELF_ANALYSIS_DONE.put(className, true);
                var validationErrors = validations.validateGrammar(grammarProductions.values());
                if (validationErrors.length > 0) {
                    //cache the validation errors so they can be thrown each time the parser is instantiated
                    cache.CLASS_TO_VALIDTATION_ERRORS.put(className, validationErrors);
                    throw new Error(validationErrors.join("-------------------------------\n"));
                }
            }
            // reThrow the validation errors each time an erroneous parser is instantiated
            if (cache.CLASS_TO_VALIDTATION_ERRORS.containsKey(className)) {
                throw new Error(cache.CLASS_TO_VALIDTATION_ERRORS.get(className).join("-------------------------------\n"));
            }
        };
        Object.defineProperty(Parser.prototype, "input", {
            get: function () {
                return _.clone(this._input);
            },
            set: function (newInput) {
                this.reset();
                this._input = newInput;
            },
            enumerable: true,
            configurable: true
        });
        Parser.prototype.reset = function () {
            this.isBackTrackingStack = [];
            this.errors = [];
            this._input = [];
            this.inputIdx = -1;
            this.RULE_STACK = [];
            this.RULE_OCCURRENCE_STACK = [];
        };
        Parser.prototype.isAtEndOfInput = function () {
            return this.LA(1) instanceof chevrotain.EOF;
        };
        Parser.prototype.getGAstProductions = function () {
            return cache.getProductionsForClass(this.className);
        };
        Parser.prototype.isBackTracking = function () {
            return !(_.isEmpty(this.isBackTrackingStack));
        };
        Parser.prototype.SAVE_ERROR = function (error) {
            if (exceptions.isRecognitionException(error)) {
                this.errors.push(error);
                return error;
            }
            else {
                throw Error("trying to save an Error which is not a RecognitionException");
            }
        };
        Parser.prototype.NEXT_TOKEN = function () {
            return this.LA(1);
        };
        Parser.prototype.LA = function (howMuch) {
            if (this._input.length <= this.inputIdx + howMuch) {
                return new chevrotain.EOF();
            }
            else {
                return this._input[this.inputIdx + howMuch];
            }
        };
        Parser.prototype.isNextRule = function (ruleName) {
            var classLAFuncs = cache.getLookaheadFuncsForClass(this.className);
            var condition = classLAFuncs.get(ruleName);
            if (condition === undefined) {
                var ruleGrammar = this.getGAstProductions().get(ruleName);
                condition = lookahead.buildLookaheadForTopLevel(ruleGrammar);
                classLAFuncs.put(ruleName, condition);
            }
            return condition.call(this);
        };
        /**
         *
         * @param grammarRule the rule to try and parse in backtracking mode
         * @param isValid a predicate that given the result of the parse attempt will "decide" if the parse was successfully or not
         * @return a lookahead function that will try to parse the given grammarRule and will return true if succeed
         */
        Parser.prototype.BACKTRACK = function (grammarRule, isValid) {
            var _this = this;
            return function () {
                // save org state
                _this.isBackTrackingStack.push(1);
                var orgState = _this.saveRecogState();
                try {
                    var ruleResult = grammarRule.call(_this);
                    return isValid(ruleResult);
                }
                catch (e) {
                    if (exceptions.isRecognitionException(e)) {
                        return false;
                    }
                    else {
                        throw e;
                    }
                }
                finally {
                    _this.reloadRecogState(orgState);
                    _this.isBackTrackingStack.pop();
                }
            };
        };
        // skips a token and returns the next token
        Parser.prototype.SKIP_TOKEN = function () {
            // example: assume 45 tokens in the input, if input index is 44 it means that NEXT_TOKEN will return
            // input[45] which is the 46th item and no longer exists,
            // so in this case the largest valid input index is 43 (input.length - 2 )
            if (this.inputIdx <= this._input.length - 2) {
                this.inputIdx++;
                return this.NEXT_TOKEN();
            }
            else {
                return new chevrotain.EOF();
            }
        };
        // Parsing DSL
        /**
         * Convenience method equivalent to CONSUME1
         * @see CONSUME1
         */
        Parser.prototype.CONSUME = function (tokClass) {
            return this.CONSUME1(tokClass);
        };
        /**
         *
         * A Parsing DSL method use to consume a single terminal Token.
         * a Token will be consumed, IFF the next token in the token vector is an instanceof tokClass.
         * otherwise the parser will attempt to perform error recovery.
         *
         * The index in the method name indicates the unique occurrence of a terminal consumption
         * inside a the top level rule. What this means is that if a terminal appears
         * more than once in a single rule, each appearance must have a difference index.
         *
         * for example:
         *
         * function parseQualifiedName() {
         *    this.CONSUME1(Identifier);
         *    this.MANY(()=> {
         *       this.CONSUME1(Dot);
         *       this.CONSUME2(Identifier); // <-- here we use CONSUME2 because the terminal
         *    });                           //     'Identifier' has already appeared previously in the
         *                                  //     the rule 'parseQualifiedName'
         * }
         *
         * @param {Function} tokClass A constructor function specifying the type of token
         *        to be consumed.
         *
         * @returns {chevrotain.tokens.Token} The consumed token.
         */
        Parser.prototype.CONSUME1 = function (tokClass) {
            return this.consumeInternal(tokClass, 1);
        };
        /**
         * @see CONSUME1
         */
        Parser.prototype.CONSUME2 = function (tokClass) {
            return this.consumeInternal(tokClass, 2);
        };
        /**
         * @see CONSUME1
         */
        Parser.prototype.CONSUME3 = function (tokClass) {
            return this.consumeInternal(tokClass, 3);
        };
        /**
         * @see CONSUME1
         */
        Parser.prototype.CONSUME4 = function (tokClass) {
            return this.consumeInternal(tokClass, 4);
        };
        /**
         * @see CONSUME1
         */
        Parser.prototype.CONSUME5 = function (tokClass) {
            return this.consumeInternal(tokClass, 5);
        };
        /**
         * Convenience method equivalent to SUBRULE1
         * @see SUBRULE1
         */
        Parser.prototype.SUBRULE = function (ruleToCall, args) {
            if (args === void 0) { args = []; }
            return this.SUBRULE1(ruleToCall, args);
        };
        /**
         * The Parsing DSL Method is used by one rule to call another.
         *
         * This may seem redundant as it does not actually do much.
         * However using it is mandatory for all sub rule invocations.
         * calling another rule without wrapping in SUBRULE(...)
         * will cause errors/mistakes in the Recognizer's self analysis
         * which will lead to errors in error recovery/automatic lookahead calcualtion
         * and any other functionality relying on the Recognizer's self analysis
         * output.
         *
         * As in CONSUME the index in the method name indicates the occurrence
         * of the sub rule invocation in its rule.
         *
         * @param {Function} ruleToCall the rule to invoke
         * @param {*[]} args the arguments to pass to the invoked subrule
         * @returns {*} the result of invoking ruleToCall
         */
        Parser.prototype.SUBRULE1 = function (ruleToCall, args) {
            if (args === void 0) { args = []; }
            return ruleToCall.call(this, 1, args);
        };
        /**
         * @see SUBRULE1
         */
        Parser.prototype.SUBRULE2 = function (ruleToCall, args) {
            if (args === void 0) { args = []; }
            return ruleToCall.call(this, 2, args);
        };
        /**
         * @see SUBRULE1
         */
        Parser.prototype.SUBRULE3 = function (ruleToCall, args) {
            if (args === void 0) { args = []; }
            return ruleToCall.call(this, 3, args);
        };
        /**
         * @see SUBRULE1
         */
        Parser.prototype.SUBRULE4 = function (ruleToCall, args) {
            if (args === void 0) { args = []; }
            return ruleToCall.call(this, 4, args);
        };
        /**
         * @see SUBRULE1
         */
        Parser.prototype.SUBRULE5 = function (ruleToCall, args) {
            if (args === void 0) { args = []; }
            return ruleToCall.call(this, 5, args);
        };
        /**
         * Convenience method equivalent to OPTION1
         * @see OPTION1
         */
        Parser.prototype.OPTION = function (laFuncOrAction, action) {
            return this.OPTION1.call(this, laFuncOrAction, action);
        };
        /**
         * Parsing DSL Method that Indicates an Optional production
         * in EBNF notation: [...]
         *
         * note that the 'action' param is optional. so both of the following forms are valid:
         *
         * short: this.OPTION(()=>{ this.CONSUME(Digit});
         * long: this.OPTION(isDigit, ()=>{ this.CONSUME(Digit});
         *
         * using the short form is recommended as it will compute the lookahead function
         * automatically. however this currently has one limitation:
         * It only works if the lookahead for the grammar is one.
         *
         * As in CONSUME the index in the method name indicates the occurrence
         * of the optional production in it's top rule.
         *
         * @param {Function} laFuncOrAction The lookahead function that 'decides'
         *                                  whether or not the OPTION's action will be
         *                                  invoked or the action to optionally invoke
         * @param {Function} [action] The action to optionally invoke.
         *
         * @returns {boolean} true iff the OPTION's action has been invoked
         */
        Parser.prototype.OPTION1 = function (laFuncOrAction, action) {
            if (action === undefined) {
                action = laFuncOrAction;
                laFuncOrAction = this.getLookaheadFuncForOption(1);
            }
            return this.optionInternal(laFuncOrAction, action);
        };
        /**
         * @see OPTION1
         */
        Parser.prototype.OPTION2 = function (laFuncOrAction, action) {
            if (action === undefined) {
                action = laFuncOrAction;
                laFuncOrAction = this.getLookaheadFuncForOption(2);
            }
            return this.optionInternal(laFuncOrAction, action);
        };
        /**
         * @see OPTION1
         */
        Parser.prototype.OPTION3 = function (laFuncOrAction, action) {
            if (action === undefined) {
                action = laFuncOrAction;
                laFuncOrAction = this.getLookaheadFuncForOption(3);
            }
            return this.optionInternal(laFuncOrAction, action);
        };
        /**
         * @see OPTION1
         */
        Parser.prototype.OPTION4 = function (laFuncOrAction, action) {
            if (action === undefined) {
                action = laFuncOrAction;
                laFuncOrAction = this.getLookaheadFuncForOption(4);
            }
            return this.optionInternal(laFuncOrAction, action);
        };
        /**
         * @see OPTION1
         */
        Parser.prototype.OPTION5 = function (laFuncOrAction, action) {
            if (action === undefined) {
                action = laFuncOrAction;
                laFuncOrAction = this.getLookaheadFuncForOption(5);
            }
            return this.optionInternal(laFuncOrAction, action);
        };
        /**
         * Convenience method equivalent to OR1
         * @see OR1
         */
        Parser.prototype.OR = function (alts, errMsgTypes, ignoreAmbiguities) {
            if (ignoreAmbiguities === void 0) { ignoreAmbiguities = false; }
            return this.OR1(alts, errMsgTypes, ignoreAmbiguities);
        };
        /**
         * Parsing DSL method that indicates a choice between a set of alternatives must be made.
         * This is equivalent to EBNF alternation (A | B | C | D ...)
         *
         * There are two forms:
         *
         * short: this.OR([
         *           {ALT:()=>{this.CONSUME(One)}},
         *           {ALT:()=>{this.CONSUME(Two)}},
         *           {ALT:()=>{this.CONSUME(Three)}},
         *        ], "a number")
         *
         * long: this.OR([
         *           {WHEN: isOne, THEN_DO:()=>{this.CONSUME(One)}},
         *           {WHEN: isTwo, THEN_DO:()=>{this.CONSUME(Two)}},
         *           {WHEN: isThree, THEN_DO:()=>{this.CONSUME(Three)}},
         *        ], "a number")
         *
         * using the short form is recommended as it will compute the lookahead function
         * automatically. however this currently has one limitation:
         * It only works if the lookahead for the grammar is one.
         *
         * As in CONSUME the index in the method name indicates the occurrence
         * of the alternation production in it's top rule.
         *
         * @param {{ALT:Function}[] | {WHEN:Function, THEN_DO:Function}[]} alts An array of alternatives
         * @param {string} errMsgTypes A description for the alternatives used in error messages
         * @returns {*} The result of invoking the chosen alternative
         * @param {boolean} [ignoreAmbiguities] if true this will ignore ambiguities caused when two alternatives can not
         *                                      be distinguished by a lookahead of one. enabling this means the first alternative
         *                                      that matches will be taken. This is sometimes the grammar's intent.
         *                                      * only enable this if you know what you are doing!
         */
        Parser.prototype.OR1 = function (alts, errMsgTypes, ignoreAmbiguities) {
            if (ignoreAmbiguities === void 0) { ignoreAmbiguities = false; }
            return this.orInternal(alts, errMsgTypes, 1, ignoreAmbiguities);
        };
        /**
         * @see OR1
         */
        Parser.prototype.OR2 = function (alts, errMsgTypes, ignoreAmbiguities) {
            if (ignoreAmbiguities === void 0) { ignoreAmbiguities = false; }
            return this.orInternal(alts, errMsgTypes, 2, ignoreAmbiguities);
        };
        /**
         * @see OR1
         */
        Parser.prototype.OR3 = function (alts, errMsgTypes, ignoreAmbiguities) {
            if (ignoreAmbiguities === void 0) { ignoreAmbiguities = false; }
            return this.orInternal(alts, errMsgTypes, 3, ignoreAmbiguities);
        };
        /**
         * @see OR1
         */
        Parser.prototype.OR4 = function (alts, errMsgTypes, ignoreAmbiguities) {
            if (ignoreAmbiguities === void 0) { ignoreAmbiguities = false; }
            return this.orInternal(alts, errMsgTypes, 4, ignoreAmbiguities);
        };
        /**
         * @see OR1
         */
        Parser.prototype.OR5 = function (alts, errMsgTypes, ignoreAmbiguities) {
            if (ignoreAmbiguities === void 0) { ignoreAmbiguities = false; }
            return this.orInternal(alts, errMsgTypes, 5, ignoreAmbiguities);
        };
        /**
         * Convenience method equivalent to MANY1
         * @see MANY1
         */
        Parser.prototype.MANY = function (lookAheadFunc, action) {
            return this.MANY1.call(this, lookAheadFunc, action);
        };
        /**
         * Parsing DSL method, that indicates a repetition of zero or more.
         * This is equivalent to EBNF repetition {...}
         *
         * note that the 'action' param is optional. so both of the following forms are valid:
         *
         * short: this.MANY(()=>{
         *                       this.CONSUME(Comma};
         *                       this.CONSUME(Digit});
         * long: this.MANY(isComma, ()=>{
         *                       this.CONSUME(Comma};
         *                       this.CONSUME(Digit});
         *
         * using the short form is recommended as it will compute the lookahead function
         * automatically. however this currently has one limitation:
         * It only works if the lookahead for the grammar is one.
         *
         * As in CONSUME the index in the method name indicates the occurrence
         * of the repetition production in it's top rule.
         *
         * @param {Function} laFuncOrAction The lookahead function that 'decides'
         *                                  whether or not the MANY's action will be
         *                                  invoked or the action to optionally invoke
         * @param {Function} [action] The action to optionally invoke.
         */
        Parser.prototype.MANY1 = function (laFuncOrAction, action) {
            this.manyInternal(this.MANY1, "MANY1", 1, laFuncOrAction, action);
        };
        /**
         * @see MANY1
         */
        Parser.prototype.MANY2 = function (laFuncOrAction, action) {
            this.manyInternal(this.MANY2, "MANY2", 2, laFuncOrAction, action);
        };
        /**
         * @see MANY1
         */
        Parser.prototype.MANY3 = function (laFuncOrAction, action) {
            this.manyInternal(this.MANY3, "MANY3", 3, laFuncOrAction, action);
        };
        /**
         * @see MANY1
         */
        Parser.prototype.MANY4 = function (laFuncOrAction, action) {
            this.manyInternal(this.MANY4, "MANY4", 4, laFuncOrAction, action);
        };
        /**
         * @see MANY1
         */
        Parser.prototype.MANY5 = function (laFuncOrAction, action) {
            this.manyInternal(this.MANY5, "MANY5", 5, laFuncOrAction, action);
        };
        /**
         * Convenience method equivalent to AT_LEAST_ONE1
         * @see AT_LEAST_ONE1
         */
        Parser.prototype.AT_LEAST_ONE = function (laFuncOrAction, action, errMsg) {
            return this.AT_LEAST_ONE1.call(this, laFuncOrAction, action, errMsg);
        };
        /**
         *
         * convenience method, same as MANY but the repetition is of one or more.
         * failing to match at least one repetition will result in a parsing error and
         * cause the parser to attempt error recovery.
         *
         * @see MANY1
         *
         * @param {Function} laFuncOrAction The lookahead function that 'decides'
         *                                  whether or not the AT_LEAST_ONE's action will be
         *                                  invoked or the action to optionally invoke
         * @param {Function} [action] The action to optionally invoke.
         * @param {string} [errMsg] short title/classification to what is being matched
         */
        Parser.prototype.AT_LEAST_ONE1 = function (laFuncOrAction, action, errMsg) {
            this.atLeastOneInternal(this.AT_LEAST_ONE1, "AT_LEAST_ONE1", 1, laFuncOrAction, action, errMsg);
        };
        /**
         * @see AT_LEAST_ONE1
         */
        Parser.prototype.AT_LEAST_ONE2 = function (laFuncOrAction, action, errMsg) {
            this.atLeastOneInternal(this.AT_LEAST_ONE2, "AT_LEAST_ONE2", 2, laFuncOrAction, action, errMsg);
        };
        /**
         * @see AT_LEAST_ONE1
         */
        Parser.prototype.AT_LEAST_ONE3 = function (laFuncOrAction, action, errMsg) {
            this.atLeastOneInternal(this.AT_LEAST_ONE3, "AT_LEAST_ONE1", 3, laFuncOrAction, action, errMsg);
        };
        /**
         * @see AT_LEAST_ONE1
         */
        Parser.prototype.AT_LEAST_ONE4 = function (laFuncOrAction, action, errMsg) {
            this.atLeastOneInternal(this.AT_LEAST_ONE4, "AT_LEAST_ONE1", 4, laFuncOrAction, action, errMsg);
        };
        /**
         * @see AT_LEAST_ONE1
         */
        Parser.prototype.AT_LEAST_ONE5 = function (laFuncOrAction, action, errMsg) {
            this.atLeastOneInternal(this.AT_LEAST_ONE5, "AT_LEAST_ONE1", 5, laFuncOrAction, action, errMsg);
        };
        /**
         * Convenience method, same as RULE with doReSync=false
         * @see RULE
         */
        Parser.prototype.RULE_NO_RESYNC = function (ruleName, impl, invalidRet) {
            return this.RULE(ruleName, impl, invalidRet, false);
        };
        /**
         *
         * @param {string} ruleName The name of the Rule. must match the var it is assigned to.
         * @param {Function} impl The implementation of the Rule
         * @param {Function} [invalidRet] A function that will return the chosen invalid value for the rule in case of
         *                   re-sync recovery.
         * @param {boolean} [doReSync] enable or disable re-sync recovery for this rule. defaults to true
         * @returns {Function} The parsing rule which is the impl Function wrapped with the parsing logic that handles
         *                     Parser state / error recovery / ...
         */
        Parser.prototype.RULE = function (ruleName, impl, invalidRet, doReSync) {
            if (invalidRet === void 0) { invalidRet = this.defaultInvalidReturn; }
            if (doReSync === void 0) { doReSync = true; }
            // TODO: isEntryPoint by default true? SUBRULE explicitly pass false?
            this.validateRuleName(ruleName);
            var parserClassProductions = cache.getProductionsForClass(this.className);
            // only build the gast representation once
            if (!(parserClassProductions.containsKey(ruleName))) {
                var gastProduction = gastBuilder.buildTopProduction(impl.toString(), ruleName, this.tokensMap);
                parserClassProductions.put(ruleName, gastProduction);
            }
            var wrappedGrammarRule = function (idxInCallingRule, args) {
                if (idxInCallingRule === void 0) { idxInCallingRule = 1; }
                if (args === void 0) { args = []; }
                this.ruleInvocationStateUpdate(ruleName, idxInCallingRule);
                try {
                    // actual parsing happens here
                    return impl.apply(this, args);
                }
                catch (e) {
                    var isFirstInvokedRule = (this.RULE_STACK.length === 1);
                    // note the reSync is always enabled for the first rule invocation, because we must always be able to
                    // reSync with EOF and just output some INVALID ParseTree
                    // during backtracking reSync recovery is disabled, otherwise we can't be certain the backtracking
                    // path is really the most valid one
                    var reSyncEnabled = (isFirstInvokedRule || doReSync) && !this.isBackTracking();
                    if (reSyncEnabled && exceptions.isRecognitionException(e)) {
                        var reSyncTokType = this.findReSyncTokenType();
                        if (this.isInCurrentRuleReSyncSet(reSyncTokType)) {
                            this.reSyncTo(reSyncTokType);
                            return invalidRet();
                        }
                        else {
                            throw e;
                        }
                    }
                    else {
                        throw e;
                    }
                }
                finally {
                    this.ruleFinallyStateUpdate();
                }
            };
            var ruleNamePropName = "ruleName";
            wrappedGrammarRule[ruleNamePropName] = ruleName;
            return wrappedGrammarRule;
        };
        Parser.prototype.ruleInvocationStateUpdate = function (ruleName, idxInCallingRule) {
            this.RULE_OCCURRENCE_STACK.push(idxInCallingRule);
            this.RULE_STACK.push(ruleName);
        };
        Parser.prototype.ruleFinallyStateUpdate = function () {
            this.RULE_STACK.pop();
            this.RULE_OCCURRENCE_STACK.pop();
            var maxInputIdx = this._input.length - 1;
            if ((this.RULE_STACK.length === 0) && this.inputIdx < maxInputIdx) {
                var firstRedundantTok = this.NEXT_TOKEN();
                this.SAVE_ERROR(new exceptions.NotAllInputParsedException("Redundant input, expecting EOF but found: " + firstRedundantTok.image, firstRedundantTok));
            }
        };
        /*
         * Returns an "imaginary" Token to insert when Single Token Insertion is done
         * Override this if you require special behavior in your grammar
         * for example if an IntegerToken is required provide one with the image '0' so it would be valid syntactically
         */
        Parser.prototype.getTokenToInsert = function (tokClass) {
            return new tokClass(-1, -1);
        };
        /*
         * By default all tokens type may be inserted. This behavior may be overridden in inheriting Recognizers
         * for example: One may decide that only punctuation tokens may be inserted automatically as they have no additional
         * semantic value. (A mandatory semicolon has no additional semantic meaning, but an Integer may have additional meaning
         * depending on its int value and context (Inserting an integer 0 in cardinality: "[1..]" will cause semantic issues
         * as the max of the cardinality will be greater than the min value. (and this is a false error!)
         */
        Parser.prototype.canTokenTypeBeInsertedInRecovery = function (tokClass) {
            return true;
        };
        Parser.prototype.defaultInvalidReturn = function () {
            return undefined;
        };
        /**
         * @param ruleFuncName name of the Grammar rule
         * @throws Grammar validation errors if the name is invalid
         */
        Parser.prototype.validateRuleName = function (ruleFuncName) {
            if (!ruleFuncName.match(this.ruleNamePattern)) {
                throw Error("Invalid Grammar rule name --> " + ruleFuncName + " it must match the pattern: " + this.ruleNamePattern.toString());
            }
            if ((_.contains(this.definedRulesNames, ruleFuncName))) {
                throw Error("Duplicate definition, rule: " + ruleFuncName + " is already defined in the grammar: " + this.className);
            }
            this.definedRulesNames.push(ruleFuncName);
        };
        Parser.prototype.tryInRepetitionRecovery = function (grammarRule, grammarRuleArgs, lookAheadFunc, expectedTokType) {
            // TODO: can the resyncTokenType be cached?
            var reSyncTokType = this.findReSyncTokenType();
            var orgInputIdx = this.inputIdx;
            var nextTokenWithoutResync = this.NEXT_TOKEN();
            var currToken = this.NEXT_TOKEN();
            var passedResyncPoint = false;
            while (!passedResyncPoint) {
                // we skipped enough tokens so we can resync right back into another iteration of the repetition grammar rule
                if (lookAheadFunc.call(this)) {
                    // we are preemptively re-syncing before an error has been detected, therefor we must reproduce
                    // the error that would have been thrown
                    var expectedTokName = chevrotain.tokenName(expectedTokType);
                    var msg = "Expecting token of type -->" + expectedTokName + "<-- but found -->'" + nextTokenWithoutResync.image + "'<--";
                    this.SAVE_ERROR(new exceptions.MismatchedTokenException(msg, nextTokenWithoutResync));
                    // recursive invocation in other to support multiple re-syncs in the same top level repetition grammar rule
                    grammarRule.apply(this, grammarRuleArgs);
                    return; // must return here to avoid reverting the inputIdx
                }
                if (currToken instanceof reSyncTokType) {
                    passedResyncPoint = true;
                }
                currToken = this.SKIP_TOKEN();
            }
            // we were unable to find a CLOSER point to resync inside the MANY, reset the state and
            // rethrow the exception for farther recovery attempts into rules deeper in the rules stack
            this.inputIdx = orgInputIdx;
        };
        Parser.prototype.shouldInRepetitionRecoveryBeTried = function (expectTokAfterLastMatch, nextTokIdx) {
            // arguments to try and perform resync into the next iteration of the many are missing
            if (expectTokAfterLastMatch === undefined || nextTokIdx === undefined) {
                return false;
            }
            // no need to recover, next token is what we expect...
            if (this.NEXT_TOKEN() instanceof expectTokAfterLastMatch) {
                return false;
            }
            // error recovery is disabled during backtracking as it can make the parser ignore a valid grammar path
            // and prefer some backtracking path that includes recovered errors.
            if (this.isBackTracking()) {
                return false;
            }
            // if we can perform inRule recovery (single token insertion or deletion) we always prefer that recovery algorithm
            // because if it works, it makes the least amount of changes to the input stream (greedy algorithm)
            //noinspection RedundantIfStatementJS
            if (this.canPerformInRuleRecovery(expectTokAfterLastMatch, this.getFollowsForInRuleRecovery(expectTokAfterLastMatch, nextTokIdx))) {
                return false;
            }
            return true;
        };
        // Error Recovery functionality
        Parser.prototype.getFollowsForInRuleRecovery = function (tokClass, tokIdxInRule) {
            var pathRuleStack = _.clone(this.RULE_STACK);
            var pathOccurrenceStack = _.clone(this.RULE_OCCURRENCE_STACK);
            var grammarPath = {
                ruleStack: pathRuleStack,
                occurrenceStack: pathOccurrenceStack,
                lastTok: tokClass,
                lastTokOccurrence: tokIdxInRule
            };
            var topRuleName = _.first(pathRuleStack);
            var gastProductions = this.getGAstProductions();
            var topProduction = gastProductions.get(topRuleName);
            var follows = new interp.NextAfterTokenWalker(topProduction, grammarPath).startWalking();
            return follows;
        };
        Parser.prototype.tryInRuleRecovery = function (expectedTokType, follows) {
            if (this.canRecoverWithSingleTokenInsertion(expectedTokType, follows)) {
                var tokToInsert = this.getTokenToInsert(expectedTokType);
                tokToInsert.isInsertedInRecovery = true;
                return tokToInsert;
            }
            if (this.canRecoverWithSingleTokenDeletion(expectedTokType)) {
                var nextTok = this.SKIP_TOKEN();
                this.inputIdx++;
                return nextTok;
            }
            throw new InRuleRecoveryException("sad sad panda");
        };
        Parser.prototype.canPerformInRuleRecovery = function (expectedToken, follows) {
            return this.canRecoverWithSingleTokenInsertion(expectedToken, follows) || this.canRecoverWithSingleTokenDeletion(expectedToken);
        };
        Parser.prototype.canRecoverWithSingleTokenInsertion = function (expectedTokType, follows) {
            if (!this.canTokenTypeBeInsertedInRecovery(expectedTokType)) {
                return false;
            }
            // must know the possible following tokens to perform single token insertion
            if (_.isEmpty(follows)) {
                return false;
            }
            var mismatchedTok = this.NEXT_TOKEN();
            var isMisMatchedTokInFollows = _.find(follows, function (possibleFollowsTokType) {
                return mismatchedTok instanceof possibleFollowsTokType;
            }) !== undefined;
            return isMisMatchedTokInFollows;
        };
        Parser.prototype.canRecoverWithSingleTokenDeletion = function (expectedTokType) {
            var isNextTokenWhatIsExpected = this.LA(2) instanceof expectedTokType;
            return isNextTokenWhatIsExpected;
        };
        Parser.prototype.isInCurrentRuleReSyncSet = function (token) {
            var followKey = this.getCurrFollowKey();
            var currentRuleReSyncSet = this.getFollowSetFromFollowKey(followKey);
            return _.contains(currentRuleReSyncSet, token);
        };
        Parser.prototype.findReSyncTokenType = function () {
            var allPossibleReSyncTokTypes = this.flattenFollowSet();
            // this loop will always terminate as EOF is always in the follow stack and also always (virtually) in the input
            var nextToken = this.NEXT_TOKEN();
            var k = 2;
            while (true) {
                var nextTokenType = nextToken.constructor;
                if (_.contains(allPossibleReSyncTokTypes, nextTokenType)) {
                    return nextTokenType;
                }
                nextToken = this.LA(k);
                k++;
            }
        };
        Parser.prototype.getCurrFollowKey = function () {
            // the length is at least one as we always add the ruleName to the stack before invoking the rule.
            if (this.RULE_STACK.length === 1) {
                return EOF_FOLLOW_KEY;
            }
            var currRuleIdx = this.RULE_STACK.length - 1;
            var currRuleOccIdx = currRuleIdx;
            var prevRuleIdx = currRuleIdx - 1;
            return {
                ruleName: this.RULE_STACK[currRuleIdx],
                idxInCallingRule: this.RULE_OCCURRENCE_STACK[currRuleOccIdx],
                inRule: this.RULE_STACK[prevRuleIdx]
            };
        };
        Parser.prototype.buildFullFollowKeyStack = function () {
            var _this = this;
            return _.map(this.RULE_STACK, function (ruleName, idx) {
                if (idx === 0) {
                    return EOF_FOLLOW_KEY;
                }
                return {
                    ruleName: ruleName,
                    idxInCallingRule: _this.RULE_OCCURRENCE_STACK[idx],
                    inRule: _this.RULE_STACK[idx - 1]
                };
            });
        };
        Parser.prototype.flattenFollowSet = function () {
            var _this = this;
            var followStack = _.map(this.buildFullFollowKeyStack(), function (currKey) {
                return _this.getFollowSetFromFollowKey(currKey);
            });
            return _.flatten(followStack);
        };
        Parser.prototype.getFollowSetFromFollowKey = function (followKey) {
            if (followKey === EOF_FOLLOW_KEY) {
                return [chevrotain.EOF];
            }
            var followName = followKey.ruleName + followKey.idxInCallingRule + IN + followKey.inRule;
            return cache.getResyncFollowsForClass(this.className).get(followName);
        };
        Parser.prototype.reSyncTo = function (tokClass) {
            var nextTok = this.NEXT_TOKEN();
            while ((nextTok instanceof tokClass) === false) {
                nextTok = this.SKIP_TOKEN();
            }
        };
        Parser.prototype.attemptInRepetitionRecovery = function (prodFunc, args, lookaheadFunc, prodName, prodOccurrence, nextToksWalker, prodKeys) {
            var key = this.getKeyForAutomaticLookahead(prodName, prodKeys, prodOccurrence);
            var firstAfterRepInfo = this.firstAfterRepMap.get(key);
            if (firstAfterRepInfo === undefined) {
                var currRuleName = _.last(this.RULE_STACK);
                var ruleGrammar = this.getGAstProductions().get(currRuleName);
                var walker = new nextToksWalker(ruleGrammar, prodOccurrence);
                firstAfterRepInfo = walker.startWalking();
                this.firstAfterRepMap.put(key, firstAfterRepInfo);
            }
            var expectTokAfterLastMatch = firstAfterRepInfo.token;
            var nextTokIdx = firstAfterRepInfo.occurrence;
            var isEndOfRule = firstAfterRepInfo.isEndOfRule;
            // special edge case of a TOP most repetition after which the input should END.
            // this will force an attempt for inRule recovery in that scenario.
            if (this.RULE_STACK.length === 1 && isEndOfRule && expectTokAfterLastMatch === undefined) {
                expectTokAfterLastMatch = chevrotain.EOF;
                nextTokIdx = 1;
            }
            if (this.shouldInRepetitionRecoveryBeTried(expectTokAfterLastMatch, nextTokIdx)) {
                // TODO: performance optimization: instead of passing the original args here, we modify
                // the args param (or create a new one) and make sure the lookahead func is explicitly provided
                // to avoid searching the cache for it once more.
                this.tryInRepetitionRecovery(prodFunc, args, lookaheadFunc, expectTokAfterLastMatch);
            }
        };
        Parser.prototype.optionInternal = function (condition, action) {
            if (condition.call(this)) {
                action.call(this);
                return true;
            }
            return false;
        };
        // Implementation of parsing DSL
        Parser.prototype.atLeastOneInternal = function (prodFunc, prodName, prodOccurrence, lookAheadFunc, action, errMsg) {
            if (_.isString(action)) {
                errMsg = action;
                action = lookAheadFunc;
                lookAheadFunc = this.getLookaheadFuncForAtLeastOne(prodOccurrence);
            }
            if (lookAheadFunc.call(this)) {
                action.call(this);
                this.MANY(lookAheadFunc, action);
            }
            else {
                throw this.SAVE_ERROR(new exceptions.EarlyExitException("expecting at least one: " + errMsg, this.NEXT_TOKEN()));
            }
            // note that while it may seem that this can cause an error because by using a recursive call to
            // AT_LEAST_ONE we change the grammar to AT_LEAST_TWO, AT_LEAST_THREE ... , the possible recursive call
            // from the tryInRepetitionRecovery(...) will only happen IFF there really are TWO/THREE/.... items.
            this.attemptInRepetitionRecovery(prodFunc, [lookAheadFunc, action, errMsg], lookAheadFunc, prodName, prodOccurrence, interp.NextTerminalAfterAtLeastOneWalker, this.atLeastOneLookaheadKeys);
        };
        Parser.prototype.manyInternal = function (prodFunc, prodName, prodOccurrence, lookAheadFunc, action) {
            if (action === undefined) {
                action = lookAheadFunc;
                lookAheadFunc = this.getLookaheadFuncForMany(prodOccurrence);
            }
            while (lookAheadFunc.call(this)) {
                action.call(this);
            }
            this.attemptInRepetitionRecovery(prodFunc, [lookAheadFunc, action], lookAheadFunc, prodName, prodOccurrence, interp.NextTerminalAfterManyWalker, this.manyLookaheadKeys);
        };
        Parser.prototype.orInternal = function (alts, errMsgTypes, occurrence, ignoreAmbiguities) {
            // explicit alternatives look ahead
            if (alts[0].WHEN !== undefined) {
                for (var i = 0; i < alts.length; i++) {
                    if (alts[i].WHEN.call(this)) {
                        var res = alts[i].THEN_DO();
                        return res;
                    }
                }
                this.raiseNoAltException(errMsgTypes);
            }
            // else implicit lookahead
            var laFunc = this.getLookaheadFuncForOr(occurrence, ignoreAmbiguities);
            var altToTake = laFunc.call(this);
            if (altToTake !== -1) {
                return alts[altToTake].ALT.call(this);
            }
            this.raiseNoAltException(errMsgTypes);
        };
        /**
         * @param tokClass The Type of Token we wish to consume (Reference to its constructor function)
         * @param idx occurrence index of consumed token in the invoking parser rule text
         *         for example:
         *         IDENT (DOT IDENT)*
         *         the first ident will have idx 1 and the second one idx 2
         *         * note that for the second ident the idx is always 2 even if its invoked 30 times in the same rule
         *           the idx is about the position in grammar (source code) and has nothing to do with a specific invocation
         *           details
         *
         * @returns the consumed Token
         */
        Parser.prototype.consumeInternal = function (tokClass, idx) {
            try {
                return this.consumeInternalOptimized(tokClass);
            }
            catch (eFromConsumption) {
                // no recovery allowed during backtracking, otherwise backtracking may recover invalid syntax and accept it
                // but the original syntax could have been parsed successfully without any backtracking + recovery
                if (eFromConsumption instanceof exceptions.MismatchedTokenException && !this.isBackTracking()) {
                    var follows = this.getFollowsForInRuleRecovery(tokClass, idx);
                    try {
                        return this.tryInRuleRecovery(tokClass, follows);
                    }
                    catch (eFromInRuleRecovery) {
                        /* istanbul ignore next */ // TODO: try removing this istanbul ignore with tsc 1.5.
                        // it is only needed for the else branch but in tsc 1.4.1 comments
                        // between if and else seem to get swallowed and disappear.
                        if (eFromConsumption instanceof InRuleRecoveryException) {
                            throw eFromConsumption;
                        }
                        else {
                            throw eFromInRuleRecovery;
                        }
                    }
                }
                else {
                    throw eFromConsumption;
                }
            }
        };
        // to enable opimizations this logic has been extract to a method as its caller method contains try/catch
        Parser.prototype.consumeInternalOptimized = function (tokClass) {
            var nextToken = this.NEXT_TOKEN();
            if (this.NEXT_TOKEN() instanceof tokClass) {
                this.inputIdx++;
                return nextToken;
            }
            else {
                var expectedTokType = chevrotain.tokenName(tokClass);
                var msg = "Expecting token of type -->" + expectedTokType + "<-- but found -->'" + nextToken.image + "'<--";
                throw this.SAVE_ERROR(new exceptions.MismatchedTokenException(msg, nextToken));
            }
        };
        Parser.prototype.getKeyForAutomaticLookahead = function (prodName, prodKeys, occurrence) {
            var occuMap = prodKeys[occurrence - 1];
            var currRule = _.last(this.RULE_STACK);
            var key = occuMap[currRule];
            if (key === undefined) {
                key = prodName + occurrence + IN + currRule;
                occuMap[currRule] = key;
            }
            return key;
        };
        // Automatic lookahead calculation
        Parser.prototype.getLookaheadFuncForOption = function (occurence) {
            var key = this.getKeyForAutomaticLookahead("OPTION", this.optionLookaheadKeys, occurence);
            return this.getLookaheadFuncFor(key, occurence, lookahead.buildLookaheadForOption);
        };
        Parser.prototype.getLookaheadFuncForOr = function (occurence, ignoreErrors) {
            var key = this.getKeyForAutomaticLookahead("OR", this.orLookaheadKeys, occurence);
            return this.getLookaheadFuncFor(key, occurence, lookahead.buildLookaheadForOr, [ignoreErrors]);
        };
        Parser.prototype.getLookaheadFuncForMany = function (occurence) {
            var key = this.getKeyForAutomaticLookahead("MANY", this.manyLookaheadKeys, occurence);
            return this.getLookaheadFuncFor(key, occurence, lookahead.buildLookaheadForMany);
        };
        Parser.prototype.getLookaheadFuncForAtLeastOne = function (occurence) {
            var key = this.getKeyForAutomaticLookahead("AT_LEAST_ONE", this.atLeastOneLookaheadKeys, occurence);
            return this.getLookaheadFuncFor(key, occurence, lookahead.buildLookaheadForAtLeastOne);
        };
        Parser.prototype.getLookaheadFuncFor = function (key, occurrence, laFuncBuilder, extraArgs) {
            if (extraArgs === void 0) { extraArgs = []; }
            var ruleName = _.last(this.RULE_STACK);
            var condition = this.classLAFuncs.get(key);
            if (condition === undefined) {
                var ruleGrammar = this.getGAstProductions().get(ruleName);
                condition = laFuncBuilder.apply(null, [occurrence, ruleGrammar].concat(extraArgs));
                this.classLAFuncs.put(key, condition);
            }
            return condition;
        };
        // other functionality
        Parser.prototype.saveRecogState = function () {
            var savedErrors = _.clone(this.errors);
            var savedRuleStack = _.clone(this.RULE_STACK);
            return {
                errors: savedErrors,
                inputIdx: this.inputIdx,
                RULE_STACK: savedRuleStack
            };
        };
        Parser.prototype.reloadRecogState = function (newState) {
            this.errors = newState.errors;
            this.inputIdx = newState.inputIdx;
            this.RULE_STACK = newState.RULE_STACK;
        };
        Parser.prototype.raiseNoAltException = function (errMsgTypes) {
            throw this.SAVE_ERROR(new exceptions.NoViableAltException("expecting: " + errMsgTypes + " but found '" + this.NEXT_TOKEN().image + "'", this.NEXT_TOKEN()));
        };
        Parser.IGNORE_AMBIGUITIES = true;
        Parser.NO_RESYNC = false;
        return Parser;
    })();
    chevrotain.Parser = Parser;
    function InRuleRecoveryException(message) {
        this.name = lang.functionName(InRuleRecoveryException);
        this.message = message;
    }
    InRuleRecoveryException.prototype = Error.prototype;
})/* istanbul ignore next */ (chevrotain || (chevrotain = {}));
/// <reference path="../libs/node.d.ts" />
/* istanbul ignore next */
var testMode = (typeof global === "object" && global.CHEV_TEST_MODE) || (typeof window === "object" && window.CHEV_TEST_MODE);
var API = {};
/* istanbul ignore next */
if (!testMode) {
    // semantic version
    API.VERSION = "0.4.7";
    // runtime API
    API.Parser = chevrotain.Parser;
    API.Lexer = chevrotain.Lexer;
    API.Token = chevrotain.Token;
    API.VirtualToken = chevrotain.VirtualToken;
    API.EOF = chevrotain.EOF;
    // Tokens utilities
    API.extendToken = chevrotain.extendToken;
    API.tokenName = chevrotain.tokenName;
    API.exceptions = {};
    API.exceptions.isRecognitionException = chevrotain.exceptions.isRecognitionException;
    API.exceptions.EarlyExitException = chevrotain.exceptions.EarlyExitException;
    API.exceptions.MismatchedTokenException = chevrotain.exceptions.MismatchedTokenException;
    API.exceptions.NotAllInputParsedException = chevrotain.exceptions.NotAllInputParsedException;
    API.exceptions.NoViableAltException = chevrotain.exceptions.NoViableAltException;
    // grammar reflection API
    API.gast = {};
    API.gast.GAstVisitor = chevrotain.gast.GAstVisitor;
    API.gast.Flat = chevrotain.gast.Flat;
    API.gast.RepetitionMandatory = chevrotain.gast.RepetitionMandatory;
    API.gast.Repetition = chevrotain.gast.Repetition;
    API.gast.Option = chevrotain.gast.Option;
    API.gast.Alternation = chevrotain.gast.Alternation;
    API.gast.NonTerminal = chevrotain.gast.NonTerminal;
    API.gast.Terminal = chevrotain.gast.Terminal;
    API.gast.Rule = chevrotain.gast.Rule;
}
else {
    console.log("running in TEST_MODE");
    API = chevrotain;
}
// libs
/// <reference path="../libs/lodash.d.ts" />
// production code
/// <reference path="../src/lang/lang_extensions.ts" />
/// <reference path="../src/scan/tokens_public.ts" />
/// <reference path="../src/scan/lexer_public.ts" />
/// <reference path="../src/scan/lexer.ts" />
/// <reference path="../src/parse/parse_tree.ts" />
/// <reference path="../src/text/range.ts" />
/// <reference path="../src/parse/constants.ts" />
/// <reference path="../src/parse/grammar/path.ts" />
/// <reference path="../src/parse/grammar/gast_public.ts" />
/// <reference path="../src/parse/grammar/gast.ts" />
/// <reference path="../src/parse/grammar/first.ts" />
/// <reference path="../src/parse/grammar/rest.ts" />
/// <reference path="../src/parse/grammar/follow.ts" />
/// <reference path="../src/parse/grammar/interpreter.ts" />
/// <reference path="../src/parse/cache.ts" />
/// <reference path="../src/parse/grammar/lookahead.ts" />
/// <reference path="../src/parse/gast_builder.ts" />
/// <reference path="../src/parse/grammar/checks.ts" />
/// <reference path="../src/parse/exceptions_public.ts" />
/// <reference path="../src/parse/parser_public.ts" />
/// <reference path="../src/api.ts" />

return API;

}));
