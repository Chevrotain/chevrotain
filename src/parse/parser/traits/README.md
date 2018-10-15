## TODO:

-   Split-up the state to the appropriate traits.
-   Decide what to do about the constructor (if anything?)
    -   Perhaps provide an init function for every trait?
    -   Need to inspect performance in case it would trigger regressions due to V8 failed optimizations
-   Documentation
-   split up internal interfaces to the appropriate traits.
-   evaluate splitting up additional exported runtime constructs to appropriate traits (enums? / END_OF_FILE)
-   Review using of prototypes in constructor assembly
