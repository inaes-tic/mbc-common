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

if(server) module.exports = App;
else root.App = App;
