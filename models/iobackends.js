var _              = require('underscore'),
    uuid           = require('node-uuid'),
    backboneio     = require('backbone.io'),
    config         = require('config'),
    search_options = config.Search,
    collections    = config.Common.Collections,
    logger         = require('../logger')().addLogger('iobackends')
;

// Override mongoStore read method with custom
var searchWrapper = require('./searchWrapper.js');

var iobackends = module.exports = exports = function (db, backends , publisher) {
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

    this.backends = backends || [];

    /* process the backends object to streamline code */
    var binded = [];
    _(this.backends).each (function (backend) {
        backend.io = backboneio.createBackend();
        if (backend.use) {
            _(backend.use).each (function (usefn) {
                if (!_.isFunction(usefn)) {
                    usefn = (self.middleware[usefn]) ? self.middleware[usefn] : backboneio.middleware[usefn]();
                }
                backend.io.use(usefn);
            });
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
        backend.io.use (self.middleware.debug);
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
    _.apply(this.backends[name].emit, args);
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

