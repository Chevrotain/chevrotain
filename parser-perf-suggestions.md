# Chevrotain Parser Runtime Performance Improvement Suggestions

## Methodology

Traced the hot path through a full parse cycle using the JSON grammar (`examples/grammars/json/json.js`) as reference. The runtime flow for every token parsed is roughly:

1. `invokeRuleWithTry` → `ruleInvocationStateUpdate` → `cstInvocationStateUpdate`
2. DSL methods (CONSUME, SUBRULE, OR, OPTION, MANY, AT_LEAST_ONE)
3. Each DSL method: compute lookahead key → cache lookup → execute lookahead → execute action
4. CONSUME: `LA(1)` → `tokenMatcher` → `consumeToken` → `cstPostTerminal`
5. SUBRULE: `ruleToCall.apply(this)` → `cstPostNonTerminal`
6. `ruleFinallyStateUpdate` → `cstFinallyStateUpdate` → `cstPostRule`

All suggestions target this runtime flow, not parser initialization / constructor time.

---

## 1. Eliminate Array Allocations in NOOP `attemptInRepetitionRecovery` Calls

**Files**: `recognizer_engine.ts:411-418`, `recognizer_engine.ts:524-537`
**Impact**: High — called on every MANY/AT_LEAST_ONE iteration

When recovery is disabled, `attemptInRepetitionRecovery` is a NOOP (empty body at `recoverable.ts:377-389`). However, every call site still allocates argument arrays that are immediately discarded:

```typescript
// recognizer_engine.ts:524-537
this.attemptInRepetitionRecovery(
  this.manyInternal,
  [prodOccurrence, actionORMethodDef], // ← Array allocated every iteration, then thrown away
  <any>lookaheadFunction,
  MANY_IDX,
  prodOccurrence,
  NextTerminalAfterManyWalker,
  notStuck,
);
```

This pattern appears in `manyInternalLogic`, `atLeastOneInternalLogic`, `atLeastOneSepFirstInternalLogic`, and `manySepFirstInternalLogic`. In a JSON array with 1000 elements, that's 1000+ throwaway arrays per repetition site.

**Suggestion**: Guard with a flag check to skip the entire call (including argument preparation) when recovery is disabled:

```typescript
if (this.recoveryEnabled) {
  this.attemptInRepetitionRecovery(
    this.manyInternal,
    [prodOccurrence, actionORMethodDef],
    lookaheadFunction,
    MANY_IDX,
    prodOccurrence,
    NextTerminalAfterManyWalker,
    notStuck,
  );
}
```

The branch prediction cost is negligible compared to the array allocation saved. The NOOP inlining optimization was the right idea, but V8 can't eliminate the argument expression evaluation even if the function body is empty.

---

## 2. Sentinel EOF Tokens to Eliminate Bounds Checking in `LA()`

**File**: `lexer_adapter.ts:54-61`
**Impact**: High — `LA(1)` is the single most-called method in the entire parser

```typescript
LA(howMuch: number): IToken {
  const soughtIdx = this.currIdx + howMuch;
  if (soughtIdx < 0 || this.tokVectorLength <= soughtIdx) {
    return END_OF_FILE;
  } else {
    return this.tokVector[soughtIdx];
  }
}
```

`LA(1)` is called for every CONSUME, every lookahead check, every separator check in `*_SEP` loops, every `isAtEndOfInput` check, every `doSingleRepetition`, and more. The two-sided bounds check (`< 0` and `>= length`) adds branching overhead on every single call. For `LA(1)` specifically, `soughtIdx < 0` is structurally impossible (since `currIdx >= -1`).

**Suggestion**: Pad the token vector with sentinel EOF tokens during `set input()`:

```typescript
set input(newInput: IToken[]) {
  this.reset();
  this.tokVector = newInput;
  this.tokVectorLength = newInput.length;
  // Pad with sentinels for bounds-free forward LA()
  for (let i = 0; i < this.maxLookahead + 1; i++) {
    this.tokVector.push(END_OF_FILE);
  }
}
```

Then the forward-only fast path becomes:

