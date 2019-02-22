export declare const failedOptimizationPrefixMsg = "Unable to use \"first char\" lexer optimizations:\n";
export declare function getStartCodes(regExp: RegExp, ensureOptimizations?: boolean): number[];
export declare function firstChar(ast: any): number[];
export declare function applyIgnoreCase(firstChars: number[]): number[];
export declare function canMatchCharCode(charCodes: number[], pattern: RegExp | string): boolean;
