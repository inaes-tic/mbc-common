// Save a reference to the global object (`window` in the browser, `global`
// // on the server).
var root = this;

var Sketch, server = false;
if (typeof exports !== 'undefined') {
    Sketch = exports;
    server = true;
} else {
    Sketch = root.Sketch = {};
}

// Require Underscore, Moment, Backbone & BackboneIO, if we're on the server, and it's not already present.
var _ = root._;
if (!_ && (typeof require !== 'undefined')) _ = require('underscore');

var moment = root.moment;
if (!moment && (typeof require !== 'undefined')) moment = require('moment');

var Backbone = root.Backbone || false;
var BackboneIO = root.BackboneIO;

if ((typeof require !== 'undefined')){
    Backbone = require('backbone');
}

var Sketch = {};

Sketch.Model = Backbone.Model.extend({
    urlRoot: 'sketch',
    idAttribute: '_id',
    defaults: {
    }
});

Sketch.Collection = Backbone.Collection.extend({
    model: Sketch.Model,
    url: "sketch",
    backend: "sketchbackend",
    initialize: function () {
        if (!server) {
            this.bindBackend();
            this.bind('backend', function(method, model) {
                console.log ('got from backend:', method, model);
            });
        }
        console.log ('creating new SketchCollection');
        Backbone.Collection.prototype.initialize.call (this);
    },
});


Sketch.Live = Backbone.Model.extend({
    urlRoot: 'live',
    backend: 'livebackend',
    defaults: {
    }
});

Sketch.LiveCollection = Backbone.Collection.extend({
    model: Sketch.Live,
    url: 'live',
    backend: 'livebackend',
    initialize: function() {
        this.bindBackend();
        this.bind('backend', function(method, model) {
            console.log ('got from backend:', method, model);
        });
        console.log ('creating new Sketch Live Collection');
        Backbone.Collection.prototype.initialize.call (this);
    }
});

if(server) {
    module.exports = Sketch;
} else {
    root.Sketch = Sketch;
}
