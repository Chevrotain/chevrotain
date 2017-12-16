// Copied with some modifications from: https://github.com/harc/ohm/blob/master/examples/ecmascript/es5.js

/* eslint-env node */

"use strict"

// --------------------------------------------------------------------
// Imports
// --------------------------------------------------------------------

var fs = require("fs")
var path = require("path")

var ohm = require("ohm-js")

// --------------------------------------------------------------------
// Helpers
// --------------------------------------------------------------------

// Take an Array of nodes, and whenever an _iter node is encountered, splice in its
// recursively-flattened children instead.
function flattenIterNodes(nodes) {
	var result = []
	for (var i = 0; i < nodes.length; ++i) {
		if (nodes[i]._node.ctorName === "_iter") {
			result.push.apply(result, flattenIterNodes(nodes[i].children))
		} else {
			result.push(nodes[i])
		}
	}
	return result
}

// Comparison function for sorting nodes based on their interval's start index.
function compareByInterval(node, otherNode) {
	return node.source.startIdx - otherNode.source.startIdx
}

function nodeToES5(node, children) {
	var flatChildren = flattenIterNodes(children).sort(compareByInterval)

	// Keeps track of where the previous sibling ended, so that we can re-insert discarded
	// whitespace into the final output.
	var prevEndIdx = node.source.startIdx

	var code = ""
	for (var i = 0; i < flatChildren.length; ++i) {
		var child = flatChildren[i]

		// Restore any discarded whitespace between this node and the previous one.
		if (child.source.startIdx > prevEndIdx) {
			code += node.source.sourceString.slice(
				prevEndIdx,
				child.source.startIdx
			)
		}
		code += child.toES5()
		prevEndIdx = child.source.endIdx
	}
	return code
}

// Instantiate the ES5 grammar.
var contents = fs.readFileSync(path.join(__dirname, "es5.ohm"))
var g = ohm.grammars(contents).ES5

module.exports = {
	grammar: g
}
