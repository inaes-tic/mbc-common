var redis = require('redis')

exports = module.exports = _.clone(redis);
exports.createJSONClient = function(port_arg, host_arg, options) {
    var redis_client = redis.createClient(port_arg, host_arg, options);
    redis_client.publishJSON = function(chan, obj) {
        return this.publish(chan, JSON.stringify(obj));
    }
    redis_client.on('message', function(chan, msg) {
        this.emit('messageJSON', chan, JSON.parse(msg));
    });
    return redis_client;
};
