'use strict';

class Flags {};

Flags.NORMAL = 1;
Flags.CAPTURE = 2;
Flags.BIG_PAWN = 4;  // a pawn moving two spaces
Flags.EP_CAPTURE = 8;
Flags.PROMOTION = 16;
Flags.KSIDE_CASTLE = 32;
Flags.QSIDE_CASTLE = 64;
Flags.DISPLAY = {
    [ Flags.NORMAL       ]: 'n',
    [ Flags.CAPTURE      ]: 'c',
    [ Flags.BIG_PAWN     ]: 'b',
    [ Flags.EP_CAPTURE   ]: 'e',
    [ Flags.PROMOTION    ]: 'p',
    [ Flags.KSIDE_CASTLE ]: 'k',
    [ Flags.QSIDE_CASTLE ]: 'q'
};

module.exports = Flags;