'use strict';

const assert = require("assert");

const BoardVariation = require('./../src/board_variation');
const Color = require('./../src/color');
const Flags = require('./../src/flags');
const Move = require('./../src/move');
const Piece = require('./../src/piece');
const PieceType = require('./../src/piece_type');

suite('BoardVariation', () => {
    setup(() => {});

    suite("Threefold Repetition", () => {
        [{
            fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
            moves: ['Nf3', 'Nf6', 'Ng1', 'Ng8', 'Nf3', 'Nf6', 'Ng1', 'Ng8']
        }, {
            fen: '8/pp3p1k/2p2q1p/3r1P2/5R2/7P/P1P1QP2/7K b - - 2 30',        // Fischer - Petrosian, Buenos Aires, 1971
            moves: ['Qe5', 'Qh5', 'Qf6', 'Qe2', 'Re5', 'Qd3', 'Rd5', 'Qe2']
        }].forEach(position => {
                test(position.fen, () => {
                    let passed = true;
                    const variation = BoardVariation.createFromFen(position.fen);

                    for (let j = 0; j < position.moves.length; j++) {
                        if (variation.isThreefoldRepetition()) {
                            passed = false;
                            break;
                        }

                        variation.makeMoveFromSan(position.moves[j]);
                    }

                    assert(passed && variation.isThreefoldRepetition() && variation.isDraw());
                });
            });
    });

    suite("Single Square Move Generation", () => {
        let i = 1;
        [
            {fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', square: 'e2', moves: ['e3', 'e4']},
            {fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', square: 'e9', moves: []}, // invalid square
            {fen: 'rnbqk1nr/pppp1ppp/4p3/8/1b1P4/2N5/PPP1PPPP/R1BQKBNR w KQkq - 2 3', square: 'c3', moves: []}, // pinned piece
            {fen: '8/k7/8/8/8/8/7p/K7 b - - 0 1', square: 'h2', moves: ['h1=Q+', 'h1=R+', 'h1=B', 'h1=N']},  // promotion
            {
                fen: 'r1bq1rk1/1pp2ppp/p1np1n2/2b1p3/2B1P3/2NP1N2/PPPBQPPP/R3K2R w KQ - 0 8',
                square: 'e1',
                moves: ['Kf1', 'Kd1', 'O-O', 'O-O-O']
            },  // castling
            {
                fen: 'r1bq1rk1/1pp2ppp/p1np1n2/2b1p3/2B1P3/2NP1N2/PPPBQPPP/R3K2R w - - 0 8',
                square: 'e1',
                moves: ['Kf1', 'Kd1']
            },  // no castling
            {fen: '8/7K/8/8/1R6/k7/1R1p4/8 b - - 0 1', square: 'a3', moves: []},  // trapped king
            {fen: 'rnbqk2r/ppp1pp1p/5n1b/3p2pQ/1P2P3/B1N5/P1PP1PPP/R3KBNR b KQkq - 3 5', square: 'f1', moves: []},
            {fen: '5k1K/8/8/8/8/8/8/8 w - - 0 1', square: 'h8', moves: ['Kh7']}  // simple
        ].forEach(position => {
                test(i++, () => {
                    const variation = BoardVariation.createFromFen(position.fen);
                    const moves = variation._generateMoves({onlyForSquare: position.square, calculateSan: true}).map(x => x.san);

                    let passed = position.moves.length == moves.length;

                    for (let j = 0; j < moves.length; j++) {
                        passed = passed && moves[j] === position.moves[j];
                    }
                    assert(passed, "generated moves were " + moves + " instead of expected " + position.moves);
                });
            });
    });

    suite("Checkmate", () => {
        let i = 1;
        [
            '8/5r2/4K1q1/4p3/3k4/8/8/8 w - - 0 7',
            '4r2r/p6p/1pnN2p1/kQp5/3pPq2/3P4/PPP3PP/R5K1 b - - 0 2',
            'r3k2r/ppp2p1p/2n1p1p1/8/2B2P1q/2NPb1n1/PP4PP/R2Q3K w kq - 0 8',
            '8/6R1/pp1r3p/6p1/P3R1Pk/1P4P1/7K/8 b - - 0 4'
        ].forEach(fen => {
                test(i++, () => assert(BoardVariation.createFromFen(fen).isCheckmate()));
            });
    });

    suite("Stalemate", () => {
        let i = 1;
        [
            '1R6/8/8/8/8/8/7R/k6K b - - 0 1',
            '8/8/5k2/p4p1p/P4K1P/1r6/8/8 w - - 0 2',
        ].forEach(fen => {
                test(i++, () => assert(BoardVariation.createFromFen(fen).isStalemate()));
            });
    });

    suite("Insufficient Material", () => {
        let i = 1;
        [
            {fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', draw: false},
            {fen: '8/8/8/8/8/8/8/k6K w - - 0 1', draw: true},
            {fen: '8/2p5/8/8/8/8/8/k6K w - - 0 1', draw: false},
            {fen: '8/2N5/8/8/8/8/8/k6K w - - 0 1', draw: true},
            {fen: '8/2b5/8/8/8/8/8/k6K w - - 0 1', draw: true},
            {fen: '8/b7/3B4/8/8/8/8/k6K w - - 0 1', draw: true},
            {fen: '8/b7/B7/8/8/8/8/k6K w - - 0 1', draw: false},
            {fen: '8/b1B1b1B1/1b1B1b1B/8/8/8/8/1k5K w - - 0 1', draw: true},
            {fen: '8/bB2b1B1/1b1B1b1B/8/8/8/8/1k5K w - - 0 1', draw: false}
        ].forEach(position => {
                test(i++, () => {
                    let variation = BoardVariation.createFromFen(position.fen);

                    if (position.draw) {
                        assert(variation.isInsufficientMaterial() && variation.isDraw());
                    } else {
                        assert(!variation.isInsufficientMaterial() && !variation.isInsufficientMaterial());
                    }
                });
            });
    });

    suite("FEN", () => {
        [
            { fen: '8/8/8/8/8/8/8/8 w - - 0 1',                                   shouldPass: true  },
            { fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',    shouldPass: true  },
            { fen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1', shouldPass: true  },
            { fen: '1nbqkbn1/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/1NBQKBN1 b - - 1 2',   shouldPass: true  },
            { fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBN w KQkq - 0 1',     shouldPass: false },  // incomplete FEN string
            { fen: 'rnbqkbnr/pppppppp/9/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',    shouldPass: false },  // bad digit (9)
            { fen: '1nbqkbn1/pppp1ppX/8/4p3/4P3/8/PPPP1PPP/1NBQKBN1 b - - 1 2',   shouldPass: false }   // bad piece (X)
        ].forEach(position => {
                test(position.fen + ' (' + position.shouldPass + ')', () => {
                    const variation = BoardVariation.createFromFen(position.fen);

                    if (variation) {
                        assert(variation.toFen() == position.fen);
                    } else {
                        assert(!position.shouldPass);
                    }
                });
            });
    });

    suite("Algebraic Notation", () => {
        [
            { fen: '7k/3R4/3p2Q1/6Q1/2N1N3/8/8/3R3K w - - 0 1',                              // this position...
              moves: [ 'Rd8#', 'Re7', 'Rf7', 'Rg7', 'Rh7#', 'R7xd6', 'Rc7', 'Rb7', 'Ra7',    // ...should produce this list of moves via _generateMoves()
                       'Qf7', 'Qe8#', 'Qg7#', 'Qg8#', 'Qh7#', 'Q6h6#', 'Q6h5#', 'Q6f5',
                       'Q6f6#', 'Qe6', 'Qxd6', 'Q5f6#', 'Qe7', 'Qd8#', 'Q5h6#', 'Q5h5#',
                       'Qh4#', 'Qg4', 'Qg3', 'Qg2', 'Qg1', 'Qf4', 'Qe3', 'Qd2', 'Qc1',
                       'Q5f5', 'Qe5+', 'Qd5', 'Qc5', 'Qb5', 'Qa5', 'Na5', 'Nb6', 'Ncxd6',
                       'Ne5', 'Ne3', 'Ncd2', 'Nb2', 'Na3', 'Nc5', 'Nexd6', 'Nf6', 'Ng3',
                       'Nf2', 'Ned2', 'Nc3', 'Rd2', 'Rd3', 'Rd4', 'Rd5', 'R1xd6', 'Re1',
                       'Rf1', 'Rg1', 'Rc1', 'Rb1', 'Ra1', 'Kg2', 'Kh2', 'Kg1' ]},
            { fen: '1r3k2/P1P5/8/8/8/8/8/R3K2R w KQ - 0 1',
              moves: [ 'a8=Q', 'a8=R', 'a8=B', 'a8=N', 'axb8=Q+', 'axb8=R+', 'axb8=B',
                       'axb8=N', 'c8=Q+', 'c8=R+', 'c8=B', 'c8=N', 'cxb8=Q+', 'cxb8=R+',
                       'cxb8=B', 'cxb8=N', 'Ra2', 'Ra3', 'Ra4', 'Ra5', 'Ra6', 'Rb1',
                       'Rc1', 'Rd1', 'Kd2', 'Ke2', 'Kf2', 'Kf1', 'Kd1', 'Rh2', 'Rh3',
                       'Rh4', 'Rh5', 'Rh6', 'Rh7', 'Rh8+', 'Rg1', 'Rf1+', 'O-O+',
                       'O-O-O' ]},
            { fen: '5rk1/8/8/8/8/8/2p5/R3K2R w KQ - 0 1',
              moves: [ 'Ra2', 'Ra3', 'Ra4', 'Ra5', 'Ra6', 'Ra7', 'Ra8', 'Rb1', 'Rc1',
                       'Rd1', 'Kd2', 'Ke2', 'Rh2', 'Rh3', 'Rh4', 'Rh5', 'Rh6', 'Rh7',
                       'Rh8+', 'Rg1+', 'Rf1' ]},
            { fen: '5rk1/8/8/8/8/8/2p5/R3K2R b KQ - 0 1',
              moves: [ 'Rf7', 'Rf6', 'Rf5', 'Rf4', 'Rf3', 'Rf2', 'Rf1+', 'Re8+', 'Rd8',
                       'Rc8', 'Rb8', 'Ra8', 'Kg7', 'Kf7', 'c1=Q+', 'c1=R+', 'c1=B',
                       'c1=N' ]},
            { fen: 'r3k2r/p2pqpb1/1n2pnp1/2pPN3/1p2P3/2N2Q1p/PPPB1PPP/R3K2R w KQkq c6 0 2',
              moves: [ 'gxh3', 'Qxf6', 'Qxh3', 'Nxd7', 'Nxf7', 'Nxg6', 'dxc6', 'dxe6',
                       'Rg1', 'Rf1', 'Ke2', 'Kf1', 'Kd1', 'Rb1', 'Rc1', 'Rd1', 'g3',
                       'g4', 'Be3', 'Bf4', 'Bg5', 'Bh6', 'Bc1', 'b3', 'a3', 'a4', 'Qf4',
                       'Qf5', 'Qg4', 'Qh5', 'Qg3', 'Qe2', 'Qd1', 'Qe3', 'Qd3', 'Na4',
                       'Nb5', 'Ne2', 'Nd1', 'Nb1', 'Nc6', 'Ng4', 'Nd3', 'Nc4', 'd6',
                       'O-O', 'O-O-O' ]},
            { fen: 'k7/8/K7/8/3n3n/5R2/3n4/8 b - - 0 1',
              moves: [ 'N2xf3', 'Nhxf3', 'Nd4xf3', 'N2b3', 'Nc4', 'Ne4', 'Nf1', 'Nb1',
                       'Nhf5', 'Ng6', 'Ng2', 'Nb5', 'Nc6', 'Ne6', 'Ndf5', 'Ne2', 'Nc2',
                       'N4b3', 'Kb8' ]},
        ].forEach(position => {
            const variation = BoardVariation.createFromFen(position.fen);
            let passed = true;

            test(position.fen, () => {
                const moves = variation._generateMoves({ calculateSan: true });
                if (moves.length != position.moves.length) {
                    passed = false;
                } else {
                    for (let j = 0; j < moves.length; j++) {
                        if (position.moves.indexOf(moves[j].san) === -1) {
                            passed = false;
                            break;
                        }
                    }
                }
                assert(passed);
            });
        });
    });

    suite("Get/Put/Remove", () => {
        [
            { pieces: {
                a7: Piece.WHITE_PAWN,
                b7: Piece.BLACK_PAWN,
                c7: Piece.WHITE_KNIGHT,
                d7: Piece.BLACK_KNIGHT,
                e7: Piece.WHITE_BISHOP,
                f7: Piece.BLACK_BISHOP,
                g7: Piece.WHITE_ROOK,
                h7: Piece.BLACK_ROOK,
                a6: Piece.WHITE_QUEEN,
                b6: Piece.BLACK_QUEEN,
                a4: Piece.WHITE_KING,
                h4: Piece.BLACK_KING },
              shouldPass: true },
            { pieces: {
                a7: new Object() },      // bad piece
                shouldPass: false },
            { pieces: {
                j4: Piece.WHITE_PAWN },  // bad square
                shouldPass: false },
            { pieces: {
                a7: Piece.BLACK_KING,
                h2: Piece.WHITE_KING,
                a8: Piece.BLACK_KING },  // disallow two kings (black)
                shouldPass: false },
            { pieces: {
                a7: Piece.BLACK_KING,
                h2: Piece.WHITE_KING,
                h1: Piece.WHITE_KING },  // disallow two kings (white)
                shouldPass: false }
        ].forEach(position => {
            test("position should " + (position.shouldPass ? "" : "not ") + "pass", () => {
                let variation = new BoardVariation();
                let passed = true;

                // places the pieces
                for (let square in position.pieces) {
                    passed &= variation.put(position.pieces[square], square);
                }

                // iterate over every square to make sure get returns the proper piece values/color
                Object.keys(Move.SQUARES).forEach(square => {
                    const piece = variation.get(square);

                    if (square in position.pieces) {
                        if (position.pieces[square] !== piece) {
                            passed = false;
                        }
                    } else {
                        if (piece !== Piece.NONE) {
                            passed = false;
                        }
                    }
                });

                if (passed) {
                    // remove the pieces
                    Object.keys(Move.SQUARES).forEach(square => {
                        const piece = variation.remove(square);

                        if (square in position.pieces) {
                            if (position.pieces[square] !== piece) {
                                passed = false;
                            }
                        } else {
                            if (piece !== Piece.NONE) {
                                passed = false;
                            }
                        }
                    });

                    assert(variation.toFen() === "8/8/8/8/8/8/8/8 w - - 0 1", "Board should be empty after having removed all previously placed pieces.");
                }

                assert(passed == position.shouldPass);
            });
        });

        // allow two kings if overwriting the exact same square
        test("position should pass", () => {
            let variation = new BoardVariation();
            let passed =
                variation.put(Piece.BLACK_KING, 'a7')
                && variation.put(Piece.WHITE_KING, 'h2')
                && variation.put(Piece.WHITE_KING, 'h2');  // duplicate placement is intentional

            // iterate over every square to make sure get returns the proper piece values/color
            for(let square in Move.SQUARES) {
                const piece = variation.get(square);

                if (square === 'a7' && piece !== Piece.BLACK_KING) {
                    passed = false;
                } else if (square === 'h2' && piece !== Piece.WHITE_KING) {
                    passed = false;
                } else if (square !== 'a7' && square !== 'h2' && piece !== Piece.NONE) {
                    passed = false;
                }
            }

            if (passed) {
                // remove the pieces
                for(let square in Move.SQUARES) {
                    const piece = variation.remove(square);

                    if (square === 'a7' && piece !== Piece.BLACK_KING) {
                        passed = false;
                    } else if (square === 'h2' && piece !== Piece.WHITE_KING) {
                        passed = false;
                    } else if (square !== 'a7' && square !== 'h2' && piece !== Piece.NONE) {
                        passed = false;
                    }
                };

                assert.equal(variation.toFen(), "8/8/8/8/8/8/8/8 w - - 0 1", "Board should be empty after having removed all previously placed pieces.");
            }

            assert(passed);
        });
    });

    // test('#copyFrom', () => {
    // TODO be anal retentive and mutate/test every property member
    //     var variation = new BoardVariation();
    //     variation.put(Piece.WHITE_ROOK, 'a1');

    //     var copy = BoardVariation.copyFrom(variation);
    //     variation.put(Piece.BLACK_ROOK, 'a1');

    //    // console.log(variation);

    //     assert(variation.board[112] !== copy.board[112]);
    // });

    test('#_applyMove', () => {
        // lots of logic to test here;  refer to #_applyMove()'s internals...'
    });

    // test('#loadFen', () => {
    //     //BoardVariation.createEmpty();
    //     //BoardVariation.createFrom(fen);
    //     //BoardVariation.createFrom(variation);

    //     var variation = new BoardVariation();
    //     variation.loadFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
    //    // console.log(variation);
    // });

     test('#makeMove - single Move object', () => {
         const variation = new BoardVariation();

         const fen = '3k2r1/7P/8/8/8/8/8/3K4 w - - 0 1';
         variation.loadFen(fen);

         variation.makeMove(new Move({
             from: Move.SQUARES.d1,
             to: Move.SQUARES.d2,
             movedPiece: Piece.WHITE_KING
         }));
         variation.undoCurrentMove();

         assert.equal(fen, variation.toFen(), "board did not return to starting position after making and undoing a single move");
     });

    test('#makeMove - attempt every single legal move', () => {
        const variation = new BoardVariation();

        const fen = '3k2r1/7P/8/8/8/8/8/3K4 w - - 0 1';
        variation.loadFen(fen);

        variation._generateMoves().forEach(move => {
            variation.makeMove(move);
            variation.undoCurrentMove();
            assert.equal(fen, variation.toFen(), "board did not return to starting position after making and undoing a single move");
        });
    });
});
