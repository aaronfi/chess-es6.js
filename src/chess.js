'use strict';

const BoardVariation = require('../src/board_variation');
const Color = require('./../src/color');
const Fen = require ('../src/fen');
const Flags = require('./../src/flags');
const Game = require('../src/game');
const Move = require('./../src/move');
const PieceType = require('./../src/piece_type');

class Chess {

    constructor(
    	fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'  /* string */  // TODO(aaron) think about also having a constructor that takes in PGN ?
    ) {
        const game = new Game(fen);
        this.games = [game];

        this.currentGame = game;
        this.currentGameNum = 0;

        this.lastTimerSnapshot = -1;
        this.replayLog = [];
    }

    toString() {
        return `${this.games.length} game${this.games.length > 1 ? 's' : ''} loaded.  Game #${this.currentGameNum + 1} selected:\n\n`
            + this.currentGame.toString();
    }

    addGame(game = new Game()) {
        this.games.push(game);
    }

    selectGame(i) {
        if (i < 0 || i >= this.games.length) {
            return false;
        }

        this.currentGame = this.games[i];
        this.currentGameNum = i;

        return true;
    }

    toPgn(options = {}) {
        options = Object.assign({}, {
            maxWidth: 0,
            newlineChar: '\n',
            showMoveCursor: false,
            showHeaders: true
        }, options);

        return this.currentGame.toPgn(options);
    }

    loadPgn(pgnText, options = {}) {
        options = Object.assign({}, {
            newlineChar: '\r?\n'
        }, options);

        // reduce all newlines into \n for simplified parsing
        pgnText = pgnText.replace(new RegExp(options.newlineChar.replace(/\\/g, '\\'), 'g'), '\n');

        let pairs = this._parsePgnGames(pgnText);

        for (let i = 0; i < pairs.length; i++) {
            let game = this._parsePgnGame(pairs[i].headerText, pairs[i].gameText);
            if (!game) {
                return false;
            }
            this.addGame(game);
        }

        this.selectGame(this.games.length - 1);  // select the game we just loaded...

        return true;
    }

