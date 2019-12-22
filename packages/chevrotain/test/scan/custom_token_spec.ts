import { createToken } from "../../src/scan/tokens_public"
import { Lexer } from "../../src/scan/lexer_public"

describe("The Chevrotain Custom Tokens Support", () => {
  context("Token Payloads", () => {
    it("Support payloads with custom Token Patterns", () => {
      const dateToken = createToken({
        name: "date",
        pattern: (text, startOffset) => {
          const regExp = /(\d\d?)-(\d\d?)-(\d\d\d\d)/y
          regExp.lastIndex = startOffset
          const match = regExp.exec(text)
          if (match !== null) {
            const payload = {
              day: parseInt(match[1], 10),
              month: parseInt(match[2], 10),
              year: parseInt(match[3], 10)
            }
            ;(match as any).payload = payload
            return match
          }

          return null
        }
      })

      const dateLexer = new Lexer([dateToken])
      const lexResults = dateLexer.tokenize("1-12-1932")

      expect(lexResults.errors).to.be.empty
      expect(lexResults.tokens).to.have.lengthOf(1)
      const dateTokObj = lexResults.tokens[0]
      expect(dateTokObj.payload.day).to.equal(1)
      expect(dateTokObj.payload.month).to.equal(12)
      expect(dateTokObj.payload.year).to.equal(1932)
    })

    it("Supports payloads with custom Token Patterns - longer alt", () => {
      const dateToken = createToken({
        name: "date",
        pattern: (text, startOffset) => {
          const regExp = /(\d\d?)-(\d\d?)-(\d\d\d\d)/y
          regExp.lastIndex = startOffset
          const match = regExp.exec(text)
          if (match !== null) {
            const payload = {
              day: parseInt(match[1], 10),
              month: parseInt(match[2], 10),
              year: parseInt(match[3], 10)
            }
            ;(match as any).payload = payload
            return match
          }

          return null
        }
      })

      const digitToken = createToken({
        name: "digit",
        pattern: /\d/,
        longer_alt: dateToken
      })
      const dateLexer = new Lexer([digitToken, dateToken])
      const lexResults = dateLexer.tokenize("1-12-1932")

      expect(lexResults.errors).to.be.empty
      expect(lexResults.tokens).to.have.lengthOf(1)
      const dateTokObj = lexResults.tokens[0]
      expect(dateTokObj.payload.day).to.equal(1)
      expect(dateTokObj.payload.month).to.equal(12)
      expect(dateTokObj.payload.year).to.equal(1932)
    })
  })
})
