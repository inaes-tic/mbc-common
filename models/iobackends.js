var _              = require('underscore'),
    uuid           = require('node-uuid'),
    backboneio     = require('backbone.io'),
    Backbone       = require('backbone'),
    config         = require('config'),
    search_options = config.Search,
    collections    = config.Common.Collections,
    logger         = require("../logger")().addLogger('iobackends')
    publisher      = require('../pubsub')(),
    listener       = require('../pubsub')();
;

// Override mongoStore read method with custom
var searchWrapper = require('./searchWrapper.js');

// copypasta from backbone.io/lib/browser.js
function inherits(Parent, Child, mixins) {
    var Func = function() {};
    Func.prototype = Parent.prototype;

    mixins || (mixins = [])
    _.each(mixins, function(mixin) {
        _.extend(Func.prototype, mixin);
    });

    Child.prototype = new Func();
    Child.prototype.constructor = Child;

    return _.extend(Child, Parent);
};

// Stupid way to not process our own redis messages.
// When we publish something it comes back also to our
// listener, so we add a unike token to distinguish them.
var _client_id = uuid.v4();

// This middleware broadcasts and processes changes over Redis,
// sending them thru io to the browser and also emmiting the
// 'redis' and 'redis:[create|update|delete]' events to update
// our models here in the server.
function makeRedisMiddleware(backend, name, chain) {
    // smelly code, smelly code... It's not your fault...
    var _chan = '_RedisSync.' + name;
    logger.error('_chan: ', _chan);
    var io = backend.io;

    // Called when something arrives via redis.
    // If the origin is not from us (different _client_id)
    // we turn that into a fake request to io.
    function _onMessage(chan, msg) {
        if (chan != _chan) {
            return;
        }

        if (msg._redis_source == _client_id) {
            return;
        }

        var res = {end:function(){}, error:function(){}};
        var req = msg;

        io.handle (req, res, function(err, result) {
            if (err) {
                logger.error('RedisSync _onMessage: ', err, result);
            }
        });

        var event = {create: 'created', read: 'updated', update: 'updated', delete: 'removed'};
        io.emit(event[req.method], req.model);
        io.emit('redis', req.method, req.model);
        io.emit('redis:'+req.method, req.model);
    };

    listener.subscribe(_chan);
    listener.on('JSONmessage', _onMessage);

    // The real middleware.
    // For methods other than 'read' we send them to redis.
    //
    // If this request came from redis normally we stop processing here, as
    // the data is already persisted (at the end of the chain we have something
    // that writes to a permanent storage, so if we do a 'read' it will give the
    // correct result, and we avoid saving the same multiple times and some races.
    // Unless we have something like a different mongo instance that is not in sync
    // with ours.)
    //
    // However, for storage backends like memoryStore we also need to save because
    // if we try to read from that it will return whatever it has and not the most
    // recent data.
    function _middleware(req, res, next) {
        if (req._redis_source) {
            if (chain) {
                next();
            } else {
                res.end(req.model);
            }
            return;
        }
        if (req.method.match(/create|update|delete/)) {
            publisher.publishJSON(_chan, { model: req.model, method:req.method, _redis_source:_client_id});
        }
        next();
    };

    return _middleware;
};

// This middleware forwards events from the browser so we can
// keep our models here in sync, using bindBackend() as usual.
//
// For requests that came over redis we do nothing as the model
// already listens for the 'redis' events, we just pass it along
// the chain.
//
// Else, if the request came from the browser we emit a new pair
// of events and keep churning.
function makeEventMiddleware(backend) {
    var io = backend.io;
    function _middleware(req, res, next) {
        if (req._redis_source) {
            next();
            return;
        }
        if (req.method.match(/create|update|delete/)) {
            io.emit('browser', req.method, req.model);
            io.emit('browser:'+req.method, req.model);
        }
        next();
    };

    return _middleware;
};

