'use strict';

const BoardVariation = require('../src/board_variation');
const Color = require('./../src/color');
const EventLog = require('./../src/event_log');
const Fen = require('../src/fen');
const Flags = require('./../src/flags');
const LinkedHashMap = require('../src/linked_hash_map');
const Move = require('./../src/move');
const PieceType = require('./../src/piece_type');

class Game {

    constructor(
        fen = Fen.DEFAULT_POSITION_FULL,  /* string, e.g. 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1' */
        pgnHeaderPairs = []
    ) {
        // EventLog for tracking all player interactions
        this.eventLog = new EventLog();

        // a chess's PGN header applies to all of its variations
        this.header = new LinkedHashMap(pgnHeaderPairs);

		// our board state information will always reside within the context of a given line of play, i.e. variation
        if (fen) {
            this.currentVariation = BoardVariation.createFromFen(fen, this.eventLog);

            if (fen !== Fen.DEFAULT_POSITION_FULL) {
                this.header.set('SetUp', '1');
                this.header.set('FEN', fen);
            }
        } else {
            this.currentVariation = new BoardVariation(this.eventLog);
        }

  		// to store any continuations/variations
        this.boardVariations = [this.currentVariation];
    }

    toString() {
        let pgn = this.toPgn({
            maxWidth: 0,
            newlineChar: '\n',
            showMoveCursor: true,
            showHeaders: false
        });

        let lineSize = Math.max(80, Math.floor(pgn.length / 4));

        let pgnLines = [];
        for (let i = 0; i < pgn.length;) {
            let start = i;
            i += lineSize;
            while (pgn.charAt(i) != ' ' && i < pgn.length) {
                i++;
            }
            pgnLines.push(pgn.substring(start,i));
        }

        let result = '';

        let asciiLines = this.currentVariation.toString().split("\n");
        let tallies = ` : (variations: ${this.boardVariations.length}, move history length: ${this.currentVariation.moveHistory.length}, selected index: ${this.currentVariation.selectedMoveHistoryIndex})`;
        for(let i = 0; i < asciiLines.length; i++) {
            result += asciiLines[i];

            if (this.currentVariation.turn === Color.WHITE) {
                if (i == 9) result += tallies;
            } else {
                if (i == 0) result += tallies;
            }

            if (i >= 2 && pgnLines.length > i-2) result += '  ' + pgnLines[i-2];
            if (i == 7) result += '  ' + this.currentVariation.toFen();
            result += '\n';
        }
        return result;
    }

    loadFen(fen) {
        let variation = BoardVariation.createFromFen(fen);
        if (variation) {
            this.currentVariation = variation;
            this._updateSetup();
            this.boardVariations = [variation];
            return true;
        } else {
            return false;
        }
    }

    makeMove(
        move,  /* Move object from move.js */
        metadata = {}
    ) {
        metadata = Object.assign({}, {
            comment: null,  /* string */
            timeTakenToMove: null,  /* int */
            isPuzzleSolution: null  /* boolean */
        }, metadata);

        return this.currentVariation.makeMove(move, this, metadata);
    }

    makeMoveFromSan(
        san,  /* string, e.g. "Rxa7" or "e8=Q#" */
        metadata = {}
    ) {
        metadata = Object.assign({}, {
            comment: null,  /* string */
            timeTakenToMove: null,  /* int */
            isPuzzleSolution: null  /* boolean */
        }, metadata);

        return this.currentVariation.makeMoveFromSan(san, this, metadata);
    }

    makeMoveFromAlgebraic(
        from /* e.g. 'a4', 'b3' */,
        to   /* e.g. 'a4', 'b3' */,
        promotionPieceType = PieceType.QUEEN,
        metadata = {}
    ) {
        metadata = Object.assign({}, {
            comment: null,  /* string */
            timeTakenToMove: null,  /* int */
            isPuzzleSolution: null  /* boolean */
        }, metadata);

        return this.currentVariation.makeMoveFromAlgebraic(from, to, this, promotionPieceType, metadata);
    }

