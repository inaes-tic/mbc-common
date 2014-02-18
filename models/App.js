// Save a reference to the global object (`window` in the browser, `global`
// on the server).
var root = this;

// The top-level namespace. All public Backbone classes and modules will
// be attached to this. Exported for both CommonJS and the browser.
var App, server = false;
if (typeof exports !== 'undefined') {
    App = exports;
    server = true;
    moment = require('moment');
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

App.MostoCodes = { // message code and their descriptions
    // FORMAT: [description, default message[, isError (boolean)]]

    // 1xx are info codes
    // 2xx are warning codes
    201: ["BLANK PLAYING", "Blank clip playing", false],
    202: ["OUT OF SYNC", "Melted was out of sync", false],
    203: ["STARTED PLAYING", "Melted was stopped and was started", false],
    // 4xx are "client error" codes. A problem in db content, for example
    // 5xx are "server error" codes. Mosto couldn't find the requested file,
    //  connection problem with melted, etc
    500: ["MOSTO DEAD", "Mosto is silent", true],
    501: ["MELTED CONNECTION ERROR", "Cannot connect to melted", true],
    502: ["FILE NOT FOUND", "Requested media file cannot be found", true],
};

App.MostoMessage = Backbone.Model.extend({
    urlRoot: 'message',
    backend: 'mostomessagesbackend',
    idAttribute: '_id',
    initialize: function() {
        Backbone.Model.prototype.initialize.apply(this, arguments);

        if(!server) {
            this.bindBackend();
        } else {
            if(!this.get('start'))
                this.set('start', moment().valueOf());
        }
        var code = this.get('code');
        if(!(code == -1)) {
            var data = App.MostoCodes[code];
            var attrs = this.toJSON();
            if(!attrs.description || attrs.description == 'INVALID')
                this.set('description', data[0]);
            if(!attrs.message || attrs.message == 'INVALID')
                this.set('message', data[1]);
            if(data[2]) {
                // "sticky" errors have a "failing" status
                this.set('status', 'failing');
                this.set('type', 'error');
            } else {
                // but one-shot errors end immediatly
                if(!this.get('end'))
                    this.set('end', this.get('start'));
            }
        }
    },
    isError: function() {
        return this.get('type') == 'error';
    },
    defaults: {
        code: -1,
        description: "INVALID",
        message: "INVALID",
        status: "one-shot", // "one-shot" , "failing"
        reference: "",
        sticky: false,
        type: 'notification',
        start: 0,   // moment.valueOf() , something like 1392046763435
        end: 0,   // moment.valueOf() , something like 1392046763435
    },
});

App.MostoMessagesCollection = Backbone.Collection.extend({
    url: 'message',
    model: App.MostoMessage,
    backend: 'mostomessagesbackend',
    comparator: function(message) { return -message.get('start') },
    initialize: function () {
        if(!server) {
            this.bindBackend();
        }
    },
});

App.FilteredMessagesCollection = App.MostoMessagesCollection.extend({
    initialize: function(models, options) {
        this.parent = options.parent;
        this.filter_func = options.filter || function() { return true };

        this.parent.on('add', this.refilter.bind(this));
    },
    refilter: function(model) {
        this.set(this.parent.filter(this.filter_func.bind(this)));
    },
});


if(server) module.exports = App;
else root.App = App;
