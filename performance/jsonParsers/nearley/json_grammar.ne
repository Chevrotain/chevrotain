json ->  (object | array)


object -> "{" (objectItem ( "," objectItem):*):? "}"


objectItem -> stringLiteral ":" value


array -> "[" (value ("," value):*):? "]"


value ->
          stringLiteral
        | numberLiteral
        | object
        | array
        | "true"
        | "false"
        | "null"


stringLiteral -> "\""
                   [^\\"]:+
                 "\""

numberLiteral -> "-":? ("0" | [1-9] [0-9]:* ) ("." [0-9]:+ ):? ( [eE] [+-]:? [0-9]:+):?

_ -> [\s]:*