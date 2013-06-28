// Save a reference to the global object (`window` in the browser, `global`
// on the server).
var root = this;

// The top-level namespace. All public Backbone classes and modules will
// be attached to this. Exported for both CommonJS and the browser.
var Media, server = false;
if (typeof exports !== 'undefined') {
    Media = exports;
    server = true;
    var uuid = require('node-uuid');
} else {
    Media = root.Media = {};
    var uuid = root.uuid;
}

// Require Underscore, Backbone & BackboneIO, if we're on the server, and it's not already present.
var _ = root._;
if (!_ && (typeof require !== 'undefined')) _ = require('underscore');

var BackboneIO = root.BackboneIO;
if ((typeof require !== 'undefined')) Backbone = require('backbone');

var leadingZero = function (num) {
    return (num < 10) ? "0"+num : num;
}

var toMilliseconds = function (time) {
    if (!time) {
        console.log ("No time");
        return 0;
    }

    var t = time.match(/(\d{2}):(\d{2}):(\d{2})\.(\d*)/);
    t.shift();
    d = moment.duration ({
        hours:        t[0],
        minutes:      t[1],
        seconds:      t[2],
        milliseconds: t[3]*10
    });

    return d.asMilliseconds();
};

var prettyTime =  function (m) {
    d = moment.duration(m);
    var p = leadingZero(d.hours())   + ':'
        + leadingZero(d.minutes()) + ':'
        + leadingZero(d.seconds()) + '.'
        + leadingZero(d.milliseconds()/10);
    return p;
};

var arrayDuration = function (a) {
    return  _.reduce(a, function (m, n) {
        return m + toMilliseconds (n);}, 0);
};

var Media = {};

Media.Transform = Backbone.RelationalModel.extend({
    urlRoot: 'transform',
    idAttribute: '_id',
    relations: [{
        type: Backbone.HasOne,
        key: 'piece',
        relatedModel:'Media.Piece',
        includeInJSON: '_id',
        reverseRelation: {
            key: 'transform',
            includeInJSON: '_id',
            type: Backbone.HasOne
        }
    },
    {
        type: Backbone.HasOne,
        key: 'playlist',
        relatedModel:'Media.Playlist',
        includeInJSON: '_id',
        reverseRelation: {
            key: 'transform',
            includeInJSON: '_id',
            type: Backbone.HasOne
        }
    },
    {
        type: Backbone.HasOne,
        key: 'occurrence',
        relatedModel:'Media.Occurrence',
        includeInJSON: '_id',
        reverseRelation: {
            key: 'transform',
            type: Backbone.HasOne
        }
    }],
    defaults: {
        trim: {
            timein:  0,
            timeout: 0,
        },
        overlay: [],
        starts: 0,
        ends: 0,
    },
});

Media.TransformCollection = Backbone.Collection.extend({
    model: Media.Transform,
    url: 'transform',
    backend: 'transformbackend',
    initialize: function () {
        if (!server) {
            this.bindBackend();
            this.bind('backend', function(method, model) {
                console.log ('got from backend:', method, model);
            });
        }
        console.log ('creating new Media.TransformCollection');
        Backbone.Collection.prototype.initialize.call (this);
    },
});

Media.Model = Backbone.RelationalModel.extend({
    urlRoot: 'media',
    idAttribute: '_id',
    initialize: function () {
        console.log ('creating new Media.Model');
    },

    validate: function (attrs) {
        console.log ("checking -> ", attrs);
        if (attrs.file && ! attrs.file.length) {
            console.log ('NO file');
            return new Error("file must be defined");
        }
        if (attrs.stat       &&
            (! attrs.stat.mtime ||
             ! attrs.stat.size  ||
             attrs.stat.size <= 4000)) {
            console.log ('NO or BAD stat');
            return new Error("stat must be defined");
        }
    },
    defaults: {
        _id: '',
        stat: {},
        file: "None",
        name: "",
        audio: "None",
        video: "None",
        template: 'mediaview',
        notes: ""
    }
});

Media.Collection = Backbone.Collection.extend({
    model: Media.Model,
    url: 'media',
    backend: 'mediabackend',
    initialize: function () {
        if (!server) {
            this.bindBackend();
            this.bind('backend', function(method, model) {
                console.log ('got from backend:', method, model);
            });
        }
        console.log ('creating new Media.Collection');
        Backbone.Collection.prototype.initialize.call (this);
    },
    pretty_duration: function () {
        return prettyTime(arrayDuration(this.pluck('durationraw')));
    },
});

Media.Piece = Backbone.RelationalModel.extend({
    urlRoot: 'piece',
    idAttribute: '_id',
    initialize: function () {
        console.log ('creating new Media.Piece');
    },
});

Media.PieceCollection = Backbone.Collection.extend({
    url: 'piece',
    model: Media.Piece,
    backend: 'piecebackend',
    initialize: function () {
        if (!server) {
            this.bindBackend();
            this.bind('backend', function(method, model) {
                console.log ('got from backend:', method, model);
            });
        }
        console.log ('creating new Media.PieceCollection');
        Backbone.Collection.prototype.initialize.call (this);
    },
});

