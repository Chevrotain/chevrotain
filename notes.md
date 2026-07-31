can you think of other ways we could optimze the lookahead related logic, list the ways, do not implement and test just suggest options to test.

Some thoughts:

1. different ordering of occurence and DSL rule in the bitmap key.
2. what if we used fewer bits for occurence idx (smaller result integers)
3. what if we use a Map instead of array for the inner `[METHOD_IDX | occurrence]` part
4. would pre-initializing the [denseRuleIdx] at the right size make it faster in V8? in order words does a dense array at some point resolve properties like an object if we keep adding to it items one by one?
