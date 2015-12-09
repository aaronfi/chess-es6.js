'use strict';

const assert = require('assert');

const Color = require('./../src/color');
const Flags = require('./../src/flags');
const Move = require('./../src/move');
const Piece = require('./../src/piece');
const PieceType = require('./../src/piece_type');

suite('Move', () => {
    test('#copyFrom', () => {
        const move = new Move({
            from: 1,
            to: 2,
            movedPiece: Piece.WHITE_PAWN,
            capturedPiece: Piece.BLACK_QUEEN,
            flags: Flags.NORMAL,

            san: "axb8=Q",
            promotionPiece: Piece.WHITE_QUEEN,
        });

        const copy = Move.copyFrom(move);

        assert(move.from === copy.from);
        assert(move.to === copy.to);
        assert(move.movedPiece === copy.movedPiece);
        assert(move.capturedPiece === copy.capturedPiece);
        assert(move.flags === copy.flags);
        assert(move.san === copy.san);
        assert(move.promotionPiece === copy.promotionPiece);
        assert(move.isWildcard === copy.isWildcard);

        copy.from = 3;
        copy.to = 4;
        copy.movedPiece = Piece.WHITE_BISHOP;
        copy.capturedPiece = null;
        copy.flags = Flags.CAPTURE;
        copy.san = "Rxa7";
        copy.promotionPiece = null;

        assert(move.from !== copy.from);
        assert(move.to !== copy.to);
        assert(move.movedPiece !== copy.movedPiece);
        assert(move.capturedPiece !== copy.capturedPiece);
        assert(move.flags !== copy.flags);
        assert(move.san !== copy.san);
        assert(move.promotionPiece !== copy.promotionPiece);
    });
});

// TODO more unit tests for Move class?
