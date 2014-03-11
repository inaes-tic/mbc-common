// Save a reference to the global object (`window` in the browser, `global`
// on the server).
var root = this;

// The top-level namespace. All public Backbone classes and modules will
// be attached to this. Exported for both CommonJS and the browser.
var App, server = false;
if (typeof exports !== 'undefined') {
    App = exports;
    server = true;
} else {
    App = root.App = {};
}

// Require Underscore, Backbone & BackboneIO, if we're on the server, and it's not already present.
var _ = root._;
if (!_ && (typeof require !== 'undefined')) _ = require('underscore');

var BackboneIO = root.BackboneIO;
if ((typeof require !== 'undefined')) Backbone = require('backbone');

App.Collection = Backbone.Collection.extend({
    urlRoot: 'app',
    backend: 'appbackend',
    initialize: function () {
        if (!server) {
            this.bindBackend();

            this.bind('backend', function(method, model) {
                console.log ('got from backend:', method, model);
            });
        }
        console.log ('creating new App.Collection');

        Backbone.Collection.prototype.initialize.call (this);
    }
});

App.Status = Backbone.Model.extend ({
    backend: 'statusbackend',
    urlRoot: 'status',
    idAttribute: '_id',
    initialize: function () {
        if (!server) {
            this.bindBackend();

            this.bind('backend', function(method, model) {
                console.log ('STATUS got from backend:', method, model);
            });
        }
        console.log ('creating new STATUS');

        return Backbone.Model.prototype.initialize.call (this);
    },
    defaults: {
        _id: 2,
        piece: {
            previous: {name: ''},
            current:  {name: '', progress: '0%'},
            next:     {name: ''},
        },
        show: {
            previous: {name: ''},
            current:  {name: '', progress: '0%'},
            next:     {name: ''},
        },
        source: null,
        on_air: false,
    },
});

App.ProgressStatus = Backbone.Model.extend({
    urlRoot: 'progress',
    backend: 'framebackend',
    initialize: function () {
        if (!server) {
            this.bindBackend();

            this.bind('backend', function(method, model) {
                //console.log ('got from backend:', method, model);
            });
        }
        console.log ('creating new App.Model');

        return Backbone.Model.prototype.initialize.call (this);
    },
    defaults: {
        id: 3,
        currentFrame: 0,
        totalFrames: 0,
    },
});

App.TranscodeProgress = Backbone.Model.extend({
    urlRoot: 'transcode',
    backend: 'transcodeprogressbackend',
    idAttribute: '_id',
    initialize: function () {
        return Backbone.Model.prototype.initialize.call (this);
    },
    defaults: {
        'input': {
            'stat': {
                'size': 0,
            },
            'path': '',
        },
        'filename': '',
        'stage':    '',
        'progress': '0',
        // list of: {name:'', status:'', message:''}
        'tasks':  [],
    }
});

App.TranscodeProgressCollection = Backbone.Collection.extend({
    url: 'transcode',
    model: App.TranscodeProgress,
    backend: 'transcodebackend',
    initialize: function () {
        if(!server) {
            this.bindBackend();
        }
    },
});

App.TranscodeStatus = Backbone.Model.extend({
    urlRoot: 'transcodestatus',
    backend: 'transcodestatusbackend',
    idAttribute: '_id',
    initialize: function () {
        if(!server) {
            this.bindBackend();
        }
        return Backbone.Model.prototype.initialize.call (this);
    },
    defaults: {
        '_id': 1,
        'running': false,
    }
});


if(server) module.exports = App;
else root.App = App;