```typescript
LA(howMuch: number): IToken {
  // Negative lookahead (LA(0) for "previous token") still needs a check,
  // but this path is far less common
  const soughtIdx = this.currIdx + howMuch;
  if (soughtIdx < 0) {
    return END_OF_FILE;
  }
  return this.tokVector[soughtIdx];
}
```

The `>= length` check is gone because sentinel EOF tokens handle that case naturally. The `< 0` check only matters for `LA(0)` (used in error messages and `cstPostRule`) — for the dominant `LA(1)` case, the branch predictor will almost always predict "not taken."

Note: This mutates the input array. If that's unacceptable, copy it first. But the current code already stores the reference directly, so mutation may be acceptable.

---

## 3. Cache Current Rule Short Name Instead of Array Lookups

**Files**: `tree_builder.ts:261-263`, `looksahead.ts:176-187`
**Impact**: High — called on every OPTION, OR, MANY, AT_LEAST_ONE, CONSUME

Every DSL method call computes a lookahead cache key via `getKeyForAutomaticLookahead`, which calls `getLastExplicitRuleShortName`:

```typescript
// tree_builder.ts:261-263
getLastExplicitRuleShortName(): number {
  const ruleStack = this.RULE_STACK;
  return ruleStack[ruleStack.length - 1];
}
```

This involves: (1) property access `this.RULE_STACK`, (2) `.length` read, (3) subtraction, (4) array index. This is repeated for every single DSL operation within every rule.

**Suggestion**: Cache the current rule's short name in a direct field:

```typescript
// Add field:
currRuleShortName: number;

// In ruleInvocationStateUpdate:
ruleInvocationStateUpdate(shortName, fullName, idxInCallingRule) {
  this.RULE_OCCURRENCE_STACK.push(idxInCallingRule);
  this.RULE_STACK.push(shortName);
  this.currRuleShortName = shortName;  // ← direct cache
  this.cstInvocationStateUpdate(fullName);
}

// In ruleFinallyStateUpdate:
ruleFinallyStateUpdate() {
  this.RULE_STACK.pop();
  this.RULE_OCCURRENCE_STACK.pop();
  // Restore parent rule's short name
  const ruleStack = this.RULE_STACK;
  if (ruleStack.length > 0) {
    this.currRuleShortName = ruleStack[ruleStack.length - 1];
  }
  this.cstFinallyStateUpdate();
  // ...
}

// Then getKeyForAutomaticLookahead becomes:
getKeyForAutomaticLookahead(dslMethodIdx, occurrence) {
  return occurrence | dslMethodIdx | this.currRuleShortName;
}
```

This turns a 4-step lookup into a single property access on every DSL call.

---

## 4. Cache Current CST Node to Avoid `CST_STACK[length-1]`

**File**: `tree_builder.ts:209, 220`, `recognizer_engine.ts:227`
**Impact**: High — accessed on every CONSUME and SUBRULE call

The current CST node is retrieved via `this.CST_STACK[this.CST_STACK.length - 1]` in three frequently-called methods:

```typescript
// cstPostTerminal (called for every CONSUME):
const rootCst = this.CST_STACK[this.CST_STACK.length - 1];

// cstPostNonTerminal (called for every SUBRULE):
const preCstNode = this.CST_STACK[this.CST_STACK.length - 1];

// invokeRuleWithTry (called for every rule entry):
const cst = this.CST_STACK[this.CST_STACK.length - 1];
```

**Suggestion**: Maintain a `currCstNode` field:

```typescript
currCstNode: CstNode;

cstInvocationStateUpdate(fullRuleName: string): void {
  const cstNode: CstNode = {
    name: fullRuleName,
    children: Object.create(null),
  };
  this.setInitialNodeLocation(cstNode);
  this.CST_STACK.push(cstNode);
  this.currCstNode = cstNode;  // ← direct cache
}

cstFinallyStateUpdate(): void {
  this.CST_STACK.pop();
  // Restore parent's CST node
  const stack = this.CST_STACK;
  if (stack.length > 0) {
    this.currCstNode = stack[stack.length - 1];
  }
}

cstPostTerminal(key: string, consumedToken: IToken): void {
  const rootCst = this.currCstNode;  // ← direct access
  addTerminalToCst(rootCst, consumedToken, key);
  this.setNodeLocationFromToken(rootCst.location!, consumedToken);
}
```

