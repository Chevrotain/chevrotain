module chevrotain.text.range {

    export interface IRange {

        start:number;
        end:number;

        contains(num:number):boolean;

        isContainedInRange(other:IRange):boolean;

        isStrictlyContainedInRange(other:IRange):boolean;

        containsRange(other:IRange):boolean;

        strictlyContainsOtherRange(other:IRange):boolean;

        overlapsOtherRange(other:IRange):boolean;

        equals(other:IRange):boolean;

        size():number;

    }

    export class Range implements IRange {

        private _start;
        get start():number {
            return this._start;
        }

        set start(newStart:number) {
            this._start = newStart;
        }

        private _end;
        get end():number {
            return this._end;
        }

        set end(newEnd:number) {
            this._end = newEnd;
        }

        constructor(start:number, end:number) {
            if (!isValidRange(start, end)) {
                throw Error("INVALID RANGE");
            }
            this._start = start;
            this._end = end;
        }

        contains(num:number):boolean {
            return this.start <= num && this.end >= num;
        }

        isContainedInRange(other:IRange):boolean {
            return other.containsRange(this);
        }

        isStrictlyContainedInRange(other:IRange):boolean {
            return this.start > other.start && this.end < other.end;
        }

        containsRange(other:IRange):boolean {
            return this.start <= other.start && this.end >= other.end;
        }

        strictlyContainsOtherRange(other:IRange):boolean {
            return this.start < other.start && this.end > other.end;
        }

        overlapsOtherRange(other:IRange):boolean {
            return this.start <= other.start && this.end >= other.start ||
                this.start <= other.end && this.end >= other.end ||
                this.containsRange(other) || other.containsRange(this);
        }

        equals(other:IRange):boolean {
            return this.start === other.start &&
                this.end === other.end;
        }

        size():number {
            return this.end - this.start + 1;
        }
    }

    export function INVALID_OFFSET():number {
        return -1;
    }

    export function isValidRange(start:number, end:number):boolean {
        return !(start < 0 || end < start);
    }
}
