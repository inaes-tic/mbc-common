exports = module.exports = {
    db: require('./db'),
    pubsub: require('./pubsub'),
    config: require('config'),
    logger: require('./logger'),
    iobackends: require('./models/iobackends'),
    utils: require('./utils'),
    avahi: require('./avahi')
}

var _      = require('underscore');
var config = exports.config;

var toHide = _.clone(config.Hidden);
_.each(toHide, function(key) {
    config.makeHidden(config, key);
});
