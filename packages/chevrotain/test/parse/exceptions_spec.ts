import * as ErrorStackParser from "error-stack-parser"
import { createTokenInstance, EOF } from "../../src/scan/tokens_public"
import {
  EarlyExitException,
  NoViableAltException,
  NotAllInputParsedException,
  MismatchedTokenException
} from "../../src/parse/exceptions_public"

describe("Chevrotain's Parsing Exceptions", () => {
  describe("the exception instance subclasses Error with the right properties for: ", () => {
    let currentToken = createTokenInstance(EOF, "cur", -1, -1, -1, -1, -1, -1)
    let previousToken = createTokenInstance(EOF, "prv", -1, -1, -1, -1, -1, -1)

    it("EarlyExitException", () => {
      let exceptionInstance = new EarlyExitException(
        "error message",
        currentToken,
        previousToken
      )
      expect(exceptionInstance).to.be.an.instanceOf(EarlyExitException)
      expect(exceptionInstance).to.be.an.instanceOf(Error)
      expect(exceptionInstance.name).to.equal("EarlyExitException")
      expect(exceptionInstance.message).to.equal("error message")
      expect(exceptionInstance.token).to.equal(currentToken)
      expect(exceptionInstance.previousToken).to.equal(previousToken)
      expect(exceptionInstance.resyncedTokens).to.be.empty
    })

    it("NoViableAltException", () => {
      let exceptionInstance = new NoViableAltException(
        "error message",
        currentToken,
        previousToken
      )
      expect(exceptionInstance).to.be.an.instanceOf(NoViableAltException)
      expect(exceptionInstance).to.be.an.instanceOf(Error)
      expect(exceptionInstance.name).to.equal("NoViableAltException")
      expect(exceptionInstance.message).to.equal("error message")
      expect(exceptionInstance.token).to.equal(currentToken)
      expect(exceptionInstance.previousToken).to.equal(previousToken)
      expect(exceptionInstance.resyncedTokens).to.be.empty
    })

    it("NotAllInputParsedException", () => {
      let exceptionInstance = new NotAllInputParsedException(
        "error message",
        currentToken
      )
      expect(exceptionInstance).to.be.an.instanceOf(NotAllInputParsedException)
      expect(exceptionInstance).to.be.an.instanceOf(Error)
      expect(exceptionInstance.name).to.equal("NotAllInputParsedException")
      expect(exceptionInstance.message).to.equal("error message")
      expect(exceptionInstance.token).to.equal(currentToken)
      expect(exceptionInstance.resyncedTokens).to.be.empty
    })

    it("MismatchedTokenException", () => {
      let exceptionInstance = new MismatchedTokenException(
        "error message",
        currentToken,
        previousToken
      )
      expect(exceptionInstance).to.be.an.instanceOf(MismatchedTokenException)
      expect(exceptionInstance).to.be.an.instanceOf(Error)
      expect(exceptionInstance.name).to.equal("MismatchedTokenException")
      expect(exceptionInstance.message).to.equal("error message")
      expect(exceptionInstance.token).to.equal(currentToken)
      expect(exceptionInstance.resyncedTokens).to.be.empty
    })
  })

  describe("the exception instance stacktrace is valid for: ", () => {
    let dummyToken = createTokenInstance(EOF, "cur", -1, -1, -1, -1, -1, -1)

    function throwAndCatchException(errorFactory: () => Error) {
      try {
        throw errorFactory()
      } catch (e) {
        return e
      }
    }

    it("EarlyExitException", () => {
      let exceptionInstance = throwAndCatchException(
        () => new EarlyExitException("", dummyToken, dummyToken)
      )
      let stacktrace = ErrorStackParser.parse(exceptionInstance)
      expect(stacktrace[0].functionName).to.be.undefined // lambda function
      expect(stacktrace[1].functionName).to.equal("throwAndCatchException")
    })

    it("NoViableAltException", () => {
      let exceptionInstance = throwAndCatchException(
        () => new NoViableAltException("", dummyToken, dummyToken)
      )
      let stacktrace = ErrorStackParser.parse(exceptionInstance)
      expect(stacktrace[0].functionName).to.be.undefined // lambda function
      expect(stacktrace[1].functionName).to.equal("throwAndCatchException")
    })

    it("NotAllInputParsedException", () => {
      let exceptionInstance = throwAndCatchException(
        () => new NotAllInputParsedException("", dummyToken)
      )
      let stacktrace = ErrorStackParser.parse(exceptionInstance)
      expect(stacktrace[0].functionName).to.be.undefined // lambda function
      expect(stacktrace[1].functionName).to.equal("throwAndCatchException")
    })

    it("MismatchedTokenException", () => {
      let exceptionInstance = throwAndCatchException(
        () => new MismatchedTokenException("", dummyToken, dummyToken)
      )
      let stacktrace = ErrorStackParser.parse(exceptionInstance)
      expect(stacktrace[0].functionName).to.be.undefined // lambda function
      expect(stacktrace[1].functionName).to.equal("throwAndCatchException")
    })
  })
})
