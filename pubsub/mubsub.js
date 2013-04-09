mubsub = require('mubsub');
db = require('../db')();

exports = module.exports = {
    channel: function() {
        var client = mubsub(db);
        return client.channel('messages', { size: 10000000, max: 5000 });
    }
};
