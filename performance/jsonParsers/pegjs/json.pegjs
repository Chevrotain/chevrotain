// originally from :
// https://github.com/pegjs/pegjs/blob/master/examples/json.pegjs

/* ----- 2. JSON Grammar ----- */

JSON_text
  = ws value:value ws

begin_array     = ws "[" ws
begin_object    = ws "{" ws
end_array       = ws "]" ws
end_object      = ws "}" ws
name_separator  = ws ":" ws
value_separator = ws "," ws

ws "whitespace" = [ \t\n\r]*

/* ----- 3. Values ----- */

value
  = string
  / number
  / object
  / array
  / true
  / false
  / null

true  = "true"
false = "false"
null  = "null"

/* ----- 4. Objects ----- */

object
  = begin_object
    (
      member
      (value_separator member)*
    )?
    end_object

member
  = string name_separator value

/* ----- 5. Arrays ----- */

array
  = begin_array
    (
      value
      (value_separator value )*
    )?
    end_array

/* ----- 6. Numbers ----- */

number "number"
  = minus? int frac? exp?

decimal_point = "."
digit1_9      = [1-9]
e             = [eE]
exp           = e (minus / plus)? DIGIT+
frac          = decimal_point DIGIT+
int           = zero / (digit1_9 DIGIT*)
minus         = "-"
plus          = "+"
zero          = "0"

/* ----- 7. Strings ----- */

string "string"
  = quotation_mark char* quotation_mark

char
  = unescaped
  / escape
    sequence:(
        '"'
      / "\\"
      / "/"
      / "b"
      / "f"
      / "n"
      / "r"
      / "t"
      / "u" digits:$(HEXDIG HEXDIG HEXDIG HEXDIG)
    )

escape         = "\\"
quotation_mark = '"'
unescaped      = [\x20-\x21\x23-\x5B\x5D-\u10FFFF]

/* ----- Core ABNF Rules ----- */

/* See RFC 4234, Appendix B (http://tools.ietf.org/html/rfc4627). */
DIGIT  = [0-9]
HEXDIG = [0-9a-f]i