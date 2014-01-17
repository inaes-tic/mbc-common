/*
 * Bring support for bindBackend() behaviour on the server
 * so models are synchronized between the server and browser.
 *
 * It can also use redis as transport to have consistency
 * among many servers and their browsers.
 */

var iocompat = module.exports = exports = {};

var _              = require('underscore'),
    uuid           = require('node-uuid'),
    logger         = require("../logger")().addLogger('io.compat')
    publisher      = require('../pubsub')(),
    listener       = require('../pubsub')();
;

/* XXX: copypasta from backbone.io/lib/browser.js */
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

/*
 * When we publish something it comes back also to our
 * listener, so we add a unike token to distinguish them.
 */
var _client_id = uuid.v4();

/*
 * redisMiddleware.
 * This middleware broadcasts and processes changes over Redis,
 * sending them thru io to the browser and also emmiting the
 * 'redis' and 'redis:[create|update|delete]' events to update
 * our models here in the server.
 */
iocompat.redisMiddleware = function (backend, name, chain) {
    var _chan = '_RedisSync.' + name;
    var io = backend.io;

   /*
    * Called when something arrives via redis.
    * If the origin is not from us (different _client_id)
    * we turn that into a fake request to io.
    */
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

        var event = {create: 'created', read: 'updated', update: 'updated', delete: 'deleted'};
        io.emit(event[req.method], req.model);
        io.emit('redis', req.method, req.model);
        io.emit('redis:'+req.method, req.model);
    };

    listener.subscribe(_chan);
    listener.on('JSONmessage', _onMessage);

   /*
    * The real middleware.
    * For methods other than 'read' we send them to redis.
    *
    * If this request came from redis normally we stop processing here, as
    * the data is already persisted (at the end of the chain we have something
    * that writes to a permanent storage, so if we do a 'read' it will give the
    * correct result, and we avoid saving the same multiple times and some races.
    * Unless we have something like a different mongo instance that is not in sync
    * with ours.)
    *
    * However, for storage backends like memoryStore we also need to save because
    * if we try to read from that it will return whatever it has and not the most
    * recent data.
    */
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

/*
 * eventMiddleware
 * This middleware forwards events from the browser so we can
 * keep our models here in sync, using bindBackend() as usual.
 *
 * For requests that came over redis we do nothing as the model
 * already listens for the 'redis' events, we just pass it along
 * the chain.
 *
 * Else, if the request came from the browser we emit a new pair
 * of events and keep churning.
 */
iocompat.eventMiddleware = function (backend) {
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
