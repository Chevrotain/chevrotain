import { createToken } from "../../../src/scan/tokens_public.js";
import { EmbeddedActionsParser } from "../../../src/parse/parser/traits/parser_traits.js";
import { expect } from "chai";
import { SinonSpy, spy } from "sinon";

describe("Chevrotain's Init Performance Tracing", () => {
  let consoleLogSpy: SinonSpy;

  beforeEach(() => {
    consoleLogSpy = spy(console, "log");
  });

  afterEach(() => {
    // @ts-ignore
    console.log.restore();
  });

  let TracerParserConstructor: any;

  before(() => {
    const PlusTok = createToken({ name: "PlusTok" });

    class TraceParser extends EmbeddedActionsParser {
      constructor(traceInitVal: boolean | number) {
        super([PlusTok], {
          traceInitPerf: traceInitVal,
        });
        this.performSelfAnalysis();
      }

      public topRule = this.RULE("topRule", () => {
        this.CONSUME(PlusTok);
      });
    }

    TracerParserConstructor = TraceParser;
  });

  it("Will not trace with traceInitPerf = false", () => {
    new TracerParserConstructor(false);

    expect(consoleLogSpy).to.have.not.been.called;
  });

  it("Will trace nested with traceInitPerf = true", () => {
    new TracerParserConstructor(true);

    expect(consoleLogSpy).to.have.been.called;
    expect(consoleLogSpy.args[0][0]).to.include("--> <performSelfAnalysis>");
    expect(consoleLogSpy.args[1][0]).to.include("\t--> <toFastProps>");
  });

  it("Will trace one level with traceInitPerf = 1", () => {
    new TracerParserConstructor(1);

    expect(consoleLogSpy).to.have.been.called;
    expect(consoleLogSpy.args[0][0]).to.include("--> <performSelfAnalysis>");
    expect(consoleLogSpy.args[1][0]).to.not.include("\t");
  });

  it("Will trace 2 levels with traceInitPerf = 2", () => {
    new TracerParserConstructor(2);

    expect(consoleLogSpy).to.have.been.called;
    expect(consoleLogSpy.args[0][0]).to.include("--> <performSelfAnalysis>");
    expect(consoleLogSpy.args[1][0]).to.include("\t");
  });
});
