'use strict';

const assert = require("assert");

const Chess = require('./../src/chess');
const Color = require('./../src/color');
const Flags = require('./../src/flags');
const Move = require('./../src/move');
const Piece = require('./../src/piece');
const PieceType = require('./../src/piece_type');

suite("PGN", () => {
    let chess;

    before(() => {
        chess = new Chess();
    })

    beforeEach(() => {
        chess.reset();
    })

    suite("#loadPgn()", () => {
        [{
            // regression test - broken PGN parser ended up with this:
            // fen = rnbqk2r/pp1p1ppp/4pn2/1N6/1bPN4/8/PP2PPPP/R1BQKB1R b KQkq - 2 6

            pgn: ['1. d4 Nf6 2. c4 e6 3. Nf3 c5 4. Nc3 cxd4 5. Nxd4 Bb4 6. Nb5'],
            fen: 'rnbqk2r/pp1p1ppp/4pn2/1N6/1bP5/2N5/PP2PPPP/R1BQKB1R b KQkq - 2 6'
        }, {
            pgn: [
                '[Event "Reykjavik WCh"]',
                '[Site "Reykjavik WCh"]',
                '[Date "1972.01.07"]',
                '[EventDate "?"]',
                '[Round "6"]',
                '[Result "1-0"]',
                '[White "Robert James Fischer"]',
                '[Black "Boris Spassky"]',
                '[ECO "D59"]',
                '[WhiteElo "?"]',
                '[BlackElo "?"]',
                '[PlyCount "81"]',
                '',
                '1. c4 e6 2. Nf3 d5 3. d4 Nf6 4. Nc3 Be7 5. Bg5 O-O 6. e3 h6 7. Bh4',
                'b6 8. cxd5 Nxd5 9. Bxe7 Qxe7 10. Nxd5 exd5 11. Rc1 Be6 12. Qa4 c5',
                '13. Qa3 Rc8 14. Bb5 a6 15. dxc5 bxc5 16. O-O Ra7 17. Be2 Nd7 18.',
                'Nd4 Qf8 19. Nxe6 fxe6 20. e4 d4 21. f4 Qe7 22. e5 Rb8 23. Bc4 Kh8',
                '24. Qh3 Nf8 25. b3 a5 26. f5 exf5 27. Rxf5 Nh7 28. Rcf1 Qd8 29.',
                'Qg3 Re7 30. h4 Rbb7 31. e6 Rbc7 32. Qe5 Qe8 33. a4 Qd8 34. R1f2',
                'Qe8 35. R2f3 Qd8 36. Bd3 Qe8 37. Qe4 Nf6 38. Rxf6 gxf6 39. Rxf6',
                'Kg8 40. Bc4 Kh8 41. Qf4 1-0']
        }, {
            fen: '1n1Rkb1r/p4ppp/4q3/4p1B1/4P3/8/PPP2PPP/2K5 b k - 1 17',
            pgn: [
                '[Event "Paris"]',
                '[Site "Paris"]',
                '[Date "1858.??.??"]',
                '[EventDate "?"]',
                '[Round "?"]',
                '[Result "1-0"]',
                '[White "Paul Morphy"]',
                '[Black "Duke Karl / Count Isouard"]',
                '[ECO "C41"]',
                '[WhiteElo "?"]',
                '[BlackElo "?"]',
                '[PlyCount "33"]',
                '',
                '1.e4 e5 2.Nf3 d6 3.d4 Bg4 {This is a weak move',
                'already.--Fischer} 4.dxe5 Bxf3 5.Qxf3 dxe5 6.Bc4 Nf6 7.Qb3 Qe7',
                '8.Nc3 c6 9.Bg5 {Black is in what\'s like a zugzwang position',
                'here. He can\'t develop the [Queen\'s] knight because the pawn',
                'is hanging, the bishop is blocked because of the',
                'Queen.--Fischer} b5 10.Nxb5 cxb5 11.Bxb5+ Nbd7 12.O-O-O Rd8',
                '13.Rxd7 Rxd7 14.Rd1 Qe6 15.Bxd7+ Nxd7 16.Qb8+ Nxb8 17.Rd8# 1-0']
        }, {
            pgn: [
                '1. e4 e5 2. f4 exf4 3. Nf3 g5 4. h4 g4 5. Ne5 Nf6 6. Nxg4 Nxe4 7.',
                'd3 Ng3 8. Bxf4 Nxh1 9. Qe2+ Qe7 10. Nf6+ Kd8 11. Bxc7+ Kxc7 12.',
                'Nd5+ Kd8 13. Nxe7 Bxe7 14. Qg4 d6 15. Qf4 Rg8 16. Qxf7 Bxh4+ 17.',
                'Kd2 Re8 18. Na3 Na6 19. Qh5 Bf6 20. Qxh1 Bxb2 21. Qh4+ Kd7 22. Rb1',
                'Bxa3 23. Qa4+']
        }, {
            fen: 'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 2',
            pgn: [ '1. e4 ( 1. d4 { Queen\'s pawn } d5 ( 1... Nf6 ) ) e5' ]
        }, {
            fen: 'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 2',
            pgn: [ '1. e4 { King\'s pawn } ( 1. d4 ) 1... e5' ]
        }, {
            pgn: [
                '[Event "Testing advanced variations: nesting and siblings"]',
                '[Round "4"]',
                '',
                '1. d4 (1. c4 (1. b4 (1. a4 a5) 1... b5) 1... c5) (1. e4 (1. f4 (1.',
                'g4 (1. h4 h5) 1... g5) 1... f5) 1... e5) 1... d5 (1... c5 (1... b5',
                '(1... a5))) (1... e5 (1... f5 (1... g5 2. g3) 2. f3) 2. e3) 2. e3',
                '(2. f3 f6) (2. g3 g6) (2. h3 h6) 2... e6']
        }, {
            fen: 'rnbqkb1r/ppp1pppp/5n2/8/2pP4/5N2/PP2PPPP/RNBQKB1R w KQkq - 2 4',
            pgn: [
                '[Event "Testing continuations"]',
                '[Round "9"]',
                '[SetUp "1"]',
                '[FEN "rnbqkbnr/ppp1pppp/8/3p4/3P4/8/PPP1PPPP/RNBQKBNR w KQkq d6 0 2"]',
                '',
                '2. c4 dxc4 (* 3. e4 e5) 3. Nf3 Nf6',
                '(* 4. e3 Bg4) (3... b5 4. a4)']
        }, {
            pgn: [
                '[Event "4th London Chess Classic"]',
                '[Site "London ENG"]',
                '[Date "2012.12.04"]',
                '[Round "4.1"]',
                '[White "Carlsen,M"]',
                '[Black "Jones,G"]',
                '[Result "1-0"]',
                '[WhiteTitle "GM"]',
                '[BlackTitle "GM"]',
                '[WhiteElo "2848"]',
                '[BlackElo "2644"]',
                '[ECO "B53"]',
                '[Opening "Sicilian, Chekhover variation"]',
                '[WhiteFideId "1503014"]',
                '[BlackFideId "409561"]',
                '[EventDate "2012.12.01"]',
                '',
                '1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Qxd4 a6 5. h3 Nc6 6. Qe3 g6 7. c4',
                'Bg7 8. Be2 Nf6 9. Nc3 O-O 10. O-O Nd7 11. Rb1 a5 12. b3 Nc5 13.',
                'Bb2 f5 14. exf5 Bxf5 15. Rbd1 a4 16. Ba3 Qa5 17. Nb5 axb3 18. axb3',
                'Qxa3 19. Nxa3 Rxa3 20. Nd2 Bd4 21. Qg3 Be5 22. f4 Bf6 23. Bg4 Nd4',
                '24. Kh1 Bc2 25. Rde1 Kh8 26. Re3 h5 27. b4 h4 28. Qf2 Nd3 29. Qg1',
                'Nf5 30. Bxf5 gxf5 31. Nf3 Rc3 32. c5 Bb3 33. Ne1 Bd4 34. Nxd3 dxc5',
                '35. Qf2 Rf7 36. Rc1 cxb4 37. Rxc3 bxc3 38. Qe1 1-0'
            ]
                // TODO eventually add your ./test_games_to_validate.pgn
        }, {
            pgn: [
                '1. d4 d5 2. c4 dxc4 (* 3. e4 e5 { this is a continuation }) 3. Nf3',
                'Nf6 (* 4. e3 Bg4 { another continuation }) (3... b5 4. a4',
                '{this is a variation})'
            ]
        }, {
            pgn: [ "1. e4 (1. d4 { Queen\'s pawn } d5 ({ })) 1... e5" ]
        }].forEach((testCase, i) => {
            test(i + String.fromCharCode(97 + i), () => {
                const newlineChar = '\n';

                const result = chess.loadPgn(testCase.pgn.join(newlineChar), { newlineChar: newlineChar });

                // some PGN's tests contain comments which are stripped during parsing,
                // so we'll need compare the results of the load against a FEN string

                assert(result, "loadPgn() method failed to parse.");

                if ('fen' in testCase) {
                    let outcomeFen = chess.toFen();
                    assert.equal(testCase.fen, outcomeFen);
                } else {
                    let outcomePgn = chess.toPgn({ maxWidth: 65, newlineChar: newlineChar });
                    let expectedPgn = testCase.pgn.join(newlineChar);
                    assert.equal(expectedPgn, outcomePgn);
                }
            });
        });

        test("many nested variations", () => {
            const pgn = '1. d4 (1. c4 (1. b4 (1. a4 a5) 1... b5) 1... c5) (1. e4 (1. f4 (1. g4 (1. h4 h5) 1... g5) 1... f5) 1... e5) 1... d5 (1... c5 (1... b5 (1... a5))) (1... e5 (1... f5 (1... g5 2. g3) 2. f3) 2. e3) 2. e3 (2. f3 f6) (2. g3 g6) (2. h3 h6) 2... e6';
            chess.loadPgn(pgn);
            assert.equal(chess.toPgn(), pgn, "PGN parser failed to reassemble the given PGN text");
        });

        test("many nested variations + headers", () => {
            const expectedPgn = '[Event "Testing advanced variations: nesting and siblings"]\n[Round "1"]\n\n1. d4 (1. c4 (1. b4 (1. a4 a5) 1... b5) 1... c5) (1. e4 (1. f4 (1. g4 (1. h4 h5) 1... g5) 1... f5) 1... e5) 1... d5 (1... c5 (1... b5 (1... a5))) (1... e5 (1... f5 (1... g5 2. g3) 2. f3) 2. e3) 2. e3 (2. f3 f6) (2. g3 g6) (2. h3 h6) 2... e6';

            chess.loadPgn(`
                [Event "Testing advanced variations: nesting and siblings"]
                [Round "1"]

                1. d4

                    (1. c4
                        (1. b4
                            (1. a4 a5)
                         1... b5)
                     1... c5)

                    (1. e4
                        (1. f4
                            (1. g4
                                (1. h4 h5)
                             1... g5)
                         1... f5)
                     1... e5)

                1... d5

                    (1... c5
                        (1... b5
                            (1... a5)
                         )
                    )

                    (1... e5
                        (1... f5
                            (1... g5 2. g3)
                         2. f3)
                     2. e3)

                2. e3
                    (2. f3 f6)
                    (2. g3 g6)
                    (2. h3 h6)

                2... e6
            `);

            assert.equal(expectedPgn, chess.toPgn(), "PGN parser failed to reassemble the given PGN text");
        });

        test("comments", () => {
            const pgn = '[Event "2.f"][Site "Leningrad"][Date "1974.??.??"][Round "3"][White "Karpov, Anatoly"][Black "Spassky, Boris"][Result "1-0"][ECO "E91"][WhiteElo "2700"][BlackElo "2650"][Annotator "JvR"][PlyCount "109"][EventDate "1974.??.??"]\n\n1. d4 Nf6 2. c4 g6 3. Nc3 Bg7 4. e4 d6 5. Nf3 O-O 6. Be2 c5 7. O-O Bg4 $5 { Spassky chooses a sharp opening.} 8. d5 Nbd7 9. Bg5 a6 10. a4 Qc7 11. Qd2 Rae8 12. h3 Bxf3 13. Bxf3 e6 $5 14. b3 Kh8 15. Be3 Ng8 16. Be2 e5 $5 17. g4 Qd8 18. Kg2 Qh4 $5 {Black takes the initiative on the kingside.} 19. f3 ({ The tactical justification is} 19. Bg5 Bh6) 19... Bh6 $2 { Tal, Keres and Botvinnik condemn this provocative move} ({and prefer} 19... f5) 20. g5 Bg7 21. Bf2 Qf4 22. Be3 Qh4 23. Qe1 $1 Qxe1 24. Rfxe1 h6 25. h4 hxg5 $2 ({A defence line against an attack on the queenside creates} 25... Ra8 26. Reb1 Rfb8 27. b4 Bf8 28. bxc5 Nxc5) 26. hxg5 Ne7 27. a5 f6 28. Reb1 fxg5 29. b4 $1 Nf5 $5 30. Bxg5 $011 ({Keres analyses} 30. exf5 e4 31. Bd2 exf3+ 32. Bxf3 gxf5 { Black has counter-play.}) 30... Nd4 31. bxc5 Nxc5 32. Rb6 Bf6 33. Rh1+ $111 Kg7 34. Bh6+ Kg8 35. Bxf8 Rxf8 36. Rxd6 Kg7 37. Bd1 Be7 ({Tal mentions} 37... Bd8 38. Na4 Bc7 39. Nxc5 Bxd6 40. Nxb7 {and 41.c5. White wins.}) 38. Rb6 Bd8 39. Rb1 Rf7 40. Na4 Nd3 41. Nb6 g5 42. Nc8 Nc5 43. Nd6 Rd7 44. Nf5+ Nxf5 45. exf5 e4 46. fxe4 Nxe4 47. Ba4 Re7 48. Rbe1 Nc5 49. Rxe7+ Bxe7 50. Bc2 Bd8 51. Ra1 Kf6 52. d6 Nd7 53. Rb1 Ke5 54. Rd1 Kf4 55. Re1';
            chess.loadPgn(pgn);
            assert.equal(pgn, chess.toPgn(), "PGN parser failed to reassemble the given PGN text");
        });

    });

    suite("#toPgn()", () => {
        [{
            moves:
                ['d4', 'd5', 'Nf3', 'Nc6', 'e3', 'e6', 'Bb5', 'g5', 'O-O', 'Qf6', 'Nc3', 'Bd7', 'Bxc6', 'Bxc6', 'Re1', 'O-O-O', 'a4', 'Bb4', 'a5', 'b5', 'axb6', 'axb6', 'Ra8+', 'Kd7', 'Ne5+', 'Kd6', 'Rxd8+', 'Qxd8', 'Nxf7+', 'Ke7', 'Nxd5+', 'Qxd5', 'c3', 'Kxf7', 'Qf3+', 'Qxf3', 'gxf3', 'Bxf3', 'cxb4', 'e5', 'dxe5', 'Ke6', 'b3', 'Kxe5', 'Bb2+', 'Ke4', 'Bxh8', 'Nf6', 'Bxf6', 'h5', 'Bxg5', 'Bg2', 'Kxg2', 'Kf5', 'Bh4', 'Kg4', 'Bg3', 'Kf5', 'e4+', 'Kg4', 'e5', 'h4', 'Bxh4', 'Kxh4', 'e6', 'c5', 'bxc5', 'bxc5', 'e7', 'c4', 'bxc4', 'Kg4', 'e8=Q', 'Kf5', 'Qe5+', 'Kg4', 'Re4#'],
            header: ['White', 'Player1', 'Black', 'Player2', 'RandomAttribute', 'Value'],
            maxWidth: 19,
            newlineChar: "<br />",
            pgn: '[White "Player1"]<br />[Black "Player2"]<br />[RandomAttribute "Value"]<br /><br />1. d4 d5 2. Nf3 Nc6<br />3. e3 e6 4. Bb5 g5<br />5. O-O Qf6 6. Nc3<br />Bd7 7. Bxc6 Bxc6 8.<br />Re1 O-O-O 9. a4 Bb4<br />10. a5 b5 11. axb6<br />axb6 12. Ra8+ Kd7<br />13. Ne5+ Kd6 14.<br />Rxd8+ Qxd8 15. Nxf7+<br />Ke7 16. Nxd5+ Qxd5<br />17. c3 Kxf7 18. Qf3+<br />Qxf3 19. gxf3 Bxf3<br />20. cxb4 e5 21. dxe5<br />Ke6 22. b3 Kxe5 23.<br />Bb2+ Ke4 24. Bxh8<br />Nf6 25. Bxf6 h5 26.<br />Bxg5 Bg2 27. Kxg2<br />Kf5 28. Bh4 Kg4 29.<br />Bg3 Kf5 30. e4+ Kg4<br />31. e5 h4 32. Bxh4<br />Kxh4 33. e6 c5 34.<br />bxc5 bxc5 35. e7 c4<br />36. bxc4 Kg4 37.<br />e8=Q Kf5 38. Qe5+<br />Kg4 39. Re4#',
            fen: '8/8/8/4Q3/2P1R1k1/8/5PKP/8 b - - 4 39'
        },{
            moves:
                ['c4', 'e6', 'Nf3', 'd5', 'd4', 'Nf6', 'Nc3', 'Be7', 'Bg5', 'O-O', 'e3', 'h6', 'Bh4', 'b6', 'cxd5', 'Nxd5', 'Bxe7', 'Qxe7', 'Nxd5', 'exd5', 'Rc1', 'Be6', 'Qa4', 'c5', 'Qa3', 'Rc8', 'Bb5', 'a6', 'dxc5', 'bxc5', 'O-O', 'Ra7', 'Be2', 'Nd7', 'Nd4', 'Qf8', 'Nxe6', 'fxe6', 'e4', 'd4', 'f4', 'Qe7', 'e5', 'Rb8', 'Bc4', 'Kh8', 'Qh3', 'Nf8', 'b3', 'a5', 'f5', 'exf5', 'Rxf5', 'Nh7', 'Rcf1', 'Qd8', 'Qg3', 'Re7', 'h4', 'Rbb7', 'e6', 'Rbc7', 'Qe5', 'Qe8', 'a4', 'Qd8', 'R1f2', 'Qe8', 'R2f3', 'Qd8', 'Bd3', 'Qe8', 'Qe4', 'Nf6', 'Rxf6', 'gxf6', 'Rxf6', 'Kg8', 'Bc4', 'Kh8', 'Qf4'],
            header: ["Event", "Reykjavik WCh", "Site", "Reykjavik WCh", "Date", "1972.01.07", "EventDate", "?", "Round", "6", "Result", "1-0", "White", "Robert James Fischer", "Black", "Boris Spassky", "ECO", "D59", "WhiteElo", "?", "BlackElo", "?", "PlyCount", "81"],
            maxWidth: 65,
            pgn: '[Event "Reykjavik WCh"]\n[Site "Reykjavik WCh"]\n[Date "1972.01.07"]\n[EventDate "?"]\n[Round "6"]\n[Result "1-0"]\n[White "Robert James Fischer"]\n[Black "Boris Spassky"]\n[ECO "D59"]\n[WhiteElo "?"]\n[BlackElo "?"]\n[PlyCount "81"]\n\n1. c4 e6 2. Nf3 d5 3. d4 Nf6 4. Nc3 Be7 5. Bg5 O-O 6. e3 h6 7. Bh4\nb6 8. cxd5 Nxd5 9. Bxe7 Qxe7 10. Nxd5 exd5 11. Rc1 Be6 12. Qa4 c5\n13. Qa3 Rc8 14. Bb5 a6 15. dxc5 bxc5 16. O-O Ra7 17. Be2 Nd7 18.\nNd4 Qf8 19. Nxe6 fxe6 20. e4 d4 21. f4 Qe7 22. e5 Rb8 23. Bc4 Kh8\n24. Qh3 Nf8 25. b3 a5 26. f5 exf5 27. Rxf5 Nh7 28. Rcf1 Qd8 29.\nQg3 Re7 30. h4 Rbb7 31. e6 Rbc7 32. Qe5 Qe8 33. a4 Qd8 34. R1f2\nQe8 35. R2f3 Qd8 36. Bd3 Qe8 37. Qe4 Nf6 38. Rxf6 gxf6 39. Rxf6\nKg8 40. Bc4 Kh8 41. Qf4 1-0',
            fen: '4q2k/2r1r3/4PR1p/p1p5/P1Bp1Q1P/1P6/6P1/6K1 b - - 4 41'
        }, {
            moves: ['f3', 'e5', 'g4', 'Qh4#'],     // testing maxWidth being small and having no comments
            header: [],
            maxWidth: 1,
            pgn: '1.\nf3\ne5\n2.\ng4\nQh4#',
            fen: 'rnb1kbnr/pppp1ppp/8/4p3/6Pq/5P2/PPPPP2P/RNBQKBNR w KQkq - 1 3'
        }, {
            moves: ['Ba5', 'O-O', 'd6', 'd4'],     // testing a non-starting position
            header: [],
            maxWidth: 20,
            pgn: '[SetUp "1"]\n[FEN "r1bqk1nr/pppp1ppp/2n5/4p3/1bB1P3/2P2N2/P2P1PPP/RNBQK2R b KQkq - 0 1"]\n\n1... Ba5 2. O-O d6 3.\nd4',
            startingFen: 'r1bqk1nr/pppp1ppp/2n5/4p3/1bB1P3/2P2N2/P2P1PPP/RNBQK2R b KQkq - 0 1',
            fen: 'r1bqk1nr/ppp2ppp/2np4/b3p3/2BPP3/2P2N2/P4PPP/RNBQ1RK1 b kq d3 0 3'
        }].forEach(testCase => {
            test(testCase.fen, () => {
                if (testCase.startingFen) {
                    chess.loadFen(testCase.startingFen);
                }
                let errorMessage = "";
                for (let j = 0; j < testCase.moves.length; j++) {
                    if (chess.makeMoveFromSan(testCase.moves[j]) === null) {
                        errorMessage = "move() did not accept " + testCase.moves[j] + " : ";
                        break;
                    }
                }

                chess.header().addAll(testCase.header);

                let options = { maxWidth: testCase.maxWidth };
                if (testCase.newlineChar) options.newlineChar = testCase.newlineChar;

                assert.equal(testCase.pgn, chess.toPgn(options));
                assert.equal(testCase.fen, chess.toFen());
                assert(errorMessage.length == 0, errorMessage);
            });
        });
    });

    test('dirty pgn', () => {
        const pgn =
            '[Event "Reykjavik WCh"]\n' +
            '[Site "Reykjavik WCh"]\n' +
            '[Date "1972.01.07"]\n' +
            '[EventDate "?"]\n' +
            '[Round "6"]\n' +
            '[Result "1-0"]\n' +
            '[White "Robert James Fischer"]\r\n' +
            '[Black "Boris Spassky"]\n' +
            '[ECO "D59"]\n' +
            '[WhiteElo "?"]\n' +
            '[BlackElo "?"]\n' +
            '[PlyCount "81"]\n' +
            '\r\n' +
            '1. c4 e6 2. Nf3 d5 3. d4 Nf6 4. Nc3 Be7 5. Bg5 O-O 6. e3 h6\n' +
            '7. Bh4 b6 8. cxd5 Nxd5 9. Bxe7 Qxe7 10. Nxd5 exd5 11. Rc1 Be6\n' +
            '12. Qa4 c5 13. Qa3 Rc8 14. Bb5 a6 15. dxc5 bxc5 16. O-O Ra7\n' +
            '17. Be2 Nd7 18. Nd4 Qf8 19. Nxe6 fxe6 20. e4 d4 21. f4 Qe7\r\n' +
            '22. e5 Rb8 23. Bc4 Kh8 24. Qh3 Nf8 25. b3 a5 26. f5 exf5\n' +
            '27. Rxf5 Nh7 28. Rcf1 Qd8 29. Qg3 Re7 30. h4 Rbb7 31. e6 Rbc7\n' +
            '32. Qe5 Qe8 33. a4 Qd8 34. R1f2 Qe8 35. R2f3 Qd8 36. Bd3 Qe8\n' +
            '37. Qe4 Nf6 38. Rxf6 gxf6 39. Rxf6 Kg8 40. Bc4 Kh8 41. Qf4 1-0\n';

        try {
            chess.loadPgn(pgn, { newlineChar: '\r?\n' });
            fail("loadPgn() failed to throw an exception");
        }
        catch(error) {
            assert.equal(error['message'], 'error when trying to apply the parsed PGN move ""');
        }

        try {
            assert(chess.loadPgn(pgn));
            fail("loadPgn() failed to throw an exception");
        }
        catch(error) {
            assert.equal(error['message'], 'error when trying to apply the parsed PGN move ""');
        }

        assert(chess.toPgn().match(/^\[\[/) === null);
    });

    test('PGN continuations', () => {
        chess.makeMoveFromSan('e4');
        chess.makeMoveFromSan('e5');
        chess.createContinuationFromSan('a3');

        const actual = chess.toPgn();
        const expected = "1. e4 e5 (* 2. a3)";

        assert(expected === actual, "pgn output:  expected " + expected + " but found " + actual);

        const actual2 = chess.history();
        const expected2 = ["e4", "e5", "a3"];

        let same = actual2.length === expected2.length;

        if (same) {
            for (let i = 0; i < actual2.length; i++) {
                same &= actual2[i] === expected2[i];
            }
        }
        assert(same, "history output:  expected " + expected2 + " but found " + actual2);
    });

    test('PGN continuations and variations - avoiding duplicate moves', () => {
        chess.makeMoveFromSan('e4');
        chess.makeMoveFromSan('e5');
        assert(false === chess.createVariationFromSan('e5'), "New variation with move 'e5' should have failed, as 'e5' was already the current move on the current variation.")

        chess.prev();
        assert(false === chess.createContinuationFromSan('e5'), "New continuation with move 'e5' should have failed, as 'e5' was already the next move on the current variation.")
    });

    test('PGN variation - implicit creation via move traversal then adding a new move', () => {
        chess.makeMoveFromSan('e4');
        chess.makeMoveFromSan('e5');

        chess.prev();

        chess.makeMoveFromSan('a6');
        chess.makeMoveFromSan('Nf3');
        chess.makeMoveFromSan('Nf6');

        chess.createVariationFromSan('Nh6');

        chess.makeMoveFromSan('b3');

        const actual = chess.toPgn();
        const expected = "1. e4 e5 (1... a6 2. Nf3 Nf6 (2... Nh6 3. b3))";

        assert.equal(actual, expected);
    });

    test('PGN continuation - rejection of new continuation for invalid move', () => {
        chess.makeMoveFromSan('e4');
        chess.makeMoveFromSan('e5');
        chess.makeMoveFromSan('a4');
        chess.makeMoveFromSan('a6');

        assert(chess.createContinuationFromSan('Rb2') === false, "New continuation for move 'Rb2' should have failed.");
        assert(chess.createContinuationFromSan('Ra2'), "New continuation for move 'Ra2' should have succeeded.");

        const actual = chess.toPgn();
        const expected = "1. e4 e5 2. a4 a6 (* 3. Ra2)";

        assert.equal(actual, expected);
    });

    suite("Make Move", () => {
        [{
            fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
            legal: true,
            move: 'e4',
            next: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1'
        }, {
            fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
            legal: false,
            move: 'e5'
        }, {
            fen: '7k/3R4/3p2Q1/6Q1/2N1N3/8/8/3R3K w - - 0 1',
            legal: true,
            move: 'Rd8#',
            next: '3R3k/8/3p2Q1/6Q1/2N1N3/8/8/3R3K b - - 1 1'
        }, {
            fen: 'rnbqkbnr/pp3ppp/2pp4/4pP2/4P3/8/PPPP2PP/RNBQKBNR w KQkq e6 0 1',
            legal: true,
            move: 'fxe6',
            next: 'rnbqkbnr/pp3ppp/2ppP3/8/4P3/8/PPPP2PP/RNBQKBNR b KQkq - 0 1',
            captured: Piece.BLACK_PAWN
        }, {
            fen: 'rnbqkbnr/pppp2pp/8/4p3/4Pp2/2PP4/PP3PPP/RNBQKBNR b KQkq e3 0 1',
            legal: true,
            move: 'fxe3',
            next: 'rnbqkbnr/pppp2pp/8/4p3/8/2PPp3/PP3PPP/RNBQKBNR w KQkq - 0 2',
            captured: Piece.WHITE_PAWN
        }].forEach(position => {
            test(position.fen + ' (' + position.move + ' ' + position.legal + ')', () => {

                chess.loadFen(position.fen);
                const result = chess.makeMoveFromSan(position.move);

                if (position.legal) {
                    assert(result);
                    assert(chess.toFen() === position.next);
                    if (position.captured) {
                        assert.equal(result.move.capturedPiece, position.captured);
                    }
                } else {
                    assert(!result);
                }
            });
        });
    });

    suite('Regression Tests', () => {
        test('castling flag reappearing', () => {
            chess.loadFen('b3k2r/5p2/4p3/1p5p/6p1/2PR2P1/BP3qNP/6QK b k - 2 28');

            chess.makeMove(new Move({
                from: Move.SQUARES.a8,
                to: Move.SQUARES.g2,
                movedPiece: Piece.BLACK_BISHOP
            }));

            assert.equal(chess.toFen(), '4k2r/5p2/4p3/1p5p/6p1/2PR2P1/BP3qbP/6QK w k - 3 29');
        });

        test('placing more than one king', () => {
            chess.loadFen('N3k3/8/8/8/8/8/5b2/4K3 w - - 0 1');
            assert(chess.put(Piece.WHITE_KING, 'a1') === false);
            chess.put(Piece.WHITE_QUEEN, 'a1');
            chess.remove('a1');
            assert.equal(chess.moves().join(' '), 'Kd2 Ke2 Kxf2 Kf1 Kd1');
        });
    });

    // TODO(aaron) organize these remaining suites better;
    suite('Move History Navigation', () => {
        test('Simple cursor traversals of variations', () => {
            chess.makeMoveFromSan('e4');
            chess.makeMoveFromSan('e5');
            chess.createVariationFromSan('a6');
            chess.createVariationFromSan('a5');
            chess.makeMoveFromSan('Nf3');
            chess.makeMoveFromSan('Nf6');
            chess.makeMoveFromSan('a3');
            chess.makeMoveFromSan('b6');

            let actual = chess.toPgn();
            let expected = "1. e4 e5 (1... a6 (1... a5 2. Nf3 Nf6 3. a3 b6))";
            assert.equal(actual, expected);

            actual = chess.history();
            expected = ["e4", "a5", "Nf3", "Nf6", "a3", "b6"]

            let same = actual.length === expected.length;
            if (same) {
                for (let i = 0; i < actual.length; i++) {
                    same &= actual[i] === expected[i];
                }
            }
            assert(same, "history output:  expected " + expected + " but found " + actual);
        });

        test('Simple cursor traversals of mainline', () => {
            chess.makeMoveFromSan('e4');
            chess.makeMoveFromSan('e5');
            assert(chess.history().length == 2);
            chess.prev();
            assert(chess.history().length == 1);
            chess.makeMoveFromSan('e5');
            assert(chess.history().length == 2);
            chess.prev();
            chess.prev();
            assert(chess.history().length == 0);
            chess.prev();
            chess.prev();
            chess.next();
            chess.next();
            assert(chess.history().length == 2);
            assert(false === chess.next());
        });
    });

    suite('regression test for coding bugs', () => {
        test('regression test for coding bug -- failed to fully clone javascript map objects', () => {
            chess.loadFen('rnbqkbnr/pppp1ppp/8/8/4p3/4PN2/PPPP1PPP/RNBQKB1R w KQkq - 0 3');
            chess.makeMoveFromSan('Be2');
            chess.makeMoveFromSan('a6');
            chess.moves({onlyForSquare: 'e1'});
            chess.isThreefoldRepetition();   // no defect;  fen still allows castling
            const fen1 = chess.toFen();
            chess.isThreefoldRepetition();   // defect in code prior to bug fix;  fen incorrectly disallows castling....
            const fen2 = chess.toFen();
            assert(fen1 === fen2);
        });
    });

    suite("History", () => {
        test("History Test", () => {
            const expectedFen = '4q2k/2r1r3/4PR1p/p1p5/P1Bp1Q1P/1P6/6P1/6K1 b - - 4 41';
            const moves = [
                'c4', 'e6', 'Nf3', 'd5', 'd4', 'Nf6', 'Nc3', 'Be7', 'Bg5', 'O-O', 'e3', 'h6',
                'Bh4', 'b6', 'cxd5', 'Nxd5', 'Bxe7', 'Qxe7', 'Nxd5', 'exd5', 'Rc1', 'Be6',
                'Qa4', 'c5', 'Qa3', 'Rc8', 'Bb5', 'a6', 'dxc5', 'bxc5', 'O-O', 'Ra7',
                'Be2', 'Nd7', 'Nd4', 'Qf8', 'Nxe6', 'fxe6', 'e4', 'd4', 'f4', 'Qe7',
                'e5', 'Rb8', 'Bc4', 'Kh8', 'Qh3', 'Nf8', 'b3', 'a5', 'f5', 'exf5',
                'Rxf5', 'Nh7', 'Rcf1', 'Qd8', 'Qg3', 'Re7', 'h4', 'Rbb7', 'e6', 'Rbc7',
                'Qe5', 'Qe8', 'a4', 'Qd8', 'R1f2', 'Qe8', 'R2f3', 'Qd8', 'Bd3', 'Qe8',
                'Qe4', 'Nf6', 'Rxf6', 'gxf6', 'Rxf6', 'Kg8', 'Bc4', 'Kh8', 'Qf4'
            ];

            for (let j = 0; j < moves.length; j++) {
                chess.makeMoveFromSan(moves[j]);
            }

            const history = chess.history();

            const actualFen = chess.toFen();
            assert.equal(expectedFen, actualFen);
            assert.equal(history.length, moves.length);
            for (let j = 0; j < moves.length; j++) {
                assert.equal(history[j], moves[j]);
            }
        });
    });

    suite("Timing", () => {
        test("Timing Test #1", () => {
            // TODO write a test that makes extensive use of the replay log....
        });
    });

    suite("Wildcard Moves", () => {
       test("1", () => {

           chess.loadPgn("1. e4 -- 2. a3");

           chess.createVariationFromSan('a4');
           chess.prev();
           chess.createVariationFromSan('b4');
           chess.prev();
           chess.createVariationFromSan('--');

           assert.equal('1. e4  ^ -- 2. a3 (2. a4)', chess.toPgn({showMoveCursor: true}));
        });
    });

});
