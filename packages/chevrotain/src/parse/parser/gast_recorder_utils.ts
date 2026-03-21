import { IOrAlt } from "@chevrotain/types";
import { Alternation, Alternative } from "@chevrotain/gast";

const { isArray } = Array;

export function gastRecordProd(
  this: any,
  prodConstructor: any,
  mainProdArg: any,
  occurrence: number,
  recordingNullObject: any,
  maxMethodIdx: number,
  handleSep: boolean = false,
): any {
  gastAssertMethodIdxIsValid(occurrence, maxMethodIdx);
  const prevProd: any = this.recordingProdStack.at(-1);
  const grammarAction =
    typeof mainProdArg === "function" ? mainProdArg : mainProdArg.DEF;

  const newProd = new prodConstructor({ definition: [], idx: occurrence });
  if (handleSep) {
    newProd.separator = mainProdArg.SEP;
  }
  if (Object.hasOwn(mainProdArg, "MAX_LOOKAHEAD")) {
    newProd.maxLookahead = mainProdArg.MAX_LOOKAHEAD;
  }

  this.recordingProdStack.push(newProd);
  grammarAction.call(this);
  prevProd.definition.push(newProd);
  this.recordingProdStack.pop();

  return recordingNullObject;
}

export function gastRecordOrProd(
  this: any,
  mainProdArg: any,
  occurrence: number,
  recordingNullObject: any,
  maxMethodIdx: number,
): any {
  gastAssertMethodIdxIsValid(occurrence, maxMethodIdx);
  const prevProd: any = this.recordingProdStack.at(-1);
  const hasOptions = isArray(mainProdArg) === false;
  const alts: IOrAlt<unknown>[] =
    hasOptions === false ? mainProdArg : mainProdArg.DEF;

  const newOrProd = new Alternation({
    definition: [],
    idx: occurrence,
    ignoreAmbiguities: hasOptions && mainProdArg.IGNORE_AMBIGUITIES === true,
  });
  if (Object.hasOwn(mainProdArg, "MAX_LOOKAHEAD")) {
    newOrProd.maxLookahead = mainProdArg.MAX_LOOKAHEAD;
  }

  const hasPredicates = alts.some(
    (currAlt: any) => typeof currAlt.GATE === "function",
  );
  newOrProd.hasPredicates = hasPredicates;

  prevProd.definition.push(newOrProd);

  const savedDslCounter = this._dslCounter;
  const altStarts: number[] = [];

  alts.forEach((currAlt) => {
    altStarts.push(this._dslCounter - savedDslCounter);

    const currAltFlat = new Alternative({ definition: [] });
    newOrProd.definition.push(currAltFlat);
    if (Object.hasOwn(currAlt, "IGNORE_AMBIGUITIES")) {
      currAltFlat.ignoreAmbiguities = currAlt.IGNORE_AMBIGUITIES as boolean;
    } else if (Object.hasOwn(currAlt, "GATE")) {
      currAltFlat.ignoreAmbiguities = true;
    }
    this.recordingProdStack.push(currAltFlat);
    currAlt.ALT.call(this);
    this.recordingProdStack.pop();
  });

  const totalDelta = this._dslCounter - savedDslCounter;

  const mapKey = this.currRuleShortName | occurrence;
  this._orCounterDeltas[mapKey] = totalDelta;
  this._orAltCounterStarts[mapKey] = altStarts;

  return recordingNullObject;
}

export function gastGetIdxSuffix(idx: number): string {
  return idx === 0 ? "" : idx.toString();
}

export function gastAssertMethodIdxIsValid(
  idx: number,
  maxMethodIdx: number,
): void {
  if (idx < 0 || idx > maxMethodIdx) {
    const error: any = new Error(
      `Invalid DSL Method idx value: <${idx}>\n\t` +
        `Idx value must be a none negative value smaller than ${
          maxMethodIdx + 1
        }`,
    );
    error.KNOWN_RECORDER_ERROR = true;
    throw error;
  }
}
