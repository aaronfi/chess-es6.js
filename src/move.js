'use strict';

const Color = require('./../src/color');
const PieceType = require('./../src/piece_type');
const Piece = require('./../src/piece');
const Flags = require('./../src/flags');

// TODO 8.17.15 I'm thinking it might make more sense to just add MoveContext and also MoveMetadata
// as member hash variables of this here class

class Move {

    // default constructor
    //
    // every Move object is meant to be full-fledged enough to be usable in all places for all needs.
    constructor(options) {    
        let {
            // required
            from,            // int            -- the 0x88 index for the departure square of this move
            to,              // int            -- the 0x88 index for the destination square of this move  
            movedPiece,      // Piece          -- the piece being moved 
       
            // optional       
            capturedPiece,   // Piece          -- the piece, if any, at the destination square
            promotionPiece,  // Piece          -- the piece being promoted to.
            flags,           // int            -- bitwise flags describing annotative state about this move;  defaults to Flags.NORMAL

            boardVariation   // BoardVariation -- if passed in, then caller is asking us to calculate the given move's SAN notation, e.g. "Rx7#"
        } = options;

        if (! Move.isValidIndex(from) || ! Move.isValidIndex(to)) {
            throw new Error(`illegal 0x88 index passed into new Move(): (from, to) = ${from}, ${to}`);
        }

        if (!flags) {
            flags = Flags.NORMAL;
        }

        if (promotionPiece) {
            flags |= Flags.PROMOTION;
        }

        if (!capturedPiece && flags === Flags.EP_CAPTURE) {
            capturedPiece = movedPiece.color === Color.WHITE ? Piece.BLACK_PAWN : Piece.WHITE_PAWN;
        }

        this.from = from;
        this.to = to;
        this.movedPiece = movedPiece;
        this.capturedPiece = capturedPiece;
        this.flags = flags;
        this.promotionPiece = promotionPiece;
        this.isWildcard = false;

        this.algebraic = Move.SQUARES_LOOKUP[this.from] + "-" +  Move.SQUARES_LOOKUP[this.to];  // e.g. "d2-d4", "h7-h8"

        this.san = boardVariation ? Move.toSan(this, boardVariation) : undefined;
    }

    // copy constructor
    static copyFrom(other /* Move object */) {
        let copy = Object.create(Move.prototype);

        copy.from           = other.from;            // int
        copy.to             = other.to;              // int
        copy.movedPiece     = other.movedPiece;      // Piece, which is a frozen object, so it's safe to reuse
        copy.capturedPiece  = other.capturedPiece;   // Piece, which is a frozen object, so it's safe to reuse
        copy.flags          = other.flags;           // int
        copy.san            = other.san;             // string
        copy.promotionPiece = other.promotionPiece;  // Piece, which is a frozen object, so it's safe to reuse
        copy.isWildcard     = other.isWildcard;      // boolean

        copy.algebraic = other.algebraic;       // debugging move text, e.g. "Ke7-e8"

        return copy;
    }

