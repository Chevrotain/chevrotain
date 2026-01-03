# Internals

Chevrotain provides an abstraction for building Parsers, however no abstraction is prefect
and at some point understand the implementation details may become necessary.

## Grammar Recording

#### TLDR

Wrap any semantic actions that cause runtime errors during the recording phase
or have global side effects with the [ACTION DSL method](https://chevrotain.io/documentation/11_1_0/classes/BaseParser.html#ACTION) to
resolve issues.

### The Problem

**_Chevrotain needs to "understand" the grammar structure in order to run._**

For example, in an alternation Chevrotain must able to choose the right alternative
process, but in order to do so the **contents** (Grammar) of each alternative
must be known **in advance**.

```javascript
$.RULE("value", () => {
  // The choice of which alternative to pick
  // is done by the "OR" (alternation) method, by **looking ahead** in the token vector.
  // But making this choice requires **knowing** in advance the full structure of the grammar.
  $.OR([
    { ALT: () => $.CONSUME(StringLiteral) },
    { ALT: () => $.CONSUME(NumberLiteral) },
    { ALT: () => $.SUBRULE($.object) },
    { ALT: () => $.SUBRULE($.array) },
    { ALT: () => $.CONSUME(True) },
    { ALT: () => $.CONSUME(False) },
    { ALT: () => $.CONSUME(Null) },
  ]);
});
```

### The Solution

Chevrotain solves the problem of "understanding" the grammar structure by running the Parser in a "Recording Mode"
with **alternative implementations** of the parsing methods (OR/MANY/OPTION/...), the results of these "recordings" are saved
on the Parser instance and are accessible via the [getGastProductions](https://chevrotain.io/documentation/11_1_0/classes/BaseParser.html#getGAstProductions)
method. However for this to work successfully there are a couple of implicit assumptions..

### Assumption 1 - The Parser won't throw errors during recording.

Any error thrown during the recording phase will obviously fail the recording and thus make the parser un-usable.
These are normally easy to fix and identify by an end user as the runtime error message will be modified (By Chevrotain)
to indicate it occurred during the "recording phase" and the stack trace will easily "point" the end user towards the source of the problem.

let us inspect some scenarios to fully understand the problem.
The root issue is making assumptions on the structure and values returned by the Parsing DSL methods.
Lets first consider an example that will **not** cause an error.

```javascript
class SafeEmbeddedActionsExample extends EmbeddedActionsParser {
  constructor() {
    /* ... */
    $.RULE("objectItem", () => {
      // Usage of the Parsing DSL methods is always safe, otherwise the whole concept of "grammar recording" would not work...
      const keyTok = $.CONSUME(StringLiteral);
      $.CONSUME(Colon);
      const valAst = $.SUBRULE($.value);

      // strip away the quotes from the string literal
      // Note that even during the "recording phase" the CONSUME method will return an object that matches the IToken interface
      // to reduce potential runtime errors, so this is safe.
      const keyName = keyTok.image.substring(1, keyTok.image.length - 1);

      // Assembling this JS object literal won't cause any issues because
      // we are not actually doing anything with the returned values.
      // Only assigning them to properties in a new object (which is always safe)
      return {
        type: "keyValuePair",
        key: keyName,
        value: valAst,
      };
    });
  }
}
```

So we saw that a common use case of using embedded semantic actions to construct an AST is normally safe during the "recording" phase.
Let's consider some situations that will actually cause errors.

#### Example 1: Making assumptions on the returned structure by a SUBRULE call

```javascript
class ErrorEmbeddedActions1 extends EmbeddedActionsParser {
  constructor() {
    /* ... */
    $.RULE("topRule", () => {
      // During the recording phase `SUBRULE` will return a "dummy" value
      // Which would not match the structure `otherRule` normally returns.
      const otherRuleVal = $.SUBRULE($.otherRule);

      // Will cause "undefined is not an object" runtime error
      // because during the recording phase `SUBRULE` will not returned the expected value.
      return otherRuleVal.foo.bar;
    });

    $.RULE("otherRule", () => {
      const myTok = $.CONSUME(MyTok);

      return {
        foo: {
          bar: myTok.image,
        },
      };
    });
  }
}
```

#### Example 2: Making assumptions on the returned value by DSL Method calls

```javascript
class ErrorSemanticChecks extends EmbeddedActionsParser {
  constructor() {
    /* ... */
    $.RULE("semanticCheckRule", () => {
      // During the recording phase `CONSUME` will return a "dummy" IToken value.
      const myNumTok = $.CONSUME(NumberTok);
      // The "dummy" IToken `image` is not a number so this will evaluate to NaN.
      const numValue = parseInt(myNumTok.image);

      // Our embedded semantic check will **always** throw during the recording phase because
      // the "mocked" IToken returned by `CONSUME` would never be a valid integer.
      if (isNaN(numValue)) {
        throw Error("Unexpected Number Value!");
      }

      return numValue;
    });
  }
}
```

#### Common Denominator: Embedded Actions

Before moving on to possible solutions, note that all the above examples are centered around using Parsers with **embedded actions**.
When using the alternative: a Parser that outputs a [Concrete Syntax Tree](./concrete_syntax_tree.md)
which is the [recommended approach](../tutorial/step3_adding_actions_root.md#alternatives),
there would be very few (if any) embedded actions in the grammar.
Thus it is a lot less likely that a CSTParser would raise errors during the recording phase, e.g:

```javascript
class JsonParser extends CstParser {
  constructor() {
    /* ... */
    // This Grammar rule has no custom user semantic actions
    // So it would not throw an unexpected exception during the recording phase...
    $.RULE("objectItem", () => {
      $.CONSUME(StringLiteral);
      $.CONSUME(Colon);
      $.SUBRULE($.value);
    });
  }
}
```

#### The Solution

The solution is to simply **avoid executing any code that could raise such exceptions during the recording phase**.
This can be easily accomplished by wrapping the relevant semantic actions with the [ACTION DSL method](https://chevrotain.io/documentation/11_1_0/classes/BaseParser.html#ACTION)
for example lets resolve the two scenarios shown above:

```javascript
class SolvedEmbeddedActions1 extends EmbeddedActionsParser {
  constructor() {
    /* ... */
    $.RULE("topRule", () => {
      // During the recording phase `SUBRULE` will return a "dummy" value
      // Which would not match the structure `otherRule` normally returns.
      const otherRuleVal = $.SUBRULE($.otherRule);

      return $.ACTION(() => {
        // Code inside `ACTION` will not be executed during the grammar recording phase.
        // Therefore an error will **not** be thrown...
        otherRuleVal.foo.bar;
      });
    });

    $.RULE("otherRule", () => {
      const myTok = $.CONSUME(MyTok);

      return {
        foo: {
          bar: myTok.image,
        },
      };
    });
  }
}
```

```javascript
class SolvedSemanticChecks extends EmbeddedActionsParser {
  constructor() {
    /* ... */
    $.RULE("semanticCheckRule", () => {
      // During the recording phase `CONSUME` will return a "dummy" IToken value.
      const myNumTok = $.CONSUME(NumberTok);
      // The "dummy" IToken `image` is not a number so this will evaluate to NaN.
      const numValue = parseInt(myNumTok.image);

      $.ACTION(() => {
        // Code inside `ACTION` will not be executed during the grammar recording phase.
        // Therefore an error will **not** be thrown...
        if (isNaN(numValue)) {
          throw Error("Unexpected Number Value!");
        }
      });

      return numValue;
    });
  }
}
```

Note:

- Code wrapper by the `ACTION` wrapper **must not** include DSL methods (MANY/OR/OPTION/...) calls as this
  would prevent those the grammar those methods represent from being recorded.
- Not all semantic actions require wrapping in `ACTION`, only those that would throw errors during the
  grammar recording phase.
- Embedded actions reduce separation of concerns between parsing and semantics. However we can still maintain some of this separation
  by performing the Parsing "part" at the beginning of the rule and the semantic actions "part" at the end of the rule.

### Assumption 2 - There are no lasting side effects due to running the recording phase.

If there are any **lasting** side effects from executing the parsing rules then their execution
during the grammar recording phase may break logic dependent on those side effects.

For example:

```javascript
let ruleCounter = 0;
class SideEffectsParser extends CstParser {
  constructor() {
    /* ... */
    $.RULE("myRule", () => {
      // The counter will be incremented during the recording phase.
      counter++;
      $.CONSUME(MyToken);
    });
  }
}

const parser = new SideEffectsParser();
// We expected this to be `0`...
console.log(counter); // -> 1
```

#### Solutions

As before one of the solutions will be to wrap the relevant embedded semantic action using the
[ACTION DSL method](https://chevrotain.io/documentation/11_1_0/classes/BaseParser.html#ACTION).
This is normally most suitable for handling **global state** outside the Parser's instance.

```javascript
$.RULE("myRule", () => {
  $.ACTION(() => {
    // This code will no longer execute during the recording phase.
    counter++;
  });
  $.CONSUME(MyToken);
});
```

Because we are dealing with state here there is another option which is to override the Parser's
[reset method](https://chevrotain.io/documentation/11_1_0/classes/CstParser.html#reset).
This is normally suitable for state that needs to be reset every time **new input** provided to the parser.

```javascript
class FixedSideEffectsParser extends CstParser {
  constructor() {
    //
    this.instanceCounter = 0;
    /* ... */
    $.RULE("myRule", () => {
      // The counter will be incremented during the recording phase.
      this.instanceCounter++;
      $.CONSUME(MyToken);
    });
  }

  reset() {
    this.instanceCounter = 0;
    super.reset();
  }
}

const parser = new FixedSideEffectsParser();
console.log(parser.instanceCounter); // -> 0
```

### Debugging Implications

Due to the execution of the Parser rules during the "recording phase".
Some break points inside Chevrotain Parsers will be hit during the Parser's initialization.

It is possible to workaround this issue by using **conditional breakpoints** that inspect that the
[RECORDING_PHASE flag](https://chevrotain.io/documentation/11_1_0/classes/BaseParser.html#RECORDING_PHASE) is disabled.