var iobackends = module.exports = exports = function (db, backends) {
    var self = this;

    this.middleware = {
        debug: function (req, res, next) {
            logger.debug('Backend:', req.backend);
            logger.debug('Method: ', req.method);
            logger.debug('Channel:', req.channel);
            logger.debug('Options:', JSON.stringify(req.options));
            logger.debug('Model:  ', JSON.stringify(req.model));
            next();
        },

        uuid: function (req, res, next) {
            if( req.method == 'create' && req.model._id === undefined) {
                req.model._id = uuid.v1();
            }
            next();
        },

        publishJSON: function (req, res, next) {
            publisher.publishJSON([req.backend, req.method].join('.'), { model: req.model });
            next();
        }
    };


    if(_.isUndefined(backends) || _.isEmpty(backends)) {
        logger.info("Backends are missing");
    }

    this.backends = backends;

    /* process the backends object to streamline code */
    var binded = [];
    _(this.backends).each (function (backend, name) {
        backend.io = backboneio.createBackend();

        var head = [];
        var tail;

        // Ok, so this is the deal:
        //
        // Some middlewares like memoryStore, configStore and mongo do a res.end().
        // This is not bad as normally we put them on the end of the chain (and it
        // kind of make sense as they imply that the data is persisted somewhere and
        // we are done processing it).
        //
        // However, here by default we append debug and it is not called on those
        // cases.
        //
        // Also, sometimes we want to cut the processing and avoid hitting the
        // underlying storage and as such need to put something in between.
        // (Like, when we get an update from Redis and the other side already saved
        // to Mongo)
        // Thus, the splitting.
        if (backend.use) {
            tail = backend.use.pop();
            head = backend.use;
        }
        _(head).each (function (usefn) {
            backend.io.use(usefn);
        });

        backend.io.use (self.middleware.debug);

        if (backend.redisSync) {
            var _middleware = makeRedisMiddleware(backend, name, backend.redisChain);
            backend.io.use(_middleware);
        }

        // We need this so bindBackend() works on the server too.
        backend.io.use( makeEventMiddleware(backend) );

        if (tail) {
            backend.io.use(tail);
        }

        if (backend.mongo) {
            var mongo = _.extend ({db: db, opts: {}}, backend.mongo);
            var fn = _.identity;
            binded.push (backend.mongo.collection);

            if (_.has(mongo.opts, 'search'))
                fn = searchWrapper;
            backend.io.use(
                fn(backboneio.middleware.mongoStore(mongo.db,
                                                    mongo.collection,
                                                    mongo.opts)));
        }
    });

    logger.info ('binding to mongo collections:', binded.join(', ') + '.');
};

iobackends.prototype.register_sync = function (collection, name) {
    logger.info ('binding sync on', name);
    var backend = this.get(name).io;

    function backend_emit (method, model) {
        var event = {create: 'created', read: 'updated', update: 'updated', delete: 'removed'};

        logger.warn ('emmiting', method);
        backend.emit (event[method], model);
    };

    function backend_sync (method, model, options) {
        var success = options.success || function (item) {logger.info  ('info:'  + item)};
        var error   = options.error   || function (err)  {logger.error ('error:' + err )};

        var res = {end: success, error: error};
        var req = {method: method, model: model.toJSON(), options: options};

        backend.handle (req, res, function(err, result) {
            if (err)
                logger.error ('while sync: ' + err);
            else
                backend_emit (method, result || model.toJSON());
        });
    }

    collection.osync = backend_sync;

    if (collection.delayed)
        while (p = collection.delayed.pop()) {
            backend_sync.apply(p);
        }
};

iobackends.prototype.emit = function (name, args) {
    var backend = this.backends[name];
    if (backend) {
        var _io = backend.io;
        _io.emit.apply(_io, args);
    } else {
        logger.error('iobackends.emit() no such backend:', name);
    }
};

iobackends.prototype.get_ios = function () {
    var ret = {};
    var self = this;
    _(_.keys(this.backends)).each (function (backend) {
        ret[backend + 'backend'] = self.backends[backend].io;
    });
    return ret;
};

iobackends.prototype.get = function (name) {
    return this.backends[name];
};

iobackends.prototype.get_middleware = function () {
    return this.middleware;
};

