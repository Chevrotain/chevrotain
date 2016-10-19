var expect = require("chai").expect;

describe('The Official Content Assist Feature example Example - using ES6 syntax', function() {

    var getContentAssistSuggestions

    var symbolTable = ['foo', 'bar', 'average'];

    context('can perform content assist for simple statements parser (K > 1) for inputs:', function() {

        it('Text: "public "', function() {
            // hack to avoid loading a module with ES6 syntax on node.js 0.12 (during integration builds)
            getContentAssistSuggestions = require("./official_feature_content_assist").getContentAssistSuggestions

            var inputText = 'public ';
            var suggestions = getContentAssistSuggestions(inputText, symbolTable);
            expect(suggestions).to.have.members(['static', 'enum', 'function'])
                .and.to.have.lengthOf(3);
        });

        it('Text: "public static"', function() {
            // hack to avoid loading a module with ES6 syntax on node.js 0.12 (during integration builds)
            getContentAssistSuggestions = require("./official_feature_content_assist").getContentAssistSuggestions

            var inputText = 'public static ';
            var suggestions = getContentAssistSuggestions(inputText, symbolTable);
            expect(suggestions).to.have.members(['function'])
                .and.to.have.lengthOf(1);
        });

        it('empty text', function() {
            // hack to avoid loading a module with ES6 syntax on node.js 0.12 (during integration builds)
            getContentAssistSuggestions = require("./official_feature_content_assist").getContentAssistSuggestions

            var inputText = '   ';
            var suggestions = getContentAssistSuggestions(inputText, symbolTable);
            expect(suggestions).to.have.members(['private', 'public', 'static', 'call', 'function', 'enum'])
                .and.to.have.lengthOf(6);
        });

        it('Text: "call "', function() {
            // hack to avoid loading a module with ES6 syntax on node.js 0.12 (during integration builds)
            getContentAssistSuggestions = require("./official_feature_content_assist").getContentAssistSuggestions

            var inputText = 'call ';
            var suggestions = getContentAssistSuggestions(inputText, symbolTable);
            expect(suggestions).to.have.members(['foo', 'bar', 'average'])
                .and.to.have.lengthOf(3);
        });

        it('Text: "call aver"', function() {
            // hack to avoid loading a module with ES6 syntax on node.js 0.12 (during integration builds)
            getContentAssistSuggestions = require("./official_feature_content_assist").getContentAssistSuggestions

            var inputText = 'call aver';
            var suggestions = getContentAssistSuggestions(inputText, symbolTable);
            expect(suggestions).to.have.members(['average'])
                .and.to.have.lengthOf(1);
        });

        it('Text: "private enu"', function() {
            // hack to avoid loading a module with ES6 syntax on node.js 0.12 (during integration builds)
            getContentAssistSuggestions = require("./official_feature_content_assist").getContentAssistSuggestions

            var inputText = 'private enu';
            var suggestions = getContentAssistSuggestions(inputText, symbolTable);
            expect(suggestions).to.have.members(['enum'])
                .and.to.have.lengthOf(1);
        });

        it('Text: "private enum "', function() {
            // hack to avoid loading a module with ES6 syntax on node.js 0.12 (during integration builds)
            getContentAssistSuggestions = require("./official_feature_content_assist").getContentAssistSuggestions

            // no suggestion for declaration identifier
            var inputText = 'private enum ';
            var suggestions = getContentAssistSuggestions(inputText, symbolTable);
            expect(suggestions).to.have.members([])
                .and.to.have.lengthOf(0);
        });

        it('Text: "private enum MONTHS\n' +
            '      static "', function() {
            // hack to avoid loading a module with ES6 syntax on node.js 0.12 (during integration builds)
            getContentAssistSuggestions = require("./official_feature_content_assist").getContentAssistSuggestions

            var inputText = 'private enum MONTHS\n' +
                'static ';
            var suggestions = getContentAssistSuggestions(inputText, symbolTable);
            expect(suggestions).to.have.members(['function'])
                .and.to.have.lengthOf(1);
        });

    })
});
