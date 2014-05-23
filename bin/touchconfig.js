#!/usr/bin/env node

var
mbc     = require('../'),
logger  = mbc.logger().addLogger('config_touch_bin'),
moment  = require("moment"),
config  = require("config")
;

config.timestamp = (new moment()).unix()
setTimeout(function() {
    process.exit(0);
}, 1000);