// Here be dragons.
// This patches Backbone.sync, Backbone.Collection
// and Backbone.Model so sync() and bindBackend()
// work on the server.
iobackends.prototype.patchBackbone = function () {
    var _self = this;
    function buildBackend(collection) {
        var options = collection.backend;
        var name;
        if (typeof options === 'string') {
            name = options;
        } else {
            name = options.name;
        }
        name = name.replace(/backend$/,'');
        // may fail.
        var _io = _self.get(name).io;
        if (!_io) {
            logger.error('patchBackbone() no io backend found for: ', name);
        }
        _io.name = name;
        return _io
    };

    // Custom sync() implementation that proxies to the io stack.
    function _sync (method, model, options) {
        var collection = model.collection || model;
        var backend = collection.backend;

        var error   = options.error || function (err)  {logger.error ('error:' + err )};
        var res = {end: success, error: error};
        var req = {method: method, model: model.toJSON(), options: options};

        if (!backend) {
            logger.error('iobackends custom sync, missing backend');
            error(' missing backend');
            return
        }

        // The callback passed to backend.handle() is called
        // only if we reach the end of the chain and have errors
        // according to the code of backbone.io/lib/backend.js
        //
        // So we use the 'end' callback of the request.
        function success (_mdl) {
            // Oh sweet joy.
            // For collections here we get something like
            // [ {total_entries: N}, [array of models]]
            // or sometimes just
            // [array of models]
            if (_.isArray(_mdl)
                    && _mdl.length >=1
                    && _mdl[0].hasOwnProperty('total_entries')
                    && _.isArray(_mdl[1]) )
            {
                _mdl = _mdl[1];
            }

            if (method != 'read') {
                var event = {create: 'created', read: 'updated', update: 'updated', delete: 'removed'};

                logger.info ('emmiting', method);
                backend.emit (event[method], _mdl);
            }

            if (options.success) {
                options.success(_mdl);
            }
        };

        backend.handle (req, res, function(err, result) {
            logger.error ('while sync: ' + err);
        });
    };

    Backbone.sync = _sync;

    // The following block is mostly the same as backbone.io but
    // we use two different event names ('redis' and 'browser').
    //
    // For changes that came from redis the model/collection
    // emits a 'backend' and 'backend:[create|update|delete' event
    // and it behaves just like backbone.io.
    //
    // XXX:
    // For changes that came from the browser we use another prefix
    // but perhaps it would be better to not make that distinction.
    var CollectionMixins = {
        // Listen for backend notifications and update the
        // collection models accordingly.
        bindBackend: function() {
            var self = this;
            var idAttribute = this.model.prototype.idAttribute;

            //XXX: we are not using this but will be nice to have.
            //var event = self.backend.options.event;
            function _onMessage(event, method, model) {
                if (method == 'create') {
                    self.add(model);
                } else if (method == 'update') {
                    var item = self.get(model[idAttribute]);
                    if (item) {
                        item.set(model);
                    }
                } else if (method == 'delete') {
                    self.remove(model[idAttribute]);
                }

                self.trigger(event + ':' + method, model);
                self.trigger(event, method, model);
            };

            self.backend.on('redis', _.partial(_onMessage, 'backend'));
            self.backend.on('browser', _.partial(_onMessage, 'browser'));
        },
    };

    var ModelMixins = {
        bindBackend: function() {
            var self = this;
            var idAttribute = this.idAttribute;

            //XXX: we are not using this but will be nice to have.
            //var event = self.backend.options.event;
            function _onMessage(event, method, model) {
                if (method == 'create') {
                    self.save(model);
                } else if (method == 'update') {
                    self.set(model);
                } else if (method == 'delete') {
                    self.destroy();
                }

                self.trigger(event + ':' + method, model);
                self.trigger(event, method, model);
            };

            self.backend.on('redis', _.partial(_onMessage, 'backend'));
            self.backend.on('browser', _.partial(_onMessage, 'browser'));
        }
    };

    Backbone.Model = (function(Parent) {
        // Override the parent constructor
        var Child = function() {
            if (this.backend) {
                this.backend = buildBackend(this);
            }

            Parent.apply(this, arguments);
        };
        // Inherit everything else from the parent
        return inherits(Parent, Child, [ModelMixins]);
    })(Backbone.Model);

    Backbone.Collection = (function(Parent) {
        // Override the parent constructor
        var Child = function() {
            if (this.backend) {
                this.backend = buildBackend(this);
            }

            Parent.apply(this, arguments);
        };
        // Inherit everything else from the parent
        return inherits(Parent, Child, [CollectionMixins]);
    })(Backbone.Collection);
};

