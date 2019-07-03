import * as apiDefs from "../api"
import * as apiImpl from "./api"
import { MixedInParser } from "./parse/parser/traits/parser_traits"

type AssertExtends<T extends R, R> = [T, R]

export type TypeCheckForApi = [
    AssertExtends<
        typeof apiImpl & {
            /** @see https://github.com/Microsoft/TypeScript/issues/19545 */
            BaseParser: any

            /** @see  https://github.com/SAP/chevrotain/blob/87ed262c36b6f5cb4073e14f4f59901146c6c7a5/packages/chevrotain/src/api.ts#L213-L215*/
            Parser: any
            CstParser: any
            EmbeddedActionsParser: any
        },
        typeof apiDefs
    >,
    AssertExtends<MixedInParser, apiDefs.Parser>
]
