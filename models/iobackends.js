var _              = require('underscore'),
    uuid           = require('node-uuid'),
    backboneio     = require('backbone.io'),
    config         = require('config'),
    search_options = config.Search,
    collections    = config.Common.Collections,
    logger         = require("../logger")().addLogger('iobackends')
    publisher      = require('../pubsub')();
    iocompat       = require('./iocompat');
;

// Override mongoStore read method with custom
var searchWrapper = require('./searchWrapper.js');

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
        },

        /*
         * On the browser sometimes we need to set the '_id' of new objects so Backbone-relational
         * does not break (when we try to save new objects their relations end up pointing to 'undefined').
         *
         * On that case we need to turn the 'update' request into a 'create' for other browsers to add the
         * newly created objects.
         *
         * To signal this particular condition we add an '_tmpid' attribute to the model and catch that here.
         */
        tmpId: function (req, res, next) {
            if( req.method == 'update' && req.model._tmpid) {
                delete req.model._tmpid;
                req.method = 'create';
            }
            next();
        },

    };


    if(_.isUndefined(backends) || _.isEmpty(backends)) {
        logger.info("Backends are missing");
    }

    this.backends = backends;

    /* process the backends object to streamline code */
    var binded = [];
    _(this.backends).each (function (backend, name) {
        backend.io = backboneio.createBackend();
        if (backend.use) {
            _(backend.use).each (function (usefn) {
                backend.io.use(usefn);
            });
        }


        /* adds a debugging middleware before the storage (see below) */
        backend.io.use (self.middleware.debug);

        /*
         * adds the io compatibility layer middleware that forwards changes
         * from the browser as events so we can react and update our models.
         */
        backend.io.use (iocompat.eventMiddleware(backend));

        /*
         * adds the redis link layer middleware that listens for changes on
         * other servers and also broadcasts ours.
         */
        if (backend.redis) {
            backend.io.use (iocompat.redisMiddleware(backend, name, backend.redis.chain));
        }

        /*
         * On the backend definition we either pass a 'mongo' hash with the
         * connection details or a middleware that stores data.
         *
         * This is so because most of the storage middlewares end up doing
         * a res.end() stopping the processing there and sometimes we want
         * things like the debugbackend to work.
         */

        if (backend.store) {
            backend.io.use(backend.store);

        } else if (backend.mongo) {
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
    return iocompat.patchBackbone(this);
};
