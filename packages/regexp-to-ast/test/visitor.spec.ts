import { expect } from "chai"
import type {
  Alternative,
  Assertion,
  Character,
  Disjunction,
  Group,
  GroupBackReference,
  Quantifier,
  RegExpPattern,
  Set
} from "../types"
import { RegExpParser } from "../src/regexp-parser.js"
import { BaseRegExpVisitor } from "../src/base-regexp-visitor.js"

describe("The regexp AST visitor", () => {
  let parser: RegExpParser

  before(() => {
    parser = new RegExpParser()
  })

  it("Can visit pattern", () => {
    const ast = parser.pattern("/a|b/")
    class PatternVisitor extends BaseRegExpVisitor {
      visitPattern(node: RegExpPattern) {
        super.visitPattern(node)
        expect(node.value.value).to.have.lengthOf(2)
      }
    }

    new PatternVisitor().visit(ast)
  })

  it("Can visit Disjunction", () => {
    const ast = parser.pattern("/a|b|c/")
    class DisjunctionVisitor extends BaseRegExpVisitor {
      visitDisjunction(node: Disjunction) {
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
      visitAlternative(node: Alternative) {
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
      visitStartAnchor(node: Assertion) {
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
      visitEndAnchor(node: Assertion) {
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
      visitWordBoundary(node: Assertion) {
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
      visitNonWordBoundary(node: Assertion) {
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
      visitLookahead(node: Assertion) {
        super.visitLookahead(node)
        expect(node.value?.value).to.have.lengthOf(2)
      }
    }

    new LookaheadVisitor().visit(ast)
  })

  it("Can visit NegativeLookahead", () => {
    const ast = parser.pattern("/a(?!a|b|c)/")
    class NegativeLookaheadVisitor extends BaseRegExpVisitor {
      visitNegativeLookahead(node: Assertion) {
        super.visitNegativeLookahead(node)
        expect(node.value!.value).to.have.lengthOf(3)
      }
    }

    new NegativeLookaheadVisitor().visit(ast)
  })

  it("Can visit Character", () => {
    const ast = parser.pattern("/a/")
    class CharacterVisitor extends BaseRegExpVisitor {
      visitCharacter(node: Character) {
        super.visitCharacter(node)
        expect(node.value).to.equal(97)
      }
    }

    new CharacterVisitor().visit(ast)
  })

  it("Can visit Character with quantifier", () => {
    const ast = parser.pattern("/a*/")
    class CharacterVisitor extends BaseRegExpVisitor {
      visitCharacter(node: Character) {
        super.visitCharacter(node)
        expect(node.value).to.equal(97)
        expect(node.quantifier?.atLeast).to.equal(0)
        expect(node.quantifier?.atMost).to.equal(Infinity)
      }
    }

    new CharacterVisitor().visit(ast)
  })

  it("Can visit Set", () => {
    const ast = parser.pattern("/[abc]/")
    class SetVisitor extends BaseRegExpVisitor {
      visitSet(node: Set) {
        super.visitSet(node)
        expect(node.value).to.deep.equal([97, 98, 99])
      }
    }

    new SetVisitor().visit(ast)
  })

  it("Can visit Set with range", () => {
    const ast = parser.pattern("/[a-z]/")
    class SetVisitor extends BaseRegExpVisitor {
      visitSet(node: Set) {
        super.visitSet(node)
        expect(node.value).to.deep.equal([{ from: 97, to: 122 }])
      }
    }

    new SetVisitor().visit(ast)
  })

  it("Can visit Set with quantifier", () => {
    const ast = parser.pattern("/[abc]{1,4}/")
    class SetVisitor extends BaseRegExpVisitor {
      visitSet(node: Set) {
        super.visitSet(node)
        expect(node.value).to.deep.equal([97, 98, 99])
        expect(node.quantifier?.atLeast).to.equal(1)
        expect(node.quantifier?.atMost).to.equal(4)
      }
    }

    new SetVisitor().visit(ast)
  })

  it("Can visit Group", () => {
    const ast = parser.pattern("/(a|b|c)/")
    class GroupVisitor extends BaseRegExpVisitor {
      visitGroup(node: Group) {
        super.visitGroup(node)
        expect(node.value.value).to.have.lengthOf(3)
      }
    }

    new GroupVisitor().visit(ast)
  })

  it("Can visit Group with quantifier", () => {
    const ast = parser.pattern("/(a|b|c)?/")
    class GroupVisitor extends BaseRegExpVisitor {
      visitGroup(node: Group) {
        super.visitGroup(node)
        expect(node.value.value).to.have.lengthOf(3)
        expect(node.quantifier?.atLeast).to.equal(0)
        expect(node.quantifier?.atMost).to.equal(1)
      }
    }

    new GroupVisitor().visit(ast)
  })

  it("Can visit Group back reference", () => {
    const ast = parser.pattern("/(ab)\\1/")
    class GroupBackReferenceVisitor extends BaseRegExpVisitor {
      visitGroupBackReference(node: GroupBackReference) {
        super.visitGroupBackReference(node)
        expect(node.value).to.equal(1)
      }
    }

    new GroupBackReferenceVisitor().visit(ast)
  })

  it("Can visit Group back reference with quantifier", () => {
    const ast = parser.pattern("/(ab)\\1{666}/")
    class GroupBackReferenceVisitor extends BaseRegExpVisitor {
      visitGroupBackReference(node: GroupBackReference) {
        super.visitGroupBackReference(node)
        expect(node.value).to.equal(1)
        expect(node.quantifier?.atLeast).to.equal(666)
        expect(node.quantifier?.atMost).to.equal(666)
      }
    }

    new GroupBackReferenceVisitor().visit(ast)
  })

  it("Can visit Quantifier", () => {
    const ast = parser.pattern("/a{1,3}/")
    class QuantifierVisitor extends BaseRegExpVisitor {
      visitQuantifier(node: Quantifier) {
        super.visitQuantifier(node)
        expect(node.atMost).to.equal(3)
      }
    }

    new QuantifierVisitor().visit(ast)
  })
})
