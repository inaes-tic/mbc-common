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

// Given a path like 'Caspa.Branding.name', a hash-like with the user config
// and another one with defaults retrieves both.
function get_value (path, conf, defaults) {
    var path = path.split('.');
    var val = conf;
    var dfl = defaults;

    var found = false;
    var key;
    var ret = {
        value:   null,
        default: null,
        found:   false,
    };


    do {
        key = path.shift();
        if (_.has(val, key) ) {
            val = val[key];
            if (path.length == 0) {
                found = true;
            }
        }

        if (_.has(dfl, key) ) {
            dfl = dfl[key];
        }
    } while (path.length);

    ret.default = ret.value = dfl;
    ret.found = found;
    if (found) {
        ret.value = val;
    }

    return ret;
};

// Given three objects like the ones returned from configStore, merge them
// in a structure suitable to parse into nested relational models.
// Guess how big N is...
function flatten_conf (conf, defaults, descriptions, root) {
    if (root == undefined) {
        var root = {
            properties: [],
        };

        // XXX: _.omit() returns a copy of the object.
        _.extend(root, _.omit(descriptions, ['properties', 'type']));
        if (!_.has(descriptions, 'properties') || descriptions.properties.length==0) {
            if (descriptions.type && !descriptions.type.match(/config|defaults|descriptions/)) {
                root.type = descriptions.type;
            }
        }
    }

    _.each(descriptions.properties, function(contents, name, par) {
        var dfl, dsc, cnf;
        var ret = get_value(name, conf, defaults);

        dfl = ret.default;
        cnf = ret.value;
        dsc = contents;

        if (!ret.found) {
            return;
        }

        var elm = {
            name: name,
            properties: [],
        };

        // XXX: _.omit() returns a copy of the object.
        _.extend(elm, _.omit(contents, ['properties', 'type']));
        if (!_.has(dsc, 'properties') || dsc.properties.length==0) {
            elm.value = cnf;
            elm.default = dfl;
            if (contents.type && !contents.type.match(/config|defaults|descriptions/)) {
                elm.type = contents.type;
            }
        }

        root.properties.push(elm);
        flatten_conf(cnf, dfl, dsc, elm);
    });

    return root;
};

// Given a nested structure like the one from RelationalConfig.toJSON()
// transforms it to the format expected by configStore
function relational_to_server_conf (rel, root) {
    var root = root || {};

    _.each(rel.properties, function(contents, name, par) {
        if (!_.has(contents, 'properties') || contents.properties.length==0) {
            root[contents.name] = contents.value;
        } else {
            var elm = { };
            root[contents.name] = elm;
            relational_to_server_conf(contents, elm);
        }
    });

    return root;
};

if(!server){
App.RelationalConfig = Backbone.RelationalModel.extend({
    idAttribute: '_id',
    relations: [{
        type: Backbone.HasMany,
        key: 'properties',
        relatedModel: 'App.RelationalConfig',
        collectionType: 'Backbone.Collection',
        includeInJSON: true,
    }],
    initialize: function () {
        var self = this;
        console.log ('creating new RelationalConfig');
        Backbone.RelationalModel.prototype.initialize.call (this);
    },

    defaults: {
        type:           null,
        widget:         'input',
        title:          '',
        description:    '',
        name:           '',
        value:          null,
        default:        null,
        properties:     [],
    },
});
}

App.MostoCodes = { // message code and their descriptions
    // FORMAT: [description, default message[, isError (boolean)]]

    // 1xx are info codes
    101: ["FORCE CHECKOUT", "Fetching more playlists.", false],
    // 2xx are warning codes
    201: ["BLANK PLAYING", "Blank clip playing", false],
    202: ["OUT OF SYNC", "Melted was out of sync", false],
    203: ["STARTED PLAYING", "Melted was stopped and was started", false],
    204: ["NO CLIPS", "No clips loaded.", false],
    // 4xx are "client error" codes. A problem in db content, for example
    // 5xx are "server error" codes. Mosto couldn't find the requested file,
    //  connection problem with melted, etc
    500: ["MOSTO DEAD", "Mosto is silent", true],
    501: ["MELTED CONNECTION ERROR", "Cannot connect to melted", true],
    502: ["FILE NOT FOUND", "Requested media file cannot be found", true],
    503: ["SYNC MELTED ERROR", "Error inside syncMelted.", true],
};

App.MostoMessage = Backbone.Model.extend({
    urlRoot: 'message',
    backend: 'mostomessagesbackend',
    idAttribute: '_id',
    initialize: function() {
        Backbone.Model.prototype.initialize.apply(this, arguments);

        if(!this.get('start')) {
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
                if(undefined == this.get('end'))
                    this.set('end', this.get('start'));
            }
        }
    },
    isError: function() {
        return this.get('type') == 'error';
    },
    isNotification: function() {
        return this.get('type') == 'notification';
    },
    resolve: function() {
        this.set('status', 'fixed');
        this.set('end', moment().valueOf());
    },
    reopen: function() {
        this.set('status', 'failing');
        this.set('start', moment().valueOf());
        this.set('end', 0);
    },
    defaults: {
        code: -1,
        description: "INVALID",
        message: "INVALID",
        status: "one-shot", // "one-shot" , "failing", "fixed"
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
