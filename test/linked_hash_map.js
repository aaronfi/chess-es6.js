'use strict';

const assert = require('assert');
const LinkedHashMap = require('./../src/linked_hash_map');

suite('LinkedHashMap', () => {
    setup(() => {        
    });

    test('#addAll', () => {
        let map = new LinkedHashMap();
        map.addAll([
            'c', '1', 
            'b', '2',
            'a', '3'         
        ]);

        assert(map.getKeyAtPosition(0) === 'c', "key at position did not match expected value");
        assert(map.getKeyAtPosition(1) === 'b', "key at position did not match expected value");
        assert(map.getKeyAtPosition(2) === 'a', "key at position did not match expected value");

        map.remove('b');
        assert(map.getKeyAtPosition(0) === 'c', "key at position did not match expected value");
        assert(map.getKeyAtPosition(1) === 'a', "key at position did not match expected value");
        assert(map.getKeyAtPosition(2) === undefined, "key at position did not match expected value");

        assert(map.length() === 2, "map's length did not match expected value");

        map.clear();
        assert(map.length() === 0, "map's length did not match expected value");
    });


    test('#toString', () => {
        let map = new LinkedHashMap();
        map.addAll([
            'c', '1',
            'b', '2',
            'a', '3'
        ]);

        assert.equal(map.toString(), '{ c: 1, b: 2, a: 3 }');
    });
});
