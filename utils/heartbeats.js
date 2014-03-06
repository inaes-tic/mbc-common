var      _ = require('underscore')
, timers   = require('timers')
, Backbone = require('backbone')
;

var heartbeats = module.exports = exports =  {}

/*
 *
 * Simple heartbeat monitor based on the one used by Tom for Mosto.
 * Usage:
 *      var hb = new HeartBeat(timeout);
 *
 *      hb.on('up', function() {
 *          //called once when the service is up.
 *      });
 *
 *      hb.on('down', function() {
 *          //called once when the service timeouts.
 *      });
 *
 *      hb.on('down:tick', function() {
 *          //called every timeout milliseconds until the service is up again.
 *      });
 *
 * You should call hb.beat() periodically. If it is not called after /timeout/
 * milliseconds we assume the other end is down.
 */

heartbeats.HeartBeat = function(timeout) {
    var self = this;
    _.extend(self, Backbone.Events);

    self.timeout = timeout || 1000;
    self.alive = true;

    var _timer;

    function died() {
        if (self.alive) {
            self.alive = false;
            self.trigger('down');
        }
        timers.active(_timer);
        self.trigger('down:tick');
    };

    self.beat = function() {
        timers.active(_timer);
        if(!self.alive) {
            self.alive = true;
            self.trigger('up');
        }
        self.trigger('beat');
    };

    _timer = setTimeout(died, self.timeout);
};

