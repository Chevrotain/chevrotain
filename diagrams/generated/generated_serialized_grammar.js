var serializedGrammar = [
	{
		"type": "Rule",
		"name": "json",
		"definition": [
			{
				"type": "Alternation",
				"definition": [
					{
						"type": "Flat",
						"definition": [
							{
								"type": "NonTerminal",
								"name": "object",
								"occurrenceInParent": 1
							}
						]
					},
					{
						"type": "Flat",
						"definition": [
							{
								"type": "NonTerminal",
								"name": "array",
								"occurrenceInParent": 1
							}
						]
					}
				]
			}
		]
	},
	{
		"type": "Rule",
		"name": "object",
		"definition": [
			{
				"type": "Terminal",
				"name": "LCurly",
				"label": "'{'",
				"occurrenceInParent": 1,
				"pattern": "{"
			},
			{
				"type": "RepetitionWithSeparator",
				"separator": {
					"type": "Terminal",
					"name": "Comma",
					"label": "','",
					"occurrenceInParent": 1,
					"pattern": ","
				},
				"definition": [
					{
						"type": "NonTerminal",
						"name": "objectItem",
						"occurrenceInParent": 2
					}
				]
			},
			{
				"type": "Terminal",
				"name": "RCurly",
				"label": "'}'",
				"occurrenceInParent": 1,
				"pattern": "}"
			}
		]
	},
	{
		"type": "Rule",
		"name": "objectItem",
		"definition": [
			{
				"type": "Terminal",
				"name": "StringLiteral",
				"label": "StringLiteral",
				"occurrenceInParent": 1,
				"pattern": "\"(?:[^\\\\\"]+|\\\\(?:[bfnrtv\"\\\\/]|u[0-9a-fA-F]{4}))*\""
			},
			{
				"type": "Terminal",
				"name": "Colon",
				"label": "':'",
				"occurrenceInParent": 1,
				"pattern": ":"
			},
			{
				"type": "NonTerminal",
				"name": "value",
				"occurrenceInParent": 1
			}
		]
	},
	{
		"type": "Rule",
		"name": "array",
		"definition": [
			{
				"type": "Terminal",
				"name": "LSquare",
				"label": "'['",
				"occurrenceInParent": 1,
				"pattern": "\\["
			},
			{
				"type": "Option",
				"definition": [
					{
						"type": "NonTerminal",
						"name": "value",
						"occurrenceInParent": 1
					},
					{
						"type": "Repetition",
						"definition": [
							{
								"type": "Terminal",
								"name": "Comma",
								"label": "','",
								"occurrenceInParent": 1,
								"pattern": ","
							},
							{
								"type": "NonTerminal",
								"name": "value",
								"occurrenceInParent": 2
							}
						]
					}
				]
			},
			{
				"type": "Terminal",
				"name": "RSquare",
				"label": "']'",
				"occurrenceInParent": 1,
				"pattern": "]"
			}
		]
	},
	{
		"type": "Rule",
		"name": "value",
		"definition": [
			{
				"type": "Alternation",
				"definition": [
					{
						"type": "Flat",
						"definition": [
							{
								"type": "Terminal",
								"name": "StringLiteral",
								"label": "StringLiteral",
								"occurrenceInParent": 1,
								"pattern": "\"(?:[^\\\\\"]+|\\\\(?:[bfnrtv\"\\\\/]|u[0-9a-fA-F]{4}))*\""
							}
						]
					},
					{
						"type": "Flat",
						"definition": [
							{
								"type": "Terminal",
								"name": "NumberLiteral",
								"label": "NumberLiteral",
								"occurrenceInParent": 1,
								"pattern": "-?(0|[1-9]\\d*)(\\.\\d+)?([eE][+-]?\\d+)?"
							}
						]
					},
					{
						"type": "Flat",
						"definition": [
							{
								"type": "NonTerminal",
								"name": "object",
								"occurrenceInParent": 1
							}
						]
					},
					{
						"type": "Flat",
						"definition": [
							{
								"type": "NonTerminal",
								"name": "array",
								"occurrenceInParent": 1
							}
						]
					},
					{
						"type": "Flat",
						"definition": [
							{
								"type": "Terminal",
								"name": "True",
								"label": "True",
								"occurrenceInParent": 1,
								"pattern": "true"
							}
						]
					},
					{
						"type": "Flat",
						"definition": [
							{
								"type": "Terminal",
								"name": "False",
								"label": "False",
								"occurrenceInParent": 1,
								"pattern": "false"
							}
						]
					},
					{
						"type": "Flat",
						"definition": [
							{
								"type": "Terminal",
								"name": "Null",
								"label": "Null",
								"occurrenceInParent": 1,
								"pattern": "null"
							}
						]
					}
				]
			}
		]
	}
]