    // sanitizes our raw input PGN text, dividing it up by each unique game entry it contains
    _parsePgnGames(pgnText) {
        let results = [];

        let headMatch, prevHead, newHead, startNew, afterNew, lastOpen, checkedGame = "", numberOfGames = 0, validHead;
        let headerBlockRegex = /\s*(\[\s*\w+\s*"[^"]*"\s*\]\s*)+/;

        // fix common mistakes in PGN text
        pgnText = pgnText.replace(/[\u00A0\u180E\u2000-\u200A\u202F\u205F\u3000]/g," "); // some spaces to plain space
        pgnText = pgnText.replace(/\u00BD/g,"1/2"); // "half fraction" to "1/2"
        pgnText = pgnText.replace(/[\u2010-\u2015]/g,"-"); // "hyphens" to "-"
        pgnText = pgnText.replace(/\u2024/g,"."); // "one dot leader" to "."
        pgnText = pgnText.replace(/[\u2025-\u2026]/g,"..."); // "two dot leader" and "ellipsis" to "..."
        pgnText = pgnText.replace(/\\"/g,"'"); // fix [Opening "Queen\"s Gambit"]

        // escape html entities
        pgnText = pgnText.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

        // PGN standard: ignore lines starting with %
        pgnText = pgnText.replace(/(^|\n)%.*(\n|$)/g, "\n");

        if (headerBlockRegex.exec(pgnText)) {
            while (headMatch = headerBlockRegex.exec(pgnText)) {
                newHead = headMatch[0];
                startNew = pgnText.indexOf(newHead);
                afterNew = startNew + newHead.length;
                if (prevHead) {
                    checkedGame += pgnText.slice(0, startNew);
                    validHead = ((lastOpen = checkedGame.lastIndexOf("{")) < 0) || (checkedGame.lastIndexOf("}")) > lastOpen;
                    if (validHead) {
                        results.push({
                            headerText: prevHead,
                            gameText: checkedGame
                        });
                        checkedGame = "";
                    } else {
                        checkedGame += newHead;
                    }
                } else {
                    validHead = true;
                }
                if (validHead) {
                    prevHead = newHead;
                }
                pgnText = pgnText.slice(afterNew);
            }
        } else {
            results.push({
                headerText: "",
                gameText: pgnText
            });
        }

        if (prevHead) {
            checkedGame += pgnText;
            results.push({
                headerText: prevHead,
                gameText: checkedGame
            });
        }

        return results;
    }

    //
    // behold, an actual PGN parser and lexer, with full support for variations.
    //

    _parsePgnGame(pgnHeaderText, pgnGameText) {
        const POSSIBLE_RESULTS = ['1-0', '0-1', '1/2-1/2', '*'];  // TODO:  this is a constant, put it somewhere better...?

        function _openNewVariation(game, isContinuation) {
            const parentLastMoveIndex = game.currentVariation.moveHistory.length-1;

            const innerVariation = BoardVariation.createFromParentVariation(game.currentVariation, { isContinuation: isContinuation });

            game.boardVariations.push(innerVariation);

            // take the variation we just started, and append it to the list of child variations that start from its "parent" move.
            game.currentVariation.moveHistory[parentLastMoveIndex].childVariations.push(innerVariation);

            game.currentVariation = innerVariation;
        }

        function _closeCurrentVariation(game) {
            game.currentVariation = game.currentVariation.parentVariation;
        }

        // parse pgn's header text
        let key, value, headers = pgnHeaderText.split('\n');

        let fen = Fen.DEFAULT_POSITION_FULL;
        let pairs = [];
        for (let i = 0; i < headers.length; i++) {
            let header = headers[i].trim();

            key   = header.replace(/^\[([A-Z][A-Za-z]*)\s.*\]$/, '$1');
            value = header.replace(/^\[[A-Za-z]+\s"(.*)"\]$/,    '$1');

            if (key.length > 0) {
                pairs.push(key);
                pairs.push(value);

                if (key.toUpperCase() === 'FEN') {
                    fen = value;
                }
            }
        }

        let game = new Game(fen, pairs);

        // parse pgn's chess text
        let prevMove, start, end, comment, ss = pgnGameText;

        for (start = 0; start < ss.length; start++) {
            switch (ss.charAt(start)) {
                case ' ':
                case '\b':
                case '\f':
                case '\n':
                case '\r':
                case '\t':
                    break;

                case ';':
                    // TODO:  add support for "rest of line" comment.  http://www6.chessclub.com/help/PGN-spec
                    break;

                case '{':
                    end = start;
                    while(ss.charAt(end) != '}') {
                        end++;
                    }

                    comment = ss.substring(start, end+1);  // TODO need to properly sanitize this input.

                    if (game.currentVariation.intraMoveAnnotationSlots[game.currentVariation.selectedMoveHistoryIndex + 1]) {
                        game.currentVariation.intraMoveAnnotationSlots[game.currentVariation.selectedMoveHistoryIndex + 1].push(comment);
                    } else {
                        game.currentVariation.intraMoveAnnotationSlots[game.currentVariation.selectedMoveHistoryIndex + 1] = [comment];
                    }

                    if (prevMove) {
                        prevMove.metadata.comment = comment;  // assign all comment blocks to their preceding move
                        // TODO this logic is broken;  there could be multiple comments;  need to push onto a .comments array;
                        // TODO figure out the interplay between metadata.comment and intraMoveAnnotationSlots;
                        // you should probably just have metadata link to the given slots?  instead of duplicating?
                    }

                    start = end;
                    break;

                case '(':
                    let isContinuation = false;
                    if (ss.charAt(start+1) === '*') {
                        isContinuation = true;
                        start++;
                    }
                    _openNewVariation(game, isContinuation);
                    break;

                case ')':
                    _closeCurrentVariation(game);
                    break;

                case '$':
                    // http://en.wikipedia.org/wiki/Numeric_Annotation_Glyphs
                    end = start + 1;
                    while(ss.charAt(end) != ' ') {
                        end++;
                    }

                    let glyph = ss.substring(start, end);  // TODO need to properly sanitize this input.

                    if (game.currentVariation.intraMoveAnnotationSlots[game.currentVariation.selectedMoveHistoryIndex + 1]) {
                        game.currentVariation.intraMoveAnnotationSlots[game.currentVariation.selectedMoveHistoryIndex + 1].push(glyph);
                    } else {
                        game.currentVariation.intraMoveAnnotationSlots[game.currentVariation.selectedMoveHistoryIndex + 1] = [glyph];
                    }

                    start = end;
                    break;

                default:
                    let sanText;

                    for (let i = 0; i < POSSIBLE_RESULTS.length; i++) {
                        if (ss.indexOf(POSSIBLE_RESULTS[i], start) == start) {
                            if (game.currentVariation === game.currentVariation[0]) {
                                end = ss.length;
                            } else {
                                end = start + POSSIBLE_RESULTS[i].length;
                            }
                            start = end;
                            break;
                        }
                    }
                    if (start == ss.length) { break; }

                    let needle = game.currentVariation.moveNumber.toString();

                    if (ss.indexOf(needle,start) == start) {
                        start += needle.length;
                        while (' .\n\r'.indexOf(ss.charAt(start)) != -1) { start++; }
                    }

                    if (ss.substr(start, 2) === Move.WILDCARD_MOVE) {
                        let someMove = Move.createWildcardMove(game.currentVariation);
                        prevMove = game.makeMove(someMove);
                        end = start + 2;
                    } else if (ss.substr(start, 8) === "&lt;&gt;") {
                        let someMove = Move.createWildcardMove(game.currentVariation);
                        prevMove = game.makeMove(someMove);
                        end = start + 8;
                    } else {
                        if ((end = start + ss.substr(start).search(/[\s${;!?()]/)) < start) { end = ss.length; }

                        sanText = ss.substring(start,end);
                        prevMove = game.makeMoveFromSan(sanText);
                    }

                    if (!prevMove) {
                        throw new Error(`error when trying to apply the parsed PGN move "${sanText}"`);
                    }

                    comment = null;

                    if (ss.charAt(end) === ' ') { start = end; }
                    else { start = end - 1; }

                    break;
            }
        }

        if (game.currentVariation !== game.boardVariations[0]) {
            // error: parse_pgn ended with one or more dangling variations that weren't closed off
            while (game.currentVariation !== game.boardVariations[0]) { _closeCurrentVariation(game); }
        }

        return game;
    }

    clear() {
        const game = new Game();
        this.currentGameNum = 0;
        this.currentGame = game;

        this.games[this.currentGameNum] = game;
    }

    reset() {
        const game = new Game(Fen.DEFAULT_POSITION_FULL);
        this.currentGameNum = 0;
        this.currentGame = game;

        this.games[this.currentGameNum] = game;
    }

    whoseTurn() {
        return this.currentGame.currentVariation.turn;
    }

    // --------------------------------------
    // pass-through API methods, alphabetized
    // --------------------------------------

    ascendFromCurrentContinuation() {
        return this.currentGame.ascendFromCurrentContinuation();
    }

    ascendFromCurrentVariation() {
        return this.currentGame.ascendFromCurrentVariation();
    }

    createContinuationFromSan(san /* string, e.g. "Rxa7" or "e8=Q#" */) {
        return this.currentGame.createContinuationFromSan(san);
    }

    createVariationFromSan(san /* string, e.g. "Rxa7" or "e8=Q#" */) {
        return this.currentGame.createVariationFromSan(san);
    }

    descendIntoContinuation(i) {
        return this.currentGame.descendIntoContinuation(i);
    }

    descendIntoVariation(i) {
        return this.currentGame.descendIntoVariation(i);
    }

    get(square /* string, e.g. 'a1' */) {
        return this.currentGame.get(square);
    }

    header()                 { return this.currentGame.header;                   }
    history()                { return this.currentGame.history();                }
    isCheck()                { return this.currentGame.isCheck();                }
    isCheckmate()            { return this.currentGame.isCheckmate();            }
    isDraw()                 { return this.currentGame.isDraw();                 }
    isGameOver()             { return this.currentGame.isGameOver();             }
    isInsufficientMaterial() { return this.currentGame.isInsufficientMaterial(); }
    isStalemate()            { return this.currentGame.isStalemate();            }
    isThreefoldRepetition()  { return this.currentGame.isThreefoldRepetition();  }

    loadFen(fen) {
        return this.currentGame.loadFen(fen);
    }

    makeMove(move /* Move.js object */) {
        return this.currentGame.makeMove(move);
    }

    makeMoveFromSan(san /* string, e.g. "Rxa7" or "e8=Q#" */) {
        return this.currentGame.makeMoveFromSan(san);
    }

    makeMoveFromAlgebraic(
        from /* e.g. 'a4', 'b3' */,
        to   /* e.g. 'a4', 'b3' */,
        promotionPieceType = PieceType.QUEEN
    ) {
        return this.currentGame.makeMoveFromAlgebraic(from, to, promotionPieceType);
    }

    moves(options = {
        onlyAlgebraicSquares: false,
        onlyDestinationSquares: false,
        onlyForSquare: undefined
    }) {
        return this.currentGame.moves(options);
    }

    next() {
        return this.currentGame.next();
    }

    prev() {
        return this.currentGame.prev();
    }

    put(piece /* Piece, e.g. Piece.WHITE_ROOK */, square /* string, e.g. 'h8' */) {
        const success = this.currentGame.put(piece, square);
        if (success) {
            this.currentGame._updateSetup();
        }
        return success;
    }

    remove(square /* string, e.g. 'a1' */) {
        return this.currentGame.remove(square);
    }

    rewindToBeginning() {
        return this.currentGame.rewindToBeginning();
    }

    selectMove(i) {
        return this.currentGame._selectMove(i, { shouldLog: true });
    }

    toFen(options = {
        omitExtras: false
    }) {
        return this.currentGame.currentVariation.toFen(options);
    }

    validateFen(fen) {
        return Fen.validate(fen);
    }
};

module.exports = Chess;