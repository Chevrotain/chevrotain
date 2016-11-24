// copied and wrapped by a self executing function from:
//https://github.com/substack/jsonify/blob/7064ab53e5f73fa31e2ce7aa47d210c539662f16/lib/parse.js
// The License is Global Domain
//https://github.com/substack/jsonify/blob/7064ab53e5f73fa31e2ce7aa47d210c539662f16/readme.markdown#license

(function (exports) {

  var at, // The index of the current character
      ch, // The current character
      escapee = {
          '"':  '"',
          '\\': '\\',
          '/':  '/',
          b:    '\b',
          f:    '\f',
          n:    '\n',
          r:    '\r',
          t:    '\t'
      },
      text,

      error = function (m) {
          // Call error when something is wrong.
          throw {
              name:    'SyntaxError',
              message: m,
              at:      at,
              text:    text
          };
      },

      next = function (c) {
          // If a c parameter is provided, verify that it matches the current character.
          if (c && c !== ch) {
              error("Expected '" + c + "' instead of '" + ch + "'");
          }

          // Get the next character. When there are no more characters,
          // return the empty string.

          ch = text.charAt(at);
          at += 1;
          return ch;
      },

      number = function () {
          // Parse a number value.
          var number,
              string = '';

          if (ch === '-') {
              string = '-';
              next('-');
          }
          while (ch >= '0' && ch <= '9') {
              string += ch;
              next();
          }
          if (ch === '.') {
              string += '.';
              while (next() && ch >= '0' && ch <= '9') {
                  string += ch;
              }
          }
          if (ch === 'e' || ch === 'E') {
              string += ch;
              next();
              if (ch === '-' || ch === '+') {
                  string += ch;
                  next();
              }
              while (ch >= '0' && ch <= '9') {
                  string += ch;
                  next();
              }
          }
          number = +string;
          if (!isFinite(number)) {
              error("Bad number");
          } else {
              return number;
          }
      },

      string = function () {
          // Parse a string value.
          var hex,
              i,
              string = '',
              uffff;

          // When parsing for string values, we must look for " and \ characters.
          if (ch === '"') {
              while (next()) {
                  if (ch === '"') {
                      next();
                      return string;
                  } else if (ch === '\\') {
                      next();
                      if (ch === 'u') {
                          uffff = 0;
                          for (i = 0; i < 4; i += 1) {
                              hex = parseInt(next(), 16);
                              if (!isFinite(hex)) {
                                  break;
                              }
                              uffff = uffff * 16 + hex;
                          }
                          string += String.fromCharCode(uffff);
                      } else if (typeof escapee[ch] === 'string') {
                          string += escapee[ch];
                      } else {
                          break;
                      }
                  } else {
                      string += ch;
                  }
              }
          }
          error("Bad string");
      },

      white = function () {

  // Skip whitespace.

          while (ch && ch <= ' ') {
              next();
          }
      },

      word = function () {

  // true, false, or null.

          switch (ch) {
          case 't':
              next('t');
              next('r');
              next('u');
              next('e');
              return true;
          case 'f':
              next('f');
              next('a');
              next('l');
              next('s');
              next('e');
              return false;
          case 'n':
              next('n');
              next('u');
              next('l');
              next('l');
              return null;
          }
          error("Unexpected '" + ch + "'");
      },

      value,  // Place holder for the value function.

      array = function () {

  // Parse an array value.

          var array = [];

          if (ch === '[') {
              next('[');
              white();
              if (ch === ']') {
                  next(']');
                  return array;   // empty array
              }
              while (ch) {
                  array.push(value());
                  white();
                  if (ch === ']') {
                      next(']');
                      return array;
                  }
                  next(',');
                  white();
              }
          }
          error("Bad array");
      },

      object = function () {

  // Parse an object value.

          var key,
              object = {};

          if (ch === '{') {
              next('{');
              white();
              if (ch === '}') {
                  next('}');
                  return object;   // empty object
              }
              while (ch) {
                  key = string();
                  white();
                  next(':');
                  if (Object.hasOwnProperty.call(object, key)) {
                      error('Duplicate key "' + key + '"');
                  }
                  object[key] = value();
                  white();
                  if (ch === '}') {
                      next('}');
                      return object;
                  }
                  next(',');
                  white();
              }
          }
          error("Bad object");
      };

  value = function () {

  // Parse a JSON value. It could be an object, an array, a string, a number,
  // or a word.

      white();
      switch (ch) {
      case '{':
          return object();
      case '[':
          return array();
      case '"':
          return string();
      case '-':
          return number();
      default:
          return ch >= '0' && ch <= '9' ? number() : word();
      }
  };

  // Return the json_parse function. It will have access to all of the above
  // functions and variables.
  exports.jsonifyParse = function jsonifyParse(source) {
      var result;

      text = source;
      at = 0;
      ch = ' ';
      result = value();
      white();
      if (ch) {
        error("Syntax error");
      }

      return result;
  };

})(this);
