'use strict';

// a lightweight map class that preserves key insertion order;
// needed for parsing and reconstructing PGN headers

class LinkedHashMap
{
    constructor(pairs = []) {
	    this._map = {};
	    this._keys = [];

        this.addAll(pairs);
    }
	
	addAll(pairs) {
        for (let i = 0; i < pairs.length; i += 2) {
            this.set(pairs[i], pairs[i+1]);
        }
    }
    
    clear() {
        this._map = {};
        this._keys = [];
    }
    
    get(k) { 
    	return this._map[k];
    }
    
    getKeyAtPosition(i) { 
    	return this._keys[i];
    }

    getValueAtPosition(i) {
    	return this._map[ this._keys[i] ];
 	}

    length() { 
    	return this._keys.length; 
    }

    remove(k) {
	    if (k in this._map) {
            let i = this._keys.indexOf(k);
	        this._keys.splice(i,1);
	        delete this._map[k];
	    }
	}
    
    set(k, v) {
	    if (! (k in this._map)) {
	        this._keys.push(k);
	    }
	    this._map[k] = v;
	}

    toString() {
        return '{ ' + this._keys.map(key => `${key}: ${this._map[key]}`).join(', ') + ' }';
    }
};

module.exports = LinkedHashMap;