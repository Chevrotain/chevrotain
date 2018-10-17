### Parser Traits (mixins)

The Chevrotain Parser class is implemented as multiple classes mixed-in (combined) together
to provide the required functionality.

A mix-in approach has been chosen to:

1. Split up the large (~3,000 LOC) Parser Class into smaller files.
    - Similar to C# [Partial Classes](https://docs.microsoft.com/en-us/dotnet/csharp/programming-guide/classes-and-structs/partial-classes-and-methods)
2. Avoid performance regressions of the common "classic" Object oriented pattern of composition & delegation.
    - For example, consider: `this.LA()` vs `this.traitX.LA()`
    - Past attempts at extracting an API for Lexer Adaptors using composition have [shown](https://github.com/SAP/chevrotain/issues/528#issuecomment-313863665)
      significant performance regressions.

### Background

The mixin pattern used here is derived from the mixins pattern found in the [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/mixins.html).
There are a few Issues With The TypeScript Handbook Pattern:

-   Duplicate declarations of the instance methods.
-   Missing scenario of interaction between different mixins included by the same class.
    -   This scenario is more similar to partial classes.
-   Instance fields initialization would not be executed.
    -   As instance fields are copied to the constructor by the TypeScript compiler
        and only one constructor would get invoked.

Therefor a slightly modified pattern has been used.

### The "Upgraded" Pattern

The building blocks are as follows:

-   Use Intersection Types to define the complete Type (after all the mixins).
    -   https://github.com/SAP/chevrotain/blob/8a1c3594165849c179f6c9fd67078ba96af0ea34/src/parse/parser/traits/parser_traits.ts#L20-L28
-   Specify the type of "this" context in methods as the intersected mixed Type
    to allow "interaction" between different mixed-ins of the same class.
    -   https://github.com/SAP/chevrotain/blob/8a1c3594165849c179f6c9fd67078ba96af0ea34/src/parse/parser/traits/lexer_adapter.ts#L45
-   Create init methods for each mixin to allow instance members initialization.
    -   https://github.com/SAP/chevrotain/blob/8a1c3594165849c179f6c9fd67078ba96af0ea34/src/parse/parser/traits/lexer_adapter.ts#L17-L21
-   Use a type assertion in the main class constructor to enable calling this init methods.
    -   https://github.com/SAP/chevrotain/blob/8a1c3594165849c179f6c9fd67078ba96af0ea34/src/parse/parser/parser.ts#L225-L232
-   Use A dummy assignment statement to use the TypeScript compiler to ensure the internal Parser implementation matches
    the exposed public API of Chevrotain.

    -   https://github.com/SAP/chevrotain/blob/8a1c3594165849c179f6c9fd67078ba96af0ea34/src/api.ts#L193-L197

-   Pros

    -   Avoid duplication.
    -   Allows splitting up large classes to multiple files if/when class composition is not appropriate.
        -   a.k.a ["partial classes"](https://docs.microsoft.com/en-us/dotnet/csharp/programming-guide/classes-and-structs/partial-classes-and-methods).

-   Cons
    -   Breaks the semantics of TypeScript a bit, What the compiler knows about "SmartObject"
        is no longer the "full story", that is why the factory is needed to create new instances.

### References

-   [Wikipedia Article on Mixins](https://en.wikipedia.org/wiki/Mixin)
-   [Trait Linearization in Scala](https://www.trivento.io/trait-linearization/)

### To Investigate

Would TypeScript 2.2 enabled a simpler & clear pattern by using its support for ["mixin classes"](https://github.com/Microsoft/TypeScript/wiki/What%27s-new-in-TypeScript#support-for-mix-in-classes)?
