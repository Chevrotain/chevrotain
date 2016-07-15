var ohmJsonGrammar =
    'JSON {\r\n  Start = Value\r\n' +
    '\r\n' +
    '  Value =\r\n' +
    '    Object\r\n' +
    '    | Array\r\n' +
    '    | String\r\n' +
    '    | Number\r\n' +
    '    | True\r\n' +
    '    | False\r\n' +
    '    | Null\r\n' +
    '\r\n' +
    '  Object =\r\n' +
    '    \"{\" \"}\" -- empty\r\n' +
    '    | \"{\" Pair (\",\" Pair)* \"}\" -- nonEmpty\r\n' +
    '\r\n' +
    '  Pair =\r\n' +
    '    String \":\" Value\r\n' +
    '\r\n' +
    '  Array =\r\n' +
    '    \"[\" \"]\" -- empty\r\n' +
    '    | \"[\" Value (\",\" Value)* \"]\" -- nonEmpty\r\n' +
    '\r\n' +
    '  String (String) =\r\n' +
    '    stringLiteral\r\n' +
    '\r\n' +
    '  stringLiteral =\r\n' +
    '    \"\\\"\" doubleStringCharacter* \"\\\"\"\r\n' +
    '\r\n' +
    '  doubleStringCharacter (character) =\r\n' +
    '    ~(\"\\\"\" | \"\\\\\") any -- nonEscaped\r\n' +
    '    | \"\\\\\" escapeSequence -- escaped\r\n' +
    '\r\n' +
    '  escapeSequence =\r\n' +
    '    \"\\\"\" -- doubleQuote\r\n' +
    '    | \"\\\\\" -- reverseSolidus\r\n' +
    '    | \"\/\" -- solidus\r\n' +
    '    | \"b\" -- backspace\r\n' +
    '    | \"f\" -- formfeed\r\n' +
    '    | \"n\" -- newline\r\n' +
    '    | \"r\" -- carriageReturn\r\n' +
    '    | \"t\" -- horizontalTab\r\n' +
    '    | \"u\" fourHexDigits -- codePoint\r\n' +
    '\r\n' +
    '  fourHexDigits = hexDigit hexDigit hexDigit hexDigit\r\n' +
    '\r\n' +
    '  Number (Number) =\r\n' +
    '    numberLiteral\r\n' +
    '\r\n' +
    '  numberLiteral =\r\n' +
    '    decimal exponent -- withExponent\r\n' +
    '    | decimal -- withoutExponent\r\n' +
    '\r\n' +
    '  decimal =\r\n' +
    '    wholeNumber \".\" digit+ -- withFract\r\n' +
    '    | wholeNumber -- withoutFract\r\n' +
    '\r\n' +
    '  wholeNumber =\r\n' +
    '    \"-\" unsignedWholeNumber -- negative\r\n' +
    '    | unsignedWholeNumber -- nonNegative\r\n' +
    '\r\n' +
    '  unsignedWholeNumber =' +
    '\r\n    \"0\" -- zero' +
    '\r\n    | nonZeroDigit digit* -- nonZero' +
    '\r\n' +
    '\r\n  nonZeroDigit = \"1\"..\"9\"\r\n' +
    '\r\n' +
    '  exponent =\r\n' +
    '    exponentMark (\"+\"|\"-\") digit+ -- signed\r\n' +
    '    | exponentMark digit+ -- unsigned\r\n' +
    '\r\n' +
    '  exponentMark = \"e\" | \"E\"\r\n' +
    '\r\n' +
    '  True = \"true\"' +
    '\r\n' +
    '  False = \"false\"\r\n' +
    '  Null = \"null\"\r\n' +
    '}'
