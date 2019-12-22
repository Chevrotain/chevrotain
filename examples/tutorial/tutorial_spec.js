"use strict"
const expect = require("chai").expect
const _ = require("lodash")
const tokenMatcher = require("chevrotain").tokenMatcher
const lex = require("./step1_lexing").lex
const parse = require("./step2_parsing").parse
const toAstVisitor = require("./step3a_actions_visitor").toAst
const toAstEmbedded = require("./step3b_actions_embedded").toAst
const tokenVocabulary = require("./step1_lexing").tokenVocabulary
const parseJsonToCst = require("./step4_error_recovery").parse

describe("Chevrotain Tutorial", () => {
  context("Step 1 - Lexing", () => {
    it("Can Lex a simple input", () => {
      let inputText = "SELECT column1 FROM table2"
      let lexingResult = lex(inputText)

      expect(lexingResult.errors).to.be.empty

      let tokens = lexingResult.tokens
      expect(tokens).to.have.lengthOf(4)
      expect(tokens[0].image).to.equal("SELECT")
      expect(tokens[1].image).to.equal("column1")
      expect(tokens[2].image).to.equal("FROM")
      expect(tokens[3].image).to.equal("table2")

      // tokenMatcher acts as an "instanceof" check for Tokens
      expect(tokenMatcher(tokens[0], tokenVocabulary.Select)).to.be.true
      expect(tokenMatcher(tokens[1], tokenVocabulary.Identifier)).to.be.true
      expect(tokenMatcher(tokens[2], tokenVocabulary.From)).to.be.true
      expect(tokenMatcher(tokens[3], tokenVocabulary.Identifier)).to.be.true
    })
  })

  context("Step 2 - Parsing", () => {
    it("Can Parse a simple input", () => {
      let inputText = "SELECT column1 FROM table2"
      expect(() => parse(inputText)).to.not.throw()
    })

    it("Will throw an error for an invalid input", () => {
      // missing table name
      let inputText = "SELECT FROM table2"
      expect(() => parse(inputText)).to.throw(
        "expecting at least one iteration which starts with one of these possible Token sequences"
      )
      expect(() => parse(inputText)).to.throw(
        "<[Identifier]> but found: 'FROM'"
      )
    })
  })

  context("Step 3a - Actions (semantics) using CST Visitor", () => {
    it("Can convert a simple input to an AST", () => {
      let inputText = "SELECT column1, column2 FROM table2 WHERE column2 > 3"
      let ast = toAstVisitor(inputText)

      expect(ast).to.deep.equal({
        type: "SELECT_STMT",
        selectClause: {
          type: "SELECT_CLAUSE",
          columns: ["column1", "column2"]
        },
        fromClause: {
          type: "FROM_CLAUSE",
          table: "table2"
        },
        whereClause: {
          condition: {
            lhs: "column2",
            operator: ">",
            rhs: "3",
            type: "EXPRESSION"
          },
          type: "WHERE_CLAUSE"
        }
      })
    })
  })

  context("Step 3a - Actions (semantics) using embedded actions", () => {
    it("Can convert a simple input to an AST", () => {
      let inputText = "SELECT column1, column2 FROM table2 WHERE column2 > 3"
      let ast = toAstEmbedded(inputText)

      expect(ast).to.deep.equal({
        type: "SELECT_STMT",
        selectClause: {
          type: "SELECT_CLAUSE",
          columns: ["column1", "column2"]
        },
        fromClause: {
          type: "FROM_CLAUSE",
          table: "table2"
        },
        whereClause: {
          condition: {
            lhs: "column2",
            operator: ">",
            rhs: "3",
            type: "EXPRESSION"
          },
          type: "WHERE_CLAUSE"
        }
      })
    })
  })

  context("Step 4 - Fault tolerance and error recovery", () => {
    // to make it easier to understand the assertions
    function minimizeCst(cstElement) {
      // tokenType idx is auto generated, can't assert over it
      if (cstElement.tokenType) {
        delete cstElement.tokenType
      }

      // CstNode
      if (cstElement.children !== undefined) {
        cstElement.children = _.omitBy(cstElement.children, _.isEmpty)
        _.forEach(cstElement.children, childArr => {
          _.forEach(childArr, minimizeCst)
        })
      }

      return cstElement
    }

    it("Can perform single token insertion recovery", () => {
      let invalidInput = '{ "key"   666}'
      let parsingResult = parseJsonToCst(invalidInput)
      expect(parsingResult.parseErrors).to.have.lengthOf(1)
      expect(parsingResult.parseErrors[0].message).to.include(
        "Expecting token of type --> Colon <-- but found --> '666' <--"
      )
      let minimizedCst = minimizeCst(parsingResult.cst)

      // even though an error occurred, the whole input was parsed successfully and the output structure created.
      expect(minimizedCst).to.deep.equal({
        name: "json",
        children: {
          object: [
            {
              name: "object",
              children: {
                LCurly: [
                  {
                    image: "{",
                    startOffset: 0
                  }
                ],
                objectItem: [
                  {
                    name: "objectItem",
                    children: {
                      StringLiteral: [
                        {
                          image: '"key"',
                          startOffset: 2
                        }
                      ],
                      // This missing colon token was inserted in recovery.
                      Colon: [
                        {
                          image: "",
                          startOffset: NaN,
                          endOffset: NaN,
                          startLine: NaN,
                          endLine: NaN,
                          startColumn: NaN,
                          endColumn: NaN,
                          isInsertedInRecovery: true
                        }
                      ],
                      // the value rule appears AFTER the error (missing colon) yet it was still parsed successfully
                      // due to the error recovery.
                      value: [
                        {
                          name: "value",
                          children: {
                            NumberLiteral: [
                              {
                                image: "666",
                                startOffset: 10
                              }
                            ]
                          }
                        }
                      ]
                    }
                  }
                ],
                RCurly: [
                  {
                    image: "}",
                    startOffset: 13
                  }
                ]
              }
            }
          ]
        }
      })
    })

    it("Can perform single token deletion recovery", () => {
      let invalidInput = '{ "key" }: 666}'
      let parsingResult = parseJsonToCst(invalidInput)
      expect(parsingResult.parseErrors).to.have.lengthOf(1)
      expect(parsingResult.parseErrors[0].message).to.include(
        "Expecting token of type --> Colon <-- but found --> '}' <--"
      )
      let minimizedCst = minimizeCst(parsingResult.cst)

      // even though an error occurred, the whole input was parsed successfully and the output structure created.
      expect(minimizedCst).to.deep.equal({
        name: "json",
        children: {
          object: [
            {
              name: "object",
              children: {
                LCurly: [
                  {
                    image: "{",
                    startOffset: 0
                  }
                ],
                objectItem: [
                  {
                    name: "objectItem",
                    children: {
                      StringLiteral: [
                        {
                          image: '"key"',
                          startOffset: 2
                        }
                      ],
                      // The out of place '}' brackets were ignored and the colon token was parsed instead.
                      Colon: [
                        {
                          image: ":",
                          startOffset: 9
                        }
                      ],
                      // the value rule appears AFTER the error (out of place '}' brackets) yet it was still parsed
                      // successfully due to the error recovery.
                      value: [
                        {
                          name: "value",
                          children: {
                            NumberLiteral: [
                              {
                                image: "666",
                                startOffset: 11
                              }
                            ]
                          }
                        }
                      ]
                    }
                  }
                ],
                RCurly: [
                  {
                    image: "}",
                    startOffset: 14
                  }
                ]
              }
            }
          ]
        }
      })
    })

    it("Can perform in repetition re-sync recovery", () => {
      // the '666' number literal should not appear after the "2"
      let invalidInput =
        '{\n"key1" : 1, \n"key2" : 2 666 \n"key3"  : 3, \n"key4"  : 4 }'
      let parsingResult = parseJsonToCst(invalidInput)
      expect(parsingResult.parseErrors).to.have.lengthOf(1)
      expect(parsingResult.parseErrors[0].message).to.include(
        "Expecting token of type --> RCurly <-- but found --> '666'"
      )
      let minimizedCst = minimizeCst(parsingResult.cst)

      // extract the key/value pairs
      let objectItemCstArr = minimizedCst.children.object[0].children.objectItem
      // The original input has 4 keys, but after recover the 3rd key should be skipped (re-synced)
      // because the parser will re-sync to the next comma "," as that is the expected next Token after a key/value pair.
      expect(objectItemCstArr).to.have.lengthOf(3)
      expect(objectItemCstArr[0].children.StringLiteral[0].image).to.equal(
        '"key1"'
      )
      expect(objectItemCstArr[1].children.StringLiteral[0].image).to.equal(
        '"key2"'
      )
      // key3 will be re-synced
      // key4 appears in the input AFTER the error, yet due to error recovery it is still appears in the output
      expect(objectItemCstArr[2].children.StringLiteral[0].image).to.equal(
        '"key4"'
      )
    })

    it("Can perform  Between Rules Re-Sync recovery", () => {
      let invalidInput =
        "{ \n" +
        '"firstName": "John",\n ' +
        '"someData": { "bad" :: "part" }, \n' +
        '"isAlive": true, \n' +
        '"age": 25 \n' +
        "}"
      let parsingResult = parseJsonToCst(invalidInput)
      expect(parsingResult.parseErrors).to.have.lengthOf(1)
      expect(parsingResult.parseErrors[0].message).to.include(
        "Expecting: one of these possible Token sequences:\n  1. [StringLiteral]\n  2. [NumberLiteral]\n  3. [LCurly]\n  4. [LSquare]\n  5. [True]\n  6. [False]\n  7. [Null]\nbut found: ':'"
      )
      let minimizedCst = minimizeCst(parsingResult.cst)

      // extract the key/value pairs
      let objectItemCstArr = minimizedCst.children.object[0].children.objectItem
      expect(objectItemCstArr).to.have.lengthOf(4)
      expect(objectItemCstArr[0].children.StringLiteral[0].image).to.equal(
        '"firstName"'
      )
      // There is an error inside "someData" value, but we still get the key back (and part of the value...)
      expect(objectItemCstArr[1].children.StringLiteral[0].image).to.equal(
        '"someData"'
      )
      // These keys appear AFTER the error, yet they were still parsed successfully due to error recovery.
      expect(objectItemCstArr[2].children.StringLiteral[0].image).to.equal(
        '"isAlive"'
      )
      expect(objectItemCstArr[3].children.StringLiteral[0].image).to.equal(
        '"age"'
      )
    })
  })
})
