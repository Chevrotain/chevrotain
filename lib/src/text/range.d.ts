export interface IRange {
    start: number;
    end: number;
    contains(num: number): boolean;
    containsRange(other: IRange): boolean;
    isContainedInRange(other: IRange): boolean;
    strictlyContainsRange(other: IRange): boolean;
    isStrictlyContainedInRange(other: IRange): boolean;
}
export declare class Range implements IRange {
    start: number;
    end: number;
    constructor(start: number, end: number);
    contains(num: number): boolean;
    containsRange(other: IRange): boolean;
    isContainedInRange(other: IRange): boolean;
    strictlyContainsRange(other: IRange): boolean;
    isStrictlyContainedInRange(other: IRange): boolean;
}
export declare function isValidRange(start: number, end: number): boolean;
