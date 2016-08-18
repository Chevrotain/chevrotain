import {
    Token,
    Lexer
} from "chevrotain"
import * as XRegExp from "xregexp"


// Based on the specs in:
// https://www.w3.org/TR/CSS21/grammar.html

// A little mini DSL for easier lexer definition using xRegExp.
let fragments:any = {}

function FRAGMENT(name:string, def:string) {
    fragments[name] = XRegExp.build(def, fragments)
}

function MAKE_PATTERN(def:string, flags?:string) {
    return XRegExp.build(def, fragments, flags)
}

// The order of fragments definitions is important
FRAGMENT("nl", "\\n|\\r|\\f")
FRAGMENT("h", "[0-9a-f]")
FRAGMENT("nonascii", "[\\u0240-\\uffff]")
FRAGMENT("unicode", "\\{{h}}{1,6}")
FRAGMENT("escape", "{{unicode}}|\\\\[^\\r\\n\\f0-9a-f]")
FRAGMENT("nmstart", "[_a-zA-Z]|{{nonascii}}|{{escape}}")
FRAGMENT("nmchar", "[_a-zA-Z0-9-]|{{nonascii}}|{{escape}}")
// tslint:disable-next-line:quotemark
FRAGMENT("string1", '\\"([^\\n\\r\\f\\"]|\\{{nl}}|{{escape}})*\\"')
FRAGMENT("string2", "\\'([^\\n\\r\\f\\']|\\{{nl}}|{{escape}})*\\'")
FRAGMENT("comment", "\\/\\*[^*]*\\*+([^/*][^*]*\\*+)*\\/")
FRAGMENT("name", "({{nmchar}})+")
FRAGMENT("url", "([!#\\$%&*-~]|{{nonascii}}|{{escape}})*")
FRAGMENT("spaces", "[ \\t\\r\\n\\f]+")
FRAGMENT("ident", "-?{{nmstart}}{{nmchar}}*")
FRAGMENT("num", "[0-9]+|[0-9]*\\.[0-9]+")

export class Whitespace extends Token {
    static PATTERN = MAKE_PATTERN("{{spaces}}")
    // the W3C specs are are defined in a whitespace sensitive manner.
    // This implementation ignores that crazy mess, This means that this grammar may be a superset of the css 2.1 grammar.
    // Checking for whitespace related errors can be done in a separate process AFTER parsing.
    static GROUP = Lexer.SKIPPED
}