    // SAN constructor
    static createFromSan(sanText /* string, e.g. "Rxa7" or "e8=Q#" */, boardVariation /* BoardVariation object */) {
        if (!sanText) {
            return false;
        }

        sanText = sanText.trim().replace(/[+#?!=]+$/,'');
        const moves = boardVariation._generateMoves({ calculateSan: true });

        if (sanText === Move.WILDCARD_MOVE) {
            return Move.createWildcardMove(boardVariation);
        } else {
            for (let i = 0, len = moves.length; i < len; i++) {
                // prefix match, so as to ignore move decorations, e.g. "Nf3+?!"
                if (moves[i].san.indexOf(sanText) === 0) {
                    return moves[i];
                }
            }
        }

        return false;
    }

    static createFromAlgebraic(
        from /* e.g. 'a4', 'b3' */,
        to   /* e.g. 'a4', 'b3' */,
        boardVariation /* BoardVariation object */,
        promotionPieceType = PieceType.QUEEN)
    {
        if (!from || !to) {
            return false;
        }

        const indexFrom = Move.SQUARES[from];
        const indexTo = Move.SQUARES[to];

        const moves = boardVariation._generateMoves({ calculateSan: true });
        for (let i = 0, len = moves.length; i < len; i++) {
            // prefix match, so as to ignore move decorations, e.g. "Nf3+?!"
            if (moves[i].from === indexFrom &&
                moves[i].to   === indexTo &&
                (!moves[i].promotionPiece || moves[i].promotionPiece.type === promotionPieceType))
            {
                return moves[i];
            }
        }

        return false;
    }

    // Wildcard Move constructor
    static createWildcardMove(boardVariation /* BoardVariation object */) {
        const moves = boardVariation._generateMoves();
        if (moves.length == 0) {
            return null;
        } else {  // the move doesn't matter, so we just pick the first legal move we found
            let move = moves[0];
            move.isWildcard = true;
            return move;
        }
    }

    toString() {
        return this.san;
    }

    static isValidIndex(i /* an 0x88 board index value */) {
        return (
            (  0 <= i && i <=   7) ||
            ( 16 <= i && i <=  23) ||
            ( 32 <= i && i <=  39) ||
            ( 48 <= i && i <=  55) ||
            ( 64 <= i && i <=  71) ||
            ( 80 <= i && i <=  87) ||
            ( 96 <= i && i <= 103) ||
            (112 <= i && i <= 119)
        );
    }

    // convert an already created Move object from its 0x88 coordinates to Standard Algebraic Notation (SAN)
    static toSan(
        move,  /* Move object */
        boardVariation  /* BoardVariation object */
    ) {
        if (move.isWildcard) {
            return Move.WILDCARD_MOVE;
        }

        let output = '';

        if (move.flags & Flags.KSIDE_CASTLE) {
            output = 'O-O';
        } else if (move.flags & Flags.QSIDE_CASTLE) {
            output = 'O-O-O';
        } else {
            let disambiguator = boardVariation.getDisambiguator(move);

            if (move.movedPiece.type !== PieceType.PAWN) {
                output += move.movedPiece.type.toUpperCase() + disambiguator;
            }

            if (move.flags & (Flags.CAPTURE | Flags.EP_CAPTURE)) {
                if (move.movedPiece.type === PieceType.PAWN) {
                    output += Move._algebraic(move.from)[0];
                }
                output += 'x';
            }

            output += Move._algebraic(move.to);

            if (move.flags & Flags.PROMOTION) {
                output += '=' + move.promotionPiece.type.toUpperCase();
            }
        }

        // TODO this futureMoves logic is duplicated in BoardVariation._generateMoves();
        // might be good candidate for abstraction behind would-be-named MoveHistory object

        // makeMove() below is destructive to all future moves ahead 
        // of our current move pointer, so we save a copy here
        const futureMoves = boardVariation.moveHistory.slice(boardVariation.selectedMoveHistoryIndex+1);

        boardVariation.makeMove(move, null, {}, { updatePositionCount: false, isUserMove: false });
        if (boardVariation.isCheck()) {
            if (boardVariation.isCheckmate()) {
                output += '#';
            } else {
                output += '+';
            }
        }

        boardVariation.undoCurrentMove({ updatePositionCount: false });

        // restore our previously saved future moves
        boardVariation.moveHistory = boardVariation.moveHistory.concat(futureMoves);

        return output;
    }

    // TODO:  duplicated code from BoardVariation.js
    static _algebraic(i) {
        const f = i & 15;
        const r = i >> 4;
        return 'abcdefgh'.substring(f,f+1) + '87654321'.substring(r,r+1);
    }
};

// https://chessprogramming.wikispaces.com/0x88 
// Note:  The values we use are flipped from the documented convention.
// 
//             (octal)                              (decimal)
//
//    | a  b  c  d  e  f  g  h           | a   b   c   d   e   f   g   h
//  ----------------------------       ------------------------------------
//  8 | 00 01 02 03 04 05 06 07        8 | 0   1   2   3   4   5   6   7
//  7 | 10 11 12 13 14 15 16 17        7 | 16  17  18  19  20  21  22  23
//  6 | 20 21 22 23 24 25 26 27        6 | 32  33  34  35  36  37  38  39
//  5 | 30 31 32 33 34 35 36 37        5 | 48  49  50  51  52  53  54  55
//  4 | 40 41 42 43 44 45 46 47   ==   4 | 64  65  66  67  68  69  70  71
//  3 | 50 51 52 53 54 55 56 57        3 | 80  81  82  83  84  85  86  87
//  2 | 60 61 62 63 64 65 66 67        2 | 96  97  98  99  100 101 102 103
//  1 | 70 71 72 73 74 75 76 77        1 | 112 113 114 115 116 117 118 119
//
Move.SQUARES = {
    a8:   0, b8:   1, c8:   2, d8:   3, e8:   4, f8:   5, g8:   6, h8:   7,
    a7:  16, b7:  17, c7:  18, d7:  19, e7:  20, f7:  21, g7:  22, h7:  23,
    a6:  32, b6:  33, c6:  34, d6:  35, e6:  36, f6:  37, g6:  38, h6:  39,
    a5:  48, b5:  49, c5:  50, d5:  51, e5:  52, f5:  53, g5:  54, h5:  55,
    a4:  64, b4:  65, c4:  66, d4:  67, e4:  68, f4:  69, g4:  70, h4:  71,
    a3:  80, b3:  81, c3:  82, d3:  83, e3:  84, f3:  85, g3:  86, h3:  87,
    a2:  96, b2:  97, c2:  98, d2:  99, e2: 100, f2: 101, g2: 102, h2: 103,
    a1: 112, b1: 113, c1: 114, d1: 115, e1: 116, f1: 117, g1: 118, h1: 119
};

Move.SQUARES_LOOKUP = {
      0:  'a8',   1: 'b8',   2: 'c8',   3: 'd8',   4: 'e8',   5: 'f8',   6: 'g8',   7: 'h8',
     16:  'a7',  17: 'b7',  18: 'c7',  19: 'd7',  20: 'e7',  21: 'f7',  22: 'g7',  23: 'h7',
     32:  'a6',  33: 'b6',  34: 'c6',  35: 'd6',  36: 'e6',  37: 'f6',  38: 'g6',  39: 'h6',
     48:  'a5',  49: 'b5',  50: 'c5',  51: 'd5',  52: 'e5',  53: 'f5',  54: 'g5',  55: 'h5',
     64:  'a4',  65: 'b4',  66: 'c4',  67: 'd4',  68: 'e4',  69: 'f4',  70: 'g4',  71: 'h4',
     80:  'a3',  81: 'b3',  82: 'c3',  83: 'd3',  84: 'e3',  85: 'f3',  86: 'g3',  87: 'h3',
     96:  'a2',  97: 'b2',  98: 'c2',  99: 'd2', 100: 'e2', 101: 'f2', 102: 'g2', 103: 'h2',
    112:  'a1', 113: 'b1', 114: 'c1', 115: 'd1', 116: 'e1', 117: 'f1', 118: 'g1', 119: 'h1'
};

Move.PAWN_OFFSETS = {
    [Color.WHITE]: [-16, -32, -17, -15],
    [Color.BLACK]: [ 16,  32,  17,  15]
};

Move.PIECE_OFFSETS = {
    [PieceType.KNIGHT]: [-18, -33, -31, -14,  18, 33, 31, 14],
    [PieceType.BISHOP]: [-17, -15,  17,  15],
    [PieceType.ROOK]:   [-16,   1,  16,  -1],
    [PieceType.QUEEN]:  [-17, -16, -15,   1,  17, 16, 15, -1],
    [PieceType.KING]:   [-17, -16, -15,   1,  17, 16, 15, -1]
};

// Move.{ATTACKS,RAYS,SHIFTS} are only used by BoardVariation.isAttacked(color, square)
Move.ATTACKS = [
    20, 0, 0, 0, 0, 0, 0,24, 0, 0, 0, 0, 0, 0,20, 0,
    0, 20, 0, 0, 0, 0, 0,24, 0, 0, 0, 0, 0,20, 0, 0,
    0,  0,20, 0, 0, 0, 0,24, 0, 0, 0, 0,20, 0, 0, 0,
    0,  0, 0,20, 0, 0, 0,24, 0, 0, 0,20, 0, 0, 0, 0,
    0,  0, 0, 0,20, 0, 0,24, 0, 0,20, 0, 0, 0, 0, 0,
    0,  0, 0, 0, 0,20, 2,24, 2,20, 0, 0, 0, 0, 0, 0,
    0,  0, 0, 0, 0, 2,53,56,53, 2, 0, 0, 0, 0, 0, 0,
    24,24,24,24,24,24,56, 0,56,24,24,24,24,24,24, 0,
    0,  0, 0, 0, 0, 2,53,56,53, 2, 0, 0, 0, 0, 0, 0,
    0,  0, 0, 0, 0,20, 2,24, 2,20, 0, 0, 0, 0, 0, 0,
    0,  0, 0, 0,20, 0, 0,24, 0, 0,20, 0, 0, 0, 0, 0,
    0,  0, 0,20, 0, 0, 0,24, 0, 0, 0,20, 0, 0, 0, 0,
    0,  0,20, 0, 0, 0, 0,24, 0, 0, 0, 0,20, 0, 0, 0,
    0, 20, 0, 0, 0, 0, 0,24, 0, 0, 0, 0, 0,20, 0, 0,
    20 ,0, 0, 0, 0, 0, 0,24, 0, 0, 0, 0, 0, 0,20, 0
];
Move.RAYS = [
    17, 0,  0,  0,  0,  0,  0, 16,  0,  0,  0,  0,  0,  0, 15, 0,
    0, 17,  0,  0,  0,  0,  0, 16,  0,  0,  0,  0,  0, 15,  0, 0,
    0,  0, 17,  0,  0,  0,  0, 16,  0,  0,  0,  0, 15,  0,  0, 0,
    0,  0,  0, 17,  0,  0,  0, 16,  0,  0,  0, 15,  0,  0,  0, 0,
    0,  0,  0,  0, 17,  0,  0, 16,  0,  0, 15,  0,  0,  0,  0, 0,
    0,  0,  0,  0,  0, 17,  0, 16,  0, 15,  0,  0,  0,  0,  0, 0,
    0,  0,  0,  0,  0,  0, 17, 16, 15,  0,  0,  0,  0,  0,  0, 0,
    1,  1,  1,  1,  1,  1,  1,  0, -1, -1,  -1,-1, -1, -1, -1, 0,
    0,  0,  0,  0,  0,  0,-15,-16,-17,  0,  0,  0,  0,  0,  0, 0,
    0,  0,  0,  0,  0,-15,  0,-16,  0,-17,  0,  0,  0,  0,  0, 0,
    0,  0,  0,  0,-15,  0,  0,-16,  0,  0,-17,  0,  0,  0,  0, 0,
    0,  0,  0,-15,  0,  0,  0,-16,  0,  0,  0,-17,  0,  0,  0, 0,
    0,  0,-15,  0,  0,  0,  0,-16,  0,  0,  0,  0,-17,  0,  0, 0,
    0,-15,  0,  0,  0,  0,  0,-16,  0,  0,  0,  0,  0,-17,  0, 0,
    -15,0,  0,  0,  0,  0,  0,-16,  0,  0,  0,  0,  0,  0,-17, 0
];
Move.SHIFTS = { 
    [PieceType.PAWN]:   0, 
    [PieceType.KNIGHT]: 1, 
    [PieceType.BISHOP]: 2, 
    [PieceType.ROOK]:   3, 
    [PieceType.QUEEN]:  4, 
    [PieceType.KING]:   5
};

// technically, this is a NULL move, but I'm slightly deviating from the PGN standard 
// (http://www.enpassant.dk/chess/palview/manual/pgn.htm), because I'm treating a NULL 
// move as essentially a wildcard move:  "any move will do, so just pick the first legal
// move you find".
//
Move.WILDCARD_MOVE = '--';

module.exports = Move;