---

## 5. Remove `try/catch` from `consumeInternal`/`subruleInternal` When Recovery Is Disabled

**File**: `recognizer_engine.ts:724-754`, `recognizer_engine.ts:682-703`
**Impact**: High — `consumeInternal` is called for every CONSUME (the most frequent operation)

Currently, every CONSUME wraps token matching in try/catch:

```typescript
consumeInternal(tokType, idx, options) {
  let consumedToken;
  try {
    const nextToken = this.LA(1);
    if (this.tokenMatcher(nextToken, tokType) === true) {
      this.consumeToken();
      consumedToken = nextToken;
    } else {
      this.consumeInternalError(tokType, nextToken, options);  // always throws
    }
  } catch (eFromConsumption) {
    consumedToken = this.consumeInternalRecovery(tokType, idx, eFromConsumption);
  }
  this.cstPostTerminal(/* ... */);
  return consumedToken;
}
```

When recovery is disabled, `consumeInternalRecovery` just re-throws. The try/catch exists solely for the recovery path. While modern V8 (TurboFan) can optimize try/catch better than older engines, it still prevents certain optimizations and adds overhead for the exception handling machinery setup.

**Suggestion**: Apply the same NOOP-at-init-time pattern already used for `cstPostRule` and `attemptInRepetitionRecovery`. During `initRecognizerEngine` (or `initRecoverable`), assign a recovery-free variant:

```typescript
// In initRecoverable or initRecognizerEngine:
if (!this.recoveryEnabled) {
  this.consumeInternal = this.consumeInternalNoRecovery;
}

// Fast variant:
consumeInternalNoRecovery(tokType, idx, options) {
  const nextToken = this.LA(1);
  if (this.tokenMatcher(nextToken, tokType) === true) {
    this.consumeToken();
    this.cstPostTerminal(
      options !== undefined && options.LABEL !== undefined
        ? options.LABEL
        : tokType.name,
      nextToken,
    );
    return nextToken;
  } else {
    this.consumeInternalError(tokType, nextToken, options);  // throws, unwinding to invokeRuleWithTry
  }
}
```

The same pattern can be applied to `subruleInternal` (`recognizer_engine.ts:682-703`), which also has a try/catch that only does meaningful work during recovery (adding partial CST results).

---

## 6. Pre-Initialize CST `children` With Known Keys Per Rule

**File**: `tree_builder.ts:154-162`, `cst.ts:65-86`
**Impact**: Medium-High — affects V8 hidden class optimization for every CST node

Currently, every rule creates a CST node with a blank `Object.create(null)` children dictionary:

```typescript
const cstNode: CstNode = {
  name: fullRuleName,
  children: Object.create(null),
};
```

Children keys are then added dynamically in `addTerminalToCst`/`addNoneTerminalToCst`:

```typescript
if (node.children[tokenTypeName] === undefined) {
  node.children[tokenTypeName] = [token];
} else {
  node.children[tokenTypeName].push(token);
}
```

This means:

1. The `children` object is in "dictionary mode" from creation (`Object.create(null)`)
2. Properties are added dynamically, preventing V8 from establishing a stable hidden class
3. CST nodes for the same rule get different hidden classes depending on which branches are taken

**Suggestion**: During `performSelfAnalysis`, pre-compute a children key list for each rule based on its known terminals and non-terminals. Pre-initialize children eagerly:

```typescript
// Pre-computed during performSelfAnalysis:
this.ruleChildrenKeys["objectItem"] = ["StringLiteral", "Colon", "value"];

// During cstInvocationStateUpdate:
const children = Object.create(null);
const keys = this.ruleChildrenKeys[fullRuleName];
for (let i = 0; i < keys.length; i++) {
  children[keys[i]] = [];
}
```

This gives V8 a consistent hidden class for all `children` objects of the same rule, and eliminates the `=== undefined` check in `addTerminalToCst`/`addNoneTerminalToCst` since the array always exists. The trade-off is pre-allocating empty arrays for optional children, but this is offset by the V8 inline-cache benefits.

An alternative is to use a constructor function per rule for the children object, giving V8 an even stronger hidden class signal:

```typescript
// Pre-computed per rule during performSelfAnalysis:
function ObjectItemChildren() {
  this.StringLiteral = undefined;
  this.Colon = undefined;
  this.value = undefined;
}
```

---

## 7. Use Pre-Allocated Arrays With Depth Counter for State Stacks

**File**: `recognizer_engine.ts:828-838, 663-666`
**Impact**: Medium — affects every rule entry/exit

`RULE_STACK`, `RULE_OCCURRENCE_STACK`, and `CST_STACK` use `push()`/`pop()` on standard arrays:

```typescript
ruleInvocationStateUpdate(shortName, fullName, idxInCallingRule) {
  this.RULE_OCCURRENCE_STACK.push(idxInCallingRule);
  this.RULE_STACK.push(shortName);
  this.cstInvocationStateUpdate(fullName);
}

ruleFinallyStateUpdate() {
  this.RULE_STACK.pop();
  this.RULE_OCCURRENCE_STACK.pop();
  this.cstFinallyStateUpdate(); // pops CST_STACK
}
```

Array `push`/`pop` can trigger internal array resizing and GC.

**Suggestion**: Pre-allocate with a reasonable max depth and use index counters:

```typescript
// Init:
this.RULE_STACK = new Array(64); // pre-allocate for typical grammar depth
this.ruleStackIdx = -1;

// Push:
this.RULE_STACK[++this.ruleStackIdx] = shortName;

// Pop:
this.ruleStackIdx--;

// Peek:
this.RULE_STACK[this.ruleStackIdx];
```

This eliminates dynamic resizing. The fixed size of 64 covers even deeply nested grammars. Combined with suggestion #3 (caching current values), the stack lookups become rare.

---

## 8. Replace `Map` with Plain Object for `lookAheadFuncsCache`

**File**: `looksahead.ts:53, 189-196`
**Impact**: Medium — one lookup per DSL method call

```typescript
// Init:
this.lookAheadFuncsCache = new Map();

// Lookup:
getLaFuncFromCache(key: number): Function {
  return this.lookAheadFuncsCache.get(key);
}
```

The keys are 32-bit integers (from `getKeyForAutomaticLookahead`). For small to medium maps with integer keys, V8's internal property access on plain objects can be faster than `Map.get()` due to lower overhead.

**Suggestion**: Use a plain object (or `Object.create(null)`):

```typescript
this.lookAheadFuncsCache = Object.create(null);

getLaFuncFromCache(key: number): Function {
  return this.lookAheadFuncsCache[key];
}

setLaFuncCache(key: number, value: Function): void {
  this.lookAheadFuncsCache[key] = value;
}
```

This should be benchmarked as the relative performance of `Map` vs plain objects varies between V8 versions. For the typical case (a few dozen to a few hundred entries), plain objects with integer keys are often faster.

---

## 9. Make Infinite Loop Detection in `doSingleRepetition` Optional

**File**: `recognizer_engine.ts:633-641`
**Impact**: Medium — called on every MANY/AT_LEAST_ONE iteration

```typescript
doSingleRepetition(action: Function): any {
  const beforeIteration = this.getLexerPosition();
  action.call(this);
  const afterIteration = this.getLexerPosition();
  return afterIteration > beforeIteration;
}
```

This saves and compares the lexer position before/after every loop iteration to detect stuck parsers. For correct grammars (the common production case), this is pure overhead — two method calls (`getLexerPosition` → `exportLexerState` → returns `this.currIdx`) and a comparison per iteration.

**Suggestion**: Add a config flag (e.g., `skipStuckDetection: true`) that replaces `doSingleRepetition` with a direct call:

```typescript
if (config.skipStuckDetection) {
  this.doSingleRepetition = (action) => {
    action.call(this);
    return true; // always progressing
  };
}
```

Or restructure the loop to not use `doSingleRepetition` at all when stuck detection is off:

```typescript
if (this.skipStuckDetection) {
  while (lookaheadFunction.call(this) === true) {
    action.call(this);
  }
} else {
  let notStuck = true;
  while (lookaheadFunction.call(this) === true && notStuck === true) {
    notStuck = this.doSingleRepetition(action);
  }
}
```

---

## 10. Avoid `options` Parameter Overhead in Common Case

