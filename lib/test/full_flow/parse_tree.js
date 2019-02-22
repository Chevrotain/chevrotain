"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var utils_1 = require("../../src/utils/utils");
var ParseTree = /** @class */ (function () {
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
}());
exports.ParseTree = ParseTree;
/**
 * convenience factory for ParseTrees
 *
 * @param {TokenType|Token} tokenOrTokenClass The Token instance to be used as the root node, or a constructor Function
 *                         that will create the root node.
 * @param {ParseTree[]} children The sub nodes of the ParseTree to the built
 * @returns {ParseTree}
 */
function PT(tokenOrTokenClass, children) {
    if (children === void 0) { children = []; }
    var childrenCompact = utils_1.compact(children);
    if (tokenOrTokenClass.image !== undefined) {
        return new ParseTree(tokenOrTokenClass, childrenCompact);
    }
    else if (utils_1.isFunction(tokenOrTokenClass)) {
        return new ParseTree(new tokenOrTokenClass(), childrenCompact);
    }
    else if (utils_1.isUndefined(tokenOrTokenClass) || tokenOrTokenClass === null) {
        return null;
    }
    else {
        throw "Invalid parameter " + tokenOrTokenClass + " to PT factory.";
    }
}
exports.PT = PT;
//# sourceMappingURL=parse_tree.js.map