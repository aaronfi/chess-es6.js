'use strict';

// NOTE: tried having a Color class, with a corresponding ColorType class, and utility methods
// on the Color class such as swap(), isWhite(), isBlack(), etc.  Similar to the Piece and PieceType
// classes.  But doing so caused a performance hit (added ~1 sec to the Dirty PGN test)

// NOTE: also tried having Color.WHITE = true, and Color.BLACK = false, so as to simplify
// color comparisons to e.g. "if (this.turn)" instead of "if (this.turn === Color.WHITE)", and
// also simplify color swapping to "us = !them" instead of "us = them === Color.WHITE ? Color.Black : Color.WHITE").
// But doing caused a performance hit (added ~300 ms to the Dirty PGN test)

class Color {}

Color.WHITE = 'w';
Color.BLACK = 'b';
Color.NONE = '~';

module.exports = Color;