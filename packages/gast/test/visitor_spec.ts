import { expect } from "chai";
import type { ITokenConfig, TokenType } from "@chevrotain/types";
import {
  Alternation,
  Alternative,
  GAstVisitor,
  NonTerminal,
  Option,
  Repetition,
  RepetitionMandatory,
  RepetitionMandatoryWithSeparator,
  RepetitionWithSeparator,
  Rule,
  Terminal,
} from "../src/api.js";

function createDummyToken(opts: ITokenConfig): TokenType {
  return {
    name: opts.name,
    PATTERN: opts.pattern,
  };
}

describe("the gast visitor", () => {
  context("visit/traversal methods", () => {
    let A: TokenType;
    let B: TokenType;

    before(() => {
      A = createDummyToken({ name: "A" });
      B = createDummyToken({ name: "B" });
    });

    it("can visit a terminal", () => {
      let visited = false;
      const terminal = new Terminal({ terminalType: A });

      class TerminalTestVisitor extends GAstVisitor {
        visitTerminal(node: Terminal): void {
          expect(node).to.equal(terminal);
          visited = true;
        }
      }

      const visitor = new TerminalTestVisitor();
      terminal.accept(visitor);
      expect(visited).to.be.true;
    });

    it("can visit a Rule", () => {
      let visitedChild = false;
      let visitedTop = false;
      const ruleNode = new Rule({
        name: "foo",
        definition: [new Terminal({ terminalType: B })],
      });

      class TestVisitor extends GAstVisitor {
        visitRule(node: Rule) {
          expect(node).to.equal(ruleNode);
          visitedTop = true;
        }
        visitTerminal(node: Terminal): void {
          expect(node.terminalType).to.equal(B);
          visitedChild = true;
        }
      }

      const visitor = new TestVisitor();
      ruleNode.accept(visitor);
      expect(visitedTop).to.be.true;
      expect(visitedChild).to.be.true;
    });

    it("can visit an Alternation", () => {
      const visitedChild: boolean[] = [];
      let visitedTop = false;
      const alternation = new Alternation({
        definition: [
          new Alternative({ definition: [new Terminal({ terminalType: B })] }),
        ],
      });

      class TestVisitor extends GAstVisitor {
        visitAlternative(node: Alternative): any {
          visitedChild.push(true);
        }

        visitTerminal(node: Terminal): void {
          expect(node.terminalType).to.equal(B);
          visitedChild.push(true);
        }
        visitAlternation(node: Alternation): void {
          expect(node).to.equal(alternation);
          visitedTop = true;
        }
      }

      const visitor = new TestVisitor();
      alternation.accept(visitor);
      expect(visitedTop).to.be.true;
      expect(visitedChild).to.deep.equal([true, true]);
    });

    it("can visit a Repetition", () => {
      let visitedChild = false;
      let visitedRoot = false;
      const rootNode = new Repetition({
        definition: [new Terminal({ terminalType: B })],
      });

      class TestVisitor extends GAstVisitor {
        visitRepetition(node: Repetition) {
          expect(node).to.equal(rootNode);
          visitedRoot = true;
        }
        visitTerminal(node: Terminal): void {
          expect(node.terminalType).to.equal(B);
          visitedChild = true;
        }
      }

      const visitor = new TestVisitor();
      rootNode.accept(visitor);
      expect(visitedRoot).to.be.true;
      expect(visitedChild).to.be.true;
    });

    it("can visit a Repetition Mandatory", () => {
      let visitedChild = false;
      let visitedRoot = false;
      const rootNode = new RepetitionMandatory({
        definition: [new Terminal({ terminalType: B })],
      });

      class TestVisitor extends GAstVisitor {
        visitRepetitionMandatory(node: Repetition) {
          expect(node).to.equal(rootNode);
          visitedRoot = true;
        }
        visitTerminal(node: Terminal): void {
          expect(node.terminalType).to.equal(B);
          visitedChild = true;
        }
      }

      const visitor = new TestVisitor();
      rootNode.accept(visitor);
      expect(visitedRoot).to.be.true;
      expect(visitedChild).to.be.true;
    });

    it("can visit a Repetition With Separator", () => {
      let visitedChild = false;
      let visitedRoot = false;
      const rootNode = new RepetitionWithSeparator({
        separator: A,
        definition: [new Terminal({ terminalType: B })],
      });

      class TestVisitor extends GAstVisitor {
        visitRepetitionWithSeparator(node: RepetitionWithSeparator) {
          expect(node).to.equal(rootNode);
          expect(node.separator).to.equal;
          visitedRoot = true;
        }
        visitTerminal(node: Terminal): void {
          expect(node.terminalType).to.equal(B);
          visitedChild = true;
        }
      }

      const visitor = new TestVisitor();
      rootNode.accept(visitor);
      expect(visitedRoot).to.be.true;
      expect(visitedChild).to.be.true;
    });

    it("can visit a Repetition Mandatory With Separator", () => {
      let visitedChild = false;
      let visitedRoot = false;
      const rootNode = new RepetitionMandatoryWithSeparator({
        separator: A,
        definition: [new Terminal({ terminalType: B })],
      });

      class TestVisitor extends GAstVisitor {
        visitRepetitionMandatoryWithSeparator(
          node: RepetitionMandatoryWithSeparator,
        ): void {
          expect(node).to.equal(rootNode);
          expect(node.separator).to.equal;
          visitedRoot = true;
        }

        visitTerminal(node: Terminal): void {
          expect(node.terminalType).to.equal(B);
          visitedChild = true;
        }
      }

      const visitor = new TestVisitor();
      rootNode.accept(visitor);
      expect(visitedRoot).to.be.true;
      expect(visitedChild).to.be.true;
    });

    it("can visit an Option", () => {
      let visitedChild = false;
      let visitedRoot = false;
      const rootNode = new Option({
        definition: [new Terminal({ terminalType: B })],
      });

      class TestVisitor extends GAstVisitor {
        visitOption(node: Option): void {
          expect(node).to.equal(rootNode);
          visitedRoot = true;
        }

        visitTerminal(node: Terminal): void {
          expect(node.terminalType).to.equal(B);
          visitedChild = true;
        }
      }

      const visitor = new TestVisitor();
      rootNode.accept(visitor);
      expect(visitedRoot).to.be.true;
      expect(visitedChild).to.be.true;
    });

    it("can visit an Non-Terminal", () => {
      let visitedRoot = false;
      const rootNode = new NonTerminal({ nonTerminalName: "foo" });

      class TestVisitor extends GAstVisitor {
        visitNonTerminal(node: NonTerminal): any {
          expect(node.nonTerminalName).to.equal("foo");
          visitedRoot = true;
        }
      }

      const visitor = new TestVisitor();
      rootNode.accept(visitor);
      expect(visitedRoot).to.be.true;
    });
  });
});
