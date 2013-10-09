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
    var PageableCollection = require("backbone-pageable");
} else {
    Media = root.Media = {};
    var uuid = root.uuid;
    var PageableCollection = root.Backbone.PageableCollection;
}

// Require Underscore, Backbone & BackboneIO, if we're on the server, and it's not already present.
var _ = root._;
if (!_ && (typeof require !== 'undefined')) _ = require('underscore');

var Backbone = root.Backbone || false;
var BackboneIO = root.BackboneIO;
if ((typeof require !== 'undefined')){
    Backbone = require('backbone');
    Backbone.Memento = function() {};
}

// Require moment
var moment = root.moment || false;
if(typeof require !== 'undefined') {
    moment = require('moment');
}

if ((typeof require !== 'undefined')) require('backbone-relational');

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
    var d = moment.duration ({
        hours:        t[0],
        minutes:      t[1],
        seconds:      t[2],
        milliseconds: t[3]*10
    });

    return d.asMilliseconds();
};

var prettyTime =  function (m) {
    var d = moment.duration(m);
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

var Pageable = {
    state: {
        firstPage: 0,
        currentPage: 0,
        pageSize: 10,
        query: {}
    },
    queryParams: {
        query: function() { return this.state.query; },
    },
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
                        includeInJSON: '_id',
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

var TransformCollection = {
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
};

Media.TransformCollection = Backbone.Collection.extend(TransformCollection);
Media.TransformCollectionPageable = Backbone.PageableCollection.extend(_.extend(TransformCollection, Pageable));

Media.Model = Backbone.RelationalModel.extend({
    urlRoot: 'media',
    backend: 'mediabackend',
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
        checksum: "",
        durationraw: "",
        notes: ""
    }
});

var Collection = {
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
};

Media.Collection = Backbone.Collection.extend(Collection);
Media.CollectionPageable = Backbone.PageableCollection.extend(_.extend(Collection, Pageable));

Media.Piece = Media.Model.extend({
    urlRoot: 'piece',
    backend: 'piecebackend',
    idAttribute: '_id',
    initialize: function () {
        console.log ('creating new Media.Piece');
    },
});

var PieceCollection = {
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
};

Media.PieceCollection = Backbone.Collection.extend(PieceCollection);
Media.PieceCollectionPageable = Backbone.PageableCollection.extend(_.extend(PieceCollection, Pageable));

Media.Playlist = Backbone.RelationalModel.extend({
    urlRoot: 'list',
    backend: 'listbackend', // Makes HasOne relation from Media.Occurrence work.
    idAttribute: '_id',
    relations: [{
        type: Backbone.HasMany,
        key: 'pieces',
        relatedModel: 'Media.Piece',
        collectionType: 'Media.PieceCollection',
        includeInJSON: '_id',
    }],
    initialize: function () {
        var self = this;
        var pieces = this.get('pieces');

        pieces.bind('relational:change relational:add relational:reset relational:remove', function(){
            self.update_duration(self);
        }, this);

        console.log ('creating new Media.Playlist');
        Backbone.RelationalModel.prototype.initialize.call (this);
    },
    update_duration: _.debounce(function (self) {
        self.update_duration_nowait(self.get('pieces'));
    }, 100),
    update_duration_nowait: function(pieces) {
        pieces = pieces || this.get('pieces');
        var durations = pieces.pluck('durationraw');
        var total_duration = arrayDuration(durations);
        var all_ok = _.every(durations);
        console.log("UpdateDuration ~ durationraws:", durations, "total: ", total_duration, " all ok: ", all_ok);
        if (!all_ok) {
            return;
        }
        this.set("duration", total_duration);
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

var Universe = {
    url: 'list',
    model: Media.Playlist,
    backend: 'listbackend',
    comparator: '_id',
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
};

Media.Universe = Backbone.Collection.extend(Universe);
Media.UniversePageable = Backbone.PageableCollection.extend(_.extend(Universe, Pageable));

Media.Occurrence = Backbone.RelationalModel.extend({
    urlRoot: 'occur',
    idAttribute: '_id',
    relations: [{
        includeInJSON: '_id',
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
        return this.collection.getOverlappingEvents(this);
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

    defaults: {
        event: null,
    },
});

var Schedule = {
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

        this.start_memento();
        this.on('add remove', this.checkOverlap)

        Backbone.Collection.prototype.initialize.call (this);
    },
    start_memento: function() {
        this.memento = new Backbone.Memento(this);
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
    },
    getOverlappingEvents: function(oc) {
        // Get all events that overlap with this one
        return this.filter(function(elem) {
            return (elem.get('_id') != oc.get('_id') &&
                    elem.get('start') < oc.get('end') &&
                    elem.get('end') > oc.get('start'));
        });
    },
    simulateOverlap: function(occurrence, save) {
        var self = this;

        function pusherMapper(pusher) {
            return function(elem) {
                return {
                    pusher: pusher,
                    elem: elem,
                };
            };
        };

        // Processing queue
        var queue = self.getOverlappingEvents(occurrence).map(pusherMapper(occurrence));

        var target;
        while (target = queue.pop()) {
            // Adjust target time
            var duration = target.elem.get("end") - target.elem.get("start");
            target.elem.set({
                start: target.pusher.get("end"),
                end: target.pusher.get("end") + duration,
            });

            if (save) {
                target.elem.save();
            }

            // Check new overlaps and process them first
            var new_overlaps = self.getOverlappingEvents(target.elem).map(pusherMapper(target.elem));
            queue = queue.concat(new_overlaps);
        }
    },
};

Media.Schedule = Backbone.Collection.extend(Schedule);
Media.SchedulePageable = Backbone.PageableCollection.extend(_.extend(Schedule, Pageable));

Media.Transform.setup();
Media.Model.setup();
Media.Piece.setup();
Media.Playlist.setup();
Media.Occurrence.setup();

if(server) {
    module.exports = Media;
    Backbone.Relational.store.addModelScope({ "Media": Media });
}
else root.Media = Media;
