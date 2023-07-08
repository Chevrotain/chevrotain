import { first } from "../../../src/parse/grammar/first.js";
import { setEquality } from "../../utils/matchers.js";
import { Alternation, Alternative, Option, Terminal } from "@chevrotain/gast";
import { expect } from "chai";
import { createToken } from "../../../src/scan/tokens_public.js";

describe("The Grammar Ast first model", () => {
  it("can compute the first for a terminal", () => {
    const CommaTok = createToken({ name: "CommaTok", pattern: /NA/ });
    const EntityTok = createToken({ name: "EntityTok", pattern: /NA/ });
    const terminal = new Terminal({ terminalType: EntityTok });
    const actual = first(terminal);
    expect(actual.length).to.equal(1);
    expect(actual[0]).to.equal(EntityTok);

    const terminal2 = new Terminal({ terminalType: CommaTok });
    const actual2 = first(terminal2);
    expect(actual2.length).to.equal(1);
    expect(actual2[0]).to.equal(CommaTok);
  });

  it("can compute the first for a Sequence production ", () => {
    const EntityTok = createToken({ name: "EntityTok", pattern: /NA/ });
    const NamespaceTok = createToken({ name: "NamespaceTok", pattern: /NA/ });
    const seqProduction = new Alternative({
      definition: [new Terminal({ terminalType: EntityTok })],
    });
    const actual = first(seqProduction);
    expect(actual.length).to.equal(1);
    expect(actual[0]).to.equal(EntityTok);

    const seqProduction2 = new Alternative({
      definition: [
        new Terminal({ terminalType: EntityTok }),
        new Option({
          definition: [new Terminal({ terminalType: NamespaceTok })],
        }),
      ],
    });
    const actual2 = first(seqProduction2);
    expect(actual2.length).to.equal(1);
    expect(actual2[0]).to.equal(EntityTok);
  });

  it("can compute the first for an alternatives production ", () => {
    const EntityTok = createToken({ name: "EntityTok", pattern: /NA/ });
    const NamespaceTok = createToken({ name: "NamespaceTok", pattern: /NA/ });
    const TypeTok = createToken({ name: "TypeTok", pattern: /NA/ });
    const altProduction = new Alternation({
      definition: [
        new Alternative({
          definition: [new Terminal({ terminalType: EntityTok })],
        }),
        new Alternative({
          definition: [new Terminal({ terminalType: NamespaceTok })],
        }),
        new Alternative({
          definition: [new Terminal({ terminalType: TypeTok })],
        }),
      ],
    });
    const actual = first(altProduction);
    expect(actual.length).to.equal(3);
    expect(actual[0]).to.equal(EntityTok);
    expect(actual[1]).to.equal(NamespaceTok);
    expect(actual[2]).to.equal(TypeTok);
  });

  it("can compute the first for an production with optional prefix", () => {
    const EntityTok = createToken({ name: "EntityTok", pattern: /NA/ });
    const NamespaceTok = createToken({ name: "NamespaceTok", pattern: /NA/ });
    const ConstTok = createToken({ name: "ConstTok", pattern: /NA/ });
    const ColonTok = createToken({ name: "ColonTok", pattern: /NA/ });

    const withOptionalPrefix = new Alternative({
      definition: [
        new Option({
          definition: [new Terminal({ terminalType: NamespaceTok })],
        }),
        new Terminal({ terminalType: EntityTok }),
      ],
    });
    const actual = first(withOptionalPrefix);
    setEquality(actual, [NamespaceTok, EntityTok]);

    const withTwoOptPrefix = new Alternative({
      definition: [
        new Option({
          definition: [new Terminal({ terminalType: NamespaceTok })],
        }),
        new Option({
          definition: [new Terminal({ terminalType: ColonTok })],
        }),
        new Terminal({ terminalType: EntityTok }),
        new Option({
          definition: [new Terminal({ terminalType: ConstTok })],
        }),
      ],
    });
    const actual2 = first(withTwoOptPrefix);
    setEquality(actual2, [NamespaceTok, ColonTok, EntityTok]);
  });
});