    toPgn(options = {}) {
        options = Object.assign({}, {
            maxWidth: 0,
            newlineChar: '\n',
            showMoveCursor: false,
            showHeaders: true
        }, options);

        let result = [];

        // add the PGN header information
        if (options.showHeaders) {
            for (let i = 0; i < this.header.length(); i++) {
                result.push(`[${this.header.getKeyAtPosition(i)} "${this.header.getValueAtPosition(i)}"]${options.newlineChar}`);
            }
            if (this.header.length() > 0) {
                result.push(options.newlineChar);
            }
        }

        let outermostVariation = this.boardVariations[0];
        const moves = processVariation(outermostVariation, 1, this.currentVariation);

        function processVariation(variation, pgnMoveNum, currentVariation) {
            let moves = [];
            let variationMoveString = '';
            let justStartedVariation = false;
            let justFinishedVariation = false;

            // initial leading annotation slot
            if (variation.intraMoveAnnotationSlots[0]) {
                moves = moves.concat(variation.intraMoveAnnotationSlots[0]);
            }

            for (let i = 0; i < variation.moveHistory.length; i++) {

                //
                // #1: process move
                //

                let moveContext = variation.moveHistory[i];

                justStartedVariation = (i == 0);

                // if the position started with black to move, start PGN with 1. ...
                if (justStartedVariation && moveContext.move.movedPiece.color === Color.BLACK) {
                    moves.push(pgnMoveNum + '...');
                    pgnMoveNum++;
                } else if ((justStartedVariation || justFinishedVariation) && moveContext.move.movedPiece.color === Color.BLACK && !variation.isContinuation) {
                    moves.push((pgnMoveNum-1) + '...');

                } else if (moveContext.move.movedPiece.color === Color.WHITE) {
                    moves.push(pgnMoveNum + '.');
                    pgnMoveNum++;
                }

                moves.push((moveContext.move.isWildcard ? Move.WILDCARD_MOVE : moveContext.move.san));

                if (options.showMoveCursor) {
                    let isCurrentlySelectedMove = variation === currentVariation && i === currentVariation.selectedMoveHistoryIndex;
                    if (isCurrentlySelectedMove) {
                        moves.push(' ^');
                    }
                }

                //
                // #2: process annotations
                //

                if (variation.intraMoveAnnotationSlots[i+1]) {
                    moves = moves.concat(variation.intraMoveAnnotationSlots[i+1]);
                }

                //
                // #3: process variations
                //

                justFinishedVariation = false;
                if (variation.moveHistory[i].childVariations.length > 0) {

                    if (variation.intraMoveAnnotationSlots[i+1]) {
                        moves.concat(variation.intraMoveAnnotationSlots[i+1]);
                    }

                    for (let j = 0; j < variation.moveHistory[i].childVariations.length; j++) {
                        let childVariation = variation.moveHistory[i].childVariations[j];

                        let variationMoves = processVariation(childVariation, pgnMoveNum - (childVariation.isContinuation ? 0 : 1), currentVariation);

                        if (variationMoves.length == 0) {  // an empty variation
                            moves.push("()");
                        } else {
                            for(let k = 0; k < variationMoves.length; k++) {
                                variationMoveString = variationMoves[k];

                                if (k == 0) {
                                    variationMoveString = '(' + (childVariation.isContinuation ? '* ' : '') + variationMoveString;
                                }
                                if (k == variationMoves.length-1) {
                                    variationMoveString = variationMoveString + ')';
                                }

                                moves.push(variationMoveString);
                            }
                        }

                        justFinishedVariation = true;
                    }
                }
            }

            return moves;
        }

        // is there a result?
        const resultHeader = this.header.get('Result');
        if (resultHeader) {
            moves.push(resultHeader);
        }

        // history should be back to what is was before we started generating PGN, so join together moves
        if (options.maxWidth === 0) {
            return result.join('') + moves.join(' ');
        }

        // wrap the PGN output at maxWidth -- TODO, revisit whether you want to linewrap inside a move, e.g. for "1. e4" --> "1.\ne4"
        let currentWidth = 0;
        for (let i = 0; i < moves.length; i++) {
            // if the current move will push past maxWidth
            if (currentWidth + moves[i].length > options.maxWidth && i !== 0) {

                // don't end the line with whitespace
                if (result[result.length - 1] === ' ') {
                    result.pop();
                }

                result.push(options.newlineChar);
                currentWidth = 0;
            } else if (i !== 0) {
                result.push(' ');
                currentWidth++;
            }
            result.push(moves[i]);
            currentWidth += moves[i].length;
        }

        return result.join('');
    }

    createContinuationFromSan(san /* string, e.g. "Rxa7" or "e8=Q#" */) {
        this.eventLog.add(`createContinuationFromSan(${san})`);

        return this.createVariationFromSan(san, true, { shouldLog: false });
    }