Media.Playlist = Backbone.RelationalModel.extend({
  urlRoot: 'list',
  idAttribute: '_id',
  relations: [{
        type: Backbone.HasMany,
        key: 'pieces',
        relatedModel: 'Media.Piece',
        collectionType: 'Media.PieceCollection',
        includeInJSON: '_id',
        reverseRelation: {
            key: 'pl',
            includeInJSON: '_id',
            type: Backbone.HasOne
        }
    }],
    initialize: function () {
        var self = this;
        var pieces = this.get('pieces');

        pieces.bind('relational:change relational:add relational:reset relational:remove', function(){
            self.update_duration(pieces);
        }, this);

        console.log ('creating new Media.Playlist');
        Backbone.RelationalModel.prototype.initialize.call (this);
    },
    save: function(attributes, options) {
        //XXX We need Full relation Serialization toJSON
        // Check https://github.com/PaulUithol/Backbone-relational/pull/183

        if (typeof this.getRelation === 'function') {
            var instance_rel = this.getRelation('pieces');
            // change to just Serialize _id
            instance_rel.options.includeInJSON = '_id';
        }

        Backbone.Model.prototype.save.call(this, attributes, options);
    },
    update_duration: function (pieces) {
        this.set({duration : arrayDuration(pieces.pluck('durationraw'))});
    },
    pretty_duration: function () {
        return prettyTime (this.get('duration'));
    },
    defaults: {
        name: null,
        fixed: false,
        duration: 0,
        pos: 0,
    }
});

Media.Universe = Backbone.Collection.extend({
    url: 'list',
    model: Media.Playlist,
    backend: 'listbackend',
    initialize: function () {
        if (!server) {
            this.bindBackend();
            this.bind('backend', function(method, model) {
                console.log ('got from backend:', method, model);
            });
        }
        console.log ('creating new Media.Universe');
        Backbone.Collection.prototype.initialize.call (this);
    },
});

Media.Occurrence = Backbone.RelationalModel.extend({
    urlRoot: 'occur',
    idAttribute: '_id',
    relations: [{
        type: Backbone.HasOne,
        key: 'playlist',
        relatedModel: 'Media.Playlist',
        reverseRelation: {
            key: 'occurrences',
            collectionType: 'Media.Schedule',
            includeInJSON: '_id',
            type: Backbone.HasMany
        }
    }],
    initialize: function () {
        console.log ('creating new Media.Occurrence', this);
        this.overlapsWith = [];
    },

    getOverlappingEvents: function() {
        // Get all events that overlap with this one
        var self = this;
        return this.collection.filter(function(oc) {
            return (oc.get('_id') != self.get('_id') &&
                    oc.get('start') < self.get('end') &&
                    oc.get('end') > self.get('start'));
        });
    },
    validate: function(attrs, options) {
        // Do not validate when fetching from the server
        if (options.parse) return;
        // Only save model if it's not overlapping with anything
        var self = this;
        overlapping = this.getOverlappingEvents();
        if (overlapping.length) {
            overlapping.forEach(function(oc) {
                oc.overlapsWith.push(self);
            });
            this.collection.trigger('overlap', true);
            return overlapping
        } else {
            // When this event is no longer overlapping, the other events could be valid.
            //   validationError would be unset after this function returns, but I need if before
            //   I call checkOverlap. Could be improved.

            delete this.validationError;
            // Prevent infinite loops by first emptying the list
            var overlapsWith = _.clone(this.overlapsWith);
            this.overlapsWith = [];

            overlapsWith.forEach(function(oc) {
                oc.save();
            });

            if(this.collection) {
                this.collection.checkOverlap();
            }
        }
    },
    save: function(attributes, options) {
        //XXX We need Full relation Serialization toJSON
        // Check https://github.com/PaulUithol/Backbone-relational/pull/183
        var playlist = this.get('playlist');

        if (playlist && typeof playlist.getRelation === 'function') {
            var instance_rel = playlist.getRelation('pieces');
            // change to full Serialization
            instance_rel.options.includeInJSON = true;
        }

        Backbone.Model.prototype.save.call(this, attributes, options);
    },
    defaults: {
        event: null,
    },
});

Media.Schedule = Backbone.Collection.extend({
    url: 'occur',
    model: Media.Occurrence,
    backend: 'schedbackend',
    initialize: function () {
        if (!server) {
            this.bindBackend();
            this.bind('backend', function(method, model) {
                console.log ('got from backend:', method, model);
            });
        }
        this.on('add remove', this.checkOverlap);
        console.log ('creating new Media.Schedule');
        Backbone.Collection.prototype.initialize.call (this);
    },
    comparator: "start",
    getInvalid: function() {
        return this.filter(function(oc) {
            return oc.validationError
        });
    },
    checkOverlap: function() {
        var elems = this.getInvalid();
        this.trigger('overlap', elems.length);
    }
});

Media.Transform.setup();
Media.Model.setup();
Media.Piece.setup();
Media.Playlist.setup();
Media.Occurrence.setup();

if(server) module.exports = Media;
else root.Media = Media;
