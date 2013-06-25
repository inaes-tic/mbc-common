var redis = require('redis')
var _ = require('underscore')

exports = module.exports = function(config) {
    var conf = config || require('config').Common.Redis;
    return exports.createJSONClient(conf);
}

exports.redis = _.clone(redis);

function parse(msg) {
    try {
        return JSON.parse(msg);
    } catch (e) {
        return undefined;
    }
}

exports.createJSONClient = function(conf) {
    var redis_client = this.redis.createClient(conf.port, conf.host);
    if (conf.password) {
        redis_client.auth(conf.password, function() {
            console.log('Redis client connected');
        });
    }

    redis_client.publishJSON = function(chan, obj) {
        return this.publish(chan, JSON.stringify(obj));
    }

    redis_client.on('message', function(channel, msg) {
        var obj = parse(msg);

        if( obj !== undefined ) {
            redis_client.emit('JSONmessage', channel, obj);
        }
    });

    redis_client.on('pmessage', function(pattern, channel, msg) {
        var obj = parse(msg);
        if( obj !== undefined ) {
            redis_client.emit('JSONpmessage', pattern, channel, obj);
        }
    });

    return redis_client;
};
