mubsub = require('mubsub');
db = require('../db')();

exports = module.exports = function() {
    var client = mubsub(db);
    var channel = client.channel('messages', { size: 10000000, max: 5000 });
    return {
        channel: channel,
        subscribe: function(details, callback) {
            channel.subscribe(details, callback);
        },
        publish: function(msg) {
            channel.publish(msg);
        }
    }
};
