var redis = require('redis')
var _ = require('underscore')

exports = module.exports = _.clone(redis);

function parse(msg) {
    try {
        return JSON.parse(msg);
    } catch (e) {
        return undefined;
    }
}

exports.createJSONClient = function(port_arg, host_arg, options) {
    var redis_client = redis.createClient(port_arg, host_arg, options);
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
