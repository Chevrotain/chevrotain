/**
 * a language made of a series of statements terminated by semicolons
 *
 * CREATE TABLE schema2.Persons
 * INSERT (32, "SHAHAR") INTO schema2.Persons
 * DELETE (31, "SHAHAR") FROM schema2.Persons
 */
import { Parser } from "../../../../src/parse/parser/traits/parser_traits";
import { VirtualToken } from "./sql_recovery_tokens";
import { ParseTree } from "../../parse_tree";
import { IToken, TokenType } from "../../../../api";
export declare class DDLExampleRecoveryParser extends Parser {
    constructor(isRecoveryEnabled?: boolean);
    ddl: (idxInCallingRule?: number, ...args: any[]) => any;
    createStmt: (idxInCallingRule?: number, ...args: any[]) => any;
    insertStmt: (idxInCallingRule?: number, ...args: any[]) => any;
    deleteStmt: (idxInCallingRule?: number, ...args: any[]) => any;
    qualifiedName: (idxInCallingRule?: number, ...args: any[]) => any;
    recordValue: (idxInCallingRule?: number, ...args: any[]) => any;
    private value;
    private parseDdl;
    private parseCreateStmt;
    private parseInsertStmt;
    private parseDeleteStmt;
    private parseQualifiedName;
    private parseRecordValue;
    private parseValue;
}
export declare function WRAP_IN_PT(toks: IToken[]): ParseTree[];
export declare class INVALID_INPUT extends VirtualToken {
    static PATTERN: RegExp;
}
export declare function INVALID(tokType?: TokenType): () => ParseTree;