    createVariationFromSan(san /* string, e.g. "Rxa7" or "e8=Q#" */, isContinuation, options = {
        shouldLog: true
    }) {
        if (options.shouldLog) {
            this.eventLog.add(`createVariationFromSan(${san}, ${isContinuation})`);
        }

        if (san === null) {
            return false;
        }

        if (isContinuation) {
            if (this.currentVariation.selectedMoveHistoryIndex + 1 < this.currentVariation.moveHistory.length) {
                const move = this.currentVariation.moveHistory[this.currentVariation.selectedMoveHistoryIndex + 1].move;
                if (move.san === san) {
                    return false;  // Continuation not created.  New move already exists as the next move in the current move sequence.
                } else if (san === Move.WILDCARD_MOVE) {
                    return false;  // Continuation not created.  New wildcard move already exists as the next move in the current move sequence.
                }
            }
        } else {
            const move = this.currentVariation.moveHistory[this.currentVariation.selectedMoveHistoryIndex].move;
            if (move.san === san) {
                return false;  // Variation not created.  New move already exists as the next move in the current move sequence.
            } else if (san === Move.WILDCARD_MOVE) {
                return false;  // Continuation not created.  New wildcard move already exists as the next move in the current move sequence.
            }
        }

        let innerVariation = BoardVariation.createFromParentVariation(this.currentVariation, { isContinuation: isContinuation });
        this.boardVariations.push(innerVariation);

        // take the variation we just started, and append it to the list of variations that start from its "parent" move.
        this.currentVariation.moveHistory[ this.currentVariation.selectedMoveHistoryIndex ].childVariations.push(innerVariation);

        // down we go, into our new variation
        this.currentVariation = innerVariation;

        const move = Move.createFromSan(san, this.currentVariation);

        if (!move) {  // requested move isn't possible, so undo our attempt at creating a variation
            this.currentVariation = this.currentVariation.parentVariation;
            this.currentVariation.moveHistory[ this.currentVariation.selectedMoveHistoryIndex ].childVariations.pop();
            this.boardVariations.pop();

            return false;
        }

        this.currentVariation.makeMove(move, this);

        return true;
    }

    history() {
        let moveHistory = [];
        let tempVariation = this.currentVariation;

        for (let i = tempVariation.selectedMoveHistoryIndex; i >= 0; i--) {
            moveHistory.push(tempVariation.moveHistory[i].move.isWildcard ? Move.WILDCARD_MOVE : tempVariation.moveHistory[i].move.san);
        }

        let parentLastMoveIndex = tempVariation.parentLastMoveIndex;
        let isContinuation = tempVariation.isContinuation;
        tempVariation = tempVariation.parentVariation;

        while (tempVariation != null) {
            let i = parentLastMoveIndex;
            if (! isContinuation) {
                i--;
            }

            for (; i >= 0; i--) {
                moveHistory.push(tempVariation.moveHistory[i].isWildcard ? Move.WILDCARD_MOVE : tempVariation.moveHistory[i].move.san);
            }

            parentLastMoveIndex = tempVariation.parentLastMoveIndex;
            isContinuation = tempVariation.isContinuation;
            tempVariation = tempVariation.parentVariation;
        }

        return moveHistory.reverse();
    }

    // ---------------
    // navigation APIs
    // ---------------

    ascendFromCurrentContinuation(options = {
        shouldLog: true
    }) {
        if (options.shouldLog) {
            this.eventLog.add('ascendFromCurrentContinuation()');
        }

        if (this.currentVariation.parentVariation === null) {
            // already at the topmost level;  nothing to do.
            return false;
        }

        // this method differs from ascendFromCurrentVariation only here in this "- 1" offset
        const selectedMoveIndex = this.currentVariation.parentLastMoveIndex - 1;
        this.currentVariation = this.currentVariation.parentVariation;
        this.currentVariation.selectedMoveIndex = selectedMoveIndex;

        return this._selectMove(selectedMoveIndex);
    }

    ascendFromCurrentVariation(options = {
        shouldLog: true
    }) {
        if (options.shouldLog) {
            this.eventLog.add('ascendFromCurrentVariation()');
        }

        if (this.currentVariation.parentVariation === null) {
            // already at the topmost level;  nothing to do.
            return false;
        }

        const selectedMoveIndex = this.currentVariation.parentLastMoveIndex;
        this.currentVariation = this.currentVariation.parentVariation;
        this.currentVariation.selectedMoveIndex = selectedMoveIndex;

        return true;
    }

