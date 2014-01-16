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

// stupid way to not process our own redis messages.
var _client_id = uuid.v4();

function makeRedisMiddleware(backend, name, chain) {
    // smelly code, smelly code... It's not your fault...
    var _chan = '_RedisSync.' + name;
    logger.error('_chan: ', _chan);
    var io = backend.io;

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

// this forwards events from the browser so we can
// keep our models here in sync.
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
        // kind of make sense as they imply that the data is persisted somewhere).
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

iobackends.prototype.patchBackbone = function () {
    var _self = this;
// Here be dragons.
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

    function buildSync(model) {
        var backend = model.backend;

        return function (method, model, options) {
            var collection = model.collection || model;

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

            var error   = options.error   || function (err)  {logger.error ('error:' + err )};

            var res = {end: success, error: error};
            var req = {method: method, model: model.toJSON(), options: options};

            backend.handle (req, res, function(err, result) {
                logger.error ('while sync: ' + err);
            });

        };
    };


    var CollectionMixins = {
        // Listen for backend notifications and update the
        // collection models accordingly.
        bindBackend: function() {
            var self = this;
            var idAttribute = this.model.prototype.idAttribute;

            function _onMessage(method, model) {
                //XXX: we are not using this but will be nice to have.
                //var event = self.backend.options.event;
                var event = 'backend';

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

            self.backend.on('redis', _onMessage);
        },
    };

    var ModelMixins = {
        bindBackend: function() {
            var self = this;
            var idAttribute = this.idAttribute;

            function _onMessage(method, model) {
                //XXX: we are not using this but will be nice to have.
                //var event = self.backend.options.event;
                var event = 'backend';

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

            self.backend.on('redis', _onMessage);
        }
    };

    Backbone.Model = (function(Parent) {
        // Override the parent constructor
        var Child = function() {
            if (this.backend) {
                this.backend = buildBackend(this);
                this.sync = buildSync(this);
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
                this.sync = buildSync(this);
            }

            Parent.apply(this, arguments);
        };
        // Inherit everything else from the parent
        return inherits(Parent, Child, [CollectionMixins]);
    })(Backbone.Collection);
};

