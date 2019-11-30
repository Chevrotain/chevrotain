var Cursor = cursornext.Cursor;

function parse(source) {
  const cursor = Cursor.from(source);

  return parseJson(cursor);
}

function skipWhitespace(cursor) {
  var execArr = cursor.exec(/[ \t\n\r]+/y);

  if (execArr) {
    cursor.next(execArr[0].length);
  }
}

function parseJson(cursor) {
  skipWhitespace(cursor);

  const value = parseObject(cursor) || parseArray(cursor);
  if (!value) {
    return;
  }

  skipWhitespace(cursor);

  return {
    type: "Root",
    value: value
  };
}

function parseValue(cursor) {
  return (
    parseObject(cursor) ||
    parseArray(cursor) ||
    parseString(cursor) ||
    parseNumber(cursor) ||
    parseBoolean(cursor) ||
    parseNull(cursor)
  );
}

function parseObject(cursor) {
  var marker = cursor.clone();

  if (!cursor.startsWith("{")) {
    return;
  }
  cursor.next(1);

  skipWhitespace(cursor);

  while (!cursor.startsWith("}") && !cursor.isEof()) {
    skipWhitespace(cursor);

    var key = parseKey(cursor);
    if (!key) {
      cursor.moveTo(marker);
      return;
    }

    skipWhitespace(cursor);

    if (!cursor.startsWith(":")) {
      cursor.moveTo(marker);
      return;
    }
    cursor.next(1);

    skipWhitespace(cursor);

    var value = parseValue(cursor);
    if (!value) {
      cursor.moveTo(marker);
      return;
    }

    skipWhitespace(cursor);

    if (cursor.startsWith(",")) {
      cursor.next(1);

      if (cursor.startsWith("}")) {
        cursor.moveTo(marker);
        return;
      }
    }

    skipWhitespace(cursor);
  }

  if (!cursor.startsWith("}")) {
    cursor.moveTo(marker);
    return;
  }
  cursor.next(1);

  return {
    type: "Object",
    key: key,
    value: value
  };
}

function parseKey(cursor) {
  var token = parseString(cursor);
  if (token) {
    return {
      type: "Key",
      value: token.value
    };
  }
}

function parseArray(cursor) {
  var marker = cursor.clone();

  if (!cursor.startsWith("[")) {
    return;
  }
  cursor.next(1);

  skipWhitespace(cursor);

  var value = [];
  while (!cursor.startsWith("]") && !cursor.isEof()) {
    skipWhitespace(cursor);

    var item = parseValue(cursor);
    if (!item) {
      cursor.moveTo(marker);
      return;
    }
    value.push(item);

    skipWhitespace(cursor);

    if (cursor.startsWith(",")) {
      cursor.next(1);

      if (cursor.startsWith("]")) {
        cursor.moveTo(marker);
        return;
      }
    }
  }

  if (!cursor.startsWith("]")) {
    cursor.moveTo(marker);
    return;
  }
  cursor.next(1);

  return {
    type: "Array",
    value: value
  };
}

function parseNumber(cursor) {
  var execArr = cursor.exec(/-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/y);
  if (execArr) {
    cursor.next(execArr[0].length);

    return {
      type: "Number",
      value: execArr[0]
    };
  }
}

function parseNull(cursor) {
  if (cursor.startsWith("null")) {
    cursor.next(4);

    return {
      type: "Null"
    };
  }
}

function parseBoolean(cursor) {
  var execArr = cursor.exec(/true|false/y);
  if (execArr) {
    cursor.next(execArr[0].length);

    return {
      type: "Boolean",
      value: execArr[0] === "true"
    };
  }
}

function parseString(cursor) {
  var marker = cursor.clone();

  if (!marker.startsWith('"')) {
    return;
  }
  cursor.next(1);

  var start = cursor.clone();

  while (!cursor.startsWith('"') && !cursor.isEof()) {
    if (cursor.startsWith("\\")) {
      if (!cursor.exec(/\\[bfnrtv"\\]/y)) {
        cursor.moveTo(marker);
        return;
      }
      cursor.next(2);
    } else {
      cursor.next(1);
    }
  }

  var value = start.takeUntil(cursor);

  if (!marker.startsWith('"')) {
    cursor.moveTo(marker);
    return;
  }
  cursor.next(1);

  return {
    type: "String",
    value: value
  };
}
