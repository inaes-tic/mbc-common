var      _   = require('underscore')
, Backbone   = require('backbone')
, App        = require('../models/App.js')
, utils      = require('../utils')
;

var heartbeats = exports = module.exports;

heartbeats.PateroHeartBeat = function(timeout) {
    var self = this;
    _.extend(self, Backbone.Events);

    var timeout = timeout || 1000;
    var heartbeat = new utils.heartbeats.HeartBeat(timeout);
    self.heartbeat = heartbeat;

    var pateroStatus = new App.TranscodeStatus();
    heartbeat.on('down', function() {
        self.trigger('down');
    });

    heartbeat.on('down:tick', function() {
        pateroStatus.set('running', false);
        pateroStatus.save();
    });

    heartbeat.on('up', function() {
        self.trigger('up');
    });

    pateroStatus.on('backend', function() {
        if (pateroStatus.get('running')) {
            heartbeat.beat();
        }
    });
};
