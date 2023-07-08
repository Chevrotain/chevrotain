import { CstParser } from "chevrotain"
import { tokensDictionary as t } from "./xml_lexer.js"

class Xml_parser extends CstParser {
  constructor() {
    super(t, { nodeLocationTracking: "full" })

    const $ = this

    $.RULE("document", () => {
      $.OPTION(() => {
        $.SUBRULE($.prolog)
      })

      $.MANY(() => {
        $.SUBRULE($.misc)
      })

      $.SUBRULE($.element)

      $.MANY2(() => {
        $.SUBRULE2($.misc)
      })
    })

    $.RULE("prolog", () => {
      $.CONSUME(t.XMLDeclOpen)
      $.MANY(() => {
        $.SUBRULE($.attribute)
      })
      $.CONSUME(t.SPECIAL_CLOSE)
    })

    $.RULE("content", () => {
      $.OPTION(() => {
        $.SUBRULE($.chardata)
      })

      $.MANY(() => {
        $.OR([
          { ALT: () => $.SUBRULE($.element) },
          { ALT: () => $.SUBRULE($.reference) },
          { ALT: () => $.CONSUME(t.CData) },
          { ALT: () => $.CONSUME(t.PROCESSING_INSTRUCTION) },
          { ALT: () => $.CONSUME(t.Comment) }
        ])

        $.OPTION2(() => {
          $.SUBRULE2($.chardata)
        })
      })
    })

    $.RULE("element", () => {
      $.CONSUME(t.OPEN)
      $.CONSUME(t.Name)
      $.MANY(() => {
        $.SUBRULE($.attribute)
      })

      $.OR([
        {
          ALT: () => {
            $.CONSUME(t.CLOSE, { LABEL: "START_CLOSE" })
            $.SUBRULE($.content)
            $.CONSUME(t.SLASH_OPEN)
            $.CONSUME2(t.Name, { LABEL: "END_NAME" })
            $.CONSUME2(t.CLOSE, { LABEL: "END" })
          }
        },
        {
          ALT: () => {
            $.CONSUME(t.SLASH_CLOSE)
          }
        }
      ])
    })

    $.RULE("reference", () => {
      $.OR([
        { ALT: () => $.CONSUME(t.EntityRef) },
        { ALT: () => $.CONSUME(t.CharRef) }
      ])
    })

    $.RULE("attribute", () => {
      $.CONSUME(t.Name)
      $.CONSUME(t.EQUALS)
      $.CONSUME(t.STRING)
    })

    $.RULE("chardata", () => {
      $.OR([
        { ALT: () => $.CONSUME(t.TEXT) },
        { ALT: () => $.CONSUME(t.SEA_WS) }
      ])
    })

    $.RULE("misc", () => {
      $.OR([
        { ALT: () => $.CONSUME(t.Comment) },
        { ALT: () => $.CONSUME(t.PROCESSING_INSTRUCTION) },
        { ALT: () => $.CONSUME(t.SEA_WS) }
      ])
    })

    this.performSelfAnalysis()
  }
}

// Re-use the same parser instance
export const xmlParser = new Xml_parser()