    next(options = {
        shouldLog: true
    }) {
        return this.currentVariation.next(options);
    }

    prev(options = {
        shouldLog: true
    }) {
        if (options.shouldLog) {
            this.eventLog.add('prev()');
        }

        if (this.currentVariation.selectedMoveHistoryIndex === 0 && this.currentVariation.parentVariation) {
            if (this.ascendFromCurrentContinuation({ shouldLog: false })) {
                return true;
            } else {
                return false;
            }
        } else {
            return this._selectMove(this.currentVariation.selectedMoveHistoryIndex - 1);
        }
    }

    rewindToBeginning() {
        this.eventLog.add('rewindToBeginning()');
        while (this.prev({ shouldLog: false })) {}
    }

    replayToPlyNum(n /* logical ply number, starting from 1 */) {
        return this.currentVariation.replayToPlyNum(n);  // TODO broken method logic;  game-level replay should unwind through multiple childVariations;
        // think:  path from leaf to n ancestors up the tree
    }

    _updateSetup() {
        if (this.currentVariation.moveHistory.length > 0) return;

        const fen = this.currentVariation.toFen();

        if (fen !== Fen.DEFAULT_POSITION) {
            this.header.set('SetUp', '1');
            this.header.set('FEN', fen);
        } else {
            this.header.remove('SetUp');
            this.header.remove('FEN');
        }
    }

    header() {
        return this.header;
    }

    descendIntoContinuation(i = 0 /* defaults to the first variation */) {
        this.eventLog.add('descendIntoContinuation()');

        if (this.currentVariation.moveHistory.length <= 0) {
            return false;
        }

        const currentMoveContext = this.currentVariation.moveHistory[this.currentVariation.selectedMoveHistoryIndex];
        if (currentMoveContext.childVariations.length <= 0) {
            return false;
        }
        if (i < 0 || i > currentMoveContext.childVariations.length - 1) {
            return false;
        }
        if (! currentMoveContext.childVariations[i].isContinuation) {
            return false;
        }

        this.currentVariation = currentMoveContext.childVariations[i];
        this.currentVariation.selectedMoveHistoryIndex = 0;

        return this._selectMove(0);
    }

    descendIntoVariation(i = 0 /* defaults to the first variation */) {
        this.eventLog.add('descendIntoVariation()');

        if (this.currentVariation.moveHistory.length <= 0) {
            return false;
        }

        const currentMoveContext = this.currentVariation.moveHistory[this.currentVariation.selectedMoveHistoryIndex];
        if (currentMoveContext.childVariations.length <= 0) {
            return false;
        }
        if (i < 0 || i > currentMoveContext.childVariations.length - 1) {
            return false;
        }
        if (currentMoveContext.childVariations[i].isContinuation) {
            return false;
        }

        this.currentVariation = currentMoveContext.childVariations[i];
        this.currentVariation.selectedMoveHistoryIndex = 0;

        return this._selectMove(0);
    }

    // --------------------------------------
    // pass-through API methods, alphabetized
    // --------------------------------------

    _selectMove(i, options = {
        shouldLog: false
    }) {
        return this.currentVariation._selectMove(i, options);
    }

    get(square /* string, e.g. 'a1' */) {
        return this.currentVariation.get(square);
    }

    isCheck()                { return this.currentVariation.isCheck();                }
    isCheckmate()            { return this.currentVariation.isCheckmate();            }
    isDraw()                 { return this.currentVariation.isDraw();                 }
    isGameOver()             { return this.currentVariation.isGameOver();             }
    isInsufficientMaterial() { return this.currentVariation.isInsufficientMaterial(); }
    isStalemate()            { return this.currentVariation.isStalemate();            }
    isThreefoldRepetition()  { return this.currentVariation.isThreefoldRepetition();  }

    moves(options = {
        onlyAlgebraicSquares: false,
        onlyDestinationSquares: false,
        onlyForSquare: undefined
    }) {
        return this.currentVariation.moves(options);
    }

    put(piece /* Piece, e.g. Piece.WHITE_ROOK */, square /* string, e.g. 'h8' */) {
        return this.currentVariation.put(piece, square);
    }

    remove(square /* string, e.g. 'a1' */) {
        const piece = this.currentVariation.remove(square);
        this._updateSetup();

        return piece;
    }

    toFen() {
        return this.currentVariation.toFen();
    }
};

module.exports = Game;