export class Comment extends Token {
    static PATTERN = /\/\*[^*]*\*+([^/*][^*]*\*+)*\//
    static GROUP = Lexer.SKIPPED
}

// CDC and CDO are skipped, this is slightly different then the spec
// but apparently nobody cares, so no need to needlessly complicate things...
// - https://bugzilla.mozilla.org/show_bug.cgi?id=2781
// - In Intellij those examples also (mostly) ignore CDC/CDO regardless of grammar position.
// This implementation currently, treats these tokens as whitespace.
export class Cdo extends Token {
    static PATTERN = /<!--/
    static GROUP = Lexer.SKIPPED
}

export class Cdc extends Token {
    static PATTERN = /-->/
    static GROUP = Lexer.SKIPPED
}

export class Uri extends Token {static PATTERN = Lexer.NA}
export class UriString extends Uri {static PATTERN = MAKE_PATTERN("url\\((:?{{spaces}})?({{string1}}|{{string2}})(:?{{spaces}})?\\)")}
export class UriUrl extends Uri {static PATTERN = MAKE_PATTERN("url\\((:?{{spaces}})?{{url}}(:?{{spaces}})?\\)")}
export class Func extends Token {static PATTERN = MAKE_PATTERN("{{ident}}\\(")}
export class Ident extends Token {static PATTERN = MAKE_PATTERN("{{ident}}")}
export class Includes extends Token {static PATTERN = /~=/}
export class Dasmatch extends Token {static PATTERN = /\|=/}
export class Exclamation extends Token {static PATTERN = /!/}
export class Dot extends Token {static PATTERN = /\./}
export class LCurly extends Token {static PATTERN = /{/}
export class RCurly extends Token {static PATTERN = /}/}
export class LSquare extends Token {static PATTERN = /\[/}
export class RSquare extends Token {static PATTERN = /]/}
export class LParen extends Token {static PATTERN = /\(/}
export class RParen extends Token {static PATTERN = /\)/}
export class Comma extends Token {static PATTERN = /,/}
export class Colon extends Token {static PATTERN = /:/}
export class SemiColon extends Token {static PATTERN = /;/}
export class Equals extends Token {static PATTERN = /=/}
export class Star extends Token {static PATTERN = /\*/}
export class Plus extends Token {static PATTERN = /\+/}
export class Minus extends Token {static PATTERN = /-/}
export class GreaterThan extends Token {static PATTERN = />/}
export class Slash extends Token {static PATTERN = /\//}

export class StringLiteral extends Token {static PATTERN = MAKE_PATTERN("{{string1}}|{{string2}}")}
export class Hash extends Token {static PATTERN = MAKE_PATTERN("#{{name}}")}

// note that the spec defines import as : @{I}{M}{P}{O}{R}{T}
// Where every letter is defined in this pattern:
// i|\\0{0,4}(49|69)(\r\n|[ \t\r\n\f])?|\\i
// Lets count the number of ways to write the letter "i"
// i // 2 options due to case insensitivity
// |
// \\0{0,4} // 5 options for number of spaces
// (49|69) // 2 options for asci value
// (\r\n|[ \t\r\n\f])? // 7 options, so the total for this alternative is 5 * 2 * 7 = 70 (!!!)
// |
// \\i // 1 option.
// so there are a total of 73 options to write the letter "i"
// This gives us 73^6 options to write the word "import" which is a number with 12 digits...
// This implementation does not bother with this madness :) and instead settles for
// "just" 64 option to write "impPorT" (due to case insensitivity)
export class ImportSym extends Token {static PATTERN = /@import/i}
export class PageSym extends Token {static PATTERN = /@page/i}
export class MediaSym extends Token {static PATTERN = /@media/i}
export class CharsetSym extends Token {static PATTERN = /@charset/i}
export class ImportantSym extends Token {static PATTERN = /important/i}

export class Ems extends Token {static PATTERN = MAKE_PATTERN("{{num}}em", "i")}
export class Exs extends Token {static PATTERN = MAKE_PATTERN("{{num}}ex", "i")}

export class Length extends Token {static PATTERN = Lexer.NA}
export class Px extends Length {static PATTERN = MAKE_PATTERN("{{num}}px", "i")}
export class Cm extends Length {static PATTERN = MAKE_PATTERN("{{num}}cm", "i")}
export class Mm extends Length {static PATTERN = MAKE_PATTERN("{{num}}mm", "i")}
export class In extends Length {static PATTERN = MAKE_PATTERN("{{num}}in", "i")}
export class Pt extends Length {static PATTERN = MAKE_PATTERN("{{num}}pt", "i")}
export class Pc extends Length {static PATTERN = MAKE_PATTERN("{{num}}pc", "i")}

export class Angle extends Token {static PATTERN = Lexer.NA}
export class Deg extends Angle {static PATTERN = MAKE_PATTERN("{{num}}deg", "i")}
export class Rad extends Angle {static PATTERN = MAKE_PATTERN("{{num}}rad", "i")}
export class Grad extends Angle {static PATTERN = MAKE_PATTERN("{{num}}grad", "i")}

export class Time extends Token {static PATTERN = Lexer.NA}
export class Ms extends Time {static PATTERN = MAKE_PATTERN("{{num}}ms", "i")}
export class Sec extends Time {static PATTERN = MAKE_PATTERN("{{num}}sec", "i")}

export class Freq extends Token {static PATTERN = Lexer.NA}
export class Hz extends Freq {static PATTERN = MAKE_PATTERN("{{num}}hz", "i")}
export class Khz extends Freq {static PATTERN = MAKE_PATTERN("{{num}}khz", "i")}

export class Percentage extends Token {static PATTERN = MAKE_PATTERN("{{num}}%", "i")}
export class Num extends Token {static PATTERN = MAKE_PATTERN("{{num}}")}


export const cssTokens = [
    Whitespace,
    Comment,

    // This group has to be defined BEFORE Ident as their prefix is a valid Ident
    Uri,
    UriString,
    UriUrl,
    Func,
    // -- end group before Ident

    Ident, // Ident must be before Minus
    Cdo,
    Cdc,  // Cdc must be before Minus
    Includes,
    Dasmatch,
    Exclamation,
    Dot,
    LCurly,
    RCurly,
    LSquare,
    RSquare,
    LParen,
    RParen,
    Comma,
    Colon,
    SemiColon,
    Equals,
    Star,
    Plus,
    Minus,
    GreaterThan,
    Slash,
    StringLiteral,
    Hash,
    ImportSym,
    PageSym,
    MediaSym,
    CharsetSym,
    ImportantSym,
    Ems,
    Exs,
    Length,
    Px,
    Cm,
    Mm,
    In,
    Pt,
    Pc,
    Angle,
    Deg,
    Rad,
    Grad,
    Time,
    Ms,
    Sec,
    Freq,
    Hz,
    Khz,
    Percentage,
    Num // Num must appear after all the num forms with a suffix
]

export const CssLexer = new Lexer(cssTokens)
