'use strict';

class EventLog {
    constructor() {
        this._events = [];
        this._lastTimerSnapshot = Date.now();

        this._events.push({
            timer: this._lastTimerSnapshot,
            delta: null,
            event: 'Event Log initialized.'
        });
    }

    add(event) {
        const delta = this._updateEventTimer();

        this._events.push({
            timer: this._lastTimerSnapshot,
            delta: delta,
            event: event
        });
    }

    _updateEventTimer() {
        const prev = this._lastTimerSnapshot;
        this._lastTimerSnapshot = Date.now();
        return this._lastTimerSnapshot - prev;
    }

};

module.exports = EventLog;