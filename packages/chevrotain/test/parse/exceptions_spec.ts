import ErrorStackParser from "error-stack-parser";
import { createTokenInstance, EOF } from "../../src/scan/tokens_public.js";
import {
  EarlyExitException,
  MismatchedTokenException,
  NotAllInputParsedException,
  NoViableAltException,
} from "../../src/parse/exceptions_public.js";
import { expect } from "chai";
import { IToken } from "@chevrotain/types";

describe("Chevrotain's Parsing Exceptions", () => {
  describe("the exception instance subclasses Error with the right properties for: ", () => {
    let currentToken: IToken;
    let previousToken: IToken;

    before(() => {
      currentToken = createTokenInstance(EOF, "cur", -1, -1, -1, -1, -1, -1);
      previousToken = createTokenInstance(EOF, "prv", -1, -1, -1, -1, -1, -1);
    });

    it("EarlyExitException", () => {
      const exceptionInstance = new EarlyExitException(
        "error message",
        currentToken,
        previousToken,
      );
      expect(exceptionInstance).to.be.an.instanceOf(EarlyExitException);
      expect(exceptionInstance).to.be.an.instanceOf(Error);
      expect(exceptionInstance.name).to.equal("EarlyExitException");
      expect(exceptionInstance.message).to.equal("error message");
      expect(exceptionInstance.token).to.equal(currentToken);
      expect(exceptionInstance.previousToken).to.equal(previousToken);
      expect(exceptionInstance.resyncedTokens).to.be.empty;
    });

    it("NoViableAltException", () => {
      const exceptionInstance = new NoViableAltException(
        "error message",
        currentToken,
        previousToken,
      );
      expect(exceptionInstance).to.be.an.instanceOf(NoViableAltException);
      expect(exceptionInstance).to.be.an.instanceOf(Error);
      expect(exceptionInstance.name).to.equal("NoViableAltException");
      expect(exceptionInstance.message).to.equal("error message");
      expect(exceptionInstance.token).to.equal(currentToken);
      expect(exceptionInstance.previousToken).to.equal(previousToken);
      expect(exceptionInstance.resyncedTokens).to.be.empty;
    });

    it("NotAllInputParsedException", () => {
      const exceptionInstance = new NotAllInputParsedException(
        "error message",
        currentToken,
      );
      expect(exceptionInstance).to.be.an.instanceOf(NotAllInputParsedException);
      expect(exceptionInstance).to.be.an.instanceOf(Error);
      expect(exceptionInstance.name).to.equal("NotAllInputParsedException");
      expect(exceptionInstance.message).to.equal("error message");
      expect(exceptionInstance.token).to.equal(currentToken);
      expect(exceptionInstance.resyncedTokens).to.be.empty;
    });

    it("MismatchedTokenException", () => {
      const exceptionInstance = new MismatchedTokenException(
        "error message",
        currentToken,
        previousToken,
      );
      expect(exceptionInstance).to.be.an.instanceOf(MismatchedTokenException);
      expect(exceptionInstance).to.be.an.instanceOf(Error);
      expect(exceptionInstance.name).to.equal("MismatchedTokenException");
      expect(exceptionInstance.message).to.equal("error message");
      expect(exceptionInstance.token).to.equal(currentToken);
      expect(exceptionInstance.resyncedTokens).to.be.empty;
    });
  });

  describe("the exception instance stacktrace is valid for: ", () => {
    const dummyToken = createTokenInstance(EOF, "cur", -1, -1, -1, -1, -1, -1);

    function throwAndCatchException(errorFactory: () => Error) {
      try {
        throw errorFactory();
      } catch (e) {
        return e;
      }
    }

    // Arrow functions may be reported as "<anonymous>", "anonymous", or undefined
    // depending on Node/V8 version — accept any of these for the throw-site frame.
    const anonymousFunctionNames = ["<anonymous>", "anonymous", undefined];

    function assertValidStacktrace(exceptionInstance: Error) {
      const stacktrace = ErrorStackParser.parse(exceptionInstance);
      expect(stacktrace.length).to.be.at.least(2);
      expect(anonymousFunctionNames).to.include(
        stacktrace[0].functionName,
        "throw-site frame should be anonymous/lambda",
      );
      expect(stacktrace[1].functionName).to.equal("throwAndCatchException");
    }

    it("EarlyExitException", () => {
      const exceptionInstance = throwAndCatchException(
        () => new EarlyExitException("", dummyToken, dummyToken),
      );
      assertValidStacktrace(exceptionInstance);
    });

    it("NoViableAltException", () => {
      const exceptionInstance = throwAndCatchException(
        () => new NoViableAltException("", dummyToken, dummyToken),
      );
      assertValidStacktrace(exceptionInstance);
    });

    it("NotAllInputParsedException", () => {
      const exceptionInstance = throwAndCatchException(
        () => new NotAllInputParsedException("", dummyToken),
      );
      assertValidStacktrace(exceptionInstance);
    });

    it("MismatchedTokenException", () => {
      const exceptionInstance = throwAndCatchException(
        () => new MismatchedTokenException("", dummyToken, dummyToken),
      );
      assertValidStacktrace(exceptionInstance);
    });
  });
});
