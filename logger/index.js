var winston = require('winston'),
    moment  = require('moment'),
    _ = require('underscore'),
    level   = process.env.LOG_LEVEL || 'debug';

// Logging levels
var customLevels = {
    levels: {
      debug: 0,
      info:  1,
      warn:  2,
      error: 3
    },
    colors: {
      debug: 'cyan',
      info:  'green',
      warn:  'yellow',
      error: 'red'
    }
};

var getTimestamp = function() {
    return moment().format('YYYY-MM-DD HH:mm:ss.SSS');
};

var general = new (winston.Logger)({
    transports: [
        new (winston.transports.File)({
            filename: './logs/general.log',
            handleExceptions: true,
            level: 'debug',
            timestamp: getTimestamp,
            json: false,
            maxsize: 10485760,
            maxFiles: 5
        })
    ],
    exitOnError: false
});

var logger = {
    addLogger: function(category) {
        winston.loggers.add(category, {
            transports: [
                new winston.transports.Console({
                    colorize: true,
                    level: level,
                    label: category,
                    timestamp: getTimestamp,
                }),
                new winston.transports.File({
                    filename: './logs/' + category + '.log',
                    level: 'debug',
                    timestamp: getTimestamp,
                    json: false,
                    maxsize: 10485760,
                    maxFiles: 5,
                })
            ],
        });
        winston.setLevels(customLevels.levels);
        winston.addColors(customLevels.colors);
        winston.loggers.get(category).exitOnError = false;
        return logger.getLogger(category);
    },
    getLogger: function(category) {
        var log = function(level) {
            var ret = function(message, metadata) {
                if (metadata) {
                    winston.loggers.get(category)[level](message, metadata);
                    general[level]("[" + category + "] " + message, metadata);
                } else {
                    winston.loggers.get(category)[level](message);
                    general[level]("[" + category + "] " + message);
                }
            };
            return ret;
        };

        var keys = _.keys(customLevels.levels);
        var tmp = _.object(keys, _.map(keys, function(key) { return log(key); }));
        return tmp;
    }
};

exports = module.exports = function() { return logger };
