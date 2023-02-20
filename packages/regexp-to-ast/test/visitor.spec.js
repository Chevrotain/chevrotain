const { RegExpParser, BaseRegExpVisitor } = require("../src/regexp-to-ast")
const { expect } = require("chai")

describe("The regexp AST visitor", () => {
  let parser

  before(() => {
    parser = new RegExpParser()
  })

  it("Can visit pattern", () => {
    const ast = parser.pattern("/a|b/")
    class PatternVisitor extends BaseRegExpVisitor {
      visitPattern(node) {
        super.visitPattern(node)
        expect(node.value.value).to.have.lengthOf(2)
      }
    }

    new PatternVisitor().visit(ast)
  })

  it("Can visit Disjunction", () => {
    const ast = parser.pattern("/a|b|c/")
    class DisjunctionVisitor extends BaseRegExpVisitor {
      visitDisjunction(node) {
        super.visitDisjunction(node)
        expect(node.value).to.have.lengthOf(3)
      }
    }

    new DisjunctionVisitor().visit(ast)
  })

  it("Can visit Alternative", () => {
    const ast = parser.pattern("/a|b|c|d/")
    let times = 0
    class AlternativeVisitor extends BaseRegExpVisitor {
      visitAlternative(node) {
        super.visitAlternative(node)
        times++
      }
    }

    new AlternativeVisitor().visit(ast)
    expect(times).to.equal(4)
  })

  it("Can visit StartAnchor", () => {
    const ast = parser.pattern("/^^abc/")
    let times = 0
    class StartAnchorVisitor extends BaseRegExpVisitor {
      visitStartAnchor(node) {
        super.visitStartAnchor(node)
        times++
      }
    }

    new StartAnchorVisitor().visit(ast)
    expect(times).to.equal(2)
  })

  it("Can visit EndAnchor", () => {
    const ast = parser.pattern("/abc$$$/")
    let times = 0
    class EndAnchorVisitor extends BaseRegExpVisitor {
      visitEndAnchor(node) {
        super.visitEndAnchor(node)
        times++
      }
    }

    new EndAnchorVisitor().visit(ast)
    expect(times).to.equal(3)
  })

  it("Can visit WordBoundary", () => {
    const ast = parser.pattern("/abc\\b\\b\\b\\b/")
    let times = 0
    class WordBoundaryVisitor extends BaseRegExpVisitor {
      visitWordBoundary(node) {
        super.visitWordBoundary(node)
        times++
      }
    }

    new WordBoundaryVisitor().visit(ast)
    expect(times).to.equal(4)
  })

  it("Can visit NonWordBoundary", () => {
    const ast = parser.pattern("/abc\\B\\B\\B/")
    let times = 0
    class NonWordBoundaryVisitor extends BaseRegExpVisitor {
      visitNonWordBoundary(node) {
        super.visitNonWordBoundary(node)
        times++
      }
    }

    new NonWordBoundaryVisitor().visit(ast)
    expect(times).to.equal(3)
  })

  it("Can visit Lookahead", () => {
    const ast = parser.pattern("/a(?=a|b)/")
    class LookaheadVisitor extends BaseRegExpVisitor {
      visitLookahead(node) {
        super.visitLookahead(node)
        expect(node.value.value).to.have.lengthOf(2)
      }
    }

    new LookaheadVisitor().visit(ast)
  })

  it("Can visit NegativeLookahead", () => {
    const ast = parser.pattern("/a(?!a|b|c)/")
    class NegativeLookaheadVisitor extends BaseRegExpVisitor {
      visitNegativeLookahead(node) {
        super.visitNegativeLookahead(node)
        expect(node.value.value).to.have.lengthOf(3)
      }
    }

    new NegativeLookaheadVisitor().visit(ast)
  })

  it("Can visit Character", () => {
    const ast = parser.pattern("/a/")
    class CharacterVisitor extends BaseRegExpVisitor {
      visitCharacter(node) {
        super.visitCharacter(node)
        expect(node.value).to.equal(97)
      }
    }

    new CharacterVisitor().visit(ast)
  })

  it("Can visit Character with quantifier", () => {
    const ast = parser.pattern("/a*/")
    class CharacterVisitor extends BaseRegExpVisitor {
      visitCharacter(node) {
        super.visitCharacter(node)
        expect(node.value).to.equal(97)
        expect(node.quantifier.atLeast).to.equal(0)
        expect(node.quantifier.atMost).to.equal(Infinity)
      }
    }

    new CharacterVisitor().visit(ast)
  })

  it("Can visit Set", () => {
    const ast = parser.pattern("/[abc]/")
    class SetVisitor extends BaseRegExpVisitor {
      visitSet(node) {
        super.visitSet(node)
        expect(node.value).to.deep.equal([97, 98, 99])
      }
    }

    new SetVisitor().visit(ast)
  })

  it("Can visit Set with range", () => {
    const ast = parser.pattern("/[a-z]/")
    class SetVisitor extends BaseRegExpVisitor {
      visitSet(node) {
        super.visitSet(node)
        expect(node.value).to.deep.equal([{ from: 97, to: 122 }])
      }
    }

    new SetVisitor().visit(ast)
  })

  it("Can visit Set with quantifier", () => {
    const ast = parser.pattern("/[abc]{1,4}/")
    class SetVisitor extends BaseRegExpVisitor {
      visitSet(node) {
        super.visitSet(node)
        expect(node.value).to.deep.equal([97, 98, 99])
        expect(node.quantifier.atLeast).to.equal(1)
        expect(node.quantifier.atMost).to.equal(4)
      }
    }

    new SetVisitor().visit(ast)
  })

  it("Can visit Group", () => {
    const ast = parser.pattern("/(a|b|c)/")
    class GroupVisitor extends BaseRegExpVisitor {
      visitGroup(node) {
        super.visitGroup(node)
        expect(node.value.value).to.have.lengthOf(3)
      }
    }

    new GroupVisitor().visit(ast)
  })

  it("Can visit Group with quantifier", () => {
    const ast = parser.pattern("/(a|b|c)?/")
    class GroupVisitor extends BaseRegExpVisitor {
      visitGroup(node) {
        super.visitGroup(node)
        expect(node.value.value).to.have.lengthOf(3)
        expect(node.quantifier.atLeast).to.equal(0)
        expect(node.quantifier.atMost).to.equal(1)
      }
    }

    new GroupVisitor().visit(ast)
  })

  it("Can visit Group back reference", () => {
    const ast = parser.pattern("/(ab)\\1/")
    class GroupBackReferenceVisitor extends BaseRegExpVisitor {
      visitGroupBackReference(node) {
        super.visitGroupBackReference(node)
        expect(node.value).to.equal(1)
      }
    }

    new GroupBackReferenceVisitor().visit(ast)
  })

  it("Can visit Group back reference with quantifier", () => {
    const ast = parser.pattern("/(ab)\\1{666}/")
    class GroupBackReferenceVisitor extends BaseRegExpVisitor {
      visitGroupBackReference(node) {
        super.visitGroupBackReference(node)
        expect(node.value).to.equal(1)
        expect(node.quantifier.atLeast).to.equal(666)
        expect(node.quantifier.atMost).to.equal(666)
      }
    }

    new GroupBackReferenceVisitor().visit(ast)
  })

  it("Can visit Quantifier", () => {
    const ast = parser.pattern("/a{1,3}/")
    class QuantifierVisitor extends BaseRegExpVisitor {
      visitQuantifier(node) {
        super.visitQuantifier(node)
        expect(node.atMost).to.equal(3)
      }
    }

    new QuantifierVisitor().visit(ast)
  })
})
