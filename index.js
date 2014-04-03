exports = module.exports = {
    db: require('./db'),
    pubsub: require('./pubsub'),
    config: require('config'),
    logger: require('./logger'),
    iobackends: require('./models/iobackends'),
    utils: require('./utils'),
    avahi: require('./avahi'),
    views: require('./views')
}

var _      = require('underscore');
var config = exports.config;
var schema = config.getSchemaValidator();

var toHide = _.clone(config.Hidden);
_.each(toHide, function(key) {
    config.makeHidden(schema.properties, key);
});
