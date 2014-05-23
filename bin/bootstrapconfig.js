#!/usr/bin/env node

var
_          = require('underscore'),
mbc        = require('../'),
backboneio = require('backbone.io'),
middleware = new mbc.iobackends().get_middleware(),
logger     = mbc.logger().addLogger('config_bootstrap_bin')
;

var backends   = {
    app: {
        use: [backboneio.middleware.configStore()],
        redis: true,
    },
};

var iobackends = new mbc.iobackends(undefined, backends);

var helper = new mbc.utils.bootstrapConfigHelper(backends.app);

helper.on('gotRedisAnswer', _.debounce(function() {
    logger.info('config updating from peers done, exiting now.');
    process.exit(0);
}, 1000, false));

helper.requestConfig();

_.delay(function() {
    logger.info('nobody answered, exiting now.');
    process.exit(1);
}, 10000);
