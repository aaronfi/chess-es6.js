'use strict';

class Fen {

    static validate(fen /* string */) {
        // 1st criterion: 6 space-separated fields?
        let tokens = fen.split(/\s+/);
        if (tokens.length !== 6) {
            return { isValid: false, errorCode: 1, errorMessage: Fen.ERRORS[1] };
        }

        // 2nd criterion: move number field is a integer value > 0?
        if (isNaN(tokens[5]) || (parseInt(tokens[5], 10) <= 0)) {
            return { isValid: false, errorCode: 2, errorMessage: Fen.ERRORS[2] };
        }

        // 3rd criterion: half move counter is an integer >= 0?
        if (isNaN(tokens[4]) || (parseInt(tokens[4], 10) < 0)) {
            return { isValid: false, errorCode: 3, errorMessage: Fen.ERRORS[3] };
        }

        // 4th criterion: 4th field is a valid e.p.-string?
        if (!/^(-|[abcdefgh][36])$/.test(tokens[3])) {
            return { isValid: false, errorCode: 4, errorMessage: Fen.ERRORS[4] };
        }

        // 5th criterion: 3th field is a valid castle-string?
        if( !/^(KQ?k?q?|Qk?q?|kq?|q|-)$/.test(tokens[2])) {
            return { isValid: false, errorCode: 5, errorMessage: Fen.ERRORS[5] };
        }

        // 6th criterion: 2nd field is "w" (white) or "b" (black)?
        if (!/^(w|b)$/.test(tokens[1])) {
            return { isValid: false, errorCode: 6, errorMessage: Fen.ERRORS[6] };
        }

        // 7th criterion: 1st field contains 8 rows?
        const rows = tokens[0].split('/');
        if (rows.length !== 8) {
            return { isValid: false, errorCode: 7, errorMessage: Fen.ERRORS[7] };
        }

        // 8th criterion: every row is valid?
        for (let i = 0; i < rows.length; i++) {
            // check for right sum of fields AND not two numbers in succession
            let sumFields = 0;
            let previousWasNumber = false;

            for (let k = 0; k < rows[i].length; k++) {
                if (!isNaN(rows[i][k])) {
                    if (previousWasNumber) {
                        return { isValid: false, errorCode: 8, errorMessage: Fen.ERRORS[8]};
                    }
                    sumFields += parseInt(rows[i][k], 10);
                    previousWasNumber = true;
                } else {
                    if (!/^[prnbqkPRNBQK]$/.test(rows[i][k])) {
                        return { isValid: false, errorCode: 9, errorMessage: Fen.ERRORS[9]};
                    }
                    sumFields += 1;
                    previousWasNumber = false;
                }
            }
            if (sumFields !== 8) {
                return { isValid: false, errorCode: 10, errorMessage: Fen.ERRORS[10]};
            }
        }

        // everything is okay!
        return { isValid: true, errorCode: 0, error: Fen.ERRORS[0] };
    }
};

Fen.ERRORS =  {
     0: 'No errors.',
     1: 'FEN string must contain six space-delimited fields.',
     2: '6th field (move number) must be a positive integer.',
     3: '5th field (half move counter) must be a non-negative integer.',
     4: '4th field (en-passant square) is invalid.',
     5: '3rd field (castling availability) is invalid.',
     6: '2nd field (side to move) is invalid.',
     7: '1st field (piece positions) does not contain 8 \'/\'-delimited rows.',
     8: '1st field (piece positions) is invalid [consecutive numbers].',
     9: '1st field (piece positions) is invalid [invalid piece].',
    10: '1st field (piece positions) is invalid [row too large].'
};

Fen.DEFAULT_POSITION      = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR';
Fen.DEFAULT_POSITION_FULL = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

module.exports = Fen;
