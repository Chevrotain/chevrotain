module chevrotain.parse.tree {

    import tok = chevrotain.scan.tokens;

    export class ParseTree {
        getImage():string { return this.payload.image;}

        getLine():number { return this.payload.startLine;}

        getColumn():number { return this.payload.startColumn;}

        constructor(public payload:tok.Token = tok.NONE_TOKEN(), public children:ParseTree[] = []) {}
    }

    export function getAllTokensFromParseTree(tree:ParseTree):tok.Token[] {
        var allPayloads = getAllTokensFromParseTreeInternal(tree);
        return _.flatten<tok.Token>(allPayloads);
    }

    function getAllTokensFromParseTreeInternal(tree:ParseTree):any {
        var myPayload = tree.payload;
        var childrenPayloadsArrs = _.map(tree.children, getAllTokensFromParseTreeInternal);

        return [myPayload, childrenPayloadsArrs];
    }

}

