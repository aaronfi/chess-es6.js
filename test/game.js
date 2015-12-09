'use strict';

const assert = require("assert");

const Game = require('./../src/game');

suite("Variations", () => {
    test("#createFromParentVariation", () => {
        const fen = '3k2r1/7P/8/8/8/8/8/3K4 w - - 0 1';
        const game = new Game(fen);

        game.makeMoveFromSan('Kd2');
        game.makeMoveFromSan('Kd7');
        game.prev();
        game.makeMoveFromSan('Rg1');
        game.makeMoveFromSan('h8=Q');
    });

    test("continuations and traversal", () => {
        const game = new Game();

        game.makeMoveFromSan('e4');
        game.makeMoveFromSan('e5');
        game.makeMoveFromSan('a4');
        game.makeMoveFromSan('a6');
        game.createContinuationFromSan('Ra2');
        game.ascendFromCurrentVariation();
        game.makeMoveFromSan('Ra2');

        assert.equal(game.toPgn(), "1. e4 e5 2. a4 a6 (* 3. Ra2)");
    });
});

suite("Move Traversal", () => {
    test("make 4 moves, then rewind to beginning", () => {
        const startingFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
        const game = new Game(startingFen);

        game.makeMoveFromSan('e4');
        game.makeMoveFromSan('e5');
        game.makeMoveFromSan('d4');
        game.makeMoveFromSan('d5');

        game.replayToPlyNum(0);

        assert.equal(startingFen, game.toFen(), "board failed to rewind back to its starting position");
    });

    test("make 4 moves, rewind to beginning, then to end again ", () => {
        const startingFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
        const endingFen = 'rnbqkbnr/ppp2ppp/8/3pp3/3PP3/8/PPP2PPP/RNBQKBNR w KQkq d6 0 3';

        const game = new Game(startingFen);

        game.makeMoveFromSan('e4');
        game.makeMoveFromSan('e5');
        game.makeMoveFromSan('d4');
        game.makeMoveFromSan('d5');

        assert.equal(endingFen, game.toFen(), "final board position was not as expected");

        game.replayToPlyNum(0);

        assert.equal(startingFen, game.toFen(), "board failed to rewind back to its starting position");

        game.replayToPlyNum(4);

        assert.equal(endingFen, game.toFen(), "board failed to advance to its ending position again");
    });
});