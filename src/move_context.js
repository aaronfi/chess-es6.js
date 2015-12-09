'use strict';

const Color = require('./../src/color');

class MoveContext {

    // default constructor
    constructor(options) {
        this.move = options.move;  // Move object from move.js

        this.castlingEligibility = { 
            [Color.WHITE]: options.castlingEligibility[Color.WHITE],
            [Color.BLACK]: options.castlingEligibility[Color.BLACK]
        };
        this.kings = { 
            [Color.WHITE]: options.kings[Color.WHITE],
            [Color.BLACK]: options.kings[Color.BLACK]
        };

        this.turn = options.turn;
        this.enPassantSquare = options.enPassantSquare;

        this.moveNumber = options.moveNumber;
        this.halfMoves = options.halfMoves;
        this.plyCount = options.plyCount;

        this.metadata = options.metadata;

        // TODO these original members are now, or should be!, in this.metadata
        // this.timeTakenToMove = options.timeTakenToMove;
        // this.comment = options.comment;
        // this.isPuzzleSolution = options.isPuzzleSolution;

        this.childVariations = [];
    }

    toString() {
        return this.move.algebraic;
    }

    // for more succinct console.log() output
    inspect() {
        return this.toString();
    }

};

module.exports = MoveContext;
