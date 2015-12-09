'use strict';

const Color = require('./../src/color');
const PieceType = require('./../src/piece_type');

class Piece {
    constructor(options) {
        this.type = options.type;    // PieceType -- the type of piece, e.g. PAWN, KNIGHT, ROOK
        this.color = options.color;  // Color     -- WHITE or BLACK

        this.symbol = this.color === Color.WHITE ? this.type.toUpperCase() : this.type;

        Object.freeze(this);  // immutability == sanity safeguard
    }

    toString() {
        return this.symbol;
    }

    // for more succinct console.log() output
    inspect() {
        return this.toString();
    }

    static forSymbol(symbol) {
        return Piece.LOOKUP[symbol];
    }
};

// set up our pool of reusable pieces;  http://en.wikipedia.org/wiki/Flyweight_pattern
Piece.WHITE_PAWN   = new Piece({ color: Color.WHITE, type: PieceType.PAWN   });
Piece.WHITE_KNIGHT = new Piece({ color: Color.WHITE, type: PieceType.KNIGHT });
Piece.WHITE_BISHOP = new Piece({ color: Color.WHITE, type: PieceType.BISHOP });
Piece.WHITE_ROOK   = new Piece({ color: Color.WHITE, type: PieceType.ROOK   });
Piece.WHITE_QUEEN  = new Piece({ color: Color.WHITE, type: PieceType.QUEEN  });
Piece.WHITE_KING   = new Piece({ color: Color.WHITE, type: PieceType.KING   });
Piece.BLACK_PAWN   = new Piece({ color: Color.BLACK, type: PieceType.PAWN   });
Piece.BLACK_KNIGHT = new Piece({ color: Color.BLACK, type: PieceType.KNIGHT });
Piece.BLACK_BISHOP = new Piece({ color: Color.BLACK, type: PieceType.BISHOP });
Piece.BLACK_ROOK   = new Piece({ color: Color.BLACK, type: PieceType.ROOK   });
Piece.BLACK_QUEEN  = new Piece({ color: Color.BLACK, type: PieceType.QUEEN  });
Piece.BLACK_KING   = new Piece({ color: Color.BLACK, type: PieceType.KING   });
Piece.NONE         = new Piece({ color: Color.NONE,  type: PieceType.NONE   });
Piece.LOOKUP = {
    [ Piece.WHITE_PAWN   ]: Piece.WHITE_PAWN,
    [ Piece.WHITE_KNIGHT ]: Piece.WHITE_KNIGHT,
    [ Piece.WHITE_BISHOP ]: Piece.WHITE_BISHOP,
    [ Piece.WHITE_ROOK   ]: Piece.WHITE_ROOK,
    [ Piece.WHITE_QUEEN  ]: Piece.WHITE_QUEEN,
    [ Piece.WHITE_KING   ]: Piece.WHITE_KING,
    [ Piece.BLACK_PAWN   ]: Piece.BLACK_PAWN,
    [ Piece.BLACK_KNIGHT ]: Piece.BLACK_KNIGHT,
    [ Piece.BLACK_BISHOP ]: Piece.BLACK_BISHOP,
    [ Piece.BLACK_ROOK   ]: Piece.BLACK_ROOK,
    [ Piece.BLACK_QUEEN  ]: Piece.BLACK_QUEEN,
    [ Piece.BLACK_KING   ]: Piece.BLACK_KING,
    [ Piece.NONE         ]: Piece.NONE
};

// TODO(aaron, 2015.11.17) consider relaxing this to include enemy pieces, in order to support that edge-case "promote to an enemy piece for a mate-in-1" puzzle from Sherlock Holmes Chess Mysteries book
Piece.WHITE_PROMOTION_PIECES = [
    Piece.WHITE_QUEEN,
    Piece.WHITE_ROOK,
    Piece.WHITE_BISHOP,
    Piece.WHITE_KNIGHT
];
Piece.BLACK_PROMOTION_PIECES = [
    Piece.BLACK_QUEEN,
    Piece.BLACK_ROOK,
    Piece.BLACK_BISHOP,
    Piece.BLACK_KNIGHT
];

module.exports = Piece;