**Files**: `recognizer_engine.ts:690-698, 747-751`
**Impact**: Medium — affects every CONSUME and SUBRULE

Most CONSUME/SUBRULE calls don't pass options (no LABEL, no ARGS, no ERR_MSG). But the runtime checks `options !== undefined` and then `options.LABEL !== undefined` on every call:

```typescript
// subruleInternal:
const args = options !== undefined ? options.ARGS : undefined;
this.subruleIdx = idx;
ruleResult = ruleToCall.apply(this, args);
this.cstPostNonTerminal(
  ruleResult,
  options !== undefined && options.LABEL !== undefined
    ? options.LABEL
    : ruleToCall.ruleName,
);

// consumeInternal:
this.cstPostTerminal(
  options !== undefined && options.LABEL !== undefined
    ? options.LABEL
    : tokType.name,
  consumedToken,
);
```

In the JSON grammar, none of the 14 CONSUME/SUBRULE calls pass options.

**Suggestion**: The CONSUME/SUBRULE numbered methods could split into two internal paths at the call site:

```typescript
// Specialized for no-options (the common case):
consumeInternalNoOpts(tokType, idx) {
  const nextToken = this.LA(1);
  if (this.tokenMatcher(nextToken, tokType) === true) {
    this.consumeToken();
    this.cstPostTerminal(tokType.name, nextToken);
    return nextToken;
  }
  this.consumeInternalError(tokType, nextToken, undefined);
}

// Then CONSUME becomes:
CONSUME(tokType, options) {
  return options === undefined
    ? this.consumeInternalNoOpts(tokType, 0)
    : this.consumeInternal(tokType, 0, options);
}
```

---

## Summary Table

| #   | Suggestion                                                             | Affected Hot Path                             | Est. Impact |
| --- | ---------------------------------------------------------------------- | --------------------------------------------- | ----------- |
| 1   | Guard `attemptInRepetitionRecovery` to skip array alloc                | Every MANY/AT_LEAST_ONE iteration             | High        |
| 2   | Sentinel EOF tokens in token vector                                    | Every `LA()` call                             | High        |
| 3   | Cache `currRuleShortName`                                              | Every DSL method (CONSUME, OR, OPTION, MANY…) | High        |
| 4   | Cache `currCstNode`                                                    | Every CONSUME and SUBRULE                     | High        |
| 5   | Remove try/catch from `consumeInternal`/`subruleInternal` w/o recovery | Every CONSUME and SUBRULE                     | High        |
| 6   | Pre-initialize CST children keys per rule                              | Every CST node creation + child addition      | Medium-High |
| 7   | Pre-allocated state stacks with depth counters                         | Every rule entry/exit                         | Medium      |
| 8   | Replace `Map` with plain object for lookahead cache                    | Every DSL method                              | Medium      |
| 9   | Optional infinite loop detection in `doSingleRepetition`               | Every MANY/AT_LEAST_ONE iteration             | Medium      |
| 10  | Fast path for no-options CONSUME/SUBRULE                               | Every CONSUME and SUBRULE without options     | Medium      |

## Human feedback

### 1. Guard `attemptInRepetitionRecovery` to skip array alloc

Tested by commenting out the call to `attemptInRepetitionRecovery` in `manyInternalLogic` and `atLeastOneInternalLogic`. no performance impact detected...

### 2. Sentinel EOF Tokens to Eliminate Bounds Checking in `LA()`

- Status: 34 failing tests
- 3% boost for JSON benchmark
- But only if we also remove the negative lookahead condition
- It might be possible to implement a separate LA_NEGATIVE() method to only handle this lookbehind condition from call sites where it matters.
  - There does not seem to be any call sites that do LA(-1)
  - Perhaps this is just a breaking API change rather than functional flow breaking?
- Problem: Mutating the input array is a breaking change
  - alternative of shallow copying they array is inefficient, and can reduce per
  - Although in CSS benchmark it seems even with copy we get +6-7% boost for parser flow
    - but that is with RedundantInputCheck disabled.

#### Conclusion:

Try to refactor the code to distunguish the top level rule without conditional.
That way we can:

1. remove redudant input check on every rule exit
2. revert input token array mutation before exiting parsing flow.
